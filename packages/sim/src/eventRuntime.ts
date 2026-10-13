import type { CommandEvent, EventProgressState, GameState } from '../../contracts/src/index.ts';
import type { WorldDefinition } from '../../contracts/src/index.ts';
import { EVENT_MECHANICS_RULE_VERSION, eventMechanicsFor } from '../../content/src/eventRules.ts';
import { canAccessStarterContainer } from './access.ts';

export const EVENT_REWARD_RULE_VERSION = 'LL01-EVENT-CLAIM-REWARD-1.0' as const;
export const EVENT_SHOP_RULE_VERSION = 'LL01-EVENT-SHOP-MARK-1.0' as const;
export const EVENT_SHOP_MARK_PRICE = 5;
export const EVENT_SHOP_INITIAL_STOCK = 10;
const CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;

export function eventRewardReceiptId(state: Pick<GameState, 'saveId' | 'player'>, eventId: string): string {
  return `EVENT-REWARD:${state.saveId}:${eventId}:${state.player.id}:${EVENT_REWARD_RULE_VERSION}:KRONA`;
}

export function initialEventProgress(world: WorldDefinition): EventProgressState[] {
  return world.eventSchedule.flatMap(event => eventMechanicsFor(event.id) ? [{
    eventId: event.id,
    ruleVersion: EVENT_MECHANICS_RULE_VERSION,
    objectiveProgress: 0,
    score: 0,
    participated: false,
    choiceId: null,
    scoreSpent: 0,
    shopRuleVersion: EVENT_SHOP_RULE_VERSION,
    shopStatus: 'scheduled' as const,
    shopInitialStock: EVENT_SHOP_INITIAL_STOCK,
    shopStockRemaining: EVENT_SHOP_INITIAL_STOCK,
    shopPurchasedQuantity: 0,
    shopExpiresAtElapsedMs: world.eventSchedule.find(row => row.id === event.id)!.resolvesAtMs,
    expiredItemQuantities: {},
    outcome: 'unsettled' as const,
    rewardKrona: 0,
    claimExpiresAtElapsedMs: null,
    claimReceiptId: null,
  }] : []);
}

function emit(type: string, at: number, payload: Record<string, unknown>): Omit<CommandEvent, 'sequence'> {
  return { type, occurredAtElapsedMs: at, payload };
}

