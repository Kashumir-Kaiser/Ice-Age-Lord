import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';

const viewportChoices=[{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}];
const requestedWidths=process.env.MAP_QA_VIEWPORTS?.split(',').map(Number);
if(requestedWidths?.some(width=>!viewportChoices.some(v=>v.width===width)))throw new Error('MAP_QA_VIEWPORTS must list 1366,1920,390');
const viewports=viewportChoices.filter(v=>!requestedWidths||requestedWidths.includes(v.width));
const progressionOnly=process.env.MAP_QA_PROGRESSION_ONLY==='1';
// Target the real four-pose damaged-house QA fixture only; use MAP_QA_VIEWPORTS/DPR/QUALITY as usual.
const damagedHouseOnly=process.env.MAP_QA_DAMAGED_HOUSE_ONLY==='1';
const l30Only=process.env.MAP_QA_L30_ONLY==='1';
const architectureOnly=progressionOnly||damagedHouseOnly||l30Only||process.env.MAP_QA_ARCHITECTURE_ONLY==='1';
const families=[['wall','Thử bố trí Tường Rào'],['gate','Thử bố trí Cổng Gỗ · mẫu ảnh'],['tower','Thử bố trí Tháp cao · minh họa'],['house','Thử bố trí Nhà thấp · minh họa'],['farmhouse','Thử bố trí Nhà Nông Phu Cực Địa'],['watchtower','Thử bố trí Tháp Canh · mẫu ảnh'],['elemental','Thử bố trí Tháp Nguyên Tố · mẫu ảnh']];
const requestedFamilies=process.env.MAP_QA_FAMILIES?.split(',');
if(requestedFamilies?.some(name=>!families.some(([family])=>family===name)))throw new Error('Unknown MAP_QA_FAMILIES entry');
if(damagedHouseOnly&&(progressionOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_DAMAGED_HOUSE_ONLY cannot be combined with other scenario filters');
if(l30Only&&(progressionOnly||damagedHouseOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1'||requestedFamilies))throw new Error('MAP_QA_L30_ONLY cannot be combined with other scenario filters');
const browser=await launchMapBrowser(),evidence=[];
const output=resolve(process.env.MAP_QA_DIR??'map-evidence/after');mkdirSync(output,{recursive:true});
const dpr=Number(process.env.MAP_QA_DPR??1),quality=process.env.MAP_QA_QUALITY??'normal';
async function capture(page,name,viewport){
 await page.locator('[data-map-renderer]').evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
 const group=/^damaged-house/.test(name)?'architecture/damaged-house/':/^(watchtower|elemental)-/.test(name)?'architecture/prototypes/':/^(farmhouse|late)-/.test(name)?'architecture/progression/':/^(house|tower)-/.test(name)?'architecture/extended/':/^(wall|gate)-/.test(name)?'architecture/':'';
 const directory=resolve(output,String(viewport.width),group);mkdirSync(directory,{recursive:true});
 const filename=`${viewport.width}/${group}${name}-${viewport.width}-${quality}-dpr${dpr}.png`;
 try{await readyMap(page);}catch(error){
  const metrics=await page.evaluate(()=>window.__mapMetrics?.at(-1));
  writeFileSync(resolve(output,filename+'.failure.json'),JSON.stringify({name,viewport,dpr,quality,metrics,error:String(error)},null,2));
  await page.screenshot({path:resolve(output,filename+'.failure.png'),animations:'disabled'});throw error;
 }
 await page.screenshot({path:resolve(output,filename),animations:'disabled'});
 const row={filename,viewport,dpr,quality,metrics:await page.evaluate(()=>window.__mapMetrics.at(-1))};evidence.push(row);return row;
}
const assetManifest=JSON.parse(readFileSync(new URL('../public/assets/manifest.json',import.meta.url),'utf8'));
const damagedAsset=assetManifest.assets.find(asset=>asset.assetId==='lord-house-damaged');
if(!damagedAsset)throw new Error('lord-house-damaged is missing from the synchronized asset manifest');
const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
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
 await calibration.locator('.territory-calibration > summary').click();
 await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-damaged');
 await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 const orientationSelect=calibration.getByLabel('Hướng hình kiểm tra',{exact:true}),preview=calibration.locator('[data-art-qa-footprint]'),crops=[];
 const sceneCrop=async(row)=>{
  const box=await preview.boundingBox();if(!box)throw new Error('Damaged-house art preview outline has no visible bounds');
  const full=readFileSync(resolve(output,row.filename)),metadata=await sharp(full).metadata(),scale=(metadata.width??viewport.width)/viewport.width,side=Math.min(420,viewport.width,viewport.height),leftCss=Math.max(0,Math.min(viewport.width-side,box.x+box.width/2-side/2)),topCss=Math.max(0,Math.min(viewport.height-side,box.y+box.height/2-side/2)),left=Math.round(leftCss*scale),top=Math.round(topCss*scale),width=Math.min(Math.round(side*scale),(metadata.width??viewport.width)-left),height=Math.min(Math.round(side*scale),(metadata.height??viewport.height)-top);
  return sharp(full).extract({left,top,width,height}).png().toBuffer();
 };
 const record=async(orientation,mode)=>{
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
 await calibration.locator('.territory-calibration > summary').click();
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
  await readyMap(calibration);
  const layers=await calibration.evaluate(()=>window.__mapMetrics?.at(-1)?.qaArtLayers);
  if(JSON.stringify(layers)!==JSON.stringify(expected))throw new Error(`L30 ${mode} alpha metrics differ: ${JSON.stringify(layers)}`);
  const row=await capture(calibration,`late-lord-house-l30-${mode}`,viewport);
  row.l30={assetId:'lord-house-l30',mode,qaArtLayers:layers,orientation:'north',footprintAssumption:'ART-ONLY-PREVIEW-FOOTPRINT-V1'};
  if(mode==='planning')await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 }
 await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
 await calibration.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
}
try{
 for(const viewport of viewports){
  const page=architectureOnly?null:await openMap(browser,{viewport,dpr,quality});
  if(page){await navigateMap(page,'Lãnh địa');await capture(page,'opening',viewport);}
  const calibration=await openMap(browser,{viewport,dpr,quality});await navigateMap(calibration,'Lãnh địa');
  await calibration.getByRole('button',{name:'Về lửa trại',exact:true}).click();
  await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();
  if(damagedHouseOnly){await captureDamagedHouse(calibration,viewport);await calibration.close();continue;}
  if(l30Only){await captureL30Modes(calibration,viewport);await calibration.close();continue;}
  if(!progressionOnly)await capture(calibration,'fire-close',viewport);
  for(const [family,label] of families.filter(([family])=>!progressionOnly&&(!requestedFamilies||requestedFamilies.includes(family)))){
   await calibration.getByRole('button',{name:label,exact:true}).click();
   const scene=calibration.locator('.territory-scene-svg');await scene.scrollIntoViewIfNeeded();
   const box=await scene.boundingBox();await scene.click({position:{x:box.width*.55,y:box.height*.65}});
   await scene.focus();await calibration.keyboard.press('Escape');
   const name=label.replace('Thử bố trí ','');
   for(const orientation of ['north','east','south','west']){
    await capture(calibration,`${family}-${orientation}`,viewport);
    await calibration.getByRole('button',{name:`Xoay ${name}`,exact:true}).click();
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
   await calibration.locator('.territory-calibration > summary').click();
   await calibration.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
   for(const id of ['lord-house-repaired','lord-house-l30','polar-farmhouse-l10','survival-fire-l26']){
    await calibration.getByLabel('Hình minh họa',{exact:true}).selectOption(id);
    await capture(calibration,`late-${id}-normal`,viewport);
    await calibration.getByRole('button',{name:'Mặt bằng',exact:true}).click();await capture(calibration,`late-${id}-planning`,viewport);
    await calibration.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();await capture(calibration,`late-${id}-focus`,viewport);
    await calibration.getByRole('button',{name:'Bình thường',exact:true}).click();
   }
   await calibration.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
  }
  await calibration.close();
  if(!page)continue;
  await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await capture(page,'planning',viewport);
  await page.getByRole('button',{name:'Bình thường',exact:true}).click();
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('off');await capture(page,'heat-off',viewport);
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('2500');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();await capture(page,'heat-2500',viewport);
  await page.getByLabel('Xem thử vùng nhiệt').selectOption('25000');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();await capture(page,'heat-25000',viewport);
  await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();
  await page.locator('.territory-calibration > summary').click();await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();await capture(page,'dense-520',viewport);
  await navigateMap(page,'Bản đồ');await capture(page,'local',viewport);
  await page.locator('.map-developer-tools > summary').click();await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');await page.locator('.map-developer-tools > summary').click();await capture(page,'night',viewport);
  await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới',exact:true}).click();await capture(page,'world-night',viewport);
  await page.locator('.map-developer-tools > summary').click();await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('420');await page.locator('.map-developer-tools > summary').click();await capture(page,'world',viewport);
  await page.close();
  const fallback=await openMap(browser,{viewport,dpr,quality,fallback:true});await navigateMap(fallback,'Lãnh địa');await capture(fallback,'fallback',viewport);await fallback.close();
 }
}finally{writeFileSync(resolve(output,'scenarios.json'),JSON.stringify(evidence,null,2));await browser.close();}
console.log(`Captured ${evidence.length} deterministic map scenarios. Images require visual review; capture is not approval.`);
