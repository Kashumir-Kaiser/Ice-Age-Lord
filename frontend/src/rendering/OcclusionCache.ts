import type {WorldPoint} from '../territory/projection.ts';

/**
 * Memoizes selected-object occlusion decisions while the world-space building
 * geometry and selected target are unchanged. Camera pan and zoom apply affine
 * transforms to both the target and registered silhouette, so the decision is
 * invariant across those camera-only frames.
 */
export function createOcclusionCache(){
 let buildings:readonly unknown[]|null=null,selectedId:string|null=null,targetX=NaN,targetY=NaN;
 const values=new Map<string,boolean>();
 return {
  get(rows:readonly unknown[],selected:string,target:WorldPoint,id:string,classify:()=>boolean):boolean{
   if(buildings!==rows||selectedId!==selected||targetX!==target.x||targetY!==target.y){
    buildings=rows;selectedId=selected;targetX=target.x;targetY=target.y;values.clear();
   }
   if(values.has(id))return values.get(id)!;
   const value=classify();values.set(id,value);return value;
  }
 };
}


/** Same screen-space ray cast as pointInPolygon(artPolygon(...)), without allocating vertices. */
export function pointInArtPolygon(point:WorldPoint,polygon:readonly (readonly [number,number])[],rect:{x:number;y:number;width:number;height:number}):boolean {
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [axn,ayn]=polygon[j],[bxn,byn]=polygon[i];
  const ax=rect.x+axn*rect.width,ay=rect.y+ayn*rect.height,bx=rect.x+bxn*rect.width,by=rect.y+byn*rect.height;
  const cross=(point.x-ax)*(by-ay)-(point.y-ay)*(bx-ax);
  if(Math.abs(cross)<1e-7&&point.x>=Math.min(ax,bx)-1e-7&&point.x<=Math.max(ax,bx)+1e-7&&point.y>=Math.min(ay,by)-1e-7&&point.y<=Math.max(ay,by)+1e-7)return true;
  if((ay>point.y)!==(by>point.y)&&point.x<(bx-ax)*(point.y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
