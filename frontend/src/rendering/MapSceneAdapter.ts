import type { AssetManifest, AssetManifestEntry } from '../assets/assetRegistry.ts';
import { findAsset, resolveSettlementAssetId } from '../assets/assetRegistry.ts';
import type { EntityView, LayoutDraft, SettlementView, VisibleMap } from '../game/GameClient.ts';
import type { TerritoryCamera, WorldPoint } from '../territory/projection.ts';
import type { CameraView } from '../map/camera.ts';
import type { Geography, TerrainRegion } from './TerrainSampler.ts';
import type { PlayerView as ApiPlayerView } from '../../../packages/contracts/src/index.ts';
import type { Orientation } from './SpriteRegistration.ts';
import type {SceneLOD} from './mapStyle.ts';
export type RenderBuilding = {id:string;name:string;point:WorldPoint;asset?:AssetManifestEntry;assetId:string;orientation:Orientation;footprint:{widthM:number;depthM:number};selected:boolean;active:boolean;draft:boolean;fixture?:boolean};
export type MapSnapshot = {identity:string;visualIdentity?:string;modeledInfill?:boolean;compact?:boolean;projection:'territory'|'north-up';camera:TerritoryCamera|CameraView;northExtent?:{width:number;height:number};regions?:readonly TerrainRegion[];buildings:readonly RenderBuilding[];buildingLODs?:Map<string,SceneLOD>;mode:'normal'|'focus'|'planning';geography?:Geography;entities:readonly EntityView[];world:boolean;revision:number};
export function territorySnapshot(settlement:SettlementView,manifest:AssetManifest|null,camera:TerritoryCamera,mode:MapSnapshot['mode'],selectedId:string|null,drafts:readonly LayoutDraft[]=[],terrain:{visualIdentity?:string;modeledInfill?:boolean;regions?:readonly TerrainRegion[]}={}):MapSnapshot {
  const buildings:RenderBuilding[]=settlement.buildings.map(b=>{
    const isFire=b.ref.id===settlement.fireRef.id,assetId=resolveSettlementAssetId(manifest,b.assetId,settlement.fireLevel,isFire,b.visualState,b.level);
    return {id:b.id,name:b.name,point:{x:settlement.worldOrigin.x+b.x,y:settlement.worldOrigin.y+b.y},asset:findAsset(manifest,assetId),assetId,orientation:b.orientation,footprint:b.footprint,selected:b.ref.id===selectedId,active:isFire&&settlement.fireActive,draft:false};
  });
  for(const d of drafts){const fixture=d.definitionId==='qa-dense-fixture';buildings.push({id:d.id,name:fixture?'Fixture QA':'Bản nháp',point:{x:settlement.worldOrigin.x+d.x,y:settlement.worldOrigin.y+d.y},asset:findAsset(manifest,d.assetId),assetId:d.assetId,orientation:d.orientation,footprint:d.footprint,selected:false,active:false,draft:!fixture,fixture});}
  return Object.freeze({identity:settlement.id,visualIdentity:terrain.visualIdentity??'LL01',modeledInfill:terrain.modeledInfill??true,regions:terrain.regions,projection:'territory',camera:{...camera},buildings,mode,entities:[],world:false,revision:0});
}
/** Unknown observations never reach rendering/picking/accessibility; remembered DTOs remain unchanged. */
export function permittedEntities(entities:readonly EntityView[]):EntityView[]{return entities.filter(e=>e.knowledge!=='unknown'&&Number.isFinite(e.x)&&Number.isFinite(e.y));}
export function explorationSnapshot(map:VisibleMap,camera:CameraView,world:boolean,compact=false):MapSnapshot {
  return Object.freeze({identity:'LL01',visualIdentity:'LL01',modeledInfill:true,compact,projection:'north-up',camera:{...camera},buildings:[],mode:'normal',geography:map.terrain,entities:permittedEntities(map.entities),world,revision:map.revision});
}

/** Only API-projected resource features; no database/world lookup. */
export function liveTerrainRegions(view:ApiPlayerView):readonly TerrainRegion[] {
  return view.visibleMap.resourceFeatures.flatMap(f=>{
    const kind=f.terrainKind==='forest'?'forest':f.terrainKind==='outcrop'?'rock':f.terrainKind==='frozen_water'?'ice':null;
    if(!kind)return [];
    const channel=kind==='forest'?'canopy':kind==='rock'?'rock_mass':'ice';
    return [{x:f.position.xMm/1000,y:f.position.yMm/1000,width:f.footprintMm.widthMm/1000,depth:f.footprintMm.depthMm/1000,kind:kind as 'forest'|'rock'|'ice',ratio:f.channels.find(c=>c.channel===channel)?.remainingRatio??1}];
  });
}
export function liveExplorationSnapshot(view:ApiPlayerView,center:{xMm:number;yMm:number},width:number,height:number):MapSnapshot {
  return Object.freeze({identity:view.saveId,visualIdentity:view.saveId,modeledInfill:false,projection:'north-up',camera:{x:center.xMm/1000,y:-center.yMm/1000,zoom:172/height},northExtent:{width,height},regions:liveTerrainRegions(view),buildings:[],entities:[],mode:'normal',world:height>22000,revision:view.revision});
}
