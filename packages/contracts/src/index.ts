export const CONTRACT_SCHEMA_VERSION = 1 as const;
export const GAME_STATE_SCHEMA_VERSION = 4 as const;

export type Id = string;
export type EntityRef =
  | { type: 'site'; id: Id }
  | { type: 'resource'; id: Id }
  | { type: 'cache'; id: Id }
  | { type: 'item'; id: Id }
  | { type: 'unit'; id: Id }
  | { type: 'building'; id: Id }
  | { type: 'corpse'; id: Id }
  | { type: 'lair'; id: Id }
  | { type: 'route'; id: Id };

export type KnowledgeStatus = 'unknown' | 'signs_only' | 'current' | 'remembered';
export type CoordinateMm = { xMm: number; yMm: number; sourceZMetres?: number };
export type ProvenanceClass =
  | 'immutable_source_fact'
  | 'campaign_fixed'
  | 'versioned_game_design'
  | 'illustration_fixture'
  | 'unresolved_research';

export type SourceRef = {
  path: string;
  heading: string;
  recordId?: string;
};

export type WorldSite = {
  id: Id;
  name: string;
  position: CoordinateMm;
  form: string;
  accessStatement: string;
  fixedContent: string;
  source: SourceRef;
};

export type FieldChest = {
  id: Id;
  cacheId: Id;
  grade: 'Mộc' | 'Thanh Đồng' | 'Bạch Ngân' | 'Hoàng Kim' | 'Hạo Nguyệt';
  position: CoordinateMm;
  ring: string;
  accessStatement: string;
  lootCommitment: string;
  source: SourceRef;
};

export type ChestCacheCenter = {
  id: Id;
  ring: string;
  position: CoordinateMm;
  chestIds: readonly Id[];
  accessStatement: string;
  source: SourceRef;
};

export type WorldAnchor = {
  id: Id;
  name: string;
  position: CoordinateMm;
  terrainContext: string;
  source: SourceRef;
};

export type LairCohort = {
  groupId: Id;
  description: string;
  grade: string;
  count: number;
};

export type FixedWorldUnit = {
  id: Id;
  lairId: Id;
  heroId?: Id;
  groupId?: Id;
  cohortDescription: string;
  grade: string;
  creationRoute: 'PRESEEDED_WORLD_LAIR';
  ownership: 'fixed_world_population';
  playerKnowledge: 'unobserved';
};

export type FixedWorldActor = {
  id: Id;
  name: string;
  lifeStateAtT0: 'corpse' | 'alive' | 'stasis';
  formTier: number;
  grade: string;
  roleAndAgency: string;
  fixedSiteId: Id;
  fixedStatus: string;
  accessRoute: string;
  playerKnowledge: 'unobserved';
  source: SourceRef;
};

export type HeroLair = {
  id: Id;
  name: string;
  position: CoordinateMm;
  distanceKm: number;
  ring: string;
  species: string;
  societyCeiling: string;
  leaderHeroId: Id;
  leaderName: string;
  societyForm: string;
  societyStage: number;
  memberCount: number;
  sourcePopulationRef: string;
  sourcePopulationCount: number;
  inLairCount: number;
  outsidePopulationStatement: string;
  cohorts: readonly LairCohort[];
  initialMetrics: string;
  successionRule: string;
  source: SourceRef;
};

export type WorldResource = {
  id: Id;
  payload: string;
  materialId: Id;
  materialName: string;
  unit: string;
  capacity: number;
  location: CoordinateMm;
  siteId: Id | null;
  renewal: 'none' | 'biological_rate_unresolved' | 'daily_quota';
  dailyQuota: number | null;
  access: 'open_surface' | 'frozen_water' | 'survey_required' | 'workforce_and_fuel';
  requiredToolTemplateId: Id | null;
  source: SourceRef;
};

export type NavigationRoute = {
  id: Id;
  fromNodeId: Id;
  toNodeId: Id;
  sourceDistanceMm: number;
  surface: string;
  path: readonly CoordinateMm[];
  provenance: 'source_route_endpoints_plus_versioned_overlay_geometry';
};

export type NavigationOverlay = {
  id: 'LL01-NAVIGATION-OVERLAY-1.0';
  provenance: 'versioned_game_design';
  maxOffRouteLinkMm: number;
  walkSpeedMmPerHour: number;
  loadedSpeedPermille: number;
  interactionRangeMm: number;
  sightRangeMm: number;
  signalRangeMm: number;
  twilightSightPermille: number;
  nightSightPermille: number;
  routeEdges: readonly NavigationRoute[];
};

export type EcologyRecord = {
  id: Id;
  counts: Readonly<Record<string, number>>;
  notes: readonly string[];
  source: SourceRef;
};

export type FixedEventScheduleRow = {
  id: Id;
  opensAtMs: number;
  locksAtMs: number;
  resolvesAtMs: number;
  durationHours: number;
  settlementHours: number;
  basis: string;
  statusAtT0: 'scheduled';
  source: SourceRef;
};

export type ScheduledEventState = Omit<FixedEventScheduleRow, 'statusAtT0'> & {
  status: 'scheduled' | 'active' | 'locked' | 'resolved' | 'cancelled';
  openReceiptSequence: number | null;
  resolutionReceiptSequence: number | null;
};

export type SkillInstanceState = { id: Id; templateId: Id; mastery: number; active: boolean; sourceRuleVersion: string };
export type EquipmentSlotState = { slotId: Id; allowedTags: readonly string[]; occupiedItemId: Id | null };
export type DirectReviveProvenance = {
  creationRoute: 'DIRECT_TU_PHUC'; reviverCharacterId: Id; talentInstanceId: Id; rootOwnerId: Id;
  mirrorStartAtElapsedMs: number; originatingCorpseId: Id; originatingActorId: Id; secondDeathLocked: boolean;
};
export type CorpseBodyRecord = {
  sourceProfileState: 'complete' | 'incomplete'; sourceProfileBlockers: readonly string[];
  authoring: 'canonical_source' | 'user_authorized_stage07_overlay';
  name?: string;
  speciesId: Id | null; anatomyTemplateId: Id | null; formTier: number | null; level: number | null; xp: number | null;
  grade: string | null; faction: string | null; hero: boolean | null; rawAttributes: Readonly<Record<string, number>> | null;
  health: { current: number; max: number } | null; integrity: number | null;
  skills: readonly SkillInstanceState[]; talents: readonly Id[]; equipmentInstanceIds: readonly Id[];
  heldEquipment?: readonly { itemId: Id; templateId: Id; tags: readonly string[]; quality: number; condition: number; unit: string; combatEffects?: Readonly<Record<string, number>> }[];
  growthLedger: Readonly<Record<string, number>> | null; primaryFaction: string | null;
  holyState: 'holy' | 'non_holy' | 'unknown'; sealTags: readonly string[];
  directHolyLock: boolean; holyFieldExcess: boolean; memoryFragments: readonly Id[];
  sourceRef: SourceRef | null; sourceProfileId: Id | null;
  deathHistory: readonly { eventId: Id; atElapsedMs: number; cause: string }[];
  equipmentSlots: readonly EquipmentSlotState[];
};

