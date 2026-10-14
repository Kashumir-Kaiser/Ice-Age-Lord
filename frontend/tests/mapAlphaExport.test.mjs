import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMapAlpha} from '../scripts/normalize-map-alpha.mjs';
test('map derivative matte cleanup removes saturated border contamination without changing master or interior art',()=>{
 const pixels=Buffer.alloc(16*16*4);for(let y=1;y<15;y++)for(let x=1;x<15;x++){const i=(y*16+x)*4;pixels.set([96,120,128,255],i);}
 pixels.set([0,0,255,200],(1*16+1)*4);pixels.set([0,0,255,255],(8*16+8)*4);pixels.set([255,0,255,1],0);
 const original=Buffer.from(pixels),out=normalizeMapAlpha(pixels,16,16).data;
 assert.deepEqual(pixels,original);assert.deepEqual(Array.from(out.subarray(0,4)),[0,0,0,0]);
 const edge=(1*16+1)*4;assert.deepEqual(Array.from(out.subarray(edge,edge+4)),[96,120,128,200]);
 const center=(8*16+8)*4;assert.deepEqual(out.subarray(center,center+4),pixels.subarray(center,center+4));
});
