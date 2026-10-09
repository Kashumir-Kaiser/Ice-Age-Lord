# LORD DND / LÍ LAN — PHÂN NHÁNH KIẾN TRÚC MA PHÁP & KHO CÔNG TRÌNH

**Bản thiết kế đề xuất:** `LL-WEB-MAGICAL-BUILDING-CATALOG-0.3.0`  
**Dùng cho:** bản game web, *một* nhân vật điều khiển: Lí Lan, `SSS — Tử Phục Linh Sư`.  
**Trạng thái:** chưa tác động tới các file nguồn ACTIVE, thế giới LL01, kho đồ, công trình đã xây hoặc save thật.  
**Phạm vi:** **143 nhánh kiến trúc có mục đích riêng**, chia **11 nhóm**, trong đó **19 hợp đồng thí điểm có con số thiết kế** và **124 đề xuất cần hoàn thiện hợp đồng trước khi mở khóa**.

## 0. Kết luận nghiên cứu và ranh giới nguồn

Bản mở rộng xuất phát từ ý tưởng người chơi: **Ruộng Canh Tác → Linh Điền**; **Giếng Nước → Nguyệt Giếng** tạo nước trị thương **ít hơn, chậm hơn** nước thường. Tác phẩm lãnh chúa *Bất Hủ Tiên Vực* mô tả công trình ruộng biến thành Linh Điền sản lượng mạnh, giếng thành loại nước Nguyệt Hoa có tác dụng hồi máu/mana và hồi hàng vào ban đêm; Chương 16–17 có tương tác **nước giếng → tưới Linh Điền → xác suất nông sản phẩm đặc biệt**. Cường độ 10× trong truyện **do nhân vật khác sở hữu năng lực đột biến riêng**; không áp nguyên xi cho Lí Lan.

Các truyện *Thiên Phú Hợp Thành*, *Binh Chủng Của Ta Biến Dị*, *Điểm Danh Nhận Giảm Giá Thần Khí* và *Từ Tiểu Viện Tàn Tạ...* cung cấp gợi ý về kiến trúc tài nguyên, phúc địa/ôn tuyền, đào tạo quân, giếng trăng và xưởng. **Họ có thiên phú khác của nhân vật khác**: chỉ dùng ý tưởng kiến trúc, không chuyển cơ chế riêng của nhân vật đó cho Lí Lan.

**Phân loại chứng cứ:** `[FILE_LOCKED]` (File 01/04/06) → `[NOVEL_PRIMARY]` (truyện Băng Phong gốc như File 04 định nghĩa) → `[OTHER_NOVEL_ANALOGY]` → `[USER_EXAMPLE]` → `[ORIGINAL_GAME_DESIGN]`. Các dòng catalogue đều là **tên/hiệu ứng đề xuất**: ngay cả khi ghi N1/N2, đó chỉ là *nguồn cảm hứng*, không chứng minh toàn dòng tồn tại nguyên văn trong tiểu thuyết.

## 1. Luật kiến trúc ma pháp — đừng phát minh thiên phú thứ hai cho Lí Lan

1. **Không có nút miễn phí 'Biến Dị'.** Lí Lan không nhận năng lực biến đổi mọi công trình. Phân nhánh chỉ thông qua **Bản Vẽ chuyên biệt đã học**, công trình nền đúng ID, vật liệu thật, chỗ xây, thợ và WU. Công trình mới xây từ Bản Vẽ cũng là lựa chọn hợp lệ. Bản Vẽ chưa tìm được không hiện như đã sở hữu.
2. **Bảo toàn 11 công trình khai cuộc.** `OPENING-FIXED-BUILDINGS-2.0` & `POLAR-FARMHOUSE-PROGRESSION-2.0` kiểm đúng cấp, vật liệu và hiệu năng của công trình gốc. Phân nhánh thêm = contract/module/nhà khác, **không ghi đè nâng cấp gốc** hay hạ cấp chính.
3. **Giếng thường vẫn thiết yếu.** Nguyệt Giếng không thay nguồn cấp nước đời sống. Kho Nguyệt Hoa Thủy riêng, tái tạo theo pha đêm, không nhân đôi khi save/load; trị thương áp cho actor sống/có pool tương thích chứ không làm tử thi bất tử.
4. **Ruộng ma pháp cần đất, giống, nước và mùa thực.** Dòng `Linh Điền` chỉ tăng hiệu suất khi có cây giống và điều kiện thực. Không tự sinh linh mễ, dược thảo hay nhân bản hạt giống. Muốn trồng cây ngoài vùng nhiệt phải có cấu trúc giữ ấm/loài chịu lạnh, không dùng ký tự **ma pháp** để xóa băng tuyết.
5. **Sức mạnh không đồng nghĩa cộng chỉ số:** phân nhánh có thể đổi *mặt hàng*, *chất lượng*, *tốc độ*, *tính mùa*, *chiến thuật* và *phạm vi dùng*. Hỏa Mạch Điền so với Hàn Tủy Điền là hai loại canh tác khác nhau, không phải "+10% sản lượng" hai lần.
6. **Chống phá luật Tử Phục:** Tử Phục xác thật vẫn miễn phí, không hồi chiêu/cap; xác và Hero giữ identity, tiến trình; chỉ direct-revived mirror XP. Không làm công trình đọc xác khi hệ thống đã hiện thông tin hợp lệ, không tạo tà khí làm phí triệu hồi.
7. **Rõ vật chất:** chuyển đổi `input → output` phải có container, bảo toàn lượng, hao hụt/phế phẩm, vị trí, lao động, năng lượng nếu có và **hợp đồng sản xuất**. Thưởng đặc biệt yêu cầu chứng cứ/seed trước, không gieo công trình khi người chơi thiếu nó.
8. **Không tăng trụ cột lãnh địa bằng mua cấp:** Cấp `H`, Cấp Lửa, Cấp Nhà Lãnh Chúa và Cấp công trình là bốn trục riêng trong File 01. Nhánh ma pháp không âm thầm sửa bất kỳ trục nào.
9. **Người chơi thấy đúng nguồn tri thức:** `BUILT_IN` hay `LEARNED_BLUEPRINT` (XOR); chỉ biết cạnh nâng đang mở; bộ danh mục thiết kế nội bộ không đồng nghĩa toàn bộ hiện ở UI hoặc được trao blueprint.
10. **Phân biệt hoàn thiện:** `V0_3_BALANCE_CONTRACT_READY_FOR_REVIEW` = đã có nguyên liệu/WU/hiệu ứng nhưng phải phê duyệt/kiểm thử trước active. `DESIGN_PROPOSAL_NOT_IN_WORLD` = ý tưởng nội bộ không thể xây; không giả làm vật phẩm đã tồn tại.

### Cấu trúc cây phân nhánh

```text
Ruộng Canh Tác (Bản Vẽ thường, chưa mặc định học ở T0)
├─ nâng cấp thường theo nguồn/công thức đã biết
├─ Linh Điền [thực phẩm nhiều, mọc nhanh; cần nước/phân/giống]
├─ Dược Linh Điền [ít lương thực, dược liệu giá trị]
├─ Hàn Tủy Điền [cây hàn tính ngoài vòng nhiệt]
└─ Hỏa Mạch Điền [cây ưa nóng tại site có nhiệt]

Giếng Nước
├─ nâng cấp thường [nhiều nước dùng sinh hoạt]
├─ Nguyệt Giếng [ít Nguyệt Hoa Thủy; HP/Mana, ngưng đêm]
├─ Tịnh Tuyền [lọc nước bẩn]
└─ Hỏa Mạch Tuyền [nước nóng/sưởi tại điểm địa nhiệt]

Tháp Canh/Tháp Tiễn
├─ tháp thường: lính bắn/canh theo khả năng sẵn có
├─ Tháp Hàn Tiễn [sát thương hàn, khống chế]
├─ Tháp Hỏa Tiễn [cháy và phá mục tiêu bắt lửa]
└─ Tháp Lôi Xạ [đánh giáp kim loại, kho điện hạn chế]
```

**Không phải mọi nhánh đều là 'nâng cấp cấp 1→2'.** Một nhánh có thể gắn mô-đun trên building instance gốc, thay đổi loại kiến trúc với bằng chứng nâng cấp, hoặc đòi Bản Vẽ dựng một instance mới. Phải chỉ rõ trên hợp đồng.

## 2. Hiệu ứng kết hợp giữa công trình (không tạo tài sản miễn phí)

| Chuỗi thực | Tác dụng | Quy tắc chống lợi dụng |
|---|---|---|
| **Nguyệt Giếng → Linh Điền** | Dùng bình Nguyệt Hoa Thủy thật để tưới một vụ, có cơ hội nhỏ tạo sản phẩm phụ mang Nguyệt tính | 1 bình bị debit; cùng vụ nhận tối đa 1 lần kích hoạt; không reroll theo reload; cần giống có nhãn tương thích |
| **Nhà Vệ Sinh → Phân Hữu Cơ → Linh Điền** | Dân cư sinh chất thải → công trình xử lý → phân bón làm đầu vào ruộng | Không có dân/chất thải thì không có phân; lượng phân có ledger riêng |
| **Trạm Lò Than → Lửa Sinh Tồn / Bếp / Lò Sưởi** | Tạo nhiên liệu than để dùng theo profile nhiên liệu nguồn | Chỉ khi có công thức mẻ Gỗ→Than; không tự định lượng conversion còn thiếu trong save cũ |
| **Hàn Tủy Điền → Xưởng Luyện Dược** | Thảo dược hàn được luyện thành thuốc chịu lạnh | Cần công thức thuốc thật; hiệu ứng từng thuốc không auto gộp |
| **Linh Phong Trại → Vườn Quả → Dược Thiện Phường** | Ong thật thụ phấn cây → quả đạt chất lượng → món dược thiện | Không nhân bản đàn ong, không tạo quả nếu chưa trồng/cây không nở hoa |
| **Trạm Nấu Tuyết → Nhà Kính** | Tuyết thành nước, dùng trồng trọt có sưởi | Thu hoạch phụ thuộc nước, nhiệt và mùa; không để nhà kính tạo nước ngược |
| **Xưởng Chế Biến Quặng → Lò Rèn → Tháp Hàn Tiễn** | Quặng thật → sắt/phụ gia → module tháp gây sát thương | Trang bị thật, vật dẫn và đạn/charge có ledger; không bắn xuyên tường |
| **Nguyệt Giếng → Phòng Y Tế / Dục Đường** | Phân bổ nước quý giữa hồi phục nhanh, ca điều trị và tắm nghỉ | Một bình chỉ tiêu thụ tại một nơi; hiệu quả hồi phục không stack lặp |
| **Rừng Ươm Mộc → Xưởng Gỗ → Nhà Ở** | Trồng cây thật rồi khai thác thành gỗ/vật liệu xây | Cây có tuổi trưởng thành, hệ sinh thái; không spawn gỗ miễn phí mỗi tick |

