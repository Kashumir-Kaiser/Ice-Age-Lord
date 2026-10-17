import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {Resvg} from '@resvg/resvg-js';
import {composition,createCompositionCache,artPolygon} from '../src/rendering/SpriteRegistration.ts';
import {pointInPolygon} from '../src/rendering/MapPicking.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
import {splitMapArchitecture} from '../scripts/split-map-architecture.mjs';

const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
const tower=manifest.assets.find(a=>a.assetId==='fixture-tall-tower');
test('composition cache reuses only identical asset and render-state keys',()=>{
 const cache=createCompositionCache(),house=manifest.assets.find(a=>a.assetId==='lord-house-damaged'),other=manifest.assets.find(a=>a.assetId==='fixture-tall-tower');
 const base=cache(house,'normal',false,false,'north');
 assert.strictEqual(cache(house,'normal',false,false,'north'),base);
 assert.notStrictEqual(cache(house,'normal',false,true,'north'),base);
 assert.notStrictEqual(cache(house,'focus',false,false,'north'),base);
 assert.notStrictEqual(cache(house,'focus',true,false,'north'),cache(house,'focus',false,false,'north'));
 assert.notStrictEqual(cache(house,'normal',false,false,'east'),base);
 assert.notStrictEqual(cache(other,'normal',false,false,'north'),base);
 assert.deepEqual(base,composition(house,'normal',false,false,'north'));
 assert.deepEqual(cache(house,'focus',true,false,'north'),composition(house,'focus',true,false,'north'));
});
test('renderer composition cache persists across render calls',()=>{
 const renderer=readFileSync(new URL('../src/rendering/MapRenderer.ts',import.meta.url),'utf8');
 assert.match(renderer,/private readonly compositionForRender=createCompositionCache\(\);/);
 const renderBody=renderer.slice(renderer.indexOf('private render():void{'),renderer.indexOf('private architectureTextureKey('));
 assert.doesNotMatch(renderBody,/createCompositionCache\(\)/);
 assert.match(renderBody,/this\.compositionForRender\(/);
});
test('authored tower footing and shaft/roof reconstruct its original body without horizontal clipping',async()=>{
 for(const width of [384,192]){
  const png=role=>new Resvg(readFileSync(new URL('../public'+tower.layers[role],import.meta.url)),{fitTo:{mode:'width',value:width}}).render().asPng();
  const body=await sharp(png('body')).ensureAlpha().raw().toBuffer();
  const layered=await sharp(png('base')).composite([{input:png('upper')}]).ensureAlpha().raw().toBuffer();
  assert.equal(layered.length,body.length);
  for(let i=0;i<body.length;i++)assert.ok(Math.abs(body[i]-layered[i])<=1,`composition pixel channel ${i}`);
 }
});
test('painted house plinth partitions reconstruct every authored pose at both LODs without changing masters',async()=>{
 const house=manifest.assets.find(a=>a.assetId==='lord-house-damaged');
 const definition=JSON.parse(readFileSync(new URL('../../assets/map-architecture.json',import.meta.url)))[house.assetId];
 assert.equal(house.composition,'architectural');
 for(const orientation of ['north','east','south','west'])for(const lod of ['close','district']){
  const body=house.mapExports.find(e=>e.role==='body'&&e.orientation===orientation&&e.lod===lod);
  const original=readFileSync(new URL('../public'+body.path,import.meta.url)),copy=Buffer.from(original);
  const parts=await splitMapArchitecture(original,body,definition[orientation]);assert.deepEqual(original,copy);
  const restore=async png=>sharp({create:{width:body.rasterCanvas.width,height:body.rasterCanvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(png).ensureAlpha().raw().toBuffer();
  const place=e=>({input:readFileSync(new URL('../public'+e.path,import.meta.url)),left:Math.round(e.trim.x/house.logicalCanvas.width*body.rasterCanvas.width),top:Math.round(e.trim.y/house.logicalCanvas.height*body.rasterCanvas.height)});
  const entries=parts.map(p=>house.mapExports.find(e=>e.role===p.role&&e.orientation===orientation&&e.lod===lod&&e.layerPath));
  for(const e of entries){assert.ok(e);validateMapExport(e,house);}
  const expected=await restore([place(body)]),actual=await restore(entries.map(place));
  for(let i=0;i<actual.length;i++)assert.ok(Math.abs(expected[i]-actual[i])<=1,`${orientation}/${lod} reconstruction ${i}`);
  const focus=composition(house,'focus',true,false,orientation);assert.equal(focus.find(l=>l.role==='base').alpha,1);assert.equal(focus.find(l=>l.role==='upper').alpha,.22);
 }
});
test('tower focus preserves its footing and planning omits the entire shaft/roof in every supported pose',()=>{
 assert.equal(tower.composition,'architectural');
 for(const orientation of ['north','east','south','west']){
  const focused=composition(tower,'focus',true,false,orientation);
  assert.equal(focused.find(l=>l.role==='base').alpha,1);
  assert.equal(focused.find(l=>l.role==='upper').alpha,.22);
  assert.ok(!focused.some(l=>l.role==='body'));
  assert.deepEqual(composition(tower,'planning',true,true,orientation).map(l=>l.role),['shadow','base']);
 }
 const rect={x:0,y:0,width:240,height:200},upper=artPolygon(tower.occlusionRegion.upper,rect);
 assert.equal(pointInPolygon({x:120,y:170},upper),false,'footing alone cannot cause a focus fade');
 assert.equal(pointInPolygon({x:120,y:100},upper),true);
 for(const lod of ['close','district'])for(const role of ['base','upper']){
  const entry=tower.mapExports.find(e=>e.role===role&&e.lod===lod);
  assert.ok(entry);assert.equal(entry.source,tower.layers[role]);validateMapExport(entry,tower);
 }
});
test('painted tower architecture reconstructs the registered pose and preserves plinth opacity in focus',async()=>{
 for(const id of ['watchtower-preview','elemental-tower-preview']){
  const asset=manifest.assets.find(a=>a.assetId===id);assert.equal(asset.composition,'architectural');
  for(const orientation of ['north','east','south','west'])for(const lod of ['close','district']){
   const registered=asset.orientationViews[orientation].body;
   const body=asset.mapExports.find(e=>e.role==='body'&&e.orientation===orientation&&e.lod===lod&&(e.layerPath??e.source)===registered);
   const entries=['base','upper'].map(role=>asset.mapExports.find(e=>e.architecturePart&&e.role===role&&e.orientation===orientation&&e.lod===lod));
   for(const e of entries){assert.ok(e);assert.equal(e.source,body.source);validateMapExport(e,asset);}
   assert.ok(entries[0].trim.y>250,'the retained plinth cannot contain a tall shaft or roof');
   const place=e=>({input:readFileSync(new URL('../public'+e.path,import.meta.url)),left:Math.round(e.trim.x/asset.logicalCanvas.width*body.rasterCanvas.width),top:Math.round(e.trim.y/asset.logicalCanvas.height*body.rasterCanvas.height)});
   const restore=async parts=>sharp({create:{width:body.rasterCanvas.width,height:body.rasterCanvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts.map(place)).ensureAlpha().raw().toBuffer();
   const original=await restore([body]),composed=await restore(entries);
   for(let i=0;i<original.length;i++)assert.ok(Math.abs(original[i]-composed[i])<=1,`${id}/${orientation}/${lod} pixel channel ${i}`);
   const focused=composition(asset,'focus',true,false,orientation);assert.equal(focused.find(l=>l.role==='base').alpha,1);assert.equal(focused.find(l=>l.role==='upper').alpha,.22);
   assert.deepEqual(composition(asset,'planning',true,true,orientation).map(l=>l.role),['shadow','base']);
  }
 }
});
