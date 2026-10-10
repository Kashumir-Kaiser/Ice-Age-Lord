import type { ActionAvailability, CommandEnvelope, CommandEvent, CommandReceipt, CommandReduction, CommandType, EntityRef, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';
import { canAccessStarterContainer } from './access.ts';
import { entityKey } from './view.ts';

const disabledReasons: Readonly<Record<Exclude<CommandType, 'inspect_entity' | 'inspect_starter_container' | 'inspect_career_card'>, { code: string; message: string }>> = {
  activate_career_card: { code: 'CAREER_CARD_FLOW_NOT_IMPLEMENTED', message: 'Career activation is unavailable until its verified flow is implemented.' },
  set_clock_speed: { code: 'AUTHORITATIVE_TIME_STAGE_04', message: 'Clock control becomes available with the authoritative time system.' },
  advance_to_boundary: { code: 'AUTHORITATIVE_TIME_STAGE_04', message: 'Time boundaries are settled by the server time system.' },
  enqueue_tomb: { code: 'TOMB_QUEUE_STAGE_04', message: 'Tomb production is unavailable until its queue rules are implemented.' },
  move: { code: 'MOVEMENT_RULES_STAGE_05', message: 'Travel is unavailable until routes, access and settlement rules are implemented.' },
  survey: { code: 'SURVEY_RULES_STAGE_05', message: 'Surveying is unavailable until its source-locked contracts are implemented.' },
  search: { code: 'SEARCH_RULES_STAGE_05', message: 'Searching is unavailable until spatial sweep and target rules are implemented.' },
  harvest: { code: 'RESOURCE_LEDGER_STAGE_05', message: 'Resource extraction is unavailable until the authoritative balance ledger is implemented.' },
  open_cache: { code: 'CHEST_LIFECYCLE_STAGE_05', message: 'Field chests cannot be opened until access and reward commitments are implemented.' },
  repair: { code: 'CONSTRUCTION_ECONOMY_STAGE_06', message: 'Repair is unavailable until reservations and work settlement are implemented.' },
  build: { code: 'CONSTRUCTION_ECONOMY_STAGE_06', message: 'Construction is unavailable until blueprint, site and worker contracts are implemented.' },
  craft: { code: 'CONSTRUCTION_ECONOMY_STAGE_06', message: 'Crafting is unavailable until recipe and reservation contracts are implemented.' },
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
  if (type === 'inspect_entity') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The entity must already be known to the player.'] };
  if (type === 'inspect_starter_container') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The container must be in reach and belong to the player.'] };
  if (type === 'inspect_career_card') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The sealed opening card must still be available.'] };
  return staticAvailability(type);
}

function isKnownEntity(ref: EntityRef, state: GameState): boolean {
  switch (ref.type) {
    case 'site': return state.playerKnowledge.knownSiteIds.includes(ref.id);
    case 'cache': return state.playerKnowledge.knownChestIds.includes(ref.id);
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

export function previewCommand(state: GameState, input: unknown, world: WorldDefinition): ActionAvailability {
  const validation = validateCommandEnvelope(input);
  if (!validation.success) return { actionId: 'invalid', enabled: false, reasonCode: 'INVALID_COMMAND', requirements: [validation.issue.message] };
  const command = validation.data;
  if (command.saveId !== state.saveId) return { actionId: command.type, enabled: false, reasonCode: 'SAVE_ID_MISMATCH', requirements: ['The command must target the selected save.'] };
  if (world.id !== state.worldPackageId) return { actionId: command.type, enabled: false, reasonCode: 'CONTENT_MISMATCH', requirements: ['The save content package is unavailable.'] };
  if (command.expectedRevision !== state.revision) return { actionId: command.type, enabled: false, reasonCode: 'STALE_REVISION', requirements: [`Current revision is ${state.revision}.`] };
  if (command.type === 'inspect_entity') {
    const ref = command.payload.entity;
    return isKnownEntity(ref, state)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The entity is unavailable in the current player view.'] };
  }
  if (command.type === 'inspect_starter_container') {
    const containerId = command.payload.containerId;
    return canAccessStarterContainer(containerId, state)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The container must be in reach and belong to the player.'] };
  }
  if (command.type === 'inspect_career_card') {
    return state.player.career.state === 'unemployed_card_sealed'
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The opening card is no longer available.'] };
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

export function reduceCommand(state: GameState, input: unknown, world: WorldDefinition): CommandReduction {
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
  if (command.expectedRevision !== state.revision) return reject(state, command.commandId, 'STALE_REVISION', 'The save changed; refresh the player view and retry with the current revision.', requestSha256);

  if (command.type === 'inspect_entity') {
    const ref = command.payload.entity;
    if (!isKnownEntity(ref, state)) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'That entity is unavailable in the current player view.', requestSha256);
    const key = entityKey(ref);
    if (state.playerKnowledge.lastInspectedEntityIds.includes(key)) return acceptWithoutMutation(state, command, requestSha256, 'ALREADY_INSPECTED', 'This known entity has already been inspected.');
    const lastInspectedEntityIds = [...new Set([...state.playerKnowledge.lastInspectedEntityIds, key])].sort();
    return acceptMutation(state, command, requestSha256, {
      playerKnowledge: { ...state.playerKnowledge, lastInspectedEntityIds },
    }, 'known_entity_inspected', { entity: ref }, 'INSPECTION_RECORDED', 'Inspection of a known entity was recorded.');
  }

  if (command.type === 'inspect_starter_container') {
    const container = state.inventory.containers.find(candidate => candidate.id === command.payload.containerId);
    if (!container || !canAccessStarterContainer(container.id, state)) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'That container is unavailable or out of reach.', requestSha256);
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

  const reason = disabledReasons[command.type];
  return reject(state, command.commandId, reason.code, reason.message, requestSha256);
}
