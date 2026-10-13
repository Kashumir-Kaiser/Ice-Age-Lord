export const CONTRACT_SCHEMA_VERSION = 1 as const;
export const PLAYER_VIEW_SCHEMA_VERSION = 3 as const;
export const GAME_STATE_SCHEMA_VERSION = 12 as const;
export const MAX_HARVEST_COMMAND_UNITS = 100_000 as const;
export const UNIT_INVENTORY_CONTAINER_PREFIX = 'LL-CNT-UNIT-';

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
  | { type: 'route'; id: Id }
  | { type: 'bot'; id: Id }
  | { type: 'wildlife'; id: Id };

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
  chestType: 'field' | 'event';
  eventId: Id | null;
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
  featureId: Id;
  materialId: Id;
  materialName: string;
  unit: string;
  capacity: number;
  capacityBasis: { areaUnit: 'hectare' | 'square_metre'; unitsPerArea: number; densityPermille: number; richnessPermille: number };
  location: CoordinateMm;
  siteId: Id | null;
  renewal: 'none' | 'biological_rate' | 'daily_quota';
  dailyQuota: number | null;
  regenerationPerDay: number;
  access: 'open_surface' | 'frozen_water' | 'survey_required' | 'workforce_and_fuel';
  requiredToolTemplateId: Id | null;
  source: SourceRef;
};

