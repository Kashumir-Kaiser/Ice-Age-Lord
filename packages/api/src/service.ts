import { randomBytes, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { ApiErrorCode, BackupEnvelope, CheckpointSummary, CreateSaveRequest, PlayerEvent, SaveSummary } from '../../contracts/src/api.ts';
import { parseCreateSaveRequest } from '../../contracts/src/api.ts';
import type { CommandEnvelope, CommandEvent, CommandReceipt, GameState, PlayerView, WorldDefinition } from '../../contracts/src/index.ts';
import { GAME_STATE_SCHEMA_VERSION, validateCommandEnvelope } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { CONTENT_VERSION, RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';
import { createNewGame } from '../../sim/src/initializer.ts';
import { previewCommand, reduceCommand } from '../../sim/src/reducer.ts';
import { projectPlayerView } from '../../sim/src/view.ts';
import { advanceTo, DAY_MS, HOUR_MS, MINUTE_MS, nextMidnightAfter, TOMB_STANDARD_BLUEPRINT_ID, TOMB_STANDARD_DURATION_MS, TOMB_STANDARD_RECIPE_ID, type StopCondition } from '../../sim/src/time.ts';
import { RepositoryError, SqliteRepository } from '../../storage/src/repository.ts';
import { ApiProblem, fromRepositoryError } from './errors.ts';

const ownerId = 'local-owner';
const MAX_BACKUP_ROWS = 10_000;
const MAX_BACKUP_CHECKPOINTS = 50;
const DEFAULT_CLOCK_LEASE_MS = 5_000;
const DEFAULT_CLOCK_TICK_MS = 250;
const LEGACY_README_SHA256 = '6e30d099e63a8253134d9de87d495053744ad868cde4ff468ba4bdc31d53c26b';

type ClockDriver = {
  sessionToken: string;
  driverId: string;
  lastHeartbeatMonoMs: number;
  lastTickMonoMs: number;
  targetSimElapsedMs: number;
  fractionalSimMs: number;
  timer: ReturnType<typeof setInterval> | null;
  isTicking: boolean;
};

export type ClockRuntimeOptions = {
  monotonicNow?: () => number;
  leaseMs?: number;
  tickIntervalMs?: number;
  timersEnabled?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 160): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isSafeInt(value: unknown, min = 0): value is number {
  return Number.isSafeInteger(value) && Number(value) >= min;
}

function checkIsoUtc(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function apiProblem(code: ApiErrorCode, status: number, message: string, displayText: string, currentRevision?: number): ApiProblem {
  return new ApiProblem(status, code, message, displayText, currentRevision);
}

function nextDailyBoundary(elapsed: number, offset = 0): number {
  return offset + (Math.floor((elapsed - offset) / DAY_MS) + 1) * DAY_MS;
}

function systemOnlyRevisionAdvance(state: GameState, expectedRevision: number): boolean {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision >= state.revision) return false;
  const intervening = state.receipts.filter(item => item.receipt.revision > expectedRevision);
  return intervening.length > 0 && intervening.every(item => item.receipt.accepted
    && item.receipt.code === 'SYSTEM_TRANSITION_COMMITTED');
}

function validateBackupState(value: unknown, world: WorldDefinition): GameState {
  if (!isRecord(value) || !Array.isArray(value.receipts) || value.receipts.length !== 0
    || !isNonEmptyString(value.saveId) || !isNonEmptyString(value.campaignId) || !isNonEmptyString(value.seed)
    || value.player === null || typeof value.player !== 'object' || !isRecord(value.player)
    || !isRecord(value.playerKnowledge) || !Array.isArray(value.playerKnowledge.lastInspectedEntityIds)
    || !value.playerKnowledge.lastInspectedEntityIds.every(id => isNonEmptyString(id))
    || !isRecord(value.inventory) || !Array.isArray(value.inventory.containers)
    || !isRecord(value.bagSeed)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup save state is malformed.', 'Bản sao lưu không hợp lệ.');
  }
  const candidate = value as unknown as GameState;
  const acceptedSourceHashes = [
    canonicalStateHash(world.lockedSourceHashes),
    canonicalStateHash({ ...world.lockedSourceHashes, 'README.md': LEGACY_README_SHA256 }),
  ];
  if (candidate.schemaVersion !== GAME_STATE_SCHEMA_VERSION || candidate.worldPackageId !== world.id
    || candidate.contentVersion !== world.contentVersion || candidate.rulesetVersion !== RULESET_VERSION
    || !acceptedSourceHashes.includes(candidate.contentSourceSetSha256)
    || !isSafeInt(candidate.revision) || !isSafeInt(candidate.lastEventSequence)
    || candidate.revision > candidate.lastEventSequence || !isSafeInt(candidate.simElapsedMs)) {
    throw new ApiProblem(400, 'CONTENT_MISMATCH', 'The backup schema or pinned content version is incompatible.', 'Phiên bản nội dung của bản sao lưu không tương thích.');
  }
  if (candidate.playerKnowledge.lastInspectedEntityIds.some(id => id !== 'site:SITE-LL01-000')) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an unsupported inspection record.', 'Bản sao lưu không hợp lệ.');
  }

  const baseline = createNewGame({
    saveId: candidate.saveId,
    campaignId: candidate.campaignId,
    soulId: candidate.player.id,
    worldPackageId: world.id,
    rulesetVersion: candidate.rulesetVersion,
    contentVersion: candidate.contentVersion,
    seed: candidate.seed,
  }, world);
  if (!isRecord(candidate.clockControl) || !isRecord(candidate.timeBoundaries) || !isRecord(candidate.survival)
    || !isRecord(candidate.territory) || !isRecord(candidate.territory.survivalFire) || !isRecord(candidate.territory.tomb)
    || !isRecord(candidate.player.mana) || !Array.isArray(candidate.ownedUnits) || !Array.isArray(candidate.jobs)
    || !Array.isArray(candidate.calendar)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup is missing Stage 04 state.', 'Bản sao lưu thiếu trạng thái Stage 04.');
  }
  const incomingContainers = candidate.inventory.containers;
  if (incomingContainers.length !== baseline.inventory.containers.length
    || incomingContainers.some(container => !isRecord(container) || !isNonEmptyString(container.id) || typeof container.observed !== 'boolean')) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup inventory does not match the Stage 03 schema.', 'Bản sao lưu không hợp lệ.');
  }
  const bagObserved = incomingContainers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.observed;
  const supplyObserved = incomingContainers.find(container => container.id === 'LL-CNT-SUPPLY-01')?.observed;
  if (typeof bagObserved !== 'boolean' || supplyObserved !== false || candidate.bagSeed.inspected !== bagObserved
    || typeof candidate.playerKnowledge.careerCardObserved !== 'boolean') {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid inspection state.', 'Bản sao lưu không hợp lệ.');
  }
  baseline.playerKnowledge = {
    ...baseline.playerKnowledge,
    careerCardObserved: candidate.playerKnowledge.careerCardObserved,
    lastInspectedEntityIds: [...candidate.playerKnowledge.lastInspectedEntityIds],
  };
  baseline.bagSeed = { ...baseline.bagSeed, inspected: bagObserved };

  const normalized = structuredClone(candidate) as GameState;
  normalized.revision = 0;
  normalized.lastEventSequence = 0;
  normalized.simElapsedMs = 0;
  normalized.clockControl = baseline.clockControl;
  normalized.timeBoundaries = baseline.timeBoundaries;
  normalized.survival = baseline.survival;
  normalized.player.mana = baseline.player.mana;
  normalized.territory.survivalFire = baseline.territory.survivalFire;
  normalized.territory.tomb = baseline.territory.tomb;
  normalized.ownedUnits = baseline.ownedUnits;
  normalized.jobs = baseline.jobs;
  normalized.calendar = baseline.calendar;
  normalized.playerKnowledge = {
    ...baseline.playerKnowledge,
    careerCardObserved: candidate.playerKnowledge.careerCardObserved,
    lastInspectedEntityIds: [...candidate.playerKnowledge.lastInspectedEntityIds],
  };
  baseline.inventory = {
    containers: baseline.inventory.containers.map(container => ({
      ...container,
      observed: incomingContainers.find(candidateContainer => candidateContainer.id === container.id)?.observed ?? false,
    })),
  };
  normalized.inventory = {
    containers: normalized.inventory.containers.map(container => ({
      ...container,
      observed: incomingContainers.find(candidateContainer => isRecord(candidateContainer) && candidateContainer.id === container.id)?.observed === true,
    })),
  };
  normalized.bagSeed = { ...baseline.bagSeed, inspected: bagObserved };
  if (canonicalStateHash(baseline) !== canonicalStateHash(normalized)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup changes immutable opening state.', 'Bản sao lưu đã thay đổi trạng thái mở đầu bất biến.');
  }

  const elapsed = candidate.simElapsedMs;
  const expectedExpiry = elapsed < 144 * HOUR_MS ? 144 * HOUR_MS : null;
  const expectedBoundaries = {
    nextHourlySettlementAtElapsedMs: (Math.floor(elapsed / HOUR_MS) + 1) * HOUR_MS,
    nextMidnightAtElapsedMs: nextMidnightAfter(elapsed),
    nextDailySettlementAtElapsedMs: nextDailyBoundary(elapsed),
    nextSunsetAtElapsedMs: nextDailyBoundary(elapsed, 9.5 * HOUR_MS),
    nextTwilightEndAtElapsedMs: nextDailyBoundary(elapsed, 10 * HOUR_MS),
    nextDawnAtElapsedMs: nextDailyBoundary(elapsed),
    protectionExpiryAtElapsedMs: expectedExpiry,
  };
  if (canonicalStateHash(candidate.timeBoundaries) !== canonicalStateHash(expectedBoundaries)
    || candidate.player.mana.current !== candidate.player.mana.max || candidate.player.mana.max !== baseline.player.mana.max
    || candidate.player.mana.lastSettledAtElapsedMs !== elapsed || candidate.player.mana.baseRegenPerSecond !== 0.45
    || candidate.survival.coldStatus !== 'weather_unresolved' || candidate.survival.environment !== null
    || candidate.survival.coldLoadMicro !== 0 || candidate.survival.coldLoadRemainder !== 0
    || candidate.survival.blocker !== 'OPENING_WEATHER_RECORD_NOT_SEEDED' || candidate.survival.hungerState !== 'FED') {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid time or survival state.', 'Trạng thái thời gian hoặc sinh tồn trong bản sao lưu không hợp lệ.');
  }
  const fire = candidate.territory.survivalFire;
  const expectedProtection = elapsed >= 144 * HOUR_MS ? 'expired' : 'active';
  if (fire.fuelRemaining !== null || fire.fuelKnowledge !== 'state_unobserved' || fire.nextFuelConsumptionAtElapsedMs !== null
    || fire.fuelBlocker !== 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED' || fire.protectionStatus !== expectedProtection
    || candidate.clockControl.stopCondition === undefined
    || !['paused', 'running'].includes(candidate.clockControl.status)
    || !['paused', '1x', '2x', '5x', 'custom'].includes(candidate.clockControl.selection)
    || !['none', 'next_completion', 'danger'].includes(candidate.clockControl.stopCondition)
    || !isSafeInt(candidate.clockControl.speedPermille)
    || (candidate.clockControl.status === 'paused' && (candidate.clockControl.selection !== 'paused' || candidate.clockControl.speedPermille !== 0))
    || (candidate.clockControl.status === 'running' && (candidate.clockControl.selection === 'paused' || candidate.clockControl.speedPermille < 100 || candidate.clockControl.speedPermille > 3_600_000))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains an invalid clock or fire state.', 'Trạng thái đồng hồ hoặc lửa trong bản sao lưu không hợp lệ.');
  }

  const tomb = candidate.territory.tomb;
  const queue = tomb.queue;
  if (!Array.isArray(queue) || tomb.deathQi.capacity !== 20 || !isSafeInt(tomb.deathQi.current)
    || tomb.deathQi.current > tomb.deathQi.capacity || tomb.deathQi.nextRefillAtElapsedMs !== expectedBoundaries.nextMidnightAtElapsedMs
    || canonicalStateHash(tomb.output) !== canonicalStateHash(baseline.territory.tomb.output)
    || new Set(queue.map(entry => entry.id)).size !== queue.length) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains invalid Tomb state.', 'Trạng thái Mộ trong bản sao lưu không hợp lệ.');
  }
  const validQueue = queue.every(entry => {
    if (entry.blueprintId !== TOMB_STANDARD_BLUEPRINT_ID || entry.recipeId !== TOMB_STANDARD_RECIPE_ID
      || !isNonEmptyString(entry.id) || !isNonEmptyString(entry.outputUnitId) || !isSafeInt(entry.enqueuedAtElapsedMs)
      || entry.enqueuedAtElapsedMs > elapsed || !isSafeInt(entry.progressCarryMs)) return false;
    if (entry.status === 'active') return entry.reservedDeathQi === 1 && Number.isSafeInteger(entry.slotId) && (entry.slotId as number) >= 0 && (entry.slotId as number) < 2
      && isSafeInt(entry.startedAtElapsedMs) && isSafeInt(entry.completesAtElapsedMs) && entry.startedAtElapsedMs <= elapsed
      && entry.completesAtElapsedMs > elapsed && entry.completesAtElapsedMs - entry.startedAtElapsedMs === TOMB_STANDARD_DURATION_MS;
    if (entry.status === 'completed') return entry.reservedDeathQi === 1 && entry.slotId === null && isSafeInt(entry.startedAtElapsedMs)
      && isSafeInt(entry.completesAtElapsedMs) && entry.completesAtElapsedMs <= elapsed
      && entry.completesAtElapsedMs - entry.startedAtElapsedMs === TOMB_STANDARD_DURATION_MS;
    return (entry.status === 'queued' || entry.status === 'blocked' || entry.status === 'cancelled')
      && entry.reservedDeathQi === 0 && entry.slotId === null && entry.startedAtElapsedMs === null && entry.completesAtElapsedMs === null;
  });
  const activeSlots = queue.filter(entry => entry.status === 'active').map(entry => entry.slotId);
  const completedUnits = queue.filter(entry => entry.status === 'completed').map(entry => entry.outputUnitId);
  if (!validQueue || new Set(activeSlots).size !== activeSlots.length || new Set(completedUnits).size !== completedUnits.length
    || candidate.ownedUnits.length !== completedUnits.length
    || completedUnits.some(unitId => !candidate.ownedUnits.some(unit => unit.id === unitId && unit.creationRoute === 'TOMB_QUEUE'
      && unit.xpMirrorEligible === false && unit.level === tomb.output.level && unit.xp === tomb.output.xp
      && unit.sourceStats.formTier === tomb.output.formTier && unit.sourceStats.grade === tomb.output.grade
      && unit.sourceStats.hero === false && unit.baseLaborRateWuPerHour === tomb.output.baseLaborRateWuPerHour))
    || candidate.jobs.some(job => !queue.some(entry => entry.id === job.id && (entry.status === 'active' || entry.status === 'completed')))
    || queue.some(entry => (entry.status === 'active' || entry.status === 'completed') && !candidate.jobs.some(job => job.id === entry.id))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The Tomb queue and roster do not agree.', 'Hàng đợi Mộ và quân lực trong bản sao lưu không khớp.');
  }

  const ev00 = candidate.calendar.find(event => event.id === 'EV00-SAFE-FIRE');
  if (!ev00 || ev00.status !== expectedProtection || ev00.openReceiptSequence !== 1
    || (expectedProtection === 'expired' && !isSafeInt(ev00.resolutionReceiptSequence, 1))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The opening protection calendar row is inconsistent.', 'Sự kiện bảo hộ mở đầu trong lịch không nhất quán.');
  }
  return candidate;
}

