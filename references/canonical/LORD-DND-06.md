# LORD DND 06 — BẢNG NHÂN VẬT CHÍNH LÍ LAN

> **Phiên bản 2.5.0 — 2026-08-29.** Đây là nguồn khống chế cho danh tính, hoàn cảnh giáng lâm, thiên phú SSS, công trình binh chủng và tuyến phát triển riêng của Lí Lan trong **campaign sạch bắt đầu đúng tại T0**. File 01–05 tiếp tục khống chế hệ thống chung; khi một quy tắc chung mâu thuẫn với thiết lập trực tiếp mới nhất của `{{user}}` về Lí Lan, quyết định của `{{user}}` và File 06 thắng trong phạm vi nhân vật chính. Bản 2.5.0 giữ toàn bộ 2.4.0—catalog kỹ năng, `WORLD-PACKAGE-LL01-1.0`, `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`, zombie công trình `BaseLaborRate=1,00 WU/giờ`, Appendix 3.K, 192 Rương Báu, `CHEST-SEARCH-2.1-FIXED` và `LL01-HERO-LAIR-PACK-1.0`—rồi bind Lí Lan vào `SPATIAL-SWEEP-GEOMETRY-1.0`, `SEARCH-TEAM-CAPABILITY-1.0` và `SPATIAL-SEARCH-RUNTIME-1.0`. Delta schema này không đổi thuộc tính, kho, quân, XP, rương, quest, ecology, lair knowledge hoặc hành động của Lí Lan.
>
> Cốt truyện tổng thể vẫn lấy `<Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa>` làm canon khung. File này tạo nhân vật chính mới và cơ chế mới, không sao chép hồ sơ hoặc tên nhân vật chính của nguyên tác.

> **Phân loại hằng số:** trường ghi `ĐÃ KHÓA — SOURCE <>` là `SOURCE_LOCKED`; thiết lập trực tiếp của Lí Lan là `USER_LOCKED`; công thức/queue không được nguồn khẳng định là `DESIGN_DEFAULT` có version; state sau T0 chỉ đến từ event hợp lệ. Bất kỳ tổng quân, kho, dân, công trình, rank, bản đồ hoặc ngày của campaign thử đều bị loại.

> **Khóa phát hành:** `document_id=LORD-DND-06`; `release_id=FILE06-2.5.0-SPATIAL-SEARCH-BINDING.1`. File 03–05 phải được resolve bằng dòng `ACTIVE` của `RELEASE-LINEAGE-LL01-1.3.0`, không bằng filename hoặc semantic version trần.

## Mục lục

1. Chức năng và thứ tự ưu tiên
2. Ba trạng thái dữ kiện
3. Snapshot canon của Lí Lan tại `T0`
4. Danh tính và hồ sơ đã khóa
5. Hoàn cảnh trước tận thế
6. Điểm giáng lâm: đồng bằng trên cổ chiến trường
7. Lửa Sinh Tồn và lãnh địa khởi đầu
8. Ngôi Mộ bậc 1
9. Nguyên nhân thức tỉnh thiên phú SSS
10. Hồ sơ thiên phú `Tử Phục Linh Sư`
11. Điều kiện một xác đủ tư cách Tử Phục
12. Pipeline chuyển xác thành tử thi
13. Bảo lưu tiến trình và ngoại lệ hệ Thánh
14. Dữ liệu được giữ, đổi và mất
15. Tử thi thường và tử thi hero
16. Sinh vật hệ Thánh và chuyển kỹ năng
17. Tử trung tuyệt đối
18. Cái chết thứ hai và khóa tái Tử Phục
19. Số lượng, điều kiện ức chế và command load
20. Hai con đường tạo quân: Ngôi Mộ và xác thật
21. Tiến trình Ngôi Mộ bậc 1–10
22. Công thức quân số zombie
23. Logic cấp–bậc–tư chất–phẩm chất–tăng trưởng
24. Công thức trần tư chất và đột phá
25. Khóa T10
26. Binh lính thường thức tỉnh thành hero
27. Hệ/trận doanh và quan hệ khắc chế
28. Flow early game của Lí Lan
29. Flow khai phá cổ chiến trường dài hạn
30. Giao diện cá nhân và quy tắc hiển thị
31. Sổ trạng thái và event log
32. Ranh giới thông tin và quyền tự quyết
33. Các cách hiểu sai bị cấm
34. Phụ lục 6.A–6.J

---

## 1. Chức năng và thứ tự ưu tiên

File 06 trả lời các câu hỏi chỉ thuộc Lí Lan:

- Lí Lan đang làm gì khi tận thế bắt đầu?
- Cô giáng lâm ở đâu và vì sao địa điểm đó quan trọng?
- Thiên phú `Tử Phục Linh Sư` làm được gì, trả giá gì và kiểm tra đủ điều kiện ra sao?
- Tử thi giữ lại bậc, level, phẩm, kỹ năng, thiên phú, ký ức và hero flag như thế nào?
- Ngôi Mộ tạo zombie theo bậc nào?
- Tử Phục bảo lưu Bậc, Cấp và XP thế nào; vì sao hệ Thánh vẫn bị giảm Bậc–Phẩm?
- Tư chất, phẩm chất, kỳ ngộ và thức tỉnh hero thay đổi trần phát triển ra sao?
- Cổ chiến trường trở thành đường dây phát triển quân lực và cốt truyện về sau như thế nào?

Tách **quyền định luật** khỏi **quyền xác định trạng thái**:

**Ưu tiên luật:**

1. Quyết định trực tiếp mới nhất của `{{user}}`.
2. Mệnh đề được kiểm chứng trực tiếp trong `<>` đối với cốt truyện, tiến trình và cơ chế chung.
3. File 06 đối với thiết lập riêng đã khóa của Lí Lan.
4. File chuyên trách 01–05 đối với domain của nó.
5. Quy tắc `BO_SUNG/DESIGN_DEFAULT` có version, chỉ dùng khi các tầng trên im lặng.
6. Suy luận ghi rõ `SUY_LUAN`; không được ngụy trang thành canon.

**Ưu tiên trạng thái:** snapshot sạch đã chấp nhận → neo trạng thái hợp lệ gần nhất → event hợp lệ sau neo → bằng chứng chat cũ hơn. Event cho biết **đã xảy ra gì** nhưng không thể âm thầm sửa một luật cao hơn. File 06 cũng không được dùng để viết lại kết quả seed/event hợp lệ; mọi thay đổi phải có timestamp, nguyên nhân, source/rule version và delta trước → sau.

## 2. Ba trạng thái dữ kiện

Mỗi trường trong hồ sơ mang một trạng thái:

| Trạng thái | Ý nghĩa | Cách dùng |
|---|---|---|
| `ĐÃ KHÓA — USER` | `{{user}}` đã xác định trực tiếp | dùng nguyên dạng; chỉ đổi bằng quyết định mới |
| `ĐÃ SUY RA — SYSTEM` | được suy ra từ luật chung hoặc hệ quả tất yếu | dùng cho vận hành; quyết định mới của `{{user}}` có thể ghi đè |
| `STATE_UNOBSERVED` | giá trị tồn tại trong seed/event nhưng Lí Lan chưa quan sát | lược khỏi văn xuôi/UI hoặc hiển thị “chưa quan sát”; không hỏi người chơi điền |

`STATE_UNOBSERVED` không phải luật thiếu hay lời mời engine tự sáng tác. `UNKNOWN_RULE` chỉ được dùng cho một quy tắc/công thức chưa đóng và sẽ chặn phép tính liên quan; tại bản này không còn `UNKNOWN_RULE` nào cần để chạy T0. Khi một giá trị thế giới chưa được quan sát, narrator dùng tên “Lí Lan”, chi tiết cảm giác hợp quyền biết và những gì thế giới đang làm; narrator dừng trước lời nói, mục tiêu hoặc phản ứng do người chơi quyết định.

## 3. Snapshot canon nội bộ của Lí Lan tại `T0`

> Bảng này là state phục vụ continuity và tính toán. Nó không phải character sheet được phép gửi nguyên cho người chơi; mọi đầu ra phải qua quy tắc hiển thị tại §30.

| Trường | Giá trị tại `SAVE-T0-CLEAN` | Trạng thái |
|---|---|---|
| Tên | Lí Lan | `ĐÃ KHÓA — USER` |
| Vai trò | người chơi; lãnh chúa của Lửa Sinh Tồn khởi đầu | `ĐÃ SUY RA — SYSTEM` |
| Cấp cá nhân | `Lv1`, XP 0 | `ĐÃ SUY RA — SYSTEM` |
| Quy tắc XP riêng | `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`; phản chiếu 100% XP ròng hậu Tử Phục của tử thi do chính Lí Lan tạo; zombie Ngôi Mộ không đủ điều kiện | `ĐÃ KHÓA — USER` |
| Bậc cấu trúc cá nhân | `T1` mặc định của người chơi đã hệ thống hóa | `ĐÃ SUY RA — SYSTEM` |
| Tuổi/giới/quốc tịch | 24; nữ, dùng “cô”; Trung Hoa | `ĐÃ KHÓA — USER` |
| Ngoại hình | 174 cm; vóc dáng mảnh; tóc đen; mắt đen có quầng; áo hoodie đen và quần short | `ĐÃ KHÓA — USER` |
| Thuộc tính | STR 8; VIT 8; DEX 8; INT 9; SPI 18; WIL 9; PER 8; PRE 13; LUK 9; tổng 90, tự áp theo thiên phú | `ĐÃ SUY RA — AWAKENED-AUTO-ATTR-1.0` |
| Nghề ở Lam Tinh | quản lý an ninh mạng | `ĐÃ KHÓA — USER` |
| Chức nghiệp trong game | Vô chức; có `Thẻ Chuyển Nghề Khai Cuộc`; payload nội bộ `Tử Linh Triệu Hoán Sư`, chỉ lộ khi kiểm tra thẻ | `ĐÃ KHÓA — USER + CAREER-CARD-1.0` |
| Kỹ năng nghề khai cuộc | chưa sở hữu tại T0; payload niêm `SK-OPEN-NECRO-01 — Tử Khí Châm` chỉ được tạo khi `CareerActivated` vì nghề mang `MANA_REQUIRED` | `ĐÃ SUY RA — OPENING-MANA-SKILL-1.0` |
| Pool kỹ năng thành tựu của nghề | `ACHPOOL-JOB-SUM-NECRO-01-1.0`; 198 template, 22 mỗi Phẩm; Lord House dùng riêng slice `NECRO-F-CO_BAN-1` có 8 ứng viên | `ĐÃ KHÓA — ACHIEVEMENT-SKILL-FIT-1.0` |
| Hồ Mana | `236/236`; hồi nền `0,45 Mana/giây` ở `NORMAL_AWAKE`; tự quyết toán từ `last_mana_settled_at=T0` | `ĐÃ SUY RA — MANA-RECOVERY-1.0` |
| Nguồn tăng trưởng level | `2,00 nền người chơi + 6,00 từ SSS = 8,00 điểm/level` | `ĐÃ SUY RA — SYSTEM` |
| Tăng trưởng đã tích lũy | 0 tại `Lv1`; hướng phân bổ `SPI/PRE` đã niêm trong thẻ, chỉ bắt đầu áp khi thẻ được kiểm tra/kích hoạt | `ĐÃ SUY RA — CAREER-CARD-1.0` |
| Hoàn cảnh ngay trước `T0` | đi tàu điện sau giờ làm; quanh cô là nhân viên văn phòng bình thường | `ĐÃ KHÓA — USER` |
| Mở cảnh | đúng `T0`, 07:00 giờ thế giới; không có lượt chơi ở `T−60s` | `ĐÃ KHÓA — USER` |
| Vị trí `T0` | đồng bằng băng trên cổ chiến trường | `ĐÃ KHÓA — USER` |
| Gói thế giới | `WORLD-PACKAGE-LL01-1.0`; origin H0 `(0,000; 0,000; 0 m)` trong `LL01-LOCAL-KM`; map/chest/quest reroll `OFF` | `ĐÃ KHÓA — USER + CAMPAIGN_FIXED` |
| Extension Hero–hang ổ | `LL01-HERO-LAIR-PACK-1.0`; đúng 15 lair/15 Hero tồn tại trước T0, cả 15 `UNOBSERVED`; lair reroll `OFF` | `ĐÃ KHÓA — USER + CAMPAIGN_FIXED`; không đổi R0/PC state |
| Spatial search binding | File 03 `SPATIAL-SWEEP-GEOMETRY-1.0` + File 04 `SEARCH-TEAM-CAPABILITY-1.0` + File 05 `SPATIAL-SEARCH-RUNTIME-1.0`; không có job/team/history đang active tại T0 | `ĐÃ SUY RA — RUNTIME`; radius không phải swept area, target tồn tại trước search |
| Hồ sơ cơ hội khai cuộc | `opening_opportunity_profile=HIGH`; đã áp một lần trước T0; 30 Rương Báu trong vành 3 km, 192 trong active map | `ĐÃ KHÓA — USER`; không đổi `LUK=9` và không reroll |
| Lãnh địa | `H0 — Điểm Neo` | `ĐÃ SUY RA — SYSTEM` |
| Lửa Sinh Tồn | `FireLevel=1 — Lửa Trại Cấp 1`; bán kính 10 m; tăng 5–20°C; tiêu 1 Gỗ/15 phút | `ĐÃ KHÓA — SOURCE <> + USER` |
| Nhà khởi đầu | Nhà Lãnh Chúa Hư Hại; cần 10 đá và 20 gỗ để tu sửa | `ĐÃ KHÓA — SOURCE <>` |
| Kho khởi đầu | Hòm Vật Tư Lãnh Địa Cấp 1; 40 ngăn; bộ vật tư bốn người | `ĐÃ KHÓA — SOURCE <>` |
| Công trình binh chủng | `Ngôi Mộ T1` | `ĐÃ KHÓA — USER` |
| Công trình dân cư đầu | Nhà Nông Phu Cực Địa Cấp 1; là một trong 11 mẫu dựng sẵn chỉ mở sau khi tu sửa Nhà Lãnh Chúa | `ĐÃ KHÓA — SOURCE <>` |
| Thiên phú | `SSS — Tử Phục Linh Sư` | `ĐÃ KHÓA — USER` |
| Trận doanh cá nhân | Người chơi/Nhân hệ; mang tag năng lực Ám | `ĐÃ SUY RA — SYSTEM` |
| Trận doanh tử thi | Ám; kỹ năng triệu hoán Thánh chuyển sang Quỷ | `ĐÃ KHÓA — USER` |
| Quân khởi đầu đã tồn tại | 0 trừ khi seed hàng chờ sau này ghi khác | `ĐÃ SUY RA — SYSTEM` |
| Quan hệ gia đình/xã hội | không có | `ĐÃ KHÓA — USER` |
| Đồng hành khởi đầu | không có; những nhân viên văn phòng chỉ là người đứng gần trước giáng lâm | `ĐÃ KHÓA — USER` |
| Đồ mang theo từ Lam Tinh | 1 bịch đồ ăn mua ở cửa hàng tiện lợi; thành phần được `CONVENIENCE-BAG-1.0` seed tại T0 và chỉ hiện item line khi cô kiểm tra | `ĐÃ KHÓA — USER`; nội dung cụ thể là `CAMPAIGN_SEEDED + STATE_UNOBSERVED` |
| Lập trường đạo đức | không có giới hạn đạo đức; sống hay chết đều là trạng thái công dụng, và nếu một người hữu dụng hơn khi chết thì chọn phương án ấy vì tính thực dụng | `ĐÃ KHÓA — USER` |
| Mục tiêu | sống sót và đạt tới đỉnh cao của thế giới | `ĐÃ KHÓA — USER` |
| Giọng nói | bình tĩnh; âm sắc khàn; ngữ điệu phẳng như đã chết; lạnh với một số người | `ĐÃ KHÓA — USER` |
| Giới hạn nội dung/quan hệ | không đặt giới hạn | `ĐÃ KHÓA — USER` |

`T1` là Bậc hiện tại của Lí Lan; `FireLevel=1` là Cấp của Lửa Trại. Hai số cùng bằng 1 tại T0 chỉ là trùng số. Bậc Lí Lan đặt trần xác cho Tử Phục; Cấp Lửa chỉ điều khiển hình thái, vùng nhiệt, nhiên liệu và mở khóa nguồn-khóa của lãnh địa.

### 3.1. Tường lửa khởi tạo sạch

Trước khi lưu `SAVE-T0-CLEAN`, engine phải quét và xác nhận không có: ngày/tuần của campaign cũ; ID quân, dân, vật phẩm, công trình hay rương cũ; tổng kho/quân lực cũ; hàng rank cũ; event đã hoàn thành; blueprint đã học; mối quan hệ; bản đồ đã khám phá; cờ `legacy`, `migrated`, `foreign_branch` hoặc `test_run`. Lịch cốt truyện trong `CANON_EVENT_CALENDAR` **được giữ** vì đó là luật tương lai, nhưng mọi mục phải ở trạng thái `SCHEDULED`, chưa nhận kết quả hoặc phần thưởng.

Snapshot chỉ hợp lệ khi ghi:

```text
CLEAN-START-VALIDATED
campaign_id · conversation_id · branch_id · ruleset_version
T0 timestamp · source-set hash · calendar version · contamination_count=0
```

Nếu phát hiện một giá trị cũ, engine dừng khởi tạo và liệt kê đúng trường/nguồn; không tự xóa rồi tiếp tục trong im lặng.

## 4. Danh tính và hồ sơ đã khóa

### 4.1. Hồ sơ cá nhân

| Nhóm | Giá trị khóa |
|---|---|
| Nhân thân | Lí Lan; 24 tuổi; nữ; quốc tịch Trung Hoa |
| Ngoại hình | cao 174 cm; vóc dáng mảnh; tóc đen; mắt đen có quầng; hoodie đen; quần short |
| Đời cũ | quản lý an ninh mạng; đi tàu điện; ngay trước giáng lâm ở giữa những nhân viên văn phòng bình thường |
| Quan hệ | không có gia đình, bạn đồng hành hoặc quan hệ khởi đầu |
| Vật mang theo | một bịch đồ ăn mua ở cửa hàng tiện lợi |
| Mục tiêu | sống sót; đạt tới đỉnh cao của thế giới |
| Đạo đức | thuần thực dụng; sự sống/cái chết không có giá trị cấm kỵ độc lập với công dụng |
| Giọng | bình tĩnh, khàn, ngữ điệu phẳng; có thể lạnh với người không được cô coi trọng |
| Giới hạn | không đặt giới hạn nội dung hoặc quan hệ |

### 4.2. Ranh giới giữa “chưa định luật” và “chưa quan sát”

Hồ sơ bắt buộc để khởi tạo Lí Lan đã đầy đủ; engine không còn hỏi lại các trường ở §4.1. Ngày sinh cụ thể, thành phố Lam Tinh, tên công ty, học vấn và tài chính là `OMITTED_NONREQUIRED`: hiện không có giá trị canon, không được engine tự bịa và không ảnh hưởng phép tính. Chúng chỉ thành canon nếu người dùng xác lập hoặc một hồi ức do người dùng cho phép đưa vào. Riêng từng món trong bịch được seed trước cảnh theo §4.3 rồi giữ `STATE_UNOBSERVED` tới lúc kiểm kê; không dùng `UNKNOWN_RULE` để trì hoãn campaign. “Người ở cạnh” khóa hoàn cảnh ngay trước T0: họ là những nhân viên văn phòng xa lạ, không phải slot đồng hành. World seed định vị từng người chơi độc lập khi giáng lâm; việc một người trong số họ còn sống, ở đâu hoặc có gặp lại Lí Lan hay không là `STATE_UNOBSERVED`, không phải ô tạo nhân vật còn thiếu.

### 4.3. `CONVENIENCE-BAG-1.0` — khóa vật mang theo mà không spoil

Tại `SAVE-T0-CLEAN`, engine gọi `RandomInt(campaign_id+soul_id+"BAG-MAIN",0,99)`, rồi tương tự với suffix `BAG-SNACK` và `BAG-DRINK`, theo `HASH-PRIMITIVE-1.0` File 01 Phụ lục 1.I. Mỗi roll là số nguyên đều chính xác `0..99` và chọn theo khoảng tích lũy dưới đây. Kết quả được ghi vào inventory ẩn **trước** tin mở đầu, không chờ hành động kiểm tra mới gieo:

| Dòng | Khoảng roll | Item | Quy đổi |
|---|---:|---|---|
| Bữa chính | `0–34` | hộp cơm tiện lợi | `1,00` đơn vị thức ăn |
|  | `35–59` | hai bánh bao nhân | `1,00` đơn vị thức ăn |
|  | `60–84` | sandwich đóng gói | `1,00` đơn vị thức ăn |
|  | `85–99` | mì ăn liền cốc | `1,00` đơn vị thức ăn; cần nước nóng |
| Đồ ăn phụ | `0–29` | bánh quy gói nhỏ | `0,50` đơn vị thức ăn |
|  | `30–54` | hạt rang gói nhỏ | `0,50` đơn vị thức ăn |
|  | `55–79` | thanh chocolate | `0,50` đơn vị thức ăn |
|  | `80–99` | khoai tây lát gói nhỏ | `0,50` đơn vị thức ăn |
| Đồ uống | `0–49` | chai nước 500 ml | `0,50 L` nước |
|  | `50–79` | chai trà không đường 500 ml | `0,50 L` nước |
|  | `80–99` | lon cà phê 330 ml | `0,33 L` đồ uống; caffeine tag |

Một bộ khăn giấy/đũa dùng một lần đi cùng bữa chính và không tính thức ăn. Tổng bịch luôn có `1,50` đơn vị thức ăn cùng đúng một đồ uống; khối lượng/độ bền lấy item template tương ứng. Giao diện chỉ materialize ba item line và phụ kiện khi Lí Lan kiểm tra bịch; seed, số roll và item IDs không đổi theo nhu cầu cảnh.

## 5. Hoàn cảnh trước tận thế

### 5.1. Canon đời cũ ngay trước giáng lâm

Lí Lan tan ca quản lý an ninh mạng và đang đi tàu điện. Những người ở cạnh là nhân viên văn phòng bình thường, không có quan hệ với cô. Cô mặc hoodie đen cùng quần short và cầm một bịch đồ ăn từ cửa hàng tiện lợi. Toàn bộ người chơi vẫn đồng khởi ở một timestamp, nhưng campaign này **không mở lượt tại đếm ngược**.

### 5.2. Điểm cắt mở cảnh

Tin đầu bắt đầu đúng khi giáng lâm hoàn tất: `T0 = 07:00` giờ thế giới. Đời cũ chỉ được dùng như dư ảnh cảm giác ngắn hoặc dữ kiện hồi tưởng; narrator không tạo hành động, lời nói hay lựa chọn của Lí Lan trước T0. Những người trên tàu không trở thành đồng hành, quan hệ hoặc cư dân của lãnh địa nếu một event độc lập về sau không chứng minh điều đó.

## 6. Điểm giáng lâm: đồng bằng trên cổ chiến trường

### 6.1. Hình thái bề mặt

Vùng xuất phát là một đồng bằng băng rộng, có độ dốc thấp và tầm nhìn xa khi tuyết lắng. Bề mặt mang các dấu tích vật chất:

- chiến hào bị băng lấp;
- mảnh vũ khí, giáp, bia đá, tường đất–gỗ, nền đá hoặc vật liệu phòng thủ tiền công nghiệp;
- khe băng dẫn tử khí từ địa tầng sâu;
- các cụm hài cốt ở nhiều độ sâu và mức nguyên vẹn;
- khu vực phong ấn, hố va chạm hoặc nền kiến trúc chỉ lộ dần khi khảo sát.

### 6.2. Vì sao hài cốt còn dùng được

Ba điều kiện bảo tồn cùng tồn tại:

1. Nhiệt độ thấp làm chậm phân rã vật chất.
2. Tử khí đậm đặc giữ dấu ấn cấu trúc, kỹ năng và phẩm trong thi thể.
3. Sinh vật bậc cao có cơ thể/khung năng lượng bền hơn sinh vật phàm.

Một bộ xương còn `CorpseIntegrity>0` vẫn là xác hợp lệ nếu dấu ấn cấu trúc tồn tại. Vật đã hóa bụi hoàn toàn, bị tiêu hóa, bị thiêu sạch hoặc mang `SecondDeathLock=1` không còn corpse ID để thiên phú nhận diện.

### 6.3. Tiềm năng và nguy cơ

Cổ chiến trường là kho quân lực **theo điều kiện**, không phải kho quân miễn phí. Lí Lan cần:

- tìm và phân loại xác;
- tiếp cận an toàn qua băng, tử khí, phong ấn và sinh vật canh giữ;
- tăng Bậc cá nhân của Lí Lan bằng tiến trình/đột phá hợp lệ để mở giới hạn xác;
- tạo command, tuyến vận chuyển và nơi triển khai;
- xử lý phản ứng của phe sống, giáo hội, hậu duệ hoặc thế lực từng tham chiến.

Hài cốt bậc cao nằm đó từ đầu và tiếp tục tồn tại dù Lí Lan phát triển nhanh hay chậm. Một phe khác có thể phát hiện, phá hủy, chiếm, tịnh hóa hoặc đánh thức chúng nếu đồng hồ thế giới chạy tới trước.

### 6.4. Sự thật lịch sử đã khóa — chưa phải tri thức khởi đầu của Lí Lan

> **`USER_LOCKED/CANON_WORLD`.** Cổ chiến trường là nơi Đế quốc nhân loại **Sora** giao chiến với Thú quốc **Trevil** cách T0 khoảng **30.000 năm**. Hai quốc gia đồng thời sinh ra mỗi bên một sinh mệnh **Phẩm Thần thoại**; khi quy mô của cả hai đã đủ đe dọa lẫn nhau, hai quốc vương chọn chiến tranh phủ đầu. Đến cuối cuộc chiến, đỉnh chiến lực của mỗi phe là chính quốc vương: **Bậc 7, Phẩm Lãnh chúa, sinh mệnh Anh hùng**. Hai sinh mệnh Phẩm Thần thoại bị chôn vùi khi đang ở **Bậc 5**. Sora và Trevil đều đã biến mất khỏi lịch sử hiện đại.

Mệnh đề trên là sự thật dùng để seed địa tầng, huy hiệu, ngôn ngữ, phong ấn và ký ức hero. Tại T0, Lí Lan chỉ quan sát được “cổ chiến trường” và dòng tử khí; tên Sora, Trevil, niên đại, nguyên nhân chiến tranh, cấp/phẩm của bốn nhân vật đỉnh và số phận hai sinh mệnh Thần thoại đều mang `STATE_UNOBSERVED` cho tới khi cô tìm được bằng chứng. Cụm sai “phẩm 5” bị cấm; dạng chuẩn luôn là **Bậc 5, Phẩm Thần thoại**.

## 7. Lửa Sinh Tồn và lãnh địa khởi đầu

### 7.1. Ba trục tại T0

| Trục | Giá trị đầu | Chức năng |
|---|---:|---|
| Bậc Lí Lan | `T_LiLan=1` | cơ thể, đột phá cá nhân và trần xác của Tử Phục |
| Cấp Lửa Sinh Tồn | `FireLevel=1 — Lửa Trại` | bán kính 10 m, tăng 5–20°C, tiêu 1 Gỗ/15 phút; chuỗi hình thái Cấp 1–30 |
| Giai đoạn lãnh địa | `H0 — Điểm Neo` | nhãn xã hội–quản trị; không tạo vùng nhiệt và không đặt trần Tử Phục |

Không có phép đổi `T_LiLan↔FireLevel↔H`. Nâng Lửa không tăng Bậc Lí Lan; đột phá Lí Lan không tăng vùng nhiệt; materialize `H` không tăng hai trục còn lại.

### 7.2. Khóa Bậc cá nhân của Tử Phục

Tại đúng thời điểm commit, đọc `T_LiLan_current=character.T_form` từ character state đã settle. Cổng dùng **Bậc cấu trúc thật**, không dùng `T_active`, buff Bậc tạm thời, Cấp nhân vật, Cấp Lửa hoặc giai đoạn lãnh địa. Xác trước khi chết đủ điều kiện Bậc khi:

\[
T_{dead}\le T_{LiLan,current}
\]

Xác không mang hệ chính `HOLY/THÁNH` giữ nguyên Bậc:

\[
T_{undead}=T_{dead}\le T_{LiLan,current}
\]

Xác mang hệ chính `HOLY/THÁNH` vẫn chịu penalty riêng `T_undead=max(0,T_dead−1)` theo §16. Khi Lí Lan ở Bậc 1, xác mạnh nhất có thể chọn là Bậc 1: xác thường trở thành tử thi Bậc 1, còn xác Thánh Bậc 1 thành tử thi Bậc 0. Xác Bậc 2+ vẫn được đánh dấu vượt trần nếu quyền đo đủ, nhưng phải chờ **Lí Lan** đạt Bậc tương ứng; Cấp Lửa không tham gia phép kiểm. Cổng chỉ xét lúc tạo: Lí Lan tăng/giảm Bậc về sau không tự nâng, giáng hoặc xóa những tử thi đã tạo hợp lệ.

### 7.3. Nhà và kho khởi đầu của Lí Lan

Trong vòng nhiệt của Lửa Trại có một **Nhà Lãnh Chúa Hư Hại** cùng một **Hòm Vật Tư Lãnh Địa Cấp 1**. Chúng tồn tại thành vật thể trên mặt băng; Lí Lan phải nhìn, tới gần và thao tác trong cảnh thì giao diện mới mở thông tin tương ứng.

Nhà cần **10 đá và 20 gỗ** để tu sửa. `base_work_units=17/60` người-giờ, `max_workers=2`; một người ở profile chuẩn cho đúng **17 phút**, còn thời gian thật gọi công thức phối hợp–sức khỏe–kỹ năng–công cụ–tinh thần–thời tiết File 01 §7.3. Khi hoàn tất, nhà che rét, mở Sổ Lãnh Địa và đủ **11 mẫu dựng sẵn Cấp 1**: Lò Sưởi, Bếp, Xưởng Gỗ, Tiệm May, Xưởng Quặng, Lò Rèn, Nhà Nông Phu, Phòng Y Tế, Nơi Trú Nhỏ, Tường Rào và Cổng. File này chỉ giữ state Lí Lan; recipe/profile/tuyến nâng lấy `LORD-HOUSE-UPGRADE-PATH-2.0`, `POLAR-FARMHOUSE-PROGRESSION-2.0` ở File 01 và `OPENING-FIXED-BUILDINGS-2.0` ở File 04.

Hòm có **40 ngăn**, chứa **20 bánh mì, 1 nồi sắt, 4 rìu đá, 4 búa đá, 1 trượng gỗ và 1 khiên tròn gỗ**. Định suất vẫn là bốn người dù Lí Lan giáng lâm một mình. Đây là kho vật tư khởi đầu, không thuộc thang phẩm Rương Báu của File 04 §12.6.

### 7.4. Nhà Nông Phu Cực Địa và nhịp chiêu mộ

Sau khi Nhà Lãnh Chúa được tu sửa, Sổ Kiến Trúc mở **Nhà Nông Phu Cực Địa Cấp 1** trong danh mục chung: diện tích **12 mét vuông**, sức chứa **4 người**, vật liệu **10 đá và 30 gỗ**, `base_work_units=0,75` người-giờ, `max_workers=2`. Một người chuẩn cần đúng **45 phút**; hai người với hệ số phối hợp `0,75` cần đúng **30 phút** trước modifier cảnh. Mọi cấp tiếp theo gọi `POLAR-FARMHOUSE-PROGRESSION-2.0`; narrator không suy diện tích, tầng, chỗ ở hoặc recipe từ hồ sơ Lí Lan.

Mỗi Nông Phu Cực Địa cần **5 đơn vị lương thực** để chiêu mộ. Nếu nhà còn bốn chỗ và kho có 20 lương thực, Lí Lan có thể gọi đủ bốn người trong cùng một lần. Hệ thống không phát một lượt miễn phí khi sang ngày mới và không giới hạn một người mỗi ngày; sổ ngày chỉ trừ khẩu phần của những cư dân đã hiện hữu.

Mỗi người bước ra đều có thân thể, tên, kỹ năng, nhu cầu và quan hệ riêng. Họ được tính là dân sống, có thể học nghề, thành anh hùng qua kỳ ngộ hợp lệ và có thể rời lãnh địa nếu bị bỏ đói kéo dài. Nguồn xác nhận nghĩa vụ cấp thức ăn hằng ngày nhưng không ấn định một mức khẩu phần chung; File 01 §9.6 tính lượng tiêu hao theo giống loài, thể trạng và cường độ lao động.

Một **đơn vị lương thực** là một bữa ăn chuẩn cho một người trưởng thành bình thường, không phải khẩu phần cả ngày. Mức ngày lấy ba bữa làm chuẩn rồi nhân thể trạng, lao động và tình trạng sức khỏe theo File 01 §9.6. Giá 5 đơn vị để chiêu mộ là giá gọi người của công trình, tách khỏi khẩu phần họ tiêu thụ sau khi xuất hiện.

## 8. Ngôi Mộ bậc 1

Ngôi Mộ là công trình binh chủng cá nhân hóa gắn với build Tử Phục. Tại `T0`:

| Trường | Giá trị |
|---|---|
| ID | `LL-BLD-TOMB-01` |
| Tên | Ngôi Mộ |
| Bậc công trình | 1 |
| Đầu ra | Zombie `T0` |
| Phẩm đầu ra | Thường — thấp nhất |
| Level đầu ra | `Lv1`, XP 0 |
| Hệ | Ám |
| Hero flag | 0 |
| Ký ức | 0 |
| Trung thành | Tử trung tuyệt đối với Lí Lan |
| Vai trò | quân số rẻ; lao động đơn giản; giữ tuyến bằng thân thể |
| Chỉ số cá thể | rất thấp do `T0`, phẩm Thường và kit sơ khai |
| Provenance | `creation_route=TOMB_QUEUE`; `producer_building_id=LL-BLD-TOMB-01` |
| Phản chiếu XP về Lí Lan | không; `xp_mirror_eligible=false` |
| Năng suất lao động nền | `1,00 WU/giờ` mỗi zombie theo `TOMB-ZOMBIE-LABOR-1.0` |

Ngôi Mộ không tự đào xác cổ chiến trường và không sao chép kỹ năng của người chết. Nó tạo zombie theo template công trình. Tử Phục trực tiếp trên xác thật là con đường riêng, mạnh hơn về phẩm/kỹ năng nhưng phụ thuộc chiến trường, quyền tiếp cận và Bậc hiện tại của Lí Lan.

Hồ Tử Khí của Ngôi Mộ bắt đầu đầy: **20/20** tại Bậc 1. Sức chứa theo bậc công trình `B` là `20×2^(B−1)`, nên ba bậc đầu lần lượt là 20, 40 và 80. Đúng **00:00** mỗi ngày thế giới, lượng hiện có được đặt về giới hạn hiện hành; nâng công trình giữa ngày chỉ tăng giới hạn, không phát phần chênh ngay. Hồ này chỉ trả recipe sản xuất của Ngôi Mộ, tuyệt đối không phải nhiên liệu, lượt dùng hoặc giới hạn của `Tử Phục` trực tiếp.

## 9. Nguyên nhân thức tỉnh thiên phú SSS

### 9.1. Cơ chế khí vận theo ngữ cảnh

Roll thiên phú chỉ diễn ra một lần tại `T0` bằng seed đã khóa. Môi trường có thể làm lệch trọng số grade/domain trước khi kết quả được chốt. Với mỗi domain `d`, gọi `D_d∈[0,1]` là cường độ trường chuẩn hóa đã có trong world-cell seed và `R_d=Hash64(shard_id+soul_id+"RESONANCE"+domain_id)/2^64∈[0,1)` là cộng hưởng cá nhân. Đặt `X=max_d(D_dR_d)`. `P_g` là xác suất nền grade `g` tại File 02 §11.1; `λ_g` là độ nhạy grade; `W_d` là trọng số domain ban đầu.

\[
P'_g=\frac{P_g\,e^{\lambda_gX}}{\sum_k P_k\,e^{\lambda_kX}}
\]

\[
W'_d=W_d(1+9D_d^2R_d)
\]

`AWAKENING-BIAS-1.0 — DESIGN_DEFAULT` khóa `λ_g` từ F tới SSS là `−1.00/−0.75/−0.50/−0.25/0/0.50/1.50/3.00/6.00`. Mười sáu domain khởi đầu cùng `W_d=1/16`; sau công thức trên, chuẩn hóa `W'_d/ΣW'_d` rồi dùng đúng sub-seed/CDF của `TALENT-ROLL-1.0` File 02 Phụ lục 2.I.11. World cell phải seed đủ 16 giá trị `D_d` trước T0; thiếu vector làm snapshot invalid thay vì mặc định 0 sau khi biết kết quả. Công thức thay trọng số trước roll; nó không tạo reroll hoặc bảo đảm mọi người ở cổ chiến trường đều nhận SSS.

### 9.2. Kết quả canon

Tại vị trí của Lí Lan, tử khí từ hài cốt sinh vật bậc cao đạt mức đủ để làm biến động khí vận thức tỉnh. Seed cá nhân cộng hưởng đúng domain, kết quả được khóa thành:

> **SSS — Tử Phục Linh Sư**  
> Domain: `Triệu hoán · Tử linh · Chuyển hóa · Quy tắc`  
> Tag: `Lãnh chúa · Hồi sinh xác · Ám hệ · Tử trung · Duy nhất theo cá thể`

Địa điểm giải thích vì sao thiên phú mang hướng tử linh và đạt grade SSS; nó không cho Lí Lan quyền biết lịch sử, số lượng hoặc danh tính người chết dưới băng.

## 10. Hồ sơ thiên phú `Tử Phục Linh Sư`

### 10.1. Mệnh đề cốt lõi

Lí Lan có thể chuyển hóa **mọi xác thật đủ điều kiện** thành binh lính tử thi thuộc quyền sở hữu của mình, bất kể chủng loài, nghề, vai trò hoặc hero flag trước khi chết.

### 10.2. Hiệu quả chuẩn

| Trường | Quy tắc |
|---|---|
| Đối tượng | xác thật có corpse ID và dấu ấn cấu trúc |
| Bậc xác tối đa | `T_dead≤T_LiLan_current` |
| Bậc sau Tử Phục | giữ `T_dead`; hệ Thánh `max(0,T_dead−1)` |
| Level/XP sau Tử Phục | giữ nguyên level và XP hiện tại |
| Tăng trưởng | giữ ledger/epoch; hệ Thánh giảm Phẩm thì rebase quality growth theo File 02 §10.9 |
| Phẩm | giữ nguyên; sinh vật hệ Thánh giảm một Phẩm |
| Hệ | chuyển thành Ám |
| Hero | giữ hero flag, kit hero và phần ký ức còn bám trong dấu ấn |
| Đơn vị thường | xác vô hồn; ký ức 0; vẫn giữ kỹ năng/dấu ấn tương thích |
| Kỹ năng | giữ danh sách; kỹ năng Thánh chuyển Ám, triệu hoán Thánh chuyển Quỷ |
| Thiên phú | giữ talent ID/grade/điểm đã sở hữu trong giới hạn tương thích |
| Trung thành | tuyệt đối, vĩnh viễn, ưu tiên Lí Lan |
| Số lần trên một corpse ID | 1 |
| Cái chết tử thi | hóa cát bụi; `SecondDeathLock=1` |
| XP nhận sau Tử Phục | tử thi giữ toàn bộ XP ròng của chính nó; Lí Lan đồng thời nhận thêm đúng lượng ấy theo `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0` |
| Hạn mức số xác | không có hard cap |
| Giới hạn vận hành | điều kiện xác, Bậc hiện tại của Lí Lan, quyền tiếp cận/phong ấn, khóa trực tiếp của kỹ năng Thánh hoặc vùng thánh hóa quá mức; sau khi tạo mới tính điểm chỉ huy của cá thể có trí, băng thông lệnh, frontage và hậu cần |

### 10.3. Điều thiên phú không làm thay

Thiên phú biến xác thành quân và bảo lưu tiến trình đã tồn tại; **bản thân event Tử Phục** không tự khai quật địa tầng, vận chuyển thi thể, giải phong ấn, sửa trang bị, cấp thêm level/XP, tăng Bậc Lí Lan, nâng Cấp Lửa, tạo command network hoặc cung cấp ký ức hoàn chỉnh. Sau khi tạo xong, XP mới mà tử thi trực tiếp ấy thật sự kiếm được được phản chiếu cho Lí Lan theo §13.4; đây là hậu quyết toán của thiên phú, không phải XP miễn phí lúc dựng xác.

## 11. Điều kiện một xác đủ tư cách Tử Phục

### 11.1. Biến kiểm tra

