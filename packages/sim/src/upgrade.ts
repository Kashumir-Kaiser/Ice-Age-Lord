import { GAME_STATE_SCHEMA_VERSION, UNIT_INVENTORY_CONTAINER_PREFIX, type GameState, type WorldDefinition } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { OPENING_BUILDINGS, OPENING_BUILDINGS_RULE_VERSION, PLACEMENT_OVERLAY_VERSION, LABOR_OVERLAY_VERSION } from '../../content/src/buildings.ts';
import { DAY_MS, HOUR_MS, MINUTE_MS, nextMidnightAfter } from './time.ts';
import { LEGACY_WORK_MS_PER_RESOURCE_UNIT, seedSpatialKnowledge } from './spatial.ts';
import { RESOURCE_STORAGE } from '../../content/src/resourceBalance.ts';
import { stage07OpeningCorpse } from './stage07.ts';
import { createStage07CombatState } from './combat.ts';
import { catchUpOpeningRivals, initialStage08State, verifyStage08State } from './stage08.ts';
import { OPENING_LEVEL_CLOSES_AT_MS } from './openingRanking.ts';
import { canonicalStateHash } from './hash.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { OPENING_FIRE_STARTER_FUEL_UNITS, OPENING_WEATHER_RECORD } from '../../content/src/openingEnvironment.ts';
import { actorSpeedMmPerHour } from './spatial.ts';
import { initialWildlifeState } from './wildlife.ts';
import { EVENT_SHOP_RULE_VERSION, initialEventProgress } from './eventRuntime.ts';

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
  // Terrain deposits did not exist in v3 saves. Re-scan the owner's current
  // sight after creating their balances so nearby starter features appear on
  // the map immediately when an old opening save is loaded.
  seedSpatialKnowledge(migrated as GameState, world);
  return migrated as GameState;
}

function migrateV4ToV5(candidate: Record<string, any>, world: WorldDefinition): GameState {
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
  const byKind: Record<string, string> = { lord_house: 'SITE-LL01-001', survival_fire: 'SITE-LL01-000', tomb: 'SITE-LL01-003' };
  const buildings = (candidate.buildings ?? []).map((building: Record<string, any>) => {
    const siteId = building.siteId ?? byKind[building.kind];
    const position = building.position ?? world.sites.find(site => site.id === siteId)?.position
      ?? (building.kind === 'survival_fire' ? candidate.territory.position : undefined);
    return { ...building, ...(siteId ? { siteId } : {}), ...(position ? { position } : {}) };
  });
  const unlockedBlueprintIds = candidate.territory?.repaired
    ? ['BP-OPEN-HEATER-01', 'BP-OPEN-KITCHEN-01', 'BP-OPEN-WOODWORKS-01', 'BP-OPEN-TAILOR-01', 'BP-OPEN-OREWORKS-01', 'BP-OPEN-FORGE-01', 'BP-OPEN-FARMHOUSE-01', 'BP-OPEN-INFIRMARY-01', 'BP-OPEN-SHELTER-01', 'BP-OPEN-WALL-01', 'BP-OPEN-GATE-01']
    : [];
  const elapsed = Number.isSafeInteger(candidate.simElapsedMs) && candidate.simElapsedMs >= 0 ? candidate.simElapsedMs : 0;
  const stage07Combat = candidate.combat ?? createStage07CombatState(world);
  const combat = elapsed === 0 ? stage07Combat : {
    ...stage07Combat,
    target: { ...stage07Combat.target, status: stage07Combat.target.status === 'available' ? 'retreated' : stage07Combat.target.status },
  };
  const corpses = candidate.corpses ?? (elapsed === 0 ? [stage07OpeningCorpse()] : []);
  return {
    ...candidate,
    schemaVersion: 5,
    inventory: { ...inventory, containers },
    buildings,
    construction: candidate.construction ?? {
      registryVersion: OPENING_BUILDINGS_RULE_VERSION,
      placementOverlayVersion: PLACEMENT_OVERLAY_VERSION,
      laborOverlayVersion: LABOR_OVERLAY_VERSION,
      unlockedBlueprintIds,
      jobs: [], residents: [], firstBuildReceiptIds: [], rewardEntitlements: [], operatingServices: [],
    },
    corpses,
    combat,
    progression: candidate.progression ?? { transactions: [], mirrorReceiptKeys: [] },
    offers: candidate.offers ?? [],
    currency: candidate.currency ?? [],
  } as GameState;
}

