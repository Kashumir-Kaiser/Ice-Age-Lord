# LORD DND — Event and World Mechanics Source Extraction Round 15 (v1.5)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.4-ON-TIMELINE-0.6` — **295 item/reward records, 36 effect contracts, 17 research observations**. **Scope:** source research only, no activated gameplay or world-state migration. Date: 2026-10-09.

## 1. Investigation result and verifiable evidence

The high-priority EV22/23 Ancient Dragon, EV24 Golden Shop and EV27 six-tower chapter names were located in full chapter indexes, but repeated searching did not establish **readable, itemized text with prices and claim conditions**. Titles such as `第1108章 隐藏商店`, `第1138章 清空黄金商店` and `第1330章 四塔通关` are **navigational evidence, not reward panels**. No reward, price or stock quantity from those late-game headings is promoted.

The round instead directly extracts previously missing operational rules from full on-topic novel passages: [Ch117 — novice-protection update](https://czbooks.net/n/s6ojlf/s66md8o4?chapterNumber=117), [Ch118 — reputation and title chances](https://czbooks.net/n/s6ojlf/s66md8oa?chapterNumber=118), [Ch141 — tavern staffing and broadcast](https://czbooks.net/n/s6ojlf/s66m51g7?chapterNumber=141), [Ch171 — delivered Ice Nest hunt loot and medium horn](https://xszj.org/b/388493/c/17504811), and [Ch253 — repeat activation after cooldown](https://czbooks.net/n/s6ojlf/s66ec0k7?chapterNumber=253).

## 2. New observed source batch: SX-0296 (Ch171)

Eliza brings back this **one-day, one-squad field hunt result**, not an assumed daily yield:

| Source identity | Amount observed |
|---|---:|
| `冰川裂片` — Mảnh Băng Xuyên | **1,137** |
| `冰龙印记` — Băng Long Ấn | **2,031** |
| `冰龙之角（小）` — Sừng Băng Long Nhỏ | **1** |
| `冰龙之角（中）` — Sừng Băng Long Trung | **1** |

**Source contradiction/alias lead:** the observed medium object is spelled `冰龙之角（中）` in Ch171, while existing `SX-0022` and `SX-0037` refer to `冰龙号角（中）` in later chest receipts. They are plausible related objects but full template equivalence is **NOT VERIFIED**. This is not another chest drop, a fixed monster droptable, a player grant or a new T0 Ice Nest location. See `FX15-0005` for its actually inspected six-hour, 60-km source effect.

## 3. Six new mechanic/effect records

| ID | Direct source | Extracted contract |
|---|---|---|
| `FX15-0001` | Ch141 | Tavern recruiting requires a qualified staffed bartender, then broadcasts to a **50 km** radius; **once per three days**; reputation matters; **lord approves entry**; no instant unit mint |
| `FX15-0002` | Ch118 | At source rep **1,100**, example recruitment category chances are **5% elite / 1% head-grade / 0.01% leader-grade** plus independent **+5 percentage points to each** from source title `希望之地` |
| `FX15-0003` | Ch117 | Medical kits **not one-click**; trained healthcare worker required; sewing and smithing similarly require real qualified staff |
| `FX15-0004` | Ch117 | Unequipped monsters **cannot drop equipment** (other drops not forbidden); vital attacks and limb injuries exist; **ordinary healing spells cannot regrow severed limbs** |
| `FX15-0005` | Ch171 | Inspected `冰龙之角（中）`: attracts Ice Nests in a **60 km** radius for **six hours**; Ch171 excerpt supplies **no explicit XP/loot modifier** or position algorithm for this medium horn |
| `FX15-0006` | Ch253 | Same tavern function is demonstrably **repeatable** after cooldown; second attempt not an automatic named hero or free recruit |

### Particularly important provenance cautions

1. The Ch118 title `希望之地` (Hope Land) is **not** Ch150 `荣耀之地` (Territory Honor), already recorded as `SX-0228`. Never credit the latter with the former's +5 percentage point bonus. An ordinary addition of printed grade percentages does **not** establish a full exclusive grade sampler; the missing categories and nested outcome rules are unknown.
2. The Ch141 local tavern mechanic is **settlement infrastructure**, not a recruit-scroll item or universal event shop. It requires a bartender and actual visitor approval. Named actor Laqi is not auto-imported as a starting hire into a clean Lí Lan game.
3. The Ch117 injury and loot update concerns the original novel post-protection stage. Direct adoption into existing LL01 canonical File01/04/05 is a **separate versioned implementation decision**. No pre-seeded chests, enemy equipment, corpse resurrection or prior live saves are changed.
4. No percentage mode from the Ch148 **small** Ice Dragon Horn is silently copied into the Ch171 **medium** item. No effect of either is activated to move already seeded LL01 mobs or lairs.

## 4. Observations and missing facts

- `OBS15-01`: title and reputation display difference; unknown full formula.
- `OBS15-02`: medium horn alias uncertainty, one physically delivered hunt batch rather than a chest receipt.
- `OBS15-03`: source post-protection mechanics recorded only as research because legacy contract migration is unresolved.
- **Unknown:** adjusted recruitment probabilities at other reputation scores, qualified bartender alternatives, arrivals/travel time, tavern upgrade tables, injury probabilities, medium horn spawn/location preservation algorithm, late-game EV22/23/24/27 inventories.

## 5. Validation / immutability

1. All **295 previous SX entries**, **36 previous FX records** and **17 prior source observations** copied without any value changes.
2. Append `SX-0296`, `FX15-0001..0006`, `OBS15-01..03`. New totals: **296 entries**, **42 effects**, **20 observations**.
3. Source item review CSV retains all **295 earlier data records**, header, BOM and column order; appends one. Final count: **296 rows**.
4. **30 original v0.6 event schedule records unchanged**; no additional event, world seed, saved unit, item instance or quest claim is created.
5. Old active v1.4 files archived unchanged under `research/snapshots/events/`; full extraction audit history retained.

## 6. Outputs

- `data/events/EVENT-SOURCE-CATALOG-v1.5.json`
- `data/events/EVENT-SOURCE-ITEMS-v1.5.csv`
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v1.4.json` and `research/snapshots/events/EVENT-SOURCE-ITEMS-v1.4.csv`
- `research/extraction-audits/ROUND-15-FIFTEENTH-EXTRACTION.md`
