import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import type { GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { GameApplicationService } from '../../api/src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { STAGE07_OPENING_CORPSE_ID } from '../src/stage07.ts';
import { createNewGame } from '../src/initializer.ts';
import { reduceCommand } from '../src/reducer.ts';
import { advanceTo } from '../src/time.ts';
import { projectPlayerView } from '../src/view.ts';

const ownerId = 'local-owner';
const world = ACTIVE_WORLD_PACKAGE;
let serial = 0;

type Harness = ReturnType<typeof createHarness>;

function createHarness(testWorld: WorldDefinition = world) {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage09-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  let now = 0;
  let repository = new SqliteRepository(databasePath);
  const serviceOptions = { monotonicNow: () => now, leaseMs: 10_000_000, timersEnabled: false } as const;
  let service = new GameApplicationService(repository, testWorld, serviceOptions);
  const created = service.createSave({
    creationKey: `stage09-clean-${++serial}`,
    slotName: `Stage 09 clean ${serial}`,
  });
  const saveId = created.save.saveId;
  const driver = { sessionToken: `stage09-session-${serial}`, driverId: `stage09-tab-${serial}` };
  let commandCounter = 0;

  function currentState(): GameState {
    return repository.loadSave(ownerId, saveId).state;
  }

  function envelope(type: string, payload: Record<string, unknown>, commandId = `stage09-command-${++commandCounter}`) {
    const state = currentState();
    return { schemaVersion: 1, saveId, commandId, expectedRevision: state.revision, type, payload };
  }

  async function send(type: string, payload: Record<string, unknown>, withDriver = false) {
    return service.executeCommand(saveId, envelope(type, payload), withDriver ? driver : undefined);
  }

  async function startClock() {
    await service.heartbeatClock(saveId, driver.sessionToken, driver.driverId);
    await send('set_clock_speed', { speed: 'custom', customMultiplier: 3600, stopCondition: 'none' }, true);
  }

  async function advanceSimulationBy(simulationMs: number) {
    if (!Number.isFinite(simulationMs) || simulationMs < 0) throw new Error('STAGE09_ADVANCE_INVALID');
    const before = currentState().simElapsedMs;
    const target = before + simulationMs;
    now += simulationMs / 3600 + 2;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await service.settleClockBeforeCommand(saveId);
      if (currentState().simElapsedMs >= target) return currentState();
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    throw new Error(`STAGE09_CLOCK_NOT_SETTLED:${currentState().simElapsedMs}<${target}`);
  }

  function restart() {
    repository.close();
    repository = new SqliteRepository(databasePath);
    service = new GameApplicationService(repository, testWorld, serviceOptions);
    return service.loadSave(saveId);
  }

  async function close() {
    await service.shutdownClockDrivers();
    repository.close();
    rmSync(directory, { recursive: true, force: true });
  }

  return {
    created, currentState, databasePath, directory, driver, saveId, send, startClock, advanceSimulationBy, restart, close,
    get repository() { return repository; },
    get service() { return service; },
  };
}

async function completeActiveMove(harness: Harness) {
  const order = harness.currentState().travel.orders.findLast(candidate => candidate.status === 'active');
  assert.ok(order, 'the real move command must create an active server movement order');
  const duration = order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
  await harness.advanceSimulationBy(duration + 1);
  assert.equal(harness.currentState().travel.orders.find(candidate => candidate.id === order.id)?.status, 'completed');
  return harness.service.loadSave(harness.saveId).view;
}

test('fresh API save reveals opening contents by inspection and preserves one-time career/revival effects', async () => {
  const harness = createHarness();
  try {
    const initial = harness.currentState();
    const view = harness.created.view;
    assert.equal(initial.schemaVersion, 7);
    assert.equal(initial.simElapsedMs, 0);
    assert.equal(initial.ownedUnits.length, 0);
    assert.equal(initial.revision, 1);
    assert.equal(initial.clockControl.status, 'paused');
    assert.deepEqual(view.worldClock, { day: 1, hour: 7, minute: 0, lightPhase: 'daylight' });
    assert.equal(initial.cleanStartDiagnostics.historicalProgress, false);
    assert.equal(initial.territory.survivalFire.protectionStatus, 'active');
    assert.equal(initial.eventProgressionBlocker, null);
    assert.equal(initial.playerKnowledge.knownSiteIds.includes('SITE-LL01-002'), false);
    assert.equal(initial.buildings.find(building => building.kind === 'lord_house')?.status, 'damaged');
    assert.equal(initial.bagSeed.inspected, false);
    assert.equal(initial.player.career.skills?.length ?? 0, 0);
    assert.equal(view.careerCard.observed, false);
    assert.equal(view.careerCard.career, null);
    assert.equal(view.careerCard.active, false);
    assert.equal(view.units.length, 0);
    assert.deepEqual(view.inventory.inspectableContainers.map(container => container.containerId), ['LL-CNT-CARRIED-FOOD-BAG-01']);
    assert.equal(view.territory.survivalFire.fuelRemaining, null);
    assert.equal(view.territory.survivalFire.fuelBlocker, 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED');
    assert.equal(initial.survival.blocker, 'OPENING_WEATHER_RECORD_NOT_SEEDED');
    assert.equal(view.corpses?.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.label, 'Unidentified corpse');

    const bagBefore = structuredClone(initial.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01'));
    assert.ok(bagBefore);
    await harness.send('inspect_starter_container', { containerId: bagBefore.id });
    const bagAfterInspection = harness.currentState().inventory.containers.find(container => container.id === bagBefore.id)!;
    assert.equal(bagAfterInspection.observed, true);
    assert.deepEqual(bagAfterInspection.stacks, bagBefore.stacks, 'inspection reveals seeded contents without rerolling or changing ownership');
    const bagItems = harness.service.loadSave(harness.saveId).view.inventory.containers.find(container => container.id === bagBefore.id)?.items;
    assert.ok(bagItems && bagItems.length > 0);

    const sealedMana = harness.currentState().player.mana.current;
    await harness.send('inspect_career_card', {});
    let careerView = harness.service.loadSave(harness.saveId).view.careerCard;
    assert.equal(careerView.observed, true);
    assert.equal(careerView.active, false, 'inspection and activation are separate actions');
    assert.equal(careerView.career?.id, 'JOB-SUM-NECRO-01');
    await harness.send('activate_career_card', { cardId: 'JOB-SUM-NECRO-01' });
    careerView = harness.service.loadSave(harness.saveId).view.careerCard;
    assert.equal(careerView.active, true);
    assert.equal(careerView.openingSkillLearned, true);
    assert.equal(harness.currentState().player.mana.current, sealedMana, 'activation does not refill Mana');
    assert.equal(harness.currentState().player.career.skills?.length, 1);

    await harness.send('inspect_entity', { entity: { type: 'corpse', id: STAGE07_OPENING_CORPSE_ID } });
    assert.equal(harness.service.loadSave(harness.saveId).view.corpses?.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.label, 'Rook');
    await harness.send('revive', { actorId: 'LI_LAN', corpseId: STAGE07_OPENING_CORPSE_ID });
    const rook = harness.currentState().ownedUnits.find(unit => unit.creationRoute === 'DIRECT_TU_PHUC');
    assert.ok(rook);
    assert.equal(rook.xp, 24);
    assert.equal(rook.xpMirrorEligible, true);
    assert.equal(harness.service.loadSave(harness.saveId).view.units.some(unit => unit.id === rook.id), true);
    assert.equal(harness.currentState().territory.survivalFire.fuelRemaining, null);
    assert.equal(harness.currentState().survival.blocker, 'OPENING_WEATHER_RECORD_NOT_SEEDED');
  } finally {
    await harness.close();
  }
});

test('physical supply and harvest use real inventory; fire stays blocked until its referenced starter ledger is materialized', async () => {
  const harness = createHarness();
  try {
    assert.deepEqual(harness.created.view.inventory.inspectableContainers.map(container => container.containerId), ['LL-CNT-CARRIED-FOOD-BAG-01']);
    const supplySite = world.sites.find(site => site.id === 'SITE-LL01-002')!;
    await harness.startClock();
    await harness.send('move', { actorId: 'LI_LAN', destination: supplySite.position });
    const atSupply = await completeActiveMove(harness);
    assert.ok(atSupply.inventory.inspectableContainers.some(container => container.containerId === 'LL-CNT-SUPPLY-01'));
    assert.equal(harness.currentState().player.position.xMm, supplySite.position.xMm);
    assert.equal(harness.currentState().player.position.yMm, supplySite.position.yMm);

    await harness.send('inspect_starter_container', { containerId: 'LL-CNT-SUPPLY-01' });
    const supply = harness.currentState().inventory.containers.find(container => container.id === 'LL-CNT-SUPPLY-01')!;
    const axe = supply.stacks.find(stack => stack.templateId === 'STONE-AXE');
    assert.ok(axe, 'the source chest supplies a real stone axe');
    const bagId = 'LL-CNT-CARRIED-FOOD-BAG-01';
    const destinationBefore = harness.currentState().inventory.containers.find(container => container.id === bagId)!;
    await harness.send('transfer_item', {
      actorId: 'LI_LAN', sourceContainerId: supply.id, destinationContainerId: bagId, itemId: axe.itemId, quantity: 1,
    });
    const destinationAfter = harness.currentState().inventory.containers.find(container => container.id === bagId)!;
    const carriedAxe = destinationAfter.stacks.find(stack => stack.templateId === 'STONE-AXE');
    assert.equal(carriedAxe?.quantity, 1);
    assert.equal(
      (harness.currentState().inventory.containers.find(container => container.id === supply.id)?.stacks.find(stack => stack.templateId === 'STONE-AXE')?.quantity ?? 0)
        + destinationAfter.stacks.filter(stack => stack.templateId === 'STONE-AXE').reduce((sum, stack) => sum + stack.quantity, 0),
      axe.quantity,
      'splitting a partial stack creates a new item ID while conserving the source quantity',
    );
    assert.equal(destinationAfter.stacks.length, destinationBefore.stacks.length + 1);

    const wood = world.resources.find(resource => resource.id === 'RES-LL01-06')!;
    await harness.send('move', { actorId: 'LI_LAN', destination: wood.location });
    await completeActiveMove(harness);
    const beforeHarvest = harness.currentState();
    const availableWood = beforeHarvest.spatial.resourceBalances.find(balance => balance.resourceId === wood.id)!;
    await harness.send('harvest', {
      actorId: 'LI_LAN', resourceId: wood.id, materialId: wood.materialId, quantity: 1, toolItemId: carriedAxe!.itemId,
    });
    const harvest = harness.currentState().spatial.harvestJobs.at(-1)!;
    assert.equal(harvest.status, 'active');
    await harness.advanceSimulationBy(2 * 60 * 60 * 1000);
    const completedState = harness.currentState();
    const completed = completedState.spatial.harvestJobs.find(job => job.id === harvest.id)!;
    assert.equal(completed.status, 'completed');
    assert.equal(completed.extractedQuantity, 1);
    assert.equal(completedState.spatial.resourceBalances.find(balance => balance.resourceId === wood.id)?.remaining, availableWood.remaining - 1);
    const deliveredWood = completedState.inventory.containers.find(container => container.id === bagId)?.stacks.find(stack => stack.templateId === 'WOOD');
    assert.equal(deliveredWood?.quantity, 1, 'completed real harvest delivers a real WOOD stack to the player bag');

    const beforeFuelAttempt = structuredClone(completedState.inventory.containers.find(container => container.id === bagId)?.stacks);
    const refuelRequest = {
      schemaVersion: 1, saveId: harness.saveId, commandId: 'stage09-refuel-unknown-fuel', expectedRevision: completedState.revision,
      type: 'refuel_fire', payload: { containerId: bagId, itemId: deliveredWood!.itemId, quantity: 1 },
    };
    assert.equal(harness.service.preview(harness.saveId, refuelRequest).availability.reasonCode, 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED');
    await assert.rejects(harness.service.executeCommand(harness.saveId, refuelRequest), error => error.code === 'RULE_NOT_READY');
    assert.deepEqual(harness.currentState().inventory.containers.find(container => container.id === bagId)?.stacks, beforeFuelAttempt);
    assert.equal(harness.currentState().territory.survivalFire.fuelRemaining, null);
    assert.equal(harness.currentState().survival.blocker, 'OPENING_WEATHER_RECORD_NOT_SEEDED');

    const beforeRestart = harness.currentState();
    const recovered = harness.restart();
    const recoveredState = recovered.state;
    assert.equal(recoveredState.simElapsedMs, beforeRestart.simElapsedMs);
    assert.deepEqual(recoveredState.player.position, beforeRestart.player.position);
    assert.deepEqual(recoveredState.playerKnowledge, beforeRestart.playerKnowledge);
    assert.deepEqual(recoveredState.inventory, beforeRestart.inventory);
    assert.deepEqual(recoveredState.spatial.harvestJobs, beforeRestart.spatial.harvestJobs);
    assert.equal(recoveredState.territory.survivalFire.fuelRemaining, null);
    assert.equal(recoveredState.survival.blocker, 'OPENING_WEATHER_RECORD_NOT_SEEDED');
    assert.equal(recoveredState.clockControl.status, 'paused', 'restart policy pauses time without advancing the world');
    assert.ok(recoveredState.lastEventSequence >= beforeRestart.lastEventSequence);
  } finally {
    await harness.close();
  }
});

test('private-world sentinel stays out of views and errors until a real movement discovers its location', async () => {
  const fixtureWorld = structuredClone(world) as WorldDefinition & { sites: WorldDefinition['sites'][number][] };
  const sentinelName = 'STAGE09_PRIVATE_SENTINEL_NEVER_KNOWN_AT_START';
  const sentinelId = 'SITE-STAGE09-PRIVATE-SENTINEL';
  const sentinelPosition = { xMm: 700_000, yMm: 0, sourceZMetres: 0 };
  const template = structuredClone(fixtureWorld.sites.find(site => site.id === 'SITE-LL01-001')!);
  fixtureWorld.sites.push({ ...template, id: sentinelId, name: sentinelName, position: sentinelPosition });
  const state = createNewGame({
    saveId: 'stage09-sentinel-save', campaignId: 'stage09-sentinel-campaign', soulId: 'LI_LAN',
    worldPackageId: world.id, rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion, seed: 'stage09-sentinel-seed',
  }, world);
  const initialView = projectPlayerView(state, fixtureWorld);
  const initialPayload = JSON.stringify(initialView);
  assert.equal(initialPayload.includes(sentinelName), false);
  assert.equal(initialPayload.includes(sentinelId), false);
  assert.equal(initialPayload.includes(JSON.stringify(sentinelPosition)), false);
  assert.equal(state.playerKnowledge.knownSiteIds.includes(sentinelId), false);

  const denied = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'stage09-unknown-inspection', expectedRevision: state.revision,
    type: 'inspect_entity', payload: { entity: { type: 'site', id: sentinelId } },
  }, fixtureWorld);
  assert.equal(denied.receipt.accepted, false);
  assert.equal(denied.receipt.code, 'NOT_ACCESSIBLE');
  assert.equal(JSON.stringify(denied.receipt).includes(sentinelName), false);

  const move = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'stage09-discover-by-movement', expectedRevision: state.revision,
    type: 'move', payload: { actorId: 'LI_LAN', destination: sentinelPosition },
  }, fixtureWorld);
  assert.equal(move.receipt.accepted, true);
  const order = move.state.travel.orders.find(candidate => candidate.status === 'active')!;
  const duration = order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
  const arrived = advanceTo(move.state, move.state.simElapsedMs + duration + 1, {}, fixtureWorld).state;
  assert.ok(arrived.playerKnowledge.knownSiteIds.includes(sentinelId));
  const revealed = projectPlayerView(arrived, fixtureWorld).visibleMap.entities.find(entity => entity.ref.type === 'site' && entity.ref.id === sentinelId);
  assert.equal(revealed?.label, sentinelName, 'a sentinel is allowed to appear after the player physically discovers it');
});
