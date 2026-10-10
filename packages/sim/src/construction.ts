import type {
  ActionAvailability, CommandEvent, ConstructionBlueprintView, ConstructionJobState, ConstructionResidentState, OperatingServiceState,
  GameState, WorldDefinition,
} from '../../contracts/src/index.ts';
import {
  BUILDING_PLACEMENT_OVERLAY, CONSTRUCTION_LABOR_OVERLAY, HOUSE_REPAIR_RULE_VERSION, LORD_HOUSE_REPAIR,
  OPENING_BUILDINGS, OPENING_BUILDINGS_RULE_VERSION,
} from '../../content/src/buildings.ts';
import { canAccessStarterContainer } from './access.ts';

const HOUR_MS = 3_600_000;
const WORK_TICKS_PER_WU = 300;
export const HEATER_SERVICE_DURATION_MS = 20 * 60_000;
const FARMHOUSE_ID = 'BP-OPEN-FARMHOUSE-01';
const HOUSE_SITE_ID = 'SITE-LL01-001';
const CAMP_SITE_ID = 'SITE-LL01-000';

type BuildRequest = { actorId: string; blueprintId: string; siteId: string; containerId: string; position: { xMm: number; yMm: number; sourceZMetres?: number } };
type RepairRequest = { actorId: string; buildingId: string; containerId: string };

function event(type: string, at: number, payload: Record<string, unknown>): CommandEvent {
  return { sequence: 0, type, occurredAtElapsedMs: at, payload };
}

function definitionFor(state: GameState, blueprintId: string) {
  if (state.construction.registryVersion !== OPENING_BUILDINGS_RULE_VERSION) return undefined;
  if (!state.construction.unlockedBlueprintIds.includes(blueprintId)) return undefined;
  return OPENING_BUILDINGS.find(definition => definition.id === blueprintId && definition.buildableFromThisEvidence);
}

function actorPosition(state: GameState, actorId: string) {
  if (actorId === state.player.id) return state.player.position;
  return state.ownedUnits.find(unit => unit.id === actorId)?.position ?? null;
}

function actorBaseRate(state: GameState, actorId: string): number {
  if (actorId === state.player.id) return CONSTRUCTION_LABOR_OVERLAY.defaultPlayerWuPerHour;
  return state.ownedUnits.find(unit => unit.id === actorId)?.baseLaborRateWuPerHour ?? 0;
}

function actorConditionFactors(state: GameState, actorId: string) {
  const stored = actorId === state.player.id
    ? state.player.constructionModifiers
    : state.ownedUnits.find(unit => unit.id === actorId)?.constructionModifiers;
  return { ...CONSTRUCTION_LABOR_OVERLAY.defaultActorConditionFactors, ...(stored ?? {}) };
}

function validConditionFactors(factors: ReturnType<typeof actorConditionFactors>): boolean {
  return Object.values(factors).every(value => Number.isFinite(value) && value >= 0 && value <= 1.25);
}

function isActorBusy(state: GameState, actorId: string, exceptJobId?: string): boolean {
  if (state.travel.orders.some(order => order.status === 'active' && order.actorIds.includes(actorId))) return true;
  if (state.spatial.searchJobs.some(job => job.status === 'active' && job.actorIds.includes(actorId))) return true;
  if (state.spatial.harvestJobs.some(job => job.status === 'active' && job.actorIds.includes(actorId))) return true;
  return state.construction.jobs.some(job => job.id !== exceptJobId && (job.status === 'active' || job.status === 'blocked') && job.workerIds.includes(actorId));
}

function actorExists(state: GameState, actorId: string): boolean {
  return actorId === state.player.id || state.ownedUnits.some(unit => unit.id === actorId);
}

function workerAvailableAt(state: GameState, actorId: string, position: { xMm: number; yMm: number }, exceptJobId?: string): boolean {
  const actorPositionValue = actorPosition(state, actorId);
  if (!actorPositionValue || actorBaseRate(state, actorId) <= 0 || isActorBusy(state, actorId, exceptJobId)) return false;
  const distance = Math.hypot(actorPositionValue.xMm - position.xMm, actorPositionValue.yMm - position.yMm);
  return distance <= BUILDING_PLACEMENT_OVERLAY.interactionRangeMm;
}

function sitePosition(siteId: string, world: WorldDefinition): { xMm: number; yMm: number; sourceZMetres?: number } | null {
  return world.sites.find(site => site.id === siteId)?.position ?? null;
}

function buildingPosition(state: GameState, buildingId: string, world: WorldDefinition) {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return null;
  return building.position ?? (building.siteId ? sitePosition(building.siteId, world) : null);
}

function containerAccessible(state: GameState, world: WorldDefinition, containerId: string, actorId: string): boolean {
  const container = state.inventory.containers.find(candidate => candidate.id === containerId);
  if (!container || !container.observed) return false;
  if (canAccessStarterContainer(containerId, state, world)) return true;
  if (container.location.kind === 'carried' && container.location.ownerId === actorId) return true;
  const actor = actorPosition(state, actorId);
  let position: { xMm: number; yMm: number } | null = null;
  if (container.location.kind === 'site') position = sitePosition(container.location.siteId, world);
  if (container.location.kind === 'building') position = buildingPosition(state, container.location.buildingId, world);
  if (container.location.kind === 'unit') position = actorPosition(state, container.location.unitId);
  return !!actor && !!position && Math.hypot(actor.xMm - position.xMm, actor.yMm - position.yMm) <= BUILDING_PLACEMENT_OVERLAY.interactionRangeMm;
}

function footprintHalfExtentsMm(definition: { footprint?: { areaM2: number | null; lengthM: number | null } } | undefined, fallbackArea: number | null = null): { x: number; y: number } {
  const footprint = definition?.footprint;
  if (footprint?.areaM2 !== null && footprint?.areaM2 !== undefined) {
    const halfSide = Math.ceil(Math.sqrt(footprint.areaM2) * 500);
    return { x: halfSide, y: halfSide };
  }
  if (footprint?.lengthM !== null && footprint?.lengthM !== undefined) {
    return { x: Math.ceil(footprint.lengthM * 500), y: Math.ceil(BUILDING_PLACEMENT_OVERLAY.wallThicknessM * 500) };
  }
  if (fallbackArea !== null) {
    const halfSide = Math.ceil(Math.sqrt(fallbackArea) * 500);
    return { x: halfSide, y: halfSide };
  }
  return { x: 2_000, y: 2_000 };
}

