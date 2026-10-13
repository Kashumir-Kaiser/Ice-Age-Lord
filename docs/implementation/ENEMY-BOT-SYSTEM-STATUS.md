# Enemy bot implementation checkpoint

Updated 2026-10-13.

## Current implementation

The bot runtime now includes versioned, deterministic survival and resource accounting; lord fate separate from residents and troops; finite water preparation; regional storm hazards; casualty cause ledgers; talent-adjusted combat and construction; persistent blueprints, chests, structures and territory levels; and a regional barter market. Bot saves migrate prospectively, and the benchmark accepts a horizon-independent seed and reports 24h, 48h, 144h and 168h checkpoints.

The implementation uses named bot overlays where the active source package has no executable rule. The water and winter-storm overlays are `BOT-FROZEN-WATER-LORD-SURVIVAL-1.0` and `BOT-REGIONAL-WINTER-STORM-1.0`; they are design rules, not claims about source canon. T+144h remains the opening board's close. T+168h is a separate simulation checkpoint.

The ranked opening contract now delivers food and medicine to bots, applies food at its award timestamp, and records applied/consumed quantities. Players can consume MEAT/BREAD reward stacks. Reward slots without an executable item contract remain frozen with a precise blocker and can be retried by their original slot ID if a handler becomes available. The current compiled content still blocks resource bags, ranked reward chests, recruitment scrolls, reward weapons and power hearts.

Bot exploration owns finite chests before opening and persists a deterministic loot receipt. A fixed world chest shares ownership with the player's chest state. Blueprint discovery produces an owned item that can be learned or listed; it is not automatically added to the learned list. Bot-to-bot listings escrow the item and transfer actual food or potable water from a qualified buyer. At Krona Gate, the live inventory market displays visible bot listings, compatibility and blockers, and exposes the purchase command when the player has a usable BREAD stack. The player purchase adapter supports `BP-BOT-WALL` paid with food. Defense currently uses passive structure modifiers in the shared settlement resolver; towers do not launch independent attacks.

## Focused verification completed on this checkout

| Check | Result |
|---|---|
| `node --experimental-strip-types packages/sim/test/botEconomy.integration.test.ts` | Passed: 27 tests in 6.3s. Covers 1s/3s/5s/irregular/large fixed-point integration, source exhaustion and caps, water and fatal exposure boundaries, durable casualty causes and migration, talent modifiers, defenses, territory, blueprint ownership, bot market food/water settlement, shared chest ownership and reward use. |
| `node --experimental-strip-types packages/sim/test/openingRewardHandlers.test.ts` | Passed: 3 tests in 4.6s. Covers exact T+144h qualification, frozen settlement at T+168h, MEAT consumption and resumption of a previously blocked slot when its handler is available. |
| `node --experimental-strip-types packages/storage/test/botReplay.integration.test.ts` | Passed: 2 tests in 10.6s. A 16-bot, 10-minute replay matches across one-shot, 3s, 5s, irregular and SQLite reload paths; SQLite startup migration preserves save revision and event history. |
| `node --experimental-strip-types --test --test-name-pattern='a player buys a bot blueprint' packages/sim/test/stage08.test.ts` | Passed: 1 focused player market test in 0.7s. |
| `node --experimental-strip-types --test packages/api/test/bots.test.ts` | Passed: 1 API test file in 15.9s. |
| `npm run content:coverage:stage08` | Passed in 1.2s; regenerated the report with EV01 marked as an executable ranked board. |
| `git diff --check` | Passed after code, UI and documentation edits. |

The frontend build was not available: `frontend/node_modules` and the root tool binaries are absent, including TypeScript, Vite and JSX parsers. The live market UI change is therefore not frontend-compiled or browser-tested in this checkout.

The full `npm run test:bots` and multi-day Stage 08 suite were not run, as the supplied prompt excludes those expensive suites from the initial focused schedule. The Stage 08 multi-day test had previously been interrupted after approximately 4h37m and is not a pass.

## Long-run results and limits

