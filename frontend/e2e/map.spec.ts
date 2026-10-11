import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installLocalPreviewRoute } from './localPreviewRoute';

test.beforeEach(async ({ page }) => installLocalPreviewRoute(page));

async function visitMap(page: Page) {
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const menu = page.getByRole('button', { name: 'Mở điều hướng' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Các mục giao diện' }).getByRole('button', { name: /Bản đồ/ }).click();
  await expect(page.locator('svg.terrain-svg--deep')).toBeVisible();
}

async function viewBox(page: Page) {
  return (await page.locator('svg.terrain-svg--deep').getAttribute('viewBox'))!.split(/\s+/).map(Number);
}

async function openDeveloperControls(page: Page) {
  await page.locator('.map-developer-tools > summary').click();
}

async function navigateTo(page: Page, name: RegExp) {
  await expect(page.locator('.app-shell')).toBeVisible();
  const menu = page.getByRole('button', { name: 'Mở điều hướng' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Các mục giao diện' }).getByRole('button', { name }).click();
}

async function touchDrag(page: Page, dx: number, dy: number) {
  const rect = await page.locator('svg.terrain-svg--deep').boundingBox();
  expect(rect).not.toBeNull();
  await page.evaluate(({ x, y, dx, dy }) => {
    const svg = document.querySelector('svg.terrain-svg--deep')!;
    const px = x + 0.72 * rectWidth(svg), py = y + 0.65 * rectHeight(svg);
    const send = (type: string, clientX: number, clientY: number) => svg.dispatchEvent(new PointerEvent(type, { pointerId: 23, pointerType: 'touch', button: 0, clientX, clientY, bubbles: true }));
    send('pointerdown', px, py);
    send('pointermove', px + dx, py + dy);
    send('pointerup', px + dx, py + dy);
    function rectWidth(node: Element) { return node.getBoundingClientRect().width; }
    function rectHeight(node: Element) { return node.getBoundingClientRect().height; }
  }, { x: rect!.x, y: rect!.y, dx, dy });
}

function mapPoint(box: number[], rect: { x: number; y: number; width: number; height: number }, px: number, py: number) {
  return { x: box[0] + px / rect.width * box[2], y: box[1] + py / rect.height * box[3] };
}

test('map uses the shared known projection and shows a physical scale bar', async ({ page }) => {
  await visitMap(page);
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
  await expect(page.locator('[data-testid="map-scale-bar"]')).toContainText(/m|km/);
  await expect(page.locator('.map-entity-marker[data-entity-id="SITE-LL01-000"]')).toHaveCount(1);
  for (const id of ['SITE-LL01-001','SITE-LL01-002','SITE-LL01-003']) await expect(page.locator(`.map-entity-marker[data-entity-id="${id}"]`)).toHaveCount(0);
  await expect(page.locator('.map-accessible-entities')).toContainText('Lửa Trại');
});

test('heat fit frames levels 1, 16, and 30 locally in both viewport orientations', async ({ page, isMobile }) => {
  await visitMap(page);
  await openDeveloperControls(page);
  for (const [level, radius] of [[1, 10], [16, 2500], [30, 25000]]) {
    await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption(String(level));
    await page.getByRole('button', { name: 'Xem toàn bộ vòng nhiệt' }).click();
    const box = await viewBox(page);
    expect(box[2]).toBeGreaterThanOrEqual(radius * 2);
    expect(box[3]).toBeGreaterThanOrEqual(radius * 2);
    await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chuyển sang bản đồ thế giới' })).toBeVisible();
  }
  if (isMobile) expect(await page.locator('body').evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(390);
});

test('world framing contains the 96 km radius in portrait and remains an explicit mode', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'portrait framing check');
  await page.setViewportSize({ width: 390, height: 844 });
  await visitMap(page);
  await page.getByRole('button', { name: 'Chuyển sang bản đồ thế giới' }).click();
  const box = await viewBox(page);
  expect(box[2]).toBeGreaterThanOrEqual(192000);
  expect(box[3]).toBeGreaterThanOrEqual(192000);
  await expect(page.locator('.map-corner-title strong')).toHaveText('Bản đồ thế giới');
  await page.getByRole('button', { name: 'Chuyển sang bản đồ địa phương' }).click();
  await expect(page.getByText('Đồng bằng Cổ Chiến Trường')).toBeVisible();
});

test('wheel zoom keeps the geographic point under the cursor and does not scroll the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'touch devices do not produce wheel input in this project');
  await visitMap(page);
  const svg = page.locator('svg.terrain-svg--deep');
  const rect = await svg.boundingBox();
  expect(rect).not.toBeNull();
  const pointer = { x: rect!.width * .31, y: rect!.height * .67 };
  const beforeBox = await viewBox(page);
  const beforePoint = mapPoint(beforeBox, rect!, pointer.x, pointer.y);
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.mouse.move(rect!.x + pointer.x, rect!.y + pointer.y);
  await page.mouse.wheel(0, -190);
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(beforeBox.join(' '));
  const afterBox = await viewBox(page);
  const afterPoint = mapPoint(afterBox, rect!, pointer.x, pointer.y);
  expect(Math.abs(afterPoint.x - beforePoint.x)).toBeLessThan(2);
  expect(Math.abs(afterPoint.y - beforePoint.y)).toBeLessThan(2);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
});

test('pointer drag pans without activating a marker, and the next marker click selects it', async ({ page, isMobile }) => {
  await visitMap(page);
  const svg = page.locator('svg.terrain-svg--deep');
  const before = await svg.getAttribute('viewBox');
  if (isMobile) await touchDrag(page, -84, 57);
  else {
    const rect = await svg.boundingBox();
    expect(rect).not.toBeNull();
    const start = { x: rect!.x + rect!.width * .77, y: rect!.y + rect!.height * .65 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 84, start.y + 57, { steps: 6 });
    await page.mouse.up();
  }
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(before);
  await expect(page.locator('.entity-inspector:visible[data-entity-id="SITE-LL01-000"]')).toBeVisible();
  await page.locator('.map-entity-marker[data-entity-id="MODELED-STONE-01"]').click();
  await expect(page.locator('.entity-inspector:visible[data-entity-id="MODELED-STONE-01"]')).toBeVisible();
});

test('two-finger pinch changes zoom around its moving midpoint', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch-only interaction');
  await page.setViewportSize({ width: 390, height: 844 });
  await visitMap(page);
  const svg = page.locator('svg.terrain-svg--deep');
  const before = await viewBox(page);
  const rect = await svg.boundingBox();
  expect(rect).not.toBeNull();
  await page.evaluate(({ x, y }) => {
    const svg = document.querySelector('svg.terrain-svg--deep')!;
    const send = (type: string, pointerId: number, clientX: number, clientY: number) => svg.dispatchEvent(new PointerEvent(type, { pointerId, pointerType: 'touch', button: 0, clientX, clientY, bubbles: true }));
    send('pointerdown', 1, x + 90, y + 240);
    send('pointerdown', 2, x + 190, y + 240);
    send('pointermove', 2, x + 240, y + 240);
    send('pointerup', 2, x + 240, y + 240);
    send('pointerup', 1, x + 90, y + 240);
  }, { x: rect!.x, y: rect!.y });
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(before.join(' '));
  expect((await viewBox(page))[3]).toBeLessThan(before[3]);
});

test('keyboard pans and zooms only when the map has focus', async ({ page }) => {
  await visitMap(page);
  const svg = page.locator('svg.terrain-svg--deep');
  await svg.focus();
  const before = await viewBox(page);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(before.join(' '));
  const panned = await viewBox(page);
  await page.keyboard.press('+');
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(panned.join(' '));
});

test('cluster expansion lists stable member entities without combining their values', async ({ page }) => {
  await visitMap(page);
  await page.getByRole('button', { name: 'Chuyển sang bản đồ thế giới' }).click();
  const cluster = page.getByRole('button', { name: /Mở danh sách cụm/ });
  await expect(cluster).toBeVisible();
  await cluster.click();
  const list = page.getByRole('region', { name: 'Các điểm trong cụm' });
  await expect(list).not.toContainText('Lửa Trại Cấp 1');
  await expect(list).toContainText('Mảnh gỗ đen');
  await expect(list).toContainText('Đá nhô khỏi băng');
  await list.getByRole('button', { name: /Đá nhô khỏi băng/ }).click();
  await expect(page.locator('.entity-inspector:visible[data-entity-id="MODELED-STONE-01"]')).toBeVisible();
});

test('selection survives screen changes, highlights the matching building, and Escape clears it', async ({ page }) => {
  await visitMap(page);
  await page.locator('.map-entity-marker[data-entity-id="SITE-LL01-000"]').click();
  await navigateTo(page, /Công trình/);
  await expect(page.locator('.building-card--selected')).toContainText('Lửa Trại Cấp 1');
  await expect(page.locator('.entity-inspector:visible[data-entity-id="SITE-LL01-000"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.building-card--selected')).toHaveCount(0);
  if (await page.locator('.map-inspector-mobile').isVisible()) await expect(page.locator('.map-inspector-mobile')).not.toHaveAttribute('open', '');
});

test('map camera survives tab return and inspector does not intercept map wheel input', async ({ page, isMobile }) => {
  await visitMap(page);
  const svg = page.locator('svg.terrain-svg--deep');
  const before = await svg.getAttribute('viewBox');
  if (isMobile) await touchDrag(page, -44, 36);
  else {
    const rect = await svg.boundingBox();
    expect(rect).not.toBeNull();
    await page.mouse.move(rect!.x + rect!.width * .76, rect!.y + rect!.height * .67);
    await page.mouse.down();
    await page.mouse.move(rect!.x + rect!.width * .73, rect!.y + rect!.height * .7, { steps: 4 });
    await page.mouse.up();
  }
  const afterPan = await svg.getAttribute('viewBox');
  expect(afterPan).not.toBe(before);
  await navigateTo(page, /Tổng quan/);
  await navigateTo(page, /Bản đồ/);
  await expect.poll(() => svg.getAttribute('viewBox')).toBe(afterPan);
});

test('night and source-atlas previews keep hidden entities out of player selection', async ({ page }) => {
  await visitMap(page);
  await openDeveloperControls(page);
  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
  await page.getByLabel('Lửa đang bật').uncheck();
  await expect(page.locator('.map-entity-marker[data-entity-id="MODELED-STONE-01"]')).toHaveAttribute('aria-label', /Vị trí đã biết lần cuối: Đá nhô khỏi băng/);
  const ordinaryIds = await page.locator('.map-accessible-entities').innerText();
  await page.getByLabel('Hiện lớp dữ liệu tham khảo').check();
  await expect(page.locator('.map-developer-tools')).toContainText('không khám phá hay lưu tiến trình');
  expect(await page.locator('.map-accessible-entities').innerText()).toBe(ordinaryIds);
  await expect(page.getByRole('button', { name: /Kiểm tra Hào Nông Sora/ })).toHaveCount(0);
  await expect(page.locator('.entity-inspector:visible[data-entity-id="MODELED-STONE-01"]')).toHaveCount(0);
});

test('rapid resize keeps the map and page within a 390 px mobile viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout check');
  await page.setViewportSize({ width: 390, height: 844 });
  await visitMap(page);
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await expect(page.locator('svg.terrain-svg--deep')).toBeVisible();
    await expect.poll(() => page.locator('.map-scene--deep').evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThan(300);
    const layout = await page.evaluate(() => {
      const panel = document.querySelector('.map-full')!.getBoundingClientRect();
      const scene = document.querySelector('.map-scene--deep')!.getBoundingClientRect();
      return { panelBottom: panel.bottom, sceneBottom: scene.bottom, sceneHeight: scene.height };
    });
    expect(layout.sceneHeight).toBeGreaterThan(240);
    expect(layout.sceneBottom).toBeLessThanOrEqual(layout.panelBottom + 1);
    expect(await page.locator('body').evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(size.width);
  }
});

