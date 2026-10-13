import type { BotActionReceipt, BotColdRecord, BotPopulationState, BotSearchSource, BotSharedWildlifeStock, BotStateChunk, BotTalentGrade, BotTalentKind, BotUnitCohort, BotStructureInstance, CoordinateMm, WorldDefinition } from '../../../contracts/src/index.ts';
import { canonicalStateHash, hash64, randomIntFromFields } from '../hash.ts';
import { OPENING_LEVEL_CLOSES_AT_MS, OPENING_LEVEL_OPENS_AT_MS, OPENING_LEVEL_RIVALS } from '../openingRanking.ts';
import { BOT_ACTION_RECEIPT_ARCHIVE_VERSION, BOT_ACTIVITY_XP_RULE_VERSION, BOT_BLUEPRINT_RULE_VERSION, BOT_CHUNK_SIZE, BOT_EQUIPMENT_RULE_VERSION, BOT_EVENT_REWARD_RULE_VERSION, BOT_GENERATION_VERSION, BOT_HUNT_RULE_VERSION, BOT_KIND_CODE, BOT_MARKET_RULE_VERSION, BOT_MICRO, BOT_PLANNER_RULE_VERSION, BOT_RECOVERY_RULE_VERSION, BOT_REPAIR_RULE_VERSION, BOT_SHARED_WILDLIFE_RULE_VERSION, BOT_SIMULATION_RULE_VERSION, BOT_SURVIVAL_RULE_VERSION, BOT_TALENT_RULE_VERSION, BOT_TALENT_XP_RULE_VERSION, botChunkHash, botPopulationRoot, botRowHash, botSharedWildlifeRoot, computeBotChunkWake, heapifyBotScheduler } from './state.ts';
import { BOT_TERRITORY_RULE_VERSION } from './territory.ts';
import { BOT_WEATHER_RULE_VERSION } from './weather.ts';

export const BOT_P0_COUNT = 1_023;
export const BOT_P0_PARTICIPANTS = BOT_P0_COUNT + 1;
export const BOT_TALENT_QUOTAS: Readonly<Record<BotTalentGrade, number>> = { S: 2, A: 51, B: 205, C: 358, D: 407 };
export const BOT_TYPE_QUOTAS = { combat: 512, production: 511 } as const;
export const BOT_GENERATION_RULES_VERSION = 'BOT-NEW-SAVE-OVERLAY-P0-1.3';
export const BOT_PLAYER_RAID_PROTECTION_MS = 144 * 60 * 60_000;

const gradeCode: Readonly<Record<BotTalentGrade, number>> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
const typeCode: Readonly<Record<BotTalentKind, number>> = BOT_KIND_CODE;
const AFFINITY_TYPE: Readonly<Record<string, BotTalentKind>> = {
  HUNTER: 'combat', WARLORD: 'combat', CONTROL: 'combat', SUPPORT: 'production',
  BUILDER: 'production', TRADER: 'production', EXPLORER: 'production',
};
const MICRO = BOT_MICRO;
const SPAWN_SPACING_MM = 2_100_000;
const SITE_CLEARANCE_MM = 650_000;
const LAIR_CLEARANCE_MM = 2_500_000;
const PLAYER_CLEARANCE_MM = 2_500_000;
const CONTACT_INDEX_CELL_MM = 25_000_000;
const MAX_INITIAL_CONTACT_OPTIONS = 8;
const generatedPopulationCache = new Map<string, BotPopulationState>();

function compareAscii(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function hashFraction(fields: readonly string[]): number { return Number(hash64(fields) >> 11n) / 9_007_199_254_740_992; }
function wholeUnits(fields: readonly string[], low: number, high: number): number { return randomIntFromFields(fields, low, high).value * MICRO; }
function distanceSquared(a: CoordinateMm, b: CoordinateMm): number { const x = a.xMm - b.xMm; const y = a.yMm - b.yMm; return x * x + y * y; }
function distanceToOrigin(point: CoordinateMm, origin: CoordinateMm): number { return Math.sqrt(distanceSquared(point, origin)); }

function talentQuotasForPopulation(botCount: number): Record<BotTalentGrade, number> {
  if (botCount === BOT_P0_COUNT) return { ...BOT_TALENT_QUOTAS };
  const named: Record<BotTalentGrade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const rival of OPENING_LEVEL_RIVALS) named[rival.grade] += 1;
  const genericCount = botCount - OPENING_LEVEL_RIVALS.length;
  const weights = ['S', 'A', 'B', 'C', 'D'] as const;
  const raw = weights.map(grade => genericCount * BOT_TALENT_QUOTAS[grade] / BOT_P0_COUNT);
  const values = raw.map(Math.floor);
  let remainder = genericCount - values.reduce((sum, value) => sum + value, 0);
  const order = weights.map((grade, index) => ({ index, fraction: raw[index]! - values[index]!, grade }))
    .sort((a, b) => b.fraction - a.fraction || compareAscii(a.grade, b.grade));
  for (let index = 0; index < remainder; index += 1) values[order[index]!.index] += 1;
  return Object.fromEntries(weights.map((grade, index) => [grade, named[grade] + values[index]!])) as Record<BotTalentGrade, number>;
}

