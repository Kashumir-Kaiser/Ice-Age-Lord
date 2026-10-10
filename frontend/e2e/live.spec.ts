import { expect, test } from '@playwright/test';

const fireRef = { type: 'site', id: 'SITE-LL01-000' };
const fireKey = 'site:SITE-LL01-000';

function playerView(revision = 0) {
  return {
    schemaVersion: 1,
    saveId: 'save-live-01',
    revision,
    lastEventSequence: revision,
    simElapsedMs: 0,
    clockControl: { status: 'paused', speedPermille: 0 },
    player: {
      id: 'LI_LAN', name: 'Lí Lan', level: 1, xp: 0, formTier: 1,
      talent: { name: 'Tử Phục Linh Sư', grade: 'SSS' },
      attributes: { STR: 8 }, mana: { current: 236, max: 236 }, careerState: 'unemployed',
    },
    careerCard: { observed: false, career: null },
    territory: {
      id: 'H0', stage: 'H0', position: { xMm: 0, yMm: 0 },
      survivalFire: { ref: fireRef, level: 1, active: true, heatRadiusMetres: 10, protection: 'pending-opening-settlement' },
      buildings: [{ id: 'LL-BLD-FIRE-01', name: 'Lửa Trại', status: 'active' }],
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
    journal: [],
  };
}

test('live mode uses Stage 03 API and keeps map and settlement campfire on one entity', async ({ page }) => {
  let currentView = playerView();
  let saves: unknown[] = [];
  let created = false;
  let commands = 0;

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
        saveId: 'save-live-01', slotName: 'Lãnh Địa Mới', revision: 0, lastEventSequence: 0,
        worldPackageId: 'WORLD-PACKAGE-LL01-1.0', contentVersion: 'test', rulesetVersion: 'test',
        createdAtUtc: '2026-10-10T00:00:00.000Z', updatedAtUtc: '2026-10-10T00:00:00.000Z', forkedFrom: null,
      };
      saves = [save];
      await route.fulfill({ status: 201, json: { created: true, save, view: currentView } });
      return;
    }
    if (pathname.endsWith('/session') && request.method() === 'POST') {
      await route.fulfill({ json: { saveId: 'save-live-01', revision: currentView.revision, lastEventSequence: currentView.lastEventSequence, sessionExpiresAtUtc: '2026-10-10T01:00:00.000Z' } });
      return;
    }
    if (pathname.endsWith('/view')) {
      await route.fulfill({ json: { view: currentView } });
      return;
    }
    if (pathname.endsWith('/events')) {
      await route.fulfill({ json: { events: commands ? [{ sequence: 1, eventId: 'event-1', type: 'entity_inspected', category: 'world', title: 'Đã kiểm tra điểm', text: 'Lửa Trại Cấp 1' }] : [], afterSequence: 0, nextSequence: commands, hasMore: false } });
      return;
    }
    if (pathname.endsWith('/commands/preview')) {
      await route.fulfill({ json: { revision: currentView.revision, availability: { actionId: 'inspect_entity', enabled: true, reasonCode: null, requirements: [] }, estimate: null } });
      return;
    }
    if (pathname.endsWith('/commands')) {
      commands += 1;
      currentView = playerView(1);
      await route.fulfill({ json: { receipt: { commandId: request.postDataJSON().commandId, accepted: true, revision: 1, eventSequence: 1, code: 'OK', message: 'Đã commit' }, revision: 1, view: currentView } });
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
  await expect(page.getByText('Clean game đã được tạo và commit. Revision 0.')).toBeVisible();

  await page.getByRole('button', { name: 'Lãnh địa' }).click();
  const territoryCampfire = page.getByTestId('territory-campfire-structure');
  await expect(territoryCampfire).toHaveAttribute('data-entity-ref', fireKey);
  await expect(territoryCampfire.locator('img').first()).toBeVisible();

  await page.getByRole('button', { name: 'Bản đồ' }).click();
  const mapCampfire = page.getByTestId('map-campfire-marker');
  await expect(mapCampfire).toHaveAttribute('data-entity-ref', fireKey);
  await expect(mapCampfire).toBeVisible();
  await mapCampfire.click();
  await page.getByRole('button', { name: 'Kiểm tra điểm đã chọn' }).click();
  await expect(page.getByText('Đã commit · revision 1 đã commit.')).toBeVisible();
  expect(created).toBe(true);
  expect(commands).toBe(1);

  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill('local-owner-key');
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await expect(page.getByText('snapshot revision 1')).toBeVisible();
  await page.getByRole('button', { name: 'Bản đồ' }).click();
  await expect(page.getByTestId('map-campfire-marker')).toHaveAttribute('data-entity-ref', fireKey);
});

test('live mode keeps the API disconnection visible and does not fall back to demo', async ({ page }) => {
  await page.route('**/api/v1/health', route => route.abort());
  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText(/Không kết nối được API cục bộ/)).toBeVisible();
  await expect(page.getByText(/Chế độ demo/)).toHaveCount(0);
});
