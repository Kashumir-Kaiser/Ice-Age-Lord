import { UNIT_INVENTORY_CONTAINER_PREFIX, type ClockControl, type ColdEnvironment, type GameState, type PlayerUnitState, type WorldDefinition } from '../../contracts/src/index.ts';
import { RESOURCE_STORAGE } from '../../content/src/resourceBalance.ts';
import { integrateSpatialTo, nextSpatialBoundary, settleSpatialBoundary } from './spatial.ts';
import { integrateConstructionWork, nextConstructionCompletionAt, nextHeaterServiceCompletionAt, settleConstructionCompletions, settleHeaterServices } from './construction.ts';
import { nextCombatBoundaryAt, settleCombatBoundary } from './combat.ts';
import { nextStage08BoundaryAt, settleOpeningLevelRank, settleStage08Boundary } from './stage08.ts';
import { replenishWildlife } from './wildlife.ts';
import { expireEventItems, recordEventActivities, settleEventOutcome, settleExpiredEventClaims, updateEventShopStatus } from './eventRuntime.ts';
import { OPENING_FIRE_EFFECTIVE_TEMPERATURE_C } from '../../content/src/openingEnvironment.ts';
import { flushBotPopulationChunks, integrateBotPopulationSegment, nextBotBoundaryAt, settleBotBoundary } from './bots/economy.ts';
import { beginBotPopulationAdvance, finishBotPopulationAdvance, isBotPopulationAdvanceInProgress } from './bots/state.ts';
import { coldLoadRateMicroPerMinute } from './cold.ts';

export { coldLoadRateMicroPerMinute } from './cold.ts';

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const TOMB_STANDARD_BLUEPRINT_ID = 'LL-TOMB-ZOMBIE-STANDARD-01';
export const TOMB_STANDARD_RECIPE_ID = 'NECRO-QUEUE-2.2:STANDARD-T0-COMMON';
export const TOMB_STANDARD_DURATION_MS = 20 * MINUTE_MS;
export const FIRE_WOOD_CONSUMPTION_MS = 15 * MINUTE_MS;
// A one-batch default must cover the current 3-second NPC decision cadence over a
// normal 10-hour player advance, in addition to world and player activity boundaries.
export const MAX_BOUNDARIES_PER_BATCH = 10_000;

export type StopCondition = 'none' | 'next_completion' | 'danger';
export type SettledEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };
export type AdvanceResult = {
  state: GameState;
  events: readonly SettledEvent[];
  targetSimElapsedMs: number;
  caughtUp: boolean;
  stoppedBy: 'next_completion' | 'danger' | 'event_content_blocked' | null;
};

export function selectedSpeed(selection: ClockControl['selection'], customMultiplier?: number): ClockControl {
  if (selection === 'paused') return { status: 'paused', selection, speedPermille: 0, stopCondition: 'none' };
  const speedPermille = selection === 'custom'
    ? Math.round(Number(customMultiplier) * 1000)
    : selection === '1x' ? 1000 : selection === '2x' ? 2000 : 5000;
  if (!Number.isSafeInteger(speedPermille) || speedPermille < 100 || speedPermille > 3_600_000) throw new Error('CLOCK_SPEED_INVALID');
  return { status: 'running', selection, speedPermille, stopCondition: 'none' };
}

export function elapsedMsToWorldClock(simElapsedMs: number): { day: number; hour: number; minute: number; lightPhase: 'daylight' | 'twilight' | 'night' } {
  if (!Number.isSafeInteger(simElapsedMs) || simElapsedMs < 0) throw new Error('SIM_TIME_INVALID');
  const shifted = simElapsedMs + 7 * HOUR_MS;
  const withinDay = shifted % DAY_MS;
  const hour = Math.floor(withinDay / HOUR_MS);
  const minute = Math.floor((withinDay % HOUR_MS) / MINUTE_MS);
  const minuteOfDay = hour * 60 + minute;
  const lightPhase = minuteOfDay >= 7 * 60 && minuteOfDay < 16 * 60 + 30
    ? 'daylight'
    : minuteOfDay >= 16 * 60 + 30 && minuteOfDay < 17 * 60 ? 'twilight' : 'night';
  return { day: Math.floor(shifted / DAY_MS) + 1, hour, minute, lightPhase };
}

