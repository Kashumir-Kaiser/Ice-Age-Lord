# Lord DnD — Event Source Extraction Round 8 (v0.8)

**Authority:** source research for a future *fixed-events* Lí Lan web game, **not** an activated campaign update. Parent: v0.7, 266 records. Reconciled event calendar: v0.6, 30 events, kept byte-equivalent at the JSON data level.

## 1. Results

- **7 genuinely new source shop offers** (`SX-0267`–`SX-0273`): EV09 Oracle War, Golden Points recruitment scrolls.
- **3 additional item effect contracts** (`FX8-0001`–`FX8-0003`): parts and full-set active skill for already listed `SX-0051` Ancient Winter Set; counted as *effects*, not 3 new item offers.
- **4 research observations**, including two chapter-index-only leads excluded from the item pool.
- Total **273 item/reward entries**; previous 266 retained **without mutation**. No additions to v0.6 schedule, no retcon of inventories or fixed chests.

## 2. Directly verified new offers — Oracle War Golden Points Shop

Source: novel Chapter 427 Golden Shop panel / Chapter 428 boundary in an alternate mirror.

- [69shuba — Chapter 427, Golden Points shop panel](https://www.69shuba.com/txt/58776/39432326)
- [Bixiange — Section 1041, Golden Shop and Chapter 428 transition](https://www.bixiange.top/khjj/21282/1041.html)

All prices below use **Điểm Hoàng Kim**. `purchase_limit` is the personal maximum visible in the panel; it is not a free grant and it is not evidence of infinite stock.

| ID | Chinese exact identity | Vietnamese display | Price | Max purchases |
|---|---|---|---:|---:|
| `SX-0267` | 巨龙萨满招募卷轴（四阶首领级） | Quyển Tuyển Mộ Đại Tế Ti Long Tộc — Bậc 4, cấp Đầu Lĩnh | 100 | 3 |
| `SX-0268` | 圣女亲卫龙血斗士卷轴（四阶首领级） | Quyển Tuyển Mộ Chiến Sĩ Long Huyết Cận Vệ Thánh Nữ — Bậc 4, cấp Đầu Lĩnh | 100 | 3 |
| `SX-0269` | 雪原暴君招募卷轴（四阶统帅级） | Quyển Tuyển Mộ Bạo Quân Tuyết Nguyên — Bậc 4, cấp Thống Soái | 500 | 1 |
| `SX-0270` | 乔德·铁霜的幻影卷轴（四阶统帅级） | Quyển Tuyển Mộ Huyễn Ảnh Kiều Đức Thiết Sương — Bậc 4, cấp Thống Soái | 500 | 1 |
| `SX-0271` | 伊萨尼·低语者招募卷轴（四阶统帅级） | Quyển Tuyển Mộ Y Tát Ni — Kẻ Thì Thầm — Bậc 4, cấp Thống Soái | 500 | 1 |
| `SX-0272` | 女祭司法娜兹招募卷轴（四阶统帅级） | Quyển Tuyển Mộ Nữ Tế Ti Pháp Na Tư — Bậc 4, cấp Thống Soái | 1000 | 1 |
| `SX-0273` | 拜弗·黑心招募卷轴（五阶主宰级） | Quyển Tuyển Mộ Bái Phất Hắc Tâm — Bậc 5, cấp Chúa Tể | 3000 | 1 |

**The important distinguishing features:** These are seven separate *scroll items*. A named scroll is a legitimate optional source acquisition channel, but is not a pre-existing recruited named hero at T0 and cannot replace or reroll Lí Lan's fixed talent. Actor/NPC identity, unit ID and recruitment consumption must be settled on actual valid use.

## 3. Corrected item effects — already-known Ancient Winter Set

Source: [69shuba Chapter 454, actually purchased trousers/boots and inspected full set](https://www.69shuba.com/txt/58776/39496152).

| Effect ID | Observed object | Specific mechanical consequence |
|---|---|---|
| `FX8-0001` | Ancient Winter trousers | Shield triggered on incoming attack (100% described chance), mitigating **27% magical damage** |
| `FX8-0002` | Ancient Winter boots | **30% chance** to raise damage of the cast magical skill by **50%** |
| `FX8-0003` | Ancient Winter 3-piece set | **Active** winter in **3,000 m diameter**; environmental cold −20 to −30°C (not harmful to allies); snow affects opposing visibility and movement; allied ice attacks **+30% damage and +30% range**, **120 seconds**, **1-hour cooldown** |

The source character bought the trousers and boots for a combined 300 Golden Points and two named scrolls for 600; the receipts corroborate listed prices. They are **not separate duplicate rewards**.

Do not assume this defensive/ice-centered set boosts Tử Phục itself; its stated skill effects have limited target/ability semantics.

## 4. Unresolved late-game material — *not* new entries

Verified chapter **titles/index placement** but **not sufficiently readable reward panels**:

| Target | Navigational chapter leads | Reason for exclusion |
|---|---|---|
| EV22 / EV23 Ancient Dragon | Ch. 1079–1081 new shops, godheads, divine flame, demigod blueprints; Ch. 1087 shop-clearing; Ch. 1108–1109 hidden shop; Ch. 1123–1125 postbattle/Creation Light | Chapter labels do not prove price, stock limits, acquisition or exact blueprint recipe. Some mirrors use a +1 offset and others return unrelated chapter content |
| EV24 Dragon Festival | Ch. 1137–1138 later Golden Shop; Ch. 1148–1149 battle power evaluations; Ch. 1235–1238 seasonal settlement | Existing fixed Power Test rewards are recorded. Unknown Golden Shop stock cannot be backfilled from title-only clues |
| EV27 World Protector | Ch. 1306–1321 Tower region; Ch. 1329–1339 multi-tower settlement | Reward details, recipient scopes and technical effects not extracted from actual panels. Do not generalize named protagonist unique achievements to everyone |

Navigation sources: [Golden House indexed original chapters](https://tw.hjwzw.com/Book/Chapter/50356), [secondary chapter listing](https://m.cpxs123.cc/book/187022/list.html).

## 5. Source integrity and game import rules

1. **Keep 30 fixed v0.6 event windows:** extraction does not change the schedule; no phantom chapters create phantom events.
2. **No generic hero spawning:** acquisition scrolls are items with exact named NPC/actor templates, not an excuse for 64 random hero archetypes.
3. **Distinct reward channels:** shop offer, actual purchase, observed chest, guaranteed clear reward, first-place prize and actor drop are never combined or double-awarded.
4. **No new Tử Phục gate, fee, duration or cooldown.** The set benefits normal combat/survival as its text actually specifies.
5. **No retroactive chest rerolls.** Research-only entries require an approved pre-T0 event content version to appear in new-game runtime.
6. **Mirrored numbering uncertainty** is tracked as Chapter 427/428, not treated as two distinct offers.
7. v0.7's 266 old JSON entries and 30 event schedule rows are preserved exactly; new findings are append-only.

## 6. Release files

- `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.8.json`
- `Lord_DnD_Event_Source_Items_v0.8.csv`
- `Lord_DnD_Event_Eighth_Extraction_Audit_v0.8.md`
- `Lord_DnD_Li_Lan_Web_Game_Content_Redesign_v1.2.md`
