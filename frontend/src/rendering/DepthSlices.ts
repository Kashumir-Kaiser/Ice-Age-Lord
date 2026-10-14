import {projectBuildings} from './BuildingGeometry.ts';
import {artPolygon} from './SpriteRegistration.ts';
import {intersects} from './DepthOrder.ts';
import type {RenderBuilding} from './MapSceneAdapter.ts';
import type {WorldPoint} from '../territory/projection.ts';
import type {SceneLOD} from './mapStyle.ts';
import type {AssetManifestEntry} from '../assets/assetRegistry.ts';
type Slice=NonNullable<NonNullable<AssetManifestEntry['mapDepthSlices']>['north']>[number];
export type DepthNode=ReturnType<typeof projectBuildings>[number]&{entityId:string;slice?:Slice};

/** All parts retain their entity ID and full logical transform; only render-depth extents split. */
export function projectDepthNodes(buildings:readonly RenderBuilding[],project:(point:WorldPoint)=>WorldPoint,scale:number,size:{width:number;height:number},cull=true,lods?:Map<string,SceneLOD>,planning=false,projected?:ReturnType<typeof projectBuildings>):DepthNode[]{
 return (projected??projectBuildings(buildings,project,scale,size,false,lods)).flatMap<DepthNode>(b=>{
  const parts=planning||b.lod==='regional'?undefined:b.asset.mapDepthSlices?.[b.orientation];
  if(!parts?.length)return cull&&!intersects(b.bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16})?[]:[{...b,entityId:b.id,slice:undefined}];
  const turned=b.orientation==='east'||b.orientation==='west';
  return parts.flatMap(slice=>{
   const polygon=artPolygon(slice.hull,b.rect),bounds={minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minY:Math.min(...polygon.map(p=>p.y)),maxY:Math.max(...polygon.map(p=>p.y))};
   if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))return [];
   const footprint={...b.footprint},span=turned?footprint.maxY-footprint.minY:footprint.maxX-footprint.minX;
   if(turned){footprint.minY=b.point.y+slice.range[0]*span;footprint.maxY=b.point.y+slice.range[1]*span;}
   else{footprint.minX=b.point.x+slice.range[0]*span;footprint.maxX=b.point.x+slice.range[1]*span;}
   const depth=project({x:(footprint.minX+footprint.maxX)/2,y:(footprint.minY+footprint.maxY)/2}).y;
   return [{...b,id:b.id+':slice:'+slice.id,entityId:b.id,slice,bounds,footprint,depth}];
  });
 });
}
