import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { OPENING_BUILDINGS, LORD_HOUSE_REPAIR } from '../../content/src/buildings.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { createNewGame } from '../src/initializer.ts';
import { canonicalStateHash } from '../src/hash.ts';
import { advanceTo, MINUTE_MS } from '../src/time.ts';
import { previewCommand, reduceCommand } from '../src/reducer.ts';
import { projectPlayerView } from '../src/view.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { GameApplicationService } from '../../api/src/service.ts';

let serial = 0;

function freshState() {
  serial += 1;
  return createNewGame({
    saveId: `stage06-save-${serial}`,
    campaignId: `stage06-campaign-${serial}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `stage06-seed-${serial}`,
  }, world);
}

function envelope(state: Pick<ReturnType<typeof freshState>, 'saveId' | 'revision'>, commandId: string, type: string, payload: Record<string, unknown>) {
  return { schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload };
}

function addFixtureStack(state: ReturnType<typeof freshState>, templateId: string, quantity: number, itemId: string) {
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  bag.observed = true;
  bag.stacks = [...bag.stacks, {
    itemId, templateId, quantity, reservedQuantity: 0, unit: templateId === 'BREAD' ? 'food-unit' : 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null,
    ...(templateId === 'BREAD' ? { foodUnitsPerItem: 1 } : {}), provenance: 'illustration_fixture' as const,
  }];
  return bag;
}

function at(state: ReturnType<typeof freshState>, position: { xMm: number; yMm: number; sourceZMetres?: number }) {
  state.player.position = position;
  state.player.location = { kind: 'field', coordinate: position };
  return state;
}

function apply(state: ReturnType<typeof freshState>, id: string, type: string, payload: Record<string, unknown>) {
  const result = reduceCommand(state, envelope(state, id, type, payload), world);
  assert.equal(result.receipt.accepted, true, `${type} rejected: ${result.receipt.code}`);
  return result.state;
}

function repairReadyState() {
  let state = freshState();
  const house = state.buildings.find(building => building.kind === 'lord_house')!;
  const bag = addFixtureStack(state, 'WOOD', 50, `FIXTURE-WOOD-${serial}`);
  bag.stacks = [...bag.stacks, {
    itemId: `FIXTURE-STONE-${serial}`, templateId: 'STONE', quantity: 30, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }, {
    itemId: `FIXTURE-HAMMER-${serial}`, templateId: 'STONE-HAMMER', quantity: 4, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  state = at(state, house.position!);
  const started = apply(state, 'repair-house', 'repair', { actorId: state.player.id, buildingId: house.id, containerId: bag.id });
  return advanceTo(started, 17 * MINUTE_MS, {}, world).state;
}

function prepareFarmMaterials(state: ReturnType<typeof freshState>) {
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  const wood = bag.stacks.find(stack => stack.templateId === 'WOOD')!;
  const stone = bag.stacks.find(stack => stack.templateId === 'STONE')!;
  assert.equal(wood.quantity - (wood.reservedQuantity ?? 0), 30);
  assert.equal(stone.quantity - (stone.reservedQuantity ?? 0), 20);
  state.player.position = { xMm: 5_000, yMm: 0, sourceZMetres: 0 };
  state.player.location = { kind: 'field', coordinate: state.player.position };
  return bag;
}

function farmBuildCommand(state: ReturnType<typeof freshState>, id: string, position = { xMm: 5_000, yMm: 0, sourceZMetres: 0 }) {
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  return envelope(state, id, 'build', {
    actorId: state.player.id,
    blueprintId: 'BP-OPEN-FARMHOUSE-01',
    siteId: 'SITE-LL01-000',
    containerId: bag.id,
    position,
  });
}

test('Stage 06 registry is fixed and a valid coordinate is required for a construction command', () => {
  assert.equal(OPENING_BUILDINGS.length, 11);
  assert.deepEqual(LORD_HOUSE_REPAIR.completionUnlocks, OPENING_BUILDINGS.map(blueprint => blueprint.id));
  const fresh = freshState();
  const view = projectPlayerView(fresh, world);
  assert.equal(view.construction.blueprints.length, 0, 'unrepaired Lord House must not publish future construction choices');
  assert.deepEqual(view.construction.unlockedBlueprintIds, []);
  assert.equal(view.construction.blueprints.some(item => /D1|charcoal|blueprint/i.test(item.id + item.name)), false);
  assert.equal(validateCommandEnvelope({ ...farmBuildCommand(fresh, 'missing-position'), payload: {
    actorId: fresh.player.id, blueprintId: 'BP-OPEN-FARMHOUSE-01', siteId: 'SITE-LL01-000', containerId: 'LL-CNT-CARRIED-FOOD-BAG-01',
  } }).success, false);
});

test('repair preview is side-effect free, reserves exact materials, and completion unlocks exactly eleven blueprints once', () => {
  let state = freshState();
  const house = state.buildings.find(building => building.kind === 'lord_house')!;
  const bag = addFixtureStack(state, 'WOOD', 20, `WOOD-REPAIR-${serial}`);
  bag.stacks = [...bag.stacks, {
    itemId: `STONE-REPAIR-${serial}`, templateId: 'STONE', quantity: 10, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }, {
    itemId: `HAMMER-REPAIR-${serial}`, templateId: 'STONE-HAMMER', quantity: 1, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  at(state, house.position!);
  const repair = envelope(state, 'repair-exact', 'repair', { actorId: state.player.id, buildingId: house.id, containerId: bag.id });
  const beforeHash = canonicalStateHash(state);
  const preview = previewCommand(state, repair, world);
  assert.equal(preview.enabled, true);
  assert.equal(canonicalStateHash(state), beforeHash);
  const started = reduceCommand(state, repair, world);
  assert.equal(started.receipt.accepted, true);
  const wood = started.state.inventory.containers.find(item => item.id === bag.id)!.stacks.find(item => item.templateId === 'WOOD')!;
  const stone = started.state.inventory.containers.find(item => item.id === bag.id)!.stacks.find(item => item.templateId === 'STONE')!;
  const hammer = started.state.inventory.containers.find(item => item.id === bag.id)!.stacks.find(item => item.templateId === 'STONE-HAMMER')!;
  assert.deepEqual([wood.quantity, wood.reservedQuantity, stone.quantity, stone.reservedQuantity], [20, 20, 10, 10]);
  assert.deepEqual([hammer.quantity, hammer.reservedQuantity], [1, 1]);
  const replay = reduceCommand(started.state, repair, world);
  assert.equal(replay.receipt.accepted, true);
  assert.equal(replay.state.construction.jobs.length, 1);
  assert.equal(replay.state.inventory.containers.find(item => item.id === bag.id)!.stacks.find(item => item.templateId === 'WOOD')!.reservedQuantity, 20);

  const result = advanceTo(started.state, 17 * MINUTE_MS, {}, world);
  assert.equal(result.state.simElapsedMs, 17 * MINUTE_MS);
  assert.equal(result.state.buildings.find(item => item.id === house.id)!.status, 'active');
  assert.equal(result.state.territory.repaired, true);
  assert.deepEqual(result.state.construction.unlockedBlueprintIds, OPENING_BUILDINGS.map(blueprint => blueprint.id));
  assert.equal(projectPlayerView(result.state, world).construction.blueprints.length, 11,
    'completed Lord House repair makes the eleven blueprints visible to the player');
  const after = result.state.inventory.containers.find(item => item.id === bag.id)!.stacks;
  assert.equal(after.some(item => item.templateId === 'WOOD' || item.templateId === 'STONE'), false);
  const returnedHammer = after.find(item => item.templateId === 'STONE-HAMMER')!;
  assert.deepEqual([returnedHammer.quantity, returnedHammer.reservedQuantity], [1, 0]);
  assert.equal(result.events.filter(event => event.type === 'lord_house_repaired').length, 1);
  assert.equal(result.state.construction.rewardEntitlements[0].status, 'pending');
  assert.equal(result.state.construction.rewardEntitlements[0].rewardContract, 'ACHIEVEMENT-SKILL-FIT-1.0');
  assert.equal(result.state.construction.jobs[0].status, 'completed');
});

test('cancel discards work and releases every reservation without consuming resources', () => {
  let state = freshState();
  const house = state.buildings.find(building => building.kind === 'lord_house')!;
  const bag = addFixtureStack(state, 'WOOD', 20, `WOOD-CANCEL-${serial}`);
  bag.stacks = [...bag.stacks, {
    itemId: `STONE-CANCEL-${serial}`, templateId: 'STONE', quantity: 10, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }, {
    itemId: `HAMMER-CANCEL-${serial}`, templateId: 'STONE-HAMMER', quantity: 1, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  at(state, house.position!);
  state = apply(state, 'repair-to-cancel', 'repair', { actorId: state.player.id, buildingId: house.id, containerId: bag.id });
  state = advanceTo(state, 5 * MINUTE_MS, {}, world).state;
  const result = reduceCommand(state, envelope(state, 'cancel-repair', 'cancel_construction_job', { jobId: state.construction.jobs[0].id }), world);
  assert.equal(result.receipt.accepted, true);
  const stacks = result.state.inventory.containers.find(item => item.id === bag.id)!.stacks;
  assert.deepEqual(stacks.filter(stack => ['WOOD', 'STONE', 'STONE-HAMMER'].includes(stack.templateId)).map(stack => [stack.templateId, stack.quantity, stack.reservedQuantity]), [['WOOD', 20, 0], ['STONE', 10, 0], ['STONE-HAMMER', 1, 0]]);
  assert.equal(result.state.construction.jobs[0].status, 'cancelled');
  assert.equal(result.state.construction.jobs[0].progressTicks, 25);
  assert.equal(result.state.territory.repaired, false);
});

test('each assigned repair worker needs its own reserved stone hammer', () => {
  let state = freshState();
  const house = state.buildings.find(building => building.kind === 'lord_house')!;
  const bag = addFixtureStack(state, 'WOOD', 20, `WOOD-TOOLS-${serial}`);
  bag.stacks = [...bag.stacks, {
    itemId: `STONE-TOOLS-${serial}`, templateId: 'STONE', quantity: 10, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }, {
    itemId: `HAMMER-TOOLS-${serial}`, templateId: 'STONE-HAMMER', quantity: 1, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  at(state, house.position!);
  state = apply(state, 'repair-one-tool', 'repair', { actorId: state.player.id, buildingId: house.id, containerId: bag.id });
  const workerId = 'TEST-REPAIR-WORKER';
  state.ownedUnits.push({
    id: workerId, templateId: 'TEST-WORKER', name: 'Repair worker fixture', creationRoute: 'illustration_fixture',
    level: 1, xp: 0, ownerId: state.player.id, position: house.position!, location: { kind: 'field', coordinate: house.position! }, equipmentIds: [],
    sourceStats: { formTier: 0, grade: 'fixture', level: 1, xp: 0, faction: 'DARK', hero: false, loyalty: 'ABSOLUTE_TO_LI_LAN' },
    anatomyTemplateId: 'TEST-WORKER', equipmentRequirements: { status: 'source_profile_not_compiled', requiredSlotIds: [] },
    xpMirrorEligible: false, baseLaborRateWuPerHour: 1, laborRuleVersion: 'LL01-CONSTRUCTION-LABOR-1.0', constructionModifiers: {},
  });
  const jobId = state.construction.jobs[0].id;
  const withoutTool = reduceCommand(state, envelope(state, 'assign-without-tool', 'assign_construction_workers', { jobId, workerIds: [state.player.id, workerId] }), world);
  assert.equal(withoutTool.receipt.accepted, false);
  assert.equal(withoutTool.receipt.code, 'REQUIRED_TOOL_UNAVAILABLE');
  assert.equal(withoutTool.state.construction.jobs[0].workerIds.length, 1);
  state = withoutTool.state;
  const accessibleBag = state.inventory.containers.find(container => container.id === bag.id)!;
  accessibleBag.stacks = [...accessibleBag.stacks, {
    itemId: `HAMMER-TOOLS-2-${serial}`, templateId: 'STONE-HAMMER', quantity: 1, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  const withTool = reduceCommand(state, envelope(state, 'assign-with-tool', 'assign_construction_workers', { jobId, workerIds: [state.player.id, workerId] }), world);
  assert.equal(withTool.receipt.accepted, true);
  const job = withTool.state.construction.jobs[0];
  assert.deepEqual(job.toolReservations.map(item => item.workerId).sort(), [state.player.id, workerId].sort());
  assert.equal(withTool.state.inventory.containers.find(container => container.id === bag.id)!.stacks.filter(item => item.templateId === 'STONE-HAMMER').reduce((sum, item) => sum + (item.reservedQuantity ?? 0), 0), 2);
});

test('farmhouse reservation prevents parallel spending and active build footprints cannot overlap', () => {
  let state = repairReadyState();
  const bag = prepareFarmMaterials(state);
  const first = farmBuildCommand(state, 'farm-first');
  assert.equal(previewCommand(state, first, world).enabled, true);
  state = reduceCommand(state, first, world).state;
  const job = state.construction.jobs.at(-1)!;
  assert.deepEqual(job.costReservations.map(item => [item.templateId, item.quantity]), [['WOOD', 30], ['STONE', 10]]);
  assert.equal(job.buildingId, 'LL-BLD-FARMHOUSE-01-01');

  state.ownedUnits.push({
    id: 'TEST-WORKER-AVAILABLE', templateId: 'TEST-WORKER', name: 'Integration fixture worker', creationRoute: 'illustration_fixture',
    level: 1, xp: 0, ownerId: state.player.id, position: { xMm: 5_000, yMm: 0, sourceZMetres: 0 },
    location: { kind: 'field', coordinate: { xMm: 5_000, yMm: 0, sourceZMetres: 0 } }, equipmentIds: [],
    sourceStats: { formTier: 0, grade: 'fixture', level: 1, xp: 0, faction: 'DARK', hero: false, loyalty: 'ABSOLUTE_TO_LI_LAN' },
    anatomyTemplateId: 'TEST-WORKER', equipmentRequirements: { status: 'source_profile_not_compiled', requiredSlotIds: [] },
    xpMirrorEligible: false, baseLaborRateWuPerHour: 1, laborRuleVersion: 'LL01-CONSTRUCTION-LABOR-1.0', constructionModifiers: {},
  });
  state.ownedUnits.push({
    id: 'TEST-WORKER-FAR', templateId: 'TEST-WORKER', name: 'Second integration fixture worker', creationRoute: 'illustration_fixture',
    level: 1, xp: 0, ownerId: state.player.id, position: { xMm: 15_000, yMm: 0, sourceZMetres: 0 },
    location: { kind: 'field', coordinate: { xMm: 15_000, yMm: 0, sourceZMetres: 0 } }, equipmentIds: [],
    sourceStats: { formTier: 0, grade: 'fixture', level: 1, xp: 0, faction: 'DARK', hero: false, loyalty: 'ABSOLUTE_TO_LI_LAN' },
    anatomyTemplateId: 'TEST-WORKER', equipmentRequirements: { status: 'source_profile_not_compiled', requiredSlotIds: [] },
    xpMirrorEligible: false, baseLaborRateWuPerHour: 1, laborRuleVersion: 'LL01-CONSTRUCTION-LABOR-1.0', constructionModifiers: {},
  });
  const second = farmBuildCommand(state, 'farm-second', { xMm: 8_500, yMm: 0, sourceZMetres: 0 });
  second.payload.actorId = 'TEST-WORKER-AVAILABLE';
  const secondPreview = previewCommand(state, second, world);
  assert.equal(secondPreview.enabled, false);
  assert.equal(secondPreview.reasonCode, 'BUILDING_FOOTPRINT_COLLISION');
  const farther = farmBuildCommand(state, 'farm-third', { xMm: 15_000, yMm: 0, sourceZMetres: 0 });
  farther.payload.actorId = 'TEST-WORKER-FAR';
  const fartherPreview = previewCommand(state, farther, world);
  assert.equal(fartherPreview.enabled, false);
  assert.equal(fartherPreview.reasonCode, 'INSUFFICIENT_UNRESERVED_MATERIAL');
  assert.equal(state.inventory.containers.find(item => item.id === bag.id)!.stacks.find(stack => stack.templateId === 'WOOD')!.reservedQuantity, 30);
});

test('one actual worker completes the farmhouse in 45 minutes and two complete it in 30', () => {
  const oneWorkerReady = repairReadyState();
  prepareFarmMaterials(oneWorkerReady);
  const oneStarted = reduceCommand(oneWorkerReady, farmBuildCommand(oneWorkerReady, 'farm-one-worker'), world);
  assert.equal(oneStarted.receipt.accepted, true);
  const oneDone = advanceTo(oneStarted.state, oneStarted.state.simElapsedMs + 45 * MINUTE_MS, {}, world);
  assert.equal(oneDone.state.construction.jobs.find(job => job.kind === 'build')!.completedAtElapsedMs, oneStarted.state.simElapsedMs + 45 * MINUTE_MS);
  assert.equal(oneDone.state.buildings.some(building => building.blueprintId === 'BP-OPEN-FARMHOUSE-01' && building.status === 'active'), true);

  let twoWorkerReady = repairReadyState();
  twoWorkerReady = apply(twoWorkerReady, 'enqueue-real-worker', 'enqueue_tomb', { blueprintId: 'LL-TOMB-ZOMBIE-STANDARD-01' });
  twoWorkerReady = advanceTo(twoWorkerReady, twoWorkerReady.simElapsedMs + 20 * MINUTE_MS, {}, world).state;
  assert.equal(twoWorkerReady.ownedUnits.some(unit => unit.creationRoute === 'TOMB_QUEUE'), true);
  const unit = twoWorkerReady.ownedUnits.find(candidate => candidate.creationRoute === 'TOMB_QUEUE')!;
  assert.equal(unit.position?.xMm, world.origin.xMm);
  prepareFarmMaterials(twoWorkerReady);
  const twoStarted = reduceCommand(twoWorkerReady, farmBuildCommand(twoWorkerReady, 'farm-two-workers'), world);
  assert.equal(twoStarted.receipt.accepted, true);
  const jobId = twoStarted.state.construction.jobs.find(job => job.kind === 'build')!.id;
  const assigned = reduceCommand(twoStarted.state, envelope(twoStarted.state, 'assign-real-worker', 'assign_construction_workers', { jobId, workerIds: ['LI_LAN', unit.id] }), world);
  assert.equal(assigned.receipt.accepted, true);
  assert.equal(assigned.state.construction.jobs.find(candidate => candidate.kind === 'build')!.workerIds.length, 2);
  const startAt = assigned.state.simElapsedMs;
  const twoDone = advanceTo(assigned.state, startAt + 30 * MINUTE_MS, {}, world);
  assert.equal(twoDone.state.construction.jobs.find(job => job.kind === 'build')!.completedAtElapsedMs, startAt + 30 * MINUTE_MS);
  assert.deepEqual(twoDone.state.construction.rewardEntitlements.map(item => item.achievementId), ['ACH-OPEN-LORD-HOUSE', 'ACH-OPEN-POLAR-HOUSE']);
  assert.deepEqual(twoDone.state.construction.rewardEntitlements.map(item => item.status), ['pending', 'pending']);
  assert.equal(twoDone.state.construction.rewardEntitlements[1].blocker, 'FIRST_WORLDWIDE_TRIGGER_NOT_SETTLED');
  assert.equal(twoDone.events.some(event => event.type === 'construction_reward_entitlement_pending' && event.payload.rewardNotMinted === true), true);
});

test('farmhouse recruitment charges five exact FOOD units per resident and enforces real housing capacity', () => {
  let state = freshState();
  const farmhouse = {
    id: 'TEST-FARMHOUSE', kind: 'polar_farmhouse', name: 'Integration fixture farmhouse', level: 1, status: 'active' as const,
    repairRequirements: [], siteId: 'H0', position: { xMm: 5_000, yMm: 0, sourceZMetres: 0 }, blueprintId: 'BP-OPEN-FARMHOUSE-01',
    footprintAreaM2: 12, constructionRuleVersion: 'POLAR-FARMHOUSE-PROGRESSION-2.0',
  };
  state.buildings.push(farmhouse);
  at(state, farmhouse.position!);
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  bag.observed = true;
  bag.stacks = [...bag.stacks, { itemId: `FOOD-RECRUIT-${serial}`, templateId: 'DRIED-MEAT', quantity: 20, reservedQuantity: 0, unit: 'food-unit', ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, foodUnitsPerItem: 0.5, provenance: 'illustration_fixture' }];
  state = apply(state, 'recruit-two', 'recruit_resident', { buildingId: farmhouse.id, containerId: bag.id, quantity: 2 });
  assert.equal(state.inventory.containers.find(item => item.id === bag.id)!.stacks.some(item => item.templateId === 'DRIED-MEAT'), false);
  assert.equal(state.construction.residents.length, 2);
  assert.equal(projectPlayerView(state, world).construction.farmerHouseCapacity, 4);
  assert.equal(projectPlayerView(state, world).construction.occupiedHousing, 2);
  const overCapacity = reduceCommand(state, envelope(state, 'recruit-over-capacity', 'recruit_resident', { buildingId: farmhouse.id, containerId: bag.id, quantity: 3 }), world);
  assert.equal(overCapacity.receipt.accepted, false);
  assert.equal(overCapacity.receipt.code, 'HOUSING_CAPACITY_EXCEEDED');
  assert.equal(overCapacity.state.inventory.containers.find(item => item.id === bag.id)!.stacks.some(item => item.templateId === 'DRIED-MEAT'), false);
  assert.equal(overCapacity.state.construction.residents.length, 2);
  assert.equal(state.construction.rewardEntitlements.length, 0);
});

test('the constructed heater runs one conserved 20-minute local heat service', () => {
  let state = repairReadyState();
  const heater = {
    id: 'TEST-HEATER', kind: 'heater', name: 'Integration fixture heater', level: 1, status: 'active' as const,
    repairRequirements: [], siteId: 'SITE-LL01-000', position: { xMm: 5_000, yMm: 0, sourceZMetres: 0 }, blueprintId: 'BP-OPEN-HEATER-01',
    footprintAreaM2: 0.5, constructionRuleVersion: 'OPENING-FIXED-BUILDINGS-2.0',
  };
  state.buildings.push(heater);
  const bag = state.inventory.containers.find(container => container.kind === 'carried_bag')!;
  state.player.position = heater.position;
  state.player.location = { kind: 'field', coordinate: heater.position };
  const start = envelope(state, 'heater-run', 'operate_heater', { actorId: state.player.id, buildingId: heater.id, containerId: bag.id });
  assert.equal(previewCommand(state, start, world).enabled, true);
  const started = reduceCommand(state, start, world);
  assert.equal(started.receipt.accepted, true);
  assert.equal(started.state.construction.operatingServices?.[0].completesAtElapsedMs, state.simElapsedMs + 20 * MINUTE_MS);
  const wood = started.state.inventory.containers.find(container => container.id === bag.id)!.stacks.find(stack => stack.templateId === 'WOOD')!;
  assert.deepEqual([wood.quantity, wood.reservedQuantity], [30, 1]);
  assert.equal(projectPlayerView(started.state, world).construction.operatingServices[0].heatDeltaCelsius.min, 15);
  const beforeCold = started.state.survival.coldLoadMicro;
  const completed = advanceTo(started.state, started.state.simElapsedMs + 20 * MINUTE_MS, {}, world);
  assert.equal(completed.state.construction.operatingServices?.[0].status, 'completed');
  const finalWood = completed.state.inventory.containers.find(container => container.id === bag.id)!.stacks.find(stack => stack.templateId === 'WOOD')!;
  assert.deepEqual([finalWood.quantity, finalWood.reservedQuantity], [29, 0]);
  assert.equal(completed.state.survival.coldLoadMicro, beforeCold);
  assert.equal(completed.events.filter(event => event.type === 'heater_service_completed').length, 1);
});

test('split, merge, transfer and consume preserve quantities and reject reserved inventory', () => {
  let state = freshState();
  const bag = addFixtureStack(state, 'STONE', 10, `STONE-STACK-${serial}`);
  const stone = bag.stacks.find(item => item.templateId === 'STONE')!;
  state = apply(state, 'split-stone', 'split_stack', { actorId: state.player.id, containerId: bag.id, itemId: stone.itemId, quantity: 4 });
  let stones = state.inventory.containers.find(item => item.id === bag.id)!.stacks.filter(item => item.templateId === 'STONE');
  assert.equal(stones.reduce((sum, stack) => sum + stack.quantity, 0), 10);
  assert.equal(stones.length, 2);
  state = apply(state, 'merge-stone', 'merge_stacks', { actorId: state.player.id, containerId: bag.id, sourceItemId: stones[1].itemId, targetItemId: stones[0].itemId });
  stones = state.inventory.containers.find(item => item.id === bag.id)!.stacks.filter(item => item.templateId === 'STONE');
  assert.deepEqual(stones.map(stack => stack.quantity), [10]);

  const breadBag = addFixtureStack(state, 'BREAD', 8, `BREAD-CONSUME-${serial}`);
  state = apply(state, 'eat-bread', 'consume_item', { actorId: state.player.id, containerId: breadBag.id, itemId: `BREAD-CONSUME-${serial}`, quantity: 3 });
  assert.equal(state.inventory.containers.find(item => item.id === breadBag.id)!.stacks.find(item => item.itemId === `BREAD-CONSUME-${serial}`)!.quantity, 5);

  const supply = state.inventory.containers.find(container => container.kind === 'territory_supply')!;
  supply.observed = true;
  const woodId = `RESERVED-WOOD-${serial}`;
  supply.stacks.push({ itemId: woodId, templateId: 'WOOD', quantity: 5, reservedQuantity: 2, unit: 'item', ownerId: 'H0', equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture' });
  const supplyPosition = world.sites.find(site => site.id === 'SITE-LL01-002')!.position;
  at(state, supplyPosition);
  const transfer = reduceCommand(state, envelope(state, 'over-transfer', 'transfer_item', {
    actorId: state.player.id, sourceContainerId: supply.id, destinationContainerId: breadBag.id, itemId: woodId, quantity: 4,
  }), world);
  assert.equal(transfer.receipt.accepted, false);
  assert.equal(transfer.receipt.code, 'ITEM_QUANTITY_UNAVAILABLE');
  const splitReserved = reduceCommand(state, envelope(state, 'split-reserved', 'split_stack', {
    actorId: state.player.id, containerId: supply.id, itemId: woodId, quantity: 1,
  }), world);
  assert.equal(splitReserved.receipt.accepted, false);
  assert.equal(splitReserved.receipt.code, 'ITEM_CANNOT_BE_SPLIT');
  const validTransfer = reduceCommand(state, envelope(state, 'transfer-free', 'transfer_item', {
    actorId: state.player.id, sourceContainerId: supply.id, destinationContainerId: breadBag.id, itemId: woodId, quantity: 3,
  }), world);
  assert.equal(validTransfer.receipt.accepted, true);
  const sourceWood = validTransfer.state.inventory.containers.find(item => item.id === supply.id)!.stacks.find(item => item.itemId === woodId)!;
  assert.deepEqual([sourceWood.quantity, sourceWood.reservedQuantity], [2, 2]);
});

test('construction time settlement is deterministic across different advance chunks', () => {
  const base = repairReadyState();
  prepareFarmMaterials(base);
  const started = reduceCommand(base, farmBuildCommand(base, 'farm-chunking'), world);
  assert.equal(started.receipt.accepted, true);
  const target = started.state.simElapsedMs + 45 * MINUTE_MS;
  const long = advanceTo(started.state, target, {}, world);
  let short = started.state;
  const shortEvents: string[] = [];
  for (const minutes of [5, 10, 15, 20, 25, 30, 35, 40, 45]) {
    const result = advanceTo(short, started.state.simElapsedMs + minutes * MINUTE_MS, {}, world);
    short = result.state;
    shortEvents.push(...result.events.map(event => `${event.occurredAtElapsedMs}:${event.type}:${JSON.stringify(event.payload)}`));
  }
  assert.equal(canonicalStateHash(long.state), canonicalStateHash(short));
  assert.deepEqual(long.events.map(event => `${event.occurredAtElapsedMs}:${event.type}:${JSON.stringify(event.payload)}`), shortEvents);
  assert.equal(long.state.simElapsedMs, target);
  assert.equal(long.state.construction.jobs.find(job => job.kind === 'build')!.status, 'completed');
});

test('completed construction, inventory and pending first-build rewards survive a SQLite save reload', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage06-reload-'));
  const databasePath = resolve(directory, 'save.sqlite');
  let state = repairReadyState();
  prepareFarmMaterials(state);
  const started = reduceCommand(state, farmBuildCommand(state, 'reload-farmhouse'), world);
  assert.equal(started.receipt.accepted, true);
  const completed = advanceTo(started.state, started.state.simElapsedMs + 45 * MINUTE_MS, {}, world).state;
  const storedFixture = JSON.parse(JSON.stringify({ ...completed, receipts: [] }));
  const expectedHash = canonicalStateHash(storedFixture);
  const repository = new SqliteRepository(databasePath);
  const saved = repository.createSaveIdempotent({
    ownerId: 'local-owner', creationKey: 'stage06-reload', requestSha256: canonicalStateHash({ saveId: completed.saveId, revision: completed.revision }),
    slotName: 'Stage 06 reload', makeState: () => structuredClone(storedFixture),
  });
  assert.equal(canonicalStateHash(saved.state), expectedHash);
  repository.close();
  const reloadedRepository = new SqliteRepository(databasePath);
  const reloaded = reloadedRepository.loadSave('local-owner', saved.saveId).state;
  assert.equal(canonicalStateHash(reloaded), expectedHash);
  assert.equal(reloaded.buildings.some(building => building.blueprintId === 'BP-OPEN-FARMHOUSE-01' && building.status === 'active'), true);
  assert.equal(reloaded.construction.rewardEntitlements.filter(item => item.status === 'pending').length, 2);
  const bag = reloaded.inventory.containers.find(container => container.kind === 'carried_bag')!;
  assert.equal(bag.stacks.some(stack => stack.templateId === 'WOOD'), false);
  assert.equal(bag.stacks.find(stack => stack.templateId === 'STONE')!.quantity, 10);
  reloadedRepository.close();
  rmSync(directory, { recursive: true, force: true });
});

test('SQLite application commits construction and reward journal events exactly once', async () => {
  let now = 0;
  const repository = new SqliteRepository(':memory:');
  let state = freshState();
  const house = state.buildings.find(building => building.kind === 'lord_house')!;
  const bag = addFixtureStack(state, 'WOOD', 20, `API-WOOD-${serial}`);
  bag.stacks = [...bag.stacks, {
    itemId: `API-STONE-${serial}`, templateId: 'STONE', quantity: 10, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }, {
    itemId: `API-HAMMER-${serial}`, templateId: 'STONE-HAMMER', quantity: 1, reservedQuantity: 0, unit: 'item',
    ownerId: state.player.id, equipped: false, equippedSlotId: null, quality: null, provenance: 'illustration_fixture',
  }];
  state.player.position = house.position!;
  state.player.location = { kind: 'field', coordinate: house.position! };
  state = JSON.parse(JSON.stringify(state));
  repository.createSaveIdempotent({ ownerId: 'local-owner', creationKey: 'stage06-api', requestSha256: canonicalStateHash('stage06-api'), slotName: 'Stage 06 API', makeState: () => state });
  const service = new GameApplicationService(repository, world, { monotonicNow: () => now, leaseMs: 2 * 60 * MINUTE_MS, timersEnabled: false });
  const saveId = state.saveId;
  const opened = repository.loadSave('local-owner', saveId).state;
  await service.heartbeatClock(saveId, 'stage06-session', 'stage06-tab');
  const repair = await service.executeCommand(saveId, envelope(opened, 'api-repair', 'repair', {
    actorId: opened.player.id, buildingId: house.id, containerId: bag.id,
  }));
  assert.equal(repair.receipt.accepted, true);
  const clock = await service.executeCommand(saveId, envelope(repair.view, 'api-clock', 'set_clock_speed', { speed: '1x', stopCondition: 'none' }), { sessionToken: 'stage06-session', driverId: 'stage06-tab' });
  assert.equal(clock.receipt.accepted, true);
  now = 17 * MINUTE_MS;
  await service.settleClockBeforeCommand(saveId);
  const playerEvents = service.playerEvents(saveId, 0, 100).events;
  assert.equal(playerEvents.filter(event => event.type === 'lord_house_repaired').length, 1);
  assert.equal(playerEvents.filter(event => event.type === 'construction_reward_entitlement_pending').length, 1);
  assert.equal(playerEvents.some(event => event.type === 'lord_house_repair_started'), true);
  repository.close();
});
