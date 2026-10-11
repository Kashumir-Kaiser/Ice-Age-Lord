export const OPENING_BUILDINGS_RULE_VERSION = 'OPENING-FIXED-BUILDINGS-2.0' as const;
export const FARMHOUSE_RULE_VERSION = 'POLAR-FARMHOUSE-PROGRESSION-2.0' as const;
export const HOUSE_REPAIR_RULE_VERSION = 'LL01-HOUSE-REPAIR-1.0' as const;
export const PLACEMENT_OVERLAY_VERSION = 'LL01-BUILDING-PLACEMENT-1.0' as const;
export const LABOR_OVERLAY_VERSION = 'LL01-CONSTRUCTION-LABOR-1.0' as const;
export const OPENING_BUILDINGS_SOURCE_HASH = '2c19830773eba471b2b27e853665982df0bc20f8f629aa1c56af3d2ac0f03de0';
export const FARMHOUSE_SOURCE_HASH = '890e187701b4b0bc565b6cdabff9df84d941eee52084ca1f4d05d63ba0dabb46';

export type MaterialCost = { materialId: string; quantity: number; unit: 'item' | 'segment' };
export type OpeningBuildingDefinition = {
  id: string;
  name: string;
  family: string;
  level: 1;
  provenance: 'immutable_source_fact' | 'campaign_fixed';
  sourceRegistry: typeof OPENING_BUILDINGS_RULE_VERSION | typeof FARMHOUSE_RULE_VERSION;
  footprint: { areaM2: number | null; lengthM: number | null; geometryPolicy: string };
  buildCost: readonly MaterialCost[];
  workUnits: number;
  maxWorkers: number;
  tools: { status: 'not_specified_by_source'; requiredTemplateIds: readonly string[] };
  outputs: readonly string[];
  operatingNeeds: readonly string[];
  prerequisite: string;
  upgrade: null | { toLevel: 2; cost: readonly MaterialCost[]; workUnits: number; maxWorkers: number; prerequisite: string | null };
  buildableFromThisEvidence: true;
};

const sourceFootprint = 'Source area is retained; square-footprint collision bounds are a versioned placement overlay.';
const placementOnly = 'Physical orientation and boundary geometry are versioned game-overlay decisions.';
const noToolGate = { status: 'not_specified_by_source', requiredTemplateIds: [] } as const;
const fixed = (id: string, name: string, family: string, areaM2: number | null, lengthM: number | null,
  buildCost: readonly MaterialCost[], workUnits: number, maxWorkers: number, outputs: readonly string[], operatingNeeds: readonly string[],
  upgrade: OpeningBuildingDefinition['upgrade'], sourceRegistry: OpeningBuildingDefinition['sourceRegistry'] = OPENING_BUILDINGS_RULE_VERSION): OpeningBuildingDefinition => ({
  id, name, family, level: 1, provenance: 'immutable_source_fact', sourceRegistry,
  footprint: { areaM2, lengthM, geometryPolicy: areaM2 === null ? placementOnly : sourceFootprint },
  buildCost, workUnits, maxWorkers, tools: noToolGate, outputs, operatingNeeds,
  prerequisite: 'LORD_HOUSE_REPAIRED', upgrade, buildableFromThisEvidence: true,
});
const cost = (...values: [string, number][]): readonly MaterialCost[] => values.map(([materialId, quantity]) => ({ materialId, quantity, unit: 'item' as const }));
const segmentCost = (...values: [string, number][]): readonly MaterialCost[] => values.map(([materialId, quantity]) => ({ materialId, quantity, unit: 'segment' as const }));

export const LORD_HOUSE_REPAIR = Object.freeze({
  id: 'LL01-LORD-HOUSE-REPAIR-1', buildingId: 'LL-BLD-HOUSE-01',
  source: 'references/canonical/LORD-DND-06.md §7.3', ruleVersion: HOUSE_REPAIR_RULE_VERSION,
  cost: cost(['STONE', 10], ['WOOD', 20]), requiredTools: [{ materialId: 'STONE-HAMMER', quantity: 1 }], workUnits: 17 / 60, maxWorkers: 2,
  completionUnlocks: ['BP-OPEN-HEATER-01', 'BP-OPEN-KITCHEN-01', 'BP-OPEN-WOODWORKS-01', 'BP-OPEN-TAILOR-01', 'BP-OPEN-OREWORKS-01', 'BP-OPEN-FORGE-01', 'BP-OPEN-FARMHOUSE-01', 'BP-OPEN-INFIRMARY-01', 'BP-OPEN-SHELTER-01', 'BP-OPEN-WALL-01', 'BP-OPEN-GATE-01'],
  cancellationPolicy: 'LL01-CONSTRUCTION-CANCEL-1.0',
});

