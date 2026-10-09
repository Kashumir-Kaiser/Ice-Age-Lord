# LORD DND 07 — BẢNG XẾP HẠNG, ROSTER CỐ ĐỊNH VÀ COMPLETIONSTAT

> **Phiên bản 1.3.0 — 2026-08-27.** File này là nguồn khống chế cho roster đối thủ người chơi có danh tính cố định, ngân sách độ hiếm theo phạm vi, mô phỏng `CompletionStat`, vốn quán tính qua nhiều kỳ bảng và quy trình chuyển dự báo thành kết quả bảng có thể kiểm toán. File 01 sở hữu hợp đồng bảng, `CANON-EVENT-LEDGER-4.0`, metric, cửa thời gian, tie-break và payload thưởng; File 05 thi hành event ledger; File 02 sở hữu Cấp/XP; File 03 sở hữu vị trí và trường rương; File 04 sở hữu quân lực/loot; File 06 sở hữu Lí Lan. Bản 1.3.0 giữ toàn bộ anchor và XP provenance, đồng thời khóa `CompletionStat` chỉ được quyết định khả năng chiếm một hàng—tuyệt đối không được scale phẩm hoặc số lượng thưởng của hàng đó.
>
> **Cấm nhập test state:** mọi kết quả, thứ hạng, tên đối thủ, timestamp, vật phẩm hoặc momentum sinh ra trong một lần chạy thử đều là `TEST_ONLY`. Chúng không phải canon, không được nhập vào `SAVE-T0-CLEAN`, không được dùng làm thứ hạng mở đầu và không được biến thành nhân vật cố định chỉ vì đã xuất hiện trong test. Roster dưới đây được khóa độc lập từ nguồn `<>`, quyết định người dùng và thiết kế campaign; kết quả của campaign mới luôn bắt đầu rỗng rồi được tính lại.

## Mục lục

1. Chức năng và quyền sở hữu
2. Bất biến chống Top ngẫu nhiên
3. Phạm vi, quy mô và ngân sách độ hiếm
4. Schema hồ sơ đối thủ
5. Trục giai đoạn của thiên phú
6. Hàm `CompletionStat`
7. Vốn quán tính và lợi thế người đã dẫn đầu
8. Mapping `CompletionStat` sang từng họ kết quả
9. Registry roster cố định
10. Registry tham số máy
11. Áp dụng cho Lí Lan mà không viết trước kết quả
12. Materialize bảng và hiển thị công khai
13. Cách thêm hoặc loại một đối thủ
14. Kiểm thử bắt buộc và cách ly test run
15. Dấu vết nguồn `<>`

---

## 1. Chức năng và quyền sở hữu

File này giải quyết bốn lỗi:

1. bảng hạng không còn tự sinh mười tên và mười build ngay lúc cần hiển thị;
2. thiên phú mạnh không còn được chấm như nhau ở mọi giai đoạn hoặc mọi metric;
3. binh chủng, địa hình, mật độ mục tiêu, trường rương, hậu cần, tính cách và vận may đều có đầu vào định lượng;
4. người đã tích lũy lợi thế giữ lợi thế bằng state thật, không bằng “công bằng giả”, plot armor hoặc bonus hạng vô căn cứ.

Thứ tự gọi luật:

```text
ranking contract File 01
→ frozen contender roster File 07
→ talent/XP state File 02
→ world/ecology/chest/weather state File 03
→ troop/building/combat state File 04
→ event ledger and current anchor File 05
→ Lí Lan state File 06
→ CompletionStat forecast
→ simulate actions/ticks
→ commit actual metric events
→ sort by contract metric and tie-break
```

`CompletionStat` là biến mô phỏng nội bộ. Nó **không phải điểm công khai**, không thay thế metric của hợp đồng và không được dùng để sửa một kết quả đã xảy ra.

## 2. Bất biến chống Top ngẫu nhiên

### 2.1. `RANK-ROSTER-FREEZE-1.0`

- Bảng khai cuộc khóa roster cạnh tranh tại `T0`.
- Bảng hợp khu hoặc phạm vi lớn hơn khóa roster chậm nhất `opens_at−24h`.
- Mọi actor có `UpperBoundVisible=true` phải có hồ sơ đầy đủ trước `roster_freezes_at`.
- Sau khi bảng mở, engine không được sinh một “thiên tài bí ẩn” để chen Top K. Actor đã tồn tại nhưng chưa được materialize chỉ có thể vào **kỳ bảng kế tiếp**.
- Một actor ngoài roster vẫn sống và hành động bình thường; họ chỉ không thể bất ngờ chiếm hàng hiển thị của bảng đã khóa.
- Roster cố định không ban bất tử. Chết, mất tư cách, bị bắt, mất lãnh địa hoặc không đạt qualification tạo event hợp lệ và có thể khiến actor không xuất hiện ở bảng hiện hành.

### 2.2. “Cố định” nghĩa là gì

Mỗi người trong roster phải xuất hiện ở ít nhất một bảng/hoạt động phù hợp trong hoặc sau phạm vi `first_scope`, nếu còn sống và đủ tư cách. Điều này bảo đảm dàn đối thủ có tính liên tục. Nó không bảo đảm họ luôn Top 10, luôn thắng hoặc luôn đi theo cốt truyện nguồn.

### 2.3. Không sao chép kết quả nguyên tác

Nhân vật quan trọng từ `<>` được dùng làm **danh tính và neo hành vi**. Thứ hạng, đồng minh, kẻ thù, cái chết, tọa độ, vật phẩm và thành tích của họ trong Lord DnD do campaign mới tính lại. Một người từng hạng nhất trong `<>` không tự nhận hạng nhất ở đây.

### 2.4. Không sao chép test run

```yaml
test_state_quarantine:
  forbidden_inputs:
    - TEST_ONLY rank rows
    - TEST_ONLY actor names
    - TEST_ONLY completion timestamps
    - TEST_ONLY loot, XP, deaths, alliances and momentum
  clean_campaign_required:
    campaign_parent: SAVE-T0-CLEAN
    rank_rows_at_T0: []
    prior_rank_momentum_at_T0: 0
  validation:
    reject_event_prefixes: [TEST-, QA-, SANDBOX-]
    reject_foreign_campaign_id: true
```

### 2.5. `RANK-REWARD-SEPARATION-1.0`

File 07 chỉ mô phỏng hành động, qualification và metric để xác định **ai nằm ở hàng nào**. Sau khi sort/tie-break kết thúc, settlement gửi duy nhất `board_id`, `recipient_id`, `final_rank` và `rank_band` cho reward contract cố định tại File 01.

`CompletionStat`, `MomentumCapital`, Phẩm thiên phú, Bậc người nhận, Bậc trung vị, chênh điểm với hạng 2, chênh Bậc giữa các hạng, previous rank và số người dự thi không được xuất hiện trong input của reward lookup. Cùng một `board_id+rank_band+reward_contract_version` luôn cho cùng payload literal; khác biệt duy nhất giữa người trong cùng dải là `item_instance_id` và lựa chọn trong candidate pool đã niêm nếu contract thật sự có slot random/tự chọn. Hàng cao hơn rất xa vẫn không nhân thêm số lượng; hàng thấp hơn không bị hạ thưởng để “cân bằng”.

## 3. Phạm vi, quy mô và ngân sách độ hiếm

### 3.1. Cohort chuẩn của campaign

| Pha | Scope | Người chơi ban đầu trong scope | Người còn đủ tư cách tham chiếu | Tổng thiên phú `S+` đã seed | Roster có tên tích lũy | Thời điểm khóa |
|---|---|---:|---:|---:|---:|---|
| P0 | `PHAN_KHU_LL01` | 1.024 | theo survivor ledger | **3**: SSS×1, SS×0, S×2 | 10 | `T0` |
| P1 | `GOP_KHU_08` | 8.192 | theo survivor ledger | 18: SSS×1, SS×4, S×13 | 18 | `opens_at−24h` |
| P2 | `LIEN_KHU_08` | 65.536 | theo survivor ledger | 133: SSS×2, SS×19, S×112 | 24 | `opens_at−24h` |
| P3 | `LUC_DIA_08` | 524.288 | theo survivor ledger | 1.012: SSS×9, SS×137, S×866 | 28 | `opens_at−24h` |
| P4 | `THE_GIOI_08` | 4.194.304 | theo survivor ledger | 7.950: SSS×38, SS×1.092, S×6.820 | 32 | `opens_at−24h` |

