# LORD DND 03 — THẾ GIỚI, CHÍNH TRỊ, NPC, NGƯỜI CHƠI VÀ VĂN HÓA


> **Phạm vi bản 1.10.0 — 2026-08-29.** Đây là bộ quy tắc nền để viết truyện/campaign Lord DnD **khởi tạo sạch tại T0**. Cốt truyện, nhịp phát triển thế giới và chuỗi đại sự kiện **không để trống**: chúng lấy tác phẩm gốc được đặt trong dấu `<>`, hiện là **Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa**, làm canon khung. Thiết lập nhân vật chính đã được khóa tại File 06. Tên nhân vật có sẵn trong tác phẩm không bị sao chép/hard-code vào một campaign mới; Phụ lục 3.J giữ dàn nhân vật quan trọng của nguồn làm roster hiệu chỉnh. Bản 1.10.0 giữ nguyên toàn bộ 1.9.0—đặc biệt Phụ lục 3.K, `WORLD-PACKAGE-LL01-1.0`, 38 site, 10 player anchor, 41 cache, 192 Rương Báu, `CHEST-SEARCH-2.1-FIXED` và `LL01-HERO-LAIR-PACK-1.0` gồm 15 hang ổ/15 Hero/693 unit ID—rồi thêm `SPATIAL-SWEEP-GEOMETRY-1.0`: bán kính chỉ là envelope, còn diện tích thật được sinh từ lane của từng actor/team, lịch sử quét, thời gian đi–tìm–về và worldline của mục tiêu.
>
> **Thứ tự ưu tiên nguồn thiết kế:** `<>` là nguồn khống chế đối với cốt truyện, tiến trình thế giới, đại sự kiện và cơ chế cốt lõi. Truyện lãnh chúa khác và game RTS/4X/city-survival chỉ là nguồn phụ để lấp phần `<>` không nói rõ, tạo công thức và hoàn thiện logic; nguồn phụ không được ghi đè hướng cốt truyện gốc. Tất cả công thức định lượng trong bộ file này là mô hình tổng hợp mới, không phải số liệu sao chép từ tác phẩm nguồn.

> **Phân loại hằng số:** mọi công thức/worldbuilding template không có nhãn nguồn khác là `DESIGN_DEFAULT`; ví dụ là `EXAMPLE_ONLY`. Riêng campaign Lí Lan dùng các tọa độ, khoảng cách, mật độ, population, site, rương và actor đã materialize trong `WORLD-PACKAGE-LL01-1.0` cùng `LL01-HERO-LAIR-PACK-1.0` với nhãn `USER_LOCKED + CAMPAIGN_FIXED`; chúng không được reroll. Campaign khác vẫn cần `CAMPAIGN_SEEDED` hoặc event nguồn và không được sao chép từ lần chạy thử.

> **Khóa phát hành:** `document_id=LORD-DND-03`; `release_id=FILE03-1.10.0-SPATIAL-SWEEP.1`. Resolver phải xác minh bộ bốn `document_id + semantic_version + release_id + sha256` trong `RELEASE-LINEAGE-LL01-1.3.0`; chỉ số phiên bản không đủ để chọn file.


> Đây là **world engine triển khai canon của `<>`**, không phải một thế giới trắng chờ viết lại. Chi tiết nào `<>` đã xác định thì giữ vai trò, quan hệ, trình tự và hệ quả; chi tiết nào nguồn không nói rõ mới dùng engine để lấp logic. Hồ sơ Lí Lan đã khóa trong File 06; không còn trường tạo nhân vật bắt buộc chờ người dùng. Địa lý, chính trị, văn hóa, NPC nền và dữ kiện `STATE_UNOBSERVED` được seed/vận hành theo rule, không bị hoãn để hỏi lại.

## Mục lục

1. Nguyên tắc dựng thế giới
2. Tỷ lệ bản đồ và năm lớp không gian
3. Sinh địa hình, khí hậu, nước và biome
4. Tài nguyên, tuyến giao thông và vị trí định cư
5. Bản đồ đa lớp và sương mù thông tin
6. Địa lý chính trị và các cấp chủ quyền
7. Mười sáu mô hình chính thể
8. Hồ sơ năng lực nhà nước
9. Quan hệ song phương nhiều chiều
10. Ngoại giao, hiệp ước và cam kết
11. Chiến tranh, tiếp tế, chiếm đóng và hòa bình
12. Luật, tư pháp, thuế và hành chính
13. Kinh tế thế giới, tiền tệ, giá và thương mại
14. Dân số, hộ gia đình, tầng lớp và di cư
15. Kiến trúc NPC
16. Mục tiêu, quyết định, cảm xúc và đạo đức NPC
17. Ký ức, thông tin, tin đồn và phản gián
18. Lịch sinh hoạt và mô phỏng ngoài màn hình
19. Người chơi và dân bản địa: khác biệt tư duy
20. Văn hóa, ngôn ngữ, tín ngưỡng và bản sắc
21. Phe phái, mạng quan hệ và xung đột nội bộ
22. Bộ sinh biến cố chính trị–xã hội
23. Danh mục 54 vai NPC nền
24. Các biểu mẫu worldbuilding
25. Mật độ lãnh địa và thế lực bản địa
26. Sinh thái hữu hạn và số lượng sinh vật quanh lãnh địa
27. Trường nồng độ Rương Báu
28. Thời tiết, bóng tối và hạn trở về
29. Phụ lục 3.A–3.L

---

## 1. Nguyên tắc dựng thế giới

1. **Địa lý sinh ra chi phí.** Núi, sông, mùa, khoảng cách và đường quyết định chính trị; không đặt đế quốc khổng lồ ở nơi không thể liên lạc/nuôi quân nếu không có lời giải.
2. **Nhà nước không phải một người.** Quyết định đi qua triều đình, quan lại, quân đội, quý tộc, đô thị, làng, bang hội và giáo hội.
3. **Văn hóa không đồng nhất.** Trong một “dân tộc” vẫn có vùng, tầng lớp, thế hệ, nghề và phe.
4. **NPC biết điều họ có thể biết.** Không đọc suy nghĩ {{user}}, không tự biết giao diện hoặc bí mật canon.
5. **Người chơi không vô trùng văn hóa.** Họ mang ngôn ngữ, đạo đức, kỹ năng, thành kiến và thói quen từ thế giới cũ.
6. **Mọi bản đồ có lịch sử.** Biên giới, thành, đường, ruộng và phế tích phải có lý do tồn tại.
7. **Không có phe “ác vì cần quái”.** Có thể có tàn bạo, quỷ dị hoặc phi nhân, nhưng hành vi vẫn có sinh thái, lợi ích, giáo lý hay cơ chế.

## 2. Tỷ lệ bản đồ và năm lớp không gian

| Lớp | Độ phân giải | Công dụng | Cập nhật |
|---|---|---|---|
| Thế giới | 250–500 km/ô | lục địa, đại dương, khí hậu, đế chế | theo mùa/năm |
| Khu vực | 25–50 km/ô | tỉnh, lưu vực, tuyến thương mại, quân chiến dịch | ngày/tuần |
| Địa phương | 2–5 km/ô | làng, mỏ, rừng, tuần tra, encounter | giờ/ngày |
| Khu đất | 100–250 m/ô | lãnh địa, ruộng, công trình, tầm bắn công thành | phút/giờ |
| Cảnh | 1–5 m/ô | chiến đấu, đối thoại, điều tra | giây/lượt |

Tọa độ cha–con cố định. Một site thuộc một ô địa phương, một ô địa phương thuộc một khu vực. Không sinh “thành mới cách 5 phút” chỉ vì cốt truyện cần.

### 2.1. Quãng đường

\[
TravelTime=Distance/BaseSpeed\times Terrain\times Weather\times Load\times Security+Stops
\]

BaseSpeed: đi bộ đoàn 20–30 km/ngày trên đường tốt; quân lớn thấp hơn; kỵ/xe nhanh chỉ khi có đường, thức ăn và thay sức. Teleport là hạ tầng hiếm với điểm neo, năng lượng, tải và rủi ro.

`Security` trong TravelTime là hệ số route, không phải nhãn do narrator chọn. Chia route thành các segment, lấy `RouteSecurityScore=Σ(length_s×SecurityScore_s)/Σlength_s` từ zone state File 01 §11.4: score `≥75` cho hệ số `1,00`; `40≤score<75` cho `1,15`; `score<40` cho `1,35`. Segment chưa có `SecurityScore` hợp lệ làm ETA `INVALID_ROUTE_SECURITY_INPUT`; threat còn ẩn vẫn nằm trong score nội bộ nhưng UI được giữ khoảng sai số.

## 3. Sinh địa hình, khí hậu, nước và biome

### 3.1. Pipeline seed và override campaign cố định

Mười bước dưới chỉ là bộ sinh cho campaign chưa có gói thế giới. Campaign Lí Lan **không chạy lại** các bước này: nó nạp `WORLD-PACKAGE-LL01-1.0` ở Phụ lục 3.K cùng extension `LL01-HERO-LAIR-PACK-1.0` ở 3.L, xác minh từng hash rồi dùng nguyên tọa độ/topology/site/chest/ecology/player-anchor/lair đã khóa. Hành động khảo sát chỉ đổi tri thức `STATE_UNOBSERVED → observed`; nó không tạo địa hình, địa điểm hoặc hang ổ vào lúc được nhìn thấy.

1. Chọn kích thước, tỷ lệ biển, độ nghiêng trục, magic intensity.
2. Sinh mảng kiến tạo giả → dãy núi, rift, cao nguyên.
3. Tạo cao độ và độ dốc.
4. Chạy gió/ẩm/nhiệt theo vĩ độ và bóng mưa.
5. Chảy nước từ cao xuống thấp; hợp lưu tạo sông; lưu vực kín tạo hồ/đầm.
6. Gán đất, thảm thực vật và biome.
7. Đặt mạch tài nguyên theo địa chất, không rải đều.
8. Đặt phế tích/điểm siêu nhiên theo lịch sử hoặc leyline.
9. Đặt định cư và đường theo nước, đất, phòng thủ, cảng, mỏ, quyền lực.
10. Chạy 200–500 năm lịch sử khái quát để tạo biên giới và di sản.

### 3.2. Quy tắc thủy văn

Sông không tự tách làm hai trừ delta/kênh; thành lớn cần nguồn nước hoặc hạ tầng; ruộng dày cần đất và mùa; sa mạc có thành chỉ khi oasis, sông, aqueduct, caravan hoặc ma pháp trả chi phí.

### 3.3. Biome là gói cơ chế

Mỗi biome có nhiệt, mưa, mùa, đất, nước, tầm nhìn, tốc đi, bệnh, tài nguyên, sinh vật, nguy cơ và kỹ thuật thích nghi. “Rừng” không chỉ đổi màu bản đồ.

## 4. Tài nguyên, tuyến giao thông và vị trí định cư

### 4.1. Điểm phù hợp định cư

\[
Suitability=Clamp(0,100,0.25Water+0.20Food+0.15Defense+0.15Transport+0.10Materials+0.10Climate+0.05Sacred-0.20LatentThreat)
\]

Trọng số đổi theo văn hóa. Dân du mục ưu tiên đồng cỏ/đường mùa; thợ mỏ chấp nhận thức ăn nhập; pháp quốc có thể theo leyline.

### 4.2. Mạng đường

Đường hình thành từ dòng người/hàng. Cấp: lối mòn → đường làng → đường thương → quan lộ → đường chiến lược → cổng. Trong hệ thống kiến trúc, đường và cầu đã nghiệm thu giữ nguyên độ bền; chỉ `BUILDING_ATTACK_DAMAGE`/`INFRASTRUCTURE_ATTACK_DAMAGE` có ledger mới làm hư chúng, còn thời gian, lưu lượng và thiếu lao dịch không tạo hao mòn thụ động. Thuế/lao dịch có thể tài trợ mở rộng hoặc sửa sau tấn công, không phải phí bảo trì ngày. Tắc nghẽn ở cầu, đèo, bến, cổng thành và trạm thuế tạo điểm quyền lực.

### 4.3. Chuỗi thành thị

Thôn sản xuất sơ cấp → thị trấn chợ → thành thủ công/hành chính → đại thành thương mại/tri thức → thủ đô. Một đô thị không thể tự nuôi mọi thứ; hinterland và tuyến nhập phải được ghi.

## 5. Bản đồ đa lớp và sương mù thông tin

### 5.1. Mười hai lớp

Địa hình; khí hậu; thủy văn; sinh thái; tài nguyên; dân số; định cư; chủ quyền; văn hóa/ngôn ngữ; thương mại; quân sự/đe dọa; siêu nhiên.

### 5.2. Trạng thái kiến thức ô

Chưa biết → nghe nói → nhìn từ xa → trinh sát → khảo sát → lập bản đồ → kiểm soát → cập nhật liên tục. Mỗi trạng thái có timestamp và sai số. Một mỏ “khảo sát” vẫn có ước lượng trữ lượng, không con số tuyệt đối.

### 5.3. Sương mù chính trị

Biên giới hiển thị theo yêu sách, kiểm soát thực và nhận thức quốc tế — ba lớp có thể khác nhau. Vùng tranh chấp không tô một màu duy nhất.

## 6. Địa lý chính trị và các cấp chủ quyền

Hộ → dòng họ → làng/phường → đô thị → lãnh địa quý tộc → tỉnh → vương quốc → đế quốc/liên bang → trật tự xuyên quốc gia. Chủ quyền có năm quyền tách: luật, thuế, quân, đất, đối ngoại. Một chư hầu có thể giữ ba quyền và nhường hai.

### 6.1. Biên giới

Biên giới tự nhiên, tuyến, vùng đệm, frontier và biên vẽ trên giấy. Khả năng kiểm soát giảm theo khoảng cách:

\[
Control(d)=S_{fire}\times e^{-d/\lambda}\times Road\times Garrison\times LegitimacyM
\]

Đây là ký hiệu worldbuilding; khi chạy campaign, năm input không được nhập tay. `S_fire`, `λ`, `Road`, `Garrison` và `LegitimacyM` gọi đúng File 01 §11.4 `TERRITORY-VITALS-1.0-S`, rồi clamp từng cell `0..100` và gộp theo diện tích thành `TerritoryControl`. `S_fire` là mức bao phủ Lửa Sinh Tồn đã quyết toán, không phải Hạch hay Bậc cá nhân; `LegitimacyM` là multiplier, không phải điểm `LEG` thô. Nếu Control dưới ngưỡng, thuế và luật chỉ tồn tại danh nghĩa.

Mỗi `security_zone` nhận `BiomeThreatFloor` từ finite ecology state, không từ tên biome:

\[
BiomeThreatFloor_z=\sum_{g\in BackgroundGroups}GroupCP_g\times P_{reach}(g,z,window)
\]

`GroupCP_g` gọi File 04 từ đúng số cá thể/thuộc tính hiện hành; `P_reach∈[0,1]` lấy từ vị trí, tốc độ, route, hành vi và cửa response đã seed. Group đã được đưa vào danh sách active/named threat của cùng window phải bị loại khỏi `BackgroundGroups` để không đếm hai lần. Mọi group còn `STATE_UNOBSERVED` vẫn được tính nội bộ. Không có group hợp lệ cho floor bằng 0; thiếu ecology cell, vị trí hoặc movement profile tạo `INVALID_BIOME_THREAT_FLOOR`, không được suy từ chữ “rừng”, “cổ chiến trường” hay “an toàn”.

### 6.2. Cổ chiến trường Sora–Trevil

> **`USER_LOCKED/CANON_WORLD`.** Cách T0 **30.000 năm**, Đế quốc nhân loại **Sora** và Thú quốc **Trevil** cùng đạt quy mô có thể hủy diệt đối phương. Mỗi bên lại đồng thời sinh ra một sinh mệnh **Phẩm Thần thoại**, khiến hai quốc vương coi việc để đối thủ trưởng thành là nguy cơ không thể chấp nhận và cùng chọn tuyên chiến.

| Phe | Chính thể | Đỉnh chiến lực cuối chiến tranh | Sinh mệnh Thần thoại |
|---|---|---|---|
| Sora | đế quốc nhân loại | quốc vương; Bậc 7; Phẩm Lãnh chúa; sinh mệnh Anh hùng | bị chôn vùi ở Bậc 5, Phẩm Thần thoại |
| Trevil | thú quốc | quốc vương; Bậc 7; Phẩm Lãnh chúa; sinh mệnh Anh hùng | bị chôn vùi ở Bậc 5, Phẩm Thần thoại |

Cả hai quốc gia đã biến mất khỏi lịch sử. Các facts trên seed hai hệ ngôn ngữ, huy hiệu, quân chế, phong ấn, claim hậu duệ và memory fragment riêng; không gộp hai phe thành một văn hóa. Đối với Lí Lan ở T0, toàn bộ tên, niên đại, nguyên nhân, danh tính và cấp/phẩm này là `STATE_UNOBSERVED`, không phải `UNKNOWN_RULE`.

## 7. Mười sáu mô hình chính thể

| Mô hình | Nguồn chính danh | Điểm mạnh | Điểm yếu |
|---|---|---|---|
| Quân chủ tập quyền | triều đại/thiên mệnh | quyết định nhanh | kế vị và thông tin trung ương |
| Phong kiến chư hầu | lời thề/đất | huy động địa phương | quân phân mảnh |
| Liên bang | hiến ước | đa dạng, chia quyền | bế tắc thẩm quyền |
| Cộng hòa đô thị | công dân/tài sản | thương mại, luật | loại trừ ngoại vi |
| Liên minh thương hội | hợp đồng/vốn | logistics, tín dụng | lợi ích công bị xem nhẹ |
| Thần quyền | giáo lý/thánh chức | đoàn kết niềm tin | ly giáo, giáo điều |
| Bộ lạc hội đồng | huyết thống/đồng thuận | thích nghi địa phương | khó mở rộng bộ máy |
| Đại hãn/horde | chiến công/phân chia | cơ động, quân sự | phụ thuộc chiến lợi phẩm |
| Quân phiệt | an ninh/sức mạnh | phản ứng khủng hoảng | chính danh dân sự yếu |
| Quan liêu tuyển hiền | thi cử/năng lực | hành chính bền | quan liêu tự lợi |
| Ma pháp trị | quyền năng/chuyên môn | hạ tầng siêu nhiên | thiểu số độc quyền |
| Hội đồng quý tộc | huyết thống/đất | cân bằng elite | dân thường ít tiếng nói |
| Dân chủ đại diện | bầu cử/luật | thay quyền hòa bình | phân cực, chu kỳ ngắn |
| Công xã | tham gia/sở hữu chung | gắn kết cơ sở | phối hợp quy mô lớn |
| Tâm trí tổ/hive | liên kết sinh học | phối hợp cực cao | dễ sụp khi mất lõi/đa dạng thấp |
| Khế ước lãnh chúa | hệ thống/hạch | quyền rõ, audit tốt | lệ thuộc luật hệ thống |

Chính thể thực thường lai hai–ba mô hình.

## 8. Hồ sơ năng lực nhà nước

Mỗi chính thể có vector 0–100:

| Trục | Đo gì |
|---|---|
| Chính danh | người bị trị chấp nhận quyền |
| Năng lực hành chính | đo, thu, chi, thực thi |
| Ngân khố/tín dụng | tiền và khả năng vay |
| Lương thực | dự trữ và mạng cung |
| Nhân lực | dân số có thể huy động |
| Gắn kết elite | phe cầm quyền có hợp tác |
| Trật tự công | tội phạm, bạo loạn, tin cậy |
| Tham nhũng | thất thoát và mua bán quyền |
| Quân sẵn sàng | quân, sĩ quan, hậu cần |
| Tình báo | chất lượng nguồn và phản gián |
| Hạ tầng | đường, kho, cảng, thông tin |
| Đổi mới | giáo dục, thử nghiệm, dung nạp |

Trục Chính danh trong vector nhà nước là snapshot `LEG` hiện hành của File 01 §9.3. Trục Trật tự công không được dùng thay cho An ninh: khi cần score lãnh địa, gọi `SecurityScore` File 01 §11.4; tội phạm hoặc bạo loạn chỉ đi vào threat/incident ledger có ID. Mọi trục khác vẫn cần owner/ledger riêng, không được lấy tên chính thể làm con số.

### 8.1. Thuế thu thực

\[
TaxReal=\max(0,\lfloor TaxBase\times Rate\times AdminCapacity\times Compliance\times Control-CollectionCost\rfloor)
\]

Tăng Rate có thể giảm Compliance, tăng trốn thuế và bất ổn. Không cho nút “thuế 100%” tạo thu nhập tức thời không hậu quả.

## 9. Quan hệ song phương nhiều chiều

Không dùng duy nhất thanh -100 đến +100. Quan hệ i→j có:

| Trục | -100 | +100 |
|---|---|---|
| Thiện cảm | thù ghét | quý mến |
| Tin cậy | dự đoán phản bội | tin giữ cam kết |
| Sợ hãi | coi thường | khiếp sợ năng lực trừng phạt |
| Phụ thuộc | tự chủ | cần thương mại/an ninh của đối phương |
| Chính danh công nhận | phủ nhận | thừa nhận chủ quyền |

Quan hệ nền:

\[
R=History+Treaty+Trade+Ideology+Border+Threat+Leadership+Propaganda-Grievances
\]

Mỗi thành phần có timestamp và half-life. Thù lịch sử không biến mất sau một món quà; thiện cảm không ngăn chiến tranh nếu lợi ích sống còn xung đột.

## 10. Ngoại giao, hiệp ước và cam kết

### 10.1. Hành động

Thăm dò; công nhận; thương mại; bảo hộ; không xâm lược; liên minh; bảo đảm; triều cống; chư hầu; trao con tin; hôn ước; chia sẻ tình báo; quyền đóng quân; trung lập; cấm vận; tối hậu thư.

### 10.2. Khả năng chấp nhận

\[
Accept=ExpectedBenefit-Cost-Risk+Trust+DomesticSupport+Face+Alternative
\]

Đàm phán không phải roll PRE đè lợi ích. PRE/DIP cải thiện thông tin, cách đóng gói, nhượng bộ và xác suất trong khoảng hợp lý; không khiến đối phương tự sát.

### 10.3. Độ tin cậy cam kết

