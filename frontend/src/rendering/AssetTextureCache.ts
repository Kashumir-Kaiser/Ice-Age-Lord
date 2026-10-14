import { Texture, Rectangle } from 'pixi.js';
import type { AssetManifestEntry } from '../assets/assetRegistry.ts';
import type { CompositionLayer } from './SpriteRegistration.ts';
import {trimmedRect,type SpriteRect} from './SpriteRegistration.ts';
import {flameKey} from './FlamePresentation.ts';
export function exportPath(asset:AssetManifestEntry,layer:CompositionLayer,lod:'close'|'district'):string {
  return asset.mapExports?.find(e=>e.role===layer.role&&e.lod===lod&&(e.layerPath??e.source)===layer.path)?.path??layer.path;
}
type Entry={refs:number;image:HTMLImageElement|null;texture:Texture|null;request:Promise<HTMLImageElement>;bytes:number;reservedBytes:number;controller:AbortController;state:'pending'|'ready'|'failed'};
/** Per-path ownership permits multiple hosts without one destroying another's texture. */
const shared=new Map<string,Entry>();
export class AssetTextureCache {
  private owned=new Set<string>();
  private registrations=new Map<string,{path:string;x:number;y:number;width:number;height:number}>();
  private frames=new Map<string,Texture>();
  private trims=new Map<string,SpriteRect>();
  private revisions=new Map<string,string>();
  private failed=new Set<string>();
  private registered=new WeakMap<AssetManifestEntry,{useAtlas:boolean;maxTextureSize:number}>();
  private revision(path:string,hash:string|undefined):void{
    if(!hash)return;
    const previous=this.revisions.get(path);
    if(previous&&previous!==hash)for(const [key,texture] of this.frames)if((this.registrations.get(key)?.path??key)===path){texture.destroy(false);this.frames.delete(key);}
    this.revisions.set(path,hash);
  }
  private estimates=new Map<string,number>();
  private rejected=new Set<string>();
  maxTextureSize=2048;
  register(asset:AssetManifestEntry,useAtlas=true):void{
    const cached=this.registered.get(asset);
    if(cached?.useAtlas===useAtlas&&cached.maxTextureSize===this.maxTextureSize)return;
    this.registered.set(asset,{useAtlas,maxTextureSize:this.maxTextureSize});
    const flame=asset.mapFlame;
    if(flame&&flame.width<=this.maxTextureSize&&flame.height<=this.maxTextureSize){
      this.revision(flame.path,flame.sha256);this.estimates.set(flame.path,flame.width*flame.height*4);
      for(let i=0;i<flame.frames.length;i++)this.registrations.set(flameKey(flame.path,i),{path:flame.path,...flame.frames[i]});
    }
    for(const path of Object.values(asset.layers))if(typeof path==='string')this.estimates.set(path,asset.logicalCanvas.width*asset.logicalCanvas.height*4);
    for(const entry of asset.mapExports??[]){
      this.revision(entry.path,entry.sha256);
      if(entry.atlas)this.revision(entry.atlas.path,entry.atlas.sha256);
      const canvas=entry.logicalCanvas??asset.logicalCanvas,trim=entry.trim;
      if(trim)this.trims.set(entry.path,{x:trim.x/canvas.width,y:trim.y/canvas.height,width:trim.width/canvas.width,height:trim.height/canvas.height});
      else this.trims.delete(entry.path);
      this.estimates.set(entry.path,entry.width*entry.height*4);
      const previous=this.registrations.get(entry.path),next=useAtlas&&entry.atlas&&!this.failed.has(this.url(entry.atlas.path))&&entry.atlas.atlasWidth<=this.maxTextureSize&&entry.atlas.atlasHeight<=this.maxTextureSize?entry.atlas:undefined;
      if(previous?.path!==next?.path){this.frames.get(entry.path)?.destroy(false);this.frames.delete(entry.path);}
      if(next){this.registrations.set(entry.path,next);this.estimates.set(next.path,next.atlasWidth*next.atlasHeight*4);}
      else this.registrations.delete(entry.path);
    }
  }
  url(path:string):string{const file=this.registrations.get(path)?.path??path,hash=this.revisions.get(file);return hash?file+'?mapHash='+hash:file;}
  frame(path:string):{x:number;y:number;width:number;height:number}|undefined{return this.registrations.get(path);}
  rect(path:string,logical:SpriteRect):SpriteRect{const trim=this.trims.get(path);return trim?trimmedRect(logical,trim):logical;}
  private destroyed=false;
  readonly invalidate:()=>void;
  readonly onError:(path:string)=>void;
  private readonly onBudget:(path:string)=>void;
  private byteLimit:number;
  get limit():number{return this.byteLimit;}
  set limit(value:number){this.byteLimit=Math.max(0,value);this.enforceBudget();}
  private enforceBudget():void {
    let released=false;
    while(this.reservedBytes>this.byteLimit&&this.owned.size){const path=this.owned.values().next().value!;for(const [key,texture] of this.frames)if(this.url(key)===path){texture.destroy(false);this.frames.delete(key);}this.release(path);released=true;}
    if(released)this.invalidate();
  }
  constructor(invalidate:()=>void,onError:(path:string)=>void,limit:number,onBudget:(path:string)=>void=()=>{}){this.invalidate=invalidate;this.onError=onError;this.byteLimit=limit;this.onBudget=onBudget;}
  acquire(path:string):HTMLImageElement|null {
    if(this.destroyed)return null;
    path=this.url(path);
    let e=shared.get(path);
    if(!this.owned.has(path)){
      const estimated=e?.reservedBytes??this.estimates.get(path.split('?')[0])??384*384*4;
      if(this.reservedBytes+estimated>this.limit){if(!this.rejected.has(path)){this.rejected.add(path);this.onBudget(path);}return null;}
      this.rejected.delete(path);
      if(!e){
        const image=new Image(),controller=new AbortController();image.decoding='async';
        const request=new Promise<HTMLImageElement>((resolve,reject)=>{
          image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Cannot decode '+path));
          controller.signal.addEventListener('abort',()=>{image.onload=image.onerror=null;image.src='';reject(new Error('Disposed '+path));},{once:true});image.src=path;
        });
        e={refs:0,image:null,texture:null,request,bytes:0,reservedBytes:estimated,controller,state:'pending'};shared.set(path,e);
        const target=e;
        void request.then(value=>{target.state='ready';if(!target.refs)return;target.image=value;target.bytes=value.naturalWidth*value.naturalHeight*4;target.reservedBytes=target.bytes;}).catch(()=>{target.state='failed';target.reservedBytes=0;});
      }
      e.refs++;this.owned.add(path);
      // Another host can finish a shared load without this host owning its callback.
      const ownerEntry=e;
      const stillOwned=()=>!this.destroyed&&this.owned.has(path)&&shared.get(path)===ownerEntry;
      void e.request.then(()=>{if(stillOwned()){this.enforceBudget();this.invalidate();}}).catch(()=>{if(stillOwned()){this.failed.add(path);this.registered=new WeakMap();this.onError(path);}});
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
  get reservedBytes():number {let n=0;for(const path of this.owned)n+=shared.get(path)?.reservedBytes??0;return n;}
  get gpuBytes():number {let n=0;for(const path of this.owned){const entry=shared.get(path);if(entry?.texture)n+=entry.bytes;}return n;}
  get pending():number {let n=0;for(const path of this.owned)if(shared.get(path)?.state==='pending')n++;return n;}
  get deferred():number{return this.rejected.size;}
  retain(paths:ReadonlySet<string>):void {
    const resolved=new Set(Array.from(paths).map(path=>this.url(path)));
    for(const path of this.rejected)if(!resolved.has(path))this.rejected.delete(path);
    let released=false;
    for(const path of this.owned)if(!resolved.has(path)){for(const [key,texture] of this.frames)if(this.url(key)===path){texture.destroy(false);this.frames.delete(key);}this.release(path);released=true;}
    if(released&&this.rejected.size)this.invalidate();
  }
  private release(path:string):void {
    const e=shared.get(path);this.owned.delete(path);if(!e||--e.refs>0)return;
    e.controller.abort();e.texture?.destroy(true);if(e.image){e.image.onload=e.image.onerror=null;e.image.src='';}shared.delete(path);
  }
  destroy():void {if(this.destroyed)return;this.destroyed=true;for(const texture of this.frames.values())texture.destroy(false);this.frames.clear();this.registrations.clear();this.trims.clear();this.revisions.clear();this.failed.clear();for(const path of Array.from(this.owned))this.release(path);}
}
