import type {
  CorpseBodyRecord, CorpseState, DirectReviveProvenance, GameState, PlayerUnitState, SkillInstanceState, WorldDefinition,
} from '../../contracts/src/index.ts';

export const STAGE07_OVERLAY_VERSION = 'USER-AUTHORIZED-STAGE-07-BALANCE-OVERLAY-1.0';
export const STAGE07_OPENING_CORPSE_ID = 'CORPSE-STAGE07-ROOK-01';
export const STAGE07_OPENING_ACTOR_ID = 'ACTOR-STAGE07-ROOK-01';
export const STAGE07_OPENING_SPEAR_ID = 'ITEM-STAGE07-ROOK-SPEAR-01';
export const STAGE07_OPENING_CLOAK_ID = 'ITEM-STAGE07-ROOK-CLOAK-01';
export const DIRECT_REVIVE_MIRROR_RULE = 'LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0';
export const STAGE07_LABOR_XP_RULE = 'STAGE-07-LABOR-XP-1.0';

/** One user-authorized opening corpse, separate from canonical ecology and hero populations. */
export function stage07OpeningCorpse(): CorpseState {
  const bodyRecord: CorpseBodyRecord = {
    sourceProfileState: 'complete',
    sourceProfileBlockers: [],
    authoring: 'user_authorized_stage07_overlay',
    name: 'Rook',
    speciesId: 'SPECIES-HUMAN-VAREN',
    anatomyTemplateId: 'ANATOMY-HUMAN-STANDARD-1.0',
    formTier: 1,
    level: 1,
    xp: 24,
    grade: 'Thường',
    faction: 'Varen',
    hero: false,
    rawAttributes: { STR: 9, VIT: 10, DEX: 10, INT: 8, SPI: 8, WIL: 9, PER: 11, PRE: 8, LUK: 8 },
    health: { current: 0, max: 44 },
    integrity: 86,
    skills: [],
    talents: [],
    equipmentInstanceIds: [STAGE07_OPENING_SPEAR_ID, STAGE07_OPENING_CLOAK_ID],
    heldEquipment: [
      { itemId: STAGE07_OPENING_SPEAR_ID, templateId: 'STAGE07-ASH-WOOD-SPEAR', tags: ['WEAPON', 'WEAPON_1H'], quality: 1, condition: 0.78, unit: 'item', combatEffects: { weaponBase: 3 } },
      { itemId: STAGE07_OPENING_CLOAK_ID, templateId: 'STAGE07-FELT-CLOAK', tags: ['ARMOR', 'ARMOR_LIGHT'], quality: 1, condition: 0.64, unit: 'item', combatEffects: { armor: 1 } },
    ],
    growthLedger: {},
    primaryFaction: 'Varen',
    holyState: 'non_holy',
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    memoryFragments: [],
    sourceRef: { path: 'packages/sim/src/stage07.ts', heading: 'User-authorized opening balance overlay', recordId: STAGE07_OVERLAY_VERSION },
    sourceProfileId: 'PROFILE-STAGE07-ROOK-T1-1.0',
    deathHistory: [{ eventId: 'STAGE07-OPENING-PRESEEDED-DEATH', atElapsedMs: 0, cause: 'exposure before campaign start' }],
    equipmentSlots: [
      { slotId: 'MAIN_HAND', allowedTags: ['WEAPON', 'WEAPON_1H'], occupiedItemId: null },
      { slotId: 'BODY', allowedTags: ['ARMOR', 'ARMOR_LIGHT'], occupiedItemId: null },
    ],
  };
  return {
    id: STAGE07_OPENING_CORPSE_ID,
    actorId: STAGE07_OPENING_ACTOR_ID,
    location: { kind: 'site', siteId: 'SITE-LL01-000' },
    state: 'known',
    disposition: 'unclaimed',
    accessState: 'accessible',
    integrity: 86,
    sourceStatus: 'Rook, Varen field courier; preserved human corpse; user-authorized Stage 07 balance overlay',
    createdAtElapsedMs: 0,
    deathAtElapsedMs: 0,
    deathHistory: [{ eventId: 'STAGE07-OPENING-PRESEEDED-DEATH', actorId: STAGE07_OPENING_ACTOR_ID, atElapsedMs: 0, cause: 'exposure before campaign start' }],
    sealTags: [],
    directHolyLock: false,
    holyFieldExcess: false,
    secondDeathLock: false,
    ownershipId: null,
    bodyRecord,
  };
}

