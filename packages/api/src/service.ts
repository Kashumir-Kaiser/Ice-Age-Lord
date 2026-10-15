import { randomBytes, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { ApiErrorCode, BackupEnvelope, CheckpointSummary, CreateSaveRequest, PlayerEvent, SaveSummary } from '../../contracts/src/api.ts';
import { parseCreateSaveRequest } from '../../contracts/src/api.ts';
import type { CommandEnvelope, CommandEvent, CommandReceipt, GameState, PlayerView, WorldDefinition } from '../../contracts/src/index.ts';
import { GAME_STATE_SCHEMA_VERSION, validateCommandEnvelope } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { eventRuntimeReadiness, mandatoryEventBlocker } from '../../content/src/eventReadiness.ts';
import { CONTENT_VERSION, RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';
import { createNewGame } from '../../sim/src/initializer.ts';
import { upgradeGameState } from '../../sim/src/upgrade.ts';
import { previewCommand, reduceCommand } from '../../sim/src/reducer.ts';
import { projectPlayerView } from '../../sim/src/view.ts';
import { verifyStage08State } from '../../sim/src/stage08.ts';
import { verifyBotPopulation } from '../../sim/src/bots/state.ts';
import { deterministicChestOutcome } from '../../sim/src/chestLoot.ts';
import { initialWildlifeState, isWildlifeRenewable, wildlifeSpeciesProfile, WILDLIFE_REPLENISHMENT_MS, WILDLIFE_RULE_VERSION } from '../../sim/src/wildlife.ts';
import { EVENT_MECHANICS_RULE_VERSION, eventMechanicsFor } from '../../content/src/eventRules.ts';
import { EVENT_REWARD_RULE_VERSION, EVENT_SHOP_INITIAL_STOCK, EVENT_SHOP_MARK_PRICE, EVENT_SHOP_RULE_VERSION } from '../../sim/src/eventRuntime.ts';
import { CHEST_LOOT_RULE_VERSION, lootTableForChest } from '../../content/src/chestLoot.ts';
import { advanceTo, coldLoadRateMicroPerMinute, DAY_MS, HOUR_MS, MINUTE_MS, nextMidnightAfter, TOMB_STANDARD_BLUEPRINT_ID, TOMB_STANDARD_DURATION_MS, TOMB_STANDARD_RECIPE_ID, type StopCondition } from '../../sim/src/time.ts';
import { RepositoryError, SqliteRepository } from '../../storage/src/repository.ts';
import { ApiProblem, fromRepositoryError } from './errors.ts';
import { bindCalendarReceipts } from './calendarReceipts.ts';

const ownerId = 'local-owner';
const MAX_BACKUP_ROWS = 10_000;
const MAX_BACKUP_CHECKPOINTS = 50;
const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const CLOCK_SIMULATION_SLICE_MS = 16;
// Bot-state catch-up and view projection can outlast a 5s lease on constrained CPUs.
// Keep one driver for 30s while 1s heartbeats continue; explicit leases in tests take precedence.
const DEFAULT_CLOCK_LEASE_MS = 30_000;
const DEFAULT_CLOCK_TICK_MS = 1_000;
const LEGACY_README_SHA256 = '6e30d099e63a8253134d9de87d495053744ad868cde4ff468ba4bdc31d53c26b';

type ClockDriver = {
  sessionToken: string;
  driverId: string;
  lastHeartbeatMonoMs: number;
  lastTickMonoMs: number;
  targetSimElapsedMs: number;
  lastProgressSimElapsedMs: number;
  fractionalSimMs: number;
  timer: ReturnType<typeof setInterval> | null;
  isTicking: boolean;
  pendingState?: GameState;
  pendingEvents?: Omit<CommandEvent, 'sequence'>[];
  pendingBaseRevision?: number;
  pendingBaseSimElapsedMs?: number;
};

export type ClockRuntimeOptions = {
  monotonicNow?: () => number;
  leaseMs?: number;
  tickIntervalMs?: number;
  timersEnabled?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 160): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isSafeInt(value: unknown, min = 0): value is number {
  return Number.isSafeInteger(value) && Number(value) >= min;
}

function checkIsoUtc(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function apiProblem(code: ApiErrorCode, status: number, message: string, displayText: string, currentRevision?: number): ApiProblem {
  return new ApiProblem(status, code, message, displayText, currentRevision);
}

function isRuleNotReadyCommandReceipt(code: string): boolean {
  return /_STAGE_0[4-8]$/.test(code)
    || code.includes('NOT_IMPLEMENTED')
    || code.includes('NOT_COMPILED')
    // Exact opening fuel is unknown by design until the source record is supplied.
    || code === 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED';
}

function nextDailyBoundary(elapsed: number, offset = 0): number {
  return offset + (Math.floor((elapsed - offset) / DAY_MS) + 1) * DAY_MS;
}

function systemOnlyRevisionAdvance(state: GameState, expectedRevision: number): boolean {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision >= state.revision) return false;
  const intervening = state.receipts.filter(item => item.receipt.revision > expectedRevision);
  return intervening.length > 0 && intervening.every(item => item.receipt.accepted
    && item.receipt.code === 'SYSTEM_TRANSITION_COMMITTED');
}

function validateStage05State(candidate: GameState, world: WorldDefinition, baseline: GameState): void {
  const invalid = (message: string): never => { throw new ApiProblem(400, 'BACKUP_INVALID', message, 'Bản sao lưu Stage 05 không hợp lệ.'); };
  const validPosition = (position: unknown): position is { xMm: number; yMm: number; sourceZMetres?: number } => isRecord(position)
    && Number.isSafeInteger(position.xMm) && Number.isSafeInteger(position.yMm)
    && (position.sourceZMetres === undefined || (typeof position.sourceZMetres === 'number' && Number.isFinite(position.sourceZMetres)));
  const samePoint = (a: { xMm: number; yMm: number }, b: { xMm: number; yMm: number }) => a.xMm === b.xMm && a.yMm === b.yMm;
  const knownSites = new Set(world.sites.map(site => site.id));
  const knownResources = new Set(world.resources.map(resource => resource.id));
  const knownRoutes = new Set(world.navigationOverlay.routeEdges.map(route => route.id));
  const knownChests = new Set(world.fieldChests.map(chest => chest.id));

  if (!validPosition(candidate.player.position) || Math.hypot(candidate.player.position.xMm, candidate.player.position.yMm) > world.activeMapRadiusKm * 1_000_000
    || !Array.isArray(candidate.travel.orders) || !Array.isArray(candidate.spatial.movementOrders)
    || !Array.isArray(candidate.spatial.searchJobs) || !Array.isArray(candidate.spatial.harvestJobs)
    || !Array.isArray(candidate.spatial.resourceBalances) || !Array.isArray(candidate.spatial.signals)
    || !Array.isArray(candidate.spatial.sweepHistory) || !Array.isArray(candidate.exploration.exploredGeometry)
    || !Array.isArray(candidate.exploration.searchHistory) || !Array.isArray(candidate.fieldChestStates)) invalid('Spatial state arrays or player coordinates are malformed.');

  const travelIds = new Set<string>();
  for (const order of candidate.travel.orders) {
    if (!isRecord(order) || !isNonEmptyString(order.id) || travelIds.has(order.id) || !Array.isArray(order.actorIds)
      || !Array.isArray(order.pathSegments) || !validPosition(order.originSnapshot) || !validPosition(order.destinationIntent?.coordinate)
      || !isSafeInt(order.totalDistanceMm) || !isSafeInt(order.elapsedTravelMs) || order.elapsedTravelMs > order.pathSegments.reduce((sum, segment) => sum + (isRecord(segment) && isSafeInt(segment.durationMs) ? segment.durationMs : 0), 0)
      || !['active', 'completed', 'cancelled', 'blocked'].includes(order.status)) invalid('Movement order state is malformed.');
    travelIds.add(order.id);
    if (order.actorIds.some((id: unknown) => id !== candidate.player.id && !candidate.ownedUnits.some(unit => unit.id === id))) invalid('Movement orders contain an actor outside the save roster.');
    if (order.pathSegments.some(segment => !isRecord(segment) || !validPosition(segment.from) || !validPosition(segment.to)
      || !isSafeInt(segment.distanceMm) || !isSafeInt(segment.durationMs, 1) || !isSafeInt(segment.progressMs) || segment.progressMs > segment.durationMs)) invalid('A movement path segment is malformed.');
  }
  if (canonicalStateHash(candidate.spatial.movementOrders) !== canonicalStateHash(candidate.travel.orders)) invalid('Movement order projections disagree.');
  if (candidate.player.location.kind === 'travel') {
    const order = candidate.travel.orders.find(item => item.id === candidate.player.location.orderId && item.status === 'active' && item.actorIds.includes(candidate.player.id));
    if (!order) invalid('Player travel location has no active order.');
  } else if (candidate.player.location.kind === 'field') {
    if (!validPosition(candidate.player.location.coordinate) || !samePoint(candidate.player.location.coordinate, candidate.player.position)) invalid('Player field location does not match its position.');
  } else if (candidate.player.location.kind === 'site') {
    const site = world.sites.find(item => item.id === candidate.player.location.siteId);
    if (!site || Math.hypot(site.position.xMm - candidate.player.position.xMm, site.position.yMm - candidate.player.position.yMm) > 1_000) invalid('Player site location does not match its position.');
  } else invalid('Player location kind is invalid.');

  const balances = new Map(candidate.spatial.resourceBalances.map(balance => [balance.resourceId, balance]));
  if (balances.size !== world.resources.length || world.resources.some(resource => !balances.has(resource.id))) invalid('Resource balance identities do not match the compiled world.');
  for (const resource of world.resources) {
    const balance = balances.get(resource.id)!;
    if (!isSafeInt(balance.remaining) || balance.remaining > resource.capacity || !isSafeInt(balance.reserved)
      || balance.reserved > balance.remaining || balance.materialId !== resource.materialId || balance.unit !== resource.unit
      || !['unknown', 'estimate', 'known_exact', 'stale'].includes(balance.amountKnowledge)
      || (balance.dailyRemaining !== null && (!isSafeInt(balance.dailyRemaining) || balance.dailyRemaining > (resource.dailyQuota ?? 0)))) invalid('A resource balance is outside its source limits.');
    const harvests = candidate.spatial.harvestJobs.filter(job => job.resourceId === resource.id);
    const extracted = harvests.reduce((sum, job) => sum + job.extractedQuantity, 0);
    if (resource.renewal === 'none' && balance.remaining + extracted !== resource.capacity) invalid('Finite resource extraction does not conserve the source balance.');
    const reserved = harvests.filter(job => job.status === 'active').reduce((sum, job) => sum + job.reservedQuantity, 0);
    if (balance.reserved !== reserved) invalid('Resource reservations do not match active harvest jobs.');
  }

  const spatialJobIds = new Set<string>();
  for (const job of candidate.spatial.searchJobs) {
    if (!isRecord(job) || !isNonEmptyString(job.id) || spatialJobIds.has(job.id) || !Array.isArray(job.actorIds)
      || !Array.isArray(job.path) || job.path.length < 2 || job.path.some(point => !validPosition(point))
      || !['chest', 'hunt'].includes(String(job.mode)) || !Array.isArray(job.foundTargetIds)
      || job.foundTargetIds.some((id: unknown) => typeof id !== 'string' || id.trim() === '')
      || new Set(job.foundTargetIds).size !== job.foundTargetIds.length
      || (job.returnPath !== undefined && (!Array.isArray(job.returnPath) || job.returnPath.length < 2 || job.returnPath.some(point => !validPosition(point))))
      || (job.phase !== undefined && !['sweeping', 'returning'].includes(job.phase))
      || (job.phase === 'returning' && (!Array.isArray(job.returnPath) || job.returnPath.length < 2))
      || (job.speedMmPerHour !== undefined && !isSafeInt(job.speedMmPerHour, 1))
      || (job.stopAtElapsedMs !== undefined && job.stopAtElapsedMs !== null && !isSafeInt(job.stopAtElapsedMs, 1))
      || (job.targetCount !== undefined && job.targetCount !== null && (!isSafeInt(job.targetCount, 1) || job.targetCount > 192))
      || (job.foundChestIds !== undefined && (!Array.isArray(job.foundChestIds) || job.foundChestIds.some(id => !knownChests.has(id)) || new Set(job.foundChestIds).size !== job.foundChestIds.length))
      || (job.returnReason !== undefined && !['area_complete', 'target_count', 'time_limit', 'recalled'].includes(job.returnReason))
      || !isSafeInt(job.envelopeRadiusMm, 1) || job.envelopeRadiusMm > 2_000_000 || !isSafeInt(job.laneWidthMm, 1)
      || !isSafeInt(job.pathProgressMm) || !isSafeInt(job.startedAtElapsedMs) || job.startedAtElapsedMs > candidate.simElapsedMs
      || !['active', 'paused', 'blocked', 'completed', 'cancelled'].includes(job.status)) invalid('Search job state is malformed.');
    if (job.actorIds.length < 1 || new Set(job.actorIds).size !== job.actorIds.length) invalid('Search job actors must be unique.');
    spatialJobIds.add(job.id);
    if (job.actorIds.some((id: unknown) => id !== candidate.player.id && !candidate.ownedUnits.some(unit => unit.id === id))) invalid('Search jobs contain an actor outside the save roster.');
  }
  for (const job of candidate.spatial.harvestJobs) {
    if (!isRecord(job) || !isNonEmptyString(job.id) || spatialJobIds.has(job.id) || !knownResources.has(job.resourceId)
      || !Array.isArray(job.actorIds) || !Array.isArray(job.routeOut) || !Array.isArray(job.routeReturn)
      || job.routeOut.some(point => !validPosition(point)) || job.routeReturn.some(point => !validPosition(point))
      || !isSafeInt(job.requestedQuantity, 1) || !isSafeInt(job.extractedQuantity) || job.extractedQuantity > job.requestedQuantity
      || !isSafeInt(job.reservedQuantity) || job.reservedQuantity > job.requestedQuantity - job.extractedQuantity
      || !isSafeInt(job.startedAtElapsedMs) || job.startedAtElapsedMs > candidate.simElapsedMs
      || !['outbound', 'working', 'returning', 'blocked'].includes(job.stage)
      || !['active', 'paused', 'blocked', 'completed', 'cancelled'].includes(job.status)) invalid('Harvest job state is malformed.');
    spatialJobIds.add(job.id);
    if (job.actorIds.some((id: unknown) => id !== candidate.player.id && !candidate.ownedUnits.some(unit => unit.id === id))) invalid('Harvest jobs contain an actor outside the save roster.');
  }
  for (const order of candidate.travel.orders) spatialJobIds.add(order.id);
  const runtimeJobIds = new Set(candidate.jobs.map(job => job.id));
  if ([...spatialJobIds].some(id => !runtimeJobIds.has(id))
    || candidate.jobs.some(job => !spatialJobIds.has(job.id) && !candidate.territory.tomb.queue.some(entry => entry.id === job.id))) invalid('Spatial runtime jobs do not match the job ledger.');

  const signalIds = new Set<string>();
  const signalTargets = new Set<string>();
  const chestCenterIds = new Set(world.chestCacheCenters.map(cache => cache.id));
  for (const signal of candidate.spatial.signals) {
    if (!isRecord(signal) || !isNonEmptyString(signal.signalId) || signalIds.has(signal.signalId)
      || !['site', 'resource', 'cache'].includes(signal.targetType) || !validPosition(signal.exactPosition)
      || !validPosition(signal.approximatePosition) || !isSafeInt(signal.accuracyMm, 1)
      || !['signal', 'identified'].includes(signal.discovery)) invalid('Spatial signal state is malformed.');
    const targetKey = `${signal.targetType}:${signal.targetId}`;
    if (signalTargets.has(targetKey)) invalid('Spatial signal targets are duplicated.');
    signalIds.add(signal.signalId);
    signalTargets.add(targetKey);
    if (signal.targetType === 'cache' && !knownChests.has(signal.targetId) && !chestCenterIds.has(signal.targetId)) invalid('A cache signal does not refer to a compiled target.');
  }
  if (candidate.playerKnowledge.knownSignalIds.some(id => !signalIds.has(id)) || signalIds.size !== candidate.playerKnowledge.knownSignalIds.length) invalid('Known signal references do not match the spatial ledger.');
  if (candidate.playerKnowledge.knownSiteIds.some(id => !knownSites.has(id))
    || candidate.playerKnowledge.knownResourceIds.some(id => !knownResources.has(id))
    || candidate.playerKnowledge.knownRouteIds.some(id => !knownRoutes.has(id))) invalid('Known map identities are not present in the compiled world.');
  // Shared world chests can be carried by a bot without becoming player-known.
  // Cross-check private custody against the persisted bot ownership ledger;
  // accepting arbitrary carried chests would weaken backup conservation.
  const botChestOwners = new Map<string, {botId:string; chest:NonNullable<GameState['botPopulation']>['chunks'][number]['cold'][number]['ownedChests'][number]}>();
  for (const chunk of candidate.botPopulation?.chunks ?? []) for (const bot of chunk.cold) for (const chest of bot.ownedChests) {
    if (!chest.fieldChestId) continue;
    if (botChestOwners.has(chest.fieldChestId)) invalid('A world chest has multiple bot owners.');
    botChestOwners.set(chest.fieldChestId, {botId:bot.botId,chest});
  }
  const chestStates = new Map(candidate.fieldChestStates.map(chest => [chest.chestId, chest]));
  if (candidate.fieldChestStates.length !== world.fieldChests.length || chestStates.size !== world.fieldChests.length
    || candidate.fieldChestStates.some(chest => {
      const source = world.fieldChests.find(item => item.id === chest.chestId);
      if (!source || !knownChests.has(chest.chestId) || !['hidden', 'signal', 'identified'].includes(chest.discovery)) return true;
      if (chest.discovery === 'hidden' && (chest.discoveredAtElapsedMs !== null || chest.signalId !== null)) return true;
      if (chest.discovery !== 'hidden' && (!isSafeInt(chest.discoveredAtElapsedMs) || chest.discoveredAtElapsedMs > candidate.simElapsedMs)) return true;
      const botOwner = botChestOwners.get(chest.chestId);
      if (chest.state === 'unopened') {
        if (chest.openedAtElapsedMs !== null || chest.lootOutcome != null) return true;
        if (chest.custody === 'world') return chest.claimedById !== null || chest.carrierId !== null || botOwner !== undefined;
        return chest.custody !== 'carried' || !botOwner || botOwner.chest.status !== 'owned'
          || botOwner.botId !== chest.claimedById || botOwner.botId !== chest.carrierId
          || botOwner.chest.acquiredAtElapsedMs > candidate.simElapsedMs;
      }
      if (chest.state !== 'opened' || chest.custody !== 'opened' || !isSafeInt(chest.openedAtElapsedMs)
        || chest.openedAtElapsedMs > candidate.simElapsedMs || !isNonEmptyString(chest.claimedById)
        || !isRecord(chest.lootOutcome) || chest.lootOutcome.ruleVersion !== CHEST_LOOT_RULE_VERSION
        || !Array.isArray(chest.lootOutcome.rewardStacks)) return true;
      const outcome = deterministicChestOutcome(candidate.seed, source);
      if (botOwner && (botOwner.botId !== chest.claimedById || chest.carrierId !== null
        || botOwner.chest.status !== 'opened' || botOwner.chest.openedAtElapsedMs !== chest.openedAtElapsedMs
        || canonicalStateHash(botOwner.chest.lootOutcome) !== canonicalStateHash(outcome.rewardStacks.map(stack => ({itemTemplateId:stack.templateId,quantity:stack.quantity}))))) return true;
      return canonicalStateHash(chest.lootOutcome) !== canonicalStateHash(outcome)
        || !outcome.rewardStacks.every(stack => stack.quantity > 0 && stack.itemId.startsWith(`CHEST-ITEM-${source.id}-`));
    })) invalid('Field chest discovery, one-time opening, or committed loot outcome is invalid.');
  if (candidate.playerKnowledge.knownChestIds.some(id => !candidate.fieldChestStates.some(chest => chest.chestId === id && chest.discovery === 'identified'))
    || candidate.fieldChestStates.some(chest => chest.discovery === 'identified' && !candidate.playerKnowledge.knownChestIds.includes(chest.chestId))) invalid('Known chest identities disagree with chest discovery state.');
  if (canonicalStateHash(candidate.territory.position) !== canonicalStateHash(baseline.territory.position)) invalid('The H0 anchor was changed.');

  const itemIds = new Set<string>();
  const templateTotals = new Map<string, number>();
  const initialTotals = new Map<string, number>();
  for (const container of baseline.inventory.containers) for (const stack of container.stacks) initialTotals.set(stack.templateId, (initialTotals.get(stack.templateId) ?? 0) + stack.quantity);
  const chestLootTemplates = world.fieldChests.flatMap(chest => lootTableForChest(chest).entries.map(entry => entry.templateId));
  const eventShopTemplates = world.eventSchedule.slice(2).map(event => `EVENT-MARK-${event.id}`);
  const allowedTemplates = new Set([...initialTotals.keys(), ...world.resources.map(resource => resource.materialId), ...chestLootTemplates, ...eventShopTemplates]);
  for (const container of candidate.inventory.containers) {
    const original = baseline.inventory.containers.find(item => item.id === container.id);
    if (!original || container.kind !== original.kind || canonicalStateHash(container.location) !== canonicalStateHash(original.location)
      || container.capacitySlots !== original.capacitySlots || container.stacks.length > (container.capacitySlots ?? Number.MAX_SAFE_INTEGER)) invalid('An inventory container changed its identity or capacity.');
    for (const stack of container.stacks) {
      if (!isNonEmptyString(stack.itemId) || itemIds.has(stack.itemId) || !allowedTemplates.has(stack.templateId)
        || !isSafeInt(stack.quantity) || stack.equipped !== false) invalid('An inventory item is duplicated or outside the compiled material set.');
      const templateEvent = world.eventSchedule.find(event => stack.templateId === `EVENT-MARK-${event.id}`
        || stack.templateId === `EVENT-RELIC-${event.id}`);
      if (templateEvent && (stack.exclusiveEventId !== templateEvent.id || stack.expiresAtElapsedMs !== templateEvent.resolvesAtMs)) {
        invalid('Event rewards must retain their event scope and expiry in every container.');
      }
      if (stack.exclusiveEventId !== undefined && stack.exclusiveEventId !== null) {
        const event = world.eventSchedule.find(row => row.id === stack.exclusiveEventId);
        if (!event || ![`EVENT-MARK-${event.id}`, `EVENT-RELIC-${event.id}`].includes(stack.templateId)
          || stack.expiresAtElapsedMs !== event.resolvesAtMs || candidate.simElapsedMs >= event.resolvesAtMs) {
          invalid('An event-exclusive item has invalid ownership or expiry.');
        }
      } else if (stack.expiresAtElapsedMs !== undefined && stack.expiresAtElapsedMs !== null) {
        invalid('An item expiry requires a compiled exclusive event.');
      }
      itemIds.add(stack.itemId);
      templateTotals.set(stack.templateId, (templateTotals.get(stack.templateId) ?? 0) + stack.quantity);
    }
  }
  const extractedByMaterial = new Map<string, number>();
  for (const job of candidate.spatial.harvestJobs) extractedByMaterial.set(job.materialId, (extractedByMaterial.get(job.materialId) ?? 0) + job.extractedQuantity);
  const lootedByTemplate = new Map<string, number>();
  for (const chest of candidate.fieldChestStates) for (const stack of botChestOwners.has(chest.chestId) ? [] : chest.lootOutcome?.rewardStacks ?? []) {
    lootedByTemplate.set(stack.templateId, (lootedByTemplate.get(stack.templateId) ?? 0) + stack.quantity);
  }
  const marketPurchased = new Map<string, number>();
  const marketConsumed = new Map<string, number>();
  for (const offer of candidate.stage08.marketOffers) {
    marketPurchased.set(offer.itemTemplateId, (marketPurchased.get(offer.itemTemplateId) ?? 0) + offer.purchasedQuantity * offer.quantityPerPurchase);
    marketConsumed.set(offer.itemTemplateId, (marketConsumed.get(offer.itemTemplateId) ?? 0) + offer.consumedQuantity);
  }
  const eventShopPurchased = new Map<string, number>();
  const eventItemsExpired = new Map<string, number>();
  for (const progress of candidate.eventProgress) {
    eventShopPurchased.set(`EVENT-MARK-${progress.eventId}`, progress.shopPurchasedQuantity);
    for (const [templateId, quantity] of Object.entries(progress.expiredItemQuantities ?? {})) {
      eventItemsExpired.set(templateId, (eventItemsExpired.get(templateId) ?? 0) + quantity);
    }
  }
  for (const template of allowedTemplates) {
    const expected = (initialTotals.get(template) ?? 0) + (extractedByMaterial.get(template) ?? 0) + (lootedByTemplate.get(template) ?? 0)
      + (marketPurchased.get(template) ?? 0) + (eventShopPurchased.get(template) ?? 0)
      - (marketConsumed.get(template) ?? 0) - (eventItemsExpired.get(template) ?? 0);
    if ((templateTotals.get(template) ?? 0) !== expected) invalid('Inventory totals do not conserve starter and harvested materials.');
  }
}

function validateStage10State(candidate: GameState, world: WorldDefinition): void {
  const invalid = (): never => { throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup has invalid event or wildlife runtime state.', 'Trạng thái sự kiện hoặc động vật hoang dã trong bản sao lưu không hợp lệ.'); };
  const originalWildlife = initialWildlifeState(world, 0);
  if (!isRecord(candidate.wildlife) || candidate.wildlife.ruleVersion !== WILDLIFE_RULE_VERSION
    || !Array.isArray(candidate.wildlife.groups) || candidate.wildlife.groups.length !== originalWildlife.groups.length
    || !isSafeInt(candidate.wildlife.nextReplenishmentAtElapsedMs, candidate.simElapsedMs + 1)
    || candidate.wildlife.nextReplenishmentAtElapsedMs - candidate.simElapsedMs > 24 * HOUR_MS
    || !Array.isArray(candidate.playerKnowledge.knownWildlifeGroupIds)) invalid();
  const groups = new Map(candidate.wildlife.groups.map(group => [group.id, group]));
  if (groups.size !== originalWildlife.groups.length) invalid();
  for (const original of originalWildlife.groups) {
    const group = groups.get(original.id);
    if (!group || group.ecologyId !== original.ecologyId || group.populationKey !== original.populationKey
      || group.speciesId !== original.speciesId || group.displayName !== original.displayName || group.capacity !== original.capacity
      || canonicalStateHash(group.position) !== canonicalStateHash(original.position)
      || !isSafeInt(group.remaining) || group.remaining > group.capacity || !isSafeInt(group.nextMemberOrdinal, 1)
      || group.nextMemberOrdinal > group.capacity + Math.floor(candidate.simElapsedMs / WILDLIFE_REPLENISHMENT_MS) + 1 || !['hidden', 'known'].includes(group.discovery)
      || (group.discovery === 'hidden' && (group.discoveredAtElapsedMs !== null || group.lastSightingAtElapsedMs !== null))
      || (group.discovery === 'known' && (!isSafeInt(group.discoveredAtElapsedMs) || group.discoveredAtElapsedMs > candidate.simElapsedMs
        || !isSafeInt(group.lastSightingAtElapsedMs) || group.lastSightingAtElapsedMs > candidate.simElapsedMs))) invalid();
  }
  const knownWildlife = new Set(candidate.playerKnowledge.knownWildlifeGroupIds);
  if (knownWildlife.size !== candidate.playerKnowledge.knownWildlifeGroupIds.length
    || [...knownWildlife].some(id => groups.get(id)?.discovery !== 'known')
    || candidate.wildlife.groups.some(group => (group.discovery === 'known') !== knownWildlife.has(group.id))) invalid();

  const expectedEventIds = world.eventSchedule.slice(2).map(event => event.id);
  if (!Array.isArray(candidate.eventProgress) || candidate.eventProgress.length !== expectedEventIds.length
    || new Set(candidate.eventProgress.map(progress => progress.eventId)).size !== expectedEventIds.length) invalid();
  for (const progress of candidate.eventProgress) {
    const calendar = candidate.calendar.find(event => event.id === progress.eventId);
    const rule = progress.ruleVersion === EVENT_MECHANICS_RULE_VERSION ? eventMechanicsFor(progress.eventId) : null;
    const expectedReward = Math.min(100, 10 + Math.floor(progress.score / 5));
    if (!rule || !expectedEventIds.includes(progress.eventId) || !calendar || !isSafeInt(progress.objectiveProgress)
      || !isSafeInt(progress.score) || progress.score !== progress.objectiveProgress || progress.score > rule.target
      || typeof progress.participated !== 'boolean' || progress.participated !== (progress.score > 0)
      || !['unsettled', 'success', 'failed', 'nonparticipant', 'claimed', 'expired'].includes(progress.outcome)
      || !(progress.choiceId === null || progress.choiceId === 'ice' || progress.choiceId === 'snow')
      || (progress.eventId === 'EV19-ICE-SNOW-CHOICE' && progress.participated !== Boolean(progress.choiceId))
      || (progress.eventId !== 'EV19-ICE-SNOW-CHOICE' && progress.choiceId !== null)
      || !isSafeInt(progress.scoreSpent) || progress.scoreSpent > progress.score
      || progress.shopRuleVersion !== EVENT_SHOP_RULE_VERSION
      || !['scheduled', 'active', 'closed', 'expired'].includes(progress.shopStatus)
      || progress.shopInitialStock !== EVENT_SHOP_INITIAL_STOCK || !isSafeInt(progress.shopStockRemaining)
      || !isSafeInt(progress.shopPurchasedQuantity) || progress.shopStockRemaining + progress.shopPurchasedQuantity !== progress.shopInitialStock
      || progress.scoreSpent !== progress.shopPurchasedQuantity * EVENT_SHOP_MARK_PRICE
      || progress.shopExpiresAtElapsedMs !== calendar.resolvesAtMs
      || !isRecord(progress.expiredItemQuantities)
      || Object.entries(progress.expiredItemQuantities).some(([templateId, quantity]) => ![`EVENT-MARK-${progress.eventId}`, `EVENT-RELIC-${progress.eventId}`].includes(templateId)
        || !isSafeInt(quantity))
      || !isSafeInt(progress.rewardKrona) || progress.rewardKrona > 100
      || !(progress.claimExpiresAtElapsedMs === null || isSafeInt(progress.claimExpiresAtElapsedMs, 1))
      || !(progress.claimReceiptId === null || isNonEmptyString(progress.claimReceiptId))) invalid();
    const expectedShopStatus = calendar.status === 'resolved' ? 'expired'
      : calendar.status === 'locked' ? 'closed'
        : calendar.status === 'active' ? 'active' : 'scheduled';
    if (progress.shopStatus !== expectedShopStatus) invalid();
    const eventLootQuantity = candidate.fieldChestStates.reduce((total, chestState) => {
      const sourceChest = world.fieldChests.find(chest => chest.id === chestState.chestId);
      if (sourceChest?.chestType !== 'event' || sourceChest.eventId !== progress.eventId) return total;
      return total + (chestState.lootOutcome?.rewardStacks ?? []).reduce((sum, stack) => {
        return sum + (stack.templateId === `EVENT-MARK-${progress.eventId}` || stack.templateId === `EVENT-RELIC-${progress.eventId}` ? stack.quantity : 0);
      }, 0);
    }, 0);
    const boughtMarks = progress.shopPurchasedQuantity;
    const eventItemsExpired = Object.values(progress.expiredItemQuantities).reduce((sum, quantity) => sum + quantity, 0);
    if ((calendar.status !== 'resolved' && eventItemsExpired !== 0) || eventItemsExpired > eventLootQuantity + boughtMarks) invalid();
    if (progress.outcome === 'unsettled') {
      if (calendar.status === 'resolved' || progress.rewardKrona !== 0 || progress.claimExpiresAtElapsedMs !== null || progress.claimReceiptId !== null) invalid();
    } else if (calendar.status !== 'resolved') invalid();
    if (progress.outcome === 'success') {
      if (!progress.participated || progress.objectiveProgress < rule.target
        || progress.rewardKrona !== expectedReward || !isSafeInt(progress.claimExpiresAtElapsedMs, 1)
        || progress.claimExpiresAtElapsedMs <= calendar.resolvesAtMs || progress.claimReceiptId !== null) invalid();
    } else if (progress.outcome === 'claimed') {
      if (!progress.participated || progress.objectiveProgress < rule.target
        || progress.rewardKrona !== expectedReward || !isSafeInt(progress.claimExpiresAtElapsedMs, 1)
        || progress.claimExpiresAtElapsedMs <= calendar.resolvesAtMs || !isNonEmptyString(progress.claimReceiptId)) invalid();
    } else if (progress.outcome === 'expired') {
      if (!progress.participated || progress.objectiveProgress < rule.target || progress.rewardKrona !== expectedReward
        || !isSafeInt(progress.claimExpiresAtElapsedMs, 1) || progress.claimExpiresAtElapsedMs > candidate.simElapsedMs
        || progress.claimReceiptId !== null) invalid();
    } else if (progress.rewardKrona !== 0 || progress.claimReceiptId !== null
      || (progress.outcome === 'failed' && (!progress.participated || progress.objectiveProgress >= rule.target))
      || (progress.outcome === 'nonparticipant' && (progress.participated || progress.objectiveProgress !== 0))) invalid();
  }
}

function validateBackupState(value: unknown, world: WorldDefinition): GameState {
  if (!isRecord(value) || !Array.isArray(value.receipts) || value.receipts.length !== 0
    || !isNonEmptyString(value.saveId) || !isNonEmptyString(value.campaignId) || !isNonEmptyString(value.seed)
    || value.player === null || typeof value.player !== 'object' || !isRecord(value.player)
    || !isRecord(value.playerKnowledge) || !Array.isArray(value.playerKnowledge.lastInspectedEntityIds)
    || !value.playerKnowledge.lastInspectedEntityIds.every(id => isNonEmptyString(id))
    || !isRecord(value.inventory) || !Array.isArray(value.inventory.containers)
    || !Array.isArray(value.ownedUnits) || !Array.isArray(value.corpses) || !isRecord(value.rngStreams)
    || !isRecord(value.bagSeed)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup save state is malformed.', 'Bản sao lưu không hợp lệ.');
  }
  let candidate: GameState;
  try { candidate = upgradeGameState(value, world); }
  catch { throw new ApiProblem(400, 'CONTENT_MISMATCH', 'The backup save schema cannot be migrated safely.', 'Phiên bản schema của bản sao lưu không thể nâng cấp an toàn.'); }
  const acceptedSourceHashes = [
    canonicalStateHash(world.lockedSourceHashes),
    canonicalStateHash({ ...world.lockedSourceHashes, 'README.md': LEGACY_README_SHA256 }),
  ];
  if (candidate.schemaVersion !== GAME_STATE_SCHEMA_VERSION || candidate.worldPackageId !== world.id
    || candidate.contentVersion !== world.contentVersion || candidate.rulesetVersion !== RULESET_VERSION
    || !acceptedSourceHashes.includes(candidate.contentSourceSetSha256)
    || !isSafeInt(candidate.revision) || !isSafeInt(candidate.lastEventSequence)
    || candidate.revision > candidate.lastEventSequence || !isSafeInt(candidate.simElapsedMs)) {
    throw new ApiProblem(400, 'CONTENT_MISMATCH', 'The backup schema or pinned content version is incompatible.', 'Phiên bản nội dung của bản sao lưu không tương thích.');
  }
  const knownInspection = (key: string): boolean => {
    const [type, id] = key.split(':', 2);
    if (!id) return false;
    if (type === 'site') return Array.isArray(candidate.playerKnowledge.knownSiteIds) && candidate.playerKnowledge.knownSiteIds.includes(id);
    if (type === 'resource') return Array.isArray(candidate.playerKnowledge.knownResourceIds) && candidate.playerKnowledge.knownResourceIds.includes(id);
    if (type === 'cache') return (Array.isArray(candidate.playerKnowledge.knownSignalIds) && candidate.playerKnowledge.knownSignalIds.includes(id))
      || (Array.isArray(candidate.playerKnowledge.knownChestIds) && candidate.playerKnowledge.knownChestIds.includes(id));
    if (type === 'route') return Array.isArray(candidate.playerKnowledge.knownRouteIds) && candidate.playerKnowledge.knownRouteIds.includes(id);
    if (type === 'unit') return Array.isArray(candidate.ownedUnits) && candidate.ownedUnits.some(unit => unit.id === id);
    if (type === 'bot') return Array.isArray(candidate.playerKnowledge.knownBotIds) && candidate.playerKnowledge.knownBotIds.includes(id);
    if (type === 'corpse') return (candidate.playerKnowledge.knownCorpseIds ?? []).includes(id);
    if (type === 'wildlife') return (candidate.playerKnowledge.knownWildlifeGroupIds ?? []).includes(id);
    if (type === 'item') return candidate.inventory.containers.some(container => isRecord(container) && container.observed === true
      && Array.isArray(container.stacks) && container.stacks.some(stack => isRecord(stack) && stack.itemId === id));
    return false;
  };
  if (candidate.playerKnowledge.lastInspectedEntityIds.some(id => !knownInspection(id))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an inspection record for an unknown entity.', 'Bản sao lưu có thông tin kiểm tra không khớp với hiểu biết của người chơi.');
  }

  const baseline = createNewGame({
    saveId: candidate.saveId,
    campaignId: candidate.campaignId,
    soulId: candidate.player.id,
    worldPackageId: world.id,
    rulesetVersion: candidate.rulesetVersion,
    contentVersion: candidate.contentVersion,
    seed: candidate.seed,
  }, world);
  if (candidate.botPopulation !== null && candidate.botPopulation !== undefined
    && (!isRecord(candidate.botPopulation) || candidate.botPopulation.saveSeed !== candidate.seed)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The bot population seed does not match the save seed.', 'Dữ liệu bot không khớp với seed của bản lưu.');
  }
  if (candidate.botPopulation) {
    try { verifyBotPopulation(candidate.botPopulation); }
    catch { throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup bot population failed its manifest, scheduler, or row validation.', 'Dữ liệu bot trong bản sao lưu không hợp lệ.'); }
    if (candidate.botPopulation.chunks.some(chunk => chunk.lastIntegratedAtElapsedMs.some(at => at > candidate.simElapsedMs))) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains bot state from after its simulation time.', 'Dữ liệu bot trong bản sao lưu đi trước thời gian mô phỏng.');
    }
  }
  validateStage10State(candidate, world);
  const rawCombat: unknown = (value as Record<string, unknown>).combat;
  if (rawCombat !== undefined) {
    const badCombat = (): never => { throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains invalid encounter state.', 'Bản sao lưu có trạng thái giao chiến không hợp lệ.'); };
    if (!isRecord(rawCombat) || !isSafeInt(rawCombat.nextEncounterSequence) || !isRecord(rawCombat.target)
      || !Array.isArray(rawCombat.wildlifeTargets ?? []) || !Array.isArray(rawCombat.encounters)) badCombat();
    const rawTarget = rawCombat.target;
    const baseTarget = baseline.combat!.target;
    const targetStatus = rawTarget.status;
    const targetHealth = isRecord(rawTarget.bodyRecord) && isRecord(rawTarget.bodyRecord.health) ? rawTarget.bodyRecord.health : null;
    if (rawTarget.actorId !== baseTarget.actorId || rawTarget.sourceEcologyId !== baseTarget.sourceEcologyId
      || rawTarget.populationKey !== baseTarget.populationKey || rawTarget.sourcePopulationAtStart !== baseTarget.sourcePopulationAtStart
      || rawTarget.siteId !== baseTarget.siteId || !['available', 'reacting', 'retreated', 'dead'].includes(String(targetStatus))
      || !isRecord(rawTarget.position) || !targetHealth || !isSafeInt(targetHealth.current) || !isSafeInt(targetHealth.max)
      || targetHealth.max !== baseTarget.bodyRecord.health?.max || targetHealth.current > targetHealth.max
      || canonicalStateHash(rawTarget.combatProfile) !== canonicalStateHash(baseTarget.combatProfile)
      || canonicalStateHash((rawTarget.bodyRecord as Record<string, unknown>).rawAttributes) !== canonicalStateHash(baseTarget.bodyRecord.rawAttributes)
      || canonicalStateHash((rawTarget.bodyRecord as Record<string, unknown>).equipmentInstanceIds) !== canonicalStateHash([])
      || (targetStatus === 'dead' && targetHealth.current !== 0)
      || (targetStatus !== 'dead' && targetHealth.current <= 0)) badCombat();
    const basePosition = baseTarget.position;
    const movedMm = Math.hypot(Number(rawTarget.position.xMm) - basePosition.xMm, Number(rawTarget.position.yMm) - basePosition.yMm);
    if (!Number.isSafeInteger(rawTarget.position.xMm) || !Number.isSafeInteger(rawTarget.position.yMm)
      || (targetStatus === 'retreated' ? movedMm > 5_100 || movedMm < 4_900 : movedMm !== 0)) badCombat();
    const preyByActorId = new Map<string, { maxHealth: number; status: string; groupId: string | null }>([
      [baseTarget.actorId, { maxHealth: baseTarget.bodyRecord.health!.max, status: String(targetStatus), groupId: null }],
    ]);
    const wildlifeTargets = (rawCombat.wildlifeTargets ?? []) as unknown[];
    if (new Set(wildlifeTargets.filter(isRecord).map(target => target.actorId)).size !== wildlifeTargets.length) badCombat();
    for (const rawPrey of wildlifeTargets) {
      if (!isRecord(rawPrey) || !isNonEmptyString(rawPrey.wildlifeGroupId) || !isSafeInt(rawPrey.individualOrdinal, 1)) badCombat();
      const group = candidate.wildlife.groups.find(item => item.id === rawPrey.wildlifeGroupId && item.discovery === 'known');
      const originalGroup = baseline.wildlife.groups.find(item => item.id === rawPrey.wildlifeGroupId);
      const ordinal = rawPrey.individualOrdinal as number;
      if (!group || !originalGroup || ordinal >= group.nextMemberOrdinal || ordinal > group.capacity) badCombat();
      const expected = wildlifeSpeciesProfile(group.populationKey, group.displayName, group.ecologyId, group.position, group.id, ordinal);
      const body = rawPrey.bodyRecord;
      const health = isRecord(body) && isRecord(body.health) ? body.health : null;
      if (rawPrey.actorId !== expected.actorId || rawPrey.speciesId !== expected.speciesId
        || rawPrey.sourceEcologyId !== expected.sourceEcologyId || rawPrey.populationKey !== expected.populationKey
        || rawPrey.siteId !== expected.siteId || !['available', 'reacting', 'retreated', 'dead'].includes(String(rawPrey.status))
        || !isRecord(rawPrey.position) || !health || !isSafeInt(health.current) || !isSafeInt(health.max)
        || health.max !== expected.bodyRecord.health.current || health.current > health.max
        || canonicalStateHash(rawPrey.combatProfile) !== canonicalStateHash(expected.combatProfile)
        || canonicalStateHash({ ...body, health: { ...health, current: health.max } }) !== canonicalStateHash(expected.bodyRecord)
        || (rawPrey.status === 'dead' && health.current !== 0) || (rawPrey.status !== 'dead' && health.current <= 0)) badCombat();
      const preyPosition = rawPrey.position as { xMm: number; yMm: number };
      const retreatOffset = Math.hypot(preyPosition.xMm - group.position.xMm, preyPosition.yMm - group.position.yMm);
      const maximumRetreat = 5_000 * (rawCombat.encounters.length + 1);
      if (!Number.isSafeInteger(preyPosition.xMm) || !Number.isSafeInteger(preyPosition.yMm)
        || retreatOffset > maximumRetreat || (rawPrey.status === 'available' && retreatOffset !== 0)) badCombat();
      preyByActorId.set(expected.actorId, { maxHealth: expected.bodyRecord.health.current, status: String(rawPrey.status), groupId: group.id });
      if (rawPrey.status === 'dead' && !candidate.corpses.some(corpse => corpse.id === `CORPSE-${expected.actorId}` && corpse.actorId === expected.actorId)) badCombat();
    }
    const encounterIds = new Set<string>();
    const encounterSequences = new Set<number>();
    let activeCount = 0;
    const activeTargetIds = new Set<string>();
    let maxSequence = 0;
    for (const candidateEncounter of rawCombat.encounters) {
      if (!isRecord(candidateEncounter) || !isNonEmptyString(candidateEncounter.id) || !isSafeInt(candidateEncounter.sequence)
        || !['active', 'victory', 'defeat', 'retreated'].includes(String(candidateEncounter.status))
        || typeof candidateEncounter.targetActorId !== 'string' || !Array.isArray(candidateEncounter.actorIds)
        || candidateEncounter.actorIds.length !== 1 || typeof candidateEncounter.actorIds[0] !== 'string'
        || !Array.isArray(candidateEncounter.log) || candidateEncounter.log.length > 100
        || !isSafeInt(candidateEncounter.startedAtElapsedMs) || candidateEncounter.startedAtElapsedMs > candidate.simElapsedMs
        || !isSafeInt(candidateEncounter.round) || !isRecord(candidateEncounter.targetHealth)
        || !isSafeInt(candidateEncounter.targetHealth.current) || !isSafeInt(candidateEncounter.targetHealth.max)
        || !preyByActorId.has(candidateEncounter.targetActorId)
        || candidateEncounter.targetHealth.max !== preyByActorId.get(candidateEncounter.targetActorId)!.maxHealth
        || candidateEncounter.targetHealth.current > candidateEncounter.targetHealth.max
        || !['attack', 'retreat'].includes(String(candidateEncounter.pendingIntent))
        || !(candidateEncounter.completedAtElapsedMs === null || (isSafeInt(candidateEncounter.completedAtElapsedMs) && candidateEncounter.completedAtElapsedMs <= candidate.simElapsedMs))
        || !(candidateEncounter.nextTurnAtElapsedMs === null || isSafeInt(candidateEncounter.nextTurnAtElapsedMs))) badCombat();
      const encounterId = candidateEncounter.id as string;
      const sequence = candidateEncounter.sequence as number;
      if (encounterIds.has(encounterId) || encounterSequences.has(sequence)) badCombat();
      encounterIds.add(encounterId);
      encounterSequences.add(sequence);
      maxSequence = Math.max(maxSequence, sequence);
      const actorIds = candidateEncounter.actorIds as string[];
      if (actorIds.some(actorId => !candidate.ownedUnits.some(unit => unit.id === actorId && unit.ownerId === candidate.player.id))) badCombat();
      if (candidateEncounter.status === 'active') {
        activeCount += 1;
        activeTargetIds.add(candidateEncounter.targetActorId as string);
        if (!isSafeInt(candidateEncounter.nextTurnAtElapsedMs) || candidateEncounter.nextTurnAtElapsedMs <= candidate.simElapsedMs
          || candidateEncounter.completedAtElapsedMs !== null) badCombat();
      } else if (candidateEncounter.nextTurnAtElapsedMs !== null || candidateEncounter.completedAtElapsedMs === null) badCombat();
      if (candidateEncounter.status === 'victory' && candidateEncounter.targetHealth.current !== 0) badCombat();
      if (candidateEncounter.status !== 'victory' && candidateEncounter.targetHealth.current === 0) badCombat();
      const groupId = preyByActorId.get(candidateEncounter.targetActorId as string)!.groupId;
      const streamId = (groupId ? 'wildlife-combat:' : 'stage07-combat:') + encounterId;
      const stream = candidate.rngStreams?.[streamId];
      if (!stream || stream.algorithm !== 'HASH-PRIMITIVE-1.0' || !isSafeInt(stream.counter)) badCombat();
      if (!candidateEncounter.log.every(entry => isRecord(entry) && isSafeInt(entry.atElapsedMs) && entry.atElapsedMs <= candidate.simElapsedMs
        && isNonEmptyString(entry.actorId) && entry.targetActorId === candidateEncounter.targetActorId
        && ['hit', 'miss', 'retreat', 'defeat', 'victory'].includes(String(entry.outcome))
        && isSafeInt(entry.damage) && isSafeInt(entry.damageTaken) && isSafeInt(entry.actorHealth) && isSafeInt(entry.targetHealth))) badCombat();
    }
    if (!isSafeInt(rawCombat.nextEncounterSequence) || (rawCombat.nextEncounterSequence as number) <= maxSequence
      || activeCount > 1 || (activeCount === 1) !== (activeTargetIds.size === 1)
      || [...activeTargetIds].some(id => preyByActorId.get(id)?.status !== 'reacting')) badCombat();
  }
  if (!isRecord(candidate.clockControl) || !isRecord(candidate.timeBoundaries) || !isRecord(candidate.survival)
    || !isRecord(candidate.territory) || !isRecord(candidate.territory.survivalFire) || !isRecord(candidate.territory.tomb)
    || !isRecord(candidate.player.mana) || !Array.isArray(candidate.ownedUnits) || !Array.isArray(candidate.jobs)
    || !Array.isArray(candidate.calendar) || !isRecord(candidate.travel) || !isRecord(candidate.exploration)
    || !isRecord(candidate.spatial) || !Array.isArray(candidate.fieldChestStates) || !isRecord(candidate.stage08)
    || !Array.isArray(candidate.stage08.marketOffers)
    || !Array.isArray(candidate.playerKnowledge.knownSiteIds) || !Array.isArray(candidate.playerKnowledge.knownChestIds)
    || !Array.isArray(candidate.playerKnowledge.knownResourceIds) || !Array.isArray(candidate.playerKnowledge.knownRouteIds)
    || !Array.isArray(candidate.playerKnowledge.knownSignalIds)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup is missing Stage 04 state.', 'Bản sao lưu thiếu trạng thái Stage 04.');
  }
  const incomingContainers = candidate.inventory.containers;
  if (incomingContainers.length !== baseline.inventory.containers.length
    || incomingContainers.some(container => !isRecord(container) || !isNonEmptyString(container.id) || typeof container.observed !== 'boolean'
      || !Array.isArray(container.stacks) || !baseline.inventory.containers.some(original => original.id === container.id && original.kind === container.kind))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup inventory does not match the Stage 05 container schema.', 'Bản sao lưu không hợp lệ.');
  }
  const bagObserved = incomingContainers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.observed;
  const supplyObserved = incomingContainers.find(container => container.id === 'LL-CNT-SUPPLY-01')?.observed;
  if (typeof bagObserved !== 'boolean' || typeof supplyObserved !== 'boolean' || candidate.bagSeed.inspected !== bagObserved
    || typeof candidate.playerKnowledge.careerCardObserved !== 'boolean') {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid inspection state.', 'Bản sao lưu không hợp lệ.');
  }
  // Exploration, inspections and opening knowledge are save state, not immutable seed data.
  baseline.playerKnowledge = structuredClone(candidate.playerKnowledge);
  baseline.bagSeed = { ...baseline.bagSeed, inspected: bagObserved };

  const normalized = structuredClone(candidate) as GameState;
  normalized.revision = 0;
  normalized.lastEventSequence = 0;
  normalized.simElapsedMs = 0;
  normalized.clockControl = baseline.clockControl;
  normalized.timeBoundaries = baseline.timeBoundaries;
  normalized.survival = baseline.survival;
  normalized.player.mana = baseline.player.mana;
  normalized.player.position = baseline.player.position;
  normalized.player.location = baseline.player.location;
  normalized.territory.survivalFire = baseline.territory.survivalFire;
  normalized.territory.tomb = baseline.territory.tomb;
  normalized.ownedUnits = baseline.ownedUnits;
  normalized.jobs = baseline.jobs;
  normalized.calendar = baseline.calendar;
  normalized.eventProgressionBlocker = baseline.eventProgressionBlocker;
  normalized.travel = baseline.travel;
  normalized.exploration = baseline.exploration;
  normalized.spatial = baseline.spatial;
  normalized.fieldChestStates = baseline.fieldChestStates;
  normalized.wildlife = baseline.wildlife;
  normalized.eventProgress = baseline.eventProgress;
  normalized.playerKnowledge = structuredClone(candidate.playerKnowledge);
  normalized.stage08 = baseline.stage08;
  normalized.botPopulation = baseline.botPopulation;
  normalized.quests = baseline.quests;
  normalized.currency = baseline.currency;
  baseline.inventory = {
    containers: baseline.inventory.containers.map(container => ({
      ...container,
      observed: incomingContainers.find(candidateContainer => candidateContainer.id === container.id)?.observed ?? false,
    })),
  };
  normalized.inventory = {
    containers: baseline.inventory.containers.map(container => ({
      ...container,
      observed: incomingContainers.find(candidateContainer => isRecord(candidateContainer) && candidateContainer.id === container.id)?.observed === true,
    })),
  };
  normalized.bagSeed = { ...baseline.bagSeed, inspected: bagObserved };
  // Encounter state is mutable campaign state and was validated above; exclude it from the opening-state identity comparison.
  normalized.combat = baseline.combat;
  if (canonicalStateHash(baseline) !== canonicalStateHash(normalized)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup changes immutable opening state.', 'Bản sao lưu đã thay đổi trạng thái mở đầu bất biến.');
  }

  const elapsed = candidate.simElapsedMs;
  const expectedExpiry = elapsed < 144 * HOUR_MS ? 144 * HOUR_MS : null;
  const expectedBoundaries = {
    nextHourlySettlementAtElapsedMs: (Math.floor(elapsed / HOUR_MS) + 1) * HOUR_MS,
    nextMidnightAtElapsedMs: nextMidnightAfter(elapsed),
    nextDailySettlementAtElapsedMs: nextDailyBoundary(elapsed),
    nextSunsetAtElapsedMs: nextDailyBoundary(elapsed, 9.5 * HOUR_MS),
    nextTwilightEndAtElapsedMs: nextDailyBoundary(elapsed, 10 * HOUR_MS),
    nextDawnAtElapsedMs: nextDailyBoundary(elapsed),
    protectionExpiryAtElapsedMs: expectedExpiry,
  };
  const cold = candidate.survival;
  let coldEnvironmentValid = cold.environment === null;
  if (cold.environment !== null) {
    try { coldLoadRateMicroPerMinute(cold.environment); coldEnvironmentValid = true; } catch { coldEnvironmentValid = false; }
  }
  const coldBand = cold.coldLoadMicro >= 1_200_000_000 ? 'danger'
    : cold.coldLoadMicro >= 300_000_000 ? 'warning' : 'clear';
  if (canonicalStateHash(candidate.timeBoundaries) !== canonicalStateHash(expectedBoundaries)
    || candidate.player.mana.current !== candidate.player.mana.max || candidate.player.mana.max !== baseline.player.mana.max
    || candidate.player.mana.lastSettledAtElapsedMs !== elapsed || candidate.player.mana.baseRegenPerSecond !== 0.45
    || !isSafeInt(cold.coldLoadMicro) || !isSafeInt(cold.coldLoadRemainder) || cold.coldLoadRemainder >= MINUTE_MS
    || !coldEnvironmentValid || !['weather_unresolved', 'clear', 'warning', 'danger'].includes(cold.coldStatus)
    || (cold.environment === null ? cold.coldStatus !== 'weather_unresolved' : cold.coldStatus !== coldBand)
    || (cold.environment === null ? cold.blocker === null : cold.blocker !== null)
    || cold.hungerState !== 'FED') {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid time or survival state.', 'Trạng thái thời gian hoặc sinh tồn trong bản sao lưu không hợp lệ.');
  }
  const fire = candidate.territory.survivalFire;
  const expectedProtection = elapsed >= 144 * HOUR_MS ? 'expired' : 'active';
  if (!isSafeInt(fire.fuelRemaining) || !['state_unobserved', 'known'].includes(fire.fuelKnowledge)
    || (fire.active ? !isSafeInt(fire.nextFuelConsumptionAtElapsedMs, elapsed + 1) || fire.fuelRemaining < 1 : fire.nextFuelConsumptionAtElapsedMs !== null)
    || fire.fuelBlocker !== null || fire.protectionStatus !== expectedProtection
    || candidate.clockControl.stopCondition === undefined
    || !['paused', 'running'].includes(candidate.clockControl.status)
    || !['paused', '1x', '2x', '5x', 'custom'].includes(candidate.clockControl.selection)
    || !['none', 'next_completion', 'danger'].includes(candidate.clockControl.stopCondition)
    || !isSafeInt(candidate.clockControl.speedPermille)
    || (candidate.clockControl.status === 'paused' && (candidate.clockControl.selection !== 'paused' || candidate.clockControl.speedPermille !== 0))
    || (candidate.clockControl.status === 'running' && (candidate.clockControl.selection === 'paused' || candidate.clockControl.speedPermille < 100 || candidate.clockControl.speedPermille > 3_600_000))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid clock or fire state.', 'Trạng thái đồng hồ hoặc lửa trong bản sao lưu không hợp lệ.');
  }

  const tomb = candidate.territory.tomb;
  const queue = tomb.queue;
  if (!Array.isArray(queue) || tomb.deathQi.capacity !== 20 || !isSafeInt(tomb.deathQi.current)
    || tomb.deathQi.current > tomb.deathQi.capacity || tomb.deathQi.nextRefillAtElapsedMs !== expectedBoundaries.nextMidnightAtElapsedMs
    || canonicalStateHash(tomb.output) !== canonicalStateHash(baseline.territory.tomb.output)
    || new Set(queue.map(entry => entry.id)).size !== queue.length) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains invalid Tomb state.', 'Trạng thái Mộ trong bản sao lưu không hợp lệ.');
  }
  const validQueue = queue.every(entry => {
    if (entry.blueprintId !== TOMB_STANDARD_BLUEPRINT_ID || entry.recipeId !== TOMB_STANDARD_RECIPE_ID
      || !isNonEmptyString(entry.id) || !isNonEmptyString(entry.outputUnitId) || !isSafeInt(entry.enqueuedAtElapsedMs)
      || entry.enqueuedAtElapsedMs > elapsed || !isSafeInt(entry.progressCarryMs)) return false;
    if (entry.status === 'active') return entry.reservedDeathQi === 1 && Number.isSafeInteger(entry.slotId) && (entry.slotId as number) >= 0 && (entry.slotId as number) < 2
      && isSafeInt(entry.startedAtElapsedMs) && isSafeInt(entry.completesAtElapsedMs) && entry.startedAtElapsedMs <= elapsed
      && entry.completesAtElapsedMs > elapsed && entry.completesAtElapsedMs - entry.startedAtElapsedMs === TOMB_STANDARD_DURATION_MS;
    if (entry.status === 'completed') return entry.reservedDeathQi === 1 && entry.slotId === null && isSafeInt(entry.startedAtElapsedMs)
      && isSafeInt(entry.completesAtElapsedMs) && entry.completesAtElapsedMs <= elapsed
      && entry.completesAtElapsedMs - entry.startedAtElapsedMs === TOMB_STANDARD_DURATION_MS;
    return (entry.status === 'queued' || entry.status === 'blocked' || entry.status === 'cancelled')
      && entry.reservedDeathQi === 0 && entry.slotId === null && entry.startedAtElapsedMs === null && entry.completesAtElapsedMs === null;
  });
  const activeSlots = queue.filter(entry => entry.status === 'active').map(entry => entry.slotId);
  const completedUnits = queue.filter(entry => entry.status === 'completed').map(entry => entry.outputUnitId);
  if (!validQueue || new Set(activeSlots).size !== activeSlots.length || new Set(completedUnits).size !== completedUnits.length
    || candidate.ownedUnits.length !== completedUnits.length
    || completedUnits.some(unitId => !candidate.ownedUnits.some(unit => unit.id === unitId && unit.creationRoute === 'TOMB_QUEUE'
      && unit.xpMirrorEligible === false && unit.level === tomb.output.level && unit.xp === tomb.output.xp
      && unit.sourceStats.formTier === tomb.output.formTier && unit.sourceStats.grade === tomb.output.grade
      && unit.sourceStats.hero === false && unit.baseLaborRateWuPerHour === tomb.output.baseLaborRateWuPerHour))
    || candidate.jobs.some(job => job.kind === 'tomb_production' && !queue.some(entry => entry.id === job.id && (entry.status === 'active' || entry.status === 'completed')))
    || queue.some(entry => (entry.status === 'active' || entry.status === 'completed') && !candidate.jobs.some(job => job.kind === 'tomb_production' && job.id === entry.id))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The Tomb queue and roster do not agree.', 'Hàng đợi Mộ và quân lực trong bản sao lưu không khớp.');
  }

  const ev00 = candidate.calendar.find(event => event.id === 'EV00-SAFE-FIRE');
  const expectedEv00CalendarStatus = expectedProtection === 'expired' ? 'resolved' : 'active';
  if (!ev00 || ev00.status !== expectedEv00CalendarStatus || ev00.openReceiptSequence !== 1
    || (expectedProtection === 'expired' && (!isSafeInt(ev00.resolutionReceiptSequence, 1)
      || (ev00.lockReceiptSequence !== null && !isSafeInt(ev00.lockReceiptSequence, 1))))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The opening protection calendar row is inconsistent.', 'Sự kiện bảo hộ mở đầu trong lịch không nhất quán.');
  }
  const validSequence = (sequence: unknown): boolean => sequence === null
    || (isSafeInt(sequence, 1) && sequence <= candidate.lastEventSequence);
  const validCalendar = candidate.calendar.length === world.eventSchedule.length && candidate.calendar.every((event, index) => {
    const source = world.eventSchedule[index];
    if (!isRecord(event) || !source || event.id !== source.id || event.opensAtMs !== source.opensAtMs
      || event.locksAtMs !== source.locksAtMs || event.resolvesAtMs !== source.resolvesAtMs
      || event.displayName !== source.displayName || !validSequence(event.openReceiptSequence)
      || !validSequence(event.lockReceiptSequence) || !validSequence(event.blockedReceiptSequence)
      || !validSequence(event.resolutionReceiptSequence)) return false;
    if (event.status === 'scheduled') return event.opensAtMs > elapsed && event.openReceiptSequence === null && event.lockReceiptSequence === null
      && event.blockedReceiptSequence === null && event.resolutionReceiptSequence === null;
    if (event.status === 'active') return isSafeInt(event.openReceiptSequence, 1) && event.opensAtMs <= elapsed && elapsed < event.locksAtMs
      && event.lockReceiptSequence === null && event.blockedReceiptSequence === null && event.resolutionReceiptSequence === null;
    if (event.status === 'locked') return isSafeInt(event.openReceiptSequence, 1) && isSafeInt(event.lockReceiptSequence, 1)
      && event.openReceiptSequence < event.lockReceiptSequence && event.locksAtMs <= elapsed && elapsed < event.resolvesAtMs
      && event.blockedReceiptSequence === null && event.resolutionReceiptSequence === null;
    if (event.status === 'resolved') return isSafeInt(event.openReceiptSequence, 1)
      && (isSafeInt(event.lockReceiptSequence, 1) || (event.id === 'EV00-SAFE-FIRE' && event.lockReceiptSequence === null))
      && isSafeInt(event.resolutionReceiptSequence, 1) && event.blockedReceiptSequence === null && event.resolvesAtMs <= elapsed
      && event.openReceiptSequence < (event.lockReceiptSequence ?? event.resolutionReceiptSequence)
      && (event.lockReceiptSequence === null || event.lockReceiptSequence < event.resolutionReceiptSequence);
    if (event.status === 'blocked') return event.openReceiptSequence === null && event.lockReceiptSequence === null
      && event.opensAtMs <= elapsed && event.resolutionReceiptSequence === null;
    return event.status === 'cancelled' && event.openReceiptSequence === null && event.lockReceiptSequence === null
      && event.blockedReceiptSequence === null && event.resolutionReceiptSequence === null;
  });
  const blockedRows = candidate.calendar.filter(event => event.status === 'blocked');
  const progressionBlocker = candidate.eventProgressionBlocker;
  const validProgressionBlocker = progressionBlocker === null
    ? blockedRows.length === 0
    : isRecord(progressionBlocker) && blockedRows.length === 1
      && blockedRows[0].id === progressionBlocker.eventId
      && isSafeInt(progressionBlocker.blockedAtElapsedMs)
      && progressionBlocker.blockedAtElapsedMs === candidate.simElapsedMs
      && isNonEmptyString(progressionBlocker.reasonCode, 100)
      && isNonEmptyString(progressionBlocker.playerMessage, 500)
      && validSequence(progressionBlocker.receiptSequence)
      && progressionBlocker.receiptSequence === blockedRows[0].blockedReceiptSequence
      && candidate.clockControl.status === 'paused';
  const lifecycleReceipts = candidate.calendar.flatMap(event => [event.openReceiptSequence, event.lockReceiptSequence,
    event.blockedReceiptSequence, event.resolutionReceiptSequence].filter((sequence): sequence is number => sequence !== null));
  if (!validCalendar || !validProgressionBlocker || new Set(lifecycleReceipts).size !== lifecycleReceipts.length) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The event calendar receipts or progression blocker are inconsistent.', 'Lịch sự kiện trong bản sao lưu không nhất quán.');
  }
  validateStage05State(candidate, world, baseline);
  try {
    verifyStage08State(candidate);
  } catch {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains invalid Stage 08 quest, shop, currency or escrow state.', 'Bản sao lưu Stage 08 không hợp lệ.');
  }
  return candidate;
}

function validateBackupReceipt(value: unknown): value is { commandId: string; requestSha256: string; receipt: CommandReceipt; createdAtUtc: string } {
  if (!isRecord(value) || !isNonEmptyString(value.commandId) || typeof value.requestSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(value.requestSha256) || !checkIsoUtc(value.createdAtUtc) || !isRecord(value.receipt)) return false;
  const receipt = value.receipt;
  return receipt.commandId === value.commandId && typeof receipt.accepted === 'boolean' && isSafeInt(receipt.revision)
    && (receipt.eventSequence === null || isSafeInt(receipt.eventSequence, 1))
    && isNonEmptyString(receipt.code, 100) && isNonEmptyString(receipt.message, 500)
    && (receipt.accepted || receipt.eventSequence === null);
}

function validEventPayload(value: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 500;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 1_000 && value.every(item => validEventPayload(item, depth + 1));
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 100 && entries.every(([key, item]) => key.length <= 100 && validEventPayload(item, depth + 1));
}

function validateBackupEvent(value: unknown, index: number, saveId: string, receipts: Map<string, CommandReceipt>, state: GameState): boolean {
  if (!isRecord(value) || value.eventSequence !== index + 1 || value.eventId !== `${saveId}:event:${String(index + 1).padStart(12, '0')}`
    || !isSafeInt(value.occurredAtElapsedMs) || !isNonEmptyString(value.causalCommandId)
    || value.payloadSchemaVersion !== 1 || !isNonEmptyString(value.rulesetVersion) || !isNonEmptyString(value.contentVersion)
    || !isNonEmptyString(value.eventType) || !isRecord(value.payload) || !isRecord(value.playerEvent)) return false;
  const receipt = receipts.get(value.causalCommandId);
  if (!receipt || !receipt.accepted || receipt.eventSequence === null || value.eventSequence > receipt.eventSequence) return false;
  const publicEvent = value.playerEvent;
  if (publicEvent.sequence !== value.eventSequence || publicEvent.eventId !== value.eventId
    || !isNonEmptyString(publicEvent.type, 80) || !isNonEmptyString(publicEvent.category, 80)
    || !isNonEmptyString(publicEvent.title, 180) || !isNonEmptyString(publicEvent.text, 500)) return false;
  const systemEventTypes = new Set([
    'clock_speed_changed', 'clock_stop_condition_set', 'clock_paused_after_restart',
    'clock_paused_after_lease_expired', 'clock_paused_on_shutdown', 'clock_paused_on_stop_condition',
    'simulation_time_advanced', 'simulation_hour_settled', 'world_day_started', 'world_sunset',
    'world_night_started', 'world_dawn', 'opening_protection_started', 'opening_protection_expired',
    'event_calendar_opened', 'event_calendar_locked', 'event_calendar_resolved', 'mandatory_event_blocked',
    'event_objective_progressed', 'event_objective_settled', 'event_choice_made', 'event_shop_purchase_committed',
    'event_inventory_expired', 'event_reward_claimed', 'event_reward_claim_expired',
    'event_rank_settlement_blocked', 'opening_rival_action_committed', 'event_rank_settled', 'opening_rank_reward_claimed',
    'caravan_departed', 'caravan_distress_opened', 'caravan_arrived', 'quest_completed',
    'market_opened', 'caravan_window_closed', 'auction_bid_expired', 'shop_offer_expired',
    'quest_accepted', 'caravan_safe_passage_negotiated', 'caravan_escort_started', 'quest_reward_claimed',
    'shop_purchase_committed', 'auction_bid_placed', 'auction_bid_cancelled',
    'cold_warning_changed', 'cold_danger_reached', 'fire_fuel_consumed', 'survival_fire_extinguished',
    'fire_refuelled', 'survival_fire_lit', 'tomb_job_queued', 'tomb_job_started', 'tomb_job_blocked',
    'tomb_job_cancelled', 'tomb_unit_completed', 'tomb_death_qi_refilled',
    'movement_order_started', 'movement_order_completed', 'movement_order_cancelled', 'spatial_search_started',
    'spatial_search_tick_settled', 'spatial_search_completed', 'spatial_search_cancelled', 'chest_signal_detected',
    'chest_opened', 'chest_loot_delivered', 'wildlife_group_discovered', 'wildlife_group_depleted', 'wildlife_population_replenished',
    'harvest_job_started', 'harvest_arrived_at_workfront', 'resource_extracted', 'harvest_work_completed',
    'harvest_job_blocked', 'harvest_cargo_returned', 'harvest_job_cancelled', 'inventory_item_transferred',
    'inventory_stack_split', 'inventory_stacks_merged', 'inventory_food_consumed',
    'resource_daily_quotas_reset', 'career_activated', 'corpse_revived', 'corpse_butchered',
    'unit_equipment_changed', 'unit_equipment_removed', 'xp_awarded',
    'combat_encounter_started', 'combat_retreat_ordered', 'combat_turn_settled', 'combat_encounter_won',
    'combat_encounter_retreated', 'combat_unit_defeated', 'bot_raid_player_attack',
  ]);
  if (value.eventType === 'career_card_inspected') return Object.keys(value.payload).length === 0;
  if (value.eventType === 'starter_container_inspected') return (value.payload.containerId === 'LL-CNT-CARRIED-FOOD-BAG-01' && value.payload.containerKind === 'carried_bag')
    || (value.payload.containerId === 'LL-CNT-SUPPLY-01' && value.payload.containerKind === 'territory_supply');
  if (value.eventType === 'known_entity_inspected') {
    const entity = value.payload.entity;
    if (!isRecord(entity) || typeof entity.id !== 'string') return false;
    if (entity.type === 'site') return state.playerKnowledge.knownSiteIds.includes(entity.id);
    if (entity.type === 'resource') return state.playerKnowledge.knownResourceIds.includes(entity.id);
    if (entity.type === 'cache') return state.playerKnowledge.knownSignalIds.includes(entity.id) || state.playerKnowledge.knownChestIds.includes(entity.id);
    if (entity.type === 'route') return state.playerKnowledge.knownRouteIds.includes(entity.id);
    if (entity.type === 'unit') return state.ownedUnits.some(unit => unit.id === entity.id);
    if (entity.type === 'corpse') return (state.playerKnowledge.knownCorpseIds ?? []).includes(entity.id);
    if (entity.type === 'bot') return (state.playerKnowledge.knownBotIds ?? []).includes(entity.id);
    if (entity.type === 'item') return state.inventory.containers.some(container => container.observed && container.stacks.some(stack => stack.itemId === entity.id));
    return false;
  }
  if (!systemEventTypes.has(String(value.eventType))) return false;
  return validEventPayload(value.payload);
}

function validateEventProgressLedger(state: GameState, events: readonly Record<string, any>[], world: WorldDefinition): boolean {
  const scoreByEvent = new Map<string, number>();
  const purchasesByEvent = new Map<string, { quantity: number; score: number }>();
  const expiredByEvent = new Map<string, Record<string, number>>();
  const choiceByEvent = new Map<string, string>();
  const settledByEvent = new Map<string, Record<string, unknown>>();
  const claimedByEvent = new Map<string, { amount: number; commandId: string; count: number }>();
  const expiredClaims = new Set<string>();
  const expiredEventIds = new Set<string>();
  const addExpiry = (eventId: string, quantities: Record<string, unknown>): boolean => {
    const accumulated = expiredByEvent.get(eventId) ?? {};
    for (const [templateId, quantity] of Object.entries(quantities)) {
      if (!isSafeInt(quantity)) return false;
      accumulated[templateId] = (accumulated[templateId] ?? 0) + quantity;
    }
    expiredByEvent.set(eventId, accumulated);
    return true;
  };

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    const eventId = isRecord(event.payload) && typeof event.payload.eventId === 'string' ? event.payload.eventId : null;
    if (event.eventType === 'event_objective_progressed') {
      const progress = state.eventProgress.find(item => item.eventId === eventId);
      const rule = progress ? eventMechanicsFor(progress.eventId) : null;
      const payload = event.payload;
      if (!progress || !rule || !isRecord(payload) || payload.ruleVersion !== EVENT_MECHANICS_RULE_VERSION
        || !isSafeInt(payload.scoreDelta, 1) || !isSafeInt(payload.target) || payload.target !== rule.target
        || !isSafeInt(payload.objectiveProgress, 1) || !Array.isArray(payload.sourceEventTypes)
        || !payload.sourceEventTypes.every(type => typeof type === 'string')) return false;
      const sourceEvents = events.slice(0, index).filter(source => source.causalCommandId === event.causalCommandId
        && source.occurredAtElapsedMs === event.occurredAtElapsedMs && Object.hasOwn(rule.activityPoints, source.eventType));
      const sourceTypes = [...new Set(sourceEvents.map(source => source.eventType))].sort();
      const reportedTypes = [...new Set(payload.sourceEventTypes as string[])].sort();
      const sourcePoints = sourceEvents.reduce((sum, source) => sum + (rule.activityPoints[source.eventType] ?? 0), 0);
      const previousScore = scoreByEvent.get(progress.eventId) ?? 0;
      const expectedDelta = Math.min(sourcePoints, Math.max(0, rule.target - previousScore));
      const schedule = world.eventSchedule.find(row => row.id === progress.eventId);
      if (!schedule || event.occurredAtElapsedMs < schedule.opensAtMs || event.occurredAtElapsedMs >= schedule.locksAtMs
        || sourceEvents.length === 0 || JSON.stringify(sourceTypes) !== JSON.stringify(reportedTypes)
        || payload.scoreDelta !== expectedDelta || payload.objectiveProgress !== previousScore + expectedDelta) return false;
      scoreByEvent.set(progress.eventId, previousScore + expectedDelta);
    } else if (event.eventType === 'event_choice_made') {
      const payload = event.payload;
      const schedule = world.eventSchedule.find(row => row.id === eventId);
      if (!isRecord(payload) || payload.ruleVersion !== EVENT_MECHANICS_RULE_VERSION || payload.choiceId !== 'ice' && payload.choiceId !== 'snow'
        || !schedule || event.occurredAtElapsedMs < schedule.opensAtMs || event.occurredAtElapsedMs >= schedule.locksAtMs
        || choiceByEvent.has(eventId!)) return false;
      choiceByEvent.set(eventId!, payload.choiceId);
    } else if (event.eventType === 'event_shop_purchase_committed') {
      const payload = event.payload;
      const schedule = world.eventSchedule.find(row => row.id === eventId);
      if (!isRecord(payload) || payload.shopRuleVersion !== EVENT_SHOP_RULE_VERSION || payload.itemTemplateId !== `EVENT-MARK-${eventId}`
        || !isSafeInt(payload.quantity, 1) || payload.scoreCost !== payload.quantity * EVENT_SHOP_MARK_PRICE
        || !isSafeInt(payload.stockRemaining) || !schedule || event.occurredAtElapsedMs < schedule.opensAtMs
        || event.occurredAtElapsedMs >= schedule.locksAtMs) return false;
      const total = purchasesByEvent.get(eventId!) ?? { quantity: 0, score: 0 };
      const expectedStock = EVENT_SHOP_INITIAL_STOCK - total.quantity - payload.quantity;
      const scoreEarnedByNow = scoreByEvent.get(eventId!) ?? 0;
      if (expectedStock < 0 || payload.stockRemaining !== expectedStock || total.score + payload.scoreCost > scoreEarnedByNow) return false;
      total.quantity += payload.quantity;
      total.score += payload.scoreCost;
      purchasesByEvent.set(eventId!, total);
    } else if (event.eventType === 'event_inventory_expired') {
      const payload = event.payload;
      const schedule = world.eventSchedule.find(row => row.id === eventId);
      if (!isRecord(payload) || payload.shopRuleVersion !== EVENT_SHOP_RULE_VERSION || !isRecord(payload.expiredByTemplate)
        || !schedule || event.occurredAtElapsedMs !== schedule.resolvesAtMs || expiredEventIds.has(eventId!)
        || !events.slice(0, index).some(previous => previous.eventType === 'event_calendar_resolved'
          && isRecord(previous.payload) && previous.payload.eventId === eventId && previous.occurredAtElapsedMs === event.occurredAtElapsedMs)
        || !addExpiry(eventId!, payload.expiredByTemplate)) return false;
      expiredEventIds.add(eventId!);
    } else if (event.eventType === 'event_objective_settled') {
      if (!eventId || !isRecord(event.payload) || settledByEvent.has(eventId)) return false;
      settledByEvent.set(eventId, event.payload);
    } else if (event.eventType === 'event_reward_claimed') {
      if (!eventId || !isRecord(event.payload) || !isSafeInt(event.payload.amount, 1)
        || event.payload.currencyId !== 'KRONA' || !isNonEmptyString(event.payload.commandId)
        || !settledByEvent.has(eventId)) return false;
      const total = claimedByEvent.get(eventId) ?? { amount: 0, commandId: event.payload.commandId, count: 0 };
      total.amount += event.payload.amount;
      total.count += 1;
      claimedByEvent.set(eventId, total);
    } else if (event.eventType === 'event_reward_claim_expired') {
      const payload = event.payload;
      const schedule = world.eventSchedule.find(row => row.id === eventId);
      if (!eventId || !isRecord(payload) || payload.ruleVersion !== EVENT_REWARD_RULE_VERSION
        || !schedule || !isSafeInt(payload.expiredAtElapsedMs) || event.occurredAtElapsedMs !== payload.expiredAtElapsedMs
        || expiredClaims.has(eventId)) return false;
      expiredClaims.add(eventId);
    }
  }

  return state.eventProgress.every(progress => {
    const score = scoreByEvent.get(progress.eventId) ?? 0;
    const purchase = purchasesByEvent.get(progress.eventId) ?? { quantity: 0, score: 0 };
    const expired = expiredByEvent.get(progress.eventId) ?? {};
    const settlement = settledByEvent.get(progress.eventId);
    const rewardClaims = claimedByEvent.get(progress.eventId) ?? { amount: 0, commandId: '', count: 0 };
    const choice = choiceByEvent.get(progress.eventId) ?? null;
    if (progress.score !== score || progress.objectiveProgress !== score
      || progress.shopPurchasedQuantity !== purchase.quantity || progress.scoreSpent !== purchase.score
      || JSON.stringify(progress.expiredItemQuantities) !== JSON.stringify(expired)
      || progress.choiceId !== choice
      || (progress.outcome === 'unsettled') !== !settlement) return false;
    if (settlement) {
      const rule = eventMechanicsFor(progress.eventId)!;
      const outcome = progress.participated ? (score >= rule.target ? 'success' : 'failed') : 'nonparticipant';
      const reward = outcome === 'success' ? Math.min(100, 10 + Math.floor(score / 5)) : 0;
      const schedule = world.eventSchedule.find(row => row.id === progress.eventId)!;
      if (settlement.outcome !== outcome || settlement.score !== score || settlement.objectiveProgress !== score
        || settlement.target !== rule.target || settlement.rewardKrona !== reward
        || settlement.claimExpiresAtElapsedMs !== (outcome === 'success' ? schedule.resolvesAtMs + 7 * DAY_MS : null)) return false;
    }
    if ((progress.outcome === 'claimed') !== (rewardClaims.count === 1)
      || (rewardClaims.count > 0 && (rewardClaims.amount !== progress.rewardKrona || rewardClaims.commandId !== progress.claimReceiptId))) return false;
    if ((progress.outcome === 'expired') !== expiredClaims.has(progress.eventId)) return false;
    return true;
  });
}

function validateWildlifeProgressLedger(state: GameState, events: readonly Record<string, any>[], world: WorldDefinition): boolean {
  const initial = initialWildlifeState(world, 0);
  const groups = new Map(initial.groups.map(group => [group.id, group]));
  const remaining = new Map(initial.groups.map(group => [group.id, group.capacity]));
  const discoveredAt = new Map<string, number>();
  const killedActors = new Set<string>();
  const depletionReceipts: string[] = [];
  const expectedDepletions: string[] = [];
  const replenishmentTimes = new Set<number>();
  const pointDistanceToSegment = (point: { xMm: number; yMm: number }, from: { xMm: number; yMm: number }, to: { xMm: number; yMm: number }): number => {
    const dx = to.xMm - from.xMm;
    const dy = to.yMm - from.yMm;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.xMm - from.xMm) * dx + (point.yMm - from.yMm) * dy) / lengthSquared));
    return Math.hypot(point.xMm - (from.xMm + dx * t), point.yMm - (from.yMm + dy * t));
  };

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    const payload = event.payload;
    if (!isRecord(payload)) return false;
    if (event.eventType === 'wildlife_group_discovered') {
      const groupId = typeof payload.groupId === 'string' ? payload.groupId : '';
      const group = groups.get(groupId);
      const liveGroup = state.wildlife.groups.find(candidate => candidate.id === groupId);
      const searchJob = state.spatial.searchJobs.find(candidate => candidate.id === payload.jobId);
      const supportedSweep = Boolean(group && searchJob && searchJob.path.slice(1).some((point, pointIndex) => {
        const from = searchJob.path[pointIndex]!;
        return Math.abs((group.position.sourceZMetres ?? 0) - (from.sourceZMetres ?? 0)) <= 2
          && pointDistanceToSegment(group.position, from, point) <= searchJob.laneWidthMm / 2;
      }));
      const hadSettledSearchTick = events.slice(0, index).some(previous => previous.eventType === 'spatial_search_tick_settled'
        && previous.causalCommandId === event.causalCommandId && previous.occurredAtElapsedMs === event.occurredAtElapsedMs
        && isRecord(previous.payload) && previous.payload.jobId === payload.jobId);
      if (!group || !liveGroup || !searchJob || !supportedSweep || !hadSettledSearchTick
        || discoveredAt.has(groupId) || liveGroup.discovery !== 'known'
        || payload.ecologyId !== group.ecologyId || payload.speciesId !== group.speciesId
        || payload.observedCount !== group.capacity || liveGroup.discoveredAtElapsedMs !== event.occurredAtElapsedMs
        || event.occurredAtElapsedMs < searchJob.startedAtElapsedMs) return false;
      discoveredAt.set(groupId, event.occurredAtElapsedMs);
    } else if (event.eventType === 'combat_encounter_won' && typeof payload.wildlifeGroupId === 'string') {
      const groupId = payload.wildlifeGroupId;
      const current = remaining.get(groupId);
      const actorId = typeof payload.targetId === 'string' ? payload.targetId : '';
      const prey = (state.combat?.wildlifeTargets ?? []).find(candidate => candidate.actorId === actorId);
      const encounter = state.combat?.encounters.find(candidate => candidate.id === payload.encounterId);
      const hasSettledVictory = events.slice(0, index).some(previous => previous.eventType === 'combat_turn_settled'
        && previous.causalCommandId === event.causalCommandId && previous.occurredAtElapsedMs === event.occurredAtElapsedMs
        && isRecord(previous.payload) && previous.payload.encounterId === payload.encounterId
        && previous.payload.outcome === 'victory');
      if (!discoveredAt.has(groupId) || current === undefined || current < 1 || !prey || prey.wildlifeGroupId !== groupId
        || prey.status !== 'dead' || !encounter || encounter.status !== 'victory' || encounter.targetActorId !== actorId
        || encounter.completedAtElapsedMs !== event.occurredAtElapsedMs || !hasSettledVictory
        || killedActors.has(actorId) || payload.corpseId !== `CORPSE-${actorId}`
        || !state.corpses.some(corpse => corpse.id === payload.corpseId && corpse.actorId === actorId)) return false;
      killedActors.add(actorId);
      const afterKill = current - 1;
      remaining.set(groupId, afterKill);
      if (afterKill === 0) expectedDepletions.push(`${groupId}|${event.occurredAtElapsedMs}|${event.causalCommandId}`);
    } else if (event.eventType === 'wildlife_group_depleted') {
      const groupId = typeof payload.groupId === 'string' ? payload.groupId : '';
      const signature = `${groupId}|${event.occurredAtElapsedMs}|${event.causalCommandId}`;
      if (!groups.has(groupId) || remaining.get(groupId) !== 0 || payload.ecologyId !== groups.get(groupId)!.ecologyId) return false;
      depletionReceipts.push(signature);
    } else if (event.eventType === 'wildlife_population_replenished') {
      const groupId = typeof payload.groupId === 'string' ? payload.groupId : '';
      const original = groups.get(groupId);
      const current = remaining.get(groupId);
      const next = current === undefined ? undefined : current + 1;
      if (!original || current === undefined || next === undefined || !isWildlifeRenewable(original.populationKey)
        || current >= original.capacity || payload.amount !== 1 || payload.remaining !== next
        || !isSafeInt(event.occurredAtElapsedMs) || event.occurredAtElapsedMs > state.simElapsedMs) return false;
      remaining.set(groupId, next);
      replenishmentTimes.add(event.occurredAtElapsedMs);
    }
  }

  const expectedKnownIds = [...discoveredAt.keys()].sort();
  const knownIds = [...(state.playerKnowledge.knownWildlifeGroupIds ?? [])].sort();
  if (JSON.stringify(expectedKnownIds) !== JSON.stringify(knownIds)
    || state.wildlife.groups.some(group => (group.discovery === 'known') !== discoveredAt.has(group.id)
      || (group.discovery === 'known' && group.discoveredAtElapsedMs !== discoveredAt.get(group.id)))) return false;
  const wildlifeTargets = state.combat?.wildlifeTargets ?? [];
  for (const group of initial.groups) {
    const live = state.wildlife.groups.find(candidate => candidate.id === group.id);
    const targets = wildlifeTargets.filter(target => target.wildlifeGroupId === group.id);
    const ordinals = targets.map(target => target.individualOrdinal ?? 0).sort((left, right) => left - right);
    if (!live || live.remaining !== remaining.get(group.id)
      || live.nextMemberOrdinal !== targets.length + 1
      || ordinals.some((ordinal, index) => ordinal !== index + 1)
      || targets.filter(target => target.status === 'dead').length !== targets.filter(target => killedActors.has(target.actorId)).length
      || targets.some(target => (target.status === 'dead') !== killedActors.has(target.actorId))) return false;
  }
  if (JSON.stringify([...expectedDepletions].sort()) !== JSON.stringify([...depletionReceipts].sort())) return false;
  const replenishedAt = [...replenishmentTimes].sort((left, right) => left - right);
  if (replenishedAt.length > 0) {
    const phase = replenishedAt[0]! % WILDLIFE_REPLENISHMENT_MS;
    if (replenishedAt.some(at => at % WILDLIFE_REPLENISHMENT_MS !== phase)
      || state.wildlife.nextReplenishmentAtElapsedMs % WILDLIFE_REPLENISHMENT_MS !== phase
      || replenishedAt.some(at => (state.wildlife.nextReplenishmentAtElapsedMs - at) % WILDLIFE_REPLENISHMENT_MS !== 0)) return false;
  }
  return true;
}

