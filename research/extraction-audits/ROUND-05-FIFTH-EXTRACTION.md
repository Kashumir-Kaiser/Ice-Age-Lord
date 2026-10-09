# LORD DND — Fifth event extraction audit (v0.5)

**Release candidate:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-0.5-ON-TIMELINE-0.6`  
**Based on:** all 209 entries from v0.4 + one partially verified blueprint identity + seven explicit shop offers + nine ranking-reward bundles = **226 entries**.  
**Honesty of coverage:** fifth-pass late-game research is **partial**, not an exhaustive direct reading of the relevant arc chapters. No shop-price or chest-probability data was guessed.

## 1. New item with a directly relevant source excerpt

| New ID | Arc | Chapter | Content | Supported claim | NOT supported |
|---|---|---|---|---|---|
| `SX-0210` | EV23 — Ancient Dragon, second phase (arc association only) | **1123** | **Bản Vẽ Sáng Thế Chi Quang** (创世之光图纸) | The correct-chapter excerpt directly names a blueprint, and describes a created anti-godhead installation; the protagonist discusses a **10% godhead/rule impairment per installation** and **hypothesizes** five simultaneously might produce 50% | Construction recipe, materials, placement, attack interval, actual combat damage formula, who awards it, shop availability, purchase price, chest source or guaranteed stacks |

**Source chapter excerpt:** https://www.xiaoshuo.com.tw/599058/264416829.html

The original work also circulates as **《全球降临：带着嫂嫂末世种田》** by **一条小白蛇**. The Chapter 1123 page carries the appropriate title and an on-topic fragment about Creation Light. **Source quality caution:** the excerpt contains unrelated injected paragraphs after its relevant opening, so only the directly on-topic portion counts as evidence. In particular, Cao Xing's proposed five-installation/50% example is *his projected result*, **not a confirmed stackable engine formula**.

**Placement:** The blueprint is referenced immediately after the Ancient Dragon battle. The current mapping to `EV23` is by chapter/arc proximity; it is NOT evidence that the blueprint is stocked in EV23's event shop or delivered to every participant. `shop_offer_verified=false`, `chest_drop_verified=false`, `acquisition_verified=false`, `adoption=RESEARCH_CANDIDATE_NOT_ACTIVE`. No item is granted to Lí Lan.

## 2. Newly recovered first-regional-merger Dragon Shop, missed in earlier passes

**Primary evidence:** [Alternative-title mirror `第386节`](https://www.bixiange.top/khjj/21282/386.html), a detailed indexed passage reproducing shop and full ranking reward panels. Its story context is the **first ten-region merger**, equivalent to the original novel's original Chapter ~201 event arc, not the later Chapter 362 second Dragon challenge. **The actual chapter-label equivalence is unverified**, so `source_chapter=null` and `source_mirror_section=386`; event mapping is based on the plot details and event wording. The original chapter directory independently calls Chapter 201 “首次合区，积分排行榜开启”.

**Seven newly itemized shop offers (`SX-0211`–`SX-0217`):**

| Item | Ice Dragon marks per unit | Shop limit | Confirmed feature |
|---|---:|---:|---|
| Tier-2 Dragonblood Fighter scroll | 5,000 | 20 | Recruit scroll |
| Tier-2 Elite Dragonblood Fighter scroll | 20,000 | 5 | Elite recruit scroll |
| Tier-2 Head-grade Dragonblood Fighter scroll | 100,000 | 1 | Head-grade recruit scroll |
| Dragonrock Ore | 1,000 | Not stated | Material item, even if also appears in chest contents elsewhere |
| Intermediate Power Heart | 10,000 | Not stated | Advancement material |
| Glacier Magnet (gold) | 100,000 | 1 | +50 Strength, +50 Spirit, +100 damage to ice attacks; Expert blacksmith required for socketing |
| Dragon Stone (orange) | 300,000 | 1 | +300 Vitality; 15% chance when attacked for +100% armor; Master blacksmith required |

**Nine distinct final ranking reward bundles (`SX-0218`–`SX-0226`):** bracket 10,000–5,000; 4,999–1,000; 999–100; 99–50; 49–10; 9–4; 3; 2; 1. Each bundle explicitly retains **all** physical chest/blueprint/weapon/recruitment-scroll lines and its **exact Ice Dragon mark sum**, so no reward is duplicated by treating a bundle as additional standalone items. Mark payouts respectively: **1,000 / 2,000 / 5,000 / 10,000 / 20,000 / 30,000 / 50,000 / 70,000 / 100,000**. The rank-1 bundle includes four frost wall/arrow-tower blueprints, one Gold chest, one chosen Dragon-set equipment piece, and one Tier-2 Commander Dragonblood Fighter recruitment scroll.

**Critical event mapping:** This panel belongs to `EV04-FIRST-MERGE-DRAGON-POINTS`, **NOT** the distinct `EV08-WORLD-BOSS` / Chapter 362 second Dragon qualifier. Both are ice-dragon themed but they are not the same contest or prize pool. Shop limits are **per offer where explicit**, not assumed global limits.

## 3. Important corroboration — do not mint a duplicate record

[Chapter 175 full indexed source excerpt](https://sto55.com/book/41597/23433364.html) records an actual purchase of **87 Sơ Cấp Trái Tim Sức Mạnh for 87,000 Băng Long marks**, confirming **1,000 marks per item**. That price was *already* in `SX-0012` (source Chapter 118). This is corroboration of an existing offer, **not** a new reward or a new item entry; fifth-pass metadata records it as supporting purchase evidence.

The general lesson is that `shop offer`, `actual purchase receipt`, `reward grant`, and `chest contents` are separate relations even when they reference the same item. A purchase of 87 must not be treated as an extra global grant or an initial stock limit.

## 3. Late-game chapter targets found, but not promoted

The following references were verified as chapter-index/title leads, **not as complete reward panels**. Titles do not establish item ownership, inventories, probabilities, amounts or conditions.

| Event | Chapter targets | What still needs the chapter body |
|---|---|---|
| EV22: Ancient Dragon phase 1 | 1079–1080 | Opened new shop, divine items and demigod blueprints: exact stock, currencies, limits |
| EV22: Ancient Dragon phase 1 | 1085–1086 | Mark stock and purchases: itemized receipts versus narrator's inventory total |
| EV22: Ancient Dragon phase 1 | 1091 | Ranking reward entries and eligibility |
| EV23: Ancient Dragon phase 2 | 1108 | Hidden shop inventory and exact unlock/limits |
| EV23: Ancient Dragon phase 2 | 1122–1125 | Battle settlement, Creation Light provenance, post-battle exchanges and Dragon Soul class trial |
| EV23 postbattle | 1133 | Ranking settlement and named half-divine equipment |
| EV24: Dragon Festival | 1137–1148 | Golden Shop full stock, exchange artifact identity, War Lord chestplate payout |
| EV24 chronology check | 1236 | Starry Dragon Wings, dragon-wing merchant and ancient coin bags: out-of-window chronology unresolved; not inserted |
| EV27: World Protector | 1330–1332 | Four-tower clear rewards, four artifact-throne identities and recipients |
| EV27: World Protector | 1338–1339 | Six-tower clear reward conditions; Life Spring and Reincarnation Gate details |

Chapter-index corroboration:
- https://tw.hjwzw.com/Book/Chapter/50356 — original chapter sequence and shops
- https://www.readnovel.com/bookquery/qbqbjdtuhvsk — ending arc and four/six-tower chapter titles
- https://www.xiaoshuo.com.tw/599058/ — alternate-title edition used for the relevant Creation Light excerpt

**Mirrors are inconsistent.** One indexed `[1123]` page on a different site discusses an **Energy Station Level 21**, not the Creation Light chapter. It must not be cited as evidence for chapter 1123's event reward. The publication title also varies; match the exact *chapter title + local scene*, not chapter number alone.

## 4. Explicit blocker statuses

| Data dimension | Fifth-pass status |
|---|---|
| Creation Light blueprint identity | `VERIFIED_EXCERPT` |
| Godhead-damaging purpose | `VERIFIED_EXCERPT` |
| One installation ~10% / five ~50% | `PROTAGONIST_CALCULATION_NOT_LOCKED_AS_FORMULA` |
| Creation Light ownership/reward source | `UNVERIFIED` |
| EV22/EV23 late shops and prices | `UNVERIFIED` |
| EV24 extra Dragon Festival shops | `UNVERIFIED` |
| EV27 World Protector exact loot | `UNVERIFIED` |
| Previous Dragon-test arithmetic 6,990 vs 6,980 | `STILL_CONFLICTING` — unchanged |
| Fixed event calendar | `UNCHANGED v0.6` |

## 5. Import conditions and next concrete checks

1. For Ch.1079–1086: obtain readable **offer lists and purchase confirmations**, record the two separately, and bind the exact event-shop version.
2. For Ch.1108 and Ch.1125: identify **hidden-vendor unlock** and whether later purchase adds stock to the same or a different inventory. Do not assume any item in a chapter title is globally purchasable.
3. For Ch.1122–1123: identify the **Creation Light grant/receipt**, first owner, blueprint versus built unit, construction recipe and exact combat effect; validate repeated-installation math against the full text before implementing.
4. For Ch.1137–1148: collect Golden Shop offer cards and their currency/limits; **do not** bind non-event merchant sales to Dragon Festival merely because chapters are nearby.
5. For Ch.1330–1339: separate each tower's **clear-time reward** from later inventory review and from follow-on character progression. Verify if unique artifacts are physical items or installed structures.
6. Cross-check across Chinese editions using chapter title and narrative context, recording edition-specific chapter-number offsets. Do not substitute chapter-index headlines for paragraph evidence.
7. For the new web game, publish only entries with executable `source → acquisition → usable contract` edges. Others remain research-only even though the JSON can hold them.

## 6. QA proof and release lineage

- Parsed v0.4 source entries: **209**; all copied without field/value modification.
- Newly added: **17** records: 1 research-only blueprint identity (`SX-0210`, inactive because acquisition/effect contract incomplete), 7 source-confirmed shop offers and 9 conditional rank-payout bundles. They are verified **contracts**, not newly claimed items in a save.
- Current total: **226**.
- Event schedule: original **30** v0.6 event objects preserved exactly.
- No old IDs recycled; new IDs unique; CSV/JSON entry counts agree.
- No active File 01 or File 05 edited, no campaign saves moved, no chest re-rolled.
- No claim that missing late-game shops were exhausted or their item prices verified.

This v0.5 is an **incremental research archive**, not an event-pack activation.

## 7. Final fifth-pass count and QA (supersedes early numbers in the research-lead narrative)

- Previous v0.4: 209 entries.
- Newly appended: 17 total: 1 research-only Creation Light identity, 7 first-merger shop offers, 9 first-merger ranked prize bundles.
- Final v0.5: **226 entries**.
- One mirror's section number `386` is not equated with source chapter 386. First-merger placement uses event content, original Chapter 201 index and explicit plot setting.
- Original fixed 30-event v0.6 schedule preserved without modification.
