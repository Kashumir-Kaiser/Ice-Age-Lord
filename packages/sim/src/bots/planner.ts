import type { BotColdRecord, BotPlanState, BotResourceKey, BotStateChunk, BotTalentGrade, BotTalentKind, BotWorkKind } from '../../../contracts/src/index.ts';
import { BOT_BLUEPRINT_BY_ID, canBuildBotBlueprint } from './blueprints.ts';
import { BOT_IRON_WEAPON_POWER } from './combat.ts';
import { BOT_MARKET_RULE_VERSION, BOT_MICRO, BOT_PLANNER_RULE_VERSION, BOT_UPKEEP_UNITS_PER_PERSON_HOUR, BOT_WATER_PREPARATION_FIREWOOD_UNITS, botCombatPermille, botConstructionPermille, decodeBotActionReceiptPage, findBotActionReceipt } from './state.ts';
import type { MutableBotHotArrays } from './state.ts';
import { BOT_MARKET_MAX_LISTINGS_PER_BOT } from './market.ts';
import { botTerritoryCapacityPermille, botTerritoryHousingBonus, botTerritoryUpgradeFor } from './territory.ts';

export { BOT_PLANNER_RULE_VERSION };
export const BOT_MAX_UTILITY_CANDIDATES = 64;
export const BOT_WORK_CODE: Readonly<Record<BotWorkKind, number>> = {
  idle: 0, gather_food: 1, gather_wood: 2, gather_stone: 3, gather_ore: 4, construct: 5,
  recruit: 6, search: 7, scout: 8, raid: 9, recover: 10, deliver: 11, repair: 12, equip: 13, hunt: 14, prepare_water: 15, learn_blueprint: 16, open_chest: 17,
  list_blueprint: 18, upgrade_territory: 19,
};
export const BOT_WORK_FROM_CODE: readonly BotWorkKind[] = ['idle', 'gather_food', 'gather_wood', 'gather_stone', 'gather_ore', 'construct', 'recruit', 'search', 'scout', 'raid', 'recover', 'deliver', 'repair', 'equip', 'hunt', 'prepare_water', 'learn_blueprint', 'open_chest', 'list_blueprint', 'upgrade_territory'];
const RESOURCE_FOR_ACTION: Readonly<Record<'gather_food' | 'gather_wood' | 'gather_stone' | 'gather_ore', BotResourceKey>> = {
  gather_food: 'food', gather_wood: 'wood', gather_stone: 'stone', gather_ore: 'ore',
};
const ACTION_FOR_RESOURCE: Readonly<Record<BotResourceKey, 'gather_food' | 'gather_wood' | 'gather_stone' | 'gather_ore'>> = {
  food: 'gather_food', wood: 'gather_wood', stone: 'gather_stone', ore: 'gather_ore',
};
const WORKER_ROLE_FOR_RESOURCE: Readonly<Record<BotResourceKey, 'gatherFood' | 'gatherWood' | 'gatherStone' | 'gatherOre'>> = {
  food: 'gatherFood', wood: 'gatherWood', stone: 'gatherStone', ore: 'gatherOre',
};
function compareId(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

export type BotDecision = {
  plan: BotPlanState;
  workCode: number;
  assignedWorkers: number;
  workRequired: number;
  reservedMicro: Record<BotResourceKey, number>;
  workforce: BotColdRecord['workforce'];
  plannerExpansions: number;
};
type Goal = { id: BotPlanState['goal']; utility: number; action: BotWorkKind; targetId: string | null; paymentResource?: 'food' | 'water'; cost: Record<BotResourceKey, number>; workHours: number };

function latestActionAt(cold: BotColdRecord, action: BotWorkKind): number {
  return findBotActionReceipt(cold, receipt => receipt.action === action)?.occurredAtElapsedMs ?? 0;
}

function recentRaidTargets(cold: BotColdRecord, at: number): Set<string> {
  const targetIds = new Set<string>();
  const cutoff = at - 24 * 60 * 60_000;
  // Action receipts are appended in simulation-time order. Walk the recent tail
  // only; older history cannot affect the one-day raid cooldown.
  for (let index = cold.actionReceipts.length - 1; index >= 0; index -= 1) {
    const receipt = cold.actionReceipts[index]!;
    if (receipt.occurredAtElapsedMs <= cutoff) break;
    if (receipt.action === 'raid' && receipt.targetId) targetIds.add(receipt.targetId);
  }
  for (let pageIndex = cold.actionReceiptArchive.length - 1; pageIndex >= 0; pageIndex -= 1) {
    const page = decodeBotActionReceiptPage(cold.actionReceiptArchive[pageIndex]!);
    if (page[page.length - 1]!.occurredAtElapsedMs <= cutoff) break;
    for (let index = page.length - 1; index >= 0; index -= 1) {
      const receipt = page[index]!;
      if (receipt.occurredAtElapsedMs <= cutoff) break;
      if (receipt.action === 'raid' && receipt.targetId) targetIds.add(receipt.targetId);
    }
  }
  return targetIds;
}

type BotPlannerRows = BotStateChunk | MutableBotHotArrays;

export function spendableBotResources(chunk: BotPlannerRows, offset: number): Record<BotResourceKey, number> {
  return {
    food: Math.floor((chunk.foodMicro[offset]! - chunk.reservedFoodMicro[offset]!) / BOT_MICRO),
    wood: Math.floor((chunk.woodMicro[offset]! - chunk.reservedWoodMicro[offset]!) / BOT_MICRO),
    stone: Math.floor((chunk.stoneMicro[offset]! - chunk.reservedStoneMicro[offset]!) / BOT_MICRO),
    ore: Math.floor((chunk.oreMicro[offset]! - chunk.reservedOreMicro[offset]!) / BOT_MICRO),
  };
}

function goalsFor(cold: BotColdRecord, chunk: BotPlannerRows, offset: number, grade: BotTalentGrade, kind: BotTalentKind, resources: Record<BotResourceKey, number>, at: number): Goal[] {
  const population = chunk.population[offset]!;
  const roster = chunk.armySize[offset]!;
  const food = chunk.foodMicro[offset]! / BOT_MICRO;
  const fuel = chunk.firewoodMicro[offset]! / BOT_MICRO;
  const foodDays = food / Math.max(0.01, population * 0.18 * 24);
  const fuelDays = fuel / Math.max(0.01, population * 0.075 * 24);
  const waterDays = cold.potableWaterMl / Math.max(1, population * 2_000);
  const goals: Goal[] = [];
  const cargoTotal = Object.values(cold.carriedCargo).reduce((sum, value) => sum + value, 0);
  const deliverable = (['food', 'wood', 'stone', 'ore', 'firewood'] as const).some(resource => {
    const balance = resource === 'firewood' ? chunk.firewoodMicro[offset]! : chunk[`${resource}Micro` as 'foodMicro' | 'woodMicro' | 'stoneMicro' | 'oreMicro'][offset]!;
    const cap = Math.floor(({ food: 1_800, wood: 1_200, stone: 900, ore: 400, firewood: 450 } as const)[resource]
      * botTerritoryCapacityPermille(cold.territoryLevel) / 1_000) * BOT_MICRO;
    return cold.carriedCargo[resource] > 0 && balance < cap;
  });
  if (cargoTotal > 0 && deliverable) goals.push({ id: 'supply', utility: 700, action: 'deliver', targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 0.5 });
  if (population > 0 && foodDays < 2.25) goals.push({ id: 'survive', utility: 1_200 - Math.floor(foodDays * 120), action: 'gather_food', targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4 });
  if (population > 0 && fuelDays < 1.75 && chunk.woodNodeMicro[offset]! > 0) goals.push({ id: 'survive', utility: 1_100 - Math.floor(fuelDays * 140), action: 'gather_wood', targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4 });
  const waterWorkforce = workforceFor('prepare_water', chunk.workers[offset]!, roster, kind, chunk, offset, cold, true).assigned;
  const waterWorkMs = Math.ceil(4 * 3_600_000 * 1_000 / Math.max(1, waterWorkforce * botConstructionPermille(grade, kind)));
  const preparationFuelNeed = BOT_WATER_PREPARATION_FIREWOOD_UNITS
    + Math.ceil(population * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.firewood * waterWorkMs / 3_600_000);
  if (population > 0 && waterDays < 3 && cold.localIceRemainingMl > 0 && fuel >= preparationFuelNeed && waterWorkforce > 0) goals.push({
    id: 'survive', utility: 1_180 - Math.floor(waterDays * 100), action: 'prepare_water', targetId: `${cold.botId}:LOCAL-ICE`,
    cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4,
  });

  const thresholds: Record<BotResourceKey, number> = { food: Math.floor(population * 0.18 * 24 * 2.25), wood: 130, stone: 100, ore: 35 };
  for (const resource of ['food', 'wood', 'stone', 'ore'] as const) {
    if (resource === 'wood' && chunk.woodNodeMicro[offset]! === 0) continue;
    const ratio = resources[resource] / Math.max(1, thresholds[resource]);
    if (ratio < 0.78) goals.push({
      id: resource === 'food' ? 'survive' : 'supply',
      utility: (resource === 'food' ? 850 : 460) + Math.floor((1 - ratio) * 240),
      action: ACTION_FOR_RESOURCE[resource], targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4,
    });
  }

  const targetArmy = Math.min(18, 6 + Math.floor(cold.aggressionPermille / 125));
  const housing = Math.max(24, 20 + chunk.barracksCount[offset]! * 10 + chunk.buildingCount[offset]! * 2 + botTerritoryHousingBonus(cold.territoryLevel));
  const recruitCost = { food: 14, wood: 4, stone: 0, ore: 8 };
  if (chunk.barracksCount[offset]! > 0 && roster < targetArmy && population < housing
    && resources.food >= recruitCost.food && resources.wood >= recruitCost.wood && resources.ore >= recruitCost.ore) {
    goals.push({ id: 'recover', utility: (kind === 'combat' ? 610 : 500) + Math.min(100, (targetArmy - roster) * 15), action: 'recruit', targetId: null, cost: recruitCost, workHours: 2 });
  }

  const buildOptions = cold.blueprintIds.map(id => BOT_BLUEPRINT_BY_ID.get(id)).filter(rule => rule
    && canBuildBotBlueprint(cold.blueprintIds, cold.structures, rule.id));
  const buildRule = buildOptions.sort((a, b) => {
    const priority = (kindId: string) => kindId === 'farm' && chunk.farmCount[offset]! < 2 ? 0
      : kindId === 'mill' && chunk.millCount[offset]! < 1 ? 1
        : kindId === 'quarry' && chunk.quarryCount[offset]! < 1 ? 2
          : kindId === 'barracks' && chunk.barracksCount[offset]! < 1 ? 3
            : kindId === 'workshop' ? 4
              : kindId === 'watchtower' && kind === 'combat' ? 5
                : kindId === 'wall' && chunk.wallCount[offset]! < 4 && kind === 'combat' ? 6 : 7;
    return priority(a.kind) - priority(b.kind) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  })[0];
  if (buildRule) {
    const shortage = (Object.keys(buildRule.cost) as BotResourceKey[]).reduce((sum, resource) => sum + Math.max(0, buildRule.cost[resource] - resources[resource]), 0);
    const buildUtility = (kind === 'production' ? 580 : 510) + (buildRule.kind === 'farm' ? 30 : 0) - Math.min(140, shortage);
    if (shortage === 0) goals.push({ id: 'expand', utility: buildUtility, action: 'construct', targetId: buildRule.id, cost: { ...buildRule.cost }, workHours: buildRule.workerHours });
    else {
      const needed = (Object.keys(buildRule.cost) as BotResourceKey[])
        .map(resource => ({ resource, shortage: buildRule.cost[resource] - resources[resource] }))
        .filter(row => row.shortage > 0 && (row.resource !== 'wood' || chunk.woodNodeMicro[offset]! > 0))
        .sort((a, b) => b.shortage - a.shortage || (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0))[0];
      if (needed) goals.push({ id: 'supply', utility: buildUtility + 30, action: ACTION_FOR_RESOURCE[needed.resource], targetId: buildRule.id, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4 });
    }
  }

  const learnable = cold.blueprintItems.filter(item => item.status === 'owned' && !cold.blueprintIds.includes(item.blueprintId))
    .map(item => ({ item, rule: BOT_BLUEPRINT_BY_ID.get(item.blueprintId) }))
    .filter((row): row is { item: (typeof cold.blueprintItems)[number]; rule: NonNullable<typeof row.rule> } => Boolean(row.rule)
      && row.rule!.prerequisites.every(id => cold.blueprintIds.includes(id)
        && cold.structures.some(structure => structure.blueprintId === id && structure.status === 'active')))
    .sort((a, b) => {
      const priority = (rule: NonNullable<typeof a.rule>) => rule.kind === 'farm' && chunk.farmCount[offset]! < 2 ? 0
        : rule.kind === 'watchtower' && kind === 'combat' ? 1
          : rule.kind === 'mill' && chunk.millCount[offset]! < 1 ? 2
            : rule.kind === 'quarry' && chunk.quarryCount[offset]! < 1 ? 3
              : rule.kind === 'barracks' && chunk.barracksCount[offset]! < 1 ? 4
                : rule.kind === 'wall' && chunk.wallCount[offset]! < 4 ? 5 : 6;
      return priority(a.rule) - priority(b.rule) || compareId(a.item.instanceId, b.item.instanceId);
    })[0];
  if (learnable) {
    const learningUtility = learnable.rule.kind === 'watchtower' && kind === 'combat' ? 680
      : learnable.rule.kind === 'farm' && chunk.farmCount[offset]! < 2 ? 660
        : learnable.rule.kind === 'mill' && chunk.millCount[offset]! < 1 ? 590
          : learnable.rule.kind === 'quarry' && chunk.quarryCount[offset]! < 1 ? 570 : 430;
    goals.push({ id: 'discover', utility: learningUtility, action: 'learn_blueprint', targetId: learnable.item.instanceId,
      cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 0.5 });
  }

  const unopenedChest = cold.ownedChests.filter(chest => chest.status === 'owned')
    .slice().sort((a, b) => a.acquiredAtElapsedMs - b.acquiredAtElapsedMs || compareId(a.chestId, b.chestId))[0];
  if (unopenedChest) goals.push({ id: 'discover', utility: 520, action: 'open_chest', targetId: unopenedChest.chestId,
    cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 0.25 });

  const upgrade = botTerritoryUpgradeFor(cold.territoryLevel);
  if (upgrade) {
    const completedStructures = cold.structures.filter(item => item.status === 'active' || item.status === 'damaged');
    const prerequisitesMet = completedStructures.length >= upgrade.minimumCompletedStructures
      && upgrade.requiredBlueprintIds.every(id => cold.structures.some(item => item.blueprintId === id && item.status === 'active'));
    if (prerequisitesMet) {
      const shortage = (Object.keys(upgrade.cost) as BotResourceKey[]).reduce((sum, resource) => sum + Math.max(0, upgrade.cost[resource] - resources[resource]), 0);
      const upgradeUtility = (kind === 'production' ? 610 : 540) + cold.territoryLevel * 20 - Math.min(120, shortage);
      if (shortage === 0) goals.push({ id: 'expand', utility: upgradeUtility, action: 'upgrade_territory', targetId: `${cold.botId}:TERRITORY:${upgrade.toLevel}`,
        cost: { ...upgrade.cost }, workHours: upgrade.workerHours });
      else {
        const needed = (Object.keys(upgrade.cost) as BotResourceKey[])
          .map(resource => ({ resource, shortage: upgrade.cost[resource] - resources[resource] }))
          .filter(row => row.shortage > 0 && (row.resource !== 'wood' || chunk.woodNodeMicro[offset]! > 0))
          .sort((a, b) => b.shortage - a.shortage || compareId(a.resource, b.resource))[0];
        if (needed) goals.push({ id: 'supply', utility: upgradeUtility + 25, action: ACTION_FOR_RESOURCE[needed.resource],
          targetId: `${cold.botId}:TERRITORY:${upgrade.toLevel}`, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4 });
      }
    }
  }

  const foodCritical = foodDays < 1.1;
  const waterCritical = waterDays < 1.1;
  const activeListings = cold.blueprintItems.filter(item => item.status === 'escrowed').length;
  if ((foodCritical || waterCritical) && activeListings < BOT_MARKET_MAX_LISTINGS_PER_BOT) {
    const paymentResource = foodCritical && (!waterCritical || foodDays <= waterDays) ? 'food' : 'water';
    const sellable = cold.blueprintItems.filter(item => item.status === 'owned')
      .map(item => ({ item, rule: BOT_BLUEPRINT_BY_ID.get(item.blueprintId) }))
      .filter((row): row is { item: (typeof cold.blueprintItems)[number]; rule: NonNullable<typeof row.rule> } => Boolean(row.rule))
      .filter(({ item, rule }) => {
        const duplicate = cold.blueprintIds.includes(item.blueprintId);
        const reachableDefense = rule.kind === 'watchtower' && cold.structures.some(structure => structure.status === 'active')
          && cold.knownTargets.length > 0;
        return duplicate || !reachableDefense;
      })
      .sort((a, b) => {
        const duplicateRank = Number(cold.blueprintIds.includes(b.item.blueprintId)) - Number(cold.blueprintIds.includes(a.item.blueprintId));
        return duplicateRank || a.rule.tier - b.rule.tier || compareId(a.item.instanceId, b.item.instanceId);
      })[0];
    if (sellable) goals.push({ id: 'survive', utility: 1_320 + Math.floor(Math.max(0, 1.1 - Math.min(foodDays, waterDays)) * 60),
      action: 'list_blueprint', targetId: sellable.item.instanceId, cost: { food: 0, wood: 0, stone: 0, ore: 0 },
      paymentResource, workHours: 0.25 });
  }

  const sources = cold.searchSources.filter(source => source.discovered && source.remainingActions > 0)
    .slice().sort((a, b) => a.remainingActions - b.remainingActions || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const availableScouts = workforceFor('scout', chunk.workers[offset]!, roster, kind, chunk, offset, cold).workforce.scouts;
  const searchSource = sources.find(source => source.eligibleBlueprintIds.some(id => !cold.blueprintIds.includes(id)
    && !cold.blueprintItems.some(item => item.blueprintId === id && item.status !== 'sold')));
  if (searchSource && resources.food >= 3 && availableScouts > 0) goals.push({
    id: 'discover', utility: 420 + (kind === 'production' ? 20 : 0) + Math.min(40, cold.blueprintIds.length * 2)
      + Math.min(260, Math.max(0, Math.floor((at - latestActionAt(cold, 'search')) / (12 * 60 * 60_000)) * 90)),
    action: 'search', targetId: searchSource.id, cost: { food: 3, wood: 0, stone: 0, ore: 0 },
    workHours: 3 + Math.ceil(Math.hypot(searchSource.position.xMm - cold.position.xMm, searchSource.position.yMm - cold.position.yMm) / 3_500_000 * 10) / 10,
  });

  const contactSource = cold.searchSources.filter(source => !source.discovered && source.remainingActions > 0 && source.contactTargetId)
    .slice().sort((a, b) => {
      const da = Math.hypot(a.position.xMm - cold.position.xMm, a.position.yMm - cold.position.yMm);
      const db = Math.hypot(b.position.xMm - cold.position.xMm, b.position.yMm - cold.position.yMm);
      return da - db || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    })[0];
  if (contactSource && resources.food >= 3 && availableScouts > 0) {
    const distanceMm = Math.hypot(contactSource.position.xMm - cold.position.xMm, contactSource.position.yMm - cold.position.yMm);
    const scoutingPriority = cold.knownTargets.length === 0 ? 680 : 515;
    goals.push({ id: 'scout', utility: scoutingPriority + (kind === 'combat' ? 25 : 0) + Math.min(60, Math.floor(cold.riskTolerancePermille / 16)),
      action: 'scout', targetId: contactSource.id, cost: { food: 3, wood: 0, stone: 0, ore: 0 },
      workHours: Math.max(0.5, Math.ceil(distanceMm / 3_500_000 * 10) / 10 + 0.5) });
  }

  const knownRivals = cold.knownTargets.filter(target => (target.kind === 'bot' || target.kind === 'player')
      && (target.kind === 'bot' || at >= 144 * 60 * 60_000))
    .slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (knownRivals.length > 0 && roster > 4 && kind === 'combat' && cold.riskTolerancePermille > 700) {
    const recentTargetIds = recentRaidTargets(cold, at);
    const target = knownRivals.find(candidate => candidate.id !== cold.botId && !recentTargetIds.has(candidate.id));
    if (target) {
      const distanceMm = Math.hypot(target.position.xMm - cold.position.xMm, target.position.yMm - cold.position.yMm);
      goals.push({ id: 'contest', utility: Math.min(720, 630 + Math.floor(cold.aggressionPermille / 20)), action: 'raid', targetId: target.id,
        cost: { food: 4, wood: 0, stone: 0, ore: 0 }, workHours: Math.max(2, Math.ceil(distanceMm / 3_500_000 * 10) / 10 + 2) });
    }
  }
  if (chunk.armyHealthPermille[offset]! < 1_000 && roster > 0 && resources.food >= 6) {
    goals.push({ id: 'recover', utility: 650 + Math.floor((1_000 - chunk.armyHealthPermille[offset]!) / 4), action: 'recover', targetId: null, cost: { food: 6, wood: 0, stone: 0, ore: 0 }, workHours: 4 });
  }
  const damagedStructure = cold.structures.filter(item => item.status === 'damaged' && item.damagePermille > 0)
    .slice().sort((a, b) => b.damagePermille - a.damagePermille || compareId(a.id, b.id))[0];
  if (damagedStructure) {
    const repairUnits = Math.max(1, Math.ceil(damagedStructure.damagePermille / 250));
    const cost = { food: 0, wood: repairUnits * 2, stone: repairUnits, ore: 0 };
    const remainingRepairWorkMs = damagedStructure.repairWorkRequired > 0
      ? Math.max(1, damagedStructure.repairWorkRequired - damagedStructure.repairWorkCompleted)
      : repairUnits * 2 * 3_600_000;
    const repairWorkers = workforceFor('repair', chunk.workers[offset]!, roster, kind, chunk, offset, cold).workforce.builders;
    if (repairWorkers > 0 && resources.wood >= cost.wood && resources.stone >= cost.stone) goals.push({ id: 'recover', utility: 650 + Math.floor(damagedStructure.damagePermille / 10), action: 'repair', targetId: damagedStructure.id, cost, workHours: remainingRepairWorkMs / 3_600_000 });
  }
  const workshop = cold.structures.some(item => item.blueprintId === 'BP-BOT-WORKSHOP' && item.status === 'active');
  if (workshop) {
    const unarmed = cold.cohorts.filter(cohort => cohort.livingCount > 0 && !cohort.equipmentTemplateIds.includes('BOT-WEAPON-IRON-1.0'))
      .slice().sort((a, b) => b.livingCount - a.livingCount || compareId(a.id, b.id))[0];
    if (unarmed) {
      const equipmentCost = Math.max(2, unarmed.livingCount);
      const smiths = workforceFor('equip', chunk.workers[offset]!, roster, kind, chunk, offset, cold).workforce.smiths;
      if (smiths > 0 && resources.wood >= equipmentCost && resources.ore >= equipmentCost) goals.push({
        id: 'recover', utility: (kind === 'combat' ? 660 : 515) + Math.min(60, unarmed.livingCount * 3), action: 'equip', targetId: unarmed.id,
        cost: { food: 0, wood: equipmentCost, stone: 0, ore: equipmentCost }, workHours: Math.max(1, unarmed.livingCount / 2),
      });
    }
  }
  const prey = cold.searchSources.filter(source => source.kind === 'wildlife_track' && source.discovered && source.remainingActions > 0)
    .slice().sort((a, b) => compareId(a.id, b.id))[0];
  if (prey && roster > 0 && workforceFor('hunt', chunk.workers[offset]!, roster, kind, chunk, offset, cold).workforce.scouts > 0) {
    const distanceMm = Math.hypot(prey.position.xMm - cold.position.xMm, prey.position.yMm - cold.position.yMm);
    const danger = prey.wildlifeDangerPermille ?? 500;
    const hoursSinceHunt = (at - latestActionAt(cold, 'hunt')) / 3_600_000;
    const huntDueBoost = hoursSinceHunt >= 8 ? Math.min(240, 120 + Math.floor((hoursSinceHunt - 8) / 8) * 60) : 0;
    const foodUtility = (foodDays < 2.25 ? 950 - Math.floor(foodDays * 80)
      : foodDays < 5 ? 640 : 330) + huntDueBoost;
    goals.push({ id: 'supply', utility: foodUtility + (kind === 'combat' ? 25 : 0) - Math.floor(danger / 8), action: 'hunt', targetId: prey.id,
      cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 2 + Math.ceil(distanceMm / 3_500_000 * 2) + danger / 1_000 });
  }
  if (chunk.workers[offset] === 0 && roster === 0) goals.push({ id: 'survive', utility: 2_000, action: 'recover', targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 6 });
  return goals;
}

/** Selects the highest-utility candidate; shortage goals are generated explicitly in goalsFor. */
function selectUtilityGoal(goals: readonly Goal[]): { selected: Goal; expansions: number } {
  const fallback: Goal = { id: 'survive', utility: 1, action: 'gather_food', targetId: null, cost: { food: 0, wood: 0, stone: 0, ore: 0 }, workHours: 4 };
  if (goals.length === 0) return { selected: fallback, expansions: 0 };
  const ordered = goals.slice().sort((a, b) => b.utility - a.utility || (a.action < b.action ? -1 : a.action > b.action ? 1 : 0) || compareId(a.targetId ?? '', b.targetId ?? ''));
  const candidates = ordered.slice(0, BOT_MAX_UTILITY_CANDIDATES);
  return { selected: candidates[0]!, expansions: candidates.length };
}

function workforceFor(action: BotWorkKind, workers: number, army: number, kind: BotTalentKind, chunk: BotPlannerRows, offset: number, cold: BotColdRecord, emergency = false): { assigned: number; workforce: BotColdRecord['workforce'] } {
  const guards = emergency ? Math.min(workers, army > 0 ? 1 : 0) : Math.min(workers, Math.max(1, Math.min(4, Math.ceil(army / 3))));
  let remaining = Math.max(0, workers - guards);
  const workforce: BotColdRecord['workforce'] = { gatherFood: 0, gatherWood: 0, gatherStone: 0, gatherOre: 0, farmers: 0, millWorkers: 0, quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards, recruiters: 0 };
  if (!emergency) {
    workforce.farmers = Math.min(remaining, chunk.farmCount[offset]!);
    remaining -= workforce.farmers;
    workforce.millWorkers = Math.min(remaining, chunk.millCount[offset]!);
    remaining -= workforce.millWorkers;
    workforce.quarryWorkers = Math.min(remaining, chunk.quarryCount[offset]!);
    remaining -= workforce.quarryWorkers;
    const workshops = cold.structures.filter(item => item.blueprintId === 'BP-BOT-WORKSHOP' && item.status === 'active').length;
    workforce.smiths = Math.min(remaining, workshops);
    remaining -= workforce.smiths;
  }
  if (action.startsWith('gather_')) {
    const resource = RESOURCE_FOR_ACTION[action as keyof typeof RESOURCE_FOR_ACTION];
    workforce[WORKER_ROLE_FOR_RESOURCE[resource]] = remaining;
    return { assigned: remaining, workforce };
  }
  if (action === 'construct') workforce.builders = Math.min(remaining, Math.max(1, Math.min(6, Math.ceil(workers / 3))));
  else if (action === 'repair') workforce.builders = Math.min(remaining, Math.max(1, Math.min(4, Math.ceil(workers / 4))));
  else if (action === 'prepare_water') workforce.builders = Math.min(remaining, Math.max(1, Math.min(2, remaining)));
  else if (action === 'learn_blueprint') workforce.builders = Math.min(remaining, 1);
  else if (action === 'open_chest' || action === 'list_blueprint') workforce.builders = Math.min(remaining, 1);
  else if (action === 'upgrade_territory') workforce.builders = Math.min(remaining, Math.max(1, Math.min(6, Math.ceil(workers / 3))));
  else if (action === 'equip') {
    const maxSmiths = Math.min(3, cold.structures.filter(item => item.blueprintId === 'BP-BOT-WORKSHOP' && item.status === 'active').length);
    const extraSmiths = Math.min(remaining, Math.max(0, maxSmiths - workforce.smiths));
    workforce.smiths += extraSmiths;
    remaining -= extraSmiths;
  }
  else if (action === 'recruit') workforce.recruiters = Math.min(remaining, 2);
  else if (action === 'deliver') workforce.builders = Math.min(remaining, 1);
  else if (action === 'search' || action === 'scout' || action === 'raid' || action === 'hunt') workforce.scouts = Math.min(remaining, Math.max(1, Math.ceil(workers / 4)));
  else if (action === 'recover') workforce.builders = Math.min(remaining, 1);
  remaining -= workforce.builders + workforce.recruiters + workforce.scouts;
  const priority: BotResourceKey[] = kind === 'production' ? ['food', 'wood', 'stone', 'ore'] : ['food', 'stone', 'wood', 'ore'];
  for (let index = 0; index < remaining; index += 1) workforce[WORKER_ROLE_FOR_RESOURCE[priority[index % priority.length]!]] += 1;
  return { assigned: workforce.builders || workforce.recruiters || workforce.scouts || workforce.smiths || guards, workforce };
}

export function chooseBotDecision(cold: BotColdRecord, chunk: BotPlannerRows, offset: number, grade: BotTalentGrade, kind: BotTalentKind, at: number): BotDecision {
  const goals = goalsFor(cold, chunk, offset, grade, kind, spendableBotResources(chunk, offset), at);
  const result = selectUtilityGoal(goals);
  const chosen = result.selected;
  const ordinal = cold.nextActionOrdinal + 1;
  const actionId = `${cold.botId}:ACT:${String(ordinal).padStart(8, '0')}`;
  const currentPopulation = chunk.population[offset]!;
  const emergency = chosen.action === 'prepare_water' || chosen.action === 'list_blueprint'
    || chosen.action === 'gather_food' && chunk.foodMicro[offset]! / BOT_MICRO / Math.max(0.01, currentPopulation * 0.18 * 24) < 2.25
    || chosen.action === 'gather_wood' && chunk.firewoodMicro[offset]! / BOT_MICRO / Math.max(0.01, currentPopulation * 0.075 * 24) < 1.75;
  const assignment = workforceFor(chosen.action, chunk.workers[offset]!, chunk.armySize[offset]!, kind, chunk, offset, cold, emergency);
  const blueprint = chosen.action === 'construct' ? BOT_BLUEPRINT_BY_ID.get(chosen.targetId ?? '') : null;
  const workHours = blueprint?.workerHours ?? chosen.workHours;
  const workerWork = chosen.action === 'construct' ? assignment.workforce.builders
    : chosen.action === 'recruit' ? assignment.workforce.recruiters
      : chosen.action === 'deliver' ? assignment.workforce.builders
      : ['search', 'scout', 'raid', 'hunt'].includes(chosen.action) ? assignment.workforce.scouts
        : chosen.action === 'equip' ? assignment.workforce.smiths
        : ['construct', 'repair', 'prepare_water', 'learn_blueprint', 'open_chest', 'list_blueprint', 'upgrade_territory'].includes(chosen.action) ? assignment.workforce.builders : assignment.assigned;
  const constructionPermille = botConstructionPermille(grade, kind);
  const workRequired = chosen.action === 'construct' ? Math.max(1, Math.round(workHours * 3_600_000)) : Math.max(1, Math.round(workHours * 3_600_000));
  const duration = ['construct', 'repair', 'equip', 'prepare_water', 'learn_blueprint', 'open_chest', 'list_blueprint', 'upgrade_territory'].includes(chosen.action)
    ? Math.ceil(workRequired * 1_000 / Math.max(1, workerWork * constructionPermille))
    : workRequired;
  const completesAtElapsedMs = at + Math.max(1_000, duration);
  const reserved = { ...chosen.cost };
  const expectedOutcome = chosen.action === 'construct' ? `complete ${chosen.targetId}`
    : chosen.action === 'search' ? `search finite source ${chosen.targetId}`
      : chosen.action === 'hunt' ? `hunt finite wildlife source ${chosen.targetId}`
      : chosen.action === 'repair' ? `repair damaged structure ${chosen.targetId}`
      : chosen.action === 'equip' ? `forge and equip ${chosen.targetId}`
      : chosen.action === 'recruit' ? 'recruit trained defenders'
        : chosen.action === 'deliver' ? 'deliver carried raid cargo into available stores'
      : chosen.action === 'prepare_water' ? 'melt and purify finite local ice using firewood and worker time'
        : chosen.action === 'learn_blueprint' ? `consume owned blueprint item ${chosen.targetId} to unlock construction`
          : chosen.action === 'open_chest' ? `open owned finite chest ${chosen.targetId} using its committed loot table`
        : chosen.action === 'list_blueprint' ? `escrow owned blueprint ${chosen.targetId} for a finite food or water barter listing under ${BOT_MARKET_RULE_VERSION}`
          : chosen.action === 'upgrade_territory' ? `upgrade territory using the compiled next-level costs, prerequisites, and work`
        : chosen.action.startsWith('gather_') ? `replenish ${RESOURCE_FOR_ACTION[chosen.action as keyof typeof RESOURCE_FOR_ACTION]}` : chosen.action;
  return {
    plan: { goal: chosen.id, action: chosen.action, actionId, startedAtElapsedMs: at, completesAtElapsedMs, targetId: chosen.targetId,
      ...(chosen.paymentResource ? { marketPaymentResource: chosen.paymentResource } : {}), workersAssigned: workerWork, reserved,
      startingResourcesMicro: { food: chunk.foodMicro[offset]!, wood: chunk.woodMicro[offset]!, stone: chunk.stoneMicro[offset]!, ore: chunk.oreMicro[offset]! }, expectedOutcome },
    workCode: BOT_WORK_CODE[chosen.action],
    assignedWorkers: workerWork,
    workRequired,
    reservedMicro: { food: reserved.food * BOT_MICRO, wood: reserved.wood * BOT_MICRO, stone: reserved.stone * BOT_MICRO, ore: reserved.ore * BOT_MICRO },
    workforce: assignment.workforce,
    plannerExpansions: result.expansions,
  };
}

export function estimateBotCombatBasePower(chunk: BotStateChunk, offset: number): number {
  return chunk.cold[offset]!.cohorts.reduce((sum, cohort) => sum + cohort.livingCount * (25 + cohort.level * 8
    + (cohort.equipmentTemplateIds.includes('BOT-WEAPON-IRON-1.0') ? BOT_IRON_WEAPON_POWER : 0))
    * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0);
}

export function estimateBotCombatPower(chunk: BotStateChunk, offset: number, grade: BotTalentGrade, kind: BotTalentKind): number {
  return Math.floor(estimateBotCombatBasePower(chunk, offset) * botCombatPermille(grade, kind) / 1_000);
}