function footprintsOverlap(positionA: { xMm: number; yMm: number }, halfA: { x: number; y: number }, positionB: { xMm: number; yMm: number }, halfB: { x: number; y: number }): boolean {
  const clearance = BUILDING_PLACEMENT_OVERLAY.collisionClearanceMm;
  return Math.abs(positionA.xMm - positionB.xMm) < halfA.x + halfB.x + clearance
    && Math.abs(positionA.yMm - positionB.yMm) < halfA.y + halfB.y + clearance;
}

function costInputs(container: GameState['inventory']['containers'][number], costs: readonly { materialId: string; quantity: number }[]) {
  const reservations: { containerId: string; itemId: string; templateId: string; quantity: number }[] = [];
  for (const cost of costs) {
    let remaining = cost.quantity;
    for (const stack of container.stacks.filter(item => item.templateId === cost.materialId).slice().sort((a, b) => a.itemId.localeCompare(b.itemId))) {
      const available = stack.quantity - (stack.reservedQuantity ?? 0);
      const quantity = Math.min(remaining, available);
      if (quantity > 0) reservations.push({ containerId: container.id, itemId: stack.itemId, templateId: stack.templateId, quantity });
      remaining -= quantity;
      if (remaining === 0) break;
    }
    if (remaining > 0) return null;
  }
  return reservations;
}

function foodUnitInputs(container: GameState['inventory']['containers'][number], requiredFoodUnits: number) {
  const scale = 1_000;
  const target = Math.round(requiredFoodUnits * scale);
  let paths = new Map<number, { containerId: string; itemId: string; templateId: string; quantity: number }[]>([[0, []]]);
  for (const stack of container.stacks.slice().sort((a, b) => a.itemId.localeCompare(b.itemId))) {
    const foodUnitsPerItem = stack.foodUnitsPerItem ?? (stack.templateId === 'BREAD' ? 1 : 0);
    const units = Math.round(foodUnitsPerItem * scale);
    const available = Math.max(0, stack.quantity - (stack.reservedQuantity ?? 0));
    if (units <= 0 || available <= 0) continue;
    const next = new Map(paths);
    for (const [subtotal, entries] of paths) {
      const maximum = Math.min(available, Math.floor((target - subtotal) / units));
      for (let quantity = 1; quantity <= maximum; quantity += 1) {
        const total = subtotal + quantity * units;
        if (!next.has(total)) next.set(total, [...entries, { containerId: container.id, itemId: stack.itemId, templateId: stack.templateId, quantity }]);
      }
    }
    paths = next;
    if (paths.has(target)) return paths.get(target)!;
  }
  return null;
}

function validateMaterials(state: GameState, world: WorldDefinition, containerId: string, actorId: string, costs: readonly { materialId: string; quantity: number }[]) {
  const container = state.inventory.containers.find(candidate => candidate.id === containerId);
  if (!containerAccessible(state, world, containerId, actorId)) return { code: 'CONTAINER_NOT_ACCESSIBLE', container: null, reservations: null };
  if (!container) return { code: 'CONTAINER_NOT_ACCESSIBLE', container: null, reservations: null };
  const reservations = costInputs(container, costs);
  return reservations ? { code: null, container, reservations } : { code: 'INSUFFICIENT_UNRESERVED_MATERIAL', container, reservations: null };
}

function existingJobsForBuilding(state: GameState, buildingId: string): boolean {
  return state.construction.jobs.some(job => job.buildingId === buildingId && (job.status === 'active' || job.status === 'paused' || job.status === 'blocked'));
}

function proposedBuildingId(state: GameState, blueprintId: string): string {
  const built = state.buildings.filter(building => building.blueprintId === blueprintId).length;
  const inProgress = state.construction.jobs.filter(job => job.kind === 'build' && job.blueprintId === blueprintId
    && (job.status === 'active' || job.status === 'paused' || job.status === 'blocked')).length;
  const count = built + inProgress + 1;
  return `LL-BLD-${blueprintId.replace('BP-OPEN-', '')}-${String(count).padStart(2, '0')}`;
}

export function previewRepair(state: GameState, world: WorldDefinition, request: RepairRequest): ActionAvailability {
  const building = state.buildings.find(candidate => candidate.id === request.buildingId);
  if (!building || building.id !== LORD_HOUSE_REPAIR.buildingId || building.kind !== 'lord_house') return { actionId: 'repair', enabled: false, reasonCode: 'BUILDING_NOT_REPAIRABLE', requirements: ['Only the fixed damaged Lord House repair contract is compiled.'] };
  if (building.status !== 'damaged' || state.territory.repaired || existingJobsForBuilding(state, building.id)) return { actionId: 'repair', enabled: false, reasonCode: 'HOUSE_REPAIR_NOT_AVAILABLE', requirements: ['The Lord House must be damaged and have no active repair job.'] };
  const position = buildingPosition(state, building.id, world);
  if (!position || !workerAvailableAt(state, request.actorId, position)) return { actionId: 'repair', enabled: false, reasonCode: actorExists(state, request.actorId) ? 'WORKER_NOT_AT_SITE_OR_BUSY' : 'WORKER_NOT_OWNED', requirements: ['An owned, unassigned worker must be within 5 m of the Lord House.'] };
  if (!validConditionFactors(actorConditionFactors(state, request.actorId))) return { actionId: 'repair', enabled: false, reasonCode: 'WORKER_CONDITION_PROFILE_INVALID', requirements: ['Every BLUEPRINT-WORK-3.0 actor multiplier must be in the source range 0–1.25.'] };
  const materials = validateMaterials(state, world, request.containerId, request.actorId, LORD_HOUSE_REPAIR.cost);
  if (materials.code) return { actionId: 'repair', enabled: false, reasonCode: materials.code, requirements: ['Choose an observed accessible container with 10 STONE and 20 WOOD available after reservations.'] };
  if (!costInputs(materials.container!, LORD_HOUSE_REPAIR.requiredTools)) return { actionId: 'repair', enabled: false, reasonCode: 'REQUIRED_TOOL_UNAVAILABLE', requirements: ['One unreserved STONE-HAMMER per assigned worker must be in the selected accessible container.'] };
  return { actionId: 'repair', enabled: true, reasonCode: null, requirements: [], preview: { label: 'Cost · tool · work · source', value: '20 WOOD + 10 STONE · STONE-HAMMER × 1 · 17/60 WU · ' + materials.container!.id } };
}

