import test from 'node:test';
import assert from 'node:assert/strict';
import {periodicMaterial} from '../scripts/periodic-material.mjs';
import {TerrainSampler} from '../src/rendering/TerrainSampler.ts';

test('material exports share opposite edge pixels without changing the source or quiet interior',()=>{
 const width=64,height=64,channels=3,source=Buffer.from(Array.from({length:width*height*channels},(_,i)=>(i*13+i%17)%256)),before=Buffer.from(source),out=periodicMaterial(source,width,height,channels,8);
 assert.deepEqual(source,before);
 for(let y=0;y<height;y++)assert.deepEqual(out.subarray(y*width*3,y*width*3+3),out.subarray((y*width+width-1)*3,(y*width+width)*3));
 for(let x=0;x<width;x++)assert.deepEqual(out.subarray(x*3,x*3+3),out.subarray(((height-1)*width+x)*3,((height-1)*width+x)*3+3));
 const center=(32*width+32)*3;assert.deepEqual(out.subarray(center,center+3),source.subarray(center,center+3));
});
test('continuous material transitions stay normalized and projected water is the only LIVE ice source',()=>{
 const empty=new TerrainSampler('save',undefined,[],false),water=new TerrainSampler('save',undefined,[{x:0,y:0,width:100,depth:100,kind:'ice',ratio:1}],false);
 for(const sampler of [empty,water])for(const x of [-100,-32,0,31.999,32,100]){
  const weights=sampler.materialWeights(x,0);assert.equal(weights.length,10);assert.ok(weights.every(w=>w>=0&&w<=1));assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-9);
  const adjacent=sampler.materialWeights(x+.001,0);assert.ok(weights.every((w,i)=>Math.abs(w-adjacent[i])<.001));
 }
 assert.equal(empty.materialWeights(0,0).slice(8).reduce((a,b)=>a+b,0),0);assert.equal(water.materialWeights(0,0).slice(8).reduce((a,b)=>a+b,0),1);
});
