import type { CoordinateMm, WorldResourceFeature } from '../../contracts/src/index.ts';

const m = (value: number) => value * 1_000;
const point = (xMetres: number, yMetres: number): CoordinateMm => ({ xMm: m(xMetres), yMm: m(yMetres), sourceZMetres: 0 });

export const RESOURCE_ECONOMY_VERSION = 'RESOURCE-ECONOMY-2.0';

/** Per-worker rates are pinned to three cost anchors in the current rules:
 * H1 gathers 75 opening wood/stone units in 6.3 work hours; H8 gathers the
 * 700 harvestable wood/stone units for Lord House 3→4 in 5.8 hours with two
 * workers; H22 gathers the 1,000,000-wood component of House 22→23 in 69.4
 * hours with four workers. The remaining middle/late recipe inputs require
 * materials that have no active deposit contract in this build.
 * The intervening tiers bridge those anchors; travel and tool access remain real costs.
 */
export const HARVEST_PROGRESSION = [
  { minFireLevel: 1, maxFireLevel: 3, unitsPerHour: 12, carryCapacity: 20 },
  { minFireLevel: 4, maxFireLevel: 5, unitsPerHour: 30, carryCapacity: 100 },
  { minFireLevel: 6, maxFireLevel: 10, unitsPerHour: 60, carryCapacity: 500 },
  { minFireLevel: 11, maxFireLevel: 15, unitsPerHour: 240, carryCapacity: 2_000 },
  { minFireLevel: 16, maxFireLevel: 20, unitsPerHour: 900, carryCapacity: 10_000 },
  { minFireLevel: 21, maxFireLevel: 25, unitsPerHour: 3_600, carryCapacity: 50_000 },
  { minFireLevel: 26, maxFireLevel: 30, unitsPerHour: 7_200, carryCapacity: 100_000 },
] as const;

export function harvestProgressionForFireLevel(level: number) {
  const bounded = Math.max(1, Math.min(30, Math.floor(level)));
  return HARVEST_PROGRESSION.find(tier => bounded >= tier.minFireLevel && bounded <= tier.maxFireLevel)!;
}

/** Ideal elapsed gathering hours with the listed number of workers operating in
 * parallel. Travel, access setup, processing, storage transfers, and construction
 * work are excluded; sourceAssignments names the intended map deposit per type.
 */
export function estimateParallelGatheringHours(target: typeof RESOURCE_PURCHASE_TARGETS[number]): number {
  const totalUnits = Object.values(target.costs).reduce((sum, quantity) => sum + quantity, 0);
  return totalUnits / (harvestProgressionForFireLevel(target.fireLevel).unitsPerHour * target.workers);
}

/** Harvestable parts of recipes in the source-locked opening rules and
 * LORD-HOUSE-UPGRADE-PATH-2.0. `unmodeledCosts` are recipe requirements whose
 * materials do not have an active map deposit. Times exclude travel, trips,
 * storage handling, processing, and construction work.
 */
export const RESOURCE_PURCHASE_TARGETS = [
  { id: 'starter-opening-bundle', name: 'Repair the Lord House, build a farmhouse and upgrade Fire 1→2', fireLevel: 1, workers: 1, costs: { WOOD: 50, STONE: 25 }, sourceAssignments: { WOOD: 'RES-LL01-06', STONE: 'RES-LL01-07' }, unmodeledCosts: {} },
  { id: 'mid-lord-house', name: 'Lord House 3→4 harvestable materials', fireLevel: 8, workers: 2, costs: { WOOD: 400, STONE: 300 }, sourceAssignments: { WOOD: 'RES-LL01-08', STONE: 'RES-LL01-12' }, unmodeledCosts: { IRON: 100 } },
  { id: 'late-lord-house', name: 'Lord House 22→23 wood component', fireLevel: 22, workers: 4, costs: { WOOD: 1_000_000 }, sourceAssignments: { WOOD: 'RES-LL01-01' }, unmodeledCosts: { REFINED_IRON: 170_000, MITHRIL: 80_000, MASTER_TIER_ELEMENTAL_CRYSTAL: 10_000, ANCIENT_WOOD: 5_000, STARFALL: 3_000 } },
] as const;