\[
Credibility=Capability\times Willingness\times Clarity\times DomesticAuthority
\]

Lời đe dọa mạnh nhưng không thể thực hiện làm giảm uy tín. Hiệp ước phải có trigger, nghĩa vụ, ngoại lệ, thời hạn, rút lui, trọng tài và hình phạt.

## 11. Chiến tranh, tiếp tế, chiếm đóng và hòa bình

### 11.1. Nguyên nhân chiến tranh

Đất, tài nguyên, an ninh, kế vị, tín ngưỡng, danh dự, giải phóng, trả nợ, phòng ngừa, hệ thống event. “Casus belli” ảnh hưởng ủng hộ và điều khoản hòa bình; không làm chiến tranh tự động chính nghĩa.

### 11.2. Khả năng chiến tranh

\[
WarCapacity=MobilizableForce\times SupplyDaysNorm\times TreasuryMonthsNorm\times Cohesion\times Command
\]

Chiến lực cao nhưng kho 5 ngày không đánh chiến tranh 6 tháng.

### 11.3. Mệt mỏi chiến tranh

Tăng từ tử vong, thuế, thiếu hàng, thời gian, thất bại, tàn phá và bất công phân bổ. Giảm từ chiến thắng có ý nghĩa, nghỉ, cải cách, viện trợ và mục tiêu được tin. Tuyên truyền đổi nhận thức trong giới hạn, không xóa xác chết.

### 11.4. Chiếm đóng

Điểm kháng cự:

\[
Resistance=Identity+Grievance+ExternalAid+Terrain+EliteNetworks-Reform-SecurityLegitimacy
\]

`SecurityLegitimacy=0.5×(SecurityScore/5+LEG_effective/5)`, nên thuộc `0..20`; cả hai score phải cùng `through_event_id` của File 01. `LEG_effective=0` chỉ trong zero-case không có cư dân bị trị; mọi INVALID khác chặn phép tính.

Khủng bố tăng sợ hãi ngắn hạn nhưng thường tăng grievance và tuyển mộ nổi dậy dài hạn.

### 11.5. Hòa bình

Điều khoản: biên giới, bồi thường, tù binh, bảo đảm, quyền thiểu số, hành lang, phi quân sự, chư hầu, hôn ước, giám sát. Hòa ước không khả thi tạo chiến tranh kế tiếp.

## 12. Luật, tư pháp, thuế và hành chính

### 12.1. Bốn nguồn luật

Tập quán; sắc lệnh; tôn giáo; hợp đồng/hệ thống. Khi xung đột, thứ tự ưu tiên khác theo chính thể. NPC phải biết luật ở mức vai trò của họ, không ai thuộc toàn bộ bộ luật.

### 12.2. Quy trình vụ án

Tố cáo → điều tra → bảo toàn chứng cứ → thẩm quyền → xét xử/hòa giải → hình phạt/bồi thường → kháng cáo → thi hành. Ma pháp đọc tâm trí nếu tồn tại vẫn cần quy tắc sai số, cưỡng ép và quyền riêng tư.

### 12.3. Hình phạt

Bồi thường, phạt, lao dịch, tước quyền, lưu đày, giam, giám sát, tử hình. Hình phạt tạo chi phí nhà nước và hậu quả phe phái; không dùng “bỏ tù” như nút xóa NPC.

## 13. Kinh tế thế giới, tiền tệ, giá và thương mại

### 13.1. Ba nền kinh tế chồng lấn

Sinh kế hộ gia đình; thị trường tiền tệ; phân phối quyền lực/khẩu phần. Một lãnh địa có thể dùng cả ba.

### 13.2. Giá địa phương

\[
Price=Reference\times Scarcity\times Transport\times Risk\times Tax\times Quality\times Information
\]

Reference chỉ là giá nơi khác. Transport và Risk khiến cùng một bao muối chênh mạnh theo địa điểm.

### 13.3. Tiền

Giai đoạn người chơi khai cuộc dùng **barter qua Chợ Hệ Thống**; người bán chọn vật/tài nguyên muốn nhận, không có tiền hệ thống toàn cầu phát sẵn. Tiền hàng hóa, kim loại, giấy/chứng thư và tín dụng thương hội vẫn có thể tồn tại theo vùng.

Đồng tiền bản địa được xác nhận trong `<>` là **Krona**: coin vật lý dùng trong giao thương caravan/chính thể chấp nhận nó. Mỗi mint Krona phải có issuer, metal/weight hoặc backing, vùng chấp nhận, tỷ giá và kiểm tra giả; chữ “Krona” không bảo đảm hai triều đúc coin ngang giá nếu record khác issuer. Token sự kiện/hệ thống là sổ riêng, không tự thay Krona, thuế địa phương hoặc vật đổi vật.

### 13.4. Tín dụng

`CREDIT-RATE-1.0` dùng lãi kép theo kỳ đã ghi trong hợp đồng:

\[
Rate_{period}=Clamp(0,1,BaseTimeRate+DefaultRisk+CurrencyRisk+EnforcementCost+ScarcityPremium)
\]

\[
AmountDue=RoundCurrency(Principal\times(1+Rate_{period})^{Periods})+FixedFees
\]

Năm thành phần tỷ lệ, kỳ tính, `Principal`, `Periods`, `FixedFees`, loại tiền và đơn vị nhỏ nhất phải khóa trước khi ký; mapping đầy đủ ở Phụ lục 3.I. Uy tín làm giảm `DefaultRisk` qua hồ sơ tín dụng nhưng không thay collateral và khả năng thi hành.

## 14. Dân số, hộ gia đình, tầng lớp và di cư

### 14.1. Cohort

Theo tuổi, giới/tình trạng sinh sản phù hợp canon, nghề, tầng lớp, văn hóa, sức khỏe, vùng. Cập nhật sinh–tử–di cư theo năm/tháng; không mô phỏng từng người nền mỗi giây.

### 14.2. Hộ gia đình

Đơn vị tiêu dùng, chăm sóc, thừa kế và mạng an sinh. Chính sách lương/nhà ảnh hưởng hộ chứ không chỉ cá nhân. Chiêu mộ một thợ có thể cần di chuyển gia đình.

### 14.3. Tầng lớp

Không chỉ giàu/nghèo: quyền đất, nghề, pháp nhân, học vấn, huyết thống, tôn giáo, chủng tộc, công dân, nô lệ/lệ thuộc nếu canon `<>` có. Tầng lớp có lợi ích và khả năng tổ chức khác nhau.

### 14.4. Di cư

Push: chiến tranh, thuế, đói, đàn áp, mất đất, khí hậu. Pull: an toàn, lương, họ hàng, quyền, đất, tín ngưỡng. Biên giới chỉ giảm flow; không bằng 0.

## 15. Kiến trúc NPC

### 15.1. Hồ sơ 20 trường

ID; vai trò; tuổi/giai đoạn sống; hộ; văn hóa; ngôn ngữ; tầng lớp; nghề/mastery; tài sản; sức khỏe; tính cách; giá trị; mục tiêu; nỗi sợ; nhu cầu; quan hệ; phe; kiến thức; bí mật; lịch.

### 15.2. Năm lớp mục tiêu

Sinh tồn; nghĩa vụ; lợi ích; bản sắc; khát vọng. Mỗi NPC có 2–4 mục tiêu hoạt động và 1 mục tiêu tiềm ẩn. Không cho mọi NPC xoay quanh {{user}}.

### 15.3. Tính cách dạng vector

Can đảm; tận tâm; hòa đồng; đồng cảm; cởi mở; tham vọng; trung thực; kiên nhẫn; thù dai; sùng tín, mỗi trục 0–100. Trait từ vector + trải nghiệm; tránh tag đơn “tham lam”.

## 16. Mục tiêu, quyết định, cảm xúc và đạo đức NPC

### 16.1. Hàm tiện ích giới hạn

\[
U(a)=\sum_g w_gE[Outcome_{a,g}]-Cost-Risk+Norm+Emotion+Loyalty+Identity+Habit
\]

NPC chỉ tính trên action họ biết và tin là khả thi. E[Outcome] dùng niềm tin chủ quan, không dùng dữ liệu thật của engine.

### 16.2. Bounded rationality

- Quan chức dùng quy trình quen.
- Người sợ hãi đánh giá quá cao rủi ro gần.
- Chuyên gia thấy chi tiết ngành nhưng có blind spot ngoài ngành.
- Người thiếu thời gian chọn “đủ tốt”.
- Nhóm có thể đi đến kết quả không ai cá nhân mong muốn.

### 16.3. Cảm xúc

Cảm xúc là trạng thái ngắn tác động attention và utility; không thay toàn bộ tính cách. Sợ tăng trọng số an toàn; giận tăng phạt xúc phạm; biết ơn tăng thiện cảm nhưng giảm theo thời gian nếu không có quan hệ.

### 16.4. Đạo đức

NPC dùng giá trị và chuẩn văn hóa, không meter thiện–ác. Một người có thể yêu gia đình nhưng tàn nhẫn với ngoại nhóm; giữ lời nhưng ủng hộ luật bất công. Ghi mâu thuẫn thay vì ép nhất quán giả.

## 17. Ký ức, thông tin, tin đồn và phản gián

### 17.1. Ký ức sự kiện

Mỗi memory có valence, salience, source, confidence, participants và decay. Độ nhớ:

\[
Memory_t=Salience\times e^{-t/halfLife}\times Rehearsal\times IdentityLink
\]

Sang chấn/lời thề có half-life dài; chuyện thường quên nhanh. Rehearsal qua lễ, tuyên truyền, kể chuyện làm sống lại.

### 17.2. Tin đồn

Mỗi lần truyền có ba biến: mất chi tiết, tăng tính kịch, đổi theo thành kiến. Tin đồn lưu chuỗi nguồn nếu có; “ba người nói” không thành ba nguồn độc lập nếu cùng nghe một người.

### 17.3. Tình báo

Nguồn: trinh sát, thương nhân, tù binh, gián điệp, scrying, hồ sơ, open source. Báo cáo có độ mới, độ tin cậy nguồn, xác suất đánh lừa và khoảng sai.

### 17.4. Bí mật

Secret có owner, knowers, evidence, exposure harm, leverage, decay. NPC không tự tiết lộ vì {{user}} hỏi đúng; cần trust, pressure, payment, mistake hoặc evidence.

## 18. Lịch sinh hoạt và mô phỏng ngoài màn hình

NPC có lịch ngày, tuần, mùa: ngủ, làm, ăn, thờ, chăm hộ, giải trí, họp, đi đường. Khi off-screen, mô phỏng theo role outcome và rủi ro; khi gần {{user}}, nâng lên cá thể. Không teleport NPC tới nơi gặp nếu lịch/đường không cho phép.

Tick ngoài màn hình dùng event-sourcing: “đã giao 8 thùng”, “bị chậm do mưa”, “nghe tin X”, để khi gặp lại có lý do. NPC quan trọng tiếp tục theo đuổi mục tiêu kể cả không được nhìn.

## 19. Người chơi và dân bản địa: khác biệt tư duy

### 19.1. Lợi thế người chơi

- Giao diện số, log, chat xa và một số nhiệm vụ.
- Kiến thức khái niệm từ thế giới khác: tổ chức, khoa học, game, tài chính.
- Có thể chia sẻ meta nhanh trong cộng đồng người chơi.
- Ít bị ràng buộc bởi địa vị cũ, nhưng phải xây chính danh mới.

### 19.2. Hạn chế người chơi

- Thiếu ngôn ngữ, địa lý, mùa vụ, pháp luật, nghi thức, vật liệu và mạng tin cậy.
- Kiến thức hiện đại không đồng nghĩa kỹ năng chế tạo; thiếu chuỗi công nghiệp.
- Dễ coi NPC là “đơn vị”, đánh giá quá cao số UI, min-max đạo đức và bỏ hậu quả.
- Chat dễ lan tin sai, groupthink và thao túng thị trường.
- Sang chấn, nhớ nhà, xung đột giá trị và khác biệt thế hệ.

### 19.2.1. Nhiệt độ kênh và thiên lệch sống sót

Trong những phút đầu, kênh công cộng phản ánh một đám đông vừa bị giật khỏi bữa ăn, ca làm, giấc ngủ, con nhỏ và người thân: phủ nhận, gọi tên, cầu cứu, chửi rủa, cầu nguyện, gõ lặp và câu bị bỏ giữa chừng áp đảo mọi trao đổi lý trí. Những người đủ bình tĩnh để thử nghiệm có tồn tại nhưng tiếng họ chìm nhanh; một phát hiện đúng thường chỉ là một dòng giữa hàng chục phản ứng.

Qua đêm đầu, tổng lượng tin giảm theo từng đợt vì người sống phải rời giao diện để làm việc, vì kiệt sức, thương tích, mất quyền truy cập và tử vong. Những hành vi do hoảng loạn—chạy khỏi vòng nhiệt, tin lời sai, lao đi tìm người thân không có tọa độ hoặc đông cứng không hành động—làm một phần người chơi biến mất sớm. Người còn xuất hiện nhiều hơn là nhóm đã thích nghi, có tài nguyên, gặp may hoặc thuộc mạng hỗ trợ; đó là thiên lệch sống sót, không chứng minh họ giỏi hơn hay xứng đáng hơn.

Từ ngày thứ hai, giọng kênh ngắn, thực dụng và nghi ngờ hơn. Danh tiếng nguồn tin, ảnh bằng chứng, quan hệ trao đổi và thù cá nhân bắt đầu quan trọng. Nỗi sợ chuyển thành cảnh giác, hài hước đen, im lặng hoặc ám ảnh; nó không biến mất. Một biến cố mới đủ lớn sẽ làm ngay cả những người kỳ cựu gõ dồn, gọi đồng đội và lặp tin như buổi đầu.

### 19.3. Lợi thế dân bản địa

- Tri thức ngầm: đất, đường, mùa, thú, tín hiệu, phong tục.
- Quan hệ họ hàng, tín dụng xã hội, danh phận và tổ chức có sẵn.
- Kỹ năng vật chất phù hợp công nghệ hiện tại.
- Hiểu sắc thái ngôn ngữ và lịch sử mà auto-translate bỏ qua.

### 19.4. Hạn chế dân bản địa

Không có menu đầy đủ; thông tin chậm; có thể bị thiết chế khóa; khó tin hiện tượng phá thế giới quan. Nhưng họ học: sau khi thấy cơ chế lặp, NPC thông minh sẽ thử nghiệm, đặt tên và phát triển counter.

### 19.5. Ma sát tư duy điển hình

| Tình huống | Người chơi dễ nghĩ | NPC dễ nghĩ | Xung đột thật |
|---|---|---|---|
| Kênh công cộng | nhiều người lặp lại nghĩa là đúng | tiếng nói xa không có quan hệ bảo chứng | tin đồn, danh tiếng và thiên lệch sống sót |
| Chợ | giá là con số toàn cầu | giá gắn quan hệ và đường | arbitrage vs niềm tin |
| Đất | ô trống là vô chủ | đất có quyền mùa/tổ tiên | chiếm dụng |
| Quest | mục tiêu để lấy thưởng | lời cầu cứu/cam kết thật | đạo đức công cụ |
| Rank | vị trí là năng lực | khoe sức là tự đặt bia | thông tin chiến lược |
| Nghề | chọn build tối ưu | nghề là thân phận/bang hội | đổi nghề và địa vị |
| Tôn giáo | buff/cơ chế | ý nghĩa/cộng đồng | xúc phạm và cải đạo |

## 20. Văn hóa, ngôn ngữ, tín ngưỡng và bản sắc

### 20.1. Mười sáu chiều văn hóa

Họ hàng; cá nhân–tập thể; thứ bậc; danh dự–pháp lý; sở hữu đất; giới và gia đình; tuổi/tổ tiên; khách–chủ; bạo lực hợp lệ; lao động; thương mại; thời gian; rủi ro; cái chết; ma pháp; người ngoài.

Mỗi chiều có chuẩn elite, dân thường, vùng và thế hệ; không gán một giá trị cho cả dân tộc.

### 20.2. Văn hóa như cơ chế

Nó ảnh hưởng hành vi chào, hợp đồng, thừa kế, tuyển quân, hình phạt, ăn, nhà ở, lễ, taboos và cách diễn giải sự kiện. Bonus văn hóa chỉ xuất hiện khi thiết chế thực hành, không phải “racial passive” cố định.

### 20.3. Ngôn ngữ

Mỗi ngôn ngữ có họ, phương ngữ, chữ, prestige và từ vay. Thông thạo nghe/nói/đọc/viết tách. Auto-translate dịch nghĩa bề mặt nhưng đánh dấu:

- danh hiệu không tương đương;
- từ pháp lý/tôn giáo;
- chơi chữ, mỉa mai, thơ;
- lời thề có hiệu lực ma pháp;
- tên riêng và đại từ địa vị.

### 20.4. Tín ngưỡng

Tách thần học, nghi lễ, tổ chức, trải nghiệm và chính trị. Thần có thật không làm mọi giáo lý đúng; phép của giáo sĩ không chứng minh mọi yêu sách đạo đức.

### 20.5. Bản sắc lồng nhau

Một NPC đồng thời là thành viên hộ, làng, nghề, vùng, tôn giáo, tầng lớp, phe và nhà nước. Bản sắc nào nổi lên phụ thuộc tình huống.

## 21. Phe phái, mạng quan hệ và xung đột nội bộ

### 21.1. Phe

Phe có thành viên, lãnh đạo, mục tiêu, tài nguyên, narrative, red lines và cohesion. Phe không phải một người; lãnh đạo có thể không kiểm soát cực đoan.

### 21.2. Sức mạnh phe

\[
FactionPower=Members\times Organization\times Resources\times Access\times Legitimacy
\]

`Legitimacy=0.50+0.0075×LEG` khi phe cai trị có cư dân; nếu phe không cai trị, dùng trục **Chính danh công nhận** song phương đã settle, ánh xạ `−100..100` thành `Clamp(0,1.25,0.625+0.00625×Recognition)`. Không được dùng fame hoặc fear thay thế.

### 21.3. Quan hệ cá nhân

Mỗi cạnh có thân thiết, tin, nợ, quyền lực, sợ, hấp dẫn, họ hàng, bí mật. Quan hệ không đối xứng. A tin B 80 không có nghĩa B tin A 80.

### 21.4. Nổi loạn

Điều kiện gồm grievance, tổ chức, cơ hội, narrative và kỳ vọng thắng. Bất mãn cao mà thiếu tổ chức tạo trốn thuế/di cư, không tự sinh quân nổi dậy.

## 22. Bộ sinh biến cố chính trị–xã hội

### 22.1. Trigger

Kế vị yếu; thuế tăng; mất mùa; giá sốc; chiến bại; cải cách; công nghệ; dị giáo; tị nạn; khám phá tài nguyên; scandal; thiên tai; người chơi can thiệp; hiệp ước; ám sát.

### 22.2. Chu trình

Pressure → incident → framing → mobilization → response → outcome → memory. Cùng incident nhưng framing khác tạo kết quả khác.

### 22.3. 24 mẫu

Tranh thừa kế; đình công; bạo loạn bánh mì; cải cách ruộng; cấm đạo; ly giáo; khủng hoảng tiền; vỡ nợ; caravan mất tích; dịch; tị nạn; hôn ước; đảo chính; phản đảo chính; nổi dậy tỉnh; tranh mỏ; ám sát; scandal quan lại; phép lạ; di vật xuất hiện; hiệp ước bí mật; gián điệp bị bắt; biên giới đụng độ; hội nghị hòa bình.

## 23. Danh mục 54 vai NPC nền

