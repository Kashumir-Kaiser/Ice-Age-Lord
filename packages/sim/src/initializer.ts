import { GAME_STATE_SCHEMA_VERSION, type GameState, type WorldDefinition } from '../../contracts/src/index.ts';
import { assertCompiledWorld } from '../../content/src/compiler.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { OPENING_BUILDINGS_RULE_VERSION, PLACEMENT_OVERLAY_VERSION, LABOR_OVERLAY_VERSION } from '../../content/src/buildings.ts';
import { canonicalStateHash } from './hash.ts';
import { seedConvenienceBag } from './bag.ts';
import { seedSpatialKnowledge } from './spatial.ts';
import { stage07OpeningCorpse, STAGE07_OPENING_CORPSE_ID } from './stage07.ts';

export type NewGameOptions = {
  saveId: string;
  campaignId: string;
  soulId: string;
  worldPackageId: string;
  rulesetVersion: string;
  contentVersion: string;
  seed: string;
};

const hourMs = 60 * 60 * 1000;
const empty = [] as const;

function requireIdentifier(name: string, value: string): void {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`NEW_GAME_INPUT_INVALID: ${name} must be a non-empty string.`);
}

function sourceSetHash(world: WorldDefinition): string {
  return canonicalStateHash(world.lockedSourceHashes);
}

