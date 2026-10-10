import type {
  CoordinateMm,
  GameState,
  HarvestJobState,
  NavigationRoute,
  MovementOrderState,
  MovementPathSegment,
  PlayerUnitState,
  SearchJobState,
  SpatialSignalState,
  SpatialSweepHistory,
  WorldDefinition,
  WorldResource,
} from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';

export const SPATIAL_TICK_MS = 15 * 60_000;
export const SEARCH_CELL_MM = 10_000;
export const MAX_CARRIED_RESOURCE_UNITS = 20;
export const WORK_MS_PER_RESOURCE_UNIT = 60 * 60_000;
const MM_PER_M = 1_000;
const MM_PER_KM = 1_000_000;
const HOUR_MS = 60 * 60_000;

export type SpatialEvent = { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> };
export type RoutePlan = { points: readonly CoordinateMm[]; distanceMm: number; uncertainty: 'known' | 'uncertain'; sourceRouteIds: readonly string[] };
export type SpatialPreview = { distanceMm: number; etaMs: number; uncertainty: 'known' | 'uncertain' };
export type SpatialIndexEntry = { kind: 'site' | 'resource' | 'cache' | 'chest' | 'lair'; id: string; position: CoordinateMm };
export type SpatialIndex = ReadonlyMap<string, readonly SpatialIndexEntry[]>;

type Actor = { id: string; position: CoordinateMm; unit: PlayerUnitState | null; perception: number | null; intelligence: number | null };

function cellKey(x: number, y: number): string { return `${x}:${y}`; }
function gridCoord(valueMm: number): number { return Math.floor(valueMm / MM_PER_KM); }
function distanceMm(a: CoordinateMm, b: CoordinateMm): number { return Math.hypot(a.xMm - b.xMm, a.yMm - b.yMm); }
function sameLayer(a: CoordinateMm, b: CoordinateMm): boolean { return ((a.sourceZMetres ?? 0) < -2) === ((b.sourceZMetres ?? 0) < -2); }
function copyPosition(position: CoordinateMm): CoordinateMm { return { ...position }; }

export function buildSpatialIndex(world: WorldDefinition, positions: readonly { id: string; position: CoordinateMm }[] = []): SpatialIndex {
  const entries: SpatialIndexEntry[] = [
    ...world.sites.map(site => ({ kind: 'site' as const, id: site.id, position: site.position })),
    ...world.resources.map(resource => ({ kind: 'resource' as const, id: resource.id, position: resource.location })),
    ...world.chestCacheCenters.map(cache => ({ kind: 'cache' as const, id: cache.id, position: cache.position })),
    ...world.fieldChests.map(chest => ({ kind: 'chest' as const, id: chest.id, position: chest.position })),
    ...world.lairs.map(lair => ({ kind: 'lair' as const, id: lair.id, position: lair.position })),
    ...positions.map(entity => ({ kind: 'site' as const, id: entity.id, position: entity.position })),
  ];
  const cells = new Map<string, SpatialIndexEntry[]>();
  for (const entry of entries) {
    const key = cellKey(gridCoord(entry.position.xMm), gridCoord(entry.position.yMm));
    const cell = cells.get(key) ?? [];
    cell.push(entry);
    cells.set(key, cell);
  }
  return cells;
}

export function querySpatialIndex(index: SpatialIndex, center: CoordinateMm, radiusMm: number): readonly SpatialIndexEntry[] {
  const minX = gridCoord(center.xMm - radiusMm);
  const maxX = gridCoord(center.xMm + radiusMm);
  const minY = gridCoord(center.yMm - radiusMm);
  const maxY = gridCoord(center.yMm + radiusMm);
  const result: SpatialIndexEntry[] = [];
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
    for (const entry of index.get(cellKey(x, y)) ?? []) {
      if (distanceMm(center, entry.position) <= radiusMm) result.push(entry);
    }
  }
  return result;
}

function nodePosition(world: WorldDefinition, nodeId: string): CoordinateMm | null {
  if (nodeId === 'H0') return world.origin;
  return world.sites.find(site => site.id === nodeId)?.position ?? null;
}

type GraphPath = { points: CoordinateMm[]; distanceMm: number; routeIds: string[] } | null;
type RouteAttachment = { edge: NavigationRoute; position: CoordinateMm; distanceOnPathMm: number; distanceFromPointMm: number };

function routeBetweenNodes(world: WorldDefinition, fromId: string, toId: string): GraphPath {
  if (fromId === toId) return { points: [], distanceMm: 0, routeIds: [] };
  const nodes = new Map<string, { distanceMm: number; previous: string | null; edgeId: string | null; visited: boolean }>();
  const nodeIds = new Set<string>(['H0']);
  for (const edge of world.navigationOverlay.routeEdges) { nodeIds.add(edge.fromNodeId); nodeIds.add(edge.toNodeId); }
  for (const id of nodeIds) nodes.set(id, { distanceMm: Number.POSITIVE_INFINITY, previous: null, edgeId: null, visited: false });
  const start = nodes.get(fromId);
  if (!start || !nodes.has(toId)) return null;
  start.distanceMm = 0;
  while (true) {
    const currentEntry = [...nodes.entries()].filter(([, item]) => !item.visited).sort((a, b) => a[1].distanceMm - b[1].distanceMm || a[0].localeCompare(b[0]))[0];
    if (!currentEntry || !Number.isFinite(currentEntry[1].distanceMm)) return null;
    const [currentId, current] = currentEntry;
    if (currentId === toId) break;
    current.visited = true;
    for (const edge of world.navigationOverlay.routeEdges) {
      const nextId = edge.fromNodeId === currentId ? edge.toNodeId : edge.toNodeId === currentId ? edge.fromNodeId : null;
      if (!nextId) continue;
      const next = nodes.get(nextId)!;
      const candidateDistance = current.distanceMm + edge.sourceDistanceMm;
      if (candidateDistance < next.distanceMm) {
        next.distanceMm = candidateDistance;
        next.previous = currentId;
        next.edgeId = edge.id;
      }
    }
  }
  const edgeIds: string[] = [];
  const pathNodeIds = [toId];
  let currentId = toId;
  while (currentId !== fromId) {
    const current = nodes.get(currentId)!;
    if (!current.previous || !current.edgeId) return null;
    edgeIds.unshift(current.edgeId);
    currentId = current.previous;
    pathNodeIds.unshift(currentId);
  }
  const points: CoordinateMm[] = [];
  for (let i = 0; i < edgeIds.length; i++) {
    const edge = world.navigationOverlay.routeEdges.find(candidate => candidate.id === edgeIds[i])!;
    const forward = edge.fromNodeId === pathNodeIds[i];
    const geometry = forward ? edge.path : [...edge.path].reverse();
    points.push(...geometry.slice(points.length === 0 ? 0 : 1));
  }
  return { points, distanceMm: nodes.get(toId)!.distanceMm, routeIds: edgeIds };
}

function pathLength(points: readonly CoordinateMm[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distanceMm(points[index], point), 0);
}

function pointAtDistance(points: readonly CoordinateMm[], distance: number): CoordinateMm {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const segment = distanceMm(from, to);
    if (remaining <= segment || i === points.length - 1) {
      const ratio = segment <= 0 ? 1 : Math.max(0, Math.min(1, remaining / segment));
      return {
        xMm: Math.round(from.xMm + (to.xMm - from.xMm) * ratio),
        yMm: Math.round(from.yMm + (to.yMm - from.yMm) * ratio),
        sourceZMetres: (from.sourceZMetres ?? 0) + ((to.sourceZMetres ?? 0) - (from.sourceZMetres ?? 0)) * ratio,
      };
    }
    remaining -= segment;
  }
  return copyPosition(points.at(-1)!);
}

function slicePath(points: readonly CoordinateMm[], fromDistance: number, toDistance: number): CoordinateMm[] {
  const length = pathLength(points);
  const low = Math.max(0, Math.min(length, Math.min(fromDistance, toDistance)));
  const high = Math.max(0, Math.min(length, Math.max(fromDistance, toDistance)));
  const result = [pointAtDistance(points, low)];
  let cumulative = 0;
  for (let i = 1; i < points.length - 1; i++) {
    cumulative += distanceMm(points[i - 1], points[i]);
    if (cumulative > low && cumulative < high) result.push(copyPosition(points[i]));
  }
  result.push(pointAtDistance(points, high));
  return fromDistance <= toDistance ? result : result.reverse();
}

