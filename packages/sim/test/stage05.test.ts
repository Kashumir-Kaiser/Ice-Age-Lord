import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { createNewGame } from '../src/initializer.ts';
import { reduceCommand } from '../src/reducer.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { advanceTo, HOUR_MS, MINUTE_MS } from '../src/time.ts';
import { planRoute, previewMovement } from '../src/spatial.ts';
import { projectPlayerView } from '../src/view.ts';

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
  assert.equal(upgraded.schemaVersion, 4);
  assert.deepEqual(upgraded.player.position, world.origin);
  assert.deepEqual(upgraded.territory.position, world.origin);
  assert.deepEqual(upgraded.travel.orders, []);
  assert.deepEqual(upgraded.spatial.searchJobs, []);
  assert.equal(upgraded.fieldChestStates.length, world.fieldChests.length);
  assert.deepEqual(upgraded.playerKnowledge.knownRouteIds, ['ROUTE-LL01-01', 'ROUTE-LL01-07', 'ROUTE-LL01-08']);
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