export type XpTransactionState = {
  id: Id; transactionKind: 'NORMAL_AWARD' | 'OWNER_XP_MIRROR'; sourceEventId: Id;
  sourceTransactionId: Id | null; sourceRecipientId: Id | null; recipientId: Id;
  sourceCategory: 'combat' | 'labor' | 'quest' | 'other'; templateId: Id;
  grossXp: number; netXp: number; contributionShare: number;
  modifiers: { gap: number; novelty: number; risk: number; antiFarm: number };
  occurredAtElapsedMs: number; ruleVersion: string; levelBefore: number; xpBefore: number;
  thresholdsCrossed: readonly number[]; levelAfter: number; xpAfter: number;
  growthDelta: Readonly<Record<string, number>>;
};

export type InventoryContainerState = {
  id: Id;
  kind: 'territory_supply' | 'carried_bag' | 'backpack' | 'building_storage' | 'unit_inventory';
  capacitySlots: number | null;
  occupiedSlots: number | null;
  location: { kind: 'site'; siteId: Id } | { kind: 'carried'; ownerId: Id } | { kind: 'building'; buildingId: Id } | { kind: 'unit'; unitId: Id };
  observed: boolean;
  stacks: readonly { itemId: Id; templateId: Id; quantity: number; reservedQuantity?: number; unit?: string; ownerId?: Id; equipped: boolean; equippedSlotId?: Id | null; quality?: number | null; condition?: number; foodUnitsPerItem?: number; equipmentTags?: readonly string[]; combatEffects?: Readonly<Record<string, number>>; provenance: ProvenanceClass }[];
};

export type PlayerUnitState = {
  id: Id;
  templateId: Id;
  name: string;
  creationRoute: string;
  level: number;
  xp: number;
  ownerId: Id;
  position: CoordinateMm | null;
  location: { kind: 'site'; siteId: Id } | { kind: 'travel'; orderId: Id } | { kind: 'field'; coordinate: CoordinateMm } | { kind: 'building'; buildingId: Id };
  equipmentIds: readonly Id[];
  sourceStats: { formTier: number; grade: string; level: number; xp: number; faction: string; hero: boolean; loyalty: string };
  attributes?: Readonly<Record<string, number>>;
  talents?: readonly Id[];
  memoryFragments?: readonly Id[];
  integrity?: number;
  anatomyTemplateId: Id;
  equipmentRequirements: { status: 'source_profile_not_compiled' | 'compiled'; requiredSlotIds: readonly Id[] };
  equipmentSlots?: readonly EquipmentSlotState[];
  skills?: readonly SkillInstanceState[];
  health?: { current: number; max: number };
  directReviveProvenance?: DirectReviveProvenance;
  growthLedger?: Readonly<Record<string, number>>;
  xpMirrorEligible: boolean;
  baseLaborRateWuPerHour: number;
  laborRuleVersion: 'TOMB-ZOMBIE-LABOR-1.0' | string;
  constructionModifiers?: { health?: number; stamina?: number; skill?: number; tool?: number; weather?: number; shelter?: number; command?: number };
};

export type RuntimeJobState = {
  id: Id;
  kind: string;
  status: 'queued' | 'active' | 'blocked' | 'completed' | 'cancelled';
  actorIds: readonly Id[];
  reservedItemIds: readonly Id[];
  startedAtElapsedMs: number | null;
  completedAtElapsedMs: number | null;
};

export type BuildingState = {
  id: Id;
  kind: 'lord_house' | 'survival_fire' | 'tomb' | string;
  name: string;
  level: number;
  status: 'damaged' | 'active' | 'under_construction' | 'disabled' | 'destroyed';
  repairRequirements: readonly { itemId: Id; quantity: number }[];
  siteId?: Id;
  position?: CoordinateMm;
  blueprintId?: Id;
  footprintAreaM2?: number | null;
  constructionRuleVersion?: string;
};

export type ConstructionJobState = {
  id: Id;
  kind: 'repair' | 'build';
  status: 'active' | 'paused' | 'blocked' | 'completed' | 'cancelled';
  buildingId: Id;
  blueprintId: Id | null;
  siteId: Id;
  position: CoordinateMm;
  workUnitsRequired: number;
  progressTicks: number;
  progressRemainder: number;
  workerIds: readonly Id[];
  costReservations: readonly { containerId: Id; itemId: Id; templateId: Id; quantity: number }[];
  toolReservations: readonly { workerId: Id; containerId: Id; itemId: Id; templateId: Id; quantity: number }[];
  cancellationPolicy: string;
  blocker: string | null;
  startedAtElapsedMs: number;
  completedAtElapsedMs: number | null;
};
export type ConstructionResidentState = { id: Id; name: string; buildingId: Id; createdAtElapsedMs: number; foodUnitsPaid: number; upkeepStatus: 'not_compiled'; provenance: 'campaign_fixed' };
export type ConstructionRewardEntitlement = { id: Id; achievementId: Id; status: 'pending' | 'blocked' | 'claimed'; reward: readonly { templateId: Id; quantity: number }[]; rewardContract?: string; blocker: string | null; createdAtElapsedMs: number; receiptId: Id | null };
export type OperatingServiceState = { id: Id; kind: 'heater'; buildingId: Id; status: 'active' | 'completed'; startedAtElapsedMs: number; completesAtElapsedMs: number; fuelReservations: readonly { containerId: Id; itemId: Id; templateId: Id; quantity: number }[]; heatDeltaCelsius: { min: number; max: number }; roomAreaCapM2: number };
export type ConstructionBlueprintView = {
  id: Id;
  name: string;
  family: string;
  level: 1;
  provenance: ProvenanceClass;
  sourceRegistry: string;
  footprint: { areaM2: number | null; lengthM: number | null; geometryPolicy: string };
  buildCost: readonly { materialId: string; quantity: number; unit: 'item' | 'segment' }[];
  workUnits: number;
  maxWorkers: number;
  tools: { status: 'not_specified_by_source'; requiredTemplateIds: readonly string[] };
  outputs: readonly string[];
  operatingNeeds: readonly string[];
  prerequisite: string;
  upgrade: null | { toLevel: 2; cost: readonly { materialId: string; quantity: number; unit: 'item' | 'segment' }[]; workUnits: number; maxWorkers: number; prerequisite: string | null };
  buildableFromThisEvidence: true;
};
export type ConstructionState = {
  registryVersion: string;
  placementOverlayVersion: string;
  laborOverlayVersion: string;
  unlockedBlueprintIds: readonly Id[];
  jobs: readonly ConstructionJobState[];
  residents: readonly ConstructionResidentState[];
  firstBuildReceiptIds: readonly Id[];
  rewardEntitlements: readonly ConstructionRewardEntitlement[];
  operatingServices?: readonly OperatingServiceState[];
};

