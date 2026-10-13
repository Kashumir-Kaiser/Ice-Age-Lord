import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PLAYER_VIEW_SCHEMA_VERSION } from '../../contracts/src/index.ts';
import { ACTIVE_CONTENT, ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { SOURCE_LOCK, SOURCE_MAIN_COMMIT, RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { assertSourceHashes } from '../../content/src/compiler.ts';
import { parseEventSourceLedger } from '../../content/src/eventLedger.ts';
import { createNewGame, elapsedMsToWorldClock } from '../src/initializer.ts';
import { canonicalStateHash, hash64, randomIntFromFields } from '../src/hash.ts';
import { actionAvailability, reduceCommand } from '../src/reducer.ts';
import { projectPlayerView } from '../src/view.ts';
import { STAGE07_OPENING_CORPSE_ID } from '../src/stage07.ts';

const world = ACTIVE_WORLD_PACKAGE;
const options = {
  saveId: 'save-stage02-001',
  campaignId: 'campaign-01',
  soulId: 'LI_LAN',
  worldPackageId: 'WORLD-PACKAGE-LL01-1.0',
  rulesetVersion: RULESET_VERSION,
  contentVersion: world.contentVersion,
  seed: 'reproducible-seed-001',
};

test('content authority is pinned and the world compiles from the selected source releases', () => {
  assert.equal(ACTIVE_CONTENT.manifest.sourceMainCommit, SOURCE_MAIN_COMMIT);
  assert.equal(ACTIVE_CONTENT.manifest.activeWorldPackageId, 'WORLD-PACKAGE-LL01-1.0');
  assert.equal(ACTIVE_CONTENT.manifest.timelineVersion, 'LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1');
  assert.equal(ACTIVE_CONTENT.manifest.conversionManifest.length, 8);
  assert.ok(ACTIVE_CONTENT.manifest.sources.find(source => source.path.endsWith('EVENT-SOURCE-CATALOG-v4.6.json'))?.runtimeUse.includes('not compiled'));
  assert.ok(ACTIVE_CONTENT.manifest.sources.find(source => source.path.endsWith('SOURCE-STRUCTURE-CATALOG-v1.0.json'))?.runtimeUse.includes('not compiled'));
  const freshStartContract = ACTIVE_CONTENT.manifest.sources.find(source => source.path === 'docs/FRESH_START.md');
  assert.equal(freshStartContract?.authorityClass, 'versioned_game_design');
  assert.match(freshStartContract?.runtimeUse ?? '', /clean-start constraints/);
  assert.equal(ACTIVE_CONTENT.manifest.sources.some(source => source.path === 'README.md'), false);
  assert.equal(world.lockedSourceHashes['README.md'], undefined);
  assert.equal(Object.keys(world.lockedSourceHashes).length, Object.keys(SOURCE_LOCK).length);
  assert.ok(Object.isFrozen(world));
  assert.ok(Object.isFrozen(world.sites));
});

test('v7.24 ledger IDs are complete and misaligned research flags stay out of verified counts', () => {
  const source = readFileSync('data/events/EVENT-SOURCE-ITEMS-v7.24.csv', 'utf8');
  const ledger = parseEventSourceLedger(source);
  assert.equal(ledger.length, 1_682);
  assert.equal(new Set(ledger.map(row => row.fields.id)).size, 1_682);
  assert.equal(ledger.find(row => row.fields.id === 'SX-0279')?.sourceFieldAlignment, 'unresolved');

  const dragonRevival = world.eventSchedule.find(event => event.id === 'EV02-DRAGON-REVIVAL')!;
  assert.ok(dragonRevival.researchEvidence.observedChestOutcomes > 0);
  assert.ok(dragonRevival.researchEvidence.unresolvedRowShapes > 0);
  assert.equal(dragonRevival.researchEvidence.verifiedAcquisitions, 0);
});

test('fixed source geometry and chest commitments retain every declared identity and grade', () => {
  assert.equal(world.sites.length, 38);
  assert.equal(world.chestCacheCenters.length, 41);
  assert.equal(world.anchors.length, 10);
  assert.equal(world.fieldChests.length, 192);
  assert.deepEqual(world.openingSiteIds, ['SITE-LL01-000', 'SITE-LL01-001', 'SITE-LL01-002', 'SITE-LL01-003']);
  assert.deepEqual(world.origin, { xMm: 0, yMm: 0, sourceZMetres: 0 });
  assert.deepEqual(world.sites.find(site => site.id === 'SITE-LL01-001')?.position, { xMm: 40_000, yMm: 20_000, sourceZMetres: 0 });
  assert.deepEqual(world.sites.find(site => site.id === 'SITE-LL01-060')?.position, { xMm: 164_000_000, yMm: -183_000_000, sourceZMetres: 31 });
  assert.equal(world.fieldChests.find(chest => chest.id === 'CH-LL01-001')?.position.xMm, -650_000);
  assert.equal(world.fieldChests.find(chest => chest.id === 'CH-LL01-002')?.position.xMm, -644_000);
  assert.equal(world.fieldChests.find(chest => chest.id === 'CH-LL01-002')?.position.yMm, 522_000);
  assert.equal(world.fieldChests.find(chest => chest.id === 'CH-LL01-003')?.position.xMm, -654_000);
  const grades = Object.fromEntries(['Mộc', 'Thanh Đồng', 'Bạch Ngân', 'Hoàng Kim', 'Hạo Nguyệt'].map(grade => [
    grade,
    world.fieldChests.filter(chest => chest.grade === grade).length,
  ]));
  assert.deepEqual(grades, { 'Mộc': 139, 'Thanh Đồng': 37, 'Bạch Ngân': 11, 'Hoàng Kim': 4, 'Hạo Nguyệt': 1 });
  assert.equal(new Set(world.fieldChests.map(chest => chest.id)).size, 192);
  assert.equal(new Set(world.fieldChests.map(chest => chest.lootCommitment)).size, 192);
  assert.equal(world.chestCacheCenters.reduce((sum, cache) => sum + cache.chestIds.length, 0), 192);
  assert.ok(world.chestCacheCenters.every(cache => cache.chestIds.length > 0));
});

test('hero lair extension conserves the 15 leaders, 693 IDs and source population debits', () => {
  assert.equal(world.lairs.length, 15);
  assert.equal(world.lairs.filter(lair => Math.hypot(lair.position.xMm, lair.position.yMm) <= 96_000_000).length, 10);
  assert.equal(world.lairs.filter(lair => Math.hypot(lair.position.xMm, lair.position.yMm) > 96_000_000).length, 5);
  assert.equal(new Set(world.lairs.map(lair => lair.leaderHeroId)).size, 15);
  assert.equal(world.lairUnits.length, 693);
  assert.equal(new Set(world.lairUnits.map(unit => unit.id)).size, 693);
  assert.ok(world.lairUnits.every(unit => unit.creationRoute === 'PRESEEDED_WORLD_LAIR' && unit.ownership === 'fixed_world_population'));
  assert.equal(world.fixedActors.length, 13);
  assert.ok(world.lairs.every(lair => lair.memberCount === lair.cohorts.reduce((sum, cohort) => sum + cohort.count, 0)));
  assert.ok(world.lairUnits.every(unit => unit.playerKnowledge === 'unobserved'));
  const debits = new Map<string, number>();
  for (const lair of world.lairs) debits.set(lair.sourcePopulationRef, (debits.get(lair.sourcePopulationRef) ?? 0) + lair.inLairCount);
  assert.equal(debits.get('ECO-LL01-R4:quái_bản_địa'), 82);
  assert.equal(debits.get('ECO-LL01-R1:sói_tuyết'), 9);
  assert.equal(world.ecology.length, 5);
  assert.equal(world.ecology.find(row => row.id === 'ECO-LL01-R4')?.counts['thú_ăn_cỏ'], 1420);
});

test('hash and bag rolls match HASH-PRIMITIVE-1.0 golden vectors', () => {
  assert.equal(hash64(['field-a', 'field-b']).toString(16), 'b240a2fc1e95a04b');
  assert.deepEqual(randomIntFromFields(['campaign-01', 'LI_LAN', 'BAG-MAIN'], 0, 99), { value: 1, draws: 1 });
  const state = createNewGame(options, world);
  assert.deepEqual(state.bagSeed.rolls, { main: 1, snack: 22, drink: 33 });
  assert.equal(state.bagSeed.commitmentSha256, '9c745249825eb6355224372ee515d2f37ff1ed2d0922dd477280b4fcb7bfffe0');
});

test('clean initializer is deterministic and uses one source ledger for starter assets', () => {
  const first = createNewGame(options, world);
  const reorderedOptions = {
    seed: options.seed,
    contentVersion: options.contentVersion,
    rulesetVersion: options.rulesetVersion,
    worldPackageId: options.worldPackageId,
    soulId: options.soulId,
    campaignId: options.campaignId,
    saveId: options.saveId,
  };
  const second = createNewGame(reorderedOptions, world);
  assert.equal(canonicalStateHash(first), canonicalStateHash(second));
  assert.equal(first.simElapsedMs, 0);
  assert.equal(first.player.level, 1);
  assert.equal(first.player.xp, 0);
  assert.equal(first.ownedUnits.length, 0);
  assert.equal(world.lairUnits.length, 693);
  assert.equal(first.player.mana.current, 236);
  assert.equal(first.player.mana.max, 236);
  assert.equal(first.player.career.state, 'unemployed_card_sealed');
  assert.equal(first.territory.survivalFire.fuelRemaining, 24);
  assert.equal(first.territory.survivalFire.fuelKnowledge, 'state_unobserved');
  assert.equal(first.territory.survivalFire.nextFuelConsumptionAtElapsedMs, 15 * 60_000);
  assert.equal(first.survival.environment?.apparentTemperatureC, 0);
  assert.equal(first.survival.blocker, null);
  assert.equal(first.territory.survivalFire.protectedThroughElapsedMs, 144 * 60 * 60 * 1000);
  assert.equal(first.territory.survivalFire.protectionStatus, 'pending_opening_settlement');
  assert.deepEqual(first.territory.tomb.deathQi, { current: 20, capacity: 20, refillAtWorldTime: '00:00', nextRefillAtElapsedMs: 17 * 60 * 60 * 1000 });
  assert.deepEqual(first.territory.tomb.queue, []);
  assert.equal(first.territory.tomb.output.xpMirrorEligible, false);
  assert.equal(first.corpses.length, 7);
  const openingCorpse = first.corpses.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID);
  const fixedCorpses = first.corpses.filter(corpse => corpse.id !== STAGE07_OPENING_CORPSE_ID);
  assert.equal(openingCorpse?.state, 'known');
  assert.equal(fixedCorpses.length, 6);
  assert.ok(fixedCorpses.every(corpse => corpse.state === 'unobserved'));
  assert.equal(first.fieldChestStates.length, 192);
  assert.ok(first.fieldChestStates.every(chest => chest.state === 'unopened'));
  assert.equal(first.quests.length, 18);
  assert.ok(first.quests.every(quest => quest.state === 'dormant' && quest.rewardReceipt === null));
  assert.equal(first.calendar.length, 30);
  assert.ok(first.calendar.every(event => event.status === 'scheduled' && event.openReceiptSequence === null && event.resolutionReceiptSequence === null));
  assert.equal(first.corpses.length, 7);
  assert.ok(fixedCorpses.every(corpse => corpse.state === 'unobserved' && corpse.createdAtElapsedMs === 0 && corpse.ownershipId === null));
  assert.equal(openingCorpse?.createdAtElapsedMs, 0);
  assert.equal(openingCorpse?.ownershipId, null);
  const supply = first.inventory.containers.find(container => container.kind === 'territory_supply');
  assert.equal(supply?.capacitySlots, 40);
  assert.equal(supply?.occupiedSlots, null);
  assert.deepEqual(supply?.stacks.map(item => [item.templateId, item.quantity]), [
    ['BREAD', 20], ['IRON-POT', 1], ['STONE-AXE', 4], ['STONE-HAMMER', 4], ['WOODEN-STAFF', 1], ['WOODEN-ROUND-SHIELD', 1],
  ]);
  assert.ok(supply?.stacks.every(item => !item.equipped));
  assert.equal(first.inventory.containers.find(container => container.kind === 'carried_bag')?.stacks.length, 4);
  assert.equal(first.cleanStartDiagnostics.contaminationCount, 0);
  assert.deepEqual(first.cleanStartDiagnostics.legacyFlags, []);
  assert.equal(first.cleanStartDiagnostics.historicalProgress, false);
});

test('player projection excludes unobserved world state and sealed career data', () => {
  const state = createNewGame(options, world);
  const view = projectPlayerView(state, world);
  const serialized = JSON.stringify(view);
  assert.equal(view.schemaVersion, PLAYER_VIEW_SCHEMA_VERSION);
  assert.equal(view.simElapsedMs, 0);
  assert.deepEqual(view.visibleMap.entities.map(entity => entity.ref.id), ['SITE-LL01-000', 'RES-LL01-06', 'RES-LL01-07', STAGE07_OPENING_CORPSE_ID]);
  assert.equal(view.visibleMap.heatOverlays[0].radiusMm, 10_000);
  assert.deepEqual(view.inventory.containers, []);
  assert.deepEqual(view.units, []);
  assert.deepEqual(view.jobs, []);
  assert.deepEqual(view.journal, []);
  assert.ok(!serialized.includes('CH-LL01-'));
  assert.ok(!serialized.includes('CACHE-LL01-'));
  assert.ok(!serialized.includes('HERO-LAIR-LL01-'));
  assert.ok(!serialized.includes('LAIR-LL01-'));
  assert.ok(!serialized.includes('CORPSE-HERO-LL01-'));
  assert.ok(!serialized.includes('Aren Var'));
  assert.ok(!serialized.includes('SK-OPEN-NECRO-01'));
  assert.ok(!serialized.includes('JOB-SUM-NECRO-01'));
  assert.ok(!serialized.includes('Tử Linh Triệu Hoán Sư'));
});

test('command validation and reducers reject client-owned outcomes and unsupported gameplay', () => {
  const state = createNewGame(options, world);
  const inspect = {
    schemaVersion: 1,
    saveId: state.saveId,
    commandId: 'cmd-inspect-h0',
    expectedRevision: 0,
    type: 'inspect_entity',
    payload: { entity: { type: 'site', id: 'SITE-LL01-000' } },
  };
  const accepted = reduceCommand(state, inspect, world);
  assert.equal(accepted.receipt.accepted, true);
  assert.equal(accepted.state.revision, 1);
  assert.equal(accepted.events[0].sequence, 1);
  assert.equal(accepted.events[0].type, 'known_entity_inspected');
  const acceptedReplay = reduceCommand(accepted.state, inspect, world);
  assert.deepEqual(acceptedReplay.receipt, accepted.receipt);
  assert.deepEqual(acceptedReplay.events, []);
  assert.equal(canonicalStateHash(acceptedReplay.state), canonicalStateHash(accepted.state));

  const harvest = {
    schemaVersion: 1, saveId: state.saveId, commandId: 'cmd-harvest', expectedRevision: 0,
    type: 'harvest', payload: { actorId: 'LI_LAN', resourceId: 'RES-LL01-01', materialId: 'WOOD', quantity: 1, toolItemId: 'missing-tool' },
  };
  const denied = reduceCommand(state, harvest, world);
  assert.equal(denied.receipt.accepted, false);
  assert.equal(denied.receipt.code, 'RESOURCE_NOT_ACCESSIBLE');
  assert.equal(denied.state.revision, state.revision);
  assert.equal(denied.state.lastEventSequence, state.lastEventSequence);
  assert.equal(denied.state.receipts.length, 1);
  const deniedReplay = reduceCommand(denied.state, harvest, world);
  assert.deepEqual(deniedReplay.receipt, denied.receipt);
  assert.equal(canonicalStateHash(deniedReplay.state), canonicalStateHash(denied.state));
  const reusedId = { ...harvest, payload: { ...harvest.payload, resourceId: 'RES-LL01-02', materialId: 'STONE' } };
  assert.equal(reduceCommand(denied.state, reusedId, world).receipt.code, 'COMMAND_ID_REUSED');
  assert.equal(actionAvailability('harvest').enabled, true);
  assert.equal(actionAvailability('inspect_entity').enabled, true);

  const clientInventory = { ...harvest, payload: { ...harvest.payload, inventory: { wood: 999 } } };
  assert.equal(reduceCommand(state, clientInventory, world).receipt.code, 'CLIENT_AUTHORITATIVE_FIELD_FORBIDDEN');
  const fakeAmount = { ...harvest, payload: { ...harvest.payload, amount: 5 } };
  assert.equal(reduceCommand(state, fakeAmount, world).receipt.code, 'COMMAND_PAYLOAD_FIELD_UNKNOWN');
  const unknownLair = { ...inspect, commandId: 'cmd-inspect-unknown', payload: { entity: { type: 'lair', id: 'LAIR-LL01-01' } } };
  assert.equal(reduceCommand(state, unknownLair, world).receipt.code, 'NOT_ACCESSIBLE');
  const stale = { ...inspect, expectedRevision: 3 };
  assert.equal(reduceCommand(state, stale, world).receipt.code, 'STALE_REVISION');
});

test('simulation clock starts at day 1 07:00 and is independent of local timezone', () => {
  assert.deepEqual(elapsedMsToWorldClock(0), { day: 1, hour: 7, minute: 0 });
  assert.deepEqual(elapsedMsToWorldClock(17 * 60 * 60 * 1000), { day: 2, hour: 0, minute: 0 });
  assert.deepEqual(elapsedMsToWorldClock(17 * 60 * 60 * 1000 + 123_000), { day: 2, hour: 0, minute: 2 });
  assert.throws(() => elapsedMsToWorldClock(-1), /SIM_TIME_INVALID/);
});

test('source edits fail closed until the content lock is intentionally updated', () => {
  const contents = Object.fromEntries(Object.keys(SOURCE_LOCK).map(path => [path, readFileSync(path, 'utf8')]));
  assert.doesNotThrow(() => assertSourceHashes(contents));
  contents['references/canonical/LORD-DND-06.md'] += '\nlocal mutation\n';
  assert.throws(() => assertSourceHashes(contents), /CONTENT_SOURCE_HASH_MISMATCH: references\/canonical\/LORD-DND-06\.md/);
});