Ba người `S+` ở phân khu khai cuộc gồm Lí Lan và đúng hai người khác. Đây là `USER_LOCKED`. Các số scope lớn hơn là `DESIGN_DEFAULT/RARITY-BUDGET-1.0`: đủ hiếm so với tổng dân số nhưng tăng hợp lý khi gộp phạm vi.

`S+ population` không đồng nghĩa tất cả đều là ứng viên Top K. Roster có tên chỉ giữ những người có upper bound đủ cao ở ít nhất một họ bảng hoặc có vai trò cốt truyện lặp lại. Phần còn lại vẫn tồn tại trong population state; trước một kỳ bảng mới, preflight phải materialize mọi người có thể vượt visible cutoff rồi mới freeze roster.

### 3.2. Kiểm tra quota

```text
HighTalentCount(scope) = count(actor where talent_grade in [S, SS, SSS])
NamedHighTalentCount(scope) <= HighTalentCount(scope)
P0 invariant: HighTalentCount(PHAN_KHU_LL01) = 3
P0 invariant: NamedHighTalentCount(PHAN_KHU_LL01) = 3
```

Nếu world seed tạo người thứ tư `S+` trong `PHAN_KHU_LL01`, `SAVE-T0-CLEAN` không hợp lệ; engine không được âm thầm hạ Phẩm hoặc chuyển người đó sang khu khác sau khi xem kết quả.

## 4. Schema hồ sơ đối thủ

```yaml
ranking_contender:
  contender_id:
  stable_player_id:
  real_name:
  source_class: USER_LOCKED | SOURCE_IDENTITY | CAMPAIGN_ORIGINAL
  source_refs: []
  first_scope:
  recurring_role:
  personality_anchors: []
  decision_policy:
    aggression: 0..100
    discipline: 0..100
    cooperation: 0..100
    exploration: 0..100
    conservation: 0..100
    retreat_at_loss_pct: 0..100
  talent:
    name:
    grade: F | E | D | C | B | A | S | SS | SSS
    canon_status: USER_LOCKED | SOURCE_LOCKED | DESIGN_ADAPTED
    effect:
    limits:
    phase_curve_id:
    affinity_class_id:
  troop_access:
    initial_actual_units: []
    unlock_path:
    troop_profile_id:
    strengths:
    weaknesses:
  start_site:
    world_package_anchor_id:
    internal_name:
    environment_profile_id:
    terrain_tags: []
    target_density_seed:
    chest_potential_seed:
    resource_access_seed:
    hazard_seed:
  fortune_base: 0..100
  execution_prior: 0..100 | PC_LEDGER_ONLY
  starting_supply_prior: 0..100
  starting_friction_prior: 0..100
  signature_boards: []
  state_anchor:
  last_materialized_event:
```

Tên vị trí trong file nội bộ không tự lộ cho người chơi. Giao diện bảng chỉ được hiển thị trường trong `displayed_fields` của hợp đồng File 01.

## 5. Trục giai đoạn của thiên phú

### 5.1. Điểm nền theo Phẩm

| Phẩm | F | E | D | C | B | A | S | SS | SSS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `GradeBase` | 15 | 22 | 30 | 40 | 52 | 64 | 76 | 88 | 100 |

Phẩm là tiềm năng nền, không phải thứ hạng. Một thiên phú A chuyên săn ở P0 có thể hoàn thành Bảng Cấp trước một thiên phú S thiên về quốc gia ở P4.

### 5.2. `TALENT-PHASE-CURVE-1.0`

| Curve ID | P0 khai cuộc | P1 hợp khu | P2 liên khu | P3 lục địa | P4 thế giới | Bản chất |
|---|---:|---:|---:|---:|---:|---|
| `EARLY_BURST` | 1,30 | 1,12 | 0,92 | 0,75 | 0,62 | rất mạnh sớm, giảm dần khi quy mô tăng |
| `EARLY_STABLE` | 1,15 | 1,08 | 1,00 | 0,92 | 0,85 | lợi thế sớm nhưng không sụp hẳn |
| `BALANCED` | 1,00 | 1,03 | 1,06 | 1,09 | 1,12 | tăng đều theo kinh nghiệm và hệ thống |
| `MID_SPIKE` | 0,78 | 1,15 | 1,28 | 1,18 | 1,05 | cần mở một mốc nghề/quân rồi bùng ở giữa |
| `LATE_ENGINE` | 0,58 | 0,78 | 1,06 | 1,35 | 1,62 | yếu hoặc chậm đầu kỳ, rất mạnh khi có nền |
| `COMPOUND_SNOWBALL` | 0,78 | 1,08 | 1,36 | 1,65 | 1,90 | lợi ích tái đầu tư vào chính nguồn sinh lợi |

### 5.3. Affinity theo họ bảng

Thứ tự vector luôn là `LV/MIL/BLD/PRO/EXP/TRD/EVT`.

| Class | Vector | Ý nghĩa |
|---|---|---|
| `NECRO` | 0,95/1,25/0,85/1,05/1,05/0,55/1,15 | xác chết, quân số, khai quật, snowball |
| `CONTROL` | 0,85/1,15/0,65/0,75/0,80/0,55/1,20 | khóa chiến trường và objective |
| `SUPPORT` | 0,80/0,90/0,85/1,00/0,80/0,75/1,20 | sustain, đội nhóm và sự kiện |
| `HUNTER` | 1,20/1,00/0,50/0,55/0,90/0,45/1,00 | săn mục tiêu và lên Cấp sớm |
| `WARLORD` | 0,90/1,20/0,55/0,55/0,70/0,40/1,10 | quân lực trực diện |
| `BUILDER` | 0,50/0,65/1,25/1,00/0,55/0,55/0,85 | công trình và giảm rework |
| `PRODUCER` | 0,55/0,60/0,95/1,25/0,55/0,90/0,85 | lương thực, vật tư, thịnh vượng |
| `EXPLORER` | 0,85/0,70/0,55/0,65/1,25/0,75/0,95 | đường đi, trinh sát, di tích |
| `TRADER` | 0,45/0,50/0,55/1,05/0,65/1,25/0,80 | thị trường, mạng lưới và thông tin |
| `TECH` | 0,55/1,05/1,20/1,15/0,75/0,75/1,00 | máy móc; chậm trước khi có vật liệu |

Với actor `a`, bảng `b`, pha `p`:

\[
TalentFit_{a,b,p}=Clamp(0,100,GradeBase_a\times PhaseCurve_{a,p}\times Affinity_{a,b})
\]

Không làm tròn `TalentFit` trước công thức tổng.

## 6. Hàm `CompletionStat`

### 6.1. Thành phần

Mọi input thuộc `0..100`:

| Ký hiệu | Thành phần | Nguồn runtime |
|---|---|---|
| `T` | `TalentFit` | §5 + talent state File 02 |
| `U` | `UnitFit` | roster quân thật, XP throughput, labor hoặc mobility theo metric |
| `E` | `EnvironmentFit` | địa hình, target density, route, weather, resource/chest field |
| `X` | `Execution` | hành động và lịch thật; NPC dùng policy, PC chỉ dùng event ledger |
| `S` | `SupplyFit` | thức ăn, nước, nhiệt, đạn, nhiên liệu, kho vận đã reserve |
| `C` | `ChestItemFit` | rương/vật phẩm đã tìm thấy hoặc internal seed hợp quyền mô phỏng |
| `L` | `LuckRealized` | fortune base + event may/rủi đã seed trước |
| `M` | `MomentumCapital` | vốn thật mang từ kỳ trước, §7 |
| `F` | `FrictionIndex` | thương tích, đói khát, lạnh, delay, overload, counter |

### 6.2. Ma trận trọng số `RANK-CS-WEIGHTS-1.0`

