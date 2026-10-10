export const CONTRACT_SCHEMA_VERSION = 1 as const;

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
  source: SourceRef;
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

export type InventoryContainerState = {
  id: Id;
  kind: 'territory_supply' | 'carried_bag' | 'backpack' | 'building_storage' | 'unit_inventory';
  capacitySlots: number | null;
  occupiedSlots: number | null;
  location: { kind: 'site'; siteId: Id } | { kind: 'carried'; ownerId: Id } | { kind: 'building'; buildingId: Id } | { kind: 'unit'; unitId: Id };
  observed: boolean;
  stacks: readonly { itemId: Id; templateId: Id; quantity: number; equipped: boolean; provenance: ProvenanceClass }[];
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
  location: { kind: 'site'; siteId: Id } | { kind: 'travel'; orderId: Id } | { kind: 'building'; buildingId: Id };
  equipmentIds: readonly Id[];
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
};

export type FieldChestLifecycleState = { chestId: Id; state: 'unopened' | 'opened' | 'destroyed'; openedAtElapsedMs: number | null };
export type CorpseState = {
  id: Id;
  actorId: Id;
  location: { kind: 'site'; siteId: Id } | { kind: 'carried'; carrierId: Id } | { kind: 'buried'; siteId: Id };
  state: 'unobserved' | 'known' | 'preserved' | 'damaged' | 'revived' | 'buried' | 'destroyed';
  sourceStatus: string;
  createdAtElapsedMs: number;
  ownershipId: Id | null;
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
export type TombQueueEntry = { id: Id; recipeId: Id; status: 'queued' | 'active' | 'blocked'; reservedDeathQi: number; enqueuedAtElapsedMs: number };

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
  dormantQuestIds: readonly Id[];
  eventSchedule: readonly FixedEventScheduleRow[];
  lockedSourceHashes: Readonly<Record<string, string>>;
  contentSha256: string;
};

export type ClockControl = { status: 'paused' | 'running'; speedPermille: number };
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
  currentSight: readonly { center: CoordinateMm; radiusMm: number; source: 'survival_fire' }[];
  visibleGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[] }[];
  exploredGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[] }[];
  terrain: readonly { id: Id; label: string; position: CoordinateMm }[];
  entities: readonly PlayerEntityView[];
  knownRoutes: readonly { id: Id; label: string }[];
  activeOrders: readonly { id: Id; kind: string; status: string }[];
  heatOverlays: readonly { center: CoordinateMm; radiusMm: number; minCelsius: number; maxCelsius: number }[];
};

export type PlayerView = {
  schemaVersion: typeof CONTRACT_SCHEMA_VERSION;
  saveId: Id;
  revision: number;
  lastEventSequence: number;
  simElapsedMs: number;
  clockControl: ClockControl;
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
  };
  careerCard: {
    observed: boolean;
    career: null | { id: Id; name: string; openingSkillId: Id; growthAllocation: 'SPI/PRE' };
  };
  territory: {
    id: Id;
    stage: 'H0';
    position: CoordinateMm;
    survivalFire: { ref: EntityRef; level: number; active: boolean; heatRadiusMetres: number; protection: 'pending-opening-settlement' | 'active' | 'expired' };
    buildings: readonly { id: Id; name: string; status: string }[];
  };
  inventory: {
    inspectableContainers: readonly { containerId: Id; label: string; kind: 'territory_supply' | 'carried_bag' }[];
    containers: readonly { id: Id; label: string; slots: number; items: readonly { itemId: Id; label: string; quantity: number }[] }[];
  };
  units: readonly { id: Id; name: string; creationRoute: string }[];
  jobs: readonly { id: Id; status: string }[];
  visibleMap: VisibleMap;
  journal: readonly { sequence: number; category: string; title: string; text: string }[];
};

export type GameState = {
  schemaVersion: typeof CONTRACT_SCHEMA_VERSION;
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
    };
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
      protectedThroughElapsedMs: number;
      protectionEventId: Id;
      protectionStatus: 'pending_opening_settlement' | 'active' | 'expired';
    };
    lordHouseId: Id;
    supplyContainerId: Id;
    tombId: Id;
    tomb: {
      deathQi: { current: number; capacity: number; refillAtWorldTime: string };
      queue: readonly TombQueueEntry[];
      output: { formTier: number; grade: string; level: number; xp: number; faction: string; hero: boolean; loyalty: string; xpMirrorEligible: boolean; baseLaborRateWuPerHour: number };
    };
    repaired: boolean;
  };
  inventory: { containers: readonly InventoryContainerState[] };
  ownedUnits: readonly PlayerUnitState[];
  buildings: readonly BuildingState[];
  jobs: readonly RuntimeJobState[];
  travel: { activeOrderId: Id | null; routeId: Id | null };
  exploration: { exploredGeometry: readonly { id: Id; kind: 'circle' | 'polygon'; points: readonly CoordinateMm[] }[]; searchHistory: readonly { searchId: Id; startedAtElapsedMs: number; status: string }[] };
  playerKnowledge: {
    knownSiteIds: readonly Id[];
    knownChestIds: readonly Id[];
    knownLairIds: readonly Id[];
    knownResourceIds: readonly Id[];
    knownRouteIds: readonly Id[];
    careerCardObserved: boolean;
    lastSeenByEntity: Readonly<Record<string, { observedAtElapsedMs: number; knowledge: KnowledgeStatus }>>;
    lastInspectedEntityIds: readonly Id[];
  };
  fieldChestStates: readonly FieldChestLifecycleState[];
  corpses: readonly CorpseState[];
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
  | 'move'
  | 'survey'
  | 'search'
  | 'harvest'
  | 'open_cache'
  | 'repair'
  | 'build'
  | 'craft'
  | 'revive'
  | 'equip'
  | 'attack'
  | 'shop_transaction';

