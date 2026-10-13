import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { createNewGame } from '../src/initializer.ts';
import { advanceTo, HOUR_MS } from '../src/time.ts';
import { randomIntFromFields } from '../src/hash.ts';
import { previewCommand, reduceCommand } from '../src/reducer.ts';
import { botLordAttackApproachPermille, BOT_LORD_PLAYER_ATTACK_RULE_VERSION, completePlan, integrateBot } from '../src/bots/economy.ts';
import { botChunkHash, botPopulationRoot, botRowHash, computeBotChunkWake, heapifyBotScheduler, hydrateBotHotArrays, verifyBotPopulation } from '../src/bots/state.ts';
import { BOT_COMBAT_RULE_VERSION, BOT_IRON_WEAPON_POWER } from '../src/bots/combat.ts';
import { awardBotOpeningRankRewards } from '../src/bots/rewards.ts';
import { chooseBotDecision } from '../src/bots/planner.ts';
import { damageBotLord } from '../src/bots/lord.ts';
import { BOT_LORD_ESCAPE_RULE_VERSION } from '../src/bots/lord.ts';
import { personalCombatProfileForUnit, resolvePersonalAttack } from '../src/combat.ts';
import { planRoute } from '../src/spatial.ts';
import { STAGE07_OPENING_CORPSE_ID, STAGE07_OPENING_SPEAR_ID } from '../src/stage07.ts';
import { upgradeGameState } from '../src/upgrade.ts';
import type { BotColdRecord, BotPopulationState, BotStateChunk, GameState } from '../../contracts/src/index.ts';

let serial = 0;
function freshState(seed = `bot-owner-fixture-${++serial}`): GameState {
  return createNewGame({ saveId: `bot-owner-${serial}`, campaignId: `bot-owner-${serial}`, soulId: 'LI_LAN',
    worldPackageId: world.id, rulesetVersion: RULESET_VERSION, contentVersion: world.contentVersion, seed }, world);
}
function command(state: GameState, commandId: string, type: string, payload: Record<string, unknown>) {
  return { schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload };
}
function submit(state: GameState, commandId: string, type: string, payload: Record<string, unknown>) {
  const result = reduceCommand(state, command(state, commandId, type, payload), world);
  assert.equal(result.receipt.accepted, true, `${type} rejected: ${result.receipt.message}`);
  return result.state;
}
function patchBotPopulation(state: GameState, botId: string, change: (bot: BotColdRecord, hot: ReturnType<typeof hydrateBotHotArrays>, offset: number) => BotColdRecord) {
  const population = structuredClone(state.botPopulation!) as BotPopulationState;
  const chunkIndex = population.chunks.findIndex(chunk => chunk.cold.some(bot => bot.botId === botId));
  assert.notEqual(chunkIndex, -1);
  const chunk = population.chunks[chunkIndex]!;
  const offset = chunk.cold.findIndex(bot => bot.botId === botId);
  const cold = chunk.cold.slice();
  const hot = hydrateBotHotArrays(chunk);
  cold[offset] = change(cold[offset]!, hot, offset);
  const rowSha256 = chunk.rowSha256.slice();
  const noHash = { ...chunk, ...Object.fromEntries(Object.entries(hot).map(([key, value]) => [key, Array.from(value as ArrayLike<number>)])), cold, rowSha256, chunkSha256: '' } as unknown as BotStateChunk;
  rowSha256[offset] = botRowHash(noHash, offset);
  const withRows = { ...noHash, rowSha256 } as BotStateChunk;
  const nextChunk = { ...withRows, chunkSha256: botChunkHash(withRows) };
  const chunks = population.chunks.slice();
  chunks[chunkIndex] = nextChunk;
  const schedulerHeap = heapifyBotScheduler(chunks.map(chunk => {
    const wake = computeBotChunkWake(chunk);
    return { atElapsedMs: wake.atElapsedMs, chunkIndex: chunk.index, botOrdinal: wake.botOrdinal };
  }));
  const nextPopulation = { ...population, chunks, schedulerHeap, chunkRootSha256: botPopulationRoot(chunks) };
  return { population: nextPopulation, offset, chunkIndex };
}

