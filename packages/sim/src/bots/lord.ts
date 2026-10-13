import type { BotLordActor, BotLordDamageCause, BotLordDeathRecord, CoordinateMm } from '../../../contracts/src/index.ts';

export const BOT_LORD_RULE_VERSION = 'BOT-LORD-PERSONAL-SURVIVAL-1.3';
export const BOT_LORD_ESCAPE_RULE_VERSION = 'BOT-LORD-ROUTED-ESCAPE-1.1';
export const BOT_LORD_MAX_HP = 100;
export const BOT_LORD_HP_MICRO = 1_000_000;
export const BOT_LORD_DAMAGE_BASIS_POINTS_PER_HOUR = {
  food: { below24h: 0, from24h: 50, from72h: 200 },
  water: { below12h: 0, from12h: 200, from36h: 500 },
} as const;
export const BOT_LORD_COLD_RECOVERY_LOAD_PER_MINUTE = 30;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;
const DAMAGE_DENOMINATOR = 10_000n * BigInt(MS_PER_HOUR);
const COLD_LOAD_MICRO = 1_000_000;
const COLD_DAMAGE_LOAD_DENOMINATOR = 900n * BigInt(COLD_LOAD_MICRO);
const NORMAL_HUMAN_ATTRIBUTES = { STR: 10, VIT: 10, DEX: 10, INT: 10, SPI: 10, WIL: 10, PER: 10, PRE: 10, LUK: 10 } as const;

export function createBotLord(botId: string, position: CoordinateMm, atElapsedMs = 0): BotLordActor {
  return {
    id: `LORD:${botId}`, ownerId: botId, profileVersion: 'BOT-NORMAL-HUMAN-LORD-1.0', lifeState: 'alive',
    hpMicro: BOT_LORD_MAX_HP * BOT_LORD_HP_MICRO, maxHpMicro: BOT_LORD_MAX_HP * BOT_LORD_HP_MICRO,
    attributes: NORMAL_HUMAN_ATTRIBUTES, position: { ...position }, location: 'settlement', activity: 'at_settlement',
    foodShortfallMs: 0, waterShortfallMs: 0, coldLoadMicro: 0,
    foodShortfallRemainder: 0, waterShortfallRemainder: 0, foodDamageRemainder: 0, waterDamageRemainder: 0,
    coldLoadRemainder: 0, coldDamageRemainder: 0, healingRemainder: 0,
    carriedFoodMicro: 0, carriedWaterMicro: 0, carriedFoodConsumptionRemainder: 0, carriedWaterConsumptionRemainder: 0,
    equipmentTemplateIds: [], lastIntegratedAtElapsedMs: atElapsedMs,
    activeEncounterId: null, encounterThreatActorId: null, encounterThreatPosition: null,
    retreatDestination: null, retreatRoute: null, retreatDistanceMm: 0, retreatProgressMm: 0,
    retreatStartedAtElapsedMs: null, retreatSpeedMmPerHour: 0, retreatTravelRemainder: 0,
    retreatThreatActorId: null, retreatThreatPosition: null,
    supportProviderId: null, shelterStructureId: null, deathRecord: null,
  };
}

export type LordSurvivalInputs = {
  fromElapsedMs: number;
  toElapsedMs: number;
  foodCoveragePermille: number;
  waterCoveragePermille: number;
  coldLoadRateMicroPerMinute: number;
  resting: boolean;
  support?: BotLordSupportDelivery | null;
};
export type LordSurvivalResult = { lord: BotLordActor; death: BotLordDeathRecord | null };

export type BotLordSupportDelivery = {
  providerId: string;
  foodCoveragePermille: number;
  waterCoveragePermille: number;
  coldLoadReductionMicroPerMinute: number;
  shelterStructureId: string | null;
};

/**
 * Narrow handoff for future faction/merger systems. Providers must resolve
 * physically accessible supplies, heat, and shelter for this lord and interval.
 */
export interface BotLordSupportProvider {
  readonly id: string;
  supportFor(lord: BotLordActor, fromElapsedMs: number, toElapsedMs: number): BotLordSupportDelivery | null;
}

