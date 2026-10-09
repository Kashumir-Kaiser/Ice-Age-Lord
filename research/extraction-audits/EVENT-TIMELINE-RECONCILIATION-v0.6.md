# LORD DND — RECONCILED SOURCE EVENT TIMELINE v0.6 (RC1)

**Status:** PRE-T0 proposed release candidate, not an active File 01/File 05 replacement. **30 event IDs retained.**
**Inputs:** File 01 `CANON-EVENT-LEDGER-4.0`, File 05 runtime references, the previous 157-entry source catalog v0.2, additional original-novel chapter verification.
**Purpose:** Correct provable timeline and event-model contradictions **once, before a new web-game world is seeded**, while retaining historical original timestamps and a rollback/migration path.

## 1. What was wrong and what is fixed

| Event | Former setup | Novel evidence | v0.6 choice |
|---|---|---|---|
| **EV08/EV09** | 3-day challenge and 3-day Oracle War | Ch.362: ten-day second Dragon challenge gives Oracle access, Oracle lasts **one month**; ch.454 finishes the month | EV08 10 days, EV09 30 days, chained sequentially |
| **EV10** | Seven days of monster attack | Ch.479-483: **seven development days, then ten waves** of an attack starting at midnight | Explicit preparation then one bounded **ten-wave siege** (24h event budget is campaign adaptation, not quoted source) |
| **EV14/EV15** | Dream 100 days; rat 7 days **after** it ends | Ch.809/810/819: Dream 100 days, rat opens ~24 hours later for 30 days, **overlapping** | EV15 opens 24h after EV14, lasts 30 days, ends while Dream still active |
| **EV15 reward model** | Rat purge leaderboard plus `SHOP-SKORK` | Ch.819/824/829/830: drops from silver/gold/king rats, treasure bags, global first kill, and cumulative-kill achievements | Use these source channels; fictional scoreboard/shop remain explicitly rejected from *source-based* game mode |
| **EV05** | Universal fishing rank + ticket shop | Ch.260: local NPC-sponsored Anno fishing competition, 3000 Krona fee, specific rank rewards | Fixed-time **local contest**, not global recurring shop |
| **EV14 shop** | Legendary blueprints appear only when bought late | Ch.811 includes them in initial listed shop; Ch.892 only documents later purchases | Shop offer visibility at event opening; actual purchase separate |

### Important source inconsistency (not silently corrected)
Novel ch.809 describes Dream launch during upheaval day 63. Novel ch.829 says rat final day is upheaval day 94 but Dream has 59 days left. With a 100-day Dream event, day-63-to-day-94 is 31 days elapsed, which implies **69 days** left, not 59. These statements cannot all be exact simultaneously. v0.6 follows directly announced event durations (100/30 days) and the 24-hour start offset, marking the novel daycount contradiction `SOURCE_INTERNAL_CONFLICT`.

Novel ch.819 presents rat rarity rates 95%/5%/0.01%, which add to 100.01%. Keep those as **displayed source rates**, not as a mathematically exact categorical sampling contract. Explicit optional adaptation: relative integer weights 9500:500:1, normalized over 10001; retain `DESIGN_DEFAULT` provenance and approval requirement.

## 2. Complete 30-event proposed fixed timeline

