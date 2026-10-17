import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { INITIAL_CAMERA } from '../src/map/camera.ts';
import { mapQaInitialState } from '../src/rendering/mapFixtures.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(join(root,'src/mapModel.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const model=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('map QA camera fixtures use canonical local anchors and a night-only unknown-region camera',()=>{
  const camp=mapQaInitialState(INITIAL_CAMERA,7*3600,'local-camp');
  assert.deepEqual(camp.camera.local,{x:0,y:0,zoom:1});
  const forest=mapQaInitialState(INITIAL_CAMERA,7*3600,'local-forest');
  assert.deepEqual(forest.camera.local,{x:4700,y:6800,zoom:172/5000});
  const stone=mapQaInitialState(INITIAL_CAMERA,7*3600,'local-stone');
  assert.deepEqual(stone.camera.local,{x:-7800,y:4700,zoom:172/5000});
  const water=mapQaInitialState(INITIAL_CAMERA,7*3600,'local-water');
  assert.deepEqual(water.camera.local,{x:10700,y:11200,zoom:.4});
  const fog=mapQaInitialState(INITIAL_CAMERA,7*3600,'unknown-fog');
  assert.deepEqual(fog.camera.local,{x:-14500,y:9000,zoom:172/5000});
  assert.equal(fog.clockSeconds,19*3600);
  assert.equal(mapQaInitialState(INITIAL_CAMERA,7*3600,null).clockSeconds,7*3600);
});

test('fire radii exactly follow the 30 source registry rows, not fabricated scaling',()=>{
  assert.equal(model.FIRE_RADII_M.length,30);
  assert.deepEqual(model.FIRE_RADII_M.slice(0,11),[10,20,40,80,160,200,300,350,400,450,500]);
  assert.equal(model.heatRadiusM(12),750);
  assert.equal(model.heatRadiusM(16),2500);
  assert.equal(model.heatRadiusM(21),2500);
  assert.equal(model.heatRadiusM(24),4250);
  assert.equal(model.heatRadiusM(30),25000);
  assert.equal(model.heatRadiusM(1,false),0);
  assert.throws(()=>model.heatRadiusM(0),RangeError);
  assert.throws(()=>model.heatRadiusM(31),RangeError);
  assert.equal(model.fireForm(6),'Đại Lửa Trại');
});
test('world-clock light phases respect campaign dawn, sunset and night boundaries',()=>{
  assert.equal(model.dayPhase(0),'night');
  assert.equal(model.dayPhase(419),'night');
  assert.equal(model.dayPhase(420),'day');
  assert.equal(model.dayPhase(989),'day');
  assert.equal(model.dayPhase(990),'twilight');
  assert.equal(model.dayPhase(1019),'twilight');
  assert.equal(model.dayPhase(1020),'night');
  assert.equal(model.formatClock(1020),'17:00');
  assert.ok(model.dayOverlayOpacity(1140)>model.dayOverlayOpacity(720));
  assert.throws(()=>model.dayPhase(1440),RangeError);
});
test('daylight, twilight and night fog contracts around source heat radius',()=>{
  assert.equal(model.fogOpacityAt(0,0,420,1),0);
  assert.equal(model.fogOpacityAt(250,0,720,1),0);
  assert.ok(model.fogOpacityAt(430,0,720,1)>0);
  assert.ok(model.fogOpacityAt(430,0,720,1)<1);
  assert.equal(model.fogOpacityAt(800,0,720,1),1);
  assert.equal(model.fogOpacityAt(300,0,1005,1),1); // dusk is contracted
  assert.equal(model.fogOpacityAt(9,0,1140,1),0);
  assert.equal(model.fogOpacityAt(50,0,1140,1),1);
  assert.equal(model.fogOpacityAt(24000,0,1140,30),0);
  assert.equal(model.fogOpacityAt(25060,0,1140,30),1);
  assert.equal(model.fogOpacityAt(24000,0,1140,1),1);
  assert.equal(model.fogOpacityAt(0,0,1140,1,false),1);
  assert.deepEqual(model.visibilityDiscs(1140,1,false),[]);
});
test('DEMO remembered stone lies in explored fog at night without becoming current sight',()=>{
  // MODELED-STONE-01 in worldFeatures.ts is at world (-31,-52), where +Y is north.
  const stone={x:-31,y:-52};
  assert.ok(model.DEMO_EXPLORED.some(disc=>Math.hypot(stone.x-disc.x,stone.y-disc.y)<disc.clear));
  const currentSight=model.fogOpacityAt(stone.x,stone.y,1140,1,true)<.12;
  assert.equal(currentSight,false,'the H0 fire radius does not make the remembered stone currently visible at night');
  assert.equal(model.exploredOpacityAt(stone.x,stone.y),0,'the remembered stone remains visible through the explored-memory layer');
});
test('world atlas transition waits until entire source heat area is visible',()=>{
  assert.equal(model.shouldEnterWorldMap(.5,10),false);
  assert.equal(model.shouldEnterWorldMap(.5,25000),false);
  assert.equal(model.shouldEnterWorldMap(.003,25000),false);
  assert.equal(model.shouldEnterWorldMap(.002,25000),true);
  assert.equal(model.shouldEnterWorldMap(.01,10),true);
  assert.ok(model.WORLD_ZOOM<.002);
});
test('visibility sources union instead of hiding one another and gradients stay ordered',()=>{
  const sources=[{x:0,y:0,clear:70,fade:130},{x:105,y:0,clear:60,fade:120}];
  assert.equal(model.fogOpacityForDiscs(0,0,sources),0);
  assert.equal(model.fogOpacityForDiscs(0,0,[...sources].reverse()),0);
  for(const radius of [10,2500,25000]){
    const disc={x:0,y:0,clear:radius,fade:radius+Math.min(36,Math.max(2,radius*.008))};
    const stops=model.fogGradientStops(disc);
    assert.ok(0<=stops.clear&&stops.clear<=stops.transition&&stops.transition<=stops.edge&&stops.edge===100);
  }
});
test('metres are used for geometric radius and formatted in Vietnamese',()=>{
  assert.equal(model.formatDistance(10),'10 m');
  assert.match(model.formatDistance(1500),/1,5 km/);
});

test('canonical map geography uses all source site, anchor, and chest cache coordinates',async()=>{
  const src=readFileSync(join(root,'src/canonicalGeography.ts'),'utf8');
  const transpiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const geo=await import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'));
  assert.equal(geo.CANONICAL_SITES.length,38);
  assert.equal(geo.CANONICAL_ANCHORS.length,10);
  assert.equal(geo.CANONICAL_CHEST_CACHES.length,41);
  assert.equal(geo.CANONICAL_ROUTE_ENDPOINTS.length,8);
  assert.equal(geo.CANONICAL_MAP_RADIUS_M,96000);
  assert.equal(geo.knownOpeningSites().length,4);
  assert.deepEqual(geo.knownOpeningSites().map(s=>[s.x,s.y]),[[0,0],[40,20],[30,-10],[-20,30]]);
  assert.equal(geo.projectKnownSites(['SITE-LL01-000']).length,1);
  assert.equal(geo.CANONICAL_RESOURCES.find(x=>x.id==='RES-LL01-01').capacity,780);
  assert.equal(geo.CANONICAL_RESOURCES.find(x=>x.id==='RES-LL01-02').capacity,1240);
  assert.equal(geo.CANONICAL_RESOURCES.find(x=>x.id==='RES-LL01-04').x,-12400);
  assert.equal(geo.CANONICAL_CHEST_CACHES[0].x,-650);
  assert.equal(geo.CANONICAL_ANCHORS[1].x,68000);
});
