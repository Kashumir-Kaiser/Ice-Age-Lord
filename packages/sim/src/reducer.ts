import type { ActionAvailability, CommandEnvelope, CommandEvent, CommandReceipt, CommandReduction, CommandType, CoordinateMm, EntityRef, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';
import { canAccessStarterContainer } from './access.ts';
import { entityKey } from './view.ts';
import { cancelTombJob, enqueueTombJob, selectedSpeed, TOMB_STANDARD_BLUEPRINT_ID } from './time.ts';
import { assignConstructionWorkers, cancelConstructionJob, previewBuild, previewHeaterService, previewRepair, recruitResidents, startConstructionJob, startHeaterService } from './construction.ts';
import { consumeItem, equipmentBlocker, mergeStacks, splitStack } from './inventory.ts';
import {
  actorAvailability,
  cancelSpatialJob,
  cancelTravel,
  materializeChestLootBlocker,
  previewMovement,
  startHarvestJob,
  startMovement,
  startSearchJob,
  transferItem,
} from './spatial.ts';

const disabledReasons: Readonly<Record<Exclude<CommandType, 'inspect_entity' | 'inspect_starter_container' | 'inspect_career_card'>, { code: string; message: string }>> = {
  activate_career_card: { code: 'CAREER_CARD_FLOW_NOT_IMPLEMENTED', message: 'Career activation is unavailable until its verified flow is implemented.' },
  set_clock_speed: { code: 'AUTHORITATIVE_TIME_STAGE_04', message: 'Clock control becomes available with the authoritative time system.' },
  advance_to_boundary: { code: 'AUTHORITATIVE_TIME_STAGE_04', message: 'Time boundaries are settled by the server time system.' },
  enqueue_tomb: { code: 'TOMB_QUEUE_STAGE_04', message: 'Tomb production is unavailable until its queue rules are implemented.' },
  cancel_tomb: { code: 'TOMB_QUEUE_STAGE_04', message: 'Tomb cancellation is unavailable until its queue rules are implemented.' },
  refuel_fire: { code: 'FIRE_FUEL_STAGE_04', message: 'Fire refuelling is unavailable until the authoritative fuel ledger is implemented.' },
  extinguish_fire: { code: 'FIRE_FUEL_STAGE_04', message: 'Fire control is unavailable until the authoritative fuel ledger is implemented.' },
  light_fire: { code: 'FIRE_FUEL_STAGE_04', message: 'Fire control is unavailable until the authoritative fuel ledger is implemented.' },
  move: { code: 'MOVEMENT_RULES_STAGE_05', message: 'Travel is unavailable until routes, access and settlement rules are implemented.' },
  cancel_travel: { code: 'MOVEMENT_ORDER_NOT_ACTIVE', message: 'The selected movement order is no longer active.' },
  survey: { code: 'SURVEY_RULES_STAGE_05', message: 'Surveying is unavailable until its source-locked contracts are implemented.' },
  search: { code: 'SEARCH_RULES_STAGE_05', message: 'Searching is unavailable until spatial sweep and target rules are implemented.' },
  harvest: { code: 'RESOURCE_LEDGER_STAGE_05', message: 'Resource extraction is unavailable until the authoritative balance ledger is implemented.' },
  cancel_spatial_job: { code: 'SPATIAL_JOB_NOT_ACTIVE', message: 'The selected spatial job is no longer active.' },
  transfer_item: { code: 'CONTAINER_NOT_ACCESSIBLE', message: 'Both containers must be accessible to the player.' },
  open_cache: { code: 'CHEST_LIFECYCLE_STAGE_05', message: 'Field chests cannot be opened until access and reward commitments are implemented.' },
  repair: { code: 'HOUSE_REPAIR_CONTRACT_UNAVAILABLE', message: 'The damaged Lord House repair contract, accessible workers and reserved inputs are required.' },
  build: { code: 'BUILDING_BLUEPRINT_OR_PLACEMENT_INVALID', message: 'A source-defined unlocked blueprint and server-approved footprint are required.' },
  assign_construction_workers: { code: 'CONSTRUCTION_JOB_NOT_ACTIVE', message: 'Choose an active construction job.' },
  cancel_construction_job: { code: 'CONSTRUCTION_JOB_NOT_CANCELLABLE', message: 'Choose an active construction job.' },
  recruit_resident: { code: 'FARMHOUSE_NOT_ACTIVE', message: 'Build the polar farmhouse before recruiting residents.' },
  operate_heater: { code: 'HEATER_NOT_ACTIVE', message: 'Construct the Level 1 heater before operating it.' },
  split_stack: { code: 'ITEM_CANNOT_BE_SPLIT', message: 'The accessible stack must have unreserved items and free container capacity.' },
  merge_stacks: { code: 'STACKS_NOT_COMPATIBLE', message: 'Only compatible unreserved stacks can be merged.' },
  consume_item: { code: 'ITEM_CONSUMPTION_CONTRACT_NOT_COMPILED', message: 'Only food with a compiled consumption contract can be consumed.' },
  unequip_item: { code: 'EQUIPMENT_PROFILE_NOT_COMPILED', message: 'The unit equipment slot profile is not compiled.' },
  revive: { code: 'REVIVAL_RULES_STAGE_07', message: 'Revival is unavailable until corpse identity and eligibility rules are implemented.' },
  equip: { code: 'EQUIPMENT_RULES_STAGE_07', message: 'Equipment changes are unavailable until the item and unit ledgers are implemented.' },
  attack: { code: 'COMBAT_RULES_STAGE_07', message: 'Combat is unavailable until encounters and deterministic resolution are implemented.' },
  shop_transaction: { code: 'TRADE_RULES_STAGE_08', message: 'Transactions are unavailable until offer, currency and receipt rules are implemented.' },
};

function staticAvailability(type: CommandType): ActionAvailability {
  if (type === 'inspect_entity' || type === 'inspect_starter_container' || type === 'inspect_career_card') {
    return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  }
  const reason = disabledReasons[type];
  return { actionId: type, enabled: false, reasonCode: reason.code, requirements: [reason.message] };
}

export function actionAvailability(type: CommandType): ActionAvailability {
  if (type === 'set_clock_speed' || type === 'advance_to_boundary' || type === 'enqueue_tomb'
    || type === 'cancel_tomb' || type === 'refuel_fire' || type === 'extinguish_fire' || type === 'light_fire') {
    return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  }
  if (type === 'inspect_entity') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The entity must already be known to the player.'] };
  if (type === 'inspect_starter_container') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The container must be in reach and belong to the player.'] };
  if (type === 'inspect_career_card') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The sealed opening card must still be available.'] };
  if (type === 'move' || type === 'search' || type === 'harvest' || type === 'cancel_travel' || type === 'cancel_spatial_job' || type === 'transfer_item' || type === 'open_cache') {
    return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  }
  if (type === 'split_stack' || type === 'merge_stacks' || type === 'consume_item') return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  return staticAvailability(type);
}

function isKnownEntity(ref: EntityRef, state: GameState): boolean {
  switch (ref.type) {
    case 'site': return state.playerKnowledge.knownSiteIds.includes(ref.id);
    case 'cache': return state.playerKnowledge.knownChestIds.includes(ref.id) || state.playerKnowledge.knownSignalIds.includes(ref.id);
    case 'lair': return state.playerKnowledge.knownLairIds.includes(ref.id);
    case 'resource': return state.playerKnowledge.knownResourceIds.includes(ref.id);
    case 'route': return state.playerKnowledge.knownRouteIds.includes(ref.id);
    case 'item': return state.inventory.containers.some(container => container.observed && container.stacks.some(item => item.itemId === ref.id));
    case 'unit': return state.ownedUnits.some(unit => unit.id === ref.id);
    case 'building': return state.buildings.some(building => building.id === ref.id && state.playerKnowledge.knownSiteIds.some(siteId => {
      return building.kind === 'survival_fire' ? siteId === 'SITE-LL01-000'
        : building.kind === 'lord_house' ? siteId === 'SITE-LL01-001'
          : siteId === 'SITE-LL01-003';
    }));
    case 'corpse': return false;
  }
}

function resolvedDestination(state: GameState, world: WorldDefinition, payload: { destinationId?: string; destination?: { xMm: number; yMm: number; sourceZMetres?: number } }) {
  if (payload.destination) return { coordinate: payload.destination, kind: 'coordinate' as const, entityId: null };
  const id = payload.destinationId;
  if (!id) return null;
  const site = world.sites.find(candidate => candidate.id === id && state.playerKnowledge.knownSiteIds.includes(id));
  if (site) return { coordinate: site.position, kind: 'entity' as const, entityId: id };
  const resource = world.resources.find(candidate => candidate.id === id && state.playerKnowledge.knownResourceIds.includes(id));
  if (resource) return { coordinate: resource.location, kind: 'entity' as const, entityId: id };
  const chest = world.fieldChests.find(candidate => candidate.id === id && state.playerKnowledge.knownChestIds.includes(id));
  if (chest) return { coordinate: chest.position, kind: 'entity' as const, entityId: id };
  const signal = state.spatial.signals.find(candidate => candidate.signalId === id && state.playerKnowledge.knownSignalIds.includes(id));
  if (signal) return {
    coordinate: signal.discovery === 'identified' ? signal.exactPosition : signal.approximatePosition,
    kind: 'entity' as const,
    entityId: signal.signalId,
  };
  const route = world.navigationOverlay.routeEdges.find(candidate => candidate.id === id && state.playerKnowledge.knownRouteIds.includes(id));
  if (route) {
    const start = Math.hypot(route.path[0].xMm - state.player.position.xMm, route.path[0].yMm - state.player.position.yMm);
    const end = Math.hypot(route.path.at(-1)!.xMm - state.player.position.xMm, route.path.at(-1)!.yMm - state.player.position.yMm);
    return { coordinate: start <= end ? route.path.at(-1)! : route.path[0], kind: 'entity' as const, entityId: id };
  }
  return null;
}

function unavailable(type: CommandType, code: string, message: string): ActionAvailability {
  return { actionId: type, enabled: false, reasonCode: code, requirements: [message] };
}

function actorPosition(state: GameState, actorId: string): CoordinateMm | null {
  if (actorId === state.player.id) return state.player.position;
  return state.ownedUnits.find(unit => unit.id === actorId)?.position ?? null;
}

export function previewCommand(
  state: GameState,
  input: unknown,
  world: WorldDefinition,
  options: { allowSystemOnlyRevisionAdvance?: boolean } = {},
): ActionAvailability {
  const validation = validateCommandEnvelope(input);
  if (!validation.success) return { actionId: 'invalid', enabled: false, reasonCode: 'INVALID_COMMAND', requirements: [validation.issue.message] };
  const command = validation.data;
  if (command.saveId !== state.saveId) return { actionId: command.type, enabled: false, reasonCode: 'SAVE_ID_MISMATCH', requirements: ['The command must target the selected save.'] };
  if (world.id !== state.worldPackageId) return { actionId: command.type, enabled: false, reasonCode: 'CONTENT_MISMATCH', requirements: ['The save content package is unavailable.'] };
  if (command.expectedRevision !== state.revision
    && !(options.allowSystemOnlyRevisionAdvance && command.expectedRevision < state.revision)) {
    return { actionId: command.type, enabled: false, reasonCode: 'STALE_REVISION', requirements: [`Current revision is ${state.revision}.`] };
  }
  if (command.type === 'inspect_entity') {
    const ref = command.payload.entity;
    return isKnownEntity(ref, state)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The entity is unavailable in the current player view.'] };
  }
  if (command.type === 'inspect_starter_container') {
    const containerId = command.payload.containerId;
    return canAccessStarterContainer(containerId, state, world)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The container must be in reach and belong to the player.'] };
  }
  if (command.type === 'inspect_career_card') {
    return state.player.career.state === 'unemployed_card_sealed'
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The opening card is no longer available.'] };
  }
  if (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary') return actionAvailability(command.type);
  if (command.type === 'enqueue_tomb') {
    if (command.payload.blueprintId !== TOMB_STANDARD_BLUEPRINT_ID) return { actionId: command.type, enabled: false, reasonCode: 'TOMB_BLUEPRINT_UNKNOWN', requirements: ['Only the source-locked T0 standard output is compiled.'] };
    return actionAvailability(command.type);
  }
  if (command.type === 'cancel_tomb') {
    const entry = state.territory.tomb.queue.find(item => item.id === command.payload.jobId);
    return entry && (entry.status === 'queued' || entry.status === 'blocked') && entry.reservedDeathQi === 0
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'TOMB_ACTIVE_CANCEL_UNRESOLVED', requirements: ['Only jobs that have not reserved Tử Khí can be cancelled.'] };
  }
  if (command.type === 'refuel_fire') {
    const container = state.inventory.containers.find(item => item.id === command.payload.containerId);
    const accessible = Boolean(container && canAccessStarterContainer(container.id, state, world));
    const wood = container?.stacks.find(item => item.itemId === command.payload.itemId && item.templateId === 'WOOD');
    return state.territory.survivalFire.fuelKnowledge === 'known' && accessible && container?.observed && wood && wood.quantity >= command.payload.quantity
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: state.territory.survivalFire.fuelKnowledge !== 'known' ? 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED' : 'FUEL_NOT_ACCESSIBLE', requirements: [state.territory.survivalFire.fuelKnowledge !== 'known' ? 'The opening fire fuel amount is unknown, so an exact remaining-fuel total cannot be calculated.' : 'Accessible, observed WOOD must be present in an owned container.'] };
  }
  if (command.type === 'extinguish_fire') {
    return state.territory.survivalFire.active ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'FIRE_ALREADY_OFF', requirements: ['The fire is already off.'] };
  }
  if (command.type === 'light_fire') {
    return !state.territory.survivalFire.active && (state.territory.survivalFire.fuelRemaining ?? 0) > 0
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: state.territory.survivalFire.fuelRemaining === null ? 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED' : 'FUEL_REQUIRED', requirements: ['Known assigned wood is required to light the fire.'] };
  }
  if (command.type === 'move') {
    const destination = resolvedDestination(state, world, command.payload);
    if (!destination) return unavailable(command.type, 'NOT_ACCESSIBLE', 'Choose a coordinate or an entity already shown in the player view.');
    const result = previewMovement(state, world, command.payload.actorId, destination.coordinate);
    if (result.code || !result.preview) return unavailable(command.type, result.code ?? 'MOVEMENT_UNAVAILABLE', 'The actor cannot reach that destination under the known route rules.');
    return { actionId: command.type, enabled: true, reasonCode: null, requirements: [], preview: { label: result.preview.uncertainty === 'known' ? 'Known route' : 'Uncertain route', value: `${(result.preview.distanceMm / 1_000_000).toFixed(2)} km · ${Math.ceil(result.preview.etaMs / 60_000)} min` } };
  }
  if (command.type === 'cancel_travel') {
    const order = state.travel.orders.find(candidate => candidate.id === command.payload.orderId && candidate.status === 'active');
    return order && order.actorIds.every(actorId => actorId === state.player.id || state.ownedUnits.some(unit => unit.id === actorId))
      ? actionAvailability(command.type) : unavailable(command.type, 'MOVEMENT_ORDER_NOT_ACTIVE', 'The movement order is unavailable.');
  }
  if (command.type === 'search') {
    const result = startSearchJob(state, world, 'PREVIEW-SEARCH', command.payload.actorId, command.payload.center, command.payload.radiusMm);
    return result.job ? actionAvailability(command.type) : unavailable(command.type, result.code ?? 'SEARCH_UNAVAILABLE', 'The actor cannot search this area.');
  }
  if (command.type === 'harvest') {
    const result = startHarvestJob(state, world, 'PREVIEW-HARVEST', command.payload.actorId, command.payload.resourceId, command.payload.materialId, command.payload.quantity, command.payload.toolItemId);
    return result.job ? actionAvailability(command.type) : unavailable(command.type, result.code ?? 'HARVEST_UNAVAILABLE', 'The actor cannot harvest this resource.');
  }
  if (command.type === 'cancel_spatial_job') {
    const active = state.spatial.searchJobs.some(job => job.id === command.payload.jobId && job.status === 'active')
      || state.spatial.harvestJobs.some(job => job.id === command.payload.jobId && job.status === 'active');
    return active ? actionAvailability(command.type) : unavailable(command.type, 'SPATIAL_JOB_NOT_ACTIVE', 'The spatial job is unavailable.');
  }
  if (command.type === 'transfer_item') {
    const result = transferItem(state, world, command.payload.actorId, command.payload.sourceContainerId, command.payload.destinationContainerId, command.payload.itemId, command.payload.quantity);
    return result.code ? unavailable(command.type, result.code, 'Check the item quantity, container access, and available storage slots.') : actionAvailability(command.type);
  }
  if (command.type === 'repair') return previewRepair(state, world, command.payload);
  if (command.type === 'build') return previewBuild(state, world, command.payload);
  if (command.type === 'assign_construction_workers') {
    const result = assignConstructionWorkers(state, world, command.payload.jobId, command.payload.workerIds);
    return result.code ? unavailable(command.type, result.code, 'Workers must be owned, unassigned, within 5 m, and within the blueprint maximum.') : actionAvailability(command.type);
  }
  if (command.type === 'cancel_construction_job') {
    const result = cancelConstructionJob(state, command.payload.jobId);
    return result.code ? unavailable(command.type, result.code, 'Only an active, paused, or blocked construction job can be cancelled.') : actionAvailability(command.type);
  }
  if (command.type === 'recruit_resident') {
    const result = recruitResidents(state, world, { ...command.payload, commandId: 'PREVIEW' });
    return result.code ? unavailable(command.type, result.code, 'An active farmhouse, available housing, and exactly five accessible FOOD units per resident are required.') : actionAvailability(command.type);
  }
  if (command.type === 'operate_heater') {
    return previewHeaterService(state, world, command.payload);
  }
  if (command.type === 'split_stack') {
    const result = splitStack(state, world, { ...command.payload, newItemId: 'PREVIEW-SPLIT-ITEM' });
    return result.code ? unavailable(command.type, result.code, 'The observed stack must have enough unreserved quantity and the container must have a free slot.') : actionAvailability(command.type);
  }
  if (command.type === 'merge_stacks') {
    const result = mergeStacks(state, world, command.payload);
    return result.code ? unavailable(command.type, result.code, 'Both stacks must be compatible, accessible, unequipped, and unreserved.') : actionAvailability(command.type);
  }
  if (command.type === 'consume_item') {
    const result = consumeItem(state, world, command.payload);
    return result.code ? unavailable(command.type, result.code, 'The food item must be observed, accessible, unreserved, and have a consumption contract.') : actionAvailability(command.type);
  }
  if (command.type === 'equip') {
    const reason = equipmentBlocker(state, command.payload.unitId, command.payload.itemId);
    return unavailable(command.type, reason ?? 'EQUIPMENT_SLOT_RULE_NOT_COMPILED', 'The unit anatomy and compatible equipment slot contract must be compiled.');
  }
  if (command.type === 'unequip_item') {
    const reason = equipmentBlocker(state, command.payload.unitId, command.payload.itemId);
    return unavailable(command.type, reason ?? 'EQUIPMENT_SLOT_RULE_NOT_COMPILED', 'The unit anatomy and compatible equipment slot contract must be compiled.');
  }
  if (command.type === 'open_cache') {
    const chest = world.fieldChests.find(candidate => candidate.id === command.payload.chestId && state.playerKnowledge.knownChestIds.includes(candidate.id));
    const position = actorPosition(state, command.payload.actorId);
    if (!chest || !position || Math.hypot(position.xMm - chest.position.xMm, position.yMm - chest.position.yMm) > world.navigationOverlay.interactionRangeMm) {
      return unavailable(command.type, 'NOT_ACCESSIBLE', 'The identified cache must be within reach.');
    }
    return unavailable(command.type, materializeChestLootBlocker(world), 'The chest reward candidate pool is not compiled.');
  }
  return staticAvailability(command.type);
}

