# Stage 09 — live integration and save continuity

## Result

The live client has nine API-backed screens, including Character and Events, and reuses the demo’s shared artwork and territory scene. The opening environment, versioned migrations, chest-area sweeps, a fixed-population H0 hunt sweep, and the P0 opening-rival/EV01 settlement flow are implemented. Hunt contacts reveal through local sight or a settled search, while aggregate regional population counts remain hidden. EV02–EV29 still gate campaign time until their staged event-family handlers are implemented; wildlife dispatch still uses the current fixed H0 encounter profile. The frontend build/browser suite could not run in this workspace because its pinned Node dependencies are unavailable.

No merge, push, hosting or deployment was performed.

## Source and runtime pin

| Field | Value |
|---|---|
| Branch | `work` |
| Content version | `LL01-CONTENT-0.4.0` |
| Ruleset version | `LL01-RULESET-0.4.0` |
| Save schema | `10` |
| Event timeline | `LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1` (30 rows) |
| Event item inputs | v7.24 CSV plus v7.25 catalog addendum; v4.6 remains locked for provenance comparison |
| Opening environment | `LL01-OPENING-ENVIRONMENT-ADAPTER-1.0` (versioned game-design seed) |
| Demo visual reference | `frontend/demo-ui-v0` at `27611a2eeaf226a11ebe05615a4539f165db7cdf` |

The opening weather and fuel ledger referenced by the source were missing from the active package. The adapter explicitly supplies 0°C, calm/dry weather and 24 hidden WOOD-equivalent fire units at one unit per 15 minutes. The fire uses the midpoint of the source’s +5–20°C range while the player is within its 10 m radius. These are versioned gameplay inputs, not claims that the source specified those exact values.

## Live screens

All screens render the selected save’s server `PlayerView`; demo preview settings do not issue live gameplay commands.

| Screen | Live behavior |
|---|---|
| Overview | Clock, survival, fire, known world state and event notices. |
| Character | Actual player attributes, level, skills, equipment and character artwork. |
| Territory | The demo's isometric territory scene, camera, building sprites and building inspector list, populated from the selected save's API projection. Live mode hides demo heat previews, placement trays and calibration fixtures. Fire controls, storage, residents, jobs and construction details remain API-backed. |
| Map | Server-projected sites, resources, signals, routes, units and current searches. Shared demo marker artwork is used for fire, buildings, resources and caches. Map actions dispatch through the API. |
| Inventory | Owned containers, item instances, provenance, reservations and available inventory commands. |
| Forces | Owned units and combat state, with Hunt mobs/Search for chests dispatch controls. |
| Buildings | Building services, blueprints, workers, progress and Tomb queue. |
| Events | All 30 fixed calendar entries and compiled contracts, research evidence, runtime readiness, ranking snapshot/blocker and available shop/quest state. Contract text comes through the API's compiled world package; showing evidence does not turn research or observed chest loot into guaranteed rewards. |
| Journal | Player-safe event history and receipts. |

Area dispatch selects units, an area center/radius, and optional target/time stops. Preview reports outbound travel, sweep work, return travel and total time. A target/time stop ends work in the area and then starts a return trip. Search uses area-sweep routes over the existing fixed chest field, reserves actors, records only discovered signals, and never opens a chest automatically. Search completion, recall, or a stop condition returns units. Hunting squads stay together; the current target list is limited to the executable H0 hare. A timer cannot kill it or award XP. General mob groups and their density/replenishment rules remain unsupported.

## Migration and persistence

Schema 7 saves upgrade through schemas 8, 9 and 10. The migrations add the opening environment, mark legacy search jobs as chest searches, and add the versioned rival ledger. Open boards catch the rivals up through the already-saved simulation time; closed or previously blocked legacy boards are preserved without replay or retroactive awards. An active fire with no saved fuel receives the adapter’s hidden starter balance; an inactive fire remains inactive. Existing event history, claim receipts, rank snapshots, checkpoints, command receipts and previously earned rewards are preserved. Startup updates the checksum and version metadata atomically and pauses the simulation without counting offline time.

