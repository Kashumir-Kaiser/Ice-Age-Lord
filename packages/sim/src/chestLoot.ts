import type { BotRemainsChest, FieldChest, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { CHEST_LOOT_RULE_VERSION, LEGACY_CHEST_LOOT_RULE_VERSION, chestLootOdds, lootTableForChest } from '../../content/src/chestLoot.ts';
import { randomIntFromFields } from './hash.ts';

type ChestEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };

const LEGACY_FIELD_TABLES = {
  'Mộc': { rollCount: 1, entries: [['WOOD', 500, 1, 2], ['STONE', 300, 1, 2], ['WILD-FOOD', 200, 1, 1]] },
  'Thanh Đồng': { rollCount: 1, entries: [['WOOD', 300, 1, 3], ['STONE', 300, 1, 3], ['WILD-FOOD', 200, 1, 2], ['RAW-SALT', 200, 1, 1]] },
  'Bạch Ngân': { rollCount: 2, entries: [['STONE', 250, 1, 3], ['RAW-SALT', 250, 1, 2], ['BROWN-COAL', 250, 1, 2], ['RAW-ICE-WATER', 150, 1, 2], ['WILD-FOOD', 100, 1, 2]] },
  'Hoàng Kim': { rollCount: 2, entries: [['RAW-SALT', 250, 1, 3], ['BROWN-COAL', 250, 1, 3], ['RAW-ICE-WATER', 200, 1, 3], ['WILD-FOOD', 200, 1, 3], ['STONE', 100, 2, 4]] },
  'Hạo Nguyệt': { rollCount: 3, entries: [['RAW-SALT', 250, 2, 4], ['BROWN-COAL', 250, 2, 4], ['RAW-ICE-WATER', 200, 2, 4], ['WILD-FOOD', 200, 2, 4], ['STONE', 100, 3, 5]] },
} as const;

/** Replays the original field table only for unopened chest records saved before loot rules were pinned. */
export function deterministicLegacyFieldChestOutcome(seed: string, chest: FieldChest) {
  if (chest.chestType !== 'field' || chest.eventId !== null) throw new Error('LEGACY_FIELD_CHEST_ONLY');
  const table = LEGACY_FIELD_TABLES[chest.grade];
  const resolved = new Map<string, number>();
  for (let rollIndex = 0; rollIndex < table.rollCount; rollIndex += 1) {
    const roll = randomIntFromFields([seed, chest.lootCommitment, chest.id, LEGACY_CHEST_LOOT_RULE_VERSION, String(rollIndex), 'POOL'], 0, 999);
    let cumulative = 0;
    const entry = table.entries.find(candidate => { cumulative += candidate[1]; return roll.value < cumulative; });
    if (!entry) throw new Error('LEGACY_FIELD_CHEST_TABLE_INVALID');
    const quantity = randomIntFromFields([seed, chest.lootCommitment, chest.id, LEGACY_CHEST_LOOT_RULE_VERSION, String(rollIndex), 'QUANTITY'], entry[2], entry[3]).value;
    resolved.set(entry[0], (resolved.get(entry[0]) ?? 0) + quantity);
  }
  return {
    ruleVersion: LEGACY_CHEST_LOOT_RULE_VERSION,
    rewardStacks: [...resolved].sort(([left], [right]) => left.localeCompare(right)).map(([templateId, quantity]) => ({
      itemId: `CHEST-ITEM-${chest.id}-${templateId}`, templateId, quantity,
    })),
  };
}

export function deterministicChestOutcome(seed: string, chest: FieldChest) {
  const table = lootTableForChest(chest);
  const resolved = new Map<string, number>();
  for (let rollIndex = 0; rollIndex < table.rollCount; rollIndex++) {
    const roll = randomIntFromFields([seed, chest.lootCommitment, chest.id, table.ruleVersion, String(rollIndex), 'POOL'], 0, 999);
    let cumulative = 0;
    const entry = table.entries.find(candidate => { cumulative += candidate.weightPermille; return roll.value < cumulative; });
    if (!entry) throw new Error('CHEST_LOOT_TABLE_INVALID');
    if (chest.chestType === 'event' && (entry.eventId !== chest.eventId
      || ![`EVENT-RELIC-${chest.eventId}`, `EVENT-MARK-${chest.eventId}`].includes(entry.templateId))) throw new Error('EVENT_CHEST_POOL_LEAK');
    const quantity = randomIntFromFields([seed, chest.lootCommitment, chest.id, table.ruleVersion, String(rollIndex), 'QUANTITY'], entry.minimumQuantity, entry.maximumQuantity).value;
    resolved.set(entry.templateId, (resolved.get(entry.templateId) ?? 0) + quantity);
  }
  return {
    ruleVersion: table.ruleVersion,
    rewardStacks: [...resolved].sort(([left], [right]) => left.localeCompare(right)).map(([templateId, quantity]) => ({
      itemId: `CHEST-ITEM-${chest.id}-${templateId}`, templateId, quantity,
    })),
  };
}

