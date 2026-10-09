# LORD DND — Extraction Round 20 (v2.0)

Parent: `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.9-ON-TIMELINE-0.6`. Source items **319 → 319**; effects **64 → 66**; observations **30 → 31**; calendar events **30 unchanged**. Research only; no state migration.

Primary source: [Chapter 809, mirror page 812](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_812.html).

## FX20-0001 — 机械装甲·单兵推进器（橙） / Cơ Giáp — Bộ Đẩy Đơn Binh

Previously acquired skillbook `SX-0315`. Epic; level 70+ Cold-Iron Mechanist. Costs 2,000 mechanical power, 1,000 mithril, 500 eternal-gold ingots and 5 Derimo-steel ingots. Buffs one allied mechanical unit: +100% armor, +300% movement speed and flight capability. Landing explosion deals 245% of the mechanist's attack power and knocks back enemies within 50 m. Lasts 5 minutes; cooldown 2 hours. The **50-m value is explicitly knockback range**; the blast damage radius itself was not established. No generic free flight for all mechanical units.

## FX20-0002 — 钢铁洪流 / Dòng Lũ Sắt Thép

Previously acquired skillbook `SX-0316`. Legendary; level 100+ Legendary Cold-Iron Mechanist. Costs 30 divine power, 30,000 mechanical power, 10,000 mithril, 2,000 eternal-gold ingots, 300 Derimo-steel ingots and 100 enhanced-mithril ingots. Summons **1,124 war turrets**, each inheriting 70% of caster attributes, with automatic aim, multishot, fire coverage and mobile firing. Destroyed turrets explode in a **100-m** area dealing the source's literal **mechanist attack ×350** fire damage. This is **not** automatically 350%; the source expression lacks a percentage sign. Duration one minute; cooldown 24 hours.

## Integrity and boundaries

- These are two mechanical effect contracts appended to existing skillbook item IDs; **no new SX items** and **no duplicate acquisitions**.
- All 319 item rows and 30 calendar events remain unchanged. Prior 64 effects and 30 observations are preserved; append `FX20-0001`, `FX20-0002` and `OBS20-01`.
- v1.9 source JSON/CSV remain preserved in historical snapshots. The v2.0 item CSV is identical to v1.9 because no item records were added.
- No guessed turret ammunition, blast percentage, source shop offer, level-gated universal learning, or campaign starting possession.
- EV22/23 ancient dragon shop panels, EV24 later Golden Shop itemized stock and EV27 World Protector per-floor reward panels remain unverified.