function geometryIsValid(state: GameState, world: WorldDefinition, request: BuildRequest): { code: string | null; detail: string } {
  if (state.construction.placementOverlayVersion !== BUILDING_PLACEMENT_OVERLAY.id) return { code: 'PLACEMENT_RULE_VERSION_UNAVAILABLE', detail: BUILDING_PLACEMENT_OVERLAY.id };
  if (request.siteId !== CAMP_SITE_ID) return { code: 'SITE_NOT_OWNED_OR_PERMITTED', detail: 'Only the fixed H0 development site is owned in the opening scenario.' };
  const camp = state.territory.position;
  const distanceToCamp = Math.hypot(request.position.xMm - camp.xMm, request.position.yMm - camp.yMm);
  if (distanceToCamp > BUILDING_PLACEMENT_OVERLAY.ownedTerritoryRadiusMm) return { code: 'OUTSIDE_OWNED_TERRITORY', detail: 'The preview position is outside the 100 m H0 overlay boundary.' };
  if (request.position.sourceZMetres !== undefined && Math.abs(request.position.sourceZMetres) > 3) return { code: 'TERRAIN_LAYER_UNSUPPORTED', detail: 'Only the compiled surface layer is supported by this placement overlay.' };
  if (!workerAvailableAt(state, request.actorId, request.position)) return { code: actorExists(state, request.actorId) ? 'WORKER_NOT_AT_SITE_OR_BUSY' : 'WORKER_NOT_OWNED', detail: 'An owned, unassigned worker must be within 5 m of the preview position.' };
  if (!validConditionFactors(actorConditionFactors(state, request.actorId))) return { code: 'WORKER_CONDITION_PROFILE_INVALID', detail: 'Every BLUEPRINT-WORK-3.0 actor multiplier must be in the source range 0–1.25.' };
  const definition = definitionFor(state, request.blueprintId);
  if (!definition) return { code: 'BLUEPRINT_NOT_UNLOCKED', detail: 'The blueprint is not in the repaired-house opening registry.' };
  const nextExtents = footprintHalfExtentsMm(definition);
  for (const building of state.buildings) {
    if (building.status === 'destroyed') continue;
    const position = buildingPosition(state, building.id, world);
    if (!position) continue;
    const existingDefinition = building.blueprintId ? OPENING_BUILDINGS.find(item => item.id === building.blueprintId) : undefined;
    const existingExtents = footprintHalfExtentsMm(existingDefinition, building.footprintAreaM2 ?? (building.kind === 'lord_house' ? 30 : null));
    if (footprintsOverlap(request.position, nextExtents, position, existingExtents)) {
      return { code: 'BUILDING_FOOTPRINT_COLLISION', detail: 'The server preview footprint overlaps ' + building.id + '.' };
    }
  }
  for (const job of state.construction.jobs) {
    if (job.kind !== 'build' || (job.status !== 'active' && job.status !== 'paused' && job.status !== 'blocked')) continue;
    const existingDefinition = job.blueprintId ? OPENING_BUILDINGS.find(item => item.id === job.blueprintId) : undefined;
    const existingExtents = footprintHalfExtentsMm(existingDefinition);
    if (footprintsOverlap(request.position, nextExtents, job.position, existingExtents)) {
      return { code: 'BUILDING_FOOTPRINT_COLLISION', detail: 'The preview footprint overlaps active construction ' + job.id + '.' };
    }
  }
  return { code: null, detail: 'Valid H0 site, surface layer, reachable worker and clear footprint.' };
}

export function previewBuild(state: GameState, world: WorldDefinition, request: BuildRequest): ActionAvailability {
  if (!state.territory.repaired) return { actionId: 'build', enabled: false, reasonCode: 'LORD_HOUSE_REPAIR_REQUIRED', requirements: ['Repair the Lord House before opening the eleven fixed options.'] };
  const definition = definitionFor(state, request.blueprintId);
  if (!definition) return { actionId: 'build', enabled: false, reasonCode: 'BLUEPRINT_NOT_UNLOCKED', requirements: ['Only one of the eleven source-defined Level 1 opening structures is available.'] };
  const geometry = geometryIsValid(state, world, request);
  if (geometry.code) return { actionId: 'build', enabled: false, reasonCode: geometry.code, requirements: [geometry.detail] };
  const materials = validateMaterials(state, world, request.containerId, request.actorId, definition.buildCost);
  if (materials.code) return { actionId: 'build', enabled: false, reasonCode: materials.code, requirements: ['The selected accessible container must hold each recipe material after active reservations.'] };
  return { actionId: 'build', enabled: true, reasonCode: null, requirements: [], preview: {
    label: 'Cost · workers · work · source',
    value: definition.buildCost.map(item => `${item.quantity} ${item.materialId}`).join(' + ') + ` · max ${definition.maxWorkers} · ${definition.workUnits} WU · ${materials.container!.id}`,
  } };
}

