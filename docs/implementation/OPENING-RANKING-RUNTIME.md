# Opening ranking runtime

The P0 opening board now computes outcomes from a local single-player simulation. The source contract stays authoritative for the roster, anchors, forecast formula, +48h/+144h window, level-10 qualification, three-minute display delay, tie order, 100-row cap and seven fixed reward bands.

The runtime uses forecasts only to set each rival’s action interval. At each scheduled encounter it records the actor, time, finite prey groups, rations, firewood, XP awarded, level change and result. Encounter XP follows File 02’s base combat formula `20 × EnemyLevel^1.45 × RankMult`; the opening same-tier multiplier is 1. Each encounter consumes one finite local group and awards XP for the group members actually engaged. Group size cycles through 1–3 from the stable actor/action ordinal, capped by the rival’s troop-fit budget. No target is respawned when a field is depleted.

File 07 provides habitat classes and supply priors but does not enumerate each rival’s exact consumable stock. The versioned `OPENING-RIVAL-ACTION-OVERLAY-1.0` therefore uses these explicit design defaults:

| Starting environment | Finite prey groups |
|---|---:|
| Target-rich | 84 |
| Ruin-rich | 74 |
| Chest-rich | 70 |
| Resource-rich | 66 |
| Safe sustain | 62 |
| Trade hub | 54 |

Initial rations are `12 + floor(SupplyPrior / 4)`, with one unit consumed every 12 hours. Firewood is `2 + floor(SupplyPrior / 20)`, with one unit consumed each world-day. Missing rations or a missed firewood resupply consumes that scheduled action as recovery and awards no XP. These are finite P0 simulation budgets, not additions to Lí Lan’s inventory or revealed wildlife counts.

The expected action count uses the level threshold function and an average two-target encounter. The rival’s File 07 projected duration divided by that action count gives its schedule interval. At runtime, the actual encounter group, finite supplies and accumulated XP determine whether and when that rival reaches level 10. The public board sorts only saved level-10 timestamps and stable IDs; neither forecast values nor prior rank can award a row or payout.

Opening reward rows freeze a deterministic instance ID and the exact contract payload at settlement. Fixed slots can be claimed into the carried inventory once. Slots that require an uncompiled candidate pool, such as a random tier-2 recruitment scroll or a selected green weapon, remain blocked individually; they do not change the rest of the rank band. The claim receipt is separate from the hashed settlement snapshot, so retries and reloads cannot rewrite the result or duplicate delivery.

Validation lives in `packages/sim/test/openingRankingRuntime.test.ts`: one-shot and hourly advances produce identical action ledgers and rank snapshots; migration preserves old blocked settlements; claim delivery, reload and duplicate-claim behavior are checked against the frozen snapshot.