| # | Khu vực | Vai | Mục tiêu mặc định | Đòn bẩy | Điểm mù điển hình |
|---:|---|---|---|---|---|
| 01 | Cai trị | Quân chủ/chủ quyền | giữ chính danh và tính liên tục | bổ nhiệm, luật, biểu tượng | dễ nhầm im lặng với phục tùng |
| 02 | Cai trị | Người kế vị | xây liên minh trước chuyển giao | huyết thống, kỳ vọng tương lai | thiếu quyền thực nhưng bị soi xét |
| 03 | Cai trị | Nhiếp chính | duy trì nhà nước trong khoảng trống | quyền khẩn cấp, hồ sơ | bị nghi tiếm quyền |
| 04 | Cai trị | Tổng quản | biến ý chí chính trị thành ngân sách | sổ kho, mạng quan chức | có thể tối ưu số mà bỏ người |
| 05 | Cai trị | Thẩm phán | duy trì trật tự và tiền lệ | luật, quyền phán quyết | bị trói bởi luật lỗi thời |
| 06 | Cai trị | Thư lại | giữ dòng thông tin hành chính | biết giấy tờ và điểm nghẽn | quyền thấp, dễ bị ép sửa hồ sơ |
| 07 | Quân sự | Tổng chỉ huy | thắng chiến tranh mà giữ được quân | quân lệnh, chiến lược | thông tin tiền tuyến luôn trễ |
| 08 | Quân sự | Đội trưởng | đưa người sống về sau nhiệm vụ | niềm tin của đơn vị | tầm nhìn cục bộ |
| 09 | Quân sự | Quân nhu | đủ lương, đạn, thú vận | kho và tuyến vận | bị coi nhẹ khi chưa khủng hoảng |
| 10 | Quân sự | Trinh sát trưởng | giảm bất ngờ | mạng tai mắt, bản đồ | tin tốt/xấu đều không hoàn hảo |
| 11 | Quân sự | Cựu binh | bảo vệ đồng đội và vị thế | kinh nghiệm, uy tín đơn vị | có thể bảo thủ với chiến thuật mới |
| 12 | Quân sự | Thủ lĩnh dân quân | bảo vệ quê nhà | quan hệ dân sự | khó chấp nhận chiến dịch xa |
| 13 | Kinh tế | Đại thương nhân | mở tuyến và giảm bất định | vốn, tín dụng, caravan | lợi nhuận không đồng nghĩa trung thành |
| 14 | Kinh tế | Chủ bang hội | bảo vệ độc quyền nghề | chứng nhận, học việc | cản đổi mới phá lợi ích |
| 15 | Kinh tế | Chủ caravan | giao hàng sống sót | tin đường, nhân sự vận tải | ưu tiên an toàn hơn chính trị |
| 16 | Kinh tế | Người cho vay | thu hồi vốn và giữ uy tín | nợ, thế chấp, thông tin | dễ gây thù vì siết nợ |
| 17 | Kinh tế | Thợ cả | giữ chuẩn nghề và truyền nghề | bí quyết, học trò | khó mở rộng quá nhanh |
| 18 | Kinh tế | Đại diện lao động | lương, an toàn, phẩm giá | khả năng đình công | bị phe khác gán động cơ chính trị |
| 19 | Nông thôn | Trưởng thôn | cân bằng hộ gia đình và thuế | họ hàng, tập quán | ưu tiên địa phương |
| 20 | Nông thôn | Nông dân chủ hộ | qua mùa và giữ đất | lương thực, tri thức mùa | ngại thử nghiệm đe dọa vụ mùa |
| 21 | Nông thôn | Người chăn nuôi | giữ đàn và đường di chuyển | thú, đồng cỏ | xung đột với ruộng và biên giới |
| 22 | Nông thôn | Thợ săn | duy trì nguồn săn | địa hình, dấu vết | không đại diện toàn bộ dân làng |
| 23 | Nông thôn | Thợ mỏ | an toàn mỏ và phần chia | quặng, hiểu lòng đất | phụ thuộc chủ mỏ/đầu ra |
| 24 | Nông thôn | Ngư dân | giữ luồng nước và mùa cá | thuyền, thủy văn | dễ bị biến cố thượng nguồn |
| 25 | Tri thức | Học giả | giải thích và tích lũy tri thức | lý thuyết, văn bản | có thể thiếu kinh nghiệm thực địa |
| 26 | Tri thức | Giáo viên | tạo thế hệ có kỹ năng | ảnh hưởng dài hạn | kết quả chậm, ngân sách dễ bị cắt |
| 27 | Tri thức | Y sư | giảm chết và dịch | niềm tin bệnh nhân, y thuật | nguồn lực khan hiếm buộc triage |
| 28 | Tri thức | Luyện kim/giả kim sư | thử nghiệm an toàn và thành tựu | công thức, phòng thí nghiệm | tai nạn/độc quyền bí quyết |
| 29 | Tri thức | Thủ thư/lưu trữ | giữ ký ức thể chế | hồ sơ, nguồn gốc | dễ bị kiểm duyệt hoặc đốt phá |
| 30 | Tri thức | Nhà thám hiểm | mở vùng chưa biết | bản đồ, mẫu vật | thiên lệch sống sót và ham danh |
| 31 | Tín ngưỡng | Giáo sĩ địa phương | chăm cộng đồng và giữ giáo luật | nghi lễ, niềm tin | kẹt giữa giáo hội và dân |
| 32 | Tín ngưỡng | Giáo chủ | giữ thống nhất giáo đoàn | mạng đền, giáo lý | dễ chính trị hóa đức tin |
| 33 | Tín ngưỡng | Nhà tiên tri | diễn giải dấu hiệu | uy tín biểu tượng | lời mơ hồ bị lợi dụng |
| 34 | Tín ngưỡng | Người hoài nghi | kiểm chứng quyền lực thiêng | lập luận, mạng trí thức | bị xem là đe dọa bản sắc |
| 35 | Tín ngưỡng | Người hành hương | hoàn tất hành trình và lời nguyện | mạng tin liên vùng | dễ mang tin sai/dịch bệnh |
| 36 | Tín ngưỡng | Người giữ thánh tích | bảo vệ vật thiêng | quyền tiếp cận | vật thiêng có thể quan trọng hơn người |
| 37 | Bóng tối | Đầu mối buôn lậu | giữ luồng hàng ngoài luật | đường kín, hối lộ | sẵn sàng đổi phe khi rủi ro tăng |
| 38 | Bóng tối | Môi giới hàng cấm | ghép người mua–bán | ẩn danh, định giá | không kiểm soát mục đích cuối |
| 39 | Bóng tối | Tình báo viên | thu tin mà giữ vỏ bọc | nguồn bí mật | tin có thể bị chủ động cho ăn |
| 40 | Bóng tối | Thủ lĩnh đạo tặc | kiếm lợi và giữ băng | bạo lực, địa bàn | lòng trung thành dựa lợi ích/sợ hãi |
| 41 | Bóng tối | Sát thủ | hoàn tất hợp đồng và sống | bí mật, kỹ năng | thông tin mục tiêu thường một chiều |
| 42 | Bóng tối | Môi giới tin đồn | bán thông tin đúng lúc | mạng quán trọ/chợ | ưu tiên tin hấp dẫn hơn tin đúng |
| 43 | Xã hội | Chủ quán trọ | giữ khách và trật tự | giao điểm tin tức | biết nhiều mảnh nhưng thiếu toàn cảnh |
| 44 | Xã hội | Bà đỡ | bảo vệ mẹ/trẻ và hộ gia đình | niềm tin riêng tư | quyền chính thức thấp |
| 45 | Xã hội | Người chăm trẻ mồ côi | nuôi và bảo vệ trẻ | thiện cảm cộng đồng | dễ thiếu ngân sách |
| 46 | Xã hội | Nghệ nhân/diễn viên | sống bằng khán giả và biểu đạt | ảnh hưởng cảm xúc | bị quyền lực dùng làm tuyên truyền |
| 47 | Xã hội | Người mai mối | kết mạng gia đình | bí mật thân tộc | có thể củng cố bất bình đẳng |
| 48 | Xã hội | Người tị nạn đại diện | đất ở, an toàn, tư cách | sự đoàn kết cohort | bị nghi là gánh nặng/gián điệp |
| 49 | Đối ngoại | Sứ giả | truyền đúng thông điệp và trở về | miễn trừ, nghi thức | không tự quyết ngoài ủy nhiệm |
| 50 | Đối ngoại | Đại sứ | duy trì quan hệ dài hạn | tiếp cận triều đình | có hai lòng trung thành nghề/quốc |
| 51 | Đối ngoại | Chỉ huy lính đánh thuê | hợp đồng, lương, danh tiếng | quân sẵn dùng | cam kết phụ thuộc điều khoản |
| 52 | Đối ngoại | Thương nhân ngoại quốc | mở chợ và bảo vệ tài sản | giá/đường quốc tế | khác chuẩn pháp lý/văn hóa |
| 53 | Đối ngoại | Tù binh đại diện | sống sót và bảo vệ đồng đội | thông tin/đàm phán | bị cả hai bên nghi ngờ |
| 54 | Đối ngoại | Người lưu vong | trở về hoặc dựng đời mới | yêu sách/chính danh cũ | ký ức quê nhà có thể lỗi thời |

Vai không quyết định đạo đức hoặc tính cách. Mỗi lần tạo NPC, đổi ít nhất mục tiêu, quan hệ, giới hạn kiến thức và một mâu thuẫn nội tâm.

## 24. Các biểu mẫu worldbuilding

### 24.1. Province sheet

~~~yaml
province_id:
parent_state:
terrain: []
climate: {temperature, rain, seasons}
population: {total, cohorts, cultures, faiths}
settlements: []
resources: []
routes: []
claims: []
actual_control: []
tax_capacity:
food_balance:
public_order:
factions: []
threats: []
unknowns: []
~~~

### 24.2. Faction sheet

~~~yaml
faction_id:
type:
public_goal:
private_goal:
red_lines: []
members:
leaders: []
resources: []
narrative:
cohesion:
relations: []
current_plan:
fallback_plan:
~~~

### 24.3. NPC sheet

~~~yaml
npc_id:
role:
household:
culture_languages: []
class_status:
skills: {}
personality: {}
values: []
active_goals: []
fears: []
knowledge: [{claim, source, confidence, timestamp}]
relations: []
secrets: []
schedule: {}
decision_thresholds: {}
~~~

### 24.4. Culture sheet

~~~yaml
culture_id:
origin_story:
subcultures: []
kinship:
authority:
property:
honor_and_law:
hospitality:
violence:
labor_trade:
magic:
death:
outsiders:
ritual_calendar: []
internal_debates: []
misconceptions_by_others: []
~~~

### 24.5. Hiển thị hồ sơ nhân vật và phe phái hướng người chơi

Các cấu trúc 24.1–24.4 là hồ sơ mô phỏng nội bộ. Khi Lí Lan mở hồ sơ một nhân vật bản địa, anh hùng, phe phái hoặc cộng đồng, các dòng chữ trước mắt chỉ đưa ra điều cô đã học được; `T<n>` thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>`, grade trơ thành `Phẩm <grade>` và mã `H...` thành trạng thái hạch/lãnh địa theo chuẩn ngôn ngữ §11–12. Mọi số/phẩm đã biết được giữ nguyên. ID, enum, véc-tơ tính cách, ngưỡng quyết định, mục tiêu kín, bí mật và độ trung thành chính xác không xuất hiện nếu chưa nằm trong quyền đo.

Mỗi trường dùng một dòng theo mẫu `[Tên trường]: [giá trị], [chi tiết] — [một mệnh đề ngắn]`. Một đặc tính, kỹ năng hoặc thiên phú vừa được nhận diện dùng dòng đầu ghi Phẩm, tên và một đến hai câu gợi hình; dòng kế tiếp chứa đúng hai câu hiệu quả cơ học ngắn gọn. Bản hồ sơ ưu tiên tên, vai trò Lí Lan đã quan sát, diện mạo/hành vi, năng lực đã chứng kiến, quan hệ đã biết và nguồn thông tin cô thực sự tiếp nhận.

Nếu dữ kiện đến từ lời đồn, bản báo cáo hay suy luận, chính vật dẫn tin hoặc phản ứng của Lí Lan mang theo sự bất định ấy. Người kể không đứng ngoài cảnh để phán lời nào đúng. Chỉ yêu cầu `raw stats` hoặc `debug view` mới cho phép dùng cấu trúc nguyên bản, và quyền thông tin vẫn tiếp tục áp dụng.

## 25. Mật độ lãnh địa và thế lực bản địa

> **Nhãn nguồn:** yêu cầu trực tiếp của user về các trường bắt buộc là `USER_LOCKED`; công thức thống kê là `DESIGN_DEFAULT/MAP-DENSITY-1.0`. `<>` vẫn quyết định địa lý, quy mô và mốc cốt truyện nào đã được nói rõ. Campaign Lí Lan dùng số `CAMPAIGN_FIXED` trong Phụ lục 3.K; campaign khác cần `CAMPAIGN_SEEDED`. Không trường hợp nào lấy số từ campaign thử.

### 25.1. Ba loại mật độ không được nhập làm một

| Trường | Ý nghĩa | Dùng khi nào |
|---|---|---|
| `theoretical_density` | mật độ thật do world seed tạo trong toàn vùng, kể cả điểm chưa khám phá | engine mô phỏng offscreen; không tự lộ cho Lí Lan |
| `gross_density` | số thực thể đã xác nhận chia cho toàn diện tích vùng đang thống kê | báo cáo quản trị về phần đã chắc chắn |
| `observed_density` | số thực thể phát hiện trong diện tích đã quan sát đủ chuẩn | ước lượng của người chơi/trinh sát; luôn kèm coverage/confidence |

Với phạm vi diện tích `A` và số điểm `N`:

\[
Density=N/A
\]

Ước lượng khoảng cách dạng lưới chỉ để sanity-check:

\[
GridSpacing\approx\sqrt{A/N}
\]

Khoảng cách trung bình thực phải tính từ tọa độ: `mean_nearest_neighbor_distance` là trung bình khoảng cách từ mỗi điểm tới láng giềng gần nhất; `mean_pairwise_distance` là trung bình mọi cặp và không được gọi nhầm là khoảng cách giữa hai lãnh địa gần nhau. Báo cáo phải ghi đơn vị km, hệ tọa độ/projection, phạm vi, thời điểm và sample size.

### 25.2. Hồ sơ mật độ lãnh địa–lãnh địa

```yaml
territory_density_cell:
  cell_id:
  seed_id:
  rule_version: MAP-DENSITY-1.0
  geometry:
  area_km2:
  generated_at:
  player_territory_count_theoretical:
  player_territory_count_confirmed:
  observed_area_km2:
  theoretical_density_per_1000_km2:
  gross_density_per_1000_km2:
  observed_density_per_1000_km2:
  mean_nearest_neighbor_km:
  median_nearest_neighbor_km:
  nearest_to_pc: {territory_id, straight_km, route_km, travel_time, confidence}
  farthest_confirmed_in_cell:
  actual_neighbors:
    - {territory_id, coordinate, straight_km, route_id, route_km, owner_known, relation_known, observed_event}
  coverage_percent:
  confidence:
  last_recomputed_event:
```

`actual_neighbors` là sự thật đã seed; lớp hướng người chơi chỉ hiện hàng đã được phát hiện. Khi một lãnh địa bị phá, di chuyển hạch hoặc hợp khu, density cell được tính lại bằng event, không đổi ngầm trong văn xuôi.

### 25.3. Khoảng cách lãnh địa–thế lực bản địa

“Thế lực bản địa” gồm cả settlement vật lý và polity có chủ quyền. Mỗi lãnh địa phải có các trường gần nhất riêng, không dùng một số trung bình thay cho tất cả:

```yaml
native_proximity:
  origin_territory_id:
  nearest_hamlet: {site_id, straight_km, route_km, travel_time, population_estimate, confidence}
  nearest_village: {site_id, straight_km, route_km, travel_time, population_estimate, confidence}
  nearest_town: {site_id, straight_km, route_km, travel_time, population_estimate, confidence}
  nearest_city: {site_id, straight_km, route_km, travel_time, population_estimate, confidence}
  nearest_fortification: {site_id, type, straight_km, route_km, garrison_estimate, confidence}
  containing_or_nearest_polity: {polity_id, relation, confidence}
  nearest_controlled_border: {polity_id, straight_km, route_km, border_type, confidence}
  nearest_capital: {polity_id, site_id, straight_km, route_km, travel_time, confidence}
  native_site_density_by_type_per_1000_km2: {}
  mean_distance_territory_to_native_site_km:
  actual_sites: []
  last_survey_event:
```

Khoảng cách thẳng dùng cho bản đồ; `route_km` và `travel_time` dùng cho hành động. Núi, băng nứt, sông, biên giới, đường và thời tiết có thể làm route dài hơn nhiều. “Quốc gia cách 20 km” là cách viết sai: phải nói 20 km tới biên giới, một đồn, một đô thị hay thủ đô.

### 25.4. Báo cáo tối thiểu khi người dùng hỏi “xung quanh có gì?”

1. phạm vi/bán kính và phần trăm đã khảo sát;
2. số lãnh địa lý thuyết chỉ khi quyền thông tin cho phép, số đã xác nhận và mật độ quan sát;
3. láng giềng gần nhất cùng khoảng cách thẳng, đường đi và thời gian;
4. làng/thị trấn/thành/pháo đài/chính thể gần nhất, mỗi loại một dòng hoặc `chưa phát hiện`;
5. confidence và nguồn phát hiện;
6. điểm mù còn lại; `chưa phát hiện` không đồng nghĩa `không tồn tại`.

## 26. Sinh thái hữu hạn và số lượng sinh vật quanh lãnh địa

> **Nhãn nguồn:** `USER_LOCKED + DESIGN_DEFAULT/ECOLOGY-CELL-1.0`. Sinh vật không được sinh ra chỉ vì một cảnh săn cần mục tiêu.

### 26.1. Ecology cell và population group

Thế giới được chia thành cell sinh thái chồng lên địa hình, nguồn nước và tuyến di cư. Mỗi species có population hữu hạn:

```yaml
ecology_population:
  ecology_cell_id:
  species_id:
  seed_id:
  habitat_capacity:
  population_true:
  estimate_low:
  estimate_base:
  estimate_high:
  estimate_confidence:
  age_or_stage_cohorts: {}
  active_groups:
    - {group_id, count, composition, location, activity, route, observed_state}
  births_since_tick:
  natural_deaths_since_tick:
  hunted_or_killed_since_tick:
  migrated_in_since_tick:
  migrated_out_since_tick:
  disease_losses_since_tick:
  corpses_unclaimed: []
  last_tick:
  last_survey_event:
```

Bất biến:

\[
Population_{after}=Population_{before}+Births+MigratedIn-NaturalDeaths-DiseaseLosses-Hunted-MigratedOut
\]

Không được tạo encounter rồi mới cộng ngược sinh vật vào quần thể. Một cuộc săn chọn một `group_id` đang tồn tại, di chuyển nó theo lịch, trừ thương vong khỏi population và tạo corpse/loot/XP events tương ứng.

### 26.2. Báo cáo sinh vật quanh lãnh địa

Mặc định chia vành đai theo khoảng cách thực tế phù hợp bản đồ. LL01 dùng đúng `R0…R4` và ecology count Phụ lục 3.K; campaign khác seed ranh riêng, không lấy từ campaign thử. Mỗi hàng phải có:

| Vành đai | Species | Ước lượng thấp–cơ sở–cao | Nhóm đã thấy | Cá thể đã thấy | Hoạt động | Nguy cơ | Confidence | Lần cập nhật |
|---|---|---:|---:|---:|---|---|---|---|

Tổng “sinh vật quanh lãnh địa” được cộng từ **ước lượng species còn sống**, không từ tổng encounter lịch sử. Corpse, undead thuộc Lí Lan, thú nuôi và cư dân có sổ riêng. Sau khi săn, báo population trước, số chết/bỏ chạy, population sau và tác động cạn kiệt.

### 26.3. Hồi phục và cạn kiệt

Quần thể tăng bằng sinh sản, trưởng thành hoặc di cư đúng mùa; không có “respawn” vô cớ. Săn quá mức giảm encounter rate, đẩy đàn sang cell khác, kéo predator tới nguồn khác, làm thay đổi giá thịt/da và có thể gây phản ứng của thế lực sở hữu đất. Confidence suy giảm theo thời gian nếu không khảo sát lại.

### 26.4. `HERO-LAIR-SOCIETY-1.0` — Hero tổ chức quần thể mà không nhân bản quần thể

> **Nhãn nguồn:** `<>` khống chế việc Hero/sinh vật đầu lĩnh là actor có agency và sinh vật–hang ổ có thể trở thành thế lực thật; chi tiết xã hội học, lãnh vực và lịch ngoài màn hình mà nguồn không định lượng được lấp bằng `SOURCE_ANALOGY + DESIGN_DEFAULT`. Mười lăm instance LL01 ở Phụ lục 3.L là `USER_LOCKED + CAMPAIGN_FIXED`, tồn tại trước T0.

Một Hero có thể tăng khả năng phối hợp, truyền lệnh, giữ ký ức nhóm, phân vai hoặc mở một hình thái tổ chức mà loài ấy vốn có khả năng duy trì. Hero **không** tự sinh follower, không biến động vật đơn độc thành dân làng, không cấp tiền tệ/nhà ở/nông nghiệp và không tự nâng Phẩm cả bầy. `HeroPresent` không phải điều kiện đủ; `HeroAbsent` cũng không phải điều kiện cần đối với một bầy/đàn/colony vốn có bản năng xã hội.

```yaml
hero_lair_state:
  lair_id:
  pack_id:
  center_xyz_km:
  source_population_refs: []
  member_group_ids: []
  member_count:
  leader_hero_id:
  species_social_capability:
  society_form:
  organization_stage:
  role_quality_cohorts: []
  territory_layers: {core_km, controlled_km, use_km, influence_km}
  boundary_expression:
  resource_claims: []
  activity_profile:
  current_indices: {resource, shelter, cohesion, pressure}
  succession_rule:
  transition_rule:
  knowledge_state:
  last_settled_at:
  source_events: []
