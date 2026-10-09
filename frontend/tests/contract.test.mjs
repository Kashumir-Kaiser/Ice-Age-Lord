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
test('T0 character, empty army and sample-only inventory unchanged',()=>{
  assert.match(read('src/App.tsx'),/T0 · 07:00/);
  assert.match(read('src/App.tsx'),/0 đơn vị/);
  assert.match(read('src/App.tsx'),/không phải vật phẩm đã nhận/);
  assert.match(read('src/MapScene.tsx'),/Không phải địa hình canon/);
});
test('map enforces fog before markers, fog never disabled, and supports dragging',()=>{
  const map=read('src/MapScene.tsx');
  assert.match(map,/onPointerDown=\{pointerDown\}/);
  assert.match(map,/onPointerMove=\{pointerMove\}/);
  assert.match(map,/onPointerUp=\{pointerUp\}/);
  assert.match(map,/onWheel=\{wheel\}/);
  assert.match(map,/FogMask id=\{unique\}/);
  assert.match(map,/visibleDemoMarkers\(survey\)/);
  assert.match(map,/map-survey-switch/);
  assert.doesNotMatch(map,/<button[^>]*>.*?Tắt sương mù/);
});
test('fire circle and time lighting are bound to rule-based data',()=>{
  const map=read('src/MapScene.tsx');
  assert.match(map,/const radius=heatRadiusM\(level\)/);
  assert.match(map,/r=\{radius\}/);
  assert.match(map,/dayOverlayOpacity\(minutes\)/);
  assert.match(map,/const phase=dayPhase\(minutes\)/);
  assert.match(map,/displayRemaining\(current\)/);
  assert.match(read('src/mapModel.ts'),/contentsKnown:false/);
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
