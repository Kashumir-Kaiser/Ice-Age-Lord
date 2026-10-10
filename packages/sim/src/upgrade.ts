import { GAME_STATE_SCHEMA_VERSION, type GameState, type WorldDefinition } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { OPENING_BUILDINGS_RULE_VERSION, PLACEMENT_OVERLAY_VERSION, LABOR_OVERLAY_VERSION } from '../../content/src/buildings.ts';
import { DAY_MS, HOUR_MS, nextMidnightAfter } from './time.ts';
import { seedSpatialKnowledge } from './spatial.ts';

function nextDailyBoundary(elapsed: number, offset: number): number {
  return offset + (Math.floor((elapsed - offset) / DAY_MS) + 1) * DAY_MS;
}

function asRecord(value: unknown): Record<string, any> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('SAVE_STATE_SCHEMA_INVALID');
  return structuredClone(value) as Record<string, any>;
}

function migrateV1ToV2(candidate: Record<string, any>): Record<string, any> {
  const state = candidate as Record<string, any>;
  if (!Number.isSafeInteger(state.simElapsedMs) || state.simElapsedMs < 0) throw new Error('SAVE_STATE_SCHEMA_INVALID');
  if ((state.territory.tomb.queue as readonly unknown[]).length !== 0 || state.ownedUnits.length !== 0 || state.jobs.length !== 0) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_BLOCKED:_STAGE04_DATA');
  }

  const elapsed = state.simElapsedMs as number;
  const fire = state.territory.survivalFire;
  const oldClock = state.clockControl;
  const sunsetOffset = 9.5 * HOUR_MS;
  const twilightOffset = 10 * HOUR_MS;
  const boundaries = {
    nextHourlySettlementAtElapsedMs: (Math.floor(elapsed / HOUR_MS) + 1) * HOUR_MS,
    nextMidnightAtElapsedMs: nextMidnightAfter(elapsed),
    nextDailySettlementAtElapsedMs: (Math.floor(elapsed / DAY_MS) + 1) * DAY_MS,
    nextSunsetAtElapsedMs: nextDailyBoundary(elapsed, sunsetOffset),
    nextTwilightEndAtElapsedMs: nextDailyBoundary(elapsed, twilightOffset),
    nextDawnAtElapsedMs: (Math.floor(elapsed / DAY_MS) + 1) * DAY_MS,
    protectionExpiryAtElapsedMs: fire.protectedThroughElapsedMs > elapsed ? fire.protectedThroughElapsedMs : null,
  };
  const migratedFire = {
    ...fire,
    fuelKnowledge: fire.fuelRemaining === null ? 'state_unobserved' : 'known',
    nextFuelConsumptionAtElapsedMs: null,
    fuelBlocker: fire.fuelRemaining === null ? 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED' : 'FUEL_DUE_TIME_UNRESOLVED_AFTER_SCHEMA_MIGRATION',
  };
  return {
    ...state,
    schemaVersion: 2,
    clockControl: {
      status: oldClock.status,
      selection: oldClock.status === 'paused' ? 'paused' : 'custom',
      speedPermille: oldClock.status === 'paused' ? 0 : Math.max(100, Math.min(3_600_000, Math.round(oldClock.speedPermille))),
      stopCondition: 'none',
    },
    timeBoundaries: boundaries,
    survival: {
      coldLoadMicro: 0,
      coldLoadRemainder: 0,
      coldStatus: 'weather_unresolved',
      environment: null,
      blocker: 'OPENING_WEATHER_RECORD_NOT_SEEDED',
      hungerState: 'FED',
    },
    player: { ...state.player, mana: { ...state.player.mana, baseRegenPerSecond: 0.45, lastSettledAtElapsedMs: elapsed } },
    territory: {
      ...state.territory,
      survivalFire: migratedFire,
      tomb: { ...state.territory.tomb, deathQi: { ...state.territory.tomb.deathQi, nextRefillAtElapsedMs: boundaries.nextMidnightAtElapsedMs } },
    },
  };
}