function shuffledGrades(seed: string, slots: number, populationQuotas: Readonly<Record<BotTalentGrade, number>>): BotTalentGrade[] {
  const remaining: BotTalentGrade[] = [];
  const namedCounts: Record<BotTalentGrade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const rival of OPENING_LEVEL_RIVALS) namedCounts[rival.grade] += 1;
  for (const grade of ['S', 'A', 'B', 'C', 'D'] as const) {
    const left = populationQuotas[grade] - namedCounts[grade];
    if (left < 0) throw new Error('BOT_TALENT_QUOTA_UNDERFLOW');
    for (let i = 0; i < left; i += 1) remaining.push(grade);
  }
  if (remaining.length !== slots) throw new Error('BOT_TALENT_QUOTA_TOTAL_MISMATCH');
  return remaining.map((grade, index) => ({ grade, order: hash64([seed, BOT_GENERATION_VERSION, 'talent-grade', String(index), grade]) }))
    .sort((a, b) => a.order < b.order ? -1 : a.order > b.order ? 1 : compareAscii(a.grade, b.grade))
    .map(item => item.grade);
}

function shuffledTalentKinds(seed: string, genericOrdinals: readonly number[], fixedCombat: number, fixedProduction: number, botCount: number): Map<number, BotTalentKind> {
  const spareCombat = botCount % 2 === 1 ? randomIntFromFields([seed, BOT_GENERATION_VERSION, 'talent-type-spare'], 0, 1).value : 0;
  const combatTotal = Math.floor(botCount / 2) + spareCombat;
  const combatSlots = combatTotal - fixedCombat;
  const productionSlots = botCount - combatTotal - fixedProduction;
  if (combatSlots < 0 || productionSlots < 0 || combatSlots + productionSlots !== genericOrdinals.length) throw new Error('BOT_TALENT_TYPE_QUOTA_MISMATCH');
  const shuffled = genericOrdinals.map(ordinal => ({ ordinal, order: hash64([seed, BOT_GENERATION_VERSION, 'talent-type', String(ordinal)]) }))
    .sort((a, b) => a.order < b.order ? -1 : a.order > b.order ? 1 : a.ordinal - b.ordinal);
  const assigned = new Map<number, BotTalentKind>();
  shuffled.forEach((item, index) => assigned.set(item.ordinal, index < combatSlots ? 'combat' : 'production'));
  return assigned;
}

function candidateSpawn(seed: string, ordinal: number, attempt: number, radiusMm: number): CoordinateMm {
  const angle = hashFraction([seed, BOT_GENERATION_VERSION, 'spawn-angle', String(ordinal), String(attempt)]) * Math.PI * 2;
  const radial = Math.sqrt(hashFraction([seed, BOT_GENERATION_VERSION, 'spawn-radius', String(ordinal), String(attempt)]));
  // The first 2.5 km ring is kept clear for the player's opening territory.
  const distance = 2_900_000 + radial * (radiusMm - 2_900_000);
  return { xMm: Math.round(Math.cos(angle) * distance), yMm: Math.round(Math.sin(angle) * distance), sourceZMetres: 0 };
}

function gridCell(position: CoordinateMm, cellSize: number): string {
  return `${Math.floor(position.xMm / cellSize)}:${Math.floor(position.yMm / cellSize)}`;
}

function validSpawn(candidate: CoordinateMm, accepted: ReadonlyMap<string, readonly CoordinateMm[]>, world: WorldDefinition, mapRadiusKm: number): boolean {
  if (distanceToOrigin(candidate, world.origin) < PLAYER_CLEARANCE_MM) return false;
  const radius = mapRadiusKm * 1_000_000;
  if (distanceToOrigin(candidate, world.origin) + 1_000_000 > radius) return false;
  const spacingSquared = SPAWN_SPACING_MM * SPAWN_SPACING_MM;
  const cellX = Math.floor(candidate.xMm / SPAWN_SPACING_MM);
  const cellY = Math.floor(candidate.yMm / SPAWN_SPACING_MM);
  for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
    for (const position of accepted.get(`${cellX + dx}:${cellY + dy}`) ?? []) {
      if (distanceSquared(position, candidate) < spacingSquared) return false;
    }
  }
  const siteClearanceSquared = SITE_CLEARANCE_MM * SITE_CLEARANCE_MM;
  if (world.sites.some(site => distanceSquared(site.position, candidate) < siteClearanceSquared)) return false;
  const lairClearanceSquared = LAIR_CLEARANCE_MM * LAIR_CLEARANCE_MM;
  if (world.lairs.some(lair => distanceSquared(lair.position, candidate) < lairClearanceSquared)) return false;
  return true;
}

