import type {
  CombatEncounterState, CombatLogEntry, CorpseBodyRecord, CorpseState, GameState, PlayerUnitState, Stage07CombatState, Stage07CombatView, WorldDefinition,
} from '../../contracts/src/index.ts';
import { randomIntFromFields } from './hash.ts';
import { lockDirectReviveOnSecondDeath, settleOrdinaryCombatXp } from './stage07.ts';
import { wildlifeSpeciesProfile } from './wildlife.ts';

export const STAGE07_HARE_ACTOR_ID = 'ACTOR-STAGE07-ICE-HARE-01';
export const STAGE07_HARE_TARGET_ID = 'TARGET-STAGE07-ICE-HARE-01';
export const STAGE07_HARE_ECOLOGY_ID = 'ECO-LL01-R0';
export const STAGE07_HARE_POPULATION_KEY = 'thỏ_băng';
export const STAGE07_COMBAT_RULE = 'STAGE07-DETERMINISTIC-MELEE-1.0';
export const STAGE07_GROUP_COMBAT_RULE = 'STAGE07-DETERMINISTIC-SQUAD-MELEE-1.0';
export const STAGE07_HUNT_XP = 12;
export const STAGE07_COMBAT_TURN_MS = 4_000;
const H0_SITE_ID = 'SITE-LL01-000';
const HARE_TERRAIN_ID = 'TERRAIN-H0-FROZEN-SHELF';
const HARE_STREAM_PREFIX = 'stage07-combat:';
const GROUP_STREAM_PREFIX = 'stage07-group-combat:';

/** Faction-neutral deterministic squad resolution shared by authoritative bot encounters. */
export type FactionNeutralCombatSide = { power: number; memberCount: number; defensePermille: number };
export type FactionNeutralCombatResult = {
  winner: 'attacker' | 'defender';
  attackerLosses: number;
  defenderLosses: number;
  attackerPower: number;
  defenderPower: number;
  attackerLossPermille: number;
  defenderLossPermille: number;
  drawIndex: number;
};

export function resolveFactionNeutralSquadEncounter(seed: string, encounterId: string, attacker: FactionNeutralCombatSide, defender: FactionNeutralCombatSide): FactionNeutralCombatResult {
  for (const side of [attacker, defender]) {
    if (![side.power, side.memberCount, side.defensePermille].every(Number.isSafeInteger)
      || side.power < 1 || side.memberCount < 1 || side.defensePermille < 0) throw new Error('FACTION_NEUTRAL_COMBAT_SIDE_INVALID');
  }
  const attackerPower = Math.max(1, Math.floor(attacker.power * 1_000 / (1_000 + defender.defensePermille)));
  const defenderPower = Math.max(1, Math.floor(defender.power * 1_000 / (1_000 + attacker.defensePermille)));
  const attackerSharePermille = Math.floor(attackerPower * 1_000 / (attackerPower + defenderPower));
  const winnerDraw = randomIntFromFields([seed, encounterId, 'FACTION-NEUTRAL-COMBAT-1.0', 'winner'], 0, 999).value;
  const attritionDraw = randomIntFromFields([seed, encounterId, 'FACTION-NEUTRAL-COMBAT-1.0', 'attrition'], 0, 999).value;
  const attackerLossPermille = Math.min(850, 100 + Math.ceil(defenderPower * 300 / attackerPower) + attritionDraw % 31);
  const defenderLossPermille = Math.min(850, 100 + Math.ceil(attackerPower * 300 / defenderPower) + Math.floor(attritionDraw / 31));
  return {
    winner: winnerDraw < attackerSharePermille ? 'attacker' : 'defender',
    attackerLosses: Math.min(attacker.memberCount, Math.max(1, Math.ceil(attacker.memberCount * attackerLossPermille / 1_000))),
    defenderLosses: Math.min(defender.memberCount, Math.max(1, Math.ceil(defender.memberCount * defenderLossPermille / 1_000))),
    attackerPower,
    defenderPower,
    attackerLossPermille,
    defenderLossPermille,
    drawIndex: 1,
  };
}

export type CombatAvailability = { code: string | null; requirements: readonly string[] };
type WeaponProfile = { damage: number; rangeMm: number; condition: number };

function findOpeningSite(world: WorldDefinition) {
  return world.sites.find(site => site.id === H0_SITE_ID) ?? null;
}

function openingHareProfile(): CorpseBodyRecord {
  return {
    sourceProfileState: 'complete',
    sourceProfileBlockers: [],
    authoring: 'user_authorized_stage07_overlay',
    name: 'Thỏ băng',
    speciesId: 'SPECIES-STAGE07-ICE-HARE',
    anatomyTemplateId: 'ANATOMY-QUADRUPED-ICE-HARE-1.0',
    formTier: 1,
    level: 1,
    xp: 0,
    grade: 'Thường',
    faction: 'wildlife:R0',
    hero: false,
    rawAttributes: { STR: 5, VIT: 6, DEX: 10, INT: 2, SPI: 2, WIL: 5, PER: 9, PRE: 3, LUK: 8 },
    health: { current: 16, max: 16 },
    integrity: 91,
    skills: [],
    talents: [],
    equipmentInstanceIds: [],
    heldEquipment: [],
    growthLedger: {},
    primaryFaction: 'wildlife:R0',
    holyState: 'non_holy',
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    memoryFragments: [],
    sourceRef: { path: 'packages/sim/src/combat.ts', heading: 'User-authorized opening encounter balance overlay', recordId: STAGE07_COMBAT_RULE },
    sourceProfileId: 'PROFILE-STAGE07-ICE-HARE-T1-1.0',
    deathHistory: [],
    equipmentSlots: [],
  };
}