function validateBackup(value: unknown, world: WorldDefinition): BackupEnvelope {
  if (!isRecord(value) || value.format !== 'ICE-AGE-LORD-SAVE-BACKUP' || value.version !== 1
    || !checkIsoUtc(value.exportedAtUtc) || !isRecord(value.save) || !Array.isArray(value.receipts)
    || !Array.isArray(value.events) || !Array.isArray(value.checkpoints) || typeof value.stateSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(value.stateSha256)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup envelope is malformed or unsupported.', 'Bản sao lưu không hợp lệ.');
  }
  if (value.receipts.length > MAX_BACKUP_ROWS || value.events.length > MAX_BACKUP_ROWS || value.checkpoints.length > MAX_BACKUP_CHECKPOINTS) {
    throw new ApiProblem(413, 'PAYLOAD_TOO_LARGE', 'The backup contains too many records.', 'Bản sao lưu vượt giới hạn kích thước.');
  }

  if (canonicalStateHash(value.state) !== value.stateSha256) throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup state checksum does not match.', 'Bản sao lưu không hợp lệ.');
  const rawState = value.state as Record<string, unknown>;
  const state = validateBackupState(value.state, world);
  const save = value.save;
  if (!isNonEmptyString(save.saveId) || save.saveId !== state.saveId || !isNonEmptyString(save.slotName, 80)
    || !isSafeInt(save.revision) || save.revision !== state.revision || !isSafeInt(save.lastEventSequence)
    || save.lastEventSequence !== state.lastEventSequence || save.worldPackageId !== state.worldPackageId
    || save.contentVersion !== rawState.contentVersion || save.rulesetVersion !== rawState.rulesetVersion
    || !checkIsoUtc(save.createdAtUtc) || !checkIsoUtc(save.updatedAtUtc)
    || !(save.forkedFrom === null || (isRecord(save.forkedFrom) && isNonEmptyString(save.forkedFrom.saveId) && isNonEmptyString(save.forkedFrom.checkpointId)))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup save metadata does not match its state.', 'Bản sao lưu không hợp lệ.');
  }

  const receiptMap = new Map<string, CommandReceipt>();
  for (const item of value.receipts) {
    if (!validateBackupReceipt(item) || receiptMap.has(item.commandId) || item.receipt.revision > state.revision) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup receipt ledger is malformed.', 'Bản sao lưu không hợp lệ.');
    }
    receiptMap.set(item.commandId, item.receipt);
  }
  if (value.events.length !== state.lastEventSequence || value.events.some((event, index) => !validateBackupEvent(event, index, state.saveId, receiptMap, state))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup event ledger is malformed.', 'Bản sao lưu không hợp lệ.');
  }
  const ledgerEvents = value.events as Array<Record<string, any>>;
  if (!validateEventProgressLedger(state, ledgerEvents, world)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The event progress does not match its committed runtime receipts.', 'Tiến độ sự kiện không khớp với nhật ký đã quyết toán.');
  }
  if (!validateWildlifeProgressLedger(state, ledgerEvents, world)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The wildlife state does not match its committed search, combat and regeneration receipts.', 'Trạng thái quần thể không khớp với nhật ký tìm kiếm, săn bắt và tái tạo.');
  }
  const lifecycleReceiptMatches = state.calendar.every(event => {
    const matches = (sequence: number | null, eventType: string): boolean => sequence === null
      || (ledgerEvents[sequence - 1]?.eventType === eventType
        && ledgerEvents[sequence - 1]?.payload?.eventId === event.id);
    const openedBy = event.id === 'EV00-SAFE-FIRE' ? 'opening_protection_started' : 'event_calendar_opened';
    const resolvedBy = event.id === 'EV00-SAFE-FIRE' && event.lockReceiptSequence === null
      ? 'opening_protection_expired' : 'event_calendar_resolved';
    return matches(event.openReceiptSequence, openedBy)
      && matches(event.lockReceiptSequence, 'event_calendar_locked')
      && matches(event.blockedReceiptSequence, 'mandatory_event_blocked')
      && matches(event.resolutionReceiptSequence, resolvedBy);
  });
  if (!lifecycleReceiptMatches) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'An event calendar receipt does not identify its lifecycle event.', 'Biên nhận lịch sự kiện không khớp với nhật ký.');
  }
  for (const receipt of receiptMap.values()) {
    const relatedEvents = value.events.filter(event => isRecord(event) && event.causalCommandId === receipt.commandId);
    const maxSequence = relatedEvents.reduce((max, event) => isRecord(event) && isSafeInt(event.eventSequence) ? Math.max(max, event.eventSequence) : max, 0);
    if ((receipt.eventSequence === null && relatedEvents.length > 0)
      || (receipt.eventSequence !== null && (maxSequence !== receipt.eventSequence
        || !relatedEvents.some(event => isRecord(event) && event.eventSequence === receipt.eventSequence)))) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup receipt does not match its event.', 'Bản sao lưu không hợp lệ.');
    }
  }

  for (const checkpoint of value.checkpoints) {
    if (!isRecord(checkpoint) || checkpoint.saveId !== state.saveId || !isNonEmptyString(checkpoint.checkpointId)
      || !isNonEmptyString(checkpoint.label, 80) || !isSafeInt(checkpoint.revision) || !isSafeInt(checkpoint.eventSequence)
      || !checkIsoUtc(checkpoint.createdAtUtc) || typeof checkpoint.stateSha256 !== 'string'
      || !/^[a-f0-9]{64}$/.test(checkpoint.stateSha256)) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'A checkpoint in the backup is malformed.', 'Bản sao lưu không hợp lệ.');
    }
    const checkpointState = validateBackupState(checkpoint.state, world);
    if (checkpointState.saveId !== state.saveId || checkpointState.revision !== checkpoint.revision
      || checkpointState.lastEventSequence !== checkpoint.eventSequence || canonicalStateHash(checkpointState) !== checkpoint.stateSha256
      || checkpointState.revision > state.revision) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'A checkpoint in the backup failed validation.', 'Bản sao lưu không hợp lệ.');
    }
  }
  const checkpointIds = value.checkpoints.map(checkpoint => isRecord(checkpoint) ? checkpoint.checkpointId : null);
  if (new Set(checkpointIds).size !== checkpointIds.length) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'Checkpoint IDs must be unique within a backup.', 'Bản sao lưu không hợp lệ.');
  }
  return value as unknown as BackupEnvelope;
}

