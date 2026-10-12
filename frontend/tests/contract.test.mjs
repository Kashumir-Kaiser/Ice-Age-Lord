import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { sameEntityRef } from '../src/game/GameClient.ts';
import { demoEventContracts } from '../src/demoData.ts';
import { parseWorkflowTriggers } from '../scripts/workflowTriggers.mjs';
import { SaveResponseScopeGate } from '../src/live/saveScope.ts';
import { isLiveScreen, LIVE_SCREENS } from '../src/live/screens.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');

test('live navigation exposes exactly nine unique runtime screens including Character and Events', () => {
  const ids = LIVE_SCREENS.map(screen => screen.id);
  assert.deepEqual(ids, ['overview', 'character', 'territory', 'map', 'inventory', 'forces', 'buildings', 'events', 'journal']);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(isLiveScreen(id), true);
  assert.equal(isLiveScreen('demo-gallery'), false);
});

test('demo event examples are read-only samples and do not mislabel playable calendar contracts', () => {
  assert.equal(demoEventContracts.length, 3);
  assert.ok(demoEventContracts.every(event => event.readiness === 'executable_lifecycle' && event.status === 'scheduled'));
  assert.ok(demoEventContracts.every(event => event.objective === null && event.eventShop === null));
});

test('entity references compare by type and stable identity', () => {
  assert.equal(sameEntityRef({ type: 'site', id: 'SITE-LL01-000' }, { type: 'site', id: 'SITE-LL01-000' }), true);
  assert.equal(sameEntityRef({ type: 'site', id: 'SITE-LL01-000' }, { type: 'cache', id: 'SITE-LL01-000' }), false);
  assert.equal(sameEntityRef({ type: 'site', id: 'SITE-LL01-000' }, null), false);
});

test('a delayed response cannot cross a save change or an A-to-B-to-A selection', () => {
  const scopes = new SaveResponseScopeGate();
  const firstA = scopes.activate('save-A');
  const saveB = scopes.activate('save-B');
  assert.equal(scopes.isCurrent(firstA), false);
  assert.equal(scopes.isCurrent(saveB), true);
  const pickerGeneration = scopes.clear();
  assert.equal(scopes.isCurrent(saveB), false);
  assert.equal(scopes.isPickerCurrent(pickerGeneration), true);
  const secondA = scopes.activate('save-A');
  assert.equal(scopes.isCurrent(firstA), false);
  assert.equal(scopes.isCurrent(secondA), true);
  assert.throws(() => scopes.activate('  '), /SAVE_SCOPE_ID_REQUIRED/);
});

test('workflow event filters include pushes, pull requests, dispatch, and compiled-content sources', () => {
  const triggers = parseWorkflowTriggers(read('../.github/workflows/frontend-demo.yml'));
  assert.ok('workflow_dispatch' in triggers);
  assert.equal('schedule' in triggers, false);
  assert.ok(triggers.push);
  assert.ok(triggers.pull_request);
  for (const event of [triggers.push, triggers.pull_request]) {
    assert.ok(event.paths.includes('frontend/**'));
    assert.ok(event.paths.includes('packages/**'));
    assert.ok(event.paths.includes('references/canonical/**'));
    assert.ok(event.paths.includes('design/current/**'));
    assert.ok(event.paths.includes('data/events/EVENT-TIMELINE-v0.6.json'));
    assert.ok(event.paths.includes('data/events/EVENT-SOURCE-CATALOG-v4.6.json'));
    assert.ok(event.paths.includes('data/events/EVENT-SOURCE-ITEMS-v4.6.csv'));
    assert.ok(event.paths.includes('data/events/EVENT-SOURCE-ITEMS-v7.24.csv'));
    assert.ok(event.paths.includes('data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json'));
    assert.ok(event.paths.includes('data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json'));
    assert.ok(event.paths.includes('docs/FRESH_START.md'));
  }
  assert.ok(triggers.push.branches.includes('work'));
  assert.ok(triggers.push.branches.includes('codex/**'));
});

test('frontend package manifest and lockfile agree on every direct dependency', () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
});