export function createStage07CombatState(world: WorldDefinition): Stage07CombatState {
  const site = findOpeningSite(world);
  const region = world.ecology.find(item => item.id === STAGE07_HARE_ECOLOGY_ID);
  const count = Number(region?.counts[STAGE07_HARE_POPULATION_KEY] ?? 0);
  const origin = site?.position ?? { xMm: 0, yMm: 0, sourceZMetres: 0 };
  return {
    nextEncounterSequence: 1,
    target: {
      actorId: STAGE07_HARE_ACTOR_ID,
      speciesId: 'SPECIES-STAGE07-ICE-HARE',
      name: 'Thỏ băng',
      sourceEcologyId: STAGE07_HARE_ECOLOGY_ID,
      populationKey: STAGE07_HARE_POPULATION_KEY,
      sourcePopulationAtStart: Number.isSafeInteger(count) && count > 0 ? count : 0,
      siteId: H0_SITE_ID,
      position: { xMm: origin.xMm + 1_200, yMm: origin.yMm + 900, sourceZMetres: origin.sourceZMetres ?? 0 },
      status: 'available',
      bodyRecord: openingHareProfile(),
      combatProfile: { weaponDamage: 1, weaponRangeMm: 1_500, armor: 0, concealment: 8, terrainId: HARE_TERRAIN_ID },
    },
    encounters: [],
  };
}

export function combatStateFor(state: GameState, world: WorldDefinition): Stage07CombatState {
  return state.combat ?? createStage07CombatState(world);
}

function preyForTargetId(state: GameState, world: WorldDefinition, targetId: string): { prey: Stage07CombatState['target']; wildlifeGroupId: string | null; newlyMaterialized: boolean } | null {
  const combat = combatStateFor(state, world);
  if (targetId === STAGE07_HARE_TARGET_ID) return { prey: combat.target, wildlifeGroupId: null, newlyMaterialized: false };
  const groupId = targetId.startsWith('TARGET-') ? targetId.slice('TARGET-'.length) : '';
  const group = state.wildlife.groups.find(candidate => candidate.id === groupId && candidate.discovery === 'known'
    && (state.playerKnowledge.knownWildlifeGroupIds ?? []).includes(candidate.id) && candidate.remaining > 0);
  if (!group) return null;
  const current = (combat.wildlifeTargets ?? []).find(candidate => candidate.wildlifeGroupId === group.id
    && (candidate.status === 'available' || candidate.status === 'retreated' || candidate.status === 'reacting'));
  if (current) return { prey: current, wildlifeGroupId: group.id, newlyMaterialized: false };
  const prey = wildlifeSpeciesProfile(group.populationKey, group.displayName, group.ecologyId, group.position, group.id, group.nextMemberOrdinal);
  return { prey, wildlifeGroupId: group.id, newlyMaterialized: true };
}

function preyForEncounter(combat: Stage07CombatState, encounter: CombatEncounterState) {
  if (combat.target.actorId === encounter.targetActorId) return combat.target;
  return (combat.wildlifeTargets ?? []).find(candidate => candidate.actorId === encounter.targetActorId) ?? combat.target;
}

function storePrey(state: GameState, prey: Stage07CombatState['target']): void {
  if (prey.actorId === state.combat!.target.actorId) state.combat!.target = prey;
  else state.combat!.wildlifeTargets = (state.combat!.wildlifeTargets ?? []).map(candidate => candidate.actorId === prey.actorId ? prey : candidate);
}

function encounterBusy(state: GameState, actorId: string): boolean {
  if (state.combat?.encounters.some(encounter => encounter.status === 'active' && encounter.actorIds.includes(actorId))) return true;
  if (state.travel.orders.some(order => order.status === 'active' && order.actorIds.includes(actorId))) return true;
  if (state.spatial.searchJobs.some(job => job.status === 'active' && job.actorIds.includes(actorId))) return true;
  if (state.spatial.harvestJobs.some(job => job.status === 'active' && job.actorIds.includes(actorId))) return true;
  return state.construction.jobs.some(job => (job.status === 'active' || job.status === 'blocked') && job.workerIds.includes(actorId));
}

export function isActorInActiveCombat(state: GameState, actorId: string): boolean {
  return Boolean(state.combat?.encounters.some(encounter => encounter.status === 'active' && encounter.actorIds.includes(actorId)));
}

function actorWeapon(state: GameState, unitId: string): WeaponProfile | null {
  const unit = state.ownedUnits.find(item => item.id === unitId && item.ownerId === state.player.id);
  const slot = unit?.equipmentSlots?.find(item => item.slotId === 'MAIN_HAND' && item.occupiedItemId !== null);
  if (!unit || !slot?.occupiedItemId || !unit.equipmentIds.includes(slot.occupiedItemId)) return null;
  const stack = state.inventory.containers.flatMap(container => container.stacks).find(item => item.itemId === slot.occupiedItemId);
  const effects = stack?.combatEffects ?? {};
  if (!stack || !stack.equipped || stack.equippedSlotId !== slot.slotId || stack.ownerId !== unit.id
    || !Number.isFinite(effects.weaponBase) || Number(effects.weaponBase) <= 0 || (stack.condition ?? 1) < 0.2) return null;
  return {
    damage: Number(effects.weaponBase),
    rangeMm: Number.isFinite(effects.rangeMm) && Number(effects.rangeMm) > 0 ? Number(effects.rangeMm) : 2_000,
    condition: stack.condition ?? 1,
  };
}

function h0FrozenTerrain(world: WorldDefinition, state: Stage07CombatState): boolean {
  const site = world.sites.find(item => item.id === state.target.siteId);
  const region = world.ecology.find(item => item.id === state.target.sourceEcologyId);
  return state.target.combatProfile.terrainId === HARE_TERRAIN_ID
    && Boolean(site && /băng|tuyết|ice|snow/i.test(site.form))
    && Number(region?.counts[state.target.populationKey] ?? 0) >= state.target.sourcePopulationAtStart
    && state.target.sourcePopulationAtStart > 0;
}

