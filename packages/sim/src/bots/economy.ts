import type { BotActionReceipt, BotBlueprintItem, BotCargoKey, BotColdRecord, BotMarketListing, BotMarketTransaction, BotOwnedChest, BotPlanState, BotResourceKey, BotSearchSource, BotSharedWildlifeStock, BotStateChunk, BotStructureInstance, BotTalentGrade, BotTalentKind, BotWorkKind, CoordinateMm, FieldChest, GameState, WorldDefinition } from '../../../contracts/src/index.ts';
import { canonicalStateHash, randomIntFromFields } from '../hash.ts';
import { playerLevelThreshold } from '../stage07.ts';
import { OPENING_LEVEL_BOARD_ID, OPENING_LEVEL_CLOSES_AT_MS, OPENING_LEVEL_DISPLAY_DELAY_MS, OPENING_LEVEL_OPENS_AT_MS, rankOpeningLevelCompletions } from '../openingRanking.ts';
import { resolveSquadCasualty } from '../combat.ts';
import { deterministicChestOutcome } from '../chestLoot.ts';
import { BOT_COMBAT_RULE_VERSION, botCohortPower, botHomeCohortCounts, botMovementCohortCounts, botSettlementDefensePermille, resolveBotBattle, resolveBotSettlementBattle } from './combat.ts';
import { BOT_BLUEPRINT_BY_ID, BOT_BLUEPRINT_LOOT_RULES, BOT_BLUEPRINT_RULES_VERSION } from './blueprints.ts';
import { chooseBotDecision, spendableBotResources, BOT_WORK_CODE, BOT_WORK_FROM_CODE } from './planner.ts';
import { BOT_ACTIVITY_XP_RULE_VERSION, BOT_CHEST_RULE_VERSION, BOT_EQUIPMENT_RULE_VERSION, BOT_EVENT_REWARD_RULE_VERSION, BOT_HUNT_RULE_VERSION, BOT_LOCAL_ICE_STOCK_ML, BOT_LORD_COLD_FATAL_MS, BOT_LORD_DEHYDRATION_FATAL_MS, BOT_LORD_STARVATION_FATAL_MS, BOT_MICRO, BOT_RECOVERY_RULE_VERSION, BOT_REPAIR_RULE_VERSION, BOT_SHARED_WILDLIFE_RULE_VERSION, BOT_SIMULATION_RULE_VERSION, BOT_SURVIVAL_RULE_VERSION, BOT_UPKEEP_UNITS_PER_PERSON_HOUR, BOT_WATER_CAPACITY_ML, BOT_WATER_ML_PER_PERSON_PER_DAY, BOT_WATER_PREPARATION_FIREWOOD_UNITS, BOT_WATER_PREPARATION_YIELD_ML, appendBotActionReceipt, botConstructionPermille, botTalentXpMultiplierPermille, botRowHash, finishBotPopulationAdvance, heapifyBotScheduler, hydrateBotHotArrays, isBotPopulationAdvanceInProgress, markBotPopulationChunkChanged, markBotSharedWildlifeChanged, popBotScheduler, prepareBotPopulationMutation, pushBotScheduler, serializeBotHotArrays, botChunkHash } from './state.ts';
import { botArmyPosition } from './movement.ts';
import type { BotPopulationState } from '../../../contracts/src/index.ts';
import type { MutableBotHotArrays } from './state.ts';
import { BOT_MARKET_ACCESS_RADIUS_MM, BOT_MARKET_LISTING_DURATION_MS, BOT_MARKET_MAX_LISTINGS_PER_BOT, BOT_MARKET_MAX_REPRICES, BOT_MARKET_REPRICE_INTERVAL_MS, BOT_MARKET_RULE_VERSION, botMarketAsk } from './market.ts';
import { botTerritoryCapacityPermille, botTerritoryHousingBonus, botTerritoryUpgradeFor, BOT_TERRITORY_RULE_VERSION } from './territory.ts';
import { BOT_WEATHER_MAX_COLD_EXPOSURE_MS, BOT_WEATHER_RULE_VERSION, botWeatherFuelDemand, nextBotWeatherStormAt } from './weather.ts';

export const BOT_ECONOMY_RULE_VERSION = 'BOT-FINITE-ECONOMY-1.0';
export { BOT_ACTIVITY_XP_RULE_VERSION };
export const BOT_GATHER_RATES_UNITS_PER_HOUR = { food: 4.5, wood: 3.6, firewood: 2.4, stone: 2.8, ore: 1.4 } as const;
export const BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR = { farmFood: 6, millWood: 4.2, quarryStone: 3.2, workshopOre: 1.2 } as const;
export { BOT_UPKEEP_UNITS_PER_PERSON_HOUR };
export const BOT_STARVATION_LOSS_INTERVAL_MS = 12 * 60 * 60_000;
export const BOT_COLD_LOSS_INTERVAL_MS = 24 * 60 * 60_000;
export const BOT_RESOURCE_CAP_UNITS = { food: 1_800, wood: 1_200, stone: 900, ore: 400, firewood: 450 } as const;
export const BOT_EVENT_FOOD_ITEM_UNITS = { MEAT: 1, BREAD: 1 } as const;
export const BOT_INITIAL_TERRITORY_OVERLAY = 'BOT-SETTLEMENT-ECONOMY-1.0';
const BOT_ARMY_TRAVEL_MM_PER_HOUR = 3_500_000;
export const BOT_OPENING_SCORE_RULE_VERSION = 'BOT-OPENING-LEVEL-10-RECEIPT-1.0';

export function botResourceCapacityUnits(resource: keyof typeof BOT_RESOURCE_CAP_UNITS, territoryLevel: number): number {
  return Math.floor(BOT_RESOURCE_CAP_UNITS[resource] * botTerritoryCapacityPermille(territoryLevel) / 1_000);
}

export type BotSimulationEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };
type Rates = {
  foodProduced: number; foodHarvested: number; foodConsumed: number;
  woodProduced: number; woodHarvested: number;
  stoneProduced: number; stoneHarvested: number;
  oreProduced: number; oreHarvested: number;
  firewoodProduced: number; firewoodHarvested: number; firewoodConsumed: number;
};
type BotWakeEntry = { atElapsedMs: number; offset: number; generation: number };
type BotWorkingChunk = {
  hot: MutableBotHotArrays;
  coldRows: BotColdRecord[];
  dirtyOffsets: Set<number>;
  wakeHeap: BotWakeEntry[];
  wakeGenerations: number[];
  wakeDirtyOffsets: Set<number>;
};
type BotNumericRows = BotStateChunk | MutableBotHotArrays;
const workingChunks = new WeakMap<BotStateChunk[], Map<number, BotWorkingChunk>>();

function botWakeLess(left: BotWakeEntry, right: BotWakeEntry): boolean {
  return left.atElapsedMs < right.atElapsedMs
    || (left.atElapsedMs === right.atElapsedMs && left.offset < right.offset);
}

function pushBotWake(heap: BotWakeEntry[], value: BotWakeEntry): void {
  heap.push(value);
  let child = heap.length - 1;
  while (child > 0) {
    const parent = Math.floor((child - 1) / 2);
    if (!botWakeLess(heap[child]!, heap[parent]!)) break;
    [heap[child], heap[parent]] = [heap[parent]!, heap[child]!];
    child = parent;
  }
}

function popBotWake(heap: BotWakeEntry[]): BotWakeEntry | null {
  if (heap.length === 0) return null;
  const root = heap[0]!;
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let parent = 0;
    for (;;) {
      const left = parent * 2 + 1;
      const right = left + 1;
      let smallest = parent;
      if (left < heap.length && botWakeLess(heap[left]!, heap[smallest]!)) smallest = left;
      if (right < heap.length && botWakeLess(heap[right]!, heap[smallest]!)) smallest = right;
      if (smallest === parent) break;
      [heap[parent], heap[smallest]] = [heap[smallest]!, heap[parent]!];
      parent = smallest;
    }
  }
  return root;
}

function discardStaleBotWakes(working: BotWorkingChunk): void {
  while (working.wakeHeap.length > 0) {
    const next = working.wakeHeap[0]!;
    if (working.wakeGenerations[next.offset] === next.generation
      && working.hot.nextWakeAtElapsedMs[next.offset] === next.atElapsedMs) return;
    popBotWake(working.wakeHeap);
  }
}

function rescheduleChangedBotWakes(working: BotWorkingChunk): void {
  for (const offset of working.wakeDirtyOffsets) {
    const generation = (working.wakeGenerations[offset] ?? 0) + 1;
    working.wakeGenerations[offset] = generation;
    pushBotWake(working.wakeHeap, { atElapsedMs: working.hot.nextWakeAtElapsedMs[offset]!, offset, generation });
  }
  working.wakeDirtyOffsets.clear();
  discardStaleBotWakes(working);
}

function takeDueBotWakes(working: BotWorkingChunk, atElapsedMs: number): number[] {
  const offsets: number[] = [];
  discardStaleBotWakes(working);
  while (working.wakeHeap[0] && working.wakeHeap[0]!.atElapsedMs <= atElapsedMs) {
    const entry = popBotWake(working.wakeHeap)!;
    if (working.wakeGenerations[entry.offset] !== entry.generation
      || working.hot.nextWakeAtElapsedMs[entry.offset] !== entry.atElapsedMs) continue;
    offsets.push(entry.offset);
    discardStaleBotWakes(working);
  }
  return offsets;
}

function workingChunk(population: BotPopulationState, chunk: BotStateChunk): BotWorkingChunk {
  const chunks = population.chunks as BotStateChunk[];
  let cache = workingChunks.get(chunks);
  if (!cache) { cache = new Map(); workingChunks.set(chunks, cache); }
  let working = cache.get(chunk.index);
  if (!working) {
    const hot = hydrateBotHotArrays(chunk);
    working = {
      hot,
      coldRows: [...chunk.cold],
      dirtyOffsets: new Set(),
      wakeHeap: [],
      wakeGenerations: Array.from({ length: chunk.count }, () => 0),
      wakeDirtyOffsets: new Set(),
    };
    for (let offset = 0; offset < chunk.count; offset += 1) {
      pushBotWake(working.wakeHeap, { atElapsedMs: hot.nextWakeAtElapsedMs[offset]!, offset, generation: 0 });
    }
    cache.set(chunk.index, working);
  }
  return working;
}

/** Materialize changed hot rows once per dirty chunk at an advance/board snapshot boundary. */
export function flushBotPopulationChunks(population: BotPopulationState | null | undefined): BotPopulationState | null {
  if (!population) return null;
  const chunks = population.chunks as BotStateChunk[];
  const cache = workingChunks.get(chunks);
  if (!cache) return population;
  for (const [index, working] of cache) {
    if (working.dirtyOffsets.size === 0) continue;
    const source = chunks[index];
    if (!source) throw new Error(`BOT_CHUNK_FLUSH_MISSING:${index}`);
    const serialized = { ...serializeBotHotArrays(source, working.hot), cold: working.coldRows } as BotStateChunk;
    const rowSha256 = source.rowSha256.slice();
    for (const offset of working.dirtyOffsets) rowSha256[offset] = botRowHash(serialized, offset);
    const withoutHash = { ...serialized, rowSha256, chunkSha256: '' } as BotStateChunk;
    chunks[index] = { ...withoutHash, chunkSha256: botChunkHash(withoutHash) };
    markBotPopulationChunkChanged(population);
  }
  workingChunks.delete(chunks);
  return population;
}

const resourceFields = {
  food: ['foodMicro', 'foodRemainder', 'foodNodeMicro', 'reservedFoodMicro'],
  wood: ['woodMicro', 'woodRemainder', 'woodNodeMicro', 'reservedWoodMicro'],
  stone: ['stoneMicro', 'stoneRemainder', 'stoneNodeMicro', 'reservedStoneMicro'],
  ore: ['oreMicro', 'oreRemainder', 'oreNodeMicro', 'reservedOreMicro'],
} as const;

