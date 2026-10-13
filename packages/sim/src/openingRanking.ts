/**
 * Source-locked OPENING_LEVEL inputs and pure ranking rules.
 * Forecasts are internal scheduling inputs. The public ranking functions below
 * consume committed level-10 completion records only.
 */
export const OPENING_LEVEL_BOARD_ID = 'OPENING_LEVEL';
export const OPENING_LEVEL_REWARD_CONTRACT = 'RWD-OPENING-FIXED-2.0';
export const OPENING_LEVEL_OPENS_AT_MS = 48 * 60 * 60_000;
export const OPENING_LEVEL_CLOSES_AT_MS = 144 * 60 * 60_000;
export const OPENING_LEVEL_DISPLAY_DELAY_MS = 3 * 60_000;
export const OPENING_LEVEL_QUALIFYING_LEVEL = 10;
export const OPENING_LEVEL_MAX_ROWS = 100;
export const OPENING_RIVAL_SIMULATION_VERSION = 'OPENING-RIVAL-ACTION-OVERLAY-1.0';

export type OpeningRival = {
  id: string;
  name: string;
  grade: 'B' | 'A' | 'S' | 'C';
  phaseCurve: 'EARLY_BURST' | 'EARLY_STABLE' | 'BALANCED' | 'MID_SPIKE' | 'LATE_ENGINE';
  affinity: 'CONTROL' | 'SUPPORT' | 'HUNTER' | 'WARLORD' | 'BUILDER' | 'EXPLORER' | 'TRADER';
  troopLevelFit: number;
  environmentLevelFit: number;
  execution: number;
  supply: number;
  chestPotential: number;
  fortune: number;
  friction: number;
  startEnvironment: 'CHEST_RICH' | 'RUIN_RICH' | 'TARGET_RICH' | 'RESOURCE_RICH' | 'TRADE_HUB' | 'SAFE_SUSTAIN';
};

/** RC-002 through RC-010, copied from the fixed File 07 P0 machine registry. */
export const OPENING_LEVEL_RIVALS: readonly OpeningRival[] = [
  { id: 'RC-002', name: 'Cơ Tâm Nguyệt', grade: 'S', phaseCurve: 'LATE_ENGINE', affinity: 'CONTROL', troopLevelFit: 70, environmentLevelFit: 72, execution: 82, supply: 68, chestPotential: 76, fortune: 70, friction: 8, startEnvironment: 'CHEST_RICH' },
  { id: 'RC-003', name: 'Diêu Nhất Minh', grade: 'S', phaseCurve: 'BALANCED', affinity: 'SUPPORT', troopLevelFit: 78, environmentLevelFit: 70, execution: 84, supply: 72, chestPotential: 63, fortune: 58, friction: 5, startEnvironment: 'RUIN_RICH' },
  { id: 'RC-004', name: 'Phương Long', grade: 'A', phaseCurve: 'EARLY_BURST', affinity: 'HUNTER', troopLevelFit: 82, environmentLevelFit: 88, execution: 76, supply: 55, chestPotential: 55, fortune: 67, friction: 14, startEnvironment: 'TARGET_RICH' },
  { id: 'RC-005', name: 'Chu Bác', grade: 'B', phaseCurve: 'EARLY_BURST', affinity: 'HUNTER', troopLevelFit: 85, environmentLevelFit: 88, execution: 74, supply: 62, chestPotential: 45, fortune: 56, friction: 10, startEnvironment: 'TARGET_RICH' },
  { id: 'RC-006', name: 'Vũ Hưng Hổ', grade: 'A', phaseCurve: 'EARLY_STABLE', affinity: 'WARLORD', troopLevelFit: 74, environmentLevelFit: 55, execution: 79, supply: 65, chestPotential: 48, fortune: 61, friction: 9, startEnvironment: 'RESOURCE_RICH' },
  { id: 'RC-007', name: 'Tạ Nghiên', grade: 'A', phaseCurve: 'MID_SPIKE', affinity: 'BUILDER', troopLevelFit: 45, environmentLevelFit: 70, execution: 91, supply: 80, chestPotential: 68, fortune: 52, friction: 4, startEnvironment: 'RUIN_RICH' },
  { id: 'RC-008', name: 'Lục Tử Du', grade: 'B', phaseCurve: 'EARLY_STABLE', affinity: 'EXPLORER', troopLevelFit: 64, environmentLevelFit: 72, execution: 86, supply: 67, chestPotential: 82, fortune: 64, friction: 7, startEnvironment: 'CHEST_RICH' },
  { id: 'RC-009', name: 'Khổng Mạn', grade: 'C', phaseCurve: 'LATE_ENGINE', affinity: 'TRADER', troopLevelFit: 35, environmentLevelFit: 55, execution: 88, supply: 74, chestPotential: 42, fortune: 79, friction: 5, startEnvironment: 'TRADE_HUB' },
  { id: 'RC-010', name: 'Tô Hàn', grade: 'B', phaseCurve: 'BALANCED', affinity: 'SUPPORT', troopLevelFit: 58, environmentLevelFit: 65, execution: 83, supply: 82, chestPotential: 51, fortune: 57, friction: 4, startEnvironment: 'SAFE_SUSTAIN' },
];

