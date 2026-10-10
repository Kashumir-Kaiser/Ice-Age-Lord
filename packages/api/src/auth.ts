import { randomBytes, timingSafeEqual } from 'node:crypto';

export type LocalSession = { ownerId: 'local-owner'; expiresAtMs: number; selectedSaveId: string | null };

const SESSION_LIFETIME_MS = 60 * 60 * 1000;

function equalSecret(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export class LocalSessionRegistry {
  private readonly sessions = new Map<string, LocalSession>();
  private readonly ownerKey: string;
  private readonly now: () => number;

  constructor(ownerKey: string, now: () => number = Date.now) {
    this.ownerKey = ownerKey;
    this.now = now;
    if (ownerKey.length < 32) throw new Error('LOCAL_OWNER_KEY_TOO_SHORT');
  }

  authenticateOwnerKey(candidate: string): { accessToken: string; expiresAtUtc: string } | null {
    if (!equalSecret(candidate, this.ownerKey)) return null;
    const accessToken = randomBytes(32).toString('base64url');
    const expiresAtMs = this.now() + SESSION_LIFETIME_MS;
    this.sessions.set(accessToken, { ownerId: 'local-owner', expiresAtMs, selectedSaveId: null });
    return { accessToken, expiresAtUtc: new Date(expiresAtMs).toISOString() };
  }

  authenticateBearer(header: string | undefined): { token: string; session: LocalSession } | null {
    const match = header?.match(/^Bearer ([A-Za-z0-9_-]{40,128})$/);
    if (!match) return null;
    const token = match[1];
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAtMs <= this.now()) {
      this.sessions.delete(token);
      return null;
    }
    return { token, session };
  }

  selectSave(token: string, saveId: string): LocalSession | null {
    const current = this.sessions.get(token);
    if (!current || current.expiresAtMs <= this.now()) return null;
    const selected = { ...current, selectedSaveId: saveId };
    this.sessions.set(token, selected);
    return selected;
  }
}
