import type { ActionAvailability, CoordinateMm, EntityRef, GameState, PlayerEntityView, PlayerView, WorldDefinition } from '../../contracts/src/index.ts';
import { canAccessStarterContainer } from './access.ts';
import { currentSight, previewMovement, startHarvestJob } from './spatial.ts';
import { elapsedMsToWorldClock } from './time.ts';

export function entityKey(ref: EntityRef): string {
  return `${ref.type}:${ref.id}`;
}

function action(actionId: string, enabled: boolean, reasonCode: string | null = null, requirements: string[] = [], preview?: ActionAvailability['preview']): ActionAvailability {
  return { actionId, enabled, reasonCode, requirements, ...(preview ? { preview } : {}) };
}

function moveAction(state: GameState, world: WorldDefinition, id: string, position: CoordinateMm): ActionAvailability {
  const result = previewMovement(state, world, state.player.id, position);
  return result.preview
    ? action('move', true, null, [], {
      label: result.preview.uncertainty === 'known' ? 'Known route' : 'Uncertain route',
      value: `${(result.preview.distanceMm / 1_000_000).toFixed(2)} km · ${Math.ceil(result.preview.etaMs / 60_000)} min`,
    })
    : action('move', false, result.code ?? 'MOVEMENT_UNAVAILABLE', ['The destination is outside known routes and the supported local travel radius.']);
}

function siteEntities(state: GameState, world: WorldDefinition): PlayerEntityView[] {
  return state.playerKnowledge.knownSiteIds.flatMap(siteId => {
    const site = world.sites.find(candidate => candidate.id === siteId);
    if (!site) return [];
    const observation = state.playerKnowledge.lastSeenByEntity[`site:${siteId}`];
    if (!observation || observation.knowledge === 'unknown') return [];
    return [{
      ref: { type: 'site', id: site.id },
      label: site.name,
      category: 'site',
      knowledge: observation.knowledge === 'signs_only' ? 'current' : observation.knowledge,
      observedAtElapsedMs: observation.observedAtElapsedMs,
      position: site.position,
      actions: [
        action('inspect_entity', true),
        moveAction(state, world, site.id, site.position),
      ],
    }];
  });
}

function resourceEntities(state: GameState, world: WorldDefinition): PlayerEntityView[] {
  return state.playerKnowledge.knownResourceIds.flatMap(resourceId => {
    const resource = world.resources.find(candidate => candidate.id === resourceId);
    if (!resource) return [];
    const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === resourceId);
    const tool = state.inventory.containers.find(container => container.location.kind === 'carried' && container.location.ownerId === state.player.id)
      ?.stacks.find(stack => stack.templateId === resource.requiredToolTemplateId);
    const previewJob = startHarvestJob(state, world, 'VIEW-PREVIEW', state.player.id, resource.id, resource.materialId, 1, tool?.itemId ?? '');
    const harvestReason = previewJob.code
      ?? (resource.access === 'open_surface' ? null : resource.access === 'survey_required' ? 'PROSPECTING_CONTRACT_NOT_COMPILED' : resource.access === 'frozen_water' ? 'WATER_PREPARATION_CONTRACT_NOT_COMPILED' : 'WORKFORCE_AND_FUEL_REQUIREMENTS_NOT_MET');
    const observation = state.playerKnowledge.lastSeenByEntity[`resource:${resourceId}`];
    return [{
      ref: { type: 'resource', id: resource.id },
      label: resource.materialName,
      category: `resource · ${resource.unit}`,
      knowledge: observation?.knowledge === 'last_known' ? 'last_known' : 'current',
      observedAtElapsedMs: observation?.observedAtElapsedMs ?? state.simElapsedMs,
      position: resource.location,
      actions: [
        action('inspect_entity', true),
        moveAction(state, world, resource.id, resource.location),
        action('harvest', harvestReason === null, harvestReason, harvestReason ? ['The source access, worker, resource, and carried tool requirements are unresolved.'] : []),
      ],
    }];
  });
}

