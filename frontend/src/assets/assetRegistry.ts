export type MapExport = {
  path: string; source: string; sourceSha256: string; sha256: string;
  exportVersion: number; width: number; height: number;
  role: 'body' | 'base' | 'upper' | 'shadow' | 'vfx';
  lod: 'close' | 'district'; orientation: string;
  alpha: 'straight'; colorSpace: 'srgb';
  logicalCanvas: {width:number;height:number};
  trim: {x:number;y:number;width:number;height:number};
  atlas?: {path:string;x:number;y:number;width:number;height:number;atlasWidth:number;atlasHeight:number;sha256?:string};
};
export type AssetLayerPaths = { uiIcon?: string; body?: string; base?: string; upper?: string; shadow?: string; vfx?: string | null };
export type AssetManifestEntry = {
  assetId: string;
  definitionId: string;
  variant: string;
  orientation: string;
  /** Only true architecture splits may compose base + upper. */
  composition?: 'single-body' | 'architectural';
  planningFoundation?: boolean;
  planningLayer?: string;
  orientationViews?: Partial<Record<'north' | 'east' | 'south' | 'west', AssetLayerPaths>>;
  equivalentOrientations?: readonly string[];
  mapExports?: readonly MapExport[];
  revision: number;
  /** Purely visual sprite-scale multiplier. Never changes physical occupancy or heat. */
  presentationScale?: number;
  layers: AssetLayerPaths;
  logicalCanvas: { width: number; height: number };
  trimOffset: { x: number; y: number };
  groundAnchor: { x: number; y: number };
  artFootprint: readonly (readonly [number, number])[];
  visualBounds: { minX: number; minY: number; maxX: number; maxY: number };
  hitPolygon?: readonly (readonly [number, number])[];
  occlusionRegion: { upper: readonly (readonly [number, number])[] };
  drawDepthAnchor: { x: number; y: number };
  compatiblePhysicalFootprint: { assumptionId: string; widthM: number; depthM: number };
  source: string;
  referenceSource?: string;
  provenance: string;
  license: string;
  status: 'placeholder' | 'draft' | 'approved';
  lodVariants: { close: AssetLayerPaths; district: AssetLayerPaths; regional: AssetLayerPaths };
};
export type FireArtStage = { minLevel: number; maxLevel: number; assetId: string };
export type BuildingArtProgressionStage = {
  level: number;
  assetId: string;
  canonicalProfile: Readonly<Record<string, string>>;
  visibleProfile: Readonly<Record<string, unknown>>;
};
export type BuildingArtProgression = {
  /** Asset identities that can use this visual-only progression. */
  baseAssetIds: readonly string[];
  trackName: string;
  unit: string;
  maxLevel: number;
  canonicalRegistry: string;
  canonicalSource: string;
  canonicalSection: string;
  stageIdsUseExactLevels: true;
  stages: readonly BuildingArtProgressionStage[];
};
export type StandaloneArtEntry = {
  assetId: string;
  name: string;
  source: string;
  src: string;
  canvas: { width: number; height: number };
  style: 'ink' | 'semi-realistic';
  provenance: string;
  license: string;
  status: 'draft' | 'approved';
  referenceSource?: string;
  note?: string;
};
export type AssetManifest = {
  schemaVersion: number;
  coordinateConvention: string;
  assets: readonly AssetManifestEntry[];
  fireProgression?: readonly FireArtStage[];
  buildingProgressions?: readonly BuildingArtProgression[];
  itemArt?: readonly StandaloneArtEntry[];
  unitArt?: readonly StandaloneArtEntry[];
};

const isFinitePoint = (value: unknown): value is { x: number; y: number } => Boolean(value && typeof value === 'object'
  && Number.isFinite((value as {x?:unknown}).x) && Number.isFinite((value as {y?:unknown}).y));

