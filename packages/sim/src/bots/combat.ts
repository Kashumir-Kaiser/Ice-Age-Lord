import type { BotArmyMovement, BotColdRecord } from '../../../contracts/src/index.ts';
import { resolveFactionNeutralSquadEncounter } from '../combat.ts';
import { BOT_BLUEPRINT_BY_ID } from './blueprints.ts';
import { botCombatPermille } from './state.ts';
import type { BotTalentGrade, BotTalentKind } from '../../../contracts/src/index.ts';

export const BOT_COMBAT_RULE_VERSION = 'BOT-SETTLEMENT-ENCOUNTER-1.0';
export const BOT_IRON_WEAPON_POWER = 8;

export type BotBattleSide = { power: number; memberCount: number; defensePermille: number };
export type BotBattleResult = {
  winner: 'attacker' | 'defender';
  attackerLosses: number;
  defenderLosses: number;
  attackerPower: number;
  defenderPower: number;
  attackerLossPermille: number;
  defenderLossPermille: number;
  drawIndex: number;
};

export function botMovementCohortCounts(cold: BotColdRecord, movement: BotArmyMovement): ReadonlyMap<string, number> {
  if (movement.cohortMemberCounts) return new Map(movement.cohortMemberCounts.map(row => [row.cohortId, row.memberCount]));
  let remaining = movement.unitCount;
  const selected = new Map<string, number>();
  for (const cohort of cold.cohorts) {
    if (remaining <= 0) break;
    const memberCount = Math.min(cohort.livingCount, remaining);
    if (memberCount > 0) selected.set(cohort.id, memberCount);
    remaining -= memberCount;
  }
  return selected;
}

export function botHomeCohortCounts(cold: BotColdRecord): ReadonlyMap<string, number> {
  const away = cold.armyMovement?.unitKind === 'army' ? botMovementCohortCounts(cold, cold.armyMovement) : new Map<string, number>();
  return new Map(cold.cohorts.map(cohort => [cohort.id, Math.max(0, cohort.livingCount - (away.get(cohort.id) ?? 0))]));
}

export function botCohortPower(cold: BotColdRecord, grade: BotTalentGrade, kind: BotTalentKind, memberCounts?: ReadonlyMap<string, number>): number {
  const base = cold.cohorts.reduce((sum, cohort) => sum + (memberCounts?.get(cohort.id) ?? (memberCounts ? 0 : cohort.livingCount)) * (25 + cohort.level * 8
    + (cohort.equipmentTemplateIds.includes('BOT-WEAPON-IRON-1.0') ? BOT_IRON_WEAPON_POWER : 0))
    * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0);
  return Math.floor(base * botCombatPermille(grade, kind) / 1_000);
}

export function botSettlementDefensePermille(cold: BotColdRecord): number {
  const structureDefense = cold.structures.filter(item => item.status === 'active' || item.status === 'damaged').reduce((sum, item) => {
    const rule = BOT_BLUEPRINT_BY_ID.get(item.blueprintId);
    const durabilityPermille = item.status === 'active' ? 1_000 : Math.max(0, 1_000 - item.damagePermille);
    return sum + Math.floor((rule?.defensePermille ?? 0) * durabilityPermille / 1_000);
  }, 0);
  return Math.min(1_200, structureDefense);
}

/** Deterministic squad attrition; every side uses its current cohorts, health and defenses. */
export function resolveBotBattle(seed: string, actionId: string, attacker: BotBattleSide, defender: BotBattleSide): BotBattleResult {
  return resolveFactionNeutralSquadEncounter(seed, `${BOT_COMBAT_RULE_VERSION}:${actionId}`, attacker, defender);
}

/** Resolves home troops and fortifications; an empty undefended settlement is overrun without a battle roll. */
export function resolveBotSettlementBattle(seed: string, actionId: string, attacker: BotBattleSide, defender: BotBattleSide, defensePermille: number): BotBattleResult {
  if (defender.memberCount === 0 && defensePermille === 0) return {
    winner: 'attacker', attackerLosses: 0, defenderLosses: 0,
    attackerPower: attacker.power, defenderPower: 0, attackerLossPermille: 0, defenderLossPermille: 0, drawIndex: 0,
  };
  return resolveBotBattle(seed, actionId, attacker, {
    ...defender,
    power: defender.memberCount === 0 ? Math.max(1, defensePermille) : defender.power,
    defensePermille,
  });
}
