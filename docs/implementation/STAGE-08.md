# Stage 08 — event calendar, research evidence, rewards and rankings

## Result

Stage08’s bounded runtime is implemented on top of Stages 06 and 07. The build keeps the full 30-row event calendar, adds one campaign-fixed/source-analogy caravan quest with a real reward and inventory path, persists fixed-price purchases and auction escrow, and writes a coverage report for every current source record. Stage 10 extends this runtime with playable EV02–EV29 objectives, score shops and result claims; see [STAGE-10.md](STAGE-10.md) for the current event, wildlife, chest and shared-UI rules. The selected source set remains `32f34d8b5bb85671ec6301a30f045e30c0f8f161`: Round46 catalog/CSV v4.6, timeline v0.6 and structure catalog v1.0.

Remaining source-dependent gaps include promotion of catalog research items, variable-price quote settlement, auction seller acceptance without a validated buyer contract, and source-defined bot score rules for EV02–EV29. The EV01 board now settles from committed player and P0 bot outcomes at the adopted cutoff. EV02–EV29 use explicit Stage 10 player game-design objectives; they are not participant-ranked bot boards. No catalog research row is silently promoted and no rank or source prize is fabricated.

## Implemented

- State schema 8 persists the 30 fixed calendar rows, EV02–EV29 progress/score/shop state, finite wildlife groups, chest outcomes, the Stage08 caravan, Q08 progress, claim receipts, Krona, market stock, auction bids/escrow and opening rank snapshots. Schema 5–7 saves upgrade without rewinding elapsed time or receiving retroactive Q08/event rewards.
- Calendar open, lock and resolve receipts settle at the adopted boundaries in deterministic order. Rows never recur. EV00 retains its opening-protection transition; EV01 freezes the ranked result at the exact +144h close from eligible committed player and P0 bot completions; EV02–EV29 open and settle through the Stage 10 player objective/claim lifecycle. Unsupported EV01 reward slots stay pending under their frozen slot IDs. A calendar receipt alone never pays a reward.
- `QUEST-LL01-08` follows the fixed actors and route: Torven, caravan `CARAVAN-LL01-01`, ledger `QI-LL01-08`, departure at +120h, bridge distress at +122h, close at +126h and arrival at Krona Gate. Acceptance, negotiation, escort, arrival and claim are separate server transitions. Claim requires Torven alive, an intact ledger and at least 3 of 9 draft animals at town.
- The canonical reward `RW-LL01-08` grants 60 Krona, offers Torven contract `HERO_CONTRACT_OFFER-05`, and unlocks `ROUTE-TRADE-LL01-A`. The 21-day contract terms are 4 Krona/day plus 5% of loot on trips Torven leads; goods still move through the route and are not teleported.
- The source allows negotiation but does not give its exact price. This build records one real grain sack from the caravan’s 18 as a versioned game-design cost for safe passage. It does not change the caravan’s other source cargo or its survival conditions.
- The town bread offer is an explicit local market design (`sourceEntryId=null`): 1 Krona each, 24 stock, 10 purchases per save. Purchase commits currency, stock, capacity check and actual BREAD delivery atomically. The purchased instance uses the existing Stage04 food-consumption handler and its market lineage is conserved through consumption and backup import.
- A versioned design auction exposes the caravan’s six actual salt units. Bids reserve lot quantity and Krona; cancellation and close expiry restore the full escrow. An open bid creates no item ownership. No NPC buyer, auto-fill or sale is invented.
- The live nine-screen UI shows known event and quest state, transaction receipts, currency, actual bread, stock/cap/price, bid windows, escrow and available Q08 commands. The Krona Gate inventory market also shows compatible bot blueprint listings and exposes purchase when the player has a usable BREAD stack; unsupported blueprints and water payments show their blockers. Future unrevealed calendar rows stay hidden.
- The coverage generator checks current source hashes, parses the CSV quoting rules, verifies every JSON/CSV item ID, and lists all 590 entries, 239 effects, 202 observations, 13 mechanic extractions, 25 provenance conflicts and 20 source structure records.

## Unfinished contracts

