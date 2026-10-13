import type { WorldPoint } from '../territory/projection.ts';
export function pointerCSS(client: WorldPoint, bounds: { left: number; top: number; width: number; height: number }, viewport: {width:number;height:number}): WorldPoint {
  return { x: (client.x-bounds.left)*viewport.width/Math.max(1,bounds.width), y: (client.y-bounds.top)*viewport.height/Math.max(1,bounds.height) };
}
export function pointInPolygon(point: WorldPoint, polygon: readonly WorldPoint[]): boolean {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j],b=polygon[i],cross=(point.x-a.x)*(b.y-a.y)-(point.y-a.y)*(b.x-a.x);
    if(Math.abs(cross)<1e-7&&point.x>=Math.min(a.x,b.x)-1e-7&&point.x<=Math.max(a.x,b.x)+1e-7&&point.y>=Math.min(a.y,b.y)-1e-7&&point.y<=Math.max(a.y,b.y)+1e-7)return true;
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export type Pickable = { id: string; ground: readonly WorldPoint[]; silhouette: readonly WorldPoint[]; silhouettes?: readonly (readonly WorldPoint[])[]; selectable: boolean };
/** Items are back-to-front. No alpha readback or GPU dependency. */
export function pickStack(point: WorldPoint, objects: readonly Pickable[], planning: boolean): string[] {
  const art: string[]=[],ground: string[]=[];
  for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(!o.selectable)continue;
    if(!planning&&(pointInPolygon(point,o.silhouette)||o.silhouettes?.some(shape=>pointInPolygon(point,shape))))art.push(o.id);
    else if(pointInPolygon(point,o.ground))ground.push(o.id);
  }
  return [...art,...ground];
}
export function cyclePick(ids: readonly string[], selected: string|null): string|null {
  if(!ids.length)return null;return ids[(ids.indexOf(selected??'')+1)%ids.length];
}