function migrateV2ToV3(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id) throw new Error('SAVE_STATE_SCHEMA_MIGRATION_WORLD_UNSUPPORTED');
  const elapsed = candidate.simElapsedMs as number;
  const territoryPosition = candidate.territory.position;
  const playerPosition = candidate.player.position ?? territoryPosition;
  const knownResources = new Set(candidate.playerKnowledge.knownResourceIds ?? []);
  const navigation = candidate.navigationOverlay ?? world.navigationOverlay;
  if (navigation.id !== world.navigationOverlay.id) throw new Error('SAVE_STATE_SCHEMA_MIGRATION_WORLD_UNSUPPORTED');
  const orders = candidate.travel?.orders ?? [];
  const resourceBalances = candidate.spatial?.resourceBalances ?? world.resources.map(resource => ({
    resourceId: resource.id,
    remaining: resource.capacity,
    reserved: 0,
    materialId: resource.materialId,
    unit: resource.unit,
    lastSettledAtElapsedMs: elapsed,
    lastRenewedAtElapsedMs: null,
    dailyRemaining: resource.dailyQuota,
    dailyResetAtElapsedMs: resource.dailyQuota === null ? null : nextMidnightAfter(elapsed),
    amountKnowledge: knownResources.has(resource.id) ? 'unknown' : 'unknown',
  }));
  const fieldChestStates = (candidate.fieldChestStates ?? world.fieldChests.map(chest => ({ chestId: chest.id, state: 'unopened', openedAtElapsedMs: null })))
    .map((chest: Record<string, any>) => ({
      ...chest,
      discovery: chest.discovery ?? 'hidden',
      discoveredAtElapsedMs: chest.discoveredAtElapsedMs ?? null,
      signalId: chest.signalId ?? null,
      custody: chest.custody ?? (chest.state === 'opened' ? 'opened' : chest.state === 'destroyed' ? 'destroyed' : 'world'),
      claimedById: chest.claimedById ?? null,
      carrierId: chest.carrierId ?? null,
    }));
  const migrated: Record<string, any> = {
    ...candidate,
    schemaVersion: 3,
    player: {
      ...candidate.player,
      position: playerPosition,
      location: candidate.player.location ?? { kind: 'site', siteId: 'SITE-LL01-000' },
    },
    ownedUnits: (candidate.ownedUnits ?? []).map((unit: Record<string, any>) => {
      const siteId = unit.location?.kind === 'site' ? unit.location.siteId : 'SITE-LL01-000';
      const site = world.sites.find(item => item.id === siteId);
      const position = unit.position ?? site?.position ?? territoryPosition;
      return { ...unit, position, location: unit.location ?? { kind: 'site', siteId } };
    }),
    travel: {
      activeOrderId: candidate.travel?.activeOrderId ?? null,
      routeId: candidate.travel?.routeId ?? null,
      orders,
    },
    exploration: {
      exploredGeometry: candidate.exploration?.exploredGeometry ?? [],
      searchHistory: candidate.exploration?.searchHistory ?? [],
    },
    spatial: {
      movementOrders: candidate.spatial?.movementOrders ?? orders,
      searchJobs: candidate.spatial?.searchJobs ?? [],
      harvestJobs: candidate.spatial?.harvestJobs ?? [],
      resourceBalances,
      signals: candidate.spatial?.signals ?? [],
      sweepHistory: candidate.spatial?.sweepHistory ?? [],
    },
    playerKnowledge: {
      ...candidate.playerKnowledge,
      knownRouteIds: candidate.playerKnowledge.knownRouteIds ?? [],
      knownSignalIds: candidate.playerKnowledge.knownSignalIds ?? [],
    },
    fieldChestStates,
  };
  seedSpatialKnowledge(migrated as unknown as GameState, world);
  return migrated as unknown as GameState;
}

function migrateV3ToV4(candidate: Record<string, any>, world: WorldDefinition): Record<string, any> {
  if (candidate.worldPackageId !== world.id) throw new Error('SAVE_STATE_SCHEMA_MIGRATION_WORLD_UNSUPPORTED');
  const byKind: Record<string, string> = { lord_house: 'SITE-LL01-001', survival_fire: 'SITE-LL01-000', tomb: 'SITE-LL01-003' };
  const buildings = (candidate.buildings ?? []).map((building: Record<string, any>) => {
    const siteId = building.siteId ?? byKind[building.kind];
    const position = building.position ?? world.sites.find(site => site.id === siteId)?.position ?? (building.kind === 'survival_fire' ? candidate.territory.position : undefined);
    return { ...building, ...(siteId ? { siteId } : {}), ...(position ? { position } : {}) };
  });
  const unlockedBlueprintIds = candidate.territory?.repaired
    ? ['BP-OPEN-HEATER-01', 'BP-OPEN-KITCHEN-01', 'BP-OPEN-WOODWORKS-01', 'BP-OPEN-TAILOR-01', 'BP-OPEN-OREWORKS-01', 'BP-OPEN-FORGE-01', 'BP-OPEN-FARMHOUSE-01', 'BP-OPEN-INFIRMARY-01', 'BP-OPEN-SHELTER-01', 'BP-OPEN-WALL-01', 'BP-OPEN-GATE-01']
    : [];
  return {
    ...candidate,
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    buildings,
    construction: candidate.construction ?? {
      registryVersion: OPENING_BUILDINGS_RULE_VERSION,
      placementOverlayVersion: PLACEMENT_OVERLAY_VERSION,
      laborOverlayVersion: LABOR_OVERLAY_VERSION,
      unlockedBlueprintIds,
      jobs: [], residents: [], firstBuildReceiptIds: [], rewardEntitlements: [], operatingServices: [],
    },
  };
}

export function upgradeGameState(value: unknown, world: WorldDefinition = ACTIVE_WORLD_PACKAGE): GameState {
  let candidate = asRecord(value);
  if (candidate.schemaVersion === 1) candidate = migrateV1ToV2(candidate);
  if (candidate.schemaVersion === 2) candidate = migrateV2ToV3(candidate, world);
  if (candidate.schemaVersion === 3) candidate = migrateV3ToV4(candidate, world);
  if (candidate.schemaVersion !== GAME_STATE_SCHEMA_VERSION) throw new Error('SAVE_STATE_SCHEMA_UNSUPPORTED');
  if (candidate.construction && !Array.isArray(candidate.construction.operatingServices)) candidate.construction.operatingServices = [];
  return candidate as unknown as GameState;
}
