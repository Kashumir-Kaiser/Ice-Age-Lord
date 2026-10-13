export type Ember={x:number;y:number;life:number;vx:number;vy:number};
/** Fixed visual seed; entirely separate from gameplay RNG and clocks. */
export class MapEffects {
  readonly particles:Ember[];
  time=0;
  constructor(count:number){this.particles=Array.from({length:count},(_,i)=>({x:((i*17)%31)-15,y:-(i*13%50),life:i/count,vx:(i%3-1)*2,vy:-9-(i%5)}));}
  update(delta:number,reducedMotion:boolean):void {
    if(reducedMotion)return;this.time+=Math.min(delta,.05);
    for(const p of this.particles){p.x+=p.vx*Math.min(delta,.05);p.y+=p.vy*Math.min(delta,.05);p.life+=delta*.35;if(p.life>=1){p.life=0;p.y=0;p.x=p.vx*3;}}
  }
  light(reducedMotion:boolean):number{return reducedMotion?1:1+Math.sin(this.time*2.1)*.04+Math.sin(this.time*3.7)*.02;}
}