## 3. KHO KIẾN TRÚC MA PHÁP — PHÂN NHÁNH THEO CÔNG DỤNG

**Ký hiệu độ sâu:** `I` = mở rộng sớm (không đồng nghĩa được cấp tại T0); `II` = kỹ nghệ/định cư; `III` = hiếm/đế chế; `IV` = kỳ quan. Đây là độ sâu thiết kế, **không phải** Bậc cấu trúc hoặc phẩm vật phẩm. `N1...N7` trong cột Gợi ý dẫn về §7. `D` nghĩa là thiết kế mới, không được mô tả như canon.
### Lương thực & canh tác — 25 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-001` | Ruộng Canh Tác → **Linh Điền** **●** | Tăng sản lượng và rút ngắn chu kỳ từ hạt giống thật | Đất linh bị suy nếu thiếu nước/phân; không tạo hạt giống | I | U, N1 |
| `LL-MAG-002` | Ruộng Canh Tác → **Hàn Tủy Điền** | Trồng cây chịu băng và thảo dược hàn tính ngoài vòng nhiệt | Chỉ hỗ trợ giống cây tương thích; các cây ưa ấm phát triển chậm | II | D |
| `LL-MAG-003` | Ruộng Canh Tác → **Hỏa Mạch Điền** | Trồng nông sản nhiệt đới trên nền băng nhờ địa nhiệt | Cần nguồn địa nhiệt hoặc cấp nhiệt thật; khô đất khi thiếu nước | II | D |
| `LL-MAG-004` | Ruộng Canh Tác → **Dược Linh Điền** **●** | Trồng dược thảo có phẩm và nồng độ hoạt chất xác định | Sản lượng thực phẩm thấp; cần giống dược thảo đã có | II | D, N2 |
| `LL-MAG-005` | Ruộng Canh Tác → **Tinh Sương Điền** | Tạo nông sản tích sương; dùng làm nguyên liệu thuốc chống lạnh | Phụ thuộc chu kỳ lạnh đêm và luống lưới; giảm vụ ngày | II | D |
| `LL-MAG-006` | Ruộng Canh Tác → **Kim Tuệ Điền** | Trồng giống lúa linh mễ cho khẩu phần tăng hồi năng lượng ngoài chiến đấu | Không thể biến lúa thường thành linh mễ; thiếu giống thì không sản xuất | III | N1, N3 |
| `LL-MAG-007` | Ruộng Canh Tác → **Dạ Hoa Điền** | Trồng hoa ăn được và dược liệu chỉ trưởng thành trong tối | Không sinh trưởng khi thiếu bóng tối theo profile loài | II | D |
| `LL-MAG-008` | Ruộng Canh Tác → **Tịnh Thổ Điền** | Lọc ô nhiễm đất qua vụ cây hấp phụ và cho nông sản an toàn về sau | Vụ đầu là cây xử lý không ăn được; đất quá độc vẫn không trồng | II | D |
| `LL-MAG-009` | Ruộng Canh Tác → **Thổ Linh Luống** | Trồng củ sâu kháng sương; thu được thực phẩm và củ giống | Phải làm lại luống sâu, cần đất đủ chiều dày | I | D |
| `LL-MAG-010` | Ruộng Canh Tác → **Phù Không Linh Điền** | Trồng cây tại bệ cao vùng thiếu đất; vùng rễ được nuôi bởi dung dịch | Rất đắt, cần nước và dung dịch liên tục; không gia tăng đất claim | III | D |
| `LL-MAG-011` | Nhà Kính → **Nhà Kính Tụ Dương** **●** | Tích nhiệt ban ngày để đỡ nhiên liệu sưởi đêm | Ngày thiếu nắng không tích được nhiều nhiệt; không tăng crop yield vô cớ | I | D |
| `LL-MAG-012` | Nhà Kính → **Nhà Kính Linh Vũ** | Tưới sương nước theo recipe trồng và đều trên các luống | Tiêu nước thật; đường ống đóng băng sẽ dừng tưới | II | N1, D |
| `LL-MAG-013` | Nhà Kính → **Nhà Kính Nhật Nguyệt** | Luân phiên chiếu sáng và tối cho giống cây có hai pha | Không thể dùng đồng thời hai chế độ; tiêu vật dẫn ánh sáng | III | D |
| `LL-MAG-014` | Vườn Ươm → **Linh Chủng Viên** **●** | Ủ hạt phẩm cao thành cây con tăng tỷ lệ sống khi đem trồng | Không sinh giống mới hoặc tăng số hạt; yêu cầu giống thật | I | N2 |
| `LL-MAG-015` | Vườn Ươm → **Vườn Ươm Đông Miên** | Bảo quản mầm cây mùa đông mà không tăng trưởng | Chiếm chỗ dài hạn, tốc độ thành cây chậm hơn vườn thường | II | D |
| `LL-MAG-016` | Vườn Ươm → **Vườn Ươm Phân Chi** | Nhân cây bằng giâm/chiết với tỉ lệ sống hữu hạn | Đầu vào phải là cây mẹ và vật liệu ghép; không clone tự do | II | D |
| `LL-MAG-017` | Vườn Cây Ăn Trái → **Nguyệt Quả Viên** | Quả chín mang hiệu ứng hồi thể lực nhẹ trên người sống | Đậu quả theo đêm, cây mẹ ít quả hơn cây phổ thông | II | D |
| `LL-MAG-018` | Vườn Cây Ăn Trái → **Xích Dương Quả Viên** | Quả cung cấp tích nhiệt tạm thời khi ăn | Tiêu khoáng nhiệt, khó trồng ở địa hình hàn âm | II | D |
| `LL-MAG-019` | Vườn Cây Ăn Trái → **Thọ Mộc Quả Viên** | Sinh trái hiếm dùng trong recipe thuốc phục hồi thể chất | Chu kỳ nhiều mùa; không tăng trực tiếp tuổi thọ không giới hạn | III | D |
| `LL-MAG-020` | Trại Nuôi Ong → **Linh Phong Trại** | Ong thụ phấn tăng tỷ lệ đậu quả; tạo mật linh nếu hoa phù hợp | Cần đàn ong thật, thức ăn và điều kiện nhiệt; ong có thể chết | II | N2 |
| `LL-MAG-021` | Trại Nuôi Ong → **Băng Phong Trại** | Ong chịu lạnh thụ phấn cây vùng ngoài nhiệt | Sản lượng mật thấp hơn trại linh thường | II | D |
| `LL-MAG-022` | Chuồng Gia Súc → **Linh Mục Trường** | Nuôi gia súc linh thú đã thuần hóa để lấy sữa, thịt, lông đặc biệt | Cần con giống/khẩu phần; không sản xuất thú từ hư không | II | N2, D |
| `LL-MAG-023` | Chuồng Gia Súc → **Sương Nhung Trại** | Nuôi thú cho lông chống lạnh dùng trong Tiệm May | Sản lượng thịt thấp; chăm sóc nhiều | I | D |
| `LL-MAG-024` | Ao Cá → **Hàn Ngư Trì** | Nuôi cá băng có dầu giữ nhiệt cho thực phẩm và đèn | Cần cá bố mẹ và nước có oxy, dễ cạn nguồn thức ăn | II | D |
| `LL-MAG-025` | Ao Cá → **Linh Liên Trì** | Trồng sen/dược liên trong ao, thu hạt và rễ | Không đồng thời tối ưu nuôi cá; cần nước linh thích hợp | II | D |

