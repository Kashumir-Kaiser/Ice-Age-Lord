import type { ActionAvailability, CommandEvent, CommandReceipt, CommandReduction, CommandType, EntityRef, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';
import { entityKey } from './view.ts';

const disabledReasons: Readonly<Record<Exclude<CommandType, 'inspect_entity'>, { code: string; message: string }>> = {
  inspect_starter_container: { code: 'CONTAINER_ACCESS_RULES_NOT_IMPLEMENTED', message: 'Container inspection is unavailable until access rules are implemented.' },
  activate_career_card: { code: 'CAREER_CARD_FLOW_NOT_IMPLEMENTED', message: 'Career card activation is unavailable until its verified flow is implemented.' },
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

export function actionAvailability(type: CommandType): ActionAvailability {
  if (type === 'inspect_entity') return { actionId: type, enabled: true, reasonCode: null, requirements: ['The entity must already be known to the player.'] };
  const reason = disabledReasons[type];
  return { actionId: type, enabled: false, reasonCode: reason.code, requirements: [reason.message] };
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

function reject(state: GameState, commandId: string, code: string, message: string, requestSha256?: string): CommandReduction {
  const receipt: CommandReceipt = { commandId, accepted: false, revision: state.revision, eventSequence: null, code, message };
  const nextState = requestSha256 && commandId
    ? { ...state, receipts: [...state.receipts, { commandId, requestSha256, receipt }] }
    : state;
  return {
    state: nextState,
    events: [],
    receipt,
  };
}

export function reduceCommand(state: GameState, input: unknown, _world: WorldDefinition): CommandReduction {
  const validation = validateCommandEnvelope(input);
  const commandId = typeof input === 'object' && input !== null && 'commandId' in input
    ? String((input as { commandId?: unknown }).commandId ?? '')
    : '';
  if (!validation.success) return reject(state, commandId, validation.issue.code, validation.issue.message);
  const command = validation.data;
  const requestSha256 = canonicalStateHash(command);
  const priorReceipt = state.receipts.find(record => record.commandId === command.commandId);
  if (priorReceipt) {
    if (priorReceipt.requestSha256 !== requestSha256) {
      return reject(state, command.commandId, 'COMMAND_ID_REUSED', 'A command ID cannot be reused with a different request.');
    }
    return { state, events: [], receipt: priorReceipt.receipt };
  }
  if (_world.id !== state.worldPackageId) return reject(state, command.commandId, 'WORLD_PACKAGE_MISMATCH', 'The save is bound to a different world package.', requestSha256);
  if (command.saveId !== state.saveId) return reject(state, command.commandId, 'SAVE_ID_MISMATCH', 'Command targets a different save.', requestSha256);
  if (command.expectedRevision !== state.revision) return reject(state, command.commandId, 'REVISION_CONFLICT', 'The save changed; refresh the player view and retry with the current revision.', requestSha256);
  if (command.type !== 'inspect_entity') {
    const reason = disabledReasons[command.type];
    return reject(state, command.commandId, reason.code, reason.message, requestSha256);
  }

  const ref = command.payload.entity as EntityRef;
  if (!isKnownEntity(ref, state)) return reject(state, command.commandId, 'ENTITY_NOT_KNOWN', 'That entity is not available in the current player view.', requestSha256);
  const key = entityKey(ref);
  const lastInspectedEntityIds = [...new Set([...state.playerKnowledge.lastInspectedEntityIds, key])].sort();
  const incrementedState: GameState = {
    ...state,
    revision: state.revision + 1,
    lastEventSequence: state.lastEventSequence + 1,
    playerKnowledge: { ...state.playerKnowledge, lastInspectedEntityIds },
  };
  const event: CommandEvent = {
    sequence: incrementedState.lastEventSequence,
    type: 'known_entity_inspected',
    occurredAtElapsedMs: state.simElapsedMs,
    payload: { entity: ref },
  };
  const receipt: CommandReceipt = {
    commandId: command.commandId,
    accepted: true,
    revision: incrementedState.revision,
    eventSequence: event.sequence,
    code: 'INSPECTION_RECORDED',
    message: 'Inspection of a known entity was recorded.',
  };
  const nextState: GameState = {
    ...incrementedState,
    receipts: [...state.receipts, { commandId: command.commandId, requestSha256, receipt }],
  };
  return { state: nextState, events: [event], receipt };
}
