import type { ClockControl, ColdEnvironment, GameState, PlayerUnitState, WorldDefinition } from '../../contracts/src/index.ts';
import { integrateSpatialTo, nextSpatialBoundary, settleSpatialBoundary } from './spatial.ts';
import { integrateConstructionWork, nextConstructionCompletionAt, nextHeaterServiceCompletionAt, settleConstructionCompletions, settleHeaterServices } from './construction.ts';
import { nextCombatBoundaryAt, settleCombatBoundary } from './combat.ts';

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const TOMB_STANDARD_BLUEPRINT_ID = 'LL-TOMB-ZOMBIE-STANDARD-01';
export const TOMB_STANDARD_RECIPE_ID = 'NECRO-QUEUE-2.2:STANDARD-T0-COMMON';
export const TOMB_STANDARD_DURATION_MS = 20 * MINUTE_MS;
export const FIRE_WOOD_CONSUMPTION_MS = 15 * MINUTE_MS;
export const MAX_BOUNDARIES_PER_BATCH = 500;

export type StopCondition = 'none' | 'next_completion' | 'danger';
export type SettledEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };
export type AdvanceResult = {
  state: GameState;
  events: readonly SettledEvent[];
  targetSimElapsedMs: number;
  caughtUp: boolean;
  stoppedBy: 'next_completion' | 'danger' | null;
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

export function coldLoadRateMicroPerMinute(environment: ColdEnvironment): number {
  const { apparentTemperatureC, windKph, wetness, activityFactor, insulation, shelter } = environment;
  if (![apparentTemperatureC, windKph, wetness, activityFactor, insulation, shelter].every(Number.isFinite)
    || windKph < 0 || wetness < 0 || wetness > 1 || insulation <= 0 || shelter <= 0
    || ![0.7, 1, 1.3].includes(activityFactor)) throw new Error('COLD_ENVIRONMENT_INVALID');
  const deficit = Math.max(0, 18 - apparentTemperatureC);
  const windWetness = Math.max(1, Math.min(3, 1 + 0.03 * windKph + wetness));
  return Math.round((deficit * windWetness * activityFactor / (insulation * shelter)) * 1_000_000);
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
    state.territory.tomb.queue = state.territory.tomb.queue.map(item => item.id === entry.id
      ? { ...item, status: 'completed', slotId: null, progressCarryMs: Math.max(0, (item.completesAtElapsedMs ?? at) - (item.startedAtElapsedMs ?? at)) }
      : item);
    state.jobs = state.jobs.map(job => job.id === entry.id ? { ...job, status: 'completed', completedAtElapsedMs: at } : job);
    emit(events, 'tomb_unit_completed', at, { jobId: entry.id, unitId, creationRoute: 'TOMB_QUEUE', xpMirrorEligible: false });
  }
  return due.length > 0;
}

