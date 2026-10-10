import type { UnitGroupView } from './GameClient';

/** Race filters reflect living player groups only; zero-count fixture cards never add a tab. */
export function visibleRaceFilters(groups: readonly UnitGroupView[]): { id:string; label:string }[] {
  const byRace=new Map<string,{id:string;label:string}>();
  for(const group of groups){
    if(group.alive>0&&!byRace.has(group.raceId))byRace.set(group.raceId,{id:group.raceId,label:group.raceLabel});
  }
  return [...byRace.values()];
}

export function livingUnitGroups(groups: readonly UnitGroupView[]): UnitGroupView[] {
  return groups.filter(group=>group.alive>0);
}
