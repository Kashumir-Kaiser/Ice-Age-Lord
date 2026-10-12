import type { FixedEventScheduleRow } from '../../contracts/src/index.ts';

export const EVENT_MECHANICS_RULE_VERSION = 'LL01-EVENT-MECHANICS-DESIGN-1.0' as const;

export type EventMechanicsRule = {
  title: string;
  target: number;
  activityPoints: Readonly<Record<string, number>>;
};

// These are versioned implementation rules where the fixed source calendar does
// not provide a complete local, single-save scoring procedure. Inputs are committed
// domain outcomes; clients never submit score values.
export const EVENT_MECHANICS: Readonly<Record<string, EventMechanicsRule>> = {
  'EV02-DRAGON-REVIVAL': { title: 'Dragon revival combat score', target: 10, activityPoints: { combat_encounter_won: 5 } },
  'EV03-ICE-HORN': { title: 'Ice horn cache score', target: 10, activityPoints: { chest_opened: 5 } },
  'EV04-FIRST-MERGE-DRAGON-POINTS': { title: 'First merge contribution score', target: 20, activityPoints: { combat_encounter_won: 5, harvest_work_completed: 2 } },
  'EV05-ANNO-FISHING': { title: 'Anno local contest contribution score', target: 10, activityPoints: { harvest_work_completed: 2 } },
  'EV06-CONSTRUCTION-WEEK': { title: 'Completed construction score', target: 20, activityPoints: { construction_building_completed: 10, lord_house_repaired: 5 } },
  'EV07-KINGDOM-WRATH': { title: 'Kingdom defense combat score', target: 15, activityPoints: { combat_encounter_won: 5 } },
  'EV08-WORLD-BOSS': { title: 'World boss combat score', target: 40, activityPoints: { combat_encounter_won: 10 } },
  'EV09-ORACLE-WAR': { title: 'Oracle battlefield combat score', target: 60, activityPoints: { combat_encounter_won: 3 } },
  'EV10-MONSTER-SIEGE': { title: 'Siege preparation and combat score', target: 30, activityPoints: { combat_encounter_won: 5, construction_building_completed: 5 } },
  'EV11-MIST-DISASTER': { title: 'Mist scouting and combat score', target: 8, activityPoints: { spatial_search_completed: 1, combat_encounter_won: 2 } },
  'EV12-LEGION-RACE': { title: 'Legion development score', target: 30, activityPoints: { construction_building_completed: 5, combat_encounter_won: 3 } },
  'EV13-BLOOD-CHAOS': { title: 'Blood chaos combat score', target: 50, activityPoints: { combat_encounter_won: 5 } },
  'EV14-DREAM-SHARD': { title: 'Dream exploration score', target: 200, activityPoints: { spatial_search_completed: 2 } },
  'EV15-SKORK-RAT': { title: 'Skork hunt score', target: 40, activityPoints: { combat_encounter_won: 5 } },
  'EV16-GIANT-CITY': { title: 'Giant city contribution score', target: 15, activityPoints: { chest_opened: 5, construction_building_completed: 5 } },
  'EV17-NORTH-UNIFICATION': { title: 'Northern route and combat score', target: 24, activityPoints: { movement_order_completed: 3, combat_encounter_won: 3 } },
  'EV18-LIGHT-GOD-FINAL': { title: 'Final light campaign combat score', target: 50, activityPoints: { combat_encounter_won: 5 } },
  'EV19-ICE-SNOW-CHOICE': { title: 'Ice or snow faction choice', target: 1, activityPoints: { event_choice_made: 1 } },
  'EV20-DEEP-SEA-ARK': { title: 'Ark expedition cache score', target: 20, activityPoints: { chest_opened: 5 } },
  'EV21-WEST-CHURCH-WAR': { title: 'Western war combat score', target: 30, activityPoints: { combat_encounter_won: 5 } },
  'EV22-ANCIENT-DRAGON-P1': { title: 'Ancient dragon phase one score', target: 20, activityPoints: { combat_encounter_won: 5 } },
  'EV23-ANCIENT-DRAGON-P2': { title: 'Ancient dragon phase two score', target: 20, activityPoints: { combat_encounter_won: 5 } },
  'EV24-DRAGON-FESTIVAL': { title: 'Dragon festival score', target: 30, activityPoints: { chest_opened: 3, combat_encounter_won: 3 } },
  'EV25-ABYSS-EXPEDITION': { title: 'Abyss expedition search score', target: 10, activityPoints: { spatial_search_completed: 2 } },
  'EV26-GODS-CHAOS': { title: 'Gods chaos combat score', target: 60, activityPoints: { combat_encounter_won: 5 } },
  'EV27-WORLD-PROTECTOR': { title: 'World protector defense score', target: 40, activityPoints: { combat_encounter_won: 3, construction_building_completed: 3 } },
  'EV28-ANCIENT-DRAGON-HUNT': { title: 'Ancient dragon hunt score', target: 50, activityPoints: { combat_encounter_won: 10 } },
  'EV29-FINAL-CALAMITY': { title: 'Final calamity resolution score', target: 30, activityPoints: { combat_encounter_won: 5 } },
};

export function eventMechanicsFor(eventId: string): EventMechanicsRule | null {
  return EVENT_MECHANICS[eventId] ?? null;
}

export function assertEventMechanics(schedule: readonly FixedEventScheduleRow[]): void {
  const committedActivityTypes = new Set([
    'combat_encounter_won', 'chest_opened', 'harvest_work_completed', 'construction_building_completed',
    'lord_house_repaired', 'spatial_search_completed', 'movement_order_completed', 'event_choice_made',
  ]);
  const required = schedule.filter(event => event.id !== 'EV00-SAFE-FIRE' && event.id !== 'EV01-OPENING-LEVEL');
  if (required.length !== 28 || required.some(event => !EVENT_MECHANICS[event.id])) throw new Error('EVENT_MECHANICS_INCOMPLETE');
  for (const event of required) {
    const rule = EVENT_MECHANICS[event.id];
    if (!rule.title || !Number.isSafeInteger(rule.target) || rule.target < 1 || Object.entries(rule.activityPoints).length === 0
      || Object.values(rule.activityPoints).some(points => !Number.isSafeInteger(points) || points < 1)
      || Object.keys(rule.activityPoints).some(type => !committedActivityTypes.has(type))) {
      throw new Error(`EVENT_MECHANICS_INVALID: ${event.id}`);
    }
  }
  if (Object.keys(EVENT_MECHANICS).some(eventId => !required.some(event => event.id === eventId))) throw new Error('EVENT_MECHANICS_ORPHANED');
}
