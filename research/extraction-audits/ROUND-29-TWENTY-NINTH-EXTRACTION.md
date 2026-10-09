# LORD DND — Source Extraction Round 29 (v2.9)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.8-ON-TIMELINE-0.6`. **Source entries:** 373 → **374** (+1). **Effects:** 107 → **112** (+5). **Observations:** 52 → **55** (+3). **Source conflicts:** 14 unchanged. **Fixed 30 scheduled events:** unchanged. These are **original-novel research observations**, not new playable Lord DnD guaranteed rewards or a retroactive Lí Lan update.

## 1. Source evidence

- [Original Chapter 722 — full-server announcement, breakthrough, and source ruin mist](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_725.html), mirror filename suffix 725.
- [Original Chapter 723 — hidden-class system panel, legendary abilities, and one previously owned learned skillbook](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_726.html), mirror filename suffix 726.
- Independent later corroboration for the **first four** temperature bonuses at **−80°C**: [source Ch844](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_847.html). This evidence is a follow-up source observation, not another receipt.

## 2. FX29-0001 — Unique hidden Legendary profession advancement

Cao Xing, whose class was `寒霜巨龍法師` (Frost Dragon Mage), breaks his Legendary life limit and gains **`永凍君主` (Vĩnh Đống Quân Chủ)**, with a **level cap 150**. Actual source notices state:
- **Base attributes +1,000%**.
- **Attack range +200%**.
- **Territory prosperity +500**.
- Two **newly activated** Legendary abilities: `極寒統御` (passive) and `永凍星隕` (active).
- The **divine-power value** function is unlocked.

This advancement happens alongside Cao Xing's pre-existing personal Krakato Crystal inheritance. The exact branch cannot be given as a universal character class path or guaranteed rewards for other survivor Lords. The source supplies no general grade-independent rule that all Legendary breakthroughs give two skills.

## 3. FX29-0002 — `極寒統御` (Legendary passive)

Temperature-dependent thresholds, as literally stated in the Chapter 723 panel:

| Ambient temperature | Triggered effect |
|---|---|
| Below −30°C | Casting speed **+30%** |
| Below −50°C | Skill cooldown **−30%** |
| Below −60°C | Ice-type skills have **35–50%** chance to freeze enemies |
| Below −70°C | All ice-control durations **+50%** |
| Below −100°C | Triggers a named hidden `永凍王座` domain |

The source later explicitly shows **four** first effects simultaneously active at −80°C. The fifth domain is **named without a quantitative description**: no invented radius, cooldown, aura damage, ally modifier or personal temperature-generation requirement.

## 4. FX29-0003 — `永凍星隕` (Legendary active)

- **20 divine power** spent per use.
- Summons **one ice crystal meteor 100 m in diameter**.
- Direct collision region **2,000 m diameter**, damage `精神×30,000% + 攻擊力`.
- Secondary shockwave **10,000 m diameter**, damage `精神×10,000% + 攻擊力`.
- Leaves `霜晶領域` (Frost Crystal Domain) for **1 hour**.
- Each enemy inside suffers **one tick per second** with source literal formula `永凍君主攻擊力×22%×2` (combined crystal/ice).
- Source states target **armor −10%**, **movement speed −10%**, with a **maximum of three stacks**. The displayed panel does not separately disambiguate per-stack numerical interpretation beyond these values; preserve source.
- **24-hour cooldown**.

**Diameter is not radius.** Thus 2,000 m impact and 10,000 m shockwave are not 2,000 m and 10,000 m radius. Cao Xing's later very high damage projections incorporate his personal skills and are **not base hit damage**. Do not infer a kill rate, friendly-fire rules, ability to freeze a demigod or guaranteed full-hour residence of mobile enemies.

## 5. SX-0374 / FX29-0004 — `永罪冰獄（傳奇級）` observed book and learning

The Chapter 723 scene says Cao Xing already possessed the `永罪冰獄` **Legendary Frost Mage-only skillbook** from an earlier **first Dominator kill**. That is a **retrospective source-character statement**, not an independently verified earlier dated acquisition panel. This round registers one **existing source-character book that is now inspected and actually learned**, without retroactively adding a universal first-kill reward event.

- Learning gate: **level 100 Legendary Frost Mage**.
- Divine-power cost: **10**.
- Attack area: **5,000 m diameter**.
- Duration: **60 seconds**, with an end-stage finishing strike.
- The source **does not show exact per-second coefficient and terminal strike numeric damage** in the present passage.
- Cao Xing actually learns it, taking approximately **3 minutes** to absorb the knowledge.

No free book is granted to Lí Lan, no generic T0 class eligibility established, and skill learning is not confused with previous book possession.

## 6. FX29-0005 — Chapter 722 full-server broadcast

Ch722 issues an actual world-wide announcement of Cao Xing's Legendary promotion. Other player dialogue calls him the **second** survivor Legendary after Liu Muxue's Ch630 first-survivor promotion. The broadcast **does not display a special reward item**. It is not a first-global achievement and must not invent a title, chest, free skillbook or item reward.

His particular energy outburst also dispels ruin mist, with characters inferring accelerated inner-city access; this is a source-world consequence and does **not** schedule or fix the analogous LL01 ruin event.

## 7. Observations and limits

- `OBS29-01`: announcement vs unobserved first-global prize; no source rewards transferred.
- `OBS29-02`: protagonist-specific evolution and two ability activations with divine pool; not a global class reward.
- `OBS29-03`: one already owned book actually learned, earlier acquisition attribution from character memory but not independently dated.

Unverified EV22/23 Ancient Dragon shop panels, EV24 later Golden Shop inventory, and EV27 World Protector per-floor loot remain unpopulated. No title-only or rumored stock.

## 8. Preservation contract

1. Preserve all **373 existing SX item entries in order**, append **SX-0374** only.
2. Preserve all **107 existing effect records**, append `FX29-0001..0005`.
3. Preserve all **52 existing observations**, append `OBS29-01..03`.
4. Preserve all **14 original source conflicts** and all **30 fixed event schedule entries** unchanged.
5. Archive v2.8 JSON and CSV verbatim in `research/snapshots/events/`.
6. Item CSV retains original BOM, header, first 373 rows and column width, appends one row (total **374**).
7. Preserve canonical File01–07, 192 original chest seed, 15 Hero lairs, previous saves, active campaign, initial world states, Lí Lan's SSS class and T0.

## Outputs

`data/events/EVENT-SOURCE-CATALOG-v2.9.json`; `data/events/EVENT-SOURCE-ITEMS-v2.9.csv`; this audit; immutable parent snapshots; README/index revisions.
