import type { GameState, WorldDefinition } from '../../contracts/src/index.ts';

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
  return false;
}