export function resolveBotLordSupport(
  provider: BotLordSupportProvider | null,
  lord: BotLordActor,
  fromElapsedMs: number,
  toElapsedMs: number,
): BotLordSupportDelivery | null {
  if (!provider || lord.lifeState !== 'alive') return null;
  const support = provider.supportFor(lord, fromElapsedMs, toElapsedMs);
  if (!support) return null;
  if (support.providerId !== provider.id || !provider.id
    || ![support.foodCoveragePermille, support.waterCoveragePermille, support.coldLoadReductionMicroPerMinute].every(Number.isSafeInteger)
    || support.foodCoveragePermille < 0 || support.foodCoveragePermille > 1_000
    || support.waterCoveragePermille < 0 || support.waterCoveragePermille > 1_000
    || support.coldLoadReductionMicroPerMinute < 0
    || !(support.shelterStructureId === null || typeof support.shelterStructureId === 'string')) {
    throw new Error('BOT_LORD_SUPPORT_DELIVERY_INVALID');
  }
  return support;
}

function terminateBotLord(lordInput: BotLordActor, contributors: readonly BotLordDamageCause[], precedingHpMicro: number, atElapsedMs: number, deathEventId: string): BotLordActor {
  if (lordInput.lifeState === 'dead') return lordInput;
  if (lordInput.hpMicro !== 0 || !Number.isSafeInteger(precedingHpMicro) || precedingHpMicro <= 0
    || contributors.length === 0 || !Number.isSafeInteger(atElapsedMs)
    || atElapsedMs < lordInput.lastIntegratedAtElapsedMs) throw new Error('BOT_LORD_DEATH_PREDICATE_INVALID');
  const ordered = [...new Set(contributors)];
  const primaryCause = ordered[0]!;
  const deathRecord: BotLordDeathRecord = {
    deathEventId, atElapsedMs, primaryCause, contributors: ordered, precedingHpMicro,
    position: { ...lordInput.position },
    foodShortfallMs: lordInput.foodShortfallMs,
    waterShortfallMs: lordInput.waterShortfallMs,
    coldLoadMicro: lordInput.coldLoadMicro,
    carriedFoodMicro: lordInput.carriedFoodMicro,
    carriedWaterMicro: lordInput.carriedWaterMicro,
    supportProviderId: lordInput.supportProviderId,
    shelterStructureId: lordInput.shelterStructureId,
  };
  return { ...lordInput, hpMicro: 0, lifeState: 'dead', deathRecord, lastIntegratedAtElapsedMs: atElapsedMs };
}

function applyResolvedDamageMicro(
  lordInput: BotLordActor,
  damageMicro: number,
  contributors: readonly BotLordDamageCause[],
  atElapsedMs: number,
  eventIdentity: string,
): BotLordActor {
  if (lordInput.lifeState === 'dead') return lordInput;
  if (!Number.isSafeInteger(damageMicro) || damageMicro <= 0 || !Number.isSafeInteger(atElapsedMs)
    || atElapsedMs < lordInput.lastIntegratedAtElapsedMs || !contributors.length) throw new Error('BOT_LORD_DAMAGE_INVALID');
  const precedingHpMicro = lordInput.hpMicro;
  const hpMicro = Math.max(0, precedingHpMicro - damageMicro);
  const wounded = { ...lordInput, hpMicro, lastIntegratedAtElapsedMs: atElapsedMs };
  if (hpMicro > 0) return wounded;
  const ordered = [...new Set(contributors)];
  return terminateBotLord(wounded, ordered, precedingHpMicro, atElapsedMs, `${lordInput.id}:DEATH:${eventIdentity}`);
}

