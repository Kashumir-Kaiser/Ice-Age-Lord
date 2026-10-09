# LORD DND — Source Event/Shop/World Extraction Round 17 (v1.7)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.6-ON-TIMELINE-0.6` (298 entries, 46 effects, 23 observations). **New total:** 305 entries, 51 effects, 26 observations. **Authority:** research only; no actual campaign migration. **Date:** 2026-10-09.

## 1. Full-text primary evidence and source boundaries

- [Chapter 65 — Black Lion Merchant Guild visible priced inventory](https://czbooks.net/n/s6ojlf/s66i4fbn?chapterNumber=65). This is a real NPC merchant list with **six named, priced entries**, then ellipsis. The listed stock is not a complete market catalog.
- [Chapter 66 — rare Black Diamond negotiation, exact final system trade notice, faction commerce offer and acceptance](https://czbooks.net/n/s6ojlf/s66i4fbb?chapterNumber=66). Distinguish list price, opening quote, final settled barter, subsequent faction relationship.
- [Chapter 68 — 14 displaced Tree Spirits, negotiated cohort price, visitor status and House level-2 acceptance gate](https://czbooks.net/n/s6ojlf/s66i44i9?chapterNumber=68). The 68-page opening continues the chapter-66 scene; alternative book editions sometimes shift chapter numbers by one.

Repeated source searches for EV22/EV23 (Ch1079–1109), EV24 (Ch1137–1149) and EV27 (Ch1320–1339) still yielded **chapter index titles**, not reliable itemized price/settlement panels. No title-only evidence was promoted, regardless of how valuable the implied reward sounds.

## 2. Six source-grounded vendor offers, not initial inventory

| New ID | Original listing identity | Source price (Krona) | Stock bound |
|---|---|---:|---|
| `SX-0299` | `活力秘药（蓝）` — Bí Dược Sinh Lực (Lam) | 30,000 | **Unknown** |
| `SX-0300` | `极地冰晶之花（紫）` — Hoa Băng Tinh Cực Địa (Tử) | 50,000 | **Unknown** |
| `SX-0301` | `古代兵器·和平捍卫者（紫）` — Cổ Binh Khí — Người Bảo Vệ Hòa Bình (Tử) | 400,000 | **Unknown** |
| `SX-0302` | `12.7mm子弹` — Đạn 12,7 mm | 200 **per round** | **Unknown** |
| `SX-0303` | `碎岩大剑（紫）` — Đại Kiếm Phá Nham (Tử) | 310,000 | **Unknown** |
| `SX-0304` | `圣骑士之盾（金）` — Khiên Thánh Kỵ Sĩ (Kim) | 900,000 | **Unknown** |

The Black Lion Merchant list finishes in an ellipsis: do **not** generate unnamed seventh+ offers, global availability, restock dates or caps. A single NPC mobile merchant is not a permanently visible system shop. Each of these six entries has `acquisition_verified=false`; Ch66's specifically acquired shield is accounted for in a distinct receipt.

## 3. Verified actual acquisition — `SX-0305`

The source Ch65 list shows `圣骑士之盾（金）` for **900,000 Krona**. In Ch66, Hilton initially quotes Cao Xing's extraordinary Black Diamond at **950,000 Krona**, but accepts a further bargain. The **actual transaction notification** reports:

- One `黑钻` (Black Diamond) **consumed**.
- One `圣骑士之盾（金）` (Gold Paladin Shield) **received**.
- **100,000 Krona received** as additional cash.

At the named price panel, the final package's nominal consideration is **1,000,000 Krona**; the earlier **950,000** was an opening offer. They are not two cash deposits and must not be summed; the 50k difference is negotiation, **not an automatic reward**. `SX-0305` is one **observed receipt** for the same shield identity offered at `SX-0304`, not another globally guaranteed merchant listing, chest roll or diamond exchange formula.

## 4. Five structured effects relevant to long-lived game economy

| New effect | Machine-readable source fact | Important limit |
|---|---|---|
| `FX17-0001` | One actual 346 `黏稠的液体` sold for **17,300 Krona** (50 per unit) | One lot, not a perpetual universal posted buy order |
| `FX17-0002` | Ordinary Black Diamond range **200–400k**, superior example **500k**, source gem first quote **950k**, final diamond-to-shield-plus-100k receipt | Grade/negotiation dependent; not a global fixed conversion |
| `FX17-0003` | Prosperity-qualified territory **accepts** Guild trade-point proposal, guild relation turns **Friendly**, future Guild goods **95% list price** | Prosperity number, promised service fee and visit schedule unprinted; no automatic T0 Guild status |
| `FX17-0004` | Ch68 **14 Tree Spirit refugees**, initial quote 14 × 5,000 = 70k, **negotiated batch 65k**; guests first, formal join after house-cap upgrade and explicit consent, initial loyalty **60–70** | One group and one independent bargain; not a universal NPC market or instant spawned units |
| `FX17-0005` | **Lord House level 2:** +50 max residents, +200 reputation; observed 41/50 → 41/100; level-2 upgrades for some existing buildings unlocked | No global-first achievement; construction bill and level 3+ formulas unknown |

The Ch66 **95%-of-list-price** faction benefit should not be silently stacked on the separate Ch68 negotiated refugee offer as a known 60k or 61.75k cost. The source does not establish the sequencing or eligible category. Likewise, source merchants paying a service fee does not prove an amount or recurrence interval.

## 5. Research observations and game firewall

- `OBS17-01`: exact six listed NPC merchant goods and 12.7mm ammunition per-round pricing.
- `OBS17-02`: negotiated diamond-versus-shield barter separated from source-list price, optional trade relationship and future discount.
- `OBS17-03`: source refugee cohort and population cap gate; 14 named source people **never** transferred into Lí Lan's predefined world, and original Ch68 includes real recruitment consent.

**Unchanged:** the 30 scheduled events, clean-game T0 seed and fixed 192 original chest positions; the SSS Tử Phục source talent, canonical File01–07, source characters, previous item records/effects/observations and any existing save. The guild's physical arrival is research, not a scheduled new scripted encounter.

## 6. Exact release validation

1. **298 previous `SX` item records** remain in the same order and value. Append `SX-0299..SX-0305`, final **305**.
2. **46 prior mechanical effect records** unchanged; append `FX17-0001..0005`, final **51**.
3. **23 prior observations** unchanged; append `OBS17-01..03`, final **26**.
4. Item CSV retains BOM/header/column schema, all **298 old rows exactly**, appends seven new rows, final **305** records.
5. All **30** event schedule objects remain byte-equivalent in JSON structural terms; never mutate v0.6 timeline.
6. Archive parent v1.6 JSON and CSV in `research/snapshots/events/` using their exact prior content; don't rewrite historical archives.

## 7. Outputs

- `data/events/EVENT-SOURCE-CATALOG-v1.7.json`, `data/events/EVENT-SOURCE-ITEMS-v1.7.csv`.
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v1.6.json`, `research/snapshots/events/EVENT-SOURCE-ITEMS-v1.6.csv`.
- `research/extraction-audits/ROUND-17-SEVENTEENTH-EXTRACTION.md`.