export type WorldResourceFeature = {
  id: Id;
  name: string;
  terrainKind: 'salvage' | 'forest' | 'outcrop' | 'frozen_water' | 'coal_seam' | 'salt_spring';
  position: CoordinateMm;
  footprintMm: { widthMm: number; depthMm: number };
  /** Number of cartographic elements at full health (trees, rocks, logs, or water marks). */
  visualElementCount: number;
  /** Connects a resource balance to the part of the feature it changes. */
  appearanceChannels: readonly { resourceId: Id; channel: 'canopy' | 'groundcover' | 'rock_mass' | 'ice' | 'seam' | 'salvage' | 'salt' }[];
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

export type WildlifeGroupState = {
  id: Id;
  ecologyId: Id;
  populationKey: string;
  speciesId: Id;
  displayName: string;
  capacity: number;
  remaining: number;
  position: CoordinateMm;
  discovery: 'hidden' | 'known';
  discoveredAtElapsedMs: number | null;
  lastSightingAtElapsedMs: number | null;
  nextMemberOrdinal: number;
};

export type WildlifeRuntimeState = {
  ruleVersion: string;
  groups: readonly WildlifeGroupState[];
  nextReplenishmentAtElapsedMs: number;
};

export type FixedEventScheduleRow = {
  id: Id;
  displayName: string;
  opensAtMs: number;
  locksAtMs: number;
  resolvesAtMs: number;
  durationHours: number;
  settlementHours: number;
  basis: string;
  researchEvidence: {
    releaseId: 'LL01-WEB-EVENT-SOURCE-ITEMS-7.24';
    sourceRows: number;
    researchOnlyRows: number;
    verifiedAcquisitions: number;
    verifiedShopOffers: number;
    observedChestOutcomes: number;
    unresolvedRowShapes: number;
    unresolvedConflicts: number;
    mechanicFlags: readonly string[];
  };
  statusAtT0: 'scheduled';
  source: SourceRef;
};

export type ScheduledEventState = Omit<FixedEventScheduleRow, 'statusAtT0'> & {
  status: 'scheduled' | 'active' | 'locked' | 'resolved' | 'blocked' | 'cancelled';
  openReceiptSequence: number | null;
  lockReceiptSequence: number | null;
  blockedReceiptSequence: number | null;
  resolutionReceiptSequence: number | null;
};

export type EventProgressState = {
  eventId: Id;
  ruleVersion: string;
  objectiveProgress: number;
  score: number;
  participated: boolean;
  choiceId: 'ice' | 'snow' | null;
  scoreSpent: number;
  shopRuleVersion: string;
  shopStatus: 'scheduled' | 'active' | 'closed' | 'expired';
  shopInitialStock: number;
  shopStockRemaining: number;
  shopPurchasedQuantity: number;
  shopExpiresAtElapsedMs: number;
  expiredItemQuantities: Readonly<Record<Id, number>>;
  outcome: 'unsettled' | 'success' | 'failed' | 'nonparticipant' | 'claimed' | 'expired';
  rewardKrona: number;
  claimExpiresAtElapsedMs: number | null;
  claimReceiptId: Id | null;
};

export type EventProgressionBlocker = {
  eventId: Id;
  blockedAtElapsedMs: number;
  reasonCode: string;
  playerMessage: string;
  receiptSequence: number | null;
};

export type EventContractDefinition = {
  eventId: Id;
  handlerFamily: string;
  runtimeStatus: 'active' | 'planned';
  participationRequirement: string;
  objectives: string;
  scoring: string;
  encounters: string;
  rewardContract: string;
  shopContract: string;
  stockAndExpiry: string;
  settlement: string;
  source: string;
};

export type PlayerCalendarEvent = {
  id: Id;
  displayName: string;
  status: ScheduledEventState['status'];
  readiness: 'executable_lifecycle' | 'executable_ranked_board' | 'calendar_only' | 'settlement_blocked' | 'mandatory_content_blocked';
  eventContract: Omit<EventContractDefinition, 'eventId'>;
  researchEvidence: FixedEventScheduleRow['researchEvidence'];
  opensAtElapsedMs: number;
  locksAtElapsedMs: number;
  resolvesAtElapsedMs: number;
  openReceiptSequence: number | null;
  lockReceiptSequence: number | null;
  resolutionReceiptSequence: number | null;
  objective: { title: string; progress: number; target: number; score: number; participated: boolean; choiceId: 'ice' | 'snow' | null } | null;
  outcome: EventProgressState['outcome'] | null;
  rewardKrona: number;
  claimExpiresAtElapsedMs: number | null;
  rewardClaimed: boolean;
  eventShop: { status: EventProgressState['shopStatus']; scoreAvailable: number; priceScore: number; itemTemplateId: Id; priceCurrency: 'event_score'; stockRemaining: number; initialStock: number; purchasedQuantity: number; expiresAtElapsedMs: number } | null;
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
  stacks: readonly { itemId: Id; templateId: Id; quantity: number; reservedQuantity?: number; unit?: string; ownerId?: Id; equipped: boolean; equippedSlotId?: Id | null; quality?: number | null; condition?: number; foodUnitsPerItem?: number; equipmentTags?: readonly string[]; combatEffects?: Readonly<Record<string, number>>; exclusiveEventId?: Id | null; expiresAtElapsedMs?: number | null; provenance: ProvenanceClass }[];
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
  lootOutcome?: { ruleVersion: string; rewardStacks: readonly { itemId: Id; templateId: Id; quantity: number }[] } | null;
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
  mode: 'chest' | 'hunt';
  observerLineageId: Id;
  actorIds: readonly Id[];
  center: CoordinateMm;
  envelopeRadiusMm: number;
  laneWidthMm: number;
  path: readonly CoordinateMm[];
  returnPath?: readonly CoordinateMm[];
  phase?: 'sweeping' | 'returning';
  speedMmPerHour?: number;
  sweepStartProgressMm?: number;
  stopAtElapsedMs?: number | null;
  targetCount?: number | null;
  foundChestIds?: readonly Id[];
  foundTargetIds: readonly Id[];
  returnReason?: 'area_complete' | 'target_count' | 'time_limit' | 'recalled';
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
export type SearchJobPlayerView = Omit<SearchJobState, 'foundChestIds' | 'foundTargetIds'> & { foundChestCount: number; foundTargetCount: number };

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
  workMsPerUnit: number;
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
  objectiveId?: Id | null;
  rewardStatus?: 'unavailable' | 'pending' | 'claimed' | 'forfeited';
  failureReason?: string | null;
};

export type ShopOfferState = { id: Id; status: 'scheduled' | 'active' | 'expired' | 'closed'; availableAtElapsedMs: number; expiresAtElapsedMs: number | null };
export type CurrencyBalance = { currencyId: Id; amount: number };
export type CaravanState = {
  id: Id;
  status: 'at_checkpoint' | 'departed' | 'distressed' | 'negotiated' | 'escorting' | 'arrived' | 'withdrawn';
  locationSiteId: Id;
  departsAtElapsedMs: number;
  distressAtElapsedMs: number;
  deadlineAtElapsedMs: number;
  arrivalAtElapsedMs: number | null;
  torvenAlive: boolean;
  survivingDraftAnimals: number;
  grainSacks: number;
  saltUnits: number;
  waterLitres: number;
  ledgerIntact: boolean;
  negotiationReceiptId: Id | null;
  escortReceiptId: Id | null;
  tradeRouteUnlocked: boolean;
  torvenContractOfferAvailable: boolean;
};
export type Stage08MarketOfferState = {
  id: Id;
  status: 'active' | 'closed' | 'expired';
  sellerId: Id;
  sourceEntryId: Id | null;
  handlerVersion: Id;
  locationSiteId: Id;
  itemTemplateId: Id;
  itemUnit: string;
  quantityPerPurchase: number;
  currencyId: Id;
  unitPrice: number;
  stockRemaining: number;
  initialStock: number;
  lifetimePurchaseLimit: number;
  purchasedQuantity: number;
  consumedQuantity: number;
  availableAtElapsedMs: number;
  expiresAtElapsedMs: number | null;
  exclusiveEventId: Id | null;
  effectContract: Id;
};
export type Stage08AuctionLotState = {
  id: Id;
  sellerId: Id;
  locationSiteId: Id;
  sourceCargoId: Id;
  itemTemplateId: Id;
  itemUnit: string;
  quantity: number;
  reservedQuantity: number;
  minimumUnitBid: number;
  currencyId: Id;
  opensAtElapsedMs: number;
  closesAtElapsedMs: number;
  status: 'scheduled' | 'open' | 'closed';
};
export type Stage08AuctionBidState = {
  id: Id;
  lotId: Id;
  bidderId: Id;
  quantity: number;
  unitBid: number;
  escrowAmount: number;
  createdAtElapsedMs: number;
  status: 'open' | 'cancelled' | 'expired';
  receiptId: Id | null;
};
export type Stage08RankSnapshot = {
  boardId: Id;
  status: 'blocked' | 'settled';
  settledAtElapsedMs: number;
  sourceContract: Id;
  reasonCode: Id | null;
  rows: readonly {
    playerId: Id;
    playerName: string;
    rank: number;
    level: number;
    completionAtElapsedMs: number;
    rewardBandId: string;
    rewardStatus: 'pending' | 'claimed' | 'npc_materialized';
    rewardItems: readonly { instanceId: Id; itemTemplateId: Id; quantity: number; status: 'committed' | 'blocked'; blocker: string | null }[];
    claimReceiptId: Id | null;
  }[];
  snapshotSha256: string;
};
export type OpeningRivalActionState = {
  id: Id;
  contenderId: Id;
  action: 'hunt' | 'forage' | 'recover';
  occurredAtElapsedMs: number;
  result: 'completed' | 'no_target' | 'resource_shortage';
  targetsConsumed: number;
  xpAwarded: number;
  levelBefore: number;
  levelAfter: number;
  resourcesBefore: { rations: number; firewood: number; prey: number };
  resourcesAfter: { rations: number; firewood: number; prey: number };
  ruleVersion: string;
};
export type OpeningRivalRuntimeState = {
  contenderId: Id;
  level: number;
  xp: number;
  completionAtElapsedMs: number | null;
  nextActionAtElapsedMs: number | null;
  actionIntervalMs: number;
  actionsTaken: number;
  resources: { rations: number; firewood: number; prey: number; nextMealAtElapsedMs: number; nextFirewoodAtElapsedMs: number };
  actionLedger: readonly OpeningRivalActionState[];
};
export type OpeningBoardView = {
  boardId: Id;
  status: 'scheduled' | 'open' | 'closed';
  opensAtElapsedMs: number;
  closesAtElapsedMs: number;
  displayDelayMs: number;
  rows: readonly { playerId: Id; playerName: string; rank: number; level: number; completionAtElapsedMs: number }[];
  rewardClaimStatus: 'unavailable' | 'pending' | 'claimed';
};
export type Stage08RuntimeState = {
  enabled: boolean;
  caravan: CaravanState;
  marketOffers: readonly Stage08MarketOfferState[];
  auctionLots: readonly Stage08AuctionLotState[];
  auctionBids: readonly Stage08AuctionBidState[];
  rewardClaimReceipts: readonly Id[];
  rankSnapshots: readonly Stage08RankSnapshot[];
  openingRivals: readonly OpeningRivalRuntimeState[];
};
export type Stage08PlayerView = {
  caravan: Pick<CaravanState, 'id' | 'status' | 'locationSiteId' | 'deadlineAtElapsedMs' | 'arrivalAtElapsedMs'> | null;
  marketOffers: readonly Stage08MarketOfferState[];
  botMarketListings: readonly {
    id: Id;
    sellerBotId: Id;
    sellerName: string;
    blueprintId: Id;
    paymentResource: 'food' | 'water';
    askAmount: number;
    expiresAtElapsedMs: number;
    compatibleBlueprintId: Id | null;
    blocker: string | null;
  }[];
  auctionLots: readonly Stage08AuctionLotState[];
  auctionBids: readonly Stage08AuctionBidState[];
  rankSnapshots: readonly Stage08RankSnapshot[];
  openingBoard: OpeningBoardView;
};

export type BotTalentGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type BotTalentKind = 'combat' | 'production';
export type BotWorkKind = 'idle' | 'gather_food' | 'gather_wood' | 'gather_stone' | 'gather_ore' | 'prepare_water' | 'construct' | 'recruit' | 'search' | 'scout' | 'raid' | 'recover' | 'deliver' | 'repair' | 'equip' | 'hunt' | 'learn_blueprint' | 'open_chest' | 'list_blueprint' | 'upgrade_territory';
export type BotResourceKey = 'food' | 'wood' | 'stone' | 'ore';
export type BotCargoKey = BotResourceKey | 'firewood';
export type BotPlanState = {
  goal: 'survive' | 'recover' | 'supply' | 'expand' | 'recruit' | 'discover' | 'defend' | 'contest' | 'scout';
  action: BotWorkKind;
  actionId: Id;
  startedAtElapsedMs: number;
  completesAtElapsedMs: number;
  targetId: Id | null;
  /** Set only for a blueprint listing action; a saved plan keeps its payment currency stable across reloads. */
  marketPaymentResource?: 'food' | 'water';
  workersAssigned: number;
  reserved: Record<BotResourceKey, number>;
  startingResourcesMicro: Record<BotResourceKey, number>;
  expectedOutcome: string;
};
export type BotStructureInstance = {
  id: Id;
  blueprintId: Id;
  anchor: CoordinateMm;
  orientation: 0 | 90 | 180 | 270;
  footprintMm: { widthMm: number; depthMm: number };
  level: number;
  status: 'under_construction' | 'active' | 'damaged' | 'destroyed';
  workRequired: number;
  workCompleted: number;
  repairWorkRequired: number;
  repairWorkCompleted: number;
  damagePermille: number;
  layoutSeed: string;
  completedAtElapsedMs: number | null;
};
export type BotUnitCohort = {
  id: Id;
  templateId: Id;
  firstMemberOrdinal: number;
  livingCount: number;
  recruitedCount: number;
  lostCount: number;
  level: number;
  xp: number;
  healthPerMember: number;
  maxHealthPerMember: number;
  equipmentTemplateIds: readonly Id[];
  order: 'defend' | 'gather' | 'scout' | 'raid' | 'retreat' | 'recover';
  location: CoordinateMm;
};
export type BotActionReceipt = {
  actionId: Id;
  botId: Id;
  action: BotWorkKind;
  targetId: Id | null;
  occurredAtElapsedMs: number;
  result: 'completed' | 'depleted' | 'blocked' | 'retreated' | 'defeated' | 'discovered' | 'duplicate';
  resourceDelta: Record<BotResourceKey, number>;
  /** XP earned from the committed action before the bot's talent adjustment. */
  baseXpAwarded: number;
  /** Versioned fixed-point talent adjustment applied to baseXpAwarded. */
  talentXpMultiplierPermille: number;
  xpAwarded: number;
  casualties: number;
  ruleVersion: Id;
  drawIndex: number;
};
export type BotSearchSource = {
  id: Id;
  kind: 'field_cache' | 'ruin' | 'wildlife_track' | 'survey_site';
  position: CoordinateMm;
  remainingActions: number;
  eligibleBlueprintIds: readonly Id[];
  discovered: boolean;
  contactTargetId?: Id;
  /** Fixed overlay threat rating for finite wildlife packs; only set for wildlife_track sources. */
  wildlifeDangerPermille?: number;
  /** Multiple settlements can hunt the same finite regional prey stock. */
  sharedStockId?: Id;
  /** A fixed world chest reference shared with the player's field-chest ledger. */
  fieldChestId?: Id;
};
export type BotBlueprintItem = {
  instanceId: Id;
  blueprintId: Id;
  sourceId: Id;
  acquiredAtElapsedMs: number;
  status: 'owned' | 'learned' | 'listed' | 'escrowed' | 'sold';
  resolvedAtElapsedMs: number | null;
  transactionId: Id | null;
  ruleVersion: Id;
};
export type BotOwnedChest = {
  chestId: Id;
  fieldChestId: Id | null;
  sourceId: Id;
  chestType: 'field' | 'event';
  eventId: Id | null;
  grade: FieldChest['grade'];
  lootCommitment: Id;
  acquiredAtElapsedMs: number;
  status: 'owned' | 'opened';
  openedAtElapsedMs: number | null;
  lootReceiptId: Id | null;
  lootOutcome: readonly { itemTemplateId: Id; quantity: number }[] | null;
  ruleVersion: Id;
};
export type BotInventoryItem = {
  instanceId: Id;
  itemTemplateId: Id;
  quantity: number;
  sourceId: Id;
  acquiredAtElapsedMs: number;
  ruleVersion: Id;
};
export type BotMarketListing = {
  id: Id;
  sellerBotId: Id;
  blueprintItemInstanceId: Id;
  blueprintId: Id;
  paymentResource: 'food' | 'water';
  askAmount: number;
  createdAtElapsedMs: number;
  lastRepricedAtElapsedMs: number;
  repriceCount: number;
  expiresAtElapsedMs: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  buyerBotId: Id | null;
  transactionId: Id | null;
  resolvedAtElapsedMs: number | null;
};
export type BotMarketTransaction = {
  id: Id;
  listingId: Id;
  sellerBotId: Id;
  buyerBotId: Id;
  blueprintItemInstanceId: Id;
  blueprintId: Id;
  paymentResource: 'food' | 'water';
  paymentAmount: number;
  occurredAtElapsedMs: number;
  ruleVersion: Id;
};
export type BotSharedWildlifeStock = {
  id: Id;
  position: CoordinateMm;
  initialActions: number;
  remainingActions: number;
  dangerPermille: number;
};
export type BotKnownTarget = { id: Id; kind: 'bot' | 'player'; position: CoordinateMm; observedAtElapsedMs: number };
export type BotLordFate = {
  status: 'active' | 'dead' | 'captured' | 'dispossessed';
  changedAtElapsedMs: number | null;
  cause: 'starvation' | 'dehydration' | 'cold' | 'battle_capture' | 'territory_loss' | 'settlement_abandoned' | null;
  triggerId: Id | null;
};
export type BotArmyMovement = {
  orderId: Id;
  targetId: Id;
  unitKind: 'army' | 'scout';
  unitCount: number;
  /** Exact cohort members sent when the force has a durable detachment composition. */
  cohortMemberCounts?: readonly { cohortId: Id; memberCount: number }[];
  from: CoordinateMm;
  to: CoordinateMm;
  startedAtElapsedMs: number;
  arrivesAtElapsedMs: number;
  status: 'outbound' | 'besieging' | 'surveying' | 'returning';
};
export type BotCasualtyLedger = {
  starvation: number;
  dehydration: number;
  fuelExhaustion: number;
  regionalBlizzard: number;
  battle: number;
  wildlife: number;
  unattributed: number;
};
export type BotWorkforceState = {
  gatherFood: number;
  gatherWood: number;
  gatherStone: number;
  gatherOre: number;
  farmers: number;
  millWorkers: number;
  quarryWorkers: number;
  smiths: number;
  builders: number;
  scouts: number;
  guards: number;
  recruiters: number;
};
export type BotColdRecord = {
  botId: Id;
  ordinal: number;
  name: string;
  regionId: Id;
  position: CoordinateMm;
  oldAffinity: string;
  /** Lord state is independent of civilian population and army counts. */
  lordFate: BotLordFate;
  /** Durable resident and troop loss counts by cause; legacy losses remain unattributed. */
  casualtiesByCause: BotCasualtyLedger;
  aggressionPermille: number;
  riskTolerancePermille: number;
  decisionPhaseMs: number;
  knownTargetIds: readonly Id[];
  knownTargets: readonly BotKnownTarget[];
  armyMovement: BotArmyMovement | null;
  workforce: BotWorkforceState;
  blueprintIds: readonly Id[];
  /** Found blueprints remain owned items until a one-time learn or market settlement. */
  blueprintItems: readonly BotBlueprintItem[];
  /** Territory progression is separate from the lord's XP level. */
  territoryLevel: number;
  ownedChests: readonly BotOwnedChest[];
  inventoryItems: readonly BotInventoryItem[];
  structures: readonly BotStructureInstance[];
  cohorts: readonly BotUnitCohort[];
  /** Unopened event items and overflow food remain attributable to their one-time reward receipt. */
  eventInventory: readonly BotEventInventoryItem[];
  searchSources: readonly BotSearchSource[];
  currentPlan: BotPlanState | null;
  /** Recent full receipts plus compact immutable pages for every older committed action. */
  actionReceipts: readonly BotActionReceipt[];
  actionReceiptArchive: readonly string[];
  carriedCargo: Record<BotCargoKey, number>;
  starvationExposureMs: number;
  coldExposureMs: number;
  /** Versioned frozen-source overlay; values are millilitres and remain finite. */
  potableWaterMl: number;
  localIceRemainingMl: number;
  waterConsumptionRemainder: number;
  dehydrationExposureMs: number;
  lordStarvationExposureMs: number;
  lordDehydrationExposureMs: number;
  lordColdExposureMs: number;
  nextActionOrdinal: number;
  nextMemberOrdinal: number;
  lastSafePosition: CoordinateMm;
};
/** Durable structure-of-arrays row. The SQLite codec stores this as one immutable, checksummed chunk. */
export type BotStateChunk = {
  index: number;
  firstOrdinal: number;
  count: number;
  ids: readonly number[];
  talentGrades: readonly number[];
  talentKinds: readonly number[];
  regionIndices: readonly number[];
  alive: readonly number[];
  lastIntegratedAtElapsedMs: readonly number[];
  nextWakeAtElapsedMs: readonly number[];
  levels: readonly number[];
  completionAtElapsedMs: readonly number[];
  xp: readonly number[];
  foodMicro: readonly number[];
  woodMicro: readonly number[];
  stoneMicro: readonly number[];
  oreMicro: readonly number[];
  reservedFoodMicro: readonly number[];
  reservedWoodMicro: readonly number[];
  reservedStoneMicro: readonly number[];
  reservedOreMicro: readonly number[];
  foodRemainder: readonly number[];
  woodRemainder: readonly number[];
  stoneRemainder: readonly number[];
  oreRemainder: readonly number[];
  population: readonly number[];
  workers: readonly number[];
  assignedWorkers: readonly number[];
  workKind: readonly number[];
  workProgress: readonly number[];
  workRequired: readonly number[];
  foodNodeMicro: readonly number[];
  foodNodeRemainder: readonly number[];
  woodNodeMicro: readonly number[];
  woodNodeRemainder: readonly number[];
  stoneNodeMicro: readonly number[];
  stoneNodeRemainder: readonly number[];
  oreNodeMicro: readonly number[];
  oreNodeRemainder: readonly number[];
  armySize: readonly number[];
  armyHealthPermille: readonly number[];
  buildingCount: readonly number[];
  farmCount: readonly number[];
  millCount: readonly number[];
  quarryCount: readonly number[];
  barracksCount: readonly number[];
  wallCount: readonly number[];
  firewoodMicro: readonly number[];
  firewoodRemainder: readonly number[];
  foodConsumptionRemainder: readonly number[];
  firewoodConsumptionRemainder: readonly number[];
  firewoodNodeRemainder: readonly number[];
  actionCount: readonly number[];
  deathCount: readonly number[];
  knownBotCount: readonly number[];
  cold: readonly BotColdRecord[];
  rowSha256: readonly string[];
  chunkSha256: string;
};
export type BotPopulationState = {
  schemaVersion: 1;
  generationProfile: 'P0_ACTIVE' | 'BENCHMARK_STRESS';
  configuredMapRadiusKm: number;
  talentQuotas: Readonly<Record<BotTalentGrade, number>>;
  generationVersion: Id;
  rulesVersion: Id;
  plannerRuleVersion: Id;
  blueprintRulesVersion: Id;
  activityXpRuleVersion: Id;
  talentXpRuleVersion: Id;
  actionReceiptArchiveVersion: Id;
  huntRuleVersion: Id;
  repairRuleVersion: Id;
  equipmentRuleVersion: Id;
  recoveryRuleVersion: Id;
  eventRewardRuleVersion: Id;
  sharedWildlifeRuleVersion: Id;
  survivalRuleVersion: Id;
  weatherRuleVersion: Id;
  territoryRuleVersion: Id;
  marketRuleVersion: Id;
  saveSeed: string;
  rulesetSha256: string;
  totalParticipants: number;
  botCount: number;
  chunkSize: number;
  generatedAtElapsedMs: number;
  playerRaidProtectionEndsAtElapsedMs: number;
  chunks: readonly BotStateChunk[];
  chunkRootSha256: string;
  sharedWildlifeStocks: readonly BotSharedWildlifeStock[];
  sharedWildlifeRootSha256: string;
  /** Min-heap of next chunk wakes. Equal timestamps are ordered by chunk then bot ordinal. */
  schedulerHeap: readonly { atElapsedMs: number; chunkIndex: number; botOrdinal: number }[];
  publicRevision: number;
  lastPublicSnapshotAtElapsedMs: number;
  pendingBoardPublicationAtElapsedMs: readonly number[];
  /** Immutable score snapshots are built only at a board receipt or explicit refresh. */
  boardSnapshots: readonly BotBoardSnapshot[];
  eventReceipts: readonly BotEventReceipt[];
  rewardReceipts: readonly BotRewardReceipt[];
  marketListings: readonly BotMarketListing[];
  marketTransactions: readonly BotMarketTransaction[];
  completedActionCount: number;
  benchmarkCounters: { plannerExpansions: number; integratedBotSegments: number; dirtyChunks: number };
};
export type BotEventReceipt = {
  id: Id;
  eventId: Id;
  botId: Id;
  actionReceiptId: Id;
  scoreRule: Id;
  scoreDelta: number;
  occurredAtElapsedMs: number;
};
export type BotEventInventoryItem = {
  instanceId: Id;
  itemTemplateId: Id;
  /** Quantity still held; original entitlement remains on the immutable reward receipt. */
  quantity: number;
  appliedQuantity: number;
  consumedQuantity: number;
  eventId: Id;
  rewardReceiptId: Id;
  awardedAtElapsedMs: number;
  ruleVersion: Id;
};
export type BotRewardReceipt = {
  id: Id;
  eventId: Id;
  botId: Id;
  actionReceiptId: Id;
  rank: number;
  rewardBandId: Id;
  occurredAtElapsedMs: number;
  ruleVersion: Id;
  /** Original payload is immutable; supported delivery and source-blocked slots remain explicit. */
  items: readonly { instanceId: Id; itemTemplateId: Id; quantity: number; status: 'committed' | 'blocked'; blocker: string | null;
    foodUnitsApplied: number; inventoryQuantity: number }[];
};
export type BotBoardSnapshot = {
  boardId: Id;
  revision: number;
  asOfSimMs: number;
  observedThroughSimMs: number;
  status: 'open' | 'settled';
  rows: readonly { botId: Id; displayName: string; rank: number; score: number; tieValue: number; receiptCount: number }[];
  snapshotSha256: string;
};
export type BotMapMarker = {
  botId: Id;
  label: string;
  position: CoordinateMm;
  observedAtElapsedMs: number;
  knowledge: 'current' | 'remembered';
  level: number | null;
  militaryCount: number | null;
  structureCount: number | null;
  status: 'active' | 'under_attack' | 'destroyed' | 'dead' | 'captured' | 'dispossessed' | 'unknown';
};
export type BotArmyMarker = {
  botId: Id;
  label: string;
  position: CoordinateMm;
  observedAtElapsedMs: number;
  knowledge: 'current' | 'remembered';
  count: number;
  order: 'raid' | 'retreat' | 'scout';
};
export type BotInspectionView = {
  botId: Id;
  name: string;
  position: CoordinateMm;
  observedAtElapsedMs: number;
  current: boolean;
  talent: { grade: BotTalentGrade; kind: BotTalentKind } | null;
  level: number | null;
  territoryLevel: number | null;
  population: number | null;
  lordFate: BotLordFate | null;
  potableWaterMl: number | null;
  resourceBalances: Readonly<Partial<Record<BotResourceKey, number>>> | null;
  structures: readonly Pick<BotStructureInstance, 'id' | 'blueprintId' | 'anchor' | 'level' | 'status' | 'workCompleted' | 'workRequired' | 'repairWorkCompleted' | 'repairWorkRequired'>[] | null;
  army: readonly Pick<BotUnitCohort, 'id' | 'templateId' | 'livingCount' | 'level' | 'order' | 'location'>[] | null;
};
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
  resourceFeatures: readonly WorldResourceFeature[];
  resources: readonly WorldResource[];
  ecology: readonly EcologyRecord[];
  routes: readonly { id: Id; description: string; source: SourceRef }[];
  navigationOverlay: NavigationOverlay;
  dormantQuestIds: readonly Id[];
  eventSchedule: readonly FixedEventScheduleRow[];
  eventContractRegistryVersion: string;
  eventContracts: readonly EventContractDefinition[];
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
  resourceDeposit?: ResourceDepositView;
  chestLoot?: {
    chestType: FieldChest['chestType'];
    rarity: FieldChest['grade'];
    eventId: Id | null;
    ruleVersion: string;
    rollCount: number;
    odds: readonly { templateId: Id; perRollPermille: number; chanceAtLeastOncePermille: number }[];
    opened: boolean;
    outcome?: readonly { templateId: Id; quantity: number }[];
  };
  actions: readonly ActionAvailability[];
};