The current P0 acceptance run used a fresh 1,023-bot roster, seed `bot-p0-acceptance-2026`, and actual advancement through 168 hours. It completed in 67.421 seconds, below the 180-second cap, and passed `verifyBotPopulation`. Every checkpoint retained 1,023 active settlements and living lords. EV01 settled once at exactly T+144h with 100 rows and remained frozen at T+168h; snapshot hash `7db3df53f34abaf39b05665b0df6b506d33ed194f8f08cc85bb050457496cb71`.

| Hour | Active settlements / living lords | Residents | Recorded resident/troop losses | Cumulative loss causes | Opening board |
|---:|---:|---:|---:|---|---|
| 24 | 1,023 / 1,023 | 18,234 | 1,110 | battle 1,004; wildlife 106 | not published |
| 48 | 1,023 / 1,023 | 17,537 | 1,807 | battle 1,698; wildlife 109 | open, 100 rows |
| 144 | 1,023 / 1,023 | 17,460 | 1,884 | battle 1,770; wildlife 114 | settled, 100 rows and 100 bot reward receipts |
| 168 | 1,023 / 1,023 | 17,454 | 1,890 | starvation 5; battle 1,770; wildlife 115 | frozen at 100 rows |

No lord was eliminated in this seed. By grade, living lords were S/A/B/C/D 2/51/205/358/407. Recorded resident/troop losses by grade and talent kind were:

| Grade and kind | Roster | Living lords at 168h | Resident/troop losses |
|---|---:|---:|---:|
| S combat | 1 | 1 | 0 |
| S production | 1 | 1 | 4 |
| A combat | 24 | 24 | 30 |
| A production | 27 | 27 | 32 |
| B combat | 93 | 93 | 185 |
| B production | 112 | 112 | 141 |
| C combat | 172 | 172 | 452 |
| C production | 186 | 186 | 243 |
| D combat | 221 | 221 | 565 |
| D production | 186 | 186 | 238 |

By 168h, bots had applied 1,630 opening food items to food stock; 163 opening reward slots remained blocked by compiled-content gaps. The simulation recorded 60 completed blueprint trades (662 food and 67,000 mL water paid), 401 opened finite chests, 191 active defensive structures, and territory levels 2/3 across all settlements (930 at level 2, 93 at level 3). These are observations from this seed, not cross-seed guarantees. The two S specialists were both explicitly present and survived; their one-bot-per-kind samples are too small for a talent-wide mortality claim.

Performance: initialization 739ms, advancement 66,496ms, integrity verification 163ms, peak RSS 750 MiB and heap 508 MiB. The run completed 29,895 actions, 74,622 integrated bot segments and 133,620 planner expansions.

The three earlier 32-bot diagnostics used seeds `bot-balance-01`, `bot-balance-02` and `bot-balance-03` on the prior implementation. All 32 settlement actors remained active. Residents / combined recorded deaths were 572/60, 551/73 and 562/75. Each roster used S/A/B/C/D counts 2/4/8/9/9 and the runs lacked lord-fate or cause ledgers. They remain historical diagnostics, not current-checkout validation. No 10k/100k stress run was started.

## Remaining compiled-content blockers

- EV01 is the only executable participant-ranked bot board. EV02–EV29 have no participant-scoped score and settlement contracts for bots; player event objectives and calendar entries do not provide those contracts.
- The active reward contract names resource bags, silver/black-iron reward chests, recruitment scrolls, several weapon slots and power hearts, but the repository has no complete matching contents, item effects or choice pools for them. These entitlements remain pending with explicit blockers; they are not silently replaced or claimed as usable.
- The source has no shared potable-water market currency or player conversion path. Bot barter supports water; player purchases support food only.
- Bot structures provide passive defense values. There is no source-backed staffed tower, ammunition or autonomous attack contract.
- Bot-only blueprint templates are versioned overlays. Only the wall blueprint has a player construction adapter; the other bot blueprints cannot be sold to the player.

See the [system guide](ENEMY-BOT-SYSTEM.md) for the supported boundary and overlays. The current-checkout 168h P0 run verifies one deterministic seed; it does not establish cross-seed balance or population-wide mortality rates. Reward-content blockers and the unverified frontend build remain listed above.
