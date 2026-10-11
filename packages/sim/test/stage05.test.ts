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
import { reduceCommand } from '../src/reducer.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { advanceTo, HOUR_MS, MINUTE_MS } from '../src/time.ts';
import { enqueueTombJob } from '../src/time.ts';
import { carryCapacityForFireLevel, planRoute, previewMovement, seedSpatialKnowledge } from '../src/spatial.ts';
import { projectPlayerView } from '../src/view.ts';
import { canonicalStateHash } from '../src/hash.ts';
import { UNIT_INVENTORY_CONTAINER_PREFIX } from '../../contracts/src/index.ts';

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
  assert.equal(upgraded.schemaVersion, 7);
  assert.deepEqual(upgraded.player.position, world.origin);
  assert.deepEqual(upgraded.territory.position, world.origin);
  assert.deepEqual(upgraded.travel.orders, []);
  assert.deepEqual(upgraded.spatial.searchJobs, []);
  assert.equal(upgraded.fieldChestStates.length, world.fieldChests.length);
  assert.deepEqual(upgraded.playerKnowledge.knownRouteIds, ['ROUTE-LL01-01', 'ROUTE-LL01-07', 'ROUTE-LL01-08']);
});

test('schema 3 saves discover starter deposits on the map during resource migration', () => {
  const legacy = structuredClone(freshState()) as unknown as Record<string, any>;
  legacy.schemaVersion = 3;
  legacy.playerKnowledge.knownResourceIds = [];
  legacy.spatial.resourceBalances = legacy.spatial.resourceBalances.filter((balance: Record<string, any>) =>
    ['RES-LL01-01', 'RES-LL01-02', 'RES-LL01-03', 'RES-LL01-04', 'RES-LL01-05'].includes(balance.resourceId));

  const upgraded = upgradeGameState(legacy, world);
  const view = projectPlayerView(upgraded, world);
  for (const id of ['RES-LL01-06', 'RES-LL01-07']) {
    assert.ok(upgraded.playerKnowledge.knownResourceIds.includes(id));
    assert.ok(view.visibleMap.entities.some(entity => entity.ref.type === 'resource' && entity.ref.id === id));
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

test('owned harvesters use unit inventory, save their load and gain packs through v4 migration', () => {
  let state = enqueueTombJob(freshState(), 'worker-production', 'UNIT-WORKER-1').state;
  state = advanceTo(state, 20 * MINUTE_MS, {}, world).state;
  const workerId = state.ownedUnits[0].id;
  const packId = `${UNIT_INVENTORY_CONTAINER_PREFIX}${workerId}`;
  assert.ok(state.inventory.containers.some(container => container.id === packId && container.kind === 'unit_inventory'));
  const supplySite = world.sites.find(site => site.id === 'SITE-LL01-002')!;
  state = apply(state, 'worker-to-supply', 'move', { actorId: workerId, destination: supplySite.position });
  state = apply(state, 'player-to-supply', 'move', { actorId: state.player.id, destination: supplySite.position });
  state = advanceTo(state, state.simElapsedMs + MINUTE_MS, {}, world).state;

  state = apply(state, 'observe-worker-tools', 'inspect_starter_container', { containerId: 'LL-CNT-SUPPLY-01' });
  state = apply(state, 'give-worker-axe', 'transfer_item', {
    actorId: state.player.id,
    sourceContainerId: 'LL-CNT-SUPPLY-01',
    destinationContainerId: packId,
    itemId: 'ASSET-SUPPLY-STONE-AXE-01',
    quantity: 1,
  });
  const axeId = state.inventory.containers.find(container => container.id === packId)?.stacks.find(stack => stack.templateId === 'STONE-AXE')?.itemId;
  assert.ok(axeId);
  const starterWood = world.resources.find(resource => resource.id === 'RES-LL01-06')!;
  state = apply(state, 'assign-worker-harvest', 'harvest', {
    actorId: workerId, resourceId: starterWood.id, materialId: starterWood.materialId, quantity: 12, toolItemId: axeId,
  });
  state = advanceTo(state, state.simElapsedMs + 2 * HOUR_MS, {}, world).state;
  const completedJob = state.spatial.harvestJobs.at(-1)!;
  assert.equal(completedJob.status, 'completed');
  assert.equal(completedJob.extractedQuantity, 12);
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 38);
  assert.equal(state.inventory.containers.find(container => container.id === packId)?.stacks.find(stack => stack.templateId === 'WOOD')?.quantity, 12);
  assert.equal(projectPlayerView(state, world).inventory.containers.find(container => container.id === packId)?.ownerId, workerId);

  const repository = new SqliteRepository(':memory:');
  let loaded: ReturnType<typeof freshState> | null = null;
  try {
    const created = repository.createSaveIdempotent({
      ownerId: 'local-owner', creationKey: 'worker-cargo-roundtrip', requestSha256: canonicalStateHash('worker-cargo-state'),
      slotName: 'Worker cargo', makeState: () => state,
    });
    loaded = repository.loadSave('local-owner', created.saveId).state;
  } finally {
    repository.close();
  }
  assert.ok(loaded);
  assert.equal(loaded.inventory.containers.find(container => container.id === packId)?.stacks.find(stack => stack.templateId === 'WOOD')?.quantity, 12);
  assert.equal(loaded.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 38);
  const workerWood = loaded.inventory.containers.find(container => container.id === packId)?.stacks.find(stack => stack.templateId === 'WOOD')!;
  loaded = apply(loaded, 'store-worker-cargo', 'transfer_item', {
    actorId: loaded.player.id, sourceContainerId: packId, destinationContainerId: 'LL-CNT-SUPPLY-01', itemId: workerWood.itemId, quantity: workerWood.quantity,
  });
  assert.equal(loaded.inventory.containers.find(container => container.id === 'LL-CNT-SUPPLY-01')?.stacks.find(stack => stack.templateId === 'WOOD')?.quantity, 12);

  const legacy = structuredClone(loaded) as unknown as Record<string, any>;
  legacy.schemaVersion = 4;
  legacy.inventory.containers = legacy.inventory.containers.filter((container: Record<string, any>) => container.id !== packId);
  const migrated = upgradeGameState(legacy, world);
  assert.equal(migrated.schemaVersion, 7);
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
  const firstSweep = advanceTo(state, 15 * MINUTE_MS, {}, world);
  assert.equal(firstSweep.events.filter(event => event.type === 'chest_signal_detected').length, 1);
  state = firstSweep.state;
  assert.equal(state.spatial.searchJobs[0].status, 'completed');
  assert.equal(state.exploration.searchHistory[0].status, 'completed');
  assert.ok(state.fieldChestStates.find(chest => chest.chestId === eligibleChest.id)?.discovery === 'signal');
  const firstSignal = state.spatial.signals.find(signal => signal.targetId === eligibleChest.id)!;
  const signalId = firstSignal.signalId;
  const unidentifiedView = projectPlayerView(state, world);
  const unidentifiedJson = JSON.stringify(unidentifiedView);
  assert.ok(!unidentifiedJson.includes(eligibleChest.id));
  const signalEntity = unidentifiedView.visibleMap.entities.find(entity => entity.ref.type === 'cache' && entity.ref.id === signalId)!;
  assert.equal(signalEntity.knowledge, 'signs_only');
  assert.ok(Math.hypot(signalEntity.position!.xMm - eligibleChest.position.xMm, signalEntity.position!.yMm - eligibleChest.position.yMm) <= Math.SQRT2 * 50_000);

  state.player.position = eligibleChest.position;
  state.player.location = { kind: 'field', coordinate: eligibleChest.position };
  state = apply(state, 'search-repeat-sweep', 'search', { actorId: 'LI_LAN', center: eligibleChest.position, radiusMm: 100_000 });
  state = advanceTo(state, 30 * MINUTE_MS, {}, world).state;
  assert.equal(state.spatial.signals.filter(signal => signal.targetId === eligibleChest.id).length, 1);
  assert.ok(state.spatial.searchJobs[1].repeatedAreaM2 > 0);
  assert.equal(state.spatial.signals.find(signal => signal.targetId === eligibleChest.id)?.signalId, signalId);

  state.player.position = eligibleChest.position;
  state.player.location = { kind: 'field', coordinate: eligibleChest.position };
  state = apply(state, 'inspect-search-signal', 'inspect_entity', { entity: { type: 'cache', id: signalId } });
  assert.ok(state.playerKnowledge.knownChestIds.includes(eligibleChest.id));
  assert.equal(state.fieldChestStates.find(chest => chest.chestId === eligibleChest.id)?.discovery, 'identified');
  const identifiedView = projectPlayerView(state, world);
  assert.ok(JSON.stringify(identifiedView).includes(eligibleChest.id));
  const opened = reduceCommand(state, command(state, 'open-uncompiled-chest', 'open_cache', { actorId: 'LI_LAN', chestId: eligibleChest.id }), world);
  assert.equal(opened.receipt.accepted, false);
  assert.equal(opened.receipt.code, 'CHEST_LOOT_CANDIDATE_POOL_NOT_COMPILED');
  assert.equal(opened.state.fieldChestStates.find(chest => chest.chestId === eligibleChest.id)?.state, 'unopened');
});

test('harvest reserves finite source quantity, returns cargo and conserves inventory and balance', () => {
  let state = freshState();
  const supplySite = world.sites.find(site => site.id === 'SITE-LL01-002')!;
  state = { ...state, player: { ...state.player, position: supplySite.position, location: { kind: 'site', siteId: supplySite.id } } };
  state = apply(state, 'observe-supply-for-harvest', 'inspect_starter_container', { containerId: 'LL-CNT-SUPPLY-01' });
  const axeId = 'ASSET-SUPPLY-STONE-AXE-01';
  state = apply(state, 'carry-axe', 'transfer_item', {
    actorId: 'LI_LAN', sourceContainerId: 'LL-CNT-SUPPLY-01', destinationContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', itemId: axeId, quantity: 1,
  });
  const carriedAxeId = state.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.stacks.find(stack => stack.templateId === 'STONE-AXE')?.itemId;
  assert.ok(carriedAxeId);
  assert.equal(state.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.stacks.find(stack => stack.itemId === carriedAxeId)?.quantity, 1);

  const wood = world.resources.find(resource => resource.id === 'RES-LL01-01')!;
  const movementStart = state.simElapsedMs;
  state = apply(state, 'travel-to-wood', 'move', { actorId: 'LI_LAN', destination: wood.location });
  const travel = state.travel.orders.find(order => order.status === 'active')!;
  assert.ok(travel.pathSegments.some(segment => segment.sourceRouteId === 'ROUTE-LL01-08'));
  state = advanceTo(state, movementStart + travel.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0), {}, world).state;
  assert.ok(state.playerKnowledge.knownResourceIds.includes(wood.id));
  state = apply(state, 'inspect-wood-balance', 'inspect_entity', { entity: { type: 'resource', id: wood.id } });
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === wood.id)?.amountKnowledge, 'known_exact');

  const initialQuantity = state.spatial.resourceBalances.find(balance => balance.resourceId === wood.id)!.remaining;
  state = apply(state, 'harvest-two-wood', 'harvest', {
    actorId: 'LI_LAN', resourceId: wood.id, materialId: wood.materialId, quantity: 2, toolItemId: carriedAxeId,
  });
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === wood.id)?.reserved, 2);
  state = advanceTo(state, state.simElapsedMs + 2 * HOUR_MS, {}, world).state;
  const job = state.spatial.harvestJobs[0];
  assert.equal(job.status, 'completed');
  assert.equal(job.extractedQuantity, 2);
  const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === wood.id)!;
  assert.equal(balance.remaining, initialQuantity - 2);
  assert.equal(balance.reserved, 0);
  const carriedWood = state.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')!.stacks
    .filter(stack => stack.templateId === 'WOOD').reduce((sum, stack) => sum + stack.quantity, 0);
  assert.equal(carriedWood, 2);

  state = apply(state, 'reserve-then-cancel-harvest', 'harvest', {
    actorId: 'LI_LAN', resourceId: wood.id, materialId: wood.materialId, quantity: 2, toolItemId: carriedAxeId,
  });
  const cancelledId = state.spatial.harvestJobs.at(-1)!.id;
  assert.equal(state.spatial.resourceBalances.find(candidate => candidate.resourceId === wood.id)?.reserved, 2);
  state = apply(state, 'cancel-reserved-harvest', 'cancel_spatial_job', { jobId: cancelledId });
  assert.equal(state.spatial.harvestJobs.at(-1)?.status, 'cancelled');
  assert.equal(state.spatial.resourceBalances.find(candidate => candidate.resourceId === wood.id)?.reserved, 0);
  assert.equal(state.spatial.resourceBalances.find(candidate => candidate.resourceId === wood.id)?.remaining, initialQuantity - 2);
});