### Nguồn nước — 12 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-026` | Giếng Nước → **Nguyệt Giếng** **●** | Đêm ngưng Nguyệt Hoa Thủy giúp trị thương và hồi mana giới hạn | Tốc độ nước rất thấp so với giếng thường; chỉ tạo mẻ ban đêm | II | U, N1, N5 |
| `LL-MAG-027` | Giếng Nước → **Tịnh Tuyền** **●** | Lọc nước bẩn thành nước uống thật | Cần vật liệu lọc, nguồn nước và xử lý chất thải | I | D |
| `LL-MAG-028` | Giếng Nước → **Hàn Tủy Tuyền** | Cho nước lạnh với tác dụng giảm bỏng/nhiệt độc theo kháng tính | Không thay nước chữa bệnh phổ quát; dễ đóng băng ống | II | D |
| `LL-MAG-029` | Giếng Nước → **Hỏa Mạch Tuyền** | Cung cấp nước nóng cho sưởi và tắm chữa lạnh | Chỉ khi có nguồn nhiệt; gây nguy cơ bỏng nếu không pha | II | N2, D |
| `LL-MAG-030` | Giếng Nước → **Sinh Cơ Tuyền** | Ngưng nước có tác dụng hỗ trợ hồi phục sau điều trị | Lượng nhỏ, không hồi sinh hay chữa thương chí mạng tức khắc | III | D |
| `LL-MAG-031` | Giếng Nước → **Dưỡng Dược Tuyền** | Cung cấp dung dịch làm nguyên liệu thuốc/dược điền | Không có hiệu quả trị thương trực tiếp bằng uống | II | D |
| `LL-MAG-032` | Giếng Nước → **Thạch Nhũ Tuyền** | Ngưng khoáng chất nước đặc cho công thức rèn/thuốc | Nhiều cặn, không thích hợp uống thường xuyên | II | D |
| `LL-MAG-033` | Trạm Nấu Tuyết → **Lò Tuyết Tịnh Hỏa** **●** | Nấu tuyết và lọc bệnh nguyên bằng lửa nguyên tố | Tiêu nhiên liệu thật và tinh thạch nạp lần; không lấy nước từ không khí | I | D |
| `LL-MAG-034` | Trạm Nấu Tuyết → **Nguyệt Tuyết Đài** | Làm tan tuyết thành nước có hồi thể lực nhẹ lúc trăng xuất hiện | Nước thường chỉ ở ban ngày; đêm sản lượng chậm hơn trạm nền | II | D |
| `LL-MAG-035` | Trạm Nấu Tuyết → **Băng Lộ Ngưng Đài** | Thu sương giá sạch từ mặt đón gió để pha chế thuốc | Phụ thuộc độ ẩm thời tiết và bề mặt ngưng; lượng ít | II | D |
| `LL-MAG-036` | Hồ Chứa Nước → **Hồ Trấn Hàn** | Giữ nước ở trạng thái lỏng dù nhiệt thấp, phục vụ khu dân cư | Cần năng lượng duy trì; mất nguồn thì nước đóng băng | II | D |
| `LL-MAG-037` | Hồ Chứa Nước → **Hồ Quang Minh** | Lắng lọc tà uế loại tương thích trước khi phân phối | Không thanh tẩy mọi loại độc; cần xử lý bùn đáy | III | D |

### Thực phẩm & bếp — 13 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-038` | Bếp Đơn Giản → **Bếp Hỏa Tinh** **●** | Nấu món có hiệu ứng giữ nhiệt ngắn, nguyên liệu thật | Cần recipe và nhiên liệu Hỏa; không tăng số món miễn phí | I | D |
| `LL-MAG-039` | Bếp Đơn Giản → **Dược Thiện Phường** | Nấu món ăn hồi phục sức sau bệnh từ dược liệu | Nấu lâu hơn bếp thường; không thay ca điều trị | II | D |
| `LL-MAG-040` | Bếp Đơn Giản → **Bếp Linh Vị** | Tạo phần ăn phẩm cao hỗ trợ mana ở người dùng phù hợp | Tốn linh dược/linh mễ, không tạo mana cho Tử Phục | II | N1, D |
| `LL-MAG-041` | Bếp Đơn Giản → **Bếp Hàn Ẩm** | Chế biến thịt thú băng không mất hiệu quả hàn tính của nguyên liệu | Không dùng cho cây ưa nóng; đầu ra kén người ăn | II | D |
| `LL-MAG-042` | Bếp Đơn Giản → **Thiện Đường Chúng Dân** | Nấu suất lớn cho dân cư và giảm thất thoát suất qua định lượng | Tăng suất cần nhiều nguyên liệu/nhân lực, không buff tự động | I | D |
| `LL-MAG-043` | Nhà Kho Lương → **Kho Hàn Phong** **●** | Ngăn hư thực phẩm ở ô kho có sẵn mà không tạo sản lượng | Chiếm slot kho chuyên dụng; cần nguồn lạnh hoặc môi trường | I | D |
| `LL-MAG-044` | Nhà Kho Lương → **Kho Thời Tàng** | Làm chậm hư hỏng thực phẩm cao phẩm bằng ấn bảo quản | Tốn ấn/chỗ, không dừng thời gian toàn thế giới | III | D |
| `LL-MAG-045` | Nhà Kho Lương → **Kho Linh Chủng** | Giữ sức nảy mầm của hạt giống tốt trong mùa lạnh | Không thay kho lương ăn được, bảo quản sai loài gây mất mầm | II | D |
| `LL-MAG-046` | Nhà Xay Bột → **Phong Luân Ma Ma** | Xay lúa thành bột bằng cối gió ma pháp ở vùng nhiều gió | Không có lúa thì không xay; gió mạnh có thể ngừng | II | D |
| `LL-MAG-047` | Nhà Xay Bột → **Tinh Thạch Nghiền Phường** | Nghiền thảo dược/linh mễ thành bột đều và ít hao hụt | Tiêu mài mòn đá nghiền; tốc độ thấp với khoáng cứng | II | D |
| `LL-MAG-048` | Lò Sấy → **Xích Hỏa Hồng Lô** | Sấy thịt cá nhanh và diệt tác nhân gây bệnh loại đã biết | Dễ làm mất dược tính của nguyên liệu linh; tiêu nhiên liệu | I | D |
| `LL-MAG-049` | Nhà Ủ Rượu → **Nguyệt Tửu Phường** | Ủ rượu làm dung môi dược và đồ uống phục hồi tinh thần | Chu kỳ lâu; cần men và nước đặc thù | II | D |
| `LL-MAG-050` | Nhà Ủ Rượu → **Băng Hương Cất Phòng** | Chưng cất dung dịch chống lạnh từ quả hàn và thảo dược | Nguyên liệu hữu hạn, rượu không thay hồi HP | II | D |

### Cư trú & sức khỏe — 12 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-051` | Nhà Nông Phu Cực Địa → **Nhà Nông Phu Linh Noãn** | Tăng khả năng giữ ấm của phòng và phục hồi thể lực khi ngủ | Không tăng số giường/cấp hay đổi phí gọi dân đã khóa | II | D |
| `LL-MAG-052` | Nhà Nông Phu Cực Địa → **Nhà Nông Phu Tịnh Tức** | Giảm truyền bệnh hô hấp tại phòng có người nghỉ | Cần không khí sạch; không chữa người đã nhiễm | II | D |
| `LL-MAG-053` | Nơi Trú Nhỏ → **Nơi Trú Tụ Nhiệt** | Tích giữ nhiệt theo ca, tăng thời gian ấm sau khi lò tắt | Không tự tạo nhiệt mới, không vượt số chỗ nền | I | D |
| `LL-MAG-054` | Nơi Trú Nhỏ → **Nơi Trú Hồi Sức** | Người sống nghỉ có giường được tăng tốc hồi thể lực | Cần ngủ thực sự, thức ăn và nhiệt; không hồi máu tức thì | II | D |
| `LL-MAG-055` | Nơi Trú Nhỏ → **Hàn Quang Tĩnh Xá** | Cách âm và giảm căng thẳng sau trận chiến | Giảm số người ở vì không gian yên tĩnh | II | D |
| `LL-MAG-056` | Phòng Y Tế → **Phòng Y Tế Tịnh Quang** | Điều trị vết thương nhiễm uế hệ tương thích ở bệnh nhân sống | Cần thuốc, bác sĩ và giường; không chữa tử thi thành lính | II | D |
| `LL-MAG-057` | Phòng Y Tế → **Hàn Ngọc Điều Dưỡng Viện** | Ổn định bệnh nhân sốt/bỏng và hồi phục dài ngày | Điều trị dài hơn; công suất thấp hơn bệnh xá thường | II | D |
| `LL-MAG-058` | Phòng Y Tế → **Sinh Cơ Dược Viện** | Dùng nước sinh cơ và dược liệu phục hồi thương tổn có thể chữa | Cực kỳ hiếm, ca điều trị và nguyên liệu bắt buộc | III | D |
| `LL-MAG-059` | Lò Sưởi Đơn Giản → **Lò Sưởi Hỏa Văn** **●** | Đổi nhiên liệu thành nhiệt ổn định khi gió lớn | Tiêu tinh thạch ở khởi động; vẫn phải nạp nhiên liệu | I | D |
| `LL-MAG-060` | Lò Sưởi Đơn Giản → **Lò Sưởi Địa Mạch** | Khai thác địa nhiệt địa điểm có sẵn để giảm đốt gỗ | Chỉ xây tại điểm địa nhiệt, không chuyển địa nhiệt vào Lửa Sinh Tồn | II | N2, D |
| `LL-MAG-061` | Nhà Tắm → **Nguyệt Hoa Dục Đường** **●** | Tắm với lượng Nguyệt Hoa Thủy để giảm mệt mỏi và tổn thương nhẹ | Tranh nước chữa trị với Nguyệt Giếng; nhiều lượt không stack | II | D |
| `LL-MAG-062` | Nhà Tắm → **Địa Nhiệt Ôn Tuyền** | Tắm nước nóng từ địa nhiệt và giảm trạng thái nhiễm lạnh | Phải có vent và nguồn nước; không tự hồi vết thương sâu | II | N2 |

