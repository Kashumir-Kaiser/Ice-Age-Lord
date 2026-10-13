import type { BotResourceKey } from '../../../contracts/src/index.ts';

export const BOT_BLUEPRINT_RULES_VERSION = 'BOT-BLUEPRINT-OWNERSHIP-1.2';

export type BotBlueprintRule = {
  id: string;
  kind: 'farm' | 'mill' | 'quarry' | 'barracks' | 'watchtower' | 'wall' | 'infirmary' | 'workshop';
  cost: Readonly<Record<BotResourceKey, number>>;
  workerHours: number;
  prerequisites: readonly string[];
  tier: 1 | 2 | 3;
  eligibleSearchKinds: readonly ('field_cache' | 'ruin' | 'wildlife_track' | 'survey_site')[];
  production: BotResourceKey | null;
  defensePermille: number;
};

export const BOT_BLUEPRINTS: readonly BotBlueprintRule[] = [
  { id: 'BP-BOT-FARM', kind: 'farm', cost: { food: 0, wood: 55, stone: 12, ore: 0 }, workerHours: 16, prerequisites: [], tier: 1, eligibleSearchKinds: ['field_cache', 'survey_site'], production: 'food', defensePermille: 0 },
  { id: 'BP-BOT-WOOD-MILL', kind: 'mill', cost: { food: 0, wood: 70, stone: 20, ore: 0 }, workerHours: 18, prerequisites: [], tier: 1, eligibleSearchKinds: ['field_cache', 'ruin'], production: 'wood', defensePermille: 0 },
  { id: 'BP-BOT-QUARRY', kind: 'quarry', cost: { food: 0, wood: 45, stone: 35, ore: 0 }, workerHours: 18, prerequisites: [], tier: 1, eligibleSearchKinds: ['field_cache', 'ruin'], production: 'stone', defensePermille: 0 },
  { id: 'BP-BOT-BARRACKS', kind: 'barracks', cost: { food: 0, wood: 95, stone: 90, ore: 12 }, workerHours: 32, prerequisites: ['BP-BOT-FARM'], tier: 1, eligibleSearchKinds: ['ruin', 'survey_site'], production: null, defensePermille: 60 },
  { id: 'BP-BOT-WATCHTOWER', kind: 'watchtower', cost: { food: 0, wood: 65, stone: 95, ore: 8 }, workerHours: 22, prerequisites: [], tier: 1, eligibleSearchKinds: ['field_cache', 'ruin'], production: null, defensePermille: 100 },
  { id: 'BP-BOT-WALL', kind: 'wall', cost: { food: 0, wood: 20, stone: 75, ore: 0 }, workerHours: 14, prerequisites: ['BP-BOT-WATCHTOWER'], tier: 1, eligibleSearchKinds: ['ruin', 'survey_site'], production: null, defensePermille: 45 },
  { id: 'BP-BOT-INFIRMARY', kind: 'infirmary', cost: { food: 10, wood: 95, stone: 55, ore: 16 }, workerHours: 30, prerequisites: ['BP-BOT-FARM'], tier: 2, eligibleSearchKinds: ['ruin', 'survey_site'], production: null, defensePermille: 0 },
  { id: 'BP-BOT-WORKSHOP', kind: 'workshop', cost: { food: 0, wood: 110, stone: 70, ore: 35 }, workerHours: 38, prerequisites: ['BP-BOT-QUARRY', 'BP-BOT-BARRACKS'], tier: 2, eligibleSearchKinds: ['ruin', 'survey_site'], production: 'ore', defensePermille: 0 },
] as const;

export const BOT_BLUEPRINT_BY_ID = new Map(BOT_BLUEPRINTS.map(rule => [rule.id, rule]));
export function countActiveBlueprints(records: readonly { blueprintId: string; status: string }[], kind: BotBlueprintRule['kind']): number {
  const ids = new Set(BOT_BLUEPRINTS.filter(rule => rule.kind === kind).map(rule => rule.id));
  return records.filter(record => ids.has(record.blueprintId) && record.status !== 'destroyed').length;
}

export function canBuildBotBlueprint(learned: readonly string[], structures: readonly { blueprintId: string; status: string }[], id: string): boolean {
  const rule = BOT_BLUEPRINT_BY_ID.get(id);
  if (!rule || !learned.includes(id)) return false;
  if (!rule.prerequisites.every(prerequisite => learned.includes(prerequisite)
    && structures.some(structure => structure.blueprintId === prerequisite && structure.status === 'active'))) return false;
  const maxPerSettlement = rule.kind === 'wall' ? 8 : rule.kind === 'farm' || rule.kind === 'mill' || rule.kind === 'quarry' ? 6 : 2;
  return countActiveBlueprints(structures, rule.kind) < maxPerSettlement;
}

export function affordableBotBlueprint(id: string, resources: Readonly<Record<BotResourceKey, number>>): boolean {
  const rule = BOT_BLUEPRINT_BY_ID.get(id);
  if (!rule) return false;
  return (Object.keys(rule.cost) as BotResourceKey[]).every(key => resources[key] >= rule.cost[key]);
}