```text
CorpseExists
CorpseIntegrity
SecondDeathLock
T_dead
T_LiLan_current
OwnershipOrAccess
SealState
DirectHolyLock
HolyFieldExcess
```

### 11.2. Hàm đủ điều kiện

\[
Eligible=I(CorpseExists=1)\times I(CorpseIntegrity>0)
\times I(SecondDeathLock=0)\times I(T_{dead}\le T_{LiLan,current})
\times I(Access=1)\times I(SealAllows=1)
\times I(DirectHolyLock=0)\times I(HolyFieldExcess=0)
\]

`REVIVE-ACCESS-1.0 — USER_LOCKED + DESIGN_DEFAULT` đặt `CorpseIntegrity` trong `0..100`; giá trị 0 nghĩa dấu ấn cấu trúc đã mất hoàn toàn, còn mọi giá trị dương giữ một corpse ID hợp lệ. `Access=1` khi corpse ID thuộc ít nhất một trong hai tập: `(a)` xác đã được lộ vật lý trong scene hiện tại và có line-of-effect không bị vật cản/ranh không gian khóa; `(b)` xác nằm trong đất đã claim, đã được **sổ khảo sát lãnh địa** đăng ký bằng một event và không còn lớp địa tầng chưa mở. Lửa Sinh Tồn không “quét xác”, không cho bonus bán kính và không đặt phí mạng; xác chỉ được cảm thấy dưới băng nhưng chưa lộ/đăng ký có `Access=0` cho tới khi đào/khảo sát.

Ba cờ ức chế là cổng nhị phân có effect ID, không suy từ mỹ từ trong văn xuôi: `SealAllows=0` chỉ khi seal record đang hoạt động ghi `BLOCK_CORPSE_TRANSFORMATION=1` và Lí Lan không có quyền vượt seal; `DirectHolyLock=1` chỉ khi effect đang gắn lên Lí Lan, thiên phú hoặc corpse ID ghi `BLOCK_TU_PHUC=1`; `HolyFieldExcess=1` chỉ khi zone effect hiện hành ghi `PURGE_DEATH_TRACE=1`. Thiếu các tag ấy lần lượt lấy `SealAllows=1`, `DirectHolyLock=0`, `HolyFieldExcess=0`. Cái chết tồn tại ở hầu hết mọi nơi nên chỉ cần một tia tử khí là Tử Phục dùng được; nồng độ thấp thông thường không phải blocker.

### 11.3. Ranh giới của chữ “mọi”

“Mọi xác” nghĩa thiên phú chấp nhận mọi loại sinh vật đã chết khi các điều kiện trên đạt: người, thú, dị tộc, quái vật, sinh vật nguyên tố có thi thể, hero và sinh vật Thánh. Nó không biến một vật chưa từng có thi thể, một linh hồn thuần túy, một ảnh chiếu hoặc tro bụi thành xác.

## 12. Pipeline chuyển xác thành tử thi

```text
1. Xác định corpse ID và trạng thái xác
2. Đọc bậc/phẩm/hero flag/kỹ năng trong quyền đo
3. Đọc Bậc hiện tại của Lí Lan và kiểm tra `T_dead ≤ T_LiLan_current`
4. Kiểm tra phong ấn, quyền tiếp cận và SecondDeathLock
5. Kiểm tra khóa Thánh trực tiếp hoặc trường thánh hóa quá mức
6. Khóa corpse ID vào event Tử Phục; không reserve tử khí, mana, slot, phí hay lượt dùng
7. Giữ Bậc/Cấp/XP/ledger; nếu hệ chính là Thánh thì áp `−1 Bậc`, `−1 Phẩm` nhưng vẫn giữ Cấp/XP
8. Tính lại buff Bậc và quality-growth rebase nếu có penalty Thánh; giữ tỷ lệ HP/mana/thể lực
9. Chuyển hệ và kỹ năng xung đột
10. Khôi phục kit/thiên phú tương thích
11. Gắn chủ quyền Lí Lan và Tử Trung
12. Gắn provenance bất biến `creation_route=DIRECT_TU_PHUC`, `reviver_character_id=LI_LAN`, `talent_instance_id=LL-TAL-SSS-DEATH-REVIVER`, `root_owner=LI_LAN`, `xp_mirror_eligible=true` và timestamp bắt đầu hiệu lực
13. Gán `AgencyFlag`; tạo command load chỉ cho cá thể có trí, `OrderLoad` cho cohort vô trí, rồi ghi inventory và event log
14. Cho tử thi đứng dậy trong cùng action tick của lần kích hoạt
```

Giao diện update không thay thế bước 14. Văn xuôi phải thể hiện băng vỡ, trọng lượng cơ thể, khớp xương, khí tối, trạng thái trang bị và phản ứng của người chứng kiến. “Cùng action tick” không đồng nghĩa dừng thời gian hay miễn tiếp cận vật lý; nó chỉ khóa rằng Tử Phục không có channel time riêng.

## 13. Bảo lưu tiến trình và ngoại lệ hệ Thánh

### 13.1. Xác không thuộc hệ Thánh

\[
T_{form,new}=T_{dead},\qquad L_{new}=L_{dead},\qquad XP_{new}=XP_{dead}
\]

`GrowthEpoch`, `LevelGrowth_i`, `QualityGrowthApplied_i`, lịch sử nghề, mastery và mọi receipt tiến trình hợp lệ được giữ nguyên. Tử Phục không tạo catch-up, không cộng lại level cũ và không mở epoch mới; nó chỉ đổi chassis/faction cùng những field được §14 chỉ đích danh. `T_cap` được tính lại sau chuyển hóa nhưng không được dùng để hạ Bậc đã giữ: nếu `T_form>T_cap`, gắn `OVER_CAP_STRUCTURE` theo File 02.

### 13.2. Xác thuộc hệ chính Thánh

\[
T_{form,new}=\max(0,T_{dead}-1),\quad Q_{new}=\max(0,Q_{dead}-1),
\quad L_{new}=L_{dead},\quad XP_{new}=XP_{dead}
\]

Level và XP được giữ, nhưng penalty Phẩm vĩnh viễn gọi `QUALITY_GROWTH_REBASE` để trừ đúng phần tăng trưởng phẩm dư của `L−1` lần lên Cấp; base, training, gear, talent flat và mastery không bị xóa. Nếu Bậc bị hạ khiến `L>10×max(1,T_form,new)`, gắn `OVER_LEVEL_STRUCTURE`: giữ nguyên Cấp/XP, khóa nhận XP mới và dùng đường phục hồi cấu trúc File 02 §10.5. Nếu giảm Phẩm khiến `T_form>T_cap`, đồng thời gắn `OVER_CAP_STRUCTURE`; phải phục hồi tư chất trước khi lấy lại Bậc.

### 13.3. Buff Bậc sau chuyển hóa

Theo `STAT-STACK-1.1`:

\[
TierMult(T_{form})=\begin{cases}0.62,&T_{form}=0\\1.10^{T_{form}-1},&T_{form}\ge1\end{cases}
\]

`TierBonus_i=Raw_i×(TierMult−1)` luôn được tính lại trên thuộc tính hiện tại. Xác thường giữ Bậc nên giữ hệ số; xác Thánh bị giáng Bậc giảm hệ số ngay trong transaction. Ví dụ `Raw_STR=20`: Bậc 2 cho buff 2 và sheet 22 trước nguồn khác; Bậc 3 cho hệ số 1,21 và sheet 24 sau floor. Tỷ lệ HP/mana/thể lực hiện tại được giữ sau khi đổi trần tài nguyên, không tự hồi đầy hoặc gây sát thương miễn phí.

### 13.4. XP phản chiếu độc quyền của quân Tử Phục `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`

Quân Tử Phục trực tiếp là phần kéo dài của thiên phú Lí Lan. Khi một unit nhận một giao dịch `NORMAL_AWARD` có XP ròng cuối cùng `NetXP_u`, engine tạo thêm cho Lí Lan:

Đây là ngoại lệ `USER_LOCKED` **chỉ của Lí Lan**. Không lãnh chúa, necromancer, summoner, chủ pet hoặc người sở hữu quân nào khác được chia sẻ XP bằng loại suy từ hợp đồng này; muốn mở cho một cá thể khác cần một thiết lập trực tiếp mới của `{{user}}` cùng rule ID/version riêng.

\[
MirrorXP_{u\rightarrow LL}=\begin{cases}
NetXP_u,&DirectReviveEligible(u)=1\\
0,&\text{còn lại}
\end{cases}
\]

\[
XP_{Lí\ Lan,total}=XP_{Lí\ Lan,normal}+\sum_u MirrorXP_{u\rightarrow LL}
\]

`DirectReviveEligible(u)=1` chỉ khi **đồng thời** đạt tất cả điều kiện tại thời điểm award:

1. `creation_route=DIRECT_TU_PHUC`;
2. `reviver_character_id=LI_LAN`;
3. `talent_instance_id=LL-TAL-SSS-DEATH-REVIVER`;
4. `root_owner=LI_LAN` và talent link vẫn hoạt động;
5. `xp_mirror_eligible=true`;
6. hoạt động sinh XP nằm sau timestamp Tử Phục; event vắt qua mốc này phải tách segment;
7. award nguồn là `NORMAL_AWARD`, đã commit, có `NetXP_u>0` và chính unit không bị khóa nhận XP.

Tử thi giữ toàn bộ XP của nó và lên Cấp độc lập; mirror là XP **cộng thêm** cho Lí Lan, không rút khỏi unit, không pha loãng team pool và không thay `Share_i`. Không có giới hạn khoảng cách hoặc party thứ hai: unit đã phải vượt contribution/risk/anti-farm của award nguồn, nên một tử thi đang tác chiến hoặc lao động ngoài màn hình vẫn phản chiếu khi sổ của nó thật sự nhận XP. Nếu Lí Lan cũng tham gia, cô nhận cả phần `NORMAL_AWARD` của mình và mọi mirror hợp lệ.

Phạm vi là XP ròng từ chiến đấu, lao động/huấn luyện và nhiệm vụ sau khi mọi modifier cùng phép `floor` của File 02 đã chạy. Không phản chiếu mastery, XP lịch sử được giữ lúc dựng xác, XP catch-up/promotion, proc phản chiếu khác hoặc XP của: zombie `TOMB_QUEUE`; summon tạm; dân/quân tuyển mộ; tử thi do necromancer khác tạo; sinh vật do một tử thi cấp dưới triệu hồi/sinh ra; unit đã mất provenance. Cái chết thứ hai kết thúc link và không sinh một lần mirror cuối.

Mỗi dòng nguồn tạo receipt `source_xp_transaction_id|LI_LAN|LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`. Chỉ `NORMAL_AWARD` làm nguồn nên mirror không thể gọi mirror. Các receipt được áp theo `source_xp_transaction_id` tăng dần trong cùng transaction; Cấp của Lí Lan vượt bao nhiêu ngưỡng thì trừ từng ngưỡng, giữ XP dư và cộng đúng `G_{Lí Lan}=8,00` cho từng level. Replay trả receipt cũ, không cộng lần hai.

Ví dụ đóng: `LL-U-001` và `LL-U-002` là hai tử thi trực tiếp nhận lần lượt `37` và `12` XP; `LL-Z-001` là zombie Ngôi Mộ nhận `20` XP; Lí Lan tự nhận `9` XP. Ba unit giữ nguyên `+37/+12/+20`; Lí Lan nhận `9+37+12=58` XP, còn `20` XP của zombie không phản chiếu.

## 14. Dữ liệu được giữ, đổi và mất

| Dữ liệu trước chết | Sau Tử Phục | Ghi chú |
|---|---|---|
| Chủng loài/body plan | giữ | thêm tag Tử thi/Ám |
| Bậc cấu trúc | giữ | hệ chính Thánh `−1`, sàn T0 |
| Level/XP | giữ nguyên lúc chuyển hóa | event Tử Phục không phát XP; chỉ XP mới kiếm sau đó mới phản chiếu về Lí Lan theo §13.4 |
| Base attributes | giữ template, áp integrity/conversion | buff Bậc tính lại từ Raw hiện tại |
| Growth epoch/ledger | giữ | hệ Thánh rebase ngược phần quality growth do `−1 Phẩm` |
| Phẩm chiến đấu | giữ | hệ chính Thánh `−1`, sàn Thường |
| Hero flag | giữ | hero vẫn là hero |
| Danh sách kỹ năng | giữ | đổi hệ nếu xung đột; activation vẫn cần điều kiện |
| Mastery cơ thể/kỹ năng | giữ phần nằm trong dấu ấn | ký ức thường bằng 0 |
| Thiên phú/điểm thiên phú | giữ | node đòi level/bậc chờ mở lại |
| Chức nghiệp | giữ dấu cây nghề | skill gate theo level vẫn áp dụng |
| Trang bị đang mặc | vật thể riêng | cần thu hồi/sửa; không tự hồi độ bền |
| Linh hồn | không kéo về | Tử Phục tạo tử thể, không phải hồi sinh sự sống |
| Ký ức thường | 0 | xác vô hồn vận hành bằng dấu ấn và lệnh |
| Ký ức hero | giữ một phần | xem §15 |
| Quan hệ cũ | không tạo loyalty cũ | có thể còn dữ liệu ký ức hero nhưng quyền ưu tiên thuộc Lí Lan |

Kỹ năng “được giữ” nghĩa ownership/skill ID còn tồn tại. Một kỹ năng cần mana, vũ khí, anatomy, level hoặc bậc vẫn chờ đủ điều kiện vận hành; thiên phú không cấp miễn các đầu vào ấy.

## 15. Tử thi thường và tử thi hero

### 15.1. Tử thi thường

Tử thi thường là xác vô hồn có:

- ký ức tự truyện bằng 0;
- loyalty khóa tuyệt đối;
- hành vi nền từ chassis, kỹ năng, mastery dấu ấn và mệnh lệnh;
- khả năng học qua level, huấn luyện và phản hồi mới;
- identity quân sự do Lí Lan hoặc hệ thống lãnh địa cấp.

Nó có thể thực hiện kỹ năng đã khắc vào cơ thể/năng lượng dù không nhớ đời cũ, giống một cấu trúc biết cách vận hành nhưng không sở hữu câu chuyện về việc đã học nó.

### 15.2. Tử thi hero

Hero trước chết giữ `HeroFlag=1` sau Tử Phục. Nó vẫn có:

- ID hệ thống bất biến; tên hiển thị cũ nếu Lí Lan đã biết, nếu chưa thì giữ `STATE_UNOBSERVED` cho tới khi cô học được hoặc tự đặt tên mới;
- kit hero, skill tree, talent nodes, phẩm và vai trò chỉ huy;
- khả năng đưa quyết định chiến thuật trong phạm vi mệnh lệnh;
- một phần ký ức còn bám trong hero imprint.

Phần ký ức được phép xuất hiện theo bốn lớp:

| Lớp | Ví dụ | Độ tin cậy |
|---|---|---|
| Phản xạ | thế kiếm, đội hình, cách né một kỹ năng | cao nếu body integrity tốt |
| Tri thức nghề | ngôn ngữ, ký hiệu quân sự, tuyến hậu cần | trung bình; có thể khuyết đoạn |
| Mảnh cảm xúc | tên gọi, biểu tượng, nỗi sợ, lời thề | mạnh nhưng thiếu bối cảnh |
| Tự truyện | ai phản bội, nguyên nhân chiến tranh, quan hệ riêng | phân mảnh; cần kiểm chứng ngoài thế giới |

`HERO-MEMORY-1.0 — DESIGN_DEFAULT` không roll ký ức sau khi thấy nhu cầu cốt truyện. Mỗi hero corpse đã có `memory_fragment_ids` và bốn score `Reflex/Profession/Emotion/Autobiography` trong seed lịch sử; thời gian, ma thuật và bảo quản đã được phản ánh vào score `0..100` trước khi xác được tìm thấy. Tử Phục mở lớp theo ngưỡng lần lượt `>0/≥25/≥50/≥75`; trong mỗi lớp, chỉ fragment có score không thấp hơn ngưỡng được giữ. Độ tin cậy hiển thị là `Clamp(0.10,0.95,0.30+0.0065×score)`, giữ ba chữ số; tự truyện còn phải có một bằng chứng ngoài độc lập mới được nâng từ “mảnh ký ức” thành fact. Không có fragment ID nghĩa là không có ký ức lớp ấy, không được engine sinh bù.

Hero imprint không phải narrator toàn tri. Một ký ức xuất hiện như hình ảnh, cảm giác hoặc mẩu tri thức và có thể sai do thi thể hư hại, ma thuật chiến trường hoặc thời gian.

### 15.3. Hero vẫn tử trung

Hero tử thi có năng lực chủ động cao hơn lính thường, nhưng thứ tự quyền hạn luôn là:

```text
Mệnh lệnh hợp lệ của Lí Lan
→ bảo vệ sự tồn tại/lợi ích đã được Lí Lan xác lập
→ mệnh lệnh được ủy quyền
→ tự chủ chiến thuật
→ dấu ấn/ký ức cũ
```

Ký ức cũ có thể tạo phong cách, lời khuyên và phản ứng, song không thể tạo phản bội, cưỡng đoạt quyền chỉ huy hoặc phá lệnh trực tiếp của Lí Lan.

## 16. Sinh vật hệ Thánh và chuyển kỹ năng

### 16.1. Penalty Bậc và Phẩm

Sinh vật có hệ chính `Thánh` là ngoại lệ duy nhất không giữ Bậc. Khi Tử Phục, nó giữ nguyên Cấp/XP nhưng đồng thời giảm một Bậc và một Phẩm, rồi chuyển hệ chính sang Ám:

\[
T_{form,new}=\max(0,T_{dead}-1),\qquad
Q_{new}=\max(0,Q_{dead}-1),\qquad
L_{new}=L_{dead},\qquad XP_{new}=XP_{dead}
\]

`Q` dùng chỉ số Thường 0 → Thần thoại 6 theo File 02 §10.3; 0 là sàn. Giảm phẩm xảy ra sau khi giữ hero flag. Một hero Thần thoại hệ Thánh trở thành hero Lãnh chúa hệ Ám, chứ không biến thành lính thường.

Nếu giảm phẩm làm trần tư chất tính lại thấp hơn `T_form,new`, tử thi vẫn giữ đúng kết quả giáng một Bậc và gắn `OVER_CAP_STRUCTURE`. Nếu Cấp được giữ cao hơn trần của Bậc mới, gắn thêm `OVER_LEVEL_STRUCTURE`; Cấp/XP không bị hạ, nhưng XP mới bị khóa cho tới khi cấu trúc được phục hồi đủ. Penalty Thánh không được âm thầm giáng thêm Bậc hoặc Phẩm lần thứ hai.

Thứ tự tăng trưởng là `giữ Cấp/XP/ledger → giảm Bậc → giảm Phẩm → QUALITY_GROWTH_REBASE → tính lại buff Bậc → giữ tỷ lệ tài nguyên`. Rebase trừ đúng chênh lệch tăng trưởng Phẩm quá khứ theo lịch sử nghề; không xóa toàn bộ growth. Sau khi cờ quá Cấp được giải, hero Lãnh chúa trong ví dụ nhận `7,00` điểm ở các lần lên Cấp mới; phẩm Thần thoại đã mất không còn cấp rate `9,00`.

### 16.2. Bảng chuyển hệ kỹ năng

| Kỹ năng trước chết | Sau Tử Phục | Chức năng giữ lại |
|---|---|---|
| Heal Thánh | Khâu Tử/Phục hồi tử thể Ám | vai trò hồi phục, target rule đổi sang tử thi |
| Khiên Thánh | Màn Âm/giáp tử khí | hấp thụ và bảo hộ |
| Thanh tẩy | Tước Sinh/giải hiệu ứng sinh mệnh | utility tương đương, polarity đổi |
| Hào quang đức tin | Hào quang tử trung/tử khí | buff command/cohesion của quân Ám |
| Sát thương quang | hàn âm, mục rữa hoặc soul-shadow | coefficient giữ trong PB hợp lệ |
| Triệu hoán thiên sứ/thánh thú | triệu hoán quỷ hoặc ma vật tương ứng | **bắt buộc chuyển sang hệ Quỷ** |
| Kỹ năng Thánh thuần luật | phiên bản Ám cùng cấp nếu tồn tại | nếu chưa có bản tương thích, skill bị khóa chờ chuyển chức/nghiên cứu |

Chuyển hệ giữ vai trò và ngân sách sức mạnh, không bảo đảm giữ nguyên mọi target, animation hoặc lore. Một kỹ năng cần thần ban có thể chuyển sang nguồn tử khí/năng lượng Ám tương thích; nếu chassis mới chưa cung cấp được nguồn, skill vẫn thuộc sở hữu nhưng ở trạng thái khóa. Lửa Sinh Tồn không tự cấp nguồn cho skill.