| Họ bảng | `T` | `U` | `E` | `X` | `S` | `C` | `L` | `M` | Tổng |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `LEVEL_THRESHOLD` | 22 | 20 | 18 | 15 | 10 | 5 | 5 | 5 | 100 |
| `MILITARY` | 20 | 25 | 10 | 10 | 15 | 5 | 3 | 12 | 100 |
| `CONSTRUCTION` | 15 | 15 | 15 | 15 | 15 | 10 | 3 | 12 | 100 |
| `PROSPERITY` | 15 | 10 | 12 | 15 | 20 | 5 | 3 | 20 | 100 |
| `EXPLORATION` | 15 | 18 | 20 | 15 | 10 | 8 | 6 | 8 | 100 |
| `TRADE` | 12 | 8 | 10 | 18 | 20 | 4 | 5 | 23 | 100 |
| `EVENT_CONTRIBUTION` | 20 | 20 | 12 | 15 | 12 | 5 | 5 | 11 | 100 |

Hàng `PROSPERITY` ở đây chỉ dùng để dự báo khả năng cạnh tranh. Khi materialize bảng công khai, metric bắt buộc là `P` của File 01 `TERRITORY-VITALS-1.0-P` đã settle tới cùng `through_event_id`; `CompletionStat`, tên tuổi hoặc mô tả “kinh tế mạnh” không được thay score thật.

Với Lí Lan, `UnitFit_LEVEL` chỉ được đọc từ XP throughput có thể kiểm toán: `NORMAL_AWARD` của chính cô cộng `OWNER_XP_MIRROR` có receipt `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`. XP mà zombie `TOMB_QUEUE` tự nhận chỉ làm chính zombie tiến bộ; nó không vào throughput XP của Lí Lan. `UnitFit_MILITARY` vẫn đọc quân lực thật nên có thể tính cả zombie Ngôi Mộ như unit chiến đấu/lao động, nhưng không được cộng lại XP của chúng như một lợi thế Cấp. Dự báo chưa có event chỉ được dùng prior đã công bố; tuyệt đối không giả định “mọi tử linh đều chia XP”.

### 6.3. Công thức đóng

\[
BaseCS=\frac{w_TT+w_UU+w_EE+w_XX+w_SS+w_CC+w_LL+w_MM}{100}
\]

\[
CompletionStat=Clamp(0,100,BaseCS-0.25F)
\]

- Mọi input được clamp trước phép nhân.
- `w` là số nguyên từ đúng hàng bảng §6.2.
- Lưu nội bộ ít nhất bốn chữ số thập phân; hiển thị `RoundHalfUp` hai chữ số.
- Input thiếu làm forecast `BLOCKED`; không mặc định 0, trừ trường hợp state thật xác nhận bằng 0.
- `X` của Lí Lan không được lấy từ tính cách để tự quyết hành động. Trước khi có action ledger, `CompletionStat` chính thức của cô là `UNRESOLVED`.

### 6.4. `LuckRealized`

\[
LuckRealized=Clamp(0,100,FortuneBase+\sum_i LuckDelta_i)
\]

Mỗi `LuckDelta_i∈[-12,+12]` phải gắn một pre-seeded event, source và timestamp. Tổng trọng số may mắn trong bất kỳ họ bảng nào không vượt 6%; vận may không thể tự biến một người không đủ điều kiện thành người hoàn thành.

### 6.5. `FrictionIndex`

\[
F=0.20I_{injury}+0.15I_{hunger/thirst}+0.15I_{cold}+0.20I_{supply\ shortfall}
+0.15I_{order\ overload}+0.15I_{counter/route}
\]

Sáu input đều `0..100`. Nếu không có actor/quân thì thành phần không áp dụng bằng 0; không bỏ mẫu số vì trọng số đã cố định.

## 7. Vốn quán tính và lợi thế người đã dẫn đầu

### 7.1. Không có `PreviousRankBonus`

Không cộng điểm chỉ vì một tên từng đứng Top. Lợi thế đó đã tồn tại dưới dạng Cấp, quân, công trình, tài nguyên, thông tin, danh tiếng và quyền tiếp cận.

### 7.2. Hàm chuẩn hóa vốn

Với đại lượng không âm `x`, trung vị eligible `m` và epsilon cùng đơn vị:

\[
NormRatio(x,m,\varepsilon)=Clamp(0,100,50+25\log_2\frac{x+\varepsilon}{m+\varepsilon})
\]

`ε=1` cho count/point/value; `ε=0,01` cho rate mỗi giờ. Nếu eligible set rỗng, bảng không chạy. Nếu chỉ có một eligible actor, mọi ratio bằng 50 và hợp đồng phải quyết định có công bố bảng một người hay không.

\[
M=0.25N_{level}+0.25N_{force}+0.20N_{infrastructure}
+0.15N_{inventory}+0.10N_{intel}+0.05N_{reputation}
\]

Các `N` lấy tại snapshot đầu kỳ. Một kỳ bảng mới chỉ cập nhật `M` sau khi settlement cũ đã commit. Không double-count phần thưởng chưa nhận.

### 7.3. Vì sao thứ hạng vẫn có thể đổi

- bảng mới đo metric khác;
- thiên phú đổi đoạn phase curve;
- binh chủng bị địa hình/counter làm mất `UnitFit`;
- hậu cần tăng chậm hơn quy mô;
- actor chết, bị thương, chia quân hoặc bỏ objective;
- người sau tìm được tài nguyên/đồng minh thật và tạo vốn mới.

## 8. Mapping `CompletionStat` sang từng họ kết quả

### 8.1. Bảng đạt ngưỡng theo thời gian

\[
ProjectedDurationMin=\max(T_{min},RoundHalfUp(T_{ref}\times2^{(50-CS)/25}))
\]

`OPENING_LEVEL` dùng `T_ref=5.760 phút` và `T_min=1.440 phút`. Đây là dự báo lịch, không phải timestamp hoàn thành. Timestamp thật chỉ sinh khi event đủ XP đưa actor tới Cấp 10.

### 8.2. Bảng tích lũy output

\[
ProjectedOutput=\min(PhysicalCap,\lfloor O_{ref}\times2^{(CS-50)/25}\rfloor)
\]

`PhysicalCap` lấy từ input, công suất, worker-hours, kho và thời gian thật. Không có tài nguyên thì output bằng 0 dù `CS=100`.

### 8.3. Bảng quân sự

`CompletionStat_MILITARY` chỉ mô phỏng tốc độ tạo/duy trì lực lượng. Hàng công khai xếp theo metric quân sự đã khóa trong hợp đồng, ví dụ `EffectiveForce` File 01; không xếp trực tiếp theo `CS`.

Một binh chủng đơn lẻ mạnh có thể có `UnitFit_LEVEL` thấp vì ít tuyến săn, downtime cao và không chia được objective, nhưng `UnitFit_MILITARY` rất cao. Vì vậy người đó có thể thấp ở Bảng Cấp 10 rồi vươn lên bảng quân lực mà không cần buff hồi tố.

### 8.4. Bảng contribution

Điểm contribution là tổng event hợp lệ theo File 01. `CS` chọn tốc độ/kế hoạch NPC; điểm thật lấy từ objective, damage, heal, logistics, rescue và control đã commit. Không được đổi `CS` thẳng thành contribution.

### 8.5. Quy tắc chốt chung

```text
forecast with CompletionStat
→ schedule actions and stop conditions
→ simulate finite world state
→ commit event ledger
→ read contract metric from committed state
→ apply qualification
→ sort metric
→ apply tie_rule
→ delay/public fields
```

## 9. Registry roster cố định

### 9.1. P0 — `PHAN_KHU_LL01`, 10 người cố định