function foodDamageRateBasisPoints(shortfallMs: number): number {
  return shortfallMs >= 72 * MS_PER_HOUR ? BOT_LORD_DAMAGE_BASIS_POINTS_PER_HOUR.food.from72h
    : shortfallMs >= 24 * MS_PER_HOUR ? BOT_LORD_DAMAGE_BASIS_POINTS_PER_HOUR.food.from24h : 0;
}
function waterDamageRateBasisPoints(shortfallMs: number): number {
  return shortfallMs >= 36 * MS_PER_HOUR ? BOT_LORD_DAMAGE_BASIS_POINTS_PER_HOUR.water.from36h
    : shortfallMs >= 12 * MS_PER_HOUR ? BOT_LORD_DAMAGE_BASIS_POINTS_PER_HOUR.water.from12h : 0;
}

function timeToShortfallBoundary(shortfallMs: number, remainder: number, coveragePermille: number, boundaries: readonly number[]): number | null {
  let next: number | null = null;
  if (coveragePermille < 1_000) {
    const gainPermille = 1_000 - coveragePermille;
    for (const boundary of boundaries) if (boundary > shortfallMs) {
      const needed = (boundary - shortfallMs) * 1_000 - remainder;
      const duration = Math.max(1, Math.ceil(needed / gainPermille));
      next = next === null ? duration : Math.min(next, duration);
      break;
    }
  } else if (shortfallMs > 0) {
    const lowerBoundary = boundaries.slice().reverse().find(boundary => boundary < shortfallMs) ?? 0;
    next = Math.max(1, Math.ceil((shortfallMs - lowerBoundary) / 2));
  }
  return next;
}

function timeToColdBoundary(lord: BotLordActor, signedRateMicroPerMinute: number): number | null {
  const thresholds = [0, 300, 600, 900, 1_200].map(value => value * COLD_LOAD_MICRO);
  if (signedRateMicroPerMinute > 0) {
    const next = thresholds.find(value => value > lord.coldLoadMicro);
    if (next === undefined) return null;
    return Math.max(1, Math.ceil(((next - lord.coldLoadMicro) * MS_PER_MINUTE - lord.coldLoadRemainder) / signedRateMicroPerMinute));
  }
  if (signedRateMicroPerMinute < 0) {
    const next = thresholds.slice().reverse().find(value => value < lord.coldLoadMicro);
    if (next === undefined) return null;
    return Math.max(1, Math.ceil(((lord.coldLoadMicro - next) * MS_PER_MINUTE + lord.coldLoadRemainder) / -signedRateMicroPerMinute));
  }
  return null;
}

const MS_PER_HOUR_BIGINT = BigInt(MS_PER_HOUR);

function routePositionAt(points: readonly CoordinateMm[], distanceMm: number): CoordinateMm {
  if (points.length === 0) throw new Error('BOT_LORD_RETREAT_ROUTE_EMPTY');
  let remaining = Math.max(0, distanceMm);
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const length = Math.round(Math.hypot(to.xMm - from.xMm, to.yMm - from.yMm));
    if (remaining <= length || index === points.length - 1) {
      const progress = length <= 0 ? 1 : Math.max(0, Math.min(1, remaining / length));
      return {
        xMm: Math.round(from.xMm + (to.xMm - from.xMm) * progress),
        yMm: Math.round(from.yMm + (to.yMm - from.yMm) * progress),
        sourceZMetres: from.sourceZMetres ?? to.sourceZMetres ?? 0,
      };
    }
    remaining -= length;
  }
  return { ...points.at(-1)! };
}

function timeToRetreatArrival(lord: BotLordActor): number | null {
  if (!lord.retreatRoute || lord.retreatSpeedMmPerHour <= 0) return null;
  const remainingMm = Math.max(0, lord.retreatDistanceMm - lord.retreatProgressMm);
  if (remainingMm <= 0) return 1;
  const numerator = BigInt(remainingMm) * MS_PER_HOUR_BIGINT - BigInt(lord.retreatTravelRemainder);
  return Math.max(1, Number((numerator + BigInt(lord.retreatSpeedMmPerHour) - 1n) / BigInt(lord.retreatSpeedMmPerHour)));
}

/** Absolute owner-row time at which a persisted escape route finishes. */
export function botLordRetreatArrivalAt(lord: BotLordActor): number | null {
  const duration = timeToRetreatArrival(lord);
  return duration === null ? null : lord.lastIntegratedAtElapsedMs + duration;
}