export type FieldChestLifecycleState = { chestId: Id; state: 'unopened' | 'opened' | 'destroyed'; openedAtElapsedMs: number | null };
export type FieldChestRuntimeState = FieldChestLifecycleState & {
  discovery: 'hidden' | 'signal' | 'identified';
  discoveredAtElapsedMs: number | null;
  signalId: Id | null;
  custody: 'world' | 'carried' | 'stored' | 'opened' | 'destroyed';
  claimedById: Id | null;
  carrierId: Id | null;
};

export type MovementPathSegment = {
  id: Id;
  from: CoordinateMm;
  to: CoordinateMm;
  distanceMm: number;
  durationMs: number;
  progressMs: number;
  surface: string;
  uncertainty: 'known' | 'uncertain';
  sourceRouteId: Id | null;
};

export type MovementOrderState = {
  id: Id;
  actorIds: readonly Id[];
  originSnapshot: CoordinateMm;
  destinationIntent: { kind: 'coordinate' | 'entity'; coordinate: CoordinateMm; entityId: Id | null };
  pathSegments: readonly MovementPathSegment[];
  totalDistanceMm: number;
  elapsedTravelMs: number;
  speedMmPerHour: number;
  costContractVersion: 'LL01-NAVIGATION-OVERLAY-1.0';
  status: 'active' | 'completed' | 'cancelled' | 'blocked';
  startedAtElapsedMs: number;
  completedAtElapsedMs: number | null;
  cancelledAtElapsedMs: number | null;
  interruptionCode: string | null;
};

export type SearchJobState = {
  id: Id;
  observerLineageId: Id;
  actorIds: readonly Id[];
  center: CoordinateMm;
  envelopeRadiusMm: number;
  laneWidthMm: number;
  path: readonly CoordinateMm[];
  pathProgressMm: number;
  tickStartProgressMm: number;
  tickStartAtElapsedMs: number;
  lastSettledAtElapsedMs: number;
  startedAtElapsedMs: number;
  nextTickAtElapsedMs: number;
  tickMinutes: 15;
  status: 'active' | 'paused' | 'blocked' | 'completed' | 'cancelled';
  haulAssignmentId: Id | null;
  grossAreaM2: number;
  uniqueAreaM2: number;
  repeatedAreaM2: number;
  interruptionCode: string | null;
};

export type HarvestJobState = {
  id: Id;
  actorIds: readonly Id[];
  resourceId: Id;
  materialId: Id;
  requestedQuantity: number;
  extractedQuantity: number;
  reservedQuantity: number;
  toolItemId: Id;
  originSnapshot: CoordinateMm;
  workPosition: CoordinateMm;
  routeOut: readonly CoordinateMm[];
  routeReturn: readonly CoordinateMm[];
  routeOutDistanceMm: number;
  routeReturnDistanceMm: number;
  speedMmPerHour: number;
  stage: 'outbound' | 'working' | 'returning' | 'blocked';
  routeProgressMm: number;
  workProgressMs: number;
  nextTickAtElapsedMs: number;
  lastSettledAtElapsedMs: number;
  startedAtElapsedMs: number;
  status: 'active' | 'paused' | 'blocked' | 'completed' | 'cancelled';
  interruptionCode: string | null;
  completedAtElapsedMs: number | null;
};

export type ResourceBalanceState = {
  resourceId: Id;
  remaining: number;
  reserved: number;
  materialId: Id;
  unit: string;
  lastSettledAtElapsedMs: number;
  lastRenewedAtElapsedMs: number | null;
  dailyRemaining: number | null;
  dailyResetAtElapsedMs: number | null;
  amountKnowledge: 'unknown' | 'estimate' | 'known_exact' | 'stale';
};

export type SpatialSignalState = {
  signalId: Id;
  targetType: 'site' | 'resource' | 'cache';
  targetId: Id;
  exactPosition: CoordinateMm;
  approximatePosition: CoordinateMm;
  accuracyMm: number;
  discovery: 'signal' | 'identified';
  discoveredAtElapsedMs: number;
};

export type SpatialSweepHistory = {
  observerLineageId: Id;
  cellIds: readonly Id[];
  focusedMinutesByChest: Readonly<Record<Id, number>>;
  lastSettledAtElapsedMs: number;
};
export type CorpseState = {
  id: Id;
  actorId: Id;
  location: { kind: 'site'; siteId: Id } | { kind: 'carried'; carrierId: Id } | { kind: 'buried'; siteId: Id };
  state: 'unobserved' | 'known' | 'preserved' | 'damaged' | 'revived' | 'buried' | 'destroyed' | 'butchered' | 'second_death_locked';
  sourceStatus: string;
  createdAtElapsedMs: number;
  ownershipId: Id | null;
  disposition?: 'unclaimed' | 'carried' | 'butchered' | 'destroyed' | 'revived' | 'second_death_locked';
  accessState?: 'unobserved' | 'inaccessible' | 'accessible' | 'carried';
  integrity?: number | null;
  deathAtElapsedMs?: number | null;
  deathHistory?: readonly { eventId: Id; actorId: Id; atElapsedMs: number; cause: string }[];
  sealTags?: readonly string[];
  directHolyLock?: boolean;
  holyFieldExcess?: boolean;
  secondDeathLock?: boolean;
  bodyRecord?: CorpseBodyRecord | null;
};

export type QuestProgressState = {
  questId: Id;
  state: 'dormant' | 'open' | 'accepted' | 'completed' | 'failed' | 'expired';
  acceptedAt: number | null;
  completedAt: number | null;
  rewardReceipt: Id | null;
};

export type ShopOfferState = { id: Id; status: 'scheduled' | 'active' | 'expired' | 'closed'; availableAtElapsedMs: number; expiresAtElapsedMs: number | null };
export type CurrencyBalance = { currencyId: Id; amount: number };
export type TombQueueEntry = {
  id: Id;
  recipeId: Id;
  blueprintId: Id;
  status: 'queued' | 'active' | 'blocked' | 'completed' | 'cancelled';
  reservedDeathQi: number;
  enqueuedAtElapsedMs: number;
  slotId: number | null;
  startedAtElapsedMs: number | null;
  completesAtElapsedMs: number | null;
  progressCarryMs: number;
  outputUnitId: Id;
};

