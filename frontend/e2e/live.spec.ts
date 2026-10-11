import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireRef, playerView } from './viewFixture.ts';

async function tapVisualCenter(page: Page, locator: Locator, mobile: boolean) {
  if (!mobile) {
    await locator.click();
    return;
  }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const geometry = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const viewport = window.visualViewport;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        offsetLeft: viewport?.offsetLeft ?? 0,
        offsetTop: viewport?.offsetTop ?? 0,
        width: viewport?.width ?? window.innerWidth,
        height: viewport?.height ?? window.innerHeight,
      };
    });
    const x = geometry.x - geometry.offsetLeft;
    const y = geometry.y - geometry.offsetTop;
    if (x >= 0 && x <= geometry.width && y >= 0 && y <= geometry.height) {
      await page.touchscreen.tap(x, y);
      return;
    }
    await page.evaluate(({ deltaX, deltaY }) => window.scrollBy(deltaX, deltaY), {
      deltaX: x - geometry.width / 2,
      deltaY: y - geometry.height / 2,
    });
  }
  const lastPosition = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const viewport = window.visualViewport;
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      scrollY: window.scrollY,
      visualViewport: viewport && {
        offsetTop: viewport.offsetTop,
        offsetLeft: viewport.offsetLeft,
        width: viewport.width,
        height: viewport.height,
      },
    };
  });
  throw new Error(`Unable to bring the element into the mobile visual viewport: ${JSON.stringify(lastPosition)}`);
}

const fireKey = 'site:SITE-LL01-000';

