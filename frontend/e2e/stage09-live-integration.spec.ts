import { expect, test } from '@playwright/test';

const screens = ['Tổng quan', 'Nhân vật', 'Lãnh địa', 'Bản đồ', 'Kho vật phẩm', 'Quân lực', 'Công trình', 'Sự kiện', 'Nhật ký'];

async function connectAndCreate(page: import('@playwright/test').Page, slotName: string) {
  // A fresh state initializes 1023 AI lords and projects the server-owned world.
  // Wait for the committed view rather than assuming a 5s desktop warm start.
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
  await expect(page.getByTestId('live-overview-parity').getByText('Ngày 1 · 07:00', { exact: true })).toBeVisible({ timeout: 35_000 });
}

test('all nine live screens remain on one server-owned save projection at release viewports', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
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
      if (screen === 'Tổng quan') {
        const overview = page.getByTestId('live-overview-parity');
        await expect(overview).toBeVisible();
        await expect(overview.locator('.hero-banner')).toBeVisible();
        await expect(overview.locator('.stats-grid .stat-card')).toHaveCount(4);
        await expect(page.getByTestId('live-overview-map')).toBeVisible();
        await expect(overview.locator('.hero-art img')).toHaveAttribute('src', /li-lan-t0-portrait/);
        await expect(overview.getByRole('button', { name: 'Khám phá bản đồ' })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`stage09-overview-${viewport.width}x${viewport.height}.png`), fullPage: true });
      }
      if (screen === 'Nhân vật') {
        await expect(page.locator('.live-character-page .character-equipment-layout')).toBeVisible();
        await expect(page.locator('.live-character-page [data-equipment-slot]')).toHaveCount(9);
        const portrait = page.getByRole('img', { name: 'Toàn thân Lí Lan' });
        await expect(portrait).toBeVisible();
        await expect.poll(() => portrait.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      if (screen === 'Sự kiện') {
        await expect(page.locator('.shared-event-card')).toHaveCount(30);
        await expect(page.getByRole('heading', { name: 'Xếp hạng và quyết toán' })).toBeVisible();
      }
      if (screen === 'Bản đồ') {
        await expect(page.locator('.live-exploration-panel .live-map-canvas')).toBeVisible();
        await expect(page.getByTestId('search-for-chests')).toBeVisible();
        const mapArt = page.locator('[data-testid="map-campfire-marker"] .live-map-marker-art image');
        await expect(mapArt).toHaveAttribute('href', '/assets/buildings/survival-fire-l01/icon.svg');
        const assetLoaded = await page.evaluate(async path => (await fetch(path)).ok, '/assets/buildings/survival-fire-l01/icon.svg');
        expect(assetLoaded).toBe(true);
      }
      if (screen === 'Kho vật phẩm') {
        await expect(page.locator('.live-inventory-grid')).toBeVisible();
        const items = page.locator('.live-inventory-art-list > li');
        if (await items.count()) {
          await expect(items.first().locator('.live-item-art,.live-item-placeholder-art')).toBeVisible();
          await expect(items.first().locator('.live-item-details summary')).toBeVisible();
        }
      }
      if (screen === 'Quân lực') {
        await expect(page.locator('.live-forces-stats .stat-card')).toHaveCount(4);
        await expect(page.getByTestId('search-for-chests')).toBeVisible();
      }
      if (screen === 'Công trình') {
        await expect(page.locator('.live-building-gallery')).toBeVisible();
        await expect(page.locator('.live-building-gallery-card').first()).toBeVisible();
      }
      if (screen === 'Lãnh địa') {
        const fireSprite = page.locator('.territory-building[data-building-id="SITE-LL01-000"]');
        await expect(page.locator('.territory-scene-svg')).toBeVisible();
        await expect(fireSprite).toBeVisible();
        // Live territory uses authoritative save data: sandbox planning controls are demo-only.
        await expect(page.getByRole('button', { name: 'Mặt bằng' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Bình thường' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Làm mờ phần che' })).toBeVisible();
        await expect(page.locator('.territory-build-tray')).toHaveCount(0);
        await expect(fireSprite).toHaveAttribute('data-asset-id','survival-fire-l01');
        await expect(page.locator('.territory-stage .map-render-canvas')).toBeVisible();
        await expect(page.locator('.territory-stage [data-map-renderer]')).toHaveAttribute('data-map-renderer',/webgl|canvas2d/);
      }
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(horizontalOverflow, `unexpected horizontal page overflow at ${viewport.width}×${viewport.height} on ${screen}`).toBe(false);
    }
    await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
    await page.screenshot({ path: testInfo.outputPath(`stage09-opening-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }

  await page.setViewportSize(viewports[0]);
  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  const revisionBeforeCameraInput = await page.locator('.live-footer span').nth(1).innerText();
  await page.getByRole('button', { name: 'Show map overview' }).click();
  await expect(page.locator('.live-footer span').nth(1)).toHaveText(revisionBeforeCameraInput);
  const map = page.getByTestId('live-map');
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  const beforeCenter = await page.locator('.live-map-tools .live-data-chip').last().innerText();
  await page.mouse.move(box!.x + box!.width * .38, box!.y + box!.height * .40);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .64, box!.y + box!.height * .53, { steps: 8 });
  await page.mouse.up();
  const afterCenter = await page.locator('.live-map-tools .live-data-chip').last().innerText();
  expect(afterCenter).not.toBe(beforeCenter);
  await expect(page.locator('.live-footer span').nth(1)).toHaveText(revisionBeforeCameraInput);
});

test('map expedition preview and area search commit through the selected save API', async ({ page }) => {
  test.setTimeout(120_000);
  await connectAndCreate(page, 'Stage 09 area expedition ' + crypto.randomUUID());
  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  await page.getByRole('button', { name: 'Pick center on map' }).click();
  const map = page.locator('[data-testid="live-map"]');
  const bounds = await map.boundingBox();
  expect(bounds).toBeTruthy();
  await map.click({ position: { x: bounds!.width / 2, y: bounds!.height / 2 } });
  await expect(page.getByText(/· custom$/)).toBeVisible();
  await page.getByLabel('Stop after targets').fill('1');
  await page.getByLabel('Work time limit').selectOption('15');
  await page.getByRole('button', { name: 'Preview expedition' }).click();
  const estimate = page.locator('.live-preview-success');
  await expect(estimate).toContainText('outbound');
  await expect(estimate).toContainText('estimated return');
  await expect(estimate).toContainText('total');
  await expect(estimate).toContainText('then returns');
  await page.getByTestId('search-for-chests').click();
  await expect(page.locator('.live-map-search-path')).toHaveCount(1);
  await expect(page.locator('.live-footer')).toContainText(/revision [2-9]\d*/);
});

test('switching saves clears selection and ignores a delayed response from the prior save', async ({ page }) => {
  test.setTimeout(150_000);
  const saveAName = 'Stage 09 A ' + crypto.randomUUID();
  const saveBName = 'Stage 09 B ' + crypto.randomUUID();
  await connectAndCreate(page, saveAName);
  await page.getByRole('button', { name: 'Kiểm tra thẻ nghề nghiệp' }).click();
  await expect(page.getByRole('heading', { name: 'Đã quan sát' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Đã quan sát' })).toBeVisible();
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
    // Explicitly trigger a view request; background polls are intentionally
    // throttled while paused and should not be relied upon by this test.
    await page.getByRole('button', { name: 'Tải lại từ API' }).click();
    await Promise.race([
      delayedView,
      page.waitForTimeout(12_000).then(() => { throw new Error('The explicit save refresh did not reach the delayed response gate.'); }),
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
