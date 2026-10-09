# LORD DND — Original-novel extraction Round 32 (v3.2)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-3.1-ON-TIMELINE-0.6` (Round 31). **Source scope:** original printed chapters **732–741** of `冰封末世：我打造完美领地` by 一条小白蛇. Research only; no new LL01 event, no T0 item grant, and no player access to the source-world ruins.

| Registry | Parent v3.1 | Child v3.2 | Addition |
|---|---:|---:|---:|
| Source item rows | 402 | **411** | **9** |
| Source effect records | 135 | **143** | **8** |
| Source observations | 68 | **76** | **8** |
| Provenance conflicts | 14 | **15** | **1** |
| Fixed scheduled events | 30 | **30** | 0 |
| Source structures | — | **2** observed structures + 1 route report | new research-only registry |

## Direct chapter evidence

All links below use the chapter numbering printed on the page; each URL maps to the source record in the catalog.

| Printed chapter | Extraction boundary | Source |
|---:|---|---|
| 732 | Nine unopened jars are physically collected from the existing lab cache; the anchor holder configures entry filters and controls lab doors/instruments. | [Ch732](<https://www.69shuba.com/txt/58776/40564735>) |
| 733 | Filtered survivors arrive; the local guide warns that inner-city mist covers the ruin from 00:00 to 06:00 and points visitors to safe areas. | [Ch733](<https://www.69shuba.com/txt/58776/40564736>) |
| 734 | A black triangular ruin building is cleared and used as an overnight refuge; a medium chest is opened, but its actual contents are not itemized. | [Ch734](<https://www.69shuba.com/txt/58776/40564737>) |
| 735 | The guide describes routes to the Ancient Arena and Central District, plus a recently discovered branch toward the Soul Temple. | [Ch735](<https://www.69shuba.com/txt/58776/40564738>) |
| 736 | Four Soul Crystals drop from one wraith group; the guide states their tier gate and one-per-person arena entry cost; the arena's spatial interior is described. | [Ch736](<https://www.69shuba.com/txt/58776/40564739>) |
| 737 | Kaelan proposes a ranking wager; no sword or character is transferred in this chapter. | [Ch737](<https://www.69shuba.com/txt/58776/40564740>) |
| 738 | Quest panel sets the objective and conditional Legendary weapon reward; no claim is shown. | [Ch738](<https://www.69shuba.com/txt/58776/40564741>) |
| 739 | Combat continuation; no new item receipt, structure contract, or fixed event is extracted. | [Ch739](<https://www.69shuba.com/txt/58776/40564742>) |
| 740 | The source protagonist receives the exact Round 3 and Round 4 Arena reward receipts. | [Ch740](<https://www.69shuba.com/txt/58776/40564743>) |
| 741 | The ranking stone records a fourth-round clear in 18 seconds; the reward title panel and unfinished Round 5 opening are inspected. | [Ch741](<https://www.69shuba.com/txt/58776/40564744>) |

## SX-0403..SX-0411 — item receipts and conditional reward

- **Ch732 lab cache:** 6 `未开启的银罐`, 2 `未开启的金罐`, and 1 `未开启的黑罐`. They are one nine-jar pickup, not three independent loot rolls. All remain unopened in this passage; contents and per-jar drop odds are unknown. The Ch730 chamber mention is now linked to this same cache; Ch726's earlier eight jars dug over two days remain a separate cumulative statement with overlap unproven.
- **Ch736 wraith group:** 4 `灵魂晶石` from one group-level kill receipt. The chapter also calls the item `灵魂结晶`; one individual kill's drop rate and any sale price remain unknown.
- **Ch738 wager quest:** `永夜低语·噬魂者` appears only as a conditional quest reward for ranking above Kaelan. It is **not acquired** by Ch741.
- **Ch740 Arena receipts:** after Round 3, one unopened `古代黄金宝箱` and 100 `黄金古币`; after Round 4, one `冠军斗士（橙）` title and one `十阶主宰级魂魄`. These are the source protagonist's printed receipts, not an all-runs reward table.
- **Title inspection in Ch741:** the Orange title is labeled Epic quality in its panel. Its exact effect is stored on SX-0410. Preserve both source labels.

## FX32-0001..0008 — source mechanics and event context

1. **World Anchor operation:** host-configurable applicant filters auto-approve matches; controlling the existing anchor also controls the lab's doors and instruments. The observed mass arrival has no exact completed participant count in this segment. Keep the 100,000 spatial-node capacity and seven-day reuse limit attached to FX31-0009.
2. **Ruin mist:** midnight–06:00 inner-city mist requires entrants to use safe areas; the active transmission array is said to resist it. This does not change LL01's fixed calendar.
3. **Soul Crystal:** the guide says drops begin at wraith tier 8 and one crystal is needed for each Arena entrant. It also opens some building doors/special sites. One four-crystal group receipt does not establish a probability table.
4. **Ancient Arena:** diameter at least 1 km, dark-gold metallic exterior, runes and a spatially folded interior. Hundreds can challenge in separate instances; exact capacity, construction recipe and ownership are unknown. The stone records rank/name/round/time.
5. **Kaelan's wager:** the quest objective is to rank above him. Failure allows an optional handover of Taliya and Isabel; refusal carries an unspecified reputation loss and a nonzero but unquantified risk of Northwind alliance retaliation.
6. **Trial receipts:** exact Round 3 and 4 item rewards are recorded on their source item entries. The Round 5 trial has started at the end of Ch741, but its result and reward are not yet shown.

## Structure extraction

- `STR-0001`: unnamed black triangular building, source wording “五百多个平方” (unit not explicit), approximately 20–30 m tall; one golem guard and one medium chest. The chest's actual contents are unitemized.
- `STR-0002`: Ancient Arena, diameter at least 1 km; dark-gold metal appearance, alchemy/magic runes, spatial-folded independent trial rooms and external ranking stone.
- The Ch735 Soul Temple route is only reported as a newly found branch absent from an old map; the source party has not reached the destination in this segment.
- No blueprint, recipe, territory ownership or clean-T0 LL01 location is established.

## Provenance conflict and guardrails

- `CONFLICT-CH738-CH741-YONGYE-WEAPON-LABEL`: Ch738 quest panel prints `永夜低语·噬魂者`; Ch741 calls Kaelan's held wagered sword `永夜低语·弑神者`. It may be a naming correction, alias, or separate item. Keep both exact labels and do not merge them yet.
- Preserve every prior item/effect/observation/conflict and the 30-event schedule. No new fixed event, shop stock, guaranteed loot, LL01 possession, structure blueprint, or source geography is created.
- Keep the v3.1 JSON/CSV byte-identically under `research/snapshots/events/` before activating v3.2.
- All new rows are `RESEARCH_CANDIDATE_NOT_ACTIVE`; all new effects remain `RESEARCH_ONLY_NOT_ACTIVE`.

## Release outputs

- `data/events/EVENT-SOURCE-CATALOG-v3.2.json`
- `data/events/EVENT-SOURCE-ITEMS-v3.2.csv`
- `data/structures/SOURCE-STRUCTURE-CATALOG-v0.1.json`
- `research/extraction-audits/ROUND-32-THIRTY-SECOND-EXTRACTION.md`
- Immutable v3.1 JSON/CSV snapshots; updated README, content index and fresh-start pointer.

## Next boundary

The next unprocessed printed chapters are **742–751**. Their combat, arena completion and structure evidence should be separated into a new ten-chapter checkpoint; do not infer a Round 5 reward from the unfinished state at Ch741.