export type ResourceDepositMaterialView = {
  resourceId: Id;
  materialId: Id;
  materialName: string;
  unit: string;
  capacity: number;
  remaining: number | null;
  reserved: number | null;
  dailyQuota: number | null;
  dailyRemaining: number | null;
  harvestRateUnitsPerHour: number;
  renewal: WorldResource['renewal'];
  regenerationPerDay: number;
  requiredToolTemplateId: Id | null;
  access: WorldResource['access'];
  accessReason: string | null;
  status: 'available' | 'depleted' | 'blocked';
};

export type ResourceDepositView = {
  featureId: Id;
  featureName: string;
  terrainKind: WorldResourceFeature['terrainKind'];
  footprintMm: WorldResourceFeature['footprintMm'];
  heatActive: boolean;
  heatCovered: boolean;
  distanceFromHeatMm: number;
  heatRadiusMm: number;
  carryCapacityUnits: number;
  storageStackSlots: number | null;
  materials: readonly ResourceDepositMaterialView[];
};

export type VisibleMap = {
  coordinateSystem: WorldDefinition['coordinateSystem'];
  coordinateEncoding: WorldDefinition['coordinateEncoding'];
  currentSight: readonly { center: CoordinateMm; radiusMm: number; source: 'player' | 'unit' | 'survival_fire' }[];
  visibleGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[] }[];
  exploredGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[]; radiusMm?: number }[];
  terrain: readonly { id: Id; label: string; position: CoordinateMm }[];
  resourceFeatures: readonly (WorldResourceFeature & {
    channels: readonly { resourceId: Id; channel: WorldResourceFeature['appearanceChannels'][number]['channel']; remainingRatio: number }[];
  })[];
  entities: readonly PlayerEntityView[];
  knownRoutes: readonly { id: Id; label: string; path: readonly CoordinateMm[] }[];
  activeOrders: readonly { id: Id; kind: string; status: string; actorIds: readonly Id[]; position: CoordinateMm; path: readonly CoordinateMm[]; totalDistanceMm: number; etaElapsedMs: number; uncertainty: 'known' | 'uncertain' }[];
  heatOverlays: readonly { center: CoordinateMm; radiusMm: number; minCelsius: number; maxCelsius: number }[];
  combatTargets?: readonly { targetId: Id; label: string; position: CoordinateMm; status: 'available' | 'reacting'; groupId?: Id; remaining?: number }[];
  enemyBots?: readonly BotMapMarker[];
  enemyArmies?: readonly BotArmyMarker[];
};

