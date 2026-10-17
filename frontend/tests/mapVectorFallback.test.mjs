import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {registeredCompositeVectorFallback} from '../scripts/map-vector-fallback.mjs';

const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');

test('registered vector fallback is deterministic and preserves downsampled transparent and partial alpha',async()=>{
 const pixels=Buffer.alloc(8*8*4);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const i=(y*8+x)*4;pixels[i]=x*31;pixels[i+1]=y*29;pixels[i+2]=180;
  pixels[i+3]=x<2?0:x<5?128:255;
 }
 const input=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer();
 const first=await registeredCompositeVectorFallback(input,8,8),again=await registeredCompositeVectorFallback(input,8,8);
 assert.equal(first,again);assert.doesNotMatch(first,/<image\b|data:image|href=/i);
 const actual=await sharp(Buffer.from(first)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const expected=await sharp(input).resize(4,4,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<4;y++)for(let x=0;x<4;x++)assert.equal(actual.data[((y*2)*8+x*2)*4+3],expected[(y*4+x)*4+3]);
 assert.ok([...expected.filter((_,i)=>i%4===3)].some(a=>a===0));
 assert.ok([...expected.filter((_,i)=>i%4===3)].some(a=>a>0&&a<255));
 assert.ok([...expected.filter((_,i)=>i%4===3)].some(a=>a===255));
 await assert.rejects(registeredCompositeVectorFallback(input,7,8),/positive even integers/);
});

test('Tomb vector map fallback has a registered source hash and no embedded raster',()=>{
 const tomb=JSON.parse(read('assets/manifest.json')).assets.find(asset=>asset.assetId==='tomb-entry');
 const source=tomb.mapExports?.find(item=>item.source===tomb.mapLayers?.body&&item.role==='body');
 assert.ok(source,'Tomb map fallback source hash must be registered');
 assert.equal(sha(read('frontend/public'+source.source)),source.sourceSha256);
 const svg=read('frontend/public'+source.source).toString('utf8');
 assert.match(svg,/^<svg\b/);assert.doesNotMatch(svg,/<image\b|data:image|href=/i);
 assert.ok(source.sourceDependencies.some(item=>item.source==='frontend/scripts/map-vector-fallback.mjs'));
});
