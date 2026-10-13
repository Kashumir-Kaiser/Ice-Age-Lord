import type { BotActionReceipt, BotCargoKey, BotColdRecord, BotPlanState, BotResourceKey, BotSharedWildlifeStock, BotStateChunk, BotStructureInstance, BotTalentGrade, BotTalentKind, BotWorkKind, CoordinateMm, GameState } from '../../../contracts/src/index.ts';
import { canonicalStateHash, randomIntFromFields } from '../hash.ts';
import { playerLevelThreshold } from '../stage07.ts';
import { OPENING_LEVEL_BOARD_ID, OPENING_LEVEL_CLOSES_AT_MS, OPENING_LEVEL_DISPLAY_DELAY_MS, OPENING_LEVEL_OPENS_AT_MS, rankOpeningLevelCompletions } from '../openingRanking.ts';
import { resolveSquadCasualty } from '../combat.ts';
import { BOT_COMBAT_RULE_VERSION, botCohortPower, botSettlementDefensePermille, resolveBotBattle } from './combat.ts';
import { BOT_BLUEPRINT_BY_ID, BOT_BLUEPRINT_LOOT_RULES, BOT_BLUEPRINT_RULES_VERSION } from './blueprints.ts';
import { chooseBotDecision, spendableBotResources, BOT_WORK_CODE, BOT_WORK_FROM_CODE } from './planner.ts';
import { BOT_ACTIVITY_XP_RULE_VERSION, BOT_EQUIPMENT_RULE_VERSION, BOT_EVENT_REWARD_RULE_VERSION, BOT_HUNT_RULE_VERSION, BOT_MICRO, BOT_RECOVERY_RULE_VERSION, BOT_REPAIR_RULE_VERSION, BOT_SHARED_WILDLIFE_RULE_VERSION, BOT_SIMULATION_RULE_VERSION, appendBotActionReceipt, botConstructionPermille, botTalentXpMultiplierPermille, botRowHash, finishBotPopulationAdvance, heapifyBotScheduler, hydrateBotHotArrays, isBotPopulationAdvanceInProgress, markBotPopulationChunkChanged, markBotSharedWildlifeChanged, popBotScheduler, prepareBotPopulationMutation, pushBotScheduler, serializeBotHotArrays, botChunkHash } from './state.ts';
import { botArmyPosition } from './movement.ts';
import type { BotPopulationState } from '../../../contracts/src/index.ts';
import type { MutableBotHotArrays } from './state.ts';

export const BOT_ECONOMY_RULE_VERSION = 'BOT-FINITE-ECONOMY-1.0';
export { BOT_ACTIVITY_XP_RULE_VERSION };
export const BOT_GATHER_RATES_UNITS_PER_HOUR = { food: 4.5, wood: 3.6, firewood: 2.4, stone: 2.8, ore: 1.4 } as const;
export const BOT_BUILDING_OUTPUT_UNITS_PER_WORKER_HOUR = { farmFood: 6, millWood: 4.2, quarryStone: 3.2, workshopOre: 1.2 } as const;
export const BOT_UPKEEP_UNITS_PER_PERSON_HOUR = { food: 0.18, firewood: 0.075 } as const;
export const BOT_STARVATION_LOSS_INTERVAL_MS = 12 * 60 * 60_000;
export const BOT_COLD_LOSS_INTERVAL_MS = 24 * 60 * 60_000;
export const BOT_RESOURCE_CAP_UNITS = { food: 1_800, wood: 1_200, stone: 900, ore: 400, firewood: 450 } as const;
export const BOT_EVENT_FOOD_ITEM_UNITS = { MEAT: 1, BREAD: 1 } as const;
export const BOT_INITIAL_TERRITORY_OVERLAY = 'BOT-SETTLEMENT-ECONOMY-1.0';
const BOT_ARMY_TRAVEL_MM_PER_HOUR = 3_500_000;
export const BOT_OPENING_SCORE_RULE_VERSION = 'BOT-OPENING-LEVEL-10-RECEIPT-1.0';

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

