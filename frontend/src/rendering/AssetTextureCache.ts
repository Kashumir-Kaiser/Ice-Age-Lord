import { Texture, Rectangle } from 'pixi.js';
import type { AssetManifestEntry, MapEffectsAtlas } from '../assets/assetRegistry.ts';
import type { CompositionLayer } from './SpriteRegistration.ts';
import {trimmedRect,type SpriteRect} from './SpriteRegistration.ts';
import {flameKey} from './FlamePresentation.ts';
import {mapEffectFrameKey,mapEffectSnowKey} from './MapEffects.ts';
export function exportPath(asset:AssetManifestEntry,layer:CompositionLayer,lod:'close'|'district'):string {
  return asset.mapExports?.find(e=>e.role===layer.role&&e.lod===lod&&(e.layerPath??e.source)===layer.path)?.path??layer.path;
}
type CachedImage=HTMLImageElement|HTMLCanvasElement;
type Entry={refs:number;image:CachedImage|null;texture:Texture|null;request:Promise<CachedImage>;bytes:number;reservedBytes:number;controller:AbortController;loadingImage:HTMLImageElement|null;loadStartedAt:number;attemptStartedAt:number;loadAttempt:number;watchdogDeadline:number|null;state:'pending'|'ready'|'failed'};
function imageBytes(image:CachedImage):number {
  const width='naturalWidth' in image?image.naturalWidth:image.width,height='naturalHeight' in image?image.naturalHeight:image.height;
  return width*height*4;
}
function disposeImage(image:CachedImage):void {
  if('src' in image){image.onload=image.onerror=null;image.src='';}
  else image.width=image.height=0;
}
/** Per-path ownership permits multiple hosts without one destroying another's texture. */
const shared=new Map<string,Entry>();
export class AssetTextureCache {
  private owned=new Set<string>();
  private registrations=new Map<string,{path:string;x:number;y:number;width:number;height:number}>();
  private frames=new Map<string,Texture>();
  private trims=new Map<string,SpriteRect>();
  private revisions=new Map<string,string>();
  private urlRevisionValue=0;
  get urlRevision():number{return this.urlRevisionValue;}
  private failed=new Set<string>();
  private registered=new WeakMap<AssetManifestEntry,{useAtlas:boolean;maxTextureSize:number}>();
  private revision(path:string,hash:string|undefined):void{
    if(!hash)return;
    const previous=this.revisions.get(path);
    if(previous!==hash){
      this.urlRevisionValue++;
      if(previous)for(const [key,texture] of this.frames)if((this.registrations.get(key)?.path??key)===path){texture.destroy(false);this.frames.delete(key);}
    }
    this.revisions.set(path,hash);
  }
  private estimates=new Map<string,number>();
  private rejected=new Set<string>();
  maxTextureSize=2048;
  registerEnvironment(entries:readonly {path:string;sha256:string;width:number;height:number}[]):void{
    for(const entry of entries){this.revision(entry.path,entry.sha256);this.estimates.set(entry.path,entry.width*entry.height*4);}
  }
  registerMapEffects(atlas:MapEffectsAtlas|undefined):void{
    if(!atlas)return;
    this.revision(atlas.path,atlas.sha256);this.estimates.set(atlas.path,atlas.width*atlas.height*4);
    this.registrations.set(mapEffectSnowKey(atlas.path),{path:atlas.path,...atlas.regions.snow.frame});
    for(const [kind,region] of [['ember',atlas.regions.ember],['smoke',atlas.regions.smoke]] as const)
      for(let i=0;i<region.frames.length;i++)this.registrations.set(mapEffectFrameKey(atlas.path,kind,i),{path:atlas.path,...region.frames[i]});
  }
  register(asset:AssetManifestEntry,useAtlas=true):void{
    const cached=this.registered.get(asset);
    if(cached?.useAtlas===useAtlas&&cached.maxTextureSize===this.maxTextureSize)return;
    this.registered.set(asset,{useAtlas,maxTextureSize:this.maxTextureSize});
    const flame=asset.mapFlame;
    if(flame&&flame.width<=this.maxTextureSize&&flame.height<=this.maxTextureSize){
      this.revision(flame.path,flame.sha256);this.estimates.set(flame.path,flame.width*flame.height*4);
      for(let i=0;i<flame.frames.length;i++)this.registrations.set(flameKey(flame.path,i),{path:flame.path,...flame.frames[i]});
    }
    for(const path of Object.values({...asset.layers,...asset.mapLayers}))if(typeof path==='string')this.estimates.set(path,asset.logicalCanvas.width*asset.logicalCanvas.height*4);
    for(const entry of asset.mapExports??[]){
      if(asset.mapLayers&&Object.values(asset.mapLayers).includes(entry.source))this.revision(entry.source,entry.sourceSha256);
      this.revision(entry.path,entry.sha256);
      if(entry.atlas)this.revision(entry.atlas.path,entry.atlas.sha256);
      const canvas=entry.logicalCanvas??asset.logicalCanvas,trim=entry.trim;
      if(trim)this.trims.set(entry.path,{x:trim.x/canvas.width,y:trim.y/canvas.height,width:trim.width/canvas.width,height:trim.height/canvas.height});
      else this.trims.delete(entry.path);
      this.estimates.set(entry.path,entry.width*entry.height*4);
      const previous=this.registrations.get(entry.path),next=useAtlas&&entry.atlas&&!this.failed.has(this.url(entry.atlas.path))&&entry.atlas.atlasWidth<=this.maxTextureSize&&entry.atlas.atlasHeight<=this.maxTextureSize?entry.atlas:undefined;
      if(previous?.path!==next?.path){this.urlRevisionValue++;this.frames.get(entry.path)?.destroy(false);this.frames.delete(entry.path);}
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
  acquire(path:string):CachedImage|null {
    if(this.destroyed)return null;
    path=this.url(path);
    let e=shared.get(path);
    if(!this.owned.has(path)){
      const estimated=e?.reservedBytes??this.estimates.get(path.split('?')[0])??384*384*4;
      if(this.reservedBytes+estimated>this.limit){if(!this.rejected.has(path)){this.rejected.add(path);this.onBudget(path);}return null;}
      this.rejected.delete(path);
      if(!e){
        const controller=new AbortController();
        let entry:Entry|undefined,activeImage:HTMLImageElement|null=null;
        const loadStartedAt=performance.now();let attemptStartedAt=loadStartedAt;
        const request=new Promise<CachedImage>((resolve,reject)=>{
          let settled=false,attempt=0,timer:ReturnType<typeof setTimeout>|undefined,image:HTMLImageElement;
          const detach=()=>controller.signal.removeEventListener('abort',abort);
          const clearTimer=()=>{if(timer!==undefined){clearTimeout(timer);timer=undefined;}if(entry)entry.watchdogDeadline=null;};
          const finish=(value:CachedImage)=>{if(settled)return;settled=true;clearTimer();detach();image.onload=image.onerror=null;activeImage=null;if(entry)entry.loadingImage=null;resolve(value);};
          const fail=(error:Error,retryable=false)=>{
            if(settled)return;
            clearTimer();image.onload=image.onerror=null;disposeImage(image);activeImage=null;if(entry)entry.loadingImage=null;
            if(retryable&&attempt===0&&!controller.signal.aborted){attempt++;start();return;}
            settled=true;detach();reject(error);
          };
          const abort=()=>fail(new Error('Disposed '+path));
          const start=()=>{
            attemptStartedAt=performance.now();
            image=new Image();image.decoding='async';activeImage=image;if(entry){entry.loadingImage=image;entry.attemptStartedAt=attemptStartedAt;entry.loadAttempt=attempt+1;entry.watchdogDeadline=attemptStartedAt+15000;}
            timer=setTimeout(()=>fail(new Error('Timed out loading '+path+' after '+(attempt+1)+' attempt'+(attempt?'s':'')),true),15000);
            image.onload=()=>{
              if(!path.split(/[?#]/,1)[0].toLowerCase().endsWith('.svg')){finish(image);return;}
              let canvas:HTMLCanvasElement|null=null;
              try{
                canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
                const context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Canvas2D unavailable for '+path);
                context.drawImage(image,0,0);disposeImage(image);finish(canvas);
              }catch(error){if(canvas)canvas.width=canvas.height=0;fail(error instanceof Error?error:new Error(String(error)));}
            };
            image.onerror=()=>fail(new Error('Cannot decode '+path));
            image.src=path;
          };
          controller.signal.addEventListener('abort',abort,{once:true});start();
        });
        e={refs:0,image:null,texture:null,request,bytes:0,reservedBytes:estimated,controller,loadingImage:activeImage,loadStartedAt,attemptStartedAt,loadAttempt:1,watchdogDeadline:attemptStartedAt+15000,state:'pending'};entry=e;shared.set(path,e);
        const target=e;
        void request.then(value=>{target.loadingImage=null;target.state='ready';if(!target.refs)return;target.image=value;target.bytes=imageBytes(value);target.reservedBytes=target.bytes;}).catch(()=>{target.loadingImage=null;target.state='failed';target.reservedBytes=0;});
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
  /** Current blockers for opt-in map QA diagnostics; does not affect rendering or admission. */
  get readinessDiagnostics():{id:string;state:'loading'|'budget-deferred';refs:number;reservedBytes:number;browserComplete:boolean|null;naturalWidth:number|null;naturalHeight:number|null;attempt:number|null;elapsedMs:number|null;attemptAgeMs:number|null;watchdogArmed:boolean;watchdogRemainingMs:number|null}[]{
    const details:{id:string;state:'loading'|'budget-deferred';refs:number;reservedBytes:number;browserComplete:boolean|null;naturalWidth:number|null;naturalHeight:number|null;attempt:number|null;elapsedMs:number|null;attemptAgeMs:number|null;watchdogArmed:boolean;watchdogRemainingMs:number|null}[]=[];
    const now=performance.now();
    for(const path of this.owned){const entry=shared.get(path);if(entry?.state==='pending'){const image=entry.loadingImage,watchdogRemainingMs=entry.watchdogDeadline===null?null:entry.watchdogDeadline-now;details.push({id:path,state:'loading',refs:entry.refs,reservedBytes:entry.reservedBytes,browserComplete:image?.complete??null,naturalWidth:image?.naturalWidth??null,naturalHeight:image?.naturalHeight??null,attempt:entry.loadAttempt,elapsedMs:Math.max(0,now-entry.loadStartedAt),attemptAgeMs:Math.max(0,now-entry.attemptStartedAt),watchdogArmed:entry.watchdogDeadline!==null,watchdogRemainingMs});}}
    for(const path of this.rejected)details.push({id:path,state:'budget-deferred',refs:0,reservedBytes:this.estimates.get(path.split('?')[0])??0,browserComplete:null,naturalWidth:null,naturalHeight:null,attempt:null,elapsedMs:null,attemptAgeMs:null,watchdogArmed:false,watchdogRemainingMs:null});
    return details.sort((a,b)=>a.id.localeCompare(b.id));
  }
  retain(paths:ReadonlySet<string>):void {
    const resolved=new Set(Array.from(paths).map(path=>this.url(path)));
    for(const path of this.rejected)if(!resolved.has(path))this.rejected.delete(path);
    let released=false;
    for(const path of this.owned)if(!resolved.has(path)){for(const [key,texture] of this.frames)if(this.url(key)===path){texture.destroy(false);this.frames.delete(key);}this.release(path);released=true;}
    if(released&&this.rejected.size)this.invalidate();
  }
  private release(path:string):void {
    const e=shared.get(path);this.owned.delete(path);if(!e||--e.refs>0)return;
    e.controller.abort();e.texture?.destroy(true);if(e.image)disposeImage(e.image);shared.delete(path);
  }
  destroy():void {if(this.destroyed)return;this.destroyed=true;for(const texture of this.frames.values())texture.destroy(false);this.frames.clear();this.registrations.clear();this.trims.clear();this.revisions.clear();this.failed.clear();for(const path of Array.from(this.owned))this.release(path);}
}