function regionFor(position: CoordinateMm, radiusMm: number): { id: string; index: number } {
  const cells = 32;
  const x = Math.max(0, Math.min(cells - 1, Math.floor((position.xMm + radiusMm) / (radiusMm * 2) * cells)));
  const y = Math.max(0, Math.min(cells - 1, Math.floor((position.yMm + radiusMm) / (radiusMm * 2) * cells)));
  const index = y * cells + x;
  return { id: `BOT-REGION-${String(index).padStart(4, '0')}`, index };
}

function structure(seed: string, regionId: string, botId: string, position: CoordinateMm, kind: string, offset: number, level = 1): BotStructureInstance {
  return {
    id: `${botId}-BLD-${kind}`,
    blueprintId: `BP-BOT-${kind}`,
    anchor: { xMm: position.xMm + offset, yMm: position.yMm - offset, sourceZMetres: position.sourceZMetres ?? 0 },
    orientation: 0,
    footprintMm: { widthMm: kind === 'KEEP' ? 12_000 : 8_000, depthMm: kind === 'KEEP' ? 12_000 : 8_000 },
    level,
    status: 'active',
    workRequired: 0,
    workCompleted: 0,
    repairWorkRequired: 0,
    repairWorkCompleted: 0,
    damagePermille: 0,
    layoutSeed: canonicalStateHash([seed, BOT_GENERATION_VERSION, regionId, botId, kind]).slice(0, 24),
    completedAtElapsedMs: 0,
  };
}

function starterCohort(botId: string, ordinal: number, position: CoordinateMm, count: number): BotUnitCohort {
  return {
    id: `${botId}-COHORT-0001`,
    templateId: 'BOT-TROOP-SETTLER-GUARD-1.0',
    firstMemberOrdinal: ordinal * 100,
    livingCount: count,
    recruitedCount: count,
    lostCount: 0,
    level: 1,
    xp: 0,
    healthPerMember: 100,
    maxHealthPerMember: 100,
    equipmentTemplateIds: [],
    order: 'defend',
    location: position,
  };
}

function sources(seed: string, regionId: string, botId: string, position: CoordinateMm, world: WorldDefinition): BotSearchSource[] {
  const offsets = [[520_000, 0], [-510_000, 100_000], [0, 620_000], [120_000, -700_000]] as const;
  const kinds = ['field_cache', 'ruin', 'wildlife_track', 'survey_site'] as const;
  return offsets.map(([x, y], index) => {
    const localPosition = { xMm: position.xMm + x, yMm: position.yMm + y, sourceZMetres: position.sourceZMetres ?? 0 };
    const chest = index === 0 ? world.fieldChests.filter(item => item.chestType === 'field')
      .map(item => ({ item, distance: Math.sqrt(distanceSquared(item.position, position)) }))
      .filter(row => row.distance <= 12_000_000)
      .sort((a, b) => a.distance - b.distance || compareAscii(a.item.id, b.item.id))[0]?.item : undefined;
    const sourcePosition = chest?.position ?? localPosition;
    const wildlife = index === 2;
    const cellX = Math.floor(sourcePosition.xMm / CONTACT_INDEX_CELL_MM);
    const cellY = Math.floor(sourcePosition.yMm / CONTACT_INDEX_CELL_MM);
    const sharedStockId = wildlife ? `BOT-WILDLIFE-${cellX}-${cellY}` : undefined;
    const nodePosition = wildlife ? {
      xMm: cellX * CONTACT_INDEX_CELL_MM + Math.floor(CONTACT_INDEX_CELL_MM / 2),
      yMm: cellY * CONTACT_INDEX_CELL_MM + Math.floor(CONTACT_INDEX_CELL_MM / 2),
      sourceZMetres: sourcePosition.sourceZMetres,
    } : sourcePosition;
    return {
      id: `${botId}-SRC-${String(index + 1).padStart(2, '0')}`,
      kind: kinds[index]!,
      position: nodePosition,
      remainingActions: wildlife
        ? randomIntFromFields([seed, BOT_GENERATION_VERSION, sharedStockId!, 'finite-prey-stock'], 2, 5).value
        : index === 0 ? 1 : randomIntFromFields([seed, BOT_GENERATION_VERSION, regionId, botId, 'finite-search-stock', String(index)], 2, 5).value,
      eligibleBlueprintIds: ['BP-BOT-FARM', 'BP-BOT-WOOD-MILL', 'BP-BOT-QUARRY', 'BP-BOT-BARRACKS', 'BP-BOT-WATCHTOWER', 'BP-BOT-WALL', 'BP-BOT-INFIRMARY', 'BP-BOT-WORKSHOP'],
      discovered: true,
      ...(wildlife ? {
        sharedStockId,
        wildlifeDangerPermille: randomIntFromFields([seed, BOT_GENERATION_VERSION, sharedStockId!, 'wildlife-danger'], 250, 1_000).value,
      } : {}),
      ...(chest ? { fieldChestId: chest.id } : {}),
    };
  });
}