export function previewHeaterService(state: GameState, world: WorldDefinition, request: { actorId: string; buildingId: string; containerId: string }): ActionAvailability {
  const heater = state.buildings.find(building => building.id === request.buildingId && building.blueprintId === 'BP-OPEN-HEATER-01' && building.kind === 'heater' && building.status === 'active');
  if (!heater) return { actionId: 'operate_heater', enabled: false, reasonCode: 'HEATER_NOT_ACTIVE', requirements: ['Construct the source-defined Level 1 heater before operating it.'] };
  if ((state.construction.operatingServices ?? []).some(service => service.buildingId === heater.id && service.status === 'active')) return { actionId: 'operate_heater', enabled: false, reasonCode: 'HEATER_ALREADY_OPERATING', requirements: ['This heater already has an active 20-minute fuel cycle.'] };
  const position = buildingPosition(state, heater.id, world);
  const actor = actorPosition(state, request.actorId);
  if (!actor || !position || !actorExists(state, request.actorId) || isActorBusy(state, request.actorId)
    || Math.hypot(actor.xMm - position.xMm, actor.yMm - position.yMm) > BUILDING_PLACEMENT_OVERLAY.interactionRangeMm) {
    return { actionId: 'operate_heater', enabled: false, reasonCode: actorExists(state, request.actorId) ? 'WORKER_NOT_AT_SITE_OR_BUSY' : 'WORKER_NOT_OWNED', requirements: ['An owned, available worker must be within 5 m of the heater.'] };
  }
  const material = validateMaterials(state, world, request.containerId, request.actorId, [{ materialId: 'WOOD', quantity: 1 }]);
  if (material.code) return { actionId: 'operate_heater', enabled: false, reasonCode: material.code, requirements: ['One unreserved WOOD must be in the selected accessible container.'] };
  return { actionId: 'operate_heater', enabled: true, reasonCode: null, requirements: [], preview: {
    label: 'Fuel · operation · heat service', value: '1 WOOD · 20 min · +15–20°C in a room up to 30 m²',
  } };
}

export function startHeaterService(state: GameState, world: WorldDefinition, input: { id: string; actorId: string; buildingId: string; containerId: string }) {
  const availability = previewHeaterService(state, world, input);
  if (!availability.enabled) return { state, events: [] as CommandEvent[], code: availability.reasonCode ?? 'HEATER_SERVICE_UNAVAILABLE' };
  const material = validateMaterials(state, world, input.containerId, input.actorId, [{ materialId: 'WOOD', quantity: 1 }]);
  if (material.code || !material.reservations) return { state, events: [] as CommandEvent[], code: material.code ?? 'INSUFFICIENT_UNRESERVED_MATERIAL' };
  const service: OperatingServiceState = {
    id: input.id, kind: 'heater', buildingId: input.buildingId, status: 'active', startedAtElapsedMs: state.simElapsedMs,
    completesAtElapsedMs: state.simElapsedMs + HEATER_SERVICE_DURATION_MS, fuelReservations: material.reservations,
    heatDeltaCelsius: { min: 15, max: 20 }, roomAreaCapM2: 30,
  };
  const next = structuredClone(state);
  next.inventory = reservationsByContainer(state, service.fuelReservations, 1);
  next.construction = { ...state.construction, operatingServices: [...(state.construction.operatingServices ?? []), service] };
  next.jobs = [...state.jobs, {
    id: service.id, kind: 'heater_service', status: 'active', actorIds: [input.actorId], reservedItemIds: service.fuelReservations.map(item => item.itemId),
    startedAtElapsedMs: service.startedAtElapsedMs, completedAtElapsedMs: null,
  }];
  return { state: next, events: [event('heater_service_started', state.simElapsedMs, {
    serviceId: service.id, buildingId: service.buildingId, actorId: input.actorId, fuelReserved: service.fuelReservations,
    durationMs: HEATER_SERVICE_DURATION_MS, heatDeltaCelsius: service.heatDeltaCelsius, roomAreaCapM2: service.roomAreaCapM2,
  })], code: null };
}

export function nextHeaterServiceCompletionAt(state: GameState): number | null {
  return (state.construction.operatingServices ?? []).filter(service => service.status === 'active')
    .reduce<number | null>((earliest, service) => earliest === null ? service.completesAtElapsedMs : Math.min(earliest, service.completesAtElapsedMs), null);
}

export function settleHeaterServices(state: GameState, at: number): CommandEvent[] {
  const due = (state.construction.operatingServices ?? []).filter(service => service.status === 'active' && service.completesAtElapsedMs === at)
    .slice().sort((a, b) => a.id.localeCompare(b.id));
  const events: CommandEvent[] = [];
  for (const service of due) {
    const totals = new Map<string, number>();
    for (const input of service.fuelReservations) totals.set(input.containerId + '\0' + input.itemId, (totals.get(input.containerId + '\0' + input.itemId) ?? 0) + input.quantity);
    state.inventory = { containers: state.inventory.containers.map(container => ({
      ...container,
      stacks: container.stacks.flatMap(stack => {
        const quantity = totals.get(container.id + '\0' + stack.itemId) ?? 0;
        if (quantity === 0) return [stack];
        if (stack.quantity < quantity || (stack.reservedQuantity ?? 0) < quantity) throw new Error('HEATER_FUEL_RESERVATION_CONSERVATION_ERROR');
        const next = { ...stack, quantity: stack.quantity - quantity, reservedQuantity: (stack.reservedQuantity ?? 0) - quantity };
        return next.quantity > 0 ? [next] : [];
      }),
    })) };
    state.construction.operatingServices = (state.construction.operatingServices ?? []).map(item => item.id === service.id ? { ...item, status: 'completed', fuelReservations: [] } : item);
    state.jobs = state.jobs.map(job => job.id === service.id ? { ...job, status: 'completed', actorIds: [], completedAtElapsedMs: at, reservedItemIds: [] } : job);
    events.push(event('heater_service_completed', at, {
      serviceId: service.id, buildingId: service.buildingId, fuelConsumed: service.fuelReservations,
      heatDeltaCelsius: service.heatDeltaCelsius, roomAreaCapM2: service.roomAreaCapM2,
    }));
  }
  return events;
}