function advanceLordAlongRetreat(lordInput: BotLordActor, durationMs: number): BotLordActor {
  if (!lordInput.retreatRoute) return lordInput;
  if (!Number.isSafeInteger(lordInput.retreatSpeedMmPerHour) || lordInput.retreatSpeedMmPerHour <= 0
    || !Number.isSafeInteger(lordInput.retreatDistanceMm) || lordInput.retreatDistanceMm <= 0
    || !Number.isSafeInteger(lordInput.retreatProgressMm) || lordInput.retreatProgressMm < 0
    || !Number.isSafeInteger(lordInput.retreatTravelRemainder) || lordInput.retreatTravelRemainder < 0
    || lordInput.retreatTravelRemainder >= MS_PER_HOUR) throw new Error('BOT_LORD_RETREAT_STATE_INVALID');
  const numerator = BigInt(lordInput.retreatSpeedMmPerHour) * BigInt(durationMs) + BigInt(lordInput.retreatTravelRemainder);
  const travelledMm = Number(numerator / MS_PER_HOUR_BIGINT);
  const remainder = Number(numerator % MS_PER_HOUR_BIGINT);
  const progressMm = Math.min(lordInput.retreatDistanceMm, lordInput.retreatProgressMm + travelledMm);
  const position = routePositionAt(lordInput.retreatRoute, progressMm);
  if (progressMm >= lordInput.retreatDistanceMm) return {
    ...lordInput, position, location: 'field', activity: 'resting', activeEncounterId: null,
    encounterThreatActorId: null, encounterThreatPosition: null,
    retreatDestination: null, retreatRoute: null, retreatDistanceMm: 0, retreatProgressMm: 0,
    retreatStartedAtElapsedMs: null, retreatSpeedMmPerHour: 0, retreatTravelRemainder: 0,
    retreatThreatActorId: null, retreatThreatPosition: null,
  };
  return { ...lordInput, position, retreatProgressMm: progressMm, retreatTravelRemainder: remainder };
}

type PieceResult = { lord: BotLordActor; damage: Record<BotLordDamageCause, number>; elapsedMs: number };