function makeColdRecord(seed: string, ordinal: number, position: CoordinateMm, regionId: string, grade: BotTalentGrade, kind: BotTalentKind, world: WorldDefinition): BotColdRecord {
  const fixed = ordinal <= OPENING_LEVEL_RIVALS.length ? OPENING_LEVEL_RIVALS[ordinal - 1] : null;
  const botId = fixed?.id ?? `BOT-P0-${String(ordinal).padStart(4, '0')}`;
  const nextUnit = randomIntFromFields([seed, BOT_GENERATION_VERSION, regionId, botId, 'opening-army'], 4, 8).value;
  const army = starterCohort(botId, ordinal, position, nextUnit);
  const searchSources = sources(seed, regionId, botId, position, world);
  return {
    botId,
    ordinal,
    name: fixed?.name ?? `Rival ${String(ordinal).padStart(4, '0')}`,
    regionId,
    position,
    oldAffinity: fixed?.affinity ?? (kind === 'combat' ? 'HUNTER' : 'BUILDER'),
    lordFate: { status: 'active', changedAtElapsedMs: null, cause: null, triggerId: null },
    casualtiesByCause: { starvation: 0, dehydration: 0, fuelExhaustion: 0, regionalBlizzard: 0, battle: 0, wildlife: 0, unattributed: 0 },
    aggressionPermille: randomIntFromFields([seed, BOT_GENERATION_VERSION, regionId, botId, 'aggression'], 550, 1_350).value,
    riskTolerancePermille: randomIntFromFields([seed, BOT_GENERATION_VERSION, regionId, botId, 'risk'], 450, 1_250).value,
    decisionPhaseMs: randomIntFromFields([seed, BOT_GENERATION_VERSION, regionId, botId, 'decision-phase'], 0, 2_999).value,
    knownTargetIds: searchSources.map(source => source.id),
    knownTargets: [],
    armyMovement: null,
    workforce: { gatherFood: 3, gatherWood: 2, gatherStone: 1, gatherOre: 1, farmers: 0, millWorkers: 0, quarryWorkers: 0, smiths: 0, builders: 2, scouts: 1, guards: 3, recruiters: 0 },
    blueprintIds: ['BP-BOT-FARM', 'BP-BOT-WOOD-MILL', 'BP-BOT-QUARRY'],
    blueprintItems: [],
    territoryLevel: 1,
    ownedChests: [],
    inventoryItems: [],
    structures: [structure(seed, regionId, botId, position, 'KEEP', 0), structure(seed, regionId, botId, position, 'HEARTH', 14_000), structure(seed, regionId, botId, position, 'STORE', -14_000)],
    cohorts: [army],
    eventInventory: [],
    searchSources,
    currentPlan: null,
    actionReceipts: [] as BotActionReceipt[],
    actionReceiptArchive: [] as string[],
    carriedCargo: { food: 0, wood: 0, stone: 0, ore: 0, firewood: 0 },
    starvationExposureMs: 0,
    coldExposureMs: 0,
    potableWaterMl: 26_000,
    localIceRemainingMl: 2_000_000,
    waterConsumptionRemainder: 0,
    dehydrationExposureMs: 0,
    lordStarvationExposureMs: 0,
    lordDehydrationExposureMs: 0,
    lordColdExposureMs: 0,
    nextActionOrdinal: 0,
    nextMemberOrdinal: ordinal * 100 + nextUnit,
    lastSafePosition: position,
  };
}