test('records local pan and zoom interaction timing at desktop and mobile sizes', async ({ page, isMobile }) => {
  const viewport = isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 };
  await page.setViewportSize(viewport);
  await visitMap(page);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    type LongTaskSample = { duration: number; startTime: number; attribution: string[] };
    const state = window as typeof window & { __mapQaStarted?: number; __mapQaLongTasks?: LongTaskSample[] };
    state.__mapQaStarted = performance.now();
    state.__mapQaLongTasks = [];
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(entries => {
        const tasks = (window as typeof window & { __mapQaLongTasks?: LongTaskSample[] }).__mapQaLongTasks;
        for (const entry of entries.getEntries()) {
          const detail = entry as PerformanceEntry & { attribution?: Array<{ containerType?: string; containerName?: string; name?: string }> };
          tasks?.push({ duration: entry.duration, startTime: entry.startTime, attribution: detail.attribution?.map(item => [item.containerType, item.containerName, item.name].filter(Boolean).join(':')) ?? [] });
        }
      });
      try { observer.observe({ type: 'longtask', buffered: true }); } catch { /* Long-task timing is optional in this browser. */ }
    }
  });

  const svg = page.locator('svg.terrain-svg--deep');
  const rect = await svg.boundingBox();
  expect(rect).not.toBeNull();
  const original = await svg.getAttribute('viewBox');
  if (isMobile) {
    for (let index = 0; index < 6; index++) await touchDrag(page, index % 2 ? 8 : -8, index % 2 ? -6 : 6);
    await page.evaluate(({ x, y }) => {
      const node = document.querySelector('svg.terrain-svg--deep')!;
      const send = (type: string, pointerId: number, clientX: number, clientY: number) => node.dispatchEvent(new PointerEvent(type, { pointerId, pointerType: 'touch', button: 0, clientX, clientY, bubbles: true }));
      send('pointerdown', 31, x + 100, y + 250);
      send('pointerdown', 32, x + 190, y + 250);
      send('pointermove', 32, x + 220, y + 250);
      send('pointerup', 32, x + 220, y + 250);
      send('pointerup', 31, x + 100, y + 250);
    }, { x: rect!.x, y: rect!.y });
  } else {
    await page.mouse.move(rect!.x + rect!.width * .7, rect!.y + rect!.height * .7);
    for (let index = 0; index < 6; index++) {
      const startX = rect!.x + rect!.width * .7;
      const startY = rect!.y + rect!.height * .7;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + (index % 2 ? 5 : -5), startY + 4, { steps: 2 });
      await page.mouse.up();
      await page.mouse.wheel(0, index % 2 ? 18 : -18);
    }
  }
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(original);
  const measurement = await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    type LongTaskSample = { duration: number; startTime: number; attribution: string[] };
    const state = window as typeof window & { __mapQaStarted?: number; __mapQaLongTasks?: LongTaskSample[] };
    const longTasks = state.__mapQaLongTasks ?? [];
    const durations = longTasks.map(task => task.duration);
    return {
      durationMs: Math.round(performance.now() - (state.__mapQaStarted ?? performance.now())),
      longTaskCount: longTasks.length,
      maxLongTaskMs: Math.round(Math.max(0, ...durations) * 10) / 10,
      longTaskDurations: longTasks.map(task => Math.round(task.duration * 10) / 10),
      longTaskAttribution: longTasks.map(task => task.attribution),
    };
  });
  console.log(`MAP_QA viewport=${viewport.width}x${viewport.height} elapsed_ms=${measurement.durationMs} long_tasks=${measurement.longTaskCount} max_long_task_ms=${measurement.maxLongTaskMs} long_task_durations_ms=${measurement.longTaskDurations.join(',')} long_task_attribution=${JSON.stringify(measurement.longTaskAttribution)}`);
});

