import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = resolve(new URL('../', import.meta.url).pathname);
async function loadTypeScript(relativePath) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
}
const projection = await loadTypeScript('src/territory/projection.ts');
const placement = await loadTypeScript('src/territory/placement.ts');
const unitGroups = await loadTypeScript('src/game/unitGroups.ts');
const assetRegistry = await loadTypeScript('src/assets/assetRegistry.ts');

test('2:1 dimetric ground transform has an exact inverse at source anchors and distant coordinates', () => {
  for (const point of [{x:0,y:0},{x:40,y:20},{x:30,y:-10},{x:-20,y:30},{x:25000,y:-25000}]) {
    const result = projection.isoToWorld(projection.worldToIso(point));
    assert.ok(Math.abs(result.x-point.x)<1e-9);
    assert.ok(Math.abs(result.y-point.y)<1e-9);
  }
});

test('screen picking and cursor anchored zoom preserve the same world point at desktop and mobile sizes', () => {
  for (const viewport of [{width:1280,height:720},{width:390,height:520}]) {
    const camera={x:13,y:-8,zoom:.7};
    const screen={x:viewport.width*.31,y:viewport.height*.72};
    const before=projection.screenToWorld(screen,camera,viewport);
    const next=projection.zoomAtScreenPoint(camera,screen,viewport,1.55);
    const after=projection.screenToWorld(screen,next,viewport);
    assert.ok(Math.abs(before.x-after.x)<1e-8);
    assert.ok(Math.abs(before.y-after.y)<1e-8);
  }
});

test('source 10 m heat circle does not cover the fixed house, supply or tomb', () => {
  const footprint={kind:'rectangle',widthM:4,depthM:4,provenance:'frontend-fixture',assumptionId:'test',note:'test'};
  assert.equal(placement.footprintHeatRelation({x:0,y:0},{...footprint,widthM:2,depthM:2},'north',10,true),'inside');
  assert.equal(placement.footprintHeatRelation({x:40,y:20},footprint,'north',10,true),'outside');
  assert.equal(placement.footprintHeatRelation({x:30,y:-10},footprint,'north',10,true),'outside');
  assert.equal(placement.footprintHeatRelation({x:-20,y:30},footprint,'north',10,true),'outside');
  assert.equal(placement.footprintHeatRelation({x:0,y:0},footprint,'north',0,false),'off');
});

test('placement reports overlap and unknown eligibility separately; snapping stays in source metres', () => {
  const footprint={kind:'rectangle',widthM:4,depthM:4,provenance:'frontend-fixture',assumptionId:'test',note:'test'};
  const existing=[{id:'known-house',name:'Known house',x:10,y:10,orientation:'north',footprint}];
  const blocked=placement.validatePlacement({point:{x:11,y:10},footprint,orientation:'east',heatRadiusM:0,heatActive:false,existing});
  assert.equal(blocked.blockers.length,1);
  assert.equal(blocked.heat,'off');
  assert.ok(blocked.warnings.some(warning=>warning.includes('chưa có nguồn')));
  assert.deepEqual(placement.snapPlanningPoint({x:1.6,y:-2.4}),{x:2,y:-2});
  assert.equal(placement.footprintHeatRelation({x:9,y:0},footprint,'north',10,true),'partial');
  const allowedUnknown=placement.validatePlacement({point:{x:50,y:50},footprint,orientation:'north',heatRadiusM:10,heatActive:true,existing:[]});
  assert.equal(allowedUnknown.blockers.length,0);
  assert.equal(allowedUnknown.heat,'outside');
});

test('race filter tabs appear only for races with living units', () => {
  const groups=[
    {id:'h1',name:'Hero',raceId:'hero',raceLabel:'Herói',alive:1,available:1,role:'hero'},
    {id:'u1',name:'Undead',raceId:'undead',raceLabel:'Undead',alive:3,available:2,role:'unit'},
    {id:'h0',name:'Dead hero',raceId:'hero',raceLabel:'Herói',alive:0,available:0,role:'hero'},
  ];
  assert.deepEqual(unitGroups.visibleRaceFilters(groups),[{id:'hero',label:'Herói'},{id:'undead',label:'Undead'}]);
  assert.deepEqual(unitGroups.visibleRaceFilters([]),[]);
  assert.equal(unitGroups.livingUnitGroups(groups).length,2);
});