export function chestLootProjection(chest: FieldChest, opened: boolean, outcome?: readonly { templateId: string; quantity: number }[] | null) {
  const table = lootTableForChest(chest);
  return {
    chestType: chest.chestType,
    rarity: chest.grade,
    eventId: chest.eventId,
    ruleVersion: table.ruleVersion,
    rollCount: table.rollCount,
    odds: chestLootOdds(table),
    opened,
    ...(outcome ? { outcome: outcome.map(stack => ({ templateId: stack.templateId, quantity: stack.quantity })) } : {}),
  };
}

export function openFieldChest(state: GameState, world: WorldDefinition, actorId: string, chestId: string) {
  const chest = world.fieldChests.find(candidate => candidate.id === chestId && state.playerKnowledge.knownChestIds.includes(candidate.id));
  const chestState = state.fieldChestStates.find(candidate => candidate.chestId === chestId);
  const actor = actorId === state.player.id ? { id: state.player.id, position: state.player.position }
    : (() => { const unit = state.ownedUnits.find(candidate => candidate.id === actorId && candidate.ownerId === state.player.id); return unit?.position ? { id: unit.id, position: unit.position } : null; })();
  if (!chest || !chestState || !actor || !actor.position
    || Math.hypot(actor.position.xMm - chest.position.xMm, actor.position.yMm - chest.position.yMm) > world.navigationOverlay.interactionRangeMm) {
    return { state, events: [] as ChestEvent[], code: 'NOT_ACCESSIBLE', message: 'The identified chest must be within the actor’s reach.' };
  }
  if (chestState.state !== 'unopened' || chestState.custody !== 'world') {
    return { state, events: [] as ChestEvent[], code: 'CHEST_ALREADY_OPENED', message: 'This chest has already been opened or removed.' };
  }
  if (chest.chestType === 'event') {
    const event = state.calendar.find(candidate => candidate.id === chest.eventId);
    if (!event || event.status !== 'active' || state.simElapsedMs >= event.locksAtMs) {
      return { state, events: [] as ChestEvent[], code: 'EVENT_CHEST_WINDOW_CLOSED', message: 'This event chest can only be opened while its event is accepting contributions.' };
    }
  }
  const destination = state.inventory.containers.find(container => container.location.kind === 'carried' && container.location.ownerId === actorId
    || container.location.kind === 'unit' && container.location.unitId === actorId);
  if (!destination) return { state, events: [] as ChestEvent[], code: 'CHEST_DESTINATION_MISSING', message: 'The actor has no inventory container for chest rewards.' };

  let outcome: ReturnType<typeof deterministicChestOutcome>;
  let table;
  try { table = lootTableForChest(chest); outcome = deterministicChestOutcome(state.seed, chest); }
  catch { return { state, events: [] as ChestEvent[], code: 'CHEST_LOOT_TABLE_NOT_COMPILED', message: 'This chest has no validated reward table.' }; }
  if (table.ruleVersion !== CHEST_LOOT_RULE_VERSION) return { state, events: [] as ChestEvent[], code: 'CHEST_LOOT_RULE_VERSION_UNSUPPORTED', message: 'This chest uses an unsupported reward table.' };
  const rewardStacks = outcome.rewardStacks;
  const exclusiveEventId = chest.chestType === 'event' ? chest.eventId : null;
  const expiresAtElapsedMs = exclusiveEventId ? state.calendar.find(event => event.id === exclusiveEventId)?.resolvesAtMs ?? null : null;
  const newStacks = rewardStacks.filter(reward => !destination.stacks.some(stack => stack.templateId === reward.templateId && stack.unit === 'unit'
    && (stack.exclusiveEventId ?? null) === exclusiveEventId && (stack.expiresAtElapsedMs ?? null) === expiresAtElapsedMs
    && !stack.equipped && (stack.reservedQuantity ?? 0) === 0));
  if (destination.capacitySlots !== null && destination.stacks.length + newStacks.length > destination.capacitySlots) {
    return { state, events: [] as ChestEvent[], code: 'DESTINATION_CAPACITY_FULL', message: 'Free inventory slots before opening this chest.' };
  }

  const next = structuredClone(state);
  next.inventory = { ...next.inventory, containers: next.inventory.containers.map(container => container.id !== destination.id ? container : {
    ...container,
    stacks: rewardStacks.reduce((stacks, reward) => {
      const existing = stacks.find(stack => stack.templateId === reward.templateId && stack.unit === 'unit'
        && (stack.exclusiveEventId ?? null) === exclusiveEventId && (stack.expiresAtElapsedMs ?? null) === expiresAtElapsedMs
        && !stack.equipped && (stack.reservedQuantity ?? 0) === 0);
      if (existing) return stacks.map(stack => stack.itemId === existing.itemId ? { ...stack, quantity: stack.quantity + reward.quantity } : stack);
      return [...stacks, {
        ...reward, reservedQuantity: 0, unit: 'unit', ownerId: actorId, equipped: false, equippedSlotId: null,
        exclusiveEventId, expiresAtElapsedMs, provenance: 'versioned_game_design' as const,
      }];
    }, [...container.stacks]),
  }) };
  next.fieldChestStates = next.fieldChestStates.map(candidate => candidate.chestId === chestId ? {
    ...candidate, state: 'opened' as const, openedAtElapsedMs: state.simElapsedMs, custody: 'opened' as const,
    claimedById: actorId, lootOutcome: outcome,
  } : candidate);
  return {
    state: next,
    events: [
      { type: 'chest_opened', occurredAtElapsedMs: state.simElapsedMs, payload: { chestId, chestType: chest.chestType, rarity: chest.grade, eventId: chest.eventId, ruleVersion: table.ruleVersion, rollCount: table.rollCount } },
      { type: 'chest_loot_delivered', occurredAtElapsedMs: state.simElapsedMs, payload: { chestId, actorId, rewards: rewardStacks } },
    ] as ChestEvent[],
    code: null,
    message: `Opened ${chest.grade} ${chest.chestType} chest and delivered ${rewardStacks.length} reward stack(s).`,
  };
}