| ID | Nhân vật | Nguồn | Tính cách và policy | Thiên phú | Tác dụng và giới hạn | Binh chủng/đường quân | Điểm bắt đầu, rương, vận may | Bảng phù hợp |
|---|---|---|---|---|---|---|---|---|
| `RC-001` | **Lí Lan** | `USER_LOCKED`; File 06 | bình tĩnh, giọng lạnh, thực dụng; mọi quyết định dùng user/event ledger | **SSS — Tử Phục Linh Sư** | dựng xác hợp lệ thành tử thi trung thành; XP ròng hậu Tử Phục của unit trực tiếp phản chiếu 100% cho cô; zombie Ngôi Mộ bị loại; đầu kỳ vẫn bị giới hạn bởi xác tiếp cận được, Bậc hạch, khai quật, hậu cần và order bandwidth | Tử thi `DIRECT_TU_PHUC`; zombie `TOMB_QUEUE` từ Ngôi Mộ; T0 thực tế chưa có quân | `ANCHOR-RC-001` tại H0; `BATTLEFIELD`; trường rương cố định 86/100, 30 rương trong 3 km; vận 73 | Cấp, quân sự, khám phá, event; curve snowball |
| `RC-002` | **Cơ Tâm Nguyệt** | `SOURCE_IDENTITY`; vai lặp lại và Tinh Nguyệt Quân Đoàn | điềm tĩnh, kêu gọi đoàn kết, hợp tác nhưng giữ tự chủ | **S — Niệm Khí Nữ Hoàng** `DESIGN_ADAPTED` | tạo niệm lực/niệm thú và liên kết đội hình; P0 thiếu tài nguyên tinh thần, P2+ kiểm soát objective rất mạnh | niệm thú nhỏ, xạ thủ niệm lực, đội hỗ trợ | bồn địa Kính Tuyết; `CHEST_RICH`; rương 76; vận 70 | event, quân sự, liên minh; late engine |
| `RC-003` | **Diêu Nhất Minh** | `SOURCE_IDENTITY`; đối tác và đầu mối quân đoàn lặp lại | thực tế, dễ hợp tác, ưu tiên người sống và tổ chức | **S — Hợp Trận Đồng Tâm** `DESIGN_ADAPTED` | giảm độ trễ mệnh lệnh và tăng hiệu suất đội hỗn hợp; kém khi đơn độc, mạnh dần theo quân số có kỷ luật | bộ binh hỗn hợp, dân binh Cực Địa, hậu cần | tàn trấn Hắc Tuyết; `RUIN_RICH`; rương 63; vận 58 | quân đoàn, event, prosperity; balanced |
| `RC-004` | **Phương Long** | `SOURCE_IDENTITY`; đối thủ khai cuộc có hành động và kế hoạch riêng | hiếu thắng, đa nghi, sẵn sàng mua tin và đánh phủ đầu | **A — Săn Đoạt Dấu Vết** `DESIGN_ADAPTED` | tăng truy dấu con mồi/người chơi và XP khi kết liễu mục tiêu bị đánh dấu; giảm mạnh ở chiến tranh trận tuyến | đội tập kích nhẹ, thợ săn và cướp đoạt | rừng Bạch Nha; `TARGET_RICH`; rương 55; vận 67 | Bảng Cấp, PvP sớm; early burst |
| `RC-005` | **Chu Bác** | `SOURCE_IDENTITY`; thủ lĩnh nhóm khai cuộc | thô bạo, thực dụng, giỏi gom người quen | **B — Quần Liệp Hiệu Lệnh** `DESIGN_ADAPTED` | tăng phối hợp săn của nhóm nhỏ; hiệu suất giảm khi đội vượt 12 actor | thợ săn gia đình, cung thủ và hai nhóm liên kết | lưu vực Băng Liệp; `TARGET_RICH`; rương 45; vận 56 | Cấp, săn, quân sự nhỏ; early burst |
| `RC-006` | **Vũ Hưng Hổ** | `SOURCE_IDENTITY`; thủ lĩnh Hổ Đường khai cuộc | quyết đoán, trọng uy, thích đối đầu công khai | **A — Hổ Đường Chiến Ý** `DESIGN_ADAPTED` | morale và sát thương tăng khi giữ đội hình áp sát; yếu trước kite, bẫy và thiếu lương | bộ binh cận chiến, khiên nhẹ | sườn Thiết Hổ; `RESOURCE_RICH`; rương 48; vận 61 | quân sự, event phòng thủ; early stable |
| `RC-007` | **Tạ Nghiên** | `CAMPAIGN_ORIGINAL` | tỉ mỉ, ít mạo hiểm, ghét làm lại | **A — Lệnh Dựng Trại** | giảm rework và waste của công trình đã khảo sát; không tạo vật liệu hay công trình tức thì | tổ thợ, khiên công binh | phế thôn Cột Khói; `RUIN_RICH`; rương 68; vận 52 | xây dựng, thịnh vượng; mid spike |
| `RC-008` | **Lục Tử Du** | `CAMPAIGN_ORIGINAL` | tò mò, kiên nhẫn, luôn giữ đường lui | **B — Bạch Vụ Dẫn Lộ** | giảm sai số định hướng và ColdLoad khi trinh sát; không phát hiện rương ngoài seed | trinh sát ván trượt, chim tuyết | đồng trắng Mù Sương; `CHEST_RICH`; rương 82; vận 64 | khám phá, rương, event cứu hộ |
| `RC-009` | **Khổng Mạn** | `CAMPAIGN_ORIGINAL` | mềm mỏng, nhớ nợ, tránh chiến trực diện | **C — Khế Ước Công Bình** | tăng trust và giảm fail giao dịch đúng điều khoản; không ép người khác chấp thuận | đoàn khuân vác, hộ vệ thuê | ngã ba Băng Lộ; `TRADE_HUB`; rương 42; vận 79 | thương mại, prosperity; late engine |
| `RC-010` | **Tô Hàn** | `CAMPAIGN_ORIGINAL` | điềm tĩnh, vị tha có giới hạn, ưu tiên triệt thoái an toàn | **B — Hàn Quang Cứu Hộ** | ổn định thương tích và giảm tổn thất lạnh; sát thương thấp | y tá chiến trường, khiên hộ tống | khe Thánh Quang cũ; `SAFE_SUSTAIN`; rương 51; vận 57 | event, survival, support |

**Binding tọa độ P0 `PLAYER-ANCHORS-LL01-1.0`.** File 03 Phụ lục 3.K sở hữu geometry; File 07 không dùng lại các số “rương/fortune” như seed. Tại `SAVE-T0-CLEAN`, mười dòng trên bind lần lượt và duy nhất tới `ANCHOR-RC-001…010`: `(0;0)`, `(68;52)`, `(-71;38)`, `(-58;-57)`, `(62;-61)`, `(84;10)`, `(-86;-8)`, `(14;82)`, `(42;-83)`, `(-35;76)` km trong `LL01-LOCAL-KM`. Sai/mất một anchor chặn P0; không dời contender để tạo rival gần, cân địa hình hoặc đổi bảng.

### 9.2. P1 — gộp khu vực, thêm 8 người; roster tích lũy 18