export type ReviveResult = { state: GameState; code: string | null; requirements: readonly string[] };

export function directReviveAvailability(state: GameState, world: WorldDefinition, actorId: string, corpseId: string): ReviveResult {
  const corpse = state.corpses.find(item => item.id === corpseId);
  if (actorId !== state.player.id) return { state, code: 'REVIVER_NOT_AUTHORIZED', requirements: ['Only Lí Lan can directly Tử Phục a corpse.'] };
  if (!corpse) return { state, code: 'CORPSE_NOT_FOUND', requirements: ['Choose a corpse already known to the player.'] };
  if (!(state.playerKnowledge.knownCorpseIds ?? []).includes(corpseId) && corpse.state === 'unobserved') return { state, code: 'CORPSE_NOT_KNOWN', requirements: ['Locate the corpse before interacting with it.'] };
  if (!state.playerKnowledge.lastInspectedEntityIds.includes(`corpse:${corpseId}`)) return { state, code: 'CORPSE_NOT_INSPECTED', requirements: ['Inspect the actual body before attempting Tử Phục.'] };
  if (corpse.state === 'revived' || corpse.disposition === 'revived') return { state, code: 'CORPSE_ALREADY_REVIVED', requirements: ['This body has already been used for Tử Phục.'] };
  if (corpse.state === 'butchered' || corpse.disposition === 'butchered') return { state, code: 'CORPSE_ALREADY_BUTCHERED', requirements: ['This body has already been butchered.'] };
  if (corpse.state === 'destroyed' || corpse.disposition === 'destroyed') return { state, code: 'CORPSE_DESTROYED', requirements: ['The body no longer exists.'] };
  if (corpse.secondDeathLock || corpse.disposition === 'second_death_locked') return { state, code: 'SECOND_DEATH_LOCKED', requirements: ['A body that has died after direct Tử Phục cannot be revived again.'] };
  const profile = corpse.bodyRecord;
  const integrity = corpse.integrity ?? profile?.integrity ?? null;
  if (integrity === null) return { state, code: 'CORPSE_INTEGRITY_UNKNOWN', requirements: ['The body’s current integrity has not been recorded.'] };
  if (integrity <= 0) return { state, code: 'CORPSE_INTEGRITY_ZERO', requirements: ['The body has no remaining integrity.'] };
  if (!profile || profile.sourceProfileState !== 'complete') return { state, code: 'CORPSE_BODY_PROFILE_INCOMPLETE', requirements: profile?.sourceProfileBlockers ?? ['The corpse has no complete body record.'] };
  const missingBodyFields = [
    profile.speciesId === null ? 'species' : null,
    profile.anatomyTemplateId === null ? 'anatomy' : null,
    profile.formTier === null ? 'structural tier' : null,
    profile.level === null ? 'level' : null,
    profile.xp === null ? 'experience' : null,
    profile.grade === null ? 'grade' : null,
    profile.faction === null ? 'faction' : null,
    profile.hero === null ? 'hero status' : null,
    profile.rawAttributes === null ? 'attributes' : null,
    profile.health === null || profile.health.max <= 0 ? 'health' : null,
    profile.holyState === 'unknown' ? 'Holy status' : null,
  ].filter((item): item is string => item !== null);
  if (missingBodyFields.length) return { state, code: 'CORPSE_BODY_PROFILE_INCOMPLETE', requirements: missingBodyFields.map(item => 'Missing recorded ' + item + '.') };
  const heldGear = profile.heldEquipment ?? [];
  const heldGearIds = heldGear.map(item => item.itemId);
  if (new Set(heldGearIds).size !== heldGearIds.length || heldGearIds.length !== profile.equipmentInstanceIds.length
    || profile.equipmentInstanceIds.some(id => !heldGearIds.includes(id))) return { state, code: 'CORPSE_EQUIPMENT_RECORD_INCOMPLETE', requirements: ['The body’s recorded equipment instances do not match its carried gear.'] };
  if (heldGearIds.some(id => state.inventory.containers.some(container => container.stacks.some(stack => stack.itemId === id)))) return { state, code: 'CORPSE_GEAR_ALREADY_TRANSFERRED', requirements: ['One or more recorded gear instances have already left this body.'] };
  if (corpse.location.kind === 'buried') return { state, code: 'CORPSE_NOT_ACCESSIBLE', requirements: ['Excavate the body before attempting direct Tử Phục.'] };
  const siteId = corpse.location.kind === 'site' ? corpse.location.siteId : null;
  const site = siteId ? world.sites.find(item => item.id === siteId) : null;
  const carriedByPlayer = corpse.location.kind === 'carried' && corpse.location.carrierId === actorId;
  const carriedByNearbyUnit = corpse.location.kind === 'carried' && state.ownedUnits.some(unit => unit.id === corpse.location.carrierId && unit.ownerId === state.player.id && unit.position && Math.hypot(unit.position.xMm - state.player.position.xMm, unit.position.yMm - state.player.position.yMm) <= world.navigationOverlay.interactionRangeMm);
  const atReach = carriedByPlayer || carriedByNearbyUnit || Boolean(site && Math.hypot(site.position.xMm - state.player.position.xMm, site.position.yMm - state.player.position.yMm) <= world.navigationOverlay.interactionRangeMm);
  if (!atReach) return { state, code: 'CORPSE_NOT_ACCESSIBLE', requirements: ['Move within reach of the body or carry it to Lí Lan.'] };
  if (corpse.sealTags?.includes('BLOCK_TU_PHUC') || profile.sealTags.includes('BLOCK_TU_PHUC')) return { state, code: 'SEAL_BLOCKS_TU_PHUC', requirements: ['The body carries a seal that blocks direct Tử Phục.'] };
  if (corpse.sealTags?.includes('PURGE_DEATH_TRACE') || profile.sealTags.includes('PURGE_DEATH_TRACE')) return { state, code: 'DEATH_TRACE_PURGED', requirements: ['The death trace was purged and cannot be used for direct Tử Phục.'] };
  if (corpse.directHolyLock || profile.directHolyLock) return { state, code: 'HOLY_DIRECT_REVIVE_LOCKED', requirements: ['This Holy body has a source-defined direct revival lock.'] };
  if (corpse.holyFieldExcess || profile.holyFieldExcess) return { state, code: 'HOLY_FIELD_EXCESS', requirements: ['The Holy field exceeds the permitted direct revival limit.'] };
  if (profile.formTier === null) return { state, code: 'CORPSE_BODY_PROFILE_INCOMPLETE', requirements: ['The corpse has no recorded structural Bậc.'] };
  if (profile.holyState === 'holy' && profile.formTier < 2) return { state, code: 'HOLY_TIER_TRANSFORM_UNAVAILABLE', requirements: ['Holy transformation cannot reduce this body below Bậc 1.'] };
  const resultingTier = profile.formTier - (profile.holyState === 'holy' ? 1 : 0);
  if (resultingTier > state.player.formTier) return { state, code: 'CORPSE_TIER_EXCEEDS_REVIVER', requirements: ['The resulting body’s Bậc exceeds Lí Lan’s current Bậc.'] };
  return { state, code: null, requirements: [] };
}