function validateBackupReceipt(value: unknown): value is { commandId: string; requestSha256: string; receipt: CommandReceipt; createdAtUtc: string } {
  if (!isRecord(value) || !isNonEmptyString(value.commandId) || typeof value.requestSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(value.requestSha256) || !checkIsoUtc(value.createdAtUtc) || !isRecord(value.receipt)) return false;
  const receipt = value.receipt;
  return receipt.commandId === value.commandId && typeof receipt.accepted === 'boolean' && isSafeInt(receipt.revision)
    && (receipt.eventSequence === null || isSafeInt(receipt.eventSequence, 1))
    && isNonEmptyString(receipt.code, 100) && isNonEmptyString(receipt.message, 500)
    && (receipt.accepted || receipt.eventSequence === null);
}

function validateBackupEvent(value: unknown, index: number, saveId: string, receipts: Map<string, CommandReceipt>): boolean {
  if (!isRecord(value) || value.eventSequence !== index + 1 || value.eventId !== `${saveId}:event:${String(index + 1).padStart(12, '0')}`
    || !isSafeInt(value.occurredAtElapsedMs) || !isNonEmptyString(value.causalCommandId)
    || value.payloadSchemaVersion !== 1 || !isNonEmptyString(value.rulesetVersion) || !isNonEmptyString(value.contentVersion)
    || !isNonEmptyString(value.eventType) || !isRecord(value.payload) || !isRecord(value.playerEvent)) return false;
  const receipt = receipts.get(value.causalCommandId);
  if (!receipt || !receipt.accepted || receipt.eventSequence === null || value.eventSequence > receipt.eventSequence) return false;
  const publicEvent = value.playerEvent;
  if (publicEvent.sequence !== value.eventSequence || publicEvent.eventId !== value.eventId
    || !isNonEmptyString(publicEvent.type, 80) || !isNonEmptyString(publicEvent.category, 80)
    || !isNonEmptyString(publicEvent.title, 180) || !isNonEmptyString(publicEvent.text, 500)) return false;
  const systemEventTypes = new Set([
    'clock_speed_changed', 'clock_stop_condition_set', 'clock_paused_after_restart',
    'clock_paused_after_lease_expired', 'clock_paused_on_shutdown', 'clock_paused_on_stop_condition',
    'simulation_time_advanced', 'simulation_hour_settled', 'world_day_started', 'world_sunset',
    'world_night_started', 'world_dawn', 'opening_protection_started', 'opening_protection_expired',
    'cold_warning_changed', 'cold_danger_reached', 'fire_fuel_consumed', 'survival_fire_extinguished',
    'fire_refuelled', 'survival_fire_lit', 'tomb_job_queued', 'tomb_job_started', 'tomb_job_blocked',
    'tomb_job_cancelled', 'tomb_unit_completed', 'tomb_death_qi_refilled',
  ]);
  if (value.eventType === 'career_card_inspected') return Object.keys(value.payload).length === 0;
  if (value.eventType === 'starter_container_inspected') return value.payload.containerId === 'LL-CNT-CARRIED-FOOD-BAG-01' && value.payload.containerKind === 'carried_bag';
  if (value.eventType === 'known_entity_inspected') {
    const entity = value.payload.entity;
    return isRecord(entity) && entity.type === 'site' && entity.id === 'SITE-LL01-000';
  }
  if (!systemEventTypes.has(String(value.eventType))) return false;
  return Object.values(value.payload).every(item => item === null || ['string', 'number', 'boolean'].includes(typeof item));
}

