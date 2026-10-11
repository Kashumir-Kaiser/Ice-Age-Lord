# Stage 09 — integration and local release readiness

## Result

Stage 09 integration work is implemented and the backend regression gates pass. The release is **blocked**: the runtime does not materialize the source-required opening fire ledger or hourly weather seed, and the browser/build/visual gates could not run in this offline workspace because the pinned frontend dependencies are unavailable. The source defines the opening fire profile and says these world values are seeded but hidden; the active runtime does not load those seeds. No debug grants were added. No merge, push, hosting, or deployment was performed.

The attached Stage 09 prompt was used as implementation guidance. Its local implementation/test/commit scope was followed; its stop-before-push/deployment boundary remains in force.

## Source and runtime pin

| Field | Value |
|---|---|
| Branch | `work` |
| Audited pre-Stage-09 commit | `b076a0781cf4845f5326dcae254e1339ad34cafd` |
| Content source main commit | `32f34d8b5bb85671ec6301a30f045e30c0f8f161` |
| Content version | `LL01-CONTENT-0.3.0` |
| Ruleset version | `LL01-RULESET-0.3.0` |
| Save schema | `7` |
| Event timeline | `LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1` (30 rows) |
| Event catalog/items | extraction/catalog `4.6`; items CSV `4.6` |
| Structure catalog | `LL01-ICE-AGE-LORD-SOURCE-STRUCTURES-1.0` (evidence only) |
| Runtime | Node.js `24.19.0`; npm `11.9.0`; lockfile version `3` |
| Frontend package versions in lock | React `18.3.1`, Vite `6.0.5`, TypeScript `5.7.3`, Playwright `1.55.0` |

The checked-out source set retains Rounds 47–77. `README.md` is a mutable research index and no longer participates in the runtime source hash; the canonical authorities, versioned design, clean-start contract, timeline, and source catalogs remain locked. Stage 02 still verifies that changing a canonical authority fails closed. The compiler and generated world were refreshed from the selected source release. No canonical source, research extraction, event catalog, or prior save was edited or copied into a fresh game.

## Live screen/action binding matrix

All seven production screens are routed through [LiveApp.tsx](../../frontend/src/LiveApp.tsx) and the seven-entry registry in [screens.ts](../../frontend/src/live/screens.ts). They render the server `PlayerView`; the live dependency graph has no imports from `canonicalGeography`, `worldFeatures`, `demoData`, or a private content bundle. Demo/gallery remains a separate mode.

| Screen | Authoritative view | Bound interactions and evidence |
|---|---|---|
| Overview | player, world clock, survival, fire, known events/resources, construction snapshot | Clock controls use validated server commands; notification links only change screen/selection. Stage 04 and 08 verify clock/event settlement. Stage 09 verifies exact T0, paused state, and opening blockers. |
| Territory | known H0 buildings, fire, storage, residents, Tomb, jobs, resource state | Fire inspection/extinguish/refuel, container transfer, work assignment/cancel, recruitment, heater operation, and Tomb queue route to API/domain handlers. Unknown opening fuel is disabled and has a precise preview reason. Stages 04–06 and 09 cover relevant transitions. |
| Map | `visibleMap`, sight/exploration memory, known sites/resources/corpses, player/unit positions, active orders | Camera/zoom are local presentation state. Selection, preview, move, inspect, search, harvest, chest, corpse and combat actions use the selected save’s server view and commands. Stage 05/07/09 cover movement, harvest and discovery. |
| Inventory | observed owned containers, item instances, reservations, provenance, currency, offers and auction escrow | Inspect, transfer, equip/unequip, consume, split/merge, purchase and bid/cancel use API commands. Stage 06/08/09 verify actual quantity and item-identity conservation. |
| Forces | projected owned units, corpse sheets, provenance, stats, skills, XP and combat state | Inspect, revive/butcher, equip, move, attack and retreat are command-backed. Stage 07 verifies the complete Rook/combat path; Stage 09 verifies Rook appears only after inspection/revival. |
| Buildings | actual buildings, fixed blueprints, repair/build jobs, resident ledger, heater service and Tomb | Preview then commit repair/build; assign/pause/cancel workers; operate heater; recruit; queue/cancel Tomb jobs. Stage 06 verifies reservations, work, completion and reload; Stage 04 verifies Tomb output. |
| Journal | player-safe projected event pages, known calendar and Q08 state | Filters operate over the received player-safe page. Event/quest actions use server commands; only eligible Q08 reward can be claimed. Stage 03/08 cover safe event paging, claim receipts, and persistence. |

The camera overview control does not advance world state or change server revision. The new release E2E checks that relationship and verifies each screen against one save revision. The screens share one view model rather than maintaining local inventory, ownership, or time counters.

## Opening journey and recovery evidence

`npm run test:stage09` runs three named, API/domain-backed scenarios:

1. Creates an actual clean API save at schema 7, revision 1, paused at Day 1 07:00. It asserts zero living units, a damaged Lord House, no prior progression, undiscovered supply, sealed career, unidentified Rook, active EV00 protection, and the runtime's current fail-closed fuel/weather seed states. Inspecting the carried bag reveals the pre-seeded instances without rerolling. Inspecting and activating the career remain separate. Inspecting and reviving Rook creates the one source-eligible direct-revival unit.
2. Uses the real server clock driver and move command to reach the supply chest; only physical arrival makes it inspectable. It transfers one actual axe instance, moves to starter wood, completes a real one-unit harvest and verifies balance/cargo conservation. The current runtime still blocks refueling because it has not materialized the source-referenced starter fuel ledger. The SQLite restart policy pauses time and retains position, knowledge, cargo, harvest history, and the fail-closed state.
3. Adds one named private sentinel only to a test world. Its name, ID, and coordinates are absent from the opening projection, and an unknown-ID inspection does not reveal its name. A real movement command followed by deterministic time settlement discovers it, after which the same name becomes visible.

Stages 03–08 continue to cover the related durability boundaries: command idempotency and changed-payload rejection, stale-revision concurrency, transaction failure around commit, save checksums, schema/content validation, checkpoint forks, backup import, movement/job/inventory reload, exact event boundaries, Rook XP mirror, Tomb non-mirroring, construction, Q08 claims and auction escrow. The Stage 09 E2E adds real-browser screen navigation, four viewport overflow assertions/screenshots, and the delayed-save-A response regression; it is defined but was not run locally.

The start-of-game report tests never mutate the public API aggregate to fake supplies or output. Test-only sentinel content is explicitly named and isolated from the active compiled world.

## Remaining unsupported source contracts

### Opening and release blockers

| ID | Effect on the opening/release |
|---|---|
| `INITIAL_FUEL_AMOUNT_NOT_SPECIFIED` (current runtime blocker ID) | Canonical File 06 specifies Fire Level 1, 10 m radius, +5–20°C, and 1 WOOD/15 min; its T0 `fuel_remaining` field is `STATE_UNOBSERVED_SEE_STARTER_LEDGER`. That means the balance is hidden seeded state, not an absent fuel rule. The referenced numeric ledger entry is not present in the active compiled package or loaded by the initializer, so the current clock cannot settle exact consumption and refuel/light remain blocked. |
| `OPENING_WEATHER_RECORD_NOT_SEEDED` (current runtime blocker ID) | File 03 §28.1 says hourly weather values are campaign-seeded from climate/season/front, and File 06 says nearby weather is seeded before opening. The active compiled world and initializer contain no T0 hourly weather record, so ColdLoad stays unresolved. This is a missing runtime seed materialization, not a source rule saying weather is absent. |
| `EV01-OPENING-LEVEL` / `P0_FIXED_CONTENDER_RUNTIME_NOT_COMPILED` | The calendar and fixed ranking window are present. The runtime lacks the committed outcome/eligibility ledger for the fixed P0 roster, so its +144 h settlement writes a blocked empty snapshot and awards nothing. |
| `EV02-DRAGON-REVIVAL` | The calendar row and boundaries are present, but its mandatory event mechanics are not compiled as executable content. At +144 h the runtime halts progression at EV02's opening boundary; it does not claim EV02 or later rewards occurred. |

Because the runtime omits the required opening seed state and the browser/build gates are unverified, the game is **not certified as a playable source-grounded opening**.

### Other uncompiled content

- `EV03-ICE-HORN` through `EV29-FINAL-CALAMITY` remain mandatory but unsupported calendar content after the EV02 stop. Their fixed dates remain in the coverage report; they do not produce speculative outcomes.
- Research candidates `SX-0001` onward in the generated Stage 08 coverage report remain inactive unless a full acquisition/price/currency/limit/expiry/effect contract is promoted and tested. The 590 source entries, 239 effects, 202 observations, 13 mechanic extractions, 25 conflicts, and 20 source structures are evidence—not runtime grants.
- Unsupported source mechanics include `CHEST_LOOT_CANDIDATE_POOL_NOT_COMPILED`, `PROSPECTING_CONTRACT_NOT_COMPILED`, `WATER_PREPARATION_CONTRACT_NOT_COMPILED`, and source-gated workforce/fuel resource access. Non-heater production recipes and the D1 charcoal recipe remain unavailable; no source recipe ID or inputs are invented.
- Upgrade edges, general unit anatomy/equipment profiles, daily resident upkeep quantities, fixed P0 event outcomes, variable-price trade quotes, unadopted item expiry, auction seller acceptance/liquidity, and general non-opening wildlife/lair combat remain outside the implemented runtime contracts. See [Stage 06](STAGE-06.md), [Stage 07](STAGE-07.md), [Stage 08](STAGE-08.md), and the generated [coverage matrix](STAGE-08-CONTENT-COVERAGE.md) for precise evidence and states.

## CI and local operation

The workflow [frontend-demo.yml](../../.github/workflows/frontend-demo.yml) now runs Stage 02–09 on `main`, `work`, `frontend/**`, and `codex/**` pushes and on matching pull requests. Its paths include the live client, shared packages, canonical/current design sources, v4.6 catalogs, v0.6 timeline, source structures, fresh-start contract, docs and assets. It retains manual dispatch and no scheduled trigger; a nightly job would not run until an authorized default-branch change.

