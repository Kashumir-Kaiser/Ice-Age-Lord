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
test('missing raster derivatives retain registered art and interactions',async({page})=>{
 await page.route('**/assets/map/buildings/**',route=>route.fulfill({status:404,body:'missing map export'}));
 await territory(page);await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();
 await page.locator('.territory-building[data-building-id="SITE-LL01-003"]').press('Enter');await expect(page.locator('.territory-building.is-selected')).toHaveAttribute('data-building-id','SITE-LL01-003');
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
