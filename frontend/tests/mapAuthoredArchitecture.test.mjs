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
const l30=JSON.parse(read('assets/manifest.json')).assets.find(a=>a.assetId==='lord-house-l30');

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

test('L30 north-only map layers retain the original body, UI shadow and ART-ONLY footprint',()=>{
 const provenance=JSON.parse(read('docs/implementation/MAP-25D-L30-LAYERS.json'));
 for(const entry of provenance.generation.outputs)assert.equal(createHash('sha256').update(read(entry.path)).digest('hex'),entry.sha256);
 assert.equal(l30.orientation,'north');assert.deepEqual(Object.keys(l30.orientationViews),['north']);
 assert.ok(!l30.equivalentOrientations?.length);
 assert.equal(resolveOrientation(l30,'east').missing,true);
 assert.equal(l30.layers.body,'/assets/buildings/lord-house-l30/body.svg');
 assert.equal(l30.layers.shadow,'/assets/buildings/lord-house-repaired/shadow.svg');
 assert.equal(l30.mapLayers.shadow,'/assets/map/buildings/lord-house-l30/shadow-ground.svg');
 assert.deepEqual(l30.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(l30.compatiblePhysicalFootprint,{assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',widthM:4,depthM:4});
 assert.deepEqual(l30.artFootprint,[[.16,.72],[.5,.9],[.84,.72],[.5,.54]]);
 for(const mode of ['normal','focus']){
  const layers=composition(l30,mode,true,false,'north');
  assert.deepEqual(layers.filter(x=>x.role!=='shadow').map(x=>x.role),mode==='normal'?['base','upper']:['base','upper']);
  assert.equal(layers.find(x=>x.role==='upper').alpha,mode==='focus'?.22:1);
 }
 assert.deepEqual(composition(l30,'planning',true,false,'north').map(x=>x.role),['shadow','base']);
});

test('L30 authored base and upper reproduce the registered complete body at both LODs',async()=>{
 for(const lod of ['close','district']){
  const entries=['base','upper','body'].map(role=>l30.mapExports.find(e=>e.authoredArchitecture&&e.role===role&&e.lod===lod));
  for(const e of entries){assert.ok(e);validateMapExport(e,l30);assert.ok(e.sourceDependencies.some(d=>d.source==='assets/source/map-buildings/lord-house-l30-'+(e.role==='base'?'foundation':'upper')+'.png')||e.role==='body');}
  assert.ok(entries[0].trim.y>190,'the low plinth remains below the body wall edge');
  const restore=async parts=>sharp({create:{width:entries[0].rasterCanvas.width,height:entries[0].rasterCanvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts.map(e=>({input:read('frontend/public'+e.path),left:Math.round(e.trim.x/l30.logicalCanvas.width*e.rasterCanvas.width),top:Math.round(e.trim.y/l30.logicalCanvas.height*e.rasterCanvas.height)}))).ensureAlpha().raw().toBuffer();
  const composed=await restore(entries.slice(0,2)),fallback=await restore([entries[2]]);
  for(let i=0;i<composed.length;i++)assert.ok(Math.abs(composed[i]-fallback[i])<=1,`${lod} L30 fallback pixel channel ${i}`);
 }
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