| ID | Nhân vật | Nguồn | Tính cách | Thiên phú và đường cong | Binh chủng | Điểm bắt đầu, rương, vận may | Chức năng bảng |
|---|---|---|---|---|---|---|---|
| `RC-011` | **Bạch Chỉ** | `SOURCE_IDENTITY`; thủ lĩnh Sát Na Vĩnh Hằng, quyền năng Băng Tuyết về sau | lạnh, quyết đoán, quản trị tốt, biết hợp nhất lực lượng | **SS — Băng Tuyết Nữ Vương** `DESIGN_ADAPTED`; tạo vùng băng và tăng hiệu suất pháp sư; P0 tốn mana, P3+ thành domain; `LATE_ENGINE` | pháp sư băng, vệ sĩ hàn sương | thành băng Lam Tích; `RESOURCE_RICH`; rương 71; vận 69 | quân đoàn, quân sự, quốc gia |
| `RC-012` | **Vệ Kiếm Nhất** | `SOURCE_IDENTITY`; Kiếm Các, đối thủ quân đoàn lặp lại | thẳng, mê kiếm, can đảm nhưng đôi lúc quá tin vào tinh binh | **S — Kiếm Tâm Hiệu Lệnh** `DESIGN_ADAPTED`; tinh binh kiếm nhận combo và morale; quân ít nên Bảng Cấp cá nhân không luôn nhanh | một đội kiếm sĩ tinh nhuệ | Kiếm Cốc; `HAZARD_NEXUS`; rương 74; vận 62 | quân sự cao, trial, boss |
| `RC-013` | **Trình Lộc** | `SOURCE_IDENTITY`; Luân Hồi Quân Đoàn | hài hước khô, linh hoạt, chấp nhận rút để đánh lại | **S — Luân Hồi Dư Chấn** `DESIGN_ADAPTED`; hồi một phần readiness sau trận, không hồi sinh người chết | bộ binh attrition, pháp sư hồi phục | đầm Tro Lạnh; `RUIN_RICH`; rương 66; vận 75 | event dài, quân đoàn, survival |
| `RC-014` | **Điền Kính** | `SOURCE_IDENTITY`; nguồn xác nhận người dùng thiên phú S và vai trò quân đoàn | rụt rè ngoài chiến đấu, trung thành với người giúp mình, tinh thần bất ổn cần theo dõi | **S — Bất Tử Giả** `SOURCE_LOCKED_NAME_GRADE`; chống chết và hợp pháp thuật/hidden job, không miễn second-death hay phong ấn | solo hidden-job, dạng thằn lằn, sau mới có tùy tùng | hang Tử Tinh; `HAZARD_NEXUS`; rương 60; vận 49 | quân sự cá thể, survival; mid spike |
| `RC-015` | **Ninh Sương** | `CAMPAIGN_ORIGINAL` | kiên nhẫn, thích chuẩn bị nhiều lớp | **SS — Kính Binh Phân Ảnh**; sao chiến thuật ngắn hạn, tốn mana theo số ảnh; `COMPOUND_SNOWBALL` | quân ảnh gương, cung thủ thật làm lõi | hẻm Kính Băng; `CHEST_RICH`; rương 88; vận 83 | event, quân sự, khám phá |
| `RC-016` | **Cố Trường Phong** | `CAMPAIGN_ORIGINAL` | phóng khoáng, giữ lời, ghét cố thủ | **S — Phong Hành Quân Lộ**; tăng tốc tuyến đã khảo sát, không bỏ qua terrain/hậu cần; `EARLY_STABLE` | kỵ binh tuyết, trinh sát | hành lang Bắc Phong; `MOBILITY_CORRIDOR`; rương 54; vận 65 | khám phá, tiếp vận, event |
| `RC-017` | **Tần Mặc** | `CAMPAIGN_ORIGINAL` | ít nói, tích trữ, chấp nhận khởi đầu chậm | **SS — Cơ Giới Mẫu Sào**; mở dây chuyền construct sau khi có xưởng và kim loại; `LATE_ENGINE` | construct, ụ súng, công binh | mạch sắt Đen; `RESOURCE_RICH`; rương 59; vận 55 | xây dựng, quân sự, prosperity |
| `RC-018` | **Phan Duy** | `CAMPAIGN_ORIGINAL` | xã giao, thận trọng tín dụng, không trung thành miễn phí | **A — Vạn Lộ Thương Khế**; tăng thanh khoản và caravan intel, không tạo nhu cầu giả; `BALANCED` | caravan, hộ vệ thuê | chợ đổ Sương Xám; `TRADE_HUB`; rương 64; vận 81 | thương mại, prosperity |

### 9.3. P2 — liên khu, thêm 6 người; roster tích lũy 24

| ID | Nhân vật | Nguồn | Thiên phú, tính cách và giới hạn | Binh chủng | Điểm bắt đầu; rương; vận | Bảng phù hợp |
|---|---|---|---|---|---|---|
| `RC-019` | **Mạnh Nghị** | `SOURCE_IDENTITY`; tuyến Nhân Hoàng và tương tác lặp lại cuối truyện | **SS — Nhân Hoàng Hậu Tuyển** `DESIGN_ADAPTED`; nghiêm, có ý thức cộng đồng; tăng chính danh/phối hợp nhân tộc sau khi có dân và thiết chế, rất yếu lúc đơn độc; `LATE_ENGINE` | cấm vệ nhân tộc, quân levy có tổ chức | phế đô Hoàng Ấn; rương 77; vận 68 | prosperity, quân sự, quốc gia |
| `RC-020` | **Tô Vãn** | `CAMPAIGN_ORIGINAL` | **SSS — Kinh Vĩ Thành Quốc**; lý trí, nhìn dài hạn; liên kết công trình–dân–kho thành network, không có công trình thì gần như trống; `LATE_ENGINE` | công binh, vệ thành, quản sự | địa nhiệt thành cũ; rương 73; vận 60 | xây dựng, prosperity, quốc gia |
| `RC-021` | **Thẩm Dạ** | `CAMPAIGN_ORIGINAL` | **SS — Ảnh Giới Hành Quân**; kín đáo, hay giữ phương án thoát; đưa đội nhỏ qua shadow route đã neo, không teleport mù; `MID_SPIKE` | trinh sát bóng, sát thủ | rừng Đêm Chết; rương 69; vận 71 | khám phá, event, PvP |
| `RC-022` | **Bạch Lộ** | `CAMPAIGN_ORIGINAL` | **S — Vạn Dực Trinh Thiên**; cởi mở, thích bản đồ; tăng trinh sát trên không nhưng sợ bão/anti-air; `BALANCED` | kỵ điểu, xạ thủ bay | tháp Thiên Phong; rương 84; vận 74 | khám phá, event |
| `RC-023` | **Triệu Nham** | `CAMPAIGN_ORIGINAL` | **SS — Sơn Mạch Cự Linh**; chậm, chắc, bảo thủ; gọi golem từ đá đã khai thác, rất mạnh công thành nhưng chậm lên Cấp; `MID_SPIKE` | golem, pháo đá, công binh | tim Núi Đen; rương 61; vận 48 | quân sự, xây dựng |
| `RC-024` | **Đào Nhiên** | `CAMPAIGN_ORIGINAL` | **S — Bách Thảo Chuẩn Hóa**; ôn hòa nhưng cứng về quy trình; nhân giống dược/thực phẩm đã phân tích, không tạo giống mới vô cớ; `LATE_ENGINE` | dược sư, nông binh, hộ vệ | thung lũng Bách Thảo; rương 67; vận 63 | prosperity, event, trade |

### 9.4. P3 — lục địa, thêm 4 người; roster tích lũy 28

| ID | Nhân vật | Thiên phú và tính cách | Binh chủng | Điểm bắt đầu; rương; vận | Hướng cạnh tranh |
|---|---|---|---|---|---|
| `RC-025` | **Khương Vô Cực** | **SSS — Tinh Lô Đúc Quân**; cầu toàn, kiêu hãnh nghề; đồ tốt cần quặng, lò và thời gian thật; `COMPOUND_SNOWBALL` | cấm vệ trang bị nặng, thợ rèn chiến | vành núi lửa Hồng Tinh; 86; 72 | quân lực, công nghiệp, trade |
| `RC-026` | **Cảnh Dao** | **SS — Thánh Thành Hồi Âm**; kỷ luật, tin giáo luật, không thỏa hiệp với tử linh chưa kiểm chứng; domain Thánh mạnh theo dân tín ngưỡng; `BALANCED` | thánh vệ, tư tế, griffin | biên thùy Thánh Thành; 78; 59 | event, quân sự; counter tự nhiên của Lí Lan |
| `RC-027` | **Tạ Trầm** | **SS — Hư Không Dịch Trạm**; lạnh và chính xác; nối các trạm đã dựng, không mở cổng tới nơi chưa neo; `LATE_ENGINE` | hộ vệ cổng, pháp sư không gian | khe Hư Không; 91; 76 | khám phá, trade, logistics |
| `RC-028` | **Mộ Dung Tuyết** | **S — Vĩnh Sương Lĩnh Vực**; điềm tĩnh, thích tiêu hao; giảm tốc và nhiệt đối phương nhưng tăng upkeep đồng minh; `BALANCED` | pháp sư băng, khiên hàn | cực điểm Lam Băng; 65; 57 | quân sự, defense, event |

### 9.5. P4 — thế giới, thêm 4 người; roster tích lũy 32

| ID | Nhân vật | Thiên phú và tính cách | Binh chủng | Điểm bắt đầu; rương; vận | Hướng cạnh tranh |
|---|---|---|---|---|---|
| `RC-029` | **Sở Thiên Mệnh** | **SSS — Quốc Vận Thiên Mệnh**; uy nghi, thực dụng chính trị; cần quốc gia có dân, luật và chính danh, P0 gần như không có output; `LATE_ENGINE` | quân chính quy đa binh chủng | long mạch Trung Châu; 80; 77 | quốc gia, prosperity, world event |
| `RC-030` | **Yến Vô Song** | **SSS — Vạn Kiếm Quy Nhất**; trực diện, tôn trọng kẻ mạnh; gom kiếm ý của đơn vị kiếm đã huấn luyện, quân hẹp và tốn trang bị; `MID_SPIKE` | kiếm vệ tinh nhuệ, kiếm trận | kiếm mộ Thiên Hà; 89; 66 | quân sự, boss, trial |
| `RC-031` | **Mạnh Chương** | **SS — Thanh Long Sinh Mạch**; kiên nhẫn, bảo vệ sinh thái; phục hồi đất/nước theo chu kỳ, không tạo tài nguyên tức thì; `COMPOUND_SNOWBALL` | long duệ, nông binh, thủy quân | đại long mạch Đông Hải; 75; 70 | prosperity, ecology, world event |
| `RC-032` | **Quý An** | **S — Vô Thanh Mậu Dịch**; kín tiếng, không phá hợp đồng; giấu tuyến thương mại khỏi quan sát thường nhưng không khỏi audit hệ thống; `BALANCED` | caravan liên lục địa, hộ vệ tình báo | Con Đường Tơ Băng; 72; 85 | trade, intel, prosperity |