The Stage 09 tests verify fresh initialization, server-backed supply/harvest/refuel, restart continuity, schema migration with persisted ledgers, hidden-world discovery, and a saved hunt sweep that detects the fixed hare without resolving combat or awarding XP. Opening-ranking runtime tests verify rival actions, resource use, XP, settlement, reward claim idempotency, time-step consistency and reload continuity. Stage 07 also checks that undiscovered wildlife and regional totals stay out of the player view. The leaderboard is a deterministic local simulation for this save; there is no network leaderboard.

## Remaining implementation gates

- EV02–EV29 remain mandatory content gates. Their canonical objectives and reward contracts are documented; their event-family handlers, stock/expiry state and committed participation records are being implemented incrementally.
- General mob density and replenishment, combat with wildlife groups beyond the fixed H0 hare, and corresponding casualty/cargo behavior remain future dispatch work.
- The research ledger is now compiled from v7.24 plus the v7.25 addendum. Of 1,682 rows, 490 have unaligned adoption/verification columns and cannot contribute verified acquisition/shop flags; research-only rows, conflicting provenance and observed chest outcomes remain evidence rather than guaranteed grants.
- The live map shares demo marker artwork, and the territory scene now renders through the shared demo component. Extracting the remaining demo page layouts and inspectors into common live/demo components remains future frontend work.

## Local run

After installing the pinned frontend lockfile with Node 24 or newer:

```sh
npm ci --prefix frontend --no-audit --no-fund
npm run local:start
```

The local runner binds the API to `127.0.0.1:8081` and Vite to `127.0.0.1:5173`. Enter `.local/owner-key` in the browser, then create or select a save. For a production-bundle preview, install dependencies, run `npm run content:compile`, `npm run db:migrate`, create an owner key if needed, then run `VITE_GAME_MODE=live npm --prefix frontend run build` and start the API with the allowed origin set to the preview URL.

## Validation in this checkout

| Check | Result |
|---|---|
| Content compilation | Passed: 38 sites, 192 fixed chests, 15 lairs, 693 fixed lair units and 30 events. |
| Content coverage report | Passed with locked source hashes and v7.24/addendum item identity validation. |
| `npm run test:stage02` | Passed 10/10. |
| `npm run test:stage03` | Passed 3/3 with temporary permission for its local-only HTTP listener. |
| `npm run test:stage04` | Passed 11/11. |
| `npm run test:stage05` | Passed 13/13. |
| `npm run test:stage06` | Passed 12/12. |
| `npm run test:stage07` | Passed 14/14. |
| `npm run test:stage08` | Passed 6/6. |
| `npm run test:stage09` | Passed 5/5. |
| `npm run test:opening-ranking` | Passed 3/3 source formula, eligibility/tie/delay and fixed-band rules. |
| `node --experimental-strip-types packages/sim/test/openingRankingRuntime.test.ts` | Passed 3/3 rival determinism, settlement/claims, reload and schema migration. |
| Dependency-free frontend contract suite | Passed in this work session. |
| Frontend full unit suite | 2 of 9 files passed; 7 could not load because `typescript`/`vite` are unavailable. |
| Frontend asset sync | Passed; 101 structure, 37 item and 12 unit assets. |
| Frontend TypeScript/Vite build | Blocked because `frontend/node_modules` is unavailable (`tsc: not found`). The offline lockfile install misses `yallist@3.1.1`; network install could not reach the package registry in this environment. |
| Playwright/browser E2E | Not run because `@playwright/test` is unavailable. The E2E test covers all nine screens at desktop, tablet and mobile sizes, map and territory artwork loading, the 30-row Events screen, API-backed area-search preview/dispatch, save switching and stale responses. |
| `git diff --check` | Passed after the shared live territory scene and updated browser assertions. |

Backups should be exported through the owner-only backup command or after stopping the local service; copying SQLite WAL files while the service is running is not a supported backup procedure.
