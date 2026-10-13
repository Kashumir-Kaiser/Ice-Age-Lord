import { TerrainSampler } from './TerrainSampler.ts';
import type { Geography, TerrainRegion } from './TerrainSampler.ts';
type Job={key:string;x:number;y:number;level:number;size:number;revision:number;identity:string;geography?:Geography;regions?:readonly TerrainRegion[]};
self.onmessage=(event:MessageEvent<Job>)=>{
 const job=event.data,sampler=new TerrainSampler(job.identity,job.geography,job.regions),span=64*2**job.level,step=span/(job.size-2);
 const buffer=new Uint8ClampedArray(job.size*job.size*4);
 for(let y=0;y<job.size;y++)for(let x=0;x<job.size;x++){
  const color=sampler.sample(job.x*span+(x-1)*step,job.y*span+(y-1)*step,step).color,index=(y*job.size+x)*4;
  buffer[index]=color[0];buffer[index+1]=color[1];buffer[index+2]=color[2];buffer[index+3]=255;
 }
 self.postMessage({...job,buffer}, {transfer:[buffer.buffer]});
};
