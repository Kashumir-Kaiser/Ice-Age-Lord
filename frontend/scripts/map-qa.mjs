import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';
import {waitForAppliedQaOrientation} from './map-qa-readiness.mjs';
import {TerrainSampler,regionWeight} from '../src/rendering/TerrainSampler.ts';
import {paintedIceWeight} from '../src/rendering/TerrainChunkCache.ts';

const viewportChoices=[{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}];
const requestedWidths=process.env.MAP_QA_VIEWPORTS?.split(',').map(Number);
if(requestedWidths?.some(width=>!viewportChoices.some(v=>v.width===width)))throw new Error('MAP_QA_VIEWPORTS must list 1366,1920,390');
const tombOnly=process.env.MAP_QA_TOMB_ONLY==='1';
const viewports=tombOnly?[viewportChoices[0],viewportChoices[2]].filter(v=>!requestedWidths||requestedWidths.includes(v.width)):viewportChoices.filter(v=>!requestedWidths||requestedWidths.includes(v.width));
const progressionOnly=process.env.MAP_QA_PROGRESSION_ONLY==='1';
const geographyOnly=process.env.MAP_QA_GEOGRAPHY_ONLY==='1';
const geographyKind=process.env.MAP_QA_GEOGRAPHY_KIND;
const fogOnly=process.env.MAP_QA_FOG_ONLY==='1';
// Target the real four-pose damaged-house QA fixture only; use MAP_QA_VIEWPORTS/DPR/QUALITY as usual.
const damagedHouseOnly=process.env.MAP_QA_DAMAGED_HOUSE_ONLY==='1';
const l30Only=process.env.MAP_QA_L30_ONLY==='1';
const architectureOnly=progressionOnly||geographyOnly||fogOnly||damagedHouseOnly||l30Only||tombOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1';
const allOrientations=['north','east','south','west'];
const families=[['wall','Thử bố trí Tường Rào',allOrientations],['gate','Thử bố trí Cổng Gỗ · mẫu ảnh',allOrientations],['tower','Thử bố trí Tháp cao · minh họa',['north']],['house','Thử bố trí Nhà thấp · minh họa',allOrientations],['farmhouse','Thử bố trí Nhà Nông Phu Cực Địa',allOrientations],['watchtower','Thử bố trí Tháp Canh · mẫu ảnh',allOrientations],['elemental','Thử bố trí Tháp Nguyên Tố · mẫu ảnh',allOrientations]];
const orientationAssetIds={wall:'opening-palisade-wall',gate:'opening-timber-gate',house:'lord-house-damaged',farmhouse:'polar-farmhouse-l01',watchtower:'watchtower-preview',elemental:'elemental-tower-preview'};
const requestedFamilies=process.env.MAP_QA_FAMILIES?.split(',');
if(requestedFamilies?.some(name=>!families.some(([family])=>family===name)))throw new Error('Unknown MAP_QA_FAMILIES entry');
if(damagedHouseOnly&&(progressionOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_DAMAGED_HOUSE_ONLY cannot be combined with other scenario filters');
if(l30Only&&(progressionOnly||damagedHouseOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_L30_ONLY cannot be combined with other scenario filters');
if(tombOnly&&(progressionOnly||damagedHouseOnly||l30Only||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies||requestedWidths?.some(width=>![1366,390].includes(width))))throw new Error('MAP_QA_TOMB_ONLY cannot be combined with other scenario filters and only captures 1366/390');
if(geographyOnly&&(fogOnly||progressionOnly||damagedHouseOnly||l30Only||tombOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_GEOGRAPHY_ONLY cannot be combined with other scenario filters');
if(geographyKind&&(!geographyOnly||!['forest','stone','water'].includes(geographyKind)))throw new Error('MAP_QA_GEOGRAPHY_KIND requires MAP_QA_GEOGRAPHY_ONLY and one of forest,stone,water');
if(fogOnly&&(geographyOnly||progressionOnly||damagedHouseOnly||l30Only||tombOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_FOG_ONLY cannot be combined with other scenario filters');
const browser=await launchMapBrowser(),evidence=[];
const output=resolve(process.env.MAP_QA_DIR??'map-evidence/after');mkdirSync(output,{recursive:true});
const dpr=Number(process.env.MAP_QA_DPR??1),quality=process.env.MAP_QA_QUALITY??'normal';
const fullSuite=!architectureOnly&&!requestedFamilies&&!requestedWidths&&!tombOnly;
const fullViewportBatch=process.env.MAP_QA_EXPECT_73==='1';
if(fullViewportBatch&&(requestedWidths?.length!==1||architectureOnly||requestedFamilies||tombOnly))throw new Error('MAP_QA_EXPECT_73 requires exactly one requested viewport and the complete unfiltered scenario set');
const expectFullPerViewport=fullSuite||fullViewportBatch;
let completed=false;
function persistProgress(status='in-progress'){
 writeFileSync(resolve(output,'scenarios.json'),JSON.stringify(evidence,null,2));
 const counts=Object.fromEntries(viewports.map(viewport=>[String(viewport.width),evidence.filter(row=>row.viewport.width===viewport.width).length]));
 const manifest={schema:'map-visual-qa-v1',status,captureProvenance:'demo-only-read-only-visual-qa',reviewStatus:'pending-parent-visual-review',mode:'demo',quality,dpr,viewports:viewports.map(({width,height})=>({width,height})),captureRows:evidence.length,scenarioRowsByViewport:counts,expectedRowsPerViewport:expectFullPerViewport?73:null,fullSuite,fullViewportSuite:expectFullPerViewport,outputs:{scenarioIndex:'scenarios.json'},orientationReview:{families:Object.keys(orientationAssetIds),poseOrientations:allOrientations,progressions:['lord-house-repaired','lord-house-l30','polar-farmhouse-l10','survival-fire-l26'],progressionOrientation:'north',contactSheets:'relative paths stored on capture rows'}};
 writeFileSync(resolve(output,'qa-manifest.json'),JSON.stringify(manifest,null,2));
}
persistProgress();
function waterShoreEvidence(host,camera){
 const scale=host.height*camera.zoom/172,halfWidth=host.width/(2*scale),halfHeight=host.height/(2*scale),centerX=camera.xKm*1000,centerY=-camera.yKm*1000;
 const bounds={minX:centerX-halfWidth,maxX:centerX+halfWidth,minY:centerY-halfHeight,maxY:centerY+halfHeight};
 const geography={forest:{x:4700,y:-6800},stone:{x:-7800,y:-4700},water:{x:8900,y:-11200}};
 const sampler=new TerrainSampler('LL01',geography,[],true),props=sampler.props({minX:bounds.minX-80,maxX:bounds.maxX+80,minY:bounds.minY-80,maxY:bounds.maxY+80},1/scale);
 const visibleBanks=props.filter(prop=>prop.kind==='bank'&&prop.id.startsWith('shore-bank:')&&prop.x>=bounds.minX&&prop.x<=bounds.maxX&&prop.y>=bounds.minY&&prop.y<=bounds.maxY);
 const radii=visibleBanks.map(prop=>Math.hypot((prop.x-geography.water.x)/2100,(prop.y-geography.water.y)/1200));
 const widths=visibleBanks.map(prop=>prop.worldWidth??prop.size);
 const westEdgeDistance=Math.abs(bounds.minX-geography.water.x)/2100,eastEdgeDistance=Math.abs(bounds.maxX-geography.water.x)/2100;
 const westEdgeIceWeight=regionWeight(bounds.minX,centerY,geography.water,2100,1200),eastEdgeIceWeight=regionWeight(bounds.maxX,centerY,geography.water,2100,1200);
 return {metresPerPixel:1/scale,halfWidth,halfHeight,visibleBanks,sampledWorldProps:props.length,radii,widths,westEdgeDistance,eastEdgeDistance,westEdgeIceWeight,eastEdgeIceWeight,westPaintedIceWeight:paintedIceWeight(westEdgeIceWeight),eastPaintedIceWeight:paintedIceWeight(eastEdgeIceWeight)};
}
async function ensureCalibrationOpen(page){
 const details=page.locator('.territory-calibration');
 if(!await details.evaluate(node=>node.open))await details.locator('summary').click();
}
async function capture(page,name,viewport,{waitForIdle=true,beforeScreenshot=null}={}){
 await page.locator('.map-render-host').evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
 const group=/^damaged-house/.test(name)?'architecture/damaged-house/':/^tomb-entry-/.test(name)?'architecture/tomb-entry/':/^(watchtower|elemental)-/.test(name)?'architecture/prototypes/':/^(farmhouse|late)-/.test(name)?'architecture/progression/':/^(house|tower)-/.test(name)?'architecture/extended/':/^(wall|gate)-/.test(name)?'architecture/':'';
 const directory=resolve(output,String(viewport.width),group);mkdirSync(directory,{recursive:true});
 const filename=`${viewport.width}/${group}${name}-${viewport.width}-${quality}-dpr${dpr}.png`;
 try{if(waitForIdle)await readyMap(page);else await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}catch(error){
  const metrics=await page.evaluate(()=>window.__mapMetrics?.at(-1));
  writeFileSync(resolve(output,filename+'.failure.json'),JSON.stringify({name,phase:'renderer-idle-poll',viewport,dpr,quality,metrics,readiness:error?.mapReadiness??null,error:String(error)},null,2));
  await page.screenshot({path:resolve(output,filename+'.failure.png'),animations:'disabled'});throw error;
 }
 if(beforeScreenshot)await beforeScreenshot();
 await page.screenshot({path:resolve(output,filename),animations:'disabled'});
 const row={filename,scenario:name,viewport,dpr,quality,reviewStatus:'pending-parent-visual-review',provenance:'demo-only-read-only-visual-qa',metrics:await page.evaluate(()=>window.__mapMetrics.at(-1))};
 const mapScene=page.locator('.map-scene');
 if(await mapScene.count()){
  const qa=await mapScene.evaluate(node=>({
   fixture:node.getAttribute('data-map-qa-fixture'),
   provenance:node.getAttribute('data-map-qa-provenance'),
   cameraMode:node.getAttribute('data-map-qa-camera-mode'),
   cameraXKm:Number(node.getAttribute('data-map-qa-camera-x-km')),
   cameraYKm:Number(node.getAttribute('data-map-qa-camera-y-km')),
   cameraZoom:Number(node.getAttribute('data-map-qa-camera-zoom')),
   clockMinutes:Number(node.getAttribute('data-map-qa-clock-minutes')),
   phase:node.getAttribute('data-map-qa-phase'),
   centerKm:node.getAttribute('data-map-qa-fixture-center-km'),
   anchorKm:node.getAttribute('data-map-qa-fixture-anchor-km'),
   fixtureKnownId:node.getAttribute('data-map-qa-fixture-known-id'),
   sightClearM:Number(node.getAttribute('data-map-qa-fixture-sight-clear-m'))||null,
   sightFadeM:Number(node.getAttribute('data-map-qa-fixture-sight-fade-m'))||null,
   knownState:JSON.parse(node.getAttribute('data-map-qa-known-state')??'null'),
  }));
  if(qa.fixture)row.mapQa={...qa,reviewStatus:'pending-parent-visual-review'};
 }
 evidence.push(row);persistProgress();return row;
}
async function captureDemoFixture(name,fixture,viewport,{screen='Lãnh địa',expectedCount}={}){
 const page=await openMap(browser,{viewport,dpr,quality,fixture});
 try{
  await navigateMap(page,screen);
  const stage=screen==='Lãnh địa'?page.locator('.territory-stage'):page.locator('.map-scene');
  await stage.waitFor();
  const marker=stage;
  await marker.waitFor();
  const actualFixture=await marker.getAttribute('data-map-qa-fixture');
  const actualCount=Number(await marker.getAttribute('data-map-qa-fixture-count'));
  if(actualFixture!==fixture)throw new Error(`${name} expected fixture ${fixture}, received ${actualFixture}`);
  if(expectedCount!==undefined&&actualCount!==expectedCount)throw new Error(`${name} expected ${expectedCount} opaque QA fixtures, received ${actualCount}`);
  const row=await capture(page,name,viewport);
  row.fixture={label:'DEMO · QA-only static authored art',fixture,opaqueCount:actualCount,selectable:false,reviewStatus:'pending-parent-visual-review'};
  return row;
 }finally{await page.close();}
}
async function selectMapTime(page,minutes){
 await page.locator('.map-developer-tools > summary').click();
 await page.getByLabel('Mô phỏng giờ hiển thị').selectOption(String(minutes));
 await page.locator('.map-developer-tools > summary').click();
}
async function bringMapIntoView(page){await page.locator('.map-render-host').evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));}
const KNOWN_FOG_FIXTURE={
 'SITE-LL01-000':{knowledge:'current'},
 'MODELED-SALVAGE-01':{knowledge:'current'},
 'MODELED-STONE-01':{knowledge:'remembered'},
};
const UNKNOWN_FOG_PICK_FIXTURE_ID='MODELED-01-001';
async function assertFogProjection(page,minutes,unknownCase){
 const scene=page.locator('.map-scene');
 const result=await scene.evaluate(node=>({
  fixture:node.getAttribute('data-map-qa-fixture'),
  cameraMode:node.getAttribute('data-map-qa-camera-mode'),
  minutes:Number(node.getAttribute('data-map-qa-clock-minutes')),
  phase:node.getAttribute('data-map-qa-phase'),
  provenance:node.getAttribute('data-map-qa-provenance'),
  states:JSON.parse(node.getAttribute('data-map-qa-known-state')??'null'),
 }));
 if(result.minutes!==minutes||result.phase!==(minutes===420?'day':'night')||result.provenance!=='demo-visible-snapshot')throw new Error(`Fog fixture metadata is not the requested demo projection: ${JSON.stringify(result)}`);
 if(!Array.isArray(result.states))throw new Error('MapScene did not expose safe QA metadata for projected known entities');
 const expected=Object.entries(KNOWN_FOG_FIXTURE).map(([id,value])=>({id,...value,currentSight:id==='MODELED-STONE-01'?Number(minutes===420):1}));
 const observed=result.states.map(({id,knowledge,currentSight})=>({id,knowledge,currentSight}));
 if(JSON.stringify(observed)!==JSON.stringify(expected))throw new Error(`Projected known IDs/knowledge/currentSight differ: ${JSON.stringify(result.states)}`);
 const unknownPresent=await page.locator('[data-entity-id]').evaluateAll((nodes,id)=>nodes.some(node=>node.getAttribute('data-entity-id')===id),UNKNOWN_FOG_PICK_FIXTURE_ID);
 if(unknownPresent)throw new Error('An unknown map entity became a rendered or selectable DOM target');
 const accessibleText=await page.locator('.map-accessible-entities').innerText();
 const accessibleUnknown=accessibleText.includes(UNKNOWN_FOG_PICK_FIXTURE_ID);
 if(accessibleUnknown)throw new Error('An unknown map entity became an accessibility target');
 const telemetry=await page.evaluate(()=>JSON.stringify((window).__mapMetrics??[]));
 if(telemetry.includes(UNKNOWN_FOG_PICK_FIXTURE_ID))throw new Error('Unknown entity identity leaked into renderer window telemetry');
 if(unknownCase){
  const map=page.locator('.terrain-svg--deep'),box=await map.boundingBox();
  if(!box)throw new Error('Unknown-fog map camera has no visible surface');
  await map.click({position:{x:box.width/2,y:box.height/2}});
  const pickedUnknown=await page.locator('[data-entity-id].is-selected').evaluateAll((nodes,id)=>nodes.some(node=>node.getAttribute('data-entity-id')===id),UNKNOWN_FOG_PICK_FIXTURE_ID);
  if(pickedUnknown)throw new Error('An unknown map entity became a selectable target');
 }
 if(unknownCase&&result.fixture!=='unknown-fog')throw new Error(`Unknown-fog camera preset missing: ${JSON.stringify(result)}`);
 if(!unknownCase&&result.cameraMode!=='local')throw new Error(`Known fog case should use the local camera: ${JSON.stringify(result)}`);
}
async function captureFogCase(minutes,kind,viewport){
 const unknownCase=kind==='unknown',fixture=unknownCase?'unknown-fog':'local-camp';
 const page=await openMap(browser,{viewport,dpr,quality,fixture});
 try{
  await navigateMap(page,'Bản đồ');
  await selectMapTime(page,minutes);
  await readyMap(page);
  await assertFogProjection(page,minutes,unknownCase);
  const row=await capture(page,`fog-${kind}-${minutes===420?'day':'night'}`,viewport);
  row.fog={projection:'demo-visible-snapshot',phase:minutes===420?'day':'night',minutes,reviewStatus:'pending-parent-visual-review',unknownOmissionAsserted:unknownCase};
  return row;
 }finally{await page.close();}
}
async function captureLocalGeography(kind,viewport){
 const page=await openMap(browser,{viewport,dpr,quality,fixture:`local-${kind}`});
 try{
  await navigateMap(page,'Bản đồ');
  await readyMap(page);
  const scene=page.locator('.map-scene');
  const metadata=await scene.evaluate(node=>({
   fixture:node.getAttribute('data-map-qa-fixture'),cameraMode:node.getAttribute('data-map-qa-camera-mode'),
   provenance:node.getAttribute('data-map-qa-provenance'),centerKm:node.getAttribute('data-map-qa-fixture-center-km'),
   anchorKm:node.getAttribute('data-map-qa-fixture-anchor-km'),
   fixtureKnownId:node.getAttribute('data-map-qa-fixture-known-id'),sightClearM:Number(node.getAttribute('data-map-qa-fixture-sight-clear-m')),
   sightFadeM:Number(node.getAttribute('data-map-qa-fixture-sight-fade-m')),cameraXKm:Number(node.getAttribute('data-map-qa-camera-x-km')),
   cameraYKm:Number(node.getAttribute('data-map-qa-camera-y-km')),cameraZoom:Number(node.getAttribute('data-map-qa-camera-zoom')),
  }));
  const expectedId=kind==='forest'?'QA-GEO-FOREST':kind==='stone'?'QA-GEO-STONE':'QA-GEO-WATER';
  const canonicalUnknownId=kind==='forest'?'SITE-LL01-040':kind==='stone'?'SITE-LL01-041':'SITE-LL01-042';
  const expectedAnchorKm=kind==='forest'?'4.7,-6.8':kind==='stone'?'-7.8,-4.7':'8.9,-11.2';
  const expectedCameraCenterKm=kind==='water'?'10.7,-11.2':expectedAnchorKm;
  const knownState=await scene.evaluate(node=>JSON.parse(node.getAttribute('data-map-qa-known-state')??'null'));
  const knownFixture=Array.isArray(knownState)?knownState.find(entry=>entry.id===expectedId):null;
  const marker=page.locator(`.map-entity-marker[data-entity-id="${expectedId}"]`);
  const markerState=await marker.evaluate(node=>({knowledge:node.getAttribute('data-knowledge'),currentSight:Number(node.getAttribute('data-current-sight')),label:node.getAttribute('aria-label')})).catch(()=>null);
  const canonicalUnknownLeaks=await page.evaluate(id=>({
   rendered:Array.from(document.querySelectorAll('[data-entity-id]')).some(node=>node.getAttribute('data-entity-id')===id),
   accessible:document.querySelector('.map-accessible-entities')?.textContent?.includes(id)??false,
   telemetry:JSON.stringify((window).__mapMetrics??[]).includes(id),
  }),canonicalUnknownId);
  const metrics=await page.evaluate(()=>window.__mapMetrics.at(-1));
  if(metadata.fixture!==`local-${kind}`||metadata.cameraMode!=='local'||metadata.provenance!=='demo-qa-known-geography-fixture'||metadata.fixtureKnownId!==expectedId||metadata.centerKm!==expectedCameraCenterKm||metadata.anchorKm!==expectedAnchorKm||metadata.sightClearM!==2200||metadata.sightFadeM!==3000)throw new Error(`Local ${kind} scene is not using its declared synthetic DEMO geography anchor/camera: ${JSON.stringify(metadata)}`);
  if(!knownFixture||knownFixture.knowledge!=='current'||knownFixture.currentSight!==1)throw new Error(`Local ${kind} QA fixture was not retained in projected-known metadata: ${JSON.stringify(knownFixture)}`);
  if(kind!=='water'&&(!markerState||markerState.knowledge!=='current'||markerState.currentSight!==1||!markerState.label?.includes('DEMO')))throw new Error(`Local ${kind} camera did not project its synthetic known marker: ${JSON.stringify(markerState)}`);
  if(kind==='water'&&markerState&&(!markerState.label?.includes('DEMO')||markerState.knowledge!=='current'||markerState.currentSight!==1))throw new Error(`Local water off-camera marker metadata is inconsistent: ${JSON.stringify(markerState)}`);
  if(canonicalUnknownLeaks.rendered||canonicalUnknownLeaks.accessible||canonicalUnknownLeaks.telemetry)throw new Error(`Local ${kind} QA leaked the undiscovered canonical site into DOM/accessibility/telemetry: ${JSON.stringify(canonicalUnknownLeaks)}`);
  if(!metrics||metrics.visibleTerrainChunks<=0||metrics.terrainBytes<=0||metrics.errors.length)throw new Error(`Local ${kind} terrain renderer is not ready: ${JSON.stringify(metrics)}`);
  let shoreline=null;
  if(kind==='water'){
   const host=await page.locator('.map-render-host').boundingBox();
   if(!host)throw new Error('Water QA renderer host is missing');
   const banks=waterShoreEvidence(host,{xKm:metadata.cameraXKm,yKm:metadata.cameraYKm,zoom:metadata.cameraZoom});
   const invalidBank=banks.visibleBanks.find(prop=>!prop.id.startsWith('shore-bank:')||prop.kind!=='bank'||!Number.isFinite(prop.worldWidth??prop.size)||(prop.worldWidth??prop.size)<48||(prop.worldWidth??prop.size)>80||prop.variant<0||prop.variant>7);
   const invalidRadius=banks.radii.find(radius=>Math.abs(radius-.84446)>.015);
   if(banks.metresPerPixel>1.5||!banks.visibleBanks.length||banks.sampledWorldProps!==metrics.visible||invalidBank||invalidRadius!==undefined||banks.westEdgeIceWeight<.45||banks.eastEdgeIceWeight>.45||banks.westPaintedIceWeight<.9||banks.eastPaintedIceWeight>.05)throw new Error(`Water QA camera does not expose authored shoreline banks and both sides of the semantic and painted ice edges: ${JSON.stringify({banks:{visible:banks.visibleBanks.length,radii:banks.radii,widths:banks.widths,sampled:banks.sampledWorldProps,invalidBank,invalidRadius},metricsVisible:metrics.visible,westEdgeDistance:banks.westEdgeDistance,eastEdgeDistance:banks.eastEdgeDistance,westEdgeIceWeight:banks.westEdgeIceWeight,eastEdgeIceWeight:banks.eastEdgeIceWeight,westPaintedIceWeight:banks.westPaintedIceWeight,eastPaintedIceWeight:banks.eastPaintedIceWeight})}`);
   shoreline={model:'terrain-sampler-ice-ellipse-plus-shoreline-banks',ellipseCenterKm:expectedAnchorKm,ellipseRadiiM:{x:2100,y:1200},boundaryRadius:.84446,bankNormalJitterMaxM:16,bankVisibleCount:banks.visibleBanks.length,bankRadii:banks.radii,bankWorldWidthsM:banks.widths,westEdgeDistance:banks.westEdgeDistance,eastEdgeDistance:banks.eastEdgeDistance,westEdgeIceWeight:banks.westEdgeIceWeight,eastEdgeIceWeight:banks.eastEdgeIceWeight,westPaintedIceWeight:banks.westPaintedIceWeight,eastPaintedIceWeight:banks.eastPaintedIceWeight,paintMask:{transitionWeights:[.34,.56],perMaterialCompositeAlpha:.6},renderedWorldProps:metrics.visible,metresPerPixel:banks.metresPerPixel,halfViewportM:{x:banks.halfWidth,y:banks.halfHeight}};
  }
  const row=await capture(page,`local-${kind}`,viewport);row.geography={kind,fixtureKnownId:expectedId,knowledge:knownFixture.knowledge,currentSight:knownFixture.currentSight,markerVisibleInFrame:Boolean(markerState),provenance:metadata.provenance,anchorKm:metadata.anchorKm,centerKm:metadata.centerKm,camera:{mode:metadata.cameraMode,xKm:metadata.cameraXKm,yKm:metadata.cameraYKm,zoom:metadata.cameraZoom},sight:{clearM:metadata.sightClearM,fadeM:metadata.sightFadeM},terrain:{visibleChunks:metrics.visibleTerrainChunks,bytes:metrics.terrainBytes},...(shoreline?{shoreline}:{}),canonicalUnknownOmissionAsserted:true,reviewStatus:'pending-parent-visual-review'};persistProgress();return row;
 }finally{await page.close();}
}
const assetManifest=JSON.parse(readFileSync(new URL('../public/assets/manifest.json',import.meta.url),'utf8'));
const damagedAsset=assetManifest.assets.find(asset=>asset.assetId==='lord-house-damaged');
if(!damagedAsset)throw new Error('lord-house-damaged is missing from the synchronized asset manifest');
const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
function authoredPoseSources(assetId){
 const asset=assetManifest.assets.find(item=>item.assetId===assetId);
 if(!asset)throw new Error(`Orientation review asset ${assetId} is missing from the synchronized manifest`);
 const sources=Object.fromEntries(allOrientations.map(orientation=>{
  // Layered architecture exports render their authored compass source in the
  // upper layer; the body role points at the shared composition script.
  const entry=asset.mapExports.find(item=>item.role==='upper'&&item.lod==='close'&&item.orientation===orientation)
   ??asset.mapExports.find(item=>item.role==='body'&&item.lod==='close'&&item.orientation===orientation);
  if(!entry?.source||!entry.sourceSha256)throw new Error(`${assetId} has no authored close body source for ${orientation}`);
  const sourceUrl=entry.source.startsWith('/')?new URL('../public'+entry.source,import.meta.url):new URL('../../'+entry.source,import.meta.url);
  if(entry.sourceSha256!==sha256(readFileSync(sourceUrl)))throw new Error(`${assetId} ${orientation} source hash differs from its registered master`);
  return [orientation,{source:entry.source,sourceSha256:entry.sourceSha256}];
 }));
 if(new Set(Object.values(sources).map(source=>source.sourceSha256)).size!==4)throw new Error(`${assetId} compass poses are not four distinct authored source images`);
 return sources;
}
async function savePoseContactSheet(family,items,viewport){
 if(items.length!==4||new Set(items.map(item=>item.orientation)).size!==4)throw new Error(`${family} contact sheet requires four distinct authored compass poses`);
 const group=family==='farmhouse'?'architecture/progression/':family==='watchtower'||family==='elemental'?'architecture/prototypes/':family==='house'?'architecture/extended/':'architecture/';
 const directory=resolve(output,String(viewport.width),group);mkdirSync(directory,{recursive:true});
 const tileWidth=360,tileHeight=320,labelHeight=30,composites=[];
 for(let index=0;index<items.length;index++){
  const item=items[index],full=readFileSync(resolve(output,item.filename)),metadata=await sharp(full).metadata();
  const scale=(metadata.width??viewport.width)/viewport.width,box=item.box,side=Math.min(420,viewport.width,viewport.height);
  const left=Math.max(0,Math.min(viewport.width-side,box.x+box.width/2-side/2)),top=Math.max(0,Math.min(viewport.height-side,box.y+box.height/2-side/2));
  const detailPath=item.filename.replace(/\.png$/,'-detail.png');
  await sharp(full).extract({left:Math.round(left*scale),top:Math.round(top*scale),width:Math.min(Math.round(side*scale),(metadata.width??viewport.width)-Math.round(left*scale)),height:Math.min(Math.round(side*scale),(metadata.height??viewport.height)-Math.round(top*scale))}).png().toFile(resolve(output,detailPath));
  const tile=await sharp(resolve(output,detailPath)).resize(tileWidth,tileHeight-labelHeight,{fit:'contain',background:'#102128'}).png().toBuffer();
  const x=(index%2)*tileWidth,y=Math.floor(index/2)*(tileHeight+labelHeight),label=Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#12252c"/><text x="10" y="20" fill="#f2e5c8" font-family="sans-serif" font-size="15">${family} · ${item.orientation}</text></svg>`);
  composites.push({input:tile,left:x,top:y+labelHeight},{input:label,left:x,top:y});item.row.artOrientation.detailCapture=detailPath;
 }
 const filename=`${viewport.width}/${group}orientation-sheet-${family}-${viewport.width}-${quality}-dpr${dpr}.png`;
 await sharp({create:{width:tileWidth*2,height:(tileHeight+labelHeight)*2,channels:4,background:'#102128'}}).composite(composites).png().toFile(resolve(output,filename));
 return filename;
}
async function saveProgressionContactSheet(items,viewport){
 if(items.length!==12)throw new Error(`Progression review sheet requires 12 north-up mode captures; received ${items.length}`);
 const directory=resolve(output,String(viewport.width),'architecture/progression');mkdirSync(directory,{recursive:true});
 const columns=3,tileWidth=360,tileHeight=288,labelHeight=30,composites=[];
 for(let index=0;index<items.length;index++){
  const item=items[index],image=await sharp(resolve(output,item.detailCapture)).resize(tileWidth,tileHeight,{fit:'contain',background:'#102128'}).png().toBuffer(),x=(index%columns)*tileWidth,y=Math.floor(index/columns)*(tileHeight+labelHeight),label=Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#12252c"/><text x="10" y="20" fill="#f2e5c8" font-family="sans-serif" font-size="14">${item.assetId} · ${item.mode} · north</text></svg>`);
  composites.push({input:image,left:x,top:y+labelHeight},{input:label,left:x,top:y});
 }
 const filename=`${viewport.width}/architecture/progression/orientation-sheet-north-progression-${viewport.width}-${quality}-dpr${dpr}.png`;
 await sharp({create:{width:columns*tileWidth,height:4*(tileHeight+labelHeight),channels:4,background:'#102128'}}).composite(composites).png().toFile(resolve(output,filename));
 return filename;
}
const damagedSources=Object.fromEntries(['north','east','south','west'].map(orientation=>{
 const entry=damagedAsset.mapExports.find(item=>item.role==='body'&&item.lod==='close'&&item.orientation===orientation);
 const source=entry?.source;
 const sourceUrl=source?.startsWith('/')?new URL('../public'+source,import.meta.url):source?new URL('../../'+source,import.meta.url):null;
 if(!entry||!sourceUrl||entry.sourceSha256!==sha256(readFileSync(sourceUrl)))throw new Error(`Damaged-house ${orientation} source hash differs from its registered master`);
 return [orientation,{source,sourceSha256:entry.sourceSha256,renderedPose:orientation==='north'?damagedAsset.orientationViews[orientation].body:entry.layerPath,shadow:damagedAsset.orientationViews[orientation]?.shadow??damagedAsset.mapLayers.shadow}];
}));
if(new Set(Object.values(damagedSources).map(item=>item.source)).size!==4||new Set(Object.values(damagedSources).map(item=>item.sourceSha256)).size!==4)throw new Error('Damaged-house compass poses must use four distinct authored source images');
async function saveDamagedHouseSheets(crops,viewport){
 const directory=resolve(output,String(viewport.width),'architecture/damaged-house');
 const sheet=async(name,items,columns)=>{
  const tileWidth=360,tileHeight=288,labelHeight=28,rows=Math.ceil(items.length/columns),composites=[];
  for(let i=0;i<items.length;i++){
   const tile=await sharp(items[i].image).resize(tileWidth,tileHeight,{fit:'cover'}).png().toBuffer();
   const x=(i%columns)*tileWidth,y=Math.floor(i/columns)*(tileHeight+labelHeight);
   const overlay=Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#12252c"/><text x="10" y="20" fill="#f2e5c8" font-family="sans-serif" font-size="15">${items[i].label}</text></svg>`);
   composites.push({input:tile,left:x,top:y+labelHeight},{input:overlay,left:x,top:y});
  }
  await sharp({create:{width:columns*tileWidth,height:rows*(tileHeight+labelHeight),channels:4,background:'#102128'}}).composite(composites).png().toFile(resolve(directory,name));
 };
 await sheet('damaged-house-four-poses.png',crops.filter(item=>item.group==='pose'),2);
 await sheet('damaged-house-modes.png',crops.filter(item=>item.group==='mode'),3);
}
async function captureDamagedHouse(calibration,viewport){
 await ensureCalibrationOpen(calibration);
 await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-damaged');
 await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 const orientationSelect=calibration.getByLabel('Hướng hình kiểm tra',{exact:true}),preview=calibration.locator('[data-art-qa-footprint]'),crops=[];
 const sceneCrop=async(row)=>{
  const box=await preview.boundingBox();if(!box)throw new Error('Damaged-house art preview outline has no visible bounds');
  const full=readFileSync(resolve(output,row.filename)),metadata=await sharp(full).metadata(),scale=(metadata.width??viewport.width)/viewport.width,side=Math.min(420,viewport.width,viewport.height),leftCss=Math.max(0,Math.min(viewport.width-side,box.x+box.width/2-side/2)),topCss=Math.max(0,Math.min(viewport.height-side,box.y+box.height/2-side/2)),left=Math.round(leftCss*scale),top=Math.round(topCss*scale),width=Math.min(Math.round(side*scale),(metadata.width??viewport.width)-left),height=Math.min(Math.round(side*scale),(metadata.height??viewport.height)-top);
  return sharp(full).extract({left,top,width,height}).png().toBuffer();
 };
 const record=async(orientation,mode)=>{
  await bringMapIntoView(calibration);
  await readyMap(calibration);
  const outlineOrientation=await preview.getAttribute('data-art-qa-orientation'),footprint=await preview.getAttribute('points');
  if(outlineOrientation!==orientation)throw new Error(`Damaged-house preview requested ${orientation} but rendered ${outlineOrientation}`);
  if(!footprint)throw new Error(`Damaged-house ${orientation} preview is missing its physical outline`);
  const layers=await calibration.evaluate(()=>window.__mapMetrics?.at(-1)?.qaArtLayers),expected=mode==='normal'?{base:1,upper:1,body:null}:mode==='planning'?{base:1,upper:null,body:null}:{base:1,upper:.22,body:null};
  if(JSON.stringify(layers)!==JSON.stringify(expected))throw new Error(`Damaged-house ${orientation}/${mode} alpha metrics differ: ${JSON.stringify(layers)}`);
  const captureName=mode==='normal'?orientation:`north-${mode}`,row=await capture(calibration,`damaged-house-${captureName}`,viewport),image=await sceneCrop(row);
  writeFileSync(resolve(output,String(viewport.width),'architecture/damaged-house',`damaged-house-${captureName}-${viewport.width}-${quality}-dpr${dpr}-detail.png`),image);
  const result={label:captureName,group:mode==='normal'?'pose':'mode',orientation,mode,image,footprint,layers,source:damagedSources[orientation],expectedShadow:damagedSources[orientation].shadow,observedMapRequests:calibration.mapAssetTransfers.filter(item=>item.path.includes('/lord-house-damaged/')).map(item=>item.path),fullCapture:`${viewport.width}/architecture/damaged-house/damaged-house-${captureName}-${viewport.width}-${quality}-dpr${dpr}.png`};
  row.damagedHouse=Object.fromEntries(Object.entries(result).filter(([key])=>key!=='image'));
  crops.push(result);
 };
 for(const orientation of ['north','east','south','west']){
  await orientationSelect.selectOption(orientation);
  await record(orientation,'normal');
 }
 await orientationSelect.selectOption('north');
 await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();
 await record('north','planning');
 await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();
 await record('north','focus');
 await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 await saveDamagedHouseSheets(crops,viewport);
 writeFileSync(resolve(output,String(viewport.width),'architecture/damaged-house/damaged-house-qa.json'),JSON.stringify({assetId:'lord-house-damaged',viewport,dpr,quality,sourceHashes:damagedSources,captures:crops.map(({image,...item})=>item)},null,2));
}
async function captureL30Modes(calibration,viewport){
 await ensureCalibrationOpen(calibration);
 await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-l30');
 const cases=[
  ['normal',{base:1,upper:1,body:null}],
  ['planning',{base:1,upper:null,body:null}],
  ['focus',{base:1,upper:.22,body:null}]
 ];
 for(const [mode,expected] of cases){
  if(mode==='planning')await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();
  if(mode==='focus')await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();
  await calibration.waitForFunction(expected=>{
   const metric=window.__mapMetrics?.at(-1);
   return metric&&metric.backend!=='initializing'&&JSON.stringify(metric.qaArtLayers)===JSON.stringify(expected);
  },expected,{timeout:30000});
  const layers=await calibration.evaluate(()=>window.__mapMetrics?.at(-1)?.qaArtLayers);
  if(JSON.stringify(layers)!==JSON.stringify(expected))throw new Error(`L30 ${mode} alpha metrics differ: ${JSON.stringify(layers)}`);
  const row=await capture(calibration,`late-lord-house-l30-${mode}`,viewport);
  row.l30={assetId:'lord-house-l30',mode,qaArtLayers:layers,orientation:'north',footprintAssumption:'ART-ONLY-PREVIEW-FOOTPRINT-V1'};
  if(mode==='planning')await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 }
 await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 await calibration.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
}
async function captureTombModes(calibration,viewport){
 const asset=assetManifest.assets.find(item=>item.assetId==='tomb-entry');
 if(!asset)throw new Error('Canonical tomb-entry is missing from the synchronized asset manifest');
 if(asset.orientation!=='north')throw new Error(`Canonical tomb QA is north-only; registered orientation is ${asset.orientation}`);
 const physical=asset.compatiblePhysicalFootprint;
 if(!physical||physical.widthM!==6||physical.depthM!==5)throw new Error(`Canonical tomb footprint must be 6 × 5 m; found ${JSON.stringify(physical)}`);
 const sources={};
 for(const role of ['base','upper']){
  const entry=asset.mapExports.find(item=>item.role===role&&item.lod==='close'&&item.orientation==='north');
  const source=entry?.source,sourceUrl=source?.startsWith('/')?new URL('../public'+source,import.meta.url):source?new URL('../../'+source,import.meta.url):null;
  if(!entry||!sourceUrl||entry.sourceSha256!==sha256(readFileSync(sourceUrl)))throw new Error(`Canonical tomb ${role} source hash differs from its registered north master`);
  sources[role]={source,sourceSha256:entry.sourceSha256};
 }
 await ensureCalibrationOpen(calibration);
 await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption('tomb-entry');
 await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 const outline=calibration.locator('[data-art-qa-footprint]');
 if(viewport.width===390){
  const before=await outline.getAttribute('points');
  if(!before)throw new Error('Tomb preview footprint is missing before the mobile camera adjustment');
  await calibration.getByRole('button',{name:'Thu nhỏ lãnh địa'}).click();
  await calibration.waitForFunction(previous=>document.querySelector('[data-art-qa-footprint]')?.getAttribute('points')!==previous,before,{timeout:10000});
 }
 const cases=[['normal',{base:1,upper:1,body:null}],['planning',{base:1,upper:null,body:null}],['focus',{base:1,upper:.22,body:null}]];
 const captures=[];
 for(const [mode,expected] of cases){
  if(mode==='planning')await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();
  if(mode==='focus')await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();
  await readyMap(calibration);
  const layers=await calibration.evaluate(()=>window.__mapMetrics?.at(-1)?.qaArtLayers);
  if(JSON.stringify(layers)!==JSON.stringify(expected))throw new Error(`Tomb ${mode} renderer alpha metrics differ: ${JSON.stringify(layers)}`);
  const points=await outline.getAttribute('points');
  if(!points||!/^[-\d., ]{8,}$/.test(points))throw new Error(`Tomb ${mode} is missing its physical footprint outline`);
  const row=await capture(calibration,`tomb-entry-${mode}`,viewport,{waitForIdle:false});
  row.tomb={assetId:'tomb-entry',orientation:'north',mode,qaArtLayers:layers,rendererReadiness:{backend:row.metrics.backend,queued:row.metrics.queued,pendingTextures:row.metrics.pendingTextures},footprint:{...physical,points},sourceHashes:sources};
  captures.push(row.tomb);
  if(mode==='planning')await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 }
 await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 await calibration.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
 writeFileSync(resolve(output,String(viewport.width),'architecture/tomb-entry','tomb-entry-qa.json'),JSON.stringify({assetId:'tomb-entry',orientation:'north',viewport,dpr,quality,cameraAdjustment:{zoomOutSteps:viewport.width===390?1:0},physicalFootprint:physical,sourceHashes:sources,captures},null,2));
}
try{
 for(const viewport of viewports){
  const page=architectureOnly?null:await openMap(browser,{viewport,dpr,quality});
  if(geographyOnly){
   const kinds=geographyKind?[geographyKind]:['forest','stone','water'];
   for(const kind of kinds)await captureLocalGeography(kind,viewport);
   const count=evidence.filter(row=>row.viewport.width===viewport.width).length;
   if(count!==kinds.length)throw new Error(`Geography-only QA expected ${kinds.length} anchored region captures at ${viewport.width}px, received ${count}`);
   continue;
  }
  if(fogOnly){
   await captureFogCase(1140,'remembered',viewport);
   const count=evidence.filter(row=>row.viewport.width===viewport.width).length;
   if(count!==1)throw new Error(`Fog-only QA expected one remembered-night capture at ${viewport.width}px, received ${count}`);
   continue;
  }
  if(page){await navigateMap(page,'Lãnh địa');await capture(page,'opening',viewport);}
  const calibration=await openMap(browser,{viewport,dpr,quality});await navigateMap(calibration,'Lãnh địa');
  await calibration.getByRole('button',{name:'Về lửa trại',exact:true}).click();
  await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();
  if(damagedHouseOnly){await captureDamagedHouse(calibration,viewport);await calibration.close();continue;}
  if(l30Only){await captureL30Modes(calibration,viewport);await calibration.close();continue;}
  if(tombOnly){await captureTombModes(calibration,viewport);await calibration.close();continue;}
  if(!progressionOnly)await capture(calibration,'fire-close',viewport);
  for(const [family,label,orientations] of families.filter(([family])=>!progressionOnly&&(!requestedFamilies||requestedFamilies.includes(family)))){
   await calibration.getByRole('button',{name:label,exact:true}).click();
   const scene=calibration.locator('.territory-scene-svg');await scene.scrollIntoViewIfNeeded();
   const box=await scene.boundingBox();await scene.click({position:{x:box.width*.55,y:box.height*.65}});
   await scene.focus();await calibration.keyboard.press('Escape');
   const name=label.replace('Thử bố trí ','');
   if(orientationAssetIds[family]){
    const draft=calibration.locator(`.territory-building.is-draft[data-asset-id="${orientationAssetIds[family]}"]`).last();
    for(let turn=0;turn<4&&await draft.getAttribute('data-orientation')!=='north';turn++)await calibration.getByRole('button',{name:`Xoay ${name}`,exact:true}).click();
    if(await draft.getAttribute('data-orientation')!=='north')throw new Error(`${family} authored preview did not return to north before capture`);
   }
   const poseRows=[];
   for(const [index,orientation] of orientations.entries()){
    let beforeScreenshot=null;
    if(orientationAssetIds[family]){
     const assetId=orientationAssetIds[family],item=calibration.locator(`.territory-building.is-draft[data-asset-id="${assetId}"]`).last();
     const node=await item.elementHandle();
     if(!node)throw new Error(`${family} has no active SVG draft for ${assetId}`);
     const readActive=()=>node.evaluate(el=>({id:el.getAttribute('data-building-id'),assetId:el.getAttribute('data-asset-id'),orientation:el.getAttribute('data-orientation'),connected:el.isConnected})).catch(()=>null);
     const waitForPaint=before=>node.evaluate(async(el,expected)=>{
      const read=()=>({id:el.getAttribute('data-building-id'),assetId:el.getAttribute('data-asset-id'),orientation:el.getAttribute('data-orientation'),connected:el.isConnected});
      const matches=value=>value?.connected&&value.id===expected.id&&value.assetId===expected.assetId&&value.orientation===expected.orientation;
      if(!matches(read()))return null;
      const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
      await frame();await frame();
      const applied=read();return matches(applied)?applied:null;
     },before).catch(()=>null);
     const applied=await waitForAppliedQaOrientation(readActive,waitForPaint,assetId,orientation);
     beforeScreenshot=async()=>{
      const current=await readActive();
      if(!current?.connected||current.id!==applied.id||current.assetId!==assetId||current.orientation!==orientation)throw new Error(`${family} SVG draft changed before capture: ${JSON.stringify(current)}`);
     };
    }
    const row=await capture(calibration,`${family}-${orientation}`,viewport,{beforeScreenshot});
    if(orientationAssetIds[family]){
     const assetId=orientationAssetIds[family],item=calibration.locator(`.territory-building.is-draft[data-asset-id="${assetId}"]`).last(),box=await item.boundingBox();
     if(!box)throw new Error(`${family}-${orientation} authored draft has no visible crop bounds`);
     const source=authoredPoseSources(assetId)[orientation];
     row.artOrientation={assetId,orientation,source:source.source,sourceSha256:source.sourceSha256};
     poseRows.push({row,orientation,filename:row.filename,box});
    }
    if(index<orientations.length-1)await calibration.getByRole('button',{name:`Xoay ${name}`,exact:true}).click();
   }
   if(orientationAssetIds[family]){
    const sources=authoredPoseSources(orientationAssetIds[family]);
    const contactSheet=await savePoseContactSheet(family,poseRows,viewport);
    for(const row of evidence.slice(-poseRows.length))row.artOrientation={...row.artOrientation,contactSheet,sourceHashes:sources,reviewStatus:'pending-parent-visual-review'};
   }
   if(!['wall','gate'].includes(family)){
    await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();await capture(calibration,`${family}-planning`,viewport);
    await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
    await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();await capture(calibration,`${family}-focus`,viewport);
    await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
   }
   await calibration.getByRole('button',{name:`Xóa ${name}`,exact:true}).click();
  }
  if(progressionOnly||!requestedFamilies){
   await ensureCalibrationOpen(calibration);
   await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
   const progressionCaptures=[];
   for(const id of ['lord-house-repaired','lord-house-l30','polar-farmhouse-l10','survival-fire-l26']){
    await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption(id);
    for(const mode of ['normal','planning','focus']){
     if(mode==='planning')await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();
     if(mode==='focus')await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();
     const row=await capture(calibration,`late-${id}-${mode}`,viewport),outline=calibration.locator('[data-art-qa-footprint]'),box=await outline.boundingBox();
     if(!box)throw new Error(`Progression art preview ${id}/${mode} has no visible crop outline`);
     const full=readFileSync(resolve(output,row.filename)),metadata=await sharp(full).metadata(),scale=(metadata.width??viewport.width)/viewport.width,side=Math.min(420,viewport.width,viewport.height),leftCss=Math.max(0,Math.min(viewport.width-side,box.x+box.width/2-side/2)),topCss=Math.max(0,Math.min(viewport.height-side,box.y+box.height/2-side/2)),left=Math.round(leftCss*scale),top=Math.round(topCss*scale),detailCapture=row.filename.replace(/\.png$/,'-detail.png');
     await sharp(full).extract({left,top,width:Math.min(Math.round(side*scale),(metadata.width??viewport.width)-left),height:Math.min(Math.round(side*scale),(metadata.height??viewport.height)-top)}).png().toFile(resolve(output,detailCapture));
     row.artPreview={assetId:id,orientation:'north',mode,detailCapture,reviewStatus:'pending-parent-visual-review'};
     progressionCaptures.push({row,assetId:id,mode,detailCapture});
     if(mode==='planning')await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
     if(mode==='focus')await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
    }
   }
   const progressionSheet=await saveProgressionContactSheet(progressionCaptures,viewport);
   for(const item of progressionCaptures)item.row.artPreview.contactSheet=progressionSheet;
   await calibration.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
   await captureTombModes(calibration,viewport);
  }
  await calibration.close();
  if(!page)continue;
  await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await capture(page,'planning',viewport);
  await page.getByRole('button',{name:'Bình thường',exact:true}).click();
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('off');await capture(page,'heat-off',viewport);
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('2500');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();await capture(page,'heat-2500',viewport);
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('25000');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();await capture(page,'heat-25000',viewport);
  await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();
  await ensureCalibrationOpen(page);await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();await capture(page,'dense-520',viewport);
  await navigateMap(page,'Bản đồ');await capture(page,'local',viewport);
  await page.locator('.map-developer-tools > summary').click();await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');await page.locator('.map-developer-tools > summary').click();await capture(page,'night',viewport);
  await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới',exact:true}).click();await capture(page,'world-night',viewport);
  await page.locator('.map-developer-tools > summary').click();await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('420');await page.locator('.map-developer-tools > summary').click();await capture(page,'world',viewport);
  await page.close();
  const fallback=await openMap(browser,{viewport,dpr,quality,fallback:true});await navigateMap(fallback,'Lãnh địa');await capture(fallback,'fallback',viewport);await fallback.close();
  await captureDemoFixture('populated-12','populated12',viewport,{expectedCount:12});
  await captureDemoFixture('overlap-depth','overlap',viewport,{expectedCount:3});
  for(const kind of ['forest','stone','water'])await captureLocalGeography(kind,viewport);
  for(const minutes of [420,1140])for(const kind of ['current','remembered','unknown'])await captureFogCase(minutes,kind,viewport);
 }
 if(expectFullPerViewport){
  for(const viewport of viewports){
   const count=evidence.filter(row=>row.viewport.width===viewport.width).length;
   if(count!==73)throw new Error(`Full QA suite expected 73 capture rows at ${viewport.width}px, received ${count}`);
  }
 }
 completed=true;
}finally{
 persistProgress(completed?'captured-pending-visual-review':'incomplete');
 await browser.close();
}
console.log(`Captured ${evidence.length} deterministic map scenarios. Images require visual review; capture is not approval.`);
