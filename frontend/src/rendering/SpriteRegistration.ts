import type { AssetManifestEntry, AssetLayerPaths } from '../assets/assetRegistry.ts';
import type { WorldPoint } from '../territory/projection.ts';
export type Orientation = 'north' | 'east' | 'south' | 'west';
export type SpriteRect = { x: number; y: number; width: number; height: number };
/** Crop offset is relative to the unchanged logical sprite, never to its world footprint. */
export function trimmedRect(rect:SpriteRect,trim:SpriteRect):SpriteRect {
 return {x:rect.x+rect.width*trim.x,y:rect.y+rect.height*trim.y,width:rect.width*trim.width,height:rect.height*trim.height};
}
const orientedAssets=new WeakMap<AssetManifestEntry,Map<Orientation,AssetManifestEntry>>();
const referenceSizes=new WeakMap<AssetManifestEntry,{width:number;height:number}>();
export function orientationAsset(asset:AssetManifestEntry,orientation:Orientation):AssetManifestEntry {
 const region=asset.orientationRegions?.[orientation]??asset.orientationRegions?.[asset.orientation as Orientation];if(!region)return asset;
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
  const layers={...asset.layers,...asset.mapLayers};
  if (asset.orientation === orientation || asset.equivalentOrientations?.includes(orientation)) return { layers, missing: false };
  return { layers:asset.orientationViews?.[asset.orientation as Orientation]??layers, missing: true };
}
export type CompositionLayer = { role: 'shadow' | 'base' | 'upper' | 'body' | 'vfx'; path: string; alpha: number };
export type ArchitecturalCompositePlan = {
  key: string; width: number; height: number;
  parts: { role: 'base' | 'upper'; path: string; x: number; y: number; width: number; height: number; alpha: number }[];
};
/** Resolve exact registered raster bounds for a reusable, static base/upper texture. */
export function architecturalCompositePlan(
  asset:AssetManifestEntry,layers:readonly CompositionLayer[],orientation:Orientation,lod:'close'|'district',entityAlpha=1,
):ArchitecturalCompositePlan|null {
  if(asset.composition!=='architectural'||asset.mapDepthSlices?.[orientation]?.length||!Number.isFinite(entityAlpha)||entityAlpha<0||entityAlpha>1)return null;
  const body=layers.filter(layer=>layer.role==='base'||layer.role==='upper');
  if(body.length!==2||body[0].role!=='base'||body[1].role!=='upper'||body[0].alpha!==body[1].alpha)return null;
  const logical=asset.logicalCanvas;
  if(!logical||![logical.width,logical.height].every(v=>Number.isFinite(v)&&v>0))return null;
  const entries=body.map(layer=>asset.mapExports?.find(entry=>entry.role===layer.role&&entry.lod===lod&&(entry.layerPath??entry.source)===layer.path));
  if(entries.some(entry=>!entry||entry.architecturePart!==true||!entry.rasterCanvas))return null;
  const [base,upper]=entries as NonNullable<typeof entries[number]>[];
  const raster=base.rasterCanvas!,otherRaster=upper.rasterCanvas!;
  const sameLogical=(entry:typeof base)=>{const canvas=entry.logicalCanvas??logical;return canvas.width===logical.width&&canvas.height===logical.height;};
  if(!sameLogical(base)||!sameLogical(upper)||raster.width!==otherRaster.width||raster.height!==otherRaster.height
    ||![raster.width,raster.height].every(v=>Number.isInteger(v)&&v>0))return null;
  const scaleX=raster.width/logical.width,scaleY=raster.height/logical.height;
  const parts=body.map((layer,index)=>{
    const entry=entries[index]!,trim=entry.trim;
    if(!trim||![trim.x,trim.y,trim.width,trim.height,entry.width,entry.height].every(Number.isFinite)
      ||trim.x<0||trim.y<0||trim.width<=0||trim.height<=0||trim.x+trim.width>logical.width+1||trim.y+trim.height>logical.height+1
      ||entry.width<=0||entry.height<=0||!Number.isInteger(entry.width)||!Number.isInteger(entry.height)
      ||Math.abs(entry.width-trim.width*scaleX)>1.1||Math.abs(entry.height-trim.height*scaleY)>1.1)return null;
    return {role:layer.role as 'base'|'upper',path:entry.path,x:trim.x*scaleX,y:trim.y*scaleY,
      width:entry.width,height:entry.height,alpha:layer.alpha*entityAlpha};
  });
  if(parts.some(part=>!part))return null;
  const resolved=parts as ArchitecturalCompositePlan['parts'];
  return {key:JSON.stringify({asset:asset.assetId,revision:asset.revision,orientation,lod,logical,raster,parts:resolved.map(part=>({...part,
    export:entries[part.role==='base'?0:1]!.sha256,atlas:entries[part.role==='base'?0:1]!.atlas?.sha256}))}),
    width:raster.width,height:raster.height,parts:resolved};
}
/** Per-frame memoizer for repeated, immutable sprite compositions. */
export function createCompositionCache(): (asset:AssetManifestEntry,mode:'normal'|'focus'|'planning',occludes:boolean,active:boolean,orientation:Orientation)=>CompositionLayer[] {
 const byAsset=new WeakMap<AssetManifestEntry,Map<string,CompositionLayer[]>>();
 return (asset,mode,occludes,active,orientation)=>{
  let entries=byAsset.get(asset);if(!entries){entries=new Map();byAsset.set(asset,entries);}
  const key=`${mode}:${Number(occludes)}:${Number(active)}:${orientation}`;
  let layers=entries.get(key);if(!layers){layers=composition(asset,mode,occludes,active,orientation);entries.set(key,layers);}
  return layers;
 };
}
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