export type ClockSpeedSelection = 'paused' | '1x' | '2x' | '5x' | 'custom';
export type ClockStopCondition = 'none' | 'next_completion' | 'danger';
export type ClockControl = { status: 'paused' | 'running'; selection: ClockSpeedSelection; speedPermille: number; stopCondition: ClockStopCondition };
export type ColdEnvironment = {
  apparentTemperatureC: number;
  windKph: number;
  wetness: number;
  activityFactor: 0.7 | 1 | 1.3;
  insulation: number;
  shelter: number;
};
export type ColdStatus = 'weather_unresolved' | 'clear' | 'warning' | 'danger';
export type TimeBoundaryState = {
  nextHourlySettlementAtElapsedMs: number;
  nextMidnightAtElapsedMs: number;
  nextDailySettlementAtElapsedMs: number;
  nextSunsetAtElapsedMs: number;
  nextTwilightEndAtElapsedMs: number;
  nextDawnAtElapsedMs: number;
  protectionExpiryAtElapsedMs: number | null;
};

export type WorldDefinition = {
  id: 'WORLD-PACKAGE-LL01-1.0';
  contentVersion: string;
  coordinateSystem: 'LL01-LOCAL-KM';
  coordinateEncoding: 'integer millimetres from H0; source z retained in metres';
  activeMapRadiusKm: 96;
  origin: CoordinateMm;
  openingSiteIds: readonly [string, string, string, string];
  sites: readonly WorldSite[];
  chestCacheCenters: readonly ChestCacheCenter[];
  anchors: readonly WorldAnchor[];
  fieldChests: readonly FieldChest[];
  lairs: readonly HeroLair[];
  lairUnits: readonly FixedWorldUnit[];
  fixedActors: readonly FixedWorldActor[];
  resources: readonly WorldResource[];
  ecology: readonly EcologyRecord[];
  routes: readonly { id: Id; description: string; source: SourceRef }[];
  navigationOverlay: NavigationOverlay;
  dormantQuestIds: readonly Id[];
  eventSchedule: readonly FixedEventScheduleRow[];
  lockedSourceHashes: Readonly<Record<string, string>>;
  contentSha256: string;
};

export type ActionAvailability = {
  actionId: string;
  enabled: boolean;
  reasonCode: string | null;
  requirements: readonly string[];
  preview?: { label: string; value: string };
};

export type PlayerEntityView = {
  ref: EntityRef;
  label: string;
  category: string;
  knowledge: Exclude<KnowledgeStatus, 'unknown'>;
  observedAtElapsedMs: number;
  position?: CoordinateMm;
  actions: readonly ActionAvailability[];
};

export type VisibleMap = {
  coordinateSystem: WorldDefinition['coordinateSystem'];
  coordinateEncoding: WorldDefinition['coordinateEncoding'];
  currentSight: readonly { center: CoordinateMm; radiusMm: number; source: 'player' | 'unit' | 'survival_fire' }[];
  visibleGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[] }[];
  exploredGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[]; radiusMm?: number }[];
  terrain: readonly { id: Id; label: string; position: CoordinateMm }[];
  entities: readonly PlayerEntityView[];
  knownRoutes: readonly { id: Id; label: string; path: readonly CoordinateMm[] }[];
  activeOrders: readonly { id: Id; kind: string; status: string; actorIds: readonly Id[]; position: CoordinateMm; path: readonly CoordinateMm[]; totalDistanceMm: number; etaElapsedMs: number; uncertainty: 'known' | 'uncertain' }[];
  heatOverlays: readonly { center: CoordinateMm; radiusMm: number; minCelsius: number; maxCelsius: number }[];
  combatTargets?: readonly { targetId: Id; label: string; position: CoordinateMm; status: 'available' | 'reacting' }[];
};

export type Stage07CombatView = {
  target: { id: Id; label: string; state: 'available' | 'reacting' | 'retreated' | 'dead'; regionId: Id; regionalPopulationRemaining: number; position: CoordinateMm; attack: ActionAvailability } | null;
  encounter: null | {
    id: Id; status: 'active' | 'victory' | 'defeat' | 'retreated'; actorIds: readonly Id[]; round: number;
    nextTurnAtElapsedMs: number | null; targetHealth: { current: number; max: number };
    log: readonly CombatLogEntry[];
  };
};