| Event | Old open/lock/resolve (h) | **New open/lock/resolve (h)** | New opening day (from T0) | Source status |
|---|---|---|---:|---|
| EV00-SAFE-FIRE | 0/144/144 | **0/144/144** | 0.0 | SOURCE_DURATION_KEPT_CAMPAIGN_ANCHOR |
| EV01-OPENING-LEVEL | 48/144/144 | **48/144/144** | 2.0 | SOURCE_DURATION_KEPT_CAMPAIGN_ANCHOR |
| EV02-DRAGON-REVIVAL | 144/312/336 | **144/312/336** | 6.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV03-ICE-HORN | 192/264/288 | **192/264/288** | 8.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV04-FIRST-MERGE-DRAGON-POINTS | 312/552/576 | **312/552/576** | 13.0 | SOURCE_DURATION_KEPT_CAMPAIGN_ANCHOR |
| EV05-ANNO-FISHING | 408/480/504 | **408/480/504** | 17.0 | SOURCE_LOCAL_CONTEST_CAMPAIGN_DATE |
| EV06-CONSTRUCTION-WEEK | 552/720/720 | **552/720/720** | 23.0 | SOURCE_DURATION_KEPT_CAMPAIGN_ANCHOR |
| EV07-KINGDOM-WRATH | 720/792/816 | **720/792/816** | 30.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV08-WORLD-BOSS | 792/864/888 | **792/1032/1056** | 33.0 | SOURCE_10_DAY_QUALIFIER_CAMPAIGN_ANCHOR |
| EV09-ORACLE-WAR | 864/936/960 | **1056/1776/1776** | 44.0 | SOURCE_ONE_MONTH_GAME_CALENDAR_30D |
| EV10-MONSTER-SIEGE | 936/1104/1128 | **1944/1968/1968** | 81.0 | SOURCE_10_WAVES_ONE_EVENT_CAMPAIGN_24H_BUDGET |
| EV11-MIST-DISASTER | 1104/1200/1224 | **1968/2064/2088** | 82.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV12-LEGION-RACE | 1200/1368/1392 | **2088/2256/2280** | 87.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV13-BLOOD-CHAOS | 1368/1536/1560 | **2280/2448/2472** | 95.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV14-DREAM-SHARD | 1560/3960/3984 | **2472/4872/4896** | 103.0 | SOURCE_100_DAY_DURATION_REBASED |
| EV15-SKORK-RAT | 3984/4152/4176 | **2496/3216/3240** | 104.0 | SOURCE_30_DAY_OVERLAP_REBASED |
| EV16-GIANT-CITY | 4176/4248/4272 | **3240/3312/3336** | 135.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV17-NORTH-UNIFICATION | 4272/4440/4464 | **3336/3504/3528** | 139.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV18-LIGHT-GOD-FINAL | 4464/4632/4656 | **3528/3696/3720** | 147.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV19-ICE-SNOW-CHOICE | 4656/4824/4848 | **3720/3888/3912** | 155.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV20-DEEP-SEA-ARK | 4848/4920/4944 | **3912/3984/4008** | 163.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV21-WEST-CHURCH-WAR | 4944/5112/5136 | **4008/4176/4200** | 167.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV22-ANCIENT-DRAGON-P1 | 5136/5208/5232 | **4200/4272/4296** | 175.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV23-ANCIENT-DRAGON-P2 | 5232/5304/5328 | **4296/4368/4392** | 179.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV24-DRAGON-FESTIVAL | 5328/5496/5520 | **4392/4560/4584** | 183.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV25-ABYSS-EXPEDITION | 5520/5688/5712 | **4584/4752/4776** | 191.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV26-GODS-CHAOS | 5712/5880/5904 | **4776/4944/4968** | 199.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV27-WORLD-PROTECTOR | 5904/6072/6096 | **4968/5136/5160** | 207.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV28-ANCIENT-DRAGON-HUNT | 6096/6168/6192 | **5160/5232/5256** | 215.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |
| EV29-FINAL-CALAMITY | 6192/6360/6384 | **5256/5424/5448** | 219.0 | CAMPAIGN_FIXED_UNVERIFIED_ABSOLUTE |

The offsets above are measured from **T0 of a fresh game world**, not from a player's local wall-clock or story chapter release date. Source-proven **relative durations** and phase ordering are distinguished from **campaign-authored absolute timestamps**. Every entry is precommitted before T0. Overlaps are permitted when source requires them.

## 3. Event runtime mechanics corrections

### EV08 → EV09: qualifier and month-long battlefield
- EV08 240h activity / 24h claim buffer. Qualifying leaderboard finalizes before EV09 admission; actual named rewards remain their existing source/LL01 contracts unless explicitly revised.
- EV09 begins on EV08 resolution. One-month duration, independent faction/objective processing. Selection/participation constraints respect source-specific admission; do not send every player in automatically.
- No dynamic level scaling introduced just to mimic the source: LL01 explicitly rules it out. Label the departure.

