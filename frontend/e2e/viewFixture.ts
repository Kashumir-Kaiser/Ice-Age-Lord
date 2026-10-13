import type { PlayerView } from '../../packages/contracts/src/index.ts';

export const fireRef: PlayerView['territory']['survivalFire']['ref'] = {
  type: 'site',
  id: 'SITE-LL01-000',
};

export function playerView(revision = 1): PlayerView {
  return {
    schemaVersion: 3,
    saveId: 'save-live-01',
    revision,
    lastEventSequence: revision,
    simElapsedMs: 0,
    clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' },
    clockStatus: { driver: 'active', catchingUp: false, targetSimElapsedMs: 0, leaseRemainingMs: 5000 },
    calendar: [],
    eventProgressionBlocker: null,
    quests: [],
    currency: [],
    stage08: {
      caravan: null,
      marketOffers: [],
      botMarketListings: [],
      auctionLots: [],
      auctionBids: [],
      rankSnapshots: [],
      openingBoard: {
        boardId: 'OPENING_LEVEL', status: 'scheduled', opensAtElapsedMs: 0, closesAtElapsedMs: 0,
        displayDelayMs: 0, rows: [], rewardClaimStatus: 'unavailable',
      },
    },
    botBoardSnapshots: [],
    botInspection: null,
    worldClock: { day: 1, hour: 7, minute: 0, lightPhase: 'daylight' },
    survival: { coldLoad: null, coldStatus: 'weather_unresolved', blocker: 'OPENING_WEATHER_RECORD_NOT_SEEDED', hungerState: 'FED' },
    player: {
      id: 'LI_LAN', name: 'Lí Lan', level: 1, xp: 0, formTier: 1,
      talent: { name: 'Tử Phục Linh Sư', grade: 'SSS' },
      attributes: { STR: 8 }, mana: { current: 236, max: 236 }, careerState: 'unemployed',
      position: { xMm: 0, yMm: 0, sourceZMetres: 0 },
    },
    careerCard: { observed: false, active: false, openingSkillLearned: false, career: null },
    territory: {
      id: 'H0', stage: 'H0', position: { xMm: 0, yMm: 0 },
      survivalFire: { ref: fireRef, level: 1, active: true, heatRadiusMetres: 10, fuelRemaining: null, hasFuel: false, fuelKnowledge: 'state_unobserved', nextFuelConsumptionAtElapsedMs: null, fuelBlocker: 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED', protection: 'active' },
      tomb: {
        level: 1,
        deathQi: { current: 20, capacity: 20, nextRefillAtElapsedMs: 61200000 },
        productionSlots: 2,
        activeCount: 0,
        queuedCount: 0,
        nextCompletionAtElapsedMs: null,
        queue: [],
        output: { formTier: 0, grade: 'Thường', level: 1, xp: 0, faction: 'DARK', hero: false, loyalty: 'ABSOLUTE_TO_LI_LAN', xpMirrorEligible: false, baseLaborRateWuPerHour: 1 },
      },
      buildings: [{ id: 'LL-BLD-FIRE-01', name: 'Lửa Trại', status: 'active', kind: 'fire', level: 1 }],
    },
    construction: {
      unlockedBlueprintIds: [],
      blueprints: [],
      jobs: [],
      residents: [],
      rewardEntitlements: [],
      operatingServices: [],
      farmerHouseCapacity: 0,
      occupiedHousing: 0,
    },
    inventory: {
      inspectableContainers: [{ containerId: 'LL-CNT-CARRIED-FOOD-BAG-01', label: 'Bịch đồ ăn', kind: 'carried_bag' }],
      containers: [],
    },
    units: [],
    jobs: [],
    visibleMap: {
      coordinateSystem: 'LL01-LOCAL-KM',
      coordinateEncoding: 'integer millimetres from H0; source z retained in metres',
      currentSight: [], visibleGeometry: [], exploredGeometry: [], terrain: [], resourceFeatures: [],
      entities: [{
        ref: fireRef, label: 'Lửa Trại Cấp 1', category: 'site', knowledge: 'current',
        observedAtElapsedMs: 0, position: { xMm: 0, yMm: 0 },
        actions: [{ actionId: 'inspect_entity', enabled: true, reasonCode: null, requirements: [] }],
      }],
      knownRoutes: [], activeOrders: [], heatOverlays: [],
    },
    spatial: { navigationRuleVersion: 'LL01-NAVIGATION-OVERLAY-1.0', movementOrders: [], searchJobs: [], harvestJobs: [], resources: [] },
    journal: [],
  };
}
