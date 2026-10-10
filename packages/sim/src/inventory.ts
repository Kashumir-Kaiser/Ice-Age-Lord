import type { CommandEvent, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { canAccessStarterContainer } from './access.ts';
import { actorAvailability } from './spatial.ts';

function canReachContainer(state: GameState, world: WorldDefinition, actorId: string, containerId: string): boolean {
  if (actorId !== state.player.id || actorAvailability(state, actorId)) return false;
  const container = state.inventory.containers.find(item => item.id === containerId);
  if (!container || !container.observed) return false;
  if (canAccessStarterContainer(containerId, state, world)) return true;
  if (container.location.kind === 'carried' && container.location.ownerId === actorId) return true;
  let position = null as { xMm: number; yMm: number } | null;
  if (container.location.kind === 'site') {
    const site = world.sites.find(item => item.id === container.location.siteId);
    position = site ? site.position : null;
  } else if (container.location.kind === 'building') {
    const building = state.buildings.find(item => item.id === container.location.buildingId);
    position = building?.position ?? null;
  } else if (container.location.kind === 'unit') {
    position = state.ownedUnits.find(item => item.id === container.location.unitId)?.position ?? null;
  }
  return !!position && Math.hypot(position.xMm - state.player.position.xMm, position.yMm - state.player.position.yMm) <= world.navigationOverlay.interactionRangeMm;
}

export type InventoryMutation = { state: GameState; event: CommandEvent | null; code: string | null };

export function splitStack(state: GameState, world: WorldDefinition, input: { actorId: string; containerId: string; itemId: string; quantity: number; newItemId: string }): InventoryMutation {
  const container = state.inventory.containers.find(item => item.id === input.containerId);
  if (!container || !canReachContainer(state, world, input.actorId, input.containerId)) return { state, event: null, code: 'CONTAINER_NOT_ACCESSIBLE' };
  const stack = container.stacks.find(item => item.itemId === input.itemId);
  if (!stack || stack.equipped || (stack.reservedQuantity ?? 0) > 0 || input.quantity >= stack.quantity) return { state, event: null, code: 'ITEM_CANNOT_BE_SPLIT' };
  if (container.capacitySlots !== null && container.stacks.length >= container.capacitySlots) return { state, event: null, code: 'DESTINATION_CAPACITY_FULL' };
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity >= stack.quantity) return { state, event: null, code: 'ITEM_QUANTITY_UNAVAILABLE' };
  if (container.stacks.some(item => item.itemId === input.newItemId)) return { state, event: null, code: 'ITEM_ID_COLLISION' };
  const next = structuredClone(state);
  next.inventory = { containers: state.inventory.containers.map(item => item.id !== container.id ? item : {
    ...item,
    stacks: [
      ...item.stacks.map(source => source.itemId === stack.itemId ? { ...source, quantity: source.quantity - input.quantity } : source),
      { ...stack, itemId: input.newItemId, quantity: input.quantity, reservedQuantity: 0, equipped: false, equippedSlotId: null },
    ],
  }) };
  return { state: next, event: { sequence: 0, type: 'inventory_stack_split', occurredAtElapsedMs: state.simElapsedMs, payload: { containerId: container.id, sourceItemId: stack.itemId, newItemId: input.newItemId, quantity: input.quantity, templateId: stack.templateId } }, code: null };
}

