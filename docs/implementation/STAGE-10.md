# Stage 10 — playable events, finite wildlife, chest pools and shared screens

## Result

Stage 10 adds executable local-save event objectives for EV02–EV29, deterministic type/rarity chest reward tables, finite regional wildlife groups with server-settled combat, and shared screen/inspector components used by both demo and live modes. The event calendar remains the adopted fixed 30-row v0.6 schedule. `LORD-DND-01.md` also materializes event-specific conditions, board metrics, reward contracts and shop identifiers. This stage does not activate those source encounters, rankings, source reward pools or research-candidate shops; it adds a separately versioned local-save loop so players can participate, build progress, spend contribution, settle and claim while those source dependencies remain unpromoted.

The overlay does not claim official source scoring, global ranking, source-item rewards, or source boss appearances, and it must not be presented as implementing the source mechanics described in event contract §14.3.2. It awards local contribution from committed actions already produced by the game runtime. EV01 uses the separate fixed-contender P0 simulation and freezes its board at +144h; unsupported reward slots remain pending. Opening fire fuel/weather seeds and full frontend browser/visual release verification also remain open, as documented in [STAGE-09.md](STAGE-09.md).

## Event lifecycle and economy

Every EV02–EV29 row receives `LL01-EVENT-MECHANICS-DESIGN-1.0` objective rules at save creation. Only the server’s committed domain events produce score; command payloads cannot submit score, participation, outcomes, reward amounts, or item results. A domain activity contributes to every active event whose rule accepts that event type, and score stops at that event’s objective target. Participation is recorded only when a positive objective contribution commits.

| Event | Target | Committed activity points |
|---|---:|---|
| EV02 — Dragon Revival | 10 | combat win 5 |
| EV03 — Ice Horn | 10 | chest opened 5 |
| EV04 — First Merge Dragon Points | 20 | combat win 5; harvest completion 2 |
| EV05 — Anno Fishing | 10 | harvest completion 2 |
| EV06 — Construction Week | 20 | building completion 10; Lord House repair 5 |
| EV07 — Kingdom Wrath | 15 | combat win 5 |
| EV08 — World Boss | 40 | combat win 10 |
| EV09 — Oracle War | 60 | combat win 3 |
| EV10 — Monster Siege | 30 | combat win 5; building completion 5 |
| EV11 — Mist Disaster | 8 | spatial search 1; combat win 2 |
| EV12 — Legion Race | 30 | building completion 5; combat win 3 |
| EV13 — Blood Chaos | 50 | combat win 5 |
| EV14 — Dream Shard | 200 | spatial search 2 |
| EV15 — Skork Rat | 40 | combat win 5 |
| EV16 — Giant City | 15 | chest opened 5; building completion 5 |
| EV17 — North Unification | 24 | movement completion 3; combat win 3 |
| EV18 — Light God Final | 50 | combat win 5 |
| EV19 — Ice/Snow Choice | 1 | one recorded ice-or-snow choice 1 |
| EV20 — Deep Sea Ark | 20 | chest opened 5 |
| EV21 — West Church War | 30 | combat win 5 |
| EV22 — Ancient Dragon Phase 1 | 20 | combat win 5 |
| EV23 — Ancient Dragon Phase 2 | 20 | combat win 5 |
| EV24 — Dragon Festival | 30 | chest opened 3; combat win 3 |
| EV25 — Abyss Expedition | 10 | spatial search 2 |
| EV26 — Gods Chaos | 60 | combat win 5 |
| EV27 — World Protector | 40 | combat win 3; building completion 3 |
| EV28 — Ancient Dragon Hunt | 50 | combat win 10 |
| EV29 — Final Calamity | 30 | combat win 5 |

The labels preserve the calendar identity, but generic combat, search, harvest or construction contributions do not spawn the source-named dragon, boss, faction or global contest. EV19 records exactly one branch while active; a second choice is rejected. These limits keep this bounded single-save layer honest about the incomplete source encounter catalog.

