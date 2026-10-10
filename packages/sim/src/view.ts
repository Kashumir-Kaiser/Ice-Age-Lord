import type { EntityRef, GameState, PlayerView, WorldDefinition } from '../../contracts/src/index.ts';
import { canAccessStarterContainer } from './access.ts';
import { elapsedMsToWorldClock } from './time.ts';

export function entityKey(ref: EntityRef): string {
  return `${ref.type}:${ref.id}`;
}

export function projectPlayerView(state: GameState, world: WorldDefinition): PlayerView {
  if (state.worldPackageId !== world.id) throw new Error('PLAYER_VIEW_WORLD_PACKAGE_MISMATCH');
  const sitesById = new Map(world.sites.map(site => [site.id, site]));
  const entities = state.playerKnowledge.knownSiteIds.flatMap(siteId => {
    const site = sitesById.get(siteId);
    if (!site) throw new Error(`PLAYER_KNOWLEDGE_REFERENCE_INVALID: ${siteId}`);
    const observation = state.playerKnowledge.lastSeenByEntity[`site:${siteId}`];
    if (!observation || observation.knowledge === 'unknown') return [];
    return [{
      ref: { type: 'site' as const, id: site.id },
      label: site.name,
      category: 'site',
      knowledge: observation.knowledge === 'signs_only' ? 'current' as const : observation.knowledge,
      observedAtElapsedMs: observation.observedAtElapsedMs,
      position: site.position,
      actions: [
        { actionId: 'inspect_entity', enabled: true, reasonCode: null, requirements: [] },
        { actionId: 'move', enabled: false, reasonCode: 'MOVEMENT_RULES_NOT_IMPLEMENTED', requirements: ['Server travel rules are not active in this stage.'] },
      ],
    }];
  });
  const knownBuildings = state.buildings.filter(building => state.playerKnowledge.knownSiteIds.some(id => {
    if (building.kind === 'lord_house') return id === 'SITE-LL01-001';
    if (building.kind === 'survival_fire') return id === 'SITE-LL01-000';
    if (building.kind === 'tomb') return id === 'SITE-LL01-003';
    return false;
  })).map(building => ({ id: building.id, name: building.name, status: building.status }));
  const fireEntity = entities.find(entity => entity.ref.type === 'site'
    && entity.position?.xMm === state.territory.position.xMm
    && entity.position?.yMm === state.territory.position.yMm);
  if (!fireEntity) throw new Error('PLAYER_VIEW_SURVIVAL_FIRE_REFERENCE_MISSING');

  const knownContainers = state.inventory.containers.filter(container => container.observed).map(container => ({
    id: container.id,
    label: container.kind === 'territory_supply' ? 'Hòm Vật Tư Lãnh Địa' : 'Bịch đồ ăn',
    slots: container.capacitySlots ?? 0,
    items: container.stacks.map(stack => ({ itemId: stack.itemId, label: stack.templateId, quantity: stack.quantity })),
  }));

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
        protection: state.territory.survivalFire.protectionStatus === 'pending_opening_settlement'
          ? 'pending-opening-settlement'
          : state.territory.survivalFire.protectionStatus,
      },
      tomb: {
        level: state.buildings.find(building => building.id === state.territory.tombId)?.level ?? 1,
        deathQi: {
          current: state.territory.tomb.deathQi.current,
          capacity: state.territory.tomb.deathQi.capacity,
          nextRefillAtElapsedMs: state.territory.tomb.deathQi.nextRefillAtElapsedMs,
        },
        productionSlots: Math.min(8, (state.buildings.find(building => building.id === state.territory.tombId)?.level ?? 1) + 1),
        activeCount: state.territory.tomb.queue.filter(entry => entry.status === 'active').length,
        queuedCount: state.territory.tomb.queue.filter(entry => entry.status === 'queued' || entry.status === 'blocked').length,
        nextCompletionAtElapsedMs: state.territory.tomb.queue
          .filter(entry => entry.status === 'active' && entry.completesAtElapsedMs !== null)
          .reduce<number | null>((lowest, entry) => lowest === null ? entry.completesAtElapsedMs : Math.min(lowest, entry.completesAtElapsedMs as number), null),
        queue: state.territory.tomb.queue,
        output: state.territory.tomb.output,
      },
      buildings: knownBuildings,
    },
    careerCard: {
      observed: state.playerKnowledge.careerCardObserved,
      career: state.playerKnowledge.careerCardObserved ? {
        id: state.player.career.sealedPayload.careerId,
        name: 'Tử Linh Triệu Hoán Sư',
        openingSkillId: state.player.career.sealedPayload.openingSkillId,
        growthAllocation: state.player.career.sealedPayload.growthAllocation,
      } : null,
    },
    inventory: {
      inspectableContainers: state.inventory.containers.filter(container =>
        !container.observed && (container.kind === 'territory_supply' || container.kind === 'carried_bag') && canAccessStarterContainer(container.id, state),
      ).map(container => ({
        containerId: container.id,
        label: container.kind === 'territory_supply' ? 'Hòm Vật Tư Lãnh Địa' : 'Bịch đồ ăn',
        kind: container.kind === 'territory_supply' ? 'territory_supply' as const : 'carried_bag' as const,
      })),
      containers: knownContainers,
    },
    units: state.ownedUnits,
    jobs: state.jobs.map(job => {
      const queueEntry = state.territory.tomb.queue.find(entry => entry.id === job.id);
      const progressPercent = queueEntry?.status === 'completed' ? 100
        : queueEntry?.status === 'active' && queueEntry.startedAtElapsedMs !== null && queueEntry.completesAtElapsedMs !== null
          ? Math.max(0, Math.min(100, (state.simElapsedMs - queueEntry.startedAtElapsedMs)
            / Math.max(1, queueEntry.completesAtElapsedMs - queueEntry.startedAtElapsedMs) * 100))
          : null;
      return { ...job, progressPercent };
    }),
    visibleMap: {
      coordinateSystem: world.coordinateSystem,
      coordinateEncoding: world.coordinateEncoding,
      currentSight: [],
      visibleGeometry: [],
      exploredGeometry: [],
      terrain: [],
      entities,
      knownRoutes: state.playerKnowledge.knownRouteIds.flatMap(id => {
        const route = world.routes.find(candidate => candidate.id === id);
        return route ? [{ id, label: route.description }] : [];
      }),
      activeOrders: [],
      heatOverlays: state.territory.survivalFire.active ? [{ center: world.origin, radiusMm: 10_000, minCelsius: 5, maxCelsius: 20 }] : [],
    },
    journal: [],
  };
}