export const OPENING_BUILDINGS: readonly OpeningBuildingDefinition[] = Object.freeze([
  fixed('BP-OPEN-HEATER-01', 'Lò Sưởi Đơn Giản', 'heater', 0.5, null, cost(['STONE', 6]), 0.30, 2,
    ['Heat +15–20°C in a room up to 30 m²'], ['1 WOOD / 20 min while operating'], { toLevel: 2, cost: cost(['STONE', 12], ['IRON', 4]), workUnits: 0.75, maxWorkers: 2, prerequisite: null }),
  fixed('BP-OPEN-KITCHEN-01', 'Bếp Đơn Giản', 'kitchen', 1, null, cost(['STONE', 8], ['WOOD', 4]), 0.40, 2,
    ['4 prepared meal portions / 30 min'], ['Recipe input and fuel contract required'], { toLevel: 2, cost: cost(['STONE', 20], ['WOOD', 10], ['IRON', 5]), workUnits: 1, maxWorkers: 2, prerequisite: null }),
  fixed('BP-OPEN-WOODWORKS-01', 'Xưởng Gỗ', 'woodworks', 30, null, cost(['WOOD', 50], ['STONE', 30]), 4, 4,
    ['1 work station; process up to 10 WOOD / hour'], ['WOOD input; executable recipe required'], { toLevel: 2, cost: cost(['WOOD', 100], ['STONE', 60], ['IRON', 20]), workUnits: 6, maxWorkers: 4, prerequisite: null }),
  fixed('BP-OPEN-TAILOR-01', 'Tiệm May', 'tailor', 30, null, cost(['WOOD', 60], ['STONE', 40]), 5, 4,
    ['1 work station; 2 garments / 8 hours'], ['Garment recipe and textile inputs required'], { toLevel: 2, cost: cost(['WOOD', 120], ['STONE', 80], ['IRON', 20]), workUnits: 7, maxWorkers: 4, prerequisite: null }),
  fixed('BP-OPEN-OREWORKS-01', 'Xưởng Chế Biến Quặng', 'oreworks', 50, null, cost(['WOOD', 150], ['STONE', 80]), 10, 4,
    ['Process up to 20 ore / hour'], ['Ore and fuel inputs; executable recipe required'], { toLevel: 2, cost: cost(['WOOD', 300], ['STONE', 180], ['IRON', 80]), workUnits: 20, maxWorkers: 6, prerequisite: null }),
  fixed('BP-OPEN-FORGE-01', 'Lò Rèn', 'forge', 30, null, cost(['WOOD', 200], ['STONE', 100], ['IRON', 20]), 14, 4,
    ['1 work station; source-defined tool or weapon lots / 8 hours'], ['Known recipe, metal inputs and fuel required'], { toLevel: 2, cost: cost(['WOOD', 400], ['STONE', 250], ['IRON', 120], ['REFINED-IRON', 50]), workUnits: 30, maxWorkers: 6, prerequisite: null }),
  fixed('BP-OPEN-FARMHOUSE-01', 'Nhà Nông Phu Cực Địa', 'polar_farmhouse', 12, null, cost(['WOOD', 30], ['STONE', 10]), 0.75, 2,
    ['4 resident capacity', 'Recruitment: 5 FOOD units per resident'], ['Daily food upkeep amount is unresolved by source'], { toLevel: 2, cost: cost(['WOOD', 50], ['STONE', 30]), workUnits: 1.2, maxWorkers: 4, prerequisite: null }, FARMHOUSE_RULE_VERSION),
  fixed('BP-OPEN-INFIRMARY-01', 'Phòng Y Tế', 'infirmary', 25, null, cost(['WOOD', 45], ['STONE', 30], ['REFINED-IRON', 5]), 4, 4,
    ['2 beds; treats one eligible case'], ['Treatment contract, qualified worker and supplies required'], { toLevel: 2, cost: cost(['WOOD', 90], ['STONE', 60], ['IRON', 20], ['REFINED-IRON', 10]), workUnits: 5, maxWorkers: 4, prerequisite: null }),
  fixed('BP-OPEN-SHELTER-01', 'Nơi Trú Nhỏ', 'small_shelter', 12, null, cost(['WOOD', 15], ['STONE', 10], ['REFINED-IRON', 5]), 0.75, 2,
    ['2 sleeping places'], ['No operating input specified'], { toLevel: 2, cost: cost(['WOOD', 30], ['STONE', 20], ['IRON', 10]), workUnits: 1, maxWorkers: 2, prerequisite: null }),
  fixed('BP-OPEN-WALL-01', 'Tường Rào', 'wall_segment', null, 10, segmentCost(['WOOD', 10], ['STONE', 5]), 0.5, 2,
    ['10 m barrier segment, 1.5 m high'], ['No operating input specified'], { toLevel: 2, cost: cost(['WOOD', 20], ['STONE', 10], ['IRON', 5]), workUnits: 0.75, maxWorkers: 2, prerequisite: null }),
  fixed('BP-OPEN-GATE-01', 'Cổng', 'gate', null, 3, cost(['WOOD', 20], ['STONE', 10]), 1, 2,
    ['3 m wide × 2.5 m high wooden gate'], ['No operating input specified'], { toLevel: 2, cost: cost(['WOOD', 30], ['STONE', 20], ['IRON', 10]), workUnits: 1.5, maxWorkers: 3, prerequisite: null }),
]);

export const BUILDING_PLACEMENT_OVERLAY = Object.freeze({
  id: PLACEMENT_OVERLAY_VERSION,
  provenance: 'versioned_game_design' as const,
  ownedTerritoryRadiusMm: 100_000,
  interactionRangeMm: 5_000,
  collisionClearanceMm: 500,
  defaultSquareFootprintForArea: true,
  wallThicknessM: 0.5,
  newStructurePositionMustBePlayerReachable: true,
});

export const CONSTRUCTION_LABOR_OVERLAY = Object.freeze({
  id: LABOR_OVERLAY_VERSION,
  provenance: 'versioned_game_design' as const,
  defaultPlayerWuPerHour: 1,
  defaultActorConditionFactors: { health: 1, stamina: 1, skill: 1, tool: 1, weather: 1, shelter: 1, command: 1 },
  coordinationPermilleByWorkerCount: { 1: 1000, 2: 750, 3: 650, 4: 600, 5: 550, 6: 550 },
  workFormula: 'BLUEPRINT-WORK-3.0',
  cancellationPolicy: 'reserved inputs are fully released; completed work is not refunded',
});
