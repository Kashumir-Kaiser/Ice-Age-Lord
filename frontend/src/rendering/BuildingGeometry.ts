import type { RenderBuilding } from './MapSceneAdapter.ts';
import type { WorldPoint } from '../territory/projection.ts';
import { spriteRect,orientationAsset } from './SpriteRegistration.ts';
import { intersects } from './DepthOrder.ts';

/** Shared by scenery and picking so their culling, occupancy and depth agree. */
export function projectBuildings(buildings:readonly RenderBuilding[],project:(point:WorldPoint)=>WorldPoint,scale:number,size:{width:number;height:number},cull=true) {
  return buildings.flatMap(building=>{
    if(!building.asset)return [];
    const asset=orientationAsset(building.asset,building.orientation);
    const ground=project(building.point),rect=spriteRect(asset,ground,scale);
    const bounds={minX:rect.x,minY:rect.y,maxX:rect.x+rect.width,maxY:rect.y+rect.height};
    if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))return [];
    const turned=building.orientation==='east'||building.orientation==='west';
    const width=turned?building.footprint.depthM:building.footprint.widthM,depth=turned?building.footprint.widthM:building.footprint.depthM;
    return [{...building,asset,ground,rect,bounds,depth:ground.y,footprint:{...building.footprint,minX:building.point.x-width/2,maxX:building.point.x+width/2,minY:building.point.y-depth/2,maxY:building.point.y+depth/2}}];
  });
}