### Tài nguyên & chế tác — 18 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-063` | Xưởng Gỗ → **Mộc Linh Công Phường** | Chuyển gỗ thật thành cấu kiện đã gia cường chống ẩm | Số đơn vị gỗ đầu vào không tăng; thêm vật dẫn Mộc | II | D |
| `LL-MAG-064` | Xưởng Gỗ → **Hàn Vân Cưa Xưởng** | Cưa gỗ cứng băng giá với hao hụt lưỡi thấp hơn | Chỉ có lợi khi gỗ bị băng; công suất thường không tăng | I | D |
| `LL-MAG-065` | Xưởng Gỗ → **Phong Luân Mộc Xưởng** | Dùng gió thật để giảm nhiên liệu cưa gỗ | Ngày lặng gió hoạt động chậm | II | D |
| `LL-MAG-066` | Xưởng Chế Biến Quặng → **Địa Hỏa Tuyển Quặng** | Phân tách xỉ khỏi quặng nhiều tạp chất | Tiêu nhiệt/than, sản lượng tinh kim không vượt hàm lượng đầu vào | II | D |
| `LL-MAG-067` | Xưởng Chế Biến Quặng → **Hàn Tinh Luyện Khoáng** | Tách tinh thể hàn tính khỏi quặng chứa nó | Không thể chiết tinh thể nếu quặng không có thành phần đó | II | D |
| `LL-MAG-068` | Xưởng Chế Biến Quặng → **Thổ Linh Tuyển Quặng** | Tăng khả năng thu hồi đá có kim loại bằng tuyển tỉ trọng | Thải xỉ thật và tiêu nước; không làm giàu mạch quặng | II | D |
| `LL-MAG-069` | Lò Rèn → **Hỏa Linh Đoán Lô** **●** | Tôi thép và tạo vũ khí có sát thương Hỏa từ đúng recipe | Cần phôi và vật liệu nguyên tố, có nguy cơ phế phẩm | II | D |
| `LL-MAG-070` | Lò Rèn → **Hàn Văn Đoán Lô** | Chế tạo binh khí/giáp chịu băng và khắc hàn văn | Khó rèn kim loại thường; cần người biết phù văn | II | D |
| `LL-MAG-071` | Lò Rèn → **Phá Giáp Trọng Lô** | Rèn vũ khí chuyên phá giáp với kết cấu nặng | Tiêu kim loại hơn rèn nhẹ, trang bị làm người dùng chậm | II | D |
| `LL-MAG-072` | Tiệm May → **Linh Ty Phường** | Dệt chỉ linh từ tơ thật để làm áo chống lạnh và đồ phép | Tơ đặc biệt hữu hạn, sản lượng may thường thấp | II | D |
| `LL-MAG-073` | Tiệm May → **Hàn Nhung Y Phường** **●** | Làm áo từ lông thú băng giảm mất nhiệt khi ra ngoài vùng nhiệt | Không bảo vệ khỏi lửa; yêu cầu da/lông và fitting | I | D |
| `LL-MAG-074` | Tiệm May → **Phù Văn Y Quán** | May áo có slot phù văn thật, kích hoạt theo nạp tinh thạch | Không tự tạo kỹ năng của người mặc; nhiều slot cần vật liệu hiếm | III | D |
| `LL-MAG-075` | Xưởng Cơ Khí → **Linh Cơ Công Xưởng** | Làm xe kéo, bơm và máy có phụ trợ ma pháp từ các linh kiện | Phải chế tạo bộ phận và nhiên liệu; không nhân số máy | II | N4, D |
| `LL-MAG-076` | Xưởng Cơ Khí → **Hàn Thiết Xa Phường** | Làm xe trượt/xe bánh chịu băng, dùng hàng thật | Tốc độ cao trên băng nhưng nặng và chậm trên đá lở | II | D |
| `LL-MAG-077` | Trạm Lò Than → **Hỏa Mạch Lò Than** **●** | Tạo than từ gỗ thật với thu hồi nhiệt phục vụ xưởng gần | Không tạo thêm Than nếu không có Gỗ; dư nhiệt chỉ theo mẻ đang chạy | II | D |
| `LL-MAG-078` | Trạm Lò Than → **Tịnh Yên Lò Than** | Thu khói/bụi than làm chất phụ gia luyện kim, giảm khói bay | Tốn bộ lọc, tốc độ than kém hơn lò nền | II | D |
| `LL-MAG-079` | Bãi Đá Gia Cố → **Thạch Linh Trường** | Gia cố và cắt đá thành phiến dùng trong thành lũy | Cần đá thật, lưỡi cắt và lao động; không sinh mỏ | II | D |
| `LL-MAG-080` | Kho Gỗ Có Mái → **Kho Mộc Ấn** | Bảo quản gỗ khỏi nấm, chống ẩm lô hàng có gắn phù | Phải niêm theo lô, tốn phù in; kho không to thêm | II | D |

### Năng lượng & nguyên tố — 8 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-081` | Trạm Nhiên Liệu → **Trạm Hỏa Tinh** | Rút nhiệt từ tinh thạch để cấp máy, tạo nhiệt phụ trợ | Tinh thạch tiêu hao theo năng lượng cấp, không có điện miễn phí | II | D |
| `LL-MAG-082` | Trạm Nhiên Liệu → **Địa Nhiệt Trạm** | Dùng dòng địa nhiệt để chạy máy vùng có mạch nóng | Đòi site địa nhiệt có dữ liệu, rò nhiệt có hazard | II | N2, D |
| `LL-MAG-083` | Trạm Nhiên Liệu → **Phong Linh Trạm** | Thu sức gió dùng cho máy và bơm | Thiếu gió thì ngừng, bão vượt thiết kế phải khóa cánh | II | D |
| `LL-MAG-084` | Trạm Nhiên Liệu → **Lôi Tinh Trạm** | Lưu năng lượng sét trong bình tụ khi có thời tiết/nguồn điện | Khó nạp, rủi ro quá tải và kho pin có giới hạn | III | D |
| `LL-MAG-085` | Lò Sưởi Đơn Giản → **Lò Sưởi Tinh Thạch** | Tỏa nhiệt bằng một module tinh thạch có charge rõ ràng | Hết charge dừng module, không được nạp từ Lửa Sinh Tồn | II | D |
| `LL-MAG-086` | Bể Nhiệt → **Bể Hỏa Phách** | Chứa nhiệt từ xưởng đang hoạt động và xả khi rét đột ngột | Không tạo nhiệt; chỉ lưu nhiệt đã thu được | II | D |
| `LL-MAG-087` | Trạm Than → **Hỏa Khí Tinh Lọc** | Tách khí đốt dùng cho bếp từ nhiên liệu đã chế biến | Có hao hụt đầu vào, nguy cơ cháy nổ; không nhân nhiên liệu | II | D |
| `LL-MAG-088` | Lò Phản Ứng → **Hàn Hỏa Giao Lô** | Dùng nhiệt độ chênh băng–lửa để cấp thiết bị đủ điều kiện | Cần cả nguồn nóng/lạnh và thiết bị; không tác động ngoài mạng | III | D |

### Phòng thủ & công thành — 15 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-089` | Tháp Canh Gỗ → **Tháp Hàn Tiễn** **●** | Chuyển tháp có lính canh thành tháp bắn băng khi có lõi/cung máy | Cần module cơ khí/phù; tấn công chỉ theo tầm nhìn thật | II | N1, N4 |
| `LL-MAG-090` | Tháp Canh Gỗ → **Tháp Hỏa Tiễn** | Tạo phát bắn Hỏa đốt mục tiêu có thể cháy | Nguy cơ đốt công trình gần; cần vật dẫn/tên | II | D |
| `LL-MAG-091` | Tháp Canh Gỗ → **Tháp Lôi Xạ** | Bắn tia điện chống đơn vị mặc giáp dẫn điện | Kho điện hữu hạn, yếu khi mục tiêu cách điện | III | D |
| `LL-MAG-092` | Tường Rào → **Tường Thạch Văn** | Gia cố tường thành bằng đá/phù để chịu công thành | Không tăng diện tích claim, nặng và tốn đá | II | D |
| `LL-MAG-093` | Tường Rào → **Tường Kinh Cức** **●** | Mọc gai có thể làm chậm và gây chảy máu kẻ bám tường | Đòi giống gai sống và nước; dễ cháy | II | N2, D |
| `LL-MAG-094` | Tường Rào → **Tường Hàn Tinh** | Tường gây đóng băng với kẻ chạm thực sự | Tiêu tinh thạch theo lần kích hoạt; có thể làm kẹt cửa đồng minh | III | D |
| `LL-MAG-095` | Cổng → **Huyền Thiết Trấn Môn** | Cổng thép nặng chống phá cửa và xung phong | Mở đóng chậm hơn, yêu cầu máy nâng | II | D |
| `LL-MAG-096` | Cổng → **Hỏa Ấn Trấn Môn** | Tạo dải lửa có hướng khi kẻ địch phá cổng | Dùng nhiên liệu/charge, có nguy cơ hại cả người bên trong | II | D |
| `LL-MAG-097` | Cổng → **Huyễn Môn** | Tạo ảo cảnh che chính lối vào khỏi trinh sát phép cấp thấp | Không đổi vị trí vật lý, bị khắc chế bởi dò cấu trúc | III | D |
| `LL-MAG-098` | Bẫy Thú Tuyết → **Băng Tỏa Trận** | Bẫy trói tạm kẻ đạp vào vùng gài | Cần nạp vật liệu mỗi lần; không tự săn toàn bản đồ | II | D |
| `LL-MAG-099` | Bẫy Thú Tuyết → **Hỏa Sấm Bẫy** | Tạo nổ nhiệt cục bộ khi cảm biến va chạm hợp lệ | Một lần nổ phải đặt lại; có friendly fire | II | D |
| `LL-MAG-100` | Tháp Tiễn → **Nguyên Tố Tiễn Tháp** | Đổi sát thương vật lý thành các profile nguyên tố đã mở | Phải chọn profile khi nạp; mỗi phần tử có kháng và counter | II | N1, N4 |
| `LL-MAG-101` | Tháp Tiễn → **Độc Phong Tiễn Tháp** | Bắn phi tiêu gây độc tồn lưu lên kẻ có thể nhiễm độc | Miễn nhiễm độc không bị ảnh hưởng, đạn dược tiêu thật | II | D |
| `LL-MAG-102` | Công Xưởng Công Thành → **Phá Băng Trọng Pháo** | Chế tạo vũ khí công thành phá tường băng hoặc rào | Vận chuyển chậm, cần đội thao tác và đạn | II | D |
| `LL-MAG-103` | Công Xưởng Công Thành → **Lôi Đình Nỗ Phường** | Chế tạo nỏ lớn phóng đạn dẫn sét | Cần nạp đạn/tinh thạch; kém hiệu quả dưới đất khô | III | D |