export type Stage07CombatView = {
  target: { id: Id; label: string; state: 'available' | 'reacting' | 'retreated' | 'dead'; regionId: Id; regionalPopulationRemaining: number | null; position: CoordinateMm; attack: ActionAvailability } | null;
  encounter: null | {
    id: Id; status: 'active' | 'victory' | 'defeat' | 'retreated'; actorIds: readonly Id[]; round: number;
    nextTurnAtElapsedMs: number | null; targetHealth: { current: number; max: number };
    log: readonly CombatLogEntry[];
  };
};

export type PlayerView = {
  schemaVersion: typeof PLAYER_VIEW_SCHEMA_VERSION;
  saveId: Id;
  revision: number;
  lastEventSequence: number;
  simElapsedMs: number;
  clockControl: ClockControl;
  clockStatus: { driver: 'active' | 'observing' | 'unclaimed'; catchingUp: boolean; targetSimElapsedMs: number; leaseRemainingMs: number };
  calendar: readonly PlayerCalendarEvent[];
  eventProgressionBlocker: { eventId: Id; displayName: string; blockedAtElapsedMs: number; playerMessage: string } | null;
  quests: readonly QuestProgressState[];
  currency: readonly CurrencyBalance[];
  stage08: Stage08PlayerView;
  botBoardSnapshots: readonly BotBoardSnapshot[];
  botInspection: BotInspectionView | null;
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
      hasFuel: boolean;
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
    containers: readonly { id: Id; kind: InventoryContainerState['kind']; ownerId: Id | null; label: string; slots: number; occupiedSlots: number; capacitySlots: number | null; accessible: boolean; location: InventoryContainerState['location']; items: readonly { itemId: Id; label: string; quantity: number; reservedQuantity: number; unit: string | null; quality: number | null; ownerId: Id | null; equipped: boolean; equippedSlotId: Id | null; foodUnitsPerItem: number | null; equipmentTags?: readonly string[]; combatEffects?: Readonly<Record<string, number>>; exclusiveEventId?: Id | null; expiresAtElapsedMs?: number | null; condition?: number | null; provenance: ProvenanceClass }[] }[];
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
    searchJobs: readonly SearchJobPlayerView[];
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
      capacity: number;
      dailyQuota: number | null;
      dailyRemaining: number | null;
      renewal: WorldResource['renewal'];
      regenerationPerDay: number;
      requiredToolTemplateId: Id | null;
      access: WorldResource['access'];
      accessReason: string | null;
      harvestRateUnitsPerHour: number;
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
  wildlifeGroupId?: Id;
  individualOrdinal?: number;
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
  wildlifeTargets?: readonly Stage07PreyState[];
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
    knownBotIds?: readonly Id[];
    inspectedBotId?: Id | null;
    lastSeenBotById?: Readonly<Record<Id, { observedAtElapsedMs: number; position: CoordinateMm }>>;
    lastSeenBotArmyById?: Readonly<Record<Id, { observedAtElapsedMs: number; position: CoordinateMm; count: number; order: 'raid' | 'retreat' | 'scout' }>>;
    knownWildlifeGroupIds?: readonly Id[];
    careerCardObserved: boolean;
    lastSeenByEntity: Readonly<Record<string, { observedAtElapsedMs: number; knowledge: KnowledgeStatus }>>;
    lastInspectedEntityIds: readonly Id[];
  };
  fieldChestStates: readonly FieldChestRuntimeState[];
  wildlife: WildlifeRuntimeState;
  corpses: readonly CorpseState[];
  combat?: Stage07CombatState;
  progression?: { transactions: readonly XpTransactionState[]; mirrorReceiptKeys: readonly string[] };
  quests: readonly QuestProgressState[];
  calendar: readonly ScheduledEventState[];
  eventProgress: readonly EventProgressState[];
  eventProgressionBlocker: EventProgressionBlocker | null;
  offers: readonly ShopOfferState[];
  stage08: Stage08RuntimeState;
  /** Null in migrated pre-bot saves; those saves retain their frozen/legacy rival action stream. */
  botPopulation?: BotPopulationState | null;
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
  | 'inspect_bot'
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
  | 'buy_bot_market_listing'
  | 'accept_quest'
  | 'negotiate_caravan'
  | 'escort_caravan'
  | 'claim_quest_reward'
  | 'claim_opening_rank_reward'
  | 'claim_event_reward'
  | 'choose_event_path'
  | 'buy_event_offer'
  | 'place_auction_bid'
  | 'cancel_auction_bid'
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
  inspect_bot: { botId: Id };
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
  search: { actorId: Id; center: CoordinateMm; radiusMm: number; mode?: 'chest' | 'hunt'; additionalActorIds?: readonly Id[]; targetCount?: number; timeLimitMinutes?: number };
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
  shop_transaction: { offerId: Id; destinationContainerId: Id; quantity: number };
  buy_bot_market_listing: { listingId: Id; paymentContainerId: Id; paymentItemId: Id };
  accept_quest: { questId: Id };
  negotiate_caravan: { questId: Id; route: 'trade_one_grain_sack' };
  escort_caravan: { questId: Id };
  claim_quest_reward: { questId: Id };
  claim_opening_rank_reward: { boardId: Id };
  claim_event_reward: { eventId: Id };
  choose_event_path: { eventId: Id; choiceId: 'ice' | 'snow' };
  buy_event_offer: { eventId: Id; destinationContainerId: Id; quantity: number };
  place_auction_bid: { lotId: Id; quantity: number; unitBid: number };
  cancel_auction_bid: { bidId: Id };
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
  'inspect_entity', 'inspect_bot', 'inspect_starter_container', 'inspect_career_card', 'activate_career_card', 'set_clock_speed',
  'advance_to_boundary', 'enqueue_tomb', 'cancel_tomb', 'refuel_fire', 'extinguish_fire', 'light_fire', 'move', 'cancel_travel', 'survey', 'search', 'harvest', 'cancel_spatial_job', 'transfer_item',
  'open_cache', 'repair', 'build', 'craft', 'revive', 'butcher_corpse', 'equip', 'attack', 'retreat', 'shop_transaction', 'buy_bot_market_listing', 'accept_quest', 'negotiate_caravan', 'escort_caravan', 'claim_quest_reward', 'claim_opening_rank_reward', 'claim_event_reward', 'choose_event_path', 'buy_event_offer', 'place_auction_bid', 'cancel_auction_bid', 'assign_construction_workers', 'cancel_construction_job', 'recruit_resident', 'operate_heater', 'split_stack', 'merge_stacks', 'consume_item', 'unequip_item',
]);

