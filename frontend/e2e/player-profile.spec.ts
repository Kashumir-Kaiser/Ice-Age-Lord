import { test, expect } from '@playwright/test';
import { installLocalPreviewRoute } from './localPreviewRoute';

test.beforeEach(async ({ page }) => installLocalPreviewRoute(page));

async function openPlayerProfile(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Mở hồ sơ người chơi/ }).click();
  const dialog = page.getByRole('dialog', { name: /Hồ sơ Lí Lan/ });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('player profile opens from the header and shows the T0 character record', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.locator('.app-shell')).toBeVisible();
  const dialog = await openPlayerProfile(page);
  await expect(dialog).toContainText('Tử Phục Linh Sư · SSS');
  await expect(dialog).toContainText('236 / 236');
  await expect(dialog.getByRole('img', { name: 'Chân dung Lí Lan' })).toHaveAttribute('src', /li-lan-t0-portrait\.svg/);
  await dialog.getByRole('button', { name: 'Đóng hồ sơ' }).click();
  await expect(dialog).toHaveCount(0);
});

test('global map follows the player and dragging the player unlocks and pans', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.locator('.app-shell')).toBeVisible();
  const dialog = await openPlayerProfile(page);
  await dialog.getByRole('button', { name: /Định vị trên bản đồ thế giới/ }).click();

  const map = page.locator('svg.terrain-svg--deep');
  const marker = page.locator('.map-player-marker');
  await expect(page.locator('.map-corner-title strong')).toHaveText('Bản đồ thế giới');
  await expect(page.locator('.map-follow-status')).toBeVisible();
  await expect(marker).toHaveCount(1);
  await marker.click();
  await expect(page.getByRole('dialog', { name: /Hồ sơ Lí Lan/ })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng hồ sơ' }).click();
  const before = await map.getAttribute('viewBox');
  const bounds = await marker.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width / 2 + 42, bounds!.y + bounds!.height / 2 + 28, { steps: 4 });
  await page.mouse.up();

  await expect(page.locator('.map-follow-status')).toHaveCount(0);
  await expect(marker).toHaveCount(0);
  await expect.poll(() => map.getAttribute('viewBox')).not.toBe(before);
});

test('settlement map follows the player and dragging the player unlocks and pans', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.locator('.app-shell')).toBeVisible();
  const dialog = await openPlayerProfile(page);
  await dialog.getByRole('button', { name: /Định vị ở lãnh địa/ }).click();

  const scene = page.locator('svg.territory-scene-svg');
  const marker = page.locator('.territory-player-marker');
  const lock = page.locator('.territory-follow-button');
  await expect(scene).toBeVisible();
  await expect(lock).toBeVisible();
  await expect(marker).toHaveCount(1);
  // The scene viewBox is viewport-sized and remains constant as the camera pans.
  // Track the heat-boundary ellipse's projected position instead of old raster internals.
  const heatBoundary = scene.locator('.territory-camera-overlay > ellipse').first();
  const before = await heatBoundary.getAttribute('cx');
  const bounds = await marker.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width / 2 + 42, bounds!.y + bounds!.height / 2 + 28, { steps: 4 });
  await page.mouse.up();

  await expect(lock).toHaveCount(0);
  await expect(marker).toHaveCount(0);
  await expect.poll(() => heatBoundary.getAttribute('cx')).not.toBe(before);
});