function reservationsByContainer(state: GameState, reservations: ConstructionJobState['costReservations'], delta: 1 | -1): GameState['inventory'] {
  const stacks = new Map<string, number>();
  for (const entry of reservations) stacks.set(entry.containerId + '\0' + entry.itemId, (stacks.get(entry.containerId + '\0' + entry.itemId) ?? 0) + entry.quantity);
  return {
    containers: state.inventory.containers.map(container => ({
      ...container,
      stacks: container.stacks.map(stack => {
        const key = container.id + '\0' + stack.itemId;
        const amount = stacks.get(key);
        return amount === undefined ? stack : { ...stack, reservedQuantity: Math.max(0, (stack.reservedQuantity ?? 0) + delta * amount) };
      }),
    })),
  };
}

function assignReservedTools(workerIds: readonly string[], reservations: readonly { containerId: string; itemId: string; templateId: string; quantity: number }[]) {
  const assigned: ConstructionJobState['toolReservations'][number][] = [];
  let workerIndex = 0;
  for (const reservation of reservations) {
    for (let quantity = 0; quantity < reservation.quantity; quantity += 1) {
      const workerId = workerIds[workerIndex++];
      if (!workerId) break;
      assigned.push({ workerId, containerId: reservation.containerId, itemId: reservation.itemId, templateId: reservation.templateId, quantity: 1 });
    }
  }
  return assigned;
}

function maximumWorkers(kind: 'repair' | 'build', blueprintId: string | null): number {
  if (kind === 'repair') return LORD_HOUSE_REPAIR.maxWorkers;
  return OPENING_BUILDINGS.find(definition => definition.id === blueprintId)?.maxWorkers ?? 0;
}

export function startConstructionJob(
  state: GameState,
  world: WorldDefinition,
  input: { id: string; kind: 'repair'; actorId: string; buildingId: string; containerId: string } | { id: string; kind: 'build'; actorId: string; blueprintId: string; siteId: string; containerId: string; position: { xMm: number; yMm: number; sourceZMetres?: number } },
): { state: GameState; events: readonly CommandEvent[]; code: string | null } {
  const availability = input.kind === 'repair'
    ? previewRepair(state, world, input)
    : previewBuild(state, world, input);
  if (!availability.enabled) return { state, events: [], code: availability.reasonCode ?? 'CONSTRUCTION_UNAVAILABLE' };
  const blueprint = input.kind === 'build' ? definitionFor(state, input.blueprintId)! : null;
  const costs = input.kind === 'repair' ? LORD_HOUSE_REPAIR.cost : blueprint!.buildCost;
  const materialResult = validateMaterials(state, world, input.containerId, input.actorId, costs);
  if (materialResult.code || !materialResult.reservations) return { state, events: [], code: materialResult.code ?? 'INSUFFICIENT_UNRESERVED_MATERIAL' };
  const toolInputs = input.kind === 'repair' ? costInputs(materialResult.container!, LORD_HOUSE_REPAIR.requiredTools) : [];
  if (input.kind === 'repair' && !toolInputs) return { state, events: [], code: 'REQUIRED_TOOL_UNAVAILABLE' };
  const toolReservations = assignReservedTools(input.kind === 'repair' ? [input.actorId] : [], toolInputs ?? []);
  const position = input.kind === 'repair' ? buildingPosition(state, input.buildingId, world)! : input.position;
  const buildingId = input.kind === 'repair' ? input.buildingId : proposedBuildingId(state, input.blueprintId);
  const workUnitsRequired = input.kind === 'repair' ? LORD_HOUSE_REPAIR.workUnits : blueprint!.workUnits;
  const job: ConstructionJobState = {
    id: input.id, kind: input.kind, status: 'active', buildingId,
    blueprintId: blueprint?.id ?? null, siteId: input.kind === 'repair' ? HOUSE_SITE_ID : input.siteId,
    position, workUnitsRequired, progressTicks: 0, progressRemainder: 0, workerIds: [input.actorId],
    costReservations: materialResult.reservations,
    toolReservations,
    cancellationPolicy: LORD_HOUSE_REPAIR.cancellationPolicy, blocker: null,
    startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null,
  };
  const next = structuredClone(state);
  next.inventory = reservationsByContainer(state, [...job.costReservations, ...job.toolReservations], 1);
  next.construction = { ...state.construction, jobs: [...state.construction.jobs, job] };
  next.jobs = [...state.jobs, { id: job.id, kind: input.kind === 'repair' ? 'construction_repair' : 'construction_build', status: 'active', actorIds: job.workerIds, reservedItemIds: [...job.costReservations, ...job.toolReservations].map(item => item.itemId), startedAtElapsedMs: job.startedAtElapsedMs, completedAtElapsedMs: null }];
  return {
    state: next,
    events: [event(input.kind === 'repair' ? 'lord_house_repair_started' : 'construction_job_started', state.simElapsedMs, {
      jobId: job.id, buildingId, blueprintId: job.blueprintId, actorIds: job.workerIds,
      sourceContainerId: input.containerId, reserved: job.costReservations, toolsReserved: job.toolReservations, workUnitsRequired,
      registryVersion: input.kind === 'repair' ? HOUSE_REPAIR_RULE_VERSION : blueprint!.sourceRegistry,
      placementOverlayVersion: state.construction.placementOverlayVersion,
    })],
    code: null,
  };
}