const gradeOrder = ['Thường', 'Cựu binh', 'Tinh anh', 'Đầu lĩnh', 'Lãnh chúa', 'Thần thoại'];

export function reviveDirect(state: GameState, world: WorldDefinition, actorId: string, corpseId: string, unitId: string): ReviveResult {
  const availability = directReviveAvailability(state, world, actorId, corpseId);
  if (availability.code) return availability;
  const corpse = state.corpses.find(item => item.id === corpseId)!;
  const body = corpse.bodyRecord!;
  const holy = body.holyState === 'holy';
  const formTier = body.formTier! - (holy ? 1 : 0);
  const gradeIndex = gradeOrder.indexOf(body.grade ?? 'Thường');
  const grade = holy && gradeIndex > 0 ? gradeOrder[gradeIndex - 1] : body.grade ?? 'Thường';
  const integrity = corpse.integrity ?? body.integrity ?? 1;
  const startingHealth = Math.max(1, Math.floor((body.health?.max ?? 1) * integrity / 100));
  const provenance: DirectReviveProvenance = {
    creationRoute: 'DIRECT_TU_PHUC',
    reviverCharacterId: state.player.id,
    talentInstanceId: state.player.talent.id,
    rootOwnerId: state.player.id,
    mirrorStartAtElapsedMs: state.simElapsedMs,
    originatingCorpseId: corpse.id,
    originatingActorId: corpse.actorId,
    secondDeathLocked: false,
  };
  const slots = body.equipmentSlots.map(slot => ({ ...slot, occupiedItemId: null }));
  const unit: PlayerUnitState = {
    id: unitId, templateId: body.sourceProfileId ?? body.anatomyTemplateId ?? 'STAGE07-DIRECT-REVIVED-UNIT',
    name: 'Rook', creationRoute: 'DIRECT_TU_PHUC', level: body.level!, xp: body.xp!,
    ownerId: state.player.id, position: state.player.position,
    location: structuredClone(state.player.location),
    equipmentIds: [], sourceStats: {
      formTier, grade, level: body.level!, xp: body.xp!, faction: 'Âm', hero: body.hero!, loyalty: 'ABSOLUTE',
    },
    attributes: body.rawAttributes ?? {}, talents: body.talents, memoryFragments: body.memoryFragments, integrity,
    anatomyTemplateId: body.anatomyTemplateId!,
    equipmentRequirements: { status: 'compiled', requiredSlotIds: slots.map(slot => slot.slotId) },
    equipmentSlots: slots, skills: body.skills.map(skill => ({ ...skill })),
    health: { current: startingHealth, max: body.health?.max ?? startingHealth },
    directReviveProvenance: provenance, growthLedger: body.growthLedger ?? {},
    xpMirrorEligible: true, baseLaborRateWuPerHour: 1,
    laborRuleVersion: 'STAGE07-DIRECT-REVIVED-LABOR-1.0',
  };
  const items = (body.heldEquipment ?? []).map(item => ({
    itemId: item.itemId, templateId: item.templateId, quantity: 1, ownerId: state.player.id,
    equipped: false, equippedSlotId: null, quality: item.quality, condition: item.condition, unit: item.unit,
    equipmentTags: item.tags, combatEffects: item.combatEffects, provenance: 'versioned_game_design' as const,
  }));
  const gearContainer = {
    id: `LL-CNT-STAGE07-GEAR-${corpse.id}`,
    kind: 'backpack' as const,
    capacitySlots: null,
    occupiedSlots: items.length,
    location: { kind: 'carried' as const, ownerId: state.player.id },
    observed: true,
    stacks: items,
  };
  const inventory = { ...state.inventory, containers: [...state.inventory.containers, gearContainer] };
  const nextState: GameState = {
    ...state,
    inventory,
    corpses: state.corpses.map(item => item.id === corpseId ? {
      ...item, state: 'revived', disposition: 'revived', ownershipId: state.player.id,
      accessState: 'carried', bodyRecord: { ...body, equipmentInstanceIds: [], heldEquipment: [] },
    } : item),
    ownedUnits: [...state.ownedUnits, unit],
  };
  return { state: nextState, code: null, requirements: [] };
}