### Huấn luyện & kỹ năng — 10 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-104` | Trại Chiến Binh → **Chiến Binh Huyết Luyện Đường** | Dạy võ kỹ trong bộ curriculum thật, tăng mastery từ giờ tập | Phải có giáo viên, dụng cụ và người có agency/học được | II | D, N4 |
| `LL-MAG-105` | Trại Chiến Binh → **Băng Vệ Huấn Luyện Doanh** | Rèn kháng lạnh và chiến đấu tuyết cho đơn vị đủ điều kiện | Cần thời gian/thực hành, không biến đổi chủng loài | II | D |
| `LL-MAG-106` | Trại Chiến Binh → **Tử Thi Thực Chiến Trường** | Tử thi tập phản xạ chiến đấu có bộ kỹ năng tương thích | Không tạo kỹ năng chưa có/không tặng XP vô hạn cho lính rỗi | II | D |
| `LL-MAG-107` | Tháp Pháp Sư → **Hàn Pháp Tháp** | Luyện kỹ năng phép Hàn và chế tác đúng phép đã biết | Khắc chế hệ khác, yêu cầu người học phù hợp | II | D |
| `LL-MAG-108` | Tháp Pháp Sư → **Hỏa Pháp Tháp** | Luyện pháp thuật Hỏa và tinh chỉnh pháp khí Hỏa | Tiêu vật dẫn thử, nguy cơ cháy vùng tập | II | D |
| `LL-MAG-109` | Tháp Pháp Sư → **Nguyệt Minh Pháp Các** | Thiền định phục hồi Mana theo ca cho pháp sư có Mana | Không hồi HP hay Tử Phục, slot luyện hạn chế | II | N1, D |
| `LL-MAG-110` | Tháp Pháp Sư → **Ám Thuật Pháp Tháp** | Đào tạo thuật sĩ Ám trên bộ kỹ năng Ám hợp lệ | Không tạo kỹ năng độc quyền SSS hoặc thay chức nghiệp Lí Lan | III | D |
| `LL-MAG-111` | Điện Đường Kỵ Sĩ → **Hàn Thiết Kỵ Đường** | Rèn kỹ năng đỡ đòn và chống xung phong | Chỉ cưỡi được loài ngựa/thú đã thuần, yêu cầu kỵ sĩ hợp lệ | II | D |
| `LL-MAG-112` | Sân Tập Cung Thủ → **Phong Tiễn Sân** | Huấn luyện bắn khi gió lớn, giảm sai lệch do điều kiện gió | Cần đạn tập và giờ tập; không tự cấp kỹ năng | II | D |
| `LL-MAG-113` | Học Đường → **Linh Công Học Đường** | Dạy nghề linh canh, may linh ty, luyện dược cho dân có tố chất | Cần giáo viên và tài liệu nghề; không cấp nghề miễn phí | II | D |

### Thương mại & dân sinh — 10 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-114` | Quán Rượu → **Nguyệt Tửu Quán** | Bán dược tửu, có khách thật ghé khi biết vị trí và đường đi | Không tự tạo khách/anh hùng trong vùng chưa gieo | II | D |
| `LL-MAG-115` | Quán Rượu → **Băng Lữ Khách Điếm** | Nơi trú kèm dịch vụ chống lạnh cho thương khách thật | Có phí nhiên liệu/giường; giá cao làm giảm cầu | I | D |
| `LL-MAG-116` | Chợ → **Linh Vật Giao Các** | Bán linh vật/thuốc và đánh giá chất lượng bởi thương nhân thực | Không thay chợ hệ thống/không sinh đơn hàng | II | D |
| `LL-MAG-117` | Xưởng In → **Phù Ấn Phường** | Chế phù tiêu hao và bao bì đóng dấu nguồn gốc | Vật liệu, mực, người biết phù văn; không in tài nguyên | II | D |
| `LL-MAG-118` | Nhà Vệ Sinh → **Tịnh Uế Phường** **●** | Chuyển nước thải thành nước tưới không uống và bùn làm phân | Cần waste thật, chưa có dân sẽ không có nguyên liệu | I | N1, D |
| `LL-MAG-119` | Nhà Vệ Sinh → **Hương Thảo Tịnh Các** | Tách độc từ chất thải và dùng thảo mộc khử khuẩn | Không biến ô uế thành thuốc chữa bệnh; dùng thảo dược | II | D |
| `LL-MAG-120` | Đường Lát Đá → **Hàn Thạch Đạo** **●** | Mặt đường chống đóng băng và tăng khả năng xe qua | Mỗi đoạn có vật liệu riêng; không teleport | I | D |
| `LL-MAG-121` | Đường Lát Đá → **Phong Hành Đạo** | Mặt đường giảm lực kéo cho xe chở hàng ở đúng tile | Chỉ vận chuyển có bánh/trượt phù hợp; không buff quãng xa | II | D |
| `LL-MAG-122` | Đường Lát Đá → **Nguyệt Quang Lộ** **●** | Đường tự phát sáng yếu về đêm hỗ trợ tuần tra vật lý | Khi bị che ánh trăng cần tích năng lượng hoặc tắt | II | D |
| `LL-MAG-123` | Tháp Đồng Hồ → **Thời Khắc Đài** | Phát chuông đồng bộ ca sản xuất và cảnh báo lũ/bão khi có đo đạc | Không điều khiển thời gian và không hiển thị UI thay đồng hồ | II | D |

### Dã ngoại & thú nuôi — 10 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-124` | Trại Thợ Săn → **Băng Lang Săn Trường** | Tăng chất lượng dấu vết/trình độ săn cho thợ săn thật | Phải có con mồi thực, săn quá mức làm cạn quần thể | II | D |
| `LL-MAG-125` | Trại Thợ Săn → **Mộc Ảnh Săn Trường** | Ẩn trại dưới rừng để thú không phát hiện lều từ xa | Cần cây tán thật, không tàng hình đội đi săn | II | D |
| `LL-MAG-126` | Chuồng Ngựa → **Nguyệt Túc Mã Xá** | Hồi thể lực thú cưỡi sau chặng dài có nước tốt | Cần thức ăn, giường ổ; không tốc độ tức thời | II | D |
| `LL-MAG-127` | Chuồng Ngựa → **Hàn Thú Thuần Dưỡng Trại** | Thuần thú tuyết đã bắt được khi hành vi loài cho phép | Không biến boss/chủng thông minh thành vật nuôi | II | D |
| `LL-MAG-128` | Trại Gỗ → **Mộc Linh Ươm Lâm** | Trồng cây mới từ hạt và cây con quanh trại khai thác | Phục hồi chậm; không tạo gỗ trưởng thành miễn phí | II | D, N2 |
| `LL-MAG-129` | Trại Mỏ → **Linh Quặng Thăm Mạch** | Thăm dò mạch quặng trong vùng đào thật bằng dụng cụ cảm ứng | Không tự điền bản đồ chưa khảo sát; đo có sai số và độ sâu | II | D |
| `LL-MAG-130` | Trại Mỏ → **Địa Tủy Khai Khoáng** | Lấy đá/chất mạch nhiệt từ mỏ hiện có | Cần quyền đào, mạch thật và nguy cơ sập/hỏa khí | III | D |
| `LL-MAG-131` | Trại Cá → **Sương Ngư Giống Trại** | Ấp cá giống chịu lạnh từ trứng đã có | Không spawn cá, phụ thuộc nước và oxy | II | D |
| `LL-MAG-132` | Vườn Ươm → **Huyết Thảo Viên** | Nuôi cây dược hút máu thú săn đã thu hợp pháp | Nông sản có độc tính và cần xử lý, không tạo máu từ không | III | D |
| `LL-MAG-133` | Rừng Phòng Hộ → **Kinh Cức Trận Lâm** | Trồng hàng rào dây gai như công sự sống | Bị đốt cháy, tranh nước với nông nghiệp | II | N2, D |

### Kỳ quan & siêu phàm — 10 nhánh

| ID | Nền → Nhánh | Hiệu ứng thực | Đánh đổi / Điều kiện | Độ sâu | Gợi ý |
|---|---|---|---|---|---|
| `LL-MAG-134` | Tháp Pháp Sư → **Tinh Giới Quan Tinh Tháp** | Quan sát thiên tượng và mở thí nghiệm tinh thuật cần trời quang | Không cho bản đồ bí mật, chỉ tạo quan trắc thiên tượng | III | D |
| `LL-MAG-135` | Thư Viện → **Mộng Cảnh Thư Viện** | Tổ chức thử thách mộng cảnh phiên bản đã niêm và thưởng thực thể | Chỉ có slot/lượt được nguồn hợp đồng; không tạo XP miễn phí | IV | N4 |
| `LL-MAG-136` | Đài Truyền Tống → **Truyền Tống Trận** | Dịch chuyển người và cargo giữa hai neo đã mở và đang hoạt động | Tiêu vật dẫn và giới hạn tải; không biết tọa độ thì không đi | IV | N4 |
| `LL-MAG-137` | Trận Phòng Ngự → **Tĩnh Trệ Ma Năng Tháp** | Dựng lá chắn phòng công thành và nhiễu công kích đã xác định | Năng lượng dự trữ hữu hạn, không bảo hộ vô địch | IV | N4 |
| `LL-MAG-138` | Lò Rèn → **Tượng Thần Công Tượng** | Tăng năng lực chế tác các recipe đã nghiên cứu cho thợ tương thích | Hiếm, chỉ tác dụng tại xưởng thật, không phát vũ khí tự do | IV | N4 |
| `LL-MAG-139` | Rừng Linh Thụ → **Thế Giới Thụ Mầm Viên** | Nuôi cây cổ thụ địa điểm thực để tạo gỗ/quả đặc hữu theo mùa | Cây phải tồn tại từ cây non thật và lớn rất lâu | IV | N5, D |
| `LL-MAG-140` | Thần Điện → **Sinh Mệnh Thánh Đàn** | Hỗ trợ ca cứu chữa cực hiếm bằng vật tư và giáo sĩ thật | Không hồi sinh tự do, không phá quy tắc chết thứ hai | IV | D |
| `LL-MAG-141` | Hầm Quặng Cổ → **Địa Mạch Hạch Tâm** | Khai thác dòng địa mạch cho một mạng công trình nối vật lý | Đòi mạch hiện hữu, nguy cơ tranh chấp với phe địa phương | IV | D |
| `LL-MAG-142` | Linh Điền → **Ngũ Hành Tiên Điền** | Luân canh năm loại linh thực tương thích hệ nguyên tố | Phải có năm giống/nguồn nước; không buff chồng 5 lần | IV | D |
| `LL-MAG-143` | Nguyệt Giếng → **Nguyệt Hoa Thánh Tuyền** | Làm nguyên liệu thần dược cực hiếm từ tích lũy nhiều đêm | Không thay y viện, mỗi đợt sản lượng rất nhỏ | IV | N1, D |

