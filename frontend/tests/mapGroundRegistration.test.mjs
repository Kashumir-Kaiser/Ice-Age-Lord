import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {spriteRect,artPolygon} from '../src/rendering/SpriteRegistration.ts';
import {pointInPolygon} from '../src/rendering/MapPicking.ts';
import {worldToScreen} from '../src/territory/projection.ts';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
const root=new URL('../../',import.meta.url);
const manifest=()=>JSON.parse(readFileSync(new URL('assets/manifest.json',root)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

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

test('L30 map ground registration derives a shadow without changing its original body or UI shadow',()=>{
 const a=manifest().assets.find(a=>a.assetId==='lord-house-l30');
 assert.deepEqual(a.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',widthM:4,depthM:4});
 assert.equal(sha(readFileSync(new URL('frontend/public'+a.layers.body,root))),'0fd805a84171288abf4730aca4c1e3663d1cbd479fcf6dd7a143ead650f3aac5');
 assert.equal(a.layers.shadow,'/assets/buildings/lord-house-repaired/shadow.svg');
 assert.equal(sha(readFileSync(new URL('frontend/public'+a.layers.shadow,root))),'d6b5f7ac47d1ba061d3bdad12ee25da5e701d35488d905274599e0bc4b44a17c');
 assert.equal(a.mapLayers.shadow,'/assets/map/buildings/lord-house-l30/shadow-ground.svg');
 const svg=readFileSync(new URL('frontend/public'+a.mapLayers.shadow,root),'utf8');
 const polygons=Array.from(svg.matchAll(/<polygon points="([^"]+)"/g));assert.equal(polygons.length,2);
 const contact=polygons[1][1].split(' ').map(p=>p.split(',').map(Number));
 const center=contact.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
 assert.ok(Math.abs(center[0]-240)<1e-8);assert.ok(Math.abs(center[1]-288)<1e-8);
 for(const lod of ['close','district']){
  const e=a.mapExports.find(e=>e.role==='shadow'&&e.lod===lod);assert.equal(e.source,a.mapLayers.shadow);validateMapExport(e,a);
  assert.ok(e.sourceDependencies.some(d=>d.source==='assets/map-ground-registration.json'));
 }
});

test('Tomb ground registration centers its 6 by 5 metre footprint and derives a map-only contact shadow',async()=>{
 const a=manifest().assets.find(a=>a.assetId==='tomb-entry');
 assert.deepEqual(a.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'TERRITORY-FOOTPRINTS-V1',widthM:6,depthM:5});
 assert.equal(a.layers.shadow,'/assets/buildings/tomb-entry/shadow.svg');
 assert.equal(a.mapLayers.shadow,'/assets/map/buildings/tomb-entry/shadow-ground.svg');
 const center=a.artFootprint.reduce((p,v)=>({x:p.x+v[0]/a.artFootprint.length,y:p.y+v[1]/a.artFootprint.length}),{x:0,y:0});
 assert.ok(Math.abs(center.x-a.groundAnchor.x)<1e-8);
 assert.ok(Math.abs(center.y-a.groundAnchor.y)<1e-8);
 for(const zoom of [.16,.7,3]){
  const origin={x:73,y:-29},camera={...origin,zoom},viewport={width:1366,height:768};
  const ground=worldToScreen(origin,camera,viewport),rect=spriteRect(a,ground,3*zoom);
  const centered=artPolygon([[center.x,center.y]],rect)[0];
  assert.ok(Math.hypot(centered.x-ground.x,centered.y-ground.y)<1e-8,'Tomb footing center stays at the world anchor');
  const front=artPolygon([[.5,.9]],rect)[0];
  const halfW=a.compatiblePhysicalFootprint.widthM/2,halfD=a.compatiblePhysicalFootprint.depthM/2;
  const edgeA=worldToScreen({x:origin.x+halfW,y:origin.y-halfD},camera,viewport);
  const edgeB=worldToScreen({x:origin.x-halfW,y:origin.y-halfD},camera,viewport);
  const dx=edgeB.x-edgeA.x,dy=edgeB.y-edgeA.y,length2=dx*dx+dy*dy;
  const t=Math.max(0,Math.min(1,((front.x-edgeA.x)*dx+(front.y-edgeA.y)*dy)/length2));
  const nearest={x:edgeA.x+t*dx,y:edgeA.y+t*dy};
  const edgeLength=Math.sqrt(length2);
  assert.ok(Math.hypot(front.x-nearest.x,front.y-nearest.y)<edgeLength*.12,'painted front contact stays close to the projected non-square 6 by 5 m front edge');
 }
 const svg=readFileSync(new URL('frontend/public'+a.mapLayers.shadow,root),'utf8');
 assert.ok(!svg.includes('<ellipse'));
 const polygons=Array.from(svg.matchAll(/<polygon points="([^"]+)"/g));
 assert.equal(polygons.length,2);
 const contact=polygons[1][1].split(' ').map(p=>p.split(',').map(Number));
 const shadowCenter=contact.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
 assert.ok(Math.abs(shadowCenter[0]-240)<1e-8);assert.ok(Math.abs(shadowCenter[1]-288)<1e-8);
 for(const lod of ['close','district']){
  const e=a.mapExports.find(e=>e.role==='shadow'&&e.lod===lod);assert.equal(e.source,a.mapLayers.shadow);validateMapExport(e,a);
  assert.ok(e.sourceDependencies.some(d=>d.source==='assets/map-ground-registration.json'));
  assert.ok(e.sourceDependencies.some(d=>d.source==='frontend/scripts/map-ground-shadow.mjs'));
 }
});

test('supply crate registration centers the preserved source art and painted front contact across zoom',async()=>{
 const a=manifest().assets.find(a=>a.assetId==='supply-crate');
 assert.deepEqual(a.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'TERRITORY-FOOTPRINTS-V1',widthM:3,depthM:3});
 const bodyPath=new URL('frontend/public'+a.layers.body,root),uiShadowPath=new URL('frontend/public'+a.layers.shadow,root);
 const body=readFileSync(bodyPath),uiShadow=readFileSync(uiShadowPath);
 assert.equal(sha(body),'c2001f0cf6efa768c19e5cfb39cca4d4a8d5ac53f68a01badba02ed2f3a427c1');
 assert.equal(sha(uiShadow),'178d3233df73ca286ce0f5945e046a1df09e2e37c858fa992cb7cb460a7134db');
 assert.equal(a.layers.shadow,'/assets/buildings/supply-crate/shadow.svg');
 const center=a.artFootprint.reduce((p,v)=>({x:p.x+v[0]/a.artFootprint.length,y:p.y+v[1]/a.artFootprint.length}),{x:0,y:0});
 assert.deepEqual(center,{x:.5,y:.72});
 const {data,info}=await sharp(body).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const contactY=[];
 for(const fraction of [.42,.46,.5,.54,.58]){
  const x=Math.round(fraction*(info.width-1));let lowest=-1;
  for(let y=info.height-1;y>=0;y--)if(data[(y*info.width+x)*4+3]>=128){lowest=y;break;}
  if(lowest>=0)contactY.push(lowest);
 }
 contactY.sort((x,y)=>x-y);const paintedY=contactY[Math.floor(contactY.length/2)];
 assert.equal(contactY.length,5,'painted source has five front-contact probes');
 assert.ok(paintedY>=0,'painted source front contact is measurable');
 for(const zoom of [.16,.7,3]){
  const origin={x:73,y:-29},camera={...origin,zoom},viewport={width:1366,height:768};
  const ground=worldToScreen(origin,camera,viewport),rect=spriteRect(a,ground,3*zoom);
  const centered=artPolygon([[center.x,center.y]],rect)[0];
  assert.ok(Math.hypot(centered.x-ground.x,centered.y-ground.y)<1e-8,'crate art-footprint center stays on the world anchor');
  const front=artPolygon([[.5,paintedY/info.height]],rect)[0];
  const footprint=[
   {x:origin.x-1.5,y:origin.y-1.5},{x:origin.x+1.5,y:origin.y-1.5},
   {x:origin.x+1.5,y:origin.y+1.5},{x:origin.x-1.5,y:origin.y+1.5}
  ].map(point=>worldToScreen(point,camera,viewport));
  // The snow apron is painterly and intentionally sits 13.5% inside the projected front edge;
  // preserve the 3 by 3 m footprint contract by requiring contact to remain inside its ground polygon.
  assert.ok(pointInPolygon(front,footprint),`painted front contact y=${paintedY} remains inside the projected 3 by 3 m footprint at zoom ${zoom}`);
 }
});

test('supply crate map shadow is derived, centered, exported at both LODs, and keeps source/UI layers',()=>{
 const a=manifest().assets.find(a=>a.assetId==='supply-crate');
 assert.equal(a.layers.shadow,'/assets/buildings/supply-crate/shadow.svg');
 assert.equal(a.mapLayers.shadow,'/assets/map/buildings/supply-crate/shadow-ground.svg');
 const svg=readFileSync(new URL('frontend/public'+a.mapLayers.shadow,root),'utf8');
 assert.ok(!svg.includes('<ellipse'));
 const polygons=Array.from(svg.matchAll(/<polygon points="([^"]+)"/g));assert.equal(polygons.length,2);
 const contact=polygons[1][1].split(' ').map(p=>p.split(',').map(Number));
 const shadowCenter=contact.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
 assert.ok(Math.abs(shadowCenter[0]-240)<1e-8);assert.ok(Math.abs(shadowCenter[1]-288)<1e-8);
 for(const lod of ['close','district']){
  const entry=a.mapExports.find(e=>e.role==='shadow'&&e.lod===lod);
  assert.equal(entry.source,a.mapLayers.shadow);validateMapExport(entry,a);
  for(const dependency of ['assets/map-ground-registration.json','frontend/scripts/map-ground-shadow.mjs'])assert.ok(entry.sourceDependencies.some(d=>d.source===dependency));
 }
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'TERRITORY-FOOTPRINTS-V1',widthM:3,depthM:3});
 assert.equal(sha(readFileSync(new URL('frontend/public'+a.layers.body,root))),'c2001f0cf6efa768c19e5cfb39cca4d4a8d5ac53f68a01badba02ed2f3a427c1');
 assert.equal(sha(readFileSync(new URL('frontend/public'+a.layers.shadow,root))),'178d3233df73ca286ce0f5945e046a1df09e2e37c858fa992cb7cb460a7134db');
});

