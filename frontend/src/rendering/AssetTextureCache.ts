import { Texture, Rectangle } from 'pixi.js';
import type { AssetManifestEntry } from '../assets/assetRegistry.ts';
import type { CompositionLayer } from './SpriteRegistration.ts';
export function exportPath(asset:AssetManifestEntry,layer:CompositionLayer,lod:'close'|'district'):string {
  return asset.mapExports?.find(e=>e.role===layer.role&&e.lod===lod&&e.orientation===asset.orientation)?.path??layer.path;
}
type Entry={refs:number;image:HTMLImageElement|null;texture:Texture|null;request:Promise<HTMLImageElement>;bytes:number;controller:AbortController};
/** Per-path ownership permits multiple hosts without one destroying another's texture. */
const shared=new Map<string,Entry>();
export class AssetTextureCache {
  private owned=new Set<string>();
  private registrations=new Map<string,{path:string;x:number;y:number;width:number;height:number}>();
  private frames=new Map<string,Texture>();
  register(asset:AssetManifestEntry):void{for(const e of asset.mapExports??[])if(e.atlas)this.registrations.set(e.path,e.atlas);}
  url(path:string):string{return this.registrations.get(path)?.path??path;}
  frame(path:string):{x:number;y:number;width:number;height:number}|undefined{return this.registrations.get(path);}
  private destroyed=false;
  constructor(readonly invalidate:()=>void,readonly onError:(path:string)=>void,readonly limit:number){}
  acquire(path:string):HTMLImageElement|null {
    if(this.destroyed)return null;
    path=this.url(path);
    let e=shared.get(path);
    if(!this.owned.has(path)){
      if(!e){
        const image=new Image(),controller=new AbortController();image.decoding='async';
        const request=new Promise<HTMLImageElement>((resolve,reject)=>{
          image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Cannot decode '+path));
          controller.signal.addEventListener('abort',()=>{image.onload=image.onerror=null;image.src='';reject(new Error('Disposed '+path));},{once:true});image.src=path;
        });
        e={refs:0,image:null,texture:null,request,bytes:0,controller};shared.set(path,e);
        const target=e;
        void request.then(value=>{if(!target.refs)return;target.image=value;target.bytes=value.naturalWidth*value.naturalHeight*4;this.invalidate();}).catch(()=>{if(!this.destroyed)this.onError(path);});
      }
      e.refs++;this.owned.add(path);
      // Another host can finish a shared load without this host owning its callback.
      void e.request.then(()=>{if(!this.destroyed)this.invalidate();}).catch(()=>{});
    }
    return e?.image??null;
  }
  texture(path:string):Texture|null {
    const image=this.acquire(path),e=shared.get(this.url(path));if(!image||!e)return null;
    if(!e.texture)e.texture=Texture.from(image);
    const frame=this.registrations.get(path);if(!frame)return e.texture;
    let texture=this.frames.get(path);if(!texture){texture=new Texture({source:e.texture.source,frame:new Rectangle(frame.x,frame.y,frame.width,frame.height)});this.frames.set(path,texture);}return texture;
  }
  get bytes():number {let n=0;for(const path of this.owned)n+=shared.get(path)?.bytes??0;return n;}
  retain(paths:ReadonlySet<string>):void {
    const resolved=new Set(Array.from(paths).map(path=>this.url(path)));
    for(const path of this.owned)if(!resolved.has(path)){for(const [key,texture] of this.frames)if(this.url(key)===path){texture.destroy(false);this.frames.delete(key);}this.release(path);}
  }
  private release(path:string):void {
    const e=shared.get(path);this.owned.delete(path);if(!e||--e.refs>0)return;
    e.controller.abort();e.texture?.destroy(true);if(e.image){e.image.onload=e.image.onerror=null;e.image.src='';}shared.delete(path);
  }
  destroy():void {if(this.destroyed)return;this.destroyed=true;for(const texture of this.frames.values())texture.destroy(false);this.frames.clear();this.registrations.clear();for(const path of Array.from(this.owned))this.release(path);}
}
