import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const src=join(root,'src');
const read=(path)=>readFileSync(join(root,path),'utf8');
const source=readdirSync(src).filter(f=>/\.(ts|tsx)$/.test(f)).map(f=>read('src/'+f)).join('\n');
test('seven demo screens remain reachable',()=>{
  for(const id of ['overview','territory','map','inventory','forces','buildings','journal']) assert.match(read('src/demoData.ts'),new RegExp("id: '"+id+"'"));
});
test('demo does not fetch, store, mutate canonical extraction or persist saves',()=>{
  assert.doesNotMatch(source,/from\s+['"][^'"]*(?:research|references\/canonical|data\/events|runtime\/saves)/);
  assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source,/Math\.random\s*\(/);
});
test('opening character, paused clock and sample inventory remain isolated',()=>{
  assert.match(read('src/App.tsx'),/useState\(INITIAL_CLOCK_SECONDS\)/);
  assert.match(read('src/App.tsx'),/useState<ClockSpeed>\('Frozen'\)/);
  assert.doesNotMatch(read('src/App.tsx'),/>T0(?:\s|<)/);
  assert.match(read('src/App.tsx'),/0 đơn vị/);
  assert.match(read('src/App.tsx'),/không phải vật phẩm đã nhận/);
  assert.match(read('src/MapScene.tsx'),/Tọa độ nguồn cố định/);
});
test('map enforces fog before markers, fog never disabled, and supports dragging',()=>{
  const map=read('src/MapScene.tsx');
  assert.match(map,/onPointerDown=\{pointerDown\}/);
  assert.match(map,/onPointerMove=\{pointerMove\}/);
  assert.match(map,/onPointerUp=\{pointerUp\}/);
  assert.match(map,/addEventListener\('wheel',onWheel,\{passive:false\}\)/);
  assert.match(map,/FogMask id=\{unique\} discs=\{discs\}/);
  assert.match(map,/visibleMapSpots\(minutes,level,survey\)/);
  assert.match(read('src/worldFeatures.ts'),/CANONICAL_CHEST_CACHES\.map/);
  assert.match(read('src/worldFeatures.ts'),/CANONICAL_RESOURCES\.map/);
  assert.match(map,/map-survey-switch/);
  assert.doesNotMatch(map,/<button[^>]*>.*?Tắt sương mù/);
});
test('fire circle and time lighting are bound to rule-based data',()=>{
  const map=read('src/MapScene.tsx');
  assert.match(map,/const radius=heatRadiusM\(level\)/);
  assert.match(map,/r=\{radius\}/);
  assert.match(map,/dayOverlayOpacity\(minutes\)/);
  assert.match(map,/const phase=dayPhase\(minutes\)/);
  assert.match(map,/current\.amount\?\.toLocaleString/);
  assert.match(map,/setViewMode\('local'\);setCx\(DEMO_CAMP/);
  assert.match(read('src/worldFeatures.ts'),/hidden:/);
});
test('CI runs after each frontend push and declares midnight ICT cron',()=>{
  const workflow=read('../.github/workflows/frontend-demo.yml');
  assert.match(workflow,/push:/);
  assert.match(workflow,/frontend\/\*\*/);
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/cron: '0 17 \* \* \*'/);
  assert.match(workflow,/npm run build/);
  assert.match(workflow,/npm test/);
});

test('sidebar navigation scrolls independently of page body',()=>{
  const css=read('src/styles.css');
  assert.match(css,/\.sidebar-nav\s*\{[^}]*overflow-y:auto/);
  assert.match(css,/\.sidebar-nav\s*\{[^}]*min-height:0/);
});