export function butcherCorpse(state: GameState, world: WorldDefinition, actorId: string, corpseId: string): ReviveResult {
  const corpse = state.corpses.find(item => item.id === corpseId);
  if (actorId !== state.player.id) return { state, code: 'CORPSE_ACTION_NOT_AUTHORIZED', requirements: ['Only Lí Lan can disposition a body in this stage.'] };
  if (!corpse) return { state, code: 'CORPSE_NOT_FOUND', requirements: ['Choose a corpse already known to the player.'] };
  if (!(state.playerKnowledge.knownCorpseIds ?? []).includes(corpseId)) return { state, code: 'CORPSE_NOT_KNOWN', requirements: ['Locate the corpse before interacting with it.'] };
  if (!state.playerKnowledge.lastInspectedEntityIds.includes('corpse:' + corpseId)) return { state, code: 'CORPSE_NOT_INSPECTED', requirements: ['Inspect the actual body before disposing of it.'] };
  if (corpse.state === 'revived' || corpse.disposition === 'revived') return { state, code: 'CORPSE_ALREADY_REVIVED', requirements: ['This body has already been used for Tử Phục.'] };
  if (corpse.state === 'butchered' || corpse.disposition === 'butchered') return { state, code: 'CORPSE_ALREADY_BUTCHERED', requirements: ['This body has already been butchered.'] };
  if (corpse.state === 'destroyed' || corpse.disposition === 'destroyed') return { state, code: 'CORPSE_DESTROYED', requirements: ['The body no longer exists.'] };
  if (corpse.secondDeathLock || corpse.state === 'second_death_locked' || corpse.disposition === 'second_death_locked') return { state, code: 'SECOND_DEATH_LOCKED', requirements: ['This body is closed to further use after a second death.'] };
  const body = corpse.bodyRecord;
  if (!body || body.sourceProfileState !== 'complete') return { state, code: 'CORPSE_BODY_PROFILE_INCOMPLETE', requirements: body?.sourceProfileBlockers ?? ['The body and any held items must be recorded before disposal.'] };
  const gear = body.heldEquipment ?? [];
  const ids = gear.map(item => item.itemId);
  if (new Set(ids).size !== ids.length || ids.length !== body.equipmentInstanceIds.length || body.equipmentInstanceIds.some(id => !ids.includes(id))) {
    return { state, code: 'CORPSE_EQUIPMENT_RECORD_INCOMPLETE', requirements: ['The body’s recorded equipment instances do not match its held gear.'] };
  }
  if (ids.some(id => state.inventory.containers.some(container => container.stacks.some(stack => stack.itemId === id)))) {
    return { state, code: 'CORPSE_GEAR_ALREADY_TRANSFERRED', requirements: ['One or more held gear instances have already left this body.'] };
  }
  if (corpse.location.kind === 'buried') return { state, code: 'CORPSE_NOT_ACCESSIBLE', requirements: ['Excavate the body before handling it.'] };
  let position = null as { xMm: number; yMm: number } | null;
  if (corpse.location.kind === 'site') position = world.sites.find(site => site.id === corpse.location.siteId)?.position ?? null;
  if (corpse.location.kind === 'carried') {
    if (corpse.location.carrierId === actorId) position = state.player.position;
    else position = state.ownedUnits.find(unit => unit.id === corpse.location.carrierId && unit.ownerId === state.player.id)?.position ?? null;
  }
  if (!position || Math.hypot(position.xMm - state.player.position.xMm, position.yMm - state.player.position.yMm) > world.navigationOverlay.interactionRangeMm) {
    return { state, code: 'CORPSE_NOT_ACCESSIBLE', requirements: ['Move within reach of the body before disposing of it.'] };
  }
  const items = gear.map(item => ({
    itemId: item.itemId, templateId: item.templateId, quantity: 1, ownerId: state.player.id,
    equipped: false, equippedSlotId: null, quality: item.quality, condition: item.condition, unit: item.unit,
    equipmentTags: item.tags, combatEffects: item.combatEffects, provenance: 'versioned_game_design' as const,
  }));
  const gearContainer = items.length ? {
    id: 'LL-CNT-STAGE07-GEAR-' + corpse.id,
    kind: 'backpack' as const,
    capacitySlots: null,
    occupiedSlots: items.length,
    location: { kind: 'carried' as const, ownerId: state.player.id },
    observed: true,
    stacks: items,
  } : null;
  if (gearContainer && state.inventory.containers.some(container => container.id === gearContainer.id)) {
    return { state, code: 'CORPSE_GEAR_ALREADY_TRANSFERRED', requirements: ['The held gear has already been recovered.'] };
  }
  return {
    state: {
      ...state,
      inventory: gearContainer ? { ...state.inventory, containers: [...state.inventory.containers, gearContainer] } : state.inventory,
      corpses: state.corpses.map(item => item.id !== corpseId ? item : {
        ...item, state: 'butchered', disposition: 'butchered', ownershipId: state.player.id,
        bodyRecord: { ...body, equipmentInstanceIds: [], heldEquipment: [] },
      }),
    },
    code: null,
    requirements: [],
  };
}

