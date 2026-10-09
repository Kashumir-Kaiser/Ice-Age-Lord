# LORD DND — SECOND SOURCE EXTRACTION (v0.2)

**Status:** Research-only; no active game source, fixed event dates, chest commitments, prices or saved state modified.

**Baseline:** 100 source records from v0.1. **Additional records:** 57. **Combined total:** 157. **Distinct chapters indexed:** 28. This is still **not** a cover-to-cover audit of all 1,358 novel chapters.

## 1. What the first extraction missed

1. **EV10 monster siege:** wave-clear Bronze ×3 (ch480), Gold ×1 (ch481), Moon ×1 (ch483). A chest awarded at a wave checkpoint is a generic-rarity chest with event *provenance*, not necessarily a special themed event-exclusive chest. See [ch480](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_481.html), [ch481](https://www.69shuba.com/txt/58776/39606488), [ch483](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_484.html).
2. **EV15 Golden Skork Rat treasure event:** silver/gold/king monster bags; separate first server kill reward; separate zodiac rune ground drop; hidden cumulative-kill achievements at 10, 100, 1,000; one observed gold bag; very large observed batch of silver/gold bags. See [ch824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html), [ch826](https://www.69shuba.com/txt/58776/40564829), [ch828](https://www.69shuba.com/txt/58776/40564831), [ch829](https://www.69shuba.com/txt/58776/40564832), [ch830](https://www.69shuba.com/txt/58776/40564833), [ch833](https://www.69shuba.com/txt/58776/40564836).
3. **EV14 Dream Shop:** v0.1 omitted several **initially visible** progression offers, despite the following chapter listing their prices and limits. [Ch811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) gives five new item lines; the sixth, **Thần Lực Fragment at 50,000**, was already in v0.1 but incorrectly characterized only as a later purchase. The two legendary building upgrades were also visible in ch811 before their ch892 purchase.
4. **EV13 Blood War:** [ch638](https://www.69shuba.com/txt/58776/40564639) confirms actual purchase of four major blueprints and the functional effects/materials of the Blood Crystal Tower and Blood Demon Hatchery; v0.1 recorded the offers but not this concrete behavior.

## 2. New records by event

| Event | Additional source-backed rows | Total after pass 2 |
|---|---:|---:|
| `EV10-MONSTER-SIEGE` | 3 | 3 |
| `EV14-DREAM-SHARD` | 5 | 13 |
| `EV15-SKORK-RAT` | 49 | 49 |

## 3. Correct event reward categories

| Channel | Trigger/source | Required treatment |
|---|---|---|
| `SHOP_EARLY_PHASE` | Item listed as available | Record exact offer, price, limit, currency, release/opening time |
| `SHOP_PURCHASE_OBSERVED` | Actual transaction | Proves a purchase at a later chapter, **not** a later item unlock |
| `WAVE_CLEAR_REWARD` | Individual defensive wave cleared | Award that wave once when its actual requirements resolve |
| `EVENT_KILL_DROP` | Real event-monster defeat | Bag dropped; corpse survival governed by event creature anatomy and source |
| `BAG_OBSERVED` | Single observed bag opening | Candidate possible contents; **never** one universal guaranteed recipe |
| `BAG_BATCH_OBSERVED` | Hundreds of bags opened together | Aggregates only; **cannot** imply per-bag contents or percentages |
| `SERVER_FIRST_KILL` | Unique global kill event | Exactly one eligible claimant, not duplicated for later killers |
| `HIDDEN_ACHIEVEMENT` | 10/100/1000 kills within event | One-time milestone, no per-kill spam |
| `BOSS_GROUND_DROP` | Ground object following boss death | **Not** merged into the boss bag |

## 4. Newly verified Dream shop offers — ch811

| Item | Price (Dream Fragments) | Stated limit |
|---|---:|---:|
| Trái Tim Sức Mạnh Chuyên Gia | 5,000 | 5,000 |
| Trái Tim Sức Mạnh Đại Sư | 50,000 | 1,000 |
| Trái Tim Sức Mạnh Anh Hùng | 200,000 | 10 |
| Trái Tim Truyền Kỳ | 1,000,000 | 3 |
| Rương Di Vật Ngẫu Nhiên | 1,500,000 | 2 |
| Mảnh Thần Lực (**existing v0.1 entry now recategorized**) | 50,000 | 200 |

These limits are source-observed counts. Account-vs-server applicability must be checked against precise source wording before implementation; they are not casually marked GLOBAL.

## 5. Rat-hunting hidden achievements — ch824 and ch830

| Kill milestone | Reward package |
|---:|---|
| 10 | 1 Silver Skork bag + 1 Silver Chest + 500 reputation |
| 100 | 1 Gold Skork bag + 1 Gold Chest + 2,000 reputation |
| 1,000 | Rat-Hunting Captain title + 1 Moon Chest + 20,000 reputation |

Source: [ch824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html); third milestone completion is shown in [ch830](https://www.69shuba.com/txt/58776/40564833). These are **three separate achievement contracts**, not automatically included in the normal bag drops.

## 6. Major conflicts requiring decisions before activation

**A. Source duration versus frozen event schedule.** The novel describes the rat event lasting **one month**, while the LL01 EV15 registry opens at T0+3984h, locks at T0+4152h (**7 days of activity**), and resolves at T0+4176h (**8 days from opening**). Since events are set in stone, the extraction keeps the LL01 window and marks this discrepancy explicitly; it cannot claim source timing is unchanged.

**B. Death does not necessarily leave a revivable corpse.** Ch824 describes a slain Skork Rat dissolving into light and leaving its bag. It would be incorrect to quietly convert every event-monster kill into a persistent body suitable for Lí Lan’s Tử Phục.

**C. Source offer versus purchase timestamp.** v0.1 placed the two legendary Dream building blueprint rows under `SHOP_LATER_PHASE` from ch892. Ch811 explicitly lists both at shop opening. v0.2 stores **visible in ch811** and **purchased in ch892** separately. It does **not** assume the related base structures exist in Lí Lan’s world.

**D. Event chest versus ordinary chest.** The wave-1/4/7 chests have ordinary grade names; their *source* is an event. Event exclusivity of a particular item requires additional proof.

**E. Fixed shop and item contracts remain unmodified.** No new source candidate can overwrite fixed campaign commitments or silently add costs, item caps or corpse eligibility changes.

**F. Chest / bag mass openings do not reveal probabilities.** Chapter 833 names batch totals (hundreds of bags); the recorded 17 swords or 571 enhancement stones are an **aggregate observed transaction**, not a droprate or guaranteed bundle.

## 7. Complete second-pass new-record appendix

| ID | Event | Source ch. | Channel | Item | Quantity / price |
|---|---|---:|---|---|---|
| `SX-0101` | `EV10` | [480](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_481.html) | `WAVE_CLEAR_REWARD` | 3 Rương Thanh Đồng — qua đợt 1 | 3 observed |
| `SX-0102` | `EV10` | [481](https://www.69shuba.com/txt/58776/39606488) | `WAVE_CLEAR_REWARD` | 1 Rương Hoàng Kim — qua đợt 4 | 1 observed |
| `SX-0103` | `EV10` | [483](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_484.html) | `WAVE_CLEAR_REWARD` | 1 Rương Hạo Nguyệt — qua đợt 7 | 1 observed |
| `SX-0104` | `EV14` | [811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) | `SHOP_EARLY_PHASE` | Trái Tim Sức Mạnh Chuyên Gia | 5,000 Mảnh Mộng |
| `SX-0105` | `EV14` | [811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) | `SHOP_EARLY_PHASE` | Trái Tim Sức Mạnh Đại Sư | 50,000 Mảnh Mộng |
| `SX-0106` | `EV14` | [811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) | `SHOP_EARLY_PHASE` | Trái Tim Sức Mạnh Anh Hùng | 200,000 Mảnh Mộng |
| `SX-0107` | `EV14` | [811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) | `SHOP_EARLY_PHASE` | Trái Tim Truyền Kỳ | 1,000,000 Mảnh Mộng |
| `SX-0108` | `EV14` | [811](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_814.html) | `SHOP_EARLY_PHASE` | Rương Di Vật Ngẫu Nhiên | 1,500,000 Mảnh Mộng |
| `SX-0109` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `EVENT_KILL_DROP` | Túi Báu Vật Chuột Skork Bạc | 1 observed |
| `SX-0110` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `EVENT_KILL_DROP` | Túi Báu Vật Chuột Skork Vàng | 1 observed |
| `SX-0111` | `EV15` | [829](https://www.69shuba.com/txt/58776/40564832) | `EVENT_KILL_DROP` | Túi Báu Vật Vua Chuột Kim Khắc Lạp | 1 observed |
| `SX-0112` | `EV15` | [828](https://www.69shuba.com/txt/58776/40564831) | `SERVER_FIRST_KILL` | Cuốc Kim Cương Vua Chuột — Truyền Kỳ | 1 observed |
| `SX-0113` | `EV15` | [828](https://www.69shuba.com/txt/58776/40564831) | `SERVER_FIRST_KILL` | Danh Vọng lần đầu hạ Vua Chuột | 10,000 observed |
| `SX-0114` | `EV15` | [829](https://www.69shuba.com/txt/58776/40564832) | `BOSS_GROUND_DROP` | Phù Thạch Mười Hai Thánh Thú — Chuột | 1 observed |
| `SX-0115` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Túi Báu Vật Skork Bạc — mốc 10 con | 1 observed |
| `SX-0116` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Rương Bạch Ngân — mốc 10 con | 1 observed |
| `SX-0117` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Danh Vọng — mốc 10 con | 500 observed |
| `SX-0118` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Túi Báu Vật Skork Vàng — mốc 100 con | 1 observed |
| `SX-0119` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Rương Hoàng Kim — mốc 100 con | 1 observed |
| `SX-0120` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Danh Vọng — mốc 100 con | 2,000 observed |
| `SX-0121` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Danh hiệu Đội Trưởng Bắt Chuột — mốc 1000 con | 1 observed |
| `SX-0122` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Rương Hạo Nguyệt — mốc 1000 con | 1 observed |
| `SX-0123` | `EV15` | [824](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_827.html) | `HIDDEN_ACHIEVEMENT` | Danh Vọng — mốc 1000 con | 20,000 observed |
| `SX-0124` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Áo Choàng Quạ Đen (Sử Thi) | 1 observed |
| `SX-0125` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Rìu Cán Dài Hoàng Gia (Hoàng Kim) | 1 observed |
| `SX-0126` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Sách Kỹ Năng — Bẫy Đầm Lầy Tử Vong | 1 observed |
| `SX-0127` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Đá Cường Hóa Skork Vàng | 5 observed |
| `SX-0128` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Tiền Vàng | 3,529 observed |
| `SX-0129` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Bí Dược Ác Mộng Tỉnh Táo của Cuồng Chiến Sĩ | 8 observed |
| `SX-0130` | `EV15` | [826](https://www.69shuba.com/txt/58776/40564829) | `BAG_OBSERVED` | Mật Lộ Gai | 35 observed |
| `SX-0131` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Kiếm Kỵ Sĩ Bạc (Hoàng Kim) | 17 observed |
| `SX-0132` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Rìu Hành Quyết (Hoàng Kim) | 32 observed |
| `SX-0133` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Trượng Rắn Cánh Bạc (Hoàng Kim) | 14 observed |
| `SX-0134` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Chiến Chùy Khải Long Đức Lạp (Hoàng Kim) | 21 observed |
| `SX-0135` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Giáp Tấm Tinh Thạch (Hoàng Kim) | 32 observed |
| `SX-0136` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Khinh Giáp Lãng Khách Kiếm Sĩ (Hoàng Kim) | 41 observed |
| `SX-0137` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Nước Mắt Kẻ Lừa Dối | 1,923 observed |
| `SX-0138` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Hợp Tễ Sức Bền Cự Nhân | 1,501 observed |
| `SX-0139` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Huyết Thanh Chân Tri | 1,495 observed |
| `SX-0140` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Dịch Tái Sinh | 1,125 observed |
| `SX-0141` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Thuốc Sắc Pháp Lan Đức | 482 observed |
| `SX-0142` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Trường Thương Xé Bóng | 2 observed |
| `SX-0143` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Bóng Lưỡi Đao | 1 observed |
| `SX-0144` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Trường Cung Sống Lưng Rồng | 3 observed |
| `SX-0145` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Chùy Xương Hoang Thú | 1 observed |
| `SX-0146` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Áo Choàng Ma Lang | 1 observed |
| `SX-0147` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Trường Bào Ngự Ma | 1 observed |
| `SX-0148` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Chiến Ngoa Cự Thú | 1 observed |
| `SX-0149` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Nhẫn Kết Dính | 1 observed |
| `SX-0150` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Dây Chuyền Ma Kiếm Sĩ | 1 observed |
| `SX-0151` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Đá Cường Hóa Skork Vàng | 571 observed |
| `SX-0152` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Độc Dược Trói Bóng | 102 observed |
| `SX-0153` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Rượu Máu Thú Vương | 117 observed |
| `SX-0154` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Gel Kháng Tha Hóa | 49 observed |
| `SX-0155` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Bình Axít Bùng Nổ | 74 observed |
| `SX-0156` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Dược Tề Huyết Nghịch Sôi Trào | 52 observed |
| `SX-0157` | `EV15` | [833](https://www.69shuba.com/txt/58776/40564836) | `BAG_BATCH_OBSERVED` | Rượu Ma Linh | 74 observed |

## 8. Building effects found on follow-up

- **Blood Crystal Amplifier Tower (ch638)**: defensive tower damage boost and stacking bleed, and actual construction inputs; see JSON `source_effect_records`.
- **Blood Demon Hatching Nest (ch638)**: consumes a large quantity of blood to produce Tier-6 Blood Demons; still missing a full quantified production recipe.
- **Mosin Pillar and Lord Temple (ch811)**: both require a specific **fully leveled base** and a blueprint; they were **visible at shop opening**, not exclusive late-shop additions.
- **Golden Skork enhancement stone (ch826)**: +5 equipment use level, +20% base properties with ten-stone cap, pickup-bound and nontradeable in original.
- **Rat King enhancement stone (ch829)**: +10 use level, +40% base properties, max ten total stones across types; availability of the stone should not be equated with a verified per-bag weight.

## 9. Remaining coverage gaps

The pass inspected priority chapters concerning siege waves, Skork bags, the Dream shop and Blood shop follow-up. It **did not** check every chapter, later 920+ source arcs, every event inventory phase, or every chest receipt. In particular, EV03–EV07, EV11–EV12, EV16–EV29 remain incomplete/no verified new inventory entries. Keep `UNVERIFIED`, not `EMPTY`.

**Recommended follow-up:** do not generate drop weights from these examples. Source-backed entries can form observed seed candidates for a separately authored, balanced and versioned event content pack. The chapter-backed record is not yet an implementable probability table.