export class GameApplicationService {
  private readonly commandQueues = new Map<string, Promise<void>>();
  private readonly clockDrivers = new Map<string, ClockDriver>();
  private readonly monotonicNow: () => number;
  private readonly clockLeaseMs: number;
  private readonly clockTickIntervalMs: number;
  private readonly timersEnabled: boolean;
  readonly repository: SqliteRepository;
  readonly world: WorldDefinition;

  constructor(repository: SqliteRepository, world: WorldDefinition = ACTIVE_WORLD_PACKAGE, clockOptions: ClockRuntimeOptions = {}) {
    this.repository = repository;
    this.world = world;
    this.monotonicNow = clockOptions.monotonicNow ?? (() => performance.now());
    this.clockLeaseMs = clockOptions.leaseMs ?? DEFAULT_CLOCK_LEASE_MS;
    this.clockTickIntervalMs = clockOptions.tickIntervalMs ?? DEFAULT_CLOCK_TICK_MS;
    this.timersEnabled = clockOptions.timersEnabled ?? true;
    this.pauseRunningClocksOnStartup();
  }

  private pauseRunningClocksOnStartup(): void {
    for (const summary of this.repository.listSaves(ownerId)) {
      let state = this.repository.loadSave(ownerId, summary.saveId).state;
      if (state.territory.survivalFire.protectionStatus === 'pending_opening_settlement') {
        state = this.persistSystemEvents(summary.saveId, current => {
          const openSequence = current.lastEventSequence + 1;
          return {
            state: {
              ...current,
              territory: { ...current.territory, survivalFire: { ...current.territory.survivalFire, protectionStatus: 'active' } },
              calendar: current.calendar.map(event => event.id === current.territory.survivalFire.protectionEventId
                ? { ...event, status: 'active', openReceiptSequence: openSequence }
                : event),
            },
            events: [{ type: 'opening_protection_started', occurredAtElapsedMs: current.simElapsedMs, payload: { eventId: current.territory.survivalFire.protectionEventId, expiresAtElapsedMs: current.territory.survivalFire.protectedThroughElapsedMs } }],
          };
        }).state;
      }
      if (state.clockControl.status !== 'running') continue;
      this.persistSystemEvents(summary.saveId, current => ({
        state: {
          ...current,
          clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' },
        },
        events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: current.simElapsedMs, payload: { policy: 'pause_on_restart' } }],
      }));
    }
  }

  private persistSystemEvents(saveId: string, transition: (state: GameState) => { state: GameState; events: readonly Omit<CommandEvent, 'sequence'>[] }) {
    return this.repository.commitSystemTransition({
      ownerId,
      saveId,
      transition: state => {
        const result = transition(state);
        const events = result.events.map((event, index) => ({ ...event, sequence: state.lastEventSequence + index + 1 }));
        return { state: bindCalendarReceipts(result.state, events), events };
      },
      projectPlayerEvent: (event, eventId) => this.projectSystemPlayerEvent(event, eventId),
    });
  }

  private driverStatus(saveId: string, state: Pick<GameState, 'simElapsedMs'>, sessionToken?: string, driverId?: string) {
    const driver = this.clockDrivers.get(saveId);
    if (!driver) return { driver: 'unclaimed' as const, catchingUp: false, targetSimElapsedMs: state.simElapsedMs, leaseRemainingMs: 0 };
    const leaseRemainingMs = Math.max(0, driver.lastHeartbeatMonoMs + this.clockLeaseMs - this.monotonicNow());
    const active = driver.sessionToken === sessionToken && driver.driverId === driverId && leaseRemainingMs > 0;
    return {
      driver: active ? 'active' as const : 'observing' as const,
      catchingUp: driver.targetSimElapsedMs > state.simElapsedMs,
      targetSimElapsedMs: Math.max(state.simElapsedMs, driver.targetSimElapsedMs),
      leaseRemainingMs,
    };
  }

  private projectView(state: GameState, sessionToken?: string, driverId?: string): PlayerView {
    return { ...projectPlayerView(state, this.world), clockStatus: this.driverStatus(state.saveId, state, sessionToken, driverId) };
  }

  private accumulateRealtime(driver: ClockDriver, state: GameState, untilMonoMs: number): void {
    const until = Math.max(driver.lastTickMonoMs, untilMonoMs);
    const elapsedRealMs = until - driver.lastTickMonoMs;
    driver.lastTickMonoMs = until;
    if (state.clockControl.status !== 'running' || elapsedRealMs <= 0) {
      if (state.clockControl.status !== 'running') {
        driver.targetSimElapsedMs = state.simElapsedMs;
        driver.fractionalSimMs = 0;
      }
      return;
    }
    const scaled = elapsedRealMs * state.clockControl.speedPermille / 1000 + driver.fractionalSimMs;
    const wholeMs = Math.floor(scaled);
    driver.fractionalSimMs = scaled - wholeMs;
    driver.targetSimElapsedMs = Math.max(driver.targetSimElapsedMs, state.simElapsedMs) + wholeMs;
  }

  private settleClockTarget(saveId: string, driver: ClockDriver): { state: GameState; caughtUp: boolean } {
    let persisted: GameState | null = null;
    if (driver.pendingState) {
      const currentRevision = this.repository.getSaveRevision(ownerId, saveId);
      if (driver.pendingBaseRevision === undefined || driver.pendingBaseRevision !== currentRevision) {
        driver.pendingState = undefined;
        driver.pendingEvents = undefined;
        driver.pendingBaseRevision = undefined;
        driver.pendingBaseSimElapsedMs = undefined;
      }
    }
    if (!driver.pendingState) {
      persisted = this.repository.loadSave(ownerId, saveId).state;
      // The immutable repository cache would otherwise pin the pre-catch-up
      // population while this private simulation builds its new chunk set.
      this.repository.releaseBotPopulationCache(saveId);
    }
    const before = driver.pendingState ?? persisted!;
    const baseRevision = driver.pendingBaseRevision ?? persisted!.revision;
    if (before.clockControl.status !== 'running' || driver.targetSimElapsedMs <= before.simElapsedMs) {
      if (!driver.pendingState) {
        driver.targetSimElapsedMs = persisted!.simElapsedMs;
        return { state: persisted!, caughtUp: true };
      }
    }
    const targetSimElapsedMs = Math.max(before.simElapsedMs, driver.targetSimElapsedMs);
    const blockerEvent = before.calendar
      .filter(event => event.status === 'scheduled' && event.opensAtMs <= targetSimElapsedMs
        && eventRuntimeReadiness(event.id) === 'mandatory_content_blocked')
      .sort((left, right) => left.opensAtMs - right.opensAtMs || before.calendar.indexOf(left) - before.calendar.indexOf(right))[0];
    const blockerPolicy = blockerEvent ? mandatoryEventBlocker(blockerEvent.id) : null;
    let advanced: ReturnType<typeof advanceTo>;
    try {
      advanced = advanceTo(before, targetSimElapsedMs, {
        maxWorkMs: CLOCK_SIMULATION_SLICE_MS,
        deferBotPopulationCommit: true,
        mutatePrivateState: Boolean(driver.pendingState),
        stopCondition: before.clockControl.stopCondition as StopCondition,
        stopBeforeEvent: blockerEvent && blockerPolicy ? {
          eventId: blockerEvent.id,
          reasonCode: blockerPolicy.reasonCode,
          playerMessage: blockerPolicy.playerMessage,
        } : undefined,
      }, this.world);
    } catch (error) {
      // A failed private in-place slice cannot be resumed safely. Discard it and
      // let the next tick retry from the last committed save revision.
      driver.pendingState = undefined;
      driver.pendingEvents = undefined;
      driver.pendingBaseRevision = undefined;
      driver.pendingBaseSimElapsedMs = undefined;
      throw error;
    }
    // Bot decisions stay in the population chunks. Preserve public events across bounded
    // slices, then commit the resulting save revision and chunk set atomically once caught up.
    const events = driver.pendingEvents ?? [];
    events.push(...advanced.events.filter(event => (!event.type.startsWith('bot_') || event.type === 'bot_raid_player_attack')
      && event.type !== 'simulation_time_advanced'));
    if (advanced.stoppedBy) {
      advanced.state.clockControl = { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' };
      events.push({ type: 'clock_paused_on_stop_condition', occurredAtElapsedMs: advanced.state.simElapsedMs, payload: { stopCondition: advanced.stoppedBy } });
    }
    driver.pendingBaseRevision ??= baseRevision;
    driver.pendingBaseSimElapsedMs ??= persisted?.simElapsedMs ?? before.simElapsedMs;
    driver.pendingState = advanced.state;
    driver.pendingEvents = events;
    const caughtUp = advanced.caughtUp || advanced.stoppedBy !== null;
    if (!caughtUp) return { state: advanced.state, caughtUp: false };

    if (events.length === 0 && advanced.state.simElapsedMs > driver.pendingBaseSimElapsedMs) {
      events.push({ type: 'simulation_time_advanced', occurredAtElapsedMs: advanced.state.simElapsedMs, payload: {
        fromElapsedMs: driver.pendingBaseSimElapsedMs, toElapsedMs: advanced.state.simElapsedMs,
      } });
    }
    const committed = this.persistSystemEvents(saveId, state => {
      if (state.revision !== driver.pendingBaseRevision) throw new Error('CLOCK_CATCH_UP_STATE_CHANGED');
      return { state: advanced.state, events };
    });
    driver.pendingState = undefined;
    driver.pendingEvents = undefined;
    driver.pendingBaseRevision = undefined;
    driver.pendingBaseSimElapsedMs = undefined;
    driver.targetSimElapsedMs = committed.state.clockControl.status === 'paused'
      ? committed.state.simElapsedMs
      : Math.max(driver.targetSimElapsedMs, committed.state.simElapsedMs);
    return { state: committed.state, caughtUp: true };
  }

  private clearDriverTimer(driver: ClockDriver): void {
    if (driver.timer) clearInterval(driver.timer);
    driver.timer = null;
  }

  private ensureDriverTimer(saveId: string, driver: ClockDriver, state: GameState): void {
    if (!this.timersEnabled || state.clockControl.status !== 'running' || driver.timer) return;
    driver.timer = setInterval(() => { void this.tickClock(saveId).catch(() => undefined); }, this.clockTickIntervalMs);
    driver.timer.unref?.();
  }

  private pausePersistedClock(saveId: string, reason: 'clock_paused_after_lease_expired' | 'clock_paused_on_shutdown'): GameState {
    const result = this.persistSystemEvents(saveId, state => state.clockControl.status !== 'running'
      ? { state, events: [] }
      : {
        state: { ...state, clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' } },
        events: [{ type: reason, occurredAtElapsedMs: state.simElapsedMs, payload: { policy: reason } }],
      });
    return result.state;
  }

  private async inSaveQueue<T>(saveId: string, work: () => T | Promise<T>): Promise<Awaited<T>> {
    const previous = this.commandQueues.get(saveId) ?? Promise.resolve();
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.catch(() => undefined).then(() => gate);
    this.commandQueues.set(saveId, tail);
    await previous.catch(() => undefined);
    try { return await work() as Awaited<T>; }
    finally {
      release();
      if (this.commandQueues.get(saveId) === tail) {
        await tail;
        if (this.commandQueues.get(saveId) === tail) this.commandQueues.delete(saveId);
      }
    }
  }

  private async tickClock(saveId: string, scheduleCatchUp = true): Promise<void> {
    const driver = this.clockDrivers.get(saveId);
    if (!driver || driver.isTicking) return;
    driver.isTicking = true;
    let settledState: GameState | undefined;
    try {
      await this.inSaveQueue(saveId, () => {
        const now = this.monotonicNow();
        const leaseExpiry = driver.lastHeartbeatMonoMs + this.clockLeaseMs;
        // Pending catch-up state is private to this process until the final atomic
        // commit. Avoid rebuilding and hashing the persisted aggregate on every slice.
        const state = driver.pendingState ?? this.repository.loadSave(ownerId, saveId).state;
        this.accumulateRealtime(driver, state, Math.min(now, leaseExpiry));
        const settled = this.settleClockTarget(saveId, driver);
        settledState = settled.state;
        driver.lastProgressSimElapsedMs = settled.state.simElapsedMs;
        const expired = now >= leaseExpiry;
        if (expired && settled.caughtUp) {
          const paused = this.pausePersistedClock(saveId, 'clock_paused_after_lease_expired');
          this.clearDriverTimer(driver);
          if (this.clockDrivers.get(saveId) === driver) this.clockDrivers.delete(saveId);
          driver.targetSimElapsedMs = paused.simElapsedMs;
        } else if (settled.state.clockControl.status !== 'running') {
          this.clearDriverTimer(driver);
        } else {
          this.ensureDriverTimer(saveId, driver, settled.state);
        }
      });
    } finally {
      driver.isTicking = false;
    }
    if (scheduleCatchUp && settledState?.clockControl.status === 'running'
      && this.clockDrivers.get(saveId) === driver && driver.targetSimElapsedMs > settledState.simElapsedMs) {
      setImmediate(() => { void this.tickClock(saveId).catch(() => undefined); });
    }
  }

  async heartbeatClock(saveId: string, sessionToken: string, driverId: string) {
    if (!sessionToken || !driverId || driverId.length > 160) throw new ApiProblem(400, 'INVALID_COMMAND', 'The clock driver identity is invalid.', 'Danh tính điều khiển thời gian không hợp lệ.');
    return this.inSaveQueue(saveId, async () => {
      const now = this.monotonicNow();
      let current = this.clockDrivers.get(saveId);
      if (current && now < current.lastHeartbeatMonoMs + this.clockLeaseMs
        && (current.sessionToken !== sessionToken || current.driverId !== driverId)) {
        const state = this.repository.loadSave(ownerId, saveId).state;
        return { ...this.driverStatus(saveId, state, sessionToken, driverId), sessionTokenIsDriver: false };
      }
      if (current && now >= current.lastHeartbeatMonoMs + this.clockLeaseMs) {
        const expiry = current.lastHeartbeatMonoMs + this.clockLeaseMs;
        const oldState = this.repository.loadSave(ownerId, saveId).state;
        this.accumulateRealtime(current, oldState, expiry);
        let settled = this.settleClockTarget(saveId, current);
        while (!settled.caughtUp && settled.state.clockControl.status === 'running') {
          await new Promise<void>(resolve => setImmediate(resolve));
          settled = this.settleClockTarget(saveId, current);
        }
        this.pausePersistedClock(saveId, 'clock_paused_after_lease_expired');
        this.clearDriverTimer(current);
        current = undefined;
        this.clockDrivers.delete(saveId);
      } else if (current) {
        // Renew a healthy owner without deserializing all 1,023 bot rows on
        // every heartbeat. The timer is installed on selection/speed changes.
        current.lastHeartbeatMonoMs = now;
        return {
          ...this.driverStatus(saveId, { simElapsedMs: current.lastProgressSimElapsedMs }, sessionToken, driverId),
          sessionTokenIsDriver: true,
        };
      }
      if (!current) {
        const state = this.repository.loadSave(ownerId, saveId).state;
        current = {
          sessionToken,
          driverId,
          lastHeartbeatMonoMs: now,
          lastTickMonoMs: now,
          targetSimElapsedMs: state.simElapsedMs,
          lastProgressSimElapsedMs: state.simElapsedMs,
          fractionalSimMs: 0,
          timer: null,
          isTicking: false,
        };
        this.clockDrivers.set(saveId, current);
      }
      const state = this.repository.loadSave(ownerId, saveId).state;
      this.ensureDriverTimer(saveId, current, state);
      return { ...this.driverStatus(saveId, state, sessionToken, driverId), sessionTokenIsDriver: true };
    });
  }

  async settleClockBeforeCommand(saveId: string): Promise<void> {
    const driver = this.clockDrivers.get(saveId);
    if (!driver) return;
    while (this.clockDrivers.get(saveId) === driver) {
      const progressBefore = driver.lastProgressSimElapsedMs;
      const targetBefore = driver.targetSimElapsedMs;
      await this.tickClock(saveId, false);
      if (driver.isTicking) {
        await new Promise<void>(resolve => setImmediate(resolve));
        continue;
      }
      const progressAfter = driver.lastProgressSimElapsedMs;
      if (!driver.pendingState && driver.targetSimElapsedMs <= progressAfter) return;
      if (!driver.pendingState && progressAfter <= progressBefore && driver.targetSimElapsedMs <= targetBefore) {
        throw new Error('CLOCK_CATCH_UP_STALLED');
      }
      await new Promise<void>(resolve => setImmediate(resolve));
    }
  }

  async shutdownClockDrivers(): Promise<void> {
    for (const [saveId, driver] of this.clockDrivers) {
      this.clearDriverTimer(driver);
      const persisted = this.repository.loadSave(ownerId, saveId).state;
      const state = driver.pendingState ?? persisted;
      this.accumulateRealtime(driver, state, Math.min(this.monotonicNow(), driver.lastHeartbeatMonoMs + this.clockLeaseMs));
      let settled = this.settleClockTarget(saveId, driver);
      while (!settled.caughtUp && settled.state.clockControl.status === 'running') {
        await new Promise<void>(resolve => setImmediate(resolve));
        settled = this.settleClockTarget(saveId, driver);
      }
      this.pausePersistedClock(saveId, 'clock_paused_on_shutdown');
    }
    this.clockDrivers.clear();
  }

  health(): { status: 'ready'; apiVersion: 1; contentVersion: string; storage: 'sqlite' } {
    return { status: 'ready', apiVersion: 1, contentVersion: this.world.contentVersion, storage: 'sqlite' };
  }

  createSave(input: unknown): { created: boolean; save: SaveSummary; view: PlayerView } {
    const body = parseCreateSaveRequest(input);
    if (!body) throw new ApiProblem(400, 'INVALID_COMMAND', 'The save creation request is invalid.', 'Thông tin tạo lượt lưu không hợp lệ.');
    const requestSha256 = canonicalStateHash(body);
    try {
      const result = this.repository.createSaveIdempotent({
        ownerId,
        creationKey: body.creationKey,
        requestSha256,
        slotName: body.slotName,
        makeState: () => createNewGame({
          saveId: randomUUID(),
          campaignId: randomUUID(),
          soulId: 'LI_LAN',
          worldPackageId: this.world.id,
          rulesetVersion: RULESET_VERSION,
          contentVersion: CONTENT_VERSION,
          seed: randomBytes(32).toString('hex'),
        }, this.world),
      });
      const initialSettlement = result.created && result.state.territory.survivalFire.protectionStatus === 'pending_opening_settlement'
        ? this.persistSystemEvents(result.state.saveId, state => {
          const openSequence = state.lastEventSequence + 1;
          return {
            state: {
              ...state,
              territory: { ...state.territory, survivalFire: { ...state.territory.survivalFire, protectionStatus: 'active' } },
              calendar: state.calendar.map(event => event.id === state.territory.survivalFire.protectionEventId
                ? { ...event, status: 'active', openReceiptSequence: openSequence }
                : event),
            },
            events: [{ type: 'opening_protection_started', occurredAtElapsedMs: 0, payload: { eventId: 'EV00-SAFE-FIRE', expiresAtElapsedMs: 144 * 60 * 60 * 1000 } }],
          };
        })
        : null;
      const state = initialSettlement?.state ?? result.state;
      return { created: result.created, save: initialSettlement?.summary ?? result.summary, view: this.projectView(state) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  listSaves(): SaveSummary[] {
    try { return this.repository.listSaves(ownerId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  /** Select/renew a save without deserializing the entire bot population or projecting the player view. */
  saveMetadata(saveId: string): { revision: number; lastEventSequence: number } {
    try { return this.repository.getSaveMetadata(ownerId, saveId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  loadSave(saveId: string, sessionToken?: string, driverId?: string): { state: GameState; summary: SaveSummary; view: PlayerView } {
    try {
      const result = this.repository.loadSave(ownerId, saveId);
      return { ...result, view: this.projectView(result.state, sessionToken, driverId) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  preview(saveId: string, input: unknown, sessionToken?: string, driverId?: string) {
    const loaded = this.loadSave(saveId, sessionToken, driverId);
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    if (validation.data.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    const isClockCommand = validation.data.type === 'set_clock_speed' || validation.data.type === 'advance_to_boundary';
    const availability = isClockCommand && this.driverStatus(saveId, loaded.state, sessionToken, driverId).driver !== 'active'
      ? { actionId: validation.data.type, enabled: false, reasonCode: 'CLOCK_DRIVER_BUSY', requirements: ['This tab does not own the active clock lease.'] }
      : previewCommand(loaded.state, validation.data, this.world, {
        allowSystemOnlyRevisionAdvance: isClockCommand && systemOnlyRevisionAdvance(loaded.state, validation.data.expectedRevision),
      });
    return { revision: loaded.state.revision, availability, estimate: null as null };
  }

  async executeCommand(saveId: string, input: unknown, actor?: { sessionToken: string; driverId: string }): Promise<{ receipt: CommandReceipt; revision: number; view: PlayerView }> {
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    const command: CommandEnvelope = validation.data;
    if (command.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    if ((command.type === 'set_clock_speed' || command.type === 'advance_to_boundary')
      && (!actor || this.driverStatus(saveId, this.repository.loadSave(ownerId, saveId).state, actor.sessionToken, actor.driverId).driver !== 'active')) {
      throw new ApiProblem(409, 'CLOCK_DRIVER_BUSY', 'Another selected session owns this save clock lease.', 'Phiên khác đang điều khiển thời gian của lượt lưu này.');
    }
    await this.settleClockBeforeCommand(saveId);
    const requestSha256 = canonicalStateHash(command);
    return this.inSaveQueue(saveId, () => {
      try {
        const result = this.repository.commitCommand({
          ownerId,
          saveId,
          command,
          requestSha256,
          reduce: state => reduceCommand(state, command, this.world, {
            allowSystemOnlyRevisionAdvance: (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary')
              && systemOnlyRevisionAdvance(state, command.expectedRevision),
          }),
          projectPlayerEvent: (event, eventId, state) => this.projectPlayerEvent(event, eventId, state),
        });
        if (result.kind === 'idempotency_conflict') {
          throw new ApiProblem(409, 'COMMAND_ID_REUSED', 'A command ID cannot be reused with a different request.', 'Mã lệnh đã được dùng với nội dung khác.');
        }
        if (!result.receipt) throw new ApiProblem(500, 'INTERNAL_ERROR', 'The command result is unavailable.', 'Đã xảy ra lỗi máy chủ.');
        if (!result.receipt.accepted) throw this.commandProblem(result.receipt, result.summary.revision);
        if (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary') {
          const driver = this.clockDrivers.get(saveId);
          if (driver && actor && driver.sessionToken === actor.sessionToken && driver.driverId === actor.driverId) {
            driver.lastTickMonoMs = this.monotonicNow();
            driver.lastHeartbeatMonoMs = this.monotonicNow();
            driver.targetSimElapsedMs = result.state.simElapsedMs;
            driver.lastProgressSimElapsedMs = result.state.simElapsedMs;
            driver.fractionalSimMs = 0;
            if (result.state.clockControl.status === 'running') this.ensureDriverTimer(saveId, driver, result.state);
            else this.clearDriverTimer(driver);
          }
        }
        return { receipt: result.receipt, revision: result.summary.revision, view: this.projectView(result.state, actor?.sessionToken, actor?.driverId) };
      } catch (error) {
        if (error instanceof ApiProblem) throw error;
        throw fromRepositoryError(error);
      }
    });
  }

  getCommand(saveId: string, commandId: string): { receipt: CommandReceipt; currentRevision: number } {
    try {
      const { receipt, currentRevision } = this.repository.getCommandReceipt(ownerId, saveId, commandId);
      return { receipt, currentRevision };
    }
    catch (error) { throw fromRepositoryError(error); }
  }

  playerEvents(saveId: string, afterSequence: number, limit: number) {
    try {
      const result = this.repository.getPlayerEvents(ownerId, saveId, afterSequence, limit);
      const events = result.events as PlayerEvent[];
      const hasMore = events.length > limit;
      const page = events.slice(0, limit);
      return {
        events: page,
        afterSequence,
        nextSequence: page.at(-1)?.sequence ?? afterSequence,
        hasMore,
      };
    } catch (error) { throw fromRepositoryError(error); }
  }

  createCheckpoint(saveId: string, label: string): CheckpointSummary {
    try { return this.repository.createCheckpoint(ownerId, saveId, label); }
    catch (error) { throw fromRepositoryError(error); }
  }

  listCheckpoints(saveId: string): CheckpointSummary[] {
    try { return this.repository.listCheckpoints(ownerId, saveId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  restoreCheckpoint(saveId: string, checkpointId: string, slotName: string): { save: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
    try {
      const result = this.repository.forkCheckpoint(ownerId, saveId, checkpointId, slotName, randomUUID());
      return { save: result.summary, view: this.projectView(result.state) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  exportBackup(saveId: string): BackupEnvelope {
    try {
      const backup = this.repository.exportBackup(ownerId, saveId);
      if (backup.receipts.length > MAX_BACKUP_ROWS || backup.events.length > MAX_BACKUP_ROWS
        || backup.checkpoints.length > MAX_BACKUP_CHECKPOINTS || Buffer.byteLength(JSON.stringify(backup), 'utf8') > MAX_BACKUP_BYTES) {
        throw new ApiProblem(413, 'PAYLOAD_TOO_LARGE', 'This save exceeds the backup export limits.', 'Lượt lưu vượt quá giới hạn xuất bản sao lưu.');
      }
      return backup;
    } catch (error) {
      if (error instanceof ApiProblem) throw error;
      throw fromRepositoryError(error);
    }
  }

  importBackup(input: unknown, slotName: string): { save: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
    if (!isNonEmptyString(slotName, 80)) throw new ApiProblem(400, 'INVALID_COMMAND', 'The import slot name is invalid.', 'Tên ô lưu không hợp lệ.');
    const sourceBackup = validateBackup(input, this.world);
    const newSaveId = randomUUID();
    const state = structuredClone(sourceBackup.state) as GameState;
    state.saveId = newSaveId;
    const events = (sourceBackup.events as Array<Record<string, unknown>>).map(event => {
      const eventSequence = Number(event.eventSequence);
      const eventId = `${newSaveId}:event:${String(eventSequence).padStart(12, '0')}`;
      const playerEvent = structuredClone(event.playerEvent) as Record<string, unknown>;
      playerEvent.eventId = eventId;
      return { ...event, eventId, playerEvent };
    });
    const checkpoints = (sourceBackup.checkpoints as Array<Record<string, unknown>>).map(checkpoint => {
      const checkpointState = structuredClone(checkpoint.state) as GameState;
      checkpointState.saveId = newSaveId;
      return {
        ...checkpoint,
        checkpointId: randomUUID(),
        saveId: newSaveId,
        state: checkpointState,
        stateSha256: canonicalStateHash(checkpointState),
      };
    });
    const backup: BackupEnvelope = {
      ...sourceBackup,
      save: { ...sourceBackup.save, saveId: newSaveId, slotName: slotName.trim(), forkedFrom: null },
      state,
      stateSha256: canonicalStateHash(state),
      events,
      checkpoints,
    };
    try {
      const result = this.repository.importBackup(ownerId, slotName.trim(), backup);
      return { save: result.summary, view: this.projectView(result.state) };
    } catch (error) {
      if (error instanceof ApiProblem) throw error;
      if (error instanceof RepositoryError && error.code === 'SAVE_ID_EXISTS') {
        throw new ApiProblem(409, 'BACKUP_INVALID', 'A save with this ID already exists; import never overwrites.', 'Lượt lưu hiện có không bị ghi đè.');
      }
      throw fromRepositoryError(error);
    }
  }

  private projectPlayerEvent(event: CommandEvent, eventId: string, state: GameState): PlayerEvent {
    if (event.type === 'known_entity_inspected') {
      const payloadRef = event.payload.entity;
      const known = isRecord(payloadRef) && typeof payloadRef.id === 'string' && (
        payloadRef.type === 'site' && state.playerKnowledge.knownSiteIds.includes(payloadRef.id)
        || payloadRef.type === 'resource' && state.playerKnowledge.knownResourceIds.includes(payloadRef.id)
        || payloadRef.type === 'cache' && (state.playerKnowledge.knownSignalIds.includes(payloadRef.id) || state.playerKnowledge.knownChestIds.includes(payloadRef.id))
        || payloadRef.type === 'route' && state.playerKnowledge.knownRouteIds.includes(payloadRef.id)
        || payloadRef.type === 'unit' && state.ownedUnits.some(unit => unit.id === payloadRef.id)
        || payloadRef.type === 'corpse' && (state.playerKnowledge.knownCorpseIds ?? []).includes(payloadRef.id)
        || payloadRef.type === 'bot' && (state.playerKnowledge.knownBotIds ?? []).includes(payloadRef.id)
        || payloadRef.type === 'item' && state.inventory.containers.some(container => container.observed && container.stacks.some(stack => stack.itemId === payloadRef.id))
      );
      if (!known) {
        throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'An inspection event cannot be exposed to the player.', 500);
      }
      const isSignal = payloadRef.type === 'cache' && event.payload.discovery === 'identified';
      return {
        sequence: event.sequence,
        eventId,
        type: event.type,
        category: isSignal ? 'exploration' : 'inspection',
        title: isSignal ? 'Field signal identified' : 'Known entity inspected',
        text: isSignal ? 'The discovered field signal was identified. Its marker now shows the exact chest.' : 'The known entity details were inspected.',
      };
    }
    if (event.type === 'starter_container_inspected') {
      const container = state.inventory.containers.find(item => item.id === event.payload.containerId && item.observed);
      if (!container || !['carried_bag', 'territory_supply'].includes(container.kind)) throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'A hidden container event cannot be exposed to the player.', 500);
      const bag = container.kind === 'carried_bag';
      return { sequence: event.sequence, eventId, type: event.type, category: 'inventory', title: bag ? 'Carried bag inspected' : 'Supply chest inspected', text: bag ? 'The carried food bag contents are now known.' : 'The territory supply chest contents are now known.' };
    }
    if (event.type === 'career_card_inspected') {
      if (!state.playerKnowledge.careerCardObserved || state.player.career.state !== 'unemployed_card_sealed') {
        throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'A sealed career event cannot be exposed to the player.', 500);
      }
      return { sequence: event.sequence, eventId, type: event.type, category: 'character', title: 'Đã kiểm tra thẻ chuyển nghề', text: 'Nội dung thẻ đã được tiết lộ; chức nghiệp vẫn chưa được kích hoạt.' };
    }
    const description = this.describeTimeOrTombEvent(event);
    if (description) return { sequence: event.sequence, eventId, type: event.type, ...description };
    throw new RepositoryError('PLAYER_EVENT_TYPE_UNSUPPORTED', 'This event has no player-safe projection.', 500);
  }

  private projectSystemPlayerEvent(event: CommandEvent, eventId: string): PlayerEvent {
    if (event.type === 'bot_raid_player_attack') {
      if (typeof event.payload.attackerId !== 'string' || typeof event.payload.result !== 'string') {
        throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'A bot attack event is missing its public summary.', 500);
      }
      return {
        sequence: event.sequence,
        eventId,
        type: event.type,
        category: 'combat',
        title: 'Settlement raid reached Lí Lan',
        text: event.payload.result === 'retreated' ? 'The settlement raiders were driven away.' : 'A settlement raid reached the territory; supplies and defenses were affected.',
      };
    }
    const description = this.describeTimeOrTombEvent(event);
    if (!description) throw new RepositoryError('PLAYER_EVENT_TYPE_UNSUPPORTED', 'This system event has no player-safe projection.', 500);
    return { sequence: event.sequence, eventId, type: event.type, ...description };
  }

  private describeTimeOrTombEvent(event: CommandEvent): Pick<PlayerEvent, 'category' | 'title' | 'text'> | null {
    const events: Readonly<Record<string, Pick<PlayerEvent, 'category' | 'title' | 'text'>>> = {
      clock_speed_changed: { category: 'time', title: 'Đã đổi tốc độ thời gian', text: `Tốc độ: ${String(event.payload.selection)}.` },
      clock_stop_condition_set: { category: 'time', title: 'Đã đặt điều kiện dừng', text: `Máy chủ sẽ dừng khi đạt ${String(event.payload.stopCondition)}.` },
      clock_paused_after_restart: { category: 'time', title: 'Đồng hồ đã dừng sau khi khởi động lại', text: 'Chính sách phiên bản đầu tiên dừng thời gian khi máy chủ khởi động lại.' },
      clock_paused_after_lease_expired: { category: 'time', title: 'Đồng hồ đã dừng', text: 'Nhịp giữ quyền điều khiển đã hết hạn; thời gian được tạm dừng.' },
      clock_paused_on_shutdown: { category: 'time', title: 'Đồng hồ đã dừng khi máy chủ đóng', text: 'Thời gian được tạm dừng trước khi máy chủ đóng.' },
      clock_paused_on_stop_condition: { category: 'time', title: 'Đồng hồ đã dừng theo điều kiện', text: event.payload.stopCondition === 'event_content_blocked'
        ? 'Tiến trình đã dừng tại mốc sự kiện cần luật chưa được triển khai.'
        : `Đã đạt điều kiện ${String(event.payload.stopCondition)}.` },
      event_calendar_opened: { category: 'event', title: 'Một sự kiện đã mở', text: String(event.payload.displayName ?? 'Sự kiện đã mở theo lịch thế giới.') },
      event_calendar_locked: { category: 'event', title: 'Sự kiện đã khóa ghi nhận', text: `${String(event.payload.displayName ?? 'Sự kiện')} đã đến hạn khóa.` },
      event_calendar_resolved: { category: 'event', title: 'Mốc sự kiện đã quyết toán', text: `${String(event.payload.displayName ?? 'Sự kiện')} đã kết thúc. Không tự cấp phần thưởng khi thiếu kết quả hợp lệ.` },
      event_objective_progressed: { category: 'event', title: 'Mục tiêu sự kiện đã tăng', text: `${String(event.payload.eventId)} · tiến độ ${String(event.payload.objectiveProgress)}/${String(event.payload.target)} · điểm +${String(event.payload.scoreDelta)}.` },
      event_objective_settled: { category: 'event', title: 'Đã chốt mục tiêu sự kiện', text: `${String(event.payload.eventId)} · kết quả ${String(event.payload.outcome)} · phần thưởng ${String(event.payload.rewardKrona)} Krona.` },
      event_choice_made: { category: 'event', title: 'Đã ghi lựa chọn chiến dịch', text: `${String(event.payload.eventId)} · con đường ${String(event.payload.choiceId)}.` },
      event_shop_purchase_committed: { category: 'event', title: 'Đã mua trong cửa hàng sự kiện', text: `${String(event.payload.quantity)} ${String(event.payload.itemTemplateId)} · ${String(event.payload.scoreCost)} điểm · còn ${String(event.payload.stockRemaining)} trong kho.` },
      event_inventory_expired: { category: 'event', title: 'Vật phẩm sự kiện đã hết hạn', text: `${String(event.payload.eventId)} · vật phẩm gắn với sự kiện đã bị loại khỏi kho khi kết thúc.` },
      event_reward_claimed: { category: 'event', title: 'Đã nhận thưởng sự kiện', text: `${String(event.payload.amount)} ${String(event.payload.currencyId)} từ ${String(event.payload.eventId)}.` },
      event_reward_claim_expired: { category: 'event', title: 'Hết hạn nhận thưởng sự kiện', text: `Thời hạn nhận thưởng của ${String(event.payload.eventId)} đã kết thúc.` },
      event_rank_settlement_blocked: { category: 'event', title: 'Legacy opening settlement held', text: 'A prior version kept this opening result blocked; current settlements use committed completion receipts and preserve the saved historical result.' },
      opening_rival_action_committed: { category: 'ranking', title: 'Đối thủ đã hoàn tất một hành động', text: `${String(event.payload.contenderId)} · ${String(event.payload.action)} · ${String(event.payload.result)} · +${String(event.payload.xpAwarded)} XP · Cấp ${String(event.payload.levelAfter)}.` },
      event_rank_settled: { category: 'ranking', title: 'Bảng Cấp đã khóa kết quả', text: `${String(event.payload.resultRows)} hàng đủ điều kiện đã được xếp theo thời điểm hoàn thành; hạng của Lí Lan: ${String(event.payload.playerRank ?? 'chưa đủ điều kiện')}.` },
      opening_rank_reward_claimed: { category: 'reward', title: 'Đã nhận thưởng Bảng Cấp', text: `Hạng ${String(event.payload.rank)} · ${String(event.payload.rewardBandId)} · ${Array.isArray(event.payload.items) ? event.payload.items.length : 0} loại vật phẩm đã giao.` },
      mandatory_event_blocked: { category: 'event', title: 'Tiến trình sự kiện đang tạm dừng', text: 'Luật cho sự kiện kế tiếp chưa được triển khai. Tiến trình đã dừng an toàn và lưu game được giữ nguyên.' },
      simulation_time_advanced: { category: 'time', title: 'Thời gian mô phỏng đã tiến', text: `T+${String(event.payload.toElapsedMs ?? event.occurredAtElapsedMs)} ms.` },
      simulation_hour_settled: { category: 'time', title: 'Đã quyết toán một giờ mô phỏng', text: 'Các mốc giờ được quyết toán theo thứ tự máy chủ.' },
      world_day_started: { category: 'time', title: 'Bắt đầu ngày mới', text: `Ngày ${String(event.payload.day)} theo giờ thế giới.` },
      world_sunset: { category: 'time', title: 'Mặt trời lặn', text: 'Ánh sáng ngày chuyển sang chạng vạng.' },
      world_night_started: { category: 'time', title: 'Bắt đầu ban đêm', text: 'Chạng vạng kết thúc lúc 17:00.' },
      world_dawn: { category: 'time', title: 'Bình minh', text: 'Ngày mới bắt đầu lúc 07:00.' },
      opening_protection_expired: { category: 'survival', title: 'Hết thời hạn bảo hộ mở đầu', text: 'Bảo hộ mở đầu đã hết hạn sau 144 giờ mô phỏng.' },
      opening_protection_started: { category: 'survival', title: 'Bảo hộ mở đầu đã bắt đầu', text: 'EV00-SAFE-FIRE bảo vệ lãnh địa trong 144 giờ mô phỏng.' },
      cold_warning_changed: { category: 'survival', title: 'Mức tải lạnh đã đổi', text: `ColdLoad: ${String(event.payload.coldLoad)}.` },
      cold_danger_reached: { category: 'survival', title: 'Đạt ngưỡng nguy hiểm do lạnh', text: `ColdLoad: ${String(event.payload.coldLoad)}.` },
      fire_fuel_consumed: { category: 'survival', title: 'Lửa đã tiêu thụ gỗ', text: `Còn ${String(event.payload.remaining)} đơn vị gỗ đã cấp.` },
      survival_fire_extinguished: { category: 'survival', title: 'Lửa đã tắt', text: `Nguyên nhân: ${String(event.payload.reason)}.` },
      fire_refuelled: { category: 'survival', title: 'Đã cấp thêm nhiên liệu', text: `Đã chuyển ${String(event.payload.quantity)} gỗ vào bếp lửa.` },
      survival_fire_lit: { category: 'survival', title: 'Đã nhóm lửa', text: 'Lửa dùng lượng gỗ đã được cấp.' },
      tomb_job_queued: { category: 'tomb', title: 'Đã thêm vào hàng đợi Mộ', text: 'Một đầu ra Cương Thi tiêu chuẩn Bậc 0 đã được xếp hàng.' },
      tomb_job_started: { category: 'tomb', title: 'Mộ bắt đầu sản xuất', text: `Ô ${String(event.payload.slotId)} đã dành 1 Tử Khí cho đầu ra.` },
      tomb_job_blocked: { category: 'tomb', title: 'Sản xuất Mộ đang chờ', text: 'Hàng đợi cần Tử Khí trước khi có thể bắt đầu.' },
      tomb_job_cancelled: { category: 'tomb', title: 'Đã hủy việc chưa bắt đầu', text: 'Đầu vào chưa được đặt trước nên không có Tử Khí được hoàn lại.' },
      tomb_unit_completed: { category: 'tomb', title: 'Mộ hoàn tất một Cương Thi', text: `Đơn vị ${String(event.payload.unitId)} đã được thêm vào quân lực.` },
      tomb_death_qi_refilled: { category: 'tomb', title: 'Tử Khí đã hồi phục lúc nửa đêm', text: `${String(event.payload.current)}/${String(event.payload.capacity)} Tử Khí.` },
      movement_order_started: { category: 'travel', title: 'Travel started', text: `${(Number(event.payload.distanceMm) / 1_000_000).toFixed(2)} km planned · ${event.payload.uncertainty === true ? 'route uncertain' : 'known route'}.` },
      movement_order_completed: { category: 'travel', title: 'Travel completed', text: `${(Number(event.payload.distanceMm) / 1_000_000).toFixed(2)} km travelled.` },
      movement_order_cancelled: { category: 'travel', title: 'Travel cancelled', text: 'Travel stopped at the actor’s current position.' },
      spatial_search_started: { category: 'exploration', title: 'Area search started', text: 'The assigned squad began its area sweep.' },
      spatial_search_tick_settled: { category: 'exploration', title: 'Search sweep settled', text: `${Number(event.payload.grossAreaM2).toFixed(1)} m² swept in this 15-minute tick.` },
      spatial_search_completed: { category: 'exploration', title: 'Search completed', text: 'The planned search lane was completed.' },
      wildlife_group_discovered: { category: 'exploration', title: 'Wildlife group discovered', text: `${String(event.payload.observedCount)} ${String(event.payload.speciesId)} individual(s) identified at a known location.` },
      wildlife_group_depleted: { category: 'combat', title: 'Wildlife group depleted', text: `The finite group ${String(event.payload.groupId)} has no remaining animals.` },
      wildlife_population_replenished: { category: 'wildlife', title: 'Wildlife population replenished', text: `${String(event.payload.amount)} member(s) returned to group ${String(event.payload.groupId)} under the regional regeneration rule.` },
      spatial_search_cancelled: { category: 'exploration', title: 'Search cancelled', text: 'The search stopped at the observer’s current position.' },
      chest_signal_detected: { category: 'exploration', title: 'Buried signal detected', text: 'A buried signal was detected in the swept lane.' },
      chest_opened: { category: 'exploration', title: 'Chest opened', text: `${String(event.payload.rarity)} ${String(event.payload.chestType)} chest opened; its compiled rarity and type table was committed.` },
      chest_loot_delivered: { category: 'inventory', title: 'Chest rewards delivered', text: 'The committed reward stacks were added to the actor’s inventory.' },
      harvest_job_started: { category: 'logistics', title: 'Harvest trip started', text: `Reserved ${String(event.payload.quantity)} units of ${String(event.payload.materialId)} for a round trip.` },
      harvest_arrived_at_workfront: { category: 'logistics', title: 'Arrived at resource', text: 'The worker reached the resource and began gathering.' },
      resource_extracted: { category: 'logistics', title: 'Resource gathered', text: `${String(event.payload.quantity)} ${String(event.payload.materialId)} unit(s) gathered.` },
      harvest_work_completed: { category: 'logistics', title: 'Gathering completed', text: `${String(event.payload.quantity)} ${String(event.payload.materialId)} unit(s) loaded for return.` },
      harvest_job_blocked: { category: 'logistics', title: 'Harvest trip blocked', text: `The trip stopped: ${String(event.payload.reason)}.` },
      harvest_cargo_returned: { category: 'logistics', title: 'Cargo returned', text: `${String(event.payload.quantity)} resource unit(s) returned to the carried bag.` },
      harvest_job_cancelled: { category: 'logistics', title: 'Harvest trip cancelled', text: `${String(event.payload.extractedQuantity)} gathered unit(s) remain in the carried bag.` },
      inventory_item_transferred: { category: 'logistics', title: 'Inventory transferred', text: `${String(event.payload.quantity)} item unit(s) transferred between accessible containers.` },
      inventory_stack_split: { category: 'inventory', title: 'Stack split', text: `${String(event.payload.quantity)} ${String(event.payload.templateId)} units moved into a separate stack; total quantity is unchanged.` },
      inventory_stacks_merged: { category: 'inventory', title: 'Stacks merged', text: `${String(event.payload.quantity)} compatible units now share one stack.` },
      inventory_food_consumed: { category: 'inventory', title: 'Food consumed', text: `${String(event.payload.quantity)} ${String(event.payload.templateId)} consumed (${String(event.payload.foodUnits)} food units).` },
      lord_house_repair_started: { category: 'construction', title: 'Lord House repair started', text: '20 WOOD and 10 STONE are reserved; the required stone hammer is reserved for the assigned worker.' },
      construction_job_started: { category: 'construction', title: 'Construction started', text: `${String(event.payload.workUnitsRequired)} WU are assigned to ${String(event.payload.blueprintId)}; listed materials are reserved.` },
      construction_workers_reassigned: { category: 'construction', title: 'Construction workforce updated', text: `${Array.isArray(event.payload.workerIds) ? event.payload.workerIds.length : 0} worker(s) assigned; required tool reservations were updated with the assignment.` },
      construction_job_cancelled: { category: 'construction', title: 'Construction cancelled', text: 'Unconsumed material and tool reservations were released; completed work was not refunded.' },
      lord_house_repaired: { category: 'construction', title: 'Lord House repaired', text: 'The house is active and exactly eleven built-in Level 1 building options are unlocked.' },
      construction_building_completed: { category: 'construction', title: 'Building completed', text: `${String(event.payload.blueprintId)} finished; reserved costs were consumed once and the building instance is active.` },
      career_activated: { category: 'character', title: 'Nghề đã kích hoạt', text: 'Tử Khí Châm đã được học một lần; Mana không đổi.' },
      combat_encounter_started: { category: 'combat', title: 'Bắt đầu giao chiến', text: String(event.payload.actorName) + ' tiếp cận một thỏ băng thuộc quần thể R0; lượt đầu sẽ phân giải theo giờ mô phỏng.' },
      combat_retreat_ordered: { category: 'combat', title: 'Đã ra lệnh rút lui', text: 'Chiến binh sẽ rút ở mốc giao chiến kế tiếp sau phản ứng của mục tiêu.' },
      combat_turn_settled: { category: 'combat', title: 'Lượt giao chiến đã phân giải', text: 'Kết quả: ' + String(event.payload.outcome) + '; sát thương gây ra ' + String(event.payload.damage) + ', nhận vào ' + String(event.payload.damageTaken) + '.' },
      combat_encounter_won: { category: 'combat', title: 'Giao chiến kết thúc · nhặt được thi thể thật', text: String(event.payload.xpAwarded) + ' XP hợp lệ cho ' + String(event.payload.actorName) + '; Lí Lan nhận phản chiếu ' + String(event.payload.mirroredXp) + ' XP đúng một lần.' },
      combat_encounter_retreated: { category: 'combat', title: 'Rút khỏi giao chiến', text: 'Mục tiêu sống sót và rời khỏi tầm giao chiến; cá thể vẫn được giữ nguyên trong ecology.' },
      combat_unit_defeated: { category: 'combat', title: 'Chiến binh bị hạ gục', text: 'Liên kết Tử Phục của đơn vị đã đóng vĩnh viễn; thi thể thứ hai mang khóa không thể tái chế.' },
      corpse_revived: { category: 'forces', title: 'Tử Phục thành công', text: 'Đơn vị được thêm vào quân lực với hồ sơ, cấp độ, kinh nghiệm và các vật phẩm đã ghi nhận.' },
      corpse_butchered: { category: 'forces', title: 'Thi thể đã được phân giải', text: 'Thi thể đã được tiêu dùng một lần; trang bị còn ghi nhận được thu hồi.' },
      unit_equipment_changed: { category: 'inventory', title: 'Trang bị đã cập nhật', text: String(event.payload.templateId) + ' được gắn vào ' + String(event.payload.unitId) + '.' },
      unit_equipment_removed: { category: 'inventory', title: 'Đã tháo trang bị', text: 'Vật phẩm trở lại túi hành trang của Lí Lan.' },
      xp_awarded: { category: 'progression', title: 'Kinh nghiệm đã quyết toán', text: String(event.payload.netXp) + ' XP lao động đã được ghi nhận; Lí Lan nhận phản chiếu ' + String(event.payload.mirroredNetXp) + ' XP.' },
      construction_reward_entitlement_pending: { category: 'achievement', title: 'First-build reward pending', text: `${String(event.payload.achievementId)} is recorded as pending; no reward item was created until its eligibility contract resolves.` },
      farmhouse_residents_recruited: { category: 'population', title: 'Farmhouse residents recruited', text: `${String(event.payload.quantity)} resident(s) joined after paying ${String(event.payload.foodUnitsSpent)} FOOD units.` },
      heater_service_started: { category: 'production', title: 'Heater fuel cycle started', text: 'One WOOD is reserved for 20 minutes of heat service (+15–20°C in a room up to 30 m²). The territory-wide cold model is unchanged.' },
      heater_service_completed: { category: 'production', title: 'Heater fuel cycle completed', text: 'The reserved WOOD was consumed once and the local 20-minute heat service ended.' },
      resource_daily_quotas_reset: { category: 'logistics', title: 'Daily resource quotas reset', text: 'Daily source quotas reset at the world midnight boundary.' },
      caravan_departed: { category: 'quest', title: 'Torven’s caravan departed', text: 'The source scheduled convoy left the checkpoint for the old trade-road bridge.' },
      caravan_distress_opened: { category: 'quest', title: 'Caravan distress reported', text: 'Torven’s caravan is waiting at the bridge. Its fixed response window is now open.' },
      quest_accepted: { category: 'quest', title: 'Caravan request accepted', text: 'Torven’s fixed rescue and escort request is now active.' },
      caravan_safe_passage_negotiated: { category: 'quest', title: 'Safe passage negotiated', text: 'One recorded grain sack secured the bridge crossing; the raiders withdrew.' },
      caravan_escort_started: { category: 'quest', title: 'Caravan escort started', text: 'The convoy is traveling to Krona Gate at the authored route pace.' },
      caravan_arrived: { category: 'quest', title: 'Caravan reached Krona Gate', text: 'Torven, the surviving draft animals, and the cargo ledger reached the town checkpoint.' },
      quest_completed: { category: 'quest', title: 'Caravan quest completed', text: 'The fixed route conditions were met. The source reward is ready to claim at Krona Gate.' },
      market_opened: { category: 'trade', title: 'Caravan market opened', text: 'The local bread offer and six-unit salt lot are available at Krona Gate.' },
      quest_reward_claimed: { category: 'quest', title: 'Caravan reward claimed', text: `The fixed reward contract granted ${String(event.payload.amount)} ${String(event.payload.currencyId)} and unlocked Torven’s recorded route and contract offers.` },
      caravan_window_closed: { category: 'quest', title: 'Caravan response window closed', text: 'The convoy returned to its checkpoint; no quest reward was issued.' },
      shop_purchase_committed: { category: 'trade', title: 'Market purchase completed', text: `${String(event.payload.quantity)} ${String(event.payload.itemTemplateId)} delivered for ${String(event.payload.totalPrice)} ${String(event.payload.currencyId)}.` },
      shop_offer_expired: { category: 'trade', title: 'Market offer expired', text: 'The offer was closed at its recorded expiry boundary.' },
      auction_bid_placed: { category: 'trade', title: 'Auction bid placed', text: `${String(event.payload.quantity)} lot unit(s) reserved; ${String(event.payload.escrowAmount)} ${String(event.payload.currencyId)} is held until cancellation or lot close.` },
      auction_bid_cancelled: { category: 'trade', title: 'Auction bid cancelled', text: `${String(event.payload.returnedEscrow)} ${String(event.payload.currencyId)} returned to the available balance; no goods transferred.` },
      auction_bid_expired: { category: 'trade', title: 'Auction bid expired', text: `${String(event.payload.returnedEscrow)} ${String(event.payload.currencyId)} returned at lot close; no goods transferred.` },
    };
    return events[event.type] ?? null;
  }

  private commandProblem(receipt: CommandReceipt, currentRevision: number): ApiProblem {
    if (receipt.code === 'STALE_REVISION') return apiProblem('STALE_REVISION', 409, receipt.message, 'Dữ liệu đã thay đổi. Hãy tải lại trước khi thử lại.', currentRevision);
    if (receipt.code === 'NOT_ACCESSIBLE' || receipt.code === 'ENTITY_NOT_KNOWN') return apiProblem('NOT_ACCESSIBLE', 404, 'The requested target is unavailable.', 'Không thể truy cập mục tiêu này.', currentRevision);
    if (isRuleNotReadyCommandReceipt(receipt.code)) {
      return apiProblem('RULE_NOT_READY', 422, receipt.message, 'Quy tắc cho thao tác này chưa sẵn sàng.', currentRevision);
    }
    if (receipt.code === 'CONTENT_MISMATCH') return apiProblem('CONTENT_MISMATCH', 409, receipt.message, 'Phiên bản nội dung không khớp.', currentRevision);
    return apiProblem('INVALID_COMMAND', 422, receipt.message, 'Lệnh không được chấp nhận.', currentRevision);
  }

}