After installing the pinned frontend lockfile with Node 24 or newer, one local command starts migrations, the loopback API, and the live Vite client:

```sh
npm ci --prefix frontend --no-audit --no-fund
npm run local:start
```

The runner creates `.local/owner-key` only when needed, migrates `.local/ice-age-lord.sqlite`, binds API to `127.0.0.1:8081` and Vite to `127.0.0.1:5173`, and shuts down both child processes on Ctrl-C. Enter the key from `.local/owner-key` in the browser. `.local/`, SQLite/WAL files, `frontend/node_modules`, and frontend build output are gitignored.

For a local production-build preview, install the same lockfile, then:

```sh
npm run content:compile
npm run db:migrate
# Once per local data directory, if no owner key exists:
npm run owner:key:create
VITE_GAME_MODE=live npm --prefix frontend run build
ILL_ALLOWED_ORIGIN=http://localhost:4173 npm run api:start
```

In a second terminal, run `npm --prefix frontend run preview -- --host 127.0.0.1 --port 4173`. The Vite preview proxies `/api/v1` to the loopback API. This is a local production-bundle check, not a public deployment procedure; the API has no public bind mode.

Runtime variables are `ILL_DB_PATH`, `ILL_OWNER_KEY_PATH`, `ILL_OWNER_KEY`, `ILL_API_PORT` (default 8081), and `ILL_ALLOWED_ORIGIN` (default `http://localhost:5173`). Dev Vite is `http://localhost:5173`; production preview is `http://localhost:4173`. Fresh saves are created in the Live save picker. Reconnect, select the existing save, then continue; the API pauses simulation on service restart and does not count offline time. Export/import owner-only backups with `npm run backup:export -- <saveId> [outputPath]` and `npm run backup:import -- <inputPath> <slotName>`. Checkpoint restore creates a fork; it does not overwrite the original.

## Validation record

| Check | Result |
|---|---|
| `npm run content:compile` | Passed: 38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 scheduled events. |
| `npm run content:coverage:stage08` | Passed: regenerated and verified all 590 entries and associated source records. |
| `npm run test:stage02` | Passed 9/9. |
| `npm run test:stage03` | Passed 3/3, with temporary permission for the test’s local-only HTTP listener. |
| `npm run test:stage04` | Passed 11/11. |
| `npm run test:stage05` | Passed 12/12. |
| `npm run test:stage06` | Passed 12/12. |
| `npm run test:stage07` | Passed 1/1 Node test file. |
| `npm run test:stage08` | Passed 6/6. |
| `npm run test:stage09` | Passed 3/3. |
| `node --experimental-strip-types frontend/tests/contract.test.mjs` | Passed 5/5 dependency-free live-screen, save-scope, workflow-trigger, and lockfile contract checks. |
| `npm test` in `frontend/` | 2 of 9 test files passed; 7 could not load because pinned `typescript` is absent. The dependency-free Stage 09 contract suite passed separately. |
| Frontend `npm ci --offline --no-audit --no-fund` | Blocked: cache misses pinned `yallist@3.1.1` (`ENOTCACHED`). |
| Frontend `npm ci --no-audit --no-fund` with temporary network access | No package progress after more than four minutes; interrupted. No frontend dependencies were installed and the lockfile was unchanged. |
| `npm run build` in `frontend/` | Asset sync passed (101 structure, 37 item, and 12 unit assets); build stopped at `tsc: not found`. |
| `npm run test:e2e` in `frontend/` | Not runnable: `@playwright/test` is absent. The host's unrelated Python Playwright CLI resolved and rejected the Node `test` command. |
| Stage 09 Playwright E2E and visual review | Not run: browser test dependencies are absent. The new four-viewport test writes screenshots to Playwright `test-results` and asserts no page overflow, but no screenshots were produced or reviewed here. |
| Browser performance / stress volumes | Not measured. No FPS, latency, memory, or long-task figures are claimed. |
| Local `npm run local:start` | Safely stopped before file/key creation because the Vite dependency was absent; it printed the required install command. |
| `git diff --check` | Passed. |

## Local recovery notes and practical limits

- The SQLite snapshot plus its stored checksum is authoritative. Do not copy only WAL files while the service is running. Stop the local service or use the owner-only backup export before moving a save.
- Backup import validates schema, content/rules versions, checksums, and receipt/event relationships and creates a new save identity. Incompatible/corrupt input is rejected without overwriting an existing save. A checksum detects accidental corruption; it is not a signature.
- Existing migrations retain save identity and do not rewind elapsed time. Startup pauses a running clock without counting offline time.
- No previous campaign progress entered new saves. Stage 09 asserts empty owned forces at T0, `historicalProgress=false`, the damaged house, and the one actual opening Rook corpse; later units arise only from the tested direct revival/Tomb paths.
- Stage 09 completes the local integration implementation and backend acceptance record, but it does not pass the full release/playability gate. Run the locked frontend install/build/test/E2E and review the four generated viewport screenshots in a connected CI or developer environment before calling it release-ready.