function nextEventTime(state: GameState, target: number, coldRate: number, world?: WorldDefinition): number {
  const combatBoundary = nextCombatBoundaryAt(state);
  const candidates = [
    target,
    ...(combatBoundary === null ? [] : [combatBoundary]),
    state.timeBoundaries.nextHourlySettlementAtElapsedMs,
    state.timeBoundaries.nextMidnightAtElapsedMs,
    state.timeBoundaries.nextDailySettlementAtElapsedMs,
    state.timeBoundaries.nextSunsetAtElapsedMs,
    state.timeBoundaries.nextTwilightEndAtElapsedMs,
    state.timeBoundaries.nextDawnAtElapsedMs,
    state.timeBoundaries.protectionExpiryAtElapsedMs ?? Number.MAX_SAFE_INTEGER,
    state.territory.survivalFire.nextFuelConsumptionAtElapsedMs ?? Number.MAX_SAFE_INTEGER,
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

function processBoundary(state: GameState, at: number, events: SettledEvent[], world?: WorldDefinition): { completed: boolean; danger: boolean } {
  let completed = false;
  let combatDanger = false;
  if (world) {
    const spatialEvents = settleSpatialBoundary(state, world, at);
    events.push(...spatialEvents);
    if (spatialEvents.some(event => event.type === 'movement_order_completed' || event.type === 'spatial_search_completed' || event.type === 'harvest_cargo_returned')) completed = true;
  }
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

  const boundaries = state.timeBoundaries;
  if (boundaries.nextMidnightAtElapsedMs === at) {
    // Existing completions and the slot refill they cause settle before the midnight refill.
    state.territory.tomb.deathQi.current = state.territory.tomb.deathQi.capacity;
    boundaries.nextMidnightAtElapsedMs += DAY_MS;
    state.territory.tomb.deathQi.nextRefillAtElapsedMs = boundaries.nextMidnightAtElapsedMs;
    state.spatial.resourceBalances = state.spatial.resourceBalances.map(balance => {
      if (balance.dailyRemaining === null) return balance;
      const quota = world?.resources.find(resource => resource.id === balance.resourceId)?.dailyQuota ?? balance.dailyRemaining;
      return { ...balance, dailyRemaining: quota, dailyResetAtElapsedMs: boundaries.nextMidnightAtElapsedMs };
    });
    emit(events, 'tomb_death_qi_refilled', at, { current: state.territory.tomb.deathQi.current, capacity: state.territory.tomb.deathQi.capacity });
    if (state.spatial.resourceBalances.some(balance => balance.dailyRemaining !== null)) emit(events, 'resource_daily_quotas_reset', at, {});
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
    const resolutionSequence = state.lastEventSequence + events.length;
    state.calendar = state.calendar.map(event => event.id === state.territory.survivalFire.protectionEventId
      ? { ...event, status: 'resolved', resolutionReceiptSequence: resolutionSequence }
      : event);
  }

  const coldLoad = state.survival.coldLoadMicro / 1_000_000;
  const warningBand = coldLoad >= 900 ? 900 : coldLoad >= 600 ? 600 : coldLoad >= 300 ? 300 : 0;
  const priorStatus = state.survival.coldStatus;
  state.survival.coldStatus = coldLoad >= 1200 ? 'danger' : warningBand > 0 ? 'warning' : 'clear';
  if (state.survival.coldStatus !== priorStatus && state.survival.environment !== null) {
    emit(events, state.survival.coldStatus === 'danger' ? 'cold_danger_reached' : 'cold_warning_changed', at, { coldLoad, warningBand });
  }
  return { completed, danger: state.survival.coldStatus === 'danger' || combatDanger };
}

export function advanceTo(
  input: GameState,
  targetSimElapsedMs: number,
  options: { maxBoundaries?: number; stopCondition?: StopCondition } = {},
  world?: WorldDefinition,
): AdvanceResult {
  if (!Number.isSafeInteger(targetSimElapsedMs) || targetSimElapsedMs < input.simElapsedMs) throw new Error('SIM_TIME_TARGET_INVALID');
  const maxBoundaries = options.maxBoundaries ?? MAX_BOUNDARIES_PER_BATCH;
  if (!Number.isSafeInteger(maxBoundaries) || maxBoundaries < 1 || maxBoundaries > 10_000) throw new Error('SIMULATION_BATCH_LIMIT_INVALID');
  const state = structuredClone(input);
  const events: SettledEvent[] = [];
  const coldRate = state.survival.environment === null ? 0 : coldLoadRateMicroPerMinute(state.survival.environment);
  let processed = 0;
  let sameTimestampEvents = 0;
  let lastBoundaryAt = -1;
  let stoppedBy: AdvanceResult['stoppedBy'] = null;

  while (state.simElapsedMs <= targetSimElapsedMs) {
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
      state.territory.survivalFire.nextFuelConsumptionAtElapsedMs,
      ...state.territory.tomb.queue.filter(entry => entry.status === 'active').map(entry => entry.completesAtElapsedMs),
      nextConstructionCompletionAt(state),
      nextHeaterServiceCompletionAt(state),
      nextCombatBoundaryAt(state),
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
      const outcome = processBoundary(state, at, events, world);
      processed += 1;
      if (options.stopCondition === 'danger' && outcome.danger) stoppedBy = 'danger';
      if (options.stopCondition === 'next_completion' && outcome.completed) stoppedBy = 'next_completion';
      if (stoppedBy || processed >= maxBoundaries) break;
      continue;
    }
    if (state.simElapsedMs >= targetSimElapsedMs) break;
    // The target itself has been integrated and has no discrete event.
    break;
  }

  const caughtUp = state.simElapsedMs >= targetSimElapsedMs || stoppedBy !== null;
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