const STARTING_PREY_GROUPS = { CHEST_RICH: 70, RUIN_RICH: 74, TARGET_RICH: 84, RESOURCE_RICH: 66, TRADE_HUB: 54, SAFE_SUSTAIN: 62 } as const;
export type OpeningRivalStartingResources = { prey: number; rations: number; firewood: number; targetsPerHunt: number };

/** Versioned local resource estimates: finite packs from File 03 field density, never respawned on a timer. */
export function openingRivalStartingResources(rival: OpeningRival): OpeningRivalStartingResources {
  return {
    prey: STARTING_PREY_GROUPS[rival.startEnvironment],
    rations: 12 + Math.floor(rival.supply / 4),
    firewood: 2 + Math.floor(rival.supply / 20),
    targetsPerHunt: Math.max(1, Math.min(3, 1 + Math.floor(rival.troopLevelFit / 40))),
  };
}

const GRADE_BASE = { B: 52, A: 64, S: 76, C: 40 } as const;
const P0_CURVE = { EARLY_BURST: 1.30, EARLY_STABLE: 1.15, BALANCED: 1.00, MID_SPIKE: 0.78, LATE_ENGINE: 0.58 } as const;
const LEVEL_AFFINITY = { CONTROL: 0.85, SUPPORT: 0.80, HUNTER: 1.20, WARLORD: 0.90, BUILDER: 0.50, EXPLORER: 0.85, TRADER: 0.45 } as const;
const LEVEL_WEIGHTS = { talent: 22, unit: 20, environment: 18, execution: 15, supply: 10, chest: 5, luck: 5, momentum: 5 } as const;
const NEUTRAL_OPENING_MOMENTUM = 50;
const REFERENCE_DURATION_MINUTES = 5_760;
const MINIMUM_DURATION_MINUTES = 1_440;

function clampStat(value: number): number {
  if (!Number.isFinite(value)) throw new Error('OPENING_RANK_STAT_INVALID');
  return Math.max(0, Math.min(100, value));
}

export type OpeningRivalForecast = {
  contenderId: string;
  completionStat: number;
  projectedDurationMinutes: number;
};

