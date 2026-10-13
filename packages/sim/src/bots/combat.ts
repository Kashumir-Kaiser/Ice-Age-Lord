import type { BotColdRecord } from '../../../contracts/src/index.ts';
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

export function botCohortPower(cold: BotColdRecord, grade: BotTalentGrade, kind: BotTalentKind): number {
  const base = cold.cohorts.reduce((sum, cohort) => sum + cohort.livingCount * (25 + cohort.level * 8
    + (cohort.equipmentTemplateIds.includes('BOT-WEAPON-IRON-1.0') ? BOT_IRON_WEAPON_POWER : 0))
    * cohort.healthPerMember / Math.max(1, cohort.maxHealthPerMember), 0);
  return Math.floor(base * botCombatPermille(grade, kind) / 1_000);
}

export function botSettlementDefensePermille(cold: BotColdRecord): number {
  const structureDefense = cold.structures.filter(item => item.status === 'active').reduce((sum, item) => {
    const rule = BOT_BLUEPRINT_BY_ID.get(item.blueprintId);
    return sum + (rule?.defensePermille ?? 0);
  }, 0);
  return Math.min(1_200, structureDefense);
}

/** Deterministic squad attrition; every side uses its current cohorts, health and defenses. */
export function resolveBotBattle(seed: string, actionId: string, attacker: BotBattleSide, defender: BotBattleSide): BotBattleResult {
  return resolveFactionNeutralSquadEncounter(seed, `${BOT_COMBAT_RULE_VERSION}:${actionId}`, attacker, defender);
}
