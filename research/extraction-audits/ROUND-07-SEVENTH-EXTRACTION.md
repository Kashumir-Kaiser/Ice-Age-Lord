# LORD DND — EVENT SOURCE EXTRACTION ROUND 7 / v0.7

**Status:** research-only / not an activated game release
**Parent:** 244 source records in v0.6; fixed 30-event v0.6 chronology remains byte-equivalent at JSON-object level.
**Round 7 adds:** 22 new records and 5 independent mechanics observations; total 266 records.

## Source discoveries and deduplication

### EV08 — Chapter 366: the unrecorded parts of the recruitment shop

Existing SX-0039–SX-0042 already capture the first four basic troop scrolls and remain untouched. Round 7 adds the additional fully named listings below. Source panel has ellipses and says approximately 38 troop families total: **do not generate the omitted names**.

- Primary chapter panel: https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_366.html

| ID | New verified listing | Points | Stock cap shown |
|---|---|---:|---:|
| `SX-0245` | Quyển Tuyển Mộ Cung Thủ Đế Quốc Bậc 3 | 150 | 500 |
| `SX-0246` | Quyển Tuyển Mộ Kẻ Săn Trộm Kobold Bậc 3 | 300 | 1,000 |
| `SX-0247` | Quyển Tuyển Mộ Chiến Sĩ Ascalon Bậc 3 | 300 | 1,000 |
| `SX-0248` | Quyển Tuyển Mộ Chiến Sĩ Lợn Rừng Bậc 3 | 300 | 1,000 |
| `SX-0249` | Nhóm Cuộn Tuyển Mộ Nhân Mã Bậc 3 — chiến sĩ/cung thủ/kỵ binh thương khiên | 300 | 1,000 |
| `SX-0250` | Quyển Tuyển Mộ Tiên Phong Thú Nhân Bậc 3 | 400 | 500 |
| `SX-0251` | Quyển Tuyển Mộ Lính Đánh Thuê Bậc 3 | 400 | 500 |
| `SX-0252` | Quyển Tuyển Mộ Sát Thủ Bóng Tối Bậc 3 | 500 | 300 |
| `SX-0253` | Quyển Tuyển Mộ Kỵ Sĩ Bàn Tay Bạc Bậc 3 (không kèm thú cưỡi) | 1,000 | 100 |
| `SX-0254` | Quyển Tuyển Mộ Kiếm Sĩ Vương Quốc Sao Bậc 3 | 1,000 | 100 |
| `SX-0255` | Nhóm Cuộn Pháp Sư Học Đồ Bậc 3 — Đất/Nước/Gió/Sét | 1,000 | 100 |
| `SX-0256` | Quyển Tuyển Mộ Thích Khách Vương Quốc Mây Bậc 3 | 1,000 | 100 |
| `SX-0257` | Quyển Tuyển Mộ Vu Y Bộ Lạc Bậc 3 | 1,000 | 100 |
| `SX-0258` | Quyển Tuyển Mộ Xạ Thủ Hoàng Gia Bậc 3 | 1,300 | 100 |
| `SX-0259` | Quyển Tuyển Mộ Chiến Sĩ Người Lùn Bậc 3 | 1,000 | 100 |

The grouped centaur and elemental mage lines are **grouped offers**. It is not established that each sub-type receives an independent stock cap. Ch366 also guarantees at 50,000 points a Gold-grade or better roll (Epic chance 20%), and at 100,000 points an Epic-grade item; the rest of the exact roll pool is still unknown.

### EV08 — Chapter 427: actual Epic Wheel prize

- Source: https://www.69shuba.com/txt/58776/39432326
- **Diamond Membership Card (orange):** one observed Epic Wheel draw. A 20% cashback on purchases paid in coins/currency, nonstackable with same-type cards, and no same-goods repeated trading exploitation. **NOT** a universally guaranteed wheel prize.
- **First discovered and publicly disclosed Claw location:** 100 challenge points. Both first-discovery and map-publication qualifiers matter.

### EV09 — Chapter 427: additional Golden Points Shop offerings

- A **Thousand-Ice Staff** and **Ice-Flower Blooming Sword** are directly named as examples of orange-weapon offers; the listed orange weapon price is **200 Golden Points each**. No exact personal purchase in this chapter; do not infer the entire weapon stock or exact purchase limits.
- The four orange sets at 150/150/180/200 Golden Points per component were already SX-0051–SX-0054 and were NOT duplicated.

### EV14 — Chapters 815–816: floor-specific reward model

- Portal and regional formula: https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_818.html
- First-floor boss drop receipt: https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_819.html
- First regional floor clear: **100 × floor index Dream Fragments to each eligible lord**, plus a time-limited regional Dream Blessing (source says 3–10h).
- First eligible activator of that floor exit: **1,000 × floor index Dream Fragments**, on top of the regional grant. Rewards have separate idempotent recipient/scope keys.
- **First-floor aberrant Nightmare Mother** observed loot: **1,475 Dream Fragments and one Dream Crystal**; observed receipt, not a guaranteed boss loot table for all floors.

