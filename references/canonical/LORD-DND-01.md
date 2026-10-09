# LORD DND 01 — HỆ THỐNG LÃNH CHÚA, LÃNH ĐỊA VÀ TRÒ CHƠI


> **Phạm vi bản 2.7.0 — 2026-08-27.** Đây là bộ quy tắc nền để viết truyện/campaign Lord DnD **khởi tạo sạch tại T0**. Cốt truyện, nhịp phát triển thế giới và chuỗi đại sự kiện **không để trống**: chúng lấy tác phẩm gốc được đặt trong dấu `<>`, hiện là **Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa**, làm canon khung. Thiết lập riêng của nhân vật chính được khóa trong File 06; roster đối thủ cố định và mô phỏng bảng được khóa trong File 07. Bản 2.7.0 hợp nhất hai nhánh từng cùng ghi `2.6.0`: giữ binding bắt buộc tới `WORLD-PACKAGE-LL01-1.0` và mọi quest/site/hero/item/reward tiền T0 của nhánh 2026-08-26, đồng thời giữ thưởng Bảng Cấp cố định, toàn bộ `CANON-EVENT-LEDGER-4.0`, event/shop/rank reward theo timestamp và vòng đời loot exclusive của nhánh 2026-08-27.
>
> **Thứ tự ưu tiên nguồn thiết kế:** `<>` là nguồn khống chế đối với cốt truyện, tiến trình thế giới, đại sự kiện và cơ chế cốt lõi. Hàng `SOURCE_EXPLICIT/SOURCE_LOCKED` giữ nguyên số, phạm vi và ngữ cảnh được thân chương hiện trực tiếp. Khi đúng trường hợp im lặng, ưu tiên `SOURCE_ANALOGY` từ ít nhất hai neo cùng họ trong chính `<>`; chỉ sau đó truyện lãnh chúa khác và game RTS/4X/city-survival mới là nguồn phụ, không được ghi đè hướng gốc. Chỉ hàng `DESIGN_DEFAULT/CAMPAIGN_ONLY` là mô hình tổng hợp mới và phải mang nhãn/version riêng.

> **Phân loại hằng số:** số có dẫn chiếu trực tiếp `<>` mang `SOURCE_LOCKED`; `CANON-EVENT-LEDGER-4.0` mang `USER_LOCKED/CANON_STORY`, trong đó timestamp lấp khoảng trống ghi rõ `SOURCE_ANALOGY/CAMPAIGN_FIXED`; công thức và khung không có nhãn khác là `DESIGN_DEFAULT`; ví dụ là `EXAMPLE_ONLY`; tọa độ, mật độ, cư dân, tài nguyên, đối thủ và kết quả event cụ thể phải là `CAMPAIGN_SEEDED`/event state. Không lấy một ví dụ hoặc campaign thử làm giá trị khởi tạo.

> **Khóa phát hành:** `document_id=LORD-DND-01`; `release_id=FILE01-2.7.0-MERGE.1`. Resolver phải xác minh bộ ba `document_id + semantic_version + sha256` trong `RELEASE-LINEAGE-LL01-1.0`; yêu cầu trần “File 01 v2.6.0” là `AMBIGUOUS_SEMVER`, không được tự chọn nhánh A hoặc B.


## Mục lục

1. Cách dùng tài liệu
2. Tuyên ngôn thiết kế và từ điển căn bản
3. Kiến trúc ba tầng: thế giới — hệ thống — giao diện
4. Hệ thống lãnh chúa
5. Quyền sở hữu, quyền hạn và kế vị
6. Lửa Sinh Tồn và vòng sinh tồn
7. Cấp lãnh địa, vùng kiểm soát và điều kiện thăng cấp
8. Tài nguyên, sản xuất, kho vận và độ bền công trình
9. Dân số, nhu cầu, lao động, trung thành và di cư
10. Xây dựng, công nghệ và quy hoạch
11. Thịnh vượng, sức chứa và sức mạnh lãnh địa
12. Quân sự, quân đoàn, tiếp tế và chiếm đóng
13. Nhiệm vụ, thành tựu, bảng xếp hạng và phần thưởng
14. Chu kỳ phiên bản và lịch sự kiện
15. Bộ sinh sự kiện và ma sát quy mô
16. Chợ, đấu giá, hợp đồng và tiền tệ hệ thống
17. Kênh liên lạc và kiểm soát thông tin
18. Thiết lập giao diện
19. Nhật ký, thông báo và khả năng truy nguyên
20. Bảo hộ khai cuộc, tử vong, thất bại và phục hồi
21. Chống khai thác lỗi và các bất biến bắt buộc
22. Quy trình vận hành một ngày, tuần, mùa
23. Ví dụ hoàn chỉnh không gắn nhân vật chính/tên riêng
24. Phụ lục 1.A–1.K

---

## 1. Cách dùng tài liệu

Tài liệu này là “hệ điều hành” của thế giới. Nó trả lời bốn câu hỏi: **ai có quyền làm gì; lãnh địa biến đầu vào thành đầu ra ra sao; thế giới đẩy biến cố tới người chơi như thế nào; và người chơi nhìn thấy bao nhiêu thông tin qua giao diện**. Nếu một chi tiết thuộc cấp bậc cá nhân, thiên phú hay kinh nghiệm, xem File 02. Nếu thuộc địa lý, chính trị, NPC và văn hóa, xem File 03. Nếu thuộc chiến đấu, vật phẩm, công trình cụ thể, triệu hoán hay anh hùng, xem File 04. Nếu thuộc Lí Lan, thiên phú `Tử Phục Linh Sư`, Ngôi Mộ hoặc cổ chiến trường khởi đầu, xem File 06.

Quy tắc đọc:

- “Phải” là bất biến cân bằng; chỉ đổi khi sửa phiên bản hệ thống.
- “Nên” là mặc định; chỉ đổi khi canon `<>` hoặc một suy diễn tương thích từ `<>` yêu cầu, và phải ghi rõ hệ quả.
- “Có thể” là module tùy chọn.
- Mọi bonus phải ghi rõ **nguồn, phạm vi, bucket cộng dồn, trần, thời hạn, cách hóa giải và log**.
- Không dùng một con số “chiến lực” để tự động quyết định thắng thua. Điểm tổng hợp chỉ dùng cho ghép sự kiện, cảnh báo và xếp hạng tương đối.

## 2. Tuyên ngôn thiết kế và từ điển căn bản

### 2.1. Bảy mục tiêu

1. **Sinh tồn trước, đế chế sau.** Giai đoạn đầu tập trung nhiệt, nước, thực phẩm, chỗ ở và an ninh; quyền lực chính trị chỉ mở khi cộng đồng có người thật để cai trị.
2. **Lãnh địa là mạng lưới, không phải một thanh cấp.** Lửa Sinh Tồn cấp cao nhưng thiếu thực phẩm, thợ, đường hoặc tính chính danh vẫn không tự tạo thành một xã hội bền vững.
3. **Người dân là tác nhân.** Họ có gia đình, ký ức, kỹ năng, niềm tin và quyền lợi; không sinh ra vô hạn từ menu.
4. **Sức mạnh có chi phí duy trì.** Quân đội, triệu hồi, công trình ma pháp và anh hùng đều tiêu hao lương, vật tư, năng lượng, uy tín hoặc sự chú ý của kẻ thù.
5. **Thông tin là tài nguyên.** Chat hệ thống nhanh nhưng không làm cho bản đồ, ý đồ NPC và tin đồn trở thành chân lý.
6. **Mọi con đường đều có đối trọng.** Tấn công bị kiềm bởi phòng thủ và hậu cần; tích trữ bị kiềm bởi hư hao; ngoại giao bị kiềm bởi cam kết; thiên phú quy tắc bị kiềm bởi điều kiện và trần.
7. **Cốt truyện có gốc, nhân vật chính tạo sai khác qua hành động.** Chuỗi cốt truyện và thế giới đi theo `<>`; hồ sơ khởi đầu của Lí Lan đã khóa tại File 06. Chỉ lựa chọn, lời nói, hành động, quan hệ phát sinh và hệ quả sau `T0` còn do `{{user}}` quyết định trong play.

### 2.2. Thuật ngữ

| Thuật ngữ | Nghĩa vận hành |
|---|---|
| Hệ thống | Lớp quy tắc siêu hình xác thực danh tính, dữ liệu, sự kiện và phần thưởng. Không đồng nghĩa với một vị thần biết mọi thứ. |
| Lãnh chúa | Chủ thể được Lửa Sinh Tồn/hệ thống ghi nhận quyền sở hữu và được phép ban lệnh trong một lãnh địa. Có thể là người chơi hoặc NPC được công nhận. |
| Người chơi | Người từ nhóm “ngoại lai” có giao diện hệ thống. Không mặc nhiên cao quý, bất tử hay giỏi hơn NPC. |
| Dân bản địa | Người sinh ra trong thế giới; có tri thức địa phương và thiết chế xã hội nhưng không nhất thiết có giao diện đầy đủ. |
| Lửa Sinh Tồn | Vật thể trung tâm của lãnh địa trong `<>`: bắt đầu là Lửa Trại Cấp 1, tạo vùng nhiệt, tiêu nhiên liệu và tiến hóa qua sáu hình thái tới Cấp 30. Không phải “lõi năng lượng” trừu tượng và không có Bậc riêng. |
| Ô kiểm soát | Đơn vị không gian nhỏ nhất mà lãnh địa có thể khảo sát, khai thác, tuần tra hoặc đặt công trình. |
| Quyền lực cứng | Quân đội, thành lũy, tài nguyên cưỡng chế. |
| Quyền lực mềm | Chính danh, uy tín, văn hóa, thương mại, tín ngưỡng, tri thức. |
| Tick | Một lần cập nhật mô phỏng. Tick giao diện không nhất thiết bằng tick kinh tế hoặc chiến đấu. |
| Bucket | Nhóm bonus cộng với nhau trước khi nhân với nhóm khác; ngăn chồng nhân vô hạn. |
| Phân Khu | Cụm người chơi dùng cho kênh trò chuyện, bảng hạng và sự kiện; có neo địa lý, không phải máy chủ vô hình tùy tiện. |

## 3. Kiến trúc ba tầng: thế giới — hệ thống — giao diện

### 3.1. Tầng thế giới

Tầng này là hiện thực vật chất: quãng đường phải đi, thức ăn phải vận chuyển, người bị thương cần chữa, mùa vụ cần thời gian, tin đồn có thể sai. Thế giới không dừng chỉ vì người chơi đóng menu. Một quyết định chỉ có hiệu lực khi lệnh được truyền tới người thực thi, trừ các năng lực hệ thống nói rõ là tức thời.

### 3.2. Tầng hệ thống

Hệ thống làm năm việc: xác thực quyền hạn; đo những gì nằm trong phạm vi quan sát hợp lệ; chuẩn hóa một phần tiến trình; điều phối sự kiện quy mô lớn; và trao phần thưởng có nguồn gốc rõ. Hệ thống **không được** tự ý tiết lộ bí mật chưa bị phát hiện, sửa ký ức NPC để tiện cốt truyện, hoặc tạo tài nguyên không có nguồn ngoài ngân sách sự kiện đã công bố.

### 3.3. Tầng giao diện

Giao diện là cửa sổ có thể thiếu dữ liệu. Mỗi trường mang một nhãn độ tin cậy:

| Nhãn | Ý nghĩa |
|---|---|
| Xác thực | Hệ thống trực tiếp đo trong phạm vi quyền. |
| Ước tính | Từ trinh sát, sổ sách hoặc mô hình; hiển thị khoảng sai số. |
| Báo cáo | Do người/NPC gửi; có nguồn và thời điểm. |
| Tin đồn | Chưa kiểm chứng; không dùng tự động trong quyết định AI. |
| Bị che | Người xem không có quyền hoặc chưa khám phá. |

Giao diện có hai lớp tách biệt. **Lớp dữ liệu nội bộ** được phép giữ mã ngắn, biến công thức, dấu định danh và giá trị liệt kê để mô phỏng nhất quán; **lớp hiển thị hướng người chơi** bắt buộc theo từng dòng ở `dnd-campaign-bible-language-standards.md` §11. Mọi `T<n>` đã biết phải hiện thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>`, phẩm trơ thành `Phẩm <phẩm>`, `FireLevel=<n>` thành đúng **tên hình thái + Cấp <n>**, còn mã `H...` được thay bằng tên giai đoạn lãnh địa; số và phẩm đã biết không được diễn giải mất. Chỉ khi `{{user}}` yêu cầu đúng bản số liệu thô hoặc bản kiểm lỗi mới mở mã nội bộ.

### 3.4. Đồng khởi duy nhất tại T0

Toàn bộ người chơi được kích hoạt tại **cùng một thời điểm thế giới T0**. Đây là một đợt khởi đầu duy nhất, không phải dịch vụ mở đăng ký liên tục.

- Không sinh thêm người chơi, tài khoản hoặc “đợt người mới” sau T0; người chết, mất tích hay bỏ cuộc không được hệ thống thay thế.
- Mọi đồng hồ Cấp nhân vật, Cấp Lửa Sinh Tồn, thành tựu tốc độ, bảng xếp hạng và bảo hộ đều tính từ cùng T0. Offline, bất tỉnh hoặc không hành động không làm đồng hồ cá nhân dừng lại.
- Không có nhãn người mới/người cũ, server tân thủ, bảng hạng theo tuổi tài khoản, nhiệm vụ bắt kịp, XP tăng tốc, tài nguyên bù, rút ngắn xây dựng hay chuẩn hóa theo thời gian tham gia.
- Chênh lệch do quyết định, tốc độ, thiên phú, tổ chức và may mắn hợp lệ được giữ nguyên. Hệ thống không kéo người dẫn đầu xuống và không kéo người chậm lên.
- Cư dân bản địa đã có lịch sử riêng trước T0; quy tắc đồng khởi chỉ áp dụng cho tập người chơi được hệ thống giáng lâm/kích hoạt.

## 4. Hệ thống lãnh chúa

### 4.1. Điều kiện trở thành lãnh chúa

Một chủ thể chỉ nhận quyền lãnh chúa khi thỏa cả bốn khóa: có **neo quyền lực**; có **vùng khả thi** không chồng lấn bất hợp pháp; có **tuyên thệ hoặc xác nhận sở hữu**; và có **khả năng chịu trách nhiệm**. Trẻ vị thành niên, người mất năng lực hoặc người bị khống chế có thể là chủ quyền danh nghĩa nhưng cần hội đồng nhiếp chính.

### 4.2. Chín chỉ số lãnh chúa

| Chỉ số | Công dụng | Không được thay thế bằng |
|---|---|---|
| Quyền uy (AUT) | Giới hạn mệnh lệnh, áp lực tinh thần, số tầng ủy quyền. | Lòng trung thành tự động. |
| Chỉ huy (CMD) | Quy mô đơn vị kiểm soát hiệu quả, tốc độ truyền lệnh. | Kỹ năng chiến đấu cá nhân. |
| Quản trị (GOV) | Hiệu suất thuế, hồ sơ, phân bổ lao động, giảm thất thoát. | Tính chính danh. |
| Hậu cần (LOG) | Độ dài tuyến tiếp tế, dự báo tiêu hao, sức chứa đoàn vận. | Tài nguyên miễn phí. |
| Ngoại giao (DIP) | Chất lượng đàm phán, đọc lợi ích, duy trì cam kết. | Điều khiển tâm trí. |
| Nhận thức (PER-L) | Phát hiện rủi ro lãnh địa, đọc báo cáo và sai lệch. | Toàn tri. |
| Chính danh (LEG) | Mức cộng đồng chấp nhận quyền cai trị. | Sợ hãi hoặc quân đội. |
| Uy tín (REP) | Kỳ vọng bên ngoài dựa trên lịch sử hành động. | Danh tiếng tích cực tuyệt đối. |
| Vận thế (FOR) | Khả năng tiếp cận cơ hội hiếm trong giới hạn seed. | Sửa kết quả sau khi đã biết. |

Chỉ số lãnh chúa có nguồn từ thuộc tính cá nhân, chức nghiệp, chức vụ, thiết chế và tình trạng lãnh địa. Không cho phép một thiên phú nhân tất cả chín chỉ số bằng cùng một hệ số.

`LEG` trong mọi công thức là **Chính danh hiện hành** của lãnh địa theo §9.3, không phải một con số được nhập tay từ PRE, AUT, sợ hãi hoặc quân số. Khi chưa có cư dân hữu trí nào chịu sự cai trị, state là `LEG=NOT_APPLICABLE`. Riêng trong công thức cộng đóng góp như AP/HC, dùng biến đã định nghĩa `LEG_effective=0`; ngưỡng, chi phí hoặc phép so sánh trực tiếp với Chính danh vẫn bị chặn. Đây là zero-case công bố của contract, không phải silent fallback.

### 4.3. Điểm quyền hạn

Ngân sách quyền hạn hữu hiệu:

\[
AP = \left\lfloor\left(10 + 1.4\,AUT + 0.9\,GOV + 0.6\,LEG_{effective}\right) \times M_{institution}\right\rfloor
\]

Mỗi quyền thường trực tiêu AP: xem toàn bộ sổ kho, ban lệnh tuyển quân, dùng kho báu, ký hiệp ước, bổ nhiệm, thu thuế, điều khiển Lửa Sinh Tồn. Cấp Lửa không nhân AP; quyền hành đến từ cá nhân và thiết chế. Vượt AP không cấm mọi hành động; thay vào đó gây chậm phê duyệt, lệnh mâu thuẫn, tăng tham nhũng và rủi ro tiếm quyền.

### 4.4. Vai trò chuẩn

Chủ lãnh địa → đồng lãnh chúa → nhiếp chính → hội đồng → tổng quản → trưởng bộ → chỉ huy → quản đốc → dân cư → khách → tù binh. Một người có thể giữ nhiều chức nhưng mỗi chức phải có phạm vi, thời hạn, quyền thay thế và người giám sát.

## 5. Quyền sở hữu, quyền hạn và kế vị

### 5.1. Bốn lớp quyền

1. **Chủ quyền:** quyết định chiến tranh, nhượng đất, kế vị, phá Lửa Sinh Tồn.
2. **Quản trị:** ngân sách, thuế, luật, bổ nhiệm, xây dựng.
3. **Vận hành:** kho, xưởng, ca làm, tuần tra, tuyển mộ.
4. **Sử dụng:** vào khu vực, dùng dịch vụ, nhận khẩu phần.

### 5.2. Ma trận quyền mặc định

| Hành động | Chủ | Nhiếp chính | Tổng quản | Chỉ huy | Quản đốc | Dân |
|---|---:|---:|---:|---:|---:|---:|
| Đổi người kế vị | Có | Không | Không | Không | Không | Không |
| Tuyên chiến/đầu hàng | Có | Có điều kiện khẩn | Không | Không | Không | Không |
| Ký chi ngân sách lớn | Có | Có | Có theo hạn mức | Không | Không | Không |
| Điều quân chiến dịch | Có | Có | Không | Có | Không | Không |
| Xuất kho chiến lược | Có | Có | Có | Có theo phiếu | Có theo ca | Không |
| Xây/sửa công trình | Có | Có | Có | Công trình quân sự | Có theo bản vẽ | Theo nhiệm vụ |
| Xem bí mật cấp đỏ | Có | Có nếu được cấp | Không mặc định | Theo chiến dịch | Không | Không |

### 5.3. Kế vị

Kế vị có bốn mô hình: huyết thống, chỉ định, hội đồng bầu, thử thách hệ thống. Mỗi lãnh địa chọn một mô hình chính và một cơ chế khẩn cấp. Khi chủ lãnh địa mất tích:

- 0–24 giờ: chế độ liên tục, đóng các quyền phá hủy và chuyển kho báu.
- 24–72 giờ: nhiếp chính tạm, hội đồng xác nhận quân lệnh và khẩu phần.
- Sau ngưỡng: kích hoạt kế vị; các phe có thể tranh chấp nhưng Lửa Sinh Tồn không tự chọn “người mạnh nhất”.

## 6. Lửa Sinh Tồn và vòng sinh tồn

### 6.1. Danh tính và hai trục tuyệt đối không nhập làm một

Trung tâm lãnh địa của `<>` là một **ngọn lửa có Cấp**, không phải một hạch năng lượng có Bậc. State nội bộ dùng đúng hai biến độc lập:

- `H∈H0..H12`: giai đoạn phát triển xã hội–quản trị của lãnh địa.
- `FireLevel∈1..30`: Cấp của **Lửa Sinh Tồn**, quyết định hình thái, vùng nhiệt, nhiên liệu và những mở khóa được nguồn xác nhận.

T0 là `H0` và `FireLevel=1`, hiển thị **Điểm Neo · Lửa Trại Cấp 1**. Không tồn tại `T_core`; Cấp Lửa không phải Bậc cá nhân, không tự nâng `H`, không nhân AP và không đặt trần cho thiên phú của Lí Lan. File 06 dùng `T_LiLan` để giới hạn Tử Phục: `T_dead≤T_LiLan_current`.

Chuỗi hình thái `SOURCE_LOCKED`:

| Khoảng Cấp | Hình thái chuẩn | Ghi chú |
|---:|---|---|
| 1–5 | Lửa Trại | lửa sinh tồn trực tiếp |
| 6–10 | Đại Lửa Trại | vẫn là lửa; từ sau Cấp 5, mỗi lần nâng tăng thêm 100 m phạm vi sưởi theo lời nhân vật nguồn |
| 11–15 | Lò Nung | bước biến đổi chất đầu tiên |
| 16–20 | Đại Lò Nung | mở nhiên liệu ma năng theo hồ sơ Cấp 16 |
| 21–25 | Tháp Năng Lượng | tên hình thái chuẩn của registry; “Trạm Năng Lượng” được giữ làm alias nguồn |
| 26–30 | Siêu Trạm Năng Lượng | chuỗi nguồn đã xác nhận tới Cấp 30 |

`FireLevel>30` bị chặn với `FIRE_LEVEL_CAP_REACHED`; Cấp 30 là trần ruleset nguồn-khóa, không tạo hình thái Cấp 31, công thức tăng vô hạn hay “Bậc Hạch” thay thế.

### 6.2. Vòng sinh tồn tối thiểu

**Nhiệt → nước/thực phẩm/chỗ ở → sức khỏe lao động → thu thập → xây dựng → phòng thủ → thăm dò → nguồn mới.** Ở Cấp 1–10, Lửa Sinh Tồn chỉ được mặc định làm những gì nguồn cho biết: đốt nhiên liệu, tạo nhiệt, xác định vùng đất tan băng có thể xây/trồng và mở nội dung gắn với Cấp Lửa. Nó không phát điện hoặc cấp “năng lượng chung” cho công trình. Chỉ hình thái về sau được dùng nhiên liệu/hiệu ứng năng lượng đã hiện trong nguồn; một công trình ma pháp vẫn tự khai báo vật liệu và đầu vào vận hành của chính nó.

### 6.3. Hoạt động, nhiên liệu và độ bền

```text
FireActive = 1 khi CurrentDurability > 0, không có trạng thái EXTINGUISHED,
             và FuelLedger đủ trả toàn bộ segment tới boundary kế tiếp;