/** Transfers a dead lord's persisted assets exactly once into the actor's real inventory. */
export function openBotRemainsChest(state: GameState, world: WorldDefinition, actorId: string, chestId: string) {
  const population = state.botPopulation;
  const remains = population?.remainsChests.find(candidate => candidate.id === chestId);
  const actor = actorId === state.player.id ? { id: state.player.id, position: state.player.position }
    : (() => { const unit = state.ownedUnits.find(candidate => candidate.id === actorId && candidate.ownerId === state.player.id); return unit?.position ? { id: unit.id, position: unit.position } : null; })();
  if (!remains || !actor?.position
    || Math.hypot(actor.position.xMm - remains.position.xMm, actor.position.yMm - remains.position.yMm) > world.navigationOverlay.interactionRangeMm) {
    return { state, events: [] as ChestEvent[], code: 'NOT_ACCESSIBLE', message: 'The remains cache must be within the actor’s reach.' };
  }
  if (remains.state !== 'unclaimed') return { state, events: [] as ChestEvent[], code: 'CHEST_ALREADY_OPENED', message: 'This remains cache has already been claimed.' };
  const destination = state.inventory.containers.find(container => container.location.kind === 'carried' && container.location.ownerId === actorId
    || container.location.kind === 'unit' && container.location.unitId === actorId);
  if (!destination) return { state, events: [] as ChestEvent[], code: 'CHEST_DESTINATION_MISSING', message: 'The actor has no inventory container for the recovered assets.' };

  const resourceStacks = remainsResourceStacks(remains, actorId);
  const blueprintStacks = remains.blueprintItems.map(item => ({
    itemId: item.instanceId,
    templateId: item.blueprintId,
    quantity: 1,
    reservedQuantity: 0,
    unit: 'blueprint',
    ownerId: actorId,
    equipped: false,
    equippedSlotId: null,
    sourceReceiptId: item.transactionId ?? `BOT-REMAINS-DEATH:${remains.deathEventId}`,
    provenance: 'versioned_game_design' as const,
  }));
  const itemStacks = remains.inventoryItems.map(item => ({
    itemId: item.instanceId,
    templateId: item.itemTemplateId,
    quantity: item.quantity,
    reservedQuantity: 0,
    unit: 'item',
    ownerId: actorId,
    equipped: false,
    equippedSlotId: null,
    sourceReceiptId: item.rewardReceiptId ?? item.sourceId ?? `BOT-REMAINS-DEATH:${remains.deathEventId}`,
    ...(item.itemTemplateId === 'MEAT' || item.itemTemplateId === 'BREAD' ? { foodUnitsPerItem: 1 } : {}),
    provenance: 'versioned_game_design' as const,
  }));
  const mergeable = (incoming: typeof resourceStacks[number]) => destination.stacks.find(stack => stack.templateId === incoming.templateId
    && (stack.unit ?? 'unit') === incoming.unit && !stack.equipped && (stack.reservedQuantity ?? 0) === 0);
  const additions = [...itemStacks, ...blueprintStacks, ...resourceStacks.filter(stack => !mergeable(stack))];
  if (destination.capacitySlots !== null && destination.stacks.length + additions.length > destination.capacitySlots) {
    return { state, events: [] as ChestEvent[], code: 'DESTINATION_CAPACITY_FULL', message: 'Free inventory slots before claiming this remains cache.' };
  }
  const allItemIds = new Set(state.inventory.containers.flatMap(container => container.stacks.map(stack => stack.itemId)));
  if ([...itemStacks, ...blueprintStacks, ...resourceStacks].some(stack => allItemIds.has(stack.itemId))) {
    return { state, events: [] as ChestEvent[], code: 'CHEST_ASSET_ID_COLLISION', message: 'A recovered asset identity is already present in inventory.' };
  }

  const next = structuredClone(state);
  next.inventory = { ...next.inventory, containers: next.inventory.containers.map(container => {
    if (container.id !== destination.id) return container;
    const stacks = [...container.stacks, ...itemStacks, ...blueprintStacks];
    for (const resource of resourceStacks) {
      const existing = stacks.find(stack => stack.templateId === resource.templateId && (stack.unit ?? 'unit') === resource.unit
        && !stack.equipped && (stack.reservedQuantity ?? 0) === 0);
      if (existing) {
        const replacement = { ...existing, quantity: existing.quantity + resource.quantity };
        stacks[stacks.findIndex(stack => stack.itemId === existing.itemId)] = replacement;
      } else stacks.push(resource);
    }
    return { ...container, observed: true, stacks };
  }) };
  next.botPopulation = {
    ...population!,
    remainsChests: population!.remainsChests.map(chest => chest.id === remains.id ? {
      ...chest,
      resourceMicro: { food: 0, wood: 0, stone: 0, ore: 0 },
      waterMl: 0,
      firewoodMicro: 0,
      inventoryItems: [],
      blueprintItems: [],
      ownedChests: [],
      state: 'claimed',
      claimedById: actorId,
    } : chest),
  };
  const assets = {
    resources: resourceStacks.map(({ itemId, templateId, quantity, unit }) => ({ itemId, templateId, quantity, unit })),
    items: itemStacks.map(({ itemId, templateId, quantity, sourceReceiptId }) => ({ itemId, templateId, quantity, sourceReceiptId })),
    blueprintItems: remains.blueprintItems.map(item => ({ instanceId: item.instanceId, blueprintId: item.blueprintId })),
  };
  return {
    state: next,
    events: [{ type: 'bot_remains_chest_claimed', occurredAtElapsedMs: state.simElapsedMs, payload: {
      chestId: remains.id, deathEventId: remains.deathEventId, deceasedBotId: remains.botId, actorId, assets,
    } }],
    code: null,
    message: `Claimed the assets recorded in ${remains.botId}'s remains cache.`,
  };
}

