import { GAME_STATE_SCHEMA_VERSION, type GameState } from '../../contracts/src/index.ts';
import { DAY_MS, HOUR_MS, nextMidnightAfter } from './time.ts';

function nextDailyBoundary(elapsed: number, offset: number): number {
  return offset + (Math.floor((elapsed - offset) / DAY_MS) + 1) * DAY_MS;
}

export function upgradeGameState(value: unknown): GameState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('SAVE_STATE_SCHEMA_INVALID');
  const candidate = structuredClone(value) as Record<string, unknown>;
  if (candidate.schemaVersion === GAME_STATE_SCHEMA_VERSION) return candidate as unknown as GameState;
  if (candidate.schemaVersion !== 1) throw new Error('SAVE_STATE_SCHEMA_UNSUPPORTED');

  const state = candidate as unknown as GameState & {
    clockControl: { status: 'paused' | 'running'; speedPermille: number };
    territory: GameState['territory'] & { tomb: GameState['territory']['tomb'] & { deathQi: { current: number; capacity: number; refillAtWorldTime: string } } };
    player: GameState['player'] & { mana: { current: number; max: number; baseRegenPerSecond: number } };
  };
  if (!Number.isSafeInteger(state.simElapsedMs) || state.simElapsedMs < 0) throw new Error('SAVE_STATE_SCHEMA_INVALID');
  if ((state.territory.tomb.queue as readonly unknown[]).length !== 0 || state.ownedUnits.length !== 0 || state.jobs.length !== 0) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_BLOCKED:_STAGE04_DATA');
  }

  const elapsed = state.simElapsedMs;
  const fire = state.territory.survivalFire;
  const oldClock = state.clockControl;
  const sunsetOffset = 9.5 * HOUR_MS;
  const twilightOffset = 10 * HOUR_MS;
  const boundaries = {
    nextHourlySettlementAtElapsedMs: (Math.floor(elapsed / HOUR_MS) + 1) * HOUR_MS,
    nextMidnightAtElapsedMs: nextMidnightAfter(elapsed),
    nextDailySettlementAtElapsedMs: (Math.floor(elapsed / DAY_MS) + 1) * DAY_MS,
    nextSunsetAtElapsedMs: nextDailyBoundary(elapsed, sunsetOffset),
    nextTwilightEndAtElapsedMs: nextDailyBoundary(elapsed, twilightOffset),
    nextDawnAtElapsedMs: (Math.floor(elapsed / DAY_MS) + 1) * DAY_MS,
    protectionExpiryAtElapsedMs: fire.protectedThroughElapsedMs > elapsed ? fire.protectedThroughElapsedMs : null,
  };
  const migratedFire = {
    ...fire,
    fuelKnowledge: fire.fuelRemaining === null ? 'state_unobserved' as const : 'known' as const,
    nextFuelConsumptionAtElapsedMs: null,
    fuelBlocker: fire.fuelRemaining === null ? 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED' : 'FUEL_DUE_TIME_UNRESOLVED_AFTER_SCHEMA_MIGRATION',
  };
  const { speedPermille } = oldClock;
  return {
    ...state,
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    clockControl: {
      status: oldClock.status,
      selection: oldClock.status === 'paused' ? 'paused' : 'custom',
      speedPermille: oldClock.status === 'paused' ? 0 : Math.max(100, Math.min(3_600_000, Math.round(speedPermille))),
      stopCondition: 'none',
    },
    timeBoundaries: boundaries,
    survival: {
      coldLoadMicro: 0,
      coldLoadRemainder: 0,
      coldStatus: 'weather_unresolved',
      environment: null,
      blocker: 'OPENING_WEATHER_RECORD_NOT_SEEDED',
      hungerState: 'FED',
    },
    player: {
      ...state.player,
      mana: { ...state.player.mana, baseRegenPerSecond: 0.45, lastSettledAtElapsedMs: elapsed },
    },
    territory: {
      ...state.territory,
      survivalFire: migratedFire,
      tomb: {
        ...state.territory.tomb,
        deathQi: { ...state.territory.tomb.deathQi, nextRefillAtElapsedMs: boundaries.nextMidnightAtElapsedMs },
      },
    },
  } as GameState;
}
