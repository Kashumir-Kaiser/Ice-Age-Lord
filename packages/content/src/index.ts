import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { WorldDefinition } from '../../contracts/src/index.ts';
import { assertCompiledWorld, sha256, stableStringify, type ContentManifest } from './compiler.ts';

const manifestPath = fileURLToPath(new URL('../generated/content-manifest.json', import.meta.url));
const worldPath = fileURLToPath(new URL('../generated/world-package-ll01.json', import.meta.url));

function loadJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(`COMPILED_CONTENT_UNAVAILABLE: ${path}; ${(error as Error).message}`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export function loadActiveContent(): { manifest: ContentManifest; world: WorldDefinition } {
  const manifest = loadJson<ContentManifest>(manifestPath);
  const world = loadJson<WorldDefinition>(worldPath);
  const { hashes, ...manifestBody } = manifest;
  const manifestHash = sha256(stableStringify(manifestBody));
  if (hashes.manifestSha256 !== manifestHash) {
    throw new Error(`CONTENT_MANIFEST_HASH_MISMATCH: expected ${hashes.manifestSha256}; actual ${manifestHash}`);
  }
  if (hashes.worldPackageSha256 !== world.contentSha256) throw new Error('CONTENT_MANIFEST_WORLD_HASH_MISMATCH');
  assertCompiledWorld(world);
  return { manifest: deepFreeze(manifest), world: deepFreeze(world) };
}

export const ACTIVE_CONTENT = loadActiveContent();
export const ACTIVE_WORLD_PACKAGE = ACTIVE_CONTENT.world;
