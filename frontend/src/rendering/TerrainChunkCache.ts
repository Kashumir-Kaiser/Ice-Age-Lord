import { GROUND_MATERIALS, type TerrainSampler } from './TerrainSampler.ts';
import type { ContactBounds } from './GroundContacts.ts';
export type TerrainChunk = {key:string;level:number;x:number;y:number;span:number;canvas:HTMLCanvasElement;bytes:number;release?:()=>void};
type Job={key:string;x:number;y:number;level:number;revision:number;size:number};
type Working=Job&{buffer:Uint8ClampedArray;row:number};
export class TerrainChunkCache {
  private cache=new Map<string,TerrainChunk>();
  private queue=new Map<string,Job>();
  private revision=0;
  private worker:Worker|null=null;
  private active:Job|null=null;
  private working:Working|null=null;
  private finished:(Job&{buffer:Uint8ClampedArray})[]=[];
  private disposed=false;
  bytes=0;
  paint:HTMLImageElement|null=null;
  readonly paints=new Map<string,HTMLImageElement>();
  private mask:HTMLCanvasElement|null=null;
  private painted:HTMLCanvasElement|null=null;
  get scratchBytes():number{return (this.mask?this.mask.width*this.mask.height*4:0)+(this.painted?this.painted.width*this.painted.height*4:0);}
  readonly sampler:TerrainSampler;
  limit:number;
  size:number;
  readonly notify:()=>void;
  readonly maxQueue:number;
  constructor(sampler:TerrainSampler,limit:number,size:number,notify:()=>void,maxQueue=64){
    this.sampler=sampler;this.limit=limit;this.size=size;this.notify=notify;this.maxQueue=maxQueue;
    if(typeof Worker!=='undefined')try{
      this.worker=new Worker(new URL('./terrain.worker.ts',import.meta.url),{type:'module'});
      this.worker.onmessage=(event:MessageEvent<Job&{buffer:Uint8ClampedArray}>)=>{
        this.active=null;if(this.disposed)return;
        if(event.data.revision===this.revision&&event.data.size===this.size)this.finished.push(event.data);
        this.notify();
      };
      this.worker.onerror=()=>{if(this.active)this.queue.set(this.active.key,this.active);this.active=null;this.worker?.terminate();this.worker=null;this.notify();};
    }catch{this.worker=null;}
  }
  key(x:number,y:number,level:number):string{return level+':'+x+':'+y;}
  get(x:number,y:number,level:number):TerrainChunk|undefined {
    const key=this.key(x,y,level),value=this.cache.get(key);if(value){this.cache.delete(key);this.cache.set(key,value);}return value;
  }
  request(x:number,y:number,level:number):void {
    const key=this.key(x,y,level);if(this.disposed||this.cache.has(key)||this.queue.has(key)||this.active?.key===key||this.working?.key===key||this.finished.some(j=>j.key===key)||this.queue.size>=this.maxQueue)return;
    this.queue.set(key,{key,x,y,level,revision:this.revision,size:this.size});
  }
  get pending():number{return this.queue.size+Number(Boolean(this.active||this.working))+this.finished.length;}
  /** At most 2 ms of generation/upload preparation per scheduling turn; worker owns numeric work. */
  process(budget=2):boolean {
    if(this.disposed)return false;const start=performance.now();let generated=false;
    while(this.finished.length&&performance.now()-start<budget){const job=this.finished.shift()!;if(job.revision===this.revision){this.install(job);generated=true;}}
    if(this.worker){if(!this.active&&this.queue.size){const [key,job]=this.queue.entries().next().value!;this.queue.delete(key);this.active=job;this.worker.postMessage({...job,identity:this.sampler.identity,geography:this.sampler.geography,regions:this.sampler.regions,modeledInfill:this.sampler.modeledInfill});}return generated;}
    if(!this.working&&this.queue.size){const [key,job]=this.queue.entries().next().value!;this.queue.delete(key);this.working={...job,buffer:new Uint8ClampedArray(job.size*job.size*4),row:0};}
    const work=this.working;if(!work)return generated;const span=64*2**work.level,step=span/(work.size-2);
    // Incremental fallback checks the budget once per scanline and resumes the same buffer next frame.
    while(work.row<work.size&&performance.now()-start<budget){const py=work.row++;
      for(let px=0;px<work.size;px++){const color=this.sampler.sample(work.x*span+(px-1)*step,work.y*span+(py-1)*step,step).color,index=(py*work.size+px)*4;
        work.buffer[index]=color[0];work.buffer[index+1]=color[1];work.buffer[index+2]=color[2];work.buffer[index+3]=255;
      }
    }
    if(work.row===work.size){this.finished.push(work);this.working=null;}
    return generated;
  }
  private install(job:Job&{buffer:Uint8ClampedArray}):void {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=job.size;const ctx=canvas.getContext('2d')!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(job.buffer),job.size,job.size),0,0);
    if(this.paints.size&&job.level<=2){
      const span=64*2**job.level,scale=(job.size-2)/span,maskSize=32;
      this.mask??=document.createElement('canvas');this.mask.width=this.mask.height=maskSize;
      this.painted??=document.createElement('canvas');this.painted.width=this.painted.height=job.size;
      const maskContext=this.mask.getContext('2d')!,paintContext=this.painted.getContext('2d')!;
      const samples=Array.from({length:maskSize*maskSize},(_,i)=>this.sampler.materialWeights(job.x*span+(i%maskSize/(maskSize-1)*job.size-1)/scale,job.y*span+(Math.floor(i/maskSize)/(maskSize-1)*job.size-1)/scale));
      const maskPixels=new Uint8ClampedArray(maskSize*maskSize*4);
      ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.35;
      for(let material=0;material<GROUND_MATERIALS.length;material++){
        const image=this.paints.get(GROUND_MATERIALS[material]);if(!image||!samples.some(s=>s[material]>.002))continue;
        for(let i=0;i<samples.length;i++){maskPixels[i*4]=maskPixels[i*4+1]=maskPixels[i*4+2]=255;maskPixels[i*4+3]=Math.round(samples[i][material]*255);}
        maskContext.putImageData(new ImageData(maskPixels,maskSize,maskSize),0,0);
        paintContext.globalCompositeOperation='source-over';paintContext.clearRect(0,0,job.size,job.size);
        const pattern=paintContext.createPattern(image,'repeat');if(!pattern)continue;
        pattern.setTransform(new DOMMatrix([32*scale/image.width,0,0,32*scale/image.height,1-job.x*span*scale,1-job.y*span*scale]));
        paintContext.fillStyle=pattern;paintContext.fillRect(0,0,job.size,job.size);
        paintContext.globalCompositeOperation='destination-in';paintContext.drawImage(this.mask,0,0,job.size,job.size);
        ctx.drawImage(this.painted,0,0);
      }
      ctx.restore();
    }else if(this.paint&&job.level<=2){
      const span=64*2**job.level,worldTile=32,scale=(job.size-2)/span;
      ctx.save();ctx.globalAlpha=.35;ctx.globalCompositeOperation='soft-light';
      // World-anchored UV, shared across chunks and projections, including the one-pixel gutter.
      const pattern=ctx.createPattern(this.paint,'repeat');
      if(pattern){
        pattern.setTransform(new DOMMatrix([worldTile*scale/this.paint.width,0,0,worldTile*scale/this.paint.height,1-job.x*span*scale,1-job.y*span*scale]));
        ctx.fillStyle=pattern;ctx.fillRect(0,0,job.size,job.size);
      }
      ctx.restore();
    }
    const value:TerrainChunk={key:job.key,x:job.x,y:job.y,level:job.level,span:64*2**job.level,canvas,bytes:job.size*job.size*4};
    const previous=this.cache.get(job.key);if(previous){previous.release?.();previous.canvas.width=0;this.bytes-=previous.bytes;}
    this.cache.set(job.key,value);this.bytes+=value.bytes;
    while(this.bytes>this.limit&&this.cache.size){const [key,chunk]=this.cache.entries().next().value!;chunk.release?.();chunk.canvas.width=0;this.bytes-=chunk.bytes;this.cache.delete(key);}
  }
  invalidate():void{this.clearQueued();for(const chunk of this.cache.values()){chunk.release?.();chunk.canvas.width=0;}this.cache.clear();this.bytes=0;}
  invalidateBounds(bounds:readonly ContactBounds[]):void {
    for(const [key,chunk] of this.cache){const gutter=chunk.span/(chunk.canvas.width-2),x=chunk.x*chunk.span,y=chunk.y*chunk.span;
      if(bounds.some(b=>b.maxX>=x-gutter&&b.minX<=x+chunk.span+gutter&&b.maxY>=y-gutter&&b.minY<=y+chunk.span+gutter)){chunk.release?.();chunk.canvas.width=0;this.bytes-=chunk.bytes;this.cache.delete(key);}
    }
  }
  retainLevels(levels:ReadonlySet<number>):void {
    for(const [key,chunk] of this.cache)if(!levels.has(chunk.level)){chunk.release?.();chunk.canvas.width=0;this.bytes-=chunk.bytes;this.cache.delete(key);}
  }
  clearQueued():void {this.revision++;this.queue.clear();this.finished=[];this.working=null;}
  destroy():void {if(this.disposed)return;this.disposed=true;this.worker?.terminate();this.worker=null;this.active=null;this.invalidate();this.paint=null;this.paints.clear();if(this.mask)this.mask.width=0;if(this.painted)this.painted.width=0;this.mask=this.painted=null;}
}