export function forecastOpeningRival(rival: OpeningRival): OpeningRivalForecast {
  const talent = clampStat(GRADE_BASE[rival.grade] * P0_CURVE[rival.phaseCurve] * LEVEL_AFFINITY[rival.affinity]);
  const values = {
    talent,
    unit: clampStat(rival.troopLevelFit),
    environment: clampStat(rival.environmentLevelFit),
    execution: clampStat(rival.execution),
    supply: clampStat(rival.supply),
    chest: clampStat(rival.chestPotential),
    luck: clampStat(rival.fortune),
    momentum: NEUTRAL_OPENING_MOMENTUM,
  };
  const weighted = (values.talent * LEVEL_WEIGHTS.talent
    + values.unit * LEVEL_WEIGHTS.unit
    + values.environment * LEVEL_WEIGHTS.environment
    + values.execution * LEVEL_WEIGHTS.execution
    + values.supply * LEVEL_WEIGHTS.supply
    + values.chest * LEVEL_WEIGHTS.chest
    + values.luck * LEVEL_WEIGHTS.luck
    + values.momentum * LEVEL_WEIGHTS.momentum) / 100;
  const completionStat = Math.max(0, Math.min(100, weighted - 0.25 * clampStat(rival.friction)));
  const rawMinutes = REFERENCE_DURATION_MINUTES * Math.pow(2, (50 - completionStat) / 25);
  return {
    contenderId: rival.id,
    completionStat,
    projectedDurationMinutes: Math.max(MINIMUM_DURATION_MINUTES, Math.floor(rawMinutes + 0.5)),
  };
}

export type OpeningLevelCompletion = {
  playerId: string;
  realName: string;
  level: number;
  progressToNextLevelPermille: number;
  completionAtElapsedMs: number;
};

export type OpeningLevelRow = OpeningLevelCompletion & { rank: number };

export function openingRankIndex<T extends { playerId: string; rank: number }>(rows: readonly T[]): Readonly<Record<string, number>> {
  return Object.fromEntries(rows.map(row => [row.playerId, row.rank]));
}

/** O(1) top-100 ID lookup; IDs absent from the bounded board have no rank row. */
export function openingRankedRowById<T extends { playerId: string; rank: number }>(
  rows: readonly T[],
  rankById: Readonly<Record<string, number>>,
  playerId: string,
): T | null {
  const rank = rankById[playerId];
  if (!Number.isSafeInteger(rank) || rank! < 1 || rank! > rows.length) return null;
  const row = rows[rank! - 1];
  return row?.playerId === playerId && row.rank === rank ? row : null;
}

function compareCompletion(a: OpeningLevelCompletion, b: OpeningLevelCompletion): number {
  return a.completionAtElapsedMs - b.completionAtElapsedMs || (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0);
}

function topCompletions(completions: readonly OpeningLevelCompletion[], limit: number, closedAtElapsedMs: number): OpeningLevelCompletion[] {
  const heap: OpeningLevelCompletion[] = [];
  const worse = (a: OpeningLevelCompletion, b: OpeningLevelCompletion) => compareCompletion(a, b) > 0;
  const swapDown = (start: number) => {
    let index = start;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let worst = index;
      if (left < heap.length && worse(heap[left]!, heap[worst]!)) worst = left;
      if (right < heap.length && worse(heap[right]!, heap[worst]!)) worst = right;
      if (worst === index) return;
      [heap[index], heap[worst]] = [heap[worst]!, heap[index]!];
      index = worst;
    }
  };
  for (const row of completions) {
    if (row.level < OPENING_LEVEL_QUALIFYING_LEVEL || !Number.isSafeInteger(row.completionAtElapsedMs)
      || row.completionAtElapsedMs < 0 || row.completionAtElapsedMs > closedAtElapsedMs) continue;
    if (heap.length < limit) {
      heap.push(row);
      let index = heap.length - 1;
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (!worse(heap[index]!, heap[parent]!)) break;
        [heap[index], heap[parent]] = [heap[parent]!, heap[index]!];
        index = parent;
      }
    } else if (compareCompletion(row, heap[0]!) < 0) {
      heap[0] = row;
      swapDown(0);
    }
  }
  return heap.sort(compareCompletion);
}