export type PlayerView = {
  schemaVersion: typeof CONTRACT_SCHEMA_VERSION;
  saveId: Id;
  revision: number;
  lastEventSequence: number;
  simElapsedMs: number;
  clockControl: ClockControl;
  clockStatus: { driver: 'active' | 'observing' | 'unclaimed'; catchingUp: boolean; targetSimElapsedMs: number; leaseRemainingMs: number };
  worldClock: { day: number; hour: number; minute: number; lightPhase: 'daylight' | 'twilight' | 'night' };
  survival: { coldLoad: number | null; coldStatus: ColdStatus; blocker: string | null; hungerState: 'FED' | 'unknown' };
  player: {
    id: Id;
    name: string;
    level: number;
    xp: number;
    formTier: number;
    talent: { name: string; grade: 'SSS' };
    attributes: Readonly<Record<string, number>>;
    mana: { current: number; max: number };
    careerState: 'unemployed' | 'active';
    skills?: readonly SkillInstanceState[];
    pendingGrowth?: number;
    position: CoordinateMm;
  };
  combat?: Stage07CombatView;
  careerCard: {
    observed: boolean;
    active: boolean;
    openingSkillLearned: boolean;
    career: null | { id: Id; name: string; openingSkillId: Id; growthAllocation: 'SPI/PRE' };
  };
  territory: {
    id: Id;
    stage: 'H0';
    position: CoordinateMm;
    survivalFire: {
      ref: EntityRef;
      level: number;
      active: boolean;
      heatRadiusMetres: number;
      fuelRemaining: number | null;
      fuelKnowledge: 'state_unobserved' | 'known';
      nextFuelConsumptionAtElapsedMs: number | null;
      fuelBlocker: string | null;
      protection: 'pending-opening-settlement' | 'active' | 'expired';
    };
    tomb: {
      level: number;
      deathQi: { current: number; capacity: number; nextRefillAtElapsedMs: number };
      productionSlots: number;
      activeCount: number;
      queuedCount: number;
      nextCompletionAtElapsedMs: number | null;
      queue: readonly TombQueueEntry[];
      output: GameState['territory']['tomb']['output'];
    };
    buildings: readonly { id: Id; name: string; status: string; kind: string; level: number; siteId?: Id; position?: CoordinateMm; footprintAreaM2?: number | null }[];
  };
  construction: {
    unlockedBlueprintIds: readonly Id[];
    blueprints: readonly ConstructionBlueprintView[];
    jobs: readonly (ConstructionJobState & { workUnitsPerHour: number; estimatedCompletionAtElapsedMs: number | null })[];
    residents: readonly ConstructionResidentState[];
    rewardEntitlements: readonly ConstructionRewardEntitlement[];
    operatingServices: readonly (OperatingServiceState & { remainingMs: number })[];
    farmerHouseCapacity: number;
    occupiedHousing: number;
  };
  inventory: {
    inspectableContainers: readonly { containerId: Id; label: string; kind: 'territory_supply' | 'carried_bag' }[];
    containers: readonly { id: Id; kind: InventoryContainerState['kind']; label: string; slots: number; occupiedSlots: number; capacitySlots: number | null; accessible: boolean; location: InventoryContainerState['location']; items: readonly { itemId: Id; label: string; quantity: number; reservedQuantity: number; unit: string | null; quality: number | null; ownerId: Id | null; equipped: boolean; equippedSlotId: Id | null; foodUnitsPerItem: number | null; equipmentTags?: readonly string[]; combatEffects?: Readonly<Record<string, number>>; condition?: number | null; provenance: ProvenanceClass }[] }[];
  };
  units: readonly PlayerUnitState[];
  corpses?: readonly {
    id: Id; actorId: Id; label: string; position: CoordinateMm | null;
    state: CorpseState['state']; integrity: number | null; tier: number | null; level: number | null;
    grade: string | null; hero: boolean | null; accessible: boolean; inspected: boolean;
    revive: ActionAvailability;
    butcher: ActionAvailability;
  }[];
  jobs: readonly (RuntimeJobState & { progressPercent: number | null })[];
  visibleMap: VisibleMap;
  spatial: {
    navigationRuleVersion: 'LL01-NAVIGATION-OVERLAY-1.0';
    movementOrders: readonly MovementOrderState[];
    searchJobs: readonly SearchJobState[];
    harvestJobs: readonly HarvestJobState[];
    resources: readonly {
      resourceId: Id;
      materialId: Id;
      materialName: string;
      unit: string;
      remaining: number | null;
      reserved: number | null;
      amountKnowledge: ResourceBalanceState['amountKnowledge'];
      status: 'available' | 'depleted' | 'blocked';
    }[];
  };
  journal: readonly { sequence: number; category: string; title: string; text: string }[];
};

export type CombatLogEntry = {
  atElapsedMs: number;
  actorId: Id;
  targetActorId: Id;
  outcome: 'hit' | 'miss' | 'retreat' | 'defeat' | 'victory';
  damage: number;
  damageTaken: number;
  actorHealth: number;
  targetHealth: number;
};

export type Stage07PreyState = {
  actorId: Id;
  speciesId: Id;
  name: string;
  sourceEcologyId: Id;
  populationKey: string;
  sourcePopulationAtStart: number;
  siteId: Id;
  position: CoordinateMm;
  status: 'available' | 'reacting' | 'retreated' | 'dead';
  bodyRecord: CorpseBodyRecord;
  combatProfile: { weaponDamage: number; weaponRangeMm: number; armor: number; concealment: number; terrainId: Id };
};

export type CombatEncounterState = {
  id: Id;
  sequence: number;
  targetActorId: Id;
  actorIds: readonly Id[];
  status: 'active' | 'victory' | 'defeat' | 'retreated';
  startedAtElapsedMs: number;
  completedAtElapsedMs: number | null;
  nextTurnAtElapsedMs: number | null;
  pendingIntent: 'attack' | 'retreat';
  round: number;
  targetHealth: { current: number; max: number };
  log: readonly CombatLogEntry[];
};

export type Stage07CombatState = {
  nextEncounterSequence: number;
  target: Stage07PreyState;
  encounters: readonly CombatEncounterState[];
};