test('live mode keeps map and settlement campfire on one entity and camera controls do not issue travel', async ({ page }, testInfo) => {
  let currentView = playerView();
  let saves: unknown[] = [];
  let created = false;
  let commands = 0;
  let previews = 0;
  let expectedRevision: number | null = null;

  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    if (pathname.endsWith('/health')) {
      await route.fulfill({ json: { status: 'ready', apiVersion: 1, contentVersion: 'test', storage: 'sqlite' } });
      return;
    }
    if (pathname.endsWith('/sessions')) {
      await route.fulfill({ status: 201, json: { accessToken: 'test-token', expiresAtUtc: '2026-10-10T00:00:00.000Z', tokenType: 'Bearer' } });
      return;
    }
    if (pathname.endsWith('/saves') && request.method() === 'GET') {
      await route.fulfill({ json: { saves } });
      return;
    }
    if (pathname.endsWith('/saves') && request.method() === 'POST') {
      created = true;
      const save = {
        saveId: 'save-live-01', slotName: 'Lãnh Địa Mới', revision: 1, lastEventSequence: 1,
        worldPackageId: 'WORLD-PACKAGE-LL01-1.0', contentVersion: 'test', rulesetVersion: 'test',
        createdAtUtc: '2026-10-10T00:00:00.000Z', updatedAtUtc: '2026-10-10T00:00:00.000Z', forkedFrom: null,
      };
      saves = [save];
      await route.fulfill({ status: 201, json: { created: true, save, view: currentView } });
      return;
    }
    if (pathname.endsWith('/session') && request.method() === 'POST') {
      await route.fulfill({ json: { saveId: 'save-live-01', revision: currentView.revision, lastEventSequence: currentView.lastEventSequence, sessionExpiresAtUtc: '2026-10-10T01:00:00.000Z', clockDriver: { driver: 'active', catchingUp: false, targetSimElapsedMs: 0, leaseRemainingMs: 5000, sessionTokenIsDriver: true } } });
      return;
    }
    if (pathname.endsWith('/heartbeat') && request.method() === 'POST') {
      await route.fulfill({ json: { driver: 'active', catchingUp: false, targetSimElapsedMs: currentView.simElapsedMs, leaseRemainingMs: 5000, sessionTokenIsDriver: true } });
      return;
    }
    if (pathname.endsWith('/view')) {
      await route.fulfill({ json: { view: currentView } });
      return;
    }
    if (pathname.endsWith('/events')) {
      const events = [{ sequence: 1, eventId: 'event-1', type: 'opening_protection_started', category: 'survival', title: 'Bảo hộ mở đầu', text: 'EV00-SAFE-FIRE' }];
      if (commands) events.push({ sequence: 2, eventId: 'event-2', type: 'entity_inspected', category: 'world', title: 'Đã kiểm tra điểm', text: 'Lửa Trại Cấp 1' });
      await route.fulfill({ json: { events, afterSequence: 0, nextSequence: currentView.lastEventSequence, hasMore: false } });
      return;
    }
    if (pathname.endsWith('/commands/preview')) {
      previews += 1;
      await route.fulfill({ json: { revision: currentView.revision, availability: { actionId: 'inspect_entity', enabled: true, reasonCode: null, requirements: [] }, estimate: null } });
      return;
    }
    if (pathname.endsWith('/commands')) {
      commands += 1;
      expectedRevision = request.postDataJSON().expectedRevision;
      currentView = playerView(2);
      await route.fulfill({ json: { receipt: { commandId: request.postDataJSON().commandId, accepted: true, revision: 2, eventSequence: 2, code: 'OK', message: 'Đã commit' }, revision: 2, view: currentView } });
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'missing', displayText: 'missing' } } });
  });

  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill('local-owner-key');
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click();
  await expect(page.locator('.live-footer')).toContainText('revision 1');

  await page.getByRole('button', { name: 'Lãnh địa' }).click();
  const territoryCampfire = page.getByTestId('territory-campfire-structure');
  await expect(territoryCampfire).toHaveAttribute('data-entity-ref', fireKey);
  await expect(territoryCampfire.locator('img').first()).toBeVisible();

  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  const mapCampfire = page.getByTestId('map-campfire-marker');
  await expect(mapCampfire).toHaveAttribute('data-entity-ref', fireKey);
  await expect(mapCampfire).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Choose destination' }).click();
  const liveMapBox = await page.getByTestId('live-map').boundingBox();
  expect(liveMapBox).not.toBeNull();
  await page.getByTestId('live-map').click({ position: { x: liveMapBox!.width * 0.82, y: liveMapBox!.height * 0.82 } });
  await expect(page.getByText('Destination preview')).toBeVisible();
  expect(previews).toBe(1);
  expect(commands).toBe(0);
  await page.getByRole('button', { name: 'Cancel destination selection' }).click();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await mapCampfire.scrollIntoViewIfNeeded();
  await tapVisualCenter(page, mapCampfire, testInfo.project.name === 'mobile-chromium');
  await tapVisualCenter(page, page.getByRole('button', { name: 'Kiểm tra', exact: true }), testInfo.project.name === 'mobile-chromium');
  try {
    await expect.poll(() => commands).toBe(1);
  } catch (error) {
    const commandDiagnostic = await page.evaluate(() => ({
      status: document.querySelector('[role="status"]')?.textContent,
      alert: document.querySelector('[role="alert"]')?.textContent,
      footer: document.querySelector('.live-footer')?.textContent,
      inspectorButtons: Array.from(document.querySelectorAll('.live-inspector button')).map(button => ({ text: button.textContent, aria: button.getAttribute('aria-label'), disabled: (button as HTMLButtonElement).disabled, html: button.outerHTML.slice(0, 240) })),
    }));
    console.log('COMMAND_DIAGNOSTIC', JSON.stringify({ commands, previews, commandDiagnostic }));
    throw error;
  }
  await expect(page.getByRole('status')).toContainText('revision 2');
  await expect(page.locator('.live-footer')).toContainText('revision 2');
  expect(created).toBe(true);
  expect(commands).toBe(1);
  expect(expectedRevision).toBe(1);

  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill('local-owner-key');
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await expect(page.locator('.live-topbar')).toContainText('revision 2');
  await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
  await expect(page.getByTestId('map-campfire-marker')).toHaveAttribute('data-entity-ref', fireKey);
  if (testInfo.project.name === 'chromium') {
    const screenshotDirectory = resolve(process.cwd(), '../docs/implementation/screenshots');
    mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({ path: resolve(screenshotDirectory, 'stage-05-map.png'), fullPage: true });
  }
});

test('live mode keeps the API disconnection visible and does not fall back to demo', async ({ page }) => {
  await page.route('**/api/v1/health', route => route.abort());
  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText(/Không kết nối được API cục bộ/)).toBeVisible();
  await expect(page.getByText(/Chế độ demo/)).toHaveCount(0);
});
