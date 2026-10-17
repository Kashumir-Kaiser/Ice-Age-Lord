import { Application, Container, Graphics, Matrix, Rectangle, Sprite, Texture } from 'pixi.js';
import type {MapEffectsAtlas} from '../assets/assetRegistry.ts';
import type { MapSnapshot } from './MapSceneAdapter.ts';
import { TerrainSampler, GROUND_MATERIALS, chunkLevel, chunkCoverage, boundedChunkLevel } from './TerrainSampler.ts';
import { TerrainChunkCache } from './TerrainChunkCache.ts';
import type { TerrainChunk } from './TerrainChunkCache.ts';
import { AssetTextureCache, exportPath } from './AssetTextureCache.ts';
import { MapMetrics } from './MapMetrics.ts';
import { cameraSourceChanged } from './CameraUpdate.ts';
import { cameraOnlySnapshot, terrainInputsChanged } from './CameraUpdate.ts';
import { MapEffects, ambientSnowDraws, foliageSwayOffset, rootAnchoredSwayMatrix, selectSwayingConiferIds, sightIntersectsViewport } from './MapEffects.ts';
import type {EffectParticleDraw} from './MapEffects.ts';
import { flameFrame, flameRect, flameKey } from './FlamePresentation.ts';
import { createCompositionCache, architecturalCompositePlan, qaArtLayerMetrics } from './SpriteRegistration.ts';
import { pointInTransformedPolygon } from './MapPicking.ts';
import { depthOrder } from './DepthOrder.ts';
import {projectDepthNodes} from './DepthSlices.ts';
import { projectBuildings } from './BuildingGeometry.ts';
import { BuildingFootprintIndex } from './BuildingFootprintIndex.ts';
import { MAP_PALETTE, QUALITY, LEDGE_SOURCES, AdaptiveQuality } from './mapStyle.ts';
import type { Quality, SceneLOD } from './mapStyle.ts';
import { screenToWorld, worldToScreen } from '../territory/projection.ts';
import { BASE_VIEW_HEIGHT_M } from '../map/camera.ts';
import type { WorldPoint } from '../territory/projection.ts';
type Size={width:number;height:number};
type Draw={id:string;path:string;x:number;y:number;width:number;height:number;alpha:number;matrix?:Matrix;texture?:Texture;qaArtLayers?:{base:number|null;upper:number|null;body:number|null}};
type PropDraw=Draw&{depth:number;kind:string;world:WorldPoint;imageWidth:number;imageHeight:number};
const BANK_ART_ASPECT=[384/127,384/115,384/111,384/201,384/76,384/123,384/144,384/99] as const;
export class MapRenderer {
  private app:Application|null=null;
  private failures=new Set<string>();
  private draws=0;
  private restoreDrawCounters:(()=>void)|null=null;
  private context:CanvasRenderingContext2D|null=null;
  private stage=new Container();
  private effectsGraphics=new Graphics();
  private particleLayer=new Container();
  private particleSprites:Sprite[]=[];
  private effectDraws:EffectParticleDraw[]=[];
  private drawSprites=new Map<string,Sprite>();
  private chunkTextures=new Map<string,Texture>();
  private architectureTextures=new Map<string,{texture:Texture;bytes:number;stamp:number}>();
  private architectureTextureBytes=0;
  private architectureTextureKeyCache=new WeakMap<NonNullable<ReturnType<typeof architecturalCompositePlan>>,{urlRevision:number;key:string}>();
  private architectureTextureFailures=new Set<string>();
  private architectureTextureStamp=0;
  // These generated render targets are separate from source images and stay under a fixed memory cap.
  private readonly architectureTextureLimit=16*1048576;
  private readonly compositionForRender=createCompositionCache();
  private assets:AssetTextureCache;
  private terrain:TerrainChunkCache;
  private sampler:TerrainSampler;
  private buildingFootprints:BuildingFootprintIndex;
  private snapshot:MapSnapshot;
  private snapshotSource:MapSnapshot;
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
  private readonly effects=new MapEffects(180);
  private reducedMotion=false;
  private preference:'auto'|Quality='auto';
  private hidden=false;
  private hostVisibility:'unknown'|'visible'|'hidden'='unknown';
  private transferred=false;
  private visibleEmitter=false;
  private visibleAmbient=false;
  private visibleSway=false;
  private visibleEmitters:{point:WorldPoint;selected:boolean}[]=[];
  private depthBuildings:MapSnapshot['buildings']|null=null;
  private depthScale=0;
  private depthProjection:MapSnapshot['projection']|null=null;
  private depthPlanning=false;
  private depthIds:string[]=[];
  readonly metrics:MapMetrics;
  constructor(private canvas:HTMLCanvasElement,snapshot:MapSnapshot,private status:(backend:string)=>void,enabledMetrics=false,environment:readonly {path:string;sha256:string;width:number;height:number}[]=[],private readonly mapEffects?:MapEffectsAtlas){
    this.snapshot=snapshot;this.snapshotSource=snapshot;this.metrics=new MapMetrics(enabledMetrics);
    this.buildingFootprints=new BuildingFootprintIndex(snapshot.buildings);
    this.sampler=new TerrainSampler(snapshot.visualIdentity??snapshot.identity,snapshot.geography,snapshot.regions,snapshot.modeledInfill);
    this.terrain=new TerrainChunkCache(this.sampler,QUALITY.normal.terrainBytes,QUALITY.normal.textureSize,()=>this.invalidate());
    this.updateContacts(snapshot);
    this.assets=new AssetTextureCache(()=>this.invalidate(),path=>{this.failures.add(path);this.metrics.error('asset: '+path);this.invalidate();},QUALITY.normal.totalBytes-QUALITY.normal.terrainBytes);
    this.assets.registerEnvironment(environment);
    this.assets.registerMapEffects(mapEffects);
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
      app.stop();this.transferred=true;app.stage.addChild(this.stage,this.effectsGraphics,this.particleLayer);this.canvas.addEventListener('webglcontextlost',this.lost);
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
    this.clearSprites();this.clearParticleSprites();this.effectsGraphics.destroy();this.particleLayer.destroy({children:false});this.stage.destroy({children:true,texture:false,textureSource:false});
    this.app?.destroy(false,{children:false,texture:false,textureSource:false});this.app=null;this.effectsGraphics=new Graphics();this.particleLayer=new Container();this.stage=new Container();void this.init(true);
  };
  updateCamera(source:MapSnapshot,camera:MapSnapshot['camera']):void{
    if(this.destroyed)return;
    if(cameraSourceChanged(this.snapshotSource,source)){
      this.update({...source,camera});
      this.snapshotSource=source;
      return;
    }
    this.snapshot=cameraOnlySnapshot(this.snapshot,camera);this.invalidate();
  }
  update(snapshot:MapSnapshot):void{
    if(this.destroyed)return;
    let rebuilt=false;
    if(snapshot.identity!==this.snapshot.identity||terrainInputsChanged(this.snapshot,snapshot)){
      this.terrain.destroy();this.sampler=new TerrainSampler(snapshot.visualIdentity??snapshot.identity,snapshot.geography,snapshot.regions,snapshot.modeledInfill);this.terrain=new TerrainChunkCache(this.sampler,QUALITY[this.quality].terrainBytes,QUALITY[this.quality].textureSize,()=>this.invalidate());this.level=undefined;
      rebuilt=true;
    }
    if(rebuilt||snapshot.buildings!==this.snapshot.buildings){this.updateContacts(snapshot);this.buildingFootprints=new BuildingFootprintIndex(snapshot.buildings);const ids=new Set(snapshot.buildings.map(b=>b.id)),lods=snapshot.buildingLODs??this.lod;for(const id of lods.keys())if(!ids.has(id))lods.delete(id);}
    this.snapshot=snapshot;this.snapshotSource=snapshot;this.invalidate();
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
  setHidden(hidden:boolean):void{this.hidden=hidden;if(hidden||this.hostVisibility==='hidden')this.stop();else{this.previous=0;this.invalidate();}}
  setHostVisible(visible:boolean|undefined):void{this.hostVisibility=visible===undefined?'unknown':visible?'visible':'hidden';if(this.hidden||this.hostVisibility==='hidden')this.stop();else{this.previous=0;this.invalidate();}}
  invalidate():void{if(this.destroyed)return;this.dirty=true;if(!this.inFrame)this.schedule();}
  private schedule():void{if(!this.raf&&!this.hidden&&this.hostVisibility!=='hidden'&&!this.destroyed){if(!this.cameraGesture&&!this.metrics.data.activeLoops&&performance.now()-this.idleSince>150){this.lastFrame=0;this.metrics.resetClock();this.adaptive.resetObservation();}this.metrics.data.activeLoops=1;this.raf=requestAnimationFrame(this.frame);}}
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
  private motionAllowed():boolean{return !this.reducedMotion&&!this.hidden&&this.hostVisibility==='visible'&&(this.snapshot.mode==='normal'||this.snapshot.mode==='focus')&&Boolean(this.app);}
  private motionActive():boolean{return this.motionAllowed()&&(this.visibleEmitter||this.visibleAmbient||this.visibleSway);}
  private renderTargetBytes():number{return Math.ceil(this.size.width*this.size.height*this.renderDpr**2*8);}
  private frame=(time:number)=>{
    const sampleCallback=this.metrics.enabled&&this.metrics.samplingAt(time),callbackEntry=sampleCallback?performance.now():0;let rendered=false;
    this.raf=0;if(this.destroyed||this.hidden||this.hostVisibility==='hidden'){if(sampleCallback)this.metrics.frameCallback(time,callbackEntry,false);return;}
    this.inFrame=true;
    try{
    const active=this.motionActive();
    const pending=this.terrain.pending>0||this.previousLevel!==undefined;
    if(time-this.lastFrame>=1000/QUALITY[this.quality].fps-1){
      const start=performance.now(),generated=this.terrain.process();
      if(this.dirty||generated||active||this.previousLevel!==undefined){
        const interval=this.lastFrame?time-this.lastFrame:0;
        this.dirty=false;this.effects.update((time-this.previous)/1000,this.reducedMotion,active);this.render();this.metrics.frame(start);this.lastFrame=time;rendered=true;
        if(interval>0)this.setQuality(this.adaptive.update(interval,Math.min(interval,1000),this.preference==='auto'?undefined:this.preference));
        else this.adaptive.resetObservation();
      }
      this.previous=time;
    }
    if(this.motionActive()||pending||this.terrain.pending||this.dirty||this.previousLevel!==undefined){this.inFrame=false;this.schedule();}else {this.metrics.data.activeLoops=0;this.idleSince=performance.now();}
    }finally{if(sampleCallback)this.metrics.frameCallback(time,callbackEntry,rendered);this.inFrame=false;}
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
    const currentLevel=this.level,span=64*2**currentLevel,draws:Draw[]=[],used=new Set<string>(),usedArchitectureTextures=new Set<string>();
    const progress=this.previousLevel===undefined?1:Math.min(1,(performance.now()-this.transitionStart)/150);
    if(this.previousLevel!==undefined&&progress<1){const oldSpan=64*2**this.previousLevel;
      for(let y=Math.floor(bounds.minY/oldSpan);y<=Math.floor(bounds.maxY/oldSpan);y++)for(let x=Math.floor(bounds.minX/oldSpan);x<=Math.floor(bounds.maxX/oldSpan);x++){const c=this.terrain.get(x,y,this.previousLevel);if(c)draws.push({...this.groundDraw(c),alpha:1-progress});}
    }else this.previousLevel=undefined;
    this.terrain.retainLevels(new Set(this.previousLevel===undefined?[currentLevel,wanted]:[currentLevel,wanted,this.previousLevel]));
    let paintChanged=false;
    if(currentLevel<=2&&!this.snapshot.compact)for(const name of GROUND_MATERIALS){const path='/assets/map/terrain/'+name+'.webp',paint=this.assets.acquire(path);used.add(path);if(paint&&this.terrain.paints.get(name)!==paint){this.terrain.paints.set(name,paint);paintChanged=true;}}
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
    if(this.snapshot.projection==='north-up'&&!this.snapshot.compact)for(const patch of this.sampler.relief(bounds,1/scale)){
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
    const propBounds={minX:bounds.minX-80,maxX:bounds.maxX+80,minY:bounds.minY-80,maxY:bounds.maxY+80};
    const worldProps=this.snapshot.mode==='planning'||this.snapshot.compact?[]:this.sampler.props(propBounds,1/scale).filter(p=>!this.buildingFootprints.overlaps({x:p.x,y:p.y,size:p.size}));
    const props:PropDraw[]=worldProps.map(p=>{
      const tree=p.kind==='conifer'||p.kind==='bare',ground=this.project(p),name=p.kind==='ledge'?LEDGE_SOURCES[p.variant%4]:p.kind+'-'+String(p.variant%(p.kind==='conifer'?6:p.kind==='bare'?3:8)+1).padStart(2,'0'),path='/assets/map/terrain/'+name+'.png';
      const image=this.assets.acquire(path),imageWidth=image?('naturalWidth' in image?image.naturalWidth:image.width):0,imageHeight=image?('naturalHeight' in image?image.naturalHeight:image.height):0;
      const aspect=image?imageWidth/imageHeight:p.kind==='bank'?BANK_ART_ASPECT[p.variant%8]:tree?.65:1.9,height=p.worldWidth!==undefined?p.worldWidth*scale/aspect:p.size*scale*(tree?1.8:.6);
      const width=p.worldWidth!==undefined?p.worldWidth*scale:height*aspect;
      const x=ground.x-width/2,y=ground.y-height*.94;
      return {id:'prop:'+p.id,path,x,y,width,height,alpha:1,depth:ground.y,kind:p.kind,world:{x:p.x,y:p.y},imageWidth,imageHeight};
    });
    const currentSight=this.snapshot.currentSight??[],screenViewport=[{x:0,y:0},{x:this.size.width,y:0},{x:this.size.width,y:this.size.height},{x:0,y:this.size.height}];
    const snowVisible=(this.snapshot.mode==='normal'||this.snapshot.mode==='focus')&&!this.snapshot.compact&&sightIntersectsViewport(currentSight,screenViewport,this.inverse);
    const swayCandidates=props.filter(p=>p.kind==='conifer'&&p.x+p.width>=0&&p.y+p.height>=0&&p.x<=this.size.width&&p.y<=this.size.height&&currentSight.some(sight=>Math.hypot(p.world.x-sight.x,p.world.y-sight.y)<=sight.radius));
    const swayingIds=selectSwayingConiferIds(swayCandidates.map(p=>({id:p.id,kind:p.kind})),this.quality);
    const animate=this.motionAllowed();this.visibleAmbient=false;this.visibleSway=false;
    const swayTime=animate?this.effects.time:0;
    for(const prop of props){
      if(!swayingIds.has(prop.id)||!prop.imageWidth||!prop.imageHeight)continue;
      const offset=foliageSwayOffset(prop.id,swayTime,animate);if(!offset)continue;
      const matrix=rootAnchoredSwayMatrix(prop.x,prop.y,prop.width,prop.height,prop.imageWidth,prop.imageHeight,offset);
      if(matrix){prop.matrix=new Matrix(...matrix);this.visibleSway=true;}
    }
    // Low quality omits the separate ground shadow pass; building layers and
    // depth slices below retain their authored silhouettes and painter order.
    if(this.quality!=='low')for(const b of buildingObjects){const asset=b.asset!;this.assets.register(asset,useAtlas);for(const layer of this.compositionForRender(asset,this.snapshot.mode,false,b.active,b.orientation))if(layer.role==='shadow'){
      const exported=exportPath(asset,layer,preferDistrict?'district':'close'),path=(this.failures.has(exported)||this.failures.has(this.assets.url(exported)))?(asset.mapLayers?.[layer.role]??asset.layers[layer.role]??layer.path):exported;
      draws.push({id:b.id+':shadow',path,...b.rect,alpha:layer.alpha*(b.draft?.55:1)});
    }}
    // Architectural order from the partial order is preserved; props are inserted by their ground depths.
    let propIndex=0;const sortedProps=props.sort((a,b)=>a.depth-b.depth||a.id.localeCompare(b.id));
    const drawBuilding=(b:typeof nodes[number])=>{
      const asset=b.asset!;this.assets.register(asset,useAtlas);const lod=b.lod;
      if(b.slice&&draws.some(d=>d.id===b.entityId+':body-fallback'))return;
      const occludes=this.snapshot.mode==='focus'&&Boolean(target&&!b.selected&&b.depth>target!.y&&pointInTransformedPolygon(target!,b.slice?.hull??asset.occlusionRegion.upper,b.rect));
      if(lod==='regional'&&this.snapshot.mode!=='planning'){draws.push({id:b.id+':symbol',path:asset.layers.uiIcon!,...b.symbol,alpha:b.draft?.55:1});return;}
      const flame=asset.mapFlame,frame=flame?flameFrame(this.effects.time,flame.frames.length,flame.fps,this.reducedMotion):0;
      const key=flame?flameKey(flame.path,frame):null;
      const showFlame=Boolean(this.app&&b.active&&this.snapshot.mode!=='planning'&&key&&this.assets.frame(key));
      if(showFlame&&key)used.add(key);
      const loadedFlame=showFlame&&key&&this.assets.acquire(key);
      if(b.active&&(this.snapshot.mode==='normal'||this.snapshot.mode==='focus')&&this.hostVisibility==='visible'){
        this.visibleEmitter=true;
        const rect=flameRect(asset,b.rect),emitter=rect&&flame?{x:rect.x+rect.width*flame.anchor.x,y:rect.y+rect.height*flame.anchor.y}:b.ground;
        this.visibleEmitters.push({point:emitter,selected:b.selected});
      }
      let layers=this.compositionForRender(asset,this.snapshot.mode,occludes,b.active,b.orientation);
      if(asset.composition==='architectural'&&this.snapshot.mode!=='planning'){
        let ready=true;
        for(const layer of layers.filter(l=>l.role==='base'||l.role==='upper')){
          const path=exportPath(asset,layer,preferDistrict||lod!=='close'?'district':'close');used.add(path);
          if(!this.assets.acquire(path)||this.failures.has(path)||this.failures.has(this.assets.url(path)))ready=false;
        }
        // Missing architecture must retain one complete authored body, never a floating half.
        if(!ready)layers=this.compositionForRender({...asset,composition:'single-body'},this.snapshot.mode,occludes,b.active,b.orientation);
      }
      if(this.app&&!b.slice&&asset.composition==='architectural'&&this.snapshot.mode!=='planning'){
        const compositeLOD=preferDistrict||lod!=='close'?'district':'close';
        const plan=architecturalCompositePlan(asset,layers,b.orientation,compositeLOD,b.draft?.55:1);
        if(plan){
          const texture=this.architectureTexture(plan,usedArchitectureTextures);
          if(texture){
            usedArchitectureTextures.add(this.architectureTextureKey(plan));
            // Replace base + upper at their original painter position. Draft opacity
            // is baked per layer into the shared texture, matching the old draw alpha.
            draws.push({id:b.id+':body',path:'',texture,...b.rect,alpha:1,qaArtLayers:{base:plan.parts.find(part=>part.role==='base')?.alpha??null,upper:plan.parts.find(part=>part.role==='upper')?.alpha??null,body:null}});
            layers=layers.filter(layer=>layer.role!=='base'&&layer.role!=='upper');
          }
        }
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
    const allowedEffects=Boolean(this.app)&&(this.snapshot.mode==='normal'||this.snapshot.mode==='focus')&&!this.hidden&&this.hostVisibility==='visible';
    const snow=allowedEffects&&snowVisible&&this.mapEffects?ambientSnowDraws(currentSight,this.project,this.inverse,this.size,this.quality==='low'?8:16,this.reducedMotion||!this.app?0:this.effects.time,this.snapshot.visualIdentity??this.snapshot.identity,this.mapEffects.path):[];
    this.visibleAmbient=animate&&snow.some(draw=>Boolean(this.assets.acquire(draw.key)));
    const particleLimit=Math.max(0,QUALITY[this.quality].particles-snow.length);
    this.effectDraws=[...snow,...(allowedEffects?this.effects.draws(this.visibleEmitters.map(({point})=>point),this.mapEffects,particleLimit,this.reducedMotion,this.scale()):[])];
    if(this.effectDraws.length&&this.mapEffects)used.add(this.mapEffects.path);
    for(const d of draws)if(!d.texture&&!d.path.startsWith('chunk:')){Object.assign(d,this.assets.rect(d.path,d));used.add(d.path);this.assets.acquire(d.path);}
    this.assets.retain(used);
    if(this.app)this.renderWebGL(draws);else if(this.context)this.render2D(draws);
    const m=this.metrics.data;
    m.qaArtLayers=qaArtLayerMetrics(draws,this.metrics.enabled,this.snapshot.buildings.some(b=>b.id==='qa-art-preview'));
    const flames=draws.filter(d=>d.id.endsWith(':flame'));m.flameSprites=flames.length;m.flameFrame=flames.length?Number(flames[0].path.split('#flame-')[1]):null;
    m.effectSprites=this.effectDraws.length;
    let terrainGPUBytes=0;for(const texture of this.chunkTextures.values())terrainGPUBytes+=texture.source.width*texture.source.height*4;
    m.textureBytes=this.app?this.assets.gpuBytes+terrainGPUBytes+this.architectureTextureBytes+this.renderTargetBytes():0;
    m.decodedBytes=this.assets.bytes+this.terrain.bytes+this.terrain.scratchBytes;m.terrainBytes=terrainGPUBytes;this.refreshReadinessMetrics();m.qaDraftOrientations=this.metrics.enabled?this.snapshot.buildings.filter(building=>building.draft).map(({id,assetId,orientation})=>({id,assetId,orientation})):[];m.visible=buildingObjects.length+props.length;m.total=this.snapshot.buildings.length+worldProps.length;
    m.quality=this.quality;m.terrainLevel=this.level;m.visibleTerrainChunks=chunkCoverage(bounds,this.level);m.prefetchChunks=prefetched;
  }
  refreshReadinessMetrics():void{const metrics=this.metrics.data;metrics.queued=this.terrain.pending;metrics.pendingTextures=this.assets.pending+this.assets.deferred;metrics.pendingTextureDetails=this.metrics.enabled?this.assets.readinessDiagnostics:[];}
  private groundDraw(chunk:TerrainChunk):Draw {
    const scale=this.scale(),step=chunk.span/(chunk.canvas.width-2),ground=this.project({x:chunk.x*chunk.span-step,y:chunk.y*chunk.span-step});
    const matrix=this.snapshot.projection==='territory'?new Matrix(2*step*scale,step*scale,2*step*scale,-step*scale,ground.x,ground.y):new Matrix(step*(this.snapshot.northExtent?this.size.width/this.snapshot.northExtent.width:scale),0,0,-step*scale,ground.x,ground.y);
    if(!this.chunkTextures.has(chunk.key)&&this.app){const texture=Texture.from(chunk.canvas);this.chunkTextures.set(chunk.key,texture);chunk.release=()=>{if(!texture.destroyed)texture.destroy(true);this.chunkTextures.delete(chunk.key);};}
    return {id:'chunk:'+chunk.key,path:'chunk:'+chunk.key,x:0,y:0,width:chunk.canvas.width,height:chunk.canvas.height,alpha:1,matrix};
  }
  private renderWebGL(draws:Draw[]):void {
    const active=new Set<string>();let index=0;
    for(const d of draws){const texture=d.texture??(d.path.startsWith('chunk:')?this.chunkTextures.get(d.path.slice(6)):this.assets.texture(d.path));if(!texture)continue;active.add(d.id);
      let sprite=this.drawSprites.get(d.id);if(!sprite){sprite=new Sprite(texture);sprite.eventMode='none';this.drawSprites.set(d.id,sprite);this.stage.addChild(sprite);}sprite.texture=texture;sprite.alpha=d.alpha;
      if(d.matrix)sprite.setFromMatrix(d.matrix);else{sprite.skew.set(0,0);sprite.rotation=0;sprite.position.set(d.x,d.y);sprite.width=d.width;sprite.height=d.height;}
      if(this.stage.children[index]!==sprite)this.stage.setChildIndex(sprite,index);index++;
    }
    for(const [id,sprite] of this.drawSprites)if(!active.has(id)){sprite.destroy();this.drawSprites.delete(id);}
    this.effectsGraphics.clear();
    for(const b of this.visibleEmitters){const p=b.point,radius=Math.min(72,10*this.scale()),light=this.effects.light(this.reducedMotion);
      for(let i=4;i>=1;i--)this.effectsGraphics.ellipse(p.x,p.y-2,radius*i/4,radius*i/8).fill({color:MAP_PALETTE.spill,alpha:.018*light});
    }
    this.renderEffectSprites();
    this.draws=0;this.app!.render();this.metrics.data.drawCalls=this.draws;
  }
  private renderEffectSprites():void{
    if(!this.effectDraws.length){this.clearParticleSprites();return;}
    for(let i=0;i<this.effectDraws.length;i++){
      const draw=this.effectDraws[i],texture=this.assets.texture(draw.key);
      let sprite=this.particleSprites[i];if(!sprite){sprite=new Sprite(Texture.EMPTY);sprite.eventMode='none';this.particleSprites.push(sprite);this.particleLayer.addChild(sprite);}
      sprite.visible=Boolean(texture);if(!texture)continue;
      sprite.texture=texture;sprite.anchor.set(draw.anchor.x,draw.anchor.y);sprite.position.set(draw.x,draw.y);sprite.width=draw.width;sprite.height=draw.height;sprite.alpha=draw.alpha;
    }
    for(let i=this.effectDraws.length;i<this.particleSprites.length;i++)this.particleSprites[i].visible=false;
  }
  private render2D(draws:Draw[]):void {
    const ctx=this.context!,dpr=this.renderDpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=MAP_PALETTE.snow;ctx.fillRect(0,0,this.size.width,this.size.height);
    for(const d of draws){let image:CanvasImageSource|null;
      if(d.path.startsWith('chunk:')){const [level,x,y]=d.path.slice(6).split(':').map(Number);image=this.terrain.get(x,y,level)?.canvas??null;}else image=this.assets.acquire(d.path);if(!image)continue;
      ctx.save();ctx.globalAlpha=d.alpha;if(d.matrix){const m=d.matrix;ctx.transform(m.a,m.b,m.c,m.d,m.tx,m.ty);ctx.drawImage(image,0,0);}else{const f=this.assets.frame(d.path);if(f)ctx.drawImage(image,f.x,f.y,f.width,f.height,d.x,d.y,d.width,d.height);else ctx.drawImage(image,d.x,d.y,d.width,d.height);}ctx.restore();
    }
    for(const emitter of this.visibleEmitters){const radius=Math.min(72,10*this.scale());for(let i=4;i>=1;i--){ctx.beginPath();ctx.ellipse(emitter.point.x,emitter.point.y-2,radius*i/4,radius*i/8,0,0,Math.PI*2);ctx.fillStyle=`rgba(217,150,84,${.018*this.effects.light(this.reducedMotion)})`;ctx.fill();}}
    for(const draw of this.effectDraws){const image=this.assets.acquire(draw.key),frame=this.assets.frame(draw.key);if(!image||!frame)continue;ctx.save();ctx.globalAlpha=draw.alpha;ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,draw.x-draw.width*draw.anchor.x,draw.y-draw.height*draw.anchor.y,draw.width,draw.height);ctx.restore();}
  }
  private architectureTextureKey(plan:NonNullable<ReturnType<typeof architecturalCompositePlan>>):string {
    const cached=this.architectureTextureKeyCache.get(plan);
    if(cached?.urlRevision===this.assets.urlRevision)return cached.key;
    const key=plan.key+'|'+plan.parts.map(part=>this.assets.url(part.path)).join('|');
    this.architectureTextureKeyCache.set(plan,{urlRevision:this.assets.urlRevision,key});
    return key;
  }
  private architectureTexture(plan:NonNullable<ReturnType<typeof architecturalCompositePlan>>,inUse:ReadonlySet<string>):Texture|null {
    const key=this.architectureTextureKey(plan),cached=this.architectureTextures.get(key);
    if(cached){cached.stamp=++this.architectureTextureStamp;return cached.texture;}
    if(this.architectureTextureFailures.has(key))return null;
    const bytes=plan.width*plan.height*4;
    if(bytes>this.architectureTextureLimit||plan.width>this.assets.maxTextureSize||plan.height>this.assets.maxTextureSize){this.failArchitectureTexture(key);return null;}
    while(this.architectureTextureBytes+bytes>this.architectureTextureLimit){
      let oldestKey:string|undefined,oldestStamp=Infinity;
      for(const [candidate,item] of this.architectureTextures)if(!inUse.has(candidate)&&item.stamp<oldestStamp){oldestKey=candidate;oldestStamp=item.stamp;}
      if(!oldestKey)return null;
      const evicted=this.architectureTextures.get(oldestKey)!;
      if(!evicted.texture.destroyed)evicted.texture.destroy(true);
      this.architectureTextureBytes-=evicted.bytes;this.architectureTextures.delete(oldestKey);
    }
    // A null texture means AssetTextureCache is still loading this source. Leave
    // the key retryable so the next render can compose it once the load settles.
    const sources=plan.parts.map(part=>this.assets.texture(part.path));
    if(sources.some(source=>!source))return null;
    const target=new Container();
    try{
      for(let index=0;index<plan.parts.length;index++){
        const part=plan.parts[index],source=sources[index]!;
        const sprite=new Sprite(source);sprite.eventMode='none';sprite.position.set(part.x,part.y);
        sprite.width=part.width;sprite.height=part.height;sprite.alpha=part.alpha;target.addChild(sprite);
      }
      const texture=this.app!.renderer.generateTexture({target,frame:new Rectangle(0,0,plan.width,plan.height),resolution:1,antialias:false,clearColor:[0,0,0,0]});
      this.architectureTextures.set(key,{texture,bytes,stamp:++this.architectureTextureStamp});this.architectureTextureBytes+=bytes;
      return texture;
    }catch{this.failArchitectureTexture(key);return null;}
    finally{target.destroy({children:true,texture:false,textureSource:false});}
  }
  private failArchitectureTexture(key:string):void {if(this.architectureTextureFailures.size>=128)this.architectureTextureFailures.clear();this.architectureTextureFailures.add(key);}
  private clearArchitectureTextures():void {
    this.architectureTextureFailures.clear();
    this.architectureTextureKeyCache=new WeakMap();
    for(const item of this.architectureTextures.values())if(!item.texture.destroyed)item.texture.destroy(true);
    this.architectureTextures.clear();this.architectureTextureBytes=0;
  }
  private clearSprites():void{for(const s of this.drawSprites.values())s.destroy();this.drawSprites.clear();for(const t of this.chunkTextures.values())if(!t.destroyed)t.destroy(true);this.chunkTextures.clear();this.clearArchitectureTextures();}
  private clearParticleSprites():void{for(const sprite of this.particleSprites)sprite.destroy();this.particleSprites=[];}
  destroy():void{if(this.destroyed)return;this.destroyed=true;this.stop();this.restoreDrawCounters?.();this.restoreDrawCounters=null;this.canvas.removeEventListener('webglcontextlost',this.lost);this.clearSprites();this.clearParticleSprites();this.terrain.destroy();this.assets.destroy();if(this.app){this.app.destroy(false,{children:true,texture:false,textureSource:false});this.app=null;}this.canvas.width=this.canvas.height=0;this.context=null;Object.assign(this.metrics.data,{renderMs:[],intervalMs:[],intervalSamples:[],rendererRafSamples:[],sampleStartMs:null,sampleEndMs:null,phaseTransitions:[],textureBytes:0,decodedBytes:0,terrainBytes:0,queued:0,pendingTextures:0,activeLoops:0,visible:0,total:0,effectSprites:0});void this.transferred;}
}