export function mergeStacks(state: GameState, world: WorldDefinition, input: { actorId: string; containerId: string; sourceItemId: string; targetItemId: string }): InventoryMutation {
  const container = state.inventory.containers.find(item => item.id === input.containerId);
  if (!container || !canReachContainer(state, world, input.actorId, input.containerId)) return { state, event: null, code: 'CONTAINER_NOT_ACCESSIBLE' };
  const source = container.stacks.find(item => item.itemId === input.sourceItemId);
  const target = container.stacks.find(item => item.itemId === input.targetItemId);
  if (!source || !target || source.itemId === target.itemId) return { state, event: null, code: 'ITEM_NOT_FOUND' };
  const sameDefinition = source.templateId === target.templateId && source.unit === target.unit && source.provenance === target.provenance
    && (source.quality ?? null) === (target.quality ?? null) && (source.foodUnitsPerItem ?? null) === (target.foodUnitsPerItem ?? null)
    && (source.ownerId ?? null) === (target.ownerId ?? null);
  if (!sameDefinition || source.equipped || target.equipped || (source.reservedQuantity ?? 0) > 0 || (target.reservedQuantity ?? 0) > 0) {
    return { state, event: null, code: 'STACKS_NOT_COMPATIBLE' };
  }
  if (!Number.isSafeInteger(source.quantity + target.quantity)) return { state, event: null, code: 'ITEM_QUANTITY_OVERFLOW' };
  const next = structuredClone(state);
  next.inventory = { containers: state.inventory.containers.map(item => item.id !== container.id ? item : {
    ...item,
    stacks: item.stacks.flatMap(stack => stack.itemId === source.itemId ? [] : stack.itemId === target.itemId ? [{ ...stack, quantity: target.quantity + source.quantity }] : [stack]),
  }) };
  return { state: next, event: { sequence: 0, type: 'inventory_stacks_merged', occurredAtElapsedMs: state.simElapsedMs, payload: { containerId: container.id, sourceItemId: source.itemId, targetItemId: target.itemId, quantity: source.quantity + target.quantity } }, code: null };
}

export function consumeItem(state: GameState, world: WorldDefinition, input: { actorId: string; containerId: string; itemId: string; quantity: number }): InventoryMutation {
  const container = state.inventory.containers.find(item => item.id === input.containerId);
  if (!container || !canReachContainer(state, world, input.actorId, input.containerId)) return { state, event: null, code: 'CONTAINER_NOT_ACCESSIBLE' };
  const stack = container.stacks.find(item => item.itemId === input.itemId);
  if (!stack || !Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > stack.quantity - (stack.reservedQuantity ?? 0)) return { state, event: null, code: 'ITEM_QUANTITY_UNAVAILABLE' };
  if (stack.equipped) return { state, event: null, code: 'EQUIPPED_ITEM_CANNOT_BE_CONSUMED' };
  if (!(stack.foodUnitsPerItem && stack.foodUnitsPerItem > 0) && stack.templateId !== 'BREAD') return { state, event: null, code: 'ITEM_CONSUMPTION_CONTRACT_NOT_COMPILED' };
  const consumedUnits = (stack.foodUnitsPerItem ?? 1) * input.quantity;
  const next = structuredClone(state);
  next.inventory = { containers: state.inventory.containers.map(item => item.id !== container.id ? item : {
    ...item,
    stacks: item.stacks.flatMap(source => source.itemId !== stack.itemId ? [source] : source.quantity === input.quantity ? [] : [{ ...source, quantity: source.quantity - input.quantity }]),
  }) };
  return { state: next, event: { sequence: 0, type: 'inventory_food_consumed', occurredAtElapsedMs: state.simElapsedMs, payload: { containerId: container.id, itemId: stack.itemId, templateId: stack.templateId, quantity: input.quantity, foodUnits: consumedUnits } }, code: null };
}

export function equipmentBlocker(state: GameState, unitId: string, itemId: string): string | null {
  const unit = state.ownedUnits.find(candidate => candidate.id === unitId);
  if (!unit) return 'UNIT_NOT_OWNED';
  const item = state.inventory.containers.flatMap(container => container.stacks).find(candidate => candidate.itemId === itemId);
  if (!item) return 'ITEM_NOT_OWNED';
  if (unit.equipmentRequirements.status === 'source_profile_not_compiled') return 'EQUIPMENT_PROFILE_NOT_COMPILED';
  return 'EQUIPMENT_SLOT_RULE_NOT_COMPILED';
}
