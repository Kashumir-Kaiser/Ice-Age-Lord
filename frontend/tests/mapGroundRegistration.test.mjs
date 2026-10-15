import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spriteRect,artPolygon} from '../src/rendering/SpriteRegistration.ts';
import {worldToScreen} from '../src/territory/projection.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
const root=new URL('../../',import.meta.url);
const manifest=()=>JSON.parse(readFileSync(new URL('assets/manifest.json',root)));

test('repaired house ground registration aligns the preserved foundation center and front contact across zoom',()=>{
 const a=manifest().assets.find(a=>a.assetId==='lord-house-repaired');
 assert.deepEqual(a.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',widthM:4,depthM:4});
 const center=a.artFootprint.reduce((p,v)=>({x:p.x+v[0]/a.artFootprint.length,y:p.y+v[1]/a.artFootprint.length}),{x:0,y:0});
 for(const zoom of [.16,.7,3]){
  const origin={x:73,y:-29},camera={...origin,zoom},viewport={width:1366,height:768};
  const ground=worldToScreen(origin,camera,viewport),rect=spriteRect(a,ground,3*zoom);
  const centered=artPolygon([[center.x,center.y]],rect)[0];
  assert.ok(Math.hypot(centered.x-ground.x,centered.y-ground.y)<1e-8,'authored footing center stays on the world anchor');
  const front=artPolygon([[.5,.9]],rect)[0],physical=worldToScreen({x:origin.x+2,y:origin.y-2},camera,viewport);
  assert.ok(Math.abs(front.y-physical.y)<Math.abs(physical.y-ground.y)*.1,'painted front footing follows the physical front within source-art overhang');
 }
});

test('repaired house contact shadow has a map-only grounded SVG fallback and registered LODs',()=>{
 const a=manifest().assets.find(a=>a.assetId==='lord-house-repaired');
 assert.equal(a.layers.shadow,'/assets/buildings/lord-house-repaired/shadow.svg');
 assert.equal(a.mapLayers.shadow,'/assets/map/buildings/lord-house-repaired/shadow-ground.svg');
 const svg=readFileSync(new URL('frontend/public'+a.mapLayers.shadow,root),'utf8');
 assert.ok(!svg.includes('<ellipse'));const polygons=Array.from(svg.matchAll(/<polygon points="([^"]+)"/g));
 assert.equal(polygons.length,2);
 const points=polygons[1][1].split(' ').map(p=>p.split(',').map(Number));
 const center=points.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
 assert.ok(Math.abs(center[0]-240)<1e-8);assert.ok(Math.abs(center[1]-288)<1e-8);
 for(const lod of ['close','district']){
  const e=a.mapExports.find(e=>e.role==='shadow'&&e.lod===lod);assert.equal(e.source,a.mapLayers.shadow);validateMapExport(e,a);
  assert.ok(e.sourceDependencies.some(d=>d.source==='assets/map-ground-registration.json'));
 }
});