const payloadFields: Readonly<Record<CommandType, readonly string[]>> = {
  inspect_entity: ['entity'],
  inspect_bot: ['botId'],
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
  shop_transaction: ['offerId', 'destinationContainerId', 'quantity'],
  buy_bot_market_listing: ['listingId', 'paymentContainerId', 'paymentItemId'],
  accept_quest: ['questId'],
  negotiate_caravan: ['questId', 'route'],
  escort_caravan: ['questId'],
  claim_quest_reward: ['questId'],
  claim_opening_rank_reward: ['boardId'],
  claim_event_reward: ['eventId'],
  choose_event_path: ['eventId', 'choiceId'],
  buy_event_offer: ['eventId', 'destinationContainerId', 'quantity'],
  place_auction_bid: ['lotId', 'quantity', 'unitBid'],
  cancel_auction_bid: ['bidId'],
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
  return ['site', 'resource', 'cache', 'item', 'unit', 'building', 'corpse', 'lair', 'route', 'bot', 'wildlife'].includes(String(value.type));
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
  const optional: Partial<Record<CommandType, readonly string[]>> = {
    move: ['destinationId', 'destination'],
    search: ['mode', 'additionalActorIds', 'targetCount', 'timeLimitMinutes'],
  };
  const allowed = commandType === 'set_clock_speed' ? ['speed', 'customMultiplier', 'stopCondition'] : [...required, ...(optional[commandType] ?? [])];
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key)) return issue('COMMAND_PAYLOAD_FIELD_UNKNOWN', `$.payload.${key}`, 'Command payload contains an unregistered field.');
  }
  if (input.type === 'inspect_entity' && !validEntityRef(payload.entity)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.entity', 'Expected a registered entity reference.');
  }
  if (input.type === 'inspect_bot' && (typeof payload.botId !== 'string' || payload.botId.trim() === '' || payload.botId.length > 160)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.botId', 'Expected a non-empty bot ID no longer than 160 characters.');
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
  if (input.type === 'search' && payload.mode !== undefined && payload.mode !== 'chest' && payload.mode !== 'hunt') {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.mode', 'Search mode must be chest or hunt.');
  }
  if (input.type === 'search' && 'additionalActorIds' in payload
    && (!Array.isArray(payload.additionalActorIds) || payload.additionalActorIds.some(id => typeof id !== 'string' || id.trim() === '')
      || new Set(payload.additionalActorIds).size !== payload.additionalActorIds.length || payload.additionalActorIds.includes(payload.actorId as string))) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.additionalActorIds', 'Additional search actors must be unique actor IDs, excluding the lead.');
  }
  if (input.type === 'search' && 'targetCount' in payload
    && (!Number.isSafeInteger(payload.targetCount) || Number(payload.targetCount) < 1 || Number(payload.targetCount) > 192)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.targetCount', 'The target count must be a whole number from 1 to 192.');
  }
  if (input.type === 'search' && 'timeLimitMinutes' in payload
    && (!Number.isSafeInteger(payload.timeLimitMinutes) || Number(payload.timeLimitMinutes) < 15 || Number(payload.timeLimitMinutes) > 10_080)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.timeLimitMinutes', 'The time limit must be 15 minutes to seven days.');
  }
  if (input.type === 'harvest' && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1 || Number(payload.quantity) > MAX_HARVEST_COMMAND_UNITS)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Expected a positive whole resource quantity within the command limit.');
  }
  if ((input.type === 'attack' || input.type === 'retreat') && (!Array.isArray(payload.actorIds) || payload.actorIds.length === 0 || payload.actorIds.some(id => typeof id !== 'string' || id.length === 0) || new Set(payload.actorIds).size !== payload.actorIds.length)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.actorIds', 'Expected one or more actor IDs.');
  }
  if (['shop_transaction', 'refuel_fire', 'transfer_item', 'recruit_resident', 'split_stack', 'consume_item', 'place_auction_bid'].includes(String(input.type)) && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Expected a positive integer quantity.');
  }
  if (input.type === 'place_auction_bid' && (!Number.isSafeInteger(payload.unitBid) || Number(payload.unitBid) < 1)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.unitBid', 'Auction bids must be a positive whole currency amount per item.');
  }
  if (input.type === 'negotiate_caravan' && payload.route !== 'trade_one_grain_sack') {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.route', 'Choose a registered caravan negotiation route.');
  }
  if (input.type === 'choose_event_path' && payload.choiceId !== 'ice' && payload.choiceId !== 'snow') {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.choiceId', 'Choose either the ice path or the snow path.');
  }
  for (const key of required.filter(field => !['entity', 'actorIds', 'workerIds', 'quantity', 'unitBid', 'center', 'radiusMm', 'position'].includes(field))) {
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