FireActive = 0 trong các trường hợp còn lại.
EffectiveHeatRadius = SourceHeatRadius(FireLevel) × FireActive.
```

- Nhiên liệu là **đầu vào vận hành**, không phải bảo trì. Mỗi `TimeAdvance` tự trừ đúng rate của Cấp Lửa và loại nhiên liệu đang chọn; thiếu nhiên liệu thì cắt segment tại thời điểm cạn, ghi `SurvivalFireExtinguished` và quyết toán nhiệt lại.
- Hết nhiên liệu không trừ độ bền, không sinh maintenance debt và không tạo repair job. Châm lại lửa chỉ cần nhiên liệu cùng một hành động hợp lệ; không dựng lại công trình.
- `CurrentDurability` chỉ đổi vì một `AttackDamage` có ledger hoặc một `RepairAfterAttack` tương ứng. Hư hại một phần không tự bịa hệ số giảm bán kính; Lửa giữ thông số nguồn cho tới khi một effect tấn công nói rõ khác đi hoặc độ bền bằng 0.
- Không dùng `D_corruption`, `M_environment`, kho điện hay “độ ổn định hạch” để âm thầm làm hao Lửa. Chỉ điều kiện thời tiết bên ngoài tác động lên nhiệt độ thực tế/ColdLoad theo File 03.

Điểm đóng góp của Lửa vào An ninh là `S_fire=100×CurrentDurability/MaxDurability` khi `FireActive=1`, ngược lại bằng 0. Đây là đánh giá khả năng giữ vùng sống, không phải thanh độ bền thứ hai.

Nâng Cấp Lửa gọi duy nhất `SURVIVAL-FIRE-PROGRESSION-2.0` ở Phụ lục 1.I. Mỗi hàng là contract cố định `SOURCE_EXPLICIT` hoặc `SOURCE_ANALOGY`; transaction chỉ commit khi reserve đủ recipe của **đúng cạnh hiện tại**. Không có phí năng lượng, mỏ, WorkUnits, Readiness, Chính danh, An ninh hoặc prerequisite xã hội ngầm. Thiếu hàng, thiếu profile đích hoặc sai hash/version là `REGISTRY_VERSION_CORRUPT`, không phải quyền cho narrator nội suy tại runtime.

### 6.4. Cụm khởi đầu của một lãnh địa

Ngay khi đồng khởi, vùng nhiệt khởi đầu đặt bốn vật thể hữu hình trong tầm quan sát của người chơi. Mỗi vật thể phải được nhìn, chạm hoặc mở trong cảnh trước khi giao diện ghi nhận kết quả của hành động.

| Thành phần | Trạng thái đầu | Công dụng đã biết |
|---|---|---|
| Lửa Sinh Tồn | Lửa Trại Cấp 1; đang cháy nếu còn nhiên liệu | bán kính 10 m; tăng 5–20°C; tiêu 1 Gỗ/15 phút |
| Nhà Lãnh Chúa Hư Hại | có thể tu sửa | che rét; sau khi hoàn tất mới mở Sổ Lãnh Địa và danh mục công trình nền |
| Hòm Vật Tư Lãnh Địa | Cấp 1, bốn mươi ngăn | giữ bộ khẩu phần và công cụ khởi đầu |
| Công trình binh chủng riêng | tùy thiên phú và hồ sơ nhân vật | với Lí Lan là Ngôi Mộ Bậc 1 theo File 06 |

Nhà Lãnh Chúa Hư Hại cần **10 đá và 20 gỗ** để tu sửa. Mốc dẫn chiếu của nguyên tác là **17 phút** với một người dùng búa đá trong điều kiện khai cuộc; thời gian thật vẫn chịu sức khỏe, công cụ, địa hình và số người tham gia theo §9.4. Trước khi nhà hoàn tất, người chơi tự thu nhặt và thi công; danh mục công trình khác vẫn đóng.

Sau khi tu sửa hoàn tất, Sổ Kiến Trúc mở **một danh mục nhiều công trình Cấp 1**, không phải chỉ Nhà Nông Phu Cực Địa. Các mục được nguồn cho thấy trực tiếp ở khai cuộc là:

| Mục dựng sẵn Cấp 1 | Dữ kiện được phép dùng ngay |
|---|---|
| Lò Sưởi Đơn Giản | tăng nhiệt trong nhà 15–20°C; vận hành 1 Gỗ/20 phút; xây 6 Đá |
| Bếp Đơn Giản | nấu/hấp; xây 8 Đá + 4 Gỗ |
| Xưởng Gỗ | xử lý gỗ tròn; 30 m²; xây 30 Đá + 50 Gỗ |
| Tiệm May | may đồ chống rét/giáp nhẹ; 30 m²; xây 40 Đá + 60 Gỗ |
| Xưởng Chế Biến Quặng | xử lý than và sắt; 50 m²; xây 80 Đá + 150 Gỗ |
| Lò Rèn | rèn vũ khí/công cụ; 30 m²; xây 100 Đá + 200 Gỗ + 20 Sắt |
| Nhà Nông Phu Cực Địa | 12 m², 4 chỗ; xây 10 Đá + 30 Gỗ |
| Phòng Y Tế; Nơi Trú Nhỏ; Tường Rào; Cổng | tên nguồn-khóa; recipe, thuộc tính và tuyến nâng cố định lấy `OPENING-FIXED-BUILDINGS-2.0` ở File 04 Phụ lục 4.M |

Các mục trên là **mẫu dựng sẵn của hệ thống** sau khi mở Sổ Kiến Trúc. Chúng không tự biến thành vật phẩm `Bản Vẽ` trong Túi, không cần một lần rơi Bản Vẽ để chứng minh rằng mục đã mở, và không cho phép narrator lược cả danh mục thành một mình Nhà Nông Phu.

Hòm Vật Tư Lãnh Địa chứa **20 bánh mì, 1 nồi sắt, 4 rìu đá, 4 búa đá, 1 trượng gỗ và 1 khiên tròn gỗ**. Đây là định suất bốn người của đợt đồng khởi, không giảm theo số người thực sự xuất hiện cạnh Lửa. Hòm này là kho khởi đầu, không phải Rương Báu và không mang phẩm rương.

## 7. Cấp lãnh địa, vùng kiểm soát và điều kiện thăng cấp

### 7.1. Mười ba cấp khung

| Cấp | Danh xưng chức năng | Quy mô xã hội điển hình | Mở khóa trọng tâm |
|---:|---|---|---|
| H0 | Điểm neo | Nhóm sống sót | Nhiệt, kho cá nhân, nhiệm vụ hướng dẫn |
| H1 | Trại | Vài hộ | Nhà tạm, bàn chế tạo, vòng bảo hộ |
| H2 | Tiền đồn | Nhóm nghề | Tháp canh, kho chung, tổ đội |
| H3 | Xóm | Cộng đồng nhỏ | Hội đồng, ruộng, phòng khám |
| H4 | Làng | Nhiều ngành nghề | Chợ, trường nghề, dân quân |
| H5 | Thị trấn | Thiết chế ổn định | Thuế, bang hội, tường thành |
| H6 | Thành | Khu dân cư phức hợp | Quận, quân chính quy, ngoại giao |
| H7 | Đại thành | Trung tâm vùng | Đại học/xưởng lớn, thương hội liên vùng |
| H8 | Thủ phủ | Nhiều thành phụ thuộc | Tỉnh, đường chiến lược, luật vùng |
| H9 | Lĩnh quốc | Nhiều vùng | Chư hầu, ngân khố, chiến tranh quy mô lớn |
| H10 | Vương lĩnh | Quốc gia | Luật quốc gia, tiền tệ, đại công trình |
| H11 | Đế vực | Đa quốc gia | Liên lục địa, quân đoàn chiến lược |
| H12 | Thế giới neo | Văn minh | Quy tắc thế giới có điều kiện, cổng liên giới |

Danh xưng có thể đổi theo văn hóa; mã H0–H12 không đổi.

### 7.2. Ba lớp không gian

`TERRITORY-SPACE-1.1` cấm dùng Cấp xã hội `H` để tự sinh bán kính:

1. **Vùng nhiệt:** khi Lửa hoạt động, `A_heat=π×SourceHeatRadius(FireLevel)^2`; khi tắt, bán kính nhiệt hiệu dụng bằng 0. Đây là vòng nhiệt thật, không nhân địa hình hay Cấp `H`.
2. **Đất tan băng khả dụng:** giao của vùng nhiệt với những polygon có nền đất thật sự đặt công trình/trồng trọt được. Diện tích được tính từ bản đồ vật lý; rừng, vách, hồ hoặc vật cản bị trừ theo geometry, không theo một hệ số đoán mò.
3. **Đất claim/vùng ảnh hưởng:** tập ô có event chiếm hữu, khảo sát, hiệp ước hoặc tuần tra hợp lệ. Nó có thể vượt vòng nhiệt nhưng không mặc nhiên ấm, xây được hoặc an toàn.

Cấp Lửa quyết định vùng nhiệt theo `<>`; Cấp `H` chỉ mô tả xã hội. Nâng bất kỳ trục nào cũng không tự nuốt làng NPC, xóa chủ quyền, tạo đường hoặc biến đất chưa khảo sát thành đất xây dựng. Vòng 3 km giảm quái ở §20.1 là quy tắc seed encounter, không phải một trong ba lớp trên.

### 7.3. Giai đoạn lãnh địa là kết quả, không phải món hàng

`H` được materialize từ bằng chứng hiện có về **dân số thường trú, hạ tầng đã xây, dịch vụ đang chạy, thiết chế, Chính danh và An ninh**. Nó không có recipe tài nguyên, điểm RP, “lõi hiếm”, catalyst, WorkUnits hay nút mua cấp. Gỗ/đá/sắt đã nằm trong chính các công trình và tuyến hậu cần tạo nên bằng chứng ấy; thu thêm một khoản phí tổng hợp sẽ tính tài nguyên hai lần.

Engine kiểm các ngưỡng `TERRITORY-STAGE-CHECK-1.1` ở Phụ lục 1.I sau mỗi event làm đổi bằng chứng. Đạt ngưỡng tạo `TerritoryStageMaterialized`; mất tạm nhiên liệu hoặc một KPI không tự hạ Cấp lịch sử, nhưng có thể tạo trạng thái `STAGE_AT_RISK` và debuff thật. Cấp `H` không đổi Cấp Lửa, Nhà Lãnh Chúa hoặc Bậc Lí Lan.

Thời gian thi công chỉ áp cho **transaction công trình cụ thể** có Bản Vẽ và `WorkUnits` riêng:

\[
T=\frac{WorkUnits}{\sum_j Workers_j\times Coordination_j\times Health_j\times Skill_j\times Tool_j\times Morale_j}\times M_{weather}\times M_{supply}
\]

Các hệ số worker/coordination/health/skill/tool/morale/weather/supply ở §9.4 và File 04; chúng không được tái dùng để bịa thời gian nâng Lửa.

### 7.4. Bốn trục nâng cấp không được nhập làm một

| Trục | Thực thể | Điều nó thay đổi | Điều nó không tự thay đổi |
|---|---|---|---|
| Cấp lãnh địa `H` | quyền kiểm soát/xã hội của toàn lãnh địa | danh xưng quy mô, thiết chế và gates xã hội | không tự nâng Cấp Lửa, Nhà Lãnh Chúa hay mọi công trình |
| Cấp Lửa `FireLevel` | một Lửa Sinh Tồn trung tâm | hình thái, vùng nhiệt, nhiên liệu và mở khóa có nguồn | không đổi Bậc Lí Lan, không đặt trần Tử Phục, không tự hoàn thành điều kiện xã hội |
| Cấp Nhà Lãnh Chúa | một `building_instance_id` trung tâm | Sổ Lãnh Địa, danh mục/đường công trình và prerequisite được nguồn ghi | không đồng nghĩa `H` hay `FireLevel` bằng cùng con số |
| Cấp công trình riêng | từng nhà dân, kho, xưởng, Ngôi Mộ... | sức chứa, output, slot và đường nâng của chính instance | không nâng những công trình khác cùng loại |

Ngoài bốn trục trên, `T_LiLan` là Bậc chiến đấu cá nhân và thuộc File 02/06. Mọi câu “nâng Lửa/nhà/công trình” phải xác định đúng trục và đúng instance trước khi tra điều kiện. Nếu người dùng nói chưa đủ rõ nhưng chỉ có một mục tiêu hợp lý trong cảnh, engine nêu cách hiểu; nếu có từ hai mục tiêu hợp lý làm đổi chi phí/kết quả, hỏi tại decision surface và chưa trừ tài nguyên.

### 7.5. Thẻ tiến trình lãnh địa hoặc Lửa

```yaml
territory_or_fire_progression:
  transaction_id:
  axis: TERRITORY_STAGE|SURVIVAL_FIRE_LEVEL
  current:
  target:
  source_status: SOURCE_EXPLICIT|SOURCE_ANALOGY|USER_LOCKED
  source_ref:
  rule_version:
  prerequisite_graph: []
  materials_required: {}
  materials_available: {}
  materials_reserved: {}
  population_required:
  population_current:
  building_breadth_required: []
  building_breadth_current: []
  vitals_rule_version: TERRITORY-VITALS-1.0
  vitals_through_event_id:
  legitimacy_required:
  legitimacy_current:
  security_required:
  security_current:
  security_breakdown: {military_readiness, survival_fire_security, territory_control}
  fire_state: {form, active, current_durability, max_durability, fuel_selected, fuel_remaining}
  source_duration:
  blockers: []
  exact_result_if_completed: {}
```

`SOURCE_EXPLICIT`/`SOURCE_LOCKED`/`USER_LOCKED` thắng mọi thiết kế bổ sung. Một dữ kiện thế giới chưa quan sát dùng `STATE_UNOBSERVED`; chi tiết nguồn im lặng nhưng đã được loại suy và freeze dùng `SOURCE_ANALOGY`. Registry không có hàng hoặc không khớp version/hash trả `REGISTRY_VERSION_CORRUPT`; không lấy giá từ campaign thử, truyện khác, cấp gần nhất hay tự sinh công thức tăng trưởng trong lúc kể.

Các trường chỉ áp cho đúng trục. `TERRITORY_STAGE` đọc ledger xã hội và mọi vật liệu là `NOT_APPLICABLE`. `SURVIVAL_FIRE_LEVEL` đọc duy nhất Cấp hiện tại, đúng hàng nguồn, recipe, tình trạng chưa bị phá hủy và action/duration nếu nguồn thật sự quy định; population/breadth/legitimacy/security, WorkUnits, mỏ, kho năng lượng và `Readiness` đều `NOT_APPLICABLE`.

### 7.6. Thẻ nâng Nhà Lãnh Chúa, nhà dân và kiến trúc

Mỗi công trình dùng schema File 04 §14.7, một `building_instance_id` và đúng **một** trong hai lớp tri thức:

- mẫu dựng sẵn: `built_in_registry_id + registry_hash`; không cần vật phẩm Bản Vẽ;
- mẫu học được: receipt `BlueprintMaterialized + blueprint_contract_hash` của `BLUEPRINT-CONTRACT-3.0`.

Hai lớp là XOR. Một transaction có cả hai hoặc không có lớp nào đều bị chặn. Sau đó engine mới kiểm cấp hiện tại, prerequisite được contract ghi, footprint, vật liệu đã reserve, thợ, công cụ, thời tiết, thời gian dừng và profile đích. `production_inputs` không bao giờ bị trộn vào chi phí xây/nâng.

Bốn registry cố định là nguồn duy nhất cho các công trình bắt buộc:

| Registry | Phạm vi | Owner |
|---|---:|---|
| `SURVIVAL-FIRE-PROGRESSION-2.0` | Lửa Sinh Tồn Cấp 1–30 | Phụ lục 1.I |
| `LORD-HOUSE-UPGRADE-PATH-2.0` | Nhà Lãnh Chúa Cấp 1–30 | Phụ lục 1.J |
| `POLAR-FARMHOUSE-PROGRESSION-2.0` | Nhà Nông Phu Cực Địa Cấp 1–10 | Phụ lục 1.K |
| `OPENING-FIXED-BUILDINGS-2.0` | 10 loại còn lại trong Sổ Kiến Trúc khai cuộc | File 04 Phụ lục 4.M |

```yaml
building_upgrade_edge:
  building_instance_id:
  knowledge_class: BUILT_IN_REGISTRY|LEARNED_BLUEPRINT
  built_in_registry_id:
  built_in_registry_hash:
  blueprint_materialized_receipt:
  blueprint_contract_hash:
  current_level:
  target_level: current_level + 1
  current_profile: {}
  target_profile: {}
  physical_and_functional_delta: []
  materials_required: {}
  base_work_units:
  maximum_workers:
  blockers: []
  result_if_completed: {}
  knowledge_scope: CURRENT_EDGE_ONLY
  future_edges_excluded: true