### EV09 → EV10: seven development days, then siege
- Seven days of development **after** Oracle War ends (`+1776h -> +1944h`), which is a **preparation phase**, not ten days or a week of waves.
- Ten distinct wave events (`SIEGE_WAVE_01..10`), one wave’s reward only if that wave actually clears. Their exact clock spacing is a **campaign design configuration**, **not an extracted source number**.
- The upper event window is 24h as a practical design budget. This is **not** a claim that the novel gives a 24h siege duration.
- Prior 3 extracted chest waves are samples, not full reward table; all 10 waves need preauthored independent reward receipts (unknown rows are `NEEDS_SOURCE_VERIFICATION`, not auto-generated).

### EV14 + EV15: real concurrency
- Dream starts at +2472h and stays active for 100 days; no automatic early end when Rat event ends.
- Rat begins +2496h (24h later), locks +3216h (30 days later), resolves +3240h. Dream continues through +4872h.
- Rat event is **hunt for physical source-event enemies with treasure bags**, not nest elimination quest points; no source-verified `SHOP-SKORK-1.0` or `SKORK_PURGE` scoreboard.
- Source character-specific observed Rat King first kill and 10/100/1000 achievements remain separate claim contracts.
- If source-eligible rats disappear into light on death, no corpse minted to enable Tử Phục; the sealed bag remains a real reward.

### EV05: Anno is an actual local festival
- Chapter 260’s competition uses source-specific entrance and rankings: 3,000 Krona registration, 1st prize choice of 125 goblin workers **or** 500,000 Krona; 2nd choice 3 rank-2 elite knights or 300,000 Krona; 3rd choice 5 rank-2 normal knights or 100,000 Krona.
- Travel/access, local NPC operator and fish scoring require real local conditions; not a global shop or rank board; chapter source terms control whether catches are species weighted.

### Reward/shop temporal separation
- `announcement_at`, `entry_open`, `offer_visible_at`, `purchase_at`, `contribution_deadline`, `claim_deadline`, `instance_commit_at` and `source_exclusive_expiry` are different axes. One event triplet alone is inadequate.
- The dragon shop and its later update must be separate **offer groups** so earlier chapter-118 inventory does not expire just because one dragon sub-event closes; no fake shop closure on EV02 if the same shop is still used by EV03/EV04.
- No event-exclusive chest can mint after its expiry; precommitted owner rewards escrow before expiry. Ordinary wave chests with event provenance are **not necessarily** themed exclusive templates.
- All event-specific shops and loot candidate sets must have immutable `scope`, `origin_event_id`, `offer_group_id`, `availability`, `contract_hash`, `item_instance_id` and `acquisition_channel` as applicable.

## 4. Source chapter evidence

| Chapter | Source evidence | URL |
|---|---|---|
| 260 (EV05) | Anno contest is local, not global ticket-shop event | https://www.69shuba.com/txt/58776/38994668 |
| 362 (EV08) | Second dragon qualifier 10 days; selection for Oracle scenario | https://www.69shuba.com/txt/58776/39274880 |
| 362 (EV09) | Oracle battlefield lasts one month | https://www.69shuba.com/txt/58776/39274880 |
| 454 (EV09) | Oracle war concludes after a month | https://www.69shuba.com/txt/58776/39496152 |
| 479 (EV10) | Seven development days then ten siege waves announced | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_480.html |
| 480 (EV10) | Waves begin at midnight | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_481.html |
| 483 (EV10) | Ten waves cleared, source rewards | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_484.html |
| 809 (EV14) | Dream begins, rat starts 24 hours later | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_812.html |
| 810 (EV14) | Dream duration 100 days | https://www.69shuba.com/txt/58776/40564813 |
| 819 (EV15) | Rat event 29d 23h59m remaining at launch; rat silver/gold/king spawns | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_822.html |
| 829 (EV15) | Last day Rat on upheaval day94; Dream described as 59 days remaining (in tension with dream start day63) | https://www.69shuba.com/txt/58776/40564832 |
| 824 (EV15) | Rat hunting milestone rewards | https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html |

## 4a. Further shop provenance correction (post-schedule QA)

**Three shop entries were misassigned to early Dragon Revival in v0.2:**