export function attackAvailability(state: GameState, world: WorldDefinition, actorIds: readonly string[], targetId: string): CombatAvailability {
  const combat = combatStateFor(state, world);
  const resolved = preyForTargetId(state, world, targetId);
  if (!resolved) return { code: 'COMBAT_TARGET_UNKNOWN', requirements: ['Chọn một cá thể đã được phát hiện bằng tìm kiếm.'] };
  const prey = resolved.prey;
  if (resolved.wildlifeGroupId === null && !state.playerKnowledge.lastSeenByEntity[`wildlife:${prey.actorId}`]) {
    return { code: 'TARGET_NOT_DISCOVERED', requirements: ['Dò tìm dấu vết trong khu vực trước khi ra lệnh tấn công.'] };
  }
  if (prey.status !== 'available' && prey.status !== 'retreated') return { code: prey.status === 'dead' ? 'COMBAT_TARGET_DEAD' : 'COMBAT_TARGET_UNAVAILABLE', requirements: ['Mục tiêu này đã rời hoặc đã kết thúc encounter; không có cá thể mới được tạo.'] };
  if (actorIds.length !== 1) return { code: 'COMBAT_GROUP_RULE_NOT_COMPILED', requirements: ['Encounter mở đầu chỉ biên dịch một chiến binh để giữ nguyên tổn thất cá thể.'] };
  const unit = state.ownedUnits.find(item => item.id === actorIds[0]);
  if (!unit || unit.ownerId !== state.player.id) return { code: 'COMBAT_ACTOR_NOT_OWNED', requirements: ['Chọn một đơn vị hiện thuộc quyền Lí Lan.'] };
  if (!unit.position || !unit.health || !unit.attributes || unit.health.current <= 0) return { code: 'COMBAT_ACTOR_PROFILE_INCOMPLETE', requirements: ['Chiến binh cần vị trí, sinh lực và hồ sơ thuộc tính đầy đủ.'] };
  if (encounterBusy(state, unit.id)) return { code: 'COMBAT_ACTOR_BUSY', requirements: ['Chiến binh đang đi đường hoặc thực hiện một công việc khác.'] };
  if (unit.sourceStats.faction === prey.bodyRecord.faction) return { code: 'COMBAT_FACTION_PROTECTED', requirements: ['Không thể tấn công cá thể cùng phe.'] };
  if (resolved.wildlifeGroupId === null && !h0FrozenTerrain(world, combat)) return { code: 'COMBAT_TERRAIN_PROFILE_MISSING', requirements: ['Terrain và ecology profile cho encounter mở đầu chưa được biên dịch.'] };
  if ((unit.attributes.PER ?? -1) < prey.combatProfile.concealment) return { code: 'TARGET_NOT_PERCEIVED', requirements: ['Đơn vị cần đủ nhận thức để nhận ra mục tiêu.'] };
  const weapon = actorWeapon(state, unit.id);
  if (!weapon) return { code: 'COMBAT_WEAPON_REQUIRED', requirements: ['Trang bị vũ khí tương thích vào ô tay chính trước khi giao chiến.'] };
  const distance = Math.hypot(unit.position.xMm - prey.position.xMm, unit.position.yMm - prey.position.yMm);
  if (distance > weapon.rangeMm || distance > world.navigationOverlay.interactionRangeMm) return { code: 'TARGET_OUT_OF_RANGE', requirements: ['Đưa chiến binh vào tầm vũ khí và tầm tương tác đã biết.'] };
  return { code: null, requirements: [] };
}

export function retreatAvailability(state: GameState, actorIds: readonly string[], encounterId: string): CombatAvailability {
  const encounter = state.combat?.encounters.find(item => item.id === encounterId && item.status === 'active');
  if (!encounter) return { code: 'COMBAT_ENCOUNTER_NOT_ACTIVE', requirements: ['Không có encounter đang diễn ra để rút lui.'] };
  if (encounter.actorIds.length !== actorIds.length || encounter.actorIds.some(id => !actorIds.includes(id))) {
    return { code: 'COMBAT_RETREAT_ACTOR_MISMATCH', requirements: ['Chỉ chiến binh đang giao chiến mới có thể rút lui.'] };
  }
  const living = encounter.actorIds.some(id => {
    const unit = state.ownedUnits.find(item => item.id === id && item.ownerId === state.player.id);
    return Boolean(unit?.health && unit.health.current > 0);
  });
  if (!living) return { code: 'COMBAT_ACTOR_DEFEATED', requirements: ['Không còn chiến binh sống sót để rút lui.'] };
  return { code: null, requirements: [] };
}

export function startStage07Encounter(state: GameState, world: WorldDefinition, actorIds: readonly string[], targetId: string) {
  const available = attackAvailability(state, world, actorIds, targetId);
  if (available.code) return { state, encounter: null as CombatEncounterState | null, code: available.code, requirements: available.requirements };
  const combat = combatStateFor(state, world);
  const resolved = preyForTargetId(state, world, targetId)!;
  const prey = resolved.prey;
  const sequence = combat.nextEncounterSequence;
  const encounterId = 'ENCOUNTER-STAGE07-' + String(sequence).padStart(4, '0');
  const unit = state.ownedUnits.find(item => item.id === actorIds[0])!;
  const health = prey.bodyRecord.health!;
  const encounter: CombatEncounterState = {
    id: encounterId,
    sequence,
    targetActorId: prey.actorId,
    actorIds: [...actorIds],
    status: 'active',
    startedAtElapsedMs: state.simElapsedMs,
    completedAtElapsedMs: null,
    nextTurnAtElapsedMs: state.simElapsedMs + STAGE07_COMBAT_TURN_MS,
    pendingIntent: 'attack',
    round: 0,
    targetHealth: { current: health.current, max: health.max },
    log: [],
  };
  const nextState = structuredClone(state);
  const activePrey = { ...prey, status: 'reacting' as const };
  if (resolved.wildlifeGroupId === null) nextState.combat = {
    ...combat, nextEncounterSequence: sequence + 1, target: activePrey, encounters: [...combat.encounters, encounter],
  };
  else {
    const wildlifeTargets = [...(combat.wildlifeTargets ?? [])];
    const index = wildlifeTargets.findIndex(candidate => candidate.actorId === prey.actorId);
    if (index >= 0) wildlifeTargets[index] = activePrey;
    else wildlifeTargets.push(activePrey);
    nextState.wildlife = { ...state.wildlife, groups: state.wildlife.groups.map(group => group.id === resolved.wildlifeGroupId && resolved.newlyMaterialized
      ? { ...group, nextMemberOrdinal: group.nextMemberOrdinal + 1 } : group) };
    nextState.combat = { ...combat, nextEncounterSequence: sequence + 1, wildlifeTargets, encounters: [...combat.encounters, encounter] };
  }
  const streamId = (resolved.wildlifeGroupId === null ? HARE_STREAM_PREFIX : 'wildlife-combat:') + encounterId;
  nextState.rngStreams = { ...nextState.rngStreams, [streamId]: { algorithm: 'HASH-PRIMITIVE-1.0', counter: 0 } };
  nextState.jobs = [...nextState.jobs, {
    id: encounterId, kind: 'combat_encounter', status: 'active', actorIds: [...actorIds],
    reservedItemIds: actorIds.flatMap(id => nextState.ownedUnits.find(unit => unit.id === id)?.equipmentIds ?? []), startedAtElapsedMs: state.simElapsedMs, completedAtElapsedMs: null,
  }];
  const event = {
    type: 'combat_encounter_started',
    occurredAtElapsedMs: state.simElapsedMs,
    payload: { encounterId, actorId: unit.id, actorName: unit.name, targetId: prey.actorId, wildlifeGroupId: resolved.wildlifeGroupId, sourceEcologyId: prey.sourceEcologyId, terrainId: prey.combatProfile.terrainId },
  };
  return { state: nextState, encounter, code: null as string | null, requirements: [] as readonly string[], event };
}

