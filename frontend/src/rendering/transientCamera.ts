import type { WorldPoint, TerritoryCamera } from '../territory/projection.ts';
import { worldToIso } from '../territory/projection.ts';
export function cameraOverlayTransform(previous:TerritoryCamera,next:TerritoryCamera,viewport:{width:number;height:number},projection:'territory'|'north-up'):string {
 const ratio=next.zoom/previous.zoom;
 let offset:WorldPoint;
 if(projection==='territory'){const a=worldToIso(previous),b=worldToIso(next),scale=3*next.zoom;offset={x:(a.x-b.x)*scale,y:(a.y-b.y)*scale};}
 else {const scale=viewport.height*next.zoom/172;offset={x:(previous.x-next.x)*scale,y:(previous.y-next.y)*scale};}
 return `translate(${viewport.width/2*(1-ratio)+offset.x} ${viewport.height/2*(1-ratio)+offset.y}) scale(${ratio})`;
}
