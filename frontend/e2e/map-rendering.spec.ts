import { test, expect } from '@playwright/test';
import { installLocalPreviewRoute } from './localPreviewRoute';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { fogOpacityAt } from '../src/mapModel.ts';

test.beforeEach(async({page})=>installLocalPreviewRoute(page));
async function renderHostIntoView(page:import('@playwright/test').Page){await page.locator('.map-render-host').first().scrollIntoViewIfNeeded();}
async function scrollMapHostOffscreen(page:import('@playwright/test').Page,host:import('@playwright/test').Locator){
 await page.evaluate(()=>{
  const spacer=document.createElement('div');spacer.dataset.mapQaOffscreenSpacer='true';spacer.style.cssText=`display:block;width:1px;height:${innerHeight*2}px;pointer-events:none;`;
  document.body.append(spacer);window.scrollTo(0,document.documentElement.scrollHeight);
 });
 await expect.poll(()=>host.evaluate(node=>{const box=node.getBoundingClientRect();return box.bottom<0||box.top>=innerHeight;}),{timeout:10000}).toBe(true);
}
async function territory(page:import('@playwright/test').Page,options=''){
 await page.goto('/?mode=demo&mapQA=1'+options);await expect(page.locator('.app-shell')).toBeVisible();
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await expect(page.locator('.territory-stage [data-map-renderer]')).toHaveAttribute('data-map-renderer',/webgl|canvas2d/);
 await expect(page.locator('.territory-stage .map-render-canvas')).toHaveCount(1);
 await renderHostIntoView(page);
}
test('real renderer opens normal gameplay with exact opening IDs, grid toggle and planning control',async({page})=>{
 await territory(page);await expect(page.locator('.territory-building:not(.is-draft)')).toHaveCount(4);
 await expect(page.locator('.territory-scene-svg line')).toHaveCount(0);
 await page.getByRole('button',{name:'Lưới',exact:true}).click();expect(await page.locator('.territory-scene-svg line').count()).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect(page.locator('.territory-building image')).toHaveCount(0);
 await page.locator('.territory-scene-svg').focus();await page.keyboard.press('p');await expect(page.getByRole('button',{name:'Bình thường',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('ordinary demo placement palette keeps authored four-pose art and hides calibration fixtures',async({page})=>{
 await page.goto('/?mode=demo');await expect(page.locator('.app-shell')).toBeVisible();
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 for(const name of ['Nhà Nông Phu Cực Địa','Tường Rào','Cổng Gỗ · mẫu ảnh','Nhà thấp · minh họa','Tháp Canh · mẫu ảnh','Tháp Nguyên Tố · mẫu ảnh'])
  await expect(page.getByRole('button',{name:`Thử bố trí ${name}`,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Thử bố trí Tháp cao · minh họa',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Thử bố trí Mẫu lửa tối đa',exact:true})).toHaveCount(0);
 await page.goto('/?mode=demo&mapQA=1');
 const qaMenu=page.getByRole('button',{name:'Mở điều hướng'});if(await qaMenu.isVisible())await qaMenu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await expect(page.getByRole('button',{name:'Thử bố trí Tháp cao · minh họa',exact:true})).toBeVisible();
 const fireMax=page.getByRole('button',{name:'Thử bố trí Mẫu lửa tối đa',exact:true});await fireMax.scrollIntoViewIfNeeded();await expect(fireMax).toBeVisible();
});
test('25 km preview fits the complete heat boundary without changing the real heat radius',async({page})=>{
 await territory(page);await page.getByLabel('Xem thử vùng nhiệt').selectOption('25000');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();
 const scene=page.locator('.territory-scene-svg'),ellipse=scene.locator('.territory-camera-overlay > ellipse').first();
 await expect.poll(async()=>{const box=await scene.boundingBox(),rx=Number(await ellipse.getAttribute('rx'));return rx*2<=box!.width+1;}).toBe(true);
 const box=await scene.boundingBox(),rx=Number(await ellipse.getAttribute('rx')),ry=Number(await ellipse.getAttribute('ry'));expect(rx*2).toBeGreaterThan(box!.width*.45);expect(ry*2).toBeLessThanOrEqual(box!.height+1);
 await expect(page.locator('.territory-status-row')).toContainText('Nhiệt thật: 10 m');await expect(page.getByLabel('Xem thử vùng nhiệt')).toHaveValue('25000');
});
test('a dense scene stops its animation loop when its active fire is outside the viewport',async({page})=>{
 test.setTimeout(90000);
 await page.emulateMedia({reducedMotion:'no-preference'});await territory(page);
 await page.locator('.territory-calibration > summary').click();await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();
 const scene=page.locator('.territory-scene-svg');await scene.evaluate(node=>node.scrollIntoView({block:'center'}));const box=(await scene.boundingBox())!;
 await page.mouse.move(box.x+box.width*.65,box.y+box.height*.65);await page.mouse.down();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.65,{steps:4});await page.mouse.up();
 await renderHostIntoView(page);
 await expect.poll(()=>page.evaluate(()=>{const m=(window as unknown as {__mapMetrics:{queued:number;pendingTextures:number;activeLoops:number}[]}).__mapMetrics.at(-1)!;return m.queued+m.pendingTextures+m.activeLoops;}),{timeout:60000}).toBe(0);
 await expect(page.locator('.territory-building[data-building-id^="qa-dense-"] circle')).toHaveCount(0);
});
test('Canvas2D fallback uses the same geometry, selection list and camera controls',async({page})=>{
 await territory(page,'&mapFallback=1');await expect(page.locator('[data-map-renderer]')).toHaveAttribute('data-map-renderer','canvas2d');
 const house=page.locator('.territory-instance').filter({hasText:'Nhà Lãnh Chúa'}).first();await house.locator('.territory-instance-main').click();
 await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-001');
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-001');
});
test('reduced motion and locked low quality remain selectable and do not start effects loops',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await territory(page);await page.getByLabel('Chất lượng bản đồ').selectOption('low');
 await renderHostIntoView(page);
 await expect.poll(()=>page.evaluate(()=>{const metrics=(window as unknown as {__mapMetrics:{activeLoops:number;queued:number}[]}).__mapMetrics;return metrics?.at(-1)?.queued;}),{timeout:15000}).toBe(0);
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{activeLoops:number}[]}).__mapMetrics.at(-1)?.activeLoops)).toBe(0);
});
test('preserved painted flame animates only for visible active fire; reduced motion freezes it and planning removes it',async({page})=>{
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'no-preference'});await territory(page);
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 await renderHostIntoView(page);
 const backend=await page.locator('[data-map-renderer]').getAttribute('data-map-renderer');test.skip(backend!=='webgl','Canvas2D retains static fire indication with effects disabled.');
 const flames=async()=>{await renderHostIntoView(page);return page.evaluate(()=>(window as unknown as {__mapMetrics:{flameFrame:number|null;flameSprites:number}[]}).__mapMetrics.at(-1)!);};
 await expect.poll(async()=>(await flames()).flameSprites,{timeout:30000}).toBe(1);
 const first=(await flames()).flameFrame;
 await expect.poll(async()=>(await flames()).flameFrame).not.toBe(first);
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(async()=>(await flames()).flameFrame).toBe(0);
 await page.waitForTimeout(350);expect((await flames()).flameFrame).toBe(0);
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect.poll(async()=>(await flames()).flameSprites).toBe(0);
 await page.getByRole('button',{name:'Bình thường',exact:true}).click();await expect.poll(async()=>(await flames()).flameFrame).toBe(0);
 await page.getByLabel('Xem thử vùng nhiệt').selectOption('25000');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();await expect.poll(async()=>(await flames()).flameSprites).toBe(0);
});
test('overlapping distant symbols remain selectable and cycle beyond their tiny physical footprints',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await territory(page);
 await page.getByLabel('Xem thử vùng nhiệt').selectOption('25000');await page.getByRole('button',{name:'Toàn bộ vùng nhiệt',exact:true}).click();
 const scene=page.locator('.territory-scene-svg');await scene.evaluate(node=>node.scrollIntoView({block:'center'}));
 const target=await scene.evaluate(node=>{
  const symbols=Array.from(node.querySelectorAll('.territory-building:not(.is-draft) .territory-art-hit')).map(p=>{
   const points=p.getAttribute('points')!.trim().split(/\s+/).map(v=>v.split(',').map(Number));
   return {id:p.closest('[data-building-id]')!.getAttribute('data-building-id'),x:Math.max(...points.map(p=>p[0]))-3,y:(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2,width:Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))};
  }).sort((a,b)=>b.x-a.x);
  const s=symbols[0],box=node.getBoundingClientRect();return {...s,x:s.x+box.left,y:s.y+box.top};
 });
 expect(target.width).toBe(12);
 const visited=new Set<string>();
 for(let i=0;i<4;i++){
  await page.mouse.click(target.x,target.y);await expect(page.locator('.territory-building.is-selected')).toHaveCount(1);
  visited.add((await page.locator('.territory-building.is-selected').getAttribute('data-building-id'))!);
 }
 expect(visited.has(target.id!)).toBe(true);expect(visited.size).toBeGreaterThan(1);
});
test('missing raster derivatives retain registered art and interactions',async({page})=>{
 await page.route('**/assets/map/buildings/**',route=>route.fulfill({status:404,body:'missing map export'}));
 await territory(page);await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();
 await page.locator('.territory-building[data-building-id="SITE-LL01-003"]').press('Enter');await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-003');
});
test('wall and gate preview exits planning and loads registered depth slices for every upright pose',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 const requested=new Set<string>();page.on('request',r=>requested.add(new URL(r.url()).pathname));
 await territory(page);await page.getByLabel('Chất lượng bản đồ').selectOption('normal');
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 for(const [asset,name] of [['opening-palisade-wall','Tường Rào'],['opening-timber-gate','Cổng Gỗ · mẫu ảnh']]){
  await page.getByRole('button',{name:`Thử bố trí ${name}`,exact:true}).click();
  const scene=page.locator('.territory-scene-svg');await scene.scrollIntoViewIfNeeded();const box=(await scene.boundingBox())!;
  await scene.click({position:{x:box.width*.55,y:box.height*.65}});await scene.focus();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Bình thường',exact:true})).toHaveAttribute('aria-pressed','true');
  const draft=page.locator(`.territory-building.is-draft[data-asset-id="${asset}"]`);
  for(const orientation of ['north','east','south','west']){
   await expect(draft).toHaveAttribute('data-orientation',orientation);await expect(draft).not.toHaveAttribute('data-missing-orientation','true');
   await renderHostIntoView(page);
   await expect.poll(()=>Array.from(requested).some(p=>p.includes(`/assets/map/buildings/${asset}/depth-${orientation}-`)||p.includes(`/assets/map/buildings/${asset}/slice-${orientation}-`)),{timeout:20000}).toBe(true);
   await page.getByRole('button',{name:`Xoay ${name}`,exact:true}).click();
  }
  await page.getByRole('button',{name:`Xóa ${name}`,exact:true}).click();await expect(draft).toHaveCount(0);
 }
});

