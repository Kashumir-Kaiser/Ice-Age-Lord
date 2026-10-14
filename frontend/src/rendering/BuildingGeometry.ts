import type { RenderBuilding } from './MapSceneAdapter.ts';
import type { WorldPoint } from '../territory/projection.ts';
import { spriteRect,orientationAsset } from './SpriteRegistration.ts';
import { intersects } from './DepthOrder.ts';
import {chooseLOD,type SceneLOD} from './mapStyle.ts';

/** Presentation state shared by canvas and picker; never saved or used for occupancy. */
export function buildingLOD(id:string,span:number,states?:Map<string,SceneLOD>):SceneLOD {
 const lod=chooseLOD(span,states?.get(id));states?.set(id,lod);return lod;
}
export function regionalRect(ground:WorldPoint){return {x:ground.x-6,y:ground.y-12,width:12,height:12};}
export function rectPolygon(rect:{x:number;y:number;width:number;height:number}):WorldPoint[]{
 return [{x:rect.x,y:rect.y},{x:rect.x+rect.width,y:rect.y},{x:rect.x+rect.width,y:rect.y+rect.height},{x:rect.x,y:rect.y+rect.height}];
}

/** Shared by scenery and picking so their culling, occupancy and depth agree. */
export function projectBuildings(buildings:readonly RenderBuilding[],project:(point:WorldPoint)=>WorldPoint,scale:number,size:{width:number;height:number},cull=true,lods?:Map<string,SceneLOD>) {
  return buildings.flatMap(building=>{
    if(!building.asset)return [];
    const asset=orientationAsset(building.asset,building.orientation);
    const ground=project(building.point),rect=spriteRect(asset,ground,scale);
    const lod=buildingLOD(building.id,2*(building.footprint.widthM+building.footprint.depthM)*scale,lods),symbol=regionalRect(ground);
    const bounds={minX:Math.min(rect.x,symbol.x),minY:Math.min(rect.y,symbol.y),maxX:Math.max(rect.x+rect.width,symbol.x+symbol.width),maxY:Math.max(rect.y+rect.height,symbol.y+symbol.height)};
    if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))return [];
    const turned=building.orientation==='east'||building.orientation==='west';
    const width=turned?building.footprint.depthM:building.footprint.widthM,depth=turned?building.footprint.widthM:building.footprint.depthM;
    return [{...building,asset,ground,rect,lod,symbol,bounds,depth:ground.y,footprint:{...building.footprint,minX:building.point.x-width/2,maxX:building.point.x+width/2,minY:building.point.y-depth/2,maxY:building.point.y+depth/2}}];
  });
}
