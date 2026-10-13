import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { GAME_STATE_SCHEMA_VERSION, type CommandEnvelope, type CommandEvent, type CommandReceipt, type GameState, type StoredCommandReceipt } from '../../contracts/src/index.ts';
import type { BackupEnvelope, CheckpointSummary, SaveSummary } from '../../contracts/src/api.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';
import { upgradeGameState } from '../../sim/src/upgrade.ts';
import { botChunkHash, botPopulationNeedsMigration, botPopulationRoot, botRowHash, verifyBotPopulation } from '../../sim/src/bots/state.ts';
import type { BotPopulationState, BotStateChunk } from '../../contracts/src/index.ts';

const ownerRow = 'local-owner';
const MAX_CHECKPOINTS_PER_SAVE = 50;

export type RepositoryFaultInjector = (phase: 'before_commit' | 'after_commit', transactionName: string) => void;

export class RepositoryError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'RepositoryError';
  }
}

export type LoadedSave = { state: GameState; summary: SaveSummary };
export type StoredEventInput = {
  event: CommandEvent;
  eventId: string;
  playerEvent: unknown;
  causalCommandId: string;
};
export type CommandCommit = {
  kind: 'committed' | 'replayed' | 'idempotency_conflict';
  receipt: CommandReceipt | null;
  state: GameState;
  summary: SaveSummary;
};

type SaveRow = {
  save_id: string;
  owner_id: string;
  slot_name: string;
  revision: number;
  event_sequence: number;
  state_json: string;
  state_sha256: string;
  world_package_id: string;
  content_version: string;
  ruleset_version: string;
  created_at_utc: string;
  updated_at_utc: string;
  parent_save_id: string | null;
  parent_checkpoint_id: string | null;
};

type CheckpointRow = {
  checkpoint_id: string;
  save_id: string;
  revision: number;
  event_sequence: number;
  label: string;
  state_json: string;
  state_sha256: string;
  created_at_utc: string;
};

type ReceiptRow = { command_id: string; request_sha256: string; receipt_json: string };

type SaveInsert = {
  ownerId: string;
  slotName: string;
  state: GameState;
  createdAtUtc?: string;
  updatedAtUtc?: string;
  parentSaveId?: string | null;
  parentCheckpointId?: string | null;
};

type BotChunkCacheEntry = { dataVersion: number; rootSha256: string; chunks: readonly BotStateChunk[] };

function freezeTree<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freezeTree(child);
    Object.freeze(value);
  }
  return value;
}

function utcNow(): string { return new Date().toISOString(); }

function aggregateForStorage(state: GameState): GameState {
  return { ...state, receipts: [] };
}

function serializedAggregate(state: GameState): { json: string; sha256: string } {
  const aggregate = aggregateForStorage(state);
  return { json: JSON.stringify(aggregate), sha256: canonicalStateHash(aggregate) };
}

function serializedSaveRow(state: GameState): { json: string; sha256: string } {
  const aggregate = aggregateForStorage(state);
  const compact = aggregate.botPopulation
    ? { ...aggregate, botPopulation: { ...aggregate.botPopulation, chunks: [] } }
    : aggregate;
  return { json: JSON.stringify(compact), sha256: canonicalStateHash(compact) };
}

function summaryFromRow(row: SaveRow): SaveSummary {
  return {
    saveId: row.save_id,
    slotName: row.slot_name,
    revision: row.revision,
    lastEventSequence: row.event_sequence,
    worldPackageId: row.world_package_id,
    contentVersion: row.content_version,
    rulesetVersion: row.ruleset_version,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
    forkedFrom: row.parent_save_id && row.parent_checkpoint_id
      ? { saveId: row.parent_save_id, checkpointId: row.parent_checkpoint_id }
      : null,
  };
}

function parseJson<T>(json: string, code: string): T {
  try { return JSON.parse(json) as T; }
  catch { throw new RepositoryError(code, 'Stored save data is malformed.', 500); }
}

export class SqliteRepository {
  private readonly db: DatabaseSync;
  readonly databasePath: string;
  private readonly faultInjector?: RepositoryFaultInjector;
  private readonly botChunkCache = new Map<string, BotChunkCacheEntry>();

