import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createApiServer } from '../../packages/api/src/server.ts';
import { GameApplicationService } from '../../packages/api/src/service.ts';
import { SqliteRepository } from '../../packages/storage/src/repository.ts';
import { canonicalStateHash } from '../../packages/sim/src/hash.ts';
import { startMapFixtureServer } from './map-fixture-server.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const frontendDir = resolve(repoRoot, 'frontend');
const ownerKey = `local-map-transfer-${randomBytes(32).toString('hex')}`;
const slotName = 'LOCAL persisted LIVE map transfer';
const apiDirectory = mkdtempSync(join(tmpdir(), 'ill-map-live-transfer-'));
const checkpointPath = join(tmpdir(), 'ill-map-live-transfer-checkpoints.json');
const repository = new SqliteRepository(join(apiDirectory, 'saves.sqlite'));
const service = new GameApplicationService(repository);
const dist = resolve(process.env.MAP_DIST ?? join(frontendDir, 'dist'));
if (!existsSync(resolve(dist, 'index.html')) || !existsSync(resolve(dist, 'assets/manifest.json'))) {
  throw new Error('FINAL_PRODUCTION_DIST_REQUIRED');
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function sourceBuildFingerprint() {
  const scopedDirectories = [
    'frontend/src', 'frontend/public/assets', 'packages/api/src', 'packages/storage/src',
    'packages/sim/src', 'packages/contracts/src', 'packages/content/src',
  ];
  const scopedFiles = [
    'package.json', 'frontend/package.json', 'frontend/package-lock.json', 'frontend/vite.config.ts',
    'frontend/scripts/map-live-transfer.mjs',
  ];
  const paths = [
    ...scopedFiles.map(path => resolve(repoRoot, path)),
    ...scopedDirectories.flatMap(path => walkFiles(resolve(repoRoot, path))),
  ].sort();
  const entries = paths.map(path => ({ path: relative(repoRoot, path).replaceAll('\\', '/'), sha256: sha256(readFileSync(path)) }));
  const digestInput = entries.map(entry => `${entry.path}\0${entry.sha256}\n`).join('');
  return { sha256: sha256(digestInput), fileCount: entries.length, scope: [...scopedFiles, ...scopedDirectories] };
}

async function listen(server, port = 0) {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('LOCAL_SERVER_ADDRESS_INVALID');
  return address.port;
}

let browser;
const captures = [];
const transferLog = [];
let activeQuality = 'setup';
let accessToken = '';
let saveId = '';
let initialView = null;
let persistedView = null;
let domainHashBeforeReload = '';
let domainHashAfterReloadBeforePan = '';

const staticServer = await startMapFixtureServer(dist, response => {
  if (response.path.startsWith('assets/map/') || response.path === 'assets/manifest.json') {
    transferLog.push({ quality: activeQuality, ...response, sha256: sha256(readFileSync(resolve(dist, response.path))) });
  }
});
const { server } = createApiServer(service, { ownerKey, allowedOrigin: staticServer.origin });
const apiPort = await listen(server);
const apiOrigin = `http://127.0.0.1:${apiPort}`;

let cleanupPromise;
function cleanup() {
  return cleanupPromise ??= (async () => {
    await browser?.close().catch(() => {});
    server.closeAllConnections?.();
    await new Promise(resolveClose => server.close(() => resolveClose())).catch(() => {});
    await staticServer.close().catch(() => {});
    await service.shutdownClockDrivers().catch(() => {});
    repository.close();
    rmSync(apiDirectory, { recursive: true, force: true });
  })();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
  });
}

