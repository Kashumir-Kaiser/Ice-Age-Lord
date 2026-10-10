import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/map/camera.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const camera = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

test('source metres map into SVG and return through the inverse transform', () => {
  const view = { x: 1200, y: -850, zoom: .24 };
  const rect = { x: 0, y: 0, width: 1280, height: 720 };
  for (const source of [{ x: 0, y: 0 }, { x: 40, y: 20 }, { x: 4700, y: -6800 }, { x: -12400, y: 15200 }]) {
    const mapPoint = camera.worldToMap(source);
    const screen = camera.mapToScreen(mapPoint, view, rect);
    const result = camera.screenToWorld(screen, view, rect);
    assert.ok(Math.abs(result.x - source.x) < 1e-8);
    assert.ok(Math.abs(result.y - source.y) < 1e-8);
  }
});

test('cursor anchored zoom keeps the same map coordinate under the pointer', () => {
  const rect = { x: 0, y: 0, width: 390, height: 490 };
  const view = { x: 980, y: -1410, zoom: .045 };
  const pointer = { x: 83, y: 327 };
  const before = camera.screenToMap(pointer, view, rect);
  const next = camera.zoomAtScreenPoint(view, rect, pointer, .31);
  const after = camera.screenToMap(pointer, next, rect);
  assert.ok(Math.abs(before.x - after.x) < 1e-9);
  assert.ok(Math.abs(before.y - after.y) < 1e-9);
});

test('local heat and 96 km world circles fit landscape and portrait viewports', () => {
  for (const rect of [{ x: 0, y: 0, width: 1280, height: 900 }, { x: 0, y: 0, width: 390, height: 844 }]) {
    for (const radius of [10, 2500, 25000, camera.WORLD_HALF_SPAN_M]) {
      const view = camera.fitCircle(radius, rect, 56);
      const center = camera.mapToScreen({ x: 0, y: 0 }, view, rect);
      const east = camera.mapToScreen({ x: radius, y: 0 }, view, rect);
      const north = camera.mapToScreen({ x: 0, y: -radius }, view, rect);
      assert.ok(east.x <= rect.width - 54.9 && east.x >= 54.9, `${rect.width}×${rect.height}, R=${radius}, east edge`);
      assert.ok(north.y <= rect.height - 54.9 && north.y >= 54.9, `${rect.width}×${rect.height}, R=${radius}, north edge`);
      assert.ok(center.x > 0 && center.y > 0);
    }
  }
});

test('bounds framing uses both dimensions and scale bar reports physical distance', () => {
  const rect = { x: 0, y: 0, width: 390, height: 490 };
  const view = camera.fitBounds({ minX: -9000, minY: -500, maxX: 9000, maxY: 500 }, rect, 48);
  const box = camera.viewBox(view, rect.width, rect.height);
  assert.ok(box.width >= 18000);
  assert.ok(box.height >= 1000);
  const scale = camera.scaleBar(box.height / rect.height);
  assert.ok(scale.distance > 0 && scale.pixels <= 110.01);
});
