# LORD DND — Source Extraction Round 25 (v2.5)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.4-ON-TIMELINE-0.6`; **source entries 322 → 328 (+6)**; **mechanical effect records 78 → 84 (+6)**; **observations 37 → 41 (+4)**; unresolved source conflicts **13 unchanged**, fixed 30-event schedule **unchanged**. All outputs are **research only**, not an LL01 active save, automatic loot, world seed, NPC transaction or T0 event.

## 1. Direct source chapter text

- [Chapter 690 — 商会到来，布隆苏醒](https://www.69shuba.com/txt/58776/40564693): actually delivered Woodpecker Guild food shipment and source territory consumption estimate. Bronn's dream-ghost-ship pursuit also **fails**: no ship possession, map ownership or divine artifact receipt.
- [Chapter 693 — 隐藏成就，领地蓝图的选择](https://www.69shuba.com/txt/58776/40564696): printed hidden achievement conditions and rewards, original Snowflake Mark equipment panel and accessory slot rule, Expert Power Heart used on named dragon, complete six-line loot handover excerpt, and Edward's four city-planning options.

**Chapter numbering:** use printed chapter numbers 690 and 693, not the chapter-index shifts on alternate publisher editions. Extracted `SOURCE_EXPLICIT_NOVEL` facts are distinct from character estimates, system notifications, lore rumors and narrator speculation.

## 2. Real food shipment — FX25-0001

In Ch690, Woodpecker Merchant Guild vice-chairman `杰斯` arrives with **approximately 110,000 kg** food and personally reports it is the **first** batch. The convoy was delayed over one week relative to the original expected delivery by the blizzard, and the chapter explicitly describes actual unloading into Cao Xing's territory cellar. Cao Xing internally estimates normal consumption at **about 30,000 kg/day**, making the shipment equivalent to **about 3.67 days at that stated rate** *before further deliveries and other stocks*. The narrative does **not** print a unit price, deal currency, deducted payment, repeatable restocking contract or a generic merchant arrival timer.

`OBS25-01` records the food-shipment limitation. `OBS25-02` records Bronn's attempted dream ghost-ship pursuit as **not acquired** (rumored captain-room control condition and legendary treasure claim; the attempt fails).

## 3. Previously cataloged rewards: no duplicated items — FX25-0002 and FX25-0003

`SX-0290` already holds **10 `至纯裂片`** and `SX-0291` already holds **1 `原始雪花印记（橙）`**, both components of one Ch693 `风雪守护者` hidden-achievement claim. **Do not append new reward item entries**.

The original system notice's observed preconditions are **all territory residents protected through the snow disaster**, **no resident loyalty decrease during that period**, **after the disaster all residents receive ample food**, and **resident happiness increases**. These are source-observed conditions, not a cross-campaign proof of an exact general activation algorithm or whether replay is possible.

Snowflake Mark inspection: **Epic accessory**, **+100 Spirit, +50 Constitution**; on activation excludes surrounding wind/snow from **within 1 m of wearer**, lasts **3 hours**, cooldown **5 hours**. Accessory category stated not to consume ordinary gear slots, with **3 accessories per character**. The source protagonist wears the item; Lí Lan has not acquired it. No protection from rainfall, temperature damage, monsters or all weather is asserted.

## 4. Six observed loot-handovers — SX-0323..SX-0328, FX25-0006

Original Ch693 records Tong Chuchu / Elisa group passing Cao Xing a backpack from a cave-dweller-tribe raid:

| ID | Exact source name | Quantity | Source-bound class |
|---|---|---:|---|
| `SX-0323` | `五阶穴居人首领魂魄` | 1 | Fifth-tier cave-dweller leader soul material |
| `SX-0324` | `四阶穴居人精英魂魄` | 3 | Fourth-tier cave-dweller elite soul materials |
| `SX-0325` | `黏稠的物体` | 5,244 | Viscous objects; identity unspecified |
| `SX-0326` | `雪绒蘑菇种子（蓝）` | 102 | Blue snow-fleece mushroom seeds |
| `SX-0327` | `白铁桦树种子（紫）` | 33 | Purple white-iron birch seeds |
| `SX-0328` | `旧语言（书籍）` | 1 | Book, uninspected content |

The source handover panel ends in an ellipsis, so **these are six explicitly named line-items and not a complete bag inventory or a full cave-loot table**. No global enemy drop rate, chest grade, chest loot relation, map drop position, book skill effect or repeatable respawn rate. In particular, `黏稠的物体` from Ch693 is **not silently merged** with the earlier source name `黏稠的液体`; identity equivalence is unverified. `FX25-0006` links all six existing-acquired source entries within this one observed handover.

## 5. Source-character cultivation and municipal proposals — FX25-0004/0005

Chapter 693 reports that Tong Chuchu used **one previously supplied Expert Power Heart** on the named pet Ice Crystal Dragon `冰冰` after attaining fourth-tier cap; the dragon then reaches fifth tier, level 45 and **approximately one million HP**. This is a named character's outcome, **not** a universal HP function or a repeatable Tier V guarantee.

Edward draws **16 paper sheets** representing **four alternative complete city layouts** (four sheets each): defensive war city; resource extraction/industrial city; housing/education city; commercial/trade city. Cao Xing **chooses the fourth**. Each share an energy-tower/Lord-castle/Pale-tree inner core with four rings, agricultural/buffer zones and a separate planned outer wall. These are **ordinary planning sketches**, not four learned construction blueprints, system-generated loot or four already-built cities. No architectural bonus or building resource costs are invented.

## 6. Release safeguards

1. Prior **322** `SX` entries preserved structurally and in original sequence. Exactly six new records `SX-0323..0328` appended.
2. Prior **78** effects and **37** observations preserved; six `FX25` contracts and four `OBS25` lines appended.
3. Prior **13** source conflicts and **all 30** LL01 event schedule objects preserved byte-equivalent in structural terms; no new event created.
4. Original v2.4 JSON/CSV archived untouched in `research/snapshots/events/`.
5. Review CSV preserves original UTF-8 BOM, header/columns, all **322 previous** records, appends six rows to **328**.
6. Canonical File01–07, original 192 chests, 15 Hero lairs, game world-package and all earlier/campaign saves untouched.

## 7. Unresolved lines

- EV22/23 Ancient Dragon new and hidden shop stock/settlement panels.
- EV24 later Dragon Festival Golden Shop exact inventory/prices.
- EV27 World Protector tower floor-by-floor reward panel.
- Dream ghost-ship eventual ownership and any map/divine treasure receipt; Ch690 is explicitly an **unsuccessful chase**.
- Exact equivalence of viscous object/liquid item names, book `旧语言` effect, and market/food delivery prices all unconfirmed.

## Outputs

`data/events/EVENT-SOURCE-CATALOG-v2.5.json`, `data/events/EVENT-SOURCE-ITEMS-v2.5.csv`, this Round 25 audit, plus immutable v2.4 snapshots.
