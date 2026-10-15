import { Application, Container, Graphics, Matrix, Sprite, Texture } from 'pixi.js';
import type { MapSnapshot } from './MapSceneAdapter.ts';
import { TerrainSampler, GROUND_MATERIALS, chunkLevel, chunkCoverage, boundedChunkLevel } from './TerrainSampler.ts';
import { TerrainChunkCache } from './TerrainChunkCache.ts';
import type { TerrainChunk } from './TerrainChunkCache.ts';
import { AssetTextureCache, exportPath } from './AssetTextureCache.ts';
import { MapMetrics } from './MapMetrics.ts';
import { MapEffects } from './MapEffects.ts';
import { flameFrame, flameRect, flameKey } from './FlamePresentation.ts';
import { artPolygon, composition } from './SpriteRegistration.ts';
import { pointInPolygon } from './MapPicking.ts';
import { depthOrder } from './DepthOrder.ts';
import {projectDepthNodes} from './DepthSlices.ts';
import { projectBuildings } from './BuildingGeometry.ts';
import { MAP_PALETTE, QUALITY, LEDGE_SOURCES, AdaptiveQuality } from './mapStyle.ts';
import type { Quality, SceneLOD } from './mapStyle.ts';
import { screenToWorld, worldToScreen } from '../territory/projection.ts';
import { BASE_VIEW_HEIGHT_M } from '../map/camera.ts';
import type { WorldPoint } from '../territory/projection.ts';
type Size={width:number;height:number};
type Draw={id:string;path:string;x:number;y:number;width:number;height:number;alpha:number;matrix?:Matrix};
export class MapRenderer {
  private app:Application|null=null;
  private failures=new Set<string>();
  private draws=0;
  private restoreDrawCounters:(()=>void)|null=null;
  private context:CanvasRenderingContext2D|null=null;
  private stage=new Container();
  private effectsGraphics=new Graphics();
  private drawSprites=new Map<string,Sprite>();
  private chunkTextures=new Map<string,Texture>();
  private assets:AssetTextureCache;
  private terrain:TerrainChunkCache;
  private sampler:TerrainSampler;
  private snapshot:MapSnapshot;
  private size:Size={width:1,height:1};
  private raf=0;
  private inFrame=false;
  private idleSince=0;
  private cameraGesture=false;
  private destroyed=false;
  private dirty=true;
  private previous=0;
  private lastFrame=0;
  private level:number|undefined;
  private previousLevel:number|undefined;
  private transitionStart=0;
  private lod=new Map<string,SceneLOD>();
  private quality:Quality='normal';
  private renderDpr=1;
  private adaptive=new AdaptiveQuality();
  private readonly effects=new MapEffects(24);
  private reducedMotion=false;
  private preference:'auto'|Quality='auto';
  private hidden=false;
  private transferred=false;
  private visibleEmitter=false;
  private visibleEmitters:{point:WorldPoint;selected:boolean}[]=[];
  private depthBuildings:MapSnapshot['buildings']|null=null;
  private depthScale=0;
  private depthProjection:MapSnapshot['projection']|null=null;
  private depthPlanning=false;
  private depthIds:string[]=[];
  readonly metrics:MapMetrics;
  constructor(private canvas:HTMLCanvasElement,snapshot:MapSnapshot,private status:(backend:string)=>void,enabledMetrics=false){
    this.snapshot=snapshot;this.metrics=new MapMetrics(enabledMetrics);
    this.sampler=new TerrainSampler(snapshot.visualIdentity??snapshot.identity,snapshot.geography,snapshot.regions,snapshot.modeledInfill);
    this.terrain=new TerrainChunkCache(this.sampler,QUALITY.normal.terrainBytes,QUALITY.normal.textureSize,()=>this.invalidate());
    this.updateContacts(snapshot);
    this.assets=new AssetTextureCache(()=>this.invalidate(),path=>{this.failures.add(path);this.metrics.error('asset: '+path);this.invalidate();},QUALITY.normal.totalBytes-QUALITY.normal.terrainBytes);
  }
  async init(forceFallback=false):Promise<void>{
    if(this.destroyed)return;
    let initializing:Application|null=null;
    if(!forceFallback)try{
      const app=new Application();initializing=app;
      await app.init({canvas:this.canvas,preference:'webgl',autoStart:false,sharedTicker:false,background:MAP_PALETTE.snow,antialias:false,resolution:this.renderDpr,autoDensity:true,width:this.size.width,height:this.size.height});
      if(this.destroyed){app.destroy(false,{children:true,texture:false,textureSource:false});return;}
      this.app=app;
      const gl=(app.renderer as unknown as {gl?:WebGLRenderingContext}).gl;
      if(gl){this.assets.maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(this.metrics.enabled){const elements=gl.drawElements,arrays=gl.drawArrays;gl.drawElements=(...args)=>{this.draws++;elements.apply(gl,args);};gl.drawArrays=(...args)=>{this.draws++;arrays.apply(gl,args);};this.restoreDrawCounters=()=>{gl.drawElements=elements;gl.drawArrays=arrays;};}}
      app.stop();this.transferred=true;app.stage.addChild(this.stage,this.effectsGraphics);this.canvas.addEventListener('webglcontextlost',this.lost);
      this.metrics.data.backend='webgl';this.status('webgl');
    }catch(error){
      this.metrics.error('WebGL initialization: '+String(error));
      try{initializing?.destroy(false,{children:false,texture:false,textureSource:false});}catch{ /* Initialization can fail before Pixi creates a renderer. */ }
      this.app=null;forceFallback=true;
    }
    if(forceFallback){
      // A canvas that acquired WebGL cannot acquire 2D. Replace its element, preserving the host.
      const old=this.canvas,next=document.createElement('canvas');next.className=old.className;next.setAttribute('aria-hidden','true');old.replaceWith(next);this.canvas=next;
      this.context=next.getContext('2d',{alpha:false});if(!this.context)throw new Error('Canvas2D unavailable');this.metrics.data.backend='canvas2d';this.status('canvas2d');
    }
    this.resize(this.size);this.invalidate();
  }
  private lost=(event:Event)=>{event.preventDefault();this.metrics.error('WebGL context lost');this.stop();this.restoreDrawCounters?.();this.restoreDrawCounters=null;this.canvas.removeEventListener('webglcontextlost',this.lost);
    this.clearSprites();this.effectsGraphics.destroy();this.stage.destroy({children:true,texture:false,textureSource:false});
    this.app?.destroy(false,{children:false,texture:false,textureSource:false});this.app=null;this.effectsGraphics=new Graphics();this.stage=new Container();void this.init(true);
  };
  update(snapshot:MapSnapshot):void{
    if(this.destroyed)return;
    let rebuilt=false;
    if(snapshot.identity!==this.snapshot.identity||JSON.stringify([snapshot.visualIdentity,snapshot.modeledInfill,snapshot.geography,snapshot.regions])!==JSON.stringify([this.snapshot.visualIdentity,this.snapshot.modeledInfill,this.snapshot.geography,this.snapshot.regions])){
      this.terrain.destroy();this.sampler=new TerrainSampler(snapshot.visualIdentity??snapshot.identity,snapshot.geography,snapshot.regions,snapshot.modeledInfill);this.terrain=new TerrainChunkCache(this.sampler,QUALITY[this.quality].terrainBytes,QUALITY[this.quality].textureSize,()=>this.invalidate());this.level=undefined;
      rebuilt=true;
    }
    if(rebuilt||snapshot.buildings!==this.snapshot.buildings){this.updateContacts(snapshot);const ids=new Set(snapshot.buildings.map(b=>b.id)),lods=snapshot.buildingLODs??this.lod;for(const id of lods.keys())if(!ids.has(id))lods.delete(id);}
    this.snapshot=snapshot;this.invalidate();
  }
  private updateContacts(snapshot:MapSnapshot):void {
    const contacts=snapshot.buildings.filter(b=>!b.draft&&!b.fixture&&b.asset).map(b=>{const turned=b.orientation==='east'||b.orientation==='west';return {id:b.id,x:b.point.x,y:b.point.y,width:turned?b.footprint.depthM:b.footprint.widthM,depth:turned?b.footprint.widthM:b.footprint.depthM};});
    this.terrain.invalidateBounds(this.sampler.contacts.update(contacts));
  }
  configure(preference:'auto'|Quality,reduced:boolean):void{this.preference=preference;this.reducedMotion=reduced;if(preference!=='auto')this.setQuality(preference);this.invalidate();}
  setCameraGesture(active:boolean):void{this.cameraGesture=active;}
  resize(size:Size):void{
    this.size={width:Math.max(1,size.width),height:Math.max(1,size.height)};
    const dpr=Math.min(devicePixelRatio||1,QUALITY[this.quality].dpr,Math.sqrt(QUALITY[this.quality].totalBytes*.2/(this.size.width*this.size.height*8)));this.renderDpr=dpr;
    this.assets.limit=QUALITY[this.quality].totalBytes-QUALITY[this.quality].terrainBytes-this.renderTargetBytes();
    if(this.app){this.app.renderer.resolution=dpr;this.app.renderer.resize(this.size.width,this.size.height);}
    else if(this.context){this.canvas.width=Math.ceil(this.size.width*dpr);this.canvas.height=Math.ceil(this.size.height*dpr);this.canvas.style.width=this.size.width+'px';this.canvas.style.height=this.size.height+'px';}
    this.invalidate();
  }
  setHidden(hidden:boolean):void{this.hidden=hidden;if(hidden)this.stop();else{this.previous=0;this.invalidate();}}
  invalidate():void{if(this.destroyed)return;this.dirty=true;if(!this.inFrame)this.schedule();}
  private schedule():void{if(!this.raf&&!this.hidden&&!this.destroyed){if(!this.cameraGesture&&!this.metrics.data.activeLoops&&performance.now()-this.idleSince>150){this.lastFrame=0;this.metrics.resetClock();this.adaptive.resetObservation();}this.metrics.data.activeLoops=1;this.raf=requestAnimationFrame(this.frame);}}
  private stop():void{if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.metrics.data.activeLoops=0;this.lastFrame=0;this.idleSince=performance.now();this.metrics.resetClock();}
  private setQuality(quality:Quality):void{if(quality===this.quality)return;this.quality=quality;this.assets.limit=QUALITY[quality].totalBytes-QUALITY[quality].terrainBytes;this.terrain.size=QUALITY[quality].textureSize;this.terrain.limit=QUALITY[quality].terrainBytes;this.terrain.invalidate();this.resize(this.size);}
  private project=(p:WorldPoint):WorldPoint=>{
    if(this.snapshot.projection==='territory')return worldToScreen(p,this.snapshot.camera,this.size);
    const sy=this.scale(),sx=this.snapshot.northExtent?this.size.width/this.snapshot.northExtent.width:sy;
    return {x:this.size.width/2+(p.x-this.snapshot.camera.x)*sx,y:this.size.height/2+(-p.y-this.snapshot.camera.y)*sy};
  };
  private inverse=(p:WorldPoint):WorldPoint=>{
    if(this.snapshot.projection==='territory')return screenToWorld(p,this.snapshot.camera,this.size);
    const sy=this.scale(),sx=this.snapshot.northExtent?this.size.width/this.snapshot.northExtent.width:sy;return {x:this.snapshot.camera.x+(p.x-this.size.width/2)/sx,y:-this.snapshot.camera.y-(p.y-this.size.height/2)/sy};
  };
  private scale():number{return this.snapshot.projection==='territory'?3*this.snapshot.camera.zoom:this.size.height*this.snapshot.camera.zoom/BASE_VIEW_HEIGHT_M;}
  private motionActive():boolean{return !this.reducedMotion&&this.snapshot.mode!=='planning'&&this.visibleEmitter&&Boolean(this.app);}
  private renderTargetBytes():number{return Math.ceil(this.size.width*this.size.height*this.renderDpr**2*8);}
  private frame=(time:number)=>{
    this.raf=0;if(this.destroyed||this.hidden)return;
    this.inFrame=true;
    try{
    const active=this.motionActive();
    const pending=this.terrain.pending>0||this.previousLevel!==undefined;
    if(time-this.lastFrame>=1000/QUALITY[this.quality].fps-1){
      const start=performance.now(),generated=this.terrain.process();
      if(this.dirty||generated||active||this.previousLevel!==undefined){
        const interval=this.lastFrame?time-this.lastFrame:0;
        this.dirty=false;this.effects.update((time-this.previous)/1000,this.reducedMotion);this.render();this.metrics.frame(start);this.lastFrame=time;
        if(interval>0)this.setQuality(this.adaptive.update(interval,Math.min(interval,1000),this.preference==='auto'?undefined:this.preference));
        else this.adaptive.resetObservation();
      }
      this.previous=time;
    }
    if(this.motionActive()||pending||this.terrain.pending||this.dirty||this.previousLevel!==undefined){this.inFrame=false;this.schedule();}else {this.metrics.data.activeLoops=0;this.idleSince=performance.now();}
    }finally{this.inFrame=false;}
  };
  private render():void{
    const scale=this.scale(),corners=[this.inverse({x:0,y:0}),this.inverse({x:this.size.width,y:0}),this.inverse({x:0,y:this.size.height}),this.inverse({x:this.size.width,y:this.size.height})];
    const bounds={minX:Math.min(...corners.map(p=>p.x)),maxX:Math.max(...corners.map(p=>p.x)),minY:Math.min(...corners.map(p=>p.y)),maxY:Math.max(...corners.map(p=>p.y))};
    const slots=Math.max(1,Math.floor(this.terrain.limit/(this.terrain.size*this.terrain.size*4)));
    const wanted=boundedChunkLevel(chunkLevel(scale*(this.snapshot.projection==='territory'?3:1),this.level),bounds,slots);
    this.level??=wanted;
    // A fit/world jump can span thousands of close-up chunks. Switch its request
    // scale immediately rather than traversing that grid while coarse chunks load.
    if(wanted!==this.level&&(Math.abs(wanted-this.level)>1||chunkCoverage(bounds,this.level)+chunkCoverage(bounds,wanted)>slots)){this.terrain.clearQueued();this.level=wanted;this.previousLevel=undefined;}
    if(wanted!==this.level){
      const nextSpan=64*2**wanted;let ready=true;
      for(let y=Math.floor(bounds.minY/nextSpan);y<=Math.floor(bounds.maxY/nextSpan);y++)for(let x=Math.floor(bounds.minX/nextSpan);x<=Math.floor(bounds.maxX/nextSpan);x++){this.terrain.request(x,y,wanted);if(!this.terrain.get(x,y,wanted))ready=false;}
      if(ready){this.previousLevel=this.reducedMotion?undefined:this.level;this.level=wanted;this.transitionStart=performance.now();}
    }
    const currentLevel=this.level,span=64*2**currentLevel,draws:Draw[]=[],used=new Set<string>();
    const progress=this.previousLevel===undefined?1:Math.min(1,(performance.now()-this.transitionStart)/150);
    if(this.previousLevel!==undefined&&progress<1){const oldSpan=64*2**this.previousLevel;
      for(let y=Math.floor(bounds.minY/oldSpan);y<=Math.floor(bounds.maxY/oldSpan);y++)for(let x=Math.floor(bounds.minX/oldSpan);x<=Math.floor(bounds.maxX/oldSpan);x++){const c=this.terrain.get(x,y,this.previousLevel);if(c)draws.push({...this.groundDraw(c),alpha:1-progress});}
    }else this.previousLevel=undefined;
    this.terrain.retainLevels(new Set(this.previousLevel===undefined?[currentLevel,wanted]:[currentLevel,wanted,this.previousLevel]));
    let paintChanged=false;
    if(currentLevel<=2)for(const name of GROUND_MATERIALS){const path='/assets/map/terrain/'+name+'.webp',paint=this.assets.acquire(path);used.add(path);if(paint&&this.terrain.paints.get(name)!==paint){this.terrain.paints.set(name,paint);paintChanged=true;}}
    else this.terrain.paints.clear();
    if(paintChanged)this.terrain.invalidate();
    for(let y=Math.floor(bounds.minY/span);y<=Math.floor(bounds.maxY/span);y++)for(let x=Math.floor(bounds.minX/span);x<=Math.floor(bounds.maxX/span);x++){
      this.terrain.request(x,y,this.level);const chunk=this.terrain.get(x,y,this.level);if(chunk)draws.push({...this.groundDraw(chunk),alpha:progress});
    }
    // Bounded one-chunk prefetch ring; visible requests are queued first.
    const x0=Math.floor(bounds.minX/span)-1,x1=Math.floor(bounds.maxX/span)+1,y0=Math.floor(bounds.minY/span)-1,y1=Math.floor(bounds.maxY/span)+1;
    let prefetched=0;
    const prefetchLimit=wanted===this.level&&this.previousLevel===undefined?Math.max(0,slots-chunkCoverage(bounds,this.level)):0;
    const prefetch=(x:number,y:number)=>{if(prefetched<prefetchLimit){this.terrain.request(x,y,currentLevel);prefetched++;}};
    for(let x=x0;x<=x1;x++){prefetch(x,y0);prefetch(x,y1);}for(let y=y0+1;y<y1;y++){prefetch(x0,y);prefetch(x1,y);}
    if(this.snapshot.projection==='north-up')for(const patch of this.sampler.relief(bounds,1/scale)){
      const center=this.project(patch),width=patch.width*(this.snapshot.northExtent?this.size.width/this.snapshot.northExtent.width:scale),height=patch.depth*scale;
      draws.push({id:'relief:'+patch.id,path:'/assets/map/terrain/'+patch.kind+'-'+String(patch.variant+1).padStart(2,'0')+'.png',x:center.x-width/2,y:center.y-height/2,width,height,alpha:.75});
    }
    const selected=this.snapshot.buildings.find(b=>b.selected),target=selected?this.project(selected.point):null;
    const buildingObjects=projectBuildings(this.snapshot.buildings,this.project,scale,this.size,true,this.snapshot.buildingLODs??this.lod);
    this.visibleEmitter=false;this.visibleEmitters=[];
    const planning=this.snapshot.mode==='planning',nodes=projectDepthNodes(this.snapshot.buildings,this.project,scale,this.size,true,this.snapshot.buildingLODs??this.lod,planning,buildingObjects);
    if(this.depthBuildings!==this.snapshot.buildings||this.depthScale!==scale||this.depthProjection!==this.snapshot.projection||this.depthPlanning!==planning){
      const ordered=depthOrder(projectDepthNodes(this.snapshot.buildings,this.project,scale,this.size,false,this.snapshot.buildingLODs??this.lod,planning));
      this.depthIds=ordered.objects.map(b=>b.id);this.depthBuildings=this.snapshot.buildings;this.depthScale=scale;this.depthProjection=this.snapshot.projection;
      this.depthPlanning=planning;
      if(ordered.cycles.length)this.metrics.error('depth cycle: '+ordered.cycles.join(','));
    }
    const visibleById=new Map(nodes.map(b=>[b.id,b]));
    const distinctAssets=new Set(buildingObjects.map(b=>b.assetId)).size,environmentReserve=12*1048576;
    const preferDistrict=this.quality==='low'||distinctAssets*4*1048576+environmentReserve>this.assets.limit;
    const useAtlas=this.quality!=='low'&&distinctAssets*1048576+environmentReserve<=this.assets.limit;
    const propBounds={minX:bounds.minX-20,maxX:bounds.maxX+20,minY:bounds.minY-20,maxY:bounds.maxY+20};
    const worldProps=this.snapshot.mode==='planning'?[]:this.sampler.props(propBounds,1/scale).filter(p=>!this.snapshot.buildings.some(b=>{const turned=b.orientation==='east'||b.orientation==='west',width=turned?b.footprint.depthM:b.footprint.widthM,depth=turned?b.footprint.widthM:b.footprint.depthM;return Math.abs(b.point.x-p.x)<width/2+p.size&&Math.abs(b.point.y-p.y)<depth/2+p.size;}));
    const props=worldProps.map(p=>{
      const tree=p.kind==='conifer'||p.kind==='bare',ground=this.project(p),name=p.kind==='ledge'?LEDGE_SOURCES[p.variant%4]:p.kind+'-'+String(p.variant%(p.kind==='conifer'?6:p.kind==='bare'?3:8)+1).padStart(2,'0'),path='/assets/map/terrain/'+name+'.png';
      const image=this.assets.acquire(path),height=p.size*scale*(tree?1.8:.6);
      const width=height*(image?image.naturalWidth/image.naturalHeight:tree?.65:1.9);
      return {id:'prop:'+p.id,path,x:ground.x-width/2,y:ground.y-height*.94,width,height,alpha:1,depth:ground.y};
    });
    // Contact/cast shadows lie on the ground below every upright object.
    for(const b of buildingObjects){const asset=b.asset!;this.assets.register(asset,useAtlas);for(const layer of composition(asset,this.snapshot.mode,false,b.active,b.orientation))if(layer.role==='shadow'){
      const exported=exportPath(asset,layer,preferDistrict?'district':'close'),path=(this.failures.has(exported)||this.failures.has(this.assets.url(exported)))?(asset.layers[layer.role]??layer.path):exported;
      draws.push({id:b.id+':shadow',path,...b.rect,alpha:layer.alpha*(b.draft?.55:1)});
    }}
    // Architectural order from the partial order is preserved; props are inserted by their ground depths.
    let propIndex=0;const sortedProps=props.sort((a,b)=>a.depth-b.depth||a.id.localeCompare(b.id));
    const drawBuilding=(b:typeof nodes[number])=>{
      const asset=b.asset!;this.assets.register(asset,useAtlas);const lod=b.lod;
      if(b.slice&&draws.some(d=>d.id===b.entityId+':body-fallback'))return;
      const occludes=Boolean(target&&!b.selected&&b.depth>this.project(selected!.point).y&&pointInPolygon(target,artPolygon(b.slice?.hull??asset.occlusionRegion.upper,b.rect)));
      if(lod==='regional'&&this.snapshot.mode!=='planning'){draws.push({id:b.id+':symbol',path:asset.layers.uiIcon!,...b.symbol,alpha:b.draft?.55:1});return;}
      const flame=asset.mapFlame,frame=flame?flameFrame(this.effects.time,flame.frames.length,flame.fps,this.reducedMotion):0;
      const key=flame?flameKey(flame.path,frame):null;
      const showFlame=Boolean(this.app&&b.active&&this.snapshot.mode!=='planning'&&key&&this.assets.frame(key));
      if(showFlame&&key)used.add(key);
      const loadedFlame=showFlame&&key&&this.assets.acquire(key);
      if(b.active&&this.snapshot.mode!=='planning'){
        this.visibleEmitter=true;
        const rect=flameRect(asset,b.rect),emitter=rect&&flame?{x:rect.x+rect.width*flame.anchor.x,y:rect.y+rect.height*flame.anchor.y}:b.ground;
        this.visibleEmitters.push({point:emitter,selected:b.selected});
      }
      let layers=composition(asset,this.snapshot.mode,occludes,b.active,b.orientation);
      if(asset.composition==='architectural'&&this.snapshot.mode!=='planning'){
        let ready=true;
        for(const layer of layers.filter(l=>l.role==='base'||l.role==='upper')){
          const path=exportPath(asset,layer,preferDistrict||lod!=='close'?'district':'close');used.add(path);
          if(!this.assets.acquire(path)||this.failures.has(path)||this.failures.has(this.assets.url(path)))ready=false;
        }
        // Missing architecture must retain one complete authored body, never a floating half.
        if(!ready)layers=composition({...asset,composition:'single-body'},this.snapshot.mode,occludes,b.active,b.orientation);
      }
      for(const layer of layers){
        if(layer.role==='shadow'||layer.role==='vfx'&&loadedFlame)continue;
        if(b.slice&&layer.role==='body'){
          const path=b.slice.paths[preferDistrict||lod!=='close'?'district':'close'];
          const parts=asset.mapDepthSlices![b.orientation]!,paths=parts.map(p=>p.paths[preferDistrict||lod!=='close'?'district':'close']);
          let ready=true;for(const part of paths){used.add(part);if(!this.assets.acquire(part)||this.failures.has(part)||this.failures.has(this.assets.url(part)))ready=false;}
          if(ready){draws.push({id:b.id+':body',path,...b.rect,alpha:layer.alpha*(b.draft?.55:1)});continue;}
          // One whole-body fallback per entity if an individual slice is unavailable.
          if(draws.some(d=>d.id===b.entityId+':body-fallback'))continue;
          for(let i=draws.length-1;i>=0;i--)if(draws[i].id.startsWith(b.entityId+':slice:'))draws.splice(i,1);
          const body=exportPath(asset,layer,preferDistrict||lod!=='close'?'district':'close'),fallback=this.failures.has(body)||this.failures.has(this.assets.url(body))?(asset.mapLayers?.body??asset.layers.body!):body;
          draws.push({id:b.entityId+':body-fallback',path:fallback,...b.rect,alpha:layer.alpha*(b.draft?.55:1)});continue;
        }
        const exported=exportPath(asset,layer,preferDistrict||lod!=='close'?'district':'close'),failed=this.failures.has(exported)||this.failures.has(this.assets.url(exported));
        const sourceFailed=this.failures.has(layer.path)||this.failures.has(this.assets.url(layer.path));
        const path=failed?(this.snapshot.mode==='planning'&&layer.role==='base'?asset.planningLayer??layer.path:sourceFailed?asset.mapLayers?.[layer.role]??asset.layers[layer.role]??layer.path:layer.path):exported;
        draws.push({id:b.id+':'+layer.role,path,...b.rect,alpha:layer.alpha*(b.draft?.55:1)});
      }
      if(loadedFlame&&key){const rect=flameRect(asset,b.rect)!;draws.push({id:b.id+':flame',path:key,...rect,alpha:(occludes&&this.snapshot.mode==='focus'?.22:1)*(b.draft?.55:1)});}
    };
    for(const id of this.depthIds){const b=visibleById.get(id);if(!b)continue;while(propIndex<sortedProps.length&&sortedProps[propIndex].depth<=b.depth)draws.push(sortedProps[propIndex++]);drawBuilding(b);}while(propIndex<sortedProps.length)draws.push(sortedProps[propIndex++]);
    for(const d of draws)if(!d.path.startsWith('chunk:')){Object.assign(d,this.assets.rect(d.path,d));used.add(d.path);this.assets.acquire(d.path);}
    this.assets.retain(used);
    if(this.app)this.renderWebGL(draws);else if(this.context)this.render2D(draws);
    const m=this.metrics.data;
    const flames=draws.filter(d=>d.id.endsWith(':flame'));m.flameSprites=flames.length;m.flameFrame=flames.length?Number(flames[0].path.split('#flame-')[1]):null;
    let terrainGPUBytes=0;for(const texture of this.chunkTextures.values())terrainGPUBytes+=texture.source.width*texture.source.height*4;
    m.textureBytes=this.app?this.assets.gpuBytes+terrainGPUBytes+this.renderTargetBytes():0;
    m.decodedBytes=this.assets.bytes+this.terrain.bytes+this.terrain.scratchBytes;m.terrainBytes=terrainGPUBytes;m.queued=this.terrain.pending;m.pendingTextures=this.assets.pending+this.assets.deferred;m.visible=buildingObjects.length+props.length;m.total=this.snapshot.buildings.length+worldProps.length;
    m.quality=this.quality;m.terrainLevel=this.level;m.visibleTerrainChunks=chunkCoverage(bounds,this.level);m.prefetchChunks=prefetched;
  }
  private groundDraw(chunk:TerrainChunk):Draw {
    const scale=this.scale(),step=chunk.span/(chunk.canvas.width-2),ground=this.project({x:chunk.x*chunk.span-step,y:chunk.y*chunk.span-step});
    const matrix=this.snapshot.projection==='territory'?new Matrix(2*step*scale,step*scale,2*step*scale,-step*scale,ground.x,ground.y):new Matrix(step*(this.snapshot.northExtent?this.size.width/this.snapshot.northExtent.width:scale),0,0,-step*scale,ground.x,ground.y);
    if(!this.chunkTextures.has(chunk.key)&&this.app){const texture=Texture.from(chunk.canvas);this.chunkTextures.set(chunk.key,texture);chunk.release=()=>{if(!texture.destroyed)texture.destroy(true);this.chunkTextures.delete(chunk.key);};}
    return {id:'chunk:'+chunk.key,path:'chunk:'+chunk.key,x:0,y:0,width:chunk.canvas.width,height:chunk.canvas.height,alpha:1,matrix};
  }
  private renderWebGL(draws:Draw[]):void {
    const active=new Set<string>();let index=0;
    for(const d of draws){const texture=d.path.startsWith('chunk:')?this.chunkTextures.get(d.path.slice(6)):this.assets.texture(d.path);if(!texture)continue;active.add(d.id);
      let sprite=this.drawSprites.get(d.id);if(!sprite){sprite=new Sprite(texture);sprite.eventMode='none';this.drawSprites.set(d.id,sprite);this.stage.addChild(sprite);}sprite.texture=texture;sprite.alpha=d.alpha;
      if(d.matrix)sprite.setFromMatrix(d.matrix);else{sprite.skew.set(0,0);sprite.rotation=0;sprite.position.set(d.x,d.y);sprite.width=d.width;sprite.height=d.height;}
      if(this.stage.children[index]!==sprite)this.stage.setChildIndex(sprite,index);index++;
    }
    for(const [id,sprite] of this.drawSprites)if(!active.has(id)){sprite.destroy();this.drawSprites.delete(id);}
    this.effectsGraphics.clear();
    for(const b of this.visibleEmitters){const p=b.point,radius=Math.min(72,10*this.scale()),light=this.effects.light(this.reducedMotion);
      for(let i=4;i>=1;i--)this.effectsGraphics.ellipse(p.x,p.y-2,radius*i/4,radius*i/8).fill({color:MAP_PALETTE.spill,alpha:.018*light});
      if(!this.reducedMotion&&this.quality!=='low')for(let i=0;i<Math.min(this.effects.particles.length,Math.floor(QUALITY[this.quality].particles/Math.max(1,this.visibleEmitters.length)));i++){const e=this.effects.particles[i];this.effectsGraphics.circle(p.x+e.x*.3,p.y+e.y*.4,1).fill({color:MAP_PALETTE.fire,alpha:(1-e.life)*.35});}
    }
    this.draws=0;this.app!.render();this.metrics.data.drawCalls=this.draws;
  }
  private render2D(draws:Draw[]):void {
    const ctx=this.context!,dpr=this.renderDpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=MAP_PALETTE.snow;ctx.fillRect(0,0,this.size.width,this.size.height);
    for(const d of draws){let image:CanvasImageSource|null;
      if(d.path.startsWith('chunk:')){const [level,x,y]=d.path.slice(6).split(':').map(Number);image=this.terrain.get(x,y,level)?.canvas??null;}else image=this.assets.acquire(d.path);if(!image)continue;
      ctx.save();ctx.globalAlpha=d.alpha;if(d.matrix){const m=d.matrix;ctx.transform(m.a,m.b,m.c,m.d,m.tx,m.ty);ctx.drawImage(image,0,0);}else{const f=this.assets.frame(d.path);if(f)ctx.drawImage(image,f.x,f.y,f.width,f.height,d.x,d.y,d.width,d.height);else ctx.drawImage(image,d.x,d.y,d.width,d.height);}ctx.restore();
    }
  }
  private clearSprites():void{for(const s of this.drawSprites.values())s.destroy();this.drawSprites.clear();for(const t of this.chunkTextures.values())if(!t.destroyed)t.destroy(true);this.chunkTextures.clear();}
  destroy():void{if(this.destroyed)return;this.destroyed=true;this.stop();this.restoreDrawCounters?.();this.restoreDrawCounters=null;this.canvas.removeEventListener('webglcontextlost',this.lost);this.clearSprites();this.terrain.destroy();this.assets.destroy();if(this.app){this.app.destroy(false,{children:true,texture:false,textureSource:false});this.app=null;}this.canvas.width=this.canvas.height=0;this.context=null;Object.assign(this.metrics.data,{renderMs:[],intervalMs:[],textureBytes:0,decodedBytes:0,terrainBytes:0,queued:0,pendingTextures:0,activeLoops:0,visible:0,total:0});void this.transferred;}
}