```

`physical_and_functional_delta` là bắt buộc: phải nói rõ cạnh ấy tăng bán kính/nhiệt/thời lượng nhiên liệu, đổi sang than/tinh thể, tăng diện tích/số tầng/chỗ ở, thêm giường/trạm sản xuất, tăng độ bền/giáp hay mở cơ chế nào. Chỉ nói “chỉ số tốt hơn” hoặc chỉ đưa recipe là thẻ không hợp lệ.

Các neo nguồn trực tiếp vẫn được giữ nguyên trong registry: sửa Nhà Lãnh Chúa Hư Hại `10 Đá + 20 Gỗ`, `17/60 WU`; dựng Nhà Nông Phu Cấp 1 `10 Đá + 30 Gỗ`, `0,75 WU`; Nhà Nông Phu `1→2` là `50 Gỗ + 30 Đá`, `1,20 WU`; Nhà Lãnh Chúa `1→2` và `2→3` lần lượt dùng contract loại suy đã freeze. Mọi cạnh còn lại cũng đã được materialize trước lượt chơi; narrator không được backfill recipe hoặc profile sau khi biết nhân vật có gì.

Khi người chơi ở Cấp `L` hỏi điều kiện nâng, payload chỉ chiếu `L→L+1`, profile hiện tại, profile đích, delta, vật liệu/điều kiện, lượng đang có, thời gian và blocker. Registry nội bộ giữ toàn tuyến nhưng “xem tất cả” không tiết lộ cạnh tương lai chưa mở/biết. Một Bản Vẽ đã học chỉ tạo tri thức; mỗi instance vẫn cần transaction riêng. Sửa contract phải tăng version/hash và ghi event tại timestamp hiện hành, không tua ngày, xóa cảnh hay phát lại phần thưởng.

## 8. Tài nguyên, sản xuất, kho vận và độ bền công trình

### 8.1. Sáu tầng tài nguyên

| Tầng | Ví dụ chức năng | Rủi ro |
|---|---|---|
| R0 Tự nhiên | Gỗ đứng, mạch quặng, nước, thú | Cạn kiệt, thời tiết, chủ quyền |
| R1 Thô | Gỗ tròn, quặng, da, lương thực thô | Nặng, dễ hỏng |
| R2 Sơ chế | Ván, thỏi, da thuộc, bột | Cần năng lượng và xưởng |
| R3 Linh kiện | Bánh răng, dây cung, rune nền | Là input chế tạo vật phẩm/máy khi recipe sản xuất yêu cầu; không được tách thành dòng vật liệu xây dựng kiểu đinh, bánh xe, ống khói |
| R4 Thành phẩm | Vũ khí, máy, thuốc | Hao mòn theo luật vật phẩm tương ứng; không tự biến thành “bộ phận công trình” trong recipe xây |
| R5 Chiến lược | vật liệu đại mốc có recipe nguồn, di vật | Khan hiếm, gây xung đột |

### 8.2. Công thức sản xuất

\[
Output = BaseRecipe\times Labor\times Tool\times Skill\times Facility\times InputQuality\times (1-Waste)
\]

Các hệ số thuộc bucket riêng; tổng bonus cùng bucket đi qua soft-cap. Chất lượng đầu ra:

\[
Q_{out}=0.35Q_{input}+0.30Skill+0.20Facility+0.15Process-Defects
\]

### 8.3. Kho và hư hao

Tồn kho sau một ngày:

\[
Loss=\min(Stock_t+In,Stock_t(d_{base}M_{storage}M_{climate})+Theft)
\quad;\quad Stock_{t+1}=\max(0,Stock_t+In-Out-Loss)
\]

Kho phải có sức chứa theo khối lượng, thể tích, điều kiện nhiệt, nguy hiểm và quyền truy cập. “Túi hệ thống” cá nhân không được thay thế toàn bộ ngành kho vận; vật lớn, sinh vật sống và hàng chiến lược cần container hoặc cơ sở phù hợp.

### 8.4. Tuyến vận tải

Năng lực tuyến bằng giá trị thấp nhất của đường, phương tiện, nhân lực, hộ tống và nút bốc dỡ. Một tuyến không thể chuyển nhiều hơn cổ chai. Thời gian giao = quãng đường/tốc độ thực + chờ bốc dỡ + kiểm tra biên giới + rủi ro thời tiết.

### 8.5. Độ bền công trình — chỉ giảm vì bị tấn công

Mỗi công trình có `CurrentDurability/MaxDurability`, armor và trạng thái phá hủy. Sau khi nghiệm thu, không có maintenance/day, phí bảo dưỡng, hao mòn thời gian, mục nát thụ động, hỏng vì thiếu phụ tùng hoặc mất HP vì công trình không được “chăm sóc”. Chỉ event `BUILDING_ATTACK_DAMAGE` có `attacker_id`, timestamp, loại sát thương, lượng trước/sau armor và transaction ID mới được giảm độ bền.

Thiếu nhiên liệu, mana, nguyên liệu sản xuất hoặc nhân lực vận hành chỉ làm output tương ứng giảm hoặc dừng; không gây sát thương kết cấu. Sửa chữa chỉ được mở khi tồn tại ledger tấn công, dùng tỷ lệ phần độ bền đã mất theo `BLUEPRINT-CONTRACT-3.0` File 04 Phụ lục 4.L. Không có attack ledger thì transaction sửa chữa bị chặn.

## 9. Dân số, nhu cầu, lao động, trung thành và di cư

### 9.1. Một cá nhân gồm gì

Mỗi người có hộ gia đình, tuổi, sức khỏe, nghề, kỹ năng, ca làm, nhu cầu, tín ngưỡng, phe phái, ký ức và quan hệ. Để tiết kiệm mô phỏng, nhân vật nền có thể gộp theo cohort nhưng nhân vật liên quan cốt truyện phải giữ bản ghi cá thể.

### 9.2. Tháp nhu cầu tám lớp

Nước/nhiệt → thức ăn → ngủ/chỗ ở → an toàn → sức khỏe → gia đình/cộng đồng → công bằng/ý nghĩa → phát triển bản thân. Thiếu lớp thấp tạo phạt mạnh; đáp ứng lớp cao tạo giữ chân nhân tài và đổi mới.

### 9.3. Tinh thần, trung thành và chính danh

Ba đại lượng tách biệt:

- **Tinh thần:** cảm xúc ngắn hạn, ảnh hưởng năng suất và chiến đấu.
- **Trung thành:** cam kết với người/tổ chức, thay chậm hơn.
- **Chính danh:** đánh giá quyền cai trị có hợp lệ hay không.

Thay đổi trung thành theo tuần:

\[
\Delta L=0.30Fairness+0.20Security+0.15NeedFulfillment+0.15Identity+0.10Leadership+0.10Prospects-Grievance
\]

Trong công thức trung thành, `Security=SecurityScore/10` để đổi score §11.4 từ `0..100` về miền `0..10`; dùng snapshot đầu kỳ nhằm tránh Chính danh hiện hành của cùng kỳ quay ngược qua trung thành. Các input khác giữ miền Phụ lục 1.I.

Sợ hãi có thể ngăn nổi loạn nhưng không tạo trung thành; khi quân đồn trú rút, bất mãn bị nén trở lại.

#### `TERRITORY-VITALS-1.0-L` — hàm Chính danh

Chính danh được tính cho **cư dân hữu trí đang chịu quyền cai trị**. Lính/vật triệu hồi vô trí, xác không có agency, khách quá cảnh, tù binh chưa được sáp nhập và quân tuyệt đối trung thành không tự tạo Chính danh. Mỗi cohort `h` dùng số `resident_days_h` thật trong cửa quyết toán; một actor đổi cohort giữa kỳ phải tách đúng boundary.

Bảy bằng chứng chuẩn hóa `x_{h,k}` đều thuộc `0..1`:

| Bằng chứng `k` | Hàm số bắt buộc | Trọng số `u_k` |
|---|---|---:|
| Chấp nhận quyền | `AcceptedResidentDays_h/ResidentDays_h`; một resident-day mang hệ số `1,00` khi ký/tuyên thệ tự nguyện, `0,75` khi tự nguyện cư trú sau khi luật đã được công bố, `0,50` khi mặc nhận nhưng có quyền rời đi, `0` khi chưa hỏi, phản đối hoặc bị cưỡng ép | 0,25 |
| Dịch vụ thiết yếu | `EssentialDelivered_h/EssentialDue_h`, cùng các đơn vị người-ngày nước, nhiệt, thức ăn, chỗ ở và y tế đã reserve | 0,20 |
| Tuân thủ quyền lợi | `1-WeightedRightsBreachDays_h/(4×RightsEntitledDays_h)`; mỗi breach có cấp `1..4` do rights contract khóa **trước** event | 0,20 |
| Đúng thủ tục | `CompletedRequiredProcedureSteps_h/RequiredProcedureSteps_h` | 0,15 |
| Giữ cam kết | `OnTimeObligationWeight_h/DueObligationWeight_h`; weight lấy từ hợp đồng trước hạn, không sửa sau kết quả | 0,10 |
| Đại diện | `RepresentedEligibleResidentDays_h/EligibleResidentDays_h` theo hiến ước/chính thể đã công bố | 0,05 |
| Công nhận yêu sách | `RecognizedClaimWeight_h/EligibleClaimWeight_h` từ cư dân/tổ chức có quyền công nhận | 0,05 |

Mọi tỷ lệ được `Clamp(0,1,...)`. Ba dòng **Chấp nhận quyền, Dịch vụ thiết yếu, Tuân thủ quyền lợi** luôn bắt buộc khi có cư dân. Bốn dòng còn lại được đánh dấu `NOT_APPLICABLE` chỉ khi thật sự không có bước, nghĩa vụ hoặc cơ chế tương ứng trong kỳ; khi đó bỏ trọng số dòng ấy và chuẩn hóa lại tổng trọng số còn áp dụng. Thiếu ledger không phải `NOT_APPLICABLE` mà là `INVALID_LEGITIMACY_INPUT`.

Với `U_h` là tổng trọng số còn áp dụng:

\[
L_h^*=100\times\frac{\sum_k u_kx_{h,k}}{U_h}
\]

Gộp toàn lãnh địa theo resident-day, rồi áp hai trần chống “cai trị bằng dịch vụ nhưng không có đồng thuận/quyền lợi”:

\[
L_{evidence}=\frac{\sum_h ResidentDays_hL_h^*}{\sum_h ResidentDays_h}
\]

\[
L^*=\min\left(L_{evidence},\ 40+60Consent_{all},\ 40+60Rights_{all}\right)
\]

`Consent_all` và `Rights_all` là hai tỷ lệ toàn lãnh địa tính lại trực tiếp từ tổng tử/mẫu, không lấy trung bình các phần trăm cohort. Nếu tổng resident-day bằng 0, kết quả là `NOT_APPLICABLE_NO_GOVERNED_RESIDENTS`, không phải 0 hay 50.

Chính danh hiện hành có quán tính. Từ timestamp đã quyết toán `t_0` tới `t_1`, chia segment tại mọi event làm thay đổi bằng chứng/biên dân cư rồi dùng:

\[
LEG_{pre}=L^*+(LEG_{t_0}-L^*)\times2^{-\Delta days/7}
\]

Ở cuối từng segment, áp đúng một hoặc nhiều `DirectLegitimacyDelta` theo thứ tự `(timestamp,event_id)`, rồi dùng kết quả ấy làm đầu vào segment kế:

\[
LEG_{after,j}=Clamp(0,100,LEG_{before,j}+\Delta LEG_j)
\]

`7 ngày` là half-life `DESIGN_DEFAULT` của `TERRITORY-VITALS-1.0`. Khi Chính danh lần đầu materialize sau khi xuất hiện cư dân hợp lệ, đặt `LEG=L^*`; về sau không rebase tức thời về target. Một kỹ năng/hợp đồng ghi “tốn X Chính danh” phải settle tới timestamp trước, kiểm tra `LEG≥X`, rồi commit `DirectLegitimacyDelta=−X`; vì vậy chi phí không biến mất ở lần mở bảng kế tiếp. Kết quả làm tròn nửa lên một chữ số sau cùng.

### 9.4. Lao động

Giờ lao động hiệu dụng = người × giờ × phối hợp × sức khỏe × kỹ năng × công cụ × tinh thần, dùng đúng mapping §7.3. Làm quá giờ chỉ tồn tại khi work contract ghi số giờ, fatigue delta và accident check trước commit; không có bonus overtime ngầm. Trẻ em, người bệnh và tù binh có luật riêng; mọi lựa chọn cưỡng bức phải để lại hậu quả xã hội, không chỉ bonus.

### 9.5. Di cư

Điểm hấp dẫn:

\[
Attract=Safety+Wage+Housing+Kinship+Rights+Culture+Opportunity-Distance-Risk-Discrimination
\]

`Safety=SecurityScore` hiện hành `0..100`. Nếu An ninh invalid, dòng di cư bị chặn thay vì tự gọi nơi đó an toàn/nguy hiểm.

Nhân tài hiếm quan tâm phòng nghiên cứu, tự do nghề nghiệp, đồng nghiệp và danh tiếng, không chỉ thịnh vượng tổng.

### 9.6. Nông Phu Cực Địa: chiêu mộ và khẩu phần hằng ngày

Sau khi Nhà Lãnh Chúa được tu sửa, danh mục công trình nền mở **Nhà Nông Phu Cực Địa Cấp 1**. Công trình chiếm **12 mét vuông**, chứa tối đa **4 người**, cần **10 đá và 30 gỗ**, `WorkUnits=0,75` người-giờ và `max_workers=2`. Theo §7.3, một người ở profile chuẩn cần đúng **45 phút**; hai người với `Coordination=0,75` cần đúng **30 phút** trước modifier cảnh.

Mỗi chỗ trống cho phép chiêu mộ ngay một Nông Phu Cực Địa bằng **5 đơn vị lương thực**. Một nhà trống có thể nhận đủ bốn người trong cùng một lần, miễn kho còn 20 đơn vị lương thực. Chu kỳ ngày chỉ chốt khẩu phần và nhu cầu; nó không tạo lượt chiêu mộ, không đặt hạn mức một người mỗi ngày và không tự sinh cư dân lúc sang ngày mới.

Toàn tuyến dùng `POLAR-FARMHOUSE-PROGRESSION-2.0` ở Phụ lục 1.K. Nhà Cấp 1→2 cần **50 Gỗ + 30 Đá**, thành nhà thấp **30 m²/8 chỗ**; cảnh nguồn từng hiện còn 27 phút sau khi bốn người đã làm ba phút, không phải thời gian nền. Cấp 2→3 cần Nhà Lãnh Chúa Cấp 3 + **100 Đá + 200 Gỗ + 50 Sắt**. Neo Cấp 5 là nhà đá một tầng cao khoảng **3 m**, **60 m²**, **20 chỗ**, phí gọi **50 Lương Thực/người**; cạnh `5→6` dùng đúng **500 Đá + 300 Gỗ + 200 Sắt + 100 Sắt Tinh Luyện + 10 Tinh Thể Nguyên Tố Trung Cấp**, yêu cầu Nhà Lãnh Chúa Cấp 6 và đổi thành nhà đá hai tầng **90 m²/32 chỗ**. Không áp điều kiện/recipe của một cạnh sang cạnh khác.

Nông Phu Cực Địa bước ra khỏi nhà với thân thể, tên gọi, kỹ năng, nhu cầu và quan hệ riêng. Họ tính vào dân số thật, dùng chỗ ở thật và nhận kinh nghiệm nghề như mọi cư dân. Lãnh chúa phải cung cấp lương thực mỗi ngày; nguồn chỉ xác nhận nghĩa vụ này mà không ấn định một con số khẩu phần phổ quát, vì vậy lượng tiêu hao lấy từ hồ sơ giống loài, thể trạng và mức lao động. Đói kéo dài làm sức khỏe, tinh thần và trung thành suy giảm; người còn khả năng rời đi có thể bỏ lãnh địa.

**Quy tắc `FOOD-UNIT-1.0 — USER_LOCKED + DESIGN_DEFAULT`:** một đơn vị lương thực là **một bữa ăn** cho một người trưởng thành bình thường. Khẩu phần ngày:

\[
FoodDay=RoundUp_{0.25}(3\times BodyFactor\times ActivityFactor\times ConditionFactor)
\]

| Hệ số | Các giá trị khóa |
|---|---|
| `BodyFactor` | trẻ em 0,60; nhỏ/mảnh 0,90; trưởng thành thường 1,00; lớn 1,25; khổng lồ 1,75 |
| `ActivityFactor` | nghỉ 0,75; sinh hoạt thường 1,00; lao động nặng 1,25; cực hạn 1,50 |
| `ConditionFactor` | bình thường 1,00; sốt/hồi phục/thai kỳ hoặc trạng thái cần dinh dưỡng tăng 1,15 |

`RoundUp_0.25(x)=ceil(4x)/4`; giữ phần tư đơn vị trong sổ kho. Mỗi ngày chọn đúng một hàng ở từng hệ số; nhiều trạng thái thuộc cùng hàng `ConditionFactor=1,15` không nhân chồng, còn một medical/species effect muốn tăng thêm phải ghi hệ số thay thế có ID/version. Nếu một loài có sinh lý riêng, species template phải thay đúng một hoặc nhiều hệ số bằng số có version trước khi tuyển; thiếu template dùng nhóm hình thể quan sát được gần nhất, không tự lấy 1. Giá **5 đơn vị** để chiêu mộ là phí của công trình và không thay cho khẩu phần sau đó.

## 10. Xây dựng, công nghệ và quy hoạch

### 10.1. Chu trình công trình

Xác định chức năng và quy mô → materialize Bản Vẽ hoàn chỉnh → quyền đất → reserve tài nguyên gộp → thi công → hệ thống biểu hiện toàn bộ hình thể công trình → kiểm định → vận hành → nâng cấp/đổi công năng/tháo dỡ hoặc sửa sau tấn công.

Ống khói, móng, mái, bánh xe gắn trong máy, đinh, lớp lát, rãnh thoát và mọi chi tiết hình học là **kết quả hình thành từ Gỗ/Đá/Sắt/vật liệu nền đã trả**, không phải vật phẩm riêng trong recipe xây. Một Bản Vẽ chỉ được phát thưởng, bán, học hoặc thi công sau khi contract ở File 04 Phụ lục 4.L đã materialize và hash đầy đủ.

### 10.2. Ô đất và lân cận

Mỗi công trình có footprint, vùng phục vụ, tiếng ồn, ô nhiễm, nguy cơ cháy, nhu cầu đường và năng lượng. Bonus lân cận dùng **giảm biên**: công trình cùng loại thứ n trong bán kính chỉ cho hệ số 1/√n trừ khi là chuỗi công nghiệp hợp lệ.

### 10.3. Cây công nghệ ba trục

- **Vật chất:** khai thác, luyện, máy, năng lượng, vận tải.
- **Sinh học/xã hội:** nông nghiệp, y tế, giáo dục, luật, quản trị.
- **Siêu nhiên:** rune, ma pháp, khế ước, không gian, linh hồn.

Mỗi công nghệ cần tri thức, cơ sở thử nghiệm, nhân sự, vật mẫu và thời gian. Có bản vẽ không đồng nghĩa biết sản xuất hàng loạt.

### 10.4. Tiến thời đại

Thời đại không chỉ yêu cầu “đủ tài nguyên”. Điểm sẵn sàng:

\[
Readiness=0.25Knowledge+0.20Industry+0.15Energy+0.15Institutions+0.15Logistics+0.10Security
\]

`Security` tại đây là `SecurityScore` §11.4 đã settle cùng `through_event_id`, không phải một input riêng. Mỗi trụ phải đạt sàn 40% và tổng đạt ngưỡng của thời đại. Cơ chế này kế thừa cảm giác cây công nghệ của chiến lược thời gian thực nhưng ngăn dồn toàn lực vào một nhánh rồi bỏ mặc xã hội.

### 10.5. Bản Vẽ và tri thức đã học

Bản Vẽ chưa học là vật phẩm có thể tìm thấy trong Rương Báu, chiến lợi phẩm, di tích hoặc giao dịch. Khi người có quyền học Bản Vẽ, nội dung được ghi vào Sổ Chế Tạo hoặc Sổ Kiến Trúc của lãnh địa; vật phẩm rời trạng thái chưa học và không thể bị đem giao dịch lần nữa.

| Loại Bản Vẽ | Nội dung phải ghi | Điều kiện vận hành |
|---|---|---|
| Bản Vẽ Chế Tạo | kích thước đơn vị, vật liệu, công cụ, công trình nghề | mỗi sản phẩm tiếp tục tiêu vật liệu và thời gian |
| Bản Vẽ Xây Dựng | một chức năng, hình thể/quy mô có lý do, tập tài nguyên gộp tối thiểu đủ cho kết cấu/chức năng và `Tinh Thể Nguyên Tố Sơ Cấp` chung khi hiệu ứng nguyên tố cơ bản thật sự cần | cần quyền đất, vật liệu gộp, thợ và kiểm định |
| Bản Vẽ Nâng Cấp | instance nền, thay đổi chức năng/quy mô, phần tài nguyên bổ sung gộp | phải hoàn tất cấp trước rồi mới nâng |

Một Bản Vẽ đã học có thể mở nhiều lần chế tác hoặc nhiều vị trí xây cùng mẫu; nguyên tác cho thấy một Bản Vẽ Nơi Trú Vừa được học rồi dùng để giao dựng hai nơi trú. Khả năng lặp lại thuộc về tri thức, còn mỗi lần thực hiện vẫn trả đủ vật liệu, nhân công và thời gian. Phẩm của Bản Vẽ biểu thị độ hiếm cùng độ phức tạp của tri thức, không tự nâng phẩm sản phẩm nếu thợ hoặc vật liệu không đạt.

Mỗi Bản Vẽ xây dựng có **một danh tính duy nhất**. Công trình thường tạo kết quả thường; công trình ma pháp tạo kết quả ma pháp. Không sinh hai phiên bản “mundane/magic”, không cho thay chức năng phép bằng cấu kiện cơ học, và không suy recipe từ thói quen kỹ thuật ngoài đời khi chức năng đã được ma pháp đảm nhiệm. `Tinh Thể Nguyên Tố Sơ Cấp` là một tài nguyên chung cho mọi nguyên tố cơ bản; cấm tự thêm hậu tố Thủy/Hỏa/Mộc hoặc tách thành nhiều SKU.

Recipe xây chỉ chứa vật liệu trở thành khối lượng chính của công trình. Đinh, bánh xe, ống khói, bồn, lõi lọc, đá lát, sỏi thoát nước và các chi tiết tương tự không phải dòng nguyên liệu; hệ thống biểu hiện chúng từ vật liệu nền khi hoàn tất. Nhiên liệu, thuốc, mana, nước đầu vào hay nguyên liệu mà công trình xử lý thuộc `production_inputs`, không thuộc `material_recipe`. Toàn bộ cách lập Bản Vẽ mới và phép kiểm lý do nằm ở `BLUEPRINT-CONTRACT-3.0`, File 04 Phụ lục 4.L.

## 11. Thịnh vượng, sức chứa và sức mạnh lãnh địa

### 11.1. Mười hai trụ thịnh vượng

Sinh tồn; dân số; kinh tế; công nghiệp; nông nghiệp; hậu cần; quân sự; quản trị; văn hóa–giáo dục; ngoại giao–thương mại; sinh thái; đặc thù siêu nhiên.

Đối với KPI Thịnh vượng, `resident` gồm lãnh chúa và mọi actor được ghi thường trú/được lãnh địa phục vụ dài hạn; khách quá cảnh và quân vô trí không tạo resident-day, nhưng nhu cầu/upkeep thật của họ vẫn vào đúng KPI dịch vụ, hậu cần hoặc quân sự. Tập này rộng hơn tập “người bị trị” dùng cho Chính danh.

Mỗi trụ chuẩn hóa thành s_i từ 0 đến 1 bằng:

\[
s_i=1-e^{-Raw_i/Scale_i}
\]

`Raw_i` không được nhập tay. Mỗi trụ có hai KPI cố định dưới `TERRITORY-VITALS-1.0-P`. Với KPI đang hoạt động, `Actual=A`, `Target=T>0`, direction và target source phải được khóa trước cửa đo:

\[
a_k=\begin{cases}
Clamp(0,2,A/T),&AT\_LEAST\\
Clamp(0,2,2-A/T),&AT\_MOST
\end{cases}
\]

KPI `NOT_ACTIVE` nhận `a_k=0` và chỉ hợp lệ khi không có cư dân/công trình/hợp đồng/hệ thống đủ điều kiện; nó vẫn phải có `inactive_reason` cùng event chứng minh. KPI hoạt động yêu cầu `A≥0` và `T>0`; dòng signed như giá trị gia tăng ròng dùng `A=max(0,NetValueAdded)` cho achievement, còn phần âm vẫn ở deficit ledger. Thiếu `Actual`, `Target`, unit, direction, weight hoặc source tạo `INVALID_PROSPERITY_INPUT`, không được thế bằng 0. Với trọng số KPI `v_k` của mỗi trụ cộng đúng 1:

\[
Raw_i=100\sum_kv_ka_k,\qquad Scale_i=100,\qquad s_i=1-e^{-Raw_i/100}
\]

| Trụ | KPI 1 — direction; trọng số | KPI 2 — direction; trọng số |
|---|---|---|
| Sinh tồn | dịch vụ thiết yếu đã giao / dịch vụ thiết yếu phải giao — `AT_LEAST`; 0,70 | dự trữ người-ngày / người-ngày của `RiskHorizon` — `AT_LEAST`; 0,30 |
| Dân số | resident-day khỏe mạnh / tổng resident-day — `AT_LEAST`; 0,60 | cư dân thường trú / `PopulationRequired(H→H+1)` — `AT_LEAST`; 0,40 |
| Kinh tế | giá trị gia tăng ròng / giá trị nhu cầu sinh tồn — `AT_LEAST`; 0,65 | nghĩa vụ kinh tế đã quyết toán đúng hạn / nghĩa vụ đến hạn — `AT_LEAST`; 0,35 |
| Công nghiệp | đầu ra đạt chuẩn / nhu cầu sản xuất đã đăng ký — `AT_LEAST`; 0,70 | giờ facility vận hành / giờ đã lập lịch — `AT_LEAST`; 0,30 |
| Nông nghiệp | thực phẩm tái tạo sản xuất / nhu cầu bữa ăn — `AT_LEAST`; 0,70 | đầu vào tái sinh / đầu vào tái tạo đã khai thác — `AT_LEAST`; 0,30 |
| Hậu cần | tải×quãng đường giao đúng hạn / tải×quãng đường đến hạn — `AT_LEAST`; 0,65 | giờ tuyến hoạt động / giờ tuyến đã lập lịch — `AT_LEAST`; 0,35 |
| Quân sự | `SecurityScore/100` — `AT_LEAST`; 1,00 | `NOT_APPLICABLE`; 0,00 |
| Quản trị | work-unit hành chính hoàn tất / work-unit đến hạn — `AT_LEAST`; 0,60 | giá trị đã audit / tổng giá trị được quản lý — `AT_LEAST`; 0,40 |
| Văn hóa–giáo dục | giờ-người học/huấn luyện đã giao / đã cam kết — `AT_LEAST`; 0,55 | resident-day có quyền tiếp cận sinh hoạt văn hóa / resident-day đủ điều kiện — `AT_LEAST`; 0,45 |
| Ngoại giao–thương mại | nghĩa vụ đối ngoại hoàn tất / nghĩa vụ đối ngoại đến hạn — `AT_LEAST`; 0,55 | giá trị giao thương thực / mục tiêu giao thương đăng ký — `AT_LEAST`; 0,45 |
| Sinh thái | năng lực dịch vụ sinh thái hiện hành / baseline đã seed — `AT_LEAST`; 0,50 | tải khai thác+ô nhiễm / năng lực tái sinh+hấp thụ — `AT_MOST`; 0,50 |
| Đặc thù siêu nhiên | output siêu nhiên ổn định / nhu cầu đã đăng ký — `AT_LEAST`; 0,60 | giờ containment ổn định / giờ phải vận hành — `AT_LEAST`; 0,40 |

`RiskHorizonDays=max(1,ceil(P90DaysToNextVerifiedReplenishment))`; nếu không có lần bổ sung đã xác thực trong forecast, fallback là `2+H` ngày (`DESIGN_DEFAULT`). Với `H≤11`, `PopulationRequired(H→H+1)` gọi đúng recipe §7.3/Phụ lục 1.I; tại trần `H12`, target dân số là `max(1,ceil(0.80×PopCap))`. “Nhu cầu/mục tiêu đăng ký” chỉ đến từ nhu cầu sinh lý, quân nhu, work order, blueprint, luật, hợp đồng hoặc stage gate đã tồn tại trước window; không được hạ target sau khi thấy output.

Giá trị kinh tế/đối ngoại dùng cùng một đơn vị `RDE` (resident-day equivalent): giá thay thế tại đầu kỳ của nước, nhiệt, ba bữa và quyền sử dụng chỗ ở cho một người trưởng thành chuẩn. Giá lấy từ hợp đồng thực/median giao dịch hợp lệ; nếu không có thị trường thì phân rã về input lao động–vật tư đã ledger. Không định giá đủ basket làm riêng hai KPI giá trị thành `INVALID_VALUATION_INPUT`; không làm hỏng các trụ không dùng RDE.

Điểm tổng:

\[
P=1000\times \left(\sum_i w_i s_i\right)\times \left(0.75+0.25\frac{\min(s_i)}{\max(\bar{s},0.01)}\right)+P_{unique}
\]

Hệ số cuối thưởng lãnh địa cân bằng nhưng không bắt mọi trụ bằng nhau. `P_unique` là tổng bonus riêng từ kỳ quan, di sản và **đại thành tựu đã xác thực**. `P_unique` không có trần toàn cục và không bị giảm vì chủ thể đang dẫn bảng; từng nguồn là một khoản thưởng đã công bố, có ID và chỉ được ghi nhận đúng số lần hợp lệ.

Mười hai `w_i` mặc định bằng `1/12`. Một chính thể có profile khác chỉ được đổi trọng số bằng `prosperity_weight_version` công bố trước cửa đo, mọi `w_i≥0`, tổng đúng 1 và không được đặt một trụ đang yếu về 0 sau khi kỳ đã bắt đầu.

Trong phép tính, `a_k`, `Raw_i` và `s_i` giữ sáu chữ số thập phân; sau khi cộng `P_unique`, `P` được làm tròn nửa lên tới 0,1 điểm và chính giá trị đã commit này được consumer/bảng đọc. Không dùng phần thập phân ẩn để phá hòa; board dùng tie-break đã công bố.

### 11.2. Sức chứa dân số

\[
PopCap=\min(Housing,Water,Food,Sanitation,Heat,Jobs)\times M_{governance}
\]

Vượt sức chứa gây giá tăng, bệnh, ổ chuột và bất ổn. Không cấm nhập cư tuyệt đối; hệ thống hiển thị hậu quả.

### 11.3. Điểm sức mạnh quân sự

Chỉ để ghép trận:

\[
MP=\sum Units(CP\times Readiness\times Cohesion)+Fortification+Reserve-LogisticPenalty
\]

MP không tính được bí mật, địa hình chưa biết, chỉ huy đột biến hay mục tiêu chính trị; UI phải hiển thị sai số.

### 11.4. `TERRITORY-VITALS-1.0-S` — hàm An ninh

An ninh là score `0..100` của **state nội bộ**, không phải nhãn “an toàn/tranh chấp/thù địch” do người kể chọn. Chia lãnh địa thành các `security_zone`; mọi zone phải có diện tích, dân, tài sản trọng yếu, `BiomeThreatFloor`, threat ledger, force/fortification có thể phản ứng, route và supply window.

Với zone `z`:

\[
ThreatDemand_z=BiomeThreatFloor_z+\sum_j CP_jp_j
\]

`CP_j` gọi File 04; `p_j∈[0,1]` là xác suất threat chạm zone trong response window đã seed trước khi bị quan sát. Threat còn `STATE_UNOBSERVED` vẫn nằm trong state nội bộ; UI chỉ che nó. `DefenseCapacity_z` là MP thật có thể tới trước `breach_time`, không phải toàn quân trên roster.

\[
ThreatCover_z=\begin{cases}1,&ThreatDemand_z=0\\Clamp(0,1,DefenseCapacity_z/ThreatDemand_z),&ThreatDemand_z>0\end{cases}
\]

\[
PatrolCover_z=\begin{cases}1,&RequiredGuardMinutes_z=0\\Clamp(0,1,FilledGuardMinutes_z/RequiredGuardMinutes_z),&RequiredGuardMinutes_z>0\end{cases}
\]

Đặt `ResponseRatio_j=1` khi `ETA_j=0`; còn lại `ResponseRatio_j=Clamp(0,1,breach_time_j/ETA_j)`. Khi đó:

\[
ResponseCover_z=\frac{\sum_j CP_jp_j\,ResponseRatio_j}{\sum_j CP_jp_j}
\]

Khi mẫu của `ResponseCover` bằng 0, đặt 1. Để không tạo vòng lặp, `ETA_j` trong chính phép tính An ninh gọi TravelTime vật lý của File 03 với `SecurityFactor=1,00`, rồi cộng `InterdictionDelay_j` đã có trong threat ledger; nó không đọc `SecurityScore` đang được giải. Route không đi được cho tỷ lệ 0. TravelTime dùng cho hành trình thường chỉ đọc score sau khi settlement này hoàn tất. Hai tỷ lệ còn lại:

\[
SupplyCover_z=\begin{cases}1,&DefenseSupplyRequired_z=0\\Clamp(0,1,DefenseSupplyAvailable_z/DefenseSupplyRequired_z),&DefenseSupplyRequired_z>0\end{cases}
\]

\[
CommandCover_z=\begin{cases}1,&OrderDemand_z=0\\Clamp(0,1,CommandCapacity_z/OrderDemand_z)\times CommsUptime_z,&OrderDemand_z>0\end{cases}
\]

\[
MR_z=100(0.40ThreatCover_z+0.20PatrolCover_z+0.15ResponseCover_z+0.15SupplyCover_z+0.10CommandCover_z)
\]

Gộp `MilitaryReadiness` theo ba share: diện tích 0,20; cư dân 0,40; giá thay thế RP của tài sản trọng yếu 0,40. Thành phần có tổng toàn lãnh địa bằng 0 được bỏ và ba trọng số còn lại được chuẩn hóa lại; từng share trong thành phần phải cộng đúng 1 qua các zone.

`TerritoryControl` dùng từng ô/cell của File 03:

\[
NetworkCoverage=\begin{cases}0,&RequiredRouteLength=0\\Clamp(0,1,ServiceableRequiredRouteLength/RequiredRouteLength),&RequiredRouteLength>0\end{cases}
\]

\[
\lambda=\max(0.1\text{ km},R_{heat,km}(0.50+0.005GOV)(0.75+0.50NetworkCoverage))
\]

\[
Road_z=0.50+0.75RouteReliability_z,\quad Garrison_z=0.50+0.75ThreatCover_z
\]

\[
LegitimacyM=\begin{cases}1.00,&\text{không có cư dân hữu trí bị trị}\\0.50+0.0075LEG,&\text{còn lại}\end{cases}
\]

\[
Control_z=Clamp(0,100,S_{fire}e^{-d_z/\lambda}Road_zGarrison_zLegitimacyM)
\]

\[
TerritoryControl=\frac{\sum_zArea_zControl_z}{\sum_zArea_z}
\]

Cuối cùng:

\[
SecurityScore_z=0.50MR_z+0.30S_{fire}+0.20Control_z
\]

\[
SecurityScore=0.50MilitaryReadiness+0.30S_{fire}+0.20TerritoryControl
\]

`R_heat,km=EffectiveHeatRadius/1000` theo §6.3; `RouteReliability`, `CommsUptime` thuộc `0..1`; `WindowMinutes>0`; diện tích dương; `d_z` là khoảng cách route/centroid đã seed; mọi CP, phút, supply và order demand không âm. `BiomeThreatFloor` thiếu tạo `INVALID_SECURITY_INPUT`, không được coi là 0. Score làm tròn nửa lên một chữ số sau cùng.

Các biến con bắt buộc được đóng như sau:

- `RequiredGuardMinutes_z=WindowMinutes×(BoundaryAccessNodes_z+GuardRequiredAssets_z)`. Access node đến từ bản đồ route/perimeter; asset chỉ được tính khi blueprint có tag `GUARD_REQUIRED`. `FilledGuardMinutes` cộng unit-minute hiện diện, tỉnh táo và có PER/role phù hợp; cùng unit-minute không phủ hai post.
- `DefenseSupplyRequired_z` là tổng upkeep theo thời gian điều động cộng đạn/năng lượng/consumable của response plan; `DefenseSupplyAvailable_z` chỉ tính lượng đã reserve và có thể tới trước breach time.
- `OrderDemand_z` là tổng OrderLoad của force có thể phản ứng; `CommandCapacity_z` là command/order capacity còn trống của đúng chain chỉ huy. `CommsUptime=WorkingCommsMinutes/WindowMinutes`.
- `RequiredRouteLength` chỉ gồm tuyến tối thiểu nối Lửa Sinh Tồn với mọi zone có cư dân hoặc tài sản `CRITICAL`; `ServiceableRequiredRouteLength` là phần route còn đi được trong weather/load hiện hành. `RouteReliability_z=ServiceableScheduledRouteHours/ScheduledRouteHours`; không có scheduled route cho 0.
- RP tài sản trọng yếu lấy từ recipe xây/sửa hiện hành của từng instance; không có recipe valuation làm asset-share INVALID, không được cho narrator tự đặt trọng số.

### 11.5. Thứ tự quyết toán và chống vòng lặp

Trong mỗi boundary: (1) commit vật lý, dân số, dịch vụ, hợp đồng, force, route, nhiên liệu và trạng thái Lửa; (2) tính `L^*`, tiến Chính danh hiện hành và áp direct delta; (3) tính `MilitaryReadiness`, `TerritoryControl`, An ninh; (4) tính mười hai trụ và Thịnh vượng; (5) mới cho AP, nâng cấp, HeroCapacity, bảng hoặc effect khác đọc các score. Dịch vụ thiết yếu của Chính danh không đọc An ninh tổng; trụ quân sự của Thịnh vượng chỉ đọc An ninh sau khi An ninh đã đóng. Không có fixed-point iteration hoặc bonus tự nuôi trong cùng tick.

Daily settlement chạy lúc 07:00. Event làm đổi input phải đánh dấu đúng score `DIRTY`; query giữa ngày được phép tính preview từ ledger hiện hành nhưng không tạo event nếu state khác không đổi. Một transaction dùng ngưỡng/cost của score phải settle các input tới timestamp của transaction trước preflight. Cùng `(territory_id,through_event_id,rule_version)` chỉ được commit một `TerritoryVitalsSettled`.

Boundary regression dưới đây là `EXAMPLE_ONLY`, không phải state campaign:

| ID | Input | Kết quả bắt buộc |
|---|---|---|
| `TV-P-01` | một KPI `AT_LEAST` có `A=T` | `a=1`; nếu là KPI duy nhất của trụ thì `Raw=100`, `s=1-e^{-1}=0,6321` |
| `TV-L-01` | ba bằng chứng lõi đều 1, bốn dòng còn lại không áp dụng | `L*=100` |
| `TV-L-02` | mọi bằng chứng trừ Chấp nhận quyền bằng 1, `Consent_all=0` | `L*≤40`; quân/sợ hãi không nâng trần |
| `TV-L-03` | `LEG_0=20`, `L*=80`, không direct delta, đúng 7 ngày | `LEG_1=50,0` |
| `TV-S-01` | `MilitaryReadiness=80`, `S_fire=90`, `TerritoryControl=70` | `SecurityScore=81,0` |
| `TV-Z-01` | không có cư dân hữu trí bị trị | `LEG=NOT_APPLICABLE`, `LEG_effective=0` trong AP/HC, mọi legitimacy threshold/cost bị chặn |

## 12. Quân sự, quân đoàn, tiếp tế và chiếm đóng

### 12.1. Cấu trúc

Tổ 5–12 → đội 20–60 → đại đội 80–250 → tiểu đoàn 300–900 → quân đoàn 2.000+; con số tùy văn hóa và giống loài. Mỗi tầng cần sĩ quan, tín hiệu, quân nhu và y tế. Vượt nhịp chỉ huy làm giảm phản ứng thay vì khiến đơn vị biến mất.

### 12.2. Quân số hiệu dụng

\[
EffectiveForce=Headcount\times Training\times Equipment\times Cohesion\times Supply\times Command\times TerrainFit
\]

### 12.3. Bảo dưỡng quân đội

Chi phí ngày = lương + khẩu phần + thức ăn phương tiện/sinh vật + đạn/vật liệu + sửa chữa + y tế. Dùng cơ chế upkeep mềm:

\[
IncomeEfficiency=\frac{1}{1+0.55\max(0,ArmyLoad/\max(EcoSupport,0.01)-1)^{1.25}}
\]

Nó lấy cảm hứng từ thuế upkeep của Warcraft III nhưng liên tục thay vì ba nấc cứng.

### 12.4. Chiếm đóng

Chiếm Lửa Sinh Tồn không đồng nghĩa dân chúng phục tùng. Trạng thái: đột kích → kiểm soát quân sự → chính quyền tạm → sáp nhập/vassal/tự trị. Chi phí chiếm đóng phụ thuộc dân số, khác biệt văn hóa, tàn phá, chính danh và quân đồn trú. Đồng hóa cưỡng bức nhanh tạo phản kháng dài hạn.

## 13. Nhiệm vụ, thành tựu, bảng xếp hạng và phần thưởng

### 13.1. Nhiệm vụ

| Loại | Nguồn | Có thể từ chối? | Phần thưởng |
|---|---|---:|---|
| Hướng dẫn | Hệ thống | Có, sau cảnh báo | Công cụ nền, kiến thức |
| Cá nhân | Mục tiêu/chức nghiệp | Có | XP, kỹ năng, quan hệ |
| Lãnh địa | Khủng hoảng/phát triển | Có hậu quả | Vật tư, module, chính danh |
| Phe phái | NPC/tổ chức | Có | Uy tín, điều ước, quyền tiếp cận |
| Khu vực | Sự kiện chung | Có | Điểm đóng góp, mốc cộng đồng |
| Thế giới | Biến cố toàn cầu | Có nhưng không né ảnh hưởng | Thay đổi bản đồ/quy tắc |
| Ẩn | Điều kiện kín | Không hiện trước | Danh hiệu, manh mối, quyền đặc biệt |

Mỗi nhiệm vụ có: issuer, mục tiêu, lý do trong thế giới, deadline, điều kiện thất bại, nhánh đạo đức, phần thưởng, tác động phụ và log xác thực.

**Binding campaign Lí Lan.** Mọi nhiệm vụ authored map-bound đọc registry exhaustive `QUEST-REGISTRY-LL01-1.0` ở File 05 và payload `QUEST-PAYLOAD-LL01-1.0` ở File 04. Trigger chỉ đổi quest từ `DORMANT` sang `OFFERED/OPEN`; trigger không được gieo actor, vật phẩm, site, reward hoặc deadline mới. Actor chết, vật bị phá/đoạt hoặc cửa thời gian đóng làm quest chuyển đúng nhánh/failure đã niêm; engine không sinh người/vật thay thế. Hậu quả emergent vẫn có thể tạo việc phải làm, nhưng không được tự gắn UI quest/reward nếu chưa có contract versioned trước trigger.

### 13.2. Thành tựu

**Không dùng một bộ lọc cứng “chỉ đại cột mốc”.** Nguyên tác có thành tựu cho cả mốc khai cuộc đơn giản nhưng độc quyền, như người đầu tiên tu sửa Nhà Lãnh Chúa và người đầu tiên dựng Nhà Nông Phu Cực Địa. Một trigger tồn tại khi thân truyện hiện trực tiếp hoặc khi `SOURCE_ANALOGY` chứng minh được nó thuộc cùng họ thành tựu; việc nhân vật chính không nhận chỉ là `UNOBSERVED`, không phải bằng chứng phủ định.

Mỗi thành tựu vẫn cần phạm vi độc quyền/điều kiện claim, timestamp và log hệ thống tuyệt đối. Một việc thường ngày như nấu món, làm đường, thắng trận nhỏ hoặc hoàn thành quest **không tự động** là thành tựu, nhưng cũng không bị tuyên bố không thể tồn tại chỉ vì chưa thấy. Không có hai neo cùng họ thì giữ `UNOBSERVED/ANALOGY_BLOCKED`, đưa vào nhật ký/kỷ lục nếu cần và không tự phát thưởng.

| Họ thành tựu | Ví dụ chuẩn | Cách chốt |
|---|---|---|
| Khai cuộc/xây dựng đầu tiên | tu sửa Nhà Lãnh Chúa đầu tiên; dựng Nhà Nông Phu đầu tiên | công trình hoàn tất hợp lệ, phạm vi toàn server/khu như panel; thưởng phải `ENABLE/EXTEND/PROTECT/MASTERY/NEXT_STEP` cho đúng hệ vừa mở |
| Khóa kỳ khai cuộc | hoàn tất điều kiện Bảng Cấp khai cuộc trong cửa nguồn | khóa theo hợp đồng `OPENING_LEVEL`; không tự đổi thành top tuần Quân sự/Khám phá |
| Lần đầu tuyệt đối | Người/đội đầu tiên săn hạ boss dã ngoại đầu tiên của khu | Timestamp đòn kết liễu và điều kiện tham chiến hợp lệ |
| Tốc độ Lửa Sinh Tồn | Nâng Lửa tới một Cấp đại mốc được activity contract nêu | Thời gian từ T0 đến event nâng Cấp đã commit; nhanh hơn thắng |
| Mở hệ thống | Đầu tiên mở chợ liên khu, cổng liên giới, thành bang hoặc kỳ quan | Trigger hệ thống độc nhất |
| Chinh phục cấp thế giới | Đầu tiên giải quyết tai họa/boss/khu vực mang tính đổi thời đại | Log nhiều pha và quyền sở hữu chiến công |

Phạm vi phải ghi rõ **khu, vùng, liên khu hay thế giới**. Thành tựu “đầu tiên” là độc quyền trong phạm vi đó; người làm lại sau không nhận bản sao. Thành tựu tốc độ dùng chung T0 nên không cần chuẩn hóa thời gian.

Phần thưởng có thể gồm danh hiệu, quyền hạn, thuộc tính, thiên phú, vật phẩm, đơn vị, bản vẽ, tài nguyên, chức năng Lửa Sinh Tồn có nguồn hoặc bonus vĩnh viễn. **Không có cap sức mạnh toàn cục, không giảm thưởng để bảo vệ người xếp sau và không áp cơ chế bắt kịp.** Độ lớn phần thưởng đi theo tầm vóc đại cột mốc và được công bố/khóa tại thời điểm điều kiện mở.

#### `ACHIEVEMENT-ANALOGY-1.0` — thành tựu nguồn, thành tựu loại suy và phần thưởng

Việc nguyên tác không kể nhân vật chính nhận một thành tựu chỉ chứng minh trường hợp đó **chưa được quan sát**. Nó không chứng minh thành tựu không tồn tại: cảnh nguồn từng tự nêu khả năng người khác đã giành trước, và một thành tựu hạ Bán Thần tồn tại dù nhân vật chính chưa lấy. Registry vì vậy có ba lớp:

| Lớp | Điều kiện | Quyền dùng |
|---|---|---|
| `SOURCE_EXPLICIT` | panel/transaction trực tiếp trong thân chương | giữ đúng trigger, phạm vi, họ slot, số lượng và dải giá trị. Tên item cụ thể là payload cố định chỉ khi panel xác nhận một template độc bản/không phụ thuộc người nhận; một sách kỹ năng cá nhân đã resolve cho nhân vật nguồn không tự trở thành sách chung cho mọi chức nghiệp |
| `SOURCE_ANALOGY` | trường hợp cụ thể im lặng nhưng có ít nhất hai neo cùng họ: một neo quan hệ chức năng và một neo quy mô/độ khó | được tạo contract mới có version/hash; không được tự xưng là câu chữ nguồn |
| `CAMPAIGN_ONLY` | không đủ hai neo hoặc là cơ chế riêng người dùng khóa | chỉ dùng theo quyền thiết kế campaign, không gắn nhãn nguồn |

Mọi thành tựu loại suy phải được khóa **trước event đủ điều kiện**:

```yaml
achievement_contract:
  achievement_id:
  evidence_class: SOURCE_EXPLICIT|SOURCE_ANALOGY|CAMPAIGN_ONLY
  trigger_family:
  exclusive_scope: KHU|VUNG|LIEN_KHU|THE_GIOI
  claim_condition:
  source_anchor_ids: []
  difficulty_vector:
    danger:
    target_power_band:
    resource_commitment:
    time_pressure:
    strategic_scale:
    rarity:
    competition:
    epoch:
  reward_slots:
    - reward_slot_id:
      slot_role: MAIN|SIDE
      reward_family:
      payload_mode: FIXED_TEMPLATE|RECIPIENT_ADAPTIVE|SEALED_UNTIL_CAREER
      functional_bridge: ENABLE|EXTEND|PROTECT|MASTERY|ORGANIC_TROPHY|NEXT_STEP
      bridge_explanation:
      newly_opened_action:
      operation_dependency:
      upgrade_proxy_check: PASS|FAIL
      recipient_fit_rule:
      reward_value_band:
      usability_now: IMMEDIATE|DELAYED_REQUIREMENT|FUTURE_PATH
  main_reward_floor:
  comparison_achievement_ids: []
  pool_hash_or_family_map_hash:
  contract_hash:
  claim_rule: ATOMIC_IDEMPOTENT
