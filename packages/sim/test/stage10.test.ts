import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { GAME_STATE_SCHEMA_VERSION } from '../../contracts/src/index.ts';
import { EVENT_MECHANICS, EVENT_MECHANICS_RULE_VERSION } from '../../content/src/eventRules.ts';
import { CHEST_EVENT_IDS, CHEST_LOOT_RULE_VERSION, chestLootOdds, lootTableForChest } from '../../content/src/chestLoot.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { createNewGame } from '../src/initializer.ts';
import { previewCommand, reduceCommand } from '../src/reducer.ts';
import { advanceTo, DAY_MS, HOUR_MS } from '../src/time.ts';
import { deterministicChestOutcome } from '../src/chestLoot.ts';
import { eventRewardReceiptId, recordEventActivities } from '../src/eventRuntime.ts';
import { initialWildlifeState, replenishWildlife, WILDLIFE_RULE_VERSION } from '../src/wildlife.ts';
import { projectPlayerView } from '../src/view.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { canonicalStateHash } from '../src/hash.ts';
import { STAGE07_OPENING_CLOAK_ID, STAGE07_OPENING_CORPSE_ID, STAGE07_OPENING_SPEAR_ID } from '../src/stage07.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { GameApplicationService } from '../../api/src/service.ts';

let serial = 0;
function freshState() {
  serial += 1;
  const state = createNewGame({
    saveId: `stage10-save-${serial}`, campaignId: `stage10-campaign-${serial}`, soulId: 'LI_LAN',
    worldPackageId: world.id, rulesetVersion: RULESET_VERSION, contentVersion: world.contentVersion, seed: `stage10-seed-${serial}`,
  }, world);
  // This suite isolates Stage 10 event contracts; bot progression has dedicated integration coverage.
  state.botPopulation = null;
  return state;
}
function submit(state: ReturnType<typeof freshState>, commandId: string, type: string, payload: Record<string, unknown>) {
  return reduceCommand(state, { schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload }, world);
}

test('all EV02–EV29 rows have a bounded activity rule with no client-supplied score', () => {
  assert.equal(Object.keys(EVENT_MECHANICS).length, 28);
  for (const row of world.eventSchedule.slice(2)) {
    const rule = EVENT_MECHANICS[row.id];
    assert.ok(rule, `${row.id} has a runtime objective`);
    assert.ok(rule.target > 0);
    assert.ok(Object.keys(rule.activityPoints).length > 0);
  }
  assert.equal(EVENT_MECHANICS_RULE_VERSION, 'LL01-EVENT-MECHANICS-DESIGN-1.0');
  const state = freshState();
  const rejected = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'client-score-forgery', expectedRevision: state.revision,
    type: 'choose_event_path', payload: { eventId: 'EV19-ICE-SNOW-CHOICE', choiceId: 'ice', score: 999 },
  }, world);
  assert.equal(rejected.receipt.accepted, false);
  assert.equal(rejected.receipt.code, 'COMMAND_PAYLOAD_FIELD_UNKNOWN');
});

