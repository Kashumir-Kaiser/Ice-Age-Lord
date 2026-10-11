import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { GameApplicationService } from '../../api/src/service.ts';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { eventRuntimeReadiness } from '../../content/src/eventReadiness.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';
import { createNewGame } from '../src/initializer.ts';
import { advanceTo, HOUR_MS } from '../src/time.ts';
import { reduceCommand } from '../src/reducer.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { projectPlayerView } from '../src/view.ts';
import { verifyStage08State, CARAVAN_SALT_AUCTION_ID, MARKET_BREAD_OFFER_ID, Q08_ID, settleOpeningLevelRank } from '../src/stage08.ts';
import type { GameState, ScheduledEventState } from '../../contracts/src/index.ts';

let serial = 0;
const timeline = JSON.parse(readFileSync(resolve(process.cwd(), 'data/events/EVENT-TIMELINE-v0.6.json'), 'utf8')) as {
  event_schedule: Array<{ event_id: string; opens_at: string; locks_at: string; resolves_at: string }>;
};

function freshState(): GameState {
  serial += 1;
  return createNewGame({
    saveId: `stage08-save-${serial}`,
    campaignId: `stage08-campaign-${serial}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `stage08-seed-${serial}`,
  }, world);
}

function elapsedFromSource(value: string): number {
  const match = /^T0\+(\d+)h$/u.exec(value);
  assert.ok(match, `Unexpected fixed timeline time: ${value}`);
  return Number(match[1]) * HOUR_MS;
}

function isolatedEventState(eventId: string, elapsed: number, status: ScheduledEventState['status'] = 'scheduled'): GameState {
  const state = freshState();
  state.simElapsedMs = elapsed;
  state.stage08.enabled = false;
  state.calendar = state.calendar.map(event => event.id === eventId
    ? { ...event, status: eventId === 'EV00-SAFE-FIRE' && status === 'scheduled' ? 'active' : status,
      openReceiptSequence: eventId === 'EV00-SAFE-FIRE' && status === 'scheduled' ? 1 : null,
      lockReceiptSequence: null, blockedReceiptSequence: null, resolutionReceiptSequence: null }
    : { ...event, status: 'cancelled', openReceiptSequence: null, lockReceiptSequence: null, blockedReceiptSequence: null, resolutionReceiptSequence: null });
  state.timeBoundaries = {
    nextHourlySettlementAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextMidnightAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextDailySettlementAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextSunsetAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextTwilightEndAtElapsedMs: Number.MAX_SAFE_INTEGER,
    nextDawnAtElapsedMs: Number.MAX_SAFE_INTEGER,
    protectionExpiryAtElapsedMs: null,
  };
  if (eventId === 'EV00-SAFE-FIRE') {
    state.lastEventSequence = 1;
    state.territory.survivalFire.protectionStatus = 'active';
  }
  return state;
}

function advanceWithSequence(state: GameState, target: number) {
  const result = advanceTo(state, target, { maxBoundaries: 10_000 });
  result.state.lastEventSequence = state.lastEventSequence + result.events.length;
  return result;
}

function runCommand(state: GameState, type: string, payload: Record<string, unknown>, commandId: string) {
  return reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload,
  }, world);
}

test('the runtime compiles exactly the thirty adopted v0.6 rows and creates no recurrence', () => {
  assert.equal(world.eventSchedule.length, 30);
  assert.equal(timeline.event_schedule.length, 30);
  assert.deepEqual(world.eventSchedule.map(row => row.id), timeline.event_schedule.map(row => row.event_id));
  for (const [index, row] of timeline.event_schedule.entries()) {
    const compiled = world.eventSchedule[index];
    assert.equal(compiled.opensAtMs, elapsedFromSource(row.opens_at), `${row.event_id} open`);
    assert.equal(compiled.locksAtMs, elapsedFromSource(row.locks_at), `${row.event_id} lock`);
    assert.equal(compiled.resolvesAtMs, elapsedFromSource(row.resolves_at), `${row.event_id} resolution`);
    assert.ok(compiled.displayName.length > 0);
  }
  assert.equal(new Set(world.eventSchedule.map(row => row.opensAtMs)).size, world.eventSchedule.length, 'fixed opens do not collide');
  assert.equal(eventRuntimeReadiness('EV00-SAFE-FIRE'), 'executable_lifecycle');
  assert.equal(eventRuntimeReadiness('EV01-OPENING-LEVEL'), 'settlement_blocked');
  for (const event of world.eventSchedule.slice(2)) assert.equal(eventRuntimeReadiness(event.id), 'mandatory_content_blocked');
});

test('all thirty calendar rows honor exact open, lock and resolution boundaries with unique receipts', () => {
  for (const source of timeline.event_schedule) {
    const schedule = world.eventSchedule.find(row => row.id === source.event_id)!;
    let state = isolatedEventState(schedule.id, Math.max(0, schedule.opensAtMs - 1));
    const lifecycleEventIds = new Set<string>();
    let lifecycleEvents: ReturnType<typeof advanceTo>['events'][number][] = [];

    if (schedule.opensAtMs > 0) {
      const beforeOpen = advanceWithSequence(state, schedule.opensAtMs - 1);
      state = beforeOpen.state;
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'scheduled', `${schedule.id} remains closed immediately before open`);
    }
    if (schedule.id === 'EV00-SAFE-FIRE') {
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'active', 'EV00 is active from the actual save-opening receipt');
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.openReceiptSequence, 1);
      lifecycleEvents.push({ type: 'opening_protection_started', occurredAtElapsedMs: 0, payload: { eventId: schedule.id } });
      lifecycleEventIds.add('opening_protection_started');
    } else {
      const opened = advanceWithSequence(state, schedule.opensAtMs);
      state = opened.state;
      lifecycleEvents.push(...opened.events);
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'active', `${schedule.id} opens at its boundary`);
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.openReceiptSequence, state.lastEventSequence);
      assert.deepEqual(opened.events.filter(event => event.payload.eventId === schedule.id).map(event => event.type), ['event_calendar_opened']);
      lifecycleEventIds.add('event_calendar_opened');
    }

    let expectedResolutionSequence: number | null = null;

    if (schedule.locksAtMs > schedule.opensAtMs) {
      const beforeLock = advanceWithSequence(state, schedule.locksAtMs - 1);
      state = beforeLock.state;
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'active', `${schedule.id} remains open immediately before lock`);
      const sequenceBeforeLock = state.lastEventSequence;
      const locked = advanceWithSequence(state, schedule.locksAtMs);
      state = locked.state;
      const lockEventIndex = locked.events.findIndex(event => event.type === 'event_calendar_locked' && event.payload.eventId === schedule.id);
      lifecycleEvents.push(...locked.events);
      assert.ok(lockEventIndex >= 0, `${schedule.id} has a lock event at its authored boundary`);
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.lockReceiptSequence,
        sequenceBeforeLock + lockEventIndex + 1);
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, schedule.resolvesAtMs === schedule.locksAtMs ? 'resolved' : 'locked');
      const sameBoundaryResolutionIndex = locked.events.findIndex(event => event.type === 'event_calendar_resolved' && event.payload.eventId === schedule.id);
      if (sameBoundaryResolutionIndex >= 0) expectedResolutionSequence = sequenceBeforeLock + sameBoundaryResolutionIndex + 1;
      lifecycleEventIds.add('event_calendar_locked');
    }

    if (schedule.resolvesAtMs > schedule.locksAtMs) {
      const beforeResolve = advanceWithSequence(state, schedule.resolvesAtMs - 1);
      state = beforeResolve.state;
      assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'locked', `${schedule.id} remains locked immediately before settlement`);
    }
    const sequenceBeforeResolve = state.lastEventSequence;
    const resolved = advanceWithSequence(state, schedule.resolvesAtMs);
    state = resolved.state;
    const resolutionEventIndex = resolved.events.findIndex(event => event.type === 'event_calendar_resolved' && event.payload.eventId === schedule.id);
    lifecycleEvents.push(...resolved.events);
    assert.equal(state.calendar.find(row => row.id === schedule.id)?.status, 'resolved', `${schedule.id} resolves at its boundary`);
    if (resolutionEventIndex >= 0) expectedResolutionSequence = sequenceBeforeResolve + resolutionEventIndex + 1;
    assert.ok(lifecycleEvents.some(event => event.type === 'event_calendar_resolved' && event.payload.eventId === schedule.id), `${schedule.id} has a resolution receipt at its authored boundary`);
    assert.equal(state.calendar.find(row => row.id === schedule.id)?.resolutionReceiptSequence, expectedResolutionSequence);
    assert.equal(new Set([
      state.calendar.find(row => row.id === schedule.id)?.openReceiptSequence,
      state.calendar.find(row => row.id === schedule.id)?.lockReceiptSequence,
      state.calendar.find(row => row.id === schedule.id)?.resolutionReceiptSequence,
    ].filter(value => value !== null)).size, 3);
    assert.ok(lifecycleEvents.filter(event => event.payload.eventId === schedule.id).every(event =>
      ['opening_protection_started', 'event_calendar_opened', 'event_calendar_locked', 'event_calendar_resolved'].includes(event.type)));
    assert.equal(state.currency.length, 0, 'calendar settlement cannot mint event currency');
    assert.ok(state.quests.every(quest => quest.state === 'dormant'), 'calendar settlement cannot advance quests');

    const after = advanceWithSequence(state, schedule.resolvesAtMs + 1);
    assert.equal(after.state.calendar.find(row => row.id === schedule.id)?.status, 'resolved');
    assert.equal(after.events.filter(event => event.payload.eventId === schedule.id).length, 0, 'settled rows do not recur');
    assert.ok(lifecycleEventIds.size >= 2);
  }
});

test('the fixed caravan quest settles its recorded reward, permanent market purchase, and cancellable auction escrow atomically', () => {
  let state = freshState();
  state = advanceWithSequence(state, 122 * HOUR_MS).state;
  assert.equal(state.stage08.caravan.status, 'distressed');
  const bridge = world.sites.find(site => site.id === 'SITE-LL01-049')!;
  state.player.position = bridge.position;
  state.player.location = { kind: 'site', siteId: bridge.id };

  const acceptEnvelope = { schemaVersion: 1, saveId: state.saveId, commandId: 'stage08-q08-accept', expectedRevision: state.revision,
    type: 'accept_quest', payload: { questId: Q08_ID } };
  const accepted = reduceCommand(state, acceptEnvelope, world);
  assert.equal(accepted.receipt.accepted, true);
  state = accepted.state;
  const acceptedAgain = reduceCommand(state, acceptEnvelope, world);
  assert.equal(acceptedAgain.receipt.accepted, true);
  assert.equal(acceptedAgain.state.stage08.caravan.grainSacks, 18, 'replaying the same command cannot consume cargo twice');

  const negotiated = runCommand(state, 'negotiate_caravan', { questId: Q08_ID, route: 'trade_one_grain_sack' }, 'stage08-q08-negotiate');
  assert.equal(negotiated.receipt.accepted, true);
  state = negotiated.state;
  assert.equal(state.stage08.caravan.grainSacks, 17, 'the authored negotiation branch consumes one real cargo sack');
  const escorted = runCommand(state, 'escort_caravan', { questId: Q08_ID }, 'stage08-q08-escort');
  assert.equal(escorted.receipt.accepted, true);
  state = escorted.state;
  const arrivalAt = state.stage08.caravan.arrivalAtElapsedMs!;
  assert.ok(arrivalAt <= 126 * HOUR_MS, 'the fixed pace reaches the town before the quest closes');
  state = advanceWithSequence(state, arrivalAt).state;
  assert.equal(state.stage08.caravan.status, 'arrived');
  assert.equal(state.quests.find(quest => quest.questId === Q08_ID)?.rewardStatus, 'pending');
  assert.equal(state.stage08.marketOffers[0]?.id, MARKET_BREAD_OFFER_ID);

  const town = world.sites.find(site => site.id === 'SITE-LL01-046')!;
  state.player.position = town.position;
  state.player.location = { kind: 'site', siteId: town.id };
  state.inventory.containers = state.inventory.containers.map(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01'
    ? { ...container, observed: true }
    : container);
  const claimed = runCommand(state, 'claim_quest_reward', { questId: Q08_ID }, 'stage08-q08-claim');
  assert.equal(claimed.receipt.accepted, true);
  state = claimed.state;
  assert.equal(state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 60);
  assert.equal(state.stage08.caravan.tradeRouteUnlocked, true);
  assert.equal(state.stage08.auctionLots[0]?.id, CARAVAN_SALT_AUCTION_ID);

  const bagId = 'LL-CNT-CARRIED-FOOD-BAG-01';
  const purchaseCommand = {
    schemaVersion: 1, saveId: state.saveId, commandId: 'stage08-shop-buy-one', expectedRevision: state.revision,
    type: 'shop_transaction', payload: { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: bagId, quantity: 1 },
  };
  const purchase = runCommand(state, 'shop_transaction', purchaseCommand.payload, purchaseCommand.commandId);
  assert.equal(purchase.receipt.accepted, true);
  state = purchase.state;
  assert.equal(state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);
  assert.equal(state.stage08.marketOffers[0]?.stockRemaining, 23);
  assert.equal(state.inventory.containers.find(container => container.id === bagId)?.stacks.some(stack => stack.templateId === 'BREAD' && stack.provenance === 'versioned_game_design' && stack.quantity === 1), true);
  const purchaseReplay = runCommand(state, 'shop_transaction', purchaseCommand.payload, purchaseCommand.commandId);
  assert.equal(purchaseReplay.state.stage08.marketOffers[0]?.stockRemaining, 23, 'duplicate purchase request cannot debit or deliver twice');
  const marketBread = state.inventory.containers.find(container => container.id === bagId)!.stacks.find(stack => stack.provenance === 'versioned_game_design' && stack.templateId === 'BREAD')!;
  const consumed = runCommand(state, 'consume_item', { actorId: state.player.id, containerId: bagId, itemId: marketBread.itemId, quantity: 1 }, 'stage08-shop-bread-consume');
  assert.equal(consumed.receipt.accepted, true);
  assert.equal(consumed.state.stage08.marketOffers[0]?.consumedQuantity, 1, 'the purchased bread retains its food-consumption lineage');
  assert.equal(consumed.state.inventory.containers.find(container => container.id === bagId)?.stacks.some(stack => stack.itemId === marketBread.itemId), false);
  verifyStage08State(consumed.state);

  const fullCapacity = structuredClone(state);
  const fullContainer = fullCapacity.inventory.containers.find(container => container.id === 'LL-CNT-SUPPLY-01')!;
  fullContainer.observed = true;
  fullContainer.location = { kind: 'site', siteId: town.id };
  fullContainer.capacitySlots = fullContainer.stacks.length;
  const fullBuy = runCommand(fullCapacity, 'shop_transaction', { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: fullContainer.id, quantity: 1 }, 'stage08-shop-full-destination');
  assert.equal(fullBuy.receipt.code, 'DESTINATION_CAPACITY_FULL');
  assert.equal(fullBuy.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);

  const noFunds = structuredClone(state);
  noFunds.currency = [];
  const poorBuy = runCommand(noFunds, 'shop_transaction', { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: bagId, quantity: 1 }, 'stage08-shop-insufficient-funds');
  assert.equal(poorBuy.receipt.code, 'INSUFFICIENT_CURRENCY');
  assert.equal(poorBuy.state.stage08.marketOffers[0]?.stockRemaining, 23);

  const expired = structuredClone(state);
  expired.stage08.marketOffers = expired.stage08.marketOffers.map(offer => ({ ...offer, expiresAtElapsedMs: expired.simElapsedMs }));
  const expiredBuy = runCommand(expired, 'shop_transaction', { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: bagId, quantity: 1 }, 'stage08-shop-expired');
  assert.equal(expiredBuy.receipt.code, 'SHOP_OFFER_EXPIRED', 'the exclusive close is rejected at its exact boundary');

  const constrained = structuredClone(state);
  constrained.stage08.marketOffers = constrained.stage08.marketOffers.map(offer => ({
    ...offer, initialStock: 1, stockRemaining: 1, lifetimePurchaseLimit: 1, purchasedQuantity: 0, consumedQuantity: 0,
  }));
  const oneRemaining = { schemaVersion: 1, saveId: constrained.saveId, commandId: 'stage08-last-stock-a', expectedRevision: constrained.revision,
    type: 'shop_transaction', payload: { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: bagId, quantity: 1 } };
  const firstBuyer = runCommand(constrained, 'shop_transaction', oneRemaining.payload, oneRemaining.commandId);
  assert.equal(firstBuyer.receipt.accepted, true);
  const competingBuyer = reduceCommand(firstBuyer.state, { ...oneRemaining, commandId: 'stage08-last-stock-b' }, world);
  assert.equal(competingBuyer.receipt.code, 'STALE_REVISION', 'a simultaneous last-stock request must refresh and revalidate');
  assert.equal(competingBuyer.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 58);

  const lot = state.stage08.auctionLots[0]!;
  const bid = runCommand(state, 'place_auction_bid', { lotId: lot.id, quantity: 2, unitBid: lot.minimumUnitBid }, 'stage08-auction-bid');
  assert.equal(bid.receipt.accepted, true, `${bid.receipt.code}: ${bid.receipt.message}`);
  assert.equal(bid.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 49);
  assert.equal(bid.state.stage08.auctionLots[0]?.reservedQuantity, 2);
  assert.equal(bid.state.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.templateId === 'SALT').length, 0, 'an open bid does not create salt ownership');
  const cancelledBid = runCommand(bid.state, 'cancel_auction_bid', { bidId: 'BID-stage08-auction-bid' }, 'stage08-auction-cancel');
  assert.equal(cancelledBid.receipt.accepted, true);
  assert.equal(cancelledBid.state.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);
  assert.equal(cancelledBid.state.stage08.auctionLots[0]?.reservedQuantity, 0);

  const expiringBid = runCommand(state, 'place_auction_bid', { lotId: lot.id, quantity: 1, unitBid: lot.minimumUnitBid }, 'stage08-auction-expiring-bid');
  const expiryAt = expiringBid.state.stage08.auctionLots[0]!.closesAtElapsedMs;
  const expiredAuction = advanceWithSequence(expiringBid.state, expiryAt).state;
  assert.equal(expiredAuction.stage08.auctionLots[0]?.status, 'closed');
  assert.equal(expiredAuction.stage08.auctionBids[0]?.status, 'expired');
  assert.equal(expiredAuction.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59, 'unfilled bids return escrow at close');
  assert.equal(expiredAuction.inventory.containers.flatMap(container => container.stacks).some(stack => stack.templateId === 'SALT'), false);

  verifyStage08State(state);
  const reloadedState = upgradeGameState(state, world);
  assert.equal(reloadedState.stage08.marketOffers[0]?.purchasedQuantity, 1);
  assert.equal(reloadedState.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);
  const view = projectPlayerView(reloadedState, world);
  assert.equal(view.stage08.marketOffers[0]?.id, MARKET_BREAD_OFFER_ID);
  assert.equal(view.quests.find(quest => quest.questId === Q08_ID)?.rewardStatus, 'claimed');
});

test('the Stage 08 source path survives a SQLite restart and strict backup import after purchase', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage08-quest-trade-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  let repository = new SqliteRepository(databasePath);
  let service = new GameApplicationService(repository, world, { timersEnabled: false });
  let open = true;
  try {
    const created = service.createSave({ creationKey: 'stage08-quest-trade', slotName: 'Stage 08 quest and trade' });
    const saveId = created.save.saveId;
    const bridge = world.sites.find(site => site.id === 'SITE-LL01-049')!;
    const town = world.sites.find(site => site.id === 'SITE-LL01-046')!;
    const settleWithTestPosition = (target: number, position: typeof bridge.position, siteId: string) => repository.commitSystemTransition({
      ownerId: 'local-owner', saveId,
      transition: current => {
        const advanced = advanceTo(current, target, { maxBoundaries: 10_000 });
        const next = structuredClone(advanced.state);
        next.player.position = position;
        next.player.location = { kind: 'site', siteId };
        return {
          state: next,
          events: advanced.events.map((event, index) => ({ ...event, sequence: current.lastEventSequence + index + 1 })),
        };
      },
      projectPlayerEvent: (event, eventId, state) => (service as unknown as {
        projectSystemPlayerEvent: (candidate: typeof event, id: string, finalState: GameState) => unknown;
      }).projectSystemPlayerEvent(event, eventId, state),
    });

    settleWithTestPosition(122 * HOUR_MS, bridge.position, bridge.id);
    let state = repository.loadSave('local-owner', saveId).state;
    const accepted = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-accept', expectedRevision: state.revision,
      type: 'accept_quest', payload: { questId: Q08_ID },
    });
    state = repository.loadSave('local-owner', saveId).state;
    const negotiated = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-negotiate', expectedRevision: state.revision,
      type: 'negotiate_caravan', payload: { questId: Q08_ID, route: 'trade_one_grain_sack' },
    });
    state = repository.loadSave('local-owner', saveId).state;
    const escorted = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-escort', expectedRevision: state.revision,
      type: 'escort_caravan', payload: { questId: Q08_ID },
    });
    assert.equal(accepted.receipt.accepted && negotiated.receipt.accepted && escorted.receipt.accepted, true);
    state = repository.loadSave('local-owner', saveId).state;
    settleWithTestPosition(state.stage08.caravan.arrivalAtElapsedMs!, town.position, town.id);
    state = repository.loadSave('local-owner', saveId).state;
    const inspected = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-inspect-bag', expectedRevision: state.revision,
      type: 'inspect_starter_container', payload: { containerId: 'LL-CNT-CARRIED-FOOD-BAG-01' },
    });
    state = repository.loadSave('local-owner', saveId).state;
    const claimed = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-claim', expectedRevision: state.revision,
      type: 'claim_quest_reward', payload: { questId: Q08_ID },
    });
    state = repository.loadSave('local-owner', saveId).state;
    const purchased = await service.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-db-buy', expectedRevision: state.revision,
      type: 'shop_transaction', payload: { offerId: MARKET_BREAD_OFFER_ID, destinationContainerId: 'LL-CNT-CARRIED-FOOD-BAG-01', quantity: 1 },
    });
    assert.equal(inspected.receipt.accepted && claimed.receipt.accepted && purchased.receipt.accepted, true);
    const persisted = repository.loadSave('local-owner', saveId).state;
    assert.equal(persisted.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);
    assert.equal(persisted.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.stacks
      .some(stack => stack.templateId === 'BREAD' && stack.provenance === 'versioned_game_design'), true);
    const backup = service.exportBackup(saveId);
    const imported = service.importBackup(backup, 'Stage 08 backup validation');
    assert.ok(imported.save.saveId);

    repository.close();
    open = false;
    repository = new SqliteRepository(databasePath);
    service = new GameApplicationService(repository, world, { timersEnabled: false });
    const afterRestart = service.loadSave(saveId).state;
    assert.equal(afterRestart.stage08.caravan.status, 'arrived');
    assert.equal(afterRestart.quests.find(quest => quest.questId === Q08_ID)?.rewardStatus, 'claimed');
    assert.equal(afterRestart.stage08.marketOffers[0]?.purchasedQuantity, 1);
    assert.equal(afterRestart.currency.find(balance => balance.currencyId === 'KRONA')?.amount, 59);
    assert.equal(afterRestart.inventory.containers.find(container => container.id === 'LL-CNT-CARRIED-FOOD-BAG-01')?.stacks
      .some(stack => stack.templateId === 'BREAD' && stack.provenance === 'versioned_game_design'), true);
  } finally {
    if (open) repository.close();
    else repository.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a 5x clock settles through a restart, keeps earlier play available, then blocks exactly at EV02 without awards', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage08-calendar-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  let firstNow = 0;
  const firstRepository = new SqliteRepository(databasePath);
  let firstRepositoryOpen = true;
  const firstService = new GameApplicationService(firstRepository, world, { monotonicNow: () => firstNow, leaseMs: Number.MAX_SAFE_INTEGER, timersEnabled: false });
  let secondRepository: SqliteRepository | null = null;
  try {
    const created = firstService.createSave({ creationKey: 'stage08-restart', slotName: 'Stage 08 calendar' });
    const saveId = created.save.saveId;
    await firstService.heartbeatClock(saveId, 'stage08-session-1', 'stage08-tab-1');
    await firstService.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-start-5x', expectedRevision: created.save.revision,
      type: 'set_clock_speed', payload: { speed: '5x' },
    }, { sessionToken: 'stage08-session-1', driverId: 'stage08-tab-1' });

    firstNow = 48 * HOUR_MS / 5;
    await firstService.settleClockBeforeCommand(saveId);
    let state = firstRepository.loadSave('local-owner', saveId).state;
    assert.equal(state.simElapsedMs, 48 * HOUR_MS);
    assert.equal(state.calendar.find(event => event.id === 'EV01-OPENING-LEVEL')?.status, 'active');
    assert.equal(state.eventProgressionBlocker, null);

    const inspected = await firstService.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-earlier-gameplay', expectedRevision: state.revision,
      type: 'inspect_career_card', payload: {},
    });
    assert.equal(inspected.receipt.accepted, true, 'unrelated existing gameplay remains available before the blocker');
    firstRepository.close();
    firstRepositoryOpen = false;

    secondRepository = new SqliteRepository(databasePath);
    let secondNow = 0;
    const secondService = new GameApplicationService(secondRepository, world, { monotonicNow: () => secondNow, leaseMs: Number.MAX_SAFE_INTEGER, timersEnabled: false });
    state = secondRepository.loadSave('local-owner', saveId).state;
    assert.equal(state.simElapsedMs, 48 * HOUR_MS, 'restart does not add offline time');
    assert.equal(state.clockControl.status, 'paused', 'restart persists a pause before the next session');
    assert.equal(state.calendar.find(event => event.id === 'EV01-OPENING-LEVEL')?.status, 'active', 'reload retains the open row');

    await secondService.heartbeatClock(saveId, 'stage08-session-2', 'stage08-tab-2');
    const started = await secondService.executeCommand(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-resume-5x', expectedRevision: state.revision,
      type: 'set_clock_speed', payload: { speed: '5x' },
    }, { sessionToken: 'stage08-session-2', driverId: 'stage08-tab-2' });
    assert.equal(started.receipt.accepted, true);

    secondNow = 96 * HOUR_MS / 5;
    await secondService.settleClockBeforeCommand(saveId);
    state = secondRepository.loadSave('local-owner', saveId).state;
    assert.equal(state.simElapsedMs, 144 * HOUR_MS, 'a large clock target stops at the exact mandatory boundary');
    assert.equal(state.clockControl.status, 'paused');
    assert.equal(state.territory.survivalFire.protectionStatus, 'expired');
    assert.equal(state.calendar.find(event => event.id === 'EV00-SAFE-FIRE')?.status, 'resolved');
    assert.equal(state.calendar.find(event => event.id === 'EV01-OPENING-LEVEL')?.status, 'resolved');
    const blocked = state.calendar.find(event => event.id === 'EV02-DRAGON-REVIVAL')!;
    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.openReceiptSequence, null);
    assert.ok(blocked.blockedReceiptSequence);
    assert.equal(state.eventProgressionBlocker?.eventId, blocked.id);
    assert.equal(state.eventProgressionBlocker?.blockedAtElapsedMs, state.simElapsedMs);
    assert.equal(state.eventProgressionBlocker?.receiptSequence, blocked.blockedReceiptSequence);
    assert.ok(state.calendar.filter(event => event.status === 'resolved' && event.id !== 'EV00-SAFE-FIRE').every(event => event.resolutionReceiptSequence));
    assert.equal(state.stage08.rankSnapshots.length, 1, 'the fixed opening rank settles once at EV01 close');
    assert.equal(state.stage08.rankSnapshots[0]?.boardId, 'OPENING_LEVEL');
    assert.equal(state.stage08.rankSnapshots[0]?.status, 'blocked');
    assert.equal(state.stage08.rankSnapshots[0]?.settledAtElapsedMs, 144 * HOUR_MS);
    assert.equal(state.stage08.rankSnapshots[0]?.reasonCode, 'P0_FIXED_CONTENDER_RUNTIME_NOT_COMPILED');
    assert.equal(state.stage08.rankSnapshots[0]?.rows.length, 0, 'the player is not falsely ranked first without the frozen P0 results');
    assert.equal(settleOpeningLevelRank(state, 144 * HOUR_MS), null, 'the frozen blocked snapshot cannot settle or emit twice');
    assert.equal(state.currency.length, 0);
    assert.equal(state.offers.length, 0);
    assert.ok(state.quests.every(quest => quest.state === 'dormant'));
    const view = projectPlayerView(state, world);
    assert.deepEqual(view.calendar.map(event => event.id), ['EV00-SAFE-FIRE', 'EV01-OPENING-LEVEL', 'EV02-DRAGON-REVIVAL']);
    assert.equal(view.eventProgressionBlocker?.displayName, blocked.displayName);
    assert.deepEqual(view.quests, []);
    assert.deepEqual(view.currency, []);
    const unavailableClock = secondService.preview(saveId, {
      schemaVersion: 1, saveId, commandId: 'stage08-no-resume', expectedRevision: state.revision,
      type: 'set_clock_speed', payload: { speed: '1x' },
    }, 'stage08-session-2', 'stage08-tab-2');
    assert.equal(unavailableClock.availability.enabled, false);
    assert.equal(unavailableClock.availability.reasonCode, 'EVENT_CONTENT_BLOCKED');

    const backup = secondService.exportBackup(saveId);
    const imported = secondService.importBackup(backup, 'Stage 08 validation copy');
    assert.ok(imported.save.saveId, 'the strict backup validator accepts receipt-consistent calendar state');
  } finally {
    if (secondRepository) secondRepository.close();
    else if (firstRepositoryOpen) firstRepository.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('schema 5 migration adds pinned labels and pauses overdue rows without rewinding or duplicating the legacy EV00 receipt', () => {
  const legacy = structuredClone(freshState()) as unknown as Record<string, any>;
  legacy.schemaVersion = 5;
  legacy.simElapsedMs = 144 * HOUR_MS;
  legacy.lastEventSequence = 2;
  legacy.revision = 1;
  legacy.clockControl = { status: 'running', selection: '5x', speedPermille: 5000, stopCondition: 'none' };
  legacy.territory.survivalFire.protectionStatus = 'expired';
  legacy.eventProgressionBlocker = undefined;
  legacy.calendar = legacy.calendar.map((event: Record<string, any>) => {
    const { displayName: _displayName, lockReceiptSequence: _lockReceiptSequence, blockedReceiptSequence: _blockedReceiptSequence, ...old } = event;
    return event.id === 'EV00-SAFE-FIRE'
      ? { ...old, status: 'resolved', openReceiptSequence: 1, resolutionReceiptSequence: 2 }
      : old;
  });

  const upgraded = upgradeGameState(legacy, world);
  assert.equal(upgraded.schemaVersion, 7);
  assert.equal(upgraded.simElapsedMs, 144 * HOUR_MS, 'migration never rewinds elapsed time');
  assert.equal(upgraded.clockControl.status, 'paused');
  assert.equal(upgraded.eventProgressionBlocker?.eventId, 'EV01-OPENING-LEVEL');
  assert.equal(upgraded.calendar.find(event => event.id === 'EV01-OPENING-LEVEL')?.status, 'blocked');
  const ev00 = upgraded.calendar.find(event => event.id === 'EV00-SAFE-FIRE')!;
  assert.equal(ev00.status, 'resolved');
  assert.equal(ev00.lockReceiptSequence, null, 'legacy EV00 resolution is not reused as a lock receipt');
  assert.equal(ev00.resolutionReceiptSequence, 2);
  for (const row of upgraded.calendar) assert.equal(row.displayName, world.eventSchedule.find(source => source.id === row.id)?.displayName);
});