## 10. Registry tham số máy

### 10.1. Troop profile vectors

Thứ tự `LV/MIL/BLD/PRO/EXP/TRD/EVT`.

| ID | Vector | Giải thích ngắn |
|---|---|---|
| `SWARM_LIGHT` | 72/82/78/75/80/45/88 | nhiều thân thể, chia objective tốt, hậu cần tăng nhanh |
| `PSI_PACK` | 70/82/45/58/78/42/90 | control tốt, phụ thuộc tài nguyên tinh thần |
| `MIXED_FORMATION` | 78/80/62/72/66/55/86 | cân bằng, hưởng lợi từ chỉ huy |
| `RAID_PACK` | 82/76/35/40/72/45/80 | săn và cướp nhanh, giữ đất kém |
| `HUNT_PACK` | 85/68/38/46/78/42/76 | XP sớm tốt, chiến tranh lớn yếu |
| `MELEE_PACK` | 74/82/48/45/55/35/80 | giao chiến tốt, dễ bị kite |
| `WORK_CREW` | 45/42/94/90/55/58/62 | xây/sản xuất, chiến đấu thấp |
| `SCOUT_NETWORK` | 64/60/48/58/96/62/78 | bản đồ và cảnh báo |
| `CARAVAN` | 35/48/58/86/70/98/62 | thương mại/hậu cần |
| `SUPPORT_CORPS` | 58/70/68/80/65/62/94 | sustain và cứu hộ |
| `FROST_MAGE` | 58/90/52/68/70/48/91 | mạnh theo mana/domain |
| `SWORD_ELITE` | 46/94/42/38/66/30/86 | ít đơn vị, Level10 chậm hơn quân lực |
| `ATTRITION_CORPS` | 60/84/56/68/58/45/92 | mạnh ở hoạt động dài |
| `SOLO_ELITE` | 42/91/32/30/70/25/78 | một actor mạnh, ít tuyến XP/objective |
| `MIRROR_SWARM` | 62/91/58/64/72/38/94 | scale tốt nhưng tốn mana |
| `CAVALRY_SCOUT` | 78/78/42/52/95/60/82 | tốc độ và trinh sát |
| `CONSTRUCT_LINE` | 40/95/90/84/58/50/88 | cực mạnh sau khi có xưởng |
| `IMPERIAL_HOST` | 52/92/72/88/68/62/90 | cần dân, luật và command |
| `AIR_SCOUT` | 70/82/40/52/98/55/86 | trinh sát cao, sợ bão/anti-air |
| `SIEGE_GOLEM` | 34/97/88/56/30/28/90 | công thành cao, lên Cấp chậm |
| `FARM_SUPPORT` | 62/60/86/96/66/74/80 | kinh tế và hồi phục |
| `HOLY_ORDER` | 58/92/68/76/62/55/94 | event/anti-dark, upkeep cao |
| `PORTAL_GUARD` | 54/82/70/78/92/88/88 | mạnh khi mạng trạm đã dựng |

### 10.2. Environment vectors

| ID | Vector `LV/MIL/BLD/PRO/EXP/TRD/EVT` | Bản chất |
|---|---|---|
| `BATTLEFIELD` | 96/92/78/70/85/35/92 | nhiều mục tiêu/xác/di tích, nguy cơ cao |
| `TARGET_RICH` | 88/82/55/50/75/35/84 | nhiều quái và đường săn |
| `RESOURCE_RICH` | 55/65/90/92/65/72/75 | quặng/gỗ/nhiệt, ít mục tiêu XP |
| `RUIN_RICH` | 70/72/85/80/88/65/84 | công trình cũ, vật liệu và bí mật |
| `CHEST_RICH` | 72/70/65/68/95/55/88 | site rương/di tích cao, hazard đi kèm |
| `SAFE_SUSTAIN` | 65/58/78/90/68/72/75 | thức ăn/nước/nhiệt ổn định |
| `TRADE_HUB` | 55/60/72/86/75/96/78 | nhiều tuyến và actor giao dịch |
| `HAZARD_NEXUS` | 82/90/75/65/92/48/95 | reward lớn và rủi ro lớn |
| `MOBILITY_CORRIDOR` | 72/68/60/65/92/78/80 | đường đi tốt, ít tài nguyên tập trung |

### 10.3. Machine registry rút gọn

`X/S/C/L/F` lần lượt là execution prior, supply prior, chest potential, fortune base và starting friction. Lí Lan dùng `X=PC`, không có prior thực thi.

| ID | Grade | Curve | Affinity | Troop | Environment | `X/S/C/L/F` |
|---|---:|---|---|---|---|---|
| RC-001 | SSS | COMPOUND_SNOWBALL | NECRO | SWARM_LIGHT | BATTLEFIELD | PC/62/86/73/8 |
| RC-002 | S | LATE_ENGINE | CONTROL | PSI_PACK | CHEST_RICH | 82/68/76/70/8 |
| RC-003 | S | BALANCED | SUPPORT | MIXED_FORMATION | RUIN_RICH | 84/72/63/58/5 |
| RC-004 | A | EARLY_BURST | HUNTER | RAID_PACK | TARGET_RICH | 76/55/55/67/14 |
| RC-005 | B | EARLY_BURST | HUNTER | HUNT_PACK | TARGET_RICH | 74/62/45/56/10 |
| RC-006 | A | EARLY_STABLE | WARLORD | MELEE_PACK | RESOURCE_RICH | 79/65/48/61/9 |
| RC-007 | A | MID_SPIKE | BUILDER | WORK_CREW | RUIN_RICH | 91/80/68/52/4 |
| RC-008 | B | EARLY_STABLE | EXPLORER | SCOUT_NETWORK | CHEST_RICH | 86/67/82/64/7 |
| RC-009 | C | LATE_ENGINE | TRADER | CARAVAN | TRADE_HUB | 88/74/42/79/5 |
| RC-010 | B | BALANCED | SUPPORT | SUPPORT_CORPS | SAFE_SUSTAIN | 83/82/51/57/4 |
| RC-011 | SS | LATE_ENGINE | CONTROL | FROST_MAGE | RESOURCE_RICH | 89/74/71/69/6 |
| RC-012 | S | EARLY_STABLE | WARLORD | SWORD_ELITE | HAZARD_NEXUS | 87/61/74/62/11 |
| RC-013 | S | BALANCED | SUPPORT | ATTRITION_CORPS | RUIN_RICH | 85/76/66/75/5 |
| RC-014 | S | MID_SPIKE | WARLORD | SOLO_ELITE | HAZARD_NEXUS | 70/54/60/49/16 |
| RC-015 | SS | COMPOUND_SNOWBALL | CONTROL | MIRROR_SWARM | CHEST_RICH | 90/68/88/83/9 |
| RC-016 | S | EARLY_STABLE | EXPLORER | CAVALRY_SCOUT | MOBILITY_CORRIDOR | 85/71/54/65/6 |
| RC-017 | SS | LATE_ENGINE | TECH | CONSTRUCT_LINE | RESOURCE_RICH | 94/78/59/55/7 |
| RC-018 | A | BALANCED | TRADER | CARAVAN | TRADE_HUB | 91/82/64/81/3 |
| RC-019 | SS | LATE_ENGINE | SUPPORT | IMPERIAL_HOST | RUIN_RICH | 92/84/77/68/5 |
| RC-020 | SSS | LATE_ENGINE | BUILDER | WORK_CREW | RESOURCE_RICH | 96/88/73/60/4 |
| RC-021 | SS | MID_SPIKE | EXPLORER | SOLO_ELITE | HAZARD_NEXUS | 90/66/69/71/9 |
| RC-022 | S | BALANCED | EXPLORER | AIR_SCOUT | CHEST_RICH | 87/70/84/74/8 |
| RC-023 | SS | MID_SPIKE | WARLORD | SIEGE_GOLEM | RESOURCE_RICH | 88/80/61/48/7 |
| RC-024 | S | LATE_ENGINE | PRODUCER | FARM_SUPPORT | SAFE_SUSTAIN | 93/92/67/63/3 |
| RC-025 | SSS | COMPOUND_SNOWBALL | TECH | CONSTRUCT_LINE | HAZARD_NEXUS | 95/86/86/72/6 |
| RC-026 | SS | BALANCED | SUPPORT | HOLY_ORDER | SAFE_SUSTAIN | 91/82/78/59/5 |
| RC-027 | SS | LATE_ENGINE | EXPLORER | PORTAL_GUARD | HAZARD_NEXUS | 96/79/91/76/7 |
| RC-028 | S | BALANCED | CONTROL | FROST_MAGE | RESOURCE_RICH | 90/83/65/57/6 |
| RC-029 | SSS | LATE_ENGINE | SUPPORT | IMPERIAL_HOST | RESOURCE_RICH | 94/92/80/77/4 |
| RC-030 | SSS | MID_SPIKE | WARLORD | SWORD_ELITE | HAZARD_NEXUS | 93/78/89/66/8 |
| RC-031 | SS | COMPOUND_SNOWBALL | PRODUCER | FARM_SUPPORT | SAFE_SUSTAIN | 92/94/75/70/3 |
| RC-032 | S | BALANCED | TRADER | CARAVAN | TRADE_HUB | 97/90/72/85/2 |