function migrateV5ToV6(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (!Array.isArray(candidate.calendar) || candidate.calendar.length !== world.eventSchedule.length
    || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_STAGE08_EVENT_CALENDAR');
  }
  const elapsed = candidate.simElapsedMs as number;
  let calendar = world.eventSchedule.map((source, index) => {
    const event = candidate.calendar[index] as Record<string, any>;
    if (event.id !== source.id || event.opensAtMs !== source.opensAtMs || event.locksAtMs !== source.locksAtMs
      || event.resolvesAtMs !== source.resolvesAtMs
      || (event.displayName !== undefined && event.displayName !== source.displayName)
      || !['scheduled', 'active', 'locked', 'resolved', 'cancelled'].includes(event.status)) {
      throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_STAGE08_EVENT_CALENDAR');
    }
    // Stage 4 wrote one resolution receipt for EV00 but had no distinct lock
    // transition. Preserve that legacy fact instead of reusing its sequence.
    const legacyEv00Resolution = event.id === 'EV00-SAFE-FIRE' && event.status === 'resolved';
    const lockReceiptSequence = Number.isSafeInteger(event.lockReceiptSequence) ? event.lockReceiptSequence : null;
    if (event.status === 'resolved' && lockReceiptSequence === null && !legacyEv00Resolution) {
      throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_STAGE08_EVENT_RECEIPTS');
    }
    return {
      ...event,
      displayName: source.displayName,
      lockReceiptSequence,
      blockedReceiptSequence: Number.isSafeInteger(event.blockedReceiptSequence) ? event.blockedReceiptSequence : null,
    };
  });
  const overdue = world.eventSchedule.find(source => source.id !== 'EV00-SAFE-FIRE'
    && source.opensAtMs <= elapsed
    && calendar.some(event => event.id === source.id && event.status === 'scheduled'));
  let eventProgressionBlocker = null;
  let clockControl = candidate.clockControl;
  if (overdue) {
    calendar = calendar.map(event => event.id === overdue.id
      ? { ...event, status: 'blocked', blockedReceiptSequence: null }
      : event);
    eventProgressionBlocker = {
      eventId: overdue.id,
      blockedAtElapsedMs: elapsed,
      reasonCode: 'EVENT_BOUNDARIES_UNSETTLED_DURING_MIGRATION',
      playerMessage: 'Tiến trình thế giới đã tạm dừng để rà soát một mốc sự kiện từ phiên bản lưu cũ.',
      receiptSequence: null,
    };
    clockControl = { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' };
  }
  const stage07Combat = candidate.combat ?? createStage07CombatState(world);
  const combat = elapsed === 0 ? stage07Combat : {
    ...stage07Combat,
    target: { ...stage07Combat.target, status: stage07Combat.target.status === 'available' ? 'retreated' : stage07Combat.target.status },
  };
  return {
    ...candidate,
    schemaVersion: 6,
    calendar,
    eventProgressionBlocker,
    clockControl,
    construction: candidate.construction ?? {
      registryVersion: OPENING_BUILDINGS_RULE_VERSION,
      placementOverlayVersion: PLACEMENT_OVERLAY_VERSION,
      laborOverlayVersion: LABOR_OVERLAY_VERSION,
      unlockedBlueprintIds: candidate.territory?.repaired
        ? OPENING_BUILDINGS.map(blueprint => blueprint.id)
        : [],
      jobs: [], residents: [], firstBuildReceiptIds: [], rewardEntitlements: [], operatingServices: [],
    },
    corpses: candidate.corpses ?? (elapsed === 0 ? [stage07OpeningCorpse()] : []),
    combat,
    progression: candidate.progression ?? { transactions: [], mirrorReceiptKeys: [] },
    offers: candidate.offers ?? [],
    currency: candidate.currency ?? [],
  } as GameState;
}

function migrateV6ToV7(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id || !Array.isArray(candidate.quests)
    || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_STAGE08_TRADE');
  }
  // A legacy save never gets a newly materialized caravan or reward retroactively.
  // Keep the fixed IDs dormant and leave the pre-Stage-08 campaign timeline intact.
  const stage08 = initialStage08State();
  stage08.enabled = false;
  stage08.caravan.status = 'withdrawn';
  const quests = candidate.quests.map((quest: Record<string, any>) => ({
    ...quest,
    objectiveId: quest.objectiveId ?? null,
    rewardStatus: quest.rewardStatus ?? 'unavailable',
    failureReason: quest.failureReason ?? null,
  }));
  return { ...candidate, schemaVersion: 7, stage08, quests } as GameState;
}