| ID | Item | Previous owner | Correct offer owner | Verified novel placement |
|---|---|---|---|---|
| `SX-0014` | Trái Tim Sức Mạnh Cao Cấp | EV02 | **EV08** / `SHOP-DRAGON-PHASE-II` | Chapter 362 |
| `SX-0015` | Bản vẽ Tháp Tên Băng Sương Chuyên Gia | EV02 | **EV08** / `SHOP-DRAGON-PHASE-II` | Chapter 362 |
| `SX-0016` | Bản vẽ Tường Băng Sương Chuyên Gia | EV02 | **EV08** / `SHOP-DRAGON-PHASE-II` | Chapter 362 |

Their original `event_id` is preserved as `legacy_event_id` on the **same original record ID**; item counts are unchanged. The base Dragon Shop is a **shared offer group** serving multiple Dragon event milestones, not a storefront that shuts down on EV02 while Dragon events are still active. A game-specific expiry at the EV08 lock is authored as `CAMPAIGN_FIXED`, not a source-exact closing date. The source has not established full stock replenishment rules.

**Chapter 892 Dream items** `SX-0098`–`SX-0100` are *purchase observations*, not first visibility. The relevant Dream offers were listed by Chapter 811. We corrected their entry notes and recorded `visible_from_source_chapter=811`; no extra item duplication.

### Important activation blockers, not silently patched

- **Oracle War calendar month:** the novel says one month, without providing a globally reusable fixed-hour definition. This web-game candidate uses **30 days** as a declared calendar adaptation, rather than misattributing 720h to the novel.
- **Monster Siege wave timing:** the chapter supports ten waves starting after preparation, not a precise equal-spaced `24h/10` wave schedule. Wave deadlines and all ten reward rows remain incomplete and **cannot be made source-exact from the three sampled rewards**.
- **Rats:** the displayed 95%, 5%, 0.01% need normalization or explicit exclusive hierarchy before implementation. Proposed 9500:500:1 is **not** source-exact.
- **Event-only shops:** `SHOP-SKORK-1.0` and `SHOP-FISH-1.0` in File01 remain **legacy campaign inventions**, not novel-proven inventories. The source-faithful game pack sets them to no event shop.

## 5. Integration and migration rules

1. The original files `LORD-DND-01 v2.7.0`, `LORD-DND-05 v3.2.0` and release lineage manifest remain untouched. A proper new File 01 release and a new File 05 binding release are **required to activate** this proposed clock. Do not overwrite the active semver or silently edit those files.
2. The old v0.2 extraction remains historical evidence; the new JSON includes every old timeline triplet and the source-backed 157 entries, rather than silently deleting source data.
3. Event clocks are frozen **before clean T0**, independent of how fast Lí Lan progresses. Replaying an existing campaign with a new clock requires explicit save migration and consistent revalidation of open shops, rank snapshots, chest mint/ownership and event claim windows.
4. New or renamed source offer catalogs for EV05, EV10, EV14 and EV15 must be materialized and hashed before the first eligible event opens. No placeholder stock, no assumed probabilities.
5. File 05 currently commands consumers to read `CANON-EVENT-LEDGER-4.0` from File 01 §14.3; update **both** in a versioned release together or the game will use the old dates. The reference release manifest must be updated only after digest validation.
6. Any already accepted campaign save or legacy D1 checkpoint is **not** reinterpreted as though these new events always ran. Fresh-game-only by default.

## 6. Test gates for release

- Exactly 30 original IDs; no duplicate event IDs; all offsets parse; every event opening precedes lock and resolution.
- EV08 10 days, EV09 30 days; EV10 7-day preparation and 10 waves.
- EV14 100 days; EV15 starts +24h and lasts 30 days; both concurrently active for 30 days minus 24h.
- EV15 no legacy `SHOP-SKORK` storefront; Rat bag, boss ground drop, first kill and hidden milestones distinguished.
- EV05 local fish contest not global point-ticket market in source-pure mode.
- No reissued expired event-exclusive reward via shop, chest, auction, item dismantle or fallback loot pool.
- Source internal day-count and Rat spawn percentage contradictions remain flagged, not covered by fabricated assertions.
- No mutation of currently active File01/File05/saves unless accompanied by new release/hash/migration.
