import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {Resvg} from '@resvg/resvg-js';
import {composition,artPolygon} from '../src/rendering/SpriteRegistration.ts';
import {pointInPolygon} from '../src/rendering/MapPicking.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';

const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
const tower=manifest.assets.find(a=>a.assetId==='fixture-tall-tower');
test('authored tower footing and shaft/roof reconstruct its original body without horizontal clipping',async()=>{
 for(const width of [384,192]){
  const png=role=>new Resvg(readFileSync(new URL('../public'+tower.layers[role],import.meta.url)),{fitTo:{mode:'width',value:width}}).render().asPng();
  const body=await sharp(png('body')).ensureAlpha().raw().toBuffer();
  const layered=await sharp(png('base')).composite([{input:png('upper')}]).ensureAlpha().raw().toBuffer();
  assert.equal(layered.length,body.length);
  for(let i=0;i<body.length;i++)assert.ok(Math.abs(body[i]-layered[i])<=1,`composition pixel channel ${i}`);
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