/** Selects only actual level-10 completions; forecast values are never inputs. */
export function rankOpeningLevelCompletions(
  completions: readonly OpeningLevelCompletion[],
  closedAtElapsedMs = OPENING_LEVEL_CLOSES_AT_MS,
): OpeningLevelRow[] {
  const eligible = topCompletions(completions, OPENING_LEVEL_MAX_ROWS, closedAtElapsedMs);
  return eligible.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function visibleOpeningLevelRows(
  completions: readonly OpeningLevelCompletion[],
  nowElapsedMs: number,
): OpeningLevelRow[] {
  if (nowElapsedMs < OPENING_LEVEL_OPENS_AT_MS) return [];
  const observedThrough = Math.min(OPENING_LEVEL_CLOSES_AT_MS, nowElapsedMs - OPENING_LEVEL_DISPLAY_DELAY_MS);
  return rankOpeningLevelCompletions(completions.filter(row => row.completionAtElapsedMs <= observedThrough), OPENING_LEVEL_CLOSES_AT_MS);
}

export type OpeningRewardBand = {
  id: 'RANK_1' | 'RANK_2' | 'RANK_3' | 'RANK_4_10' | 'RANK_11_20' | 'RANK_21_50' | 'RANK_51_100';
  minRank: number;
  maxRank: number;
  payload: readonly { item: string; quantity: number }[];
};

/** Literal quantities from LORD-DND-01 §13.4; no scaling by rank or player tier. */
export const OPENING_LEVEL_REWARD_BANDS: readonly OpeningRewardBand[] = [
  { id: 'RANK_1', minRank: 1, maxRank: 1, payload: [{ item: 'meat', quantity: 200 }, { item: 'basic_medicine', quantity: 10 }, { item: 'medium_resource_bag', quantity: 10 }, { item: 'silver_chest', quantity: 1 }, { item: 'tier_2_leader_recruitment_scroll', quantity: 1 }, { item: 'power_heart', quantity: 1 }] },
  { id: 'RANK_2', minRank: 2, maxRank: 2, payload: [{ item: 'meat', quantity: 100 }, { item: 'basic_medicine', quantity: 10 }, { item: 'medium_resource_bag', quantity: 3 }, { item: 'tier_2_random_recruitment_scroll', quantity: 1 }, { item: 'blue_weapon', quantity: 1 }, { item: 'power_heart', quantity: 1 }] },
  { id: 'RANK_3', minRank: 3, maxRank: 3, payload: [{ item: 'meat', quantity: 50 }, { item: 'basic_medicine', quantity: 10 }, { item: 'medium_resource_bag', quantity: 2 }, { item: 'tier_2_random_recruitment_scroll', quantity: 1 }, { item: 'green_weapon', quantity: 1 }, { item: 'power_heart', quantity: 1 }] },
  { id: 'RANK_4_10', minRank: 4, maxRank: 10, payload: [{ item: 'meat', quantity: 40 }, { item: 'basic_medicine', quantity: 10 }, { item: 'medium_resource_bag', quantity: 1 }, { item: 'green_weapon_choice', quantity: 1 }, { item: 'power_heart', quantity: 1 }] },
  { id: 'RANK_11_20', minRank: 11, maxRank: 20, payload: [{ item: 'meat', quantity: 20 }, { item: 'basic_medicine', quantity: 5 }, { item: 'small_resource_bag', quantity: 3 }, { item: 'black_iron_chest', quantity: 1 }] },
  { id: 'RANK_21_50', minRank: 21, maxRank: 50, payload: [{ item: 'meat', quantity: 10 }, { item: 'basic_medicine', quantity: 4 }, { item: 'small_resource_bag', quantity: 2 }, { item: 'white_weapon', quantity: 1 }] },
  { id: 'RANK_51_100', minRank: 51, maxRank: 100, payload: [{ item: 'bread', quantity: 20 }, { item: 'basic_medicine', quantity: 2 }, { item: 'small_resource_bag', quantity: 1 }] },
];

export function openingLevelRewardBand(rank: number): OpeningRewardBand | null {
  if (!Number.isSafeInteger(rank) || rank < 1 || rank > OPENING_LEVEL_MAX_ROWS) return null;
  return OPENING_LEVEL_REWARD_BANDS.find(band => rank >= band.minRank && rank <= band.maxRank) ?? null;
}