function perHourToMicroPerSecond(units: number): number { return Math.round(units * BOT_MICRO / 3_600); }
function toWholeMicro(value: number): number { return Math.max(0, Math.floor(value / BOT_MICRO)); }
function compareId(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

function productionRates(cold: BotColdRecord, chunk: BotNumericRows, offset: number): Rates {
  const workers = cold.workforce;
  const farms = chunk.farmCount[offset]!;
  const mills = chunk.millCount[offset]!;
  const quarries = chunk.quarryCount[offset]!;
  const gatherFood = workers.gatherFood * BOT_GATHER_RATES_UNITS_PER_HOUR.food;
  const farmFood = workers.farmers * BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR.farmFood;
  const gatherWood = workers.gatherWood * BOT_GATHER_RATES_UNITS_PER_HOUR.wood + workers.millWorkers * BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR.millWood;
  const gatherFirewood = workers.gatherWood * BOT_GATHER_RATES_UNITS_PER_HOUR.firewood;
  const gatherStone = workers.gatherStone * BOT_GATHER_RATES_UNITS_PER_HOUR.stone + workers.quarryWorkers * BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR.quarryStone;
  const gatherOre = workers.gatherOre * BOT_GATHER_RATES_UNITS_PER_HOUR.ore + workers.smiths * BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR.workshopOre;
  const population = chunk.population[offset]!;
  return {
    foodProduced: perHourToMicroPerSecond(gatherFood + farmFood),
    foodHarvested: perHourToMicroPerSecond(gatherFood + farmFood),
    foodConsumed: perHourToMicroPerSecond(population * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.food),
    woodProduced: perHourToMicroPerSecond(gatherWood),
    woodHarvested: perHourToMicroPerSecond(gatherWood),
    stoneProduced: perHourToMicroPerSecond(gatherStone),
    stoneHarvested: perHourToMicroPerSecond(gatherStone),
    oreProduced: perHourToMicroPerSecond(gatherOre),
    oreHarvested: perHourToMicroPerSecond(gatherOre),
    firewoodProduced: perHourToMicroPerSecond(gatherFirewood),
    firewoodHarvested: perHourToMicroPerSecond(gatherFirewood),
    firewoodConsumed: perHourToMicroPerSecond(population * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.firewood),
  };
}

function fixedProduct(rateMicroPerSecond: number, durationMs: number, remainder: number): { amount: number; remainder: number } {
  if (![rateMicroPerSecond, durationMs, remainder].every(Number.isSafeInteger) || rateMicroPerSecond < 0 || durationMs < 0 || remainder < 0 || remainder >= 1_000) throw new Error('BOT_FIXED_POINT_INPUT_INVALID');
  const numerator = BigInt(rateMicroPerSecond) * BigInt(durationMs) + BigInt(remainder);
  const amount = Number(numerator / 1_000n);
  const carry = Number(numerator % 1_000n);
  if (!Number.isSafeInteger(amount)) throw new Error('BOT_FIXED_POINT_RANGE_EXCEEDED');
  return { amount, remainder: carry };
}

function applyBalance(hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, key: 'food' | 'wood' | 'stone' | 'ore', produced: number, consumed: number, harvested: number, durationMs: number, territoryLevel: number): void {
  const [balanceKey, remainderKey, nodeKey] = resourceFields[key];
  if (produced !== harvested) throw new Error(`BOT_UNBOUNDED_PRODUCTION_FORBIDDEN:${key}`);
  const nodeRemainderKey = `${key}NodeRemainder` as 'foodNodeRemainder' | 'woodNodeRemainder' | 'stoneNodeRemainder' | 'oreNodeRemainder';
  const harvest = fixedProduct(harvested, durationMs, hot[nodeRemainderKey][offset]!);
  const consumeRemainder = key === 'food' ? hot.foodConsumptionRemainder[offset]! : 0;
  const consumption = fixedProduct(consumed, durationMs, consumeRemainder);
  const cap = botResourceCapacityUnits(key, territoryLevel) * BOT_MICRO;
  const old = hot[balanceKey][offset]!;
  // Only remove a harvested unit from its finite node when storage can accept it
  // or upkeep consumes it during this same segment. Excess production is lost.
  const productionCapacity = Math.max(0, cap - old + consumption.amount);
  const nodeUse = Math.min(hot[nodeKey][offset]!, harvest.amount, productionCapacity);
  const next = Math.max(0, Math.min(cap, old + nodeUse - consumption.amount));
  hot[balanceKey][offset] = next;
  hot[nodeKey][offset] -= nodeUse;
  hot[nodeRemainderKey][offset] = hot[nodeKey][offset] === 0 ? 0 : harvest.remainder;
  hot[remainderKey][offset] = 0;
  if (key === 'food') hot.foodConsumptionRemainder[offset] = consumption.remainder;
}

function applyFirewood(hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, rates: Rates, durationMs: number, territoryLevel: number): void {
  if (rates.firewoodProduced !== rates.firewoodHarvested) throw new Error('BOT_UNBOUNDED_PRODUCTION_FORBIDDEN:firewood');
  const harvest = fixedProduct(rates.firewoodHarvested, durationMs, hot.firewoodNodeRemainder[offset]!);
  const consumption = fixedProduct(rates.firewoodConsumed, durationMs, hot.firewoodConsumptionRemainder[offset]!);
  const cap = botResourceCapacityUnits('firewood', territoryLevel) * BOT_MICRO;
  const old = hot.firewoodMicro[offset]!;
  const productionCapacity = Math.max(0, cap - old + consumption.amount);
  const nodeUse = Math.min(hot.woodNodeMicro[offset]!, harvest.amount, productionCapacity);
  const next = Math.max(0, Math.min(cap, old + nodeUse - consumption.amount));
  hot.woodNodeMicro[offset] -= nodeUse;
  hot.firewoodNodeRemainder[offset] = hot.woodNodeMicro[offset] === 0 ? 0 : harvest.remainder;
  hot.firewoodMicro[offset] = next;
  hot.firewoodRemainder[offset] = 0;
  hot.firewoodConsumptionRemainder[offset] = consumption.remainder;
}

/** Integrates the production and upkeep balances used by live advancement and projections. */
export function integrateBotResourceBalances(cold: BotColdRecord, chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, durationMs: number): void {
  if (!Number.isSafeInteger(durationMs) || durationMs < 0) throw new Error('BOT_RESOURCE_DURATION_INVALID');
  const rates = productionRates(cold, chunk, offset);
  applyBalance(hot, offset, 'food', rates.foodProduced, rates.foodConsumed, rates.foodHarvested, durationMs, cold.territoryLevel);
  // Firewood takes the shared woodland first because it controls cold survival.
  applyFirewood(hot, offset, rates, durationMs, cold.territoryLevel);
  applyBalance(hot, offset, 'wood', rates.woodProduced, 0, rates.woodHarvested, durationMs, cold.territoryLevel);
  applyBalance(hot, offset, 'stone', rates.stoneProduced, 0, rates.stoneHarvested, durationMs, cold.territoryLevel);
  applyBalance(hot, offset, 'ore', rates.oreProduced, 0, rates.oreHarvested, durationMs, cold.territoryLevel);
}

function integrateBotWork(cold: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, from: number, to: number, grade: BotTalentGrade, kind: BotTalentKind): void {
  const plan = cold.currentPlan;
  if (!plan || !['construct', 'repair', 'equip', 'prepare_water', 'learn_blueprint', 'open_chest', 'list_blueprint', 'upgrade_territory'].includes(plan.action) || to <= from) return;
  const multiplier = botConstructionPermille(grade, kind);
  const numerator = BigInt(Math.max(0, plan.workersAssigned)) * BigInt(multiplier) * BigInt(to - from);
  const work = Number(numerator / 1_000n);
  hot.workProgress[offset] = Math.min(hot.workRequired[offset]!, hot.workProgress[offset]! + work);
}

function exposureDuring(balance: number, produced: number, consumed: number, remainder: number, duration: number): number {
  if (balance <= 0) return produced >= consumed ? 0 : duration;
  if (produced >= consumed) return 0;
  const numerator = BigInt(balance) * 1_000n + BigInt(remainder);
  const zeroAt = Number((numerator + BigInt(consumed - produced) - 1n) / BigInt(consumed - produced));
  return Math.max(0, Math.min(duration, duration - zeroAt));
}

function nextExposureBoundaryMs(
  balance: number,
  produced: number,
  consumed: number,
  remainder: number,
  exposureMs: number,
  lossIntervalMs: number,
): number | null {
  if (produced >= consumed) return null;
  const zeroAt = balance > 0
    ? Number((BigInt(balance) * 1_000n + BigInt(remainder) + BigInt(consumed - produced) - 1n) / BigInt(consumed - produced))
    : 0;
  return zeroAt + Math.max(1, lossIntervalMs - exposureMs);
}

/** Find the next state change whose timing must not depend on the caller's step size. */
function nextBotSurvivalBoundary(cold: BotColdRecord, chunk: BotNumericRows, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, from: number): number | null {
  const rates = productionRates(cold, chunk, offset);
  const foodRemainder = hot.foodNodeRemainder[offset]! - hot.foodConsumptionRemainder[offset]!;
  const firewoodRemainder = hot.firewoodNodeRemainder[offset]! - hot.firewoodConsumptionRemainder[offset]!;
  const durations = [
    nextExposureBoundaryMs(hot.foodMicro[offset]!, rates.foodProduced, rates.foodConsumed, foodRemainder,
      cold.starvationExposureMs, BOT_STARVATION_LOSS_INTERVAL_MS),
    nextExposureBoundaryMs(hot.firewoodMicro[offset]!, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder,
      cold.coldExposureMs, BOT_COLD_LOSS_INTERVAL_MS),
  ].filter((value): value is number => value !== null);
  const foodNodeMs = nodeExhaustionMs(hot.foodNodeMicro[offset]!, rates.foodHarvested, hot.foodNodeRemainder[offset]!);
  if (foodNodeMs !== null) durations.push(foodNodeMs);
  const woodlandMs = combinedNodeExhaustionMs(hot.woodNodeMicro[offset]!, rates.firewoodHarvested,
    hot.firewoodNodeRemainder[offset]!, rates.woodHarvested, hot.woodNodeRemainder[offset]!);
  if (woodlandMs !== null) durations.push(woodlandMs);
  const population = hot.population[offset]!;
  const dailyWaterNeed = population * BOT_WATER_ML_PER_PERSON_PER_DAY;
  if (population > 0 && dailyWaterNeed > 0) {
    const waterDepletedMs = cold.potableWaterMl > 0
      ? Math.max(1, Math.ceil((cold.potableWaterMl * 86_400_000 - cold.waterConsumptionRemainder) / dailyWaterNeed))
      : 0;
    durations.push(waterDepletedMs + Math.max(1, 24 * 60 * 60_000 - cold.dehydrationExposureMs));
  }
  if (durations.length === 0) return null;
  return from + Math.min(...durations);
}

function reconcileArmyMovement(cold: BotColdRecord, lostAwayMembers: ReadonlyMap<string, number> = new Map()): BotColdRecord {
  const movement = cold.armyMovement;
  if (!movement || movement.unitKind !== 'army') return cold;
  const selected = botMovementCohortCounts(cold, movement);
  const cohortMemberCounts = cold.cohorts.flatMap(cohort => {
    const memberCount = Math.min(cohort.livingCount, Math.max(0, (selected.get(cohort.id) ?? 0) - (lostAwayMembers.get(cohort.id) ?? 0)));
    return memberCount > 0 ? [{ cohortId: cohort.id, memberCount }] : [];
  });
  const unitCount = cohortMemberCounts.reduce((sum, row) => sum + row.memberCount, 0);
  if (unitCount === 0) return { ...cold, armyMovement: null };
  return { ...cold, armyMovement: { ...movement, unitCount, cohortMemberCounts } };
}

function consumeBotWater(cold: BotColdRecord, population: number, durationMs: number): { cold: BotColdRecord; dehydrationMs: number } {
  if (durationMs <= 0 || population <= 0) return { cold: { ...cold, dehydrationExposureMs: 0 }, dehydrationMs: 0 };
  const dailyNeed = population * BOT_WATER_ML_PER_PERSON_PER_DAY;
  const numerator = BigInt(dailyNeed) * BigInt(durationMs) + BigInt(cold.waterConsumptionRemainder);
  const demandMl = Number(numerator / 86_400_000n);
  const remainder = Number(numerator % 86_400_000n);
  const availableMl = cold.potableWaterMl;
  const dehydrationMs = availableMl > demandMl
    ? 0
    : availableMl === 0 ? durationMs
      : Math.max(0, durationMs - Number((BigInt(availableMl) * 86_400_000n - BigInt(cold.waterConsumptionRemainder) + BigInt(dailyNeed) - 1n) / BigInt(dailyNeed)));
  return {
    cold: { ...cold, potableWaterMl: Math.max(0, availableMl - demandMl), waterConsumptionRemainder: remainder },
    dehydrationMs,
  };
}

function updateLordFate(cold: BotColdRecord, from: number, starvationMs: number, dehydrationMs: number, coldMs: number): BotColdRecord {
  if (cold.lordFate.status !== 'active') return cold;
  const starvation = starvationMs > 0 ? Math.min(BOT_LORD_STARVATION_FATAL_MS, cold.lordStarvationExposureMs + starvationMs) : 0;
  const dehydration = dehydrationMs > 0 ? Math.min(BOT_LORD_DEHYDRATION_FATAL_MS, cold.lordDehydrationExposureMs + dehydrationMs) : 0;
  const chill = coldMs > 0 ? Math.min(BOT_LORD_COLD_FATAL_MS, cold.lordColdExposureMs + coldMs) : 0;
  const candidates = [
    starvation >= BOT_LORD_STARVATION_FATAL_MS ? { at: from + Math.max(0, BOT_LORD_STARVATION_FATAL_MS - cold.lordStarvationExposureMs), cause: 'starvation' as const } : null,
    dehydration >= BOT_LORD_DEHYDRATION_FATAL_MS ? { at: from + Math.max(0, BOT_LORD_DEHYDRATION_FATAL_MS - cold.lordDehydrationExposureMs), cause: 'dehydration' as const } : null,
    chill >= BOT_LORD_COLD_FATAL_MS ? { at: from + Math.max(0, BOT_LORD_COLD_FATAL_MS - cold.lordColdExposureMs), cause: 'cold' as const } : null,
  ].filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((a, b) => a.at - b.at || (a.cause < b.cause ? -1 : a.cause > b.cause ? 1 : 0));
  const first = candidates[0];
  return {
    ...cold,
    lordStarvationExposureMs: starvation,
    lordDehydrationExposureMs: dehydration,
    lordColdExposureMs: chill,
    ...(first ? { lordFate: { status: 'dead' as const, changedAtElapsedMs: first.at,
      cause: first.cause, triggerId: cold.currentPlan?.actionId ?? `BOT-SURVIVAL:${first.cause}:${first.at}` } } : {}),
  };
}

function updateExposure(cold: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, from: number, starvationMs: number, dehydrationMs: number, coldMs: number): { cold: BotColdRecord; starvationDeaths: number; dehydrationDeaths: number; coldDeaths: number; lordDied: boolean } {
  let starvationExposureMs = starvationMs > 0 ? cold.starvationExposureMs + starvationMs : 0;
  let dehydrationExposureMs = dehydrationMs > 0 ? cold.dehydrationExposureMs + dehydrationMs : 0;
  let coldExposureMs = coldMs > 0 ? cold.coldExposureMs + coldMs : 0;
  const priorPopulation = hot.population[offset]!;
  let population = hot.population[offset]!;
  let armySize = hot.armySize[offset]!;
  const starvationDue = population > 0 ? Math.floor(starvationExposureMs / BOT_STARVATION_LOSS_INTERVAL_MS) : 0;
  const starvationApplied = Math.min(population, starvationDue);
  const starvationDeaths = starvationApplied;
  population -= starvationApplied;
  starvationExposureMs = starvationDeaths > 0 ? starvationExposureMs % BOT_STARVATION_LOSS_INTERVAL_MS : starvationExposureMs;
  const coldDue = population > 0 ? Math.floor(coldExposureMs / BOT_COLD_LOSS_INTERVAL_MS) : 0;
  const coldApplied = Math.min(population, coldDue);
  const coldDeaths = coldApplied;
  population -= coldApplied;
  coldExposureMs = coldDeaths > 0 ? coldExposureMs % BOT_COLD_LOSS_INTERVAL_MS : coldExposureMs;
  const dehydrationDue = population > 0 ? Math.floor(dehydrationExposureMs / (24 * 60 * 60_000)) : 0;
  const dehydrationDeaths = Math.min(population, dehydrationDue);
  population -= dehydrationDeaths;
  dehydrationExposureMs = dehydrationDeaths > 0 ? dehydrationExposureMs % (24 * 60 * 60_000) : dehydrationExposureMs;
  const armyLosses = Math.min(armySize, Math.max(0, armySize - population));
  armySize -= armyLosses;
  let lossesRemaining = armyLosses;
  let cohorts = cold.cohorts;
  if (armyLosses > 0) {
    cohorts = cold.cohorts.map(cohort => {
      const taken = Math.min(cohort.livingCount, lossesRemaining);
      lossesRemaining -= taken;
      return taken === 0 ? cohort : { ...cohort, livingCount: cohort.livingCount - taken, lostCount: cohort.lostCount + taken, healthPerMember: Math.max(0, cohort.healthPerMember - taken * 10) };
    });
    const living = cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
    hot.armyHealthPermille[offset] = living === 0 ? 0 : Math.round(cohorts.reduce((sum, cohort) => sum
      + cohort.livingCount * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0) * 1_000 / living);
  }
  if (starvationApplied + coldApplied + dehydrationDeaths > 0) hot.deathCount[offset] += starvationApplied + coldApplied + dehydrationDeaths;
  if (population !== priorPopulation) {
    hot.population[offset] = population;
    hot.armySize[offset] = armySize;
    hot.workers[offset] = Math.min(hot.workers[offset]!, Math.max(0, population - armySize));
  }
  const lordUpdated = updateLordFate({ ...cold, starvationExposureMs, coldExposureMs, dehydrationExposureMs }, from, starvationMs, dehydrationMs, coldMs);
  const exposureChanged = starvationExposureMs !== cold.starvationExposureMs || dehydrationExposureMs !== cold.dehydrationExposureMs
    || coldExposureMs !== cold.coldExposureMs || lordUpdated.lordStarvationExposureMs !== cold.lordStarvationExposureMs
    || lordUpdated.lordDehydrationExposureMs !== cold.lordDehydrationExposureMs || lordUpdated.lordColdExposureMs !== cold.lordColdExposureMs
    || lordUpdated.lordFate.status !== cold.lordFate.status;
  const coldChanged = exposureChanged || cohorts !== cold.cohorts;
  const updatedCold = coldChanged ? { ...lordUpdated, starvationExposureMs, dehydrationExposureMs, coldExposureMs, cohorts } : cold;
  return {
    cold: reconcileArmyMovement(updatedCold),
    starvationDeaths,
    dehydrationDeaths,
    coldDeaths,
    lordDied: cold.lordFate.status === 'active' && updatedCold.lordFate.status === 'dead',
  };
}

function earliestThresholdMs(balance: number, qProduction: number, qConsumption: number, remainder: number): number | null {
  const net = qProduction - qConsumption;
  if (net >= 0 || balance <= 0) return null;
  return Math.max(1, Math.ceil((balance * 1_000 + remainder) / -net));
}
function nodeExhaustionMs(balance: number, qHarvest: number, remainder = 0): number | null {
  if (balance <= 0 || qHarvest <= 0) return null;
  return Math.max(1, Math.ceil((balance * 1_000 - remainder) / qHarvest));
}
function combinedNodeExhaustionMs(balance: number, qFirst: number, remainderFirst: number, qSecond: number, remainderSecond: number): number | null {
  const rate = qFirst + qSecond;
  if (balance <= 0 || rate <= 0) return null;
  const harvested = (durationMs: number): bigint => (BigInt(qFirst) * BigInt(durationMs) + BigInt(remainderFirst)) / 1_000n
    + (BigInt(qSecond) * BigInt(durationMs) + BigInt(remainderSecond)) / 1_000n;
  const candidate = Math.max(1, Math.ceil((balance * 1_000 - remainderFirst - remainderSecond) / rate));
  let duration = candidate;
  while (duration > 1 && harvested(duration - 1) >= BigInt(balance)) duration -= 1;
  while (harvested(duration) < BigInt(balance)) duration += 1;
  return duration;
}
function storeFillMs(balance: number, cap: number, qProduction: number, qConsumption: number, remainder: number): number | null {
  const net = qProduction - qConsumption;
  if (net <= 0 || balance >= cap) return null;
  return Math.max(1, Math.ceil(((cap - balance) * 1_000 - remainder) / net));
}

function nextBotWake(cold: BotColdRecord, chunk: BotNumericRows, offset: number, now: number): number {
  const plan = cold.currentPlan;
  let next = plan?.completesAtElapsedMs ?? nextLattice(now, cold.decisionPhaseMs);
  const rates = productionRates(cold, chunk, offset);
  const foodRemainder = chunk.foodNodeRemainder[offset]! - chunk.foodConsumptionRemainder[offset]!;
  const firewoodRemainder = chunk.firewoodNodeRemainder[offset]! - chunk.firewoodConsumptionRemainder[offset]!;
  const thresholds = [
    earliestThresholdMs(chunk.foodMicro[offset]!, rates.foodProduced, rates.foodConsumed, foodRemainder),
    earliestThresholdMs(chunk.firewoodMicro[offset]!, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder),
    nodeExhaustionMs(chunk.foodNodeMicro[offset]!, rates.foodHarvested, chunk.foodNodeRemainder[offset]!),
    nodeExhaustionMs(chunk.woodNodeMicro[offset]!, rates.woodHarvested + rates.firewoodHarvested, chunk.woodNodeRemainder[offset]! + chunk.firewoodNodeRemainder[offset]!),
    nodeExhaustionMs(chunk.stoneNodeMicro[offset]!, rates.stoneHarvested, chunk.stoneNodeRemainder[offset]!),
    nodeExhaustionMs(chunk.oreNodeMicro[offset]!, rates.oreHarvested, chunk.oreNodeRemainder[offset]!),
    storeFillMs(chunk.foodMicro[offset]!, botResourceCapacityUnits('food', cold.territoryLevel) * BOT_MICRO, rates.foodProduced, rates.foodConsumed, foodRemainder),
    storeFillMs(chunk.woodMicro[offset]!, botResourceCapacityUnits('wood', cold.territoryLevel) * BOT_MICRO, rates.woodProduced, 0, chunk.woodRemainder[offset]!),
    storeFillMs(chunk.stoneMicro[offset]!, botResourceCapacityUnits('stone', cold.territoryLevel) * BOT_MICRO, rates.stoneProduced, 0, chunk.stoneRemainder[offset]!),
    storeFillMs(chunk.oreMicro[offset]!, botResourceCapacityUnits('ore', cold.territoryLevel) * BOT_MICRO, rates.oreProduced, 0, chunk.oreRemainder[offset]!),
    storeFillMs(chunk.firewoodMicro[offset]!, botResourceCapacityUnits('firewood', cold.territoryLevel) * BOT_MICRO, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder),
  ].filter((value): value is number => value !== null).map(duration => now + duration);
  const effectiveFoodZero = chunk.foodMicro[offset]! > 0 ? earliestThresholdMs(chunk.foodMicro[offset]!, rates.foodProduced, rates.foodConsumed, foodRemainder) : null;
  const effectiveFuelZero = chunk.firewoodMicro[offset]! > 0 ? earliestThresholdMs(chunk.firewoodMicro[offset]!, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder) : null;
  const starvationBoundary = chunk.foodMicro[offset]! <= 0 ? now + Math.max(1, BOT_STARVATION_LOSS_INTERVAL_MS - cold.starvationExposureMs) : null;
  const coldBoundary = chunk.firewoodMicro[offset]! <= 0 ? now + Math.max(1, BOT_COLD_LOSS_INTERVAL_MS - cold.coldExposureMs) : null;
  const waterNeedPerDay = chunk.population[offset]! * BOT_WATER_ML_PER_PERSON_PER_DAY;
  const waterZeroMs = waterNeedPerDay > 0 && cold.potableWaterMl > 0
    ? Math.max(1, Math.ceil((cold.potableWaterMl * 86_400_000 - cold.waterConsumptionRemainder) / waterNeedPerDay)) : null;
  const dehydrationBoundary = cold.potableWaterMl === 0
    ? now + Math.max(1, 24 * 60 * 60_000 - cold.dehydrationExposureMs) : null;
  if (effectiveFoodZero !== null) thresholds.push(now + effectiveFoodZero);
  if (effectiveFuelZero !== null) thresholds.push(now + effectiveFuelZero);
  if (starvationBoundary !== null) thresholds.push(starvationBoundary);
  if (coldBoundary !== null) thresholds.push(coldBoundary);
  if (waterZeroMs !== null) thresholds.push(now + waterZeroMs);
  if (dehydrationBoundary !== null) thresholds.push(dehydrationBoundary);
  next = Math.min(next, ...thresholds);
  const movement = cold.armyMovement;
  if (movement && (movement.status === 'outbound' || movement.status === 'returning') && movement.arrivesAtElapsedMs > now) next = Math.min(next, movement.arrivesAtElapsedMs);
  return Math.max(now + 1, next);
}

function settleArmyMovement(coldInput: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number, events: BotSimulationEvent[]): BotColdRecord {
  const movement = coldInput.armyMovement;
  if (!movement || movement.arrivesAtElapsedMs > at) return coldInput;
  if (movement.status === 'outbound') {
    if (movement.unitKind === 'scout') {
      const action = coldInput.currentPlan?.action;
      const eventType = action === 'search' ? 'bot_search_party_arrived' : action === 'hunt' ? 'bot_hunt_party_arrived' : 'bot_scout_arrived';
      events.push({ type: eventType, occurredAtElapsedMs: at, payload: { botId: coldInput.botId, targetId: movement.targetId, orderId: movement.orderId, scoutCount: movement.unitCount } });
      return { ...coldInput, armyMovement: { ...movement, status: 'surveying' } };
    }
    events.push({ type: 'bot_army_arrived', occurredAtElapsedMs: at, payload: { botId: coldInput.botId, targetId: movement.targetId, orderId: movement.orderId } });
    return { ...coldInput, armyMovement: { ...movement, status: 'besieging' } };
  }
  if (movement.status === 'besieging' || movement.status === 'surveying') return coldInput;
  if (movement.unitKind === 'scout') {
    const lastAction = coldInput.actionReceipts.at(-1)?.action;
    const eventType = lastAction === 'search' ? 'bot_search_party_returned' : lastAction === 'hunt' ? 'bot_hunt_party_returned' : 'bot_scout_returned';
    events.push({ type: eventType, occurredAtElapsedMs: at, payload: { botId: coldInput.botId, targetId: movement.targetId, orderId: movement.orderId, scoutCount: movement.unitCount } });
    return { ...coldInput, armyMovement: null };
  }
  const delivered: Record<BotCargoKey, number> = { food: 0, wood: 0, stone: 0, ore: 0, firewood: 0 };
  let cargo = { ...coldInput.carriedCargo };
  for (const key of ['food', 'wood', 'stone', 'ore', 'firewood'] as const) {
    const balanceField = `${key}Micro` as const;
    const space = Math.max(0, botResourceCapacityUnits(key, coldInput.territoryLevel) * BOT_MICRO - hot[balanceField][offset]!);
    const amount = Math.min(cargo[key], Math.floor(space / BOT_MICRO));
    if (amount <= 0) continue;
    hot[balanceField][offset] += amount * BOT_MICRO;
    cargo = { ...cargo, [key]: cargo[key] - amount };
    delivered[key] = amount;
  }
  const cold = {
    ...coldInput, carriedCargo: cargo, armyMovement: null,
    cohorts: coldInput.cohorts.map(cohort => ({ ...cohort, order: 'defend', location: coldInput.lastSafePosition })),
  };
  if (Object.values(delivered).some(value => value > 0)) events.push({ type: 'bot_raid_loot_delivered', occurredAtElapsedMs: at, payload: { botId: cold.botId, orderId: movement.orderId, delivered } });
  events.push({ type: 'bot_army_returned', occurredAtElapsedMs: at, payload: { botId: cold.botId, orderId: movement.orderId, position: cold.lastSafePosition } });
  return cold;
}

function returnScoutParty(cold: BotColdRecord, at: number): BotColdRecord {
  const movement = cold.armyMovement;
  if (!movement || movement.unitKind !== 'scout' || movement.status === 'returning') return cold;
  const from = movement.to;
  const to = cold.lastSafePosition;
  const travelMs = Math.ceil(Math.hypot(to.xMm - from.xMm, to.yMm - from.yMm) * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
  return { ...cold, armyMovement: travelMs > 0 ? {
    ...movement, from, to, startedAtElapsedMs: at, arrivesAtElapsedMs: at + travelMs, status: 'returning',
  } : null };
}

function actionExperience(action: BotWorkKind, resourceDelta: Record<BotResourceKey, number>, discovered: boolean, defeatedOpponents: number, recovered = false): number {
  const harvested = Math.max(0, Object.values(resourceDelta).reduce((sum, amount) => sum + amount, 0));
  if (action.startsWith('gather_')) return Math.min(3_200, Math.floor(harvested * 8));
  if (action === 'construct' || action === 'upgrade_territory') return 2_000;
  if (action === 'recruit') return 640;
  if (action === 'search') return discovered ? 1_400 : 200;
  if (action === 'scout') return discovered ? 1_000 : 200;
  if (action === 'raid') return Math.min(3_600, defeatedOpponents * 720);
  if (action === 'hunt') return discovered ? Math.min(1_000, 320 + defeatedOpponents * 180) : 100;
  if (action === 'repair') return 1_000;
  if (action === 'equip') return 800;
  if (action === 'recover') return recovered ? 500 : 0;
  if (action === 'prepare_water') return discovered ? 500 : 0;
  if (action === 'learn_blueprint') return discovered ? 320 : 0;
  if (action === 'open_chest') return discovered ? 240 : 0;
  if (action === 'list_blueprint') return 0;
  return 0;
}

function botActionRuleVersion(action: BotWorkKind): string {
  return action === 'prepare_water' ? BOT_SURVIVAL_RULE_VERSION
    : action === 'open_chest' ? BOT_CHEST_RULE_VERSION
    : action === 'learn_blueprint' ? BOT_BLUEPRINT_RULES_VERSION
    : action === 'list_blueprint' ? BOT_MARKET_RULE_VERSION
    : action === 'upgrade_territory' ? BOT_TERRITORY_RULE_VERSION
    : action === 'hunt' ? BOT_HUNT_RULE_VERSION
    : action === 'repair' ? BOT_REPAIR_RULE_VERSION
      : action === 'equip' ? BOT_EQUIPMENT_RULE_VERSION
        : action === 'recover' ? BOT_RECOVERY_RULE_VERSION : BOT_ACTIVITY_XP_RULE_VERSION;
}

function addBotXp(hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, gained: number, at: number): { crossed: number[]; before: number } {
  let level = hot.levels[offset]!;
  let xp = hot.xp[offset]! + gained;
  const before = level;
  const crossed: number[] = [];
  while (xp >= playerLevelThreshold(level) && level < 100) {
    xp -= playerLevelThreshold(level);
    level += 1;
    crossed.push(level);
  }
  hot.levels[offset] = level;
  hot.xp[offset] = xp;
  if (before < 10 && level >= 10 && hot.completionAtElapsedMs[offset] === 0) hot.completionAtElapsedMs[offset] = at;
  return { crossed, before };
}

function resourceBalances(chunk: BotStateChunk, offset: number): Record<BotResourceKey, number> {
  return { food: chunk.foodMicro[offset]!, wood: chunk.woodMicro[offset]!, stone: chunk.stoneMicro[offset]!, ore: chunk.oreMicro[offset]! };
}

function hotResourceBalances(hot: ReturnType<typeof hydrateBotHotArrays>, offset: number): Record<BotResourceKey, number> {
  return { food: hot.foodMicro[offset]!, wood: hot.woodMicro[offset]!, stone: hot.stoneMicro[offset]!, ore: hot.oreMicro[offset]! };
}

function deltaWhole(before: Record<BotResourceKey, number>, after: Record<BotResourceKey, number>): Record<BotResourceKey, number> {
  return { food: Math.trunc((after.food - before.food) / BOT_MICRO), wood: Math.trunc((after.wood - before.wood) / BOT_MICRO), stone: Math.trunc((after.stone - before.stone) / BOT_MICRO), ore: Math.trunc((after.ore - before.ore) / BOT_MICRO) };
}

function addReceipt(cold: BotColdRecord, plan: BotPlanState, at: number, result: BotActionReceipt['result'], delta: Record<BotResourceKey, number>, xp: number, casualties = 0, drawIndex = 0, baseXp = xp, talentXpMultiplierPermille = 1_000): BotColdRecord {
  const receipt: BotActionReceipt = {
    actionId: plan.actionId, botId: cold.botId, action: plan.action, targetId: plan.targetId, occurredAtElapsedMs: at,
    result, resourceDelta: delta, baseXpAwarded: baseXp, talentXpMultiplierPermille, xpAwarded: xp, casualties, ruleVersion: botActionRuleVersion(plan.action), drawIndex,
  };
  // Preserve every receipt, but archive older immutable pages as compact tuples
  // so multi-day catch-up does not retain millions of repeated-key objects.
  return appendBotActionReceipt(cold, receipt);
}

function chooseBlueprint(cold: BotColdRecord, plan: BotPlanState, populationSeed: string): { id: string | null; duplicate: boolean; drawIndex: number } {
  const source = cold.searchSources.find(item => item.id === plan.targetId && item.discovered && item.remainingActions > 0);
  if (!source) return { id: null, duplicate: false, drawIndex: 0 };
  const candidates = source.eligibleBlueprintIds.flatMap(id => {
    const lootRule = BOT_BLUEPRINT_LOOT_RULES.find(rule => rule.blueprintId === id);
    if (!lootRule || !lootRule.candidates.includes(source.kind)) return [];
    return [{ id, weight: lootRule.baseWeight }];
  }).sort((a, b) => compareId(a.id, b.id));
  const totalWeight = candidates.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return { id: null, duplicate: false, drawIndex: 0 };
  const drawIndex = 0;
  const roll = randomIntFromFields([populationSeed, cold.botId, plan.actionId, BOT_BLUEPRINT_RULES_VERSION, String(drawIndex)], 0, totalWeight - 1).value;
  let cumulative = 0;
  const selected = candidates.find(row => { cumulative += row.weight; return roll < cumulative; });
  if (!selected) return { id: null, duplicate: false, drawIndex };
  return { id: selected.id, duplicate: cold.blueprintIds.includes(selected.id)
    || cold.blueprintItems.some(item => item.blueprintId === selected.id && item.status !== 'sold'), drawIndex };
}

function chooseLegalAnchor(cold: BotColdRecord, actionOrdinal: number, blueprintId: string, saveSeed: string): { anchor: CoordinateMm; orientation: 0 | 90 | 180 | 270; layoutSeed: string } {
  const width = blueprintId === 'BP-BOT-KEEP' ? 12_000 : 8_000;
  const depth = width;
  const occupied = cold.structures.filter(item => item.status !== 'destroyed').map(item => item.anchor);
  const start = randomIntFromFields([saveSeed, cold.regionId, cold.botId, actionOrdinal.toString(), blueprintId, 'legal-footprint'], 0, 31).value;
  for (let ring = 0; ring < 6; ring += 1) for (let step = 0; step < 32; step += 1) {
    const angle = (step + start) / 32 * Math.PI * 2;
    const radius = 24_000 + ring * 14_000;
    const anchor = { xMm: cold.position.xMm + Math.round(Math.cos(angle) * radius), yMm: cold.position.yMm + Math.round(Math.sin(angle) * radius), sourceZMetres: cold.position.sourceZMetres ?? 0 };
    const clear = occupied.every(position => Math.hypot(position.xMm - anchor.xMm, position.yMm - anchor.yMm) >= (width + depth) / 2 + 2_000);
    if (clear && Math.hypot(anchor.xMm - cold.position.xMm, anchor.yMm - cold.position.yMm) <= 110_000) {
      const orientation = ([0, 90, 180, 270] as const)[randomIntFromFields([saveSeed, cold.regionId, cold.botId, String(actionOrdinal), 'orientation'], 0, 3).value]!;
      return { anchor, orientation, layoutSeed: randomIntFromFields([saveSeed, cold.regionId, cold.botId, String(actionOrdinal), blueprintId, 'layout'], 0, 0x7fff_ffff).value.toString(16).padStart(8, '0') };
    }
  }
  throw new Error(`BOT_CONSTRUCTION_FOOTPRINT_UNAVAILABLE:${cold.botId}`);
}

function startBotDecision(population: BotPopulationState, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, cold: BotColdRecord, grade: BotTalentGrade, kind: BotTalentKind, at: number): { cold: BotColdRecord; events: BotSimulationEvent[]; plannerExpansions: number } {
  if (hot.alive[offset] === 0) {
    hot.nextWakeAtElapsedMs[offset] = Number.MAX_SAFE_INTEGER;
    return { cold: { ...cold, currentPlan: null }, events: [], plannerExpansions: 0 };
  }
  const decision = chooseBotDecision(cold, hot, offset, grade, kind, at);
  const resourceAvailable = spendableBotResources(hot, offset);
  if ((Object.keys(decision.plan.reserved) as BotResourceKey[]).some(key => decision.plan.reserved[key] > resourceAvailable[key])) {
    throw new Error(`BOT_PLAN_RESERVED_UNAFFORDABLE:${cold.botId}:${decision.plan.actionId}`);
  }
  const plan = decision.plan;
  const nextCold: BotColdRecord = { ...cold, currentPlan: plan, nextActionOrdinal: cold.nextActionOrdinal + 1, workforce: decision.workforce };
  if (plan.action === 'raid') {
    const target = cold.knownTargets.find(item => item.id === plan.targetId);
    if (!target || target.id === cold.botId) throw new Error(`BOT_RAID_TARGET_NOT_KNOWN:${cold.botId}:${plan.targetId}`);
    const from = cold.lastSafePosition;
    const distanceMm = Math.hypot(target.position.xMm - from.xMm, target.position.yMm - from.yMm);
    const travelMs = Math.ceil(distanceMm * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
    nextCold.armyMovement = {
      orderId: plan.actionId, targetId: target.id, unitKind: 'army', unitCount: hot.armySize[offset]!, from, to: target.position,
      cohortMemberCounts: cold.cohorts.filter(cohort => cohort.livingCount > 0)
        .map(cohort => ({ cohortId: cohort.id, memberCount: cohort.livingCount })),
      startedAtElapsedMs: at, arrivesAtElapsedMs: at + travelMs, status: 'outbound',
    };
    nextCold.cohorts = nextCold.cohorts.map(cohort => ({ ...cohort, order: 'raid' }));
  } else if (plan.action === 'scout') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.contactTargetId && item.remainingActions > 0);
    if (!source) throw new Error(`BOT_SCOUT_TARGET_NOT_FOUND:${cold.botId}:${plan.targetId}`);
    const from = cold.lastSafePosition;
    const distanceMm = Math.hypot(source.position.xMm - from.xMm, source.position.yMm - from.yMm);
    const travelMs = Math.ceil(distanceMm * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
    nextCold.armyMovement = {
      orderId: plan.actionId, targetId: source.contactTargetId, unitKind: 'scout', unitCount: decision.workforce.scouts,
      from, to: source.position, startedAtElapsedMs: at, arrivesAtElapsedMs: at + travelMs, status: 'outbound',
    };
  } else if (plan.action === 'search') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.discovered && item.remainingActions > 0);
    if (!source) throw new Error(`BOT_SEARCH_TARGET_NOT_FOUND:${cold.botId}:${plan.targetId}`);
    const from = cold.lastSafePosition;
    const distanceMm = Math.hypot(source.position.xMm - from.xMm, source.position.yMm - from.yMm);
    const travelMs = Math.ceil(distanceMm * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
    nextCold.armyMovement = {
      orderId: plan.actionId, targetId: source.id, unitKind: 'scout', unitCount: decision.workforce.scouts,
      from, to: source.position, startedAtElapsedMs: at, arrivesAtElapsedMs: at + travelMs, status: 'outbound',
    };
  } else if (plan.action === 'hunt') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.kind === 'wildlife_track' && item.remainingActions > 0);
    if (!source) throw new Error(`BOT_HUNT_TARGET_NOT_FOUND:${cold.botId}:${plan.targetId}`);
    const from = cold.lastSafePosition;
    const distanceMm = Math.hypot(source.position.xMm - from.xMm, source.position.yMm - from.yMm);
    const travelMs = Math.ceil(distanceMm * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
    nextCold.armyMovement = {
      orderId: plan.actionId, targetId: source.id, unitKind: 'scout', unitCount: decision.workforce.scouts,
      from, to: source.position, startedAtElapsedMs: at, arrivesAtElapsedMs: at + travelMs, status: 'outbound',
    };
  }
  if (plan.action === 'prepare_water') {
    const firewoodCost = BOT_WATER_PREPARATION_FIREWOOD_UNITS * BOT_MICRO;
    if (cold.localIceRemainingMl <= 0 || hot.firewoodMicro[offset]! < firewoodCost) throw new Error(`BOT_WATER_PREPARATION_UNAFFORDABLE:${cold.botId}`);
    // Fuel is spent when the work starts; the finite ice is removed only when the batch completes.
    hot.firewoodMicro[offset] -= firewoodCost;
  }
  const [resFood, resWood, resStone, resOre] = [decision.reservedMicro.food, decision.reservedMicro.wood, decision.reservedMicro.stone, decision.reservedMicro.ore];
  hot.reservedFoodMicro[offset] += resFood;
  hot.reservedWoodMicro[offset] += resWood;
  hot.reservedStoneMicro[offset] += resStone;
  hot.reservedOreMicro[offset] += resOre;
  hot.workKind[offset] = decision.workCode;
  hot.assignedWorkers[offset] = decision.assignedWorkers;
  hot.workProgress[offset] = 0;
  hot.workRequired[offset] = decision.workRequired;
  if (plan.action === 'construct') {
    const rule = BOT_BLUEPRINT_BY_ID.get(plan.targetId ?? '');
    if (!rule) throw new Error(`BOT_BLUEPRINT_UNKNOWN:${plan.targetId}`);
    const footprint = chooseLegalAnchor(nextCold, cold.nextActionOrdinal + 1, rule.id, population.saveSeed);
    const workRequired = Math.max(1, Math.round(rule.workerHours * 3_600_000));
    const structure: BotStructureInstance = {
      id: `${plan.actionId}:STRUCTURE`, blueprintId: rule.id, anchor: footprint.anchor, orientation: footprint.orientation,
      footprintMm: { widthMm: 8_000, depthMm: 8_000 }, level: 1, status: 'under_construction',
      workRequired, workCompleted: 0, repairWorkRequired: 0, repairWorkCompleted: 0,
      damagePermille: 0, layoutSeed: footprint.layoutSeed, completedAtElapsedMs: null,
    };
    nextCold.structures = [...nextCold.structures, structure];
  } else if (plan.action === 'repair') {
    const target = nextCold.structures.find(item => item.id === plan.targetId && item.status === 'damaged');
    if (target) {
      const required = target.repairWorkRequired > 0 ? target.repairWorkRequired : decision.workRequired;
      const completed = target.repairWorkRequired > 0 ? target.repairWorkCompleted : 0;
      nextCold.structures = nextCold.structures.map(item => item.id === target.id
        ? { ...item, repairWorkRequired: required, repairWorkCompleted: completed } : item);
      hot.workRequired[offset] = required;
      hot.workProgress[offset] = completed;
    }
  }
  hot.nextWakeAtElapsedMs[offset] = nextSellerMarketWake(population, nextCold, at, nextBotWake(nextCold, hot, offset, at));
  return {
    cold: nextCold,
    plannerExpansions: decision.plannerExpansions,
    events: [{ type: 'bot_plan_started', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, action: plan.action, goal: plan.goal, targetId: plan.targetId, completesAtElapsedMs: plan.completesAtElapsedMs, workersAssigned: plan.workersAssigned, reserved: plan.reserved } }],
  };
}

