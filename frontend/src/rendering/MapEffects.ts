import type { MapEffectsAtlas } from '../assets/assetRegistry.ts';

export type ParticleKind='ember'|'smoke';
export type MapParticle={x:number;y:number;life:number;vx:number;vy:number;kind:ParticleKind;variant:number};
export type EffectParticleDraw={key:string;x:number;y:number;width:number;height:number;alpha:number;anchor:{x:number;y:number}};
export type SightCircle={x:number;y:number;radius:number};
export type ScreenPoint={x:number;y:number};

function hash(value:string):number{
  let result=2166136261;
  for(let i=0;i<value.length;i++){result^=value.charCodeAt(i);result=Math.imul(result,16777619);}
  return result>>>0;
}
function unit(value:string):number{return hash(value)/0xffffffff;}
function inCircle(point:ScreenPoint,circle:SightCircle,inverse:(point:ScreenPoint)=>ScreenPoint,margin=0):boolean{
  const world=inverse(point);return Math.hypot(world.x-circle.x,world.y-circle.y)<=Math.max(0,circle.radius-margin);
}
function segmentDistance(point:ScreenPoint,a:ScreenPoint,b:ScreenPoint):number{
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function contains(point:ScreenPoint,polygon:readonly ScreenPoint[]):boolean{
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j]!,b=polygon[i]!;if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

/** True only when supplied current-sight geometry reaches the exact visible world polygon. */
export function sightIntersectsViewport(circles:readonly SightCircle[],viewport:readonly ScreenPoint[],project:(point:ScreenPoint)=>ScreenPoint):boolean{
  if(circles.length===0||viewport.length<3)return false;
  const worldViewport=viewport.map(project);
  return circles.some(circle=>{
    if(circle.radius<=0||!Number.isFinite(circle.radius))return false;
    const center={x:circle.x,y:circle.y};if(contains(center,worldViewport))return true;
    for(let i=0;i<worldViewport.length;i++)if(segmentDistance(center,worldViewport[i]!,worldViewport[(i+1)%worldViewport.length]!)<=circle.radius)return true;
    return false;
  });
}

/** Fixed visual-only flakes. They are positioned near current-sight circles and clipped there. */
export function ambientSnowDraws(
  circles:readonly SightCircle[],project:(point:ScreenPoint)=>ScreenPoint,inverse:(point:ScreenPoint)=>ScreenPoint,
  viewport:{width:number;height:number},limit:number,time:number,seed:string,path:string,
):EffectParticleDraw[]{
  if(circles.length===0||limit<=0||viewport.width<=0||viewport.height<=0)return [];
  const draws:EffectParticleDraw[]=[];
  for(let i=0;i<limit;i++){
    const circle=circles[i%circles.length];if(!circle||circle.radius<=0)continue;
    const key=seed+':snow:'+i,angle=unit(key+':angle')*Math.PI*2,radius=Math.sqrt(unit(key+':radius'))*circle.radius*.72;
    const center=project({x:circle.x+Math.cos(angle)*radius,y:circle.y+Math.sin(angle)*radius});
    const phase=unit(key+':phase')*24,drift=(((time*2.8+phase)%24)+24)%24-12,x=center.x,y=center.y+drift;
    if(x<1||x>viewport.width-1||y<1||y>viewport.height-1)continue;
    const world=inverse({x,y}),pixelX=inverse({x:x+1,y}),pixelY=inverse({x,y:y+1});
    const pixelXDistance=Math.hypot(pixelX.x-world.x,pixelX.y-world.y);
    const pixelYDistance=Math.hypot(pixelY.x-world.x,pixelY.y-world.y);
    const safety=Math.max(pixelXDistance,pixelYDistance)*1.5;
    if(!circles.some(candidate=>inCircle({x,y},candidate,inverse,safety)))continue;
    const size=1+unit(key+':size');
    draws.push({key:mapEffectSnowKey(path),x,y,width:size,height:size,alpha:.1+unit(key+':alpha')*.1,anchor:{x:.5,y:.5}});
  }
  return draws;
}

export type FoliageCandidate={id:string;kind:string};
/** Stable, sparse conifer selection with a hard quality-dependent sprite cap. */
export function selectSwayingConiferIds(props:readonly FoliageCandidate[],quality:'low'|'normal'):Set<string>{
  const limit=quality==='low'?4:12;
  return new Set(props.filter(prop=>prop.kind==='conifer'&&hash(prop.id)%10===0)
    .sort((a,b)=>hash(a.id)-hash(b.id)||a.id.localeCompare(b.id)).slice(0,limit).map(prop=>prop.id));
}
/** Pixel-space sway bounded independently of zoom; disabled states always return zero. */
export function foliageSwayOffset(id:string,time:number,enabled:boolean):number{
  if(!enabled)return 0;
  const phase=unit(id+':sway')*Math.PI*2;
  return Math.sin(time*1.15+phase)*1.5;
}

/** Scale a source image while shearing its top around the registered 94% root line. */
export function rootAnchoredSwayMatrix(
  x:number,y:number,width:number,height:number,imageWidth:number,imageHeight:number,offset:number,anchor=.94,
):[number,number,number,number,number,number]|null{
  if(width<=0||height<=0||imageWidth<=0||imageHeight<=0||anchor<=0||offset===0)return null;
  const c=-offset/(imageHeight*anchor);
  return [width/imageWidth,0,c,height/imageHeight,x+offset,y];
}

/** Stable visual-only keys; every frame resolves to the same versioned atlas texture. */
export function mapEffectSnowKey(path:string):string{return path+'#map-effect-snow';}
export function mapEffectFrameKey(path:string,kind:ParticleKind,index:number):string{return path+'#map-effect-'+kind+'-'+index;}

/** Fixed visual seed; entirely separate from gameplay RNG and clocks. */
export class MapEffects {
  readonly particles:MapParticle[];
  time=0;
  constructor(count:number){this.particles=Array.from({length:count},(_,i)=>({
    x:((i*17)%31)-15,y:-(i*13%50),life:(i*37%100)/100,vx:(i%3-1)*2,
    vy:i%5===0?-3-i%3:-9-(i%5),kind:i%5===0?'smoke':'ember',variant:i,
  }));}
  update(delta:number,reducedMotion:boolean,active:boolean):void {
    if(reducedMotion||!active)return;
    const step=Math.min(Math.max(delta,0),.05);this.time+=step;
    for(const p of this.particles){p.x+=p.vx*step;p.y+=p.vy*step;p.life+=step*.35;if(p.life>=1){p.life=0;p.y=0;p.x=((p.variant*7)%21)-10;}}
  }
  light(reducedMotion:boolean):number{return reducedMotion?1:1+Math.sin(this.time*2.1)*.04+Math.sin(this.time*3.7)*.02;}
  /** Twelve cosmetic sprites per emitter, bounded by the selected quality cap. */
  draws(emitters:readonly {x:number;y:number}[],atlas:MapEffectsAtlas|undefined,qualityLimit:number,reducedMotion:boolean,scale:number):EffectParticleDraw[]{
    if(!atlas||emitters.length===0)return [];
    const count=Math.min(this.particles.length,qualityLimit,emitters.length*12),draws:EffectParticleDraw[]=[];
    for(let i=0;i<count;i++){
      const particle=this.particles[i],emitter=emitters[i%emitters.length];
      const region=particle.kind==='smoke'?atlas.regions.smoke:atlas.regions.ember;
      const frameIndex=reducedMotion?0:(Math.floor(this.time*region.fps)+particle.variant)%region.frames.length;
      const key=mapEffectFrameKey(atlas.path,particle.kind,frameIndex),smoke=particle.kind==='smoke';
      const size=smoke?Math.max(8,Math.min(14,scale*4)):Math.max(2,Math.min(4,scale*1.2));
      draws.push({key,x:emitter.x+particle.x*.24,y:emitter.y+particle.y*.26,width:size,height:smoke?size*1.12:size*1.45,alpha:Math.max(.08,(1-particle.life)*(smoke?.62:.8)),anchor:region.anchor});
    }
    return draws;
  }
}
