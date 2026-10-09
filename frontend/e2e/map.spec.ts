import { test, expect } from '@playwright/test';

async function visitMap(page: import('@playwright/test').Page) {
  await page.goto('/');
  const menu=page.getByRole('button',{name:'Mở điều hướng'});
  if(await menu.isVisible()) await menu.click();
  await page.getByRole('button',{name:/Bản đồ/}).click();
}

test('always-on fog hides unobserved resources and survey reveals only sample markers', async ({page})=>{
  await visitMap(page);
  await expect(page.locator('.map-scene--deep')).toBeVisible();
  await expect(page.locator('.map-resource-marker')).toHaveCount(0);
  await expect(page.locator('mask[id$="-fog-mask"]')).toHaveCount(1);
  await page.getByRole('button',{name:/Xem khảo sát mẫu/}).click();
  await expect(page.locator('.map-resource-marker')).toHaveCount(6);
  await expect(page.getByText(/Số lượng tài nguyên chỉ là dữ liệu mẫu/)).toBeVisible();
  await page.getByRole('button',{name:/Ẩn điểm mẫu/}).click();
  await expect(page.locator('.map-resource-marker')).toHaveCount(0);
});
test('time and preview level change lighting and exact heat radius without a game action',async ({page})=>{
  await visitMap(page);
  await expect(page.getByText('10 m')).toBeVisible();
  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
  await expect(page.getByText(/19:00 · Ban đêm/)).toBeVisible();
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('6');
  await expect(page.getByText('200 m')).toBeVisible();
  await expect(page.getByText(/Đại Lửa Trại Cấp 6/)).toBeVisible();
  await expect(page.getByText(/Xem trước/)).toBeVisible();
});
test('map allows drag-pan away from camp and returning to camp',async ({page})=>{
  await visitMap(page);
  const canvas=page.locator('svg.terrain-svg--deep');
  const before=await canvas.getAttribute('viewBox');
  const bounds=await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const x=bounds!.x+bounds!.width*.53;
  const y=bounds!.y+bounds!.height*.59;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+130,y+85,{steps:9});
  await page.mouse.up();
  await expect.poll(()=>canvas.getAttribute('viewBox')).not.toBe(before);
  await page.getByRole('button',{name:'Trở về tâm lãnh địa'}).click();
  await expect.poll(()=>canvas.getAttribute('viewBox')).toBe(before);
});
test('sampling a harvesting spot reveals remaining quantity without changing ownership',async ({page})=>{
  await visitMap(page);
  await page.getByRole('button',{name:/Xem khảo sát mẫu/}).click();
  await page.getByRole('button',{name:'Kiểm tra Lâm địa phủ tuyết'}).click();
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('480');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('620');
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toContainText('không thêm vật phẩm vào kho');
  await page.getByRole('button',{name:/Ẩn điểm mẫu/}).click();
  await expect(page.getByRole('region',{name:'Thông tin điểm được chọn'})).toHaveCount(0);
});
test('mobile displays navigation and a working map',async ({page,isMobile})=>{
  test.skip(!isMobile,'mobile-only test');
  await page.goto('/');
  await page.getByRole('button',{name:'Mở điều hướng'}).click();
  const drawer=page.locator('.sidebar--open');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button',{name:/Bản đồ/}).click();
  await expect(page.locator('.map-scene--deep')).toBeVisible();
  await expect(page.getByLabel('Mô phỏng giờ hiển thị')).toBeVisible();
});