```

**Cầu nối chức năng là bắt buộc cho từng slot có giá trị**, không phải một câu trang trí viết sau khi roll:

| Cầu nối | Nghĩa hợp lệ |
|---|---|
| `ENABLE` | cho phép sử dụng ngay hệ thống/đơn vị vừa mở, như thức ăn để gọi Nông Phu |
| `EXTEND` | mở rộng số lượt/phạm vi **sử dụng** của hệ vừa mở bằng input, dụng cụ, module hoặc quyền vận hành; không đồng nghĩa trả recipe nâng Cấp kế |
| `PROTECT` | bảo vệ tài sản, tuyến hoặc năng lực vừa giành được |
| `MASTERY` | kỹ năng/tri thức giúp làm tốt hơn chính họ hành vi vừa đạt |
| `ORGANIC_TROPHY` | chiến lợi phẩm hữu cơ từ đúng mục tiêu/hệ sinh thái bị chinh phục |
| `NEXT_STEP` | mở một node chức năng kế cận—sản phẩm, công thức, tuyến hậu cần hay cơ chế phối hợp—chứ không trả miễn phí cạnh nâng `L→L+1` của chính instance vừa hoàn tất |

`functional_bridge` phải mô tả được quan hệ nhân–quả cụ thể. “Hữu ích cho lãnh địa”, “đồ hiếm nên hợp” hoặc một đoạn lore gắn thêm sau khi biết kết quả không đạt. `xây Nhà Nông Phu đầu tiên → 50 Bánh Mì` đạt `ENABLE`; `xây đường đầu tiên → trứng rồng` không có cầu nối nào và bị chặn. Mỗi slot xây dựng còn phải ghi một `newly_opened_action` cụ thể như đốt nhiên liệu, nấu mẻ đầu, xử lý gỗ, may đồ, thử quặng, rèn dụng cụ, điều trị, nghỉ, cảnh giới hoặc vận hành cổng. Nếu bỏ công trình khỏi state mà lời giải thích vẫn đúng nguyên vẹn, cầu nối quá xa và fail.

##### `UPGRADE-PROXY-BAN-1.0` — cấm thưởng lười bằng cạnh nâng kế

Với thành tựu `ConstructionCompleted`, `RepairCompleted` hoặc first-build loại suy, **không slot loại suy nào** được dùng một trong các payload sau làm phần thưởng:

- nguyên liệu thô được khai báo với mục đích trả toàn bộ hoặc một phần recipe `L→L+1` của chính công trình vừa hoàn tất;
- phiếu nâng Cấp, lượt nâng miễn phí, hoàn tất tức thời, giảm recipe/WorkUnits của cạnh kế, hoặc Bản Vẽ chỉ dùng để nâng chính instance đó;
- một bundle được đổi tên nhưng có `construction_value>0` hoặc có thể tháo/đổi lại thành vật liệu của cạnh kế.

Nguyên liệu xây dựng chỉ có thể xuất hiện khi **panel nguồn trực tiếp** ghi đúng slot ấy; khi đó nó giữ `SOURCE_EXPLICIT` và không được biến thành tiền lệ loại suy. Input vận hành được phép chỉ khi item có `usage_lock=OPERATION_ONLY`, `construction_value=0`, không salvage/convert thành vật liệu, và `bridge_explanation` chỉ ra hành động sử dụng đầu tiên. Vì vậy `xây Lò Sưởi Cấp 1 → Đá/Sắt đủ nâng Cấp 2` fail dù về mặt chữ nó “liên quan”; reward hợp lệ phải giúp đốt, giữ nhiệt, vận hành hoặc bảo vệ người dùng chứ không bỏ qua gameplay nâng cấp.

##### Sách kỹ năng từ phần thưởng Hệ Thống là slot thích nghi người nhận

`<>` quan sát được hai lần quan trọng: người đầu sửa Nhà Lãnh Chúa nhận một sách kỹ năng mà nhân vật nguồn có thể học ngay; người đầu hạ sinh vật Thống Soái nhận sách kỹ năng đúng nhánh Hàn Sương Pháp Sư của chính người nhận. Do đó tên `Băng Liệu Thuật` hay một phép Hàn Sương trong **instance nguồn** là kết quả đã resolve cho Cao Tinh, không phải payload phổ quát cho hiệp sĩ, tư tế, xạ thủ hay nghề khác.

Mọi slot `reward_family=PERSONAL_SYSTEM_SKILL_BOOK` dùng `payload_mode=RECIPIENT_ADAPTIVE` và gọi duy nhất `ACHIEVEMENT-SKILL-FIT-1.0` của File 02. Slot giữ nguyên số lượng, Phẩm, lớp kỹ năng và ngân sách hiệu ứng của mốc; resolver chỉ chọn template hợp chức nghiệp, tài nguyên, chỉ số scale, vũ khí, hệ sát thương/vai trò và thiên phú của người thật sự claim. Vật rơi hữu cơ từ boss, di vật độc bản hoặc sách được panel ghi là một template cố định dùng `ORGANIC_TROPHY/FIXED_TEMPLATE` và không bị đổi tên theo người nhận. Không được lấy ngoại lệ đó để hard-code mọi sách thưởng Hệ Thống.

##### `OPENING-CONSTRUCTION-REWARDS-2.0` — registry thưởng công trình khai cuộc

Hai hàng đầu giữ dữ kiện nguồn trực tiếp. Các hàng còn lại là `SOURCE_ANALOGY` đã đóng băng từ cùng họ first-build, với hai neo chức năng là Nhà Lãnh Chúa→công cụ cá nhân cho lãnh chúa và Nhà Nông Phu→đầu vào để dùng chức năng tuyển dân; neo giá trị khai cuộc giữ mọi payload ở dải Phổ Thông, không tự nhảy lên phần thưởng chiến công. Tất cả là thành tựu **người đầu tiên trên toàn thế giới**; một người đến sau chỉ có event công trình, không có reward bản sao.

Riêng hàng Nhà Lãnh Chúa, panel nguồn khóa một sách `Trắng` có hành động chủ động; phép chuẩn hóa `Trắng→F`, lớp Cơ bản/ngân sách 1 và chế độ thay tên theo người nhận là contract campaign có version, không được giả là thuật toán được nguyên tác công bố.

Binding đã niêm cho họ nghề cố định của Lí Lan là:

```yaml
achievement_id: ACH-OPEN-LORD-HOUSE
reward_slot_id: ACH-OPEN-LORD-HOUSE-MAIN
grade_lock: F
skill_class_lock: CO_BAN
effect_budget_lock: 1
purpose_tags: [MASTERY, PROTECT]
candidate_pool_by_job_family:
  JOB-SUM-NECRO-01:
    catalog_id: ACHPOOL-JOB-SUM-NECRO-01-1.0
    catalog_body_sha256: 67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247
    slice_map_sha256: 1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176
    slice_id: NECRO-F-CO_BAN-1
    candidate_count: 8
    candidate_pool_sha256: 0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d
    forbidden_cross_pool_template: SK-OPEN-NECRO-01
```

File 02 §2.K.1 sở hữu 198 data row, master hash và toàn bộ slice map. `OPENPOOL-JOB-SUM-NECRO-01` vẫn chỉ phục vụ `OPENING-MANA-SKILL-1.0`; Phẩm E `Tử Khí Châm` không thuộc tám ứng viên trên và không được đổi nhãn hoặc hạ xuống F. Khối binding này nằm ngoài thân bảng registry, nên `registry_body_sha256` bên dưới vẫn khóa đúng bảng chưa đổi.

`registry_body_sha256=97b022f809832ebbcf2f18df65112861ff58663cf3ff591eefefa8997cb3a82e` (UTF-8, từ hàng tiêu đề bảng dưới tới hết hàng Cổng, gồm LF cuối mỗi hàng).

| `achievement_id` | Trigger hợp lệ | Lớp | Slot chính đã khóa | `newly_opened_action` và cầu nối | Chống lối tắt |
|---|---|---|---|---|---|
| `ACH-OPEN-LORD-HOUSE` | đầu tiên tu sửa Nhà Lãnh Chúa Hư Hại | `SOURCE_EXPLICIT + RECIPIENT_ADAPTIVE` | 1 Sách Kỹ Năng cá nhân: chủ động Cơ bản, Phẩm F (`Trắng` nguồn), ngân sách 1; resolve bằng `ACHIEVEMENT-SKILL-FIT-1.0` | lãnh chúa học một kỹ năng thật sự nằm trong nghề của mình; `MASTERY/PROTECT` | giữ grade/lớp/budget, không hard-code Băng Liệu Thuật hay bất kỳ phép Mana nào cho mọi nghề |
| `ACH-OPEN-POLAR-HOUSE` | đầu tiên dựng Nhà Nông Phu Cực Địa Cấp 1 | `SOURCE_EXPLICIT` | 50 Bánh Mì | trả chi phí tuyển và khẩu phần ban đầu cho hệ dân cư vừa mở; `ENABLE` | giữ đúng 50; không đổi thành recipe nâng nhà |
| `ACH-OPEN-HEATER` | đầu tiên dựng Lò Sưởi Đơn Giản Cấp 1 | `SOURCE_ANALOGY` | `ORI-HEATER-FUEL-01` | nạp nhiên liệu khóa-vận-hành và sưởi căn phòng đầu tiên; `ENABLE` | construction value 0; không Đá/Sắt, không nâng Cấp 2 |
| `ACH-OPEN-STOVE` | đầu tiên dựng Bếp Đơn Giản Cấp 1 | `SOURCE_ANALOGY` | `ORI-STOVE-STARTER-01` | nấu hai mẻ/8 phần ăn đầu tiên bằng chính Bếp; `ENABLE/MASTERY` | nguyên liệu niêm chỉ dùng nấu; không trả recipe nâng Bếp |
| `ACH-OPEN-SAWMILL` | đầu tiên dựng Xưởng Gỗ Cấp 1 | `SOURCE_ANALOGY` | `ORI-SAW-GAUGE-01` | hiệu chỉnh năm mẻ xử lý gỗ đầu tiên; `MASTERY/EXTEND` | dụng cụ có charge, không phân giải thành Gỗ/Sắt và không giảm recipe nâng |
| `ACH-OPEN-TAILOR` | đầu tiên dựng Tiệm May Cấp 1 | `SOURCE_ANALOGY` | `ORI-TAILOR-PATTERN-01` | mở sản phẩm áo choàng chống lạnh và đủ Da Thuộc cho một ca hai món; `NEXT_STEP/ENABLE` | Bản Rập chế tạo sản phẩm, không phải Bản Vẽ nâng Tiệm May |
| `ACH-OPEN-ORE` | đầu tiên dựng Xưởng Chế Biến Quặng Cấp 1 | `SOURCE_ANALOGY` | `ORI-ORE-ASSAY-01` | thử thành phần/phẩm/nguy cơ của hai mươi stack quặng trước khi xử lý; `MASTERY/PROTECT` | thuốc thử không phải quặng/kim loại và không trả recipe nâng |
| `ACH-OPEN-FORGE` | đầu tiên dựng Lò Rèn Cấp 1 | `SOURCE_ANALOGY` | `ORI-FORGE-MOULD-01` | mở ba công thức dụng cụ sắt để dùng ca rèn đầu; `NEXT_STEP/MASTERY` | chỉ mở sản phẩm; không cấp Sắt và không nâng Lò Rèn |
| `ACH-OPEN-MEDICAL` | đầu tiên dựng Phòng Y Tế Cấp 1 | `SOURCE_ANALOGY` | `ORI-MED-SUPPLY-01` | cấp bốn lượt vật tư điều trị cho giường/ca vừa mở; `ENABLE` | thuốc chỉ là input y tế; không Gỗ/Đá/Sắt Tinh Luyện |
| `ACH-OPEN-SHELTER` | đầu tiên dựng Nơi Trú Nhỏ Cấp 1 | `SOURCE_ANALOGY` | `ORI-SHELTER-BEDDING-01` | trang bị đúng hai chỗ ngủ của công trình; `ENABLE/PROTECT` | module giường không tăng Cấp, diện tích, chỗ hay D/A công trình |
| `ACH-OPEN-FENCE` | đầu tiên nghiệm thu một đoạn Tường Rào Cấp 1 dài 10 m | `SOURCE_ANALOGY` | `ORI-FENCE-ALARM-01` | gắn cảnh báo tiếp xúc lên chính đoạn tường đầu tiên; `PROTECT` | không thêm D/A, không cấp vật liệu cho Cấp 2 |
| `ACH-OPEN-GATE` | đầu tiên dựng Cổng Cấp 1 | `SOURCE_ANALOGY` | `ORI-GATE-HORN-01` | cho người gác cổng phát cảnh báo thủ công tới lãnh địa; `PROTECT/ENABLE` | không tự phát hiện địch, không tăng Cấp/D/A và không trả recipe nâng |

Dependency khóa: `required_item_registry=OPENING-OPERATION-REWARD-ITEMS-1.0`, `required_body_sha256=967ceed464edf3f138b2a1b658288e67f86f6b01737bf9626e8413e5bb6cb4e8`. Các item `ORI-*` lấy contract duy nhất tại File 04; thiếu item, sai version/hash hoặc một item có thể chuyển thành vật liệu xây đặt toàn contract ở `ANALOGY_BLOCKED_REWARD`. Narrator không được thay item thiếu bằng “nguyên liệu tương đương”. Registry chỉ khóa phần thưởng; trigger vẫn phải thắng timestamp/phạm vi, và UI không tiết lộ hàng chưa claim.

**Sàn độ khó áp lên slot chính.** Mỗi contract phải có ít nhất một `MAIN` slot đạt `main_reward_floor`; danh vọng, tiền, danh hiệu, stack tài nguyên rẻ và slot phụ không được cộng số lượng để giả vờ bù cho một phần thưởng chính quá thấp. Trong cùng `trigger_family`, cùng epoch và cùng phạm vi, nếu thành tựu A không thấp hơn B ở mọi chiều độ khó và cao hơn ở ít nhất một chiều, thì:

\[
MainValue(A)\ge MainValue(B)
\]

So sánh dùng dải giá trị của vật phẩm/quyền năng tại **thời đại xảy ra event**, không dùng cảm giác của narrator. Nếu hai vector cắt nhau, contract phải nêu comparator cùng trade-off thay vì ép một thứ tự giả.

Các neo trực tiếp khóa thang thưởng chiến đấu:

| Mốc first-kill | Sàn/gói nguồn đã quan sát |
|---|---|
| quái hoang | cuộn tuyển mộ cùng tuyến chiến đấu |
| Tinh Anh | Bản Vẽ tháp phòng thủ + cuộn chiến lực |
| Đầu Mục | kỹ năng phẩm Tím |
| Thủ Lĩnh | kỹ năng phẩm Vàng |
| Thống Soái | kỹ năng phẩm Cam/Sử Thi |
| Thống Trị | kỹ năng Truyền Kỳ + 5 Mảnh Thần Lực |
| Bán Thần | thành tựu + công trình Truyền Kỳ + võ học Bán Thần + 100 Mảnh Thần Lực |
| Thần | công trình/vật phẩm cấp Thần + thần thuật + 1.000 Mảnh Thần Lực |
| Diệt Thế Ma gần Chân Thần | gói đa-slot cấp Thần/đặc thù và phần bổ sung của ý chí vị diện |
| Cổ Long Chân Thần | 2 Thượng Vị Thần Khí + 1 quyển phép Chân Thần + 3 Thần Cách tự chọn + các slot đặc thù cùng họ Cổ Long/tử vong |

Thang cùng họ Quân Đoàn còn cho comparator số trực tiếp: đầu tiên đạt Cấp 6 nhận 30.000 danh vọng + rương báu Quân Đoàn ngẫu nhiên; Cấp 7 nhận 50.000 + rương cùng họ; Cấp 8 nhận 100.000 + rương Quân Đoàn phẩm Cam. Đây là bằng chứng nguồn rằng milestone khó hơn tăng cả lượng phụ lẫn phẩm slot chính.

**Khả năng dùng ngay không phải giá trị.** Phần thưởng Truyền Kỳ ở mốc Thống Trị trong nguồn có thể yêu cầu Cấp 100 dù người nhận mới Cấp 50; hệ thống vẫn giữ nguyên phần thưởng. `usability_now=DELAYED_REQUIREMENT` chỉ báo điều kiện sử dụng, tuyệt đối không hạ phần thưởng xuống Bậc người nhận. Vì vậy giết rồng/Cổ Long đầu tiên mà phát đồ Bậc 2–3 là lỗi sàn giá trị, dù người nhận hiện chỉ dùng được Bậc 2–3.

Nếu không tìm được gói vừa có cầu nối chức năng vừa đạt sàn độ khó, trạng thái là `ANALOGY_BLOCKED_REWARD`: không phát trứng rồng, đồ rác hoặc pool ngẫu nhiên rồi viết lore chữa cháy. Khi backfill một contract legacy, sửa tại timestamp hiện tại và giữ nguyên lịch sử campaign; cấm rewind.

### 13.3. Xếp hạng

Không có một bộ tám bảng tuần tự động. Chỉ bảng có **hợp đồng đang hoạt động trong registry** mới được tính/hiển thị/chốt thưởng.

Hợp đồng nguồn khai cuộc hiện hành:

```yaml
ranking_contract:
  board_id: OPENING_LEVEL
  source_label: SOURCE_LOCKED_<>
  public_name: Bảng Cấp khai cuộc
  opens_at: T0 + 48h
  closes_at: T0 + 144h
  scope: PHAN_KHU
  metric: personal_level_then_progress_to_next_level
  qualification: 100 người đầu đạt Cấp 10
  displayed_fields: [real_name, level, progress]
  identity_mode: REAL_NAME
  data_delay: 3 phút
  tie_rule: completion_timestamp_then_stable_player_id
  settlement_event: EVT-RANK-OPENING-SETTLE-T0+144H
  reward_contract: RWD-OPENING-FIXED-2.0
