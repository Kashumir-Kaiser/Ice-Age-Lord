import { PLAYER_VIEW_SCHEMA_VERSION, type ActionAvailability, type CoordinateMm, type EntityRef, type GameState, type PlayerEntityView, type PlayerView, type WorldDefinition } from '../../contracts/src/index.ts';
import { eventRuntimeReadiness } from '../../content/src/eventReadiness.ts';
import { canAccessStarterContainer } from './access.ts';
import { carryCapacityForFireLevel, currentSight, harvestingRateUnitsPerHour, previewMovement, startHarvestJob } from './spatial.ts';
import { OPENING_BUILDINGS } from '../../content/src/buildings.ts';
import { constructionWorkRate, farmhouseCapacity } from './construction.ts';
import { elapsedMsToWorldClock } from './time.ts';
import { butcherCorpse, directReviveAvailability } from './stage07.ts';
import { projectStage07Combat } from './combat.ts';
import { openingBoardView, Q08_ID } from './stage08.ts';

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
  const carried = state.inventory.containers.find(container => container.location.kind === 'carried' && container.location.ownerId === state.player.id);
  return world.resourceFeatures.flatMap(feature => {
    const materials = world.resources.filter(resource => resource.featureId === feature.id);
    const knownMaterials = materials.filter(resource => state.playerKnowledge.knownResourceIds.includes(resource.id));
    if (knownMaterials.length === 0) return [];
    const primary = knownMaterials[0];
    const observation = state.playerKnowledge.lastSeenByEntity[`resource:${primary.id}`];
    const projectedMaterials = knownMaterials.map(resource => {
      const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === resource.id);
      const tool = resource.requiredToolTemplateId
        ? carried?.stacks.find(stack => stack.templateId === resource.requiredToolTemplateId)
        : undefined;
      const preview = startHarvestJob(state, world, 'VIEW-PREVIEW', state.player.id, resource.id, resource.materialId, 1, tool?.itemId ?? (resource.requiredToolTemplateId ? '' : 'NONE'));
      const accessReason = resource.access === 'survey_required' ? 'Prospecting is not available in this game build.'
        : resource.access === 'frozen_water' ? 'This source is frozen; water preparation is not available yet.'
          : resource.access === 'workforce_and_fuel' ? 'Salt extraction requires two workers and cooking fuel; that workfront is not available yet.'
            : preview.code === 'REQUIRED_TOOL_NOT_CARRIED' ? `Carry a ${resource.requiredToolTemplateId} to harvest this material.`
              : preview.code === 'INSUFFICIENT_RESOURCE' ? 'The remaining stock or daily quota is reserved or exhausted.'
                : preview.code ? preview.code.replaceAll('_', ' ').toLocaleLowerCase() : null;
      const remaining = balance?.amountKnowledge === 'known_exact'
        ? resource.dailyQuota === null ? balance.remaining : balance.dailyRemaining
        : null;
      const dailyRemaining = balance?.amountKnowledge === 'known_exact' ? balance.dailyRemaining : null;
      const depleted = resource.dailyQuota !== null ? (balance?.dailyRemaining ?? resource.dailyQuota) <= 0 : (balance?.remaining ?? resource.capacity) <= 0;
      return {
        resourceId: resource.id,
        materialId: resource.materialId,
        materialName: resource.materialName,
        unit: resource.unit,
        capacity: resource.capacity,
        remaining,
        reserved: balance && balance.reserved > 0 ? balance.reserved : null,
        dailyQuota: resource.dailyQuota,
        dailyRemaining,
        harvestRateUnitsPerHour: harvestingRateUnitsPerHour(state.territory.survivalFire.level),
        renewal: resource.renewal,
        regenerationPerDay: resource.regenerationPerDay,
        requiredToolTemplateId: resource.requiredToolTemplateId,
        access: resource.access,
        accessReason,
        status: resource.access !== 'open_surface' ? 'blocked' as const : depleted ? 'depleted' as const : 'available' as const,
        harvestable: preview.job !== null,
        reasonCode: preview.code,
      };
    });
    const position = feature.position;
    const distanceFromHeatMm = Math.hypot(position.xMm - state.territory.position.xMm, position.yMm - state.territory.position.yMm);
    const heatRadiusMm = state.territory.survivalFire.active ? state.territory.survivalFire.heatRadiusMetres * 1_000 : 0;
    const harvestable = projectedMaterials.some(material => material.harvestable);
    const blocker = projectedMaterials.find(material => !material.harvestable)?.reasonCode ?? 'RESOURCE_UNAVAILABLE';
    return [{
      ref: { type: 'resource', id: primary.id },
      label: feature.name,
      category: `resource deposit · ${feature.terrainKind}`,
      knowledge: observation?.knowledge === 'last_known' ? 'last_known' : 'current',
      observedAtElapsedMs: observation?.observedAtElapsedMs ?? state.simElapsedMs,
      position,
      resourceDeposit: {
        featureId: feature.id,
        featureName: feature.name,
        terrainKind: feature.terrainKind,
        footprintMm: feature.footprintMm,
        heatActive: state.territory.survivalFire.active,
        heatCovered: distanceFromHeatMm <= heatRadiusMm,
        distanceFromHeatMm,
        heatRadiusMm,
        carryCapacityUnits: carryCapacityForFireLevel(state.territory.survivalFire.level),
        storageStackSlots: state.inventory.containers.find(container => container.kind === 'territory_supply')?.capacitySlots ?? null,
        materials: projectedMaterials.map(({ harvestable: _harvestable, reasonCode: _reasonCode, ...material }) => material),
      },
      actions: [
        action('inspect_entity', true),
        moveAction(state, world, primary.id, position),
        action('harvest', harvestable, harvestable ? null : blocker, harvestable ? [] : ['The deposit is visible, but every material has an unresolved access, tool, or stock requirement.']),
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
  const construction = state.construction.jobs.find(job => job.id === jobId);
  if (construction) return construction.workUnitsRequired === 0 ? 100 : Math.max(0, Math.min(100, construction.progressTicks / (construction.workUnitsRequired * 300) * 100));
  const service = (state.construction.operatingServices ?? []).find(job => job.id === jobId);
  if (service) return Math.max(0, Math.min(100, (state.simElapsedMs - service.startedAtElapsedMs) / (service.completesAtElapsedMs - service.startedAtElapsedMs) * 100));
  return null;
}

function playerAtSiteForView(state: GameState, world: WorldDefinition, siteId: string): boolean {
  const site = world.sites.find(candidate => candidate.id === siteId);
  return Boolean(site && Math.hypot(site.position.xMm - state.player.position.xMm, site.position.yMm - state.player.position.yMm)
    <= world.navigationOverlay.interactionRangeMm);
}

export function projectPlayerView(state: GameState, world: WorldDefinition): PlayerView {
  if (state.worldPackageId !== world.id) throw new Error('PLAYER_VIEW_WORLD_PACKAGE_MISMATCH');
  const knownCorpseIds = new Set(state.playerKnowledge.knownCorpseIds ?? []);
  const corpseEntities: PlayerEntityView[] = state.corpses.filter(corpse => knownCorpseIds.has(corpse.id) && corpse.state !== 'destroyed' && corpse.state !== 'butchered' && corpse.state !== 'revived').flatMap(corpse => {
    const position = corpse.location.kind === 'site' || corpse.location.kind === 'buried'
      ? world.sites.find(site => site.id === corpse.location.siteId)?.position
      : corpse.location.carrierId === state.player.id ? state.player.position : state.ownedUnits.find(unit => unit.id === corpse.location.carrierId)?.position ?? undefined;
    if (!position) return [];
    return [{
      ref: { type: 'corpse' as const, id: corpse.id },
      label: corpse.bodyRecord?.name && state.playerKnowledge.lastInspectedEntityIds.includes(entityKey({ type: 'corpse', id: corpse.id })) ? corpse.bodyRecord.name : 'Unidentified corpse',
      category: 'corpse',
      knowledge: 'current' as const,
      observedAtElapsedMs: corpse.createdAtElapsedMs,
      position,
      actions: [action('inspect_entity', true)],
    }];
  });
  const entities = [...siteEntities(state, world), ...resourceEntities(state, world), ...cacheEntities(state, world), ...corpseEntities];
  const knownBuildings = state.buildings.map(building => ({
    id: building.id, name: building.name, status: building.status, kind: building.kind, level: building.level,
    ...(building.siteId ? { siteId: building.siteId } : {}), ...(building.position ? { position: building.position } : {}),
    ...(building.footprintAreaM2 !== undefined ? { footprintAreaM2: building.footprintAreaM2 } : {}),
  }));
  const fireEntity = entities.find(entity => entity.ref.type === 'site' && entity.position?.xMm === state.territory.position.xMm && entity.position?.yMm === state.territory.position.yMm);
  if (!fireEntity) throw new Error('PLAYER_VIEW_SURVIVAL_FIRE_REFERENCE_MISSING');
  const knownContainers = state.inventory.containers.filter(container => container.observed).map(container => ({
    id: container.id,
    kind: container.kind,
    ownerId: container.location.kind === 'carried' ? container.location.ownerId : container.location.kind === 'unit' ? container.location.unitId : null,
    label: container.kind === 'territory_supply' ? 'Territory supply chest'
      : container.kind === 'carried_bag' ? 'Carried food bag'
        : container.kind === 'unit_inventory'
          ? `${state.ownedUnits.find(unit => container.location.kind === 'unit' && unit.id === container.location.unitId)?.name ?? 'Unit'} pack`
          : container.kind,
    slots: container.capacitySlots ?? 0,
    occupiedSlots: container.stacks.length,
    capacitySlots: container.capacitySlots,
    accessible: canAccessStarterContainer(container.id, state, world) || (container.location.kind === 'carried' && container.location.ownerId === state.player.id),
    location: container.location,
    items: container.stacks.map(stack => ({ itemId: stack.itemId, label: stack.templateId, quantity: stack.quantity, reservedQuantity: stack.reservedQuantity ?? 0, unit: stack.unit ?? null, quality: stack.quality ?? null, condition: stack.condition ?? null, ownerId: stack.ownerId ?? null, equipped: stack.equipped, equippedSlotId: stack.equippedSlotId ?? null, foodUnitsPerItem: stack.foodUnitsPerItem ?? null, equipmentTags: stack.equipmentTags ?? [], combatEffects: stack.combatEffects ?? {}, provenance: stack.provenance })),
  }));
  const sights = currentSight(state, world);
  const combat = projectStage07Combat(state, world);
  const combatTargets = combat.target && (combat.target.state === 'available' || combat.target.state === 'reacting')
    && sights.some(sight => Math.hypot(combat.target!.position.xMm - sight.center.xMm, combat.target!.position.yMm - sight.center.yMm) <= sight.radiusMm)
    ? [{ targetId: combat.target.id, label: combat.target.label, position: combat.target.position, status: combat.target.state as 'available' | 'reacting' }]
    : [];
  const caravan = state.stage08.enabled ? state.stage08.caravan : null;
  const caravanPosition = caravan ? world.sites.find(site => site.id === caravan.locationSiteId)?.position : null;
  const caravanVisible = Boolean(caravanPosition && ['distressed', 'negotiated', 'escorting', 'arrived'].includes(caravan!.status)
    && sights.some(sight => Math.hypot(caravanPosition!.xMm - sight.center.xMm, caravanPosition!.yMm - sight.center.yMm) <= sight.radiusMm));
  const atKronaGate = playerAtSiteForView(state, world, 'SITE-LL01-046');
  const projectedQuests = state.quests.filter(quest => quest.state !== 'dormant');
  const q08 = state.quests.find(quest => quest.questId === Q08_ID);
  if (caravanVisible && caravan?.status === 'distressed' && q08?.state === 'dormant') {
    projectedQuests.push({
      questId: Q08_ID, state: 'open', acceptedAt: null, completedAt: null, rewardReceipt: null,
      objectiveId: 'Q08-NEGOTIATE-AND-ESCORT', rewardStatus: 'unavailable', failureReason: null,
    });
  }

  return {
    schemaVersion: PLAYER_VIEW_SCHEMA_VERSION,
    saveId: state.saveId,
    revision: state.revision,
    lastEventSequence: state.lastEventSequence,
    simElapsedMs: state.simElapsedMs,
    clockControl: state.clockControl,
    clockStatus: { driver: 'unclaimed', catchingUp: false, targetSimElapsedMs: state.simElapsedMs, leaseRemainingMs: 0 },
    calendar: state.calendar.flatMap(event => {
      const source = world.eventSchedule.find(row => row.id === event.id);
      if (!source) return [];
      const contract = world.eventContracts.find(candidate => candidate.eventId === event.id);
      if (!contract) throw new Error(`EVENT_CONTRACT_MISSING:${event.id}`);
      return [{
        id: event.id,
        displayName: source.displayName,
        status: event.status,
        readiness: eventRuntimeReadiness(event.id),
        eventContract: {
          handlerFamily: contract.handlerFamily,
          runtimeStatus: contract.runtimeStatus,
          participationRequirement: contract.participationRequirement,
          objectives: contract.objectives,
          scoring: contract.scoring,
          encounters: contract.encounters,
          rewardContract: contract.rewardContract,
          shopContract: contract.shopContract,
          stockAndExpiry: contract.stockAndExpiry,
          settlement: contract.settlement,
          source: contract.source,
        },
        researchEvidence: source.researchEvidence,
        opensAtElapsedMs: event.opensAtMs,
        locksAtElapsedMs: event.locksAtMs,
        resolvesAtElapsedMs: event.resolvesAtMs,
        openReceiptSequence: event.openReceiptSequence,
        lockReceiptSequence: event.lockReceiptSequence,
        resolutionReceiptSequence: event.resolutionReceiptSequence,
      }];
    }),
    eventProgressionBlocker: state.eventProgressionBlocker ? {
      eventId: state.eventProgressionBlocker.eventId,
      displayName: world.eventSchedule.find(row => row.id === state.eventProgressionBlocker!.eventId)?.displayName ?? 'Sự kiện thế giới',
      blockedAtElapsedMs: state.eventProgressionBlocker.blockedAtElapsedMs,
      playerMessage: state.eventProgressionBlocker.playerMessage,
    } : null,
    quests: projectedQuests,
    currency: state.currency.filter(balance => balance.amount > 0),
    stage08: {
      caravan: caravanVisible && caravan && caravanPosition ? {
        id: caravan.id,
        status: caravan.status,
        locationSiteId: caravan.locationSiteId,
        deadlineAtElapsedMs: caravan.deadlineAtElapsedMs,
        arrivalAtElapsedMs: caravan.arrivalAtElapsedMs,
      } : null,
      marketOffers: atKronaGate ? state.stage08.marketOffers : [],
      auctionLots: atKronaGate ? state.stage08.auctionLots.filter(lot => lot.status !== 'closed') : [],
      auctionBids: atKronaGate ? state.stage08.auctionBids.filter(bid => bid.bidderId === state.player.id) : [],
      rankSnapshots: state.stage08.rankSnapshots,
      openingBoard: openingBoardView(state),
    },
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
      skills: state.player.career.skills ?? [],
      pendingGrowth: state.player.career.pendingGrowth ?? 0,
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
        fuelRemaining: state.territory.survivalFire.fuelKnowledge === 'known' ? state.territory.survivalFire.fuelRemaining : null,
        hasFuel: state.territory.survivalFire.fuelRemaining > 0,
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
    construction: {
      unlockedBlueprintIds: state.construction.unlockedBlueprintIds,
      blueprints: OPENING_BUILDINGS,
      jobs: state.construction.jobs.map(job => {
        const workUnitsPerHour = constructionWorkRate(state, job);
        const remaining = Math.max(0, job.workUnitsRequired - job.progressTicks / 300);
        const estimatedCompletionAtElapsedMs = workUnitsPerHour > 0
          ? state.simElapsedMs + Math.ceil(remaining * 3_600_000 / workUnitsPerHour)
          : null;
        return { ...job, workUnitsPerHour, estimatedCompletionAtElapsedMs };
      }),
      residents: state.construction.residents,
      rewardEntitlements: state.construction.rewardEntitlements,
      operatingServices: (state.construction.operatingServices ?? []).map(service => ({ ...service, remainingMs: Math.max(0, service.completesAtElapsedMs - state.simElapsedMs) })),
      farmerHouseCapacity: farmhouseCapacity(state),
      occupiedHousing: state.construction.residents.length,
    },
    combat,
    careerCard: {
      observed: state.playerKnowledge.careerCardObserved,
      active: state.player.career.state === 'active',
      openingSkillLearned: (state.player.career.skills ?? []).some(skill => skill.templateId === state.player.career.sealedPayload.openingSkillId),
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
    corpses: state.corpses.filter(corpse => knownCorpseIds.has(corpse.id)).map(corpse => {
      const inspected = state.playerKnowledge.lastInspectedEntityIds.includes(entityKey({ type: 'corpse', id: corpse.id }));
      const atReach = corpse.location.kind === 'site' || corpse.location.kind === 'buried'
        ? (() => { const position = world.sites.find(site => site.id === corpse.location.siteId)?.position; return Boolean(position && Math.hypot(position.xMm - state.player.position.xMm, position.yMm - state.player.position.yMm) <= world.navigationOverlay.interactionRangeMm); })()
        : corpse.location.kind === 'carried' && (corpse.location.carrierId === state.player.id || state.ownedUnits.some(unit => unit.id === corpse.location.carrierId && unit.position && Math.hypot(unit.position.xMm - state.player.position.xMm, unit.position.yMm - state.player.position.yMm) <= world.navigationOverlay.interactionRangeMm));
      const revive = directReviveAvailability(state, world, state.player.id, corpse.id);
      const butcher = butcherCorpse(state, world, state.player.id, corpse.id);
      return {
        id: corpse.id, actorId: corpse.actorId,
        label: inspected ? corpse.bodyRecord?.name ?? 'Unknown person' : 'Unidentified corpse',
        position: corpse.location.kind === 'site' || corpse.location.kind === 'buried' ? world.sites.find(site => site.id === corpse.location.siteId)?.position ?? null : null,
        state: corpse.state, integrity: inspected ? corpse.integrity ?? null : null,
        tier: inspected ? corpse.bodyRecord?.formTier ?? null : null,
        level: inspected ? corpse.bodyRecord?.level ?? null : null,
        grade: inspected ? corpse.bodyRecord?.grade ?? null : null,
        hero: inspected ? corpse.bodyRecord?.hero ?? null : null,
        accessible: atReach, inspected, revive: { actionId: 'revive', enabled: !revive.code, reasonCode: revive.code, requirements: revive.requirements, ...(!revive.code ? { preview: { label: 'Direct Tử Phục', value: '0 mana · 0 materials · 0 time' } } : {}) },
        butcher: { actionId: 'butcher_corpse', enabled: !butcher.code, reasonCode: butcher.code, requirements: butcher.requirements, ...(!butcher.code ? { preview: { label: 'Dispose body', value: '0 materials · 0 time; recorded gear recovered once' } } : {}) },
      };
    }),
    jobs: state.jobs.map(job => ({ ...job, progressPercent: progressFor(state, job.id) })),
    visibleMap: {
      coordinateSystem: world.coordinateSystem,
      coordinateEncoding: world.coordinateEncoding,
      currentSight: sights,
      visibleGeometry: sights.map((sight, index) => ({ id: `SIGHT-${index + 1}`, kind: 'circle' as const, points: [sight.center] })),
      exploredGeometry: state.exploration.exploredGeometry,
      terrain: [],
      resourceFeatures: world.resourceFeatures.flatMap(feature => {
        if (!world.resources.some(resource => resource.featureId === feature.id && state.playerKnowledge.knownResourceIds.includes(resource.id))) return [];
        return [{
          ...feature,
          channels: feature.appearanceChannels.map(channel => {
            const resource = world.resources.find(candidate => candidate.id === channel.resourceId);
            const balance = state.spatial.resourceBalances.find(candidate => candidate.resourceId === channel.resourceId);
            if (!resource || !balance) return { ...channel, remainingRatio: 0 };
            const amount = balance.dailyRemaining ?? balance.remaining;
            const denominator = resource.dailyQuota ?? resource.capacity;
            return { ...channel, remainingRatio: denominator > 0 ? Math.max(0, Math.min(1, amount / denominator)) : 0 };
          }),
        }];
      }),
      entities,
      knownRoutes: state.playerKnowledge.knownRouteIds.flatMap(id => {
        const route = world.navigationOverlay.routeEdges.find(candidate => candidate.id === id);
        return route ? [{ id, label: `${route.fromNodeId} → ${route.toNodeId}`, path: route.path }] : [];
      }),
      activeOrders: activeMapOrders(state),
      heatOverlays: state.territory.survivalFire.active ? [{ center: state.territory.position, radiusMm: state.territory.survivalFire.heatRadiusMetres * 1_000, minCelsius: state.territory.survivalFire.heatDeltaCelsius.min, maxCelsius: state.territory.survivalFire.heatDeltaCelsius.max }] : [],
      combatTargets,
    },
    spatial: {
      navigationRuleVersion: world.navigationOverlay.id,
      movementOrders: state.travel.orders,
      searchJobs: state.spatial.searchJobs.map(({ foundChestIds = [], foundTargetIds = [], ...job }) => ({
        ...job,
        foundChestCount: foundChestIds.length,
        foundTargetCount: foundTargetIds.length,
      })),
      harvestJobs: state.spatial.harvestJobs,
      resources: state.spatial.resourceBalances.flatMap(balance => {
        const resource = world.resources.find(candidate => candidate.id === balance.resourceId);
        if (!resource || !state.playerKnowledge.knownResourceIds.includes(resource.id)) return [];
        const rate = harvestingRateUnitsPerHour(state.territory.survivalFire.level);
        const available = balance.dailyRemaining ?? balance.remaining;
        const accessReason = resource.access === 'survey_required' ? 'Prospecting is not available in this game build.'
          : resource.access === 'frozen_water' ? 'This source is frozen; water preparation is not available yet.'
            : resource.access === 'workforce_and_fuel' ? 'Salt extraction requires two workers and cooking fuel; that workfront is not available yet.' : null;
        return [{
          resourceId: resource.id,
          materialId: resource.materialId,
          materialName: resource.materialName,
          unit: resource.unit,
          remaining: balance.amountKnowledge === 'known_exact'
            ? resource.dailyQuota === null ? balance.remaining : balance.dailyRemaining
            : null,
          reserved: balance.reserved > 0 ? balance.reserved : null,
          amountKnowledge: balance.amountKnowledge,
          status: resource.access !== 'open_surface' ? 'blocked' as const : available <= 0 ? 'depleted' as const : 'available' as const,
          capacity: resource.capacity,
          dailyQuota: resource.dailyQuota,
          dailyRemaining: balance.amountKnowledge === 'known_exact' ? balance.dailyRemaining : null,
          renewal: resource.renewal,
          regenerationPerDay: resource.regenerationPerDay,
          requiredToolTemplateId: resource.requiredToolTemplateId,
          access: resource.access,
          accessReason,
          harvestRateUnitsPerHour: rate,
        }];
      }),
    },
    journal: [],
  };
}
