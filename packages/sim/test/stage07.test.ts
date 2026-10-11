import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { RULESET_VERSION } from '../../content/src/sourceLock.ts';
import { createNewGame } from '../src/initializer.ts';
import { previewCommand, reduceCommand } from '../src/reducer.ts';
import { projectPlayerView } from '../src/view.ts';
import {
  DIRECT_REVIVE_MIRROR_RULE, STAGE07_OPENING_CLOAK_ID, STAGE07_OPENING_CORPSE_ID,
  STAGE07_OPENING_SPEAR_ID, activateOpeningCareer, directReviveAvailability,
  lockDirectReviveOnSecondDeath, playerLevelThreshold, reviveDirect, settleOrdinaryLaborXp,
} from '../src/stage07.ts';

let serial = 0;
function freshState() {
  serial += 1;
  return createNewGame({
    saveId: 'stage07-save-' + serial,
    campaignId: 'stage07-campaign-' + serial,
    soulId: 'LI_LAN',
    worldPackageId: world.id,
    rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion,
    seed: 'stage07-seed-' + serial,
  }, world);
}
function envelope(state: { saveId: string; revision: number }, commandId: string, type: string, payload: Record<string, unknown>) {
  return { schemaVersion: 1, saveId: state.saveId, commandId, expectedRevision: state.revision, type, payload };
}
function submit(state: ReturnType<typeof freshState>, commandId: string, type: string, payload: Record<string, unknown>) {
  return reduceCommand(state, envelope(state, commandId, type, payload), world);
}
function inspectOpeningBody(state: ReturnType<typeof freshState>) {
  return submit(state, 'inspect-rook', 'inspect_entity', { entity: { type: 'corpse', id: STAGE07_OPENING_CORPSE_ID } });
}
function reviveOpeningBody(state: ReturnType<typeof freshState>) {
  return submit(state, 'revive-rook', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
}

test('fresh save reveals no body sheet until inspection, then directly revives the opening corpse once for free', () => {
  let state = freshState();
  const initialView = projectPlayerView(state, world);
  assert.equal(state.player.career.skills?.length ?? 0, 0);
  assert.equal(initialView.corpses?.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.label, 'Unidentified corpse');
  assert.equal(initialView.visibleMap.entities.some(entity => entity.ref.type === 'corpse' && entity.ref.id === STAGE07_OPENING_CORPSE_ID), true);

  const reviveBeforeInspection = envelope(state, 'revive-before-inspection', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(previewCommand(state, reviveBeforeInspection, world).reasonCode, 'CORPSE_NOT_INSPECTED');

  const inspected = inspectOpeningBody(state);
  assert.equal(inspected.receipt.accepted, true);
  state = inspected.state;
  const inspectedView = projectPlayerView(state, world);
  assert.equal(inspectedView.corpses?.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.label, 'Rook');

  state.territory.tomb.deathQi.current = 0;
  state.territory.tomb.queue = [];
  state.buildings = state.buildings.filter(building => building.kind !== 'tomb');
  const manaBefore = state.player.mana.current;
  const elapsedBefore = state.simElapsedMs;
  const priorItemIds = state.inventory.containers.flatMap(container => container.stacks.map(stack => stack.itemId));
  const reviveCommand = envelope(state, 'revive-rook', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  const revived = reduceCommand(state, reviveCommand, world);
  assert.equal(revived.receipt.accepted, true);
  assert.equal(revived.events.some(event => event.type === 'corpse_revived'), true);
  state = revived.state;

  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  assert.ok(unit);
  assert.equal(unit.sourceStats.formTier, 1);
  assert.equal(unit.level, 1);
  assert.equal(unit.xp, 24);
  assert.equal(unit.sourceStats.grade, 'Thường');
  assert.equal(unit.sourceStats.faction, 'Âm');
  assert.equal(unit.sourceStats.loyalty, 'ABSOLUTE');
  assert.equal(unit.health?.current, 37);
  assert.equal(unit.integrity, 86);
  assert.equal(unit.directReviveProvenance?.creationRoute, 'DIRECT_TU_PHUC');
  assert.equal(unit.xpMirrorEligible, true);
  assert.equal(state.simElapsedMs, elapsedBefore);
  assert.equal(state.player.mana.current, manaBefore);
  assert.equal(state.territory.tomb.deathQi.current, 0);
  assert.deepEqual(unit.equipmentIds, []);

  const allItemIds = state.inventory.containers.flatMap(container => container.stacks.flatMap(stack => Array(stack.quantity).fill(stack.itemId)));
  assert.deepEqual(allItemIds.filter(id => id === STAGE07_OPENING_SPEAR_ID), [STAGE07_OPENING_SPEAR_ID]);
  assert.deepEqual(allItemIds.filter(id => id === STAGE07_OPENING_CLOAK_ID), [STAGE07_OPENING_CLOAK_ID]);
  assert.equal(allItemIds.length, priorItemIds.length + 2);
  assert.equal(priorItemIds.includes(STAGE07_OPENING_SPEAR_ID), false);
  assert.equal(priorItemIds.includes(STAGE07_OPENING_CLOAK_ID), false);

  const retry = reduceCommand(state, reviveCommand, world);
  assert.equal(retry.receipt.accepted, true);
  assert.equal(retry.state.ownedUnits.length, state.ownedUnits.length);
  const secondRequest = submit(state, 'revive-rook-again', 'revive', { actorId: state.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(secondRequest.receipt.accepted, false);
  assert.equal(secondRequest.receipt.code, 'CORPSE_ALREADY_REVIVED');
  assert.equal(secondRequest.state.ownedUnits.length, state.ownedUnits.length);
});

test('career stays sealed until inspected and activation learns only the opening skill without refilling Mana', () => {
  let state = freshState();
  const manaBefore = state.player.mana.current;
  assert.equal(state.player.career.state, 'unemployed_card_sealed');
  assert.equal(state.player.career.skills?.length ?? 0, 0);
  const inspected = submit(state, 'inspect-card', 'inspect_career_card', {});
  assert.equal(inspected.receipt.accepted, true);
  state = inspected.state;
  const active = submit(state, 'activate-card', 'activate_career_card', { cardId: 'JOB-SUM-NECRO-01' });
  assert.equal(active.receipt.accepted, true);
  state = active.state;
  assert.equal(state.player.career.state, 'active');
  assert.equal(state.player.mana.current, manaBefore);
  assert.equal(state.player.career.skills?.length, 1);
  assert.equal(state.player.career.skills?.[0].templateId, 'SK-OPEN-NECRO-01');
  assert.equal(state.player.career.skills?.[0].mastery, 0);

  const duplicate = submit(state, 'activate-card-again', 'activate_career_card', { cardId: 'JOB-SUM-NECRO-01' });
  assert.equal(duplicate.receipt.accepted, true);
  assert.equal(duplicate.state.player.career.skills?.length, 1);
  assert.equal(duplicate.receipt.code, 'ALREADY_ACTIVE');
});

test('equipment uses the corpse item instances once, respects anatomy slots, and updates the player unit sheet', () => {
  let state = freshState();
  const inspected = inspectOpeningBody(state);
  state = inspected.state;
  state = reviveOpeningBody(state).state;
  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  assert.equal(unit.equipmentSlots?.length, 2);

  const incompatible = submit(state, 'equip-cloak-hand', 'equip', { unitId: unit.id, itemId: STAGE07_OPENING_CLOAK_ID, slotId: 'MAIN_HAND' });
  assert.equal(incompatible.receipt.accepted, false);
  assert.equal(incompatible.receipt.code, 'EQUIPMENT_TAG_MISMATCH');

  const weapon = submit(state, 'equip-spear', 'equip', { unitId: unit.id, itemId: STAGE07_OPENING_SPEAR_ID, slotId: 'MAIN_HAND' });
  assert.equal(weapon.receipt.accepted, true);
  state = weapon.state;
  const armor = submit(state, 'equip-cloak', 'equip', { unitId: unit.id, itemId: STAGE07_OPENING_CLOAK_ID, slotId: 'BODY' });
  assert.equal(armor.receipt.accepted, true);
  state = armor.state;

  const view = projectPlayerView(state, world);
  const sheet = view.units.find(candidate => candidate.id === unit.id)!;
  assert.deepEqual([...sheet.equipmentIds].sort(), [STAGE07_OPENING_CLOAK_ID, STAGE07_OPENING_SPEAR_ID].sort());
  assert.equal(sheet.equipmentSlots?.find(slot => slot.slotId === 'MAIN_HAND')?.occupiedItemId, STAGE07_OPENING_SPEAR_ID);
  assert.equal(view.inventory.containers.flatMap(container => container.items).find(item => item.itemId === STAGE07_OPENING_CLOAK_ID)?.equipped, true);

  const removed = submit(state, 'unequip-cloak', 'unequip_item', { unitId: unit.id, itemId: STAGE07_OPENING_CLOAK_ID });
  assert.equal(removed.receipt.accepted, true);
  state = removed.state;
  assert.equal(projectPlayerView(state, world).units.find(candidate => candidate.id === unit.id)?.equipmentSlots?.find(slot => slot.slotId === 'BODY')?.occupiedItemId, null);
  assert.equal(state.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.itemId === STAGE07_OPENING_CLOAK_ID).length, 1);
});

test('legitimate direct-unit labor XP mirrors net XP once, offscreen, and retains multi-level growth', () => {
  let state = freshState();
  state = inspectOpeningBody(state).state;
  state = reviveOpeningBody(state).state;
  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  unit.position = { xMm: 90_000_000, yMm: 90_000_000 };
  const ownerXpBefore = state.player.xp;
  const result = settleOrdinaryLaborXp(state, unit.id, 100, 'LABOR-STAGE07-MULTILEVEL', 123_456);
  state = result.state;

  assert.equal(result.transactions.length, 2);
  const normal = result.transactions.find(transaction => transaction.transactionKind === 'NORMAL_AWARD')!;
  const mirror = result.transactions.find(transaction => transaction.transactionKind === 'OWNER_XP_MIRROR')!;
  assert.equal(normal.netXp, 1_000);
  assert.equal(mirror.netXp, normal.netXp);
  assert.equal(mirror.ruleVersion, DIRECT_REVIVE_MIRROR_RULE);
  assert.equal(state.player.xp, ownerXpBefore + 540);
  assert.equal(state.player.level, 3);
  assert.deepEqual(mirror.thresholdsCrossed, [2, 3]);
  assert.equal(state.player.career.pendingGrowth, 16);
  assert.equal(state.ownedUnits.find(candidate => candidate.id === unit.id)?.level, 3);

  const key = 'LABOR-STAGE07-MULTILEVEL|LI_LAN|' + DIRECT_REVIVE_MIRROR_RULE;
  assert.deepEqual(state.progression?.mirrorReceiptKeys, [key]);
  const duplicate = settleOrdinaryLaborXp(state, unit.id, 100, 'LABOR-STAGE07-MULTILEVEL', 123_456);
  assert.equal(duplicate.transactions.length, 0);
  assert.equal(duplicate.state.player.level, state.player.level);
  assert.equal(duplicate.state.ownedUnits.find(candidate => candidate.id === unit.id)?.xp, state.ownedUnits.find(candidate => candidate.id === unit.id)?.xp);

  const tombUnit = { ...state.ownedUnits[0], id: 'STAGE07-TOMB-UNIT', creationRoute: 'TOMB_QUEUE', directReviveProvenance: undefined, xpMirrorEligible: false };
  state.ownedUnits = [...state.ownedUnits, tombUnit];
  const tombAward = settleOrdinaryLaborXp(state, tombUnit.id, 5, 'LABOR-STAGE07-TOMB', 123_500);
  assert.equal(tombAward.transactions.length, 1);
  assert.equal(tombAward.transactions[0].transactionKind, 'NORMAL_AWARD');
  assert.equal(tombAward.state.player.level, state.player.level);
});

test('revival and body disposal are mutually exclusive; recovered gear keeps its instance IDs', () => {
  let base = freshState();
  base = inspectOpeningBody(base).state;
  const reviveRequest = envelope(base, 'race-revive', 'revive', { actorId: base.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  const butcherRequest = envelope(base, 'race-butcher', 'butcher_corpse', { actorId: base.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });

  const butcherFirst = reduceCommand(base, butcherRequest, world);
  assert.equal(butcherFirst.receipt.accepted, true);
  assert.equal(butcherFirst.state.corpses.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.state, 'butchered');
  const recovered = butcherFirst.state.inventory.containers.flatMap(container => container.stacks);
  assert.equal(recovered.filter(stack => stack.itemId === STAGE07_OPENING_SPEAR_ID).length, 1);
  assert.equal(recovered.filter(stack => stack.itemId === STAGE07_OPENING_CLOAK_ID).length, 1);
  assert.deepEqual(butcherFirst.state.corpses.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.bodyRecord?.equipmentInstanceIds, []);
  const lateRevive = submit(butcherFirst.state, 'late-revive', 'revive', { actorId: base.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(lateRevive.receipt.accepted, false);
  assert.equal(lateRevive.receipt.code, 'CORPSE_ALREADY_BUTCHERED');
  assert.equal(lateRevive.state.ownedUnits.length, base.ownedUnits.length);

  let other = freshState();
  other = inspectOpeningBody(other).state;
  const revived = submit(other, 'race-revive-first', 'revive', { actorId: other.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(revived.receipt.accepted, true);
  const lateButcher = submit(revived.state, 'late-butcher', 'butcher_corpse', { actorId: other.player.id, corpseId: STAGE07_OPENING_CORPSE_ID });
  assert.equal(lateButcher.receipt.accepted, false);
  assert.equal(lateButcher.receipt.code, 'CORPSE_ALREADY_REVIVED');
  assert.equal(lateButcher.state.inventory.containers.flatMap(container => container.stacks).filter(stack => stack.itemId === STAGE07_OPENING_SPEAR_ID).length, 1);
});

test('invalid body records are read-only blockers and do not mutate the corpse', () => {
  const state = freshState();
  state.playerKnowledge.lastInspectedEntityIds = ['corpse:' + STAGE07_OPENING_CORPSE_ID];
  const corpse = state.corpses.find(item => item.id === STAGE07_OPENING_CORPSE_ID)!;
  corpse.bodyRecord = { ...corpse.bodyRecord!, sourceProfileState: 'incomplete', sourceProfileBlockers: ['missing source anatomy'] };
  const before = JSON.stringify(corpse);
  const result = directReviveAvailability(state, world, state.player.id, corpse.id);
  assert.equal(result.code, 'CORPSE_BODY_PROFILE_INCOMPLETE');
  assert.equal(JSON.stringify(corpse), before);
  assert.equal(result.state, state);
});

test('second death closes the original direct-revival link permanently', () => {
  let state = freshState();
  state = inspectOpeningBody(state).state;
  state = reviveOpeningBody(state).state;
  const unit = state.ownedUnits.find(candidate => candidate.creationRoute === 'DIRECT_TU_PHUC')!;
  state = lockDirectReviveOnSecondDeath(state, unit.id, 999_000);

  const deadUnit = state.ownedUnits.find(candidate => candidate.id === unit.id)!;
  assert.equal(deadUnit.health?.current, 0);
  assert.equal(deadUnit.integrity, 0);
  assert.equal(deadUnit.xpMirrorEligible, false);
  assert.equal(deadUnit.directReviveProvenance?.secondDeathLocked, true);
  assert.equal(state.corpses.find(corpse => corpse.id === STAGE07_OPENING_CORPSE_ID)?.state, 'second_death_locked');

  const retry = directReviveAvailability(state, world, state.player.id, STAGE07_OPENING_CORPSE_ID);
  assert.equal(retry.code, 'SECOND_DEATH_LOCKED');
});

test('source Holy transformation exception lowers both Bậc and grade, while restricted Holy bodies remain invalid', () => {
  const state = freshState();
  state.playerKnowledge.lastInspectedEntityIds = ['corpse:' + STAGE07_OPENING_CORPSE_ID];
  const corpse = state.corpses.find(candidate => candidate.id === STAGE07_OPENING_CORPSE_ID)!;
  corpse.bodyRecord = { ...corpse.bodyRecord!, formTier: 2, grade: 'Cựu binh', holyState: 'holy' };
  const availability = directReviveAvailability(state, world, state.player.id, corpse.id);
  assert.equal(availability.code, null);
  const transformed = reviveDirect(state, world, state.player.id, corpse.id, 'STAGE07-HOLY-UNIT');
  assert.equal(transformed.code, null);
  assert.equal(transformed.state.ownedUnits.at(-1)?.sourceStats.formTier, 1);
  assert.equal(transformed.state.ownedUnits.at(-1)?.sourceStats.grade, 'Thường');
  assert.equal(transformed.state.ownedUnits.at(-1)?.level, 1);
  assert.equal(transformed.state.ownedUnits.at(-1)?.xp, 24);

  const tierOneHoly = { ...state, corpses: state.corpses.map(candidate => candidate.id !== corpse.id ? candidate : { ...candidate, bodyRecord: { ...candidate.bodyRecord!, formTier: 1 } }) };
  assert.equal(directReviveAvailability(tierOneHoly, world, state.player.id, corpse.id).code, 'HOLY_TIER_TRANSFORM_UNAVAILABLE');

  const sealedState = { ...state, corpses: state.corpses.map(candidate => candidate.id !== corpse.id ? candidate : { ...candidate, directHolyLock: true }) };
  assert.equal(directReviveAvailability(sealedState, world, state.player.id, corpse.id).code, 'HOLY_DIRECT_REVIVE_LOCKED');
  assert.equal(playerLevelThreshold(1), 110);
});

test('career growth applies eight held points on activation, with the source SPI/PRE split', () => {
  let state = freshState();
  state.player.career.pendingGrowth = 16;
  state = activateOpeningCareer(state);
  assert.equal(state.player.career.pendingGrowth, 0);
  const delta = state.player.career.allocatedGrowth!;
  assert.equal(delta.SPI, 8.8);
  assert.equal(delta.PRE, 4);
  assert.ok(Math.abs(Object.values(delta).reduce((sum, value) => sum + value, 0) - 16) < 0.000001);
});
