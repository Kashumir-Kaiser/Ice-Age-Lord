import type { BotActionReceipt, BotColdRecord, BotPopulationState, BotStateChunk, BotTalentGrade, BotTalentKind } from '../../../contracts/src/index.ts';
import { BOT_BLUEPRINT_BY_ID } from './blueprints.ts';
import { stableStringify } from '../../../content/src/compiler.ts';
import { canonicalStateHash, canonicalStateHashFromStableJson } from '../hash.ts';
import { BOT_TERRITORY_RULE_VERSION } from './territory.ts';
import { BOT_MARKET_RULE_VERSION as MARKET_RULE_VERSION } from './market.ts';
import { BOT_WEATHER_RULE_VERSION } from './weather.ts';
import { BOT_LORD_RULE_VERSION, createBotLord } from './lord.ts';
import { BOT_BLUEPRINT_RULES_VERSION } from './blueprints.ts';
import { CHEST_LOOT_RULE_VERSION, LEGACY_CHEST_LOOT_RULE_VERSION } from '../../../content/src/chestLoot.ts';

export const BOT_GENERATION_VERSION = 'BOT-P0-GENERATION-1.4';
export const BOT_SIMULATION_RULE_VERSION = 'BOT-AUTHORITATIVE-SIM-1.13';
export const BOT_PLANNER_RULE_VERSION = 'BOT-UTILITY-GOALS-1.7';
// Keep saved blueprint ownership and its action receipts on the same canonical rule version.
export const BOT_BLUEPRINT_RULE_VERSION = BOT_BLUEPRINT_RULES_VERSION;
export const BOT_TALENT_RULE_VERSION = 'BOT-TALENT-P0-1.1';
export const BOT_ACTIVITY_XP_RULE_VERSION = 'BOT-ACTION-XP-1.5';
export const BOT_TALENT_XP_RULE_VERSION = 'BOT-TALENT-XP-P0-1.0';
export const BOT_ACTION_RECEIPT_ARCHIVE_VERSION = 'BOT-ACTION-RECEIPT-ARCHIVE-1.0';
export const BOT_ACTION_RECEIPT_PAGE_SIZE = 64;
export const BOT_ACTION_RECEIPT_RECENT_LIMIT = 128;
export const BOT_HUNT_RULE_VERSION = 'BOT-FINITE-HUNT-1.1';
export const BOT_REPAIR_RULE_VERSION = 'BOT-STRUCTURE-REPAIR-1.0';
export const BOT_EQUIPMENT_RULE_VERSION = 'BOT-EQUIPMENT-OVERLAY-1.0';
export const BOT_RECOVERY_RULE_VERSION = 'BOT-COHORT-RECOVERY-1.0';
export const BOT_EVENT_REWARD_RULE_VERSION = 'BOT-OPENING-REWARD-ECONOMY-1.1';
export const BOT_SHARED_WILDLIFE_RULE_VERSION = 'BOT-REGIONAL-WILDLIFE-STOCK-1.0';
export const BOT_SURVIVAL_RULE_VERSION = 'BOT-FROZEN-WATER-LORD-SURVIVAL-1.1';
export { BOT_LORD_RULE_VERSION };
export const BOT_CHEST_RULE_VERSION = 'BOT-SHARED-FIELD-CHEST-1.0';
export const BOT_MARKET_RULE_VERSION = MARKET_RULE_VERSION;
export { BOT_WEATHER_RULE_VERSION };
export const BOT_CHUNK_SIZE = 256;
export const BOT_STRATEGIC_LATTICE_MS = 3_000;
export const BOT_MICRO = 1_000_000;
export const BOT_MAX_RESOURCE_MICRO = Number.MAX_SAFE_INTEGER;
export const BOT_WATER_CAPACITY_ML = 240_000;
export const BOT_LOCAL_ICE_STOCK_ML = 2_000_000;
export const BOT_WATER_ML_PER_PERSON_PER_DAY = 2_000;
export const BOT_WATER_PREPARATION_YIELD_ML = 50_000;
export const BOT_WATER_PREPARATION_FIREWOOD_UNITS = 5;
export const BOT_UPKEEP_UNITS_PER_PERSON_HOUR = { food: 0.18, firewood: 0.075 } as const;
export const BOT_LORD_STARVATION_FATAL_MS = 48 * 60 * 60_000;
export const BOT_LORD_DEHYDRATION_FATAL_MS = 72 * 60 * 60_000;
export const BOT_LORD_COLD_FATAL_MS = 96 * 60 * 60_000;

type BotActionReceiptTuple = readonly [
  string, string, BotActionReceipt['action'], string | null, number, BotActionReceipt['result'],
  number, number, number, number, number, number, number, number, string, number,
];

function receiptTuple(receipt: BotActionReceipt): BotActionReceiptTuple {
  return [receipt.actionId, receipt.botId, receipt.action, receipt.targetId, receipt.occurredAtElapsedMs, receipt.result,
    receipt.resourceDelta.food, receipt.resourceDelta.wood, receipt.resourceDelta.stone, receipt.resourceDelta.ore,
    receipt.baseXpAwarded, receipt.talentXpMultiplierPermille, receipt.xpAwarded, receipt.casualties, receipt.ruleVersion, receipt.drawIndex];
}

/** The archive is lossless: positional JSON pages retain every receipt field with no repeated object keys. */
export function decodeBotActionReceiptPage(page: string): readonly BotActionReceipt[] {
  let values: unknown;
  try { values = JSON.parse(page); }
  catch { throw new Error('BOT_ACTION_RECEIPT_ARCHIVE_CORRUPT'); }
  if (!Array.isArray(values) || values.length !== BOT_ACTION_RECEIPT_PAGE_SIZE) throw new Error('BOT_ACTION_RECEIPT_ARCHIVE_CORRUPT');
  return values.map(value => {
    if (!Array.isArray(value) || value.length !== 16) throw new Error('BOT_ACTION_RECEIPT_ARCHIVE_CORRUPT');
    const [actionId, botId, action, targetId, occurredAtElapsedMs, result, food, wood, stone, ore,
      baseXpAwarded, talentXpMultiplierPermille, xpAwarded, casualties, ruleVersion, drawIndex] = value;
    return {
      actionId: actionId as string, botId: botId as string, action: action as BotActionReceipt['action'], targetId: targetId as string | null,
      occurredAtElapsedMs: occurredAtElapsedMs as number, result: result as BotActionReceipt['result'],
      resourceDelta: { food: food as number, wood: wood as number, stone: stone as number, ore: ore as number },
      baseXpAwarded: baseXpAwarded as number, talentXpMultiplierPermille: talentXpMultiplierPermille as number,
      xpAwarded: xpAwarded as number, casualties: casualties as number, ruleVersion: ruleVersion as string, drawIndex: drawIndex as number,
    };
  });
}

export function appendBotActionReceipt(cold: BotColdRecord, receipt: BotActionReceipt): BotColdRecord {
  const copyCold = Object.isFrozen(cold);
  const actionReceipts = Object.isFrozen(cold.actionReceipts) ? [...cold.actionReceipts] : cold.actionReceipts as BotActionReceipt[];
  const archivedPages = Object.isFrozen(cold.actionReceiptArchive) ? [...cold.actionReceiptArchive] : cold.actionReceiptArchive as string[];
  const next = copyCold || actionReceipts !== cold.actionReceipts || archivedPages !== cold.actionReceiptArchive
    ? { ...cold, actionReceipts, actionReceiptArchive: archivedPages } as BotColdRecord
    : cold;
  (next.actionReceipts as BotActionReceipt[]).push(receipt);
  while (next.actionReceipts.length > BOT_ACTION_RECEIPT_RECENT_LIMIT) {
    const page = (next.actionReceipts as BotActionReceipt[]).splice(0, BOT_ACTION_RECEIPT_PAGE_SIZE);
    (next.actionReceiptArchive as string[]).push(JSON.stringify(page.map(receiptTuple)));
  }
  return next;
}

export function forEachBotActionReceipt(cold: BotColdRecord, visit: (receipt: BotActionReceipt) => void): void {
  for (const page of cold.actionReceiptArchive) for (const receipt of decodeBotActionReceiptPage(page)) visit(receipt);
  for (const receipt of cold.actionReceipts) visit(receipt);
}

export function findBotActionReceipt(cold: BotColdRecord, predicate: (receipt: BotActionReceipt) => boolean): BotActionReceipt | null {
  for (let index = cold.actionReceipts.length - 1; index >= 0; index -= 1) if (predicate(cold.actionReceipts[index]!)) return cold.actionReceipts[index]!;
  for (let pageIndex = cold.actionReceiptArchive.length - 1; pageIndex >= 0; pageIndex -= 1) {
    const page = decodeBotActionReceiptPage(cold.actionReceiptArchive[pageIndex]!);
    for (let index = page.length - 1; index >= 0; index -= 1) if (predicate(page[index]!)) return page[index]!;
  }
  return null;
}

export function botActionReceiptCount(cold: BotColdRecord): number {
  return cold.actionReceiptArchive.length * BOT_ACTION_RECEIPT_PAGE_SIZE + cold.actionReceipts.length;
}

function validBotActionReceipt(receipt: BotActionReceipt, botId: string, grade: BotTalentGrade, kind: BotTalentKind): boolean {
  const actions: readonly BotActionReceipt['action'][] = ['idle', 'gather_food', 'gather_wood', 'gather_stone', 'gather_ore', 'construct', 'recruit', 'search', 'scout', 'raid', 'recover', 'deliver', 'repair', 'equip', 'hunt', 'prepare_water', 'learn_blueprint', 'open_chest', 'list_blueprint', 'upgrade_territory'];
  const results: readonly BotActionReceipt['result'][] = ['completed', 'depleted', 'blocked', 'retreated', 'defeated', 'discovered', 'duplicate'];
  const expectedRuleVersion = receipt.action === 'prepare_water' ? BOT_SURVIVAL_RULE_VERSION
    : receipt.action === 'open_chest' ? BOT_CHEST_RULE_VERSION
    : receipt.action === 'list_blueprint' ? BOT_MARKET_RULE_VERSION
    : receipt.action === 'upgrade_territory' ? BOT_TERRITORY_RULE_VERSION
    : receipt.action === 'learn_blueprint' ? BOT_BLUEPRINT_RULE_VERSION
    : receipt.action === 'hunt' ? BOT_HUNT_RULE_VERSION
    : receipt.action === 'repair' ? BOT_REPAIR_RULE_VERSION
      : receipt.action === 'equip' ? BOT_EQUIPMENT_RULE_VERSION
        : receipt.action === 'recover' ? BOT_RECOVERY_RULE_VERSION : BOT_ACTIVITY_XP_RULE_VERSION;
  return typeof receipt.actionId === 'string' && receipt.actionId.length > 0 && receipt.botId === botId
    && actions.includes(receipt.action) && (receipt.targetId === null || typeof receipt.targetId === 'string')
    && Number.isSafeInteger(receipt.occurredAtElapsedMs) && receipt.occurredAtElapsedMs >= 0
    && results.includes(receipt.result)
    && Boolean(receipt.resourceDelta) && (['food', 'wood', 'stone', 'ore'] as const).every(key => Number.isSafeInteger(receipt.resourceDelta[key]))
    && Number.isSafeInteger(receipt.baseXpAwarded) && receipt.baseXpAwarded >= 0
    && (receipt.talentXpMultiplierPermille === botTalentXpMultiplierPermille(grade, kind)
      || receipt.baseXpAwarded === 0 && receipt.xpAwarded === 0 && receipt.talentXpMultiplierPermille === 1_000)
    && Number.isSafeInteger(receipt.xpAwarded) && receipt.xpAwarded === Math.floor(receipt.baseXpAwarded * receipt.talentXpMultiplierPermille / 1_000)
    && Number.isSafeInteger(receipt.casualties) && receipt.casualties >= 0 && receipt.ruleVersion === expectedRuleVersion
    && Number.isSafeInteger(receipt.drawIndex) && receipt.drawIndex >= 0;
}

