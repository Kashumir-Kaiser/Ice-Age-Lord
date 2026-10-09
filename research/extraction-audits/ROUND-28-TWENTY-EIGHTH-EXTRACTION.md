# LORD DND — Source Extraction Round 28 (v2.8)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.7-ON-TIMELINE-0.6`. **Source item records:** 361 → **373** (+12). **Mechanical effects:** 102 → **107** (+5). **Observations:** 49 → **52** (+3). **Source conflicts:** 13 → **14** (+1 explicitly unresolved). **30 LL01 calendar events unchanged.** All changes are source-research only: no live save, T0 loot, NPC movement, or authored event schedule mutation.

## Source evidence

- [Printed Ch720 — Asura resource-room chest with seven item receipts](https://www.69shuba.com/txt/58776/40564723); [same scene, ttkan mirror _723](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_723.html).
- [Printed Ch721 — Crown item description, Taliya's Black Jar handover, Elisa's opening with four item receipts](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_724.html); [independent chapter mirror](https://czbooks.net/n/s6ojlf/s6ofpnoh?chapterNumber=723).
- [Printed Ch714 — Ancient Wood Planks' exact 100-to-1 Legendary output label](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_717.html) for provenance comparison only.

Mirror suffixes and original chapter labels differ. These are direct original-novel receipt/inspection passages rather than chapter-title predictions.

## 1. Actual Asura resource-room container (Ch720)

A group of **three converted Asura golems** retains source-building **A-grade authorization**, enabling the opening of the resource-room door. Authorization belongs to these controlled golems, **not** to all players, all Asura rooms or generic LL01 units.

A **single opened container** produces the following *seven printed acquisition lines*, retained as `FX28-0001` and `SX-0362..0368`:

| Entry | Source item label | Received |
|---|---|---:|
| `SX-0362` | `遗物·永冻王冠` | 1 |
| `SX-0363` | `英雄之心` | 1 |
| `SX-0364` | `奇异金属` | 4,129 |
| `SX-0365` | `德里墨钢锭` | 172 |
| `SX-0366` | `上古坚木（橙）` | 3 |
| `SX-0367` | `大师级魔能水晶` | 24 |
| `SX-0368` | `专家级魔能水晶` | 75 |

This is an actual source acquisition, not a loot table. The printed notice ends in ellipsis; **do not** assume it establishes a complete random-reward schema, probability or guaranteed Crown for all resource-room chests.

The two `魔能水晶` labels are preserved literally and **not silently conflated** with earlier `能源水晶` entries unless a later item panel proves equivalence. This extraction does not duplicate older Asura Ch714 salvage, which comes from a different hall and a different container.

## 2. Everfrost Crown (Ch721) — FX28-0002

`遗物·永冻王冠` quality panel states **unknown** rarity and two distinct uses:

1. A **main required relic material** for an **ice-element mage** to advance to Legendary, subject to the other legitimate breakthrough requirements.
2. **Alternatively** absorb its contained power for **100 divine power**. Doing so **exhausts and destroys the relic**.

These are alternatives, **not cumulative grants**. The novel protagonist **Cao Xing** later begins Legendary advancement using a separate **Legendary Heart** and this Crown; do not transfer his breakthrough or those resources to Lí Lan. The Crown is not retained as an endlessly usable inventory item after its spent use. Source Chapter 721 does **not** imply that a Hero Heart substitutes for a Legendary Heart.

## 3. One separate Black Jar given and opened in Ch721

`SX-0369` is an **unopened Black Jar** physically handed from **Taliya (塔莉雅)** to **Cao Xing** as compensation linked to the rescue agreed through her subordinate Jamie. It was **not purchased** using Krona and is not the previously purchased **Ch704 Black Jar `SX-0332`**.

Cao Xing then permits **Elisa (埃丽莎)** to open it. The source reports exactly four actual receipt lines, recorded in `FX28-0003` (handover) and `FX28-0004` (opened jar):

| Entry | Printed source item | Received |
|---|---|---:|
| `SX-0370` | `白金古币` | 35 |
| `SX-0371` | `英雄之心` | 1 |
| `SX-0372` | `星陨锭` | 24 |
| `SX-0373` | `至纯裂片` | 15 |

One actual jar, not an unrestricted item pool or a repeatable reward claim. **Opening a jar alone does not justify an inferred Jar King achievement progress amount** here without a visible system notice; `FX28-0004` explicitly holds that as unverified. The original Ch711 system notice proving progress 3/100 remains preserved and not overwritten.

`FX28-0005` keeps the total **two Hero Hearts** traceable as **one chest receipt + one jar receipt**, in line with the character's own inventory count after both events. This is **not** a second duplicate reward, and Hero Heart uses in later character breakthroughs require separate transaction evidence.

## 4. Provenance discrepancy — Ancient Hardwood

A source label discrepancy is independently documented rather than corrected:

- Ch714 ingredient panel says **100 `上古木板（橙）` → 1 `上古坚木（传说）`**.
- Ch720 chest receipt prints **`上古坚木（橙）` ×3**.

This may be a published grade inconsistency or an as-yet-undemonstrated item-variant distinction. There is not enough evidence to decide. **`CONFLICT-CH714-CH720-ANCIENT-HARDWOOD-GRADE`** preserves both exact labels and provenance, and forbids changing the earlier `FX27-0008` conversion rule or automatically reclassifying the Ch720 item. `OBS28-03` records the discrepancy.

## 5. Append-only checks and campaign firewall

1. Preserve the initial **361 source entries**, **102 effects**, **49 observations**, **13 conflicts** in their original order/value; append exactly 12 `SX`, five `FX28`, three `OBS28` and one conflict.
2. All **30 scheduled event objects** remain structurally unchanged and no EV ID is created. The original 192 pre-seeded chests and 15 hero lairs remain untouched.
3. Item CSV preserves original BOM, header, columns, and all **361** prior rows; appends exactly **12** rows to **373**.
4. Archive the exact v2.7 JSON and CSV in `research/snapshots/events/`. Keep all earlier research archive versions and audit files.
5. No automatic LL01 T0 gift, no source-character inventory migration, no guaranteed relic roll, no random probabilities or new player skills.
6. EV22/23 Ancient Dragon full itemized shops, EV24 later Golden Shop and EV27 World Protector tower floor-specific reward panels remain **unverified** and must not be invented from chapter titles.

## Outputs

- `data/events/EVENT-SOURCE-CATALOG-v2.8.json`
- `data/events/EVENT-SOURCE-ITEMS-v2.8.csv`
- `research/extraction-audits/ROUND-28-TWENTY-EIGHTH-EXTRACTION.md`
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v2.7.json`, `research/snapshots/events/EVENT-SOURCE-ITEMS-v2.7.csv`.
