# LORD DND — Event and World Mechanics Source Extraction Round 16 (v1.6)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.5-ON-TIMELINE-0.6`: 296 entries, 42 mechanics, 20 observations. **Output:** 298 entries, 46 mechanics, 23 observations. **Timeline:** the same 30 v0.6 fixed events. **Status:** research-only; no playable or saved-world changes. **Date:** 2026-10-09.

## 1. The actual primary source passages

- [Original Ch86 / czbooks Ch87: Goblin King's palace, drop notification, epic Shining Throne full panel](https://czbooks.net/n/s6ojlf/s667gf11?chapterNumber=87); [alternate original Ch86 textual witness](https://www.xiaoshuo.com.tw/599058/251038439.html).
- [Original Ch87 / czbooks Ch88: King's Altar full construction blueprint, medium Power Heart actual use](https://tw.hjwzw.com/Book/Read/50356%2C24722279); [alternate contiguous-section full excerpt](https://www.bixiange.top/khjj/21282/119.html).
- [Original Ch251 / 69shuba Ch252: **constructed King's Altar actually inspected**, eligibility and Soul Sand requirement](https://www.69shuba.com/txt/58776/38978268).

**Edition offsets are concrete:** original Ch86/87 correspond to Czbooks Ch87/88; original Ch251 appears as Ch252 at 69shuba. The in-page item panels, not chapter headline variants, control the extracted item identity. A chapter heading referring to `英雄祭坛` is not the item's authoritative name: the actual blueprint panel says `国王祭坛建造图纸（金）`.

## 2. Two missing source item/acquisition entries

| ID | Source-only acquisition channel | Exact identity | Eligibility interpretation |
|---|---|---|---|
| `SX-0297` | **Unowned physical throne in the Goblin King's palace**, examined and actually bound after victory | `闪耀王座（橙）` — Epic Shining Throne | This is *environmental acquisition*, not one of the Goblin King defeat-notification drops or a guaranteed chest reward |
| `SX-0298` | **One item from the Goblin King's defeat loot notification**, later examined | `国王祭坛建造图纸（金）` — Gold King's Altar Blueprint | One observed boss-kill receipt, not a proven generic repeatable boss droptable or global achievement |

The two items have **different source channels** although observed in the same dungeon sequence. They have no pre-T0 item instance in Lí Lan's new game, no assumed specific seeded goblin palace, and no automatic learned blueprint.

## 3. Four new machine-readable effects

### `FX16-0001` — Shining Throne's four-gate effect

1. **Upon actual binding:** +50 Charm to bound lord.
2. **Placed in territory, at level-2 Lord House:** +10 Luck to the bound lord.
3. **Placed, at level-3 Lord House:** King's Blessing applied to territory allied units; **+30% armor**, plus an attack-related percentage phrase whose original witness is textually malformed (`可增加领地所有友方单位30%和攻击力和30%护甲`). No unprinted HP increase or exact second-attribute formula asserted; `kings_blessing_attack_bonus_percent=null` pending a better original passage.
4. **Placed, at level-4 Lord House:** `闪耀之星` may be activated **once per seven natural days** to locate **one valuable-resource area**. No free resources, no guaranteed rarity/coordinates, no boundless activation.

The visible source assumes the source protagonist's ownership; it is not a recipe to preinstall a free throne into Lí Lan's world. Four effects are one object's staged abilities, not four independently collectable treasures.

### `FX16-0002` — Gold King's Altar construction blueprint

- Prerequisite: **level-3 Lord House**.
- Construction bill: **10,000 wood, 5,000 stone, 1,000 mithril, 100 eternal-gold ingots, 50 magic-pattern stones**.
- Blueprint calls for registering fallen heroic souls and paying **same-tier souls + additional resources** for revival.
- Maximum **three revivals of the same hero**. The source does not disclose complete per-revival materials or timing at initial blueprint inspection.

### `FX16-0003` — The **built** altar's stricter, later verified gates

Later Ch251 construction inspection supplies **500 armor, 3,000 durability**, and a crucial eligibility contract omitted from the short blueprint description:

- Register **actual territory residents** with **100 loyalty** and **potential at least leader grade** (`首领级以上潜力`).
- Only registered eligible members can be revived after death. Pay a **soul of the same tier** **and Soul Sand**; exact Soul Sand quantity is **not specified** in the inspected passage.
- Preserve the initial **three revivals per hero** limit; this is not a blanket resurrection of other NPCs, monsters or enemies.

This is a separate construction-specific mechanism. **Tử Phục Linh Sư** and **Ngôi Mộ** are different source/campaign systems: the altar must not invent fees, chances, corpses or resurrection caps for either.

### `FX16-0004` — Mid-tier Power Heart `中级力量之心`

Existing `SX-0215` captures a *shop listing* elsewhere. Chapter 87 directly inspects and observes consumption of a dropped Power Heart: a qualifying survivor or recruit **level 20** advances to **tier 3**, receives **+100 to all base attributes**, with **no failure chance when eligible**. Equipment-provided attributes are explicitly not amplified by the rank increase. This is a source mechanic for a real material, not another item offering or a free new-game inventory item.

## 4. Research-only warnings and unfinished sources

- The Shining Throne's attack-plus-armor line is garbled in the publicly indexed witness; retain the original Chinese wording and nullable effect fields. Do not fill missing text from generic RPG expectations.
- The altar does not specify the **Soul Sand quantity**, revival time, chance of success, handling of corpses, or how the altar interacts with undead; all remain `UNKNOWN`.
- **EV22/23, EV24, EV27**: repeated candidate sources still expose chapter titles rather than reliable full priced/reward panels. No exact items or tower rewards were invented.
- The legacy File01–07 sources, preseeded world, any earlier campaign save, unique Lí Lan SSS talent, old drops and 30 events remain untouched.

## 5. Release QA and references

1. **296** historical item/reward entries preserved in full without modification. Add exactly `SX-0297` and `SX-0298`.
2. **42** historical FX records preserved; append `FX16-0001..0004`, reaching **46**.
3. **20** prior source observations preserved; append `OBS16-01..03`, reaching **23**.
4. The review CSV preserves original BOM, 296 previous rows and column schema; append two rows, totaling **298**.
5. No mutation of `event_schedule` (30 fixed entries) nor `EVENT-TIMELINE-v0.6.json`/CSV; no new event, active T0 gift, generic resurrection, instant construction or shop.
6. Old v1.5 JSON/CSV remain in `research/snapshots/events/`; current v1.6 research files are new immutable versioned paths.

**Files:** `data/events/EVENT-SOURCE-CATALOG-v1.6.json`, `data/events/EVENT-SOURCE-ITEMS-v1.6.csv`, `research/extraction-audits/ROUND-16-SIXTEENTH-EXTRACTION.md`.
