import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { appendBotActionReceipt, botActionReceiptCount, botChunkHash, botPopulationRoot, botRowHash, BOT_HUNT_RULE_VERSION, verifyBotPopulation } from '../../sim/src/bots/state.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { SqliteRepository } from '../src/repository.ts';
import type { BotActionReceipt } from '../../contracts/src/index.ts';

test('bot chunks round-trip through save, checkpoint, fork and backup, and corruption is rejected', t => {
  const directory = mkdtempSync(join(tmpdir(), 'ill-bot-chunks-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const databasePath = join(directory, 'bot-chunks.sqlite');
  const repository = new SqliteRepository(databasePath);
  t.after(() => repository.close());
  const service = new GameApplicationService(repository, undefined, { timersEnabled: false });
  const created = service.createSave({ creationKey: 'bot-chunk-roundtrip', slotName: 'Bots' });
  const saveId = created.save.saveId;
  let loaded = repository.loadSave('local-owner', saveId).state;
  assert.ok(loaded.botPopulation);
  verifyBotPopulation(loaded.botPopulation);
  const sourcePopulation = loaded.botPopulation;
  const sourceChunk = sourcePopulation.chunks[0]!;
  let cold = sourceChunk.cold[0]!;
  for (let index = 1; index <= 300; index += 1) {
    const action = index % 2 === 0 ? 'search' : 'hunt';
    const receipt: BotActionReceipt = {
      actionId: `${cold.botId}:ACTION:${String(index).padStart(6, '0')}`, botId: cold.botId, action,
      targetId: null, occurredAtElapsedMs: 0, result: 'completed',
      resourceDelta: { food: 0, wood: 0, stone: 0, ore: 0 }, baseXpAwarded: index,
      talentXpMultiplierPermille: 2_000, xpAwarded: index * 2, casualties: 0,
      ruleVersion: action === 'hunt' ? BOT_HUNT_RULE_VERSION : 'BOT-ACTION-XP-1.5', drawIndex: 0,
    };
    cold = appendBotActionReceipt(cold, receipt);
  }
  const coldRows = [...sourceChunk.cold];
  coldRows[0] = cold;
  let changedChunk = { ...sourceChunk, cold: coldRows, rowSha256: [...sourceChunk.rowSha256], chunkSha256: '' };
  changedChunk.rowSha256[0] = botRowHash(changedChunk, 0);
  changedChunk = { ...changedChunk, chunkSha256: botChunkHash(changedChunk) };
  const chunks = [...sourcePopulation.chunks];
  chunks[0] = changedChunk;
  const archivePopulation = { ...sourcePopulation, chunks, chunkRootSha256: botPopulationRoot(chunks) };
  const committed = repository.commitSystemTransition({
    ownerId: 'local-owner', saveId,
    transition: state => ({
      state: { ...state, botPopulation: archivePopulation },
      events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: state.simElapsedMs, payload: { policy: 'pause_on_restart' }, sequence: state.lastEventSequence + 1 }],
    }),
    projectPlayerEvent: (event, eventId) => ({
      sequence: event.sequence, eventId, type: 'system', category: 'time', title: 'Clock pause persisted', text: 'Clock state retained.',
    }),
  });
  loaded = committed.state;
  assert.equal(botActionReceiptCount(loaded.botPopulation!.chunks[0]!.cold[0]!), 300);
  const root = loaded.botPopulation!.chunkRootSha256;

  const checkpoint = repository.createCheckpoint('local-owner', saveId, 'Bot population checkpoint');
  const fork = repository.forkCheckpoint('local-owner', saveId, checkpoint.checkpointId, 'Bot fork', 'bot-fork-save');
  assert.equal(fork.state.botPopulation?.chunkRootSha256, root);
  verifyBotPopulation(fork.state.botPopulation!);
  const backup = repository.exportBackup('local-owner', saveId);
  assert.equal(backup.state.botPopulation?.chunkRootSha256, root);
  const imported = service.importBackup(backup, 'Bot import');
  const importedState = repository.loadSave('local-owner', imported.save.saveId).state;
  assert.equal(importedState.botPopulation?.chunkRootSha256, root);
  verifyBotPopulation(importedState.botPopulation!);

  const direct = new DatabaseSync(databasePath);
  try {
    const row = direct.prepare('SELECT chunk_json FROM bot_population_chunks WHERE save_id = ? AND chunk_index = 0').get(saveId) as { chunk_json: string };
    const chunk = JSON.parse(row.chunk_json) as { foodMicro: number[] };
    chunk.foodMicro[0] += 1;
    direct.prepare('UPDATE bot_population_chunks SET chunk_json = ? WHERE save_id = ? AND chunk_index = 0').run(JSON.stringify(chunk), saveId);
  } finally { direct.close(); }
  assert.throws(() => repository.loadSave('local-owner', saveId), error => (error as { code?: string }).code === 'BOT_ROW_CHECKSUM_MISMATCH');
});