function currentColdLoadRate(state: GameState): number {
  const environment = state.survival.environment;
  if (environment === null) return 0;
  const fire = state.territory.survivalFire;
  const protectedByFire = fire.active && Math.hypot(
    state.player.position.xMm - state.territory.position.xMm,
    state.player.position.yMm - state.territory.position.yMm,
  ) <= fire.heatRadiusMetres * 1_000;
  const heater = (state.construction.operatingServices ?? []).find(service => {
    if (service.status !== 'active') return false;
    const building = state.buildings.find(candidate => candidate.id === service.buildingId);
    if (!building?.position) return false;
    const roomRadiusMm = Math.sqrt(service.roomAreaCapM2 / Math.PI) * 1_000;
    return Math.hypot(state.player.position.xMm - building.position.xMm, state.player.position.yMm - building.position.yMm) <= roomRadiusMm;
  });
  const warming = (protectedByFire ? OPENING_FIRE_EFFECTIVE_TEMPERATURE_C : 0) + (heater?.heatDeltaCelsius.min ?? 0);
  return coldLoadRateMicroPerMinute(warming > 0
    ? { ...environment, apparentTemperatureC: environment.apparentTemperatureC + warming }
    : environment);
}

function nextColdThresholdAt(state: GameState, rateMicroPerMinute: number): number | null {
  if (state.survival.environment === null || rateMicroPerMinute <= 0) return null;
  const current = state.survival.coldLoadMicro;
  const thresholds = [300, 600, 900, 1200].map(value => value * 1_000_000);
  const next = thresholds.find(value => value > current);
  if (next === undefined) return null;
  const needed = Math.max(0, (next - current) * MINUTE_MS - state.survival.coldLoadRemainder);
  return state.simElapsedMs + Math.ceil(needed / rateMicroPerMinute);
}

function integrateSegment(state: GameState, target: number, coldRateMicroPerMinute: number, world?: WorldDefinition): void {
  const from = state.simElapsedMs;
  const duration = target - from;
  if (duration <= 0) return;

  // 0.45 Mana/second is represented as integer micro-Mana to keep chunking exact.
  const manaMicro = Math.round(state.player.mana.current * 1_000_000);
  const maxManaMicro = Math.round(state.player.mana.max * 1_000_000);
  const nextManaMicro = Math.min(maxManaMicro, manaMicro + duration * 450);
  state.player.mana.current = nextManaMicro / 1_000_000;
  state.player.mana.lastSettledAtElapsedMs = target;

  if (state.survival.environment !== null && coldRateMicroPerMinute > 0) {
    const numerator = duration * coldRateMicroPerMinute + state.survival.coldLoadRemainder;
    state.survival.coldLoadMicro += Math.floor(numerator / MINUTE_MS);
    state.survival.coldLoadRemainder = numerator % MINUTE_MS;
  }
  integrateBotPopulationSegment(state, from, target);
  state.territory.tomb.queue = state.territory.tomb.queue.map(entry => entry.status === 'active' && entry.startedAtElapsedMs !== null
    ? { ...entry, progressCarryMs: Math.min(TOMB_STANDARD_DURATION_MS, Math.max(0, target - entry.startedAtElapsedMs)) }
    : entry);
  integrateConstructionWork(state, from, target);
  if (world) integrateSpatialTo(state, world, target);
  else state.simElapsedMs = target;
}

function emit(events: SettledEvent[], type: string, at: number, payload: Record<string, unknown> = {}): void {
  events.push({ type, occurredAtElapsedMs: at, payload });
}

function tombSlots(level: number): number { return Math.min(8, Math.max(0, level + 1)); }
function tombDuration(level: number): number { return Math.max(5, 20 - 1.5 * (level - 1)) * MINUTE_MS; }

function createTombUnit(state: GameState, unitId: string): PlayerUnitState {
  const output = state.territory.tomb.output;
  return {
    id: unitId,
    templateId: 'LL-TOMB-ZOMBIE-T0-STANDARD-01',
    name: `Cương Thi ${state.ownedUnits.filter(unit => unit.creationRoute === 'TOMB_QUEUE').length + 1}`,
    creationRoute: 'TOMB_QUEUE',
    level: output.level,
    xp: output.xp,
    ownerId: state.player.id,
    position: state.territory.position,
    location: { kind: 'site', siteId: 'SITE-LL01-000' },
    equipmentIds: [],
    sourceStats: {
      formTier: output.formTier,
      grade: output.grade,
      level: output.level,
      xp: output.xp,
      faction: output.faction,
      hero: output.hero,
      loyalty: output.loyalty,
    },
    anatomyTemplateId: 'LL-TOMB-ZOMBIE-T0-STANDARD-01',
    equipmentRequirements: { status: 'source_profile_not_compiled', requiredSlotIds: [] },
    xpMirrorEligible: false,
    baseLaborRateWuPerHour: output.baseLaborRateWuPerHour,
    laborRuleVersion: 'TOMB-ZOMBIE-LABOR-1.0',
    constructionModifiers: { health: 1, stamina: 1, skill: 1, tool: 1, weather: 1, shelter: 1, command: 1 },
  };
}

