import {projectBuildings} from './BuildingGeometry.ts';
import {intersects} from './DepthOrder.ts';
import type {RenderBuilding} from './MapSceneAdapter.ts';
import type {WorldPoint} from '../territory/projection.ts';
import type {SceneLOD} from './mapStyle.ts';
import type {AssetManifestEntry} from '../assets/assetRegistry.ts';
type Slice=NonNullable<NonNullable<AssetManifestEntry['mapDepthSlices']>['north']>[number];
export type DepthNode=ReturnType<typeof projectBuildings>[number]&{entityId:string;slice?:Slice};
type NormalizedBounds={minX:number;minY:number;maxX:number;maxY:number};
const normalizedHullBoundsCache=new WeakMap<Slice,NormalizedBounds>();
function screenBounds(slice:Slice,rect:{x:number;y:number;width:number;height:number}):NormalizedBounds {
 let hullBounds=normalizedHullBoundsCache.get(slice);
 if(!hullBounds){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const [x,y] of slice.hull){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  hullBounds={minX,minY,maxX,maxY};normalizedHullBoundsCache.set(slice,hullBounds);
 }
 const x1=rect.x+hullBounds.minX*rect.width,x2=rect.x+hullBounds.maxX*rect.width;
 const y1=rect.y+hullBounds.minY*rect.height,y2=rect.y+hullBounds.maxY*rect.height;
 return {minX:Math.min(x1,x2),minY:Math.min(y1,y2),maxX:Math.max(x1,x2),maxY:Math.max(y1,y2)};
}

/** All parts retain their entity ID and full logical transform; only render-depth extents split. */
export function projectDepthNodes(buildings:readonly RenderBuilding[],project:(point:WorldPoint)=>WorldPoint,scale:number,size:{width:number;height:number},cull=true,lods?:Map<string,SceneLOD>,planning=false,projected?:ReturnType<typeof projectBuildings>):DepthNode[]{
 const result:DepthNode[]=[];
 for(const b of projected??projectBuildings(buildings,project,scale,size,false,lods)){
  const parts=planning||b.lod==='regional'?undefined:b.asset.mapDepthSlices?.[b.orientation];
  if(!parts?.length){if(!cull||intersects(b.bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))result.push({...b,entityId:b.id,slice:undefined});continue;}
  const turned=b.orientation==='east'||b.orientation==='west';
  for(const slice of parts){
   const bounds=screenBounds(slice,b.rect);
   if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))continue;
   const footprint={...b.footprint},span=turned?footprint.maxY-footprint.minY:footprint.maxX-footprint.minX;
   if(turned){footprint.minY=b.point.y+slice.range[0]*span;footprint.maxY=b.point.y+slice.range[1]*span;}
   else{footprint.minX=b.point.x+slice.range[0]*span;footprint.maxX=b.point.x+slice.range[1]*span;}
   const depth=project({x:(footprint.minX+footprint.maxX)/2,y:(footprint.minY+footprint.maxY)/2}).y;
   result.push({...b,id:b.id+':slice:'+slice.id,entityId:b.id,slice,bounds,footprint,depth});
  }
 }
 return result;
}
