import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';
import {staticMapBody} from '../scripts/map-static-body.mjs';
import {svgMapSource} from '../scripts/svg-map-source.mjs';
import {composition} from '../src/rendering/SpriteRegistration.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
const root=new URL('../../',import.meta.url),id='lord-house-repaired';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('map-only smoke removal preserves the chimney, house pixels, registration and original master',async()=>{
 const source=readFileSync(new URL('assets/source/buildings/'+id+'.svg',root));
 assert.equal(hash(source),'e7588350010fe8f04b5ca5b31294d0706d1e47840b36135a941e87c4c59ead2a');
 const original=svgMapSource(new URL('frontend/public/assets/buildings/'+id+'/body.svg',root).pathname).svg;
 const definition=JSON.parse(readFileSync(new URL('assets/map-static-bodies.json',root)))[id];
 const cleaned=staticMapBody(original,{width:480,height:400},definition.removePolygons);
 const render=async svg=>sharp(new Resvg(svg).render().asPng()).ensureAlpha().raw().toBuffer();
 const before=await render(original),after=await render(cleaned);let removed=0;
 for(let y=0;y<400;y++)for(let x=0;x<480;x++){
  const i=(y*480+x)*4;
  if(x<276||x>342||y>=80)assert.deepEqual(after.subarray(i,i+4),before.subarray(i,i+4),`preserved pixel ${x},${y}`);
  if(before[i+3]&&!after[i+3])removed++;
  assert.ok(after[i+3]<=before[i+3],'mask cannot invent scenery');
 }
 assert.ok(removed>400,'the authored smoke region must actually disappear');
 assert.equal(hash(source),hash(readFileSync(new URL('assets/source/buildings/'+id+'.svg',root))));
});

test('registered map sources and SVG failure fallback use the static body while UI art stays original',async()=>{
 const manifest=JSON.parse(readFileSync(new URL('assets/manifest.json',root))),asset=manifest.assets.find(a=>a.assetId===id);
 assert.equal(asset.layers.body,'/assets/buildings/'+id+'/body.svg');
 assert.equal(asset.mapLayers.body,'/assets/map/buildings/'+id+'/body-static.svg');
 for(const mode of ['normal','focus'])assert.deepEqual(composition(asset,mode,true,false,'north').filter(l=>l.role!=='shadow').map(l=>l.role),['base','upper']);
 assert.ok(!composition(asset,'planning',false,false,'north').some(l=>l.role==='body'));
 for(const lod of ['close','district']){
  const entry=asset.mapExports.find(e=>e.role==='body'&&e.lod===lod);assert.equal(entry.source,asset.mapLayers.body);validateMapExport(entry,asset);
  assert.ok(entry.sourceDependencies.some(d=>d.source==='assets/map-static-bodies.json'));
  assert.ok(entry.sourceDependencies.some(d=>d.source==='frontend/public'+asset.layers.body));
  const expected=await sharp(new Resvg(readFileSync(new URL('frontend/public'+asset.mapLayers.body,root)),{fitTo:{mode:'width',value:entry.rasterCanvas.width},font:{loadSystemFonts:false}}).render().asPng()).ensureAlpha().raw().toBuffer();
  const actual=await sharp({create:{width:entry.rasterCanvas.width,height:entry.rasterCanvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:readFileSync(new URL('frontend/public'+entry.path,root)),left:Math.round(entry.trim.x/asset.logicalCanvas.width*entry.rasterCanvas.width),top:Math.round(entry.trim.y/asset.logicalCanvas.height*entry.rasterCanvas.height)}]).ensureAlpha().raw().toBuffer();
  for(let i=0;i<actual.length;i++)if(i%4===3||expected[i-i%4+3])assert.ok(Math.abs(actual[i]-expected[i])<=1,`${lod} registered pixel channel ${i}`);

 }
});
