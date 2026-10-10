import type { EntityRef, GameState, PlayerView, WorldDefinition } from '../../contracts/src/index.ts';

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
      survivalFire: { level: 1, active: true, heatRadiusMetres: 10, protection: 'pending-opening-settlement' },
      buildings: knownBuildings,
    },
    inventory: { containers: knownContainers },
    units: [],
    jobs: [],
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
      heatOverlays: [{ center: world.origin, radiusMm: 10_000, minCelsius: 5, maxCelsius: 20 }],
    },
    journal: [],
  };
}