At the event’s fixed open boundary, the event shop becomes active. It has 10 shared-stock `EVENT-MARK-{eventId}` marks, priced at 5 earned and unspent contribution points each. Purchases atomically spend score, decrement stock and deliver a real inventory stack tagged with that event. A stale revision, insufficient score, unavailable destination, or insufficient stock cannot partially commit. The shop closes at contribution lock and expires at event resolution; remaining marks are not carried into a later event.

At the fixed resolution boundary, the runtime closes the shop, expires items scoped to that event, and settles the local objective once. `participated && objectiveProgress >= target` succeeds; positive participation below target fails; zero participation is a nonparticipant result. A successful objective earns `min(100, 10 + floor(score / 5))` Krona. One claim receipt can collect it during the seven-day claim window; unclaimed reward state expires at the exact deadline. No calendar transition by itself awards currency. EV01 continues to use its distinct frozen ranking contract and does not use this contribution overlay.

## Chest reward tables

`LL01-CHEST-POOL-RARITY-TYPE-1.0` resolves each chest from the save seed, chest commitment, chest ID, rule version and roll index. The server uses weighted draws with replacement, quantity bounds and atomic inventory-capacity checks. The player view exposes chest type, rarity, roll count, per-roll weights, chance of at least one, and the committed outcome after opening. Client data cannot provide the reward.

| Rarity | Rolls | Field pool per roll (weight; quantity) | Event pool per roll (relic / event mark) |
|---|---:|---|---:|
| Mộc | 1 | wood 50% (1–2), stone 30% (1–2), wild food 20% (1) | 50% / 50% |
| Thanh Đồng | 1 | wood 30% (1–3), stone 30% (1–3), wild food 20% (1–2), raw salt 20% (1) | 65% / 35% |
| Bạch Ngân | 2 | stone 25% (1–3), raw salt 25% (1–2), brown coal 25% (1–2), ice water 15% (1–2), wild food 10% (1–2) | 75% / 25% |
| Hoàng Kim | 2 | raw salt 25% (1–3), brown coal 25% (1–3), ice water 20% (1–3), wild food 20% (1–3), stone 10% (2–4) | 85% / 15% |
| Hạo Nguyệt | 3 | raw salt 25% (2–4), brown coal 25% (2–4), ice water 20% (2–4), wild food 20% (2–4), stone 10% (3–5) | 95% / 5% |

Each event pool contains only `EVENT-RELIC-{matchingEventId}` and `EVENT-MARK-{matchingEventId}`; no field resource or other event can leak into it. Each field pool contains only general resources. Multiple rolls use the displayed `1-(1-p)^rollCount` chance formula. Event chests can only be opened while their own event is active and before its contribution lock. Their reward stacks are event-exclusive and expire at that event’s resolution.

The fixed source package currently contains 192 field chests (139 Mộc, 37 Thanh Đồng, 11 Bạch Ngân, 4 Hoàng Kim and 1 Hạo Nguyệt) and no placed event-chest instances. The event-tagged table/opening path is compiled and tested for any correctly authored event chest. This implementation does not silently convert a field chest or invent 28 physical event chests; placing event chests requires an authored or separately approved location/availability rule. Source-catalog `SX-*` chest observations remain research-only and do not enter these tables.

## Finite wildlife and hunting

`LL01-FINITE-WILDLIFE-1.0` materializes each authored ecology count into stable groups of at most five animals with a possibly smaller final group. Each group records its ecology, species label, capacity, remaining count, generated-member ordinal, position, discovery and sighting timestamps. Positions are deterministic from the ecology/group ID and fixed regional radius. The opening H0 hare remains its separate authored encounter; one hare is excluded from the R0 group total so represented counts still conserve the source population.

