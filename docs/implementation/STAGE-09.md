# Stage 09 — live integration and save continuity

## Result

The live client has nine API-backed screens, including Character and Events, and reuses the demo’s shared artwork and territory scene. The opening environment, versioned migrations, chest-area sweeps, a fixed-population H0 hunt sweep, and the P0 opening-rival/EV01 settlement flow are implemented. Hunt contacts reveal through local sight or a settled search, while aggregate regional population counts remain hidden. EV02–EV29 still gate campaign time until their staged event-family handlers are implemented; wildlife dispatch still uses the current fixed H0 encounter profile. The frontend build/browser suite could not run in this workspace because its pinned Node dependencies are unavailable.

No merge, push, hosting or deployment was performed.

## Source and runtime pin

| Field | Value |
|---|---|
| Branch | `work` |
| Audited pre-Stage-09 commit | `b076a0781cf4845f5326dcae254e1339ad34cafd` |
| Content source main commit | `32f34d8b5bb85671ec6301a30f045e30c0f8f161` |
| Content version | `LL01-CONTENT-0.4.0` |
| Ruleset version | `LL01-RULESET-0.4.0` |
| Save schema | `8` |
| Event timeline | `LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1` (30 rows) |
| Event item inputs | v7.24 CSV plus v7.25 catalog addendum; v4.6 remains locked for provenance comparison |
| Opening environment | `LL01-OPENING-ENVIRONMENT-ADAPTER-1.0` (versioned game-design seed) |
| Demo visual reference | `frontend/demo-ui-v0` at `27611a2eeaf226a11ebe05615a4539f165db7cdf` |

The opening weather and fuel ledger referenced by the source were missing from the active package. The adapter explicitly supplies 0°C, calm/dry weather and 24 hidden WOOD-equivalent fire units at one unit per 15 minutes. The fire uses the midpoint of the source’s +5–20°C range while the player is within its 10 m radius. These are versioned gameplay inputs, not claims that the source specified those exact values.

## Live screens

All nine production screens are routed through [LiveApp.tsx](../../frontend/src/LiveApp.tsx) and the registry in [screens.ts](../../frontend/src/live/screens.ts). They render the server `PlayerView`; the live dependency graph has no imports from `canonicalGeography`, `worldFeatures`, `demoData`, or a private content bundle. Demo/gallery remains a separate mode. Stage 10 adds shared page frame and heading components, shared character summary, shared event board and inspector frame used by both demo and live screens; each mode retains its own data and command adapters.

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

1. Creates an actual clean API save at schema 8, revision 1, paused at Day 1 07:00. It asserts zero living units, a damaged Lord House, no prior progression, undiscovered supply, sealed career, unidentified Rook, active EV00 protection, and the runtime's current fail-closed fuel/weather seed states. Inspecting the carried bag reveals the pre-seeded instances without rerolling. Inspecting and activating the career remain separate. Inspecting and reviving Rook creates the one source-eligible direct-revival unit.
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
| `EV01-OPENING-LEVEL` / `P0_FIXED_CONTENDER_RUNTIME_NOT_COMPILED` | The fixed board window and reward bands are present, but the fixed P0 actors’ committed XP, eligibility and completion-time outcomes are not compiled. EV01 emits a blocked zero-row settlement and pays nothing; this does not halt the later event calendar. |

Area dispatch selects units, an area center/radius, and optional target/time stops. Preview reports outbound travel, sweep work, return travel and total time. A target/time stop ends work in the area and then starts a return trip. Search uses area-sweep routes over the existing fixed chest field, reserves actors, records only discovered signals, and never opens a chest automatically. Search completion, recall, or a stop condition returns units. Hunting squads stay together; the current target list is limited to the executable H0 hare. A timer cannot kill it or award XP. General mob groups and their density/replenishment rules remain unsupported.

## Migration and persistence

- EV02–EV29 have executable versioned event objective/score/shop/settlement/claim mechanics under the Stage 10 design overlay. The overlay provides bounded local-save activities; it does not assert global leaderboard placement or fabricate source-catalog rewards. See [STAGE-10.md](STAGE-10.md).
- Research candidates `SX-0001` onward in the generated Stage 08 coverage report remain inactive unless a full acquisition/price/currency/limit/expiry/effect contract is promoted and tested. The 590 source entries, 239 effects, 202 observations, 13 mechanic extractions, 25 conflicts, and 20 source structures are evidence—not runtime grants.
- Unsupported source mechanics include promotion of source chest-candidate pools, `PROSPECTING_CONTRACT_NOT_COMPILED`, `WATER_PREPARATION_CONTRACT_NOT_COMPILED`, and source-gated workforce/fuel resource access. Versioned field/event chest reward tables and finite wildlife groups are implemented in Stage 10; they do not activate unverified source candidate drops. Non-heater production recipes and the D1 charcoal recipe remain unavailable; no source recipe ID or inputs are invented.
- Upgrade edges, general unit anatomy/equipment profiles, daily resident upkeep quantities, fixed P0 event outcomes, variable-price trade quotes, unadopted source-item expiry/effects, auction seller acceptance/liquidity, and non-opening lair boss combat remain outside the implemented runtime contracts. See [Stage 06](STAGE-06.md), [Stage 07](STAGE-07.md), [Stage 08](STAGE-08.md), [Stage 10](STAGE-10.md), and the generated [coverage matrix](STAGE-08-CONTENT-COVERAGE.md) for precise evidence and states.

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
| `npm run test:stage07` | Passed 1/1 Node test file. |
| `npm run test:stage08` | Passed 6/6 against schema 8 and the updated event lifecycle. |
| `npm run test:stage09` | Passed 3/3 against schema 8 and the updated event lifecycle. |
| `npm run test:stage10` | Passed 9/9: EV02–EV29 rules, V7 migration, EV19 branch and claims, shop spend/expiry, strict backup receipts, chest rarity/scope and active event-chest delivery, wildlife conservation/regeneration, and search-to-kill flow. |
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

Backups should be exported through the owner-only backup command or after stopping the local service; copying SQLite WAL files while the service is running is not a supported backup procedure.