function integratePiece(lord: BotLordActor, durationMs: number, inputs: LordSurvivalInputs): PieceResult {
  const foodRate = foodDamageRateBasisPoints(lord.foodShortfallMs);
  const waterRate = waterDamageRateBasisPoints(lord.waterShortfallMs);
  const foodNumerator = BigInt(lord.maxHpMicro) * BigInt(foodRate) * BigInt(durationMs) + BigInt(lord.foodDamageRemainder);
  const waterNumerator = BigInt(lord.maxHpMicro) * BigInt(waterRate) * BigInt(durationMs) + BigInt(lord.waterDamageRemainder);
  const foodDenominator = DAMAGE_DENOMINATOR;
  const foodDamage = Number(foodNumerator / foodDenominator);
  const waterDamage = Number(waterNumerator / foodDenominator);
  const foodDamageRemainder = Number(foodNumerator % foodDenominator);
  const waterDamageRemainder = Number(waterNumerator % foodDenominator);

  const signedColdRate = inputs.coldLoadRateMicroPerMinute > 0 ? inputs.coldLoadRateMicroPerMinute
    : lord.coldLoadMicro > 0 ? -BOT_LORD_COLD_RECOVERY_LOAD_PER_MINUTE * COLD_LOAD_MICRO : 0;
  const coldNumerator = BigInt(durationMs) * BigInt(Math.abs(signedColdRate)) + BigInt(lord.coldLoadRemainder);
  const coldDelta = Number(coldNumerator / BigInt(MS_PER_MINUTE));
  const coldLoadMicro = Math.min(1_200 * COLD_LOAD_MICRO, Math.max(0, lord.coldLoadMicro + Math.sign(signedColdRate) * coldDelta));
  const coldLoadRemainder = Number(coldNumerator % BigInt(MS_PER_MINUTE));
  const damagingLoadIncrement = signedColdRate > 0
    ? Math.max(0, coldLoadMicro - Math.max(lord.coldLoadMicro, 300 * COLD_LOAD_MICRO)) : 0;
  const coldDamageNumerator = BigInt(lord.maxHpMicro) * BigInt(damagingLoadIncrement) + BigInt(lord.coldDamageRemainder);
  const coldDamage = Number(coldDamageNumerator / COLD_DAMAGE_LOAD_DENOMINATOR);
  const coldDamageRemainder = Number(coldDamageNumerator % COLD_DAMAGE_LOAD_DENOMINATOR);

  let foodShortfallMs = lord.foodShortfallMs;
  let foodShortfallRemainder = lord.foodShortfallRemainder;
  if (inputs.foodCoveragePermille < 1_000) {
    const shortageNumerator = BigInt(durationMs) * BigInt(1_000 - inputs.foodCoveragePermille) + BigInt(foodShortfallRemainder);
    foodShortfallMs += Number(shortageNumerator / 1_000n);
    foodShortfallRemainder = Number(shortageNumerator % 1_000n);
  } else {
    foodShortfallMs = Math.max(0, foodShortfallMs - durationMs * 2);
    foodShortfallRemainder = 0;
  }
  let waterShortfallMs = lord.waterShortfallMs;
  let waterShortfallRemainder = lord.waterShortfallRemainder;
  if (inputs.waterCoveragePermille < 1_000) {
    const shortageNumerator = BigInt(durationMs) * BigInt(1_000 - inputs.waterCoveragePermille) + BigInt(waterShortfallRemainder);
    waterShortfallMs += Number(shortageNumerator / 1_000n);
    waterShortfallRemainder = Number(shortageNumerator % 1_000n);
  } else {
    waterShortfallMs = Math.max(0, waterShortfallMs - durationMs * 2);
    waterShortfallRemainder = 0;
  }

  let healingRemainder = lord.healingRemainder;
  let healing = 0;
  if ((inputs.resting || lord.activity === 'resting') && inputs.foodCoveragePermille === 1_000 && inputs.waterCoveragePermille === 1_000
    && lord.foodShortfallMs === 0 && lord.waterShortfallMs === 0 && lord.coldLoadMicro === 0
    && foodRate === 0 && waterRate === 0 && damagingLoadIncrement === 0) {
    const healingNumerator = BigInt(lord.maxHpMicro) * BigInt(durationMs) + BigInt(healingRemainder);
    healing = Number(healingNumerator / BigInt(100 * MS_PER_HOUR));
    healingRemainder = Number(healingNumerator % BigInt(100 * MS_PER_HOUR));
  }
  const totalDamage = foodDamage + waterDamage + coldDamage;
  const movedLord = advanceLordAlongRetreat(lord, durationMs);
  return {
    elapsedMs: durationMs,
    damage: { combat: 0, food_deprivation: foodDamage, water_deprivation: waterDamage, cold: coldDamage },
    lord: {
      ...movedLord, hpMicro: Math.min(lord.maxHpMicro, lord.hpMicro - totalDamage + healing),
      foodShortfallMs, waterShortfallMs, foodShortfallRemainder, waterShortfallRemainder,
      foodDamageRemainder, waterDamageRemainder, coldLoadMicro, coldLoadRemainder, coldDamageRemainder, healingRemainder,
      lastIntegratedAtElapsedMs: lord.lastIntegratedAtElapsedMs + durationMs,
    },
  };
}

function damageWithin(lord: BotLordActor, durationMs: number, inputs: LordSurvivalInputs): PieceResult {
  const result = integratePiece(lord, durationMs, inputs);
  if (result.lord.hpMicro > 0) return result;
  let low = 1;
  let high = durationMs;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (integratePiece(lord, middle, inputs).lord.hpMicro <= 0) high = middle;
    else low = middle + 1;
  }
  return integratePiece(lord, low, inputs);
}

