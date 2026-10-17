# Enemy bot implementation checkpoint

Updated 2026-10-13.

## Completed behavior

- Every bot now owns a separate 100-HP normal-human lord. Personal food, water and cold exposure advance independently of resident and troop counts. Fatal hits and deprivation settle through one idempotent death path; only actual lord death removes the owner from the active scheduler, removes structures and transfers held resources/blueprints into one non-respawning remains chest.
- Direct player contact and bot raids resolve actual personal attacks separately from troop attrition. An exposed lord can attempt a persisted, ordinary-speed route using finite carried food and water; failed or unavailable escape remains an encounter. A lord can be killed while the entire army survives.
- EV01 freezes its source-qualified top-100 standings and settles bot rewards once under save/event/participant/reward identities. Committed food and medicine use their actual handlers; unsupported reward slots retain explicit blockers. EV19's implemented player choice reward settles and claims Krona once across reload and retry.
- Bots and players share fixed chest ownership and deterministic loot receipts. Blueprint discovery, learning, construction, escrow and trade use saved item identities and real balances. Water uses finite stock and conversion. Emergency listings only pay after a real qualified buyer transfers funds.
- The map now pools SVG marker and settlement-object nodes by stable entity keys. Promotion binds current saved structures and cohorts; demotion resets slots and releases listeners. The opening board retains its sorted 100-row cap and persisted ID-to-rank index.
- Bot migrations initialize missing personal owners as living, without converting historical resident or troop losses into lord deaths or granting past exposure/supplies. They rebuild active-lord and ranking indexes, refresh integrity hashes and restore scheduler wakes.

## Focused checks

| Check | Result |
|---|---|
| `timeout 30s node --experimental-strip-types --test-reporter=spec packages/sim/test/botEconomy.integration.test.ts` | Passed 27/27 in 4.96s. Covers fixed-point conservation, survival boundaries, resident extinction, water, rewards, defense, chests, blueprints, market, and legacy route migration. |
| `timeout 30s node --experimental-strip-types --test-reporter=spec packages/sim/test/botOwnerIntegration.test.ts packages/sim/test/botLordSurvival.test.ts` | Passed 7/7 in 6.65s. Covers empty settlements, personal HP/death, remains, reload, and routed escape. |
| `timeout 30s npm run test:bot-domain` | Passed all four domain files in 11.80s, including opening ranking and event settlement/reload coverage. |
| `git diff --check` | Passed after the implementation edits. |
| GitHub Actions `Focused frontend checks` | Pending for the current commit. TypeScript/TSX, Vite production build, and existing frontend smoke tests must be reported from this workflow; no local frontend build or test was run. |

The cohort diagnostic is `npm run diagnose:bots-survival`. It uses the production scheduler and virtual time, checks the standard 1,023-bot roster, records alive/dead totals, tier and condition mortality, cause counts, and concise death traces. The final three-seed run completed in 14.238 seconds under the 120-second cap.

## Measured calibration results

These are simulation observations for `cal-tune-1`, `cal-tune-2`, and `cal-tune-3`, not predictions about real-world survival. The three 1,023-bot rosters contributed 3,069 bot-time observations at each checkpoint. Every measured death in these seeds was caused by cold exposure. No additional deaths occurred between day 3 and day 7.

| Checkpoint | Alive | Dead | Mortality |
|---|---:|---:|---:|
| Day 1 | 2,896 / 3,069 | 173 / 3,069 | 5.64% |
| Day 3 | 2,737 / 3,069 | 332 / 3,069 | 10.82% |
| Day 7 | 2,737 / 3,069 | 332 / 3,069 | 10.82% |

| Tier (roster per seed) | Day 1 deaths / rate | Day 3 and 7 deaths / rate |
|---|---:|---:|
| S (2) | 0 / 6 · 0.00% | 0 / 6 · 0.00% |
| A (51) | 8 / 153 · 5.23% | 18 / 153 · 11.76% |
| B (205) | 36 / 615 · 5.85% | 68 / 615 · 11.06% |
| C (358) | 54 / 1,074 · 5.03% | 108 / 1,074 · 10.06% |
| D (407) | 75 / 1,221 · 6.14% | 138 / 1,221 · 11.30% |

At day 3/7, deaths among resource-stressed lords were 269/476 (56.51%); post-battle lords were 63/753 (8.37%); safe lords were 0/1,840. No bot had a recorded faction-support delivery. Within the resource-stressed group, mortality was A 13/32, B 52/93, C 91/158 and D 113/193. Across these three seeds D had greater aggregate mortality than B and C, while individual-seed and tier ordering varied; the six S-tier observations are too small to support a tier-wide survival claim.

Example causal trace: `BOT-P0-0020` (D, seed `cal-tune-3`) died from cold at day 0.494 with 16 residents and 3 troops still present, no food/water/firewood stock, and no active keep/hearth. `RC-010` (B, seed `cal-tune-1`) died at day 0.492 with the same empty-store/no-shelter pattern. The death path records 15 micro-HP preceding the lethal cold boundary, not a troop or population threshold.

## Real limitations

- Only EV01 has an executable participant-ranked bot settlement. EV19's current handler is a player choice/Krona claim; the source-described faction/rank board and other event-contract entries are not executable bot boards. No future board or generic rank score is invented.
- The compiled opening reward payload still contains blocked resource bags, ranked chests, recruitment scrolls, weapon choices and power hearts because their matching contents/effects are absent. EV01 pays only handlers with actual effects.
- Bot factions and faction aid are not defined by the active bot/content contract. The support resolver accepts an explicit, recipient-bound delivery, but no ordinary bot AI currently creates such a delivery; calibration therefore reports `supported: 0`. Existing operational keeps/hearths and finite fuel affect cold exposure through their actual structures and stores.
- Bot buildings supply passive defense values. The source does not define staffed tower attacks, ammunition or autonomous garrison fire. Only the wall blueprint has a player construction adapter, and the player market has no potable-water payment path.
- The three-seed calibration shows no further mortality after day 3 in these runs. That is a measured plateau, not a guarantee for other seeds or developed states.

See the [system guide](ENEMY-BOT-SYSTEM.md) for rules and overlays. The uploaded completion prompt was instructions for this work; it was not added to the repository.