function cacheEntities(state: GameState, world: WorldDefinition): PlayerEntityView[] {
  const entities: PlayerEntityView[] = [];
  for (const signalId of state.playerKnowledge.knownSignalIds) {
    const signal = state.spatial.signals.find(candidate => candidate.signalId === signalId);
    if (!signal) continue;
    const exactChestId = signal.discovery === 'identified' && signal.targetId.startsWith('CH-LL01-') ? signal.targetId : null;
    const chest = exactChestId ? world.fieldChests.find(candidate => candidate.id === exactChestId) : null;
    const position = signal.discovery === 'identified' ? signal.exactPosition : signal.approximatePosition;
    const ref = { type: 'cache' as const, id: exactChestId ?? signal.signalId };
    const actions: ActionAvailability[] = [];
    if (signal.discovery === 'signal') actions.push(action('inspect_entity', true));
    if (signal.discovery === 'identified' && !exactChestId) actions.push(action('inspect_entity', true));
    actions.push(moveAction(state, world, ref.id, position));
    if (exactChestId) {
      const inReach = Math.hypot(state.player.position.xMm - position.xMm, state.player.position.yMm - position.yMm) <= world.navigationOverlay.interactionRangeMm;
      actions.push(action('open_cache', false, inReach ? 'CHEST_LOOT_CANDIDATE_POOL_NOT_COMPILED' : 'NOT_ACCESSIBLE', [inReach ? 'The chest reward candidate pool is not compiled.' : 'Move within reach to access this chest.']));
    }
    entities.push({
      ref,
      label: chest ? `Field chest · ${chest.grade}` : signal.discovery === 'signal' ? 'Unidentified buried signal' : 'Identified cache signal',
      category: 'cache',
      knowledge: signal.discovery === 'identified' ? 'current' : 'signs_only',
      observedAtElapsedMs: signal.discoveredAtElapsedMs,
      position,
      actions,
    });
  }
  return entities;
}

function activeMapOrders(state: GameState): PlayerView['visibleMap']['activeOrders'] {
  return state.travel.orders.filter(order => order.status === 'active').flatMap(order => {
    const actorId = order.actorIds[0];
    const position = actorId === state.player.id ? state.player.position : state.ownedUnits.find(unit => unit.id === actorId)?.position;
    if (!position) return [];
    const totalDuration = order.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
    return [{
      id: order.id,
      kind: 'movement',
      status: order.status,
      actorIds: order.actorIds,
      position,
      path: order.pathSegments.length === 0 ? [order.originSnapshot, order.destinationIntent.coordinate] : [order.pathSegments[0].from, ...order.pathSegments.map(segment => segment.to)],
      totalDistanceMm: order.totalDistanceMm,
      etaElapsedMs: state.simElapsedMs + Math.max(0, totalDuration - order.elapsedTravelMs),
      uncertainty: order.pathSegments.some(segment => segment.uncertainty === 'uncertain') ? 'uncertain' : 'known',
    }];
  });
}

function progressFor(state: GameState, jobId: string): number | null {
  const movement = state.travel.orders.find(order => order.id === jobId);
  if (movement) {
    const duration = movement.pathSegments.reduce((sum, segment) => sum + segment.durationMs, 0);
    return duration === 0 ? 100 : Math.max(0, Math.min(100, movement.elapsedTravelMs / duration * 100));
  }
  const search = state.spatial.searchJobs.find(job => job.id === jobId);
  if (search) {
    const length = search.path.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.xMm - search.path[index].xMm, point.yMm - search.path[index].yMm), 0);
    return length === 0 ? 100 : Math.max(0, Math.min(100, search.pathProgressMm / length * 100));
  }
  const harvest = state.spatial.harvestJobs.find(job => job.id === jobId);
  if (harvest) {
    if (harvest.stage === 'working') return Math.max(0, Math.min(100, harvest.workProgressMs / (60 * 60_000) * 100));
    const distance = harvest.stage === 'outbound' ? harvest.routeOutDistanceMm : harvest.routeReturnDistanceMm;
    return distance === 0 ? 100 : Math.max(0, Math.min(100, harvest.routeProgressMm / distance * 100));
  }
  return null;
}