**●** = một trong những nhánh có hồ sơ thông số vận hành riêng tại §4, chưa mặc nhiên active.

## 4. Hợp đồng có thông số để triển khai thử (DESIGN DEFAULT, KHÔNG PHẢI NGUỒN GỐC)

Đây là **19 hợp đồng thử nghiệm** được viết cụ thể hơn phần kho ý tưởng. Chúng là thông số *đề nghị* nhằm đủ rõ để viết và kiểm thử resolver, **không phải con số lấy từ tác phẩm**. Không dùng các công thức này để sửa ngầm save LL01 hoặc điều chỉnh thành tựu/bản vẽ đã có. Số người/giờ và nguyên liệu chỉ là **phần nâng mới** nếu `UPGRADE_MODULE/UPGRADE_SEGMENT`; công trình gốc vẫn cần tồn tại và tuân recipe gốc.

### 4.1. `LL-MAG-001` — Linh Điền

- **Gốc:** `Ruộng Canh Tác`; thực hiện: `NEW_PLOT`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 35, Đá: 25, Sắt: 5, Tinh Thể Nguyên Tố Sơ Cấp: 2; **16 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Mỗi ô gieo phải có hạt giống, nước và phân. Chu kỳ hợp lệ = chu kỳ gốc / 1.35; thu hoạch = floor(sản lượng cây giống × 1.6). 1 Tinh Thể dùng làm lõi cố định, không tiêu từng vụ. Không có giống linh mễ thì không ra linh mễ.
- **Đầu ra kiểm tra:** 1.6× vụ và 1.35× tốc độ; cần cây giống thật.
- **Điều kiện thất bại / phản tác dụng:** thiếu nước → 0, thiếu phân → hệ số nền.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.2. `LL-MAG-004` — Dược Linh Điền

- **Gốc:** `Ruộng Canh Tác`; thực hiện: `NEW_PLOT`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 35, Đá: 35, Sắt: 8, Tinh Thể Nguyên Tố Sơ Cấp: 3; **26 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Chỉ nhận cây có type medicinal. Hỗ trợ hiệu lực dược thảo +15% so với cây tương đồng ở ruộng thường khi được thu đúng chu kỳ; sản lượng khối lượng 0.70 lần ruộng thường. Mỗi 24 giờ cần 1 đơn vị phân linh đã có recipe.
- **Đầu ra kiểm tra:** Dược lực 1.15×, sản lượng 0.70×.
- **Điều kiện thất bại / phản tác dụng:** hạt thường không tự biến thành thảo dược.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.3. `LL-MAG-011` — Nhà Kính Tụ Dương

- **Gốc:** `Nhà Kính`; thực hiện: `NEW_GREENHOUSE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 90, Đá: 45, Sắt: 15, Tinh Thể Nguyên Tố Sơ Cấp: 1; **38 WU**, tối đa **6** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Tối đa 30 m² cây. Ban ngày tích tối đa 8 đơn vị nhiệt; trong mỗi giờ đêm tiêu 1 nhiệt cho nhà kính, thay tối đa 1 đơn vị nhiên liệu sưởi nhà kính; không thay Lửa Sinh Tồn. Nhiệt không dự trữ xuyên 2 đêm.
- **Đầu ra kiểm tra:** 30m² trồng; tích 8 giờ nhiệt tối đa.
- **Điều kiện thất bại / phản tác dụng:** thiếu nắng → cần cấp nhiệt thường.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.4. `LL-MAG-014` — Linh Chủng Viên

- **Gốc:** `Vườn Ươm`; thực hiện: `NEW_NURSERY`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 60, Đá: 30, Sắt: 8, Tinh Thể Nguyên Tố Sơ Cấp: 2; **28 WU**, tối đa **5** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Đầu vào 20 hạt thật + nước 10 đơn vị + 1 phân; sau 12 giờ cho tối đa 18 cây con cùng loài. Cây con giữ đúng phẩm di truyền của hạt; không tự tăng phẩm, không sinh thêm hạt. Theo điều kiện gieo, tối đa 18, có log hạt hỏng.
- **Đầu ra kiểm tra:** 20 hạt → tối đa 18 cây con/12 giờ.
- **Điều kiện thất bại / phản tác dụng:** không hạt/nước → không nảy.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.5. `LL-MAG-026` — Nguyệt Giếng

- **Gốc:** `Giếng Nước`; thực hiện: `NEW_WELL`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 20, Đá: 70, Sắt: 10, Tinh Thể Nguyên Tố Sơ Cấp: 4; **30 WU**, tối đa **5** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Tối đa 12 bình 0.5L trong kho; mỗi đêm đủ điều kiện, tích 8 bình 0.5L vào 04:00 (không vượt 12). Uống 1 bình: hồi 12 HP + 8 Mana cho người có hồ tương ứng; cùng nguồn hồi phục chỉ 1 bình/30 phút. Không tác dụng với tử thi không có cơ chế hồi phục phù hợp. Không sinh nước uống đại trà.
- **Đầu ra kiểm tra:** 4 L nước trị thương/đêm; không cấp nước sản xuất.
- **Điều kiện thất bại / phản tác dụng:** ban ngày 0; không có ánh trăng/tác nhân phù hợp → 0.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.6. `LL-MAG-027` — Tịnh Tuyền

- **Gốc:** `Giếng Nước`; thực hiện: `NEW_WELL`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 15, Đá: 45, Sắt: 5, Tinh Thể Nguyên Tố Sơ Cấp: 1; **18 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Nhận tối đa 50L nước không uống được/giờ, cho 40L nước uống được/giờ; 10L bùn/chất thải được ghi container riêng; cần một lõi lọc mỗi 1000L. Chất độc ngoài profile lọc không bị xóa.
- **Đầu ra kiểm tra:** 50L bẩn → 40L nước uống; sản xuất có vật lý.
- **Điều kiện thất bại / phản tác dụng:** không nguồn nước, thiếu lõi lọc → dừng.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.7. `LL-MAG-033` — Lò Tuyết Tịnh Hỏa

- **Gốc:** `Trạm Nấu Tuyết`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 15, Đá: 30, Sắt: 5, Tinh Thể Nguyên Tố Sơ Cấp: 1; **12 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Một mẻ: 20 đơn vị Tuyết/Băng đầu vào + 2 Gỗ → tối đa 15 đơn vị Nước Sạch sau 30 phút; sạch chỉ với contamination loại có trong recipe; tiêu gỗ thực. Gắn đúng Trạm Nấu Tuyết đã học/xây.
- **Đầu ra kiểm tra:** 20 tuyết + 2 gỗ → tối đa 15 nước sạch/30 phút.
- **Điều kiện thất bại / phản tác dụng:** mất nhiệt hoặc thiếu tuyết → 0.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.8. `LL-MAG-038` — Bếp Hỏa Tinh

- **Gốc:** `Bếp Đơn Giản`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 15, Đá: 25, Sắt: 8, Tinh Thể Nguyên Tố Sơ Cấp: 1; **14 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Khi nấu 4 phần từ cùng recipe hợp lệ, 1 viên Tinh Thể Hỏa hoặc vật dẫn tương thích cung cấp 12 charge; tiêu 1 charge/mẻ để nhận hiệu ứng giữ nhiệt +10% trong 2 giờ sau ăn. Bếp vẫn tốn nguyên liệu/nhiên liệu nền.
- **Đầu ra kiểm tra:** 4 khẩu phần/mẻ, hiệu ứng giữ ấm 2h.
- **Điều kiện thất bại / phản tác dụng:** không nạp vật dẫn thì chỉ ra món thường.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.9. `LL-MAG-043` — Kho Hàn Phong

- **Gốc:** `Nhà Kho Lương`; thực hiện: `NEW_STORAGE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 50, Đá: 20, Sắt: 5, Tinh Thể Nguyên Tố Sơ Cấp: 1; **18 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Có 20 ô lưu hàng lạnh. Trong môi trường <0°C, thực phẩm type perish giảm tiến độ hư xuống 25% tốc độ nền (không dừng); khi >=0°C và không có máy lạnh, trở về tốc độ nền. Lô hàng giữ timestamp riêng.
- **Đầu ra kiểm tra:** 20 ô chứa; 0.25× tốc độ hư khi đúng điều kiện.
- **Điều kiện thất bại / phản tác dụng:** mất điều kiện lạnh → 1× hư.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.10. `LL-MAG-059` — Lò Sưởi Hỏa Văn

- **Gốc:** `Lò Sưởi Đơn Giản`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 10, Đá: 20, Sắt: 6, Tinh Thể Nguyên Tố Sơ Cấp: 1; **10 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Ở Lò Sưởi có nhiên liệu thật, lúc gió lớn độ ổn định nhiệt được giữ tại mức cơ sở thay vì phạt mất 20% do gió; không giảm wood/coal charge vốn có và không thay radius/cấp của Lửa Sinh Tồn.
- **Đầu ra kiểm tra:** Kháng phạt gió cho 1 Lò Sưởi được gắn.
- **Điều kiện thất bại / phản tác dụng:** thiếu nhiên liệu vẫn tắt.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.11. `LL-MAG-061` — Nguyệt Hoa Dục Đường

