import type { ActionAvailability, CommandEnvelope, CommandReceipt, CommandReduction, CommandType, CoordinateMm, EntityRef, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';
import { canAccessStarterContainer } from './access.ts';
import { entityKey } from './view.ts';
import { cancelTombJob, enqueueTombJob, selectedSpeed, TOMB_STANDARD_BLUEPRINT_ID } from './time.ts';
import { assignConstructionWorkers, cancelConstructionJob, previewBuild, previewHeaterService, previewRepair, recruitResidents, startConstructionJob, startHeaterService } from './construction.ts';
import { consumeItem, equipItem, equipmentBlocker, mergeStacks, splitStack, unequipBlocker, unequipItem } from './inventory.ts';
import { activateOpeningCareer, butcherCorpse, directReviveAvailability, reviveDirect } from './stage07.ts';
import { attackAvailability, orderStage07Retreat, retreatAvailability, startStage07Encounter } from './combat.ts';
import {
  actorAvailability,
  cancelSpatialJob,
  cancelTravel,
  previewMovement,
  currentSight,
  startHarvestJob,
  startMovement,
  startSearchJob,
  transferItem,
} from './spatial.ts';
import { acceptQ08, botMarketPurchaseAvailability, buyBotMarketListing, cancelAuctionBid, claimOpeningLevelReward, claimQ08Reward, escortQ08, negotiateQ08, placeAuctionBid, purchaseMarketOffer } from './stage08.ts';
import { OPENING_LEVEL_CLOSES_AT_MS, OPENING_LEVEL_DISPLAY_DELAY_MS, OPENING_LEVEL_OPENS_AT_MS } from './openingRanking.ts';
import { openFieldChest } from './chestLoot.ts';
import { buyEventOffer, claimEventReward, chooseEventPath, recordEventActivities } from './eventRuntime.ts';

const disabledReasons: Readonly<Record<Exclude<CommandType, 'inspect_entity' | 'inspect_bot' | 'inspect_starter_container' | 'inspect_career_card'>, { code: string; message: string }>> = {
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
  search: { code: 'SEARCH_RULES_STAGE_05', message: 'Choose an area and a chest-search or hunt sweep mode.' },
  harvest: { code: 'RESOURCE_LEDGER_STAGE_05', message: 'Resource extraction is unavailable until the authoritative balance ledger is implemented.' },
  cancel_spatial_job: { code: 'SPATIAL_JOB_NOT_ACTIVE', message: 'The selected spatial job is no longer active.' },
  transfer_item: { code: 'CONTAINER_NOT_ACCESSIBLE', message: 'Both containers must be accessible to the player.' },
  open_cache: { code: 'CHEST_LIFECYCLE_STAGE_05', message: 'Field chests cannot be opened until access and reward commitments are implemented.' },
  repair: { code: 'HOUSE_REPAIR_CONTRACT_UNAVAILABLE', message: 'The damaged Lord House repair contract, accessible workers and reserved inputs are required.' },
  build: { code: 'BUILDING_BLUEPRINT_OR_PLACEMENT_INVALID', message: 'A source-defined unlocked blueprint and server-approved footprint are required.' },
  craft: { code: 'CRAFTING_STAGE_04', message: 'Crafting is unavailable until a source recipe, materials and output contract are registered.' },
  assign_construction_workers: { code: 'CONSTRUCTION_JOB_NOT_ACTIVE', message: 'Choose an active construction job.' },
  cancel_construction_job: { code: 'CONSTRUCTION_JOB_NOT_CANCELLABLE', message: 'Choose an active construction job.' },
  recruit_resident: { code: 'FARMHOUSE_NOT_ACTIVE', message: 'Build the polar farmhouse before recruiting residents.' },
  operate_heater: { code: 'HEATER_NOT_ACTIVE', message: 'Construct the Level 1 heater before operating it.' },
  split_stack: { code: 'ITEM_CANNOT_BE_SPLIT', message: 'The accessible stack must have unreserved items and free container capacity.' },
  merge_stacks: { code: 'STACKS_NOT_COMPATIBLE', message: 'Only compatible unreserved stacks can be merged.' },
  consume_item: { code: 'ITEM_CONSUMPTION_CONTRACT_NOT_COMPILED', message: 'Only food with a compiled consumption contract can be consumed.' },
  unequip_item: { code: 'EQUIPMENT_PROFILE_NOT_COMPILED', message: 'The unit equipment slot profile is not compiled.' },
  revive: { code: 'REVIVAL_RULES_STAGE_07', message: 'Revival is unavailable until corpse identity and eligibility rules are implemented.' },
  butcher_corpse: { code: 'CORPSE_DISPOSITION_STAGE_07', message: 'Corpse disposal is unavailable until exclusive lifecycle rules are implemented.' },
  equip: { code: 'EQUIPMENT_RULES_STAGE_07', message: 'Equipment changes are unavailable until the item and unit ledgers are implemented.' },
  attack: { code: 'COMBAT_RULES_STAGE_07', message: 'Choose an owned, equipped warrior and the visible H0 target.' },
  retreat: { code: 'COMBAT_ENCOUNTER_NOT_ACTIVE', message: 'There is no active encounter to retreat from.' },
  shop_transaction: { code: 'TRADE_RULES_STAGE_08', message: 'Transactions are unavailable until offer, currency and receipt rules are implemented.' },
  buy_bot_market_listing: { code: 'BOT_MARKET_LISTING_NOT_AVAILABLE', message: 'The bot blueprint listing is unavailable.' },
  accept_quest: { code: 'QUEST_NOT_OFFERED', message: 'The selected fixed quest is not available.' },
  negotiate_caravan: { code: 'CARAVAN_NOT_ACCESSIBLE', message: 'The caravan negotiation is not available at this location.' },
  escort_caravan: { code: 'CARAVAN_NOT_READY_TO_ESCORT', message: 'The caravan is not ready to travel.' },
  claim_quest_reward: { code: 'QUEST_REWARD_NOT_CLAIMABLE', message: 'The selected quest has no claimable reward.' },
  claim_opening_rank_reward: { code: 'OPENING_REWARD_NOT_CLAIMABLE', message: 'The fixed opening-board reward is not ready to claim.' },
  place_auction_bid: { code: 'AUCTION_LOT_NOT_OPEN', message: 'The selected auction lot is not open.' },
  cancel_auction_bid: { code: 'AUCTION_BID_NOT_OPEN', message: 'The selected bid is not open.' },
  claim_event_reward: { code: 'EVENT_REWARD_NOT_CLAIMABLE', message: 'No event reward is ready to claim.' },
  choose_event_path: { code: 'EVENT_CHOICE_NOT_AVAILABLE', message: 'No event path choice is currently open.' },
  buy_event_offer: { code: 'EVENT_SHOP_CLOSED', message: 'No event shop is currently open.' },
};

function staticAvailability(type: CommandType): ActionAvailability {
  if (type === 'inspect_entity' || type === 'inspect_bot' || type === 'inspect_starter_container' || type === 'inspect_career_card') {
    return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  }
  const reason = disabledReasons[type];
  return { actionId: type, enabled: false, reasonCode: reason.code, requirements: [reason.message] };
}

function routePointAt(points: readonly CoordinateMm[], distanceMm: number): CoordinateMm {
  let remaining = Math.max(0, distanceMm);
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const segment = Math.hypot(to.xMm - from.xMm, to.yMm - from.yMm);
    if (remaining <= segment || index === points.length - 1) {
      const ratio = segment === 0 ? 1 : Math.min(1, remaining / segment);
      return {
        xMm: Math.round(from.xMm + (to.xMm - from.xMm) * ratio),
        yMm: Math.round(from.yMm + (to.yMm - from.yMm) * ratio),
        sourceZMetres: from.sourceZMetres ?? 0,
      };
    }
    remaining -= segment;
  }
  return points[0] ?? { xMm: 0, yMm: 0 };
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
  if (type === 'split_stack' || type === 'merge_stacks' || type === 'consume_item' || type === 'activate_career_card' || type === 'revive' || type === 'butcher_corpse' || type === 'equip' || type === 'unequip_item' || type === 'attack' || type === 'retreat') return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
  if (type === 'shop_transaction' || type === 'accept_quest' || type === 'negotiate_caravan' || type === 'escort_caravan'
    || type === 'buy_bot_market_listing'
    || type === 'claim_quest_reward' || type === 'place_auction_bid' || type === 'cancel_auction_bid'
    || type === 'claim_event_reward' || type === 'choose_event_path' || type === 'buy_event_offer') return { actionId: type, enabled: true, reasonCode: null, requirements: [] };
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
    case 'corpse': return (state.playerKnowledge.knownCorpseIds ?? []).includes(ref.id);
    case 'bot': return (state.playerKnowledge.knownBotIds ?? []).includes(ref.id);
    case 'wildlife': return (state.playerKnowledge.knownWildlifeGroupIds ?? []).includes(ref.id);
  }
}