function botOrdinalFromId(botId: string): number | null {
  const rival = /^RC-(\d{3})$/.exec(botId);
  if (rival) {
    const slot = Number(rival[1]);
    return slot >= 2 && slot <= 10 ? slot - 1 : null;
  }
  const generated = /^BOT-P0-(\d{4,})$/.exec(botId);
  if (!generated) return null;
  const ordinal = Number(generated[1]);
  return ordinal >= 10 && Number.isSafeInteger(ordinal) ? ordinal : null;
}

function woundHealthForLoss(lossPermille: number): number {
  if (lossPermille <= 0) return 0;
  return Math.min(50, 10 + Math.floor(lossPermille / 25));
}

type BotCasualtyCause = 'starvation' | 'dehydration' | 'fuelExhaustion' | 'regionalBlizzard' | 'battle' | 'wildlife';
function recordBotCasualties(cold: BotColdRecord, cause: BotCasualtyCause, count: number): BotColdRecord {
  if (count <= 0) return cold;
  const ledger = cold.casualtiesByCause ?? { starvation: 0, dehydration: 0, fuelExhaustion: 0, regionalBlizzard: 0, battle: 0, wildlife: 0, unattributed: 0 };
  return { ...cold, casualtiesByCause: { ...ledger, [cause]: ledger[cause] + count } };
}

function applyBotCasualties(coldInput: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, count: number, woundHealth = 0, participatingCounts?: ReadonlyMap<string, number>, casualtiesAreAway = false, cause: 'battle' | 'wildlife' = 'battle'): { cold: BotColdRecord; applied: number } {
  const eligibleTotal = participatingCounts
    ? coldInput.cohorts.reduce((sum, cohort) => sum + Math.min(cohort.livingCount, participatingCounts.get(cohort.id) ?? 0), 0)
    : hot.armySize[offset]!;
  let remaining = Math.min(Math.max(0, count), eligibleTotal);
  const selectedLosses = new Map<string, number>();
  const cohorts = coldInput.cohorts.map(cohort => {
    const eligible = participatingCounts ? participatingCounts.get(cohort.id) ?? 0 : cohort.livingCount;
    const lost = Math.min(cohort.livingCount, eligible, remaining);
    remaining -= lost;
    if (lost > 0) selectedLosses.set(cohort.id, lost);
    const livingCount = cohort.livingCount - lost;
    return lost > 0 || (livingCount > 0 && woundHealth > 0)
      ? { ...cohort, livingCount, lostCount: cohort.lostCount + lost,
        healthPerMember: livingCount > 0 && (lost > 0 || eligible > 0) ? Math.max(1, cohort.healthPerMember - woundHealth) : cohort.healthPerMember }
      : cohort;
  });
  const applied = cohorts.reduce((sum, cohort, index) => sum + (coldInput.cohorts[index]!.livingCount - cohort.livingCount), 0);
  hot.armySize[offset] = Math.max(0, hot.armySize[offset]! - applied);
  hot.population[offset] = Math.max(hot.armySize[offset]!, hot.population[offset]! - applied);
  hot.workers[offset] = Math.min(hot.workers[offset]!, Math.max(0, hot.population[offset]! - hot.armySize[offset]!));
  hot.deathCount[offset] += applied;
  if (hot.population[offset] === 0) hot.alive[offset] = 0;
  const living = cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
  const averageHealth = living === 0 ? 0 : Math.round(cohorts.reduce((sum, cohort) => sum + cohort.livingCount * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0) * 1_000 / living);
  hot.armyHealthPermille[offset] = averageHealth;
  return { cold: reconcileArmyMovement(recordBotCasualties({ ...coldInput, cohorts }, cause, applied), casualtiesAreAway ? selectedLosses : undefined), applied };
}

function addCarriedLoot(cold: BotColdRecord, key: BotCargoKey, amount: number): BotColdRecord {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('BOT_RAID_LOOT_INVALID');
  return { ...cold, carriedCargo: { ...cold.carriedCargo, [key]: cold.carriedCargo[key] + amount } };
}

function botMarketReserveUnits(population: number, resource: 'food' | 'water'): number {
  return resource === 'food' ? Math.ceil(population * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.food * 24 * 3)
    : population * BOT_WATER_ML_PER_PERSON_PER_DAY * 2;
}

function botMarketResourceHave(chunk: BotNumericRows, cold: BotColdRecord, offset: number, resource: 'food' | 'water'): number {
  return resource === 'food'
    ? Math.floor((chunk.foodMicro[offset]! - chunk.reservedFoodMicro[offset]!) / BOT_MICRO)
    : cold.potableWaterMl;
}

function botMarketResourceCapacity(cold: BotColdRecord, resource: 'food' | 'water'): number {
  return resource === 'food'
    ? botResourceCapacityUnits('food', cold.territoryLevel)
    : BOT_WATER_CAPACITY_ML;
}

function cancelBotMarketListings(population: BotPopulationState, coldInput: BotColdRecord, at: number,
  reason: 'lord_eliminated' | 'captured' | 'dispossessed'): { population: BotPopulationState; cold: BotColdRecord; events: BotSimulationEvent[] } {
  const listingIds = new Set(population.marketListings.filter(item => item.sellerBotId === coldInput.botId && item.status === 'active').map(item => item.id));
  if (listingIds.size === 0) return { population, cold: coldInput, events: [] };
  const cold: BotColdRecord = { ...coldInput, blueprintItems: coldInput.blueprintItems.map(item => {
    const listing = population.marketListings.find(row => row.blueprintItemInstanceId === item.instanceId && listingIds.has(row.id));
    return listing ? { ...item, status: 'owned' as const, resolvedAtElapsedMs: null, transactionId: null } : item;
  }) };
  const marketListings = population.marketListings.map(listing => listingIds.has(listing.id)
    ? { ...listing, status: 'cancelled' as const, resolvedAtElapsedMs: at } : listing);
  return { population: { ...population, marketListings }, cold, events: [...listingIds].sort(compareId).map(listingId => ({
    type: 'bot_market_listing_cancelled', occurredAtElapsedMs: at, payload: {
      listingId, sellerBotId: coldInput.botId, reason, itemReleased: true, ruleVersion: BOT_MARKET_RULE_VERSION,
    },
  })) };
}

type MarketSettlementResult = {
  population: BotPopulationState;
  sellerCold: BotColdRecord;
  localChangedOffsets: number[];
  externallyChangedChunkIndices: number[];
  events: BotSimulationEvent[];
};

