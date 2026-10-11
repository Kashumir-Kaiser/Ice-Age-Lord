import { expect, test } from '@playwright/test';

const screens = ['Tổng quan', 'Lãnh địa', 'Bản đồ', 'Kho vật phẩm', 'Quân lực', 'Công trình', 'Nhật ký'];

async function connectAndCreate(page: import('@playwright/test').Page, slotName: string) {
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral Stage 09 owner key').toBeTruthy();
  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText('API sẵn sàng · SQLite · phiên cục bộ')).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();
  await page.getByLabel('Tên lượt lưu mới').fill(slotName);
  await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click();
  await expect(page.getByText('Ngày 1 · 07:00')).toBeVisible();
}

test('all seven live screens remain on one server-owned save projection at release viewports', async ({ page }, testInfo) => {
  await connectAndCreate(page, 'Stage 09 screens ' + crypto.randomUUID());
  const initialFooter = await page.locator('.live-footer').innerText();
  const initialRevision = initialFooter.match(/revision (\d+)/)?.[1];
  expect(initialRevision).toBeTruthy();

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const screen of screens) {
      await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: new RegExp(`^${screen}`) }).click();
      await expect(page.getByRole('heading', { level: 1, name: screen })).toBeVisible();
      await expect(page.locator('.live-footer')).toContainText(`revision ${initialRevision}`);
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(horizontalOverflow, `unexpected horizontal page overflow at ${viewport.width}×${viewport.height} on ${screen}`).toBe(false);
    }
    await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
    await page.screenshot({ path: testInfo.outputPath(`stage09-opening-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }

  await page.setViewportSize(viewports[0]);
  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  const revisionBeforeCameraInput = await page.locator('.live-footer').innerText();
  await page.getByRole('button', { name: 'Show map overview' }).click();
  await expect(page.locator('.live-footer')).toHaveText(revisionBeforeCameraInput);
});

test('switching saves clears selection and ignores a delayed response from the prior save', async ({ page }) => {
  const saveAName = 'Stage 09 A ' + crypto.randomUUID();
  const saveBName = 'Stage 09 B ' + crypto.randomUUID();
  await connectAndCreate(page, saveAName);
  await page.getByRole('button', { name: 'Kiểm tra thẻ nghề nghiệp' }).click();
  await expect(page.getByText('Đã quan sát', { exact: true })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Màn hình game' });
  await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
  const woodMarker = page.locator('[data-entity-ref="resource:RES-LL01-06"]');
  await expect(woodMarker).toBeVisible();
  await woodMarker.click();
  await expect(woodMarker).toHaveClass(/is-selected/);
  const saveAId = (await page.locator('.live-footer').innerText()).match(/Save ([0-9a-f-]+)/)?.[1];
  expect(saveAId).toBeTruthy();

  await page.getByRole('button', { name: 'Đổi lượt lưu' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();
  await page.getByLabel('Tên lượt lưu mới').fill(saveBName);
  await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click();
  await expect(page.getByText('Đang niêm phong', { exact: true })).toBeVisible();
  const saveBId = (await page.locator('.live-footer').innerText()).match(/Save ([0-9a-f-]+)/)?.[1];
  expect(saveBId).toBeTruthy();
  expect(saveBId).not.toBe(saveAId);
  await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
  await expect(page.getByTestId('map-campfire-marker')).toHaveClass(/is-selected/);
  await expect(page.locator('[data-entity-ref="resource:RES-LL01-06"]')).not.toHaveClass(/is-selected/);

  await page.getByRole('button', { name: 'Đổi lượt lưu' }).click();
  await page.getByRole('button', { name: new RegExp(saveAName) }).click();
  await expect(page.locator('.live-footer')).toContainText(`Save ${saveAId}`);
  await expect(page.getByText('Đã quan sát', { exact: true })).toBeVisible();
  await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
  await expect(page.getByTestId('map-campfire-marker')).toHaveClass(/is-selected/);
  await woodMarker.click();
  await expect(woodMarker).toHaveClass(/is-selected/);

  let releaseDelayedView: (() => void) | undefined;
  let reportDelayedView: (() => void) | undefined;
  let armed = true;
  const delayedView = new Promise<void>(resolve => { reportDelayedView = resolve; });
  await page.route(`**/api/v1/saves/${saveAId}/view`, async route => {
    if (armed) {
      armed = false;
      reportDelayedView?.();
      await new Promise<void>(resolve => { releaseDelayedView = resolve; });
    }
    await route.continue();
  });
  try {
    await Promise.race([
      delayedView,
      page.waitForTimeout(2_500).then(() => { throw new Error('The active save poll did not reach the delayed response gate.'); }),
    ]);
    await page.getByRole('button', { name: 'Đổi lượt lưu' }).click();
    await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(saveBName) }).click();
    await expect(page.locator('.live-footer')).toContainText(`Save ${saveBId} · revision 1`);
    releaseDelayedView?.();
    await expect(page.getByText('Đang niêm phong', { exact: true })).toBeVisible();
    await expect(page.locator('.live-footer')).toContainText(`Save ${saveBId} · revision 1`);
    await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
    await expect(page.getByTestId('map-campfire-marker')).toHaveClass(/is-selected/);
    await expect(page.locator('[data-entity-ref="resource:RES-LL01-06"]')).not.toHaveClass(/is-selected/);
  } finally {
    releaseDelayedView?.();
    await page.unroute(`**/api/v1/saves/${saveAId}/view`);
  }
});