- **Gốc:** `Nhà Tắm`; thực hiện: `NEW_BATHHOUSE`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 60, Đá: 60, Sắt: 12, Tinh Thể Nguyên Tố Sơ Cấp: 3; **30 WU**, tối đa **5** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Một ca tắm 1 giờ dùng 2 bình Nguyệt Hoa Thủy + 8 đơn vị nước thường, hỗ trợ hồi 15 stamina và giảm 1 mức hàn lạnh có thể chữa. Không hồi HP vết thương hoặc thanh tẩy mọi debuff. Tối đa 4 khách/ca.
- **Đầu ra kiểm tra:** 4 người/giờ từ 2 bình Nguyệt Hoa Thủy.
- **Điều kiện thất bại / phản tác dụng:** tranh nguồn nước Nguyệt Giếng với y tế.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.12. `LL-MAG-069` — Hỏa Linh Đoán Lô

- **Gốc:** `Lò Rèn`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 30, Đá: 50, Sắt: 20, Tinh Thể Nguyên Tố Sơ Cấp: 2; **32 WU**, tối đa **5** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Ở Lò Rèn Cấp đủ, mở recipe Đao Hỏa Văn: 5 Sắt + 1 Gỗ + 1 Tinh Thể Hỏa tương thích → 1 đao trong 6 giờ; mỗi đao có charge nguyên tố riêng, không tạo vũ khí miễn phí.
- **Đầu ra kiểm tra:** 1 vũ khí Hỏa/6h/recipe.
- **Điều kiện thất bại / phản tác dụng:** không tinh thạch phù hợp → không làm đao Hỏa.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.13. `LL-MAG-073` — Hàn Nhung Y Phường

- **Gốc:** `Tiệm May`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 25, Đá: 15, Sắt: 6, Tinh Thể Nguyên Tố Sơ Cấp: 1; **13 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Mở recipe áo choàng lông băng: 3 Da Thuộc tương thích + 1 Lông Băng + 1 Gỗ dùng cho khung → 1 áo trong 8 giờ/1 trạm; cách nhiệt bonus 0.30, không stack với cùng item slot. Tài nguyên phải có trong kho.
- **Đầu ra kiểm tra:** 1 áo/8h từ vật liệu thật.
- **Điều kiện thất bại / phản tác dụng:** cần lông băng; chiếm slot áo.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.14. `LL-MAG-077` — Hỏa Mạch Lò Than

- **Gốc:** `Trạm Lò Than`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 25, Đá: 40, Sắt: 15, Tinh Thể Nguyên Tố Sơ Cấp: 2; **24 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Khi Trạm Lò Than thực hiện một mẻ Gỗ→Than hợp lệ, module thu tối đa 6 đơn vị nhiệt vào Bể Nhiệt liền kề, sử dụng trong 6 giờ. Không có mẻ hoạt động thì không thu, công suất than vẫn theo recipe gốc chưa tự xác định.
- **Đầu ra kiểm tra:** thu 6 nhiệt/mẻ hợp lệ.
- **Điều kiện thất bại / phản tác dụng:** chưa có hợp đồng Gỗ→Than thì không thực thi.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.15. `LL-MAG-089` — Tháp Hàn Tiễn

- **Gốc:** `Tháp Canh Gỗ`; thực hiện: `UPGRADE_MODULE`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 65, Đá: 80, Sắt: 35, Tinh Thể Nguyên Tố Sơ Cấp: 4; **48 WU**, tối đa **6** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Gắn lên Tháp Canh Gỗ đã tồn tại, có mục tiêu thực trong LOS và 140m sẽ bắn một tên băng mỗi 5s, tạo 12 sát thương Hàn trước giáp/kháng theo engine và 20% giảm tốc 3s nếu trúng. Bắn tốn 1 charge/lần; một Tinh Thể Sơ Cấp nạp 40 charge.
- **Đầu ra kiểm tra:** 12 damage Hàn / 5s, range 140m.
- **Điều kiện thất bại / phản tác dụng:** cần nạp đạn/tinh thạch; bị che tầm nhìn không bắn.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.16. `LL-MAG-093` — Tường Kinh Cức

- **Gốc:** `Tường Rào`; thực hiện: `UPGRADE_SEGMENT`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 20, Đá: 8, Sắt: 2, Tinh Thể Nguyên Tố Sơ Cấp: 1; **10 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Chỉ trên một đoạn Tường 10m đã hoàn tất. Cần 10 hom Kinh Cức hợp lệ/đoạn, mỗi 12h 1 nước để giữ sống; kẻ leo có thể bị gây 4 damage vật lý mỗi giây tiếp xúc và bị kéo chân 10% tốc độ. Cây không tác dụng lên vật bay.
- **Đầu ra kiểm tra:** một đoạn 10m; 4 sát thương/s tiếp xúc.
- **Điều kiện thất bại / phản tác dụng:** cháy/thiếu nước → mất gai.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.17. `LL-MAG-118` — Tịnh Uế Phường

- **Gốc:** `Nhà Vệ Sinh`; thực hiện: `NEW_SANITATION`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 50, Đá: 20, Sắt: 5, Tinh Thể Nguyên Tố Sơ Cấp: 1; **22 WU**, tối đa **4** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Tiếp nhận tối đa 20 đơn vị Nước Thải/giờ từ cư dân hoạt động; sau 4 giờ dùng 80 Nước Thải đầu vào cho 5 Phân Hữu Cơ và 75 Nước Thải Sau Xử Lý, vật liệu riêng không uống được (đơn vị quy đổi của game). Không có chất thải thì 0; chưa có cư dân thì 0.
- **Đầu ra kiểm tra:** 80 nước thải → 5 phân và 75 nước thải xử lý tách dòng /4h.
- **Điều kiện thất bại / phản tác dụng:** thải độc vượt chuẩn cần lọc riêng.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.18. `LL-MAG-120` — Hàn Thạch Đạo

- **Gốc:** `Đường Lát Đá`; thực hiện: `UPGRADE_SEGMENT`; nhánh độ sâu `I`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 4, Đá: 15, Sắt: 2, Tinh Thể Nguyên Tố Sơ Cấp: 1; **8 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Một đoạn 10m Đường Lát Đá; tốc độ của actor/cargo bám đường hợp lệ +15% ở băng tuyết so với đi trên cùng đoạn đường đá không phủ; không ảnh hưởng combat riêng và không cộng chồng theo số đoạn.
- **Đầu ra kiểm tra:** 10m mặt đường chống băng.
- **Điều kiện thất bại / phản tác dụng:** địa hình đổ vỡ làm mất bonus.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

### 4.19. `LL-MAG-122` — Nguyệt Quang Lộ

- **Gốc:** `Đường Lát Đá`; thực hiện: `UPGRADE_SEGMENT`; nhánh độ sâu `II`.
- **Chi phí xây/lắp thêm (DESIGN DEFAULT):** Gỗ: 5, Đá: 14, Sắt: 2, Tinh Thể Nguyên Tố Sơ Cấp: 1; **9 WU**, tối đa **3** thợ trên một workfront.
- **Cơ chế vận hành đề xuất:** Đoạn 10m Đường Lát Đá phát sáng như đèn khuya sau một ngày hứng trăng, bán kính chiếu 8m qua LOS. Nếu bão/tuyết che trăng liên tiếp thì mỗi đêm mất 1 charge và tự tắt. Không dò người ẩn hình.
- **Đầu ra kiểm tra:** 10m đường và 8m chiếu sáng.
- **Điều kiện thất bại / phản tác dụng:** thiếu nguồn trăng → tắt.
- **Không được vượt luật:** nguyên vật liệu/vật dẫn tiêu trong cùng transaction, công trình có thật/đã học Bản Vẽ; không tạo thêm tài nguyên, không sửa Cấp Lửa, không tăng năng lực Tử Phục.

## 5. Tiến trình lấy bản vẽ — nguồn được khóa trước khi người chơi tìm được

- **Bản Vẽ gốc đã có ở LL01**: không thay thế profile/nâng cấp File 04. Ví dụ *Trạm Lò Than* có recipe xây đã được chốt nhưng **tỉ lệ Gỗ→Than còn chưa niêm** trong checkpoint D1 22:00. Phải đóng hợp đồng vận hành của nó riêng trước khi chạy máy, không giả định đầu ra để làm combo.
- **Biến thể magic** là bản vẽ học được độc lập; mỗi Bản Vẽ có `origin_site_id/owner_id/chest_receipt_id/market_offer_id/quest_reward_id`, `knowledge_grant`, recipe xây, WU, footprint, staff, component, output và hash.
- **Dự trữ trong thế giới**: không rải lại 192 Rương Báu đã khóa, không làm 15 lair/693 units reroll, không tạo thương nhân chỉ để bán bản vẽ đang thiếu. Nếu muốn thêm bản vẽ cho *game mới*, phát hành **world-package version mới** trước T0 với nguồn cụ thể; game LL01 đã bắt đầu cần một sự kiện hợp lệ/thiết kế riêng không chỉnh sửa nguồn cũ.
- **Hàng đặc biệt** có thể là blueprint hoặc item instance thật (ví dụ khoang ôn tuyền tự nhiên), không có quyền tồn tại trên menu cho tới khi phát hiện/kiểm tra.
- **Độ hiếm/độ sâu không tự cấp hệ số x10**. Hiệu ứng kỳ quan phải có giới hạn rõ ràng về sản phẩm/chu kỳ, tác dụng và phản chế. Thế giới không scale lại để bắt kịp Lí Lan.

## 6. Resolver, UI và trường dữ liệu bắt buộc

```yaml
magical_building_variant:
  branch_id: LL-MAG-001
  parent_template_id: actual_template_id
  variant_template_id: actual_variant_id
  status: DESIGN_PROPOSAL_NOT_IN_WORLD | V0_3_BALANCE_CONTRACT_READY_FOR_REVIEW | APPROVED_ACTIVE
  design_evidence: [USER_EXAMPLE, OTHER_NOVEL_ANALOGY, ORIGINAL_GAME_DESIGN]
  knowledge_class: LEARNED_BLUEPRINT
  blueprint_receipt_id: required_to_build
  upgrade_mode: NEW_PLOT | NEW_WELL | NEW_* | UPGRADE_MODULE | UPGRADE_SEGMENT
  prereq_building_instance_id: required_if_module
  valid_site_predicates: []
  footprint_m2: required_if_new_structure
  materials: {actual_material_instance_or_stack_ids: amounts}
  work_units: exact_number
  max_workers: exact_number
  operating_recipe: {inputs: {}, outputs: {}, duration_seconds: 0}
  storage_profile: {capacity: 0, unit: item_units}
  effect_tags: []
  counter_and_failure_rules: []
  allowed_actor_tags: []
  provenance_ref_ids: []
  version: string
  sha256: string
```