export function assignConstructionWorkers(state: GameState, world: WorldDefinition, jobId: string, workerIds: readonly string[]) {
  const job = state.construction.jobs.find(candidate => candidate.id === jobId && (candidate.status === 'active' || candidate.status === 'paused' || candidate.status === 'blocked'));
  if (!job) return { state, events: [] as CommandEvent[], code: 'CONSTRUCTION_JOB_NOT_ACTIVE' };
  const maximum = maximumWorkers(job.kind, job.blueprintId);
  if (workerIds.length > maximum) return { state, events: [] as CommandEvent[], code: 'WORKER_LIMIT_EXCEEDED' };
  if (workerIds.some(workerId => !actorExists(state, workerId))) return { state, events: [] as CommandEvent[], code: 'WORKER_NOT_OWNED' };
  if (workerIds.some(workerId => !validConditionFactors(actorConditionFactors(state, workerId)))) return { state, events: [] as CommandEvent[], code: 'WORKER_CONDITION_PROFILE_INVALID' };
  if (workerIds.some(workerId => isActorBusy(state, workerId, job.id))) return { state, events: [] as CommandEvent[], code: 'WORKER_ALREADY_ASSIGNED' };
  if (workerIds.some(workerId => !workerAvailableAt(state, workerId, job.position, job.id))) return { state, events: [] as CommandEvent[], code: 'WORKER_NOT_AT_SITE_OR_BUSY' };
  let retainedTools = job.toolReservations.filter(reservation => workerIds.includes(reservation.workerId));
  let addedTools: ConstructionJobState['toolReservations'] = [];
  let releasedTools: ConstructionJobState['toolReservations'] = [];
  if (job.kind === 'repair') {
    const addedWorkers = workerIds.filter(workerId => !retainedTools.some(reservation => reservation.workerId === workerId));
    const previousUnassignedTools = job.toolReservations.filter(reservation => !workerIds.includes(reservation.workerId));
    const reused = previousUnassignedTools.slice(0, addedWorkers.length).map((reservation, index) => ({ ...reservation, workerId: addedWorkers[index] }));
    addedTools = [...reused];
    releasedTools = previousUnassignedTools.slice(reused.length);
    const additionalWorkers = addedWorkers.slice(reused.length);
    if (additionalWorkers.length > 0) {
      const toolContainerId = job.toolReservations[0]?.containerId ?? job.costReservations[0]?.containerId;
      const container = state.inventory.containers.find(item => item.id === toolContainerId);
      if (!container || !containerAccessible(state, world, container.id, state.player.id)) return { state, events: [], code: 'REQUIRED_TOOL_UNAVAILABLE' };
      const reservations = costInputs(container, [{ materialId: 'STONE-HAMMER', quantity: additionalWorkers.length }]);
      if (!reservations) return { state, events: [], code: 'REQUIRED_TOOL_UNAVAILABLE' };
      addedTools = [...addedTools, ...assignReservedTools(additionalWorkers, reservations)];
    }
  } else {
    releasedTools = job.toolReservations.filter(reservation => !workerIds.includes(reservation.workerId));
  }
  retainedTools = [...retainedTools, ...addedTools];
  const status = workerIds.length === 0 ? 'paused' : 'active';
  const blocker = workerIds.length === 0 ? 'NO_WORKERS_ASSIGNED' : null;
  const nextJob = { ...job, workerIds: [...workerIds], toolReservations: retainedTools, status, blocker };
  const next = structuredClone(state);
  next.inventory = reservationsByContainer(state, releasedTools, -1);
  next.inventory = reservationsByContainer({ ...state, inventory: next.inventory }, addedTools, 1);
  next.construction = { ...state.construction, jobs: state.construction.jobs.map(item => item.id === jobId ? nextJob : item) };
  next.jobs = state.jobs.map(item => item.id === jobId ? { ...item, status: status === 'active' ? 'active' : 'blocked', actorIds: [...workerIds], reservedItemIds: [...job.costReservations, ...retainedTools].map(entry => entry.itemId) } : item);
  return { state: next, events: [event('construction_workers_reassigned', state.simElapsedMs, { jobId, workerIds: [...workerIds], toolsReserved: addedTools, toolsReleased: releasedTools, status })], code: null };
}

export function cancelConstructionJob(state: GameState, jobId: string) {
  const job = state.construction.jobs.find(candidate => candidate.id === jobId && (candidate.status === 'active' || candidate.status === 'paused' || candidate.status === 'blocked'));
  if (!job) return { state, events: [] as CommandEvent[], code: 'CONSTRUCTION_JOB_NOT_CANCELLABLE' };
  const next = structuredClone(state);
  const released = reservationsByContainer(state, [...job.costReservations, ...job.toolReservations], -1);
  next.inventory = released;
  const cancelled: ConstructionJobState = { ...job, status: 'cancelled', workerIds: [], costReservations: [], toolReservations: [], blocker: 'CANCELLED_FULL_RESERVATION_RELEASE' };
  next.construction = { ...state.construction, jobs: state.construction.jobs.map(item => item.id === jobId ? cancelled : item) };
  next.jobs = state.jobs.map(item => item.id === jobId ? { ...item, status: 'cancelled', actorIds: [] } : item);
  return { state: next, events: [event('construction_job_cancelled', state.simElapsedMs, {
    jobId, buildingId: job.buildingId, lostWorkUnits: job.progressTicks / WORK_TICKS_PER_WU,
    releasedReservations: job.costReservations, releasedTools: job.toolReservations, cancellationPolicy: job.cancellationPolicy,
  })], code: null };
}

