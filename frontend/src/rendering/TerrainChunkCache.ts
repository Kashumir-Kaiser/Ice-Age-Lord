import type { TerrainSampler } from './TerrainSampler.ts';
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
    if(this.worker){if(!this.active&&this.queue.size){const [key,job]=this.queue.entries().next().value!;this.queue.delete(key);this.active=job;this.worker.postMessage({...job,identity:this.sampler.identity,geography:this.sampler.geography,regions:this.sampler.regions});}return generated;}
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
    if(this.paint&&job.level<=2){
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
  clearQueued():void {this.revision++;this.queue.clear();this.finished=[];this.working=null;}
  destroy():void {if(this.disposed)return;this.disposed=true;this.worker?.terminate();this.worker=null;this.active=null;this.invalidate();this.paint=null;}
}