export function createNewGame(options: NewGameOptions, world: WorldDefinition): GameState {
  for (const [key, value] of Object.entries(options)) requireIdentifier(key, value);
  if (options.worldPackageId !== world.id) throw new Error(`WORLD_PACKAGE_NOT_FOUND: ${options.worldPackageId}`);
  if (options.contentVersion !== world.contentVersion) throw new Error(`CONTENT_VERSION_MISMATCH: requested ${options.contentVersion}; package ${world.contentVersion}`);
  if (options.rulesetVersion !== RULESET_VERSION) throw new Error(`RULESET_VERSION_UNSUPPORTED: ${options.rulesetVersion}`);
  assertCompiledWorld(world);

  const bag = seedConvenienceBag(options.campaignId, options.soulId);
  const supplyContainerId = 'LL-CNT-SUPPLY-01';
  const bagContainerId = 'LL-CNT-CARRIED-FOOD-BAG-01';
  const supplySiteId = 'SITE-LL01-002';
  const supplyItems = [
    ['ASSET-SUPPLY-BREAD-01', 'BREAD', 20],
    ['ASSET-SUPPLY-IRON-POT-01', 'IRON-POT', 1],
    ['ASSET-SUPPLY-STONE-AXE-01', 'STONE-AXE', 4],
    ['ASSET-SUPPLY-STONE-HAMMER-01', 'STONE-HAMMER', 4],
    ['ASSET-SUPPLY-WOODEN-STAFF-01', 'WOODEN-STAFF', 1],
    ['ASSET-SUPPLY-WOODEN-ROUND-SHIELD-01', 'WOODEN-ROUND-SHIELD', 1],
  ] as const;

  const state: GameState = {
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    saveId: options.saveId,
    campaignId: options.campaignId,
    worldPackageId: world.id,
    contentVersion: options.contentVersion,
    contentSourceSetSha256: sourceSetHash(world),
    rulesetVersion: options.rulesetVersion,
    seed: options.seed,
    revision: 0,
    lastEventSequence: 0,
    simElapsedMs: 0,
    clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' },
    timeBoundaries: {
      nextHourlySettlementAtElapsedMs: hourMs,
      nextMidnightAtElapsedMs: 17 * hourMs,
      nextDailySettlementAtElapsedMs: 24 * hourMs,
      nextSunsetAtElapsedMs: 9.5 * hourMs,
      nextTwilightEndAtElapsedMs: 10 * hourMs,
      nextDawnAtElapsedMs: 24 * hourMs,
      protectionExpiryAtElapsedMs: 144 * hourMs,
    },
    survival: {
      coldLoadMicro: 0,
      coldLoadRemainder: 0,
      coldStatus: 'weather_unresolved',
      environment: null,
      blocker: 'OPENING_WEATHER_RECORD_NOT_SEEDED',
      hungerState: 'FED',
    },
    player: {
      id: 'LI_LAN',
      name: 'Lí Lan',
      age: 24,
      sex: 'FEMALE',
      nationality: 'TRUNG_HOA',
      level: 1,
      xp: 0,
      formTier: 1,
      attributes: { STR: 8, VIT: 8, DEX: 8, INT: 9, SPI: 18, WIL: 9, PER: 8, PRE: 13, LUK: 9 },
      talent: { id: 'LL-TAL-SSS-DEATH-REVIVER', name: 'Tử Phục Linh Sư', grade: 'SSS' },
      mana: { current: 236, max: 236, baseRegenPerSecond: 0.45, lastSettledAtElapsedMs: 0 },
      career: {
        state: 'unemployed_card_sealed',
        sealedPayload: { careerId: 'JOB-SUM-NECRO-01', openingSkillId: 'SK-OPEN-NECRO-01', growthAllocation: 'SPI/PRE' },
      },
      position: world.origin,
      location: { kind: 'site', siteId: 'SITE-LL01-000' },
      relationships: empty,
    },
    territory: {
      id: 'H0',
      stage: 'H0',
      position: world.origin,
      survivalFire: {
        level: 1,
        active: true,
        heatRadiusMetres: 10,
        heatDeltaCelsius: { min: 5, max: 20 },
        fuelRemaining: null,
        fuelKnowledge: 'state_unobserved',
        nextFuelConsumptionAtElapsedMs: null,
        fuelBlocker: 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED',
        protectedThroughElapsedMs: 144 * hourMs,
        protectionEventId: 'EV00-SAFE-FIRE',
        protectionStatus: 'pending_opening_settlement',
      },
      lordHouseId: 'LL-BLD-HOUSE-01',
      supplyContainerId,
      tombId: 'LL-BLD-TOMB-01',
      tomb: {
        deathQi: { current: 20, capacity: 20, refillAtWorldTime: '00:00', nextRefillAtElapsedMs: 17 * hourMs },
        queue: empty,
        output: {
          formTier: 0,
          grade: 'Thường',
          level: 1,
          xp: 0,
          faction: 'DARK',
          hero: false,
          loyalty: 'ABSOLUTE_TO_LI_LAN',
          xpMirrorEligible: false,
          baseLaborRateWuPerHour: 1,
        },
      },
      repaired: false,
    },
    inventory: {
      containers: [
        {
          id: supplyContainerId,
          kind: 'territory_supply',
          capacitySlots: 40,
          occupiedSlots: null,
          location: { kind: 'site', siteId: supplySiteId },
          observed: false,
          stacks: supplyItems.map(([itemId, templateId, quantity]) => ({
            itemId,
            templateId,
            quantity,
            reservedQuantity: 0,
            unit: 'item',
            ownerId: 'H0',
            equipped: false as const,
            equippedSlotId: null,
            quality: null,
            ...(templateId === 'BREAD' ? { foodUnitsPerItem: 1 } : {}),
            provenance: 'immutable_source_fact' as const,
          })),
        },
        {
          id: bagContainerId,
          kind: 'carried_bag',
          capacitySlots: null,
          occupiedSlots: null,
          location: { kind: 'carried', ownerId: 'LI_LAN' },
          observed: false,
          stacks: bag.items.map(item => ({
            itemId: item.itemId,
            templateId: item.templateId,
            quantity: item.quantity,
            reservedQuantity: 0,
            unit: 'item',
            ownerId: 'LI_LAN',
            equippedSlotId: null,
            quality: null,
            foodUnitsPerItem: item.units,
            equipped: false as const,
            provenance: 'campaign_fixed' as const,
          })),
        },
      ],
    },
    ownedUnits: empty,
    buildings: [
      { id: 'LL-BLD-HOUSE-01', kind: 'lord_house', name: 'Nhà Lãnh Chúa Hư Hại', level: 1, status: 'damaged', repairRequirements: [{ itemId: 'STONE', quantity: 10 }, { itemId: 'WOOD', quantity: 20 }], siteId: 'SITE-LL01-001', position: world.sites.find(site => site.id === 'SITE-LL01-001')?.position ?? world.origin, footprintAreaM2: 30 },
      { id: 'LL-BLD-FIRE-01', kind: 'survival_fire', name: 'Lửa Trại', level: 1, status: 'active', repairRequirements: empty, siteId: 'SITE-LL01-000', position: world.origin, footprintAreaM2: null },
      { id: 'LL-BLD-TOMB-01', kind: 'tomb', name: 'Ngôi Mộ', level: 1, status: 'active', repairRequirements: empty, siteId: 'SITE-LL01-003', position: world.sites.find(site => site.id === 'SITE-LL01-003')?.position, footprintAreaM2: null },
    ],
    construction: {
      registryVersion: OPENING_BUILDINGS_RULE_VERSION,
      placementOverlayVersion: PLACEMENT_OVERLAY_VERSION,
      laborOverlayVersion: LABOR_OVERLAY_VERSION,
      unlockedBlueprintIds: empty, jobs: empty, residents: empty, firstBuildReceiptIds: empty, rewardEntitlements: empty, operatingServices: empty,
    },
    jobs: empty,
    travel: { activeOrderId: null, routeId: null, orders: empty },
    exploration: { exploredGeometry: empty, searchHistory: empty },
    spatial: {
      movementOrders: empty,
      searchJobs: empty,
      harvestJobs: empty,
      resourceBalances: world.resources.map(resource => ({
        resourceId: resource.id,
        remaining: resource.capacity,
        reserved: 0,
        materialId: resource.materialId,
        unit: resource.unit,
        lastSettledAtElapsedMs: 0,
        lastRenewedAtElapsedMs: null,
        dailyRemaining: resource.dailyQuota,
        dailyResetAtElapsedMs: resource.dailyQuota === null ? null : 17 * hourMs,
        amountKnowledge: 'unknown' as const,
      })),
      signals: empty,
      sweepHistory: empty,
    },
    playerKnowledge: {
      knownSiteIds: ['SITE-LL01-000'],
      knownChestIds: empty,
      knownLairIds: empty,
      knownResourceIds: empty,
      knownRouteIds: empty,
      knownSignalIds: empty,
      knownCorpseIds: [STAGE07_OPENING_CORPSE_ID],
      careerCardObserved: false,
      lastSeenByEntity: { 'site:SITE-LL01-000': { observedAtElapsedMs: 0, knowledge: 'current' } },
      lastInspectedEntityIds: empty,
    },
    fieldChestStates: world.fieldChests.map(chest => ({
      chestId: chest.id,
      state: 'unopened' as const,
      openedAtElapsedMs: null,
      discovery: 'hidden' as const,
      discoveredAtElapsedMs: null,
      signalId: null,
      custody: 'world' as const,
      claimedById: null,
      carrierId: null,
    })),
    corpses: [
      ...world.fixedActors.filter(actor => actor.lifeStateAtT0 === 'corpse').map(actor => ({
        id: `CORPSE-${actor.id}`,
        actorId: actor.id,
        location: { kind: 'site' as const, siteId: actor.fixedSiteId },
        state: 'unobserved' as const,
        sourceStatus: actor.fixedStatus,
        createdAtElapsedMs: 0,
        ownershipId: null,
      })),
      stage07OpeningCorpse(),
    ],
    progression: { transactions: [], mirrorReceiptKeys: [] },
    quests: world.dormantQuestIds.map(questId => ({ questId, state: 'dormant' as const, acceptedAt: null, completedAt: null, rewardReceipt: null })),
    calendar: world.eventSchedule.map(({ statusAtT0: _sourceStatus, ...event }) => ({
      ...event,
      status: 'scheduled' as const,
      openReceiptSequence: null,
      resolutionReceiptSequence: null,
    })),
    offers: empty,
    currency: empty,
    receipts: empty,
    rngStreams: { convenienceBag: { algorithm: 'HASH-PRIMITIVE-1.0', counter: bag.totalHashDraws } },
    bagSeed: {
      inspected: false,
      commitmentSha256: bag.commitmentSha256,
      totalHashDraws: bag.totalHashDraws,
      rolls: bag.rolls,
      sealedItems: bag.items,
    },
    cleanStartDiagnostics: { contaminationCount: 0, legacyFlags: empty, historicalProgress: false },
  };

  seedSpatialKnowledge(state, world);
  assertCleanStart(state, world);
  return state;
}