export type GameState = {
  schemaVersion: typeof GAME_STATE_SCHEMA_VERSION;
  saveId: Id;
  campaignId: Id;
  worldPackageId: WorldDefinition['id'];
  contentVersion: string;
  contentSourceSetSha256: string;
  rulesetVersion: string;
  seed: string;
  revision: number;
  lastEventSequence: number;
  simElapsedMs: number;
  clockControl: ClockControl;
  timeBoundaries: TimeBoundaryState;
  survival: {
    coldLoadMicro: number;
    coldLoadRemainder: number;
    coldStatus: ColdStatus;
    environment: ColdEnvironment | null;
    blocker: string | null;
    hungerState: 'FED' | 'unknown';
  };
  player: {
    id: 'LI_LAN';
    name: 'Lí Lan';
    age: 24;
    sex: 'FEMALE';
    nationality: 'TRUNG_HOA';
    level: number;
    xp: number;
    formTier: number;
    attributes: Readonly<Record<string, number>>;
    talent: { id: 'LL-TAL-SSS-DEATH-REVIVER'; name: 'Tử Phục Linh Sư'; grade: 'SSS' };
    mana: { current: number; max: number; baseRegenPerSecond: number; lastSettledAtElapsedMs: number };
    career: {
      state: 'unemployed_card_sealed' | 'active';
      sealedPayload: { careerId: 'JOB-SUM-NECRO-01'; openingSkillId: 'SK-OPEN-NECRO-01'; growthAllocation: 'SPI/PRE' };
      skills?: readonly SkillInstanceState[];
      pendingGrowth?: number;
      allocatedGrowth?: Readonly<Record<string, number>>;
    };
    position: CoordinateMm;
    location: { kind: 'site'; siteId: Id } | { kind: 'travel'; orderId: Id } | { kind: 'field'; coordinate: CoordinateMm };
    constructionModifiers?: { health?: number; stamina?: number; skill?: number; tool?: number; weather?: number; shelter?: number; command?: number };
    relationships: readonly { id: Id; actorId: Id; kind: string; status: string }[];
  };
  territory: {
    id: 'H0';
    stage: string;
    position: CoordinateMm;
    survivalFire: {
      level: number;
      active: boolean;
      heatRadiusMetres: number;
      heatDeltaCelsius: { min: 5; max: 20 };
      fuelRemaining: number | null;
      fuelKnowledge: 'state_unobserved' | 'known';
      nextFuelConsumptionAtElapsedMs: number | null;
      fuelBlocker: string | null;
      protectedThroughElapsedMs: number;
      protectionEventId: Id;
      protectionStatus: 'pending_opening_settlement' | 'active' | 'expired';
    };
    lordHouseId: Id;
    supplyContainerId: Id;
    tombId: Id;
    tomb: {
      deathQi: { current: number; capacity: number; refillAtWorldTime: string; nextRefillAtElapsedMs: number };
      queue: readonly TombQueueEntry[];
      output: { formTier: number; grade: string; level: number; xp: number; faction: string; hero: boolean; loyalty: string; xpMirrorEligible: boolean; baseLaborRateWuPerHour: number };
    };
    repaired: boolean;
  };
  inventory: { containers: readonly InventoryContainerState[] };
  ownedUnits: readonly PlayerUnitState[];
  buildings: readonly BuildingState[];
  construction: ConstructionState;
  jobs: readonly RuntimeJobState[];
  travel: { activeOrderId: Id | null; routeId: Id | null; orders: readonly MovementOrderState[] };
  exploration: { exploredGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[]; radiusMm?: number }[]; searchHistory: readonly { searchId: Id; startedAtElapsedMs: number; status: string }[] };
  spatial: {
    movementOrders: readonly MovementOrderState[];
    searchJobs: readonly SearchJobState[];
    harvestJobs: readonly HarvestJobState[];
    resourceBalances: readonly ResourceBalanceState[];
    signals: readonly SpatialSignalState[];
    sweepHistory: readonly SpatialSweepHistory[];
  };
  playerKnowledge: {
    knownSiteIds: readonly Id[];
    knownChestIds: readonly Id[];
    knownLairIds: readonly Id[];
    knownResourceIds: readonly Id[];
    knownRouteIds: readonly Id[];
    knownSignalIds: readonly Id[];
    knownCorpseIds?: readonly Id[];
    careerCardObserved: boolean;
    lastSeenByEntity: Readonly<Record<string, { observedAtElapsedMs: number; knowledge: KnowledgeStatus }>>;
    lastInspectedEntityIds: readonly Id[];
  };
  fieldChestStates: readonly FieldChestRuntimeState[];
  corpses: readonly CorpseState[];
  combat?: Stage07CombatState;
  progression?: { transactions: readonly XpTransactionState[]; mirrorReceiptKeys: readonly string[] };
  quests: readonly QuestProgressState[];
  calendar: readonly ScheduledEventState[];
  offers: readonly ShopOfferState[];
  currency: readonly CurrencyBalance[];
  receipts: readonly StoredCommandReceipt[];
  rngStreams: Readonly<Record<string, { algorithm: 'HASH-PRIMITIVE-1.0'; counter: number }>>;
  bagSeed: {
    inspected: boolean;
    commitmentSha256: string;
    totalHashDraws: number;
    rolls: Readonly<Record<'main' | 'snack' | 'drink', number>>;
    sealedItems: readonly { itemId: Id; templateId: Id; quantity: number; units: number; sourceRoll: number | null }[];
  };
  cleanStartDiagnostics: { contaminationCount: number; legacyFlags: readonly string[]; historicalProgress: boolean };
};

export type CommandType =
  | 'inspect_entity'
  | 'inspect_starter_container'
  | 'inspect_career_card'
  | 'activate_career_card'
  | 'set_clock_speed'
  | 'advance_to_boundary'
  | 'enqueue_tomb'
  | 'cancel_tomb'
  | 'refuel_fire'
  | 'extinguish_fire'
  | 'light_fire'
  | 'move'
  | 'cancel_travel'
  | 'survey'
  | 'search'
  | 'harvest'
  | 'cancel_spatial_job'
  | 'transfer_item'
  | 'open_cache'
  | 'repair'
  | 'build'
  | 'craft'
  | 'revive'
  | 'butcher_corpse'
  | 'equip'
  | 'attack'
  | 'retreat'
  | 'shop_transaction'
  | 'assign_construction_workers'
  | 'cancel_construction_job'
  | 'recruit_resident'
  | 'operate_heater'
  | 'split_stack'
  | 'merge_stacks'
  | 'consume_item'
  | 'unequip_item';

export type CommandPayloadByType = {
  inspect_entity: { entity: EntityRef };
  inspect_starter_container: { containerId: Id };
  inspect_career_card: Record<never, never>;
  activate_career_card: { cardId: Id };
  set_clock_speed: { speed: ClockSpeedSelection; customMultiplier?: number; stopCondition?: ClockStopCondition };
  advance_to_boundary: { boundaryId: Id };
  enqueue_tomb: { blueprintId: Id };
  cancel_tomb: { jobId: Id };
  refuel_fire: { containerId: Id; itemId: Id; quantity: number };
  extinguish_fire: Record<never, never>;
  light_fire: Record<never, never>;
  move: { actorId: Id; destinationId?: Id; destination?: CoordinateMm };
  cancel_travel: { orderId: Id };
  survey: { actorId: Id; targetId: Id };
  search: { actorId: Id; center: CoordinateMm; radiusMm: number };
  harvest: { actorId: Id; resourceId: Id; materialId: Id; quantity: number; toolItemId: Id };
  cancel_spatial_job: { jobId: Id };
  transfer_item: { actorId: Id; sourceContainerId: Id; destinationContainerId: Id; itemId: Id; quantity: number };
  open_cache: { actorId: Id; chestId: Id };
  repair: { actorId: Id; buildingId: Id; containerId: Id };
  build: { actorId: Id; blueprintId: Id; siteId: Id; containerId: Id; position: CoordinateMm };
  assign_construction_workers: { jobId: Id; workerIds: readonly Id[] };
  cancel_construction_job: { jobId: Id };
  recruit_resident: { buildingId: Id; containerId: Id; quantity: number };
  operate_heater: { actorId: Id; buildingId: Id; containerId: Id };
  split_stack: { actorId: Id; containerId: Id; itemId: Id; quantity: number };
  merge_stacks: { actorId: Id; containerId: Id; sourceItemId: Id; targetItemId: Id };
  consume_item: { actorId: Id; containerId: Id; itemId: Id; quantity: number };
  unequip_item: { unitId: Id; itemId: Id };
  craft: { actorId: Id; recipeId: Id };
  revive: { actorId: Id; corpseId: Id };
  butcher_corpse: { actorId: Id; corpseId: Id };
  equip: { unitId: Id; itemId: Id; slotId: Id };
  attack: { actorIds: readonly Id[]; targetId: Id };
  retreat: { actorIds: readonly Id[]; encounterId: Id };
  shop_transaction: { offerId: Id; quantity: number };
};

