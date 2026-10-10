import type { CoordinateMm, NavigationOverlay, WorldSite } from '../../contracts/src/index.ts';

const routeEndpoints: Readonly<Record<string, readonly [string, string]>> = {
  'ROUTE-LL01-01': ['H0', 'SITE-LL01-043'],
  'ROUTE-LL01-02': ['SITE-LL01-043', 'SITE-LL01-044'],
  'ROUTE-LL01-03': ['SITE-LL01-044', 'SITE-LL01-048'],
  'ROUTE-LL01-04': ['SITE-LL01-044', 'SITE-LL01-049'],
  'ROUTE-LL01-05': ['SITE-LL01-049', 'SITE-LL01-046'],
  'ROUTE-LL01-06': ['SITE-LL01-046', 'SITE-LL01-047'],
  'ROUTE-LL01-07': ['H0', 'SITE-LL01-041'],
  'ROUTE-LL01-08': ['H0', 'SITE-LL01-040'],
};

function midpointForLength(from: CoordinateMm, to: CoordinateMm, totalDistanceMm: number): CoordinateMm {
  const dx = to.xMm - from.xMm;
  const dy = to.yMm - from.yMm;
  const straight = Math.hypot(dx, dy);
  if (totalDistanceMm + 1 < straight) throw new Error(`NAVIGATION_SOURCE_DISTANCE_SHORTER_THAN_ENDPOINTS:${totalDistanceMm}:${straight}`);
  const offset = Math.sqrt(Math.max(0, (totalDistanceMm / 2) ** 2 - (straight / 2) ** 2));
  const normalX = straight === 0 ? 0 : -dy / straight;
  const normalY = straight === 0 ? 1 : dx / straight;
  return {
    xMm: Math.round((from.xMm + to.xMm) / 2 + normalX * offset),
    yMm: Math.round((from.yMm + to.yMm) / 2 + normalY * offset),
    sourceZMetres: ((from.sourceZMetres ?? 0) + (to.sourceZMetres ?? 0)) / 2,
  };
}

function nodePosition(id: string, sites: readonly WorldSite[], origin: CoordinateMm): CoordinateMm {
  if (id === 'H0') return origin;
  const site = sites.find(candidate => candidate.id === id);
  if (!site) throw new Error(`NAVIGATION_ENDPOINT_MISSING:${id}`);
  return site.position;
}

export function buildNavigationOverlay(
  routes: readonly { id: string; description: string }[],
  sites: readonly WorldSite[],
  origin: CoordinateMm,
): NavigationOverlay {
  const routeEdges = routes.map(route => {
    const endpoints = routeEndpoints[route.id];
    const distance = route.description.match(/([0-9]+(?:,[0-9]+)?)\s*km/i)?.[1];
    if (!endpoints || !distance) throw new Error(`NAVIGATION_SOURCE_ROUTE_UNRESOLVED:${route.id}`);
    const sourceDistanceMm = Math.round(Number(distance.replace(',', '.')) * 1_000_000);
    const from = nodePosition(endpoints[0], sites, origin);
    const to = nodePosition(endpoints[1], sites, origin);
    const midpoint = midpointForLength(from, to, sourceDistanceMm);
    const surface = route.description.split(';')[1]?.trim() || 'source route surface unspecified';
    return {
      id: route.id,
      fromNodeId: endpoints[0],
      toNodeId: endpoints[1],
      sourceDistanceMm,
      surface,
      path: [from, midpoint, to],
      provenance: 'source_route_endpoints_plus_versioned_overlay_geometry' as const,
    };
  });
  if (routeEdges.length !== 8) throw new Error(`NAVIGATION_SOURCE_ROUTE_COUNT_INVALID:${routeEdges.length}`);
  return {
    id: 'LL01-NAVIGATION-OVERLAY-1.0',
    provenance: 'versioned_game_design',
    maxOffRouteLinkMm: 2_000_000,
    walkSpeedMmPerHour: 3_500_000,
    loadedSpeedPermille: 750,
    interactionRangeMm: 3_000,
    sightRangeMm: 25_000,
    signalRangeMm: 120_000,
    twilightSightPermille: 700,
    nightSightPermille: 350,
    routeEdges,
  };
}