/** Resolves one nearby buyer only when a seller creates or reprices a real escrowed listing. */
function settleBotMarketListing(
  populationInput: BotPopulationState,
  currentChunk: BotStateChunk,
  currentHot: ReturnType<typeof hydrateBotHotArrays>,
  currentColdRows: BotColdRecord[],
  sellerOffset: number,
  sellerColdInput: BotColdRecord,
  listingId: string,
  at: number,
): MarketSettlementResult {
  let population = populationInput;
  let sellerCold = sellerColdInput;
  const localChangedOffsets = new Set<number>();
  const externallyChangedChunkIndices = new Set<number>();
  const events: BotSimulationEvent[] = [];
  const listingIndex = population.marketListings.findIndex(item => item.id === listingId && item.status === 'active');
  if (listingIndex < 0 || sellerCold.lordFate.status !== 'active') return { population, sellerCold, localChangedOffsets: [], externallyChangedChunkIndices: [], events };
  const listing = population.marketListings[listingIndex]!;
  const blueprint = BOT_BLUEPRINT_BY_ID.get(listing.blueprintId);
  if (!blueprint || sellerCold.blueprintItems.find(item => item.instanceId === listing.blueprintItemInstanceId)?.status !== 'escrowed') {
    return { population, sellerCold, localChangedOffsets: [], externallyChangedChunkIndices: [], events };
  }
  const sellerPosition = sellerCold.position;
  const radiusSquared = BOT_MARKET_ACCESS_RADIUS_MM * BOT_MARKET_ACCESS_RADIUS_MM;
  const possible: { chunk: BotStateChunk; offset: number; distanceSquared: number; botId: string; paymentHave: number }[] = [];
  for (const chunk of population.chunks) for (let offset = 0; offset < chunk.count; offset += 1) {
    const cold = chunk.index === currentChunk.index ? currentColdRows[offset]! : chunk.cold[offset]!;
    if (!cold || cold.botId === sellerCold.botId || cold.lordFate.status !== 'active'
      || (chunk.index === currentChunk.index ? currentHot.alive[offset] : chunk.alive[offset]) === 0) continue;
    if (cold.blueprintIds.includes(listing.blueprintId)
      || cold.blueprintItems.some(item => item.blueprintId === listing.blueprintId && item.status !== 'sold')
      || cold.currentPlan?.action === 'learn_blueprint' && cold.blueprintItems.some(item => item.instanceId === cold.currentPlan!.targetId && item.blueprintId === listing.blueprintId)) continue;
    const distanceSquared = (cold.position.xMm - sellerPosition.xMm) ** 2 + (cold.position.yMm - sellerPosition.yMm) ** 2;
    if (distanceSquared > radiusSquared) continue;
    const have = chunk.index === currentChunk.index ? currentHot : chunk;
    const balance = botMarketResourceHave(have, cold, offset, listing.paymentResource);
    const populationCount = chunk.index === currentChunk.index ? currentHot.population[offset]! : chunk.population[offset]!;
    if (balance - botMarketReserveUnits(populationCount, listing.paymentResource) < listing.askAmount) continue;
    const sellerCapacity = botMarketResourceCapacity(sellerCold, listing.paymentResource);
    const sellerHave = listing.paymentResource === 'food' ? Math.floor(currentHot.foodMicro[sellerOffset]! / BOT_MICRO) : sellerCold.potableWaterMl;
    if (sellerCapacity - sellerHave < listing.askAmount) continue;
    const prerequisitesMet = blueprint.prerequisites.every(id => cold.blueprintIds.includes(id)
      && cold.structures.some(structure => structure.blueprintId === id && structure.status === 'active'));
    if (!prerequisitesMet || cold.inventoryItems.length + cold.blueprintItems.length >= 64) continue;
    possible.push({ chunk, offset, distanceSquared, botId: cold.botId, paymentHave: balance });
  }
  possible.sort((a, b) => a.distanceSquared - b.distanceSquared || b.paymentHave - a.paymentHave || compareId(a.botId, b.botId));

  for (const candidate of possible) {
    const chunk = candidate.chunk;
    const sameChunk = chunk.index === currentChunk.index;
    const working = sameChunk ? null : workingChunk(population, chunk);
    const hot = sameChunk ? currentHot : working!.hot;
    const coldRows = sameChunk ? currentColdRows : working!.coldRows;
    const offset = candidate.offset;
    let buyerCold = coldRows[offset]!;
    const grade = (['S', 'A', 'B', 'C', 'D'] as const)[chunk.talentGrades[offset]!]!;
    const kind = (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!;
    const integrated = integrateBot(buyerCold, hot, hot, offset, at, grade, kind, population.saveSeed);
    buyerCold = integrated.cold;
    events.push(...integrated.events);
    if (buyerCold.lordFate.status !== 'active') {
      const released = cancelBotMarketListings(population, buyerCold, at,
        buyerCold.lordFate.status === 'captured' ? 'captured' : buyerCold.lordFate.status === 'dispossessed' ? 'dispossessed' : 'lord_eliminated');
      population = released.population;
      buyerCold = released.cold;
      events.push(...released.events);
    }
    coldRows[offset] = buyerCold;
    if (!buyerCold.currentPlan) hot.nextWakeAtElapsedMs[offset] = Math.min(hot.nextWakeAtElapsedMs[offset]!, nextLattice(at, buyerCold.decisionPhaseMs));
    if (sameChunk) localChangedOffsets.add(offset);
    else {
      working!.dirtyOffsets.add(offset);
      working!.wakeDirtyOffsets.add(offset);
      externallyChangedChunkIndices.add(chunk.index);
    }
    if (hot.alive[offset] === 0 || buyerCold.lordFate.status !== 'active') continue;
    const buyerPopulation = hot.population[offset]!;
    const buyerHave = botMarketResourceHave(hot, buyerCold, offset, listing.paymentResource);
    if (buyerHave - botMarketReserveUnits(buyerPopulation, listing.paymentResource) < listing.askAmount) continue;
    const sellerCapacity = botMarketResourceCapacity(sellerCold, listing.paymentResource);
    const sellerHave = listing.paymentResource === 'food' ? Math.floor(currentHot.foodMicro[sellerOffset]! / BOT_MICRO) : sellerCold.potableWaterMl;
    if (sellerCapacity - sellerHave < listing.askAmount) continue;
    const transactionId = `${listing.id}:TX`;
    if (population.marketTransactions.some(item => item.id === transactionId)) return { population, sellerCold, localChangedOffsets: [...localChangedOffsets], externallyChangedChunkIndices: [...externallyChangedChunkIndices], events };
    const transaction: BotMarketTransaction = {
      id: transactionId, listingId: listing.id, sellerBotId: sellerCold.botId, buyerBotId: buyerCold.botId,
      blueprintItemInstanceId: listing.blueprintItemInstanceId, blueprintId: listing.blueprintId,
      paymentResource: listing.paymentResource, paymentAmount: listing.askAmount, occurredAtElapsedMs: at,
      ruleVersion: BOT_MARKET_RULE_VERSION,
    };
    const buyerItem: BotBlueprintItem = {
      instanceId: `${listing.id}:ITEM:${buyerCold.botId}`, blueprintId: listing.blueprintId,
      sourceId: sellerCold.blueprintItems.find(item => item.instanceId === listing.blueprintItemInstanceId)!.sourceId,
      acquiredAtElapsedMs: at, status: 'owned', resolvedAtElapsedMs: null, transactionId,
      ruleVersion: sellerCold.blueprintItems.find(item => item.instanceId === listing.blueprintItemInstanceId)!.ruleVersion,
    };
    buyerCold = { ...buyerCold, blueprintItems: [...buyerCold.blueprintItems, buyerItem] };
    if (listing.paymentResource === 'food') {
      hot.foodMicro[offset] -= listing.askAmount * BOT_MICRO;
      currentHot.foodMicro[sellerOffset] += listing.askAmount * BOT_MICRO;
      sellerCold = { ...sellerCold, starvationExposureMs: 0, lordStarvationExposureMs: 0 };
    } else {
      sellerCold = { ...sellerCold, potableWaterMl: sellerCold.potableWaterMl + listing.askAmount,
        dehydrationExposureMs: 0, lordDehydrationExposureMs: 0 };
      buyerCold = { ...buyerCold, potableWaterMl: buyerCold.potableWaterMl - listing.askAmount };
    }
    const sellerItem = sellerCold.blueprintItems.find(item => item.instanceId === listing.blueprintItemInstanceId)!;
    sellerCold = { ...sellerCold, blueprintItems: sellerCold.blueprintItems.map(item => item.instanceId !== sellerItem.instanceId ? item : {
      ...item, status: 'sold' as const, resolvedAtElapsedMs: at, transactionId,
    }) };
    coldRows[offset] = buyerCold;
    if (sameChunk) localChangedOffsets.add(offset);
    else {
      working!.dirtyOffsets.add(offset);
      working!.wakeDirtyOffsets.add(offset);
      externallyChangedChunkIndices.add(chunk.index);
    }
    const marketListings = population.marketListings.map(item => item.id !== listing.id ? item : {
      ...item, status: 'filled' as const, buyerBotId: buyerCold.botId, transactionId, resolvedAtElapsedMs: at,
    });
    population = { ...population, marketListings, marketTransactions: [...population.marketTransactions, transaction] };
    events.push({ type: 'bot_market_trade_settled', occurredAtElapsedMs: at, payload: {
      transactionId, listingId: listing.id, sellerBotId: sellerCold.botId, buyerBotId: buyerCold.botId,
      blueprintItemInstanceId: listing.blueprintItemInstanceId, blueprintId: listing.blueprintId,
      paymentResource: listing.paymentResource, paymentAmount: listing.askAmount, feeAmount: 0,
      ruleVersion: BOT_MARKET_RULE_VERSION,
    } });
    return { population, sellerCold, localChangedOffsets: [...localChangedOffsets], externallyChangedChunkIndices: [...externallyChangedChunkIndices], events };
  }
  return { population, sellerCold, localChangedOffsets: [...localChangedOffsets], externallyChangedChunkIndices: [...externallyChangedChunkIndices], events };
}

function nextSellerMarketWake(population: BotPopulationState, cold: BotColdRecord, now: number, next: number): number {
  for (const listing of population.marketListings) {
    if (listing.sellerBotId !== cold.botId || listing.status !== 'active') continue;
    const repriceAt = listing.repriceCount < BOT_MARKET_MAX_REPRICES
      ? listing.lastRepricedAtElapsedMs + BOT_MARKET_REPRICE_INTERVAL_MS : Number.MAX_SAFE_INTEGER;
    const dueAt = Math.min(repriceAt, listing.expiresAtElapsedMs);
    if (dueAt > now) next = Math.min(next, dueAt);
  }
  return next;
}

/** Expiry and repricing happen only at seller wakes; each active listing adds at most two wakes. */
function advanceSellerMarketListings(
  populationInput: BotPopulationState,
  chunk: BotStateChunk,
  hot: ReturnType<typeof hydrateBotHotArrays>,
  coldRows: BotColdRecord[],
  sellerOffset: number,
  coldInput: BotColdRecord,
  at: number,
): MarketSettlementResult {
  let population = populationInput;
  let sellerCold = coldInput;
  const localChangedOffsets = new Set<number>();
  const externallyChangedChunkIndices = new Set<number>();
  const events: BotSimulationEvent[] = [];
  if (sellerCold.lordFate.status !== 'active') {
    const released = cancelBotMarketListings(population, sellerCold, at,
      sellerCold.lordFate.status === 'captured' ? 'captured' : sellerCold.lordFate.status === 'dispossessed' ? 'dispossessed' : 'lord_eliminated');
    return { population: released.population, sellerCold: released.cold, localChangedOffsets: [], externallyChangedChunkIndices: [], events: released.events };
  }
  const listingIds = population.marketListings.filter(item => item.sellerBotId === sellerCold.botId && item.status === 'active')
    .map(item => item.id).sort(compareId);
  for (const listingId of listingIds) {
    const listing = population.marketListings.find(item => item.id === listingId && item.status === 'active');
    if (!listing) continue;
    if (at >= listing.expiresAtElapsedMs) {
      const marketListings = population.marketListings.map(item => item.id !== listingId ? item : {
        ...item, status: 'expired' as const, resolvedAtElapsedMs: listing.expiresAtElapsedMs,
      });
      sellerCold = { ...sellerCold, blueprintItems: sellerCold.blueprintItems.map(item => item.instanceId !== listing.blueprintItemInstanceId ? item : {
        ...item, status: 'owned' as const, resolvedAtElapsedMs: null, transactionId: null,
      }) };
      population = { ...population, marketListings };
      events.push({ type: 'bot_market_listing_expired', occurredAtElapsedMs: listing.expiresAtElapsedMs,
        payload: { listingId, sellerBotId: sellerCold.botId, itemReleased: true, ruleVersion: BOT_MARKET_RULE_VERSION } });
      continue;
    }
    if (listing.repriceCount >= BOT_MARKET_MAX_REPRICES || at < listing.lastRepricedAtElapsedMs + BOT_MARKET_REPRICE_INTERVAL_MS) continue;
    const activeSameBlueprint = population.marketListings.filter(item => item.id !== listing.id && item.status === 'active' && item.blueprintId === listing.blueprintId).length;
    const repriced = { ...listing, askAmount: botMarketAsk(listing.blueprintId, listing.paymentResource, activeSameBlueprint, listing.repriceCount + 1),
      lastRepricedAtElapsedMs: at, repriceCount: listing.repriceCount + 1 };
    population = { ...population, marketListings: population.marketListings.map(item => item.id !== listing.id ? item : repriced) };
    events.push({ type: 'bot_market_listing_repriced', occurredAtElapsedMs: at, payload: {
      listingId, sellerBotId: sellerCold.botId, askAmount: repriced.askAmount, paymentResource: repriced.paymentResource,
      repriceCount: repriced.repriceCount, ruleVersion: BOT_MARKET_RULE_VERSION,
    } });
    const settled = settleBotMarketListing(population, chunk, hot, coldRows, sellerOffset, sellerCold, listingId, at);
    population = settled.population;
    sellerCold = settled.sellerCold;
    for (const offset of settled.localChangedOffsets) localChangedOffsets.add(offset);
    for (const index of settled.externallyChangedChunkIndices) externallyChangedChunkIndices.add(index);
    events.push(...settled.events);
    if (population.marketListings.find(item => item.id === listingId)?.status === 'filled') break;
  }
  return { population, sellerCold, localChangedOffsets: [...localChangedOffsets], externallyChangedChunkIndices: [...externallyChangedChunkIndices], events };
}

/** Atomically escrows a bot listing's blueprint into the player's compiled adapter and credits the seller. */
export function settleBotMarketListingForPlayer(
  populationInput: BotPopulationState,
  listingId: string,
  at: number,
): { population: BotPopulationState | null; listing: BotMarketListing | null; code: string | null; events: BotSimulationEvent[] } {
  const sourceListing = populationInput.marketListings.find(item => item.id === listingId && item.status === 'active');
  if (!sourceListing) return { population: null, listing: null, code: 'BOT_MARKET_LISTING_NOT_AVAILABLE', events: [] };
  if (at >= sourceListing.expiresAtElapsedMs) return { population: null, listing: sourceListing, code: 'BOT_MARKET_LISTING_EXPIRED', events: [] };
  if (sourceListing.paymentResource !== 'food') return { population: null, listing: sourceListing, code: 'BOT_MARKET_PAYMENT_NOT_COMPILED', events: [] };
  let population = prepareBotPopulationMutation(populationInput);
  const sellerRef = botChunkAtOrdinal(population, botOrdinalFromId(sourceListing.sellerBotId) ?? -1);
  if (!sellerRef) return { population: null, listing: sourceListing, code: 'BOT_MARKET_SELLER_NOT_FOUND', events: [] };
  const sellerChunk = sellerRef.chunk;
  const sellerOffset = sellerRef.offset;
  const working = workingChunk(population, sellerChunk);
  const hot = working.hot;
  const sellerGrade = (['S', 'A', 'B', 'C', 'D'] as const)[sellerChunk.talentGrades[sellerOffset]!]!;
  const sellerKind = (['combat', 'production'] as const)[sellerChunk.talentKinds[sellerOffset]!]!;
  let sellerCold = working.coldRows[sellerOffset]!;
  if (!sellerCold || hot.alive[sellerOffset] === 0 || sellerCold.lordFate.status !== 'active') {
    return { population: null, listing: sourceListing, code: 'BOT_MARKET_SELLER_UNAVAILABLE', events: [] };
  }
  const integrated = integrateBot(sellerCold, hot, hot, sellerOffset, at, sellerGrade, sellerKind, population.saveSeed);
  sellerCold = integrated.cold;
  if (hot.alive[sellerOffset] === 0 || sellerCold.lordFate.status !== 'active') {
    return { population: null, listing: sourceListing, code: 'BOT_MARKET_SELLER_UNAVAILABLE', events: integrated.events };
  }
  const listing = population.marketListings.find(item => item.id === listingId && item.status === 'active');
  const item = sellerCold.blueprintItems.find(candidate => candidate.instanceId === sourceListing.blueprintItemInstanceId && candidate.status === 'escrowed');
  if (!listing || !item) return { population: null, listing: sourceListing, code: 'BOT_MARKET_ESCROW_INVALID', events: integrated.events };
  const capacity = botMarketResourceCapacity(sellerCold, 'food');
  const sellerFood = Math.floor(hot.foodMicro[sellerOffset]! / BOT_MICRO);
  if (capacity - sellerFood < listing.askAmount) return { population: null, listing, code: 'BOT_MARKET_SELLER_STORAGE_FULL', events: integrated.events };

  const transactionId = `${listing.id}:TX`;
  if (population.marketTransactions.some(row => row.id === transactionId)) {
    return { population: null, listing, code: 'BOT_MARKET_TRANSACTION_ALREADY_RECORDED', events: integrated.events };
  }
  const transaction: BotMarketTransaction = {
    id: transactionId, listingId: listing.id, sellerBotId: sellerCold.botId, buyerBotId: 'LI_LAN',
    blueprintItemInstanceId: item.instanceId, blueprintId: item.blueprintId, paymentResource: listing.paymentResource,
    paymentAmount: listing.askAmount, occurredAtElapsedMs: at, ruleVersion: BOT_MARKET_RULE_VERSION,
  };
  sellerCold = {
    ...sellerCold,
    starvationExposureMs: 0,
    lordStarvationExposureMs: 0,
    blueprintItems: sellerCold.blueprintItems.map(candidate => candidate.instanceId !== item.instanceId ? candidate : {
      ...candidate, status: 'sold' as const, resolvedAtElapsedMs: at, transactionId,
    }),
  };
  hot.foodMicro[sellerOffset] += listing.askAmount * BOT_MICRO;
  working.coldRows[sellerOffset] = sellerCold;
  working.dirtyOffsets.add(sellerOffset);
  working.wakeDirtyOffsets.add(sellerOffset);
  hot.nextWakeAtElapsedMs[sellerOffset] = nextSellerMarketWake(population, sellerCold, at, nextBotWake(sellerCold, hot, sellerOffset, at));
  const marketListings = population.marketListings.map(row => row.id !== listing.id ? row : {
    ...row, status: 'filled' as const, buyerBotId: 'LI_LAN', transactionId, resolvedAtElapsedMs: at,
  });
  population = { ...population, marketListings, marketTransactions: [...population.marketTransactions, transaction] };
  markBotPopulationChunkChanged(population);
  const schedulerHeap = heapifyBotScheduler(population.schedulerHeap.filter(row => row.chunkIndex !== sellerChunk.index));
  updateChunkSchedule(schedulerHeap, sellerChunk, working);
  population = { ...population, schedulerHeap };
  population = finishBotPopulationAdvance(flushBotPopulationChunks(population)!)!;
  return { population, listing: marketListings.find(row => row.id === listing.id)!, code: null, events: [
    ...integrated.events,
    { type: 'bot_market_trade_settled', occurredAtElapsedMs: at, payload: {
      transactionId, listingId: listing.id, sellerBotId: sellerCold.botId, buyerBotId: 'LI_LAN',
      blueprintItemInstanceId: item.instanceId, blueprintId: item.blueprintId, paymentResource: listing.paymentResource,
      paymentAmount: listing.askAmount, feeAmount: 0, ruleVersion: BOT_MARKET_RULE_VERSION,
    } },
  ] };
}

function regionalChest(seed: string, cold: BotColdRecord, source: BotSearchSource, actionId: string): FieldChest {
  const grades: readonly FieldChest['grade'][] = ['Mộc', 'Thanh Đồng', 'Bạch Ngân', 'Hoàng Kim', 'Hạo Nguyệt'];
  const roll = randomIntFromFields([seed, cold.botId, source.id, actionId, BOT_CHEST_RULE_VERSION, 'rarity'], 0, grades.length - 1).value;
  return {
    id: `${source.id}:CHEST`, cacheId: source.id, chestType: 'field', eventId: null, grade: grades[roll]!,
    position: source.position, ring: 'BOT-REGIONAL-OVERLAY', accessStatement: 'Finite bot regional chest source.',
    lootCommitment: canonicalStateHash([seed, cold.botId, source.id, actionId, BOT_CHEST_RULE_VERSION, 'loot']),
    source: { path: BOT_CHEST_RULE_VERSION, heading: 'Finite regional chest overlay', recordId: source.id },
  };
}

/** Claims the same world chest ledger used by the player, or creates one unique finite regional chest. */
export function acquireBotChest(
  state: Pick<GameState, 'fieldChestStates'>,
  world: WorldDefinition | undefined,
  coldInput: BotColdRecord,
  source: BotSearchSource,
  actionId: string,
  seed: string,
  at: number,
): { cold: BotColdRecord; result: 'discovered' | 'duplicate' | 'depleted' | 'blocked'; event: BotSimulationEvent | null } {
  if (coldInput.ownedChests.some(chest => chest.fieldChestId === (source.fieldChestId ?? null) && source.fieldChestId !== undefined)) {
    return { cold: coldInput, result: 'duplicate', event: null };
  }
  let sourceChest: FieldChest;
  if (source.fieldChestId) {
    if (!world) return { cold: coldInput, result: 'blocked', event: null };
    const found = world.fieldChests.find(chest => chest.id === source.fieldChestId && chest.chestType === 'field');
    const runtime = state.fieldChestStates.find(chest => chest.chestId === source.fieldChestId);
    if (!found || !runtime || runtime.state !== 'unopened' || runtime.custody !== 'world') {
      return { cold: coldInput, result: 'depleted', event: null };
    }
    sourceChest = found;
    state.fieldChestStates = state.fieldChestStates.map(chest => chest.chestId !== source.fieldChestId ? chest : {
      ...chest, custody: 'carried', claimedById: coldInput.botId, carrierId: coldInput.botId,
    });
  } else {
    sourceChest = regionalChest(seed, coldInput, source, actionId);
  }
  const owned: BotOwnedChest = {
    chestId: sourceChest.id, fieldChestId: source.fieldChestId ?? null, sourceId: source.id,
    chestType: sourceChest.chestType, eventId: sourceChest.eventId, grade: sourceChest.grade,
    lootCommitment: sourceChest.lootCommitment, acquiredAtElapsedMs: at, status: 'owned',
    openedAtElapsedMs: null, lootReceiptId: null, lootOutcome: null, ruleVersion: BOT_CHEST_RULE_VERSION,
  };
  return {
    cold: { ...coldInput, ownedChests: [...coldInput.ownedChests, owned] }, result: 'discovered',
    event: { type: 'bot_chest_acquired', occurredAtElapsedMs: at, payload: {
      botId: coldInput.botId, chestId: owned.chestId, fieldChestId: owned.fieldChestId,
      sourceId: source.id, chestType: owned.chestType, rarity: owned.grade, ruleVersion: BOT_CHEST_RULE_VERSION,
    } },
  };
}

/** Opens an owned chest once and applies its compiled loot to finite bot stores or durable item inventory. */
export function openBotChest(
  state: Pick<GameState, 'seed' | 'fieldChestStates'>,
  world: WorldDefinition | undefined,
  coldInput: BotColdRecord,
  hot: ReturnType<typeof hydrateBotHotArrays>,
  offset: number,
  chestId: string,
  at: number,
): { cold: BotColdRecord; result: BotActionReceipt['result']; events: BotSimulationEvent[] } {
  const owned = coldInput.ownedChests.find(chest => chest.chestId === chestId && chest.status === 'owned');
  if (!owned) return { cold: coldInput, result: 'depleted', events: [] };
  let chest: FieldChest;
  if (owned.fieldChestId) {
    if (!world) return { cold: coldInput, result: 'blocked', events: [] };
    const found = world.fieldChests.find(candidate => candidate.id === owned.fieldChestId);
    const runtime = state.fieldChestStates.find(candidate => candidate.chestId === owned.fieldChestId);
    if (!found || !runtime || runtime.state !== 'unopened' || runtime.custody !== 'carried' || runtime.claimedById !== coldInput.botId) {
      return { cold: coldInput, result: 'blocked', events: [] };
    }
    chest = found;
  } else {
    const source = coldInput.searchSources.find(candidate => candidate.id === owned.sourceId);
    if (!source) return { cold: coldInput, result: 'blocked', events: [] };
    chest = { ...regionalChest(state.seed, coldInput, source, `${owned.chestId}:OPEN`), id: owned.chestId,
      grade: owned.grade, lootCommitment: owned.lootCommitment };
  }
  let outcome: ReturnType<typeof deterministicChestOutcome>;
  try { outcome = deterministicChestOutcome(state.seed, chest); }
  catch { return { cold: coldInput, result: 'blocked', events: [{ type: 'bot_chest_blocked', occurredAtElapsedMs: at,
    payload: { botId: coldInput.botId, chestId, blocker: 'CHEST_LOOT_TABLE_NOT_COMPILED', ruleVersion: BOT_CHEST_RULE_VERSION } }] }; }
  let cold = { ...coldInput, inventoryItems: [...coldInput.inventoryItems] };
  const addItem = (itemTemplateId: string, quantity: number, suffix = ''): void => {
    if (quantity <= 0) return;
    const instanceId = `${owned.chestId}:LOOT:${itemTemplateId}${suffix}`;
    if (!cold.inventoryItems.some(item => item.instanceId === instanceId)) cold.inventoryItems.push({
      instanceId, itemTemplateId, quantity, sourceId: owned.chestId, acquiredAtElapsedMs: at, ruleVersion: BOT_CHEST_RULE_VERSION,
    });
  };
  for (const reward of outcome.rewardStacks) {
    if (reward.templateId === 'WOOD' || reward.templateId === 'STONE' || reward.templateId === 'WILD-FOOD') {
      const resource = reward.templateId === 'WILD-FOOD' ? 'food' : reward.templateId.toLowerCase() as 'wood' | 'stone';
      const field = `${resource}Micro` as const;
      const cap = botResourceCapacityUnits(resource, cold.territoryLevel) * BOT_MICRO;
      const accepted = Math.min(reward.quantity, Math.floor(Math.max(0, cap - hot[field][offset]!) / BOT_MICRO));
      hot[field][offset] += accepted * BOT_MICRO;
      addItem(reward.templateId, reward.quantity - accepted, ':OVERFLOW');
    } else if (reward.templateId === 'RAW-ICE-WATER') {
      const requestedMl = reward.quantity * 1_000;
      const acceptedMl = Math.min(requestedMl, Math.max(0, BOT_LOCAL_ICE_STOCK_ML - cold.localIceRemainingMl));
      cold.localIceRemainingMl += acceptedMl;
      const overflowLitres = Math.ceil((requestedMl - acceptedMl) / 1_000);
      addItem(reward.templateId, overflowLitres, ':OVERFLOW');
    } else addItem(reward.templateId, reward.quantity);
  }
  const lootOutcome = outcome.rewardStacks.map(item => ({ itemTemplateId: item.templateId, quantity: item.quantity }));
  const lootReceiptId = `${owned.chestId}:OPEN:${BOT_CHEST_RULE_VERSION}`;
  cold.ownedChests = cold.ownedChests.map(item => item.chestId !== owned.chestId ? item : {
    ...item, status: 'opened', openedAtElapsedMs: at, lootReceiptId, lootOutcome,
  });
  if (owned.fieldChestId) state.fieldChestStates = state.fieldChestStates.map(item => item.chestId !== owned.fieldChestId ? item : {
    ...item, state: 'opened', openedAtElapsedMs: at, custody: 'opened', claimedById: cold.botId, carrierId: null,
    lootOutcome: { ruleVersion: outcome.ruleVersion, rewardStacks: outcome.rewardStacks },
  });
  return { cold, result: 'completed', events: [
    { type: 'bot_chest_opened', occurredAtElapsedMs: at, payload: {
      botId: cold.botId, chestId, fieldChestId: owned.fieldChestId, lootReceiptId, ruleVersion: outcome.ruleVersion,
    } },
    { type: 'bot_chest_loot_applied', occurredAtElapsedMs: at, payload: { botId: cold.botId, chestId, loot: lootOutcome } },
  ] };
}

function botChunkAtOrdinal(population: BotPopulationState, ordinal: number): { chunk: BotStateChunk; offset: number } | null {
  if (ordinal < 1 || ordinal > population.botCount) return null;
  const index = Math.floor((ordinal - 1) / population.chunkSize);
  const chunk = population.chunks[index];
  if (!chunk) return null;
  return { chunk, offset: ordinal - chunk.firstOrdinal };
}

export function consumeSharedWildlifeStock(population: BotPopulationState, stockId: string): { stock: BotSharedWildlifeStock | null; population: BotPopulationState } {
  const stocks = population.sharedWildlifeStocks as BotSharedWildlifeStock[];
  let low = 0;
  let high = stocks.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (stocks[middle]!.id < stockId) low = middle + 1;
    else high = middle;
  }
  const current = stocks[low];
  if (!current || current.id !== stockId || current.remainingActions <= 0) return { stock: null, population };
  const next = { ...current, remainingActions: current.remainingActions - 1 };
  stocks[low] = next;
  markBotSharedWildlifeChanged(population);
  return { stock: next, population };
}

