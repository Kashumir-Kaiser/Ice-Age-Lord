import type { CoordinateMm, GameState, WildlifeGroupState, WildlifeRuntimeState, WorldDefinition } from '../../contracts/src/index.ts';
import { hash64 } from './hash.ts';

export const WILDLIFE_RULE_VERSION = 'LL01-FINITE-WILDLIFE-1.0' as const;
export const WILDLIFE_REPLENISHMENT_MS = 24 * 60 * 60 * 1_000;
const GROUP_SIZE = 5;
const REGION_RADII_MM: Readonly<Record<string, number>> = {
  'ECO-LL01-R0': 2_500_000,
  'ECO-LL01-R1': 8_000_000,
  'ECO-LL01-R2': 20_000_000,
  'ECO-LL01-R3': 42_000_000,
  'ECO-LL01-R4': 72_000_000,
};
const NAME_MAP: Readonly<Record<string, { id: string; name: string }>> = {
  'thỏ_băng': { id: 'SPECIES-ICE-HARE', name: 'Thỏ băng' },
  'cáo_tuyết': { id: 'SPECIES-SNOW-FOX', name: 'Cáo tuyết' },
  'hươu_sương': { id: 'SPECIES-FROST-DEER', name: 'Hươu sương' },
  'sâu_đào_băng': { id: 'SPECIES-ICE-BURROWER', name: 'Sâu đào băng' },
  'quạ_xác': { id: 'SPECIES-CARRION-CROW', name: 'Quạ xác' },
  'sói_tuyết': { id: 'SPECIES-SNOW-WOLF', name: 'Sói tuyết' },
  'bò_lông_dài': { id: 'SPECIES-WOOLLY-OX', name: 'Bò lông dài' },
  'gấu_hang_băng': { id: 'SPECIES-ICE-CAVE-BEAR', name: 'Gấu hang băng' },
  predator: { id: 'SPECIES-REGIONAL-PREDATOR', name: 'Thú săn mồi' },
  'quái_bản_địa': { id: 'SPECIES-LOCAL-MONSTER', name: 'Quái bản địa' },
  'thú_ăn_cỏ': { id: 'SPECIES-REGIONAL-HERBIVORE', name: 'Thú ăn cỏ' },
  'undead_hoang_không_thuộc_Sora/Trevil': { id: 'SPECIES-UNTETHERED-UNDEAD', name: 'Vong linh hoang' },
};

export function isWildlifeRenewable(populationKey: string): boolean {
  return /thỏ|hươu|bò|thú_ăn_cỏ/u.test(populationKey);
}

function deterministicPosition(ecologyId: string, populationKey: string, groupOrdinal: number): CoordinateMm {
  const radius = REGION_RADII_MM[ecologyId] ?? 70_000_000;
  const angle = Number(hash64([WILDLIFE_RULE_VERSION, ecologyId, populationKey, String(groupOrdinal)]) % 6_283_185n) / 1_000_000;
  const ring = 0.72 + (groupOrdinal % 5) * 0.07;
  return { xMm: Math.round(Math.cos(angle) * radius * ring), yMm: Math.round(Math.sin(angle) * radius * ring), sourceZMetres: 0 };
}

export function initialWildlifeState(world: WorldDefinition, atElapsedMs = 0): WildlifeRuntimeState {
  const groups: WildlifeGroupState[] = [];
  for (const ecology of world.ecology) {
    for (const [populationKey, authoredCount] of Object.entries(ecology.counts).sort(([left], [right]) => left.localeCompare(right))) {
      if (!Number.isSafeInteger(authoredCount) || authoredCount < 0) throw new Error(`WILDLIFE_POPULATION_INVALID: ${ecology.id}:${populationKey}`);
      // The opening hare is a separately authored fixed encounter and is already one
      // member of the R0 hare count. Keep the other 37 source members in these groups.
      const count = ecology.id === 'ECO-LL01-R0' && populationKey === 'thỏ_băng' ? Math.max(0, authoredCount - 1) : authoredCount;
      const species = NAME_MAP[populationKey] ?? { id: `SPECIES-${ecology.id}-${populationKey.toUpperCase().replace(/[^A-Z0-9]+/gu, '-')}`, name: populationKey.replaceAll('_', ' ') };
      for (let offset = 0, groupOrdinal = 1; offset < count; offset += GROUP_SIZE, groupOrdinal++) {
        const capacity = Math.min(GROUP_SIZE, count - offset);
        groups.push({
          id: `WILDLIFE-${ecology.id}-${encodeURIComponent(populationKey)}-${String(groupOrdinal).padStart(3, '0')}`,
          ecologyId: ecology.id,
          populationKey,
          speciesId: species.id,
          displayName: species.name,
          capacity,
          remaining: capacity,
          position: deterministicPosition(ecology.id, populationKey, groupOrdinal),
          discovery: 'hidden',
          discoveredAtElapsedMs: null,
          lastSightingAtElapsedMs: null,
          nextMemberOrdinal: 1,
        });
      }
    }
  }
  return { ruleVersion: WILDLIFE_RULE_VERSION, groups, nextReplenishmentAtElapsedMs: atElapsedMs + WILDLIFE_REPLENISHMENT_MS };
}