export function lockDirectReviveOnSecondDeath(state: GameState, unitId: string, occurredAtElapsedMs: number): GameState {
  const unit = state.ownedUnits.find(item => item.id === unitId);
  const link = unit?.directReviveProvenance;
  if (!unit || !link || link.secondDeathLocked) return state;
  return {
    ...state,
    ownedUnits: state.ownedUnits.map(item => item.id !== unitId ? item : {
      ...item,
      xpMirrorEligible: false,
      directReviveProvenance: { ...link, secondDeathLocked: true },
      health: item.health ? { ...item.health, current: 0 } : item.health,
      integrity: 0,
    }),
    corpses: state.corpses.map(corpse => corpse.id !== link.originatingCorpseId ? corpse : {
      ...corpse,
      state: 'second_death_locked',
      disposition: 'second_death_locked',
      secondDeathLock: true,
      deathAtElapsedMs: occurredAtElapsedMs,
      deathHistory: [...(corpse.deathHistory ?? []), {
        eventId: `SECOND-DEATH-${unitId}-${occurredAtElapsedMs}`,
        actorId: unitId,
        atElapsedMs: occurredAtElapsedMs,
        cause: 'direct-revived unit died a second time',
      }],
    }),
  };
}

export function careerOpeningSkill(state: GameState): SkillInstanceState {
  return {
    id: `${state.player.id}:SK-OPEN-NECRO-01`,
    templateId: 'SK-OPEN-NECRO-01',
    mastery: 0,
    active: true,
    sourceRuleVersion: 'OPENING-MANA-SKILL-1.0',
  };
}

