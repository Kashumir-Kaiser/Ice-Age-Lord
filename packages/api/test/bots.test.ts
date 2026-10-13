import assert from 'node:assert/strict';
import test from 'node:test';
import { GameApplicationService } from '../src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';

test('clock commits private bot actions without exposing private bot events to player polling', async t => {
  let monotonicNow = 0;
  const repository = new SqliteRepository(':memory:');
  const service = new GameApplicationService(repository, undefined, {
    timersEnabled: false,
    monotonicNow: () => monotonicNow,
    leaseMs: 600_000,
  });
  t.after(() => repository.close());
  const { save } = service.createSave({ creationKey: 'bot-clock-events', slotName: 'Bot clock' });
  const driver = { sessionToken: 'bot-clock-session', driverId: 'bot-clock-tab' };
  await service.heartbeatClock(save.saveId, driver.sessionToken, driver.driverId);
  const start = repository.loadSave('local-owner', save.saveId).state;
  const started = await service.executeCommand(save.saveId, {
    schemaVersion: 1,
    saveId: save.saveId,
    commandId: 'start-bot-clock',
    expectedRevision: start.revision,
    type: 'set_clock_speed',
    payload: { speed: '5x' },
  }, driver);
  assert.equal(started.receipt.accepted, true);

  monotonicNow = 12_000;
  for (let attempt = 0; attempt < 100 && repository.loadSave('local-owner', save.saveId).state.simElapsedMs < 60_000; attempt += 1) {
    await service.settleClockBeforeCommand(save.saveId);
    await new Promise<void>(resolve => setImmediate(resolve));
  }
  const advanced = repository.loadSave('local-owner', save.saveId).state;
  assert.equal(advanced.simElapsedMs, 60_000);
  assert.ok(advanced.botPopulation!.chunks.some(chunk => chunk.cold.some(bot => bot.currentPlan !== null)));
  const playerEvents = repository.getPlayerEvents('local-owner', save.saveId, 0, 500).events as Array<{ type: string }>;
  assert.ok(playerEvents.length > 0);
  assert.equal(playerEvents.some(event => event.type.startsWith('bot_')), false);
  assert.equal(repository.exportBackup('local-owner', save.saveId).state.botPopulation?.chunkRootSha256, advanced.botPopulation?.chunkRootSha256);
});
