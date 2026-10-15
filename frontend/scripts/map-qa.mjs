import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';

const viewportChoices=[{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}];
const requestedWidths=process.env.MAP_QA_VIEWPORTS?.split(',').map(Number);
if(requestedWidths?.some(width=>!viewportChoices.some(v=>v.width===width)))throw new Error('MAP_QA_VIEWPORTS must list 1366,1920,390');
const viewports=viewportChoices.filter(v=>!requestedWidths||requestedWidths.includes(v.width));
const progressionOnly=process.env.MAP_QA_PROGRESSION_ONLY==='1';
const architectureOnly=progressionOnly||process.env.MAP_QA_ARCHITECTURE_ONLY==='1';
const families=[['wall','Thử bố trí Tường Rào'],['gate','Thử bố trí Cổng Gỗ · mẫu ảnh'],['tower','Thử bố trí Tháp cao · minh họa'],['house','Thử bố trí Nhà thấp · minh họa'],['farmhouse','Thử bố trí Nhà Nông Phu Cực Địa'],['watchtower','Thử bố trí Tháp Canh · mẫu ảnh'],['elemental','Thử bố trí Tháp Nguyên Tố · mẫu ảnh']];
const requestedFamilies=process.env.MAP_QA_FAMILIES?.split(',');
if(requestedFamilies?.some(name=>!families.some(([family])=>family===name)))throw new Error('Unknown MAP_QA_FAMILIES entry');
const browser=await launchMapBrowser(),evidence=[];
const output=resolve(process.env.MAP_QA_DIR??'map-evidence/after');mkdirSync(output,{recursive:true});
const dpr=Number(process.env.MAP_QA_DPR??1),quality=process.env.MAP_QA_QUALITY??'normal';
async function capture(page,name,viewport){
 await page.locator('[data-map-renderer]').evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
 const group=/^(watchtower|elemental)-/.test(name)?'architecture/prototypes/':/^(farmhouse|late)-/.test(name)?'architecture/progression/':/^(house|tower)-/.test(name)?'architecture/extended/':/^(wall|gate)-/.test(name)?'architecture/':'';
 const directory=resolve(output,String(viewport.width),group);mkdirSync(directory,{recursive:true});
 const filename=`${viewport.width}/${group}${name}-${viewport.width}-${quality}-dpr${dpr}.png`;
 try{await readyMap(page);}catch(error){
  const metrics=await page.evaluate(()=>window.__mapMetrics?.at(-1));
  writeFileSync(resolve(output,filename+'.failure.json'),JSON.stringify({name,viewport,dpr,quality,metrics,error:String(error)},null,2));
  await page.screenshot({path:resolve(output,filename+'.failure.png'),animations:'disabled'});throw error;
 }
 await page.screenshot({path:resolve(output,filename),animations:'disabled'});
 evidence.push({filename,viewport,dpr,quality,metrics:await page.evaluate(()=>window.__mapMetrics.at(-1))});
}
try{
 for(const viewport of viewports){
  const page=architectureOnly?null:await openMap(browser,{viewport,dpr,quality});
  if(page){await navigateMap(page,'Lãnh địa');await capture(page,'opening',viewport);}
  const calibration=await openMap(browser,{viewport,dpr,quality});await navigateMap(calibration,'Lãnh địa');
  await calibration.getByRole('button',{name:'Về lửa trại',exact:true}).click();
  await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();await calibration.getByRole('button',{name:'Phóng to lãnh địa'}).click();
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
