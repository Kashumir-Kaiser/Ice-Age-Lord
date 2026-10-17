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