test('an empty settlement preserves its owner, buildings, and holdings while personal deprivation continues', () => {
  let state = freshState('empty-settlement-continues-risk');
  const botId = 'RC-002';
  const original = state.botPopulation!.chunks[0]!.cold[0]!;
  const originalStructures = original.structures;
  const originalBlueprints = original.blueprintIds;
  const originalWoodMicro = state.botPopulation!.chunks[0]!.woodMicro[0]!;
  const originalStoneMicro = state.botPopulation!.chunks[0]!.stoneMicro[0]!;
  const originalOreMicro = state.botPopulation!.chunks[0]!.oreMicro[0]!;
  const patched = patchBotPopulation(state, botId, (bot, hot, offset) => {
    const cohorts = bot.cohorts.map(cohort => ({ ...cohort, livingCount: 0, lostCount: cohort.recruitedCount, healthPerMember: 0 }));
    hot.population[offset] = 0; hot.workers[offset] = 0; hot.assignedWorkers[offset] = 0; hot.armySize[offset] = 0;
    hot.armyHealthPermille[offset] = 0; hot.foodMicro[offset] = 0; hot.firewoodMicro[offset] = 0;
    hot.reservedFoodMicro[offset] = 0; hot.reservedWoodMicro[offset] = 0; hot.reservedStoneMicro[offset] = 0; hot.reservedOreMicro[offset] = 0;
    const prepared = { ...bot, cohorts, workforce: { gatherFood: 0, gatherWater: 0, gatherWood: 0, gatherStone: 0, gatherOre: 0,
      farmers: 0, millWorkers: 0, quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards: 0, recruiters: 0 },
      potableWaterMl: 0, localIceRemainingMl: 0, waterNodeMicro: 0, waterRemainder: 0, waterNodeRemainder: 0,
      waterConsumptionRemainder: 0, currentPlan: null, lord: { ...bot.lord, carriedFoodMicro: 0, carriedWaterMicro: 0 } };
    const integrated = integrateBot(prepared, hot, hot, offset, HOUR_MS, 'D', 'production', state.botPopulation!.saveSeed, state.survival.environment);
    hot.nextWakeAtElapsedMs[offset] = Math.max(HOUR_MS, hot.lastIntegratedAtElapsedMs[offset]!);
    return integrated.cold;
  });
  state.botPopulation = patched.population;
  const chunk = state.botPopulation!.chunks[patched.chunkIndex]!;
  const bot = chunk.cold[patched.offset]!;
  assert.equal(chunk.population[patched.offset], 0);
  assert.equal(chunk.armySize[patched.offset], 0);
  assert.equal(chunk.alive[patched.offset], 1, 'the owner actor remains alive independently of non-lord population');
  assert.equal(bot.lord.lifeState, 'alive');
  assert.ok(bot.lord.foodShortfallMs > 0 && bot.lord.waterShortfallMs > 0,
    `personal ledgers advance after resident extinction (${bot.lord.foodShortfallMs}, ${bot.lord.waterShortfallMs})`);
  assert.equal(bot.structures.length, originalStructures.length, 'settlement assets remain while the lord is alive');
  assert.deepEqual(bot.blueprintIds, originalBlueprints, 'earned plans remain owned while the owner lives');
  assert.equal(chunk.woodMicro[patched.offset], originalWoodMicro, 'unconsumed wood stock remains in the empty territory');
  assert.equal(chunk.stoneMicro[patched.offset], originalStoneMicro);
  assert.equal(chunk.oreMicro[patched.offset], originalOreMicro);
  assert.equal(state.botPopulation!.remainsChests.some(chest => chest.botId === bot.botId), false);
  assert.ok(chunk.reservedFoodMicro[patched.offset]! <= chunk.foodMicro[patched.offset]!
    && chunk.reservedWoodMicro[patched.offset]! <= chunk.woodMicro[patched.offset]!
    && chunk.reservedStoneMicro[patched.offset]! <= chunk.stoneMicro[patched.offset]!
    && chunk.reservedOreMicro[patched.offset]! <= chunk.oreMicro[patched.offset]!,
  `reservations must stay funded: ${chunk.foodMicro[patched.offset]}/${chunk.reservedFoodMicro[patched.offset]}, ${chunk.woodMicro[patched.offset]}/${chunk.reservedWoodMicro[patched.offset]}, ${chunk.stoneMicro[patched.offset]}/${chunk.reservedStoneMicro[patched.offset]}, ${chunk.oreMicro[patched.offset]}/${chunk.reservedOreMicro[patched.offset]}`);
  const economyFields = ['foodMicro', 'woodMicro', 'stoneMicro', 'oreMicro', 'firewoodMicro', 'reservedFoodMicro', 'reservedWoodMicro', 'reservedStoneMicro', 'reservedOreMicro'] as const;
  assert.ok(economyFields.every(field => Number.isSafeInteger(chunk[field][patched.offset]) && chunk[field][patched.offset]! >= 0),
    `economy fields invalid: ${JSON.stringify(Object.fromEntries(economyFields.map(field => [field, chunk[field][patched.offset]])))}`);
  verifyBotPopulation(state.botPopulation!);
});

test('a living lord self-gathers food when no residents can work', () => {
  const state = freshState('empty-settlement-solo-food');
  const botId = 'RC-002';
  const patched = patchBotPopulation(state, botId, (bot, hot, offset) => {
    hot.population[offset] = 0; hot.workers[offset] = 0; hot.assignedWorkers[offset] = 0; hot.armySize[offset] = 0;
    hot.armyHealthPermille[offset] = 0; hot.foodMicro[offset] = 0; hot.reservedFoodMicro[offset] = 0;
    const cohorts = bot.cohorts.map(cohort => ({ ...cohort, livingCount: 0, lostCount: cohort.recruitedCount, healthPerMember: 0 }));
    const workforce = { gatherFood: 0, gatherWood: 0, gatherStone: 0, gatherOre: 0, farmers: 0, millWorkers: 0,
      quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards: 0, recruiters: 0 };
    hot.lastIntegratedAtElapsedMs[offset] = 0;
    const empty = { ...bot, cohorts, workforce, currentPlan: null, potableWaterMl: 20_000,
      lord: { ...bot.lord, lastIntegratedAtElapsedMs: 0 } };
    const decision = chooseBotDecision(empty, hot, offset, 'D', 'production', 0);
    assert.equal(decision.plan.action, 'gather_food');
    assert.equal(decision.plan.ownerSelfService, true);
    assert.equal(decision.plan.workersAssigned, 1);
    assert.equal(decision.assignedWorkers, 0, 'the lord does not become a resident worker');
    hot.workKind[offset] = decision.workCode; hot.assignedWorkers[offset] = decision.assignedWorkers;
    hot.workRequired[offset] = decision.workRequired; hot.workProgress[offset] = 0;
    const integrated = integrateBot({ ...empty, currentPlan: decision.plan }, hot, hot, offset, 4 * HOUR_MS,
      'D', 'production', state.botPopulation!.saveSeed, state.survival.environment);
    assert.ok(hot.foodMicro[offset]! > 0, 'solo gathering produces food through the finite node');
    assert.ok(hot.foodNodeMicro[offset]! < state.botPopulation!.chunks[0]!.foodNodeMicro[offset]!, 'harvest consumes the finite node');
    return integrated.cold;
  });
  const chunk = patched.population.chunks[patched.chunkIndex]!;
  const bot = chunk.cold[patched.offset]!;
  assert.equal(chunk.population[patched.offset], 0);
  assert.equal(chunk.workers[patched.offset], 0);
  assert.equal(chunk.alive[patched.offset], 1);
  assert.equal(bot.lord.lifeState, 'alive');
});