### EV14 — Chapter 891: availability/settlement rule

- Source: https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_894.html
- The Dream dungeon entrance closes at 00:00 on the last event day, while its shop closes at 06:00 the following day. Keep event and shop lifetimes separate; the fixed LL01 v0.6 event schedule is NOT changed as part of the extraction. A future versioned shop-lifetime binding must reconcile the UTC-relative game schedule with this local-time source instruction.

## New rows (concise)

| ID | Event | Channel | Name |
|---|---|---|---|
| `SX-0245` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Cung Thủ Đế Quốc Bậc 3 |
| `SX-0246` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Kẻ Săn Trộm Kobold Bậc 3 |
| `SX-0247` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Chiến Sĩ Ascalon Bậc 3 |
| `SX-0248` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Chiến Sĩ Lợn Rừng Bậc 3 |
| `SX-0249` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Nhóm Cuộn Tuyển Mộ Nhân Mã Bậc 3 — chiến sĩ/cung thủ/kỵ binh thương khiên |
| `SX-0250` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Tiên Phong Thú Nhân Bậc 3 |
| `SX-0251` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Lính Đánh Thuê Bậc 3 |
| `SX-0252` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Sát Thủ Bóng Tối Bậc 3 |
| `SX-0253` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Kỵ Sĩ Bàn Tay Bạc Bậc 3 (không kèm thú cưỡi) |
| `SX-0254` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Kiếm Sĩ Vương Quốc Sao Bậc 3 |
| `SX-0255` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Nhóm Cuộn Pháp Sư Học Đồ Bậc 3 — Đất/Nước/Gió/Sét |
| `SX-0256` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Thích Khách Vương Quốc Mây Bậc 3 |
| `SX-0257` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Vu Y Bộ Lạc Bậc 3 |
| `SX-0258` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Xạ Thủ Hoàng Gia Bậc 3 |
| `SX-0259` | EV08-WORLD-BOSS | NORMAL_POINT_SHOP_LISTING | Quyển Tuyển Mộ Chiến Sĩ Người Lùn Bậc 3 |
| `SX-0260` | EV08-WORLD-BOSS | EVENT_DISCOVERY_PUBLICATION_REWARD | Thưởng Công Bố Vị Trí Vuốt Trảo Trác Mã |
| `SX-0261` | EV08-WORLD-BOSS | EPIC_WHEEL_OBSERVED | Thẻ Thành Viên Kim Cương (Cam) |
| `SX-0262` | EV09-ORACLE-WAR | GOLDEN_POINT_SHOP_LISTING | Trượng Thiên Băng |
| `SX-0263` | EV09-ORACLE-WAR | GOLDEN_POINT_SHOP_LISTING | Trường Kiếm Băng Hoa Nở Rộ |
| `SX-0264` | EV14-DREAM-SHARD | REGIONAL_FLOOR_FIRST_CLEAR_REWARD | Mảnh Mộng — thưởng cộng đồng khi thông quan tầng |
| `SX-0265` | EV14-DREAM-SHARD | PORTAL_FIRST_ACTIVATOR_BONUS | Mảnh Mộng — thưởng người kích hoạt cổng đầu tiên |
| `SX-0266` | EV14-DREAM-SHARD | OBSERVED_FLOOR_ONE_BOSS_DROP | Chiến Lợi Phẩm Mộng Cảnh — boss tầng một |

## Late-game investigation: evidence quality boundary

- Reviewed chapter indices around **1079–1086, 1103–1108, 1122–1138, 1148, 1235–1260, 1315–1320**, including original and alternate-title editions.
- Chapters titled **“Hidden Shop”**, **“Clear Golden Shop”**, **“World Protector”** and **“Tower Trial Reward”** are useful navigation leads, **not item panels**. Some mirrors shift chapter numbers by one and others contain unrelated paragraph injections. No invented EV22/EV23/EV24/EV27 prices or probabilities are added.
- The existing SX-0210 Creation Light remains research-only; this pass has NOT inferred an acquisition or construction recipe from its title.

## Guardrails

1. Single-player Lí Lan has SSS Tử Phục, but ordinary event recruitment is still an independent optional acquisition channel. No player talent rolls or changed hero skills.
2. No normal shop entry is automatically a chest drop; no observed wheel drop defines the probability distribution.
3. Zero net new items at T0, no retroactive event edits, no forced acquisition, no blueprint learned without receipt.
4. No change to 30-event schedule, no hidden increase in corpse revival cost, no dynamic event scaling.
5. Do not mistake source panel grouped variant choices for independent unlimited stocks.
6. Late-game chapter-only leads remain `UNVERIFIED_SOURCE_TEXT`, not imported records.

## Deliverables

- `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.7.json`
- `Lord_DnD_Event_Source_Items_v0.7.csv`
- `Lord_DnD_Event_Seventh_Extraction_Audit_v0.7.md`
- `Lord_DnD_Li_Lan_Web_Game_Content_Redesign_v1.1.md`