export function orderStage07Retreat(state: GameState, actorIds: readonly string[], encounterId: string) {
  const available = retreatAvailability(state, actorIds, encounterId);
  if (available.code) return { state, code: available.code, requirements: available.requirements, event: null };
  const nextState = structuredClone(state);
  nextState.combat!.encounters = nextState.combat!.encounters.map(item => item.id === encounterId
    ? { ...item, pendingIntent: 'retreat' as const }
    : item);
  return {
    state: nextState,
    code: null as string | null,
    requirements: [] as readonly string[],
    event: { type: 'combat_retreat_ordered', occurredAtElapsedMs: state.simElapsedMs, payload: { encounterId, actorIds } },
  };
}

export function nextCombatBoundaryAt(state: GameState): number | null {
  const times = (state.combat?.encounters ?? []).flatMap(item => item.status === 'active' && item.nextTurnAtElapsedMs !== null ? [item.nextTurnAtElapsedMs] : []);
  return times.length ? Math.min(...times) : null;
}

function draw(state: GameState, streamId: string, low: number, high: number): number {
  const current = state.rngStreams[streamId]?.counter ?? 0;
  const result = randomIntFromFields([state.seed, STAGE07_COMBAT_RULE, streamId, String(current)], low, high);
  state.rngStreams = {
    ...state.rngStreams,
    [streamId]: { algorithm: 'HASH-PRIMITIVE-1.0', counter: current + result.draws },
  };
  return result.value;
}

function stat(unit: { attributes?: Readonly<Record<string, number>> }, key: string): number {
  return unit.attributes?.[key] ?? 0;
}

function chanceToHit(attacker: Readonly<Record<string, number>>, defender: Readonly<Record<string, number>>, weatherPenalty: number): number {
  return Math.max(20, Math.min(95, 72 + (stat({ attributes: attacker }, 'DEX') - stat({ attributes: defender }, 'DEX')) * 2
    + stat({ attributes: attacker }, 'PER') - stat({ attributes: defender }, 'PER') + weatherPenalty));
}

function applyHealth(state: GameState, unitId: string, health: number): void {
  state.ownedUnits = state.ownedUnits.map(unit => unit.id === unitId && unit.health
    ? { ...unit, health: { ...unit.health, current: Math.max(0, Math.min(unit.health.max, health)) } }
    : unit);
}

function weaponArmor(state: GameState, unitId: string): number {
  const unit = state.ownedUnits.find(item => item.id === unitId);
  if (!unit) return 0;
  return unit.equipmentIds.reduce((sum, itemId) => {
    const item = state.inventory.containers.flatMap(container => container.stacks).find(stack => stack.itemId === itemId);
    if (!item || !item.equipped || item.ownerId !== unitId) return sum;
    const armor = Number(item.combatEffects?.armor ?? 0);
    return sum + Math.max(0, Math.round(armor * (item.condition ?? 1)));
  }, 0);
}

function finishJob(state: GameState, encounterId: string, at: number): void {
  state.jobs = state.jobs.map(job => job.id === encounterId ? { ...job, status: 'completed', completedAtElapsedMs: at } : job);
}

function addKnownCorpse(state: GameState, corpse: CorpseState, at: number): void {
  state.corpses = [...state.corpses, corpse];
  state.playerKnowledge = {
    ...state.playerKnowledge,
    knownCorpseIds: [...new Set([...(state.playerKnowledge.knownCorpseIds ?? []), corpse.id])].sort(),
    lastSeenByEntity: {
      ...state.playerKnowledge.lastSeenByEntity,
      ['corpse:' + corpse.id]: { observedAtElapsedMs: at, knowledge: 'current' },
    },
  };
}

function preyCorpse(encounter: CombatEncounterState, prey: Stage07CombatState['target'], at: number): CorpseState {
  const eventId = 'COMBAT-DEATH-' + encounter.id;
  const body: CorpseBodyRecord = {
    ...prey.bodyRecord,
    health: { current: 0, max: encounter.targetHealth.max },
    deathHistory: [...prey.bodyRecord.deathHistory, { eventId, atElapsedMs: at, cause: 'defeated by player-commanded melee combat' }],
  };
  return {
    id: 'CORPSE-' + prey.actorId,
    actorId: prey.actorId,
    location: { kind: 'site', siteId: prey.siteId },
    state: 'known',
    sourceStatus: `${prey.name} defeated in a deterministic wildlife encounter`,
    createdAtElapsedMs: at,
    ownershipId: null,
    disposition: 'unclaimed',
    accessState: 'accessible',
    integrity: body.integrity,
    deathAtElapsedMs: at,
    deathHistory: [{ eventId, actorId: prey.actorId, atElapsedMs: at, cause: 'defeated by player-commanded melee combat' }],
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    secondDeathLock: false,
    bodyRecord: body,
  };
}

