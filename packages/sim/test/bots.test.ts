import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { canonicalStateHash, canonicalStateHashFromStableJson } from '../src/hash.ts';
import { createNewGame } from '../src/initializer.ts';
import { advanceTo } from '../src/time.ts';
import { reduceCommand } from '../src/reducer.ts';
import { projectPlayerView } from '../src/view.ts';
import { settleOpeningLevelRank } from '../src/stage08.ts';
import { appendBotActionReceipt, beginBotPopulationAdvance, botActionReceiptCount, botChunkHash, botPopulationRoot, botRowHash, findBotActionReceipt, forEachBotActionReceipt, finishBotPopulationAdvance, freezeBotColdRecord, verifyBotPopulation } from '../src/bots/state.ts';
import { BOT_HUNT_RULE_VERSION, botConstructionPermille, botTalentXpMultiplierPermille } from '../src/bots/state.ts';
import { botCohortPower } from '../src/bots/combat.ts';
import { BOT_P0_COUNT, BOT_TALENT_QUOTAS, botGradeAt, botKindAt, generateBotPopulation } from '../src/bots/generation.ts';
import { consumeSharedWildlifeStock } from '../src/bots/economy.ts';
import { seedSpatialKnowledge } from '../src/spatial.ts';
import type { BotActionReceipt, BotColdRecord, GameState } from '../../contracts/src/index.ts';
import { stableStringify } from '../../content/src/compiler.ts';

const HOUR_MS = 60 * 60_000;

function freshState(seed: string): GameState {
  return createNewGame({
    saveId: `bot-save-${seed}`,
    campaignId: `bot-campaign-${seed}`,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed,
  }, world);
}

function hasReceipt(cold: BotColdRecord, predicate: (receipt: BotActionReceipt) => boolean): boolean {
  let found = false;
  forEachBotActionReceipt(cold, receipt => { if (predicate(receipt)) found = true; });
  return found;
}

test('P0 generation is seeded, quota exact, S-capped, and keeps player talent separate', () => {
  const first = generateBotPopulation('bot-quota-seed', world);
  const repeat = generateBotPopulation('bot-quota-seed', world);
  const other = generateBotPopulation('bot-other-seed', world);
  verifyBotPopulation(first);
  assert.equal(Object.isFrozen(first.chunks[0]!.cold[0]), true);
  assert.equal(Object.isFrozen(first.chunks[0]!.cold[0]!.actionReceipts), true);
  assert.equal(first.botCount, BOT_P0_COUNT);
  assert.deepEqual(first.talentQuotas, BOT_TALENT_QUOTAS);
  assert.equal(first.chunkRootSha256, repeat.chunkRootSha256);
  assert.notEqual(first.chunkRootSha256, other.chunkRootSha256);
  const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  const kindCounts = { combat: 0, production: 0 };
  const ids = new Set<string>();
  for (const chunk of first.chunks) for (let offset = 0; offset < chunk.count; offset += 1) {
    gradeCounts[botGradeAt(chunk, offset)] += 1;
    kindCounts[botKindAt(chunk, offset)] += 1;
    ids.add(chunk.cold[offset]!.botId);
  }
  assert.deepEqual(gradeCounts, BOT_TALENT_QUOTAS);
  assert.equal(kindCounts.combat + kindCounts.production, BOT_P0_COUNT);
  assert.ok(Math.abs(kindCounts.combat - kindCounts.production) <= 1);
  assert.equal(botGradeAt(first.chunks[0]!, 0), 'S');
  assert.equal(botGradeAt(first.chunks[0]!, 1), 'S');
  assert.equal(botKindAt(first.chunks[0]!, 0), 'combat', 'the CONTROL-affinity S rival is the named S combat specialist');
  assert.equal(botKindAt(first.chunks[0]!, 1), 'production', 'the SUPPORT-affinity S rival is the named S production specialist');
  assert.equal(ids.size, BOT_P0_COUNT);
  for (let ordinal = 1; ordinal <= 9; ordinal += 1) assert.equal(ids.has(`RC-${String(ordinal + 1).padStart(3, '0')}`), true);
  assert.equal(freshState('player-talent').player.talent.grade, 'SSS');
});

