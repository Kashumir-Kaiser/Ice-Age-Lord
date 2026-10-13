import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainChunkCache } from '../src/rendering/TerrainChunkCache.ts';
import { TerrainSampler } from '../src/rendering/TerrainSampler.ts';

test('chunk cache cancels stale worker output, bounds queued work and releases evicted resources', () => {
  const original={Worker:globalThis.Worker,document:globalThis.document,ImageData:globalThis.ImageData,DOMMatrix:globalThis.DOMMatrix};
  const workers=[],fills=[],transforms=[];
  class WorkerStub {
    constructor(){workers.push(this);}
    postMessage(job){this.job=job;}
    terminate(){this.terminated=true;}
    finish(job=this.job){this.onmessage({data:{...job,buffer:new Uint8ClampedArray(job.size*job.size*4)}});}
  }
  globalThis.Worker=WorkerStub;
  globalThis.ImageData=class {constructor(data,width,height){Object.assign(this,{data,width,height});}};
  globalThis.DOMMatrix=class {constructor(values){transforms.push(values);}};
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({putImageData(){},save(){},restore(){},createPattern:()=>({setTransform(){}}),fillRect:(...args)=>fills.push(args)})})};
  try {
    const cache=new TerrainChunkCache(new TerrainSampler('test'),8*8*4,8,()=>{},2);
    cache.paint={width:256,height:256};
    cache.request(-1,0,0);cache.request(0,0,0);cache.request(1,0,0);
    assert.equal(cache.pending,2,'queue cannot grow past its bound');
    cache.process();const stale=workers[0].job;cache.clearQueued();workers[0].finish(stale);cache.process();
    assert.equal(cache.get(-1,0,0),undefined,'departed revision cannot install a chunk');
    cache.request(-1,0,0);cache.process();workers[0].finish();cache.process();
    const first=cache.get(-1,0,0);assert.ok(first);let released=0;first.release=()=>released++;
    assert.deepEqual(fills.at(-1),[0,0,8,8],'paint covers every pixel, including both gutters');
    const negativeTransform=transforms.at(-1);
    cache.request(0,0,0);cache.process();workers[0].finish();cache.process();
    const nextTransform=transforms.at(-1);
    const worldTilePixels=32/256;
    assert.equal((negativeTransform[4]-nextTransform[4])/(negativeTransform[0]/worldTilePixels),64,'adjacent paint UVs differ by exactly one world chunk');
    assert.equal(cache.get(-1,0,0),undefined);assert.equal(released,1);assert.equal(first.canvas.width,0);
    assert.ok(cache.bytes<=cache.limit);
    cache.request(1,0,0);cache.process();const departed=workers[0].job;cache.destroy();workers[0].finish(departed);
    assert.equal(cache.pending,0);assert.equal(cache.bytes,0);assert.equal(workers[0].terminated,true);
  } finally {
    for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
});
