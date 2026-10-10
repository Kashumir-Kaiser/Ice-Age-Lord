import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/map/clusterMarkers.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const clustering = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

const markers = [
  { id: 'site:1', kind: 'site', value: { amount: null }, x: 30, y: 28, worldX: 0, worldY: 0 },
  { id: 'resource:1', kind: 'wood', value: { amount: 10 }, x: 75, y: 28, worldX: 48, worldY: 0 },
  { id: 'cache:1', kind: 'cache', value: { amount: null }, x: 116, y: 28, worldX: 91, worldY: 0 },
  { id: 'site:far', kind: 'site', value: { amount: 99 }, x: 320, y: 170, worldX: 800, worldY: -500 },
];

test('collision clustering joins neighboring bins and different entity kinds', () => {
  const clusters = clustering.clusterMarkers(markers, 50);
  const group = clusters.find(entry => entry.type === 'cluster');
  assert.ok(group);
  assert.deepEqual(group.memberIds, ['cache:1', 'resource:1', 'site:1']);
  assert.deepEqual(group.kinds, { cache: 1, wood: 1, site: 1 });
  assert.deepEqual(group.bounds, { minX: 0, minY: 0, maxX: 91, maxY: 0 });
  assert.equal(group.worldX, 45.5);
  assert.equal(clusters.find(entry => entry.id === 'site:far').type, 'marker');
});

test('cluster ID and members are stable across input order and never sum amounts', () => {
  const forward = clustering.clusterMarkers(markers.slice(0, 3), 50)[0];
  const reverse = clustering.clusterMarkers(markers.slice(0, 3).reverse(), 50)[0];
  assert.equal(forward.id, reverse.id);
  assert.deepEqual(forward.memberIds, reverse.memberIds);
  assert.equal(Object.hasOwn(forward, 'amount'), false);
  assert.equal(Object.hasOwn(forward, 'remaining'), false);
});

test('screen-space labels keep higher priority and suppress colliding lower priority labels', () => {
  const shown = clustering.collisionFreeLabels([
    { id: 'resource', text: 'Đá lộ thiên', x: 100, y: 100, priority: 30 },
    { id: 'site', text: 'Nhà Lãnh Chúa', x: 102, y: 100, priority: 60 },
    { id: 'selected', text: 'Lửa Trại', x: 104, y: 100, priority: 100 },
  ]);
  assert.deepEqual([...shown], ['selected']);
});