test('talent rank and specialty change XP on committed actions with a large S combat advantage', () => {
  const sCombat = botTalentXpMultiplierPermille('S', 'combat');
  const sProduction = botTalentXpMultiplierPermille('S', 'production');
  assert.equal(sCombat, 2_000);
  assert.equal(sProduction, 650);
  assert.ok(sCombat >= sProduction * 3, 'an S combat talent should earn at least three times an S production talent per equal action');
  assert.ok(botTalentXpMultiplierPermille('A', 'combat') > botTalentXpMultiplierPermille('B', 'combat'));
  assert.ok(botTalentXpMultiplierPermille('A', 'production') < botTalentXpMultiplierPermille('B', 'production'));
});

test('compact receipt pages preserve the complete ordered ledger and immutable-save copy-on-write', () => {
  const seed = generateBotPopulation('bot-receipt-archive', world);
  let cold: BotColdRecord = { ...seed.chunks[0]!.cold[0]!, actionReceipts: [], actionReceiptArchive: [] };
  for (let index = 1; index <= 300; index += 1) {
    const action = index % 2 === 0 ? 'search' : 'hunt';
    const receipt: BotActionReceipt = {
      actionId: `${cold.botId}:ACTION:${String(index).padStart(6, '0')}`,
      botId: cold.botId,
      action,
      targetId: index % 2 === 0 ? `TARGET-${index % 7}` : null,
      occurredAtElapsedMs: 0,
      result: 'completed',
      resourceDelta: { food: index, wood: -index, stone: 0, ore: 1 },
      baseXpAwarded: index,
      talentXpMultiplierPermille: 2_000,
      xpAwarded: index * 2,
      casualties: index % 3,
      ruleVersion: action === 'hunt' ? BOT_HUNT_RULE_VERSION : 'BOT-ACTION-XP-1.5',
      drawIndex: index % 4,
    };
    cold = appendBotActionReceipt(cold, receipt);
  }
  assert.equal(cold.actionReceiptArchive.length, 3);
  assert.equal(cold.actionReceipts.length, 108);
  assert.equal(botActionReceiptCount(cold), 300);
  let visited = 0;
  let xp = 0;
  forEachBotActionReceipt(cold, receipt => { visited += 1; xp += receipt.xpAwarded; });
  assert.equal(visited, 300);
  assert.equal(xp, 90_300);
  assert.equal(findBotActionReceipt(cold, receipt => receipt.action === 'hunt')?.actionId, `${cold.botId}:ACTION:000299`);
  freezeBotColdRecord(cold);
  const next = appendBotActionReceipt(cold, {
    actionId: `${cold.botId}:ACTION:000301`, botId: cold.botId, action: 'scout', targetId: null,
    occurredAtElapsedMs: 0, result: 'completed', resourceDelta: { food: 0, wood: 0, stone: 0, ore: 0 },
    baseXpAwarded: 10, talentXpMultiplierPermille: 2_000, xpAwarded: 20, casualties: 0,
    ruleVersion: 'BOT-ACTION-XP-1.5', drawIndex: 0,
  });
  assert.equal(botActionReceiptCount(cold), 300, 'appending after a save does not mutate the frozen source ledger');
  assert.equal(botActionReceiptCount(next), 301);
  const population = seed;
  const chunk = population.chunks[0]!;
  const changedCold = [...chunk.cold];
  changedCold[0] = next;
  let changedChunk = { ...chunk, cold: changedCold, rowSha256: [...chunk.rowSha256], chunkSha256: '' };
  changedChunk.rowSha256[0] = botRowHash(changedChunk, 0);
  changedChunk = { ...changedChunk, chunkSha256: botChunkHash(changedChunk) };
  const chunks = [...population.chunks];
  chunks[0] = changedChunk;
  verifyBotPopulation({ ...population, chunks, chunkRootSha256: botPopulationRoot(chunks) });
});