export function projectPlayerView(state: GameState, world: WorldDefinition): PlayerView {
  if (state.worldPackageId !== world.id) throw new Error('PLAYER_VIEW_WORLD_PACKAGE_MISMATCH');
  const entities = [...siteEntities(state, world), ...resourceEntities(state, world), ...cacheEntities(state, world)];
  const knownBuildings = state.buildings.filter(building => state.playerKnowledge.knownSiteIds.some(siteId => {
    if (building.kind === 'lord_house') return siteId === 'SITE-LL01-001';
    if (building.kind === 'survival_fire') return siteId === 'SITE-LL01-000';
    if (building.kind === 'tomb') return siteId === 'SITE-LL01-003';
    return false;
  })).map(building => ({ id: building.id, name: building.name, status: building.status }));
  const fireEntity = entities.find(entity => entity.ref.type === 'site' && entity.position?.xMm === state.territory.position.xMm && entity.position?.yMm === state.territory.position.yMm);
  if (!fireEntity) throw new Error('PLAYER_VIEW_SURVIVAL_FIRE_REFERENCE_MISSING');
  const knownContainers = state.inventory.containers.filter(container => container.observed).map(container => ({
    id: container.id,
    kind: container.kind,
    label: container.kind === 'territory_supply' ? 'Territory supply chest' : container.kind === 'carried_bag' ? 'Carried food bag' : container.kind,
    slots: container.capacitySlots ?? 0,
    accessible: canAccessStarterContainer(container.id, state, world),
    items: container.stacks.map(stack => ({ itemId: stack.itemId, label: stack.templateId, quantity: stack.quantity })),
  }));
  const sights = currentSight(state, world);

  return {
    schemaVersion: 1,
    saveId: state.saveId,
    revision: state.revision,
    lastEventSequence: state.lastEventSequence,
    simElapsedMs: state.simElapsedMs,
    clockControl: state.clockControl,
    clockStatus: { driver: 'unclaimed', catchingUp: false, targetSimElapsedMs: state.simElapsedMs, leaseRemainingMs: 0 },
    worldClock: elapsedMsToWorldClock(state.simElapsedMs),
    survival: {
      coldLoad: state.survival.coldStatus === 'weather_unresolved' ? null : state.survival.coldLoadMicro / 1_000_000,
      coldStatus: state.survival.coldStatus,
      blocker: state.survival.blocker,
      hungerState: state.survival.hungerState,
    },
    player: {
      id: state.player.id,
      name: state.player.name,
      level: state.player.level,
      xp: state.player.xp,
      formTier: state.player.formTier,
      talent: { name: state.player.talent.name, grade: state.player.talent.grade },
      attributes: state.player.attributes,
      mana: { current: state.player.mana.current, max: state.player.mana.max },
      careerState: state.player.career.state === 'active' ? 'active' : 'unemployed',
      position: state.player.position,
    },
    territory: {
      id: state.territory.id,
      stage: 'H0',
      position: state.territory.position,
      survivalFire: {
        ref: fireEntity.ref,
        level: state.territory.survivalFire.level,
        active: state.territory.survivalFire.active,
        heatRadiusMetres: state.territory.survivalFire.heatRadiusMetres,
        fuelRemaining: state.territory.survivalFire.fuelRemaining,
        fuelKnowledge: state.territory.survivalFire.fuelKnowledge,
        nextFuelConsumptionAtElapsedMs: state.territory.survivalFire.nextFuelConsumptionAtElapsedMs,
        fuelBlocker: state.territory.survivalFire.fuelBlocker,
        protection: state.territory.survivalFire.protectionStatus === 'pending_opening_settlement' ? 'pending-opening-settlement' : state.territory.survivalFire.protectionStatus,
      },
      tomb: {
        level: state.buildings.find(building => building.id === state.territory.tombId)?.level ?? 1,
        deathQi: { current: state.territory.tomb.deathQi.current, capacity: state.territory.tomb.deathQi.capacity, nextRefillAtElapsedMs: state.territory.tomb.deathQi.nextRefillAtElapsedMs },
        productionSlots: Math.min(8, (state.buildings.find(building => building.id === state.territory.tombId)?.level ?? 1) + 1),
        activeCount: state.territory.tomb.queue.filter(entry => entry.status === 'active').length,
        queuedCount: state.territory.tomb.queue.filter(entry => entry.status === 'queued' || entry.status === 'blocked').length,
        nextCompletionAtElapsedMs: state.territory.tomb.queue.filter(entry => entry.status === 'active' && entry.completesAtElapsedMs !== null).reduce<number | null>((lowest, entry) => lowest === null ? entry.completesAtElapsedMs : Math.min(lowest, entry.completesAtElapsedMs as number), null),
        queue: state.territory.tomb.queue,
        output: state.territory.tomb.output,
      },
      buildings: knownBuildings,
    },
    careerCard: {
      observed: state.playerKnowledge.careerCardObserved,
      career: state.playerKnowledge.careerCardObserved ? { id: state.player.career.sealedPayload.careerId, name: 'Tử Linh Triệu Hoán Sư', openingSkillId: state.player.career.sealedPayload.openingSkillId, growthAllocation: state.player.career.sealedPayload.growthAllocation } : null,
    },
    inventory: {
      inspectableContainers: state.inventory.containers.filter(container => !container.observed
        && (container.kind === 'territory_supply' || container.kind === 'carried_bag')
        && canAccessStarterContainer(container.id, state, world)).map(container => ({
        containerId: container.id,
        label: container.kind === 'territory_supply' ? 'Territory supply chest' : 'Carried food bag',
        kind: container.kind === 'territory_supply' ? 'territory_supply' as const : 'carried_bag' as const,
      })),
      containers: knownContainers,
    },
    units: state.ownedUnits,
    jobs: state.jobs.map(job => ({ ...job, progressPercent: progressFor(state, job.id) })),
    visibleMap: {
      coordinateSystem: world.coordinateSystem,
      coordinateEncoding: world.coordinateEncoding,
      currentSight: sights,
      visibleGeometry: sights.map((sight, index) => ({ id: `SIGHT-${index + 1}`, kind: 'circle' as const, points: [sight.center] })),
      exploredGeometry: state.exploration.exploredGeometry,
      terrain: [],
      entities,
      knownRoutes: state.playerKnowledge.knownRouteIds.flatMap(id => {
        const route = world.navigationOverlay.routeEdges.find(candidate => candidate.id === id);
        return route ? [{ id, label: `${route.fromNodeId} → ${route.toNodeId}`, path: route.path }] : [];
      }),
      activeOrders: activeMapOrders(state),
      heatOverlays: state.territory.survivalFire.active ? [{ center: state.territory.position, radiusMm: state.territory.survivalFire.heatRadiusMetres * 1_000, minCelsius: state.territory.survivalFire.heatDeltaCelsius.min, maxCelsius: state.territory.survivalFire.heatDeltaCelsius.max }] : [],
    },
    spatial: {
      navigationRuleVersion: world.navigationOverlay.id,
      movementOrders: state.travel.orders,
      searchJobs: state.spatial.searchJobs,
      harvestJobs: state.spatial.harvestJobs,
      resources: state.spatial.resourceBalances.flatMap(balance => {
        const resource = world.resources.find(candidate => candidate.id === balance.resourceId);
        if (!resource || !state.playerKnowledge.knownResourceIds.includes(resource.id)) return [];
        return [{
          resourceId: resource.id,
          materialId: resource.materialId,
          materialName: resource.materialName,
          unit: resource.unit,
          remaining: balance.amountKnowledge === 'known_exact' ? balance.remaining : null,
          reserved: balance.reserved > 0 ? balance.reserved : null,
          amountKnowledge: balance.amountKnowledge,
          status: resource.access !== 'open_surface' ? 'blocked' as const : balance.remaining <= 0 ? 'depleted' as const : 'available' as const,
        }];
      }),
    },
    journal: [],
  };
}
