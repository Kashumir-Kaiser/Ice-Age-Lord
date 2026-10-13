import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spriteRect, referenceSize, artPolygon, composition, resolveOrientation } from '../src/rendering/SpriteRegistration.ts';
import { pointInPolygon, pointerCSS, pickStack, cyclePick } from '../src/rendering/MapPicking.ts';
import { TerrainSampler, noise, chunkLevel } from '../src/rendering/TerrainSampler.ts';
import { depthOrder } from '../src/rendering/DepthOrder.ts';
import { AdaptiveQuality, chooseLOD } from '../src/rendering/mapStyle.ts';
import { worldToScreen, screenToWorld, zoomAtScreenPoint } from '../src/territory/projection.ts';
import { validateMapExport } from '../scripts/validate-map-assets.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url),'utf8'));
const asset=manifest.assets.find(a=>a.assetId==='lord-house-damaged');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('CSS pointer offsets, DPR-independent projection, negative coordinates, resize and anchored extreme zoom',()=>{
 for(const dpr of [1,2])for(const viewport of [{width:1366,height:768},{width:390,height:844}])for(const zoom of [.002,.5,3]){
  const camera={x:-191,y:75,zoom},world={x:-17,y:81},screen=worldToScreen(world,camera,viewport);
  const css=pointerCSS({x:screen.x+123,y:screen.y+81},{left:123,top:81,width:viewport.width,height:viewport.height},viewport);
  const picked=screenToWorld(css,camera,viewport);near(picked.x,world.x);near(picked.y,world.y);
  const next=zoomAtScreenPoint(camera,screen,viewport,zoom===3?.002:3),again=screenToWorld(screen,next,viewport);near(again.x,world.x);near(again.y,world.y);assert.ok(dpr>0);
 }
});
test('physical sprite scaling is linear without clamps; trim and art state preserve registered ground point',()=>{
 const ground={x:181,y:271};const a=spriteRect(asset,ground,3),b=spriteRect(asset,ground,6),tiny=spriteRect(asset,ground,.003);
 near(b.width/a.width,2);near(b.height/a.height,2);near(tiny.width/a.width,.001);
 for(const state of [asset,{...asset,logicalCanvas:{width:960,height:800}},{...asset,trimOffset:{x:20,y:12}}]){
  const rect=spriteRect(state,ground,3);near(rect.x+rect.width*state.groundAnchor.x-rect.width*state.trimOffset.x/state.logicalCanvas.width,ground.x);
  near(rect.y+rect.height*state.groundAnchor.y-rect.height*state.trimOffset.y/state.logicalCanvas.height,ground.y);
 }
 assert.ok(referenceSize(asset).width>0);
});
test('planning never draws body, upper or flame; normal chooses a single registered composition',()=>{
 for(const a of manifest.assets){const plan=composition(a,'planning',true,true,'north');assert.ok(plan.every(l=>l.role==='base'||l.role==='shadow'));
  const normal=composition(a,'normal',false,true,'north');assert.equal(normal.filter(l=>l.role==='body'||l.role==='base').length,1);
  assert.ok(!(normal.some(l=>l.role==='body')&&normal.some(l=>l.role==='upper')));
 }
 const layered={...asset,composition:'architectural'};
 const focused=composition(layered,'focus',true,false,'north');assert.equal(focused.find(l=>l.role==='upper').alpha,.22);assert.equal(focused.find(l=>l.role==='base').alpha,1);
 assert.equal(composition(layered,'focus',false,false,'north').find(l=>l.role==='upper').alpha,1);
});
test('authored orientations resolve without changing geometry, unknown art coverage remains explicit',()=>{
 const rotated={...asset,orientationViews:{east:{body:'/east.png'}},equivalentOrientations:['south']};
 assert.equal(resolveOrientation(rotated,'east').layers.body,'/east.png');assert.equal(resolveOrientation(rotated,'south').missing,false);assert.equal(resolveOrientation(rotated,'west').missing,true);
 const before=JSON.stringify(asset.compatiblePhysicalFootprint);for(const o of ['north','east','south','west'])resolveOrientation(asset,o);assert.equal(JSON.stringify(asset.compatiblePhysicalFootprint),before);
});
test('registered silhouette picking excludes transparent corners; planning only hits occupancy; overlap cycles',()=>{
 const rect=spriteRect(asset,{x:100,y:100},3),poly=artPolygon(asset.occlusionRegion.upper,rect),ground=[{x:90,y:95},{x:110,y:95},{x:110,y:105},{x:90,y:105}];
 const objects=[{id:'rear',ground,silhouette:poly,selectable:true},{id:'front',ground,silhouette:poly,selectable:true},{id:'hidden',ground,silhouette:poly,selectable:false}];
 assert.deepEqual(pickStack({x:100,y:100},objects,true),['front','rear']);assert.equal(cyclePick(['front','rear'],'front'),'rear');
 assert.equal(pointInPolygon({x:rect.x,y:rect.y},poly),false);
 assert.deepEqual(pickStack({x:100,y:rect.y+rect.height*.2},objects,true),[]);
});
test('terrain/decor determinism, negative chunks, shared edges and varying viewports use only visual seed',()=>{
 const a=new TerrainSampler('world-A'),b=new TerrainSampler('world-A');
 const points=[[-64,0],[-.5,64],[64,32],[128,64],[4700,-6800]];
 for(const [x,y] of points)assert.deepEqual(a.sample(x,y),b.sample(x,y));
 for(const boundary of [-64,0,64]){near(noise(boundary/110,17/110,a.seed),noise(boundary/110,17/110,b.seed));}
 const small=a.props({minX:0,maxX:300,minY:-300,maxY:0},.3),large=b.props({minX:-300,maxX:600,minY:-600,maxY:300},.3);
 for(const prop of small)assert.deepEqual(prop,large.find(p=>p.id===prop.id));
 assert.deepEqual(a.sample(10,10),new TerrainSampler('world-B').sample(10,10));
});
test('LOD and chunk hysteresis hold near boundaries; world chunk spans remain bounded',()=>{
 assert.equal(chooseLOD(34,'close'),'close');assert.equal(chooseLOD(11,'district'),'district');assert.equal(chooseLOD(13,'regional'),'regional');assert.equal(chooseLOD(40,'regional'),'close');
 const level=chunkLevel(4);assert.equal(chunkLevel(4.1,level),level);assert.ok(chunkLevel(.001)>level);
});
test('overlap order uses footprint relations with stable IDs and spatial neighbor work',()=>{
 const object=(id,x,y,w=2,d=2,depth=0)=>({id,depth,bounds:{minX:0,maxX:100,minY:0,maxY:100},footprint:{minX:x-w/2,maxX:x+w/2,minY:y-d/2,maxY:y+d/2}});
 for(const input of [[object('tower',0,0),object('house',4,0)],[object('tower',0,0),object('unit',0,-4)]]){const result=depthOrder(input.reverse());assert.equal(result.cycles.length,0);assert.equal(result.objects[0].id,'tower');}
 assert.deepEqual(depthOrder([object('z',0,0),object('a',0,0)]).objects.map(o=>o.id),['a','z']);
 const sparse=Array.from({length:520},(_,i)=>({...object(String(i),i*20,0),bounds:{minX:i*256,maxX:i*256+30,minY:0,maxY:30}}));assert.ok(depthOrder(sparse).comparisons<520);
});
test('quality requires sustained overload and stable headroom, respecting locked mode',()=>{
 const quality=new AdaptiveQuality();for(let i=0;i<29;i++)assert.equal(quality.update(30,100),'normal');assert.equal(quality.update(30,100),'low');
 for(let i=0;i<149;i++)assert.equal(quality.update(10,100),'low');assert.equal(quality.update(10,100),'normal');assert.equal(quality.update(100,10000,'normal'),'normal');
});
test('raster export validation rejects bad formats, anchors/trim/atlas/orientation and stale hashes',()=>{
 const entry=asset.mapExports?.[0];assert.ok(entry,'production raster exports must exist');validateMapExport(entry,asset);
 for(const change of [{path:'/bad.svg'},{width:4096},{width:entry.width-1,atlas:undefined},{height:entry.height-1,atlas:undefined},{sha256:'bad'},{sourceSha256:'bad'},{orientation:'west'},{trim:{x:-1,y:0,width:1,height:1}},{atlas:{path:'/a.png',x:2040,y:0,width:64,height:64,atlasWidth:2048,atlasHeight:2048}}])assert.throws(()=>validateMapExport({...entry,...change},asset));
});