function applyBalance(chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, key: 'food' | 'wood' | 'stone' | 'ore', produced: number, consumed: number, harvested: number, durationMs: number): void {
  const [balanceKey, remainderKey, nodeKey] = resourceFields[key];
  if (produced !== harvested) throw new Error(`BOT_UNBOUNDED_PRODUCTION_FORBIDDEN:${key}`);
  const nodeRemainderKey = `${key}NodeRemainder` as 'foodNodeRemainder' | 'woodNodeRemainder' | 'stoneNodeRemainder' | 'oreNodeRemainder';
  const harvest = fixedProduct(harvested, durationMs, hot[nodeRemainderKey][offset]!);
  const nodeUse = Math.min(hot[nodeKey][offset]!, harvest.amount);
  const acceptedProduction = nodeUse;
  const consumeRemainder = key === 'food' ? hot.foodConsumptionRemainder[offset]! : 0;
  const consumption = fixedProduct(consumed, durationMs, consumeRemainder);
  const cap = BOT_RESOURCE_CAP_UNITS[key] * BOT_MICRO;
  const old = hot[balanceKey][offset]!;
  const next = Math.max(0, Math.min(cap, old + acceptedProduction - consumption.amount));
  hot[balanceKey][offset] = next;
  hot[nodeKey][offset] -= nodeUse;
  hot[nodeRemainderKey][offset] = hot[nodeKey][offset] === 0 ? 0 : harvest.remainder;
  hot[remainderKey][offset] = 0;
  if (key === 'food') hot.foodConsumptionRemainder[offset] = consumption.remainder;
}

function applyFirewood(chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, rates: Rates, durationMs: number): void {
  const harvest = fixedProduct(rates.firewoodHarvested, durationMs, hot.firewoodNodeRemainder[offset]!);
  const nodeUse = Math.min(hot.woodNodeMicro[offset]!, harvest.amount);
  const produced = Math.min(rates.firewoodProduced === rates.firewoodHarvested ? nodeUse : rates.firewoodProduced, rates.firewoodProduced);
  const consumption = fixedProduct(rates.firewoodConsumed, durationMs, hot.firewoodConsumptionRemainder[offset]!);
  const cap = BOT_RESOURCE_CAP_UNITS.firewood * BOT_MICRO;
  const old = hot.firewoodMicro[offset]!;
  const next = Math.max(0, Math.min(cap, old + produced - consumption.amount));
  hot.woodNodeMicro[offset] -= nodeUse;
  hot.firewoodNodeRemainder[offset] = hot.woodNodeMicro[offset] === 0 ? 0 : harvest.remainder;
  hot.firewoodMicro[offset] = next;
  hot.firewoodRemainder[offset] = 0;
  hot.firewoodConsumptionRemainder[offset] = consumption.remainder;
}

function integrateBotWork(cold: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, from: number, to: number, grade: BotTalentGrade, kind: BotTalentKind): void {
  const plan = cold.currentPlan;
  if (!plan || !['construct', 'repair', 'equip'].includes(plan.action) || to <= from) return;
  const multiplier = botConstructionPermille(grade, kind);
  const numerator = BigInt(Math.max(0, plan.workersAssigned)) * BigInt(multiplier) * BigInt(to - from);
  const work = Number(numerator / 1_000n);
  hot.workProgress[offset] = Math.min(hot.workRequired[offset]!, hot.workProgress[offset]! + work);
}

function exposureDuring(balance: number, produced: number, consumed: number, remainder: number, duration: number): number {
  if (balance <= 0) return produced > consumed ? 0 : duration;
  if (produced >= consumed) return 0;
  const numerator = BigInt(balance) * 1_000n + BigInt(remainder);
  const zeroAt = Number((numerator + BigInt(consumed - produced) - 1n) / BigInt(consumed - produced));
  return Math.max(0, Math.min(duration, duration - zeroAt));
}