export function assertCleanStart(state: GameState, world: WorldDefinition): void {
  const contamination: string[] = [];
  if (state.simElapsedMs !== 0) contamination.push('simElapsedMs');
  if (state.player.level !== 1 || state.player.xp !== 0) contamination.push('player progression');
  if (state.ownedUnits.length !== 0) contamination.push('owned units');
  if (state.playerKnowledge.knownChestIds.length !== 0 || state.playerKnowledge.knownLairIds.length !== 0) contamination.push('prior exploration');
  if (state.fieldChestStates.some(chest => chest.state !== 'unopened')) contamination.push('opened field chest');
  if (state.quests.some(quest => quest.state !== 'dormant' || quest.rewardReceipt !== null)) contamination.push('quest progress');
  if (state.calendar.length !== 30 || state.calendar.some(event => event.status !== 'scheduled' || event.openReceiptSequence !== null || event.resolutionReceiptSequence !== null)) contamination.push('calendar state');
  if (state.corpses.some(corpse => corpse.createdAtElapsedMs !== 0 || corpse.ownershipId !== null || corpse.state !== 'unobserved')) contamination.push('corpse lifecycle');
  if (state.buildings.find(building => building.kind === 'lord_house')?.status !== 'damaged') contamination.push('lord house state');
  if (state.player.career.state !== 'unemployed_card_sealed') contamination.push('career card state');
  if (state.inventory.containers.length !== 2 || state.inventory.containers.some(container => container.stacks.some(item => item.equipped))) contamination.push('starter asset ownership/equipment');
  const uniqueWorldUnits = new Set(world.lairUnits.map(unit => unit.id));
  if (world.lairs.length !== 15 || uniqueWorldUnits.size !== 693) contamination.push('fixed lair identities');
  if (contamination.length !== 0) throw new Error(`CLEAN_START_CONTAMINATION: ${contamination.join(', ')}`);
  if (state.cleanStartDiagnostics.contaminationCount !== 0) throw new Error('CLEAN_START_DIAGNOSTIC_COUNT_INVALID');
}

export function elapsedMsToWorldClock(simElapsedMs: number): { day: number; hour: number; minute: number } {
  if (!Number.isSafeInteger(simElapsedMs) || simElapsedMs < 0) throw new Error('SIM_TIME_INVALID');
  const dayMs = 24 * hourMs;
  const shifted = simElapsedMs + 7 * hourMs;
  return {
    day: Math.floor(shifted / dayMs) + 1,
    hour: Math.floor((shifted % dayMs) / hourMs),
    minute: Math.floor((shifted % hourMs) / 60_000),
  };
}
