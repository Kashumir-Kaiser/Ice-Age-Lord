# LORD DND — ORIGINAL NOVEL EVENT SHOPS & EVENT CHESTS SOURCE AUDIT

**Release:** `LL-WEB-EVENT-SOURCE-EXTRACTION-0.1` — Research-only; NOT installed in the fixed event simulation.

**Origin:** 《冰封末世：我打造完美领地》 (一条小白蛇). **Campaign owner of times:** File 01 `CANON-EVENT-LEDGER-4.0` (EV00–EV29).

**Extraction method:** verified indexed original-language chapter pages and cross-checked local rules. This is a documented *partial extraction*, NOT all 1,358 chapters nor a complete drop-rate table. Chinese names retained for provenance; Vietnamese labels are translations. No chapter text is copied.

## 1. Important design decisions

1. **Fixed event schedule stays fixed.** Source items do not move/extend/delay the thirty existing event dates.
2. **SOURCE_EXPLICIT versus campaign authored.** Preserve actual novel title, price, chapter, category; File 01 analog shop stock is not retroactively labeled `SOURCE_EXPLICIT`.
3. **An observed chest is not a probability table.** Its observed item lines are allowed pool evidence only; all actual slots, weights and ceilings require validated pre-event authorship.
4. **No new protagonist talent or forced tailored loot.** Any item can be bought/earned if requirements are met, equipped by a compatible unit, crafted or traded. It does not have to buff Lí Lan.
5. **Shop purchase = actual receipt.** Limits distinguish account limit, server/global limit and unknown limit; null is unknown, never unlimited.
6. **Event expiry is strict.** Source-exclusives cannot appear from normal chests, regular shops or crafting discovery; already minted tradeable instances survive by established rules.
7. **Structure blueprint integration.** A purchased blueprint must open an actual structure or an upgrade to a real base. The 143-branch magical building catalog is `DESIGN_PROPOSAL` only; name similarity does not establish same contract.
8. **Opening/locked rank rewards stay distinct.** Do not replace `RWD-OPENING-FIXED-2.0`, source-fixed dragon rank table, or precommitted LL01 chest contents without approved version migration.

## 2. Coverage against all 30 locked events

