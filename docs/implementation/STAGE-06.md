# Stage 06 — Construction, workers, inventory and production

## Input and base

Implemented the attached Prompt 06 against the Stage 05 worktree at `9681ba3d4036338e5017cc23727055b5488cff80` (already descended from the repository's current `main`). The audit and prompt files were read from the supplied attachments and were not copied into the repository.

## Delivered behavior

- Added the fixed eleven-entry `OPENING-FIXED-BUILDINGS-2.0` catalog and the pinned farmhouse/repair source contracts. A damaged Lord House is repaired for exactly 20 WOOD + 10 STONE and 17/60 WU. It reserves the actual required STONE-HAMMER for each assigned worker, consumes materials only once at completion, returns tools, and unlocks exactly the eleven built-in options at completion.
- Work uses `BLUEPRINT-WORK-3.0`: BaseLaborRate × Health × Stamina × Skill × Tool × Weather × Shelter × Command, with each factor checked against 0–1.25 and one shared workfront coordination (1 worker 1.00, 2 workers .75, 3 .65, 4 .60, 5–8 .55). The opening overlay defaults unspecified worker factors to 1.00. This gives the source reference 17 minutes for one standard repair worker, 45 minutes for one farmhouse worker and 30 minutes for two standard farmhouse workers.
- Placement rechecks H0 ownership, 100 m territory range, 5 m worker reach, surface layer and an axis-aligned square/segment footprint collision overlay. Existing fixed site coordinates remain unchanged; the overlay version is `LL01-BUILDING-PLACEMENT-1.0`.
- Inventory exposes owner, container/location, unit, quality, provenance, equipped slot, food units and reserved/free quantity. Split, merge, transfer and consume operations preserve totals and produce causal events/receipts. The real 40-slot supply chest remains separate from the carried bag; inaccessible or unobserved stock cannot satisfy costs. Recruitment consumes exactly five FOOD units per resident and accepts the exact source-defined food-unit values on stacks.
- A farmhouse is built with 30 WOOD + 10 STONE, 0.75 WU, max two workers, 12 m² and four places. It creates no residents automatically. A resident receives a stable identity only after recruitment consumes food; housing capacity is enforced.
- Added the source-defined Level 1 heater service: reserve 1 WOOD, run for 20 minutes, then consume the reserved wood once. The player projection shows the local +15–20°C service for rooms up to 30 m². It does not alter territory-wide cold load because room occupancy and local climate coupling are not compiled.
- First Lord House repair and first farmhouse rewards are stored as pending entitlements. The skill-book reward references `ACHIEVEMENT-SKILL-FIT-1.0`; neither reward is minted before recipient eligibility and the first-world trigger settle. D1/charcoal blueprints are not granted.
- Connected Building/Territory/Inventory/Overview/Journal projections to the shared state, including operation state, cost previews, assignments, work rate/ETA, population, reservations, capacity, search/filter and player-safe construction/reward events. Selecting the H0 or a known owned building from the map opens the construction inspector.

## Validation performed

- `npm run content:compile` — passed (38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 scheduled events).
- `npm run test:stage02` — 9/9 passed.
- `npm run test:stage04` — 11/11 passed.
- `npm run test:stage05` — 6/6 passed.
- `npm run test:stage06` — 12/12 passed. Covers reservations, unique tools per repair worker, cancellation, exact one/two-worker durations, collision and shared-cost rejection, food-unit recruitment, heater fuel/service, deterministic time slicing, SQLite reload and application journal projections.
- `npm run test:stage03` — HTTP cases could not start because the sandbox rejects loopback binding (`listen EPERM: operation not permitted 127.0.0.1`); the process-crash recovery subtest passed when the file was run directly. The Stage 06 API/application journal path was separately exercised without opening a socket.

## Tool and browser limits

Chromium 151.0.7922.173 is present at `/usr/bin/chromium`. A headless launch exits 133 because Crashpad receives `setsockopt: Operation not permitted`; the browser journey could not be run in this sandbox. TypeScript is absent. The requested offline install (`npm install --offline --prefix /tmp/ill-tsc-offline --no-save typescript@5.7.3`) failed with `ENOTCACHED`, and no cached TypeScript compiler or frontend dependencies were found. No network install was attempted. Therefore no `tsc`, frontend build, or interactive browser verification is claimed.

## Source-locked limits

- Equip/unequip stays blocked with `EQUIPMENT_PROFILE_NOT_COMPILED` until the unit anatomy/compatible slot profile exists.
- Source upgrade edges are displayed in the catalog, but upgrade commands are not implemented in this stage. They stay unavailable until per-instance prerequisites, costs, assignment and identity-preserving completion are wired.
- Farmhouse daily upkeep is not simulated: the source confirms a daily need but does not set a universal food amount independent of resident condition/activity.
- Non-heater production recipes and the D1 charcoal acquisition/recipe are not executable in the adopted opening contracts. They remain absent/disabled; constructing an icon cannot produce coal.
- First-world uniqueness and recipient skill selection remain pending; no competitive actor/result or skill is fabricated.
- The source opening fuel amount and opening weather remain unobserved/unresolved. The heater's local-room output does not fill either gap.

## Visible journey and handoff

The intended UI path is: inspect the supply chest at its actual site, carry only the needed starter tool/materials, harvest and return real WOOD/STONE, preview and start House repair, assign available nearby workers, advance time, inspect the eleven unlocked definitions, build the heater/farmhouse with a reachable worker, run the 20-minute heater cycle or recruit residents with FOOD, then reload and compare Building, Territory, Inventory, Overview and Journal. Code paths and simulation checks cover these transitions; the interactive browser walk remains unverified for the sandbox reasons above. Stop before combat/direct revival.