test('combat and construction talents trade capability at the same scale exactly once', () => {
  const cold = generateBotPopulation('bot-talent-capability', world).chunks[0]!.cold[2]!;
  const combatPower = botCohortPower(cold, 'S', 'combat');
  const productionPower = botCohortPower(cold, 'S', 'production');
  assert.equal(combatPower, productionPower * 2, 'combat modifier is applied once to actual cohort power');
  assert.equal(botConstructionPermille('S', 'combat'), 800);
  assert.equal(botConstructionPermille('S', 'production'), 1_600);
  assert.equal(botConstructionPermille('S', 'production'), botConstructionPermille('S', 'combat') * 2,
    'construction rates give the production specialist half the work time');
});

test('canonical serialization preserves byte ordering while streaming nested records', () => {
  assert.equal(stableStringify({ z: [1, { b: 2, a: 3 }], a: 'x' }), '{"a":"x","z":[1,{"a":3,"b":2}]}');
  assert.equal(stableStringify({ omittedByJson: undefined }), '{"omittedByJson":undefined}');
  assert.equal(stableStringify([undefined, , null]), '[,,null]');
  const cold = { actionReceipts: [{ action: 'scout', xp: 1 }], position: { yMm: 2, xMm: 1 } };
  const row = { xp: 42, alive: 1 };
  const cachedEncoding = `{"cold":${stableStringify(cold)},"row":${stableStringify(row)}}`;
  assert.equal(cachedEncoding, stableStringify({ cold, row }));
  assert.equal(canonicalStateHashFromStableJson(cachedEncoding), canonicalStateHash({ cold, row }));

  const chunk = generateBotPopulation('bot-row-hash-bytes', world).chunks[0]!;
  const hotRow: Record<string, number> = {};
  for (const [field, values] of Object.entries(chunk)) {
    if (Array.isArray(values) && values.length === chunk.count && typeof values[0] === 'number') hotRow[field] = values[0]!;
  }
  assert.equal(botRowHash(chunk, 0), canonicalStateHash({ cold: chunk.cold[0], row: hotRow }));
});

test('nearby settlements share one finite prey ledger with copy-on-write depletion', () => {
  const original = generateBotPopulation('bot-shared-prey', world);
  const references = new Map<string, number>();
  for (const chunk of original.chunks) for (const bot of chunk.cold) for (const source of bot.searchSources) {
    if (source.sharedStockId) references.set(source.sharedStockId, (references.get(source.sharedStockId) ?? 0) + 1);
  }
  const sharedId = [...references.entries()].find(([, count]) => count > 1)?.[0];
  assert.ok(sharedId, 'at least one wildlife location must be reachable by multiple settlements');
  const initial = original.sharedWildlifeStocks.find(stock => stock.id === sharedId)!;
  let working = beginBotPopulationAdvance(original)!;
  for (let harvest = 0; harvest < initial.remainingActions; harvest += 1) {
    const consumed = consumeSharedWildlifeStock(working, sharedId);
    assert.ok(consumed.stock, 'one claimant consumes each remaining opportunity');
    assert.equal(consumed.stock.remainingActions, initial.remainingActions - harvest - 1);
    working = consumed.population;
  }
  assert.equal(consumeSharedWildlifeStock(working, sharedId).stock, null, 'later claimants see the exhausted global stock');
  const settled = finishBotPopulationAdvance(working)!;
  verifyBotPopulation(settled);
  assert.equal(settled.sharedWildlifeStocks.find(stock => stock.id === sharedId)?.remainingActions, 0);
  assert.equal(original.sharedWildlifeStocks.find(stock => stock.id === sharedId)?.remainingActions, initial.remainingActions, 'copy-on-write preserves the input save');
});

