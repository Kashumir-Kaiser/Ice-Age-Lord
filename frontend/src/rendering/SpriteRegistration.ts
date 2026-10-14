import type { AssetManifestEntry, AssetLayerPaths } from '../assets/assetRegistry.ts';
import type { WorldPoint } from '../territory/projection.ts';
export type Orientation = 'north' | 'east' | 'south' | 'west';
export type SpriteRect = { x: number; y: number; width: number; height: number };
const orientedAssets=new WeakMap<AssetManifestEntry,Map<Orientation,AssetManifestEntry>>();
const referenceSizes=new WeakMap<AssetManifestEntry,{width:number;height:number}>();
export function orientationAsset(asset:AssetManifestEntry,orientation:Orientation):AssetManifestEntry {
 const region=asset.orientationRegions?.[orientation];if(!region)return asset;
 let views=orientedAssets.get(asset);if(!views){views=new Map();orientedAssets.set(asset,views);}let view=views.get(orientation);if(!view){view={...asset,hitPolygon:region.hitPolygon,occlusionRegion:{upper:region.upper}};views.set(orientation,view);}return view;
}
/** Fixed reference from registered art, not the current orientation or building level. */
export function referenceSize(asset: AssetManifestEntry): { width: number; height: number } {
  const cached=referenceSizes.get(asset);if(cached)return cached;
  const span = Math.max(...asset.artFootprint.map(p => p[0])) - Math.min(...asset.artFootprint.map(p => p[0]));
  const physical = asset.compatiblePhysicalFootprint;
  const width = 2 * (physical.widthM + physical.depthM) / Math.max(.01, span) * (asset.presentationScale ?? 1);
  const size={ width, height: width * asset.logicalCanvas.height / asset.logicalCanvas.width };referenceSizes.set(asset,size);return size;
}
export function spriteRect(asset: AssetManifestEntry, ground: WorldPoint, pixelsPerMetre: number): SpriteRect {
  const ref = referenceSize(asset), width = ref.width * pixelsPerMetre, height = ref.height * pixelsPerMetre;
  return { x: ground.x - width * asset.groundAnchor.x + width * asset.trimOffset.x / asset.logicalCanvas.width,
    y: ground.y - height * asset.groundAnchor.y + height * asset.trimOffset.y / asset.logicalCanvas.height, width, height };
}
export function artPolygon(polygon: readonly (readonly [number,number])[], rect: SpriteRect): WorldPoint[] {
  return polygon.map(([x,y]) => ({ x: rect.x + x * rect.width, y: rect.y + y * rect.height }));
}
export function resolveOrientation(asset: AssetManifestEntry, orientation: Orientation): { layers: AssetLayerPaths; missing: boolean } {
  const authored = asset.orientationViews?.[orientation];
  if (authored) return { layers: authored, missing: false };
  if (asset.orientation === orientation || asset.equivalentOrientations?.includes(orientation)) return { layers: asset.layers, missing: false };
  return { layers: asset.layers, missing: true };
}
export type CompositionLayer = { role: 'shadow' | 'base' | 'upper' | 'body' | 'vfx'; path: string; alpha: number };
export function composition(asset: AssetManifestEntry, mode: 'normal' | 'focus' | 'planning', occludes: boolean, active: boolean, orientation: Orientation): CompositionLayer[] {
  const { layers } = resolveOrientation(asset, orientation), result: CompositionLayer[] = [];
  const add = (role: CompositionLayer['role'], alpha = 1) => { const path = layers[role]; if (path) result.push({role,path,alpha}); };
  add('shadow');
  if (mode === 'planning') { if (asset.composition === 'architectural') add('base'); else if(asset.planningLayer)result.push({role:'base',path:asset.planningLayer,alpha:1}); return result; }
  const fade = mode === 'focus' && occludes ? .22 : 1;
  if (asset.composition === 'architectural') { add('base'); add('upper',fade); }
  else add('body',fade);
  if (active) add('vfx',fade);
  return result;
}
