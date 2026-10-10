import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve(new URL('../',import.meta.url).pathname);
const repo=resolve(root,'..');
const read=(path)=>readFileSync(resolve(repo,path),'utf8');
const manifest=JSON.parse(read('assets/manifest.json'));
const expected=[
  'tomb-entry','lord-house-damaged','lord-house-repaired','supply-crate',
  'polar-farmhouse-l01','opening-palisade-wall','opening-timber-gate',
  'opening-simple-heater','opening-simple-kitchen','opening-woodshop',
  'opening-tailor','opening-oreworks','opening-forge',
  'opening-medical-station','opening-small-shelter'
];

function verifyGroupStructure(markup,id){
  const opening=(markup.match(/<g(?:\s|>)/g)||[]).length;
  const closing=(markup.match(/<\/g>/g)||[]).length;
  assert.equal(opening,closing,id+': SVG layer groups must balance');
  assert.match(markup,/^<svg[^>]+viewBox="0 0 480 400"/,id+': canvas should match registration');
  assert.ok(!/<image\b/i.test(markup),id+': artwork may not embed a raster image');
  assert.ok(markup.trimEnd().endsWith('</svg>'),id+': complete SVG document');
}
test('source and public manifests agree and ink building variants use optimized registered LODs',()=>{
  assert.deepEqual(JSON.parse(read('frontend/public/assets/manifest.json')),manifest);
  for(const id of expected){
    const entry=manifest.assets.find(x=>x.assetId===id);
    assert.ok(entry,id+': missing registration');
    assert.equal(entry.status,'draft');
    assert.deepEqual(entry.logicalCanvas,{width:480,height:400});
    assert.deepEqual(entry.groundAnchor,{x:.5,y:.82});
    const source=read(entry.source);
    verifyGroupStructure(source,id+':master');
    for(const layer of ['body','base','upper','shadow','uiIcon']){
      const url=entry.layers[layer];
      assert.ok(url&&existsSync(resolve(repo,'frontend/public'+url)),id+':'+layer);
      verifyGroupStructure(read('frontend/public'+url),id+':'+layer);
    }
    const district=entry.lodVariants.district.body;
    assert.ok(district.endsWith('/district.svg'),id+': compact LOD missing');
    const reduced=read('frontend/public'+district);
    verifyGroupStructure(reduced,id+':district');
    const full=read('frontend/public'+entry.layers.body);
    assert.ok(reduced.length<full.length*.73,id+': district art needs meaningful size reduction');
    assert.equal(entry.lodVariants.regional.body,district);
  }
});
test('character SVGs preserve original style and are wired to the front end',()=>{
  const chars=manifest.characterArt||[];
  assert.equal(chars.length,2);
  const app=read('frontend/src/App.tsx');
  for(const ch of chars){
    assert.equal(ch.style,'winter-ink');
    assert.equal(ch.characterId,'PLAYER-LI-LAN');
    assert.ok(existsSync(resolve(repo,ch.source)));
    assert.ok(existsSync(resolve(repo,'frontend/public'+ch.src)));
    const source=read(ch.source);
    assert.ok(source.includes('viewBox="0 0 '+ch.canvas.width+' '+ch.canvas.height+'"'));
    assert.ok(!/<image\b/.test(source));
  }
  assert.ok(app.includes('/assets/characters/li-lan-t0-portrait.svg'));
});
test('unbuilt opening variants do not appear as owned T0 structures',()=>{
  const demo=read('frontend/src/game/DemoGameClient.ts');
  assert.ok(demo.includes('const openingBuildings = sites.map'));
  const data=read('frontend/src/demoData.ts');
  for(const id of ['opening-timber-gate','opening-palisade-wall','polar-farmhouse-l01']){
    assert.ok(!data.includes(id),'no new owned T0 structure: '+id);
  }
  assert.ok(demo.includes("status:'fixture-only'"));
});
