import { expect, test } from '@playwright/test';

test('Chromium runs the server-owned clock, completes a Tomb job once, and recovers it after reload', async ({ page }) => {
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral Stage 04 owner key').toBeTruthy();

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
  await expect(page.getByText('Ngày 1 · 07:00')).toBeVisible();

  await page.getByRole('navigation', { name: 'Màn hình game' })
    .getByRole('button', { name: 'Công trình Trạng thái API' }).click();
  await page.getByRole('button', { name: 'Xếp một Cương Thi tiêu chuẩn' }).click();
  await expect(page.getByText(/Đang sản xuất · TOMB-UNIT-/)).toBeVisible();

  await page.getByLabel('Điều kiện tự dừng').selectOption('next_completion');
  await page.getByLabel('Tốc độ mô phỏng').selectOption('custom');
  await page.getByLabel('Tốc độ tùy chỉnh').fill('3600');
  await page.getByRole('button', { name: 'Áp dụng' }).click();

  await page.getByRole('button', { name: 'Quân lực' }).click();
  await expect(page.getByText(/TOMB_QUEUE · 1 WU\/h · XP 0 · không XP mirror/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Ngày 1 · 07:20')).toBeVisible();
  await expect(page.getByText(/Cương Thi 1 · Bậc 0 · Thường/)).toHaveCount(1);

  const completedJob = page.locator('.live-plain-list').filter({ hasText: /completed · TOMB-UNIT-/ });
  await expect(completedJob).toHaveCount(1);

  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await page.getByRole('button', { name: 'Quân lực' }).click();
  await expect(page.getByText(/Cương Thi 1 · Bậc 0 · Thường/)).toHaveCount(1);
  await expect(page.locator('.live-plain-list').filter({ hasText: /completed · TOMB-UNIT-/ })).toHaveCount(1);
});