test('bot inspection and markers reveal only current sightings and retain safe last-seen knowledge', () => {
  const state = freshState('bot-fog-rules');
  const targetBot = state.botPopulation!.chunks[0]!.cold[0]!;
  state.player.position = { ...targetBot.position };
  seedSpatialKnowledge(state, world);
  const visibleId = targetBot.botId;
  assert.ok(state.playerKnowledge.knownBotIds?.includes(visibleId), 'server sight should record a settlement when the player reaches its location');
  const initialView = projectPlayerView(state, world);
  const markers = initialView.visibleMap.enemyBots ?? [];
  assert.ok(markers.some(marker => marker.botId === visibleId && marker.knowledge === 'current'));
  assert.ok(markers.every(marker => marker.level === null && marker.militaryCount === null && marker.structureCount === null));

  const inspected = reduceCommand(state, {
    schemaVersion: 1, saveId: state.saveId, commandId: 'inspect-visible-bot', expectedRevision: state.revision,
    type: 'inspect_bot', payload: { botId: visibleId },
  }, world);
  assert.equal(inspected.receipt.accepted, true);
  const inspectedView = projectPlayerView(inspected.state, world);
  assert.equal(inspectedView.botInspection?.botId, visibleId);
  assert.ok((inspectedView.botInspection?.structures.length ?? 0) > 0);

  const hidden = structuredClone(inspected.state);
  const observedBot = hidden.botPopulation!.chunks.flatMap(chunk => chunk.cold).find(bot => bot.botId === visibleId)!;
  hidden.player.position = { ...hidden.player.position, xMm: -observedBot.position.xMm, yMm: -observedBot.position.yMm };
  const hiddenView = projectPlayerView(hidden, world);
  assert.equal(hiddenView.botInspection, null);
  const remembered = hiddenView.visibleMap.enemyBots?.find(marker => marker.botId === visibleId);
  assert.equal(remembered?.knowledge, 'remembered');
  assert.equal(remembered?.level, null);
  assert.equal(remembered?.militaryCount, null);
});

