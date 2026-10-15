import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {composition,resolveOrientation,orientationAsset} from '../src/rendering/SpriteRegistration.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const a=JSON.parse(read('assets/manifest.json')).assets.find(a=>a.assetId==='lord-house-repaired');

test('repaired-house authored originals remain intact and only their actual north pose is registered',()=>{
 const provenance=JSON.parse(read('docs/implementation/MAP-25D-HOUSE-LAYERS.json'));
 for(const e of provenance.entries)assert.equal(createHash('sha256').update(read(e.source)).digest('hex'),e.sha256);
 assert.equal(a.composition,'architectural');assert.equal(a.orientation,'north');
 assert.deepEqual(Object.keys(a.orientationViews),['north']);assert.ok(!a.equivalentOrientations?.length);
 const fallback=resolveOrientation(a,'east');assert.equal(fallback.missing,true);assert.deepEqual(fallback.layers,a.orientationViews.north);
 assert.deepEqual(orientationAsset(a,'east').occlusionRegion.upper,a.orientationRegions.north.upper);
 for(const mode of ['normal','focus']){
  const layers=composition(a,mode,true,false,'north');assert.ok(!layers.some(l=>l.role==='body'));
  assert.equal(layers.find(l=>l.role==='base').alpha,1);assert.equal(layers.find(l=>l.role==='upper').alpha,mode==='focus'?.22:1);
 }
 assert.deepEqual(composition(a,'planning',true,false,'north').map(l=>l.role),['shadow','base']);
});

test('authored base and complete upper compose the exact registered whole-body fallback at both LODs',async()=>{
 for(const lod of ['close','district']){
  const entries=['base','upper','body'].map(role=>a.mapExports.find(e=>e.authoredArchitecture&&e.role===role&&e.lod===lod));
  for(const e of entries){assert.ok(e);validateMapExport(e,a);}
  assert.ok(entries[0].trim.y>200,'no roof, chimney or full facade can enter the low footing layer');
  const restore=async parts=>sharp({create:{width:entries[0].rasterCanvas.width,height:entries[0].rasterCanvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts.map(e=>({input:read('frontend/public'+e.path),left:Math.round(e.trim.x/a.logicalCanvas.width*e.rasterCanvas.width),top:Math.round(e.trim.y/a.logicalCanvas.height*e.rasterCanvas.height)}))).ensureAlpha().raw().toBuffer();
  const composed=await restore(entries.slice(0,2)),fallback=await restore([entries[2]]);
  for(let i=0;i<composed.length;i++)assert.ok(Math.abs(composed[i]-fallback[i])<=1,`${lod} fallback pixel channel ${i}`);
 }
});