export function wildlifeSpeciesProfile(populationKey: string, displayName: string, ecologyId: string, position: CoordinateMm, groupId: string, ordinal: number) {
  const predator = /sói|cáo|gấu|predator|quái|undead|sâu/u.test(populationKey);
  const speciesId = NAME_MAP[populationKey]?.id
    ?? `SPECIES-${populationKey.toUpperCase().replace(/[^A-Z0-9]+/gu, '-')}`;
  const health = predator ? 25 : 14;
  const strength = predator ? 8 : 3;
  const attributes = predator
    ? { STR: 8, VIT: 9, DEX: 7, INT: 3, SPI: 3, WIL: 7, PER: 8, PRE: 3, LUK: 3 }
    : { STR: 3, VIT: 5, DEX: 9, INT: 2, SPI: 2, WIL: 4, PER: 8, PRE: 2, LUK: 5 };
  return {
    actorId: `ACTOR-${groupId}-${String(ordinal).padStart(3, '0')}`,
    speciesId,
    name: displayName,
    sourceEcologyId: ecologyId,
    populationKey,
    sourcePopulationAtStart: 1,
    siteId: 'SITE-LL01-000',
    position: structuredClone(position),
    status: 'available' as const,
    wildlifeGroupId: groupId,
    individualOrdinal: ordinal,
    bodyRecord: {
      sourceProfileState: 'complete' as const,
      sourceProfileBlockers: [],
      authoring: 'user_authorized_stage07_overlay' as const,
      name: displayName,
      speciesId,
      anatomyTemplateId: `ANATOMY-${populationKey.toUpperCase().replace(/[^A-Z0-9]+/gu, '-')}-1.0`,
      formTier: 1,
      level: 1,
      xp: 0,
      grade: 'Thường',
      faction: `wildlife:${ecologyId}`,
      hero: false,
      rawAttributes: attributes,
      health: { current: health, max: health },
      integrity: 70,
      skills: [], talents: [], equipmentInstanceIds: [], heldEquipment: [], growthLedger: {},
      primaryFaction: `wildlife:${ecologyId}`,
      holyState: 'non_holy' as const,
      sealTags: [], directHolyLock: false, holyFieldExcess: false, memoryFragments: [],
      sourceRef: { path: 'packages/sim/src/wildlife.ts', heading: 'Versioned finite wildlife combat overlay', recordId: WILDLIFE_RULE_VERSION },
      sourceProfileId: `PROFILE-${populationKey.toUpperCase().replace(/[^A-Z0-9]+/gu, '-')}-1.0`,
      deathHistory: [], equipmentSlots: [],
    },
    combatProfile: {
      weaponDamage: predator ? 4 : 1,
      weaponRangeMm: predator ? 2_000 : 1_000,
      armor: predator ? 1 : 0,
      concealment: predator ? 10 : 6,
      terrainId: `TERRAIN-${ecologyId}`,
      strength,
    },
  };
}

export function discoverWildlifeAlongSweep(state: GameState, from: CoordinateMm, to: CoordinateMm, laneWidthMm: number, at: number): readonly WildlifeGroupState[] {
  const dx = to.xMm - from.xMm;
  const dy = to.yMm - from.yMm;
  const lengthSq = dx * dx + dy * dy;
  const nearby = state.wildlife.groups.filter(group => group.discovery === 'hidden' && group.remaining > 0
    && Math.abs((group.position.sourceZMetres ?? 0) - (from.sourceZMetres ?? 0)) <= 2
    && (() => {
      const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((group.position.xMm - from.xMm) * dx + (group.position.yMm - from.yMm) * dy) / lengthSq));
      return Math.hypot(group.position.xMm - (from.xMm + dx * t), group.position.yMm - (from.yMm + dy * t)) <= laneWidthMm / 2;
    })());
  if (!nearby.length) return [];
  const ids = new Set(nearby.map(group => group.id));
  state.wildlife = { ...state.wildlife, groups: state.wildlife.groups.map(group => ids.has(group.id)
    ? { ...group, discovery: 'known', discoveredAtElapsedMs: at, lastSightingAtElapsedMs: at }
    : group) };
  state.playerKnowledge = { ...state.playerKnowledge, knownWildlifeGroupIds: [...new Set([...(state.playerKnowledge.knownWildlifeGroupIds ?? []), ...ids])].sort() };
  return nearby.map(group => state.wildlife.groups.find(candidate => candidate.id === group.id)!);
}

export function replenishWildlife(state: GameState, at: number): readonly { groupId: string; amount: number; remaining: number }[] {
  const changes: { groupId: string; amount: number; remaining: number }[] = [];
  state.wildlife = {
    ...state.wildlife,
    nextReplenishmentAtElapsedMs: at + WILDLIFE_REPLENISHMENT_MS,
    groups: state.wildlife.groups.map(group => {
      if (!isWildlifeRenewable(group.populationKey) || group.remaining >= group.capacity) return group;
      const remaining = Math.min(group.capacity, group.remaining + 1);
      changes.push({ groupId: group.id, amount: remaining - group.remaining, remaining });
      return { ...group, remaining };
    }),
  };
  return changes;
}