test('registered original SVG layers exist and match each manifest canvas', () => {
  const repo=resolve(root,'..');
  const manifest=JSON.parse(readFileSync(resolve(repo,'assets/manifest.json'),'utf8'));
  assert.deepEqual(manifest.assets.filter(asset=>asset.status==='placeholder').map(asset=>asset.assetId).sort(),['fixture-fire-max','fixture-tall-tower']);
  assert.equal(manifest.assets.filter(asset=>asset.status==='draft'&&asset.assetId.startsWith('survival-fire-l')).length,6);
  assert.deepEqual(manifest.fireProgression.map(stage=>stage.minLevel),[1,6,11,16,21,26]);
  assert.deepEqual(manifest.fireProgression.map(stage=>stage.maxLevel),[5,10,15,20,25,30]);
  for (const asset of manifest.assets) {
    assert.ok(asset.assetId&&asset.definitionId&&asset.orientation&&asset.revision);
    assert.ok(asset.groundAnchor&&asset.artFootprint&&asset.visualBounds&&asset.occlusionRegion&&asset.drawDepthAnchor);
    assert.ok(['placeholder','draft'].includes(asset.status));
    assert.ok(existsSync(resolve(repo,asset.source)));
    for (const file of new Set([...Object.values(asset.layers),...Object.values(asset.lodVariants).flatMap(lod=>Object.values(lod))].filter(value=>typeof value==='string'))) {
      const path=resolve(repo,'frontend/public',file.slice(1));
      assert.ok(existsSync(path),`${asset.assetId}: ${file}`);
      const viewBox=readFileSync(path,'utf8').match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
      assert.deepEqual(viewBox,[0,0,asset.logicalCanvas.width,asset.logicalCanvas.height]);
    }
  }
});


test('painted Survival Fire stages use independent registered true-vector art and source-neutral visual scaling', () => {
  const repo=resolve(root,'..');
  const manifest=JSON.parse(readFileSync(resolve(repo,'assets/manifest.json'),'utf8'));
  const stages=manifest.fireProgression;
  assert.deepEqual(stages.map(stage=>stage.minLevel),[1,6,11,16,21,26]);
  assert.deepEqual(stages.map(stage=>stage.maxLevel),[5,10,15,20,25,30]);
  const assets=stages.map(stage=>manifest.assets.find(asset=>asset.assetId===stage.assetId));
  assert.ok(assets.every(Boolean));
  let previousScale=0;
  for (const [index,asset] of assets.entries()) {
    assert.equal(asset.variant,'winter-ink-painted-true-vector-v2');
    assert.deepEqual(asset.logicalCanvas,{width:480,height:400});
    assert.deepEqual(asset.groundAnchor,{x:.5,y:.82});
    assert.ok(asset.presentationScale>previousScale,'Later fire forms must remain visually distinct in size.');
    previousScale=asset.presentationScale;
    assert.equal(asset.status,'draft');
    for (const layer of ['body','base','upper','shadow','uiIcon','vfx']) {
      const url=asset.layers[layer];
      assert.ok(typeof url==='string'&&url.startsWith('/assets/buildings/'));
      const markup=readFileSync(resolve(repo,'frontend/public'+url),'utf8');
      assert.match(markup,/<svg[^>]*viewBox="0 0 480 400"/);
      assert.ok(!markup.includes('<image'), 'SVG layers must not embed raster images.');
      if (layer==='vfx') assert.ok(markup.includes('<path'), 'Active fire must be separately switchable.');
      if (layer==='upper'&&index>0) assert.ok(markup.includes('<path'), 'Tall stages require separate upper geometry.');
    }
  }
  const sprite=readFileSync(resolve(root,'src/territory/BuildingSprite.tsx'),'utf8');
  assert.ok(sprite.includes('asset?.presentationScale ?? 1'));
  assert.match(sprite,/activeEffect && vfx/);
  assert.match(sprite,/mode === 'planning' && !missing && asset && base/);
});