function receiptFor(commandId: string, accepted: boolean, revision: number, eventSequence: number | null, code: string, message: string): CommandReceipt {
  return { commandId, accepted, revision, eventSequence, code, message };
}

function reject(state: GameState, commandId: string, code: string, message: string, requestSha256?: string): CommandReduction {
  const receipt = receiptFor(commandId, false, state.revision, null, code, message);
  const nextState = requestSha256 && commandId
    ? { ...state, receipts: [...state.receipts, { commandId, requestSha256, receipt }] }
    : state;
  return { state: nextState, events: [], receipt };
}

function acceptWithoutMutation(state: GameState, command: CommandEnvelope, requestSha256: string, code: string, message: string): CommandReduction {
  const receipt = receiptFor(command.commandId, true, state.revision, null, code, message);
  return {
    state: { ...state, receipts: [...state.receipts, { commandId: command.commandId, requestSha256, receipt }] },
    events: [],
    receipt,
  };
}

function acceptMutation(state: GameState, command: CommandEnvelope, requestSha256: string, nextPartial: Partial<GameState>, eventType: string, eventPayload: Record<string, unknown>, code: string, message: string): CommandReduction {
  const nextState: GameState = {
    ...state,
    ...nextPartial,
    revision: state.revision + 1,
    lastEventSequence: state.lastEventSequence + 1,
  };
  const event: CommandEvent = {
    sequence: nextState.lastEventSequence,
    type: eventType,
    occurredAtElapsedMs: state.simElapsedMs,
    payload: eventPayload,
  };
  const receipt = receiptFor(command.commandId, true, nextState.revision, event.sequence, code, message);
  nextState.receipts = [...state.receipts, { commandId: command.commandId, requestSha256, receipt }];
  return { state: nextState, events: [event], receipt };
}