### 16.3. Tương tác với hệ Thánh đang sống

Tử thi chuyển từ sinh vật Thánh có thể gây phản ứng chính trị mạnh: giáo hội xem đó là xúc phạm, phe Ám xem là chiến lợi phẩm, còn hậu duệ có thể đòi an táng. Các phản ứng ấy cần đường truyền tin và bằng chứng; NPC không tự biết một xác đã được Lí Lan chuyển hóa từ khoảng cách vô hạn.

## 17. Tử trung tuyệt đối

`Loyalty=Lí Lan: 100/100` là khóa quy tắc của thiên phú, áp dụng cho lính thường và hero tử thi.

### 17.1. Điều tử trung bảo đảm

- ưu tiên mệnh lệnh hợp lệ của Lí Lan;
- giữ bí mật theo lệnh và bảo vệ Lí Lan theo doctrine;
- không đổi chủ bằng tiền, sợ hãi, danh vọng, ký ức cũ hoặc lời mời phe phái;
- kháng mind-control chuyển chủ ở cấp thấp hơn SSS;
- hero có thể nêu đánh giá chiến thuật nhưng vẫn thi hành quyết định cuối.

### 17.2. Điều tử trung không bảo đảm

Tử trung không biến một mệnh lệnh mơ hồ thành chiến thuật hoàn hảo. Tử thi vẫn có thể:

- hiểu sai do thiếu ngữ cảnh;
- lệnh mới tới chậm khi `OrderLoad` quá tải;
- thất bại vì level, địa hình, kỹ năng hoặc trang bị;
- bị stun, banish, phong ấn, cắt kết nối hay tiêu diệt;
- gây collateral damage nếu doctrine không đủ rõ.

## 18. Cái chết thứ hai và khóa tái Tử Phục

Khi một tử thi do `Tử Phục Linh Sư` tạo ra chết:

```text
HP/Integrity → 0
→ cấu trúc Tử Phục sụp
→ thân thể hóa cát bụi/tro tử khí
→ corpse ID đóng
→ SecondDeathLock = 1
→ quyền Tử Phục trên ID đó vĩnh viễn thất bại
```

Trang bị, vật phẩm gắn ngoài, di vật riêng và loot vật chất được xử lý độc lập; chúng không tự hóa bụi nếu luật item không buộc. Hero tử thi có thể để lại doctrine, ký ức đã ghi, học trò hoặc di sản lãnh địa, nhưng bản thân hero không thể đứng dậy lần thứ hai.

Quy tắc này chống vòng lặp `chết → Tử Phục → chết → Tử Phục`, tạo trọng lượng cho thương vong quân đoàn và khiến việc giữ hero tử thi còn sống trở thành quyết định chiến lược.

## 19. Số lượng, điều kiện ức chế, điểm chỉ huy và băng thông mệnh lệnh

### 19.1. Không có hard cap số xác

Thiên phú không có số lần dùng theo ngày, số slot xác, quota dân số, phí tài nguyên hoặc hồi chiêu. Mọi xác đủ điều kiện trong phạm vi truy cập đều có thể được chuyển hóa trong action tick đang phân giải. Nút vận hành còn lại là điều kiện của xác, trần bậc, quyền tiếp cận/phong ấn, ức chế Thánh trực tiếp, hậu cần/frontage, điểm chỉ huy của cá thể có trí và băng thông mệnh lệnh của cohort vô trí.

### 19.2. Không có phí Tử Phục

`Tử Phục` trực tiếp có các hằng số:

| Biến | Giá trị |
|---|---:|
| phí Tử Khí | 0 |
| phí mana/năng lượng | 0 |
| phí vật phẩm | 0 |
| số lượt/ngày | không giới hạn |
| số xác/lần kích hoạt | mọi corpse ID đủ điều kiện nằm trong tập mục tiêu đã khai báo |
| hồi chiêu | 0 |
| upkeep mặc định của tử thi tạo ra | 0; chỉ một chassis/kỹ năng riêng ghi rõ mới phát sinh upkeep |

Cái chết để lại tử khí ở khắp nơi; một tia tử khí đã đủ làm môi chất. Nồng độ tử khí chỉ là dữ kiện môi trường/lore hoặc đầu vào riêng của công trình Ngôi Mộ, không được biến lại thành phí cho thiên phú.

### 19.3. Không có channel time; ức chế là cổng nhị phân

Không có `E_revive`, `ChannelPower`, `FieldSupport`, `CoreNetwork` hoặc phép chia đợt vì thiếu công suất. Khi action hợp lệ được phân giải, toàn bộ tập xác mục tiêu đủ điều kiện chuyển hóa cùng tick. Kỹ năng Thánh hoặc vùng thánh hóa chỉ đặt `DirectHolyLock/HolyFieldExcess=1` bằng đúng effect tag `BLOCK_TU_PHUC/PURGE_DEATH_TRACE` ở §11.2; tính từ “thánh”, hào quang hay cường độ mô tả không đủ để bật cổng. Các xác bị effect bao phủ thất bại mà không đổi thành “tốn thêm năng lượng”. Rời vùng ức chế hoặc phá effect cho phép thử lại nếu corpse ID vẫn hợp lệ.

### 19.4. Điểm chỉ huy và `OrderLoad`

Mỗi tử thi mang cờ agency:

\[
CommandLoad_i=AgencyFlag_i\times BodySize_i\times1.6^{T_{form,i}}
\times RankWeight_{command,i}\times Complexity_i\times Persistence_i
\]

- Cương Thi và tử vật thường vô trí: `AgencyFlag=0`, `CommandLoad=0`.
- Hero tử thi, tử vật đã thức tỉnh trí tuệ hoặc cá thể có quyền tự chủ: `AgencyFlag=1`, cộng điểm chỉ huy đầy đủ.

Tử vật vô trí phục tùng lệnh hợp lệ 100%; số lượng không làm chúng nảy sinh ý chí hoặc phản bội. Chúng vẫn chịu:

\[
OrderLoad=\sum_{c=1}^{ActiveCohorts}OrderComplexity_c\times DistanceFactor_c\times RelayPenalty_c
\]

Mọi hệ số và độ trễ dùng `COMMAND-LOAD-1.0/ORDER-BANDWIDTH-1.0` File 04 Phụ lục 4.K. Quá tải `OrderLoad` làm lệnh mới tới chậm, cohort tiếp tục lệnh cuối, đội hình kém linh hoạt và đường/frontage tắc; nó không phải điểm chỉ huy. Mọi tử vật vẫn chiếm không gian, chịu AoE và cần tuyến triển khai. Chúng không trả tử khí/năng lượng/upkeep nền; chỉ một chassis, kỹ năng hoặc trang bị riêng có dòng upkeep rõ mới tạo chi phí đó.

## 20. Hai con đường tạo quân: Ngôi Mộ và xác thật

| Thuộc tính | Ngôi Mộ | Tử Phục xác thật |
|---|---|---|
| Đầu vào | Tử Khí trong hồ công trình, hàng chờ và recipe template | một xác đủ điều kiện; không trả tài nguyên |
| Bậc | theo bảng công trình §21 | giữ `T_dead`; hệ Thánh `T_dead−1`; mọi xác phải `T_dead≤T_LiLan_current` |
| Phẩm | theo bậc Ngôi Mộ | giữ phẩm xác; Thánh −1 |
| Level/XP | Lv1/0 | giữ nguyên xác |
| Provenance | `TOMB_QUEUE`; producer là lineage `LL-BLD-TOMB-01` | `DIRECT_TU_PHUC`; reviver `LI_LAN`; talent instance cố định |
| XP phản chiếu về Lí Lan | không, kể cả zombie tự nhận XP | có; 100% `net_xp` thật sự nhận sau Tử Phục |
| Năng suất lao động nền | `1,00 WU/giờ` nếu là zombie template chuẩn | giữ `BaseLaborRate` hợp lệ của chassis đã chuyển hóa; không ép thành zombie 1 WU/giờ |
| Growth | 0 lúc sinh; rate theo phẩm đầu ra | giữ ledger; Thánh rebase do giảm Phẩm |
| Kỹ năng | kit zombie chuẩn | giữ kit tương thích của xác |
| Thiên phú | template mặc định | giữ talent/điểm talent |
| Hero | không sản xuất hàng loạt | hero xác vẫn là hero |
| Ký ức | 0 | hero giữ mảnh ký ức |
| Tính sẵn có | đều theo queue | phụ thuộc xác và quyền tiếp cận |
| Giá trị chiến lược | quân số nền, lao động, dự bị | đơn vị chất lượng, kit hiếm, hero, khai thác chiến trường |

Ngôi Mộ bảo đảm Lí Lan có lực lượng cơ bản ngay cả khi chưa tìm thấy xác phù hợp. Cổ chiến trường cung cấp trần chất lượng mà công trình đại trà không thể thay thế.

Hàng chờ Ngôi Mộ dùng `NECRO-QUEUE-2.2` tại File 04 §16.8: chỉ trừ Tử Khí trong hồ công trình, không trừ thực phẩm, tín ngưỡng hay điểm chỉ huy cho Cương Thi vô trí. Tử Phục xác thật không dùng slot/hồ của Ngôi Mộ, không trả năng lượng và không có channel; nó chỉ kiểm tra quyền tiếp cận, corpse eligibility và khóa Thánh. Mọi đầu ra nhận `unit_id` ngay trong event tạo; không được cộng một số quân chung rồi để ID/Cấp/XP “bổ sung sau”.

## 21. Tiến trình Ngôi Mộ bậc 1–10

### 21.1. Quy tắc khóa

Từ bậc 1 đến bậc 5, Ngôi Mộ tăng **bậc cấu trúc zombie**. Zombie cao nhất do công trình tạo hàng loạt là `T4`. Từ bậc 6 trở đi, công trình giữ `T4` và chỉ nâng **phẩm chiến đấu**.

| Bậc Ngôi Mộ | Hồ Tử Khí | Tên chức năng | Zombie đầu ra | Phẩm đầu ra | Level | `G_Q`/level | Trọng tâm nâng cấp |
|---:|---:|---|---:|---|---:|---:|---|
| 1 | 20 | Ngôi Mộ | T0 | Thường | 1 | 2,00 | quân số rẻ, lệnh đơn giản |
| 2 | 40 | Mộ Gia Cố | T1 | Thường | 1 | 2,00 | cấu trúc ổn định, dùng công cụ thô |
| 3 | 80 | Quần Mộ | T2 | Thường | 1 | 2,00 | đội hình và kỹ năng nền |
| 4 | 160 | Nghĩa Địa | T3 | Thường | 1 | 2,00 | chịu tải chiến trường, kit chuyên môn |
| 5 | 320 | Tử Địa | T4 | Thường | 1 | 2,00 | bậc zombie công trình tối đa |
| 6 | 640 | Tử Địa Tinh Luyện | T4 | Cựu binh | 1 | 2,50 | AI/kit biến thể, command tốt hơn |
| 7 | 1.280 | Tử Địa Tinh Anh | T4 | Tinh anh | 1 | 3,25 | passive, vai trò rõ, cohesion |
| 8 | 2.560 | Tử Địa Đầu Lĩnh | T4 | Đầu lĩnh | 1 | 4,25 | aura nhỏ, chỉ huy đại đội |
| 9 | 5.120 | Tử Địa Thống Soái | T4 | Thống soái | 1 | 5,50 | kit hoàn chỉnh, doctrine |
| 10 | 10.240 | Tử Địa Lãnh Chúa | T4 | Lãnh chúa | 1 | 7,00 | lĩnh vực nhỏ, chỉ huy quân đoàn |

Ngôi Mộ không sản xuất hàng loạt zombie phẩm Thần thoại. Phẩm Thần thoại cần tiến hóa cá thể, kỳ ngộ, thành tựu đủ lớn hoặc thức tỉnh hero theo luật thế giới. Mọi đầu ra vẫn bắt đầu `Lv1` với growth tích lũy bằng 0; `G_Q` cao hơn quyết định số điểm chúng nhận ở mỗi lần lên level kế tiếp.

### 21.2. Điều nâng cấp

`TOMB-UPGRADE-1.0 — DESIGN_DEFAULT` đóng lần nâng từ `B` lên `b=B+1`, với `B∈{1..9}`:

\[
Stone=\lceil40\times1.8^{b-2}\rceil,\quad
Wood=\lceil20\times1.8^{b-2}\rceil
\]

\[
Iron=\begin{cases}0,&b=2\\\lceil10\times1.8^{b-3}\rceil,&b\ge3\end{cases},\quad
NecroticCatalyst=\lceil2\times1.6^{b-2}\rceil
\]

\[
WorkUnits=30\times1.7^{b-2}\text{ người-giờ},\qquad
Footprint_b=12\times1.5^{b-1}\text{ m}^2
\]

- catalyst phải có Bậc ít nhất `max(0,b−2)`; số lượng là đơn vị vật dẫn, không phải Tử Khí trong hồ;
- yêu cầu cấp lãnh địa `H≥floor((b−1)/2)` và Nhà Lãnh Chúa Cấp `≥ceil(b/2)`; **không có** gate `T_LiLan` hay `FireLevel` chung, trừ khi một Bản Vẽ/version nguồn cụ thể của đúng lần nâng ghi rõ;
- thời gian gọi công thức nhân công/thời tiết/công cụ File 01 §7.3 từ `WorkUnits`, làm tròn lên 5 phút;
- `max_workers=min(24,2b)` trên một workfront; người vượt cap không vào mẫu số;
- phải có footprint mục tiêu, vật liệu được reserve và Ngôi Mộ ngừng production trong suốt construction transaction;
- completion tăng B đúng một, cập nhật cap/slot/duration/output theo §§21–22; lượng Tử Khí hiện có không nhận phần chênh trước 00:00;
- không có sát hạch, phí hoặc prerequisite ẩn ngoài các dòng trên. Một nguồn/user rule cụ thể hơn có thể thay recipe bằng version mới trước khi bắt đầu, không sửa hồi tố.

Ví dụ lần B1→B2 cần 40 đá, 20 gỗ, 0 sắt, 2 vật dẫn tử linh Bậc 0, 30 người-giờ, H0 và Nhà Lãnh Chúa Cấp 1. Cấp Lửa và Bậc Lí Lan đều `NOT_APPLICABLE`; thiên phú SSS không miễn bất kỳ khoản nào.

## 22. Công thức quân số zombie

### 22.1. Chi phí đơn vị chuẩn

\[
DQCost_z=\max\left(1,\left\lceil1.6^{T_z}\times RankMult_{DQ}(Q_z)
\times Complexity_{DQ,z}\right\rceil\right)
\]

\[
N_{complete}=\min\left(
\left\lfloor\frac{DQ_{current}}{DQCost_z}\right\rfloor,
Slots(B)\times\left\lfloor\frac{\Delta t_{minutes}}{Duration(B)}\right\rfloor
\right)
\]

Trong `NECRO-QUEUE-2.2`, mọi tham số đều khóa:

- `RankMult_DQ(Q)=1,00/1,15/1,45/1,90/2,60/3,70/5,50` từ Thường đến Thần thoại;
- `Complexity_DQ,z=1,00` cho output chuẩn trong bảng §21; biến thể chuyên dụng bằng `1,25`, công thành bằng `1,50`; Ngôi Mộ không sản xuất hàng loạt hero;
- `Slots(B)=min(8,B+1)`;
- `Duration(B)=max(5,20-1,5(B-1))` phút, không làm tròn giữa phép tính;
- `DQ_current` là lượng khả dụng ở đầu đoạn sau mọi reservation cũ và trước khi khởi động job mới, `0≤DQ_current≤20×2^(B-1)`;
- công thức đóng trên chỉ áp cho queue rỗng/không có job dở ở đầu đoạn và standing order đồng nhất không bị gián đoạn; nó trả số **job mới** vừa khởi động vừa hoàn tất trong đoạn;
- `Δt_minutes` là khoảng chạy liên tục không gián đoạn và không cắt qua 00:00; nếu cắt qua mốc hồi đầy, tách phép tính thành hai đoạn;
- làm tròn chỉ tại `ceil` của chi phí và `floor` của số unit; mỗi job vẫn có timestamp riêng.

Queue có job dở dùng event scheduler tất định: DQ bị trừ tại `started_at`; completion đã trả tiền xảy ra đúng `completes_at`; slot được nhả ở completion; standing order thử khởi động job kế ngay timestamp ấy; 00:00 đặt lượng **khả dụng** về cap sau khi xử lý completion cùng timestamp theo thứ tự trên. Job dở không trả phí lần hai và không nhận thêm DQ. Hòa nhiều job dùng `slot_id`, rồi `job_id`.

Tại Bậc 1, output chuẩn là `T0, Phẩm Thường`, nên `DQCost=1`, `Slots=2`, `Duration=20 phút`; hồ đầy 20 cho phép reserve tối đa 20 Cương Thi trước kỳ hồi 00:00. Sức chứa tài nguyên, slot và thời gian đều là giới hạn độc lập; số hoàn tất lấy giá trị nhỏ nhất, không dùng “budget” không định nghĩa.

### 22.2. Số lượng không đồng nghĩa sức mạnh tuyến tính

Sức mạnh quân số chịu:

\[
N_{effective}=Frontline+0.55Support+0.25Reserve
\]

`Frontline`, `Support` và `Reserve` là số unit còn hoạt động được đang ở đúng ba vị trí đội hình tại timestamp tính; một unit chỉ nằm trong một nhóm. Kết quả là trọng số ghép lực, không xóa quân thật. Quân dư nằm ở reserve, chiếm đường, tạo tải lệnh và trở thành mục tiêu AoE. Zombie T0 phù hợp giữ đất rộng, lao động, tiêu hao và bao vây; chúng cần doctrine, địa hình và hỗ trợ để đối đầu đơn vị phẩm/bậc cao.

### 22.3. Năng suất lao động zombie `TOMB-ZOMBIE-LABOR-1.0`

Mỗi zombie template chuẩn được Ngôi Mộ tạo ở bất kỳ bậc công trình nào có `BaseLaborRate=1,00 WU/giờ`. Đây là rate nền trong `BLUEPRINT-WORK-3.0` File 04: một zombie làm một workfront, với integrity/sức bền, kỹ năng, công cụ, thời tiết, shelter và command đều `1,00`, hoàn thành đúng `1,00 WU` sau một giờ. Zombie không mệt sinh học nên `Stamina=1,00` trừ khi một hiệu ứng/chassis chỉ đích danh làm suy giảm; integrity hỏng dùng multiplier `Health`, còn thiếu công cụ bắt buộc vẫn cho `Tool=0`.

Phối hợp vẫn áp `Coord(n)`: hai zombie cùng một workfront, mọi multiplier bằng 1, chỉ tạo `0,75×(1+1)=1,50 WU/giờ`, không phải 2. Chia sang hai workfront độc lập mới cho tổng 2 WU/giờ nếu công việc cho phép. Tử thi `DIRECT_TU_PHUC` giữ template lao động của chassis hợp lệ trước/chuyển hóa và không tự bị đặt thành 1 WU/giờ chỉ vì thuộc quân Lí Lan.

## 23. Logic cấp–bậc–tư chất–phẩm chất–tăng trưởng

### 23.1. Bốn câu hỏi tách biệt

| Trục | Câu hỏi |
|---|---|
| Level `L` | cá thể đã tích bao nhiêu XP và growth? |
| Bậc cấu trúc `T_form` | cấu trúc hiện mở tới level nào? |
| Trần tư chất `T_cap` | cá thể có thể tự phát triển tới bậc nào? |
| Phẩm `Q` | cùng level/bậc, kit, AI, PB và ngân sách thuộc tính mỗi level cao tới đâu? |

### 23.2. Trần level đã mở

\[
L_{open}=10\times\max(1,T_{form})
\]

- `T0`: Lv1–10 với hệ số 0,62; cần thức tỉnh T1 để đi tiếp.
- `T1`: mở tới Lv10.
- `T2`: mở tới Lv20.
- `T4`: mở tới Lv40 và cho buff Bậc `1,10³`, kể cả khi cá thể hiện Lv1.
- `T10`: mở tới Lv100.

### 23.3. Nguồn điểm thuộc tính mỗi level

Từ `Lv2`, mỗi lần lên level thật cấp một ngân sách growth. Binh lính/NPC/hero/summon dùng phẩm; người chơi dùng nền người chơi cộng cấp thiên phú:

\[
G_{unit}=G_Q(Q),\qquad G_{player}=2,00+G_T(Grade)
\]

| Phẩm đơn vị | `G_Q`/level | Cấp thiên phú người chơi | `G_T`/level |
|---|---:|---|---:|
| Thường | 2,00 | F | +0,25 |
| Cựu binh | 2,50 | E | +0,50 |
| Tinh anh | 3,25 | D | +0,75 |
| Đầu lĩnh | 4,25 | C | +1,00 |
| Thống soái | 5,50 | B | +1,50 |
| Lãnh chúa | 7,00 | A | +2,25 |
| Thần thoại | 9,00 | S | +3,25 |
|  |  | SS | +4,50 |
|  |  | SSS | +6,00 |

Khoảng cách `G_Q` tích lũy theo level là lý do trực tiếp khiến quân phẩm cao vừa mạnh hơn vừa hiếm hơn; chi phí sản xuất/tuyển mộ phải định giá cả đường tăng trưởng ấy.

Lí Lan có thiên phú SSS, nên rate cá nhân đã khóa là `2,00+6,00=8,00` điểm mỗi level. Tại `Lv1`, cô có 0 điểm growth tích lũy; SSS làm đường tăng trưởng dốc hơn từ lần lên `Lv2`, không cấp trước chỉ số của level chưa đạt.

### 23.4. Hướng nghề và ví dụ cung thủ

Mỗi level dùng hai trục nghề có thứ tự:

\[
w_{main}=55\%,\qquad w_{second}=25\%,\qquad
w_{other}=20\%/7=1/35
\]

Một người chơi SSS theo nghề cung thủ (`DEX/PER`) nhận trên mỗi level: DEX `4,40`, PER `2,00`, mỗi thuộc tính còn lại khoảng `0,2286`. Sau 10 lần lên level, tổng 80 điểm gồm DEX `44`, PER `20` và bảy trục còn lại tổng `16`.

Đây là ví dụ công thức, **không khóa Lí Lan làm cung thủ**. Nghề của Lí Lan đã được hệ thống niêm là `Tử Linh Triệu Hoán Sư` với trục `SPI/PRE`, nhưng còn `STATE_UNOBSERVED` trên giao diện cho tới khi cô kiểm tra thẻ. Nếu level tăng trước lúc kích hoạt, ngân sách vào `PendingCareerGrowth` rồi tự giải theo `SPI/PRE` khi thẻ được dùng; người chơi không chọn lại payload.

### 23.5. Lên phẩm ở level cao và bù điểm thiếu

Promotion vĩnh viễn tính lại mọi lần lên level trong growth epoch hiện tại theo phẩm mới, nhưng giữ vector nghề từng level:

\[
Catchup_i=G_Q(Q_{new})\sum_{k=2}^{L}w_i(J_k)-QualityGrowthApplied_i
\]

Ví dụ một cung thủ Thường đạt `Lv21` đã tích `20×2,00=40` điểm. Khi lên Tinh anh, target trở thành `20×3,25=65`; hệ thống cộng ngay 25 điểm còn thiếu: DEX `+13,75`, PER `+6,25`, mỗi trục khác khoảng `+0,7143`. Level, XP và `T_form` giữ nguyên. Tỷ lệ HP/mana/thể lực hiện tại được giữ sau khi trần tài nguyên đổi.

Đổi nghề trước promotion không reroute lịch sử. Buff phẩm tạm thời không tạo catch-up. Giáng phẩm vĩnh viễn rebase ngược đúng phần quality growth; base, training, trang bị và talent flat vẫn nguyên vẹn.

### 23.6. Ví dụ nông phu

Một nông phu `T1, Lv1, phẩm Thường` có `A_eff=36`, nên `T_cap=T2` và nhận `2,00` điểm growth mỗi lần lên level theo hướng nghề nông. Người này có thể luyện tới Lv10, đột phá T2 nếu đạt điều kiện, rồi tiếp tục tới Lv20. Tại đó trần tư chất chặn tiến trình. Kỳ ngộ làm tăng `A_base`, phẩm hoặc hero flag có thể mở trần mới; nỗ lực lặp lại cùng bài tập chỉ tăng level/mastery trong trần sẵn có.

### 23.7. Ví dụ xác bậc cao

Một hero không thuộc hệ Thánh `T5, Lv48, phẩm Thống soái` chết khi Lí Lan đang ở Bậc 5 và các cổng còn lại đều đạt:

```text
Trước: T5 · Lv48 · Thống soái · Hero
Sau:   T5 · Lv48 · Thống soái · Hero · Ám
```

Hero giữ nguyên Bậc, Cấp, XP, growth, kỹ năng và mastery hợp lệ; nó chỉ chuyển chassis/hệ cùng các field ở §14. Buff Bậc vẫn là `1,10⁴`, tính lại từ Raw hiện tại. Nếu cùng xác có hệ chính Thánh, kết quả là `T4 · Lv48 · Lãnh chúa · Hero · Ám`: Cấp/XP giữ nguyên, quality growth bị rebase, buff Bậc hạ còn `1,10³`, đồng thời `OVER_LEVEL_STRUCTURE` khóa XP mới cho tới khi lấy lại đủ cấu trúc.

## 24. Công thức trần tư chất và đột phá

### 24.1. Tư chất hiệu dụng

\[
A_{eff}=Clamp(0,100,A_{base}+Q_{bonus}+H_{bonus}
+\Delta Opportunity-\Delta Damage)
\]

| Phẩm | `Q_bonus` | `F_quality` đột phá | `G_Q`/level |
|---|---:|---:|---:|
| Thường | 0 | 0,45 | 2,00 |
| Cựu binh | 2 | 0,55 | 2,50 |
| Tinh anh | 5 | 0,65 | 3,25 |
| Đầu lĩnh | 9 | 0,75 | 4,25 |
| Thống soái | 14 | 0,85 | 5,50 |
| Lãnh chúa | 20 | 0,93 | 7,00 |
| Thần thoại | 28 | 1,00 | 9,00 |

| `A_eff` | `T_cap` |
|---:|---:|
| 0–14 | T0 |
| 15–29 | T1 |
| 30–44 | T2 |
| 45–57 | T3 |
| 58–68 | T4 |
| 69–77 | T5 |
| 78–84 | T6 |
| 85–90 | T7 |
| 91–95 | T8 |
| 96–98 | T9 |
| 99–100 | ứng viên T10 |

### 24.2. Xác suất đột phá

\[
P_{break}=G_{apt}\times G_{special}\times P_{cap}(T_{target})
\times F_{foundation}\times F_{mastery}\times F_{preparation}
\times F_{trial}\times F_{quality}
\]

| Bậc đích | Xác suất trần |
|---:|---:|
| T1 | 100% |
| T2 | 80% |
| T3 | 55% |
| T4 | 32% |
| T5 | 16% |
| T6 | 8% |
| T7 | 3% |
| T8 | 1% |
| T9 | 0,2% |
| T10 | 1% với khóa đặc biệt |

`G_apt=0` khi bậc đích vượt `T_cap`. Một kỳ ngộ phải thay đổi tư chất trước lần thử, chứ không chỉ cộng xác suất vào một cửa đã đóng.

## 25. Khóa T10

Một lần thử `T9→T10` chỉ hợp lệ nếu cá thể đồng thời:

1. là hero;
2. có phẩm Thần thoại;
3. đạt `A_eff≥99`;
4. đạt Lv90, foundation/mastery lý tưởng;
5. có kỳ ngộ hoặc vật dẫn cấp quy tắc;
6. hoàn thành trial T10.

\[
G_{special,T10}=HeroFlag\times I(Q=Thần\ thoại)\times I(A_{eff}\ge99)
\]

Sau mọi điều kiện, xác suất tối đa vẫn là `1%` cho mỗi lần thử hợp lệ. Lịch sử chưa ghi nhận binh lính thường đạt T10. Một tử thi hero Thần thoại có thể trở thành ứng viên nếu sống đủ lâu để lên lại level/bậc; thiên phú SSS không miễn khóa này.

## 26. Binh lính thường thức tỉnh thành hero

### 26.1. Cửa thức tỉnh

Một đơn vị thường có thể trở thành hero khi tự thức tỉnh một kỹ năng cá nhân duy nhất qua:

- huấn luyện kéo dài có phản hồi và mục tiêu thật;
- quyết định tự chủ làm đổi kết quả nhiệm vụ;
- tình thế sinh tử với hậu quả vĩnh viễn;
- hành động không thể thay bằng kit chung của chassis.

### 26.2. Tỷ lệ

\[
P_{hero}=10^{-4}\times F_{risk}\times F_{agency}
\times F_{novelty}\times F_{consequence}
\]

Mỗi hệ số dùng mapping `HERO-AWAKEN-1.0` tại File 02 Phụ lục 2.I.8; tỷ lệ cao nhất là `1/10.000` cho một event ID đủ chuẩn. Cùng một cuộc tập hoặc trận giả không tạo nhiều lần roll.

### 26.3. Kết quả

Khi thành công:

- đơn vị nhận tên/ID hero và `HeroFlag=1`;
- phẩm tăng ít nhất một nấc, tối thiểu đạt Tinh anh;
- promotion gọi `QUALITY_GROWTH_REBASE`, cộng đủ phần thuộc tính thiếu của các level cũ theo lịch sử nghề;
- `A_base` tăng đúng `A_delta=RoundHalfUp(Clamp(5,15,5+5F_risk+5F_agency))`, tính lại `T_cap`;
- nhận kỹ năng độc hữu phản ánh cách nó vượt qua sự kiện;
- giữ level và `T_form`, không nhận cấp miễn phí.

Ví dụ: một nông phu T1 bị dồn vào góc trong chiến tranh, tự mở một đường thoát bằng kỹ năng chưa từng có và đưa người khác sống sót. Nếu event vượt cửa `1/10.000`, cá thể trở thành hero, tăng phẩm/tư chất và có trần cao hơn T2 cũ. Hero bẩm sinh vẫn là số đông; hero đi lên từ binh lính thường thường sắc bén hơn trong thực chiến đúng niche đã sinh ra mình.

### 26.4. Áp dụng cho zombie

Zombie thường có thể thức tỉnh hero bằng dấu ấn hành động mới dù không có linh hồn cũ. Thành công tạo hero tử thi mới, kỹ năng riêng và trần tư chất cao hơn; nó không khôi phục ký ức trước chết. Tử trung với Lí Lan vẫn giữ nguyên.

## 27. Hệ/trận doanh và quan hệ khắc chế

### 27.1. Cấu trúc hệ

Trong Lord DnD, **hệ** còn được gọi là **trận doanh** trên giao diện. Một thực thể có:

```text
PrimaryFaction
SecondaryFactions[0..2]
SpeciesTags
EnergySource
RelationProfile
CounterProfile
```

Lí Lan giữ hệ cá nhân `Người chơi/Nhân hệ` tại `T0`, đồng thời mang tag năng lực `Ám`. Mọi tử thi do thiên phú tạo ra nhận hệ chính `Ám`. Kỹ năng triệu hoán Thánh chuyển sang `Quỷ`, nên một tử thi có thể mang `Ám + Quỷ`.

### 27.2. Quan hệ xã hội và khắc chế là hai bảng

\[
R_{ij,current}=Clamp(-100,100,R_{ij,base}+Treaty+History+Leadership+Event)
\]

\[
K_{ij}=Clamp(0.70,1.35,1+A_{element}+A_{faction}+A_{field}
-Resistance-CounterSkill)
\]

- `R_ij` đo thiện cảm/thù địch, ảnh hưởng AI, ngoại giao và morale.
- `K_ij` đo hệ số cơ chế trong một tương tác chiến đấu cụ thể.
- Một hiệp ước có thể tăng `R` mà không xóa khắc chế sinh học.
- Địa hình có thể đổi dấu lợi thế, ví dụ Phong làm Hỏa lan hoặc bóp tắt tùy kỹ năng.

### 27.3. Ma trận quan hệ nền

| Hệ A | Hệ B | `R_base` | Khắc chế điển hình |
|---|---|---:|---|
| Ám | Thánh | −80 | Thánh thanh tẩy tử thể; Ám bào mòn đức tin/neo linh hồn |
| Quỷ | Thánh | −90 | Thánh phá tà khế; Quỷ ô nhiễm nghi thức và triệu hoán |
| Thủy | Hỏa | −35 | Thủy dập/hạ nhiệt; Hỏa công suất cao bốc hơi và phản áp |
| Hỏa | Mộc | −30 | Hỏa đốt/lây qua Mộc; Mộc ẩm có thể hút nhiệt, bóp nhiên liệu |
| Mộc | Thổ | −15 | rễ phá nền; Thổ khô/mặn/nén chặt kìm sinh trưởng |
| Lôi | Thủy | −20 | môi trường ướt dẫn Lôi; kỹ năng Thủy có thể cách ly/tiêu tán |
| Băng | Hỏa | −45 | triệt nhiệt trực tiếp; khối lượng/công suất/field quyết định |
| Phong | Hỏa | +5 | Thiên kiến xã hội nền +5; field dẫn gió/giàu oxy cho `A_field=+0,10`, field tước oxy/phân tán cho `A_field=−0,20`, còn lại 0 |
| Ám | Quỷ | +10 | dễ hợp tác nhưng tranh chấp linh hồn, khế ước và quyền thống trị |

### 27.4. Tử trung vượt quan hệ hệ

Một tử thi Thánh đã chuyển Ám có thể còn mảnh ký ức về giáo hội, nhưng `LoyaltyOverride=Lí Lan` luôn thắng `R_base`. Quan hệ hệ vẫn ảnh hưởng ngôn ngữ, phản xạ, kỹ năng bị khắc chế và cách NPC khác nhìn nó.

## 28. Flow early game của Lí Lan

Đây là flow chức năng; hành động thực tế phụ thuộc `{{user}}`.

### 28.1. Nút A — Giây đầu tại `T0`

Thông tin hiện hữu:

- lãnh địa `H0`, Lửa Trại Cấp 1 và nhiên liệu có hạn;
- Nhà Lãnh Chúa Hư Hại cùng Hòm Vật Tư Lãnh Địa trong vòng nhiệt;
- Ngôi Mộ T1 với queue zombie T0;
- tử khí cực cao dưới băng;
- ít nhất ba affordance: nhiên liệu, chiến hào/lối tránh gió, dấu xác hoặc khe băng;
- kênh khu vực bắt đầu hoạt động.

### 28.2. Nút B — Lực lượng đầu tiên

Các đường hợp lệ:

- mở Hòm Vật Tư để lấy khẩu phần và công cụ;
- thu 10 đá, 20 gỗ rồi tu sửa Nhà Lãnh Chúa;
- chạy hàng chờ Ngôi Mộ để lấy zombie T0;
- tìm xác `T0–T2` đủ điều kiện quanh bề mặt;
- ưu tiên nhiệt/công cụ rồi trì hoãn quân;
- nghiên cứu panel, command và tử khí trước khi chi tài nguyên.

Story engine tính thời gian thật. Người chơi khác cũng đang thực hiện hành động đầu và có thể chiếm cột mốc trước.

### 28.3. Nút C — Khảo sát mặt băng

Khảo sát cần chia bản đồ theo:

| Lớp | Dữ liệu |
|---|---|
| Bề mặt | vật liệu, gió, độ trượt, dấu quái/người |
| Băng nông | độ dày, khe, xác gần, nguy cơ sập |
| Địa tầng tử khí | nồng độ, hướng dòng, điểm tích tụ |
| Dấu tích quân sự | hào đất, lũy gỗ, tường đá, ụ bắn cung, biểu tượng, đội hình tử trận; không suy ra bunker/công nghệ hiện đại |
| Phong ấn | cường độ, nguồn, điều kiện chạm hoặc phá |

### 28.4. Nút D — Đêm đầu

Lí Lan cần cân đối nhiệt, tình trạng Nhà Lãnh Chúa, khẩu phần, hàng chờ, điểm chỉ huy của hero/cá thể có trí, băng thông mệnh lệnh của quân vô trí, canh gác và kế hoạch đào. Nếu đã dựng Nhà Nông Phu Cực Địa, số người có thể được chiêu mộ ngay theo chỗ trống và lương thực còn lại; khẩu phần của họ bắt đầu được ghi vào lần chốt ngày kế tiếp. Zombie không cần nhiệt hay khẩu phần như người sống và tốn 0 điểm chỉ huy, nhưng vẫn cần tính toàn vẹn, tử khí/upkeep theo chassis, đường triển khai và `OrderLoad`; chúng có thể làm việc ngoài vòng nhiệt lâu hơn, tạo lợi thế lao động rõ rệt.

### 28.5. Nút E — Tuần khai cuộc

Các mốc cạnh tranh thật chỉ gồm Bảng Cấp khai cuộc và những hoạt động/bảng được `CANON_EVENT_CALENDAR` materialize bằng hợp đồng hợp lệ, cùng nâng Cấp Lửa Sinh Tồn, boss dã ngoại, mở chợ và công trình. Cổ chiến trường tạo lợi thế thông tin/nguồn xác cho Lí Lan, đồng thời việc đào băng tiêu thời gian mà người khác có thể dùng để săn tài nguyên. Story engine giữ cả hai mặt của lựa chọn.

## 29. Flow khai phá cổ chiến trường dài hạn

### 29.1. Nguyên tắc “tiếp cận và Bậc cá nhân là hai cổng riêng”

Mỗi lớp địa tầng có ba khóa riêng:

```text
AccessGate: có thể đào/đi tới không?
SafetyGate: có sống sót qua tử khí, băng và phong ấn không?
ReviveGate: T_dead ≤ T_LiLan_current không?
```

Mở AccessGate không tự mở ReviveGate. Lí Lan có thể tìm thấy một xác vượt trần nhiều arc trước khi bản thân đạt đủ Bậc; xác ấy trở thành mục tiêu bảo vệ, nghiên cứu hoặc tranh chấp. Nâng Lửa chỉ có thể giúp vùng sống/khai phá nếu profile nguồn nói vậy, không làm xác đủ điều kiện Tử Phục.

### 29.2. Năm tầng chức năng

| Tầng | Dấu hiệu | Chức năng cốt truyện | Trần xác gợi ý |
|---|---|---|---|
| I — Bề mặt vỡ | vũ khí, xương nông, chiến hào | dạy khảo sát/Tử Phục và tạo quân đầu | T0–T2 |
| II — Tuyến trận | kho, đội hình chết, sĩ quan | mở doctrine, phẩm cao, tranh chấp tài nguyên | T2–T4 |
| III — Địa cung chỉ huy bằng đá | vòm đá, cửa gỗ bọc sắt, phù hiệu, bản đồ da/phiến đá, hero imprint | ký ức lịch sử, hero tử thi, phe hậu duệ | T4–T6 |
| IV — Vùng phong ấn | đại thi thể, vết luật, giáo hội | xung đột Thánh–Ám, chiến tranh vùng | T6–T8 |
| V — Tâm chiến trường | nguồn tử khí, thực thể tối cao | bí mật đại kiếp/vòng lặp và endgame | T8–T10 |

“Trần xác gợi ý” là bucket phân tầng, không phải bảo đảm mọi tầng có đúng số lượng hoặc phẩm. Mọi entrance, occupant, corpse cluster, quest item và seal của năm tầng lấy đúng site/actor registry trong `WORLD-PACKAGE-LL01-1.0`; chúng không được sinh thêm hoặc đổi chỗ sau T0.

### 29.3. Chuỗi mỗi lần khai quật

```text
Manh mối
→ khảo sát
→ công cụ/nhân lực
→ mở băng
→ xử lý khí/phong ấn
→ nhận diện xác và lịch sử
→ kiểm tra Bậc hiện tại của Lí Lan
→ Tử Phục hoặc bảo quản
→ phản ứng phe liên quan
→ thay đổi quân lực/chính danh
```

### 29.4. Quyền sở hữu người chết

Một xác đủ điều kiện về kỹ thuật vẫn có thể tạo hậu quả xã hội:

- hậu duệ yêu cầu an táng;
- giáo hội xem Tử Phục là tà pháp;
- một vương quốc coi hero đã chết là quốc bảo;
- phe Ám muốn mua/cướp quân mới;
- ký ức hero tố cáo một tội ác chưa được xét xử;
- người dân trong lãnh địa bất đồng về việc sử dụng thi thể.

Tử trung giải quyết lòng trung thành của quân, không tự giải quyết chính danh của Lí Lan.

### 29.5. Đồng hồ đối thủ

Các world clock tối thiểu:

| Clock | Khi tăng | Khi đầy |
|---|---|---|
| `ICE-FRACTURE` | đào, động đất, mùa ấm | một tầng mở/sập ngoài kế hoạch |
| `DEATH-TIDE` | hút tử khí, phá phong ấn | khí tràn, quái/thực thể thức tỉnh |
| `HOLY-NOTICE` | dùng quân Ám công khai, chợ/rank lan tin | giáo hội điều tra hoặc can thiệp |
| `HEIR-CLAIM` | lộ phù hiệu/hero lịch sử | hậu duệ/chính thể yêu sách |
| `RIVAL-EXCAVATION` | tọa độ bị lộ, đối thủ thăm dò | phe khác chạm tầng trước |
| `FIRE-RACE` | người chơi nâng Cấp Lửa Sinh Tồn | cột mốc/achievement bị người nhanh nhất chiếm |

## 30. Giao diện cá nhân và quy tắc hiển thị

### 30.1. Snapshot máy tại `SAVE-T0-CLEAN` — INTERNAL/DEBUG ONLY

Khối này chỉ phục vụ tính liên tục, công thức và kiểm thử. Bộ vận hành tuyệt đối không chép nguyên mã `T...`, `H...`, `FireLevel...`, phẩm trơ, mã định danh hoặc giá trị liệt kê vào bảng nhân vật, bảng trạng thái hay tin nhắn hệ thống, trừ khi `{{user}}` yêu cầu đúng bản số liệu thô hoặc bản kiểm lỗi. Bản hướng người chơi viết `Lv<n>` thành `Cấp <n>`.

```yaml
character:
  character_id: LI_LAN
  name: "Lí Lan"
  age: 24
  sex: FEMALE
  nationality: TRUNG_HOA
  height_cm: 174
  build: SLIM
  hair: BLACK
  eyes: BLACK_WITH_EYE_BAGS
  clothing: [BLACK_HOODIE, SHORTS]
  level: 1
  xp: 0
  form_tier: T1
  attributes: {STR: 8, VIT: 8, DEX: 8, INT: 9, SPI: 18, WIL: 9, PER: 8, PRE: 13, LUK: 9}
  earth_job: CYBERSECURITY_MANAGER
  commute_mode: METRO
  nearby_pre_t0: ORDINARY_OFFICE_WORKERS
  carried_inventory: [CONVENIENCE_STORE_FOOD_BAG]
  family_and_relations: NONE
  game_job_state: UNEMPLOYED_CARD_SEALED
  career_card_payload: JOB-SUM-NECRO-01
  career_resource_mode: MANA_REQUIRED
  career_job_tags: [TRIEU, TU_LINH, AM, MANA, UNDEAD, CORPSE, SOUL, COMMAND]
  career_core_loop_actions: [CAST_NECROMANCY, MARK_CORPSE, COMMAND_UNDEAD, PRESERVE_CORPSE, MANIPULATE_SOUL]
  career_core_action_tags: [MANA, TRIEU, TU_LINH, AM, CORPSE, MARK, COMMAND, UNDEAD, PRESERVE, SOUL, RITUAL]
  career_allowed_scaling_stats: [GENERIC, MAtk, SPI, PRE, WIL, INT, PER]
  career_allowed_equipment_tags: [NONE, FOCUS, STAFF, GRIMOIRE, RITUAL_TOOL, BONE_TALISMAN]
  career_allowed_damage_channels: [AM, SOUL, LANH, PROJECTILE, AOE]
  career_allowed_support_roles: [DAMAGE, DEBUFF, CONTROL, PROTECT, MASTERY, SUSTAIN, SUMMON, COMMAND, SCOUT, MOBILITY, UTILITY, CORPSE_LOGISTICS, ANTI_HOLY, ZONE, RESOURCE, RITUAL]
  achievement_skill_catalog: ACHPOOL-JOB-SUM-NECRO-01-1.0
  achievement_skill_catalog_body_sha256: 67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247
  achievement_skill_slice_map_sha256: 1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176
  opening_skill_rule: OPENING-MANA-SKILL-1.0
  opening_skill_pool: OPENPOOL-JOB-SUM-NECRO-01
  opening_skill_payload: SK-OPEN-NECRO-01
  opening_skill_state: SEALED_UNTIL_CAREER_ACTIVATED
  mana_pool:
    access: true
    max: 236
    current: 236
    base_regen_per_second: 0.45
    last_settled_at: T0
    activity_mode: NORMAL_AWAKE
    continuous_drain_per_second: 0
    active_regen_modifiers: []
    rule_version: MANA-RECOVERY-1.0
  moral_position: PURE_UTILITY_ALIVE_OR_DEAD
  goals: [SURVIVE, REACH_WORLD_PEAK]
  voice: [CALM, FLAT_DEAD_TONE, RASPY, SELECTIVELY_COLD]
  content_limits: NONE
  growth_source: PLAYER_TALENT
  growth_per_level: 8.00  # 2.00 player base + 6.00 SSS
  growth_applied: 0
  pending_career_growth: 0
  primary_faction: PLAYER_HUMAN
  power_tags: [DARK, NECROMANCY, LORD]

talent:
  id: LL-TAL-SSS-DEATH-REVIVER
  name: "Tử Phục Linh Sư"
  grade: SSS
  mechanical_tags: [TRIEU, TU_LINH, AM, CHUYEN_HOA, TU_TRUNG]
  corpse_limit: "T_dead <= character.form_tier_current"
  corpse_limit_rule: LI_LAN_PERSONAL_TIER_GATE-1.0
  result_tier: "T_dead; HOLY => max(0, T_dead - 1)"
  result_level: "preserve level_at_death"
  result_xp: "preserve xp_at_death"
  post_revive_xp_rule: LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0
  holy_quality_penalty: "max(0, Q_dead - 1)"
  result_faction: DARK
  loyalty: ABSOLUTE_TO_LI_LAN
  second_death: DUST_AND_LOCK

territory:
  world_time: "T0 / 07:00"
  stage: H0
  survival_fire:
    level: 1
    form: CAMPFIRE
    active: true
    heat_radius_m: 10
    heat_delta_c: {min: 5, max: 20}
    fuel_options: [{item: WOOD, quantity: 1, duration_minutes: 15}]
    fuel_remaining: STATE_UNOBSERVED_SEE_STARTER_LEDGER
    durability_ref: FILE04_BUILDING_INSTANCE
    progression_rule: SURVIVAL-FIRE-PROGRESSION-2.0
  biome: FROZEN_ANCIENT_BATTLEFIELD
  lord_house: DAMAGED_REPAIR_10_STONE_20_WOOD
  territory_storage: LEVEL_1_CAPACITY_40_STARTER_SET_FOR_4
  polar_farmer_house: LOCKED_UNTIL_LORD_HOUSE_REPAIRED
  troop_building: LL-BLD-TOMB-01
  tomb_death_qi: {current: 20, cap: 20, next_refill: "00:00"}
  tomb_zombie_template: {creation_route: TOMB_QUEUE, base_labor_rate_wu_per_hour: 1.00, xp_mirror_eligible: false, rule_version: TOMB-ZOMBIE-LABOR-1.0}
  vitals:
    rule_version: TERRITORY-VITALS-1.0
    last_settled_at: null
    input_anchor_id: SAVE-T0-CLEAN
    through_event_id: null
    prosperity: {status: DIRTY_INITIAL, score: null}
    legitimacy: {status: NOT_APPLICABLE_NO_GOVERNED_RESIDENTS, current: null, evidence_target: null}
    security: {status: DIRTY_INITIAL_SEEDED_INTERNAL_INPUTS, score: null}
    note: "Không có số T0 hard-code; lần đọc/consumer đầu tiên tính từ starter ledger, world seed, threat floor và trạng thái Lửa Sinh Tồn hiện hành. Lí Lan là chủ quyền, không đồng thời tạo một cohort người bị trị để tự cấp Chính danh."
  units_existing: 0

survival:
  SustenanceMode: SELF_MANAGED
  body_scale: {B_f: 0.90, B_w: 0.90, source: DERIVED_FROM_USER_LOCKED_SLIM_BUILD}
  species_factor: {S_f: 1.00, S_w: 1.00}
  condition_factor: {C_f: 1.00, C_w: 1.00}
  need_window_started_at: "T0 / 07:00"
  FoodDebtDays: 0
  WaterDebtDays: 0
  HungerState: FED
  ThirstState: HYDRATED
  last_settlement_at: "T0 / 07:00"

runtime_jobs:
  registry_rule: PERSISTENT-JOB-REGISTRY-1.0
  boundary_rule: TIME-BOUNDARY-MANIFEST-1.0
  spatial_runtime_rule: SPATIAL-SEARCH-RUNTIME-1.0
  job_refs: []
  spatial_plan_refs: []
  team_spatial_operation_refs: []
  search_history_ref: NONE_NO_SPATIAL_SEARCH_YET
  LookingForTreasure_specialist: {active: false, search_id: NONE_INACTIVE, observer_lineage_id: LI_LAN, persistent_job_id: NONE_INACTIVE, spatial_plan_id: NONE_INACTIVE, team_operation_ids: [], party_ids: [], started_at: null, next_check_at: null, gross_area_km2: 0, area_searched_km2: 0, repeated_area_km2: 0, search_history_ref: NONE_NO_SPATIAL_SEARCH_YET, pending_results: []}
  trigger_receipts: []
```

### 30.2. Character sheet mặc định hướng người chơi

Khi `{{user}}` yêu cầu mở bảng nhân vật, engine dùng bố cục mô tả dưới đây và lược trường `STATE_UNOBSERVED` thay vì in placeholder kỹ thuật:

> **LÍ LAN — LÃNH CHÚA CỦA CỔ CHIẾN TRƯỜNG BĂNG**  
> **Nhân thân:** nữ, 24 tuổi, quốc tịch Trung Hoa; cao 174 cm, vóc dáng mảnh — tóc đen, mắt đen có quầng, hoodie đen và quần short là diện mạo tại T0.  
> **Tiến trình cá nhân:** Bậc 1, Cấp 1 — lớp năng lượng nền vừa được hệ thống hóa, còn kinh nghiệm và huấn luyện bắt đầu từ đầu.  
> **Thuộc tính:** Lực 8; Thể 8; Khéo 8; Trí 9; Linh 18; Ý 9; Cảm 8; Hiện diện 13; Vận 9 — tổng 90 điểm đã tự phân bổ theo thiên phú, không qua roll hoặc point-buy.  
> **Mana:** 236/236, hồi nền 0,45 mỗi giây khi tỉnh táo bình thường — hồ tự hồi theo thời gian đã trôi; chiến đấu, lao động nặng và nghỉ ngơi dùng hệ số trạng thái riêng.  
> **Chức nghiệp:** Vô chức; Thẻ Chuyển Nghề Khai Cuộc chưa kiểm tra — chức nghiệp đã được niêm trong thẻ và không phải lựa chọn điền trước của người chơi.  
> **Tăng trưởng:** 8 điểm thuộc tính cho mỗi lần lên Cấp — điểm sẽ tự phân bổ theo hướng nghề nghiệp hợp lệ của Lí Lan.  
> **Sinh tồn:** đủ no và đủ nước tại T0, nợ thức ăn 0 ngày, nợ nước 0 ngày — nhu cầu từ thời điểm giáng lâm sẽ tích lũy theo hoạt động và được chốt hằng ngày.  
> **Lửa Sinh Tồn:** Lửa Trại Cấp 1, bán kính 10 mét, tăng 5–20°C và tiêu 1 Gỗ mỗi 15 phút — đây là nguồn nhiệt đang cháy, không phải một Hạch Bậc 1.  
> **Nhà Lãnh Chúa:** hư hại, có thể tu sửa bằng 10 đá và 20 gỗ — hoàn tất sẽ mở Sổ Lãnh Địa cùng các công trình nền.  
> **Hòm Vật Tư Lãnh Địa:** Cấp 1, bốn mươi ngăn — bộ khẩu phần và công cụ khởi đầu đang chờ Lí Lan mở.  
> **Ngôi Mộ:** Bậc 1, triệu hồi những Cương Thi Bậc 0 phẩm thấp nhất — còn non nớt, song là bước khởi đầu cho một đội quân tử khí sau này.  
> **Hồ Tử Khí Ngôi Mộ:** 20/20, hồi đầy lúc 00:00 — hồ chỉ phục vụ hàng chờ công trình, không hạn chế Tử Phục trực tiếp.  
> **Cộng hưởng địa tầng:** tử khí cực cao, nguồn nằm dưới nhiều lớp băng — vùng đất này mang sẵn nền tảng tử khí hiếm có, thuận lợi cho việc phát triển năng lực sau này.  
> **Khí vận thức tỉnh:** đã định hướng bởi cộng hưởng tử khí — con đường tu luyện của Lí Lan từ đây gắn chặt với hệ Ám.  
> **Thiên phú:** Phẩm SSS, **Tử Phục Linh Sư** — tử khí dựng thi thể đã chết thành binh lính tuyệt đối phục tùng; chỉ dấu ấn anh hùng đủ mạnh mới duy trì được trí tuệ độc lập.  
> Cho phép chuyển hóa mọi xác thật đủ điều kiện mà không có hạn mức số lượng theo ngày, không tiêu Hồ Tử Khí, không phí, không channel và không cooldown. Tử thi thường vô trí, ký ức bằng 0 và thi hành mệnh lệnh hợp lệ 100%; tử thi anh hùng giữ agency cùng những mảnh ký ức được File 06 cho phép.  
> **Giới hạn hiện tại:** Lí Lan đang ở Bậc 1 nên có thể chuyển hóa xác chết tối đa Bậc 1 — xác thường giữ Bậc, còn xác hệ Thánh bị giảm một Bậc.  
> **Quy tắc tử thể:** giữ nguyên Cấp và XP, chuyển sang hệ Ám — xác thường giữ Phẩm; xác hệ Thánh giảm một Phẩm, còn kỹ năng và thiên phú tương thích tiếp tục được bảo lưu.

Thuộc tính đã được `AWAKENED-AUTO-ATTR-1.0` áp tự động tại T0 và được phép hiện khi mở bảng. Mỗi trường nằm trên một dòng và chỉ có một mệnh đề ngắn sau gạch ngang. Mọi số Bậc, Cấp và Phẩm đã xác thực phải xuất hiện; mã `T...`, `H...`, `FireLevel...`, phẩm trơ, mã định danh, giá trị liệt kê và biến công thức ở lại bản ghi nội bộ, còn `Lv<n>` phải đổi thành `Cấp <n>` ở bản hướng người chơi.

### 30.3. UI đầu cảnh và delta sau Tử Phục

Tin nhắn đầu dùng chín trường thông tin theo đúng định dạng File 05 §13.2, gồm thêm Nhà Lãnh Chúa và Hòm Vật Tư. Khi `{{user}}` yêu cầu mở thiên phú, bộ vận hành mở hồ sơ theo cùng chuẩn: dòng đầu ghi Phẩm, tên và một đến hai câu sắc thái; dòng ngay sau chứa đúng hai câu hiệu quả cơ học trước phần chi tiết đã biết về điều kiện xác, chuyển hóa, bảo lưu, hệ Thánh, anh hùng, cái chết thứ hai, điểm chỉ huy và `OrderLoad`. Mở bảng giao diện không làm thời gian dừng.

Delta mặc định sau một lần Tử Phục:

```text
[TỬ PHỤC HOÀN TẤT]
Đối tượng: [tên hoặc mô tả mà Lí Lan đã biết] — xác đã hoàn tất chuyển hóa.
Chuyển hóa sinh mệnh: Bậc [trước] → Bậc [sau], Cấp [trước] giữ nguyên, XP [trước] giữ nguyên — chỉ hệ Thánh bị giảm một Bậc.
Buff Bậc: [hệ số trước] → [hệ số sau], [delta chín thuộc tính] — tính lại từ thuộc tính hiện tại, không dùng snapshot đột phá.
Phẩm chất: Phẩm [trước] → Phẩm [sau] — nêu nguyên nhân ngắn nếu phẩm bị thay đổi.
Trận doanh: [hệ trước đã biết] → hệ Ám — kỹ năng triệu hoán Thánh tương thích chuyển sang hệ Quỷ.
Dấu ấn anh hùng: [được giữ / không tồn tại / chưa đủ dữ liệu] — chỉ hiện kết luận nằm trong quyền đo.
Ký ức: [không còn / còn mảnh ký ức anh hùng đã xác nhận] — tử thi thường không giữ ký ức cá nhân.
Điểm chỉ huy: [tăng 0 nếu vô trí / tăng giá trị đã đo nếu có trí], tổng [giá trị mới] — chỉ hero hoặc cá thể có agency mới chiếm điểm chỉ huy.
Băng thông mệnh lệnh: [cohort và OrderLoad sau sự kiện] — quân vô trí vẫn cần truyền lệnh, đường và đội hình dù điểm chỉ huy bằng 0.
Vòng đời thứ hai: đã bắt đầu — cái chết kế tiếp khiến thân thể tan thành cát bụi.
```

Khi transaction dùng thẻ thành công, hiện thêm một lần:

```text
[THỨC TỈNH CHỨC NGHIỆP]
Chức nghiệp: Tử Linh Triệu Hoán Sư — nghề khai cuộc dùng Mana đã được kích hoạt.
Kỹ năng: Phẩm E, Tử Khí Châm — một mũi tử khí lạnh, mảnh và thẳng như dấu kim đen.
Hiệu quả: tiêu 8 Mana để gây 0,75 lần Công phép thành sát thương Ám lên một mục tiêu còn hoạt tính, hồi 3 giây. Kỹ năng không tác động xác và không thay thế Tử Phục.
Độ thành thạo: 0 — kỹ năng Cơ bản có trọng số tải 1.
```

Giao diện dùng `chưa có dữ liệu` cho danh tính, lịch sử, động cơ hoặc kỹ năng mà Lí Lan chưa quan sát. Bậc và phẩm chỉ hiện khi quyền đo của hệ thống/thiên phú đủ; khi hiện, giá trị thật được giữ dưới dạng `Bậc <n>` hoặc `Phẩm <tên>` và đi cùng một mệnh đề ngắn.

### 30.4. Cổng định dạng hiển thị vĩnh viễn

Quy tắc này áp dụng cho mọi bảng mới, lần tăng Cấp, chiến lợi phẩm, thay đổi trạng thái và thông báo về sau:

1. Mã `T...`, `H...`, `FireLevel...`, phẩm trơ, mã định danh và giá trị liệt kê ở lại trạng thái nội bộ; `Lv<n>` thành `Cấp <n>` ở bản mặc định.
2. Mỗi `T<n>` đã biết thành `Bậc <n>` và phẩm đã biết thành `Phẩm <tên>`; giữ nguyên số cùng phẩm, không diễn giải mất.
3. Mã `H...` được thay bằng tên giai đoạn lãnh địa; `FireLevel...` thành đúng hình thái và Cấp Lửa; không tự suy `H0` thành `Bậc 0`.
4. Mỗi trường dùng đúng một dòng: `[Tên trường]: [giá trị], [chi tiết] — [một mệnh đề ngắn].`
5. Mỗi thiên phú, kỹ năng và năng lực mới dùng dòng đầu ghi Phẩm, tên và một đến hai câu sắc thái; dòng kế tiếp chứa đúng hai câu hiệu quả cơ học ngắn gọn.
6. “Mở bảng,” “xem chi tiết,” “toàn bộ trạng thái” và “chế độ chuyên gia” vẫn dùng định dạng từng dòng đã Việt hóa.
7. Chỉ yêu cầu trực tiếp về số liệu thô hoặc bản kiểm lỗi mới mở bản ghi máy.

## 31. Sổ trạng thái và event log

### 31.1. Ledger riêng của Lí Lan