/** The H0 store stacks bulk resources by material. Its limits are stack slots,
 * while per-worker carried bulk is bounded by HARVEST_PROGRESSION above.
 */
export const RESOURCE_STORAGE = { initialStackSlots: 40, unitInventorySlots: 40 } as const;

type Channel = WorldResourceFeature['appearanceChannels'][number]['channel'];
type ResourceSpec = {
  resourceId: string;
  materialId: string;
  materialName: string;
  unit: string;
  channel: Channel;
  areaUnit: 'hectare' | 'square_metre';
  unitsPerArea: number;
  densityPermille: number;
  richnessPermille: number;
  renewal: 'none' | 'biological_rate' | 'daily_quota';
  dailyQuota: number | null;
  regenerationPerAreaPerDay: number;
  access: 'open_surface' | 'frozen_water' | 'survey_required' | 'workforce_and_fuel';
  requiredToolTemplateId: string | null;
};
type FeatureSpec = {
  id: string;
  name: string;
  terrainKind: WorldResourceFeature['terrainKind'];
  position: CoordinateMm;
  widthMetres: number;
  depthMetres: number;
  visualElementCount: number;
  sourceRecord?: string;
  materials: readonly ResourceSpec[];
};

const source = (recordId: string) => ({ path: RESOURCE_ECONOMY_VERSION, heading: 'Terrain-derived deposits', recordId });
/** Every deposit occupies one feature footprint. Capacities are derived from its area,
 * the resource yield density, local density, and richness; sibling materials share one feature.
 */
