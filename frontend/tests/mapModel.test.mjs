import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(join(root,'src/mapModel.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const model=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

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
test('fog is clear at camp and becomes fully black far outside surveyed area',()=>{
  assert.equal(model.fogOpacityAt(0,0,false),0);
  assert.ok(model.fogOpacityAt(80,0,false)>0);
  assert.ok(model.fogOpacityAt(80,0,false)<1);
  assert.equal(model.fogOpacityAt(130,0,false),1);
  assert.equal(model.fogOpacityAt(3000,1000,true),1);
  assert.equal(model.fogOpacityAt(-125,48,true),0);
  assert.equal(model.fogOpacityAt(-125,48,false),1);
});
test('chests and resource spot quantities are withheld before survey preview',()=>{
  assert.deepEqual(model.visibleDemoMarkers(false),[]);
  const shown=model.visibleDemoMarkers(true);
  for(const kind of ['wood','stone','ore','herbs','water','chest']) assert.ok(shown.some(x=>x.kind===kind),kind);
  for(const marker of shown) assert.equal(marker.demoOnly,true);
  const chest=shown.find(x=>x.kind==='chest');
  assert.equal(model.displayRemaining(chest),null);
  assert.equal(chest.contentsKnown,false);
  const wood=shown.find(x=>x.kind==='wood');
  assert.match(model.displayRemaining(wood),/480.*620.*Gỗ/);
  assert.equal(model.DEMO_MAP_MARKERS.length,shown.length);
});
test('metres are used for geometric radius and formatted in Vietnamese',()=>{
  assert.equal(model.formatDistance(10),'10 m');
  assert.match(model.formatDistance(1500),/1,5 km/);
});