```

Mỗi `member_group_id` là **cùng cá thể** trong `ecology_population.active_groups`, không phải bản sao “lair population”. Một cá thể đang tuần tra, kiếm ăn, chiến đấu, bị săn, bị bắt hoặc chết chỉ xuất hiện một lần trong conservation ledger.

### 26.5. Trần hình thái xã hội đúng loài

| `species_social_capability` | Hình thái được phép | Hình thái không được suy diễn nếu không có event biến đổi thật |
|---|---|---|
| `SOLITARY` | hang đơn độc, vùng kiếm ăn, dấu ranh | follower, phân công lao động, settlement |
| `PAIR_OR_FAMILY` | ổ gia đình, bảo vệ con non, tuyến kiếm ăn | hội đồng, thị trường, quân đội thường trực |
| `PACK_OR_HERD` | bầy/đàn, thứ bậc, canh gác, săn/chạy đàn phối hợp | nhà ở kiểu người, kho bạc, nghề nghiệp trừ khi loài có năng lực đó |
| `COLONY_OR_BROOD` | tổ/đàn, caste sinh học, đường hầm, brood, phân vai theo tín hiệu | hộ gia đình, lương, luật thành văn nếu không có trí tuệ tương ứng |
| `RITUAL_OR_RESONANT` | neo năng lượng, vòng cộng hưởng, đội hình theo tín hiệu/ấn | ăn uống, sinh sản hữu cơ, chợ hoặc tâm lý người |
| `SAPIENT_CLAN` | gia đình/clan, thủ công, kho, luật tục, ngoại giao, công sự đúng thời đại | nhà máy, quốc gia hiện đại hoặc công nghệ ngoài `ERA-LL01-PREINDUSTRIAL-HIGH-MAGIC-1.0` |

`organization_stage` dùng thang `0=đơn độc`, `1=tập tụ`, `2=nhóm ổn định`, `3=lãnh vực có phân vai`, `4=đa khoang/đa điểm có điều phối`. Stage đo độ tổ chức trong trần của loài; stage 4 của nhện quặng vẫn là colony đường hầm, không phải thành phố người. Mọi đổi stage cần đúng `transition_rule`, đủ số ngày liên tiếp và event commit; narrator không được nâng stage vì một cảnh cần đối thủ lớn hơn.

### 26.6. Dân số, vai trò và Phẩm

1. `member_count = Σ role_quality_cohorts.count = Σ member_group.count` tại cùng timestamp.
2. `member_count ≤ population_true` của mọi source population sau khi cộng đúng phần được debit; phần còn lại tiếp tục là nhóm roaming/độc lập hữu hạn.
3. Hero ảnh hưởng command, cảnh giới, cohesion hoặc lựa chọn hành động theo File 04 §18.8; không cộng một quality step cho follower. Phẩm từng cohort ở Phụ lục 3.L là explicit.
4. Sinh, chết, chuyển bầy, tách ổ, nhập ổ, đào ngũ và bị hồi sinh đều là event hai đầu: trừ nơi nguồn, cộng nơi đích nếu còn tồn tại. Xác và undead không đồng thời nằm trong living population.
5. Hai lair cùng loài có thể khác stage vì tuổi ổ, nguồn lực, áp lực, lịch sử và năng lực đầu lĩnh khác nhau; engine không clone trạng thái từ species name.

### 26.7. Lãnh vực và lịch hoạt động tất định

Bốn lớp đồng tâm chỉ là baseline geometry trước delta địa hình: `core` là ổ/tổ; `controlled` là nơi tuần tra có thể phản ứng nhanh; `use` là vùng săn/kiếm ăn/khai thác; `influence` là nơi dấu vết hoặc phản ứng gián tiếp có thể xuất hiện. Chồng lấn `use/influence` tạo frontier và cạnh tranh thật; nó không xóa owner hoặc teleport hai bầy vào combat.

Mọi profile LL01 dùng tọa độ tuyệt đối và lịch niêm trong 3.L. Với profile bốn hướng, đặt:

\[
P_k=(c_x+r\cos(\theta_0+90^\circ k),\;c_y+r\sin(\theta_0+90^\circ k)),\quad k\in\{0,1,2,3\}
\]

- `P4`: lộ trình `[C,P0,C,P1,C,P2,C,P3]`;
- `F4`: `[C,P0,P1,C,P2,P3,C]` để kiếm ăn;
- `T4`: cùng `P4` nhưng nằm trong tunnel/địa tầng và chỉ lộ ở cửa đã ghi;
- `O4`: `[P0,P1,P2,P3]` quay quanh neo cộng hưởng;
- `H4`: `[C,P0,P1,P2,P3,C]` cho herd/clan trên quy mô lớn.

`phase_index=floor((minutes_since_T0+offset_min)/step_min) mod route_node_count`; `segment_fraction=((minutes_since_T0+offset_min) mod step_min)/step_min`. Nhóm nằm tại nội suy tuyến tính từ node `phase_index` tới node kế theo `segment_fraction` và movement profile File 04, không roll chọn hướng. Một event thương vong, báo động, thời tiết cực đoan, mục tiêu bị cạn hoặc lệnh Hero có thể đổi route bằng receipt; reload chỉ đọc receipt, không rút thăm lại.

### 26.8. Tiến hóa, cạn nguồn và kế vị

Mỗi ngày tại `07:00`, resolver cập nhật bốn chỉ số `resource/shelter/cohesion/pressure` từ ledger thật. Mỗi tuần tại `07:00` ngày đầu tuần, resolver kiểm transition; mọi điều kiện “N ngày” dùng số ngày liên tiếp, không dùng trung bình che ngày fail. Đói, cháy/sập ổ, mất neo, xâm nhập core, thủ lĩnh chết hoặc nguồn cạn là emergency boundary và được xử lý ngay.

Hero chết không làm cả lair biến mất. Lair chạy đúng succession row trong 3.L: đấu vị trí, hội đồng, caste sinh sản, kế thừa ấn, phân mảnh hoặc `NONE_LAIR_VACANT`. Follower giữ ID, vết thương, ký ức nhóm và vị trí. Chỉ event death/migration/combat thật mới xóa cá thể; “đổi boss” không refill population.

### 26.9. Tìm kiếm, săn và sương mù

Lair tồn tại trong hidden state trước khi bị nhìn thấy. Search/hunt quét geometry thật và có thể chạm dấu ranh, tuyến kiếm ăn, group đang di chuyển, core hoặc không gì cả. Thứ tự quyền biết: `UNOBSERVED → SIGNS_ONLY → CONTACTED_PERIPHERY → CORE_LOCATED → INTERNAL_PROFILE_KNOWN`; một dấu chân không lộ population, Hero, kho hay lịch đầy đủ.

Khi player xâm nhập, engine chọn đúng group có vị trí hợp lệ, debit casualties theo §26.6 và ghi phản ứng lãnh vực. “Encounter quái” không được sinh thêm một packet ngoài registry; “đã giết patrol” cũng không đồng nghĩa đã diệt toàn hang. Projection player chỉ hiện điều giác quan/chứng cứ cho phép, trong khi scheduler vẫn dùng hidden route/resource/succession state.

### 26.10. `SPATIAL-SWEEP-GEOMETRY-1.0` — search tạo nỗ lực không gian, không tạo encounter

Mọi `HUNTING`, `TREASURE_SEARCH`, `SCOUTING`, `PROSPECTING`, `PATROL`, `MILITARY_RECON`, `CONVOY_INTERCEPT`, `CORPSE_EXCAVATION` và `EXPLORATION` dùng cùng contract. Một parent job chỉ mô tả mục tiêu, envelope và điều kiện dừng; nó phải tách thành một hay nhiều `team_spatial_operation`. Mỗi team là một hoạt động spacetime độc lập, có route/lane/clock riêng. Cấm dùng “mỗi job một encounter roll”, “mỗi N người một encounter” hoặc nhân tỷ lệ gặp theo quân số để thay geometry.

```yaml
spatial_search_plan:
  spatial_plan_id:
  parent_job_id:
  observer_lineage_id:
  operation_kind:
  allowed_envelope_ref:
  sector_assignments: []
  team_operation_ids: []
  start_at:
  return_by:
  pursuit_reserve_minutes:
  safety_buffer_minutes:
  stop_scope:
  search_history_ref:
  rule_version: SPATIAL-SWEEP-GEOMETRY-1.0

team_spatial_operation:
  team_operation_id:
  spatial_plan_id:
  actor_ids: []
  sector_geometry_ref:
  formation_profile:
  route_plan_ref:
  outbound_path_ref:
  return_path_ref:
  communication_link_ref:
  status: SCHEDULED|OUTBOUND|SWEEPING|PURSUING|RETURNING|PAUSED|COMPLETED
  sweep_segment_ids: []
  gross_area_km2: 0
  unique_area_km2: 0
  repeated_area_km2: 0
  fresh_area_km2: 0
  last_settled_at:

sweep_segment:
  sweep_segment_id:
  team_operation_id:
  actor_id:
  t_start:
  t_end:
  path_geometry_ref:
  lane_width_km:
  swept_polygon_ref:
  detection_effort_by_target_class: {}
  terrain_ref:
  weather_ref:
  visibility_ref:
```

`allowed_envelope` chỉ cắt nơi được phép hoạt động; nó **không** phải diện tích đã tìm. Với một team:

\[
T_{search}=\max(0,ReturnBy-Start-T_{out}-T_{return}-SafetyBuffer-PursuitReserve)
\]

Tại interval `k`, lane của actor `i` là:

\[
G_{i,k}=Buffer(Path_{i,k},LaneWidth_i/2)\cap Sector\cap Envelope\cap Traversable
\]

`Path` phải tiêu cùng world clock với outbound, pursuit, mang tải và return. Radius 20 km không cấp cả hình tròn 20 km cho party; nếu outbound + return đã dùng hết cửa sổ thì `T_search=0`.

### 26.11. Gross, unique, repeated và fresh coverage

Trong mỗi interval và toàn operation:

\[
Gross=\sum_{i,k}Area(G_{i,k}),\quad Unique=Area(\bigcup_{i,k}G_{i,k}),\quad Repeated=Gross-Unique
\]

\[
Fresh=Area\left(\bigcup G_{i,k}\setminus HistorySweptBeforeStart\right)
\]

Gross đo công sức; Unique đo đất thật đã phủ; Repeated tăng độ kỹ trong đúng footprint chứ không biến thành đất mới; Fresh tách vành mới khỏi cell đã bị săn cạn. `A_tick` của specialist chỉ là **trần coverage của từng team/tick**; nó có thể cắt ngắn lane nếu đội hình hứa quét quá nhanh, nhưng không được tự materialize một polygon hoặc gộp nhiều team thành một pool.

Lịch sử dùng `observer_lineage_id + target_class + spatial_cell/time_epoch`, không dùng `search_id`. Hủy/tạo job mới giữ nguyên history. Mỗi cell lưu union geometry, effort/detection theo lớp mục tiêu, thời điểm, phương pháp và evidence. Dữ kiện âm đối với mục tiêu tĩnh chỉ áp ở footprint đã quét với ngưỡng detection đạt; đối với mục tiêu di động, nó chỉ nói rằng worldline mục tiêu không bị phát hiện trong interval đó. Thông tin cũ giảm confidence khi mục tiêu di chuyển, thời tiết đổi hoặc một event làm thay state.

### 26.12. Worldline mục tiêu và eligibility

Mục tiêu tĩnh dùng footprint tồn tại trong interval; mục tiêu di động dùng `target_worldtube = Buffer(Worldline(t), concealment_radius)`. Một candidate chỉ eligible khi worldtube/footprint cắt sweep polygon **và** các interval thời gian chồng nhau. Resolver không được chạy `hunt check` rồi chọn bất kỳ group nào trong vùng.

Với candidate `g` và các segment cắt nó:

\[
E_g=\sum_s Length(Path_s\cap DetectCorridor_g)\times Detect_i\times Terrain_s\times Weather_s\times Visibility_s\times Method_s
\]

`DetectionScore_g` được specialist so với concealment/evidence threshold của chính target. Dấu chân có threshold thấp hơn visual contact; core/lair interior có threshold và access geometry riêng. Việc chỉ cắt `influence/use` của lair cho tối đa `SIGNS_ONLY`; patrol chỉ eligible nếu worldline của patrol cắt lane; core vẫn kín nếu lane không chạm core. Wildlife group và lair patrol giữ nguyên `group_id`, population provenance và conservation ledger riêng.

### 26.13. Parallel contacts và khóa conservation

Hai team có thể cắt hai group khác nhau tại cùng timestamp và tạo hai contact độc lập. Nếu nhiều team đồng thời cắt **cùng** một group, scheduler khóa `target_group_id + interval`, settle vị trí/casualty một lần rồi chia evidence/contact theo geometry; cấm nhân bản mục tiêu. Stop event chỉ ảnh hưởng scope đã niêm: team-local dừng ngay team đó, all-on-signal chờ signal/recall delay, còn team không liên lạc tiếp tục theo lệnh cũ.

### 26.14. Phân giải theo cấp không gian

Index không gian dùng ô phân cấp cạnh `0,25×2^L km`, `L=0…10`, cùng R-tree cho bounding box và interval index cho thời gian. Local contact giữ vector lane/worldline chính xác. Regional/continental pass chỉ cộng coverage/evidence theo cell và lấy candidate crossing từ index; khi một crossing, casualty, discovery hoặc decision surface xảy ra thì hydrate đúng team/group ID ở mức chi tiết. Hạ resolution được phép giảm số polygon cần giữ, nhưng không được đổi quan hệ nhân quả: cùng route, clock, population và seed phải cho cùng candidate crossing ở mọi mức.

## 27. Trường nồng độ Rương Báu

> **Nhãn nguồn:** `USER_LOCKED + DESIGN_DEFAULT/CHEST-FIELD-2.1`. Bảng/công thức dưới còn dùng cho campaign khác. Campaign Lí Lan lấy count, cache, tọa độ, Phẩm và loot commitment trực tiếp từ `WORLD-PACKAGE-LL01-1.0`; không chạy phép làm tròn mật độ. `chest_concentration_level` chỉ mô tả trường cố định và không được sinh thêm rương lúc nhân vật bắt đầu tìm.

### 27.1. Thang nồng độ 0–5

| Mức | Tên vận hành | Ý nghĩa |
|---:|---|---|
| 0 | không có trường đã seed | cell không có site rương theo seed hiện hành |
| 1 | dấu vết | tín hiệu rất thưa; khảo sát thường không đủ kết luận |
| 2 | thấp | có khả năng site rời rạc, cần trinh sát mục tiêu |
| 3 | trung bình | nhiều điều kiện địa hình/lịch sử có thể nuôi site |
| 4 | cao | vùng giàu di tích, boss, bảo khố hoặc hiện tượng tạo rương |
| 5 | điểm tụ | nexus đặc biệt; luôn đi kèm nguy cơ/chủ quyền lớn và event seed |

### 27.2. Mật độ tham chiếu và materialization

| Phẩm rương | Neo phạm vi | Số rương nền | `BaseDensity` rương/km² | `Detectability` |
|---|---:|---:|---:|---:|
| Mộc | 10 km² | 5 | 0,50000 | 1,00 |
| Thanh Đồng | 100 km² | 3 | 0,03000 | 0,80 |
| Bạch Ngân | 1.000 km² | 2 | 0,00200 | 0,55 |
| Hoàng Kim | 10.000 km² | 1 | 0,00010 | 0,30 |
| Hạo Nguyệt | 100.000 km² | 1 | 0,00001 | 0,12 |

Phẩm cao hơn Hạo Nguyệt chỉ đến từ site/event/owner contract cụ thể; không ngoại suy vô hạn. Với campaign **không** có fixed package và diện tích khả dụng `A_cell` km²:

\[
M_c(0..5)=0/0.25/0.60/1.00/1.50/2.50
\]

\[
\lambda_q=A_{cell}\times BaseDensity_q\times M_c\times M_{cause,q}
\]

`M_cause,q∈[0,3]` được cause-tag của cell khóa trước seed; không có tag dùng `1`. Đặt `k=floor(λ_q)`, `f=λ_q−k`, `u=Hash64(seed_id+cell_id+q+"CHEST-COUNT")/2^64`; `N_q=k+I(u<f)`. Đây là stochastic rounding tất định, cho kỳ vọng đúng mật độ ở cell nhỏ mà không ép mọi 10 km² phải có đúng năm rương. Sau đó seed đúng `N_q` site/toạ độ/hazard/owner; mở hoặc phá rương chỉ giảm `N_remaining`, không gọi công thức để bù.

```yaml
chest_field_cell:
  cell_id:
  seed_id:
  rule_version: CHEST-FIELD-2.1
  chest_source_type: NORMAL_WORLD
  acquisition_scope: GENERIC_WORLD
  event_chest_profile_id: NONE
  concentration_level: 0..5
  cause_tags: []
  area_accessible_km2:
  base_density_by_grade: {}
  materialized_count_by_grade: {}
  remaining_count_by_grade: {}
  theoretical_site_count:
  discovered_site_count:
  exhausted_site_count:
  estimated_undiscovered_range: {low, base, high}
  confidence:
  chest_sites:
    - {site_id, coordinate, terrain, hazard, owner, chest_instance_ids, discovered_event, exhausted}
  nearest_discovered_chest: {chest_instance_id, straight_km, route_km, access_state}
  last_survey_event:
```

Một rương chỉ tồn tại khi có `chest_instance_id` gắn với site hoặc phần thưởng event đã materialize thành vật thể. Mở rương không làm trường tự sinh rương bù. Với `WORLD-PACKAGE-LL01-1.0`, `seed_id/cell/q` không được gọi để tính lại `N_q`; engine đọc đúng 192 instance cùng `loot_commitment` đã niêm. Biên nhận, số dòng, họ vật phẩm, số đơn vị, phẩm item và scope lấy File 04 §§12.8–12.12.

`CHEST-FIELD-2.1` chỉ materialize rương `chest_source_type=NORMAL_WORLD`, `acquisition_scope=GENERIC_WORLD` và `event_chest_profile_id=NONE`. Template mang `EVENT_EXCLUSIVE:*` bị loại trước khi tạo loot commitment và trước khi niêm `candidate_pool_hash`; vận may cao chỉ ảnh hưởng package rương đã khóa quanh Lí Lan, không vượt filter scope.

Rương sự kiện không được cấy ngược vào mật độ địa lý thường. Nó phải có `origin_event_id`, `event_chest_profile_id`, `event_site_id` hoặc reward slot, `available_from/until` trùng File 01 §14.3 và tọa độ/cửa vào đã materialize khi event ở trạng thái `SCHEDULED`. Ngay trước hết hạn, rương đã có chủ tự quyết toán item vào escrow thuộc chủ; rương vô chủ ngoài thế giới và chest chưa commitment đều hết hiệu lực. Không spawn, dời hoặc mở rương để mint loot sau event.

### 27.3. State `LookingForTreasure` và tick 15 phút

Lệnh gửi Tử Thể hoặc actor khác đi tìm rương tạo một background job, không phải một câu flavor:

```yaml
LookingForTreasure:
  search_id:
  observer_lineage_id:
  owner_id:
  active: true
  status: ACTIVE|PAUSED|CANCELLED|COMPLETED
  spatial_plan_id:
  team_operation_ids: []
  started_at:
  last_tick_at:
  next_tick_at: started_at + 15m
  searcher_unit_ids: []
  route_cell_ids: []
  route_policy:
  gross_area_km2:
  visited_area_km2:
  repeated_area_km2:
  search_history_ref:
  current_cell_id:
  findings_pending_render: []
  stop_conditions: []
  rule_version: CHEST-SEARCH-2.0
```

Khi `LookingForTreasure.active=true` và `status=ACTIVE`, mọi bước tiến thời gian phải materialize **từng** tick `next_tick_at += 15 phút` cho tới timestamp after-state; nhiều hành động foreground không được làm mất job. Với mỗi searcher hợp lệ:

\[
SP_i=Clamp(0.25,2.50,0.15+0.03DEX_i+0.04INT_i)
\]

\[
SearchPower=\sum_i SP_i\times Health_i\times Mobility_i\times OrderIntegrity_i
\]

\[
A_{tick}=0.20\times0.25\times SearchPower\times Terrain\times Weather
\times Visibility\times RouteNovelty\quad km^2
\]

`SearchPower` và `A_tick` được tính **riêng cho từng team operation**. `A_tick` là coverage ceiling của interval, không phải diện tích tự hiện ra quanh job; diện tích commit là union của các `swept_polygon_ref` thật theo §§26.10–26.11. `visited_area_km2` chỉ tăng bằng phần Unique/Fresh tương ứng, còn chồng lấn đi vào `repeated_area_km2`.

`Health/Mobility/OrderIntegrity∈[0,1.25]`; `Terrain/Weather/Visibility∈[0,1.25]`; `RouteNovelty=1,00` ở phần chưa quét, `0,50` quét dở và `0,10` tuyến đã quét. Searcher bị phá hủy, mất liên kết hoặc nhận lệnh khác không đóng góp. Với từng Phẩm, dùng rương **còn thật và có thể tiếp cận** trong phần route chưa giải:

\[
\rho_{q,remaining}=N_{q,remaining}/A_{q,remaining},\qquad
H=\sum_q A_{tick}\rho_{q,remaining}Detectability_q
\]

\[
P(find\ge1)=1-e^{-H}
\]

Với các tick `k` đã đi qua từ `started_at` tới `t`, ảnh hưởng của **thời gian đã tìm** được tích lũy đúng bằng hazard của từng segment môi trường:

\[
H_{elapsed}(t)=\sum_{k:tick_k\le t}H_k,\qquad
P(\text{đã tìm thấy ít nhất một lần tới }t)=1-e^{-H_{elapsed}(t)}
\]

Weather, visibility, terrain, searcher count/attributes và route novelty của từng tick nằm trong chính `H_k`; vì vậy tám tick trời quang và tám tick bão không bị gộp bằng một hệ số trung bình hồi tố.

Mỗi tick có roll duy nhất `u=Hash64(search_id+tick_at+"FIND")/2^64`; thành công khi `u<P`. Khi thành công, chọn một chest thật trong candidate set bằng trọng số `Detectability_q/access_cost`, CDF và sub-seed `PICK`, rồi commit `ChestDiscovered`; không tạo chest sau roll. Một tick tìm tối đa một rương; search tiếp tục nếu stop condition chưa đạt. `A_remaining=0` hoặc candidate set rỗng cho `P=0` và có zero reason.

**Override LL01 — `CHEST-SEARCH-2.1-FIXED`.** Hai phép roll ở đoạn trên không chạy trong `WORLD-PACKAGE-LL01-1.0`, vì `search_id` có thể bị thay bằng thao tác hủy/tạo job. Mỗi tick vẫn tính thời gian, route, weather, visibility và `A_tick`, nhưng discovery là phép hình học–ngưỡng tất định:

1. lấy đúng các `sweep_segment` của team từ `SPATIAL-SWEEP-GEOMETRY-1.0`, cắt lane bằng `A_tick` nếu chạm ceiling rồi union polygon; chỉ chest coordinate nằm trong union, chưa exhausted và access gate không khóa mới là candidate;
2. với `chest_instance_id=CH-LL01-n`, đặt `Offset=(n−1) mod 5`; `Concealment=Mộc 8, Thanh Đồng 12, Bạch Ngân 16, Hoàng Kim 20, Hạo Nguyệt 24 + Offset`;
3. `DetectionScore=PER+floor(INT/2)+ToolBonus+floor(LocalFocusedSearchMinutes/10)`, với `ToolBonus=0` tay không, `2` bộ tìm kiếm dã chiến, `4` dụng cụ chuyên khảo; direct line of sight trong 2 m cộng `10`;
4. candidate pass khi `DetectionScore≥Concealment`; nếu nhiều pass cùng tick, chọn khoảng cách route nhỏ nhất rồi `chest_instance_id` tăng dần; tối đa một rương/tick;
5. `LocalFocusedSearchMinutes` chỉ cộng tại coordinate/cache thật sự nằm trong lane của actor và gắn `observer_lineage_id + coordinate/cache + event ledger`; không reset khi đổi `search_id`, nên cancel/restart không đổi thứ tự hoặc ngưỡng.

Không field nào ở đây là random. Hành động đi đúng vị trí nhưng không đủ quan sát có thể bỏ lỡ vật giấu kỹ; quay lại với dụng cụ/thời gian thật tăng score có nguyên nhân. LUK đã được tiêu thụ ở package compile để chọn mật độ R0 và không cộng lần hai vào `DetectionScore`.

### 27.4. Quy tắc render kết quả nền

Engine giữ tất cả `ChestDiscovered` đúng timestamp, nhưng trong **mỗi phản hồi hiện hành** chỉ render một khối `[KẾT QUẢ TÌM RƯƠNG]` ở cuối phần hệ thống, sắp `found_at` rồi `chest_instance_id`. Không chen thông báo rời rạc vào giữa cảnh ở từng mốc 15 phút. Nếu không tìm thấy, chỉ hiện một dòng tổng hợp khi việc tìm rương liên quan đến khoảng thời gian vừa xử lý: số tick, tổng diện tích quét và `LookingForTreasure` còn bật hay không. Việc gộp hiển thị không gộp/xóa event ledger.

## 28. Thời tiết, bóng tối và hạn trở về

> **Nhãn nguồn:** ngày 24 giờ, đêm hàn phong dài và mốc T0 07:00 là `USER_LOCKED`; mô hình trường là `DESIGN_DEFAULT/WEATHER-NIGHT-1.1`. Giá trị từng giờ là `CAMPAIGN_SEEDED` từ khí hậu/season/front, không lấy từ campaign thử.

`WORLD-CLOCK-2.0`: `T0=07:00`, một ngày đúng 24 giờ. Tại vùng khởi đầu, bình minh 07:00, hoàng hôn 16:30, hết chạng vạng 17:00. Daylight dài 9 giờ 30 phút; đêm từ hoàng hôn tới bình minh dài 14 giờ 30 phút, gồm 30 phút chạng vạng và 14 giờ tối hoàn toàn. Tính hàn phong làm đêm dài và tải lạnh nặng hơn; weather/front được phép làm tối sớm về **ánh sáng hiệu dụng** nhưng không dịch mốc hệ thống 00:00/07:00. Daily content/version settlement chạy 07:00; hồ Tử Khí Ngôi Mộ refill 00:00.

### 28.1. Bản ghi thời tiết theo giờ

```yaml
weather_hour:
  cell_id:
  starts_at:
  sunrise:
  sunset:
  twilight_end:
  light_level:
  air_temperature_c:
  apparent_temperature_c:
  wind_speed_direction:
  precipitation_type_rate:
  wetness:
  visibility_m:
  surface_state:
  shelter_modifier:
  insulation_modifier:
  cold_load_rate:
  navigation_error_rate:
  movement_multiplier:
  predator_activity_multiplier:
  hostile_undead_activity_multiplier:
  sound_detection_modifier:
  forecast_confidence:
  source_event:
```

Thời tiết dự báo và thời tiết thật là hai record khác nhau. Nhân vật chỉ biết forecast theo công cụ/kinh nghiệm; engine dùng actual để phân giải.

### 28.2. Tải lạnh và trú ẩn

\[
ColdLoadGain=ExposureMinutes\times
\frac{TempDeficit\times WindWetnessFactor\times ActivityFactor}
{Insulation\times Shelter}
\]

Trang phục ướt, gió, đói, kiệt sức và đứng yên làm tải tăng; lửa, nhà kín, quần áo khô, vận động phù hợp và đồ uống nóng làm giảm theo rule sức khỏe. Tải lạnh phải có `before → delta → after`, triệu chứng và ngưỡng cảnh báo. Bảo hộ khai cuộc không triệt tiêu lạnh, gió hay bóng tối.

### 28.3. Hoàng hôn phải tạo thay đổi cơ học

Khi đi từ sáng sang tối ở ngoài nơi trú, engine phải áp **ít nhất ba thay đổi có giá trị khác ban ngày**, chọn từ:

1. tầm nhìn/khả năng nhận diện giảm, nguồn sáng làm lộ vị trí;
2. sai số định hướng và thời gian đường về tăng;
3. `ColdLoadGain` tăng do nhiệt/gió/độ ẩm;
4. lịch hoạt động predator, thú săn đêm hoặc undead thù địch tăng;
5. địa hình băng, khe nứt, dốc và vật cản khó phát hiện hơn;
6. hiệu quả thu thập/chiến đấu tầm xa/đội hình giảm;
7. một số sinh vật ban ngày rút đi, làm mục tiêu/supply thay đổi.

Nếu seed cụ thể khiến một yếu tố không đổi, phải dùng ba yếu tố khác; không được chỉ viết “trời tối hơn” rồi cho hành động tiếp diễn với cùng xác suất, tốc độ và nguy cơ.

### 28.4. `ReturnBy` và thẻ đường về

Với thời gian đường về cơ sở `TravelBack`, độ trễ do địa hình/thời tiết `DelayRisk` và buffer khẩn cấp `SafetyBuffer`:

\[
ReturnBy=HazardThresholdTime-(TravelBack+DelayRisk+SafetyBuffer)
\]

`HazardThresholdTime` là mốc sớm nhất giữa hết chạng vạng, bão chạm tuyến, nhiên liệu/ánh sáng cạn, tải lạnh chạm ngưỡng hoặc cửa bảo hộ vật lý của nơi trú đóng. Thẻ phải hiện:

```yaml
return_risk_card:
  route_id:
  current_location:
  shelter_destination:
  current_time:
  sunset_and_twilight:
  travel_back_base:
  weather_delay_range:
  safety_buffer:
  return_by:
  current_margin:
  light_or_fuel_endurance:
  cold_load_projection:
  known_hostile_groups_on_route: []
  fallback_shelters: []
  alert_state: SAFE|COMMIT_RETURN|LATE|EMERGENCY
```

Khi `current_time ≥ ReturnBy`, giao diện phát cảnh báo cấp bách và lựa chọn tiếp tục phải nêu giá phải trả. Nếu người dùng ra lệnh dài vượt mốc, engine báo trước hoặc dừng tại mốc quyết định; không âm thầm để họ hoàn tất rồi teleport về an toàn.

### 28.5. Tick ban đêm không có giao chiến vẫn có hậu quả

Một đêm “không gặp quái” vẫn xử lý nhiệt, nhiên liệu, canh gác, ngủ/mệt, tiếng động, dấu vết quanh doanh địa, ecology movement, thời tiết, công trình/hàng chờ và cảnh báo. Sự yên tĩnh là một kết quả seed, không phải lý do bỏ tick. Mọi nhóm ngoài lãnh địa giữ vị trí và route thật; dawn không tự đưa họ về.

## Phụ lục 3.A — Quy tắc đặt tên bản đồ

Mỗi nơi có endonym, exonym, tên hành chính và tên cổ nếu cần. Tên phản ánh ngôn ngữ/lịch sử; không dùng chuỗi fantasy ngẫu nhiên không quy tắc. Một địa danh đổi tên chính trị nhưng dân địa phương có thể giữ tên cũ.

## Phụ lục 3.B — Kiểm tra tính hợp lý địa lý

- Sông có nguồn và cửa?
- Thành có nước, thức ăn và hinterland?
- Mỏ có đường xuất?
- Biên giới có lý do tự nhiên/lịch sử?
- Quân tới nơi trong thời gian hợp lý?
- Mỗi vùng có mùa và thiên tai?
- Phế tích có niên đại và nền văn minh tạo ra?

## Phụ lục 3.C — Kiểm tra chính trị

- Ai ký nhưng ai thi hành?
- Ai được lợi, ai trả?
- Phe thua có tài nguyên cản trở?
- Chính quyền biết tới đâu và trễ bao lâu?
- Luật có khác thực tế?
- Kế vị xảy ra thế nào?
- Thất bại có tạo tiền lệ?

## Phụ lục 3.D — Kiểm tra NPC

NPC đang làm gì trước khi {{user}} tới; họ muốn gì không liên quan {{user}}; họ biết từ nguồn nào; điều gì khiến họ nói dối; điều gì khiến họ đổi ý; ai bị ảnh hưởng nếu họ biến mất; lịch của họ có cho phép có mặt?

## Phụ lục 3.E — Ma trận độ tin cậy thông tin

| Nguồn | Nhanh | Chính xác | Có động cơ | Dễ kiểm chứng |
|---|---:|---:|---:|---:|
| Hệ thống trong quyền | cao | cao | thấp | cao |
| Trinh sát trực tiếp | vừa | vừa–cao | vừa | vừa |
| Quan chức | vừa | tùy năng lực | cao | cao nếu có hồ sơ |
| Thương nhân | cao theo đường | vừa | cao | vừa |
| Tin đồn | cao | thấp | không rõ | thấp |
| Bói/scrying | theo canon `<>` | mảnh/ẩn dụ | nguồn lạ | khó |

## Phụ lục 3.F — Mốc mô phỏng dân số

Tick ngày: ăn, bệnh, di chuyển ngắn. Tick tháng: sinh/tử, giá, việc. Tick mùa: mùa vụ, di cư, chiến dịch. Tick năm: tuổi, giáo dục, hộ, tầng lớp. Biến cố có thể ép tick sớm.

## Phụ lục 3.G — Quy tắc lấp khoảng trống canon và phần dành cho nhân vật chính

Số lục địa, cấu trúc quốc gia, phe phái, chủng tộc, thần linh, lịch sử đại chiến và bí mật hệ thống trước hết lấy từ `<>`. Nếu `<>` im lặng, engine sinh chi tiết tương thích bằng seed có version; không cần chờ {{user}} viết thêm lore thế giới. Vị trí nhập cuộc, thân phận, quan hệ ban đầu, nhận thức và mục tiêu của Lí Lan đã khóa trong File 06; chỉ hành động, lời nói, nội tâm chủ ý và quan hệ phát sinh còn thuộc quyền người chơi trong play. Không sao chép tên hay hồ sơ của nhân vật chính nguyên tác.

## Phụ lục 3.H — Dấu vết nguồn game phụ

Mô hình trật tự–thuế–tham nhũng chịu ảnh hưởng cấu trúc campaign của [Total War Academy](https://academy.totalwar.com/warhammer2/); mô hình áp lực tăng trưởng dùng ý tưởng đối trọng từ [Against the Storm](https://wiki.hoodedhorse.com/Against_the_Storm/Hostility); tech/đô thị dùng logic chuỗi sản xuất RTS/4X. Toàn bộ công thức và NPC engine trong file là thiết kế mới.

Đối chiếu `<>`: [Chương 19 — Chợ đổi vật và quái quanh doanh địa](https://www.69shuba.com/txt/58776/38156830), [Chương 32 — daylight dưới mười giờ](https://xszj.org/b/388493/c/15974142), [Chương 66 — đồng Krona](https://mbook.novel.qq.com/read/1050133618/66), [Chương 117 — hết bảo hộ và áp lực bảy ngày](https://www.69shuba.com/txt/58776/38465522). Những trang này khóa chức năng/neo; các hệ số số học còn lại mang version bổ sung dưới đây.

## Phụ lục 3.I — Registry tham số thế giới `WORLD-MATH-CLOSURE-1.0`

| Công thức | Tham số và miền đã khóa |
|---|---|
| Di chuyển §2.1 | `Distance` km; `BaseSpeed` km/giờ: đi bộ 4, mang nặng 3, kỵ 8, xe 4, quân lớn 2,5. `Terrain`: đường 1,00; đồng mở 1,15; rừng/tuyết dày 1,35; đất vỡ 1,60. `Weather`: quang 1,00; tuyết 1,25; bão 1,75. `Load`: nhẹ 1,00; thường 1,10; nặng 1,35. `Security` lấy từ RouteSecurityScore: `≥75→1,00`; `40..74,9→1,15`; `<40→1,35`. `Stops` tính bằng giờ; địa hình không đi được hoặc segment chưa settle An ninh chặn ETA. |
| Phù hợp định cư §4.1 | tám input `0..100`; kết quả `Clamp(0,100,...)`. Bộ trọng số mặc định đã in; văn hóa khác phải có `weight_version`, tổng trọng số dương đúng 1 và hệ số `LatentThreat` luôn bị trừ. |
| Kiểm soát §6.1 | Campaign gọi File 01 `TERRITORY-VITALS-1.0-S`: `S_fire∈[0,100]`; `λ=max(0.1 km,R_heat,km(0.50+0.005GOV)(0.75+0.50NetworkCoverage))`; `Road=0.50+0.75RouteReliability`; `Garrison=0.50+0.75ThreatCover`; hệ số chính danh là `LegitimacyM`; từng cell dùng `Clamp(0,100,S_fire×e^(−d/λ)×Road×Garrison×LegitimacyM)` rồi gộp theo diện tích. |
| Threat floor §6.1 | `BiomeThreatFloor_z=ΣGroupCP_g×P_reach`; group thuộc finite ecology state, `P_reach∈[0,1]`, active threat bị loại khỏi floor để chống double-count. Không group hợp lệ cho 0; thiếu cell/movement profile là INVALID. |
| Thuế §8.1 | `TaxBase` goods/kỳ; `Rate/AdminCapacity/Compliance/Control∈[0,1]`; `CollectionCost` cùng goods; `TaxReal=max(0,floor(product−cost))`. |
| Quan hệ §9 | tám thành phần `−25..25`, `Grievances∈[0,50]`; tổng clamp `−100..100`. Mỗi thành phần tạm dùng `Value(t)=Value_0×2^(−Elapsed/HalfLife)`, thời gian cùng đơn vị và `HalfLife>0`; thành phần được treaty/history đánh dấu permanent không decay cho tới event thay đổi. |
| Ngoại giao §10 | các biến `Accept` là utility point `−100..100`; chấp nhận khi `Accept≥0`, hòa chọn phương án có risk thấp rồi stable contract ID. Bốn biến `Credibility∈[0,1]`; tích giữ ba chữ số. |
| Chiến tranh §11 | `MobilizableForce` là CP File 04; `SupplyDaysNorm=Clamp(0,2,SupplyDays/30)`; `TreasuryMonthsNorm=Clamp(0,2,TreasuryMonths/6)`; `Cohesion/Command∈[0,1.25]`; công thức dùng hai biến đã chuẩn hóa, không nhân số ngày/tháng thô. |
| Kháng cự §11.4 | năm input dương và `Reform∈[0,20]`; `SecurityLegitimacy=0.5×(SecurityScore/5+LEG_effective/5)∈[0,20]`; tổng clamp `0..100`. |
| Giá §13.2 | `Reference>0`; sáu multiplier `0.25..4.00`; `Tax=1+tax_rate`, `tax_rate∈[0,1]`; giá fungible làm tròn tới đơn vị tiền nhỏ nhất/0,25 đơn vị barter. |
| Tín dụng §13.4 | mọi rate component `0..0.50`; tổng clamp `0..1` mỗi kỳ. `Principal≥0`, `Periods` là số kỳ nguyên không âm, `FixedFees≥0` và phải ghi từ trước; `RoundCurrency` làm tròn nửa lên tới đơn vị tiền nhỏ nhất. Không có loại tiền thì hợp đồng barter dùng đơn vị định giá đã thỏa thuận và bước 0,25. Trả sớm tính đúng số kỳ đã hoàn tất; vỡ nợ không tự cộng kỳ ẩn. |
| Utility NPC §16.1 | `w_g≥0`, tổng `w_g=1`; subjective outcome `−100..100`; mọi modifier còn lại `−100..100`; NPC chọn utility cao nhất trong tập action họ biết/cho là khả thi, hòa dùng habit rồi stable action ID. |
| Ký ức §17.1 | `Salience∈[0,1]`; `t,halfLife` cùng đơn vị và `halfLife>0`; `Rehearsal/IdentityLink∈[0,1.50]`; kết quả clamp `0..1`. |
| Sức mạnh phe §21.2 | `Members` là số thành viên; `Organization/Resources/Access∈[0,1.25]`; phe cai trị dùng `Legitimacy=0.50+0.0075LEG`, phe khác ánh xạ trục công nhận bằng `Clamp(0,1.25,0.625+0.00625Recognition)`; kết quả là “thành viên hiệu dụng”, không quyết định thắng tự động. |
| Mật độ §25 | `N≥0`, `A>0 km²`; density báo theo 1.000 km² là `1000N/A`; khi `N=0`, spacing **không áp dụng**, không tính căn và hiển thị “không có điểm trong mẫu”. |
| Sinh thái §26 | `Births/MigratedIn/NaturalDeaths/DiseaseLosses/Hunted/MigratedOut` là số cá thể nguyên không âm trong cùng tick; mọi outflow được reserve, tổng outflow không vượt population before + inflow; kết quả không âm. |
| Tải lạnh §28.2 | `ComfortTemp=18°C` cho người thường, loài khác phải có template; `TempDeficit=max(0,ComfortTemp−ApparentTemp)` °C. `WindWetnessFactor=Clamp(1,3,1+0.03×WindKph+Wetness)`, `WindKph≥0`, `Wetness∈[0,1]`. `ActivityFactor=0.70` vận động vừa, `1.00` đứng/đi chậm, `1.30` kiệt sức. `Insulation`: 0,25 gần như không che; 0,75 thiếu; 1,00 đồ lạnh cơ sở; 1,50 cách nhiệt; 2,00 siêu phàm. `Shelter`: 0,25 phơi trống; 0,75 chắn gió; 1,00 lều; 1,50 nhà sưởi; 2,00 kín/siêu phàm. ColdLoad dùng °C·phút; cảnh báo ở 300/600/900, chí tử từ 1.200 nếu không cứu chữa. |
| Hạn về §28.4 | `TravelBack` gọi đúng TravelTime trên route về. `DelayRisk=max(0,P90Travel−TravelBack)` từ forecast record; thiếu phân bố dùng `0.25×TravelBack`. `SafetyBuffer=max(15,ceil(0.20×(TravelBack+DelayRisk)))` phút. `HazardThresholdTime` là timestamp sớm nhất trong các hazard đã biết; `ReturnBy` làm tròn xuống phút để không cho safety giả. |

Trừ hàng ghi khác, TravelTime làm tròn lên phút; các score `0..100` và utility làm tròn một chữ số; probability/credibility/memory giữ ba chữ số; count dùng số nguyên; tiền/giá dùng bước của chính tiền tệ hoặc barter contract. `Clamp(min,max,x)` dùng ba đối số và dấu chấm thập phân trong bản máy.

`STATE_UNOBSERVED` dùng cho tọa độ/NPC/thời tiết đã seed nhưng Lí Lan chưa biết. Blank trong worldbuilding sheet là ô mẫu chưa có instance, không phải luật thiếu. `UNKNOWN_RULE` chỉ tồn tại khi một transaction gọi cơ chế chưa có source/version/registry; trường hợp ấy bị chặn và phải bổ sung luật trước khi chạy.


## Phụ lục 3.J — Roster 12 nhân vật định kỳ từ `<>` `SOURCE-ROSTER-12-1.0`

Roster này thay việc tạo top 10 bằng tên ngẫu nhiên. Tên, vai trò và năng lực nêu là neo nguồn; phần “chữ ký hành vi” là `SOURCE_INFERENCE` để mô phỏng, không phải trích dẫn nguyên văn. Trong campaign Lí Lan, roster dùng để dựng **đối thủ/đồng minh tương đương có lịch và build thật**; chỉ dùng nguyên danh tính nguồn khi campaign bật `IMPORT_SOURCE_CAST=1`. Một actor chỉ vào bảng nếu đúng loại eligible của contract và có ledger thật.

| ID | Nhân vật nguồn | Vì sao là nhân vật định kỳ | Thiên phú / năng lực trụ đã thấy | Quân, nghề hoặc tài sản gắn vai trò | Chữ ký tính cách–quyết định | Cách dùng trong rank simulation |
|---|---|---|---|---|---|---|
| RR-01 | Liễu Mộ Tuyết / 柳慕雪 | đồng hành và đồng kiến thiết từ khai cuộc tới các lần tiến giai lớn | Cực Quang Chúc Phúc; tuyến Cực Quang Kỵ Sĩ → Thiên Phạt Kỵ Sĩ | buff, thanh tẩy, hộ vệ; phối hợp quân chính của lãnh địa | dịu và cảnh giác; từ lệ thuộc chuyển sang tự chủ, ưu tiên an toàn người thân | mẫu support làm tốc độ XP/quân lực tăng qua uptime, không cộng điểm rank trực tiếp |
| RR-02 | Sarah Blade Dance / 莎拉·刃舞 | sát thủ chủ lực xuất hiện xuyên nhiều chiến dịch và lần tiến giai | Ảo Ảnh Thích Khách; ẩn nấp, crit và kết liễu | lực lượng đột kích/ám sát; về sau tiến tới cấp truyền kỳ | ít lời, chuyên nghiệp, giải quyết mục tiêu quyết đoán | mẫu damage specialist có contribution thật nhưng phụ thuộc target access |
| RR-03 | Asam / 阿萨姆 | kỵ sĩ khai cuộc, trinh sát và chỉ huy chiến trường lặp lại | Sương Lang kiếm thuật; tuyến Sương Lang Kỵ Sĩ → Sương Ngân Thánh Kỵ | sói Sương, kỵ binh và quân đoàn Ascalon | kỷ luật, trung thành, báo cáo nguy cơ thẳng | mẫu commander tăng cohesion/route, vẫn bị thương và tiêu quân nhu |
| RR-04 | Hilda Blood Kiss / 希儿妲·血吻 | chủ lực huyết hệ từ đầu tới chiến tranh/boss hậu kỳ | Huyết Chu Nữ Vương → Phi Hồng Nữ Vương; hút máu và bùng nổ | huyết chu, lực lượng huyết hệ, damage boss | kiêu hãnh, cạnh tranh, thích chứng minh bằng sức mạnh | mẫu carry tăng nhanh khi có mục tiêu dày; bị counter bởi thanh tẩy/Thánh |
| RR-05 | Bron / 布隆 | tuyến tanker và cự nhân được nâng cấp nhiều lần | thân thể Băng Xuyên Cự Nhân; phòng thủ và hấp thụ | cự nhân, tuyến trước, khiên và bảo vật phòng thủ | bộc trực, bền bỉ, nhận phần nguy hiểm nhất | mẫu tank nhận contribution từ damage hấp thụ, không bị last-hit làm mất XP |
| RR-06 | Xiao / 霄 | kiếm sĩ chủ lực với tuyến thiên phú và lần tiến giai riêng | kiếm đạo, thiên phú hỗ trợ quân đoàn; về sau Truyền Kỳ Kiếm Thánh | kiếm sĩ và đội hình cận chiến tinh nhuệ | điềm tĩnh, chuẩn xác, trọng kỷ luật | mẫu elite chất lượng cao nhưng quân số nhỏ; power dựa stats thật |
| RR-07 | Đồng Sở Sở / 童楚楚 | từ nhân vật được cứu thành hạt nhân công nghệ và nhiều arc di tích | Cơ Giới Chi Phối; ngắt tự hủy và chuyển cơ giới hợp lệ | robot, ma tượng, hạ tầng cơ giới và nghiên cứu | tò mò, giàu đồng cảm, học nhanh; không coi máy là loot vô tri | mẫu tech snowball cần xác máy, facility và thời gian chuyển đổi thật |
| RR-08 | Francesca / 法兰茜丝卡 | nữ vu/nhà dược lặp lại trong sản xuất và chuẩn bị chiến dịch | luyện dược, Thánh Thủy và bí dược cao cấp | Xưởng Luyện Dược, dược phẩm và support hậu cần | độc lập, khô khan, tin vào năng lực hơn lời hứa | mẫu economy/support; điểm đến từ output/quality chứ không từ combat giả |
| RR-09 | Eliza / 埃丽莎 | thành viên lãnh địa từ sớm, tham gia huấn luyện/xung đột và tuyến bí mật | xạ thuật Hàn Băng; phần bí mật chỉ mở theo event nguồn | cung thủ, trinh sát tầm xa và mạng Thụ Linh | dè dặt, quan sát kỹ, trung thành sau khi có bằng chứng | mẫu scout làm tăng information quality; không biết trước bí mật chưa mở |
| RR-10 | Băng Lan / 冰兰 | nhân vật long hệ có nhiều lần trở về, tiến giai và chỉ huy | Ngự Long → Truyền Kỳ Ngự Long Nữ Hoàng | cự long, long kỵ và không quân | kiêu hãnh, có nghĩa vụ riêng, không luôn sẵn sàng | mẫu air-power rất mạnh nhưng bị giới hạn route, upkeep và nhiệm vụ riêng |
| RR-11 | Mạnh Nghị / 孟毅 | lãnh chúa khác xuất hiện ở nhiều giai đoạn tới đề nghị liên minh hậu kỳ | thiên phú khắc mộng, có thể hút/giải ảnh hưởng giấc mơ; Phẩm cụ thể không được tự bịa | lãnh địa và lực lượng người sống sót độc lập | thẳng thắn, thực dụng, sẵn sàng hợp tác khi lợi ích khớp | mẫu rival độc lập có counter chuyên biệt; không scale theo nhân vật chính |
| RR-12 | Valerie / 瓦莱丽 | đại diện Thụ Linh trong quản trị dân cư, tuyển quân và sản xuất | lãnh đạo cộng đồng và kỹ năng sinh thái; không gán Phẩm khi nguồn chưa nói | Thụ Linh, năm ứng viên Cung Thủ Hàn Băng và lao động lâm nghiệp | trưởng thành, đồng thuận cộng đồng, bảo vệ người của mình | mẫu civic leader chuyển dân số thành quân có consent, housing và training |

Neo nguồn dùng để xác minh roster gồm: [trang tác phẩm và tiền đề chính](https://m.fbs.qq.com/detail/1050133618), [Chương 32 — Liễu Mộ Tuyết, Hạ Yến Ni và Đồng Sở Sở trong lãnh địa](https://mbooks.read.qq.com/read/1050133618/32), [Chương 45 — đội chiến đấu Sarah/Asam và Bảng Cấp](https://m.inote.qq.com/read/1050133618/45), [Chương 120 — Valerie, Eliza và tuyển Cung Thủ Hàn Băng](https://www.69shuba.com/txt/58776/38465525), cùng [mục lục nguồn](https://www.69shuba.com/book/58776/) tại các mốc tiến giai 607–608, 631, 712, 759, 761–762, 866 và 915. Nếu nội dung chương đầy đủ mâu thuẫn với mô tả ngắn trong bảng, chương đầy đủ thắng và roster phải tăng version.

### 3.J.1. Contract actor dùng cho mô phỏng đối thủ

Mỗi đối thủ/đồng minh định kỳ được seed tại T0 hoặc lần đầu tồn tại, không phải lúc bảng hạng sắp render:

```yaml
recurring_actor_sim:
  actor_id:
  roster_archetype_ref:
  eligibility_by_board: []
  talent_contract: {id, grade_or_unknown, mechanics, caps, counters}
  attributes_and_level:
  known_skills: []
  troop_ledger: []
  buildings_and_resources: []
  doctrine:
  personality_weights: {risk, greed, caution, loyalty, publicity, cooperation}
  goals: []
  schedule_blocks: []
  information_state:
  losses_and_injuries: []
  last_simulated_at:
  source_events: []
