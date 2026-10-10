import { randomBytes, randomUUID } from 'node:crypto';
import type { ApiErrorCode, BackupEnvelope, CheckpointSummary, CreateSaveRequest, PlayerEvent, SaveSummary } from '../../contracts/src/api.ts';
import { parseCreateSaveRequest } from '../../contracts/src/api.ts';
import type { CommandEnvelope, CommandEvent, CommandReceipt, GameState, WorldDefinition } from '../../contracts/src/index.ts';
import { validateCommandEnvelope } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { CONTENT_VERSION, RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';
import { createNewGame } from '../../sim/src/initializer.ts';
import { previewCommand, reduceCommand } from '../../sim/src/reducer.ts';
import { projectPlayerView } from '../../sim/src/view.ts';
import { RepositoryError, SqliteRepository } from '../../storage/src/repository.ts';
import { ApiProblem, fromRepositoryError } from './errors.ts';

const ownerId = 'local-owner';
const MAX_BACKUP_ROWS = 10_000;
const MAX_BACKUP_CHECKPOINTS = 50;

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
  if (candidate.schemaVersion !== 1 || candidate.worldPackageId !== world.id
    || candidate.contentVersion !== world.contentVersion || candidate.rulesetVersion !== RULESET_VERSION
    || candidate.contentSourceSetSha256 !== canonicalStateHash(world.lockedSourceHashes)
    || !isSafeInt(candidate.revision) || !isSafeInt(candidate.lastEventSequence)
    || candidate.revision !== candidate.lastEventSequence) {
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

  baseline.revision = candidate.revision;
  baseline.lastEventSequence = candidate.lastEventSequence;
  baseline.playerKnowledge = {
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
  baseline.bagSeed = { ...baseline.bagSeed, inspected: bagObserved };
  if (canonicalStateHash(baseline) !== canonicalStateHash(candidate)) {
    throw new ApiProblem(400, 'BACKUP_INVALID', 'The backup contains state outside the supported Stage 03 rules.', 'Bản sao lưu không hợp lệ.');
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
  if (!receipt || !receipt.accepted || receipt.eventSequence !== value.eventSequence) return false;
  const publicEvent = value.playerEvent;
  if (publicEvent.sequence !== value.eventSequence || publicEvent.eventId !== value.eventId
    || !isNonEmptyString(publicEvent.type, 80) || !isNonEmptyString(publicEvent.category, 80)
    || !isNonEmptyString(publicEvent.title, 180) || !isNonEmptyString(publicEvent.text, 500)) return false;
  if (value.eventType === 'career_card_inspected') return Object.keys(value.payload).length === 0;
  if (value.eventType === 'starter_container_inspected') return value.payload.containerId === 'LL-CNT-CARRIED-FOOD-BAG-01' && value.payload.containerKind === 'carried_bag';
  if (value.eventType === 'known_entity_inspected') {
    const entity = value.payload.entity;
    return isRecord(entity) && entity.type === 'site' && entity.id === 'SITE-LL01-000';
  }
  return false;
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
    if (receipt.eventSequence !== null && !value.events.some(event => isRecord(event) && event.eventSequence === receipt.eventSequence && event.causalCommandId === receipt.commandId)) {
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
  readonly repository: SqliteRepository;
  readonly world: WorldDefinition;

  constructor(repository: SqliteRepository, world: WorldDefinition = ACTIVE_WORLD_PACKAGE) {
    this.repository = repository;
    this.world = world;
  }

  health(): { status: 'ready'; apiVersion: 1; contentVersion: string; storage: 'sqlite' } {
    return { status: 'ready', apiVersion: 1, contentVersion: this.world.contentVersion, storage: 'sqlite' };
  }

  createSave(input: unknown): { created: boolean; save: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
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
      return { created: result.created, save: result.summary, view: projectPlayerView(result.state, this.world) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  listSaves(): SaveSummary[] {
    try { return this.repository.listSaves(ownerId); }
    catch (error) { throw fromRepositoryError(error); }
  }

  loadSave(saveId: string): { state: GameState; summary: SaveSummary; view: ReturnType<typeof projectPlayerView> } {
    try {
      const result = this.repository.loadSave(ownerId, saveId);
      return { ...result, view: projectPlayerView(result.state, this.world) };
    } catch (error) { throw fromRepositoryError(error); }
  }

  preview(saveId: string, input: unknown) {
    const loaded = this.loadSave(saveId);
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    if (validation.data.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    return { revision: loaded.state.revision, availability: previewCommand(loaded.state, validation.data, this.world), estimate: null as null };
  }

  async executeCommand(saveId: string, input: unknown): Promise<{ receipt: CommandReceipt; revision: number; view: ReturnType<typeof projectPlayerView> }> {
    const validation = validateCommandEnvelope(input);
    if (!validation.success) throw new ApiProblem(400, 'INVALID_COMMAND', validation.issue.message, 'Lệnh không hợp lệ.');
    const command: CommandEnvelope = validation.data;
    if (command.saveId !== saveId) throw new ApiProblem(400, 'INVALID_COMMAND', 'The command save ID does not match the route.', 'Lệnh không hợp lệ.');
    const requestSha256 = canonicalStateHash(command);
    return this.inSaveQueue(saveId, () => {
      try {
        const result = this.repository.commitCommand({
          ownerId,
          saveId,
          command,
          requestSha256,
          reduce: state => reduceCommand(state, command, this.world),
          projectPlayerEvent: (event, eventId, state) => this.projectPlayerEvent(event, eventId, state),
        });
        if (result.kind === 'idempotency_conflict') {
          throw new ApiProblem(409, 'COMMAND_ID_REUSED', 'A command ID cannot be reused with a different request.', 'Mã lệnh đã được dùng với nội dung khác.');
        }
        if (!result.receipt) throw new ApiProblem(500, 'INTERNAL_ERROR', 'The command result is unavailable.', 'Đã xảy ra lỗi máy chủ.');
        if (!result.receipt.accepted) throw this.commandProblem(result.receipt, result.summary.revision);
        return { receipt: result.receipt, revision: result.summary.revision, view: projectPlayerView(result.state, this.world) };
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
      return { save: result.summary, view: projectPlayerView(result.state, this.world) };
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
      return { save: result.summary, view: projectPlayerView(result.state, this.world) };
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
    throw new RepositoryError('PLAYER_EVENT_TYPE_UNSUPPORTED', 'This event has no player-safe projection.', 500);
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

  private async inSaveQueue<T>(saveId: string, work: () => T): Promise<T> {
    const previous = this.commandQueues.get(saveId) ?? Promise.resolve();
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.catch(() => undefined).then(() => gate);
    this.commandQueues.set(saveId, tail);
    await previous.catch(() => undefined);
    try { return work(); }
    finally {
      release();
      if (this.commandQueues.get(saveId) === tail) {
        await tail;
        if (this.commandQueues.get(saveId) === tail) this.commandQueues.delete(saveId);
      }
    }
  }
}