/** Analytic, boundary-split survival integration. It is independent of resident/cohort counts. */
export function integrateBotLord(lordInput: BotLordActor, inputs: LordSurvivalInputs): LordSurvivalResult {
  if (lordInput.lifeState === 'dead') return { lord: lordInput, death: lordInput.deathRecord };
  const support = inputs.support ?? null;
  if (support && (!support.providerId || ![support.foodCoveragePermille, support.waterCoveragePermille, support.coldLoadReductionMicroPerMinute].every(Number.isSafeInteger)
    || support.foodCoveragePermille < 0 || support.foodCoveragePermille > 1_000
    || support.waterCoveragePermille < 0 || support.waterCoveragePermille > 1_000 || support.coldLoadReductionMicroPerMinute < 0
    || !(support.shelterStructureId === null || typeof support.shelterStructureId === 'string'))) throw new Error('BOT_LORD_SUPPORT_DELIVERY_INVALID');
  const effectiveInputs: LordSurvivalInputs = {
    ...inputs,
    foodCoveragePermille: Math.min(1_000, inputs.foodCoveragePermille + (support?.foodCoveragePermille ?? 0)),
    waterCoveragePermille: Math.min(1_000, inputs.waterCoveragePermille + (support?.waterCoveragePermille ?? 0)),
    coldLoadRateMicroPerMinute: Math.max(0, inputs.coldLoadRateMicroPerMinute - (support?.coldLoadReductionMicroPerMinute ?? 0)),
  };
  const values = [effectiveInputs.fromElapsedMs, effectiveInputs.toElapsedMs, effectiveInputs.foodCoveragePermille, effectiveInputs.waterCoveragePermille, effectiveInputs.coldLoadRateMicroPerMinute];
  if (!values.every(Number.isSafeInteger) || effectiveInputs.fromElapsedMs !== lordInput.lastIntegratedAtElapsedMs
    || effectiveInputs.toElapsedMs < effectiveInputs.fromElapsedMs || effectiveInputs.foodCoveragePermille < 0 || effectiveInputs.foodCoveragePermille > 1_000
    || effectiveInputs.waterCoveragePermille < 0 || effectiveInputs.waterCoveragePermille > 1_000 || effectiveInputs.coldLoadRateMicroPerMinute < 0
    || lordInput.hpMicro <= 0 || lordInput.hpMicro > lordInput.maxHpMicro) throw new Error('BOT_LORD_SURVIVAL_STATE_INVALID');
  let lord = { ...lordInput, supportProviderId: support?.providerId ?? null,
    shelterStructureId: support?.shelterStructureId ?? lordInput.shelterStructureId };
  let cursor = effectiveInputs.fromElapsedMs;
  const end = effectiveInputs.toElapsedMs;
  while (cursor < end && lord.lifeState === 'alive') {
    const remaining = end - cursor;
    const coldRate = effectiveInputs.coldLoadRateMicroPerMinute > 0 ? effectiveInputs.coldLoadRateMicroPerMinute
      : lord.coldLoadMicro > 0 ? -BOT_LORD_COLD_RECOVERY_LOAD_PER_MINUTE * COLD_LOAD_MICRO : 0;
    const boundaries = [
      timeToShortfallBoundary(lord.foodShortfallMs, lord.foodShortfallRemainder, effectiveInputs.foodCoveragePermille, [0, 24, 72].map(hour => hour * MS_PER_HOUR)),
      timeToShortfallBoundary(lord.waterShortfallMs, lord.waterShortfallRemainder, effectiveInputs.waterCoveragePermille, [0, 12, 36].map(hour => hour * MS_PER_HOUR)),
      timeToColdBoundary(lord, coldRate),
      timeToRetreatArrival(lord),
    ].filter((value): value is number => value !== null && value > 0);
    const duration = Math.min(remaining, ...boundaries);
    if (duration < 1) throw new Error('BOT_LORD_BOUNDARY_NOT_ADVANCING');
    const piece = damageWithin(lord, duration, effectiveInputs);
    const died = piece.lord.hpMicro <= 0;
    if (died) {
      const precedingPiece = piece.elapsedMs > 1 ? integratePiece(lord, piece.elapsedMs - 1, effectiveInputs) : null;
      const precedingLord = precedingPiece?.lord ?? lord;
      const fatalPiece = integratePiece(precedingLord, 1, effectiveInputs);
      if (fatalPiece.lord.hpMicro > 0) throw new Error('BOT_LORD_FATAL_MILLISECOND_INVALID');
      const causes = (['cold', 'food_deprivation', 'water_deprivation'] as const)
        .filter(cause => fatalPiece.damage[cause] > 0);
      const primaryCause = causes[0];
      if (!primaryCause) throw new Error('BOT_LORD_DEATH_WITHOUT_DAMAGE');
      const atElapsedMs = cursor + piece.elapsedMs;
      const base = { ...fatalPiece.lord, hpMicro: precedingLord.hpMicro, lifeState: 'alive' as const, deathRecord: null };
      lord = applyResolvedDamageMicro(base, fatalPiece.damage.cold + fatalPiece.damage.food_deprivation + fatalPiece.damage.water_deprivation,
        causes, atElapsedMs, `${atElapsedMs}:${primaryCause}`);
      return { lord, death: lord.deathRecord };
    }
    lord = piece.lord;
    cursor += piece.elapsedMs;
  }
  return { lord, death: null };
}

