import assert from 'node:assert/strict';
import test from 'node:test';
import type { GameState } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { canonicalStateHash } from '../src/hash.ts';
import { createNewGame } from '../src/initializer.ts';
import { OPENING_LEVEL_CLOSES_AT_MS } from '../src/openingRanking.ts';
import { reduceCommand } from '../src/reducer.ts';
import { settleOpeningLevelRank } from '../src/stage08.ts';

let serial = 0;
function freshState(): GameState {
  serial += 1;
  return createNewGame({
    saveId: `opening-reward-handler-${serial}`,
    campaignId: `opening-reward-handler-campaign-${serial}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `opening-reward-handler-seed-${serial}`,
  }, world);
}

function playerLevelTenReceipt(at: number) {
  return {
    id: `TEST-LEVEL-10-${at}`, transactionKind: 'OWNER_XP_MIRROR' as const,
    sourceEventId: `TEST-LEVEL-10-${at}`, sourceTransactionId: null, sourceRecipientId: null,
    recipientId: 'LI_LAN', sourceCategory: 'combat' as const, templateId: 'TEST-LEVEL-10',
    grossXp: 50_000, netXp: 50_000, contributionShare: 1,
    modifiers: { gap: 1, novelty: 1, risk: 1, antiFarm: 1 }, occurredAtElapsedMs: at,
    ruleVersion: 'TEST-ONLY', levelBefore: 9, xpBefore: 0, thresholdsCrossed: [10],
    levelAfter: 10, xpAfter: 0, growthDelta: {},
  };
}

function settleAtClose(receiptAt: number): GameState {
  const state = freshState();
  state.simElapsedMs = OPENING_LEVEL_CLOSES_AT_MS;
  state.player.level = 10;
  state.progression = { transactions: [playerLevelTenReceipt(receiptAt)], mirrorReceiptKeys: [] };
  assert.equal(settleOpeningLevelRank(state, OPENING_LEVEL_CLOSES_AT_MS)?.type, 'event_rank_settled');
  return state;
}

test('opening qualification uses the exact T+144h cutoff and settlement stays frozen at T+168h', () => {
  const onBoundary = settleAtClose(OPENING_LEVEL_CLOSES_AT_MS);
  assert.ok(onBoundary.stage08.rankSnapshots[0]!.rows.some(row => row.playerId === onBoundary.player.id));
  const frozenHash = onBoundary.stage08.rankSnapshots[0]!.snapshotSha256;
  onBoundary.simElapsedMs = 168 * 60 * 60_000;
  assert.equal(settleOpeningLevelRank(onBoundary, OPENING_LEVEL_CLOSES_AT_MS), null);
  assert.equal(onBoundary.stage08.rankSnapshots[0]!.snapshotSha256, frozenHash);
  assert.throws(() => settleOpeningLevelRank(onBoundary, OPENING_LEVEL_CLOSES_AT_MS + 1), /OPENING_RANK_SETTLEMENT_BOUNDARY_INVALID/);

  const afterBoundary = settleAtClose(OPENING_LEVEL_CLOSES_AT_MS + 1);
  assert.equal(afterBoundary.stage08.rankSnapshots[0]!.rows.some(row => row.playerId === afterBoundary.player.id), false);
});

test('a claimed opening MEAT reward has a player consumption contract', () => {
  const state = settleAtClose(OPENING_LEVEL_CLOSES_AT_MS);
  const claim = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'opening-meat-claim', expectedRevision: state.revision,
    type: 'claim_opening_rank_reward', payload: { boardId: 'OPENING_LEVEL' },
  }, world);
  assert.equal(claim.receipt.accepted, true);
  const stack = claim.state.inventory.containers.flatMap(container => container.stacks).find(item => item.templateId === 'MEAT');
  assert.ok(stack);
  assert.equal(stack.foodUnitsPerItem, 1);
  const container = claim.state.inventory.containers.find(item => item.stacks.some(row => row.itemId === stack.itemId))!;
  const consumed = reduceCommand(claim.state, {
    schemaVersion: 1, saveId: claim.state.saveId, commandId: 'opening-meat-consume', expectedRevision: claim.state.revision,
    type: 'consume_item', payload: { actorId: claim.state.player.id, containerId: container.id, itemId: stack.itemId, quantity: 1 },
  }, world);
  assert.equal(consumed.receipt.accepted, true);
  assert.equal(consumed.events[0]?.type, 'inventory_food_consumed');
  assert.equal(consumed.events[0]?.payload.foodUnits, 1);
  assert.equal(consumed.state.inventory.containers.flatMap(item => item.stacks).find(item => item.itemId === stack.itemId)?.quantity, stack.quantity - 1);
});

test('a frozen reward slot can resume when its item handler becomes available', () => {
  const state = settleAtClose(OPENING_LEVEL_CLOSES_AT_MS);
  const snapshot = state.stage08.rankSnapshots[0]!;
  const rows = snapshot.rows.map(row => row.playerId !== state.player.id ? row : {
    ...row,
    rewardItems: row.rewardItems.map((item, index) => index === 0
      ? { ...item, status: 'blocked' as const, blocker: 'TEMPORARY_HANDLER_UNAVAILABLE' }
      : item),
  });
  state.stage08.rankSnapshots = [{ ...snapshot, rows,
    snapshotSha256: canonicalStateHash({ boardId: snapshot.boardId, sourceContract: snapshot.sourceContract,
      settledAtElapsedMs: snapshot.settledAtElapsedMs, rows }) }];

  const resumed = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'resume-opening-meat-slot', expectedRevision: state.revision,
    type: 'claim_opening_rank_reward', payload: { boardId: 'OPENING_LEVEL' },
  }, world);
  assert.equal(resumed.receipt.accepted, true);
  assert.ok(resumed.state.inventory.containers.flatMap(container => container.stacks)
    .some(item => item.templateId === 'MEAT' && item.itemId.startsWith('OPENING-REWARD-')));
  assert.ok(resumed.state.stage08.rewardClaimReceipts.some(receipt => receipt.includes('|SLOT|')));
});