Area-sweep search reveals only groups whose positions intersect the settled search corridor; the view projects known groups as combat targets and their remaining population. General wildlife combat creates one generated member at a time from the versioned profile, uses the existing server combat turn/reaction path, and decrements the group only when a member is killed. A kill creates the normal corpse/XP records; a hunt timer alone does neither. Depleted groups do not provide targets. Renewable herbivore groups regain at most one member per 24-hour settlement up to their original capacity; predators and other non-herbivore groups do not respawn.

Species combat profiles are explicit Stage 10 design defaults, not source anatomy/equipment profiles. The rules materialize regional counts as finite encounter groups; they do not implement the wider lair-hero, migration, breeding, ecological food-web or boss behavior systems.

## Shared demo and live UI

Demo and live use the same `PageFrame` screen shell and `ScreenHeading` layout. Character summary, event board, inspector frame and inspector heading are reusable components. The live registry now exposes nine screens, including server-backed Character and Events screens; the event board is available from both the Events screen and Overview. Entity and combat-target inspectors share the same semantic header and responsive frame while retaining their mode-specific facts and actions. Demo rows remain explicitly display-only; only live actions call the API and render the server’s `PlayerView`.

The shared layer standardizes outer layout, headings and inspector structure. Screen-specific map, inventory, territory, forces and construction compositions remain specialized where their interactions differ, so each page does not duplicate its own top-level shell or summary primitives.

## Save, migration and backup contract

The game-state schema is now 8; content and ruleset versions are `LL01-CONTENT-0.4.0` and `LL01-RULESET-0.4.0`. V7-to-V8 migration adds event shop/progress ledgers, chest result slots, known-wildlife IDs, finite groups and wildlife combat target storage. The migration replays a legacy EV02 blocked-at-open boundary as a scheduled row so the new mechanics settle that same boundary once; it does not backdate score or pay rewards for resolved old events. Event shop item lifetime and wildlife regeneration start at migration time for old saves.

Backup import validates event score against committed activity receipts, branch/claim consistency, fixed objective and reward rule versions, shop stock/score conservation, exclusive item expiry, chest reward hashes and event-pool scope, ecology capacity/depletion, and combat target linkage. Inventory conservation includes chest loot, event-shop delivery, consumption and resolved expirations. A client cannot make backup import accept arbitrary score, items or chest contents by editing the view model.

## Validation

Stage 10 acceptance is `npm run test:stage10` (9/9): all 28 objective rules are present; a schema 7 save resumes at the former EV02 blocker without rewinding or granting progress; EV19’s single choice settles and claims once; score-based shop purchases are atomic and event marks expire; a strict API backup round-trip preserves objective/claim/expiry receipts; rarity tables scale roll count and event tables stay event-specific; an event chest opening delivers only matching event-scoped items and contributes to its active objective; wildlife groups conserve/regenerate populations; and search followed by committed combat produces a corpse, XP and finite-population decrement.

`npm run content:compile` validates the event/rule coverage and chest pool sums before refreshing the generated world and content manifest. The broader backend suite and dependency-free frontend contract checks are recorded in the task validation output. A browser bundle/E2E run requires the pinned frontend toolchain; the checked-out workspace may not have the cached TypeScript/Vite/Playwright dependencies.

## Remaining boundaries

- EV01 local fixed-contender ranking is implemented from the P0 outcome ledger; it is not a network-wide leaderboard. The current 168h P0 acceptance passed for seed `bot-p0-acceptance-2026`; one seed does not establish cross-seed balance. EV02–EV29 remain player objective overlays without participant-ranked bot boards.
- The T0 fire fuel ledger and hourly weather seed are still missing from the active source package/initializer, so the source-grounded opening remains uncertified.
- No event chest is placed in the fixed source world; the type/rarity pool and gated open handler are available when one is authored.
- `SX-*` research candidates, source-event item effects/limits, auction seller liquidity, and non-opening lair/boss combat remain unpromoted.
- Frontend TypeScript, browser and viewport checks remain unverified when the offline workspace lacks pinned dependencies.