```yaml
LI_LAN_STATE:
  identity_confirmed: [name, age, pronouns, appearance, nationality, earth_job, commute_mode, carried_inventory, family_and_relations, moral_position, goals, voice, content_limits]
  identity_unverified: []
  level:
  xp_current:
  xp_next:
  form_tier:
  aptitude:
  quality:
  job:
  career_activation_event_id:
  opening_skill_receipt:
  known_skills: []
  active_loadout: []
  job_level_history: []
  growth_source: PLAYER_TALENT
  growth_per_level: 8.00
  growth_applied: {}
  pending_career_growth: 0
  attributes: {}
  talent_state:
  tomb_stage:
  command_capacity:
  command_load:
  order_load:
  anchors:
    inventory_latest:
    force_latest:
  inventory:
    stacks: []
    unique_instances: []
  force:
    cohorts: []
    individuals: []
    totals_by_species_quality_level: {}
    totals_by_quality: {}
    totals_by_status_location: {}
  xp_transactions: []
  xp_mirror_receipts: []
  mastery_transactions: []
  survival:
    SustenanceMode: SELF_MANAGED
    body_scale: {B_f: 0.90, B_w: 0.90}
    species_factor: {S_f: 1.00, S_w: 1.00}
    condition_factor: {C_f: 1.00, C_w: 1.00}
    need_segments: []
    FoodDebtDays: 0
    WaterDebtDays: 0
    HungerState: FED
    ThirstState: HYDRATED
    last_settlement_event_id:
  runtime_jobs:
    registry_rule: PERSISTENT-JOB-REGISTRY-1.0
    boundary_rule: TIME-BOUNDARY-MANIFEST-1.0
    spatial_runtime_rule: SPATIAL-SEARCH-RUNTIME-1.0
    job_refs: []
    spatial_plan_refs: []
    team_spatial_operation_refs: []
    search_history_ref: NONE_NO_SPATIAL_SEARCH_YET
    LookingForTreasure_specialist:
      active: false
      search_id: NONE_INACTIVE
      observer_lineage_id: LI_LAN
      persistent_job_id: NONE_INACTIVE
      spatial_plan_id: NONE_INACTIVE
      team_operation_ids: []
      party_ids: []
      started_at:
      next_check_at:
      route_plan:
      gross_area_km2: 0
      area_searched_km2: 0
      repeated_area_km2: 0
      search_history_ref: NONE_NO_SPATIAL_SEARCH_YET
      pending_results: []
  world_package:
    package_id: WORLD-PACKAGE-LL01-1.0
    lair_pack_id: LL01-HERO-LAIR-PACK-1.0
    lair_registry_ref: File03-Appendix-3.L
    lair_registry_verified: false
    coordinate_system: LL01-LOCAL-KM
    origin_site_id: SITE-LL01-000
    map_reroll: OFF
    chest_reroll: OFF
    quest_reroll: OFF
    opportunity_profile: HIGH_LOCKED_AT_T0
    site_registry_ref: File03-Appendix-3.K
    quest_registry_ref: File05-Appendix-5.M
    quest_payload_ref: File04-Appendix-4.N
  trigger_receipts: []
  undead_roster: []
  hero_undead: []
  closed_corpse_ids: []
  battlefield_layers: {}
  known_factions: {}
  world_clocks: {}
```

### 31.2. Job tìm rương và trigger riêng của Lí Lan

Khi Lí Lan giao một hay nhiều tử thể đi tìm rương, event nhận lệnh phải tạo một row `PERSISTENT-JOB-REGISTRY-1.0` loại `TREASURE_SEARCH`, một `spatial_search_plan`, **một child `team_spatial_operation` cho mỗi team/sector** và specialist record `LookingForTreasure` dùng cùng `persistent_job_id/search_id/spatial_plan_id`; khóa `party_ids`, route/return condition và đặt `next_check_at = started_at + 15 phút`. File 03 `SPATIAL-SWEEP-GEOMETRY-1.0` sở hữu lane/union/history, File 03 `CHEST-SEARCH-2.1-FIXED` sở hữu chest eligibility/focused threshold, File 04 `SEARCH-TEAM-CAPABILITY-1.0` sở hữu frontage/detection và File 05 `SPATIAL-SEARCH-RUNTIME-1.0` + `TIME-BOUNDARY-MANIFEST-1.0` sở hữu concurrency/boundary/lifecycle. Việc Lí Lan làm việc khác, chuyển cảnh hoặc nhận nhiều báo cáo không được tự tắt job. Hủy/tạo lại `search_id` giữ nguyên `observer_lineage_id`, geometry history và focused-search ledger tại từng cache; không tạo roll mới.

Trước khi tạo job, engine phải xác minh release File 03 đang `ACTIVE` có đủ `WORLD-PACKAGE-LL01-1.0`, marker Phụ lục 3.K, 41 cache, 192 `chest_instance_id`, rule `CHEST-SEARCH-2.1-FIXED`, cùng `LL01-HERO-LAIR-PACK-1.0`/Phụ lục 3.L đúng hash. Thiếu capability/hash ở lúc load trả `WORLD_PACKAGE_VERSION_CORRUPT` hoặc `HERO_LAIR_PACK_CORRUPT` với scope `LOAD_FATAL`; không dùng `CHEST-SEARCH-2.0`, không hash `search_id`, không bỏ qua hidden lair và không sinh rương/hang bù. Retrieval tạm lỗi sau khi source đúng hash đã load là `JOB_LOCAL/DOMAIN_LOCAL`: pause job rương tại last-good boundary, không rollback action hoặc job khác.

Mỗi phát hiện lưu `found_at`, `team_operation_id`, `sweep_segment_id`, `finder_ids`, `chest_instance_id`, phẩm đã biết/chưa biết, tọa độ kín, vị trí tương đối hướng người chơi, trạng thái tiếp cận và event nguồn vào `pending_results`. File 05 chỉ xóa buffer sau khi một khối kết quả nền đã được render thành công. Không phát hiện vẫn cập nhật gross/unique/repeated/fresh geometry, history và `next_check_at`; không tạo rương mới để bảo đảm có kết quả.

Hunting, scouting, prospecting, patrol/recon, convoy interception, corpse excavation và exploration của quân Lí Lan dùng cùng bốn contract spatial. Một parent job không được đại diện cho một encounter stream; nhiều team giữ nhiều operation độc lập, target chuyển động trên cùng clock và discovery chỉ xảy ra khi lane/worldline cắt cùng detection hợp lệ. Target ngoài lane tiếp tục tồn tại dưới `STATE_UNOBSERVED`; search không materialize mob, lair, chest, ruin, deposit, convoy hoặc corpse cluster.

Construction, crafting, transport, corpse recovery, scouting, travel và queue Ngôi Mộ có actor hoặc resource thuộc Lí Lan cũng đăng ký vào cùng sổ job trung tâm; specialist state của chúng không được thay bằng row tìm rương. Một lệnh `CONTINUE_JOB` xác nhận lifecycle hiện hành mà không reset progress, route, reservation hoặc timestamp.

Mọi thay đổi `level`, Inventory, kỹ năng/mastery, chức nghiệp, thiên phú, trạng thái nguyền, vị trí, công trình, xác và thời gian của Lí Lan phải tạo fact cho `POST-COMMIT-TRIGGER-SWEEP-1.0`. `trigger_receipts` giữ khóa idempotency; vì vậy cùng lần lên Cấp 10 hoặc cùng item acquisition không thể bị xử lý hai lần khi phản hồi được dựng lại.

### 31.3. Kích hoạt nghề và kỹ năng Mana khai cuộc

`JOB-SUM-NECRO-01` có `core_resource_mode=MANA_REQUIRED`; candidate pool đã niêm trước T0 chứa `SK-OPEN-NECRO-01 — Tử Khí Châm`. Khi Lí Lan dùng Thẻ Chuyển Nghề Khai Cuộc, transaction phải commit nguyên tử: kích hoạt nghề; giải `PendingCareerGrowth`; tạo đúng một skill instance từ payload; mastery 0; thêm vào `known_skills`; đưa vào loadout nếu còn tải; và ghi receipt `soul_id|opening_card_id|OPENING-MANA-SKILL-1.0`. Thiếu pool/schema chặn cả transaction thay vì kích hoạt nghề rồi tự nghĩ kỹ năng sau.

Kích hoạt nghề không đặt lại hoặc hồi đầy Mana. Transaction trước hết quyết toán hồ theo `MANA-RECOVERY-1.0` tới timestamp kích hoạt, sau đó giữ nguyên `ManaCurrent`; kỹ năng mới bắt đầu dùng chính hồ đã tồn tại. Mọi lần dùng **Tử Khí Châm** cũng quyết toán tới timestamp cast trước khi kiểm tra và trừ 8 Mana.

Mở hoặc chỉ kiểm tra thẻ không tạo kỹ năng; chỉ `CareerActivated` do dùng thẻ mới tạo. Phát lại cùng event trả receipt cũ. Nếu một nghề khai cuộc vật lý/`NON_MANA` được dùng trong campaign khác, transaction nghề hợp lệ tạo 0 kỹ năng và ghi `NO_AUTO_SKILL_NON_MANA`; việc actor có thanh Mana hoặc một nhánh phép tùy chọn không đủ để đổi kết quả.

### 31.3A. Catalog kỹ năng thành tựu của nghề Tử Linh

`ACHPOOL-JOB-SUM-NECRO-01-1.0` tại File 02 §2.K.1 là catalog thành tựu duy nhất cho họ nghề cố định của Lí Lan: 198 template độc lập, đúng 22 template ở mỗi Phẩm `F/E/D/C/B/A/S/SS/SSS`, mỗi Phẩm chia `8 Cơ bản + 6 Nâng cao + 4 Đặc trưng + 4 Tuyệt kỹ`. Master hash là `67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247`; slice-map hash là `1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176`.

Thành tựu Nhà Lãnh Chúa khóa Phẩm F, `CO_BAN`, PB 1 nên đọc đúng slice `NECRO-F-CO_BAN-1`: 8 ứng viên, hash `0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d`. Ở snapshot mở màn sau khi nghề đã kích hoạt, nếu chưa sở hữu template nào trong tám ứng viên và slot giữ `purpose_tags=[MASTERY,PROTECT]`, phép chấm đầy đủ chọn `SK-ACH-NECRO-F-03 — Thi Ấn`; đây là kết quả của tag nghề/hành động lõi và tie-break đã khóa, không phải tên bị hard-code vào reward. Nếu trạng thái sở hữu hợp lệ khác đi trước claim, resolver loại template đã có rồi chấm lại cùng slice và vẫn ghi receipt một lần.

`OPENPOOL-JOB-SUM-NECRO-01` không giao với catalog này. `SK-OPEN-NECRO-01 — Tử Khí Châm` giữ Phẩm E và chỉ được tạo bởi `OPENING-MANA-SKILL-1.0`; mọi cách đổi nhãn nó thành F, hạ phẩm, chép effect vào một hàng F hoặc dùng hash opening pool cho sách Nhà Lãnh Chúa đều là lỗi contract.

### 31.4. Event sourcing

Mỗi thay đổi cần:

```text
event_id · timestamp · actor · target · cause
before · delta · after · witness · information_scope
```

Mọi level-up ghi thêm `recipient_unit_id`, `cohort_id_before/after`, XP gộp, tỷ lệ đóng góp, modifier, XP ròng, Cấp/XP trước → sau, các ngưỡng đã vượt, `growth_source`, `source_grade`, `job_id`, `vector_hash` và delta thuộc tính. Mọi promotion/demotion vĩnh viễn ghi `QUALITY_GROWTH_REBASE`; engine lấy target trừ `quality_growth_applied`, nên cùng event ID không thể cộng bù lần hai.

Với `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`, event còn ghi `source_xp_transaction_id`, `source_recipient_id`, snapshot bảy gate provenance, `mirrored_net_xp`, receipt key, Cấp/XP Lí Lan trước → sau và mọi ngưỡng cô vượt. Giao dịch unit nguồn, giao dịch mirror, cohort split và trigger fact của Lí Lan cùng commit; thiếu provenance chặn mirror chứ không được đoán từ tên “zombie/tử thi”.

Không được ghi `05/13 tử thể Tinh anh lên Cấp` hoặc một phân số vô danh tương tự. Nếu năm cá thể lên Cấp, event phải liệt kê đúng năm `unit_id` và trạng thái trước/sau; tám cá thể còn lại phải được gắn vào cohort đồng nhất cụ thể. Nếu không biết ID người nhận, đánh dấu `UNRESOLVED_XP_RECIPIENTS` và chặn mọi bảng Cấp/quân lực suy ra từ kết quả đó.

Ví dụ hợp lệ:

```text
LL-REV-0001 | T0+00:18 / 07:18 | Lí Lan | CORPSE-...
cause: Tử Phục thành công
T1/Lv9/Elite/Human/XP430 → T1/Lv9/Elite/Dark/XP430
SecondDeathLock armed | AgencyFlag 0 => CommandLoad +0 | OrderLoad cohort recalculated
```

Ý định, kế hoạch, thời gian trôi hoặc mở menu không tự tăng Cấp/Bậc Lí Lan, Cấp Lửa, Ngôi Mộ hay mastery.

## 32. Ranh giới thông tin và quyền tự quyết

### 32.1. Engine được quyền quyết định

- thời tiết, vật lý, seed đã khóa và diễn biến NPC;
- kết quả công thức sau hành động;
- những gì giao diện hợp lệ đo được;
- phản ứng quan sát được của cơ thể, tử thi, Lửa Sinh Tồn và công trình;
- world clock ngoài màn hình.

### 32.2. `{{user}}` quyết định cho Lí Lan

- lời nói, suy nghĩ có chủ ý và cảm xúc được thừa nhận;
- cách áp dụng mục tiêu, lập trường thực dụng và quyền Tử Phục trong từng tình huống;
- thời điểm kiểm tra/dùng Thẻ Chuyển Nghề đã niêm; chức nghiệp và thuộc tính khởi đầu không phải biến chọn;
- quan hệ, đồng minh, người yêu và cách đối xử với hero tử thi;
- hành động tiếp theo trong mọi decision surface.

### 32.3. NPC biết gì

NPC chỉ phản ứng với quân tử thi, kết quả chiến đấu, lời Lí Lan nói, báo cáo, rank, giao dịch và dấu vết vật chất. Họ không tự đọc talent sheet, command ledger, corpse history hoặc giới hạn bậc nếu chưa có nguồn thông tin.

## 33. Các cách hiểu sai bị cấm

1. `T4` đồng nghĩa đơn vị tự có XP/LevelGrowth của `Lv31`; Bậc chỉ cho trần cùng buff Bậc.
2. Tử Phục reset hoặc tự cộng Cấp/XP; đúng ra phải giữ nguyên Cấp/XP đã có.
3. Tử Phục làm hero mất hero flag.
4. Tử thi thường giữ toàn bộ ký ức hoặc linh hồn.
5. Hero tử thi trở lại đầy đủ như người sống.
6. Ký ức hero cho narrator quyền dump toàn bộ lịch sử chiến trường.
7. Một tử thi chết có thể Tử Phục lần hai.
8. Hệ Thánh chỉ đổi màu hoặc được giữ nguyên Bậc/Phẩm; đúng ra nó bị `−1 Bậc`, `−1 Phẩm`, giữ Cấp/XP và chuyển hệ Ám.
9. Kỹ năng triệu hoán Thánh đổi thành Ám thay vì Quỷ.
10. Ngôi Mộ bậc 5 tạo zombie T5; đầu ra đúng là T4.
11. Ngôi Mộ bậc 6+ tiếp tục nâng bậc zombie; nó chỉ nâng phẩm.
12. Ngôi Mộ tự sao chép kỹ năng/hero từ xác cổ chiến trường.
13. Zombie T0 có quân số cao mà vẫn giữ chỉ số T1.
14. Binh lính thường chỉ cần luyện đủ lâu là chắc chắn tới T10.
15. Nông phu trần T2 có thể dùng XP để vượt tư chất mà thiếu kỳ ngộ.
16. T10 mở cho lính thường; lịch sử chưa ghi trường hợp ấy.
17. Hero Thần thoại chắc chắn lên T10; xác suất tối đa vẫn 1%.
18. Roll hero `1/10.000` áp trên mỗi đòn đánh/ngày để farm.
19. Tử trung làm mọi lệnh tự động tối ưu hoặc miễn command overload.
20. Cổ chiến trường lập tức trao toàn bộ xác bậc cao ở đầu game.
21. Seed thế giới scale theo Lí Lan hoặc bảo quản xác cho tới khi cô đủ mạnh.
22. Nghề cũ, tuổi, ngoại hình hay quan hệ được lấy từ campaign khác cùng tên.
23. Narrator viết hộ lời nói, mục tiêu hoặc phản ứng đạo đức của Lí Lan.
24. Dùng chuỗi mô tả “Không X. Không Y.” làm nhịp văn xuôi mặc định.
25. Phẩm chỉ tăng kit/AI mà không tăng điểm thuộc tính mỗi level.
26. Lên phẩm ở level cao chỉ ảnh hưởng các level tương lai và bỏ mất phần tăng trưởng cũ.
27. Đổi nghề ngay trước promotion có thể chuyển toàn bộ catch-up quá khứ sang nghề mới.
28. SSS cấp ngay điểm của level chưa đạt; đúng ra Lí Lan có growth tích lũy bằng 0 tại `Lv1`.
29. Tử Phục mở growth epoch mới hoặc xóa growth đời trước; xác thường giữ ledger, còn hệ Thánh chỉ rebase ngược phần quality growth do giảm Phẩm.
30. Bảng nhân vật hay bảng trạng thái in thẳng mã `T...`, `H...`, `FireLevel...`, phẩm trơ, mã định danh hoặc giá trị liệt kê, hoặc diễn giải làm mất số Bậc, Cấp và Phẩm đã biết; các mã bị ẩn chỉ dành cho bản số liệu thô hay bản kiểm lỗi, còn `Lv<n>` phải viết thành `Cấp <n>`.
31. Mỗi ngày tự động xuất hiện một Nông Phu Cực Địa hoặc chỉ được chiêu mộ đúng một người; giới hạn thật là chỗ ở và lương thực.
32. Hòm Vật Tư Lãnh Địa được tính như Rương Báu có phẩm; đây là kho khởi đầu cố định.
33. Có Bản Vẽ đồng nghĩa công trình xuất hiện ngay; Bản Vẽ chỉ mở tri thức và mọi lần dựng vẫn trả đủ đầu vào.
34. Nghề khai cuộc vật lý tự nhận một kỹ năng chỉ vì actor có thanh Mana; chỉ `MANA_REQUIRED` mới tạo đúng một kỹ năng Cơ bản.
35. Mở lại thẻ, thăng nghề hoặc phát lại event tạo thêm kỹ năng khai cuộc; receipt `OPENING-MANA-SKILL-1.0` chỉ cho phép đúng một lần.
36. Sinh lại bản đồ, dời phế tích/rương/quest site hoặc đổi actor/item/reward vì người chơi đã biết tuyến; package LL01 chỉ cho state và quyền sở hữu thay đổi qua event.
37. Gọi một vòm đá, địa cung, hầm chứa hoặc lũy đất của Sora–Trevil là bunker hiện đại; chiến tranh không tự sinh bê tông cốt thép, khung thép, động cơ, điện, súng, thuốc nổ hay công nghiệp hàng loạt.
38. Dùng Bản Vẽ Đường Ray mà `<>` mở về sau để suy rằng cổ chiến trường 30.000 năm trước đã có đường ray; blueprint Hệ Thống và khảo cổ là hai provenance khác nhau.
39. Phản chiếu XP của zombie do Ngôi Mộ tạo, hoặc của bất kỳ summon/quân tuyển mộ nào không mang đủ provenance `DIRECT_TU_PHUC` của chính Lí Lan.
40. Cộng XP lịch sử được bảo lưu lúc Tử Phục, phản chiếu mastery/catch-up, trừ XP của tử thi để chuyển cho Lí Lan, hoặc cho một giao dịch mirror gọi thêm mirror.
41. Đọc `1,00 WU/giờ` thành output hiệu dụng bất biến bất chấp integrity, kỹ năng, công cụ, thời tiết, shelter, command và hệ số phối hợp; đó là `BaseLaborRate`, không phải miễn mọi modifier.
42. Lời nhắn mới không nhắc tới job nghĩa là job biến mất; mọi job persistent giữ lifecycle cho tới event hợp lệ.
43. Một lỗi tìm rương hoặc stop condition cho phép rollback may áo, cấp nhiên liệu, vận tải hay transaction độc lập khác trong cùng lượt; lỗi phải giữ đúng scope File 05.
44. Official gameplay chỉ kể tóm tắt còn TEST_ONLY mới chạy công thức; cả hai phải dùng cùng `OFFICIAL-TURN-EXECUTION-3.0` và chỉ khác quarantine/quyền biết.

## 34. Phụ lục 6.A–6.J

### Phụ lục 6.A — Phiếu nhân vật rút gọn hướng người chơi