function routeAttachment(edge: NavigationRoute, point: CoordinateMm): RouteAttachment {
  let cumulative = 0;
  let best: RouteAttachment | null = null;
  for (let i = 1; i < edge.path.length; i++) {
    const from = edge.path[i - 1];
    const to = edge.path[i];
    const dx = to.xMm - from.xMm;
    const dy = to.yMm - from.yMm;
    const lengthSq = dx * dx + dy * dy;
    const ratio = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.xMm - from.xMm) * dx + (point.yMm - from.yMm) * dy) / lengthSq));
    const projected: CoordinateMm = {
      xMm: Math.round(from.xMm + dx * ratio),
      yMm: Math.round(from.yMm + dy * ratio),
      sourceZMetres: (from.sourceZMetres ?? 0) + ((to.sourceZMetres ?? 0) - (from.sourceZMetres ?? 0)) * ratio,
    };
    const segmentLength = Math.sqrt(lengthSq);
    const candidate = { edge, position: projected, distanceOnPathMm: cumulative + segmentLength * ratio, distanceFromPointMm: distanceMm(point, projected) };
    if (!best || candidate.distanceFromPointMm < best.distanceFromPointMm) best = candidate;
    cumulative += segmentLength;
  }
  return best ?? { edge, position: copyPosition(edge.path[0]), distanceOnPathMm: 0, distanceFromPointMm: distanceMm(point, edge.path[0]) };
}

function appendPath(left: readonly CoordinateMm[], right: readonly CoordinateMm[]): CoordinateMm[] {
  const result = left.map(copyPosition);
  for (const point of right) if (!result.length || distanceMm(result.at(-1)!, point) > 1) result.push(copyPosition(point));
  return result;
}

export function planRoute(world: WorldDefinition, from: CoordinateMm, to: CoordinateMm): RoutePlan | null {
  if (!Number.isFinite(from.xMm) || !Number.isFinite(from.yMm) || !Number.isFinite(to.xMm) || !Number.isFinite(to.yMm)) return null;
  if (!sameLayer(from, to) || (from.sourceZMetres ?? 0) < -2 || (to.sourceZMetres ?? 0) < -2) return null;
  if (Math.hypot(to.xMm, to.yMm) > world.activeMapRadiusKm * MM_PER_KM) return null;
  const overlay = world.navigationOverlay;
  const maxLink = overlay.maxOffRouteLinkMm;
  const nodes = new Set<string>(['H0']);
  for (const edge of overlay.routeEdges) { nodes.add(edge.fromNodeId); nodes.add(edge.toNodeId); }
  type Access = { nodeId: string; points: CoordinateMm[]; distanceMm: number; connectorMm: number; routeIds: string[] };
  const accesses = (point: CoordinateMm, isStart: boolean): Access[] => {
    const result: Access[] = [];
    for (const nodeId of nodes) {
      const position = nodePosition(world, nodeId);
      if (!position) continue;
      const connectorMm = distanceMm(point, position);
      if (connectorMm > maxLink) continue;
      result.push({ nodeId, points: isStart ? [copyPosition(point), copyPosition(position)] : [copyPosition(position), copyPosition(point)], distanceMm: connectorMm, connectorMm, routeIds: [] });
    }
    for (const edge of overlay.routeEdges) {
      const attachment = routeAttachment(edge, point);
      if (attachment.distanceFromPointMm > maxLink) continue;
      const edgeLength = pathLength(edge.path);
      const endpoints = [
        { nodeId: edge.fromNodeId, distanceOnPathMm: 0 },
        { nodeId: edge.toNodeId, distanceOnPathMm: edgeLength },
      ];
      for (const endpoint of endpoints) {
        const routePart = isStart
          ? slicePath(edge.path, attachment.distanceOnPathMm, endpoint.distanceOnPathMm)
          : slicePath(edge.path, endpoint.distanceOnPathMm, attachment.distanceOnPathMm);
        const points = isStart
          ? appendPath(appendPath([point], [attachment.position]), routePart)
          : appendPath(appendPath(routePart, [attachment.position]), [point]);
        result.push({
          nodeId: endpoint.nodeId,
          points,
          distanceMm: attachment.distanceFromPointMm + Math.abs(endpoint.distanceOnPathMm - attachment.distanceOnPathMm),
          connectorMm: attachment.distanceFromPointMm,
          routeIds: [edge.id],
        });
      }
    }
    return result;
  };
  const startCandidates = accesses(from, true);
  const endCandidates = accesses(to, false);
  let best: { points: CoordinateMm[]; distanceMm: number; routeIds: string[]; uncertainty: 'known' | 'uncertain'; tie: string } | null = null;
  const consider = (points: CoordinateMm[], distance: number, routeIds: readonly string[], uncertainty: 'known' | 'uncertain', tie: string) => {
    if (!best || distance < best.distanceMm || (distance === best.distanceMm && tie < best.tie)) {
      best = { points, distanceMm: distance, routeIds: [...new Set(routeIds)], uncertainty, tie };
    }
  };
  for (const start of startCandidates) for (const end of endCandidates) {
    const graph = routeBetweenNodes(world, start.nodeId, end.nodeId);
    if (!graph) continue;
    const points = appendPath(appendPath(start.points, graph.points), end.points);
    const routeIds = [...start.routeIds, ...graph.routeIds, ...end.routeIds];
    const tie = `${start.nodeId}|${end.nodeId}|${routeIds.join(',')}`;
    consider(points, start.distanceMm + graph.distanceMm + end.distanceMm, routeIds,
      start.connectorMm > 1 || end.connectorMm > 1 ? 'uncertain' : 'known', tie);
  }
  for (const startEdge of overlay.routeEdges) {
    const startAttachment = routeAttachment(startEdge, from);
    if (startAttachment.distanceFromPointMm > maxLink) continue;
    for (const endEdge of overlay.routeEdges) {
      if (startEdge.id !== endEdge.id) continue;
      const endAttachment = routeAttachment(endEdge, to);
      if (endAttachment.distanceFromPointMm > maxLink) continue;
      const points = appendPath(appendPath([from, startAttachment.position], slicePath(startEdge.path, startAttachment.distanceOnPathMm, endAttachment.distanceOnPathMm)), [to]);
      consider(points, startAttachment.distanceFromPointMm + Math.abs(startAttachment.distanceOnPathMm - endAttachment.distanceOnPathMm) + endAttachment.distanceFromPointMm,
        [startEdge.id], startAttachment.distanceFromPointMm > 1 || endAttachment.distanceFromPointMm > 1 ? 'uncertain' : 'known', `${startEdge.id}|DIRECT`);
    }
  }
  const direct = distanceMm(from, to);
  if (direct <= maxLink && (!best || direct < best.distanceMm)) {
    return { points: [copyPosition(from), copyPosition(to)], distanceMm: direct, uncertainty: 'uncertain', sourceRouteIds: [] };
  }
  if (best) return { points: best.points, distanceMm: best.distanceMm, uncertainty: best.uncertainty, sourceRouteIds: best.routeIds };
  return null;
}

function segmentsFromPlan(world: WorldDefinition, plan: RoutePlan, speedMmPerHour: number, idPrefix: string): MovementPathSegment[] {
  const segments: MovementPathSegment[] = [];
  for (let i = 1; i < plan.points.length; i++) {
    const from = plan.points[i - 1];
    const to = plan.points[i];
    const distance = distanceMm(from, to);
    if (distance <= 1) continue;
    const edge = world.navigationOverlay.routeEdges.find(candidate => {
      const start = routeAttachment(candidate, from);
      const end = routeAttachment(candidate, to);
      return start.distanceFromPointMm <= 2 && end.distanceFromPointMm <= 2
        && Math.abs(Math.abs(end.distanceOnPathMm - start.distanceOnPathMm) - distance) <= 3;
    });
    const sourceRouteId = edge?.id ?? null;
    const durationMs = Math.max(1, Math.ceil(distance * HOUR_MS / speedMmPerHour));
    segments.push({
      id: `${idPrefix}-SEG-${String(segments.length + 1).padStart(3, '0')}`,
      from: copyPosition(from), to: copyPosition(to), distanceMm: Math.round(distance), durationMs, progressMs: 0,
      surface: edge?.surface ?? 'overland connector · LL01-NAVIGATION-OVERLAY-1.0',
      uncertainty: sourceRouteId ? 'known' : 'uncertain',
      sourceRouteId,
    });
  }
  return segments;
}

function actorFor(state: GameState, actorId: string): Actor | null {
  if (actorId === state.player.id) return { id: actorId, position: state.player.position, unit: null, perception: Number(state.player.attributes.PER), intelligence: Number(state.player.attributes.INT) };
  const unit = state.ownedUnits.find(candidate => candidate.id === actorId);
  if (!unit || !unit.position) return null;
  return { id: actorId, position: unit.position, unit, perception: null, intelligence: null };
}

export function actorAvailability(state: GameState, actorId: string): string | null {
  const actor = actorFor(state, actorId);
  if (!actor) return 'ACTOR_NOT_OWNED_OR_UNAVAILABLE';
  if (state.travel.orders.some(order => order.actorIds.includes(actorId) && order.status === 'active')) return 'ACTOR_ALREADY_TRAVELLING';
  if (state.spatial.searchJobs.some(job => job.actorIds.includes(actorId) && job.status === 'active')) return 'ACTOR_ASSIGNED_TO_SEARCH';
  if (state.spatial.harvestJobs.some(job => job.actorIds.includes(actorId) && job.status === 'active')) return 'ACTOR_ASSIGNED_TO_HARVEST';
  if (state.construction.jobs.some(job => job.workerIds.includes(actorId) && (job.status === 'active' || job.status === 'blocked'))) return 'ACTOR_ASSIGNED_TO_CONSTRUCTION';
  return null;
}