async function captureRun(quality, createSave) {
  activeQuality = quality;
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  await context.addInitScript(value => localStorage.setItem('ice-age-map-quality', value), quality);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(10000);
  const pendingBodies = [];
  const healthResponses = [];
  const apiResponses = [];
  const localApiRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || url.pathname === '/health') localApiRequests.push({ path: url.pathname, method: request.method() });
  });
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || url.pathname === '/health') localApiRequests.push({ path: url.pathname, failure: request.failure()?.errorText ?? 'unknown' });
  });
  page.on('pageerror', error => console.error(JSON.stringify({ code: 'LIVE_PAGE_ERROR', message: error.message })));
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/api/v1/')) apiResponses.push({ path, status: response.status() });
    if (path === '/api/v1/health') healthResponses.push(response.status());
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.endsWith('/sessions') && response.request().method() === 'POST') {
      pendingBodies.push(response.json().then(body => { accessToken = body.accessToken; }).catch(() => {}));
    }
    if (url.pathname.endsWith('/saves') && response.request().method() === 'POST') {
      pendingBodies.push(response.json().then(body => { saveId = body.save.saveId; initialView = body.view; }).catch(() => {}));
    }
  });
  const apiProxy = async route => {
    const requestUrl = new URL(route.request().url());
    const request = route.request();
    try {
      const response = await route.fetch({ url: `${apiOrigin}${requestUrl.pathname}${requestUrl.search}` });
      const body = await response.body();
      await route.fulfill({ status: response.status(), headers: response.headers(), body });
    } catch (error) {
      const failure = request.failure()?.errorText ?? null;
      if (failure === 'net::ERR_ABORTED') {
        console.log(JSON.stringify({ phase: 'api-proxy-aborted-request', path: requestUrl.pathname, failure }));
        return;
      }
      console.error(JSON.stringify({ code: 'API_PROXY_FAILED', path: requestUrl.pathname, failure, message: error instanceof Error ? error.message : String(error) }));
      throw error;
    }
  };
  await page.route('**/api/v1/**', apiProxy);

  await page.goto(`${staticServer.origin}/?mode=live`);
  try {
    await page.getByLabel('Khóa chủ sở hữu').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const ownerKeyInput = document.querySelector('#owner-key');
      return ownerKeyInput instanceof HTMLInputElement && !ownerKeyInput.disabled;
    }, undefined, { timeout: 10000 });
  } catch (error) {
    const state = await page.locator('.live-api-status').innerText().catch(() => 'status unavailable');
    console.error(JSON.stringify({ code: 'LIVE_API_HEALTH_NOT_READY', healthStatuses: healthResponses, requests: localApiRequests, status: state }));
    throw error;
  }
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' }).waitFor();
  if (createSave) {
    await page.getByLabel('Tên lượt lưu mới').fill(slotName);
    const buttonSnapshot = await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).evaluate(button => {
      const rect = button.getBoundingClientRect();
      const center = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { disabled: 'disabled' in button ? button.disabled : null, text: button.textContent?.trim() ?? '', centerTag: center?.tagName ?? null, centerClass: center instanceof HTMLElement ? center.className : null };
    });
    console.log(JSON.stringify({ phase: 'create-save-click', buttonSnapshot }));
    try {
      await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click({ timeout: 45000 });
    } catch (error) {
      const status = await page.locator('.live-api-status, [role="status"], [role="alert"]').allInnerTexts().catch(() => []);
      console.error(JSON.stringify({ code: 'LIVE_SAVE_CREATE_FAILED', apiResponses, status }));
      throw error;
    }
  } else {
    await page.locator('.live-save-row').filter({ hasText: slotName }).click();
  }
  await page.locator('.live-footer').waitFor();
  if (createSave) {
    await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Bản đồ/ }).click();
    const campfire = page.getByTestId('map-campfire-marker');
    await campfire.waitFor();
    if (!(await campfire.getAttribute('class'))?.includes('is-selected')) throw new Error('LIVE_CAMPFIRE_NOT_SELECTED');
    await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
    await page.getByText(/revision 2/).first().waitFor();
    domainHashBeforeReload = canonicalStateHash(repository.loadSave('local-owner', saveId).state);
    writeFileSync(checkpointPath, JSON.stringify({ phase: 'before-reload', revision: repository.loadSave('local-owner', saveId).state.revision, domainStateSha256: domainHashBeforeReload }, null, 2));
    console.log(JSON.stringify({ phase: 'before-reload', revision: repository.loadSave('local-owner', saveId).state.revision, domainStateSha256: domainHashBeforeReload }));

    // Reconnect through the real LIVE client and open the persisted save in a clean page.
    await page.reload();
    await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey);
    await page.getByRole('button', { name: 'Kết nối API' }).click();
    await page.getByText('Đã khôi phục đúng lượt lưu từ API.').waitFor();
    await Promise.all(pendingBodies);
    domainHashAfterReloadBeforePan = canonicalStateHash(repository.loadSave('local-owner', saveId).state);
    writeFileSync(checkpointPath, JSON.stringify({ phase: 'after-reload', revision: repository.loadSave('local-owner', saveId).state.revision, domainStateSha256BeforeReload: domainHashBeforeReload, domainStateSha256AfterReload: domainHashAfterReloadBeforePan }, null, 2));
    console.log(JSON.stringify({ phase: 'after-reload', revision: repository.loadSave('local-owner', saveId).state.revision, domainStateSha256: domainHashAfterReloadBeforePan }));
    await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Lãnh địa/ }).click();
    await page.locator('.territory-stage').waitFor();
    await page.locator('.territory-stage [data-map-renderer]').waitFor();
    persistedView = await (await fetch(`${apiOrigin}/api/v1/saves/${encodeURIComponent(saveId)}/view`, {
      headers: { authorization: `Bearer ${accessToken}` },
    })).json().then(result => result.view);
  } else {
    await page.getByRole('navigation', { name: 'Màn hình game' }).getByRole('button', { name: /^Lãnh địa/ }).click();
    await page.locator('.territory-stage').waitFor();
    await page.locator('.territory-stage [data-map-renderer]').waitFor();
  }
  await page.waitForTimeout(1800);
  await Promise.all(pendingBodies);
  const svg = page.locator('.territory-scene-svg');
  const bounds = await svg.boundingBox();
  if (bounds) {
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 24, bounds.y + bounds.height / 2 + 12);
    await page.mouse.up();
  }
  const domainHashAfterRenderAndPan = canonicalStateHash(repository.loadSave('local-owner', saveId).state);
  const rendered = await page.evaluate(() => ({
    renderer: document.querySelector('.territory-stage [data-map-renderer]')?.getAttribute('data-map-renderer') ?? null,
    buildingIds: [...document.querySelectorAll('.territory-stage .territory-building')].map(node => node.getAttribute('data-building-id')),
    fixtureAttrs: [...document.querySelectorAll('.territory-stage [data-map-qa-fixture], .territory-stage [data-map-qa-fixture-count]')].length,
  }));
  captures.push({ quality, rendered, domainHashAfterRenderAndPan });
  await page.unrouteAll({ behavior: 'wait' });
  await context.close();
}

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP * ~NOTFOUND,EXCLUDE localhost,EXCLUDE 127.0.0.1'],
  });
  await captureRun('low', true);
  if (!saveId || !accessToken || !initialView || !persistedView) throw new Error('LIVE_SAVE_FLOW_INCOMPLETE');
  await captureRun('normal', false);

  const manifestPath = resolve(dist, 'assets/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const distFiles = walkFiles(dist).sort();
  const distEntries = distFiles.map(path => ({ path: relative(dist, path).replaceAll('\\', '/'), sha256: sha256(readFileSync(path)) }));
  const distFingerprint = sha256(distEntries.map(entry => `${entry.path}\0${entry.sha256}\n`).join(''));
  const sourceBuild = sourceBuildFingerprint();
  const apiSummary = {
    label: 'LOCAL persisted LIVE fixture',
    revisionBeforeReload: initialView.revision,
    revisionAfterReload: persistedView.revision,
    committedCommand: 'inspect_entity via the LiveApp visible map and authenticated HTTP API',
    worldVisibleEntities: persistedView.visibleMap.entities.map(entity => ({
      ref: `${entity.ref.type}:${entity.ref.id}`,
      positionAvailable: Boolean(entity.position),
      UIProjectionFallback: entity.position ? null : 'map view center (existing LiveApp behavior)',
    })),
    territoryBuildings: persistedView.territory.buildings.map(building => ({
      id: building.id, kind: building.kind, status: building.status,
      directPositionAvailable: Boolean(building.position), siteId: building.siteId ?? null,
      visibleSitePositionAvailable: Boolean(building.siteId && persistedView.visibleMap.entities.some(entity => entity.ref.type === 'site' && entity.ref.id === building.siteId && entity.position)),
      UIProjection: building.kind === 'survival_fire' ? 'anchored to API territory origin' : undefined,
    })),
    territoryBuildingCount: persistedView.territory.buildings.length,
    unknownMapEntitiesInjected: false,
    populationBlocker: { code: 'RESOURCE_LEDGER_STAGE_05', message: 'Harvest is unavailable until authoritative resource extraction is implemented; no material or building data was injected.' },
  };
  const transferSummary = captures.map(run => {
    const requests = transferLog.filter(item => item.quality === run.quality);
    const mapAssets = requests.filter(item => item.path.startsWith('assets/map/'));
    const manifests = requests.filter(item => item.path === 'assets/manifest.json');
    return {
      quality: run.quality,
      manifestTransfers: manifests.map(item => ({ path: item.path, bytes: item.bytes, gzipBytes: item.gzipBytes, encoding: item.encoding, sha256: item.sha256 })),
      manifestSha256: sha256(readFileSync(manifestPath)),
      mapAssetRequestCount: mapAssets.length,
      uniqueMapAssetFiles: new Set(mapAssets.map(item => item.path)).size,
      mapAssetWireBytes: mapAssets.reduce((sum, item) => sum + item.bytes, 0),
      mapAssets: mapAssets.map(item => ({ path: item.path, wireBytes: item.bytes, decodedBytes: item.decodedBytes, encoding: item.encoding, sha256: item.sha256 })),
      rendered: run.rendered,
      domainHashAfterRenderAndPan: run.domainHashAfterRenderAndPan,
    };
  });
  console.log(JSON.stringify({
    label: 'LOCAL persisted LIVE fixture; production dist served over gzip HTTP, loopback SQLite API, no production credentials or external requests',
    productionDist: { path: relative(repoRoot, dist), sha256: distFingerprint, fileCount: distEntries.length, indexHtmlSha256: sha256(readFileSync(resolve(dist, 'index.html'))), manifestSha256: sha256(readFileSync(manifestPath)), javascript: distEntries.filter(entry => entry.path.endsWith('.js')) },
    sourceContext: { ...sourceBuild, baseCommit: (await import('node:child_process')).execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim() },
    API: apiSummary,
    domainHash: {
      beforeReload: domainHashBeforeReload,
      afterReloadBeforePan: domainHashAfterReloadBeforePan,
      afterNormalRenderAndPan: captures.at(-1)?.domainHashAfterRenderAndPan,
      unchangedAcrossReload: Boolean(domainHashBeforeReload) && domainHashBeforeReload === domainHashAfterReloadBeforePan,
      unchangedThroughRenderAndPan: Boolean(domainHashAfterReloadBeforePan) && captures.every(run => run.domainHashAfterRenderAndPan === domainHashAfterReloadBeforePan),
    },
    sourceManifestSha256: sha256(readFileSync(manifestPath)),
    manifestAssetEntries: manifest.assets.length,
    qualityMeasurements: transferSummary,
    limitations: ['Fresh clean-save baseline only; no materials or buildings were injected, so this is not a populated-save gallery.', 'This measures the local browser and temporary SQLite API, not production or target hardware.'],
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
} finally {
  await cleanup();
}