export function recruitResidents(state: GameState, world: WorldDefinition, input: { buildingId: string; containerId: string; quantity: number; commandId: string }) {
  const house = state.buildings.find(building => building.id === input.buildingId && building.blueprintId === FARMHOUSE_ID && building.status === 'active');
  if (!house) return { state, events: [] as CommandEvent[], code: 'FARMHOUSE_NOT_ACTIVE' };
  if (!house.position || !workerAvailableAt(state, state.player.id, house.position)) return { state, events: [] as CommandEvent[], code: 'WORKER_NOT_AT_SITE_OR_BUSY' };
  const residents = state.construction.residents.filter(resident => resident.buildingId === house.id).length;
  const capacity = 4;
  if (residents + input.quantity > capacity) return { state, events: [] as CommandEvent[], code: 'HOUSING_CAPACITY_EXCEEDED' };
  if (input.quantity > 4) return { state, events: [] as CommandEvent[], code: 'RECRUITMENT_QUANTITY_INVALID' };
  const container = state.inventory.containers.find(candidate => candidate.id === input.containerId);
  if (!containerAccessible(state, world, input.containerId, state.player.id)) return { state, events: [] as CommandEvent[], code: 'CONTAINER_NOT_ACCESSIBLE' };
  if (!container) return { state, events: [] as CommandEvent[], code: 'CONTAINER_NOT_ACCESSIBLE' };
  const reservation = foodUnitInputs(container, 5 * input.quantity);
  if (!reservation) return { state, events: [] as CommandEvent[], code: 'INSUFFICIENT_FOOD_UNITS' };
  const next = structuredClone(state);
  const reservationByItem = new Map(reservation.map(item => [item.itemId, item.quantity]));
  next.inventory = { containers: state.inventory.containers.map(item => item.id !== container.id ? item : {
    ...item, stacks: item.stacks.flatMap(stack => {
      const quantity = reservationByItem.get(stack.itemId) ?? 0;
      if (!quantity) return [stack];
      const remaining = stack.quantity - quantity;
      return remaining > 0 ? [{ ...stack, quantity: remaining }] : [];
    }),
  }) };
  const nextResidents: ConstructionResidentState[] = Array.from({ length: input.quantity }, (_, index) => {
    const serial = residents + index + 1;
    return { id: `RES-FARM-${house.id}-${serial}`, name: `Nông Phu Cực Địa #${serial}`, buildingId: house.id, createdAtElapsedMs: state.simElapsedMs, foodUnitsPaid: 5, upkeepStatus: 'not_compiled', provenance: 'campaign_fixed' };
  });
  next.construction = { ...state.construction, residents: [...state.construction.residents, ...nextResidents] };
  return { state: next, events: [event('farmhouse_residents_recruited', state.simElapsedMs, {
    buildingId: house.id, residentIds: nextResidents.map(person => person.id), quantity: input.quantity, foodUnitsSpent: 5 * input.quantity, consumed: reservation, upkeep: 'POPULATION_FOOD_UPKEEP_NOT_COMPILED',
  })], code: null };
}

export function integrateConstructionWork(state: GameState, from: number, to: number): void {
  const duration = to - from;
  if (duration <= 0) return;
  state.construction = {
    ...state.construction,
    jobs: state.construction.jobs.map(job => {
      if (job.status !== 'active' || job.workerIds.length === 0) return job;
      if (job.workerIds.some(actorId => isActorBusy(state, actorId, job.id) || !actorExists(state, actorId))) {
        return { ...job, status: 'blocked', blocker: 'WORKER_STATE_CHANGED' };
      }
      if (job.workerIds.some(actorId => !validConditionFactors(actorConditionFactors(state, actorId)))) return { ...job, status: 'blocked', blocker: 'WORKER_CONDITION_PROFILE_INVALID' };
      const bases = job.workerIds.map(actorId => actorBaseRate(state, actorId));
      const coordination = CONSTRUCTION_LABOR_OVERLAY.coordinationPermilleByWorkerCount[job.workerIds.length as 1 | 2 | 3 | 4 | 5 | 6] ?? 0;
      if (coordination <= 0) return { ...job, status: 'blocked', blocker: 'COORDINATION_PROFILE_NOT_COMPILED' };
      if (job.kind === 'repair' && job.workerIds.some(workerId => !job.toolReservations.some(reservation => reservation.workerId === workerId))) return { ...job, status: 'blocked', blocker: 'REQUIRED_TOOL_UNAVAILABLE' };
      const modifiers = job.workerIds.map(actorId => actorConditionFactors(state, actorId));
      const baseRate = bases.reduce((sum, value, index) => {
        const factor = Object.values(modifiers[index]).reduce((product, item) => product * item, 1);
        return sum + value * factor;
      }, 0);
      const rateTicksPerHour = Math.round(baseRate * coordination / 1_000 * WORK_TICKS_PER_WU);
      const numerator = duration * rateTicksPerHour + job.progressRemainder;
      const increment = Math.floor(numerator / HOUR_MS);
      const targetTicks = Math.round(job.workUnitsRequired * WORK_TICKS_PER_WU);
      const progressTicks = Math.min(targetTicks, job.progressTicks + increment);
      return { ...job, progressTicks, progressRemainder: progressTicks >= targetTicks ? 0 : numerator % HOUR_MS, blocker: null };
    }),
  };
}

export function constructionWorkRate(state: GameState, job: ConstructionJobState): number {
  if (job.status !== 'active' || job.workerIds.length === 0) return 0;
  const coordination = CONSTRUCTION_LABOR_OVERLAY.coordinationPermilleByWorkerCount[job.workerIds.length as 1 | 2 | 3 | 4 | 5 | 6] ?? 0;
  if (coordination <= 0) return 0;
  const total = job.workerIds.reduce((sum, actorId) => {
    const base = actorBaseRate(state, actorId);
    const factors = actorConditionFactors(state, actorId);
    return sum + base * Object.values(factors).reduce((product, factor) => product * factor, 1);
  }, 0);
  return total * coordination / 1_000;
}

export function nextConstructionCompletionAt(state: GameState): number | null {
  let earliest: number | null = null;
  for (const job of state.construction.jobs) {
    const rate = constructionWorkRate(state, job);
    if (rate <= 0) continue;
    const targetTicks = Math.round(job.workUnitsRequired * WORK_TICKS_PER_WU);
    const neededNumerator = Math.max(0, (targetTicks - job.progressTicks) * HOUR_MS - job.progressRemainder);
    const rateTicksPerHour = Math.max(1, Math.round(rate * WORK_TICKS_PER_WU));
    const at = state.simElapsedMs + Math.ceil(neededNumerator / rateTicksPerHour);
    if (earliest === null || at < earliest) earliest = at;
  }
  return earliest;
}