function startWaitingTombJobs(state: GameState, at: number, events: SettledEvent[]): void {
  const level = state.buildings.find(building => building.id === state.territory.tombId)?.level ?? 1;
  const slots = tombSlots(level);
  const occupied = new Set(state.territory.tomb.queue.filter(entry => entry.status === 'active' && entry.slotId !== null).map(entry => entry.slotId));
  const freeSlots = Array.from({ length: slots }, (_, index) => index).filter(index => !occupied.has(index));
  const waiting = state.territory.tomb.queue
    .filter(entry => entry.status === 'queued' || entry.status === 'blocked')
    .slice()
    .sort((a, b) => a.enqueuedAtElapsedMs - b.enqueuedAtElapsedMs || a.id.localeCompare(b.id));
  for (const slotId of freeSlots) {
    const entry = waiting.shift();
    if (!entry) break;
    if (state.territory.tomb.deathQi.current < 1) {
      const wasBlocked = entry.status === 'blocked';
      state.territory.tomb.queue = state.territory.tomb.queue.map(item => item.id === entry.id ? { ...item, status: 'blocked', slotId: null } : item);
      waiting.unshift(entry);
      if (!wasBlocked) emit(events, 'tomb_job_blocked', at, { jobId: entry.id, reason: 'INSUFFICIENT_DEATH_QI' });
      break;
    }
    const started = {
      ...entry,
      status: 'active' as const,
      reservedDeathQi: 1,
      slotId,
      startedAtElapsedMs: at,
      completesAtElapsedMs: at + tombDuration(level),
      progressCarryMs: 0,
    };
    state.territory.tomb.deathQi.current -= 1;
    state.territory.tomb.queue = state.territory.tomb.queue.map(item => item.id === entry.id ? started : item);
    const existingJob = state.jobs.find(job => job.id === entry.id);
    state.jobs = existingJob
      ? state.jobs.map(job => job.id === entry.id ? { ...job, status: 'active', startedAtElapsedMs: at } : job)
      : [...state.jobs, { id: entry.id, kind: 'tomb_production', status: 'active', actorIds: [], reservedItemIds: [], startedAtElapsedMs: at, completedAtElapsedMs: null }];
    emit(events, 'tomb_job_started', at, { jobId: entry.id, slotId, reservedDeathQi: 1, completesAtElapsedMs: started.completesAtElapsedMs });
  }
}

export function enqueueTombJob(state: GameState, jobId: string, outputUnitId: string): { state: GameState; events: readonly SettledEvent[] } {
  if (!jobId.trim() || !outputUnitId.trim() || state.territory.tomb.queue.some(entry => entry.id === jobId)
    || state.ownedUnits.some(unit => unit.id === outputUnitId)) throw new Error('TOMB_JOB_ID_INVALID');
  const next = structuredClone(state);
  const entry: GameState['territory']['tomb']['queue'][number] = {
    id: jobId,
    recipeId: TOMB_STANDARD_RECIPE_ID,
    blueprintId: TOMB_STANDARD_BLUEPRINT_ID,
    status: 'queued',
    reservedDeathQi: 0,
    enqueuedAtElapsedMs: next.simElapsedMs,
    slotId: null,
    startedAtElapsedMs: null,
    completesAtElapsedMs: null,
    progressCarryMs: 0,
    outputUnitId,
  };
  next.territory.tomb.queue = [...next.territory.tomb.queue, entry];
  const events: SettledEvent[] = [];
  emit(events, 'tomb_job_queued', next.simElapsedMs, { jobId, blueprintId: TOMB_STANDARD_BLUEPRINT_ID });
  startWaitingTombJobs(next, next.simElapsedMs, events);
  return { state: next, events };
}

export function cancelTombJob(state: GameState, jobId: string): { state: GameState; events: readonly SettledEvent[] } {
  const entry = state.territory.tomb.queue.find(item => item.id === jobId);
  if (!entry) throw new Error('TOMB_JOB_NOT_FOUND');
  if (entry.status !== 'queued' && entry.status !== 'blocked') throw new Error('TOMB_ACTIVE_CANCEL_UNRESOLVED');
  if (entry.reservedDeathQi !== 0) throw new Error('TOMB_JOB_HAS_RESERVED_INPUTS');
  const next = structuredClone(state);
  next.territory.tomb.queue = next.territory.tomb.queue.map(item => item.id === jobId ? { ...item, status: 'cancelled' } : item);
  next.jobs = next.jobs.map(job => job.id === jobId ? { ...job, status: 'cancelled' } : job);
  return { state: next, events: [{ type: 'tomb_job_cancelled', occurredAtElapsedMs: state.simElapsedMs, payload: { jobId } }] };
}