test('wood, forage, visible feature channels and exhausted state survive SQLite save and reload', () => {
  const repository = new SqliteRepository(':memory:');
  try {
    let state = freshState();
    const starterWood = world.resources.find(resource => resource.id === 'RES-LL01-06')!;
    const carriedId = 'TEST-STARTER-AXE';
    const bagIndex = state.inventory.containers.findIndex(container => container.kind === 'carried_bag');
    const bag = state.inventory.containers[bagIndex];
    state.inventory = { containers: state.inventory.containers.map(container => container.id === bag.id
      ? { ...container, stacks: [...container.stacks, { itemId: carriedId, templateId: 'STONE-AXE', quantity: 1, equipped: false, provenance: 'versioned_game_design' as const }] }
      : container) };
    state = apply(state, 'inspect-starter-wood', 'inspect_entity', { entity: { type: 'resource', id: starterWood.id } });

    state = apply(state, 'starter-wood-first-load', 'harvest', {
      actorId: state.player.id, resourceId: starterWood.id, materialId: starterWood.materialId, quantity: 20, toolItemId: carriedId,
    });
    state = advanceTo(state, HOUR_MS, {}, world).state;
    assert.equal(state.spatial.harvestJobs[0].status, 'active');
    assert.equal(state.spatial.harvestJobs[0].extractedQuantity, 9);
    assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 41);

    const created = repository.createSaveIdempotent({
      ownerId: 'local-owner', creationKey: 'starter-resource-roundtrip', requestSha256: canonicalStateHash('resource-state-v1'),
      slotName: 'Resource state', makeState: () => state,
    });
    state = repository.loadSave('local-owner', created.saveId).state;
    let feature = projectPlayerView(state, world).visibleMap.resourceFeatures.find(item => item.id === starterWood.featureId)!;
    assert.equal(feature.channels.find(channel => channel.resourceId === starterWood.id)?.remainingRatio, 41 / 50);
    assert.equal(feature.position.xMm, starterWood.location.xMm);
    state = advanceTo(state, state.simElapsedMs + HOUR_MS, {}, world).state;
    assert.equal(state.spatial.harvestJobs[0].status, 'completed');
    assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 30);

    const storageSite = world.sites.find(site => site.id === 'SITE-LL01-002')!;
    state.player.position = storageSite.position;
    state.player.location = { kind: 'site', siteId: storageSite.id };
    state = apply(state, 'inspect-resource-stockpile', 'inspect_starter_container', { containerId: 'LL-CNT-SUPPLY-01' });
    const cargo = state.inventory.containers.find(container => container.kind === 'carried_bag')!.stacks.find(stack => stack.templateId === 'WOOD')!;
    state = apply(state, 'store-first-wood-load', 'transfer_item', {
      actorId: state.player.id, sourceContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', destinationContainerId: 'LL-CNT-SUPPLY-01', itemId: cargo.itemId, quantity: cargo.quantity,
    });
    state.player.position = starterWood.location;
    state.player.location = { kind: 'field', coordinate: starterWood.location };
    state = apply(state, 'starter-wood-second-load', 'harvest', {
      actorId: state.player.id, resourceId: starterWood.id, materialId: starterWood.materialId, quantity: 20, toolItemId: carriedId,
    });
    state = advanceTo(state, state.simElapsedMs + 2 * HOUR_MS, {}, world).state;
    assert.equal(state.spatial.harvestJobs.at(-1)?.status, 'completed');
    assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 10);

    state.player.position = storageSite.position;
    state.player.location = { kind: 'site', siteId: storageSite.id };
    const secondCargo = state.inventory.containers.find(container => container.kind === 'carried_bag')!.stacks.find(stack => stack.templateId === 'WOOD')!;
    state = apply(state, 'store-second-wood-load', 'transfer_item', {
      actorId: state.player.id, sourceContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', destinationContainerId: 'LL-CNT-SUPPLY-01', itemId: secondCargo.itemId, quantity: secondCargo.quantity,
    });
    const storedWood = state.inventory.containers.find(container => container.id === 'LL-CNT-SUPPLY-01')!.stacks.filter(stack => stack.templateId === 'WOOD');
    assert.equal(storedWood.length, 1);
    assert.equal(storedWood[0].quantity, 40);

    state.player.position = starterWood.location;
    state.player.location = { kind: 'field', coordinate: starterWood.location };
    state = apply(state, 'starter-wood-final-load', 'harvest', {
      actorId: state.player.id, resourceId: starterWood.id, materialId: starterWood.materialId, quantity: 10, toolItemId: carriedId,
    });
    state = advanceTo(state, state.simElapsedMs + 90 * MINUTE_MS, {}, world).state;
    assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === starterWood.id)?.remaining, 0);
    const exhaustedSnapshot = repository.createSaveIdempotent({
      ownerId: 'local-owner', creationKey: 'exhausted-starter-resource-roundtrip', requestSha256: canonicalStateHash('resource-exhaustion-v1'),
      slotName: 'Exhausted resource', makeState: () => ({ ...structuredClone(state), saveId: 'stage05-exhausted-resource-save', receipts: [] }),
    });
    const loaded = repository.loadSave('local-owner', exhaustedSnapshot.saveId).state;
    const loadedView = projectPlayerView(loaded, world);
    const deposit = loadedView.visibleMap.entities.find(entity => entity.resourceDeposit?.featureId === starterWood.featureId)!;
    const material = deposit.resourceDeposit!.materials.find(item => item.resourceId === starterWood.id)!;
    feature = loadedView.visibleMap.resourceFeatures.find(item => item.id === starterWood.featureId)!;
    assert.equal(material.remaining, 0);
    assert.equal(material.status, 'depleted');
    assert.equal(feature.channels.find(channel => channel.resourceId === starterWood.id)?.remainingRatio, 0);
  } finally {
    repository.close();
  }
});

