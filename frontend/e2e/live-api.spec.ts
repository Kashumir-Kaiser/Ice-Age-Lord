import { expect, test } from '@playwright/test';

test('Chromium creates a clean save, inspects a starter container, and recovers it after reload', async ({ page }) => {
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral Stage 03 owner key').toBeTruthy();

  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText('API sẵn sàng · SQLite · phiên cục bộ')).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();

  const slotName = 'Chromium ' + crypto.randomUUID();
  await page.getByLabel('Tên lượt lưu mới').fill(slotName);
  await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click();
  await expect(page.getByText(/Clean game đã được tạo và commit/)).toBeVisible();

  await page.getByRole('button', { name: 'Lãnh địa' }).click();
  const territoryFire = page.getByTestId('territory-campfire-structure');
  await expect(territoryFire).toHaveAttribute('data-entity-ref', 'site:SITE-LL01-000');
  await expect(territoryFire.locator('img').first()).toBeVisible();

  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  const mapFire = page.getByTestId('map-campfire-marker');
  await expect(mapFire).toHaveAttribute('data-entity-ref', 'site:SITE-LL01-000');

  await page.getByRole('button', { name: 'Kho vật phẩm' }).click();
  const inspectButton = page.getByRole('button', { name: 'Kiểm tra' });
  await expect(inspectButton).toBeVisible();
  await inspectButton.click();
  await expect(page.getByRole('heading', { name: 'Bịch đồ ăn' })).toBeVisible();

  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await page.getByRole('button', { name: 'Kho vật phẩm' }).click();
  await expect(page.getByRole('heading', { name: 'Bịch đồ ăn' })).toBeVisible();
  await expect(page.getByText('chưa quan sát')).toHaveCount(0);
});