test('architectural tower loads separate footing and upper art when its atlas is unavailable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/assets/map/buildings/fixture-tall-tower/atlas-*.png*',route=>route.fulfill({status:404,body:'missing atlas'}));
 const requested=new Set<string>();page.on('request',r=>requested.add(new URL(r.url()).pathname));
 await territory(page);await page.getByLabel('Chất lượng bản đồ').selectOption('normal');
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 await page.getByRole('button',{name:'Thử bố trí Tháp cao · minh họa',exact:true}).click();
 const scene=page.locator('.territory-scene-svg');await scene.scrollIntoViewIfNeeded();const box=(await scene.boundingBox())!;
 await scene.click({position:{x:box.width*.55,y:box.height*.65}});
 await expect(page.locator('.territory-placement-controls').getByRole('button',{name:'Xoay 90°'})).toBeDisabled();
 await scene.focus();await page.keyboard.press('Escape');
 for(const role of ['base','upper'])await expect.poll(()=>Array.from(requested).some(p=>new RegExp(`/fixture-tall-tower/${role}-(close|district)\\.png$`).test(p)),{timeout:20000}).toBe(true);
 const draft=page.locator('.territory-building.is-draft[data-asset-id="fixture-tall-tower"]');await expect(draft).toHaveCount(1);
 await expect(draft).toHaveAttribute('data-orientation','north');
 await expect(page.locator('.territory-placement-controls')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Xoay Tháp cao · minh họa',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect(page.getByRole('button',{name:'Mặt bằng',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Xóa Tháp cao · minh họa',exact:true}).click();await expect(draft).toHaveCount(0);
});