function changeActiveStructureCapacity(hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, blueprintId: string, delta: -1 | 1): void {
  if (blueprintId === 'BP-BOT-FARM') hot.farmCount[offset] = Math.max(0, hot.farmCount[offset]! + delta);
  else if (blueprintId === 'BP-BOT-WOOD-MILL') hot.millCount[offset] = Math.max(0, hot.millCount[offset]! + delta);
  else if (blueprintId === 'BP-BOT-QUARRY') hot.quarryCount[offset] = Math.max(0, hot.quarryCount[offset]! + delta);
  else if (blueprintId === 'BP-BOT-BARRACKS') hot.barracksCount[offset] = Math.max(0, hot.barracksCount[offset]! + delta);
  else if (blueprintId === 'BP-BOT-WALL') hot.wallCount[offset] = Math.max(0, hot.wallCount[offset]! + delta);
}

function raidDamagedStructure(cold: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number): { cold: BotColdRecord; event: BotSimulationEvent | null } {
  const priority = new Map([['BP-BOT-BARRACKS', 0], ['BP-BOT-WORKSHOP', 1], ['BP-BOT-FARM', 2], ['BP-BOT-WOOD-MILL', 3], ['BP-BOT-QUARRY', 4], ['BP-BOT-WATCHTOWER', 5], ['BP-BOT-WALL', 6]]);
  const target = cold.structures.filter(item => item.status === 'active' || item.status === 'damaged')
    .slice().sort((a, b) => (priority.get(a.blueprintId) ?? 20) - (priority.get(b.blueprintId) ?? 20) || compareId(a.id, b.id))[0];
  if (!target) return { cold, event: null };
  const damagePermille = Math.min(1_000, target.damagePermille + 250);
  const status = damagePermille >= 1_000 ? 'destroyed' as const : 'damaged' as const;
  if (target.status === 'active') changeActiveStructureCapacity(hot, offset, target.blueprintId, -1);
  if (status === 'destroyed') hot.buildingCount[offset] = Math.max(0, hot.buildingCount[offset]! - 1);
  const structures = cold.structures.map(item => item.id === target.id ? { ...item, status, damagePermille } : item);
  return {
    cold: { ...cold, structures },
    event: { type: status === 'destroyed' ? 'bot_structure_destroyed' : 'bot_structure_damaged', occurredAtElapsedMs: at,
      payload: { botId: cold.botId, structureId: target.id, blueprintId: target.blueprintId, damagePermille, cause: 'raid' } },
  };
}

function persistTargetChunk(population: BotPopulationState, targetChunk: BotStateChunk, targetHot: ReturnType<typeof hydrateBotHotArrays>, targetColdRows: BotColdRecord[], targetOffset: number, isLocalChunk: boolean): { population: BotPopulationState; localChangedOffsets: number[] } {
  if (isLocalChunk) {
    return { population, localChangedOffsets: [targetOffset] };
  }
  const working = workingChunk(population, targetChunk);
  if (working.hot !== targetHot || working.coldRows !== targetColdRows) throw new Error('BOT_TARGET_WORKING_SET_MISMATCH');
  working.dirtyOffsets.add(targetOffset);
  working.wakeDirtyOffsets.add(targetOffset);
  return { population, localChangedOffsets: [] };
}

function playerUnitAtTerritory(state: GameState, unitId: string): boolean {
  const unit = state.ownedUnits.find(row => row.id === unitId);
  if (!unit) return false;
  const position = unit.position ?? (unit.location.kind === 'field' ? unit.location.coordinate : null);
  if (position) return Math.hypot(position.xMm - state.territory.position.xMm, position.yMm - state.territory.position.yMm) <= 20_000;
  return unit.location.kind === 'site' && unit.location.siteId === 'SITE-LL01-000';
}

function playerDefensePermille(state: GameState): number {
  const builtDefense = state.buildings.filter(building => building.status === 'active'
    && (building.siteId === 'SITE-LL01-000' || (building.position && Math.hypot(building.position.xMm - state.territory.position.xMm, building.position.yMm - state.territory.position.yMm) <= 20_000))
    && /(?:wall|tower|defense|watch)/i.test(`${building.kind} ${building.blueprintId ?? ''}`))
    .reduce((sum, building) => sum + 100 * building.level, 0);
  return Math.min(1_200, builtDefense + (state.territory.survivalFire.active ? 75 : 0));
}

function playerUnitPower(state: GameState, unitId: string): number {
  const unit = state.ownedUnits.find(row => row.id === unitId);
  if (!unit) return 0;
  const attributes = unit.attributes ?? {};
  const weaponPower = unit.equipmentIds.reduce((sum, itemId) => {
    const stack = state.inventory.containers.flatMap(container => container.stacks).find(item => item.itemId === itemId && item.equipped && item.ownerId === unit.id);
    return sum + Math.max(0, Number(stack?.combatEffects?.weaponBase ?? 0));
  }, 0);
  const healthFactor = unit.health ? Math.max(0, Math.min(1, unit.health.current / Math.max(1, unit.health.max))) : 1;
  return Math.max(1, Math.floor((25 + unit.level * 8 + Number(attributes.STR ?? 0) * 3 + Number(attributes.DEX ?? 0) * 2 + weaponPower) * healthFactor));
}

function retreatingArmy(coldInput: BotColdRecord, targetPosition: CoordinateMm, at: number): BotColdRecord {
  const survivors = coldInput.cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
  const returnMs = Math.ceil(Math.hypot(targetPosition.xMm - coldInput.lastSafePosition.xMm, targetPosition.yMm - coldInput.lastSafePosition.yMm) * 3_600_000 / BOT_ARMY_TRAVEL_MM_PER_HOUR);
  return {
    ...coldInput,
    cohorts: coldInput.cohorts.map(cohort => ({ ...cohort, order: survivors > 0 ? 'retreat' : 'recover', location: targetPosition })),
    armyMovement: survivors > 0 && returnMs > 0 ? {
      orderId: coldInput.currentPlan?.actionId ?? `${coldInput.botId}:RETREAT:${at}`,
      targetId: coldInput.armyMovement?.targetId ?? coldInput.botId,
      unitKind: 'army', unitCount: survivors,
      cohortMemberCounts: coldInput.cohorts.filter(cohort => cohort.livingCount > 0)
        .map(cohort => ({ cohortId: cohort.id, memberCount: cohort.livingCount })),
      from: targetPosition, to: coldInput.lastSafePosition, startedAtElapsedMs: at,
      arrivesAtElapsedMs: at + returnMs, status: 'returning',
    } : null,
  };
}

function raidPlayerTerritory(coldInput: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, plan: BotPlanState, state: GameState, at: number): { cold: BotColdRecord; result: BotActionReceipt['result']; casualties: number; enemyCasualties: number; drawIndex: number; events: BotSimulationEvent[] } {
  const movement = coldInput.armyMovement;
  if (!movement || movement.unitKind !== 'army' || movement.targetId !== 'LI_LAN' || movement.status !== 'besieging') {
    return { cold: coldInput, result: 'blocked', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [] };
  }
  if (at < state.territory.survivalFire.protectedThroughElapsedMs) {
    const cold = retreatingArmy(coldInput, movement.to, at);
    return { cold, result: 'retreated', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [{ type: 'bot_raid_player_attack', occurredAtElapsedMs: at, payload: { attackerId: coldInput.botId, result: 'retreated', protected: true } }] };
  }
  const defenderIds = state.ownedUnits.filter(unit => Boolean(unit.health && unit.health.current > 0) && playerUnitAtTerritory(state, unit.id))
    .map(unit => unit.id).sort(compareId);
  const attackerMembers = hot.armySize[offset]!;
  if (attackerMembers < 1) return { cold: { ...coldInput, armyMovement: null }, result: 'defeated', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [] };
  const attackerPower = botCohortPower(coldInput, (['S', 'A', 'B', 'C', 'D'] as const)[hot.talentGrades[offset]!]!, (['combat', 'production'] as const)[hot.talentKinds[offset]!]!);
  let attackerLosses = 0;
  let defenderLosses = 0;
  let attackerWoundHealth = 0;
  let drawIndex = 0;
  let attackerWins = defenderIds.length === 0;
  if (defenderIds.length > 0) {
    const defenderPower = defenderIds.reduce((sum, id) => sum + playerUnitPower(state, id), 0);
    const battle = resolveBotBattle(state.seed, plan.actionId, {
      power: Math.max(1, attackerPower), memberCount: attackerMembers, defensePermille: 0,
    }, { power: Math.max(1, defenderPower), memberCount: defenderIds.length, defensePermille: playerDefensePermille(state) });
    attackerWins = battle.winner === 'attacker';
    attackerLosses = battle.attackerLosses;
    defenderLosses = battle.defenderLosses;
    attackerWoundHealth = woundHealthForLoss(battle.attackerLossPermille);
    drawIndex = battle.drawIndex;
    for (const id of defenderIds.slice(0, defenderLosses)) {
      state.ownedUnits = state.ownedUnits.map(unit => unit.id !== id || !unit.health ? unit : { ...unit, health: { ...unit.health, current: 0 } });
      const casualty = resolveSquadCasualty(state, id, plan.actionId, at);
      Object.assign(state, casualty.state);
    }
  }
  let cold = applyBotCasualties(coldInput, hot, offset, attackerLosses, attackerWoundHealth, undefined, true).cold;
  let foodTaken = 0;
  let firewoodTaken = 0;
  let damagedBuildingId: string | null = null;
  if (attackerWins) {
    const supply = state.inventory.containers.find(container => container.id === state.territory.supplyContainerId && container.kind === 'territory_supply');
    if (supply) {
      let remainingSlots = 6;
      let stacks = supply.stacks.map(stack => {
        if (stack.templateId !== 'BREAD' || remainingSlots <= 0) return stack;
        const available = Math.max(0, stack.quantity - (stack.reservedQuantity ?? 0));
        const taken = Math.min(available, remainingSlots);
        remainingSlots -= taken;
        foodTaken += taken * (stack.foodUnitsPerItem ?? 1);
        return { ...stack, quantity: stack.quantity - taken };
      }).filter(stack => stack.quantity > 0);
      state.inventory = { ...state.inventory, containers: state.inventory.containers.map(container => container.id === supply.id ? { ...container, stacks } : container) };
    }
    const fire = state.territory.survivalFire;
    firewoodTaken = Math.min(2, Math.max(0, fire.fuelRemaining ?? 0));
    fire.fuelRemaining = Math.max(0, (fire.fuelRemaining ?? 0) - firewoodTaken);
    if (fire.fuelRemaining === 0 && fire.active) {
      fire.active = false;
      fire.nextFuelConsumptionAtElapsedMs = null;
    }
    const defensiveBuilding = state.buildings.filter(building => building.status === 'active'
      && (building.siteId === 'SITE-LL01-000' || (building.position && Math.hypot(building.position.xMm - state.territory.position.xMm, building.position.yMm - state.territory.position.yMm) <= 20_000))
      && /(?:wall|tower|defense|watch)/i.test(`${building.kind} ${building.blueprintId ?? ''}`)).sort((a, b) => compareId(a.id, b.id))[0];
    if (defensiveBuilding) {
      damagedBuildingId = defensiveBuilding.id;
      state.buildings = state.buildings.map(building => building.id === defensiveBuilding.id ? { ...building, status: 'damaged' } : building);
    }
    cold = addCarriedLoot(cold, 'food', foodTaken);
    cold.carriedCargo = { ...cold.carriedCargo, firewood: cold.carriedCargo.firewood + firewoodTaken };
  }
  const survivors = hot.armySize[offset]!;
  cold = retreatingArmy(cold, movement.to, at);
  const result: BotActionReceipt['result'] = survivors === 0 ? 'defeated' : attackerWins ? 'completed' : 'retreated';
  const publicResult = attackerWins ? 'supplies_taken' : 'retreated';
  const events: BotSimulationEvent[] = [
    { type: 'bot_battle_settled', occurredAtElapsedMs: at, payload: { attackerId: cold.botId, targetId: 'LI_LAN', winner: attackerWins ? 'attacker' : 'defender', attackerLosses, defenderLosses, foodTaken, firewoodTaken, damagedBuildingId, ruleVersion: BOT_COMBAT_RULE_VERSION, drawIndex } },
    { type: 'bot_raid_player_attack', occurredAtElapsedMs: at, payload: { attackerId: cold.botId, result: publicResult } },
  ];
  return { cold, result, casualties: attackerLosses, enemyCasualties: defenderLosses, drawIndex, events };
}