function updateExposure(cold: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, starvationMs: number, coldMs: number): { cold: BotColdRecord; starvationDeaths: number; coldDeaths: number } {
  let starvationExposureMs = starvationMs > 0 ? cold.starvationExposureMs + starvationMs : 0;
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
  if (starvationApplied + coldApplied > 0) hot.deathCount[offset] += starvationApplied + coldApplied;
  if (population !== priorPopulation) {
    hot.population[offset] = population;
    hot.armySize[offset] = armySize;
    hot.workers[offset] = Math.min(hot.workers[offset]!, Math.max(0, population - armySize));
  }
  const exposureChanged = starvationExposureMs !== cold.starvationExposureMs || coldExposureMs !== cold.coldExposureMs;
  const coldChanged = exposureChanged || cohorts !== cold.cohorts;
  return {
    cold: coldChanged ? { ...cold, starvationExposureMs, coldExposureMs, cohorts } : cold,
    starvationDeaths,
    coldDeaths,
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
    storeFillMs(chunk.foodMicro[offset]!, BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO, rates.foodProduced, rates.foodConsumed, foodRemainder),
    storeFillMs(chunk.woodMicro[offset]!, BOT_RESOURCE_CAP_UNITS.wood * BOT_MICRO, rates.woodProduced, 0, chunk.woodRemainder[offset]!),
    storeFillMs(chunk.stoneMicro[offset]!, BOT_RESOURCE_CAP_UNITS.stone * BOT_MICRO, rates.stoneProduced, 0, chunk.stoneRemainder[offset]!),
    storeFillMs(chunk.oreMicro[offset]!, BOT_RESOURCE_CAP_UNITS.ore * BOT_MICRO, rates.oreProduced, 0, chunk.oreRemainder[offset]!),
    storeFillMs(chunk.firewoodMicro[offset]!, BOT_RESOURCE_CAP_UNITS.firewood * BOT_MICRO, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder),
  ].filter((value): value is number => value !== null).map(duration => now + duration);
  const effectiveFoodZero = chunk.foodMicro[offset]! > 0 ? earliestThresholdMs(chunk.foodMicro[offset]!, rates.foodProduced, rates.foodConsumed, foodRemainder) : null;
  const effectiveFuelZero = chunk.firewoodMicro[offset]! > 0 ? earliestThresholdMs(chunk.firewoodMicro[offset]!, rates.firewoodProduced, rates.firewoodConsumed, firewoodRemainder) : null;
  const starvationBoundary = chunk.foodMicro[offset]! <= 0 ? now + Math.max(1, BOT_STARVATION_LOSS_INTERVAL_MS - cold.starvationExposureMs) : null;
  const coldBoundary = chunk.firewoodMicro[offset]! <= 0 ? now + Math.max(1, BOT_COLD_LOSS_INTERVAL_MS - cold.coldExposureMs) : null;
  if (effectiveFoodZero !== null) thresholds.push(now + effectiveFoodZero);
  if (effectiveFuelZero !== null) thresholds.push(now + effectiveFuelZero);
  if (starvationBoundary !== null) thresholds.push(starvationBoundary);
  if (coldBoundary !== null) thresholds.push(coldBoundary);
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
    const space = Math.max(0, BOT_RESOURCE_CAP_UNITS[key] * BOT_MICRO - hot[balanceField][offset]!);
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
  if (action === 'construct') return 2_000;
  if (action === 'recruit') return 640;
  if (action === 'search') return discovered ? 1_400 : 200;
  if (action === 'scout') return discovered ? 1_000 : 200;
  if (action === 'raid') return Math.min(3_600, defeatedOpponents * 720);
  if (action === 'hunt') return discovered ? Math.min(1_000, 320 + defeatedOpponents * 180) : 100;
  if (action === 'repair') return 1_000;
  if (action === 'equip') return 800;
  if (action === 'recover') return recovered ? 500 : 0;
  return 0;
}