function actorLoaded(state: GameState, actorId: string): boolean {
  const container = state.inventory.containers.find(candidate =>
    (candidate.location.kind === 'carried' && candidate.location.ownerId === actorId)
      || (candidate.location.kind === 'unit' && candidate.location.unitId === actorId));
  return Boolean(container?.stacks.some(stack => stack.templateId.startsWith('RAW-') || stack.templateId === 'WOOD' || stack.templateId === 'STONE'));
}

export function actorSpeedMmPerHour(state: GameState, world: WorldDefinition, actorId: string): number {
  const loadPermille = actorLoaded(state, actorId) ? world.navigationOverlay.loadedSpeedPermille : 1_000;
  return Math.max(1, Math.floor(world.navigationOverlay.walkSpeedMmPerHour * loadPermille / 1_000));
}

function worldWithKnownRoutes(state: GameState, world: WorldDefinition): WorldDefinition {
  const known = new Set(state.playerKnowledge.knownRouteIds);
  return {
    ...world,
    navigationOverlay: { ...world.navigationOverlay, routeEdges: world.navigationOverlay.routeEdges.filter(edge => known.has(edge.id)) },
  };
}

export function previewMovement(state: GameState, world: WorldDefinition, actorId: string, destination: CoordinateMm): { code: string | null; preview: SpatialPreview | null } {
  const unavailable = actorAvailability(state, actorId);
  if (unavailable) return { code: unavailable, preview: null };
  const actor = actorFor(state, actorId)!;
  const direct = distanceMm(actor.position, destination);
  const speed = actorSpeedMmPerHour(state, world, actorId);
  if (Math.hypot(destination.xMm, destination.yMm) > world.activeMapRadiusKm * MM_PER_KM) return { code: 'DESTINATION_OUTSIDE_ACTIVE_MAP', preview: null };
  if (!sameLayer(actor.position, destination) || (destination.sourceZMetres ?? 0) < -2) return { code: 'UNDERGROUND_ACCESS_REQUIRED', preview: null };
  const plan = planRoute(worldWithKnownRoutes(state, world), actor.position, destination);
  const hasKnownPath = Boolean(plan && plan.sourceRouteIds.length > 0);
  if (!hasKnownPath && direct > world.navigationOverlay.maxOffRouteLinkMm) return { code: 'NO_KNOWN_ROUTE', preview: null };
  const distance = hasKnownPath ? plan!.distanceMm : direct;
  return { code: null, preview: { distanceMm: Math.round(distance), etaMs: Math.ceil(distance * HOUR_MS / speed), uncertainty: hasKnownPath && plan!.uncertainty === 'known' ? 'known' : 'uncertain' } };
}

export function createMovementOrder(
  state: GameState,
  world: WorldDefinition,
  orderId: string,
  actorId: string,
  destination: CoordinateMm,
  intent: { kind: 'coordinate' | 'entity'; entityId: string | null },
): { order: MovementOrderState | null; code: string | null } {
  const unavailable = actorAvailability(state, actorId);
  if (unavailable) return { order: null, code: unavailable };
  const actor = actorFor(state, actorId)!;
  if (!Number.isFinite(destination.xMm) || !Number.isFinite(destination.yMm)
    || Math.hypot(destination.xMm, destination.yMm) > world.activeMapRadiusKm * MM_PER_KM) {
    return { order: null, code: 'DESTINATION_OUTSIDE_ACTIVE_MAP' };
  }
  if (!sameLayer(actor.position, destination) || (actor.position.sourceZMetres ?? 0) < -2 || (destination.sourceZMetres ?? 0) < -2) {
    return { order: null, code: 'UNDERGROUND_ACCESS_REQUIRED' };
  }
  const directDistance = distanceMm(actor.position, destination);
  const candidatePlan = planRoute(worldWithKnownRoutes(state, world), actor.position, destination);
  const knownPath = Boolean(candidatePlan && candidatePlan.sourceRouteIds.length > 0);
  const plan = knownPath ? candidatePlan
    : directDistance <= world.navigationOverlay.maxOffRouteLinkMm
      ? { points: [copyPosition(actor.position), copyPosition(destination)], distanceMm: directDistance, uncertainty: 'uncertain' as const, sourceRouteIds: [] }
      : null;
  if (!plan) return { order: null, code: !sameLayer(actor.position, destination) || (destination.sourceZMetres ?? 0) < -2 ? 'UNDERGROUND_ACCESS_REQUIRED' : 'NO_SUPPORTED_ROUTE' };
  const speed = actorSpeedMmPerHour(state, world, actorId);
  const pathSegments = segmentsFromPlan(world, plan, speed, orderId);
  const totalDistanceMm = pathSegments.reduce((sum, segment) => sum + segment.distanceMm, 0);
  const order: MovementOrderState = {
    id: orderId,
    actorIds: [actorId],
    originSnapshot: copyPosition(actor.position),
    destinationIntent: { kind: intent.kind, coordinate: copyPosition(destination), entityId: intent.entityId },
    pathSegments,
    totalDistanceMm,
    elapsedTravelMs: 0,
    speedMmPerHour: speed,
    costContractVersion: world.navigationOverlay.id,
    status: 'active',
    startedAtElapsedMs: state.simElapsedMs,
    completedAtElapsedMs: null,
    cancelledAtElapsedMs: null,
    interruptionCode: null,
  };
  return { order, code: null };
}

function pointAlongPolyline(points: readonly CoordinateMm[], distance: number): CoordinateMm {
  if (points.length === 0) return { xMm: 0, yMm: 0 };
  let remaining = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const segmentLength = distanceMm(from, to);
    if (remaining <= segmentLength || i === points.length - 1) {
      const ratio = segmentLength === 0 ? 1 : Math.min(1, remaining / segmentLength);
      return {
        xMm: Math.round(from.xMm + (to.xMm - from.xMm) * ratio),
        yMm: Math.round(from.yMm + (to.yMm - from.yMm) * ratio),
        sourceZMetres: (from.sourceZMetres ?? 0) + ((to.sourceZMetres ?? 0) - (from.sourceZMetres ?? 0)) * ratio,
      };
    }
    remaining -= segmentLength;
  }
  return copyPosition(points.at(-1)!);
}

function pathForOrder(order: MovementOrderState): CoordinateMm[] {
  return order.pathSegments.length === 0
    ? [copyPosition(order.originSnapshot), copyPosition(order.destinationIntent.coordinate)]
    : [copyPosition(order.pathSegments[0].from), ...order.pathSegments.map(segment => copyPosition(segment.to))];
}

function positionLocation(world: WorldDefinition, position: CoordinateMm): PlayerUnitState['location'] {
  if (distanceMm(world.origin, position) <= 1_000) return { kind: 'site', siteId: 'SITE-LL01-000' };
  const site = world.sites.find(candidate => distanceMm(candidate.position, position) <= 1_000);
  return site ? { kind: 'site', siteId: site.id } : { kind: 'field', coordinate: copyPosition(position) };
}

function applyActorPosition(state: GameState, world: WorldDefinition, actorId: string, position: CoordinateMm, orderId?: string): void {
  if (actorId === state.player.id) {
    state.player.position = copyPosition(position);
    state.player.location = orderId ? { kind: 'travel', orderId } : positionLocation(world, position);
    return;
  }
  state.ownedUnits = state.ownedUnits.map(unit => unit.id === actorId ? {
    ...unit,
    position: copyPosition(position),
    location: orderId ? { kind: 'travel', orderId } : positionLocation(world, position),
  } : unit);
}

function positionOnOrder(order: MovementOrderState, elapsedTravelMs: number): CoordinateMm {
  const segments = order.pathSegments;
  let remainingMs = Math.max(0, elapsedTravelMs);
  for (const segment of segments) {
    if (remainingMs <= segment.durationMs) {
      const ratio = segment.durationMs === 0 ? 1 : Math.min(1, remainingMs / segment.durationMs);
      return {
        xMm: Math.round(segment.from.xMm + (segment.to.xMm - segment.from.xMm) * ratio),
        yMm: Math.round(segment.from.yMm + (segment.to.yMm - segment.from.yMm) * ratio),
        sourceZMetres: (segment.from.sourceZMetres ?? 0) + ((segment.to.sourceZMetres ?? 0) - (segment.from.sourceZMetres ?? 0)) * ratio,
      };
    }
    remainingMs -= segment.durationMs;
  }
  return copyPosition(order.destinationIntent.coordinate);
}

function worldRouteIdsNear(world: WorldDefinition, position: CoordinateMm, radiusMm: number): string[] {
  const nearSegment = (a: CoordinateMm, b: CoordinateMm): boolean => distancePointToSegmentMm(position, a, b) <= radiusMm;
  return world.navigationOverlay.routeEdges.filter(edge => edge.path.slice(1).some((point, index) => nearSegment(edge.path[index], point))).map(edge => edge.id);
}

