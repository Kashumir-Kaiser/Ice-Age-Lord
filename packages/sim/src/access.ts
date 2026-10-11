import { UNIT_INVENTORY_CONTAINER_PREFIX, type GameState, type WorldDefinition } from '../../contracts/src/index.ts';

const carriedBagId = 'LL-CNT-CARRIED-FOOD-BAG-01';
const territorySupplyId = 'LL-CNT-SUPPLY-01';

export function canAccessStarterContainer(containerId: string, state: GameState, world: WorldDefinition): boolean {
  if (state.player.location.kind === 'travel') return false;
  if (containerId === carriedBagId) {
    return state.inventory.containers.some(container =>
      container.id === containerId && container.location.kind === 'carried' && container.location.ownerId === state.player.id,
    );
  }

  if (containerId === territorySupplyId) {
    const container = state.inventory.containers.find(candidate => candidate.id === containerId);
    if (!container || container.location.kind !== 'site') return false;
    const site = world.sites.find(candidate => candidate.id === container.location.siteId);
    if (!site) return false;
    return Math.hypot(state.player.position.xMm - site.position.xMm, state.player.position.yMm - site.position.yMm)
      <= world.navigationOverlay.interactionRangeMm;
  }

  if (containerId.startsWith(UNIT_INVENTORY_CONTAINER_PREFIX)) {
    const container = state.inventory.containers.find(candidate => candidate.id === containerId && candidate.kind === 'unit_inventory');
    if (!container || container.location.kind !== 'unit') return false;
    const unitId = container.location.unitId;
    const unit = state.ownedUnits.find(candidate => candidate.id === unitId);
    if (!unit?.position) return false;
    const busy = state.travel.orders.some(order => order.status === 'active' && order.actorIds.includes(unitId))
      || state.spatial.searchJobs.some(job => job.status === 'active' && job.actorIds.includes(unitId))
      || state.spatial.harvestJobs.some(job => job.status === 'active' && job.actorIds.includes(unitId));
    return !busy && Math.hypot(state.player.position.xMm - unit.position.xMm, state.player.position.yMm - unit.position.yMm)
      <= world.navigationOverlay.interactionRangeMm;
  }
  return false;
}