export const RESOURCE_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'FEATURE-LL01-STARTER-WOOD', name: 'Camp timber salvage', terrainKind: 'salvage', position: point(3, 0),
    widthMetres: 5, depthMetres: 4, visualElementCount: 8,
    materials: [{ resourceId: 'RES-LL01-06', materialId: 'WOOD', materialName: 'Salvaged wood', unit: 'unit', channel: 'salvage', areaUnit: 'square_metre', unitsPerArea: 3.2, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'none', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: 'STONE-AXE' }],
  },
  {
    id: 'FEATURE-LL01-STARTER-STONE', name: 'Camp stone rubble', terrainKind: 'salvage', position: point(-3, 0),
    widthMetres: 5, depthMetres: 4, visualElementCount: 10,
    materials: [{ resourceId: 'RES-LL01-07', materialId: 'STONE', materialName: 'Salvaged stone', unit: 'unit', channel: 'salvage', areaUnit: 'square_metre', unitsPerArea: 1.6, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'none', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: 'STONE-HAMMER' }],
  },
  {
    id: 'FEATURE-LL01-GROVE-01', name: 'H0 north-east pine grove', terrainKind: 'forest', position: point(350, -400),
    widthMetres: 550, depthMetres: 700, visualElementCount: 72,
    materials: [
      { resourceId: 'RES-LL01-08', materialId: 'WOOD', materialName: 'Pine timber', unit: 'unit', channel: 'canopy', areaUnit: 'hectare', unitsPerArea: 320, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'biological_rate', dailyQuota: null, regenerationPerAreaPerDay: 0.5, access: 'open_surface', requiredToolTemplateId: 'STONE-AXE' },
      { resourceId: 'RES-LL01-09', materialId: 'WILD-FOOD', materialName: 'Forest forage', unit: 'bundle', channel: 'groundcover', areaUnit: 'hectare', unitsPerArea: 2, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: null },
    ],
  },
  {
    id: 'FEATURE-LL01-GROVE-02', name: 'H0 east pine grove', terrainKind: 'forest', position: point(1_400, -1_700),
    widthMetres: 1_500, depthMetres: 1_600, visualElementCount: 115,
    materials: [
      { resourceId: 'RES-LL01-10', materialId: 'WOOD', materialName: 'Pine timber', unit: 'unit', channel: 'canopy', areaUnit: 'hectare', unitsPerArea: 320, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'biological_rate', dailyQuota: null, regenerationPerAreaPerDay: 0.5, access: 'open_surface', requiredToolTemplateId: 'STONE-AXE' },
      { resourceId: 'RES-LL01-11', materialId: 'WILD-FOOD', materialName: 'Forest forage', unit: 'bundle', channel: 'groundcover', areaUnit: 'hectare', unitsPerArea: 2, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: null },
    ],
  },
  {
    id: 'FEATURE-LL01-NEAR-OUTCROP', name: 'Battlefield stone outcrop', terrainKind: 'outcrop', position: point(-1_200, 1_450),
    widthMetres: 1_200, depthMetres: 1_200, visualElementCount: 96,
    materials: [{ resourceId: 'RES-LL01-12', materialId: 'STONE', materialName: 'Exposed stone', unit: 'unit', channel: 'rock_mass', areaUnit: 'hectare', unitsPerArea: 80, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'none', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: 'STONE-HAMMER' }],
  },
  {
    id: 'FEATURE-LL01-ASH-ICE-FOREST', name: 'Ash Ice Pine Forest', terrainKind: 'forest', position: point(4_700, -6_800),
    widthMetres: 7_000, depthMetres: 7_200, visualElementCount: 135, sourceRecord: 'RES-LL01-01',
    materials: [
      { resourceId: 'RES-LL01-01', materialId: 'WOOD', materialName: 'Mature timber', unit: 'unit', channel: 'canopy', areaUnit: 'hectare', unitsPerArea: 400, densityPermille: 1_000, richnessPermille: 1_100, renewal: 'biological_rate', dailyQuota: null, regenerationPerAreaPerDay: 0.5, access: 'open_surface', requiredToolTemplateId: 'STONE-AXE' },
      { resourceId: 'RES-LL01-13', materialId: 'WILD-FOOD', materialName: 'Forest forage', unit: 'bundle', channel: 'groundcover', areaUnit: 'hectare', unitsPerArea: 2, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: null },
    ],
  },
  {
    id: 'FEATURE-LL01-WESTERN-PINE-WILDS', name: 'Western Pine Wilds', terrainKind: 'forest', position: point(12_500, -6_500),
    widthMetres: 7_800, depthMetres: 7_200, visualElementCount: 180,
    materials: [
      { resourceId: 'RES-LL01-14', materialId: 'WOOD', materialName: 'Deep forest timber', unit: 'unit', channel: 'canopy', areaUnit: 'hectare', unitsPerArea: 400, densityPermille: 1_000, richnessPermille: 1_100, renewal: 'biological_rate', dailyQuota: null, regenerationPerAreaPerDay: 0.5, access: 'open_surface', requiredToolTemplateId: 'STONE-AXE' },
      { resourceId: 'RES-LL01-15', materialId: 'WILD-FOOD', materialName: 'Deep forest forage', unit: 'bundle', channel: 'groundcover', areaUnit: 'hectare', unitsPerArea: 2, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: null },
    ],
  },
  {
    id: 'FEATURE-LL01-GRAY-QUARRY', name: 'Gray Vein Quarry', terrainKind: 'outcrop', position: point(-7_800, -4_700),
    widthMetres: 2_600, depthMetres: 2_200, visualElementCount: 95, sourceRecord: 'RES-LL01-02',
    materials: [{ resourceId: 'RES-LL01-02', materialId: 'STONE', materialName: 'Exposed quarry stone', unit: 'unit', channel: 'rock_mass', areaUnit: 'hectare', unitsPerArea: 500, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'none', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'open_surface', requiredToolTemplateId: 'STONE-HAMMER' }],
  },
  {
    id: 'FEATURE-LL01-GLASS-FORD', name: 'Glass River Ford', terrainKind: 'frozen_water', position: point(8_900, -11_200),
    widthMetres: 6_400, depthMetres: 2_200, visualElementCount: 36, sourceRecord: 'RES-LL01-03',
    materials: [{ resourceId: 'RES-LL01-03', materialId: 'RAW-ICE-WATER', materialName: 'Raw ice water', unit: 'L', channel: 'ice', areaUnit: 'hectare', unitsPerArea: 21.23, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: 20_000, regenerationPerAreaPerDay: 0, access: 'frozen_water', requiredToolTemplateId: null }],
  },
  {
    id: 'FEATURE-LL01-BROWN-COAL-SEAM', name: 'Brown coal seam', terrainKind: 'coal_seam', position: point(-12_400, -6_800),
    widthMetres: 900, depthMetres: 700, visualElementCount: 7, sourceRecord: 'RES-LL01-04',
    materials: [{ resourceId: 'RES-LL01-04', materialId: 'BROWN-COAL', materialName: 'Brown coal', unit: 'unit', channel: 'seam', areaUnit: 'hectare', unitsPerArea: 8.7, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'none', dailyQuota: null, regenerationPerAreaPerDay: 0, access: 'survey_required', requiredToolTemplateId: null }],
  },
  {
    id: 'FEATURE-LL01-GRAY-SALT-SPRING', name: 'Gray Salt Spring', terrainKind: 'salt_spring', position: point(-16_000, -9_000),
    widthMetres: 100, depthMetres: 80, visualElementCount: 12, sourceRecord: 'RES-LL01-05',
    materials: [{ resourceId: 'RES-LL01-05', materialId: 'RAW-SALT', materialName: 'Raw salt', unit: 'unit', channel: 'salt', areaUnit: 'hectare', unitsPerArea: 17.83, densityPermille: 1_000, richnessPermille: 1_000, renewal: 'daily_quota', dailyQuota: 14, regenerationPerAreaPerDay: 0, access: 'workforce_and_fuel', requiredToolTemplateId: null }],
  },
];