function raidBotSettlement(
  populationInput: BotPopulationState,
  currentChunk: BotStateChunk,
  currentHot: ReturnType<typeof hydrateBotHotArrays>,
  currentColdRows: BotColdRecord[],
  attackerOffset: number,
  attackerInput: BotColdRecord,
  targetId: string,
  plan: BotPlanState,
  at: number,
): { population: BotPopulationState; cold: BotColdRecord; result: BotActionReceipt['result']; casualties: number; enemyCasualties: number; drawIndex: number; localChangedOffsets: number[]; events: BotSimulationEvent[] } {
  const ordinal = botOrdinalFromId(targetId);
  const targetRef = ordinal === null || ordinal > populationInput.botCount ? null : botChunkAtOrdinal(populationInput, ordinal);
  const movement = attackerInput.armyMovement;
  if (!targetRef || !movement || movement.unitKind !== 'army' || movement.targetId !== targetId || movement.status !== 'besieging') {
    return { population: populationInput, cold: attackerInput, result: 'depleted', casualties: 0, enemyCasualties: 0, drawIndex: 0, localChangedOffsets: [], events: [] };
  }
  const targetChunk = targetRef.chunk;
  const targetOffset = targetRef.offset;
  const sameChunk = targetChunk.index === currentChunk.index;
  const targetWorking = sameChunk ? null : workingChunk(populationInput, targetChunk);
  const targetHot = sameChunk ? currentHot : targetWorking!.hot;
  const targetColdRows = sameChunk ? currentColdRows : targetWorking!.coldRows;
  const targetGrade = (['S', 'A', 'B', 'C', 'D'] as const)[targetChunk.talentGrades[targetOffset]!]!;
  const targetKind = (['combat', 'production'] as const)[targetChunk.talentKinds[targetOffset]!]!;
  const integrated = integrateBot(targetColdRows[targetOffset]!, targetHot, targetHot, targetOffset, at, targetGrade, targetKind, populationInput.saveSeed);
  let targetCold = integrated.cold;
  let populationAfter = populationInput;
  targetColdRows[targetOffset] = targetCold;
  const attackerCounts = botMovementCohortCounts(attackerInput, movement);
  const defenderCounts = botHomeCohortCounts(targetCold);
  const attackerMembers = [...attackerCounts.values()].reduce((sum, count) => sum + count, 0);
  const defenderMembers = [...defenderCounts.values()].reduce((sum, count) => sum + count, 0);
  if (attackerMembers < 1) return { population: populationInput, cold: { ...attackerInput, armyMovement: null }, result: 'defeated', casualties: 0, enemyCasualties: 0, drawIndex: 0, localChangedOffsets: [], events: [] };
  if (targetHot.alive[targetOffset] === 0) {
    const cold = retreatingArmy(attackerInput, movement.to, at);
    targetHot.nextWakeAtElapsedMs[targetOffset] = Math.min(targetHot.nextWakeAtElapsedMs[targetOffset]!, at + 1);
    const released = cancelBotMarketListings(populationAfter, targetCold, at,
      targetCold.lordFate.status === 'captured' ? 'captured' : targetCold.lordFate.status === 'dispossessed' ? 'dispossessed' : 'lord_eliminated');
    populationAfter = released.population;
    targetCold = released.cold;
    targetColdRows[targetOffset] = targetCold;
    const persisted = persistTargetChunk(populationAfter, targetChunk, targetHot, targetColdRows, targetOffset, sameChunk);
    return { ...persisted, population: populationAfter, cold, result: 'depleted', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [...integrated.events, ...released.events, { type: 'bot_raid_depleted', occurredAtElapsedMs: at, payload: { attackerId: attackerInput.botId, targetId } }] };
  }
  const attackerGrade = (['S', 'A', 'B', 'C', 'D'] as const)[currentHot.talentGrades[attackerOffset]!]!;
  const attackerKind = (['combat', 'production'] as const)[currentHot.talentKinds[attackerOffset]!]!;
  const defensePermille = botSettlementDefensePermille(targetCold);
  const battle = resolveBotSettlementBattle(populationInput.saveSeed, plan.actionId,
    { power: Math.max(1, botCohortPower(attackerInput, attackerGrade, attackerKind, attackerCounts)), memberCount: attackerMembers, defensePermille: 0 },
    { power: defenderMembers > 0 ? Math.max(1, botCohortPower(targetCold, targetGrade, targetKind, defenderCounts)) : 1,
      memberCount: defenderMembers, defensePermille }, defensePermille);
  const attackerResult = applyBotCasualties(attackerInput, currentHot, attackerOffset, battle.attackerLosses,
    woundHealthForLoss(battle.attackerLossPermille), attackerCounts, true);
  const targetResult = applyBotCasualties(targetCold, targetHot, targetOffset, battle.defenderLosses,
    woundHealthForLoss(battle.defenderLossPermille), defenderCounts);
  targetCold = targetResult.cold;
  const structureDamage = battle.winner === 'attacker' ? raidDamagedStructure(targetCold, targetHot, targetOffset, at) : { cold: targetCold, event: null };
  targetCold = structureDamage.cold;
  let fateEvent: BotSimulationEvent | null = null;
  const keepDestroyed = targetCold.structures.some(structure => structure.blueprintId === 'BP-BOT-KEEP' && structure.status === 'destroyed');
  if (battle.winner === 'attacker' && keepDestroyed && targetCold.lordFate.status === 'active') {
    targetCold = { ...targetCold, lordFate: { status: 'captured', changedAtElapsedMs: at,
      cause: 'battle_capture', triggerId: plan.actionId } };
    targetHot.alive[targetOffset] = 0;
    targetHot.nextWakeAtElapsedMs[targetOffset] = Number.MAX_SAFE_INTEGER;
    const preempted = preemptPlan(targetCold, targetChunk, targetHot, targetOffset, at, 'LORD_CAPTURED');
    targetCold = { ...preempted.cold, armyMovement: null };
    if (preempted.event) integrated.events.push(preempted.event);
    fateEvent = { type: 'bot_lord_captured', occurredAtElapsedMs: at, payload: {
      botId: targetCold.botId, captorId: attackerInput.botId, cause: 'battle_capture', triggerId: plan.actionId,
      ruleVersion: BOT_COMBAT_RULE_VERSION,
    } };
  }
  if (targetHot.population[targetOffset] === 0 && targetCold.lordFate.status === 'active') {
    targetCold = { ...targetCold, lordFate: { status: 'dispossessed', changedAtElapsedMs: at,
      cause: 'territory_loss', triggerId: plan.actionId } };
    targetHot.alive[targetOffset] = 0;
    targetHot.nextWakeAtElapsedMs[targetOffset] = Number.MAX_SAFE_INTEGER;
    const preempted = preemptPlan(targetCold, targetChunk, targetHot, targetOffset, at, 'SETTLEMENT_DEFEATED');
    targetCold = { ...preempted.cold, armyMovement: null };
    if (preempted.event) integrated.events.push(preempted.event);
    integrated.events.push({ type: 'bot_lord_dispossessed', occurredAtElapsedMs: at, payload: {
      botId: targetCold.botId, cause: 'territory_loss', triggerId: plan.actionId, ruleVersion: BOT_COMBAT_RULE_VERSION,
    } });
  }
  targetColdRows[targetOffset] = targetCold;
  if (targetHot.alive[targetOffset] !== 0 && targetHot.nextWakeAtElapsedMs[targetOffset]! > at) targetHot.nextWakeAtElapsedMs[targetOffset] = at + 1;
  if (targetHot.population[targetOffset] === 0) {
    targetHot.alive[targetOffset] = 0;
    targetHot.nextWakeAtElapsedMs[targetOffset] = Number.MAX_SAFE_INTEGER;
    if (targetCold.currentPlan) {
      const preempted = preemptPlan(targetCold, targetChunk, targetHot, targetOffset, at, 'SETTLEMENT_DEFEATED');
      targetCold = { ...preempted.cold, armyMovement: null };
      if (preempted.event) integrated.events.push(preempted.event);
      targetColdRows[targetOffset] = targetCold;
    }
  }
  if (targetCold.lordFate.status !== 'active') {
    const released = cancelBotMarketListings(populationAfter, targetCold, at,
      targetCold.lordFate.status === 'captured' ? 'captured' : targetCold.lordFate.status === 'dispossessed' ? 'dispossessed' : 'lord_eliminated');
    populationAfter = released.population;
    targetCold = released.cold;
    targetColdRows[targetOffset] = targetCold;
    integrated.events.push(...released.events);
  }
  let cold = attackerResult.cold;
  let loot: Record<BotResourceKey, number> = { food: 0, wood: 0, stone: 0, ore: 0 };
  if (battle.winner === 'attacker') {
    let remainingCapacity = Math.max(0, 60 - Object.values(cold.carriedCargo).reduce((sum, value) => sum + value, 0));
    for (const key of ['food', 'wood', 'stone', 'ore'] as const) {
      if (remainingCapacity <= 0) break;
      const balanceField = `${key}Micro` as const;
      const availableUnits = Math.floor(targetHot[balanceField][targetOffset]! / BOT_MICRO);
      const amount = Math.min(remainingCapacity, 20, Math.floor(availableUnits / 4));
      if (amount <= 0) continue;
      targetHot[balanceField][targetOffset] -= amount * BOT_MICRO;
      remainingCapacity -= amount;
      loot[key] = amount;
      cold = addCarriedLoot(cold, key, amount);
    }
  }
  const coldAtTarget = targetColdRows[targetOffset]!;
  const survivors = currentHot.armySize[attackerOffset]!;
  cold = retreatingArmy(cold, movement.to, at);
  targetColdRows[targetOffset] = coldAtTarget;
  const persisted = persistTargetChunk(populationAfter, targetChunk, targetHot, targetColdRows, targetOffset, sameChunk);
  const result: BotActionReceipt['result'] = survivors === 0 ? 'defeated' : battle.winner === 'attacker' ? 'completed' : 'retreated';
  const events: BotSimulationEvent[] = [
    ...integrated.events.filter(event => event.type === 'bot_population_lost' || event.type === 'bot_settlement_defeated'),
    { type: 'bot_battle_settled', occurredAtElapsedMs: at, payload: { attackerId: cold.botId, targetId, winner: battle.winner,
      attackerLosses: attackerResult.applied, defenderLosses: targetResult.applied, defenderMembers, defensePermille, loot,
      ruleVersion: BOT_COMBAT_RULE_VERSION, drawIndex: battle.drawIndex } },
    ...(structureDamage.event ? [structureDamage.event] : []),
    ...(fateEvent ? [fateEvent] : []),
  ];
  return { ...persisted, cold, result, casualties: attackerResult.applied, enemyCasualties: targetResult.applied, drawIndex: battle.drawIndex, events };
}

export function completePlan(population: BotPopulationState, chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, coldRows: BotColdRecord[], offset: number, coldInput: BotColdRecord, grade: BotTalentGrade, state: GameState, at: number, world?: WorldDefinition): { cold: BotColdRecord; population: BotPopulationState; localChangedOffsets: number[]; externallyChangedChunkIndices: number[]; events: BotSimulationEvent[]; xpCrossed: number[] } {
  const plan = coldInput.currentPlan;
  if (!plan) return { cold: coldInput, population, localChangedOffsets: [], externallyChangedChunkIndices: [], events: [], xpCrossed: [] };
  let updatedPopulation = population;
  let localChangedOffsets: number[] = [];
  const externallyChangedChunkIndices: number[] = [];
  let cold = { ...coldInput };
  const before: Record<BotResourceKey, number> = { ...plan.startingResourcesMicro };
  const canPay = (Object.keys(plan.reserved) as BotResourceKey[]).every(key => hot[`${key}Micro` as const][offset]! >= plan.reserved[key] * BOT_MICRO);
  let result: BotActionReceipt['result'] = canPay ? 'completed' : 'blocked';
  let drawIndex = 0;
  let discovered = false;
  let casualties = 0;
  let enemyCasualties = 0;
  let recovered = false;
  let events: BotSimulationEvent[] = [];

  if (!canPay) result = 'blocked';
  else if (plan.action === 'list_blueprint') {
    const item = cold.blueprintItems.find(candidate => candidate.instanceId === plan.targetId && candidate.status === 'owned');
    const paymentResource = plan.marketPaymentResource;
    const activeListings = updatedPopulation.marketListings.filter(listing => listing.sellerBotId === cold.botId && listing.status === 'active').length;
    if (!item || !BOT_BLUEPRINT_BY_ID.has(item.blueprintId) || !paymentResource || activeListings >= BOT_MARKET_MAX_LISTINGS_PER_BOT
      || cold.lordFate.status !== 'active') result = 'blocked';
    else {
      const activeSameBlueprint = updatedPopulation.marketListings.filter(listing => listing.status === 'active' && listing.blueprintId === item.blueprintId).length;
      const listingId = `${plan.actionId}:MARKET`;
      const listing: BotMarketListing = {
        id: listingId, sellerBotId: cold.botId, blueprintItemInstanceId: item.instanceId, blueprintId: item.blueprintId,
        paymentResource, askAmount: botMarketAsk(item.blueprintId, paymentResource, activeSameBlueprint),
        createdAtElapsedMs: at, lastRepricedAtElapsedMs: at, repriceCount: 0, expiresAtElapsedMs: at + BOT_MARKET_LISTING_DURATION_MS,
        status: 'active', buyerBotId: null, transactionId: null, resolvedAtElapsedMs: null,
      };
      cold = { ...cold, blueprintItems: cold.blueprintItems.map(candidate => candidate.instanceId !== item.instanceId ? candidate : {
        ...candidate, status: 'escrowed' as const,
      }) };
      updatedPopulation = { ...updatedPopulation, marketListings: [...updatedPopulation.marketListings, listing] };
      events.push({ type: 'bot_market_listing_created', occurredAtElapsedMs: at, payload: {
        listingId, sellerBotId: cold.botId, blueprintItemInstanceId: item.instanceId, blueprintId: item.blueprintId,
        paymentResource, askAmount: listing.askAmount, expiresAtElapsedMs: listing.expiresAtElapsedMs, ruleVersion: BOT_MARKET_RULE_VERSION,
      } });
      const settlement = settleBotMarketListing(updatedPopulation, chunk, hot, coldRows, offset, cold, listingId, at);
      updatedPopulation = settlement.population;
      cold = settlement.sellerCold;
      localChangedOffsets = settlement.localChangedOffsets;
      externallyChangedChunkIndices.push(...settlement.externallyChangedChunkIndices);
      events.push(...settlement.events);
    }
  } else if (plan.action === 'upgrade_territory') {
    const upgrade = botTerritoryUpgradeFor(cold.territoryLevel);
    const completedStructures = cold.structures.filter(item => item.status === 'active' || item.status === 'damaged');
    const prerequisitesMet = Boolean(upgrade && plan.targetId === `${cold.botId}:TERRITORY:${upgrade.toLevel}`
      && completedStructures.length >= upgrade.minimumCompletedStructures
      && upgrade.requiredBlueprintIds.every(id => cold.structures.some(item => item.blueprintId === id && item.status === 'active')));
    if (!upgrade || !prerequisitesMet) result = 'blocked';
    else {
      const fromLevel = cold.territoryLevel;
      cold = { ...cold, territoryLevel: upgrade.toLevel };
      discovered = true;
      events.push({ type: 'bot_territory_upgraded', occurredAtElapsedMs: at, payload: {
        botId: cold.botId, actionId: plan.actionId, fromLevel, territoryLevel: cold.territoryLevel,
        capacityPermille: botTerritoryCapacityPermille(cold.territoryLevel), housingBonus: botTerritoryHousingBonus(cold.territoryLevel),
        ruleVersion: BOT_TERRITORY_RULE_VERSION,
      } });
    }
  } else if (plan.action === 'construct') {
    const building = cold.structures.find(item => item.id === `${plan.actionId}:STRUCTURE`);
    if (!building) throw new Error(`BOT_CONSTRUCTION_RECORD_MISSING:${plan.actionId}`);
    const complete = { ...building, status: 'active' as const, workCompleted: building.workRequired, completedAtElapsedMs: at };
    cold.structures = cold.structures.map(item => item.id === building.id ? complete : item);
    hot.workProgress[offset] = building.workRequired;
    hot.buildingCount[offset] += 1;
    if (building.blueprintId === 'BP-BOT-FARM') hot.farmCount[offset] += 1;
    else if (building.blueprintId === 'BP-BOT-WOOD-MILL') hot.millCount[offset] += 1;
    else if (building.blueprintId === 'BP-BOT-QUARRY') hot.quarryCount[offset] += 1;
    else if (building.blueprintId === 'BP-BOT-BARRACKS') hot.barracksCount[offset] += 1;
    else if (building.blueprintId === 'BP-BOT-WALL') hot.wallCount[offset] += 1;
    events.push({ type: 'bot_structure_completed', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, structureId: building.id, blueprintId: building.blueprintId, position: complete.anchor, level: complete.level, layoutSeed: complete.layoutSeed } });
  } else if (plan.action === 'repair') {
    const damaged = cold.structures.find(item => item.id === plan.targetId && item.status === 'damaged');
    if (!damaged) result = 'blocked';
    else {
      cold.structures = cold.structures.map(item => item.id === damaged.id ? { ...item, status: 'active' as const, damagePermille: 0, repairWorkCompleted: item.repairWorkRequired } : item);
      changeActiveStructureCapacity(hot, offset, damaged.blueprintId, 1);
      events.push({ type: 'bot_structure_repaired', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, structureId: damaged.id, blueprintId: damaged.blueprintId } });
    }
  } else if (plan.action === 'equip') {
    const cohort = cold.cohorts.find(item => item.id === plan.targetId && item.livingCount > 0);
    if (!cohort || cohort.equipmentTemplateIds.includes('BOT-WEAPON-IRON-1.0')) result = 'blocked';
    else {
      cold.cohorts = cold.cohorts.map(item => item.id === cohort.id
        ? { ...item, equipmentTemplateIds: [...item.equipmentTemplateIds, 'BOT-WEAPON-IRON-1.0'].sort(compareId) } : item);
      events.push({ type: 'bot_cohort_equipped', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, cohortId: cohort.id, templateId: 'BOT-WEAPON-IRON-1.0', memberCount: cohort.livingCount, ruleVersion: BOT_EQUIPMENT_RULE_VERSION } });
    }
  } else if (plan.action === 'recover') {
    const injured = cold.cohorts.filter(cohort => cohort.livingCount > 0 && cohort.healthPerMember < cohort.maxHealthPerMember);
    if (injured.length === 0) result = 'blocked';
    else {
      const medicineIndex = cold.eventInventory.findIndex(item => item.itemTemplateId === 'BASIC_MEDICINE' && item.quantity > 0);
      const medicine = medicineIndex >= 0 ? cold.eventInventory[medicineIndex]! : null;
      const healing = medicine ? 80 : 30;
      cold.cohorts = cold.cohorts.map(cohort => cohort.livingCount > 0 && cohort.healthPerMember < cohort.maxHealthPerMember
        ? { ...cohort, healthPerMember: Math.min(cohort.maxHealthPerMember, cohort.healthPerMember + healing), order: 'defend' }
        : cohort);
      if (medicine) cold.eventInventory = cold.eventInventory.map((item, index) => index !== medicineIndex ? item
        : { ...item, quantity: item.quantity - 1, consumedQuantity: (item.consumedQuantity ?? 0) + 1 });
      const living = cold.cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
      hot.armyHealthPermille[offset] = living === 0 ? 0 : Math.round(cold.cohorts.reduce((sum, cohort) => sum
        + cohort.livingCount * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0) * 1_000 / living);
      recovered = injured.some(previous => cold.cohorts.some(cohort => cohort.id === previous.id && cohort.healthPerMember > previous.healthPerMember));
      if (!recovered) result = 'blocked';
      else events.push({ type: 'bot_cohort_recovered', occurredAtElapsedMs: at, payload: {
        botId: cold.botId, actionId: plan.actionId, healedCohortCount: injured.length,
        medicineUsed: medicine?.instanceId ?? null, healingPerMember: healing, ruleVersion: BOT_RECOVERY_RULE_VERSION,
      } });
    }
  } else if (plan.action === 'recruit') {
    if (hot.population[offset]! >= Math.max(24, 20 + hot.barracksCount[offset]! * 10 + hot.buildingCount[offset]! * 2 + botTerritoryHousingBonus(cold.territoryLevel))) {
      result = 'blocked';
    } else {
      const memberOrdinal = cold.nextMemberOrdinal;
      cold.cohorts = [...cold.cohorts, {
        id: `${cold.botId}-COHORT-${String(cold.cohorts.length + 1).padStart(4, '0')}`,
        templateId: 'BOT-TROOP-SETTLER-GUARD-1.0', firstMemberOrdinal: memberOrdinal, livingCount: 1, recruitedCount: 1, lostCount: 0,
        level: 1, xp: 0, healthPerMember: 100, maxHealthPerMember: 100, equipmentTemplateIds: [], order: 'defend', location: cold.position,
      }];
      cold.nextMemberOrdinal += 1;
      hot.population[offset] += 1;
      hot.armySize[offset] += 1;
      events.push({ type: 'bot_unit_recruited', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, memberOrdinal, templateId: 'BOT-TROOP-SETTLER-GUARD-1.0' } });
    }
  } else if (plan.action === 'prepare_water') {
    const capacity = Math.max(0, BOT_WATER_CAPACITY_ML - cold.potableWaterMl);
    const prepared = Math.min(BOT_WATER_PREPARATION_YIELD_ML, cold.localIceRemainingMl, capacity);
    if (prepared <= 0) result = cold.localIceRemainingMl <= 0 ? 'depleted' : 'blocked';
    else {
      cold.potableWaterMl += prepared;
      cold.localIceRemainingMl -= prepared;
      cold.dehydrationExposureMs = 0;
      cold.lordDehydrationExposureMs = 0;
      discovered = true;
      events.push({ type: 'bot_water_prepared', occurredAtElapsedMs: at, payload: {
        botId: cold.botId, actionId: plan.actionId, waterPreparedMl: prepared,
        waterRemainingMl: cold.potableWaterMl, iceRemainingMl: cold.localIceRemainingMl,
        firewoodBurned: BOT_WATER_PREPARATION_FIREWOOD_UNITS, ruleVersion: BOT_SURVIVAL_RULE_VERSION,
      } });
    }
  } else if (plan.action === 'open_chest') {
    const opened = openBotChest(state, world, cold, hot, offset, plan.targetId ?? '', at);
    cold = opened.cold;
    result = opened.result;
    discovered = result === 'completed';
    events.push(...opened.events);
  } else if (plan.action === 'learn_blueprint') {
    const item = cold.blueprintItems.find(candidate => candidate.instanceId === plan.targetId && candidate.status === 'owned');
    if (!item || cold.blueprintIds.includes(item.blueprintId)) result = 'blocked';
    else {
      const rule = BOT_BLUEPRINT_BY_ID.get(item.blueprintId);
      const prerequisitesMet = Boolean(rule?.prerequisites.every(id => cold.blueprintIds.includes(id)
        && cold.structures.some(structure => structure.blueprintId === id && structure.status === 'active')));
      if (!rule || !prerequisitesMet) result = 'blocked';
      else {
        cold.blueprintItems = cold.blueprintItems.map(candidate => candidate.instanceId !== item.instanceId ? candidate : {
          ...candidate, status: 'learned', resolvedAtElapsedMs: at,
        });
        cold.blueprintIds = [...new Set([...cold.blueprintIds, item.blueprintId])].sort(compareId);
        discovered = true;
        events.push({ type: 'bot_blueprint_learned', occurredAtElapsedMs: at, payload: {
          botId: cold.botId, actionId: plan.actionId, itemInstanceId: item.instanceId,
          sourceId: item.sourceId, blueprintId: item.blueprintId, ruleVersion: BOT_BLUEPRINT_RULES_VERSION,
        } });
      }
    }
  } else if (plan.action === 'search') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.discovered && item.remainingActions > 0);
    if (!source) result = 'depleted';
    else if (!cold.armyMovement || cold.armyMovement.unitKind !== 'scout' || cold.armyMovement.status !== 'surveying') result = 'blocked';
    else if (source.kind === 'field_cache') {
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: 0 } : item);
      const acquired = acquireBotChest(state, world, cold, source, plan.actionId, population.saveSeed, at);
      cold = acquired.cold;
      result = acquired.result;
      discovered = result === 'discovered';
      if (acquired.event) events.push(acquired.event);
    }
    else {
      const draw = chooseBlueprint(cold, plan, population.saveSeed);
      drawIndex = draw.drawIndex;
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: item.remainingActions - 1 } : item);
      if (draw.id === null) result = 'depleted';
      else if (draw.duplicate) result = 'duplicate';
      else {
        const item = { instanceId: `${plan.actionId}:BLUEPRINT`, blueprintId: draw.id, sourceId: source.id,
          acquiredAtElapsedMs: at, status: 'owned' as const, resolvedAtElapsedMs: null, transactionId: null,
          ruleVersion: BOT_BLUEPRINT_RULES_VERSION };
        cold.blueprintItems = [...cold.blueprintItems, item];
        discovered = true;
        result = 'discovered';
        events.push({ type: 'bot_blueprint_acquired', occurredAtElapsedMs: at, payload: {
          botId: cold.botId, actionId: plan.actionId, sourceId: source.id, itemInstanceId: item.instanceId,
          blueprintId: draw.id, ruleVersion: BOT_BLUEPRINT_RULES_VERSION, drawIndex,
        } });
      }
    }
  } else if (plan.action === 'scout') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.contactTargetId && item.remainingActions > 0);
    if (!source?.contactTargetId) result = 'depleted';
    else if (cold.knownTargets.some(target => target.id === source.contactTargetId)) {
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: 0, discovered: true } : item);
      result = 'duplicate';
    } else {
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: 0, discovered: true } : item);
      const known = { id: source.contactTargetId, kind: source.contactTargetId === 'LI_LAN' ? 'player' as const : 'bot' as const, position: source.position, observedAtElapsedMs: at };
      cold.knownTargets = [...cold.knownTargets, known].sort((a, b) => compareId(a.id, b.id));
      cold.knownTargetIds = [...new Set([...cold.knownTargetIds, source.contactTargetId])].sort(compareId);
      discovered = true;
      result = 'discovered';
      events.push({ type: 'bot_contact_discovered', occurredAtElapsedMs: at, payload: { botId: cold.botId, targetId: known.id, targetKind: known.kind, observedAtElapsedMs: at, position: known.position } });
    }
  } else if (plan.action === 'hunt') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.kind === 'wildlife_track' && item.remainingActions > 0);
    if (!source) result = 'depleted';
    else if (!cold.armyMovement || cold.armyMovement.unitKind !== 'scout' || cold.armyMovement.status !== 'surveying') result = 'blocked';
    else if (hot.armySize[offset]! === 0) result = 'defeated';
    else {
      const stockId = source.sharedStockId;
      const consumed = stockId ? consumeSharedWildlifeStock(updatedPopulation, stockId) : { stock: null, population: updatedPopulation };
      updatedPopulation = consumed.population;
      const stock = consumed.stock;
      if (!stock) {
        cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: 0 } : item);
        result = 'depleted';
        events.push({ type: 'bot_hunt_settled', occurredAtElapsedMs: at, payload: {
          botId: cold.botId, actionId: plan.actionId, sourceId: source.id, sharedStockId: stockId ?? null,
          result, remainingActions: 0, ruleVersion: BOT_HUNT_RULE_VERSION,
        } });
      } else {
      const danger = stock.dangerPermille;
      const packSize = 1 + Math.floor(danger / 500);
      const battle = resolveBotBattle(population.saveSeed, `${plan.actionId}:${BOT_HUNT_RULE_VERSION}`,
        { power: Math.max(1, botCohortPower(cold, grade, (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!)), memberCount: hot.armySize[offset]!, defensePermille: 0 },
        { power: Math.max(1, packSize * (35 + Math.floor(danger / 8))), memberCount: packSize, defensePermille: Math.floor(danger / 2) });
      // A successful hunt returns the militia intact; only a failed, dangerous chase
      // can injure one hunter, rather than applying a full settlement battle's attrition.
      const losses = battle.winner === 'attacker'
        ? { cold, applied: 0 }
        : applyBotCasualties(cold, hot, offset, Math.min(1, battle.attackerLosses), woundHealthForLoss(battle.attackerLossPermille), undefined, false, 'wildlife');
      cold = losses.cold;
      casualties = losses.applied;
      drawIndex = battle.drawIndex;
      enemyCasualties = battle.winner === 'attacker' ? battle.defenderLosses : 0;
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: stock.remainingActions } : item);
      result = battle.winner === 'attacker' ? 'completed' : hot.armySize[offset]! === 0 ? 'defeated' : 'retreated';
      discovered = result === 'completed';
      let foodYield = 0;
      if (result === 'completed') {
        const cargoFree = Math.max(0, 60 - Object.values(cold.carriedCargo).reduce((sum, value) => sum + value, 0));
        foodYield = Math.min(cargoFree, randomIntFromFields([population.saveSeed, cold.botId, plan.actionId, BOT_HUNT_RULE_VERSION, 'food-yield'], 8, 16).value);
        cold = addCarriedLoot(cold, 'food', foodYield);
      }
      events.push({ type: 'bot_hunt_settled', occurredAtElapsedMs: at, payload: {
        botId: cold.botId, actionId: plan.actionId, sourceId: source.id, sharedStockId: stock.id,
        result, preyDefeated: enemyCasualties, casualties, foodYield, remainingActions: stock.remainingActions,
        ruleVersion: BOT_HUNT_RULE_VERSION, sharedRuleVersion: BOT_SHARED_WILDLIFE_RULE_VERSION, drawIndex,
      } });
      }
    }
  } else if (plan.action === 'deliver') {
    let cargo = { ...cold.carriedCargo };
    const delivered: Record<BotCargoKey, number> = { food: 0, wood: 0, stone: 0, ore: 0, firewood: 0 };
    for (const key of ['food', 'wood', 'stone', 'ore', 'firewood'] as const) {
      const balanceKey = `${key}Micro` as const;
      const capacity = Math.max(0, botResourceCapacityUnits(key, cold.territoryLevel) * BOT_MICRO - hot[balanceKey][offset]!);
      const quantity = Math.min(cargo[key], Math.floor(capacity / BOT_MICRO));
      if (quantity <= 0) continue;
      hot[balanceKey][offset] += quantity * BOT_MICRO;
      cargo = { ...cargo, [key]: cargo[key] - quantity };
      delivered[key] = quantity;
    }
    cold.carriedCargo = cargo;
    events.push({ type: 'bot_cargo_delivered', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, delivered } });
  } else if (plan.action === 'raid') {
    const knownTarget = cold.knownTargets.find(target => target.id === plan.targetId);
    if (!knownTarget) result = 'blocked';
    else if (knownTarget.kind === 'player') {
      const raid = raidPlayerTerritory(cold, hot, offset, plan, state, at);
      cold = raid.cold;
      result = raid.result;
      casualties = raid.casualties;
      enemyCasualties = raid.enemyCasualties;
      drawIndex = raid.drawIndex;
      events.push(...raid.events);
    } else {
      const raid = raidBotSettlement(population, chunk, hot, coldRows, offset, cold, knownTarget.id, plan, at);
      cold = raid.cold;
      updatedPopulation = raid.population;
      localChangedOffsets = raid.localChangedOffsets;
      const targetOrdinal = botOrdinalFromId(knownTarget.id);
      if (targetOrdinal !== null) {
        const targetChunkIndex = Math.floor((targetOrdinal - 1) / population.chunkSize);
        if (targetChunkIndex !== chunk.index && !externallyChangedChunkIndices.includes(targetChunkIndex)) externallyChangedChunkIndices.push(targetChunkIndex);
      }
      result = raid.result;
      casualties = raid.casualties;
      enemyCasualties = raid.enemyCasualties;
      drawIndex = raid.drawIndex;
      events.push(...raid.events);
    }
  }

  if (plan.action === 'raid' && result === 'depleted' && cold.knownTargets.some(target => target.id === plan.targetId)) {
    cold.knownTargets = cold.knownTargets.filter(target => target.id !== plan.targetId);
    cold.knownTargetIds = cold.knownTargetIds.filter(id => id !== plan.targetId);
    cold.searchSources = cold.searchSources.map(source => source.contactTargetId === plan.targetId
      ? { ...source, remainingActions: 0, discovered: true } : source);
    events.push({ type: 'bot_target_confirmed_depleted', occurredAtElapsedMs: at, payload: { botId: cold.botId, targetId: plan.targetId, actionId: plan.actionId } });
  }

  if (plan.action === 'scout' || plan.action === 'search' || plan.action === 'hunt') cold.armyMovement = returnScoutParty(cold, at).armyMovement;

  if (hot.population[offset] === 0 && cold.lordFate.status === 'active') {
    cold = { ...cold, lordFate: { status: 'dispossessed', changedAtElapsedMs: at, cause: 'territory_loss', triggerId: plan.actionId }, armyMovement: null };
    hot.alive[offset] = 0;
    events.push({ type: 'bot_lord_dispossessed', occurredAtElapsedMs: at, payload: {
      botId: cold.botId, cause: 'territory_loss', triggerId: plan.actionId, ruleVersion: BOT_COMBAT_RULE_VERSION,
    } });
    const released = cancelBotMarketListings(updatedPopulation, cold, at, 'dispossessed');
    updatedPopulation = released.population;
    cold = released.cold;
    events.push(...released.events);
  }

  const shouldCharge = result === 'completed' || result === 'discovered' || result === 'duplicate'
    || (plan.action === 'raid' && ['depleted', 'retreated', 'defeated'].includes(result));
  for (const key of ['food', 'wood', 'stone', 'ore'] as const) {
    const balanceKey = `${key}Micro` as const;
    const reservedKey = `reserved${key[0]!.toUpperCase()}${key.slice(1)}Micro` as const;
    hot[reservedKey][offset] = Math.max(0, hot[reservedKey][offset]! - plan.reserved[key] * BOT_MICRO);
    if (shouldCharge) hot[balanceKey][offset] = Math.max(0, hot[balanceKey][offset]! - plan.reserved[key] * BOT_MICRO);
  }
  const after = hotResourceBalances(hot, offset);
  const delta = deltaWhole(before, after);
  const baseXp = actionExperience(plan.action, delta, discovered, enemyCasualties, recovered);
  const talentXpMultiplierPermille = botTalentXpMultiplierPermille(grade, (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!);
  const xp = Math.floor(baseXp * talentXpMultiplierPermille / 1_000);
  const levelResult = addBotXp(hot, offset, xp, at);
  if (levelResult.crossed.includes(10) && at <= OPENING_LEVEL_CLOSES_AT_MS) {
    const id = `${OPENING_LEVEL_BOARD_ID}:${cold.botId}:${plan.actionId}`;
    if (!updatedPopulation.eventReceipts.some(receipt => receipt.id === id)) {
      const publishAt = Math.max(OPENING_LEVEL_OPENS_AT_MS, at + OPENING_LEVEL_DISPLAY_DELAY_MS);
      updatedPopulation = {
        ...updatedPopulation,
        eventReceipts: [...updatedPopulation.eventReceipts, {
          id, eventId: 'EV01-OPENING-LEVEL', botId: cold.botId, actionReceiptId: plan.actionId,
          scoreRule: BOT_OPENING_SCORE_RULE_VERSION, scoreDelta: 1, occurredAtElapsedMs: at,
        }],
        pendingBoardPublicationAtElapsedMs: publishAt <= OPENING_LEVEL_CLOSES_AT_MS
          ? [...new Set([...updatedPopulation.pendingBoardPublicationAtElapsedMs, publishAt])].sort((a, b) => a - b)
          : updatedPopulation.pendingBoardPublicationAtElapsedMs,
      };
    }
  }
  // A raid that was blocked or invalidated must never leave a force at an
  // outbound/besieging location after its action plan has closed.
  if (plan.action === 'raid' && cold.armyMovement?.unitKind === 'army' && cold.armyMovement.status !== 'returning') {
    cold = retreatingArmy(cold, botArmyPosition(cold.armyMovement, at), at);
  }
  const receiptCold = addReceipt(cold, plan, at, result, delta, xp, casualties, drawIndex, baseXp, talentXpMultiplierPermille);
  const finishedStructures = receiptCold.structures.map(item => item.id === `${plan.actionId}:STRUCTURE` && result !== 'completed'
    ? { ...item, status: 'destroyed' as const, workCompleted: hot.workProgress[offset]! }
    : item);
  receiptCold.structures = finishedStructures;
  receiptCold.currentPlan = null;
  hot.actionCount[offset] += 1;
  hot.workKind[offset] = 0;
  hot.assignedWorkers[offset] = 0;
  hot.workProgress[offset] = 0;
  hot.workRequired[offset] = 0;
  if (hot.population[offset]! === 0) {
    hot.alive[offset] = 0;
    hot.nextWakeAtElapsedMs[offset] = Number.MAX_SAFE_INTEGER;
  }
  const completionPayload = {
    botId: cold.botId, actionId: plan.actionId, action: plan.action, targetId: plan.targetId, result,
    resourceDelta: delta, baseXpAwarded: baseXp, talentXpMultiplierPermille, xpAwarded: xp, levelBefore: levelResult.before, levelAfter: hot.levels[offset]!, completionAtElapsedMs: hot.completionAtElapsedMs[offset] || null,
    casualties, ruleVersion: botActionRuleVersion(plan.action), drawIndex,
  };
  events.push({ type: 'bot_action_committed', occurredAtElapsedMs: at, payload: completionPayload });
  for (const level of levelResult.crossed) events.push({ type: 'bot_level_reached', occurredAtElapsedMs: at, payload: { botId: cold.botId, level, xpAwarded: xp, actionId: plan.actionId, completionAtElapsedMs: level === 10 ? at : null } });
  return { cold: receiptCold, population: updatedPopulation, localChangedOffsets, externallyChangedChunkIndices, events, xpCrossed: levelResult.crossed };
}

