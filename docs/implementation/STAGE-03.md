# Stage 03 — SQLite persistence and local API

## Scope

This implementation covers the backend persistence and HTTP portions of Stage 03. The React frontend was left unchanged, including the separate `frontend/demo-ui-v0` branch. The existing seven-screen demo still uses its demo adapter; it does not yet call this API. The Stage 03 prompt's `HttpGameClient`, live UI configuration, screen hookup, and browser tests are deferred by the user's backend-only scope.

The service does not advance simulation time. Opening a view or polling events is read-only. It supports the opening knowledge commands for the known anchor, carried food bag, and sealed career card. The territory supply chest remains inaccessible: the source describes it as within the fire's 10 m reach, while its compiled coordinate is about 31.6 m from the fire and its access field requires contact. There is no authoritative movement rule in this stage to resolve that conflict.

## Runtime and local data

Use Node.js 24 or newer; the service uses the built-in `node:sqlite` module and has no package dependencies.

```sh
npm run owner:key:create
npm run db:migrate
npm run api:start
```

The owner key is written once to `.local/owner-key` with mode `0600`; the path is ignored by Git. The default database is `.local/ice-age-lord.sqlite`. The API binds only to `127.0.0.1:8081` and accepts loopback peers and loopback Host values. It does not accept a public bind override.

Configuration:

| Variable | Default | Purpose |
|---|---|---|
| `ILL_DB_PATH` | `.local/ice-age-lord.sqlite` | SQLite database file |
| `ILL_OWNER_KEY_PATH` | `.local/owner-key` | Local owner bootstrap key |
| `ILL_OWNER_KEY` | unset | Optional owner key supplied by the local process environment |
| `ILL_API_PORT` | `8081` | Loopback service port |
| `ILL_ALLOWED_ORIGIN` | `http://localhost:5173` | One explicit browser Origin allowed by the API |

The service uses SQLite foreign keys, `BEGIN IMMEDIATE` transactions, a 5 second busy timeout, WAL journaling, and `synchronous=FULL`. It serializes commands per save in-process; SQLite's writer lock and expected-revision check protect writes from other local processes. WAL files are part of the live database and should not be copied independently while the service is running.

## Storage and recovery

The checked-in migration is `packages/storage/src/migrations/001_stage03.sql`. It creates owner and named-save records, creation request keys, command receipts, domain events, and checkpoints. Unique constraints enforce `(owner_id, slot_name)`, `(owner_id, creation_key)`, `(save_id, command_id)`, and event/checkpoint identities. The save row holds a versioned aggregate JSON snapshot plus a canonical SHA-256 checksum and indexed revision/content references. Foreign keys link receipts, events, and checkpoints to their save; each event also references its causal command receipt. SQLite triggers reject event update and delete statements.

The aggregate snapshot is the sole recovery authority. On load, the repository verifies its checksum and indexed metadata, then reattaches the normalized receipt ledger. Domain events are append-only audit and player-update records; startup does not replay them. This avoids applying an event on top of a snapshot that already contains its effect. A command response is sent only after its receipt, event(s), and changed snapshot commit in one transaction. Rejected or already-observed command outcomes can persist a receipt without changing the save revision.

Every accepted state-changing command increments the revision and event sequence together. Events carry a stable per-save ID, simulation elapsed timestamp, causal command ID, payload schema version, and pinned rules/content versions. Client command IDs are idempotent by canonical validated request hash: identical retries return their original receipt before stale-revision evaluation; a changed request under the same ID returns `COMMAND_ID_REUSED`. A distinct stale command returns `STALE_REVISION` with the current revision.

Checkpoints include full deterministic state, revision, event sequence, and checksum. Restore creates a new save with `forkedFrom` metadata and the checkpoint's state as the fork's initial snapshot; the fork starts its own revision/event sequence at zero and has an empty event ledger. The original save and history remain intact.

## HTTP API

All routes are under `/api/v1`. JSON errors use this shape:

```json
{
  "error": {
    "code": "STALE_REVISION",
    "message": "...",
    "displayText": "...",
    "currentRevision": 3,
    "retryable": true
  }
}
```

The display text is Vietnamese. There are no cookies: bootstrap an in-memory one-hour bearer session with `POST /sessions` and the local owner key, then send `Authorization: Bearer <accessToken>`. A session must select a save through `POST /saves/:id/session` before using save-scoped routes. Save IDs do not authenticate a caller. Requests with an `Origin` must match `ILL_ALLOWED_ORIGIN`; no wildcard CORS is sent. Requests without an Origin, such as local command-line requests, still require loopback Host and peer checks, and protected routes still require a bearer session.

| Method and path | Behavior |
|---|---|
| `GET /health` | Readiness and API/content versions; no private save data |
| `POST /sessions` | `{ "ownerKey": "..." }` → bearer token and expiry |
| `GET /saves` | Authorized save summaries |
| `POST /saves` | `{ "creationKey": "...", "slotName": "..." }`; retries are idempotent |
| `POST /saves/:id/session` | Select an owned save for this session |
| `GET /saves/:id/view` | `PlayerView` with save-and-revision ETag; matching `If-None-Match` returns 304 |
| `GET /saves/:id/events?afterSequence=N&limit=N` | Paged player-safe event projections only |
| `POST /saves/:id/commands/preview` | Side-effect-free availability result |
| `POST /saves/:id/commands` | Validated command; atomic receipt/state/event commit |
| `GET /saves/:id/commands/:commandId` | Stored receipt and current revision |
| `GET /saves/:id/checkpoints` | Checkpoint summaries |
| `POST /saves/:id/checkpoints` | `{ "label": "..." }` |
| `POST /saves/:id/checkpoints/:checkpointId/restore` | `{ "slotName": "..." }`; creates and selects a fork |
| `GET /saves/:id/backup` | Explicit owner-session full-save export |
| `POST /backups` | `{ "slotName": "...", "backup": { ... } }`; validates and imports as a new save |

Normal JSON request bodies are limited to 1 MiB; backup imports are limited to 10 MiB. Backup exports above 10 MiB or the record-count bounds are rejected. The import validates schema, source/content/rules versions, checksums, state bounds, receipt/event relationships, event IDs, and checkpoint state before its transaction starts. It never overwrites a save. Import assigns a fresh save ID and remaps event/checkpoint IDs; a failed or incompatible import leaves the existing saves untouched. A checksum detects accidental corruption but is not an authenticity signature.

The journal API returns only the fixed player-safe event projection. Raw payloads and full backups are not part of `PlayerView` or event polling. Full-save exports are available only through the explicit owner-only backup route or local CLI.

## Backup commands

```sh
npm run backup:export -- <saveId> [outputPath]
npm run backup:import -- <inputPath> <slotName>
```

Exports are new JSON files with restrictive file permissions. If no output path is given, the export is placed under a database-adjacent `.backups` directory. Import uses the same validation and creates a new save identity.

## Verification

Run the backend regression checks with:

```sh
npm run test:stage02
npm run test:stage03
```

Stage 03 checks exercise local HTTP authentication and Origin handling, create/list/select, ETags, idempotent creation and commands, stale concurrent writes, safe event polling, bag/card inspection and reload, checkpoint fork, backup validation/import isolation, request size limits, and process termination immediately before and after a SQLite commit against temporary databases. No frontend build, browser test, or live UI journey was run because frontend implementation is outside the requested scope.

The workspace has no TypeScript compiler or linter installed. Runtime tests use Node 24's `--experimental-strip-types`; the Stage 02 contract tests and Stage 03 service tests both passed.