function secondDeathCorpse(state: GameState, unitId: string, encounterId: string, at: number): CorpseState | null {
  const unit = state.ownedUnits.find(item => item.id === unitId);
  if (!unit) return null;
  const held = unit.equipmentIds.flatMap(itemId => {
    const stack = state.inventory.containers.flatMap(container => container.stacks).find(item => item.itemId === itemId);
    if (!stack) return [];
    return [{
      itemId: stack.itemId, templateId: stack.templateId, tags: [...(stack.equipmentTags ?? [])],
      quality: stack.quality ?? 1, condition: stack.condition ?? 1, unit: stack.unit ?? 'item',
      combatEffects: stack.combatEffects ?? {},
    }];
  });
  const eventId = 'SECOND-DEATH-' + encounterId;
  const body: CorpseBodyRecord = {
    sourceProfileState: 'complete',
    sourceProfileBlockers: [],
    authoring: 'user_authorized_stage07_overlay',
    name: unit.name,
    speciesId: unit.templateId,
    anatomyTemplateId: unit.anatomyTemplateId,
    formTier: unit.sourceStats.formTier,
    level: unit.level,
    xp: unit.xp,
    grade: unit.sourceStats.grade,
    faction: unit.sourceStats.faction,
    hero: unit.sourceStats.hero,
    rawAttributes: unit.attributes ?? {},
    health: { current: 0, max: unit.health?.max ?? 1 },
    integrity: 0,
    skills: unit.skills ?? [],
    talents: unit.talents ?? [],
    equipmentInstanceIds: [...unit.equipmentIds],
    heldEquipment: held,
    growthLedger: unit.growthLedger ?? {},
    primaryFaction: unit.sourceStats.faction,
    holyState: 'non_holy',
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    memoryFragments: unit.memoryFragments ?? [],
    sourceRef: { path: 'packages/sim/src/combat.ts', heading: 'Second-death combat closure', recordId: STAGE07_COMBAT_RULE },
    sourceProfileId: unit.templateId,
    deathHistory: [...(state.corpses.find(corpse => corpse.id === unit.directReviveProvenance?.originatingCorpseId)?.deathHistory ?? []), { eventId, atElapsedMs: at, cause: 'direct-revived unit died again in combat' }],
    equipmentSlots: unit.equipmentSlots ?? [],
  };
  return {
    id: 'CORPSE-SECOND-DEATH-' + unitId,
    actorId: unitId,
    location: { kind: 'site', siteId: H0_SITE_ID },
    state: 'second_death_locked',
    sourceStatus: unit.name + ' died after direct Tử Phục; the link is permanently closed',
    createdAtElapsedMs: at,
    ownershipId: state.player.id,
    disposition: 'second_death_locked',
    accessState: 'accessible',
    integrity: 0,
    deathAtElapsedMs: at,
    deathHistory: [{ eventId, actorId: unitId, atElapsedMs: at, cause: 'direct-revived unit died again in combat' }],
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    secondDeathLock: true,
    bodyRecord: body,
  };
}

export function resolveSquadCasualty(state: GameState, unitId: string, encounterId: string, at: number): { state: GameState; corpseId: string | null } {
  const unit = state.ownedUnits.find(item => item.id === unitId);
  if (!unit) return { state, corpseId: null };
  state = lockDirectReviveOnSecondDeath(state, unitId, at);
  const corpse = secondDeathCorpse(state, unitId, encounterId, at);
  if (corpse) addKnownCorpse(state, corpse, at);
  state.ownedUnits = state.ownedUnits.map(item => item.id !== unitId ? item : {
    ...item, equipmentIds: [], equipmentSlots: item.equipmentSlots?.map(slot => ({ ...slot, occupiedItemId: null })) ?? [],
  });
  state.inventory = { ...state.inventory, containers: state.inventory.containers.map(container => ({
    ...container, stacks: container.stacks.filter(stack => !unit.equipmentIds.includes(stack.itemId)),
  })) };
  return { state, corpseId: corpse?.id ?? null };
}

