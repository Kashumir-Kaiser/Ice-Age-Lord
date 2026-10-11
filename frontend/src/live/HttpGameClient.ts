import type { CommandEnvelope, EntityRef, PlayerView } from '../../../packages/contracts/src/index.ts';
import type {
  ApiErrorEnvelope,
  CommandPreviewResponse,
  CommandResponse,
  CreateSaveRequest,
  CreateSaveResponse,
  EventPage,
  SaveSummary,
  SessionBootstrapResponse,
  ViewResponse,
} from '../../../packages/contracts/src/api.ts';

export class GameApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly displayText: string;
  readonly currentRevision?: number;
  readonly retryable: boolean;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    displayText: string;
    currentRevision?: number;
    retryable?: boolean;
  }) {
    super(input.displayText || input.message);
    this.name = 'GameApiError';
    this.status = input.status;
    this.code = input.code;
    this.displayText = input.displayText || input.message;
    this.currentRevision = input.currentRevision;
    this.retryable = input.retryable ?? false;
  }
}

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export class HttpGameClient {
  private accessToken: string | null = null;
  private selectedSaveId: string | null = null;
  private readonly clockDriverId = crypto.randomUUID();

  private async request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
    if (authenticated && this.accessToken) {
      headers.set('authorization', 'Bearer ' + this.accessToken);
      headers.set('x-clock-driver-id', this.clockDriverId);
    }

    let response: Response;
    try {
      response = await fetch(API_ROOT + path, { ...init, headers, cache: 'no-store' });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Network request failed.';
      throw new GameApiError({
        status: 0,
        code: 'API_DISCONNECTED',
        message: detail,
        displayText: 'Không kết nối được API cục bộ. Hãy kiểm tra dịch vụ tại 127.0.0.1:8081.',
        retryable: true,
      });
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const problem = body as ApiErrorEnvelope | null;
      throw new GameApiError({
        status: response.status,
        code: problem?.error?.code || 'HTTP_ERROR',
        message: problem?.error?.message || ('HTTP ' + response.status),
        displayText: problem?.error?.displayText || 'API từ chối yêu cầu (' + response.status + ').',
        currentRevision: problem?.error?.currentRevision,
        retryable: problem?.error?.retryable,
      });
    }
    return body as T;
  }

  async health(): Promise<{ status: 'ready'; apiVersion: number; contentVersion: string; storage: string }> {
    return this.request<{ status: 'ready'; apiVersion: number; contentVersion: string; storage: string }>('/health', { method: 'GET' }, false);
  }

  async authenticateOwner(ownerKey: string): Promise<void> {
    const result = await this.request<SessionBootstrapResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ ownerKey }),
    }, false);
    this.accessToken = result.accessToken;
    this.selectedSaveId = null;
  }

  clearSession(): void {
    this.accessToken = null;
    this.selectedSaveId = null;
  }

  async listSaves(): Promise<readonly SaveSummary[]> {
    const result = await this.request<{ saves: readonly SaveSummary[] }>('/saves');
    return result.saves;
  }

  async createSave(input: CreateSaveRequest): Promise<CreateSaveResponse> {
    return this.request<CreateSaveResponse>('/saves', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async selectSave(saveId: string): Promise<void> {
    await this.request('/saves/' + encodeURIComponent(saveId) + '/session', { method: 'POST' });
    this.selectedSaveId = saveId;
  }

  async heartbeatClock(): Promise<{ driver: 'active' | 'observing' | 'unclaimed'; catchingUp: boolean; targetSimElapsedMs: number; leaseRemainingMs: number; sessionTokenIsDriver: boolean }> {
    const saveId = this.requireSelectedSave();
    return this.request('/saves/' + encodeURIComponent(saveId) + '/heartbeat', { method: 'POST' });
  }

  async getView(): Promise<PlayerView> {
    const saveId = this.requireSelectedSave();
    const result = await this.request<ViewResponse>('/saves/' + encodeURIComponent(saveId) + '/view');
    return result.view;
  }

  async listEvents(afterSequence = 0, limit = 200, responseSaveId?: string): Promise<EventPage> {
    const selectedSaveId = this.requireSelectedSave();
    const saveId = responseSaveId ?? selectedSaveId;
    const query = new URLSearchParams({ afterSequence: String(afterSequence), limit: String(limit) });
    return this.request<EventPage>('/saves/' + encodeURIComponent(saveId) + '/events?' + query.toString());
  }

  async previewCommand(command: CommandEnvelope): Promise<CommandPreviewResponse> {
    const saveId = this.requireSelectedSave();
    return this.request<CommandPreviewResponse>('/saves/' + encodeURIComponent(saveId) + '/commands/preview', {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  async submitCommand(command: CommandEnvelope): Promise<CommandResponse> {
    const saveId = this.requireSelectedSave();
    return this.request<CommandResponse>('/saves/' + encodeURIComponent(saveId) + '/commands', {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  private requireSelectedSave(): string {
    if (!this.accessToken) {
      throw new GameApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'A local owner session is required.',
        displayText: 'Hãy kết nối bằng khóa chủ sở hữu trước.',
      });
    }
    if (!this.selectedSaveId) {
      throw new GameApiError({
        status: 409,
        code: 'SAVE_NOT_SELECTED',
        message: 'Select a save before making save-scoped requests.',
        displayText: 'Hãy mở một lượt lưu trước.',
      });
    }
    return this.selectedSaveId;
  }
}

export function entityRefKey(ref: EntityRef): string {
  return ref.type + ':' + ref.id;
}