export function distancePointToSegmentMm(point: CoordinateMm, from: CoordinateMm, to: CoordinateMm): number {
  const dx = to.xMm - from.xMm;
  const dy = to.yMm - from.yMm;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.xMm - from.xMm) * dx + (point.yMm - from.yMm) * dy) / lengthSq));
  return Math.hypot(point.xMm - (from.xMm + t * dx), point.yMm - (from.yMm + t * dy));
}

function snapPosition(position: CoordinateMm, gridMm: number): CoordinateMm {
  return { xMm: Math.round(position.xMm / gridMm) * gridMm, yMm: Math.round(position.yMm / gridMm) * gridMm, sourceZMetres: position.sourceZMetres ?? 0 };
}

function signalFor(state: GameState, input: Omit<SpatialSignalState, 'signalId'>): SpatialSignalState {
  const signalId = `SIGNAL-${canonicalStateHash({ saveId: state.saveId, seed: state.seed, targetType: input.targetType, targetId: input.targetId }).slice(0, 20).toUpperCase()}`;
  return { ...input, signalId };
}

function updateKnowledgeAt(state: GameState, world: WorldDefinition, at: number): void {
  const actorPositions = [
    { id: state.player.id, position: state.player.position },
    ...state.ownedUnits.filter(unit => unit.position).map(unit => ({ id: unit.id, position: unit.position! })),
  ];
  const minuteOfDay = Math.floor(((at + 7 * HOUR_MS) % (24 * HOUR_MS)) / 60_000);
  const lightPermille = minuteOfDay >= 570 && minuteOfDay < 990 ? 1_000 : minuteOfDay >= 990 && minuteOfDay < 1_020 ? world.navigationOverlay.twilightSightPermille : world.navigationOverlay.nightSightPermille;
  const sightRangeMm = Math.floor(world.navigationOverlay.sightRangeMm * lightPermille / 1_000);
  let knownSiteIds = [...state.playerKnowledge.knownSiteIds];
  let knownResourceIds = [...state.playerKnowledge.knownResourceIds];
  let knownRouteIds = [...state.playerKnowledge.knownRouteIds];
  const lastSeenByEntity = { ...state.playerKnowledge.lastSeenByEntity };
  let signals = [...state.spatial.signals];
  let knownSignalIds = [...state.playerKnowledge.knownSignalIds];
  const index = buildSpatialIndex(world, actorPositions);

  for (const observer of actorPositions) {
    for (const entry of querySpatialIndex(index, observer.position, Math.max(sightRangeMm, world.navigationOverlay.signalRangeMm))) {
      if (entry.kind === 'site') {
        const site = world.sites.find(candidate => candidate.id === entry.id);
        if (site && sameLayer(observer.position, site.position) && distanceMm(observer.position, site.position) <= sightRangeMm) {
          knownSiteIds.push(site.id);
          lastSeenByEntity[`site:${site.id}`] = { observedAtElapsedMs: at, knowledge: 'current' };
        }
      }
      if (entry.kind === 'resource') {
        const resource = world.resources.find(candidate => candidate.id === entry.id);
        if (resource && sameLayer(observer.position, resource.location) && distanceMm(observer.position, resource.location) <= sightRangeMm) {
          knownResourceIds.push(resource.id);
          lastSeenByEntity[`resource:${resource.id}`] = { observedAtElapsedMs: at, knowledge: 'current' };
        }
      }
      if (entry.kind === 'cache' && distanceMm(observer.position, entry.position) <= world.navigationOverlay.signalRangeMm) {
        const exists = signals.some(signal => signal.targetType === 'cache' && signal.targetId === entry.id);
        if (!exists) {
          const signal = signalFor(state, {
            targetType: 'cache', targetId: entry.id, exactPosition: copyPosition(entry.position),
            approximatePosition: snapPosition(entry.position, 100_000), accuracyMm: 100_000,
            discovery: 'signal', discoveredAtElapsedMs: at,
          });
          signals = [...signals, signal];
          knownSignalIds.push(signal.signalId);
        }
      }
    }
    knownRouteIds.push(...worldRouteIdsNear(world, observer.position, world.navigationOverlay.signalRangeMm));
    const geometryId = `OBS-${observer.id}-${observer.position.xMm}-${observer.position.yMm}-${observer.position.sourceZMetres ?? 0}-${sightRangeMm}`;
    if (!state.exploration.exploredGeometry.some(area => area.id === geometryId)) {
      state.exploration = {
        ...state.exploration,
        exploredGeometry: [...state.exploration.exploredGeometry, { id: geometryId, kind: 'circle', points: [copyPosition(observer.position)], radiusMm: sightRangeMm }],
      };
    }
  }

  state.fieldChestStates = state.fieldChestStates.map(chest => {
    const signal = signals.find(candidate => candidate.targetId === chest.chestId);
    return signal && chest.discovery === 'hidden'
      ? { ...chest, discovery: 'signal', discoveredAtElapsedMs: signal.discoveredAtElapsedMs, signalId: signal.signalId }
      : chest;
  });

  state.playerKnowledge = {
    ...state.playerKnowledge,
    knownSiteIds: [...new Set(knownSiteIds)].sort(),
    knownResourceIds: [...new Set(knownResourceIds)].sort(),
    knownRouteIds: [...new Set(knownRouteIds)].sort(),
    knownSignalIds: [...new Set(knownSignalIds)].sort(),
    lastSeenByEntity,
  };
  state.spatial = { ...state.spatial, signals };
}

export function seedSpatialKnowledge(state: GameState, world: WorldDefinition): void {
  updateKnowledgeAt(state, world, state.simElapsedMs);
}

export function currentSight(state: GameState, world: WorldDefinition): readonly { center: CoordinateMm; radiusMm: number; source: 'player' | 'unit' }[] {
  const minuteOfDay = Math.floor(((state.simElapsedMs + 7 * HOUR_MS) % (24 * HOUR_MS)) / 60_000);
  const lightPermille = minuteOfDay >= 570 && minuteOfDay < 990 ? 1_000 : minuteOfDay >= 990 && minuteOfDay < 1_020 ? world.navigationOverlay.twilightSightPermille : world.navigationOverlay.nightSightPermille;
  const radiusMm = Math.floor(world.navigationOverlay.sightRangeMm * lightPermille / 1_000);
  return [
    { center: state.player.position, radiusMm, source: 'player' as const },
    ...state.ownedUnits.filter(unit => unit.position).map(unit => ({ center: unit.position!, radiusMm, source: 'unit' as const })),
  ];
}

function actorContainer(state: GameState, actorId: string) {
  return state.inventory.containers.find(container => (container.location.kind === 'carried' && container.location.ownerId === actorId)
    || (container.location.kind === 'unit' && container.location.unitId === actorId));
}

function chestIsSearchEligible(accessStatement: string): boolean {
  return !/sealed|deep|owned|quest[- ]locked|chống sập|yêu cầu chống|khóa|niêm phong/i.test(accessStatement);
}

function cellIdsCoveredByLane(from: CoordinateMm, to: CoordinateMm, laneWidthMm: number): string[] {
  const radius = laneWidthMm / 2;
  const minX = Math.floor((Math.min(from.xMm, to.xMm) - radius) / SEARCH_CELL_MM);
  const maxX = Math.floor((Math.max(from.xMm, to.xMm) + radius) / SEARCH_CELL_MM);
  const minY = Math.floor((Math.min(from.yMm, to.yMm) - radius) / SEARCH_CELL_MM);
  const maxY = Math.floor((Math.max(from.yMm, to.yMm) + radius) / SEARCH_CELL_MM);
  const ids: string[] = [];
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
    const center = { xMm: x * SEARCH_CELL_MM + SEARCH_CELL_MM / 2, yMm: y * SEARCH_CELL_MM + SEARCH_CELL_MM / 2 };
    if (distancePointToSegmentMm(center, from, to) <= radius + SEARCH_CELL_MM / Math.SQRT2) ids.push(`${x}:${y}`);
  }
  return ids;
}

function addCargo(state: GameState, actorId: string, jobId: string, materialId: string): boolean {
  const container = actorContainer(state, actorId);
  if (!container) return false;
  const currentUnits = container.stacks.filter(stack => ['WOOD', 'STONE', 'RAW-ICE-WATER', 'BROWN-COAL', 'RAW-SALT'].includes(stack.templateId))
    .reduce((sum, stack) => sum + stack.quantity, 0);
  if (currentUnits + 1 > MAX_CARRIED_RESOURCE_UNITS) return false;
  const itemOrdinal = (state.spatial.harvestJobs.find(job => job.id === jobId)?.extractedQuantity ?? 0) + 1;
  const itemId = `${jobId}-CARGO-${String(itemOrdinal).padStart(4, '0')}`;
  state.inventory = {
    containers: state.inventory.containers.map(candidate => candidate.id === container.id ? {
      ...candidate,
      stacks: [...candidate.stacks, { itemId, templateId: materialId, quantity: 1, reservedQuantity: 0, unit: 'item', ownerId: actorId, equipped: false, equippedSlotId: null, quality: null, provenance: 'immutable_source_fact' as const }],
    } : candidate),
  };
  return true;
}