function botActionRuleVersion(action: BotWorkKind): string {
  return action === 'hunt' ? BOT_HUNT_RULE_VERSION
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
  return { id: selected.id, duplicate: cold.blueprintIds.includes(selected.id), drawIndex };
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
  hot.nextWakeAtElapsedMs[offset] = nextBotWake(nextCold, hot, offset, at);
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

function applyBotCasualties(coldInput: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, count: number, woundHealth = 0): { cold: BotColdRecord; applied: number } {
  let remaining = Math.min(Math.max(0, count), hot.armySize[offset]!);
  const applied = remaining;
  const cohorts = coldInput.cohorts.map(cohort => {
    const lost = Math.min(cohort.livingCount, remaining);
    remaining -= lost;
    const livingCount = cohort.livingCount - lost;
    return lost > 0 || (livingCount > 0 && woundHealth > 0)
      ? { ...cohort, livingCount, lostCount: cohort.lostCount + lost,
        healthPerMember: livingCount > 0 ? Math.max(1, cohort.healthPerMember - woundHealth) : cohort.healthPerMember }
      : cohort;
  });
  hot.armySize[offset] = Math.max(0, hot.armySize[offset]! - applied);
  hot.population[offset] = Math.max(hot.armySize[offset]!, hot.population[offset]! - applied);
  hot.workers[offset] = Math.min(hot.workers[offset]!, Math.max(0, hot.population[offset]! - hot.armySize[offset]!));
  hot.deathCount[offset] += applied;
  if (hot.population[offset] === 0) hot.alive[offset] = 0;
  const living = cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
  const averageHealth = living === 0 ? 0 : Math.round(cohorts.reduce((sum, cohort) => sum + cohort.livingCount * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0) * 1_000 / living);
  hot.armyHealthPermille[offset] = averageHealth;
  return { cold: { ...coldInput, cohorts }, applied };
}

function addCarriedLoot(cold: BotColdRecord, key: BotCargoKey, amount: number): BotColdRecord {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('BOT_RAID_LOOT_INVALID');
  return { ...cold, carriedCargo: { ...cold.carriedCargo, [key]: cold.carriedCargo[key] + amount } };
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
  if (attackerMembers < 1) return { cold: coldInput, result: 'defeated', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [] };
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
  let cold = applyBotCasualties(coldInput, hot, offset, attackerLosses, attackerWoundHealth).cold;
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
  const integrated = integrateBot(targetColdRows[targetOffset]!, targetHot, targetHot, targetOffset, at, targetGrade, targetKind);
  let targetCold = integrated.cold;
  targetColdRows[targetOffset] = targetCold;
  const attackerMembers = currentHot.armySize[attackerOffset]!;
  const armyAway = targetCold.armyMovement?.unitKind === 'army' ? targetCold.armyMovement.unitCount : 0;
  const defenderMembers = Math.max(0, targetHot.armySize[targetOffset]! - armyAway);
  if (attackerMembers < 1) return { population: populationInput, cold: attackerInput, result: 'defeated', casualties: 0, enemyCasualties: 0, drawIndex: 0, localChangedOffsets: [], events: [] };
  if (targetHot.alive[targetOffset] === 0) {
    const cold = retreatingArmy(attackerInput, movement.to, at);
    targetHot.nextWakeAtElapsedMs[targetOffset] = Math.min(targetHot.nextWakeAtElapsedMs[targetOffset]!, at + 1);
    const persisted = persistTargetChunk(populationInput, targetChunk, targetHot, targetColdRows, targetOffset, sameChunk);
    return { ...persisted, cold, result: 'depleted', casualties: 0, enemyCasualties: 0, drawIndex: 0, events: [{ type: 'bot_raid_depleted', occurredAtElapsedMs: at, payload: { attackerId: attackerInput.botId, targetId } }] };
  }
  const attackerGrade = (['S', 'A', 'B', 'C', 'D'] as const)[currentHot.talentGrades[attackerOffset]!]!;
  const attackerKind = (['combat', 'production'] as const)[currentHot.talentKinds[attackerOffset]!]!;
  const battle = defenderMembers > 0 ? resolveBotBattle(populationInput.saveSeed, plan.actionId,
    { power: Math.max(1, botCohortPower(attackerInput, attackerGrade, attackerKind)), memberCount: attackerMembers, defensePermille: 0 },
    { power: Math.max(1, botCohortPower(targetCold, targetGrade, targetKind)), memberCount: defenderMembers, defensePermille: botSettlementDefensePermille(targetCold) })
    : { winner: 'attacker' as const, attackerLosses: 0, defenderLosses: 0, attackerLossPermille: 0, defenderLossPermille: 0, attackerPower: 0, defenderPower: 0, drawIndex: 0 };
  const attackerResult = applyBotCasualties(attackerInput, currentHot, attackerOffset, battle.attackerLosses, woundHealthForLoss(battle.attackerLossPermille));
  const targetResult = applyBotCasualties(targetCold, targetHot, targetOffset, battle.defenderLosses, woundHealthForLoss(battle.defenderLossPermille));
  targetCold = targetResult.cold;
  const structureDamage = battle.winner === 'attacker' ? raidDamagedStructure(targetCold, targetHot, targetOffset, at) : { cold: targetCold, event: null };
  targetCold = structureDamage.cold;
  targetColdRows[targetOffset] = targetCold;
  if (targetHot.nextWakeAtElapsedMs[targetOffset]! > at) targetHot.nextWakeAtElapsedMs[targetOffset] = at + 1;
  if (targetHot.population[targetOffset] === 0) {
    targetHot.alive[targetOffset] = 0;
    const preempted = preemptPlan(targetCold, targetChunk, targetHot, targetOffset, at, 'SETTLEMENT_DEFEATED');
    targetCold = preempted.cold;
    if (preempted.event) integrated.events.push(preempted.event);
    targetColdRows[targetOffset] = targetCold;
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
  const persisted = persistTargetChunk(populationInput, targetChunk, targetHot, targetColdRows, targetOffset, sameChunk);
  const result: BotActionReceipt['result'] = survivors === 0 ? 'defeated' : battle.winner === 'attacker' ? 'completed' : 'retreated';
  const events: BotSimulationEvent[] = [
    ...integrated.events.filter(event => event.type === 'bot_population_lost' || event.type === 'bot_settlement_defeated'),
    { type: 'bot_battle_settled', occurredAtElapsedMs: at, payload: { attackerId: cold.botId, targetId, winner: battle.winner, attackerLosses: attackerResult.applied, defenderLosses: targetResult.applied, loot, ruleVersion: BOT_COMBAT_RULE_VERSION, drawIndex: battle.drawIndex } },
    ...(structureDamage.event ? [structureDamage.event] : []),
  ];
  return { ...persisted, cold, result, casualties: attackerResult.applied, enemyCasualties: targetResult.applied, drawIndex: battle.drawIndex, events };
}

function completePlan(population: BotPopulationState, chunk: BotStateChunk, hot: ReturnType<typeof hydrateBotHotArrays>, coldRows: BotColdRecord[], offset: number, coldInput: BotColdRecord, grade: BotTalentGrade, state: GameState, at: number): { cold: BotColdRecord; population: BotPopulationState; localChangedOffsets: number[]; externallyChangedChunkIndices: number[]; events: BotSimulationEvent[]; xpCrossed: number[] } {
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
  else if (plan.action === 'construct') {
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
        : item.quantity === 1 ? null : { ...item, quantity: item.quantity - 1 }).filter((item): item is NonNullable<typeof item> => item !== null);
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
    if (hot.population[offset]! >= Math.max(24, 20 + hot.barracksCount[offset]! * 10 + hot.buildingCount[offset]! * 2)) {
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
  } else if (plan.action === 'search') {
    const source = cold.searchSources.find(item => item.id === plan.targetId && item.discovered && item.remainingActions > 0);
    if (!source) result = 'depleted';
    else if (!cold.armyMovement || cold.armyMovement.unitKind !== 'scout' || cold.armyMovement.status !== 'surveying') result = 'blocked';
    else {
      const draw = chooseBlueprint(cold, plan, population.saveSeed);
      drawIndex = draw.drawIndex;
      cold.searchSources = cold.searchSources.map(item => item.id === source.id ? { ...item, remainingActions: item.remainingActions - 1 } : item);
      if (draw.id === null) result = 'depleted';
      else if (draw.duplicate) result = 'duplicate';
      else {
        cold.blueprintIds = [...cold.blueprintIds, draw.id].sort(compareId);
        discovered = true;
        result = 'discovered';
        events.push({ type: 'bot_blueprint_learned', occurredAtElapsedMs: at, payload: { botId: cold.botId, actionId: plan.actionId, sourceId: source.id, blueprintId: draw.id, ruleVersion: BOT_BLUEPRINT_RULES_VERSION, drawIndex } });
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
        : applyBotCasualties(cold, hot, offset, Math.min(1, battle.attackerLosses), woundHealthForLoss(battle.attackerLossPermille));
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
      const capacity = Math.max(0, BOT_RESOURCE_CAP_UNITS[key] * BOT_MICRO - hot[balanceKey][offset]!);
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
  if (hot.population[offset]! === 0) hot.alive[offset] = 0;
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
  let freeUnits = Math.max(0, Math.floor((BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO - hot.foodMicro[offset]!) / BOT_MICRO));
  if (freeUnits === 0) return coldInput;
  let redeemed = 0;
  const inventory = coldInput.eventInventory.map(item => {
    const unitValue = BOT_EVENT_FOOD_ITEM_UNITS[item.itemTemplateId as keyof typeof BOT_EVENT_FOOD_ITEM_UNITS];
    if (!unitValue || freeUnits <= 0) return item;
    const count = Math.min(item.quantity, Math.floor(freeUnits / unitValue));
    if (count <= 0) return item;
    freeUnits -= count * unitValue;
    redeemed += count * unitValue;
    return count === item.quantity ? null : { ...item, quantity: item.quantity - count };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  if (redeemed === 0) return coldInput;
  hot.foodMicro[offset] += redeemed * BOT_MICRO;
  events.push({ type: 'bot_event_food_redeemed', occurredAtElapsedMs: at, payload: {
    botId: coldInput.botId, foodUnits: redeemed, ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
  } });
  return { ...coldInput, eventInventory: inventory };
}

function integrateBot(coldInput: BotColdRecord, chunk: BotNumericRows, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number, at: number, grade: BotTalentGrade, kind: BotTalentKind): { cold: BotColdRecord; events: BotSimulationEvent[] } {
  const from = hot.lastIntegratedAtElapsedMs[offset]!;
  const duration = at - from;
  if (duration < 0) throw new Error('BOT_TIME_MOVED_BACKWARDS');
  let cold = coldInput;
  const events: BotSimulationEvent[] = [];
  if (duration > 0) {
    const rates = productionRates(cold, chunk, offset);
    const foodBefore = hot.foodMicro[offset]!;
    const fuelBefore = hot.firewoodMicro[offset]!;
    const foodCarry = hot.foodNodeRemainder[offset]! - hot.foodConsumptionRemainder[offset]!;
    const fuelCarry = hot.firewoodNodeRemainder[offset]! - hot.firewoodConsumptionRemainder[offset]!;
    applyBalance(chunk, hot, offset, 'food', rates.foodProduced, rates.foodConsumed, rates.foodHarvested, duration);
    // Firewood is debited first from the finite woodland node because it controls cold survival.
    applyFirewood(chunk, hot, offset, rates, duration);
    applyBalance(chunk, hot, offset, 'wood', rates.woodProduced, 0, rates.woodHarvested, duration);
    applyBalance(chunk, hot, offset, 'stone', rates.stoneProduced, 0, rates.stoneHarvested, duration);
    applyBalance(chunk, hot, offset, 'ore', rates.oreProduced, 0, rates.oreHarvested, duration);
    integrateBotWork(cold, hot, offset, from, at, grade, kind);
    const starvationMs = hot.foodMicro[offset]! === 0
      ? exposureDuring(foodBefore, rates.foodProduced, rates.foodConsumed, foodCarry, duration) : 0;
    const coldMs = hot.firewoodMicro[offset]! === 0
      ? exposureDuring(fuelBefore, rates.firewoodProduced, rates.firewoodConsumed, fuelCarry, duration) : 0;
    const exposure = updateExposure(cold, hot, offset, starvationMs, coldMs);
    cold = exposure.cold;
    if (exposure.starvationDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: { botId: cold.botId, count: exposure.starvationDeaths, cause: 'starvation', remainingPopulation: hot.population[offset] } });
    if (exposure.coldDeaths > 0) events.push({ type: 'bot_population_lost', occurredAtElapsedMs: at, payload: { botId: cold.botId, count: exposure.coldDeaths, cause: 'fuel_exhaustion', remainingPopulation: hot.population[offset] } });
    if (hot.population[offset] === 0) {
      hot.alive[offset] = 0;
      const preempted = preemptPlan(cold, chunk, hot, offset, at, 'SETTLEMENT_DEFEATED');
      cold = preempted.cold;
      if (preempted.event) events.push(preempted.event);
      events.push({ type: 'bot_settlement_defeated', occurredAtElapsedMs: at, payload: { botId: cold.botId, population: 0, armySize: hot.armySize[offset] } });
    }
    hot.lastIntegratedAtElapsedMs[offset] = at;
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
  if (plan.action === 'gather_food' && chunk.foodMicro[offset]! >= BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO) return 'FOOD_STORAGE_FULL';
  if (plan.action === 'gather_wood' && chunk.woodMicro[offset]! >= BOT_RESOURCE_CAP_UNITS.wood * BOT_MICRO) return 'WOOD_STORAGE_FULL';
  if (plan.action === 'gather_stone' && chunk.stoneMicro[offset]! >= BOT_RESOURCE_CAP_UNITS.stone * BOT_MICRO) return 'STONE_STORAGE_FULL';
  if (plan.action === 'gather_ore' && chunk.oreMicro[offset]! >= BOT_RESOURCE_CAP_UNITS.ore * BOT_MICRO) return 'ORE_STORAGE_FULL';
  if (chunk.foodMicro[offset]! === 0 || chunk.firewoodMicro[offset]! === 0) return 'SURVIVAL_PRIORITY_CHANGED';
  return null;
}

function nextLattice(at: number, phase: number): number {
  const delta = (phase - at % 3_000 + 3_000) % 3_000;
  return at + (delta === 0 ? 3_000 : delta);
}

function runBotBoundary(state: GameState, population: BotPopulationState, chunk: BotStateChunk, at: number): { chunk: BotStateChunk; population: BotPopulationState; events: BotSimulationEvent[]; expansions: number; externallyChangedChunkIndices: number[] } {
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
    const integrated = integrateBot(cold, hot, hot, offset, at, grade, kind);
    cold = settleArmyMovement(integrated.cold, hot, offset, at, events);
    events.push(...integrated.events);
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
      const completed = completePlan(evolvingPopulation, chunk, hot, coldRows, offset, cold, grade, state, at);
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
      if (completedPlan) hot.nextWakeAtElapsedMs[offset] = nextLattice(at, cold.decisionPhaseMs);
      else {
        const planned = startBotDecision(evolvingPopulation, hot, offset, cold, grade, kind, at);
        coldRows[offset] = planned.cold;
        events.push(...planned.events);
        expansions += planned.plannerExpansions;
      }
    } else if (hot.alive[offset] !== 0) {
      hot.nextWakeAtElapsedMs[offset] = nextBotWake(cold, hot, offset, at);
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
      && qualifiedBotIds.has(bot.botId);
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
export function settleBotBoundary(state: GameState, at: number): readonly BotSimulationEvent[] {
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
    const result = runBotBoundary(state, population, chunk, at);
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
  const rates = productionRates(cold, chunk, offset);
  const dt = targetAt - hot.lastIntegratedAtElapsedMs[offset]!;
  applyBalance(chunk, hot, offset, 'food', rates.foodProduced, rates.foodConsumed, rates.foodHarvested, dt);
  applyFirewood(chunk, hot, offset, rates, dt);
  applyBalance(chunk, hot, offset, 'wood', rates.woodProduced, 0, rates.woodHarvested, dt);
  applyBalance(chunk, hot, offset, 'stone', rates.stoneProduced, 0, rates.stoneHarvested, dt);
  applyBalance(chunk, hot, offset, 'ore', rates.oreProduced, 0, rates.oreHarvested, dt);
  return hotResourceBalances(hot, offset);
}

export function botCurrentWorkKind(chunk: BotStateChunk, offset: number): BotWorkKind { return BOT_WORK_FROM_CODE[chunk.workKind[offset]!] ?? 'idle'; }