function settleSquadCombatBoundary(state: GameState, encounter: CombatEncounterState, at: number) {
  const events: { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[] = [];
  const prey = state.combat!.target;
  const streamId = GROUP_STREAM_PREFIX + encounter.id;
  const weatherPenalty = state.survival.coldStatus === 'danger' ? -10 : 0;
  const living = () => encounter.actorIds.flatMap(id => {
    const unit = state.ownedUnits.find(item => item.id === id);
    return unit?.health && unit.health.current > 0 ? [unit] : [];
  });
  let targetHealth = encounter.targetHealth.current;
  let finalStatus: CombatEncounterState['status'] | null = null;
  let corpseId: string | null = null;
  let frontlinerId = living()[0]?.id ?? encounter.actorIds[0]!;
  const round = encounter.round + 1;
  let log = [...encounter.log];
  const contributors: string[] = [];

  if (encounter.pendingIntent === 'retreat') {
    const frontliner = state.ownedUnits.find(item => item.id === frontlinerId);
    let actorHealth = frontliner?.health?.current ?? 0;
    let damageTaken = 0;
    if (frontliner?.position && Math.hypot(frontliner.position.xMm - prey.position.xMm, frontliner.position.yMm - prey.position.yMm) <= prey.combatProfile.weaponRangeMm) {
      const chance = chanceToHit(prey.bodyRecord.rawAttributes ?? {}, frontliner.attributes ?? {}, weatherPenalty);
      if (draw(state, streamId, 1, 100) <= chance) {
        const roll = draw(state, streamId, 0, 2);
        damageTaken = Math.max(0, 1 + Math.floor(stat({ attributes: prey.bodyRecord.rawAttributes ?? {} }, 'STR') / 8) + roll - weaponArmor(state, frontlinerId));
        actorHealth = Math.max(0, actorHealth - damageTaken);
        applyHealth(state, frontlinerId, actorHealth);
      }
    }
    const outcome: CombatLogEntry['outcome'] = actorHealth <= 0 ? 'defeat' : 'retreat';
    log.push({ atElapsedMs: at, actorId: frontlinerId, targetActorId: prey.actorId, outcome, damage: 0, damageTaken, actorHealth, targetHealth });
    events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId: frontlinerId, actorIds: encounter.actorIds, outcome, damage: 0, damageTaken, actorHealth, targetHealth } });
    if (actorHealth <= 0) {
      const casualty = resolveSquadCasualty(state, frontlinerId, encounter.id, at);
      state = casualty.state;
      corpseId = casualty.corpseId;
      events.push({ type: 'combat_unit_defeated', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorId: frontlinerId, corpseId } });
    }
    if (living().length === 0) {
      finalStatus = 'defeat';
      state.combat!.target = { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } };
    } else {
      finalStatus = 'retreated';
      state.combat!.target = { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } };
      events.push({ type: 'combat_encounter_retreated', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorIds: encounter.actorIds, targetId: prey.actorId } });
    }
  } else {
    for (const unitId of encounter.actorIds) {
      const unit = state.ownedUnits.find(item => item.id === unitId);
      if (!unit?.health || unit.health.current <= 0) continue;
      const weapon = actorWeapon(state, unit.id);
      const distance = unit.position ? Math.hypot(unit.position.xMm - prey.position.xMm, unit.position.yMm - prey.position.yMm) : Number.MAX_SAFE_INTEGER;
      if (!weapon || distance > weapon.rangeMm) continue;
      const chance = chanceToHit(unit.attributes ?? {}, prey.bodyRecord.rawAttributes ?? {}, weatherPenalty);
      let damage = 0;
      let outcome: CombatLogEntry['outcome'] = 'miss';
      if (draw(state, streamId, 1, 100) <= chance) {
        const roll = draw(state, streamId, 0, 2);
        damage = Math.max(1, 1 + Math.floor(stat(unit, 'STR') / 6) + Math.floor(weapon.damage * weapon.condition) + roll - prey.combatProfile.armor);
        targetHealth = Math.max(0, targetHealth - damage);
        outcome = 'hit';
      }
      if (!contributors.includes(unit.id)) contributors.push(unit.id);
      log.push({ atElapsedMs: at, actorId: unit.id, targetActorId: prey.actorId, outcome, damage, damageTaken: 0, actorHealth: unit.health.current, targetHealth });
      events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId: unit.id, actorIds: encounter.actorIds, outcome, damage, damageTaken: 0, actorHealth: unit.health.current, targetHealth } });
      if (targetHealth <= 0) break;
    }

    if (targetHealth <= 0) finalStatus = 'victory';
    else {
      const frontliner = living()[0];
      if (!frontliner) finalStatus = 'defeat';
      else {
        frontlinerId = frontliner.id;
        const distance = frontliner.position ? Math.hypot(frontliner.position.xMm - prey.position.xMm, frontliner.position.yMm - prey.position.yMm) : Number.MAX_SAFE_INTEGER;
        let damageTaken = 0;
        let actorHealth = frontliner.health!.current;
        if (distance <= prey.combatProfile.weaponRangeMm) {
          const chance = chanceToHit(prey.bodyRecord.rawAttributes ?? {}, frontliner.attributes ?? {}, weatherPenalty);
          if (draw(state, streamId, 1, 100) <= chance) {
            const roll = draw(state, streamId, 0, 2);
            damageTaken = Math.max(0, 1 + Math.floor(stat({ attributes: prey.bodyRecord.rawAttributes ?? {} }, 'STR') / 8) + roll - weaponArmor(state, frontliner.id));
            actorHealth = Math.max(0, actorHealth - damageTaken);
            applyHealth(state, frontliner.id, actorHealth);
          }
        }
        log.push({ atElapsedMs: at, actorId: frontliner.id, targetActorId: prey.actorId, outcome: actorHealth <= 0 ? 'defeat' : damageTaken > 0 ? 'hit' : 'miss', damage: 0, damageTaken, actorHealth, targetHealth });
        events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId: frontliner.id, actorIds: encounter.actorIds, outcome: actorHealth <= 0 ? 'defeat' : damageTaken > 0 ? 'hit' : 'miss', damage: 0, damageTaken, actorHealth, targetHealth } });
        if (actorHealth <= 0) {
          const casualty = resolveSquadCasualty(state, frontliner.id, encounter.id, at);
          state = casualty.state;
          corpseId = casualty.corpseId;
          events.push({ type: 'combat_unit_defeated', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorId: frontliner.id, corpseId } });
          if (living().length === 0) {
            finalStatus = 'defeat';
            state.combat!.target = { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } };
          }
        }
      }
    }
  }

  if (finalStatus === 'victory') {
    const nextEncounter = { ...encounter, status: 'victory' as const, completedAtElapsedMs: at, nextTurnAtElapsedMs: null, round, targetHealth: { current: 0, max: encounter.targetHealth.max }, log };
    const corpse = hareCorpse(state, nextEncounter, at);
    corpseId = corpse.id;
    addKnownCorpse(state, corpse, at);
    state.combat!.target = { ...prey, status: 'dead', bodyRecord: { ...prey.bodyRecord, health: { current: 0, max: targetHealth } } };
    const baseShare = Math.floor(STAGE07_HUNT_XP / contributors.length);
    let xpRemaining = STAGE07_HUNT_XP - baseShare * contributors.length;
    const xpShares: { actorId: string; xp: number }[] = [];
    let mirroredXp = 0;
    for (const actorId of contributors) {
      const xpAmount = baseShare + (xpRemaining-- > 0 ? 1 : 0);
      if (xpAmount <= 0) continue;
      const xpId = 'XP-COMBAT-' + encounter.id + '-' + actorId;
      const awarded = settleOrdinaryCombatXp(state, actorId, STAGE07_HUNT_XP, xpId, at, xpAmount / STAGE07_HUNT_XP);
      state = awarded.state;
      xpShares.push({ actorId, xp: awarded.transactions.find(transaction => transaction.transactionKind === 'NORMAL_AWARD')?.netXp ?? 0 });
      mirroredXp += awarded.transactions.find(transaction => transaction.transactionKind === 'OWNER_XP_MIRROR')?.netXp ?? 0;
    }
    const won = { ...nextEncounter, log };
    state.combat!.encounters = state.combat!.encounters.map(item => item.id === encounter.id ? won : item);
    finishJob(state, encounter.id, at);
    events.push({ type: 'combat_encounter_won', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorIds: encounter.actorIds, targetId: prey.actorId, corpseId, xpAwarded: xpShares.reduce((sum, share) => sum + share.xp, 0), xpShares, mirroredXp } });
  } else {
    const status = finalStatus ?? 'active';
    const nextEncounter: CombatEncounterState = {
      ...encounter,
      status,
      completedAtElapsedMs: status === 'active' ? null : at,
      nextTurnAtElapsedMs: status === 'active' ? at + STAGE07_COMBAT_TURN_MS : null,
      pendingIntent: 'attack',
      round,
      targetHealth: { current: targetHealth, max: encounter.targetHealth.max },
      log,
    };
    state.combat!.encounters = state.combat!.encounters.map(item => item.id === encounter.id ? nextEncounter : item);
    if (status !== 'active') finishJob(state, encounter.id, at);
  }
  return { state, events, completed: finalStatus !== null, danger: finalStatus === 'defeat' };
}