function validateBackup(value: unknown, world: WorldDefinition): BackupEnvelope {
  if (!isRecord(value) || value.format !== 'ICE-AGE-LORD-SAVE-BACKUP' || value.version !== 1
    || !checkIsoUtc(value.exportedAtUtc) || !isRecord(value.save) || !Array.isArray(value.receipts)
    || !Array.isArray(value.events) || !Array.isArray(value.checkpoints) || typeof value.stateSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(value.stateSha256)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup envelope is malformed or unsupported.', 'Bản sao lưu không hợp lệ.');
  }
  if (value.receipts.length > MAX_BACKUP_ROWS || value.events.length > MAX_BACKUP_ROWS || value.checkpoints.length > MAX_BACKUP_CHECKPOINTS) {
    throw new ApiProblem(413, 'PAYLOAD_TOO_LARGE', 'The backup contains too many records.', 'Bản sao lưu vượt giới hạn kích thước.');
  }

  const state = validateBackupState(value.state, world);
  if (canonicalStateHash(state) !== value.stateSha256) throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup state checksum does not match.', 'Bản sao lưu không hợp lệ.');
  const save = value.save;
  if (!isNonEmptyString(save.saveId) || save.saveId !== state.saveId || !isNonEmptyString(save.slotName, 80)
    || !isSafeInt(save.revision) || save.revision !== state.revision || !isSafeInt(save.lastEventSequence)
    || save.lastEventSequence !== state.lastEventSequence || save.worldPackageId !== state.worldPackageId
    || save.contentVersion !== state.contentVersion || save.rulesetVersion !== state.rulesetVersion
    || !checkIsoUtc(save.createdAtUtc) || !checkIsoUtc(save.updatedAtUtc)
    || !(save.forkedFrom === null || (isRecord(save.forkedFrom) && isNonEmptyString(save.forkedFrom.saveId) && isNonEmptyString(save.forkedFrom.checkpointId)))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup save metadata does not match its state.', 'Bản sao lưu không hợp lệ.');
  }

  const receiptMap = new Map<string, CommandReceipt>();
  for (const item of value.receipts) {
    if (!validateBackupReceipt(item) || receiptMap.has(item.commandId) || item.receipt.revision > state.revision) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup receipt ledger is malformed.', 'Bản sao lưu không hợp lệ.');
    }
    receiptMap.set(item.commandId, item.receipt);
  }
  if (value.events.length !== state.lastEventSequence || value.events.some((event, index) => !validateBackupEvent(event, index, state.saveId, receiptMap))) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup event ledger is malformed.', 'Bản sao lưu không hợp lệ.');
  }
  for (const receipt of receiptMap.values()) {
    const relatedEvents = value.events.filter(event => isRecord(event) && event.causalCommandId === receipt.commandId);
    const maxSequence = relatedEvents.reduce((max, event) => isRecord(event) && isSafeInt(event.eventSequence) ? Math.max(max, event.eventSequence) : max, 0);
    if ((receipt.eventSequence === null && relatedEvents.length > 0)
      || (receipt.eventSequence !== null && (maxSequence !== receipt.eventSequence
        || !relatedEvents.some(event => isRecord(event) && event.eventSequence === receipt.eventSequence)))) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup receipt does not match its event.', 'Bản sao lưu không hợp lệ.');
    }
  }

  for (const checkpoint of value.checkpoints) {
    if (!isRecord(checkpoint) || checkpoint.saveId !== state.saveId || !isNonEmptyString(checkpoint.checkpointId)
      || !isNonEmptyString(checkpoint.label, 80) || !isSafeInt(checkpoint.revision) || !isSafeInt(checkpoint.eventSequence)
      || !checkIsoUtc(checkpoint.createdAtUtc) || typeof checkpoint.stateSha256 !== 'string'
      || !/^[a-f0-9]{64}$/.test(checkpoint.stateSha256)) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'A checkpoint in the backup is malformed.', 'Bản sao lưu không hợp lệ.');
    }
    const checkpointState = validateBackupState(checkpoint.state, world);
    if (checkpointState.saveId !== state.saveId || checkpointState.revision !== checkpoint.revision
      || checkpointState.lastEventSequence !== checkpoint.eventSequence || canonicalStateHash(checkpointState) !== checkpoint.stateSha256
      || checkpointState.revision > state.revision) {
      throw new ApiProblem(400, 'BACKUP_INVALID', 'A checkpoint in the backup failed validation.', 'Bản sao lưu không hợp lệ.');
    }
  }
  const checkpointIds = value.checkpoints.map(checkpoint => isRecord(checkpoint) ? checkpoint.checkpointId : null);
  if (new Set(checkpointIds).size !== checkpointIds.length) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'Checkpoint IDs must be unique within a backup.', 'Bản sao lưu không hợp lệ.');
  }
  return value as unknown as BackupEnvelope;
}