```

`identity_mode=REAL_NAME` áp dụng đồng nhất cho mọi hàng đã đủ điều kiện, tối đa 100 hàng; không có opt-out trong hợp đồng khai cuộc. Bảng mở sau khi người sống sót đi qua ngày thứ hai, cập nhật trễ ba phút, và khóa đúng `T0+144h`. Mọi bảng khác vẫn phải chọn đúng một trong `REAL_NAME`, `PSEUDONYM`, `ANONYMOUS_ID`, `HIDDEN` trước khi mở.

Roster cạnh tranh, ngân sách độ hiếm, phase curve, `CompletionStat` và vốn quán tính qua nhiều kỳ do **File 07 — Bảng Xếp Hạng, Roster Cố Định và CompletionStat** khống chế. `CompletionStat` chỉ dự báo lịch hành động; hàng bảng và thứ tự thật vẫn lấy từ metric/timestamp đã commit theo hợp đồng này. `SAVE-T0-CLEAN` bắt đầu với `rank_rows=[]`; mọi thứ hạng, đối thủ, timestamp và momentum từ test run là `TEST_ONLY` và bị cấm nhập vào campaign canon.

### 13.4. `RWD-OPENING-FIXED-2.0` — thưởng cố định Bảng Cấp

`<>` cho đúng bảy payload dưới đây. Chúng là kết quả cuối đã niêm, **không phải input cho công thức scale**:

| Hạng | Payload cố định `SOURCE_LOCKED_<>` |
|---:|---|
| 51–100 | bánh mì 20; thuốc cơ sở 2; túi tài nguyên nhỏ 1 |
| 21–50 | thịt 10; thuốc cơ sở 4; túi tài nguyên nhỏ 2; vũ khí Trắng 1 |
| 11–20 | thịt 20; thuốc cơ sở 5; túi tài nguyên nhỏ 3; rương Hắc Thiết 1 |
| 4–10 | thịt 40; thuốc cơ sở 10; túi tài nguyên vừa 1; vũ khí Lục tự chọn 1; Trái Tim Sức Mạnh 1 |
| 3 | thịt 50; thuốc cơ sở 10; túi tài nguyên vừa 2; Thẻ Chiêu Mộ Bậc 2 ngẫu nhiên 1; vũ khí Lục 1; Trái Tim Sức Mạnh 1 |
| 2 | thịt 100; thuốc cơ sở 10; túi tài nguyên vừa 3; Thẻ Chiêu Mộ Bậc 2 ngẫu nhiên 1; vũ khí Lam 1; Trái Tim Sức Mạnh 1 |
| 1 | thịt 200; thuốc cơ sở 10; túi tài nguyên vừa 10; rương Bạch Ngân 1; Thẻ Chiêu Mộ Bậc 2 phẩm Đầu lĩnh 1; Trái Tim Sức Mạnh 1 |

Tại settlement, `E` là tập người đạt Cấp 10 trước giờ khóa; giữ tối đa 100 người sớm nhất theo `completion_timestamp_then_stable_player_id`. Nếu `|E|=0`, bảng đóng rỗng và không materialize thưởng. Với mỗi người đủ điều kiện, engine chỉ tra dải hạng và copy payload đúng một lần.

- Số lượng luôn đúng số nguồn: không còn `T_anchor`, `T_med`, `offset`, `1.35^n`, multiplier theo Bậc người nhận, khoảng cách với hạng 2, CompletionStat, sức mạnh trung vị hoặc số người dự thi.
- “Thẻ Chiêu Mộ Bậc 2” luôn là **Bậc 2**. Vũ khí Trắng/Lục/Lam, rương Hắc Thiết/Bạch Ngân, cỡ túi, Trái Tim Sức Mạnh và mọi số lượng giữ đúng literal của hàng.
- Slot “ngẫu nhiên” chỉ chọn template trong pool **đúng Bậc 2 và đúng Phẩm/loại đã nêu**; pool sắp theo `template_id`, niêm `candidate_pool_hash`, rồi dùng `Hash64(settlement_event+recipient_id+reward_slot_id+"RECRUIT-TEMPLATE")`. Pool rỗng chặn riêng slot và báo blocker; cấm hạ Bậc/Phẩm, đổi họ hoặc phát vật thay thế.
- Người nhận chưa dùng được vật phẩm chỉ nhận `usability_now=DELAYED_REQUIREMENT`; tuyệt đối không hạ phẩm hoặc đổi thưởng. Người hạng 1 có thể vượt hạng 2 nhiều Bậc nhưng vẫn chỉ nhận đúng payload hạng 1 nói trên.
- Kết quả materialize một lần trong `EVT-RANK-OPENING-SETTLE-T0+144H`, lưu recipient, rank band, từng instance, payload hash và `rule_version=RWD-OPENING-FIXED-2.0`; không reroll sau khi xem.

Các bảng tiến trình chức nghiệp, tốc độ nâng Lửa Sinh Tồn, thịnh vượng, quân sự, thương mại, khám phá hoặc đóng góp **không hoạt động mặc định**. Chỉ entry tương ứng trong `CANON-EVENT-LEDGER-4.0` được mở board đã niêm. Mỗi board phải có `activity_id/board_id`, nguồn, cửa thời gian, eligible population, metric, score formula, identity mode, tie rule, anti-exploit, reward source, **bảng payload cố định cho mọi dải hạng** và settlement event. Thiếu bất kỳ trường nào thì trạng thái `INVALID_EVENT_CONTRACT`, không mở board. Cấm mọi reward scaling theo recipient tier, median tier, khoảng cách điểm/hạng, CompletionStat hoặc sức mạnh người dẫn đầu.

## 14. Chu kỳ phiên bản và lịch sự kiện

### 14.1. Các pha dài hạn

| Pha | Mục tiêu | Mở hệ thống | Nguy cơ chính |
|---|---|---|---|
| P0 Giáng lâm | Hiểu sinh tồn | Panel cơ bản, nhóm, Lửa Trại Cấp 1 | Nhiệt/nước/hoảng loạn |
| P1 Khai cuộc | Dựng vòng sống dưới bảo hộ chung | Xây nền, nghề cơ bản, chat cục bộ | Sai phân công, cạn vật tư |
| P2 Khai hoang | Ra khỏi vùng an toàn | Chợ, bản đồ, tổ đội, rank | Quái, người chơi, tai nạn |
| P3 Tiếp xúc | Gặp NPC bản địa | Ngoại giao, danh tiếng, ngôn ngữ | Xung đột pháp lý/văn hóa |
| P4 Hợp khu | Tăng mật độ | Kênh vùng, liên minh, đấu giá | Chiến tranh và độc quyền |
| P5 Quốc gia | Lãnh địa thành chính thể | Thuế, chư hầu, luật, tiền | Nội chiến, chính danh |
| P6 Thế giới | Đại sự kiện | Liên lục địa, kỳ quan | Tai họa quy mô nền văn minh |
| P7 Liên giới | Mở thế giới khác | Cổng, luật giao thoa | Ô nhiễm quy tắc, đế quốc hóa |

### 14.2. Lịch tick mặc định

`WORLD-CLOCK-2.0 — USER_LOCKED`: một ngày thế giới luôn dài **24 giờ**. `T0=07:00` của Ngày 1. Hệ thống chốt sổ nội dung/phiên bản và mở nội dung ngày mới lúc **07:00**; hồ Tử Khí Ngôi Mộ hồi đầy riêng lúc **00:00**. Đêm dài hơn ngày do tính hàn phong: vùng khởi đầu mặc định bình minh 07:00, hoàng hôn 16:30, hết chạng vạng 17:00. Daylight dài 9 giờ 30 phút; đêm từ hoàng hôn tới bình minh dài 14 giờ 30 phút, gồm 30 phút chạng vạng và 14 giờ tối hoàn toàn. Weather có thể giảm ánh sáng hiệu dụng nhưng không đổi hai system clock.

| Nhịp | Cập nhật |
|---|---|
| 1 giây | Chiến đấu, trạng thái nguy cấp và hồi/hao Mana cá nhân; chỉ vùng đang hoạt động. Khi time-skip, `MANA-RECOVERY-1.0` được tích phân theo đoạn thay vì bỏ qua tick. |
| 1 phút | Năng lượng tức thời, nhiệt, cảnh báo, vị trí đội. |
| 1 giờ | Ca làm, sản xuất nhỏ, thời tiết địa phương, tiêu hao hành quân. |
| 00:00 hằng ngày | Đặt hồ Tử Khí của từng Ngôi Mộ về cap hiện hành; Tử Phục trực tiếp không có hồ/lượt để hồi. |
| 07:00 hằng ngày | Chốt sổ ngày cũ; khẩu phần, bệnh, tinh thần, giá Chợ, nhiệm vụ ngày; công bố và kích hoạt nội dung/phiên bản ngày mới. Công trình không có tick bảo trì/hao mòn. |
| 7 ngày | Lương, tăng trưởng sinh vật, caravan và phe phái; chỉ chốt rank nếu một hợp đồng đang hoạt động có `settles_at` đúng mốc. |
| 28–35 ngày | Thuế, mùa vụ nhỏ, thách thức khu vực, ngân sách. |
| 1 mùa | Khí hậu, mùa màng, di cư, chiến dịch, cập nhật lớn. |
| 1 năm | Dân số, tuổi, giáo dục, thay đổi chính trị, đại hội/thuế lớn. |

### 14.3. `CANON-EVENT-LEDGER-4.0` — sổ sự kiện toàn truyện bắt buộc

> **Trạng thái: `USER_LOCKED/CANON_STORY`.** Tác phẩm `<>` đã hoàn tất; registry này thay hoàn toàn lịch 12 tuần tạm trước đây. Thứ tự, nội dung, các khoảng thời gian được nguồn nói thẳng và payload nguồn đều là `SOURCE_LOCKED`. Chỗ nguồn chỉ cho thứ tự/chương mà không cho timestamp tuyệt đối được **Loại suy một lần** thành `SOURCE_ANALOGY/CAMPAIGN_FIXED`; con số sau khi ghi vào bảng là hằng số campaign, không chạy theo Cấp trung vị, không dời vì Lí Lan mạnh/yếu và không reroll giữa run.

`T0=07:00 Ngày 1`. Mọi offset dưới đây là giờ thế giới và rơi vào 07:00. `locks_at` đóng ghi điểm/drop sơ cấp; `resolves_at` là hạn cuối nhận thưởng và đổi shop. Ngay tại `resolves_at`, toàn bộ template `EVENT_EXCLUSIVE:<event_id>` chuyển `EXPIRED_PRIMARY_SOURCE` theo File 04 §12.11. `NONE_BY_SOURCE` là giá trị đóng, không phải ô trống.

#### 14.3.1. Lịch tuyệt đối và dấu vết nguồn

| `event_id` | Sự kiện canon / neo chương `<>` | `opens_at` | `locks_at` | `resolves_at=shop_closes_at` | Cơ sở thời gian |
|---|---|---:|---:|---:|---|
| `EV00-SAFE-FIRE` | Bảo hộ khai cuộc, giữ Lửa; ch.1–117 | T0+0h | T0+144h | T0+144h | `SOURCE_LOCKED` 6 ngày |
| `EV01-OPENING-LEVEL` | Bảng Cấp mở ngày 3; ch.25/90 | T0+48h | T0+144h | T0+144h | `SOURCE_LOCKED` |
| `EV02-DRAGON-REVIVAL` | Băng Long phục sinh, tổ và Long Ấn; ch.69–201 | T0+144h | T0+312h | T0+336h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` 7 ngày + 1 ngày đổi |
| `EV03-ICE-HORN` | Nhánh Sừng Băng Long và rương chuyên đề; ch.148–179 | T0+192h | T0+264h | T0+288h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` 3 ngày + 1 ngày nhận |
| `EV04-FIRST-MERGE-DRAGON-POINTS` | Gộp 10 khu, Bảng Điểm Băng Long; ch.202–280 | T0+312h | T0+552h | T0+576h | `SOURCE_LOCKED` 10 ngày + 1 ngày đổi |
| `EV05-ANNO-FISHING` | Câu cá sông Anno; ch.260–269 | T0+408h | T0+480h | T0+504h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV06-CONSTRUCTION-WEEK` | Tuần xây dựng sau settlement; ch.280 | T0+552h | T0+720h | T0+720h | `SOURCE_LOCKED` 7 ngày |
| `EV07-KINGDOM-WRATH` | Cơn thịnh nộ của Vương quốc; ch.311–316 | T0+720h | T0+792h | T0+816h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV08-WORLD-BOSS` | Khiêu chiến Boss Thế Giới và shop điểm; ch.361–377 | T0+792h | T0+864h | T0+888h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV09-ORACLE-WAR` | Chiến tranh Thần Dụ bốn phe; ch.424–453 | T0+864h | T0+936h | T0+960h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV10-MONSTER-SIEGE` | Phát triển lãnh địa và quái công thành; ch.455–480 | T0+936h | T0+1104h | T0+1128h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` 7 ngày + 1 ngày nhận |
| `EV11-MIST-DISASTER` | Tai họa sương mù; ch.515–527 | T0+1104h | T0+1200h | T0+1224h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV12-LEGION-RACE` | Lập Quân Đoàn, đổi điểm và đua Cấp 6–8; ch.549–552 | T0+1200h | T0+1368h | T0+1392h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV13-BLOOD-CHAOS` | Huyết Loạn, hệ thống chiến công; ch.584–653 | T0+1368h | T0+1536h | T0+1560h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` 7 ngày + 1 ngày đổi |
| `EV14-DREAM-SHARD` | Mộng Cảnh Toái Tầng 100 tầng; ch.666, 803–818 | T0+1560h | T0+3960h | T0+3984h | `SOURCE_LOCKED` 100 ngày + 1 ngày đổi |
| `EV15-SKORK-RAT` | Tai họa chuột Skork; ch.819–830 | T0+3984h | T0+4152h | T0+4176h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV16-GIANT-CITY` | Khánh điển Cự Thành; ch.831–840 | T0+4176h | T0+4248h | T0+4272h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV17-NORTH-UNIFICATION` | Chiến tranh thống nhất phương Bắc; ch.841–868 | T0+4272h | T0+4440h | T0+4464h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV18-LIGHT-GOD-FINAL` | Hoạt động cuối của Quang Minh Thần; ch.869–891 | T0+4464h | T0+4632h | T0+4656h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV19-ICE-SNOW-CHOICE` | Biển Đóng Băng, lựa chọn Băng/Tuyết; ch.900–920 | T0+4656h | T0+4824h | T0+4848h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV20-DEEP-SEA-ARK` | Vòng Quay May Mắn và Thiên Vận Thâm Hải Chu; ch.932–948 | T0+4848h | T0+4920h | T0+4944h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV21-WEST-CHURCH-WAR` | Chiến tranh Giáo hội Tây Đại Lục; ch.1016–1040 | T0+4944h | T0+5112h | T0+5136h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV22-ANCIENT-DRAGON-P1` | Cổ Long/Mirror Territory pha 1; ch.1067–1109 | T0+5136h | T0+5208h | T0+5232h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV23-ANCIENT-DRAGON-P2` | Cổ Long/Mirror Territory pha 2; ch.1110–1138 | T0+5232h | T0+5304h | T0+5328h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV24-DRAGON-FESTIVAL` | Đấu trường và Lễ hội Rồng; ch.1137–1158 | T0+5328h | T0+5496h | T0+5520h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV25-ABYSS-EXPEDITION` | Viễn chinh Vực Sâu, quest SS; ch.1166–1181 | T0+5520h | T0+5688h | T0+5712h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV26-GODS-CHAOS` | Chư Thần Hỗn Loạn và thăng thần; ch.1186–1199 | T0+5712h | T0+5880h | T0+5904h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV27-WORLD-PROTECTOR` | Đếm ngược Hỗn Độn, Người Bảo Hộ Thế Giới; ch.1220–1285 | T0+5904h | T0+6072h | T0+6096h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV28-ANCIENT-DRAGON-HUNT` | Cột mốc diệt Cổ Long; ch.1292–1299 | T0+6096h | T0+6168h | T0+6192h | `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| `EV29-FINAL-CALAMITY` | Bản cập nhật cuối, đại kiếp và kết truyện; ch.1340–1352 | T0+6192h | T0+6360h | T0+6384h | `SOURCE_ANALOGY/CAMPAIGN_FIXED`; hậu truyện mở sau resolve |

#### 14.3.2. Nội dung, board, thưởng và shop đã materialize

| `event_id` | Nội dung/điều kiện và tác động bắt buộc | Board/metric cố định | Thưởng cố định | Shop |
|---|---|---|---|---|
| `EV00-SAFE-FIRE` | bảo hộ doanh địa tới +144h; Lửa tắt vẫn chịu lạnh/đói nhưng không bị PvP xuyên bảo hộ | `NO_RANK_BOARD` | quyền bảo hộ đúng 144h; không có item thưởng | `NONE_BY_SOURCE` |
| `EV01-OPENING-LEVEL` | 100 người đầu đạt Cấp 10; bảng mở +48h | `OPENING_LEVEL`; Cấp rồi tiến độ, tie timestamp/ID | `RWD-OPENING-FIXED-2.0` §13.4 | `NONE_BY_SOURCE` |
| `EV02-DRAGON-REVIVAL` | tổ Băng Long xuất hiện; phá tổ/giết thủ lĩnh nhận Long Ấn | `NO_RANK_BOARD`; điểm chỉ là tiền shop | chest/loot dùng `EVP-ICE-DRAGON-1.0` | `SHOP-DRAGON-2.0` |
| `EV03-ICE-HORN` | lần theo sừng, hạ mục tiêu và mở rương chuyên đề | `NO_RANK_BOARD` | `RWD-ICE-HORN-SOURCE-1.0`: payload Hoàng Kim năm dòng tại File 04 §12.10 | dùng `SHOP-DRAGON-2.0` đang mở |
| `EV04-FIRST-MERGE-DRAGON-POINTS` | gộp đúng 10 khu; trong 10 ngày: phá tổ +1, giết boss tổ +1, thủ lĩnh +5 | `ICE_DRAGON_POINTS`; tổng điểm rồi timestamp chạm tổng | `RWD-DRAGON-POINTS-FIXED-1.0` bảng dưới | `SHOP-DRAGON-2.0` |
| `EV05-ANNO-FISHING` | câu cá sông Anno; cân cá hợp lệ tại bến niêm phong | `ANNO_FISH_WEIGHT`; tổng khối lượng, tie cá đơn nặng nhất rồi timestamp | `RWD-FISH-FIXED-1.0` bảng dưới | `SHOP-FISH-1.0` |
| `EV06-CONSTRUCTION-WEEK` | toàn cầu `BuildSpeed×1,20`, `BasicResourceGather×1,20`; không giảm recipe | `NO_RANK_BOARD` | chính hai buff đủ 168h; không thêm rương | `NONE_BY_SOURCE` |
| `EV07-KINGDOM-WRATH` | chuỗi mục tiêu vương quốc, hộ tống/đánh chặn theo quest đã khóa | `NO_RANK_BOARD` | payload quest cố định theo `QUEST-PAYLOAD-LL01-1.0`; không roll rương phụ | `NONE_BY_SOURCE` |
| `EV08-WORLD-BOSS` | boss thế giới nhiều pha; điểm theo damage hữu hiệu, cứu viện và objective, chống farm add | `WORLD_BOSS_CONTRIBUTION`; tổng contribution committed | `RWD-WORLD-BOSS-FIXED-1.0` bảng dưới | `SHOP-WORLD-BOSS-1.0` |
| `EV09-ORACLE-WAR` | bốn phe, pha ngày và mục tiêu chiếm giữ; khóa phe khi vào | `ORACLE_FACTION_CONTRIBUTION`; điểm mục tiêu/giết/cứu viện | `RWD-ORACLE-FIXED-1.0` bảng dưới | `SHOP-ORACLE-1.0`; nhánh Bí Mật chỉ cho người mở khóa |
| `EV10-MONSTER-SIEGE` | bảy ngày sóng quái; giữ Lửa, dân và công trình mục tiêu | `SIEGE_DEFENSE`; điểm mục tiêu sống + quái hợp lệ, trừ dân chết | `RWD-SIEGE-FIXED-1.0` bảng dưới | `SHOP-SIEGE-1.0` |
| `EV11-MIST-DISASTER` | sương che tầm, cứu đoàn lạc và đóng nguồn sương | `NO_RANK_BOARD` | hoàn tất: Bùa Dẫn Sương ×1, thuốc giải sương ×10, danh vọng 5.000 | `NONE_BY_SOURCE` |
| `EV12-LEGION-RACE` | lập Quân Đoàn và đạt Cấp 6/7/8 trước hạn | `LEGION_LEVEL_MILESTONE`; first timestamp mỗi mốc | Cấp 6: 30.000 danh vọng + rương Quân Đoàn ngẫu nhiên; Cấp 7: 50.000 + rương cùng họ; Cấp 8: 100.000 + rương Quân Đoàn phẩm Cam | `SHOP-LEGION-1.0` |
| `EV13-BLOOD-CHAOS` | giết quân Huyết: thường `Bậc×1`, đội trưởng `×10`, thập phu `×100`, bách phu `×1.000`, thiên phu `×10.000`, vạn phu Truyền Kỳ `Bậc×1.000.000` chiến công | `BLOOD_MERIT`; chiến công thật, tie last qualifying kill timestamp | `RWD-BLOOD-FIXED-1.0` bảng dưới | `SHOP-BLOOD-1.0` |
| `EV14-DREAM-SHARD` | 100 tầng/100 ngày, mỗi lãnh chúa 1 lượt vào/ngày; giết quái, giải đố, hạ pháo đài nhận mảnh | `DREAM_REGION_FIRST_CLEAR`; tầng cao nhất rồi thời điểm first-clear | mỗi first-clear: `tầng×100` Mảnh Mộng; buff khóa theo mốc `Thợ Săn Mộng/Mộng Hành Giả/Kẻ Nuốt Mộng` | `SHOP-DREAM-1.0` |
| `EV15-SKORK-RAT` | phá ổ, chặn lây bệnh và diệt thủ lĩnh Skork | `SKORK_PURGE`; ổ hợp lệ + cứu dân − lây nhiễm | `RWD-SKORK-FIXED-1.0` bảng dưới | `SHOP-SKORK-1.0` |
| `EV16-GIANT-CITY` | khánh điển, đấu nghề và giao thương trong Cự Thành | `GIANT_CITY_GAMES`; tổng ba môn đã đăng ký, tie best single event | `RWD-GIANT-GAMES-FIXED-1.0`: hạng 1 Cúp Cự Thành + rương Hoàng Kim lễ hội + 30.000 phiếu; hạng 2 rương Bạch Ngân + 20.000; hạng 3 rương Bạch Ngân + 10.000; 4–10 rương Thanh Đồng + 5.000 | `SHOP-GIANT-FESTIVAL-1.0` |
| `EV17-NORTH-UNIFICATION` | chuỗi chiến dịch thống nhất; lãnh thổ chỉ đổi theo objective settle | `NO_PERSONAL_RANK`; bảng chiến dịch theo phe | phe thắng: quyền thương lộ Bắc + danh vọng 100.000; cá nhân nhận payload quest đã niêm theo contribution band | `SHOP-NORTH-CAMPAIGN-1.0` |
| `EV18-LIGHT-GOD-FINAL` | đóng tế đàn, lựa chọn xử lý di sản Quang Minh | `NO_RANK_BOARD` | Thánh Huy Bảo Hộ ×1, Mảnh Thần Lực ×20, lựa chọn một thánh vật trong ba item đã niêm | `SHOP-LIGHT-RELIC-1.0` |
| `EV19-ICE-SNOW-CHOICE` | chọn Băng hoặc Tuyết một lần; route và kháng hệ theo lựa chọn | `ICE_SNOW_FACTION`; contribution cùng phe | phe thắng nhận buff 30 ngày; top 1/2/3 nhận lần lượt rương Hoàng Kim/2 Bạch Ngân/1 Bạch Ngân chuyên hệ; 4–100 nhận Thanh Đồng chuyên hệ | `SHOP-ICE-SNOW-1.0` |
| `EV20-DEEP-SEA-ARK` | quest S tìm và vận hành Thiên Vận Thâm Hải Chu; roulette dùng pool đã niêm | `NO_RANK_BOARD` | hoàn tất: quyền lên Chu, Hải Đồ Cổ ×1, chìa khoang niêm ×1 | `SHOP-DEEP-SEA-1.0`; roulette không phải rank reward |
| `EV21-WEST-CHURCH-WAR` | chiến tranh Giáo hội; phá supply, giải phóng/giữ thành, bảo vệ dân | `WEST_WAR_FACTION`; objective contribution | phe thắng: 1 quyền hiệp ước; top 1/2/3: rương Hạo Nguyệt/Hoàng Kim/Hoàng Kim thánh chiến; 4–10 Bạch Ngân; 11–100 Thanh Đồng | `SHOP-WEST-WAR-1.0` |
| `EV22-ANCIENT-DRAGON-P1` | Mirror Territory pha 1; nghề, shop và objective mở theo nguồn | `ANCIENT_DRAGON_P1`; điểm objective pha 1 | cộng vào `RWD-ANCIENT-COMBINED-FIXED-1.0`, chưa phát sớm | `SHOP-ANCIENT-P1-1.0` |
| `EV23-ANCIENT-DRAGON-P2` | Mirror Territory pha 2; chốt tổng hai pha | `ANCIENT_DRAGON_TOTAL`; `P1+P2`, tie P2 rồi timestamp | `RWD-ANCIENT-COMBINED-FIXED-1.0` bảng dưới | `SHOP-ANCIENT-P2-1.0` |
| `EV24-DRAGON-FESTIVAL` | đấu trường và lễ hội Rồng; bracket đã niêm | `DRAGON_ARENA`; thắng trận rồi strength-of-schedule, không scale thưởng | quán quân: rương Hạo Nguyệt Lễ Rồng + Mảnh Long Hồn ×30; á quân Hoàng Kim +20; hạng 3 Hoàng Kim +10; 4–16 Bạch Ngân +5 | `SHOP-DRAGON-FESTIVAL-1.0` |
| `EV25-ABYSS-EXPEDITION` | viễn chinh Vực Sâu và quest SS; đóng cổng trước hạn | `NO_RANK_BOARD` | payload quest SS đã niêm: Hạch Vực Sâu ×1, Mảnh Thần Lực ×30, rương Hoàng Kim Vực Sâu ×1 | `SHOP-ABYSS-1.0` |
| `EV26-GODS-CHAOS` | Chư Thần Hỗn Loạn; chọn quyền năng/kháng cự và điều kiện thăng thần | `NO_RANK_BOARD` | mỗi route một payload cố định; không đổi route sau reveal | `SHOP-GOD-SHARD-1.0` |
| `EV27-WORLD-PROTECTOR` | đếm ngược Hỗn Độn, phòng tuyến thế giới và Destroyer | `WORLD_DEFENSE`; objective toàn server, không xếp reward theo chênh điểm cá nhân | mốc 25/50/75/100% phát gói server cố định; người hoàn thành capstone nhận Ấn Người Bảo Hộ ×1 | `SHOP-WORLD-PROTECTOR-1.0` |
| `EV28-ANCIENT-DRAGON-HUNT` | săn Cổ Long và world-first hợp lệ | `ANCIENT_DRAGON_HUNT`; first valid kill rồi contribution | first kill: 2 Thượng Vị Thần Khí + 1 quyển phép Chân Thần + 3 Thần Cách tự chọn + slot Cổ Long/tử vong đã niêm; không scale | `NONE_BY_SOURCE` |
| `EV29-FINAL-CALAMITY` | bản cuối, đại kiếp, phá vòng và hậu truyện | `NO_RANK_BOARD` | kết cục và di sản theo File 05; không rơi loot ngẫu nhiên sau đòn cuối | `NONE_BY_SOURCE` |

#### 14.3.3. Hai bảng thưởng nguồn cố định

`RWD-DRAGON-POINTS-FIXED-1.0` dùng đúng payload `<>`; mọi Bản Vẽ, rương, vũ khí và quyển triệu hồi mang `EVENT_EXCLUSIVE:EV04-FIRST-MERGE-DRAGON-POINTS`.

| Hạng | Payload cố định |
|---:|---|
| 10.000–5.000 | Bản Vẽ Tường Băng Sơ Cấp ×1; Quyển Triệu Hồi Binh Sĩ Đế Quốc Bậc 1 ×5; trang bị Tử ngẫu nhiên ×1; Long Ấn ×1.000 |
| 4.999–1.000 | Bản Vẽ Tường Băng Sơ Cấp ×1; Bản Vẽ Tường Băng Trung Cấp ×1; vũ khí Tử ngẫu nhiên ×1; Quyển Binh Sĩ Đế Quốc Bậc 1 ×10; Long Ấn ×2.000 |
| 999–100 | hai Bản Vẽ Tường Băng; vũ khí Tử Cấp 20 tự chọn ×1; Quyển Binh Sĩ Đế Quốc Bậc 2 ×10; Long Ấn ×5.000 |
| 99–50 | hai Bản Vẽ Tường Băng; Rương Bạch Ngân Phủ Sương ×1; vũ khí Tử Cấp 20 tự chọn ×1; Quyển Cung Thủ Đế Quốc Bậc 2 ×10; Long Ấn ×10.000 |
| 49–10 | hai Bản Vẽ Tường Băng; Rương Bạch Ngân Phủ Sương ×1; vũ khí Tử tự chọn ×1; Quyển Sinh Vật Tinh Anh Bậc 2 ×3; Long Ấn ×20.000 |
| 9–4 | hai Bản Vẽ Tường Băng + hai Bản Vẽ Tháp Tên Băng Sơ/Trung; Rương Bạch Ngân Phủ Sương ×1; vũ khí Tử tự chọn ×1; Quyển Sinh Vật Tinh Anh Bậc 2 ×3; Long Ấn ×30.000 |
| 3 | bốn Bản Vẽ trên; Rương Hoàng Kim sự kiện ×1; vũ khí Tử tự chọn ×1; Quyển Chiến Sĩ Long Huyết Bậc 2 phẩm Boss ×1; Long Ấn ×50.000 |
| 2 | bốn Bản Vẽ trên; Rương Hoàng Kim sự kiện ×1; vũ khí Hoàng Kim nghề nghiệp tự chọn ×1; Quyển Chiến Sĩ Long Huyết Bậc 2 phẩm Đầu Lĩnh ×1; Long Ấn ×70.000 |
| 1 | bốn Bản Vẽ trên; Rương Hoàng Kim sự kiện ×1; một mảnh Bộ Băng Long tự chọn ×1; Quyển Chiến Sĩ Long Huyết Bậc 2 phẩm Thống Lĩnh ×1; Long Ấn ×100.000 |

Mọi slot “ngẫu nhiên/tự chọn” ở bảng trên có pool cụ thể niêm trước khi event mở. Chênh điểm, Bậc người nhận và sức mạnh hạng 2 không thay bất kỳ dòng hoặc số lượng nào.

#### 14.3.4. Bảng thưởng Loại suy đã cố định cho các board còn lại

Các gói sau mang `SOURCE_ANALOGY/CAMPAIGN_FIXED`; chúng mượn cấu trúc dải cố định của Bảng Cấp và Bảng Điểm Băng Long, **không** dùng multiplier.

| Reward contract | Hạng 1 | Hạng 2 | Hạng 3 | Hạng 4–10 | Hạng 11–100 |
|---|---|---|---|---|---|
| `RWD-FISH-FIXED-1.0` | Cần Câu Hàn Giang Hoàng Kim; Bản Vẽ Bến Cá Băng; 30.000 Phiếu Cá | Cần Câu Hàn Giang Tử; 20.000 Phiếu | Lưới Tinh Xảo Tử; 12.000 Phiếu | Rương Thanh Đồng Câu Cá; 5.000 Phiếu | Hộp Mồi Anno ×10; 1.000 Phiếu |
| `RWD-WORLD-BOSS-FIXED-1.0` | Rương Hạo Nguyệt Boss; Trái Tim Sức Mạnh Chuyên Gia; Quyển Triệu Hồi Bậc 3 phẩm Thống Lĩnh; 100.000 điểm | Rương Hoàng Kim Boss; Quyển Bậc 3 phẩm Đầu Lĩnh; 70.000 | Rương Hoàng Kim Boss; Quyển Bậc 3 phẩm Boss; 50.000 | Rương Bạch Ngân Boss; vũ khí Tử tự chọn; 20.000 | Rương Thanh Đồng Boss; vật liệu boss ×10; 5.000 |
| `RWD-ORACLE-FIXED-1.0` | Tử Tinh Long Hồn Kiếm Hoàng Kim; Bộ Huyền Tinh Hoàng Kim; 100.000 điểm phe | Lôi Vân Liệt Địa Phủ Hoàng Kim; một bộ Huyền Tinh; 70.000 | Long Vân Trượng Hoàng Kim; một bộ Tử Tinh; 50.000 | một bộ Tử Tinh Tử; 20.000 | một bộ Long Tinh Lam; 5.000 |
| `RWD-SIEGE-FIXED-1.0` | Rương Hoàng Kim Thành Thủ; Bản Vẽ Tháp Phòng Thủ Trung Cấp; Trái Tim Sức Mạnh Chuyên Gia | Rương Bạch Ngân Thành Thủ; Bản Vẽ Tường Gia Cố | Rương Bạch Ngân; Quyển Vệ Binh Bậc 3 phẩm Boss | Rương Thanh Đồng; bộ sửa thành ×20 | bộ sửa thành ×10; thuốc trị thương ×10 |
| `RWD-BLOOD-FIXED-1.0` | Bộ Huyết Quân Cam; Trái Tim Sức Mạnh Đại Sư; Rương Hạo Nguyệt Huyết Loạn; 1.000.000 chiến công | Bộ Huyết Quân Hoàng Kim; Trái Tim Chuyên Gia; 700.000 | vũ khí Huyết Hoàng Kim; Trái Tim Chuyên Gia; 500.000 | Rương Hoàng Kim Huyết; trang bị Tử tự chọn; 200.000 | Rương Bạch Ngân Huyết; thuốc kháng huyết độc ×20; 50.000 |
| `RWD-SKORK-FIXED-1.0` | Khiên Nha Thử Hoàng Kim; Bản Vẽ Trạm Khử Dịch; 100.000 Nanh | Áo Choàng Da Skork Tử; 70.000 | Quyển Triệu Hồi Thợ Săn Skork Bậc 4 phẩm Boss; 50.000 | Rương Bạch Ngân Skork; 20.000 | thuốc khử dịch ×10; 5.000 |
| `RWD-ANCIENT-COMBINED-FIXED-1.0` | một mảnh Bộ Cổ Long tự chọn; Quyển Triệu Hồi Long Tướng phẩm Thống Lĩnh; Rương Hạo Nguyệt Kính Giới; 1.000.000 Cổ Ấn | vũ khí Cổ Long tự chọn; Quyển Long Tướng phẩm Đầu Lĩnh; 700.000 | Rương Hạo Nguyệt; Quyển Long Tướng phẩm Boss; 500.000 | Rương Hoàng Kim; Mảnh Long Hồn ×30; 200.000 | Rương Bạch Ngân; Mảnh Long Hồn ×10; 50.000 |

#### 14.3.5. Shop registry — giá, giới hạn và exclusivity

Mọi hàng shop dưới đây mang `EVENT_EXCLUSIVE:<event_id>` tương ứng, trừ tiền tệ tiêu hao. `limit` là theo tài khoản trong event; `∞` nghĩa nguồn cho phép không giới hạn. Không hàng nào đi vào rương thường.

| Shop | Hàng hóa niêm phong — giá / limit |
|---|---|
| `SHOP-DRAGON-2.0` | Rương Thanh Đồng Băng Giá 200 Long Ấn/100; Bạch Ngân Phủ Sương 2.000/20; Hoàng Kim Hàn Quang 100.000/3; Hạo Nguyệt Kết Tinh 500.000/1; Tháp Sương Sơ Cấp 10.000/1; Tháp Cầu Tuyết Sơ Cấp 20.000/1; Tháp Sương Trung Cấp 100.000/1; Tháp Cầu Tuyết Trung Cấp 150.000/1; Trại Huấn Luyện Chiến Sĩ Long Huyết 200.000/1; Máy Bắn Sương 300.000/1; Tường Băng Cao Cấp 500.000/1; Trái Tim Sức Mạnh Sơ Cấp 1.000/∞; Sổ Huấn Luyện Long Huyết 3.000/∞; Quyển Long Huyết Bậc 2 thường 5.000/20, Tinh Anh 20.000/5, Boss 100.000/1; Quặng Long Thạch 1.000/∞; Trái Tim Sức Mạnh Trung Cấp 10.000/∞; Nam Châm Băng Hà Hoàng Kim 100.000/1; Long Thạch Cam 300.000/1 |
| `SHOP-FISH-1.0` | Hộp Mồi Anno 100 Phiếu/50; Lưỡi Câu Băng 500/10; Lưới Sông Tinh Xảo 2.000/5; Cần Câu Hàn Giang Tử 20.000/1; Bản Vẽ Bến Cá Băng 50.000/1; Rương Câu Cá Bạch Ngân 10.000/3 |
| `SHOP-WORLD-BOSS-1.0` | binh Bậc 3 cơ sở 100 điểm/1.000; Cung Thủ Đế Quốc 150/500; chiến binh/kỵ xạ chủng tộc 300/1.000; tiên phong 400/500; sát thủ bóng 500/300; Kỵ Sĩ Bàn Tay Bạc, kiếm sĩ Tinh Quốc, học đồ nguyên tố, thích khách Vân, vu y bộ lạc, chiến binh lùn 1.000/100; vòng quay niêm 200/500/1.000/5.000/50.000/100.000 điểm, trong đó mức 50.000 bảo đảm Hoàng Kim và 20% Cam, mức 100.000 bảo đảm Cam |
| `SHOP-ORACLE-1.0` | Tử Tinh Long Hồn Kiếm Hoàng Kim 50.000/5; Lôi Vân Liệt Địa Phủ 70.000/5; Tử Tinh Long Vân Trượng 100.000/3; Liệt Lôi Trường Cung 100.000/3; set Long Tinh Lam 1.000/mảnh hoặc 4.000/bộ, limit 1.000; set Tử Tinh Tử 5.000/mảnh hoặc 20.000/bộ, limit 100; set Huyền Tinh Hoàng Kim 20.000/mảnh hoặc 80.000/bộ, limit 30; Trái Tim Sức Mạnh Cao Cấp 10.000/∞, Chuyên Gia 30.000/1.000, Đại Sư 100.000/50; Huy Hiệu Thành Thạo Chuyên Gia 100.000/10; Tim Rồng 2.000.000/5; huyết và vảy Krakato 10.000.000/món/1. Nhánh này chỉ mở với eligibility Bí Mật; shop bốn phe dùng set cùng họ và trần Trái Tim Cao Cấp |
| `SHOP-SIEGE-1.0` | bộ sửa thành 500 điểm/100; thuốc trị thương 1.000/50; Bản Vẽ Tường Gia Cố 10.000/1; Bản Vẽ Tháp Phòng Thủ Trung Cấp 50.000/1; Quyển Vệ Binh Bậc 3 thường 5.000/20, Tinh Anh 20.000/5, Boss 100.000/1 |
| `SHOP-LEGION-1.0` | cờ hiệu 1.000 danh vọng/1; kho quân đoàn 10.000/1; trại luyện quân đoàn 30.000/1; rương Quân Đoàn Thanh Đồng 5.000/10, Bạch Ngân 25.000/3, Hoàng Kim 100.000/1 |
| `SHOP-BLOOD-1.0` | Trái Tim Sức Mạnh Cao Cấp 10.000 chiến công/∞, Chuyên Gia 30.000/1.000, Đại Sư 100.000/50; set Huyết Vệ Tử 20.000/bộ/100; set Huyết Quân Hoàng Kim 100.000/bộ/30; set Huyết Chủ Cam 500.000/bộ/3; thuốc kháng huyết độc 1.000/100; Bản Vẽ Trạm Tịnh Huyết 200.000/1 |
| `SHOP-DREAM-1.0` | Vũ khí Chức Mộng 20.000 Mảnh Mộng/1 mỗi loại; set Mộng Yểm Trọng Vệ Hoàng Kim 10.000/mảnh hoặc 45.000/bộ; set Sứ Đồ Ác Mộng 10.000/mảnh hoặc 45.000/bộ; set Du Hiệp Mộng Cảnh 15.000/mảnh hoặc 50.000/bộ; set Tiên Tri Hư Tượng 20.000/mảnh hoặc 50.000/bộ; Bản Vẽ nâng Trụ Mộng Thần 1.000.000/1; Bản Vẽ nâng Thần Điện Lãnh Chúa 1.500.000/1; Trái Tim Chuyên Gia 5.000/5.000, Đại Sư 50.000/1.000, Anh Hùng 200.000/10, Truyền Kỳ 1.000.000/3; Rương Di Vật ngẫu nhiên 1.500.000/2; Mảnh Thần Lực 50.000/200. Tuyển mộ và vật liệu chỉ mở khi event phase tương ứng unlock, không mở sớm |
| `SHOP-SKORK-1.0` | thuốc khử dịch 500 Nanh/100; bẫy chuột thép giả kim 1.000/20; Quyển Thợ Săn Skork thường 5.000/20, Tinh Anh 20.000/5, Boss 100.000/1; Bản Vẽ Trạm Khử Dịch 50.000/1 |
| `SHOP-GIANT-FESTIVAL-1.0` | thức ăn lễ hội 50 Phiếu/∞; dụng cụ nghề Tử 5.000/3; trang phục Cự Thành 10.000/1; Rương Lễ Hội Bạch Ngân 20.000/3; Bản Vẽ Quảng Trường Khánh Điển 100.000/1 |
| `SHOP-NORTH-CAMPAIGN-1.0` | khẩu phần đông 100 Quân Công/∞; ngựa chiến bắc địa 10.000/5; áo giáp Tử phương Bắc 20.000/3; Bản Vẽ Tháp Biên Cương 80.000/1; Rương Hoàng Kim Phương Bắc 200.000/1 |
| `SHOP-LIGHT-RELIC-1.0` | thuốc thánh quang 1.000 Thánh Huy/50; bùa hộ mệnh Tử 20.000/3; thánh vật Hoàng Kim 100.000/1; Bản Vẽ Tế Đàn Tịnh Quang 200.000/1 |
| `SHOP-ICE-SNOW-1.0` | tinh thể Băng/Tuyết 500 Ấn/∞; vũ khí chuyên hệ Tử 20.000/3; set chuyên hệ Hoàng Kim 100.000/1; Quyển nguyên tố Bậc 5 phẩm Boss 200.000/1 |
| `SHOP-DEEP-SEA-1.0` | bình thở giả kim 1.000 Hải Ấn/20; Hải Đồ Cổ 20.000/1; lao biển Tử 30.000/3; Bản Vẽ Bến Chu 100.000/1; chìa khoang niêm 200.000/1 |
| `SHOP-WEST-WAR-1.0` | quân nhu 500 Huân Công/∞; thuốc thánh/giải chú 2.000/50; trang bị chiến địa Tử 30.000/3; rương Hoàng Kim Thánh Chiến 150.000/1; Bản Vẽ Bệnh Xá Chiến Địa 100.000/1 |
| `SHOP-ANCIENT-P1-1.0` | nghề Cổ Long 50.000 Cổ Ấn/1; Mảnh Long Hồn 10.000/50; trang bị Kính Giới Tử 50.000/3; rương Hoàng Kim Kính Giới 300.000/1 |
| `SHOP-ANCIENT-P2-1.0` | vũ khí Cổ Long Hoàng Kim 300.000 Cổ Ấn/3; set Cổ Long Cam 1.000.000/1; Quyển Long Tướng Boss 500.000/1, Đầu Lĩnh 1.500.000/1; Bản Vẽ Cổng Kính Giới 2.000.000/1 |
| `SHOP-DRAGON-FESTIVAL-1.0` | vé đấu 1.000 Long Huy/20; Mảnh Long Hồn 10.000/30; vũ khí lễ rồng Hoàng Kim 200.000/3; rương Hạo Nguyệt Lễ Rồng 1.000.000/1 |
| `SHOP-ABYSS-1.0` | thuốc kháng Vực 2.000 Hạch Vụn/50; giáp Tử Vực Sâu 50.000/3; Mảnh Thần Lực 100.000/20; Bản Vẽ Cột Neo Vực 500.000/1 |
| `SHOP-GOD-SHARD-1.0` | Mảnh Thần Lực 100.000 Thần Ấn/30; Trái Tim Truyền Kỳ 1.000.000/3; Thần Cách khuyết 5.000.000/1; thánh vật route 3.000.000/1 |
| `SHOP-WORLD-PROTECTOR-1.0` | vật tư phòng tuyến 1.000 Công Huân/∞; Mảnh Thần Lực 100.000/50; vũ khí Người Bảo Hộ 1.000.000/1; Bản Vẽ Trụ Phòng Tuyến Thế Giới 5.000.000/1 |

#### 14.3.6. Bất biến settlement và hết hạn

1. Mọi board tra bảng payload cố định bằng `rank_band`; điểm chỉ quyết định hàng, không quyết định phẩm/số lượng thưởng. Cấm `recipient tier`, `median tier`, `leader gap`, CompletionStat, momentum hoặc số người dự thi tham gia phép tính reward.
2. Mọi shop inventory, giá, limit, currency, phase unlock và `candidate_pool_hash` được materialize tại `SCHEDULED`; không thêm hàng vì người chơi có nhiều tiền hơn dự kiến.
3. Slot random/tự chọn niêm danh sách template trước khi event mở. Sau resolve, slot chưa claim hết hạn; không đổi thành hộp generic và không gửi bù qua thư.
4. Loot exclusive đã được mint trước hạn giữ nguyên và có thể giao dịch nếu `trade_policy=TRADEABLE_INSTANCE`. Không rơi lại từ rương thường, boss thường, shop thường, discovery hoặc crafting discovery; trade không tạo instance.
5. Time-skip phải dừng hoặc quyết toán từng entry bị cắt qua. Nếu Lí Lan không tham gia, event vẫn chạy offscreen, board/shop vẫn đóng đúng mốc và hậu quả thế giới vẫn commit.

## 15. Bộ sinh sự kiện và ma sát quy mô

### 15.1. Hồ sơ sự kiện

Mỗi sự kiện có 14 trường: ID, phạm vi, chủ đề, trigger, cảnh báo, cửa chuẩn bị, điều kiện vào, độ khó, scale, phe tham gia, mục tiêu, thất bại, phần thưởng, hậu quả thế giới.

### 15.2. Ghép độ khó

\[
Difficulty=BaseTier\times RegionPhase\times EventGrade\times Environment\times(0.85+0.30R)
\]

`R=Hash64(event_id+"DIFFICULTY")/2^64∈[0,1)` và được khóa khi event materialize. Độ khó lấy từ cấp sự kiện, pha thế giới, khu vực và môi trường đã tồn tại; **không đọc median/top người chơi để scale động**. Người phát triển nhanh được quyền nghiền sự kiện cấp thấp nhanh hơn, đánh sự kiện cấp cao sớm hơn và giữ toàn bộ lợi thế thu được. Vai trò vận tải, chữa trị, trinh sát hoặc phòng thủ tồn tại vì cấu trúc sự kiện, không phải gói bù cho người yếu.

### 15.3. Điểm đóng góp

\[
Contribution=Combat+Healing+Protection+Logistics+Intel+Construction+Diplomacy-Exploitation
\]

Mỗi nhánh có giới hạn ghi điểm riêng để chống đếm lặp cùng một hành động; không thể chỉ gây damage cuối cùng để chiếm điểm đóng góp của cả đội. Đây là khóa chống exploit trong một sự kiện, **không phải cap sức mạnh của phần thưởng thành tựu/xếp hạng**. Điểm hỗ trợ được xác thực qua thay đổi trạng thái và mục tiêu.

### 15.4. Ma sát tự nhiên của quy mô — không phải catch-up

- Upkeep tăng theo tải quân/economy.
- Tài nguyên gần Lửa dần cạn, buộc mở tuyến dễ bị đánh.
- Lãnh địa lớn tăng chi phí phối hợp, tham nhũng và thời gian lệnh.
- Liên minh lớn chịu ma sát lợi ích và giới hạn chia sẻ tức thời.
- Mọi chi phí trên áp dụng theo hành vi/quy mô thực tế, không tăng riêng vì một chủ thể đang top bảng.
- Thành tựu và xếp hạng vẫn có thể cộng sức mạnh trực tiếp, tích lũy lợi thế và tạo khoảng cách ngày càng lớn.
- Không tồn tại người chơi đến sau, nhiệm vụ bắt kịp, hệ số cân bằng động, debuff người dẫn đầu hay phần thưởng an ủi để san bằng tiến trình.

## 16. Chợ, đấu giá, hợp đồng và tiền tệ hệ thống

### 16.1. Bốn tầng thị trường

Ba cơ chế phải tách sổ dù có thể cùng tồn tại:

1. **Trao đổi trực tiếp:** hai actor/organization, vật thể và quyền sở hữu hiện hữu; chuyển giao tại chỗ hoặc theo tuyến đã thỏa thuận.
2. **Chợ Hệ Thống:** cần Bản Vẽ/công trình Chợ được mở theo `<>`; listing, đàm phán và chuyển giao nguyên tử theo hợp đồng hệ thống.
3. **Đoàn buôn bản địa/caravan:** NPC, xe, hàng, lộ trình, thời tiết, hộ tống và thời gian đến vật lý; không phải điều kiện để Chợ Hệ Thống tự tồn tại.

Chợ lãnh địa, khu vực và đấu giá/liên giới là phạm vi của các cơ chế trên, không phải lý do gộp chúng thành một transaction.

Ở giai đoạn đầu, **Chợ Hệ Thống là chợ đổi vật**: người bán chọn vật/tài nguyên chấp nhận và hệ thống chuyển hai phía nguyên tử. Không có đồng tiền hệ thống phổ quát được phát miễn phí. Khi tiếp xúc kinh tế bản địa, đồng tiền vật lý chuẩn được gọi là **Krona**; nó là một loại consideration có issuer/vùng chấp nhận, không xóa barter hoặc token sự kiện.

### 16.2. Giá và thanh khoản

Giá gợi ý là median giao dịch đã hoàn tất theo chất lượng, nơi và thời điểm; không dùng giá niêm yết. Biên mua–bán mở rộng khi thanh khoản thấp. Hệ thống không bảo đảm hàng đến nếu tuyến vật lý bị chặn, trừ “kho dịch chuyển” cực hiếm có phí năng lượng tương ứng.

### 16.3. Hợp đồng listing và giao dịch nguyên tử

Listing Chợ Hệ Thống phải có: `listing_id`, version, seller identity theo privacy contract, vật/số lượng/phẩm/tình trạng đang bán, vật/số lượng/phẩm chấp nhận, ghi chú, phạm vi, mở/đóng, quyền sửa/rút, kênh đàm phán riêng, inventory reservation và fee basis. Mọi lần sửa tăng version; người mua chấp nhận đúng version đã đọc.

Giao dịch khóa đồng thời hàng bán và hàng trả, kiểm tra quyền sở hữu/sức chứa, rồi chuyển cả hai phía hoặc không chuyển gì. `market_transaction_id` ghi before/delta/after của hai kho. Listing hết hàng, rút hoặc lỗi không được để duplicated item hay số âm.

**Secondary market cho loot sự kiện đã hết hạn.** Chợ chỉ chấp nhận một `item_instance_id` đang tồn tại với `trade_policy=TRADEABLE_INSTANCE`; listing phải hiện tên sự kiện nguồn, trạng thái `Nguồn sơ cấp đã đóng`, tình trạng/binding và lịch sử provenance có thể xác minh. Settlement chỉ đổi owner của đúng instance; template count toàn thế giới trước/sau phải bằng nhau. Hệ Thống, NPC vendor, market maker, escrow timeout, mất listing hoặc hủy giao dịch không được mint/copy/reissue exclusive item. `BOUND_ON_ACQUIRE/BOUND_ON_LEARN`, knowledge entitlement và item đã tiêu thụ không thể niêm yết. Đây là con đường sở hữu mới duy nhất sau `resolves_at` của event.

`MARKET-FEE-1.0 — USER_LOCKED + DESIGN_DEFAULT`:

- một tài khoản/lãnh địa có tối đa **5 listing đang hoạt động**; sửa listing không tạo slot thứ sáu;
- phí đăng, sửa, rút/gỡ và hết hạn đều bằng **0**;
- chỉ giao dịch thành công thu **10%** từ consideration mà người bán nhận; người mua nhận nguyên lượng hàng niêm yết;
- với stack fungible do người bán chọn làm `fee_basis`, `Fee=0,10×q_received` chính xác và phần còn lại `0,90×q_received` vào kho người bán; sổ Chợ giữ số hữu tỉ tới khi đủ đơn vị rút nhỏ nhất, vì vậy không dùng `ceil` để biến giao dịch nhỏ thành phí lớn hơn 10%;
- pure unique-for-unique phải reserve một stack fungible làm `fee_deposit` của người bán bằng đúng 10% giá trị định giá. Giá trị dùng median giao dịch hoàn tất 30 ngày cùng scope/Phẩm; nếu chưa có median, hai bên phải khóa một appraisal và loại tài sản trả phí trong listing trước khi mở. `fee_deposit` chỉ bị trừ khi giao dịch thành công; nếu hủy/gỡ/hết hạn thì hoàn nguyên vẹn. Hai bên vẫn có thể trao đổi trực tiếp ngoài Chợ;
- không có “phí trợ”, phí hủy liên tiếp hoặc phí gỡ. Chống spam dùng rate limit/cooldown giao diện, không trừ tài sản.

### 16.4. Hợp đồng

Loại: mua bán, kỳ hạn giao hàng, thuê lao động, hộ tống, bảo hiểm, vay, cầm cố, liên doanh, nhượng quyền khai thác. Mỗi hợp đồng ghi vật phẩm/tiêu chuẩn, số lượng, địa điểm, thời hạn, điều kiện kiểm định, phạt, bất khả kháng, trọng tài và tài sản bảo đảm.

### 16.5. Chống thao túng

Giới hạn spam lệnh, công bố sở hữu liên quan, log giao dịch bất thường và circuit breaker khi giá lệch quá nhanh. Không thu phí hủy/gỡ. Không cấm đầu cơ; phân biệt đầu cơ có rủi ro với nhân bản hàng hoặc giao dịch wash.

## 17. Kênh liên lạc và kiểm soát thông tin

### 17.1. Danh mục kênh

| Kênh | Phạm vi | Ai thấy | Độ trễ/mặc định |
|---|---|---|---|
| Cận thoại | Trong tầm nghe | Mọi sinh vật nghe được | Vật lý, có thể bị nghe lén |
| Tổ đội | Nhóm tạm | Thành viên | Gần tức thời, mất khi nhiễu |
| Đội/Quân đoàn | Đơn vị quân sự | Theo cấp quyền | Ưu tiên chiến thuật |
| Lãnh địa | Dân và quan chức | Theo vai trò | Thông báo công cộng/riêng |
| Hội đồng | Quản trị | Người được mời | Mã hóa, biên bản |
| Bang hội | Tổ chức | Thành viên | Có module nhiệm vụ/kho |
| Liên minh | Nhiều lãnh địa | Đại diện/thành viên | Có hiệp ước chia sẻ |
| Khu vực | Phân khu địa lý | Người chơi đủ điều kiện | Dòng trực tiếp theo thời điểm nhận; giới hạn gửi nhưng không tuyển chọn nội dung hữu ích |
| Thế giới | Toàn cầu đã mở | Người chơi | Dòng trực tiếp hỗn tạp; hạn mức gửi thấp hơn và có chuyển ngữ |
| Giao dịch | Theo chợ | Người mua/bán | Gắn item/đơn hàng |
| Ngoại giao | Hai/nhiều chính thể | Đại diện | Có chữ ký và trạng thái đề nghị |
| Chiến phòng | Chiến dịch | Chỉ huy/phân đội | Ping bản đồ, lệnh, xác nhận |
| Khẩn cấp | Vùng nguy hiểm | Mọi người trong vùng | Chỉ cảnh báo xác thực |
| Hệ thống | Cá nhân/nhóm | Đích nhận | Không trả lời, có mức ưu tiên |
| Tin nhắn riêng | Hai chủ thể | Hai bên | Có chặn, báo cáo, lưu trữ |

### 17.2. Luật kênh

- Tự dịch giữ ý nghĩa cơ bản nhưng đánh dấu từ không chắc, tên riêng, lời thề và thuật ngữ văn hóa. Nó giữ lại câu cụt, lỗi gõ, chữ hoa, ký hiệu cảm xúc, sự lặp và nhịp hoảng loạn; không sửa lời người chơi thành văn viết trau chuốt.
- Tin nhắn hệ thống có chữ ký không thể giả; người chơi vẫn có thể chụp/cắt ngữ cảnh nên log gốc cần nút xác minh.
- NPC chỉ thấy kênh nếu có thiết bị, khế ước hoặc được cấp quyền; không mặc nhiên biết “thế giới chat”.
- Kênh chiến thuật có chống ping spam và quyền mute theo vai trò.
- Trạng thái offline lưu tin quan trọng nhưng không biến người nhận thành người đã biết trước khi mở.

### 17.3. Kênh công cộng là dòng trực tiếp, không phải bảng tin tuyển chọn

Kênh Khu Vực và Kênh Thế Giới hiển thị tin theo thời điểm Hệ Thống nhận được, sau khi bỏ nội dung đã bị chặn hoặc xử lý theo quyền riêng tư. Chúng không đẩy câu hữu ích lên trước, không gom các câu trả lời thành hướng dẫn và không bảo đảm câu hỏi nhận được hồi đáp. Một lời cầu cứu có thể bị trôi giữa câu chửi, tin rao, lời gọi người thân, ảnh mờ và ba người cùng hỏi lại điều vừa được hỏi.

Thông báo chính thức của Hệ Thống nằm ở dòng riêng có dấu xác thực. Người chơi có thể chép lại, cắt ảnh hoặc kể theo trí nhớ, nhưng bản chép ấy trở thành lời của người chơi và có thể sai. Không dùng người chơi vô danh làm miệng phát hướng dẫn chính xác thay cho Hệ Thống.

### 17.4. Nhiệt độ cảm xúc thay đổi theo thời gian

| Giai đoạn | Thành phần giọng chi phối | Dạng thông tin thường thấy |
|---|---|---|
| 0–10 phút sau giáng lâm | sốc, phủ nhận, gọi người thân, cầu cứu, chữ hoa, câu cụt, gõ lặp, hoảng loạn thân thể | gần như toàn bộ là câu hỏi và phản ứng; lời khuyên hiếm, vội và thường chưa kiểm chứng |
| 10 phút–6 giờ | hoảng sợ xen thử nghiệm liều lĩnh, cãi nhau, khoe thiên phú, tìm người gần, rao đổi tự phát | mảnh quan sát đầu tiên xuất hiện nhưng bị sao chép sai, phóng đại hoặc chìm giữa nhiễu |
| Đêm đầu | tin nhắn thưa thành từng đợt; kêu cứu về nhiệt, thương tích và bóng tối; nhiều tên đang nói bỗng im | cảnh báo sinh tồn ngắn hơn, giao dịch tuyệt vọng, điểm danh và câu hỏi lặp không ai trả lời |
| Ngày 2–3 | người còn khả năng lên kênh đã biết vài thao tác cơ bản; giọng kiệt sức, dè chừng và thực dụng hơn | ảnh bằng chứng, giá trao đổi, cảnh báo cục bộ và tin đồn có chuỗi nguồn bắt đầu hình thành |
| Cuối tuần đầu trở đi | nhóm quen mặt, người buôn, trinh sát, kẻ khoe khoang, người phá rối và thủ lĩnh phe có danh tiếng riêng | thông tin hữu ích tăng nhưng đi cùng tuyên truyền, giấu bài, thao túng giá, thù cá nhân và hài hước đen |

Sự yên dần của kênh là kết quả của thích nghi, kiệt sức và thiên lệch sống sót. Một số người hoảng loạn rời vòng nhiệt, tin lời sai hoặc đông cứng trước khi kịp học; số khác ngừng gõ vì đang làm việc, bị thương, mất quyền truy cập hay chỉ còn tập trung sinh tồn. Một cái tên im tiếng không tự động đồng nghĩa đã chết—chỉ thông báo xác thực, nhân chứng hoặc bằng chứng vật chất mới chốt tử vong.

Mỗi thiên tai, hợp khu, hết bảo hộ, công thành hoặc đại sự kiện bất ngờ có thể làm nhiệt độ kênh bật ngược về hoảng loạn. Người sống lâu hơn không mất bản năng sợ hãi; họ chỉ có thói quen, quan hệ và quy trình tốt hơn để biểu lộ nó.

### 17.5. Thành phần bắt buộc của một đoạn kênh được hiển thị

Khi nhân vật chủ động đọc kênh và kênh trở thành trọng tâm cảnh, lấy một lát cắt liên tiếp gồm khoảng 12–28 tin thay vì chỉ nhặt các câu có ích. Một lát cắt từ 10 tin trở lên phải:

- đan ít nhất ba mạch đang nói chồng nhau;
- dành ít nhất một nửa số tin cho cầu cứu, lặp câu hỏi, phản ứng cảm xúc, đùa, cãi, rao, lạc đề hoặc tin không giúp quyết định hiện tại;
- để thông tin cơ học rõ ràng chiếm không quá một phần năm số tin và không xuất hiện thành chuỗi hướng dẫn hoàn chỉnh;
- có ít nhất một câu bị bỏ lửng hoặc không ai trả lời, một thông tin mâu thuẫn và một câu lặp hoặc rao lại;
- cho ít nhất hai tên xuất hiện nhiều hơn một lần nếu lát cắt đủ dài, để kênh có con người định kỳ thay vì mỗi dòng một mã vô danh mới;
- giữ sự phân bố phù hợp giai đoạn ở §17.4: mười phút đầu ưu tiên hoảng loạn áp đảo, không dùng tỷ lệ của tuần đầu cho cảnh khai cuộc.

Khi kênh chỉ là nền, có thể hiện 2–5 mảnh tin cắt ngang nhau rồi để dòng chữ tiếp tục trượt. Không tóm tắt rằng kênh “hỗn loạn” trong khi các câu được trích đều bình tĩnh, đúng ngữ pháp và hữu ích.

### 17.6. Dấu gõ, danh tiếng và độ tin cậy

Mỗi tên xuất hiện lặp lại có hồ sơ tối thiểu: thói quen viết hoa, độ dài câu, dấu câu, lỗi gõ hay gặp, từ viết tắt, cách phản ứng khi bị nghi ngờ, chủ đề ám ảnh, điều đã trực tiếp chứng kiến, điều chỉ nghe lại, phe hoặc quan hệ và lịch sử nói đúng–sai. Cùng một người có thể dần bình tĩnh hơn nhưng không đổi toàn bộ giọng gõ sau một cảnh.

Một con số chính xác chỉ đáng tin khi người nói có nguồn hợp lệ như giao diện của chính họ, ảnh còn đủ ngữ cảnh, nhiều phép thử độc lập hoặc kết quả về sau xác nhận. Nhiều người lặp cùng một câu có thể chỉ là một tin đồn được sao chép. Nhân vật đang đọc phải tự đối chiếu; người kể không nâng một lời trên kênh thành sự thật chỉ vì nó nghe chắc chắn.

### 17.7. Thiết lập riêng tư

Ẩn/hiện cấp, lãnh địa, vị trí, online, thành tựu, lịch giao dịch; whitelist tin nhắn; chặn lời mời; bộ lọc nội dung; quyền ghi hình; cảnh báo doxxing; trì hoãn vị trí công khai trong chiến tranh.

## 18. Thiết lập giao diện

### 18.1. Thanh điều hướng

**Nhân vật | Kỹ năng | Thiên phú | Túi | Nhiệm vụ | Bản đồ | Lãnh địa | Dân cư | Sản xuất | Quân sự | Ngoại giao | Chợ | Kênh | Nhật ký | Cài đặt**.

Menu mở dần; mục chưa mở hiển thị điều kiện thay vì biến mất vô lý.

### 18.2. Dashboard lãnh địa

Khối trên: giờ, thời tiết, nhiệt, cảnh báo, **tên đầy đủ của giai đoạn lãnh địa**, **hình thái + Cấp Lửa Sinh Tồn**, trạng thái cháy và nhiên liệu còn lại. Khối trái: dân số, sức khỏe, tinh thần, ngày dự trữ. Trung tâm: bản đồ và công trình. Khối phải: hàng chờ sản xuất/xây dựng, nhiệm vụ và sự kiện. Dưới: dòng tài nguyên ròng theo giờ/ngày và nguồn biến động. Mã `H...` và `FireLevel...` chỉ tồn tại trong state nội bộ.

Dashboard luôn có ba dòng `TERRITORY-VITALS-1.0`: **Thịnh vượng** hiện `P` cùng 12 trụ; **Chính danh** hiện `LEG` và `L*` hoặc “chưa áp dụng — chưa có cư dân bị trị”; **An ninh** hiện score cùng ba thành phần Quân sẵn sàng/An toàn Lửa Sinh Tồn/Kiểm soát lãnh thổ. Nếu một score INVALID, UI nêu đúng input thiếu và timestamp cuối hợp lệ; không giữ số cũ như thể hiện hành.

### 18.3. Chuẩn tooltip

Mỗi con số có: giá trị hiện tại; thay đổi kỳ trước; công thức rút gọn; nguồn bonus; trần; cảnh báo dữ liệu; đường dẫn tới log. Ví dụ “Sản lượng gỗ 128/ngày = cơ sở 100 × lao động 1,10 × công cụ 1,08 × tinh thần 1,04 × thời tiết 1,00; hư hao 5”.

### 18.4. Chế độ hiển thị cơ bản và chuyên gia

- Cơ bản: giải thích thuật ngữ, đề xuất ba việc quan trọng, ẩn chi tiết bucket.
- Chuẩn: hiển thị nguồn–chi.
- Chuyên gia: bảng công thức, export log, dự báo nhiều kịch bản.

Đây chỉ là mức chi tiết giao diện, không phải trạng thái người chơi và không cấp bảo hộ hoặc phần thưởng khác nhau. Chế độ chuyên gia vẫn dùng từng dòng với Bậc, Cấp và Phẩm đã viết đầy đủ; nó không tự động trở thành bản kiểm lỗi. Không cho phép “tự động tối ưu” toàn bộ xã hội; gợi ý phải ghi giả định và đánh đổi.

### 18.5. Tiếp cận

Đổi màu độ hiếm, biểu tượng ngoài màu, cỡ chữ, đọc màn hình, giảm nhấp nháy, phụ đề âm thanh, log chiến đấu cô đọng, xác nhận thao tác phá hủy/chi lớn.

### 18.6. Cổng output format bắt buộc

Trước khi gửi bất kỳ giao diện nào, engine chạy `SPELLED_OUT_LINE_GATE`:

1. Giữ mã `T...`, `H...`, `FireLevel...`, dấu định danh, giá trị liệt kê và biến công thức trong trạng thái nội bộ; bản mặc định đổi `Lv<n>` thành `Cấp <n>`.
2. Chuyển từng `T<n>` đã biết thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>` và phẩm trơ thành `Phẩm <tên>`; giữ nguyên số cùng phẩm, không thay bằng lời mô tả mơ hồ.
3. Với Lửa/lãnh địa, lược mã `H...` và `FireLevel...` nhưng giữ tên hình thái, Cấp và trạng thái quan sát được; không tự suy `H0` thành `Bậc 0`.
4. Mỗi trường dùng đúng một dòng: `[Tên trường]: [giá trị], [chi tiết] — [một mệnh đề giải thích ngắn].` Phần sau gạch ngang không phát triển thành đoạn văn.
5. Thiên phú, kỹ năng và năng lực có hai phần tách dòng: dòng đầu ghi `Phẩm`, tên và 1–2 câu flavor; dòng sau có đúng hai câu hiệu quả cơ học ngắn gọn.
6. Level-up, loot, status update và sheet mới tiếp tục dùng đúng format này; số liệu đã biết không bị lược khi rút gọn.
7. Chỉ bỏ qua các bước trên khi yêu cầu hiện hành đòi đúng bản số liệu thô hoặc bản kiểm lỗi.

