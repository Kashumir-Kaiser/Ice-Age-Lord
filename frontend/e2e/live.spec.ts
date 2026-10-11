import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const fireRef = { type: 'site', id: 'SITE-LL01-000' };
const fireKey = 'site:SITE-LL01-000';

function playerView(revision = 1) {
  return {
    schemaVersion: 1,
    saveId: 'save-live-01',
    revision,
    lastEventSequence: revision,
    simElapsedMs: 0,
    clockControl: { status: 'paused', selection: 'paused', speedPermille: 0, stopCondition: 'none' },
    clockStatus: { driver: 'active', catchingUp: false, targetSimElapsedMs: 0, leaseRemainingMs: 5000 },
    worldClock: { day: 1, hour: 7, minute: 0, lightPhase: 'daylight' },
    survival: { coldLoad: null, coldStatus: 'weather_unresolved', blocker: 'OPENING_WEATHER_RECORD_NOT_SEEDED', hungerState: 'FED' },
    player: {
      id: 'LI_LAN', name: 'Lí Lan', level: 1, xp: 0, formTier: 1,
      talent: { name: 'Tử Phục Linh Sư', grade: 'SSS' },
      attributes: { STR: 8 }, mana: { current: 236, max: 236 }, careerState: 'unemployed',
      position: { xMm: 0, yMm: 0, sourceZMetres: 0 },
    },
    careerCard: { observed: false, active: false, openingSkillLearned: false, career: null },
    territory: {
      id: 'H0', stage: 'H0', position: { xMm: 0, yMm: 0 },
      survivalFire: { ref: fireRef, level: 1, active: true, heatRadiusMetres: 10, fuelRemaining: null, fuelKnowledge: 'state_unobserved', nextFuelConsumptionAtElapsedMs: null, fuelBlocker: 'INITIAL_FUEL_AMOUNT_NOT_SPECIFIED', protection: 'active' },
      tomb: {
        level: 1,
        deathQi: { current: 20, capacity: 20, nextRefillAtElapsedMs: 61200000 },
        productionSlots: 2,
        activeCount: 0,
        queuedCount: 0,
        nextCompletionAtElapsedMs: null,
        queue: [],
        output: { formTier: 0, grade: 'Thường', level: 1, xp: 0, faction: 'DARK', hero: false, loyalty: 'ABSOLUTE_TO_LI_LAN', xpMirrorEligible: false, baseLaborRateWuPerHour: 1 },
      },
      buildings: [{ id: 'LL-BLD-FIRE-01', name: 'Lửa Trại', status: 'active', kind: 'fire', level: 1 }],
    },
    construction: {
      unlockedBlueprintIds: [],
      blueprints: [],
      jobs: [],
      residents: [],
      rewardEntitlements: [],
      operatingServices: [],
      farmerHouseCapacity: 0,
      occupiedHousing: 0,
    },
    inventory: {
      inspectableContainers: [{ containerId: 'LL-CNT-CARRIED-FOOD-BAG-01', label: 'Bịch đồ ăn', kind: 'carried_bag' }],
      containers: [],
    },
    units: [],
    jobs: [],
    visibleMap: {
      coordinateSystem: 'LL01-LOCAL-KM',
      coordinateEncoding: 'integer millimetres from H0; source z retained in metres',
      currentSight: [], visibleGeometry: [], exploredGeometry: [], terrain: [],
      entities: [{
        ref: fireRef, label: 'Lửa Trại Cấp 1', category: 'site', knowledge: 'current',
        observedAtElapsedMs: 0, position: { xMm: 0, yMm: 0 },
        actions: [{ actionId: 'inspect_entity', enabled: true, reasonCode: null, requirements: [] }],
      }],
      knownRoutes: [], activeOrders: [], heatOverlays: [],
    },
    spatial: { navigationRuleVersion: 'LL01-NAVIGATION-OVERLAY-1.0', movementOrders: [], searchJobs: [], harvestJobs: [], resources: [] },
    journal: [],
  };
}

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
  await page.getByTestId('live-map').click({ position: { x: 30, y: 30 } });
  await expect(page.getByText('Destination preview')).toBeVisible();
  expect(previews).toBe(1);
  expect(commands).toBe(0);
  await page.getByRole('button', { name: 'Cancel destination selection' }).click();
  await mapCampfire.click();
  await page.getByRole('button', { name: 'Inspect' }).click();
  await expect(page.getByText('Đã commit · revision 2 đã commit.')).toBeVisible();
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