function ordinalForBotId(botId: string): number | null {
  const named = /^RC-(\d{3})$/.exec(botId);
  if (named) {
    const slot = Number(named[1]);
    return slot >= 2 && slot <= 10 ? slot - 1 : null;
  }
  const generated = /^BOT-P0-(\d{4,})$/.exec(botId);
  const ordinal = generated ? Number(generated[1]) : NaN;
  return Number.isSafeInteger(ordinal) && ordinal >= 10 ? ordinal : null;
}

export const BOT_GRADE_CODE: Readonly<Record<BotTalentGrade, number>> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
export const BOT_GRADE_FROM_CODE: readonly BotTalentGrade[] = ['S', 'A', 'B', 'C', 'D'];
export const BOT_KIND_CODE: Readonly<Record<BotTalentKind, number>> = { combat: 0, production: 1 };
export const BOT_KIND_FROM_CODE: readonly BotTalentKind[] = ['combat', 'production'];

const GRADE_MULTIPLIERS_PERMILLE: Readonly<Record<BotTalentGrade, { positive: number; opposing: number }>> = {
  S: { positive: 1_600, opposing: 800 },
  A: { positive: 1_400, opposing: 840 },
  B: { positive: 1_250, opposing: 880 },
  C: { positive: 1_150, opposing: 920 },
  D: { positive: 1_080, opposing: 960 },
};

/** XP per committed activity; S combat specialists progress about 3.1x as fast as S producers. */
const TALENT_XP_MULTIPLIERS_PERMILLE: Readonly<Record<BotTalentGrade, Readonly<Record<BotTalentKind, number>>>> = {
  S: { combat: 2_000, production: 650 },
  A: { combat: 1_600, production: 750 },
  B: { combat: 1_350, production: 850 },
  C: { combat: 1_150, production: 900 },
  D: { combat: 1_000, production: 950 },
};

export function botTalentXpMultiplierPermille(grade: BotTalentGrade, kind: BotTalentKind): number {
  return TALENT_XP_MULTIPLIERS_PERMILLE[grade][kind];
}

export function botTalentMultipliers(grade: BotTalentGrade): { positivePermille: number; opposingPermille: number } {
  const row = GRADE_MULTIPLIERS_PERMILLE[grade];
  return { positivePermille: row.positive, opposingPermille: row.opposing };
}

export function botCombatPermille(grade: BotTalentGrade, kind: BotTalentKind): number {
  const values = GRADE_MULTIPLIERS_PERMILLE[grade];
  return kind === 'combat' ? values.positive : values.opposing;
}

export function botConstructionPermille(grade: BotTalentGrade, kind: BotTalentKind): number {
  const values = GRADE_MULTIPLIERS_PERMILLE[grade];
  return kind === 'production' ? values.positive : values.opposing;
}

export function botChunkHash(chunk: Omit<BotStateChunk, 'chunkSha256'> | BotStateChunk): string {
  const { index, firstOrdinal, count, rowSha256 } = chunk as BotStateChunk;
  return canonicalStateHash({ index, firstOrdinal, count, rowSha256 });
}

export function botRowHash(chunk: BotStateChunk, offset: number): string {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= chunk.count) throw new Error('BOT_ROW_OFFSET_INVALID');
  const cold = chunk.cold[offset];
  if (!cold) throw new Error(`BOT_COLD_RECORD_MISSING:${chunk.firstOrdinal + offset}`);
  freezeBotColdRecord(cold);
  let encodedCold = botColdStableJson.get(cold);
  if (encodedCold === undefined) {
    encodedCold = stableStringify(cold);
    // Large immutable receipt archives already have a compact representation.
    // Avoid retaining a second expanded JSON copy for every archived row.
    if (encodedCold.length <= BOT_ROW_HASH_CACHE_MAX_CHARS) botColdStableJson.set(cold, encodedCold);
  }
  // Match stableStringify's sorted keys without building and sorting a 50-field row object.
  const hotFields = BOT_ROW_FIELD_ORDER;
  let encodedRow = '{';
  for (let index = 0; index < hotFields.length; index += 1) {
    if (index > 0) encodedRow += ',';
    const field = hotFields[index]!;
    const encodedValue = JSON.stringify((chunk[field] as readonly number[])[offset]);
    if (encodedValue === undefined) throw new Error(`BOT_ROW_VALUE_INVALID:${field}`);
    encodedRow += `${BOT_ROW_FIELD_PREFIXES[index]!}${encodedValue}`;
  }
  encodedRow += '}';
  return canonicalStateHashFromStableJson(`{"cold":${encodedCold},"row":${encodedRow}}`);
}

const frozenBotColdObjects = new WeakSet<object>();
const botColdStableJson = new WeakMap<object, string>();
const BOT_ROW_HASH_CACHE_MAX_CHARS = 32_768;

function deepFreezeBotColdValue(value: unknown): void {
  if (value === null || typeof value !== 'object' || frozenBotColdObjects.has(value)) return;
  for (const nested of Object.values(value)) deepFreezeBotColdValue(nested);
  Object.freeze(value);
  frozenBotColdObjects.add(value);
}

/** Cold records are immutable snapshots so their canonical bytes can be reused safely. */
export function freezeBotColdRecord(cold: BotColdRecord): void {
  deepFreezeBotColdValue(cold);
}

export function botPopulationRoot(chunks: readonly BotStateChunk[]): string {
  return canonicalStateHash(chunks.map(chunk => ({ index: chunk.index, count: chunk.count, chunkSha256: chunk.chunkSha256 })));
}

export function botSharedWildlifeRoot(stocks: BotPopulationState['sharedWildlifeStocks']): string {
  return canonicalStateHash(stocks);
}

type MutablePopulationBatch = { dirtyChunks: boolean; dirtyWildlife: boolean };
const mutableChunkBatches = new WeakMap<BotStateChunk[], MutablePopulationBatch>();
const mutableSchedulerHeaps = new WeakSet<BotPopulationState['schedulerHeap']>();

/** Copy indexed collections once at the start of an advance; chunk rows remain shared until replaced. */
export function beginBotPopulationAdvance(population: BotPopulationState | null | undefined): BotPopulationState | null {
  if (!population) return null;
  // API catch-up can yield between bounded work slices while keeping its pending state
  // private. Reuse that batch's copy-on-write collections until the catch-up is committed.
  if (mutableChunkBatches.has(population.chunks as BotStateChunk[])) return population;
  const chunks = population.chunks.slice() as BotStateChunk[];
  const schedulerHeap = population.schedulerHeap.slice();
  const sharedWildlifeStocks = population.sharedWildlifeStocks.slice();
  mutableChunkBatches.set(chunks, { dirtyChunks: false, dirtyWildlife: false });
  mutableSchedulerHeaps.add(schedulerHeap);
  return { ...population, chunks, schedulerHeap, sharedWildlifeStocks };
}

/** Ensure direct boundary callers also receive copy-on-write behavior. */
export function prepareBotPopulationMutation(population: BotPopulationState): BotPopulationState {
  let next = population;
  const chunks = population.chunks as BotStateChunk[];
  if (!mutableChunkBatches.has(chunks)) {
    const copied = chunks.slice();
    const sharedWildlifeStocks = population.sharedWildlifeStocks.slice();
    mutableChunkBatches.set(copied, { dirtyChunks: false, dirtyWildlife: false });
    next = { ...next, chunks: copied, sharedWildlifeStocks };
  }
  if (!mutableSchedulerHeaps.has(next.schedulerHeap)) {
    const copied = next.schedulerHeap.slice();
    mutableSchedulerHeaps.add(copied);
    next = { ...next, schedulerHeap: copied };
  }
  return next;
}

export function isBotPopulationAdvanceInProgress(population: BotPopulationState | null | undefined): boolean {
  return Boolean(population && mutableChunkBatches.has(population.chunks as BotStateChunk[]));
}

export function markBotPopulationChunkChanged(population: BotPopulationState): void {
  const batch = mutableChunkBatches.get(population.chunks as BotStateChunk[]);
  if (!batch) throw new Error('BOT_POPULATION_MUTATION_NOT_PREPARED');
  batch.dirtyChunks = true;
}

export function markBotSharedWildlifeChanged(population: BotPopulationState): void {
  const batch = mutableChunkBatches.get(population.chunks as BotStateChunk[]);
  if (!batch) throw new Error('BOT_POPULATION_MUTATION_NOT_PREPARED');
  batch.dirtyWildlife = true;
}

/** Commit the population root once per external advance instead of hashing every chunk at every bot wake. */
export function finishBotPopulationAdvance(population: BotPopulationState | null | undefined): BotPopulationState | null {
  if (!population) return null;
  const chunks = population.chunks as BotStateChunk[];
  const batch = mutableChunkBatches.get(chunks);
  if (!batch) return population;
  mutableChunkBatches.delete(chunks);
  mutableSchedulerHeaps.delete(population.schedulerHeap);
  if (!batch.dirtyChunks && !batch.dirtyWildlife) return population;
  return {
    ...population,
    ...(batch.dirtyChunks ? { chunkRootSha256: botPopulationRoot(chunks) } : {}),
    ...(batch.dirtyWildlife ? { sharedWildlifeRootSha256: botSharedWildlifeRoot(population.sharedWildlifeStocks) } : {}),
  };
}

export type MutableBotHotArrays = {
  ids: Uint32Array;
  talentGrades: Uint8Array;
  talentKinds: Uint8Array;
  regionIndices: Uint16Array;
  alive: Uint8Array;
  lastIntegratedAtElapsedMs: Float64Array;
  nextWakeAtElapsedMs: Float64Array;
  levels: Uint16Array;
  completionAtElapsedMs: Float64Array;
  xp: Float64Array;
  foodMicro: Float64Array;
  woodMicro: Float64Array;
  stoneMicro: Float64Array;
  oreMicro: Float64Array;
  reservedFoodMicro: Float64Array;
  reservedWoodMicro: Float64Array;
  reservedStoneMicro: Float64Array;
  reservedOreMicro: Float64Array;
  foodRemainder: Float64Array;
  woodRemainder: Float64Array;
  stoneRemainder: Float64Array;
  oreRemainder: Float64Array;
  population: Uint16Array;
  workers: Uint16Array;
  assignedWorkers: Uint16Array;
  workKind: Uint8Array;
  workProgress: Float64Array;
  workRequired: Float64Array;
  foodNodeMicro: Float64Array;
  foodNodeRemainder: Uint16Array;
  woodNodeMicro: Float64Array;
  woodNodeRemainder: Uint16Array;
  stoneNodeMicro: Float64Array;
  stoneNodeRemainder: Uint16Array;
  oreNodeMicro: Float64Array;
  oreNodeRemainder: Uint16Array;
  armySize: Uint16Array;
  armyHealthPermille: Uint16Array;
  buildingCount: Uint16Array;
  farmCount: Uint16Array;
  millCount: Uint16Array;
  quarryCount: Uint16Array;
  barracksCount: Uint16Array;
  wallCount: Uint16Array;
  firewoodMicro: Float64Array;
  firewoodRemainder: Float64Array;
  foodConsumptionRemainder: Float64Array;
  firewoodConsumptionRemainder: Float64Array;
  firewoodNodeRemainder: Uint16Array;
  actionCount: Uint32Array;
  deathCount: Uint32Array;
  knownBotCount: Uint16Array;
};