function preemptPlan(coldInput: BotColdRecord, chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number, reason: string): { cold: BotColdRecord; event: BotSimulationEvent | null } {
  const plan = coldInput.currentPlan;
  if (!plan) return { cold: coldInput, event: null };
  const cold = addReceipt(coldInput, plan, at, 'blocked', { food: 0, wood: 0, stone: 0, ore: 0 }, 0);
  cold.currentPlan = null;
  for (const key of ['food', 'wood', 'stone', 'ore'] as const) {
    const field = `reserved${key[0]!.toUpperCase()}${key.slice(1)}Micro` as const;
    hot[field][offset] = Math.max(0, hot[field][offset]! - plan.reserved[key] * BOT_MICRO);
  }
  cold.structures = cold.structures.map(item => {
    if (plan.action === 'construct' && item.id === `${plan.actionId}:STRUCTURE` && item.status === 'under_construction') {
      return { ...item, status: 'destroyed' as const, workCompleted: hot.workProgress[offset]! };
    }
    if (plan.action === 'repair' && item.id === plan.targetId && item.status === 'damaged') {
      return { ...item, repairWorkCompleted: Math.min(item.repairWorkRequired, hot.workProgress[offset]!) };
    }
    return item;
  });
  hot.workKind[offset] = 0;
  hot.assignedWorkers[offset] = 0;
  hot.workProgress[offset] = 0;
  hot.workRequired[offset] = 0;
  return { cold, event: { type: 'bot_plan_interrupted', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, reason } } };
}

function redeemBotEventFood(coldInput: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number, events: BotSimulationEvent[]): BotColdRecord {
  if (hot.alive[offset] === 0 || coldInput.lordFate.status !== 'active') return coldInput;
  let freeUnits = Math.max(0, Math.floor((botResourceCapacityUnits('food', coldInput.territoryLevel) * BOT_MICRO - hot.foodMicro[offset]!) / BOT_MICRO));
  if (freeUnits === 0) return coldInput;
  let redeemed = 0;
  const inventory = coldInput.eventInventory.map(item => {
    const unitValue = BOT_EVENT_FOOD_ITEM_UNITS[item.itemTemplateId as keyof typeof BOT_EVENT_FOOD_ITEM_UNITS];
    if (!unitValue || item.awardedAtElapsedMs > at || freeUnits <= 0) return item;
    const count = Math.min(item.quantity, Math.floor(freeUnits / unitValue));
    if (count <= 0) return item;
    freeUnits -= count * unitValue;
    redeemed += count * unitValue;
    return { ...item, quantity: item.quantity - count, appliedQuantity: (item.appliedQuantity ?? 0) + count };
  });
  if (redeemed === 0) return coldInput;
  hot.foodMicro[offset] += redeemed * BOT_MICRO;
  events.push({ type: 'bot_event_food_redeemed', occurredAtElapsedMs: at, payload: {
    botId: coldInput.botId, foodUnits: redeemed, ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
  } });
  return { ...coldInput, eventInventory: inventory };
}

function nextFoodRewardAt(cold: BotColdRecord, after: number, through: number): number | null {
  const boundaries = cold.eventInventory.filter(item => BOT_EVENT_FOOD_ITEM_UNITS[item.itemTemplateId as keyof typeof BOT_EVENT_FOOD_ITEM_UNITS]
      && item.awardedAtElapsedMs > after && item.awardedAtElapsedMs < through)
    .map(item => item.awardedAtElapsedMs);
  return boundaries.length > 0 ? Math.min(...boundaries) : null;
}

function applyRegionalWeatherStorm(
  coldInput: BotColdRecord,
  chunk: BotNumericRows,
  hot: ReturnType<typeof hydrateBotHotArrays>,
  offset: number,
  at: number,
): { cold: BotColdRecord; events: BotSimulationEvent[] } {
  if (hot.alive[offset] === 0 || coldInput.lordFate.status !== 'active') return { cold: coldInput, events: [] };
  const demand = botWeatherFuelDemand(coldInput);
  const burnedMicro = Math.min(hot.firewoodMicro[offset]!, demand * BOT_MICRO);
  hot.firewoodMicro[offset] -= burnedMicro;
  const missingUnits = demand - burnedMicro / BOT_MICRO;
  const coldExposureMs = missingUnits > 0 ? Math.ceil(BOT_WEATHER_MAX_COLD_EXPOSURE_MS * missingUnits / demand) : 0;
  const weatherEventId = `${coldInput.regionId}:WEATHER:${at}`;
  let cold = coldInput;
  const events: BotSimulationEvent[] = [];
  if (coldExposureMs > 0) {
    const exposure = updateExposure(cold, hot, offset, at, 0, 0, coldExposureMs);
    cold = recordBotCasualties(exposure.cold, 'regionalBlizzard', exposure.coldDeaths);
    if (exposure.coldDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: {
      botId: cold.botId, count: exposure.coldDeaths, cause: 'regional_blizzard', remainingPopulation: hot.population[offset], weatherEventId,
    } });
    if (exposure.lordDied) {
      hot.alive[offset] = 0;
      const preempted = preemptPlan(cold, chunk as BotStateChunk, hot, offset, at, 'LORD_ELIMINATED');
      cold = { ...preempted.cold, armyMovement: null };
      if (preempted.event) events.push(preempted.event);
      events.push({ type: 'bot_lord_eliminated', occurredAtElapsedMs: cold.lordFate.changedAtElapsedMs!, payload: {
        botId: cold.botId, fate: 'dead', cause: cold.lordFate.cause, triggerId: weatherEventId,
        residentsRemaining: hot.population[offset], ruleVersion: BOT_WEATHER_RULE_VERSION,
      } });
    }
  }
  if (hot.population[offset] === 0) {
    hot.alive[offset] = 0;
    hot.nextWakeAtElapsedMs[offset] = Number.MAX_SAFE_INTEGER;
    if (cold.lordFate.status === 'active') cold = { ...cold, lordFate: {
      status: 'dispossessed', changedAtElapsedMs: at, cause: 'settlement_abandoned', triggerId: weatherEventId,
    } };
    const preempted = preemptPlan(cold, chunk as BotStateChunk, hot, offset, at, 'SETTLEMENT_DEFEATED');
    cold = { ...preempted.cold, armyMovement: null };
    if (preempted.event) events.push(preempted.event);
    events.push({ type: 'bot_settlement_defeated', occurredAtElapsedMs: at, payload: {
      botId: cold.botId, population: 0, armySize: hot.armySize[offset], cause: 'regional_blizzard', weatherEventId,
    } });
  }
  events.push({ type: 'bot_weather_hazard', occurredAtElapsedMs: at, payload: {
    botId: cold.botId, weatherEventId, fuelDemandUnits: demand, fuelBurnedUnits: burnedMicro / BOT_MICRO,
    coldExposureMs, civilianDeaths: events.filter(event => event.type === 'bot_population_lost').reduce((sum, event) => sum + Number(event.payload.count ?? 0), 0),
    shelterActive: demand < 8, ruleVersion: BOT_WEATHER_RULE_VERSION,
  } });
  return { cold, events };
}

