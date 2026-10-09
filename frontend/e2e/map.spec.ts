import { test, expect } from '@playwright/test';
async function visitMap(page:import('@playwright/test').Page){
  await page.goto('/');
  const menu=page.getByRole('button',{name:'Mở điều hướng'});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('button',{name:/Bản đồ/}).click();
}
test('initial map reveals only four source-locked opening sites',async({page})=>{
  await visitMap(page);
  await expect(page.locator('.map-resource-marker')).toHaveCount(0);
  await expect(page.locator('.map-site--deep')).toHaveCount(4);
  await expect(page.locator('mask[id$="-fog-mask"]')).toHaveCount(1);
});
test('firelight reveals far terrain at level 30 even after nightfall',async({page})=>{
  await visitMap(page);
  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
  await expect(page.getByText(/19:00 · Ban đêm/)).toBeVisible();
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await expect(page.getByText('25 km')).toBeVisible();
  const ring=page.locator('svg.terrain-svg--deep circle[r="25000"]');
  await expect(ring.first()).toHaveAttribute('r','25000');
  await expect(page.locator('mask[id$="-known-mask"]')).toHaveCount(1);
});
test('world map toggle and local return work with canonical active-map radius',async({page})=>{
  await visitMap(page);
  await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới'}).first().click();
  await expect(page.getByText('Bản đồ thế giới · LL01')).toBeVisible();
  await expect(page.getByText(/bán kính 96 km/)).toBeVisible();
  await page.getByRole('button',{name:'Chuyển sang bản đồ địa phương'}).first().click();
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
});
test('wheel on map zooms without scrolling the document',async({page})=>{
  await visitMap(page);
  const map=page.locator('svg.terrain-svg--deep');
  const before=await map.getAttribute('viewBox');
  const bounds=await map.boundingBox();expect(bounds).not.toBeNull();
  const docBefore=await page.evaluate(()=>scrollY);
  await page.mouse.move(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);
  await page.mouse.wheel(0,-250);
  await expect.poll(()=>map.getAttribute('viewBox')).not.toBe(before);
  const docAfter=await page.evaluate(()=>scrollY);
  expect(docAfter).toBe(docBefore);
});
test('pan and return to center do not reveal hidden markers',async({page})=>{
  await visitMap(page);
  const map=page.locator('svg.terrain-svg--deep');
  const before=await map.getAttribute('viewBox');
  const rect=await map.boundingBox();expect(rect).not.toBeNull();
  const x=rect!.x+rect!.width*.5,y=rect!.y+rect!.height*.52;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+110,y+80,{steps:8});await page.mouse.up();
  await expect.poll(()=>map.getAttribute('viewBox')).not.toBe(before);
  await expect(page.locator('.map-resource-marker')).toHaveCount(0);
  await page.getByRole('button',{name:'Trở về tâm lãnh địa'}).click();
  await expect.poll(()=>map.getAttribute('viewBox')).toBe(before);
});
test('canonical resource inspector is debug-only and shows source T0 capacity',async({page})=>{
  await visitMap(page);
  await page.getByRole('button',{name:/Xem atlas nguồn/}).click();
  await expect(page.locator('.map-resource-marker')).toHaveCount(0); // day-1 visibility isn't 5km
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await expect(page.getByRole('button',{name:'Kiểm tra Rừng Thông Tro Băng'})).toHaveCount(1);
  // Focus/click SVG element through keyboard even if outside the current viewport.
  await page.getByRole('button',{name:'Kiểm tra Rừng Thông Tro Băng'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('780');
  await page.getByRole('button',{name:/Ẩn atlas nguồn/}).click();
  await expect(page.locator('.map-resource-marker')).toHaveCount(0);
});
test('mobile sidebar navigation stays usable and scrolls independently',async({page,isMobile})=>{
  test.skip(!isMobile,'mobile-only');
  await page.goto('/');
  await page.getByRole('button',{name:'Mở điều hướng'}).click();
  const sidebar=page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
  await expect(page.locator('.sidebar-nav')).toHaveCSS('overflow-y','auto');
  await sidebar.getByRole('button',{name:/Bản đồ/}).click();
  await expect(page.locator('.map-scene--deep')).toBeVisible();
});
