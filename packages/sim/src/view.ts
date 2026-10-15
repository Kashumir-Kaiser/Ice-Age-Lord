import { PLAYER_VIEW_SCHEMA_VERSION, type ActionAvailability, type CoordinateMm, type EntityRef, type GameState, type PlayerEntityView, type PlayerView, type WorldDefinition } from '../../contracts/src/index.ts';
import { eventRuntimeReadiness } from '../../content/src/eventReadiness.ts';
import { canAccessStarterContainer } from './access.ts';
import { carryCapacityForFireLevel, currentSight, harvestingRateUnitsPerHour, previewMovement, startHarvestJob } from './spatial.ts';
import { OPENING_BUILDINGS } from '../../content/src/buildings.ts';
import { constructionWorkRate, farmhouseCapacity } from './construction.ts';
import { elapsedMsToWorldClock } from './time.ts';
import { butcherCorpse, directReviveAvailability } from './stage07.ts';
import { attackAvailability, projectStage07Combat } from './combat.ts';
import { openingBoardView, Q08_ID } from './stage08.ts';
import { projectedBotResources, projectedBotWaterMl } from './bots/economy.ts';
import { botGradeAt, botKindAt } from './bots/generation.ts';
import { botConstructionPermille } from './bots/state.ts';
import { botArmyMovementOrder, botArmyPosition } from './bots/movement.ts';
import { chestLootProjection } from './chestLoot.ts';
import { eventMechanicsFor } from '../../content/src/eventRules.ts';
import { EVENT_SHOP_MARK_PRICE } from './eventRuntime.ts';
import { BOT_MARKET_ACCESS_RADIUS_MM, botMarketListingBlocker, compareMarketListings, playerBlueprintAdapter } from './bots/market.ts';

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
      const lifecycle = state.fieldChestStates.find(candidate => candidate.chestId === exactChestId);
      const canOpen = inReach && lifecycle?.state === 'unopened' && lifecycle.custody === 'world';
      actions.push(action('open_cache', canOpen, canOpen ? null : inReach ? 'CHEST_ALREADY_OPENED' : 'NOT_ACCESSIBLE', canOpen ? [] : [inReach ? 'This chest is no longer available.' : 'Move within reach to access this chest.']));
    }
    const lifecycle = exactChestId ? state.fieldChestStates.find(candidate => candidate.chestId === exactChestId) : null;
    entities.push({
      ref,
      label: chest ? `Field chest · ${chest.grade}` : signal.discovery === 'signal' ? 'Unidentified buried signal' : 'Identified cache signal',
      category: 'cache',
      knowledge: signal.discovery === 'identified' ? 'current' : 'signs_only',
      observedAtElapsedMs: signal.discoveredAtElapsedMs,
      position,
      actions,
      ...(chest ? { chestLoot: chestLootProjection(chest, lifecycle?.state === 'opened', lifecycle?.lootOutcome?.rewardStacks ?? null) } : {}),
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
  const wildlifeEntities: PlayerEntityView[] = state.wildlife.groups.flatMap(group => {
    if (group.discovery !== 'known' || !(state.playerKnowledge.knownWildlifeGroupIds ?? []).includes(group.id)) return [];
    const attackActor = state.ownedUnits.find(unit => unit.ownerId === state.player.id && unit.health && unit.health.current > 0);
    const targetId = `TARGET-${group.id}`;
    const attack = attackActor ? attackAvailability(state, world, [attackActor.id], targetId) : { code: 'COMBAT_ACTOR_REQUIRED', requirements: ['Revive and equip a warrior before hunting.'] };
    return [{
      ref: { type: 'wildlife', id: group.id },
      label: `${group.displayName} · ${group.remaining}/${group.capacity}`,
      category: 'wildlife',
      knowledge: 'current' as const,
      observedAtElapsedMs: group.lastSightingAtElapsedMs ?? group.discoveredAtElapsedMs ?? 0,
      position: group.position,
      actions: [action('inspect_entity', true), action('attack', !attack.code, attack.code, [...attack.requirements])],
    }];
  });
  const entities = [...siteEntities(state, world), ...resourceEntities(state, world), ...cacheEntities(state, world), ...corpseEntities, ...wildlifeEntities];
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
    items: container.stacks.map(stack => ({ itemId: stack.itemId, label: stack.templateId, quantity: stack.quantity, reservedQuantity: stack.reservedQuantity ?? 0, unit: stack.unit ?? null, quality: stack.quality ?? null, condition: stack.condition ?? null, ownerId: stack.ownerId ?? null, equipped: stack.equipped, equippedSlotId: stack.equippedSlotId ?? null, foodUnitsPerItem: stack.foodUnitsPerItem ?? null, equipmentTags: stack.equipmentTags ?? [], combatEffects: stack.combatEffects ?? {}, exclusiveEventId: stack.exclusiveEventId ?? null, expiresAtElapsedMs: stack.expiresAtElapsedMs ?? null, provenance: stack.provenance })),
  }));
  const sights = currentSight(state, world);
  const knownBotIds = new Set(state.playerKnowledge.knownBotIds ?? []);
  const locatedBots = (state.botPopulation?.chunks ?? []).flatMap(chunk => chunk.cold.map((bot, offset) => ({ chunk, bot, offset })))
    .filter(({ bot }) => knownBotIds.has(bot.botId));
  const inspectedBotId = state.playerKnowledge.inspectedBotId ?? null;
  const enemyBots = locatedBots.flatMap(({ chunk, bot, offset }) => {
    const lastSeen = state.playerKnowledge.lastSeenBotById?.[bot.botId];
    if (!lastSeen) return [];
    const current = sights.some(sight => Math.hypot(sight.center.xMm - lastSeen.position.xMm, sight.center.yMm - lastSeen.position.yMm) <= sight.radiusMm);
    const inspected = current && inspectedBotId === bot.botId;
    return [{
      botId: bot.botId,
      label: inspected ? bot.name : 'Unknown settlement',
      position: lastSeen.position,
      observedAtElapsedMs: lastSeen.observedAtElapsedMs,
      knowledge: current ? 'current' as const : 'remembered' as const,
      level: inspected ? chunk.levels[offset]! : null,
      militaryCount: inspected ? chunk.armySize[offset]! : null,
      structureCount: inspected ? bot.structures.filter(item => item.status !== 'destroyed').length : null,
      status: inspected ? bot.lordFate.status === 'dead' ? 'dead' as const
        : bot.lordFate.status === 'captured' ? 'captured' as const
          : bot.lordFate.status === 'dispossessed' ? 'dispossessed' as const
            : chunk.alive[offset] === 0 ? 'destroyed' as const : 'active' as const : 'unknown' as const,
    }];
  }).sort((a, b) => a.botId < b.botId ? -1 : a.botId > b.botId ? 1 : 0);
  const enemyArmies = (state.botPopulation?.chunks ?? []).flatMap(chunk => chunk.cold.flatMap((bot, offset) => {
    const movement = bot.armyMovement;
    if (!movement || movement.unitCount <= 0) return [];
    const actualPosition = botArmyPosition(movement, state.simElapsedMs);
    const currentlySeen = sights.some(sight => ((sight.center.sourceZMetres ?? 0) < -2) === ((actualPosition.sourceZMetres ?? 0) < -2)
      && Math.hypot(actualPosition.xMm - sight.center.xMm, actualPosition.yMm - sight.center.yMm) <= sight.radiusMm);
    const remembered = state.playerKnowledge.lastSeenBotArmyById?.[bot.botId];
    if (!currentlySeen && !remembered) return [];
    return [{
      botId: bot.botId,
      label: movement.unitKind === 'scout' ? 'Rival scout party' : 'Rival troop movement',
      position: currentlySeen ? actualPosition : remembered!.position,
      observedAtElapsedMs: currentlySeen ? state.simElapsedMs : remembered!.observedAtElapsedMs,
      knowledge: currentlySeen ? 'current' as const : 'remembered' as const,
      count: currentlySeen ? movement.unitCount : remembered!.count,
      order: currentlySeen ? botArmyMovementOrder(movement) : remembered!.order,
    }];
  })).sort((a, b) => a.botId < b.botId ? -1 : a.botId > b.botId ? 1 : 0);
  const inspectedBot = inspectedBotId ? locatedBots.find(row => row.bot.botId === inspectedBotId) : undefined;
  const projectedStructureWork = (structure: NonNullable<typeof inspectedBot>['bot']['structures'][number], field: 'workCompleted' | 'repairWorkCompleted'): number => {
    if (!inspectedBot) return structure[field];
    const plan = inspectedBot.bot.currentPlan;
    const construction = field === 'workCompleted' && plan?.action === 'construct' && structure.id === `${plan.actionId}:STRUCTURE`;
    const repair = field === 'repairWorkCompleted' && plan?.action === 'repair' && structure.id === plan.targetId;
    if (!construction && !repair) return structure[field];
    const elapsedMs = Math.max(0, state.simElapsedMs - inspectedBot.chunk.lastIntegratedAtElapsedMs[inspectedBot.offset]!);
    const talentWork = botConstructionPermille(botGradeAt(inspectedBot.chunk, inspectedBot.offset), botKindAt(inspectedBot.chunk, inspectedBot.offset));
    const integratedWork = inspectedBot.chunk.workProgress[inspectedBot.offset]!;
    const elapsedWork = Math.floor(plan.workersAssigned * talentWork * elapsedMs / 1_000);
    const required = field === 'workCompleted' ? structure.workRequired : structure.repairWorkRequired;
    return Math.min(required, integratedWork + elapsedWork);
  };
  const botInspection = inspectedBot && enemyBots.some(row => row.botId === inspectedBotId && row.knowledge === 'current') ? {
    botId: inspectedBot.bot.botId,
    name: inspectedBot.bot.name,
    position: inspectedBot.bot.position,
    observedAtElapsedMs: state.playerKnowledge.lastSeenBotById?.[inspectedBot.bot.botId]?.observedAtElapsedMs ?? state.simElapsedMs,
    current: true,
    talent: { grade: botGradeAt(inspectedBot.chunk, inspectedBot.offset), kind: botKindAt(inspectedBot.chunk, inspectedBot.offset) },
    level: inspectedBot.chunk.levels[inspectedBot.offset]!,
    territoryLevel: inspectedBot.bot.territoryLevel,
    population: inspectedBot.chunk.population[inspectedBot.offset]!,
    lordFate: inspectedBot.bot.lordFate,
    potableWaterMl: projectedBotWaterMl(inspectedBot.bot, inspectedBot.chunk.population[inspectedBot.offset]!,
      inspectedBot.chunk.lastIntegratedAtElapsedMs[inspectedBot.offset]!, state.simElapsedMs),
    resourceBalances: projectedBotResources(inspectedBot.chunk, inspectedBot.offset, inspectedBot.bot, state.simElapsedMs),
    structures: inspectedBot.bot.structures.map(structure => ({
      id: structure.id, blueprintId: structure.blueprintId, anchor: structure.anchor, level: structure.level, status: structure.status,
      workCompleted: projectedStructureWork(structure, 'workCompleted'), workRequired: structure.workRequired,
      repairWorkCompleted: projectedStructureWork(structure, 'repairWorkCompleted'), repairWorkRequired: structure.repairWorkRequired,
    })),
    army: inspectedBot.bot.armyMovement?.unitKind === 'army' ? [] : inspectedBot.bot.cohorts.map(({ id, templateId, livingCount, level, order, location }) => ({ id, templateId, livingCount, level, order, location })),
  } : null;
  const combat = projectStage07Combat(state, world);
  const fixedCombatTargets = combat.target && (combat.target.state === 'available' || combat.target.state === 'reacting')
    && sights.some(sight => Math.hypot(combat.target!.position.xMm - sight.center.xMm, combat.target!.position.yMm - sight.center.yMm) <= sight.radiusMm)
    ? [{ targetId: combat.target.id, label: combat.target.label, position: combat.target.position, status: combat.target.state as 'available' | 'reacting' }]
    : [];
  const wildlifeCombatTargets = wildlifeEntities.flatMap(entity => {
    const group = state.wildlife.groups.find(candidate => candidate.id === entity.ref.id);
    if (!group || group.remaining <= 0) return [];
    const target = (state.combat?.wildlifeTargets ?? []).find(candidate => candidate.wildlifeGroupId === group.id && (candidate.status === 'available' || candidate.status === 'reacting'));
    const status = target?.status === 'reacting' ? 'reacting' as const : 'available' as const;
    return [{ targetId: `TARGET-${group.id}`, label: entity.label, position: target?.position ?? group.position, status, groupId: group.id, remaining: group.remaining }];
  });
  const combatTargets = [...fixedCombatTargets, ...wildlifeCombatTargets];
  const caravan = state.stage08.enabled ? state.stage08.caravan : null;
  const caravanPosition = caravan ? world.sites.find(site => site.id === caravan.locationSiteId)?.position : null;
  const caravanVisible = Boolean(caravanPosition && ['distressed', 'negotiated', 'escorting', 'arrived'].includes(caravan!.status)
    && sights.some(sight => Math.hypot(caravanPosition!.xMm - sight.center.xMm, caravanPosition!.yMm - sight.center.yMm) <= sight.radiusMm));
  const atKronaGate = playerAtSiteForView(state, world, 'SITE-LL01-046');
  const marketPosition = world.sites.find(site => site.id === 'SITE-LL01-046')?.position;
  const botMarketListings = atKronaGate && marketPosition && state.botPopulation
    ? state.botPopulation.marketListings.filter(listing => listing.status === 'active' && listing.expiresAtElapsedMs > state.simElapsedMs)
      .flatMap(listing => {
        const sellerRow = state.botPopulation!.chunks.flatMap(chunk => chunk.cold.map((bot, offset) => ({ bot, alive: chunk.alive[offset] !== 0 })))
          .find(row => row.bot.botId === listing.sellerBotId);
        if (!sellerRow || !sellerRow.alive || sellerRow.bot.lordFate.status !== 'active'
          || Math.hypot(sellerRow.bot.position.xMm - marketPosition.xMm, sellerRow.bot.position.yMm - marketPosition.yMm) > BOT_MARKET_ACCESS_RADIUS_MM) return [];
        return [{
          id: listing.id, sellerBotId: listing.sellerBotId, sellerName: sellerRow.bot.name, blueprintId: listing.blueprintId,
          paymentResource: listing.paymentResource, askAmount: listing.askAmount, expiresAtElapsedMs: listing.expiresAtElapsedMs,
          compatibleBlueprintId: playerBlueprintAdapter(listing.blueprintId), blocker: botMarketListingBlocker(listing),
        }];
      }).sort((a, b) => compareMarketListings(
        state.botPopulation!.marketListings.find(row => row.id === a.id)!,
        state.botPopulation!.marketListings.find(row => row.id === b.id)!))
    : [];
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
      // Internal schedules are never player knowledge: publication requires an actual opening receipt.
      // Do not substitute elapsed time alone; a paused/unsettled world must not leak future events.
      if (event.status === 'scheduled' || event.openReceiptSequence === null || event.opensAtMs > state.simElapsedMs) return [];
      const source = world.eventSchedule.find(row => row.id === event.id);
      if (!source) return [];
      if (!world.eventContracts.some(candidate => candidate.eventId === event.id)) throw new Error(`EVENT_CONTRACT_MISSING:${event.id}`);
      return [{
        id: event.id,
        displayName: source.displayName,
        status: event.status,
        readiness: eventRuntimeReadiness(event.id),
        opensAtElapsedMs: event.opensAtMs,
        locksAtElapsedMs: event.locksAtMs,
        resolvesAtElapsedMs: event.resolvesAtMs,
        openReceiptSequence: event.openReceiptSequence,
        lockReceiptSequence: event.lockReceiptSequence,
        resolutionReceiptSequence: event.resolutionReceiptSequence,
        objective: (() => {
          const rule = eventMechanicsFor(event.id);
          const progress = state.eventProgress.find(candidate => candidate.eventId === event.id);
          return rule && progress ? {
            title: rule.title, progress: progress.objectiveProgress, target: rule.target, score: progress.score,
            participated: progress.participated, choiceId: progress.choiceId,
          } : null;
        })(),
        outcome: state.eventProgress.find(candidate => candidate.eventId === event.id)?.outcome ?? null,
        rewardKrona: state.eventProgress.find(candidate => candidate.eventId === event.id)?.rewardKrona ?? 0,
        claimExpiresAtElapsedMs: state.eventProgress.find(candidate => candidate.eventId === event.id)?.claimExpiresAtElapsedMs ?? null,
        rewardClaimed: Boolean(state.eventProgress.find(candidate => candidate.eventId === event.id)?.claimReceiptId),
        eventShop: (() => {
          const progress = state.eventProgress.find(candidate => candidate.eventId === event.id);
          return progress ? {
            status: progress.shopStatus,
            scoreAvailable: progress.score - progress.scoreSpent,
            priceScore: EVENT_SHOP_MARK_PRICE,
            itemTemplateId: `EVENT-MARK-${event.id}`,
            priceCurrency: 'event_score' as const,
            stockRemaining: progress.shopStockRemaining,
            initialStock: progress.shopInitialStock,
            purchasedQuantity: progress.shopPurchasedQuantity,
            expiresAtElapsedMs: progress.shopExpiresAtElapsedMs,
          } : null;
        })(),
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
      botMarketListings,
      auctionLots: atKronaGate ? state.stage08.auctionLots.filter(lot => lot.status !== 'closed') : [],
      auctionBids: atKronaGate ? state.stage08.auctionBids.filter(bid => bid.bidderId === state.player.id) : [],
      rankSnapshots: state.stage08.rankSnapshots,
      openingBoard: openingBoardView(state),
    },
    botBoardSnapshots: state.botPopulation?.boardSnapshots ?? [],
    botInspection,
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
      // The source-fixed registry stays in world data until the repaired house unlocks it.
      // Keep the player's construction catalogue restricted to actual unlock entitlements.
      blueprints: OPENING_BUILDINGS.filter(definition => state.construction.unlockedBlueprintIds.includes(definition.id)),
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
      enemyBots,
      enemyArmies,
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
