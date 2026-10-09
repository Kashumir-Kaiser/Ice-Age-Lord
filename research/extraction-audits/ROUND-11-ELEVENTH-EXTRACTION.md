# LORD DND — Event Source Extraction Round 11 (v1.1)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.0-ON-TIMELINE-0.6` (**291** entries; **19** source-effect records). **Scope:** Source research only; no campaign/world/scheduled-event mutation. **Date:** 2026-10-09.

## 1. Confirmed new source object

| ID | Original chapter | Identity | Source channel | Verifiable result |
|---|---|---|---|---|
| `SX-0292` | 928 | `赤霄宝箱` — Rương Xích Tiêu | God-guarded physical world chest, not event-shop listing | Examined chest provides a guaranteed minimum of **one legendary-grade reward**, with an **extremely small but unquantified chance** at one demigod-grade equipment/prop |

Primary evidence: [Ch928 full narrative and chest inspection](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_931.html). The source describes a chest in a guarded area, and mentions a **second mapped chest lead** elsewhere near/beyond the Eternal Frozen Sea. It **does not** confirm a second acquired/opened instance, precise coordinate, event placement, or numerical rarity rate. The second lead is recorded only as `OBS11-01`.

This is **not a second EV24 SSS power-test prize**: the previously extracted `SX-0205` names the *same chest template* but records a distinct conditional **rank reward instance** from Ch1147. `SX-0292` preserves the other **source scene and acquisition channel**. Each cache / awarded chest still needs an immutable instance and its own receipt at runtime.

## 2. Source-effect extraction (not duplicate product drops)

| Effect ID | Linked existing/new record | What the novel actually establishes | Explicitly unknown |
|---|---|---|---|
| `FX11-0001` | `SX-0292` / `SX-0205` | Ch928 `赤霄宝箱`: 100% chance of **at least one legendary equipment/item/scroll/blueprint or similar**, very small chance of one demigod-grade item | Exact demigod chance, all table weights, number of additional rewards, whether any LL01 cache uses that template |
| `FX11-0002` | `SX-0189` | Ch886 `光明神火`: Light-specific advancement compatibility; conversion to `纯净神火` costs **2,000 divine power** | Breakthrough probabilities, universality to other flames, automatic application to Lí Lan |

Source text: [Ch928](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_931.html) and [Ch886 Light God drop and conversion](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_889.html). Effects are **mechanic research**, not additional quest prizes. In particular, `SX-0187` (S-quest Light Godhead), `SX-0188` (choice relic chest), and `SX-0189` (boss flame) keep their separate existing channels and are **not reissued**.

## 3. Late-game focus: unresolved despite additional checking

Targeted original/mirror chapter references reviewed: **1079–1087**, **1103–1109**, **1122–1126**, **1132–1138**, **1320–1321**, **1330–1339**. Readable **full reward panels with specific item prices/stock limits** for EV22/23 ancient-dragon shops, EV24 later Golden Shop and EV27 multi-tower settlements were **not accessible in this pass**. Chapter-index titles alone cannot prove a specific exchange rate, reward recipient, floor-claim rule or stock cap. Those targets remain `UNVERIFIED`; **zero new rows** were generated from their titles.

Index navigation (chapter identity only): [Golden House catalog](https://tw.hjwzw.com/Book/Chapter/50356); [novel chapter index](https://ttks.tw/novel/chapters/quanqiujianglindaizhaosaosaomoshizhongtian/index.html). Some mirrors differ by one chapter, so require chapter title **and actual scene text** before a later import.

## 4. Validation / game firewall

1. All **291** old entries and **19** old source-effect records preserved value-identically, in the same order; `SX-0292`, `FX11-0001`, `FX11-0002` are new stable IDs.
2. Original v1.0 JSON/CSV retained in `research/snapshots/events/`; current research v1.1 is additive. The new CSV is old header + **291** unchanged rows + one appended row = **292** records.
3. `event_schedule` remains **30 unchanged events**, with no event assigned to the world chest. No active game drop table or new cache is created.
4. `source_effect_records` now totals **21**; no extra 2 item offers minted from those effect entries.
5. No previous rank reward duplicated; `Tử Phục` conditions, T0 seed/chest map and original `LORD-DND-01..07` references untouched.
6. Every novel-derived new field retains `SOURCE_EXPLICIT` or `UNKNOWN`; game-specific adoption stays `RESEARCH_CANDIDATE_NOT_ACTIVE`.

## 5. Files

- Current: `data/events/EVENT-SOURCE-CATALOG-v1.1.json` and `data/events/EVENT-SOURCE-ITEMS-v1.1.csv`.
- Historical: `research/snapshots/events/EVENT-SOURCE-CATALOG-v1.0.json`, `research/snapshots/events/EVENT-SOURCE-ITEMS-v1.0.csv`.
- Audit: `research/extraction-audits/ROUND-11-ELEVENTH-EXTRACTION.md`.