export function integrateBot(coldInput: BotColdRecord, chunk: BotNumericRows, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number, grade: BotTalentGrade, kind: BotTalentKind, saveSeed = ''): { cold: BotColdRecord; events: BotSimulationEvent[] } {
  const from = hot.lastIntegratedAtElapsedMs[offset]!;
  const duration = at - from;
  if (duration < 0) throw new Error('BOT_TIME_MOVED_BACKWARDS');
  const events: BotSimulationEvent[] = [];
  let cold = redeemBotEventFood(coldInput, hot, offset, from, events);
  const weatherSeed = saveSeed || `BOT-WEATHER-SEED:${cold.botId || cold.regionId}`;
  const stormAt = nextBotWeatherStormAt(weatherSeed, cold, from, at);
  if (stormAt !== null && stormAt < at) {
    const beforeStorm = integrateBot(cold, chunk, hot, offset, stormAt, grade, kind, weatherSeed);
    const afterStorm = integrateBot(beforeStorm.cold, chunk, hot, offset, at, grade, kind, weatherSeed);
    return { cold: afterStorm.cold, events: [...events, ...beforeStorm.events, ...afterStorm.events] };
  }
  const survivalBoundary = nextBotSurvivalBoundary(cold, chunk, hot, offset, from);
  if (survivalBoundary !== null && survivalBoundary < at) {
    const beforeBoundary = integrateBot(cold, chunk, hot, offset, survivalBoundary, grade, kind, weatherSeed);
    const afterBoundary = integrateBot(beforeBoundary.cold, chunk, hot, offset, at, grade, kind, weatherSeed);
    return { cold: afterBoundary.cold, events: [...beforeBoundary.events, ...afterBoundary.events] };
  }
  const rewardBoundary = nextFoodRewardAt(cold, from, at);
  if (duration > 0 && rewardBoundary !== null) {
    // Lazy integration must stop where the supply becomes available, then resume
    // with that supply in stock so later exposure cannot be charged before it.
    const beforeReward = integrateBot(cold, chunk, hot, offset, rewardBoundary, grade, kind, weatherSeed);
    const afterReward = integrateBot(beforeReward.cold, chunk, hot, offset, at, grade, kind, weatherSeed);
    return { cold: afterReward.cold, events: [...events, ...beforeReward.events, ...afterReward.events] };
  }
  if (duration > 0) {
    const rates = productionRates(cold, chunk, offset);
    const foodBefore = hot.foodMicro[offset]!;
    const fuelBefore = hot.firewoodMicro[offset]!;
    const foodNodeBefore = hot.foodNodeMicro[offset]!;
    const woodlandBefore = hot.woodNodeMicro[offset]!;
    const foodCarry = (hot.foodNodeMicro[offset]! > 0 ? hot.foodNodeRemainder[offset]! : 0) - hot.foodConsumptionRemainder[offset]!;
    const fuelCarry = (hot.woodNodeMicro[offset]! > 0 ? hot.firewoodNodeRemainder[offset]! : 0) - hot.firewoodConsumptionRemainder[offset]!;
    integrateBotResourceBalances(cold, chunk as BotStateChunk, hot, offset, duration);
    integrateBotWork(cold, hot, offset, from, at, grade, kind);
    const foodProduction = foodNodeBefore > 0 ? rates.foodProduced : 0;
    const fuelProduction = woodlandBefore > 0 ? rates.firewoodProduced : 0;
    const starvationMs = hot.foodMicro[offset]! === 0
      ? exposureDuring(foodBefore, foodProduction, rates.foodConsumed, foodCarry, duration) : 0;
    const coldMs = hot.firewoodMicro[offset]! === 0
      ? exposureDuring(fuelBefore, fuelProduction, rates.firewoodConsumed, fuelCarry, duration) : 0;
    const water = consumeBotWater(cold, hot.population[offset]!, duration);
    const exposure = updateExposure(water.cold, hot, offset, from, starvationMs, water.dehydrationMs, coldMs);
    cold = recordBotCasualties(exposure.cold, 'starvation', exposure.starvationDeaths);
    cold = recordBotCasualties(cold, 'dehydration', exposure.dehydrationDeaths);
    cold = recordBotCasualties(cold, 'fuelExhaustion', exposure.coldDeaths);
    if (exposure.starvationDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: { botId: cold.botId, count: exposure.starvationDeaths, cause: 'starvation', remainingPopulation: hot.population[offset] } });
    if (exposure.dehydrationDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: { botId: cold.botId, count: exposure.dehydrationDeaths, cause: 'dehydration', remainingPopulation: hot.population[offset] } });
    if (exposure.coldDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: { botId: cold.botId, count: exposure.coldDeaths, cause: 'fuel_exhaustion', remainingPopulation: hot.population[offset] } });
    if (exposure.lordDied) {
      hot.alive[offset] = 0;
      const preempted = preemptPlan(cold, chunk, hot, offset, at, 'LORD_ELIMINATED');
      cold = { ...preempted.cold, armyMovement: null };
      if (preempted.event) events.push(preempted.event);
      events.push({ type: 'bot_lord_eliminated', occurredAtElapsedMs: cold.lordFate.changedAtElapsedMs!, payload: {
        botId: cold.botId, fate: 'dead', cause: cold.lordFate.cause, triggerId: cold.lordFate.triggerId,
        residentsRemaining: hot.population[offset], ruleVersion: BOT_SURVIVAL_RULE_VERSION,
      } });
    }
    if (hot.population[offset] === 0) {
      hot.alive[offset] = 0;
      if (cold.lordFate.status === 'active') cold = { ...cold, lordFate: {
        status: 'dispossessed', changedAtElapsedMs: at, cause: 'settlement_abandoned',
        triggerId: cold.currentPlan?.actionId ?? `BOT-POPULATION-EXHAUSTED:${cold.botId}:${at}`,
      } };
      const preempted = preemptPlan(cold, chunk, hot, offset, at, 'SETTLEMENT_DEFEATED');
      cold = { ...preempted.cold, armyMovement: null };
      if (preempted.event) events.push(preempted.event);
      events.push({ type: 'bot_settlement_defeated', occurredAtElapsedMs: at, payload: { botId: cold.botId, population: 0, armySize: hot.armySize[offset] } });
    }
    hot.lastIntegratedAtElapsedMs[offset] = at;
  }
  if (stormAt === at) {
    const storm = applyRegionalWeatherStorm(cold, chunk, hot, offset, at);
    cold = storm.cold;
    events.push(...storm.events);
  }
  cold = redeemBotEventFood(cold, hot, offset, at, events);
  return { cold, events };
}

function boundaryReason(cold: BotColdRecord, chunk: BotNumericRows, offset: number): string | null {
  const plan = cold.currentPlan;
  if (!plan) return null;
  if (plan.action === 'gather_food' && chunk.foodNodeMicro[offset]! <= 0 && cold.workforce.gatherFood > 0 && cold.workforce.farmers === 0) return 'FINITE_FOOD_NODE_DEPLETED';
  if (plan.action === 'gather_wood' && chunk.woodNodeMicro[offset]! <= 0) return 'FINITE_WOOD_NODE_DEPLETED';
  if (plan.action === 'gather_stone' && chunk.stoneNodeMicro[offset]! <= 0) return 'FINITE_STONE_NODE_DEPLETED';
  if (plan.action === 'gather_ore' && chunk.oreNodeMicro[offset]! <= 0) return 'FINITE_ORE_NODE_DEPLETED';
  if (plan.action === 'gather_food' && chunk.foodMicro[offset]! >= botResourceCapacityUnits('food', cold.territoryLevel) * BOT_MICRO) return 'FOOD_STORAGE_FULL';
  if (plan.action === 'gather_wood' && chunk.woodMicro[offset]! >= botResourceCapacityUnits('wood', cold.territoryLevel) * BOT_MICRO) return 'WOOD_STORAGE_FULL';
  if (plan.action === 'gather_stone' && chunk.stoneMicro[offset]! >= botResourceCapacityUnits('stone', cold.territoryLevel) * BOT_MICRO) return 'STONE_STORAGE_FULL';
  if (plan.action === 'gather_ore' && chunk.oreMicro[offset]! >= botResourceCapacityUnits('ore', cold.territoryLevel) * BOT_MICRO) return 'ORE_STORAGE_FULL';
  if (chunk.foodMicro[offset]! === 0 || chunk.firewoodMicro[offset]! === 0) return 'SURVIVAL_PRIORITY_CHANGED';
  return null;
}

function nextLattice(at: number, phase: number): number {
  const delta = (phase - at % 3_000 + 3_000) % 3_000;
  return at + (delta === 0 ? 3_000 : delta);
}

function runBotBoundary(state: GameState, population: BotPopulationState, chunk: BotStateChunk, at: number, world?: WorldDefinition): { chunk: BotStateChunk; population: BotPopulationState; events: BotSimulationEvent[]; expansions: number; externallyChangedChunkIndices: number[] } {
  const working = workingChunk(population, chunk);
  const hot = working.hot;
  const coldRows = working.coldRows;
  const events: BotSimulationEvent[] = [];
  let evolvingPopulation = population;
  const externallyChangedChunkIndices = new Set<number>();
  const locallyChangedOffsets = new Set<number>();
  let expansions = 0;
  let completedActions = 0;
  const dueOffsets = takeDueBotWakes(working, at).filter(offset => hot.alive[offset] !== 0);
  for (const offset of dueOffsets) {
    const grade = (['S', 'A', 'B', 'C', 'D'] as const)[chunk.talentGrades[offset]!]!;
    const kind = (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!;
    let cold = coldRows[offset]!;
    const integrated = integrateBot(cold, hot, hot, offset, at, grade, kind, evolvingPopulation.saveSeed);
    events.push(...integrated.events);
    cold = settleArmyMovement(integrated.cold, hot, offset, at, events);
    const market = advanceSellerMarketListings(evolvingPopulation, chunk, hot, coldRows, offset, cold, at);
    evolvingPopulation = market.population;
    cold = market.sellerCold;
    for (const changedOffset of market.localChangedOffsets) locallyChangedOffsets.add(changedOffset);
    for (const changedIndex of market.externallyChangedChunkIndices) externallyChangedChunkIndices.add(changedIndex);
    events.push(...market.events);
    const prior = cold.currentPlan;
    const preemptReason = boundaryReason(cold, hot, offset);
    if (preemptReason) {
      const interrupted = preemptPlan(cold, chunk, hot, offset, at, preemptReason);
      cold = returnScoutParty(interrupted.cold, at);
      if (interrupted.cold.armyMovement?.unitKind === 'army' && interrupted.cold.armyMovement.status !== 'returning') {
        cold = retreatingArmy(interrupted.cold, botArmyPosition(interrupted.cold.armyMovement, at), at);
      }
      if (interrupted.event) events.push(interrupted.event);
    }
    let completedPlan = false;
    if (prior && at >= prior.completesAtElapsedMs && cold.currentPlan) {
      const completed = completePlan(evolvingPopulation, chunk, hot, coldRows, offset, cold, grade, state, at, world);
      completedActions += 1;
      cold = completed.cold;
      evolvingPopulation = completed.population;
      for (const changedOffset of completed.localChangedOffsets) locallyChangedOffsets.add(changedOffset);
      for (const changedIndex of completed.externallyChangedChunkIndices) externallyChangedChunkIndices.add(changedIndex);
      events.push(...completed.events);
      completedPlan = true;
    }
    coldRows[offset] = cold;
    if (hot.alive[offset] !== 0 && cold.armyMovement?.status === 'returning') {
      hot.nextWakeAtElapsedMs[offset] = Math.max(at + 1, cold.armyMovement.arrivesAtElapsedMs);
    } else if (hot.alive[offset] !== 0 && !cold.currentPlan) {
      if (completedPlan) hot.nextWakeAtElapsedMs[offset] = nextSellerMarketWake(evolvingPopulation, cold, at, nextLattice(at, cold.decisionPhaseMs));
      else {
        const planned = startBotDecision(evolvingPopulation, hot, offset, cold, grade, kind, at);
        coldRows[offset] = planned.cold;
        events.push(...planned.events);
        expansions += planned.plannerExpansions;
      }
    } else if (hot.alive[offset] !== 0) {
      hot.nextWakeAtElapsedMs[offset] = nextSellerMarketWake(evolvingPopulation, cold, at, nextBotWake(cold, hot, offset, at));
    }
    if (hot.alive[offset] === 0) hot.nextWakeAtElapsedMs[offset] = Number.MAX_SAFE_INTEGER;
  }
  for (const offset of dueOffsets) {
    working.dirtyOffsets.add(offset);
    working.wakeDirtyOffsets.add(offset);
  }
  for (const offset of locallyChangedOffsets) {
    working.dirtyOffsets.add(offset);
    working.wakeDirtyOffsets.add(offset);
  }
  markBotPopulationChunkChanged(evolvingPopulation);
  const nextPopulation = {
    ...evolvingPopulation,
    completedActionCount: evolvingPopulation.completedActionCount + completedActions,
    benchmarkCounters: {
      plannerExpansions: evolvingPopulation.benchmarkCounters.plannerExpansions + expansions,
      integratedBotSegments: evolvingPopulation.benchmarkCounters.integratedBotSegments + dueOffsets.length,
      dirtyChunks: evolvingPopulation.benchmarkCounters.dirtyChunks + 1,
    },
  };
  return { chunk, population: nextPopulation, events, expansions, externallyChangedChunkIndices: [...externallyChangedChunkIndices] };
}

function updateChunkSchedule(heap: BotPopulationState['schedulerHeap'][number][], chunk: BotStateChunk, working: BotWorkingChunk): void {
  rescheduleChangedBotWakes(working);
  const next = working.wakeHeap[0];
  if (!next) throw new Error(`BOT_CHUNK_WITHOUT_WAKE:${chunk.index}`);
  const wake = { atElapsedMs: next.atElapsedMs, botOrdinal: chunk.firstOrdinal + next.offset };
  pushBotScheduler(heap, { atElapsedMs: wake.atElapsedMs, chunkIndex: chunk.index, botOrdinal: wake.botOrdinal });
}

export function nextBotBoundaryAt(population: BotPopulationState | null | undefined): number | null {
  if (!population) return null;
  const botWake = population.schedulerHeap[0]?.atElapsedMs ?? Number.MAX_SAFE_INTEGER;
  const boardWake = population.pendingBoardPublicationAtElapsedMs[0] ?? Number.MAX_SAFE_INTEGER;
  const next = Math.min(botWake, boardWake);
  return next === Number.MAX_SAFE_INTEGER ? null : next;
}

function buildOpeningBoardSnapshot(state: GameState, population: BotPopulationState, at: number): BotPopulationState {
  if (at < OPENING_LEVEL_OPENS_AT_MS) return population;
  const final = at >= OPENING_LEVEL_CLOSES_AT_MS;
  const observedThroughSimMs = final ? OPENING_LEVEL_CLOSES_AT_MS : Math.min(OPENING_LEVEL_CLOSES_AT_MS, at - OPENING_LEVEL_DISPLAY_DELAY_MS);
  const qualifiedBotIds = new Set(population.eventReceipts.filter(receipt => receipt.eventId === 'EV01-OPENING-LEVEL').map(receipt => receipt.botId));
  const botReceiptCounts = new Map<string, number>();
  for (const receipt of population.eventReceipts) botReceiptCounts.set(receipt.botId, (botReceiptCounts.get(receipt.botId) ?? 0) + 1);
  const records = population.chunks.flatMap(chunk => chunk.cold.flatMap((bot, offset) => {
    const completionAtElapsedMs = chunk.completionAtElapsedMs[offset]!;
    const qualified = completionAtElapsedMs > 0 && completionAtElapsedMs <= observedThroughSimMs && chunk.levels[offset]! >= 10
      && qualifiedBotIds.has(bot.botId)
      && (bot.lordFate.status === 'active' || (bot.lordFate.changedAtElapsedMs ?? Number.MAX_SAFE_INTEGER) > observedThroughSimMs);
    return qualified ? [{ playerId: bot.botId, realName: bot.name, level: chunk.levels[offset]!, progressToNextLevelPermille: 0, completionAtElapsedMs }] : [];
  }));
  const playerCompletionAt = (state.progression?.transactions ?? [])
    .filter(transaction => transaction.recipientId === state.player.id && transaction.thresholdsCrossed.includes(10))
    .map(transaction => transaction.occurredAtElapsedMs).sort((a, b) => a - b)[0];
  if (playerCompletionAt !== undefined && playerCompletionAt <= observedThroughSimMs) records.push({
    playerId: state.player.id, realName: state.player.name, level: state.player.level, progressToNextLevelPermille: 0, completionAtElapsedMs: playerCompletionAt,
  });
  const ranked = rankOpeningLevelCompletions(records, OPENING_LEVEL_CLOSES_AT_MS);
  const rows = ranked.map(row => ({
    botId: row.playerId, displayName: row.realName, rank: row.rank,
    score: row.level, tieValue: row.completionAtElapsedMs,
    receiptCount: row.playerId === state.player.id ? (state.progression?.transactions ?? []).filter(transaction => transaction.recipientId === row.playerId).length
      : botReceiptCounts.get(row.playerId) ?? 0,
  }));
  const revision = population.publicRevision + 1;
  const snapshotBase = { boardId: OPENING_LEVEL_BOARD_ID, revision, asOfSimMs: at, observedThroughSimMs, status: final ? 'settled' as const : 'open' as const, rows };
  const snapshot = { ...snapshotBase, snapshotSha256: canonicalStateHash(snapshotBase) };
  return {
    ...population,
    publicRevision: revision,
    lastPublicSnapshotAtElapsedMs: at,
    boardSnapshots: [...population.boardSnapshots.filter(item => item.boardId !== OPENING_LEVEL_BOARD_ID), snapshot],
  };
}

/** Advances only chunks due at this exact simulation boundary. Other immutable chunks are shared. */
export function settleBotBoundary(state: GameState, at: number, world?: WorldDefinition): readonly BotSimulationEvent[] {
  const inAdvance = isBotPopulationAdvanceInProgress(state.botPopulation);
  let population = state.botPopulation ? prepareBotPopulationMutation(state.botPopulation) : null;
  if (!population || nextBotBoundaryAt(population) !== at) return [];
  const events: BotSimulationEvent[] = [];
  let heap = population.schedulerHeap as BotPopulationState['schedulerHeap'][number][];
  while (heap[0]?.atElapsedMs === at) {
    const scheduled = popBotScheduler(heap);
    if (!scheduled) break;
    const chunk = population.chunks[scheduled.chunkIndex];
    if (!chunk) throw new Error('BOT_SCHEDULER_CHUNK_MISSING');
    const result = runBotBoundary(state, population, chunk, at, world);
    population = { ...result.population, schedulerHeap: heap };
    events.push(...result.events);
    if (result.externallyChangedChunkIndices.length > 0) {
      const changed = new Set(result.externallyChangedChunkIndices);
      heap = heapifyBotScheduler(heap.filter(entry => !changed.has(entry.chunkIndex)));
      for (const index of result.externallyChangedChunkIndices) {
        const changedChunk = population.chunks[index];
        if (!changedChunk) throw new Error('BOT_INTERACTION_CHUNK_MISSING');
        updateChunkSchedule(heap, changedChunk, workingChunk(population, changedChunk));
      }
    }
    updateChunkSchedule(heap, result.chunk, workingChunk(population, result.chunk));
    population = { ...population, schedulerHeap: heap };
  }
  const publishDue = population.pendingBoardPublicationAtElapsedMs.filter(boundary => boundary <= at);
  if (publishDue.length > 0) {
    population = flushBotPopulationChunks(population)!;
    population = {
      ...population,
      pendingBoardPublicationAtElapsedMs: population.pendingBoardPublicationAtElapsedMs.filter(boundary => boundary > at),
    };
    if (publishDue.some(boundary => boundary >= OPENING_LEVEL_OPENS_AT_MS)) population = buildOpeningBoardSnapshot(state, population, at);
  }
  // A bounded advance flushes all changed hot rows once when the slice returns.
  // Keep the working arrays alive across intervening decision boundaries so each
  // wake does not rehydrate and rehash the whole chunk. Direct boundary callers
  // still receive a fully serialized, checksummed population.
  state.botPopulation = inAdvance ? population : finishBotPopulationAdvance(flushBotPopulationChunks(population)!);
  return events;
}

export function integrateBotPopulationSegment(state: { botPopulation?: BotPopulationState | null }, from: number, to: number): void {
  // Bot rows advance at their next meaningful boundary. Between boundaries, their fixed-rate
  // integrals are represented by (lastIntegratedAtElapsedMs, remainders) and materialized lazily.
  if (to < from) throw new Error('BOT_TIME_MOVED_BACKWARDS');
}

export function projectedBotResources(chunk: BotStateChunk, offset: number, cold: BotColdRecord, targetAt: number): Record<BotResourceKey, number> {
  if (targetAt <= chunk.lastIntegratedAtElapsedMs[offset]!) return resourceBalances(chunk, offset);
  const hot = hydrateBotHotArrays(chunk);
  const dt = targetAt - hot.lastIntegratedAtElapsedMs[offset]!;
  integrateBotResourceBalances(cold, chunk, hot, offset, dt);
  return hotResourceBalances(hot, offset);
}

/** Project potable water through the same fixed-point consumption rule as simulation.
 * A currently scheduled preparation batch is credited only at its committed completion boundary.
 */
export function projectedBotWaterMl(cold: BotColdRecord, population: number, from: number, targetAt: number): number {
  if (targetAt <= from || cold.lordFate.status !== 'active' || population <= 0) return cold.potableWaterMl;
  let water = cold.potableWaterMl;
  let remainder = cold.waterConsumptionRemainder;
  let cursor = from;
  const completionAt = cold.currentPlan?.action === 'prepare_water'
    && cold.currentPlan.completesAtElapsedMs > from && cold.currentPlan.completesAtElapsedMs <= targetAt
    ? cold.currentPlan.completesAtElapsedMs : null;
  const consumeUntil = (end: number): void => {
    if (end <= cursor) return;
    const consumed = consumeBotWater({ ...cold, potableWaterMl: water, waterConsumptionRemainder: remainder }, population, end - cursor);
    water = consumed.cold.potableWaterMl;
    remainder = consumed.cold.waterConsumptionRemainder;
    cursor = end;
  };
  if (completionAt !== null) {
    consumeUntil(completionAt);
    const prepared = Math.min(BOT_WATER_PREPARATION_YIELD_ML, cold.localIceRemainingMl, Math.max(0, BOT_WATER_CAPACITY_ML - water));
    water += prepared;
  }
  consumeUntil(targetAt);
  return water;
}

export function botCurrentWorkKind(chunk: BotStateChunk, offset: number): BotWorkKind { return BOT_WORK_FROM_CODE[chunk.workKind[offset]!] ?? 'idle'; }