### 18.7. `KNOWLEDGE-SCOPE-FILTER-1.0` — chống toàn tri và self-citing

Registry nội bộ được phép giữ toàn bộ cây công trình, recipe tương lai, thành tựu ẩn, neo chương, file owner, rule ID và hash. Payload cho nhân vật/người chơi là phép chiếu theo quyền biết tại timestamp hiện tại:

- Sổ Kiến Trúc chỉ hiện các mục dựng sẵn đã mở, Bản Vẽ đã học và thông tin đã quan sát hợp lệ.
- Một công trình Cấp `L` chỉ hiện cạnh `L→L+1`; mọi recipe/điều kiện/kết quả của `L+1→L+2` trở đi bị loại khỏi payload.
- “Xem tất cả” nghĩa là tất cả mục **hiện đã mở/đã học/đã quan sát**, không phải dump registry.
- Chế độ chuyên gia tăng độ chi tiết của dữ kiện có quyền biết; nó không cấp omniscience.
- Giao diện và văn xuôi trong truyện không được nhắc tên file, số mục, rule ID, source class, dấu `<>`, tên/chương/URL nguyên tác, event/hash/regression ID hoặc câu “theo canon”. Những trường này chỉ xuất hiện khi người dùng yêu cầu meta/debug/source-audit ngoài truyện.
- Reward pool ẩn, nội dung rương chưa mở, achievement trigger chưa đạt, NPC intent chưa được phát hiện và công thức tương lai không được lộ qua tooltip, lời narrator hoặc “gợi ý tối ưu”.