test('forest wood and forage deplete separate channels; only biological stock regrows', () => {
  let state = freshState();
  const forestWood = world.resources.find(resource => resource.id === 'RES-LL01-01')!;
  const forestForage = world.resources.find(resource => resource.id === 'RES-LL01-13')!;
  state.player.position = forestWood.location;
  state.player.location = { kind: 'field', coordinate: forestWood.location };
  seedSpatialKnowledge(state, world);
  const carriedId = 'TEST-FOREST-AXE';
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  state.inventory = { containers: state.inventory.containers.map(container => container.id === bag.id
    ? { ...container, stacks: [...container.stacks, { itemId: carriedId, templateId: 'STONE-AXE', quantity: 1, equipped: false, provenance: 'versioned_game_design' as const }] }
    : container) };
  state.territory.survivalFire.level = 22;
  state = apply(state, 'inspect-mature-forest', 'inspect_entity', { entity: { type: 'resource', id: forestWood.id } });
  const initialFeature = projectPlayerView(state, world).visibleMap.resourceFeatures.find(item => item.id === forestWood.featureId)!;
  const initialCanopy = initialFeature.channels.find(channel => channel.resourceId === forestWood.id)!.remainingRatio;
  const initialGroundcover = initialFeature.channels.find(channel => channel.resourceId === forestForage.id)!.remainingRatio;

  state = apply(state, 'cut-mature-forest-timber', 'harvest', {
    actorId: state.player.id, resourceId: forestWood.id, materialId: forestWood.materialId, quantity: 20_000, toolItemId: carriedId,
  });
  state = advanceTo(state, state.simElapsedMs + 6 * HOUR_MS, {}, world).state;
  let feature = projectPlayerView(state, world).visibleMap.resourceFeatures.find(item => item.id === forestWood.featureId)!;
  const afterTimber = feature.channels.find(channel => channel.resourceId === forestWood.id)!.remainingRatio;
  assert.ok(afterTimber < initialCanopy);
  assert.equal(feature.channels.find(channel => channel.resourceId === forestForage.id)!.remainingRatio, initialGroundcover);
  assert.equal(feature.position.xMm, forestWood.location.xMm);
  assert.equal(Math.ceil(feature.visualElementCount * afterTimber), Math.ceil(feature.visualElementCount * initialCanopy) - 1);

  state = apply(state, 'gather-mature-forest-forage', 'harvest', {
    actorId: state.player.id, resourceId: forestForage.id, materialId: forestForage.materialId, quantity: 2_000, toolItemId: 'NONE',
  });
  state = advanceTo(state, state.simElapsedMs + HOUR_MS, {}, world).state;
  feature = projectPlayerView(state, world).visibleMap.resourceFeatures.find(item => item.id === forestWood.featureId)!;
  assert.equal(feature.channels.find(channel => channel.resourceId === forestWood.id)!.remainingRatio, afterTimber);
  assert.ok(feature.channels.find(channel => channel.resourceId === forestForage.id)!.remainingRatio < initialGroundcover);

  state = advanceTo(state, 16 * HOUR_MS, {}, world).state;
  const finiteStarter = state.spatial.resourceBalances.find(balance => balance.resourceId === 'RES-LL01-06')!;
  state.spatial.resourceBalances = state.spatial.resourceBalances.map(balance => balance.resourceId === finiteStarter.resourceId
    ? { ...balance, remaining: 0 }
    : balance.resourceId === forestWood.id ? { ...balance, remaining: forestWood.capacity - 100 }
      : balance.resourceId === forestForage.id ? { ...balance, dailyRemaining: 0 } : balance);
  state = advanceTo(state, 17 * HOUR_MS, {}, world).state;
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === finiteStarter.resourceId)?.remaining, 0);
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === forestWood.id)?.remaining, forestWood.capacity);
  assert.equal(state.spatial.resourceBalances.find(balance => balance.resourceId === forestForage.id)?.dailyRemaining, forestForage.dailyQuota);
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
