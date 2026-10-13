import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { BotColdRecord, BotPopulationState, BotStateChunk, GameState } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { advanceTo } from '../../sim/src/time.ts';
import { generateBotPopulation } from '../../sim/src/bots/generation.ts';
import { BOT_MICRO, BOT_PLANNER_RULE_VERSION, BOT_SIMULATION_RULE_VERSION, botChunkHash, botPopulationRoot, botRowHash, verifyBotPopulation } from '../../sim/src/bots/state.ts';
import { SqliteRepository } from '../src/repository.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';

const REPLAY_TARGET_MS = 10 * 60_000;
const OWNER_ID = 'local-owner';

function fixturePopulation(): BotPopulationState {
  const generated = generateBotPopulation('compact-bot-replay-fixture', world, {
    botCount: 16,
    mapRadiusKm: world.activeMapRadiusKm,
    profile: 'BENCHMARK_STRESS',
  });
  const source = generated.chunks[0]!;
  const offset = 9;
  const bot = source.cold[offset]!;
  const plan = {
    goal: 'survive' as const,
    action: 'gather_food' as const,
    actionId: `${bot.botId}:ACT:00000001`,
    startedAtElapsedMs: 0,
    completesAtElapsedMs: 60_000,
    targetId: null,
    workersAssigned: 1,
    reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
    startingResourcesMicro: {
      food: source.foodMicro[offset]!, wood: source.woodMicro[offset]!,
      stone: source.stoneMicro[offset]!, ore: source.oreMicro[offset]!,
    },
    expectedOutcome: 'complete the forced short fixture gathering plan',
  };
  const workforce = { gatherFood: 1, gatherWood: 0, gatherStone: 0, gatherOre: 0, farmers: 0, millWorkers: 0,
    quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards: 0, recruiters: 0 };
  const cold = source.cold.slice();
  cold[offset] = { ...bot, currentPlan: plan, nextActionOrdinal: 1, workforce } as BotColdRecord;
  const rowSha256 = source.rowSha256.slice();
  const workKind = source.workKind.slice();
  const assignedWorkers = source.assignedWorkers.slice();
  const workRequired = source.workRequired.slice();
  workKind[offset] = 1;
  assignedWorkers[offset] = 1;
  workRequired[offset] = 1;
  const unhashed = { ...source, cold, rowSha256, workKind, assignedWorkers, workRequired, chunkSha256: '' } as BotStateChunk;
  rowSha256[offset] = botRowHash(unhashed, offset);
  const chunk = { ...unhashed, rowSha256, chunkSha256: '' } as BotStateChunk;
  const finishedChunk = { ...chunk, chunkSha256: botChunkHash(chunk) };
  const chunks = [finishedChunk];
  const population = { ...generated, chunks, chunkRootSha256: botPopulationRoot(chunks) };
  verifyBotPopulation(population);
  return population;
}

function advanceBy(input: GameState, durationMs: number): GameState {
  const target = Math.min(REPLAY_TARGET_MS, input.simElapsedMs + durationMs);
  const result = advanceTo(input, target, { maxBoundaries: 10_000 }, world);
  assert.equal(result.caughtUp, true, `advance should reach ${target}ms`);
  return result.state;
}

function replay(input: GameState, intervalMs: number | readonly number[]): GameState {
  let state = structuredClone(input);
  let intervalIndex = 0;
  while (state.simElapsedMs < REPLAY_TARGET_MS) {
    const interval = typeof intervalMs === 'number' ? intervalMs : intervalMs[intervalIndex++ % intervalMs.length]!;
    state = advanceBy(state, interval);
  }
  return state;
}

function persistTransition(repository: SqliteRepository, saveId: string, state: GameState): GameState {
  const committed = repository.commitSystemTransition({
    ownerId: OWNER_ID,
    saveId,
    transition: current => ({
      state,
      events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: state.simElapsedMs,
        sequence: current.lastEventSequence + 1, payload: { policy: 'compact_bot_replay_reload' } }],
    }),
    projectPlayerEvent: (event, eventId) => ({ sequence: event.sequence, eventId, type: 'system', category: 'time',
      title: 'Replay fixture saved', text: 'A compact deterministic replay checkpoint was saved.' }),
  });
  return committed.state;
}

