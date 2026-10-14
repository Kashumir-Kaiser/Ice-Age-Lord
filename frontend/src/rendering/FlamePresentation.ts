import type { AssetManifestEntry } from '../assets/assetRegistry.ts';
import type { SpriteRect } from './SpriteRegistration.ts';
export function flameFrame(time:number,count:number,fps:number,reduced:boolean):number {
 return reduced?0:Math.floor(Math.max(0,time)*fps)%count;
}
export function flameRect(asset:AssetManifestEntry,body:SpriteRect):SpriteRect|null {
 const flame=asset.mapFlame;if(!flame)return null;
 const frame=flame.frames[0],width=body.width*flame.relativeWidth,height=width*frame.height/frame.width;
 return {x:body.x+body.width*flame.emitter.x-width*flame.anchor.x,y:body.y+body.height*flame.emitter.y-height*flame.anchor.y,width,height};
}
export const flameKey=(path:string,frame:number)=>path+'#flame-'+frame;