| Event | Window (world time from T0) | Extracted source entries | Status |
|---|---|---:|---|
| `EV00-SAFE-FIRE` | T0+0h → T0+144h | 0 | NO_SHOP_PER_FIXED_LOCAL_REGISTRY |
| `EV01-OPENING-LEVEL` | T0+48h → T0+144h | 0 | NO_SHOP_PER_FIXED_LOCAL_REGISTRY |
| `EV02-DRAGON-REVIVAL` | T0+144h → T0+336h | 38 | DIRECT_PARTIAL_SOURCE |
| `EV03-ICE-HORN` | T0+192h → T0+288h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV04-FIRST-MERGE-DRAGON-POINTS` | T0+312h → T0+576h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV05-ANNO-FISHING` | T0+408h → T0+504h | 0 | DIRECT_SOURCE_CONTRADICTS_SHOP_MODEL |
| `EV06-CONSTRUCTION-WEEK` | T0+552h → T0+720h | 0 | NO_SHOP_PER_FIXED_LOCAL_REGISTRY |
| `EV07-KINGDOM-WRATH` | T0+720h → T0+816h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV08-WORLD-BOSS` | T0+792h → T0+888h | 12 | DIRECT_PARTIAL_SOURCE |
| `EV09-ORACLE-WAR` | T0+864h → T0+960h | 18 | DIRECT_PARTIAL_SOURCE |
| `EV10-MONSTER-SIEGE` | T0+936h → T0+1128h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV11-MIST-DISASTER` | T0+1104h → T0+1224h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV12-LEGION-RACE` | T0+1200h → T0+1392h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV13-BLOOD-CHAOS` | T0+1368h → T0+1560h | 24 | DIRECT_PARTIAL_SOURCE |
| `EV14-DREAM-SHARD` | T0+1560h → T0+3984h | 8 | DIRECT_PARTIAL_SOURCE |
| `EV15-SKORK-RAT` | T0+3984h → T0+4176h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV16-GIANT-CITY` | T0+4176h → T0+4272h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV17-NORTH-UNIFICATION` | T0+4272h → T0+4464h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV18-LIGHT-GOD-FINAL` | T0+4464h → T0+4656h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV19-ICE-SNOW-CHOICE` | T0+4656h → T0+4848h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV20-DEEP-SEA-ARK` | T0+4848h → T0+4944h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV21-WEST-CHURCH-WAR` | T0+4944h → T0+5136h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV22-ANCIENT-DRAGON-P1` | T0+5136h → T0+5232h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV23-ANCIENT-DRAGON-P2` | T0+5232h → T0+5328h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV24-DRAGON-FESTIVAL` | T0+5328h → T0+5520h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV25-ABYSS-EXPEDITION` | T0+5520h → T0+5712h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV26-GODS-CHAOS` | T0+5712h → T0+5904h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV27-WORLD-PROTECTOR` | T0+5904h → T0+6096h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV28-ANCIENT-DRAGON-HUNT` | T0+6096h → T0+6192h | 0 | NOT_VERIFIED_IN_THIS_PASS |
| `EV29-FINAL-CALAMITY` | T0+6192h → T0+6384h | 0 | NO_SHOP_PER_FIXED_LOCAL_REGISTRY |

## 3. Source-verified event inventories

Prices and purchase limits are **only** those verifiably displayed in the checked chapter. A dash means the chapter does not give the value.

### Băng Long Shop and related dragon-themed chests
| Type / source chapter | Vietnamese entry (Chinese title) | Price | Limit | Notes |
|---|---|---:|---:|---|
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Rương Thanh Đồng Băng Giá** (`冰冷的青铜宝箱`) | 200 Băng Long Ấn | 100 | Dragon-shop themed chest; grade and price explicitly listed |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Rương Bạch Ngân Phủ Sương** (`冰霜覆盖的白银宝箱`) | 2,000 Băng Long Ấn | 20 | Dragon-shop themed chest; grade and price explicitly listed |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Rương Hoàng Kim Hàn Quang** (`寒光反耀的黄金宝箱`) | 100,000 Băng Long Ấn | 3 | Dragon-shop themed chest; grade and price explicitly listed |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Rương Hạo Nguyệt Kết Tinh** (`晶莹剔透的皓月宝箱`) | 500,000 Băng Long Ấn | 1 | Dragon-shop themed chest; grade and price explicitly listed |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Pháo Đài Băng Sương Sơ Cấp** (`初级冰霜炮台图纸`) | 10,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Pháo Đài Cầu Tuyết Sơ Cấp** (`初级雪球炮台图纸`) | 20,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Pháo Đài Băng Sương Trung Cấp** (`中级冰霜炮台图纸`) | 100,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Pháo Đài Cầu Tuyết Trung Cấp** (`中级雪球炮台图纸`) | 150,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Trại Huấn Luyện Chiến Sĩ Long Huyết** (`龙血战士训练兵营建造图纸`) | 200,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Máy Bắn Đá Băng Sương** (`冰霜投石机建造图纸`) | 300,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Bản vẽ Tường Băng Sương Cao Cấp** (`高级冰霜城墙建造图纸`) | 500,000 Băng Long Ấn | – | Shop-stated construction blueprint. Purchase limit not individually confirmed for this line. |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Trái Tim Sức Mạnh Sơ Cấp** (`初级力量之心`) | 1,000 Băng Long Ấn | – | PROGRESSION |
| SHOP · [118](https://www.69shuba.com/txt/58776/38465523) | **Sổ Huấn Luyện Long Huyết** (`龙血战士训练手册`) | 3,000 Băng Long Ấn | – | PROGRESSION |
| SHOP_PHASE_II · [362](https://www.69shuba.com/txt/58776/39274880) | **Trái Tim Sức Mạnh Cao Cấp** (`高级力量之心`) | 50,000 Băng Long Ấn | – | PROGRESSION |
| SHOP_PHASE_II · [362](https://www.69shuba.com/txt/58776/39274880) | **Bản vẽ Tháp Tên Băng Sương Chuyên Gia** (`专家级冰霜箭塔图纸`) | 300,000 Băng Long Ấn | – | BUILDING_BLUEPRINT |
| SHOP_PHASE_II · [362](https://www.69shuba.com/txt/58776/39274880) | **Bản vẽ Tường Băng Sương Chuyên Gia** (`专家级冰霜城墙图纸`) | 400,000 Băng Long Ấn | – | BUILDING_BLUEPRINT |

### World-boss point shop and lottery
| Type / source chapter | Vietnamese entry (Chinese title) | Price | Limit | Notes |
|---|---|---:|---:|---|
| SHOP · [366](https://www.69shuba.com/txt/58776/39281655) | **Quyển Tân Binh Huấn Luyện Bậc 3** (`三阶训练民兵招募卷轴`) | 100 Điểm Khiêu Chiến | 1000 | RECRUIT_SCROLL |
| SHOP · [366](https://www.69shuba.com/txt/58776/39281655) | **Quyển Tạp Binh Thú Nhân Bậc 3** (`三阶兽人杂兵招募卷轴`) | 100 Điểm Khiêu Chiến | 1000 | RECRUIT_SCROLL |
| SHOP · [366](https://www.69shuba.com/txt/58776/39281655) | **Quyển Tạp Binh Goblin Bậc 3** (`三阶地精杂兵招募卷轴`) | 100 Điểm Khiêu Chiến | 1000 | RECRUIT_SCROLL |
| SHOP · [366](https://www.69shuba.com/txt/58776/39281655) | **Quyển Binh Sĩ Đế Quốc Bậc 3** (`三阶帝国士兵招募卷轴`) | 100 Điểm Khiêu Chiến | 1000 | RECRUIT_SCROLL |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 200 điểm** (`幸运大转盘 200积分`) | 200 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 500 điểm** (`幸运大转盘 500积分`) | 500 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 1000 điểm** (`幸运大转盘 1000积分`) | 1,000 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 5000 điểm** (`幸运大转盘 5000积分`) | 5,000 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 50000 điểm** (`幸运大转盘 50000积分`) | 50,000 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_TIER · [366](https://www.69shuba.com/txt/58776/39281655) | **Vòng Quay May Mắn 100000 điểm** (`幸运大转盘 100000积分`) | 100,000 Điểm Khiêu Chiến | – | 50000 guarantees gold, 20% epic; 100000 guarantees epic (as source); other bands lack full probability tables |
| LOTTERY_HIDDEN · [423](https://www.69shuba.com/txt/58776/39424359) | **Vòng Quay Truyền Thuyết** (`传说大转盘`) | 1,000,000 Điểm Khiêu Chiến | – | Source: 50% legendary item/equipment/herb; 30% two epics; 15% three epics; 5% full epic set. Hidden unlock in late event. |
| LOTTERY_OBSERVED · [424](https://www.69shuba.com/txt/58776/39424360) | **Nhẫn Chúc Phúc Naisa** (`奈莎的赐福之环`) | – | – | Observed outcome of legendary lottery; not guaranteed |

### Oracle / Crystal-Dragon / golden-point shops
| Type / source chapter | Vietnamese entry (Chinese title) | Price | Limit | Notes |
|---|---|---:|---:|---|
| GOLDEN_POINT_SHOP · [427](https://www.69shuba.com/txt/58776/39432326) | **Bộ Cổ Hàn Đông — mỗi mảnh** (`古寒冬套装（橙）`) | 150 Điểm Hoàng Kim | – | 3-piece orange set; class-specific slot selection |
| GOLDEN_POINT_SHOP · [427](https://www.69shuba.com/txt/58776/39432326) | **Bộ Nộ Hải Cuồng Đào — mỗi mảnh** (`怒海狂涛套装（橙）`) | 150 Điểm Hoàng Kim | – | 3-piece orange set; class-specific slot selection |
| GOLDEN_POINT_SHOP · [427](https://www.69shuba.com/txt/58776/39432326) | **Bộ Băng Ngân Thú Ảnh — mỗi mảnh** (`冰痕兽影套装（橙）`) | 180 Điểm Hoàng Kim | – | 4-piece orange set; class-specific slot selection |
| GOLDEN_POINT_SHOP · [427](https://www.69shuba.com/txt/58776/39432326) | **Bộ Lan Diệu Trọng Giáp — mỗi mảnh** (`澜曜重甲套装（橙）`) | 200 Điểm Hoàng Kim | – | 4-piece orange set; class-specific slot selection |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Tử Tinh Long Phách Kiếm** (`紫晶龙魄剑`) | 50,000 Điểm Thần Dụ | 5 | WEAPON |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Lôi Vân Liệt Địa Phủ** (`雷云裂地斧`) | 70,000 Điểm Thần Dụ | 5 | WEAPON |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Tử Tinh Long Vân Trượng** (`紫晶龙云法杖`) | 100,000 Điểm Thần Dụ | 3 | WEAPON |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Liệt Lôi Trường Cung** (`雷电撕裂长弓`) | 100,000 Điểm Thần Dụ | 3 | WEAPON |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Bộ Long Tinh Lam — nguyên bộ** (`龙晶战士套装（蓝）`) | 4,000 Điểm Thần Dụ | 1000 | EQUIPMENT_SET |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Bộ Tử Tinh Tử — nguyên bộ** (`紫晶战士套装（紫）`) | 20,000 Điểm Thần Dụ | 100 | EQUIPMENT_SET |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Bộ Huyền Tinh Hoàng Kim — nguyên bộ** (`神秘水晶套装（金）`) | 80,000 Điểm Thần Dụ | 30 | EQUIPMENT_SET |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Trái Tim Sức Mạnh Cao Cấp** (`高级力量之心`) | 10,000 Điểm Thần Dụ | – | PROGRESSION |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Trái Tim Sức Mạnh Chuyên Gia** (`专家级力量之心`) | 30,000 Điểm Thần Dụ | 1000 | PROGRESSION |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Trái Tim Sức Mạnh Đại Sư** (`大师级力量之心`) | 100,000 Điểm Thần Dụ | 50 | PROGRESSION |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Huy Hiệu Thành Thạo Chuyên Gia** (`专家级熟练度纹章`) | 100,000 Điểm Thần Dụ | 10 | PROGRESSION |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Trái Tim Cự Long** (`巨龙之心`) | 2,000,000 Điểm Thần Dụ | 5 | RARE_COMPONENT |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Huyết Krakato** (`水晶巨龙·克拉卡托之血`) | 10,000,000 Điểm Thần Dụ | 1 | RARE_COMPONENT |
| SECRET_CRYSTAL_DRAGON_SHOP · [432](https://www.69shuba.com/txt/58776/39441838) | **Vảy Krakato** (`水晶巨龙·克拉卡托鳞片`) | 10,000,000 Điểm Thần Dụ | 1 | Last source line says 战功 (merit) for Krakato scale despite other items using points: SOURCE_CURRENCY_INCONSISTENT; do not auto-resolve. |

### Blood War merit shop
| Type / source chapter | Vietnamese entry (Chinese title) | Price | Limit | Notes |
|---|---|---:|---:|---|
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bộ Ngưng Huyết Kinh Cức — bộ** (`凝血荆棘五件套`) | 2,000 Chiến Công | – | Individual piece costs 500; whole-set discount evidenced. |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bộ Xích Huyết Liêu Nha — bộ** (`赤血獠牙四件套`) | 10,000 Chiến Công | – | Individual piece costs 3000; whole-set discount evidenced. |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bộ Huyết Diệm Chuẩn Ưng — bộ** (`血焰隼鹰四件套`) | 70,000 Chiến Công | 5000 | Individual piece costs 20000; whole-set discount evidenced. |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bộ Huyết Nham Bích Lũy — bộ** (`血岩壁垒五件套`) | 450,000 Chiến Công | 100 | Individual piece costs 100000; whole-set discount evidenced. |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bộ Dung Huyết Thái Thản — bộ** (`熔血泰坦五件套`) | 2,200,000 Chiến Công | 10 | Individual piece costs 500000; whole-set discount evidenced. |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Quyển Triệu Hồi Man Binh Hủ Huyết** (`腐血蛮兵招募卷轴`) | 1,000 Chiến Công | 10000 | RECRUIT_SCROLL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Quyển Triệu Hồi Pháp Sư Chú Huyết** (`咒血法师招募卷轴`) | 3,000 Chiến Công | 5000 | RECRUIT_SCROLL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Quyển Triệu Hồi Phi Kỵ Huyết Dực** (`血翼飞骑招募卷轴`) | 10,000 Chiến Công | 1000 | RECRUIT_SCROLL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Trại Huấn Luyện Man Binh Hủ Huyết** (`腐血蛮兵训练兵营`) | 300,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Sân Huấn Luyện Huyết Nộ** (`血怒训练场`) | 600,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bản vẽ Tháp Khuếch Đại Huyết Tinh** (`血晶增幅高塔图纸`) | 1,000,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Tổ Ấp Huyết Ma** (`血魔孵化巢穴`) | 5,000,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bản vẽ Huyết Tế Đàn** (`鲜血祭坛图纸（橙）`) | 10,000,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bản vẽ Huyết Cự Pháo** (`鲜血巨炮制作图纸（橙）`) | 10,000,000 Chiến Công | – | BUILDING_BLUEPRINT |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bản vẽ Huyết Diệt Tháp** (`鲜血毁灭者高塔（传说）`) | 200,000,000 Chiến Công | 1 | Legendary tower limited to ONE **server-wide**, not one per player |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bí Dược Giải Chú Huyết Cao Cấp** (`高级鲜血诅咒清除秘药`) | 100 Chiến Công | – | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Bí Dược Giải Chú Chuyên Gia** (`专家级诅咒清除秘药`) | 1,000 Chiến Công | – | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Trái Tim Sức Mạnh Cao Cấp** (`高级力量之心`) | 10,000 Chiến Công | – | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Trái Tim Sức Mạnh Chuyên Gia** (`专家级力量之心`) | 50,000 Chiến Công | – | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Trái Tim Sức Mạnh Đại Sư** (`大师级力量之心`) | 200,000 Chiến Công | 1000 | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Huy Hiệu Thành Thạo Chuyên Gia** (`专家级熟练度纹章`) | 200,000 Chiến Công | 20 | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Huy Hiệu Thành Thạo Đại Sư** (`大师级熟练度纹章`) | 3,000,000 Chiến Công | 5 | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Huyết Tinh Thạch** (`血晶石`) | 10,000 Chiến Công | – | PROGRESSION_OR_MATERIAL |
| SHOP · [597](https://www.69shuba.com/txt/58776/40564598) | **Rương Di Vật Ngẫu Nhiên** (`随机遗物箱`) | 10,000,000 Chiến Công | 3 | MYSTERY_BOX |

### Dream-fragment shop and legendary evolutions
| Type / source chapter | Vietnamese entry (Chinese title) | Price | Limit | Notes |
|---|---|---:|---:|---|
| SHOP_EARLY_PHASE · [810](https://www.69shuba.com/txt/58776/40564813) | **Vũ khí Chức Mộng — tùy loại** (`织梦者系列武器`) | 20,000 Mảnh Mộng | – | Only some categories unlocked at event start; recruitment and materials initially CLOSED |
| SHOP_EARLY_PHASE · [810](https://www.69shuba.com/txt/58776/40564813) | **Bộ Mộng Yểm Thủ Vệ** (`梦魇守望者重甲套装`) | 45,000 Mảnh Mộng | – | Only some categories unlocked at event start; recruitment and materials initially CLOSED |
| SHOP_EARLY_PHASE · [810](https://www.69shuba.com/txt/58776/40564813) | **Bộ Sứ Đồ Ác Mộng** (`噩梦使徒轻甲套装`) | 45,000 Mảnh Mộng | – | Only some categories unlocked at event start; recruitment and materials initially CLOSED |
| SHOP_EARLY_PHASE · [810](https://www.69shuba.com/txt/58776/40564813) | **Bộ Du Hiệp Mộng Cảnh** (`梦境游侠皮甲套装`) | 50,000 Mảnh Mộng | – | Only some categories unlocked at event start; recruitment and materials initially CLOSED |
| SHOP_EARLY_PHASE · [810](https://www.69shuba.com/txt/58776/40564813) | **Bộ Tiên Tri Hư Tượng** (`虚像先知布甲套装`) | 50,000 Mảnh Mộng | – | Only some categories unlocked at event start; recruitment and materials initially CLOSED |
| SHOP_LATER_PHASE · [892](https://www.69shuba.com/txt/58776/40564895) | **Bản vẽ nâng Trụ Mạc Tân** (`莫辛之柱图纸（传说）`) | 1,000,000 Mảnh Mộng | 1 | Actually PURCHASED in chapter 892; not available for early unlock without a phase rule; upgrades pre-existing max-level structures, not build-from-nothing |
| SHOP_LATER_PHASE · [892](https://www.69shuba.com/txt/58776/40564895) | **Bản vẽ nâng Thần Điện Lãnh Chúa** (`领主神殿图纸（传说）`) | 1,500,000 Mảnh Mộng | 1 | Actually PURCHASED in chapter 892; not available for early unlock without a phase rule; upgrades pre-existing max-level structures, not build-from-nothing |
| SHOP_LATER_PHASE · [892](https://www.69shuba.com/txt/58776/40564895) | **Mảnh Thần Lực** (`神力碎片`) | 50,000 Mảnh Mộng | – | Observed purchase 45 for 2.25m, hence per-unit 50,000. |

## 4. Actual event-chest openings — empirical examples, NEVER treated as probabilities

| Chapter / chest | Item (Vietnamese) | Qty | Interpretation |
|---|---|---:|---|
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Nanh Băng Long (`冰龙之牙`) | 1 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Chiến Ngoa Băng Long (`冰龙战靴`) | 1 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Quyển Triệu Hồi Chiến Sĩ Long Huyết (`龙血斗士招募卷轴`) | 3 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Dược Tề Kháng Ăn Mòn Lớn (`大型抗腐败药剂`) | 6 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Sừng Băng Long Nhỏ (`冰龙号角（小）`) | 2 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Sừng Băng Long Vừa (`冰龙号角（中）`) | 1 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [206](https://www.69shuba.com/txt/58776/38871403) · `gold_1_and_2_combined` | Quặng Long Nham (`龙岩矿`) | 7 | ACTUAL_OBSERVED_ROLL:gold_1_and_2_combined. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_cao_xing` | Trượng Thiên Băng (`千冰法杖`) | 1 | ACTUAL_OBSERVED_ROLL:moon_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_cao_xing` | Quyển Long Huyết Bậc 3 Thủ Lĩnh Nhỏ (`三阶头目级龙血战士招募卷轴`) | 1 | ACTUAL_OBSERVED_ROLL:moon_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_cao_xing` | Dược Tề Kháng Ăn Mòn Lớn (`大型抗腐败药剂`) | 9 | ACTUAL_OBSERVED_ROLL:moon_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_cao_xing` | Sừng Băng Long Lớn (`冰龙号角（大）`) | 1 | ACTUAL_OBSERVED_ROLL:moon_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_cao_xing` | Quặng Long Nham (`龙岩矿`) | 15 | ACTUAL_OBSERVED_ROLL:moon_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_liu_muxue` | Chiến Khôi Băng Long (`冰龙战盔`) | 1 | ACTUAL_OBSERVED_ROLL:moon_liu_muxue. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_liu_muxue` | Quyển Long Huyết Bậc 3 Đầu Lĩnh (`三阶首领级龙血斗士招募卷轴`) | 1 | ACTUAL_OBSERVED_ROLL:moon_liu_muxue. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_liu_muxue` | Dược Tề Kháng Ăn Mòn Lớn (`大型抗腐败药剂`) | 11 | ACTUAL_OBSERVED_ROLL:moon_liu_muxue. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_liu_muxue` | Sừng Băng Long Lớn (`冰龙号角（大）`) | 1 | ACTUAL_OBSERVED_ROLL:moon_liu_muxue. No probability implied; gold 206 lists combined results, not separated by chest. |
| [256](https://www.69shuba.com/txt/58776/38985080) · `moon_liu_muxue` | Quặng Long Nham (`龙岩矿`) | 21 | ACTUAL_OBSERVED_ROLL:moon_liu_muxue. No probability implied; gold 206 lists combined results, not separated by chest. |
| [281](https://www.69shuba.com/txt/58776/39073828) · `gold_cao_xing` | Trường Thương Hàn Băng Ăn Mòn (`寒冰腐化长枪`) | 1 | ACTUAL_OBSERVED_ROLL:gold_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [281](https://www.69shuba.com/txt/58776/39073828) · `gold_cao_xing` | Quyển Long Huyết Bậc 3 Tinh Anh (`三阶精英龙血斗士招募卷轴`) | 2 | ACTUAL_OBSERVED_ROLL:gold_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [281](https://www.69shuba.com/txt/58776/39073828) · `gold_cao_xing` | Dược Tề Kháng Ăn Mòn Lớn (`大型抗腐败药剂`) | 4 | ACTUAL_OBSERVED_ROLL:gold_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [281](https://www.69shuba.com/txt/58776/39073828) · `gold_cao_xing` | Sừng Băng Long Vừa (`冰龙号角（中）`) | 2 | ACTUAL_OBSERVED_ROLL:gold_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |
| [281](https://www.69shuba.com/txt/58776/39073828) · `gold_cao_xing` | Quặng Long Nham (`龙岩矿`) | 3 | ACTUAL_OBSERVED_ROLL:gold_cao_xing. No probability implied; gold 206 lists combined results, not separated by chest. |

**Specificity:** the Chapter 206 seven-line result is combined from a two-chest transaction; the source excerpt does not attribute each item to a particular chest. The two Chapter 256 Hạo Nguyệt rolls are separate individual outcomes. Chapter 281 is a later single golden chest. This is why a real implementation needs chest-receipt provenance and cannot infer weights from one protagonist.

## 5. Fishing-source discrepancy

Novel Chapter [260](https://www.69shuba.com/txt/58776/38994668) presents the Anno competition as an NPC-run contest by a merchant organization, with **3,000 krone entry**, and tiered species scores (e.g. selected bream species: 2/10/30/100). The prize examples explicitly include: first place **125 goblin laborers or 500,000 krone**; second **three Tier-2 elite knights or 300,000**; third **five Tier-2 regular knights or 100,000**. It does **not** establish the File 01 `SHOP-FISH-1.0` fish-ticket offer as an original-novel shop.

**For the web-game:** preserve locked EV05 as a scenario event if desired, but keep ticket-shop goods labeled `CAMPAIGN_FIXED`, not `SOURCE_EXPLICIT`; adding them is a separate design approval.

## 6. Diff against existing File 01 authored registries

| Event | Current vs original | Required response |
|---|---|---|
| `EV05-ANNO-FISHING` | **Current:** Global leaderboard by fish mass, ticket market SHOP-FISH-1.0 **Novel:** Named NPC-organized contest, 3,000 kron entry, species-weighted points and fixed laborer/knight or kron rank prizes. No demonstrated global ticket shop. | Keep fixed LL01 event *time*; do not claim source-exact ticket shop. Either explicitly preserve CAMPAIGN_FIXED adaptation or version replace its rewards in new web-game scenario. ([Ch.260](https://www.69shuba.com/txt/58776/38994668)) |
| `EV13-BLOOD-CHAOS` | **Current:** SHOP-BLOOD-1.0 with Tịnh Huyết station and simplified set prices **Novel:** Ch597 lists 7 named blood military/building blueprints including a server-single legendary tower, 5 specific sets, 3 recruit scrolls and different Heart/Relic prices. | Do not silently carry over the LL01 authored shop as novel loot. New web-game version must choose source-exact shop or campaign adaptation with renamed provenance. ([Ch.597](https://www.69shuba.com/txt/58776/40564598)) |
| `EV14-DREAM-SHARD` | **Current:** Trụ Mộng Thần + Thần Điện Lãnh Chúa upgrade BPs and dream gear in fixed shop **Novel:** Ch810 gear/phase gating; ch892 named 莫辛之柱 and 领主神殿 and full energy-station/castle prerequisites. | Do not rename 莫辛之柱 to Trụ Mộng Thần without alias evidence; bind upgrade requirement to actual max-level foundation and phase. ([Ch.892](https://www.69shuba.com/txt/58776/40564895)) |
| `EV08-WORLD-BOSS` | **Current:** World boss shop has partial recruitment and lottery bands **Novel:** Ch366 actual tiered lottery, ch423 secret 1m legendary option and explicit late closing; ch424 ring actual result. | Add missing late hidden tier only if source challenge/visibility condition is reproduced. Never infer its reward from protagonist roll. ([Ch.423](https://www.69shuba.com/txt/58776/39424359)) |
| `EV09-ORACLE-WAR` | **Current:** Fixed secret Oracle rewards and shops **Novel:** Ch427 golden-point shop has four orange suit options; ch432 secret crystal shop with prices and one item-currency inconsistency. | Separate normal faction / golden-point / secret crystal-shop eligibility and currencies; do not show to all players. ([Ch.432](https://www.69shuba.com/txt/58776/39441838)) |

## 7. How these interact with v0.3 magical building proposals

**Novel-verified building-blueprint candidates** belong to the concrete source event that makes them available: frost turrets, snowball turrets, dragonblood barracks, frost catapult and frost walls (Dragon Shop); seven blood-war military buildings including blood cannon and server-one legendary tower (Blood Merit); endgame **Mạc Tân Trụ** and **Thần Điện Lãnh Chúa** upgrade contracts (Dream Shop). They are *not* merely decorative synonyms for v0.3 branches.

- Compare `base_building`, `crafting_or_upgrade_kind`, `unlock_condition`, `source_contract`, `operation_effect`, `construction_recipe` before linking two entries.
- World-boss challenge score shop and chests must not silently issue magical farmland, wells or unrelated universal building plans just to fill catalog slots.
- If new variants such as **Linh Điền** or **Nguyệt Giếng** are to appear in seasonal event chests, assign them only through an explicitly **new game-authored event catalog** (`DESIGN_DEFAULT`) with fixed phase, chest pool, weights and original-event separation; they are NOT claimed as originating in this source novel.
- Existing source **Ma pháp / rare building progression** remains appropriate for event rewards, including durable permanent blueprints where the exact original text permits it. Preserve post-event crafting policy separately from blueprint acquisition.

## 8. Source chapter links and audit index

- [Chapter 118](https://www.69shuba.com/txt/58776/38465523) — Dragon event shop: chest offers, frost blueprint list, training items
- [Chapter 206](https://www.69shuba.com/txt/58776/38871403) — Two gold dragon chests: observed combined outcome, not a loot table
- [Chapter 256](https://www.69shuba.com/txt/58776/38985080) — Two Hạo Nguyệt chests: two five-line observed individual outcomes
- [Chapter 260](https://www.69shuba.com/txt/58776/38994668) — Anno fishing competition sponsor, ranking prizes and entry costs
- [Chapter 266](https://www.69shuba.com/txt/58776/39005728) — Fishing contest completion and caught fish effects
- [Chapter 281](https://www.69shuba.com/txt/58776/39073828) — Frost wall/arrow-tower effects and one observed gold chest
- [Chapter 362](https://www.69shuba.com/txt/58776/39274880) — Dragon Phase II and updated dragon shop offers
- [Chapter 366](https://www.69shuba.com/txt/58776/39281655) — World boss point shop and tiered lottery
- [Chapter 423](https://www.69shuba.com/txt/58776/39424359) — Hidden legendary lottery and shop expiry for Dragon-Claw challenge
- [Chapter 424](https://www.69shuba.com/txt/58776/39424360) — Legendary lottery observed pull
- [Chapter 427](https://www.69shuba.com/txt/58776/39432326) — Golden-point shop unlocked and four orange suits
- [Chapter 432](https://www.69shuba.com/txt/58776/39441838) — Oracle exclusive crystal dragon shop, equipment and materials
- [Chapter 593](https://www.69shuba.com/txt/58776/40564594) — Blood merit calculation and opening
- [Chapter 597](https://www.69shuba.com/txt/58776/40564598) — Actual blood shop: sets, recruitment, blueprints, relic boxes, items
- [Chapter 810](https://www.69shuba.com/txt/58776/40564813) — Dream shop phase-gate, starter equipment and scoring
- [Chapter 892](https://www.69shuba.com/txt/58776/40564895) — Dream fragment purchase of two legendary upgrades, effects

## 9. Unresolved, must be addressed before active release

1. **Missing complete event-specific weights:** all real chests and lotteries except stated tiered lottery guarantees. No fabricated 20% for ordinary chests.
2. **Shop inventory coverage:** EV03, EV07, EV10–EV12 and EV15–EV29 have existing authored events but not all source-exact shop entries verified here; preserve them as campaign-origin until rechecked.
3. **Source currency inconsistency:** the Chapter 432 Krakato scale line uses `战功` despite the store normally pricing with `积分`; do not silently normalize.
4. **Narrative role ≠ player item:** novels may describe an enemy structure or hero outside a shop; do not inject it into purchasable stock.
5. **Date anchoring:** File 01 times include `SOURCE_ANALOGY/CAMPAIGN_FIXED` entries; these are already fixed for this scenario even if original chapter timing is less explicit.
6. **Source copy to runnable license:** creative reuse for a public/commercial game may require rights clearance. This research extracts short factual item data, not permission to publish original names, story or art.

## 10. Next implementation step without a GM

Import the machine-readable catalog as a **source provenance candidate layer**, add an explicit selection table for each of the 30 events, require approved fixed stock / prices / limits / chest rolls / ownership policy at game-pack compile time, then freeze `event_catalog_hash` in a new version. Current world state and original source files are unchanged.