test('schema 12 settlement extinction migrates to a living lord with a fresh survival clock and a scheduler wake', () => {
  const state = freshState('legacy-owner-migration');
  const legacy = structuredClone(state) as unknown as Record<string, any>;
  legacy.schemaVersion = 12;
  const source = legacy.botPopulation;
  source.schemaVersion = 1;
  source.livingLordCount = undefined;
  source.remainsChests = undefined;
  source.lordRuleVersion = undefined;
  source.waterRuleVersion = undefined;
  source.chunks = source.chunks.map((oldChunk: Record<string, any>, chunkIndex: number) => {
    const legacyPopulation = Array.from(oldChunk.population as ArrayLike<number>);
    const legacyArmy = Array.from(oldChunk.armySize as ArrayLike<number>);
    const legacyArmyHealth = Array.from(oldChunk.armyHealthPermille as ArrayLike<number>);
    const cold = oldChunk.cold.map((row: Record<string, any>, offset: number) => {
      const { lord: _lord, weather: _weather, potableWaterMl: _water, localIceRemainingMl: _ice, waterNodeMicro: _node, waterRemainder: _waterRemainder,
        waterNodeRemainder: _nodeRemainder, waterConsumptionRemainder: _consumptionRemainder, heldItems: _heldItems, ...prior } = row;
      const workforce = { ...prior.workforce }; delete workforce.gatherWater;
      const carriedCargo = { ...prior.carriedCargo }; delete carriedCargo.water; delete carriedCargo.rawWater; delete carriedCargo.rawSalt; delete carriedCargo.coal;
      delete prior.potableWaterMl;
      delete prior.localIceRemainingMl;
      if (chunkIndex === 0 && offset === 0) {
        prior.position = { ...prior.position };
        prior.cohorts = prior.cohorts.map((cohort: Record<string, number>) => ({
          ...cohort, livingCount: 0, lostCount: cohort.recruitedCount, healthPerMember: 0,
        }));
        legacyPopulation[offset] = 0;
        legacyArmy[offset] = 0;
        legacyArmyHealth[offset] = 0;
      }
      return { ...prior, workforce, carriedCargo };
    });
    const { chunkSha256: _oldChunkHash, ...priorChunk } = oldChunk;
    const alive = legacyPopulation.map((population: number) => Number(population > 0));
    const nextWakeAtElapsedMs = oldChunk.nextWakeAtElapsedMs.map((wake: number, offset: number) => alive[offset] ? wake : Number.MAX_SAFE_INTEGER);
    const unhashed = { ...priorChunk, population: legacyPopulation, armySize: legacyArmy, armyHealthPermille: legacyArmyHealth,
      cold, alive, nextWakeAtElapsedMs, rowSha256: [], chunkSha256: '' };
    const rowSha256 = Array.from({ length: oldChunk.count }, (_, offset) => botRowHash(unhashed as unknown as BotStateChunk, offset));
    const withRows = { ...unhashed, rowSha256 } as unknown as BotStateChunk;
    return { ...withRows, chunkSha256: botChunkHash(withRows) };
  });
  const migrated = upgradeGameState(legacy, world);
  const chunk = migrated.botPopulation!.chunks[0]!;
  assert.equal(chunk.population[0], 0);
  assert.equal(chunk.alive[0], 1, 'old alive=0 meant no non-lord residents, not proof of lord death');
  assert.equal(chunk.cold[0]!.lord.lifeState, 'alive');
  assert.equal(chunk.cold[0]!.lord.hpMicro, 100_000_000);
  assert.equal(chunk.cold[0]!.lord.foodShortfallMs, 0);
  assert.equal(chunk.cold[0]!.potableWaterMl, 0, 'migration grants no historical or infinite water reserve');
  assert.ok(chunk.nextWakeAtElapsedMs[0]! < Number.MAX_SAFE_INTEGER, 'extinct settlements re-enter the live survival scheduler');
  verifyBotPopulation(migrated.botPopulation!);
});