test('six hours of bot outcomes are invariant to 3-second, 5-second and large-step advancement', () => {
  const initial = freshState('bot-time-slicing');
  const target = 6 * HOUR_MS;
  const oneShotAdvance = advanceTo(initial, target, {}, world);
  const oneShot = oneShotAdvance.state;
  const advanceBounded = (startingState: GameState, at: number, maxBoundaries: number): GameState => {
    let state = startingState;
    while (true) {
      const before = state.simElapsedMs;
      const completedBefore = state.botPopulation!.completedActionCount;
      const result = advanceTo(state, at, { maxBoundaries }, world);
      state = result.state;
      if (result.caughtUp) break;
      assert.ok(state.simElapsedMs > before || result.events.length > 0
        || state.botPopulation!.completedActionCount > completedBefore, 'bounded catch-up must advance or settle work');
    }
    return state;
  };
  const segmented = (stepMs: number, maxBoundaries = 10_000, reloadEvery = Number.MAX_SAFE_INTEGER): GameState => {
    let state = initial;
    for (let at = stepMs, call = 1; at <= target; at += stepMs, call += 1) {
      state = advanceBounded(state, at, maxBoundaries);
      if (call % reloadEvery === 0) state = structuredClone(state);
    }
    if (state.simElapsedMs < target) state = advanceBounded(state, target, maxBoundaries);
    return state;
  };
  const threeSecond = segmented(3_000);
  const fiveSecond = segmented(5_000, 128, 137);
  const irregularSteps = [1_733, 5_281, 777_777, 14_003, 7_777] as const;
  let irregular = initial;
  let irregularTarget = 0;
  let irregularCall = 0;
  while (irregularTarget < target) {
    irregularTarget = Math.min(target, irregularTarget + irregularSteps[irregularCall % irregularSteps.length]!);
    irregular = advanceBounded(irregular, irregularTarget, 64);
    irregularCall += 1;
    if (irregularCall % 137 === 0) irregular = structuredClone(irregular);
  }
  for (const result of [threeSecond, fiveSecond, irregular]) {
    assert.equal(canonicalStateHash(result.botPopulation), canonicalStateHash(oneShot.botPopulation));
    verifyBotPopulation(result.botPopulation!);
  }
  const bots = oneShot.botPopulation!.chunks.flatMap(chunk => chunk.cold);
  assert.ok(oneShot.botPopulation!.completedActionCount > 0);
  assert.ok(bots.some(bot => hasReceipt(bot, receipt => receipt.action === 'scout')));
  assert.ok(oneShot.stage08.openingRivals.every(rival => rival.actionLedger.length === 0),
    'new-save bots own the opening-race ledger; forecast rivals must not run beside them');
  assert.equal(oneShotAdvance.events.some(event => event.type === 'opening_rival_action_committed'), false);
  assert.ok(bots.some(bot => bot.knownTargets.length > 0), 'completed scouting reveals a target only after its trip');
  assert.ok(bots.some(bot => bot.armyMovement?.unitKind === 'scout'));
  for (const chunk of oneShot.botPopulation!.chunks) for (let offset = 0; offset < chunk.count; offset += 1) {
    const grade = botGradeAt(chunk, offset);
    const kind = botKindAt(chunk, offset);
    forEachBotActionReceipt(chunk.cold[offset]!, receipt => {
      assert.equal(receipt.talentXpMultiplierPermille, botTalentXpMultiplierPermille(grade, kind));
      assert.equal(receipt.xpAwarded, Math.floor(receipt.baseXpAwarded * receipt.talentXpMultiplierPermille / 1_000));
    });
  }
  assert.equal(initial.simElapsedMs, 0);
  assert.equal(initial.botPopulation!.completedActionCount, 0, 'advancement must not mutate the source population snapshot');
  assert.equal(initial.botPopulation!.chunks[0]!.cold[0]!.actionReceipts.length, 0, 'private receipt appends must not mutate the source ledger');
  assert.equal(Object.isFrozen(oneShot.botPopulation!.chunks[0]!.cold[0]!.actionReceipts), true,
    'committed action receipt arrays remain immutable after batch flush');
});

