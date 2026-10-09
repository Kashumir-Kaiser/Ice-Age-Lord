import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
async function visitMap(page:Page){
  await page.goto('/');
  const menu=page.getByRole('button',{name:'Mở điều hướng'});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('button',{name:/Bản đồ/}).click();
}
test('local heat-fit at maximum level never jumps into world view',async({page})=>{
  await visitMap(page);
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await page.getByRole('button',{name:'Xem toàn bộ vòng nhiệt'}).click();
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
  await expect(page.getByText('25 km')).toBeVisible();
  await expect(page.getByRole('button',{name:'Chuyển sang bản đồ thế giới'}).first()).toBeVisible();
  const height=Number((await page.locator('svg.terrain-svg--deep').getAttribute('viewBox'))?.split(' ')[3]);
  expect(height).toBeGreaterThan(60000);expect(height).toBeLessThan(70000);
});
test('natural harvesting points appear around open battlefield without debug mode',async({page})=>{
  await visitMap(page);
  await expect(page.locator('.map-site--deep')).toHaveCount(4);
  await expect.poll(()=>page.locator('.map-resource-marker').count()).toBeGreaterThan(0);
  await expect(page.locator('mask[id$="-fog-mask"]')).toHaveCount(1);
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
});
test('source chest caches and outer structures light up at level 30',async({page})=>{
  await visitMap(page);
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await page.getByRole('button',{name:'Xem toàn bộ vòng nhiệt'}).click();
  await expect.poll(()=>page.locator('.map-resource-marker[data-kind="chest"]').count()).toBeGreaterThan(0);
  await expect.poll(()=>page.locator('.map-resource-marker[data-kind="site"]').count()).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'Kiểm tra Rừng Thông Tro Băng'})).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Kiểm tra Mỏ Đá Vân Xám'})).toHaveCount(1);
});
test('night sight shrinks but powerful fire still illuminates its actual radius',async({page})=>{
  await visitMap(page);
  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
  await expect(page.getByText(/19:00 · Ban đêm/)).toBeVisible();
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await expect(page.locator('svg.terrain-svg--deep circle[r="25000"]').first()).toBeVisible();
  await expect(page.locator('mask[id$="-known-mask"]')).toHaveCount(1);
});
test('world map mode is explicit and reversible',async({page})=>{
  await visitMap(page);
  await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới'}).first().click();
  await expect(page.getByText('Bản đồ thế giới · LL01')).toBeVisible();
  await expect(page.getByText(/bán kính 96 km/)).toBeVisible();
  await page.getByRole('button',{name:'Chuyển sang bản đồ địa phương'}).first().click();
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
});
test('wheel on SVG zooms without scrolling the page',async({page})=>{
  await visitMap(page);
  const svg=page.locator('svg.terrain-svg--deep');
  const before=await svg.getAttribute('viewBox');
  const rect=await svg.boundingBox();expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x+rect!.width/2,rect!.y+rect!.height/2);
  const scrollBefore=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,-230);
  await expect.poll(()=>svg.getAttribute('viewBox')).not.toBe(before);
  expect(await page.evaluate(()=>scrollY)).toBe(scrollBefore);
});
test('a distant intentional scroll-out transitions to world map',async({page})=>{
  await visitMap(page);
  const rect=await page.locator('svg.terrain-svg--deep').boundingBox();expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x+rect!.width/2,rect!.y+rect!.height/2);
  for(let i=0;i<34;i++)await page.mouse.wheel(0,170);
  await expect(page.getByText('Bản đồ thế giới · LL01')).toBeVisible();
});
test('panning changes camera but does not change knowledge or camp position',async({page})=>{
  await visitMap(page);
  const map=page.locator('svg.terrain-svg--deep');
  const before=await map.getAttribute('viewBox');
  const box=await map.boundingBox();expect(box).not.toBeNull();
  const x=box!.x+box!.width*.5,y=box!.y+box!.height*.55;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+110,y+80,{steps:8});await page.mouse.up();
  await expect.poll(()=>map.getAttribute('viewBox')).not.toBe(before);
  await page.getByRole('button',{name:'Trở về tâm lãnh địa'}).click();
  await expect.poll(()=>map.getAttribute('viewBox')).toBe(before);
});
test('resource inspector shows origin and approximate starting reserve',async({page})=>{
  await visitMap(page);
  await page.getByRole('button',{name:'Kiểm tra Mảnh gỗ đen'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('18');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('DỰNG THÊM');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('Không cộng vật phẩm');
});
test('frozen, 1x, 2x, 5x and custom controls advance only display clock',async({page})=>{
  await page.goto('/');
  const clock=page.locator('.clock-chip');
  await expect(clock).toContainText('07:00:00');
  const speed=page.getByLabel('Tốc độ thời gian');
  await expect(speed).toHaveValue('Frozen');
  for(const value of ['1x','2x','5x','Custom']){
    await speed.selectOption(value);await expect(speed).toHaveValue(value);
  }
  await page.getByLabel('Hệ số tốc độ tùy chọn').fill('120');
  const before=await clock.textContent();
  await expect.poll(()=>clock.textContent(),{timeout:4000}).not.toBe(before);
  await speed.selectOption('Frozen');
  await expect(speed).toHaveValue('Frozen');
  await expect(page.getByText('Không chạy engine')).toBeVisible();
});
test('no user-visible T0 labels remain',async({page})=>{
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText(/\bT0\b/);
  await visitMap(page);
  await expect(page.locator('body')).not.toContainText(/\bT0\b/);
});
test('mobile menu, map controls and title do not overflow',async({page,isMobile})=>{
  test.skip(!isMobile,'mobile-only');
  await page.goto('/');
  await page.getByRole('button',{name:'Mở điều hướng'}).click();
  const brand=page.locator('.brand-row'),label=page.locator('.brand-row .brand-copy strong');
  const frame=await brand.boundingBox(),text=await label.boundingBox();
  expect(frame).not.toBeNull();expect(text).not.toBeNull();
  expect(text!.x+text!.width).toBeLessThanOrEqual(frame!.x+frame!.width+1);
  await page.getByRole('button',{name:/Bản đồ/}).first().click();
  await expect(page.locator('svg.terrain-svg--deep')).toBeVisible();
});
test('snapshot QA: navigation brand and mapped forest edge',async({page},testInfo:TestInfo)=>{
  test.skip(testInfo.project.name!=='chromium','desktop snapshot only');
  await page.goto('/');
  await page.setViewportSize({width:1280,height:900});
  const brand=page.locator('.brand-row'),copy=page.locator('.brand-copy strong');
  const a=await brand.boundingBox(),b=await copy.boundingBox();
  expect(a).not.toBeNull();expect(b).not.toBeNull();
  expect(b!.x+b!.width).toBeLessThanOrEqual(a!.x+a!.width+1);
  const sidebar=await page.locator('.sidebar').screenshot({type:'jpeg',quality:67});
  await testInfo.attach('sidebar-brand-1280.jpg',{body:sidebar,contentType:'image/jpeg'});
  await visitMap(page);
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await page.getByRole('button',{name:'Xem toàn bộ vòng nhiệt'}).click();
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
  const mapshot=await page.locator('.map-experience').screenshot({type:'jpeg',quality:55});
  await testInfo.attach('map-heat-forest-1280.jpg',{body:mapshot,contentType:'image/jpeg'});
  await page.getByRole('button',{name:'Trở về tâm lãnh địa'}).click();
  for(let n=0;n<4;n++)await page.getByRole('button',{name:'Thu nhỏ'}).click();
  const edge=await page.locator('.map-experience').screenshot({type:'jpeg',quality:57});
  await testInfo.attach('map-battlefield-forest-edge-1280.jpg',{body:edge,contentType:'image/jpeg'});
  // Chunked JPEG in CI logs permits independent visual review without external hosting.
  for(const [name,bytes] of [['sidebar',sidebar],['map',mapshot],['edge',edge]] as const){
    const encoded=bytes.toString('base64');
    for(let at=0;at<encoded.length;at+=1800){
      console.log('VISUAL_SNAPSHOT '+name+' '+(at/1800)+' '+encoded.slice(at,at+1800));
    }
  }
});
