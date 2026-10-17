import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = path => readFileSync(resolve(root, path), 'utf8');
const transpile = ts.transpileModule(read('src/live/playerText.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { playerItemName, playerContainerName, playerStorageLocation, playerStatus, playerElapsed } =
  await import('data:text/javascript;base64,' + Buffer.from(transpile).toString('base64'));

test('starter items have readable names without changing their registry identifiers', () => {
  assert.equal(playerItemName('CONVENIENCE-CUP-NOODLES'), 'Mì ly ăn liền');
  assert.equal(playerItemName('CONVENIENCE-ROASTED-NUTS'), 'Hạt rang');
  assert.equal(playerItemName('CONVENIENCE-COFFEE-330ML'), 'Cà phê đóng lon 330 ml');
  assert.equal(playerItemName('DISPOSABLE-PAPER-NAPKIN-AND-CHOPSTICKS'), 'Khăn giấy và đũa dùng một lần');
  assert.equal(playerContainerName('Carried food bag'), 'Túi thực phẩm mang theo');
  assert.equal(playerContainerName('Cương Thi 1 pack'), 'Túi của Cương Thi 1');
});

test('real owner location displays names instead of IDs', () => {
  const view = {
    player: { id: 'LI_LAN', name: 'Lí Lan' },
    units: [{ id: 'TOMB-UNIT-50657093FC32E1350FF7', name: 'Cương Thi 1' }],
    territory: { buildings: [{ id: 'SITE-LL01-001', name: 'Nhà Lãnh Chúa' }] },
    visibleMap: { entities: [] },
  };
  assert.equal(playerStorageLocation(view, { location: { kind: 'carried', ownerId: 'LI_LAN' } }), 'Lí Lan đang mang');
  assert.equal(playerStorageLocation(view, { location: { kind: 'unit', unitId: view.units[0].id } }), 'Hành trang của Cương Thi 1');
  assert.equal(playerStorageLocation(view, { location: { kind: 'building', buildingId: 'SITE-LL01-001' } }), 'Trong Nhà Lãnh Chúa');
});

test('player labels hide internal status and time encodings', () => {
  assert.equal(playerStatus('under_construction'), 'Đang xây');
  assert.equal(playerStatus('damaged'), 'Hư hại');
  assert.equal(playerStatus('paused'), 'Tạm dừng');
  assert.equal(playerElapsed(90 * 60_000), '1 giờ 30 phút từ lúc bắt đầu');
});

test('inventory CSS prevents the legacy flex-column wrapping regression', () => {
  const css = read('src/live/overview-parity.css');
  assert.match(css, /\.live-inventory-art-list > li\s*\{[^}]*flex-flow:\s*column nowrap/s);
  assert.match(css, /\.live-inventory-art-list \.live-item-name\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.live-inventory-art-list > li > \*\s*\{[^}]*min-width:\s*0/s);
});