export function applyNecromancerGrowth(attributes: Readonly<Record<string, number>>, levelCount: number): { attributes: Readonly<Record<string, number>>; delta: Readonly<Record<string, number>> } {
  const points = Math.max(0, Math.floor(levelCount)) * 8;
  if (points === 0) return { attributes, delta: {} };
  const delta: Record<string, number> = {};
  for (const stat of ['STR', 'VIT', 'DEX', 'INT', 'WIL', 'PER', 'LUK']) delta[stat] = points * (0.20 / 7);
  delta.SPI = points * 0.55;
  delta.PRE = points * 0.25;
  const next = { ...attributes };
  for (const [stat, value] of Object.entries(delta)) next[stat] = Math.round(((next[stat] ?? 0) + value) * 1_000) / 1_000;
  return { attributes: next, delta };
}

export function activateOpeningCareer(state: GameState): GameState {
  if (state.player.career.state === 'active') return state;
  const pendingLevels = Math.floor((state.player.career.pendingGrowth ?? 0) / 8);
  const growth = applyNecromancerGrowth(state.player.attributes, pendingLevels);
  const allocated = { ...(state.player.career.allocatedGrowth ?? {}) };
  for (const [stat, value] of Object.entries(growth.delta)) allocated[stat] = (allocated[stat] ?? 0) + value;
  return {
    ...state,
    player: {
      ...state.player,
      attributes: growth.attributes,
      career: {
        ...state.player.career,
        state: 'active',
        skills: [careerOpeningSkill(state)],
        pendingGrowth: 0,
        allocatedGrowth: allocated,
      },
    },
  };
}

export function playerLevelThreshold(level: number): number {
  const tier = 1 + 0.18 * Math.floor((level - 1) / 10);
  const complexity = 1.1;
  return Math.floor((100 * Math.pow(level, 1.65) * tier * complexity + 5) / 10) * 10;
}

