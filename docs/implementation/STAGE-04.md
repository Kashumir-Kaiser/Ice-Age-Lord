# Stage 04 — Authoritative time, survival boundaries, and Tomb production

## Scope and source authority

Stage 04 adds a deterministic server-owned simulation clock, source-aligned world-time boundaries, the opening protection settlement, the survival-fire fuel ledger, ColdLoad accumulation when an actual weather record exists, and the standard Ngôi Mộ queue. The live client reads the persisted `PlayerView`; it never calculates elapsed simulation time locally. Save schema version 2 carries the Stage 04 clock and settlement state.

The implementation follows the attached Stage 04 work prompt and these repository sources:

| Mechanic | Authority |
|---|---|
| T0, 24-hour world day, daily settlement at 07:00, midnight refill, 16:30 sunset, 17:00 night, 07:00 dawn | `references/canonical/LORD-DND-01.md` §14.3 and `references/canonical/LORD-DND-03.md` §28.1 (`WORLD-CLOCK-2.0`) |
| EV00 opening protection and 144-hour expiry | `references/canonical/LORD-DND-01.md` §§14.3, 20.1 and the selected campaign event schedule |
| ColdLoad formula, thresholds, weather record boundary | `references/canonical/LORD-DND-03.md` §28.2 |
| Death Qi capacity refill and standard queue output | `references/canonical/LORD-DND-04.md` §16.8; `references/canonical/LORD-DND-06.md` §§21–22 |
| Zombie labor and XP mirror policy | `references/canonical/LORD-DND-06.md` §22.3 |
| T0 opening-state and unresolved-mechanics disposition | `docs/implementation/STAGE-02-AUTHORITY-MATRIX.md` and `docs/implementation/STAGE-02.md` |

## Runtime decisions

- T0 is elapsed `0`, World Day 1 at 07:00. Midnight is T+17h; the next daily content settlement and dawn are T+24h. Sunset is T+9.5h and full night is T+10h. Day rollover, Death Qi refill, and sunrise remain separate boundaries.
- `advanceTo(target, stopCondition)` is a pure deterministic engine function. It advances to the next due boundary in bounded batches, integrates Mana and known ColdLoad in fixed-point units, and applies stop predicates at the exact event timestamp. The server converts monotonic elapsed time using the selected multiplier; browser clocks and wall-clock timestamps never determine game time.
- Each save has one in-memory driver lease. Another tab can read and issue non-clock commands but cannot change the clock. If its lease expires, the server settles through the lease expiry then pauses. Startup pauses a persisted running save before accepting sessions, so offline server time is not simulated. System changes and their event/receipt rows commit in the same SQLite transaction as the snapshot.
- At equal timestamps, known fire consumption settles first; Tomb completions resolve by `slot_id`, then `job_id`; freed slots try the stable queue order immediately; the 00:00 Death Qi refill then sets the available pool to current capacity and starts any now-affordable queued work; hourly, daily, light, protection-expiry, and ColdLoad status boundaries follow. This preserves the source rule that a completion and its standing-order start settle before the midnight refill.
- The standard Bậc 1 queue has two slots, 20 minutes per output, and reserves one Death Qi when a job starts. T0 output is Cương Thi Bậc 0, Thường, Level 1, XP 0, DARK, non-hero, absolute loyalty, no XP mirror, and 1 WU/hour. Unit IDs are created with their queue jobs and remain stable through persistence and reload. Queued or blocked work can be cancelled without a refund; active cancellation is rejected because interruption/refund behavior is not resolved in the source contract.
- A building capacity upgrade changes the cap but does not grant current Death Qi. A capacity reduction clamps current Qi to the reduced cap. Midnight refills current Qi exactly once to the then-current cap.
- Mana regenerates at the source-locked 0.45/second and clamps at 236. The engine tracks micro-Mana to avoid chunk-size drift. The simulation does not add a hunger rule.

## Opening-state blockers retained