test('16-bot replay is equivalent across caller intervals and a SQLite save/reload', t => {
  const directory = mkdtempSync(join(tmpdir(), 'ill-bot-replay-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new SqliteRepository(join(directory, 'replay.sqlite'));
  t.after(() => repository.close());
  const service = new GameApplicationService(repository, undefined, { timersEnabled: false });
  const created = service.createSave({ creationKey: 'compact-bot-replay', slotName: 'Replay fixture' });
  const saveId = created.save.saveId;
  const initialPopulation = fixturePopulation();
  repository.commitSystemTransition({
    ownerId: OWNER_ID,
    saveId,
    transition: state => ({
      state: { ...state, botPopulation: initialPopulation },
      events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: state.simElapsedMs,
        sequence: state.lastEventSequence + 1, payload: { policy: 'compact_bot_replay_fixture' } }],
    }),
    projectPlayerEvent: (event, eventId) => ({ sequence: event.sequence, eventId, type: 'system', category: 'time',
      title: 'Replay fixture loaded', text: 'A compact, valid generated population was installed for replay verification.' }),
  });
  const reloadedStart = repository.loadSave(OWNER_ID, saveId).state;
  verifyBotPopulation(reloadedStart.botPopulation!);

  const oneShot = advanceTo(structuredClone(reloadedStart), REPLAY_TARGET_MS, { maxBoundaries: 10_000 }, world);
  assert.equal(oneShot.caughtUp, true);
  const threeSecond = replay(reloadedStart, 3_000);
  const fiveSecond = (() => {
    let state = structuredClone(reloadedStart);
    while (state.simElapsedMs < REPLAY_TARGET_MS / 2) state = advanceBy(state, 5_000);
    state = persistTransition(repository, saveId, state);
    state = repository.loadSave(OWNER_ID, saveId).state;
    while (state.simElapsedMs < REPLAY_TARGET_MS) state = advanceBy(state, 5_000);
    return state;
  })();
  const irregular = replay(reloadedStart, [1_000, 7_000, 13_000, 2_000, 29_000, 5_000, 17_000]);

  for (const result of [oneShot.state, threeSecond, fiveSecond, irregular]) {
    verifyBotPopulation(result.botPopulation!);
    assert.equal(result.simElapsedMs, REPLAY_TARGET_MS);
    assert.ok(result.botPopulation!.completedActionCount > 0, 'the forced short gather plan must cross a real action boundary');
    assert.equal(result.botPopulation!.chunks[0]!.cold[9]!.actionReceipts.at(-1)?.action, 'gather_food');
  }
  const expectedHash = canonicalStateHash(oneShot.state.botPopulation);
  assert.equal(canonicalStateHash(threeSecond.botPopulation), expectedHash, '3-second caller replay');
  assert.equal(canonicalStateHash(fiveSecond.botPopulation), expectedHash, '5-second replay across SQLite reload');
  assert.equal(canonicalStateHash(irregular.botPopulation), expectedHash, 'irregular caller replay');
});