function acceptMutationMany(state: GameState, command: CommandEnvelope, requestSha256: string, nextState: GameState, events: readonly { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[], code: string, message: string): CommandReduction {
  if (events.length === 0) throw new Error('COMMAND_MUTATION_REQUIRES_EVENT');
  const revision = state.revision + 1;
  const sequencedEvents = events.map((event, index) => ({ ...event, sequence: state.lastEventSequence + index + 1 }));
  const finalState: GameState = {
    ...nextState,
    revision,
    lastEventSequence: state.lastEventSequence + events.length,
  };
  const receipt = receiptFor(command.commandId, true, revision, sequencedEvents.at(-1)!.sequence, code, message);
  finalState.receipts = [...state.receipts, { commandId: command.commandId, requestSha256, receipt }];
  return { state: finalState, events: sequencedEvents, receipt };
}

export function reduceCommand(
  state: GameState,
  input: unknown,
  world: WorldDefinition,
  options: { allowSystemOnlyRevisionAdvance?: boolean } = {},
): CommandReduction {
  const validation = validateCommandEnvelope(input);
  const commandId = typeof input === 'object' && input !== null && 'commandId' in input
    ? String((input as { commandId?: unknown }).commandId ?? '')
    : '';
  if (!validation.success) return reject(state, commandId, validation.issue.code, validation.issue.message);
  const command = validation.data;
  const requestSha256 = canonicalStateHash(command);
  const priorReceipt = state.receipts.find(record => record.commandId === command.commandId);
  if (priorReceipt) {
    if (priorReceipt.requestSha256 !== requestSha256) return reject(state, command.commandId, 'COMMAND_ID_REUSED', 'A command ID cannot be reused with a different request.');
    return { state, events: [], receipt: priorReceipt.receipt };
  }
  if (world.id !== state.worldPackageId) return reject(state, command.commandId, 'CONTENT_MISMATCH', 'The save is bound to a different world package.', requestSha256);
  if (command.saveId !== state.saveId) return reject(state, command.commandId, 'SAVE_ID_MISMATCH', 'Command targets a different save.', requestSha256);
  if (command.expectedRevision !== state.revision
    && !(options.allowSystemOnlyRevisionAdvance && command.expectedRevision < state.revision)) {
    return reject(state, command.commandId, 'STALE_REVISION', 'The save changed; refresh the player view and retry with the current revision.', requestSha256);
  }

  if (command.type === 'inspect_entity') {
    const ref = command.payload.entity;
    if (!isKnownEntity(ref, state)) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'That entity is unavailable in the current player view.', requestSha256);
    const key = entityKey(ref);
    if (state.playerKnowledge.lastInspectedEntityIds.includes(key)) return acceptWithoutMutation(state, command, requestSha256, 'ALREADY_INSPECTED', 'This known entity has already been inspected.');
    const lastInspectedEntityIds = [...new Set([...state.playerKnowledge.lastInspectedEntityIds, key])].sort();
    if (ref.type === 'cache') {
      const signal = state.spatial.signals.find(candidate => candidate.signalId === ref.id);
      if (signal) {
        const identified = { ...signal, discovery: 'identified' as const };
        const chestId = signal.targetId.startsWith('CH-LL01-') ? signal.targetId : null;
        const knownChestIds = chestId ? [...new Set([...state.playerKnowledge.knownChestIds, chestId])].sort() : state.playerKnowledge.knownChestIds;
        const lastSeenByEntity = chestId ? {
          ...state.playerKnowledge.lastSeenByEntity,
          [`cache:${chestId}`]: { observedAtElapsedMs: state.simElapsedMs, knowledge: 'current' as const },
        } : state.playerKnowledge.lastSeenByEntity;
        return acceptMutation(state, command, requestSha256, {
          spatial: { ...state.spatial, signals: state.spatial.signals.map(candidate => candidate.signalId === ref.id ? identified : candidate) },
          fieldChestStates: chestId ? state.fieldChestStates.map(candidate => candidate.chestId === chestId ? { ...candidate, discovery: 'identified' as const } : candidate) : state.fieldChestStates,
          playerKnowledge: { ...state.playerKnowledge, lastInspectedEntityIds, knownChestIds, lastSeenByEntity },
        }, 'known_entity_inspected', { entity: ref, discovery: 'identified' }, 'INSPECTION_RECORDED', 'The discovered field signal was identified.');
      }
    }
    if (ref.type === 'resource') {
      const resourceBalances = state.spatial.resourceBalances.map(balance => balance.resourceId === ref.id ? {
        ...balance, amountKnowledge: 'known_exact' as const, lastSettledAtElapsedMs: state.simElapsedMs,
      } : balance);
      return acceptMutation(state, command, requestSha256, {
        spatial: { ...state.spatial, resourceBalances },
        playerKnowledge: { ...state.playerKnowledge, lastInspectedEntityIds },
      }, 'known_entity_inspected', { entity: ref }, 'INSPECTION_RECORDED', 'Inspection of a known resource was recorded.');
    }
    return acceptMutation(state, command, requestSha256, {
      playerKnowledge: { ...state.playerKnowledge, lastInspectedEntityIds },
    }, 'known_entity_inspected', { entity: ref }, 'INSPECTION_RECORDED', 'Inspection of a known entity was recorded.');
  }

  if (command.type === 'inspect_starter_container') {
    const container = state.inventory.containers.find(candidate => candidate.id === command.payload.containerId);
    if (!container || !canAccessStarterContainer(container.id, state, world)) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'That container is unavailable or out of reach.', requestSha256);
    if (container.observed) return acceptWithoutMutation(state, command, requestSha256, 'ALREADY_OBSERVED', 'The container contents are already known.');
    const containers = state.inventory.containers.map(candidate => candidate.id === container.id ? { ...candidate, observed: true } : candidate);
    const bagSeed = container.kind === 'carried_bag' ? { ...state.bagSeed, inspected: true } : state.bagSeed;
    return acceptMutation(state, command, requestSha256, { inventory: { ...state.inventory, containers }, bagSeed },
      'starter_container_inspected', { containerId: container.id, containerKind: container.kind }, 'CONTAINER_INSPECTED', 'The accessible starter container was inspected.');
  }

  if (command.type === 'inspect_career_card') {
    if (state.player.career.state !== 'unemployed_card_sealed') return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'The opening card is unavailable.', requestSha256);
    if (state.playerKnowledge.careerCardObserved) return acceptWithoutMutation(state, command, requestSha256, 'ALREADY_OBSERVED', 'The career card payload is already known.');
    return acceptMutation(state, command, requestSha256, {
      playerKnowledge: { ...state.playerKnowledge, careerCardObserved: true },
    }, 'career_card_inspected', {}, 'CAREER_CARD_INSPECTED', 'The sealed career card was inspected; the career remains inactive.');
  }

  if (command.type === 'move') {
    const destination = resolvedDestination(state, world, command.payload);
    if (!destination) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'Choose a coordinate or an entity already shown in the player view.', requestSha256);
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const result = startMovement(state, world, `MOVE-${idHash}`, command.payload.actorId, destination.coordinate, { kind: destination.kind, entityId: destination.entityId });
    if (!result.order) return reject(state, command.commandId, result.code ?? 'MOVEMENT_UNAVAILABLE', 'The actor cannot reach that destination under the known route rules.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [{
      type: 'movement_order_started', occurredAtElapsedMs: state.simElapsedMs,
      payload: { orderId: result.order.id, actorIds: result.order.actorIds, distanceMm: result.order.totalDistanceMm, uncertainty: result.order.pathSegments.some(segment => segment.uncertainty === 'uncertain') },
    }], 'MOVEMENT_STARTED', 'The travel order was accepted.');
  }

  if (command.type === 'cancel_travel') {
    const result = cancelTravel(state, world, command.payload.orderId, state.simElapsedMs);
    if (!result.event) return reject(state, command.commandId, result.code ?? 'MOVEMENT_ORDER_NOT_ACTIVE', 'The movement order is unavailable.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'MOVEMENT_CANCELLED', 'Travel was cancelled at the actor’s current position.');
  }

  if (command.type === 'search') {
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const jobId = `SEARCH-${idHash}`;
    const result = startSearchJob(state, world, jobId, command.payload.actorId, command.payload.center, command.payload.radiusMm);
    if (!result.job) return reject(state, command.commandId, result.code ?? 'SEARCH_UNAVAILABLE', 'The actor cannot search this area.', requestSha256);
    const next = structuredClone(state);
    next.spatial.searchJobs = [...next.spatial.searchJobs, result.job];
    next.jobs = [...next.jobs, { id: jobId, kind: 'spatial_search', status: 'active', actorIds: [...result.job.actorIds], reservedItemIds: [], startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null }];
    next.exploration.searchHistory = [...next.exploration.searchHistory, { searchId: jobId, startedAtElapsedMs: state.simElapsedMs, status: 'active' }];
    return acceptMutationMany(state, command, requestSha256, next, [{
      type: 'spatial_search_started', occurredAtElapsedMs: state.simElapsedMs,
      payload: { jobId, actorId: command.payload.actorId, envelopeRadiusMm: result.job.envelopeRadiusMm, laneWidthMm: result.job.laneWidthMm },
    }], 'SEARCH_STARTED', 'The search job was started.');
  }

  if (command.type === 'harvest') {
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const jobId = `HARVEST-${idHash}`;
    const result = startHarvestJob(state, world, jobId, command.payload.actorId, command.payload.resourceId, command.payload.materialId, command.payload.quantity, command.payload.toolItemId);
    if (!result.job) return reject(state, command.commandId, result.code ?? 'HARVEST_UNAVAILABLE', 'The actor cannot harvest this resource.', requestSha256);
    const next = structuredClone(state);
    next.spatial.harvestJobs = [...next.spatial.harvestJobs, result.job];
    next.spatial.resourceBalances = next.spatial.resourceBalances.map(balance => balance.resourceId === result.job!.resourceId
      ? { ...balance, reserved: balance.reserved + result.job!.reservedQuantity, lastSettledAtElapsedMs: state.simElapsedMs }
      : balance);
    next.jobs = [...next.jobs, { id: jobId, kind: 'resource_harvest', status: 'active', actorIds: [...result.job.actorIds], reservedItemIds: [result.job.toolItemId], startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null }];
    return acceptMutationMany(state, command, requestSha256, next, [{
      type: 'harvest_job_started', occurredAtElapsedMs: state.simElapsedMs,
      payload: { jobId, resourceId: result.job.resourceId, materialId: result.job.materialId, quantity: result.job.requestedQuantity },
    }], 'HARVEST_STARTED', 'The harvest and return job was started.');
  }

  if (command.type === 'cancel_spatial_job') {
    const result = cancelSpatialJob(state, command.payload.jobId, state.simElapsedMs);
    if (!result.event) return reject(state, command.commandId, result.code ?? 'SPATIAL_JOB_NOT_ACTIVE', 'The spatial job is unavailable.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'SPATIAL_JOB_CANCELLED', 'The spatial job was cancelled.');
  }

  if (command.type === 'transfer_item') {
    const result = transferItem(state, world, command.payload.actorId, command.payload.sourceContainerId, command.payload.destinationContainerId, command.payload.itemId, command.payload.quantity);
    if (result.code) return reject(state, command.commandId, result.code, 'The item could not be transferred between the selected containers.', requestSha256);
    return acceptMutation(state, command, requestSha256, { inventory: result.state.inventory }, 'inventory_item_transferred', {
      actorId: command.payload.actorId, sourceContainerId: command.payload.sourceContainerId,
      destinationContainerId: command.payload.destinationContainerId, itemId: command.payload.itemId, quantity: command.payload.quantity,
    }, 'ITEM_TRANSFERRED', 'The item was transferred.');
  }

  if (command.type === 'repair') {
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const result = startConstructionJob(state, world, { id: `CONSTRUCTION-${idHash}`, kind: 'repair', ...command.payload });
    if (result.code) return reject(state, command.commandId, result.code, 'House repair requirements changed; refresh the preview.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'HOUSE_REPAIR_STARTED', 'The damaged Lord House repair job was started with reserved materials.');
  }

  if (command.type === 'build') {
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const result = startConstructionJob(state, world, { id: `CONSTRUCTION-${idHash}`, kind: 'build', ...command.payload });
    if (result.code) return reject(state, command.commandId, result.code, 'Construction requirements changed; refresh the server placement and cost preview.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CONSTRUCTION_STARTED', 'The construction job was started with reserved materials.');
  }

  if (command.type === 'assign_construction_workers') {
    const result = assignConstructionWorkers(state, world, command.payload.jobId, command.payload.workerIds);
    if (result.code) return reject(state, command.commandId, result.code, 'Workers could not be assigned to this construction job.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CONSTRUCTION_WORKERS_ASSIGNED', 'The construction workforce assignment was updated.');
  }

  if (command.type === 'cancel_construction_job') {
    const result = cancelConstructionJob(state, command.payload.jobId);
    if (result.code) return reject(state, command.commandId, result.code, 'The construction job is no longer cancellable.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CONSTRUCTION_CANCELLED', 'Work progress was lost and all unconsumed reservations were released.');
  }

  if (command.type === 'recruit_resident') {
    const result = recruitResidents(state, world, { ...command.payload, commandId: command.commandId });
    if (result.code) return reject(state, command.commandId, result.code, 'Recruitment did not consume food or change the roster.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'RESIDENTS_RECRUITED', 'The farmhouse recruited residents using its source-defined food cost.');
  }

  if (command.type === 'operate_heater') {
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    const result = startHeaterService(state, world, { id: `HEATER-SERVICE-${idHash}`, ...command.payload });
    if (result.code) return reject(state, command.commandId, result.code, 'The heater requires an active building, reachable worker, accessible WOOD, and no active fuel cycle.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'HEATER_SERVICE_STARTED', 'One WOOD was reserved for the source-defined twenty-minute heating service.');
  }

  if (command.type === 'split_stack') {
    const newItemId = `ITEM-SPLIT-${canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase()}`;
    const result = splitStack(state, world, { ...command.payload, newItemId });
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'ITEM_CANNOT_BE_SPLIT', 'The item stack could not be split.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'STACK_SPLIT', 'The stack was split without changing its total quantity.');
  }

  if (command.type === 'merge_stacks') {
    const result = mergeStacks(state, world, command.payload);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'STACKS_NOT_COMPATIBLE', 'The item stacks could not be merged.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'STACKS_MERGED', 'The compatible stacks were merged.');
  }

  if (command.type === 'consume_item') {
    const result = consumeItem(state, world, command.payload);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'ITEM_CONSUMPTION_CONTRACT_NOT_COMPILED', 'The item could not be consumed.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'ITEM_CONSUMED', 'The food item was consumed and removed from inventory.');
  }

  if (command.type === 'equip' || command.type === 'unequip_item') {
    const reason = equipmentBlocker(state, command.payload.unitId, command.payload.itemId);
    return reject(state, command.commandId, reason ?? 'EQUIPMENT_SLOT_RULE_NOT_COMPILED', 'Equipment was not changed because the source anatomy and slot contract is unavailable.', requestSha256);
  }

  if (command.type === 'open_cache') {
    const chest = world.fieldChests.find(candidate => candidate.id === command.payload.chestId && state.playerKnowledge.knownChestIds.includes(candidate.id));
    const position = actorPosition(state, command.payload.actorId);
    if (!chest || !position || Math.hypot(position.xMm - chest.position.xMm, position.yMm - chest.position.yMm) > world.navigationOverlay.interactionRangeMm) {
      return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'The identified cache must be within reach.', requestSha256);
    }
    return reject(state, command.commandId, materializeChestLootBlocker(world), 'The chest reward candidate pool is not compiled.', requestSha256);
  }

  if (command.type === 'set_clock_speed') {
    let clockControl;
    try { clockControl = selectedSpeed(command.payload.speed, command.payload.customMultiplier); }
    catch { return reject(state, command.commandId, 'CLOCK_SPEED_INVALID', 'The requested clock speed is outside the supported range.', requestSha256); }
    clockControl.stopCondition = command.payload.stopCondition ?? (clockControl.status === 'paused' ? 'none' : state.clockControl.stopCondition);
    return acceptMutation(state, command, requestSha256, { clockControl }, 'clock_speed_changed', {
      selection: clockControl.selection,
      speedPermille: clockControl.speedPermille,
      stopCondition: clockControl.stopCondition,
    }, 'CLOCK_SPEED_CHANGED', clockControl.status === 'paused' ? 'Simulation paused.' : 'Simulation speed accepted.');
  }

  if (command.type === 'advance_to_boundary') {
    const stopCondition = command.payload.boundaryId;
    return acceptMutation(state, command, requestSha256, {
      clockControl: { ...state.clockControl, stopCondition },
    }, 'clock_stop_condition_set', { stopCondition }, 'CLOCK_STOP_CONDITION_SET', 'The server will pause at the selected condition.');
  }

  if (command.type === 'enqueue_tomb') {
    if (command.payload.blueprintId !== TOMB_STANDARD_BLUEPRINT_ID) return reject(state, command.commandId, 'TOMB_BLUEPRINT_UNKNOWN', 'Only the source-locked standard T0 Tomb output is available.', requestSha256);
    const idHash = canonicalStateHash({ saveId: state.saveId, commandId: command.commandId }).slice(0, 20).toUpperCase();
    try {
      const result = enqueueTombJob(state, `TOMB-JOB-${idHash}`, `TOMB-UNIT-${idHash}`);
      return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'TOMB_JOB_ENQUEUED', 'The standard Tomb output was added to the queue.');
    } catch { return reject(state, command.commandId, 'TOMB_JOB_INVALID', 'The Tomb job could not be added.', requestSha256); }
  }

  if (command.type === 'cancel_tomb') {
    try {
      const result = cancelTombJob(state, command.payload.jobId);
      return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'TOMB_JOB_CANCELLED', 'The unstarted Tomb job was cancelled.');
    } catch (error) {
      const code = error instanceof Error && error.message === 'TOMB_ACTIVE_CANCEL_UNRESOLVED' ? 'TOMB_ACTIVE_CANCEL_UNRESOLVED' : 'TOMB_JOB_NOT_CANCELLABLE';
      return reject(state, command.commandId, code, 'Only queued or blocked jobs without reserved inputs can be cancelled.', requestSha256);
    }
  }

  if (command.type === 'refuel_fire') {
    const container = state.inventory.containers.find(item => item.id === command.payload.containerId);
    const accessible = Boolean(container && canAccessStarterContainer(container.id, state, world));
    const stack = container?.stacks.find(item => item.itemId === command.payload.itemId && item.templateId === 'WOOD');
    if (state.territory.survivalFire.fuelKnowledge !== 'known' || state.territory.survivalFire.fuelRemaining === null) {
      return reject(state, command.commandId, 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED', 'The opening fire fuel amount is unknown, so an exact remaining-fuel total cannot be calculated.', requestSha256);
    }
    if (!container || !stack || !accessible || !container.observed) return reject(state, command.commandId, 'FUEL_NOT_ACCESSIBLE', 'Accessible, observed WOOD is required.', requestSha256);
    if (stack.quantity - (stack.reservedQuantity ?? 0) < command.payload.quantity) return reject(state, command.commandId, 'INSUFFICIENT_WOOD', 'The container does not hold enough unreserved WOOD.', requestSha256);
    const containers = state.inventory.containers.map(item => item.id === container.id ? {
      ...item,
      stacks: item.stacks.flatMap(stackItem => stackItem.itemId !== stack.itemId ? [stackItem] : stackItem.quantity === command.payload.quantity ? [] : [{ ...stackItem, quantity: stackItem.quantity - command.payload.quantity }]),
    } : item);
    const fire = state.territory.survivalFire;
    const knownFuel = fire.fuelRemaining + command.payload.quantity;
    return acceptMutation(state, command, requestSha256, {
      inventory: { ...state.inventory, containers },
      territory: { ...state.territory, survivalFire: {
        ...fire,
        fuelRemaining: knownFuel,
        fuelKnowledge: 'known',
        fuelBlocker: null,
        nextFuelConsumptionAtElapsedMs: fire.active ? (fire.nextFuelConsumptionAtElapsedMs ?? state.simElapsedMs + 15 * 60_000) : null,
      } },
    }, 'fire_refuelled', { itemId: stack.itemId, quantity: command.payload.quantity, remaining: knownFuel }, 'FIRE_REFUELLED', 'WOOD was transferred to the survival fire.');
  }

  if (command.type === 'extinguish_fire') {
    if (!state.territory.survivalFire.active) return reject(state, command.commandId, 'FIRE_ALREADY_OFF', 'The survival fire is already off.', requestSha256);
    return acceptMutation(state, command, requestSha256, {
      territory: { ...state.territory, survivalFire: { ...state.territory.survivalFire, active: false, nextFuelConsumptionAtElapsedMs: null } },
    }, 'survival_fire_extinguished', { reason: 'player_command' }, 'FIRE_EXTINGUISHED', 'The fire is off; remaining fuel was retained.');
  }

  if (command.type === 'light_fire') {
    if (state.territory.survivalFire.fuelRemaining === null) return reject(state, command.commandId, 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED', 'Known assigned WOOD is required before the fire can be lit.', requestSha256);
    if (state.territory.survivalFire.fuelRemaining < 1) return reject(state, command.commandId, 'FUEL_REQUIRED', 'At least one WOOD is required before the fire can be lit.', requestSha256);
    if (state.territory.survivalFire.active) return reject(state, command.commandId, 'FIRE_ALREADY_ON', 'The survival fire is already active.', requestSha256);
    return acceptMutation(state, command, requestSha256, {
      territory: { ...state.territory, survivalFire: { ...state.territory.survivalFire, active: true, fuelBlocker: null, nextFuelConsumptionAtElapsedMs: state.simElapsedMs + 15 * 60_000 } },
    }, 'survival_fire_lit', {}, 'FIRE_LIT', 'The fire was lit using assigned WOOD.');
  }

  const reason = disabledReasons[command.type];
  return reject(state, command.commandId, reason.code, reason.message, requestSha256);
}