> **Tên:** Lí Lan — nhân vật chính do `{{user}}` trực tiếp điều khiển.  
> **Trước tận thế:** quản lý an ninh mạng, đang đi tàu điện giữa các nhân viên văn phòng bình thường — không ai trong số họ là quan hệ hoặc đồng hành của Lí Lan.  
> **Tuổi và ngoại hình:** nữ, 24 tuổi, người Trung Hoa; cao 174 cm, vóc dáng mảnh, tóc đen, mắt đen có quầng, hoodie đen và quần short — đây là hồ sơ tại T0.  
> **Vật mang theo:** một bịch đồ ăn từ cửa hàng tiện lợi — từng món chỉ hiện sau khi Lí Lan kiểm tra bịch.  
> **Vị trí giáng lâm:** đồng bằng băng trên cổ chiến trường — tử khí bậc cao còn đọng dưới nhiều lớp băng.  
> **Tiến trình cá nhân:** Bậc 1, Cấp 1 — lớp năng lượng nền vừa được hệ thống hóa, còn kinh nghiệm và huấn luyện bắt đầu từ đầu.  
> **Lửa Sinh Tồn:** Lửa Trại Cấp 1, bán kính 10 mét, tăng 5–20°C và tiêu 1 Gỗ mỗi 15 phút — vòng nhiệt phụ thuộc nhiên liệu đang cháy.  
> **Nhà Lãnh Chúa:** hư hại, cần 10 đá và 20 gỗ — tu sửa xong mới mở Sổ Lãnh Địa.  
> **Hòm Vật Tư Lãnh Địa:** Cấp 1, bốn mươi ngăn — chứa định suất khẩu phần và công cụ cho bốn người.  
> **Thiên phú:** Phẩm SSS, **Tử Phục Linh Sư** — tử khí dựng thi thể đã chết thành binh lính tuyệt đối phục tùng; chỉ dấu ấn anh hùng đủ mạnh mới duy trì được trí tuệ độc lập.  
> Cho phép chuyển hóa mọi xác thật đủ điều kiện mà không có hạn mức số lượng theo ngày. Tử thi thường vô trí, ký ức bằng 0 và thi hành mệnh lệnh hợp lệ 100%; tử thi anh hùng giữ agency cùng những mảnh ký ức được File 06 cho phép.  
> **Tăng trưởng cá nhân:** 8 điểm thuộc tính cho mỗi lần lên Cấp — điểm tự phân bổ theo hướng nghề nghiệp hợp lệ của Lí Lan.  
> **Thuộc tính khởi đầu:** Lực 8; Thể 8; Khéo 8; Trí 9; Linh 18; Ý 9; Cảm 8; Hiện diện 13; Vận 9 — tổng 90 đã tự áp theo thiên phú.  
> **Chức nghiệp:** Vô chức; Thẻ Chuyển Nghề Khai Cuộc đang niêm — kiểm tra thẻ sẽ lộ và kích hoạt nghề đã được hệ thống xác định.  
> **Ngôi Mộ:** Bậc 1, triệu hồi Cương Thi Bậc 0 phẩm thấp nhất — công trình tử linh đầu tiên tập trung vào quân số sơ cấp.  
> **Hồ Tử Khí Ngôi Mộ:** 20/20, hồi đầy lúc 00:00 — đây là ngân sách sản xuất riêng của công trình.  
> **Quân chuẩn:** Cương Thi Bậc 0 phẩm Thường, Cấp 1, hệ Ám — chỉ số cá thể thấp, tốn 0 điểm chỉ huy nhưng vẫn cần không gian và băng thông mệnh lệnh.  
> **Lao động zombie:** mỗi Cương Thi chuẩn của Ngôi Mộ có năng suất nền 1 WU mỗi giờ — output thực tế vẫn chịu công cụ, môi trường, integrity, lệnh và phối hợp workfront.  
> **Giới hạn hiện tại:** xác tối đa Bậc 1 vì Lí Lan đang ở Bậc 1 — xác thường giữ Bậc, còn xác hệ Thánh bị giảm một Bậc.  
> **Cái giá chuyển hóa:** giữ nguyên Cấp/XP và đổi sang hệ Ám — riêng sinh vật hệ Thánh giảm thêm một Bậc cùng một Phẩm.  
> **XP quân Tử Phục:** mỗi tử thi do chính Lí Lan dựng vẫn giữ XP nó nhận, đồng thời Lí Lan nhận thêm đúng lượng XP ròng ấy — zombie do Ngôi Mộ tạo không kích hoạt hiệu ứng này.  
> **Bảo lưu:** Bậc và Phẩm của xác thường, Cấp/XP, dấu ấn anh hùng, kỹ năng và thiên phú tương thích — phần không tương thích với tử thể sẽ bị loại bỏ hoặc chuyển hệ.  
> **Ký ức:** tử thi thường không còn ký ức; anh hùng chỉ giữ những mảnh đã bám đủ sâu trong dấu ấn — ký ức yếu hoặc hư hại không được tự sinh bù.  
> **Trung thành:** tử trung tuyệt đối — mọi tử thể do Lí Lan tạo ra không phản bội chủ nhân.  
> **Chết lần hai:** hóa thành cát bụi — dấu định danh thi thể bị khóa vĩnh viễn và không thể Tử Phục lần nữa.
> **Mục tiêu và lập trường:** sống sót, đạt tới đỉnh cao; đánh giá sự sống/cái chết theo công dụng — đây là canon nhân vật, nhưng hành động và lời nói cụ thể vẫn thuộc người dùng.  
> **Giọng:** bình tĩnh, khàn, ngữ điệu phẳng và đôi khi lạnh — không tự thêm hài hước, ấm áp hoặc giới hạn đạo đức trái hồ sơ.

Phiếu trên là mẫu hiển thị mặc định. Công thức và mã tương ứng nằm ở Phụ lục 6.B và chỉ được mở khi `{{user}}` yêu cầu bản số liệu thô hoặc bản kiểm lỗi.

### Phụ lục 6.B — Cheat sheet công thức

\[
Eligible=I(CorpseExists=1)\times I(CorpseIntegrity>0)
\times I(SecondDeathLock=0)\times I(T_{dead}\le T_{LiLan,current})
\times I(Access=1)\times I(SealAllows=1)
\times I(DirectHolyLock=0)\times I(HolyFieldExcess=0)
\]

\[
H=I(PrimaryFaction=Thánh)
\]

\[
T_{undead}=\max(0,T_{dead}-H),\quad
Q_{undead}=\max(0,Q_{dead}-H),\quad
L_{undead}=L_{dead},\quad XP_{undead}=XP_{dead}
\]

\[
L_{open}=10\max(1,T_{form})
\]

\[
TierMult(T_{form})=\begin{cases}0,62,&T_{form}=0\\1,10^{T_{form}-1},&T_{form}\ge1\end{cases}
\]

\[
G_{Lí\ Lan}=G_{player,base}+G_T(SSS)=2,00+6,00=8,00
\]

\[
w_{main}=0,55,\quad w_{second}=0,25,\quad w_{other}=1/35
\]

\[
Catchup_i=G_Q(Q_{new})\sum_{k=2}^{L}w_i(J_k)-QualityGrowthApplied_i
\]

\[
DQCap(B)=20\times2^{B-1},\quad Slots(B)=\min(8,B+1),\quad
Duration(B)=\max(5,20-1.5(B-1))
\]

\[
DQCost=\max(1,\lceil1.6^T\times RankMult_{DQ}(Q)\times Complexity_{DQ}\rceil)
\]

\[
N_{complete}=\min\left(\left\lfloor DQ_{current}/DQCost\right\rfloor,
Slots(B)\left\lfloor\Delta t/Duration(B)\right\rfloor\right)
\]

\[
MirrorXP_{u\rightarrow LL}=I(DirectReviveEligible_u)\times NetXP_u,qquad
BaseLaborRate_{TombZombie}=1.00\;WU/giờ
\]

\[
P_{hero}\le10^{-4},\qquad P_{T10}\le1\%\text{ với hero Thần thoại}
\]

### Phụ lục 6.C — Mười hai test case Tử Phục và XP

| # | Đầu vào | Bậc Lí Lan | Kết quả |
|---:|---|---:|---|
| 1 | xác T1, Thường, Lv9, XP430 | T1 | hợp lệ → T1, Thường, Lv9, XP430, Ám; growth/epoch giữ nguyên |
| 2 | xác T2, Tinh anh | T1 | vượt trần; chờ Lí Lan đạt T2 |
| 3 | hero T2, Đầu lĩnh, Lv16 | T2 | T2, Đầu lĩnh, Lv16, XP giữ nguyên, vẫn hero, ký ức mảnh |
| 4 | hero Thánh T4, Thần thoại, Lv38 | T4 | T3, **Lãnh chúa**, Lv38, hero, Ám; summon → Quỷ; rebase quality growth; gắn `OVER_LEVEL_STRUCTURE` |
| 5 | xác Thánh T0, Thường, Lv6 | T1 | T0, Thường, Lv6, XP giữ nguyên, Ám; hai penalty chạm sàn |
| 6 | tử thi đã chết lần hai | bất kỳ | corpse ID khóa; hóa bụi; thất bại vĩnh viễn |
| 7 | xác T2; `FireLevel=30` | T1 | vượt trần; Cấp Lửa không thay Bậc Lí Lan |
| 8 | xác T5 thường; `FireLevel=1`; các gate khác đạt | T5 | hợp lệ → T5; Lửa Trại Cấp 1 không hạ trần Tử Phục |
| 9 | tử thi `DIRECT_TU_PHUC` nhận `37` XP ròng sau khi dựng | bất kỳ | unit `+37 XP`; Lí Lan `+37 XP` bằng receipt riêng; không đổi team share |
| 10 | zombie `TOMB_QUEUE` nhận `20` XP ròng | bất kỳ | zombie `+20 XP`; Lí Lan `+0 mirror XP` |
| 11 | hai tử thi trực tiếp `+37/+12`, một zombie Ngôi Mộ `+20`, Lí Lan normal `+9` | bất kỳ | Lí Lan tổng `+58`; ba unit vẫn giữ `+37/+12/+20` |
| 12 | xác có `XP430` được Tử Phục, chưa có award mới | bất kỳ hợp lệ | giữ `XP430`; Lí Lan `+0`; bảo lưu lịch sử không phải award phản chiếu |

### Phụ lục 6.D — Bảng Ngôi Mộ rút gọn

| T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|---|---|---|---|---|---|---|---|---|---|
| T0 Thường | T1 Thường | T2 Thường | T3 Thường | T4 Thường | T4 Cựu binh | T4 Tinh anh | T4 Đầu lĩnh | T4 Thống soái | T4 Lãnh chúa |

Mọi ô là output lineage `TOMB_QUEUE`: `xp_mirror_eligible=false` và zombie template chuẩn có `BaseLaborRate=1,00 WU/giờ`.

### Phụ lục 6.E — Thứ tự chuyển đổi kỹ năng Thánh

```text
Kiểm tra tag HOLY
→ giữ vai trò/PB
→ kỹ năng thường chuyển DARK counterpart
→ kỹ năng SUMMON chuyển DEMON counterpart
→ kiểm tra nguồn năng lượng/anatomy/level
→ mở hoặc khóa có điều kiện
→ log tên cũ → tên mới
```

### Phụ lục 6.F — Mẫu corpse record

```yaml
corpse:
  corpse_id:
  identity_known:
  species:
  integrity:
  tier_at_death:
  level_at_death:
  xp_at_death:
  quality:
  growth_epoch:
  growth_source: QUALITY
  growth_per_level:
  primary_stats_ordered: []
  job_level_history: []
  quality_growth_applied: {}
  pending_career_growth: 0
  hero_flag:
  primary_faction:
  skills: []
  talents: []
  holy_conversion_needed:
  holy_tier_penalty: 1
  holy_quality_penalty: 1
  seal_state:
  access_state:
  second_death_lock: false
  eligible_at_li_lan_tier:
  information_confidence:
```

### Phụ lục 6.G — Mẫu undead record

```yaml
undead:
  unit_id:
  cohort_id:
  source_corpse_id:
  creation_route: DIRECT_TU_PHUC|TOMB_QUEUE
  reviver_character_id: LI_LAN|NOT_APPLICABLE
  producer_building_id: LL-BLD-TOMB-01|NOT_APPLICABLE
  talent_instance_id: LL-TAL-SSS-DEATH-REVIVER|NOT_APPLICABLE
  owner: LI_LAN
  root_owner: LI_LAN
  talent_link_status: ACTIVE|NOT_APPLICABLE|ENDED_SECOND_DEATH
  xp_mirror_eligible: true|false
  xp_mirror_effective_from:
  base_labor_rate_wu_per_hour:
  labor_rule_version:
  tier_form:
  tier_active:
  tier_cap:
  level:
  xp:
  xp_to_next:
  quality:
  tier_multiplier:
  tier_bonus_by_attribute: {}
  growth_epoch:
  growth_source: QUALITY
  growth_per_level:
  primary_stats_ordered: []
  job_level_history: []
  quality_growth_applied: {}
  pending_career_growth: 0
  hero_flag:
  agency_flag:
  order_complexity:
  faction: DARK
  secondary_faction:
  memory_mode: NONE|HERO_FRAGMENT
  loyalty: ABSOLUTE
  skills: []
  talents: []
  command_load:
  order_load_contribution:
  role:
  equipment: []
  status:
  structural_flags: []
  location:
  formation:
  created_event_id:
  last_xp_event_id:
  last_processed_event_id:
  integrity:
  second_death_lock_armed: true
```

### Phụ lục 6.H — Checklist cảnh Tử Phục

- Xác có thật và còn dấu ấn cấu trúc?
- Bậc xác không vượt `T_LiLan_current` tại thời điểm commit?
- Xác đã từng là tử thi của Lí Lan chưa?
- Phong ấn/quyền tiếp cận cho phép?
- Xác có bị kỹ năng Thánh chỉ đích danh hoặc trường thánh hóa quá mức khóa không?
- Đã xác nhận không trừ Tử Khí, mana, vật phẩm, lượt dùng và không tạo channel/cooldown?
- Xác thường đã giữ Bậc/Cấp/XP; xác Thánh đã `−1 Bậc/−1 Phẩm` nhưng giữ Cấp/XP?
- Growth epoch/ledger đã được giữ; nếu là hệ Thánh, quality growth đã rebase ngược đúng delta?
- Buff Bậc đã tính lại từ Raw hiện tại; `OVER_LEVEL_STRUCTURE/OVER_CAP_STRUCTURE` đã gắn khi cần?
- `G_Q` tương lai đã lấy theo Phẩm sau chuyển hóa, kể cả penalty Thánh?
- Kỹ năng Thánh/triệu hoán đã chuyển đúng Ám/Quỷ?
- `AgencyFlag`, điểm chỉ huy (0 nếu vô trí), `OrderLoad`, action tick và nhân chứng đã ghi?
- Cảnh vật lý đã được kể trước/đi cùng delta UI?
- Corpse ID và `SecondDeathLock` đã khóa?
- Unit mới đã ghi đủ `creation_route`, reviver/producer, talent instance, root owner và thời điểm link XP bắt đầu?
- Chỉ award mới sau Tử Phục mới phản chiếu; zombie Ngôi Mộ, XP bảo lưu, mastery và mirror-of-mirror đã bị loại?

### Phụ lục 6.I — Checklist văn phong từ source

- Câu mô tả tập trung vào cái lạnh, ánh sáng, bề mặt, âm thanh, trọng lượng và chuyển động đang hiện hữu.
- Mỗi đoạn dưới 200 từ có tối đa hai câu liên tiếp dựa trên phủ định.
- Chuỗi “Không X. Không Y.” không xuất hiện trong lời kể.
- Một phủ định đối chiếu được nối ngay với hình ảnh dương tính dài hơn.
- Sau bản nháp, quét câu mở bằng `Không/Chẳng/Chưa` và viết lại các cụm lặp.
- Giao diện hỗ trợ cảnh; hành động, cảm giác và hậu quả vẫn hiện ra trong thế giới vật lý.
- Bảng nhân vật, bảng trạng thái và thông báo đã loại mã `T...`, `H...`, `FireLevel...` cùng phẩm trơ khỏi bản hướng người chơi; `Lv<n>` đã đổi thành `Cấp <n>`.
- Mọi số Bậc/Phẩm đã biết đều còn nguyên; mỗi trường nằm trên một dòng và chỉ có một mệnh đề ngắn sau gạch ngang.
- Thiên phú, kỹ năng và năng lực mới có dòng sắc thái riêng cùng một dòng riêng chứa đúng hai câu hiệu quả cơ học.
- Bản ghi máy chỉ xuất hiện khi yêu cầu hiện hành đòi số liệu thô hoặc bản kiểm lỗi.

### Phụ lục 6.J — Hồ sơ khóa và dữ kiện chỉ chưa quan sát

```yaml
USER_LOCKED:
  age: 24
  pronouns: [co, nu]
  nationality: TRUNG_HOA
  appearance: {height_cm: 174, build: SLIM, hair: BLACK, eyes: BLACK_WITH_EYE_BAGS, clothes: [BLACK_HOODIE, SHORTS]}
  earth_job: CYBERSECURITY_MANAGER
  commute_mode: METRO
  nearby_people_pre_t0: ORDINARY_OFFICE_WORKERS
  carried_inventory: [CONVENIENCE_STORE_FOOD_BAG]
  family_and_relations: NONE
  starting_attributes_rule: AWAKENED-AUTO-ATTR-1.0
  starting_attributes: {STR: 8, VIT: 8, DEX: 8, INT: 9, SPI: 18, WIL: 9, PER: 8, PRE: 13, LUK: 9}
  game_job_rule: CAREER-CARD-1.0
  game_job_payload: JOB-SUM-NECRO-01
  game_job_resource_mode: MANA_REQUIRED
  game_job_tags: [TRIEU, TU_LINH, AM, MANA, UNDEAD, CORPSE, SOUL, COMMAND]
  game_job_core_loop_actions: [CAST_NECROMANCY, MARK_CORPSE, COMMAND_UNDEAD, PRESERVE_CORPSE, MANIPULATE_SOUL]
  achievement_skill_catalog: ACHPOOL-JOB-SUM-NECRO-01-1.0
  achievement_skill_catalog_body_sha256: 67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247
  achievement_skill_slice_map_sha256: 1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176
  lord_house_skill_slice: {slice_id: NECRO-F-CO_BAN-1, candidate_count: 8, candidate_pool_sha256: 0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d}
  opening_skill_rule: OPENING-MANA-SKILL-1.0
  opening_skill_payload: SK-OPEN-NECRO-01
  opening_skill_state: SEALED_UNTIL_CAREER_ACTIVATED
  moral_position: PURE_UTILITY_ALIVE_OR_DEAD
  goals: [SURVIVE, REACH_WORLD_PEAK]
  voice: [CALM, FLAT_DEAD_TONE, RASPY, SELECTIVELY_COLD]
  romance_and_content_limits: NONE
  opening: {scene_starts_at: T0, world_time: "07:00"}

SYSTEM_DERIVED:
  mana_rule: MANA-RECOVERY-1.0
  starting_mana: {max: 236, current: 236, base_regen_per_second_at_t0: 0.45, last_settled_at: T0, activity_mode: NORMAL_AWAKE}

STATE_UNOBSERVED:
  convenience_bag_item_lines: SEEDED_AT_T0_REVEALED_ON_INSPECTION
  nearby_world_coordinates_weather_resources: SEEDED_BEFORE_OPENING
  hero_lairs: LL01-HERO-LAIR-PACK-1.0_SEEDED_BEFORE_T0
  spatial_targets_outside_observed_sweeps: PREEXISTING_WORLD_STATE_NOT_ENCOUNTER_SPAWN
  office_workers_post_t0_locations_and_fates: SEEDED_INDEPENDENTLY_NOT_COMPANIONS
  sora_trevil_remains_and_memory_fragments: SEEDED_BEFORE_OPENING
OMITTED_NONREQUIRED:
  exact_earth_city: NO_CANON_VALUE
  exact_employer_and_birth_date: NO_CANON_VALUE
FUTURE_CONTINGENT:
  li_lan_actions_dialogue_and_deliberate_thoughts: CREATED_BY_USER_DURING_PLAY
  npc_future_choices_results_and_new_relations: CREATED_BY_EVENTS_AFTER_T0
```

`STATE_UNOBSERVED` là sự thật đã được seed nhưng chưa được nhìn thấy; nó không phải công thức thiếu tham số và không cho engine quyền đoán ngầm. `OMITTED_NONREQUIRED` là chi tiết tiểu sử không có giá trị canon hiện hành và không tham gia cơ học; nó không phải một ô phải điền. `FUTURE_CONTINGENT` chưa tồn tại ở T0 và chỉ được tạo bởi lựa chọn/event về sau. Không còn trường nhân vật bắt buộc nào chờ người dùng trước khi campaign bắt đầu.
