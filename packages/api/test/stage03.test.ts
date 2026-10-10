import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createApiServer } from '../src/server.ts';
import { GameApplicationService } from '../src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const ownerKey = 'stage03-test-owner-key-0123456789abcdef';

type Fixture = Awaited<ReturnType<typeof makeFixture>>;

async function makeFixture(): Promise<{
  directory: string;
  databasePath: string;
  repository: SqliteRepository;
  service: GameApplicationService;
  endpoint: string;
  close: () => Promise<void>;
}> {
  const directory = mkdtempSync(resolve(tmpdir(), 'ill-stage03-'));
  const databasePath = resolve(directory, 'saves.sqlite');
  const repository = new SqliteRepository(databasePath);
  const service = new GameApplicationService(repository);
  const { server } = createApiServer(service, { ownerKey });
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_ADDRESS_INVALID');
  return {
    directory,
    databasePath,
    repository,
    service,
    endpoint: `http://127.0.0.1:${address.port}/api/v1`,
    close: async () => {
      await new Promise<void>(resolveClose => server.close(() => resolveClose()));
      repository.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function jsonRequest(fixture: Fixture, path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${fixture.endpoint}${path}`, options);
}

async function parse<T>(response: Response): Promise<T> { return await response.json() as T; }

async function authenticate(fixture: Fixture): Promise<string> {
  const response = await jsonRequest(fixture, '/sessions', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ownerKey }),
  });
  assert.equal(response.status, 201);
  const body = await parse<{ accessToken: string }>(response);
  return body.accessToken;
}

function auth(token: string): HeadersInit { return { authorization: `Bearer ${token}` }; }

async function createSave(fixture: Fixture, token: string, slotName = 'Main') {
  const response = await jsonRequest(fixture, '/saves', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ creationKey: `create-${slotName}`, slotName }),
  });
  assert.equal(response.status, 201);
  return await parse<{ created: boolean; save: { saveId: string; revision: number } }>(response);
}

async function selectSave(fixture: Fixture, token: string, saveId: string): Promise<void> {
  const response = await jsonRequest(fixture, `/saves/${saveId}/session`, { method: 'POST', headers: auth(token) });
  assert.equal(response.status, 200);
}

test('HTTP persistence, owner boundary, idempotency, player-safe polling, fork and backup import', async t => {
  const fixture = await makeFixture();
  t.after(fixture.close);
  assert.throws(() => createApiServer(fixture.service, { ownerKey, allowedOrigin: '*' }), /loopback HTTP\(S\) origin/);

  const health = await jsonRequest(fixture, '/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await parse(health), { status: 'ready', apiVersion: 1, contentVersion: (await import('../../content/src/index.ts')).ACTIVE_WORLD_PACKAGE.contentVersion, storage: 'sqlite' });
  assert.equal((await jsonRequest(fixture, '/saves')).status, 401);
  const wrongOwner = await jsonRequest(fixture, '/sessions', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ownerKey: 'wrong-owner-key-0123456789abcdef' }),
  });
  assert.equal(wrongOwner.status, 401);
  const token = await authenticate(fixture);
  const blockedOrigin = await jsonRequest(fixture, '/saves', { headers: { ...auth(token), origin: 'http://attacker.invalid' } });
  assert.equal(blockedOrigin.status, 403);
  const oversizedBody = JSON.stringify({ pad: 'x'.repeat(1024 * 1024) });
  const oversized = await jsonRequest(fixture, '/saves', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: oversizedBody,
  });
  assert.equal(oversized.status, 413);

  const created = await createSave(fixture, token);
  const duplicateCreation = await jsonRequest(fixture, '/saves', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ creationKey: 'create-Main', slotName: 'Main' }),
  });
  assert.equal(duplicateCreation.status, 200);
  const duplicateBody = await parse<{ created: boolean; save: { saveId: string } }>(duplicateCreation);
  assert.equal(duplicateBody.created, false);
  assert.equal(duplicateBody.save.saveId, created.save.saveId);
  const reusedCreationKey = await jsonRequest(fixture, '/saves', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ creationKey: 'create-Main', slotName: 'Other' }),
  });
  assert.equal(reusedCreationKey.status, 409);
  assert.equal((await parse<{ error: { code: string } }>(reusedCreationKey)).error.code, 'IDEMPOTENCY_KEY_REUSED');

  const selectedSaveId = created.save.saveId;
  await selectSave(fixture, token, selectedSaveId);
  const viewResponse = await jsonRequest(fixture, `/saves/${selectedSaveId}/view`, { headers: auth(token) });
  assert.equal(viewResponse.status, 200);
  assert.equal(viewResponse.headers.get('etag'), `"${created.save.saveId}:r1"`);
  const initial = await parse<{ view: { revision: number; careerCard: { observed: boolean; career: unknown }; inventory: { containers: unknown[]; inspectableContainers: Array<{ containerId: string }> } } }>(viewResponse);
  assert.equal(initial.view.revision, 1);
  assert.equal(initial.view.careerCard.observed, false);
  assert.equal(initial.view.careerCard.career, null);
  assert.deepEqual(initial.view.inventory.containers, []);
  assert.deepEqual(initial.view.inventory.inspectableContainers.map(container => container.containerId), ['LL-CNT-CARRIED-FOOD-BAG-01']);
  assert.ok(!JSON.stringify(initial.view).includes('JOB-SUM-NECRO-01'));
  assert.equal((await jsonRequest(fixture, `/saves/${selectedSaveId}/view`, { headers: { ...auth(token), 'if-none-match': `"${selectedSaveId}:r1"` } })).status, 304);

  const bagCommand = {
    schemaVersion: 1, saveId: selectedSaveId, commandId: 'inspect-bag-01', expectedRevision: 1,
    type: 'inspect_starter_container', payload: { containerId: 'LL-CNT-CARRIED-FOOD-BAG-01' },
  };
  const bagResponse = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify(bagCommand),
  });
  assert.equal(bagResponse.status, 200);
  const bagResult = await parse<{ receipt: { accepted: boolean; revision: number; eventSequence: number }; revision: number; view: { inventory: { containers: Array<{ id: string; items: Array<{ quantity: number }> }> } } }>(bagResponse);
  assert.equal(bagResult.receipt.accepted, true);
  assert.equal(bagResult.revision, 2);
  assert.equal(bagResult.receipt.eventSequence, 2);
  assert.equal(bagResult.view.inventory.containers[0].id, 'LL-CNT-CARRIED-FOOD-BAG-01');

  const retry = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify(bagCommand),
  });
  assert.equal(retry.status, 200);
  assert.deepEqual((await parse<{ receipt: unknown }>(retry)).receipt, bagResult.receipt);
  const reusedId = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ ...bagCommand, payload: { containerId: 'LL-CNT-SUPPLY-01' } }),
  });
  assert.equal(reusedId.status, 409);
  assert.equal((await parse<{ error: { code: string } }>(reusedId)).error.code, 'COMMAND_ID_REUSED');

  const stale = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ schemaVersion: 1, saveId: selectedSaveId, commandId: 'inspect-card-stale', expectedRevision: 0, type: 'inspect_career_card', payload: {} }),
  });
  assert.equal(stale.status, 409);
  const staleProblem = await parse<{ error: { code: string; currentRevision: number } }>(stale);
  assert.equal(staleProblem.error.code, 'STALE_REVISION');
  assert.equal(staleProblem.error.currentRevision, 2);

  const cardCommand = { schemaVersion: 1, saveId: selectedSaveId, commandId: 'inspect-card-01', expectedRevision: 2, type: 'inspect_career_card', payload: {} };
  const card = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify(cardCommand),
  });
  assert.equal(card.status, 200);
  const cardResult = await parse<{ revision: number; view: { careerCard: { observed: boolean; career: { id: string } | null } } }>(card);
  assert.equal(cardResult.revision, 3);
  assert.equal(cardResult.view.careerCard.observed, true);
  assert.equal(cardResult.view.careerCard.career?.id, 'JOB-SUM-NECRO-01');
  const reloadedView = await jsonRequest(fixture, `/saves/${selectedSaveId}/view`, { headers: auth(token) });
  const reloaded = await parse<{ view: { revision: number; careerCard: { observed: boolean }; inventory: { containers: Array<{ id: string }> } } }>(reloadedView);
  assert.equal(reloaded.view.revision, 3);
  assert.equal(reloaded.view.careerCard.observed, true);
  assert.equal(reloaded.view.inventory.containers[0].id, 'LL-CNT-CARRIED-FOOD-BAG-01');
  const inaccessibleSupply = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ schemaVersion: 1, saveId: selectedSaveId, commandId: 'inspect-supply-01', expectedRevision: 3, type: 'inspect_starter_container', payload: { containerId: 'LL-CNT-SUPPLY-01' } }),
  });
  assert.equal(inaccessibleSupply.status, 404);
  assert.equal((await parse<{ error: { code: string } }>(inaccessibleSupply)).error.code, 'NOT_ACCESSIBLE');

  const receiptLookup = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands/inspect-bag-01`, { headers: auth(token) });
  assert.equal(receiptLookup.status, 200);
  const receiptBody = await parse<Record<string, unknown>>(receiptLookup);
  assert.ok('receipt' in receiptBody);
  assert.ok(!('requestSha256' in receiptBody));
  const events = await jsonRequest(fixture, `/saves/${selectedSaveId}/events?afterSequence=0&limit=1`, { headers: auth(token) });
  const eventPage = await parse<{ events: Array<Record<string, unknown>>; afterSequence: number; nextSequence: number; hasMore: boolean }>(events);
  assert.equal(eventPage.events.length, 1);
  assert.equal(eventPage.nextSequence, 1);
  assert.equal(eventPage.hasMore, true);
  assert.ok(!('payload' in eventPage.events[0]));
  assert.ok(!JSON.stringify(eventPage).includes('JOB-SUM-NECRO-01'));

  const checkpointResponse = await jsonRequest(fixture, `/saves/${selectedSaveId}/checkpoints`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify({ label: 'After opening inspection' }),
  });
  assert.equal(checkpointResponse.status, 201);
  const checkpoint = (await parse<{ checkpoint: { checkpointId: string; revision: number; stateSha256: string } }>(checkpointResponse)).checkpoint;
  assert.equal(checkpoint.revision, 3);
  assert.match(checkpoint.stateSha256, /^[a-f0-9]{64}$/);
  const listCheckpoint = await jsonRequest(fixture, `/saves/${selectedSaveId}/checkpoints`, { headers: auth(token) });
  assert.equal((await parse<{ checkpoints: unknown[] }>(listCheckpoint)).checkpoints.length, 1);

  const knownEntity = await jsonRequest(fixture, `/saves/${selectedSaveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ schemaVersion: 1, saveId: selectedSaveId, commandId: 'inspect-known-site', expectedRevision: 3, type: 'inspect_entity', payload: { entity: { type: 'site', id: 'SITE-LL01-000' } } }),
  });
  assert.equal(knownEntity.status, 200);
  const restore = await jsonRequest(fixture, `/saves/${selectedSaveId}/checkpoints/${checkpoint.checkpointId}/restore`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify({ slotName: 'Fork' }),
  });
  assert.equal(restore.status, 201);
  const fork = await parse<{ save: { saveId: string; revision: number; lastEventSequence: number; forkedFrom: { saveId: string; checkpointId: string } | null }; view: { careerCard: { observed: boolean }; inventory: { containers: unknown[] } } }>(restore);
  assert.notEqual(fork.save.saveId, selectedSaveId);
  assert.deepEqual(fork.save.forkedFrom, { saveId: selectedSaveId, checkpointId: checkpoint.checkpointId });
  assert.equal(fork.save.revision, 0);
  assert.equal(fork.save.lastEventSequence, 0);
  assert.equal(fork.view.careerCard.observed, true);
  assert.equal(fork.view.inventory.containers.length, 1);
  const forkEvents = await jsonRequest(fixture, `/saves/${fork.save.saveId}/events`, { headers: auth(token) });
  assert.equal((await parse<{ events: unknown[] }>(forkEvents)).events.length, 0);

  await selectSave(fixture, token, selectedSaveId);
  const backupResponse = await jsonRequest(fixture, `/saves/${selectedSaveId}/backup`, { headers: auth(token) });
  assert.equal(backupResponse.status, 200);
  const backup = await parse<Record<string, unknown>>(backupResponse);
  const importResponse = await jsonRequest(fixture, '/backups', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ slotName: 'Imported', backup }),
  });
  assert.equal(importResponse.status, 201);
  const imported = await parse<{ save: { saveId: string; revision: number }; view: { careerCard: { observed: boolean }; inventory: { containers: unknown[] } } }>(importResponse);
  assert.notEqual(imported.save.saveId, selectedSaveId);
  assert.equal(imported.save.revision, 4);
  assert.equal(imported.view.careerCard.observed, true);
  assert.equal(imported.view.inventory.containers.length, 1);
  const importedEventsResponse = await jsonRequest(fixture, `/saves/${imported.save.saveId}/events`, { headers: auth(token) });
  const importedEvents = await parse<{ events: Array<{ eventId: string; sequence: number }> }>(importedEventsResponse);
  assert.equal(importedEvents.events.length, 4);
  assert.ok(importedEvents.events.every(event => event.eventId.startsWith(`${imported.save.saveId}:event:`)));

  const listBeforeInvalidImport = await jsonRequest(fixture, '/saves', { headers: auth(token) });
  const savesBefore = (await parse<{ saves: unknown[] }>(listBeforeInvalidImport)).saves.length;
  const invalidBackup = structuredClone(backup);
  (invalidBackup as { stateSha256: string }).stateSha256 = 'f'.repeat(64);
  const invalidImport = await jsonRequest(fixture, '/backups', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ slotName: 'MustNotExist', backup: invalidBackup }),
  });
  assert.equal(invalidImport.status, 400);
  assert.equal((await jsonRequest(fixture, '/saves', { headers: auth(token) }).then(response => parse<{ saves: unknown[] }>(response))).saves.length, savesBefore);
  const wrongContent = structuredClone(backup);
  (wrongContent as { state: { contentSourceSetSha256: string } }).state.contentSourceSetSha256 = 'f'.repeat(64);
  const wrongContentImport = await jsonRequest(fixture, '/backups', {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ slotName: 'WrongContent', backup: wrongContent }),
  });
  assert.equal(wrongContentImport.status, 400);
  assert.equal((await jsonRequest(fixture, '/saves', { headers: auth(token) }).then(response => parse<{ saves: unknown[] }>(response))).saves.length, savesBefore);

  const second = await createSave(fixture, token, 'Second');
  const crossSave = await jsonRequest(fixture, `/saves/${selectedSaveId}/view`, { headers: auth(token) });
  assert.equal(crossSave.status, 403);
  assert.equal(second.save.revision, 1);
  await selectSave(fixture, token, second.save.saveId);
  const secondView = await jsonRequest(fixture, `/saves/${second.save.saveId}/view`, { headers: auth(token) });
  assert.equal(secondView.headers.get('etag'), `"${second.save.saveId}:r1"`);
  await selectSave(fixture, token, selectedSaveId);
  const firstView = await jsonRequest(fixture, `/saves/${selectedSaveId}/view`, { headers: auth(token) });
  assert.equal(firstView.headers.get('etag'), `"${selectedSaveId}:r4"`);
});

test('concurrent distinct commands with one expected revision cannot both commit', async t => {
  const fixture = await makeFixture();
  t.after(fixture.close);
  const token = await authenticate(fixture);
  const { save } = await createSave(fixture, token);
  await selectSave(fixture, token, save.saveId);
  const commands = [
    { schemaVersion: 1, saveId: save.saveId, commandId: 'parallel-card', expectedRevision: 1, type: 'inspect_career_card', payload: {} },
    { schemaVersion: 1, saveId: save.saveId, commandId: 'parallel-site', expectedRevision: 1, type: 'inspect_entity', payload: { entity: { type: 'site', id: 'SITE-LL01-000' } } },
  ];
  const responses = await Promise.all(commands.map(command => jsonRequest(fixture, `/saves/${save.saveId}/commands`, {
    method: 'POST', headers: { ...auth(token), 'content-type': 'application/json' }, body: JSON.stringify(command),
  })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const view = await jsonRequest(fixture, `/saves/${save.saveId}/view`, { headers: auth(token) });
  assert.equal(view.headers.get('etag'), `"${save.saveId}:r2"`);
  const events = await jsonRequest(fixture, `/saves/${save.saveId}/events`, { headers: auth(token) });
  assert.equal((await parse<{ events: unknown[] }>(events)).events.length, 2);
});

test('process death around commit recovers either the complete old or complete new transaction', t => {
  for (const phase of ['before_commit', 'after_commit'] as const) {
    const directory = mkdtempSync(resolve(tmpdir(), `ill-stage03-crash-${phase}-`));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const databasePath = resolve(directory, 'crash.sqlite');
    const repository = new SqliteRepository(databasePath);
    const service = new GameApplicationService(repository);
    const created = service.createSave({ creationKey: `crash-${phase}`, slotName: 'Crash' });
    const saveId = created.save.saveId;
    repository.close();

    const worker = spawnSync(process.execPath, [
      '--experimental-strip-types', resolve(testDirectory, 'crash-worker.ts'), databasePath, saveId, phase,
    ], { cwd: resolve(testDirectory, '../../..'), encoding: 'utf8' });
    assert.equal(worker.signal, 'SIGKILL', `worker should die at ${phase}: ${worker.stderr}`);

    const recovered = new SqliteRepository(databasePath);
    try {
      const loaded = recovered.loadSave('local-owner', saveId);
      const events = recovered.getPlayerEvents('local-owner', saveId, 0, 20);
      if (phase === 'before_commit') {
        assert.equal(loaded.state.revision, 1);
        assert.equal(loaded.state.receipts.length, 1);
        assert.equal(events.events.length, 1);
      } else {
        assert.equal(loaded.state.revision, 2);
        assert.equal(loaded.state.receipts.length, 2);
        assert.equal(events.events.length, 2);
      }
    } finally { recovered.close(); }
  }
});