export function settleOrdinaryLaborXp(state: GameState, unitId: string, workUnits: number, sourceTransactionId: string, occurredAtElapsedMs: number, contributionShare = 1) {
  const unit = state.ownedUnits.find(item => item.id === unitId);
  if (!unit || workUnits <= 0 || contributionShare <= 0) return { state, transactions: [] as NonNullable<GameState['progression']>['transactions'][number][] };
  const grossXp = workUnits * 10 * contributionShare;
  const netXp = Math.floor(grossXp);
  if (netXp <= 0) return { state, transactions: [] as NonNullable<GameState['progression']>['transactions'][number][] };
  const transactions: NonNullable<GameState['progression']>['transactions'][number][] = [];
  const progression = state.progression ?? { transactions: [], mirrorReceiptKeys: [] };
  const normalId = sourceTransactionId;
  if (progression.transactions.some(item => item.id === normalId)) return { state, transactions: [] };
  const levelBefore = unit.level;
  const xpBefore = unit.xp;
  let levelAfter = levelBefore;
  let xpAfter = xpBefore + netXp;
  let remainder = xpAfter;
  const thresholdsCrossed: number[] = [];
  while (levelAfter < (unit.sourceStats.formTier * 10) && remainder >= playerLevelThreshold(levelAfter)) {
    remainder -= playerLevelThreshold(levelAfter);
    levelAfter++;
    thresholdsCrossed.push(levelAfter);
  }
  xpAfter = remainder;
  const normal = {
    id: normalId, transactionKind: 'NORMAL_AWARD' as const, sourceEventId: sourceTransactionId,
    sourceTransactionId: null, sourceRecipientId: null, recipientId: unit.id, sourceCategory: 'labor' as const,
    templateId: STAGE07_LABOR_XP_RULE, grossXp, netXp, contributionShare,
    modifiers: { gap: 1, novelty: 1, risk: 1, antiFarm: 1 }, occurredAtElapsedMs,
    ruleVersion: STAGE07_LABOR_XP_RULE, levelBefore, xpBefore, thresholdsCrossed, levelAfter, xpAfter,
    growthDelta: {},
  };
  let owner = state.player;
  let mirror: NonNullable<GameState['progression']>['transactions'][number] | null = null;
  let keys = [...progression.mirrorReceiptKeys];
  const link = unit.directReviveProvenance;
  if (link && link.creationRoute === 'DIRECT_TU_PHUC' && unit.creationRoute === 'DIRECT_TU_PHUC' && unit.xpMirrorEligible
    && !link.secondDeathLocked && occurredAtElapsedMs >= link.mirrorStartAtElapsedMs && link.rootOwnerId === state.player.id) {
    const key = `${normalId}|LI_LAN|${DIRECT_REVIVE_MIRROR_RULE}`;
    if (!keys.includes(key)) {
      keys.push(key);
      const before = owner.xp;
      let ownerLevel = owner.level;
      let ownerXp = before + netXp;
      let pendingGrowth = owner.career.pendingGrowth ?? 0;
      const ownerThresholds: number[] = [];
      while (ownerXp >= playerLevelThreshold(ownerLevel)) {
        ownerXp -= playerLevelThreshold(ownerLevel);
        ownerLevel++;
        ownerThresholds.push(ownerLevel);
        pendingGrowth += 8;
      }
      const gainedLevels = ownerLevel - state.player.level;
      const growth = owner.career.state === 'active'
        ? applyNecromancerGrowth(owner.attributes, gainedLevels)
        : { attributes: owner.attributes, delta: {} as Readonly<Record<string, number>> };
      owner = {
        ...owner,
        level: ownerLevel,
        xp: ownerXp,
        attributes: growth.attributes,
        career: {
          ...owner.career,
          pendingGrowth: owner.career.state === 'active' ? 0 : pendingGrowth,
          allocatedGrowth: Object.fromEntries(Object.entries({ ...(owner.career.allocatedGrowth ?? {}) }).map(([stat, value]) => [stat, value + (growth.delta[stat] ?? 0)])),
        },
      };
      mirror = {
        id: `${normalId}:MIRROR`, transactionKind: 'OWNER_XP_MIRROR', sourceEventId: sourceTransactionId,
        sourceTransactionId: normalId, sourceRecipientId: unit.id, recipientId: state.player.id,
        sourceCategory: 'labor', templateId: DIRECT_REVIVE_MIRROR_RULE, grossXp: netXp, netXp,
        contributionShare: 1, modifiers: { gap: 1, novelty: 1, risk: 1, antiFarm: 1 },
        occurredAtElapsedMs, ruleVersion: DIRECT_REVIVE_MIRROR_RULE,
        levelBefore: state.player.level, xpBefore: before, thresholdsCrossed: ownerThresholds,
        levelAfter: ownerLevel, xpAfter: ownerXp, growthDelta: {},
      };
    }
  }
  const nextState: GameState = {
    ...state,
    player: owner,
    ownedUnits: state.ownedUnits.map(item => item.id === unit.id ? {
      ...item, level: levelAfter, xp: xpAfter, sourceStats: { ...item.sourceStats, level: levelAfter, xp: xpAfter },
    } : item),
    progression: {
      transactions: [...progression.transactions, normal, ...(mirror ? [mirror] : [])],
      mirrorReceiptKeys: keys,
    },
  };
  return { state: nextState, transactions: [normal, ...(mirror ? [mirror] : [])] };
}