Các prior chỉ phục vụ mô phỏng NPC trước khi có event. Ngay khi một thành phần có state thật, state thật thay prior; không lấy trung bình hai nguồn.

## 11. Áp dụng cho Lí Lan mà không viết trước kết quả

### 11.1. Trạng thái canon sạch

Tại `SAVE-T0-CLEAN`:

- mọi bảng có `rank_rows=[]`;
- Lí Lan chưa có timestamp đạt Cấp 10;
- không có `PreviousRankBonus`;
- `Execution=UNRESOLVED` vì người dùng chưa chọn hành động;
- quân thật lấy từ File 06, không lấy `SWARM_LIGHT` như quân đã tồn tại;
- XP throughput của Lí Lan chưa có mirror receipt tại T0; không lấy XP giả định của zombie/quân tương lai làm state;
- mọi kết quả của test run trước đó bị loại.

### 11.2. Phép tính cấu trúc P0

Ở Bảng Cấp khai cuộc, với `GradeBase=100`, curve `COMPOUND_SNOWBALL(P0)=0,78` và affinity `NECRO→LV=0,95`:

\[
TalentFit_{LL,LV,P0}=100\times0.78\times0.95=74.10
\]

Điều này thể hiện đúng bản chất: SSS của Lí Lan đã mạnh ở đầu kỳ nhờ cổ chiến trường, nhưng phần vượt trội nhất chỉ xuất hiện khi cô có nhiều xác hợp lệ, quân, hạch, khai quật và vốn tích lũy.

Ở P2:

\[
TalentFit_{LL,MIL,P2}=Clamp(0,100,100\times1.36\times1.25)=100
\]

Đây là trần fit của thiên phú với metric quân sự, không phải bảo đảm hạng nhất. `UnitFit`, supply, execution, counter và quân thật vẫn quyết định kết quả.

### 11.3. QA forecast duy nhất được phép

Để kiểm công thức, có thể dùng giả định **không canon** `X=50`, `U=72`, `E=96`, `S=62`, `C=86`, `L=73`, `M=50`, `F=8`:

`U=72` ở đây là một input hình học để thử công thức, không phải phép cộng XP mirror đã xảy ra. Một QA khác muốn mô hình hóa lợi thế mới phải khai báo riêng số unit `DIRECT_TU_PHUC`, award nguồn và receipt rate; không được gộp XP zombie Ngôi Mộ hoặc ghi số mirror mà thiếu giao dịch nguồn.

\[
CS_{QA}=70.13
\]

\[
ProjectedDuration_{QA}=RoundHalfUp(5760\times2^{(50-70.13)/25})=3296\ phút
\]

Tức 54 giờ 56 phút trong một forecast trung tính. Con số này **không tạo event, không tạo hàng rank và không khóa thứ hạng**. Khi chơi thật, thay toàn bộ prior bằng event ledger rồi tính lại.

Với cùng một bộ prior P0 cho mười contender, preview nội bộ sau đây cho thấy logic của mô hình. Đây là `NON_CANON_QA_FORECAST`, **không phải Bảng Cấp**:

| Thứ tự forecast | ID | Người | Phẩm/curve | `CS_QA` | Thời lượng chiếu | Vì sao |
|---:|---|---|---|---:|---:|---|
| 1 | RC-004 | Phương Long | A / early burst | 76,20 | 46h25 | talent săn đúng metric, target-rich; friction cao giữ anh ta không quá vượt trội |
| 2 | RC-005 | Chu Bác | B / early burst | 73,04 | 50h41 | nhóm săn nhỏ chia vai tốt, nhưng trần dài hạn thấp |
| 3 | RC-001 | Lí Lan | SSS / compound | 70,13 | 54h56 | cổ chiến trường và trường 30 rương rất hợp, nhưng vẫn dùng `X=50` cùng troop-access prior; chưa giả định quyết định user |
| 4 | RC-003 | Diêu Nhất Minh | S / balanced | 68,68 | 57h12 | tổ chức/đội hình ổn định, không có burst săn |
| 5 | RC-008 | Lục Tử Du | B / early stable | 64,59 | 64h03 | khám phá tốt nhưng không chuyên kết liễu |
| 6 | RC-006 | Vũ Hưng Hổ | A / early stable | 63,32 | 66h21 | quân cận chiến mạnh, vị trí giàu tài nguyên nhưng ít mục tiêu XP hơn |
| 7 | RC-002 | Cơ Tâm Nguyệt | S / late engine | 62,10 | 68h38 | talent S thật nhưng curve P0 thấp; lợi thế lớn xuất hiện sau hợp khu |
| 8 | RC-010 | Tô Hàn | B / balanced | 60,00 | 72h45 | support giảm tổn thất hơn là tăng kill rate |
| 9 | RC-007 | Tạ Nghiên | A / mid spike | 56,24 | 80h45 | thiên về xây dựng, sẽ mạnh ở bảng khác |
| 10 | RC-009 | Khổng Mạn | C / late engine | 47,10 | 104h03 | thương mại chưa có đủ mạng lưới trong P0 |

`CS_QA` của Lí Lan biến thiên từ 62,63 tới 77,63 khi chỉ thay `X` từ 0 tới 100. Vì `X` phải đến từ lựa chọn thật, preview không được dùng để tuyên bố cô hạng 3. Nó chỉ chứng minh rằng build của cô có cửa Top sớm, đồng thời vẫn giữ đúng đặc tính snowball về sau.

### 11.4. Bốn regression bắt buộc

| Case | Kỳ vọng |
|---|---|
| `QA-RANK-01` | Một hunter Phẩm A `EARLY_BURST` có thể đạt Cấp 10 trước một actor S `LATE_ENGINE`, nhưng bị actor đó vượt ở bảng quốc gia P3. |
| `QA-RANK-02` | Một `SWORD_ELITE/SOLO_ELITE` có thể thấp ở Bảng Cấp vì ít tuyến XP nhưng cao ở bảng Quân lực sau khi đơn vị tinh nhuệ trưởng thành. |
| `QA-RANK-03` | Lí Lan có thể không Top 1 khai cuộc nếu user ưu tiên xây/khai quật hoặc thiếu mục tiêu hợp lệ; lợi thế SSS snowball phải tăng dần bằng state thật, không được nerf để tạo kịch tính. |
| `QA-RANK-04` | Cùng XP ròng, unit `DIRECT_TU_PHUC` tạo mirror receipt cho Lí Lan còn zombie `TOMB_QUEUE` không tạo; forecast/rank không được suy eligibility từ owner hoặc tên unit. |

