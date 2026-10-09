# LORD DND — Event Source Extraction Round 9 (v0.9)

**Parent:** event registry v0.8 (273 records); event schedule v0.6 (30 rows). **Status:** research-only, no campaign mutations.

## 1. Verified discovery

**12 distinct priced offers** in the source novel, original Chapter 285 (`军队抵达，荣誉商店开启`), mirror sections [622](https://www.bixiange.top/khjj/21282/622.html) and [623](https://www.bixiange.top/khjj/21282/623.html). The shop opened after the **first Construction Week day**, while Kingdom forces headed toward the Dolon Lake campaign. It is **not** an automatic EV07-only shop, and its closing time is not specified in the retrieved passage.

| New record | Source offer | Price (Điểm Vinh Dự) | Global limit |
|---|---|---:|---:|
| `SX-0274` | 5.000 Krona | 1 | not stated |
| `SX-0275` | Bí Dược Sinh Lực Cao Cấp | 3 | not stated |
| `SX-0276` | Chiến Mã Lạc Già Nặc — Bậc 3 | 10 | not stated |
| `SX-0277` | Chiến Mã Lạc Già Nặc Tinh Anh — Bậc 3 | 30 | not stated |
| `SX-0278` | Vũ Khí Vinh Dự (tùy chọn đại kiếm / rìu / trượng / dao găm) — Phẩm Tím | 50 | not stated |
| `SX-0279` | Bộ Trọng Giáp Kỵ Sĩ Quân Đoàn Thương Ưng — Phẩm Tím | 50 | not stated |
| `SX-0280` | Vũ Khí Băng Tinh Lấp Lánh (tùy chọn đao / rìu / trượng / kiếm) — Phẩm Kim | 500 | 1000 |
| `SX-0281` | Nỏ Công Thành Hủy Diệt — Phẩm Kim | 1,000 | 50 |
| `SX-0282` | Bản Vẽ Doanh Trại Huấn Luyện Trọng Kỵ Sĩ Bậc 3 | 2,000 | 30 |
| `SX-0283` | Máy Bắn Đá Cự Ma — Phẩm Kim | 2,000 | 20 |
| `SX-0284` | Pháo Nội La Tư — Phẩm Cam | 10,000 | 5 |
| `SX-0285` | Dao Găm Tử Thần — Tháp Đức Ô Thập — Phẩm Truyền Thuyết | 100,000 | 1 |

**Grouped lines:** The purple Honor weapons and Gold Ice-Crystal weapons are **shop choice families**, not four guaranteed separate catalogs. The purple Eagle Legion armor is one source set identity with **two pricing modes**: 50 points per piece or 300 for the full set. The available passage does not enumerate piece count. Do not multiply the stated global stock cap across weapon subtypes.

## 2. Three additional Anno fishing ranking reward contracts

Original Chapter 260 prize menu [source](https://www.bixiange.top/khjj/21282/552.html) and Chapter 267 confirmed receipt [source](https://www.bixiange.top/khjj/21282/571.html). These are NPC competition rewards with **one mutually exclusive choice per rank**, not instant world-wide shop entries.

- Rank 1: **125 first-tier goblin laborers OR 500,000 Krona**. The source protagonist chose the workers.
- Rank 2: **3 second-tier elite knights OR 300,000 Krona**. The second-place participant chose the coins.
- Rank 3: **5 second-tier normal knights OR 100,000 Krona**. Claim selection unknown.
- Fourth and lower prizes are truncated, so no rank-4+ reward entries are invented.

## 3. Source-only operational rules

- **Time and linkage:** Kingdom Shop becomes visible after day 1 of Construction Week; it supports the incoming siege against Dolon Lake. Fixed LL01 EV06/EV07 hours remain unchanged. Adopting the source relative trigger into the game calendar requires a separate pre-T0 approved trigger contract.
- **Viewing vs claiming:** remote inspection is allowed; actual exchange requires presence with the kingdom forces or in 永霜主城 (Vĩnh Sương main city). The legendary dagger specifically requires collection at the main city. This is not the generic instant-delivery system market.
- **Earn Honor, not XP:** listed cultist kills produce Honor by enemy type/tier: ordinary 1/2/3, elite 3/6/9, black-robed priest 30/60/90, white-robed priest 100/200/300, for tiers 1/2/3 in the quotation. Do not extrapolate numerical formulas beyond stated tiers.
- **Regional scope:** other regions do not automatically earn Honor for kills; chapter follow-up references mask redemption as an alternative, but an exact mask exchange ratio is not verified here.
- **Purchase limits:** global quantities 1, 5, 20, 30, 50 and 1000 are **stock caps** across the server, not per-account caps. Where no cap appears, use `UNKNOWN` rather than `UNLIMITED`.
- **Redemption:** spending 1 Honor Point to receive 5,000 Krona is a currency exchange item; it is not a recurring economic passive.

## 4. Why these were genuinely missed

- Previous v0.8: `EV06-CONSTRUCTION-WEEK = 0` item offers, `EV07-KINGDOM-WRATH = 0`. The source places the new Honor Shop inside EV06 (during construction) but its rewards are used in the EV07 war context. A keyword-only pass over "war event" did not find it.
- The new blueprint and siege weapon stock are explicitly offered and priced; unlike many late-game leads they do **not** rely on chapter headings alone. The Anno source panel gives ranks 1–3 precise alternatives even though an earlier extraction only knew the competition itself.
- Chapter numbering: the source labels **Chapter 285** inside the `bixiange` site **Section 622**, which is not Chapter 622. Cite both chapter and section to avoid off-by-hundreds errors.

## 5. Explicit exclusions / unresolved late-game pages

- EV22/23: Ancient Dragon basic/hidden exchange, Creation Light ownership and full prices remain unverified.
- EV24: later Golden Shop / event ranking full inventory remains unverified.
- EV27: World Protector six-tower floor-level reward panels remain unverified.
- Earlier research leads were cross-checked against actual chapter text where readable. Index titles and mismatched mirror content were **not** promoted into shop offers.
- The Dolon Lake exchange is **Kingdom currency based** and region-access limited; do not treat its stocks as a generic global event marketplace.

## 6. Validation and immutability

- 273 old JSON entries remain structurally and value-identical.
- 273 old CSV rows remain value-identical.
- 30 v0.6 event records remain identical and in the same order.
- All 288 record IDs are unique; all 15 new records have precise novel/source page and `RESEARCH_CANDIDATE_NOT_ACTIVE`.
- No item, blueprint or currency has been granted to the player; no chest commitment is reopened.

## 7. Produced files

- `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.9.json` — 288 complete records.
- `Lord_DnD_Event_Source_Items_v0.9.csv` — full reviewable catalog.
- `Lord_DnD_Event_Ninth_Extraction_Audit_v0.9.md` — this audit.
- `Lord_DnD_Li_Lan_Web_Game_Content_Redesign_v1.3.md` — parent game spec with ninth-pass appendix.
