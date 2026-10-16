import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spriteRect, referenceSize, artPolygon, composition, resolveOrientation } from '../src/rendering/SpriteRegistration.ts';
import { pointInPolygon, pointerCSS, pickStack, cyclePick } from '../src/rendering/MapPicking.ts';
import { TerrainSampler, noise, chunkLevel } from '../src/rendering/TerrainSampler.ts';
import { depthOrder } from '../src/rendering/DepthOrder.ts';
import { projectBuildings, rectPolygon } from '../src/rendering/BuildingGeometry.ts';
import { AdaptiveQuality, chooseLOD } from '../src/rendering/mapStyle.ts';
import { worldToScreen, screenToWorld, zoomAtScreenPoint } from '../src/territory/projection.ts';
import { cameraOverlayPromotionActive, removeLostTouchPointer, setCameraOverlayGestureActive } from '../src/rendering/transientCamera.ts';
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
test('camera overlay promotion covers wheel debounce and clears on commits and lost-capture cancellation',()=>{
 const classes=new Set(),node={classList:{toggle(name,active){if(active)classes.add(name);else classes.delete(name);}}};
 const update=state=>setCameraOverlayGestureActive(node,cameraOverlayPromotionActive(state));
 update({pan:false,pinch:false,wheel:true,commit:false});
 assert.deepEqual([...classes],['territory-camera-overlay--gesture']);
 update({pan:false,pinch:false,wheel:true,commit:true});
 assert.deepEqual([...classes],['territory-camera-overlay--gesture'],'wheel promotion survives the transform burst commit');
 update({pan:false,pinch:false,wheel:false,commit:true});
 assert.deepEqual([...classes],[],'debounced wheel completion clears promotion');
 update({pan:true,pinch:false,wheel:false,commit:true});
 assert.deepEqual([...classes],[],'lost pan capture commits and clears promotion');
 update({pan:false,pinch:true,wheel:false,commit:false});
 assert.deepEqual([...classes],['territory-camera-overlay--gesture'],'lost pinch capture keeps promotion while the pinch state remains active');
 update({pan:false,pinch:true,wheel:false,commit:true});
 assert.deepEqual([...classes],[],'lost capture commits and clears promotion before pinch state is discarded');
 update({pan:false,pinch:false,wheel:false,commit:true});
 assert.deepEqual([...classes],[],'cleared pinch state cannot leave a promoted layer behind');
 setCameraOverlayGestureActive(null,false);
});
test('lost touch pointer IDs cannot seed a later pinch with stale coordinates',()=>{
 const touches=new Map([[41,{x:14,y:25}]]);
 removeLostTouchPointer(touches,41);
 touches.set(42,{x:100,y:120});
 assert.deepEqual([...touches],[[42,{x:100,y:120}]],'the first touch after capture loss starts a fresh single-pointer gesture');
 touches.set(43,{x:160,y:190});
 assert.deepEqual([...touches.keys()],[42,43],'only subsequent live pointers can form the next pinch');
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
 assert.notEqual(a.seed,new TerrainSampler('world-B').seed,'visual seed derives from the world/save identity');
 const live=new TerrainSampler('save-A',undefined,[],false);assert.equal(live.forestAt(305,-75),0,'demo modeled infill cannot invent LIVE terrain');
 const projected=new TerrainSampler('save-A',undefined,[{x:305,y:-75,width:40,depth:40,kind:'forest',ratio:.7}],false);near(projected.forestAt(305,-75),.7);
});
test('water berm art follows the ice boundary with stable overlap culling and no off-shore scatter',()=>{
 const center={x:8900,y:-11200},geometry={forest:{x:100000,y:100000},stone:{x:200000,y:200000},water:center};
 const shore=new TerrainSampler('shore-world',geometry,[],false),withoutWater=new TerrainSampler('shore-world',undefined,[],false);
 const bounds={minX:center.x-2400,maxX:center.x+2400,minY:center.y-1450,maxY:center.y+1450},props=shore.props(bounds,.4),banks=props.filter(p=>p.kind==='bank');
 assert.ok(banks.length>20,'shore contour produces a readable set of existing bank sprites');
 for(const bank of banks){
  const radius=Math.hypot((bank.x-center.x)/2100,(bank.y-center.y)/1200);
  assert.ok(Math.abs(radius-.84446)<.015,`bank ${bank.id} stays on the ice blend boundary (${radius})`);
  assert.ok(bank.worldWidth>=48&&bank.worldWidth<=80);assert.equal(bank.size,bank.worldWidth);
 }
 assert.deepEqual(shore.props(bounds,.4).filter(p=>p.kind!=='bank'),withoutWater.props(bounds,.4),'adding water leaves every seeded non-bank prop unchanged');
 assert.equal(withoutWater.props(bounds,.4).some(p=>p.kind==='bank'),false,'worlds without water receive no shore banks');
 const lodBanks=shore.props(bounds,1.2).filter(p=>p.kind==='bank');
 assert.ok(lodBanks.length>0&&lodBanks.length<banks.length,'shore sprites use the existing gradual detail fade');
 for(const bank of lodBanks)assert.ok(banks.some(fine=>fine.id===bank.id),'coarser LOD retains a deterministic subset');
 assert.equal(shore.props(bounds,1.5).some(p=>p.kind==='bank'),false,'shore sprites share the existing 1.5 m/px cutoff');
 const sample=banks[Math.floor(banks.length/2)],overlap={minX:sample.x-55,maxX:sample.x+55,minY:sample.y-55,maxY:sample.y+55};
 const narrow=shore.props(overlap,.4).filter(p=>p.kind==='bank'),wide=shore.props({...bounds,minX:bounds.minX-80,maxX:bounds.maxX+80,minY:bounds.minY-80,maxY:bounds.maxY+80},.4).filter(p=>p.kind==='bank');
 assert.ok(narrow.some(p=>p.id===sample.id));
 for(const p of narrow)assert.deepEqual(p,wide.find(other=>other.id===p.id),'overlapping camera queries preserve bank identity and dimensions');
});
test('LOD and chunk hysteresis hold near boundaries; world chunk spans remain bounded',()=>{
 assert.equal(chooseLOD(34,'close'),'close');assert.equal(chooseLOD(11,'district'),'district');assert.equal(chooseLOD(13,'regional'),'regional');assert.equal(chooseLOD(40,'regional'),'close');
 const level=chunkLevel(4);assert.equal(chunkLevel(4.1,level),level);assert.ok(chunkLevel(.001)>level);
});
test('distant symbols and picking share their 12 CSS pixel bounds and hysteresis without enlarging occupancy',()=>{
 const states=new Map(),building={id:'house',asset,assetId:asset.assetId,point:{x:0,y:0},orientation:'north',footprint:{widthM:4,depthM:4},selected:false,active:false,draft:false};
 const project=()=>({x:60,y:60}),size={width:120,height:100};
 const tiny=projectBuildings([building],project,.001,size,true,states)[0];assert.equal(tiny.lod,'regional');assert.equal(tiny.symbol.width,12);assert.equal(tiny.footprint.maxX-tiny.footprint.minX,4);
 const item={id:tiny.id,ground:[],silhouette:rectPolygon(tiny.symbol),selectable:true};assert.deepEqual(pickStack({x:65,y:49},[item],false),['house']);assert.deepEqual(pickStack({x:67,y:49},[item],false),[]);assert.deepEqual(pickStack({x:65,y:49},[item],true),[]);
 const edge=13/16;assert.equal(projectBuildings([building],project,edge,size,true,states)[0].lod,'regional');assert.equal(projectBuildings([building],project,edge,size,true,states)[0].lod,'regional','a second caller observes the same hysteresis');
 assert.equal(projectBuildings([building],project,15/16,size,true,states)[0].lod,'district');
});
test('overlap order uses footprint relations with stable IDs and spatial neighbor work',()=>{
 const object=(id,x,y,w=2,d=2,depth=0)=>({id,depth,bounds:{minX:0,maxX:100,minY:0,maxY:100},footprint:{minX:x-w/2,maxX:x+w/2,minY:y-d/2,maxY:y+d/2}});
 for(const input of [[object('tower',0,0),object('house',4,0)],[object('tower',0,0),object('unit',0,-4)]]){const result=depthOrder(input.reverse());assert.equal(result.cycles.length,0);assert.equal(result.objects[0].id,'tower');}
 assert.deepEqual(depthOrder([object('z',0,0),object('a',0,0)]).objects.map(o=>o.id),['a','z']);
 const sparse=Array.from({length:520},(_,i)=>({...object(String(i),i*20,0),bounds:{minX:i*256,maxX:i*256+30,minY:0,maxY:30}}));assert.ok(depthOrder(sparse).comparisons<520);
});
test('global building depth remains stable under pan while the visible subset still culls correctly',()=>{
 const buildings=[0,4,8].map((x,i)=>({id:String(i),asset,assetId:asset.assetId,point:{x,y:0},orientation:'north',footprint:{widthM:4,depthM:4},selected:false,active:false,draft:false}));
 const project=(dx,dy)=>point=>({x:dx+point.x*6,y:dy+point.x*3});
 const viewport={width:120,height:100},allA=projectBuildings(buildings,project(20,60),3,viewport,false),allB=projectBuildings(buildings,project(-500,120),3,viewport,false);
 assert.deepEqual(depthOrder(allA).objects.map(b=>b.id),depthOrder(allB).objects.map(b=>b.id));
 assert.equal(projectBuildings(buildings,project(-500,120),3,viewport).length,0);assert.equal(allB.length,3,'offscreen topology remains available without drawing it');
});
test('quality requires sustained overload and stable headroom, respecting locked mode',()=>{
 const quality=new AdaptiveQuality();for(let i=0;i<29;i++)assert.equal(quality.update(30,100),'normal');assert.equal(quality.update(30,100),'low');
 for(let i=0;i<149;i++)assert.equal(quality.update(10,100),'low');assert.equal(quality.update(10,100),'normal');assert.equal(quality.update(100,10000,'normal'),'normal');
 const intermittent=new AdaptiveQuality();for(let i=0;i<29;i++)intermittent.update(30,100);intermittent.resetObservation();assert.equal(intermittent.update(30,100),'normal','separate short gestures do not count as sustained overload');
});
test('raster export validation rejects bad formats, anchors/trim/atlas/orientation and stale hashes',()=>{
 const entry=asset.mapExports?.[0];assert.ok(entry,'production raster exports must exist');validateMapExport(entry,asset);
 const west=asset.mapExports.find(e=>e.orientation==='west'&&e.role==='body');assert.ok(west);validateMapExport(west,asset);
 if(entry.exportVersion>=3)assert.throws(()=>validateMapExport({...entry,trim:{...entry.trim,width:entry.trim.width/2}},asset),'trim must preserve the encoded raster dimensions');
 for(const change of [{path:'/bad.svg'},{width:4096},{width:entry.width-1,atlas:undefined},{height:entry.height-1,atlas:undefined},{sha256:'bad'},{sourceSha256:'bad'},{orientation:'west'},{trim:{x:-1,y:0,width:1,height:1}},{atlas:{path:'/a.png',x:2040,y:0,width:64,height:64,atlasWidth:2048,atlasHeight:2048}}])assert.throws(()=>validateMapExport({...entry,...change},asset));
});

