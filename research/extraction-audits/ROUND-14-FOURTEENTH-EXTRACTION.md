# LORD DND — Event Source Extraction Round 14 (v1.4)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.3-ON-TIMELINE-0.6` — 293 source entry records, 29 effect records, 15 observations. **Scope:** research-only, no game/world activation. **Date:** 2026-10-09.

## 1. Verified primary source passages and edition identity

- [Ch423 on 69shuba — Hidden Legendary Wheel](https://www.69shuba.com/txt/58776/39424359), alternate edition [Ch422 on Golden House](https://t.hjwzw.com/Read/50356_24723029). The chapter *contents* match the Claw qualifier’s ninth-day Legendary Wheel; source chapter numbering is not stable across mirrors. Evidence is a detailed system notification, not a chapter-title guess.
- [Ch889 — Luck God's Favor S-rank quest full system-panel excerpt](https://www.xiaoshuo.com.tw/599058/257750900.html). The passage announces the three stages and their conditional rewards. Rewards are **offered**, not observed paid out in this scene.
- [Ch597 — War Merit/Blood Chaos equipment shop](https://czbooks.net/n/s6ojlf/s6ofp9e0?chapterNumber=597). All five listed sets have an independently printed single-piece and full-set price, with stock descriptions. Existing catalog entries `SX-0069..SX-0073` already cover the full-set offers and are NOT duplicated.

## 2. Two genuinely new *offered* stage reward bundles

| New ID | Source objective and gate | Listed conditional reward | Evidence precision |
|---|---|---|---|
| `SX-0294` | **Unique** S-rank global first `幸运之神的眷顾` owner, stage 1: travel to `4177,12523,21522`, sacrifice unspecified offering at Luck Altar, clear Luck Wheel | **1 legendary Luck Sacred Altar construction blueprint + 100 Divine Power Fragments** | Quest panel, not completion receipt |
| `SX-0295` | Same quest owner, stage 2: travel to `4822,19245,32116`, defeat demigod Misfortune Beast **Modis** | **1 Luck God's Dice (grade unknown) + 100 Divine Power Fragments** | Quest panel, not completion receipt |

**Unlock conditions actually written in source:** first global survivor lord to reach **200/200 full Luck**; possess **at least one demigod-grade artifact or source-stated `5件以上` legendary equipment**; lord level above/at 100 (original exact wording `需在100级以上`). Because this first discovery is strictly world-first, neither a generic EV14 participant nor Lí Lan starts with this quest. The two source map coordinates are **not** LL01 world anchors. The exact inclusivity interpretation of Chinese `以上` is recorded verbatim and **not hard-coded** into an executable comparator yet.

**Hidden stage 3 is NOT a third item record.** Text demands the final blow on Modis be a critical hit, but the reward line explicitly states **未知** (unknown). There is no source-verified item ID, amount or use effect to mint.

## 3. Seven extracted mechanical records (existing offers retain their identities)

| Record | Linked entries | Source mechanism extracted |
|---|---|---|
| `FX14-0001` | `SX-0049` | Hidden Legendary Wheel costs **1,000,000 challenge points per spin**, unlocked by first survivor whose *unspent* points surpass 1,000,000. Outcomes: **50%** one legendary-category object; **30%** two epic objects; **15%** three epic objects; **5%** one full epic set. |
| `FX14-0002` | `SX-0069` | Green five-piece set: **500 per piece / 2,000 full**, source listing says unlimited. |
| `FX14-0003` | `SX-0070` | Blue four-piece set: **3,000 per piece / 10,000 full**, source listing says unlimited. |
| `FX14-0004` | `SX-0071` | Purple four-piece set: **20,000 per piece / 70,000 full**, cap **5,000 sets** (scope unverified). |
| `FX14-0005` | `SX-0072` | Gold five-piece set: **100,000 per piece / 450,000 full**, cap **100 sets** (scope unverified). |
| `FX14-0006` | `SX-0073` | Orange five-piece set: **500,000 per piece / 2,200,000 full**, cap **10 sets** (scope unverified). |
| `FX14-0007` | `SX-0294`, `SX-0295` | One exclusive S quest with two offered stage payouts, unquantified altar sacrifice, hidden stage 3 trigger on critical final blow, stage-3 reward UNKNOWN. |

The Legendary Wheel's **category-level** probability numbers total exactly **100%**, but the identities and within-category weights of items are unknown. Its 50% category does not guarantee a specific legendary item. The source also names a **22:00** qualifier rank lock on the tenth day and a **00:00** shop close; these are distinct and do not alter fixed game-calendar v0.6 timestamps.

## 4. Two source observations and important non-inferences

- `OBS14-01`: **global-first points unlock** rather than open-to-all wheel, even though `SX-0049` already captured the basic wheel listing. Exact phase relative to source nine/ten-day challenge tracked; no new EV08 event or wheel reward is granted.
- `OBS14-02`: the exclusive S quest is **not** one of the 30 fixed LL01 events. Neither source protagonist’s prior Luck/stat gear nor either novel coordinate transfers to the clean Lí Lan world. Actual completion is not evidenced by this notification.
- `FX14-0002..6` extend existing complete-set rows with **single-item alternative purchase modes**. Do not invent independent five-times-stock for each item slot; stock-cap interpretation for bounded sets is unresolved.

## 5. Late-game investigations not turned into fake loot

The Ch1080/1108 Ancient Dragon shops, Ch1137–1138 Dragon Festival Golden Shop and Ch1330–1339 World Protector multi-tower receipts remain **index-referenced but not adequately readable as exact itemized panels** in the checked mirrors. Without actual item names, quoted price or final claim condition the extraction creates no entry. This round turned to newly available **full quoted panel text** in Ch423/889/597, not title-level inference.

## 6. Immutability checks and release layout

1. **All 293 existing SX records**, **29 FX records** and **15 observations** remain structurally and value-identical, in their historical order.
2. Add `SX-0294`, `SX-0295` (**295 item/reward entries**), `FX14-0001..0007` (**36 effects**) and `OBS14-01..02` (**17 observations**).
3. Current CSV keeps BOM/column set and all **293 previous records unchanged** then appends two; final count **295 data rows**.
4. All **30 event schedule objects remain identical**; neither `EVENT-TIMELINE-v0.6.json` nor CSV edited.
5. Prior v1.3 source JSON and CSV archived under `research/snapshots/events/`; old rounds and original seven canonical volumes untouched.
6. No SSS talent reroll, no T0 equipment grant, no retroactive chest contents, no new guaranteed lottery item identity and no active world data mutations.

## 7. Deliverables

- `data/events/EVENT-SOURCE-CATALOG-v1.4.json` + `data/events/EVENT-SOURCE-ITEMS-v1.4.csv`.
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v1.3.json` + `research/snapshots/events/EVENT-SOURCE-ITEMS-v1.3.csv`.
- `research/extraction-audits/ROUND-14-FOURTEENTH-EXTRACTION.md`.