function completeTombJobs(state: GameState, at: number, events: SettledEvent[]): boolean {
  const due = state.territory.tomb.queue
    .filter(entry => entry.status === 'active' && entry.completesAtElapsedMs === at)
    .slice()
    .sort((a, b) => (a.slotId ?? Number.MAX_SAFE_INTEGER) - (b.slotId ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  for (const entry of due) {
    const unitId = entry.outputUnitId;
    if (!state.ownedUnits.some(unit => unit.id === unitId)) state.ownedUnits = [...state.ownedUnits, createTombUnit(state, unitId)];
    const containerId = `${UNIT_INVENTORY_CONTAINER_PREFIX}${unitId}`;
    if (!state.inventory.containers.some(container => container.id === containerId)) {
      state.inventory = {
        ...state.inventory,
        containers: [...state.inventory.containers, {
          id: containerId,
          kind: 'unit_inventory',
          capacitySlots: RESOURCE_STORAGE.unitInventorySlots,
          occupiedSlots: null,
          location: { kind: 'unit', unitId },
          observed: true,
          stacks: [],
        }],
      };
    }
    state.territory.tomb.queue = state.territory.tomb.queue.map(item => item.id === entry.id
      ? { ...item, status: 'completed', slotId: null, progressCarryMs: Math.max(0, (item.completesAtElapsedMs ?? at) - (item.startedAtElapsedMs ?? at)) }
      : item);
    state.jobs = state.jobs.map(job => job.id === entry.id ? { ...job, status: 'completed', completedAtElapsedMs: at } : job);
    emit(events, 'tomb_unit_completed', at, { jobId: entry.id, unitId, creationRoute: 'TOMB_QUEUE', xpMirrorEligible: false });
  }
  return due.length > 0;
}

function nextCalendarBoundaryAt(state: GameState): number | null {
  const candidates = state.calendar.flatMap(event => {
    if (event.status === 'scheduled') return [event.opensAtMs];
    if (event.status === 'active') return [event.locksAtMs, event.resolvesAtMs];
    if (event.status === 'locked') return [event.resolvesAtMs];
    return [];
  }).filter(value => Number.isSafeInteger(value) && value >= state.simElapsedMs);
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function nextEventTime(state: GameState, target: number, coldRate: number, world?: WorldDefinition): number {
  const combatBoundary = nextCombatBoundaryAt(state);
  const candidates = [
    target,
    ...(combatBoundary === null ? [] : [combatBoundary]),
    nextStage08BoundaryAt(state) ?? Number.MAX_SAFE_INTEGER,
    nextBotBoundaryAt(state.botPopulation) ?? Number.MAX_SAFE_INTEGER,
    state.wildlife.nextReplenishmentAtElapsedMs,
    state.timeBoundaries.nextHourlySettlementAtElapsedMs,
    state.timeBoundaries.nextMidnightAtElapsedMs,
    state.timeBoundaries.nextDailySettlementAtElapsedMs,
    state.timeBoundaries.nextSunsetAtElapsedMs,
    state.timeBoundaries.nextTwilightEndAtElapsedMs,
    state.timeBoundaries.nextDawnAtElapsedMs,
    state.timeBoundaries.protectionExpiryAtElapsedMs ?? Number.MAX_SAFE_INTEGER,
    nextCalendarBoundaryAt(state) ?? Number.MAX_SAFE_INTEGER,
    state.territory.survivalFire.nextFuelConsumptionAtElapsedMs ?? Number.MAX_SAFE_INTEGER,
    ...state.eventProgress.map(progress => progress.outcome === 'success' ? progress.claimExpiresAtElapsedMs ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER),
    ...state.territory.tomb.queue.filter(entry => entry.status === 'active' && entry.completesAtElapsedMs !== null).map(entry => entry.completesAtElapsedMs as number),
  ];
  const constructionCompletion = nextConstructionCompletionAt(state);
  if (constructionCompletion !== null) candidates.push(constructionCompletion);
  const heaterCompletion = nextHeaterServiceCompletionAt(state);
  if (heaterCompletion !== null) candidates.push(heaterCompletion);
  const coldThreshold = nextColdThresholdAt(state, coldRate);
  if (coldThreshold !== null) candidates.push(coldThreshold);
  if (world) {
    const spatialBoundary = nextSpatialBoundary(state);
    if (spatialBoundary !== null) candidates.push(spatialBoundary);
  }
  return Math.min(...candidates.filter(candidate => candidate >= state.simElapsedMs));
}

function settleCalendarBoundary(
  state: GameState,
  at: number,
  events: SettledEvent[],
  stopBeforeEvent?: { eventId: string; reasonCode: string; playerMessage: string },
  eventSequenceOffset = 0,
): string | null {
  for (const event of state.calendar) {
    if (event.status === 'scheduled' && event.opensAtMs === at) {
      if (stopBeforeEvent?.eventId === event.id) {
        const sequence = state.lastEventSequence + eventSequenceOffset + events.length + 1;
        state.calendar = state.calendar.map(row => row.id === event.id
          ? { ...row, status: 'blocked', blockedReceiptSequence: sequence }
          : row);
        state.eventProgressionBlocker = {
          eventId: event.id,
          blockedAtElapsedMs: at,
          reasonCode: stopBeforeEvent.reasonCode,
          playerMessage: stopBeforeEvent.playerMessage,
          receiptSequence: sequence,
        };
        emit(events, 'mandatory_event_blocked', at, {
          eventId: event.id,
          reasonCode: stopBeforeEvent.reasonCode,
          displayName: event.displayName,
        });
        return event.id;
      }
      const sequence = state.lastEventSequence + eventSequenceOffset + events.length + 1;
      state.calendar = state.calendar.map(row => row.id === event.id
        ? { ...row, status: 'active', openReceiptSequence: sequence }
        : row);
      updateEventShopStatus(state, event.id, 'active');
      emit(events, 'event_calendar_opened', at, { eventId: event.id, displayName: event.displayName });
    }
    const current = state.calendar.find(row => row.id === event.id);
    if (current?.status === 'active' && current.locksAtMs === at) {
      const sequence = state.lastEventSequence + eventSequenceOffset + events.length + 1;
      state.calendar = state.calendar.map(row => row.id === event.id
        ? { ...row, status: 'locked', lockReceiptSequence: sequence }
        : row);
      updateEventShopStatus(state, event.id, 'closed');
      emit(events, 'event_calendar_locked', at, { eventId: event.id, displayName: event.displayName });
    }
    const locked = state.calendar.find(row => row.id === event.id);
    if ((locked?.status === 'active' || locked?.status === 'locked') && locked.resolvesAtMs === at) {
      const sequence = state.lastEventSequence + eventSequenceOffset + events.length + 1;
      state.calendar = state.calendar.map(row => row.id === event.id
        ? { ...row, status: 'resolved', resolutionReceiptSequence: sequence }
        : row);
      updateEventShopStatus(state, event.id, 'expired');
      emit(events, 'event_calendar_resolved', at, {
        eventId: event.id,
        displayName: event.displayName,
        playerSettlement: state.eventProgress.some(progress => progress.eventId === event.id) ? 'objective_and_claim' : 'no_default_award',
      });
      const inventoryExpiry = expireEventItems(state, event.id, at);
      if (inventoryExpiry) events.push(inventoryExpiry);
      const objectiveResult = settleEventOutcome(state, event.id, at);
      if (objectiveResult) events.push(objectiveResult);
      if (event.id === 'EV01-OPENING-LEVEL') {
        const rankEvent = settleOpeningLevelRank(state, at);
        if (rankEvent) events.push(rankEvent);
      }
    }
  }
  return null;
}

function processBoundary(
  state: GameState,
  at: number,
  events: SettledEvent[],
  world?: WorldDefinition,
  stopBeforeEvent?: { eventId: string; reasonCode: string; playerMessage: string },
  eventSequenceOffset = 0,
): { completed: boolean; danger: boolean; blockedEventId: string | null } {
  const boundaryEventStart = events.length;
  let completed = false;
  let combatDanger = false;
  if (world) {
    const spatialEvents = settleSpatialBoundary(state, world, at);
    events.push(...spatialEvents);
    if (spatialEvents.some(event => event.type === 'movement_order_completed' || event.type === 'spatial_search_completed' || event.type === 'harvest_cargo_returned')) completed = true;
  }
  const botEvents = settleBotBoundary(state, at, world);
  // Bot-only economy and combat receipts stay in their population chunks. Only contact that
  // directly affects Lí Lan enters the player-facing campaign event stream.
  events.push(...botEvents.filter(event => event.type === 'bot_raid_player_attack'));
  if (botEvents.some(event => event.type === 'bot_action_committed' || event.type === 'bot_structure_completed' || event.type === 'bot_unit_recruited')) completed = true;
  const combatOutcome = settleCombatBoundary(state, at);
  if (combatOutcome.events.length > 0) {
    Object.assign(state, combatOutcome.state);
    events.push(...combatOutcome.events);
    completed = combatOutcome.completed || completed;
    combatDanger = combatOutcome.danger;
  }

  const fire = state.territory.survivalFire;
  if (fire.active && fire.fuelRemaining !== null && fire.nextFuelConsumptionAtElapsedMs === at) {
    fire.fuelRemaining = Math.max(0, fire.fuelRemaining - 1);
    emit(events, 'fire_fuel_consumed', at, { remaining: fire.fuelRemaining, fuel: 'WOOD' });
    if (fire.fuelRemaining === 0) {
      fire.active = false;
      fire.nextFuelConsumptionAtElapsedMs = null;
      emit(events, 'survival_fire_extinguished', at, { reason: 'fuel_depleted' });
    } else {
      fire.nextFuelConsumptionAtElapsedMs += FIRE_WOOD_CONSUMPTION_MS;
    }
  }

  completed = completeTombJobs(state, at, events) || completed;
  if (completed) startWaitingTombJobs(state, at, events);

  const constructionEvents = settleConstructionCompletions(state, at);
  events.push(...constructionEvents);
  if (constructionEvents.length > 0) completed = true;
  const heaterEvents = settleHeaterServices(state, at);
  events.push(...heaterEvents);
  if (heaterEvents.length > 0) completed = true;

  if (state.wildlife.nextReplenishmentAtElapsedMs === at) {
    const replenished = replenishWildlife(state, at);
    for (const result of replenished) emit(events, 'wildlife_population_replenished', at, result);
  }

  for (const result of settleExpiredEventClaims(state, at)) events.push(result);

  const stage08Events = settleStage08Boundary(state, at);
  events.push(...stage08Events);

  const boundaries = state.timeBoundaries;
  if (boundaries.nextMidnightAtElapsedMs === at) {
    // Existing completions and the slot refill they cause settle before the midnight refill.
    state.territory.tomb.deathQi.current = state.territory.tomb.deathQi.capacity;
    boundaries.nextMidnightAtElapsedMs += DAY_MS;
    state.territory.tomb.deathQi.nextRefillAtElapsedMs = boundaries.nextMidnightAtElapsedMs;
    const regenerated: { resourceId: string; quantity: number }[] = [];
    state.spatial.resourceBalances = state.spatial.resourceBalances.map(balance => {
      const resource = world?.resources.find(candidate => candidate.id === balance.resourceId);
      if (balance.dailyRemaining !== null) {
        const quota = resource?.dailyQuota ?? balance.dailyRemaining;
        return { ...balance, dailyRemaining: quota, dailyResetAtElapsedMs: boundaries.nextMidnightAtElapsedMs };
      }
      if (resource?.renewal !== 'biological_rate' || resource.regenerationPerDay <= 0) return balance;
      const grown = Math.min(resource.regenerationPerDay, Math.max(0, resource.capacity - balance.remaining));
      if (grown > 0) regenerated.push({ resourceId: resource.id, quantity: grown });
      return { ...balance, remaining: balance.remaining + grown, lastRenewedAtElapsedMs: at };
    });
    emit(events, 'tomb_death_qi_refilled', at, { current: state.territory.tomb.deathQi.current, capacity: state.territory.tomb.deathQi.capacity });
    if (state.spatial.resourceBalances.some(balance => balance.dailyRemaining !== null)) emit(events, 'resource_daily_quotas_reset', at, {});
    for (const growth of regenerated) emit(events, 'resource_biomass_regenerated', at, growth);
    startWaitingTombJobs(state, at, events);
  }
  if (boundaries.nextHourlySettlementAtElapsedMs === at) {
    boundaries.nextHourlySettlementAtElapsedMs += HOUR_MS;
    emit(events, 'simulation_hour_settled', at, {});
  }
  if (boundaries.nextDailySettlementAtElapsedMs === at) {
    boundaries.nextDailySettlementAtElapsedMs += DAY_MS;
    emit(events, 'world_day_started', at, { day: elapsedMsToWorldClock(at).day });
  }
  if (boundaries.nextSunsetAtElapsedMs === at) {
    boundaries.nextSunsetAtElapsedMs += DAY_MS;
    emit(events, 'world_sunset', at, {});
  }
  if (boundaries.nextTwilightEndAtElapsedMs === at) {
    boundaries.nextTwilightEndAtElapsedMs += DAY_MS;
    emit(events, 'world_night_started', at, {});
  }
  if (boundaries.nextDawnAtElapsedMs === at) {
    boundaries.nextDawnAtElapsedMs += DAY_MS;
    emit(events, 'world_dawn', at, {});
  }
  if (boundaries.protectionExpiryAtElapsedMs === at) {
    boundaries.protectionExpiryAtElapsedMs = null;
    state.territory.survivalFire.protectionStatus = 'expired';
    emit(events, 'opening_protection_expired', at, { eventId: state.territory.survivalFire.protectionEventId });
  }

  if (state.survival.environment !== null) {
    const coldLoad = state.survival.coldLoadMicro / 1_000_000;
    const warningBand = coldLoad >= 900 ? 900 : coldLoad >= 600 ? 600 : coldLoad >= 300 ? 300 : 0;
    const priorStatus = state.survival.coldStatus;
    state.survival.coldStatus = coldLoad >= 1200 ? 'danger' : warningBand > 0 ? 'warning' : 'clear';
    if (state.survival.coldStatus !== priorStatus) {
      emit(events, state.survival.coldStatus === 'danger' ? 'cold_danger_reached' : 'cold_warning_changed', at, { coldLoad, warningBand });
    }
  }
  const activity = recordEventActivities(state, events.slice(boundaryEventStart));
  if (activity.events.length > 0) {
    Object.assign(state, activity.state);
    events.push(...activity.events);
  }
  const blockedEventId = settleCalendarBoundary(state, at, events, stopBeforeEvent, eventSequenceOffset);
  return { completed, danger: state.survival.coldStatus === 'danger' || combatDanger, blockedEventId };
}

export function advanceTo(
  input: GameState,
  targetSimElapsedMs: number,
  options: {
    maxBoundaries?: number;
    maxWorkMs?: number;
    /** Keep a private, in-memory bot batch open when this bounded slice yields before target. */
    deferBotPopulationCommit?: boolean;
    /** Mutate a caller-owned private state that is never visible before the final commit. */
    mutatePrivateState?: boolean;
    stopCondition?: StopCondition;
    stopBeforeEvent?: { eventId: string; reasonCode: string; playerMessage: string };
    /** Public events committed in earlier private slices of this same clock catch-up. */
    eventSequenceOffset?: number;
  } = {},
  world?: WorldDefinition,
): AdvanceResult {
  if (!Number.isSafeInteger(targetSimElapsedMs) || targetSimElapsedMs < input.simElapsedMs) throw new Error('SIM_TIME_TARGET_INVALID');
  const maxBoundaries = options.maxBoundaries ?? MAX_BOUNDARIES_PER_BATCH;
  if (!Number.isSafeInteger(maxBoundaries) || maxBoundaries < 1 || maxBoundaries > 10_000) throw new Error('SIMULATION_BATCH_LIMIT_INVALID');
  if (options.maxWorkMs !== undefined && (!Number.isFinite(options.maxWorkMs) || options.maxWorkMs <= 0 || options.maxWorkMs > 100)) throw new Error('SIMULATION_WORK_BUDGET_INVALID');
  if (options.eventSequenceOffset !== undefined && (!Number.isSafeInteger(options.eventSequenceOffset) || options.eventSequenceOffset < 0)) throw new Error('SIMULATION_EVENT_SEQUENCE_OFFSET_INVALID');
  const workStartedAt = performance.now();
  let state: GameState;
  if (options.mutatePrivateState) {
    state = input;
  } else {
    const { botPopulation, ...coreState } = input;
    state = { ...structuredClone(coreState), botPopulation: botPopulation ?? null } as GameState;
  }
  const events: SettledEvent[] = [];
  if (state.eventProgressionBlocker) {
    return { state, events, targetSimElapsedMs, caughtUp: true, stoppedBy: 'event_content_blocked' };
  }
  state.botPopulation = beginBotPopulationAdvance(state.botPopulation);
  let processed = 0;
  let sameTimestampEvents = 0;
  let lastBoundaryAt = -1;
  let stoppedBy: AdvanceResult['stoppedBy'] = null;
  let workBudgetExhausted = false;

  while (state.simElapsedMs <= targetSimElapsedMs) {
    const coldRate = currentColdLoadRate(state);
    const at = nextEventTime(state, targetSimElapsedMs, coldRate, world);
    const spatialBoundary = world ? nextSpatialBoundary(state) : null;
    const hadBoundary = [
      state.timeBoundaries.nextHourlySettlementAtElapsedMs,
      state.timeBoundaries.nextMidnightAtElapsedMs,
      state.timeBoundaries.nextDailySettlementAtElapsedMs,
      state.timeBoundaries.nextSunsetAtElapsedMs,
      state.timeBoundaries.nextTwilightEndAtElapsedMs,
      state.timeBoundaries.nextDawnAtElapsedMs,
      state.timeBoundaries.protectionExpiryAtElapsedMs,
      nextCalendarBoundaryAt(state),
      state.territory.survivalFire.nextFuelConsumptionAtElapsedMs,
      ...state.territory.tomb.queue.filter(entry => entry.status === 'active').map(entry => entry.completesAtElapsedMs),
      nextConstructionCompletionAt(state),
      nextHeaterServiceCompletionAt(state),
      nextCombatBoundaryAt(state),
      nextStage08BoundaryAt(state),
      nextBotBoundaryAt(state.botPopulation),
      state.wildlife.nextReplenishmentAtElapsedMs,
      nextColdThresholdAt(state, coldRate),
      spatialBoundary,
    ].includes(at);
    if (at > state.simElapsedMs) {
      integrateSegment(state, at, coldRate, world);
      sameTimestampEvents = 0;
      lastBoundaryAt = -1;
    }
    if (hadBoundary) {
      if (lastBoundaryAt === at) sameTimestampEvents += 1;
      else { lastBoundaryAt = at; sameTimestampEvents = 1; }
      if (sameTimestampEvents > 1_000) throw new Error('SIMULATION_ZERO_TIME_EVENT_LOOP');
      const outcome = processBoundary(state, at, events, world, options.stopBeforeEvent, options.eventSequenceOffset ?? 0);
      processed += 1;
      if (outcome.blockedEventId) stoppedBy = 'event_content_blocked';
      else if (options.stopCondition === 'danger' && outcome.danger) stoppedBy = 'danger';
      else if (options.stopCondition === 'next_completion' && outcome.completed) stoppedBy = 'next_completion';
      if (stoppedBy || processed >= maxBoundaries) break;
      if (options.maxWorkMs !== undefined && performance.now() - workStartedAt >= options.maxWorkMs) {
        workBudgetExhausted = true;
        break;
      }
      continue;
    }
    if (state.simElapsedMs >= targetSimElapsedMs) break;
    // The target itself has been integrated and has no discrete event.
    break;
  }

  const caughtUp = (state.simElapsedMs >= targetSimElapsedMs && !workBudgetExhausted) || stoppedBy !== null;
  const botPopulationInProgress = isBotPopulationAdvanceInProgress(state.botPopulation);
  // The API holds this state privately across revision-checked slices. Keep hot
  // chunk workspaces alive until the final save commit instead of serializing and
  // hashing them after every bounded yield. Public board boundaries flush
  // explicitly before taking their immutable snapshot.
  const keepPrivateBotBatchOpen = options.deferBotPopulationCommit && !caughtUp && botPopulationInProgress;
  if (!keepPrivateBotBatchOpen) {
    const flushedBotPopulation = flushBotPopulationChunks(state.botPopulation);
    state.botPopulation = finishBotPopulationAdvance(flushedBotPopulation);
  }
  return { state, events, targetSimElapsedMs, caughtUp, stoppedBy };
}

export function resizeTombCapacity(state: GameState, nextCapacity: number, nextLevel: number): GameState {
  if (!Number.isSafeInteger(nextCapacity) || nextCapacity < 1 || !Number.isSafeInteger(nextLevel) || nextLevel < 1 || nextLevel > 10) {
    throw new Error('TOMB_CAPACITY_INVALID');
  }
  const capacity = state.territory.tomb.deathQi.capacity;
  const current = state.territory.tomb.deathQi.current;
  const adjustedCurrent = nextCapacity >= capacity ? current : Math.min(current, nextCapacity);
  return {
    ...state,
    territory: {
      ...state.territory,
      tomb: { ...state.territory.tomb, deathQi: { ...state.territory.tomb.deathQi, current: adjustedCurrent, capacity: nextCapacity } },
    },
    buildings: state.buildings.map(building => building.id === state.territory.tombId ? { ...building, level: nextLevel } : building),
  };
}

export function nextMidnightAfter(simElapsedMs: number): number {
  if (!Number.isSafeInteger(simElapsedMs) || simElapsedMs < 0) throw new Error('SIM_TIME_INVALID');
  const firstMidnight = 17 * HOUR_MS;
  if (simElapsedMs < firstMidnight) return firstMidnight;
  return firstMidnight + (Math.floor((simElapsedMs - firstMidnight) / DAY_MS) + 1) * DAY_MS;
}
