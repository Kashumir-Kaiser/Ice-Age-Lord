import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { createNewGame } from '../src/initializer.ts';
import { advanceTo, HOUR_MS } from '../src/time.ts';
import { reduceCommand } from '../src/reducer.ts';
import { claimOpeningLevelReward, settleOpeningLevelRank, verifyStage08State } from '../src/stage08.ts';
import { OPENING_LEVEL_RIVALS, openingRivalStartingResources } from '../src/openingRanking.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import { projectPlayerView } from '../src/view.ts';
import type { GameState } from '../../contracts/src/index.ts';

let serial = 0;
function freshState(): GameState {
  serial += 1;
  return createNewGame({
    saveId: `opening-runtime-${serial}`,
    campaignId: `opening-runtime-campaign-${serial}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: `opening-runtime-seed-${serial}`,
  }, world);
}

function levelTenTransaction(at: number) {
  return {
    id: `TEST-PLAYER-LEVEL-10-${at}`, transactionKind: 'OWNER_XP_MIRROR' as const,
    sourceEventId: `TEST-PLAYER-LEVEL-10-${at}`, sourceTransactionId: null, sourceRecipientId: null,
    recipientId: 'LI_LAN', sourceCategory: 'combat' as const, templateId: 'TEST-LEVEL-10',
    grossXp: 50_000, netXp: 50_000, contributionShare: 1,
    modifiers: { gap: 1, novelty: 1, risk: 1, antiFarm: 1 }, occurredAtElapsedMs: at,
    ruleVersion: 'TEST-ONLY', levelBefore: 9, xpBefore: 0, thresholdsCrossed: [10],
    levelAfter: 10, xpAfter: 0, growthDelta: {},
  };
}

test('rival action ledgers, resource use, level completions and rank hashes are stable across time-step sizes', () => {
  const oneShotStart = freshState();
  const oneShot = advanceTo(oneShotStart, 144 * HOUR_MS).state;
  let stepped = freshState();
  for (let hour = 1; hour <= 144; hour += 1) stepped = advanceTo(stepped, hour * HOUR_MS).state;

  assert.equal(oneShot.stage08.openingRivals.length, 9);
  assert.ok(oneShot.stage08.openingRivals.some(rival => rival.actionLedger.length > 0));
  assert.ok(oneShot.stage08.rankSnapshots[0]?.rows.length >= 5, 'the fixed P0 field supports a real, non-empty rival board without choosing the player rank');
  for (const rival of oneShot.stage08.openingRivals) {
    assert.equal(rival.actionsTaken, rival.actionLedger.length);
    assert.ok(rival.actionLedger.every(action => action.xpAwarded >= 0 && action.resourcesAfter.prey <= action.resourcesBefore.prey));
    const profile = OPENING_LEVEL_RIVALS.find(item => item.id === rival.contenderId)!;
    assert.ok(rival.resources.rations < 12 + Math.floor(profile.supply / 4), 'the finite ration store is consumed on the scheduled meal boundary');
    assert.ok(rival.resources.prey < openingRivalStartingResources(profile).prey, 'successful hunts debit a finite starting field');
  }
  assert.deepEqual(stepped.stage08.openingRivals, oneShot.stage08.openingRivals);
  assert.deepEqual(stepped.stage08.rankSnapshots, oneShot.stage08.rankSnapshots);
  verifyStage08State(oneShot);
  const view = projectPlayerView(oneShot, world);
  assert.equal(view.stage08.openingBoard.status, 'closed');
  assert.equal(view.stage08.openingBoard.rows.length, oneShot.stage08.rankSnapshots[0]?.rows.length);
});

test('opening rank settlement freezes source reward bands; claim creates the committed items once', () => {
  const state = freshState();
  state.simElapsedMs = 144 * HOUR_MS;
  state.player.level = 10;
  state.progression = { transactions: [levelTenTransaction(30 * HOUR_MS)], mirrorReceiptKeys: [] };
  state.stage08.openingRivals = state.stage08.openingRivals.map(rival => rival.contenderId === 'RC-004'
    ? { ...rival, level: 10, xp: 0, completionAtElapsedMs: 20 * HOUR_MS, nextActionAtElapsedMs: null }
    : rival);
  const rankEvent = settleOpeningLevelRank(state, 144 * HOUR_MS);
  assert.equal(rankEvent?.type, 'event_rank_settled');
  const snapshot = state.stage08.rankSnapshots[0]!;
  const playerRow = snapshot.rows.find(row => row.playerId === state.player.id)!;
  assert.equal(playerRow.rank, 2);
  assert.equal(playerRow.rewardBandId, 'RANK_2');
  assert.ok(playerRow.rewardItems.some(item => item.status === 'blocked' && item.blocker === 'SOURCE_CANDIDATE_POOL_NOT_COMPILED'));
  const beforeHash = snapshot.snapshotSha256;

  const command = {
    schemaVersion: 1, saveId: state.saveId, commandId: 'claim-opening-rank-1', expectedRevision: state.revision,
    type: 'claim_opening_rank_reward', payload: { boardId: 'OPENING_LEVEL' },
  };
  const claim = reduceCommand(state, command, world);
  assert.equal(claim.receipt.accepted, true);
  assert.equal(claim.events[0]?.type, 'opening_rank_reward_claimed');
  assert.equal(claim.state.stage08.rankSnapshots[0]?.snapshotSha256, beforeHash, 'claim does not rewrite the frozen settlement');
  const claimedItems = claim.state.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.itemId.startsWith('OPENING-REWARD-LI_LAN-'));
  assert.ok(claimedItems.some(item => item.templateId === 'MEAT' && item.quantity === 100));
  assert.ok(claimedItems.some(item => item.templateId === 'BASIC_MEDICINE' && item.quantity === 10));

  const reloaded = upgradeGameState(claim.state, world);
  verifyStage08State(reloaded);
  const retry = reduceCommand(reloaded, { ...command, commandId: 'claim-opening-rank-2', expectedRevision: reloaded.revision }, world);
  assert.equal(retry.receipt.accepted, false);
  assert.equal(retry.receipt.code, 'OPENING_REWARD_ALREADY_CLAIMED');
  assert.equal(retry.state.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.itemId.startsWith('OPENING-REWARD-LI_LAN-')).length, claimedItems.length);
  assert.equal(claimOpeningLevelReward(reloaded, 'retry', 'OPENING_LEVEL').code, 'OPENING_REWARD_ALREADY_CLAIMED');
});

test('schema 9 migration backfills the open race but preserves an already blocked historical settlement', () => {
  const active = freshState() as unknown as Record<string, any>;
  active.schemaVersion = 9;
  active.simElapsedMs = 48 * HOUR_MS;
  delete (active.stage08 as Partial<GameState['stage08']>).openingRivals;
  const migratedActive = upgradeGameState(active, world);
  assert.equal(migratedActive.schemaVersion, 11);
  assert.equal(migratedActive.simElapsedMs, 48 * HOUR_MS);
  assert.ok(migratedActive.stage08.openingRivals.some(rival => rival.actionsTaken > 0), 'the race catches up from T0 through its versioned action schedule');

  const historical = freshState() as unknown as Record<string, any>;
  historical.schemaVersion = 9;
  historical.simElapsedMs = 144 * HOUR_MS;
  historical.stage08.rewardClaimReceipts = ['historic-reward-contract'];
  historical.stage08.rankSnapshots = [{
    boardId: 'OPENING_LEVEL', status: 'blocked', settledAtElapsedMs: 144 * HOUR_MS,
    sourceContract: 'LEGACY-OPENING-RANK', reasonCode: 'LEGACY_SETTLEMENT_BLOCKED', rows: [], snapshotSha256: 'legacy-hash',
  }];
  delete (historical.stage08 as Partial<GameState['stage08']>).openingRivals;
  const migratedHistorical = upgradeGameState(historical, world);
  assert.equal(migratedHistorical.schemaVersion, 11);
  assert.deepEqual(migratedHistorical.stage08.rankSnapshots, historical.stage08.rankSnapshots, 'migration does not replace or settle a frozen legacy result');
  assert.deepEqual(migratedHistorical.stage08.rewardClaimReceipts, ['historic-reward-contract']);
  assert.equal(migratedHistorical.stage08.openingRivals.length, 0, 'a closed legacy window is never replayed to manufacture a new payout');
});
