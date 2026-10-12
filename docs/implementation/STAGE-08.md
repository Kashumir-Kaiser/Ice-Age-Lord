# Stage 08 — event calendar, research evidence, rewards and rankings

## Result

The runtime preserves the fixed 30-row v0.6 calendar, executes EV00 and the opening-level EV01 board, and runs the Q08 caravan quest. A versioned contract registry is compiled into the world package and exposed through the live API for all 30 IDs, including named event families, participation, objectives, scoring, encounters, rewards, shops, stock/expiry and settlement. EV02–EV29 retain their authored calendar times and remain gated until those event-family handlers record gameplay outcomes; the campaign is not yet complete. The Events screen shows each contract beside the selected save's lifecycle/readiness, research evidence, rankings, claims and shop state.

Content is pinned as `LL01-CONTENT-0.4.0` / `LL01-RULESET-0.4.0`. Compilation checks the corrected 1,682-row v7.24 item ledger and v7.25 catalog addendum while retaining v4.6 as provenance evidence for conflicts. Source records are not runtime rewards: research-only rows remain inactive, and observed chest outcomes are shown separately from verified acquisitions and offers. An observed opening does not guarantee a drop.

The v7.24 CSV also has malformed/unheaded fields in some rows. The compiler checks all item IDs against the v7.25 addendum, but only counts acquisition and shop flags when the adoption and verification columns remain aligned. It reports 490 unresolved rows separately; those flags cannot be used to promote content or imply guaranteed rewards.

## Implemented

- Schema 10 persists the fixed calendar, Q08 economy, opening-rival action/resource/XP ledgers, frozen rank rows, reward payloads and claim receipts. Schema 9 → 10 seeds the rival runtime for an open board, catches actions up to the saved elapsed time, and preserves any already-frozen legacy settlement without replaying it or issuing a retroactive reward.
- The calendar advances at exact boundaries in deterministic order. EV00 resolves opening protection. EV01 opens at +48h, filters committed level-10 completions through its three-minute display delay, closes at +144h, sorts by completion timestamp/stable ID, freezes the first 100 rows and assigns the seven literal reward bands. Player reward claims deliver committed items once; a source-dependent random slot can remain blocked independently.
- The nine File 07 rivals use fixed profiles, anchors, starting environments and forecast formulas to schedule hunting actions. Every action records its timestamp, finite prey/ration/firewood balance, XP and level change. Level-10 timestamps come from those committed actions, not a preset rank; Lí Lan qualifies only through her own XP transaction ledger. Results match across one-shot and hourly simulation advances.
- `QUEST-LL01-08` has server-side acceptance, negotiation, escort, arrival and claim transitions with fixed actors, route, deadlines and conditions. Its reward and the versioned local bread offer/auction use persistent inventory and currency state, bounded stock, atomic settlement and idempotent claims.
- The Events screen reads the API’s player-safe calendar, research counts, rank snapshots and shop projection. The Character screen and dispatch controls likewise use the selected save’s API view; demo preview controls remain in demo mode.
- `LL01-EVENT-CONTRACT-REGISTRY-1.0` compiles one contract for every v0.6 calendar ID into `WorldDefinition` and `PlayerView`. EV00/EV01 are runtime-active; the later handler families are labeled planned and do not pretend their authored contracts are gameplay results.
- Research compilation keeps separate counts for recorded source rows, research-only rows, verified acquisitions, verified shop offers, observed chest outcomes and unresolved provenance conflicts. None of these counts directly mints a reward.
- A versioned, explicit opening-action balance overlay turns File 07 forecasts and File 03 habitat classes into finite rival action schedules and starting resource estimates. The exact assumptions are recorded in `docs/implementation/OPENING-RANKING-RUNTIME.md` so they can be tuned without changing the source-locked reward contract.

## Unfinished contracts

| Area | Current state |
|---|---|
| EV00 | Executable opening-protection lifecycle. |
| EV01 opening board | Implemented and persistent. NPC equipment/loadouts outside the P0 forecast/action abstraction remain future depth; the current contract executes finite hunts and resource limits with committed XP and stable settlement. |
| EV02–EV29 | Calendar entries and research evidence are present; mandatory mechanics, objectives, encounters, shops and settlements are not executable. |
| Event item ledger | v7.24 plus the v7.25 addendum are compiled and validated. Evidence is not promoted into game items until each item has a complete acquisition, stock/limit, expiry, effect and claim contract. |
| Field chest loot | Existing chests are fixed and depleted on opening, but their reward pool is not compiled. An observed result is not treated as a guaranteed drop. |
| Expedition hunting | The current executable encounter is the fixed H0 hare. General area-based mob groups and replenishment rules are not compiled. |

Q08’s local shop and auction are explicitly versioned game-design contracts; they are not represented as verified event-catalog offers. They do not make the remaining event rows executable.

## Validation

The content compiler and coverage report validate the locked source hashes and item IDs. Simulation tests cover calendar boundaries, Q08 settlement, replay prevention, rival determinism, exact opening-board settlement, fixed payouts, reward claims, migration and reload continuity. Area-search tests cover reservations, sweep coverage, target/time stops, return/recall and time-step determinism. See the current Stage 09 validation record for this checkout’s exact counts and frontend dependency limitation.

Relevant implementation: `packages/content/src/compiler.ts`, `packages/content/src/eventReadiness.ts`, `packages/sim/src/stage08.ts`, `packages/sim/src/spatial.ts`, `frontend/src/LiveApp.tsx`, and [the generated coverage matrix](STAGE-08-CONTENT-COVERAGE.md).