function emptyChunk(index: number, firstOrdinal: number, count: number): Omit<BotStateChunk, 'chunkSha256'> {
  const zeros = () => Array.from({ length: count }, () => 0);
  return {
    index, firstOrdinal, count,
    ids: zeros(), talentGrades: zeros(), talentKinds: zeros(), regionIndices: zeros(), alive: zeros(),
    lastIntegratedAtElapsedMs: zeros(), nextWakeAtElapsedMs: zeros(), levels: Array.from({ length: count }, () => 1), completionAtElapsedMs: zeros(), xp: zeros(),
    foodMicro: zeros(), woodMicro: zeros(), stoneMicro: zeros(), oreMicro: zeros(),
    reservedFoodMicro: zeros(), reservedWoodMicro: zeros(), reservedStoneMicro: zeros(), reservedOreMicro: zeros(),
    foodRemainder: zeros(), woodRemainder: zeros(), stoneRemainder: zeros(), oreRemainder: zeros(),
    population: zeros(), workers: zeros(), assignedWorkers: zeros(), workKind: zeros(), workProgress: zeros(), workRequired: zeros(),
    foodNodeMicro: zeros(), foodNodeRemainder: zeros(), woodNodeMicro: zeros(), woodNodeRemainder: zeros(), stoneNodeMicro: zeros(), stoneNodeRemainder: zeros(), oreNodeMicro: zeros(), oreNodeRemainder: zeros(), armySize: zeros(),
    armyHealthPermille: Array.from({ length: count }, () => 1_000), buildingCount: zeros(), farmCount: zeros(), millCount: zeros(),
    quarryCount: zeros(), barracksCount: zeros(), wallCount: zeros(), firewoodMicro: zeros(), firewoodRemainder: zeros(), foodConsumptionRemainder: zeros(), firewoodConsumptionRemainder: zeros(), firewoodNodeRemainder: zeros(),
    actionCount: zeros(), deathCount: zeros(), knownBotCount: zeros(), cold: [], rowSha256: [],
  };
}