test('P0 opening level board freezes the qualified top 100 after 144 hours and settles real raids', () => {
  let state = freshState('bot-benchmark-1023-144h');
  const target = 144 * HOUR_MS;
  let privateAdvanceStarted = false;
  while (state.simElapsedMs < target) {
    const before = state.simElapsedMs;
    const beforeActions = state.botPopulation!.completedActionCount;
    const beforeSegments = state.botPopulation!.benchmarkCounters.integratedBotSegments;
    const result = advanceTo(state, target, {
      maxBoundaries: 10_000,
      deferBotPopulationCommit: true,
      mutatePrivateState: privateAdvanceStarted,
    }, world);
    privateAdvanceStarted = true;
    state = result.state;
    assert.ok(state.simElapsedMs > before || result.events.length > 0
      || state.botPopulation!.completedActionCount > beforeActions
      || state.botPopulation!.benchmarkCounters.integratedBotSegments > beforeSegments
      || result.caughtUp, 'bounded catch-up must advance or settle work');
  }
  const population = state.botPopulation!;
  verifyBotPopulation(population);
  const snapshot = population.boardSnapshots.find(item => item.boardId === 'OPENING_LEVEL');
  assert.ok(snapshot);
  assert.equal(snapshot.status, 'settled');
  assert.equal(snapshot.asOfSimMs, target);
  assert.equal(snapshot.observedThroughSimMs, target);
  assert.equal(snapshot.rows.length, 100);
  assert.deepEqual(snapshot.rows.map(row => row.rank), Array.from({ length: 100 }, (_, index) => index + 1));
  assert.ok(snapshot.rows.every(row => row.score >= 10 && row.tieValue <= target));
  assert.ok(population.eventReceipts.filter(receipt => receipt.eventId === 'EV01-OPENING-LEVEL').length >= 100);
  const observedActions = new Set<string>();
  for (const chunk of population.chunks) for (const bot of chunk.cold) forEachBotActionReceipt(bot, receipt => {
    if (receipt.result !== 'blocked') observedActions.add(receipt.action);
  });
  for (const action of ['hunt', 'raid', 'recover', 'repair', 'search'] as const) {
    assert.ok(observedActions.has(action), `multi-day simulation should settle ${action} outcomes`);
  }
  const sCombat = population.chunks[0]!.cold[0]!;
  const sProduction = population.chunks[0]!.cold[1]!;
  assert.equal(botGradeAt(population.chunks[0]!, 0), 'S');
  assert.equal(botKindAt(population.chunks[0]!, 0), 'combat');
  assert.equal(botGradeAt(population.chunks[0]!, 1), 'S');
  assert.equal(botKindAt(population.chunks[0]!, 1), 'production');
  const sCombatQualification = population.chunks[0]!.completionAtElapsedMs[0]!;
  const sProductionQualification = population.chunks[0]!.completionAtElapsedMs[1]!;
  assert.ok(sCombatQualification > 0 && sCombatQualification < 48 * HOUR_MS,
    'the S combat specialist should reach level 10 within two days in this seeded run');
  assert.ok(sProductionQualification > sCombatQualification && sProductionQualification <= target,
    'the S production specialist should reach level 10 later than the S combat specialist, before the six-day board closes');
  let sCombatAdjustedXp = 0;
  let sProductionAdjustedXp = 0;
  forEachBotActionReceipt(sCombat, receipt => { sCombatAdjustedXp += receipt.xpAwarded; });
  forEachBotActionReceipt(sProduction, receipt => { sProductionAdjustedXp += receipt.xpAwarded; });
  assert.ok(sCombatAdjustedXp > sProductionAdjustedXp,
    'the committed XP ledger must preserve the combat specialist lead despite its lower base activity XP');
  const totalActionReceipts = population.chunks.reduce((sum, chunk) => sum + chunk.cold.reduce((chunkSum, bot) => chunkSum + botActionReceiptCount(bot), 0), 0);
  assert.ok(population.chunks.some(chunk => chunk.cold.some(bot => bot.actionReceiptArchive.length > 0)),
    'all committed activity receipts remain in the lossless archive after the recent tail rolls over');
  assert.ok(totalActionReceipts > 1_023 * 128, 'multi-day activity grows the archive beyond each bot’s bounded recent tail');
  const botRows = state.stage08.rankSnapshots.find(item => item.boardId === 'OPENING_LEVEL')!.rows.filter(row => row.playerId !== state.player.id);
  assert.equal(population.rewardReceipts.length, botRows.length, 'each ranked bot receives exactly one immutable reward receipt');
  assert.deepEqual(population.rewardReceipts.map(receipt => receipt.botId).sort(), botRows.map(row => row.playerId).sort());
  assert.ok(population.rewardReceipts.every(receipt => receipt.items.length > 0 && receipt.items.every(item => item.quantity > 0)));
  assert.ok(population.chunks.some(chunk => chunk.cold.some(bot => bot.eventInventory.some(item => item.eventId === 'EV01-OPENING-LEVEL'))));
  const rewardsBeforeRetry = structuredClone(population.rewardReceipts);
  assert.equal(settleOpeningLevelRank(state, target), null, 'settling the immutable board a second time cannot grant rewards again');
  assert.deepEqual(state.botPopulation!.rewardReceipts, rewardsBeforeRetry);
});