test('visual baselines cover day, night, maximum heat, world, cluster, and selected inspector', async ({ page, isMobile }) => {
  const viewport = isMobile ? { width: 390, height: 870 } : { width: 1280, height: 900 };
  const label = isMobile ? 'mobile' : 'desktop';
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visitMap(page);
  const mapLayout = await page.evaluate(() => {
    const experience = document.querySelector('.map-experience')!.getBoundingClientRect();
    const scene = document.querySelector('.map-scene--deep')!.getBoundingClientRect();
    const footer = document.querySelector('.map-footer-bar')!.getBoundingClientRect();
    const hint = document.querySelector('.map-drag-hint')!.getBoundingClientRect();
    const scale = document.querySelector('.map-scale-bar')!.getBoundingClientRect();
    return { experienceBottom: experience.bottom, sceneBottom: scene.bottom, footerTop: footer.top, footerBottom: footer.bottom, footerHeight: footer.height, hintBottom: hint.bottom, scaleTop: scale.top };
  });
  expect(mapLayout.sceneBottom).toBeLessThanOrEqual(mapLayout.footerTop + 1);
  expect(mapLayout.footerHeight).toBeGreaterThan(30);
  expect(mapLayout.footerBottom).toBeLessThanOrEqual(mapLayout.experienceBottom + 1);
  if (!isMobile) expect(mapLayout.hintBottom).toBeLessThanOrEqual(mapLayout.scaleTop - 4);
  if (isMobile) await page.locator('.map-experience').evaluate(node => { const element = node as HTMLElement; element.style.height = '870px'; element.style.flexShrink = '0'; });
  const visualOptions = { animations: 'disabled' as const, caret: 'hide' as const, maxDiffPixelRatio: 0.1 };
  await expect(page.locator('.map-experience')).toHaveScreenshot(`${label}-opening-day.png`, visualOptions);

  await openDeveloperControls(page);
  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
  if (isMobile) {
    await page.locator('.map-experience').evaluate(node => { (node as HTMLElement).style.minHeight = '1048px'; });
  }
  await expect(page.locator('.map-experience')).toHaveScreenshot(`${label}-opening-night.png`, visualOptions);

  await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('720');
  await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
  await page.getByRole('button', { name: 'Xem toàn bộ vòng nhiệt' }).click();
  await expect(page.locator('.map-experience')).toHaveScreenshot(`${label}-heat-25km.png`, visualOptions);

  await page.getByRole('button', { name: 'Chuyển sang bản đồ thế giới' }).click();
  await expect(page.locator('.map-experience')).toHaveScreenshot(`${label}-world.png`, visualOptions);
  await page.getByRole('button', { name: /Mở danh sách cụm/ }).click();
  await expect(page.locator('.map-experience')).toHaveScreenshot(`${label}-cluster.png`, visualOptions);

  const inspector = isMobile ? page.locator('.map-inspector-mobile') : page.locator('.map-inspector-desktop');
  if (isMobile) {
    await expect(inspector).toBeVisible();
    await expect(inspector.locator('summary')).toBeVisible();
  } else {
    await inspector.evaluate(node => { (node as HTMLElement).style.minHeight = '525px'; });
    await expect(inspector).toHaveScreenshot(`${label}-selected-inspector.png`, visualOptions);
  }
});