| Gate | Result | Evidence / boundary |
|---|---|---|
| 1. Exact 30-row timing, boundaries, no recurrence, high-speed restart | **Passed** | Table-driven checks cover every current v0.6 row before/at/after open, lock and resolve, event receipt ordering and no recurrence. EV01 ranks committed eligible completions at +144h; EV02–EV29 use the separate player objective overlay. |
| 2. Source-grounded event/quest/shop/effect/reload path | **Passed for Q08** | Fixed caravan/ledger/actors/deadline/reward, legitimate site/time eligibility, real BREAD delivery and food effect, SQLite restart and strict backup import. The explicitly priced negotiation and town shop are labeled game-design additions. |
| 3. Stock, replay, capacity, currency, expiry and auction escrow | **Passed for active fixed-price/auction contracts** | Duplicate command, stale last-stock race, insufficient Krona, full destination, exact offer expiry rejection, bid reservation/cancel/expiry/refund and no early salt ownership are verified. No variable-price offer is active, so there is no quote acceptance path; no seller/liquidity rule authorizes an auction fill. |
| 4. Event-exclusive item expiry and exclusive claims | **Passed for Stage 10 event overlay items; source catalog items remain inactive** | Stage 10 event marks and scoped event-chest drops carry the matching event ID and expire at resolution; claim receipts are idempotent and claims expire after seven days. The v4.6 research rows remain unpromoted; this does not claim their source-specific residue/effect rules. Q08 bread remains permanent, and auction escrow still expires/refunds independently. |
| 5. Source ranking and frozen results | **Implemented with versioned P0 simulation rules** | File01 supplies the +48h..+144h window, top-100 level-10 qualification, tie order and seven literal reward bands; File07 supplies fixed identities. The runtime records committed P0 XP/qualification outcomes and freezes one immutable snapshot at +144h. Unsupported reward slots remain individually blocked. The current 168h full-population acceptance has not been rerun after the present changes. |
| 6. Coverage of active and pending content | **Passed as a coverage report** | [STAGE-08-CONTENT-COVERAGE.md](STAGE-08-CONTENT-COVERAGE.md) records each entry’s adoption, source fields, missing runtime contract and attached conflict, plus effect/observation/extraction/structure records. Research-only rows remain inactive. |

## Validation

The content compiler and coverage report validate the locked source hashes and item IDs. Simulation tests cover calendar boundaries, Q08 settlement, replay prevention, rival determinism, exact opening-board settlement, fixed payouts, reward claims, migration and reload continuity. Area-search tests cover reservations, sweep coverage, target/time stops, return/recall and time-step determinism. The command block below is the earlier Stage 08 checkpoint, not a rerun for this bot change; current focused results and the frontend dependency limitation are recorded in [ENEMY-BOT-SYSTEM-STATUS.md](ENEMY-BOT-SYSTEM-STATUS.md).

```text
npm run content:compile       38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 events
npm run content:coverage:stage08
npm run test:stage02          9/9
npm run test:stage03          3/3 (local-only loopback permission enabled)
npm run test:stage04          11/11
npm run test:stage05          12/12
npm run test:stage06          12/12
npm run test:stage07          1/1 Node test file (the suite’s simulation assertions passed)
npm run test:stage08          6/6
npm run test:stage10          9/9
```

The initial Stage02 run caught an old hard-coded source commit/catalog assertion. It was updated to check the current source pin and v4.6 research input, then passed 9/9. The initial Stage08 rank assertion tried to read an event list from the save aggregate; the actual storage API exposes player-event paging separately. The test now checks the persisted rank snapshot and idempotent settlement directly, and passes.

Frontend unit/build checks could not run in this local checkout: `frontend/node_modules` was absent, the offline lockfile install stopped at uncached `yallist@3.1.1`, and `tsc`/Vite were unavailable. GitHub Actions run [38123942852](https://github.com/Kashumir-Kaiser/Ice-Age-Lord/actions/runs/38123942852) passed after fixing the stale frontend build and E2E view fixture. It ran content compilation and coverage, Stage02–08 backend suites, frontend build and unit tests, and the 60-case Chromium/mobile browser matrix (55 passed, 5 skipped).

## Main files

- `packages/sim/src/stage08.ts` — quest, offer, auction, settlement and invariants.
- Stage 10 event/wildlife/chest/UI runtime: [STAGE-10.md](STAGE-10.md).
- `packages/sim/test/stage08.test.ts` — calendar, transaction, persistence, migration and restart coverage.
- `packages/content/tools/report-event-coverage.ts` — verified source matrix generator.
- `frontend/src/LiveApp.tsx` — live quest, inventory, market and auction controls.
