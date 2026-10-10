import type { ActionAvailability, CommandReceipt, PlayerView } from './index.ts';

export type ApiErrorCode =
  | 'INVALID_COMMAND'
  | 'STALE_REVISION'
  | 'NOT_ACCESSIBLE'
  | 'INSUFFICIENT_RESOURCE'
  | 'RULE_NOT_READY'
  | 'CONTENT_MISMATCH'
  | 'COMMAND_ID_REUSED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'ORIGIN_FORBIDDEN'
  | 'PAYLOAD_TOO_LARGE'
  | 'BACKUP_INVALID'
  | 'SLOT_CONFLICT'
  | 'INTERNAL_ERROR';

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    displayText: string;
    currentRevision?: number;
    retryable?: boolean;
  };
};

export type SaveSummary = {
  saveId: string;
  slotName: string;
  revision: number;
  lastEventSequence: number;
  worldPackageId: string;
  contentVersion: string;
  rulesetVersion: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  forkedFrom: null | { saveId: string; checkpointId: string };
};

export type CreateSaveRequest = { creationKey: string; slotName: string };
export type CreateSaveResponse = { created: boolean; save: SaveSummary; view: PlayerView };
export type SessionBootstrapRequest = { ownerKey: string };
export type SessionBootstrapResponse = { accessToken: string; expiresAtUtc: string; tokenType: 'Bearer' };
export type SaveSessionResponse = { saveId: string; revision: number; lastEventSequence: number; sessionExpiresAtUtc: string };
export type ViewResponse = { view: PlayerView };
export type PlayerEvent = { sequence: number; eventId: string; type: string; category: string; title: string; text: string };
export type EventPage = { events: readonly PlayerEvent[]; afterSequence: number; nextSequence: number; hasMore: boolean };
export type CommandPreviewResponse = { revision: number; availability: ActionAvailability; estimate: null };
export type CommandResponse = { receipt: CommandReceipt; revision: number; view: PlayerView };
export type CheckpointSummary = { checkpointId: string; saveId: string; revision: number; eventSequence: number; label: string; createdAtUtc: string; stateSha256: string };
export type CheckpointListResponse = { checkpoints: readonly CheckpointSummary[] };
export type BackupEnvelope = {
  format: 'ICE-AGE-LORD-SAVE-BACKUP';
  version: 1;
  exportedAtUtc: string;
  save: SaveSummary;
  state: unknown;
  stateSha256: string;
  receipts: readonly unknown[];
  events: readonly unknown[];
  checkpoints: readonly unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return Object.keys(value).every(key => fields.includes(key));
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function parseCreateSaveRequest(value: unknown): CreateSaveRequest | null {
  if (!isRecord(value) || !exactKeys(value, ['creationKey', 'slotName'])) return null;
  if (!boundedString(value.creationKey, 160) || !boundedString(value.slotName, 80)) return null;
  return { creationKey: value.creationKey.trim(), slotName: value.slotName.trim() };
}

export function parseSessionBootstrapRequest(value: unknown): SessionBootstrapRequest | null {
  if (!isRecord(value) || !exactKeys(value, ['ownerKey']) || !boundedString(value.ownerKey, 512)) return null;
  return { ownerKey: value.ownerKey };
}

export function parseCheckpointRequest(value: unknown): { label: string } | null {
  if (!isRecord(value) || !exactKeys(value, ['label']) || !boundedString(value.label, 80)) return null;
  return { label: value.label.trim() };
}

export function parseRestoreRequest(value: unknown): { slotName: string } | null {
  if (!isRecord(value) || !exactKeys(value, ['slotName']) || !boundedString(value.slotName, 80)) return null;
  return { slotName: value.slotName.trim() };
}