function remainsResourceStacks(remains: BotRemainsChest, actorId: string) {
  const micro = 1_000_000;
  const values = [
    { key: 'food', templateId: 'WILD-FOOD', unit: 'unit', quantityMicro: remains.resourceMicro.food, foodUnitsPerItem: 1 },
    { key: 'wood', templateId: 'WOOD', unit: 'unit', quantityMicro: remains.resourceMicro.wood },
    { key: 'stone', templateId: 'STONE', unit: 'unit', quantityMicro: remains.resourceMicro.stone },
    { key: 'ore', templateId: 'ORE', unit: 'unit', quantityMicro: remains.resourceMicro.ore },
    { key: 'water', templateId: 'POTABLE-WATER', unit: 'L', quantityMicro: remains.waterMl * 1_000 },
    { key: 'firewood', templateId: 'FIREWOOD', unit: 'unit', quantityMicro: remains.firewoodMicro },
  ] as const;
  return values.filter(value => value.quantityMicro > 0).map(value => ({
    itemId: `BOT-REMAINS-RESOURCE:${remains.deathEventId}:${value.key}`,
    templateId: value.templateId,
    quantity: value.quantityMicro / micro,
    reservedQuantity: 0,
    unit: value.unit,
    ownerId: actorId,
    equipped: false,
    equippedSlotId: null,
    ...(value.key === 'food' ? { foodUnitsPerItem: value.foodUnitsPerItem } : {}),
    sourceReceiptId: `BOT-REMAINS-DEATH:${remains.deathEventId}`,
    provenance: 'versioned_game_design' as const,
  }));
}