function validateManifest(value: unknown): AssetManifest {
  if (!value || typeof value !== 'object' || !Array.isArray((value as AssetManifest).assets)) throw new Error('Asset manifest has no asset list.');
  const manifest = value as AssetManifest;
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (!asset.assetId || ids.has(asset.assetId)) throw new Error(`Missing or duplicate assetId: ${asset.assetId}`);
    ids.add(asset.assetId);
    if (!Number.isInteger(asset.revision) || asset.revision < 1 || !asset.logicalCanvas || !Number.isFinite(asset.logicalCanvas.width) || !Number.isFinite(asset.logicalCanvas.height) || !isFinitePoint(asset.groundAnchor)) throw new Error(`Invalid registration for ${asset.assetId}`);
    if (asset.logicalCanvas.width <= 0 || asset.logicalCanvas.height <= 0 || asset.groundAnchor.x < 0 || asset.groundAnchor.x > 1 || asset.groundAnchor.y < 0 || asset.groundAnchor.y > 1) throw new Error(`Out-of-range canvas or anchor for ${asset.assetId}`);
    if (asset.presentationScale !== undefined && (!Number.isFinite(asset.presentationScale) || asset.presentationScale < 0.4 || asset.presentationScale > 3)) throw new Error(`Invalid presentation scale for ${asset.assetId}`);
    if (!asset.layers.body || !asset.layers.base || !asset.layers.upper || !asset.layers.shadow || !asset.layers.uiIcon) throw new Error(`Missing required visual layer for ${asset.assetId}`);
  }
  if (manifest.fireProgression) {
    let nextLevel = 1;
    for (const stage of manifest.fireProgression) {
      if (!Number.isInteger(stage.minLevel) || !Number.isInteger(stage.maxLevel)
        || stage.minLevel !== nextLevel || stage.maxLevel < stage.minLevel
        || !ids.has(stage.assetId)) {
        throw new Error('Invalid or discontinuous Survival Fire artwork progression.');
      }
      nextLevel = stage.maxLevel + 1;
    }
    if (nextLevel !== 31) throw new Error('Survival Fire artwork is not mapped for all levels 1–30.');
  }
  if (manifest.buildingProgressions) {
    const progressedAssetIds = new Set<string>();
    for (const progression of manifest.buildingProgressions) {
      if (!Array.isArray(progression.baseAssetIds) || progression.baseAssetIds.length === 0
        || progression.baseAssetIds.some(assetId => !ids.has(assetId) || progressedAssetIds.has(assetId))) {
        throw new Error('Building artwork progression has missing or duplicate base assets.');
      }
      if (!progression.trackName || !progression.unit || !progression.canonicalRegistry
        || !progression.canonicalSource || !progression.canonicalSection
        || progression.stageIdsUseExactLevels !== true
        || !Number.isInteger(progression.maxLevel) || progression.maxLevel < 1) {
        throw new Error('Building artwork progression is missing its canonical track or level cap.');
      }
      progression.baseAssetIds.forEach(assetId => progressedAssetIds.add(assetId));
      let nextLevel = 1;
      for (const stage of progression.stages) {
        if (!Number.isInteger(stage.level) || stage.level !== nextLevel
          || !ids.has(stage.assetId)
          || !stage.canonicalProfile || typeof stage.canonicalProfile !== 'object'
          || !stage.visibleProfile || typeof stage.visibleProfile !== 'object') {
          throw new Error('Building artwork progression has a level gap or missing canonical profile.');
        }
        nextLevel = stage.level + 1;
      }
      if (nextLevel !== progression.maxLevel + 1 || progression.stages.length !== progression.maxLevel) {
        throw new Error('Building artwork progression must cover exact levels 1 through ' + progression.maxLevel + '.');
      }
    }
  }
  return manifest;
}

let manifestRequest: Promise<AssetManifest> | null = null;
export function loadAssetManifest(): Promise<AssetManifest> {
  if (!manifestRequest) manifestRequest = fetch('/assets/manifest.json')
    .then(response => { if (!response.ok) throw new Error(`Asset manifest request failed (${response.status}).`); return response.json(); })
    .then(validateManifest)
    .catch(error => { manifestRequest = null; throw error; });
  return manifestRequest;
}

export function findAsset(manifest: AssetManifest | null, assetId: string): AssetManifestEntry | undefined {
  return manifest?.assets.find(asset => asset.assetId === assetId);
}

export function layerPath(asset: AssetManifestEntry | undefined, layer: keyof AssetLayerPaths, lod: 'close' | 'district' | 'regional' = 'close'): string | undefined {
  const candidate = asset?.lodVariants[lod]?.[layer] ?? asset?.layers[layer];
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
}

// Resolve visuals only. The simulation remains the authority on Fire level,
// footprint, heat radius, fuel and valid structure progression.
export function resolveSettlementAssetId(
  manifest: AssetManifest | null, sourceAssetId: string, fireLevel: number, isSurvivalFire: boolean,
  visualState?: 'damaged' | 'repaired',
  buildingLevel?: number,
): string {
  if (isSurvivalFire) {
    if (!manifest?.fireProgression || !Number.isInteger(fireLevel)) return sourceAssetId;
    return manifest.fireProgression.find(stage => fireLevel >= stage.minLevel && fireLevel <= stage.maxLevel)?.assetId ?? sourceAssetId;
  }
  let resolvedAssetId = sourceAssetId;
  if (sourceAssetId === 'lord-house-damaged') {
    if (visualState !== 'repaired') return sourceAssetId;
    if (findAsset(manifest, 'lord-house-repaired')) resolvedAssetId = 'lord-house-repaired';
  }
  if (typeof buildingLevel !== 'number' || !Number.isInteger(buildingLevel)) return resolvedAssetId;
  const progression = manifest?.buildingProgressions?.find(row => row.baseAssetIds.includes(resolvedAssetId));
  if (!progression || buildingLevel < 1) return resolvedAssetId;
  const exactLevel = Math.min(buildingLevel, progression.maxLevel);
  return progression.stages.find(stage => stage.level === exactLevel)?.assetId ?? resolvedAssetId;
}