function botCurrentlyVisible(state: GameState, world: WorldDefinition, botId: string): boolean {
  const bot = state.botPopulation?.chunks.flatMap(chunk => chunk.cold).find(candidate => candidate.botId === botId);
  if (!bot || !(state.playerKnowledge.knownBotIds ?? []).includes(botId)) return false;
  return currentSight(state, world).some(sight => ((sight.center.sourceZMetres ?? 0) < -2) === ((bot.position.sourceZMetres ?? 0) < -2)
    && Math.hypot(sight.center.xMm - bot.position.xMm, sight.center.yMm - bot.position.yMm) <= sight.radiusMm);
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
  const wildlife = state.wildlife.groups.find(candidate => candidate.id === id
    && candidate.discovery === 'known' && (state.playerKnowledge.knownWildlifeGroupIds ?? []).includes(id));
  if (wildlife) return { coordinate: wildlife.position, kind: 'entity' as const, entityId: id };
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
    if (ref.type === 'bot') return botCurrentlyVisible(state, world, ref.id)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'BOT_NOT_CURRENTLY_VISIBLE', requirements: ['A settlement must be in current sight before its details can be inspected.'] };
    return isKnownEntity(ref, state)
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'NOT_ACCESSIBLE', requirements: ['The entity is unavailable in the current player view.'] };
  }
  if (command.type === 'inspect_bot') return botCurrentlyVisible(state, world, command.payload.botId)
    ? actionAvailability(command.type)
    : { actionId: command.type, enabled: false, reasonCode: 'BOT_NOT_CURRENTLY_VISIBLE', requirements: ['A settlement must be in current sight before its details can be inspected.'] };
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
  if (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary') {
    return state.eventProgressionBlocker
      ? { actionId: command.type, enabled: false, reasonCode: 'EVENT_CONTENT_BLOCKED', requirements: [state.eventProgressionBlocker.playerMessage] }
      : actionAvailability(command.type);
  }
  if (command.type === 'activate_career_card') {
    if (command.payload.cardId !== state.player.career.sealedPayload.careerId) return unavailable(command.type, 'CAREER_CARD_UNKNOWN', 'Use the career encoded by the sealed opening card.');
    if (!state.playerKnowledge.careerCardObserved) return unavailable(command.type, 'CAREER_CARD_NOT_INSPECTED', 'Inspect the sealed card before activating it.');
    return state.player.career.state === 'active'
      ? actionAvailability(command.type)
      : actionAvailability(command.type);
  }
  if (command.type === 'attack') {
    const result = attackAvailability(state, world, command.payload.actorIds, command.payload.targetId);
    return result.code ? unavailable(command.type, result.code, result.requirements.join(' ')) : actionAvailability(command.type);
  }
  if (command.type === 'retreat') {
    const result = retreatAvailability(state, command.payload.actorIds, command.payload.encounterId);
    return result.code ? unavailable(command.type, result.code, result.requirements.join(' ')) : actionAvailability(command.type);
  }
  if (command.type === 'butcher_corpse') {
    const result = butcherCorpse(state, world, command.payload.actorId, command.payload.corpseId);
    return result.code
      ? unavailable(command.type, result.code, result.requirements.join(' '))
      : actionAvailability(command.type);
  }
  if (command.type === 'revive') {
    const result = directReviveAvailability(state, world, command.payload.actorId, command.payload.corpseId);
    return result.code
      ? unavailable(command.type, result.code, result.requirements.join(' '))
      : { actionId: command.type, enabled: true, reasonCode: null, requirements: [], preview: { label: 'Direct Tử Phục', value: '0 mana · 0 materials · 0 time' } };
  }
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
    return accessible && container?.observed && wood && wood.quantity >= command.payload.quantity
      ? actionAvailability(command.type)
      : { actionId: command.type, enabled: false, reasonCode: 'FUEL_NOT_ACCESSIBLE', requirements: ['Accessible, observed WOOD must be present in an owned container.'] };
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
    const result = startSearchJob(state, world, 'PREVIEW-SEARCH', command.payload.actorId, command.payload.center, command.payload.radiusMm, command.payload);
    const routeDistance = (points: readonly CoordinateMm[]) => points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.xMm - points[index]!.xMm, point.yMm - points[index]!.yMm), 0);
    return result.job ? { actionId: command.type, enabled: true, reasonCode: null, requirements: [], preview: {
      label: result.job!.mode === 'hunt' ? 'Area hunt plus return' : 'Area sweep plus return',
      value: (() => {
        const outboundMm = result.job!.path.length > 1 ? Math.hypot(result.job!.path[1]!.xMm - result.job!.path[0]!.xMm, result.job!.path[1]!.yMm - result.job!.path[0]!.yMm) : 0;
        const speed = result.job!.speedMmPerHour!;
        const routeMm = routeDistance(result.job!.path);
        const sweepMm = Math.max(0, routeMm - outboundMm);
        const fullSweepMinutes = Math.ceil(sweepMm * 60 / speed);
        const workLimitMinutes = command.payload.timeLimitMinutes ?? null;
        const workMinutes = workLimitMinutes === null ? fullSweepMinutes : Math.min(workLimitMinutes, fullSweepMinutes);
        const stoppedEarlyByTime = workLimitMinutes !== null && workLimitMinutes < fullSweepMinutes;
        const stopPosition = stoppedEarlyByTime
          ? routePointAt(result.job!.path, outboundMm + workMinutes * speed / 60)
          : result.job!.path.at(-1)!;
        const returnMm = stoppedEarlyByTime
          ? Math.hypot(stopPosition.xMm - result.job!.path[0]!.xMm, stopPosition.yMm - result.job!.path[0]!.yMm)
          : routeDistance(result.job!.returnPath ?? []);
        const etaMinutes = Math.ceil(outboundMm * 60 / speed) + workMinutes + Math.ceil(returnMm * 60 / speed);
        const areaM2 = Math.PI * result.job!.envelopeRadiusMm ** 2 / 1_000_000;
        const limits = [result.job!.targetCount ? `first ${result.job!.targetCount} signal(s)` : null, workLimitMinutes === null ? null : `${workLimitMinutes} min search-work limit`].filter(Boolean).join(' or ');
        return `${(outboundMm / 1_000_000).toFixed(2)} km outbound · ${(sweepMm / 1_000_000).toFixed(2)} km sweep (${Math.round(areaM2).toLocaleString()} m² area) · ${(returnMm / 1_000_000).toFixed(2)} km estimated return · ~${etaMinutes} min total${limits ? ` · search stops at ${limits}, then returns` : ''}${result.job!.targetCount ? ' · target-count ETA uses a full-sweep estimate because hidden density is not disclosed' : ''} · ${result.job!.actorIds.length} scout(s)`;
      })(),
    } } : unavailable(command.type, result.code ?? 'SEARCH_UNAVAILABLE', 'The actors cannot search this area.');
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
    const reason = equipmentBlocker(state, world, command.payload.unitId, command.payload.itemId, command.payload.slotId);
    return reason ? unavailable(command.type, reason, 'The unit must be nearby; the slot and item anatomy tags must match.') : actionAvailability(command.type);
  }
  if (command.type === 'unequip_item') {
    const reason = unequipBlocker(state, world, command.payload.unitId, command.payload.itemId);
    return reason ? unavailable(command.type, reason, 'The equipped item and unit must be accessible.') : actionAvailability(command.type);
  }
  if (command.type === 'accept_quest') {
    const result = acceptQ08(state, world);
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'negotiate_caravan') {
    const result = negotiateQ08(state, world, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'escort_caravan') {
    const result = escortQ08(state, world, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'claim_quest_reward') {
    const result = claimQ08Reward(state, world, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }

  if (command.type === 'claim_opening_rank_reward') {
    const result = claimOpeningLevelReward(state, 'PREVIEW', command.payload.boardId);
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }

  if (command.type === 'shop_transaction') {
    const result = purchaseMarketOffer(state, world, command.payload.offerId, command.payload.destinationContainerId, command.payload.quantity, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'buy_bot_market_listing') {
    const result = botMarketPurchaseAvailability(state, world, command.payload.listingId, command.payload.paymentContainerId, command.payload.paymentItemId);
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'place_auction_bid') {
    const result = placeAuctionBid(state, world, command.payload.lotId, command.payload.quantity, command.payload.unitBid, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'cancel_auction_bid') {
    const result = cancelAuctionBid(state, command.payload.bidId, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'claim_event_reward') {
    const result = claimEventReward(state, command.payload.eventId, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'choose_event_path') {
    const result = chooseEventPath(state, command.payload.eventId, command.payload.choiceId);
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'buy_event_offer') {
    const result = buyEventOffer(state, world, command.payload.eventId, command.payload.destinationContainerId, command.payload.quantity, 'PREVIEW');
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  if (command.type === 'open_cache') {
    const result = openFieldChest(state, world, command.payload.actorId, command.payload.chestId);
    return result.code ? unavailable(command.type, result.code, result.message) : actionAvailability(command.type);
  }
  return staticAvailability(command.type);
}

function receiptFor(commandId: string, accepted: boolean, revision: number, eventSequence: number | null, code: string, message: string): CommandReceipt {
  return { commandId, accepted, revision, eventSequence, code, message };
}

function schedulePlayerBoardPublication(state: GameState): void {
  const population = state.botPopulation;
  if (!population) return;
  const completionAt = (state.progression?.transactions ?? [])
    .filter(transaction => transaction.recipientId === state.player.id && transaction.thresholdsCrossed.includes(10))
    .map(transaction => transaction.occurredAtElapsedMs).sort((a, b) => a - b)[0];
  if (completionAt === undefined || completionAt > OPENING_LEVEL_CLOSES_AT_MS) return;
  const publishAt = Math.max(OPENING_LEVEL_OPENS_AT_MS, completionAt + OPENING_LEVEL_DISPLAY_DELAY_MS);
  if (publishAt > OPENING_LEVEL_CLOSES_AT_MS || population.pendingBoardPublicationAtElapsedMs.includes(publishAt)) return;
  state.botPopulation = { ...population, pendingBoardPublicationAtElapsedMs: [...population.pendingBoardPublicationAtElapsedMs, publishAt].sort((a, b) => a - b) };
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
  const baseState: GameState = {
    ...state,
    ...nextPartial,
  };
  const sourceEvent = {
    type: eventType,
    occurredAtElapsedMs: state.simElapsedMs,
    payload: eventPayload,
  };
  const activity = recordEventActivities(baseState, [sourceEvent]);
  const allEvents = [sourceEvent, ...activity.events].map((event, index) => ({ ...event, sequence: state.lastEventSequence + index + 1 }));
  const nextState: GameState = {
    ...activity.state,
    revision: state.revision + 1,
    lastEventSequence: state.lastEventSequence + allEvents.length,
  };
  schedulePlayerBoardPublication(nextState);
  const receipt = receiptFor(command.commandId, true, nextState.revision, allEvents.at(-1)!.sequence, code, message);
  nextState.receipts = [...state.receipts, { commandId: command.commandId, requestSha256, receipt }];
  return { state: nextState, events: allEvents, receipt };
}

function acceptMutationMany(state: GameState, command: CommandEnvelope, requestSha256: string, nextState: GameState, events: readonly { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[], code: string, message: string): CommandReduction {
  if (events.length === 0) throw new Error('COMMAND_MUTATION_REQUIRES_EVENT');
  const revision = state.revision + 1;
  const activity = recordEventActivities(nextState, events);
  const combinedEvents = [...events, ...activity.events];
  const sequencedEvents = combinedEvents.map((event, index) => ({ ...event, sequence: state.lastEventSequence + index + 1 }));
  const finalState: GameState = {
    ...activity.state,
    revision,
    lastEventSequence: state.lastEventSequence + combinedEvents.length,
  };
  schedulePlayerBoardPublication(finalState);
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
  if (state.eventProgressionBlocker && (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary')) {
    return reject(state, command.commandId, 'EVENT_CONTENT_BLOCKED', state.eventProgressionBlocker.playerMessage, requestSha256);
  }

  if (command.type === 'inspect_entity') {
    const ref = command.payload.entity;
    if (!isKnownEntity(ref, state)) return reject(state, command.commandId, 'NOT_ACCESSIBLE', 'That entity is unavailable in the current player view.', requestSha256);
    if (ref.type === 'bot') {
      if (!botCurrentlyVisible(state, world, ref.id)) return reject(state, command.commandId, 'BOT_NOT_CURRENTLY_VISIBLE', 'A settlement must be in current sight before its details can be inspected.', requestSha256);
      const lastInspectedEntityIds = [...new Set([...state.playerKnowledge.lastInspectedEntityIds, entityKey(ref)])].sort();
      return acceptMutation(state, command, requestSha256, {
        playerKnowledge: { ...state.playerKnowledge, inspectedBotId: ref.id, lastInspectedEntityIds },
      }, 'known_entity_inspected', { entity: ref }, 'INSPECTION_RECORDED', 'The settlement currently in sight was inspected.');
    }
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
      const resource = world.resources.find(candidate => candidate.id === ref.id);
      const featureResourceIds = new Set(world.resources.filter(candidate => candidate.featureId === resource?.featureId).map(candidate => candidate.id));
      const resourceBalances = state.spatial.resourceBalances.map(balance => featureResourceIds.has(balance.resourceId) ? {
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

  if (command.type === 'inspect_bot') {
    const ref = { type: 'bot' as const, id: command.payload.botId };
    if (!botCurrentlyVisible(state, world, ref.id)) return reject(state, command.commandId, 'BOT_NOT_CURRENTLY_VISIBLE', 'A settlement must be in current sight before its details can be inspected.', requestSha256);
    const lastInspectedEntityIds = [...new Set([...state.playerKnowledge.lastInspectedEntityIds, entityKey(ref)])].sort();
    return acceptMutation(state, command, requestSha256, {
      playerKnowledge: { ...state.playerKnowledge, inspectedBotId: ref.id, lastInspectedEntityIds },
    }, 'known_entity_inspected', { entity: ref }, 'INSPECTION_RECORDED', 'The settlement currently in sight was inspected.');
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

  if (command.type === 'attack') {
    const result = startStage07Encounter(state, world, command.payload.actorIds, command.payload.targetId);
    if (result.code || !result.encounter || !result.event) return reject(state, command.commandId, result.code ?? 'COMBAT_UNAVAILABLE', result.requirements.join(' ') || 'The encounter cannot start.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'COMBAT_STARTED', 'The selected unit began a timed encounter with the known target.');
  }

  if (command.type === 'retreat') {
    const result = orderStage07Retreat(state, command.payload.actorIds, command.payload.encounterId);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'COMBAT_ENCOUNTER_NOT_ACTIVE', result.requirements.join(' ') || 'The retreat order is unavailable.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'COMBAT_RETREAT_ORDERED', 'The unit will resolve its retreat on the next combat boundary.');
  }

  if (command.type === 'accept_quest') {
    const result = acceptQ08(state, world);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'QUEST_ACCEPTED', result.message);
  }

  if (command.type === 'negotiate_caravan') {
    const result = negotiateQ08(state, world, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CARAVAN_NEGOTIATED', result.message);
  }

  if (command.type === 'escort_caravan') {
    const result = escortQ08(state, world, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CARAVAN_ESCORT_STARTED', result.message);
  }

  if (command.type === 'claim_quest_reward') {
    const result = claimQ08Reward(state, world, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'QUEST_REWARD_CLAIMED', result.message);
  }

  if (command.type === 'claim_opening_rank_reward') {
    const result = claimOpeningLevelReward(state, command.commandId, command.payload.boardId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'OPENING_RANK_REWARD_CLAIMED', result.message);
  }

  if (command.type === 'claim_event_reward') {
    const result = claimEventReward(state, command.payload.eventId, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'EVENT_REWARD_CLAIMED', result.message);
  }

  if (command.type === 'choose_event_path') {
    const result = chooseEventPath(state, command.payload.eventId, command.payload.choiceId);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'EVENT_CHOICE_INVALID', result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state ?? state, [result.event], 'EVENT_PATH_CHOSEN', result.message);
  }

  if (command.type === 'buy_event_offer') {
    const result = buyEventOffer(state, world, command.payload.eventId, command.payload.destinationContainerId, command.payload.quantity, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'EVENT_SHOP_PURCHASED', result.message);
  }

  if (command.type === 'shop_transaction') {
    const result = purchaseMarketOffer(state, world, command.payload.offerId, command.payload.destinationContainerId, command.payload.quantity, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'SHOP_PURCHASED', result.message);
  }

  if (command.type === 'buy_bot_market_listing') {
    const result = buyBotMarketListing(state, world, command.payload.listingId, command.payload.paymentContainerId, command.payload.paymentItemId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'BOT_BLUEPRINT_PURCHASED', result.message);
  }

  if (command.type === 'place_auction_bid') {
    const result = placeAuctionBid(state, world, command.payload.lotId, command.payload.quantity, command.payload.unitBid, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'AUCTION_BID_OPENED', result.message);
  }

  if (command.type === 'cancel_auction_bid') {
    const result = cancelAuctionBid(state, command.payload.bidId, command.commandId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'AUCTION_BID_CANCELLED', result.message);
  }

  if (command.type === 'activate_career_card') {
    if (command.payload.cardId !== state.player.career.sealedPayload.careerId) return reject(state, command.commandId, 'CAREER_CARD_UNKNOWN', 'That career is not on Lí Lan’s sealed opening card.', requestSha256);
    if (!state.playerKnowledge.careerCardObserved) return reject(state, command.commandId, 'CAREER_CARD_NOT_INSPECTED', 'Inspect the sealed card before activating it.', requestSha256);
    if (state.player.career.state === 'active') return acceptWithoutMutation(state, command, requestSha256, 'ALREADY_ACTIVE', 'The sealed career and its single opening skill are already active.');
    const activated = activateOpeningCareer(state);
    return acceptMutation(state, command, requestSha256, { player: activated.player }, 'career_activated', {
      careerId: state.player.career.sealedPayload.careerId,
      skillId: state.player.career.sealedPayload.openingSkillId,
      skillCount: 1,
      manaAfter: state.player.mana.current,
    }, 'CAREER_ACTIVATED', 'Tử Linh Triệu Hoán Sư is active; Tử Khí Châm was learned once and Mana was unchanged.');
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
    const result = startSearchJob(state, world, jobId, command.payload.actorId, command.payload.center, command.payload.radiusMm, command.payload);
    if (!result.job) return reject(state, command.commandId, result.code ?? 'SEARCH_UNAVAILABLE', 'The selected actors cannot search this area.', requestSha256);
    const next = structuredClone(state);
    next.spatial.searchJobs = [...next.spatial.searchJobs, result.job];
    next.jobs = [...next.jobs, { id: jobId, kind: 'spatial_search', status: 'active', actorIds: [...result.job.actorIds], reservedItemIds: [], startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null }];
    next.exploration.searchHistory = [...next.exploration.searchHistory, { searchId: jobId, startedAtElapsedMs: state.simElapsedMs, status: 'active' }];
    return acceptMutationMany(state, command, requestSha256, next, [{
      type: 'spatial_search_started', occurredAtElapsedMs: state.simElapsedMs,
      payload: { jobId, mode: result.job.mode, actorIds: result.job.actorIds, center: result.job.center, envelopeRadiusMm: result.job.envelopeRadiusMm,
        laneWidthMm: result.job.laneWidthMm, sweepDistanceMm: result.job.path.reduce((sum, point, index, path) => index === 0 ? sum : sum + Math.hypot(point.xMm - path[index - 1]!.xMm, point.yMm - path[index - 1]!.yMm), 0),
        speedMmPerHour: result.job.speedMmPerHour, returnDistanceMm: Math.hypot(result.job.path.at(-1)!.xMm - result.job.path[0]!.xMm, result.job.path.at(-1)!.yMm - result.job.path[0]!.yMm),
        targetCount: result.job.targetCount, stopAtElapsedMs: result.job.stopAtElapsedMs },
    }], result.job.mode === 'hunt' ? 'HUNT_STARTED' : 'SEARCH_STARTED', result.job.mode === 'hunt'
      ? 'The area hunt started; targets are detected from existing population records and the squad returns at its selected stop condition.'
      : 'The chest-field sweep started; the units return when the area or selected limit is complete.');
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
    next.jobs = [...next.jobs, { id: jobId, kind: 'resource_harvest', status: 'active', actorIds: [...result.job.actorIds], reservedItemIds: result.job.toolItemId === 'NONE' ? [] : [result.job.toolItemId], startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null }];
    return acceptMutationMany(state, command, requestSha256, next, [{
      type: 'harvest_job_started', occurredAtElapsedMs: state.simElapsedMs,
      payload: { jobId, resourceId: result.job.resourceId, materialId: result.job.materialId, quantity: result.job.requestedQuantity },
    }], 'HARVEST_STARTED', 'The harvest and return job was started.');
  }

  if (command.type === 'cancel_spatial_job') {
    const result = cancelSpatialJob(state, command.payload.jobId, state.simElapsedMs);
    if (!result.event) return reject(state, command.commandId, result.code ?? 'SPATIAL_JOB_NOT_ACTIVE', 'The spatial job is unavailable.', requestSha256);
    const isSearchRecall = result.event.type === 'spatial_search_recall_started';
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], isSearchRecall ? 'SPATIAL_JOB_RECALLING' : 'SPATIAL_JOB_CANCELLED', isSearchRecall ? 'The search stopped and the squad is returning to its starting point.' : 'The spatial job was cancelled.');
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

  if (command.type === 'butcher_corpse') {
    const corpse = state.corpses.find(item => item.id === command.payload.corpseId);
    const result = butcherCorpse(state, world, command.payload.actorId, command.payload.corpseId);
    if (result.code) return reject(state, command.commandId, result.code, result.requirements.join(' '), requestSha256);
    const event = { type: 'corpse_butchered', occurredAtElapsedMs: state.simElapsedMs, payload: {
      corpseId: command.payload.corpseId, recoveredItemIds: corpse?.bodyRecord?.equipmentInstanceIds ?? [], elapsedMs: 0,
    } };
    return acceptMutationMany(state, command, requestSha256, result.state, [event], 'CORPSE_BUTCHERED', 'The body was disposed of and its recorded gear recovered once.');
  }

  if (command.type === 'revive') {
    const unitId = `TU-PHUC-${canonicalStateHash({ saveId: state.saveId, corpseId: command.payload.corpseId }).slice(0, 20).toUpperCase()}`;
    const result = reviveDirect(state, world, command.payload.actorId, command.payload.corpseId, unitId);
    if (result.code) return reject(state, command.commandId, result.code, result.requirements.join(' '), requestSha256);
    const revived = result.state.ownedUnits.find(unit => unit.id === unitId)!;
    const event = { type: 'corpse_revived', occurredAtElapsedMs: state.simElapsedMs, payload: {
      corpseId: command.payload.corpseId, actorId: revived.id, creationRoute: revived.creationRoute,
      sourceTier: revived.sourceStats.formTier, sourceLevel: revived.level, manaSpent: 0, materialsSpent: [], elapsedMs: 0,
    } };
    return acceptMutationMany(state, command, requestSha256, result.state, [event], 'CORPSE_REVIVED', 'Tử Phục completed immediately at no Mana or material cost.');
  }

  if (command.type === 'equip') {
    const result = equipItem(state, world, command.payload.unitId, command.payload.itemId, command.payload.slotId);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'EQUIPMENT_SLOT_RULE_NOT_COMPILED', 'Equipment could not be attached to that unit.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'UNIT_EQUIPPED', 'The item was assigned to a compatible open slot.');
  }

  if (command.type === 'unequip_item') {
    const result = unequipItem(state, world, command.payload.unitId, command.payload.itemId);
    if (result.code || !result.event) return reject(state, command.commandId, result.code ?? 'ITEM_NOT_EQUIPPED', 'The item could not be removed from that unit.', requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, [result.event], 'UNIT_UNEQUIPPED', 'The item was removed and returned to Lí Lan’s carried gear.');
  }

  if (command.type === 'open_cache') {
    const result = openFieldChest(state, world, command.payload.actorId, command.payload.chestId);
    if (result.code) return reject(state, command.commandId, result.code, result.message, requestSha256);
    return acceptMutationMany(state, command, requestSha256, result.state, result.events, 'CHEST_OPENED', result.message);
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
    if (state.territory.survivalFire.fuelRemaining === null) return reject(state, command.commandId, 'FUEL_LEDGER_NOT_MATERIALIZED', 'The fire fuel ledger is unavailable in this save version.', requestSha256);
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
        fuelKnowledge: fire.fuelKnowledge,
        fuelBlocker: null,
        nextFuelConsumptionAtElapsedMs: fire.active ? (fire.nextFuelConsumptionAtElapsedMs ?? state.simElapsedMs + 15 * 60_000) : null,
      } },
    }, 'fire_refuelled', { itemId: stack.itemId, quantity: command.payload.quantity }, 'FIRE_REFUELLED', 'WOOD was transferred to the survival fire.');
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
