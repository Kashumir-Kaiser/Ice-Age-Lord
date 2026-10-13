import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { parseCheckpointRequest, parseCreateSaveRequest, parseRestoreRequest, parseSessionBootstrapRequest } from '../../contracts/src/api.ts';
import { ApiProblem } from './errors.ts';
import { LocalSessionRegistry } from './auth.ts';
import type { GameApplicationService } from './service.ts';

const JSON_LIMIT_BYTES = 1024 * 1024;
const BACKUP_LIMIT_BYTES = 64 * 1024 * 1024;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const LOOPBACK_PEERS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export type ApiServerOptions = { ownerKey: string; allowedOrigin?: string };
export type ApiServer = { server: Server; sessions: LocalSessionRegistry };

function requireLoopbackOrigin(origin: string): string {
  let parsed: URL;
  try { parsed = new URL(origin); }
  catch { throw new Error('ILL_ALLOWED_ORIGIN must be one explicit loopback HTTP(S) origin.'); }
  if (origin === '*' || !['http:', 'https:'].includes(parsed.protocol) || !LOOPBACK_HOSTS.has(parsed.hostname)
    || parsed.origin !== origin || parsed.username || parsed.password) {
    throw new Error('ILL_ALLOWED_ORIGIN must be one explicit loopback HTTP(S) origin.');
  }
  return origin;
}

function sendJson(response: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}): void {
  const body = JSON.stringify(data);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  response.end(body);
}

function fail(response: ServerResponse, problem: ApiProblem): void { sendJson(response, problem.status, problem.toEnvelope()); }

function jsonError(status: number, code: ConstructorParameters<typeof ApiProblem>[1], message: string, displayText: string): ApiProblem {
  return new ApiProblem(status, code, message, displayText);
}

function assertLocalRequest(request: IncomingMessage): void {
  const hostHeader = request.headers.host;
  let hostname = '';
  try { hostname = hostHeader ? new URL(`http://${hostHeader}`).hostname : ''; } catch { /* invalid host */ }
  if (!LOOPBACK_HOSTS.has(hostname) || !LOOPBACK_PEERS.has(request.socket.remoteAddress ?? '')) {
    throw jsonError(403, 'ORIGIN_FORBIDDEN', 'The local API accepts loopback connections only.', 'A API local chỉ nhận kết nối từ máy này.');
  }
}

async function readJson(request: IncomingMessage, maxBytes: number): Promise<unknown> {
  const contentType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') throw jsonError(415, 'INVALID_COMMAND', 'Content-Type must be application/json.', 'Yêu cầu phải dùng JSON.');
  const declaredLength = Number(request.headers['content-length'] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw jsonError(413, 'PAYLOAD_TOO_LARGE', 'The request body exceeds the configured limit.', 'Dữ liệu gửi lên vượt quá giới hạn.');
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) throw jsonError(413, 'PAYLOAD_TOO_LARGE', 'The request body exceeds the configured limit.', 'Dữ liệu gửi lên vượt quá giới hạn.');
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw jsonError(400, 'INVALID_COMMAND', 'The request body is not valid JSON.', 'Dữ liệu JSON không hợp lệ.'); }
}

function pathParts(pathname: string): string[] {
  try { return pathname.split('/').filter(Boolean).map(part => decodeURIComponent(part)); }
  catch { throw jsonError(400, 'INVALID_COMMAND', 'The request path is malformed.', 'Đường dẫn yêu cầu không hợp lệ.'); }
}

function positiveQueryInt(value: string | null, fallback: number, maximum: number, minimum = 0): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw jsonError(400, 'INVALID_COMMAND', 'A query value must be a nonnegative integer.', 'Tham số truy vấn không hợp lệ.');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw jsonError(400, 'INVALID_COMMAND', 'A query value is outside its allowed range.', 'Tham số truy vấn nằm ngoài giới hạn.');
  }
  return parsed;
}

