import type { MapEffectsAtlas } from '../assets/assetRegistry.ts';

export type ParticleKind='ember'|'smoke';
export type MapParticle={x:number;y:number;life:number;vx:number;vy:number;kind:ParticleKind;variant:number};
export type EffectParticleDraw={key:string;x:number;y:number;width:number;height:number;alpha:number;anchor:{x:number;y:number}};

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