test('ink architecture exports are registered and distinct from T0 ownership', () => {
  const repo=resolve(root,'..');
  const manifest=JSON.parse(readFileSync(resolve(repo,'assets/manifest.json'),'utf8'));
  const names=['tomb-entry','lord-house-damaged','lord-house-repaired','supply-crate','polar-farmhouse-l01','opening-palisade-wall','opening-timber-gate'];
  for (const id of names) {
    const asset=manifest.assets.find(item=>item.assetId===id);
    assert.ok(asset, id);
    assert.equal(asset.status,'draft');
    assert.deepEqual(asset.logicalCanvas,{width:480,height:400});
    for (const layer of ['body','base','upper','shadow','uiIcon']) {
      const src=readFileSync(resolve(repo,'frontend/public'+asset.layers[layer]),'utf8');
      assert.match(src,/<svg[^>]*viewBox="0 0 480 400"/);
      assert.ok(!/<image\b/.test(src), id + ': no raster-backed SVG');
    }
  }
  const clientSource=readFileSync(resolve(root,'src/game/DemoGameClient.ts'),'utf8');
  assert.ok(clientSource.includes("visualState: site.id === 'house' ? 'damaged'"));
  assert.ok(clientSource.includes("status:'fixture-only'"));
  assert.ok(clientSource.includes("assetId:'opening-timber-gate'"));
  const registry=readFileSync(resolve(root,'src/assets/assetRegistry.ts'),'utf8');
  assert.match(registry,/if \(visualState !== 'repaired'\) return sourceAssetId;/);
});

test('early building artwork has compact, complete milestone progressions without changing footprints', () => {
  const repo=resolve(root,'..');
  const manifest=JSON.parse(readFileSync(resolve(repo,'assets/manifest.json'),'utf8'));
  const expected=['lord-house','tomb-entry','polar-farmhouse','opening-palisade-wall','opening-timber-gate','opening-simple-heater','opening-simple-kitchen','opening-woodshop','opening-tailor','opening-oreworks','opening-forge','opening-medical-station','opening-small-shelter'];
  assert.equal(manifest.buildingProgressions.length,expected.length);
  assert.deepEqual(JSON.parse(readFileSync(resolve(repo,'frontend/public/assets/manifest.json'),'utf8')),manifest);
  const milestones=[1,6,11,16,21,26], maxima=[5,10,15,20,25,30];
  for(const [index,row] of manifest.buildingProgressions.entries()){
    assert.ok(row.baseAssetIds.some(id=>id.startsWith(expected[index])),expected[index]);
    assert.deepEqual(row.stages.map(stage=>stage.minLevel),milestones,expected[index]+': starts');
    assert.deepEqual(row.stages.map(stage=>stage.maxLevel),maxima,expected[index]+': ends');
    let previousScale=0;
    for(const stage of row.stages){
      const asset=manifest.assets.find(candidate=>candidate.assetId===stage.assetId);
      assert.ok(asset,stage.assetId+': registered stage');
      assert.equal(asset.status,'draft');
      assert.ok(asset.presentationScale>previousScale,stage.assetId+': scale increases by stage');
      previousScale=asset.presentationScale;
      assert.deepEqual(asset.logicalCanvas,{width:480,height:400});
      const stageOne=manifest.assets.find(candidate=>candidate.assetId===row.stages[0].assetId);
      assert.deepEqual(asset.artFootprint,stageOne.artFootprint);
      assert.deepEqual(asset.compatiblePhysicalFootprint,stageOne.compatiblePhysicalFootprint);
      if(stage.minLevel===1) continue;
      assert.ok(asset.source.endsWith('/'+stage.assetId+'.svg'));
      const source=readFileSync(resolve(repo,asset.source),'utf8');
      assert.ok(!source.includes('<image'),stage.assetId+': no embedded image');
      for(const layer of ['body','base','upper','shadow','uiIcon']){
        const markup=readFileSync(resolve(repo,'frontend/public'+asset.layers[layer]),'utf8');
        assert.ok(markup.length<15000,stage.assetId+':'+layer+' stays compact');
        assert.ok(!markup.includes('<image'),stage.assetId+':'+layer+' has no embedded raster');
        if(layer==='body') assert.ok(markup.includes('<use href="../'),stage.assetId+': linked vector base');
      }
    }
  }
  assert.equal(assetRegistry.resolveSettlementAssetId(manifest,'polar-farmhouse-l01',1,false,undefined,16),'polar-farmhouse-l16');
  assert.equal(assetRegistry.resolveSettlementAssetId(manifest,'polar-farmhouse-l01',1,false,undefined,30),'polar-farmhouse-l26');
  assert.equal(assetRegistry.resolveSettlementAssetId(manifest,'lord-house-damaged',1,false,'damaged',21),'lord-house-damaged');
  assert.equal(assetRegistry.resolveSettlementAssetId(manifest,'lord-house-damaged',1,false,'repaired',21),'lord-house-l21');
  assert.equal(assetRegistry.resolveSettlementAssetId(manifest,'campfire-start',16,true),'survival-fire-l16');
});