export function recordEventActivities(
  state: GameState,
  sourceEvents: readonly { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[],
): { state: GameState; events: readonly Omit<CommandEvent, 'sequence'>[] } {
  if (sourceEvents.length === 0 || state.eventProgress.length === 0) return { state, events: [] };
  const updates = new Map<string, { points: number; sources: string[] }>();
  for (const source of sourceEvents) {
    for (const row of state.calendar) {
      if (row.status !== 'active' || source.occurredAtElapsedMs >= row.locksAtMs) continue;
      const rule = eventMechanicsFor(row.id);
      if (!rule) continue;
      const points = rule.activityPoints[source.type] ?? 0;
      if (points <= 0) continue;
      const current = updates.get(row.id) ?? { points: 0, sources: [] };
      current.points += points;
      current.sources.push(source.type);
      updates.set(row.id, current);
    }
  }
  if (!updates.size) return { state, events: [] };

  const events: Omit<CommandEvent, 'sequence'>[] = [];
  let changed = false;
  const occurredAtElapsedMs = sourceEvents.at(-1)?.occurredAtElapsedMs ?? state.simElapsedMs;
  const eventProgress = state.eventProgress.map(progress => {
    const update = updates.get(progress.eventId);
    if (!update || progress.outcome !== 'unsettled') return progress;
    const rule = eventMechanicsFor(progress.eventId)!;
    const scoreDelta = Math.min(update.points, Math.max(0, rule.target - progress.score));
    if (scoreDelta === 0) return progress;
    const objectiveProgress = progress.objectiveProgress + scoreDelta;
    events.push(emit('event_objective_progressed', occurredAtElapsedMs, {
      eventId: progress.eventId,
      objectiveProgress,
      target: rule.target,
      scoreDelta,
      sourceEventTypes: [...new Set(update.sources)].sort(),
      ruleVersion: EVENT_MECHANICS_RULE_VERSION,
    }));
    changed = true;
    return { ...progress, objectiveProgress, score: progress.score + scoreDelta, participated: true };
  });
  return changed ? { state: { ...state, eventProgress }, events } : { state, events: [] };
}

export function settleEventOutcome(state: GameState, eventId: string, at: number) {
  const progress = state.eventProgress.find(item => item.eventId === eventId);
  const rule = eventMechanicsFor(eventId);
  if (!progress || !rule || progress.outcome !== 'unsettled') return null;
  const succeeded = progress.participated && progress.objectiveProgress >= rule.target;
  const outcome: EventProgressState['outcome'] = succeeded ? 'success' : progress.participated ? 'failed' : 'nonparticipant';
  const rewardKrona = succeeded ? Math.min(100, 10 + Math.floor(progress.score / 5)) : 0;
  const claimExpiresAtElapsedMs = succeeded ? at + CLAIM_WINDOW_MS : null;
  state.eventProgress = state.eventProgress.map(item => item.eventId === eventId ? {
    ...item, outcome, rewardKrona, claimExpiresAtElapsedMs,
  } : item);
  return emit('event_objective_settled', at, {
    eventId,
    outcome,
    score: progress.score,
    objectiveProgress: progress.objectiveProgress,
    target: rule.target,
    rewardKrona,
    claimExpiresAtElapsedMs,
    rewardRuleVersion: EVENT_REWARD_RULE_VERSION,
  });
}

export function updateEventShopStatus(state: GameState, eventId: string, status: EventProgressState['shopStatus']): void {
  state.eventProgress = state.eventProgress.map(progress => progress.eventId === eventId
    ? { ...progress, shopStatus: status }
    : progress);
}

export function buyEventOffer(
  state: GameState,
  world: WorldDefinition,
  eventId: string,
  destinationContainerId: string,
  quantity: number,
  commandId: string,
) {
  const progress = state.eventProgress.find(item => item.eventId === eventId);
  const calendar = state.calendar.find(item => item.id === eventId);
  if (!progress || !calendar || !eventMechanicsFor(eventId)) {
    return { state, events: [], code: 'EVENT_SHOP_UNKNOWN', message: 'This event has no compiled event shop.' };
  }
  if (calendar.status !== 'active' || state.simElapsedMs >= calendar.locksAtMs || progress.shopStatus !== 'active'
    || state.simElapsedMs >= progress.shopExpiresAtElapsedMs) {
    return { state, events: [], code: 'EVENT_SHOP_CLOSED', message: 'The event shop is only open before its contribution lock.' };
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > progress.shopStockRemaining) {
    return { state, events: [], code: 'EVENT_SHOP_STOCK_INSUFFICIENT', message: 'The requested quantity exceeds event shop stock.' };
  }
  const scoreCost = quantity * EVENT_SHOP_MARK_PRICE;
  if (progress.score - progress.scoreSpent < scoreCost) {
    return { state, events: [], code: 'EVENT_SHOP_SCORE_INSUFFICIENT', message: `Earn ${scoreCost} unspent event score to buy ${quantity} event mark(s).` };
  }
  const destination = state.inventory.containers.find(container => container.id === destinationContainerId);
  if (!destination || !destination.observed || !canAccessStarterContainer(destination.id, state, world)) {
    return { state, events: [], code: 'EVENT_SHOP_DESTINATION_INACCESSIBLE', message: 'Choose an observed inventory container that is accessible to the player.' };
  }
  const templateId = `EVENT-MARK-${eventId}`;
  const existing = destination.stacks.find(stack => stack.templateId === templateId && stack.unit === 'unit'
    && stack.exclusiveEventId === eventId && stack.expiresAtElapsedMs === progress.shopExpiresAtElapsedMs
    && !stack.equipped && (stack.reservedQuantity ?? 0) === 0);
  if (!existing && destination.capacitySlots !== null && destination.stacks.length >= destination.capacitySlots) {
    return { state, events: [], code: 'DESTINATION_CAPACITY_FULL', message: 'Free an inventory slot before buying event marks.' };
  }

  const next = structuredClone(state);
  next.inventory = { ...next.inventory, containers: next.inventory.containers.map(container => container.id !== destination.id ? container : {
    ...container,
    stacks: existing
      ? container.stacks.map(stack => stack.itemId === existing.itemId ? { ...stack, quantity: stack.quantity + quantity } : stack)
      : [...container.stacks, {
        itemId: `EVENT-SHOP-ITEM-${eventId}-${commandId}`,
        templateId,
        quantity,
        reservedQuantity: 0,
        unit: 'unit',
        ownerId: state.player.id,
        equipped: false,
        equippedSlotId: null,
        exclusiveEventId: eventId,
        expiresAtElapsedMs: progress.shopExpiresAtElapsedMs,
        provenance: 'versioned_game_design' as const,
      }],
  }) };
  next.eventProgress = next.eventProgress.map(item => item.eventId === eventId ? {
    ...item,
    scoreSpent: item.scoreSpent + scoreCost,
    shopStockRemaining: item.shopStockRemaining - quantity,
    shopPurchasedQuantity: item.shopPurchasedQuantity + quantity,
  } : item);
  return {
    state: next,
    events: [emit('event_shop_purchase_committed', state.simElapsedMs, {
      eventId, itemTemplateId: templateId, quantity, scoreCost,
      stockRemaining: progress.shopStockRemaining - quantity,
      shopRuleVersion: EVENT_SHOP_RULE_VERSION,
    })],
    code: null,
    message: `Bought ${quantity} event mark(s) for ${scoreCost} event score.`,
  };
}

export function expireEventItems(state: GameState, eventId: string, at: number) {
  let expiredQuantity = 0;
  const expiredByTemplate: Record<string, number> = {};
  state.inventory = { ...state.inventory, containers: state.inventory.containers.map(container => ({
    ...container,
    stacks: container.stacks.filter(stack => {
      if (stack.exclusiveEventId !== eventId || stack.expiresAtElapsedMs === null || stack.expiresAtElapsedMs === undefined
        || stack.expiresAtElapsedMs > at) return true;
      expiredQuantity += stack.quantity;
      expiredByTemplate[stack.templateId] = (expiredByTemplate[stack.templateId] ?? 0) + stack.quantity;
      return false;
    }),
  })) };
  state.eventProgress = state.eventProgress.map(progress => {
    if (progress.eventId !== eventId || expiredQuantity === 0) return progress;
    const expiredItemQuantities = { ...progress.expiredItemQuantities };
    for (const [templateId, quantity] of Object.entries(expiredByTemplate)) {
      expiredItemQuantities[templateId] = (expiredItemQuantities[templateId] ?? 0) + quantity;
    }
    return { ...progress, expiredItemQuantities };
  });
  if (expiredQuantity === 0) return null;
  return emit('event_inventory_expired', at, { eventId, expiredByTemplate, shopRuleVersion: EVENT_SHOP_RULE_VERSION });
}

function adjustKrona(state: GameState, amount: number): void {
  const current = state.currency.find(balance => balance.currencyId === 'KRONA')?.amount ?? 0;
  state.currency = [...state.currency.filter(balance => balance.currencyId !== 'KRONA'), ...(current + amount > 0 ? [{ currencyId: 'KRONA', amount: current + amount }] : [])];
}

export function claimEventReward(state: GameState, eventId: string, commandId: string) {
  const progress = state.eventProgress.find(item => item.eventId === eventId);
  const calendar = state.calendar.find(item => item.id === eventId);
  if (!progress || !calendar || !eventMechanicsFor(eventId)) {
    return { state, events: [], code: 'EVENT_REWARD_NOT_CLAIMABLE', message: 'A completed event objective with a pending reward is required.' };
  }
  if (progress.claimReceiptId || progress.outcome === 'claimed') return { state, events: [], code: 'EVENT_REWARD_ALREADY_CLAIMED', message: 'This event reward was already claimed.' };
  if (calendar.status !== 'resolved' || progress.outcome !== 'success' || progress.rewardKrona <= 0) {
    return { state, events: [], code: 'EVENT_REWARD_NOT_CLAIMABLE', message: 'A completed event objective with a pending reward is required.' };
  }
  if (progress.claimExpiresAtElapsedMs === null || state.simElapsedMs >= progress.claimExpiresAtElapsedMs) {
    const next = structuredClone(state);
    next.eventProgress = next.eventProgress.map(item => item.eventId === eventId ? { ...item, outcome: 'expired' } : item);
    return { state: next, events: [], code: 'EVENT_REWARD_CLAIM_EXPIRED', message: 'The event reward claim window has expired.' };
  }
  const next = structuredClone(state);
  adjustKrona(next, progress.rewardKrona);
  const receiptId = eventRewardReceiptId(state, eventId);
  next.eventProgress = next.eventProgress.map(item => item.eventId === eventId ? {
    ...item, outcome: 'claimed', claimReceiptId: receiptId,
  } : item);
  return {
    state: next,
    events: [emit('event_reward_claimed', state.simElapsedMs, {
      eventId, commandId, receiptId, participantId: state.player.id, rewardId: `${EVENT_REWARD_RULE_VERSION}:KRONA`,
      amount: progress.rewardKrona, currencyId: 'KRONA', ruleVersion: EVENT_REWARD_RULE_VERSION,
    })],
    code: null,
    message: `Claimed ${progress.rewardKrona} Krona from ${eventId}.`,
  };
}

export function settleExpiredEventClaims(state: GameState, at: number) {
  const expired = state.eventProgress.filter(progress => progress.outcome === 'success' && progress.claimExpiresAtElapsedMs !== null
    && progress.claimExpiresAtElapsedMs <= at);
  if (expired.length === 0) return [] as Omit<CommandEvent, 'sequence'>[];
  const ids = new Set(expired.map(progress => progress.eventId));
  state.eventProgress = state.eventProgress.map(progress => ids.has(progress.eventId) ? { ...progress, outcome: 'expired' } : progress);
  return expired.map(progress => emit('event_reward_claim_expired', at, {
    eventId: progress.eventId, expiredAtElapsedMs: progress.claimExpiresAtElapsedMs, ruleVersion: EVENT_REWARD_RULE_VERSION,
  }));
}

export function chooseEventPath(state: GameState, eventId: string, choiceId: string) {
  const event = state.calendar.find(item => item.id === eventId);
  const progress = state.eventProgress.find(item => item.eventId === eventId);
  if (eventId !== 'EV19-ICE-SNOW-CHOICE' || !event || event.status !== 'active' || state.simElapsedMs >= event.locksAtMs) {
    return { code: 'EVENT_CHOICE_NOT_AVAILABLE', message: 'The ice or snow choice is available only while EV19 is open.', state };
  }
  if (choiceId !== 'ice' && choiceId !== 'snow') return { code: 'EVENT_CHOICE_INVALID', message: 'Choose either the ice path or the snow path.', state };
  if (progress?.participated) return { code: 'EVENT_CHOICE_ALREADY_RECORDED', message: 'The campaign choice has already been recorded.', state };
  const next = structuredClone(state);
  next.eventProgress = next.eventProgress.map(item => item.eventId === eventId ? { ...item, choiceId: choiceId as 'ice' | 'snow' } : item);
  return {
    code: null,
    message: `${choiceId} path selected.`,
    state: next,
    event: emit('event_choice_made', state.simElapsedMs, { eventId, choiceId, ruleVersion: EVENT_MECHANICS_RULE_VERSION }),
  };
}