export class GameApplicationService {
  private readonly commandQueues = new Map<string, Promise<void>>();
  private readonly clockDrivers = new Map<string, ClockDriver>();
  private readonly monotonicNow: () => number;
  private readonly clockLeaseMs: number;
  private readonly clockTickIntervalMs: number;
  private readonly timersEnabled: boolean;
  readonly repository: SqliteRepository;
  readonly world: WorldDefinition;

  constructor(repository: SqliteRepository, world: WorldDefinition = ACTIVE_WORLD_PACKAGE, clockOptions: ClockRuntimeOptions = {}) {
    this.repository = repository;
    this.world = world;
    this.monotonicNow = clockOptions.monotonicNow ?? (() => performance.now());
    this.clockLeaseMs = clockOptions.leaseMs ?? DEFAULT_CLOCK_LEASE_MS;
    this.clockTickIntervalMs = clockOptions.tickIntervalMs ?? DEFAULT_CLOCK_TICK_MS;
    this.timersEnabled = clockOptions.timersEnabled ?? true;
    this.pauseRunningClocksOnStartup();
  }

  private pauseRunningClocksOnStartup(): void {
    for (const summary of this.repository.listSaves(ownerId)) {
      let state = this.repository.loadSave(ownerId, summary.saveId).state;
      if (state.territory.survivalFire.protectionStatus === 'pending_opening_settlement') {
        state = this.persistSystemEvents(summary.saveId, current => {
          const openSequence = current.lastEventSequence + 1;
          return {
            state: {
              ...current,
              territory: { ...current.territory, survivalFire: { ...current.territory.survivalFire, protectionStatus: 'active' } },
              calendar: current.calendar.map(event => event.id === current.territory.survivalFire.protectionEventId
                ? { ...event, status: 'active', openReceiptSequence: openSequence }
                : event),
            },
            events: [{ type: 'opening_protection_started', occurredAtElapsedMs: current.simElapsedMs, payload: { eventId: current.territory.survivalFire.protectionEventId, expiresAtElapsedMs: current.territory.survivalFire.protectedThroughElapsedMs } }],
          };
        }).state;
      }
      if (state.clockControl.status !== 'running') continue;
      this.persistSystemEvents(summary.saveId, current => ({
        state: {
          ...current,
          clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' },
        },
        events: [{ type: 'clock_paused_after_restart', occurredAtElapsedMs: current.simElapsedMs, payload: { policy: 'pause_on_restart' } }],
      }));
    }
  }

  private persistSystemEvents(saveId: string, transition: (state: GameState) => { state: GameState; events: readonly Omit<CommandEvent, 'sequence'>[] }) {
    return this.repository.commitSystemTransition({
      ownerId,
      saveId,
      transition: state => {
        const result = transition(state);
        return {
          state: result.state,
          events: result.events.map((event, index) => ({ ...event, sequence: state.lastEventSequence + index + 1 })),
        };
      },
      projectPlayerEvent: (event, eventId) => this.projectSystemPlayerEvent(event, eventId),
    });
  }

  private driverStatus(saveId: string, state: GameState, sessionToken?: string, driverId?: string) {
    const driver = this.clockDrivers.get(saveId);
    if (!driver) return { driver: 'unclaimed' as const, catchingUp: false, targetSimElapsedMs: state.simElapsedMs, leaseRemainingMs: 0 };
    const leaseRemainingMs = Math.max(0, driver.lastHeartbeatMonoMs + this.clockLeaseMs - this.monotonicNow());
    const active = driver.sessionToken === sessionToken && driver.driverId === driverId && leaseRemainingMs > 0;
    return {
      driver: active ? 'active' as const : 'observing' as const,
      catchingUp: driver.targetSimElapsedMs > state.simElapsedMs,
      targetSimElapsedMs: Math.max(state.simElapsedMs, driver.targetSimElapsedMs),
      leaseRemainingMs,
    };
  }

  private projectView(state: GameState, sessionToken?: string, driverId?: string): PlayerView {
    return { ...projectPlayerView(state, this.world), clockStatus: this.driverStatus(state.saveId, state, sessionToken, driverId) };
  }