Bất kỳ renderer nào nhận object nội bộ phải chạy whitelist trường player-facing; blacklist hậu kỳ không đủ an toàn. Nếu một trường không có `knowledge_grant_id` hoặc không thuộc public contract, renderer bỏ trường đó trước khi tạo câu chữ.

## 19. Nhật ký, thông báo và khả năng truy nguyên

Thông báo có 5 mức: chí tử, khẩn, quan trọng, thường, thông tin. Cùng loại gộp theo phút. Mọi thay đổi tài sản, quyền hạn, tử vong, hiệp ước và vật phẩm hiếm phải có event ID, timestamp, actor, nguồn, trước–sau và quyền xem.

Log giữ ba lớp: log cá nhân; log tổ chức; log hệ thống bất biến. Sửa sổ sách của tổ chức có thể xảy ra nhưng không sửa log hệ thống nếu actor có quyền truy cập điều tra.

## 20. Bảo hộ khai cuộc, tử vong, thất bại và phục hồi

### 20.1. Bảo hộ

Bảo hộ khai cuộc bắt đầu cho **toàn bộ người chơi tại T0** và kết thúc tại `T0 + 144 giờ`, cùng một timestamp toàn cục (`SOURCE_LOCKED <> + USER_LOCKED`). Countdown về 0 là event kết thúc duy nhất; **không có tái kích hoạt, gia hạn, nạp phí, nhiệm vụ khôi phục hoặc chế độ bảo hộ lần hai**.

`OPENING-PROTECTION-2.0` khóa năm lớp:

1. **Mục tiêu được bảo hộ:** Lửa Sinh Tồn, công trình, đất đã claim, kho gắn lãnh địa và quyền chiếm đóng không thể bị người chơi/quái/NPC khác gây damage, phá, cướp hoặc đổi chủ trong 144 giờ. Actor không phải “vật thể lãnh địa”: người chơi vẫn có thể tấn công và làm bị thương/giết actor khác; một cuộc PvP không được dùng damage lan, công thành hoặc capture để lách lớp bảo hộ công trình.
2. **Sinh tồn vẫn thật:** bảo hộ không cấp thức ăn, nước, nhiệt, chữa thương hoặc tài nguyên. Lạnh, đói, khát, bóng tối, bệnh, tai nạn, lạc đường và kiệt sức vẫn có thể giết người ở ngay trong lãnh địa.
3. **Vành cân bằng khai cuộc:** trong bán kính đường đi 3 km từ Lửa Sinh Tồn, việc seed/lập lịch nhóm lang thang dùng `DensityMultiplier=0,50` và chỉ materialize nhóm từ quần thể hữu hạn có sẵn với Phẩm Thường, Cấp 1–2, quy mô 1–3 cá thể. Mỗi encounter phải giữ `group_id` và trừ thương vong khỏi ecology ledger File 03; multiplier không respawn hay tạo sinh vật theo nhu cầu cảnh. Site, boss hoặc quần thể mạnh đã seed không bị xóa, nhưng không chủ động rời site đi đánh lãnh địa trong cửa bảo hộ; người chơi tự tiếp cận/chọc giận chúng vẫn chịu hậu quả.
4. **Bảo hộ gắn với lãnh địa:** rời ranh claim/vòng bảo hộ thì cơ thể, hành lý và đội đi theo chịu damage, cướp bóc, bắt giữ cùng mọi hazard bình thường. Bảo hộ không đi theo actor và không tạo hành lang an toàn tới mục tiêu.
5. **Hết bảo hộ:** từ `t=T0+144h`, đặt `p=Clamp(0,1,(t-(T0+144h))/168h)`. Trong vành 3 km, `DensityMultiplier=0,50+0,50p`; áp lực nhóm lang thang `EncounterBudgetMultiplier=0,70+0,80p`; mỗi 56 giờ mở tối đa thêm một bước Phẩm trong phân bố tự nhiên, nhưng không vượt regional cap đã seed. Hai multiplier chỉ đổi số nhóm hữu hạn được lập lịch di chuyển/tiếp cận và ngân sách chọn encounter; chúng không cộng population. Đây là ramp bảy ngày, không đọc Bậc/Lí Lan để scale động.

Khi countdown hết, cờ miễn damage/capture của lãnh địa tắt vĩnh viễn; sự kiện đã ở ngoài vành hoặc nguy cơ tự bị chọc giận không chờ ramp. Bảo hộ chỉ cho thời gian làm quen, không phải chế độ chơi dễ.

### 20.2. Tử vong

Mặc định là vĩnh viễn ở tầng thế giới. Hồi sinh hoàn nguyên một người sống chỉ tồn tại khi `<>` xác nhận hoặc phần lấp khoảng trống canon suy ra được một cơ chế tương thích; khi đó contract phải định nghĩa vật chứa linh hồn/hồ sơ, thời hạn, tài nguyên, công trình, rủi ro, hậu quả ký ức/thân thể và giới hạn số lần. **Tử Phục của Lí Lan không phải hồi sinh hoàn nguyên** mà là chuyển xác thật thành tử thi theo File 06; ngoại lệ `USER_LOCKED` này không có phí, số lượt, channel, cooldown hoặc Hồ Tử Khí. Không dùng “anh hùng tự hồi sau 24 giờ” nếu không có contract nguồn riêng.

### 20.3. Thất bại lãnh địa

Trạng thái: ổn định → căng thẳng → khủng hoảng → tan rã → lưu vong. Người chơi có thể tiếp tục dưới dạng đoàn lưu dân, chư hầu, lính đánh thuê hoặc tái định cư. Mất Lửa Sinh Tồn là đổi thể loại chơi, không nhất thiết kết thúc campaign.

## 21. Chống khai thác lỗi và các bất biến bắt buộc

1. Không nhân bản vật phẩm qua giao dịch đồng thời; item có ID và khóa giao dịch nguyên tử.
2. Không reset sự kiện để đổi seed sau khi đã nhìn kết quả.
3. Không cộng buff vĩnh viễn nếu nguồn ghi thời hạn trừ thiên phú quy tắc; thiên phú đó vẫn phải có whitelist, cap và không biến hồi máu thành bất tử vô hạn.
4. Không tạo vô hạn triệu hồi qua nhiều người trung gian; command cap tính cả cây sở hữu.
5. Không dùng túi không gian chở dân sống/quân vô hạn nếu không có module sinh tồn.
6. Không farm XP từ cùng thực thể hồi sinh, đồng minh, summon của mình hoặc mục tiêu không còn rủi ro.
7. Không hủy–xây để hoàn tiền dương; salvage luôn nhỏ hơn chi phí sau hư hao.
8. Không né upkeep bằng cất quân trong vật phẩm; đơn vị tồn tại vẫn tiêu hao hoặc bị đình trệ.
9. Không chuyển quyền Lửa Sinh Tồn khi đang tranh chấp để xóa nợ/aggro.
10. Không bảng xếp hạng thời gian thực tiết lộ vị trí hay trạng thái quân sự bí mật.
11. Không đổi `world_package_id`, seed map, site coordinate, chest instance, quest actor/item/reward hoặc fixed trigger sau `SAVE-T0-CLEAN`; debug reload phải trả cùng hash và không tạo vật thay thế.

## 22. Quy trình vận hành một ngày, tuần, mùa

### 22.1. Một ngày

00:00 hồi hồ Tử Khí Ngôi Mộ về cap → tiếp tục các tick giờ/queue → 07:00 chốt kho, dân số và nhu cầu của ngày cũ → trừ khẩu phần cư dân → cập nhật nội dung/phiên bản ngày mới → thời tiết → phân ca → sản xuất → sự kiện cục bộ → tiêu hao vận hành → tinh thần/sức khỏe → nhật ký và cảnh báo. Không có bước bảo trì hay hao mòn công trình. Chiêu mộ Nông Phu Cực Địa có thể diễn ra bất kỳ lúc nào đủ chỗ và lương thực; mốc 07:00 chỉ xử lý nghĩa vụ nuôi dân và daily content, không tạo lượt chiêu mộ.

### 22.2. Một tuần

Chốt lương và quân nhu; caravan; tăng trưởng sinh vật; tiến độ học nghề; phe phái; hội đồng; nhiệm vụ khu; xử lý mọi entry của `CANON-EVENT-LEDGER-4.0`. Bảng xếp hạng chỉ được chốt nếu registry có hợp đồng đang hoạt động với `resolves_at` ở mốc này; cùng transaction phải đóng nguồn sơ cấp của loot event. Người quản trị có thể thay ngày chốt văn hóa nhưng không được dời timestamp canon hay hợp đồng đã công bố.

### 22.3. Một mùa

Khí hậu, gieo–gặt, thuế, nhập cư, chiến dịch quân sự, thay đổi giá, festival, đại sự kiện và cập nhật shard. Hệ thống báo trước ít nhất một cửa chuẩn bị nếu biến cố có thể hủy lãnh địa.

## 23. Ví dụ hoàn chỉnh không gắn nhân vật chính/tên riêng — `EXAMPLE_ONLY`

Một lãnh địa H3 có 186 dân, 24 quân, Lửa Sinh Tồn còn 82% độ bền sau một cuộc tấn công, 19 ngày lương thực nhưng chỉ 6 ngày nhiên liệu. Dashboard báo đỏ nhiên liệu chứ không báo lương thực. Lãnh chúa định mở mỏ cách 18 km. Hệ thống không “thu” quặng ngay: cần trinh sát, quyền đất, đội khai thác, đường, xe, hộ tống và kho. Nếu điều 30 quân đi bảo vệ, ArmyLoad vượt EcoSupport khiến thu nhập hiệu dụng giảm; nếu thuê làng gần đó, cần hợp đồng và quan hệ. Một bão được báo trước 72 giờ tạo ba phương án: tích nhiên liệu, di tản khu ngoại vi hoặc dựng trạm nhiệt phụ. Điểm sự kiện tính cả cứu trợ và bảo đảm đường, nên lãnh địa yếu vẫn đóng góp được.

---

## Phụ lục 1.A — Từ điển dữ liệu lõi

### 1.A.i. Entity bắt buộc

Player, NativePerson, Household, Organization, Territory, SurvivalFire, Building, ResourceStack, Item, Unit, Army, Route, Contract, Quest, Event, Message, FactionRelation, PermissionGrant.

### 1.A.ii. Trường chung

ID bất biến; tên hiển thị; owner; controller; location; created_at; updated_at; state; visibility; source; version; tags. Tên có thể đổi, ID không đổi.

## Phụ lục 1.B — Schema sự kiện

### 1.B.i. Pseudocode

~~~yaml
event_id: REGION-WEATHER-001
scope: region
telegraph: 72h
entry: automatic-impact / opt-in-objectives
scaling_basis: fixed_world_phase_and_event_grade
objectives: [survive, rescue, maintain_route, research]
contribution_caps: {combat: 35%, logistics: 35%, rescue: 35%, intel: 20%}
failure: world_state_change
rewards: milestone + proportional + community
anti_exploit: unique_target_credit, no-friendly-farm, seed_locked
~~~

## Phụ lục 1.C — Bộ 36 mẫu sự kiện

| Nhóm | 6 biến thể |
|---|---|
| Thời tiết | bão lạnh, mưa độc, hạn, sương nhiễu, lũ, nhật thực ma lực |
| Sinh vật | thú triều, di cư, dịch bệnh, boss, tổ sinh sản, loài xâm lấn |
| Tài nguyên | mạch mới, cạn mỏ, hàng hỏng, caravan, độc quyền, phát hiện vật liệu |
| Xã hội | đình công, lễ hội, tị nạn, tranh chấp đất, giáo phái, dịch tin đồn |
| Chính trị | sứ đoàn, tối hậu thư, kế vị, nổi loạn, hội nghị, cấm vận |
| Hệ thống | mở chợ, mở rank, hợp khu, bản vá, dungeon, thử thách thế giới |

## Phụ lục 1.D — Quy tắc hiển thị công thức

1. Làm tròn chỉ ở kết quả cuối.
2. Phần trăm hiển thị hai chữ số khi dưới 10%, một chữ số khi trên 10%.
3. “Tăng 20%” phải ghi tăng bucket nào; “nhân 1,20” là phép nhân riêng.
4. Cap hiển thị cả giá trị thô và hiệu dụng.
5. Dự báo hiển thị khoảng thấp–cơ sở–cao.

## Phụ lục 1.E — Checklist cân bằng phiên bản

- Có con đường không chiến đấu để đóng góp sự kiện?
- Bonus top 1 có đúng bảng thưởng đã công bố, được log đầy đủ và không bị nerf hồi tố vì tạo lợi thế dài hạn?
- Công trình mới có một chức năng rõ; recipe nguồn được giữ nguyên; recipe loại suy chỉ dùng tập tối thiểu họ vật liệu gộp có lý do; vật liệu phép, lao động, độ bền/giáp và counterplay bằng tấn công đều đã khóa?
- Quyền mới có log, giới hạn và cơ chế thu hồi?
- Một tài nguyên có ít nhất hai nguồn và hai sink ở midgame?
- Có lý do trong thế giới cho thay đổi hệ thống?
- Mọi người chơi có cùng T0, cùng cửa bảo hộ và không có bất kỳ đường đăng ký/bắt kịp muộn nào?
- NPC có thể phản ứng hợp lý với cơ chế mà không biết meta?

## Phụ lục 1.F — Ma trận phụ thuộc file

| Cần biết | File chuẩn |
|---|---|
| Cấp, XP, thuộc tính, thiên phú, chuyển chức | Lord_DnD_02_Thien_Phu_Thuoc_Tinh_Tien_Trinh_1152_Muc.md |
| Bản đồ, nhà nước, văn hóa, NPC, người chơi | Lord_DnD_03_The_Gioi_Chinh_Tri_NPC_Nguoi_Choi_Van_Hoa.md |
| Combat, vật phẩm, công trình, summon, hero | Lord_DnD_04_He_Thong_Suc_Manh_Vat_Pham_Cong_Trinh_Trieu_Hoan.md |
| Roster đối thủ cố định, rarity budget, CompletionStat và continuity của bảng | Lord_DnD_07_Bang_Xep_Hang_Roster_Co_Dinh_CompletionStat.md |

## Phụ lục 1.G — Dấu vết nguồn thiết kế

### 1.G.i. Nguồn gốc chính

