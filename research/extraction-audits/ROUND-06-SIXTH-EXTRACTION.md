# Lord DnD — Sixth Source Extraction Audit v0.6

**Parent:** `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.5.json` (226 records)  
**New:** 18 additional source observations / offers / reward bundles (`SX-0227`–`SX-0244`)  
**Combined:** 244 unique records  
**Schedule:** 30 events from `Lord_DnD_Event_Timeline_Reconciled_v0.6.json`, unchanged  
**Status:** SOURCE RESEARCH ONLY. No edits to active File 01/05, manifest, live saves, fixed chests, or event dates.

## Important source-versus-game distinction

The most substantial new panel is **Quân Đoàn Đổi Vật Phẩm** from Chapters 551–552. **It is not a time-limited EV12 shop.** The novel introduces it during the legion-development arc, but it remains a persistent feature, unlocking items at legion levels. We attach `EV12-LEGION-RACE` only as its narrative origin, and mark every offer `PERMANENT_LEGION_EXCHANGE`. A game that deletes it at EV12 expiration would be wrong.

Similarly, global first achievements observed during EV03 and EV12 are NOT automatically event participation rewards. The two items opened from random legion chests in Chapter 668 occurred later than the original EV12 window and are NOT examples of guaranteed chest contents. There is no verified universal distribution probability.

## Verified additions

| Record | Ch. | Channel | Name | Source-verified distinction |
|---|---:|---|---|---|
| `SX-0227` | 148 | NPC_HANDOVER_OBSERVED_NON_CHEST | Sừng Băng Long Nhỏ — lần nhận trực tiếp được ghi nhận | Ch.148: Aili hands over horn supplied by Sylvia; Chapter 150 shows its use. 100% drop rate increase is a relative modifier (not certainty). Do not duplicate SX-0021 chest-observed items or reroll precommitted nests; LL01 event compatibility requires deliberate design review. |
| `SX-0228` | 150 | GLOBAL_FIRST_ACHIEVEMENT_DURING_EVENT_NOT_HORN_REWARD | Danh hiệu Lãnh Địa Vinh Diệu | Observed during ice-nest siege but triggered by loyalty requirement, not by using horn. Must retain global exclusivity and cannot grant to each participant. |
| `SX-0229` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Xe Tuyết Hạng Nhẹ | Lv1; 1000 Danh Vọng; 100,000 Krona |
| `SX-0230` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Giáp Tấm Tiêu Chuẩn Binh Sĩ (Trắng) | Lv1; 1000 Danh Vọng; 200,000 Krona |
| `SX-0231` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Xe Vận Chuyển Trung Cấp | Lv2; 5000 Danh Vọng; 500,000 Krona |
| `SX-0232` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Giáp Tiêu Chuẩn Cải Tiến (Lục) | Lv2; 5000 Danh Vọng; 600,000 Krona |
| `SX-0233` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Xe Vận Chuyển Cỡ Lớn (Lam) | Lv3; 10000 Danh Vọng; 1,000,000 Krona |
| `SX-0234` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Trận Truyền Tống Quân Đoàn Nhỏ (Tím) | Lv4; 20000 Danh Vọng; 3,000,000 Krona |
| `SX-0235` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Chiến Nhận Ám Diệt (Cam) | Lv9; 1000000 Danh Vọng; 100,000,000 Krona |
| `SX-0236` | 551 | PERMANENT_LEGION_EXCHANGE_LISTING | Bản Vẽ Trận Truyền Tống Quân Đoàn Lớn (Cam) | Lv9; 1000000 Danh Vọng; 120,000,000 Krona |
| `SX-0237` | 551 | PERMANENT_LEGION_EXCHANGE_LOCKED_LISTING | Bản Vẽ Tháp Thiên Thạch (Cam) | Lv10; item known, cost unknown |
| `SX-0238` | 552 | PERMANENT_LEGION_EXCHANGE_PURCHASE_CONFIRMED | Bản Vẽ Trận Truyền Tống Quân Đoàn Trung Cấp | Lv6; 10000 Danh Vọng; 10,000,000 Krona |
| `SX-0239` | 552 | PERMANENT_LEGION_EXCHANGE_PURCHASE_CONFIRMED | Bản Vẽ Robot Khai Khoáng Cao Cấp | Lv6; 10000 Danh Vọng; 11,000,000 Krona |
| `SX-0240` | 552 | PERMANENT_LEGION_EXCHANGE_PURCHASE_CONFIRMED | Bản Vẽ Bội Kiếm Thần Hộ Giả (Kim) | Lv6; 10000 Danh Vọng; 13,000,000 Krona |
| `SX-0241` | 552 | GLOBAL_FIRST_LEGION_LEVEL_6_REWARD | Gói Thưởng Quân Đoàn Bậc 6 Đầu Tiên Toàn Thế Giới | One indivisible award receipt; random chest is still sealed, no contents guaranteed. This is not a timed EV12 participation reward. |
| `SX-0242` | 668 | LEGION_TREASURE_CHEST_OBSERVED_LATER_NON_EVENT | Cờ Kỷ Luật (Kim) | On battlefield deployed banner clears 3 negative statuses per friendly within 1000m every 10s. At zero durability returns to bag, redeploy after 60s. Not a building or a guaranteed universal chest result. |
| `SX-0243` | 668 | LEGION_EPIC_TREASURE_CHEST_OBSERVED_LATER_NON_EVENT | Sa Bàn Chiến Lược Quân Đoàn (Cam) | Unique headquarters-placed item; this is not a proposed new building and not a universal map-vision unlock. Effect values are source exact; application to LL01 would need game-specific battle contract. |
| `SX-0244` | 548 | GLOBAL_FIRST_TERRITORY_PROSPERITY_DURING_ARC | Danh Hiệu Người Dẫn Đường Tận Thế | Ch548/549 edition offset. Not necessarily applies to undead or to all residents without checking tag eligibility; no automatic grant to Lí Lan. This is a global first prosperity reward, not EV12 stage prize. |

