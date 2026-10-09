# LORD DND — FOURTH EVENT REWARD EXTRACTION (v0.4)

**Status:** new-game source research only; no changes to active File 01, File 05, manifests or campaign saves.

## Coverage

- Parent v0.3: **189** rows preserved byte-for-byte at the parsed-record level.
- Verified fourth-pass additions: **20** atomic records; **209** total.
- Two direct full-content panel sources: **Ch.372** and a site-labeled **Ch.1147** (other indices shift one chapter).
- Reconciled **30**-event v0.6 schedule unchanged.
- Not an exhaustive fourth scan of all event chapters. No inferred inventory entries were added for EV22/23/27.

## A. EV24 Dragon power test — direct source reward panel

**Chapter source:** [Ch.1147 full reward excerpt](https://sto55.com/book/41597/29275919.html). [Alternate cached copy](https://m.xsw.tw/1756924/254603502.html). **Important:** same chapter content may be indexed as Ch.1146 in some catalogs.

| Evaluation | Dragon coins | Chest award |
|---|---:|---|
| E | 10 | 1 Rương Bạch Ngân |
| D | 30 | 2 Rương Bạch Ngân |
| C | 50 | 1 Rương Hoàng Kim |
| B | 100 | 2 Rương Hoàng Kim |
| A | 300 | 1 Rương Hạo Nguyệt |
| S | 500 | 2 Rương Hạo Nguyệt |
| SS | 1,000 | 2 Rương Hạo Nguyệt |
| SSS | 5,000 | 1 Rương Xích Tiêu |

Source states ratings accumulate to reach highest grade: **SSS is described as all smaller payouts combined**. It explicitly lists 1 Xích Tiêu, 5 Hạo Nguyệt, 3 Hoàng Kim and 3 Bạch Ngân chests.

**SOURCE CONTRADICTION:** line-by-line dragon coins sum to **6,990**, but the narrative states **6,980**. The 10-coin discrepancy is **not resolved**. Import the eight original grade receipts while keeping a blocking `SOURCE_TOTAL_CONFLICT` on the cumulative-display sum; do not silently alter E-level rewards to force the prose total.

The novel promises an additional mystery prize for retaining top-100 placement at the event close, but **does not identify that prize in this chapter**. Therefore it is a mechanic lead, not a minted item.

**Gameplay adaptation:** the fixed T0 calendar controls when this source system may run. The output test must use the actual compatible combat simulation; no static win/SSS assumption based on the original protagonist.

## B. EV08 Ice Dragon Core — three chest conversion paths and one direct-points use

**Chapter source:** [Ch.372 item inspection](https://www.69shuba.com/txt/58776/39296205).

| Source action | Cost | Result |
|---|---:|---|
| Direct use | 1 Hạch Băng Long | 2,000 event points |
| Exchange | 1 Hạch Băng Long | 1 Rương Bạch Ngân Cự Long |
| Exchange | 10 Hạch Băng Long | 1 Rương Hoàng Kim Cự Long |
| Exchange | 50 Hạch Băng Long | 1 Rương Hạo Nguyệt Cự Long |

The core is source-described as Epic/orange and **non-tradeable**. The chapter links it to combat against a specific target; it does not justify a 100% drop rule for every monster of that type. The four choices all spend the **same underlying core inventory**, and a consumed core cannot also grant points or a second chest.

The chapter states that the dragon chests had their equipment pool adjusted after a version update. This establishes a **versioned chest pool**, not numerical drop rates or an excuse to revise previously sealed LL01 chests.

## C. What was found but not promoted into source-explicit rewards

| Event | Chapters / leads | Blocker |
|---|---|---|
| EV22–23 | 1079–1080, 1086, 1108, 1122–1125 | Shop openings, special blueprint and settlement chapters are indexed; actual offer names, prices and limits remain unavailable from verified readable chapter bodies |
| EV24 | 1137; 1148–1149 | Golden shop and War Lord chestpiece mentioned in titles; exact vendor rows/claim conditions not yet confirmed |
| EV24 / later festival | 1236 | Starry Dragon Wings and 14,600 Ancient Coin Bags mentioned in a chapter excerpt, but timing is outside the fixed EV24 source window, so mapping remains pending |
| EV27 | 1330–1338 | Upper神器/throne reward titles but no verified per-tower entitlement; no guessed drop rows |

### Chapter 1236 research evidence (not a new entry)

- [Ch.1236 excerpt](https://www.suduguu.com/1757/3006664.html) describes a later season settling and an earlier purchase/exchange from dragon-wing merchant Glen Goldscale of **Starry Dragon Wings** and **14,600 Random Ancient Coin Bags**.
- These are source leads with ownership and chronology issues, not proof that 14,600 units were universally stocked, obtainable in EV24 during the source window, or free rewards. They remain unimported.

## D. Non-negotiable import conditions

1. **Cumulative reward receipts**: an SSS combat-test result must not create eight grades twice; distinct grade item lines share a `reward_group_id` and one claim transaction.
2. **No event-chest content assumptions**: the fourth pass records which grade of chest is rewarded, **not** its contents.
3. **Source arithmetic mismatch**: preserve each stated payout and flag the 6,980 vs 6,990 total. Do not present the prose sum as verified.
4. **Alternative redemption**: the Dragon Core choices consume real inventory atomically; the non-tradeable restriction persists.
5. **No retroactive state editing**: do not issue core/chest coins to historical saves from source research.
6. **No fictional shop closure**: tests, exchange shops and other event reward channels follow their actual availability and version; game timeline is frozen before T0.
7. **No late source title mining**: chapter index text cannot by itself establish item statistics, drop rates, shop prices, or award trigger.

## QA

- Records: 189 + 20 = 209.
- New records: unique IDs `SX-0190`–`SX-0209`.
- 30 event definitions: unchanged from v0.3 / fixed timeline v0.6.
- Every new entry: readable chapter excerpt with URL and exact reward amount / exchange threshold.
- Conflict: source cumulative Dragon coin arithmetic deliberately flagged, not silently repaired.
- Active game rules and saves untouched.
