import type { GameState } from '../../contracts/src/index.ts';

const carriedBagId = 'LL-CNT-CARRIED-FOOD-BAG-01';
const territorySupplyId = 'LL-CNT-SUPPLY-01';

export function canAccessStarterContainer(containerId: string, state: GameState): boolean {
  if (state.travel.activeOrderId !== null || state.travel.routeId !== null) return false;
  if (containerId === carriedBagId) {
    return state.inventory.containers.some(container =>
      container.id === containerId && container.location.kind === 'carried' && container.location.ownerId === state.player.id,
    );
  }

  // File 06 describes the supply chest as touch/open accessible. Its fixed File 03
  // coordinate is 31.6 m from the fire origin, beyond the 10 m heat radius; until
  // player position and movement are authoritative, the server cannot prove reach.
  if (containerId === territorySupplyId) return false;
  return false;
}