## Chapters and evidence

- **Ch148:** [Original novel Small Horn receipt and effects](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_148.html). One existing item family, a NEW explicit handover acquisition route. Six hours; nests within 30 km; mode A +100% relative Ice Dragon Marks and Glacier Shards drop chance with −80% kill XP; mode B +50% kill XP with −80% drop chance for both materials. **It does not establish 100% absolute drop chance**, and the narrative nest convergence must not overwrite LL01's preseeded ecology. Prior `SX-0021` stays unchanged, documenting a different chest-opening receipt.
- **Ch150:** [Territory's Honor](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_150.html). Global first 100 residents all having loyalty >80 grants the title, with +50% crit rate and large morale increase ONLY when defending territory. It was announced during combat, but is not a horn-use or event-participation prize.
- **Ch551:** [Permanent Legion Exchange](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_552.html). The panel lists 9 blueprint identities from legion levels 1–10, including a Level 10 Meteor Tower with NO exact price. Listed rep text sometimes says `达到` (attain/at least), so rep consumption for each non-purchased entry must not be invented.
- **Ch552:** [Lv6 purchases and world-first reward](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_553.html). Three PURCHASED gold blueprints cost 10,000 reputation each and 10M/11M/13M Krona respectively, with 30k reputation + one random legion chest for the FIRST global Lv6 legion. The three blueprints are separate paid purchases, not automatically awarded on level-up.
- **Ch668:** [Two legion treasure items and exact functional effects](https://czbooks.net/n/s6ojlf/s6ofpnb6?chapterNumber=670). Gold Discipline Flag clears 3 adverse statuses every 10 seconds within 1,000m; orange Legion Strategic Sand Table at headquarters transmits marked instructions and gives +15% hit/movement speed. These were from distinct chests. They do not imply a new buildable command building.
- **Ch548/549 edition discrepancy:** [First prosperity milestone](https://www.xiaoshuo.com.tw/599058/251039657.html). First worldwide to pass prosperity 10,000 gains *Người Dẫn Đường Tận Thế* title AND three Divine Power Fragments. Title is +3,000 attack, +1,000 armor, +10% crit; survivor-led force thresholds 100/1,000/10,000/100,000 unlock respectively +10%/+20%/+50% attributes and one resurrection-on-death effect at highest threshold. **Not a fixed EV12 reward.** Verify target-tag scope before importing into a sole Lí Lan game.
- **Ch592:** [Blood Chaos mechanics](https://czbooks.net/n/s6ojlf/s6ofp9e6?chapterNumber=592). 36 active invasion pillars at declaration, XP/War Merit from enemy defeats and pillar destruction, minimum Tier 5 enemies. Supplemental mechanical observation only, **no artificial standalone item record**.

## Core discrepancies and guards

1. **EV12's source shop is permanent.** Expiring it with EV12 would silently damage progression. Keep event intro and shop lifetime separate.
2. **Two different acquisition instances of a Small Horn.** `SX-0021` already observes the item in a later chest. `SX-0227` records the separate Ch148 character handover, not a new horn identity.
3. **Rep as prerequisite versus price.** Store separate `legion_reputation_value` and `legion_reputation_mode`; only the 3 paid Lv6 receipt rows are clearly proved to debit reputation.
4. **Lv10 meteor tower:** name and level known, exact currency, building material recipe, radius, combat damage and purchase stock unknown. Must remain non-purchasable.
5. **Absolute versus relative probabilities:** +100% drop *probability bonus* cannot be simplified to guaranteed drop. Preserve live-world fixed nest identities if source convergence is adapted.
6. **Achievements not event loot:** Loyalty and prosperity firsts remain exclusive claims under their own global trigger, not shop inventories or chest drop pools.
7. **Chapter edition offsets:** major title index 548/551/552/668 has +1 or −1 in other mirrors. The audit pairs headline + scene + URL rather than blind chapter numerical equality.
8. **Late-game priorities EV22–23, EV24, EV27 remain open.** No full readable exchange prices or exact tower trial payloads were confirmed in this pass. Do not fabricate a false fourth/ fifth late-game inventory.

## Source-exact changes versus production changes

**Added records** are appended to the research registry; 226 previous entries and 30 dated events remain identical. The 18 newly confirmed source records cover 8 priced legion blueprints plus 1 named-but-unpriced Meteor Tower, 3 actually purchased Lv6 blueprints, 1 first-Lv6 reward, 2 later chest treasures, 1 observed horn handover, 1 first-100-loyalty title, and 1 first-10k-prosperity title (9+3+1+2+1+1+1=18; see numerical validation below). Cross-check the tabular registry as source of truth; the receipt count is computed there.

**No gameplay activation:** even source-exact numbers require a versioned game rule contract and coherent fixed world/chest/rank ecology. The original controlling source is a novel, not existing runtime code.

## Outputs

- `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.6.json`
- `Lord_DnD_Event_Source_Items_v0.6.csv`
- `Lord_DnD_Event_Sixth_Extraction_Audit_v0.6.md`
- `Lord_DnD_Li_Lan_Web_Game_Content_Redesign_v1.0.md`
