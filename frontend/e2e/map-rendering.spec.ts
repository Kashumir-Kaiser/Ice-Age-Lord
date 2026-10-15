import { test, expect } from '@playwright/test';
import { installLocalPreviewRoute } from './localPreviewRoute';

test.beforeEach(async({page})=>installLocalPreviewRoute(page));
async function territory(page:import('@playwright/test').Page,options=''){
 await page.goto('/?mode=demo&mapQA=1'+options);await expect(page.locator('.app-shell')).toBeVisible();
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await expect(page.locator('.territory-stage [data-map-renderer]')).toHaveAttribute('data-map-renderer',/webgl|canvas2d/);
 await expect(page.locator('.territory-stage .map-render-canvas')).toHaveCount(1);
}
test('real renderer opens normal gameplay with exact opening IDs, grid toggle and planning control',async({page})=>{
 await territory(page);await expect(page.locator('.territory-building:not(.is-draft)')).toHaveCount(4);
 await expect(page.locator('.territory-scene-svg line')).toHaveCount(0);
 await page.getByRole('button',{name:'Lưới',exact:true}).click();expect(await page.locator('.territory-scene-svg line').count()).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();await expect(page.locator('.territory-building image')).toHaveCount(0);
 await page.locator('.territory-scene-svg').focus();await page.keyboard.press('p');await expect(page.getByRole('button',{name:'Bình thường',exact:true})).toHaveAttribute('aria-pressed','true');
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
 await expect.poll(()=>page.evaluate(()=>{const metrics=(window as unknown as {__mapMetrics:{activeLoops:number;queued:number}[]}).__mapMetrics;return metrics?.at(-1)?.queued;}),{timeout:15000}).toBe(0);
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{activeLoops:number}[]}).__mapMetrics.at(-1)?.activeLoops)).toBe(0);
});
test('preserved painted flame animates only for visible active fire; reduced motion freezes it and planning removes it',async({page})=>{
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'no-preference'});await territory(page);
 await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 await page.getByRole('button',{name:'Phóng to lãnh địa'}).click();
 const backend=await page.locator('[data-map-renderer]').getAttribute('data-map-renderer');test.skip(backend!=='webgl','Canvas2D retains static fire indication with effects disabled.');
 const flames=()=>page.evaluate(()=>(window as unknown as {__mapMetrics:{flameFrame:number|null;flameSprites:number}[]}).__mapMetrics.at(-1)!);
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
 await scene.click({position:{x:box.width*.55,y:box.height*.65}});await scene.focus();await page.keyboard.press('Escape');
 for(const role of ['base','upper'])await expect.poll(()=>Array.from(requested).some(p=>new RegExp(`/fixture-tall-tower/${role}-(close|district)\\.png$`).test(p)),{timeout:20000}).toBe(true);
 const draft=page.locator('.territory-building.is-draft[data-asset-id="fixture-tall-tower"]');await expect(draft).toHaveCount(1);
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
 await expect.poll(()=>Array.from(requested).some(path=>path.includes('/map/buildings/lord-house-l30/')),{timeout:30000}).toBe(true);
 await expect(list).toHaveText(before);
 await page.getByRole('button',{name:'Ẩn hình kiểm tra trên bản đồ',exact:true}).click();
 await expect(page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true})).toBeVisible();
 await expect(list).toHaveText(before);
 await page.goto('/?mode=demo');
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:'Lãnh địa',exact:true}).click();
 await page.locator('.territory-calibration > summary').click();
 await expect(page.getByRole('button',{name:'Xem hình kiểm tra trên bản đồ',exact:true})).toHaveCount(0);
});
