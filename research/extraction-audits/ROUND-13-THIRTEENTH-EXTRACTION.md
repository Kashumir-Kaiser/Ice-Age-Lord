# LORD DND — Event Source Extraction Round 13 (v1.3)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.2-ON-TIMELINE-0.6` (292 entries, 27 mechanic effects, 13 observations). **Status:** research-only, not a web-game/legacy campaign release. **Date:** 2026-10-09.

## 1. Evidence obtained from readable actual source passages

- [Original Ch522 in the alternate-title mirror](https://czbooks.net/n/s6ojlf/s6o9bj9k?chapterNumber=522) — observed purchase receipt for `专家级冰霜城墙建造图纸`, plus the complete mechanical description shown after inspection.
- [Original Ch909 in the alternate-title mirror](https://czbooks.net/n/s6ojlf/s6ofpgfb?chapterNumber=911) — observed Arctic Sea battlefield-salvage quantities and explanation of the Ice Nest monster drop categories. The mirror URL uses `chapterNumber=911` but **the page content heading reads 第909章**. Use the on-page chapter identity, not the URL index, to label this entry.

The official-novel title also circulates as `全球降临：带着嫂嫂末世种田`. The above passages were returned with matching novel, chapter heading and on-topic body text. The still-unreadable late-game reward panels cannot be substituted with index/headline data.

## 2. New source reward entry — ONE observed batch, not universal loot

| ID | Ch. | Route | Source-explicit contents |
|---|---:|---|---|
| `SX-0293` | 909 | Arctic Sea battle, one collection of spoils after **more than ten million** Ice Nest enemies defeated | **Eleven individually listed item categories** (see amounts below); source then gives an ellipsis, so the full batch is incomplete |

| Listed item identity | Exact observed batch quantity |
|---|---:|
| 冰龙印记 — Băng Long Ấn | 4,182,552 |
| 冰川裂片 — Mảnh Băng Xuyên | 2,052,516 |
| 寒地符文石（未知） — Đá Phù Văn Hàn Địa (phẩm chưa xác định) | 2 |
| 死亡能量球体（未知） — Cầu Năng Lượng Tử Vong (phẩm chưa xác định) | 1 |
| 冰川内核（橙） — Lõi Băng Xuyên (Cam) | 45,129 |
| 污秽精华（紫） — Tinh Hoa Ô Uế (Tím) | 1,842,562 |
| 邪恶精华（金） — Tinh Hoa Tà Ác (Kim) | 217,924 |
| 腐烂精华（橙） — Tinh Hoa Hư Thối (Cam) | 16,684 |
| 龙岩矿（金） — Quặng Long Nham (Kim) | 178,929 |
| 中级属性之书 — Sách Thuộc Tính Trung Cấp | 1,192,345 |
| 高级属性之书 — Sách Thuộc Tính Cao Cấp | 51,852 |

**Proof boundary:** these totals are one collection receipt from the source character's battle, not one enemy's drop, a per-kill formula, a chest, a recurring event award, or an exhaustive drop pool. The source explicitly elides further lines. `event_id=null`, `source_only_context=ARCTIC_SEA_BATTLE_NOT_MAPPED_TO_LL01_FIXED_30_EVENT_CLOCK`; no chests or source assets are pre-granted in Lí Lan's clean T0 world.

## 3. Two new effect contracts linked to existing or newly observed records

### `FX13-0001` — Expert Frost Wall, existing `SX-0016`

Ch522 source confirms the **actual purchase** for **400,000 Ice Dragon Marks**; this follows the Ch362 listing already preserved as `SX-0016`. The purchased blueprint upgrades a pre-existing **advanced frost wall**, not an empty plot. The inspected expert wall displays:

- **Armor:** 1,500; **durability:** 100,000.
- **Expert Frost Aura:** within **100 m** of the wall, nearby allies receive **+300 armor**.
- **Wall damage intake:** reduced by **30%**.

Exact stacking among overlapping wall auras, build time, level prerequisites beyond the advanced wall, underlying material bill and damage-reduction calculation order are **UNKNOWN**. This is a new structured **effect**, not another blueprint drop or automatically owned learned drawing.

### `FX13-0002` — Ch909 Ice Nest battlefield drop context, `SX-0293`

These particular ice/dragon-powered monsters yielded mainly materials and attribute books, and **no conventional gear** in the described collective spoils. That cannot be generalized to all monsters, replicated as a universal per-kill loot table, or applied to resurrection legality. The source contains no data on individual corpse persistence; `Tử Phục` legality remains governed by its own authoritative world/corpse rules. Unique batch totals must never be divided by an estimated kill count to reverse-engineer drop weights.

## 4. Two source observations — timing, not silent schedule changes

- `OBS13-01`: Ch522 actual paid purchase of a blueprint offered in Ch362. This demonstrates one source user's **later ability to purchase**, not a universal shop expiry or permanent listing; the fixed v0.6 event calendar cannot be rewritten from chapter travel time.
- `OBS13-02`: Ch909 Ice Dragon Marks drop even though the character recalls the previous Dragon Shop stock as exhausted and **predicts** an upcoming reopening. A prediction is not a new system announcement. No vendor opening timestamp, exact new inventory, or shop-lifetime contract is established here.

## 5. Remaining late-game blockers, honestly retained

- EV22–23: Ch1079–1086 and 1108–1125 have index-verified dragon shop/hidden-shop chapters, but not a sufficiently readable exact offer list, award receipt and stock scope.
- EV24: Ch1137/1138 later Golden Shop details and exact purchasers remain unverified; do not reverse-engineer from chapter titles.
- EV27: Ch1329–1339 tower clear tiers, four-throne artifacts and six-tower settlement still need actual body text with recipients and conditions. Chapter title alone is not a reward contract.

No unsupported price, stock cap, duration, reward quantity or player acquisition is generated for these leads.

## 6. Regression checks and outputs

1. **292** earlier `SX` records unchanged, appended only `SX-0293`, now **293**.
2. **27** earlier effect records unchanged, appended `FX13-0001`, `FX13-0002`, now **29**.
3. **13** previous research observations unchanged, appended `OBS13-01`, `OBS13-02`, now **15**.
4. CSV preserves original UTF-8 BOM, original columns and all **292** previous rows identically, with a single appended record; final review CSV has **293** data rows.
5. `event_schedule` remains the **same 30 objects in the same order**; neither v0.6 timeline file changed.
6. v1.2 JSON and CSV are archived under `research/snapshots/events/`. Source/canonical File01–07, saved states, preseeded chests, hero identities, talent and existing source offers are untouched.
7. All additions are `RESEARCH_CANDIDATE_NOT_ACTIVE`; these facts do not authorize new runtime loot receipts.

**New current files:** `data/events/EVENT-SOURCE-CATALOG-v1.3.json`, `data/events/EVENT-SOURCE-ITEMS-v1.3.csv`, `research/extraction-audits/ROUND-13-THIRTEENTH-EXTRACTION.md`.