export type CommandEnvelopeFor<T extends CommandType> = {
  schemaVersion: typeof CONTRACT_SCHEMA_VERSION;
  saveId: Id;
  commandId: Id;
  expectedRevision: number;
  type: T;
  payload: CommandPayloadByType[T];
};

export type CommandEnvelope = { [T in CommandType]: CommandEnvelopeFor<T> }[CommandType];

export type CommandEvent = {
  sequence: number;
  type: string;
  occurredAtElapsedMs: number;
  payload: Readonly<Record<string, unknown>>;
};

export type CommandReceipt = {
  commandId: Id;
  accepted: boolean;
  revision: number;
  eventSequence: number | null;
  code: string;
  message: string;
};

export type StoredCommandReceipt = {
  commandId: Id;
  requestSha256: string;
  receipt: CommandReceipt;
};

export type CommandReduction = { state: GameState; events: readonly CommandEvent[]; receipt: CommandReceipt };

export type CommandValidationIssue = { code: string; path: string; message: string };
export type CommandValidationResult =
  | { success: true; data: CommandEnvelope }
  | { success: false; issue: CommandValidationIssue };

export interface GameClient {
  getView(): Promise<PlayerView>;
  subscribe(listener: (view: PlayerView) => void): () => void;
  inspect(entity: EntityRef): Promise<PlayerEntityView | null>;
  previewCommand(command: CommandEnvelope): Promise<{ availability: ActionAvailability }>;
  submitCommand(command: CommandEnvelope): Promise<CommandReceipt>;
  createSave(input: { saveId: Id; worldPackageId: string; seed: string }): Promise<PlayerView>;
  loadSave(saveId: Id): Promise<PlayerView>;
  listSaves(): Promise<readonly { saveId: Id; revision: number }[]>;
}

const commandTypes = new Set<CommandType>([
  'inspect_entity', 'inspect_starter_container', 'inspect_career_card', 'activate_career_card', 'set_clock_speed',
  'advance_to_boundary', 'enqueue_tomb', 'cancel_tomb', 'refuel_fire', 'extinguish_fire', 'light_fire', 'move', 'cancel_travel', 'survey', 'search', 'harvest', 'cancel_spatial_job', 'transfer_item',
  'open_cache', 'repair', 'build', 'craft', 'revive', 'butcher_corpse', 'equip', 'attack', 'retreat', 'shop_transaction', 'assign_construction_workers', 'cancel_construction_job', 'recruit_resident', 'operate_heater', 'split_stack', 'merge_stacks', 'consume_item', 'unequip_item',
]);

const payloadFields: Readonly<Record<CommandType, readonly string[]>> = {
  inspect_entity: ['entity'],
  inspect_starter_container: ['containerId'],
  inspect_career_card: [],
  activate_career_card: ['cardId'],
  set_clock_speed: ['speed'],
  advance_to_boundary: ['boundaryId'],
  enqueue_tomb: ['blueprintId'],
  cancel_tomb: ['jobId'],
  refuel_fire: ['containerId', 'itemId', 'quantity'],
  extinguish_fire: [],
  light_fire: [],
  move: ['actorId'],
  cancel_travel: ['orderId'],
  survey: ['actorId', 'targetId'],
  search: ['actorId', 'center', 'radiusMm'],
  harvest: ['actorId', 'resourceId', 'materialId', 'quantity', 'toolItemId'],
  cancel_spatial_job: ['jobId'],
  transfer_item: ['actorId', 'sourceContainerId', 'destinationContainerId', 'itemId', 'quantity'],
  open_cache: ['actorId', 'chestId'],
  repair: ['actorId', 'buildingId', 'containerId'],
  build: ['actorId', 'blueprintId', 'siteId', 'containerId', 'position'],
  craft: ['actorId', 'recipeId'],
  revive: ['actorId', 'corpseId'],
  butcher_corpse: ['actorId', 'corpseId'],
  equip: ['unitId', 'itemId', 'slotId'],
  attack: ['actorIds', 'targetId'],
  retreat: ['actorIds', 'encounterId'],
  shop_transaction: ['offerId', 'quantity'],
  assign_construction_workers: ['jobId', 'workerIds'],
  cancel_construction_job: ['jobId'],
  recruit_resident: ['buildingId', 'containerId', 'quantity'],
  operate_heater: ['actorId', 'buildingId', 'containerId'],
  split_stack: ['actorId', 'containerId', 'itemId', 'quantity'],
  merge_stacks: ['actorId', 'containerId', 'sourceItemId', 'targetItemId'],
  consume_item: ['actorId', 'containerId', 'itemId', 'quantity'],
  unequip_item: ['unitId', 'itemId'],
};

const forbiddenClientFields = new Set([
  'state', 'resultingstate', 'inventory', 'rewards', 'cost', 'damage', 'xp',
  'elapseddelta', 'elapsedms', 'timeadvance', 'patchedstate', 'rngstate',
]);

