import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type RuntimePaths = { databasePath: string; ownerKeyPath: string };

export function runtimePaths(cwd = process.cwd()): RuntimePaths {
  return {
    databasePath: process.env.ILL_DB_PATH ?? resolve(cwd, '.local/ice-age-lord.sqlite'),
    ownerKeyPath: process.env.ILL_OWNER_KEY_PATH ?? resolve(cwd, '.local/owner-key'),
  };
}

export function createOwnerKeyFile(path = runtimePaths().ownerKeyPath): string {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  if (existsSync(path)) throw new Error(`OWNER_KEY_ALREADY_EXISTS: ${path}`);
  const key = randomBytes(32).toString('base64url');
  const descriptor = openSync(path, 'wx', 0o600);
  try { writeFileSync(descriptor, `${key}\n`, { encoding: 'utf8' }); }
  finally { closeSync(descriptor); }
  chmodSync(path, 0o600);
  return path;
}

export function readOwnerKey(path = runtimePaths().ownerKeyPath): string {
  const key = (process.env.ILL_OWNER_KEY ?? '').trim();
  if (key) return key;
  try { return readFileSync(path, 'utf8').trim(); }
  catch { throw new Error(`OWNER_KEY_MISSING: run npm run owner:key:create (${path})`); }
}
