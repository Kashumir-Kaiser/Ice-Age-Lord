import { GAME_STATE_SCHEMA_VERSION, UNIT_INVENTORY_CONTAINER_PREFIX, type GameState, type WorldDefinition } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { DAY_MS, HOUR_MS, nextMidnightAfter } from './time.ts';
import { LEGACY_WORK_MS_PER_RESOURCE_UNIT, seedSpatialKnowledge } from './spatial.ts';
import { RESOURCE_STORAGE } from '../../content/src/resourceBalance.ts';

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

function migrateV3ToV4(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id) throw new Error('SAVE_STATE_SCHEMA_MIGRATION_WORLD_UNSUPPORTED');
  const legacyCapacity: Readonly<Record<string, number>> = {
    'RES-LL01-01': 780,
    'RES-LL01-02': 1_240,
    'RES-LL01-03': 20_000,
    'RES-LL01-04': 430,
    'RES-LL01-05': 14,
  };
  const oldBalances = new Map<string, Record<string, any>>((candidate.spatial?.resourceBalances ?? []).map((balance: Record<string, any>) => [balance.resourceId, balance]));
  const elapsed = candidate.simElapsedMs as number;
  const resourceBalances = world.resources.map(resource => {
    const prior = oldBalances.get(resource.id);
    if (!prior) return {
      resourceId: resource.id,
      remaining: resource.capacity,
      reserved: 0,
      materialId: resource.materialId,
      unit: resource.unit,
      lastSettledAtElapsedMs: elapsed,
      lastRenewedAtElapsedMs: null,
      dailyRemaining: resource.dailyQuota,
      dailyResetAtElapsedMs: resource.dailyQuota === null ? null : nextMidnightAfter(elapsed),
      amountKnowledge: 'unknown',
    };
    const oldCap = legacyCapacity[resource.id] ?? resource.capacity;
    const alreadyHarvested = Math.max(0, oldCap - Number(prior.remaining));
    return {
      ...prior,
      remaining: Math.max(0, Math.min(resource.capacity, resource.capacity - alreadyHarvested)),
      materialId: resource.materialId,
      unit: resource.unit,
      dailyRemaining: resource.dailyQuota === null ? null
        : prior.dailyRemaining === null ? resource.dailyQuota : Math.min(resource.dailyQuota, prior.dailyRemaining),
      dailyResetAtElapsedMs: resource.dailyQuota === null ? null : prior.dailyResetAtElapsedMs ?? nextMidnightAfter(elapsed),
    };
  });
  const harvestJobs = (candidate.spatial?.harvestJobs ?? []).map((job: Record<string, any>) => ({
    ...job,
    workMsPerUnit: Number.isSafeInteger(job.workMsPerUnit) && job.workMsPerUnit > 0 ? job.workMsPerUnit : LEGACY_WORK_MS_PER_RESOURCE_UNIT,
  }));
  const migrated = {
    ...candidate,
    schemaVersion: 4,
    spatial: { ...candidate.spatial, resourceBalances, harvestJobs },
  };
  return migrated as GameState;
}

function migrateV4ToV5(candidate: Record<string, any>): GameState {
  const inventory = candidate.inventory ?? { containers: [] };
  const containers = [...(inventory.containers ?? [])];
  for (const unit of candidate.ownedUnits ?? []) {
    const id = `${UNIT_INVENTORY_CONTAINER_PREFIX}${unit.id}`;
    if (containers.some((container: Record<string, any>) => container.id === id)) continue;
    containers.push({
      id,
      kind: 'unit_inventory',
      capacitySlots: RESOURCE_STORAGE.unitInventorySlots,
      occupiedSlots: null,
      location: { kind: 'unit', unitId: unit.id },
      observed: true,
      stacks: [],
    });
  }
  return {
    ...candidate,
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    inventory: { ...inventory, containers },
  } as GameState;
}

export function upgradeGameState(value: unknown, world: WorldDefinition = ACTIVE_WORLD_PACKAGE): GameState {
  let candidate = asRecord(value);
  if (candidate.schemaVersion === 1) candidate = migrateV1ToV2(candidate);
  if (candidate.schemaVersion === 2) candidate = migrateV2ToV3(candidate, world);
  if (candidate.schemaVersion === 3) candidate = migrateV3ToV4(candidate, world);
  if (candidate.schemaVersion === 4) candidate = migrateV4ToV5(candidate);
  if (candidate.schemaVersion !== GAME_STATE_SCHEMA_VERSION) throw new Error('SAVE_STATE_SCHEMA_UNSUPPORTED');
  return candidate as unknown as GameState;
}