function releaseAndConsumeReservations(state: GameState, job: ConstructionJobState): void {
  const costTotals = new Map<string, number>();
  const toolTotals = new Map<string, number>();
  for (const reservation of job.costReservations) costTotals.set(reservation.containerId + '\0' + reservation.itemId, (costTotals.get(reservation.containerId + '\0' + reservation.itemId) ?? 0) + reservation.quantity);
  for (const reservation of job.toolReservations) toolTotals.set(reservation.containerId + '\0' + reservation.itemId, (toolTotals.get(reservation.containerId + '\0' + reservation.itemId) ?? 0) + reservation.quantity);
  state.inventory = {
    containers: state.inventory.containers.map(container => ({
      ...container,
      stacks: container.stacks.flatMap(stack => {
        const key = container.id + '\0' + stack.itemId;
        const consumed = costTotals.get(key) ?? 0;
        const releasedTool = toolTotals.get(key) ?? 0;
        if (consumed === 0 && releasedTool === 0) return [stack];
        if (stack.quantity < consumed || (stack.reservedQuantity ?? 0) < consumed + releasedTool) throw new Error('CONSTRUCTION_RESERVATION_CONSERVATION_ERROR');
        const next = { ...stack, quantity: stack.quantity - consumed, reservedQuantity: Math.max(0, (stack.reservedQuantity ?? 0) - consumed - releasedTool) };
        return next.quantity === 0 ? [] : [next];
      }),
    })),
  };
}

export function settleConstructionCompletions(state: GameState, at: number): CommandEvent[] {
  const due = state.construction.jobs.filter(job => job.status === 'active' && job.progressTicks >= Math.round(job.workUnitsRequired * WORK_TICKS_PER_WU))
    .slice().sort((a, b) => a.id.localeCompare(b.id));
  const events: CommandEvent[] = [];
  for (const job of due) {
    const completed: ConstructionJobState = { ...job, status: 'completed', completedAtElapsedMs: at, blocker: null, workerIds: [], toolReservations: [] };
    releaseAndConsumeReservations(state, job);
    state.construction.jobs = state.construction.jobs.map(item => item.id === job.id ? completed : item);
    state.jobs = state.jobs.map(item => item.id === job.id ? { ...item, status: 'completed', completedAtElapsedMs: at, actorIds: [] } : item);
    if (job.kind === 'repair') {
      state.buildings = state.buildings.map(building => building.id === job.buildingId ? { ...building, status: 'active', constructionRuleVersion: HOUSE_REPAIR_RULE_VERSION } : building);
      state.territory = { ...state.territory, repaired: true };
      state.construction.unlockedBlueprintIds = LORD_HOUSE_REPAIR.completionUnlocks;
      if (!state.construction.firstBuildReceiptIds.includes('ACH-OPEN-LORD-HOUSE')) {
        state.construction.rewardEntitlements = [...state.construction.rewardEntitlements, {
          id: 'ENTITLEMENT-ACH-OPEN-LORD-HOUSE', achievementId: 'ACH-OPEN-LORD-HOUSE',
          status: 'pending', reward: [{ templateId: 'PERSONAL-SYSTEM-SKILL-BOOK:F:CO_BAN:ACTIVE:BUDGET-1', quantity: 1 }],
          rewardContract: 'ACHIEVEMENT-SKILL-FIT-1.0', blocker: 'CAREER_SKILL_AND_FIRST_WORLDWIDE_TRIGGER_NOT_SETTLED', createdAtElapsedMs: at, receiptId: null,
        }];
        state.construction.firstBuildReceiptIds = [...state.construction.firstBuildReceiptIds, 'ACH-OPEN-LORD-HOUSE'];
        events.push(event('construction_reward_entitlement_pending', at, {
          achievementId: 'ACH-OPEN-LORD-HOUSE', rewardContract: 'ACHIEVEMENT-SKILL-FIT-1.0',
          reason: 'CAREER_SKILL_AND_FIRST_WORLDWIDE_TRIGGER_NOT_SETTLED', rewardNotMinted: true,
        }));
      }
      events.push(event('lord_house_repaired', at, {
        jobId: job.id, buildingId: job.buildingId, consumed: job.costReservations, toolsReleased: job.toolReservations,
        unlockedBlueprintIds: LORD_HOUSE_REPAIR.completionUnlocks, ruleVersion: HOUSE_REPAIR_RULE_VERSION,
      }));
    } else {
      const definition = OPENING_BUILDINGS.find(item => item.id === job.blueprintId);
      if (!definition) throw new Error('CONSTRUCTION_BLUEPRINT_DISAPPEARED');
      const built = {
        id: job.buildingId, kind: definition.family, name: definition.name, level: 1, status: 'active' as const,
        repairRequirements: [], siteId: job.siteId, position: job.position, blueprintId: definition.id,
        footprintAreaM2: definition.footprint.areaM2, constructionRuleVersion: definition.sourceRegistry,
      };
      if (!state.buildings.some(item => item.id === built.id)) state.buildings = [...state.buildings, built];
      events.push(event('construction_building_completed', at, {
        jobId: job.id, building: built, consumed: job.costReservations, blueprintId: definition.id,
        output: definition.outputs, ruleVersion: definition.sourceRegistry,
      }));
      if (definition.id === FARMHOUSE_ID && !state.construction.firstBuildReceiptIds.includes('ACH-OPEN-POLAR-HOUSE')) {
        state.construction.rewardEntitlements = [...state.construction.rewardEntitlements, {
          id: 'ENTITLEMENT-ACH-OPEN-POLAR-HOUSE', achievementId: 'ACH-OPEN-POLAR-HOUSE',
          status: 'pending', reward: [{ templateId: 'BREAD', quantity: 50 }],
          blocker: 'FIRST_WORLDWIDE_TRIGGER_NOT_SETTLED', createdAtElapsedMs: at, receiptId: null,
        }];
        state.construction.firstBuildReceiptIds = [...state.construction.firstBuildReceiptIds, 'ACH-OPEN-POLAR-HOUSE'];
        events.push(event('construction_reward_entitlement_pending', at, {
          achievementId: 'ACH-OPEN-POLAR-HOUSE', reason: 'FIRST_WORLDWIDE_TRIGGER_NOT_SETTLED', rewardNotMinted: true,
        }));
      }
    }
  }
  return events;
}

export function farmhouseCapacity(state: GameState): number {
  return state.buildings.filter(building => building.status === 'active' && building.blueprintId === FARMHOUSE_ID).length * 4;
}
