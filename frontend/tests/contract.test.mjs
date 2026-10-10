import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const filesUnder = dir => readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? filesUnder(path) : /\.(ts|tsx)$/.test(entry.name) ? [read(path)] : [];
});
const source = filesUnder('src').join('\n');

test('all seven destinations are supplied through the shared player view', () => {
  const client = read('src/game/GameClient.ts');
  const screens = read('src/demoData.ts');
  for (const id of ['overview', 'territory', 'map', 'inventory', 'forces', 'buildings', 'journal']) {
    assert.match(screens, new RegExp(`id: '${id}'`));
  }
  assert.match(client, /export type PlayerView/);
  assert.match(client, /screens: readonly/);
  assert.match(read('src/App.tsx'), /screens=\{playerView\.screens\}/);
});

test('selection and camera live above screens and the map consumes the shared projection', () => {
  const app = read('src/App.tsx');
  const map = read('src/MapScene.tsx');
  assert.match(app, /useState<EntityRef\s*\|\s*null>/);
  assert.match(app, /useState<SharedMapCamera>/);
  assert.match(app, /event\.key!=='Escape'/);
  assert.match(app, /setSelection\(null\)/);
  assert.match(app, /sameEntityRef\(selectedEntity\?\.ref,site\.entityRef\)/);
  assert.match(map, /visibleMap\.entities/);
  assert.doesNotMatch(map, /from '\.\/canonicalGeography'/);
  assert.match(map, /onPointerUp=\{finishPointer\}/);
  assert.match(map, /onPointerCancel=\{cancelPointer\}/);
  assert.match(map, /onLostPointerCapture=\{lostPointerCapture\}/);
  assert.match(map, /zoomAtScreenPoint\(/);
  assert.match(map, /scaleBar\(/);
});

test('demo-only restrictions apply to the adapter and unsupported commands are denied', () => {
  const adapter = read('src/game/DemoGameClient.ts');
  assert.match(adapter, /implements GameClient/);
  assert.match(adapter, /accepted: false/);
  assert.match(adapter, /demo-command-unsupported/);
  assert.doesNotMatch(adapter, /\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source, /Math\.random\s*\(/);
  assert.match(read('src/game/GameClient.ts'), /export type CommandRequest/);
  assert.match(read('src/game/GameClient.ts'), /export type CommandReceipt/);
});

test('presentation preserves the opening state and frozen display clock', () => {
  const app = read('src/App.tsx');
  assert.match(app, /useState\(INITIAL_CLOCK_SECONDS\)/);
  assert.match(app, /useState<ClockSpeed>\('Frozen'\)/);
  assert.match(app, /0 đơn vị/);
  assert.match(app, /không phải vật phẩm đã nhận/);
  assert.doesNotMatch(app, />T0(?:\s|<)/);
});

test('workflow lockfile install and dispatch trigger are explicit', () => {
  const workflow = read('../.github/workflows/frontend-demo.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm test/);
  assert.doesNotMatch(workflow, /\\n/);
  assert.match(read('package-lock.json'), /"lockfileVersion"/);
});

test('sidebar navigation remains independently scrollable', () => {
  assert.match(read('src/styles.css'), /\.sidebar-nav\s*\{[^}]*overflow-y:auto/);
  assert.match(read('src/styles.css'), /\.sidebar-nav\s*\{[^}]*min-height:0/);
});