test('SQLite startup migrates an old zero-unit route without changing the save revision', t => {
  const directory = mkdtempSync(join(tmpdir(), 'ill-bot-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const databasePath = join(directory, 'migration.sqlite');
  let repository: SqliteRepository | null = new SqliteRepository(databasePath);
  t.after(() => repository?.close());
  const service = new GameApplicationService(repository, undefined, { timersEnabled: false });
  const created = service.createSave({ creationKey: 'legacy-bot-route-migration', slotName: 'Legacy route' });
  const saveId = created.save.saveId;
  const population = fixturePopulation();
  const installed = repository.commitSystemTransition({
    ownerId: OWNER_ID,
    saveId,
    transition: state => ({
      state: { ...state, botPopulation: population },
      events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: state.simElapsedMs,
        sequence: state.lastEventSequence + 1, payload: { policy: 'legacy_route_migration_fixture' } }],
    }),
    projectPlayerEvent: (event, eventId) => ({ sequence: event.sequence, eventId, type: 'system', category: 'time',
      title: 'Legacy route fixture installed', text: 'A generated bot population was saved before simulating the legacy record.' }),
  });
  const originalRevision = installed.state.revision;
  const source = population.chunks[0]!;
  const bot = source.cold[0]!;
  const actionOrdinal = bot.nextActionOrdinal + 1;
  const actionId = `${bot.botId}:ACT:${String(actionOrdinal).padStart(8, '0')}`;
  const contact = bot.searchSources.find(item => item.contactTargetId) ?? {
    id: 'migration-contact', kind: 'survey_site' as const, position: bot.position, remainingActions: 1,
    eligibleBlueprintIds: [], discovered: false, contactTargetId: 'RC-003',
  };
  const cold = source.cold.slice();
  cold[0] = { ...bot,
    ...(bot.searchSources.some(item => item.contactTargetId) ? {} : { searchSources: [...bot.searchSources, contact] }),
    currentPlan: { goal: 'scout', action: 'scout', actionId, startedAtElapsedMs: 0, completesAtElapsedMs: 3_600_000,
      targetId: contact.id, workersAssigned: 0, reserved: { food: 3, wood: 0, stone: 0, ore: 0 },
      startingResourcesMicro: { food: source.foodMicro[0]!, wood: source.woodMicro[0]!, stone: source.stoneMicro[0]!, ore: source.oreMicro[0]! },
      expectedOutcome: 'cancel an impossible legacy scout assignment' },
    nextActionOrdinal: actionOrdinal,
    workforce: { ...bot.workforce, scouts: 0 },
    armyMovement: { orderId: actionId, targetId: contact.contactTargetId ?? contact.id, unitKind: 'scout', unitCount: 0,
      from: bot.position, to: contact.position, startedAtElapsedMs: 0, arrivesAtElapsedMs: 3_600_000, status: 'outbound' },
  } as BotColdRecord;
  const reservedFoodMicro = source.reservedFoodMicro.slice();
  const reservedWoodMicro = source.reservedWoodMicro.slice();
  const reservedStoneMicro = source.reservedStoneMicro.slice();
  const reservedOreMicro = source.reservedOreMicro.slice();
  reservedFoodMicro[0] = 3 * BOT_MICRO;
  reservedWoodMicro[0] = reservedStoneMicro[0] = reservedOreMicro[0] = 0;
  const rowSha256 = source.rowSha256.slice();
  const unhashed = { ...source, cold, reservedFoodMicro, reservedWoodMicro, reservedStoneMicro, reservedOreMicro,
    rowSha256, chunkSha256: '' } as BotStateChunk;
  rowSha256[0] = botRowHash(unhashed, 0);
  const withRows = { ...unhashed, rowSha256 } as BotStateChunk;
  const legacyChunk = { ...withRows, chunkSha256: botChunkHash(withRows) };
  const chunks = population.chunks.slice();
  chunks[0] = legacyChunk;
  const legacyPopulation: BotPopulationState = {
    ...population,
    rulesVersion: 'BOT-AUTHORITATIVE-SIM-1.5',
    plannerRuleVersion: 'BOT-UTILITY-GOAP-1.2',
    chunks,
    chunkRootSha256: botPopulationRoot(chunks),
  };

  repository.close();
  repository = null;
  const direct = new DatabaseSync(databasePath);
  try {
    const row = direct.prepare('SELECT state_json FROM saves WHERE save_id = ?').get(saveId) as { state_json: string };
    const stored = JSON.parse(row.state_json) as GameState;
    const compactLegacy = { ...legacyPopulation, chunks: [] };
    const changedState = { ...stored, botPopulation: compactLegacy };
    direct.prepare('UPDATE saves SET state_json = ?, state_sha256 = ? WHERE save_id = ?')
      .run(JSON.stringify(changedState), canonicalStateHash(changedState), saveId);
    direct.prepare(`UPDATE bot_population_chunks SET first_ordinal = ?, bot_count = ?, chunk_sha256 = ?, chunk_json = ?
      WHERE save_id = ? AND chunk_index = 0`).run(legacyChunk.firstOrdinal, legacyChunk.count, legacyChunk.chunkSha256, JSON.stringify(legacyChunk), saveId);
  } finally { direct.close(); }

  repository = new SqliteRepository(databasePath);
  const migrated = repository.loadSave(OWNER_ID, saveId).state;
  verifyBotPopulation(migrated.botPopulation!);
  assert.equal(migrated.revision, originalRevision, 'startup migration must preserve save revision and event history');
  assert.equal(migrated.botPopulation!.rulesVersion, BOT_SIMULATION_RULE_VERSION);
  assert.equal(migrated.botPopulation!.plannerRuleVersion, BOT_PLANNER_RULE_VERSION);
  assert.equal(migrated.botPopulation!.chunks[0]!.cold[0]!.armyMovement, null);
  assert.equal(migrated.botPopulation!.chunks[0]!.cold[0]!.currentPlan, null);
  assert.equal(migrated.botPopulation!.chunks[0]!.reservedFoodMicro[0], 0);
  assert.deepEqual(migrated.botPopulation!.chunks[0]!.cold[0]!.blueprintIds, bot.blueprintIds);
});