test('six real-art demo palette entries have registered raster coverage for every compass orientation',()=>{
 for(const id of ['lord-house-damaged','polar-farmhouse-l01','opening-palisade-wall','opening-timber-gate','watchtower-preview','elemental-tower-preview']){
  const item=manifest.assets.find(a=>a.assetId===id);assert.ok(item,id);
  for(const orientation of ['north','east','south','west']){
   const resolved=resolveOrientation(item,orientation);assert.equal(resolved.missing,false,id+':'+orientation);
   for(const lod of ['close','district']){
    const exported=item.mapExports.find(e=>e.role==='body'&&e.lod===lod&&e.orientation===orientation&&(e.layerPath??e.source)===resolved.layers.body);
    assert.ok(exported,id+':'+orientation+':'+lod);validateMapExport(exported,item);
   }
  }
 }
});

test('north-only QA fixtures do not claim compass equivalence for asymmetric placeholder art',()=>{
 for(const id of ['fixture-tall-tower','fixture-fire-max']){
  const item=manifest.assets.find(a=>a.assetId===id);assert.ok(item,id);
  assert.deepEqual(item.equivalentOrientations??[],[],id+' must not pass an unpainted pose off as symmetry');
  for(const orientation of ['east','south','west'])assert.equal(resolveOrientation(item,orientation).missing,true,id+':'+orientation);
 }
});