test('schema 10 migration resumes at the former EV02 blocker without rewinding time or granting progress', () => {
  const current = freshState();
  const row = world.eventSchedule.find(event => event.id === 'EV02-DRAGON-REVIVAL')!;
  const legacy = structuredClone(current) as ReturnType<typeof freshState> & Record<string, unknown>;
  legacy.schemaVersion = 10;
  legacy.simElapsedMs = row.opensAtMs;
  legacy.eventProgressionBlocker = {
    eventId: row.id, blockedAtElapsedMs: row.opensAtMs, reasonCode: 'EVENT_MECHANICS_NOT_COMPILED',
    playerMessage: 'Legacy EV02 blocker', receiptSequence: 1,
  };
  legacy.calendar = legacy.calendar.map(event => event.id === row.id
    ? { ...event, status: 'blocked', blockedReceiptSequence: 1 }
    : event.id === 'EV00-SAFE-FIRE' || event.id === 'EV01-OPENING-LEVEL'
      ? { ...event, status: 'resolved' }
      : event);
  legacy.clockControl = { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' };
  delete legacy.eventProgress;
  delete legacy.wildlife;
  delete legacy.playerKnowledge.knownWildlifeGroupIds;
  const migrated = upgradeGameState(legacy);
  assert.equal(migrated.schemaVersion, GAME_STATE_SCHEMA_VERSION);
  assert.equal(migrated.botPopulation, null, 'older saves retain their legacy rivals without activating a new bot economy');
  assert.equal(migrated.simElapsedMs, row.opensAtMs);
  assert.equal(migrated.eventProgressionBlocker, null);
  assert.equal(migrated.calendar.find(event => event.id === row.id)?.status, 'scheduled');
  assert.equal(migrated.eventProgress.find(progress => progress.eventId === row.id)?.score, 0);
  assert.equal(migrated.eventProgress.find(progress => progress.eventId === row.id)?.outcome, 'unsettled');
  const resumed = advanceTo(migrated, row.opensAtMs, { maxBoundaries: 10_000 }, world);
  assert.equal(resumed.state.calendar.find(event => event.id === row.id)?.status, 'active');
  assert.equal(resumed.state.eventProgress.find(progress => progress.eventId === row.id)?.shopStatus, 'active');
  assert.equal(resumed.state.eventProgress.find(progress => progress.eventId === row.id)?.score, 0);
});

test('schema 10 migration closes an expired blocker as a nonparticipant without creating a reward', () => {
  const current = freshState();
  const row = world.eventSchedule.find(event => event.id === 'EV02-DRAGON-REVIVAL')!;
  const legacy = structuredClone(current) as ReturnType<typeof freshState> & Record<string, unknown>;
  legacy.schemaVersion = 10;
  legacy.simElapsedMs = row.resolvesAtMs;
  legacy.eventProgressionBlocker = {
    eventId: row.id, blockedAtElapsedMs: row.opensAtMs, reasonCode: 'EVENT_MECHANICS_NOT_COMPILED',
    playerMessage: 'Legacy EV02 blocker', receiptSequence: 1,
  };
  legacy.calendar = legacy.calendar.map(event => event.id === row.id
    ? { ...event, status: 'blocked', blockedReceiptSequence: 1 }
    : event);
  legacy.clockControl = { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' };
  delete legacy.eventProgress;
  delete legacy.wildlife;
  delete legacy.playerKnowledge.knownWildlifeGroupIds;

  const migrated = upgradeGameState(legacy);
  assert.equal(migrated.calendar.find(event => event.id === row.id)?.status, 'resolved');
  assert.equal(migrated.eventProgressionBlocker, null);
  const progress = migrated.eventProgress.find(event => event.eventId === row.id)!;
  assert.equal(progress.outcome, 'nonparticipant');
  assert.equal(progress.score, 0);
  assert.equal(progress.rewardKrona, 0);
  assert.equal(progress.shopStatus, 'expired');
});

test('EV19 records one server-side path, settles a claimable result, and pays once after its fixed lock and resolution', () => {
  const state = freshState();
  const row = world.eventSchedule.find(event => event.id === 'EV19-ICE-SNOW-CHOICE')!;
  state.simElapsedMs = row.opensAtMs;
  state.lastEventSequence = 1;
  state.calendar = state.calendar.map(event => event.id === row.id
    ? { ...event, status: 'active', openReceiptSequence: 1 }
    : { ...event, status: 'cancelled', openReceiptSequence: null, lockReceiptSequence: null, blockedReceiptSequence: null, resolutionReceiptSequence: null });
  state.timeBoundaries = {
    nextHourlySettlementAtElapsedMs: Number.MAX_SAFE_INTEGER, nextMidnightAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextDailySettlementAtElapsedMs: Number.MAX_SAFE_INTEGER, nextSunsetAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextTwilightEndAtElapsedMs: Number.MAX_SAFE_INTEGER, nextDawnAtElapsedMs: Number.MAX_SAFE_INTEGER, protectionExpiryAtElapsedMs: null,
  };
  state.wildlife = initialWildlifeState(world, row.opensAtMs);
  state.stage08.enabled = false;

  const chosen = submit(state, 'stage10-choose-snow', 'choose_event_path', { eventId: row.id, choiceId: 'snow' });
  assert.equal(chosen.receipt.accepted, true);
  let active = chosen.state;
  assert.equal(active.eventProgress.find(progress => progress.eventId === row.id)?.choiceId, 'snow');
  assert.equal(active.eventProgress.find(progress => progress.eventId === row.id)?.objectiveProgress, 1);
  assert.equal(submit(active, 'stage10-choose-ice-again', 'choose_event_path', { eventId: row.id, choiceId: 'ice' }).receipt.accepted, false);
  const activeView = projectPlayerView(active, world);
  assert.equal(activeView.calendar.find(event => event.id === row.id)?.objective?.choiceId, 'snow');

  const result = advanceTo(active, row.resolvesAtMs, { maxBoundaries: 10_000 }, world);
  active = result.state;
  active.lastEventSequence += result.events.length;
  active.revision += 1;
  assert.equal(active.calendar.find(event => event.id === row.id)?.status, 'resolved');
  assert.equal(active.eventProgress.find(progress => progress.eventId === row.id)?.outcome, 'success');
  assert.equal(active.eventProgress.find(progress => progress.eventId === row.id)?.rewardKrona, 10);
  assert.ok(result.events.some(event => event.type === 'event_calendar_locked' && event.payload.eventId === row.id));
  assert.ok(result.events.some(event => event.type === 'event_objective_settled' && event.payload.outcome === 'success'));

  const claim = submit(active, 'stage10-claim-event', 'claim_event_reward', { eventId: row.id });
  assert.equal(claim.receipt.accepted, true);
  assert.equal(claim.state.eventProgress.find(progress => progress.eventId === row.id)?.outcome, 'claimed');
  assert.equal(claim.state.eventProgress.find(progress => progress.eventId === row.id)?.claimReceiptId, eventRewardReceiptId(active, row.id));
  assert.equal(claim.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 10);
  const reloaded = upgradeGameState(claim.state, world);
  assert.equal(reloaded.eventProgress.find(progress => progress.eventId === row.id)?.claimReceiptId, eventRewardReceiptId(active, row.id));
  const newRequestRetry = reduceCommand(reloaded, {
    schemaVersion: 1, saveId: active.saveId, commandId: 'stage10-claim-event-new-command-id', expectedRevision: reloaded.revision,
    type: 'claim_event_reward', payload: { eventId: row.id },
  }, world);
  assert.equal(newRequestRetry.receipt.accepted, false);
  assert.equal(newRequestRetry.receipt.code, 'EVENT_REWARD_ALREADY_CLAIMED');
  assert.equal(newRequestRetry.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 10);
  const retry = reduceCommand(claim.state, {
    schemaVersion: 1, saveId: active.saveId, commandId: 'stage10-claim-event', expectedRevision: active.revision,
    type: 'claim_event_reward', payload: { eventId: row.id },
  }, world);
  assert.equal(retry.receipt.accepted, true);
  assert.equal(retry.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 10);
});

test('event shop spends only earned score, commits stock and inventory atomically, then expires marks at resolution', () => {
  let state = freshState();
  const row = world.eventSchedule.find(event => event.id === 'EV02-DRAGON-REVIVAL')!;
  const opened = advanceTo(state, row.opensAtMs, { maxBoundaries: 10_000 }, world);
  state = opened.state;
  state.lastEventSequence += opened.events.length;
  state.revision += 1;
  assert.equal(state.calendar.find(event => event.id === row.id)?.status, 'active');
  assert.equal(state.eventProgress.find(progress => progress.eventId === row.id)?.shopStatus, 'active');

  const inspected = submit(state, 'stage10-shop-inspect-bag', 'inspect_starter_container', { containerId: 'LL-CNT-CARRIED-FOOD-BAG-01' });
  assert.equal(inspected.receipt.accepted, true);
  state = inspected.state;
  const withoutScore = submit(state, 'stage10-shop-poor', 'buy_event_offer', {
    eventId: row.id, destinationContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', quantity: 1,
  });
  assert.equal(withoutScore.receipt.accepted, false);
  assert.equal(withoutScore.receipt.code, 'EVENT_SHOP_SCORE_INSUFFICIENT');

  const scored = recordEventActivities(state, [{ type: 'combat_encounter_won', occurredAtElapsedMs: state.simElapsedMs, payload: { eventId: row.id } }]);
  state = scored.state;
  state.lastEventSequence += scored.events.length;
  state.revision += 1;
  const tooMany = submit(state, 'stage10-shop-over-budget', 'buy_event_offer', {
    eventId: row.id, destinationContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', quantity: 2,
  });
  assert.equal(tooMany.receipt.accepted, false);
  assert.equal(tooMany.receipt.code, 'EVENT_SHOP_SCORE_INSUFFICIENT');

  const purchaseCommand = { schemaVersion: 1, saveId: state.saveId, commandId: 'stage10-shop-one', expectedRevision: state.revision,
    type: 'buy_event_offer', payload: { eventId: row.id, destinationContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', quantity: 1 } };
  assert.equal(previewCommand(state, purchaseCommand, world).enabled, true);
  const purchase = reduceCommand(state, purchaseCommand, world);
  assert.equal(purchase.receipt.accepted, true, purchase.receipt.code);
  const progress = purchase.state.eventProgress.find(item => item.eventId === row.id)!;
  assert.equal(progress.scoreSpent, 5);
  assert.equal(progress.shopStockRemaining, progress.shopInitialStock - 1);
  const mark = purchase.state.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')!.stacks.find(stack => stack.templateId === `EVENT-MARK-${row.id}`)!;
  assert.equal(mark.quantity, 1);
  assert.equal(mark.exclusiveEventId, row.id);
  assert.equal(mark.expiresAtElapsedMs, row.resolvesAtMs);

  const closed = advanceTo(purchase.state, row.locksAtMs, { maxBoundaries: 10_000 }, world);
  assert.equal(closed.state.eventProgress.find(item => item.eventId === row.id)?.shopStatus, 'closed');
  const resolved = advanceTo(closed.state, row.resolvesAtMs, { maxBoundaries: 10_000 }, world);
  const finalProgress = resolved.state.eventProgress.find(item => item.eventId === row.id)!;
  assert.equal(finalProgress.shopStatus, 'expired');
  assert.equal(finalProgress.expiredItemQuantities[`EVENT-MARK-${row.id}`], 1);
  assert.ok(!resolved.state.inventory.containers.some(container => container.stacks.some(stack => stack.templateId === `EVENT-MARK-${row.id}`)));
  assert.ok(resolved.events.some(event => event.type === 'event_inventory_expired' && event.payload.eventId === row.id));
});

test('event activity, objective settlement and choice receipts survive a strict backup round trip', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage10-event-backup-'));
  const repository = new SqliteRepository(resolve(directory, 'saves.sqlite'));
  const service = new GameApplicationService(repository, world, { timersEnabled: false });
  try {
    // Seed an event-only save so this backup contract stays focused on Stage 10.
    // The API creation path with the persistent bot population is covered by the bot API suite.
    const created = repository.createSaveIdempotent({
      ownerId: 'local-owner', creationKey: 'stage10-event-backup',
      requestSha256: canonicalStateHash({ creationKey: 'stage10-event-backup', slotName: 'Stage 10 event backup' }),
      slotName: 'Stage 10 event backup', makeState: freshState,
    });
    const saveId = created.saveId;
    repository.commitSystemTransition({
      ownerId: 'local-owner', saveId,
      transition: current => {
        const openSequence = current.lastEventSequence + 1;
        return {
          state: {
            ...current,
            territory: { ...current.territory, survivalFire: { ...current.territory.survivalFire, protectionStatus: 'active' } },
            calendar: current.calendar.map(event => event.id === current.territory.survivalFire.protectionEventId
              ? { ...event, status: 'active', openReceiptSequence: openSequence }
              : event),
          },
          events: [{ sequence: openSequence, type: 'opening_protection_started', occurredAtElapsedMs: 0, payload: {
            eventId: 'EV00-SAFE-FIRE', expiresAtElapsedMs: 144 * HOUR_MS,
          } }],
        };
      },
      projectPlayerEvent: (event, eventId, state) => (service as unknown as {
        projectSystemPlayerEvent: (candidate: typeof event, id: string, finalState: typeof state) => unknown;
      }).projectSystemPlayerEvent(event, eventId, state),
    });
    const row = world.eventSchedule.find(event => event.id === 'EV19-ICE-SNOW-CHOICE')!;
    const advanceThrough = (target: number) => repository.commitSystemTransition({
      ownerId: 'local-owner', saveId,
      transition: current => {
        const advanced = advanceTo(current, target, { maxBoundaries: 10_000 }, world);
        return {
          state: advanced.state,
          events: advanced.events.map((event, index) => ({ ...event, sequence: current.lastEventSequence + index + 1 })),
        };
      },
      projectPlayerEvent: (event, eventId, state) => (service as unknown as {
        projectSystemPlayerEvent: (candidate: typeof event, id: string, finalState: typeof state) => unknown;
      }).projectSystemPlayerEvent(event, eventId, state),
    });

    advanceThrough(row.opensAtMs);
    let state = repository.loadSave('local-owner', saveId).state;
    const chosen = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage10-api-choose-ice', expectedRevision: state.revision,
      type: 'choose_event_path', payload: { eventId: row.id, choiceId: 'ice' },
    });
    assert.equal(chosen.receipt.accepted, true);
    state = repository.loadSave('local-owner', saveId).state;
    assert.equal(state.eventProgress.find(progress => progress.eventId === row.id)?.score, 1);

    advanceThrough(row.resolvesAtMs);
    const backup = service.exportBackup(saveId);
    const imported = service.importBackup(backup, 'Stage 10 event backup copy');
    assert.ok(imported.save.saveId);
    const importedState = repository.loadSave('local-owner', imported.save.saveId).state;
    const progress = importedState.eventProgress.find(item => item.eventId === row.id)!;
    assert.equal(progress.outcome, 'success');
    assert.equal(progress.choiceId, 'ice');
    assert.equal(progress.rewardKrona, 10);
    assert.equal(importedState.calendar.find(event => event.id === row.id)?.status, 'resolved');

    advanceThrough(progress.claimExpiresAtElapsedMs!);
    const expiredImport = service.importBackup(service.exportBackup(saveId), 'Stage 10 expired claim copy');
    const expiredState = repository.loadSave('local-owner', expiredImport.save.saveId).state;
    assert.equal(expiredState.eventProgress.find(item => item.eventId === row.id)?.outcome, 'expired');
    assert.equal(expiredState.currency.some(balance => balance.currencyId === 'KRONA'), false);
  } finally {
    repository.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('chest tables scale with rarity and keep event rewards inside the matching event pool', () => {
  assert.deepEqual(CHEST_EVENT_IDS, world.eventSchedule.slice(2).map(event => event.id));
  const base = world.fieldChests[0]!;
  const rarityOrder = ['Mộc', 'Thanh Đồng', 'Bạch Ngân', 'Hoàng Kim', 'Hạo Nguyệt'] as const;
  const fieldTables = rarityOrder.map(grade => lootTableForChest({ ...base, grade }));
  assert.deepEqual(fieldTables.map(table => table.rollCount), [1, 1, 2, 2, 3]);
  assert.equal(fieldTables[0]!.entries.some(item => item.templateId === 'WOOD'), true);
  assert.equal(fieldTables.at(-1)!.ruleVersion, CHEST_LOOT_RULE_VERSION);
  const eventTables = rarityOrder.map(grade => lootTableForChest({
    ...base, id: `EVT-CHEST-${grade}`, chestType: 'event', eventId: 'EV02-DRAGON-REVIVAL', grade,
  }));
  assert.deepEqual(eventTables.map(table => table.rollCount), [1, 1, 2, 2, 3]);
  for (const table of eventTables) {
    assert.ok(table.entries.every(entry => entry.eventId === 'EV02-DRAGON-REVIVAL'
      && (entry.templateId === 'EVENT-RELIC-EV02-DRAGON-REVIVAL' || entry.templateId === 'EVENT-MARK-EV02-DRAGON-REVIVAL')));
    assert.equal(table.entries.reduce((sum, entry) => sum + entry.weightPermille, 0), 1_000);
  }
  for (const eventId of CHEST_EVENT_IDS) for (const grade of rarityOrder) {
    const table = lootTableForChest({ ...base, id: `EVT-CHEST-${eventId}-${grade}`, chestType: 'event', eventId, grade });
    assert.ok(table.entries.every(entry => entry.eventId === eventId
      && (entry.templateId === `EVENT-RELIC-${eventId}` || entry.templateId === `EVENT-MARK-${eventId}`)));
    assert.equal(table.entries.reduce((sum, entry) => sum + entry.weightPermille, 0), 1_000);
  }
  const moonOdds = chestLootOdds(eventTables.at(-1)!);
  assert.ok(moonOdds.find(entry => entry.templateId === 'EVENT-RELIC-EV02-DRAGON-REVIVAL')!.chanceAtLeastOncePermille > 999 - 500);
  const eventChest = { ...base, id: 'EVT-CHEST-DETERMINISTIC', chestType: 'event' as const, eventId: 'EV02-DRAGON-REVIVAL', grade: 'Hạo Nguyệt' as const };
  const first = deterministicChestOutcome('committed-seed', eventChest);
  assert.deepEqual(deterministicChestOutcome('committed-seed', eventChest), first);
  assert.ok(first.rewardStacks.every(stack => stack.templateId.includes('EV02-DRAGON-REVIVAL')));
});

test('opening an event chest delivers only scoped event rewards and contributes to that active event', () => {
  const baseWorld = structuredClone(world);
  const row = baseWorld.eventSchedule.find(event => event.id === 'EV03-ICE-HORN')!;
  const chest = {
    ...baseWorld.fieldChests[0]!,
    id: 'STAGE10-EVENT-CHEST', cacheId: 'STAGE10-EVENT-CACHE', chestType: 'event' as const,
    eventId: row.id, grade: 'Mộc' as const, position: { xMm: 0, yMm: 0 }, lootCommitment: 'stage10-event-chest-commitment',
  };
  const eventWorld = { ...baseWorld, fieldChests: [...baseWorld.fieldChests, chest] };
  let state = freshState();
  state.simElapsedMs = row.opensAtMs;
  state.player.position = chest.position;
  state.player.location = { kind: 'field', coordinate: chest.position };
  state.playerKnowledge.knownChestIds = [...state.playerKnowledge.knownChestIds, chest.id];
  state.fieldChestStates = [...state.fieldChestStates, {
    chestId: chest.id, state: 'unopened', openedAtElapsedMs: null, discovery: 'identified',
    discoveredAtElapsedMs: row.opensAtMs, signalId: null, custody: 'world', claimedById: null, carrierId: null,
  }];
  state.calendar = state.calendar.map(event => event.id === row.id
    ? { ...event, status: 'active', openReceiptSequence: 1 }
    : event);

  const result = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'stage10-open-event-chest', expectedRevision: state.revision,
    type: 'open_cache', payload: { actorId: state.player.id, chestId: chest.id },
  }, eventWorld);
  assert.equal(result.receipt.accepted, true, result.receipt.code);
  const inventory = result.state.inventory.containers.find(container => container.location.kind === 'carried' && container.location.ownerId === state.player.id)!;
  const delivered = inventory.stacks.filter(stack => stack.itemId.startsWith(`CHEST-ITEM-${chest.id}-`));
  assert.equal(delivered.length, 1);
  assert.ok(delivered.every(stack => stack.templateId === `EVENT-RELIC-${row.id}` || stack.templateId === `EVENT-MARK-${row.id}`));
  assert.ok(delivered.every(stack => stack.exclusiveEventId === row.id && stack.expiresAtElapsedMs === row.resolvesAtMs));
  assert.equal(result.state.eventProgress.find(progress => progress.eventId === row.id)?.score, 5);
  assert.ok(result.events.some(event => event.type === 'event_objective_progressed' && event.payload.eventId === row.id));
});

test('wildlife groups conserve ecology counts and only renewable herbivore groups replenish within their original capacity', () => {
  const wildlife = initialWildlifeState(world);
  assert.equal(wildlife.ruleVersion, WILDLIFE_RULE_VERSION);
  for (const ecology of world.ecology) for (const [populationKey, count] of Object.entries(ecology.counts)) {
    const represented = wildlife.groups.filter(group => group.ecologyId === ecology.id && group.populationKey === populationKey)
      .reduce((sum, group) => sum + group.capacity, 0);
    assert.equal(represented + (ecology.id === 'ECO-LL01-R0' && populationKey === 'thỏ_băng' ? 1 : 0), count,
      `${ecology.id}/${populationKey} remains conserved with the separately authored opening hare`);
  }
  const state = freshState();
  const herbivore = state.wildlife.groups.find(group => /thỏ|hươu|bò|thú_ăn_cỏ/u.test(group.populationKey))!;
  const predator = state.wildlife.groups.find(group => /sói|cáo|gấu|predator/u.test(group.populationKey))!;
  state.wildlife = { ...state.wildlife, groups: state.wildlife.groups.map(group => group.id === herbivore.id || group.id === predator.id
    ? { ...group, remaining: Math.max(0, group.capacity - 1) } : group) };
  const replenished = replenishWildlife(state, DAY_MS);
  assert.equal(state.wildlife.groups.find(group => group.id === herbivore.id)?.remaining, herbivore.capacity);
  assert.equal(state.wildlife.groups.find(group => group.id === predator.id)?.remaining, predator.capacity - 1);
  assert.ok(replenished.some(change => change.groupId === herbivore.id && change.amount === 1));
  assert.ok(!replenished.some(change => change.groupId === predator.id));
  assert.equal(state.wildlife.nextReplenishmentAtElapsedMs, 2 * DAY_MS);
});

test('area search discovers a finite wildlife group and a committed kill creates a corpse, XP and a population decrement', () => {
  let state = freshState();
  let group = state.wildlife.groups.find(item => item.ecologyId === 'ECO-LL01-R0' && item.remaining > 0)!;
  state.wildlife = { ...state.wildlife, groups: state.wildlife.groups.map(item => item.id === group.id
    ? { ...item, position: state.player.position } : item) };
  const search = submit(state, 'stage10-search-wildlife', 'search', { actorId: state.player.id, center: state.player.position, radiusMm: 1_000 });
  assert.equal(search.receipt.accepted, true);
  state = advanceTo(search.state, 30 * 60_000, { maxBoundaries: 10_000 }, world).state;
  group = state.wildlife.groups.find(item => item.id === group.id)!;
  assert.equal(group.discovery, 'known');
  assert.ok(state.playerKnowledge.knownWildlifeGroupIds?.includes(group.id));
  const entity = projectPlayerView(state, world).visibleMap.entities.find(item => item.ref.type === 'wildlife' && item.ref.id === group.id)!;
  assert.ok(entity);
  assert.ok(previewCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'stage10-wildlife-move-preview', expectedRevision: state.revision,
    type: 'move', payload: { actorId: state.player.id, destinationId: group.id },
  }, world).enabled);

  const inspected = submit(state, 'stage10-inspect-rook', 'inspect_entity', { entity: { type: 'corpse', id: STAGE07_OPENING_CORPSE_ID } });
  assert.equal(inspected.receipt.accepted, true, inspected.receipt.code);
  state = inspected.state;
  const revived = submit(state, 'stage10-revive-rook', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(revived.receipt.accepted, true, revived.receipt.code);
  state = revived.state;
  const hunter = state.ownedUnits.find(unit => unit.creationRoute === 'DIRECT_TU_PHUC')!;
  state = submit(state, 'stage10-equip-spear', 'equip', { unitId: hunter.id, itemId: STAGE07_OPENING_SPEAR_ID, slotId: 'MAIN_HAND' }).state;
  state = submit(state, 'stage10-equip-cloak', 'equip', { unitId: hunter.id, itemId: STAGE07_OPENING_CLOAK_ID, slotId: 'BODY' }).state;
  group = state.wildlife.groups.find(item => item.id === group.id)!;
  const hunt = submit(state, 'stage10-hunt-wildlife', 'attack', { actorIds: [hunter.id], targetId: `TARGET-${group.id}` });
  assert.equal(hunt.receipt.accepted, true, hunt.receipt.code);
  const before = group.remaining;
  const settled = advanceTo(hunt.state, hunt.state.simElapsedMs + HOUR_MS, { maxBoundaries: 10_000 }, world);
  state = settled.state;
  const after = state.wildlife.groups.find(item => item.id === group.id)!;
  assert.equal(after.remaining, before - 1);
  assert.ok(state.corpses.some(corpse => corpse.actorId.startsWith(`ACTOR-${group.id}-`)));
  assert.ok(settled.events.some(event => event.type === 'combat_encounter_won' && event.payload.wildlifeGroupId === group.id));
});
