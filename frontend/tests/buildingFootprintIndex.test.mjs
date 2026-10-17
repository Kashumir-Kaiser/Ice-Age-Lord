import test from 'node:test';
import assert from 'node:assert/strict';
import { BuildingFootprintIndex } from '../src/rendering/BuildingFootprintIndex.ts';

const intersectsBruteForce = (buildings, prop) => buildings.some(building => {
  const turned = building.orientation === 'east' || building.orientation === 'west';
  const width = turned ? building.footprint.depthM : building.footprint.widthM;
  const depth = turned ? building.footprint.widthM : building.footprint.depthM;
  return Math.abs(prop.x - building.point.x) < width / 2 + prop.size &&
    Math.abs(prop.y - building.point.y) < depth / 2 + prop.size;
});

test('query buckets deduplicate wide footprints without changing strict edge results', () => {
  const buildings = [
    { id: 'wide', point: { x: 0, y: 0 }, orientation: 'north', footprint: { widthM: 128, depthM: 96 } },
  ];
  const index = new BuildingFootprintIndex(buildings, 8);
  // The first prop spans 25 cells, all containing the same footprint candidate.
  const cases = [
    [{ x: 0, y: 0, size: 16 }, true],
    [{ x: 80, y: 0, size: 16 }, false], // exact footprint-plus-prop edge
    [{ x: 79.999, y: 0, size: 16 }, true],
    [{ x: 0, y: 0, size: 0 }, true],
    [{ x: 80, y: 0, size: 16 }, false], // a fresh epoch must not reuse the previous hit
  ];
  for (const [prop, expected] of cases) {
    assert.equal(index.overlaps(prop), expected);
    assert.equal(index.overlaps(prop), intersectsBruteForce(buildings, prop));
  }
});

test('footprint index preserves strict boundary and orientation semantics', () => {
  const buildings = [
    { id: 'north', point: { x: 0, y: 0 }, orientation: 'north', footprint: { widthM: 8, depthM: 4 } },
    { id: 'east', point: { x: 100, y: -20 }, orientation: 'east', footprint: { widthM: 8, depthM: 4 } },
    { id: 'west', point: { x: -100, y: -20 }, orientation: 'west', footprint: { widthM: 8, depthM: 4 } },
    { id: 'draft', point: { x: 200, y: 30 }, orientation: 'south', footprint: { widthM: 6, depthM: 2 }, draft: true },
    { id: 'fixture', point: { x: -200, y: 30 }, orientation: 'south', footprint: { widthM: 6, depthM: 2 }, fixture: true },
  ];
  const index = new BuildingFootprintIndex(buildings, 16);
  const cases = [
    [{ x: 0, y: 0, size: 0 }, true],
    [{ x: 6, y: 0, size: 2 }, false], // exact edge remains non-overlapping
    [{ x: 5.999, y: 0, size: 2 }, true],
    [{ x: 100, y: -24.9, size: 1 }, true], // rotated east footprint
    [{ x: -100, y: -24.9, size: 1 }, true], // rotated west footprint
    [{ x: 200, y: 30, size: 0 }, true], // drafts keep the existing visual suppression behavior
    [{ x: -200, y: 30, size: 0 }, true], // fixtures are included by the caller's current snapshot scan
    [{ x: 300, y: 300, size: 80 }, false], // query spans multiple empty cells
  ];
  for (const [prop, expected] of cases) {
    assert.equal(index.overlaps(prop), expected);
    assert.equal(index.overlaps(prop), intersectsBruteForce(buildings, prop));
  }
});

test('spatial index matches the renderer overlap predicate across negative and large coordinates', () => {
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) + 0x27100001) | 0;
    return (seed >>> 0) / 0x100000000;
  };
  const orientations = ['north', 'east', 'south', 'west'];
  const buildings = Array.from({ length: 90 }, (_, i) => ({
    id: `b${i}`,
    point: { x: (random() - 0.5) * 1200, y: (random() - 0.5) * 1200 },
    orientation: orientations[Math.floor(random() * orientations.length)],
    footprint: { widthM: 1 + random() * 14, depthM: 1 + random() * 14 },
    ...(i % 7 === 0 ? { draft: true } : {}),
    ...(i % 11 === 0 ? { fixture: true } : {}),
  }));
  const index = new BuildingFootprintIndex(buildings, 32);
  for (let i = 0; i < 1200; i++) {
    const prop = { x: (random() - 0.5) * 1600, y: (random() - 0.5) * 1600, size: random() * 80 };
    assert.equal(index.overlaps(prop), intersectsBruteForce(buildings, prop), `prop ${i}`);
  }
});

test('footprint index skips invalid building geometry and rejects invalid bucket sizes', () => {
  assert.throws(() => new BuildingFootprintIndex([], 0), RangeError);
  assert.throws(() => new BuildingFootprintIndex([], Number.NaN), RangeError);
  const index = new BuildingFootprintIndex([
    { id: 'nan-point', point: { x: Number.NaN, y: 0 }, orientation: 'north', footprint: { widthM: 8, depthM: 4 } },
    { id: 'infinite-point', point: { x: Number.POSITIVE_INFINITY, y: 0 }, orientation: 'north', footprint: { widthM: 8, depthM: 4 } },
    { id: 'nan-extent', point: { x: 0, y: 0 }, orientation: 'north', footprint: { widthM: Number.NaN, depthM: 4 } },
    { id: 'infinite-extent', point: { x: 0, y: 0 }, orientation: 'north', footprint: { widthM: 8, depthM: Number.POSITIVE_INFINITY } },
  ]);
  assert.equal(index.overlaps({ x: 0, y: 0, size: 1 }), false);
  assert.equal(index.overlaps({ x: Number.NaN, y: 0, size: 1 }), false);
  assert.equal(index.overlaps({ x: Number.POSITIVE_INFINITY, y: 0, size: 1 }), false);
  assert.equal(index.overlaps({ x: 0, y: 0, size: -1 }), false);
  assert.equal(index.overlaps({ x: 0, y: 0, size: Number.POSITIVE_INFINITY }), false);
});

test('very large finite footprints and prop query spans use bounded fallback scans without truncating results', () => {
  const index = new BuildingFootprintIndex([
    { id: 'large', point: { x: 0, y: 0 }, orientation: 'north', footprint: { widthM: 1_000_000, depthM: 800_000 } },
    { id: 'far', point: { x: 3_000_000, y: -3_000_000 }, orientation: 'east', footprint: { widthM: 10, depthM: 6 } },
  ]);
  assert.equal(index.overlaps({ x: 499_999, y: 399_999, size: 0 }), true);
  assert.equal(index.overlaps({ x: 500_000, y: 0, size: 0 }), false);
  assert.equal(index.overlaps({ x: 2_999_998, y: -3_000_000, size: 0 }), true);
  assert.equal(index.overlaps({ x: 0, y: 0, size: 1_000_000 }), true);
});