export function generateBotPopulation(
  seed: string,
  world: WorldDefinition,
  options: { botCount?: number; mapRadiusKm?: number; profile?: 'P0_ACTIVE' | 'BENCHMARK_STRESS' } = {},
): BotPopulationState {
  if (!seed.trim()) throw new Error('BOT_GENERATION_SEED_REQUIRED');
  const botCount = options.botCount ?? BOT_P0_COUNT;
  const profile = options.profile ?? (botCount === BOT_P0_COUNT ? 'P0_ACTIVE' : 'BENCHMARK_STRESS');
  if (!Number.isSafeInteger(botCount) || profile === 'P0_ACTIVE' && botCount !== BOT_P0_COUNT
    || profile === 'BENCHMARK_STRESS' && (botCount < OPENING_LEVEL_RIVALS.length + 1 || botCount > 100_000)) throw new Error('BOT_POPULATION_SIZE_UNSUPPORTED');
  if (profile === 'P0_ACTIVE' && botCount !== BOT_P0_COUNT) throw new Error('BOT_P0_POPULATION_SIZE_INVALID');
  const mapRadiusKm = options.mapRadiusKm ?? world.activeMapRadiusKm * Math.max(1, Math.sqrt(botCount / BOT_P0_COUNT));
  if (!Number.isFinite(mapRadiusKm) || mapRadiusKm < world.activeMapRadiusKm) throw new Error('BOT_MAP_RADIUS_INVALID');
  const cacheKey = canonicalStateHash({ seed, worldId: world.id, contentVersion: world.contentVersion, lockedSourceHashes: world.lockedSourceHashes, botCount, mapRadiusKm, profile });
  const cached = generatedPopulationCache.get(cacheKey);
  if (cached) return cached;
  const p0 = OPENING_LEVEL_RIVALS;
  const quotas = talentQuotasForPopulation(botCount);
  const grades: BotTalentGrade[] = p0.map(rival => rival.grade);
  grades.push(...shuffledGrades(seed, botCount - p0.length, quotas));
  const genericOrdinals = Array.from({ length: botCount - p0.length }, (_, index) => index + p0.length + 1);
  const fixedKinds = p0.map(rival => AFFINITY_TYPE[rival.affinity]);
  const fixedCombat = fixedKinds.filter(kind => kind === 'combat').length;
  const fixedProduction = fixedKinds.filter(kind => kind === 'production').length;
  const genericKinds = shuffledTalentKinds(seed, genericOrdinals, fixedCombat, fixedProduction, botCount);
  const kinds: BotTalentKind[] = [
    ...fixedKinds,
    ...genericOrdinals.map(ordinal => genericKinds.get(ordinal)!),
  ];
  if (grades.length !== botCount || kinds.length !== botCount
    || grades.some(grade => !['S', 'A', 'B', 'C', 'D'].includes(grade))) throw new Error('BOT_GENERATION_QUOTA_INVALID');

  const radiusMm = mapRadiusKm * 1_000_000;
  const positions: CoordinateMm[] = [];
  const spawnGrid = new Map<string, CoordinateMm[]>();
  for (let ordinal = 1; ordinal <= botCount; ordinal += 1) {
    let position: CoordinateMm | null = null;
    for (let attempt = 0; attempt < 20_000; attempt += 1) {
      const candidate = candidateSpawn(seed, ordinal, attempt, radiusMm);
      if (validSpawn(candidate, spawnGrid, world, mapRadiusKm)) { position = candidate; break; }
    }
    if (!position) throw new Error(`BOT_SPAWN_SPACE_EXHAUSTED:${ordinal}`);
    positions.push(position);
    const cellX = Math.floor(position.xMm / SPAWN_SPACING_MM);
    const cellY = Math.floor(position.yMm / SPAWN_SPACING_MM);
    const key = `${cellX}:${cellY}`;
    const cell = spawnGrid.get(key) ?? [];
    cell.push(position);
    spawnGrid.set(key, cell);
  }

  const contactGrid = new Map<string, { ordinal: number; position: CoordinateMm }[]>();
  positions.forEach((position, index) => {
    const key = gridCell(position, CONTACT_INDEX_CELL_MM);
    const cell = contactGrid.get(key) ?? [];
    cell.push({ ordinal: index + 1, position });
    contactGrid.set(key, cell);
  });

  const chunks: BotStateChunk[] = [];
  const regionIds: string[] = [];
  const wildlifeStocks = new Map<string, BotSharedWildlifeStock>();
  const numChunks = Math.ceil(botCount / BOT_CHUNK_SIZE);
  for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex += 1) {
    const firstOrdinal = chunkIndex * BOT_CHUNK_SIZE + 1;
    const count = Math.min(BOT_CHUNK_SIZE, botCount - chunkIndex * BOT_CHUNK_SIZE);
    const chunk = emptyChunk(chunkIndex, firstOrdinal, count);
    const cold: BotColdRecord[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      const ordinal = firstOrdinal + offset;
      const id = ordinal;
      const grade = grades[ordinal - 1]!;
      const kind = kinds[ordinal - 1]!;
      const position = positions[ordinal - 1]!;
      const region = regionFor(position, radiusMm);
      const baseRecord = makeColdRecord(seed, ordinal, position, region.id, grade, kind, world);
      for (const source of baseRecord.searchSources) if (source.sharedStockId && source.wildlifeDangerPermille !== undefined) {
        const stock: BotSharedWildlifeStock = {
          id: source.sharedStockId,
          position: source.position,
          initialActions: source.remainingActions,
          remainingActions: source.remainingActions,
          dangerPermille: source.wildlifeDangerPermille,
        };
        const previous = wildlifeStocks.get(stock.id);
        if (previous && (previous.initialActions !== stock.initialActions || previous.dangerPermille !== stock.dangerPermille
          || previous.position.xMm !== stock.position.xMm || previous.position.yMm !== stock.position.yMm)) throw new Error(`BOT_WILDLIFE_STOCK_SEED_MISMATCH:${stock.id}`);
        wildlifeStocks.set(stock.id, stock);
      }
      const cellX = Math.floor(position.xMm / CONTACT_INDEX_CELL_MM);
      const cellY = Math.floor(position.yMm / CONTACT_INDEX_CELL_MM);
      const nearby: { ordinal: number; position: CoordinateMm; distanceSquared: number }[] = [];
      for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
        for (const other of contactGrid.get(`${cellX + dx}:${cellY + dy}`) ?? []) {
          if (other.ordinal === ordinal) continue;
          const distance = distanceSquared(other.position, position);
          if (distance <= CONTACT_INDEX_CELL_MM ** 2) nearby.push({ ...other, distanceSquared: distance });
        }
      }
      nearby.sort((a, b) => a.distanceSquared - b.distanceSquared || a.ordinal - b.ordinal);
      const contacts = nearby.slice(0, MAX_INITIAL_CONTACT_OPTIONS).map(other => {
        const targetId = other.ordinal <= 9 ? `RC-${String(other.ordinal + 1).padStart(3, '0')}` : `BOT-P0-${String(other.ordinal).padStart(4, '0')}`;
        return { id: `CONTACT-${targetId}`, kind: 'survey_site' as const, position: other.position, remainingActions: 1, eligibleBlueprintIds: [], discovered: false, contactTargetId: targetId };
      });
      const playerContact = distanceSquared(world.origin, position) <= 25_000_000 ** 2
        ? [{ id: 'CONTACT-LI_LAN', kind: 'survey_site' as const, position: world.origin, remainingActions: 1, eligibleBlueprintIds: [], discovered: false, contactTargetId: 'LI_LAN' }]
        : [];
      const record: BotColdRecord = { ...baseRecord, searchSources: [...baseRecord.searchSources, ...contacts, ...playerContact].sort((a, b) => compareAscii(a.id, b.id)) };
      const foodNode = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'food-node'], 420, 720);
      // This finite settlement woodland represents the accessible reserve across the
      // local forest's initial harvest area, rather than a single small tree stand.
      const woodNode = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'wood-node'], 3_200, 4_200);
      const stoneNode = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'stone-node'], 340, 620);
      const oreNode = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'ore-node'], 100, 240);
      const army = record.cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0);
      (chunk.ids as number[])[offset] = id;
      (chunk.talentGrades as number[])[offset] = gradeCode[grade];
      (chunk.talentKinds as number[])[offset] = typeCode[kind];
      (chunk.regionIndices as number[])[offset] = region.index;
      (chunk.alive as number[])[offset] = 1;
      (chunk.lastIntegratedAtElapsedMs as number[])[offset] = 0;
      // The initial review is the first shared three-second tick; the stable phase controls all later reviews.
      (chunk.nextWakeAtElapsedMs as number[])[offset] = 3_000;
      (chunk.completionAtElapsedMs as number[])[offset] = 0;
      (chunk.foodMicro as number[])[offset] = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'starting-food'], 140, 210);
      (chunk.woodMicro as number[])[offset] = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'starting-wood'], 170, 250);
      (chunk.stoneMicro as number[])[offset] = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'starting-stone'], 90, 145);
      (chunk.oreMicro as number[])[offset] = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'starting-ore'], 30, 58);
      (chunk.foodRemainder as number[])[offset] = 0;
      (chunk.woodRemainder as number[])[offset] = 0;
      (chunk.stoneRemainder as number[])[offset] = 0;
      (chunk.oreRemainder as number[])[offset] = 0;
      (chunk.population as number[])[offset] = 18 + (army - 5);
      (chunk.workers as number[])[offset] = 13;
      (chunk.assignedWorkers as number[])[offset] = 0;
      (chunk.foodNodeMicro as number[])[offset] = foodNode;
      (chunk.foodNodeRemainder as number[])[offset] = 0;
      (chunk.woodNodeMicro as number[])[offset] = woodNode;
      (chunk.woodNodeRemainder as number[])[offset] = 0;
      (chunk.stoneNodeMicro as number[])[offset] = stoneNode;
      (chunk.stoneNodeRemainder as number[])[offset] = 0;
      (chunk.oreNodeMicro as number[])[offset] = oreNode;
      (chunk.oreNodeRemainder as number[])[offset] = 0;
      (chunk.armySize as number[])[offset] = army;
      (chunk.buildingCount as number[])[offset] = 3;
      (chunk.firewoodMicro as number[])[offset] = wholeUnits([seed, BOT_GENERATION_VERSION, record.regionId, record.botId, 'starting-firewood'], 85, 125);
      (chunk.firewoodNodeRemainder as number[])[offset] = 0;
      (chunk.cold as BotColdRecord[]).push(record);
      regionIds.push(region.id);
    }
    const withoutHashes = { ...chunk, rowSha256: [], chunkSha256: '' } as BotStateChunk;
    const rowSha256 = Array.from({ length: count }, (_, offset) => botRowHash(withoutHashes, offset));
    const withRows = { ...withoutHashes, rowSha256 };
    chunks.push({ ...withRows, chunkSha256: botChunkHash(withRows) });
  }

  const schedulerHeap = heapifyBotScheduler(chunks.map(chunk => {
    const wake = computeBotChunkWake(chunk);
    return { atElapsedMs: wake.atElapsedMs, chunkIndex: chunk.index, botOrdinal: wake.botOrdinal };
  }));
  const rulesetSha256 = canonicalStateHash({
    generationVersion: BOT_GENERATION_VERSION,
    simulationVersion: BOT_SIMULATION_RULE_VERSION,
    plannerRuleVersion: BOT_PLANNER_RULE_VERSION,
    blueprintRulesVersion: BOT_BLUEPRINT_RULE_VERSION,
    talentRuleVersion: BOT_TALENT_RULE_VERSION,
    activityXpRuleVersion: BOT_ACTIVITY_XP_RULE_VERSION,
    talentXpRuleVersion: BOT_TALENT_XP_RULE_VERSION,
    actionReceiptArchiveVersion: BOT_ACTION_RECEIPT_ARCHIVE_VERSION,
    huntRuleVersion: BOT_HUNT_RULE_VERSION,
    repairRuleVersion: BOT_REPAIR_RULE_VERSION,
    equipmentRuleVersion: BOT_EQUIPMENT_RULE_VERSION,
    recoveryRuleVersion: BOT_RECOVERY_RULE_VERSION,
    eventRewardRuleVersion: BOT_EVENT_REWARD_RULE_VERSION,
    sharedWildlifeRuleVersion: BOT_SHARED_WILDLIFE_RULE_VERSION,
    survivalRuleVersion: BOT_SURVIVAL_RULE_VERSION,
    weatherRuleVersion: BOT_WEATHER_RULE_VERSION,
    territoryRuleVersion: BOT_TERRITORY_RULE_VERSION,
    marketRuleVersion: BOT_MARKET_RULE_VERSION,
    rulesOverlayVersion: BOT_GENERATION_RULES_VERSION,
    quotas,
    populationSize: botCount,
    mapRadiusKm,
    generationProfile: profile,
    affinities: AFFINITY_TYPE,
    chunkSize: BOT_CHUNK_SIZE,
    playerRaidProtectionMs: BOT_PLAYER_RAID_PROTECTION_MS,
  });
  const population: BotPopulationState = {
    schemaVersion: 1,
    generationProfile: profile,
    configuredMapRadiusKm: mapRadiusKm,
    talentQuotas: quotas,
    generationVersion: BOT_GENERATION_VERSION,
    rulesVersion: BOT_SIMULATION_RULE_VERSION,
    plannerRuleVersion: BOT_PLANNER_RULE_VERSION,
    blueprintRulesVersion: BOT_BLUEPRINT_RULE_VERSION,
    activityXpRuleVersion: BOT_ACTIVITY_XP_RULE_VERSION,
    talentXpRuleVersion: BOT_TALENT_XP_RULE_VERSION,
    actionReceiptArchiveVersion: BOT_ACTION_RECEIPT_ARCHIVE_VERSION,
    huntRuleVersion: BOT_HUNT_RULE_VERSION,
    repairRuleVersion: BOT_REPAIR_RULE_VERSION,
    equipmentRuleVersion: BOT_EQUIPMENT_RULE_VERSION,
    recoveryRuleVersion: BOT_RECOVERY_RULE_VERSION,
    eventRewardRuleVersion: BOT_EVENT_REWARD_RULE_VERSION,
    sharedWildlifeRuleVersion: BOT_SHARED_WILDLIFE_RULE_VERSION,
    survivalRuleVersion: BOT_SURVIVAL_RULE_VERSION,
    weatherRuleVersion: BOT_WEATHER_RULE_VERSION,
    territoryRuleVersion: BOT_TERRITORY_RULE_VERSION,
    marketRuleVersion: BOT_MARKET_RULE_VERSION,
    saveSeed: seed,
    rulesetSha256,
    totalParticipants: botCount + 1,
    botCount,
    chunkSize: BOT_CHUNK_SIZE,
    generatedAtElapsedMs: 0,
    playerRaidProtectionEndsAtElapsedMs: BOT_PLAYER_RAID_PROTECTION_MS,
    chunks,
    chunkRootSha256: botPopulationRoot(chunks),
    sharedWildlifeStocks: [...wildlifeStocks.values()].sort((a, b) => compareAscii(a.id, b.id)),
    sharedWildlifeRootSha256: '',
    schedulerHeap,
    publicRevision: 0,
    lastPublicSnapshotAtElapsedMs: 0,
    pendingBoardPublicationAtElapsedMs: [OPENING_LEVEL_OPENS_AT_MS, OPENING_LEVEL_CLOSES_AT_MS],
    boardSnapshots: [],
    eventReceipts: [],
    rewardReceipts: [],
    marketListings: [],
    marketTransactions: [],
    completedActionCount: 0,
    benchmarkCounters: { plannerExpansions: 0, integratedBotSegments: 0, dirtyChunks: 0 },
  };
  (population as { sharedWildlifeRootSha256: string }).sharedWildlifeRootSha256 = botSharedWildlifeRoot(population.sharedWildlifeStocks);
  generatedPopulationCache.set(cacheKey, population);
  while (generatedPopulationCache.size > 2) generatedPopulationCache.delete(generatedPopulationCache.keys().next().value!);
  return population;
}

export function generateBotPopulationStress(seed: string, world: WorldDefinition, botCount: 10_000 | 100_000): BotPopulationState {
  return generateBotPopulation(seed, world, { botCount, profile: 'BENCHMARK_STRESS' });
}

export function botGradeAt(chunk: BotStateChunk, offset: number): BotTalentGrade {
  return (['S', 'A', 'B', 'C', 'D'] as const)[chunk.talentGrades[offset]!]!;
}

export function botKindAt(chunk: BotStateChunk, offset: number): BotTalentKind {
  return (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!;
}
