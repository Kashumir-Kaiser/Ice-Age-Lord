# LORD DND — Extraction Round 21 (v2.1)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.0-ON-TIMELINE-0.6`. 319 source entries unchanged, effects 66 → 68, observations 31 → 32, provenance conflicts +1; fixed 30 calendar events unchanged.

## Source evidence and receipts

- [Original Ch279 — bulk Power Heart purchases](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_279.html): purchased **120 初级力量之心** for **120,000 冰龙印记**, and **120 中级力量之心** for **1,200,000**; explicit deduction totals **1,320,000**. Derived actual per-unit rates: 1,000 and 10,000 respectively. Recorded as `FX21-0001`.
- [Original Ch631 — three Power Heart confirmation panels](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_632.html) (URL page 632): **300 初级力量之心** for **600,000**, **500 中级力量之心** for **5,000,000**, **400 高级力量之心** for **20,000,000**. Derived rates 2,000, 10,000, and 50,000 per unit. Combined displayed confirmations: **25,600,000**. Recorded as `FX21-0002`.
- [Original Ch118 — initial shop listing](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_118.html): initial listed basic Power Heart **1,000** per unit. This aligns with Ch279 but differs from Ch631.

## Source contradiction (retain unresolved)

`CONFLICT-POWER-HEART-BASIC-CH118-279-631`: Initial basic Power Heart posted price and early fulfilled receipt **1,000**, later source confirmation **2,000**. The panels alone **do not establish why** this happens: price update, version difference, source error or other cause remains unknown. The intermediate actual rate is 10,000 in both receipts; advanced rate at Ch631 matches earlier Ch362 posted 50,000. Do not silently revise `SX-0012` or apply 2,000 to all existing/new campaigns.

## Boundaries

- These are observed *transactions*, not global offers or full shop inventory.
- No new source item identities: the Power Heart item(s) already exist in the catalog.
- Ch631 identifies Expert Power Heart as available, but gives no transaction price or completed purchase; do not fabricate either.
- No P2P / world event guarantee or NPC inventories inferred; no campaign mutation.
- Preserve all prior `SX`, `FX`, observations, conflict records, event schedule, original 192 chests, and 15 Hero lairs.

## Regression checks

Append `FX21-0001..0002`, `OBS21-01`, and conflict entry only. Exactly 319 source items, 68 effects, 32 observations, 30 event schedule entries. Archive v2.0 JSON and CSV, and publish v2.1 review CSV unchanged because there were no new item rows.