  private accumulateRealtime(driver: ClockDriver, state: GameState, untilMonoMs: number): void {
    const until = Math.max(driver.lastTickMonoMs, untilMonoMs);
    const elapsedRealMs = until - driver.lastTickMonoMs;
    driver.lastTickMonoMs = until;
    if (state.clockControl.status !== 'running' || elapsedRealMs <= 0) {
      if (state.clockControl.status !== 'running') {
        driver.targetSimElapsedMs = state.simElapsedMs;
        driver.fractionalSimMs = 0;
      }
      return;
    }
    const scaled = elapsedRealMs * state.clockControl.speedPermille / 1000 + driver.fractionalSimMs;
    const wholeMs = Math.floor(scaled);
    driver.fractionalSimMs = scaled - wholeMs;
    driver.targetSimElapsedMs = Math.max(driver.targetSimElapsedMs, state.simElapsedMs) + wholeMs;
  }

  private settleClockTarget(saveId: string, driver: ClockDriver): { state: GameState; caughtUp: boolean } {
    const before = this.repository.loadSave(ownerId, saveId).state;
    if (before.clockControl.status !== 'running' || driver.targetSimElapsedMs <= before.simElapsedMs) {
      driver.targetSimElapsedMs = before.simElapsedMs;
      return { state: before, caughtUp: true };
    }
    let caughtUp = true;
    const result = this.persistSystemEvents(saveId, state => {
      const advanced = advanceTo(state, Math.max(state.simElapsedMs, driver.targetSimElapsedMs), {
        stopCondition: state.clockControl.stopCondition as StopCondition,
      });
      const events: Omit<CommandEvent, 'sequence'>[] = [...advanced.events];
      if (advanced.stoppedBy) {
        advanced.state.clockControl = { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' };
        events.push({ type: 'clock_paused_on_stop_condition', occurredAtElapsedMs: advanced.state.simElapsedMs, payload: { stopCondition: advanced.stoppedBy } });
      } else if (advanced.state.simElapsedMs > state.simElapsedMs && events.length === 0) {
        events.push({ type: 'simulation_time_advanced', occurredAtElapsedMs: advanced.state.simElapsedMs, payload: { fromElapsedMs: state.simElapsedMs, toElapsedMs: advanced.state.simElapsedMs } });
      }
      caughtUp = advanced.caughtUp;
      return { state: advanced.state, events };
    });
    driver.targetSimElapsedMs = result.state.clockControl.status === 'paused'
      ? result.state.simElapsedMs
      : Math.max(driver.targetSimElapsedMs, result.state.simElapsedMs);
    return { state: result.state, caughtUp: caughtUp || result.state.clockControl.status === 'paused' };
  }

  private clearDriverTimer(driver: ClockDriver): void {
    if (driver.timer) clearInterval(driver.timer);
    driver.timer = null;
  }

  private ensureDriverTimer(saveId: string, driver: ClockDriver, state: GameState): void {
    if (!this.timersEnabled || state.clockControl.status !== 'running' || driver.timer) return;
    driver.timer = setInterval(() => { void this.tickClock(saveId).catch(() => undefined); }, this.clockTickIntervalMs);
    driver.timer.unref?.();
  }

  private pausePersistedClock(saveId: string, reason: 'clock_paused_after_lease_expired' | 'clock_paused_on_shutdown'): GameState {
    const result = this.persistSystemEvents(saveId, state => state.clockControl.status !== 'running'
      ? { state, events: [] }
      : {
        state: { ...state, clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' } },
        events: [{ type: reason, occurredAtElapsedMs: state.simElapsedMs, payload: { policy: reason } }],
      });
    return result.state;
  }

  private async inSaveQueue<T>(saveId: string, work: () => T | Promise<T>): Promise<Awaited<T>> {
    const previous = this.commandQueues.get(saveId) ?? Promise.resolve();
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.catch(() => undefined).then(() => gate);
    this.commandQueues.set(saveId, tail);
    await previous.catch(() => undefined);
    try { return await work() as Awaited<T>; }
    finally {
      release();
      if (this.commandQueues.get(saveId) === tail) {
        await tail;
        if (this.commandQueues.get(saveId) === tail) this.commandQueues.delete(saveId);
      }
    }
  }

  private async tickClock(saveId: string): Promise<void> {
    const driver = this.clockDrivers.get(saveId);
    if (!driver || driver.isTicking) return;
    driver.isTicking = true;
    try {
      await this.inSaveQueue(saveId, () => {
        const now = this.monotonicNow();
        const leaseExpiry = driver.lastHeartbeatMonoMs + this.clockLeaseMs;
        const state = this.repository.loadSave(ownerId, saveId).state;
        this.accumulateRealtime(driver, state, Math.min(now, leaseExpiry));
        const settled = this.settleClockTarget(saveId, driver);
        const expired = now >= leaseExpiry;
        if (expired && settled.caughtUp) {
          const paused = this.pausePersistedClock(saveId, 'clock_paused_after_lease_expired');
          this.clearDriverTimer(driver);
          if (this.clockDrivers.get(saveId) === driver) this.clockDrivers.delete(saveId);
          driver.targetSimElapsedMs = paused.simElapsedMs;
        } else if (settled.state.clockControl.status !== 'running') {
          this.clearDriverTimer(driver);
        } else {
          this.ensureDriverTimer(saveId, driver, settled.state);
        }
      });
    } finally {
      driver.isTicking = false;
    }
    const state = this.repository.loadSave(ownerId, saveId).state;
    if (this.clockDrivers.get(saveId) === driver && driver.targetSimElapsedMs > state.simElapsedMs) {
      setImmediate(() => { void this.tickClock(saveId).catch(() => undefined); });
    }
  }

  async heartbeatClock(saveId: string, sessionToken: string, driverId: string) {
    if (!sessionToken || !driverId || driverId.length > 160) throw new ApiProblem(400, 'INVALID_COMMAND', 'The clock driver identity is invalid.', 'Danh tính điều khiển thời gian không hợp lệ.');
    return this.inSaveQueue(saveId, async () => {
      const now = this.monotonicNow();
      let current = this.clockDrivers.get(saveId);
      if (current && now < current.lastHeartbeatMonoMs + this.clockLeaseMs
        && (current.sessionToken !== sessionToken || current.driverId !== driverId)) {
        const state = this.repository.loadSave(ownerId, saveId).state;
        return { ...this.driverStatus(saveId, state, sessionToken, driverId), sessionTokenIsDriver: false };
      }
      if (current && now >= current.lastHeartbeatMonoMs + this.clockLeaseMs) {
        const expiry = current.lastHeartbeatMonoMs + this.clockLeaseMs;
        const oldState = this.repository.loadSave(ownerId, saveId).state;
        this.accumulateRealtime(current, oldState, expiry);
        let settled = this.settleClockTarget(saveId, current);
        while (!settled.caughtUp && settled.state.clockControl.status === 'running') {
          await new Promise<void>(resolve => setImmediate(resolve));
          settled = this.settleClockTarget(saveId, current);
        }
        this.pausePersistedClock(saveId, 'clock_paused_after_lease_expired');
        this.clearDriverTimer(current);
        current = undefined;
        this.clockDrivers.delete(saveId);
      } else if (current) {
        current.lastHeartbeatMonoMs = now;
      }
      if (!current) {
        const state = this.repository.loadSave(ownerId, saveId).state;
        current = {
          sessionToken,
          driverId,
          lastHeartbeatMonoMs: now,
          lastTickMonoMs: now,
          targetSimElapsedMs: state.simElapsedMs,
          fractionalSimMs: 0,
          timer: null,
          isTicking: false,
        };
        this.clockDrivers.set(saveId, current);
      }
      const state = this.repository.loadSave(ownerId, saveId).state;
      this.ensureDriverTimer(saveId, current, state);
      return { ...this.driverStatus(saveId, state, sessionToken, driverId), sessionTokenIsDriver: true };
    });
  }

  async settleClockBeforeCommand(saveId: string): Promise<void> {
    const driver = this.clockDrivers.get(saveId);
    if (!driver) return;
    await this.tickClock(saveId);
  }

  async shutdownClockDrivers(): Promise<void> {
    for (const [saveId, driver] of this.clockDrivers) {
      this.clearDriverTimer(driver);
      const state = this.repository.loadSave(ownerId, saveId).state;
      this.accumulateRealtime(driver, state, Math.min(this.monotonicNow(), driver.lastHeartbeatMonoMs + this.clockLeaseMs));
      let settled = this.settleClockTarget(saveId, driver);
      while (!settled.caughtUp && settled.state.clockControl.status === 'running') settled = this.settleClockTarget(saveId, driver);
      this.pausePersistedClock(saveId, 'clock_paused_on_shutdown');
    }
    this.clockDrivers.clear();
  }

  health(): { status: 'ready'; apiVersion: 1; contentVersion: string; storage: 'sqlite' } {
    return { status: 'ready', apiVersion: 1, contentVersion: this.world.contentVersion, storage: 'sqlite' };
  }

  createSave(input: unknown): { created: boolean; save: SaveSummary; view: PlayerView } {
    const body = parseCreateSaveRequest(input);
    if (!body) throw new ApiProblem(400, 'INVALID_COMMAND', 'The save creation request is invalid.', 'Thông tin tạo lượt lưu không hợp lệ.');
    const requestSha256 = canonicalStateHash(body);
    try {
      const result = this.repository.createSaveIdempotent({
        ownerId,
        creationKey: body.creationKey,
        requestSha256,
        slotName: body.slotName,
        makeState: () => createNewGame({
          saveId: randomUUID(),
          campaignId: randomUUID(),
          soulId: 'LI_LAN',
          worldPackageId: this.world.id,
          rulesetVersion: RULESET_VERSION,
          contentVersion: CONTENT_VERSION,
          seed: randomBytes(32).toString('hex'),
        }, this.world),
      });
      const initialSettlement = result.created && result.state.territory.survivalFire.protectionStatus === 'pending_opening_settlement'
        ? this.persistSystemEvents(result.state.saveId, state => {
          const openSequence = state.lastEventSequence + 1;
          return {
            state: {
              ...state,
              territory: { ...state.territory, survivalFire: { ...state.territory.survivalFire, protectionStatus: 'active' } },
              calendar: state.calendar.map(event => event.id === state.territory.survivalFire.protectionEventId
                ? { ...event, status: 'active', openReceiptSequence: openSequence }
                : event),
            },
            events: [{ type: 'opening_protection_started', occurredAtElapsedMs: 0, payload: { eventId: 'EV00-SAFE-FIRE', expiresAtElapsedMs: 144 * 60 * 60 * 1000 } }],
          };
        })
        : null;
      const state = initialSettlement?.state ?? result.state;
      return { created: result.created, save: initialSettlement?.summary ?? result.summary, view: this.projectView(state) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  listSaves(): SaveSummary[] {
    try { return this.repository.listSaves(ownerId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  loadSave(saveId: string, sessionToken?: string, driverId?: string): { state: GameState; summary: SaveSummary; view: PlayerView } {
    try {
      const result = this.repository.loadSave(ownerId, saveId);
      return { ...result, view: this.projectView(result.state, sessionToken, driverId) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  preview(saveId: string, input: unknown, sessionToken?: string, driverId?: string) {
    const loaded = this.loadSave(saveId, sessionToken, driverId);
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    if (validation.data.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    const isClockCommand = validation.data.type === 'set_clock_speed' || validation.data.type === 'advance_to_boundary';
    const availability = isClockCommand && this.driverStatus(saveId, loaded.state, sessionToken, driverId).driver !== 'active'
      ? { actionId: validation.data.type, enabled: false, reasonCode: 'CLOCK_DRIVER_BUSY', requirements: ['This tab does not own the active clock lease.'] }
      : previewCommand(loaded.state, validation.data, this.world, {
        allowSystemOnlyRevisionAdvance: isClockCommand && systemOnlyRevisionAdvance(loaded.state, validation.data.expectedRevision),
      });
    return { revision: loaded.state.revision, availability, estimate: null as null };
  }

  async executeCommand(saveId: string, input: unknown, actor?: { sessionToken: string; driverId: string }): Promise<{ receipt: CommandReceipt; revision: number; view: PlayerView }> {
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    const command: CommandEnvelope = validation.data;
    if (command.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    if ((command.type === 'set_clock_speed' || command.type === 'advance_to_boundary')
      && (!actor || this.driverStatus(saveId, this.repository.loadSave(ownerId, saveId).state, actor.sessionToken, actor.driverId).driver !== 'active')) {
      throw new ApiProblem(409, 'CLOCK_DRIVER_BUSY', 'Another selected session owns this save clock lease.', 'Phiên khác đang điều khiển thời gian của lượt lưu này.');
    }
    await this.settleClockBeforeCommand(saveId);
    const requestSha256 = canonicalStateHash(command);
    return this.inSaveQueue(saveId, () => {
      try {
        const result = this.repository.commitCommand({
          ownerId,
          saveId,
          command,
          requestSha256,
          reduce: state => reduceCommand(state, command, this.world, {
            allowSystemOnlyRevisionAdvance: (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary')
              && systemOnlyRevisionAdvance(state, command.expectedRevision),
          }),
          projectPlayerEvent: (event, eventId, state) => this.projectPlayerEvent(event, eventId, state),
        });
        if (result.kind === 'idempotency_conflict') {
          throw new ApiProblem(409, 'COMMAND_ID_REUSED', 'A command ID cannot be reused with a different request.', 'Mã lệnh đã được dùng với nội dung khác.');
        }
        if (!result.receipt) throw new ApiProblem(500, 'INTERNAL_ERROR', 'The command result is unavailable.', 'Đã xảy ra lỗi máy chủ.');
        if (!result.receipt.accepted) throw this.commandProblem(result.receipt, result.summary.revision);
        if (command.type === 'set_clock_speed' || command.type === 'advance_to_boundary') {
          const driver = this.clockDrivers.get(saveId);
          if (driver && actor && driver.sessionToken === actor.sessionToken && driver.driverId === actor.driverId) {
            driver.lastTickMonoMs = this.monotonicNow();
            driver.lastHeartbeatMonoMs = this.monotonicNow();
            driver.targetSimElapsedMs = result.state.simElapsedMs;
            driver.fractionalSimMs = 0;
            if (result.state.clockControl.status === 'running') this.ensureDriverTimer(saveId, driver, result.state);
            else this.clearDriverTimer(driver);
          }
        }
        return { receipt: result.receipt, revision: result.summary.revision, view: this.projectView(result.state, actor?.sessionToken, actor?.driverId) };
      } catch (error) {
        if (error instanceof ApiProblem) throw error;
        throw fromRepositoryError(error);
      }
    });
  }

  getCommand(saveId: string, commandId: string): { receipt: CommandReceipt; currentRevision: number } {
    try {
      const { receipt, currentRevision } = this.repository.getCommandReceipt(ownerId, saveId, commandId);
      return { receipt, currentRevision };
    }
    catch (error) { throw fromRepositoryError(error); }
  }

  playerEvents(saveId: string, afterSequence: number, limit: number) {
    try {
      const result = this.repository.getPlayerEvents(ownerId, saveId, afterSequence, limit);
      const events = result.events as PlayerEvent[];
      const hasMore = events.length > limit;
      const page = events.slice(0, limit);
      return {
        events: page,
        afterSequence,
        nextSequence: page.at(-1)?.sequence ?? afterSequence,
        hasMore,
      };
    } catch (error) { throw fromRepositoryError(error); }
  }

  createCheckpoint(saveId: string, label: string): CheckpointSummary {
    try { return this.repository.createCheckpoint(ownerId, saveId, label); }
    catch (error) { throw fromRepositoryError(error); }
  }

  listCheckpoints(saveId: string): CheckpointSummary[] {
    try { return this.repository.listCheckpoints(ownerId, saveId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  restoreCheckpoint(saveId: string, checkpointId: string, slotName: string): { save: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
    try {
      const result = this.repository.forkCheckpoint(ownerId, saveId, checkpointId, slotName, randomUUID());
      return { save: result.summary, view: this.projectView(result.state) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  exportBackup(saveId: string): BackupEnvelope {
    try {
      const backup = this.repository.exportBackup(ownerId, saveId);
      if (backup.receipts.length > MAX_BACKUP_ROWS || backup.events.length > MAX_BACKUP_ROWS
        || backup.checkpoints.length > MAX_BACKUP_CHECKPOINTS || Buffer.byteLength(JSON.stringify(backup), 'utf8') > 10 * 1024 * 1024) {
        throw new ApiProblem(413, 'PAYLOAD_TOO_LARGE', 'This save exceeds the backup export limits.', 'Lượt lưu vượt quá giới hạn xuất bản sao lưu.');
      }
      return backup;
    } catch (error) {
      if (error instanceof ApiProblem) throw error;
      throw fromRepositoryError(error);
    }
  }

  importBackup(input: unknown, slotName: string): { save: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
    if (!isNonEmptyString(slotName, 80)) throw new ApiProblem(400, 'INVALID_COMMAND', 'The import slot name is invalid.', 'Tên ô lưu không hợp lệ.');
    const sourceBackup = validateBackup(input, this.world);
    const newSaveId = randomUUID();
    const state = structuredClone(sourceBackup.state) as GameState;
    state.saveId = newSaveId;
    const events = (sourceBackup.events as Array<Record<string, unknown>>).map(event => {
      const eventSequence = Number(event.eventSequence);
      const eventId = `${newSaveId}:event:${String(eventSequence).padStart(12, '0')}`;
      const playerEvent = structuredClone(event.playerEvent) as Record<string, unknown>;
      playerEvent.eventId = eventId;
      return { ...event, eventId, playerEvent };
    });
    const checkpoints = (sourceBackup.checkpoints as Array<Record<string, unknown>>).map(checkpoint => {
      const checkpointState = structuredClone(checkpoint.state) as GameState;
      checkpointState.saveId = newSaveId;
      return {
        ...checkpoint,
        checkpointId: randomUUID(),
        saveId: newSaveId,
        state: checkpointState,
        stateSha256: canonicalStateHash(checkpointState),
      };
    });
    const backup: BackupEnvelope = {
      ...sourceBackup,
      save: { ...sourceBackup.save, saveId: newSaveId, slotName: slotName.trim(), forkedFrom: null },
      state,
      stateSha256: canonicalStateHash(state),
      events,
      checkpoints,
    };
    try {
      const result = this.repository.importBackup(ownerId, slotName.trim(), backup);
      return { save: result.summary, view: this.projectView(result.state) };
    } catch (error) {
      if (error instanceof ApiProblem) throw error;
      if (error instanceof RepositoryError && error.code === 'SAVE_ID_EXISTS') {
        throw new ApiProblem(409, 'BACKUP_INVALID', 'A save with this ID already exists; import never overwrites.', 'Lượt lưu hiện có không bị ghi đè.');
      }
      throw fromRepositoryError(error);
    }
  }

  private projectPlayerEvent(event: CommandEvent, eventId: string, state: GameState): PlayerEvent {
    if (event.type === 'known_entity_inspected') {
      const payloadRef = event.payload.entity;
      if (!isRecord(payloadRef) || payloadRef.type !== 'site' || payloadRef.id !== 'SITE-LL01-000'
        || !state.playerKnowledge.knownSiteIds.includes('SITE-LL01-000')) {
        throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'An inspection event cannot be exposed to the player.', 500);
      }
      return { sequence: event.sequence, eventId, type: event.type, category: 'exploration', title: 'Đã kiểm tra điểm neo', text: 'Thông tin hiện có của Điểm Neo đã được xem lại.' };
    }
    if (event.type === 'starter_container_inspected') {
      const container = state.inventory.containers.find(item => item.id === event.payload.containerId && item.observed);
      if (!container || container.kind !== 'carried_bag') throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'A hidden container event cannot be exposed to the player.', 500);
      return { sequence: event.sequence, eventId, type: event.type, category: 'inventory', title: 'Đã kiểm tra bịch đồ ăn', text: 'Nội dung của bịch đồ ăn đã được mở vào túi đồ.' };
    }
    if (event.type === 'career_card_inspected') {
      if (!state.playerKnowledge.careerCardObserved || state.player.career.state !== 'unemployed_card_sealed') {
        throw new RepositoryError('PLAYER_EVENT_PROJECTION_DENIED', 'A sealed career event cannot be exposed to the player.', 500);
      }
      return { sequence: event.sequence, eventId, type: event.type, category: 'character', title: 'Đã kiểm tra thẻ chuyển nghề', text: 'Nội dung thẻ đã được tiết lộ; chức nghiệp vẫn chưa được kích hoạt.' };
    }
    const description = this.describeTimeOrTombEvent(event);
    if (description) return { sequence: event.sequence, eventId, type: event.type, ...description };
    throw new RepositoryError('PLAYER_EVENT_TYPE_UNSUPPORTED', 'This event has no player-safe projection.', 500);
  }

  private projectSystemPlayerEvent(event: CommandEvent, eventId: string): PlayerEvent {
    const description = this.describeTimeOrTombEvent(event);
    if (!description) throw new RepositoryError('PLAYER_EVENT_TYPE_UNSUPPORTED', 'This system event has no player-safe projection.', 500);
    return { sequence: event.sequence, eventId, type: event.type, ...description };
  }

  private describeTimeOrTombEvent(event: CommandEvent): Pick<PlayerEvent, 'category' | 'title' | 'text'> | null {
    const events: Readonly<Record<string, Pick<PlayerEvent, 'category' | 'title' | 'text'>>> = {
      clock_speed_changed: { category: 'time', title: 'Đã đổi tốc độ thời gian', text: `Tốc độ: ${String(event.payload.selection)}.` },
      clock_stop_condition_set: { category: 'time', title: 'Đã đặt điều kiện dừng', text: `Máy chủ sẽ dừng khi đạt ${String(event.payload.stopCondition)}.` },
      clock_paused_after_restart: { category: 'time', title: 'Đồng hồ đã dừng sau khi khởi động lại', text: 'Chính sách phiên bản đầu tiên dừng thời gian khi máy chủ khởi động lại.' },
      clock_paused_after_lease_expired: { category: 'time', title: 'Đồng hồ đã dừng', text: 'Nhịp giữ quyền điều khiển đã hết hạn; thời gian được tạm dừng.' },
      clock_paused_on_shutdown: { category: 'time', title: 'Đồng hồ đã dừng khi máy chủ đóng', text: 'Thời gian được tạm dừng trước khi máy chủ đóng.' },
      clock_paused_on_stop_condition: { category: 'time', title: 'Đồng hồ đã dừng theo điều kiện', text: `Đã đạt điều kiện ${String(event.payload.stopCondition)}.` },
      simulation_time_advanced: { category: 'time', title: 'Thời gian mô phỏng đã tiến', text: `T+${String(event.payload.toElapsedMs ?? event.occurredAtElapsedMs)} ms.` },
      simulation_hour_settled: { category: 'time', title: 'Đã quyết toán một giờ mô phỏng', text: 'Các mốc giờ được quyết toán theo thứ tự máy chủ.' },
      world_day_started: { category: 'time', title: 'Bắt đầu ngày mới', text: `Ngày ${String(event.payload.day)} theo giờ thế giới.` },
      world_sunset: { category: 'time', title: 'Mặt trời lặn', text: 'Ánh sáng ngày chuyển sang chạng vạng.' },
      world_night_started: { category: 'time', title: 'Bắt đầu ban đêm', text: 'Chạng vạng kết thúc lúc 17:00.' },
      world_dawn: { category: 'time', title: 'Bình minh', text: 'Ngày mới bắt đầu lúc 07:00.' },
      opening_protection_expired: { category: 'survival', title: 'Hết thời hạn bảo hộ mở đầu', text: 'Bảo hộ mở đầu đã hết hạn sau 144 giờ mô phỏng.' },
      opening_protection_started: { category: 'survival', title: 'Bảo hộ mở đầu đã bắt đầu', text: 'EV00-SAFE-FIRE bảo vệ lãnh địa trong 144 giờ mô phỏng.' },
      cold_warning_changed: { category: 'survival', title: 'Mức tải lạnh đã đổi', text: `ColdLoad: ${String(event.payload.coldLoad)}.` },
      cold_danger_reached: { category: 'survival', title: 'Đạt ngưỡng nguy hiểm do lạnh', text: `ColdLoad: ${String(event.payload.coldLoad)}.` },
      fire_fuel_consumed: { category: 'survival', title: 'Lửa đã tiêu thụ gỗ', text: `Còn ${String(event.payload.remaining)} đơn vị gỗ đã cấp.` },
      survival_fire_extinguished: { category: 'survival', title: 'Lửa đã tắt', text: `Nguyên nhân: ${String(event.payload.reason)}.` },
      fire_refuelled: { category: 'survival', title: 'Đã cấp thêm nhiên liệu', text: `Đã chuyển ${String(event.payload.quantity)} gỗ vào bếp lửa.` },
      survival_fire_lit: { category: 'survival', title: 'Đã nhóm lửa', text: 'Lửa dùng lượng gỗ đã được cấp.' },
      tomb_job_queued: { category: 'tomb', title: 'Đã thêm vào hàng đợi Mộ', text: 'Một đầu ra Cương Thi tiêu chuẩn Bậc 0 đã được xếp hàng.' },
      tomb_job_started: { category: 'tomb', title: 'Mộ bắt đầu sản xuất', text: `Ô ${String(event.payload.slotId)} đã dành 1 Tử Khí cho đầu ra.` },
      tomb_job_blocked: { category: 'tomb', title: 'Sản xuất Mộ đang chờ', text: 'Hàng đợi cần Tử Khí trước khi có thể bắt đầu.' },
      tomb_job_cancelled: { category: 'tomb', title: 'Đã hủy việc chưa bắt đầu', text: 'Đầu vào chưa được đặt trước nên không có Tử Khí được hoàn lại.' },
      tomb_unit_completed: { category: 'tomb', title: 'Mộ hoàn tất một Cương Thi', text: `Đơn vị ${String(event.payload.unitId)} đã được thêm vào quân lực.` },
      tomb_death_qi_refilled: { category: 'tomb', title: 'Tử Khí đã hồi phục lúc nửa đêm', text: `${String(event.payload.current)}/${String(event.payload.capacity)} Tử Khí.` },
    };
    return events[event.type] ?? null;
  }

  private commandProblem(receipt: CommandReceipt, currentRevision: number): ApiProblem {
    if (receipt.code === 'STALE_REVISION') return apiProblem('STALE_REVISION', 409, receipt.message, 'Dữ liệu đã thay đổi. Hãy tải lại trước khi thử lại.', currentRevision);
    if (receipt.code === 'NOT_ACCESSIBLE' || receipt.code === 'ENTITY_NOT_KNOWN') return apiProblem('NOT_ACCESSIBLE', 404, 'The requested target is unavailable.', 'Không thể truy cập mục tiêu này.', currentRevision);
    if (receipt.code.endsWith('_STAGE_04') || receipt.code.endsWith('_STAGE_05') || receipt.code.endsWith('_STAGE_06') || receipt.code.endsWith('_STAGE_07') || receipt.code.endsWith('_STAGE_08') || receipt.code.includes('NOT_IMPLEMENTED')) {
      return apiProblem('RULE_NOT_READY', 422, receipt.message, 'Quy tắc cho thao tác này chưa sẵn sàng.', currentRevision);
    }
    if (receipt.code === 'CONTENT_MISMATCH') return apiProblem('CONTENT_MISMATCH', 409, receipt.message, 'Phiên bản nội dung không khớp.', currentRevision);
    return apiProblem('INVALID_COMMAND', 422, receipt.message, 'Lệnh không được chấp nhận.', currentRevision);
  }

}
