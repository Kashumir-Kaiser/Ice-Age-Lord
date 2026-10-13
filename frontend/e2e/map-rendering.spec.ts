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