function migrateV7ToV8(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0
    || !Array.isArray(candidate.spatial?.searchJobs) || !candidate.territory?.survivalFire || !candidate.survival) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_AREA_DISPATCH_AND_OPENING_ENVIRONMENT');
  }
  const elapsed = candidate.simElapsedMs as number;
  const migrated = candidate as unknown as GameState;
  const searchJobs = candidate.spatial.searchJobs.map((job: Record<string, any>) => {
    if (!Array.isArray(job.path) || job.path.length < 2 || !Array.isArray(job.actorIds) || job.actorIds.length < 1) {
      throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_AREA_SEARCH_ROUTE');
    }
    return {
      ...job,
      returnPath: job.returnPath ?? [job.path.at(-1), job.path[0]],
      phase: job.phase ?? 'sweeping',
      speedMmPerHour: job.speedMmPerHour ?? actorSpeedMmPerHour(migrated, world, job.actorIds[0]),
      sweepStartProgressMm: job.sweepStartProgressMm ?? (job.path.length > 1 ? Math.hypot(job.path[1].xMm - job.path[0].xMm, job.path[1].yMm - job.path[0].yMm) : 0),
      stopAtElapsedMs: job.stopAtElapsedMs ?? null,
      targetCount: job.targetCount ?? null,
      foundChestIds: job.foundChestIds ?? [],
    };
  });
  const fire = candidate.territory.survivalFire;
  const fireFuel = fire.fuelRemaining == null
    ? (fire.active ? OPENING_FIRE_STARTER_FUEL_UNITS : 0)
    : fire.fuelRemaining;
  const activeFire = fire.active && fireFuel > 0;
  const coldLoad = Number.isSafeInteger(candidate.survival.coldLoadMicro) ? candidate.survival.coldLoadMicro : 0;
  const coldStatus = coldLoad >= 1_200_000_000 ? 'danger' : coldLoad >= 300_000_000 ? 'warning' : 'clear';
  return {
    ...candidate,
    schemaVersion: 8,
    contentVersion: world.contentVersion,
    contentSourceSetSha256: canonicalStateHash(world.lockedSourceHashes),
    rulesetVersion: RULESET_VERSION,
    survival: {
      ...candidate.survival,
      environment: candidate.survival.environment ?? { ...OPENING_WEATHER_RECORD },
      coldStatus: candidate.survival.environment == null ? coldStatus : candidate.survival.coldStatus,
      blocker: null,
    },
    territory: {
      ...candidate.territory,
      survivalFire: {
        ...fire,
        active: activeFire,
        fuelRemaining: fireFuel,
        fuelKnowledge: fire.fuelKnowledge ?? 'state_unobserved',
        nextFuelConsumptionAtElapsedMs: activeFire
          ? (fire.nextFuelConsumptionAtElapsedMs ?? elapsed + 15 * MINUTE_MS)
          : null,
        fuelBlocker: null,
      },
    },
    spatial: { ...candidate.spatial, searchJobs },
  } as GameState;
}

function migrateV8ToV9(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0
    || !Array.isArray(candidate.spatial?.searchJobs)) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_AREA_HUNT_DISPATCH');
  }
  return {
    ...candidate,
    schemaVersion: 9,
    spatial: {
      ...candidate.spatial,
      searchJobs: candidate.spatial.searchJobs.map((job: Record<string, any>) => ({
        ...job,
        mode: 'chest',
        foundTargetIds: [],
      })),
    },
  } as GameState;
}