test('watchtower and elemental art previews load every authored pose without changing settlement instances',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/assets/map/buildings/*tower-preview/atlas-*.png*',route=>route.fulfill({status:404,body:'pose frame fallback'}));
 const requested=new Set<string>();page.on('request',r=>requested.add(new URL(r.url()).pathname));
 await territory(page);await page.getByLabel('Chất lượng bản đồ').selectOption('normal');
 const existing=await page.locator('.territory-instance-main').allTextContents();
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 for(const [asset,name]of [['watchtower-preview','Tháp Canh · mẫu ảnh'],['elemental-tower-preview','Tháp Nguyên Tố · mẫu ảnh']]){
  await page.getByRole('button',{name:`Thử bố trí ${name}`,exact:true}).click();const scene=page.locator('.territory-scene-svg');await scene.scrollIntoViewIfNeeded();const box=(await scene.boundingBox())!;
  await scene.click({position:{x:box.width*.55,y:box.height*.65}});await scene.focus();await page.keyboard.press('Escape');
  const draft=page.locator(`.territory-building.is-draft[data-asset-id="${asset}"]`);await expect(draft).toHaveCount(1);
  for(const orientation of ['north','east','south','west']){
   await expect(draft).toHaveAttribute('data-orientation',orientation);await expect(draft).not.toHaveAttribute('data-missing-orientation','true');
   await renderHostIntoView(page);
   for(const role of ['base','upper'])await expect.poll(()=>Array.from(requested).some(p=>new RegExp(`/${asset}/${role}-${orientation}-(close|district)\\.png$`).test(p)),{timeout:20000}).toBe(true);
   await page.getByRole('button',{name:`Xoay ${name}`,exact:true}).click();
  }
  await page.getByRole('button',{name:`Xóa ${name}`,exact:true}).click();await expect(draft).toHaveCount(0);
 }
 await expect(page.locator('.territory-instance-main')).toHaveText(existing);
});

test('twenty map switches dispose departed renderers and preserve territory selection',async({page})=>{
 test.setTimeout(90000);
 await page.emulateMedia({reducedMotion:'reduce'});await territory(page);
 await page.locator('.territory-instance').filter({hasText:'Nhà Lãnh Chúa'}).first().locator('.territory-instance-main').click();
 for(let i=0;i<20;i++){
  const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Bản đồ',exact:true}).click();
  await expect(page.locator('.map-render-canvas')).toHaveCount(1);
  if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
  await expect(page.locator('.map-render-canvas')).toHaveCount(1);
 }
 await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-001');
 await renderHostIntoView(page);
 await expect.poll(()=>page.evaluate(()=>{
  const data=(window as unknown as {__mapMetrics:{activeLoops:number;textureBytes:number;queued:number}[]}).__mapMetrics;
  return data?.slice(0,-1).some(m=>m.activeLoops!==0||m.textureBytes!==0||m.queued!==0);
 }),{timeout:15000}).toBe(false);
});

test('losing a WebGL context recovers into one usable canvas with the same selected entity',async({page})=>{
 await territory(page);
 const backend=await page.locator('[data-map-renderer]').getAttribute('data-map-renderer');
 test.skip(backend!=='webgl','Browser has no usable WebGL context; dedicated fallback journey still runs.');
 await page.locator('.territory-building[data-building-id="SITE-LL01-003"]').press('Enter');
 await page.locator('.map-render-canvas').evaluate(node=>node.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.locator('[data-map-renderer]')).toHaveAttribute('data-map-renderer','canvas2d');
 await expect(page.locator('.map-render-canvas')).toHaveCount(1);
 await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-003');
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-003');
});

test('art QA loads preserved late art without adding a settlement entity or placement rule',async({page})=>{
 test.setTimeout(90000);
 const requested=new Set<string>();page.on('request',request=>requested.add(new URL(request.url()).pathname));
 await territory(page);
 const list=page.locator('.territory-instance-main'),before=await list.allTextContents();
 await page.locator('.territory-calibration > summary').click();
 await page.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-l30');
 await page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await renderHostIntoView(page);
 await expect(page.locator('[data-art-qa-footprint]')).toHaveCount(1);
 await expect.poll(()=>Array.from(requested).some(path=>path.includes('/map/buildings/lord-house-l30/')),{timeout:30000}).toBe(true);
 await expect(list).toHaveText(before);
 await page.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
 await expect(page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true})).toBeVisible();
 await expect(page.locator('[data-art-qa-footprint]')).toHaveCount(0);
 await expect(list).toHaveText(before);
 await page.goto('/?mode=demo');
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await page.locator('.territory-calibration > summary').click();
 await expect(page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true})).toHaveCount(0);
});

test('repaired house raster failures use its smoke-free map SVG and retain the original UI source',async({page})=>{
 test.setTimeout(90000);
 const requested=new Set<string>();page.on('request',request=>requested.add(new URL(request.url()).pathname));
 await page.route('**/assets/map/buildings/lord-house-repaired/*.png*',route=>route.fulfill({status:404,body:'exercise static SVG fallback'}));
 await territory(page);
 await page.locator('.territory-calibration > summary').click();
 await page.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-repaired');
 await page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await renderHostIntoView(page);
 await expect.poll(()=>requested.has('/assets/map/buildings/lord-house-repaired/body-static.svg'),{timeout:30000}).toBe(true);
 await expect.poll(()=>requested.has('/assets/map/buildings/lord-house-repaired/shadow-ground.svg'),{timeout:30000}).toBe(true);
 await expect(page.locator('.territory-calibration-preview image').nth(1)).toHaveAttribute('href','/assets/buildings/lord-house-repaired/base.svg');
 await expect(page.locator('.map-render-canvas')).toHaveCount(1);
 await expect(page.locator('[data-map-renderer]')).toHaveAttribute('data-map-renderer',/webgl|canvas2d/);
});

test('compact overview keeps permitted map controls without downloading full scenery, and territory loads versioned art',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 const requested=new Set<string>();page.on('request',request=>requested.add(request.url()));
 await page.goto('/?mode=demo&mapQA=1');await expect(page.locator('.app-shell')).toBeVisible();
 await expect(page.locator('.map-experience--compact .map-render-canvas')).toHaveCount(1);
 await renderHostIntoView(page);
 await expect.poll(()=>page.evaluate(()=>{
  const m=(window as unknown as {__mapMetrics?:{frames:number;queued:number;pendingTextures:number}[]}).__mapMetrics?.at(-1);
  return Boolean(m&&m.frames>0&&m.queued===0&&m.pendingTextures===0);
 }),{timeout:60000}).toBe(true);
 expect(Array.from(requested).some(url=>url.includes('/assets/map/terrain/'))).toBe(false);
 const compact=page.locator('.map-experience--compact');
 const qualityBox=(await compact.locator('.map-render-options').boundingBox())!,cameraBox=(await compact.locator('.map-corner-controls').boundingBox())!;
 expect(qualityBox.y+qualityBox.height<=cameraBox.y||qualityBox.y>=cameraBox.y+cameraBox.height).toBe(true);
 const openBox=(await compact.locator('.map-open-full').boundingBox())!,fogBox=(await compact.locator('.map-compact-label').boundingBox())!;
 expect(fogBox.y>=openBox.y+openBox.height||fogBox.x+fogBox.width<=openBox.x).toBe(true);

 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await expect.poll(()=>Array.from(requested).some(url=>/\/assets\/map\/terrain\/[^?]+\?mapHash=[a-f0-9]{64}/.test(url)),{timeout:30000}).toBe(true);
 const watchCard=page.locator('.territory-definition').filter({has:page.getByRole('button',{name:'Thử bố trí Tháp Canh · mẫu ảnh',exact:true})});
 await expect(watchCard.locator('img')).toHaveAttribute('src','/assets/map/buildings/watchtower-preview/icon.svg');
 expect(Array.from(requested).some(url=>/\/assets\/map\/buildings\/(watchtower|elemental-tower)-preview\/body\.svg/.test(url))).toBe(false);
});

test('DEMO QA territory fixtures are static and expose only fixture counts',async({page})=>{
 await page.goto('/?mode=demo&mapQA=1&mapFixture=populated12');await expect(page.locator('.app-shell')).toBeVisible();
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 const stage=page.locator('.territory-stage');await expect(stage).toHaveAttribute('data-map-qa-fixture','populated12');await expect(stage).toHaveAttribute('data-map-qa-fixture-count','12');
 await expect(page.locator('.territory-building.is-draft')).toHaveCount(0);
 await expect(page.locator('[data-entity-id^="map-qa-static-"], [data-building-id^="map-qa-static-"], [aria-label*="Hình minh họa QA"]')).toHaveCount(0);
 await expect(page.getByRole('button',{name:/QA fixture/i})).toHaveCount(0);
 await page.goto('/?mode=demo&mapQA=1&mapFixture=overlap');await expect(page.locator('.app-shell')).toBeVisible();
 const overlapMenu=page.getByRole('button',{name:'Mở điều hướng'});if(await overlapMenu.isVisible())await overlapMenu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await expect(page.locator('.territory-stage')).toHaveAttribute('data-map-qa-fixture','overlap');
 await expect(page.locator('.territory-stage')).toHaveAttribute('data-map-qa-fixture-count','3');
 await expect(page.locator('.territory-building.is-draft')).toHaveCount(0);
});

test('fog QA metadata reflects only projected known entities and omits unknown targets',async({page})=>{
 // MODELED-STONE-01's authored fixture coordinate is (-31,-52) in src/worldFeatures.ts;
 // the live projector uses this exact fogOpacityAt predicate for currentSight.
 const oracleSight={day:Number(fogOpacityAt(-31,-52,420,1,true)<.12),night:Number(fogOpacityAt(-31,-52,1140,1,true)<.12)};
 expect(oracleSight).toEqual({day:1,night:0});
 await page.goto('/?mode=demo&mapQA=1&mapFixture=local-camp');await expect(page.locator('.app-shell')).toBeVisible();
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Bản đồ',exact:true}).click();
 const scene=page.locator('.map-scene');
 const setTime=async(minutes:number)=>{
  await page.locator('.map-developer-tools > summary').click();await page.getByLabel('Mô phỏng giờ hiển thị').selectOption(String(minutes));await page.locator('.map-developer-tools > summary').click();
  await expect(scene).toHaveAttribute('data-map-qa-clock-minutes',String(minutes));
 };
 await setTime(420);
 await expect(scene).toHaveAttribute('data-map-qa-phase','day');
 await expect(scene).toHaveAttribute('data-map-qa-provenance','demo-visible-snapshot');
 await expect(scene).toHaveAttribute('data-map-qa-known-state',JSON.stringify([
  {id:'SITE-LL01-000',knowledge:'current',currentSight:1},
  {id:'MODELED-SALVAGE-01',knowledge:'current',currentSight:1},
  {id:'MODELED-STONE-01',knowledge:'remembered',currentSight:oracleSight.day},
 ]));
 const unknownFixtureId='MODELED-01-001';
 const assertUnknownAbsent=async()=>{
  await expect(page.locator(`[data-entity-id="${unknownFixtureId}"]`)).toHaveCount(0);
  await expect(page.locator('.map-accessible-entities')).not.toContainText(unknownFixtureId);
  expect(await page.evaluate(()=>JSON.stringify((window as unknown as {__mapMetrics?:unknown[]}).__mapMetrics??[]))).not.toContain(unknownFixtureId);
 };
 await assertUnknownAbsent();await setTime(1140);
 await expect(scene).toHaveAttribute('data-map-qa-phase','night');
 await expect(scene).toHaveAttribute('data-map-qa-known-state',JSON.stringify([
  {id:'SITE-LL01-000',knowledge:'current',currentSight:1},
  {id:'MODELED-SALVAGE-01',knowledge:'current',currentSight:1},
  {id:'MODELED-STONE-01',knowledge:'remembered',currentSight:oracleSight.night},
 ]));
 await assertUnknownAbsent();
 await page.goto('/?mode=demo&mapQA=1&mapFixture=unknown-fog');await expect(page.locator('.app-shell')).toBeVisible();
 const unknownMenu=page.getByRole('button',{name:'Mở điều hướng'});if(await unknownMenu.isVisible())await unknownMenu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Bản đồ',exact:true}).click();
 await expect(page.locator('.map-scene')).toHaveAttribute('data-map-qa-fixture','unknown-fog');
 await expect(page.locator('.map-scene')).toHaveAttribute('data-map-qa-phase','night');await assertUnknownAbsent();
});

test('renderer combines document-hidden and offscreen gates, then resumes with its stable host',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'no-preference'});await territory(page);
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 const backend=await page.locator('[data-map-renderer]').getAttribute('data-map-renderer');test.skip(backend!=='webgl','Canvas2D has no animated flame loop to observe.');
 const host=page.locator('.map-render-host').first();await renderHostIntoView(page);
 const flameFrame=()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{flameFrame:number|null;activeLoops:number;frames:number}[]}).__mapMetrics.at(-1)!);
 await expect.poll(async()=>(await flameFrame()).flameFrame,{timeout:30000}).not.toBe(0);
 const visibleFrame=(await flameFrame()).flameFrame;
 await scrollMapHostOffscreen(page,host);
 await expect.poll(async()=>(await flameFrame()).activeLoops,{timeout:10000}).toBe(0);
 const pausedFrame=(await flameFrame()).flameFrame;await page.waitForTimeout(250);
 expect((await flameFrame()).flameFrame).toBe(pausedFrame);
 expect(visibleFrame).not.toBe(pausedFrame);
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,value:true});
  Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
  document.dispatchEvent(new Event('visibilitychange'));
 });
 await renderHostIntoView(page);
 await expect.poll(()=>host.evaluate(node=>{const box=node.getBoundingClientRect();return box.bottom>0&&box.top<innerHeight;}),{timeout:10000}).toBe(true);
 await page.waitForTimeout(250);expect((await flameFrame()).flameFrame).toBe(pausedFrame);
 await expect.poll(async()=>(await flameFrame()).activeLoops,{timeout:10000}).toBe(0);
 await page.evaluate(()=>{
  delete (document as Document&{hidden?:boolean}).hidden;
  delete (document as Document&{visibilityState?:DocumentVisibilityState}).visibilityState;
  document.dispatchEvent(new Event('visibilitychange'));
 });
 await expect.poll(async()=>(await flameFrame()).activeLoops,{timeout:10000}).toBeGreaterThan(0);
 const resumedFrames=(await flameFrame()).frames;
 await expect.poll(async()=>(await flameFrame()).frames,{timeout:10000}).toBeGreaterThan(resumedFrames);
 await expect.poll(async()=>(await flameFrame()).flameFrame,{timeout:10000}).not.toBe(pausedFrame);
});

test('Canvas2D fallback retains its host observer and renders invalidation after returning onscreen',async({page})=>{
 test.setTimeout(45000);await page.emulateMedia({reducedMotion:'reduce'});await territory(page,'&mapFallback=1');
 await expect(page.locator('[data-map-renderer]')).toHaveAttribute('data-map-renderer','canvas2d');
 const host=page.locator('.map-render-host').first(),frames=()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{frames:number;queued:number}[]}).__mapMetrics.at(-1)!);
 await renderHostIntoView(page);await expect.poll(async()=>(await frames()).frames,{timeout:20000}).toBeGreaterThan(0);
 await scrollMapHostOffscreen(page,host);
 const before=(await frames()).frames;
 await page.locator('.territory-scene-svg').evaluate(node=>node.dispatchEvent(new KeyboardEvent('keydown',{key:'+',bubbles:true,cancelable:true})));
 await page.waitForTimeout(200);expect((await frames()).frames).toBe(before);
 await renderHostIntoView(page);
 await expect.poll(async()=>(await frames()).frames,{timeout:10000}).toBeGreaterThan(before);
});

test('repaired and damaged house architecture load for normal, planning and focus',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 const requested=new Set<string>();page.on('request',request=>requested.add(new URL(request.url()).pathname));
 await territory(page);const before=await page.locator('.territory-instance-main').allTextContents();
 await page.locator('.territory-calibration > summary').click();await page.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-repaired');
 await page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await renderHostIntoView(page);
 await expect(page.getByLabel('Hướng hình kiểm tra',{exact:true})).toHaveCount(0);
 for(const role of ['base','upper'])await expect.poll(()=>Array.from(requested).some(path=>new RegExp(`/lord-house-repaired/${role}-north-(close|district)\\.png$`).test(path)),{timeout:30000}).toBe(true);
 const alphas=async()=>{await renderHostIntoView(page);return page.evaluate(()=>(window as unknown as {__mapMetrics:{qaArtLayers:{base:number|null;upper:number|null;body:number|null}|null}[]}).__mapMetrics.at(-1)?.qaArtLayers);};
 await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:1,body:null});
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:null,body:null});
 await page.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:.22,body:null});
 await page.getByLabel('Hình minh họa',{exact:true}).selectOption('lord-house-damaged');
 const orientation=page.getByLabel('Hướng hình kiểm tra',{exact:true}),outline=page.locator('[data-art-qa-footprint]');
 await expect(orientation).toHaveValue('north');
 for(const pose of ['north','east','south','west']){await orientation.selectOption(pose);await expect(outline).toHaveAttribute('data-art-qa-orientation',pose);}
 await orientation.selectOption('north');
 await expect.poll(()=>Array.from(requested).some(path=>/\/lord-house-damaged\/(atlas-close|base-north-close|upper-north-close)\.png$/.test(path)),{timeout:30000}).toBe(true);
 await page.getByRole('button',{name:'Bình thường',exact:true}).click();await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:1,body:null});
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:null,body:null});
 await page.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();await expect.poll(alphas,{timeout:30000}).toEqual({base:1,upper:.22,body:null});
 await expect(page.locator('.territory-instance-main')).toHaveText(before);
});

test('canonical 6 × 5 m tomb renders registered base and upper layers in normal, planning and focus',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 const requested=new Set<string>();page.on('request',request=>requested.add(new URL(request.url()).pathname));
 await territory(page);const before=await page.locator('.territory-instance-main').allTextContents();
 const registered=await page.evaluate(async()=>{
  const manifest=await fetch('/assets/manifest.json').then(response=>response.json()),asset=manifest.assets.find((item:{assetId:string})=>item.assetId==='tomb-entry');
  if(!asset)throw new Error('tomb-entry is absent from the served manifest');
  const footprint=asset.compatiblePhysicalFootprint,sources:Record<string,{source:string;sourceSha256:string}>={};
  for(const role of ['base','upper']){
   const entry=asset.mapExports.find((item:{role:string;lod:string;orientation:string})=>item.role===role&&item.lod==='close'&&item.orientation==='north');
   if(!entry)throw new Error(`tomb-entry has no north close ${role} export source`);
   sources[role]={source:entry.source,sourceSha256:entry.sourceSha256};
  }
  return {orientation:asset.orientation,footprint,sources};
 });
 expect(registered.orientation).toBe('north');
 expect(registered.footprint).toMatchObject({widthM:6,depthM:5});
 for(const [role,source] of Object.entries(registered.sources)){
  const sourcePath=source.source.startsWith('/')?resolve(process.cwd(),'public',source.source.slice(1)):resolve(process.cwd(),'..',source.source);
  expect(createHash('sha256').update(readFileSync(sourcePath)).digest('hex'),`tomb-entry ${role} source hash`).toBe(source.sourceSha256);
 }
 await page.locator('.territory-calibration > summary').click();await page.getByLabel('Hình minh họa',{exact:true}).selectOption('tomb-entry');
 await page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await expect(page.locator('[data-art-qa-footprint]')).toHaveCount(1);await expect(page.locator('[data-art-qa-footprint]')).toHaveAttribute('points',/^[-\d., ]{8,}$/);
 const alphas=async()=>{await renderHostIntoView(page);return page.evaluate(()=>(window as unknown as {__mapMetrics:{qaArtLayers:{base:number|null;upper:number|null;body:number|null}|null}[]}).__mapMetrics.at(-1)?.qaArtLayers);};
 for(const [mode,expected] of [['normal',{base:1,upper:1,body:null}],['planning',{base:1,upper:null,body:null}],['focus',{base:1,upper:.22,body:null}]] as const){
  if(mode==='planning')await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();
  if(mode==='focus')await page.getByRole('button',{name:'Làm mờ phần che',exact:true}).click();
  await expect.poll(alphas,{timeout:30000}).toEqual(expected);
  for(const role of mode==='planning'?['base']:['base','upper'])await expect.poll(()=>Array.from(requested).some(path=>new RegExp(`/assets/map/buildings/tomb-entry/${role}-north-(close|district)\\.png$`).test(path)),{timeout:30000}).toBe(true);
  if(mode==='planning')await expect(page.locator('[data-art-qa-footprint]')).toHaveCount(1);
  if(mode==='planning')await page.getByRole('button',{name:'Bình thường',exact:true}).click();
 }
 await expect(page.locator('.territory-instance-main')).toHaveText(before);
});

test('all tomb map PNG and atlas failures use the registered versioned idle SVG fallback',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 if(test.info().project.name==='chromium')await page.setViewportSize({width:1366,height:768});
 const requested=new Set<string>(),requestedUrls=new Set<string>();page.on('request',request=>{requested.add(new URL(request.url()).pathname);requestedUrls.add(request.url());});
 await page.route('**/assets/map/buildings/tomb-entry/*.png*',route=>route.fulfill({status:404,body:'exercise tomb map raster fallback'}));
 await territory(page);
 const registered=await page.evaluate(async()=>{
  const manifest=await fetch('/assets/manifest.json').then(response=>response.json()),asset=manifest.assets.find((item:{assetId:string})=>item.assetId==='tomb-entry');
  const fallback=asset?.mapLayers?.body,entry=asset?.mapExports.find((item:{path:string;source:string})=>item.path===fallback||item.source===fallback);
  return {fallback,source:asset?.layers?.body,sourceSha256:entry?.sourceSha256};
 });
 expect(registered.fallback).toMatch(/^\/assets\/map\/buildings\/tomb-entry\/.*\.svg$/);
 expect(registered.fallback).not.toBe(registered.source);
 expect(registered.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
 await page.locator('.territory-calibration > summary').click();await page.getByLabel('Hình minh họa',{exact:true}).selectOption('tomb-entry');
 await page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true}).click();
 await renderHostIntoView(page);
 await expect.poll(()=>requested.has(registered.fallback),{timeout:30000}).toBe(true);
 expect(Array.from(requested).some(path=>path.includes('/tomb-entry/atlas-'))).toBe(true);
 expect(Array.from(requestedUrls).some(url=>url.includes(registered.fallback+'?mapHash='+registered.sourceSha256))).toBe(true);
 await renderHostIntoView(page);
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{qaArtLayers:{base:number|null;upper:number|null;body:number|null}|null;queued:number;pendingTextures:number}[]}).__mapMetrics.at(-1)),{timeout:30000}).toMatchObject({qaArtLayers:{base:null,upper:null,body:1},queued:0,pendingTextures:0});
 await expect(page.locator('.map-render-canvas')).toHaveCount(1);
 if(test.info().project.name==='chromium'){
  const directory=resolve(process.cwd(),'map-evidence/after/1366/architecture/tomb-entry');mkdirSync(directory,{recursive:true});
  const renderer=page.locator('.territory-stage [data-map-renderer]');
  await renderHostIntoView(page);await expect(renderer).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{queued:number;pendingTextures:number}[]}).__mapMetrics.at(-1)),{timeout:30000}).toMatchObject({queued:0,pendingTextures:0});
  const scenePng=await renderer.screenshot(),scene=await sharp(scenePng).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const backdropIndex=(Math.floor(scene.info.height*.15)*scene.info.width+Math.floor(scene.info.width*.284))*scene.info.channels;
  const backdropPixel=Array.from(scene.data.slice(backdropIndex,backdropIndex+3));
  expect(backdropPixel.some(channel=>channel>8),`filtered SVG transparent corner must show terrain, got RGB ${backdropPixel.join(',')}`).toBe(true);
  await page.screenshot({path:resolve(directory,'tomb-entry-png-failure-fallback-1366.png'),animations:'disabled'});
  await renderer.screenshot({path:resolve(directory,'tomb-entry-png-failure-fallback-scene-1366.png'),animations:'disabled'});
 }
});
