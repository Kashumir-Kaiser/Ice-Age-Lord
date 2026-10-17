import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RESOURCE_PURCHASE_TARGETS, RESOURCE_STORAGE, estimateParallelGatheringHours } from '../../content/src/resourceBalance.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { createNewGame } from '../src/initializer.ts';
import { STAGE07_OPENING_CORPSE_ID } from '../src/stage07.ts';
import { actionAvailability, previewCommand, reduceCommand } from '../src/reducer.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { advanceTo, HOUR_MS, MINUTE_MS } from '../src/time.ts';
import { enqueueTombJob } from '../src/time.ts';
import { carryCapacityForFireLevel, planRoute, previewMovement, seedSpatialKnowledge } from '../src/spatial.ts';
import { projectPlayerView } from '../src/view.ts';
import { canonicalStateHash } from '../src/hash.ts';
import { GAME_STATE_SCHEMA_VERSION, UNIT_INVENTORY_CONTAINER_PREFIX } from '../../contracts/src/index.ts';

let stateCounter = 0;

function freshState() {
  stateCounter += 1;
  return createNewGame({
    saveId: `stage05-save-${stateCounter}`,
    campaignId: `stage05-campaign-${stateCounter}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `stage05-seed-${stateCounter}`,
  }, world);
}

function command(state: ReturnType<typeof freshState>, commandId: string, type: string, payload: Record<string, unknown>) {
  return { schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload };
}

function apply(state: ReturnType<typeof freshState>, commandId: string, type: string, payload: Record<string, unknown>) {
  const result = reduceCommand(state, command(state, commandId, type, payload), world);
  assert.equal(result.receipt.accepted, true, `${type} rejected: ${result.receipt.code}`);
  return result.state;
}

test('schema 2 saves migrate into the persistent spatial state without changing the H0 anchor', () => {
  const legacy = structuredClone(freshState()) as unknown as Record<string, any>;
  legacy.schemaVersion = 2;
  delete legacy.player.position;
  delete legacy.player.location;
  delete legacy.travel;
  delete legacy.exploration;
  delete legacy.spatial;
  delete legacy.fieldChestStates;
  delete legacy.playerKnowledge.knownRouteIds;
  delete legacy.playerKnowledge.knownSignalIds;

  const upgraded = upgradeGameState(legacy, world);
  assert.equal(upgraded.schemaVersion, GAME_STATE_SCHEMA_VERSION);
  assert.deepEqual(upgraded.player.position, world.origin);
  assert.deepEqual(upgraded.territory.position, world.origin);
  assert.deepEqual(upgraded.travel.orders, []);
  assert.deepEqual(upgraded.spatial.searchJobs, []);
  assert.equal(upgraded.fieldChestStates.length, world.fieldChests.length);
  assert.deepEqual(upgraded.playerKnowledge.knownRouteIds, ['ROUTE-LL01-01', 'ROUTE-LL01-07', 'ROUTE-LL01-08']);
  assert.equal(upgraded.spatial.resourceBalances.find(balance => balance.resourceId === 'RES-LL01-01')?.remaining, 780);
  assert.equal(upgraded.spatial.resourceBalances.find(balance => balance.resourceId === 'RES-LL01-02')?.remaining, 1_240);
});

test('canonical T0 opening balances seed saves separately from derived capacity', () => {
  const state = freshState();
  for (const [id, expectedOpening] of [['RES-LL01-01', 780], ['RES-LL01-02', 1_240]] as const) {
    const resource = world.resources.find(candidate => candidate.id === id)!;
    assert.equal(resource.openingBalance, expectedOpening);
    assert.ok(resource.capacity > expectedOpening);
    assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === id)?.remaining, expectedOpening);
  }

  const availability = actionAvailability('harvest');
  assert.equal(availability.enabled, false);
  assert.equal(availability.reasonCode, 'RESOURCE_LEDGER_STAGE_05');
  const starterWood = world.resources.find(resource => resource.id === 'RES-LL01-06')!;
  state.player.position = starterWood.location;
  state.player.location = { kind: 'field', coordinate: starterWood.location };
  const carriedBag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  state.inventory = { containers: state.inventory.containers.map(container => container.id === carriedBag.id ? {
    ...container,
    stacks: [...container.stacks, { itemId: 'TEST-STARTER-AXE', templateId: 'STONE-AXE', quantity: 1, equipped: false, provenance: 'versioned_game_design' as const }],
  } : container) };
  const harvest = command(state, 'blocked-harvest', 'harvest', {
    actorId: state.player.id, resourceId: starterWood.id, materialId: starterWood.materialId, quantity: 1, toolItemId: 'TEST-STARTER-AXE',
  });
  const result = reduceCommand(state, harvest, world);
  assert.equal(result.receipt.accepted, false);
  assert.equal(result.receipt.code, 'RESOURCE_LEDGER_STAGE_05');
  assert.equal(result.state.receipts.at(-1)?.commandId, 'blocked-harvest');
  assert.equal(result.state.receipts.at(-1)?.receipt.code, 'RESOURCE_LEDGER_STAGE_05');
  const stateWithoutReceipts = structuredClone(state);
  stateWithoutReceipts.receipts = [];
  const resultWithoutReceipts = structuredClone(result.state);
  resultWithoutReceipts.receipts = [];
  assert.deepEqual(resultWithoutReceipts, stateWithoutReceipts);
  for (const id of ['RES-LL01-01', 'RES-LL01-02']) {
    assert.equal(result.state.spatial.resourceBalances.find(balance => balance.resourceId === id)?.remaining,
      state.spatial.resourceBalances.find(balance => balance.resourceId === id)?.remaining);
  }
});

test('starter wood and stone remain visible, reachable and sufficient across map seeds', () => {
  const starterWood = world.resources.find(resource => resource.id === 'RES-LL01-06')!;
  const starterStone = world.resources.find(resource => resource.id === 'RES-LL01-07')!;
  const openingCosts = RESOURCE_PURCHASE_TARGETS.find(target => target.id === 'starter-opening-bundle')!.costs as Readonly<Record<string, number>>;
  assert.equal(starterWood.capacity, 50);
  assert.equal(starterStone.capacity, 25);
  assert.equal(openingCosts.WOOD, starterWood.capacity);
  assert.equal(openingCosts.STONE, starterStone.capacity);
  assert.equal(RESOURCE_STORAGE.initialStackSlots, 40);

  for (let seedIndex = 0; seedIndex < 8; seedIndex++) {
    const state = createNewGame({
      saveId: `stage05-access-${seedIndex}`,
      campaignId: `stage05-access-campaign-${seedIndex}`,
      soulId: 'LI_LAN',
      worldPackageId: world.id,
      rulesetVersion: RULESET_VERSION,
      contentVersion: world.contentVersion,
      seed: `starter-access-seed-${seedIndex}`,
    }, world);
    const view = projectPlayerView(state, world);
    for (const resource of [starterWood, starterStone]) {
      const distanceFromFire = Math.hypot(resource.location.xMm - world.origin.xMm, resource.location.yMm - world.origin.yMm);
      assert.ok(distanceFromFire <= state.territory.survivalFire.heatRadiusMetres * 1_000, `${resource.id} is outside H0 heat for seed ${seedIndex}`);
      assert.ok(distanceFromFire <= world.navigationOverlay.sightRangeMm * world.navigationOverlay.nightSightPermille / 1_000);
      assert.ok(state.playerKnowledge.knownResourceIds.includes(resource.id));
      assert.ok(view.visibleMap.entities.some(entity => entity.ref.type === 'resource' && entity.ref.id === resource.id));
      assert.ok(view.visibleMap.resourceFeatures.some(feature => feature.id === resource.featureId));
    }
    assert.equal(state.inventory.containers.find(container => container.kind === 'territory_supply')?.stacks.find(stack => stack.templateId === 'BREAD')?.quantity, 20);
    assert.equal(state.inventory.containers.find(container => container.kind === 'territory_supply')?.stacks.filter(stack => stack.templateId === 'STONE-AXE').length, 1);
    assert.equal(state.inventory.containers.find(container => container.kind === 'territory_supply')?.stacks.filter(stack => stack.templateId === 'STONE-HAMMER').length, 1);
  }
});

test('owned unit inventory containers survive save roundtrip and schema migration', () => {
  const state = enqueueTombJob(freshState(), 'worker-production', 'UNIT-WORKER-1').state;
  const workerId = state.ownedUnits[0].id;
  const packId = `${UNIT_INVENTORY_CONTAINER_PREFIX}${workerId}`;
  assert.ok(state.inventory.containers.some(container => container.id === packId && container.kind === 'unit_inventory'));

  const repository = new SqliteRepository(':memory:');
  let loaded: ReturnType<typeof freshState> | null = null;
  try {
    const created = repository.createSaveIdempotent({
      ownerId: 'local-owner', creationKey: 'worker-pack-roundtrip', requestSha256: canonicalStateHash('worker-pack-state'),
      slotName: 'Worker inventory', makeState: () => state,
    });
    loaded = repository.loadSave('local-owner', created.saveId).state;
  } finally {
    repository.close();
  }
  assert.ok(loaded);
  assert.ok(loaded.inventory.containers.some(container => container.id === packId && container.kind === 'unit_inventory'));

  const legacy = structuredClone(loaded) as unknown as Record<string, any>;
  legacy.schemaVersion = 4;
  legacy.inventory.containers = legacy.inventory.containers.filter((container: Record<string, any>) => container.id !== packId);
  const migrated = upgradeGameState(legacy, world);
  assert.equal(migrated.schemaVersion, GAME_STATE_SCHEMA_VERSION);
  assert.ok(migrated.inventory.containers.some(container => container.id === packId && container.kind === 'unit_inventory'));
});

test('resource clusters scale with disjoint terrain footprints and progression rates match economy costs', () => {
  const byId = (id: string) => world.resources.find(resource => resource.id === id)!;
  const smallGrove = byId('RES-LL01-08');
  const largerGrove = byId('RES-LL01-10');
  const matureForest = byId('RES-LL01-01');
  const farForest = byId('RES-LL01-14');
  const smallForage = byId('RES-LL01-09');
  const matureForage = byId('RES-LL01-13');
  assert.ok(smallGrove.capacity < largerGrove.capacity);
  assert.ok(largerGrove.capacity < matureForest.capacity);
  assert.ok(matureForest.capacity > smallGrove.capacity * 100);
  assert.ok(farForest.capacity > matureForest.capacity);
  assert.ok(Math.hypot(farForest.location.xMm, farForest.location.yMm) > Math.hypot(matureForest.location.xMm, matureForest.location.yMm));
  assert.ok(matureForage.dailyQuota! > smallForage.dailyQuota! * 100);
  assert.ok(world.resources.every(resource => world.resourceFeatures.some(feature =>
    feature.id === resource.featureId && feature.position.xMm === resource.location.xMm && feature.position.yMm === resource.location.yMm)));

  const early = RESOURCE_PURCHASE_TARGETS.find(target => target.id === 'starter-opening-bundle')!;
  const mid = RESOURCE_PURCHASE_TARGETS.find(target => target.id === 'mid-lord-house')!;
  const late = RESOURCE_PURCHASE_TARGETS.find(target => target.id === 'late-lord-house')!;
  assert.ok(Math.abs(estimateParallelGatheringHours(early) - 75 / 12) < 1e-9);
  assert.ok(Math.abs(estimateParallelGatheringHours(mid) - 700 / 120) < 1e-9);
  assert.ok(Math.abs(estimateParallelGatheringHours(late) - 1_000_000 / 14_400) < 1e-9);
  assert.equal(carryCapacityForFireLevel(1), 20);
  assert.equal(carryCapacityForFireLevel(8), 500);
  assert.equal(carryCapacityForFireLevel(22), 50_000);

  const state = freshState();
  const knownRoutes = world.navigationOverlay.routeEdges.filter(edge => state.playerKnowledge.knownRouteIds.includes(edge.id));
  assert.ok(planRoute({ ...world, navigationOverlay: { ...world.navigationOverlay, routeEdges: knownRoutes } }, world.origin, farForest.location));
  const finiteWood = world.resources.filter(resource => resource.materialId === 'WOOD').reduce((sum, resource) => sum + resource.capacity, 0);
  const dailyForestRegrowth = world.resources.filter(resource => resource.materialId === 'WOOD').reduce((sum, resource) => sum + resource.regenerationPerDay, 0);
  assert.ok(finiteWood + dailyForestRegrowth * 12 >= 3_800_000, 'the three late wood components are replenishable within a multi-week window');
  assert.equal((late.unmodeledCosts as Readonly<Record<string, number>>).REFINED_IRON, 170_000);
});

test('navigation overlay preserves source route distance and only known routes support long travel', () => {
  const state = freshState();
  const origin = world.origin;
  const town = world.sites.find(site => site.id === 'SITE-LL01-043')!;
  const route = world.navigationOverlay.routeEdges.find(edge => edge.id === 'ROUTE-LL01-01')!;
  assert.equal(route.sourceDistanceMm, 15_600_000);
  assert.ok(Math.abs(route.path.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.xMm - route.path[index].xMm, point.yMm - route.path[index].yMm), 0) - route.sourceDistanceMm) <= 3);

  const routePlan = planRoute({ ...world, navigationOverlay: { ...world.navigationOverlay, routeEdges: [route] } }, origin, town.position);
  assert.ok(routePlan);
  assert.deepEqual(routePlan.sourceRouteIds, [route.id]);
  assert.equal(routePlan.uncertainty, 'known');
  const preview = previewMovement(state, world, state.player.id, town.position);
  assert.equal(preview.code, null);
  assert.equal(preview.preview?.uncertainty, 'known');

  const unknownRouteState = structuredClone(state);
  unknownRouteState.player.position = town.position;
  unknownRouteState.player.location = { kind: 'site', siteId: town.id };
  const farTown = world.sites.find(site => site.id === 'SITE-LL01-044')!;
  assert.equal(previewMovement(unknownRouteState, world, state.player.id, farTown.position).code, 'NO_KNOWN_ROUTE');
  const nearbyOffRoute = previewMovement(unknownRouteState, world, state.player.id, {
    xMm: town.position.xMm + 500_000, yMm: town.position.yMm, sourceZMetres: town.position.sourceZMetres,
  });
  assert.equal(nearbyOffRoute.code, null);
  assert.equal(nearbyOffRoute.preview?.uncertainty, 'uncertain');

  const local = previewMovement(state, world, state.player.id, { xMm: 600_000, yMm: 0, sourceZMetres: 0 });
  assert.equal(local.code, null);
  assert.equal(local.preview?.uncertainty, 'uncertain');
});

test('movement progresses along route geometry, can be cancelled in place, and attaches from mid-route', () => {
  let state = freshState();
  const destination = world.sites.find(site => site.id === 'SITE-LL01-043')!;
  state = apply(state, 'move-known-route', 'move', { actorId: 'LI_LAN', destination: destination.position });
  const order = state.travel.orders.find(item => item.status === 'active')!;
  assert.ok(order.pathSegments.some(segment => segment.sourceRouteId === 'ROUTE-LL01-01'));

  const partial = advanceTo(state, HOUR_MS, {}, world).state;
  assert.equal(partial.player.location.kind, 'travel');
  assert.ok(partial.player.position.xMm !== 0 || partial.player.position.yMm !== 0);
  assert.ok(Math.hypot(partial.player.position.xMm - destination.position.xMm, partial.player.position.yMm - destination.position.yMm) > 1_000_000);
  assert.equal(previewMovement(partial, world, partial.player.id, world.origin).code, 'ACTOR_ALREADY_TRAVELLING');
  const stopped = apply(partial, 'cancel-known-route', 'cancel_travel', { orderId: order.id });
  const backtrack = previewMovement(stopped, world, stopped.player.id, world.origin);
  assert.equal(backtrack.code, null);
  assert.equal(backtrack.preview?.uncertainty, 'known');
  assert.equal(stopped.travel.orders.find(item => item.id === order.id)?.status, 'cancelled');
  assert.equal(stopped.player.location.kind, 'field');
  assert.deepEqual(stopped.player.position, partial.player.position);
});

test('focused searches settle on fixed ticks, preserve revisit history and reveal chests through signal aliases', () => {
  let state = freshState();
  const eligibleChest = world.fieldChests.find(chest => chest.grade === 'Mộc'
    && (chest.position.sourceZMetres ?? 0) >= -2
    && !/sealed|deep|owned|quest[- ]locked|chống sập|yêu cầu chống|khóa|niêm phong/i.test(chest.accessStatement));
  assert.ok(eligibleChest, 'content must include at least one surface-searchable Mộc chest');
  state.player.position = eligibleChest.position;
  state.player.location = { kind: 'field', coordinate: eligibleChest.position };

  state = apply(state, 'search-first-sweep', 'search', { actorId: 'LI_LAN', center: eligibleChest.position, radiusMm: 100_000 });
  assert.equal(state.spatial.searchJobs[0].nextTickAtElapsedMs, 15 * MINUTE_MS);
  let firstSweep: ReturnType<typeof advanceTo> | null = null;
  let sweepAt = 15 * MINUTE_MS;
  while (!firstSweep && sweepAt <= 3 * HOUR_MS) {
    const settled = advanceTo(state, sweepAt, {}, world);
    if (settled.events.some(event => event.type === 'chest_signal_detected')) firstSweep = settled;
    else state = settled.state;
    sweepAt += 15 * MINUTE_MS;
  }
  assert.ok(firstSweep, 'the area sweep eventually reaches the known fixed chest field');
  assert.equal(firstSweep.events.filter(event => event.type === 'chest_signal_detected').length, 1);
  state = firstSweep.state;
  assert.equal(state.spatial.searchJobs[0].status, 'active');
  assert.equal(state.spatial.searchJobs[0].phase, 'sweeping');
  assert.equal(state.exploration.searchHistory[0].status, 'active');
  const detectedChestId = String(firstSweep.events.find(event => event.type === 'chest_signal_detected')?.payload.chestId);
  const detectedChest = world.fieldChests.find(chest => chest.id === detectedChestId)!;
  assert.ok(state.fieldChestStates.find(chest => chest.chestId === detectedChestId)?.discovery === 'signal');
  const firstSignal = state.spatial.signals.find(signal => signal.targetId === detectedChestId)!;
  const signalId = firstSignal.signalId;
  const routeLength = (points: readonly { xMm: number; yMm: number }[]) => points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.xMm - points[index]!.xMm, point.yMm - points[index]!.yMm), 0);
  const completedSweepAt = Math.ceil(routeLength(state.spatial.searchJobs[0].path) * HOUR_MS
    / state.spatial.searchJobs[0].speedMmPerHour! / (15 * MINUTE_MS)) * 15 * MINUTE_MS;
  state = advanceTo(state, Math.max(completedSweepAt, state.simElapsedMs), {}, world).state;
  assert.equal(state.spatial.searchJobs[0].status, 'active');
  assert.equal(state.spatial.searchJobs[0].phase, 'returning');
  const completedReturnAt = state.simElapsedMs + Math.ceil(routeLength(state.spatial.searchJobs[0].returnPath!) * HOUR_MS
    / state.spatial.searchJobs[0].speedMmPerHour!);
  state = advanceTo(state, completedReturnAt, {}, world).state;
  assert.equal(state.spatial.searchJobs[0].status, 'completed');
  assert.equal(state.exploration.searchHistory[0].status, 'completed');
  const unidentifiedView = projectPlayerView(state, world);
  const unidentifiedJson = JSON.stringify(unidentifiedView);
  assert.ok(!unidentifiedJson.includes(eligibleChest.id));
  const signalEntity = unidentifiedView.visibleMap.entities.find(entity => entity.ref.type === 'cache' && entity.ref.id === signalId)!;
  assert.equal(signalEntity.knowledge, 'signs_only');
  assert.ok(Math.hypot(signalEntity.position!.xMm - detectedChest.position.xMm, signalEntity.position!.yMm - detectedChest.position.yMm) <= Math.SQRT2 * 50_000);

  state.player.position = detectedChest.position;
  state.player.location = { kind: 'field', coordinate: detectedChest.position };
  state = apply(state, 'search-repeat-sweep', 'search', { actorId: 'LI_LAN', center: detectedChest.position, radiusMm: 100_000 });
  state = advanceTo(state, completedReturnAt + 15 * MINUTE_MS, {}, world).state;
  assert.equal(state.spatial.signals.filter(signal => signal.targetId === detectedChestId).length, 1);
  assert.ok(state.spatial.searchJobs[1].repeatedAreaM2 > 0);
  assert.equal(state.spatial.signals.find(signal => signal.targetId === detectedChestId)?.signalId, signalId);

  state.player.position = detectedChest.position;
  state.player.location = { kind: 'field', coordinate: detectedChest.position };
  state = apply(state, 'inspect-search-signal', 'inspect_entity', { entity: { type: 'cache', id: signalId } });
  assert.ok(state.playerKnowledge.knownChestIds.includes(detectedChestId));
  assert.equal(state.fieldChestStates.find(chest => chest.chestId === detectedChestId)?.discovery, 'identified');
  const identifiedView = projectPlayerView(state, world);
  assert.ok(JSON.stringify(identifiedView).includes(eligibleChest.id));
  const openCommand = command(state, 'open-rarity-chest', 'open_cache', { actorId: 'LI_LAN', chestId: eligibleChest.id });
  const opened = reduceCommand(state, openCommand, world);
  assert.equal(opened.receipt.accepted, true, `Chest opening rejected: ${opened.receipt.code}`);
  assert.equal(opened.events.map(event => event.type).join(','), 'chest_opened,chest_loot_delivered');
  const chestAfter = opened.state.fieldChestStates.find(chest => chest.chestId === eligibleChest.id)!;
  assert.equal(chestAfter.state, 'opened');
  assert.equal(chestAfter.lootOutcome?.ruleVersion, 'LL01-CHEST-POOL-RARITY-TYPE-1.0');
  assert.ok(chestAfter.lootOutcome?.rewardStacks.length);
  const duplicate = reduceCommand(opened.state, openCommand, world);
  assert.equal(duplicate.receipt.accepted, true);
  assert.deepEqual(duplicate.events, []);
  assert.deepEqual(duplicate.state.fieldChestStates.find(chest => chest.chestId === eligibleChest.id)?.lootOutcome, chestAfter.lootOutcome);
  const lootView = projectPlayerView(opened.state, world).visibleMap.entities.find(entity => entity.ref.type === 'cache' && entity.ref.id === eligibleChest.id);
  assert.equal(lootView?.chestLoot?.rarity, eligibleChest.grade);
  assert.equal(lootView?.chestLoot?.opened, true);
});

test('API backup import preserves an in-progress authoritative movement position', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage05-backup-'));
  const repository = new SqliteRepository(resolve(directory, 'saves.sqlite'));
  let now = 0;
  const service = new GameApplicationService(repository, world, { monotonicNow: () => now, leaseMs: 500_000, timersEnabled: false });
  try {
    const created = service.createSave({ creationKey: 'stage05-moving-backup', slotName: 'Stage 05 movement' });
    const saveId = created.save.saveId;
    await service.heartbeatClock(saveId, 'session', 'tab');
    const moving = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage05-move-partway', expectedRevision: created.save.revision,
      type: 'move', payload: { actorId: 'LI_LAN', destination: { xMm: 600_000, yMm: 0, sourceZMetres: 0 } },
    });
    const running = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage05-run-clock', expectedRevision: moving.revision,
      type: 'set_clock_speed', payload: { speed: '5x' },
    }, { sessionToken: 'session', driverId: 'tab' });
    now = 60_000;
    await service.settleClockBeforeCommand(saveId);
    const before = service.loadSave(saveId).state;
    assert.equal(before.clockControl.status, 'running');
    assert.equal(before.travel.orders.filter(order => order.status === 'active').length, 1);
    assert.ok(before.player.position.xMm > 0 && before.player.position.xMm < 600_000);

    const backup = service.exportBackup(saveId);
    const imported = service.importBackup(backup, 'Stage 05 movement copy');
    const after = service.loadSave(imported.save.saveId).state;
    assert.deepEqual(after.player.position, before.player.position);
    assert.deepEqual(after.travel.orders, before.travel.orders);
    assert.equal(after.travel.orders[0].status, 'active');
    assert.equal(after.jobs.find(job => job.id === after.travel.orders[0].id)?.status, 'active');
  } finally {
    repository.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
