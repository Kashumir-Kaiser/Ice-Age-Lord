import { expect, test } from '@playwright/test';

test('Chromium runs the server-owned clock, completes a Tomb job once, and recovers it after reload', async ({ page }) => {
  test.setTimeout(120_000);
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral Stage 04 owner key').toBeTruthy();

  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối trò chơi' })).toBeVisible();
  await expect(page.getByText('Trò chơi đã sẵn sàng')).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();

  const slotName = 'Chromium ' + crypto.randomUUID();
  await page.getByLabel('Tên lượt lưu mới').fill(slotName);
  const createResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/saves'
    && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Bắt đầu lượt chơi' }).click();
  const posted = await createResponse;
  if (!posted.ok()) {
    const error = await posted.json().catch(() => null);
    console.error('LIVE_SAVE_CREATE_HTTP_FAILURE', JSON.stringify({
      status: posted.status(), code: error?.error?.code ?? null, displayText: error?.error?.displayText ?? null,
    }));
  }
  try {
    await expect(page.getByText(/Clean game đã được tạo và commit/)).toBeVisible();
  } catch (error) {
    console.error('LIVE_SAVE_CREATE_VIEW_FAILURE', JSON.stringify({
      status: posted.status(), displayed: (await page.locator('.live-start-card, .live-content, .live-topbar').allInnerTexts()).map(t => t.slice(0, 2000)),
      feedback: await page.locator('[role="alert"], [role="status"]').allInnerTexts(),
      currentUrl: page.url(),
    }));
    throw error;
  }
  await expect(page.getByTestId('live-overview-parity').getByText('Ngày 1 · 07:00', { exact: true })).toBeVisible();

  await page.getByRole('navigation', { name: 'Màn hình game' })
    .getByRole('button', { name: /^Công trình(?: Trạng thái API)?$/ }).click();
  await page.getByRole('button', { name: 'Xếp một Cương Thi tiêu chuẩn' }).click();
  await expect(page.getByText(/Đang sản xuất · TOMB-UNIT-/)).toBeVisible();

  await page.getByLabel('Điều kiện tự dừng').selectOption('next_completion');
  await page.getByLabel('Tốc độ mô phỏng').selectOption('custom');
  await page.getByLabel('Tốc độ tùy chỉnh').fill('3600');
  await page.getByRole('button', { name: 'Áp dụng' }).click();

  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Quân lực/ }).click();
  const tombUnit = page.locator('.live-container-card').filter({
    has: page.getByRole('heading', { name: 'Cương Thi 1', exact: true }),
  });
  await expect(tombUnit).toHaveCount(1, { timeout: 15000 });
  await expect(tombUnit).toContainText('Được tạo từ Mộ');
  await expect(tombUnit).toContainText('Bậc 0 · Cấp 1 · Phẩm Thường · XP 0');
  await expect(tombUnit).toContainText('XP của đơn vị này không được chuyển cho Lí Lan.');
  await expect(page.getByText('Ngày 1 · 07:20')).toBeVisible();

  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Quân lực/ }).click();
  await expect(page.getByRole('heading', { name: 'Cương Thi 1', exact: true })).toHaveCount(1);
  await expect(page.locator('.live-container-card').filter({
    has: page.getByRole('heading', { name: 'Cương Thi 1', exact: true }),
  })).toContainText('Được tạo từ Mộ');
});