export function createApiServer(service: GameApplicationService, options: ApiServerOptions): ApiServer {
  const allowedOrigin = requireLoopbackOrigin(options.allowedOrigin ?? 'http://localhost:5173');
  const sessions = new LocalSessionRegistry(options.ownerKey);
  const server = createServer(async (request, response) => {
    try {
      assertLocalRequest(request);
      const origin = request.headers.origin;
      if (origin && origin !== allowedOrigin) {
        throw jsonError(403, 'ORIGIN_FORBIDDEN', 'This Origin is not allowed by the local API.', 'Nguồn truy cập không được cho phép.');
      }
      const corsHeaders: Record<string, string> = origin === allowedOrigin
        ? { 'access-control-allow-origin': allowedOrigin, 'access-control-allow-headers': 'authorization, content-type, if-none-match, x-clock-driver-id', 'access-control-allow-methods': 'GET, POST, OPTIONS', vary: 'Origin' }
        : {};
      if (request.method === 'OPTIONS') {
        response.writeHead(204, { ...corsHeaders, 'cache-control': 'no-store' });
        response.end();
        return;
      }

      const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
      const parts = pathParts(url.pathname);
      const method = request.method ?? 'GET';
      if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'v1' && parts[2] === 'health' && method === 'GET') {
        sendJson(response, 200, service.health(), corsHeaders);
        return;
      }
      if (parts.length === 3 && parts.join('/') === 'api/v1/sessions' && method === 'POST') {
        const parsed = parseSessionBootstrapRequest(await readJson(request, JSON_LIMIT_BYTES));
        if (!parsed) throw jsonError(400, 'UNAUTHORIZED', 'The owner bootstrap request is invalid.', 'Thông tin chủ sở hữu không hợp lệ.');
        const session = sessions.authenticateOwnerKey(parsed.ownerKey);
        if (!session) throw jsonError(401, 'UNAUTHORIZED', 'The owner key is invalid.', 'Khóa chủ sở hữu không hợp lệ.');
        sendJson(response, 201, { ...session, tokenType: 'Bearer' }, corsHeaders);
        return;
      }

      const authenticated = sessions.authenticateBearer(request.headers.authorization);
      if (!authenticated) throw jsonError(401, 'UNAUTHORIZED', 'A valid local owner session is required.', 'Cần phiên truy cập chủ sở hữu hợp lệ.');
      if (parts[0] === 'api' && parts[1] === 'v1' && parts.length === 3 && parts[2] === 'backups' && method === 'POST') {
        const body = await readJson(request, BACKUP_LIMIT_BYTES);
        if (typeof body !== 'object' || body === null || Array.isArray(body)
          || typeof (body as Record<string, unknown>).slotName !== 'string' || !('backup' in body)) {
          throw jsonError(400, 'BACKUP_INVALID', 'The backup import request is malformed.', 'Yêu cầu nhập bản sao lưu không hợp lệ.');
        }
        const result = service.importBackup((body as { backup: unknown }).backup, (body as { slotName: string }).slotName);
        sessions.selectSave(authenticated.token, result.save.saveId);
        sendJson(response, 201, result, corsHeaders);
        return;
      }
      if (parts[0] !== 'api' || parts[1] !== 'v1' || parts[2] !== 'saves') {
        throw jsonError(404, 'NOT_FOUND', 'The requested API route was not found.', 'Không tìm thấy đường dẫn API.');
      }

      if (parts.length === 3 && method === 'GET') {
        sendJson(response, 200, { saves: service.listSaves() }, corsHeaders);
        return;
      }
      if (parts.length === 3 && method === 'POST') {
        const body = await readJson(request, JSON_LIMIT_BYTES);
        if (!parseCreateSaveRequest(body)) throw jsonError(400, 'INVALID_COMMAND', 'The save creation request is invalid.', 'Thông tin tạo lượt lưu không hợp lệ.');
        const result = service.createSave(body);
        sendJson(response, result.created ? 201 : 200, result, corsHeaders);
        return;
      }

      const saveId = parts[3];
      if (!saveId) throw jsonError(404, 'NOT_FOUND', 'The requested save route was not found.', 'Không tìm thấy lượt lưu.');
      if (parts.length === 5 && parts[4] === 'session' && method === 'POST') {
        service.loadSave(saveId);
        const selected = sessions.selectSave(authenticated.token, saveId);
        if (!selected) throw jsonError(401, 'UNAUTHORIZED', 'The local owner session has expired.', 'Phiên chủ sở hữu đã hết hạn.');
        const driverId = typeof request.headers['x-clock-driver-id'] === 'string' ? request.headers['x-clock-driver-id'] : authenticated.token;
        const clockDriver = await service.heartbeatClock(saveId, authenticated.token, driverId);
        const loaded = service.loadSave(saveId, authenticated.token, driverId);
        sendJson(response, 200, { saveId, revision: loaded.state.revision, lastEventSequence: loaded.state.lastEventSequence, sessionExpiresAtUtc: new Date(selected.expiresAtMs).toISOString(), clockDriver }, corsHeaders);
        return;
      }

      if (authenticated.session.selectedSaveId !== saveId) {
        throw jsonError(403, 'UNAUTHORIZED', 'Select this save in the current session before using it.', 'Hãy mở lượt lưu trong phiên hiện tại trước khi dùng.');
      }

      const driverId = typeof request.headers['x-clock-driver-id'] === 'string' ? request.headers['x-clock-driver-id'] : authenticated.token;
      if (parts.length === 5 && parts[4] === 'heartbeat' && method === 'POST') {
        sendJson(response, 200, await service.heartbeatClock(saveId, authenticated.token, driverId), corsHeaders);
        return;
      }
      if (parts.length === 5 && parts[4] === 'view' && method === 'GET') {
        const loaded = service.loadSave(saveId, authenticated.token, driverId);
        const etag = `"${saveId}:r${loaded.state.revision}"`;
        if (request.headers['if-none-match'] === etag) {
          response.writeHead(304, { ...corsHeaders, etag, 'cache-control': 'no-store' });
          response.end();
          return;
        }
        sendJson(response, 200, { view: loaded.view }, { ...corsHeaders, etag });
        return;
      }
      if (parts.length === 5 && parts[4] === 'events' && method === 'GET') {
        const after = positiveQueryInt(url.searchParams.get('afterSequence'), 0, Number.MAX_SAFE_INTEGER);
        const limit = positiveQueryInt(url.searchParams.get('limit'), 100, 200, 1);
        sendJson(response, 200, service.playerEvents(saveId, after, limit), corsHeaders);
        return;
      }
      if (parts.length === 6 && parts[4] === 'commands' && parts[5] === 'preview' && method === 'POST') {
        sendJson(response, 200, service.preview(saveId, await readJson(request, JSON_LIMIT_BYTES), authenticated.token, driverId), corsHeaders);
        return;
      }
      if (parts.length === 5 && parts[4] === 'commands' && method === 'POST') {
        sendJson(response, 200, await service.executeCommand(saveId, await readJson(request, JSON_LIMIT_BYTES), { sessionToken: authenticated.token, driverId }), corsHeaders);
        return;
      }
      if (parts.length === 6 && parts[4] === 'commands' && method === 'GET') {
        const result = service.getCommand(saveId, parts[5]);
        sendJson(response, 200, { receipt: result.receipt, currentRevision: result.currentRevision }, corsHeaders);
        return;
      }
      if (parts.length === 5 && parts[4] === 'checkpoints' && method === 'GET') {
        sendJson(response, 200, { checkpoints: service.listCheckpoints(saveId) }, corsHeaders);
        return;
      }
      if (parts.length === 5 && parts[4] === 'checkpoints' && method === 'POST') {
        const body = parseCheckpointRequest(await readJson(request, JSON_LIMIT_BYTES));
        if (!body) throw jsonError(400, 'INVALID_COMMAND', 'The checkpoint request is invalid.', 'Thông tin bản chụp không hợp lệ.');
        sendJson(response, 201, { checkpoint: service.createCheckpoint(saveId, body.label) }, corsHeaders);
        return;
      }
      if (parts.length === 7 && parts[4] === 'checkpoints' && parts[6] === 'restore' && method === 'POST') {
        const body = parseRestoreRequest(await readJson(request, JSON_LIMIT_BYTES));
        if (!body) throw jsonError(400, 'INVALID_COMMAND', 'The restore request is invalid.', 'Thông tin khôi phục không hợp lệ.');
        const result = service.restoreCheckpoint(saveId, parts[5], body.slotName);
        sessions.selectSave(authenticated.token, result.save.saveId);
        sendJson(response, 201, result, corsHeaders);
        return;
      }
      if (parts.length === 5 && parts[4] === 'backup' && method === 'GET') {
        sendJson(response, 200, service.exportBackup(saveId), { ...corsHeaders, 'content-disposition': `attachment; filename="${saveId}.backup.json"` });
        return;
      }
      throw jsonError(404, 'NOT_FOUND', 'The requested API route was not found.', 'Không tìm thấy đường dẫn API.');
    } catch (error) {
      const problem = error instanceof ApiProblem ? error : new ApiProblem(500, 'INTERNAL_ERROR', 'An internal service error occurred.', 'Đã xảy ra lỗi máy chủ.');
      if (!response.headersSent) fail(response, problem);
      else response.destroy();
    }
  });
  server.on('close', () => { void service.shutdownClockDrivers().catch(() => undefined); });
  return { server, sessions };
}
