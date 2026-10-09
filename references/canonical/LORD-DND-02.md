# LORD DND 02 — THIÊN PHÚ, THUỘC TÍNH VÀ TIẾN TRÌNH


> **Phạm vi bản 1.14.0 — 2026-08-26.** Đây là bộ quy tắc nền để viết truyện/campaign Lord DnD. Cốt truyện, nhịp phát triển thế giới và chuỗi đại sự kiện **không để trống**: chúng lấy tác phẩm gốc được đặt trong dấu `<>`, hiện là **Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa**, làm canon khung. Thiết lập riêng của Lí Lan và thiên phú `Tử Phục Linh Sư` được khóa tại File 06; tên trong ví dụ vẫn chỉ là nhãn chức năng có thể thay thế. Bản 1.14.0 giữ toàn bộ progression, catalog 198 kỹ năng và world package cố định, đồng thời bổ sung `OWNER-XP-MIRROR-HOOK-1.0`: XP thường được quyết toán cho từng cá thể trước, rồi chỉ hợp đồng độc quyền của Lí Lan mới được tạo giao dịch XP phản chiếu từ tử thi do chính cô Tử Phục.
>
> **Thứ tự ưu tiên nguồn thiết kế:** `<>` là nguồn khống chế đối với cốt truyện, tiến trình thế giới, đại sự kiện và cơ chế cốt lõi. Truyện lãnh chúa khác và game RTS/4X/city-survival chỉ là nguồn phụ để lấp phần `<>` không nói rõ, tạo công thức và hoàn thiện logic; nguồn phụ không được ghi đè hướng cốt truyện gốc. Tất cả công thức định lượng trong bộ file này là mô hình tổng hợp mới, không phải số liệu sao chép từ tác phẩm nguồn.

> **Phân loại hằng số:** trừ mục được gắn `SOURCE_LOCKED`/`USER_LOCKED`, mọi bảng XP, tăng trưởng, xác suất, coefficient và 1.152 mục catalog là `DESIGN_DEFAULT` của phiên bản file; ví dụ là `EXAMPLE_ONLY`. Chỉ event có ID/seed/source mới biến kết quả thành state campaign.


> File này chứa **1.152 thiên phú chuẩn hóa**: 16 lĩnh vực × 8 cơ chế × 9 cấp. Danh mục là “từ điển cân bằng”; canon `<>` quyết định thiên phú nào thật sự xuất hiện.

## Mục lục

1. Cách tách các loại cấp bậc
2. Chín thuộc tính gốc
3. Khởi tạo thuộc tính tự động theo thiên phú
4. Thuộc tính dẫn xuất và công thức tổng
5. Cộng dồn, soft-cap và thứ tự tính
6. Cấp nhân vật và XP
7. XP chiến đấu, hỗ trợ và phi chiến đấu
8. Thông thạo, kỹ năng và huấn luyện
9. Chức nghiệp, chuyển chức và đổi nhánh
10. Bậc cấu trúc, level, tư chất, đột phá và lên phẩm
11. Thiên phú: cấp, xác suất và ngân sách sức mạnh
12. Tám cơ chế thiên phú
13. Sinh ngẫu nhiên, reroll, pity và duy nhất
14. Xung đột, tiến hóa, suy thoái và counterplay
15. Quy trình tạo thiên phú mới
16. Danh mục 1.152 thiên phú
17. Phụ lục 2.A–2.L

---

## 1. Cách tách các loại cấp bậc

Không dùng một chữ “cấp” cho mọi thứ. Hệ thống có sáu trục độc lập:

| Trục | Trả lời câu hỏi | Ví dụ mã |
|---|---|---|
| Level | Cá nhân đã tích bao nhiêu XP? | Lv 1–100+ |
| Bậc cấu trúc sinh mệnh | Cơ thể/linh hồn đã mở được trần phát triển nào? | T0–T10 |
| Trần tư chất | Cá thể có thể tự nhiên mở cấu trúc tới đâu? | `T_cap` |
| Chức nghiệp | Nhân vật làm gì và học cây kỹ năng nào? | JOB-WAR-02 |
| Phẩm chiến đấu | Cùng level nhưng đơn vị đặc biệt đến đâu? | Thường → Lãnh chúa |
| Độ hiếm | Vật/thiên phú khó gặp đến đâu? | F → SSS |
| Thông thạo | Một kỹ năng được thực hành tốt đến đâu? | 0–1000 mastery |

Level không tự động cho chức nghiệp, phẩm chiến đấu hoặc độ hiếm. Bậc cao **không cấp sẵn level hoặc `LevelGrowth` của level chưa đạt**, nhưng mỗi Bậc cấu trúc từ Bậc 2 trở lên cho một lớp buff 10% theo §10.4. Một cá thể có cấu trúc `T4` vẫn có thể bắt đầu ở `Lv1`; nó có trần `Lv40`, bỏ qua các lần phá Bậc đã hoàn tất và nhận buff Bậc theo đúng `T_form`, song vẫn phải kiếm toàn bộ XP, tăng trưởng level, mastery và kỹ năng nghề. Một thợ rèn level thấp có thể có mastery rèn cao; một boss có phẩm cao nhưng vẫn cần XP; thiên phú SSS không miễn điều kiện kỹ năng và hậu cần.

Toàn bộ mã trong bảng, công thức và danh mục của File 02 là **ký hiệu nội bộ**. Khi tạo bảng nhân vật, bảng trạng thái, bảng thuộc tính, thông báo thăng cấp hoặc thẻ thiên phú hướng người chơi, bộ hiển thị đổi `T<n>` thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>`, grade trơ thành `Phẩm <grade>`, mã `H...` thành tên giai đoạn lãnh địa và `FireLevel=<n>` thành đúng tên hình thái Lửa Sinh Tồn cùng Cấp theo chuẩn ngôn ngữ §11–12; mọi số/phẩm đã biết phải được giữ lại. Toàn bộ nhãn cơ chế dùng tiếng Việt/Hán Việt và khối thông tin phải thuộc điều một nhân vật đang nhìn, đọc hoặc nghe. Chỉ yêu cầu `raw stats` hoặc `debug view` mới được in nguyên các mã bị ẩn.

## 2. Chín thuộc tính gốc

| Mã | Thuộc tính | Bao quát | Không bao quát |
|---|---|---|---|
| STR | Lực | sức cơ, tải, cận chiến, phá vật | độ bền dài hạn |
| VIT | Thể | HP, phục hồi, độc/bệnh, chịu tải | ý chí tinh thần |
| DEX | Khéo | phối hợp, tốc thao tác, chính xác | cảm giác nguy hiểm |
| INT | Trí | học, phân tích, cấu trúc phép/công nghệ | kinh nghiệm sống tự động |
| SPI | Linh | mana, tương tác linh hồn/nguyên tố | đạo đức hay niềm tin |
| WIL | Ý | tập trung, chịu sợ hãi, duy trì kỹ năng | sức hút xã hội |
| PER | Cảm | quan sát, trực giác, dấu vết, tầm xa | toàn tri |
| PRE | Hiện diện | thuyết phục, lãnh đạo, đe dọa, biểu đạt | điều khiển tâm trí |
| LUK | Vận | chọn nhánh seed trong khoảng cho phép | sửa lịch sử hoặc bảo đảm thành công |

Người trưởng thành bình thường có tâm 10 trên mỗi trục. 1–3 là suy yếu nặng; 4–7 dưới chuẩn; 8–12 phổ thông; 13–16 được huấn luyện/thiên bẩm; 17–20 đỉnh phàm; trên 20 thường cần bậc sinh mệnh, vật phẩm hoặc biến đổi.

`WORLD-PACKAGE-LL01-1.0` không đổi thang trên: Lí Lan vẫn có `LUK=9`. Theo quyết định trực tiếp của `{{user}}`, compiler của đúng package này gắn `opening_opportunity_profile=HIGH` và dùng LUK cùng cộng hưởng cổ chiến trường **một lần trước T0** để chọn phương án có nồng độ rương rất cao trong vành 3 km. Đây là `USER_LOCKED/CAMPAIGN_FIXED`, không phải buff thuộc tính, không áp lại khi cô di chuyển, không sửa loot và không cho reroll sau quan sát.

## 3. Khởi tạo thuộc tính tự động theo thiên phú

> **Quy tắc `AWAKENED-AUTO-ATTR-1.0` — `USER_LOCKED + DESIGN_DEFAULT`.** Áp dụng như nhau cho **mọi người chơi** lúc thiên phú thức tỉnh tại `T0`; không roll, không point-buy và không để người chơi tự phân điểm khởi đầu. Thiên phú quyết định hình dạng véc-tơ, còn tổng ngân sách giữ công bằng.

### 3.1. Ngân sách và mẫu số nguyên

Mọi người chơi nhân loại trong đợt đồng khởi dùng tổng `B=90`, không phân biệt tuổi, giới, chiều cao hay vóc dáng; thương tích/bệnh hiện hữu là status riêng và không được âm thầm viết lại véc-tơ. Mỗi trục nhận sàn 8; mười tám điểm còn lại được phân theo lĩnh vực chính của thiên phú thành mẫu số nguyên:

| Nhóm trục | Điểm | Số trục |
|---|---:|---:|
| Thuộc tính gần thứ nhất của lĩnh vực | 18 | 1 |
| Thuộc tính gần thứ hai | 13 | 1 |
| Ba trục hỗ trợ đã khóa trong bảng §3.2 | 9 | 3 |
| Bốn trục còn lại | 8 | 4 |

Tổng luôn bằng `18+13+3×9+4×8=90`. Cấp thiên phú F–SSS **không** cộng thêm điểm tại `Lv1`; cấp ấy đi vào tăng trưởng mỗi lần lên Cấp theo §4.3. Một player không còn thuộc mẫu nhân loại chỉ dùng ngân sách khác khi species/conversion template đã khóa cả `B`, sàn từng trục và các delta bằng ID; nếu không có template hoàn chỉnh thì vẫn dùng `B=90`. Thương tật sau khởi tạo chỉ đi qua status/penalty có ID, không hồi tố phân bổ T0.

### 3.2. Ma trận lĩnh vực → trục hỗ trợ

Hai trục chính lấy trực tiếp từ §11.3; ba trục hỗ trợ dưới đây là khóa tất định, không gieo lại:

| Mã lĩnh vực | Chính | Nhì | Ba hỗ trợ |
|---|---|---|---|
| CONG | STR | DEX | VIT, PER, WIL |
| THU | VIT | WIL | STR, SPI, PRE |
| XA | DEX | PER | STR, WIL, LUK |
| PHAP | INT | SPI | WIL, PER, DEX |
| SINH | VIT | WIL | STR, SPI, PER |
| HOI | SPI | WIL | VIT, INT, PRE |
| TRINH | PER | DEX | INT, WIL, LUK |
| THUTHAP | STR | PER | VIT, DEX, WIL |
| CHETAO | INT | DEX | PER, WIL, LUK |
| XAY | STR | INT | VIT, DEX, WIL |
| NONG | PER | WIL | VIT, INT, SPI |
| HAU | INT | WIL | PER, PRE, VIT |
| KINH | INT | PRE | PER, WIL, LUK |
| QUAN | INT | PRE | WIL, PER, VIT |
| NGOAI | PRE | PER | WIL, INT, LUK |
| TRIEU | SPI | PRE | WIL, INT, LUK |

Thiên phú đa lĩnh vực dùng domain đứng đầu trên thẻ làm lĩnh vực chính. Nếu hai domain có cùng độ ưu tiên, `talent_id` khóa thứ tự; mở lại giao diện không đổi kết quả. Nền tảng đời cũ tạo kỹ năng/mastery khởi điểm có kiểm chứng, không sửa véc-tơ thuộc tính này.

### 3.3. Kết quả khởi đầu của Lí Lan

`Tử Phục Linh Sư` có domain chính `TRIEU`, nên tại `Lv1` Lí Lan nhận:

| STR | VIT | DEX | INT | SPI | WIL | PER | PRE | LUK | Tổng |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 8 | 8 | 9 | 18 | 9 | 8 | 13 | 9 | 90 |

Đây là `USER_LOCKED` về phương thức và `DERIVED` từ ma trận, không phải một roll. Vóc dáng mảnh không tự tạo bệnh hoặc trừ Thể nếu hồ sơ y khoa không có dữ kiện ấy.

### 3.4. Biến thể ngoài canon

Roll hoặc point-buy chỉ được dùng trong một campaign khác có cờ `NONCANON_ATTRIBUTE_VARIANT=1`. Campaign Lí Lan và mọi người chơi cùng đợt đồng khởi không bật cờ này.

## 4. Thuộc tính dẫn xuất và công thức tổng

### 4.1. Giá trị cơ sở

| Chỉ số | Công thức trước bậc và trang bị |
|---|---|
| HP | 40 + 12VIT + 3STR |
| Thể lực | 30 + 7VIT + 6WIL |
| Mana | 20 + 10SPI + 4INT |
| Tải an toàn (kg) | 8 + 3STR + VIT |
| Công vật lý | `1,5STR + 0,4DEX + WeaponBase` |
| Công phép | `1,2INT + 0,9SPI + FocusBase` |
| Chính xác | `8DEX + 4PER + SkillAccuracy` |
| Né tránh | `max(0,6DEX + 3PER + MovementBonus − LoadPenalty)` |
| Kháng tinh thần | 7WIL + 3SPI |
| Năng lực học | 5INT + 3PER + 2WIL |
| Ảnh hưởng xã hội | `6PRE + 2PER + ContextReputation` |

### 4.1A. Hồ Mana và hồi Mana mỗi giây `MANA-RECOVERY-1.0`

> **Trạng thái: `DESIGN_DEFAULT`, owner File 02.** Mọi actor có `ManaAccess=1` phải materialize đủ `ManaMax`, `ManaCurrent`, `last_mana_settled_at`, `activity_mode`, `continuous_drain_per_second` và danh sách modifier đang hoạt động. Có quyền dùng Mana nhưng thiếu một trường bắt buộc là `INVALID_MANA_POOL`; thiếu/không nhận diện được activity trong một khoảng là `INVALID_MANA_SEGMENT`. Hành động Mana và đoạn thời gian phụ thuộc actor đó bị chặn, không coi Mana bằng 0 và không đợi `{{user}}` tự nhắc hồi. `ManaAccess=0` là zero-case hợp lệ: actor không có hồ, không hồi và không thể trả cost Mana.

Gọi `SPI_s/WIL_s/INT_s` là ba giá trị **Sheet hiện hành** sau buff Bậc và mọi thay đổi thuộc tính đã commit. Tốc độ nền là:

\[
ManaRegenBase=\max\left(0,\frac{2SPI_s+WIL_s+INT_s}{120}\right)\quad\text{Mana/giây}
\]

Không nhân thêm `TierMult`: ba chỉ số Sheet đã chứa buff Bậc đúng một lần. Mỗi đoạn thời gian dùng đúng một `ActivityMult` đã được suy từ action/schedule ledger:

| `activity_mode` | `ActivityMult` | Phạm vi |
|---|---:|---|
| `COMBAT_OR_ACTIVE_CHANNEL` | 0,25 | đang giao chiến hoặc chủ động dẫn phép/duy trì thao tác ma lực |
| `STRENUOUS_WORK_OR_TRAVEL` | 0,50 | lao động nặng, chạy, leo, hành quân gấp |
| `NORMAL_AWAKE` | 1,00 | tỉnh táo, đi lại/làm việc nhẹ, không giao chiến |
| `REST_MEDITATE_OR_SLEEP` | 1,50 | nghỉ, ngủ hoặc nhập định ổn định và không có hành động nặng |

Nếu nhiều nhãn cùng đúng, dùng thứ tự nghiêm ngặt `COMBAT_OR_ACTIVE_CHANNEL > STRENUOUS_WORK_OR_TRAVEL > NORMAL_AWAKE > REST_MEDITATE_OR_SLEEP`; chế độ trước boundary tính tới boundary, chế độ mới chỉ áp sau đó.

Đặt `RegenMod=Clamp(0;3;∏m_k)`, trong đó mỗi `m_k≥0` phải đến từ trạng thái, supply, trang bị, kỹ năng hoặc hiệu ứng có ID; tập modifier rỗng có tích bằng `1`. Đặt `Drain≥0` là tổng Mana duy trì mỗi giây của các effect đang bật; không có effect duy trì thì `Drain=0`. Khi các đầu vào không đổi trong đoạn dài `Δt≥0` giây:

\[
ManaNetRate=ManaRegenBase\times ActivityMult\times RegenMod-Drain
\]

\[
Mana_{end}=Clamp(0;ManaMax;Mana_{start}+ManaNetRate\times\Delta t)
\]

Engine chia đoạn tại mọi mốc đổi activity, modifier, thuộc tính, `ManaMax`, bắt đầu/kết thúc upkeep, dùng kỹ năng hoặc chạm `0/ManaMax`. Tại một mốc dùng kỹ năng, thứ tự cố định là: quyết toán hồi/hao tới timestamp đó → kiểm tra cooldown/điều kiện → kiểm tra `ManaCurrent≥Cost` → trừ cost → resolve hiệu ứng. Thiếu Mana chỉ làm hành động thất bại với `INSUFFICIENT_MANA`; Mana không âm. Nếu upkeep làm hồ chạm 0, đoạn dừng đúng ETA đó và effect xử lý nhánh hết nhiên liệu của chính nó.

Hồi Mana là **thụ động bắt buộc** trong mọi `TimeAdvance`, kể cả khi `{{user}}` không nói tới Mana. Engine có thể quyết toán lười tại mốc hành động/query thay vì chạy từng tick một giây, nhưng phải cho cùng kết quả tích phân và luôn cập nhật `last_mana_settled_at`. Công thức từng segment dùng số đầy đủ; sau khi cộng segment cuối cùng, `ManaCurrent` mới được `RoundHalfUp` tới sáu chữ số thập phân để lưu. UI `RoundHalfUp` tới 0,1 Mana và không dùng số UI làm state vòng sau.

Ví dụ đóng cho Lí Lan tại Bậc 1: `SPI_s=18`, `WIL_s=9`, `INT_s=9`, nên `ManaMax=236` và `ManaRegenBase=(36+9+9)/120=0,45 Mana/giây`. Từ 236 Mana, dùng **Tử Khí Châm** còn 228; sau 3 giây giao chiến tự hồi `0,3375`, còn `228,3375` trước lần trừ cost kế tiếp. Nếu thay vào đó trôi 20 giây ở `NORMAL_AWAKE`, cô tự trở về cap 236; không cần lệnh “hồi Mana”.

### 4.2. Thuộc tính ở level L

\[
Raw_i(L)=Base_i+LevelGrowth_i+Training_i+GearFlat_i+TalentFlat_i
\]

\[
TierBonus_i(t)=Raw_i(t)\times\bigl(TierMult(T_{form}(t))-1\bigr)
\]

\[
Sheet_i=\left\lfloor\max\left(0,\bigl(Raw_i+TierBonus_i\bigr)\times(1+A_{net})+PostFlat_i\right)\right\rfloor
\]

`TierMult` lấy trực tiếp từ Bậc cấu trúc hiện có `T_form` theo §10.4, không lấy từ thuộc tính tại khoảnh khắc đột phá. `TierBonus_i` là giá trị **dẫn xuất**: mỗi khi `Raw_i`, `T_form` hoặc một nguồn thành phần thay đổi, engine phải tính lại nó trong cùng transaction; không ghi nó thành `Base`, `LevelGrowth`, `Training`, affix hay một delta vĩnh viễn. Vì vậy tại Bậc 2, `Raw_STR=10` cho buff 1 và `Raw_STR=20` cho buff 2 dù 20 đạt được sau đột phá. `A_net`, bảng nguồn phẳng, cap huấn luyện, các biến dẫn xuất và phép tính `Context_i` được đóng tại `STAT-STACK-1.1`, Phụ lục 2.I.4. `LevelGrowth_i` vẫn chỉ là tổng điểm từ những lần lên level thật; phẩm hoặc cấp thiên phú quyết định ngân sách, còn chức nghiệp quyết định hướng phân bổ.

### 4.3. Ngân sách thuộc tính mỗi level

Mỗi lần tăng từ `Lv(k−1)` lên `Lv(k)`, với `k≥2`, thực thể nhận một ngân sách tăng trưởng `G_level`. Tại `Lv1`, ngân sách tích lũy bằng 0.

\[
G_{level}(E)=
\begin{cases}
G_Q(Q),&E\text{ là binh lính/NPC/hero/summon}\\
G_{player,base}+G_T(Grade),&E\text{ là người chơi}
\end{cases}
\]

Trong đó `G_player,base=2,00`; bảng `G_Q` nằm ở §10.3 và bảng `G_T` nằm ở §11.1. Bộ chọn loại thực thể ngăn cộng chồng sai:

- binh lính, NPC, hero và summon dùng **phẩm hiện tại** làm nguồn tăng trưởng;
- người chơi dùng **nền người chơi + cấp thiên phú**, mặc định không cộng thêm một lần `G_Q` của binh chủng;
- một talent riêng vẫn có thể cho `TalentFlat_i` hoặc hiệu ứng khác nếu mô tả ghi rõ; phần ấy tách khỏi `G_T` phổ quát;
- talent của NPC/hero không tự nhận bảng tăng trưởng người chơi, trừ luật nguồn chỉ đích danh.

### 4.4. Phân bổ tự động theo hướng nghề nghiệp

Mỗi job hoặc chassis ghi hai trục có thứ tự: `PrimaryStat_1` và `PrimaryStat_2`. Với chín thuộc tính gốc, vector chuẩn là:

\[
w_i(J)=
\begin{cases}
11/20=55\%,&i=PrimaryStat_1\\
1/4=25\%,&i=PrimaryStat_2\\
1/35\approx2,857\%,&i\text{ thuộc bảy trục còn lại}
\end{cases}
\]

Tổng vector đúng bằng 100%. Điểm của một lần lên level được ghi:

\[
\Delta Growth_i(k)=G_{level}(E,k)\times w_i(J_k)
\]

`J_k` là nghề/nhánh thực sự đang hoạt động khi level `k` được nhận. Hướng mặc định của mười hai họ nghề:

| Họ nghề | Trục chính 55% | Trục nhì 25% |
|---|---|---|
| Chiến binh | STR | VIT |
| Hộ vệ | VIT | STR |
| Trinh sát | PER | DEX |
| Xạ thủ/cung thủ | DEX | PER |
| Pháp sư | INT | SPI |
| Tư tế/y sư | SPI | WIL |
| Kỹ sư | INT | DEX |
| Thợ chế tạo | DEX | INT |
| Nông–sinh học | PER | VIT |
| Thương nhân | PRE | INT |
| Quản trị | INT | PRE |
| Triệu hoán sư | SPI | PRE |

Nhánh hợp lệ có thể đổi hai trục, chẳng hạn cung thủ ma pháp dùng `DEX/SPI`; tỷ lệ `55/25/20` vẫn giữ để mọi nghề có chuyên môn rõ và bảy thuộc tính nền tiếp tục tăng chậm.

### 4.5. Ledger, số lẻ và thẻ nghề chưa kích hoạt

\[
LevelGrowth_i(L)=\sum_{k=2}^{L}\Delta Growth_i(k)
\]

Engine giữ phân số chính xác hoặc carry tối thiểu tới `0,001`, rồi chỉ làm tròn ở bước `Sheet_i`. Vì vậy điểm lẻ tích lũy thành điểm đầy đủ về sau và tổng ngân sách không hao hụt do làm tròn từng level.

- Trước khi Thẻ Chuyển Nghề đã niêm được kiểm tra/kích hoạt, ngân sách đi vào `PendingCareerGrowth`; nó chưa tạo thuộc tính sử dụng được.
- Khi thẻ được dùng, pool đang chờ tự giải theo vector của payload đã khóa và ghi event một lần. Người chơi quyết định thời điểm dùng thẻ, không chọn lại nghề trong payload.
- Đổi nhánh sau đó chỉ đổi `J_k` cho các level tương lai. Lịch sử nghề của level cũ được khóa để ngăn respec dồn toàn bộ tăng trưởng quá khứ sang một trục mới.
- Lên phẩm vĩnh viễn ở level cao gọi phép tái tính bù tại §10.9; buff phẩm tạm thời không tạo catch-up.

## 5. Cộng dồn, soft-cap và thứ tự tính

### 5.1. Năm bucket

1. FLAT: base, level growth đã tính từ phẩm/thiên phú, huấn luyện, trang bị phẳng, thiên phú phẳng.
2. ADD-A: bonus chức nghiệp + thiên phú cùng loại.
3. ADD-B: trạng thái chiến đấu, aura, địa hình.
4. MULT: tối đa ba nguồn độc lập có điều kiện; mỗi nguồn cap theo cấp.
5. POST: khiên, giảm phẳng, sát thương chuẩn có cap.

### 5.2. Soft-cap

Với tổng bonus thô `x≥0` và cap mềm `c>0`:

\[
Eff(x,c)=c(1-e^{-x/c})
\]

Ví dụ x=100%, c=60% cho hiệu dụng 48,7%, không phải 100%. Tooltip hiển thị cả hai.

### 5.3. Thứ tự

Base → flat → bậc → ADD-A hiệu dụng → ADD-B hiệu dụng → MULT có điều kiện → mitigation → post-flat → clamp → làm tròn. Proc không kích proc khác trừ khi mô tả ghi chain và chain depth tối đa 1.

## 6. Cấp nhân vật và XP

### 6.1. Cấp trong bậc

Level bắt đầu từ `Lv1` cho mọi cá thể đã được hệ thống hóa, kể cả sinh vật có cấu trúc bậc cao. Bậc cấu trúc `T_form` đặt **trần level đang mở**:

\[
L_{open}=10\times\max(1,T_{form})
\]

- `T0` là cấu trúc phàm/khuyết, vẫn có thể tăng từ `Lv1–10` nhưng dùng hệ số bậc thấp và phải thức tỉnh `T1` mới đi tiếp.
- `T1` mở tới `Lv10`; `T2` mở tới `Lv20`; ...; `T10` mở tới `Lv100`.
- Cá thể sinh ra hoặc được triệu hồi ở `T4, Lv1` phát triển từ `Lv1`; nó có thể đi thẳng tới `Lv40` mà không thử phá `T2–T4` lần nữa.
- Cá thể `T1, Lv10` phải nâng `T_form` lên `T2` trước khi nhận `Lv11`.

Vì thế `T_form` là **hạ tầng sinh mệnh đã mở**, còn level là **mức độ hạ tầng ấy đã được lấp đầy bằng XP, huấn luyện và thích nghi**.

### 6.2. XP cần cho level kế

\[
XP_{next}(L)=Round_{10}\left[100\times L^{1.65}\times S_{tier}\times J_{complexity}\right]
\]

`S_tier=1+0,18×floor((L−1)/10)`. `J_complexity` lấy đúng năm mức `0,90/1,00/1,05/1,10/1,15` tại Phụ lục 2.I; `Round_10` làm tròn nửa lên tới bội số 10 gần nhất.

### 6.3. XP tổng

\[
XP_{total}(L)=\sum_{k=1}^{L-1}XP_{next}(k)
\]

Không dùng XP âm. Khi chết/hạ bậc, mất tiến độ thông thạo hoặc điều kiện, không xóa lịch sử level trừ cơ chế đặc biệt đã có trong `<>` hoặc phần lấp canon tương thích.

### 6.4. Sổ XP cá thể và giao dịch lên Cấp bắt buộc

XP luôn thuộc về một `unit_id` hoặc `character_id` bất biến. Cohort chỉ là cách nhóm những cá thể đang hoàn toàn đồng nhất; nó không được phép xóa danh tính người nhận XP. Mọi sự kiện cấp XP phải tạo các dòng sau trước khi viết thông báo:

```yaml
xp_transaction:
  xp_transaction_id:
  event_id:
  rule_version:
  transaction_kind: NORMAL_AWARD | OWNER_XP_MIRROR
  source_encounter_id:
  source_xp_transaction_id:
  source_recipient_id:
  recipient_id:
  cohort_id_before:
  gross_xp:
  contribution_share:
  modifiers: {gap: 1.0, novelty: 1.0, risk: 1.0, anti_farm: 1.0}
  net_xp:
  level_before:
  xp_before:
  thresholds_crossed: []
  level_after:
  xp_after:
  xp_to_next:
  growth_delta: {}
  cohort_id_after:
```

Một cohort chỉ được giữ nguyên khi **mọi** thành viên nhận cùng lượng XP và sau giao dịch vẫn giống nhau về Cấp, XP hiện tại, Phẩm, Bậc, nghề, trang bị, thương tích, trạng thái và vị trí. Nếu một phần cohort nhận XP hoặc chỉ một phần vượt ngưỡng Cấp, giao dịch phải đồng thời:

1. khóa danh sách `unit_id` đủ điều kiện trước khi tính kết quả;
2. ghi từng dòng XP cá thể;
3. tách cohort cũ thành các cohort mới đồng nhất;
4. bảo toàn tổng số thành viên;
5. cập nhật roster File 04/File 06 và event ledger File 05 trong cùng transaction.

Nếu chọn người nhận ngẫu nhiên, `seed_id` và danh sách đủ điều kiện phải khóa trước khi lộ kết quả. Nếu chọn tất định, phải dùng quy tắc đã công bố trước như `unit_id` thấp nhất, XP hiện tại cao nhất hoặc đóng góp cao nhất; không được chọn hồi tố để tạo ra người lên Cấp thuận tiện cho cốt truyện.

Thông báo kiểu `05/13 tử thể Tinh anh lên Cấp` **không hợp lệ**. Bản hướng người chơi phải ghi chính xác năm `unit_id` nào lên Cấp, Cấp/XP trước → sau của từng cá thể, và tám cá thể còn lại đang nằm ở cohort nào. Nếu dữ liệu cũ không đủ xác định năm ID, trạng thái là `UNRESOLVED_XP_RECIPIENTS`; engine không được tự gán tên hoặc Cấp.

Một giao dịch có thể vượt nhiều ngưỡng Cấp. Engine trừ từng `XP_next` theo thứ tự, giữ XP dư, áp tăng trưởng từng Cấp một lần và ghi toàn bộ `thresholds_crossed`; không làm tròn XP giữa các bước.

`OWNER-XP-MIRROR-HOOK-1.0` không chuyển quyền sở hữu XP của unit. Engine luôn hoàn tất giao dịch `NORMAL_AWARD` của người nhận gốc trước; nếu và chỉ nếu file chuyên trách của một nhân vật khóa một hợp đồng phản chiếu có ID/version, engine mới tạo **giao dịch XP thứ hai** cho nhân vật ấy. Không có hợp đồng chuyên trách thì kết quả mặc định là 0; grade thiên phú, tag Triệu Hoán/Tử Linh hoặc quan hệ owner–summon tự thân không mở hook. Bản hiện hành chỉ bind hook này cho `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0` tại File 06.

## 7. XP chiến đấu, hỗ trợ và phi chiến đấu

### 7.1. XP mục tiêu

\[
XP_{base}=20\times EnemyLevel^{1.45}\times RankMult_{XP}
\]

`RankMult_XP`: thường 1,0; cựu binh 1,15; tinh anh 1,5; đầu lĩnh 2,2; thống soái 3,2; lãnh chúa 4,8; thần thoại 8,0. Namespace này chỉ dùng cho XP mục tiêu, không dùng hệ số phẩm của chiến lực hay chi phí Tử Khí.

### 7.2. Chênh level

\[
M_{gap}=Clamp(0.05,2.00,e^{0.085(EnemyLevel-PlayerLevel)})
\]

Mục tiêu thấp hơn nhiều gần như không cho XP; mục tiêu cao hơn cho thêm nhưng rủi ro và đóng góp vẫn được kiểm tra.

### 7.3. Chia đội

\[
Share_i=0.60/n+0.40\times Contribution_i/\sum Contribution
\]

Contribution gồm damage có ích, tank, heal thực, khống chế, phá cơ chế, trinh sát, hậu cần. Thành viên ngoài vùng hoặc không tham gia không nhận phần nền.

### 7.4. Chống farm

XP cuối = base × gap × share × novelty × risk × anti-farm. Novelty giảm còn 100/80/60/40/25% khi lặp cùng loại trong cửa 24 giờ; nhiệm vụ nghề có cap riêng. Không XP khi **mục tiêu bị farm** là summon của mình, đồng minh dàn xếp, mục tiêu không phản kháng bị tái tạo hoặc khi chỉ last-hit mà không đóng góp. Dòng chống farm này không cấm một hợp đồng hậu quyết toán phản chiếu XP hợp lệ; hook vẫn chỉ đọc `net_xp` đã vượt toàn bộ kiểm tra trên và không thể biến một award 0 XP thành XP dương.

### 7.5. Phi chiến đấu

Khám phá, chế tạo, xây dựng, y tế, quản trị, ngoại giao cho XP nếu có độ khó, kết quả và đối tượng thật. `NONCOMBAT-XP-1.0` tại Phụ lục 2.I.5 tính XP nghề và tỷ lệ chuyển chính xác theo độ phức tạp; mastery được tính riêng bằng §8.1, không đổi “phần XP còn lại” sang một đơn vị khác mà thiếu tỷ lệ. Không làm 1.000 món vô dụng để lên thần.

## 8. Thông thạo, kỹ năng và huấn luyện

### 8.1. Mastery

0–99 Nhập môn; 100–249 Có nghề; 250–449 Thành thạo; 450–649 Chuyên gia; 650–799 Đại sư; 800–899 Tông sư; 900–969 Truyền kỳ; 970–999 Cực hạn; 1000 Viên mãn của phiên bản kỹ năng.

Mastery gain:

\[
MG=Difficulty\times QualityOfPractice\times Feedback\times M_{novelty}
\times(1+TalentBonus)\times(1-ComfortPenalty)
\]

Luyện việc quá dễ giảm về 0. Có huấn luyện viên, phản hồi và áp lực phù hợp tăng chất lượng; lặp trong kiệt sức có thể tạo thói quen xấu.

### 8.2. Slot kỹ năng

Không giới hạn số kỹ năng đã biết. Loadout chủ động, trọng số slot, bonus nghề và thời gian thay được tính đúng bằng `SKILL-LOADOUT-2.0` tại Phụ lục 2.I.10; WIL/INT không còn là mô tả định tính và kỹ năng mastery cao chỉ nhẹ hơn theo các band đã khóa ở đó. Sáu kỹ năng Tuyệt kỹ có tải nền `48`, trong khi sáu kỹ năng Cơ bản chỉ có tải nền `6`; engine tuyệt đối không được đếm cả hai nhóm là “sáu slot”.

### 8.3. Kỹ năng hợp thành

Hai kỹ năng chỉ hợp thành nếu vượt các khóa `SKILL-FUSION-1.0` tại Phụ lục 2.I.10. Mastery mới dùng trung bình hai mastery nhân tỷ lệ Jaccard đóng trong `0,50..0,80`; tuyệt đối không cộng thẳng hai giá trị hoặc chọn phần trăm thuận lợi sau kết quả.

### 8.4. Sách kỹ năng do thành tựu Hệ Thống thưởng

Sách kỹ năng trong một slot thưởng **cá nhân hóa** của thành tựu không khóa cứng tên kỹ năng từng xuất hiện ở người nhận khác. Nó khóa bậc, lớp kỹ năng, ngân sách hiệu ứng và mục đích của slot, rồi dùng `ACHIEVEMENT-SKILL-FIT-1.0` tại Phụ lục 2.I.10A để chọn template phù hợp với chính người đạt mốc. Vì vậy một Kỵ Sĩ `NON_MANA` không thể nhận phép tiêu Mana chỉ vì Cao Tinh từng nhận sách phép; một Giáo Sĩ không nhận Thiên Thạch nếu cây nghề không cho phép; Lí Lan chỉ nhận ứng viên tương thích với Triệu Hoán/Tử Linh/Ám và tài nguyên thật của cô. Pool thật của nghề cố định `JOB-SUM-NECRO-01`, các hash niêm và binding Phẩm F của Nhà Lãnh Chúa nằm tại Phụ lục 2.K.1.

Nếu người đạt mốc chưa có nghề, reward trở thành sách niêm phong ràng buộc người nhận và chỉ phân giải một lần khi nghề được kích hoạt. Bậc yêu cầu, level yêu cầu hoặc mastery yêu cầu cao hơn hiện tại chỉ làm sách **chưa học được**, không cho phép hạ phẩm. Vật phẩm rơi hữu cơ, sách độc bản có lore và reward ghi `FIXED_TEMPLATE` là ngoại lệ: chúng giữ nguyên template vì bản thân vật phẩm là cố định, không phải slot thành tựu cá nhân hóa.

## 9. Chức nghiệp, chuyển chức và đổi nhánh

### 9.1. Mười hai họ nghề nền

Chiến binh; hộ vệ; trinh sát; xạ thủ; pháp sư; tư tế/y sư; kỹ sư; thợ chế tạo; nông–sinh học; thương nhân; quản trị; triệu hoán sư. Mỗi họ có nhánh chiến đấu và dân sự.

### 9.2. Cấu trúc job

Mỗi job định nghĩa: vai trò, hai primary stats có thứ tự, growth vector theo §4.4, skill tree, trang bị, tài nguyên, điều cấm, nghề tiền đề, thử thách chuyển, trần bậc và nhánh kế. Nghề nền còn phải khóa `core_resource_mode∈{MANA_REQUIRED,MANA_OPTIONAL,NON_MANA}`, danh sách `core_loop_actions` và `opening_skill_candidates`; schema và zero-case nằm tại `OPENING-MANA-SKILL-1.0`, Phụ lục 2.I.6. Vector tùy chỉnh phải chuẩn hóa về tổng 1 và ghi rõ vì sao khác chuẩn `55/25/20`; đổi nghề không viết lại `J_k` của level đã nhận.

### 9.3. Mốc chuyển chức

> **Quy tắc `CAREER-CARD-1.0` — `USER_LOCKED + DESIGN_DEFAULT`.** Mọi người chơi tới `T0` ở trạng thái **Vô chức** và nhận đúng một `Thẻ Chuyển Nghề Khai Cuộc` khóa theo cá nhân. Chức nghiệp không phải biến do người chơi điền trước. Payload của thẻ đã được seed tại `T0`, chỉ lộ khi chủ nhân kiểm tra thẻ; dùng thẻ mới kích hoạt nghề và giải `PendingCareerGrowth`.

Hệ thống chấm mọi nghề Cấp 1 đủ điều kiện bằng:

\[
Compat(j)=0.50TagOverlap+0.20AttributeFit+0.15MechanismFit
+0.10EarthSkillFit+0.05SeedNovelty
\]

Mỗi đầu vào nằm trong `[0,1]`; nghề cần `TagOverlap≥0,50` và mọi prerequisite Cấp 1. Nghề có `Compat` cao nhất được niêm vào thẻ; hòa điểm dùng hash bất biến `campaign_id+soul_id+talent_id+job_id`, không dùng lựa chọn hồi tố. Với Lí Lan, payload nội bộ đã khóa là `JOB-SUM-NECRO-01 — Tử Linh Triệu Hoán Sư`, trạng thái `SEALED_UNTIL_INSPECTED`; bảng hướng người chơi không tiết lộ trước khi cô nhìn thẻ.

> **Quy tắc `OPENING-MANA-SKILL-1.0` — `USER_LOCKED + DESIGN_DEFAULT`.** Khi và chỉ khi `CareerActivated` đầu tiên được commit từ Thẻ Chuyển Nghề Khai Cuộc, nghề có `NeedsMana=1` tạo đúng **một** kỹ năng chủ động lớp **Cơ bản**, `WeightClass=1`, dùng Mana và phù hợp với tag thiên phú–nghề. Kỹ năng được học ở mastery 0; nó vào loadout nếu còn đủ tải, nhưng không đẩy kỹ năng khác ra. Nghề `NON_MANA`, nghề vật lý dùng thể lực/nộ/đạn/focus và nghề chỉ có Mana tùy chọn giữ nguyên quy tắc **không tự tạo kỹ năng**. Thăng nghề, đổi nhánh, dùng lại giao diện hoặc phát lại cùng event không gọi quy tắc lần hai.

Payload niêm của Lí Lan khai báo `MANA_REQUIRED` và pool `OPENPOOL-JOB-SUM-NECRO-01`. Ứng viên thắng đã được khóa trước T0 là `SK-OPEN-NECRO-01 — Tử Khí Châm`: Phẩm E, hệ Triệu hoán/Tử linh/Ám, lớp Cơ bản, trọng số 1, yêu cầu Bậc 1, tốn 8 Mana, hồi 3 giây; nó gây `0,75×` Công phép thành sát thương Ám lên một mục tiêu còn hoạt tính và không tác động xác hay thay thế Tử Phục. Đây là payload nội bộ `SEALED_UNTIL_CAREER_ACTIVATED`; không thêm vào `known_skills` trước event dùng thẻ.

| Mốc | Loại quyết định | Yêu cầu |
|---:|---|---|
| Lv1 | Nghề nền | dùng Thẻ Chuyển Nghề đã niêm hoặc đào tạo nhập môn hợp lệ nếu thẻ bị mất |
| Lv10 | Chuyên môn I | mastery 100, thử thách cơ sở |
| Lv20 | Chuyên môn II | mastery 250, thành tích nghề |
| Lv40 | Nghề cao cấp | bậc sống, mentor/di vật/cơ sở |
| Lv60 | Nghề anh hùng | chiến công + lựa chọn giá trị |
| Lv80 | Nghề lãnh vực | gắn với phe/lãnh địa/quy tắc |
| Lv100 | Nghề huyền thoại | thành tựu độc đáo, không chỉ XP |

### 9.4. Chất lượng nghề

Nghề thường không “yếu vĩnh viễn”; nó rẻ, linh hoạt và dễ duy trì. Nghề ẩn/cao cấp có tổng PB kỹ năng cao hơn nhưng tài nguyên, điều kiện, counter và xung đột canon nặng hơn. Bonus thuộc tính chuyển chức dùng bucket JOB-A và soft-cap 50%.

### 9.5. Đổi nhánh

Đổi nhánh giữ level nhân vật, giữ 100% kỹ năng có tag chung; mastery chuyển theo năm band Jaccard đã khóa tại Phụ lục 2.I.7, từ 20% tới 80%. Kỹ năng độc quyền bị khóa cho tới khi quay lại. Cần thời gian tái huấn luyện; không reset để lấy vĩnh viễn mọi passive của mọi nghề.

## 10. Bậc cấu trúc, level, tư chất, đột phá và lên phẩm

### 10.1. Bậc `T0–T10` là trần đã mở và nguồn buff Bậc, không phải level khởi đầu

| `T_form` | Danh xưng | Trần level đã mở | Năng lực cấu trúc |
|---:|---|---:|---|
| T0 | Phàm/Khuyết | 10 | cơ thể hoặc tử thể chưa ổn định năng lượng |
| T1 | Khởi sinh | 10 | một vòng năng lượng/hệ thống hóa cơ bản |
| T2 | Tôi luyện | 20 | chịu tải vai trò ổn định, mở tăng trưởng bậc hai |
| T3 | Tinh anh | 30 | cấu trúc vượt chuẩn quân chính quy |
| T4 | Siêu phàm | 40 | đủ nền để ảnh hưởng một chiến trường nhỏ khi level theo kịp |
| T5 | Đại sư | 50 | đủ nền cho lĩnh vực nghề hoặc kit cao cấp |
| T6 | Tông sư | 60 | đủ nền chỉ huy/đấu cấp chiến dịch |
| T7 | Truyền kỳ | 70 | chứa được di vật, đạo lộ hoặc năng lượng cấp vùng |
| T8 | Bán thần | 80 | chứa được thần tính/khái niệm có điều kiện |
| T9 | Chân thần | 90 | neo được lãnh vực hoặc quyền năng thần hệ |
| T10 | Quy tắc | 100 | mang luật có điều kiện; cực hiếm trong lịch sử |

`T_form=4, Lv1` nghĩa là cấu trúc đã mở tới `Lv40` và đang cho buff Bậc `1,10³`; nó **không** có XP, `LevelGrowth`, kỹ năng nghề hoặc sức chiến đấu hoàn chỉnh của `Lv31`. Khi lên tới `Lv11`, `Lv21` và `Lv31`, cá thể vẫn nhận tăng trưởng level thật nhưng không cần đột phá lại.

### 10.2. Ba bậc phải ghi riêng

Mỗi sheet có ba biến:

| Biến | Ý nghĩa | Có thể giảm/tăng bằng gì |
|---|---|---|
| `T_form` | bậc cấu trúc hiện đã mở | đột phá, giáng bậc, chuyển hóa, thương tổn cấu trúc |
| `T_active` | phần cấu trúc level hiện tại đang vận hành | tăng cùng level, tối đa bằng `T_form` |
| `T_cap` | trần bậc tự nhiên theo tư chất hiện tại | phẩm chất, thức tỉnh hero, huyết mạch, kỳ ngộ, nguyền |

\[
T_{level}=\left\lceil\frac{L}{10}\right\rceil,\qquad
T_{active}=\begin{cases}
0,&T_{form}=0\\
\min(T_{form},\max(1,T_{level})),&T_{form}\ge1
\end{cases}
\]

Điều kiện thường là `T_active≤T_form≤T_cap`. Một biến đổi đã tạo cấu trúc thật nhưng đồng thời hạ tư chất/phẩm có thể sinh `T_form>T_cap`; khi đó giữ cấu trúc hiện có, gắn `OVER_CAP_STRUCTURE` và khóa đột phá kế tiếp cho tới khi `T_cap` vượt `T_form`. File 06 dùng ngoại lệ này cho sinh vật Thánh bị giảm phẩm khi Tử Phục.

#### `LI-LAN-PERSONAL-TIER-GATE-1.0` — Bậc của thiên phú lấy từ chính Lí Lan

Tại thời điểm commit một lần `Tử Phục`, đặt `T_LiLan_current=character.T_form` trên character state của **Lí Lan** sau khi mọi thay đổi Bậc trước đó đã settle. File 06 chỉ cho xác qua cổng khi `T_dead≤T_LiLan_current`. Không được thay `T_LiLan_current` bằng `T_active`, Cấp nhân vật, buff Bậc tạm thời, giai đoạn lãnh địa `H` hoặc `FireLevel`; hai con số cùng bằng 1 ở T0 chỉ là trùng số. Cổng được kiểm đúng một lần khi tạo tử thi: Lí Lan đổi Bậc về sau không tự nâng, giáng hoặc xóa một đơn vị đã được tạo hợp lệ.

File 01 sở hữu **Lửa Sinh Tồn Cấp 1–30** theo tiến trình nguồn. Lửa quyết định hình thái, vùng nhiệt, nhiên liệu và mở khóa lãnh địa có nguồn; nó không phải Bậc sinh mệnh và không cấp quyền Tử Phục xác mạnh hơn.

### 10.3. Tư chất và công thức trần bậc

Tư chất không đồng nhất với phẩm chiến đấu. Mỗi cá thể có `A_base` từ 0–100, sinh bởi huyết mạch/chủng loài, thể chất, cấu trúc linh hồn và seed cá nhân. Phẩm, trạng thái hero và kỳ ngộ sửa giá trị hiệu dụng:

\[
A_{eff}=Clamp(0,100,A_{base}+Q_{bonus}+H_{bonus}+\Delta Opportunity-\Delta Damage)
\]

| Phẩm chiến đấu | Chỉ số `Q` | `Q_bonus` tư chất | Hệ số PB | `G_Q` điểm/level |
|---|---:|---:|---:|---:|
| Thường | 0 | +0 | 1,00 | 2,00 |
| Cựu binh | 1 | +2 | 1,15 | 2,50 |
| Tinh anh | 2 | +5 | 1,45 | 3,25 |
| Đầu lĩnh | 3 | +9 | 1,90 | 4,25 |
| Thống soái | 4 | +14 | 2,60 | 5,50 |
| Lãnh chúa | 5 | +20 | 3,70 | 7,00 |
| Thần thoại | 6 | +28 | 5,50 | 9,00 |

`G_Q` làm chênh lệch phẩm mở rộng theo từng level, nên phẩm cao mạnh hơn bằng cả kit lẫn nền thuộc tính tích lũy. World seed, triệu hồi, tuyển mộ, phần thưởng và chi phí sản xuất phải định giá **giá trị tăng trưởng trọn đời** này; đó là một nguyên nhân cơ học khiến đơn vị phẩm cao hiếm hơn, thay vì độ hiếm chỉ là màu tên.

| `A_eff` | `T_cap` tự nhiên |
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
| 99–100 | ứng viên T10; còn phải qua khóa §10.8 |

Một nông phu `T1` có `A_eff=36` mang trần tự nhiên `T2`. Lao động cả đời có thể giúp người đó lấp level, mastery và nền tảng tới giới hạn, nhưng level dừng tại `Lv20` nếu tư chất không đổi. Kỳ ngộ thật sự có thể tăng `A_base`, phẩm hoặc cấu trúc; bản thân sự kiên trì không tự sửa trần sinh học.

### 10.4. Buff thuộc tính lấy từ Bậc cấu trúc hiện tại

\[
TierMult(T_{form})=\begin{cases}
0.62,&T_{form}=0\\
1.10^{T_{form}-1},&T_{form}\ge1
\end{cases}
\]

Mỗi lần tăng một Bậc từ Bậc 1 trở lên nhân thuộc tính hiện tại thêm `1,10`; các lớp tăng lũy tiến. `TierBonus_i=Raw_i×(TierMult−1)` luôn được tính lại từ `Raw_i` tại timestamp hiện hành, không chụp `Raw_i` tại thời điểm đột phá và không tự nhân lên chính nó. Ví dụ:

- `T1`, `Raw_STR=10`: `TierMult=1,00`, buff Bậc 0, sheet trước nguồn khác là 10.
- Đột phá `T1→T2` khi `Raw_STR=10`: `TierMult=1,10`, buff Bậc 1, sheet là 11.
- Vẫn ở `T2` nhưng `Raw_STR` về sau tăng thành 20: buff tự đổi thành 2, sheet là 22; không giữ con số 1 của lần đột phá.
- `T3`, `Raw_STR=20`: `TierMult=1,10²=1,21`, buff Bậc 4,2 trước làm tròn.

`T_active` vẫn dùng cho cap huấn luyện, trang sức, độ xuyên/giảm và các cơ chế ghi đích danh phần cấu trúc level đang vận hành; nó không còn là nguồn nhân chín thuộc tính. Buff Bậc dùng đúng `T_form`, kể cả cá thể Bậc cao ở Cấp thấp. Khi Bậc bị giáng hợp lệ, hệ số và mọi `TierBonus_i` giảm ngay trong cùng transaction.

### 10.5. Khi nào cần đột phá

Một cá thể chỉ thử đột phá khi:

1. Level đã chạm trần đang mở `L=10×max(1,T_form)`.
2. `T_form<T_cap`.
3. Foundation, mastery chủ, tài nguyên và thử thách của bậc kế đạt yêu cầu.
4. Cơ thể/linh hồn/tử thể ổn định và đường phát triển không xung đột.

Cá thể bắt đầu ở `T4` bỏ qua ba lần đột phá đầu vì cấu trúc ấy đã tồn tại; nó vẫn phải kiếm toàn bộ XP từ `Lv1`.

Ngoại lệ `OVER_LEVEL_STRUCTURE-1.0`: một luật chỉ đích danh có thể giáng `T_form` nhưng giữ `L/XP`, như penalty Tử Phục đối với xác hệ Thánh ở File 06. Nếu `L>10×max(1,T_form)`, gắn `OVER_LEVEL_STRUCTURE`, giữ nguyên mọi level/XP đã có nhưng chặn nhận XP và lên level mới. Cá thể được thử **phục hồi cấu trúc** khi `L≥10×max(1,T_form)` và đủ toàn bộ điều kiện/tài nguyên/`T_cap` cho Bậc kế; thành công tăng `T_form` một bước mà không đổi `L/XP`, tính lại buff Bậc và lặp nếu vẫn vượt trần. Khi `L≤10×max(1,T_form)`, xóa cờ. Thiếu `T_cap` vẫn chặn phục hồi; engine không hạ level để né penalty.

### 10.6. Công thức đột phá

Với đích `T_target=T_form+1`:

\[
P_{break}=G_{apt}\times G_{special}\times P_{cap}(T_{target})
\times F_{foundation}\times F_{mastery}\times F_{preparation}
\times F_{trial}\times F_{quality}
\]

Các hệ số `F` nằm trong `[0,1]`; thiếu một khóa thiết yếu đưa xác suất về 0. Gợi ý chuẩn:

\[
F_{foundation}=Clamp(0,1,(Foundation-60)/40)
\]

\[
F_{mastery}=Clamp(0,1,(MasteryScore-Threshold_{min})/(Threshold_{ideal}-Threshold_{min}))
\]

`F_preparation` đo đúng tài nguyên/nghi thức; `F_trial` đo mức hoàn thành thử thách; `F_quality` lần lượt bằng `0,45/0,55/0,65/0,75/0,85/0,93/1,00` từ Thường tới Thần thoại.

| Bậc đích | `P_cap` tối đa sau mọi hệ số |
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
| T10 | 1% nhưng chỉ khi qua khóa đặc biệt §10.8 |

`G_apt=1` khi `T_target≤T_cap`, ngược lại bằng 0. Kỳ ngộ phải thay đổi tư chất **trước** lần thử; không dùng vật phẩm “+xác suất” để lách một trần bằng 0.

### 10.7. Binh lính thức tỉnh thành hero

Hero có thể sinh ra với hero template hoặc được một đơn vị thường tự thức tỉnh. Cửa thức tỉnh chỉ mở khi một sự kiện tạo ra **kỹ năng cá nhân duy nhất** bằng huấn luyện cực hạn, quyết định có chủ ý hoặc tình thế sinh tử thật. Tỷ lệ chuẩn là một phần mười nghìn trên **mỗi sự kiện đủ chuẩn**, không phải trên mỗi đòn đánh hay mỗi ngày luyện:

\[
P_{hero}=10^{-4}\times F_{risk}\times F_{agency}\times F_{novelty}\times F_{consequence}
\]

Mỗi `F∈[0,1]` và được ánh xạ tất định tại `HERO-AWAKEN-1.0`, Phụ lục 2.I.8; engine khóa một event ID để ngăn lặp lại cùng tình huống. Khi thành công:

- đơn vị nhận `HeroFlag=1`, ID/tên riêng và một kỹ năng độc hữu sinh từ chính cách nó sống sót hoặc hoàn thành nhiệm vụ;
- phẩm tăng tối thiểu một nấc và đạt ít nhất **Tinh anh**;
- phẩm mới gọi `QUALITY_GROWTH_REBASE` tại §10.9, cộng đủ phần thuộc tính thiếu của các level cũ theo lịch sử nghề;
- `A_base` tăng theo công thức `5–15` đã khóa từ rủi ro/độ tự chủ, rồi tính lại `T_cap`;
- level và bậc hiện tại giữ nguyên; sức mạnh mới đến từ kỹ năng, phẩm và tiềm năng, không phải level miễn phí.

Hero sinh ra tự nhiên vẫn là nguồn chủ đạo vì cửa thức tỉnh cực hẹp. Hero đi lên từ binh lính thường có xu hướng thực chiến mạnh hơn ở đúng lĩnh vực đã tạo ra họ: kỹ năng độc hữu được chứng minh trong hoàn cảnh sống còn, mastery nền cao và hành vi chiến đấu đã qua sàng lọc.

### 10.8. Khóa tuyệt đối của T10

Trong lịch sử đã ghi nhận, binh lính thường chưa từng bước vào `T10`. Một lần thử `T9→T10` chỉ hợp lệ khi cá thể đồng thời là **hero**, có phẩm **Thần thoại**, đạt `A_eff≥99`, hoàn tất điều kiện level/mastery/nền tảng và sở hữu kỳ ngộ cấp quy tắc.

\[
G_{special,T10}=HeroFlag\times I(Q=Thần\ thoại)\times I(A_{eff}\ge99)
\]

Ngay cả khi mọi điều kiện đạt mức lý tưởng, xác suất cuối cùng tối đa là `1%` cho một lần thử hợp lệ. Thất bại phải để lại hậu quả theo luật thử thách; hệ thống không cho spam reset seed.

### 10.9. Lên phẩm đơn vị và bù tăng trưởng quá khứ

Phẩm Thường → Cựu binh → Tinh anh → Đầu lĩnh → Thống soái → Lãnh chúa → Thần thoại. Lên phẩm cần thành tích, kỹ năng, trí tuệ/quyền tự chủ và vật dẫn. Phẩm tăng PB, AI, command, tư chất hiệu dụng, ngân sách thuộc tính mỗi level và khả năng sinh kỹ năng; nó không cộng level hoặc tự mở `T_form`.

Một lần **lên phẩm vĩnh viễn** ở level cao tái tính phần tăng trưởng phẩm cho toàn bộ `L−1` lần lên level đã có. Lịch sử nghề của từng level vẫn giữ nguyên:

\[
Target^Q_i(L,Q)=G_Q(Q)\times\sum_{k=2}^{L}w_i(J_k)
\]

\[
Catchup_i=Target^Q_i(L,Q_{new})-QualityGrowthApplied_i
\]

Khi `Q_new>Q_old`, mọi `Catchup_i` dương được cộng ngay vào `LevelGrowth_i`. Với một nghề không đổi, công thức rút gọn là:

\[
Catchup_i=(L-1)\times[G_Q(Q_{new})-G_Q(Q_{old})]\times w_i(J)
\]

Quy tắc vận hành:

1. Ledger ghi `Q_old→Q_new`, level, vector lịch sử, delta từng thuộc tính và nguyên nhân; cùng promotion ID chỉ được áp một lần.
2. Đổi nghề ngay trước khi lên phẩm không chuyển hướng điểm quá khứ; mỗi level dùng `J_k` đã khóa.
3. Một buff phẩm có thời hạn chỉ sửa kit/PB theo mô tả và không tạo bù tăng trưởng.
4. Giáng phẩm vĩnh viễn dùng cùng target và trừ đúng phần tăng trưởng phẩm dư; base, training, gear và talent flat không bị chạm.
5. Nếu max HP/mana/thể lực đổi, tỷ lệ tài nguyên hiện tại được giữ thay vì hồi đầy miễn phí.
6. Tại `Lv1`, `L−1=0`, vì thế lên phẩm không sinh điểm quá khứ; rate mới bắt đầu có tác dụng từ lần lên `Lv2`.

## 11. Thiên phú: cấp, xác suất và ngân sách sức mạnh

### 11.1. Phân phối mặc định

| Cấp | Nhãn | Xác suất cơ sở | Xấp xỉ | PB nền | `G_T`/level người chơi | Khuếch đại mẫu | Trần tiến hóa mẫu |
|---|---|---:|---:|---:|---:|---:|---:|
| F | Phàm | 38.000% | 1/3 | 1 | +0,25 | 2% | 3% |
| E | Tinh xảo | 28.000% | 1/4 | 2 | +0,50 | 3% | 5% |
| D | Ưu tú | 18.000% | 1/6 | 4 | +0,75 | 5% | 8% |
| C | Hiếm | 10.000% | 1/10 | 7 | +1,00 | 7% | 12% |
| B | Trác tuyệt | 4.000% | 1/25 | 12 | +1,50 | 10% | 18% |
| A | Sử thi | 1.500% | 1/67 | 20 | +2,25 | 14% | 26% |
| S | Truyền kỳ | 0.400% | 1/250 | 32 | +3,25 | 19% | 36% |
| SS | Thánh | 0.090% | 1/1,111 | 50 | +4,50 | 25% | 50% |
| SSS | Thần thoại | 0.010% | 1/10,000 | 80 | +6,00 | 33% | 70% |

Tổng đúng 100%. Phân phối áp theo **mỗi shard**; nếu dân số hàng tỷ, SSS vẫn xuất hiện nhiều nên các hiệu ứng “duy nhất” là tag riêng, không đồng nghĩa với SSS. Một shard 1.000.000 người kỳ vọng khoảng 100 SSS trước kiểm tra uniqueness.

`G_T` là phần ngân sách thuộc tính phổ quát mà cấp thiên phú đóng góp cho **người chơi** ở mỗi lần lên level. Tổng của người chơi là `G_player=2,00+G_T`; vì vậy F nhận `2,25`, còn SSS nhận `8,00` điểm mỗi level. Nguồn này đi vào `LevelGrowth`, phân bổ theo nghề và không thay thế hiệu ứng riêng của thiên phú. Grade cao tạo khoảng cách tăng dần theo level thay vì cấp sẵn điểm của các level chưa đạt.

### 11.2. Cấp không phải màu

Grade quyết định PB và độ phức tạp có thể gánh. F có thể cực hữu ích trong niche; SSS có thể mạnh nhưng điều kiện khó. “Ẩn”, “duy nhất”, “di truyền”, “lãnh chúa”, “tiến hóa” là tag, không phải grade.

### 11.3. Mười sáu lĩnh vực

| # | Mã | Lĩnh vực | Thuộc tính gần | Đầu ra | Counter chính |
|---:|---|---|---|---|---|
| 01 | CONG | Công kích | Lực/Khéo | sát thương chủ động | giáp, kháng, khiên và tước vũ khí |
| 02 | THU | Phòng thủ | Thể/Ý | giảm thiệt hại và chắn đòn | xuyên giáp, sát thương chuẩn có cap và cô lập |
| 03 | XA | Tầm xa | Khéo/Cảm | độ chính xác và sát thương tầm xa | che chắn, áp sát, khói và cơ động |
| 04 | PHAP | Pháp thuật | Trí/Linh | công suất phép và hiệu suất mana | kháng phép, gián đoạn, im lặng và phản ma |
| 05 | SINH | Sinh tồn | Thể/Ý | HP, thể lực và kháng môi trường | burst, kiệt sức, độc tích lũy và thiếu hậu cần |
| 06 | HOI | Hồi phục | Linh/Ý | chữa trị, thanh tẩy và hồi phục | vết thương sâu, anti-heal, nguyền và quá tải |
| 07 | TRINH | Trinh sát | Cảm/Khéo | phát hiện, bản đồ và chất lượng tình báo | ngụy trang, mồi giả, nhiễu và phản gián |
| 08 | THUTHAP | Thu thập | Lực/Cảm | sản lượng khai thác và giảm phế | cạn kiệt, thời tiết, raid và quyền sở hữu |
| 09 | CHETAO | Chế tạo | Trí/Khéo | tốc độ, chất lượng và độ bền chế phẩm | thiếu xưởng, nguyên liệu, thời gian và bí quyết |
| 10 | XAY | Xây dựng | Lực/Trí | tốc độ thi công và độ bền công trình | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền |
| 11 | NONG | Nông nghiệp | Cảm/Ý | sản lượng mùa vụ và sức khỏe đất | dịch, khí hậu, đất kiệt và thiếu nước |
| 12 | HAU | Hậu cần | Trí/Ý | sức chứa, tốc giao và giảm tiêu hao | phong tỏa, địa hình, hư hao và phục kích |
| 13 | KINH | Kinh tế | Trí/Hiện diện | hiệu suất giao dịch và lưu chuyển vốn | cấm vận, tín dụng xấu, sốc giá và độc quyền |
| 14 | QUAN | Quản trị | Trí/Hiện diện | giảm thất thoát và tăng năng lực hành chính | tham nhũng, phe phái, quá tải và thiếu chính danh |
| 15 | NGOAI | Ngoại giao | Hiện diện/Cảm | độ tin cậy, thông tin và giá trị hiệp ước | bằng chứng phản bội, lợi ích xung đột và tuyên truyền |
| 16 | TRIEU | Triệu hoán | Linh/Hiện diện | command cap, ổn định và hiệu quả triệu hồi | trục xuất, cắt neo, vượt command cap và phản khế |

### 11.4. Chuẩn hiển thị thiên phú hướng người chơi

Danh mục tiếp tục lưu `ID`, grade, PB, domain, mechanism và counter ở dạng gọn để cân bằng. Khi một thiên phú thực sự xuất hiện trong campaign, thẻ hiển thị phải được sinh lại theo cấu trúc sau và được neo vào nhân vật đang đọc nó:

> Lí Lan gọi bảng thiên phú; tên năng lực cùng những dòng mô tả hiện lên trước mắt.

> **Thiên phú:** Phẩm `[phẩm đã được biết]`, **[Tên]** — [một đến hai câu gợi hình về phong cách, cảm giác hoặc biểu hiện hữu hình của năng lực].  
> [Câu hiệu quả 1: tác dụng hiện tại bằng tiếng Việt rõ nghĩa.] [Câu hiệu quả 2: một chức năng cơ học khác hoặc giới hạn, điều kiện, chi phí, phản chế hay hệ quả phát triển.]

Hai câu hiệu quả là bắt buộc, mặc định có đúng hai câu và nằm trên một dòng riêng bên dưới lời gợi hình; không chép nguyên công thức, ID, thẻ kỹ thuật hoặc tên nhóm tính toán vào giao diện. Nếu phẩm chưa được đo, lược phần phẩm và chỉ mô tả biểu hiện nhân vật thật sự quan sát được. Nếu đã đo, phẩm phải hiện nguyên vẹn dưới dạng `Phẩm SSS`, `Phẩm S` hoặc tên phẩm đầy đủ tương ứng; một ô nhãn chỉ ghi `SSS` hoặc `Thường` bị xem là dữ liệu kiểm tra nội bộ. Mọi trường còn lại dùng một dòng và đúng một mệnh đề ngắn sau gạch ngang.

Không có đoạn thuyết minh vô chủ thể sau thẻ thiên phú. Mọi giới hạn, nghi vấn hoặc lịch sử năng lực phải là dòng Lí Lan đọc trên giao diện, điều cô trực tiếp thử nghiệm, lời một nhân vật nói, hoặc suy luận có căn cứ của chủ thể trong cảnh.

## 12. Tám cơ chế thiên phú

| # | Mã | Cơ chế | Từ khóa tên | Hệ số PB |
|---:|---|---|---|---:|
| 1 | NT | Nền tảng | Cốt | 1.00 |
| 2 | KD | Khuếch đại | Cộng Hưởng | 1.10 |
| 3 | CM | Chuyên môn | Bản Lĩnh | 0.90 |
| 4 | KH | Kích hoạt | Phản Ứng | 1.15 |
| 5 | HQ | Hào quang | Cờ Hiệu | 1.25 |
| 6 | CH | Chuyển hóa | Cầu Dẫn | 1.20 |
| 7 | QT | Quy tắc | Khế Luật | 1.50 |
| 8 | TH | Tiến hóa | Thăng Hoa | 1.40 |

### 12.1. Nền tảng

Thêm điểm phẳng sớm, ổn định, ít điều kiện. Mạnh đầu game nhưng bị tăng trưởng bậc vượt qua. Không được nhân lại chính nó.

### 12.2. Khuếch đại

Tăng phần trăm đầu ra đã tồn tại. Không tạo khả năng mới. Tất cả cùng domain vào TAL-A và soft-cap 60%.

### 12.3. Chuyên môn

Tăng tốc học và kiểm định, không tự cho tri thức. Muốn rèn kiếm vẫn cần lò, thép và bản vẽ.

### 12.4. Kích hoạt

Proc có trigger, xác suất, hiệu ứng, ICD và cấm proc-chain. Kết quả seed khi trigger phát sinh, không khi mở log.

### 12.5. Hào quang

Đổi sức cá nhân lấy hỗ trợ nhóm; có bán kính, target cap và nguyên tắc same-ID highest. Aura của chủ vắng mặt không hoạt động trừ công trình neo.

### 12.6. Chuyển hóa

Đổi một tài nguyên/chỉ số thành đầu ra khác, luôn có floor bảo vệ nguồn và cap. Không tạo vòng chuyển hóa dương; engine kiểm tra chu trình.

### 12.7. Quy tắc

Cho ngoại lệ có cooldown đối với luật cấp thấp hơn; không viết “bỏ qua mọi giới hạn”. Mỗi quy tắc có whitelist, blacklist và quyền ưu tiên.

### 12.8. Tiến hóa

Tích sức mạnh từ milestone thực, có cap, nhịp tối đa và cơ chế mất stack. Không farm hành động rỗng.

## 13. Sinh ngẫu nhiên, reroll, pity và duy nhất

### 13.1. Roll bẩm sinh

1. Khóa seed shard + ID linh hồn/cá nhân.
2. Roll grade theo bảng, không chịu ảnh hưởng nền tảng xã hội.
3. Roll domain theo ba nhánh 60% đều, 25% nghiêng nền tảng, 15% đối nghịch với tập tag đã seed; pool rỗng quay về đều.
4. Roll mechanism bằng bảng trọng số theo grade của `TALENT-ROLL-1.0`, Phụ lục 2.I.11.
5. Chọn prototype và cosmetic name.
6. Kiểm tra xung đột, uniqueness và vòng lặp.

### 13.2. Reroll

Campaign Lí Lan đặt `TALENT_REROLL=OFF`: roll T0 là duy nhất và seed không được tải lại. Campaign khác chỉ bật reroll bằng một contract công bố trước gồm token, trường được đổi, seed derivation, số lượt và quyền xem; không có contract thì nút không tồn tại.

### 13.3. Pity

Không dùng pity cho thiên phú bẩm sinh. Campaign Lí Lan đặt `TALENT_RELIC_PITY=OFF`; một tinh thể/di vật chỉ có pity khi item contract công bố trước `N`, mức tăng, trần PB mùa và reset condition. Thiếu một trường thì pity không chạy, không có `N` ngầm.

### 13.4. Duy nhất

Unique có khóa world hoặc shard. Khi đã có chủ, roll khác chuyển thành biến thể cùng PB hoặc token lựa chọn. Nếu chủ chết, unique có trạng thái ngủ/di sản, không tự rơi như loot trừ canon `<>` cho phép.

## 14. Xung đột, tiến hóa, suy thoái và counterplay

### 14.1. Xung đột

Hai thiên phú xung đột khi: cùng sửa một luật với thứ tự ngược; tạo vòng tài nguyên dương; một yêu cầu trạng thái mà cái kia miễn hoàn toàn; hoặc vượt cap command/identity. Engine giữ thiên phú ưu tiên cao, chuyển phần kia thành phiên bản tương thích cùng PB.

### 14.2. Tiến hóa

Thiên phú có thể tăng grade theo `TALENT-EVOLUTION-1.0`, Phụ lục 2.I.11: tích đủ Evolution XP, hoàn tất thử thách domain và trả Catalyst đã định lượng. PB cũ được tái dựng trong ngân sách grade đích; không giữ toàn bộ effect cũ rồi cộng toàn bộ effect mới. Nhánh tiến hóa chọn một trong cường hóa số, mở phạm vi, giảm điều kiện hoặc đổi cơ chế, đúng một nhánh mỗi lần.

### 14.3. Suy thoái

Thiên phú không mất grade vì không dùng, nhưng hiệu ứng dựa trên khế ước/niềm tin/cơ quan có thể dormant. Phục hồi cần sửa điều kiện. Debuff tước thiên phú chỉ khóa kênh biểu hiện, không xóa ID vĩnh viễn nếu không phải luật thế giới.

### 14.4. Counterplay tối thiểu

Mỗi thiên phú B+ phải có ít nhất hai counter: một chiến thuật và một chiến lược. Ví dụ summon mạnh có trục xuất trong trận và cắt vật tư/neo ngoài trận.

## 15. Quy trình tạo thiên phú mới

1. Chọn một domain chính, tối đa một domain phụ.
2. Chọn cơ chế từ tám loại.
3. Chọn grade và PB.
4. Viết trigger/target/duration/stack/cap/cooldown.
5. Xếp bonus vào bucket.
6. Viết hai counter và một chi phí cơ hội.
7. Chạy test: đầu game, ngang cấp, vượt cấp, đội 20, lãnh địa 10.000 dân.
8. Kiểm tra vòng lặp, proc-chain, summon-tree, giao dịch và hồi sinh.
9. Gắn ID, version và changelog.

### 15.1. Thước PB

1 PB ≈ +1 điểm thuộc tính sớm; hoặc +2% niche output; hoặc một tiện ích nhỏ có cooldown dài. PB không cộng tuyến tính cho hiệu ứng quy tắc: cơ chế Quy tắc nhân 1,5 và phải trả condition tax. Hiệu ứng diện rộng nhân theo √số mục tiêu sau cap.

## 16. Danh mục 1.152 thiên phú chuẩn hóa

### 16.1. Cách đọc danh mục

ID = TP–DOMAIN–MECHANISM–GRADE. Tên là tên làm việc có thể đổi khi ánh xạ vào canon `<>`. “PB” là ngân sách so sánh, không phải điểm sức mạnh trong truyện. Mọi hiệu ứng chịu công thức bucket và điều kiện ở trên.

| ID | Tên thiên phú | Cấp | Lĩnh vực | Cơ chế | Hiệu ứng chuẩn | PB | Khắc chế/giới hạn |
|---|---|---|---|---|---|---:|---|
| TP-CONG-NT-F | Mầm Cốt Phá Kích | F | Công kích | Nền tảng | +1 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-E | Khởi Cốt Phá Kích | E | Công kích | Nền tảng | +2 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-D | Kiên Cốt Phá Kích | D | Công kích | Nền tảng | +3 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-C | Tinh Cốt Phá Kích | C | Công kích | Nền tảng | +5 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-B | Trác Cốt Phá Kích | B | Công kích | Nền tảng | +8 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-A | Sử Cốt Phá Kích | A | Công kích | Nền tảng | +12 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-S | Vương Cốt Phá Kích | S | Công kích | Nền tảng | +18 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-SS | Thánh Cốt Phá Kích | SS | Công kích | Nền tảng | +27 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-NT-SSS | Thần Cốt Phá Kích | SSS | Công kích | Nền tảng | +40 điểm ngân sách chia cho Lực/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-F | Mầm Cộng Hưởng Phá Kích | F | Công kích | Khuếch đại | +2% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-E | Khởi Cộng Hưởng Phá Kích | E | Công kích | Khuếch đại | +3% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-D | Kiên Cộng Hưởng Phá Kích | D | Công kích | Khuếch đại | +5% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-C | Tinh Cộng Hưởng Phá Kích | C | Công kích | Khuếch đại | +7% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-B | Trác Cộng Hưởng Phá Kích | B | Công kích | Khuếch đại | +10% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-A | Sử Cộng Hưởng Phá Kích | A | Công kích | Khuếch đại | +14% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-S | Vương Cộng Hưởng Phá Kích | S | Công kích | Khuếch đại | +19% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-SS | Thánh Cộng Hưởng Phá Kích | SS | Công kích | Khuếch đại | +25% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KD-SSS | Thần Cộng Hưởng Phá Kích | SSS | Công kích | Khuếch đại | +33% sát thương chủ động; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-F | Mầm Bản Lĩnh Phá Kích | F | Công kích | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-E | Khởi Bản Lĩnh Phá Kích | E | Công kích | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-D | Kiên Bản Lĩnh Phá Kích | D | Công kích | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-C | Tinh Bản Lĩnh Phá Kích | C | Công kích | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-B | Trác Bản Lĩnh Phá Kích | B | Công kích | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-A | Sử Bản Lĩnh Phá Kích | A | Công kích | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-S | Vương Bản Lĩnh Phá Kích | S | Công kích | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-SS | Thánh Bản Lĩnh Phá Kích | SS | Công kích | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CM-SSS | Thần Bản Lĩnh Phá Kích | SSS | Công kích | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-F | Mầm Phản Ứng Phá Kích | F | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-E | Khởi Phản Ứng Phá Kích | E | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-D | Kiên Phản Ứng Phá Kích | D | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-C | Tinh Phản Ứng Phá Kích | C | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-B | Trác Phản Ứng Phá Kích | B | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-A | Sử Phản Ứng Phá Kích | A | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-S | Vương Phản Ứng Phá Kích | S | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-SS | Thánh Phản Ứng Phá Kích | SS | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-KH-SSS | Thần Phản Ứng Phá Kích | SSS | Công kích | Kích hoạt | Khi gây sát thương hợp lệ: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-F | Mầm Cờ Hiệu Phá Kích | F | Công kích | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% sát thương chủ động; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-E | Khởi Cờ Hiệu Phá Kích | E | Công kích | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% sát thương chủ động; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-D | Kiên Cờ Hiệu Phá Kích | D | Công kích | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% sát thương chủ động; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-C | Tinh Cờ Hiệu Phá Kích | C | Công kích | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% sát thương chủ động; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-B | Trác Cờ Hiệu Phá Kích | B | Công kích | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% sát thương chủ động; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-A | Sử Cờ Hiệu Phá Kích | A | Công kích | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% sát thương chủ động; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-S | Vương Cờ Hiệu Phá Kích | S | Công kích | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% sát thương chủ động; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-SS | Thánh Cờ Hiệu Phá Kích | SS | Công kích | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% sát thương chủ động; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-HQ-SSS | Thần Cờ Hiệu Phá Kích | SSS | Công kích | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% sát thương chủ động; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-F | Mầm Cầu Dẫn Phá Kích | F | Công kích | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-E | Khởi Cầu Dẫn Phá Kích | E | Công kích | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-D | Kiên Cầu Dẫn Phá Kích | D | Công kích | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-C | Tinh Cầu Dẫn Phá Kích | C | Công kích | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-B | Trác Cầu Dẫn Phá Kích | B | Công kích | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-A | Sử Cầu Dẫn Phá Kích | A | Công kích | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-S | Vương Cầu Dẫn Phá Kích | S | Công kích | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-SS | Thánh Cầu Dẫn Phá Kích | SS | Công kích | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-CH-SSS | Thần Cầu Dẫn Phá Kích | SSS | Công kích | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% phòng thủ bản thân thành ngân sách cho sát thương chủ động; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-F | Mầm Khế Luật Phá Kích | F | Công kích | Quy tắc | 1 lần mỗi 240s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-E | Khởi Khế Luật Phá Kích | E | Công kích | Quy tắc | 1 lần mỗi 210s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-D | Kiên Khế Luật Phá Kích | D | Công kích | Quy tắc | 1 lần mỗi 180s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-C | Tinh Khế Luật Phá Kích | C | Công kích | Quy tắc | 1 lần mỗi 150s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-B | Trác Khế Luật Phá Kích | B | Công kích | Quy tắc | 1 lần mỗi 120s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-A | Sử Khế Luật Phá Kích | A | Công kích | Quy tắc | 1 lần mỗi 90s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-S | Vương Khế Luật Phá Kích | S | Công kích | Quy tắc | 1 lần mỗi 60s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-SS | Thánh Khế Luật Phá Kích | SS | Công kích | Quy tắc | 2 lần mỗi 40s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-QT-SSS | Thần Khế Luật Phá Kích | SSS | Công kích | Quy tắc | 2 lần mỗi 25s, khi điều kiện công kích hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-F | Mầm Thăng Hoa Phá Kích | F | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +0.25% sát thương chủ động; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-E | Khởi Thăng Hoa Phá Kích | E | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +0.35% sát thương chủ động; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-D | Kiên Thăng Hoa Phá Kích | D | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +0.50% sát thương chủ động; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-C | Tinh Thăng Hoa Phá Kích | C | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +0.70% sát thương chủ động; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-B | Trác Thăng Hoa Phá Kích | B | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +1.00% sát thương chủ động; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-A | Sử Thăng Hoa Phá Kích | A | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +1.40% sát thương chủ động; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-S | Vương Thăng Hoa Phá Kích | S | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +2.00% sát thương chủ động; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-SS | Thánh Thăng Hoa Phá Kích | SS | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +2.80% sát thương chủ động; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-CONG-TH-SSS | Thần Thăng Hoa Phá Kích | SSS | Công kích | Tiến hóa | Mỗi khi hạ mục tiêu ngang cấp hoặc hoàn tất huấn luyện công kích, nhận +4.00% sát thương chủ động; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | giáp, kháng, khiên và tước vũ khí; tag SELF/OFFENSE |
| TP-THU-NT-F | Mầm Cốt Thành Lũy | F | Phòng thủ | Nền tảng | +1 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-E | Khởi Cốt Thành Lũy | E | Phòng thủ | Nền tảng | +2 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-D | Kiên Cốt Thành Lũy | D | Phòng thủ | Nền tảng | +3 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-C | Tinh Cốt Thành Lũy | C | Phòng thủ | Nền tảng | +5 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-B | Trác Cốt Thành Lũy | B | Phòng thủ | Nền tảng | +8 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-A | Sử Cốt Thành Lũy | A | Phòng thủ | Nền tảng | +12 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-S | Vương Cốt Thành Lũy | S | Phòng thủ | Nền tảng | +18 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-SS | Thánh Cốt Thành Lũy | SS | Phòng thủ | Nền tảng | +27 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-NT-SSS | Thần Cốt Thành Lũy | SSS | Phòng thủ | Nền tảng | +40 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-F | Mầm Cộng Hưởng Thành Lũy | F | Phòng thủ | Khuếch đại | +2% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-E | Khởi Cộng Hưởng Thành Lũy | E | Phòng thủ | Khuếch đại | +3% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-D | Kiên Cộng Hưởng Thành Lũy | D | Phòng thủ | Khuếch đại | +5% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-C | Tinh Cộng Hưởng Thành Lũy | C | Phòng thủ | Khuếch đại | +7% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-B | Trác Cộng Hưởng Thành Lũy | B | Phòng thủ | Khuếch đại | +10% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-A | Sử Cộng Hưởng Thành Lũy | A | Phòng thủ | Khuếch đại | +14% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-S | Vương Cộng Hưởng Thành Lũy | S | Phòng thủ | Khuếch đại | +19% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-SS | Thánh Cộng Hưởng Thành Lũy | SS | Phòng thủ | Khuếch đại | +25% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KD-SSS | Thần Cộng Hưởng Thành Lũy | SSS | Phòng thủ | Khuếch đại | +33% giảm thiệt hại và chắn đòn; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-F | Mầm Bản Lĩnh Thành Lũy | F | Phòng thủ | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-E | Khởi Bản Lĩnh Thành Lũy | E | Phòng thủ | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-D | Kiên Bản Lĩnh Thành Lũy | D | Phòng thủ | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-C | Tinh Bản Lĩnh Thành Lũy | C | Phòng thủ | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-B | Trác Bản Lĩnh Thành Lũy | B | Phòng thủ | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-A | Sử Bản Lĩnh Thành Lũy | A | Phòng thủ | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-S | Vương Bản Lĩnh Thành Lũy | S | Phòng thủ | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-SS | Thánh Bản Lĩnh Thành Lũy | SS | Phòng thủ | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CM-SSS | Thần Bản Lĩnh Thành Lũy | SSS | Phòng thủ | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-F | Mầm Phản Ứng Thành Lũy | F | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-E | Khởi Phản Ứng Thành Lũy | E | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-D | Kiên Phản Ứng Thành Lũy | D | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-C | Tinh Phản Ứng Thành Lũy | C | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-B | Trác Phản Ứng Thành Lũy | B | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-A | Sử Phản Ứng Thành Lũy | A | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-S | Vương Phản Ứng Thành Lũy | S | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-SS | Thánh Phản Ứng Thành Lũy | SS | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-KH-SSS | Thần Phản Ứng Thành Lũy | SSS | Phòng thủ | Kích hoạt | Khi chặn một đòn vượt 10% HP: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-F | Mầm Cờ Hiệu Thành Lũy | F | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% giảm thiệt hại và chắn đòn; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-E | Khởi Cờ Hiệu Thành Lũy | E | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% giảm thiệt hại và chắn đòn; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-D | Kiên Cờ Hiệu Thành Lũy | D | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% giảm thiệt hại và chắn đòn; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-C | Tinh Cờ Hiệu Thành Lũy | C | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% giảm thiệt hại và chắn đòn; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-B | Trác Cờ Hiệu Thành Lũy | B | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% giảm thiệt hại và chắn đòn; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-A | Sử Cờ Hiệu Thành Lũy | A | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% giảm thiệt hại và chắn đòn; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-S | Vương Cờ Hiệu Thành Lũy | S | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% giảm thiệt hại và chắn đòn; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-SS | Thánh Cờ Hiệu Thành Lũy | SS | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% giảm thiệt hại và chắn đòn; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-HQ-SSS | Thần Cờ Hiệu Thành Lũy | SSS | Phòng thủ | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% giảm thiệt hại và chắn đòn; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-F | Mầm Cầu Dẫn Thành Lũy | F | Phòng thủ | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-E | Khởi Cầu Dẫn Thành Lũy | E | Phòng thủ | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-D | Kiên Cầu Dẫn Thành Lũy | D | Phòng thủ | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-C | Tinh Cầu Dẫn Thành Lũy | C | Phòng thủ | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-B | Trác Cầu Dẫn Thành Lũy | B | Phòng thủ | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-A | Sử Cầu Dẫn Thành Lũy | A | Phòng thủ | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-S | Vương Cầu Dẫn Thành Lũy | S | Phòng thủ | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-SS | Thánh Cầu Dẫn Thành Lũy | SS | Phòng thủ | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-CH-SSS | Thần Cầu Dẫn Thành Lũy | SSS | Phòng thủ | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% tốc độ di chuyển thành ngân sách cho giảm thiệt hại và chắn đòn; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-F | Mầm Khế Luật Thành Lũy | F | Phòng thủ | Quy tắc | 1 lần mỗi 240s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-E | Khởi Khế Luật Thành Lũy | E | Phòng thủ | Quy tắc | 1 lần mỗi 210s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-D | Kiên Khế Luật Thành Lũy | D | Phòng thủ | Quy tắc | 1 lần mỗi 180s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-C | Tinh Khế Luật Thành Lũy | C | Phòng thủ | Quy tắc | 1 lần mỗi 150s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-B | Trác Khế Luật Thành Lũy | B | Phòng thủ | Quy tắc | 1 lần mỗi 120s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-A | Sử Khế Luật Thành Lũy | A | Phòng thủ | Quy tắc | 1 lần mỗi 90s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-S | Vương Khế Luật Thành Lũy | S | Phòng thủ | Quy tắc | 1 lần mỗi 60s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-SS | Thánh Khế Luật Thành Lũy | SS | Phòng thủ | Quy tắc | 2 lần mỗi 40s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-QT-SSS | Thần Khế Luật Thành Lũy | SSS | Phòng thủ | Quy tắc | 2 lần mỗi 25s, khi điều kiện phòng thủ hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-F | Mầm Thăng Hoa Thành Lũy | F | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +0.25% giảm thiệt hại và chắn đòn; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-E | Khởi Thăng Hoa Thành Lũy | E | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +0.35% giảm thiệt hại và chắn đòn; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-D | Kiên Thăng Hoa Thành Lũy | D | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +0.50% giảm thiệt hại và chắn đòn; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-C | Tinh Thăng Hoa Thành Lũy | C | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +0.70% giảm thiệt hại và chắn đòn; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-B | Trác Thăng Hoa Thành Lũy | B | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +1.00% giảm thiệt hại và chắn đòn; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-A | Sử Thăng Hoa Thành Lũy | A | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +1.40% giảm thiệt hại và chắn đòn; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-S | Vương Thăng Hoa Thành Lũy | S | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +2.00% giảm thiệt hại và chắn đòn; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-SS | Thánh Thăng Hoa Thành Lũy | SS | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +2.80% giảm thiệt hại và chắn đòn; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-THU-TH-SSS | Thần Thăng Hoa Thành Lũy | SSS | Phòng thủ | Tiến hóa | Mỗi khi sống qua giao tranh nguy hiểm hoặc bảo vệ đồng minh, nhận +4.00% giảm thiệt hại và chắn đòn; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | xuyên giáp, sát thương chuẩn có cap và cô lập; tag SELF/DEFENSE |
| TP-XA-NT-F | Mầm Cốt Chuẩn Xạ | F | Tầm xa | Nền tảng | +1 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-E | Khởi Cốt Chuẩn Xạ | E | Tầm xa | Nền tảng | +2 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-D | Kiên Cốt Chuẩn Xạ | D | Tầm xa | Nền tảng | +3 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-C | Tinh Cốt Chuẩn Xạ | C | Tầm xa | Nền tảng | +5 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-B | Trác Cốt Chuẩn Xạ | B | Tầm xa | Nền tảng | +8 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-A | Sử Cốt Chuẩn Xạ | A | Tầm xa | Nền tảng | +12 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-S | Vương Cốt Chuẩn Xạ | S | Tầm xa | Nền tảng | +18 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-SS | Thánh Cốt Chuẩn Xạ | SS | Tầm xa | Nền tảng | +27 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-NT-SSS | Thần Cốt Chuẩn Xạ | SSS | Tầm xa | Nền tảng | +40 điểm ngân sách chia cho Khéo/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-F | Mầm Cộng Hưởng Chuẩn Xạ | F | Tầm xa | Khuếch đại | +2% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-E | Khởi Cộng Hưởng Chuẩn Xạ | E | Tầm xa | Khuếch đại | +3% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-D | Kiên Cộng Hưởng Chuẩn Xạ | D | Tầm xa | Khuếch đại | +5% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-C | Tinh Cộng Hưởng Chuẩn Xạ | C | Tầm xa | Khuếch đại | +7% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-B | Trác Cộng Hưởng Chuẩn Xạ | B | Tầm xa | Khuếch đại | +10% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-A | Sử Cộng Hưởng Chuẩn Xạ | A | Tầm xa | Khuếch đại | +14% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-S | Vương Cộng Hưởng Chuẩn Xạ | S | Tầm xa | Khuếch đại | +19% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-SS | Thánh Cộng Hưởng Chuẩn Xạ | SS | Tầm xa | Khuếch đại | +25% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KD-SSS | Thần Cộng Hưởng Chuẩn Xạ | SSS | Tầm xa | Khuếch đại | +33% độ chính xác và sát thương tầm xa; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-F | Mầm Bản Lĩnh Chuẩn Xạ | F | Tầm xa | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-E | Khởi Bản Lĩnh Chuẩn Xạ | E | Tầm xa | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-D | Kiên Bản Lĩnh Chuẩn Xạ | D | Tầm xa | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-C | Tinh Bản Lĩnh Chuẩn Xạ | C | Tầm xa | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-B | Trác Bản Lĩnh Chuẩn Xạ | B | Tầm xa | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-A | Sử Bản Lĩnh Chuẩn Xạ | A | Tầm xa | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-S | Vương Bản Lĩnh Chuẩn Xạ | S | Tầm xa | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-SS | Thánh Bản Lĩnh Chuẩn Xạ | SS | Tầm xa | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CM-SSS | Thần Bản Lĩnh Chuẩn Xạ | SSS | Tầm xa | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-F | Mầm Phản Ứng Chuẩn Xạ | F | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-E | Khởi Phản Ứng Chuẩn Xạ | E | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-D | Kiên Phản Ứng Chuẩn Xạ | D | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-C | Tinh Phản Ứng Chuẩn Xạ | C | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-B | Trác Phản Ứng Chuẩn Xạ | B | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-A | Sử Phản Ứng Chuẩn Xạ | A | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-S | Vương Phản Ứng Chuẩn Xạ | S | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-SS | Thánh Phản Ứng Chuẩn Xạ | SS | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-KH-SSS | Thần Phản Ứng Chuẩn Xạ | SSS | Tầm xa | Kích hoạt | Khi đánh trúng từ ngoài 12 m: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-F | Mầm Cờ Hiệu Chuẩn Xạ | F | Tầm xa | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% độ chính xác và sát thương tầm xa; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-E | Khởi Cờ Hiệu Chuẩn Xạ | E | Tầm xa | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% độ chính xác và sát thương tầm xa; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-D | Kiên Cờ Hiệu Chuẩn Xạ | D | Tầm xa | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% độ chính xác và sát thương tầm xa; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-C | Tinh Cờ Hiệu Chuẩn Xạ | C | Tầm xa | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% độ chính xác và sát thương tầm xa; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-B | Trác Cờ Hiệu Chuẩn Xạ | B | Tầm xa | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% độ chính xác và sát thương tầm xa; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-A | Sử Cờ Hiệu Chuẩn Xạ | A | Tầm xa | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% độ chính xác và sát thương tầm xa; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-S | Vương Cờ Hiệu Chuẩn Xạ | S | Tầm xa | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% độ chính xác và sát thương tầm xa; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-SS | Thánh Cờ Hiệu Chuẩn Xạ | SS | Tầm xa | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% độ chính xác và sát thương tầm xa; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-HQ-SSS | Thần Cờ Hiệu Chuẩn Xạ | SSS | Tầm xa | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% độ chính xác và sát thương tầm xa; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-F | Mầm Cầu Dẫn Chuẩn Xạ | F | Tầm xa | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-E | Khởi Cầu Dẫn Chuẩn Xạ | E | Tầm xa | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-D | Kiên Cầu Dẫn Chuẩn Xạ | D | Tầm xa | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-C | Tinh Cầu Dẫn Chuẩn Xạ | C | Tầm xa | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-B | Trác Cầu Dẫn Chuẩn Xạ | B | Tầm xa | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-A | Sử Cầu Dẫn Chuẩn Xạ | A | Tầm xa | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-S | Vương Cầu Dẫn Chuẩn Xạ | S | Tầm xa | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-SS | Thánh Cầu Dẫn Chuẩn Xạ | SS | Tầm xa | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-CH-SSS | Thần Cầu Dẫn Chuẩn Xạ | SSS | Tầm xa | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% tốc đánh cận chiến thành ngân sách cho độ chính xác và sát thương tầm xa; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-F | Mầm Khế Luật Chuẩn Xạ | F | Tầm xa | Quy tắc | 1 lần mỗi 240s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-E | Khởi Khế Luật Chuẩn Xạ | E | Tầm xa | Quy tắc | 1 lần mỗi 210s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-D | Kiên Khế Luật Chuẩn Xạ | D | Tầm xa | Quy tắc | 1 lần mỗi 180s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-C | Tinh Khế Luật Chuẩn Xạ | C | Tầm xa | Quy tắc | 1 lần mỗi 150s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-B | Trác Khế Luật Chuẩn Xạ | B | Tầm xa | Quy tắc | 1 lần mỗi 120s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-A | Sử Khế Luật Chuẩn Xạ | A | Tầm xa | Quy tắc | 1 lần mỗi 90s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-S | Vương Khế Luật Chuẩn Xạ | S | Tầm xa | Quy tắc | 1 lần mỗi 60s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-SS | Thánh Khế Luật Chuẩn Xạ | SS | Tầm xa | Quy tắc | 2 lần mỗi 40s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-QT-SSS | Thần Khế Luật Chuẩn Xạ | SSS | Tầm xa | Quy tắc | 2 lần mỗi 25s, khi điều kiện tầm xa hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-F | Mầm Thăng Hoa Chuẩn Xạ | F | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +0.25% độ chính xác và sát thương tầm xa; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-E | Khởi Thăng Hoa Chuẩn Xạ | E | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +0.35% độ chính xác và sát thương tầm xa; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-D | Kiên Thăng Hoa Chuẩn Xạ | D | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +0.50% độ chính xác và sát thương tầm xa; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-C | Tinh Thăng Hoa Chuẩn Xạ | C | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +0.70% độ chính xác và sát thương tầm xa; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-B | Trác Thăng Hoa Chuẩn Xạ | B | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +1.00% độ chính xác và sát thương tầm xa; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-A | Sử Thăng Hoa Chuẩn Xạ | A | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +1.40% độ chính xác và sát thương tầm xa; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-S | Vương Thăng Hoa Chuẩn Xạ | S | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +2.00% độ chính xác và sát thương tầm xa; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-SS | Thánh Thăng Hoa Chuẩn Xạ | SS | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +2.80% độ chính xác và sát thương tầm xa; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-XA-TH-SSS | Thần Thăng Hoa Chuẩn Xạ | SSS | Tầm xa | Tiến hóa | Mỗi khi trúng điểm yếu hoặc hoàn tất bài bắn, nhận +4.00% độ chính xác và sát thương tầm xa; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | che chắn, áp sát, khói và cơ động; tag SELF/RANGED |
| TP-PHAP-NT-F | Mầm Cốt Ma Dẫn | F | Pháp thuật | Nền tảng | +1 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-E | Khởi Cốt Ma Dẫn | E | Pháp thuật | Nền tảng | +2 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-D | Kiên Cốt Ma Dẫn | D | Pháp thuật | Nền tảng | +3 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-C | Tinh Cốt Ma Dẫn | C | Pháp thuật | Nền tảng | +5 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-B | Trác Cốt Ma Dẫn | B | Pháp thuật | Nền tảng | +8 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-A | Sử Cốt Ma Dẫn | A | Pháp thuật | Nền tảng | +12 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-S | Vương Cốt Ma Dẫn | S | Pháp thuật | Nền tảng | +18 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-SS | Thánh Cốt Ma Dẫn | SS | Pháp thuật | Nền tảng | +27 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-NT-SSS | Thần Cốt Ma Dẫn | SSS | Pháp thuật | Nền tảng | +40 điểm ngân sách chia cho Trí/Linh; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-F | Mầm Cộng Hưởng Ma Dẫn | F | Pháp thuật | Khuếch đại | +2% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-E | Khởi Cộng Hưởng Ma Dẫn | E | Pháp thuật | Khuếch đại | +3% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-D | Kiên Cộng Hưởng Ma Dẫn | D | Pháp thuật | Khuếch đại | +5% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-C | Tinh Cộng Hưởng Ma Dẫn | C | Pháp thuật | Khuếch đại | +7% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-B | Trác Cộng Hưởng Ma Dẫn | B | Pháp thuật | Khuếch đại | +10% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-A | Sử Cộng Hưởng Ma Dẫn | A | Pháp thuật | Khuếch đại | +14% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-S | Vương Cộng Hưởng Ma Dẫn | S | Pháp thuật | Khuếch đại | +19% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-SS | Thánh Cộng Hưởng Ma Dẫn | SS | Pháp thuật | Khuếch đại | +25% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KD-SSS | Thần Cộng Hưởng Ma Dẫn | SSS | Pháp thuật | Khuếch đại | +33% công suất phép và hiệu suất mana; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-F | Mầm Bản Lĩnh Ma Dẫn | F | Pháp thuật | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-E | Khởi Bản Lĩnh Ma Dẫn | E | Pháp thuật | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-D | Kiên Bản Lĩnh Ma Dẫn | D | Pháp thuật | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-C | Tinh Bản Lĩnh Ma Dẫn | C | Pháp thuật | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-B | Trác Bản Lĩnh Ma Dẫn | B | Pháp thuật | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-A | Sử Bản Lĩnh Ma Dẫn | A | Pháp thuật | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-S | Vương Bản Lĩnh Ma Dẫn | S | Pháp thuật | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-SS | Thánh Bản Lĩnh Ma Dẫn | SS | Pháp thuật | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CM-SSS | Thần Bản Lĩnh Ma Dẫn | SSS | Pháp thuật | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-F | Mầm Phản Ứng Ma Dẫn | F | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-E | Khởi Phản Ứng Ma Dẫn | E | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-D | Kiên Phản Ứng Ma Dẫn | D | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-C | Tinh Phản Ứng Ma Dẫn | C | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-B | Trác Phản Ứng Ma Dẫn | B | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-A | Sử Phản Ứng Ma Dẫn | A | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-S | Vương Phản Ứng Ma Dẫn | S | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-SS | Thánh Phản Ứng Ma Dẫn | SS | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-KH-SSS | Thần Phản Ứng Ma Dẫn | SSS | Pháp thuật | Kích hoạt | Khi tiêu hao mana bằng kỹ năng hợp lệ: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-F | Mầm Cờ Hiệu Ma Dẫn | F | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% công suất phép và hiệu suất mana; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-E | Khởi Cờ Hiệu Ma Dẫn | E | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% công suất phép và hiệu suất mana; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-D | Kiên Cờ Hiệu Ma Dẫn | D | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% công suất phép và hiệu suất mana; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-C | Tinh Cờ Hiệu Ma Dẫn | C | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% công suất phép và hiệu suất mana; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-B | Trác Cờ Hiệu Ma Dẫn | B | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% công suất phép và hiệu suất mana; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-A | Sử Cờ Hiệu Ma Dẫn | A | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% công suất phép và hiệu suất mana; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-S | Vương Cờ Hiệu Ma Dẫn | S | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% công suất phép và hiệu suất mana; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-SS | Thánh Cờ Hiệu Ma Dẫn | SS | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% công suất phép và hiệu suất mana; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-HQ-SSS | Thần Cờ Hiệu Ma Dẫn | SSS | Pháp thuật | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% công suất phép và hiệu suất mana; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-F | Mầm Cầu Dẫn Ma Dẫn | F | Pháp thuật | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-E | Khởi Cầu Dẫn Ma Dẫn | E | Pháp thuật | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-D | Kiên Cầu Dẫn Ma Dẫn | D | Pháp thuật | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-C | Tinh Cầu Dẫn Ma Dẫn | C | Pháp thuật | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-B | Trác Cầu Dẫn Ma Dẫn | B | Pháp thuật | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-A | Sử Cầu Dẫn Ma Dẫn | A | Pháp thuật | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-S | Vương Cầu Dẫn Ma Dẫn | S | Pháp thuật | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-SS | Thánh Cầu Dẫn Ma Dẫn | SS | Pháp thuật | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-CH-SSS | Thần Cầu Dẫn Ma Dẫn | SSS | Pháp thuật | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% hồi thể lực thành ngân sách cho công suất phép và hiệu suất mana; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-F | Mầm Khế Luật Ma Dẫn | F | Pháp thuật | Quy tắc | 1 lần mỗi 240s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-E | Khởi Khế Luật Ma Dẫn | E | Pháp thuật | Quy tắc | 1 lần mỗi 210s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-D | Kiên Khế Luật Ma Dẫn | D | Pháp thuật | Quy tắc | 1 lần mỗi 180s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-C | Tinh Khế Luật Ma Dẫn | C | Pháp thuật | Quy tắc | 1 lần mỗi 150s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-B | Trác Khế Luật Ma Dẫn | B | Pháp thuật | Quy tắc | 1 lần mỗi 120s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-A | Sử Khế Luật Ma Dẫn | A | Pháp thuật | Quy tắc | 1 lần mỗi 90s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-S | Vương Khế Luật Ma Dẫn | S | Pháp thuật | Quy tắc | 1 lần mỗi 60s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-SS | Thánh Khế Luật Ma Dẫn | SS | Pháp thuật | Quy tắc | 2 lần mỗi 40s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-QT-SSS | Thần Khế Luật Ma Dẫn | SSS | Pháp thuật | Quy tắc | 2 lần mỗi 25s, khi điều kiện pháp thuật hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-F | Mầm Thăng Hoa Ma Dẫn | F | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +0.25% công suất phép và hiệu suất mana; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-E | Khởi Thăng Hoa Ma Dẫn | E | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +0.35% công suất phép và hiệu suất mana; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-D | Kiên Thăng Hoa Ma Dẫn | D | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +0.50% công suất phép và hiệu suất mana; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-C | Tinh Thăng Hoa Ma Dẫn | C | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +0.70% công suất phép và hiệu suất mana; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-B | Trác Thăng Hoa Ma Dẫn | B | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +1.00% công suất phép và hiệu suất mana; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-A | Sử Thăng Hoa Ma Dẫn | A | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +1.40% công suất phép và hiệu suất mana; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-S | Vương Thăng Hoa Ma Dẫn | S | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +2.00% công suất phép và hiệu suất mana; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-SS | Thánh Thăng Hoa Ma Dẫn | SS | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +2.80% công suất phép và hiệu suất mana; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-PHAP-TH-SSS | Thần Thăng Hoa Ma Dẫn | SSS | Pháp thuật | Tiến hóa | Mỗi khi thi triển đúng cấu trúc hoặc nghiên cứu phép, nhận +4.00% công suất phép và hiệu suất mana; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | kháng phép, gián đoạn, im lặng và phản ma; tag SELF/MAGIC |
| TP-SINH-NT-F | Mầm Cốt Sinh Mệnh | F | Sinh tồn | Nền tảng | +1 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-E | Khởi Cốt Sinh Mệnh | E | Sinh tồn | Nền tảng | +2 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-D | Kiên Cốt Sinh Mệnh | D | Sinh tồn | Nền tảng | +3 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-C | Tinh Cốt Sinh Mệnh | C | Sinh tồn | Nền tảng | +5 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-B | Trác Cốt Sinh Mệnh | B | Sinh tồn | Nền tảng | +8 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-A | Sử Cốt Sinh Mệnh | A | Sinh tồn | Nền tảng | +12 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-S | Vương Cốt Sinh Mệnh | S | Sinh tồn | Nền tảng | +18 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-SS | Thánh Cốt Sinh Mệnh | SS | Sinh tồn | Nền tảng | +27 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-NT-SSS | Thần Cốt Sinh Mệnh | SSS | Sinh tồn | Nền tảng | +40 điểm ngân sách chia cho Thể/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-F | Mầm Cộng Hưởng Sinh Mệnh | F | Sinh tồn | Khuếch đại | +2% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-E | Khởi Cộng Hưởng Sinh Mệnh | E | Sinh tồn | Khuếch đại | +3% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-D | Kiên Cộng Hưởng Sinh Mệnh | D | Sinh tồn | Khuếch đại | +5% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-C | Tinh Cộng Hưởng Sinh Mệnh | C | Sinh tồn | Khuếch đại | +7% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-B | Trác Cộng Hưởng Sinh Mệnh | B | Sinh tồn | Khuếch đại | +10% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-A | Sử Cộng Hưởng Sinh Mệnh | A | Sinh tồn | Khuếch đại | +14% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-S | Vương Cộng Hưởng Sinh Mệnh | S | Sinh tồn | Khuếch đại | +19% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-SS | Thánh Cộng Hưởng Sinh Mệnh | SS | Sinh tồn | Khuếch đại | +25% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KD-SSS | Thần Cộng Hưởng Sinh Mệnh | SSS | Sinh tồn | Khuếch đại | +33% HP, thể lực và kháng môi trường; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-F | Mầm Bản Lĩnh Sinh Mệnh | F | Sinh tồn | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-E | Khởi Bản Lĩnh Sinh Mệnh | E | Sinh tồn | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-D | Kiên Bản Lĩnh Sinh Mệnh | D | Sinh tồn | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-C | Tinh Bản Lĩnh Sinh Mệnh | C | Sinh tồn | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-B | Trác Bản Lĩnh Sinh Mệnh | B | Sinh tồn | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-A | Sử Bản Lĩnh Sinh Mệnh | A | Sinh tồn | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-S | Vương Bản Lĩnh Sinh Mệnh | S | Sinh tồn | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-SS | Thánh Bản Lĩnh Sinh Mệnh | SS | Sinh tồn | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CM-SSS | Thần Bản Lĩnh Sinh Mệnh | SSS | Sinh tồn | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-F | Mầm Phản Ứng Sinh Mệnh | F | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-E | Khởi Phản Ứng Sinh Mệnh | E | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-D | Kiên Phản Ứng Sinh Mệnh | D | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-C | Tinh Phản Ứng Sinh Mệnh | C | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-B | Trác Phản Ứng Sinh Mệnh | B | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-A | Sử Phản Ứng Sinh Mệnh | A | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-S | Vương Phản Ứng Sinh Mệnh | S | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-SS | Thánh Phản Ứng Sinh Mệnh | SS | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-KH-SSS | Thần Phản Ứng Sinh Mệnh | SSS | Sinh tồn | Kích hoạt | Khi chịu trạng thái môi trường nguy hiểm: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-F | Mầm Cờ Hiệu Sinh Mệnh | F | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% HP, thể lực và kháng môi trường; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-E | Khởi Cờ Hiệu Sinh Mệnh | E | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% HP, thể lực và kháng môi trường; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-D | Kiên Cờ Hiệu Sinh Mệnh | D | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% HP, thể lực và kháng môi trường; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-C | Tinh Cờ Hiệu Sinh Mệnh | C | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% HP, thể lực và kháng môi trường; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-B | Trác Cờ Hiệu Sinh Mệnh | B | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% HP, thể lực và kháng môi trường; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-A | Sử Cờ Hiệu Sinh Mệnh | A | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% HP, thể lực và kháng môi trường; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-S | Vương Cờ Hiệu Sinh Mệnh | S | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% HP, thể lực và kháng môi trường; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-SS | Thánh Cờ Hiệu Sinh Mệnh | SS | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% HP, thể lực và kháng môi trường; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-HQ-SSS | Thần Cờ Hiệu Sinh Mệnh | SSS | Sinh tồn | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% HP, thể lực và kháng môi trường; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-F | Mầm Cầu Dẫn Sinh Mệnh | F | Sinh tồn | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-E | Khởi Cầu Dẫn Sinh Mệnh | E | Sinh tồn | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-D | Kiên Cầu Dẫn Sinh Mệnh | D | Sinh tồn | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-C | Tinh Cầu Dẫn Sinh Mệnh | C | Sinh tồn | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-B | Trác Cầu Dẫn Sinh Mệnh | B | Sinh tồn | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-A | Sử Cầu Dẫn Sinh Mệnh | A | Sinh tồn | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-S | Vương Cầu Dẫn Sinh Mệnh | S | Sinh tồn | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-SS | Thánh Cầu Dẫn Sinh Mệnh | SS | Sinh tồn | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-CH-SSS | Thần Cầu Dẫn Sinh Mệnh | SSS | Sinh tồn | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% sát thương bùng nổ thành ngân sách cho HP, thể lực và kháng môi trường; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-F | Mầm Khế Luật Sinh Mệnh | F | Sinh tồn | Quy tắc | 1 lần mỗi 240s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-E | Khởi Khế Luật Sinh Mệnh | E | Sinh tồn | Quy tắc | 1 lần mỗi 210s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-D | Kiên Khế Luật Sinh Mệnh | D | Sinh tồn | Quy tắc | 1 lần mỗi 180s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-C | Tinh Khế Luật Sinh Mệnh | C | Sinh tồn | Quy tắc | 1 lần mỗi 150s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-B | Trác Khế Luật Sinh Mệnh | B | Sinh tồn | Quy tắc | 1 lần mỗi 120s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-A | Sử Khế Luật Sinh Mệnh | A | Sinh tồn | Quy tắc | 1 lần mỗi 90s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-S | Vương Khế Luật Sinh Mệnh | S | Sinh tồn | Quy tắc | 1 lần mỗi 60s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-SS | Thánh Khế Luật Sinh Mệnh | SS | Sinh tồn | Quy tắc | 2 lần mỗi 40s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-QT-SSS | Thần Khế Luật Sinh Mệnh | SSS | Sinh tồn | Quy tắc | 2 lần mỗi 25s, khi điều kiện sinh tồn hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-F | Mầm Thăng Hoa Sinh Mệnh | F | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +0.25% HP, thể lực và kháng môi trường; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-E | Khởi Thăng Hoa Sinh Mệnh | E | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +0.35% HP, thể lực và kháng môi trường; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-D | Kiên Thăng Hoa Sinh Mệnh | D | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +0.50% HP, thể lực và kháng môi trường; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-C | Tinh Thăng Hoa Sinh Mệnh | C | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +0.70% HP, thể lực và kháng môi trường; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-B | Trác Thăng Hoa Sinh Mệnh | B | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +1.00% HP, thể lực và kháng môi trường; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-A | Sử Thăng Hoa Sinh Mệnh | A | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +1.40% HP, thể lực và kháng môi trường; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-S | Vương Thăng Hoa Sinh Mệnh | S | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +2.00% HP, thể lực và kháng môi trường; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-SS | Thánh Thăng Hoa Sinh Mệnh | SS | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +2.80% HP, thể lực và kháng môi trường; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-SINH-TH-SSS | Thần Thăng Hoa Sinh Mệnh | SSS | Sinh tồn | Tiến hóa | Mỗi khi sống sót thiếu thốn hoặc hoàn tất thích nghi, nhận +4.00% HP, thể lực và kháng môi trường; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | burst, kiệt sức, độc tích lũy và thiếu hậu cần; tag SELF/SURVIVAL |
| TP-HOI-NT-F | Mầm Cốt Tái Sinh | F | Hồi phục | Nền tảng | +1 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-E | Khởi Cốt Tái Sinh | E | Hồi phục | Nền tảng | +2 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-D | Kiên Cốt Tái Sinh | D | Hồi phục | Nền tảng | +3 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-C | Tinh Cốt Tái Sinh | C | Hồi phục | Nền tảng | +5 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-B | Trác Cốt Tái Sinh | B | Hồi phục | Nền tảng | +8 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-A | Sử Cốt Tái Sinh | A | Hồi phục | Nền tảng | +12 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-S | Vương Cốt Tái Sinh | S | Hồi phục | Nền tảng | +18 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-SS | Thánh Cốt Tái Sinh | SS | Hồi phục | Nền tảng | +27 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-NT-SSS | Thần Cốt Tái Sinh | SSS | Hồi phục | Nền tảng | +40 điểm ngân sách chia cho Linh/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-F | Mầm Cộng Hưởng Tái Sinh | F | Hồi phục | Khuếch đại | +2% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-E | Khởi Cộng Hưởng Tái Sinh | E | Hồi phục | Khuếch đại | +3% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-D | Kiên Cộng Hưởng Tái Sinh | D | Hồi phục | Khuếch đại | +5% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-C | Tinh Cộng Hưởng Tái Sinh | C | Hồi phục | Khuếch đại | +7% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-B | Trác Cộng Hưởng Tái Sinh | B | Hồi phục | Khuếch đại | +10% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-A | Sử Cộng Hưởng Tái Sinh | A | Hồi phục | Khuếch đại | +14% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-S | Vương Cộng Hưởng Tái Sinh | S | Hồi phục | Khuếch đại | +19% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-SS | Thánh Cộng Hưởng Tái Sinh | SS | Hồi phục | Khuếch đại | +25% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KD-SSS | Thần Cộng Hưởng Tái Sinh | SSS | Hồi phục | Khuếch đại | +33% chữa trị, thanh tẩy và hồi phục; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-F | Mầm Bản Lĩnh Tái Sinh | F | Hồi phục | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-E | Khởi Bản Lĩnh Tái Sinh | E | Hồi phục | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-D | Kiên Bản Lĩnh Tái Sinh | D | Hồi phục | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-C | Tinh Bản Lĩnh Tái Sinh | C | Hồi phục | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-B | Trác Bản Lĩnh Tái Sinh | B | Hồi phục | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-A | Sử Bản Lĩnh Tái Sinh | A | Hồi phục | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-S | Vương Bản Lĩnh Tái Sinh | S | Hồi phục | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-SS | Thánh Bản Lĩnh Tái Sinh | SS | Hồi phục | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CM-SSS | Thần Bản Lĩnh Tái Sinh | SSS | Hồi phục | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-F | Mầm Phản Ứng Tái Sinh | F | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-E | Khởi Phản Ứng Tái Sinh | E | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-D | Kiên Phản Ứng Tái Sinh | D | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-C | Tinh Phản Ứng Tái Sinh | C | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-B | Trác Phản Ứng Tái Sinh | B | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-A | Sử Phản Ứng Tái Sinh | A | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-S | Vương Phản Ứng Tái Sinh | S | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-SS | Thánh Phản Ứng Tái Sinh | SS | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-KH-SSS | Thần Phản Ứng Tái Sinh | SSS | Hồi phục | Kích hoạt | Khi hồi phục HP thực bị mất cho mục tiêu: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-F | Mầm Cờ Hiệu Tái Sinh | F | Hồi phục | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% chữa trị, thanh tẩy và hồi phục; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-E | Khởi Cờ Hiệu Tái Sinh | E | Hồi phục | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% chữa trị, thanh tẩy và hồi phục; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-D | Kiên Cờ Hiệu Tái Sinh | D | Hồi phục | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% chữa trị, thanh tẩy và hồi phục; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-C | Tinh Cờ Hiệu Tái Sinh | C | Hồi phục | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% chữa trị, thanh tẩy và hồi phục; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-B | Trác Cờ Hiệu Tái Sinh | B | Hồi phục | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% chữa trị, thanh tẩy và hồi phục; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-A | Sử Cờ Hiệu Tái Sinh | A | Hồi phục | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% chữa trị, thanh tẩy và hồi phục; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-S | Vương Cờ Hiệu Tái Sinh | S | Hồi phục | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% chữa trị, thanh tẩy và hồi phục; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-SS | Thánh Cờ Hiệu Tái Sinh | SS | Hồi phục | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% chữa trị, thanh tẩy và hồi phục; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-HQ-SSS | Thần Cờ Hiệu Tái Sinh | SSS | Hồi phục | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% chữa trị, thanh tẩy và hồi phục; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-F | Mầm Cầu Dẫn Tái Sinh | F | Hồi phục | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-E | Khởi Cầu Dẫn Tái Sinh | E | Hồi phục | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-D | Kiên Cầu Dẫn Tái Sinh | D | Hồi phục | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-C | Tinh Cầu Dẫn Tái Sinh | C | Hồi phục | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-B | Trác Cầu Dẫn Tái Sinh | B | Hồi phục | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-A | Sử Cầu Dẫn Tái Sinh | A | Hồi phục | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-S | Vương Cầu Dẫn Tái Sinh | S | Hồi phục | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-SS | Thánh Cầu Dẫn Tái Sinh | SS | Hồi phục | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-CH-SSS | Thần Cầu Dẫn Tái Sinh | SSS | Hồi phục | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% sát thương cá nhân thành ngân sách cho chữa trị, thanh tẩy và hồi phục; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-F | Mầm Khế Luật Tái Sinh | F | Hồi phục | Quy tắc | 1 lần mỗi 240s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-E | Khởi Khế Luật Tái Sinh | E | Hồi phục | Quy tắc | 1 lần mỗi 210s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-D | Kiên Khế Luật Tái Sinh | D | Hồi phục | Quy tắc | 1 lần mỗi 180s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-C | Tinh Khế Luật Tái Sinh | C | Hồi phục | Quy tắc | 1 lần mỗi 150s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-B | Trác Khế Luật Tái Sinh | B | Hồi phục | Quy tắc | 1 lần mỗi 120s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-A | Sử Khế Luật Tái Sinh | A | Hồi phục | Quy tắc | 1 lần mỗi 90s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-S | Vương Khế Luật Tái Sinh | S | Hồi phục | Quy tắc | 1 lần mỗi 60s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-SS | Thánh Khế Luật Tái Sinh | SS | Hồi phục | Quy tắc | 2 lần mỗi 40s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-QT-SSS | Thần Khế Luật Tái Sinh | SSS | Hồi phục | Quy tắc | 2 lần mỗi 25s, khi điều kiện hồi phục hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-F | Mầm Thăng Hoa Tái Sinh | F | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +0.25% chữa trị, thanh tẩy và hồi phục; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-E | Khởi Thăng Hoa Tái Sinh | E | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +0.35% chữa trị, thanh tẩy và hồi phục; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-D | Kiên Thăng Hoa Tái Sinh | D | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +0.50% chữa trị, thanh tẩy và hồi phục; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-C | Tinh Thăng Hoa Tái Sinh | C | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +0.70% chữa trị, thanh tẩy và hồi phục; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-B | Trác Thăng Hoa Tái Sinh | B | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +1.00% chữa trị, thanh tẩy và hồi phục; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-A | Sử Thăng Hoa Tái Sinh | A | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +1.40% chữa trị, thanh tẩy và hồi phục; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-S | Vương Thăng Hoa Tái Sinh | S | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +2.00% chữa trị, thanh tẩy và hồi phục; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-SS | Thánh Thăng Hoa Tái Sinh | SS | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +2.80% chữa trị, thanh tẩy và hồi phục; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-HOI-TH-SSS | Thần Thăng Hoa Tái Sinh | SSS | Hồi phục | Tiến hóa | Mỗi khi cứu mục tiêu nguy kịch hoặc hành nghề y, nhận +4.00% chữa trị, thanh tẩy và hồi phục; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | vết thương sâu, anti-heal, nguyền và quá tải; tag SUPPORT/HEAL |
| TP-TRINH-NT-F | Mầm Cốt Viễn Kiến | F | Trinh sát | Nền tảng | +1 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-E | Khởi Cốt Viễn Kiến | E | Trinh sát | Nền tảng | +2 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-D | Kiên Cốt Viễn Kiến | D | Trinh sát | Nền tảng | +3 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-C | Tinh Cốt Viễn Kiến | C | Trinh sát | Nền tảng | +5 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-B | Trác Cốt Viễn Kiến | B | Trinh sát | Nền tảng | +8 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-A | Sử Cốt Viễn Kiến | A | Trinh sát | Nền tảng | +12 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-S | Vương Cốt Viễn Kiến | S | Trinh sát | Nền tảng | +18 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-SS | Thánh Cốt Viễn Kiến | SS | Trinh sát | Nền tảng | +27 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-NT-SSS | Thần Cốt Viễn Kiến | SSS | Trinh sát | Nền tảng | +40 điểm ngân sách chia cho Cảm/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-F | Mầm Cộng Hưởng Viễn Kiến | F | Trinh sát | Khuếch đại | +2% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-E | Khởi Cộng Hưởng Viễn Kiến | E | Trinh sát | Khuếch đại | +3% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-D | Kiên Cộng Hưởng Viễn Kiến | D | Trinh sát | Khuếch đại | +5% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-C | Tinh Cộng Hưởng Viễn Kiến | C | Trinh sát | Khuếch đại | +7% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-B | Trác Cộng Hưởng Viễn Kiến | B | Trinh sát | Khuếch đại | +10% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-A | Sử Cộng Hưởng Viễn Kiến | A | Trinh sát | Khuếch đại | +14% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-S | Vương Cộng Hưởng Viễn Kiến | S | Trinh sát | Khuếch đại | +19% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-SS | Thánh Cộng Hưởng Viễn Kiến | SS | Trinh sát | Khuếch đại | +25% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KD-SSS | Thần Cộng Hưởng Viễn Kiến | SSS | Trinh sát | Khuếch đại | +33% phát hiện, bản đồ và chất lượng tình báo; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-F | Mầm Bản Lĩnh Viễn Kiến | F | Trinh sát | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-E | Khởi Bản Lĩnh Viễn Kiến | E | Trinh sát | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-D | Kiên Bản Lĩnh Viễn Kiến | D | Trinh sát | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-C | Tinh Bản Lĩnh Viễn Kiến | C | Trinh sát | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-B | Trác Bản Lĩnh Viễn Kiến | B | Trinh sát | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-A | Sử Bản Lĩnh Viễn Kiến | A | Trinh sát | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-S | Vương Bản Lĩnh Viễn Kiến | S | Trinh sát | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-SS | Thánh Bản Lĩnh Viễn Kiến | SS | Trinh sát | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CM-SSS | Thần Bản Lĩnh Viễn Kiến | SSS | Trinh sát | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-F | Mầm Phản Ứng Viễn Kiến | F | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-E | Khởi Phản Ứng Viễn Kiến | E | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-D | Kiên Phản Ứng Viễn Kiến | D | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-C | Tinh Phản Ứng Viễn Kiến | C | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-B | Trác Phản Ứng Viễn Kiến | B | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-A | Sử Phản Ứng Viễn Kiến | A | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-S | Vương Phản Ứng Viễn Kiến | S | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-SS | Thánh Phản Ứng Viễn Kiến | SS | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-KH-SSS | Thần Phản Ứng Viễn Kiến | SSS | Trinh sát | Kích hoạt | Khi phát hiện đối tượng chưa được biết: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-F | Mầm Cờ Hiệu Viễn Kiến | F | Trinh sát | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% phát hiện, bản đồ và chất lượng tình báo; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-E | Khởi Cờ Hiệu Viễn Kiến | E | Trinh sát | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% phát hiện, bản đồ và chất lượng tình báo; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-D | Kiên Cờ Hiệu Viễn Kiến | D | Trinh sát | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% phát hiện, bản đồ và chất lượng tình báo; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-C | Tinh Cờ Hiệu Viễn Kiến | C | Trinh sát | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% phát hiện, bản đồ và chất lượng tình báo; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-B | Trác Cờ Hiệu Viễn Kiến | B | Trinh sát | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% phát hiện, bản đồ và chất lượng tình báo; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-A | Sử Cờ Hiệu Viễn Kiến | A | Trinh sát | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% phát hiện, bản đồ và chất lượng tình báo; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-S | Vương Cờ Hiệu Viễn Kiến | S | Trinh sát | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% phát hiện, bản đồ và chất lượng tình báo; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-SS | Thánh Cờ Hiệu Viễn Kiến | SS | Trinh sát | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% phát hiện, bản đồ và chất lượng tình báo; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-HQ-SSS | Thần Cờ Hiệu Viễn Kiến | SSS | Trinh sát | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% phát hiện, bản đồ và chất lượng tình báo; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-F | Mầm Cầu Dẫn Viễn Kiến | F | Trinh sát | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-E | Khởi Cầu Dẫn Viễn Kiến | E | Trinh sát | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-D | Kiên Cầu Dẫn Viễn Kiến | D | Trinh sát | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-C | Tinh Cầu Dẫn Viễn Kiến | C | Trinh sát | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-B | Trác Cầu Dẫn Viễn Kiến | B | Trinh sát | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-A | Sử Cầu Dẫn Viễn Kiến | A | Trinh sát | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-S | Vương Cầu Dẫn Viễn Kiến | S | Trinh sát | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-SS | Thánh Cầu Dẫn Viễn Kiến | SS | Trinh sát | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-CH-SSS | Thần Cầu Dẫn Viễn Kiến | SSS | Trinh sát | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% giáp thành ngân sách cho phát hiện, bản đồ và chất lượng tình báo; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-F | Mầm Khế Luật Viễn Kiến | F | Trinh sát | Quy tắc | 1 lần mỗi 240s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-E | Khởi Khế Luật Viễn Kiến | E | Trinh sát | Quy tắc | 1 lần mỗi 210s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-D | Kiên Khế Luật Viễn Kiến | D | Trinh sát | Quy tắc | 1 lần mỗi 180s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-C | Tinh Khế Luật Viễn Kiến | C | Trinh sát | Quy tắc | 1 lần mỗi 150s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-B | Trác Khế Luật Viễn Kiến | B | Trinh sát | Quy tắc | 1 lần mỗi 120s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-A | Sử Khế Luật Viễn Kiến | A | Trinh sát | Quy tắc | 1 lần mỗi 90s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-S | Vương Khế Luật Viễn Kiến | S | Trinh sát | Quy tắc | 1 lần mỗi 60s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-SS | Thánh Khế Luật Viễn Kiến | SS | Trinh sát | Quy tắc | 2 lần mỗi 40s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-QT-SSS | Thần Khế Luật Viễn Kiến | SSS | Trinh sát | Quy tắc | 2 lần mỗi 25s, khi điều kiện trinh sát hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-F | Mầm Thăng Hoa Viễn Kiến | F | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +0.25% phát hiện, bản đồ và chất lượng tình báo; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-E | Khởi Thăng Hoa Viễn Kiến | E | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +0.35% phát hiện, bản đồ và chất lượng tình báo; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-D | Kiên Thăng Hoa Viễn Kiến | D | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +0.50% phát hiện, bản đồ và chất lượng tình báo; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-C | Tinh Thăng Hoa Viễn Kiến | C | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +0.70% phát hiện, bản đồ và chất lượng tình báo; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-B | Trác Thăng Hoa Viễn Kiến | B | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +1.00% phát hiện, bản đồ và chất lượng tình báo; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-A | Sử Thăng Hoa Viễn Kiến | A | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +1.40% phát hiện, bản đồ và chất lượng tình báo; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-S | Vương Thăng Hoa Viễn Kiến | S | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +2.00% phát hiện, bản đồ và chất lượng tình báo; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-SS | Thánh Thăng Hoa Viễn Kiến | SS | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +2.80% phát hiện, bản đồ và chất lượng tình báo; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-TRINH-TH-SSS | Thần Thăng Hoa Viễn Kiến | SSS | Trinh sát | Tiến hóa | Mỗi khi xác minh ô bản đồ hoặc phá phục kích, nhận +4.00% phát hiện, bản đồ và chất lượng tình báo; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | ngụy trang, mồi giả, nhiễu và phản gián; tag SCOUT/INTEL |
| TP-THUTHAP-NT-F | Mầm Cốt Phong Thu | F | Thu thập | Nền tảng | +1 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-E | Khởi Cốt Phong Thu | E | Thu thập | Nền tảng | +2 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-D | Kiên Cốt Phong Thu | D | Thu thập | Nền tảng | +3 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-C | Tinh Cốt Phong Thu | C | Thu thập | Nền tảng | +5 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-B | Trác Cốt Phong Thu | B | Thu thập | Nền tảng | +8 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-A | Sử Cốt Phong Thu | A | Thu thập | Nền tảng | +12 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-S | Vương Cốt Phong Thu | S | Thu thập | Nền tảng | +18 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-SS | Thánh Cốt Phong Thu | SS | Thu thập | Nền tảng | +27 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-NT-SSS | Thần Cốt Phong Thu | SSS | Thu thập | Nền tảng | +40 điểm ngân sách chia cho Lực/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-F | Mầm Cộng Hưởng Phong Thu | F | Thu thập | Khuếch đại | +2% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-E | Khởi Cộng Hưởng Phong Thu | E | Thu thập | Khuếch đại | +3% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-D | Kiên Cộng Hưởng Phong Thu | D | Thu thập | Khuếch đại | +5% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-C | Tinh Cộng Hưởng Phong Thu | C | Thu thập | Khuếch đại | +7% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-B | Trác Cộng Hưởng Phong Thu | B | Thu thập | Khuếch đại | +10% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-A | Sử Cộng Hưởng Phong Thu | A | Thu thập | Khuếch đại | +14% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-S | Vương Cộng Hưởng Phong Thu | S | Thu thập | Khuếch đại | +19% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-SS | Thánh Cộng Hưởng Phong Thu | SS | Thu thập | Khuếch đại | +25% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KD-SSS | Thần Cộng Hưởng Phong Thu | SSS | Thu thập | Khuếch đại | +33% sản lượng khai thác và giảm phế; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-F | Mầm Bản Lĩnh Phong Thu | F | Thu thập | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-E | Khởi Bản Lĩnh Phong Thu | E | Thu thập | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-D | Kiên Bản Lĩnh Phong Thu | D | Thu thập | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-C | Tinh Bản Lĩnh Phong Thu | C | Thu thập | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-B | Trác Bản Lĩnh Phong Thu | B | Thu thập | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-A | Sử Bản Lĩnh Phong Thu | A | Thu thập | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-S | Vương Bản Lĩnh Phong Thu | S | Thu thập | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-SS | Thánh Bản Lĩnh Phong Thu | SS | Thu thập | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CM-SSS | Thần Bản Lĩnh Phong Thu | SSS | Thu thập | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-F | Mầm Phản Ứng Phong Thu | F | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-E | Khởi Phản Ứng Phong Thu | E | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-D | Kiên Phản Ứng Phong Thu | D | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-C | Tinh Phản Ứng Phong Thu | C | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-B | Trác Phản Ứng Phong Thu | B | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-A | Sử Phản Ứng Phong Thu | A | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-S | Vương Phản Ứng Phong Thu | S | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-SS | Thánh Phản Ứng Phong Thu | SS | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-KH-SSS | Thần Phản Ứng Phong Thu | SSS | Thu thập | Kích hoạt | Khi hoàn tất một chu kỳ thu thập: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-F | Mầm Cờ Hiệu Phong Thu | F | Thu thập | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% sản lượng khai thác và giảm phế; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-E | Khởi Cờ Hiệu Phong Thu | E | Thu thập | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% sản lượng khai thác và giảm phế; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-D | Kiên Cờ Hiệu Phong Thu | D | Thu thập | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% sản lượng khai thác và giảm phế; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-C | Tinh Cờ Hiệu Phong Thu | C | Thu thập | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% sản lượng khai thác và giảm phế; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-B | Trác Cờ Hiệu Phong Thu | B | Thu thập | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% sản lượng khai thác và giảm phế; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-A | Sử Cờ Hiệu Phong Thu | A | Thu thập | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% sản lượng khai thác và giảm phế; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-S | Vương Cờ Hiệu Phong Thu | S | Thu thập | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% sản lượng khai thác và giảm phế; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-SS | Thánh Cờ Hiệu Phong Thu | SS | Thu thập | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% sản lượng khai thác và giảm phế; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-HQ-SSS | Thần Cờ Hiệu Phong Thu | SSS | Thu thập | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% sản lượng khai thác và giảm phế; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-F | Mầm Cầu Dẫn Phong Thu | F | Thu thập | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-E | Khởi Cầu Dẫn Phong Thu | E | Thu thập | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-D | Kiên Cầu Dẫn Phong Thu | D | Thu thập | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-C | Tinh Cầu Dẫn Phong Thu | C | Thu thập | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-B | Trác Cầu Dẫn Phong Thu | B | Thu thập | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-A | Sử Cầu Dẫn Phong Thu | A | Thu thập | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-S | Vương Cầu Dẫn Phong Thu | S | Thu thập | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-SS | Thánh Cầu Dẫn Phong Thu | SS | Thu thập | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-CH-SSS | Thần Cầu Dẫn Phong Thu | SSS | Thu thập | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% tốc độ chiến đấu thành ngân sách cho sản lượng khai thác và giảm phế; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-F | Mầm Khế Luật Phong Thu | F | Thu thập | Quy tắc | 1 lần mỗi 240s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-E | Khởi Khế Luật Phong Thu | E | Thu thập | Quy tắc | 1 lần mỗi 210s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-D | Kiên Khế Luật Phong Thu | D | Thu thập | Quy tắc | 1 lần mỗi 180s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-C | Tinh Khế Luật Phong Thu | C | Thu thập | Quy tắc | 1 lần mỗi 150s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-B | Trác Khế Luật Phong Thu | B | Thu thập | Quy tắc | 1 lần mỗi 120s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-A | Sử Khế Luật Phong Thu | A | Thu thập | Quy tắc | 1 lần mỗi 90s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-S | Vương Khế Luật Phong Thu | S | Thu thập | Quy tắc | 1 lần mỗi 60s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-SS | Thánh Khế Luật Phong Thu | SS | Thu thập | Quy tắc | 2 lần mỗi 40s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-QT-SSS | Thần Khế Luật Phong Thu | SSS | Thu thập | Quy tắc | 2 lần mỗi 25s, khi điều kiện thu thập hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-F | Mầm Thăng Hoa Phong Thu | F | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +0.25% sản lượng khai thác và giảm phế; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-E | Khởi Thăng Hoa Phong Thu | E | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +0.35% sản lượng khai thác và giảm phế; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-D | Kiên Thăng Hoa Phong Thu | D | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +0.50% sản lượng khai thác và giảm phế; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-C | Tinh Thăng Hoa Phong Thu | C | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +0.70% sản lượng khai thác và giảm phế; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-B | Trác Thăng Hoa Phong Thu | B | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +1.00% sản lượng khai thác và giảm phế; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-A | Sử Thăng Hoa Phong Thu | A | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +1.40% sản lượng khai thác và giảm phế; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-S | Vương Thăng Hoa Phong Thu | S | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +2.00% sản lượng khai thác và giảm phế; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-SS | Thánh Thăng Hoa Phong Thu | SS | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +2.80% sản lượng khai thác và giảm phế; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-THUTHAP-TH-SSS | Thần Thăng Hoa Phong Thu | SSS | Thu thập | Tiến hóa | Mỗi khi khai thác đúng quy trình hoặc tìm mạch mới, nhận +4.00% sản lượng khai thác và giảm phế; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | cạn kiệt, thời tiết, raid và quyền sở hữu; tag ECON/GATHER |
| TP-CHETAO-NT-F | Mầm Cốt Bách Công | F | Chế tạo | Nền tảng | +1 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-E | Khởi Cốt Bách Công | E | Chế tạo | Nền tảng | +2 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-D | Kiên Cốt Bách Công | D | Chế tạo | Nền tảng | +3 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-C | Tinh Cốt Bách Công | C | Chế tạo | Nền tảng | +5 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-B | Trác Cốt Bách Công | B | Chế tạo | Nền tảng | +8 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-A | Sử Cốt Bách Công | A | Chế tạo | Nền tảng | +12 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-S | Vương Cốt Bách Công | S | Chế tạo | Nền tảng | +18 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-SS | Thánh Cốt Bách Công | SS | Chế tạo | Nền tảng | +27 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-NT-SSS | Thần Cốt Bách Công | SSS | Chế tạo | Nền tảng | +40 điểm ngân sách chia cho Trí/Khéo; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-F | Mầm Cộng Hưởng Bách Công | F | Chế tạo | Khuếch đại | +2% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-E | Khởi Cộng Hưởng Bách Công | E | Chế tạo | Khuếch đại | +3% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-D | Kiên Cộng Hưởng Bách Công | D | Chế tạo | Khuếch đại | +5% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-C | Tinh Cộng Hưởng Bách Công | C | Chế tạo | Khuếch đại | +7% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-B | Trác Cộng Hưởng Bách Công | B | Chế tạo | Khuếch đại | +10% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-A | Sử Cộng Hưởng Bách Công | A | Chế tạo | Khuếch đại | +14% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-S | Vương Cộng Hưởng Bách Công | S | Chế tạo | Khuếch đại | +19% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-SS | Thánh Cộng Hưởng Bách Công | SS | Chế tạo | Khuếch đại | +25% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KD-SSS | Thần Cộng Hưởng Bách Công | SSS | Chế tạo | Khuếch đại | +33% tốc độ, chất lượng và độ bền chế phẩm; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-F | Mầm Bản Lĩnh Bách Công | F | Chế tạo | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-E | Khởi Bản Lĩnh Bách Công | E | Chế tạo | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-D | Kiên Bản Lĩnh Bách Công | D | Chế tạo | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-C | Tinh Bản Lĩnh Bách Công | C | Chế tạo | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-B | Trác Bản Lĩnh Bách Công | B | Chế tạo | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-A | Sử Bản Lĩnh Bách Công | A | Chế tạo | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-S | Vương Bản Lĩnh Bách Công | S | Chế tạo | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-SS | Thánh Bản Lĩnh Bách Công | SS | Chế tạo | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CM-SSS | Thần Bản Lĩnh Bách Công | SSS | Chế tạo | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-F | Mầm Phản Ứng Bách Công | F | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-E | Khởi Phản Ứng Bách Công | E | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-D | Kiên Phản Ứng Bách Công | D | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-C | Tinh Phản Ứng Bách Công | C | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-B | Trác Phản Ứng Bách Công | B | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-A | Sử Phản Ứng Bách Công | A | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-S | Vương Phản Ứng Bách Công | S | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-SS | Thánh Phản Ứng Bách Công | SS | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-KH-SSS | Thần Phản Ứng Bách Công | SSS | Chế tạo | Kích hoạt | Khi hoàn tất recipe đúng chuẩn: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-F | Mầm Cờ Hiệu Bách Công | F | Chế tạo | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% tốc độ, chất lượng và độ bền chế phẩm; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-E | Khởi Cờ Hiệu Bách Công | E | Chế tạo | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% tốc độ, chất lượng và độ bền chế phẩm; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-D | Kiên Cờ Hiệu Bách Công | D | Chế tạo | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% tốc độ, chất lượng và độ bền chế phẩm; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-C | Tinh Cờ Hiệu Bách Công | C | Chế tạo | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% tốc độ, chất lượng và độ bền chế phẩm; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-B | Trác Cờ Hiệu Bách Công | B | Chế tạo | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% tốc độ, chất lượng và độ bền chế phẩm; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-A | Sử Cờ Hiệu Bách Công | A | Chế tạo | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% tốc độ, chất lượng và độ bền chế phẩm; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-S | Vương Cờ Hiệu Bách Công | S | Chế tạo | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% tốc độ, chất lượng và độ bền chế phẩm; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-SS | Thánh Cờ Hiệu Bách Công | SS | Chế tạo | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% tốc độ, chất lượng và độ bền chế phẩm; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-HQ-SSS | Thần Cờ Hiệu Bách Công | SSS | Chế tạo | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% tốc độ, chất lượng và độ bền chế phẩm; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-F | Mầm Cầu Dẫn Bách Công | F | Chế tạo | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-E | Khởi Cầu Dẫn Bách Công | E | Chế tạo | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-D | Kiên Cầu Dẫn Bách Công | D | Chế tạo | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-C | Tinh Cầu Dẫn Bách Công | C | Chế tạo | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-B | Trác Cầu Dẫn Bách Công | B | Chế tạo | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-A | Sử Cầu Dẫn Bách Công | A | Chế tạo | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-S | Vương Cầu Dẫn Bách Công | S | Chế tạo | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-SS | Thánh Cầu Dẫn Bách Công | SS | Chế tạo | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-CH-SSS | Thần Cầu Dẫn Bách Công | SSS | Chế tạo | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% tốc di chuyển thành ngân sách cho tốc độ, chất lượng và độ bền chế phẩm; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-F | Mầm Khế Luật Bách Công | F | Chế tạo | Quy tắc | 1 lần mỗi 240s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-E | Khởi Khế Luật Bách Công | E | Chế tạo | Quy tắc | 1 lần mỗi 210s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-D | Kiên Khế Luật Bách Công | D | Chế tạo | Quy tắc | 1 lần mỗi 180s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-C | Tinh Khế Luật Bách Công | C | Chế tạo | Quy tắc | 1 lần mỗi 150s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-B | Trác Khế Luật Bách Công | B | Chế tạo | Quy tắc | 1 lần mỗi 120s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-A | Sử Khế Luật Bách Công | A | Chế tạo | Quy tắc | 1 lần mỗi 90s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-S | Vương Khế Luật Bách Công | S | Chế tạo | Quy tắc | 1 lần mỗi 60s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-SS | Thánh Khế Luật Bách Công | SS | Chế tạo | Quy tắc | 2 lần mỗi 40s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-QT-SSS | Thần Khế Luật Bách Công | SSS | Chế tạo | Quy tắc | 2 lần mỗi 25s, khi điều kiện chế tạo hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-F | Mầm Thăng Hoa Bách Công | F | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +0.25% tốc độ, chất lượng và độ bền chế phẩm; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-E | Khởi Thăng Hoa Bách Công | E | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +0.35% tốc độ, chất lượng và độ bền chế phẩm; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-D | Kiên Thăng Hoa Bách Công | D | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +0.50% tốc độ, chất lượng và độ bền chế phẩm; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-C | Tinh Thăng Hoa Bách Công | C | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +0.70% tốc độ, chất lượng và độ bền chế phẩm; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-B | Trác Thăng Hoa Bách Công | B | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +1.00% tốc độ, chất lượng và độ bền chế phẩm; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-A | Sử Thăng Hoa Bách Công | A | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +1.40% tốc độ, chất lượng và độ bền chế phẩm; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-S | Vương Thăng Hoa Bách Công | S | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +2.00% tốc độ, chất lượng và độ bền chế phẩm; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-SS | Thánh Thăng Hoa Bách Công | SS | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +2.80% tốc độ, chất lượng và độ bền chế phẩm; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-CHETAO-TH-SSS | Thần Thăng Hoa Bách Công | SSS | Chế tạo | Tiến hóa | Mỗi khi tạo sản phẩm đạt chuẩn cao hơn hoặc sửa đồ khó, nhận +4.00% tốc độ, chất lượng và độ bền chế phẩm; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | thiếu xưởng, nguyên liệu, thời gian và bí quyết; tag ECON/CRAFT |
| TP-XAY-NT-F | Mầm Cốt Kiến Tạo | F | Xây dựng | Nền tảng | +1 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-E | Khởi Cốt Kiến Tạo | E | Xây dựng | Nền tảng | +2 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-D | Kiên Cốt Kiến Tạo | D | Xây dựng | Nền tảng | +3 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-C | Tinh Cốt Kiến Tạo | C | Xây dựng | Nền tảng | +5 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-B | Trác Cốt Kiến Tạo | B | Xây dựng | Nền tảng | +8 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-A | Sử Cốt Kiến Tạo | A | Xây dựng | Nền tảng | +12 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-S | Vương Cốt Kiến Tạo | S | Xây dựng | Nền tảng | +18 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-SS | Thánh Cốt Kiến Tạo | SS | Xây dựng | Nền tảng | +27 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-NT-SSS | Thần Cốt Kiến Tạo | SSS | Xây dựng | Nền tảng | +40 điểm ngân sách chia cho Lực/Trí; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-F | Mầm Cộng Hưởng Kiến Tạo | F | Xây dựng | Khuếch đại | +2% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-E | Khởi Cộng Hưởng Kiến Tạo | E | Xây dựng | Khuếch đại | +3% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-D | Kiên Cộng Hưởng Kiến Tạo | D | Xây dựng | Khuếch đại | +5% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-C | Tinh Cộng Hưởng Kiến Tạo | C | Xây dựng | Khuếch đại | +7% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-B | Trác Cộng Hưởng Kiến Tạo | B | Xây dựng | Khuếch đại | +10% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-A | Sử Cộng Hưởng Kiến Tạo | A | Xây dựng | Khuếch đại | +14% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-S | Vương Cộng Hưởng Kiến Tạo | S | Xây dựng | Khuếch đại | +19% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-SS | Thánh Cộng Hưởng Kiến Tạo | SS | Xây dựng | Khuếch đại | +25% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KD-SSS | Thần Cộng Hưởng Kiến Tạo | SSS | Xây dựng | Khuếch đại | +33% tốc độ thi công và độ bền công trình; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-F | Mầm Bản Lĩnh Kiến Tạo | F | Xây dựng | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-E | Khởi Bản Lĩnh Kiến Tạo | E | Xây dựng | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-D | Kiên Bản Lĩnh Kiến Tạo | D | Xây dựng | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-C | Tinh Bản Lĩnh Kiến Tạo | C | Xây dựng | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-B | Trác Bản Lĩnh Kiến Tạo | B | Xây dựng | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-A | Sử Bản Lĩnh Kiến Tạo | A | Xây dựng | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-S | Vương Bản Lĩnh Kiến Tạo | S | Xây dựng | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-SS | Thánh Bản Lĩnh Kiến Tạo | SS | Xây dựng | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CM-SSS | Thần Bản Lĩnh Kiến Tạo | SSS | Xây dựng | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-F | Mầm Phản Ứng Kiến Tạo | F | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-E | Khởi Phản Ứng Kiến Tạo | E | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-D | Kiên Phản Ứng Kiến Tạo | D | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-C | Tinh Phản Ứng Kiến Tạo | C | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-B | Trác Phản Ứng Kiến Tạo | B | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-A | Sử Phản Ứng Kiến Tạo | A | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-S | Vương Phản Ứng Kiến Tạo | S | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-SS | Thánh Phản Ứng Kiến Tạo | SS | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-KH-SSS | Thần Phản Ứng Kiến Tạo | SSS | Xây dựng | Kích hoạt | Khi hoàn tất work unit xây dựng: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-F | Mầm Cờ Hiệu Kiến Tạo | F | Xây dựng | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% tốc độ thi công và độ bền công trình; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-E | Khởi Cờ Hiệu Kiến Tạo | E | Xây dựng | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% tốc độ thi công và độ bền công trình; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-D | Kiên Cờ Hiệu Kiến Tạo | D | Xây dựng | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% tốc độ thi công và độ bền công trình; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-C | Tinh Cờ Hiệu Kiến Tạo | C | Xây dựng | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% tốc độ thi công và độ bền công trình; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-B | Trác Cờ Hiệu Kiến Tạo | B | Xây dựng | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% tốc độ thi công và độ bền công trình; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-A | Sử Cờ Hiệu Kiến Tạo | A | Xây dựng | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% tốc độ thi công và độ bền công trình; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-S | Vương Cờ Hiệu Kiến Tạo | S | Xây dựng | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% tốc độ thi công và độ bền công trình; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-SS | Thánh Cờ Hiệu Kiến Tạo | SS | Xây dựng | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% tốc độ thi công và độ bền công trình; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-HQ-SSS | Thần Cờ Hiệu Kiến Tạo | SSS | Xây dựng | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% tốc độ thi công và độ bền công trình; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-F | Mầm Cầu Dẫn Kiến Tạo | F | Xây dựng | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-E | Khởi Cầu Dẫn Kiến Tạo | E | Xây dựng | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-D | Kiên Cầu Dẫn Kiến Tạo | D | Xây dựng | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-C | Tinh Cầu Dẫn Kiến Tạo | C | Xây dựng | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-B | Trác Cầu Dẫn Kiến Tạo | B | Xây dựng | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-A | Sử Cầu Dẫn Kiến Tạo | A | Xây dựng | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-S | Vương Cầu Dẫn Kiến Tạo | S | Xây dựng | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-SS | Thánh Cầu Dẫn Kiến Tạo | SS | Xây dựng | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-CH-SSS | Thần Cầu Dẫn Kiến Tạo | SSS | Xây dựng | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% mana tối đa thành ngân sách cho tốc độ thi công và độ bền công trình; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-F | Mầm Khế Luật Kiến Tạo | F | Xây dựng | Quy tắc | 1 lần mỗi 240s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-E | Khởi Khế Luật Kiến Tạo | E | Xây dựng | Quy tắc | 1 lần mỗi 210s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-D | Kiên Khế Luật Kiến Tạo | D | Xây dựng | Quy tắc | 1 lần mỗi 180s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-C | Tinh Khế Luật Kiến Tạo | C | Xây dựng | Quy tắc | 1 lần mỗi 150s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-B | Trác Khế Luật Kiến Tạo | B | Xây dựng | Quy tắc | 1 lần mỗi 120s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-A | Sử Khế Luật Kiến Tạo | A | Xây dựng | Quy tắc | 1 lần mỗi 90s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-S | Vương Khế Luật Kiến Tạo | S | Xây dựng | Quy tắc | 1 lần mỗi 60s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-SS | Thánh Khế Luật Kiến Tạo | SS | Xây dựng | Quy tắc | 2 lần mỗi 40s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-QT-SSS | Thần Khế Luật Kiến Tạo | SSS | Xây dựng | Quy tắc | 2 lần mỗi 25s, khi điều kiện xây dựng hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-F | Mầm Thăng Hoa Kiến Tạo | F | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +0.25% tốc độ thi công và độ bền công trình; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-E | Khởi Thăng Hoa Kiến Tạo | E | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +0.35% tốc độ thi công và độ bền công trình; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-D | Kiên Thăng Hoa Kiến Tạo | D | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +0.50% tốc độ thi công và độ bền công trình; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-C | Tinh Thăng Hoa Kiến Tạo | C | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +0.70% tốc độ thi công và độ bền công trình; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-B | Trác Thăng Hoa Kiến Tạo | B | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +1.00% tốc độ thi công và độ bền công trình; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-A | Sử Thăng Hoa Kiến Tạo | A | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +1.40% tốc độ thi công và độ bền công trình; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-S | Vương Thăng Hoa Kiến Tạo | S | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +2.00% tốc độ thi công và độ bền công trình; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-SS | Thánh Thăng Hoa Kiến Tạo | SS | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +2.80% tốc độ thi công và độ bền công trình; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-XAY-TH-SSS | Thần Thăng Hoa Kiến Tạo | SSS | Xây dựng | Tiến hóa | Mỗi khi nghiệm thu công trình hoặc sửa hư hại lớn, nhận +4.00% tốc độ thi công và độ bền công trình; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | thiếu vật tư khi xây; sau nghiệm thu chỉ tấn công có ledger mới giảm độ bền; tag TERRITORY/BUILD |
| TP-NONG-NT-F | Mầm Cốt Phì Nhiêu | F | Nông nghiệp | Nền tảng | +1 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-E | Khởi Cốt Phì Nhiêu | E | Nông nghiệp | Nền tảng | +2 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-D | Kiên Cốt Phì Nhiêu | D | Nông nghiệp | Nền tảng | +3 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-C | Tinh Cốt Phì Nhiêu | C | Nông nghiệp | Nền tảng | +5 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-B | Trác Cốt Phì Nhiêu | B | Nông nghiệp | Nền tảng | +8 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-A | Sử Cốt Phì Nhiêu | A | Nông nghiệp | Nền tảng | +12 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-S | Vương Cốt Phì Nhiêu | S | Nông nghiệp | Nền tảng | +18 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-SS | Thánh Cốt Phì Nhiêu | SS | Nông nghiệp | Nền tảng | +27 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-NT-SSS | Thần Cốt Phì Nhiêu | SSS | Nông nghiệp | Nền tảng | +40 điểm ngân sách chia cho Cảm/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-F | Mầm Cộng Hưởng Phì Nhiêu | F | Nông nghiệp | Khuếch đại | +2% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-E | Khởi Cộng Hưởng Phì Nhiêu | E | Nông nghiệp | Khuếch đại | +3% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-D | Kiên Cộng Hưởng Phì Nhiêu | D | Nông nghiệp | Khuếch đại | +5% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-C | Tinh Cộng Hưởng Phì Nhiêu | C | Nông nghiệp | Khuếch đại | +7% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-B | Trác Cộng Hưởng Phì Nhiêu | B | Nông nghiệp | Khuếch đại | +10% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-A | Sử Cộng Hưởng Phì Nhiêu | A | Nông nghiệp | Khuếch đại | +14% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-S | Vương Cộng Hưởng Phì Nhiêu | S | Nông nghiệp | Khuếch đại | +19% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-SS | Thánh Cộng Hưởng Phì Nhiêu | SS | Nông nghiệp | Khuếch đại | +25% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KD-SSS | Thần Cộng Hưởng Phì Nhiêu | SSS | Nông nghiệp | Khuếch đại | +33% sản lượng mùa vụ và sức khỏe đất; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-F | Mầm Bản Lĩnh Phì Nhiêu | F | Nông nghiệp | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-E | Khởi Bản Lĩnh Phì Nhiêu | E | Nông nghiệp | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-D | Kiên Bản Lĩnh Phì Nhiêu | D | Nông nghiệp | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-C | Tinh Bản Lĩnh Phì Nhiêu | C | Nông nghiệp | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-B | Trác Bản Lĩnh Phì Nhiêu | B | Nông nghiệp | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-A | Sử Bản Lĩnh Phì Nhiêu | A | Nông nghiệp | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-S | Vương Bản Lĩnh Phì Nhiêu | S | Nông nghiệp | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-SS | Thánh Bản Lĩnh Phì Nhiêu | SS | Nông nghiệp | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CM-SSS | Thần Bản Lĩnh Phì Nhiêu | SSS | Nông nghiệp | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-F | Mầm Phản Ứng Phì Nhiêu | F | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-E | Khởi Phản Ứng Phì Nhiêu | E | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-D | Kiên Phản Ứng Phì Nhiêu | D | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-C | Tinh Phản Ứng Phì Nhiêu | C | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-B | Trác Phản Ứng Phì Nhiêu | B | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-A | Sử Phản Ứng Phì Nhiêu | A | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-S | Vương Phản Ứng Phì Nhiêu | S | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-SS | Thánh Phản Ứng Phì Nhiêu | SS | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-KH-SSS | Thần Phản Ứng Phì Nhiêu | SSS | Nông nghiệp | Kích hoạt | Khi hoàn tất chu kỳ canh tác/chăn nuôi: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-F | Mầm Cờ Hiệu Phì Nhiêu | F | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% sản lượng mùa vụ và sức khỏe đất; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-E | Khởi Cờ Hiệu Phì Nhiêu | E | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% sản lượng mùa vụ và sức khỏe đất; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-D | Kiên Cờ Hiệu Phì Nhiêu | D | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% sản lượng mùa vụ và sức khỏe đất; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-C | Tinh Cờ Hiệu Phì Nhiêu | C | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% sản lượng mùa vụ và sức khỏe đất; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-B | Trác Cờ Hiệu Phì Nhiêu | B | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% sản lượng mùa vụ và sức khỏe đất; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-A | Sử Cờ Hiệu Phì Nhiêu | A | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% sản lượng mùa vụ và sức khỏe đất; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-S | Vương Cờ Hiệu Phì Nhiêu | S | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% sản lượng mùa vụ và sức khỏe đất; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-SS | Thánh Cờ Hiệu Phì Nhiêu | SS | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% sản lượng mùa vụ và sức khỏe đất; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-HQ-SSS | Thần Cờ Hiệu Phì Nhiêu | SSS | Nông nghiệp | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% sản lượng mùa vụ và sức khỏe đất; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-F | Mầm Cầu Dẫn Phì Nhiêu | F | Nông nghiệp | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-E | Khởi Cầu Dẫn Phì Nhiêu | E | Nông nghiệp | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-D | Kiên Cầu Dẫn Phì Nhiêu | D | Nông nghiệp | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-C | Tinh Cầu Dẫn Phì Nhiêu | C | Nông nghiệp | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-B | Trác Cầu Dẫn Phì Nhiêu | B | Nông nghiệp | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-A | Sử Cầu Dẫn Phì Nhiêu | A | Nông nghiệp | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-S | Vương Cầu Dẫn Phì Nhiêu | S | Nông nghiệp | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-SS | Thánh Cầu Dẫn Phì Nhiêu | SS | Nông nghiệp | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-CH-SSS | Thần Cầu Dẫn Phì Nhiêu | SSS | Nông nghiệp | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% sát thương tầm xa thành ngân sách cho sản lượng mùa vụ và sức khỏe đất; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-F | Mầm Khế Luật Phì Nhiêu | F | Nông nghiệp | Quy tắc | 1 lần mỗi 240s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-E | Khởi Khế Luật Phì Nhiêu | E | Nông nghiệp | Quy tắc | 1 lần mỗi 210s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-D | Kiên Khế Luật Phì Nhiêu | D | Nông nghiệp | Quy tắc | 1 lần mỗi 180s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-C | Tinh Khế Luật Phì Nhiêu | C | Nông nghiệp | Quy tắc | 1 lần mỗi 150s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-B | Trác Khế Luật Phì Nhiêu | B | Nông nghiệp | Quy tắc | 1 lần mỗi 120s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-A | Sử Khế Luật Phì Nhiêu | A | Nông nghiệp | Quy tắc | 1 lần mỗi 90s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-S | Vương Khế Luật Phì Nhiêu | S | Nông nghiệp | Quy tắc | 1 lần mỗi 60s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-SS | Thánh Khế Luật Phì Nhiêu | SS | Nông nghiệp | Quy tắc | 2 lần mỗi 40s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-QT-SSS | Thần Khế Luật Phì Nhiêu | SSS | Nông nghiệp | Quy tắc | 2 lần mỗi 25s, khi điều kiện nông nghiệp hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-F | Mầm Thăng Hoa Phì Nhiêu | F | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +0.25% sản lượng mùa vụ và sức khỏe đất; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-E | Khởi Thăng Hoa Phì Nhiêu | E | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +0.35% sản lượng mùa vụ và sức khỏe đất; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-D | Kiên Thăng Hoa Phì Nhiêu | D | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +0.50% sản lượng mùa vụ và sức khỏe đất; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-C | Tinh Thăng Hoa Phì Nhiêu | C | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +0.70% sản lượng mùa vụ và sức khỏe đất; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-B | Trác Thăng Hoa Phì Nhiêu | B | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +1.00% sản lượng mùa vụ và sức khỏe đất; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-A | Sử Thăng Hoa Phì Nhiêu | A | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +1.40% sản lượng mùa vụ và sức khỏe đất; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-S | Vương Thăng Hoa Phì Nhiêu | S | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +2.00% sản lượng mùa vụ và sức khỏe đất; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-SS | Thánh Thăng Hoa Phì Nhiêu | SS | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +2.80% sản lượng mùa vụ và sức khỏe đất; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-NONG-TH-SSS | Thần Thăng Hoa Phì Nhiêu | SSS | Nông nghiệp | Tiến hóa | Mỗi khi thu hoạch bền vững hoặc cứu mùa vụ, nhận +4.00% sản lượng mùa vụ và sức khỏe đất; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | dịch, khí hậu, đất kiệt và thiếu nước; tag ECON/FARM |
| TP-HAU-NT-F | Mầm Cốt Tiếp Vận | F | Hậu cần | Nền tảng | +1 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-E | Khởi Cốt Tiếp Vận | E | Hậu cần | Nền tảng | +2 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-D | Kiên Cốt Tiếp Vận | D | Hậu cần | Nền tảng | +3 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-C | Tinh Cốt Tiếp Vận | C | Hậu cần | Nền tảng | +5 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-B | Trác Cốt Tiếp Vận | B | Hậu cần | Nền tảng | +8 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-A | Sử Cốt Tiếp Vận | A | Hậu cần | Nền tảng | +12 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-S | Vương Cốt Tiếp Vận | S | Hậu cần | Nền tảng | +18 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-SS | Thánh Cốt Tiếp Vận | SS | Hậu cần | Nền tảng | +27 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-NT-SSS | Thần Cốt Tiếp Vận | SSS | Hậu cần | Nền tảng | +40 điểm ngân sách chia cho Trí/Ý; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-F | Mầm Cộng Hưởng Tiếp Vận | F | Hậu cần | Khuếch đại | +2% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-E | Khởi Cộng Hưởng Tiếp Vận | E | Hậu cần | Khuếch đại | +3% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-D | Kiên Cộng Hưởng Tiếp Vận | D | Hậu cần | Khuếch đại | +5% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-C | Tinh Cộng Hưởng Tiếp Vận | C | Hậu cần | Khuếch đại | +7% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-B | Trác Cộng Hưởng Tiếp Vận | B | Hậu cần | Khuếch đại | +10% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-A | Sử Cộng Hưởng Tiếp Vận | A | Hậu cần | Khuếch đại | +14% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-S | Vương Cộng Hưởng Tiếp Vận | S | Hậu cần | Khuếch đại | +19% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-SS | Thánh Cộng Hưởng Tiếp Vận | SS | Hậu cần | Khuếch đại | +25% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KD-SSS | Thần Cộng Hưởng Tiếp Vận | SSS | Hậu cần | Khuếch đại | +33% sức chứa, tốc giao và giảm tiêu hao; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-F | Mầm Bản Lĩnh Tiếp Vận | F | Hậu cần | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-E | Khởi Bản Lĩnh Tiếp Vận | E | Hậu cần | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-D | Kiên Bản Lĩnh Tiếp Vận | D | Hậu cần | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-C | Tinh Bản Lĩnh Tiếp Vận | C | Hậu cần | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-B | Trác Bản Lĩnh Tiếp Vận | B | Hậu cần | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-A | Sử Bản Lĩnh Tiếp Vận | A | Hậu cần | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-S | Vương Bản Lĩnh Tiếp Vận | S | Hậu cần | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-SS | Thánh Bản Lĩnh Tiếp Vận | SS | Hậu cần | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CM-SSS | Thần Bản Lĩnh Tiếp Vận | SSS | Hậu cần | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-F | Mầm Phản Ứng Tiếp Vận | F | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-E | Khởi Phản Ứng Tiếp Vận | E | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-D | Kiên Phản Ứng Tiếp Vận | D | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-C | Tinh Phản Ứng Tiếp Vận | C | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-B | Trác Phản Ứng Tiếp Vận | B | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-A | Sử Phản Ứng Tiếp Vận | A | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-S | Vương Phản Ứng Tiếp Vận | S | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-SS | Thánh Phản Ứng Tiếp Vận | SS | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-KH-SSS | Thần Phản Ứng Tiếp Vận | SSS | Hậu cần | Kích hoạt | Khi giao hàng đúng hạn hoặc duy trì tuyến: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-F | Mầm Cờ Hiệu Tiếp Vận | F | Hậu cần | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% sức chứa, tốc giao và giảm tiêu hao; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-E | Khởi Cờ Hiệu Tiếp Vận | E | Hậu cần | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% sức chứa, tốc giao và giảm tiêu hao; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-D | Kiên Cờ Hiệu Tiếp Vận | D | Hậu cần | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% sức chứa, tốc giao và giảm tiêu hao; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-C | Tinh Cờ Hiệu Tiếp Vận | C | Hậu cần | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% sức chứa, tốc giao và giảm tiêu hao; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-B | Trác Cờ Hiệu Tiếp Vận | B | Hậu cần | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% sức chứa, tốc giao và giảm tiêu hao; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-A | Sử Cờ Hiệu Tiếp Vận | A | Hậu cần | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% sức chứa, tốc giao và giảm tiêu hao; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-S | Vương Cờ Hiệu Tiếp Vận | S | Hậu cần | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% sức chứa, tốc giao và giảm tiêu hao; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-SS | Thánh Cờ Hiệu Tiếp Vận | SS | Hậu cần | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% sức chứa, tốc giao và giảm tiêu hao; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-HQ-SSS | Thần Cờ Hiệu Tiếp Vận | SSS | Hậu cần | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% sức chứa, tốc giao và giảm tiêu hao; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-F | Mầm Cầu Dẫn Tiếp Vận | F | Hậu cần | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-E | Khởi Cầu Dẫn Tiếp Vận | E | Hậu cần | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-D | Kiên Cầu Dẫn Tiếp Vận | D | Hậu cần | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-C | Tinh Cầu Dẫn Tiếp Vận | C | Hậu cần | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-B | Trác Cầu Dẫn Tiếp Vận | B | Hậu cần | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-A | Sử Cầu Dẫn Tiếp Vận | A | Hậu cần | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-S | Vương Cầu Dẫn Tiếp Vận | S | Hậu cần | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-SS | Thánh Cầu Dẫn Tiếp Vận | SS | Hậu cần | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-CH-SSS | Thần Cầu Dẫn Tiếp Vận | SSS | Hậu cần | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% công suất phép thành ngân sách cho sức chứa, tốc giao và giảm tiêu hao; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-F | Mầm Khế Luật Tiếp Vận | F | Hậu cần | Quy tắc | 1 lần mỗi 240s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-E | Khởi Khế Luật Tiếp Vận | E | Hậu cần | Quy tắc | 1 lần mỗi 210s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-D | Kiên Khế Luật Tiếp Vận | D | Hậu cần | Quy tắc | 1 lần mỗi 180s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-C | Tinh Khế Luật Tiếp Vận | C | Hậu cần | Quy tắc | 1 lần mỗi 150s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-B | Trác Khế Luật Tiếp Vận | B | Hậu cần | Quy tắc | 1 lần mỗi 120s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-A | Sử Khế Luật Tiếp Vận | A | Hậu cần | Quy tắc | 1 lần mỗi 90s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-S | Vương Khế Luật Tiếp Vận | S | Hậu cần | Quy tắc | 1 lần mỗi 60s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-SS | Thánh Khế Luật Tiếp Vận | SS | Hậu cần | Quy tắc | 2 lần mỗi 40s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-QT-SSS | Thần Khế Luật Tiếp Vận | SSS | Hậu cần | Quy tắc | 2 lần mỗi 25s, khi điều kiện hậu cần hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-F | Mầm Thăng Hoa Tiếp Vận | F | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +0.25% sức chứa, tốc giao và giảm tiêu hao; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-E | Khởi Thăng Hoa Tiếp Vận | E | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +0.35% sức chứa, tốc giao và giảm tiêu hao; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-D | Kiên Thăng Hoa Tiếp Vận | D | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +0.50% sức chứa, tốc giao và giảm tiêu hao; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-C | Tinh Thăng Hoa Tiếp Vận | C | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +0.70% sức chứa, tốc giao và giảm tiêu hao; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-B | Trác Thăng Hoa Tiếp Vận | B | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +1.00% sức chứa, tốc giao và giảm tiêu hao; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-A | Sử Thăng Hoa Tiếp Vận | A | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +1.40% sức chứa, tốc giao và giảm tiêu hao; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-S | Vương Thăng Hoa Tiếp Vận | S | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +2.00% sức chứa, tốc giao và giảm tiêu hao; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-SS | Thánh Thăng Hoa Tiếp Vận | SS | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +2.80% sức chứa, tốc giao và giảm tiêu hao; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-HAU-TH-SSS | Thần Thăng Hoa Tiếp Vận | SSS | Hậu cần | Tiến hóa | Mỗi khi tiếp tế chiến dịch hoặc giải cổ chai, nhận +4.00% sức chứa, tốc giao và giảm tiêu hao; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | phong tỏa, địa hình, hư hao và phục kích; tag ARMY/LOGISTICS |
| TP-KINH-NT-F | Mầm Cốt Thương Mạch | F | Kinh tế | Nền tảng | +1 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-E | Khởi Cốt Thương Mạch | E | Kinh tế | Nền tảng | +2 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-D | Kiên Cốt Thương Mạch | D | Kinh tế | Nền tảng | +3 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-C | Tinh Cốt Thương Mạch | C | Kinh tế | Nền tảng | +5 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-B | Trác Cốt Thương Mạch | B | Kinh tế | Nền tảng | +8 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-A | Sử Cốt Thương Mạch | A | Kinh tế | Nền tảng | +12 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-S | Vương Cốt Thương Mạch | S | Kinh tế | Nền tảng | +18 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-SS | Thánh Cốt Thương Mạch | SS | Kinh tế | Nền tảng | +27 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-NT-SSS | Thần Cốt Thương Mạch | SSS | Kinh tế | Nền tảng | +40 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-F | Mầm Cộng Hưởng Thương Mạch | F | Kinh tế | Khuếch đại | +2% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-E | Khởi Cộng Hưởng Thương Mạch | E | Kinh tế | Khuếch đại | +3% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-D | Kiên Cộng Hưởng Thương Mạch | D | Kinh tế | Khuếch đại | +5% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-C | Tinh Cộng Hưởng Thương Mạch | C | Kinh tế | Khuếch đại | +7% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-B | Trác Cộng Hưởng Thương Mạch | B | Kinh tế | Khuếch đại | +10% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-A | Sử Cộng Hưởng Thương Mạch | A | Kinh tế | Khuếch đại | +14% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-S | Vương Cộng Hưởng Thương Mạch | S | Kinh tế | Khuếch đại | +19% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-SS | Thánh Cộng Hưởng Thương Mạch | SS | Kinh tế | Khuếch đại | +25% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KD-SSS | Thần Cộng Hưởng Thương Mạch | SSS | Kinh tế | Khuếch đại | +33% hiệu suất giao dịch và lưu chuyển vốn; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-F | Mầm Bản Lĩnh Thương Mạch | F | Kinh tế | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-E | Khởi Bản Lĩnh Thương Mạch | E | Kinh tế | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-D | Kiên Bản Lĩnh Thương Mạch | D | Kinh tế | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-C | Tinh Bản Lĩnh Thương Mạch | C | Kinh tế | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-B | Trác Bản Lĩnh Thương Mạch | B | Kinh tế | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-A | Sử Bản Lĩnh Thương Mạch | A | Kinh tế | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-S | Vương Bản Lĩnh Thương Mạch | S | Kinh tế | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-SS | Thánh Bản Lĩnh Thương Mạch | SS | Kinh tế | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CM-SSS | Thần Bản Lĩnh Thương Mạch | SSS | Kinh tế | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-F | Mầm Phản Ứng Thương Mạch | F | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-E | Khởi Phản Ứng Thương Mạch | E | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-D | Kiên Phản Ứng Thương Mạch | D | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-C | Tinh Phản Ứng Thương Mạch | C | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-B | Trác Phản Ứng Thương Mạch | B | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-A | Sử Phản Ứng Thương Mạch | A | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-S | Vương Phản Ứng Thương Mạch | S | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-SS | Thánh Phản Ứng Thương Mạch | SS | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-KH-SSS | Thần Phản Ứng Thương Mạch | SSS | Kinh tế | Kích hoạt | Khi hoàn tất giao dịch có đối tác độc lập: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-F | Mầm Cờ Hiệu Thương Mạch | F | Kinh tế | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% hiệu suất giao dịch và lưu chuyển vốn; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-E | Khởi Cờ Hiệu Thương Mạch | E | Kinh tế | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% hiệu suất giao dịch và lưu chuyển vốn; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-D | Kiên Cờ Hiệu Thương Mạch | D | Kinh tế | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% hiệu suất giao dịch và lưu chuyển vốn; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-C | Tinh Cờ Hiệu Thương Mạch | C | Kinh tế | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% hiệu suất giao dịch và lưu chuyển vốn; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-B | Trác Cờ Hiệu Thương Mạch | B | Kinh tế | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% hiệu suất giao dịch và lưu chuyển vốn; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-A | Sử Cờ Hiệu Thương Mạch | A | Kinh tế | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% hiệu suất giao dịch và lưu chuyển vốn; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-S | Vương Cờ Hiệu Thương Mạch | S | Kinh tế | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% hiệu suất giao dịch và lưu chuyển vốn; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-SS | Thánh Cờ Hiệu Thương Mạch | SS | Kinh tế | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% hiệu suất giao dịch và lưu chuyển vốn; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-HQ-SSS | Thần Cờ Hiệu Thương Mạch | SSS | Kinh tế | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% hiệu suất giao dịch và lưu chuyển vốn; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-F | Mầm Cầu Dẫn Thương Mạch | F | Kinh tế | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-E | Khởi Cầu Dẫn Thương Mạch | E | Kinh tế | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-D | Kiên Cầu Dẫn Thương Mạch | D | Kinh tế | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-C | Tinh Cầu Dẫn Thương Mạch | C | Kinh tế | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-B | Trác Cầu Dẫn Thương Mạch | B | Kinh tế | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-A | Sử Cầu Dẫn Thương Mạch | A | Kinh tế | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-S | Vương Cầu Dẫn Thương Mạch | S | Kinh tế | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-SS | Thánh Cầu Dẫn Thương Mạch | SS | Kinh tế | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-CH-SSS | Thần Cầu Dẫn Thương Mạch | SSS | Kinh tế | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% HP tối đa thành ngân sách cho hiệu suất giao dịch và lưu chuyển vốn; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-F | Mầm Khế Luật Thương Mạch | F | Kinh tế | Quy tắc | 1 lần mỗi 240s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-E | Khởi Khế Luật Thương Mạch | E | Kinh tế | Quy tắc | 1 lần mỗi 210s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-D | Kiên Khế Luật Thương Mạch | D | Kinh tế | Quy tắc | 1 lần mỗi 180s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-C | Tinh Khế Luật Thương Mạch | C | Kinh tế | Quy tắc | 1 lần mỗi 150s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-B | Trác Khế Luật Thương Mạch | B | Kinh tế | Quy tắc | 1 lần mỗi 120s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-A | Sử Khế Luật Thương Mạch | A | Kinh tế | Quy tắc | 1 lần mỗi 90s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-S | Vương Khế Luật Thương Mạch | S | Kinh tế | Quy tắc | 1 lần mỗi 60s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-SS | Thánh Khế Luật Thương Mạch | SS | Kinh tế | Quy tắc | 2 lần mỗi 40s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-QT-SSS | Thần Khế Luật Thương Mạch | SSS | Kinh tế | Quy tắc | 2 lần mỗi 25s, khi điều kiện kinh tế hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-F | Mầm Thăng Hoa Thương Mạch | F | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +0.25% hiệu suất giao dịch và lưu chuyển vốn; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-E | Khởi Thăng Hoa Thương Mạch | E | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +0.35% hiệu suất giao dịch và lưu chuyển vốn; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-D | Kiên Thăng Hoa Thương Mạch | D | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +0.50% hiệu suất giao dịch và lưu chuyển vốn; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-C | Tinh Thăng Hoa Thương Mạch | C | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +0.70% hiệu suất giao dịch và lưu chuyển vốn; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-B | Trác Thăng Hoa Thương Mạch | B | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +1.00% hiệu suất giao dịch và lưu chuyển vốn; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-A | Sử Thăng Hoa Thương Mạch | A | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +1.40% hiệu suất giao dịch và lưu chuyển vốn; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-S | Vương Thăng Hoa Thương Mạch | S | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +2.00% hiệu suất giao dịch và lưu chuyển vốn; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-SS | Thánh Thăng Hoa Thương Mạch | SS | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +2.80% hiệu suất giao dịch và lưu chuyển vốn; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-KINH-TH-SSS | Thần Thăng Hoa Thương Mạch | SSS | Kinh tế | Tiến hóa | Mỗi khi mở thị trường/tuyến hoặc hoàn tất hợp đồng, nhận +4.00% hiệu suất giao dịch và lưu chuyển vốn; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | cấm vận, tín dụng xấu, sốc giá và độc quyền; tag ECON/TRADE |
| TP-QUAN-NT-F | Mầm Cốt Trật Tự | F | Quản trị | Nền tảng | +1 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-E | Khởi Cốt Trật Tự | E | Quản trị | Nền tảng | +2 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-D | Kiên Cốt Trật Tự | D | Quản trị | Nền tảng | +3 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-C | Tinh Cốt Trật Tự | C | Quản trị | Nền tảng | +5 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-B | Trác Cốt Trật Tự | B | Quản trị | Nền tảng | +8 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-A | Sử Cốt Trật Tự | A | Quản trị | Nền tảng | +12 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-S | Vương Cốt Trật Tự | S | Quản trị | Nền tảng | +18 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-SS | Thánh Cốt Trật Tự | SS | Quản trị | Nền tảng | +27 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-NT-SSS | Thần Cốt Trật Tự | SSS | Quản trị | Nền tảng | +40 điểm ngân sách chia cho Trí/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-F | Mầm Cộng Hưởng Trật Tự | F | Quản trị | Khuếch đại | +2% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-E | Khởi Cộng Hưởng Trật Tự | E | Quản trị | Khuếch đại | +3% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-D | Kiên Cộng Hưởng Trật Tự | D | Quản trị | Khuếch đại | +5% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-C | Tinh Cộng Hưởng Trật Tự | C | Quản trị | Khuếch đại | +7% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-B | Trác Cộng Hưởng Trật Tự | B | Quản trị | Khuếch đại | +10% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-A | Sử Cộng Hưởng Trật Tự | A | Quản trị | Khuếch đại | +14% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-S | Vương Cộng Hưởng Trật Tự | S | Quản trị | Khuếch đại | +19% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-SS | Thánh Cộng Hưởng Trật Tự | SS | Quản trị | Khuếch đại | +25% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KD-SSS | Thần Cộng Hưởng Trật Tự | SSS | Quản trị | Khuếch đại | +33% giảm thất thoát và tăng năng lực hành chính; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-F | Mầm Bản Lĩnh Trật Tự | F | Quản trị | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-E | Khởi Bản Lĩnh Trật Tự | E | Quản trị | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-D | Kiên Bản Lĩnh Trật Tự | D | Quản trị | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-C | Tinh Bản Lĩnh Trật Tự | C | Quản trị | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-B | Trác Bản Lĩnh Trật Tự | B | Quản trị | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-A | Sử Bản Lĩnh Trật Tự | A | Quản trị | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-S | Vương Bản Lĩnh Trật Tự | S | Quản trị | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-SS | Thánh Bản Lĩnh Trật Tự | SS | Quản trị | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CM-SSS | Thần Bản Lĩnh Trật Tự | SSS | Quản trị | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-F | Mầm Phản Ứng Trật Tự | F | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-E | Khởi Phản Ứng Trật Tự | E | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-D | Kiên Phản Ứng Trật Tự | D | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-C | Tinh Phản Ứng Trật Tự | C | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-B | Trác Phản Ứng Trật Tự | B | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-A | Sử Phản Ứng Trật Tự | A | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-S | Vương Phản Ứng Trật Tự | S | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-SS | Thánh Phản Ứng Trật Tự | SS | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-KH-SSS | Thần Phản Ứng Trật Tự | SSS | Quản trị | Kích hoạt | Khi giải quyết hồ sơ hoặc khủng hoảng công: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-F | Mầm Cờ Hiệu Trật Tự | F | Quản trị | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% giảm thất thoát và tăng năng lực hành chính; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-E | Khởi Cờ Hiệu Trật Tự | E | Quản trị | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% giảm thất thoát và tăng năng lực hành chính; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-D | Kiên Cờ Hiệu Trật Tự | D | Quản trị | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% giảm thất thoát và tăng năng lực hành chính; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-C | Tinh Cờ Hiệu Trật Tự | C | Quản trị | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% giảm thất thoát và tăng năng lực hành chính; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-B | Trác Cờ Hiệu Trật Tự | B | Quản trị | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% giảm thất thoát và tăng năng lực hành chính; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-A | Sử Cờ Hiệu Trật Tự | A | Quản trị | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% giảm thất thoát và tăng năng lực hành chính; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-S | Vương Cờ Hiệu Trật Tự | S | Quản trị | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% giảm thất thoát và tăng năng lực hành chính; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-SS | Thánh Cờ Hiệu Trật Tự | SS | Quản trị | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% giảm thất thoát và tăng năng lực hành chính; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-HQ-SSS | Thần Cờ Hiệu Trật Tự | SSS | Quản trị | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% giảm thất thoát và tăng năng lực hành chính; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-F | Mầm Cầu Dẫn Trật Tự | F | Quản trị | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-E | Khởi Cầu Dẫn Trật Tự | E | Quản trị | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-D | Kiên Cầu Dẫn Trật Tự | D | Quản trị | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-C | Tinh Cầu Dẫn Trật Tự | C | Quản trị | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-B | Trác Cầu Dẫn Trật Tự | B | Quản trị | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-A | Sử Cầu Dẫn Trật Tự | A | Quản trị | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-S | Vương Cầu Dẫn Trật Tự | S | Quản trị | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-SS | Thánh Cầu Dẫn Trật Tự | SS | Quản trị | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-CH-SSS | Thần Cầu Dẫn Trật Tự | SSS | Quản trị | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% crit thành ngân sách cho giảm thất thoát và tăng năng lực hành chính; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-F | Mầm Khế Luật Trật Tự | F | Quản trị | Quy tắc | 1 lần mỗi 240s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-E | Khởi Khế Luật Trật Tự | E | Quản trị | Quy tắc | 1 lần mỗi 210s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-D | Kiên Khế Luật Trật Tự | D | Quản trị | Quy tắc | 1 lần mỗi 180s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-C | Tinh Khế Luật Trật Tự | C | Quản trị | Quy tắc | 1 lần mỗi 150s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-B | Trác Khế Luật Trật Tự | B | Quản trị | Quy tắc | 1 lần mỗi 120s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-A | Sử Khế Luật Trật Tự | A | Quản trị | Quy tắc | 1 lần mỗi 90s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-S | Vương Khế Luật Trật Tự | S | Quản trị | Quy tắc | 1 lần mỗi 60s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-SS | Thánh Khế Luật Trật Tự | SS | Quản trị | Quy tắc | 2 lần mỗi 40s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-QT-SSS | Thần Khế Luật Trật Tự | SSS | Quản trị | Quy tắc | 2 lần mỗi 25s, khi điều kiện quản trị hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-F | Mầm Thăng Hoa Trật Tự | F | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +0.25% giảm thất thoát và tăng năng lực hành chính; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-E | Khởi Thăng Hoa Trật Tự | E | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +0.35% giảm thất thoát và tăng năng lực hành chính; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-D | Kiên Thăng Hoa Trật Tự | D | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +0.50% giảm thất thoát và tăng năng lực hành chính; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-C | Tinh Thăng Hoa Trật Tự | C | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +0.70% giảm thất thoát và tăng năng lực hành chính; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-B | Trác Thăng Hoa Trật Tự | B | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +1.00% giảm thất thoát và tăng năng lực hành chính; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-A | Sử Thăng Hoa Trật Tự | A | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +1.40% giảm thất thoát và tăng năng lực hành chính; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-S | Vương Thăng Hoa Trật Tự | S | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +2.00% giảm thất thoát và tăng năng lực hành chính; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-SS | Thánh Thăng Hoa Trật Tự | SS | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +2.80% giảm thất thoát và tăng năng lực hành chính; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-QUAN-TH-SSS | Thần Thăng Hoa Trật Tự | SSS | Quản trị | Tiến hóa | Mỗi khi đạt KPI dịch vụ mà không tăng bất mãn, nhận +4.00% giảm thất thoát và tăng năng lực hành chính; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | tham nhũng, phe phái, quá tải và thiếu chính danh; tag TERRITORY/GOV |
| TP-NGOAI-NT-F | Mầm Cốt Đồng Minh | F | Ngoại giao | Nền tảng | +1 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-E | Khởi Cốt Đồng Minh | E | Ngoại giao | Nền tảng | +2 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-D | Kiên Cốt Đồng Minh | D | Ngoại giao | Nền tảng | +3 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-C | Tinh Cốt Đồng Minh | C | Ngoại giao | Nền tảng | +5 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-B | Trác Cốt Đồng Minh | B | Ngoại giao | Nền tảng | +8 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-A | Sử Cốt Đồng Minh | A | Ngoại giao | Nền tảng | +12 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-S | Vương Cốt Đồng Minh | S | Ngoại giao | Nền tảng | +18 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-SS | Thánh Cốt Đồng Minh | SS | Ngoại giao | Nền tảng | +27 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-NT-SSS | Thần Cốt Đồng Minh | SSS | Ngoại giao | Nền tảng | +40 điểm ngân sách chia cho Hiện diện/Cảm; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-F | Mầm Cộng Hưởng Đồng Minh | F | Ngoại giao | Khuếch đại | +2% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-E | Khởi Cộng Hưởng Đồng Minh | E | Ngoại giao | Khuếch đại | +3% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-D | Kiên Cộng Hưởng Đồng Minh | D | Ngoại giao | Khuếch đại | +5% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-C | Tinh Cộng Hưởng Đồng Minh | C | Ngoại giao | Khuếch đại | +7% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-B | Trác Cộng Hưởng Đồng Minh | B | Ngoại giao | Khuếch đại | +10% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-A | Sử Cộng Hưởng Đồng Minh | A | Ngoại giao | Khuếch đại | +14% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-S | Vương Cộng Hưởng Đồng Minh | S | Ngoại giao | Khuếch đại | +19% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-SS | Thánh Cộng Hưởng Đồng Minh | SS | Ngoại giao | Khuếch đại | +25% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KD-SSS | Thần Cộng Hưởng Đồng Minh | SSS | Ngoại giao | Khuếch đại | +33% độ tin cậy, thông tin và giá trị hiệp ước; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-F | Mầm Bản Lĩnh Đồng Minh | F | Ngoại giao | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-E | Khởi Bản Lĩnh Đồng Minh | E | Ngoại giao | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-D | Kiên Bản Lĩnh Đồng Minh | D | Ngoại giao | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-C | Tinh Bản Lĩnh Đồng Minh | C | Ngoại giao | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-B | Trác Bản Lĩnh Đồng Minh | B | Ngoại giao | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-A | Sử Bản Lĩnh Đồng Minh | A | Ngoại giao | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-S | Vương Bản Lĩnh Đồng Minh | S | Ngoại giao | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-SS | Thánh Bản Lĩnh Đồng Minh | SS | Ngoại giao | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CM-SSS | Thần Bản Lĩnh Đồng Minh | SSS | Ngoại giao | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-F | Mầm Phản Ứng Đồng Minh | F | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-E | Khởi Phản Ứng Đồng Minh | E | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-D | Kiên Phản Ứng Đồng Minh | D | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-C | Tinh Phản Ứng Đồng Minh | C | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-B | Trác Phản Ứng Đồng Minh | B | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-A | Sử Phản Ứng Đồng Minh | A | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-S | Vương Phản Ứng Đồng Minh | S | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-SS | Thánh Phản Ứng Đồng Minh | SS | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-KH-SSS | Thần Phản Ứng Đồng Minh | SSS | Ngoại giao | Kích hoạt | Khi hoàn tất cam kết với chủ thể độc lập: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-F | Mầm Cờ Hiệu Đồng Minh | F | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-E | Khởi Cờ Hiệu Đồng Minh | E | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-D | Kiên Cờ Hiệu Đồng Minh | D | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-C | Tinh Cờ Hiệu Đồng Minh | C | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-B | Trác Cờ Hiệu Đồng Minh | B | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-A | Sử Cờ Hiệu Đồng Minh | A | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-S | Vương Cờ Hiệu Đồng Minh | S | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-SS | Thánh Cờ Hiệu Đồng Minh | SS | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-HQ-SSS | Thần Cờ Hiệu Đồng Minh | SSS | Ngoại giao | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% độ tin cậy, thông tin và giá trị hiệp ước; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-F | Mầm Cầu Dẫn Đồng Minh | F | Ngoại giao | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-E | Khởi Cầu Dẫn Đồng Minh | E | Ngoại giao | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-D | Kiên Cầu Dẫn Đồng Minh | D | Ngoại giao | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-C | Tinh Cầu Dẫn Đồng Minh | C | Ngoại giao | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-B | Trác Cầu Dẫn Đồng Minh | B | Ngoại giao | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-A | Sử Cầu Dẫn Đồng Minh | A | Ngoại giao | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-S | Vương Cầu Dẫn Đồng Minh | S | Ngoại giao | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-SS | Thánh Cầu Dẫn Đồng Minh | SS | Ngoại giao | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-CH-SSS | Thần Cầu Dẫn Đồng Minh | SSS | Ngoại giao | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% phòng thủ cá nhân thành ngân sách cho độ tin cậy, thông tin và giá trị hiệp ước; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-F | Mầm Khế Luật Đồng Minh | F | Ngoại giao | Quy tắc | 1 lần mỗi 240s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-E | Khởi Khế Luật Đồng Minh | E | Ngoại giao | Quy tắc | 1 lần mỗi 210s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-D | Kiên Khế Luật Đồng Minh | D | Ngoại giao | Quy tắc | 1 lần mỗi 180s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-C | Tinh Khế Luật Đồng Minh | C | Ngoại giao | Quy tắc | 1 lần mỗi 150s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-B | Trác Khế Luật Đồng Minh | B | Ngoại giao | Quy tắc | 1 lần mỗi 120s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-A | Sử Khế Luật Đồng Minh | A | Ngoại giao | Quy tắc | 1 lần mỗi 90s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-S | Vương Khế Luật Đồng Minh | S | Ngoại giao | Quy tắc | 1 lần mỗi 60s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-SS | Thánh Khế Luật Đồng Minh | SS | Ngoại giao | Quy tắc | 2 lần mỗi 40s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-QT-SSS | Thần Khế Luật Đồng Minh | SSS | Ngoại giao | Quy tắc | 2 lần mỗi 25s, khi điều kiện ngoại giao hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-F | Mầm Thăng Hoa Đồng Minh | F | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +0.25% độ tin cậy, thông tin và giá trị hiệp ước; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-E | Khởi Thăng Hoa Đồng Minh | E | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +0.35% độ tin cậy, thông tin và giá trị hiệp ước; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-D | Kiên Thăng Hoa Đồng Minh | D | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +0.50% độ tin cậy, thông tin và giá trị hiệp ước; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-C | Tinh Thăng Hoa Đồng Minh | C | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +0.70% độ tin cậy, thông tin và giá trị hiệp ước; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-B | Trác Thăng Hoa Đồng Minh | B | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +1.00% độ tin cậy, thông tin và giá trị hiệp ước; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-A | Sử Thăng Hoa Đồng Minh | A | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +1.40% độ tin cậy, thông tin và giá trị hiệp ước; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-S | Vương Thăng Hoa Đồng Minh | S | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +2.00% độ tin cậy, thông tin và giá trị hiệp ước; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-SS | Thánh Thăng Hoa Đồng Minh | SS | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +2.80% độ tin cậy, thông tin và giá trị hiệp ước; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-NGOAI-TH-SSS | Thần Thăng Hoa Đồng Minh | SSS | Ngoại giao | Tiến hóa | Mỗi khi hòa giải, ký hiệp ước hoặc giữ lời khó, nhận +4.00% độ tin cậy, thông tin và giá trị hiệp ước; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | bằng chứng phản bội, lợi ích xung đột và tuyên truyền; tag SOCIAL/DIPLOMACY |
| TP-TRIEU-NT-F | Mầm Cốt Khế Triệu | F | Triệu hoán | Nền tảng | +1 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-E | Khởi Cốt Khế Triệu | E | Triệu hoán | Nền tảng | +2 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-D | Kiên Cốt Khế Triệu | D | Triệu hoán | Nền tảng | +3 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 4 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-C | Tinh Cốt Khế Triệu | C | Triệu hoán | Nền tảng | +5 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 7 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-B | Trác Cốt Khế Triệu | B | Triệu hoán | Nền tảng | +8 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 12 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-A | Sử Cốt Khế Triệu | A | Triệu hoán | Nền tảng | +12 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 20 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-S | Vương Cốt Khế Triệu | S | Triệu hoán | Nền tảng | +18 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 32 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-SS | Thánh Cốt Khế Triệu | SS | Triệu hoán | Nền tảng | +27 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 50 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-NT-SSS | Thần Cốt Khế Triệu | SSS | Triệu hoán | Nền tảng | +40 điểm ngân sách chia cho Linh/Hiện diện; điểm này là nguồn TAL-FLAT và không nhân lại bởi chính thiên phú. | 80 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-F | Mầm Cộng Hưởng Khế Triệu | F | Triệu hoán | Khuếch đại | +2% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-E | Khởi Cộng Hưởng Khế Triệu | E | Triệu hoán | Khuếch đại | +3% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-D | Kiên Cộng Hưởng Khế Triệu | D | Triệu hoán | Khuếch đại | +5% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 4 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-C | Tinh Cộng Hưởng Khế Triệu | C | Triệu hoán | Khuếch đại | +7% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 8 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-B | Trác Cộng Hưởng Khế Triệu | B | Triệu hoán | Khuếch đại | +10% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 13 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-A | Sử Cộng Hưởng Khế Triệu | A | Triệu hoán | Khuếch đại | +14% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 22 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-S | Vương Cộng Hưởng Khế Triệu | S | Triệu hoán | Khuếch đại | +19% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 35 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-SS | Thánh Cộng Hưởng Khế Triệu | SS | Triệu hoán | Khuếch đại | +25% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 55 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KD-SSS | Thần Cộng Hưởng Khế Triệu | SSS | Triệu hoán | Khuếch đại | +33% command cap, ổn định và hiệu quả triệu hồi; cộng trong bucket TAL-A, soft-cap chung 60%. | 88 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-F | Mầm Bản Lĩnh Khế Triệu | F | Triệu hoán | Chuyên môn | +3% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-E | Khởi Bản Lĩnh Khế Triệu | E | Triệu hoán | Chuyên môn | +5% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-D | Kiên Bản Lĩnh Khế Triệu | D | Triệu hoán | Chuyên môn | +8% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 4 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-C | Tinh Bản Lĩnh Khế Triệu | C | Triệu hoán | Chuyên môn | +12% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 6 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-B | Trác Bản Lĩnh Khế Triệu | B | Triệu hoán | Chuyên môn | +18% tốc tăng thông thạo liên quan; +1 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 11 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-A | Sử Bản Lĩnh Khế Triệu | A | Triệu hoán | Chuyên môn | +26% tốc tăng thông thạo liên quan; +2 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 18 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-S | Vương Bản Lĩnh Khế Triệu | S | Triệu hoán | Chuyên môn | +36% tốc tăng thông thạo liên quan; +3 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 29 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-SS | Thánh Bản Lĩnh Khế Triệu | SS | Triệu hoán | Chuyên môn | +48% tốc tăng thông thạo liên quan; +4 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 45 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CM-SSS | Thần Bản Lĩnh Khế Triệu | SSS | Triệu hoán | Chuyên môn | +62% tốc tăng thông thạo liên quan; +5 điểm kiểm định chất lượng, không vượt cấp cơ sở vật chất. | 72 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-F | Mầm Phản Ứng Khế Triệu | F | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 4% kích hoạt +20% hiệu quả cho lần kế; hồi nội bộ 20s, không proc từ proc. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-E | Khởi Phản Ứng Khế Triệu | E | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 5% kích hoạt +25% hiệu quả cho lần kế; hồi nội bộ 18s, không proc từ proc. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-D | Kiên Phản Ứng Khế Triệu | D | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 6% kích hoạt +30% hiệu quả cho lần kế; hồi nội bộ 16s, không proc từ proc. | 5 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-C | Tinh Phản Ứng Khế Triệu | C | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 7% kích hoạt +40% hiệu quả cho lần kế; hồi nội bộ 14s, không proc từ proc. | 8 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-B | Trác Phản Ứng Khế Triệu | B | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 8% kích hoạt +50% hiệu quả cho lần kế; hồi nội bộ 12s, không proc từ proc. | 14 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-A | Sử Phản Ứng Khế Triệu | A | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 9% kích hoạt +65% hiệu quả cho lần kế; hồi nội bộ 10s, không proc từ proc. | 23 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-S | Vương Phản Ứng Khế Triệu | S | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 10% kích hoạt +80% hiệu quả cho lần kế; hồi nội bộ 8s, không proc từ proc. | 37 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-SS | Thánh Phản Ứng Khế Triệu | SS | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 11% kích hoạt +100% hiệu quả cho lần kế; hồi nội bộ 6s, không proc từ proc. | 57 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-KH-SSS | Thần Phản Ứng Khế Triệu | SSS | Triệu hoán | Kích hoạt | Khi triệu hồi tham gia mục tiêu hợp lệ: 12% kích hoạt +125% hiệu quả cho lần kế; hồi nội bộ 4s, không proc từ proc. | 92 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-F | Mầm Cờ Hiệu Khế Triệu | F | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 8 m nhận +1% command cap, ổn định và hiệu quả triệu hồi; tối đa 4 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-E | Khởi Cờ Hiệu Khế Triệu | E | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 10 m nhận +2% command cap, ổn định và hiệu quả triệu hồi; tối đa 6 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 3 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-D | Kiên Cờ Hiệu Khế Triệu | D | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 12 m nhận +3% command cap, ổn định và hiệu quả triệu hồi; tối đa 8 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 5 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-C | Tinh Cờ Hiệu Khế Triệu | C | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 15 m nhận +4% command cap, ổn định và hiệu quả triệu hồi; tối đa 10 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 9 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-B | Trác Cờ Hiệu Khế Triệu | B | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 18 m nhận +6% command cap, ổn định và hiệu quả triệu hồi; tối đa 12 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 15 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-A | Sử Cờ Hiệu Khế Triệu | A | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 22 m nhận +8% command cap, ổn định và hiệu quả triệu hồi; tối đa 14 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 25 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-S | Vương Cờ Hiệu Khế Triệu | S | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 27 m nhận +11% command cap, ổn định và hiệu quả triệu hồi; tối đa 16 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 40 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-SS | Thánh Cờ Hiệu Khế Triệu | SS | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 33 m nhận +15% command cap, ổn định và hiệu quả triệu hồi; tối đa 18 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 63 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-HQ-SSS | Thần Cờ Hiệu Khế Triệu | SSS | Triệu hoán | Hào quang | Đồng minh hợp lệ trong 40 m nhận +20% command cap, ổn định và hiệu quả triệu hồi; tối đa 20 mục tiêu, nhiều aura cùng ID chỉ lấy cao nhất. | 100 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-F | Mầm Cầu Dẫn Khế Triệu | F | Triệu hoán | Chuyển hóa | Chuyển tối đa 2% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-E | Khởi Cầu Dẫn Khế Triệu | E | Triệu hoán | Chuyển hóa | Chuyển tối đa 3% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-D | Kiên Cầu Dẫn Khế Triệu | D | Triệu hoán | Chuyển hóa | Chuyển tối đa 4% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 5 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-C | Tinh Cầu Dẫn Khế Triệu | C | Triệu hoán | Chuyển hóa | Chuyển tối đa 6% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 8 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-B | Trác Cầu Dẫn Khế Triệu | B | Triệu hoán | Chuyển hóa | Chuyển tối đa 8% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 14 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-A | Sử Cầu Dẫn Khế Triệu | A | Triệu hoán | Chuyển hóa | Chuyển tối đa 11% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 24 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-S | Vương Cầu Dẫn Khế Triệu | S | Triệu hoán | Chuyển hóa | Chuyển tối đa 15% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 38 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-SS | Thánh Cầu Dẫn Khế Triệu | SS | Triệu hoán | Chuyển hóa | Chuyển tối đa 20% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 60 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-CH-SSS | Thần Cầu Dẫn Khế Triệu | SSS | Triệu hoán | Chuyển hóa | Chuyển tối đa 26% giá trị từ 5% HP/mana của chủ thành ngân sách cho command cap, ổn định và hiệu quả triệu hồi; không thể làm chỉ số nguồn dưới 70% gốc. | 96 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-F | Mầm Khế Luật Khế Triệu | F | Triệu hoán | Quy tắc | 1 lần mỗi 240s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 2 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-E | Khởi Khế Luật Khế Triệu | E | Triệu hoán | Quy tắc | 1 lần mỗi 210s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 3 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-D | Kiên Khế Luật Khế Triệu | D | Triệu hoán | Quy tắc | 1 lần mỗi 180s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 6 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-C | Tinh Khế Luật Khế Triệu | C | Triệu hoán | Quy tắc | 1 lần mỗi 150s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 11 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-B | Trác Khế Luật Khế Triệu | B | Triệu hoán | Quy tắc | 1 lần mỗi 120s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 18 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-A | Sử Khế Luật Khế Triệu | A | Triệu hoán | Quy tắc | 1 lần mỗi 90s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 30 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-S | Vương Khế Luật Khế Triệu | S | Triệu hoán | Quy tắc | 1 lần mỗi 60s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 48 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-SS | Thánh Khế Luật Khế Triệu | SS | Triệu hoán | Quy tắc | 2 lần mỗi 40s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 75 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-QT-SSS | Thần Khế Luật Khế Triệu | SSS | Triệu hoán | Quy tắc | 2 lần mỗi 25s, khi điều kiện triệu hoán hợp lệ thì hủy một phạt/giới hạn cấp thấp hơn thiên phú; không hủy tử vong, chi phí hay luật thế giới. | 120 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-F | Mầm Thăng Hoa Khế Triệu | F | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +0.25% command cap, ổn định và hiệu quả triệu hồi; trần 3%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 1 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-E | Khởi Thăng Hoa Khế Triệu | E | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +0.35% command cap, ổn định và hiệu quả triệu hồi; trần 5%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 3 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-D | Kiên Thăng Hoa Khế Triệu | D | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +0.50% command cap, ổn định và hiệu quả triệu hồi; trần 8%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 6 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-C | Tinh Thăng Hoa Khế Triệu | C | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +0.70% command cap, ổn định và hiệu quả triệu hồi; trần 12%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 10 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-B | Trác Thăng Hoa Khế Triệu | B | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +1.00% command cap, ổn định và hiệu quả triệu hồi; trần 18%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 17 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-A | Sử Thăng Hoa Khế Triệu | A | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +1.40% command cap, ổn định và hiệu quả triệu hồi; trần 26%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 28 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-S | Vương Thăng Hoa Khế Triệu | S | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +2.00% command cap, ổn định và hiệu quả triệu hồi; trần 36%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 45 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-SS | Thánh Thăng Hoa Khế Triệu | SS | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +2.80% command cap, ổn định và hiệu quả triệu hồi; trần 50%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 70 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |
| TP-TRIEU-TH-SSS | Thần Thăng Hoa Khế Triệu | SSS | Triệu hoán | Tiến hóa | Mỗi khi duy trì khế ước hoặc giúp summon tiến hóa, nhận +4.00% command cap, ổn định và hiệu quả triệu hồi; trần 70%, tối đa 1 stack/ngày và mất 25% stack khi vi phạm điều kiện cốt lõi. | 112 | trục xuất, cắt neo, vượt command cap và phản khế; tag SUMMON/COMMAND |

---

## Phụ lục 2.A — Kiểm tra tổng số

16 domain × 8 mechanism × 9 grade = **1.152** dòng. Mỗi ID duy nhất; mỗi domain có 72 thiên phú; mỗi grade có 128 thiên phú.

## Phụ lục 2.B — Ví dụ tính thuộc tính

**Người chơi SSS theo nghề cung thủ.** `G_player=2,00+6,00=8,00`. Sau 10 lần lên level, từ `Lv1→Lv11`, tổng growth là 80 điểm:

- DEX: `80×55%=44`;
- PER: `80×25%=20`;
- mỗi thuộc tính còn lại: `80/35≈2,2857`, tổng bảy trục là 16.

Đây là ví dụ nghề cung thủ, không phải nghề của Lí Lan. Nếu Thẻ Chuyển Nghề chưa được kích hoạt, 80 điểm nằm trong `PendingCareerGrowth`; khi thẻ mở, chúng tự giải theo payload đã niêm chứ không chờ người chơi chọn nghề.

**Binh lính lên phẩm ở level cao.** Một cung thủ Thường đạt `Lv21` đã có `20×2=40` điểm growth. Khi thăng thẳng lên Tinh anh, target mới là `20×3,25=65`, nên hệ thống bù 25 điểm: DEX `+13,75`, PER `+6,25`, và mỗi trục còn lại `+25/35≈0,7143`. Level, XP và `T_form` giữ nguyên.

Sau khi ledger growth đã được tính, một thuộc tính có `Base=12`, `LevelGrowth=8`, `Training=3`, `GearFlat=5`, `TalentFlat=2` cho `Raw=30`. Tại `T2, Lv11`, `TierMult=1,10`, nên `TierBonus=3`. Bonus JOB-A 20% và TAL-A 25% cùng bucket A thành 45%; với cap 60%, hiệu dụng = 31,66%. `Final=floor((30+3)×1,3166)=43`. Bonus aura bucket B tính sau, không chui ngược vào `Raw` hoặc `TierBonus`.

## Phụ lục 2.C — Ví dụ XP

Mục tiêu level 20, phẩm tinh anh: XPbase=20×20^1,45×1,5. Người chơi level 18 nhận Mgap=e^(0,17), rồi nhân share và anti-farm. Hệ thống giữ số thập phân nội bộ và chỉ làm tròn cuối; không cộng từng phần đã làm tròn.

## Phụ lục 2.D — Mẫu job

~~~yaml
job_id: JOB-FAMILY-TIER-BRANCH
role: [primary, secondary]
primary_stats_ordered: [DEX, PER]
required_level: 20
required_mastery: {skill_a: 250, skill_b: 100}
growth_vector: DEFAULT_55_25_20
core_resource_mode: NON_MANA
core_loop_actions: [{action_id: BASIC_ATTACK, mandatory: true, resource: STAMINA, cost: 8}]
opening_skill_candidates: []
job_tags: [RANGED, PHYSICAL]
resource: stamina
skills: [active, passive, utility]
equipment: [allowed, restricted]
upkeep: [material_or_social_cost]
advancement: [branch_1, branch_2]
respec_retention: 70%
~~~

## Phụ lục 2.E — Mẫu thiên phú tự viết

~~~yaml
talent_id: TP-CUSTOM-001
grade: B
domain: logistics
mechanism: conversion
pb: 14
trigger: route completes without loss
effect: converts capped idle storage into delivery buffer
bucket: TAL-A
cap: 10%
counterplay: blockade; warehouse sabotage
opportunity_cost: 5% personal movement
unique_scope: none
version: 1.0.0
~~~

## Phụ lục 2.F — Những lỗi cân bằng cấm dùng

- “Vô hạn”, “100% mọi trường hợp”, “bỏ qua mọi luật”, “mỗi giây tăng vĩnh viễn” không có cap.
- Một talent vừa damage, defense, economy, summon và governance ở full PB từng phần.
- Talent F có cơ chế quy tắc mạnh hơn SSS chỉ vì condition giả.
- SSS xuất hiện ngẫu nhiên nhưng canon gọi là duy nhất mà không có khóa.
- Chuyển chức cộng 70% toàn thuộc tính ở mỗi bậc và nhân chồng.
- XP chỉ tính last hit, khiến tank/healer/logistics vô nghĩa.
- Roll có thể reset bằng tải lại.

## Phụ lục 2.G — Kiểm thử Monte Carlo đề xuất

Chạy tối thiểu 100.000 roll để xác nhận phân phối; 10.000 build ở level 10/40/80; test đủ bảy phẩm đơn vị và chín cấp thiên phú người chơi; test thăng/giáng phẩm tại `Lv1/10/21/40/80`; test đổi nghề trước và sau promotion để chắc lịch sử không bị reroute; test tổng growth bảo toàn tới sai số nội bộ dưới `0,001`; test team 1/5/20/200; test economy 1 ngày/1 mùa/10 năm; kiểm tra top 1% không có output quá 2,5 lần median cùng bậc nếu không trả chi phí tương ứng.

## Phụ lục 2.H — Liên kết File 06

Thiên phú khởi đầu của Lí Lan đã được khóa là `SSS — Tử Phục Linh Sư`; các quy tắc corpse eligibility, bảo lưu Bậc/Cấp của xác thường, penalty giảm Bậc–Phẩm của xác hệ Thánh, bảo lưu kỹ năng/hero, Ngôi Mộ và cổ chiến trường nằm tại File 06. Thuộc tính khởi đầu của cô đã được `AWAKENED-AUTO-ATTR-1.0` suy ra thành `8/8/8/9/18/9/8/13/9`; payload Thẻ Chuyển Nghề đã niêm là `JOB-SUM-NECRO-01`, không phải biến người chơi điền. Nghề này mang `MANA_REQUIRED`, nên lần kích hoạt khai cuộc tạo đúng `SK-OPEN-NECRO-01` theo `OPENING-MANA-SKILL-1.0`; trước đó `known_skills` vẫn rỗng. Danh mục 1.152 dòng tiếp tục là từ điển cân bằng chung và không được dùng để reroll hoặc thay thế thiên phú đã khóa.

## Phụ lục 2.I — Registry tham số số học `PROGRESSION-SETTLEMENT-2.0`

Phụ lục này đóng mọi ký hiệu trong các công thức XP, mastery và đột phá. Nếu một công thức mới chưa có bảng miền giá trị, đơn vị, nguồn và quy tắc làm tròn tương đương, công thức ấy là `UNKNOWN_RULE` và không được chạy.

### 2.I.1. XP và độ phức tạp nghề

| `J_complexity` | Giá trị | Phạm vi nghề |
|---|---:|---|
| lao động phổ thông | 0,90 | thao tác nền, không cần chứng nghề |
| nghề cơ sở | 1,00 | nghề Cấp 1 chuẩn |
| nghề nâng cao | 1,05 | chuyên môn I–II |
| nghề anh hùng | 1,10 | nghề Cấp 60/lộ tuyến anh hùng |
| nghề quy tắc/huyền thoại | 1,15 | nghề Cấp 80–100 |

Với mỗi người nhận hợp lệ:

\[
RawXP_i=XP_{base}\times M_{gap}\times Share_i\times M_{novelty}
\times M_{risk}\times M_{anti-farm}
\]

\[
XP_i=\begin{cases}
0,&M_{anti-farm}=0\text{ hoặc }\sum Contribution=0\\
\max(1,\lfloor RawXP_i\rfloor),&\text{còn lại}
\end{cases}
\]

- `n` trong `Share_i` là số cá thể thật sự tham gia và còn trong phạm vi nhận XP; `Contribution_i≥0`, tổng contribution phải lớn hơn 0.
- `EnemyLevel` và `PlayerLevel` là Cấp nguyên `≥1` tại timestamp encounter khóa; `RankMult_XP` lấy đúng mapping §7.1. `XP_base`, `M_gap` và `Share_i` lần lượt gọi đúng §§7.1–7.3; không thay Cấp bằng Bậc hoặc Phẩm.
- `M_novelty` theo số lần gặp **cùng species/template** trong cửa trượt 24 giờ của người nhận: lần 1 `1,00`; lần 2 `0,80`; lần 3 `0,60`; lần 4 `0,40`; từ lần 5 `0,25`.
- `M_risk`: mục tiêu không thể gây hại thật `0`; nguy cơ thấp `0,75`; tương xứng `1,00`; cao `1,15`; chí tử `1,25`. Khóa band trước khi giao chiến bằng encounter grade, không đổi sau khi biết kết quả.
- `M_anti-farm`: hành động/summon/đồng minh dàn xếp, mục tiêu tự tạo hoặc không phản kháng `0`; vòng lặp nhân tạo vẫn còn rủi ro thật `0,50`; encounter tự nhiên hợp lệ `1,00`.
- Mọi số thập phân giữ tới cuối; XP nguyên dùng `floor` đúng một lần.

### 2.I.2. Mastery

| Biến | Miền/giá trị |
|---|---|
| `Difficulty` | `0..5`, từ thao tác không tạo học hỏi tới thử thách cực hạn |
| `QualityOfPractice` | `0..1`, tỷ lệ thao tác đúng mục tiêu huấn luyện |
| `Feedback` | `0,50` không phản hồi; `1,00` tự đối chiếu; `1,25` mentor/công cụ phản hồi trực tiếp |
| `Novelty` | dùng bảng `M_novelty` §2.I.1 |
| `TalentBonus` | bonus mastery được talent ghi trực tiếp dưới dạng số thập phân, `Clamp(0;0,75;x)`; grade tự thân không sinh bonus |
| `ComfortPenalty` | `0..1`; 0 là áp lực học phù hợp, 1 là lặp dễ tới mức không học được |

`MG` là điểm mastery của action, dùng `RoundHalfUp` tới ba chữ số rồi clamp tối thiểu 0. `MasteryAfter=min(1000,MasteryBefore+MG)`; phần vượt 1000 bị bỏ và vẫn ghi trong receipt để audit. Không có giá trị mặc định ngầm: không dùng kỹ năng ghi `MG=0/NO_SKILL_USED`; đã dùng kỹ năng mà thiếu một factor bắt buộc ghi `INVALID_MASTERY_INPUT` và chặn settlement cho tới khi sửa log, không được ngầm cho 0 rồi tiếp tục.

### 2.I.3. Đột phá

- `Foundation` nằm trong `0..100`, lấy từ trung bình có trọng số của ổn định thân thể/linh hồn 40%, hoàn thiện growth 30% và thương tổn cấu trúc đảo dấu 30%.
- `MasteryScore` là trung bình của tối đa ba kỹ năng chủ được job đích chỉ định, mỗi kỹ năng `0..1000`.
- `Threshold_min=min(950,100×T_target)`; `Threshold_ideal=min(1000,Threshold_min+150)`.
- `F_preparation`: thiếu vật bắt buộc `0`; ứng biến hợp lệ `0,60`; đủ bộ `0,85`; bộ hoàn chỉnh/đúng nghi thức `1,00`.
- `F_trial`: chưa hoàn thành `0`; hoàn thành một phần nhưng rule cho phép thử `0,50`; hoàn thành đầy đủ `1,00`.
- `G_special=1` cho T1–T9; với T10 dùng đúng khóa §10.8.
- `G_apt=I(T_target≤T_cap)`; `F_quality` và `P_cap` lấy đúng bảng §10.6.
- Xác suất cuối `P_break=Clamp(0,P_cap,product)`; đặt `u=Hash64(breakthrough_attempt_id+"BREAKTHROUGH")/2^64` theo `HASH-PRIMITIVE-1.0`, thành công khi `u<P_break`. `breakthrough_attempt_id` được commit trước khi lộ kết quả và không dùng lại. Không làm tròn trước roll; giao diện hiển thị phần trăm tới hai chữ số.

Mọi `Clamp(a,b,x)` trả `a` nếu `x<a`, `b` nếu `x>b`, còn lại trả `x`. `Round_10` làm tròn nửa lên tới bội số 10 gần nhất. Đây là quy tắc chung cho mọi công thức trong File 02 nếu mục chuyên trách không ghi khác.

### 2.I.4. Thuộc tính, bucket và giới hạn nguồn

`STAT-STACK-1.1` đóng phép tính ở §§4–5 và thay `STAT-STACK-1.0` đối với hệ số Bậc:

- `Training_i` là tổng delta huấn luyện có event; phần hoạt động là `Clamp(0,2+2T_active,Training_i)`, phần dư nằm trong ledger nhưng không cộng chỉ số cho tới khi bậc hoạt động tăng.
- `GearFlat_i` là tổng affix đang được trang bị và đã vượt item-budget validation của File 04; không có “hệ số trang bị” ẩn ngoài từng affix và equipment-slot legality.
- `TalentFlat_i` và `PostFlat_i` bằng tổng nguồn mang ID đang hoạt động; không có nguồn thì bằng 0.
- `TierMult(T_form)=0,62` tại `T_form=0`, còn `1,10^(T_form−1)` tại `T_form≥1`. `TierBonus_i=Raw_i×(TierMult−1)` là dẫn xuất không âm đối với `T_form≥1`; tại T0 phép nhân 0,62 được áp trực tiếp thay vì lưu một bonus âm. Mọi thay đổi `Raw_i/T_form` invalidates cache và tính lại trong transaction đang commit; lưu một delta buff Bậc vào ledger thuộc tính là invalid.
- Trong bảng dẫn xuất §4.1, `WeaponBase/FocusBase` lấy item/chassis theo File 04 Phụ lục 4.K.1; không có vũ khí/pháp khí lần lượt dùng `2/0`. `SkillAccuracy=Clamp(0,50,floor(AccuracyMastery/20))`, với mastery không có thì 0. `MovementBonus` là tổng effect ID hoạt động, clamp `0..50`, mặc định 0. `LoadPenalty=0` khi khối lượng mang không vượt Tải an toàn; nếu vượt thì `Clamp(0,80,20×(CarriedKg/SafeLoadKg−1))`. `ContextReputation=Clamp(−100,100,reputation_score)` của đúng actor/phe/ngữ cảnh tại File 03; thiếu quan hệ đã xác lập dùng 0.
- Mọi bonus phần trăm dùng số thập phân. Với `A_raw` là tổng JOB-A/TAL-A, mỗi nguồn JOB-A riêng bị clamp tối đa `0.50`; `A_pos=Eff(max(0,A_raw),0.60)`, `A_pen=Clamp(0,0.80,max(0,−A_raw))`, `A_net=A_pos−A_pen`.
- Với `B_raw` là tổng aura/trạng thái/địa hình, `B_pos=Eff(max(0,B_raw),0.40)`, `B_pen=Clamp(0,0.80,max(0,−B_raw))`, `B_net=B_pos−B_pen`.
- MULT nhận tối đa ba nguồn độc lập, mỗi `m_s∈[−0.50,0.50]`, xếp theo `source_id`; nguồn thứ tư cùng thời điểm bị vô hiệu trừ khi rule riêng thay giới hạn bằng ID/version.

Phép tính đã đóng là:

\[
Sheet_i=\left\lfloor\max(0,Raw_i\times TierMult(T_{form})\times(1+A_{net})+PostFlat_i)\right\rfloor
\]

\[
Context_i=\left\lfloor\max(0,Sheet_i\times(1+B_{net})\times\prod_{s=1}^{\min(3,n)}(1+m_s))\right\rfloor
\]

`Sheet_i` là số trên character sheet; `Context_i` chỉ tồn tại trong ngữ cảnh có source effect. Không làm tròn giữa các bước. Test biên không nguồn bonus và `PostFlat=0`: `T_form=1, Raw=10→Sheet=10`; `T_form=2, Raw=10→11`; vẫn `T_form=2, Raw=20→22`; `T_form=3, Raw=20→24` sau floor; `T_form=0, Raw=10→6`. `A_raw=1,00` chỉ cho `A_pos≈0,4867`, không phải +100%.

### 2.I.5. XP phi chiến đấu `NONCOMBAT-XP-1.0`

Một work/training event hợp lệ tính:

\[
GrossJobXP=\left\lfloor10\times Difficulty\times Outcome\times Hours_c
\times M_{novelty}\times M_{anti-farm}\right\rfloor
\]

- `Difficulty∈[0,5]`; `Outcome∈[0,1]` là tỷ lệ mục tiêu sản xuất hoặc mục tiêu luyện tập định lượng hoàn thành; `Hours_c=Clamp(0,8,hours)` cho một event. `M_novelty` dùng các mức §2.I.1 nhưng đếm cùng `job_action_template` thay cho species; `M_anti-farm` giữ nguyên mapping.
- Tỷ lệ sang XP nhân vật theo `J_complexity`: `0,90→0,30`; `1,00→0,40`; `1,05→0,45`; `1,10→0,50`; `1,15→0,60`.
- `CharacterXP=floor(GrossJobXP×rate)`. Nếu `GrossJobXP>0` nhưng kết quả làm tròn bằng 0, nhận 1 XP; mastery vẫn gọi công thức `MG` riêng từ cùng log thao tác và không nhận “phần dư” XP.
- Event không có đối tượng/kết quả thật đặt `Outcome=0`; lặp sản phẩm vô dụng đặt `M_anti-farm=0`.

### 2.I.5A. XP hoàn tất nhiệm vụ `QUEST-XP-1.0`

Quest completion dùng pool riêng, không giả làm một kẻ địch. Contract khóa `Difficulty∈[0,5]`, `Scope`, `quest_family`, objective contribution và risk band trước khi `OPEN`; `Outcome∈[0,1]` được tính từ objective ledger khi resolve.

| `Scope` | PERSONAL | LOCAL | TERRITORY | REGION | WORLD |
|---|---:|---:|---:|---:|---:|
| `ScopeMult` | 0,75 | 1,00 | 1,50 | 2,50 | 4,00 |

\[
QuestPool=\left\lfloor20\times Difficulty^{1.40}\times Outcome\times ScopeMult
\times M_{risk}\times M_{novelty}\times M_{anti-farm}\right\rfloor
\]

`M_risk`, `M_novelty` và `M_anti-farm` dùng mapping §2.I.1; novelty đếm `quest_family`, không đếm từng objective con. Với `QuestPool>0`, danh sách người nhận là actor có contribution objective thật và còn hợp lệ theo contract; dùng `Share_i` §7.3 rồi `QuestXP_i=floor(QuestPool×Share_i)`. Pool bằng 0 hoặc tổng contribution 0 cho 0 với lý do tương ứng. XP từ combat/work child event đã quyết toán vẫn giữ; `QuestPool` là thưởng hoàn tất mục tiêu đã công bố, không được thêm lần hai bằng cách resolve lại cùng `quest_instance_id`. Receipt key là `quest_instance_id|resolution_event_id|QUEST-XP-1.0`.

### 2.I.5B. Hook phản chiếu XP theo chủ sở hữu `OWNER-XP-MIRROR-HOOK-1.0`

Hook chạy sau khi mọi công thức chiến đấu, phi chiến đấu hoặc nhiệm vụ đã tạo một dòng `NORMAL_AWARD` với `net_xp` nguyên cuối cùng. Với mỗi dòng nguồn `x`, file chuyên trách trả về một tập hợp hợp đồng owner-specific đủ điều kiện. Mỗi hợp đồng hợp lệ tạo đúng một dòng mới:

\[
MirrorXP(x,owner,rule)=\max(0,x.net\_xp)
\]

Giao dịch phản chiếu dùng `transaction_kind=OWNER_XP_MIRROR`, `gross_xp=net_xp=MirrorXP`, `contribution_share=1`, mọi modifier bằng `1,00`, đồng thời ghi `source_xp_transaction_id` và `source_recipient_id`. Các giá trị này là dấu vết kế toán của **net XP đã đóng**; engine không chạy lại level-gap, share, novelty, risk hoặc anti-farm trên owner. Người nhận nguồn giữ toàn bộ XP của mình, team pool không bị trừ hoặc chia lại, và owner vẫn có thể nhận giao dịch `NORMAL_AWARD` riêng nếu thật sự tham gia.

Khóa chống lặp là:

```text
source_xp_transaction_id|owner_character_id|owner_rule_version
```

Cùng khóa luôn trả receipt cũ. Chỉ `NORMAL_AWARD` được làm nguồn; `OWNER_XP_MIRROR`, XP bảo lưu khi đổi chassis/hồi sinh, catch-up thuộc tính, mastery, promotion và mọi proc sinh từ proc đều không đủ điều kiện. Nếu award nguồn bằng 0, bị rollback, thuộc đoạn hoạt động trước khi hợp đồng owner bắt đầu, hoặc recipient bị khóa nhận XP, mirror bằng 0. Nhiều dòng nguồn được xử lý theo `source_xp_transaction_id` tăng dần; mỗi dòng áp ngưỡng Cấp của owner tuần tự theo §6.4, giữ XP dư và ghi đủ growth delta. Toàn bộ award nguồn, mirror, cohort split và level crossing nằm trong cùng transaction nguyên tử trước trigger sweep.

Bản duy nhất đang hoạt động là `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0` tại File 06. Nó khóa phạm vi theo provenance của từng tử thi do chính Lí Lan Tử Phục; zombie do Ngôi Mộ tạo, summon tạm, đơn vị tuyển mộ, quân của chủ khác và sinh vật do một tử thi cấp dưới tạo không được suy rộng vào hook chung.

### 2.I.6. Chấm Thẻ Chuyển Nghề `CAREER-CARD-1.0`

Với mỗi job đủ prerequisite, mọi tập tag được template khóa trước `T0`:

- `TagOverlap=|TalentTags∩RequiredTalentTags|/|RequiredTalentTags|`; tập yêu cầu rỗng cho 1.
- `NormStat(s)=Clamp(0,1,(s−8)/10)`; `AttributeFit=0,55NormStat(primary1)+0,25NormStat(primary2)+0,20×mean(NormStat(seven others))`.
- `MechanismFit=|KnownMechanisms∩RequiredMechanisms|/|RequiredMechanisms|`; tập yêu cầu rỗng cho 1.
- `EarthSkillFit=|VerifiedEarthSkillTags∩RelevantEarthSkillTags|/|RelevantEarthSkillTags|`; tập liên quan rỗng cho `0,50`.
- `SeedNovelty=Hash64(campaign_id+soul_id+job_id)/2^64`, thuộc `[0,1)` và không reroll.

Sau đó dùng đúng `Compat(j)` ở §9.3, làm tròn hiển thị bốn chữ số nhưng so sánh bằng số đầy đủ. Nghề có prerequisite thất bại không được chấm. Hòa tuyệt đối dùng hash đã nêu ở §9.3. Payload `JOB-SUM-NECRO-01` của Lí Lan là `USER_LOCKED` và thắng phép chấm lại.

#### Kỹ năng khai cuộc cho nghề cần Mana `OPENING-MANA-SKILL-1.0`

Đặt:

\[
NeedsMana(j)=I(j.core\_resource\_mode=MANA\_REQUIRED)\times
I(\exists a\in j.core\_loop\_actions:a.mandatory=1\land a.resource=MANA\land a.cost>0)
\]

Template ghi `MANA_REQUIRED` nhưng không có một hành động lõi bắt buộc tốn Mana là `INVALID_JOB_RESOURCE_PROFILE`; template ghi `NON_MANA/MANA_OPTIONAL` nhưng lại đánh dấu hành động lõi bắt buộc tốn Mana cũng invalid. Không suy loại nghề từ tên “pháp sư”, “chiến binh” hoặc từ việc actor có thanh Mana.

Với mỗi ứng viên `s` trong `opening_skill_candidates`, chỉ giữ ứng viên thỏa toàn bộ: schema kỹ năng hoàn chỉnh; chủ động; lớp `Cơ bản`; `WeightClass=1`; resource chính `MANA` với cost dương; `required_tier≤T_form`; chưa thuộc sở hữu actor; và `SkillTags∩TalentTags` khác rỗng. Đặt

\[
Overlap(A,B)=\begin{cases}0,&A\cup B=\varnothing\\|A\cap B|/|A\cup B|,&\text{ngược lại}\end{cases}
\]

\[
OpeningFit(s)=0.60\,Overlap(SkillTags_s,TalentTags)+0.40\,Overlap(SkillTags_s,JobTags)
\]

Chọn `OpeningFit` lớn nhất bằng số đầy đủ; hòa dùng `skill_template_id` tăng dần. `NeedsMana=1` mà pool hợp lệ rỗng đặt `UNKNOWN_RULE_OPENING_MANA_SKILL` và chặn toàn bộ transaction kích hoạt nghề, thay vì kích hoạt nghề thiếu công cụ lõi hoặc tự bịa skill. `NeedsMana=0` tạo receipt `NO_AUTO_SKILL_NON_MANA` và tiếp tục với 0 kỹ năng mới.

Khi có ứng viên thắng, commit trong cùng transaction: `skill_instance_id=Hash64(career_activation_event_id+"OPENING-MANA-SKILL")`; ownership mới; mastery 0; nguồn `OPENING-MANA-SKILL-1.0`; và idempotency key `soul_id|opening_card_id|OPENING-MANA-SKILL-1.0`. Nếu tải mới không vượt `ActiveLoadCapacity`, kỹ năng vào loadout; nếu vượt, nó chỉ vào `known_skills` và mở decision surface, tuyệt đối không tháo kỹ năng cũ. Cùng idempotency key luôn trả receipt cũ, không tạo bản sao.

Pool niêm của Lí Lan có đúng một ứng viên hợp lệ:

```yaml
skill_template_id: SK-OPEN-NECRO-01
name: Tử Khí Châm
grade: E
systems: [TRIEU, TU_LINH, AM]
skill_tags: [TRIEU, TU_LINH, AM, DON_MUC_TIEU]
class: CO_BAN
weight_class: 1
required_tier: 1
resource: {type: MANA, cost: 8}
cooldown_seconds: 3
effect: "0.75 × MAtk thành sát thương Ám lên một mục tiêu còn hoạt tính"
caps: "không tác động xác; không kích hoạt, tăng cường hoặc thay thế Tử Phục"
source_version: OPENING-MANA-SKILL-1.0
```

### 2.I.7. Tư chất và đổi nhánh

- `A_base∈[0,100]` được seed một lần; `Q_bonus` lấy bảng §10.3; `H_bonus=8` khi `HeroFlag=1`, ngược lại 0.
- Mỗi kỳ ngộ hợp lệ ghi `ΔOpportunity∈{1..10}`; tổng dương hoạt động bị cap 20. Mỗi thương tổn cấu trúc ghi `ΔDamage∈{1..25}`; tổng bị cap 50. Hồi phục chỉ đảo đúng damage event, không tạo điểm dương.
- `A_eff` dùng công thức §10.3 rồi clamp một lần; hòa tại ranh bảng `T_cap` dùng hàng chứa đúng số nguyên sau `floor(A_eff)`.

Khi đổi nhánh, đặt `j=|OldTags∩NewTags|/|OldTags∪NewTags|` (hai tập rỗng cho 0). Tỷ lệ mastery giữ lại: tag kỹ năng có ở cả hai job `1,00`; còn lại `j≥0,67→0,80`; `0,34≤j<0,67→0,60`; `0<j<0,34→0,30`; `j=0→0,20`. Mastery mới dùng `floor(old×rate)`; phần đã mất không trở lại khi đổi vòng.

### 2.I.8. Thức tỉnh hero `HERO-AWAKEN-1.0`

Các hệ số của §10.7 được khóa trước roll:

| Biến | Mapping |
|---|---|
| `F_risk` | không có nguy cơ thật 0; thấp 0,50; tương xứng 0,75; cao 0,90; chí tử 1,00 |
| `F_agency` | hành động máy móc/lặp 0; tử vật vô trí thực thi chính xác lệnh trong hoàn cảnh mới 0,25; chọn subroutine hợp lệ hoặc cá thể có agency tự điều chỉnh 0,50; lựa chọn tự chủ có giá 0,75; lựa chọn tự tác giả với hậu quả không đảo ngược 1,00 |
| `F_novelty` | lần đầu của event-family trong đời cá thể 1,00; lần hai 0,50; từ lần ba 0,25; cùng event ID 0 |
| `F_consequence` | không đổi state lâu dài 0; cứu/mất một mục tiêu phụ 0,50; đổi kết quả nhiệm vụ 0,75; hậu quả sống chết/chiến dịch không đảo ngược 1,00 |

`P_hero` không làm tròn trước roll. Đặt `u=Hash64(event_id+unit_id+"HERO-AWAKEN")/2^64`; cùng cặp event–unit chỉ có một roll và thành công khi `u<P_hero`. Khi thành công, dùng chỉ số `Q=0..6` của bảng §10.3: `Q_new=min(6,max(Q_old+1,2))`; `A_delta=RoundHalfUp(Clamp(5,15,5+5F_risk+5F_agency))`. `RoundHalfUp` ở đây làm tới số nguyên gần nhất và kéo đúng nửa lên số lớn hơn. Tử vật vô trí có thể mở cửa bằng dấu ấn thi hành mới mà chưa được gán suy nghĩ; chỉ **sau** event thành công nó nhận `HeroFlag=1/AgencyFlag=1`.

### 2.I.9. Điểm đóng góp XP

Mọi contribution dùng một đơn vị “HP tương đương” trong encounter contract: damage hữu hiệu 1 điểm/HP; healing thật 1 điểm/HP; damage bị chặn/hấp thụ 1 điểm/HP; khống chế hữu hiệu `0,5×EnemyLevel` điểm mỗi giây có tác dụng, cap bằng HP mục tiêu; phá cơ chế, trinh sát và hậu cần phải có số điểm cùng cap được khóa trong encounter contract **trước khi bắt đầu**, nếu không thì nhánh ấy nhận 0. `Contribution_i` là tổng không âm sau cap. Mục tiêu không có HP dùng `ObjectiveHP` do contract định trước; thiếu `ObjectiveHP` chặn cấp XP thay vì ứng biến sau kết quả.

### 2.I.10. Loadout và hợp thành kỹ năng

`SKILL-LOADOUT-2.0 — DESIGN_DEFAULT` dùng `WIL/INT` trên `Sheet`, không dùng buff ngữ cảnh để thay đồ rồi giữ slot:

\[
ActiveLoadCapacity=8+\left\lfloor\frac{WIL+INT}{5}\right\rfloor+2JobSlotBonus
\]

`JobSlotBonus`: Vô chức `0`; nghề nền `1`; chuyên môn I–II `2`; nghề cao cấp `3`; nghề hero `4`; nghề lãnh vực `5`; nghề huyền thoại `6`. Mỗi kỹ năng chủ động khóa đúng một `WeightClass`: **Cơ bản `1`; Nâng cao `2`; Đặc trưng `4`; Tuyệt kỹ `8`**. Đây là hệ số nhân tải, tách khỏi Phẩm kỹ năng; Phẩm điều khiển ngân sách hiệu ứng, điều kiện, tài nguyên và cooldown chứ không làm sáu Tuyệt kỹ nhẹ bằng sáu kỹ năng Cơ bản.

Hệ số mastery: `0–99→1,25`; `100–449→1,00`; `450–799→0,80`; `800–969→0,65`; `970–1000→0,50`. Với `w∈{1,2,4,8}`:

\[
ActiveLoad(skill)=\frac{\left\lceil4w\times MasteryFactor\right\rceil}{4},\qquad
\sum ActiveLoad(skill)\le ActiveLoadCapacity
\]

Tải giữ bước `0,25`. Test biên: sáu kỹ năng Cơ bản ở mastery `100` cần tải `6`; sáu Tuyệt kỹ cùng mastery cần `48`; một Tuyệt kỹ mastery `0` cần `10`; một Tuyệt kỹ mastery `1000` vẫn cần `4`, không bao giờ thành kỹ năng miễn phí. Lí Lan có `WIL=9`, `INT=9`; sau khi kích hoạt nghề nền có `JobSlotBonus=1`, capacity là `13`.

Trong vùng an toàn/nhà thuộc quyền, thay loadout cần `ceil(ActiveLoad_changed)` phút; ngoài vùng ấy cần `ceil(5×ActiveLoad_changed)` phút, đúng công cụ/pháp khí của skill và trạng thái không giao chiến. Transaction chỉ commit ở cuối; bị ngắt giữ nguyên loadout cũ. Passive chassis và phản xạ được template ghi `ALWAYS_ON` không chiếm tải; không được tự đổi một active thành passive.

`SKILL-FUSION-1.0 — DESIGN_DEFAULT`: hai skill phải có mastery ít nhất `250`, `j=|Tags_1∩Tags_2|/|Tags_1∪Tags_2|>0`, có recipe/mentor hoặc catalyst cùng Bậc cao nhất của hai skill, và hoàn tất một trial mang cả hai mechanism tag. Khi đủ khóa:

\[
Retention=0.50+0.30j,\qquad
Mastery_{new}=\min\left(1000,\left\lfloor\frac{M_1+M_2}{2}\times Retention\right\rfloor\right)
\]

Hai skill nguồn chuyển sang `ARCHIVED_BY_FUSION` và rời loadout; skill mới không được đồng thời giữ toàn bộ proc/passive xung đột. Hòa khi chọn effect giữ lại dùng PB cao hơn, rồi mastery cao hơn, rồi `skill_id` nhỏ hơn. Test biên: `j=0` chặn hợp thành; `j=1`, hai mastery `1000` cho mastery mới `800`, không phải `2000`.

### 2.I.10A. Resolver sách kỹ năng thành tựu `ACHIEVEMENT-SKILL-FIT-1.0`

Quy tắc này chỉ xử lý slot sách kỹ năng của **thành tựu Hệ Thống cá nhân hóa**. Nó không sửa loot hữu cơ, vật phẩm độc bản có lore hoặc reward được contract ghi rõ `FIXED_TEMPLATE`. Tên kỹ năng từng xuất hiện trong một lần nhận thưởng của nhân vật nguồn là bằng chứng về bậc, lớp, ngân sách và quan hệ công dụng của slot; nó không tự trở thành tên sách phổ quát cho mọi nghề.

Trước trigger, contract của slot phải khóa `reward_slot_id`, bậc, lớp, ngân sách, mục đích, payload mode và mapping hash pool theo job-family. Khi claim thắng, engine tạo instance bằng chính contract đó rồi mới bind người nhận và các event ID; instance có schema tối thiểu:

```yaml
achievement_skill_slot:
  reward_slot_id: stable_id
  recipient_id: stable_actor_id
  achievement_claim_event_id: stable_event_id
  payload_mode: RECIPIENT_ADAPTIVE | SEALED_UNTIL_CAREER | FIXED_TEMPLATE
  source_grade_label: optional_exact_source_label
  grade_lock: exact_grade
  skill_class_lock: exact_class
  effect_budget_lock: exact_budget_band
  purpose_tags: [at_least_one]
  source_instance_name: optional_evidence_only
  candidate_catalog_id_by_job_family: stable_catalog_id_or_POOL_ABSENT
  candidate_catalog_body_hash_by_job_family: sha256_or_POOL_ABSENT
  candidate_slice_id_by_job_family: stable_slice_id_or_POOL_ABSENT
  candidate_pool_hash_by_job_family: sha256_or_POOL_ABSENT
  selected_skill_template_id: null_or_stable_id
  resolution_state: READY | SEALED_UNTIL_CAREER | EARNED_PENDING_COMPATIBLE_TEMPLATE | RESOLVED
  resolution_event_id: stable_event_id
  receipt_key: stable_key
```

Khi nguồn dùng màu thay vì mã grade nội bộ, chuẩn hóa duy nhất: `Trắng→F`, `Lục→E`, `Lam→D`, `Tím→C`, `Vàng→B`, `Cam/Sử Thi→A`, `Truyền Kỳ→S`, `Thánh→SS`, `Thần/Quy Tắc→SSS`. Giữ cả `source_grade_label` trong receipt; nhãn không ánh xạ được đặt `UNKNOWN_SOURCE_GRADE` và chặn resolve, không tự chọn grade gần nhất. Vì sách Băng Liệu Thuật ở thành tựu Nhà Lãnh Chúa được panel ghi Trắng, slot tương ứng khóa `grade_lock=F` dù tên kỹ năng được thích nghi theo người nhận.

Với `RECIPIENT_ADAPTIVE`, ứng viên `s` chỉ hợp lệ khi vượt **tất cả** hard gate sau:

1. schema kỹ năng hoàn chỉnh, đã validate, đúng chính xác `grade_lock`, `skill_class_lock` và `effect_budget_lock`;
2. `job_family/branch` của kỹ năng thuộc nhánh mà job hiện tại cho phép;
3. `resource_type=NONE` hoặc thuộc `job.usable_resources`, đồng thời ít nhất một `core_loop_action` hay node thật trong cây nghề dùng tài nguyên đó; chỉ có `ManaMax>0` không biến một nghề `NON_MANA` thành nghề dùng Mana;
4. `primary_scaling_stat` là generic hoặc thuộc `job.allowed_scaling_stats`; `MAtk` bị loại với nghề chỉ dùng sức mạnh vật lý;
5. `weapon_requirement` rỗng hoặc giao với `job.allowed_equipment_tags`;
6. kênh sát thương hoặc vai trò hỗ trợ của skill thuộc `job.allowed_damage_channels` hay `job.allowed_support_roles`;
7. `SkillTags` giao với `JobTags∪TalentTags`, đồng thời `SkillTags∪RoleTags` giao với `PurposeTags∪CoreActionTags`;
8. không có tag cấm, xung đột nhánh, điều kiện chủng loài hoặc chassis mà người nhận không thể đáp ứng;
9. người nhận chưa sở hữu template đó.

`required_tier`, `required_level` và `required_mastery` **không** là cổng hạ giá trị: ứng viên đúng nghề vẫn được chọn và sách giữ trạng thái chưa học được cho tới khi đủ điều kiện. Trong công thức dưới, `SkillTags/RoleTags/DamageOrSupportTags/WeaponTags` lần lượt là các tập tag đã validate của template; `JobTags/TalentTags/CoreActionTags/AllowedChannelsAndRoles/AllowedEquipmentTags` là các tập đã validate của snapshot người nhận tại `resolution_event_id`; `PurposeTags` chính là `purpose_tags` của slot. `CoreActionTags` là hợp tag của các action lõi thật trong job, không phải tên action chưa chuẩn hóa. Đặt `Overlap(A,B)=|A∩B|/|A∪B|`, với hợp rỗng hoặc hai tập rỗng đều cho `0`, rồi tính:

\[
\begin{aligned}
RewardSkillFit(s)={}&0.35\,Overlap(SkillTags,JobTags)\\
&+0.20\,Overlap(SkillTags,CoreActionTags)\\
&+0.15\,Overlap(SkillTags,TalentTags)\\
&+0.15\,Overlap(RoleTags,PurposeTags)\\
&+0.10\,Overlap(DamageOrSupportTags,AllowedChannelsAndRoles)\\
&+0.05\,Overlap(WeaponTags,AllowedEquipmentTags).
\end{aligned}
\]

Chọn điểm lớn nhất bằng số đầy đủ; hòa dùng `skill_template_id` tăng dần. Không dùng LUK, random, tên kỹ năng của nhân vật nguồn hay sở thích narrator để phá hòa. Với mọi job-family đã biết khi contract được công bố, pool và hash được khóa trước trigger; thay pool sau khi biết người thắng là sửa thưởng hậu nghiệm và làm transaction vô hiệu. Một họ nghề tùy chỉnh chưa tồn tại lúc ấy phải được contract biểu diễn bằng sentinel `POOL_ABSENT`, không bằng pool rỗng có thể sửa âm thầm.

Pool dùng để resolve là **slice chính xác** lấy từ catalog theo bộ khóa `(job_family, grade_lock, skill_class_lock, effect_budget_lock)`, sắp `skill_template_id` tăng dần. `candidate_pool_hash_by_job_family` phải là SHA-256 của chính các data row trong slice; hash toàn catalog không được dùng thay hash slice. Receipt đồng thời giữ `candidate_catalog_id`, `candidate_catalog_body_hash` và `candidate_slice_id` để audit ngược. Với `JOB-SUM-NECRO-01`, registry hiện hành là `ACHPOOL-JOB-SUM-NECRO-01-1.0`, `catalog_body_sha256=67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247`, `slice_map_sha256=1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176`; toàn bộ 198 hàng và 36 hash slice nằm tại §2.K.1.

Riêng slot `ACH-OPEN-LORD-HOUSE-MAIN` khóa `(F,CO_BAN,PB=1)` nên chỉ đọc slice `NECRO-F-CO_BAN-1`, gồm 8 ứng viên, hash `0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d`. `OPENPOOL-JOB-SUM-NECRO-01` không phải catalog thành tựu; `SK-OPEN-NECRO-01 — Tử Khí Châm` là Phẩm E của transaction khai nghề, bị cấm đưa vào slice này, đổi tên thành Phẩm F hoặc hạ phẩm để lấp chỗ.

Nếu người nhận chưa có nghề khi achievement được commit, ghi `payload_mode=SEALED_UNTIL_CAREER`, khóa `recipient_id`, bậc/lớp/ngân sách/mục đích và mapping pool, nhưng chưa in tên hoặc effect giả. Event `CareerActivated` đầu tiên gọi resolver đúng một lần. Nếu người nhận đã có một job tùy chỉnh hợp lệ nhưng pool là `POOL_ABSENT` hoặc pool khóa không còn ứng viên, giữ quyền sở hữu ở `EARNED_PENDING_COMPATIBLE_TEMPLATE`: không cấp sách sai nghề, không đổi sang vàng/vật liệu, không hạ phẩm và không tự bịa template. Một content patch về sau chỉ được thêm pool cho **toàn bộ job-family** bằng `compatible_pool_patch_id/version/hash` độc lập với cá nhân thắng; mọi receipt đang chờ cùng family/slot đọc cùng patch. Nó không được sửa bậc/lớp/ngân sách/mục đích của reward và không được tạo một template riêng sau khi xem build cá nhân.

Khóa lặp là `achievement_claim_event_id|recipient_id|reward_slot_id|ACHIEVEMENT-SKILL-FIT-1.0`. Cùng khóa luôn trả receipt cũ; đổi nghề về sau không reroll sách đã phân giải. Biên bắt buộc: Kỵ Sĩ `NON_MANA` loại mọi phép Mana/MAtk; Giáo Sĩ chỉ nhận phép công kích khi cây Giáo Sĩ thực sự cho phép kênh đó; Pháp Sư Băng có thể nhận kỹ năng Băng đúng bậc; Lí Lan ưu tiên Triệu Hoán/Tử Linh/Ám; pool rỗng giữ `EARNED_PENDING_COMPATIBLE_TEMPLATE`; yêu cầu Cấp cao giữ nguyên sách chứ không hạ phẩm.

### 2.I.11. Roll và tiến hóa thiên phú

`TALENT-ROLL-1.0 — DESIGN_DEFAULT` dùng bảng grade §11.1. Đặt `root=shard_id+soul_id+"TALENT"`; mỗi roll là `u_x=Hash64(root+x)/2^64∈[0,1)` với suffix riêng `GRADE/DOMAIN_BRANCH/DOMAIN_PICK/MECHANISM/PROTOTYPE`, nên cùng một root không tái sử dụng một số cho hai bước. Chọn grade và mechanism bằng CDF theo thứ tự bảng; chọn phần tử trong pool đã sắp `domain_id/talent_id` bằng `floor(u×pool_size)`.

Nhánh domain: `u_DOMAIN_BRANCH<0,60` lấy pool 16 domain; `0,60≤u<0,85` lấy `AffinitySet`; `0,85≤u<1` lấy phần bù của `AffinitySet`. Nếu pool được chọn rỗng, quay về 16 domain. Không có environmental bias thì chọn đều trong pool; nếu `AWAKENING-BIAS-1.0` hoạt động, giới hạn các trọng số `W'_d` vào pool, chuẩn hóa lại tổng 1 rồi chọn bằng CDF và `u_DOMAIN_PICK`. `AffinitySet` được khóa trước T0: mỗi verified Earth-skill tag cộng 1 điểm cho hai domain theo mapping `combat/athletics→CONG,THU`; `ranged/driving/piloting→XA,TRINH`; `medicine/care/biology→HOI,SINH`; `software/cyber/data/research→TRINH,CHETAO`; `engineering/construction/craft→CHETAO,XAY`; `farming/ecology→NONG,SINH`; `logistics/procurement/transport→HAU,THUTHAP`; `finance/trade→KINH,QUAN`; `management/law/diplomacy→QUAN,NGOAI`; `religion/occult→PHAP,TRIEU`. Giữ tối đa bốn domain có điểm dương cao nhất, hòa bằng `domain_id`; không có tag đã xác minh thì tập rỗng. File 06 bias thay CDF grade và trọng số domain trước phép chọn nhưng không thêm lượt roll.

Trọng số mechanism theo grade, theo thứ tự `NT/KD/CM/KH/HQ/CH/QT/TH`, luôn cộng đúng 100:

| Grade | Trọng số mechanism |
|---|---|
| F–E | `45/20/30/5/0/0/0/0` |
| D–C | `25/20/20/20/10/5/0/0` |
| B–A | `15/15/15/15/12/12/6/10` |
| S | `10/12/10/12/12/14/12/18` |
| SS–SSS | `8/10/8/10/10/14/20/20` |

Mỗi lựa chọn dùng sub-seed theo `grade/domain/mechanism`; pool prototype được sắp theo `talent_id`. Xung đột/unique dùng §13.4 rồi chọn biến thể có PB gần nhất, hòa bằng ID. Campaign Lí Lan không có reroll và không có pity thiên phú.

`TALENT-EVOLUTION-1.0 — DESIGN_DEFAULT`: đặt grade index `g=0..8` từ F tới SSS. Với `g<8`, lần tăng đúng một grade cần:

\[
EvoXPRequired=100\times2^g,\qquad
CatalystUnits=\left\lceil2\times1.7^g\right\rceil,\qquad
ChallengeTier=\max(1,\lceil(g+1)/2\rceil)
\]

Một event domain hợp lệ cấp `EvoXP=floor(10×Difficulty×Outcome×M_novelty×M_anti-farm)`, với `Difficulty` lấy miền §2.I.2, còn `Outcome/M_novelty/M_anti-farm` lấy mapping §§2.I.5 và 2.I.1; event rỗng hoặc farm cho 0. Catalyst phải mang đúng domain và grade ít nhất grade đích; trial phải có Bậc nguy cơ ít nhất `ChallengeTier`. Khi đủ ba khóa, chủ chọn đúng một nhánh trong §14.2, effect được dựng lại trong PB nền của grade đích và transaction tiêu XP/catalyst một lần. Nếu chưa chọn nhánh thì transaction ở `AWAITING_OWNER_DECISION`, không tự chọn. SSS đặt `EvoXP gain=0` và không có grade thứ mười.

## Phụ lục 2.J — Dấu vết nguồn cho tăng trưởng và Thẻ Chuyển Nghề

`<>` xác nhận phẩm sinh mệnh cao hơn nhận nhiều thuộc tính hơn theo Cấp, Bảng Cấp dùng mốc Cấp 10 và phần thưởng có Thẻ Chiêu Mộ theo dải thứ hạng. Nguồn quan sát được sách thưởng thành tựu phù hợp nghề của chính Cao Tinh, nhưng không công bố thuật toán chọn sách phổ quát. Nguồn cũng không công bố buff 10% theo Bậc, các hệ số XP/mastery/đột phá phổ quát, trọng số loadout, thuật toán niêm nghề, kỹ năng khai cuộc theo Mana hay catalog 198 kỹ năng Tử Linh; vì vậy `STAT-STACK-1.1`, `AWAKENED-AUTO-ATTR-1.0`, `CAREER-CARD-1.0`, `OPENING-MANA-SKILL-1.0`, `ACHIEVEMENT-SKILL-FIT-1.0`, `ACHPOOL-JOB-SUM-NECRO-01-1.0`, `PROGRESSION-SETTLEMENT-2.0` và `SKILL-LOADOUT-2.0` là quy tắc bổ sung có version, không được dẫn như lời nguyên tác. Dẫn chiếu chính: [Chương 2 — sách thưởng phù hợp Cao Tinh](https://ttks.tw/novel/chapters/quanqiujianglindaizhaosaosaomoshizhongtian/2.html), [Chương 249 — sách Hàn Sương cho Hàn Sương Pháp Sư](https://www.69shuba.com/txt/58776/38973657), [Chương 25 — Bảng Cấp và thưởng theo dải](https://mbook.novel.qq.com/read/1050133618/25), [Chương 26 — phẩm sinh mệnh và tăng trưởng](https://m.fbs.qq.com/read/1050133618/26).


## Phụ lục 2.K — Mảng 50 kỹ năng tham chiếu `SKILL-REFERENCE-50-1.0`

Các hàng dưới là `EXAMPLE_ONLY/DESIGN_REFERENCE`: bản thân 50 hàng này không tự cấp cho Lí Lan hoặc bất kỳ actor nào. Ngoại lệ kỹ năng khai cuộc chỉ đến từ candidate pool đã niêm và transaction `OPENING-MANA-SKILL-1.0`, không được lấy tùy ý một hàng trong bảng sau khi biết tình huống. Một kỹ năng mới phải giữ đủ trường `skill_id/name/grade/system/tier/weight_class/resource/cooldown/effect/caps/counter/source_version`. Phẩm dùng ngân sách hiệu ứng tham chiếu `F/E/D/C/B/A/S/SS/SSS = 1/2/4/6/11/18/29/45/72`; ngân sách này **không** thay `WeightClass 1/2/4/8`.

| ID | Kỹ năng | Phẩm | Hệ | Lớp | Trọng số | Bậc | Cost / cooldown | Hiệu ứng mẫu và giới hạn |
|---|---|---|---|---|---:|---:|---|---|
| SK-001 | Trảm Chuẩn | F | CONG | Cơ bản | 1 | T0 | 8 Thể lực; 1,0 giây | Một đòn 1,00×; +10% chính xác nếu giữ thế. |
| SK-002 | Thế Khiên | F | THU | Cơ bản | 1 | T0 | 6 Thể lực; duy trì | Giảm 10% sát thương trước mặt; tốc độ −10%. |
| SK-003 | Tiễn Đánh Dấu | E | XA | Nâng cao | 2 | T1 | 10 Thể lực; 8 giây | Gắn dấu 6 giây; phát bắn kế +15% chính xác. |
| SK-004 | Băng Châm | E | PHAP | Cơ bản | 1 | T1 | 8 Mana; 3 giây | 0,75× công phép; làm chậm 10% trong 2 giây. |
| SK-005 | Cầm Máu | D | SINH | Cơ bản | 1 | T1 | 1 băng; 12 giây | Dừng một Bleed không quá potency của kỹ năng. |
| SK-006 | Mạch Hồi Phục | D | HOI | Nâng cao | 2 | T1 | 14 Mana; 10 giây | Hồi 0,60× công phép trong 5 giây; không hồi xác chết. |
| SK-007 | Dấu Chân Tuyết | C | TRINH | Cơ bản | 1 | T1 | 5 Thể lực; 20 giây | +25% phát hiện dấu vết 10 phút trong một cell. |
| SK-008 | Bổ Mạch Quặng | C | THUTHAP | Nâng cao | 2 | T1 | 12 Thể lực; 30 giây | Một điểm khai thác nhận +20% yield, tăng 5% nguy cơ sập. |
| SK-009 | Hàn Rèn | B | CHETAO | Nâng cao | 2 | T2 | 20 Mana; 60 giây | Thay nhiệt lò cho một batch kim loại lạnh; quality cap theo xưởng. |
| SK-010 | Neo Nền | B | XAY | Đặc trưng | 4 | T2 | 24 Mana; 120 giây | Giảm 25% thất thoát WU do nền xấu cho một workfront. |
| SK-011 | Thức Đất | A | NONG | Nâng cao | 2 | T2 | 18 Mana; 10 phút | Đọc ẩm, dinh dưỡng và bệnh đất trong 100 m². |
| SK-012 | Đường Tiếp Tế | A | HAU | Đặc trưng | 4 | T2 | 30 Ý chí; 30 phút | Giảm 15% thời gian một route đã khảo sát; không tạo dịch chuyển. |
| SK-013 | Định Giá Chiến Trường | S | KINH | Đặc trưng | 4 | T3 | 25 Mana; 1 giờ | Ước lượng giá và thanh khoản loot với confidence đã biết. |
| SK-014 | Mệnh Lệnh Khẩn | S | QUAN | Tuyệt kỹ | 8 | T3 | 60 Ý chí; 6 giờ | Một cohort bỏ qua 50% OrderDelay cho một lệnh; sau đó Mệt. |
| SK-015 | Minh Ước Băng | SS | NGOAI | Tuyệt kỹ | 8 | T4 | 80 Mana; 24 giờ | Khóa điều khoản đã đồng thuận; phá ước tạo bằng chứng hệ thống. |
| SK-016 | Quần Thể Triệu Hoán | SSS | TRIEU | Tuyệt kỹ | 8 | T5 | 100 Mana + catalyst; 24 giờ | Triệu tập nhiều chassis theo recipe; vẫn chịu command và upkeep. |
| SK-017 | Liên Hoàn Phá Giáp | F | CONG | Nâng cao | 2 | T0 | 12 Thể lực; 6 giây | Hai hit 0,55×; hit hai giảm 5% giáp 4 giây. |
| SK-018 | Khiên Phản Chấn | E | THU | Đặc trưng | 4 | T1 | 18 Thể lực; 20 giây | Chặn đúng nhịp phản 0,40×; trượt nhịp không phản. |
| SK-019 | Mưa Tên | D | XA | Đặc trưng | 4 | T1 | 20 Thể lực + 6 đạn; 18 giây | Vùng 4 m; tối đa sáu mục tiêu, mỗi mục tiêu 0,45×. |
| SK-020 | Hàn Lao | C | PHAP | Nâng cao | 2 | T1 | 16 Mana; 8 giây | 1,10× công phép; +20% potency đóng băng trên mục tiêu Ướt. |
| SK-021 | Tái Sinh Mô | B | SINH | Đặc trưng | 4 | T2 | 35 Mana; 2 phút | Hồi thương tổn mô 1,20× trong 12 giây; không tái tạo chi. |
| SK-022 | Vực Hồi Sinh | A | HOI | Tuyệt kỹ | 8 | T3 | 90 Mana + pháp trận; 12 giờ | Hồi diện rộng cho người sống; không phải hồi sinh người chết. |
| SK-023 | Mắt Trắng | S | TRINH | Đặc trưng | 4 | T3 | 40 Mana; 30 phút | Xuyên bão tuyết 300 m; không xuyên vật đặc hoặc phong ấn. |
| SK-024 | Khai Mạch Cộng Hưởng | SS | THUTHAP | Tuyệt kỹ | 8 | T4 | 100 Mana + máy dò; 24 giờ | Hiện biên mạch trong 1 km²; tăng hazard khai thác nếu cưỡng ép. |
| SK-025 | Máy Rèn Tự Hành | SSS | CHETAO | Tuyệt kỹ | 8 | T5 | lõi R5 + 120 Mana; 48 giờ | Tự chạy một recipe đã học; output vẫn bị facility và input cap. |
| SK-026 | Thành Lũy Ghép | F | XAY | Cơ bản | 1 | T0 | 10 Thể lực; 30 giây | Dựng cover tạm từ vật liệu sẵn; HP theo vật liệu thật. |
| SK-027 | Luân Canh Chịu Rét | E | NONG | Cơ bản | 1 | T1 | 4 giờ công; theo vụ | Giảm 10% kiệt đất cho một ô; không tạo sản lượng tức thời. |
| SK-028 | Kho Vận Dây Chuyền | D | HAU | Nâng cao | 2 | T1 | 15 Ý chí; 1 giờ | +15% throughput một nút kho có đủ nhân lực. |
| SK-029 | Chợ Định Tuyến | C | KINH | Nâng cao | 2 | T1 | 20 Ý chí; 4 giờ | Ghép nhu cầu theo contract; không biết listing bị ẩn. |
| SK-030 | Lệnh Đội Hình | B | QUAN | Đặc trưng | 4 | T2 | 30 Ý chí; 5 phút | +10 Cohesion cho một đội hình đã tập; mất khi đội hình vỡ. |
| SK-031 | Hiệp Ước Bảo Chứng | A | NGOAI | Đặc trưng | 4 | T2 | 40 Ý chí + collateral; 12 giờ | Tăng credibility của đúng giao dịch; collateral bị giữ thật. |
| SK-032 | Song Triệu | S | TRIEU | Tuyệt kỹ | 8 | T3 | 2× recipe; 8 giờ | Khởi hai summon job đồng thời nếu còn slot và command. |
| SK-033 | Trảm Kích Tích Lực | SS | CONG | Tuyệt kỹ | 8 | T4 | 80 Thể lực; 2 phút | 3,20× sau 3 giây niệm; bị ngắt theo interrupt contract. |
| SK-034 | Thành Bất Động | SSS | THU | Tuyệt kỹ | 8 | T5 | 120 Thể lực; 24 giờ | Tạo barrier 5 giây theo VIT; người dùng bị neo tại chỗ. |
| SK-035 | Xuyên Tinh | F | XA | Cơ bản | 1 | T0 | 7 Thể lực + 1 đạn; 2 giây | Bỏ 5 giáp phẳng trên một mục tiêu đã thấy. |
| SK-036 | Trận Pháp Băng Vòng | E | PHAP | Đặc trưng | 4 | T1 | 25 Mana; 30 giây | Vòng 3 m làm chậm 15%; cần neo mặt đất. |
| SK-037 | Thích Nghi Độc | D | SINH | Nâng cao | 2 | T1 | 12 Mana; 1 giờ | +20% kháng một độc tố đã lấy mẫu; không cộng chồng loại. |
| SK-038 | Thanh Tẩy Dây Chuyền | C | HOI | Đặc trưng | 4 | T2 | 30 Mana; 60 giây | Chuyển một dispel qua tối đa ba mục tiêu, potency giảm 20% mỗi lần. |
| SK-039 | Trinh Sát Bóng Tuyết | B | TRINH | Nâng cao | 2 | T2 | 20 Mana; 15 phút | Tạo decoy route; trinh sát thật vẫn phải di chuyển. |
| SK-040 | Khai Thác Áp Suất | A | THUTHAP | Đặc trưng | 4 | T2 | 35 Mana; 10 phút | +35% tốc khai thác 5 phút; condition công cụ hao gấp đôi. |
| SK-041 | Khắc Ấn Module | S | CHETAO | Đặc trưng | 4 | T3 | 60 Mana + blank module; 6 giờ | Ghi một effect hợp PB; cần xưởng đúng stage. |
| SK-042 | Dựng Cầu Trong Bão | SS | XAY | Tuyệt kỹ | 8 | T4 | 100 Mana + vật liệu; 24 giờ | Giữ weather factor tối thiểu 0,75 cho một workfront cầu. |
| SK-043 | Hạt Giống Ngủ Đông | SSS | NONG | Tuyệt kỹ | 8 | T5 | seed core + 100 Mana; theo mùa | Bảo tồn gene bank và mở vụ sau; không thu hoạch ngay. |
| SK-044 | Tuyến Hồi Lộ | F | HAU | Cơ bản | 1 | T0 | 5 Ý chí; 10 phút | Đánh dấu tuyến về; chỉ dùng route đã đi và dữ liệu còn mới. |
| SK-045 | Đấu Giá Ẩn Danh | E | KINH | Nâng cao | 2 | T1 | 10 Ý chí; mỗi phiên | Ẩn tên theo contract; hệ thống vẫn giữ audit identity. |
| SK-046 | Tổng Động Viên | D | QUAN | Tuyệt kỹ | 8 | T2 | 50 điểm Chính danh hiện hành; hồi 7 ngày | Settle `LEG` tới timestamp, yêu cầu `LEG≥50`, rồi commit `DirectLegitimacyDelta=−50`; tăng 20% labor pool một ngày, morale giảm nếu thiếu khẩu phần. |
| SK-047 | Sứ Đoàn Gương | C | NGOAI | Nâng cao | 2 | T2 | 25 Ý chí; 12 giờ | Mô phỏng ba đề nghị đã biết; không đọc utility bí mật. |
| SK-048 | Neo Gọi Hồn | B | TRIEU | Đặc trưng | 4 | T2 | 40 Mana + neo; 1 giờ | Ổn định một summon route; phá neo làm tăng OrderDelay. |
| SK-049 | Vạn Nhận Quy Nhất | A | CONG | Tuyệt kỹ | 8 | T3 | 70 Thể lực; 4 giờ | Gom tối đa tám đòn cohort thành một impact; mỗi đòn vẫn trả cost. |
| SK-050 | Màn Giới Cộng Sinh | S | SINH | Tuyệt kỹ | 8 | T3 | 80 Mana; 8 giờ | Chia 30% damage trong mạng sống; đứt nút gây shock có log. |

Bộ kiểm tra catalog bắt buộc xác nhận: đúng 50 `skill_id` duy nhất; đủ cả chín Phẩm; đủ cả mười sáu hệ `CONG/THU/XA/PHAP/SINH/HOI/TRINH/THUTHAP/CHETAO/XAY/NONG/HAU/KINH/QUAN/NGOAI/TRIEU`; và chỉ có trọng số `1/2/4/8`. Một kỹ năng tự nghĩ ngoài bảng dùng cùng schema và công thức tải, không cần giống tên hoặc hiệu ứng mẫu.

### 2.K.1. Danh mục sách kỹ năng thành tựu của `JOB-SUM-NECRO-01`

`ACHPOOL-JOB-SUM-NECRO-01-1.0 — USER_LOCKED + DESIGN_DEFAULT` materialize **198 template độc lập** cho nghề cố định của Lí Lan: đúng 22 kỹ năng ở mỗi Phẩm `F/E/D/C/B/A/S/SS/SSS`. Mỗi Phẩm có `8 Cơ bản + 6 Nâng cao + 4 Đặc trưng + 4 Tuyệt kỹ`; vì vậy một contract khóa Phẩm/lớp/ngân sách vẫn còn một pool thực, không phải một tên kỹ năng duy nhất được đổi màu. Các hàng cùng cột số thứ tự là họ thiết kế có quan hệ chủ đề, **không** là cạnh tự nâng: học hàng Phẩm thấp không mở, đổi hay giảm giá hàng Phẩm cao; mỗi template vẫn cần reward/event/loot hợp lệ riêng.

`OPENPOOL-JOB-SUM-NECRO-01` và `SK-OPEN-NECRO-01 — Tử Khí Châm` nằm ngoài catalog này. Tử Khí Châm giữ Phẩm E, chỉ thuộc transaction `OPENING-MANA-SKILL-1.0`, không xuất hiện trong bất kỳ slice nào dưới đây và không được hạ thành F cho Nhà Lãnh Chúa.

Job profile đóng cho resolver:

```yaml
job_family: JOB-SUM-NECRO-01
branch: TU_LINH_TRIEU_HOAN
job_tags: [TRIEU, TU_LINH, AM, MANA, UNDEAD, CORPSE, SOUL, COMMAND]
talent_tags_for_Li_Lan: [TU_PHUC, TU_LINH, AM, CORPSE, UNDEAD, TRIEU]
usable_resources: [MANA]
core_loop_actions: [CAST_NECROMANCY, MARK_CORPSE, COMMAND_UNDEAD, PRESERVE_CORPSE, MANIPULATE_SOUL]
core_action_tags: [MANA, TRIEU, TU_LINH, AM, CORPSE, MARK, COMMAND, UNDEAD, PRESERVE, SOUL, RITUAL]
allowed_scaling_stats: [GENERIC, MAtk, SPI, PRE, WIL, INT, PER]
allowed_equipment_tags: [NONE, FOCUS, STAFF, GRIMOIRE, RITUAL_TOOL, BONE_TALISMAN]
allowed_damage_channels: [AM, SOUL, LANH, PROJECTILE, AOE]
allowed_support_roles: [DAMAGE, DEBUFF, CONTROL, PROTECT, MASTERY, SUSTAIN, SUMMON, COMMAND, SCOUT, MOBILITY, UTILITY, CORPSE_LOGISTICS, ANTI_HOLY, ZONE, RESOURCE, RITUAL]
achievement_skill_catalog: ACHPOOL-JOB-SUM-NECRO-01-1.0
template_resource_type: MANA
template_source_version: ACHPOOL-JOB-SUM-NECRO-01-1.0
catalog_body_sha256: 67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247
slice_map_sha256: 1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176
```

Mỗi hàng bên dưới materialize đủ schema hard-gate: `skill_template_id`, tên, `grade`, `skill_class`, `WeightClass`, `effect_budget`, yêu cầu Bậc/Cấp/mastery, `SkillTags`, `RoleTags`, `DamageOrSupportTags`, resource/cost/cooldown, scaling stat, weapon requirement, effect, caps/counter và `source_version`. `job_family`, branch, `resource_type=MANA` và `source_version` lấy từ contract đóng ở trên; không field nào được suy lại lúc claim.

`catalog_body_sha256=67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247` — SHA-256 của đúng 198 data row Markdown từ `SK-ACH-NECRO-F-01` tới `SK-ACH-NECRO-SSS-22`, theo thứ tự Phẩm trên rồi số tăng dần, UTF-8, LF cuối mỗi hàng; header và văn xuôi không thuộc hash.

| ID | Kỹ năng | Phẩm | Lớp | Tải | PB | Yêu cầu | SkillTags | RoleTags | Kênh | Cost/CD | Scale | Vũ khí | Hiệu ứng | Giới hạn/counter |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---|---|---|
| SK-ACH-NECRO-F-01 | Cốt Đạn | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 6; CD 4s | MAtk | NONE | Bắn cốt đạn gây 0.55× MAtk sát thương Ám, xuyên 2 giáp phẳng; đẩy lùi nhẹ mục tiêu không neo. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-F-02 | Hồn Châm | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 6; CD 4s | MAtk | FOCUS | Ghim hồn ở 20 m, gây 0.44× MAtk và −4% Resolve trong 3 giây; làm nhiễu niệm chú kế 5%. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-F-03 | Thi Ấn | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 6; CD 4s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 1 corpse/target trong 20 m, tồn tại 30 phút; hiện hướng tới dấu trong 30 m. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-F-04 | Cốt Thuẫn | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 6; CD 4s | SPI | NONE | Tạo khiên bằng 0.55× SPI + ngân sách Phẩm trong 8 giây; chặn một hit nhỏ rồi vỡ. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-F-05 | Hồn Vụ | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 6; CD 4s | WIL | FOCUS | Phủ màn hồn bán kính 2 m trong 6 giây, giảm 4% khả năng bị phát hiện; làm mờ hình dáng đứng yên. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-F-06 | Mộ Bộ | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 6; CD 4s | SPI | NONE | Dịch chuyển 4 m tới điểm hợp lệ đã thấy, tối đa 1 actor; không để trượt trên băng ở điểm đến. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-F-07 | Tử Hàn | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 6; CD 4s | MAtk | STAFF | Gây 0.25× MAtk Lạnh/Ám và làm chậm 4% trong 3 giây; giảm 5% tốc chạy. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-F-08 | Suy Nhược | F | CO_BAN | 1 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 6; CD 4s | WIL | GRIMOIRE | Đặt curse trong 6 giây, giảm 4% một output chiến đấu đã chọn; giảm 4% lực gây sát thương. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-F-09 | Hấp Hồn Tức | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 10; CD 12s | SPI | FOCUS | Gây 0.55× MAtk Ám và hồi Mana tối đa 4% damage thực nhận; hồi thêm nếu mục tiêu đang bị curse. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-F-10 | Khâu Thi | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 10; CD 12s | SPI | RITUAL_TOOL | Hồi 0.55× SPI HP cấu trúc cho tối đa 1 tử quân; cầm một Bleed trên tử quân. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-F-11 | Thi Lệnh | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 10; CD 12s | PRE | NONE | Trong 9 giây, giảm 4% OrderDelay cho tối đa 1 cohort hợp lệ; xóa một lệnh mâu thuẫn mới nhất. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-F-12 | Phong Thi | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 10; CD 12s | INT | RITUAL_TOOL | Niêm và bảo quản 1 xác trong 1 giờ, giữ riêng corpse_id/ledger; chặn mùi của một xác. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-F-13 | Thi Cảm | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 10; CD 12s | PER | NONE | Quét tử tức bán kính 20 m và phân loại tối đa 4 dấu; phân biệt xác với vật vô tri. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-F-14 | Ám Mạc | F | NANG_CAO | 2 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 10; CD 12s | WIL | GRIMOIRE | Cho tối đa 1 mục tiêu +4% kháng Thánh/thanh tẩy trong 6 giây; giảm một phần damage Thánh. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-F-15 | Hồn Tác | F | DAC_TRUNG | 4 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 18; CD 30s | MAtk | FOCUS | Trói tối đa 1 mục tiêu ở 20 m trong 1 giây; kéo mục tiêu nhỏ 0,5 m. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-F-16 | Mộ Khí Vòng | F | DAC_TRUNG | 4 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 18; CD 30s | SPI | STAFF | Dựng mộ vực bán kính 2 m trong 9 giây, địch chịu −4% cơ động; tăng ổn định của một tử quân trong vùng. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-F-17 | Cốt Chướng | F | DAC_TRUNG | 4 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 18; CD 30s | SPI | NONE | Dựng 1 đoạn cốt tường, mỗi đoạn có 44 + 4% SPI HP, tồn tại 12 giây; tạo một khe bắn nhỏ. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-F-18 | Hồn Đom Đóm | F | DAC_TRUNG | 4 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 18; CD 30s | PRE | RITUAL_TOOL | Triệu 1 u linh tạm với power cap 4% chủ trong 15 giây; chỉ chiếu sáng soul residue. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-F-19 | Tử Khí Bạo | F | TUYET_KY | 8 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 30; CD 180s | MAtk | STAFF | Nổ tử khí bán kính 2 m, gây 0.55× MAtk lên tối đa 2 mục tiêu; đẩy mục tiêu nhỏ ra rìa. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-F-20 | Dư Âm Tử | F | TUYET_KY | 8 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 30; CD 180s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 4% effect sau 1 giây; lặp 15% skill Cơ bản gần nhất. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-F-21 | Hồn Bình | F | TUYET_KY | 8 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 30; CD 180s | SPI | BONE_TALISMAN | Tạo kho tối đa 2 soul-charge, mỗi charge trị giá tối đa 4 Mana-equivalent; giữ một charge tới 60 giây. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-F-22 | Mộ Đinh | F | TUYET_KY | 8 | 1 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 30; CD 180s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 2 m trong 30 phút, tăng 4% hiệu suất Tử Linh hợp lệ; ổn định một cast đứng yên. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-E-01 | Cốt Tiễn | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 8; CD 4s | MAtk | NONE | Bắn cốt đạn gây 0.75× MAtk sát thương Ám, xuyên 3 giáp phẳng; để lại Nứt Cốt 2 giây. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-E-02 | U Hồn Thứ | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 8; CD 4s | MAtk | FOCUS | Ghim hồn ở 30 m, gây 0.60× MAtk và −6% Resolve trong 4 giây; giảm 5% WIL hiệu dụng 3 giây. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-E-03 | Hắc Thi Ký | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 8; CD 4s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 1 corpse/target trong 30 m, tồn tại 40 phút; giữ dấu qua tuyết phủ. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-E-04 | Bạch Cốt Mạc | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 8; CD 4s | SPI | NONE | Tạo khiên bằng 0.75× SPI + ngân sách Phẩm trong 9 giây; giảm stagger khi khiên còn. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-E-05 | U Linh Khăn | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 8; CD 4s | WIL | FOCUS | Phủ màn hồn bán kính 3 m trong 8 giây, giảm 6% khả năng bị phát hiện; giấu tiếng thở và tiếng vải. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-E-06 | Âm Ảnh Bộ | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 8; CD 4s | SPI | NONE | Dịch chuyển 5 m tới điểm hợp lệ đã thấy, tối đa 1 actor; điểm đến nhận một dấu mộ 5 giây. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-E-07 | Âm Lãnh Xâm Thể | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 8; CD 4s | MAtk | STAFF | Gây 0.34× MAtk Lạnh/Ám và làm chậm 6% trong 4 giây; giảm thêm tốc đánh 3%. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-E-08 | Khô Huyết Chú | E | CO_BAN | 1 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 8; CD 4s | WIL | GRIMOIRE | Đặt curse trong 8 giây, giảm 6% một output chiến đấu đã chọn; giảm 5% hiệu quả hồi phục. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-E-09 | Linh Lực Hồi Lưu | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 14; CD 14s | SPI | FOCUS | Gây 0.75× MAtk Ám và hồi Mana tối đa 6% damage thực nhận; cho một tử quân gần nhất 20% lượng hồi. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-E-10 | Bổ Cốt | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 14; CD 14s | SPI | RITUAL_TOOL | Hồi 0.75× SPI HP cấu trúc cho tối đa 1 tử quân; khôi phục một phần giáp xương. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-E-11 | Song Thi Đồng Bộ | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 14; CD 14s | PRE | NONE | Trong 12 giây, giảm 6% OrderDelay cho tối đa 1 cohort hợp lệ; đồng bộ hai đơn vị cùng chassis. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-E-12 | Lãnh Tàng Xác | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 14; CD 14s | INT | RITUAL_TOOL | Niêm và bảo quản 1 xác trong 3 giờ, giữ riêng corpse_id/ledger; giảm tốc phân hủy trong lạnh. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-E-13 | Hồn Tuyến Dò Xác | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 14; CD 14s | PER | NONE | Quét tử tức bán kính 30 m và phân loại tối đa 4 dấu; ước lượng thời gian chết theo band. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-E-14 | Kháng Quang Ấn | E | NANG_CAO | 2 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 14; CD 14s | WIL | GRIMOIRE | Cho tối đa 1 mục tiêu +6% kháng Thánh/thanh tẩy trong 8 giây; giảm potency cleanse lên một buff. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-E-15 | U Liên | E | DAC_TRUNG | 4 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 24; CD 40s | MAtk | FOCUS | Trói tối đa 1 mục tiêu ở 30 m trong 2 giây; giảm tầm lướt của mục tiêu. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-E-16 | Tử Địa Nhỏ | E | DAC_TRUNG | 4 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 24; CD 40s | SPI | STAFF | Dựng mộ vực bán kính 3 m trong 12 giây, địch chịu −6% cơ động; giảm 5% tốc địch. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-E-17 | Hài Cốt Tường | E | DAC_TRUNG | 4 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 24; CD 40s | SPI | NONE | Dựng 1 đoạn cốt tường, mỗi đoạn có 60 + 6% SPI HP, tồn tại 16 giây; uốn tường thành góc. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-E-18 | U Ảnh Thám | E | DAC_TRUNG | 4 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 24; CD 40s | PRE | RITUAL_TOOL | Triệu 1 u linh tạm với power cap 6% chủ trong 20 giây; đi trinh sát rồi trả route. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-E-19 | Hắc Tức Nổ | E | TUYET_KY | 8 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 42; CD 240s | MAtk | STAFF | Nổ tử khí bán kính 3 m, gây 0.75× MAtk lên tối đa 2 mục tiêu; làm tắt nguồn sáng thường. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-E-20 | Hồn Vang | E | TUYET_KY | 8 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 42; CD 240s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 6% effect sau 1 giây; echo lên một mục tiêu thứ hai. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-E-21 | Tử Khí Nang | E | TUYET_KY | 8 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 42; CD 240s | SPI | BONE_TALISMAN | Tạo kho tối đa 2 soul-charge, mỗi charge trị giá tối đa 6 Mana-equivalent; dùng charge giảm 10% cost cast. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-E-22 | Hồn Đăng | E | TUYET_KY | 8 | 2 | T1/Lv1/M0 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 42; CD 240s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 3 m trong 40 phút, tăng 6% hiệu suất Tử Linh hợp lệ; chiếu sáng mọi soul-mark trong 5 m. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-D-01 | Cốt Thương Xuyên | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 10; CD 5s | MAtk | NONE | Bắn cốt đạn gây 0.95× MAtk sát thương Ám, xuyên 4 giáp phẳng; xuyên qua một tử quân đồng minh. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-D-02 | Linh Hồn Ghim | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 10; CD 5s | MAtk | FOCUS | Ghim hồn ở 45 m, gây 0.76× MAtk và −8% Resolve trong 5 giây; hiện một buff đang duy trì. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-D-03 | Thi Khí Định Dấu | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 10; CD 5s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 2 corpse/target trong 45 m, tồn tại 50 phút; ghi nguyên nhân chết quan sát được. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-D-04 | Cốt Giáp Hộ Thể | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 10; CD 5s | SPI | NONE | Tạo khiên bằng 0.95× SPI + ngân sách Phẩm trong 10 giây; choàng được lên một tử quân. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-D-05 | Tử Vụ Che Dấu | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 10; CD 5s | WIL | FOCUS | Phủ màn hồn bán kính 4 m trong 10 giây, giảm 8% khả năng bị phát hiện; xóa dấu chân mới trong 5 m. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-D-06 | Thiểm Bộ Qua Xác | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 10; CD 5s | SPI | NONE | Dịch chuyển 6 m tới điểm hợp lệ đã thấy, tối đa 2 actor; được chọn một xác đã thấy làm mốc. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-D-07 | Hàn Thi Khóa Chân | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 10; CD 5s | MAtk | STAFF | Gây 0.43× MAtk Lạnh/Ám và làm chậm 8% trong 5 giây; root 0,3 giây nếu mục tiêu đang Ướt. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-D-08 | Hủ Lực Ấn | D | CO_BAN | 1 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 10; CD 5s | WIL | GRIMOIRE | Đặt curse trong 10 giây, giảm 8% một output chiến đấu đã chọn; giảm 6% giáp nhận từ buff. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-D-09 | Hồn Tuyền | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 18; CD 16s | SPI | FOCUS | Gây 0.95× MAtk Ám và hồi Mana tối đa 8% damage thực nhận; lưu phần hồi thừa 5 giây. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-D-10 | Tử Khí Dưỡng Thể | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 18; CD 16s | SPI | RITUAL_TOOL | Hồi 0.95× SPI HP cấu trúc cho tối đa 2 tử quân; loại một debuff mục rữa thấp. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-D-11 | Đội Hình Hài Cốt | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 18; CD 16s | PRE | NONE | Trong 15 giây, giảm 8% OrderDelay cho tối đa 2 cohort hợp lệ; giữ đội hình qua một va chạm. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-D-12 | Hồn Muối Bảo Quản | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 18; CD 16s | INT | RITUAL_TOOL | Niêm và bảo quản 2 xác trong 6 giờ, giữ riêng corpse_id/ledger; bảo toàn dấu vết thương tích. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-D-13 | Tử Tức Truy Dấu | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 18; CD 16s | PER | NONE | Quét tử tức bán kính 45 m và phân loại tối đa 8 dấu; nhận hướng soul residue. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-D-14 | Hồn Thuẫn Kháng Tịnh | D | NANG_CAO | 2 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 18; CD 16s | WIL | GRIMOIRE | Cho tối đa 2 mục tiêu +8% kháng Thánh/thanh tẩy trong 10 giây; chia kháng cho một tử quân. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-D-15 | Phược Hồn Xích | D | DAC_TRUNG | 4 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 32; CD 50s | MAtk | FOCUS | Trói tối đa 2 mục tiêu ở 45 m trong 2 giây; neo một mục tiêu vào mặt đất. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-D-16 | Thi Khí Trận | D | DAC_TRUNG | 4 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 32; CD 50s | SPI | STAFF | Dựng mộ vực bán kính 4 m trong 15 giây, địch chịu −8% cơ động; hiện mọi bước chân chạm đất. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-D-17 | Liên Cốt Thành | D | DAC_TRUNG | 4 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 32; CD 50s | SPI | NONE | Dựng 2 đoạn cốt tường, mỗi đoạn có 76 + 8% SPI HP, tồn tại 20 giây; nối hai đoạn không hở. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-D-18 | Oán Linh Sai Dịch | D | DAC_TRUNG | 4 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 32; CD 50s | PRE | RITUAL_TOOL | Triệu 2 u linh tạm với power cap 8% chủ trong 25 giây; mang một vật nhẹ. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-D-19 | Thi Bạo Áp | D | TUYET_KY | 8 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 58; CD 300s | MAtk | STAFF | Nổ tử khí bán kính 4 m, gây 0.95× MAtk lên tối đa 4 mục tiêu; kích nổ một corpse mark nhưng không phá xác. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-D-20 | Tử Kích Hồi Thanh | D | TUYET_KY | 8 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 58; CD 300s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 8% effect sau 1 giây; giữ nguyên damage channel gốc. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-D-21 | Linh Trì | D | TUYET_KY | 8 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 58; CD 300s | SPI | BONE_TALISMAN | Tạo kho tối đa 3 soul-charge, mỗi charge trị giá tối đa 8 Mana-equivalent; đổi charge thành khiên thay vì Mana. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-D-22 | Tử Linh Pháp Ấn | D | TUYET_KY | 8 | 4 | T1/Lv5/M50 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 58; CD 300s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 4 m trong 50 phút, tăng 8% hiệu suất Tử Linh hợp lệ; giảm 5% cost kỹ năng Tử Linh kế. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-C-01 | Liệt Cốt Song Kích | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 12; CD 6s | MAtk | NONE | Bắn cốt đạn gây 1.20× MAtk sát thương Ám, xuyên 5 giáp phẳng; tách một mảnh phụ vào mục tiêu gần. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-C-02 | Hồn Tuyến Phược | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 12; CD 6s | MAtk | FOCUS | Ghim hồn ở 65 m, gây 0.96× MAtk và −11% Resolve trong 7 giây; nối mục tiêu với vị trí trúng trong 2 giây. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-C-03 | Liên Thi Ấn | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 12; CD 6s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 2 corpse/target trong 65 m, tồn tại 70 phút; cho phép hai xác chia một mã đội. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-C-04 | Liên Cốt Phản Hộ | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 12; CD 6s | SPI | NONE | Tạo khiên bằng 1.20× SPI + ngân sách Phẩm trong 12 giây; chia 20% khiên cho đồng minh liền kề. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-C-05 | Hồn Ảnh Mê Tung | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 12; CD 6s | WIL | FOCUS | Phủ màn hồn bán kính 5 m trong 14 giây, giảm 11% khả năng bị phát hiện; tạo một ảnh giả đi lệch hướng. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-C-06 | Liên Mộ Chuyển | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 12; CD 6s | SPI | NONE | Dịch chuyển 7 m tới điểm hợp lệ đã thấy, tối đa 2 actor; dùng lại trong 2 giây để trở về điểm đầu. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-C-07 | Tử Sương Lan | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 12; CD 6s | MAtk | STAFF | Gây 0.54× MAtk Lạnh/Ám và làm chậm 11% trong 7 giây; lan hiệu ứng giảm tốc sang một mục tiêu. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-C-08 | Liên Hoàn Suy Bại | C | CO_BAN | 1 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 12; CD 6s | WIL | GRIMOIRE | Đặt curse trong 14 giây, giảm 11% một output chiến đấu đã chọn; nhảy một lần khi mục tiêu bị hạ. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-C-09 | Song Hồn Dẫn | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 24; CD 20s | SPI | FOCUS | Gây 1.20× MAtk Ám và hồi Mana tối đa 11% damage thực nhận; kéo từ tối đa hai mục tiêu. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-C-10 | Liên Thi Phục Hồi | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 24; CD 20s | SPI | RITUAL_TOOL | Hồi 1.20× SPI HP cấu trúc cho tối đa 2 tử quân; nhảy sang một tử quân thứ hai. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-C-11 | Liên Kết Tử Quân | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 24; CD 20s | PRE | NONE | Trong 21 giây, giảm 11% OrderDelay cho tối đa 2 cohort hợp lệ; truyền lệnh qua một sĩ quan tử quân. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-C-12 | Thi Quan Tĩnh Hóa | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 24; CD 20s | INT | RITUAL_TOOL | Niêm và bảo quản 2 xác trong 12 giờ, giữ riêng corpse_id/ledger; đóng gói hai xác không trộn ledger. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-C-13 | Mộ Võng Trinh Sát | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 24; CD 20s | PER | NONE | Quét tử tức bán kính 65 m và phân loại tối đa 8 dấu; nối các phát hiện thành bản đồ cục bộ. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-C-14 | Phản Thánh Kết Giới | C | NANG_CAO | 2 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 24; CD 20s | WIL | GRIMOIRE | Cho tối đa 2 mục tiêu +11% kháng Thánh/thanh tẩy trong 14 giây; hấp thụ một tick thanh tẩy thấp. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-C-15 | Đa Tuyến Linh Phược | C | DAC_TRUNG | 4 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 44; CD 65s | MAtk | FOCUS | Trói tối đa 2 mục tiêu ở 65 m trong 3 giây; trói tối đa hai mục tiêu. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-C-16 | Mộ Vực Lan Tràn | C | DAC_TRUNG | 4 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 44; CD 65s | SPI | STAFF | Dựng mộ vực bán kính 5 m trong 21 giây, địch chịu −11% cơ động; cho curse đơn mục tiêu lan potency thấp. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-C-17 | Cốt Lũy Gấp | C | DAC_TRUNG | 4 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 44; CD 65s | SPI | NONE | Dựng 2 đoạn cốt tường, mỗi đoạn có 96 + 11% SPI HP, tồn tại 28 giây; dựng một bậc cao cho xạ thủ. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-C-18 | Song U Linh | C | DAC_TRUNG | 4 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 44; CD 65s | PRE | RITUAL_TOOL | Triệu 2 u linh tạm với power cap 11% chủ trong 35 giây; chia thành hai thân yếu hơn. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-C-19 | Liên Hoàn Tử Bạo | C | TUYET_KY | 8 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 78; CD 420s | MAtk | STAFF | Nổ tử khí bán kính 5 m, gây 1.20× MAtk lên tối đa 4 mục tiêu; nổ lần hai ở 30% lực. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-C-20 | Liên Sát Dư Chấn | C | TUYET_KY | 8 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 78; CD 420s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 11% effect sau 2 giây; echo hai lần với lực giảm. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-C-21 | Hồn Khố | C | TUYET_KY | 8 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 78; CD 420s | SPI | BONE_TALISMAN | Tạo kho tối đa 3 soul-charge, mỗi charge trị giá tối đa 11 Mana-equivalent; chia kho thành ba ngăn có owner. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-C-22 | Tam Điểm Mộ Trận | C | TUYET_KY | 8 | 6 | T2/Lv10/M100 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 78; CD 420s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 5 m trong 70 phút, tăng 11% hiệu suất Tử Linh hợp lệ; nối ba neo thành tam giác. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-B-01 | Cốt Phá Giáp | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 16; CD 7s | MAtk | NONE | Bắn cốt đạn gây 1.55× MAtk sát thương Ám, xuyên 7 giáp phẳng; phá một lớp giáp tạm cấp thấp. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-B-02 | Toái Hồn Ấn | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 16; CD 7s | MAtk | FOCUS | Ghim hồn ở 90 m, gây 1.24× MAtk và −15% Resolve trong 10 giây; làm nứt một lớp khiên tinh thần. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-B-03 | Thi Vực Mục Tiêu | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 16; CD 7s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 3 corpse/target trong 90 m, tồn tại 100 phút; ưu tiên xác đã đánh dấu trong lệnh vận chuyển. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-B-04 | Cốt Thành Phản Chấn | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 16; CD 7s | SPI | NONE | Tạo khiên bằng 1.55× SPI + ngân sách Phẩm trong 15 giây; phản 10% sát thương vật lý đã chặn. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-B-05 | Vô Thanh Tử Mạc | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 16; CD 7s | WIL | FOCUS | Phủ màn hồn bán kính 7 m trong 20 giây, giảm 15% khả năng bị phát hiện; che soul-signature của một đồng minh. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-B-06 | Hồn Lộ Dịch Vị | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 16; CD 7s | SPI | NONE | Dịch chuyển 9 m tới điểm hợp lệ đã thấy, tối đa 3 actor; đổi chỗ với một tử quân tự nguyện. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-B-07 | Hồn Đông Cấm Tốc | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 16; CD 7s | MAtk | STAFF | Gây 0.70× MAtk Lạnh/Ám và làm chậm 15% trong 10 giây; tăng chi phí lướt/né 10%. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-B-08 | Tàn Mệnh Chú | B | CO_BAN | 1 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 16; CD 7s | WIL | GRIMOIRE | Đặt curse trong 20 giây, giảm 15% một output chiến đấu đã chọn; tăng 8% mệt mỏi khi dùng kỹ năng. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-B-09 | Hắc Triều Bổ Mana | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 32; CD 25s | SPI | FOCUS | Gây 1.55× MAtk Ám và hồi Mana tối đa 15% damage thực nhận; chuyển một phần thành giảm cost cast kế. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-B-10 | Hồn Hỏa Tái Cấu | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 32; CD 25s | SPI | RITUAL_TOOL | Hồi 1.55× SPI HP cấu trúc cho tối đa 3 tử quân; tái gắn một chi chưa bị phá hủy hoàn toàn. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-B-11 | Hồn Lệnh Phân Tuyến | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 32; CD 25s | PRE | NONE | Trong 30 giây, giảm 15% OrderDelay cho tối đa 3 cohort hợp lệ; chia một cohort thành hai mục tiêu không tăng OrderLoad. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-B-12 | Không Hủ Ấn | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 32; CD 25s | INT | RITUAL_TOOL | Niêm và bảo quản 3 xác trong 24 giờ, giữ riêng corpse_id/ledger; ngăn nhiễm chéo sinh học. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-B-13 | Hồn Nhãn Quét Vùng | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 32; CD 25s | PER | NONE | Quét tử tức bán kính 90 m và phân loại tối đa 12 dấu; phân loại friend/unknown/hostile theo owner ledger. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-B-14 | Tử Vực Giảm Phán | B | NANG_CAO | 2 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 32; CD 25s | WIL | GRIMOIRE | Cho tối đa 3 mục tiêu +15% kháng Thánh/thanh tẩy trong 20 giây; làm chậm lan truyền Holy field. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-B-15 | Hồn Lao Khóa Vực | B | DAC_TRUNG | 4 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 60; CD 85s | MAtk | FOCUS | Trói tối đa 3 mục tiêu ở 90 m trong 5 giây; tạo ranh 3 m không thể vượt bằng dash thấp. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-B-16 | Hắc Mộ Trấn | B | DAC_TRUNG | 4 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 60; CD 85s | SPI | STAFF | Dựng mộ vực bán kính 7 m trong 30 giây, địch chịu −15% cơ động; giảm hồi phục địch trong vùng. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-B-17 | Hắc Cốt Pháo Đài | B | DAC_TRUNG | 4 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 60; CD 85s | SPI | NONE | Dựng 3 đoạn cốt tường, mỗi đoạn có 124 + 15% SPI HP, tồn tại 40 giây; hấp thụ một projectile spell thấp. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-B-18 | Hồn Tướng Tạm Triệu | B | DAC_TRUNG | 4 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 60; CD 85s | PRE | RITUAL_TOOL | Triệu 3 u linh tạm với power cap 15% chủ trong 50 giây; dùng một kỹ năng Cơ bản đã khóa. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-B-19 | Hồn Chấn Bán Kính | B | TUYET_KY | 8 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 105; CD 600s | MAtk | STAFF | Nổ tử khí bán kính 7 m, gây 1.55× MAtk lên tối đa 6 mục tiêu; chuyển 10% damage thành stagger. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-B-20 | Hồn Ảnh Phản Kích | B | TUYET_KY | 8 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 105; CD 600s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 15% effect sau 3 giây; kích khi một tử quân che đòn. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-B-21 | Mệnh Phách Dự Trữ | B | TUYET_KY | 8 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 105; CD 600s | SPI | BONE_TALISMAN | Tạo kho tối đa 4 soul-charge, mỗi charge trị giá tối đa 15 Mana-equivalent; bảo toàn một charge qua nghỉ ngắn. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-B-22 | Hắc Tế Neo Vực | B | TUYET_KY | 8 | 11 | T2/Lv20/M250 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 105; CD 600s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 7 m trong 100 phút, tăng 15% hiệu suất Tử Linh hợp lệ; cho một summon route dùng chung neo. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-A-01 | Vương Cốt Truy Hồn | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 22; CD 8s | MAtk | NONE | Bắn cốt đạn gây 2.00× MAtk sát thương Ám, xuyên 10 giáp phẳng; hoàn 30% Mana nếu mục tiêu chết trong 3 giây. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-A-02 | Truy Hồn Đinh | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 22; CD 8s | MAtk | FOCUS | Ghim hồn ở 130 m, gây 1.60× MAtk và −20% Resolve trong 14 giây; ưu tiên đuổi theo soul-signature đã biết. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-A-03 | Vương Thi Sắc Lệnh | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 22; CD 8s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 4 corpse/target trong 130 m, tồn tại 140 phút; ủy quyền một sĩ quan tử quân đọc dấu. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-A-04 | Vương Cốt Hộ Mệnh | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 22; CD 8s | SPI | NONE | Tạo khiên bằng 2.00× SPI + ngân sách Phẩm trong 19 giây; tự kích hoạt một lần khi HP dưới 30%. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-A-05 | Vương Hồn Ẩn Giới | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 22; CD 8s | WIL | FOCUS | Phủ màn hồn bán kính 10 m trong 28 giây, giảm 20% khả năng bị phát hiện; cho đội nhỏ di chuyển mà không phá màn ngay. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-A-06 | Vương Mộ Xuyên Tuyến | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 22; CD 8s | SPI | NONE | Dịch chuyển 12 m tới điểm hợp lệ đã thấy, tối đa 4 actor; xuyên qua một hàng tử quân đồng minh. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-A-07 | Vương Hàn Trấn Phách | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 22; CD 8s | MAtk | STAFF | Gây 0.90× MAtk Lạnh/Ám và làm chậm 20% trong 14 giây; làm chậm hồi chiêu di chuyển thấp hơn potency. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-A-08 | Vương Chú Hao Mòn | A | CO_BAN | 1 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 22; CD 8s | WIL | GRIMOIRE | Đặt curse trong 28 giây, giảm 20% một output chiến đấu đã chọn; khóa một stack buff mới trong 2 giây. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-A-09 | Vương Hồn Tuần Hoàn | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 44; CD 30s | SPI | FOCUS | Gây 2.00× MAtk Ám và hồi Mana tối đa 20% damage thực nhận; chia dòng hồi giữa HP và Mana theo tỷ lệ chọn trước. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-A-10 | Vương Thi Tái Tạo | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 44; CD 30s | SPI | RITUAL_TOOL | Hồi 2.00× SPI HP cấu trúc cho tối đa 4 tử quân; khôi phục formation integrity cho cohort nhỏ. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-A-11 | Vương Lệnh Thống Ngự | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 44; CD 30s | PRE | NONE | Trong 42 giây, giảm 20% OrderDelay cho tối đa 4 cohort hợp lệ; giảm một lần OrderDelay do khoảng cách. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-A-12 | Vương Quan Phong Tồn | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 44; CD 30s | INT | RITUAL_TOOL | Niêm và bảo quản 4 xác trong 72 giờ, giữ riêng corpse_id/ledger; giữ một corpse skill-signature không tản. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-A-13 | Vương Vực Thi Nhận | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 44; CD 30s | PER | NONE | Quét tử tức bán kính 130 m và phân loại tối đa 16 dấu; thấy xác bị che bởi tuyết/đất mỏng. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-A-14 | Vương Ám Hộ Quân | A | NANG_CAO | 2 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 44; CD 30s | WIL | GRIMOIRE | Cho tối đa 4 mục tiêu +20% kháng Thánh/thanh tẩy trong 28 giây; che một cohort nhỏ. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-A-15 | Vương Xích Trấn Phách | A | DAC_TRUNG | 4 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 82; CD 110s | MAtk | FOCUS | Trói tối đa 4 mục tiêu ở 130 m trong 7 giây; kéo soul-form về thân xác. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-A-16 | Vương Mộ Lãnh Địa | A | DAC_TRUNG | 4 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 82; CD 110s | SPI | STAFF | Dựng mộ vực bán kính 10 m trong 42 giây, địch chịu −20% cơ động; tăng Order coherence của cohort. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-A-17 | Vương Cốt Thành Môn | A | DAC_TRUNG | 4 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 82; CD 110s | SPI | NONE | Dựng 4 đoạn cốt tường, mỗi đoạn có 160 + 20% SPI HP, tồn tại 56 giây; mở/đóng một cổng theo lệnh owner. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-A-18 | Vương Linh Cận Vệ | A | DAC_TRUNG | 4 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 82; CD 110s | PRE | RITUAL_TOOL | Triệu 4 u linh tạm với power cap 20% chủ trong 70 giây; che đòn cho chủ một lần. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-A-19 | Vương Tức Hủy Trận | A | TUYET_KY | 8 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 145; CD 900s | MAtk | STAFF | Nổ tử khí bán kính 10 m, gây 2.00× MAtk lên tối đa 8 mục tiêu; phá formation cohesion. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-A-20 | Vương Âm Tái Lệnh | A | TUYET_KY | 8 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 145; CD 900s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 20% effect sau 4 giây; lặp một lệnh không xung đột. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-A-21 | Vương Hồn Hải | A | TUYET_KY | 8 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 145; CD 900s | SPI | BONE_TALISMAN | Tạo kho tối đa 5 soul-charge, mỗi charge trị giá tối đa 20 Mana-equivalent; cho một tử quân mượn charge. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-A-22 | Vương Nghi Táng Lễ | A | TUYET_KY | 8 | 18 | T3/Lv40/M450 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 145; CD 900s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 10 m trong 140 phút, tăng 20% hiệu suất Tử Linh hợp lệ; bảo vệ nghi thức khỏi một interrupt thấp. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-S-01 | Minh Cốt Xuyên Tâm | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 30; CD 10s | MAtk | NONE | Bắn cốt đạn gây 2.60× MAtk sát thương Ám, xuyên 13 giáp phẳng; bám dấu hồn qua vật che mỏng. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-S-02 | Minh Hồn Phán | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 30; CD 10s | MAtk | FOCUS | Ghim hồn ở 190 m, gây 2.08× MAtk và −27% Resolve trong 20 giây; đánh dấu một lời nói dối bị hệ thống xác minh. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-S-03 | Minh Thi Truy Tung | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 30; CD 10s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 6 corpse/target trong 190 m, tồn tại 200 phút; theo dấu xuyên nhiễu tử khí thường. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-S-04 | Minh Cốt Bất Khuất | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 30; CD 10s | SPI | NONE | Tạo khiên bằng 2.60× SPI + ngân sách Phẩm trong 25 giây; không mất hoàn toàn trước đòn đầu xuyên giáp. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-S-05 | Minh Vụ Vô Tích | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 30; CD 10s | WIL | FOCUS | Phủ màn hồn bán kính 14 m trong 40 giây, giảm 27% khả năng bị phát hiện; tách dấu nhiệt khỏi vị trí thật. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-S-06 | Minh Giới Đạp Không | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 30; CD 10s | SPI | NONE | Dịch chuyển 16 m tới điểm hợp lệ đã thấy, tối đa 6 actor; bỏ qua địa hình thấp giữa hai mốc. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-S-07 | Minh Hàn Tĩnh Vực | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 30; CD 10s | MAtk | STAFF | Gây 1.17× MAtk Lạnh/Ám và làm chậm 27% trong 20 giây; tạo vùng im gió 2 m. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-S-08 | Minh Chú Đoạt Thế | S | CO_BAN | 1 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 30; CD 10s | WIL | GRIMOIRE | Đặt curse trong 40 giây, giảm 27% một output chiến đấu đã chọn; làm giảm một bậc ưu tiên aura thấp hơn potency. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-S-09 | Minh Hà Dẫn Lưu | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 60; CD 40s | SPI | FOCUS | Gây 2.60× MAtk Ám và hồi Mana tối đa 27% damage thực nhận; hút qua một soul-mark đã tồn tại. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-S-10 | Minh Thi Hoàn Hình | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 60; CD 40s | SPI | RITUAL_TOOL | Hồi 2.60× SPI HP cấu trúc cho tối đa 6 tử quân; đổi over-heal thành khiên tạm. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-S-11 | Minh Quân Đồng Tâm | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 60; CD 40s | PRE | NONE | Trong 60 giây, giảm 27% OrderDelay cho tối đa 6 cohort hợp lệ; chia sẻ target priority toàn đội. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-S-12 | Minh Khố Bất Hoại | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 60; CD 40s | INT | RITUAL_TOOL | Niêm và bảo quản 6 xác trong 168 giờ, giữ riêng corpse_id/ledger; bảo vệ khỏi thời tiết thường. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-S-13 | Minh Giới Vạn Tức | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 60; CD 40s | PER | NONE | Quét tử tức bán kính 190 m và phân loại tối đa 24 dấu; phân biệt corpse decoy dưới potency. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-S-14 | Minh Giới Khước Quang | S | NANG_CAO | 2 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 60; CD 40s | WIL | GRIMOIRE | Cho tối đa 6 mục tiêu +27% kháng Thánh/thanh tẩy trong 40 giây; đổi một lần crit Thánh thành hit thường. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-S-15 | Minh Liên Kéo Hồn | S | DAC_TRUNG | 4 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 110; CD 150s | MAtk | FOCUS | Trói tối đa 6 mục tiêu ở 190 m trong 10 giây; nối mục tiêu với một corpse mark. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-S-16 | Minh Thổ Tịch Không | S | DAC_TRUNG | 4 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 110; CD 150s | SPI | STAFF | Dựng mộ vực bán kính 14 m trong 60 giây, địch chịu −27% cơ động; giữ soul residue không tản. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-S-17 | Minh Thành Vạn Hài | S | DAC_TRUNG | 4 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 110; CD 150s | SPI | NONE | Dựng 6 đoạn cốt tường, mỗi đoạn có 208 + 27% SPI HP, tồn tại 80 giây; tự vá một lần bằng xương rơi trong vùng. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-S-18 | Minh Tướng Hồn Ảnh | S | DAC_TRUNG | 4 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 110; CD 150s | PRE | RITUAL_TOOL | Triệu 6 u linh tạm với power cap 27% chủ trong 100 giây; chia sẻ tầm nhìn không xuyên privacy. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-S-19 | Minh Bạo Táng Quân | S | TUYET_KY | 8 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 195; CD 1800s | MAtk | STAFF | Nổ tử khí bán kính 14 m, gây 2.60× MAtk lên tối đa 12 mục tiêu; đánh dấu vùng nguy hiểm 5 giây. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-S-20 | Minh Chung Tử Quân | S | TUYET_KY | 8 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 195; CD 1800s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 27% effect sau 6 giây; đồng bộ echo trong cohort. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-S-21 | Minh Hà Nội Phủ | S | TUYET_KY | 8 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 195; CD 1800s | SPI | BONE_TALISMAN | Tạo kho tối đa 7 soul-charge, mỗi charge trị giá tối đa 27 Mana-equivalent; tự động xả khi Mana dưới ngưỡng đã đặt. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-S-22 | Minh Phủ Đại Trận | S | TUYET_KY | 8 | 29 | T4/Lv60/M650 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 195; CD 1800s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 14 m trong 200 phút, tăng 27% hiệu suất Tử Linh hợp lệ; cho nhiều caster góp Mana có ledger. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-SS-01 | Thánh Cốt Tinh Thương | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 42; CD 12s | MAtk | NONE | Bắn cốt đạn gây 3.40× MAtk sát thương Ám, xuyên 18 giáp phẳng; đổi 20% overkill thành khiên cho tử quân gần nhất. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-SS-02 | Thánh Hồn Đoạn | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 42; CD 12s | MAtk | FOCUS | Ghim hồn ở 280 m, gây 2.72× MAtk và −36% Resolve trong 30 giây; cắt một liên kết tinh thần thấp hơn potency. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-SS-03 | Thánh Thi Quyền Ấn | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 42; CD 12s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 9 corpse/target trong 280 m, tồn tại 300 phút; khóa quyền sở hữu dấu trước cướp xác thấp hơn potency. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-SS-04 | Thánh Cốt Thiên Mạc | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 42; CD 12s | SPI | NONE | Tạo khiên bằng 3.40× SPI + ngân sách Phẩm trong 35 giây; che tối đa ba mục tiêu trong đội hình. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-SS-05 | Thánh Hồn Ly Quang | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 42; CD 12s | WIL | FOCUS | Phủ màn hồn bán kính 20 m trong 60 giây, giảm 36% khả năng bị phát hiện; bẻ một lần dò tìm thấp hơn potency. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-SS-06 | Thánh Mộ Vô Cự | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 42; CD 12s | SPI | NONE | Dịch chuyển 22 m tới điểm hợp lệ đã thấy, tối đa 9 actor; mang theo một đồng minh cỡ người. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-SS-07 | Thánh Sương Đóng Hồn | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 42; CD 12s | MAtk | STAFF | Gây 1.53× MAtk Lạnh/Ám và làm chậm 36% trong 30 giây; đóng băng một buff tăng tốc thấp hơn potency. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-SS-08 | Thánh Chú Tước Ân | SS | CO_BAN | 1 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 42; CD 12s | WIL | GRIMOIRE | Đặt curse trong 60 giây, giảm 36% một output chiến đấu đã chọn; tước một blessing thấp hơn potency trong thời hạn ngắn. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-SS-09 | Thánh Hồn Vĩnh Mạch | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 82; CD 55s | SPI | FOCUS | Gây 3.40× MAtk Ám và hồi Mana tối đa 36% damage thực nhận; không bị ngắt bởi một lần mất line-of-sight ngắn. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-SS-10 | Thánh Cốt Tái Cấu | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 82; CD 55s | SPI | RITUAL_TOOL | Hồi 3.40× SPI HP cấu trúc cho tối đa 9 tử quân; sửa một structural injury dưới potency. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-SS-11 | Thánh Lệnh Vạn Cốt | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 82; CD 55s | PRE | NONE | Trong 90 giây, giảm 36% OrderDelay cho tối đa 9 cohort hợp lệ; bảo toàn lệnh qua một lần silence cục bộ. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-SS-12 | Thánh Tàng Vạn Thi | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 82; CD 55s | INT | RITUAL_TOOL | Niêm và bảo quản 9 xác trong 720 giờ, giữ riêng corpse_id/ledger; tạo kho niêm nhiều ngăn với ID riêng. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-SS-13 | Thánh Nhãn Chiếu Hồn | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 82; CD 55s | PER | NONE | Quét tử tức bán kính 280 m và phân loại tối đa 36 dấu; đọc ranh giới phong ấn quanh xác. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-SS-14 | Thánh Nghịch Thiên Mạc | SS | NANG_CAO | 2 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 82; CD 55s | WIL | GRIMOIRE | Cho tối đa 9 mục tiêu +36% kháng Thánh/thanh tẩy trong 60 giây; giữ một summon khỏi bị trục xuất tức thời. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-SS-15 | Thánh Tác Cầm Luật | SS | DAC_TRUNG | 4 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 150; CD 210s | MAtk | FOCUS | Trói tối đa 9 mục tiêu ở 280 m trong 15 giây; khóa một cổng dịch chuyển thấp hơn potency. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-SS-16 | Thánh Mộ Cửu Trùng | SS | DAC_TRUNG | 4 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 150; CD 210s | SPI | STAFF | Dựng mộ vực bán kính 20 m trong 90 giây, địch chịu −36% cơ động; xếp hai lớp vùng với hiệu ứng khác nhau. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-SS-17 | Thánh Cốt Thiên Quan | SS | DAC_TRUNG | 4 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 150; CD 210s | SPI | NONE | Dựng 9 đoạn cốt tường, mỗi đoạn có 272 + 36% SPI HP, tồn tại 120 giây; neo tường trước displacement. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-SS-18 | Thánh Linh Quân | SS | DAC_TRUNG | 4 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 150; CD 210s | PRE | RITUAL_TOOL | Triệu 9 u linh tạm với power cap 36% chủ trong 150 giây; tạo đội nhỏ theo command cap. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-SS-19 | Thánh Tử Tinh Bạo | SS | TUYET_KY | 8 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 270; CD 3600s | MAtk | STAFF | Nổ tử khí bán kính 20 m, gây 3.40× MAtk lên tối đa 18 mục tiêu; bẻ một barrier thấp hơn potency. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-SS-20 | Thánh Hưởng Vạn Hồn | SS | TUYET_KY | 8 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 270; CD 3600s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 36% effect sau 10 giây; ghi lại một cast hợp lệ trong 10 giây. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-SS-21 | Thánh Hồn Thiên Trì | SS | TUYET_KY | 8 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 270; CD 3600s | SPI | BONE_TALISMAN | Tạo kho tối đa 10 soul-charge, mỗi charge trị giá tối đa 36 Mana-equivalent; giữ charge trước một dispel thấp. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-SS-22 | Thánh Điện Hồn Nghi | SS | TUYET_KY | 8 | 45 | T5/Lv80/M800 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 270; CD 3600s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 20 m trong 300 phút, tăng 36% hiệu suất Tử Linh hợp lệ; duy trì hai effect không xung đột. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |
| SK-ACH-NECRO-SSS-01 | Cốt Luật Diệt Hình | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,BONE,PROJECTILE,DON_MUC_TIEU | DAMAGE,MASTERY | AM,PROJECTILE | MANA 60; CD 15s | MAtk | NONE | Bắn cốt đạn gây 4.50× MAtk sát thương Ám, xuyên 24 giáp phẳng; khóa phần thương tổn do đòn này gây khỏi hồi trong 3 giây theo potency. | Đạn thật bị địa hình/barrier chặn; giáp Thánh và kháng Ám áp bình thường; không xuyên mục tiêu ngoài cap của Phẩm. |
| SK-ACH-NECRO-SSS-02 | Hồn Luật Định Tội | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,SOUL,CURSE,DON_MUC_TIEU | DAMAGE,DEBUFF,MASTERY | AM,SOUL | MANA 60; CD 15s | MAtk | FOCUS | Ghim hồn ở 420 m, gây 3.60× MAtk và −48% Resolve trong 45 giây; đóng một tội ấn 4 giây khiến cùng loại curse không thể bị che giấu. | Vô hồn/chassis máy chỉ nhận phần sát thương; Soul Ward và WIL chống debuff; không đọc ký ức hay ý nghĩ. |
| SK-ACH-NECRO-SSS-03 | Thi Luật Định Danh | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,CORPSE,MARK,COMMAND | MASTERY,UTILITY,CORPSE_LOGISTICS | UTILITY,COMMAND | MANA 60; CD 15s | SPI | GRIMOIRE | Đặt dấu có owner lên tối đa 12 corpse/target trong 420 m, tồn tại 450 phút; định danh duy nhất một corpse_id trong phạm vi lãnh vực. | Không tạo xác, không mở SecondDeathLock, không ghi đè owner/event ledger và không khiến xác vượt điều kiện Tử Phục. |
| SK-ACH-NECRO-SSS-04 | Cốt Luật Bất Hoại | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,BONE,SHIELD,DEFENSE | PROTECT,MASTERY | DEFENSE,AM | MANA 60; CD 15s | SPI | NONE | Tạo khiên bằng 4.50× SPI + ngân sách Phẩm trong 50 giây; giữ tối thiểu một điểm khiên trước một đòn dưới potency rồi tiêu tan. | Khiên có HP riêng theo effect budget, không cộng vô hạn; dispel, phá giáp và sát thương Thánh gây thêm áp lực. |
| SK-ACH-NECRO-SSS-05 | Hồn Luật Vô Danh | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,SOUL,STEALTH,MIST | PROTECT,SCOUT,UTILITY | STEALTH,AM | MANA 60; CD 15s | WIL | FOCUS | Phủ màn hồn bán kính 30 m trong 90 giây, giảm 48% khả năng bị phát hiện; xóa tên khỏi một phép truy dấu trong 3 giây nhưng vẫn giữ audit hệ thống. | True Sight, va chạm, tấn công và detector đủ potency phá màn; không xóa event log, mùi hay dấu vật lý đã tồn tại. |
| SK-ACH-NECRO-SSS-06 | Mộ Luật Hoán Vị | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,MOBILITY,GRAVE,POSITION | MOBILITY,SCOUT | MOBILITY,AM | MANA 60; CD 15s | SPI | NONE | Dịch chuyển 32 m tới điểm hợp lệ đã thấy, tối đa 12 actor; hoán vị hai mốc hợp lệ nhưng mọi actor vẫn giữ xung lượng và trạng thái. | Chỉ tới điểm đã quan sát/neo hợp lệ; anti-teleport, phong ấn không gian, quá tải kích thước và điểm bị chiếm chặn cast. |
| SK-ACH-NECRO-SSS-07 | Hàn Luật Tịch Chỉ | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,COLD,CONTROL,AM | CONTROL,PROTECT | LANH,AM | MANA 60; CD 15s | MAtk | STAFF | Gây 2.02× MAtk Lạnh/Ám và làm chậm 48% trong 45 giây; buộc mọi gia tốc trong 2 giây tuân trần tốc độ của skill. | Kháng Lạnh/Ám, nguồn nhiệt và cleanse giảm potency; boss đổi hard-freeze thành stagger theo contract. |
| SK-ACH-NECRO-SSS-08 | Suy Luật Phế Quyền | SSS | CO_BAN | 1 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,CURSE,WITHER,DEBUFF | DEBUFF,CONTROL | AM,DEBUFF | MANA 60; CD 15s | WIL | GRIMOIRE | Đặt curse trong 90 giây, giảm 48% một output chiến đấu đã chọn; vô hiệu một quyền tăng cường cụ thể 3 giây nhưng không xóa nguồn quyền. | Mỗi mục tiêu chỉ giữ một bản cùng lineage; cleanse/curse resistance áp; không giảm thuộc tính nền dưới 70%. |
| SK-ACH-NECRO-SSS-09 | Hồn Luật Tuần Sinh | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,SOUL,DRAIN,RESOURCE | SUSTAIN,MASTERY | AM,SOUL,RESOURCE | MANA 120; CD 75s | SPI | FOCUS | Gây 4.50× MAtk Ám và hồi Mana tối đa 48% damage thực nhận; tạo vòng tuần hoàn 3 giây nhưng tổng hồi vẫn bị cap bởi PB. | Không hút xác, đồng minh hoặc mục tiêu vô hồn; mỗi cast có trần hồi theo effect budget; Soul Ward phản khắc. |
| SK-ACH-NECRO-SSS-10 | Thi Luật Phục Nguyên | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,UNDEAD,REPAIR,SUSTAIN | SUSTAIN,SUMMON,PROTECT | HEAL_UNDEAD,AM | MANA 120; CD 75s | SPI | RITUAL_TOOL | Hồi 4.50× SPI HP cấu trúc cho tối đa 12 tử quân; phục nguyên trạng thái sống-hoạt trước thương tích gần nhất nhưng không đảo tử vong. | Chỉ tác động tử quân còn hoạt động và thuộc quyền hợp lệ; không hồi sinh, không tháo SecondDeathLock, không tạo mô/vật liệu từ hư vô. |
| SK-ACH-NECRO-SSS-11 | Quân Luật Nhất Niệm | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,COMMAND,UNDEAD,FORMATION | COMMAND,SUMMON,MASTERY | COMMAND,UTILITY | MANA 120; CD 75s | PRE | NONE | Trong 135 giây, giảm 48% OrderDelay cho tối đa 12 cohort hợp lệ; commit một lệnh nguyên tử cho toàn cây sở hữu trong giới hạn OrderLoad. | Không tăng Command cap, không miễn Agency/OrderLoad, không điều khiển đơn vị ngoài cây sở hữu; nhiễu, sĩ khí và đứt liên lạc vẫn áp. |
| SK-ACH-NECRO-SSS-12 | Bảo Tồn Luật Vĩnh Cửu | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,CORPSE,PRESERVE,LOGISTICS | CORPSE_LOGISTICS,PROTECT,UTILITY | UTILITY,AM | MANA 120; CD 75s | INT | RITUAL_TOOL | Niêm và bảo quản 12 xác trong 2160 giờ, giữ riêng corpse_id/ledger; giữ nguyên snapshot xác trước phân hủy tự nhiên nhưng vẫn chịu phá hủy chủ động. | Không sửa xác, không khôi phục loot, không vượt Tử Phục eligibility; lửa, Thánh lực và phá hủy vật lý vẫn làm mất xác. |
| SK-ACH-NECRO-SSS-13 | Cảm Luật Toàn Mộ | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,SCOUT,CORPSE,SENSE | SCOUT,CORPSE_LOGISTICS,UTILITY | SCOUT,SOUL | MANA 120; CD 75s | PER | NONE | Quét tử tức bán kính 420 m và phân loại tối đa 48 dấu; liệt kê mọi corpse_id hợp lệ trong vùng nhưng không tiết lộ dữ liệu bị privacy khóa. | Cần dấu tử khí/soul residue thật; phong ấn, khoảng cách, vật cản và anti-divination giảm range; không tạo mục tiêu mới. |
| SK-ACH-NECRO-SSS-14 | Ám Luật Bác Miện | SSS | NANG_CAO | 2 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,ANTI_HOLY,WARD,UNDEAD | PROTECT,ANTI_HOLY | DEFENSE,AM | MANA 120; CD 75s | WIL | GRIMOIRE | Cho tối đa 12 mục tiêu +48% kháng Thánh/thanh tẩy trong 90 giây; buộc một hiệu ứng Thánh dưới potency phải qua contest thay vì auto-resolve. | Không xóa nhược điểm hệ Thánh, không đảo penalty Tử Phục và không miễn sát thương; potency cao hơn xuyên ward bình thường. |
| SK-ACH-NECRO-SSS-15 | Phược Luật Định Vị | SSS | DAC_TRUNG | 4 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,CHAIN,CONTROL,SOUL | CONTROL,DEBUFF | CONTROL,SOUL | MANA 220; CD 300s | MAtk | FOCUS | Trói tối đa 12 mục tiêu ở 420 m trong 22 giây; định vị mục tiêu trong một cell 3 giây nhưng không cấm hành động tại chỗ. | Size, STR/WIL, anchor và control resistance contest; boss đổi hard bind thành stagger; cắt xích/line-of-effect giải hiệu ứng. |
| SK-ACH-NECRO-SSS-16 | Mộ Luật Tuyệt Sinh | SSS | DAC_TRUNG | 4 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,ZONE,GRAVE,CONTROL | CONTROL,ZONE,SUMMON | AM,ZONE | MANA 220; CD 300s | SPI | STAFF | Dựng mộ vực bán kính 30 m trong 135 giây, địch chịu −48% cơ động; đặt trần hồi phục/summon đối phương trong vùng theo PB nhưng không cấm tuyệt đối. | Cần neo mặt đất; phá neo/dispel kết thúc vùng; field đối nghịch contest; không gây instant death hoặc tự tạo xác. |
| SK-ACH-NECRO-SSS-17 | Cốt Luật Phong Cương | SSS | DAC_TRUNG | 4 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,BONE,WALL,ZONE | PROTECT,ZONE | DEFENSE,ZONE | MANA 220; CD 300s | SPI | NONE | Dựng 12 đoạn cốt tường, mỗi đoạn có 360 + 48% SPI HP, tồn tại 180 giây; định một biên không thể bị xuyên bởi hiệu ứng dưới potency nhưng HP vật lý vẫn hữu hạn. | Cần mặt đặt hợp lệ và xương/cốt liệu khi contract yêu cầu; có HP/D/A riêng, bị phá, dispel hoặc vượt địa hình; không là công trình vĩnh viễn. |
| SK-ACH-NECRO-SSS-18 | Hồn Luật Hóa Thân | SSS | DAC_TRUNG | 4 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,SUMMON,WRAITH,TEMPORARY | SUMMON,SCOUT,DAMAGE | SUMMON,SOUL | MANA 220; CD 300s | PRE | RITUAL_TOOL | Triệu 12 u linh tạm với power cap 48% chủ trong 225 giây; hóa thân thành proxy cast nhưng mọi cost/cooldown vẫn thuộc chủ. | Triệu hồi tạm hết hạn và chiếm Command/OrderLoad theo agency; anti-summon/Thánh lực khắc chế; không dùng như xác hoặc Tử Phục. |
| SK-ACH-NECRO-SSS-19 | Tử Luật Tịch Diệt | SSS | TUYET_KY | 8 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,AOE,BURST,AM | DAMAGE,ZONE | AM,AOE | MANA 400; CD 7200s | MAtk | STAFF | Nổ tử khí bán kính 30 m, gây 4.50× MAtk lên tối đa 24 mục tiêu; đặt một vùng tịch 2 giây nơi damage của skill không thể bị chuyển hướng, vẫn chịu cap và kháng. | Có target cap/radius theo Phẩm; line-of-effect, kháng Ám và barrier áp; không chain từ xác vô hạn, không gây sát thương ngoài ngân sách. |
| SK-ACH-NECRO-SSS-20 | Hồi Luật Tử Mệnh | SSS | TUYET_KY | 8 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,ECHO,COMMAND,PROC | COMMAND,DAMAGE,MASTERY | AM,COMMAND | MANA 400; CD 7200s | PRE | GRIMOIRE | Ghi một skill/lệnh hợp lệ rồi echo 48% effect sau 15 giây; tái diễn một effect đã log theo PB nhưng cấm mọi echo tự gọi echo. | Chỉ đọc event log của kỹ năng cùng grade-or-lower và tương thích; không lặp ultimate vượt contract, không hoàn cost và không tạo vòng lặp. |
| SK-ACH-NECRO-SSS-21 | Hồn Luật Vô Tận | SSS | TUYET_KY | 8 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,RESOURCE,SOUL,RESERVOIR | SUSTAIN,RESOURCE,UTILITY | RESOURCE,SOUL | MANA 400; CD 7200s | SPI | BONE_TALISMAN | Tạo kho tối đa 13 soul-charge, mỗi charge trị giá tối đa 48 Mana-equivalent; cho dòng năng lượng tuần hoàn nhưng dung lượng và throughput vẫn bị cap bởi PB. | Charge chỉ sinh từ event soul/corpse hợp lệ đã log; có cap, expiry và owner; không tăng ManaMax vĩnh viễn, không farm cùng corpse/event. |
| SK-ACH-NECRO-SSS-22 | Quy Tắc Tử Linh Đàn | SSS | TUYET_KY | 8 | 72 | T6/Lv100/M900 | TRIEU,TU_LINH,AM,MANA,RITUAL,ANCHOR,SUMMON | RITUAL,SUMMON,MASTERY,ZONE | RITUAL,AM | MANA 400; CD 7200s | INT | RITUAL_TOOL | Dựng nghi thức bán kính 30 m trong 450 phút, tăng 48% hiệu suất Tử Linh hợp lệ; đặt quy tắc cục bộ cho một loại necromancy dưới potency nhưng không sửa luật Tử Phục/thế giới. | Cần thời gian dựng, mặt bằng và catalyst khi ghi; phá neo/interruption chấm dứt; không tạo vật liệu, xác, hồi sinh hay miễn upkeep. |

#### Chỉ mục slice đã niêm

Resolver tạo pool bằng đúng khóa `(job_family, grade_lock, skill_class_lock, effect_budget_lock)`, kiểm count rồi so hash trước hard gate cá nhân. Hash slice dùng đúng các data row thuộc slice, giữ thứ tự ID và LF cuối mỗi hàng. Không được dùng master hash thay cho slice hash hoặc lọc xong mới tự đặt hash.

`slice_map_sha256=1d9ed4bd20066820d15101d5cb228ebceac518946800d62553a6eb0711935176` — SHA-256 của 36 dòng canonical `slice_id|grade|class|budget|count|slice_sha256`, theo thứ tự bảng dưới, mỗi dòng có LF.

| Slice ID | Phẩm | Lớp | PB | Số ứng viên | SHA-256 |
|---|---|---|---:|---:|---|
| `NECRO-F-CO_BAN-1` | F | `CO_BAN` | 1 | 8 | `0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d` |
| `NECRO-F-NANG_CAO-1` | F | `NANG_CAO` | 1 | 6 | `6d50898de6b30c0d32b823d9aad0ac8af1adbc24d7dedfa0a5de298b21778eb1` |
| `NECRO-F-DAC_TRUNG-1` | F | `DAC_TRUNG` | 1 | 4 | `78816150a578ad174c8c0b3b2343903719e0604ccfcc361ead2028fff52cece6` |
| `NECRO-F-TUYET_KY-1` | F | `TUYET_KY` | 1 | 4 | `ab365af586e1de4fd29df63d89d0f16ce6d54670829122d02f8120612d283d0f` |
| `NECRO-E-CO_BAN-2` | E | `CO_BAN` | 2 | 8 | `aa5109878830ae53b5effdf839e39c1c366b71e8089dc6c84c08df38554c5712` |
| `NECRO-E-NANG_CAO-2` | E | `NANG_CAO` | 2 | 6 | `c51ac878fdd42a89279033fbab2fecc8934e78f11de4ab5f6f6bb51367266444` |
| `NECRO-E-DAC_TRUNG-2` | E | `DAC_TRUNG` | 2 | 4 | `1469b1767ac03fa16dd4f5a6dadeeaeb1e45faccc3a3aedeee19a144af9f3d45` |
| `NECRO-E-TUYET_KY-2` | E | `TUYET_KY` | 2 | 4 | `643584cb7984981ac916448799b3384f54662e52510e02e3da2e1a32e14e5cc0` |
| `NECRO-D-CO_BAN-4` | D | `CO_BAN` | 4 | 8 | `64de07139b4717e8ad1a6ee9e80674f7711081e1ac6f0db6fe04feb6be03634e` |
| `NECRO-D-NANG_CAO-4` | D | `NANG_CAO` | 4 | 6 | `2c9821a813c498e9490ada9b125e1878e06a9ee13f5b34db3b1d0b5bf9d8f9f2` |
| `NECRO-D-DAC_TRUNG-4` | D | `DAC_TRUNG` | 4 | 4 | `9c3f7bb961e82b0c9c140beffbff13c8175b170b8e7887e03c11ab4a3d0cb6b9` |
| `NECRO-D-TUYET_KY-4` | D | `TUYET_KY` | 4 | 4 | `3036c00d2d4ecf49c0e89a9c0bb3a091169604d3381425dac5b6ccbdbc0560ac` |
| `NECRO-C-CO_BAN-6` | C | `CO_BAN` | 6 | 8 | `d6ee018851982cef155d53a15f86ac8fe32bfa5d6ebb06af47df3c15a70039b9` |
| `NECRO-C-NANG_CAO-6` | C | `NANG_CAO` | 6 | 6 | `dc5bde698bf160d37100c94228a9b7eb74177d137ff86ec71393e1f026e66c18` |
| `NECRO-C-DAC_TRUNG-6` | C | `DAC_TRUNG` | 6 | 4 | `e3cc7fe9b29486e75a791d3546e7e22537ab709c3fc3c55eb4f8866b547b2b5a` |
| `NECRO-C-TUYET_KY-6` | C | `TUYET_KY` | 6 | 4 | `4738bd57a5d5cb23a2fd68bbe661394fc47161cef2134c9392a808804c91790a` |
| `NECRO-B-CO_BAN-11` | B | `CO_BAN` | 11 | 8 | `cd4f74deb8c29f04f176af4cf7583b2d4981d61490abf3c3152987e499428fce` |
| `NECRO-B-NANG_CAO-11` | B | `NANG_CAO` | 11 | 6 | `bb585fa1095ce5016f306a885bf8f3a8ea9cb27b5f89438cdd25c4ba29bba00e` |
| `NECRO-B-DAC_TRUNG-11` | B | `DAC_TRUNG` | 11 | 4 | `db11d6e0fb9ff093bfb22a41b449131b695d583c738aea12d4afa2979a9b14e6` |
| `NECRO-B-TUYET_KY-11` | B | `TUYET_KY` | 11 | 4 | `874887d3fa5bf9f3d01eba4ea461db16eaf2d70e257f7945837d61a8751e6776` |
| `NECRO-A-CO_BAN-18` | A | `CO_BAN` | 18 | 8 | `1efe2e734bca08a4ea251c475c4ab7a3d28d4a8d54261b2479236bd234b6973d` |
| `NECRO-A-NANG_CAO-18` | A | `NANG_CAO` | 18 | 6 | `622ad9fff2b83ced5111b1048098dd5c7023277eac20166b71b161fbaa2961d8` |
| `NECRO-A-DAC_TRUNG-18` | A | `DAC_TRUNG` | 18 | 4 | `e0cc6ee3a034f92093f23efc925fb7a829d71a64883c3caefdeb3a96b07d1338` |
| `NECRO-A-TUYET_KY-18` | A | `TUYET_KY` | 18 | 4 | `b2dd028177829cbf3643f6c15b7a4d566e588243d84e5515fdb9b2f1086ac1be` |
| `NECRO-S-CO_BAN-29` | S | `CO_BAN` | 29 | 8 | `f32a8b68c6f9b0f30f79e8186962bc15345394e077b8fe2819e9c72883905697` |
| `NECRO-S-NANG_CAO-29` | S | `NANG_CAO` | 29 | 6 | `6a1be265aa578cefdb83820f2784f57c1b939510693d6fa1b07413a96c3593e0` |
| `NECRO-S-DAC_TRUNG-29` | S | `DAC_TRUNG` | 29 | 4 | `29f0b67b0a9f2460131560da2c1ab8965bcb8b32a288ec8b08f8cd2ef4177908` |
| `NECRO-S-TUYET_KY-29` | S | `TUYET_KY` | 29 | 4 | `f3c1c048bd0f24a26073362af4d54acbe7246bbbf7e28bc8cec361ded56cf108` |
| `NECRO-SS-CO_BAN-45` | SS | `CO_BAN` | 45 | 8 | `a7896c6e0268a5bbf8e60cd7bde0518ebc0bbab704453a528c53437050ad26fa` |
| `NECRO-SS-NANG_CAO-45` | SS | `NANG_CAO` | 45 | 6 | `b8ea1a53b3d2507e629c61b5d2a3904d3eed61756971734271f910b54fe3f1a6` |
| `NECRO-SS-DAC_TRUNG-45` | SS | `DAC_TRUNG` | 45 | 4 | `5932c573b1032cebf8729cf7e833d47d1c643f1540ee661645f895b8e90600d3` |
| `NECRO-SS-TUYET_KY-45` | SS | `TUYET_KY` | 45 | 4 | `ea10e44fcbb2458d9fc76c6d64a4ca1d9b3cd1ffd3e6250edae8defc7af40f1c` |
| `NECRO-SSS-CO_BAN-72` | SSS | `CO_BAN` | 72 | 8 | `3ddfb51386833e75426b238a96c4f70300985b180c356c5e3f805a1ce4b577ff` |
| `NECRO-SSS-NANG_CAO-72` | SSS | `NANG_CAO` | 72 | 6 | `3a9877de9065481f7042ffcbcf918275c444b2d91cfdcad067160c9ac01e2934` |
| `NECRO-SSS-DAC_TRUNG-72` | SSS | `DAC_TRUNG` | 72 | 4 | `fc592f89f1c00babfa994eee576264a12453d4151906d61894551dc9bf3a47a7` |
| `NECRO-SSS-TUYET_KY-72` | SSS | `TUYET_KY` | 72 | 4 | `969bd8a3b51bc8573c6858389ebc03bab409a755ac4c200f3a16dc44009cc92e` |

Lord House binding đóng:

```yaml
reward_slot_id: ACH-OPEN-LORD-HOUSE-MAIN
job_family: JOB-SUM-NECRO-01
catalog_id: ACHPOOL-JOB-SUM-NECRO-01-1.0
catalog_body_sha256: 67873c25005f79afadeb59788c2e68b51e3b9e322259b982dacc0c79034ad247
slice_id: NECRO-F-CO_BAN-1
candidate_pool_sha256: 0cbecccc3dc6157c24fc9bbce97302ff499591e0c425dc8166903a983b5b5c8d
candidate_count: 8
grade_lock: F
skill_class_lock: CO_BAN
effect_budget_lock: 1
opening_pool_reuse: FORBIDDEN
```

## Phụ lục 2.L — Giao dịch XP và mastery bắt buộc `PROGRESSION-SETTLEMENT-2.0`

Mỗi event `EncounterResolved`, `WorkResolved`, `TrainingResolved` hoặc `QuestResolved` phải gọi settlement **dù người dùng không nhắc XP**. Không được viết xong chiến đấu rồi bỏ qua vì XP/mastery không phải foreground. Giao dịch có thứ tự:

1. khóa danh sách cá thể thật sự tham gia, phạm vi nhận XP, source-event timestamp và contribution/outcome contract;
2. dispatch đúng loại: `EncounterResolved` dùng §§7/2.I.1; `WorkResolved` và `TrainingResolved` dùng `NONCOMBAT-XP-1.0` trên log từng actor; `QuestResolved` dùng `QUEST-XP-1.0`; thiếu field của đúng nhánh chặn settlement thay vì mượn công thức nhánh khác;
3. tính `MG` riêng cho từng kỹ năng thật sự đã dùng có log `Difficulty/QualityOfPractice/Feedback/Novelty/TalentBonus/ComfortPenalty`;
4. áp XP theo từng ngưỡng, giữ XP dư, tách cohort bằng `unit_id` và ghi mọi `thresholds_crossed`;
5. phát `SkillMasteryChanged` cho mọi mastery delta, thêm `MasteryThresholdCrossed` khi vượt band, rồi chạy trigger sweep File 05 cùng mọi `LevelChanged`;
6. render một khối delta cuối phản hồi. Nếu kết quả bằng 0, vẫn ghi lý do máy đọc được như `ANTI_FARM_ZERO`, `NO_LEARNING_SIGNAL` hoặc `OUT_OF_RANGE`.

```yaml
progression_settlement:
  settlement_id:
  source_event_id:
  participant_count:
  contribution_total:
  recipients:
    - actor_id:
      contribution:
      share:
      xp_route: COMBAT|NONCOMBAT|QUEST
      xp_factors: {}
      xp_awarded:
      level_before:
      level_after:
      xp_remainder:
      thresholds_crossed: []
      skill_mastery:
        - {skill_id, mastery_before, gain, mastery_after, overflow_discarded, factors, zero_reason}
  triggered_event_ids: []
  rule_version: PROGRESSION-SETTLEMENT-2.0
```

Bảo toàn số học: trước khi làm tròn, tổng `Share_i=1` khi tổng contribution dương; phần nền `0,60/n` chỉ dùng cho đúng `n` người tham gia còn trong phạm vi. XP của từng người làm `floor` ở cuối nên tổng XP nguyên có thể thấp hơn tổng thập phân, nhưng không được phân phần dư tùy ý. Mastery không chia theo contribution và không được suy từ số XP.