function migrateV9ToV10(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_OPENING_RIVAL_LEDGER');
  }
  const baseline = initialStage08State();
  const priorStage08 = candidate.stage08 ?? {};
  const priorRankSnapshots = Array.isArray(priorStage08.rankSnapshots) ? priorStage08.rankSnapshots : [];
  const hasLegacyOpeningSettlement = priorRankSnapshots.some((snapshot: Record<string, any>) => snapshot.boardId === 'OPENING_LEVEL');
  const stage08 = {
    ...baseline,
    ...priorStage08,
    rankSnapshots: priorRankSnapshots.map((snapshot: Record<string, any>) => ({
      ...snapshot,
      rows: (snapshot.rows ?? []).map((row: Record<string, any>) => ({
        ...row,
        playerName: row.playerName ?? row.playerId,
        level: row.level ?? 10,
        rewardBandId: row.rewardBandId ?? 'LEGACY_RESULT_PRESERVED',
        rewardStatus: row.rewardStatus ?? 'npc_materialized',
        rewardItems: row.rewardItems ?? [],
        claimReceiptId: row.claimReceiptId ?? null,
      })),
    })),
    // Previously settled or blocked results stay frozen. We never replay the board and mint a retroactive prize during migration.
    openingRivals: hasLegacyOpeningSettlement || candidate.simElapsedMs >= OPENING_LEVEL_CLOSES_AT_MS
      ? []
      : (Array.isArray(priorStage08.openingRivals) ? priorStage08.openingRivals : baseline.openingRivals),
  };
  const migrated = { ...candidate, schemaVersion: 10, stage08 } as unknown as GameState;
  if (!hasLegacyOpeningSettlement && migrated.simElapsedMs < OPENING_LEVEL_CLOSES_AT_MS) {
    catchUpOpeningRivals(migrated, migrated.simElapsedMs);
  }
  return migrated;
}

