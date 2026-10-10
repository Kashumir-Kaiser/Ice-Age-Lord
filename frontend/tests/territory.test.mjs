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
  assert.equal(manifest.assets.length,6);
  for (const asset of manifest.assets) {
    assert.ok(asset.assetId&&asset.definitionId&&asset.orientation&&asset.revision);
    assert.ok(asset.groundAnchor&&asset.artFootprint&&asset.visualBounds&&asset.occlusionRegion&&asset.drawDepthAnchor);
    assert.equal(asset.status,'placeholder');
    assert.ok(existsSync(resolve(repo,asset.source)));
    for (const file of new Set([...Object.values(asset.layers),...Object.values(asset.lodVariants).flatMap(lod=>Object.values(lod))].filter(value=>typeof value==='string'))) {
      const path=resolve(repo,'frontend/public',file.slice(1));
      assert.ok(existsSync(path),`${asset.assetId}: ${file}`);
      const viewBox=readFileSync(path,'utf8').match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
      assert.deepEqual(viewBox,[0,0,asset.logicalCanvas.width,asset.logicalCanvas.height]);
    }
  }
});