export function damageBotLord(lordInput: BotLordActor, amountHp: number, cause: BotLordDamageCause, atElapsedMs: number, encounterId: string): BotLordActor {
  if (lordInput.lifeState === 'dead') return lordInput;
  if (!Number.isFinite(amountHp) || amountHp <= 0 || !Number.isSafeInteger(atElapsedMs) || atElapsedMs < lordInput.lastIntegratedAtElapsedMs) {
    throw new Error('BOT_LORD_DAMAGE_INVALID');
  }
  const damageMicro = Math.max(1, Math.round(amountHp * BOT_LORD_HP_MICRO));
  return applyResolvedDamageMicro(lordInput, damageMicro, [cause], atElapsedMs, `${atElapsedMs}:${encounterId}`);
}

/** Converts a resolved regional cold exposure into load and the same HP-zero damage path. */
export function applyBotLordColdExposure(lordInput: BotLordActor, exposureMs: number, atElapsedMs: number, eventIdentity: string): BotLordActor {
  if (lordInput.lifeState === 'dead' || exposureMs <= 0) return lordInput;
  if (!Number.isSafeInteger(exposureMs) || !Number.isSafeInteger(atElapsedMs) || atElapsedMs < lordInput.lastIntegratedAtElapsedMs) {
    throw new Error('BOT_LORD_COLD_EXPOSURE_INVALID');
  }
  const rateMicroPerMinute = 20_000_000;
  const loadNumerator = BigInt(exposureMs) * BigInt(rateMicroPerMinute) + BigInt(lordInput.coldLoadRemainder);
  const delta = Number(loadNumerator / BigInt(MS_PER_MINUTE));
  const coldLoadMicro = Math.min(1_200 * COLD_LOAD_MICRO, lordInput.coldLoadMicro + delta);
  const coldLoadRemainder = Number(loadNumerator % BigInt(MS_PER_MINUTE));
  const damagingIncrement = Math.max(0, coldLoadMicro - Math.max(lordInput.coldLoadMicro, 300 * COLD_LOAD_MICRO));
  const damageNumerator = BigInt(lordInput.maxHpMicro) * BigInt(damagingIncrement) + BigInt(lordInput.coldDamageRemainder);
  const damageMicro = Number(damageNumerator / COLD_DAMAGE_LOAD_DENOMINATOR);
  const coldDamageRemainder = Number(damageNumerator % COLD_DAMAGE_LOAD_DENOMINATOR);
  const updated = { ...lordInput, coldLoadMicro, coldLoadRemainder, coldDamageRemainder };
  return damageMicro > 0 ? applyResolvedDamageMicro(updated, damageMicro, ['cold'], atElapsedMs, `${eventIdentity}:cold`) : updated;
}

export const botLordDamageRateBasisPoints = { foodDamageRateBasisPoints, waterDamageRateBasisPoints };