function migrateV10ToV11(candidate: Record<string, any>, world: WorldDefinition): GameState {
  if (candidate.worldPackageId !== world.id || !Number.isSafeInteger(candidate.simElapsedMs) || candidate.simElapsedMs < 0
    || !Array.isArray(candidate.calendar) || !Array.isArray(candidate.fieldChestStates)
    || !candidate.playerKnowledge || !candidate.spatial) {
    throw new Error('SAVE_STATE_SCHEMA_MIGRATION_INVALID:_STAGE10_RUNTIME');
  }
  const elapsed = candidate.simElapsedMs as number;
  const blockerEventId = candidate.eventProgressionBlocker?.eventId ?? null;
  const expiredLegacyBlockerIds = new Set<string>();
  const calendar = (candidate.calendar as GameState['calendar']).map(event => {
    if (event.id === blockerEventId && event.status === 'blocked' && event.resolvesAtMs <= elapsed) {
      expiredLegacyBlockerIds.add(event.id);
      return { ...event, status: 'resolved' as const };
    }
    if (event.id === blockerEventId && event.status === 'blocked' && event.opensAtMs <= elapsed && event.locksAtMs > elapsed) {
      return { ...event, status: 'scheduled' as const };
    }
    return event;
  });
  const priorProgress = Array.isArray(candidate.eventProgress) ? candidate.eventProgress as Partial<GameState['eventProgress'][number]>[] : [];
  const defaults = initialEventProgress(world);
  const eventProgress = defaults.map(base => {
    const prior = priorProgress.find(progress => progress.eventId === base.eventId);
    const calendarRow = calendar.find(event => event.id === base.eventId);
    if (!prior) return {
      ...base,
      ...(expiredLegacyBlockerIds.has(base.eventId) ? {
        outcome: 'nonparticipant' as const,
        objectiveProgress: 0,
        score: 0,
        participated: false,
        scoreSpent: 0,
      } : {}),
      shopStatus: calendarRow?.status === 'resolved' ? 'expired' as const
        : calendarRow?.status === 'locked' ? 'closed' as const
          : calendarRow?.status === 'active' ? 'active' as const : 'scheduled' as const,
    };
    return {
      ...base,
      ...prior,
      ...(expiredLegacyBlockerIds.has(base.eventId) ? {
        outcome: 'nonparticipant' as const,
        objectiveProgress: 0,
        score: 0,
        participated: false,
        rewardKrona: 0,
        scoreSpent: 0,
        shopPurchasedQuantity: 0,
      } : {}),
      choiceId: prior.choiceId ?? null,
      scoreSpent: Number.isSafeInteger(prior.scoreSpent) ? prior.scoreSpent : 0,
      shopRuleVersion: prior.shopRuleVersion ?? EVENT_SHOP_RULE_VERSION,
      shopStatus: prior.shopStatus ?? (calendarRow?.status === 'resolved' ? 'expired'
        : calendarRow?.status === 'locked' ? 'closed' : calendarRow?.status === 'active' ? 'active' : 'scheduled'),
      shopInitialStock: Number.isSafeInteger(prior.shopInitialStock) ? prior.shopInitialStock : base.shopInitialStock,
      shopStockRemaining: Number.isSafeInteger(prior.shopStockRemaining) ? prior.shopStockRemaining : base.shopStockRemaining,
      shopPurchasedQuantity: Number.isSafeInteger(prior.shopPurchasedQuantity) ? prior.shopPurchasedQuantity : 0,
      shopExpiresAtElapsedMs: Number.isSafeInteger(prior.shopExpiresAtElapsedMs) ? prior.shopExpiresAtElapsedMs : base.shopExpiresAtElapsedMs,
      expiredItemQuantities: prior.expiredItemQuantities ?? {},
    };
  });
  const fieldChestStates = candidate.fieldChestStates.map((chest: Record<string, unknown>) => ({ ...chest, lootOutcome: chest.lootOutcome ?? null }));
  const priorCombat = candidate.combat ?? createStage07CombatState(world);
  const combat = { ...priorCombat, wildlifeTargets: priorCombat.wildlifeTargets ?? [] };
  return {
    ...candidate,
    schemaVersion: 11,
    calendar,
    eventProgress,
    eventProgressionBlocker: null,
    fieldChestStates,
    playerKnowledge: { ...candidate.playerKnowledge, knownWildlifeGroupIds: candidate.playerKnowledge.knownWildlifeGroupIds ?? [] },
    spatial: {
      ...candidate.spatial,
      searchJobs: (candidate.spatial.searchJobs ?? []).map((job: Record<string, unknown>) => ({
        ...job,
        mode: job.mode ?? 'chest',
        foundTargetIds: job.foundTargetIds ?? [],
      })),
    },
    wildlife: initialWildlifeState(world, elapsed),
    combat,
  } as GameState;
}

export function upgradeGameState(value: unknown, world: WorldDefinition = ACTIVE_WORLD_PACKAGE): GameState {
  let candidate = asRecord(value);
  if (candidate.schemaVersion === 1) candidate = migrateV1ToV2(candidate);
  if (candidate.schemaVersion === 2) candidate = migrateV2ToV3(candidate, world);
  if (candidate.schemaVersion === 3) candidate = migrateV3ToV4(candidate, world);
  if (candidate.schemaVersion === 4) candidate = migrateV4ToV5(candidate, world);
  if (candidate.schemaVersion === 5) candidate = migrateV5ToV6(candidate, world);
  if (candidate.schemaVersion === 6) candidate = migrateV6ToV7(candidate, world);
  if (candidate.schemaVersion === 7) candidate = migrateV7ToV8(candidate, world);
  if (candidate.schemaVersion === 8) candidate = migrateV8ToV9(candidate, world);
  if (candidate.schemaVersion === 9) candidate = migrateV9ToV10(candidate, world);
  if (candidate.schemaVersion === 10) candidate = migrateV10ToV11(candidate, world);
  if (candidate.schemaVersion !== GAME_STATE_SCHEMA_VERSION) throw new Error('SAVE_STATE_SCHEMA_UNSUPPORTED');
  if (candidate.construction && !Array.isArray(candidate.construction.operatingServices)) candidate.construction.operatingServices = [];
  verifyStage08State(candidate as unknown as GameState);
  return candidate as unknown as GameState;
}
