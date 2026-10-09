import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'src');
const read = (path) => readFileSync(join(root, path), 'utf8');
const source = readdirSync(src).filter(f => /\.(ts|tsx)$/.test(f)).map(f => read('src/' + f)).join('\n');

test('seven navigable demo screens exist', () => {
  const data = read('src/demoData.ts');
  for (const id of ['overview','territory','map','inventory','forces','buildings','journal']) {
    assert.match(data, new RegExp("id: '"+id+"'"));
  }
});
test('demo stays independent from extraction and saved campaigns', () => {
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:research|references\/canonical|data\/events|runtime\/saves)/);
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source, /Math\.random\s*\(/);
});
test('T0 and empty army are shown, sample cards are not claimed owned', () => {
  assert.match(read('src/App.tsx'), /T0 · 07:00/);
  assert.match(read('src/App.tsx'), /0 đơn vị/);
  assert.match(read('src/App.tsx'), /không phải vật phẩm đã nhận/);
  assert.match(read('src/MapScene.tsx'), /Vị trí và địa hình chỉ/);
});
test('map and item art controls are inspectable', () => {
  assert.match(read('src/MapScene.tsx'), /onSelect\(site\.id\)/);
  assert.match(read('src/MapScene.tsx'), /changeZoom/);
  assert.match(read('src/App.tsx'), /setCategory/);
  assert.match(read('src/ItemArt.tsx'), /case 'sword'/);
});