export function startSearchJob(state: GameState, world: WorldDefinition, jobId: string, actorId: string, center: CoordinateMm, radiusMm: number): { job: SearchJobState | null; code: string | null } {
  const unavailable = actorAvailability(state, actorId);
  if (unavailable) return { job: null, code: unavailable };
  const actor = actorFor(state, actorId)!;
  if (actor.perception === null || actor.intelligence === null) return { job: null, code: 'SEARCHER_ATTRIBUTES_NOT_COMPILED' };
  if (!sameLayer(actor.position, center) || (center.sourceZMetres ?? 0) < -2) return { job: null, code: 'UNDERGROUND_ACCESS_REQUIRED' };
  if (distanceMm(actor.position, center) > world.navigationOverlay.interactionRangeMm) return { job: null, code: 'SEARCH_CENTER_OUT_OF_REACH' };
  if (radiusMm < 1 || radiusMm > 2 * MM_PER_KM) return { job: null, code: 'SEARCH_ENVELOPE_OUT_OF_BOUNDS' };
  if (Math.hypot(center.xMm, center.yMm) > world.activeMapRadiusKm * MM_PER_KM) return { job: null, code: 'SEARCH_ENVELOPE_OUTSIDE_ACTIVE_MAP' };
  const end = { xMm: center.xMm + radiusMm, yMm: center.yMm, sourceZMetres: center.sourceZMetres ?? 0 };
  if (Math.hypot(end.xMm, end.yMm) > world.activeMapRadiusKm * MM_PER_KM) return { job: null, code: 'SEARCH_ENVELOPE_OUTSIDE_ACTIVE_MAP' };
  const laneWidthMm = Math.max(25_000, Math.min(120_000, 25_000 + 3_000 * actor.perception));
  return {
    code: null,
    job: {
      id: jobId,
      observerLineageId: `OBSERVER-LINEAGE-${actorId}`,
      actorIds: [actorId],
      center: copyPosition(center),
      envelopeRadiusMm: radiusMm,
      laneWidthMm,
      path: [copyPosition(actor.position), end],
      pathProgressMm: 0,
      tickStartProgressMm: 0,
      tickStartAtElapsedMs: state.simElapsedMs,
      lastSettledAtElapsedMs: state.simElapsedMs,
      startedAtElapsedMs: state.simElapsedMs,
      nextTickAtElapsedMs: state.simElapsedMs + SPATIAL_TICK_MS,
      tickMinutes: 15,
      status: 'active',
      haulAssignmentId: null,
      grossAreaM2: 0,
      uniqueAreaM2: 0,
      repeatedAreaM2: 0,
      interruptionCode: null,
    },
  };
}

function resourceSite(world: WorldDefinition, resource: WorldResource): CoordinateMm {
  return resource.location;
}

export function startHarvestJob(
  state: GameState,
  world: WorldDefinition,
  jobId: string,
  actorId: string,
  resourceId: string,
  materialId: string,
  quantity: number,
  toolItemId: string,
): { job: HarvestJobState | null; code: string | null } {
  const unavailable = actorAvailability(state, actorId);
  if (unavailable) return { job: null, code: unavailable };
  const resource = world.resources.find(candidate => candidate.id === resourceId);
  if (!resource || !state.playerKnowledge.knownResourceIds.includes(resourceId)) return { job: null, code: 'RESOURCE_NOT_ACCESSIBLE' };
  if (resource.materialId !== materialId) return { job: null, code: 'RESOURCE_MATERIAL_MISMATCH' };
  if (resource.access !== 'open_surface' || !resource.requiredToolTemplateId) {
    return { job: null, code: resource.access === 'survey_required' ? 'PROSPECTING_CONTRACT_NOT_COMPILED' : resource.access === 'frozen_water' ? 'WATER_PREPARATION_CONTRACT_NOT_COMPILED' : 'WORKFORCE_AND_FUEL_REQUIREMENTS_NOT_MET' };
  }
  const toolContainer = actorContainer(state, actorId);
  const tool = toolContainer?.stacks.find(stack => stack.itemId === toolItemId && stack.templateId === resource.requiredToolTemplateId && stack.quantity >= 1);
  if (!tool) return { job: null, code: 'REQUIRED_TOOL_NOT_CARRIED' };
  if (state.jobs.some(existing => existing.status === 'active' && existing.reservedItemIds.includes(toolItemId))) return { job: null, code: 'TOOL_ALREADY_RESERVED' };
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { job: null, code: 'HARVEST_QUANTITY_INVALID' };
  const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === resourceId);
  if (!balance || balance.remaining - balance.reserved < quantity) return { job: null, code: 'INSUFFICIENT_RESOURCE' };
  const cargo = actorContainer(state, actorId);
  const carried = cargo?.stacks.filter(stack => ['WOOD', 'STONE', 'RAW-ICE-WATER', 'BROWN-COAL', 'RAW-SALT'].includes(stack.templateId)).reduce((sum, stack) => sum + stack.quantity, 0) ?? 0;
  if (carried + quantity > MAX_CARRIED_RESOURCE_UNITS) return { job: null, code: 'LOAD_CAPACITY_EXCEEDED' };
  const actor = actorFor(state, actorId)!;
  const workPosition = resourceSite(world, resource);
  const knownWorld = worldWithKnownRoutes(state, world);
  const outPlan = planRoute(knownWorld, actor.position, workPosition);
  const returnPlan = planRoute(knownWorld, workPosition, actor.position);
  if (!outPlan || !returnPlan) return { job: null, code: 'NO_SUPPORTED_ROUTE' };
  const speed = actorSpeedMmPerHour(state, world, actorId);
  const job: HarvestJobState = {
    id: jobId,
    actorIds: [actorId],
    resourceId,
    materialId,
    requestedQuantity: quantity,
    extractedQuantity: 0,
    reservedQuantity: quantity,
    toolItemId,
    originSnapshot: copyPosition(actor.position),
    workPosition: copyPosition(workPosition),
    routeOut: outPlan.points,
    routeReturn: returnPlan.points,
    routeOutDistanceMm: outPlan.distanceMm,
    routeReturnDistanceMm: returnPlan.distanceMm,
    speedMmPerHour: speed,
    stage: outPlan.distanceMm > 1 ? 'outbound' : 'working',
    routeProgressMm: 0,
    workProgressMs: 0,
    nextTickAtElapsedMs: state.simElapsedMs + (outPlan.distanceMm > 1 ? Math.ceil(outPlan.distanceMm * HOUR_MS / speed) : 0) + SPATIAL_TICK_MS,
    lastSettledAtElapsedMs: state.simElapsedMs,
    startedAtElapsedMs: state.simElapsedMs,
    status: 'active',
    interruptionCode: null,
  };
  return { job, code: null };
}

export function startMovement(state: GameState, world: WorldDefinition, orderId: string, actorId: string, destination: CoordinateMm, intent: { kind: 'coordinate' | 'entity'; entityId: string | null }): { state: GameState; order: MovementOrderState | null; code: string | null } {
  const result = createMovementOrder(state, world, orderId, actorId, destination, intent);
  if (!result.order) return { state, order: null, code: result.code };
  const order = result.order;
  const next = structuredClone(state);
  next.travel.orders = [...next.travel.orders, order];
  next.travel.activeOrderId = order.id;
  next.travel.routeId = order.pathSegments.find(segment => segment.sourceRouteId)?.sourceRouteId ?? null;
  next.jobs = [...next.jobs, { id: order.id, kind: 'movement', status: 'active', actorIds: [...order.actorIds], reservedItemIds: [], startedAtElapsedMs: order.startedAtElapsedMs, completedAtElapsedMs: null }];
  next.spatial.movementOrders = next.travel.orders;
  applyActorPosition(next, world, actorId, order.originSnapshot, order.id);
  return { state: next, order, code: null };
}

export function cancelTravel(state: GameState, world: WorldDefinition, orderId: string, at: number): { state: GameState; event: SpatialEvent | null; code: string | null } {
  const order = state.travel.orders.find(candidate => candidate.id === orderId && candidate.status === 'active');
  if (!order) return { state, event: null, code: 'MOVEMENT_ORDER_NOT_ACTIVE' };
  const next = structuredClone(state);
  next.travel.orders = next.travel.orders.map(candidate => candidate.id === orderId ? { ...candidate, status: 'cancelled', cancelledAtElapsedMs: at } : candidate);
  const current = next.travel.orders.find(candidate => candidate.id === orderId)!;
  for (const actorId of current.actorIds) applyActorPosition(next, world, actorId, actorFor(next, actorId)!.position);
  next.spatial.movementOrders = next.travel.orders;
  next.travel.activeOrderId = next.travel.orders.find(candidate => candidate.status === 'active')?.id ?? null;
  next.travel.routeId = next.travel.orders.find(candidate => candidate.status === 'active')?.pathSegments.find(segment => segment.sourceRouteId)?.sourceRouteId ?? null;
  next.jobs = next.jobs.map(job => job.id === orderId ? { ...job, status: 'cancelled', completedAtElapsedMs: at } : job);
  return { state: next, code: null, event: { type: 'movement_order_cancelled', occurredAtElapsedMs: at, payload: { orderId, elapsedTravelMs: current.elapsedTravelMs } } };
}