test('interception and personal attacks are separate from troop casualties; death creates one exact remains cache', () => {
  let state = freshState('intact-army-assassination');
  state = submit(state, 'inspect-rook-for-bot-attack', 'inspect_entity', { entity: { type: 'corpse', id: STAGE07_OPENING_CORPSE_ID } });
  state = submit(state, 'revive-rook-for-bot-attack', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  state = submit(state, 'equip-rook-for-bot-attack', 'equip', { unitId: unit.id, itemId: STAGE07_OPENING_SPEAR_ID, slotId: 'MAIN_HAND' });
  const botId = 'RC-002';
  const location = state.player.position;
  const patched = patchBotPopulation(state, botId, (bot, _hot, _offset) => ({
    ...bot, position: { ...location }, lord: { ...bot.lord, position: { ...location }, hpMicro: 5_000_000 },
  }));
  state.botPopulation = patched.population;
  state.playerKnowledge = { ...state.playerKnowledge,
    knownBotIds: [...new Set([...(state.playerKnowledge.knownBotIds ?? []), botId])],
    inspectedBotId: botId,
    lastSeenBotById: { ...(state.playerKnowledge.lastSeenBotById ?? {}), [botId]: { observedAtElapsedMs: 0, position: location } },
  };
  state.ownedUnits = state.ownedUnits.map(candidate => candidate.id === unit.id ? { ...candidate, position: { ...location }, location: { kind: 'field', coordinate: { ...location } } } : candidate);
  const defenderChunk = state.botPopulation!.chunks[0]!;
  const defenderOffset = 0;
  const defender = defenderChunk.cold[defenderOffset]!;
  const armyBefore = defenderChunk.armySize[defenderOffset]!;
  assert.ok(armyBefore > 0);
  const profile = personalCombatProfileForUnit(state, unit.id)!;
  const approachPermille = botLordAttackApproachPermille(defender, armyBefore, unit.attributes!.PER ?? 0);
  const hitChance = Math.max(20, Math.min(95, 72 + ((unit.attributes!.DEX ?? 0) - defender.lord.attributes.DEX) * 2
    + (unit.attributes!.PER ?? 0) - defender.lord.attributes.PER));
  let interceptedCommandId = '';
  for (let index = 0; index < 500; index += 1) {
    const candidate = `assassination-${index}`;
    const approach = randomIntFromFields([state.botPopulation!.saveSeed, candidate, BOT_LORD_PLAYER_ATTACK_RULE_VERSION, botId, 'approach'], 0, 999).value;
    if (approach >= approachPermille) { interceptedCommandId = candidate; break; }
  }
  assert.ok(interceptedCommandId, 'a bounded deterministic fixture can select an intercepted approach');
  const intercepted = reduceCommand(state, command(state, interceptedCommandId, 'attack', { actorIds: [unit.id], targetId: botId }), world);
  assert.equal(intercepted.receipt.accepted, true, intercepted.receipt.message);
  assert.equal(intercepted.events.some(event => event.type === 'bot_lord_player_approach_intercepted'), true);
  assert.equal(intercepted.state.botPopulation!.chunks[0]!.cold[0]!.lord.hpMicro, 5_000_000, 'interception causes no personal damage');
  assert.equal(intercepted.state.botPopulation!.chunks[0]!.armySize[0], armyBefore, 'a detected attempt leaves defenders intact');
  state = intercepted.state;

  const currentDefender = state.botPopulation!.chunks[0]!.cold[0]!;
  const sourceChunk = state.botPopulation!.chunks[0]!;
  const sourceOffset = sourceChunk.cold.findIndex(bot => bot.botId === botId);
  const expectedResourceMicro = {
    food: sourceChunk.foodMicro[sourceOffset]! + currentDefender.carriedCargo.food * 1_000_000 + currentDefender.lord.carriedFoodMicro,
    wood: sourceChunk.woodMicro[sourceOffset]! + currentDefender.carriedCargo.wood * 1_000_000,
    stone: sourceChunk.stoneMicro[sourceOffset]! + currentDefender.carriedCargo.stone * 1_000_000,
    ore: sourceChunk.oreMicro[sourceOffset]! + currentDefender.carriedCargo.ore * 1_000_000,
  };
  const expectedWaterMl = currentDefender.potableWaterMl + Math.floor(currentDefender.lord.carriedWaterMicro / 1_000);
  const expectedFirewoodMicro = sourceChunk.firewoodMicro[sourceOffset]! + currentDefender.carriedCargo.firewood * 1_000_000;
  const expectedInventoryItems = [
    ...currentDefender.inventoryItems.map(item => ({ instanceId: item.instanceId, itemTemplateId: item.itemTemplateId,
      quantity: item.quantity, rewardReceiptId: null, sourceId: item.sourceId })),
    ...currentDefender.eventInventory.filter(item => item.quantity > 0).map(item => ({ instanceId: item.instanceId,
      itemTemplateId: item.itemTemplateId, quantity: item.quantity, rewardReceiptId: item.rewardReceiptId, sourceId: null })),
  ].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const expectedBlueprintItems = currentDefender.blueprintItems.filter(item => item.status === 'owned')
    .slice().sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const expectedOwnedChests = currentDefender.ownedChests.filter(item => item.status === 'owned')
    .slice().sort((a, b) => a.chestId.localeCompare(b.chestId));
  let attackCommandId = '';
  for (let index = 0; index < 500; index += 1) {
    const candidate = `assassination-success-${index}`;
    const approach = randomIntFromFields([state.botPopulation!.saveSeed, candidate, BOT_LORD_PLAYER_ATTACK_RULE_VERSION, botId, 'approach'], 0, 999).value;
    const encounter = `${BOT_LORD_PLAYER_ATTACK_RULE_VERSION}:${candidate}:0`;
    const hit = randomIntFromFields([state.seed, encounter, 'PERSONAL-COMBAT-1.0', unit.id, currentDefender.lord.id, 'hit'], 1, 100).value;
    const draw = randomIntFromFields([state.seed, encounter, 'PERSONAL-COMBAT-1.0', unit.id, currentDefender.lord.id, 'damage'], 0, 2).value;
    const damage = Math.max(0, 1 + Math.floor((unit.attributes!.STR ?? 0) / 6)
      + Math.floor(profile.weaponDamage * profile.weaponCondition) + draw - Math.round(currentDefender.lord.equipmentTemplateIds.includes('BOT-IRON-ARMOR-1.0') ? 2 : 0));
    if (approach < approachPermille && hit <= hitChance && damage >= 5) { attackCommandId = candidate; break; }
  }
  assert.ok(attackCommandId, 'a bounded deterministic fixture can choose a successful approach and hit');
  const envelope = command(state, attackCommandId, 'attack', { actorIds: [unit.id], targetId: botId });
  assert.equal(previewCommand(state, envelope, world).enabled, true, 'the inspected, armed attacker can reach the owner-lord');
  const result = reduceCommand(state, envelope, world);
  assert.equal(result.receipt.accepted, true, result.receipt.message);
  assert.equal(result.events.some(event => event.type === 'bot_lord_player_personal_attack' && event.payload.damage >= 5), true);
  const after = result.state.botPopulation!;
  assert.equal(after.livingLordCount, state.botPopulation!.livingLordCount - 1);
  const deadChunk = after.chunks[0]!;
  const deadLord = deadChunk.cold[0]!;
  assert.equal(deadChunk.armySize[0], armyBefore, 'personal damage never derives from or subtracts cohort losses');
  assert.equal(deadLord.cohorts.reduce((sum, cohort) => sum + cohort.livingCount, 0), armyBefore);
  assert.equal(deadLord.lord.lifeState, 'dead');
  assert.equal(deadLord.structures.length, 0, 'structures are removed without a salvage refund');
  assert.equal(deadLord.inventoryItems.length + deadLord.eventInventory.length + deadLord.blueprintItems.length + deadLord.ownedChests.length, 0,
    'transferred inventory, blueprints, and unopened carried chests are removed from the source row');
  assert.equal(deadChunk.foodMicro[0], 0);
  assert.equal(deadChunk.woodMicro[0], 0);
  assert.equal(after.remainsChests.length, 1);
  const remains = after.remainsChests[0]!;
  assert.equal(remains.botId, botId);
  assert.equal(remains.state, 'unclaimed');
  assert.deepEqual(remains.position, deadLord.position, 'the single chest stays at the territory location');
  assert.deepEqual(remains.resourceMicro, expectedResourceMicro, 'held balances transfer once without building salvage');
  assert.equal(remains.waterMl, expectedWaterMl);
  assert.equal(remains.firewoodMicro, expectedFirewoodMicro);
  assert.deepEqual(remains.inventoryItems, expectedInventoryItems, 'actual inventory identities transfer without copies');
  assert.deepEqual(remains.blueprintItems, expectedBlueprintItems, 'held blueprint identities transfer without rerolls');
  assert.deepEqual(remains.ownedChests, expectedOwnedChests, 'unopened shared chests retain their exact deterministic commitments');
  verifyBotPopulation(after);
  const retry = reduceCommand(result.state, envelope, world);
  assert.equal(retry.events.length, 0);
  assert.equal(retry.state.botPopulation!.remainsChests.length, 1, 'retry cannot duplicate the death chest');

  const remainsCommand = command(result.state, 'claim-deceased-lord-assets', 'open_cache', { actorId: result.state.player.id, chestId: remains.id });
  assert.equal(previewCommand(result.state, remainsCommand, world).enabled, true, 'the recorded death cache is reachable from the territory');
  const claim = reduceCommand(result.state, remainsCommand, world);
  assert.equal(claim.receipt.accepted, true, claim.receipt.message);
  const claimed = claim.state.botPopulation!.remainsChests[0]!;
  assert.equal(claimed.state, 'claimed');
  assert.deepEqual(claimed.resourceMicro, { food: 0, wood: 0, stone: 0, ore: 0 }, 'source resource stock transfers instead of remaining duplicated');
  assert.equal(claimed.waterMl + claimed.firewoodMicro + claimed.inventoryItems.length + claimed.blueprintItems.length, 0);
  const claimEvent = claim.events.find(event => event.type === 'bot_remains_chest_claimed')!;
  const delivered = claim.state.inventory.containers.flatMap(container => container.stacks);
  for (const asset of claimEvent.payload.assets.resources) {
    assert.ok(delivered.some(stack => stack.itemId === asset.itemId && stack.templateId === asset.templateId && stack.quantity >= asset.quantity),
      `the exact ${asset.templateId} resource identity was transferred`);
  }
  const duplicateClaim = reduceCommand(claim.state, command(claim.state, 'claim-deceased-lord-assets-again', 'open_cache', {
    actorId: claim.state.player.id, chestId: remains.id,
  }), world);
  assert.equal(duplicateClaim.receipt.accepted, false);
  assert.equal(duplicateClaim.receipt.code, 'CHEST_ALREADY_OPENED');
  const afterReload = upgradeGameState(claim.state, world);
  verifyBotPopulation(afterReload.botPopulation!);
  assert.equal(afterReload.botPopulation!.remainsChests.length, 1);
  const reloadedDeathChunk = afterReload.botPopulation!.chunks[0]!;
  assert.equal(reloadedDeathChunk.alive[0], 0);
  assert.equal(reloadedDeathChunk.nextWakeAtElapsedMs[0], Number.MAX_SAFE_INTEGER, 'a deceased lord has no routine wake after reload');
  assert.equal(afterReload.botPopulation!.activeLordOrdinals!.includes(deadLord.ordinal), false,
    'reload rebuilds active owner work from living lords only');
  assert.deepEqual(reloadedDeathChunk.cold[0]!.lord.deathRecord, deadLord.lord.deathRecord, 'reload preserves the exact death timestamp and cause');
  assert.equal(afterReload.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.itemId.startsWith('BOT-REMAINS-')).length,
    delivered.filter(stack => stack.itemId.startsWith('BOT-REMAINS-')).length, 'reload does not duplicate transferred identities');
});

