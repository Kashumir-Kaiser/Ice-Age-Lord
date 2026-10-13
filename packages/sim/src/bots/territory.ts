import type { BotResourceKey } from '../../../contracts/src/index.ts';

/** Versioned bot-only progression overlay; no territory upgrade values are published as source facts. */
export const BOT_TERRITORY_RULE_VERSION = 'BOT-TERRITORY-UPGRADE-1.0';

export type BotTerritoryUpgradeRule = {
  toLevel: 2 | 3;
  cost: Readonly<Record<BotResourceKey, number>>;
  workerHours: number;
  minimumCompletedStructures: number;
  requiredBlueprintIds: readonly string[];
};

export const BOT_TERRITORY_UPGRADES: readonly BotTerritoryUpgradeRule[] = [
  { toLevel: 2, cost: { food: 0, wood: 70, stone: 60, ore: 0 }, workerHours: 24,
    minimumCompletedStructures: 3, requiredBlueprintIds: ['BP-BOT-KEEP', 'BP-BOT-HEARTH', 'BP-BOT-STORE'] },
  { toLevel: 3, cost: { food: 0, wood: 150, stone: 120, ore: 20 }, workerHours: 48,
    minimumCompletedStructures: 6, requiredBlueprintIds: ['BP-BOT-WATCHTOWER', 'BP-BOT-FARM'] },
];

export function botTerritoryUpgradeFor(level: number): BotTerritoryUpgradeRule | null {
  return BOT_TERRITORY_UPGRADES.find(rule => rule.toLevel === level + 1) ?? null;
}

/** Storage and housing are the concrete territory-level effects; combat power still comes from assets. */
export function botTerritoryCapacityPermille(level: number): number {
  return level >= 3 ? 1_500 : level === 2 ? 1_250 : 1_000;
}

export function botTerritoryHousingBonus(level: number): number {
  return Math.max(0, Math.min(2, level - 1)) * 10;
}