- EV00-SAFE-FIRE starts in the first save transaction at elapsed T0 and expires at T+144h. It protects the fire and settlement but does not neutralize cold, hunger, or darkness.
- The T0 fire is known active, level 1, and 10 m radius; its source-defined profile consumes 1 WOOD every 15 minutes. File 06 labels `fuel_remaining` as `STATE_UNOBSERVED_SEE_STARTER_LEDGER`: the player does not observe the seeded balance, while the simulation must load that balance from its starter ledger. This repository's active world package does not include the referenced numeric ledger entry, and the initializer stores `null` with no first-consumption timestamp. The engine therefore blocks exact refuelling/consumption rather than inventing a balance. The starter inventory contains no wood, and the supply chest remains inaccessible under the Stage 03 distance/access conflict.
- File 03 §28.1 requires hourly weather values to be `CAMPAIGN_SEEDED`; File 06 says nearby weather is seeded before opening. The active world package/initializer contains no T0 hourly weather row, so ColdLoad remains unresolved. The runtime is missing the required seed materialization; this is not a source rule that weather is absent. The implemented formula and thresholds remain unchanged.
- The standard Tomb chassis profile includes the source-locked output fields. Equipment slots are marked `source_profile_not_compiled`; no weapon, anatomy detail, or hidden profile is invented. Stage 05 movement, exploration, search, resource extraction, and direct revival remain disabled.

## Main implementation paths

- `packages/sim/src/time.ts` — pure time conversion, fixed-point integration, deterministic boundaries, fire fuel, Tomb queue, and capacity rules.
- `packages/sim/src/upgrade.ts` — fail-closed schema 1 to 2 upgrade. A legacy save with active Tomb data is not guessed into the new queue model.
- `packages/sim/src/initializer.ts`, `reducer.ts`, and `view.ts` — Stage 04 opening state, validated player commands, and player-safe snapshot projection.
- `packages/api/src/service.ts` and `server.ts` — server monotonic clock, driver leases, startup/shutdown pause, system events, and player-safe clock status.
- `packages/storage/src/repository.ts` — atomic system transition transactions and schema upgrades.
- `packages/contracts/src/index.ts` and `api.ts` — versioned save, command, view, and driver contracts.
- `frontend/src/LiveApp.tsx`, `frontend/src/live/HttpGameClient.ts`, and `frontend/src/live/live.css` — authoritative polling, clock controls, survival status, and Tomb/roster views.
- `packages/sim/test/stage04.test.ts` and `frontend/e2e/live-api.spec.ts` — deterministic runtime checks and the browser journey.

## Verification

Passed locally:

```text
npm run content:compile       38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 scheduled events
npm run test:stage02          9/9 tests
npm run test:stage04          passed
```

The Stage 04 tests cover long versus short advancement, the T0/world-clock conversions, sunset/night/dawn boundaries, fire fuel edges and unknown fuel, two Tomb slots and queue order, insufficient Death Qi, cancellation, midnight refill, capacity changes, exact completion persistence across reload, two-tab driver ownership, lease expiry, restart pause, backup import with a multi-event command, and transaction rollback/retry.

Local-only constraints prevented two checks in this workspace:

- `npm run test:stage03` cannot bind its HTTP test server because sandbox loopback `listen(127.0.0.1)` returns `EPERM`.
- Frontend build/unit tests cannot resolve packages because `frontend/node_modules` is absent (`tsc`, `typescript`, and `vite` are unavailable). No package install was attempted; the main-branch workflow installs from the checked-in lockfile and runs backend, build, unit, and Chromium checks.

## Stage 05 handoff

Before movement or exploration is enabled, materialize the File 06 referenced starter fuel ledger and the campaign-seeded T0 hourly weather row, then source-lock/version their inputs. Stage 05 must keep the lease-owned server clock and pure boundary engine, include every new action/completion/depletion in its time-boundary manifest, and preserve stable identities and player-safe event projection.