export function transferItem(state: GameState, world: WorldDefinition, actorId: string, sourceContainerId: string, destinationContainerId: string, itemId: string, quantity: number): { state: GameState; code: string | null } {
  if (actorId !== state.player.id) return { state, code: 'ACTOR_UNAVAILABLE' };
  const actor = actorFor(state, actorId);
  if (!actor || actorAvailability(state, actorId)) return { state, code: 'ACTOR_UNAVAILABLE' };
  const source = state.inventory.containers.find(container => container.id === sourceContainerId);
  const destination = state.inventory.containers.find(container => container.id === destinationContainerId);
  if (!source || !destination) return { state, code: 'CONTAINER_NOT_ACCESSIBLE' };
  const isContainerReachable = (containerId: string): boolean => {
    if (containerId === 'LL-CNT-CARRIED-FOOD-BAG-01') return destinationContainerId === containerId ? true : sourceContainerId === containerId;
    const container = state.inventory.containers.find(candidate => candidate.id === containerId);
    if (!container || container.location.kind !== 'site') return false;
    const target = world.sites.find(site => site.id === container.location.siteId);
    return Boolean(target && distanceMm(actor.position, target.position) <= world.navigationOverlay.interactionRangeMm && container.observed);
  };
  if (!isContainerReachable(sourceContainerId) || !isContainerReachable(destinationContainerId)) return { state, code: 'CONTAINER_NOT_ACCESSIBLE' };
  const stack = source.stacks.find(candidate => candidate.itemId === itemId);
  if (!stack || !Number.isSafeInteger(quantity) || quantity < 1 || stack.quantity - (stack.reservedQuantity ?? 0) < quantity) return { state, code: 'ITEM_QUANTITY_UNAVAILABLE' };
  if (sourceContainerId === destinationContainerId) return { state, code: 'CONTAINER_TRANSFER_SAME_SOURCE' };
  const movedItemId = quantity === stack.quantity ? itemId : `${itemId}-MOVE-${canonicalStateHash({ itemId, quantity, rev: state.revision }).slice(0, 12).toUpperCase()}`;
  if (destination.stacks.some(candidate => candidate.itemId === movedItemId)) return { state, code: 'ITEM_ID_COLLISION' };
  if (destination.capacitySlots !== null && destination.stacks.length >= destination.capacitySlots) return { state, code: 'DESTINATION_CAPACITY_FULL' };
  const next = structuredClone(state);
  next.inventory = {
    containers: next.inventory.containers.map(container => {
      if (container.id === sourceContainerId) return {
        ...container,
        stacks: container.stacks.flatMap(candidate => candidate.itemId !== itemId ? [candidate]
          : candidate.quantity === quantity ? [] : [{ ...candidate, quantity: candidate.quantity - quantity }]),
      };
      if (container.id === destinationContainerId) return {
        ...container,
        observed: true,
        stacks: [...container.stacks, { ...stack, itemId: movedItemId, quantity, reservedQuantity: 0, ownerId: container.location.kind === 'carried' ? container.location.ownerId : container.location.kind === 'unit' ? container.location.unitId : 'H0', equipped: false, equippedSlotId: null }],
      };
      return container;
    }),
  };
  if (destination.kind === 'carried_bag') next.bagSeed = { ...next.bagSeed, inspected: true };
  return { state: next, code: null };
}

export function nextSpatialBoundary(state: GameState): number | null {
  const candidates = [
    ...state.travel.orders.filter(order => order.status === 'active').flatMap(order => {
      const totalDuration = order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
      const remaining = Math.max(0, totalDuration - order.elapsedTravelMs);
      const untilTick = SPATIAL_TICK_MS - (order.elapsedTravelMs % SPATIAL_TICK_MS || 0);
      let elapsed = 0;
      const segmentEnds = order.pathSegments.flatMap(segment => {
        elapsed += segment.durationMs;
        return elapsed > order.elapsedTravelMs ? [state.simElapsedMs + elapsed - order.elapsedTravelMs] : [];
      });
      return [state.simElapsedMs + Math.min(untilTick, remaining), ...segmentEnds];
    }),
    ...state.spatial.searchJobs.filter(job => job.status === 'active').map(job => job.nextTickAtElapsedMs),
    ...state.spatial.harvestJobs.filter(job => job.status === 'active').map(job => {
      if (job.stage === 'outbound') return state.simElapsedMs + Math.ceil(Math.max(0, job.routeOutDistanceMm - job.routeProgressMm) * HOUR_MS / job.speedMmPerHour);
      if (job.stage === 'returning') return state.simElapsedMs + Math.ceil(Math.max(0, job.routeReturnDistanceMm - job.routeProgressMm) * HOUR_MS / job.speedMmPerHour);
      return job.nextTickAtElapsedMs;
    }),
  ].filter(value => Number.isSafeInteger(value) && value >= state.simElapsedMs);
  return candidates.length ? Math.min(...candidates) : null;
}

export function integrateSpatialTo(state: GameState, world: WorldDefinition, target: number): void {
  const delta = Math.max(0, target - state.simElapsedMs);
  if (delta === 0) return;
  state.travel.orders = state.travel.orders.map(order => {
    if (order.status !== 'active') return order;
    const totalDuration = order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
    const elapsedTravelMs = Math.min(totalDuration, Math.max(0, order.elapsedTravelMs + delta));
    let remaining = elapsedTravelMs;
    const pathSegments = order.pathSegments.map(segment => {
      const progressMs = Math.min(segment.durationMs, Math.max(0, remaining));
      remaining -= progressMs;
      return { ...segment, progressMs };
    });
    const updated = { ...order, elapsedTravelMs, pathSegments };
    const position = positionOnOrder(updated, elapsedTravelMs);
    for (const actorId of updated.actorIds) applyActorPosition(state, world, actorId, position, updated.id);
    return updated;
  });
  state.spatial.movementOrders = state.travel.orders;

  state.spatial.searchJobs = state.spatial.searchJobs.map(job => {
    if (job.status !== 'active') return job;
    const speed = actorSpeedMmPerHour(state, world, job.actorIds[0]);
    const current = Math.min(polylineDistance(job.path), job.tickStartProgressMm + Math.floor(speed * Math.max(0, target - job.tickStartAtElapsedMs) / HOUR_MS));
    const position = pointAlongPolyline(job.path, current);
    applyActorPosition(state, world, job.actorIds[0], position);
    return { ...job, pathProgressMm: current, lastSettledAtElapsedMs: target };
  });

  state.spatial.harvestJobs = state.spatial.harvestJobs.map(job => {
    if (job.status !== 'active') return job;
    const elapsed = Math.max(0, target - job.lastSettledAtElapsedMs);
    if (job.stage === 'working') return { ...job, workProgressMs: job.workProgressMs + elapsed, lastSettledAtElapsedMs: target };
    const position = job.stage === 'outbound' ? pointAlongPolyline(job.routeOut, job.routeProgressMm + Math.floor(job.speedMmPerHour * elapsed / HOUR_MS))
      : pointAlongPolyline(job.routeReturn, job.routeProgressMm + Math.floor(job.speedMmPerHour * elapsed / HOUR_MS));
    const limit = job.stage === 'outbound' ? job.routeOutDistanceMm : job.routeReturnDistanceMm;
    const routeProgressMm = Math.min(limit, job.routeProgressMm + Math.floor(job.speedMmPerHour * elapsed / HOUR_MS));
    applyActorPosition(state, world, job.actorIds[0], position);
    return { ...job, routeProgressMm, lastSettledAtElapsedMs: target };
  });
  state.simElapsedMs = target;
  updateKnowledgeAt(state, world, target);
}

function polylineDistance(points: readonly CoordinateMm[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distanceMm(points[index], point), 0);
}

function lineageHistory(state: GameState, lineageId: string): SpatialSweepHistory {
  return state.spatial.sweepHistory.find(history => history.observerLineageId === lineageId)
    ?? { observerLineageId: lineageId, cellIds: [], focusedMinutesByChest: {}, lastSettledAtElapsedMs: state.simElapsedMs };
}

function isAvailableChest(chestId: string, state: GameState, world: WorldDefinition): boolean {
  const source = world.fieldChests.find(candidate => candidate.id === chestId);
  const runtime = state.fieldChestStates.find(candidate => candidate.chestId === chestId);
  return Boolean(source && runtime && runtime.state === 'unopened' && runtime.discovery === 'hidden' && runtime.custody === 'world' && chestIsSearchEligible(source.accessStatement));
}