export type CommandPayloadByType = {
  inspect_entity: { entity: EntityRef };
  inspect_starter_container: { containerId: Id };
  inspect_career_card: Record<never, never>;
  activate_career_card: { cardId: Id };
  set_clock_speed: { speed: 'paused' | '1x' | '2x' | '5x' };
  advance_to_boundary: { boundaryId: Id };
  enqueue_tomb: { blueprintId: Id };
  move: { actorId: Id; destinationId: Id };
  survey: { actorId: Id; targetId: Id };
  search: { actorId: Id; targetId: Id; searchType: string };
  harvest: { actorId: Id; resourceId: Id; materialId: Id };
  open_cache: { actorId: Id; chestId: Id };
  repair: { actorId: Id; buildingId: Id };
  build: { actorId: Id; blueprintId: Id; siteId: Id };
  craft: { actorId: Id; recipeId: Id };
  revive: { actorId: Id; corpseId: Id };
  equip: { unitId: Id; itemId: Id; slotId: Id };
  attack: { actorIds: readonly Id[]; targetId: Id };
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
  'advance_to_boundary', 'enqueue_tomb', 'move', 'survey', 'search', 'harvest',
  'open_cache', 'repair', 'build', 'craft', 'revive', 'equip', 'attack', 'shop_transaction',
]);

const payloadFields: Readonly<Record<CommandType, readonly string[]>> = {
  inspect_entity: ['entity'],
  inspect_starter_container: ['containerId'],
  inspect_career_card: [],
  activate_career_card: ['cardId'],
  set_clock_speed: ['speed'],
  advance_to_boundary: ['boundaryId'],
  enqueue_tomb: ['blueprintId'],
  move: ['actorId', 'destinationId'],
  survey: ['actorId', 'targetId'],
  search: ['actorId', 'targetId', 'searchType'],
  harvest: ['actorId', 'resourceId', 'materialId'],
  open_cache: ['actorId', 'chestId'],
  repair: ['actorId', 'buildingId'],
  build: ['actorId', 'blueprintId', 'siteId'],
  craft: ['actorId', 'recipeId'],
  revive: ['actorId', 'corpseId'],
  equip: ['unitId', 'itemId', 'slotId'],
  attack: ['actorIds', 'targetId'],
  shop_transaction: ['offerId', 'quantity'],
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

export function validateCommandEnvelope(input: unknown): CommandValidationResult {
  if (!isRecord(input)) return issue('COMMAND_ENVELOPE_INVALID', '$', 'Expected a command envelope object.');
  const envelopeFields = ['schemaVersion', 'saveId', 'commandId', 'expectedRevision', 'type', 'payload'];
  for (const key of Object.keys(input)) {
    if (!envelopeFields.includes(key)) return issue('COMMAND_ENVELOPE_FIELD_UNKNOWN', `$.${key}`, 'Command envelopes contain only the registered fields.');
  }
  if (input.schemaVersion !== CONTRACT_SCHEMA_VERSION) return issue('COMMAND_SCHEMA_UNSUPPORTED', '$.schemaVersion', 'Unsupported command schema version.');
  for (const key of ['saveId', 'commandId'] as const) {
    if (typeof input[key] !== 'string' || input[key].trim() === '') return issue('COMMAND_ENVELOPE_INVALID', `$.${key}`, 'Expected a non-empty string.');
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
  for (const key of Object.keys(payload)) {
    if (!required.includes(key)) return issue('COMMAND_PAYLOAD_FIELD_UNKNOWN', `$.payload.${key}`, 'Command payload contains an unregistered field.');
  }
  if (input.type === 'inspect_entity' && !validEntityRef(payload.entity)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.entity', 'Expected a registered entity reference.');
  }
  if (input.type === 'set_clock_speed' && !['paused', '1x', '2x', '5x'].includes(String(payload.speed))) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.speed', 'Expected one of paused, 1x, 2x or 5x.');
  }
  if (input.type === 'attack' && (!Array.isArray(payload.actorIds) || payload.actorIds.length === 0 || payload.actorIds.some(id => typeof id !== 'string' || id.length === 0))) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.actorIds', 'Expected one or more actor IDs.');
  }
  if (input.type === 'shop_transaction' && (!Number.isSafeInteger(payload.quantity) || Number(payload.quantity) < 1)) {
    return issue('COMMAND_PAYLOAD_INVALID', '$.payload.quantity', 'Expected a positive integer quantity.');
  }
  for (const key of required.filter(field => field !== 'entity' && field !== 'actorIds' && field !== 'quantity')) {
    if (typeof payload[key] !== 'string' || String(payload[key]).trim() === '') {
      return issue('COMMAND_PAYLOAD_INVALID', `$.payload.${key}`, 'Expected a non-empty string.');
    }
  }
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
