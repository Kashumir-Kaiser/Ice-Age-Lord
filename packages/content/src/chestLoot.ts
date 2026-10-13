import type { FieldChest } from '../../contracts/src/index.ts';

export const LEGACY_CHEST_LOOT_RULE_VERSION = 'LL01-CHEST-POOL-RARITY-TYPE-1.0' as const;
export const CHEST_LOOT_RULE_VERSION = 'LL01-CHEST-POOL-RARITY-TYPE-1.1' as const;

export type LootEntry = {
  templateId: string;
  weightPermille: number;
  minimumQuantity: number;
  maximumQuantity: number;
  eventId: string | null;
};

export type LootTable = {
  chestType: FieldChest['chestType'];
  rarity: FieldChest['grade'];
  eventId: string | null;
  ruleVersion: string;
  rollCount: number;
  selection: 'with_replacement';
  entries: readonly LootEntry[];
};

function fieldTable(rarity: FieldChest['grade'], rollCount: number, entries: readonly LootEntry[]): LootTable {
  return { chestType: 'field', rarity, eventId: null, ruleVersion: CHEST_LOOT_RULE_VERSION, rollCount, selection: 'with_replacement', entries };
}

const ordinary = (templateId: string, weightPermille: number, minimumQuantity = 1, maximumQuantity = 1): LootEntry => ({
  templateId, weightPermille, minimumQuantity, maximumQuantity, eventId: null,
});

// Bot construction blueprints are physical loot items in the same field chest
// tables used by player chests.  Bots therefore learn them from the persisted
// chest outcome rather than from a second, bot-only search roll.
const BOT_BLUEPRINT_LOOT = [
  'BP-BOT-FARM', 'BP-BOT-WOOD-MILL', 'BP-BOT-QUARRY', 'BP-BOT-BARRACKS',
  'BP-BOT-WATCHTOWER', 'BP-BOT-WALL', 'BP-BOT-INFIRMARY', 'BP-BOT-WORKSHOP',
] as const;

function fieldEntries(entries: readonly LootEntry[], blueprintWeightEach: number): LootEntry[] {
  const blueprintWeight = blueprintWeightEach * BOT_BLUEPRINT_LOOT.length;
  const baseWeight = 1_000 - blueprintWeight;
  const originalWeight = entries.reduce((sum, entry) => sum + entry.weightPermille, 0);
  let remaining = baseWeight;
  const scaled = entries.map((entry, index) => {
    const weight = index === entries.length - 1
      ? remaining
      : Math.floor(entry.weightPermille * baseWeight / originalWeight);
    remaining -= weight;
    return { ...entry, weightPermille: weight };
  });
  return [...scaled, ...BOT_BLUEPRINT_LOOT.map(id => ordinary(id, blueprintWeightEach))];
}

const FIELD_TABLES: Readonly<Record<FieldChest['grade'], LootTable>> = {
  'Mộc': fieldTable('Mộc', 1, fieldEntries([ordinary('WOOD', 500, 1, 2), ordinary('STONE', 300, 1, 2), ordinary('WILD-FOOD', 200)], 2)),
  'Thanh Đồng': fieldTable('Thanh Đồng', 1, fieldEntries([ordinary('WOOD', 300, 1, 3), ordinary('STONE', 300, 1, 3), ordinary('WILD-FOOD', 200, 1, 2), ordinary('RAW-SALT', 200)], 3)),
  'Bạch Ngân': fieldTable('Bạch Ngân', 2, fieldEntries([ordinary('STONE', 250, 1, 3), ordinary('RAW-SALT', 250, 1, 2), ordinary('BROWN-COAL', 250, 1, 2), ordinary('RAW-ICE-WATER', 150, 1, 2), ordinary('WILD-FOOD', 100, 1, 2)], 5)),
  'Hoàng Kim': fieldTable('Hoàng Kim', 2, fieldEntries([ordinary('RAW-SALT', 250, 1, 3), ordinary('BROWN-COAL', 250, 1, 3), ordinary('RAW-ICE-WATER', 200, 1, 3), ordinary('WILD-FOOD', 200, 1, 3), ordinary('STONE', 100, 2, 4)], 7)),
  'Hạo Nguyệt': fieldTable('Hạo Nguyệt', 3, fieldEntries([ordinary('RAW-SALT', 250, 2, 4), ordinary('BROWN-COAL', 250, 2, 4), ordinary('RAW-ICE-WATER', 200, 2, 4), ordinary('WILD-FOOD', 200, 2, 4), ordinary('STONE', 100, 3, 5)], 9)),
};

