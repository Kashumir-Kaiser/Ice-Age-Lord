import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapAssetRepositoryRoot, rasterDimensions, validateMapAssets } from '../scripts/validate-map-assets.mjs';

test('file URL converts to the native repository path and locates the real atlas on Windows and POSIX', () => {
  const expected = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  assert.equal(mapAssetRepositoryRoot, expected);
  const atlas = resolve(mapAssetRepositoryRoot, 'frontend/public/assets/map/buildings/campfire-start/atlas-close.png');
  assert.ok(existsSync(atlas), 'committed atlas must exist at its native filesystem path: ' + atlas);
  const dimensions = rasterDimensions(readFileSync(atlas));
  assert.ok(dimensions.width > 0 && dimensions.height > 0);
});

test('map assets resolve and match the source manifest through the real validator', () => {
  const manifest = JSON.parse(readFileSync(resolve(mapAssetRepositoryRoot, 'assets/manifest.json'), 'utf8'));
  assert.doesNotThrow(() => validateMapAssets(manifest));
});
