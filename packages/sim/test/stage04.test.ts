import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { createNewGame } from '../src/initializer.ts';
import { reduceCommand } from '../src/reducer.ts';
import {
  advanceTo,
  DAY_MS,
  elapsedMsToWorldClock,
  enqueueTombJob,
  FIRE_WOOD_CONSUMPTION_MS,
  HOUR_MS,
  MINUTE_MS,
  resizeTombCapacity,
  selectedSpeed,
  TOMB_STANDARD_BLUEPRINT_ID,
  TOMB_STANDARD_DURATION_MS,
} from '../src/time.ts';
import { canonicalStateHash } from '../src/hash.ts';

const world = ACTIVE_WORLD_PACKAGE;
let freshCounter = 0;

function freshState() {
  freshCounter += 1;
  const state = createNewGame({
    saveId: `stage04-save-${freshCounter}`,
    campaignId: `stage04-campaign-${freshCounter}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `stage04-seed-${freshCounter}`,
  }, world);
  return {
    ...state,
    revision: 1,
    lastEventSequence: 1,
    territory: {
      ...state.territory,
      survivalFire: { ...state.territory.survivalFire, protectionStatus: 'active' as const },
    },
    calendar: state.calendar.map(event => event.id === 'EV00-SAFE-FIRE'
      ? { ...event, status: 'active' as const, openReceiptSequence: 1 }
      : event),
  };
}

function command(state: ReturnType<typeof freshState>, commandId: string, type: string, payload: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    saveId: state.saveId,
    commandId,
    expectedRevision: state.revision,
    type,
    payload,
  };
}

test('world clock keeps T0 at day 1 07:00 and converts midnight, sunset, twilight and dawn', () => {
  assert.deepEqual(elapsedMsToWorldClock(0), { day: 1, hour: 7, minute: 0, lightPhase: 'daylight' });
  assert.deepEqual(elapsedMsToWorldClock(9.5 * HOUR_MS), { day: 1, hour: 16, minute: 30, lightPhase: 'twilight' });
  assert.deepEqual(elapsedMsToWorldClock(10 * HOUR_MS), { day: 1, hour: 17, minute: 0, lightPhase: 'night' });
  assert.deepEqual(elapsedMsToWorldClock(17 * HOUR_MS), { day: 2, hour: 0, minute: 0, lightPhase: 'night' });
  assert.deepEqual(elapsedMsToWorldClock(24 * HOUR_MS), { day: 2, hour: 7, minute: 0, lightPhase: 'daylight' });
  assert.deepEqual(selectedSpeed('1x').speedPermille, 1000);
  assert.deepEqual(selectedSpeed('2x').speedPermille, 2000);
  assert.deepEqual(selectedSpeed('5x').speedPermille, 5000);
  assert.deepEqual(selectedSpeed('custom', 0.1).speedPermille, 100);
  assert.deepEqual(selectedSpeed('custom', 3600).speedPermille, 3_600_000);
  assert.throws(() => selectedSpeed('custom', 3600.1), /CLOCK_SPEED_INVALID/);
});

test('long and short deterministic advances produce the same mana, Tomb queue, units and event order', () => {
  let start = freshState();
  start.player.mana.current = 0;
  start.survival.environment = { apparentTemperatureC: 0, windKph: 0, wetness: 0, activityFactor: 1, insulation: 1, shelter: 1 };
  const queuedEvents: string[] = [];
  for (const id of ['TOMB-1', 'TOMB-2', 'TOMB-3']) {
    const result = enqueueTombJob(start, id, `UNIT-${id}`);
    start = result.state;
    queuedEvents.push(...result.events.map(event => event.type));
  }
  assert.deepEqual(queuedEvents, [
    'tomb_job_queued', 'tomb_job_started',
    'tomb_job_queued', 'tomb_job_started',
    'tomb_job_queued',
  ]);
  assert.equal(start.territory.tomb.deathQi.current, 18);
  assert.equal(start.territory.tomb.queue.filter(entry => entry.status === 'active').length, 2);
  assert.equal(start.territory.tomb.queue.find(entry => entry.id === 'TOMB-3')?.status, 'queued');

  const target = 45 * MINUTE_MS;
  const long = advanceTo(start, target);
  let shortState = start;
  const shortEvents: string[] = [];
  for (const step of [5, 10, 15, 20, 25, 30, 35, 40, 45]) {
    const part = advanceTo(shortState, step * MINUTE_MS);
    shortState = part.state;
    shortEvents.push(...part.events.map(event => `${event.occurredAtElapsedMs}:${event.type}:${JSON.stringify(event.payload)}`));
  }
  assert.equal(canonicalStateHash(long.state), canonicalStateHash(shortState));
  assert.deepEqual(long.events.map(event => `${event.occurredAtElapsedMs}:${event.type}:${JSON.stringify(event.payload)}`), shortEvents);
  assert.equal(long.state.simElapsedMs, target);
  assert.equal(long.state.ownedUnits.length, 3);
  assert.equal(long.state.survival.coldStatus, 'warning');
  assert.equal(long.state.survival.coldLoadMicro, 810_000_000);
  assert.equal(long.state.territory.tomb.queue.find(entry => entry.id === 'TOMB-3')?.status, 'completed');
  assert.deepEqual(long.state.ownedUnits.map(unit => unit.id), ['UNIT-TOMB-1', 'UNIT-TOMB-2', 'UNIT-TOMB-3']);
  assert.ok(long.state.ownedUnits.every(unit => unit.xpMirrorEligible === false && unit.level === 1 && unit.xp === 0));
  assert.deepEqual(long.events.filter(event => event.type === 'tomb_unit_completed').map(event => event.payload.unitId), ['UNIT-TOMB-1', 'UNIT-TOMB-2', 'UNIT-TOMB-3']);
  assert.deepEqual(long.events.filter(event => event.type === 'tomb_job_started').map(event => event.payload.slotId), [0]);
});

test('next-completion stop, queued cancellation and insufficient Death Qi are deterministic', () => {
  let state = freshState();
  state.clockControl = { status: 'running', selection: '1x', speedPermille: 1000, stopCondition: 'next_completion' };
  state = enqueueTombJob(state, 'ACTIVE', 'UNIT-ACTIVE').state;
  const stopped = advanceTo(state, 60 * MINUTE_MS, { stopCondition: 'next_completion' });
  assert.equal(stopped.stoppedBy, 'next_completion');
  assert.equal(stopped.state.simElapsedMs, TOMB_STANDARD_DURATION_MS);
  assert.equal(stopped.state.ownedUnits.length, 1);

  let noQi = freshState();
  noQi.territory.tomb.deathQi.current = 0;
  const blocked = enqueueTombJob(noQi, 'BLOCKED', 'UNIT-BLOCKED');
  assert.equal(blocked.state.territory.tomb.queue[0].status, 'blocked');
  assert.deepEqual(blocked.events.map(event => event.type), ['tomb_job_queued', 'tomb_job_blocked']);
  const cancel = reduceCommand(blocked.state, command(blocked.state, 'cancel-blocked', 'cancel_tomb', { jobId: 'BLOCKED' }), world);
  assert.equal(cancel.receipt.accepted, true);
  assert.equal(cancel.state.territory.tomb.queue[0].status, 'cancelled');

  const activeState = enqueueTombJob(freshState(), 'ACTIVE-2', 'UNIT-ACTIVE-2').state;
  const active = reduceCommand(activeState, command(activeState, 'cancel-active', 'cancel_tomb', { jobId: 'ACTIVE-2' }), world);
  assert.equal(active.receipt.accepted, false);
  assert.equal(active.receipt.code, 'TOMB_ACTIVE_CANCEL_UNRESOLVED');
});

test('midnight refills Death Qi once to current capacity; capacity upgrades do not mint current Qi', () => {
  let state = freshState();
  state.territory.tomb.deathQi.current = 4;
  const beforeMidnight = advanceTo(state, 17 * HOUR_MS - 1);
  assert.equal(beforeMidnight.state.territory.tomb.deathQi.current, 4);
  const midnight = advanceTo(beforeMidnight.state, 17 * HOUR_MS);
  assert.equal(midnight.state.territory.tomb.deathQi.current, 20);
  assert.equal(midnight.state.territory.tomb.deathQi.nextRefillAtElapsedMs, 41 * HOUR_MS);
  assert.equal(midnight.events.filter(event => event.type === 'tomb_death_qi_refilled').length, 1);
  assert.deepEqual(midnight.events.filter(event => event.occurredAtElapsedMs === 17 * HOUR_MS).map(event => event.type).slice(0, 2), [
    'tomb_death_qi_refilled', 'simulation_hour_settled',
  ]);

  const higher = resizeTombCapacity(midnight.state, 25, 2);
  assert.equal(higher.territory.tomb.deathQi.current, 20);
  assert.equal(higher.territory.tomb.deathQi.capacity, 25);
  const lower = resizeTombCapacity(higher, 15, 1);
  assert.equal(lower.territory.tomb.deathQi.current, 15);
});

test('fire fuel boundaries are exact; unknown opening fuel is not consumed or converted into an invented total', () => {
  const unknown = freshState();
  const unknownAdvance = advanceTo(unknown, 2 * FIRE_WOOD_CONSUMPTION_MS);
  assert.equal(unknownAdvance.state.territory.survivalFire.fuelRemaining, null);
  assert.equal(unknownAdvance.state.territory.survivalFire.active, true);
  assert.equal(unknownAdvance.events.some(event => event.type === 'fire_fuel_consumed'), false);
  const refuelUnknown = reduceCommand(unknown, command(unknown, 'refuel-unknown', 'refuel_fire', {
    containerId: 'LL-CNT-CARRIED-FOOD-BAG-01', itemId: 'WOOD-1', quantity: 1,
  }), world);
  assert.equal(refuelUnknown.receipt.accepted, false);
  assert.equal(refuelUnknown.receipt.code, 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED');

  const fire = structuredClone(freshState());
  fire.territory.survivalFire.fuelKnowledge = 'known';
  fire.territory.survivalFire.fuelRemaining = 2;
  fire.territory.survivalFire.nextFuelConsumptionAtElapsedMs = FIRE_WOOD_CONSUMPTION_MS;
  const one = advanceTo(fire, FIRE_WOOD_CONSUMPTION_MS);
  assert.equal(one.state.territory.survivalFire.fuelRemaining, 1);
  assert.equal(one.state.territory.survivalFire.active, true);
  const two = advanceTo(one.state, 2 * FIRE_WOOD_CONSUMPTION_MS);
  assert.equal(two.state.territory.survivalFire.fuelRemaining, 0);
  assert.equal(two.state.territory.survivalFire.active, false);
  assert.deepEqual(two.events.map(event => event.type), ['fire_fuel_consumed', 'survival_fire_extinguished']);
});

test('sunset, night and dawn events land on source-clock boundaries', () => {
  const state = freshState();
  const atNight = advanceTo(state, 10 * HOUR_MS);
  assert.deepEqual(atNight.events.filter(event => ['world_sunset', 'world_night_started'].includes(event.type)).map(event => [event.occurredAtElapsedMs, event.type]), [
    [9.5 * HOUR_MS, 'world_sunset'], [10 * HOUR_MS, 'world_night_started'],
  ]);
  const atDawn = advanceTo(atNight.state, DAY_MS);
  assert.ok(atDawn.events.some(event => event.occurredAtElapsedMs === DAY_MS && event.type === 'world_dawn'));
});

test('server clock lease serializes tabs and pauses at lease expiry without advancing beyond the lease', async () => {
  let now = 0;
  const repository = new SqliteRepository(':memory:');
  const service = new GameApplicationService(repository, world, { monotonicNow: () => now, leaseMs: 50, timersEnabled: false });
  const created = service.createSave({ creationKey: 'lease-test', slotName: 'Lease' });
  const saveId = created.save.saveId;
  const claimed = await service.heartbeatClock(saveId, 'session-a', 'tab-a');
  assert.equal(claimed.sessionTokenIsDriver, true);
  const running = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'start-clock', expectedRevision: created.save.revision,
    type: 'set_clock_speed', payload: { speed: '1x', stopCondition: 'none' },
  }, { sessionToken: 'session-a', driverId: 'tab-a' });
  assert.equal(running.view.clockControl.status, 'running');
  now = 25;
  await service.settleClockBeforeCommand(saveId);
  assert.equal(repository.loadSave('local-owner', saveId).state.simElapsedMs, 25);
  const spedUp = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'speed-up-clock', expectedRevision: running.revision,
    type: 'set_clock_speed', payload: { speed: '2x', stopCondition: 'none' },
  }, { sessionToken: 'session-a', driverId: 'tab-a' });
  assert.equal(spedUp.view.clockControl.selection, '2x');
  assert.equal(spedUp.view.simElapsedMs, 25);
  const observer = await service.heartbeatClock(saveId, 'session-b', 'tab-b');
  assert.equal(observer.sessionTokenIsDriver, false);
  assert.equal(observer.driver, 'observing');
  now = 80;
  await service.settleClockBeforeCommand(saveId);
  const expired = repository.loadSave('local-owner', saveId).state;
  assert.equal(expired.simElapsedMs, 125);
  assert.equal(expired.clockControl.status, 'paused');
  assert.ok(expired.lastEventSequence >= 5);
  repository.close();
});

test('a failed atomic clock settlement leaves time untouched; a retry commits the full target', async () => {
  let now = 0;
  let failTransition = false;
  const repository = new SqliteRepository(':memory:', (phase, transaction) => {
    if (failTransition && phase === 'before_commit' && transaction === 'system-transition') throw new Error('injected failure');
  });
  const service = new GameApplicationService(repository, world, { monotonicNow: () => now, leaseMs: 500_000, timersEnabled: false });
  const created = service.createSave({ creationKey: 'atomic-test', slotName: 'Atomic' });
  const saveId = created.save.saveId;
  await service.heartbeatClock(saveId, 'session', 'tab');
  await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'start-atomic-clock', expectedRevision: created.save.revision,
    type: 'set_clock_speed', payload: { speed: '5x' },
  }, { sessionToken: 'session', driverId: 'tab' });
  now = 10;
  failTransition = true;
  await assert.rejects(service.settleClockBeforeCommand(saveId), /injected failure/);
  assert.equal(repository.loadSave('local-owner', saveId).state.simElapsedMs, 0);
  failTransition = false;
  await service.settleClockBeforeCommand(saveId);
  const committed = repository.loadSave('local-owner', saveId).state;
  assert.equal(committed.simElapsedMs, 50);
  assert.equal(committed.receipts.length, committed.lastEventSequence);
  repository.close();
});

test('a server restart pauses a running clock and does not count offline time', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage04-restart-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  const firstRepository = new SqliteRepository(databasePath);
  const firstService = new GameApplicationService(firstRepository, world, { monotonicNow: () => 0, timersEnabled: false });
  const created = firstService.createSave({ creationKey: 'restart-test', slotName: 'Restart' });
  await firstService.heartbeatClock(created.save.saveId, 'session', 'tab');
  await firstService.executeCommand(created.save.saveId, {
    schemaVersion: 1, saveId: created.save.saveId, commandId: 'start-before-restart', expectedRevision: created.save.revision,
    type: 'set_clock_speed', payload: { speed: '2x' },
  }, { sessionToken: 'session', driverId: 'tab' });
  const before = firstRepository.loadSave('local-owner', created.save.saveId).state;
  assert.equal(before.clockControl.status, 'running');
  firstRepository.close();
  const secondRepository = new SqliteRepository(databasePath);
  new GameApplicationService(secondRepository, world, { monotonicNow: () => DAY_MS, timersEnabled: false });
  const after = secondRepository.loadSave('local-owner', created.save.saveId).state;
  assert.equal(after.clockControl.status, 'paused');
  assert.equal(after.simElapsedMs, 0);
  assert.ok(after.receipts.some(receipt => receipt.receipt.code === 'SYSTEM_TRANSITION_COMMITTED'));
  secondRepository.close();
  rmSync(directory, { recursive: true, force: true });
});

test('completion is persisted exactly once before, at and after its boundary across a reload', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage04-completion-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  let now = 0;
  const repository = new SqliteRepository(databasePath);
  const service = new GameApplicationService(repository, world, { monotonicNow: () => now, leaseMs: 500_000, timersEnabled: false });
  const created = service.createSave({ creationKey: 'completion-test', slotName: 'Completion' });
  const saveId = created.save.saveId;
  await service.heartbeatClock(saveId, 'session', 'tab');
  const queued = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'queue-output', expectedRevision: created.save.revision,
    type: 'enqueue_tomb', payload: { blueprintId: TOMB_STANDARD_BLUEPRINT_ID },
  });
  assert.deepEqual(queued.receipt.eventSequence, 3);
  const started = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'run-to-completion', expectedRevision: queued.revision,
    type: 'set_clock_speed', payload: { speed: '5x' },
  }, { sessionToken: 'session', driverId: 'tab' });
  assert.equal(started.view.clockControl.status, 'running');

  now = (TOMB_STANDARD_DURATION_MS - 1) / 5;
  await service.settleClockBeforeCommand(saveId);
  assert.equal(repository.loadSave('local-owner', saveId).state.ownedUnits.length, 0);
  now = TOMB_STANDARD_DURATION_MS / 5;
  await service.settleClockBeforeCommand(saveId);
  const atCompletion = repository.loadSave('local-owner', saveId).state;
  assert.equal(atCompletion.simElapsedMs, TOMB_STANDARD_DURATION_MS);
  assert.equal(atCompletion.ownedUnits.length, 1);
  assert.equal(atCompletion.territory.tomb.queue[0].status, 'completed');

  now += 1 / 5;
  await service.settleClockBeforeCommand(saveId);
  repository.close();
  const reloadedRepository = new SqliteRepository(databasePath);
  new GameApplicationService(reloadedRepository, world, { monotonicNow: () => now, timersEnabled: false });
  const reloaded = reloadedRepository.loadSave('local-owner', saveId).state;
  assert.equal(reloaded.ownedUnits.length, 1);
  assert.equal(reloaded.ownedUnits[0].id, atCompletion.ownedUnits[0].id);
  assert.equal(reloaded.territory.tomb.queue.filter(entry => entry.status === 'completed').length, 1);
  reloadedRepository.close();
  rmSync(directory, { recursive: true, force: true });
});

test('Stage 04 snapshots, multi-event command receipts and opening protection survive backup import', async () => {
  const repository = new SqliteRepository(':memory:');
  const service = new GameApplicationService(repository, world, { timersEnabled: false });
  const created = service.createSave({ creationKey: 'backup-stage04', slotName: 'Backup source' });
  const saveId = created.save.saveId;
  await service.heartbeatClock(saveId, 'session', 'tab');
  const bag = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'backup-bag', expectedRevision: 1,
    type: 'inspect_starter_container', payload: { containerId: 'LL-CNT-CARRIED-FOOD-BAG-01' },
  });
  const career = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'backup-career', expectedRevision: bag.revision,
    type: 'inspect_career_card', payload: {},
  });
  const site = await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'backup-site', expectedRevision: career.revision,
    type: 'inspect_entity', payload: { entity: { type: 'site', id: 'SITE-LL01-000' } },
  });
  await service.executeCommand(saveId, {
    schemaVersion: 1, saveId, commandId: 'backup-queue', expectedRevision: site.revision,
    type: 'enqueue_tomb', payload: { blueprintId: TOMB_STANDARD_BLUEPRINT_ID },
  });
  const backup = service.exportBackup(saveId);
  const imported = service.importBackup(backup, 'Backup copy');
  const restored = service.loadSave(imported.save.saveId).state;
  assert.equal(restored.revision, 5);
  assert.equal(restored.lastEventSequence, 6);
  assert.equal(restored.calendar.find(event => event.id === 'EV00-SAFE-FIRE')?.status, 'active');
  assert.equal(restored.playerKnowledge.careerCardObserved, true);
  assert.equal(restored.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.observed, true);
  assert.equal(restored.territory.tomb.queue.length, 1);
  assert.equal(restored.territory.tomb.queue[0].status, 'active');
  repository.close();
});

