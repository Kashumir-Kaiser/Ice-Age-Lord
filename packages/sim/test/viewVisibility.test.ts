import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { OPENING_BUILDINGS } from '../../content/src/buildings.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { createNewGame } from '../src/initializer.ts';
import { projectPlayerView } from '../src/view.ts';

function stateAtStart() {
  return createNewGame({
    saveId: 'visibility-test-save', campaignId: 'visibility-test-campaign',
    soulId: 'LI_LAN', worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION, contentVersion: world.contentVersion,
    seed: 'visibility-test-seed',
  }, world);
}

test('the fresh player view reveals neither unreleased event names nor unopened construction catalogue', () => {
  const state = stateAtStart();
  const view = projectPlayerView(state, world);
  assert.equal(state.calendar.length, 30, 'the internal deterministic event schedule remains intact');
  assert.equal(state.territory.repaired, false);
  assert.equal(state.construction.unlockedBlueprintIds.length, 0);
  assert.deepEqual(view.calendar, [], 'nothing scheduled is visible before its announcement');
  assert.equal(view.visibleMap.entities.find(entity => entity.ref.id === 'SITE-LL01-000')?.label, 'Lửa Sinh Tồn',
    'player must never see the internal H0 site name');
  assert.deepEqual(view.construction.blueprints, [], 'the damaged house has not opened the building book');
  assert.doesNotMatch(JSON.stringify(view.calendar), /eventContract|researchEvidence|SOURCE_LOCKED/);
});

test('published events require an opening receipt and their opening time, and persist in event history afterwards', () => {
  const state = stateAtStart();
  const nextEvent = state.calendar.find(event => event.opensAtMs > 0)!;
  assert.ok(nextEvent);
  const source = world.eventSchedule.find(event => event.id === nextEvent.id)!;
  state.calendar = state.calendar.map(event => event.id === nextEvent.id
    ? { ...event, status: 'active', openReceiptSequence: 5 }
    : event);
  assert.equal(projectPlayerView(state, world).calendar.some(event => event.id === nextEvent.id), false,
    'even forged publication must not expose a future event');
  state.simElapsedMs = source.opensAtMs;
  const released = projectPlayerView(state, world);
  assert.equal(released.calendar.length, 1, 'other seeded future events remain hidden');
  assert.equal(released.calendar[0]?.id, nextEvent.id);
  assert.equal(released.calendar[0]?.displayName, source.displayName);
  assert.equal('eventContract' in released.calendar[0]!, false, 'GM contract must never reach player JSON');
  assert.equal('researchEvidence' in released.calendar[0]!, false, 'source evidence must never reach player JSON');
  state.calendar = state.calendar.map(event => event.id === nextEvent.id ? { ...event, status: 'resolved' } : event);
  assert.equal(projectPlayerView(state, world).calendar[0]?.status, 'resolved',
    'announced events remain visible as history after their end');
});

test('opening construction book is tied to actual unlocked entitlements, not the future source registry', () => {
  const state = stateAtStart();
  assert.ok(OPENING_BUILDINGS.length >= 10);
  const first = OPENING_BUILDINGS[0]!;
  assert.deepEqual(projectPlayerView(state, world).construction.blueprints, []);
  state.territory.repaired = true;
  state.construction.unlockedBlueprintIds = [first.id];
  const view = projectPlayerView(state, world);
  assert.deepEqual(view.construction.blueprints.map(entry => entry.id), [first.id]);
  assert.equal(view.construction.blueprints.some(entry => entry.id === OPENING_BUILDINGS[1]?.id), false);
});