```

Trường `grade_or_unknown=UNKNOWN_SOURCE_DETAIL` không ngăn actor hành động bằng các cơ chế đã biết, nhưng cấm engine tự chọn Phẩm để đẩy họ vào top. Talent chỉ tác động đúng action/output mà contract mô tả; quân bị chết, lương thực thiếu, route xa hoặc actor đang làm nhiệm vụ khác đều làm giảm kết quả về sau.

## Phụ lục 3.K — Gói thế giới cố định `WORLD-PACKAGE-LL01-1.0`

> **Thẩm quyền:** sự thật Sora–Trevil và khung thế giới băng phong là `USER_LOCKED/CANON_WORLD + SOURCE_LOCKED <>`; yêu cầu dùng một map duy nhất, nồng độ rương cao quanh Lí Lan và cấm lệch thời đại là `USER_LOCKED`; tên, tọa độ và số mà `<>` không nêu là `SOURCE_ANALOGY/CAMPAIGN_FIXED`. Package là state tiền T0, không phải kết quả test. Không trường bắt buộc nào trong registry này được để trống.

### 3.K.1. Manifest, tọa độ và bất biến

<!-- LL01-MANIFEST-BEGIN -->
| Trường | Giá trị cố định |
|---|---|
| `package_id` | `WORLD-PACKAGE-LL01-1.0` |
| `campaign_map_seed` | `MAPSEED-LL01-CANON-0001`; nhãn nhận dạng, **không** phải nút reroll |
| `coordinate_system` | `LL01-LOCAL-KM`; origin tại tâm Lửa Sinh Tồn H0; `+X=Đông`, `+Y=Bắc`, `Z=m` so với mặt băng T0 |
| `active_local_map` | đĩa bán kính 96 km; macro anchor ngoài đĩa vẫn có tọa độ cùng hệ |
| `map_reroll/chest_reroll/quest_reroll` | `OFF/OFF/OFF` |
| `initial_knowledge` | H0 và vật trong tầm giác quan là `OBSERVED`; mọi site/chest/actor/quest khác là `STATE_UNOBSERVED`, không phải chưa tồn tại |
| `opening_opportunity_profile` | `HIGH`; áp một lần trước T0 từ yêu cầu user + LUK 9 + cộng hưởng cổ chiến trường; không chạy lại theo vị trí hiện tại |
| `fixed_counts` | 38 local/macro site; 10 P0 territory anchor; 192 Rương Báu tại 41 cache; 18 questline; 13 hero/key actor; 6 support actor/group row; 24 quest-item instance |
| `manifest_body_sha256` | `58ca95074c2b365937ae6c885c621cf86514a92cbbb69941be289848911e0d86` |
| `site_registry_sha256` | `3de8a5e3d8e30cdf3ff9f27a5db2d04d7a6c8f7ebc301c5d566f573284172c8b` |
| `chest_registry_sha256` | `c90c028d1839001ddb4447a5fbc6b29e1ffcbf3fc1c63af4fd850b0743b07b40` |
| `player_anchor_sha256` | `a3a29ea57be8d0a9492b7fb3940574aefc3283dcdc791ece57a54cc5f7ae5130` |
<!-- LL01-MANIFEST-END -->

`manifest_body_sha256` băm các hàng từ `package_id` tới `fixed_counts`, loại bốn hàng hash để tránh tự tham chiếu; ba hash còn lại băm nguyên bảng giữa marker tương ứng, UTF-8 và LF. Khi load/reload/branch, engine xác minh bốn hash. Sai một hash trả `WORLD_PACKAGE_VERSION_CORRUPT` và chặn T0; không chạy generator để “sửa”. Một event về sau được phép đổi owner, access, damage, discovery, depletion, population hoặc route state, nhưng không sửa tọa độ gốc/identity. Nếu địa hình bị phá vật lý, event ghi geometry delta trên site cũ thay vì tạo site thay thế.

### 3.K.2. Khóa thời đại `ERA-LL01-PREINDUSTRIAL-HIGH-MAGIC-1.0`

| Lớp | Được phép trên di tích/bản địa có sẵn | Bị cấm nếu không có neo trực tiếp mới từ `<>` |
|---|---|---|
| Kết cấu | đất đầm, hào đất, lũy gỗ, cọc gỗ, đá xếp khô, đá xây vữa, gạch nung, vòm cuốn, mái gỗ/ngói/đá phiến | bê tông đổ hoặc cốt thép, khung thép chịu lực, bunker/pillbox hiện đại, nhà chọc trời |
| Kim loại | đồng/đồng thiếc/sắt ở vũ khí, giáp, đinh, bản lề, khóa, đai cửa; thép phẩm cao ở vật nhỏ có contract | tường/boong-ke nguyên khối sắt, dầm thép đại trà, dây thép gai, container công nghiệp |
| Chiến tranh | cung, nỏ, lao, kiếm, khiên, máy bắn đá/nỏ lớn, thang, xe phá cổng, tín hiệu cờ–trống–tù và–lửa | súng, đại bác thuốc nổ, mìn hiện đại, xe tăng, động cơ đốt trong, radio, radar |
| Hạ tầng | đường đất/đá, cầu gỗ/đá, cống/vòm dẫn nước, giếng/bể chứa, xe kéo súc vật, bến sông | lưới điện, nhà máy, đường ống công nghiệp, ô tô, hàng không cơ giới, công nghiệp hàng loạt |
| Ma pháp | phù văn khắc đá/gỗ/kim loại, tinh thể, phong ấn, trận thức; mọi hiệu ứng phải có năng lượng, người dựng và giới hạn | dùng chữ “ma pháp” để đổi hình thể thành công nghệ hiện đại không có trong nguồn |

Sora và Trevil đã đánh một cuộc chiến cực lớn; **quy mô chiến tranh không phải bằng chứng tiến bộ công nghệ**. “Hầm” trong campaign này chỉ là hốc đào, kho vòm đá hoặc địa cung; renderer không dùng “bunker”. Bản Vẽ Đường Ray do Hệ Thống mở về sau trong `<>` vẫn được giữ ở File 04 vì đó là neo nguồn riêng, nhưng tuyệt đối không chứng minh Sora/Trevil hoặc cư dân bản địa đã có đường ray trước T0.

### 3.K.3. Vành địa lý và trường rương cố định

| Cell | Phạm vi từ H0 | Diện tích km² | Nồng độ | Mộc | Thanh Đồng | Bạch Ngân | Hoàng Kim | Hạo Nguyệt | Tổng | Trạng thái T0 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `LL01-R0` | `0<r≤3 km` | 28,274 | 5 — điểm tụ khai cuộc | 25 | 4 | 1 | 0 | 0 | **30** | `STATE_UNOBSERVED`; mật độ thật 1,061/km² |
| `LL01-R1` | `3<r≤10 km` | 285,885 | 4 — cao | 17 | 5 | 2 | 0 | 0 | **24** | `STATE_UNOBSERVED` |
| `LL01-R2` | `10<r≤25 km` | 1.649,336 | 3 — trung bình | 14 | 5 | 2 | 0 | 0 | **21** | `STATE_UNOBSERVED` |
| `LL01-R3` | `25<r≤60 km` | 9.346,238 | 2 — thấp | 9 | 3 | 2 | 1 | 0 | **15** | `STATE_UNOBSERVED` |
| `LL01-R4` | `60<r≤96 km` | 17.643,184 | 1 tại đất hoang; trường cục bộ P0 đã niêm riêng | 74 | 20 | 4 | 3 | 1 | **102** | `STATE_UNOBSERVED` |
| **Đối soát** | active map | 28.952,917 | — | **139** | **37** | **11** | **4** | **1** | **192** | không respawn, không bù |

Trong 3 km quanh Lí Lan có đúng 30 rương; đây là phần “luck high” đã chốt trước play. Từ T0 trở đi LUK chỉ giúp những phép đã định nghĩa khác và không kéo rương lại gần, đổi Phẩm, đổi loot hoặc làm rương mới xuất hiện.

### 3.K.4. Site registry cố định

<!-- LL01-SITES-BEGIN -->
| `site_id` | Tên nội bộ | `(X;Y;Z)` | Hình thể/vật liệu đúng thời đại | Access gate tại T0 | Nội dung cố định |
|---|---|---:|---|---|---|
| `SITE-LL01-000` | H0 — Điểm Neo Lí Lan | `(0,000;0,000;0)` | Lửa Trại Hệ Thống trên nền băng | mở | origin; không phải phế tích cổ |
| `SITE-LL01-001` | Nhà Lãnh Chúa Hư Hại | `(0,040;0,020;0)` | nền đá, khung gỗ sập; contract nguồn | mở | tu sửa `10 Đá + 20 Gỗ` |
| `SITE-LL01-002` | Hòm Vật Tư Lãnh Địa | `(0,030;-0,010;0)` | hòm kho Hệ Thống | mở khi Lí Lan chạm/mở | kho 40 ngăn; **không** là Rương Báu |
| `SITE-LL01-003` | Ngôi Mộ Bậc 1 | `(-0,020;0,030;-2)` | đá đen khắc rune, cửa vòm thấp | mở | công trình binh chủng cá nhân |
| `SITE-LL01-010` | Hào Nông Sora | `(-0,420;0,350;-1)` | hào đất, cọc thông, tấm khiên mục | khảo sát T1 | `QUEST-LL01-01`; corpse cluster Sora nông |
| `SITE-LL01-011` | Hố Lao Trevil | `(0,680;0,210;-1)` | đất nện, đá xếp, lao gỗ/đầu sắt | khảo sát T1 | `QUEST-LL01-02`; corpse cluster Trevil nông |
| `SITE-LL01-012` | Khe Xe Gãy | `(1,150;-0,780;-3)` | xe gỗ kéo thú, dây da, đai sắt | dây kéo + chống sập | cache hậu cần; dấu tuyến thương cổ |
| `SITE-LL01-013` | Miếu Dã Chiến Bạch Chung | `(-1,620;-0,940;-2)` | bệ đá, mái gỗ mục, chuông đồng | mở; trigger đêm | `QUEST-LL01-04`; không điện/loa |
| `SITE-LL01-014` | Gò Chiến Kỳ Sora | `(-2,350;1,200;-2)` | ụ đất–đá, cột cờ gỗ bọc đồng | khảo sát biểu tượng | quest item `QI-LL01-01` |
| `SITE-LL01-015` | Mộ Sừng Trevil | `(2,760;1,480;-3)` | cairn đá khô, sừng/xương, dây da | giải dấu tộc | quest item `QI-LL01-02` |
| `SITE-LL01-016` | Tháp Lửa Đá Khô | `(-4,800;3,600;12)` | tháp đá xếp, cầu thang gỗ, chậu lửa | T2; đường dốc | trạm tín hiệu Sora; `QUEST-LL01-10` |
| `SITE-LL01-017` | Cổng Lũy Đất Sora | `(-6,250;1,750;4)` | lũy đất, palisade gỗ, cửa gỗ bọc sắt | T2; dọn băng | tuyến phòng thủ, không bunker |
| `SITE-LL01-018` | Vòng Hội Sừng Trevil | `(5,900;4,250;6)` | vòng đá, cọc gỗ, da thú | T2; nghi thức tộc | manh mối Bản Đồ Bảy Lửa |
| `SITE-LL01-019` | Bể Ngầm Dưới Băng | `(-3,300;-5,450;-12)` | bể đá xây vữa, vòm gạch, máng gốm | T2; xả áp nước | `QUEST-LL01-03`; không ống thép |
| `SITE-LL01-020` | Thư Khố Vòm Sora | `(-8,700;6,300;-15)` | vòm đá/gạch, giá gỗ, bản đồng nhỏ | T3; chìa ấn Sora | `QUEST-LL01-05/11`; archive cố định |
| `SITE-LL01-021` | Cốt Đường Trevil | `(9,400;7,950;-17)` | đá khô, cột xương/sừng, vách da hóa cứng | T3; Bone Map | `QUEST-LL01-06/09` |
| `SITE-LL01-022` | Địa Cung Chỉ Huy Sora | `(-11,800;8,600;-28)` | phòng vòm đá, cửa gỗ sồi bọc sắt, bàn bản đồ đá | T4; hai nửa ấn | hero `HERO-LL01-06`; không bunker |
| `SITE-LL01-023` | Hang Thệ Ước Trevil | `(12,600;10,200;-26)` | hang đá gia cố gỗ, vòng oathstone | T4; đủ bảy dấu lửa | hero `HERO-LL01-07` |
| `SITE-LL01-024` | Tiền Sảnh Song Phong Ấn | `(0,800;12,400;-42)` | đá tạc, cửa đồng–sắt, rune đối xứng | T5; ba chứng cứ chiến tranh | ngã ba quest Sora/Trevil |
| `SITE-LL01-025` | Kho Băng Đen | `(-18,200;20,100;-61)` | basalt, băng đen, then đá/rune; không vỏ thép | T5; ba chìa cố định | `QUEST-LL01-07`; Rương Hoàng Kim quest-locked |
| `SITE-LL01-026` | Tĩnh Thất Thái Dương Sora | `(-13,900;15,600;-68)` | thạch thất tạc nguyên khối, rune vàng, cánh cửa đồng | T5 + Sun Seal | sinh mệnh Thần thoại `HERO-LL01-12` |
| `SITE-LL01-027` | Tĩnh Thất Nguyệt Sừng Trevil | `(14,200;16,100;-71)` | hang đá tạc, cột sừng hóa thạch, rune bạc | T5 + Moon-Horn Seal | sinh mệnh Thần thoại `HERO-LL01-13` |
| `SITE-LL01-028` | Đèo Song Vương Gục Ngã | `(0,400;25,800;18)` | đèo đá, lũy đất vỡ, hai đài cờ đá | T7; Twin Crown evidence | di cốt hai vua T7 Phẩm Lãnh chúa |
| `SITE-LL01-029` | Tâm Triều Tử Khí | `(0,000;31,400;-125)` | hang nứt tự nhiên + trận thức đá cổ | T8; Twin-Seal Key | final quest; không máy móc |
| `SITE-LL01-040` | Rừng Thông Tro Băng | `(4,700;-6,800;3)` | rừng tự nhiên, lều tiều phu gỗ hiện đại-bản địa | mở qua route | wood node `RES-LL01-01` |
| `SITE-LL01-041` | Mỏ Đá Vân Xám | `(-7,800;-4,700;10)` | quarry lộ thiên, nêm sắt, giàn gỗ | mở qua route | stone node `RES-LL01-02` |
| `SITE-LL01-042` | Bến Cạn Sông Kính | `(8,900;-11,200;-1)` | ford đá, cọc dẫn đường gỗ | route phụ thuộc băng | nước/đánh cá hữu hạn |
| `SITE-LL01-043` | Xóm Tùng Tro | `(11,400;-8,100;4)` | 14 nhà gỗ–đá, giếng vòm, hàng rào cọc | route 15,6 km | 46 cư dân; `QUEST-LL01-03` issuer |
| `SITE-LL01-044` | Làng Bắc Khẩu | `(21,000;-13,000;8)` | 71 nhà gỗ/đá, chợ mái ngói, tường đất thấp | route 28,1 km | 318 cư dân; polity Bạch Chung |
| `SITE-LL01-045` | Pháo Đài Quạ Tuyết | `(34,000;-5,000;37)` | keep đá, tường đá, cổng gỗ bọc sắt, tháp cung | route 39,2 km | 212 quân/dân đồn trú; không đại bác |
| `SITE-LL01-046` | Thị Trấn Cổng Krona | `(46,000;-23,000;12)` | tường đá–gỗ, 1.040 nóc, cầu đá | route 58,7 km | 4.860 cư dân; mint/market Krona địa phương |
| `SITE-LL01-047` | Thành Bạch Chung | `(79,000;-49,000;18)` | thành đá tiền công nghiệp, mái gỗ/ngói, cống vòm | route 108,5 km | 73.400 cư dân; trị sở biên hầu |
| `SITE-LL01-048` | Tu Viện Chuông Trắng | `(27,000;-19,000;24)` | tu viện đá, mái ngói, tháp chuông cơ khí tay | route 37,4 km | 61 tu sĩ/người phục vụ; `QUEST-LL01-04` |
| `SITE-LL01-049` | Cầu Thương Lộ Cũ | `(37,000;-18,000;2)` | ba nhịp đá, lan can gỗ | route 45,9 km | caravan checkpoint; `QUEST-LL01-08` |
| `SITE-LL01-050` | Mốc Biên Bạch Chung | `(15,000;-11,000;6)` | trụ đá khắc luật, chòi gỗ | route 21,0 km | ranh kiểm soát thực gần nhất |
| `SITE-LL01-051` | Suối Muối Xám | `(-16,000;-9,000;5)` | suối tự nhiên, máng gỗ, nồi đồng | route 21,6 km | salt node `RES-LL01-05` |
| `SITE-LL01-052` | Trạm Nghỉ Xe Kéo | `(32,000;-16,000;6)` | sân đất, chuồng gỗ, nhà trọ đá–gỗ | route 39,8 km | issuer caravan; không trạm nhiên liệu cơ giới |
| `SITE-LL01-060` | Vương Đô Varen | `(164,000;-183,000;31)` | thành lũy đá, cung điện đá–gỗ, đường lát đá | macro route 291 km | 286.000 cư dân; thủ đô chính thể hiện thời |
<!-- LL01-SITES-END -->

### 3.K.5. Rương Báu: 41 cache, 192 instance

`CACHE-LL01-01..32` dùng micro-offset cố định theo mét so với tọa độ cache: ordinal 1 `(0;0 m)`, ordinal 2 `(+6;+2 m)`, ordinal 3 `(-4;+5 m)`. Chín trường cục bộ quanh các anchor còn lại dùng `ANCHOR-OFFSET-15`, đơn vị km, theo ordinal: `1=(+0,40;+0,30)`, `2=(-0,70;+0,20)`, `3=(+1,10;-0,60)`, `4=(-1,30;-0,80)`, `5=(+2,00;+0,40)`, `6=(-2,20;+0,60)`, `7=(+0,50;+2,40)`, `8=(-0,60;-2,50)`, `9=(+1,80;+1,70)`, `10=(-1,90;+1,60)`, `11=(+2,50;-1,10)`, `12=(-2,40;-1,40)`, `13=(+0,15;-1,85)`, `14=(+1,45;+2,10)`, `15=(-1,55;+2,20)`. Một cache `33..41` có `N` instance thì dùng đúng `N` vector đầu; tọa độ tuyệt đối của từng rương bằng tọa độ cache cộng vector, không jitter và không random. Chuỗi Phẩm, kể cả ký pháp `×N`, khớp ordinal từ trái sang phải. Mỗi instance dùng ID liên tiếp đã nêu; `loot_commitment=SHA256("WORLD-PACKAGE-LL01-1.0"|chest_instance_id|"CHEST-LOOT-2.1")` được ghi trước T0 và chỉ mở payload khi rương được mở hợp lệ. Đây là commitment tất định, không phải roll mới lúc mở.

<!-- LL01-CHESTS-BEGIN -->
| Cache | Cell | Tọa độ cache `(X;Y)` | `chest_instance_id` | `grades` | Site/hazard/access cố định |
|---|---|---:|---|---|---|
| `CACHE-LL01-01` | R0 | `(-0,650;0,520)` | `CH-LL01-001..003` | Mộc/Mộc/Mộc | mép Hào Nông; băng mỏng |
| `CACHE-LL01-02` | R0 | `(0,850;0,400)` | `CH-LL01-004..006` | Mộc/Mộc/Mộc | đá vỡ Hố Lao; xương nhọn |
| `CACHE-LL01-03` | R0 | `(1,220;-0,880)` | `CH-LL01-007..009` | Mộc/Mộc/Mộc | Khe Xe Gãy; chống sập |
| `CACHE-LL01-04` | R0 | `(-1,450;-0,750)` | `CH-LL01-010..012` | Mộc/Mộc/Mộc | sau Miếu Dã Chiến; gió cắt |
| `CACHE-LL01-05` | R0 | `(-2,100;1,100)` | `CH-LL01-013..015` | Mộc/Mộc/Mộc | chân Gò Chiến Kỳ; băng sâu |
| `CACHE-LL01-06` | R0 | `(2,450;1,350)` | `CH-LL01-016..018` | Mộc/Mộc/Mộc | lối Mộ Sừng; dấu thú |
| `CACHE-LL01-07` | R0 | `(0,350;2,650)` | `CH-LL01-019..021` | Mộc/Mộc/Mộc | đồng băng mở; lộ gió |
| `CACHE-LL01-08` | R0 | `(-2,550;-0,950)` | `CH-LL01-022..024` | Mộc/Mộc/Thanh Đồng | hốc đá; cần nạy |
| `CACHE-LL01-09` | R0 | `(1,650;-2,250)` | `CH-LL01-025..027` | Mộc/Thanh Đồng/Thanh Đồng | khe tuyết; ice-burrower route |
| `CACHE-LL01-10` | R0 | `(-0,950;-2,550)` | `CH-LL01-028..030` | Mộc/Thanh Đồng/Bạch Ngân | hầm vòm đá nhỏ; seal T1 |
| `CACHE-LL01-11` | R1 | `(-4,800;3,600)` | `CH-LL01-031..033` | Mộc/Mộc/Mộc | Tháp Lửa; leo dốc |
| `CACHE-LL01-12` | R1 | `(-6,200;1,750)` | `CH-LL01-034..036` | Mộc/Mộc/Mộc | Cổng Lũy; gỗ sập |
| `CACHE-LL01-13` | R1 | `(5,900;4,250)` | `CH-LL01-037..039` | Mộc/Mộc/Mộc | Vòng Hội; taboo tộc |
| `CACHE-LL01-14` | R1 | `(-3,300;-5,450)` | `CH-LL01-040..042` | Mộc/Mộc/Mộc | Bể Ngầm; áp nước |
| `CACHE-LL01-15` | R1 | `(4,700;-6,800)` | `CH-LL01-043..045` | Mộc/Mộc/Mộc | Rừng Thông; thú canh |
| `CACHE-LL01-16` | R1 | `(-7,800;-4,700)` | `CH-LL01-046..048` | Mộc/Thanh Đồng/Thanh Đồng | Quarry; sạt đá |
| `CACHE-LL01-17` | R1 | `(8,100;-3,200)` | `CH-LL01-049..051` | Mộc/Thanh Đồng/Thanh Đồng | gờ băng; route hở |
| `CACHE-LL01-18` | R1 | `(7,200;6,600)` | `CH-LL01-052..054` | Thanh Đồng/Bạch Ngân/Bạch Ngân | khe rune Trevil; seal T2 |
| `CACHE-LL01-19` | R2 | `(11,400;-8,100)` | `CH-LL01-055..057` | Mộc/Mộc/Mộc | ngoài Xóm Tùng Tro; owner claim |
| `CACHE-LL01-20` | R2 | `(-8,700;6,300)` | `CH-LL01-058..060` | Mộc/Mộc/Mộc | Thư Khố; seal Sora |
| `CACHE-LL01-21` | R2 | `(9,400;7,950)` | `CH-LL01-061..063` | Mộc/Mộc/Mộc | Cốt Đường; death trace |
| `CACHE-LL01-22` | R2 | `(-11,800;8,600)` | `CH-LL01-064..066` | Mộc/Mộc/Mộc | Địa Cung; T4 guard |
| `CACHE-LL01-23` | R2 | `(12,600;10,200)` | `CH-LL01-067..069` | Mộc/Mộc/Thanh Đồng | Hang Thệ; oath gate |
| `CACHE-LL01-24` | R2 | `(0,800;12,400)` | `CH-LL01-070..072` | Thanh Đồng/Thanh Đồng/Thanh Đồng | Tiền Sảnh; Twin Seal |
| `CACHE-LL01-25` | R2 | `(-13,900;15,600)` | `CH-LL01-073..075` | Thanh Đồng/Bạch Ngân/Bạch Ngân | Tĩnh Thất Sora; T5 seal |
| `CACHE-LL01-26` | R3 | `(0,400;25,800)` | `CH-LL01-076..078` | Mộc/Mộc/Mộc | Đèo Song Vương; gió cực mạnh |
| `CACHE-LL01-27` | R3 | `(-18,200;20,100)` | `CH-LL01-079..081` | Mộc/Mộc/Mộc | Kho Băng Đen; key gate |
| `CACHE-LL01-28` | R3 | `(27,000;-19,000)` | `CH-LL01-082..084` | Mộc/Mộc/Mộc | đất Tu Viện; owner claim |
| `CACHE-LL01-29` | R3 | `(34,000;-5,000)` | `CH-LL01-085..087` | Thanh Đồng/Thanh Đồng/Thanh Đồng | ngoài Pháo Đài; quân gác |
| `CACHE-LL01-30` | R3 | `(46,000;-23,000)` | `CH-LL01-088..090` | Bạch Ngân/Bạch Ngân/Hoàng Kim | kho thuế cũ; luật địa phương |
| `CACHE-LL01-31` | R4 | `(14,000;82,000)` | `CH-LL01-091..093` | Mộc/Mộc/Mộc | đồng Mù Sương; navigation hazard |
| `CACHE-LL01-32` | R4 | `(79,000;-49,000)` | `CH-LL01-094..096` | Thanh Đồng/Hoàng Kim/Hạo Nguyệt | hầm kho vòm đá dưới Thành; sovereign owner + quest/event gate |
| `CACHE-LL01-33` | R4 | `(68,000;52,000)` | `CH-LL01-097..111` | Mộc×10/Thanh Đồng×3/Bạch Ngân/Hoàng Kim | trường cục bộ `ANCHOR-RC-002`; 15 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-34` | R4 | `(-71,000;38,000)` | `CH-LL01-112..123` | Mộc×9/Thanh Đồng×2/Bạch Ngân | trường cục bộ `ANCHOR-RC-003`; 12 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-35` | R4 | `(-58,000;-57,000)` | `CH-LL01-124..133` | Mộc×8/Thanh Đồng×2 | trường cục bộ `ANCHOR-RC-004`; 10 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-36` | R4 | `(62,000;-61,000)` | `CH-LL01-134..141` | Mộc×7/Thanh Đồng | trường cục bộ `ANCHOR-RC-005`; 8 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-37` | R4 | `(84,000;10,000)` | `CH-LL01-142..150` | Mộc×7/Thanh Đồng×2 | trường cục bộ `ANCHOR-RC-006`; 9 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-38` | R4 | `(-86,000;-8,000)` | `CH-LL01-151..163` | Mộc×9/Thanh Đồng×3/Bạch Ngân | trường cục bộ `ANCHOR-RC-007`; 13 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-39` | R4 | `(14,000;82,000)` | `CH-LL01-164..176` | Mộc×8/Thanh Đồng×3/Bạch Ngân/Hoàng Kim | trường cục bộ `ANCHOR-RC-008`; 13 vector đầu; khác object với `CACHE-31` |
| `CACHE-LL01-40` | R4 | `(42,000;-83,000)` | `CH-LL01-177..183` | Mộc×6/Thanh Đồng | trường cục bộ `ANCHOR-RC-009`; 7 vector đầu `ANCHOR-OFFSET-15` |
| `CACHE-LL01-41` | R4 | `(-35,000;76,000)` | `CH-LL01-184..192` | Mộc×7/Thanh Đồng×2 | trường cục bộ `ANCHOR-RC-010`; 9 vector đầu `ANCHOR-OFFSET-15` |
<!-- LL01-CHESTS-END -->

`CACHE-LL01-25` không phải Rương Hoàng Kim quest-locked trong `SITE-LL01-025`; đó là hai object khác ID. Rương quest-locked chỉ materialize reward bundle đã định nghĩa và không nằm trong 192 Rương Báu của field. Mở/đoạt/phá một instance cập nhật đúng ID; reload không phục hồi nó. Trường của RC-001 vẫn là lớn nhất theo mật độ và có đúng 30 rương trong 3 km; chín trường P0 khác có lần lượt `15/12/10/8/9/13/16/7/9` rương trong 3 km quanh anchor (RC-008 gồm `CACHE-31` và `CACHE-39`).

### 3.K.6. Mười anchor người chơi P0

<!-- LL01-ANCHORS-BEGIN -->
| Contender | `anchor_id` | Tọa độ `(X;Y)` km | Site profile | Khoảng cách thẳng tới H0 | Knowledge T0 của Lí Lan |
|---|---|---:|---|---:|---|
| `RC-001` | `ANCHOR-RC-001` | `(0;0)` | cổ chiến trường Sora–Trevil | 0,0 km | observed tại H0 |
| `RC-002` | `ANCHOR-RC-002` | `(68;52)` | bồn địa Kính Tuyết | 85,6 km | `STATE_UNOBSERVED` |
| `RC-003` | `ANCHOR-RC-003` | `(-71;38)` | tàn trấn Hắc Tuyết | 80,5 km | `STATE_UNOBSERVED` |
| `RC-004` | `ANCHOR-RC-004` | `(-58;-57)` | rừng Bạch Nha | 81,3 km | `STATE_UNOBSERVED` |
| `RC-005` | `ANCHOR-RC-005` | `(62;-61)` | lưu vực Băng Liệp | 87,0 km | `STATE_UNOBSERVED` |
| `RC-006` | `ANCHOR-RC-006` | `(84;10)` | sườn Thiết Hổ | 84,6 km | `STATE_UNOBSERVED` |
| `RC-007` | `ANCHOR-RC-007` | `(-86;-8)` | phế thôn Cột Khói | 86,4 km | `STATE_UNOBSERVED` |
| `RC-008` | `ANCHOR-RC-008` | `(14;82)` | đồng trắng Mù Sương | 83,2 km | `STATE_UNOBSERVED` |
| `RC-009` | `ANCHOR-RC-009` | `(42;-83)` | ngã ba Băng Lộ | 93,0 km | `STATE_UNOBSERVED` |
| `RC-010` | `ANCHOR-RC-010` | `(-35;76)` | khe Thánh Quang cũ | 83,7 km | `STATE_UNOBSERVED` |
<!-- LL01-ANCHORS-END -->

File 07 sở hữu identity/policy/talent; bảng này sở hữu tọa độ. Không có contender thứ mười một trong P0 và không dời actor để tạo encounter sớm.

### 3.K.7. Route, thế lực bản địa, tài nguyên và ecology đóng tại T0

| Registry | ID | Payload cố định tại T0 |
|---|---|---|
| Route | `ROUTE-LL01-01` | H0→Xóm Tùng Tro, 15,6 km; tuyết đồng + ford nhỏ; đi bộ nhẹ quang trời 4 giờ 29 phút |
| Route | `ROUTE-LL01-02` | Xóm Tùng Tro→Làng Bắc Khẩu, 12,5 km; đường đất/đá |
| Route | `ROUTE-LL01-03` | Làng→Tu Viện Chuông Trắng, 10,2 km; dốc đá |
| Route | `ROUTE-LL01-04` | Làng→Cầu Thương Lộ, 19,4 km; quan lộ đất nện |
| Route | `ROUTE-LL01-05` | Cầu→Thị Trấn Cổng Krona, 13,1 km; đường lát đá rời |
| Route | `ROUTE-LL01-06` | Thị Trấn→Thành Bạch Chung, 49,8 km; quan lộ |
| Route | `ROUTE-LL01-07` | H0→Mỏ Đá Vân Xám, 10,4 km; băng dốc |
| Route | `ROUTE-LL01-08` | H0→Rừng Thông Tro Băng, 9,2 km; tuyết rừng |
| Polity | `POLITY-LL01-VAREN` | Vương quốc Varen, quân chủ phong kiến tiền công nghiệp; Hầu địa Bạch Chung là biên tái; Krona vật lý được chấp nhận; `SOURCE_ANALOGY/CAMPAIGN_FIXED` |
| Proximity | `NATIVE-PROX-LL01` | xóm 14,0/15,6 km; làng 24,7/28,1 km; thị trấn 51,4/58,7 km; thành 92,9/108,5 km; pháo đài 34,4/39,2 km; biên kiểm soát 18,6/21,0 km; vương đô 245,7/291 km (thẳng/route) |
| Resource | `RES-LL01-01` | Rừng Thông: 780 đơn vị Gỗ trưởng thành có thể khai thác; tái sinh sinh học, không respawn tức thì |
| Resource | `RES-LL01-02` | Mỏ Vân Xám: 1.240 đơn vị Đá lộ thiên; hữu hạn |
| Resource | `RES-LL01-03` | Bến Sông Kính: 20.000 L nước/ngày ở trạng thái băng; cần đun/lọc theo hazard |
| Resource | `RES-LL01-04` | Vỉa Than Nâu tại `(-12,4;-6,8)`: 430 đơn vị đã khảo địa chất nội bộ; chưa được Lí Lan biết |
| Resource | `RES-LL01-05` | Suối Muối Xám: 14 đơn vị Muối/ngày khi có 2 lao động + nhiên liệu nấu; không tự vào kho |
| Ecology | `ECO-LL01-R0` | thỏ băng 38; cáo tuyết 6; hươu sương 9; sâu đào băng 3; không group nào tự tấn công H0 trong bảo hộ |
| Ecology | `ECO-LL01-R1` | thỏ băng 112; hươu sương 31; sói tuyết 9; quạ xác 43; sâu đào băng 8 |
| Ecology | `ECO-LL01-R2` | thỏ băng 286; hươu sương 74; sói tuyết 24; bò lông dài 19; quạ xác 91 |
| Ecology | `ECO-LL01-R3` | hươu sương 131; sói tuyết 48; bò lông dài 37; gấu hang băng 7; undead hoang không thuộc Sora/Trevil 29 |
| Ecology | `ECO-LL01-R4` | population aggregate khóa: thú ăn cỏ 1.420; predator 166; quái bản địa 94; từng encounter vẫn lấy group ID hữu hạn |

Các tên loài, số lượng present polity/settlement và route là phần `<>` im lặng nên mang `SOURCE_ANALOGY/CAMPAIGN_FIXED`, không giả là trích dẫn. Mọi birth/death/migration, khai thác, chiến tranh hay bridge damage sau T0 là event delta. Initial count không được tính lại từ adjective, LUK hoặc nhu cầu cảnh.

### 3.K.8. Cổng toàn vẹn

`WORLD-PACKAGE-LL01-1.0` chỉ PASS khi:

1. đúng 38 site row, 10 P0 anchor, 41 cache và 192 chest instance;
2. grade totals đúng `139/37/11/4/1`, mọi ID `CH-LL01-001..192` xuất hiện đúng một lần;
3. mọi structure cổ vượt `ERA-LL01-PREINDUSTRIAL-HIGH-MAGIC-1.0`; từ “war” không được dùng làm technology source;
4. mọi quest site/actor/item/reward ref ở File 05/04 tồn tại trước T0;
5. `STATE_UNOBSERVED` chỉ che thông tin; debug state vẫn có tọa độ/count/owner/hazard;
6. load lại cùng package cho cùng bốn hash, không tăng chest/site/quest count;
7. không có `UNKNOWN_RULE`, placeholder rỗng, `TBD`, fallback random hoặc “sinh khi khám phá”.

## Phụ lục 3.L — Extension tiền T0 `LL01-HERO-LAIR-PACK-1.0`

> **Thẩm quyền và ancestry:** đây là extension `USER_LOCKED + CAMPAIGN_FIXED` nối vào parent bất biến `WORLD-PACKAGE-LL01-1.0`. Parent là `FILE03-1.8.0-MERGE.1`, SHA-256 `ce48841a4afaf565da5d834f2a97bc580080ff81a30d62cdcd6822e06aa5d241`; bốn hash, 38 site, 10 P0 anchor, 41 cache và 192 rương của 3.K không bị viết lại. `<>` giữ quyền khống chế quy luật Hero/hang ổ và trục phát triển; tên, số, tọa độ, cấu trúc xã hội và ngưỡng chi tiết dưới đây là phép loại suy đã materialize vì nguồn không cho bảng định lượng hoàn chỉnh.

### 3.L.1. Manifest extension

| Trường | Giá trị niêm |
|---|---|
| `lair_pack_id` | `LL01-HERO-LAIR-PACK-1.0` |
| `parent_world_package` | `WORLD-PACKAGE-LL01-1.0` |
| `effective_from` | `T0`; tồn tại vật lý trước quan sát |
| `coordinate_system` | `LL01-LOCAL-KM`; cùng origin và trục với 3.K |
| `lair_count` | đúng `15`: `10` local trong `r≤96 km`, `5` macro trong `134,2≤r≤907,4 km` |
| `leader_hero_count` | đúng `15`; mọi `hero_id` unique, `AgencyFlag=1`, không thuộc Lí Lan |
| `member_identity_count` | đúng `693` unit ID đã tiền cấp phát; gồm 15 Hero |
| `site/chest/quest/player-anchor delta` | `0/0/0/0`; extension không đổi count parent |
| `map/lair reroll` | `OFF/OFF`; không jitter tọa độ, không thay loài hoặc đầu lĩnh khi reload |
| `initial_player_knowledge` | cả 15 là `UNOBSERVED`; discovery chỉ đổi knowledge state |
| `registry_rule` | `HERO-LAIR-SOCIETY-1.0`; finite population + species capability + deterministic schedule |
| `lair_registry_sha256` | `1a1c1b26cdb04ce2cebc69bdee5a46af34db4eb52cfa311497a12f172b73502f` |

Hash trên băm đúng mọi byte giữa `LL01-HERO-LAIRS-BEGIN/END`, không gồm hai marker. Hash mismatch trả `HERO_LAIR_PACK_CORRUPT/LOAD_FATAL`; resolver không được bỏ extension, dùng generator cũ hoặc sinh mười lăm hang khác.

### 3.L.2. Quy ước bảng

- Tên hang/đầu lĩnh là identity nội bộ; Lí Lan chỉ biết tên sau nguồn giao tiếp/điều tra hợp lệ.
- Khoảng cách là đường thẳng từ H0; route thực tế vẫn chịu terrain/weather.
- `C/K/U/I` lần lượt là bán kính `core/controlled/use/influence` theo km.
- Mọi tài nguyên ghi dưới là tài sản/nguồn sống hữu hạn do lair sử dụng hoặc tranh chấp, không phải Inventory của người chơi. Đoạt/khai thác cần route, lao động, combat/diplomacy và event debit thật.
- `Thường/Cựu binh/Tinh anh/Đầu lĩnh/Lãnh chúa` là Phẩm cohort, không phải stage xã hội.

<!-- LL01-HERO-LAIRS-BEGIN -->

### 3.L.3. Registry vị trí, Hero và hình thái

| `lair_id` | Tên nội bộ | `(X;Y;Z)` và `r` | Cell | Loài / trần xã hội | `leader_hero_id` · tên nội bộ | `society_form` · stage | Hình thể đúng thời đại |
|---|---|---:|---|---|---|---|---|
| `LAIR-LL01-01` | Hang Gió Gãy | `(6,600;-3,100;8 m)` · `7,3 km` | R1 | Sói tuyết / `PACK_OR_HERD` | `HERO-LAIR-LL01-01` · Huyền Nha | bầy săn lãnh vực · `2` | hai hốc đá tự nhiên, nền tuyết nện, cành thông kéo lót ổ |
| `LAIR-LL01-02` | Cụm Tùng Bạch Cốt | `(-3,600;8,200;31 m)` · `9,0 km` | R1 | Quạ xác / `PACK_OR_HERD` | `HERO-LAIR-LL01-02` · Mỏ Nhớ | rookery–mạng cảnh giới · `2` | tùng chết, tổ cành/xương, hốc cây; không nhà ở |
| `LAIR-LL01-03` | Mạng Hầm Muối Lạnh | `(-6,400;-6,900;-14 m)` · `9,4 km` | R1 | Sâu đào băng / `COLONY_OR_BROOD` | `HERO-LAIR-LL01-03` · Thạch Hàm | colony đường hầm · `3` | hốc đất–băng, trụ đất nện, nút rễ; không tường kim loại |
| `LAIR-LL01-04` | Vũng Chân Sói Sẫm | `(-14,800;10,600;22 m)` · `18,2 km` | R2 | Sói tuyết / `PACK_OR_HERD` | `HERO-LAIR-LL01-04` · Bạch Tích | bầy nhiều ổ phụ · `3` | ổ đất dưới gờ đá, ba bãi nghỉ; không settlement |
| `LAIR-LL01-05` | Cầu Mỏ Quạ Tro | `(18,600;-11,800;7 m)` · `22,0 km` | R2 | Quạ xác / `PACK_OR_HERD` | `HERO-LAIR-LL01-05` · Mắt Tro | rookery theo thương lộ · `2` | mố cầu đá cũ, cây trụi, tổ cành/da; không tháp thép |
| `LAIR-LL01-06` | Hang Lưng Đá | `(-31,000;-21,500;46 m)` · `37,7 km` | R3 | Gấu hang băng / `SOLITARY` | `HERO-LAIR-LL01-06` · Lưng Đá | hang đơn độc · `0` | hang đá, ổ lá khô, vết cào; **không follower/xã hội** |
| `LAIR-LL01-07` | Điện Chuông Gãy | `(40,200;29,000;-19 m)` · `49,6 km` | R3 | Undead hoang / `RITUAL_OR_RESONANT` | `HERO-LAIR-LL01-07` · Kỵ Sĩ Chuông Gãy | ossuary host có đội hình · `3` | địa thất vòm đá, bia đá, chuông đồng đúc tay vỡ; không bunker |
| `LAIR-LL01-08` | Mạch Tơ Thiết | `(-62,000;35,000;-48 m)` · `71,2 km` | R4 | Nhện quặng / `COLONY_OR_BROOD` | `HERO-LAIR-LL01-08` · Mẫu Chu Thiết Tơ | colony đa khoang · `4` | hang tự nhiên, tơ neo đá chứa sắt, hốc brood; không máy khai mỏ |
| `LAIR-LL01-09` | Trại Suối Cạn | `(57,000;-49,000;12 m)` · `75,2 km` | R4 | Goblin băng / `SAPIENT_CLAN` | `HERO-LAIR-LL01-09` · Rìu Nước Cạn | trại clan có phân vai · `3` | hào đất, cọc gỗ, lều da–gỗ, bếp đá, công cụ tay |
| `LAIR-LL01-10` | Vành Tinh Lam | `(82,000;31,000;58 m)` · `87,7 km` | R4 | Nguyên tố sương lam / `RITUAL_OR_RESONANT` | `HERO-LAIR-LL01-10` · Tâm Băng Lam | vòng cộng hưởng · `1` | tinh thể băng tự nhiên quanh khe đá; không nhà/kho/chợ |
| `LAIR-LL01-11` | Lòng Chảo Nanh Sương | `(118,000;64,000;18 m)` · `134,2 km` | M1 | Lợn rừng băng / `PACK_OR_HERD` | `HERO-LAIR-LL01-11` · Nanh Đóng Sương | đàn trú đông · `2` | lòng chảo, hố ủi tuyết, bãi bùn ấm tự nhiên |
| `LAIR-LL01-12` | Trại Cột Sừng Quạ | `(-168,000;112,000;44 m)` · `201,9 km` | M2 | Thú nhân Sừng Quạ / `SAPIENT_CLAN` | `HERO-LAIR-LL01-12` · Vu Chủ Hắc Giác | clanhold đa cụm · `4` | nhà gỗ–da, tường đá khô, cọc gỗ, cairn; thủ công tiền công nghiệp |
| `LAIR-LL01-13` | Khẩu Cầu Ba Nhịp | `(238,000;-154,000;-6 m)` · `283,5 km` | M3 | Troll cầu đá / `PAIR_OR_FAMILY` | `HERO-LAIR-LL01-13` · Lão Trụ Cầu | kinhold giữ lối · `2` | hốc đá dưới cầu xây vữa, cửa gỗ bọc sắt nhỏ, bếp than củi |
| `LAIR-LL01-14` | Thai Địa Tro Ấm | `(-452,000;-386,000;-33 m)` · `594,4 km` | M4 | Hỏa thằn tro / `COLONY_OR_BROOD` | `HERO-LAIR-LL01-14` · Mẫu Hỏa Thằn Tro | brood quanh địa nhiệt · `3` | ống dung nham nguội, hốc tro, bệ đá tự nhiên; không lò công nghiệp |
| `LAIR-LL01-15` | Hầm Muối Tinh Nham | `(781,000;462,000;-71 m)` · `907,4 km` | M5 | Kobold tinh nham / `SAPIENT_CLAN` | `HERO-LAIR-LL01-15` · Đục Muối Bảy Vết | warren đa khoang · `4` | đường hầm chống bằng gỗ, đá xây khô, đèn mỡ, cuốc tay đồng/sắt; không ray/động cơ |

### 3.L.4. Conservation ledger và Phẩm cohort tại T0

Mỗi row tiền cấp phát dải identity `UNIT-LAIR-LL01-<NN>-001…<member_count>`; các cohort liệt kê từ trái sang phải nhận unit ordinal liên tiếp và `group_id` chữ cái `GRP-LAIR-LL01-<NN>-A, B, C…`. Hero luôn là ordinal `001` và đồng thời mang `hero_id` ở 3.L.3. Ví dụ LAIR-01: `001=Huyền Nha`, `002..003=group B sói săn`, `004..007=group C trưởng thành`, `008..009=group D sói non`. Quy tắc này materialize đủ **693** ID mà không cần in 693 dòng cá thể; death/split/reassignment giữ nguyên unit ID.

| `lair_id` | Source population hữu hạn | Cohort đúng ID/Phẩm | Trong lair | Còn ngoài lair trong source row |
|---|---|---|---:|---:|
| `01` | `ECO-LL01-R1:sói_tuyết=9` | Hero Tinh anh ×1; sói săn Cựu binh ×2; trưởng thành Thường ×4; sói non Thường ×2 | **9** | **0** |
| `02` | `ECO-LL01-R1:quạ_xác=43` | Hero Tinh anh ×1; quạ cảnh giới Cựu binh ×4; trưởng thành Thường ×28; non Thường ×10 | **43** | **0** |
| `03` | `ECO-LL01-R1:sâu_đào_băng=8` | Hero Tinh anh ×1; hộ brood Cựu binh ×2; đào hầm Thường ×3; ấu thể Thường ×2 | **8** | **0** |
| `04` | `ECO-LL01-R2:sói_tuyết=24` | Hero Đầu lĩnh ×1; truy dấu Tinh anh ×2; trưởng thành Cựu binh ×4; trưởng thành Thường ×4; sói non Thường ×3 | **14** | **10** roaming |
| `05` | `ECO-LL01-R2:quạ_xác=91` | Hero Tinh anh ×1; quạ cảnh giới Cựu binh ×6; kiếm ăn Thường ×24; non Thường ×6 | **37** | **54** roaming |
| `06` | `ECO-LL01-R3:gấu_hang_băng=7` | Hero Đầu lĩnh ×1 | **1** | **6** độc lập |
| `07` | `ECO-LL01-R3:undead_hoang=29` | Hero Lãnh chúa ×1; graveguard Tinh anh ×3; walker Thường ×10; bone-gatherer Cựu binh ×4 | **18** | **11** roaming |
| `08` | `ECO-LL01-R4:quái_bản_địa=94` | Hero Lãnh chúa ×1; webguard Tinh anh ×4; đào hầm Thường ×18; săn Cựu binh ×10; brood Thường ×8 | **41** | aggregate R4 còn 53 sau L08 |
| `09` | `ECO-LL01-R4:quái_bản_địa=94` | Hero Đầu lĩnh ×1; chiến binh Cựu binh ×7; trinh sát Cựu binh ×4; hái lượm Thường ×12; thợ Cựu binh ×3; trẻ Thường ×5 | **32** | aggregate R4 còn 21 sau L08–09 |
| `10` | `ECO-LL01-R4:quái_bản_địa=94` | Hero Đầu lĩnh ×1; facet Tinh anh ×2; shard Cựu binh ×6 | **9** | **12** roaming sau `41+32+9=82` |
| `11` | `ECO-LL01-M1:lợn_rừng_băng=121` | Hero Đầu lĩnh ×1; nanh hộ Tinh anh ×6; trưởng thành Cựu binh ×21; trưởng thành Thường ×22; non Thường ×18 | **68** | **53** roaming |
| `12` | `POP-LL01-M2:thú_nhân_sừng_quạ=184` | Hero Lãnh chúa ×1; hộ thệ Tinh anh ×8; thợ săn Cựu binh ×34; chăn/thợ Thường ×47; dependent Thường ×36 | **126** | **58** du mục/độc lập |
| `13` | `POP-LL01-M3:troll_cầu_đá=31` | Hero Đầu lĩnh ×1; hộ cầu Tinh anh ×5; kiếm ăn Cựu binh ×7; non Thường ×4; trưởng lão Cựu binh ×3 | **20** | **11** độc lập |
| `14` | `ECO-LL01-M4:hỏa_thằn_tro=83` | Hero Lãnh chúa ×1; fireguard Tinh anh ×5; trưởng thành Cựu binh ×30; ấu thể Thường ×18 | **54** | **29** roaming |
| `15` | `POP-LL01-M5:kobold_tinh_nham=341` | Hero Lãnh chúa ×1; phó Đầu lĩnh ×4; cảnh giới Tinh anh ×24; đào/thợ Cựu binh ×83; hái lượm Thường ×41; trẻ Thường ×60 | **213** | **128** toán du hành/độc lập |

Đối soát bắt buộc: R1 debit `9/9 sói + 43/43 quạ + 8/8 sâu`; R2 debit `14/24 sói + 37/91 quạ`; R3 debit `1/7 gấu + 18/29 undead`; R4 debit `82/94 quái bản địa`. Việc gắn cá thể vào lair **không đổi** `population_true` của 3.K; chỉ materialize `active_groups`, vai trò và owner. Năm population macro M1–M5 là row mới của extension, không nằm trong tổng local R0–R4.

### 3.L.5. Lãnh vực, lịch hoạt động và nguồn lực

| `lair_id` | `C/K/U/I` km | Nhóm mobile và profile niêm | Nguồn lực/claim tại T0 | Biểu hiện biên giới đúng loài |
|---|---:|---|---|---|
| `01` | `0,30/1,10/3,20/4,50` | `UNIT-LAIR-LL01-01-001..003` (Hero + 2 sói săn); `P4 r1,10 θ20° step90 offset15` | tuyến hươu R1; hai hốc trú gió | mùi, vết cào thấp, điểm tru; không cọc mốc |
| `02` | `0,15/0,80/5,00/6,80` | `UNIT-LAIR-LL01-02-001..012` (Hero + 4 sentry + 7 trưởng thành); `F4 r5,00 θ35° step120 offset30` | corpse ledger thật + 31 cây tùng trú | lông đen, xương nhỏ, tiếng báo động trên cao |
| `03` | `0,25/0,90/2,10/3,00` | `UNIT-LAIR-LL01-03-001..003` (Hero + 2 hộ brood); `T4 r0,90 θ10° step180 offset45` | `LR-03`: rễ/brine **180 feed-unit** | lỗ thở băng, nút đất, rung nền; không biển báo |
| `04` | `0,55/1,80/5,60/7,50` | `UNIT-LAIR-LL01-04-001..005` (Hero + 2 truy dấu + 2 Cựu binh); `P4 r1,80 θ60° step120 offset0` | tuyến hươu R2; ba ổ phụ | chuỗi scent-post và bãi chân dày theo mùa |
| `05` | `0,20/1,20/8,00/10,00` | `UNIT-LAIR-LL01-05-001..010` (Hero + 6 sentry + 3 kiếm ăn); `F4 r8,00 θ5° step180 offset60` | `LR-05`: kho carrion **96 feed-unit** + thương lộ | cairn xương trên mố cầu, mobbing khi chạm core |
| `06` | `0,15/0,15/7,00/9,00` | `UNIT-LAIR-LL01-06-001` (Hero); `P4 r7,00 θ210° step360 offset90` | tuyến hươu R3 + hang khô | vết cào cao, phân, thân cây xước; không tuần tra tổ chức |
| `07` | `0,60/2,50/6,50/9,00` | `UNIT-LAIR-LL01-07-001..006` (Hero + 3 graveguard + 2 walker); `P4 r2,50 θ90° step180 offset120` | `LR-07`: **360 resonance-unit** tử khí hữu hạn | chuông vọng ngắt quãng, bia xoay, hàng dấu chân đều |
| `08` | `0,45/2,20/5,00/7,50` | `UNIT-LAIR-LL01-08-001..012` (Hero + 4 webguard + 7 đào hầm); `T4 r2,20 θ45° step240 offset75` | `LR-08`: **860 unit** đá mang quặng sắt | tơ xám ở khe, sỏi bị bọc, rung tơ; không hàng rào người |
| `09` | `0,55/2,00/5,50/7,00` | `UNIT-LAIR-LL01-09-009..012` (4 trinh sát); `P4 r2,00 θ135° step180 offset30` | `LR-09`: suối **8.000 L/ngày** + **310 Gỗ chết** | cairn thấp, dây xương rung, dấu sơn khoáng trên cây |
| `10` | `0,35/1,50/4,00/6,00` | `UNIT-LAIR-LL01-10-002..003` (2 facet); `O4 r1,50 θ0° step240 offset0` | `LR-10`: **420 resonance-unit** sương lam | băng ngân, tiếng cộng hưởng, kim băng quay về core |
| `11` | `1,20/3,80/15,00/21,00` | `UNIT-LAIR-LL01-11-001..018` (Hero + 6 nanh hộ + 11 trưởng thành); `H4 r15,00 θ25° step360 offset180` | `LR-11`: **1.480 feed-unit/mùa** củ lạnh | đất ủi, cây cọ bùn, tuyến móng; không công sự |
| `12` | `1,60/5,00/18,00/27,00` | `UNIT-LAIR-LL01-12-001..009` (Hero + 8 hộ thệ); `H4 r5,00 θ70° step360 offset240` | suối **32.000 L/ngày**, **920 Gỗ**, **410 food-unit** kho | cairn sừng, cờ da, đường tuần; luật tục truyền khẩu |
| `13` | `0,80/2,80/12,00/18,00` | `UNIT-LAIR-LL01-13-001..006` (Hero + 5 hộ cầu); `P4 r2,80 θ160° step240 offset45` | `LR-13`: đường cá **230 feed-unit/tuần** + quyền cầu tranh chấp | đá xếp cao, vết phấn, tiếng gõ trụ; không trạm thu phí hiện đại |
| `14` | `1,40/4,80/16,00/24,00` | `UNIT-LAIR-LL01-14-001..008` (Hero + 5 fireguard + 2 trưởng thành); `T4 r4,80 θ300° step360 offset120` | `LR-14`: **630 mineral-salt-unit** + địa nhiệt tự nhiên | cào tro, đá cháy bóng, mùi lưu huỳnh; không lò máy |
| `15` | `2,40/8,50/28,00/42,00` | `UNIT-LAIR-LL01-15-002..014` (4 phó + 9 sentry); `T4 r8,50 θ15° step360 offset300` | `LR-15`: **2.700 Muối đá + 900 Đất sét + 560 Gỗ** | cột đá khắc tay, bẫy dây, hốc quan sát; không ray/điện |

Mỗi profile dùng công thức §26.7; phần population không nằm trong nhóm mobile ở core/satellite room đã ghi. `step` là phút giữa node; `offset` ngăn mười lăm group đồng loạt rời ổ. Mất mobile group không tạo group thay thế: lair phải rút member thật khỏi core qua event `ROLE_REASSIGNMENT` nếu muốn lập patrol mới.

### 3.L.6. Chỉ số khởi đầu, đường phát triển và kế vị

| `lair_id` | `resource/shelter/cohesion/pressure` tại T0 | Transition niêm | Kế vị khi Hero chết |
|---|---:|---|---|
| `01` | `63/72/78/31` | population `≥14` + resource `≥60` đủ 14 ngày → tách ổ con stage 2; thiếu prey 3 ngày → co `use` 20% | hai sói trưởng thành tranh alpha sau 6 giờ; chưa phân định sau 24 giờ → pack fragments |
| `02` | `69/81/73/28` | population `≥60` + resource `≥65` đủ 21 ngày → satellite rookery | bốn sentry chọn một bearer ở bình minh kế; tie → hai wing tách thật |
| `03` | `66/84/82/24` | brood `≥12` + `LR-03≥120` đủ 14 ngày → đào chamber thứ năm | ngừng sinh sản; breeder trưởng thành nhất kế nhiệm sau 72 giờ, nếu không có → colony suy giảm |
| `04` | `71/76/88/42` | population `≥22` + resource `≥60` đủ 14 ngày → fission thành hai pack hữu hạn | đôi truy dấu thách đấu trong 12 giờ; thương vong tính thật |
| `05` | `58/70/75/49` | population `≥52` + resource `≥60` đủ 21 ngày → mở roost phụ; resource `<30` 3 ngày → migration boundary | sáu sentry lập mob-vote lúc bình minh; hòa kéo dài 24 giờ → split wing |
| `06` | `62/91/100/33` | không có social transition; resource `<25` → đổi tuyến săn, không sinh follower | `NONE_LAIR_VACANT`: Hero chết để lại corpse/history, hang trống |
| `07` | `74/87/79/36` | resonance `≥70` + member `≥24` đủ 7 ngày → vòng guard thứ hai; neo `<20` → formation sụp stage 1 | ba graveguard giữ neo rồi strongest intact death-seal kế sau 24 giờ; neo vỡ → host phân tán |
| `08` | `77/92/91/27` | member `≥48` + quặng `≥600` + cohesion `≥85` đủ 21 ngày → satellite chamber | breeder caste đóng core 7 ngày; không breeder sống → brood không sinh và colony co lại |
| `09` | `61/68/83/44` | population `≥48` + water `≥65` + cohesion `≥75` đủ 14 ngày → vòng cọc thứ hai, stage 4 | hội đồng ba thợ/chiến binh tổ chức thử sức lúc hoàng hôn kế; loser vẫn giữ ID/trạng thái |
| `10` | `72/95/86/21` | resonance `≥80` + member `≥12` đủ 28 ngày → tách hai vòng cộng hưởng, không thành settlement | hai facet hợp nhất quanh mảnh lõi còn nguyên trong 6 giờ; cả hai mất → shards ngủ tĩnh |
| `11` | `67/74/80/39` | herd `≥95` + resource `≥65` qua 2 mùa → tách đàn | sáu nanh hộ cạnh tranh bằng va chạm tại bình minh; chấn thương tính thật |
| `12` | `76/81/88/35` | population `≥160` + kho `≥70` đủ 28 ngày → trại mùa thứ hai | hội trưởng lão 3 ngày theo luật tục; tranh chấp chưa xong làm cohesion giảm 20 |
| `13` | `55/83/72/48` | kin `≥28` + route-yield `≥60` đủ 21 ngày → hốc cầu thứ hai | kin-vote + thử giữ trụ vào trưa kế; không ứng viên → family rời cầu theo hai nhóm |
| `14` | `81/90/92/22` | brood `≥72` + mineral `≥65` đủ 28 ngày → nursery vent mới | cá thể cái trưởng thành nhất vào metamorphosis 10 ngày; core do fireguard giữ tạm |
| `15` | `84/88/94/29` | population `≥260` + salt `≥65` + shelter `≥75` đủ 28 ngày → satellite warren | bốn phó hội nghị 48 giờ; hòa 2–2 → warren tách owner/territory bằng event |

Các chỉ số là baseline T0, không phải buff cố định. Mỗi debit tài nguyên, mùa, thương vong, sinh nở, xâm nhập hoặc ngoại giao cập nhật đúng row. Lair không “level up” theo Cấp của Lí Lan, Bảng Xếp Hạng hay nhu cầu cốt truyện.

### 3.L.7. Neo tương tác và fog-of-war

| Lair | Neo có thể tạo tiếp xúc nhưng không ép encounter |
|---|---|
| `01–03` | rìa R1: dấu săn, tiếng quạ, lỗ thở; mọi mobile route gần nhất vẫn nằm ngoài R0 tại T0 |
| `04–05` | cạnh tranh prey/carrion và áp lực lên tuyến xóm–làng; actor bản địa có thể biết dấu chứ không biết full registry |
| `06–07` | vùng R3: một Hero đơn độc đối chiếu trực tiếp với một host nghi lễ có tổ chức |
| `08–10` | ba mô hình R4 dùng cùng aggregate quái nhưng khác colony/clan/resonance; gần các P0 khác chỉ tạo quan hệ địa lý, không cấp họ knowledge miễn phí |
| `11–15` | calibration macro cho herd, clanhold, kinhold, brood và warren; mô phỏng theo ngày/tuần cho tới khi contact/war/migration làm cần chi tiết hơn |

Toàn bộ 15 row bắt đầu `UNOBSERVED`. Search không trúng chỉ tạo negative evidence trong polygon đã quét; nó không xóa lair ngoài polygon. Gặp mobile group chỉ đổi đúng lair sang `SIGNS_ONLY` hoặc `CONTACTED_PERIPHERY` theo bằng chứng. Tên Hero, member count, resource, succession và core coordinate vẫn kín cho tới khi được xác minh trong thế giới.

<!-- LL01-HERO-LAIRS-END -->

### 3.L.8. Cổng toàn vẹn extension

`LL01-HERO-LAIR-PACK-1.0` chỉ PASS khi:

1. có đúng 15 `lair_id`, 15 `leader_hero_id` và 693 `unit_id` duy nhất; đúng 10 local + 5 macro;
2. mọi tọa độ, stage, social capability, cohort, resource, territory, activity, transition và succession có giá trị explicit;
3. tổng cohort khớp member count; debit R1–R4 khớp đúng đối soát, không đổi population parent và không đụng R0;
4. Hero profile tương ứng tồn tại ở File 04 §18.9; Hero influence không nâng Phẩm follower hoặc mint population;
5. mọi hình thể vượt `ERA-LL01-PREINDUSTRIAL-HIGH-MAGIC-1.0`; không bunker, concrete, structural steel, rail, engine, electricity, radio hoặc factory;
6. scheduler File 05 nạp đúng hash, chạy route/resource/succession deterministic và giữ fog-of-war;
7. reload/branch cho cùng pack và event ledger tạo cùng group position/state; không spawn-on-discovery, respawn, jitter hoặc random succession;
8. parent `WORLD-PACKAGE-LL01-1.0` vẫn vượt toàn bộ 3.K.8 với bốn hash cũ.