**V0.3 đưa ra 20 operation contracts có số, nhưng chưa hoàn thành toàn bộ phần blueprint hợp lệ** (`footprint`, HP, armor, site predicate, worker profession, input item registry, visual assets). Do đó các dòng chưa phải nút xây được; số trong §4 là khung triển khai đã phân biệt và có thể đưa vào kiểm thử mô phỏng. Không tuyên bố đã cập nhật web runtime hay giải quyết các prerequisite còn chưa viết.

**Giao diện người chơi:** click công trình → *Nâng cấp thường* | *Nhánh đã học*; từng nhánh hiển thị khác biệt sản lượng, loại hàng mới, tiêu hao, giờ làm, chống khắc chế, nguyên liệu cần, thuộc tính cái nào chưa biết. Nhánh chưa học không hiển thị công thức hay nguồn rơi đã bị che; tùy UI có thể chỉ hiện 'Bản Vẽ chưa học'.

**Độ bền:** theo File 04 chỉ giảm do công kích/hành vi có `BUILDING_ATTACK_DAMAGE` hợp lệ; thiếu nước/đá/tinh thạch chỉ dừng sản xuất, không tự ăn mòn HP tòa nhà.

### Kiểm thử bắt buộc

1. `Linh Điền` không thu hoạch nếu không có seeds hoặc water; thu hoạch cố định input/seed/time; tái tải save không thu thêm.
2. `Nguyệt Giếng` làm đầy từng đêm một lần, clamped stock, không tính nhầm 24h là 24 đêm; đã uống trừ bình thật.
3. Nước Nguyệt Giếng chia cho y viện, ruộng, nhà tắm: một bình không bao giờ dùng hai lần.
4. Giếng thường vs Nguyệt Giếng: nước sinh hoạt throughput lớn hơn Nguyệt Giếng ở cùng giai đoạn.
5. Lượng cây thu/thuốc chế tạo có provenance để bán/ăn/tưới, không ghép vụ thành tài nguyên bất tận.
6. Nhánh magic không làm thay đổi upgrade edge của 11 công trình cố định và `POLAR-FARMHOUSE-PROGRESSION-2.0`.
7. No blueprint/no item/no site → từ chối tạo, không backfill sau khi player mở UI.
8. Tháp ma thuật bắn đúng tầm, LOS, đạn và kháng; không phá luật sản sinh zombie.
9. `Tử Phục` miễn phí/bất giới hạn; công trình không chặn thông tin xác vốn giao diện đã hiển thị.
10. Thành quả production và kết quả chiến đấu tái lập theo seed/actions, timestamp idempotent.
11. Những profile yêu cầu thứ chưa có item definition hoặc source site được đánh `BLOCKED_UNMATERIALIZED_RESOURCE` (không biến thành available).
12. Không trộn N1/N2 'đột biến của Ngô Trì/Trần Từ' thành thiên phú thứ hai của Lí Lan.

## 7. SỔ NGUỒN THAM KHẢO — rõ độ chắc chắn

Các trang dưới là truyện tiếng Việt/convert **tham khảo**, không ưu tiên hơn File 01–06; một số mục là *mục lục* chứ không phải thân chương đã xác minh. Ghi nhận nguồn một cách trung thực để agent phát triển không lẫn nguồn với suy diễn. Trước khi thương mại hóa, kiểm tra quyền sử dụng tên riêng/cơ chế độc đáo của tác phẩm khác, và ưu tiên cơ chế lấy cảm hứng hơn sao chép nguyên văn.

- **N1 — Toàn Dân Lĩnh Chủ: Bắt Đầu Chế Tạo Bất Hủ Tiên Vực** (Cơ Giới Chi Chủ): Chương 15–17, ngữ liệu tiếng Việt, Linh Điền 100m², Giếng Ánh Trăng tạo nước đêm, tương tác tưới cây; tháp nguyên tố/binh doanh trong giới thiệu. [https://diendantruyen.com/threads/toan-dan-linh-chu-bat-dau-che-tao-bat-hu-tien-vuc.56630/](https://diendantruyen.com/threads/toan-dan-linh-chu-bat-dau-che-tao-bat-hu-tien-vuc.56630/)
- **N2 — Lãnh Chúa Cầu Sinh: Thiên Phú Hợp Thành** (Kỳ Khai): Các chương 30, 33, 79 và 250: vườn ươm, suối địa nhiệt, linh điền và xây dựng tài nguyên qua nghề/công trình; tên ở mục lục không đủ chứng minh mọi con số. [https://trichtienlau.com/truyen/lanh-chua-cau-sinh-thien-phu-hop-thanh](https://trichtienlau.com/truyen/lanh-chua-cau-sinh-thien-phu-hop-thanh)
- **N2b — Lãnh Chúa Cầu Sinh: Thiên Phú Hợp Thành** (Kỳ Khai): Chương 250 ghi thực hành xây giếng/tài nguyên kiến trúc và buôn công trình đã dựng; không chuyển nguyên cơ chế công huân qua LL01. [https://www.tvtruyen.vip/lanh-chua-cau-sinh-thien-phu-hop-thanh/chuong-250](https://www.tvtruyen.vip/lanh-chua-cau-sinh-thien-phu-hop-thanh/chuong-250)
- **N3 — Lãnh Chúa Toàn Dân: Binh Chủng Của Ta Biến Dị** (Tiềm Thủy Đích Oa Ba): Tuyến tài nguyên thực vật/tiến hóa; các chương 28, 50, 151 và mục lục; hệ biến dị là tài năng của nhân vật khác, không cấp Lí Lan. [https://truyenss.com/truyen/lanh-chua-toan-dan-binh-chung-cua-ta-bien-di](https://truyenss.com/truyen/lanh-chua-toan-dan-binh-chung-cua-ta-bien-di)
- **N4 — Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa** (nguồn chính Lord DnD): Các loại nhà khai cuộc, tháp phòng thủ, xưởng cơ khí, tháp pháp sư, đường đá, giếng, ruộng, công trình kỳ quan (đã neo trong File 04). `file04:§14.6,§12.7`
- **N5 — Lãnh Chúa Cầu Sinh: Từ Tiểu Viện Tàn Tạ Bắt Đầu Đánh Chiếm** (truyện lãnh chúa tiếng Việt): Chương 16: Giếng Nguyệt Lượng; chương 20: bản vẽ chợ. Chưa xác minh toàn bộ thuộc tính giếng trong chương. [https://tienvuc.me/lanh-chua-cau-sinh-tu-tieu-vien-tan-ta-bat-dau-danh-chiem-dich](https://tienvuc.me/lanh-chua-cau-sinh-tu-tieu-vien-tan-ta-bat-dau-danh-chiem-dich)
- **N6 — Lãnh Chúa Toàn Dân: Điểm Danh Nhận Giảm Giá Thần Khí** (truyện lãnh chúa tiếng Việt): Chương 2,10,12,14 về bản vẽ siêu phàm, trại huấn luyện và công xưởng; chỉ dùng mẫu thiết kế, không sao chép discount tài năng. [https://tienvuc.me/lanh-chua-toan-dan-diem-danh-nhan-giam-gia-than-khi-dich](https://tienvuc.me/lanh-chua-toan-dan-diem-danh-nhan-giam-gia-than-khi-dich)
- **N7 — Toàn Dân Lãnh Chúa: Từ Triệu Hoán Nữ Đế Bắt Đầu Vô Địch** (truyện lãnh chúa tiếng Việt): Có hồ thiêng, cây thế giới, tháp liên châu/Thiên Nộ trong giới thiệu và mục lục; nhân vật khác có đá tạo hóa, không áp vào Lí Lan. [https://tienvuc.me/toan-dan-lanh-chua-tu-trieu-hoan-nu-de-bat-dau-vo-dich](https://tienvuc.me/toan-dan-lanh-chua-tu-trieu-hoan-nu-de-bat-dau-vo-dich)

**Sự khác nhau phải bảo lưu:**
- **N1, Chương 15–17:** chứng minh mô hình biến thể Linh Điền/giếng Nguyệt Hoa và tưới cây; nguồn kể sức mạnh thuộc riêng Ngô Trì, không là hệ thống biến thể công khai của Lí Lan.
- **N2, Chương 250:** nói tới các đội xây công trình giếng để bán; không chứng minh mọi vườn ươm có buff đúng như đề xuất.
- **N3/N5/N6/N7:** khi chỉ thấy tên chương hoặc mô tả truyện, đó **không đủ** để khẳng định thông số chi tiết. Mọi con số ở §4 thuộc DESIGN DEFAULT.

## 8. Thứ tự làm game thật

1. Cho cơ chế nông nghiệp/nước/địa hình/công nhân/tài nguyên gốc hoạt động trước.
2. Tạo bản vẽ chuẩn và event `BlueprintLearned`, nhánh tùy chọn không ghi đè nâng thường.
3. Triển khai trước **Linh Điền**, **Nguyệt Giếng**, **Tịnh Uế Phường**, **Bếp Hỏa Tinh**, **Nhà Kính Tụ Dương**, **Kho Hàn Phong** và **Tịnh Tuyền** với end-to-end production receipts.
4. Sau đó triển khai chuỗi dược liệu/giáp rèn/tháp bắn trước khi mở phúc địa/kỳ quan.
5. Chỉ khi các profile/nguồn loot có full blueprint contract mới promote `APPROVED_ACTIVE`; các hàng còn lại tiếp tục nằm trong bucket để designers hoàn thiện, không dùng generator nhét đủ số lượng một cách giả tạo.