Tên và thứ hạng trong test dùng `QA-A/QA-B/QA-C`; không dùng tên nhân vật campaign.

## 12. Materialize bảng và hiển thị công khai

### 12.1. Preflight

Trước `opens_at`:

1. đọc contract File 01;
2. xác định eligible population thật;
3. mở rộng roster cho mọi actor có `UpperBoundVisible=true` trước freeze;
4. bind phase, metric family và weight row;
5. snapshot talent, quân, địa hình, chest field, supply, luck event seed và momentum;
6. kiểm `unknown input count=0` cho NPC simulation;
7. giữ `Execution` của PC theo action ledger, không auto-play;
8. ghi `EVT-RANK-ROSTER-FREEZE-*`.

### 12.2. Trong cửa bảng

- NPC tick theo policy và state hữu hạn.
- Lí Lan chỉ tiến từ hành động người dùng hoặc automation đã được người dùng ra lệnh.
- Mỗi XP, kill, discovery, chest, injury, construction và supply delta vào đúng ledger.
- Mỗi khi Cấp/vật phẩm/state đổi, chạy trigger scan File 05 trước khi tiếp tục.
- `CompletionStat` có thể tái dự báo sau event nhưng không sửa quá khứ.

### 12.3. Hiển thị

Public row chỉ có trường hợp đồng cho phép. Nội bộ có thể biết talent, quân, vị trí, luck và `CS`; Bảng Cấp không tự lộ chúng.

```yaml
public_rank_row:
  rank:
  displayed_fields: "from active ranking_contract only"
  metric_value: "only if contract displays it"
  last_refresh:

internal_rank_audit:
  contender_id:
  completion_stat:
  component_snapshot: {T, U, E, X, S, C, L, M, F}
  source_events: []
  actual_metric_value:
  qualification_event:
  tie_break_value:
```

### 12.4. Bảng mở đầu của campaign mới

File này không viết sẵn Top 10. Trình tự hợp lệ là:

```text
T0: []
T0+48h: OPENING_LEVEL opens; rows = qualified events đã có
trong cửa: row mới chỉ xuất hiện khi actor thật đạt Cấp 10
T0+144h: settlement theo File 01
```

Nếu tại thời điểm Lí Lan đạt Cấp 10 có hai người đã đạt trước, cô đứng hạng 3. Nếu chưa ai đạt, cô đứng hạng 1. Hai trường hợp đều hợp lệ; chỉ event timestamp quyết định. Không được lấy thứ tự của test run để chọn một trường hợp.

## 13. Cách thêm hoặc loại một đối thủ

### 13.1. Thêm trước freeze

Một actor mới cần:

- lý do tồn tại trong seed/cốt truyện;
- full schema §4;
- talent, troop access, start site và fortune đã seed;
- upper-bound test;
- `EVT-CONTENDER-MATERIALIZE-*` trước freeze;
- cập nhật quota mà không vượt rarity budget.

### 13.2. Sau freeze

Không được thêm vào bảng hiện hành. Có thể tạo actor cho thế giới và đánh dấu `eligible_from_next_board=true`.

### 13.3. Loại

Chỉ bằng event: chết, mất tư cách, rời scope, bị cấm theo contract hoặc retirement tự nguyện. Xóa tên để dọn chỗ cho một đối thủ “kịch tính hơn” bị cấm.

## 14. Kiểm thử bắt buộc và cách ly test run

| Test ID | Điều kiện | Kết quả bắt buộc |
|---|---|---|
| `RR-01` | P0 count S+ | đúng 3, gồm RC-001/002/003 |
| `RR-02` | actor ngoài frozen roster muốn vào visible Top K | block kỳ hiện hành |
| `RR-03` | test rank có tên/timestamp | không xuất hiện trong clean campaign |
| `RR-04` | Lí Lan chưa có action ledger | `Execution=UNRESOLVED`, không chốt CS/result |
| `RR-05` | actor từng Top 1 nhưng mất toàn quân/kho | momentum giảm theo state; không có bonus hạng |
| `RR-06` | solo elite so Bảng Cấp và Quân lực | dùng hai `UnitFit` khác nhau |
| `RR-07` | SSS late engine ở P0 | áp curve P0, không dùng hệ số P4 |
| `RR-08` | rương chưa khám phá | không lộ tọa độ/loot trên public rank |
| `RR-09` | two actors actual metric tie | dùng tie_rule contract, không dùng CS |
| `RR-10` | `CompletionStat` cao nhưng không đủ vật tư | output bị `PhysicalCap`, có thể bằng 0 |
| `RR-11` | source character từng thắng trong nguyên tác | không tự copy thắng vào campaign |
| `RR-12` | test actor trùng tên source actor | chỉ profile source hợp lệ được giữ; test state vẫn bỏ |
| `RR-13` | tính `UnitFit_LEVEL` của Lí Lan sau một battle hỗn hợp | chỉ normal XP của cô + receipt direct-revive vào throughput; XP zombie Ngôi Mộ không được cộng cho cô |

## 15. Dấu vết nguồn `<>`

### 15.1. Danh tính được giữ vì có vai trò lặp lại

- Cơ Tâm Nguyệt: chủ động điều phối người sống trước hợp khu và tiếp tục với Tinh Nguyệt Quân Đoàn.
- Diêu Nhất Minh: hợp tác nhiều lần, lãnh địa/quân đoàn và hậu cần có vai trò thật.
- Bạch Chỉ, Vệ Kiếm Nhất, Trình Lộc: có quân đoàn, thứ hạng quân đoàn và hoạt động chung lặp lại.
- Điền Kính: thiên phú S `Bất Tử Giả`, hidden-job và trách nhiệm quân đoàn kéo dài nhiều arc.
- Mạnh Nghị: tuyến Nhân Hoàng xuất hiện ở giai đoạn muộn và quay lại tại truyền thừa.
- Phương Long, Chu Bác, Vũ Hưng Hổ: có tổ chức, hành động cạnh tranh và ảnh hưởng khai cuộc; giữ cho P0 nhưng không mặc định sống tới P4.

Các tên chỉ xuất hiện một lần trong chat để bình luận bảng bị loại khỏi roster.

### 15.2. Giới hạn chuyển thể

Tên, vai trò lặp lại và sự tồn tại trong nguồn là `SOURCE_IDENTITY`. Phẩm/tác dụng thiên phú ghi `DESIGN_ADAPTED` là cơ chế mới để campaign vận hành; không được tuyên bố đó là số liệu nguyên tác. Tên thiên phú/Phẩm `Bất Tử Giả/S` của Điền Kính được nguồn nêu trực tiếp. Thứ hạng nguồn chỉ dùng để xác nhận nhân vật thật sự cạnh tranh; Lord DnD không sao chép thứ tự ấy.

### 15.3. Nguồn đối chiếu chính

- [Trang và mục lục chính thức Qidian/QQ](https://kehuan.bookresource.qq.com/book/1040133596/) của `<Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa>`.
- [Chương 25](https://kehuan.bookresource.qq.com/chapter/1040133596/793033246/): điều kiện Bảng Cấp 100 người đầu đạt Cấp 10.
- [Chương 32](https://kehuan.bookresource.qq.com/chapter/1040133596/793540474/) và [Chương 45](https://kehuan.bookresource.qq.com/chapter/1040133596/794514815/): Phương Long, Chu Bác, Vũ Hưng Hổ là tác nhân cạnh tranh thật; rank cập nhật theo Cấp/progress.
- [Chương 201](https://kehuan.bookresource.qq.com/chapter/1040133596/802604515/) và mục lục Chương 373: Cơ Tâm Nguyệt cùng vai trò hợp khu/Tinh Nguyệt Quân Đoàn.
- Mục lục Chương 213 và 551: Diêu Nhất Minh, cấu trúc quân đoàn và bảng quân đoàn.
- [Chương 464–465 trên hệ thống QQ](https://mshuku.novel.qq.com/read/1050133618/465): Điền Kính và thiên phú S `Bất Tử Giả`.
- Mục lục Chương 492–496 và 551: Bạch Chỉ, Vệ Kiếm Nhất và Trình Lộc là thủ lĩnh cạnh tranh lặp lại.
- Mục lục Chương 998 và 1316–1318: Mạnh Nghị cùng tuyến Nhân Hoàng.