function issue(code: string, path: string, message: string): CommandValidationResult {
  return { success: false, issue: { code, path, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validEntityRef(value: unknown): value is EntityRef {
  if (!isRecord(value) || typeof value.id !== 'string') return false;
  if (Object.keys(value).some(key => !['type', 'id'].includes(key))) return false;
  return ['site', 'resource', 'cache', 'item', 'unit', 'building', 'corpse', 'lair', 'route'].includes(String(value.type));
}

function validCoordinate(value: unknown): value is CoordinateMm {
  if (!isRecord(value) || Object.keys(value).some(key => !['xMm', 'yMm', 'sourceZMetres'].includes(key))) return false;
  return Number.isSafeInteger(value.xMm) && Number.isSafeInteger(value.yMm)
    && (value.sourceZMetres === undefined || (typeof value.sourceZMetres === 'number' && Number.isFinite(value.sourceZMetres) && Math.abs(value.sourceZMetres) <= 1_000));
}

export function validateCommandEnvelope(input: unknown): CommandValidationResult {
  if (!isRecord(input)) return issue('COMMAND_ENVELOPE_INVALID', '$', 'Expected a command envelope object.');
  const envelopeFields = ['schemaVersion', 'saveId', 'commandId', 'expectedRevision', 'type', 'payload'];
  for (const key of Object.keys(input)) {
    if (!envelopeFields.includes(key)) return issue('COMMAND_ENVELOPE_FIELD_UNKNOWN', `$.${key}`, 'Command envelopes contain only the registered fields.');
  }
  if (input.schemaVersion !== CONTRACT_SCHEMA_VERSION) return issue('COMMAND_SCHEMA_UNSUPPORTED', '$.schemaVersion', 'Unsupported command schema version.');
  for (const key of ['saveId', 'commandId'] as const) {
    if (typeof input[key] !== 'string' || input[key].trim() === '' || input[key].length > 160) return issue('COMMAND_ENVELOPE_INVALID', `$.${key}`, 'Expected a non-empty string no longer than 160 characters.');
  }
  if (!Number.isSafeInteger(input.expectedRevision) || Number(input.expectedRevision) < 0) {
    return issue('COMMAND_ENVELOPE_INVALID', '$.expectedRevision', 'Expected a non-negative safe integer.');
  }
  if (typeof input.type !== 'string' || !commandTypes.has(input.type as CommandType)) {
    return issue('COMMAND_TYPE_UNKNOWN', '$.type', 'Command type is not registered.');
  }
  if (!isRecord(input.payload)) return issue('COMMAND_PAYLOAD_INVALID', '$.payload', 'Expected a command payload object.');

  for (const key of Object.keys(input.payload)) {
    if (forbiddenClientFields.has(key.replace(/[^a-z]/gi, '').toLowerCase())) {
      return issue('CLIENT_AUTHORITATIVE_FIELD_FORBIDDEN', `$.payload.${key}`, 'This value is calculated and owned by the simulation.');
    }
  }

  const payload = input.payload;
  const commandType = input.type as CommandType;
  const required = payloadFields[commandType];
  for (const key of required) {
    if (!(key in payload)) return issue('COMMAND_PAYLOAD_INVALID', `$.payload.${key}`, 'Required command field is missing.');
  }
  const optional: Partial<Record<CommandType, readonly string[]>> = { move: ['destinationId', 'destination'] };
  const allowed = commandType === 'set_clock_speed' ? ['speed', 'customMultiplier', 'stopCondition'] : [...required, ...(optional[commandType] ?? [])];
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key)) return issue('COMMAND_PAYLOAD_FIELD_UNKNOWN', `$.payload.${key}`, 'Command payload contains an unregistered field.');
  }
  if (input.type === 'inspect_entity' && !validEntityRef(payload.entity)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.entity', 'Expected a registered entity reference.');
  }
  if (input.type === 'set_clock_speed') {
    if (!['paused', '1x', '2x', '5x', 'custom'].includes(String(payload.speed))) {
      return issue('COMMAND_PAYLOAD_INVALID', '$.payload.speed', 'Expected paused, 1x, 2x, 5x or custom.');
    }
    if (payload.speed === 'custom') {
      if (!('customMultiplier' in payload) || typeof payload.customMultiplier !== 'number'
        || !Number.isFinite(payload.customMultiplier) || payload.customMultiplier < 0.1 || payload.customMultiplier > 3600) {
        return issue('COMMAND_PAYLOAD_INVALID', '$.payload.customMultiplier', 'Custom speed must be finite and between 0.1 and 3600.');
      }
    } else if ('customMultiplier' in payload) {
      return issue('COMMAND_PAYLOAD_FIELD_UNKNOWN', '$.payload.customMultiplier', 'A custom multiplier is only valid with custom speed.');
    }
    if ('stopCondition' in payload && !['none', 'next_completion', 'danger'].includes(String(payload.stopCondition))) {
      return issue('COMMAND_PAYLOAD_INVALID', '$.payload.stopCondition', 'Expected none, next_completion or danger.');
    }
  }
  if (input.type === 'advance_to_boundary' && !['next_completion', 'danger'].includes(String(payload.boundaryId))) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.boundaryId', 'Expected next_completion or danger.');
  }
  if (input.type === 'build' && !validCoordinate(payload.position)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.position', 'A server-previewed construction position is required.');
  }
  if (input.type === 'assign_construction_workers' && (!Array.isArray(payload.workerIds) || payload.workerIds.some(id => typeof id !== 'string' || id.trim() === '') || new Set(payload.workerIds).size !== payload.workerIds.length)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.workerIds', 'Worker IDs must be a unique string list; an empty list pauses the job.');
  }
  if (input.type === 'recruit_resident' && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1 || Number(payload.quantity) > 4)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Recruitment quantity must be a whole number from 1 to 4.');
  }
  if (input.type === 'move') {
    const hasId = typeof payload.destinationId === 'string' && payload.destinationId.trim() !== '';
    const hasCoordinate = validCoordinate(payload.destination);
    if (hasId === hasCoordinate) return issue('COMMAND_PAYLOAD_INVALID', '$.payload', 'Provide exactly one destination ID or coordinate.');
    if (payload.destinationId !== undefined && !hasId) return issue('COMMAND_PAYLOAD_INVALID', '$.payload.destinationId', 'Expected a non-empty destination ID.');
  }
  if (input.type === 'search' && (!validCoordinate(payload.center) || !Number.isSafeInteger(payload.radiusMm)
    || Number(payload.radiusMm) < 1 || Number(payload.radiusMm) > 2_000_000)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload', 'Search center and radius must be valid map coordinates within the supported envelope.');
  }
  if (input.type === 'harvest' && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1 || Number(payload.quantity) > 10_000)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Expected a positive whole resource quantity within the command limit.');
  }
  if ((input.type === 'attack' || input.type === 'retreat') && (!Array.isArray(payload.actorIds) || payload.actorIds.length === 0 || payload.actorIds.some(id => typeof id !== 'string' || id.length === 0) || new Set(payload.actorIds).size !== payload.actorIds.length)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.actorIds', 'Expected one or more actor IDs.');
  }
  if (['shop_transaction', 'refuel_fire', 'transfer_item', 'recruit_resident', 'split_stack', 'consume_item'].includes(String(input.type)) && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Expected a positive integer quantity.');
  }
  for (const key of required.filter(field => !['entity', 'actorIds', 'workerIds', 'quantity', 'center', 'radiusMm', 'position'].includes(field))) {
    if (typeof payload[key] !== 'string' || String(payload[key]).trim() === '') {
      return issue('COMMAND_PAYLOAD_INVALID', `$.payload.${key}`, 'Expected a non-empty string.');
    }
  }
  if (input.type === 'build' && !validCoordinate(payload.position)) return issue('COMMAND_PAYLOAD_INVALID', '$.payload.position', 'Expected an integer map coordinate.');
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'number' && !Number.isFinite(value)) return issue('COMMAND_PAYLOAD_INVALID', `$.payload.${key}`, 'Numbers must be finite.');
  }

  return {
    success: true,
    data: {
      schemaVersion: CONTRACT_SCHEMA_VERSION,
      saveId: input.saveId as string,
      commandId: input.commandId as string,
      expectedRevision: Number(input.expectedRevision),
      type: input.type as CommandType,
      payload,
    } as CommandEnvelope,
  };
}