test('a nonlethal player contact starts a persisted ordinary-speed escape that consumes carried supplies', () => {
  let state = freshState('owner-escape-travel');
  state = submit(state, 'inspect-rook-for-escape', 'inspect_entity', { entity: { type: 'corpse', id: STAGE07_OPENING_CORPSE_ID } });
  state = submit(state, 'revive-rook-for-escape', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  state = submit(state, 'equip-rook-for-escape', 'equip', { unitId: unit.id, itemId: STAGE07_OPENING_SPEAR_ID, slotId: 'MAIN_HAND' });
  const botId = 'RC-002';
  const origin = { ...state.player.position };
  const destination = { ...origin, xMm: origin.xMm + 10_000 };
  const route = planRoute(world, origin, destination);
  assert.ok(route && route.distanceMm > 0, 'the known route graph admits the fixture escape destination');
  const patched = patchBotPopulation(state, botId, (bot, hot, offset) => {
    hot.population[offset] = 0; hot.workers[offset] = 0; hot.assignedWorkers[offset] = 0;
    hot.armySize[offset] = 0; hot.armyHealthPermille[offset] = 0;
    hot.foodMicro[offset] = 50_000_000; hot.reservedFoodMicro[offset] = 0;
    const lord = { ...bot.lord, position: origin, location: 'settlement' as const, activity: 'at_settlement' as const,
      hpMicro: 100_000_000, lastIntegratedAtElapsedMs: hot.lastIntegratedAtElapsedMs[offset]! };
    const destinationSource = { ...bot.searchSources[0]!, id: 'FIXTURE-ESCAPE-DESTINATION', position: destination,
      remainingActions: 1, discovered: true };
    const workforce = { gatherFood: 0, gatherWood: 0, gatherStone: 0, gatherOre: 0, farmers: 0, millWorkers: 0,
      quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards: 0, recruiters: 0 };
    return { ...bot, lord, cohorts: [], workforce, currentPlan: null, searchSources: [destinationSource], knownTargets: [],
      potableWaterMl: 20_000, waterConsumptionRemainder: 0 };
  });
  state.botPopulation = patched.population;
  state.playerKnowledge = { ...state.playerKnowledge,
    knownBotIds: [...new Set([...(state.playerKnowledge.knownBotIds ?? []), botId])], inspectedBotId: botId,
    lastSeenBotById: { ...(state.playerKnowledge.lastSeenBotById ?? {}), [botId]: { observedAtElapsedMs: 0, position: origin } },
  };
  state.ownedUnits = state.ownedUnits.map(candidate => candidate.id !== unit.id ? candidate : {
    ...candidate, position: origin, location: { kind: 'field', coordinate: origin },
  });
  const row = state.botPopulation!.chunks[patched.chunkIndex]!.cold[patched.offset]!;
  const escapeChance = 450;
  let attackCommandId = '';
  for (let index = 0; index < 2_000; index += 1) {
    const candidate = `escape-contact-${index}`;
    const encounterId = `${BOT_LORD_PLAYER_ATTACK_RULE_VERSION}:${candidate}:0`;
    const approach = randomIntFromFields([state.botPopulation!.saveSeed, candidate,
      BOT_LORD_PLAYER_ATTACK_RULE_VERSION, botId, 'approach'], 0, 999).value;
    const escape = randomIntFromFields([state.botPopulation!.saveSeed, encounterId, row.lord.id,
      BOT_LORD_ESCAPE_RULE_VERSION, 'attempt'], 0, 999).value;
    if (approach < botLordAttackApproachPermille(row, 0, unit.attributes!.PER ?? 0) && escape < escapeChance) {
      attackCommandId = candidate;
      break;
    }
  }
  assert.ok(attackCommandId, 'bounded deterministic candidates produce a detected approach and escape draw');
  const result = reduceCommand(state, command(state, attackCommandId, 'attack', { actorIds: [unit.id], targetId: botId }), world);
  assert.equal(result.receipt.accepted, true, result.receipt.message);
  assert.equal(result.events.some(event => event.type === 'bot_lord_escape_started'), true);
  const escapedChunk = result.state.botPopulation!.chunks[patched.chunkIndex]!;
  const escapedOffset = escapedChunk.cold.findIndex(bot => bot.botId === botId);
  const escaped = escapedChunk.cold[escapedOffset]!;
  verifyBotPopulation(result.state.botPopulation!);
  assert.equal(escaped.lord.location, 'retreating');
  assert.ok(escaped.lord.retreatRoute && escaped.lord.retreatRoute.length >= 2);
  assert.deepEqual(escaped.lord.retreatDestination, destination);
  assert.ok(escaped.lord.carriedFoodMicro > 0 && escaped.lord.carriedWaterMicro > 0,
    `escape cargo food=${escaped.lord.carriedFoodMicro} water=${escaped.lord.carriedWaterMicro}; event=${JSON.stringify(result.events.find(event => event.type === 'bot_lord_escape_started')?.payload)}`);
  assert.deepEqual(escaped.lord.position, origin, 'starting a route does not teleport the owner');

  const travelDuration = Math.max(1, Math.floor(escaped.lord.retreatDistanceMm * 3_600_000
    / escaped.lord.retreatSpeedMmPerHour / 2));
  const travelTo = escaped.lord.lastIntegratedAtElapsedMs + travelDuration;
  const integrateFor = (boundaries: number[]) => {
    const hot = hydrateBotHotArrays(escapedChunk);
    let cold = escapedChunk.cold[escapedOffset]!;
    for (const at of boundaries) cold = integrateBot(cold, hot, hot, escapedOffset, at, 'D', 'production',
      result.state.botPopulation!.saveSeed, result.state.survival.environment).cold;
    return cold.lord;
  };
  const oneStep = integrateFor([travelTo]);
  const splitAt = escaped.lord.lastIntegratedAtElapsedMs + Math.floor(travelDuration / 2);
  const twoSteps = integrateFor([splitAt, travelTo]);
  assert.deepEqual(oneStep.position, twoSteps.position, 'route movement is invariant to catch-up segmentation');
  assert.equal(oneStep.retreatProgressMm, twoSteps.retreatProgressMm);
  assert.equal(oneStep.carriedFoodMicro, twoSteps.carriedFoodMicro);
  assert.equal(oneStep.carriedWaterMicro, twoSteps.carriedWaterMicro);
  assert.ok(oneStep.position.xMm > origin.xMm, 'the owner advances at the compiled walk speed');
  assert.ok(oneStep.carriedFoodMicro < escaped.lord.carriedFoodMicro, 'travel consumes finite carried food');
  assert.ok(oneStep.carriedWaterMicro < escaped.lord.carriedWaterMicro, 'travel consumes finite carried water');
  const arrivalAt = escaped.lord.lastIntegratedAtElapsedMs
    + Math.ceil(escaped.lord.retreatDistanceMm * 3_600_000 / escaped.lord.retreatSpeedMmPerHour);
  const arrived = integrateFor([arrivalAt]);
  assert.equal(arrived.location, 'field');
  assert.equal(arrived.activity, 'resting');
  assert.deepEqual(arrived.position, destination, 'route completion ends at the selected destination');
  assert.equal(arrived.retreatRoute, null);
  assert.equal(arrived.activeEncounterId, null);

  const noRoute = patchBotPopulation(result.state, botId, (bot, hot, offset) => {
    hot.foodMicro[offset] = 50_000_000;
    return { ...bot, searchSources: [], knownTargets: [], lord: { ...bot.lord, position: origin,
      location: 'settlement', activity: 'at_settlement', activeEncounterId: null,
      encounterThreatActorId: null, encounterThreatPosition: null,
      retreatDestination: null, retreatRoute: null, retreatDistanceMm: 0, retreatProgressMm: 0,
      retreatStartedAtElapsedMs: null, retreatSpeedMmPerHour: 0, retreatTravelRemainder: 0,
      retreatThreatActorId: null, retreatThreatPosition: null, carriedFoodMicro: 0, carriedWaterMicro: 0 },
      currentPlan: null, potableWaterMl: 20_000 };
  });
  let noRouteState = { ...result.state, botPopulation: noRoute.population };
  let contactCommandId = '';
  for (let index = 0; index < 2_000; index += 1) {
    const candidate = `no-route-contact-${index}`;
    const approach = randomIntFromFields([noRouteState.botPopulation!.saveSeed, candidate,
      BOT_LORD_PLAYER_ATTACK_RULE_VERSION, botId, 'approach'], 0, 999).value;
    if (approach < botLordAttackApproachPermille(noRoute.population.chunks[noRoute.chunkIndex]!.cold[noRoute.offset]!, 0,
      unit.attributes!.PER ?? 0)) { contactCommandId = candidate; break; }
  }
  assert.ok(contactCommandId);
  const noRouteResult = reduceCommand(noRouteState,
    command(noRouteState, contactCommandId, 'attack', { actorIds: [unit.id], targetId: botId }), world);
  assert.equal(noRouteResult.receipt.accepted, true, noRouteResult.receipt.message);
  const heldEncounter = noRouteResult.state.botPopulation!.chunks[noRoute.chunkIndex]!.cold[noRoute.offset]!.lord;
  assert.equal(heldEncounter.retreatRoute, null, 'no route never turns into a retreat flag');
  assert.equal(heldEncounter.location, 'settlement');
  assert.equal(heldEncounter.activity, 'encounter');
  assert.equal(heldEncounter.encounterThreatActorId, unit.id, 'the actual attacker remains linked to the encounter');
  assert.equal(heldEncounter.activeEncounterId, `${BOT_LORD_PLAYER_ATTACK_RULE_VERSION}:${contactCommandId}:0`);
  verifyBotPopulation(noRouteResult.state.botPopulation!);
});

test('an empty undefended bot settlement opens immediate personal contact without troop casualties', () => {
  let state = freshState('empty-defender-personal-contact');
  const attackerId = 'RC-002';
  const targetId = 'RC-003';
  const firstChunk = state.botPopulation!.chunks[0]!;
  const targetSource = firstChunk.cold.find(bot => bot.botId === targetId)!;
  const targetPosition = targetSource.lord.position;
  const attackerPatch = patchBotPopulation(state, attackerId, (bot, hot, offset) => {
    const raider = bot.cohorts.find(cohort => cohort.livingCount > 0)!;
    hot.armySize[offset] = 1;
    hot.population[offset] = Math.max(1, hot.population[offset]!);
    const cohorts = bot.cohorts.map(cohort => cohort.id === raider.id
      ? { ...cohort, livingCount: 1, lostCount: cohort.recruitedCount - 1, equipmentTemplateIds: ['BOT-WEAPON-IRON-1.0'] }
      : { ...cohort, livingCount: 0, lostCount: cohort.recruitedCount });
    const basePlan = {
      goal: 'contest' as const, action: 'raid' as const, targetId,
      startedAtElapsedMs: 0, completesAtElapsedMs: 1, workersAssigned: 1,
      reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
      startingResourcesMicro: { food: hot.foodMicro[offset]!, wood: hot.woodMicro[offset]!, stone: hot.stoneMicro[offset]!, ore: hot.oreMicro[offset]! },
      expectedOutcome: 'test personal contact',
    };
    let actionId = '';
    const approachPermille = botLordAttackApproachPermille(targetSource, 0, 10);
    const raiderProfile = (id: string) => ({ actorId: `${bot.botId}:RAIDER:${id}:${raider.id}`,
      attributes: { STR: 10, VIT: 10, DEX: 10, INT: 10, SPI: 10, WIL: 10, PER: 10, PRE: 10, LUK: 10 },
      weaponDamage: BOT_IRON_WEAPON_POWER, weaponCondition: 1, armor: 0, rangeMm: 2_000 });
    for (let index = 0; index < 2_000; index += 1) {
      const candidate = `empty-defender-raid-${index}`;
      const approach = randomIntFromFields([state.botPopulation!.saveSeed, candidate, BOT_COMBAT_RULE_VERSION,
        targetId, 'lord-approach'], 0, 999).value;
      const profile = raiderProfile(candidate);
      const personal = resolvePersonalAttack(state.botPopulation!.saveSeed, `${BOT_COMBAT_RULE_VERSION}:${candidate}:LORD`, profile,
        { actorId: targetSource.lord.id, attributes: targetSource.lord.attributes, weaponDamage: 0, weaponCondition: 1, armor: 0, rangeMm: 2_000 }, 0);
      if (approach < approachPermille && personal.hit && personal.damage >= 5) { actionId = candidate; break; }
    }
    assert.ok(actionId, 'bounded deterministic candidates select a legal approach and lethal personal hit');
    const plan = { ...basePlan, actionId };
    const movement = { orderId: actionId, targetId, unitKind: 'army' as const, unitCount: 1,
      cohortMemberCounts: [{ cohortId: raider.id, memberCount: 1 }], from: bot.lastSafePosition, to: targetPosition,
      startedAtElapsedMs: 0, arrivesAtElapsedMs: 0, status: 'besieging' as const };
    return { ...bot, cohorts, currentPlan: plan, knownTargets: [...bot.knownTargets,
      { id: targetId, kind: 'bot' as const, position: targetPosition, observedAtElapsedMs: 0 }],
      knownTargetIds: [...new Set([...bot.knownTargetIds, targetId])], armyMovement: movement };
  });
  state.botPopulation = attackerPatch.population;
  const targetPatch = patchBotPopulation(state, targetId, (bot, hot, offset) => {
    hot.armySize[offset] = 0;
    hot.workers[offset] = Math.max(0, hot.population[offset]!);
    return { ...bot, cohorts: [], structures: [], lord: { ...bot.lord, hpMicro: 5_000_000,
      position: targetPosition, equipmentTemplateIds: [] } };
  });
  state.botPopulation = targetPatch.population;
  const chunk = state.botPopulation!.chunks[0]!;
  const attackerOffset = chunk.cold.findIndex(bot => bot.botId === attackerId);
  const targetOffset = chunk.cold.findIndex(bot => bot.botId === targetId);
  const hot = hydrateBotHotArrays(chunk);
  const coldRows = chunk.cold.slice();
  const livingBefore = state.botPopulation!.livingLordCount;
  const result = completePlan(state.botPopulation!, chunk, hot, coldRows, attackerOffset, coldRows[attackerOffset]!,
    (['S', 'A', 'B', 'C', 'D'] as const)[chunk.talentGrades[attackerOffset]!]!, state, 1, world);
  const personal = result.events.find(event => event.type === 'bot_lord_raided_personal_attack')!;
  const battle = result.events.find(event => event.type === 'bot_battle_settled')!;
  assert.ok(Number(personal.payload.damage) >= 5);
  assert.equal(personal.payload.hpAfter, 0);
  assert.equal(battle.payload.winner, 'attacker');
  assert.equal(battle.payload.attackerLosses, 0);
  assert.equal(battle.payload.defenderLosses, 0);
  assert.equal(hot.armySize[targetOffset], 0, 'an empty defense is not replaced by a fictional troop casualty');
  assert.equal(coldRows[targetOffset]!.lord.lifeState, 'dead');
  assert.equal(result.population.livingLordCount, livingBefore - 1);
  assert.equal(result.population.activeLordOrdinals!.includes(coldRows[targetOffset]!.ordinal), false);
  assert.equal(result.population.remainsChests.filter(chest => chest.botId === targetId).length, 1);
});

test('posthumous opening rewards join the same remains cache, including after its first claim', () => {
  const buildDeadPopulation = (claimed: boolean) => {
    let state = freshState(`posthumous-reward-${claimed ? 'claimed' : 'unclaimed'}`);
    const botId = 'RC-002';
    const patched = patchBotPopulation(state, botId, (bot, hot, offset) => {
      const lord = damageBotLord({ ...bot.lord, hpMicro: 1_000_000 }, 1, 'combat', 0, 'fixture-fatal-hit');
      hot.alive[offset] = 0;
      hot.nextWakeAtElapsedMs[offset] = Number.MAX_SAFE_INTEGER;
      hot.foodMicro[offset] = 0; hot.woodMicro[offset] = 0; hot.stoneMicro[offset] = 0; hot.oreMicro[offset] = 0;
      hot.reservedFoodMicro[offset] = 0; hot.reservedWoodMicro[offset] = 0; hot.reservedStoneMicro[offset] = 0; hot.reservedOreMicro[offset] = 0;
      hot.firewoodMicro[offset] = 0; hot.buildingCount[offset] = 0;
      return { ...bot, lord, blueprintIds: [], structures: [], eventInventory: [], heldItems: [],
        carriedCargo: { food: 0, wood: 0, stone: 0, ore: 0, firewood: 0, water: 0, rawWater: 0, rawSalt: 0, coal: 0 },
        potableWaterMl: 0 };
    });
    const bot = patched.population.chunks[patched.chunkIndex]!.cold[patched.offset]!;
    const deathEventId = bot.lord.deathRecord!.deathEventId;
    const chest = {
      id: `BOT-REMAINS-CHEST:${deathEventId}`, deathEventId, botId, position: bot.position,
      createdAtElapsedMs: 0, resourceMicro: { food: 0, wood: 0, stone: 0, ore: 0 },
      waterMl: 0, firewoodMicro: 0, inventoryItems: [], blueprintItems: [], ownedChests: [],
      state: claimed ? 'claimed' as const : 'unclaimed' as const, claimedById: claimed ? state.player.id : null,
    };
    state.botPopulation = {
      ...patched.population,
      livingLordCount: patched.population.livingLordCount - 1,
      remainsChests: [chest],
      eventReceipts: [{ id: `EV01:${botId}`, eventId: 'EV01-OPENING-LEVEL', botId,
        actionReceiptId: `${botId}:qualifying-action`, scoreRule: 'BOT-OPENING-LEVEL-10-RECEIPT-1.0', scoreDelta: 1, occurredAtElapsedMs: 0 }],
    };
    return state.botPopulation!;
  };

  const rows = [{ playerId: 'RC-002', rank: 1, rewardBandId: 'FIXTURE-RANK-REWARD', rewardItems: [
    { instanceId: 'FIXTURE-OPENING-ITEM', itemTemplateId: 'BOT-LORD-IRON-WEAPON', quantity: 1, status: 'committed' as const, blocker: null },
  ] }];
  const unclaimed = awardBotOpeningRankRewards(buildDeadPopulation(false), rows, 144 * HOUR_MS);
  assert.equal(unclaimed.chunks[0]!.cold[0]!.eventInventory.length, 0);
  const receiptId = `${unclaimed.saveSeed}:EV01-OPENING-LEVEL:RC-002:FIXTURE-RANK-REWARD:REWARD`;
  assert.equal(unclaimed.rewardReceipts[0]?.id, receiptId);
  assert.equal(unclaimed.remainsChests[0]!.inventoryItems[0]?.rewardReceiptId, receiptId);
  assert.equal(unclaimed.remainsChests[0]!.inventoryItems[0]?.quantity, 1);

  const reopened = awardBotOpeningRankRewards(buildDeadPopulation(true), rows, 144 * HOUR_MS);
  assert.equal(reopened.remainsChests[0]!.state, 'unclaimed');
  assert.equal(reopened.remainsChests[0]!.claimedById, null);
  assert.equal(reopened.remainsChests[0]!.inventoryItems[0]?.instanceId,
    `${reopened.saveSeed}:EV01-OPENING-LEVEL:RC-002:FIXTURE-RANK-REWARD:REWARD:ITEM:FIXTURE-OPENING-ITEM:STACK`);
});