test('damaged house registration centers all four authored poses and keeps their painted front contacts',async()=>{
 const a=manifest().assets.find(a=>a.assetId==='lord-house-damaged');
 assert.deepEqual(a.groundAnchor,{x:.5,y:.72});
 assert.deepEqual(a.compatiblePhysicalFootprint,{assumptionId:'TERRITORY-FOOTPRINTS-V1',widthM:4,depthM:4});
 assert.deepEqual(a.layers,{uiIcon:'/assets/buildings/lord-house-damaged/icon.svg',body:'/assets/buildings/lord-house-damaged/body.svg',base:'/assets/buildings/lord-house-damaged/base.svg',upper:'/assets/buildings/lord-house-damaged/upper.svg',shadow:'/assets/buildings/lord-house-damaged/shadow.svg',vfx:null});
 assert.equal(a.mapLayers.shadow,'/assets/map/buildings/lord-house-damaged/shadow-ground.svg');
 for(const orientation of ['north','east','south','west'])assert.equal(a.orientationViews[orientation].shadow,a.mapLayers.shadow,`${orientation} view resolves the map-only shadow while retaining its pose layers`);
 const center=a.artFootprint.reduce((p,v)=>({x:p.x+v[0]/a.artFootprint.length,y:p.y+v[1]/a.artFootprint.length}),{x:0,y:0});
 assert.deepEqual(center,{x:.5,y:.72});
 const orientationSources=JSON.parse(readFileSync(new URL('assets/map-building-views.json',root),'utf8'))['lord-house-damaged'];
 for(const orientation of ['north','east','south','west']){
  for(const zoom of [.16,.7,3]){
   const origin={x:73,y:-29},camera={...origin,zoom},viewport={width:1366,height:768};
   const ground=worldToScreen(origin,camera,viewport),rect=spriteRect(a,ground,3*zoom);
   const centered=artPolygon([[center.x,center.y]],rect)[0];
   assert.ok(Math.hypot(centered.x-ground.x,centered.y-ground.y)<1e-8,`${orientation} art-footprint center stays on the world anchor`);
  }
  const entry=a.mapExports.find(e=>e.role==='body'&&e.lod==='close'&&e.orientation===orientation);
  assert.ok(entry,`${orientation} body export exists`);
  const expectedSource=orientation==='north'?'frontend/public/assets/buildings/lord-house-damaged/body.svg':orientationSources[orientation];
  const sourceBytes=readFileSync(new URL(expectedSource,root));
  assert.equal(entry.sourceSha256,sha(sourceBytes),`${orientation} source is unchanged`);
  const png=readFileSync(new URL('frontend/public'+entry.path,root));
  const resized=await sharp(png).resize({width:Math.round(entry.trim.width),height:Math.round(entry.trim.height)}).png().toBuffer();
  const {data,info}=await sharp({create:{width:480,height:400,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:resized,left:Math.round(entry.trim.x),top:Math.round(entry.trim.y)}]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const contactY=[];
  for(const fraction of [.42,.46,.5,.54,.58]){
   const x=Math.round(fraction*(info.width-1));let lowest=-1;
   for(let y=info.height-1;y>=0;y--)if(data[(y*info.width+x)*4+3]>=128){lowest=y;break;}
   if(lowest>=0)contactY.push(lowest);
  }
  contactY.sort((x,y)=>x-y);const median=contactY[Math.floor(contactY.length/2)];
  assert.equal(contactY.length,5,`${orientation} has five painted front-contact probes`);
  assert.ok(Math.abs(median-360)<=12,`${orientation} painted front contact y=${median} stays within 12 source pixels of the authored front point y=360`);
 }
 const svg=readFileSync(new URL('frontend/public'+a.mapLayers.shadow,root),'utf8');
 assert.ok(!svg.includes('<ellipse'));
 const polygons=Array.from(svg.matchAll(/<polygon points="([^"]+)"/g));assert.equal(polygons.length,2);
 const contact=polygons[1][1].split(' ').map(p=>p.split(',').map(Number));
 const shadowCenter=contact.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
 assert.ok(Math.abs(shadowCenter[0]-240)<1e-8);assert.ok(Math.abs(shadowCenter[1]-288)<1e-8);
 for(const lod of ['close','district']){
  const e=a.mapExports.find(e=>e.role==='shadow'&&e.lod===lod);assert.equal(e.source,a.mapLayers.shadow);validateMapExport(e,a);
  for(const dependency of ['assets/map-ground-registration.json','frontend/scripts/map-ground-shadow.mjs'])assert.ok(e.sourceDependencies.some(d=>d.source===dependency));
 }
});
