import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const source = relative => readFileSync(resolve(root, relative), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, '../assets/manifest.json'), 'utf8'));

// The adapter contains only erased type imports; evaluate its actual exported
// production mapping rather than copying a parallel implementation into tests.
const adapted = ts.transpileModule(source('src/live/territoryAdapter.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { artForLiveBuildingKind } = await import('data:text/javascript;base64,' + Buffer.from(adapted).toString('base64'));

test('live building types resolve to their registered demo-grade art, not a generic Lord House', () => {
  const map = {
    lord_house: 'lord-house-damaged',
    survival_fire: 'survival-fire-l01',
    tomb: 'tomb-entry',
    polar_farmhouse: 'polar-farmhouse-l01',
    simple_heater: 'opening-simple-heater',
    simple_stove: 'opening-simple-kitchen',
    sawmill: 'opening-woodshop',
    tailor: 'opening-tailor',
    ore_processor: 'opening-oreworks',
    forge: 'opening-forge',
    medical_room: 'opening-medical-station',
    small_shelter: 'opening-small-shelter',
    fence: 'opening-palisade-wall',
    gate: 'opening-timber-gate',
  };
  for (const [kind, id] of Object.entries(map)) {
    assert.equal(artForLiveBuildingKind(kind), id, kind);
    assert.ok(manifest.assets.some(asset => asset.assetId === id), id + ' is not registered');
  }
  assert.equal(artForLiveBuildingKind('unknown_special_building'), 'unregistered-building:unknown_special_building');
  assert.equal(artForLiveBuildingKind('medical-room'), 'opening-medical-station');
});

test('live overview uses demo presentation with real server projections and no demo data client', () => {
  const overview = source('src/live/LiveOverview.tsx');
  const live = source('src/LiveApp.tsx');
  const styles = source('src/live/overview-parity.css');
  assert.match(live, /<LiveOverview view=\{view\}/);
  assert.match(overview, /className="hero-banner live-overview-hero"/);
  assert.match(overview, /className="stats-grid"/);
  assert.match(overview, /className="overview-columns live-overview-columns"/);
  assert.match(overview, /className="bottom-cards"/);
  assert.match(overview, /liveExplorationSnapshot\(view,/);
  assert.match(overview, /view\.worldClock/);
  assert.match(overview, /view\.territory\.survivalFire/);
  assert.match(styles, /\.live-overview-map/);
  assert.doesNotMatch(overview, /DemoGameClient|demoGameClient|demoData|demoEventContracts|INITIAL_CLOCK_SECONDS/);
  assert.doesNotMatch(live, /DemoGameClient|demoGameClient/);
});