// RNG protocol v1, per scheduled round: the living attacker draws one hit roll (1..100).
// A hit then draws damage (0..2); only if the hare survives does it draw its return hit
// roll (1..100), followed by damage (0..2) on a hit. Retreat rolls only the hare's
// return attack. This order is part of replay compatibility for saved encounters.
function finishEncounter(state: GameState, encounter: CombatEncounterState, status: CombatEncounterState['status'], at: number): CombatEncounterState {
  finishJob(state, encounter.id, at);
  return { ...encounter, status, completedAtElapsedMs: at, nextTurnAtElapsedMs: null };
}

export function settleCombatBoundary(input: GameState, at: number): { state: GameState; events: readonly { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[]; completed: boolean; danger: boolean } {
  const due = (input.combat?.encounters ?? [])
    .filter(item => item.status === 'active' && item.nextTurnAtElapsedMs === at)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
  if (!due.length) return { state: input, events: [], completed: false, danger: false };
  let state = structuredClone(input);
  const events: { type: string; occurredAtElapsedMs: number; payload: Record<string, unknown> }[] = [];
  let completed = false;
  let danger = false;
  for (const scheduled of due) {
    const combat = state.combat!;
    const encounter = combat.encounters.find(item => item.id === scheduled.id)!;
    if (encounter.actorIds.length > 1) {
      const squad = settleSquadCombatBoundary(state, encounter, at);
      state = squad.state;
      events.push(...squad.events);
      completed = squad.completed || completed;
      danger = squad.danger || danger;
      continue;
    }
    const unit = state.ownedUnits.find(item => item.id === encounter.actorIds[0]);
    const prey = preyForEncounter(combat, encounter);
    const streamId = (prey.wildlifeGroupId ? 'wildlife-combat:' : HARE_STREAM_PREFIX) + encounter.id;
    let actorHealth = unit?.health?.current ?? 0;
    let targetHealth = encounter.targetHealth.current;
    let actorId = unit?.id ?? encounter.actorIds[0];
    let outcome: CombatLogEntry['outcome'] = 'miss';
    let damage = 0;
    let damageTaken = 0;
    let finalStatus: CombatEncounterState['status'] | null = null;
    let corpseId: string | null = null;
    const weatherPenalty = state.survival.coldStatus === 'danger' ? -10 : 0;

    if (!unit || !unit.health || actorHealth <= 0) {
      finalStatus = 'defeat';
      outcome = 'defeat';
    } else if (encounter.pendingIntent === 'retreat') {
      const distance = unit.position ? Math.hypot(unit.position.xMm - prey.position.xMm, unit.position.yMm - prey.position.yMm) : Number.MAX_SAFE_INTEGER;
      if (distance <= prey.combatProfile.weaponRangeMm) {
        const chance = chanceToHit(prey.bodyRecord.rawAttributes ?? {}, unit.attributes ?? {}, weatherPenalty);
        if (draw(state, streamId, 1, 100) <= chance) {
          const roll = draw(state, streamId, 0, 2);
          damageTaken = Math.max(0, 1 + Math.floor(stat({ attributes: prey.bodyRecord.rawAttributes ?? {} }, 'STR') / 8) + roll - weaponArmor(state, unit.id));
          actorHealth = Math.max(0, actorHealth - damageTaken);
          applyHealth(state, unit.id, actorHealth);
          outcome = damageTaken > 0 ? 'hit' : 'miss';
        }
      }
      finalStatus = actorHealth <= 0 ? 'defeat' : 'retreated';
      if (finalStatus === 'retreated') {
        storePrey(state, { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } });
        outcome = 'retreat';
      }
    } else {
      const weapon = actorWeapon(state, unit.id);
      const distance = unit.position ? Math.hypot(unit.position.xMm - prey.position.xMm, unit.position.yMm - prey.position.yMm) : Number.MAX_SAFE_INTEGER;
      if (!weapon || distance > weapon.rangeMm) {
        finalStatus = 'retreated';
        outcome = 'retreat';
        storePrey(state, { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } });
      } else {
        const chance = chanceToHit(unit.attributes ?? {}, prey.bodyRecord.rawAttributes ?? {}, weatherPenalty);
        if (draw(state, streamId, 1, 100) <= chance) {
          const roll = draw(state, streamId, 0, 2);
          damage = Math.max(1, 1 + Math.floor(stat(unit, 'STR') / 6) + Math.floor(weapon.damage * weapon.condition) + roll - prey.combatProfile.armor);
          targetHealth = Math.max(0, targetHealth - damage);
          outcome = 'hit';
        } else outcome = 'miss';
        if (targetHealth > 0) {
          const preyChance = chanceToHit(prey.bodyRecord.rawAttributes ?? {}, unit.attributes ?? {}, weatherPenalty);
          if (distance <= prey.combatProfile.weaponRangeMm && draw(state, streamId, 1, 100) <= preyChance) {
            const roll = draw(state, streamId, 0, 2);
            damageTaken = Math.max(0, 1 + Math.floor(stat({ attributes: prey.bodyRecord.rawAttributes ?? {} }, 'STR') / 8) + roll - weaponArmor(state, unit.id));
            actorHealth = Math.max(0, actorHealth - damageTaken);
            applyHealth(state, unit.id, actorHealth);
          }
        }
        if (targetHealth <= 0) finalStatus = 'victory';
        else if (actorHealth <= 0) finalStatus = 'defeat';
      }
    }

    const round = encounter.round + 1;
    const log: CombatLogEntry = {
      atElapsedMs: at, actorId, targetActorId: prey.actorId, outcome, damage, damageTaken,
      actorHealth, targetHealth,
    };
    const nextEncounter: CombatEncounterState = {
      ...encounter,
      status: finalStatus ?? 'active',
      completedAtElapsedMs: finalStatus ? at : null,
      nextTurnAtElapsedMs: finalStatus ? null : at + STAGE07_COMBAT_TURN_MS,
      pendingIntent: 'attack',
      round,
      targetHealth: { current: targetHealth, max: encounter.targetHealth.max },
      log: [...encounter.log, log],
    };
    state.combat!.encounters = state.combat!.encounters.map(item => item.id === encounter.id ? nextEncounter : item);
    if (finalStatus === 'victory') {
      const corpse = preyCorpse(nextEncounter, prey, at);
      corpseId = corpse.id;
      addKnownCorpse(state, corpse, at);
      storePrey(state, { ...prey, status: 'dead', bodyRecord: { ...prey.bodyRecord, health: { current: 0, max: targetHealth } } });
      let depletedGroupId: string | null = null;
      if (prey.wildlifeGroupId) state.wildlife = { ...state.wildlife, groups: state.wildlife.groups.map(group => {
        if (group.id !== prey.wildlifeGroupId) return group;
        const remaining = Math.max(0, group.remaining - 1);
        if (remaining === 0) depletedGroupId = group.id;
        return { ...group, remaining };
      }) };
      const xpId = 'XP-COMBAT-' + encounter.id + '-' + actorId;
      const xp = settleOrdinaryCombatXp(state, actorId, STAGE07_HUNT_XP, xpId, at, 1);
      state = xp.state;
      state.combat!.encounters = state.combat!.encounters.map(item => item.id === encounter.id ? nextEncounter : item);
      finishJob(state, encounter.id, at);
      const mirror = xp.transactions.find(transaction => transaction.transactionKind === 'OWNER_XP_MIRROR');
      events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId, outcome: log.outcome, damage, damageTaken, actorHealth, targetHealth } });
      events.push({ type: 'combat_encounter_won', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorId, actorName: unit?.name ?? actorId, targetId: prey.actorId, wildlifeGroupId: prey.wildlifeGroupId ?? null, corpseId, xpAwarded: xp.transactions.find(transaction => transaction.transactionKind === 'NORMAL_AWARD')?.netXp ?? 0, mirroredXp: mirror?.netXp ?? 0 } });
      if (depletedGroupId) events.push({ type: 'wildlife_group_depleted', occurredAtElapsedMs: at, payload: { groupId: depletedGroupId, ecologyId: prey.sourceEcologyId } });
      completed = true;
      continue;
    }
    if (finalStatus === 'defeat') {
      const locked = lockDirectReviveOnSecondDeath(state, actorId, at);
      state = locked;
      const corpse = secondDeathCorpse(state, actorId, encounter.id, at);
      if (corpse) {
        corpseId = corpse.id;
        addKnownCorpse(state, corpse, at);
      }
      state.ownedUnits = state.ownedUnits.map(item => item.id !== actorId ? item : {
        ...item, equipmentIds: [], equipmentSlots: item.equipmentSlots?.map(slot => ({ ...slot, occupiedItemId: null })) ?? [],
      });
      state.inventory = { ...state.inventory, containers: state.inventory.containers.map(container => ({
        ...container, stacks: container.stacks.filter(stack => !unit?.equipmentIds.includes(stack.itemId)),
      })) };
      storePrey(state, { ...prey, status: 'retreated', position: { ...prey.position, xMm: prey.position.xMm + 5_000 } });
      finishJob(state, encounter.id, at);
      events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId, outcome: 'defeat', damage, damageTaken, actorHealth: 0, targetHealth } });
      events.push({ type: 'combat_unit_defeated', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorId, corpseId } });
      completed = true;
      danger = true;
      continue;
    }
    if (finalStatus === 'retreated') {
      finishJob(state, encounter.id, at);
      events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId, outcome: 'retreat', damage, damageTaken, actorHealth, targetHealth } });
      events.push({ type: 'combat_encounter_retreated', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, actorId, targetId: prey.actorId } });
      completed = true;
      danger = actorHealth <= Math.ceil((unit?.health?.max ?? 1) / 4);
      continue;
    }

    storePrey(state, {
      ...prey,
      bodyRecord: { ...prey.bodyRecord, health: { current: targetHealth, max: encounter.targetHealth.max } },
    });
    events.push({ type: 'combat_turn_settled', occurredAtElapsedMs: at, payload: { encounterId: encounter.id, round, actorId, outcome: log.outcome, damage, damageTaken, actorHealth, targetHealth } });
    danger = actorHealth <= Math.ceil((unit?.health?.max ?? 1) / 4);
  }
  return { state, events, completed, danger };
}

