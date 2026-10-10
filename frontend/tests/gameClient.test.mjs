import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const vite = await createServer({
  configFile: false,
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});
const { DemoGameClient } = await vite.ssrLoadModule('/src/game/DemoGameClient.ts');
const { visibleMapSpots } = await vite.ssrLoadModule('/src/worldFeatures.ts');
const client = new DemoGameClient();

test.after(async () => vite.close());

test('active map projection shows explicit known fixtures only; debug atlas is separate', () => {
  const ordinary = visibleMapSpots(false);
  assert.ok(ordinary.length > 0);
  assert.ok(ordinary.every(spot => spot.knowledge !== 'unknown'));
  assert.ok(ordinary.some(spot => spot.id === 'MODELED-SALVAGE-01' && spot.knowledge === 'current'));
  assert.ok(ordinary.some(spot => spot.id === 'MODELED-STONE-01' && spot.knowledge === 'remembered'));

  const normal = client.getVisibleMap({ clockMinutes: 420, fireLevel: 1, fireActive: true, sourceAtlas: false });
  const debug = client.getVisibleMap({ clockMinutes: 420, fireLevel: 30, fireActive: true, sourceAtlas: true });
  assert.ok(normal.entities.every(entity => entity.knowledge !== 'unknown'));
  assert.ok(debug.developerEntities.length > 0);
  assert.ok(debug.developerEntities.every(entity => entity.knowledge === 'unknown'));
  assert.deepEqual(debug.discoveryIds, normal.discoveryIds);
  assert.deepEqual(debug.sight, client.getVisibleMap({ clockMinutes: 420, fireLevel: 30, fireActive: true, sourceAtlas: false }).sight);
  assert.equal(client.inspectEntity(debug.developerEntities[0].ref), null);
});

test('light and fire previews update sight only, never known entity IDs or state revision', () => {
  const start = client.getVisibleMap({ clockMinutes: 420, fireLevel: 1, fireActive: true, sourceAtlas: false });
  const night = client.getVisibleMap({ clockMinutes: 1140, fireLevel: 1, fireActive: false, sourceAtlas: false });
  const wideHeat = client.getVisibleMap({ clockMinutes: 720, fireLevel: 30, fireActive: true, sourceAtlas: false });
  assert.deepEqual(night.discoveryIds, start.discoveryIds);
  assert.deepEqual(wideHeat.discoveryIds, start.discoveryIds);
  assert.equal(start.revision, night.revision);
  assert.equal(start.revision, wideHeat.revision);
  assert.equal(night.entities.find(entity => entity.ref.id === 'SITE-LL01-001').currentSight, false);
  assert.equal(wideHeat.entities.find(entity => entity.ref.id === 'SITE-LL01-001').currentSight, true);
});

test('known resource inspectors distinguish depleted, reserved, unreachable, and unknown quantities', () => {
  const view = client.getVisibleMap({ clockMinutes: 420, fireLevel: 1, fireActive: true, sourceAtlas: false });
  const depleted = view.entities.find(entity => entity.ref.id === 'MODELED-SALVAGE-01');
  const reserved = view.entities.find(entity => entity.ref.id === 'MODELED-STONE-01');
  assert.equal(depleted.resourceBalance.remaining, 0);
  assert.equal(depleted.resourceBalance.capacity, 18);
  assert.equal(reserved.resourceBalance.reserved, 6);
  assert.equal(reserved.resourceBalance.reachable, false);
  assert.equal(view.entities.find(entity => entity.ref.id === 'SITE-LL01-002').ref.type, 'site');
  assert.equal(view.developerEntities.find(entity => entity.ref.type === 'cache')?.resourceBalance, undefined);
});

test('commands are rejected without changing view revision or fixture balances', async () => {
  const before = client.getPlayerView();
  const result = await client.submitCommand({
    type: 'harvest', entity: { type: 'resource', id: 'MODELED-SALVAGE-01' }, material: 'Gỗ', amount: 5,
  });
  const after = client.getPlayerView();
  assert.equal(result.accepted, false);
  assert.equal(result.revision, before.revision);
  assert.equal(after.revision, before.revision);
  assert.equal(client.inspectEntity({ type: 'resource', id: 'MODELED-SALVAGE-01' }).resourceBalance.remaining, 0);
});
