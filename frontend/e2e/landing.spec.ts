import { expect, test } from '@playwright/test';
import { playerView } from './viewFixture.ts';

const existingSave = {
  saveId: 'save-live-01',
  slotName: 'Lãnh địa cổ',
  revision: 1,
  lastEventSequence: 1,
  worldPackageId: 'WORLD-PACKAGE-LL01-1.0',
  contentVersion: 'test',
  rulesetVersion: 'test',
  createdAtUtc: '2026-10-15T00:00:00.000Z',
  updatedAtUtc: '2026-10-15T00:00:00.000Z',
  forkedFrom: null,
};

test('main menu is the default entry, is keyboard accessible, and fits mobile', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ICE AGE LORD/i })).toBeVisible();
  await expect(page.getByTestId('menu-new-game')).toBeVisible();
  await expect(page.getByTestId('menu-load-save')).toBeVisible();
  await expect(page.getByTestId('menu-demo')).toBeVisible();
  await expect(page.locator('.frozen-menu__scene')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('landing-menu.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByTestId('menu-new-game').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/mode=live&intent=new/);
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await page.getByRole('button', { name: /Menu chính/ }).click();
  await expect(page.getByTestId('menu-load-save')).toBeVisible();
});

test('New Game asks for a clean slot and never auto-resumes the remembered save', async ({ page }) => {
  let creations = 0;
  let selections = 0;
  await page.addInitScript(() => localStorage.setItem('ice-age-lord.live.last-save', 'save-live-01'));
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/health')) return route.fulfill({ json: { status: 'ready', apiVersion: 1, contentVersion: 'test', storage: 'sqlite' } });
    if (path.endsWith('/sessions')) return route.fulfill({ json: { accessToken: 'test-owner-token', expiresAtUtc: '2026-10-15T15:00:00Z', tokenType: 'Bearer' } });
    if (path.endsWith('/saves') && route.request().method() === 'GET') return route.fulfill({ json: { saves: [existingSave] } });
    if (path.endsWith('/saves') && route.request().method() === 'POST') { creations += 1; return route.fulfill({ status: 500, json: { error: { code: 'UNEXPECTED', message: 'not expected', displayText: 'not expected' } } }); }
    if (path.endsWith('/session')) { selections += 1; return route.fulfill({ status: 500, json: { error: { code: 'UNEXPECTED', message: 'not expected', displayText: 'not expected' } } }); }
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'missing', displayText: 'missing' } } });
  });

  await page.goto('/');
  await page.getByTestId('menu-new-game').click();
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill('test-key');
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Trò chơi mới' })).toBeVisible();
  await expect(page.getByLabel('Tên lượt lưu mới')).toBeVisible();
  await expect(page.getByText('Lượt lưu có sẵn')).toHaveCount(0);
  expect(creations).toBe(0);
  expect(selections).toBe(0);
  await page.getByRole('group', { name: 'Tạo mới hoặc tải lượt lưu' }).getByRole('button', { name: 'Tải lượt lưu' }).click();
  await expect(page.getByText('Lãnh địa cổ')).toBeVisible();
  expect(selections).toBe(0);
});

test('Load Save lists server slots and opens only the explicitly selected one', async ({ page }) => {
  let creations = 0;
  let selections = 0;
  await page.addInitScript(() => localStorage.setItem('ice-age-lord.live.last-save', 'save-live-01'));
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/health')) return route.fulfill({ json: { status: 'ready', apiVersion: 1, contentVersion: 'test', storage: 'sqlite' } });
    if (path.endsWith('/sessions')) return route.fulfill({ json: { accessToken: 'test-owner-token', expiresAtUtc: '2026-10-15T15:00:00Z', tokenType: 'Bearer' } });
    if (path.endsWith('/saves') && route.request().method() === 'GET') return route.fulfill({ json: { saves: [existingSave] } });
    if (path.endsWith('/saves') && route.request().method() === 'POST') { creations += 1; return route.fulfill({ status: 409, json: {} }); }
    if (path.endsWith('/session') && route.request().method() === 'POST') {
      selections += 1;
      return route.fulfill({ json: { saveId: existingSave.saveId, revision: 1, lastEventSequence: 1, sessionExpiresAtUtc: '2026-10-15T15:00:00Z', clockDriver: { driver: 'active', catchingUp: false, targetSimElapsedMs: 0, leaseRemainingMs: 5000, sessionTokenIsDriver: true } } });
    }
    if (path.endsWith('/view')) return route.fulfill({ json: { view: playerView() } });
    if (path.endsWith('/events')) return route.fulfill({ json: { events: [], afterSequence: 0, nextSequence: 1, hasMore: false } });
    if (path.endsWith('/heartbeat')) return route.fulfill({ json: { driver: 'active', catchingUp: false, targetSimElapsedMs: 0, leaseRemainingMs: 5000, sessionTokenIsDriver: true } });
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'missing', displayText: 'missing' } } });
  });
  await page.goto('/');
  await page.getByTestId('menu-load-save').click();
  await page.getByLabel('Khóa chủ sở hữu').fill('test-key');
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Tải lượt lưu' })).toBeVisible();
  await expect(page.getByText('Lãnh địa cổ')).toBeVisible();
  expect(creations).toBe(0);
  expect(selections).toBe(0);
  await page.getByRole('button', { name: /Lãnh địa cổ/ }).click();
  await expect(page.locator('.live-footer')).toContainText('save-live-01');
  expect(selections).toBe(1);
  expect(creations).toBe(0);
});

test('Demo stays read-only, never contacts the live API, and returns to the menu', async ({ page }) => {
  let apiCalls = 0;
  await page.route('**/api/v1/**', async route => {
    apiCalls += 1;
    await route.abort();
  });
  await page.goto('/');
  await page.getByTestId('menu-demo').click();
  await expect(page).toHaveURL(/mode=demo/);
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.getByRole('button', { name: /Menu chính/ })).toBeVisible();
  expect(apiCalls).toBe(0);
  await page.getByRole('button', { name: /Menu chính/ }).click();
  await expect(page.getByTestId('menu-new-game')).toBeVisible();
  expect(apiCalls).toBe(0);
});

test('explicit disabled demo route does not fall back to the real API', async ({ page }) => {
  // The actual off switch is a compile-time production flag; this URL test
  // guards only the development route. Production must be built separately
  // without VITE_ENABLE_DEMO=true and smoke-tested against ?mode=demo.
  await page.goto('/?mode=live&intent=load');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText(/Chế độ demo/)).toHaveCount(0);
});