function addDiscoveredChestSignal(state: GameState, world: WorldDefinition, chestId: string, at: number): string {
  const prior = state.spatial.signals.find(signal => signal.targetId === chestId);
  if (prior) return prior.signalId;
  const position = world.fieldChests.find(candidate => candidate.id === chestId)?.position;
  if (!position) throw new Error('FIELD_CHEST_SOURCE_MISSING');
  const signal = signalFor(state, {
    targetType: 'cache', targetId: chestId, exactPosition: copyPosition(position),
    approximatePosition: snapPosition(position, 100_000), accuracyMm: 100_000,
    discovery: 'signal', discoveredAtElapsedMs: at,
  });
  state.spatial = { ...state.spatial, signals: [...state.spatial.signals, signal] };
  state.playerKnowledge = { ...state.playerKnowledge, knownSignalIds: [...new Set([...state.playerKnowledge.knownSignalIds, signal.signalId])] };
  return signal.signalId;
}

function detectChests(state: GameState, world: WorldDefinition, job: SearchJobState, from: CoordinateMm, to: CoordinateMm, at: number): string[] {
  const actor = actorFor(state, job.actorIds[0]);
  if (!actor || actor.perception === null || actor.intelligence === null) return [];
  const history = lineageHistory(state, job.observerLineageId);
  const index = buildSpatialIndex(world);
  const minX = Math.min(from.xMm, to.xMm) - job.laneWidthMm / 2;
  const maxX = Math.max(from.xMm, to.xMm) + job.laneWidthMm / 2;
  const minY = Math.min(from.yMm, to.yMm) - job.laneWidthMm / 2;
  const maxY = Math.max(from.yMm, to.yMm) + job.laneWidthMm / 2;
  const center = { xMm: Math.round((minX + maxX) / 2), yMm: Math.round((minY + maxY) / 2) };
  const radius = Math.hypot(maxX - minX, maxY - minY) / 2 + job.laneWidthMm;
  const candidates = querySpatialIndex(index, center, radius).filter(entry => entry.kind === 'chest')
    .map(entry => world.fieldChests.find(chest => chest.id === entry.id)!)
    .filter(chest => chest.position.xMm >= minX - 1 && chest.position.xMm <= maxX + 1 && chest.position.yMm >= minY - 1 && chest.position.yMm <= maxY + 1)
    .filter(chest => distanceMm(chest.position, job.center) <= job.envelopeRadiusMm)
    .filter(chest => sameLayer(chest.position, from) && distancePointToSegmentMm(chest.position, from, to) <= job.laneWidthMm / 2)
    .filter(chest => isAvailableChest(chest.id, state, world))
    .map(chest => {
      const chestOrdinal = Number(chest.id.slice(-3));
      const offset = (chestOrdinal - 1) % 5;
      const concealmentBase = chest.grade === 'Mộc' ? 8 : chest.grade === 'Thanh Đồng' ? 12 : chest.grade === 'Bạch Ngân' ? 16 : chest.grade === 'Hoàng Kim' ? 20 : 24;
      const localMinutes = (history.focusedMinutesByChest[chest.id] ?? 0) + job.tickMinutes;
      const directDistance = distancePointToSegmentMm(chest.position, from, to);
      const score = actor.perception! + Math.floor(actor.intelligence! / 2) + Math.floor(localMinutes / 10) + (directDistance <= 2_000 ? 10 : 0);
      return { chest, score, concealment: concealmentBase + offset, distance: directDistance, localMinutes };
    })
    .sort((a, b) => a.distance - b.distance || a.chest.id.localeCompare(b.chest.id));
  const minutes = { ...history.focusedMinutesByChest };
  for (const item of candidates) minutes[item.chest.id] = item.localMinutes;
  state.spatial = {
    ...state.spatial,
    sweepHistory: [...state.spatial.sweepHistory.filter(candidate => candidate.observerLineageId !== job.observerLineageId), {
      ...history,
      focusedMinutesByChest: minutes,
      lastSettledAtElapsedMs: at,
    }],
  };
  const found = candidates.filter(candidate => candidate.score >= candidate.concealment).slice(0, 1);
  for (const item of found) {
    const signalId = addDiscoveredChestSignal(state, world, item.chest.id, at);
    state.fieldChestStates = state.fieldChestStates.map(chest => chest.chestId === item.chest.id ? {
      ...chest, discovery: 'signal', discoveredAtElapsedMs: at, signalId, custody: 'world',
    } : chest);
  }
  return found.map(item => item.chest.id);
}