const EVENT_IDS = [
  'EV02-DRAGON-REVIVAL', 'EV03-ICE-HORN', 'EV04-FIRST-MERGE-DRAGON-POINTS', 'EV05-ANNO-FISHING',
  'EV06-CONSTRUCTION-WEEK', 'EV07-KINGDOM-WRATH', 'EV08-WORLD-BOSS', 'EV09-ORACLE-WAR',
  'EV10-MONSTER-SIEGE', 'EV11-MIST-DISASTER', 'EV12-LEGION-RACE', 'EV13-BLOOD-CHAOS',
  'EV14-DREAM-SHARD', 'EV15-SKORK-RAT', 'EV16-GIANT-CITY', 'EV17-NORTH-UNIFICATION',
  'EV18-LIGHT-GOD-FINAL', 'EV19-ICE-SNOW-CHOICE', 'EV20-DEEP-SEA-ARK', 'EV21-WEST-CHURCH-WAR',
  'EV22-ANCIENT-DRAGON-P1', 'EV23-ANCIENT-DRAGON-P2', 'EV24-DRAGON-FESTIVAL',
  'EV25-ABYSS-EXPEDITION', 'EV26-GODS-CHAOS', 'EV27-WORLD-PROTECTOR', 'EV28-ANCIENT-DRAGON-HUNT',
  'EV29-FINAL-CALAMITY',
] as const;

const EVENT_TABLES: Readonly<Record<string, LootTable>> = Object.fromEntries(EVENT_IDS.map(eventId => [eventId, {
  chestType: 'event' as const,
  rarity: 'Mộc' as const,
  eventId,
  ruleVersion: CHEST_LOOT_RULE_VERSION,
  rollCount: 1,
  selection: 'with_replacement' as const,
  entries: [
    { templateId: `EVENT-RELIC-${eventId}`, weightPermille: 700, minimumQuantity: 1, maximumQuantity: 1, eventId },
    { templateId: `EVENT-MARK-${eventId}`, weightPermille: 300, minimumQuantity: 1, maximumQuantity: 1, eventId },
  ],
}]));

const EVENT_RARITY_RULES: Readonly<Record<FieldChest['grade'], { rollCount: number; relicWeight: number }>> = {
  'Mộc': { rollCount: 1, relicWeight: 500 },
  'Thanh Đồng': { rollCount: 1, relicWeight: 650 },
  'Bạch Ngân': { rollCount: 2, relicWeight: 750 },
  'Hoàng Kim': { rollCount: 2, relicWeight: 850 },
  'Hạo Nguyệt': { rollCount: 3, relicWeight: 950 },
};

export function lootTableForChest(chest: Pick<FieldChest, 'chestType' | 'grade' | 'eventId'>): LootTable {
  if (chest.chestType === 'field' && chest.eventId === null) return FIELD_TABLES[chest.grade];
  if (chest.chestType === 'event' && chest.eventId && EVENT_TABLES[chest.eventId]) {
    const eventTable = EVENT_TABLES[chest.eventId]!;
    const rarityRule = EVENT_RARITY_RULES[chest.grade];
    return {
      ...eventTable,
      rarity: chest.grade,
      rollCount: rarityRule.rollCount,
      entries: [
        { ...eventTable.entries[0]!, weightPermille: rarityRule.relicWeight },
        { ...eventTable.entries[1]!, weightPermille: 1_000 - rarityRule.relicWeight },
      ],
    };
  }
  throw new Error('CHEST_LOOT_TABLE_NOT_COMPILED');
}

export function chestLootOdds(table: LootTable): readonly { templateId: string; perRollPermille: number; chanceAtLeastOncePermille: number }[] {
  const weights = new Map<string, number>();
  for (const entry of table.entries) weights.set(entry.templateId, (weights.get(entry.templateId) ?? 0) + entry.weightPermille);
  return [...weights].map(([templateId, perRollPermille]) => ({
    templateId,
    perRollPermille,
    chanceAtLeastOncePermille: Math.round((1 - Math.pow(1 - perRollPermille / 1_000, table.rollCount)) * 1_000),
  }));
}

export function assertChestLootTables(chests: readonly FieldChest[]): void {
  for (const chest of chests) {
    const table = lootTableForChest(chest);
    if (table.ruleVersion !== CHEST_LOOT_RULE_VERSION || table.selection !== 'with_replacement'
      || !Number.isSafeInteger(table.rollCount) || table.rollCount < 1 || table.rollCount > 10
      || table.entries.length === 0 || table.entries.some(entry => !entry.templateId
        || !Number.isSafeInteger(entry.weightPermille) || entry.weightPermille <= 0
        || !Number.isSafeInteger(entry.minimumQuantity) || entry.minimumQuantity < 1
        || !Number.isSafeInteger(entry.maximumQuantity) || entry.maximumQuantity < entry.minimumQuantity)) {
      throw new Error(`CHEST_LOOT_TABLE_INVALID: ${chest.id}`);
    }
    if (table.entries.reduce((sum, entry) => sum + entry.weightPermille, 0) !== 1_000) throw new Error(`CHEST_LOOT_WEIGHTS_INVALID: ${chest.id}`);
    if (chest.chestType === 'event' && table.entries.some(entry => entry.eventId !== chest.eventId
      || ![`EVENT-RELIC-${chest.eventId}`, `EVENT-MARK-${chest.eventId}`].includes(entry.templateId))) {
      throw new Error(`EVENT_CHEST_POOL_LEAK: ${chest.id}`);
    }
    if (chest.chestType === 'field' && table.entries.some(entry => entry.eventId !== null || entry.templateId.startsWith('EVENT-RELIC-'))) {
      throw new Error(`FIELD_CHEST_POOL_LEAK: ${chest.id}`);
    }
  }
}

export const CHEST_EVENT_IDS = EVENT_IDS;
