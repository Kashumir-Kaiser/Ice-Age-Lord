import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {composition,resolveOrientation,spriteRect,orientationAsset} from '../src/rendering/SpriteRegistration.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
const provenance=JSON.parse(readFileSync(new URL('../../docs/implementation/MAP-25D-TOWER-ART.json',import.meta.url)));
test('tower originals remain unchanged and every compass pose is separately authored',()=>{
 for(const id of ['watchtower-preview','elemental-tower-preview']){
  const asset=manifest.assets.find(a=>a.assetId===id);assert.ok(asset);assert.equal(asset.status,'draft');assert.match(asset.definitionId,/^FIXTURE-/);
  const records=provenance.assets.filter(a=>a.assetId===id);assert.equal(records.length,4);assert.equal(new Set(records.map(a=>a.gitBlobSha)).size,4);
  const rect=spriteRect(asset,{x:110,y:170},3);
  for(const orientation of ['north','east','south','west']){
   const record=records.find(r=>r.orientation===orientation),bytes=readFileSync(new URL('../../'+record.source,import.meta.url));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
   assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),record.gitBlobSha);
   assert.equal(resolveOrientation(asset,orientation).missing,false);
   assert.deepEqual(spriteRect(orientationAsset(asset,orientation),{x:110,y:170},3),rect);
   const body=asset.mapExports.find(e=>e.role==='body'&&e.orientation===orientation&&e.lod==='close'&&e.layerPath);
   assert.ok(body);assert.equal(body.source,record.source);validateMapExport(body,asset);
   assert.ok(composition(asset,'planning',true,true,orientation).every(l=>l.role==='base'||l.role==='shadow'));
  }
  assert.ok(!asset.equivalentOrientations?.length,'asymmetric entry cannot be fabricated by equivalent poses');
 }
});
test('tower preview UI stays small and SVG fallback remains path-only with a registered default body',()=>{
 for(const id of ['watchtower-preview','elemental-tower-preview']){
  const asset=manifest.assets.find(a=>a.assetId===id),icon=readFileSync(new URL('../public'+asset.layers.uiIcon,import.meta.url)),body=readFileSync(new URL('../public'+asset.layers.body,import.meta.url),'utf8');
  assert.ok(icon.length<30000,'preview cards must not request full detailed body SVGs');
  assert.ok(!/<image\b/.test(body));assert.match(body,/viewBox="0 0 480 400"/);
  const fallback=asset.mapExports.find(e=>e.role==='body'&&e.orientation==='north'&&!e.layerPath&&e.lod==='close');assert.ok(fallback);validateMapExport(fallback,asset);
  assert.throws(()=>validateMapExport({...fallback,orientation:'west'},asset),'default fallback cannot claim an authored opposite pose');
 }
});
