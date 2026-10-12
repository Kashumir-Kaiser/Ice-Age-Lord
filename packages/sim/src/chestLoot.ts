import type { FieldChest, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { CHEST_LOOT_RULE_VERSION, chestLootOdds, lootTableForChest } from '../../content/src/chestLoot.ts';
import { randomIntFromFields } from './hash.ts';

type ChestEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };

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
