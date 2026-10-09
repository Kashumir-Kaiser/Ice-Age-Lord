# LORD DND — Round 29 continuation (v2.9.1; research-only)

**Immutable parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.9-ON-TIMELINE-0.6` (Round 29 v2.9), not v2.8. **This is an additive continuation of Round 29, not a second incompatible v2.9 release.**

| Dimension | v2.9 parent | v2.9.1 | Append |
|---|---:|---:|---:|
| Source item entries | 374 | 380 | 6 |
| Source mechanic/effect records | 112 | 118 | 6 |
| Source observations | 55 | 59 | 4 |
| Provenance conflicts | 14 | 14 | 0 |
| Fixed event schedule objects | 30 | 30 | 0 |

## Direct source evidence and chapter numbering

- [Original printed Ch721 — both previously received Hero Hearts actually used, successful Hero promotions](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_724.html).
- [Printed Ch724 — Boge Dominator promotion, Winter War Song exact text, divine pool panel, one unopened Purple Silver Jar](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_727.html).
- [Printed Ch725 — mist-wraith battle receipts, XP, accessible ground loot](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_728.html).
- [Printed Ch726 — separate-team experience attribution and non-member exclusion, corroboration only](https://www.69shuba.com/txt/58776/40564729).

Mirror filename suffixes differ from original printed chapter numbers. Ch721 is revisited **only to record consumption/progression**, not a duplicate acquisition of SX-0363 or SX-0371.

## 1. Earlier Hero Heart consumption now verified — FX29-0006

Both original-novel `英雄之心` acquired in the two **separate** Ch720–721 receipts (`SX-0363`, `SX-0371`) are used successfully on the source's `童楚楚` and `伯捷·逐日者` (no additional Hero Heart created). Each observed Hero breakthrough explicitly states **base attributes +100%, attack range +200%, territory prosperity +50**. Boge's personal bloodline separately activates `三脉共鸣·魔龙苏醒`. There is no universal guaranteed Hero breakthrough chance, grant, or extra personal skill inferred for unrelated actors.

## 2. Ch724 Boge actual Dominator transformation and domain — FX29-0007–0008

Boge (`伯捷·逐日者`) is shown **using one shining soul object already in possession**; this chapter does not give an earlier source/acquisition ID for that soul, so **do not append a new acquired soul receipt**. The success notice confirms **Dominator potential**, **base attributes +30%**, and **`凛冬战歌领域`**.

**Domain panel:** each ordinary attack grants one `战意` stack; each stack gives **attack speed +1%**; maximum **30 stacks**, lasting **60 seconds**. On reaching the cap, **attack power +30%**. The source protagonist speculates about making the effects permanent through his distinct `永恒之力` interaction, but the domain itself does **not** say it is always permanent or a general passive. Do not silently merge its bonuses with Boge's separate demon-blood bonus.

## 3. Ch724 original protagonist gauge — FX29-0009

Cao Xing's specific Legendary-class panel shows **divine power 0/100**, with **one point naturally recovered per day**, and a separate **faith value still locked until level 140**. This is an observed **individual panel**, not a universal mana replacement, a starting gauge for Lí Lan, or a global rule for every Legendary.

## 4. Ch724 Silver Jar collected, NOT opened — SX-0375

One `未开启的银罐（紫）` is explicitly picked up in the ruins. Cao Xing proposes opening it **after returning to his territory**; no opening/contents are reported in the inspected passage. `SX-0375` is a single actual source pickup; it is **not** a repeatable shop stock, random jar drop table, or already-open chest.

## 5. Ch725 finite mist-wraith engagements — FX29-0010

| Explicit fight | Mist Wraiths defeated | Cao Xing XP | Participant XP |
|---|---:|---:|---:|
| First | 14 | 5,458,000 | 2,729,000 |
| Second | 118 | 41,300,000 | 20,650,000 |
| Third | 56 | 21,280,000 | 10,640,000 |
| **Those three only** | **188** | **68,038,000** | **34,019,000** |

The novel names the individual `苍白之引` + `救世之星` buff context and describes **80%** combined bonus in Cao Xing's current circumstances. This does **not** establish a base XP-per-Wraith constant or a universal party sharing formula. These are receipts for three encounters only. It also describes deeper-mist drops as inaccessible after remote kills; killing a Wraith is **not** automatically acquiring its loot. Ch725 includes additional later engagements; do not treat the three-row subtotal as chapter-wide lifetime kills.

## 6. Ch725 actual accessible ground-loot receipt — FX29-0011; SX-0376..0380

| New SX | Source literal | Actually collected |
|---|---|---:|
| SX-0376 | `怨灵结晶` | 654 |
| SX-0377 | `怨灵粉尘` | 418 |
| SX-0378 | `大型精神之书` | 31 |
| SX-0379 | `大型敏捷之书` | 23 |
| SX-0380 | `大师级元素结晶` | 215 |

The protagonist explicitly picks up these five **ground** lines after several engagements. Individual wave-specific allocations are **not printed**; especially do not ascribe drops from Wraiths killed deep inside inaccessible fog. No probability table, blanket chest contents, recipe, shop sale, or T0 spawn follows.

## 7. Four explicit observations — OBS29-04..07

- Hero Heart **acquisition versus consumption** is reconciled without minting third/fourth hearts.
- Boge's soul-item **use is witnessed** but this scene does **not** identify a previously itemized acquisition.
- The source's **three XP receipts** cannot be combined with generic player XP mirror or with a universal per-monster rule.
- **One unopened Silver Jar** and **five separately collected ground-loot lines** have disjoint transaction contexts.

## 8. Hard preservation and release rules

- Keep the entirety of `data/events/EVENT-SOURCE-CATALOG-v2.9.json` and `EVENT-SOURCE-ITEMS-v2.9.csv` unchanged; archive them byte-identically in `research/snapshots/events/`.
- Child release: `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.9.1-ON-TIMELINE-0.6`. Keep original `pass_29` unchanged and store only this delta under `pass_29_continuation`.
- Append **exactly** `SX-0375..0380`, `FX29-0006..0011` and `OBS29-04..07`. Preserve all existing rows and fields in order. Retain all 14 conflicts and all 30 fixed event objects **structurally identical**.
- Preserve CSV **UTF-8 BOM, existing 69-column header, CRLF line breaks, and the exact prior 374 rows**.
- This release is `RESEARCH_ONLY_NOT_ACTIVE`. No modification of the clean T0 initializer, canon File01–07, original 192 chest seed, 15 Hero lairs, any LL01 save, Lí Lan's SSS talent/skills, active shop, or event schedule.
- Remain unresolved: Ancient Hardwood grade mismatch, EV22/23 Ancient Dragon shop inventories, EV24 later Golden Shop contents, EV27 World Protector floor rewards. No silent filling.

## Outputs

- `data/events/EVENT-SOURCE-CATALOG-v2.9.1.json`
- `data/events/EVENT-SOURCE-ITEMS-v2.9.1.csv`
- this audit addendum, immutable v2.9 snapshots, README and Content Index pointers.