  constructor(databasePath: string, faultInjector?: RepositoryFaultInjector) {
    this.databasePath = databasePath;
    this.faultInjector = faultInjector;
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new DatabaseSync(databasePath);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    this.db.exec('PRAGMA synchronous = FULL;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.applyMigrations();
    this.migratePersistedGameStates();
  }

  close(): void {
    this.botChunkCache.clear();
    this.db.close();
  }

  /** Releases the immutable read cache before a long private clock catch-up builds its working population. */
  releaseBotPopulationCache(saveId: string): void {
    this.botChunkCache.delete(saveId);
  }

  private currentDataVersion(): number {
    return Number((this.db.prepare('PRAGMA data_version').get() as { data_version: number }).data_version);
  }

  private rememberCommittedState(value: unknown): void {
    if (!value || typeof value !== 'object' || !('state' in value)) return;
    const state = (value as { state?: GameState }).state;
    const population = state?.botPopulation;
    if (!state || !population || population.chunks.length !== Math.ceil(population.botCount / population.chunkSize)) {
      if (state?.saveId) this.botChunkCache.delete(state.saveId);
      return;
    }
    for (const chunk of population.chunks) freezeTree(chunk);
    this.botChunkCache.set(state.saveId, {
      dataVersion: this.currentDataVersion(), rootSha256: population.chunkRootSha256, chunks: population.chunks,
    });
  }

  private applyMigrations(): void {
    this.db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      filename TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      applied_at_utc TEXT NOT NULL
    ) STRICT;`);
    const migrationDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
    const filenames = readdirSync(migrationDirectory).filter(file => /^\d+_.+\.sql$/.test(file)).sort();
    const knownRows = this.db.prepare('SELECT version, filename, sha256 FROM schema_migrations ORDER BY version').all() as Array<{ version: number; filename: string; sha256: string }>;
    const known = new Map(knownRows.map(row => [row.version, row]));
    const availableVersions = new Set<number>();

    for (const filename of filenames) {
      const version = Number(filename.slice(0, filename.indexOf('_')));
      availableVersions.add(version);
      const sql = readFileSync(join(migrationDirectory, filename), 'utf8');
      const sha256 = canonicalStateHash(sql);
      const applied = known.get(version);
      if (applied) {
        if (applied.filename !== filename || applied.sha256 !== sha256) {
          throw new RepositoryError('MIGRATION_CHECKSUM_MISMATCH', `Applied migration ${filename} changed after it was recorded.`, 500);
        }
        continue;
      }
      this.transaction(`migration-${version}`, () => {
        this.db.exec(sql);
        this.db.prepare('INSERT INTO schema_migrations(version, filename, sha256, applied_at_utc) VALUES (?, ?, ?, ?)')
          .run(version, filename, sha256, utcNow());
      });
    }

    for (const row of knownRows) {
      if (!availableVersions.has(row.version)) throw new RepositoryError('MIGRATION_MISSING', `Applied migration ${row.filename} is no longer available.`, 500);
    }
  }

  /** Materialize state-schema upgrades once without touching the committed event, receipt, or checkpoint ledgers. */
  private migratePersistedGameStates(): void {
    const rows = this.db.prepare('SELECT save_id, revision, event_sequence, world_package_id, content_version, ruleset_version, state_json, state_sha256 FROM saves ORDER BY save_id').all() as Array<{
      save_id: string; revision: number; event_sequence: number; world_package_id: string; content_version: string;
      ruleset_version: string; state_json: string; state_sha256: string;
    }>;
    const pending = rows.filter(row => {
      const state = parseJson<Record<string, unknown>>(row.state_json, 'SAVE_STATE_CORRUPT');
      if (canonicalStateHash(state) !== row.state_sha256) throw new RepositoryError('SAVE_CHECKSUM_MISMATCH', 'The stored save checksum does not match.', 500);
      return (state.schemaVersion !== undefined && state.schemaVersion !== GAME_STATE_SCHEMA_VERSION)
        || botPopulationNeedsMigration(state.botPopulation as BotPopulationState | null | undefined);
    });
    if (!pending.length) return;
    this.transaction('game-state-schema-upgrade', () => {
      const update = this.db.prepare(`UPDATE saves SET content_version = ?, ruleset_version = ?, state_json = ?, state_sha256 = ?
        WHERE save_id = ? AND revision = ? AND event_sequence = ? AND state_sha256 = ?`);
      for (const row of pending) {
        const storedAggregate = parseJson<GameState>(row.state_json, 'SAVE_STATE_CORRUPT');
        const materialized = storedAggregate.botPopulation
          ? this.materializeBotPopulation(row.save_id, storedAggregate).state
          : storedAggregate;
        const state = upgradeGameState(materialized);
        if (state.saveId !== row.save_id || state.revision !== row.revision || state.lastEventSequence !== row.event_sequence
          || state.worldPackageId !== row.world_package_id) throw new RepositoryError('SAVE_INDEX_MISMATCH', 'The save index changed during schema migration.', 500);
        const storedRow = serializedSaveRow(state);
        const result = update.run(state.contentVersion, state.rulesetVersion, storedRow.json, storedRow.sha256,
          row.save_id, row.revision, row.event_sequence, row.state_sha256);
        if (result.changes !== 1) throw new RepositoryError('SAVE_INDEX_MISMATCH', 'The save changed during schema migration.', 500);
        this.persistBotPopulationChunks(state.saveId, state.botPopulation ?? null);
      }
    });
  }

  private transaction<T>(name: string, body: () => T): T {
    this.db.exec('BEGIN IMMEDIATE;');
    let committed = false;
    try {
      const result = body();
      this.faultInjector?.('before_commit', name);
      this.db.exec('COMMIT;');
      committed = true;
      this.faultInjector?.('after_commit', name);
      this.rememberCommittedState(result);
      return result;
    } catch (error) {
      if (!committed) {
        try { this.db.exec('ROLLBACK;'); } catch { /* SQLite may already have rolled back a failed transaction. */ }
      }
      throw error;
    }
  }

  private readTransaction<T>(body: () => T): T {
    this.db.exec('BEGIN;');
    let committed = false;
    try {
      const result = body();
      this.db.exec('COMMIT;');
      committed = true;
      return result;
    } catch (error) {
      if (!committed) {
        try { this.db.exec('ROLLBACK;'); } catch { /* SQLite may already have rolled back a failed read. */ }
      }
      throw error;
    }
  }

  private rowForSave(saveId: string, ownerId: string): SaveRow | undefined {
    return this.db.prepare('SELECT * FROM saves WHERE save_id = ? AND owner_id = ?').get(saveId, ownerId) as SaveRow | undefined;
  }

  private persistBotPopulationChunks(saveId: string, population: BotPopulationState | null): void {
    if (!population) {
      this.db.prepare('DELETE FROM bot_population_chunks WHERE save_id = ?').run(saveId);
      return;
    }
    const existingRows = this.db.prepare('SELECT chunk_index, chunk_sha256 FROM bot_population_chunks WHERE save_id = ?').all(saveId) as Array<{ chunk_index: number; chunk_sha256: string }>;
    const existing = new Map(existingRows.map(row => [row.chunk_index, row.chunk_sha256]));
    const upsert = this.db.prepare(`INSERT INTO bot_population_chunks(save_id, chunk_index, first_ordinal, bot_count, chunk_sha256, chunk_json)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(save_id, chunk_index) DO UPDATE SET
        first_ordinal = excluded.first_ordinal, bot_count = excluded.bot_count,
        chunk_sha256 = excluded.chunk_sha256, chunk_json = excluded.chunk_json`);
    const kept = new Set<number>();
    for (const chunk of population.chunks) {
      kept.add(chunk.index);
      if (existing.get(chunk.index) === chunk.chunkSha256) continue;
      if (chunk.chunkSha256 !== botChunkHash(chunk)) throw new RepositoryError('BOT_CHUNK_CHECKSUM_MISMATCH', 'A bot chunk failed its checksum before persistence.', 500);
      upsert.run(saveId, chunk.index, chunk.firstOrdinal, chunk.count, chunk.chunkSha256, JSON.stringify(chunk));
    }
    for (const index of existing.keys()) if (!kept.has(index)) this.db.prepare('DELETE FROM bot_population_chunks WHERE save_id = ? AND chunk_index = ?').run(saveId, index);
  }

  private materializeBotPopulation(saveId: string, state: GameState): { state: GameState; cacheHit: boolean } {
    const population = state.botPopulation;
    if (!population || population.chunks.length > 0) return { state, cacheHit: false };
    const cached = this.botChunkCache.get(saveId);
    if (cached && cached.dataVersion === this.currentDataVersion() && cached.rootSha256 === population.chunkRootSha256
      && cached.chunks.length === Math.ceil(population.botCount / population.chunkSize)) {
      return { state: { ...state, botPopulation: { ...population, chunks: cached.chunks.slice() } }, cacheHit: true };
    }
    const rows = this.db.prepare('SELECT chunk_index, first_ordinal, bot_count, chunk_sha256, chunk_json FROM bot_population_chunks WHERE save_id = ? ORDER BY chunk_index').all(saveId) as Array<{
      chunk_index: number; first_ordinal: number; bot_count: number; chunk_sha256: string; chunk_json: string;
    }>;
    if (rows.length !== Math.ceil(population.botCount / population.chunkSize)) throw new RepositoryError('BOT_POPULATION_CHUNKS_MISSING', 'The durable bot population is incomplete.', 500);
    const chunks = rows.map((row, index) => {
      const chunk = parseJson<BotStateChunk>(row.chunk_json, 'BOT_CHUNK_CORRUPT');
      if (row.chunk_index !== index || row.chunk_index !== chunk.index || row.first_ordinal !== chunk.firstOrdinal
        || row.bot_count !== chunk.count || row.chunk_sha256 !== chunk.chunkSha256 || botChunkHash(chunk) !== row.chunk_sha256) {
        throw new RepositoryError('BOT_CHUNK_CHECKSUM_MISMATCH', 'A durable bot chunk failed its checksum.', 500);
      }
      if (chunk.rowSha256.length !== chunk.count || chunk.rowSha256.some((hash, offset) => hash !== botRowHash(chunk, offset))) {
        throw new RepositoryError('BOT_ROW_CHECKSUM_MISMATCH', 'A durable bot row failed its checksum.', 500);
      }
      return chunk;
    });
    return { state: { ...state, botPopulation: { ...population, chunks } }, cacheHit: false };
  }

  private getStateFromRow(row: SaveRow): GameState {
    const storedAggregate = parseJson<unknown>(row.state_json, 'SAVE_STATE_CORRUPT');
    if (canonicalStateHash(storedAggregate) !== row.state_sha256) throw new RepositoryError('SAVE_CHECKSUM_MISMATCH', 'The stored save checksum does not match.', 500);
    const materialized = this.materializeBotPopulation(row.save_id, storedAggregate as GameState);
    const state = materialized.state;
    let aggregate: GameState;
    try { aggregate = upgradeGameState(state); }
    catch { throw new RepositoryError('SAVE_STATE_SCHEMA_UNSUPPORTED', 'The stored save schema cannot be migrated safely.', 500); }
    if (aggregate.botPopulation && !materialized.cacheHit) {
      try { verifyBotPopulation(aggregate.botPopulation); }
      catch { throw new RepositoryError('BOT_POPULATION_CORRUPT', 'The durable bot population failed its manifest, scheduler, or row validation.', 500); }
    }
    if (aggregate.saveId !== row.save_id || aggregate.revision !== row.revision || aggregate.lastEventSequence !== row.event_sequence
      || aggregate.worldPackageId !== row.world_package_id || aggregate.contentVersion !== row.content_version || aggregate.rulesetVersion !== row.ruleset_version) {
      throw new RepositoryError('SAVE_INDEX_MISMATCH', 'Save index metadata does not match the aggregate.', 500);
    }
    const receipts = this.db.prepare('SELECT command_id, request_sha256, receipt_json FROM command_receipts WHERE save_id = ? ORDER BY receipt_sequence').all(row.save_id) as ReceiptRow[];
    return {
      ...aggregate,
      receipts: receipts.map(record => ({
        commandId: record.command_id,
        requestSha256: record.request_sha256,
        receipt: parseJson<CommandReceipt>(record.receipt_json, 'RECEIPT_CORRUPT'),
      } satisfies StoredCommandReceipt)),
    };
  }

  private insertSave(input: SaveInsert): void {
    const now = utcNow();
    const createdAtUtc = input.createdAtUtc ?? now;
    const updatedAtUtc = input.updatedAtUtc ?? createdAtUtc;
    const stored = serializedSaveRow(input.state);
    try {
      this.db.prepare(`INSERT INTO saves(
        save_id, owner_id, slot_name, revision, event_sequence, state_json, state_sha256,
        world_package_id, content_version, ruleset_version, created_at_utc, updated_at_utc,
        parent_save_id, parent_checkpoint_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        input.state.saveId,
        input.ownerId,
        input.slotName,
        input.state.revision,
        input.state.lastEventSequence,
        stored.json,
        stored.sha256,
        input.state.worldPackageId,
        input.state.contentVersion,
        input.state.rulesetVersion,
        createdAtUtc,
        updatedAtUtc,
        input.parentSaveId ?? null,
        input.parentCheckpointId ?? null,
      );
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed: saves.owner_id, saves.slot_name')) {
        throw new RepositoryError('SLOT_CONFLICT', 'A save slot with that name already exists.');
      }
      if (String(error).includes('UNIQUE constraint failed: saves.save_id')) throw new RepositoryError('SAVE_ID_EXISTS', 'A save with that ID already exists.');
      throw error;
    }
    this.persistBotPopulationChunks(input.state.saveId, input.state.botPopulation ?? null);
  }

  createSaveIdempotent(input: {
    ownerId: string;
    creationKey: string;
    requestSha256: string;
    slotName: string;
    makeState: () => GameState;
  }): { created: boolean; saveId: string; state: GameState; summary: SaveSummary } {
    return this.transaction('create-save', () => {
      const existing = this.db.prepare('SELECT request_sha256, save_id FROM creation_requests WHERE owner_id = ? AND creation_key = ?')
        .get(input.ownerId, input.creationKey) as { request_sha256: string; save_id: string } | undefined;
      if (existing) {
        if (existing.request_sha256 !== input.requestSha256) throw new RepositoryError('CREATION_KEY_REUSED', 'A creation key cannot be reused with different input.');
        const row = this.rowForSave(existing.save_id, input.ownerId);
        if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save could not be loaded.', 500);
        return { created: false, saveId: existing.save_id, state: this.getStateFromRow(row), summary: summaryFromRow(row) };
      }

      const state = input.makeState();
      this.insertSave({ ownerId: input.ownerId, slotName: input.slotName, state });
      const row = this.rowForSave(state.saveId, input.ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The new save could not be loaded.', 500);
      this.db.prepare('INSERT INTO creation_requests(owner_id, creation_key, request_sha256, save_id, response_json, created_at_utc) VALUES (?, ?, ?, ?, ?, ?)')
        .run(input.ownerId, input.creationKey, input.requestSha256, state.saveId, JSON.stringify({ saveId: state.saveId }), utcNow());
      return { created: true, saveId: state.saveId, state: this.getStateFromRow(row), summary: summaryFromRow(row) };
    });
  }

  loadSave(ownerId: string, saveId: string): LoadedSave {
    return this.readTransaction(() => {
      const row = this.rowForSave(saveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      return { state: this.getStateFromRow(row), summary: summaryFromRow(row) };
    });
  }

  getSaveRevision(ownerId: string, saveId: string): number {
    const row = this.db.prepare('SELECT revision FROM saves WHERE save_id = ? AND owner_id = ?').get(saveId, ownerId) as { revision: number } | undefined;
    if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
    return row.revision;
  }

  listSaves(ownerId: string): SaveSummary[] {
    const rows = this.db.prepare('SELECT * FROM saves WHERE owner_id = ? ORDER BY updated_at_utc DESC, save_id').all(ownerId) as SaveRow[];
    return rows.map(summaryFromRow);
  }

  commitCommand(input: {
    ownerId: string;
    saveId: string;
    command: CommandEnvelope;
    requestSha256: string;
    reduce: (state: GameState) => { state: GameState; events: readonly CommandEvent[]; receipt: CommandReceipt };
    projectPlayerEvent: (event: CommandEvent, eventId: string, state: GameState) => unknown;
  }): CommandCommit {
    return this.transaction('command', () => {
      const row = this.rowForSave(input.saveId, input.ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const prior = this.db.prepare('SELECT request_sha256, receipt_json FROM command_receipts WHERE save_id = ? AND command_id = ?')
        .get(input.saveId, input.command.commandId) as { request_sha256: string; receipt_json: string } | undefined;
      const state = this.getStateFromRow(row);
      if (prior) {
        if (prior.request_sha256 !== input.requestSha256) return { kind: 'idempotency_conflict', receipt: null, state, summary: summaryFromRow(row) };
        return { kind: 'replayed', receipt: parseJson<CommandReceipt>(prior.receipt_json, 'RECEIPT_CORRUPT'), state, summary: summaryFromRow(row) };
      }

      const reduction = input.reduce(state);
      const receiptStored = reduction.state.receipts.find(record => record.commandId === input.command.commandId);
      if (!receiptStored || receiptStored.requestSha256 !== input.requestSha256 || reduction.receipt.commandId !== input.command.commandId) {
        throw new RepositoryError('REDUCER_RECEIPT_INVALID', 'The command reducer returned an inconsistent receipt.', 500);
      }
      const receiptJson = JSON.stringify(reduction.receipt);
      this.db.prepare('INSERT INTO command_receipts(save_id, command_id, request_sha256, receipt_json, created_at_utc) VALUES (?, ?, ?, ?, ?)')
        .run(input.saveId, input.command.commandId, input.requestSha256, receiptJson, utcNow());

      if (reduction.events.length > 0) {
        if (!reduction.receipt.accepted || reduction.state.revision !== state.revision + 1
          || reduction.state.lastEventSequence !== state.lastEventSequence + reduction.events.length) {
          throw new RepositoryError('REDUCER_STATE_TRANSITION_INVALID', 'The command reducer returned an invalid state transition.', 500);
        }
        const stored = serializedSaveRow(reduction.state);
        const updated = this.db.prepare(`UPDATE saves SET revision = ?, event_sequence = ?, state_json = ?, state_sha256 = ?, updated_at_utc = ?
          WHERE save_id = ? AND owner_id = ? AND revision = ?`).run(
          reduction.state.revision,
          reduction.state.lastEventSequence,
          stored.json,
          stored.sha256,
          utcNow(),
          input.saveId,
          input.ownerId,
          state.revision,
        );
        if (Number(updated.changes) !== 1) throw new RepositoryError('STALE_REVISION', 'The save changed before this command could commit.');
        this.persistBotPopulationChunks(input.saveId, reduction.state.botPopulation ?? null);

        let expectedEventSequence = state.lastEventSequence + 1;
        for (const event of reduction.events) {
          if (event.sequence !== expectedEventSequence) throw new RepositoryError('EVENT_SEQUENCE_INVALID', 'Event sequences must increase by one.', 500);
          const eventId = `${input.saveId}:event:${String(event.sequence).padStart(12, '0')}`;
          const playerEvent = input.projectPlayerEvent(event, eventId, reduction.state);
          this.db.prepare(`INSERT INTO domain_events(
            save_id, event_sequence, event_id, occurred_at_elapsed_ms, causal_command_id,
            payload_schema_version, ruleset_version, content_version, event_type, payload_json, player_event_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            input.saveId,
            event.sequence,
            eventId,
            event.occurredAtElapsedMs,
            input.command.commandId,
            1,
            reduction.state.rulesetVersion,
            reduction.state.contentVersion,
            event.type,
            JSON.stringify(event.payload),
            JSON.stringify(playerEvent),
          );
          expectedEventSequence += 1;
        }
      } else if (reduction.state.revision !== state.revision || reduction.state.lastEventSequence !== state.lastEventSequence) {
        throw new RepositoryError('REDUCER_NOOP_MUTATED_STATE', 'A command without events cannot change domain revision.', 500);
      }

      const freshRow = this.rowForSave(input.saveId, input.ownerId);
      if (!freshRow) throw new RepositoryError('SAVE_NOT_FOUND', 'The save could not be reloaded.', 500);
      return { kind: 'committed', receipt: reduction.receipt, state: this.getStateFromRow(freshRow), summary: summaryFromRow(freshRow) };
    });
  }

  commitSystemTransition(input: {
    ownerId: string;
    saveId: string;
    transition: (state: GameState) => { state: GameState; events: readonly CommandEvent[] };
    projectPlayerEvent: (event: CommandEvent, eventId: string, state: GameState) => unknown;
  }): { state: GameState; summary: SaveSummary } {
    return this.transaction('system-transition', () => {
      const row = this.rowForSave(input.saveId, input.ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const state = this.getStateFromRow(row);
      const transition = input.transition(state);
      if (transition.events.length === 0) {
        if (canonicalStateHash(transition.state) !== canonicalStateHash(state)) {
          throw new RepositoryError('SYSTEM_TRANSITION_WITHOUT_EVENT', 'A system transition that changes state must append an event.', 500);
        }
        return { state, summary: summaryFromRow(row) };
      }

      if (transition.state.saveId !== state.saveId || transition.state.revision !== state.revision
        || transition.state.lastEventSequence !== state.lastEventSequence) {
        throw new RepositoryError('SYSTEM_TRANSITION_STATE_INVALID', 'A system transition may not assign revisions or event sequences.', 500);
      }
      let expectedSequence = state.lastEventSequence + 1;
      const receipts = transition.events.map((event, index) => {
        if (event.sequence !== expectedSequence) throw new RepositoryError('EVENT_SEQUENCE_INVALID', 'System event sequences must increase by one.', 500);
        const commandId = `SYSTEM:${input.saveId}:${String(event.sequence).padStart(12, '0')}`;
        const requestSha256 = canonicalStateHash({ saveId: input.saveId, event });
        const receipt = {
          commandId,
          accepted: true,
          revision: state.revision + index + 1,
          eventSequence: event.sequence,
          code: 'SYSTEM_TRANSITION_COMMITTED',
          message: 'An authoritative simulation transition was committed.',
        } satisfies CommandReceipt;
        expectedSequence += 1;
        return { commandId, requestSha256, receipt };
      });
      const nextState: GameState = {
        ...transition.state,
        revision: state.revision + transition.events.length,
        lastEventSequence: state.lastEventSequence + transition.events.length,
        receipts: [...state.receipts, ...receipts],
      };
      for (const record of receipts) {
        this.db.prepare('INSERT INTO command_receipts(save_id, command_id, request_sha256, receipt_json, created_at_utc) VALUES (?, ?, ?, ?, ?)')
          .run(input.saveId, record.commandId, record.requestSha256, JSON.stringify(record.receipt), utcNow());
      }
      const stored = serializedSaveRow(nextState);
      const updated = this.db.prepare(`UPDATE saves SET revision = ?, event_sequence = ?, state_json = ?, state_sha256 = ?, updated_at_utc = ?
        WHERE save_id = ? AND owner_id = ? AND revision = ?`).run(
        nextState.revision,
        nextState.lastEventSequence,
        stored.json,
        stored.sha256,
        utcNow(),
        input.saveId,
        input.ownerId,
        state.revision,
      );
      if (Number(updated.changes) !== 1) throw new RepositoryError('STALE_REVISION', 'The save changed before the system transition could commit.');
      this.persistBotPopulationChunks(input.saveId, nextState.botPopulation ?? null);

      for (const [index, event] of transition.events.entries()) {
        const eventId = `${input.saveId}:event:${String(event.sequence).padStart(12, '0')}`;
        const playerEvent = input.projectPlayerEvent(event, eventId, nextState);
        this.db.prepare(`INSERT INTO domain_events(
          save_id, event_sequence, event_id, occurred_at_elapsed_ms, causal_command_id,
          payload_schema_version, ruleset_version, content_version, event_type, payload_json, player_event_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          input.saveId,
          event.sequence,
          eventId,
          event.occurredAtElapsedMs,
          receipts[index].commandId,
          1,
          nextState.rulesetVersion,
          nextState.contentVersion,
          event.type,
          JSON.stringify(event.payload),
          JSON.stringify(playerEvent),
        );
      }
      const freshRow = this.rowForSave(input.saveId, input.ownerId);
      if (!freshRow) throw new RepositoryError('SAVE_NOT_FOUND', 'The save could not be reloaded.', 500);
      return { state: this.getStateFromRow(freshRow), summary: summaryFromRow(freshRow) };
    });
  }

  getCommandReceipt(ownerId: string, saveId: string, commandId: string): { requestSha256: string; receipt: CommandReceipt; currentRevision: number } {
    return this.readTransaction(() => {
      const row = this.rowForSave(saveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const record = this.db.prepare('SELECT request_sha256, receipt_json FROM command_receipts WHERE save_id = ? AND command_id = ?')
        .get(saveId, commandId) as { request_sha256: string; receipt_json: string } | undefined;
      if (!record) throw new RepositoryError('RECEIPT_NOT_FOUND', 'The command result was not found.', 404);
      return { requestSha256: record.request_sha256, receipt: parseJson(record.receipt_json, 'RECEIPT_CORRUPT'), currentRevision: row.revision };
    });
  }

  getPlayerEvents(ownerId: string, saveId: string, afterSequence: number, limit: number): { events: unknown[]; currentSequence: number } {
    return this.readTransaction(() => {
      const row = this.rowForSave(saveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const rows = this.db.prepare(`SELECT player_event_json FROM domain_events
        WHERE save_id = ? AND event_sequence > ? ORDER BY event_sequence LIMIT ?`).all(saveId, afterSequence, limit + 1) as Array<{ player_event_json: string }>;
      return { events: rows.map(item => parseJson(item.player_event_json, 'PLAYER_EVENT_CORRUPT')), currentSequence: row.event_sequence };
    });
  }

  createCheckpoint(ownerId: string, saveId: string, label: string): CheckpointSummary {
    return this.transaction('checkpoint', () => {
      const row = this.rowForSave(saveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const count = this.db.prepare('SELECT COUNT(*) AS count FROM checkpoints WHERE save_id = ?').get(saveId) as { count: number };
      if (count.count >= MAX_CHECKPOINTS_PER_SAVE) throw new RepositoryError('CHECKPOINT_LIMIT_REACHED', 'This save already has the maximum number of checkpoints.');
      const state = this.getStateFromRow(row);
      const stored = serializedAggregate(state);
      const checkpointId = randomUUID();
      const createdAtUtc = utcNow();
      this.db.prepare(`INSERT INTO checkpoints(checkpoint_id, save_id, revision, event_sequence, label, state_json, state_sha256, created_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(checkpointId, saveId, state.revision, state.lastEventSequence, label, stored.json, stored.sha256, createdAtUtc);
      return { checkpointId, saveId, revision: state.revision, eventSequence: state.lastEventSequence, label, createdAtUtc, stateSha256: stored.sha256 };
    });
  }

  listCheckpoints(ownerId: string, saveId: string): CheckpointSummary[] {
    return this.readTransaction(() => {
      if (!this.rowForSave(saveId, ownerId)) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const rows = this.db.prepare('SELECT checkpoint_id, save_id, revision, event_sequence, label, state_sha256, created_at_utc FROM checkpoints WHERE save_id = ? ORDER BY created_at_utc DESC, checkpoint_id')
        .all(saveId) as Array<Omit<CheckpointRow, 'state_json'>>;
      return rows.map(row => ({ checkpointId: row.checkpoint_id, saveId: row.save_id, revision: row.revision, eventSequence: row.event_sequence, label: row.label, createdAtUtc: row.created_at_utc, stateSha256: row.state_sha256 }));
    });
  }

  forkCheckpoint(ownerId: string, saveId: string, checkpointId: string, slotName: string, newSaveId: string): LoadedSave {
    return this.transaction('checkpoint-fork', () => {
      const source = this.rowForSave(saveId, ownerId);
      if (!source) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
      const checkpoint = this.db.prepare('SELECT * FROM checkpoints WHERE checkpoint_id = ? AND save_id = ?').get(checkpointId, saveId) as CheckpointRow | undefined;
      if (!checkpoint) throw new RepositoryError('CHECKPOINT_NOT_FOUND', 'The checkpoint was not found.', 404);
      const storedState = parseJson<unknown>(checkpoint.state_json, 'CHECKPOINT_CORRUPT');
      if (canonicalStateHash(storedState) !== checkpoint.state_sha256) {
        throw new RepositoryError('CHECKPOINT_CHECKSUM_MISMATCH', 'The checkpoint checksum does not match.', 500);
      }
      const state = upgradeGameState(storedState);
      if (state.saveId !== saveId || state.revision !== checkpoint.revision || state.lastEventSequence !== checkpoint.event_sequence) {
        throw new RepositoryError('CHECKPOINT_CHECKSUM_MISMATCH', 'The checkpoint checksum does not match.', 500);
      }
      const fork: GameState = { ...state, saveId: newSaveId, revision: 0, lastEventSequence: 0, receipts: [] };
      this.insertSave({ ownerId, slotName, state: fork, parentSaveId: saveId, parentCheckpointId: checkpointId });
      const row = this.rowForSave(newSaveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The fork could not be loaded.', 500);
      return { state: this.getStateFromRow(row), summary: summaryFromRow(row) };
    });
  }

  exportBackup(ownerId: string, saveId: string): BackupEnvelope {
    return this.readTransaction(() => {
    const row = this.rowForSave(saveId, ownerId);
    if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The save was not found.', 404);
    const state = this.getStateFromRow(row);
    if (state.saveId !== row.save_id || state.revision !== row.revision
      || state.lastEventSequence !== row.event_sequence || state.worldPackageId !== row.world_package_id
      || state.contentVersion !== row.content_version || state.rulesetVersion !== row.ruleset_version) {
      throw new RepositoryError('SAVE_CHECKSUM_MISMATCH', 'The stored save checksum or index does not match.', 500);
    }
    const receipts = this.db.prepare('SELECT command_id, request_sha256, receipt_json, created_at_utc FROM command_receipts WHERE save_id = ? ORDER BY receipt_sequence')
      .all(saveId) as Array<{ command_id: string; request_sha256: string; receipt_json: string; created_at_utc: string }>;
    const events = this.db.prepare(`SELECT event_sequence, event_id, occurred_at_elapsed_ms, causal_command_id,
      payload_schema_version, ruleset_version, content_version, event_type, payload_json, player_event_json
      FROM domain_events WHERE save_id = ? ORDER BY event_sequence`).all(saveId) as Array<Record<string, unknown>>;
    const checkpoints = this.db.prepare(`SELECT checkpoint_id, revision, event_sequence, label, state_json, state_sha256, created_at_utc
      FROM checkpoints WHERE save_id = ? ORDER BY created_at_utc, checkpoint_id`).all(saveId) as Array<Record<string, unknown>>;
    return {
      format: 'ICE-AGE-LORD-SAVE-BACKUP',
      version: 1,
      exportedAtUtc: utcNow(),
      save: summaryFromRow(row),
      state: aggregateForStorage(state),
      stateSha256: canonicalStateHash(aggregateForStorage(state)),
      receipts: receipts.map(item => ({ commandId: item.command_id, requestSha256: item.request_sha256, receipt: parseJson(item.receipt_json, 'RECEIPT_CORRUPT'), createdAtUtc: item.created_at_utc })),
      events: events.map(item => ({
        eventSequence: item.event_sequence,
        eventId: item.event_id,
        occurredAtElapsedMs: item.occurred_at_elapsed_ms,
        causalCommandId: item.causal_command_id,
        payloadSchemaVersion: item.payload_schema_version,
        rulesetVersion: item.ruleset_version,
        contentVersion: item.content_version,
        eventType: item.event_type,
        payload: parseJson(String(item.payload_json), 'EVENT_CORRUPT'),
        playerEvent: parseJson(String(item.player_event_json), 'PLAYER_EVENT_CORRUPT'),
      })),
      checkpoints: checkpoints.map(item => ({
        checkpointId: item.checkpoint_id,
        saveId,
        revision: item.revision,
        eventSequence: item.event_sequence,
        label: item.label,
        state: parseJson(String(item.state_json), 'CHECKPOINT_CORRUPT'),
        stateSha256: item.state_sha256,
        createdAtUtc: item.created_at_utc,
      })),
    };
    });
  }

  importBackup(ownerId: string, slotName: string, backup: BackupEnvelope): LoadedSave {
    return this.transaction('backup-import', () => {
      const state = backup.state as GameState;
      const summary = backup.save;
      this.insertSave({
        ownerId,
        slotName,
        state,
        createdAtUtc: summary.createdAtUtc,
        updatedAtUtc: summary.updatedAtUtc,
        parentSaveId: summary.forkedFrom?.saveId ?? null,
        parentCheckpointId: summary.forkedFrom?.checkpointId ?? null,
      });

      for (const item of backup.receipts as Array<{ commandId: string; requestSha256: string; receipt: CommandReceipt; createdAtUtc: string }>) {
        this.db.prepare('INSERT INTO command_receipts(save_id, command_id, request_sha256, receipt_json, created_at_utc) VALUES (?, ?, ?, ?, ?)')
          .run(state.saveId, item.commandId, item.requestSha256, JSON.stringify(item.receipt), item.createdAtUtc);
      }
      for (const item of backup.events as Array<{
        eventSequence: number; eventId: string; occurredAtElapsedMs: number; causalCommandId: string;
        payloadSchemaVersion: number; rulesetVersion: string; contentVersion: string; eventType: string; payload: unknown; playerEvent: unknown;
      }>) {
        this.db.prepare(`INSERT INTO domain_events(
          save_id, event_sequence, event_id, occurred_at_elapsed_ms, causal_command_id,
          payload_schema_version, ruleset_version, content_version, event_type, payload_json, player_event_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          state.saveId, item.eventSequence, item.eventId, item.occurredAtElapsedMs, item.causalCommandId,
          item.payloadSchemaVersion, item.rulesetVersion, item.contentVersion, item.eventType,
          JSON.stringify(item.payload), JSON.stringify(item.playerEvent),
        );
      }
      for (const item of backup.checkpoints as Array<{
        checkpointId: string; revision: number; eventSequence: number; label: string; state: GameState; stateSha256: string; createdAtUtc: string;
      }>) {
        const stored = serializedAggregate(item.state);
        if (stored.sha256 !== item.stateSha256 || item.state.saveId !== state.saveId) throw new RepositoryError('BACKUP_INVALID', 'A checkpoint in the backup failed its checksum.', 400);
        this.db.prepare(`INSERT INTO checkpoints(checkpoint_id, save_id, revision, event_sequence, label, state_json, state_sha256, created_at_utc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(item.checkpointId, state.saveId, item.revision, item.eventSequence, item.label, stored.json, stored.sha256, item.createdAtUtc);
      }

      const row = this.rowForSave(state.saveId, ownerId);
      if (!row) throw new RepositoryError('SAVE_NOT_FOUND', 'The imported save could not be loaded.', 500);
      return { state: this.getStateFromRow(row), summary: summaryFromRow(row) };
    });
  }
}