- [Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa — iTruyenHay](https://itruyenhay.org/truyen/bang-phong-tan-the-ta-che-tao-hoan-my-lanh-dia): Lửa Trại, chuỗi tiến hóa Lửa Sinh Tồn, thu thập, kiến trúc, tuyển mộ, thiên phú SSS.
- [Trang chính thức tác phẩm trên Qidian](https://www.qidian.com/book/1040133596/): metadata và mục lục gốc.
- [Danh mục chương tham chiếu](https://www.69shuba.com/book/58776/): dùng tên chương để lập taxonomy chat, chợ, rank, sự kiện, hợp khu, nghề, công trình và tiến trình; không sao chép nội dung chương.
- [Chương 2 — tu sửa Nhà Lãnh Chúa, Hòm Vật Tư và Nhà Cực Địa Nhân](https://ttks.tw/novel/chapters/quanqiujianglindaizhaosaosaomoshizhongtian/2.html): chi phí tu sửa, sách Băng Liệu Thuật mà Cao Tinh có thể học, 50 Bánh Mì cho thành tựu Nhà Nông Phu, bộ vật tư bốn người, sức chứa bốn dân, giá chiêu mộ 5 lương thực mỗi người và nghĩa vụ cấp thức ăn hằng ngày.
- [Chương 12 — nâng Nhà Cực Địa Nhân Cấp 1→2](https://m.yunqi.qq.com/read/50133618/12): chi phí 50 gỗ +30 đá; cảnh có bốn người và từng còn 27 phút; kết quả 30 m², tám chỗ.
- [Chương 13 — Nhà Cực Địa Nhân Cấp 2](https://mshuku.read.qq.com/read/1050133618/13): sức chứa tám người, chiêu mộ bốn người còn thiếu bằng 20 lương thực và điều kiện nâng Cấp 2→3.
- [Chương 57 — học Bản Vẽ và dựng nhiều công trình cùng mẫu](https://mnovel.book.qq.com/read/1050133618/57): Bản Vẽ được học trước khi giao thợ dựng hai nơi trú, trong khi từng công trình vẫn có vật liệu, nhân sự và thời gian riêng.
- [Chương 19 — quái Cấp 1–2 quanh doanh địa và Chợ đổi vật](https://www.69shuba.com/txt/58776/38156830): nhóm bốn người có thể xử lý quái khai cuộc; người bán tự chọn vật/tài nguyên muốn nhận và giao dịch chuyển nguyên tử.
- [Chương 25 — Bảng Cấp và bảy dải thưởng](https://mbook.novel.qq.com/read/1050133618/25): mở bảng sau ngày thứ hai, 100 người đầu đạt Cấp 10 và mẫu gói thưởng theo dải.
- [Chương 26 — phẩm sinh mệnh](https://m.fbs.qq.com/read/1050133618/26): phẩm cao nhận nhiều tăng trưởng thuộc tính hơn theo Cấp.
- [Chương 66 — đồng Krona](https://mbook.novel.qq.com/read/1050133618/66): tiền vật lý dùng trong giao thương bản địa.
- [Chương 117 — hết bảo hộ và tăng áp lực bảy ngày](https://www.69shuba.com/txt/58776/38465522): countdown hết vào bình minh; tần suất nguy cơ quanh lãnh địa tăng trong bảy ngày kế.
- [Chương 249 — first-kill Thống Soái](https://www.69shuba.com/txt/58776/38973657): reward là sách kỹ năng Hàn Sương phẩm Cam/Sử Thi đúng nghề Hàn Sương Pháp Sư của Cao Tinh; dùng làm neo recipient-fit, không hard-code tên sách cho nghề khác.
- [Sáng Tác Việt](https://sangtacviet.app/): đã kiểm tra nguồn theo yêu cầu; trang tìm kiếm công khai không trả metadata có thể truy xuất cho tên truyện tại thời điểm khảo sát, nên không dùng làm căn cứ số liệu.

### 1.G.ii. Truyện phụ

- [Lãnh Chủ Cầu Sinh: Từ Tàn Phá Tiểu Viện Bắt Đầu Công Lược](https://www.qidian.com/book/1027194315/): sinh tồn, chiếm vùng, tài nguyên, xây thành, thử thách định kỳ.
- [Toàn Dân Lãnh Chủ: Thiên Phú Của Ta Có Ức Điểm Mạnh](https://www.qidian.com/book/1028081542/): nâng vật phẩm/lệnh tuyển mộ, milestone, kinh tế chợ.
- [Toàn Dân Lãnh Chủ: Tỷ Lệ Rơi Của Ta 100%](https://www.qidian.com/book/1034588746/): thiên phú lãnh chúa theo cơ chế, drop minh bạch, đa văn minh.
- [Toàn Cầu Lãnh Chủ: Khởi Đầu Thành Sa Mạc Lãnh Chủ](https://www.qidian.com/book/1031973159/): ổ binh, tài nguyên–binh chủng–lãnh địa–anh hùng–bảo vật.
- [Chư Thiên Lãnh Chúa — iTruyenHay](https://itruyenhay.org/truyen/chu-thien-lanh-chua): phân vai nghề sản xuất, chiến đấu, hậu cần.
- [Lãnh Địa Có Thể Vô Hạn Tiến Hóa — iTruyenHay](https://itruyenhay.org/truyen/toan-dan-linh-chu-lanh-dia-cua-ta-co-the-vo-han-tien-hoa): nhánh tiến hóa công trình; được dùng như ví dụ cần thêm cap và chi phí.

### 1.G.iii. Game phụ

- [Warcraft: Orcs & Humans — manual index](https://warcraft.wiki.gg/wiki/Warcraft:_Orcs_%26_Humans_manual): vòng worker–gold/lumber–building–unit nguyên thủy.
- [Warcraft II — basic overview](https://classic.battle.net/war2/basic/): worker, gold/lumber/oil, town tech tiers và mở đơn vị bằng công trình.
- [Warcraft III / Reforged — resources](https://classic.battle.net/war3/basics/resources.shtml), [upkeep](https://classic.battle.net/war3/basics/upkeep.shtml), [hero/unit basics](https://classic.battle.net/war3/basics/): resource loop, food cap, hero, creep, item và upkeep.
- [Age of Empires II — military and economy](https://www.ageofempires.com/learn-to-play/military-and-economy-aoe2/): nhà sản xuất theo binh chủng và tech tree.
- [Heroes of Might and Magic](https://www.ubisoft.com/en-gb/franchises/might-and-magic): hero chỉ huy quân; thành, creature dwelling, artifact.
- [Total War Academy](https://academy.totalwar.com/warhammer2/): thuế, trật tự, tham nhũng, đồn trú và nổi loạn.
- [Against the Storm — Hostility](https://wiki.hoodedhorse.com/Against_the_Storm/Hostility): tăng trưởng lãnh địa tạo áp lực môi trường; dùng để thiết kế counter-growth.

Khi metadata của trang chuyển ngữ/mirror mâu thuẫn với trang phát hành gốc, file này ưu tiên metadata và mục lục Qidian; số chương bị tách/gộp ở mirror không được coi là cơ chế canon.

## Phụ lục 1.H — Liên kết thiết lập nhân vật chính

File 06 đã khóa tên Lí Lan, tuổi 24, giới nữ, quốc tịch Trung Hoa, ngoại hình, nghề quản lý an ninh mạng, tàu điện, người đứng gần, bịch đồ ăn, không quan hệ, thuộc tính tự áp, Thẻ Chuyển Nghề đã niêm, mục tiêu, lập trường thực dụng, giọng nói, không giới hạn, cổ chiến trường, `FireLevel=1`, Ngôi Mộ Bậc 1 và thiên phú SSS `Tử Phục Linh Sư`. Campaign mở đúng T0 lúc 07:00; không còn trường nhân vật bắt buộc chờ người dùng. Cốt truyện thế giới, nhịp sinh tồn–lãnh địa, trình tự mở hệ thống và đại sự kiện lấy `<>` làm gốc rồi vận hành song song với build của Lí Lan.

## Phụ lục 1.I — Registry tham số lãnh địa `TERRITORY-MATH-CLOSURE-1.0`

Registry này áp cho các công thức File 01 không có bảng cục bộ chi tiết hơn. Mọi đại lượng tỷ lệ được clamp trước phép tính; làm tròn chỉ ở kết quả cuối.

`HASH-PRIMITIVE-1.0` áp dụng cho toàn bộ File 01–06. Trong biểu thức `Hash64(a+b+...)`, dấu `+` nghĩa ghép **các field**, không phải nối chuỗi thô: chuẩn hóa từng field về Unicode NFC, mã hóa UTF-8, đặt trước mỗi field độ dài byte bằng số nguyên 64-bit unsigned big-endian, rồi ghép các khối theo thứ tự. `Hash64` là tám byte đầu của `SHA-256(canonical_fields)`, đọc thành số nguyên unsigned big-endian trong `0..2^64−1`. `u=Hash64(...)/2^64` vì thế thuộc `[0,1)`.

`RandomInt(seed,low,high)` yêu cầu `low/high` nguyên và `low≤high`. Đặt `m=high−low+1`, `limit=floor(2^64/m)×m`; tính lần lượt `v_k=Hash64(seed+"DRAW"+k)` với `k=0,1,2...` và lấy giá trị đầu tiên `v_k<limit`, rồi trả `low+(v_k mod m)`. Quy tắc rejection này cho phân bố đều chính xác, bao gồm hai đầu và không reroll theo nội dung kết quả. Mọi sub-seed, CDF và tie-break trong các file phải gọi primitive/version này; đổi thuật toán cần version mới và không sửa event cũ.

| Công thức | Tham số đã khóa |
|---|---|
| Điểm quyền hạn §4.3 | `AUT/GOV∈[0,100]`; `LEG_effective=LEG` khi hợp lệ, bằng 0 đúng zero-case chưa có cư dân bị trị; `M_institution=1,00` chưa có bộ máy, `1,10` có tổng quản/hội đồng, `1,25` có thiết chế kiểm toán đầy đủ; AP dùng `floor` sau toàn bộ tích. Cấp Lửa không phải input. |
| An toàn Lửa §6.3 | `Q_fire=CurrentDurability/MaxDurability∈[0,1]`; chỉ attack/repair-after-attack ledger đổi độ bền; `S_fire=100Q_fire` khi `FireActive=1`, ngược lại 0. Hết nhiên liệu chỉ đổi `FireActive`, không đổi `Q_fire`. |
| Sản xuất §8.2 | `BaseRecipe` là unit/batch. `Labor=Clamp(0,1.25,effective_worker_hours/required_worker_hours)`; `Tool`: thiếu 0, ứng biến 0,60, đúng 1,00, cao cấp 1,15, bậc thầy 1,25; `Skill`: chưa học 0,50, gần nghề 0,80, đúng nghề 1,00, chuyên gia 1,15, bậc thầy 1,25; `Facility`: sai/thiếu bắt buộc 0, dã chiến 0,75, đúng cấp 1,00, cao hơn một stage 1,10, cao hơn từ hai 1,25; `InputQuality` là trung bình có trọng số recipe của chất lượng input chia 100, clamp `0..1.25`. `Waste∈[0,0.75]`; output fungible dùng `floor`, vật độc nhất cần output tích lũy ≥1. |
| Chất lượng §8.2 | `Q_input` là trung bình có trọng số recipe `0..100`; `Skill/Facility/Process∈[0,100]` lấy lần lượt từ mastery÷10, facility condition và tỷ lệ checklist quy trình đạt; `Defects=100×defective_steps/required_steps`, clamp `0..100`. `Q_out=Clamp(0,100,...)`, làm tròn một chữ số. |
| Kho §8.3 | mọi stock/flow cùng đơn vị/ngày; `d_base∈[0,1]`; `M_storage/M_climate∈[0,2]`; `Theft∈[0,Stock_t+In]`; `Out` được reserve trước và không vượt lượng còn lại sau Loss. |
| Trung thành §9.3 | sáu biến dương và `Grievance` đều `0..10`; `ΔL` là điểm/tuần, rồi `L_new=Clamp(0,100,L_old+ΔL)`. |
| Thu hút §9.5 | mỗi biến `0..100`; `Attract` clamp `−300..700`; dòng di cư/ngày là `RoundTowardZero(Population×Attract/10000)`, chỉ áp khi route hợp lệ. |
| Readiness §10.4 | sáu trụ `0..100`; tổng cũng `0..100`; ngưỡng thời đại kế là `50+5×EraIndex`, `EraIndex=0..7`, cùng sàn 40 từng trụ. |
| Chính danh §9.3 | `TERRITORY-VITALS-1.0-L`: chỉ cư dân hữu trí bị trị; ba bằng chứng lõi bắt buộc; bốn bằng chứng không áp dụng được renormalize; `LEG/L*∈[0,100]`; half-life 7 ngày; direct delta áp theo `(timestamp,event_id)`; không dân cho `NOT_APPLICABLE`, không phải 0/50. |
| Thịnh vượng §11.1 | `TERRITORY-VITALS-1.0-P`: mỗi KPI có `Actual/Target/unit/direction/weight/source`; `AT_LEAST/AT_MOST` dùng hàm `a_k`; `NOT_ACTIVE` phải có bằng chứng; `Raw_i=100Σv_ka_k`, `Scale_i=100`; 12 trọng số `w_i=1/12` và phải cộng đúng 1; `P_unique` chỉ từ event ID đã xác thực. |
| An ninh §11.4 | `TERRITORY-VITALS-1.0-S`: threat/defense/guard/response/supply/command theo zone; `MilitaryReadiness/S_fire/TerritoryControl∈[0,100]`; `SecurityScore=0.50MR+0.30S_fire+0.20Control`; thiếu `BiomeThreatFloor` hoặc zone ledger tạo `INVALID_SECURITY_INPUT`. |
| Sức chứa §11.2 | sáu input là số người phục vụ bền vững/ngày; `M_governance=Clamp(0.50,1.20,0.50+0.007GOV)`; `PopCap` dùng `floor`. |
| Quân lực §11.3–12.2 | `CP` lấy File 04; readiness/cohesion/supply/command/terrain fit đều `0..1,25`; Fortification/Reserve/LogisticPenalty dùng cùng đơn vị CP; điểm cuối clamp tối thiểu 0. |
| Upkeep §12.3 | `ArmyLoad≥0`, `EcoSupport≥0` cùng đơn vị; `EcoSupport=0` và ArmyLoad>0 cho efficiency 0; còn lại dùng công thức tỷ lệ đã sửa. |
| Độ khó event §15.2 | `BaseTier=1,6^EventTier`, `EventTier=0..10`; `RegionPhase=1+0,10×PhaseIndex`, `0..7`; `EventGrade=0,80/1,00/1,25/1,60`; `Environment=0,75..1,50` khóa khi seed; `R∈[0,1)`. |
| Điểm đóng góp §15.3 | bảy nhánh dương và Exploitation là điểm không âm; caps nằm trong event contract và tổng cap từng nhánh phải được công bố; kết quả clamp tối thiểu 0. |

### `TERRITORY-STAGE-CHECK-1.1` — materialize `H→H+1`

> **Nhãn: `DESIGN_DEFAULT`.** Đây là phép phân loại xã hội của campaign, không phải công thức Lửa Sinh Tồn trong `<>`.

Với `H` hiện tại, engine kiểm:

- `PopulationRequired=ceil(4×2^H)` dân hữu trí thường trú;
- `BreadthRequired=min(12,4+floor(H/2))` trụ trong §11.1 đạt ít nhất 40 và có KPI vật lý hợp lệ;
- `LegitimacyRequired=min(80,20+5H)`; `LEG=NOT_APPLICABLE` luôn fail;
- `SecurityRequired=min(90,35+5H)` từ settlement §11.4 cùng `through_event_id`;
- thiết chế bắt buộc của tên giai đoạn đã tồn tại thành actor/building/charter ledger, không phải một nhãn do narrator tự gán.

Đủ tất cả khóa tạo `TerritoryStageMaterialized(H+1)` mà không trừ vật liệu hoặc thời gian. Thiếu khóa chỉ ghi blocker. Không có `TERRITORY-RECIPE`, `CoreCatalyst`, phí RP hay repair/maintenance giả.

### `SURVIVAL-FIRE-PROGRESSION-2.0` — registry cố định `FireLevel 1→30`

> **Nhãn:** hàng `E` là `SOURCE_EXPLICIT`; hàng `A` là `SOURCE_ANALOGY` đã freeze từ các panel cùng họ. Đây là contract vận hành cố định, không phải lời khẳng định nguyên tác đã in mọi con số. `D/A` là Độ Bền tối đa/Giáp. Bán kính dùng `R`; đường kính dùng `D`. Mỗi hàng mô tả **profile sau khi đạt Cấp đó** và recipe ở cột cuối là giá `Cấp đó → Cấp kế`.
>
> `canonical_rows_sha256=f0091359d0a095803c03e94cc3624104d5b260e21999b06ddd63c2c6df6b0b6b` (UTF-8, từ hàng tiêu đề bảng đến hàng Cấp 30, gồm LF cuối mỗi hàng).

| Cấp | Hình thái và kết cấu | D/A | Vùng nhiệt; tăng nhiệt | Nhiên liệu vận hành | Recipe lên Cấp kế | Nhãn |
|---:|---|---:|---|---|---|:---:|
| 1 | Lửa Trại trần | 200/0 | R10 m; +5–20°C | 1 Gỗ/15 phút | 5 Đá | E |
| 2 | Lửa Trại có vòng đá | 320/2 | R20 m; +10–20°C | 1 Gỗ/13 phút | 10 Đá | E |
| 3 | Lửa Trại có bệ đá | 500/5 | R40 m; +10–20°C | 1 Gỗ/10 phút | 20 Đá + 10 Gỗ | E |
| 4 | Lửa Trại có ghi/lòng than; bắt đầu dùng Than | 800/10 | R80 m; +10–20°C | 2 Gỗ/10 phút hoặc 1 Than/30 phút | 40 Đá + 20 Gỗ + 10 Sắt | A |
| 5 | Lửa Trại lớn, bệ chịu nhiệt | 1.200/15 | R160 m; +10–20°C | 4 Gỗ/10 phút hoặc 2 Than/25 phút | 60 Đá + 40 Gỗ + 20 Sắt | E |
| 6 | **Đại Lửa Trại**, chuyển hình thái | 2.000/25 | R200 m; +10–20°C | 4 Gỗ/10 phút hoặc 2 Than/22 phút | 80 Đá + 50 Gỗ + 25 Sắt | A |
| 7 | Đại Lửa Trại mở rộng | 3.000/35 | R300 m; +10–20°C | 5 Gỗ/10 phút hoặc 2 Than/20 phút | 100 Đá + 50 Gỗ + 30 Sắt | E |
| 8 | Đại Lửa Trại có thành giữ nhiệt | 4.500/50 | R350 m; +12–22°C | 5 Gỗ/10 phút hoặc 2 Than/18 phút | 150 Đá + 80 Gỗ + 50 Sắt | A |
| 9 | Đại Lửa Trại gia cường kim loại | 6.500/70 | R400 m; +14–24°C | 6 Gỗ/10 phút hoặc 2 Than/16 phút | 220 Đá + 120 Gỗ + 80 Sắt + 10 Đồng | A |
| 10 | Đại Lửa Trại hoàn chỉnh | 9.000/90 | R450 m; +16–26°C | 6 Gỗ/10 phút hoặc 2 Than/14 phút | 350 Đá + 200 Gỗ + 100 Sắt + 20 Đồng + 5 Tinh Thể Nguyên Tố Sơ Cấp | A |
| 11 | **Lò Nung**, buồng kín đầu tiên | 15.000/150 | D1 km; +25–35°C | 120 Gỗ/giờ hoặc 30 Than/giờ | 500 Đá + 300 Gỗ + 120 Sắt + 30 Đồng + 10 Tinh Thể Nguyên Tố Sơ Cấp | E |
| 12 | Lò Nung hai lớp | 22.000/200 | D1,5 km; +25–36°C | 160 Gỗ/giờ hoặc 40 Than/giờ | 700 Đá + 400 Gỗ + 180 Sắt + 50 Đồng + 15 Tinh Thể Nguyên Tố Sơ Cấp | A |
| 13 | Lò Nung mở rộng ống dẫn nhiệt | 32.000/260 | D2 km; +25–38°C | 240 Gỗ/giờ hoặc 60 Than/giờ | 1.000 Đá + 600 Gỗ + 300 Sắt + 80 Đồng + 25 Tinh Thể Nguyên Tố Sơ Cấp | A |
| 14 | Lò Nung công nghiệp | 45.000/340 | D3 km; +25–40°C | 360 Gỗ/giờ hoặc 90 Than/giờ | 1.500 Đá + 800 Gỗ + 500 Sắt + 120 Đồng + 40 Tinh Thể Nguyên Tố Sơ Cấp | A |
| 15 | Lò Nung cực đại | 65.000/450 | D4 km; +25–42°C | 480 Gỗ/giờ hoặc 115 Than/giờ | 2.500 Đá + 1.000 Gỗ + 1.200 Sắt + 200 Đồng + 50 Bí Ngân + 30 Tinh Thể Nguyên Tố Trung Cấp | A |
| 16 | **Đại Lò Nung**; mở nhiên liệu ma năng | 100.000/700 | D tối đa 5 km; +25–45°C | 600 Gỗ/giờ, 140 Than/giờ hoặc 1 Tinh Thể Ma Năng Sơ Cấp/giờ | 5.000 Sắt + 1.000 Đá + 300 Đồng + 100 Bí Ngân + 50 Tinh Thể Nguyên Tố Trung Cấp | E |
| 17 | Đại Lò Nung tối ưu buồng đốt | 140.000/900 | D5 km; +25–45°C | 560 Gỗ/giờ, 130 Than/giờ hoặc 1 tinh thể/75 phút | 7.500 Sắt + 1.500 Đá + 500 Đồng + 180 Bí Ngân + 80 Tinh Thể Nguyên Tố Trung Cấp | A |
| 18 | Đại Lò Nung tuần hoàn nhiệt | 190.000/1.150 | D5 km; +25–45°C | 520 Gỗ/giờ, 120 Than/giờ hoặc 1 tinh thể/90 phút | 12.000 Sắt + 2.500 Đá + 800 Đồng + 300 Bí Ngân + 120 Tinh Thể Nguyên Tố Trung Cấp | A |
| 19 | Đại Lò Nung rune hóa | 250.000/1.450 | D5 km; +25–45°C | 480 Gỗ/giờ, 110 Than/giờ hoặc 1 tinh thể/105 phút | 20.000 Sắt Tinh Luyện + 5.000 Đá + 1.500 Đồng + 500 Bí Ngân + 200 Tinh Thể Nguyên Tố Trung Cấp + 20 Đá Rune | A |
| 20 | Đại Lò Nung cực đại | 330.000/1.800 | D5 km; +25–45°C | 440 Gỗ/giờ, 100 Than/giờ hoặc 1 tinh thể/120 phút | 40.000 Sắt Tinh Luyện + 10.000 Đá + 3.000 Đồng + 1.000 Bí Ngân + 500 Tinh Thể Nguyên Tố Trung Cấp + 100 Đá Rune | A |
| 21 | **Tháp Năng Lượng**; nhiệt sạch ba hệ | 450.000/2.400 | D5 km; +15–40°C; ba vùng phụ +20–30°C | 1 Tinh Thể Năng Lượng Sơ Cấp/120 phút | 50.000 Sắt Tinh Luyện + 20.000 Đồng + 10.000 Bí Ngân + 1.000 Tinh Thể Nguyên Tố Cao Cấp | E/A |
| 22 | Tháp Năng Lượng tăng công suất | 600.000/3.000 | D6 km; +15–42°C; ba vùng +20–32°C | 1 tinh thể/90 phút | 60.000 Sắt Tinh Luyện + 25.000 Đồng + 15.000 Bí Ngân + 1.000 Vĩnh Hằng Kim + 2.000 Tinh Thể Bậc Thầy | A |
| 23 | Tháp Năng Lượng nhiều tầng | 800.000/3.800 | D7 km; +15–45°C; ba vùng +20–35°C | 1 tinh thể/60 phút | 75.000 Sắt Tinh Luyện + 30.000 Đồng + 20.000 Bí Ngân + 1.500 Vĩnh Hằng Kim + 3.000 Tinh Thể Bậc Thầy | A |
| 24 | Tháp Năng Lượng rune hóa | 1.050.000/4.800 | D8,5 km; +15–48°C; ba vùng +20–38°C | 2 tinh thể/giờ | 90.000 Sắt Tinh Luyện + 40.000 Đồng + 25.000 Bí Ngân + 2.000 Vĩnh Hằng Kim + 500 Đá Rune + 4.000 Tinh Thể Bậc Thầy | A |
| 25 | Tháp 78,5 m², cao 28 m | 1.350.000/6.000 | D10 km; +15–50°C; ba vùng +20–40°C | 2 tinh thể/giờ | 100.000 Sắt Tinh Luyện + 50.000 Đồng + 30.000 Bí Ngân + 3.000 Vĩnh Hằng Kim + 1.000 Đá Rune + 5.000 Tinh Thể Bậc Thầy | E |
| 26 | **Siêu Trạm Năng Lượng**, 95 m², cao 30 m | 1.800.000/7.500 | D15 km; +15–50°C; ba vùng +20–45°C | 2 tinh thể/giờ | 150.000 Sắt Tinh Luyện + 75.000 Đồng + 40.000 Bí Ngân + 6.000 Vĩnh Hằng Kim + 5.000 Đá Rune + 5.000 Tinh Thể Bậc Thầy + 500 Tinh Lạc + 500 Delimo | A |
| 27 | Trạm 115,5 m², cao 31 m; điều khiển vùng | 2.300.000/9.000 | D20 km; +15–50°C; ba vùng +20–50°C | 3 tinh thể/giờ | 200.000 Sắt Tinh Luyện + 100.000 Đồng + 50.000 Bí Ngân + 10.000 Vĩnh Hằng Kim + 10.000 Đá Rune + 5.000 Tinh Thể Bậc Thầy + 1.000 Tinh Lạc + 1.000 Delimo | E |
| 28 | Trạm 150 m², cao 36 m; hai vùng độc lập | 3.000.000/11.000 | D30 km; +15–50°C; ba vùng +20–50°C | 4 tinh thể/giờ | 300.000 Sắt Tinh Luyện + 150.000 Đồng + 80.000 Bí Ngân + 20.000 Vĩnh Hằng Kim + 20.000 Đá Rune + 8.000 Tinh Thể Bậc Thầy + 3.000 Tinh Lạc + 3.000 Delimo | A |
| 29 | Trạm 190 m², cao 44 m; bốn vùng độc lập | 4.000.000/13.500 | D40 km; +15–50°C; ba vùng +20–50°C | 5 tinh thể/giờ | 500.000 Sắt Tinh Luyện + 250.000 Đồng + 120.000 Bí Ngân + 40.000 Vĩnh Hằng Kim + 30.000 Đá Rune + 12.000 Tinh Thể Bậc Thầy + 6.000 Tinh Lạc + 6.000 Delimo | A |
| 30 | Trụ đen-lam cao hơn 50 m; tám vùng độc lập | 5.000.000/16.000 | D50 km; +15–50°C; ba vùng +20–50°C | 6 tinh thể/giờ | **Không có Cấp 31**; mở chuyển hóa Bản Vẽ Truyền Kỳ “Trụ Mosin” nếu đã học | E/A |

Nâng Lửa không có WU: sau khi reserve đúng recipe, giao diện xác nhận và commit tức thời theo event nguồn. Nhiên liệu chỉ giữ Lửa hoạt động; hết nhiên liệu làm tắt nhiệt, không giảm độ bền. Cấp 4 là cạnh kiểm chuẩn: `3→4` tiêu `20 Đá + 10 Gỗ`, tăng R40→R80 m, D/A 500/5→800/10, thêm lựa chọn Than và không được để trống thuộc tính.

## Phụ lục 1.J — Registry cố định Nhà Lãnh Chúa `LORD-HOUSE-UPGRADE-PATH-2.0`

Mỗi hàng là profile **sau khi đạt cấp**; recipe/WU là cạnh tới cấp kế. `D/A` là Độ Bền/Giáp; `Pop` là trần dân số do Nhà Lãnh Chúa cấp. `LH` trong prerequisite nghĩa Cấp Nhà Lãnh Chúa, `Fire` nghĩa Cấp Lửa. Hình thể đích, diện tích, tầng/cao độ, D/A và Pop là `physical_and_functional_delta` bắt buộc của thẻ.

`canonical_rows_sha256=00b3d8176be73eb503e5848af3a2bb0e36fb648cf130d078cdcf8a63d3ce23ca` (cùng chuẩn canonical table rows).

| Cấp | Hình thái đích; diện tích/tầng | D/A | Pop | Recipe + điều kiện lên Cấp kế | WU/max | Nhãn |
|---:|---|---:|---:|---|---:|:---:|
| 1 | Nhà gỗ một tầng, 30 m² | 940/5 | 50 | 100 Gỗ + 100 Đá | 16/4 | E/A |
| 2 | Nhà đá hai tầng, 90 m² | 1.500/25 | 100 | 200 Gỗ + 200 Đá + 50 Sắt | 16/4 | E/A |
| 3 | Nhà đá hai tầng hoàn thiện, 150 m² | 2.300/50 | 200 | 400 Gỗ + 300 Đá + 100 Sắt; Fire 8 | 32/4 | A |
| 4 | Nhà trung tâm hai tầng, 240 m² | 3.000/90 | 400 | 700 Gỗ + 450 Đá + 200 Sắt + 50 Sắt Tinh Luyện + 5 Bí Ngân; Fire 10 | 64/4 | A |
| 5 | Nhà Lãnh Chúa lớn, 360 m² | 4.000/150 | 606 | 1.000 Gỗ + 600 Đá + 300 Sắt + 100 Sắt Tinh Luyện + 10 Bí Ngân + 20 Tinh Thể Nguyên Tố Trung Cấp; Fire 11 | 95,85/4 | E |
| 6 | **Phủ Lãnh Chúa**, ba tầng, 500 m² | 8.000/300 | 1.019 | 3.000 Gỗ + 1.500 Đá + 900 Sắt + 400 Sắt Tinh Luyện + 50 Bí Ngân + 30 Tinh Thể Nguyên Tố Trung Cấp; Fire 12 | 115,53/4 | E |
| 7 | Phủ ba tầng, 560 m² | 12.000/450 | 2.019 | 6.000 Gỗ + 3.000 Đá + 1.800 Sắt Tinh Luyện + 200 Bí Ngân + 100 Tinh Thể Nguyên Tố Trung Cấp; Fire 14 | 150/4 | A |
| 8 | Phủ ba tầng mở rộng, 630 m² | 18.000/600 | 3.019 | 10.000 Gỗ + 5.000 Đá + 3.000 Sắt Tinh Luyện + 400 Bí Ngân + 200 Tinh Thể Nguyên Tố Trung Cấp; Fire 16 | 220/4 | A |
| 9 | Phủ gia cường, 700 m² | 26.000/800 | 4.019 | 16.000 Gỗ + 8.000 Đá + 5.000 Sắt Tinh Luyện + 700 Bí Ngân + 300 Tinh Thể Nguyên Tố Trung Cấp; Fire 18 | 320/6 | A |
| 10 | Phủ hoàn chỉnh, 780 m² | 40.000/1.000 | 5.019 | 25.000 Gỗ + 12.000 Đá + 8.000 Sắt Tinh Luyện + 1.200 Bí Ngân + 500 Tinh Thể Nguyên Tố Trung Cấp; Fire 20 | 450/6 | A |
| 11 | **Thành Lãnh Chúa**, 820 m², cao 10 m | 80.000/1.400 | 11.019 | 40.000 Gỗ + 20.000 Đá + 12.000 Sắt Tinh Luyện + 2.000 Bí Ngân + 800 Tinh Thể Nguyên Tố Cao Cấp; Fire 21 | 520/6 | A |
| 12 | Thành 850 m², cao 11 m | 120.000/1.700 | 12.019 | 60.000 Gỗ + 30.000 Đá + 18.000 Sắt Tinh Luyện + 3.000 Bí Ngân + 1.200 Tinh Thể Nguyên Tố Cao Cấp | 600/6 | A |
| 13 | Thành 880 m², cao 12 m | 180.000/2.000 | 13.019 | 90.000 Gỗ + 45.000 Đá + 25.000 Sắt Tinh Luyện + 5.000 Bí Ngân + 2.000 Tinh Thể Nguyên Tố Cao Cấp | 680/6 | A |
| 14 | Thành 910 m², cao 13 m | 260.000/2.400 | 14.019 | 130.000 Gỗ + 65.000 Đá + 35.000 Sắt Tinh Luyện + 8.000 Bí Ngân + 3.000 Tinh Thể Nguyên Tố Cao Cấp | 720/6 | A |
| 15 | Thành 930 m², cao 13,5 m | 380.000/2.800 | 15.019 | 200.000 Gỗ + 85.000 Đá + 45.000 Sắt Tinh Luyện + 12.000 Bí Ngân + 500 Tinh Thể Bậc Thầy | 750/8 | A |
| 16 | Thành 947 m², cao 14 m | 500.000/3.200 | 16.019 | 300.000 Gỗ + 100.000 Đá + 50.000 Sắt Tinh Luyện + 20.000 Bí Ngân + 1.000 Tinh Thể Bậc Thầy; Fire 25 | 784,58/8 | E |
| 17 | Thành 1.040 m², cao 16 m | 550.000/4.000 | 17.019 | 350.000 Gỗ + 80.000 Đá + 55.000 Sắt Tinh Luyện + 25.000 Bí Ngân + 2.000 Tinh Thể Bậc Thầy + 500 Gỗ Cổ | 800/8 | A |
| 18 | Thành 1.145 m², cao 19 m | 600.000/4.800 | 18.019 | 400.000 Gỗ + 60.000 Sắt Tinh Luyện + 30.000 Bí Ngân + 3.000 Tinh Thể Bậc Thầy + 1.000 Gỗ Cổ | 814,57/8 | E |
| 19 | Thành 1.250 m², cao 20 m | 700.000/5.600 | 19.019 | 500.000 Gỗ + 80.000 Sắt Tinh Luyện + 40.000 Bí Ngân + 4.000 Tinh Thể Bậc Thầy + 2.000 Gỗ Cổ; Fire 26 | 900/8 | A |
| 20 | Thành 1.360 m², cao 21 m | 800.000/6.500 | 20.019 | 650.000 Gỗ + 100.000 Sắt Tinh Luyện + 50.000 Bí Ngân + 6.000 Tinh Thể Bậc Thầy + 3.000 Gỗ Cổ + 1.000 Tinh Lạc | 980/8 | A |
| 21 | Thành 1.500 m², cao 22 m | 950.000/7.500 | 21.019 | 800.000 Gỗ + 130.000 Sắt Tinh Luyện + 65.000 Bí Ngân + 8.000 Tinh Thể Bậc Thầy + 4.000 Gỗ Cổ + 2.000 Tinh Lạc; Fire 27 | 1.080/8 | A |
| 22 | Thành 1.650 m², cao 23 m | 1.150.000/8.700 | 22.019 | 1.000.000 Gỗ + 170.000 Sắt Tinh Luyện + 80.000 Bí Ngân + 10.000 Tinh Thể Bậc Thầy + 5.000 Gỗ Cổ + 3.000 Tinh Lạc | 1.200/10 | A |
| 23 | Thành 1.820 m², cao 24 m | 1.400.000/10.000 | 23.019 | 1.250.000 Gỗ + 220.000 Sắt Tinh Luyện + 100.000 Bí Ngân + 13.000 Tinh Thể Bậc Thầy + 7.000 Gỗ Cổ + 5.000 Tinh Lạc; Fire 28 | 1.350/10 | A |
| 24 | Thành 2.000 m², cao 25 m | 1.700.000/11.500 | 24.019 | 1.550.000 Gỗ + 280.000 Sắt Tinh Luyện + 125.000 Bí Ngân + 16.000 Tinh Thể Bậc Thầy + 9.000 Gỗ Cổ + 7.000 Tinh Lạc | 1.520/10 | A |
| 25 | Thành 2.200 m², cao 26 m | 2.000.000/13.000 | 25.019 | 1.900.000 Gỗ + 350.000 Sắt Tinh Luyện + 150.000 Bí Ngân + 20.000 Tinh Thể Bậc Thầy + 12.000 Gỗ Cổ + 10.000 Tinh Lạc + 2.000 Delimo; Fire 29 | 1.720/12 | A |
| 26 | Thành 2.410 m², cao 27 m | 2.300.000/14.600 | 26.019 | 2.300.000 Gỗ + 430.000 Sắt Tinh Luyện + 180.000 Bí Ngân + 25.000 Tinh Thể Bậc Thầy + 15.000 Gỗ Cổ + 14.000 Tinh Lạc + 4.000 Delimo | 1.950/12 | A |
| 27 | Thành 2.630 m², cao 28 m | 2.600.000/16.200 | 27.019 | 2.800.000 Gỗ + 520.000 Sắt Tinh Luyện + 220.000 Bí Ngân + 30.000 Tinh Thể Bậc Thầy + 20.000 Gỗ Cổ + 20.000 Tinh Lạc + 7.000 Delimo; Fire 30 | 2.220/12 | A |
| 28 | Thành 2.860 m², cao 29 m | 2.900.000/17.800 | 28.019 | 3.400.000 Gỗ + 630.000 Sắt Tinh Luyện + 270.000 Bí Ngân + 38.000 Tinh Thể Bậc Thầy + 26.000 Gỗ Cổ + 28.000 Tinh Lạc + 11.000 Delimo | 2.540/14 | A |
| 29 | Thành 3.100 m², cao 30 m | 3.200.000/19.400 | 29.019 | 4.200.000 Gỗ + 780.000 Sắt Tinh Luyện + 330.000 Bí Ngân + 48.000 Tinh Thể Bậc Thầy + 34.000 Gỗ Cổ + 38.000 Tinh Lạc + 16.000 Delimo | 2.900/16 | A |
| 30 | Thành trên 30 m, ba tầng chức năng vĩ mô | 3.600.000/21.000 | khoảng 30.000 | **Không có Cấp 31**; có thể chuyển hóa thành Điện Lãnh Chúa bằng Bản Vẽ riêng | — | A |

Tăng cấp không chỉ “mở Cấp”: thẻ phải so hai hàng liền nhau và nêu rõ diện tích/tầng/độ cao tăng, D/A tăng, Pop tăng, đổi hình thái ở Cấp 6 và 11, cùng các công trình liên kết vừa mở. `5→6` phải giữ đúng recipe nguồn; `16→17` và `17→18` giữ các profile/recipe đã quan sát. Không dùng bảng này làm recipe cho nhà dân.

## Phụ lục 1.K — Registry cố định Nhà Nông Phu Cực Địa `POLAR-FARMHOUSE-PROGRESSION-2.0`

`canonical_rows_sha256=890e187701b4b0bc565b6cdabff9df84d941eee52084ca1f4d05d63ba0dabb46` (cùng chuẩn canonical table rows).

| Cấp | Hình thái/diện tích | D/A | Chỗ; phí gọi 1 người | Hiệu quả cư trú | Recipe + điều kiện lên Cấp kế | WU/max | Nhãn |
|---:|---|---:|---|---|---|---:|:---:|
| 1 | Lều cực địa 12 m² | 1.250/5 | 4; 5 Lương Thực | che rét nền | 50 Gỗ + 30 Đá | 1,20/4 | E |
| 2 | Nhà thấp 30 m² | 2.500/10 | 8; 5 | không tăng hồi phục | 200 Gỗ + 100 Đá + 50 Sắt; Nhà Lãnh Chúa 3 | 7/4 | E/A |
| 3 | Nhà gỗ-đá 40 m² | 4.000/20 | 12; 10 | hồi Thể Lực +10% | 300 Gỗ + 180 Đá + 100 Sắt + 20 Sắt Tinh Luyện; Nhà Lãnh Chúa 4 | 16/4 | A |
| 4 | Nhà kín 50 m² | 6.500/35 | 16; 20 | hồi Thể Lực +20% | 450 Gỗ + 300 Đá + 150 Sắt + 50 Sắt Tinh Luyện + 5 Tinh Thể Nguyên Tố Sơ Cấp; Nhà Lãnh Chúa 5 | 32/4 | A |
| 5 | Nhà đá một tầng cao khoảng 3 m, 60 m² | 9.000/50 | 20; 50 | hồi Thể Lực +30% | **500 Đá + 300 Gỗ + 200 Sắt + 100 Sắt Tinh Luyện + 10 Tinh Thể Nguyên Tố Trung Cấp**; Nhà Lãnh Chúa 6 | 60/4 | E |
| 6 | Nhà đá hai tầng 90 m² | 15.000/80 | 32; 75 | hồi Thể Lực +40% | 800 Đá + 600 Gỗ + 350 Sắt + 200 Sắt Tinh Luyện + 30 Bí Ngân + 20 Tinh Thể Nguyên Tố Trung Cấp; Nhà Lãnh Chúa 7 | 90/4 | A |
| 7 | Nhà hai tầng 120 m² | 24.000/120 | 48; 100 | hồi Thể Lực +50% | 1.300 Đá + 900 Gỗ + 500 Sắt Tinh Luyện + 100 Bí Ngân + 40 Tinh Thể Nguyên Tố Trung Cấp; Nhà Lãnh Chúa 8 | 140/6 | A |
| 8 | Nhà khối 160 m² | 36.000/170 | 68; 125 | hồi Thể Lực +60% | 2.000 Đá + 1.400 Gỗ + 900 Sắt Tinh Luyện + 250 Bí Ngân + 80 Tinh Thể Nguyên Tố Trung Cấp; Nhà Lãnh Chúa 9 | 220/6 | A |
| 9 | Khu nhà 210 m² | 52.000/230 | 92; 150 | hồi Thể Lực +75% | 3.200 Đá + 2.200 Gỗ + 1.500 Sắt Tinh Luyện + 500 Bí Ngân + 150 Tinh Thể Nguyên Tố Trung Cấp; Nhà Lãnh Chúa 10 | 340/8 | A |
| 10 | Khu nhà lớn 280 m² | 75.000/300 | 120; 200 | hồi Thể Lực +90% | trần tuyến; “Nhà Công Nhân” là Bản Vẽ khác, không phải Cấp 11 | — | A |

Mỗi lần nâng phải hiển thị delta diện tích, tầng/hình thái, chỗ ở, phí gọi dân, hồi Thể Lực và D/A. Phí gọi dân là chi phí triệu hồi, không phải bảo trì nhà. Cạn lương thực không làm nhà mất độ bền. Cấp 5 là neo nguồn bắt buộc: `5→6` mở tầng hai và tăng 20→32 chỗ bằng đúng recipe ở bảng.

Commit nguyên tử cho cả ba registry: xác nhận `target=current+1`, kiểm đúng version/hash, reserve toàn recipe, chạy WU nếu registry có, rồi nạp nguyên profile đích. Không được tăng cấp trước rồi bịa profile sau; không được dùng recipe của một dòng như công thức tăng trưởng chung.

Ký hiệu `Clamp(min,max,x)` dùng dấu chấm thập phân trong bản máy; dấu phẩy chỉ là cách hiển thị tiếng Việt. Blank trong các YAML schema là **ô mẫu**, không phải default và không được thi hành. Dữ kiện đã seed nhưng người chơi chưa thấy là `STATE_UNOBSERVED`; luật thiếu owner/version là `UNKNOWN_RULE` và bị chặn ở preflight.