export function settleSpatialBoundary(state: GameState, world: WorldDefinition, at: number): SpatialEvent[] {
  const events: SpatialEvent[] = [];
  const arrivals = state.travel.orders.filter(order => order.status === 'active'
    && order.elapsedTravelMs >= order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0));
  for (const order of arrivals) {
    state.travel.orders = state.travel.orders.map(candidate => candidate.id === order.id ? { ...candidate, status: 'completed', completedAtElapsedMs: at } : candidate);
    for (const actorId of order.actorIds) applyActorPosition(state, world, actorId, order.destinationIntent.coordinate);
    state.jobs = state.jobs.map(job => job.id === order.id ? { ...job, status: 'completed', completedAtElapsedMs: at } : job);
    for (const edge of world.navigationOverlay.routeEdges.filter(candidate => order.pathSegments.some(segment => segment.sourceRouteId === candidate.id))) {
      if (!state.playerKnowledge.knownRouteIds.includes(edge.id)) state.playerKnowledge = { ...state.playerKnowledge, knownRouteIds: [...state.playerKnowledge.knownRouteIds, edge.id].sort() };
    }
    events.push({ type: 'movement_order_completed', occurredAtElapsedMs: at, payload: { orderId: order.id, actorIds: order.actorIds, distanceMm: order.totalDistanceMm } });
  }
  if (arrivals.length > 0) {
    state.travel.activeOrderId = state.travel.orders.find(order => order.status === 'active')?.id ?? null;
    state.travel.routeId = state.travel.orders.find(order => order.status === 'active')?.pathSegments.find(segment => segment.sourceRouteId)?.sourceRouteId ?? null;
  }
  state.spatial.movementOrders = state.travel.orders;

  for (const job of state.spatial.searchJobs.filter(candidate => candidate.status === 'active' && candidate.nextTickAtElapsedMs === at)) {
    const start = pointAlongPolyline(job.path, job.tickStartProgressMm);
    const end = pointAlongPolyline(job.path, job.pathProgressMm);
    const distance = distanceMm(start, end);
    const grossArea = distance * job.laneWidthMm / (MM_PER_M * MM_PER_M);
    const history = lineageHistory(state, job.observerLineageId);
    const cells = cellIdsCoveredByLane(start, end, job.laneWidthMm);
    const priorCells = new Set(history.cellIds);
    const freshCells = cells.filter(id => !priorCells.has(id));
    const newHistory = { ...history, cellIds: [...new Set([...history.cellIds, ...cells])], lastSettledAtElapsedMs: at };
    state.spatial = { ...state.spatial, sweepHistory: [...state.spatial.sweepHistory.filter(candidate => candidate.observerLineageId !== job.observerLineageId), newHistory] };
    const foundChestIds = detectChests(state, world, job, start, end, at);
    const nextProgress = job.pathProgressMm;
    const completed = nextProgress >= polylineDistance(job.path) - 1;
    state.spatial.searchJobs = state.spatial.searchJobs.map(candidate => candidate.id === job.id ? {
      ...candidate,
      tickStartProgressMm: nextProgress,
      tickStartAtElapsedMs: at,
      lastSettledAtElapsedMs: at,
      nextTickAtElapsedMs: at + SPATIAL_TICK_MS,
      status: completed ? 'completed' : candidate.status,
      grossAreaM2: candidate.grossAreaM2 + grossArea,
      uniqueAreaM2: candidate.uniqueAreaM2 + freshCells.length * SEARCH_CELL_MM * SEARCH_CELL_MM / (MM_PER_M * MM_PER_M),
      repeatedAreaM2: candidate.repeatedAreaM2 + Math.max(0, grossArea - freshCells.length * SEARCH_CELL_MM * SEARCH_CELL_MM / (MM_PER_M * MM_PER_M)),
    } : candidate);
    state.jobs = state.jobs.map(candidate => candidate.id === job.id ? { ...candidate, status: completed ? 'completed' : 'active', completedAtElapsedMs: completed ? at : null } : candidate);
    if (completed) state.exploration.searchHistory = state.exploration.searchHistory.map(entry => entry.searchId === job.id ? { ...entry, status: 'completed' } : entry);
    events.push({ type: 'spatial_search_tick_settled', occurredAtElapsedMs: at, payload: { jobId: job.id, grossAreaM2: grossArea, uniqueCells: freshCells.length, found: foundChestIds.length > 0 } });
    for (const chestId of foundChestIds) events.push({ type: 'chest_signal_detected', occurredAtElapsedMs: at, payload: { jobId: job.id, chestId } });
    if (completed) events.push({ type: 'spatial_search_completed', occurredAtElapsedMs: at, payload: { jobId: job.id } });
  }

  for (const job of state.spatial.harvestJobs.filter(candidate => candidate.status === 'active')) {
    if (job.stage === 'outbound' && job.routeProgressMm >= job.routeOutDistanceMm - 1) {
      state.spatial.harvestJobs = state.spatial.harvestJobs.map(candidate => candidate.id === job.id ? {
        ...candidate, stage: 'working', routeProgressMm: 0, nextTickAtElapsedMs: at + SPATIAL_TICK_MS, lastSettledAtElapsedMs: at,
      } : candidate);
      applyActorPosition(state, world, job.actorIds[0], job.workPosition);
      events.push({ type: 'harvest_arrived_at_workfront', occurredAtElapsedMs: at, payload: { jobId: job.id, resourceId: job.resourceId } });
      continue;
    }
    if (job.stage === 'working' && job.nextTickAtElapsedMs === at) {
      const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === job.resourceId);
      const container = actorContainer(state, job.actorIds[0]);
      const cargoUnits = container?.stacks.filter(stack => ['WOOD', 'STONE', 'RAW-ICE-WATER', 'BROWN-COAL', 'RAW-SALT'].includes(stack.templateId)).reduce((sum, stack) => sum + stack.quantity, 0) ?? MAX_CARRIED_RESOURCE_UNITS;
      let extracted = job.extractedQuantity;
      let remainingWork = job.workProgressMs;
      let code: string | null = null;
      if (!balance) code = 'RESOURCE_BALANCE_MISSING';
      if (cargoUnits >= MAX_CARRIED_RESOURCE_UNITS) code = 'LOAD_CAPACITY_EXCEEDED';
      if (remainingWork >= WORK_MS_PER_RESOURCE_UNIT && balance && balance.remaining > 0) {
        if (!addCargo(state, job.actorIds[0], job.id, job.materialId)) code = 'LOAD_CAPACITY_EXCEEDED';
        else {
          extracted += 1;
          remainingWork -= WORK_MS_PER_RESOURCE_UNIT;
          state.spatial = { ...state.spatial, resourceBalances: state.spatial.resourceBalances.map(candidate => candidate.resourceId === job.resourceId ? {
            ...candidate,
            remaining: candidate.remaining - 1,
            reserved: Math.max(0, candidate.reserved - 1),
            lastSettledAtElapsedMs: at,
          } : candidate) };
        }
      }
      if (code) {
        state.spatial = { ...state.spatial, resourceBalances: state.spatial.resourceBalances.map(candidate => candidate.resourceId === job.resourceId ? {
          ...candidate, reserved: Math.max(0, candidate.reserved - job.reservedQuantity), lastSettledAtElapsedMs: at,
        } : candidate) };
        state.spatial.harvestJobs = state.spatial.harvestJobs.map(candidate => candidate.id === job.id ? {
          ...candidate, status: 'blocked', stage: 'blocked', reservedQuantity: 0, interruptionCode: code,
        } : candidate);
        state.jobs = state.jobs.map(candidate => candidate.id === job.id ? { ...candidate, status: 'blocked' } : candidate);
        events.push({ type: 'harvest_job_blocked', occurredAtElapsedMs: at, payload: { jobId: job.id, reason: code, extractedQuantity: extracted } });
        continue;
      }
      const done = extracted >= job.requestedQuantity;
      const loadedSpeed = actorSpeedMmPerHour(state, world, job.actorIds[0]);
      const returnSpeed = Math.min(job.speedMmPerHour, loadedSpeed);
      state.spatial.harvestJobs = state.spatial.harvestJobs.map(candidate => candidate.id === job.id ? {
        ...candidate,
        extractedQuantity: extracted,
        reservedQuantity: done ? 0 : candidate.reservedQuantity - (extracted - candidate.extractedQuantity),
        workProgressMs: remainingWork,
        stage: done ? 'returning' : candidate.stage,
        routeProgressMm: done ? 0 : candidate.routeProgressMm,
        speedMmPerHour: done ? returnSpeed : candidate.speedMmPerHour,
        nextTickAtElapsedMs: at + SPATIAL_TICK_MS,
        lastSettledAtElapsedMs: at,
      } : candidate);
      if (done) {
        events.push({ type: 'harvest_work_completed', occurredAtElapsedMs: at, payload: { jobId: job.id, quantity: extracted, materialId: job.materialId } });
      } else if (extracted > job.extractedQuantity) {
        events.push({ type: 'resource_extracted', occurredAtElapsedMs: at, payload: { jobId: job.id, quantity: extracted - job.extractedQuantity, materialId: job.materialId } });
      }
    }
    const current = state.spatial.harvestJobs.find(candidate => candidate.id === job.id);
    if (current?.status === 'active' && current.stage === 'returning' && current.routeProgressMm >= current.routeReturnDistanceMm - 1) {
      state.spatial.harvestJobs = state.spatial.harvestJobs.map(candidate => candidate.id === job.id ? { ...candidate, status: 'completed', completedAtElapsedMs: at } as HarvestJobState & { completedAtElapsedMs: number } : candidate);
      applyActorPosition(state, world, job.actorIds[0], job.originSnapshot);
      state.jobs = state.jobs.map(candidate => candidate.id === job.id ? { ...candidate, status: 'completed', completedAtElapsedMs: at } : candidate);
      events.push({ type: 'harvest_cargo_returned', occurredAtElapsedMs: at, payload: { jobId: job.id, actorId: job.actorIds[0], quantity: current.extractedQuantity } });
    }
  }

  if (events.length > 0) updateKnowledgeAt(state, world, at);
  return events;
}

export function cancelSpatialJob(state: GameState, jobId: string, at: number): { state: GameState; event: SpatialEvent | null; code: string | null } {
  const search = state.spatial.searchJobs.find(job => job.id === jobId && job.status === 'active');
  if (search) {
    const next = structuredClone(state);
    next.spatial.searchJobs = next.spatial.searchJobs.map(job => job.id === jobId ? { ...job, status: 'cancelled' } : job);
    next.exploration.searchHistory = next.exploration.searchHistory.map(entry => entry.searchId === jobId ? { ...entry, status: 'cancelled' } : entry);
    next.jobs = next.jobs.map(job => job.id === jobId ? { ...job, status: 'cancelled', completedAtElapsedMs: at } : job);
    return { state: next, code: null, event: { type: 'spatial_search_cancelled', occurredAtElapsedMs: at, payload: { jobId, sweepProgressMm: search.pathProgressMm } } };
  }
  const harvest = state.spatial.harvestJobs.find(job => job.id === jobId && job.status === 'active');
  if (!harvest) return { state, event: null, code: 'SPATIAL_JOB_NOT_ACTIVE' };
  const next = structuredClone(state);
  const unextractedReserved = Math.max(0, harvest.reservedQuantity);
  next.spatial.resourceBalances = next.spatial.resourceBalances.map(balance => balance.resourceId === harvest.resourceId ? {
    ...balance, reserved: Math.max(0, balance.reserved - unextractedReserved), lastSettledAtElapsedMs: at,
  } : balance);
  next.spatial.harvestJobs = next.spatial.harvestJobs.map(job => job.id === jobId ? { ...job, status: 'cancelled', reservedQuantity: 0 } : job);
  next.jobs = next.jobs.map(job => job.id === jobId ? { ...job, status: 'cancelled', completedAtElapsedMs: at } : job);
  return { state: next, code: null, event: { type: 'harvest_job_cancelled', occurredAtElapsedMs: at, payload: { jobId, extractedQuantity: harvest.extractedQuantity } } };
}

export function accessibleResourceState(state: GameState, world: WorldDefinition, resource: WorldResource) {
  const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === resource.id);
  if (!state.playerKnowledge.knownResourceIds.includes(resource.id)) return null;
  return {
    resourceId: resource.id,
    materialId: resource.materialId,
    materialName: resource.materialName,
    unit: resource.unit,
    remaining: balance?.amountKnowledge === 'known_exact' ? balance.remaining : null,
    reserved: balance && balance.reserved > 0 ? balance.reserved : null,
    amountKnowledge: balance?.amountKnowledge ?? 'unknown',
    status: resource.access === 'open_surface' ? (balance && balance.remaining <= 0 ? 'depleted' : 'available') : 'blocked',
  } as const;
}

export function playerPosition(state: GameState): CoordinateMm { return state.player.position; }

export function materializeChestLootBlocker(world: WorldDefinition): string {
  const lootContractExists = world.lockedSourceHashes['references/canonical/LORD-DND-04.md'] !== undefined;
  return lootContractExists ? 'CHEST_LOOT_CANDIDATE_POOL_NOT_COMPILED' : 'CHEST_LOOT_RULE_NOT_COMPILED';
}