const HOT_ARRAY_TYPES: Readonly<Record<keyof Omit<BotStateChunk, 'index' | 'firstOrdinal' | 'count' | 'cold' | 'rowSha256' | 'chunkSha256'>, 'f64' | 'u32' | 'u16' | 'u8'>> = {
  ids: 'u32', talentGrades: 'u8', talentKinds: 'u8', regionIndices: 'u16', alive: 'u8',
  lastIntegratedAtElapsedMs: 'f64', nextWakeAtElapsedMs: 'f64', levels: 'u16', completionAtElapsedMs: 'f64', xp: 'f64',
  foodMicro: 'f64', woodMicro: 'f64', stoneMicro: 'f64', oreMicro: 'f64',
  reservedFoodMicro: 'f64', reservedWoodMicro: 'f64', reservedStoneMicro: 'f64', reservedOreMicro: 'f64',
  foodRemainder: 'f64', woodRemainder: 'f64', stoneRemainder: 'f64', oreRemainder: 'f64',
  population: 'u16', workers: 'u16', assignedWorkers: 'u16', workKind: 'u8', workProgress: 'f64', workRequired: 'f64',
  foodNodeMicro: 'f64', foodNodeRemainder: 'u16', woodNodeMicro: 'f64', woodNodeRemainder: 'u16', stoneNodeMicro: 'f64', stoneNodeRemainder: 'u16', oreNodeMicro: 'f64', oreNodeRemainder: 'u16', armySize: 'u16',
  armyHealthPermille: 'u16', buildingCount: 'u16', farmCount: 'u16', millCount: 'u16', quarryCount: 'u16',
  barracksCount: 'u16', wallCount: 'u16', firewoodMicro: 'f64', firewoodRemainder: 'f64', foodConsumptionRemainder: 'f64', firewoodConsumptionRemainder: 'f64', firewoodNodeRemainder: 'u16', actionCount: 'u32',
  deathCount: 'u32', knownBotCount: 'u16',
};

const BOT_ROW_FIELD_ORDER = (Object.keys(HOT_ARRAY_TYPES) as (keyof typeof HOT_ARRAY_TYPES)[]).sort();
const BOT_ROW_FIELD_PREFIXES = BOT_ROW_FIELD_ORDER.map(field => `${JSON.stringify(field)}:`);

export function hydrateBotHotArrays(chunk: BotStateChunk): MutableBotHotArrays {
  if (chunk.chunkSha256 !== botChunkHash(chunk)) throw new Error(`BOT_CHUNK_HASH_MISMATCH:${chunk.index}`);
  const result: Record<string, unknown> = {};
  for (const [field, type] of Object.entries(HOT_ARRAY_TYPES)) {
    const values = chunk[field as keyof typeof HOT_ARRAY_TYPES] as readonly number[];
    if (values.length !== chunk.count) throw new Error(`BOT_CHUNK_LENGTH_MISMATCH:${chunk.index}:${field}`);
    const Type = type === 'f64' ? Float64Array : type === 'u32' ? Uint32Array : type === 'u16' ? Uint16Array : Uint8Array;
    result[field] = Type.from(values);
  }
  return result as MutableBotHotArrays;
}

export function serializeBotHotArrays(chunk: BotStateChunk, hot: MutableBotHotArrays): BotStateChunk {
  const arrays: Record<string, readonly number[]> = {};
  for (const field of Object.keys(HOT_ARRAY_TYPES) as (keyof MutableBotHotArrays)[]) arrays[field] = Array.from(hot[field]);
  const next = { ...chunk, ...arrays, chunkSha256: '' } as BotStateChunk;
  return { ...next, chunkSha256: botChunkHash(next) };
}

function hasZeroUnitMovement(population: BotPopulationState): boolean {
  return population.chunks.some(chunk => chunk.cold.some(cold => cold.armyMovement?.unitCount === 0));
}

export function botPopulationNeedsMigration(population: BotPopulationState | null | undefined): boolean {
  if (!population) return false;
  return population.generationVersion !== BOT_GENERATION_VERSION
    || !Array.isArray(population.activeLordOrdinals) || population.activeLordOrdinals.length !== population.livingLordCount
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.5' && population.plannerRuleVersion === 'BOT-UTILITY-GOAP-1.2'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.6' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.3'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.7' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.4'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.8' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.5'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.9' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.6'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.10' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.7'
    || population.survivalRuleVersion !== BOT_SURVIVAL_RULE_VERSION || hasZeroUnitMovement(population)
    || population.marketRuleVersion !== BOT_MARKET_RULE_VERSION || population.territoryRuleVersion !== BOT_TERRITORY_RULE_VERSION
    || population.weatherRuleVersion !== BOT_WEATHER_RULE_VERSION || population.lordRuleVersion !== BOT_LORD_RULE_VERSION
    || !Array.isArray(population.remainsChests) || !Number.isSafeInteger(population.livingLordCount)
    || population.eventRewardRuleVersion !== BOT_EVENT_REWARD_RULE_VERSION
    || !Array.isArray(population.rewardReceipts)
    || population.rewardReceipts.some(receipt => receipt.items.some(item => !('status' in item) || !('blocker' in item)))
    || !Array.isArray(population.boardSnapshots) || population.boardSnapshots.some(snapshot => !snapshot.rankById)
    || !Array.isArray(population.marketListings) || !Array.isArray(population.marketTransactions)
    || population.chunks.some(chunk => chunk.cold.some(cold => !cold.casualtiesByCause || !Array.isArray(cold.blueprintItems)
      || !Array.isArray(cold.ownedChests) || !Array.isArray(cold.inventoryItems) || !Number.isSafeInteger(cold.territoryLevel)
      || !Array.isArray(cold.eventInventory) || cold.eventInventory.some(item => !Number.isSafeInteger(item.appliedQuantity) || !Number.isSafeInteger(item.consumedQuantity)
        || item.ruleVersion !== BOT_EVENT_REWARD_RULE_VERSION)));
}