export function featureArea(spec: Pick<FeatureSpec, 'widthMetres' | 'depthMetres'>, areaUnit: 'hectare' | 'square_metre'): number {
  const squareMetres = Math.PI * (spec.widthMetres / 2) * (spec.depthMetres / 2);
  return areaUnit === 'hectare' ? squareMetres / 10_000 : squareMetres;
}

export function capacityForFeatureResource(feature: FeatureSpec, material: ResourceSpec): number {
  const raw = featureArea(feature, material.areaUnit) * material.unitsPerArea
    * material.densityPermille / 1_000 * material.richnessPermille / 1_000;
  return Math.max(1, Math.floor(material.dailyQuota ?? raw));
}

export function materialForResourceId(resourceId: string): ResourceSpec | undefined {
  return RESOURCE_FEATURES.flatMap(feature => feature.materials).find(material => material.resourceId === resourceId);
}

export function worldFeatureFromSpec(feature: FeatureSpec): WorldResourceFeature {
  return {
    id: feature.id,
    name: feature.name,
    terrainKind: feature.terrainKind,
    position: feature.position,
    footprintMm: { widthMm: m(feature.widthMetres), depthMm: m(feature.depthMetres) },
    visualElementCount: feature.visualElementCount,
    appearanceChannels: feature.materials.map(material => ({ resourceId: material.resourceId, channel: material.channel })),
    source: source(feature.sourceRecord ?? feature.id),
  };
}

export function resourceFromFeature(feature: FeatureSpec, material: ResourceSpec, sourcePayload = `Terrain estimate · ${RESOURCE_ECONOMY_VERSION}`) {
  const area = featureArea(feature, material.areaUnit);
  return {
    id: material.resourceId,
    payload: sourcePayload,
    featureId: feature.id,
    materialId: material.materialId,
    materialName: material.materialName,
    unit: material.unit,
    capacity: capacityForFeatureResource(feature, material),
    capacityBasis: { areaUnit: material.areaUnit, unitsPerArea: material.unitsPerArea, densityPermille: material.densityPermille, richnessPermille: material.richnessPermille },
    location: feature.position,
    siteId: feature.sourceRecord === 'RES-LL01-01' ? 'SITE-LL01-040'
      : feature.sourceRecord === 'RES-LL01-02' ? 'SITE-LL01-041'
        : feature.sourceRecord === 'RES-LL01-03' ? 'SITE-LL01-042'
          : feature.sourceRecord === 'RES-LL01-05' ? 'SITE-LL01-051' : null,
    renewal: material.renewal,
    dailyQuota: material.dailyQuota ?? (material.renewal === 'daily_quota' ? Math.max(1, Math.floor(area * material.unitsPerArea)) : null),
    regenerationPerDay: material.renewal === 'biological_rate' ? Math.max(1, Math.floor(area * material.regenerationPerAreaPerDay)) : 0,
    access: material.access,
    requiredToolTemplateId: material.requiredToolTemplateId,
    source: source(feature.sourceRecord ?? feature.id),
  };
}