export function projectStage07Combat(state: GameState, world: WorldDefinition): Stage07CombatView {
  const combat = combatStateFor(state, world);
  const target = combat.target;
  const known = Boolean(state.playerKnowledge.lastSeenByEntity[`wildlife:${target.actorId}`]);
  const availableActor = state.ownedUnits.find(unit => unit.ownerId === state.player.id && unit.health && unit.health.current > 0);
  const attack = availableActor
    ? attackAvailability(state, world, [availableActor.id], STAGE07_HARE_TARGET_ID)
    : { code: 'COMBAT_ACTOR_REQUIRED', requirements: ['Tử Phục một đơn vị có thể chiến đấu trước khi săn mục tiêu.'] };
  const latest = [...combat.encounters].sort((a, b) => b.sequence - a.sequence)[0];
  return {
    target: known ? {
      id: STAGE07_HARE_TARGET_ID,
      label: target.status === 'available' ? 'Dấu vết thỏ băng' : 'Thỏ băng',
      state: target.status,
      regionId: target.sourceEcologyId,
      // ECO counts are source aggregate records, not a player-observed census.
      regionalPopulationRemaining: null,
      position: target.position,
      attack: { actionId: 'attack', enabled: attack.code === null, reasonCode: attack.code, requirements: attack.requirements },
    } : null,
    encounter: latest ? {
      id: latest.id,
      status: latest.status,
      actorIds: latest.actorIds,
      round: latest.round,
      nextTurnAtElapsedMs: latest.nextTurnAtElapsedMs,
      targetHealth: latest.targetHealth,
      log: latest.log.slice(-8),
    } : null,
  };
}