/** Upgrades known bot rules prospectively, adds no historical supplies or exposure, and repairs zero-unit routes. */
export function migrateBotPopulation(population: BotPopulationState): BotPopulationState {
  const generationMigration = population.generationVersion !== BOT_GENERATION_VERSION;
  const activeLordIndexMigration = !Array.isArray(population.activeLordOrdinals)
    || population.activeLordOrdinals.length !== population.livingLordCount;
  const boardIndexMigration = !Array.isArray(population.boardSnapshots) || population.boardSnapshots.some(snapshot => !snapshot.rankById);
  const legacyRules = population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.5' && population.plannerRuleVersion === 'BOT-UTILITY-GOAP-1.2'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.6' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.3'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.7' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.4'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.8' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.5'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.9' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.6'
    || population.rulesVersion === 'BOT-AUTHORITATIVE-SIM-1.10' && population.plannerRuleVersion === 'BOT-UTILITY-GOALS-1.7';
  const survivalMetadataMigration = population.survivalRuleVersion !== BOT_SURVIVAL_RULE_VERSION || population.weatherRuleVersion !== BOT_WEATHER_RULE_VERSION;
  const rewardMetadataMigration = population.eventRewardRuleVersion !== BOT_EVENT_REWARD_RULE_VERSION
    || !Array.isArray(population.rewardReceipts)
    || population.rewardReceipts.some(receipt => receipt.items.some(item => !('status' in item) || !('blocker' in item)));
  const marketMigration = population.marketRuleVersion !== BOT_MARKET_RULE_VERSION || population.territoryRuleVersion !== BOT_TERRITORY_RULE_VERSION
    || !Array.isArray(population.marketListings) || !Array.isArray(population.marketTransactions);
  const movementRepair = hasZeroUnitMovement(population);
  const casualtyMigration = population.chunks.some(chunk => chunk.cold.some(cold => !cold.casualtiesByCause));
  const lordMigration = population.lordRuleVersion !== BOT_LORD_RULE_VERSION || !Number.isSafeInteger(population.livingLordCount)
    || population.chunks.some(chunk => chunk.cold.some(cold => !cold.lord || !('retreatRoute' in cold.lord)
      || !Number.isSafeInteger(cold.lord.retreatDistanceMm) || !Number.isSafeInteger(cold.lord.retreatProgressMm)
      || !Number.isSafeInteger(cold.lord.retreatSpeedMmPerHour) || !Number.isSafeInteger(cold.lord.retreatTravelRemainder)
      || !('retreatStartedAtElapsedMs' in cold.lord) || !('retreatThreatActorId' in cold.lord)
      || !('retreatThreatPosition' in cold.lord) || !('retreatDestination' in cold.lord)
      || !('encounterThreatActorId' in cold.lord) || !('encounterThreatPosition' in cold.lord)
      || !Number.isSafeInteger(cold.lord.carriedFoodConsumptionRemainder)
      || cold.lord.carriedFoodConsumptionRemainder < 0 || cold.lord.carriedFoodConsumptionRemainder >= 20
      || !Number.isSafeInteger(cold.lord.carriedWaterConsumptionRemainder)
      || cold.lord.carriedWaterConsumptionRemainder < 0 || cold.lord.carriedWaterConsumptionRemainder >= 216));
  const blueprintItemMigration = population.chunks.some(chunk => chunk.cold.some(cold => !Array.isArray(cold.blueprintItems)
    || !Array.isArray(cold.ownedChests) || !Array.isArray(cold.inventoryItems) || !Number.isSafeInteger(cold.territoryLevel)));
  const chunks = population.chunks.slice() as BotStateChunk[];
  if (legacyRules || survivalMetadataMigration || rewardMetadataMigration || movementRepair || blueprintItemMigration || casualtyMigration || lordMigration) for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex]!;
    const hasInvalidMovement = chunk.cold.some(cold => cold.armyMovement?.unitCount === 0);
    const hasMissingLord = chunk.cold.some(cold => !cold.lord);
    const needsRowUpgrade = legacyRules || survivalMetadataMigration || chunk.cold.some(cold => !cold.casualtiesByCause || !Array.isArray(cold.blueprintItems)
      || !cold.lord || !('retreatRoute' in cold.lord)
      || !Number.isSafeInteger(cold.lord.retreatDistanceMm) || !Number.isSafeInteger(cold.lord.retreatProgressMm)
      || !Number.isSafeInteger(cold.lord.retreatSpeedMmPerHour) || !Number.isSafeInteger(cold.lord.retreatTravelRemainder)
      || !('retreatStartedAtElapsedMs' in cold.lord) || !('retreatThreatActorId' in cold.lord)
      || !('retreatThreatPosition' in cold.lord) || !('retreatDestination' in cold.lord)
      || !('encounterThreatActorId' in cold.lord) || !('encounterThreatPosition' in cold.lord)
      || !Array.isArray(cold.ownedChests) || !Array.isArray(cold.inventoryItems) || !cold.lordFate
      || !Number.isSafeInteger(cold.potableWaterMl) || !Number.isSafeInteger(cold.localIceRemainingMl)
      || !Number.isSafeInteger(cold.waterConsumptionRemainder) || !Number.isSafeInteger(cold.dehydrationExposureMs)
      || !Number.isSafeInteger(cold.lordStarvationExposureMs) || !Number.isSafeInteger(cold.lordDehydrationExposureMs)
      || !Number.isSafeInteger(cold.lordColdExposureMs) || !Number.isSafeInteger(cold.territoryLevel)
      || !cold.lord || !Number.isSafeInteger(cold.lord.carriedFoodConsumptionRemainder)
      || cold.lord.carriedFoodConsumptionRemainder < 0 || cold.lord.carriedFoodConsumptionRemainder >= 20
      || !Number.isSafeInteger(cold.lord.carriedWaterConsumptionRemainder)
      || cold.lord.carriedWaterConsumptionRemainder < 0 || cold.lord.carriedWaterConsumptionRemainder >= 216
      || !Array.isArray(cold.eventInventory) || cold.eventInventory.some(item => !Number.isSafeInteger(item.appliedQuantity) || !Number.isSafeInteger(item.consumedQuantity)
        || item.ruleVersion !== BOT_EVENT_REWARD_RULE_VERSION));
    if (!hasInvalidMovement && !needsRowUpgrade) continue;
    const needsLegacyCasualtyCount = chunk.cold.some(cold => !cold.casualtiesByCause);
    const hot = hasInvalidMovement || needsLegacyCasualtyCount || hasMissingLord ? hydrateBotHotArrays(chunk) : null;
    const cold = chunk.cold.slice() as BotColdRecord[];
    const repairedOffsets: number[] = [];
    for (let offset = 0; offset < cold.length; offset += 1) {
      const record = cold[offset]!;
      let next = record;
      if (!record.lord) {
        const at = hot?.lastIntegratedAtElapsedMs[offset] ?? 0;
        // Legacy `alive` and fate fields described settlement disposition,
        // not resolved personal HP death. Preserve recorded troop losses and
        // initialize the separate normal-human actor alive at migration time.
        const lord = createBotLord(record.botId, record.position, at);
        if (hot) {
          hot.alive[offset] = 1;
          hot.nextWakeAtElapsedMs[offset] = Math.max(at + 1, Math.min(hot.nextWakeAtElapsedMs[offset]!, at + BOT_STRATEGIC_LATTICE_MS));
        }
        next = { ...next, lord, lordFate: { status: 'active', changedAtElapsedMs: null, cause: null, triggerId: null } };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      if (next.lord && (!Number.isSafeInteger(next.lord.carriedFoodConsumptionRemainder)
        || next.lord.carriedFoodConsumptionRemainder < 0 || next.lord.carriedFoodConsumptionRemainder >= 20
        || !Number.isSafeInteger(next.lord.carriedWaterConsumptionRemainder)
        || next.lord.carriedWaterConsumptionRemainder < 0 || next.lord.carriedWaterConsumptionRemainder >= 216)) {
        next = { ...next, lord: { ...next.lord,
          carriedFoodConsumptionRemainder: Number.isSafeInteger(next.lord.carriedFoodConsumptionRemainder)
            && next.lord.carriedFoodConsumptionRemainder >= 0 && next.lord.carriedFoodConsumptionRemainder < 20 ? next.lord.carriedFoodConsumptionRemainder : 0,
          carriedWaterConsumptionRemainder: Number.isSafeInteger(next.lord.carriedWaterConsumptionRemainder)
            && next.lord.carriedWaterConsumptionRemainder >= 0 && next.lord.carriedWaterConsumptionRemainder < 216 ? next.lord.carriedWaterConsumptionRemainder : 0,
        } };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      if (next.lord && (!('retreatRoute' in next.lord)
        || !Number.isSafeInteger(next.lord.retreatDistanceMm)
        || !Number.isSafeInteger(next.lord.retreatProgressMm)
        || !Number.isSafeInteger(next.lord.retreatSpeedMmPerHour)
        || !Number.isSafeInteger(next.lord.retreatTravelRemainder)
        || !('retreatStartedAtElapsedMs' in next.lord)
        || !('retreatThreatActorId' in next.lord)
        || !('retreatThreatPosition' in next.lord)
        || !('retreatDestination' in next.lord)
        || !('encounterThreatActorId' in next.lord)
        || !('encounterThreatPosition' in next.lord))) {
        next = { ...next, lord: {
          ...next.lord,
          location: next.lord.location === 'retreating' ? 'field'
            : next.lord.location === 'encounter' ? 'settlement' : next.lord.location,
          activity: next.lord.activity === 'retreating' ? 'resting'
            : next.lord.activity === 'encounter' ? 'at_settlement' : next.lord.activity,
          activeEncounterId: null,
          encounterThreatActorId: null, encounterThreatPosition: null,
          retreatRoute: null, retreatDistanceMm: 0, retreatProgressMm: 0,
          retreatStartedAtElapsedMs: null, retreatSpeedMmPerHour: 0, retreatTravelRemainder: 0,
          retreatDestination: null, retreatThreatActorId: null, retreatThreatPosition: null,
        } };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      if (!Array.isArray(record.blueprintItems) || !Array.isArray(record.ownedChests) || !Array.isArray(record.inventoryItems)
        || !record.lordFate || record.potableWaterMl === undefined || record.localIceRemainingMl === undefined
        || record.waterConsumptionRemainder === undefined || record.dehydrationExposureMs === undefined
        || record.lordStarvationExposureMs === undefined || record.lordDehydrationExposureMs === undefined || record.lordColdExposureMs === undefined
        || !Number.isSafeInteger(record.territoryLevel)) {
        next = {
          ...next,
          blueprintItems: Array.isArray(record.blueprintItems) ? record.blueprintItems : [],
          ownedChests: Array.isArray(record.ownedChests) ? record.ownedChests : [],
          inventoryItems: Array.isArray(record.inventoryItems) ? record.inventoryItems : [],
          eventInventory: Array.isArray(record.eventInventory) ? record.eventInventory : [],
          territoryLevel: Number.isSafeInteger(record.territoryLevel) ? record.territoryLevel : 1,
          lordFate: record.lordFate ?? { status: 'active', changedAtElapsedMs: null, cause: null, triggerId: null },
          // A legacy save receives no free or retroactively generated water. The new rules apply from migration onward.
          potableWaterMl: record.potableWaterMl ?? 0,
          localIceRemainingMl: record.localIceRemainingMl ?? 0,
          waterConsumptionRemainder: record.waterConsumptionRemainder ?? 0,
          dehydrationExposureMs: record.dehydrationExposureMs ?? 0,
          lordStarvationExposureMs: record.lordStarvationExposureMs ?? 0,
          lordDehydrationExposureMs: record.lordDehydrationExposureMs ?? 0,
          lordColdExposureMs: record.lordColdExposureMs ?? 0,
        };
        repairedOffsets.push(offset);
      }
      if (!record.casualtiesByCause) {
        next = { ...next, casualtiesByCause: {
          starvation: 0, dehydration: 0, fuelExhaustion: 0, regionalBlizzard: 0, battle: 0, wildlife: 0,
          unattributed: hot?.deathCount[offset] ?? 0,
        } };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      if (Array.isArray(record.eventInventory) && record.eventInventory.some(item => !Number.isSafeInteger(item.appliedQuantity)
        || !Number.isSafeInteger(item.consumedQuantity) || item.ruleVersion !== BOT_EVENT_REWARD_RULE_VERSION)) {
        next = { ...next, eventInventory: record.eventInventory.map(item => ({ ...item,
          appliedQuantity: Number.isSafeInteger(item.appliedQuantity) ? item.appliedQuantity : 0,
          consumedQuantity: Number.isSafeInteger(item.consumedQuantity) ? item.consumedQuantity : 0,
          ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
        })) };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      if (record.armyMovement?.unitCount === 0) {
        const plan = next.currentPlan;
        if (plan && hot) {
        for (const resource of ['food', 'wood', 'stone', 'ore'] as const) {
          const key = `reserved${resource[0]!.toUpperCase()}${resource.slice(1)}Micro` as 'reservedFoodMicro' | 'reservedWoodMicro' | 'reservedStoneMicro' | 'reservedOreMicro';
          hot[key][offset] = Math.max(0, hot[key][offset]! - plan.reserved[resource] * BOT_MICRO);
        }
          hot.workKind[offset] = 0;
          hot.assignedWorkers[offset] = 0;
          hot.workProgress[offset] = 0;
          hot.workRequired[offset] = 0;
          if (hot.alive[offset] !== 0) {
            hot.nextWakeAtElapsedMs[offset] = Math.max(hot.lastIntegratedAtElapsedMs[offset]! + 1,
              Math.min(hot.nextWakeAtElapsedMs[offset]!, hot.lastIntegratedAtElapsedMs[offset]! + BOT_STRATEGIC_LATTICE_MS));
          }
        }
        next = { ...next, armyMovement: null, currentPlan: null };
        if (!repairedOffsets.includes(offset)) repairedOffsets.push(offset);
      }
      cold[offset] = next;
    }
    if (repairedOffsets.length === 0) continue;
    const serialized = hot ? serializeBotHotArrays({ ...chunk, cold }, hot) : { ...chunk, cold, chunkSha256: '' } as BotStateChunk;
    const rowSha256 = serialized.rowSha256.slice();
    for (const offset of repairedOffsets) rowSha256[offset] = botRowHash({ ...serialized, rowSha256, chunkSha256: '' }, offset);
    const unhashed = { ...serialized, rowSha256, chunkSha256: '' };
    chunks[chunkIndex] = { ...unhashed, chunkSha256: botChunkHash(unhashed) };
  }
  const nextChunks = chunks;
  const rewardReceipts = (Array.isArray(population.rewardReceipts) ? population.rewardReceipts : []).map(receipt => ({ ...receipt, items: receipt.items.map(item => ({
    ...item,
    status: ('status' in item ? item.status : 'committed') as 'committed' | 'blocked',
    blocker: ('blocker' in item ? item.blocker : null) as string | null,
  })) }));
  const boardSnapshots = (Array.isArray(population.boardSnapshots) ? population.boardSnapshots : []).map(snapshot => {
    const { snapshotSha256: _oldHash, ...base } = snapshot;
    const rankById = snapshot.rankById ?? Object.fromEntries(snapshot.rows.map(row => [row.botId, row.rank]));
    const nextBase = { ...base, rankById };
    return { ...nextBase, snapshotSha256: canonicalStateHash(nextBase) };
  });
  return {
    ...population,
    generationVersion: BOT_GENERATION_VERSION,
    activeLordOrdinals: nextChunks.flatMap(chunk => chunk.cold.flatMap((cold, offset) => cold.lord?.lifeState === 'alive'
      ? [chunk.firstOrdinal + offset] : [])),
    chunks: nextChunks,
    eventRewardRuleVersion: BOT_EVENT_REWARD_RULE_VERSION,
    rewardReceipts,
    boardSnapshots,
    ...(legacyRules || lordMigration ? {
      rulesVersion: BOT_SIMULATION_RULE_VERSION,
      plannerRuleVersion: BOT_PLANNER_RULE_VERSION,
    } : {}),
    survivalRuleVersion: BOT_SURVIVAL_RULE_VERSION,
    weatherRuleVersion: BOT_WEATHER_RULE_VERSION,
    lordRuleVersion: BOT_LORD_RULE_VERSION,
    marketRuleVersion: BOT_MARKET_RULE_VERSION,
    territoryRuleVersion: BOT_TERRITORY_RULE_VERSION,
    marketListings: Array.isArray(population.marketListings) ? population.marketListings : [],
    marketTransactions: Array.isArray(population.marketTransactions) ? population.marketTransactions : [],
    remainsChests: Array.isArray(population.remainsChests) ? population.remainsChests : [],
    livingLordCount: nextChunks.reduce((count, chunk) => count + chunk.cold.filter(cold => cold.lord?.lifeState === 'alive').length, 0),
    ...(generationMigration || activeLordIndexMigration || boardIndexMigration || legacyRules || survivalMetadataMigration || rewardMetadataMigration || blueprintItemMigration || casualtyMigration || marketMigration || lordMigration ? { rulesetSha256: canonicalStateHash({ priorRulesetSha256: population.rulesetSha256,
      migration: 'BOT-POPULATION-RULE-MIGRATION-2.7', generationVersion: BOT_GENERATION_VERSION, rulesVersion: BOT_SIMULATION_RULE_VERSION,
      plannerRuleVersion: BOT_PLANNER_RULE_VERSION, survivalRuleVersion: BOT_SURVIVAL_RULE_VERSION, weatherRuleVersion: BOT_WEATHER_RULE_VERSION,
      marketRuleVersion: BOT_MARKET_RULE_VERSION, eventRewardRuleVersion: BOT_EVENT_REWARD_RULE_VERSION, lordRuleVersion: BOT_LORD_RULE_VERSION }) } : {}),
    ...(legacyRules || survivalMetadataMigration || rewardMetadataMigration || movementRepair || blueprintItemMigration || casualtyMigration || lordMigration
      ? { chunkRootSha256: botPopulationRoot(nextChunks) } : {}),
    ...(movementRepair || lordMigration ? { schedulerHeap: heapifyBotScheduler(nextChunks.map(chunk => {
      const wake = computeBotChunkWake(chunk);
      return { atElapsedMs: wake.atElapsedMs, chunkIndex: chunk.index, botOrdinal: wake.botOrdinal };
    })) } : {}),
  };
}

export function computeBotChunkWake(chunk: BotStateChunk): { atElapsedMs: number; botOrdinal: number } {
  let atElapsedMs = Number.MAX_SAFE_INTEGER;
  let botOrdinal = chunk.firstOrdinal;
  for (let offset = 0; offset < chunk.count; offset += 1) {
    const wake = chunk.nextWakeAtElapsedMs[offset]!;
    if (wake < atElapsedMs || (wake === atElapsedMs && chunk.firstOrdinal + offset < botOrdinal)) {
      atElapsedMs = wake;
      botOrdinal = chunk.firstOrdinal + offset;
    }
  }
  return { atElapsedMs, botOrdinal };
}

function less(a: BotPopulationState['schedulerHeap'][number], b: BotPopulationState['schedulerHeap'][number]): boolean {
  return a.atElapsedMs < b.atElapsedMs || (a.atElapsedMs === b.atElapsedMs
    && (a.chunkIndex < b.chunkIndex || (a.chunkIndex === b.chunkIndex && a.botOrdinal < b.botOrdinal)));
}

export function heapifyBotScheduler(entries: readonly BotPopulationState['schedulerHeap'][number][]): BotPopulationState['schedulerHeap'][number][] {
  const heap = entries.slice();
  for (let index = Math.floor(heap.length / 2) - 1; index >= 0; index -= 1) {
    let parent = index;
    while (true) {
      const left = parent * 2 + 1;
      const right = left + 1;
      let smallest = parent;
      if (left < heap.length && less(heap[left]!, heap[smallest]!)) smallest = left;
      if (right < heap.length && less(heap[right]!, heap[smallest]!)) smallest = right;
      if (smallest === parent) break;
      [heap[parent], heap[smallest]] = [heap[smallest]!, heap[parent]!];
      parent = smallest;
    }
  }
  return heap;
}

export function popBotScheduler(heap: BotPopulationState['schedulerHeap'][number][]): BotPopulationState['schedulerHeap'][number] | null {
  if (heap.length === 0) return null;
  const first = heap[0]!;
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let parent = 0;
    while (true) {
      const left = parent * 2 + 1;
      const right = left + 1;
      let smallest = parent;
      if (left < heap.length && less(heap[left]!, heap[smallest]!)) smallest = left;
      if (right < heap.length && less(heap[right]!, heap[smallest]!)) smallest = right;
      if (smallest === parent) break;
      [heap[parent], heap[smallest]] = [heap[smallest]!, heap[parent]!];
      parent = smallest;
    }
  }
  return first;
}

export function pushBotScheduler(heap: BotPopulationState['schedulerHeap'][number][], value: BotPopulationState['schedulerHeap'][number]): void {
  let index = heap.push(value) - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (!less(heap[index]!, heap[parent]!)) break;
    [heap[index], heap[parent]] = [heap[parent]!, heap[index]!];
    index = parent;
  }
}

export function verifyBotPopulation(population: BotPopulationState): void {
  const invalid = (code: string): never => { throw new Error(`BOT_POPULATION_INVALID:${code}`); };
  if (population.schemaVersion !== 1 || !['P0_ACTIVE', 'BENCHMARK_STRESS'].includes(population.generationProfile)
    || !Number.isFinite(population.configuredMapRadiusKm) || population.configuredMapRadiusKm < 1
    || population.generationVersion !== BOT_GENERATION_VERSION
    || population.rulesVersion !== BOT_SIMULATION_RULE_VERSION || population.plannerRuleVersion !== BOT_PLANNER_RULE_VERSION
    || population.blueprintRulesVersion !== BOT_BLUEPRINT_RULE_VERSION
    || population.activityXpRuleVersion !== BOT_ACTIVITY_XP_RULE_VERSION
    || population.actionReceiptArchiveVersion !== BOT_ACTION_RECEIPT_ARCHIVE_VERSION
    || population.totalParticipants !== population.botCount + 1 || !Number.isSafeInteger(population.botCount) || population.botCount < 9 || population.botCount > 100_000
    || population.generationProfile === 'P0_ACTIVE' && population.botCount !== 1_023
    || population.chunkSize !== BOT_CHUNK_SIZE || population.talentXpRuleVersion !== BOT_TALENT_XP_RULE_VERSION
    || population.huntRuleVersion !== BOT_HUNT_RULE_VERSION || population.repairRuleVersion !== BOT_REPAIR_RULE_VERSION
    || population.equipmentRuleVersion !== BOT_EQUIPMENT_RULE_VERSION
    || population.recoveryRuleVersion !== BOT_RECOVERY_RULE_VERSION || population.eventRewardRuleVersion !== BOT_EVENT_REWARD_RULE_VERSION
    || population.sharedWildlifeRuleVersion !== BOT_SHARED_WILDLIFE_RULE_VERSION || population.survivalRuleVersion !== BOT_SURVIVAL_RULE_VERSION
    || population.territoryRuleVersion !== BOT_TERRITORY_RULE_VERSION || population.marketRuleVersion !== BOT_MARKET_RULE_VERSION
    || population.weatherRuleVersion !== BOT_WEATHER_RULE_VERSION || population.lordRuleVersion !== BOT_LORD_RULE_VERSION
    || !Array.isArray(population.remainsChests) || !Number.isSafeInteger(population.livingLordCount)
    || !Array.isArray(population.activeLordOrdinals) || population.activeLordOrdinals.length !== population.livingLordCount
    || !population.saveSeed || !/^[a-f0-9]{64}$/i.test(population.rulesetSha256)
    || !Number.isSafeInteger(population.generatedAtElapsedMs) || population.generatedAtElapsedMs !== 0
    || !Number.isSafeInteger(population.playerRaidProtectionEndsAtElapsedMs) || population.playerRaidProtectionEndsAtElapsedMs < 0
    || !Number.isSafeInteger(population.publicRevision) || population.publicRevision < 0
    || !Number.isSafeInteger(population.lastPublicSnapshotAtElapsedMs) || population.lastPublicSnapshotAtElapsedMs < 0
    || !Array.isArray(population.pendingBoardPublicationAtElapsedMs)
    || population.pendingBoardPublicationAtElapsedMs.some((at, index) => !Number.isSafeInteger(at) || at < 0 || (index > 0 && at <= population.pendingBoardPublicationAtElapsedMs[index - 1]!))
    || !Array.isArray(population.eventReceipts)
    || !Array.isArray(population.marketListings) || !Array.isArray(population.marketTransactions)
    || !Number.isSafeInteger(population.completedActionCount) || population.completedActionCount < 0) invalid('manifest');
  const quotaValues = ['S', 'A', 'B', 'C', 'D'].map(grade => population.talentQuotas?.[grade as BotTalentGrade]);
  if (!quotaValues.every(value => Number.isSafeInteger(value) && value >= 0) || quotaValues.reduce((sum, value) => sum + Number(value), 0) !== population.botCount
    || population.generationProfile === 'P0_ACTIVE' && JSON.stringify(population.talentQuotas) !== JSON.stringify({ S: 2, A: 51, B: 205, C: 358, D: 407 })) invalid('grade-quotas');
  const expectedChunkCount = Math.ceil(population.botCount / population.chunkSize);
  if (population.chunks.length !== expectedChunkCount || population.schedulerHeap.length !== expectedChunkCount
    || !Array.isArray(population.sharedWildlifeStocks) || !/^[a-f0-9]{64}$/i.test(population.sharedWildlifeRootSha256)
    || population.sharedWildlifeRootSha256 !== botSharedWildlifeRoot(population.sharedWildlifeStocks)) invalid('chunk-count');
  const wildlifeStockById = new Map<string, BotPopulationState['sharedWildlifeStocks'][number]>();
  let lastWildlifeStockId = '';
  for (const stock of population.sharedWildlifeStocks) {
    if (!stock || !stock.id || wildlifeStockById.has(stock.id) || stock.id <= lastWildlifeStockId
      || !Number.isSafeInteger(stock.initialActions) || stock.initialActions < 1
      || !Number.isSafeInteger(stock.remainingActions) || stock.remainingActions < 0 || stock.remainingActions > stock.initialActions
      || !Number.isSafeInteger(stock.dangerPermille) || stock.dangerPermille < 1 || stock.dangerPermille > 1_000
      || !Number.isSafeInteger(stock.position.xMm) || !Number.isSafeInteger(stock.position.yMm)) invalid('wildlife-stock');
    wildlifeStockById.set(stock.id, stock);
    lastWildlifeStockId = stock.id;
  }
  const seenIds = new Set<string>();
  const claimedFieldChestIds = new Set<string>();
  const grades = [0, 0, 0, 0, 0];
  const kinds = [0, 0];
  let livingLordCount = 0;
  const activeLordOrdinals: number[] = [];
  const requiredActionReceiptIds = new Map<string, Set<string>>();
  for (const receipt of population.eventReceipts) {
    if (receipt && typeof receipt.botId === 'string' && typeof receipt.actionReceiptId === 'string') {
      const ids = requiredActionReceiptIds.get(receipt.botId) ?? new Set<string>();
      ids.add(receipt.actionReceiptId);
      requiredActionReceiptIds.set(receipt.botId, ids);
    }
  }
  for (let chunkIndex = 0; chunkIndex < population.chunks.length; chunkIndex += 1) {
    const chunk = population.chunks[chunkIndex]!;
    if (chunk.index !== chunkIndex || chunk.firstOrdinal !== chunkIndex * population.chunkSize + 1
      || chunk.count !== Math.min(population.chunkSize, population.botCount - chunkIndex * population.chunkSize)
      || chunk.chunkSha256 !== botChunkHash(chunk)) invalid(`chunk:${chunkIndex}`);
    if (chunk.rowSha256.length !== chunk.count) invalid(`row-hash-count:${chunkIndex}`);
    const hot = hydrateBotHotArrays(chunk);
    for (let offset = 0; offset < chunk.count; offset += 1) {
      const ordinal = chunk.firstOrdinal + offset;
      const cold = chunk.cold[offset];
      if (chunk.rowSha256[offset] !== botRowHash(chunk, offset)) invalid(`row-hash:${ordinal}`);
      if (!cold || cold.ordinal !== ordinal || chunk.ids[offset] !== ordinal || cold.botId !== (ordinal <= 9
        ? `RC-${String(ordinal + 1).padStart(3, '0')}` : `BOT-P0-${String(ordinal).padStart(4, '0')}`)) invalid(`identity:${ordinal}`);
      if (seenIds.has(cold.botId)) invalid(`duplicate-id:${cold.botId}`);
      seenIds.add(cold.botId);
      if (!Number.isSafeInteger(cold.territoryLevel) || cold.territoryLevel < 1 || cold.territoryLevel > 3) invalid(`territory-level:${ordinal}`);
      const casualtyLedger = cold.casualtiesByCause;
      const casualtyValues = casualtyLedger ? Object.values(casualtyLedger) : [];
      if (!casualtyLedger || casualtyValues.some(value => !Number.isSafeInteger(value) || value < 0)
        || casualtyValues.reduce((sum, value) => sum + value, 0) !== hot.deathCount[offset]) invalid(`casualty-ledger:${ordinal}`);
      const fate = cold.lordFate;
      if (!fate || !['active', 'dead', 'captured', 'dispossessed'].includes(fate.status)
        || !(fate.changedAtElapsedMs === null || (Number.isSafeInteger(fate.changedAtElapsedMs) && fate.changedAtElapsedMs >= 0
          && fate.changedAtElapsedMs <= hot.lastIntegratedAtElapsedMs[offset]! + 3_000))
        || !(fate.cause === null || ['starvation', 'dehydration', 'cold', 'combat', 'battle_capture', 'territory_loss', 'settlement_abandoned'].includes(fate.cause))
        || !(fate.triggerId === null || typeof fate.triggerId === 'string' && fate.triggerId.length > 0)
        || fate.status === 'active' && (fate.changedAtElapsedMs !== null || fate.cause !== null || fate.triggerId !== null)
        || fate.status !== 'active' && (fate.changedAtElapsedMs === null || fate.cause === null || fate.triggerId === null)
        || !cold.lord || cold.lord.id !== `LORD:${cold.botId}` || cold.lord.ownerId !== cold.botId
        || cold.lord.profileVersion !== 'BOT-NORMAL-HUMAN-LORD-1.0' || !['alive', 'dead'].includes(cold.lord.lifeState)
        || !Number.isSafeInteger(cold.lord.hpMicro) || !Number.isSafeInteger(cold.lord.maxHpMicro) || cold.lord.maxHpMicro !== 100_000_000
        || cold.lord.hpMicro < 0 || cold.lord.hpMicro > cold.lord.maxHpMicro
        || cold.lord.lifeState === 'alive' && (cold.lord.hpMicro <= 0 || cold.lord.deathRecord !== null)
        || cold.lord.lifeState === 'dead' && (cold.lord.hpMicro !== 0 || !cold.lord.deathRecord)
        || (cold.lord.lifeState === 'dead') !== (fate.status === 'dead')
        || (hot.alive[offset] !== 0) !== (cold.lord.lifeState === 'alive')
        || cold.lord.lastIntegratedAtElapsedMs !== hot.lastIntegratedAtElapsedMs[offset]
        || !Number.isSafeInteger(cold.lord.foodShortfallMs) || cold.lord.foodShortfallMs < 0
        || !Number.isSafeInteger(cold.lord.waterShortfallMs) || cold.lord.waterShortfallMs < 0
        || !Number.isSafeInteger(cold.lord.carriedFoodConsumptionRemainder) || cold.lord.carriedFoodConsumptionRemainder < 0
        || !Number.isSafeInteger(cold.lord.carriedWaterConsumptionRemainder) || cold.lord.carriedWaterConsumptionRemainder < 0
        || !Number.isSafeInteger(cold.lord.coldLoadMicro) || cold.lord.coldLoadMicro < 0
        || !Number.isSafeInteger(cold.potableWaterMl) || cold.potableWaterMl < 0 || cold.potableWaterMl > BOT_WATER_CAPACITY_ML
        || !Number.isSafeInteger(cold.localIceRemainingMl) || cold.localIceRemainingMl < 0 || cold.localIceRemainingMl > BOT_LOCAL_ICE_STOCK_ML
        || !Number.isSafeInteger(cold.waterConsumptionRemainder) || cold.waterConsumptionRemainder < 0 || cold.waterConsumptionRemainder >= 86_400_000
        || !Number.isSafeInteger(cold.dehydrationExposureMs) || cold.dehydrationExposureMs < 0 || cold.dehydrationExposureMs > 24 * 60 * 60_000
        || !Number.isSafeInteger(cold.lordStarvationExposureMs) || cold.lordStarvationExposureMs < 0 || cold.lordStarvationExposureMs > BOT_LORD_STARVATION_FATAL_MS
        || !Number.isSafeInteger(cold.lordDehydrationExposureMs) || cold.lordDehydrationExposureMs < 0 || cold.lordDehydrationExposureMs > BOT_LORD_DEHYDRATION_FATAL_MS
        || !Number.isSafeInteger(cold.lordColdExposureMs) || cold.lordColdExposureMs < 0 || cold.lordColdExposureMs > BOT_LORD_COLD_FATAL_MS) invalid(`lord-survival:${ordinal}`);
      const lord = cold.lord;
      if (!['settlement', 'travelling', 'encounter', 'retreating', 'field'].includes(lord.location)
        || !Number.isSafeInteger(lord.retreatDistanceMm) || lord.retreatDistanceMm < 0
        || !Number.isSafeInteger(lord.retreatProgressMm) || lord.retreatProgressMm < 0
        || lord.retreatProgressMm > lord.retreatDistanceMm
        || !Number.isSafeInteger(lord.retreatSpeedMmPerHour) || lord.retreatSpeedMmPerHour < 0
        || !Number.isSafeInteger(lord.retreatTravelRemainder) || lord.retreatTravelRemainder < 0
        || lord.retreatTravelRemainder >= 3_600_000
        || lord.retreatRoute === null && (lord.retreatDistanceMm !== 0 || lord.retreatProgressMm !== 0
          || lord.retreatStartedAtElapsedMs !== null || lord.retreatSpeedMmPerHour !== 0
          || lord.retreatTravelRemainder !== 0 || lord.retreatDestination !== null
          || lord.retreatThreatActorId !== null || lord.retreatThreatPosition !== null)
        || lord.retreatRoute !== null && (!Array.isArray(lord.retreatRoute) || lord.retreatRoute.length < 2
          || lord.retreatRoute.some(point => !Number.isSafeInteger(point.xMm) || !Number.isSafeInteger(point.yMm)
            || !Number.isFinite(point.sourceZMetres ?? 0))
          || lord.retreatDistanceMm <= 0 || lord.retreatProgressMm >= lord.retreatDistanceMm
          || lord.retreatSpeedMmPerHour <= 0 || !Number.isSafeInteger(lord.retreatStartedAtElapsedMs)
          || lord.retreatStartedAtElapsedMs! < 0 || lord.retreatStartedAtElapsedMs! > lord.lastIntegratedAtElapsedMs
          || lord.retreatDestination === null || lord.retreatThreatPosition === null
          || !Number.isSafeInteger(lord.retreatDestination?.xMm) || !Number.isSafeInteger(lord.retreatDestination?.yMm)
          || !Number.isSafeInteger(lord.retreatThreatPosition?.xMm) || !Number.isSafeInteger(lord.retreatThreatPosition?.yMm)
          || typeof lord.retreatThreatActorId !== 'string' || lord.retreatThreatActorId.length === 0
          || lord.retreatDestination?.xMm !== lord.retreatRoute.at(-1)?.xMm
          || lord.retreatDestination?.yMm !== lord.retreatRoute.at(-1)?.yMm
          || lord.encounterThreatActorId !== null || lord.encounterThreatPosition !== null
          || lord.location !== 'retreating' || lord.activity !== 'retreating')) invalid(`lord-retreat:${ordinal}`);
      const hasEncounterThreat = lord.encounterThreatActorId !== null || lord.encounterThreatPosition !== null;
      if (hasEncounterThreat && (typeof lord.encounterThreatActorId !== 'string' || lord.encounterThreatActorId.length === 0
        || !lord.encounterThreatPosition || !Number.isSafeInteger(lord.encounterThreatPosition.xMm)
        || !Number.isSafeInteger(lord.encounterThreatPosition.yMm) || lord.activeEncounterId === null || lord.activity !== 'encounter')
        || lord.activity === 'encounter' && (lord.activeEncounterId === null || !hasEncounterThreat)
        || lord.encounterThreatActorId === null !== (lord.encounterThreatPosition === null)) invalid(`lord-encounter:${ordinal}`);
      if (!Number.isSafeInteger(lord.carriedFoodMicro) || lord.carriedFoodMicro < 0
        || !Number.isSafeInteger(lord.carriedWaterMicro) || lord.carriedWaterMicro < 0
        || !Number.isSafeInteger(lord.carriedFoodConsumptionRemainder) || lord.carriedFoodConsumptionRemainder < 0
        || lord.carriedFoodConsumptionRemainder >= 20
        || !Number.isSafeInteger(lord.carriedWaterConsumptionRemainder) || lord.carriedWaterConsumptionRemainder < 0
        || lord.carriedWaterConsumptionRemainder >= 216) invalid(`lord-carried-supplies:${ordinal}`);
      if (chunk.talentGrades[offset]! > 4 || chunk.talentKinds[offset]! > 1 || !Number.isSafeInteger(chunk.regionIndices[offset])) invalid(`talent:${ordinal}`);
      if (cold.lord.lifeState === 'alive') { livingLordCount += 1; activeLordOrdinals.push(ordinal); }
      grades[chunk.talentGrades[offset]!] += 1;
      kinds[chunk.talentKinds[offset]!] += 1;
      if (!Number.isSafeInteger(hot.lastIntegratedAtElapsedMs[offset]) || hot.lastIntegratedAtElapsedMs[offset]! < 0
        || !Number.isSafeInteger(hot.nextWakeAtElapsedMs[offset]) || hot.nextWakeAtElapsedMs[offset]! < hot.lastIntegratedAtElapsedMs[offset]!) invalid(`economy-time:${ordinal}`);
      for (const resource of ['food', 'wood', 'stone', 'ore'] as const) {
        const balance = hot[`${resource}Micro` as const][offset]!;
        const reserved = hot[`reserved${resource[0]!.toUpperCase()}${resource.slice(1)}Micro` as const][offset]!;
        if (!Number.isSafeInteger(balance) || balance < 0 || !Number.isSafeInteger(reserved) || reserved < 0 || reserved > balance) {
          invalid(`economy-${resource}:${ordinal}:${balance}:${reserved}`);
        }
      }
      if (!Number.isSafeInteger(hot.firewoodMicro[offset]) || hot.firewoodMicro[offset]! < 0) invalid(`economy-firewood:${ordinal}`);
      const workforce = cold.workforce;
      const assigned = Object.values(workforce).reduce((sum, value) => sum + value, 0);
      if (!Number.isSafeInteger(hot.workers[offset]) || hot.workers[offset]! < 0 || assigned > hot.workers[offset]!
        || !Number.isSafeInteger(hot.population[offset]) || hot.population[offset]! < hot.armySize[offset]!) invalid(`workforce:${ordinal}`);
      const structureIds = new Set<string>();
      let buildingCount = 0;
      let farmCount = 0;
      let millCount = 0;
      let quarryCount = 0;
      let barracksCount = 0;
      let wallCount = 0;
      for (const structure of cold.structures) {
        if (!structure || !structure.id || structureIds.has(structure.id) || !structure.blueprintId
          || !Number.isSafeInteger(structure.level) || structure.level < 1
          || !Number.isSafeInteger(structure.damagePermille) || structure.damagePermille < 0 || structure.damagePermille > 1_000
          || !['under_construction', 'active', 'damaged', 'destroyed'].includes(structure.status)
          || ![structure.anchor.xMm, structure.anchor.yMm, structure.footprintMm.widthMm, structure.footprintMm.depthMm].every(Number.isSafeInteger)
          || structure.footprintMm.widthMm <= 0 || structure.footprintMm.depthMm <= 0) invalid(`structure:${ordinal}`);
        structureIds.add(structure.id);
        if (structure.status === 'active' || structure.status === 'damaged') {
          buildingCount += 1;
          if (structure.status === 'active') {
            if (structure.blueprintId === 'BP-BOT-FARM') farmCount += 1;
            else if (structure.blueprintId === 'BP-BOT-WOOD-MILL') millCount += 1;
            else if (structure.blueprintId === 'BP-BOT-QUARRY') quarryCount += 1;
            else if (structure.blueprintId === 'BP-BOT-BARRACKS') barracksCount += 1;
            else if (structure.blueprintId === 'BP-BOT-WALL') wallCount += 1;
          }
        }
      }
      if (buildingCount !== hot.buildingCount[offset] || farmCount !== hot.farmCount[offset] || millCount !== hot.millCount[offset]
        || quarryCount !== hot.quarryCount[offset] || barracksCount !== hot.barracksCount[offset] || wallCount !== hot.wallCount[offset]) invalid(`structure-capacity:${ordinal}`);
      const cohortIds = new Set<string>();
      let livingCohorts = 0;
      for (const cohort of cold.cohorts) {
        if (!cohort || !cohort.id || cohortIds.has(cohort.id) || !cohort.templateId
          || !Number.isSafeInteger(cohort.firstMemberOrdinal) || cohort.firstMemberOrdinal < 1
          || !Number.isSafeInteger(cohort.livingCount) || cohort.livingCount < 0
          || !Number.isSafeInteger(cohort.recruitedCount) || cohort.recruitedCount < 1
          || !Number.isSafeInteger(cohort.lostCount) || cohort.lostCount < 0
          || cohort.livingCount + cohort.lostCount !== cohort.recruitedCount
          || cohort.firstMemberOrdinal + cohort.recruitedCount > cold.nextMemberOrdinal
          || !Number.isSafeInteger(cohort.level) || cohort.level < 1
          || !Number.isSafeInteger(cohort.healthPerMember) || cohort.healthPerMember < 0
          || !Number.isSafeInteger(cohort.maxHealthPerMember) || cohort.maxHealthPerMember < 1 || cohort.healthPerMember > cohort.maxHealthPerMember
          || !Array.isArray(cohort.equipmentTemplateIds) || new Set(cohort.equipmentTemplateIds).size !== cohort.equipmentTemplateIds.length
          || cohort.equipmentTemplateIds.some(id => id !== 'BOT-WEAPON-IRON-1.0')) invalid(`cohort:${ordinal}`);
        cohortIds.add(cohort.id);
        livingCohorts += cohort.livingCount;
      }
      if (livingCohorts !== hot.armySize[offset]) invalid(`cohort-army-count:${ordinal}`);
      const sourceIds = new Set<string>();
      for (const source of cold.searchSources) {
        if (!source || !source.id || sourceIds.has(source.id) || !['field_cache', 'ruin', 'wildlife_track', 'survey_site'].includes(source.kind)
          || !Number.isSafeInteger(source.remainingActions) || source.remainingActions < 0
          || !Number.isSafeInteger(source.position.xMm) || !Number.isSafeInteger(source.position.yMm)
          || (source.kind === 'wildlife_track' && (!Number.isSafeInteger(source.wildlifeDangerPermille) || source.wildlifeDangerPermille! < 1 || source.wildlifeDangerPermille! > 1_000))
          || (source.kind === 'wildlife_track' && (!source.sharedStockId || !wildlifeStockById.has(source.sharedStockId)
            || wildlifeStockById.get(source.sharedStockId)?.dangerPermille !== source.wildlifeDangerPermille
            || source.remainingActions > wildlifeStockById.get(source.sharedStockId)!.initialActions))
          || (source.fieldChestId !== undefined && (source.kind !== 'field_cache' || !source.fieldChestId))
          || (source.kind !== 'wildlife_track' && (source.wildlifeDangerPermille !== undefined || source.sharedStockId !== undefined))) invalid(`search-source:${ordinal}`);
        sourceIds.add(source.id);
      }
      if (!Array.isArray(cold.blueprintItems)) invalid(`blueprint-items:${ordinal}`);
      const blueprintItemIds = new Set<string>();
      for (const item of cold.blueprintItems) {
        if (!item || !item.instanceId || blueprintItemIds.has(item.instanceId) || !BOT_BLUEPRINT_BY_ID.has(item.blueprintId)
          || !item.sourceId || !Number.isSafeInteger(item.acquiredAtElapsedMs) || item.acquiredAtElapsedMs < 0
          || !['owned', 'learned', 'listed', 'escrowed', 'sold'].includes(item.status)
          || !(item.resolvedAtElapsedMs === null || Number.isSafeInteger(item.resolvedAtElapsedMs) && item.resolvedAtElapsedMs >= item.acquiredAtElapsedMs)
          || !(item.transactionId === null || typeof item.transactionId === 'string') || item.ruleVersion !== BOT_BLUEPRINT_RULE_VERSION
          || item.status === 'learned' && (!cold.blueprintIds.includes(item.blueprintId) || item.resolvedAtElapsedMs === null)
          || item.status === 'escrowed' && (item.resolvedAtElapsedMs !== null || item.transactionId !== null)
          || (item.status === 'listed' || item.status === 'sold') && item.resolvedAtElapsedMs === null) invalid(`blueprint-item:${ordinal}`);
        blueprintItemIds.add(item.instanceId);
      }
      if (!Array.isArray(cold.ownedChests) || !Array.isArray(cold.inventoryItems)) invalid(`bot-inventory:${ordinal}`);
      const ownedChestIds = new Set<string>();
      for (const chest of cold.ownedChests) {
        if (!chest || !chest.chestId || ownedChestIds.has(chest.chestId) || !chest.sourceId
          || !(chest.fieldChestId === null || typeof chest.fieldChestId === 'string' && chest.fieldChestId.length > 0)
          || !['field', 'event'].includes(chest.chestType) || !(chest.eventId === null || typeof chest.eventId === 'string')
          || !['Mộc', 'Thanh Đồng', 'Bạch Ngân', 'Hoàng Kim', 'Hạo Nguyệt'].includes(chest.grade)
          || !chest.lootCommitment || !Number.isSafeInteger(chest.acquiredAtElapsedMs) || chest.acquiredAtElapsedMs < 0
          || !['owned', 'opened'].includes(chest.status)
          || !(chest.openedAtElapsedMs === null || Number.isSafeInteger(chest.openedAtElapsedMs) && chest.openedAtElapsedMs >= chest.acquiredAtElapsedMs)
          || !(chest.lootReceiptId === null || typeof chest.lootReceiptId === 'string')
          || (chest.lootRuleVersion !== undefined && chest.lootRuleVersion !== CHEST_LOOT_RULE_VERSION
            && chest.lootRuleVersion !== LEGACY_CHEST_LOOT_RULE_VERSION)
          || !(chest.lootOutcome === null || Array.isArray(chest.lootOutcome) && chest.lootOutcome.every(item => item
            && typeof item.itemTemplateId === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0))
          || chest.ruleVersion !== BOT_CHEST_RULE_VERSION
          || chest.status === 'owned' && (chest.openedAtElapsedMs !== null || chest.lootReceiptId !== null || chest.lootOutcome !== null)
          || chest.status === 'opened' && (chest.openedAtElapsedMs === null || chest.lootReceiptId === null || chest.lootOutcome === null)) invalid(`owned-chest:${ordinal}`);
        if (chest.fieldChestId) {
          if (claimedFieldChestIds.has(chest.fieldChestId)) invalid(`duplicate-world-chest-owner:${chest.fieldChestId}`);
          claimedFieldChestIds.add(chest.fieldChestId);
        }
        ownedChestIds.add(chest.chestId);
      }
      const inventoryItemIds = new Set<string>();
      for (const item of cold.inventoryItems) {
        if (!item || !item.instanceId || inventoryItemIds.has(item.instanceId) || !item.itemTemplateId
          || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !item.sourceId
          || !Number.isSafeInteger(item.acquiredAtElapsedMs) || item.acquiredAtElapsedMs < 0
          || item.ruleVersion !== BOT_CHEST_RULE_VERSION) invalid(`inventory-item:${ordinal}`);
        inventoryItemIds.add(item.instanceId);
      }
      const inventoryIds = new Set<string>();
      for (const item of cold.eventInventory) {
        if (!item || !item.instanceId || inventoryIds.has(item.instanceId) || !item.itemTemplateId
          || !Number.isSafeInteger(item.quantity) || item.quantity < 0
          || !Number.isSafeInteger(item.appliedQuantity) || item.appliedQuantity < 0
          || !Number.isSafeInteger(item.consumedQuantity) || item.consumedQuantity < 0 || !item.eventId
          || !Number.isSafeInteger(item.awardedAtElapsedMs) || item.awardedAtElapsedMs < 0
          || item.ruleVersion !== BOT_EVENT_REWARD_RULE_VERSION || !item.rewardReceiptId) invalid(`event-inventory:${ordinal}`);
        inventoryIds.add(item.instanceId);
      }
      const movement = cold.armyMovement;
      if (movement) {
        const validPosition = (position: typeof movement.from) => Number.isSafeInteger(position.xMm) && Number.isSafeInteger(position.yMm)
          && Number.isFinite(position.sourceZMetres ?? 0);
        const invalidMovement = (reason: string): never => invalid(`movement:${ordinal}:${reason}`);
        if (!movement.orderId) invalidMovement('missing-order-id');
        if (!movement.targetId) invalidMovement('missing-target-id');
        if (!Number.isSafeInteger(movement.unitCount) || movement.unitCount <= 0) invalidMovement(`unit-count:${movement.unitCount}`);
        if (!['army', 'scout'].includes(movement.unitKind)) invalidMovement(`unit-kind:${movement.unitKind}`);
        if (!['outbound', 'besieging', 'surveying', 'returning'].includes(movement.status)) invalidMovement(`status:${movement.status}`);
        if (!validPosition(movement.from)) invalidMovement('invalid-origin');
        if (!validPosition(movement.to)) invalidMovement('invalid-destination');
        if (!Number.isSafeInteger(movement.startedAtElapsedMs) || movement.startedAtElapsedMs < 0) invalidMovement(`started-at:${movement.startedAtElapsedMs}`);
        if (!Number.isSafeInteger(movement.arrivesAtElapsedMs) || movement.arrivesAtElapsedMs < movement.startedAtElapsedMs) invalidMovement(`arrives-at:${movement.arrivesAtElapsedMs}`);
        if (movement.unitKind === 'army' && movement.unitCount > hot.armySize[offset]!) invalidMovement(`army-count:${movement.unitCount}>${hot.armySize[offset]}`);
        if (movement.unitKind === 'scout' && movement.unitCount > workforce.scouts) invalidMovement(`scout-count:${movement.unitCount}>${workforce.scouts}`);
        if (movement.unitKind === 'army' && movement.status === 'surveying') invalidMovement('army-surveying');
        if (movement.unitKind === 'scout' && movement.status === 'besieging') invalidMovement('scout-besieging');
        if (movement.status === 'besieging' && (!cold.currentPlan || cold.currentPlan.action !== 'raid')) invalidMovement(`besieging-plan:${cold.currentPlan?.action ?? 'none'}`);
        if (movement.status === 'surveying' && (!cold.currentPlan || !['scout', 'search', 'hunt'].includes(cold.currentPlan.action))) invalidMovement(`surveying-plan:${cold.currentPlan?.action ?? 'none'}`);
        if (movement.status === 'returning' && cold.currentPlan !== null) invalidMovement(`returning-plan:${cold.currentPlan.action}`);
        if (movement.status === 'outbound' && (!cold.currentPlan || !['raid', 'scout', 'search', 'hunt'].includes(cold.currentPlan.action))) invalidMovement(`outbound-plan:${cold.currentPlan?.action ?? 'none'}`);
        if (movement.cohortMemberCounts !== undefined) {
          const assigned = new Map<string, number>();
          let memberTotal = 0;
          if (movement.unitKind !== 'army' || !Array.isArray(movement.cohortMemberCounts)) invalid(`movement-cohorts:${ordinal}`);
          for (const row of movement.cohortMemberCounts) {
            const cohort = cold.cohorts.find(item => item.id === row.cohortId);
            if (!cohort || assigned.has(row.cohortId) || !Number.isSafeInteger(row.memberCount) || row.memberCount < 1
              || row.memberCount > cohort.livingCount) invalid(`movement-cohort:${ordinal}`);
            assigned.set(row.cohortId, row.memberCount);
            memberTotal += row.memberCount;
          }
          if (memberTotal !== movement.unitCount) invalid(`movement-cohort-count:${ordinal}`);
        }
      }
      if (!Array.isArray(cold.actionReceipts) || cold.actionReceipts.length > BOT_ACTION_RECEIPT_RECENT_LIMIT
        || !Array.isArray(cold.actionReceiptArchive) || cold.actionReceiptArchive.some(page => typeof page !== 'string')
        || cold.actionReceiptArchive.length > 0 && cold.actionReceipts.length < BOT_ACTION_RECEIPT_RECENT_LIMIT - BOT_ACTION_RECEIPT_PAGE_SIZE + 1) invalid(`receipt-archive:${ordinal}`);
      let priorReceiptAt = -1;
      const grade = BOT_GRADE_FROM_CODE[chunk.talentGrades[offset]!]!;
      const kind = BOT_KIND_FROM_CODE[chunk.talentKinds[offset]!]!;
      try {
        forEachBotActionReceipt(cold, receipt => {
          if (!validBotActionReceipt(receipt, cold.botId, grade, kind) || receipt.occurredAtElapsedMs < priorReceiptAt
            || receipt.occurredAtElapsedMs > population.chunks[chunkIndex]!.lastIntegratedAtElapsedMs[offset]! + 3_000) invalid(`receipt:${ordinal}`);
          priorReceiptAt = receipt.occurredAtElapsedMs;
          requiredActionReceiptIds.get(cold.botId)?.delete(receipt.actionId);
        });
      } catch {
        invalid(`receipt-archive:${ordinal}`);
      }
    }
    const wake = computeBotChunkWake(chunk);
    const scheduled = population.schedulerHeap.find(item => item.chunkIndex === chunkIndex);
    if (!scheduled || scheduled.atElapsedMs !== wake.atElapsedMs || scheduled.botOrdinal !== wake.botOrdinal) invalid(`scheduler:${chunkIndex}`);
  }
  if (livingLordCount !== population.livingLordCount || population.activeLordOrdinals!.some((ordinal, index) => ordinal !== activeLordOrdinals[index])) {
    invalid('active-lord-index');
  }
  if (population.livingLordCount !== livingLordCount) invalid('living-lord-count');
  if (grades.some((count, index) => count !== quotaValues[index]) || kinds[0] + kinds[1] !== population.botCount
    || Math.abs(kinds[0] - kinds[1]) > 1 || seenIds.size !== population.botCount) invalid('quota');
  // A heap representation is validated as a heap, not a sorted array.
  for (let child = 1; child < population.schedulerHeap.length; child += 1) {
    const parent = Math.floor((child - 1) / 2);
    if (less(population.schedulerHeap[child]!, population.schedulerHeap[parent]!)) invalid('scheduler-heap-order');
  }
  if (population.chunkRootSha256 !== botPopulationRoot(population.chunks)) invalid('root-hash');
  const receiptIds = new Set<string>();
  for (const receipt of population.eventReceipts) {
    if (!receipt || receipt.eventId !== 'EV01-OPENING-LEVEL' || receipt.scoreRule !== 'BOT-OPENING-LEVEL-10-RECEIPT-1.0'
      || !Number.isSafeInteger(receipt.scoreDelta) || receipt.scoreDelta !== 1 || !Number.isSafeInteger(receipt.occurredAtElapsedMs)
      || receipt.occurredAtElapsedMs < 0 || receipt.occurredAtElapsedMs > 144 * 60 * 60_000 || receiptIds.has(receipt.id)) invalid('event-receipt');
    const ordinal = ordinalForBotId(receipt.botId);
    if (ordinal === null || ordinal > population.botCount) invalid('event-receipt-identity');
    const location = population.chunks[Math.floor((ordinal - 1) / population.chunkSize)];
    const bot = location?.cold[ordinal - location.firstOrdinal];
    if (!bot || bot.botId !== receipt.botId) invalid('event-receipt-attribution');
    receiptIds.add(receipt.id);
  }
  if ([...requiredActionReceiptIds.values()].some(ids => ids.size > 0)) invalid('event-receipt-attribution');
  const rewardIds = new Set<string>();
  for (const receipt of population.rewardReceipts) {
    const ordinal = ordinalForBotId(receipt.botId);
    const location = ordinal === null || ordinal > population.botCount ? null : population.chunks[Math.floor((ordinal - 1) / population.chunkSize)];
    const bot = location && ordinal !== null ? location.cold[ordinal - location.firstOrdinal] : null;
    if (!receipt || !receipt.id || rewardIds.has(receipt.id) || !receipt.eventId
      || receipt.ruleVersion !== BOT_EVENT_REWARD_RULE_VERSION || !Number.isSafeInteger(receipt.rank) || receipt.rank < 1 || receipt.rank > 100
      || !Number.isSafeInteger(receipt.occurredAtElapsedMs) || receipt.occurredAtElapsedMs < 0
      || receipt.eventId === 'EV01-OPENING-LEVEL' && receipt.occurredAtElapsedMs !== 144 * 60 * 60_000
      || !receipt.rewardBandId || !Array.isArray(receipt.items) || !bot || bot.botId !== receipt.botId
      || !population.eventReceipts.some(item => item.eventId === receipt.eventId && item.botId === receipt.botId && item.actionReceiptId === receipt.actionReceiptId)
      || receipt.items.some(item => !item.instanceId || !item.itemTemplateId || !Number.isSafeInteger(item.quantity) || item.quantity < 1
        || !['committed', 'blocked'].includes(item.status)
        || item.status === 'blocked' && (!item.blocker || item.foodUnitsApplied !== 0 || item.inventoryQuantity !== 0)
        || item.status === 'committed' && item.blocker !== null
        || !Number.isSafeInteger(item.foodUnitsApplied) || item.foodUnitsApplied < 0 || item.foodUnitsApplied > item.quantity
        || !Number.isSafeInteger(item.inventoryQuantity) || item.inventoryQuantity < 0
        || item.status === 'committed' && item.foodUnitsApplied + item.inventoryQuantity !== item.quantity)) invalid('reward-receipt');
    for (const held of bot!.eventInventory) if (held.rewardReceiptId === receipt.id && held.eventId !== receipt.eventId) invalid('reward-inventory-event');
    for (const held of bot!.eventInventory) if (held.rewardReceiptId === receipt.id
      && !receipt.items.some(item => item.status === 'committed'
        && item.inventoryQuantity >= held.quantity + held.appliedQuantity + held.consumedQuantity && item.itemTemplateId === held.itemTemplateId
        && held.instanceId.startsWith(`${receipt.id}:ITEM:${item.instanceId}:`))) invalid('reward-inventory-attribution');
    rewardIds.add(receipt.id);
  }
  for (const chunk of population.chunks) for (const bot of chunk.cold) {
    if (bot.eventInventory.some(item => !rewardIds.has(item.rewardReceiptId))) invalid('event-inventory-receipt');
  }
  const botById = new Map(population.chunks.flatMap(chunk => chunk.cold.map(bot => [bot.botId, bot] as const)));
  const marketListingIds = new Set<string>();
  const marketTransactionIds = new Set<string>();
  const escrowedBlueprintIds = new Set<string>();
  const transactionsByListing = new Map(population.marketTransactions.map(row => [row.listingId, row] as const));
  for (const transaction of population.marketTransactions) {
    if (!transaction || !transaction.id || marketTransactionIds.has(transaction.id) || !transaction.listingId
      || !botById.has(transaction.sellerBotId) || !['food', 'water'].includes(transaction.paymentResource)
      || !Number.isSafeInteger(transaction.paymentAmount) || transaction.paymentAmount <= 0
      || !Number.isSafeInteger(transaction.occurredAtElapsedMs) || transaction.occurredAtElapsedMs < 0
      || transaction.ruleVersion !== BOT_MARKET_RULE_VERSION) invalid('market-transaction');
    marketTransactionIds.add(transaction.id);
  }
  for (const listing of population.marketListings) {
    const seller = botById.get(listing.sellerBotId);
    const item = seller?.blueprintItems.find(candidate => candidate.instanceId === listing.blueprintItemInstanceId);
    const transaction = transactionsByListing.get(listing.id);
    if (!listing || !listing.id || marketListingIds.has(listing.id) || !seller || !item || item.blueprintId !== listing.blueprintId
      || !['food', 'water'].includes(listing.paymentResource) || !Number.isSafeInteger(listing.askAmount) || listing.askAmount <= 0
      || !Number.isSafeInteger(listing.createdAtElapsedMs) || listing.createdAtElapsedMs < 0
      || !Number.isSafeInteger(listing.lastRepricedAtElapsedMs) || listing.lastRepricedAtElapsedMs < listing.createdAtElapsedMs
      || !Number.isSafeInteger(listing.repriceCount) || listing.repriceCount < 0 || listing.repriceCount > 2
      || !Number.isSafeInteger(listing.expiresAtElapsedMs) || listing.expiresAtElapsedMs <= listing.createdAtElapsedMs
      || !['active', 'filled', 'cancelled', 'expired'].includes(listing.status)) invalid('market-listing');
    if (listing.status === 'active') {
      if (item.status !== 'escrowed' || item.resolvedAtElapsedMs !== null || item.transactionId !== null
        || listing.buyerBotId !== null || listing.transactionId !== null || listing.resolvedAtElapsedMs !== null
        || seller?.lordFate.status !== 'active' || escrowedBlueprintIds.has(item.instanceId)) invalid('market-active-escrow');
      escrowedBlueprintIds.add(item.instanceId);
    } else if (listing.status === 'filled') {
      if (!listing.buyerBotId || !listing.transactionId || listing.resolvedAtElapsedMs === null || item.status !== 'sold'
        || item.transactionId !== listing.transactionId || !transaction || transaction.id !== listing.transactionId
        || transaction.sellerBotId !== listing.sellerBotId || transaction.buyerBotId !== listing.buyerBotId
        || transaction.blueprintItemInstanceId !== listing.blueprintItemInstanceId || transaction.blueprintId !== listing.blueprintId
        || transaction.paymentResource !== listing.paymentResource || transaction.paymentAmount !== listing.askAmount) invalid('market-filled-settlement');
      if (listing.buyerBotId !== 'LI_LAN') {
        const buyer = botById.get(listing.buyerBotId);
        if (!buyer || !buyer.blueprintItems.some(candidate => candidate.transactionId === transaction.id && candidate.status === 'owned'
          && candidate.blueprintId === listing.blueprintId)) invalid('market-buyer-asset');
      }
    } else if (item.status !== 'owned' || item.transactionId !== null || item.resolvedAtElapsedMs !== null
      || listing.buyerBotId !== null || listing.transactionId !== null || listing.resolvedAtElapsedMs === null || transaction) invalid('market-released-escrow');
    marketListingIds.add(listing.id);
  }
  if (population.marketTransactions.some(transaction => !marketListingIds.has(transaction.listingId)
    || population.marketListings.find(listing => listing.id === transaction.listingId)?.status !== 'filled')) invalid('market-transaction-listing');
  for (const snapshot of population.boardSnapshots) {
    const { snapshotSha256, ...base } = snapshot;
    const expectedRankById = Object.fromEntries(snapshot.rows.map(row => [row.botId, row.rank]));
    if (snapshot.boardId !== 'OPENING_LEVEL' || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1
      || !Number.isSafeInteger(snapshot.asOfSimMs) || !Number.isSafeInteger(snapshot.observedThroughSimMs)
      || snapshot.rows.length > 100 || canonicalStateHash(snapshot.rankById) !== canonicalStateHash(expectedRankById)
      || snapshot.rows.some((row, index) => !row.botId || row.rank !== index + 1)
      || snapshot.snapshotSha256 !== canonicalStateHash(base)) invalid('board-snapshot');
  }
}
