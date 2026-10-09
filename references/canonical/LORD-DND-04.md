# LORD DND 04 — HỆ THỐNG SỨC MẠNH, VẬT PHẨM, CÔNG TRÌNH, TRIỆU HOÁN VÀ ANH HÙNG


> **Phạm vi bản 3.1.0 — 2026-08-29.** Đây là bộ quy tắc nền để viết truyện/campaign Lord DnD. Cốt truyện, nhịp phát triển thế giới và chuỗi đại sự kiện **không để trống**: chúng lấy tác phẩm gốc được đặt trong dấu `<>`, hiện là **Băng Phong Tận Thế: Ta Chế Tạo Hoàn Mỹ Lãnh Địa**, làm canon khung. Thiết lập riêng của Lí Lan, `Tử Phục Linh Sư`, Ngôi Mộ và quân đoàn tử thi được khóa tại File 06. Bản 3.1.0 giữ toàn bộ 3.0.0—mọi registry, `QUEST-PAYLOAD-LL01-1.0`, `CHEST-CATEGORY-3.0`, vòng đời `EVENT_EXCLUSIVE`, `HERO-GROUP-INFLUENCE-1.0` và 15 Hero của `LL01-HERO-LAIR-PACK-1.0`—rồi thêm `SEARCH-TEAM-CAPABILITY-1.0` để actor count, formation, frontage, detection, coordination và split-team tradeoff tạo ra search capacity thật mà không sinh thêm mục tiêu.
>
> **Thứ tự ưu tiên nguồn thiết kế:** `<>` là nguồn khống chế đối với cốt truyện, tiến trình thế giới, đại sự kiện và cơ chế cốt lõi. Truyện lãnh chúa khác và game RTS/4X/city-survival chỉ là nguồn phụ để lấp phần `<>` không nói rõ; nguồn phụ không được ghi đè hướng cốt truyện gốc. Hàng có nhãn `SOURCE_EXPLICIT/SOURCE_LOCKED` giữ số trực tiếp của thân truyện; chỉ những công thức/hàng còn lại mới là mô hình tổng hợp có nhãn, không được giả làm số nguồn.

> **Phân loại hằng số:** trừ hàng/mục có nhãn `SOURCE_LOCKED`, `USER_LOCKED` hoặc nhãn khác rõ ràng, mọi công thức, coefficient, catalog và xác suất trong file là `DESIGN_DEFAULT` của đúng phiên bản file; ví dụ là `EXAMPLE_ONLY`. Chúng không phải state đã tồn tại. Giá trị thế giới cụ thể phải được seed bằng event và lưu `rule_version`.

> **Khóa phát hành:** `document_id=LORD-DND-04`; `release_id=FILE04-3.1.0-SEARCH-TEAM-CAPABILITY.1`; resolver dùng `RELEASE-LINEAGE-LL01-1.3.0` và exact SHA-256, không chọn bằng semantic version trần.


> Các catalog trong file: **108 prototype vật phẩm**, **144 prototype công trình**, **96 chassis triệu hoán**, **64 archetype anh hùng**. Chúng là khung chức năng để ánh xạ vào canon `<>`, không sao chép/hard-code tên riêng.

## Mục lục

1. Kiến trúc sức mạnh nhiều trục
2. Bậc cấu trúc, level và phẩm chiến đấu
3. Combat power dùng để ghép, không dùng để phán thắng
4. HP, tài nguyên, công–thủ, hit và crit
5. Công thức sát thương và giảm sát thương
6. Trạng thái, khống chế, kháng và miễn nhiễm
7. Nhịp chiến đấu, kỹ năng và hành động
8. Vai trò, counter, đội hình và morale
9. Quân đội, đơn vị, command và hậu cần
10. Độ hiếm, item budget và affix
11. Trang bị, set, durability, binding và salvage
12. Rương Báu, chiến lợi phẩm, Bản Vẽ, chế tạo và cường hóa
13. Catalog 108 prototype vật phẩm
14. Hệ thống công trình và tech prerequisite
15. Catalog 144 prototype công trình
16. Hệ triệu hoán, command cap và khế ước
17. Catalog 96 chassis triệu hoán
18. Sinh vật anh hùng, tuyển mộ, trung thành và phát triển
19. Catalog 64 archetype anh hùng
20. Boss, raid, công thành và đại chiến
21. Tử vong, thương tật, hồi sinh và di sản
22. Kiểm thử cân bằng
23. Phụ lục 4.A–4.N

---

## 1. Kiến trúc sức mạnh nhiều trục

Một thực thể có ít nhất chín trục: level, bậc cấu trúc đã mở, bậc đang hoạt động, trần tư chất, phẩm chiến đấu, chức nghiệp, mastery, trang bị và trạng thái. Lãnh chúa còn có command/lãnh địa; summon có khế ước; hero có agency và quan hệ. Không gộp chúng thành “cấp 50 nên thắng”.

Các mã, biến và cấu trúc dữ liệu của File 04 là dữ liệu nội bộ phục vụ mô phỏng. Mọi thẻ đơn vị, thẻ vật phẩm, thẻ chiến lợi phẩm, thẻ công trình, phiếu triệu hồi, phiếu anh hùng, thông báo lên Cấp và trạng thái giao chiến hướng người chơi phải qua `SPELLED_OUT_LINE_GATE`: `T<n>` thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>`, phẩm trơ thành `Phẩm <phẩm>`, mã `H...` thành tên giai đoạn lãnh địa và `FireLevel...` thành hình thái + Cấp Lửa. Chỉ bản số liệu thô hoặc bản kiểm lỗi do `{{user}}` yêu cầu mới in mã nội bộ.

### 1.1. Bất biến

- Chênh bậc tạo lợi thế lớn nhưng không miễn nhiễm tuyệt đối.
- Nhóm yếu có thể thắng mạnh bằng counter, địa hình, morale, hậu cần và mục tiêu.
- Số lượng có hiệu suất giảm vì command, frontage và AoE.
- Vật phẩm không thay thế mastery; mastery không làm áo giáp xuất hiện.
- Anh hùng không phải robot; summon không phải dân số miễn phí.
- Bậc cấu trúc cao ở `Lv1` mở trần level, bỏ qua các lần phá bậc đã hoàn tất và cấp buff 10% lũy tiến theo Bậc; nó không cấp XP hoặc `LevelGrowth` của level chưa đạt.
- Phẩm cao cho nhiều điểm thuộc tính hơn ở mỗi lần lên level; promotion vĩnh viễn bù phần thiếu của các level cũ theo lịch sử nghề.
- Cấp thiên phú quyết định phần growth riêng của người chơi; hiệu ứng này nằm trong thuộc tính và không được nhân lại như một quality multiplier thứ hai.

## 2. Bậc cấu trúc, level và phẩm chiến đấu

Ba biến `T_form/T_active/T_cap` dùng theo File 02. Hệ số thuộc tính/combat lấy trực tiếp Bậc cấu trúc hiện có:

\[
TierMult_{combat}=TierMult(T_{form})=
\begin{cases}0.62,&T_{form}=0\\1.10^{T_{form}-1},&T_{form}\ge1\end{cases}
\]

Một đơn vị `T4, Lv1` dùng hệ số `1,10³=1,331`, nhưng vẫn không có XP, tăng trưởng level, mastery hoặc kỹ năng của `Lv31`. Hệ số luôn tính lại trên `Raw` hiện hành; không lưu bonus tại mốc đột phá. `T_active` vẫn dùng cho những cap/công thức ghi đích danh phần cấu trúc level đang vận hành. Mọi công thức cũ lấy `M_active` làm hệ số thuộc tính/combat bị `TierMult_combat` của bản này thay thế.

| Phẩm | Hệ số PB | `G_Q` điểm/level | Kỹ năng/AI | Quyền chỉ huy điển hình |
|---|---:|---:|---|---|
| Thường | 1,00 | 2,00 | kit nền | bản thân |
| Cựu binh | 1,15 | 2,50 | 1 biến thể | tổ nhỏ |
| Tinh anh | 1,45 | 3,25 | 1–2 passive | đội |
| Đầu lĩnh | 1,90 | 4,25 | phase nhỏ/aura | đại đội |
| Thống soái | 2,60 | 5,50 | kit hoàn chỉnh | tiểu đoàn |
| Lãnh chúa | 3,70 | 7,00 | lĩnh vực/luật nhỏ | quân đoàn |
| Thần thoại | 5,50 | 9,00 | luật có điều kiện | chiến trường/vùng |

Phẩm không tự cho quân. “Quyền chỉ huy” là năng lực tối ưu nếu có tổ chức và tín nhiệm. `G_Q` đi vào `LevelGrowth` của File 02, phân bổ theo hướng nghề `55/25/20`. Một đơn vị phẩm cao ở `Lv1` vẫn có growth tích lũy bằng 0; khác biệt level-up bắt đầu từ `Lv2`, còn kit/PB/AI có thể khác ngay từ đầu. Spawn weight, recruitment value, summon cost và production budget phải tính lifetime growth cao hơn, khiến phẩm cao thực sự hiếm và đắt hơn.

## 3. Combat power dùng để ghép, không dùng để phán thắng

\[
CP_{estimate}=TierMult_{combat}\times LevelFactor\times RankMult_{CP}\times \sqrt{Offense\times Defense}\times Utility\times Readiness
\]

CP có khoảng sai 10–50% theo độ trinh sát. Engine dùng CP để ghép event và cảnh báo; kết quả trận chạy công thức thực, địa hình, AI và mục tiêu. Không hiển thị CP đối phương chính xác nếu chưa quan sát.

`Offense/Defense` đã chứa thuộc tính tăng từ `G_Q` hoặc `G_T`. Vì vậy `RankMult_CP` trong CP chỉ đại diện phần kit, AI, aura và quyền hành động của phẩm chưa nằm trong hai vector ấy; nó không được nhân thêm một lần theo tỷ lệ growth, tránh đếm phẩm hai lần. Mapping và mọi input CP nằm ở `POWER-MATH-CLOSURE-1.0`, Phụ lục 4.K.

LevelFactor = `1+0,055ℓ` với `ℓ=(L−1) mod 10`, là tiến độ level trong dải đang hoạt động. Utility và Readiness dùng mapping đóng tại Phụ lục 4.K, không chấm bằng cảm giác hoặc số lượng kỹ năng.

## 4. HP, tài nguyên, công–thủ, hit và crit

### 4.1. Tài nguyên

HP, thể lực và mana lấy `Raw` đã gồm quality/talent level growth từ File 02 rồi nhân `TierMult(T_form)` đúng một lần. Một số nghề dùng nộ, focus, đạn, nhiệt, faith hoặc command; chúng không phải mana đổi tên nếu flow khác. Khi promotion, đột phá hoặc giáng Bậc làm đổi trần tài nguyên, phần trăm HP/mana/thể lực hiện tại được giữ để thay đổi hệ số không biến thành hồi phục miễn phí hay sát thương miễn phí giữa giao tranh.

Mana vận hành theo `MANA-RECOVERY-1.0`, File 02 §4.1A. Trước mọi đòn/phép có cost Mana, engine phải quyết toán hồ tới đúng timestamp hành động rồi mới kiểm tra và trừ cost; cooldown không thay cost và cost không được trừ trước khi action hợp lệ. Hồi thụ động không phải một hành động của actor, không cần lệnh từ `{{user}}`, không tự hồi HP/thể lực và không vượt `ManaMax`. Nếu `ManaMax` đổi, giữ tỷ lệ hồ hiện tại trước rồi tiếp tục hồi từ timestamp đổi trần; tuyệt đối không vừa giữ tỷ lệ vừa cộng lượng chênh cap như hồi miễn phí.

### 4.2. Tấn công

\[
PAtk=(WeaponBase+1.5RawSTR+0.4RawDEX)\times TierMult_{combat}\times SkillQuality
\]

\[
MAtk=(FocusBase+1.2RawINT+0.9RawSPI)\times TierMult_{combat}\times SpellStructure
\]

`RawSTR/RawDEX/RawINT/RawSPI` là các bucket FLAT trước buff Bậc của File 02. Không dùng `Sheet` đã nhân Bậc trong hai công thức này rồi nhân `TierMult_combat` lần hai.

### 4.3. Hit

\[
P_{hit}=Clamp(0.10,0.95,0.72+\frac{ACC-EVA}{200+2(ACC+EVA)})
\]

Tấn công từ sau lưng/khống chế điều chỉnh ACC/EVA, không auto-hit trừ mục tiêu bất động và đòn chạm hợp lệ.

### 4.4. Crit

\[
P_{crit}=Clamp(0,0.50,0.05+0.45\frac{CritRating}{CritRating+K_{crit}})
\]

Cap thường 50%. Crit multiplier nền 1,5; tăng multiplier và chance cùng bucket riêng. Công trình/siege có weak point thay crit ngẫu nhiên.

## 5. Công thức sát thương và giảm sát thương

### 5.1. Sát thương thô

\[
PreCritRaw=(AttackPower\times SkillCoef+FlatSkill)\times Variance\times Position\times Element\times TierEdge
\]

\[
NormalRaw=PreCritRaw\times(1-TrueShare)\times CritApplied,
\qquad TrueRaw=PreCritRaw\times TrueShare
\]

Variance dùng phân bố đều `[0,95; 1,05)` và seed khóa khi action bắt đầu, theo công thức chính xác tại Phụ lục 4.K.2. TierEdge:

\[
TierEdge=Clamp(0.25,4.00,1.22^{T_{attacker}-T_{target}})
\]

### 5.2. Armor mitigation

\[
DR=\frac{ArmorEff}{ArmorEff+80\times 1.45^{T_{target}}}
\]

DR cap 80% từ armor. Block, cover và skill reduction tính bucket khác nhưng tổng mitigation cap 92% trừ invulnerability ngắn có counter.

### 5.3. Xuyên

`ArmorEff=max(0,Armor×(1−PercentPen_eff)−FlatPen)`. `PercentPen_eff` dùng soft-cap 60% tại Phụ lục 4.K.2; FlatPen áp sau. `TrueShare` tối đa 30% ở kit thường, bỏ qua armor/OtherReduction và không nhân `CritApplied`.

### 5.4. Damage cuối

Với hit hợp lệ:

\[
Impact=\max(1,\lfloor NormalRaw\times(1-DR)\times(1-OtherReduction)+TrueRaw\rfloor)
\]

\[
BarrierAbsorb=\min(BarrierCurrent,Impact),\qquad
Damage=\max(0,Impact-BarrierAbsorb-FlatReduction)
\]

Miss, target invalid hoặc immunity hợp lệ cho `Impact=BarrierAbsorb=Damage=0`. `Damage` là HP mất thật; `BarrierCurrent` giảm đúng `BarrierAbsorb`. Barrier có thể hấp thụ toàn bộ hit, không âm và không biến thành hồi máu nếu không có cơ chế chuyển hóa riêng với cap.

## 6. Trạng thái, khống chế, kháng và miễn nhiễm

### 6.1. Hồ sơ status

ID, category, source tier, potency, duration, stack rule, tick, dispel type, immunity window, tags. Category: vật lý, độc/bệnh, nguyên tố, tinh thần, linh hồn, không gian, quy tắc.

### 6.2. Xác suất áp

\[
P_{status}=\begin{cases}0,&BaseChance=0\text{ hoặc }Potency=0\\
Clamp(0.05,0.95,BaseChance\times \frac{Potency}{Potency+Resistance}\times TierEdgeStatus),&\text{còn lại}
\end{cases}
\]

Boss không “immune all”; hard control đổi thành stagger/resolve damage. Sau hard control, nhận diminishing return 50%, 25%, miễn 8 giây.

### 6.3. Stack

Các kiểu: refresh, add duration, add intensity, independent, strongest-only. Mỗi status phải chọn một. Độc stack intensity có cap; burn lan cần điều kiện; bleed cần wound. Dispel không xóa debuff cấp luật cao hơn nếu không đủ potency.

## 7. Nhịp chiến đấu, kỹ năng và hành động

### 7.1. Action profile

Cast time, recovery, cooldown, resource, range, area, target rule, interrupt threshold, movement allowed, telegraph. “Instant” vẫn có server tick và animation cue trừ phản xạ nội tại.

### 7.2. Action economy

Mỗi action profile ghi số giây chính xác cho cast, execution và recovery. `COMBAT-TIMING-1.0` tại Phụ lục 4.K.9 tính recovery sau Haste, attack cycle và bước làm tròn; dải 3–6 giây chỉ là nhịp kể điển hình, không phải random range để engine tự chọn. Haste chỉ giảm recovery tối đa 40%, không tự giảm cast, execution hoặc cooldown luật.

### 7.3. Interrupt

`InterruptScore=DamageImpact+ControlPotency+WeakPoint`; `CastStability=2WIL+0.10×SkillMastery+Stance`. Mapping, cửa ngắt và phần tài nguyên hoàn lại dùng `INTERRUPT-1.0`, Phụ lục 4.K; nếu score vượt stability trong cửa thì cast hỏng.

## 8. Vai trò, counter, đội hình và morale

### 8.1. Tám vai

Tiền phong; hộ vệ; sát thương duy trì; bùng nổ; pháo/siege; khống chế; hỗ trợ/y; trinh sát. Một unit có vai chính và phụ, không làm tốt mọi vai cùng lúc.

### 8.2. Counter mềm

- Bộ binh nặng giữ melee nhưng sợ xuyên, spell và kite.
- Kỵ/cơ động đánh flank nhưng sợ spear, địa hình và thiếu thức ăn.
- Xạ mạnh ở tầm nhưng sợ cover, rush và đạn.
- Pháp mạnh về utility/AoE nhưng sợ silence, cast time và mana.
- Summon áp số nhưng sợ banish/command break.
- Siege phá thành nhưng yếu khi bị áp sát.

### 8.3. Frontage

Chỉ số lượng vừa đủ tiếp xúc gây damage; dư quân làm reserve. `FORMATION-MORALE-1.0` tại Phụ lục 4.K.9 là nguồn duy nhất tính `Frontline/Support/Reserve` từ formation ledger, bề rộng dùng được, kích cỡ thân, độ giãn đội hình và line-of-effect; không được suy các số này từ lời tả vị trí. Hiệu suất số đông:

\[
N_{effective}=Frontline+0.55Support+0.25Reserve
\]

### 8.4. Morale

Morale và cohesion nằm `0–100`; casualty shock, flank, chỉ huy, supply, rally và rout dùng mapping `FORMATION-MORALE-1.0`, Phụ lục 4.K.9. Undead/golem vô trí thay morale bằng control integrity: khi fail chúng mất phản ứng/giữ lệnh cuối, không tự sinh sợ hãi hay phản bội.

### 8.5. Hệ/trận doanh, quan hệ và khắc chế

Trong bộ này, **hệ** và **trận doanh** là hai tên giao diện của cùng một lớp căn tính năng lượng–sinh thái. Mỗi thực thể có một hệ chính, tối đa hai hệ phụ và các tag chủng loài. Hệ quyết định bốn thứ tách biệt:

1. nguồn năng lượng tương thích;
2. phản ứng xã hội/cảm tính mặc định;
3. ưu–nhược cơ chế trong chiến đấu;
4. kỹ năng nào cần chuyển đổi khi đổi hệ.

Quan hệ ngoại giao dùng `R_ij∈[-100,100]`; khắc chế chiến đấu dùng `K_ij`. Hai giá trị liên quan nhưng không đồng nhất: hai phe có thể ghét nhau mà vẫn không có bonus damage, hoặc có quan hệ trung lập dù nguyên tố khắc chế.

\[
R_{ij,current}=Clamp(-100,100,R_{ij,base}+Treaty+History+Leadership+Event)
\]

\[
K_{ij}=Clamp(0.70,1.35,1+A_{element}+A_{faction}+A_{field}-Resistance-CounterSkill)
\]

| Cặp hệ | `R_base` gợi ý | Quan hệ cơ chế |
|---|---:|---|
| Thánh ↔ Ám | −80 | Thánh thanh tẩy/giải cấu trúc tử thể; Ám bào mòn neo đức tin, gây suy kiệt và che dấu |
| Thánh ↔ Quỷ | −90 | xung đột giáo nghĩa và triệu hoán; Quỷ làm ô nhiễm nghi thức, Thánh phá khế tà |
| Thủy ↔ Hỏa | −35 | Thủy dập và hạ nhiệt Hỏa; Hỏa mạnh có thể bốc hơi/đẩy áp lực ngược |
| Hỏa ↔ Mộc | −30 | Hỏa đốt và lan qua Mộc; Mộc ẩm/sống có thể hấp thu nhiệt hoặc bóp nghẹt nhiên liệu |
| Mộc ↔ Thổ | −15 | rễ phá cấu trúc Thổ; Thổ khô, mặn hoặc nén chặt kìm Mộc |
| Lôi ↔ Thủy | −20 | Lôi dẫn qua môi trường ướt; Thủy cách ly/tiêu tán được nếu có kỹ năng phù hợp |
| Phong ↔ Hỏa | +5 | Thiên kiến xã hội nền là +5; field giàu oxy/được dẫn gió cho `A_field=+0,10`, field tước oxy/phân tán cho `A_field=−0,20`, còn lại 0 |
| Băng ↔ Hỏa | −45 | hai bên triệt nhiệt trực tiếp; công suất, khối lượng và địa hình quyết định bên thắng |
| Ám ↔ Quỷ | +10 | dễ hợp tác theo lợi ích nhưng tranh chấp linh hồn, khế ước và quyền thống trị |

`R_base` là thiên kiến ban đầu, không phải lệnh cưỡng chế mọi cá thể phải tấn công. Văn hóa, hợp đồng và lịch sử có thể thay đổi quan hệ. Riêng quân đoàn tử thi của Lí Lan chịu **tử trung tuyệt đối với Lí Lan**; quan hệ hệ chỉ ảnh hưởng cách chúng đánh giá mục tiêu, tương tác với đồng minh và bị kỹ năng khắc chế, không ghi đè chủ quyền này.

## 9. Quân đội, đơn vị, command và hậu cần

### 9.1. Command load

\[
Load=\sum Units(AgencyFlag\times BodySize\times 1.6^{T_{form}}\times RankWeight_{command}\times Complexity\times Persistence)
\]

Đặt `x=Load/Capacity`, với `Capacity>0`. Hiệu suất chỉ huy là hàm liên tục từng đoạn:

\[
CommandEfficiency(x)=
\begin{cases}
1,&0\le x\le0.70\\
1-\frac{0.05}{0.30}(x-0.70),&0.70<x\le1.00\\
0.95-(x-1.00),&1.00<x\le1.20\\
0.75-\frac{0.35}{0.30}(x-1.20),&1.20<x\le1.50\\
\max(0.10,0.40/[1+2(x-1.50)]),&x>1.50
\end{cases}
\]

Nếu `Capacity=0`, hiệu suất bằng 1 khi `Load=0` và bằng 0 khi `Load>0`. `Capacity=CC` của chủ thể chỉ huy; `BodySize`, `RankWeight_command`, `Complexity` và `Persistence` lấy mapping Phụ lục 4.K. Thiếu instance/template hợp lệ làm transaction bị chặn, không mặc định về 0.

`AgencyFlag=1` với hero, sinh vật có trí tuệ/ý chí riêng, khế ước có quyền tự chủ và sĩ quan phải được thuyết phục/phối hợp; `AgencyFlag=0` với zombie, tử vật vô trí, cấu trang vô trí và đơn vị chỉ thi hành mệnh lệnh của chủ. Vì vậy tử vật vô trí của Lí Lan tốn **0 điểm chỉ huy**.

Tới 70% capacity giữ đúng 100% hiệu suất đối với các đơn vị có agency; tại 100% còn 95%, 120% còn 75%, 150% còn 40%, sau đó tiến dần về sàn 10%. Con số này không áp cho lòng trung thành hay quyền sở hữu của tử vật vô trí.

Đơn vị có `AgencyFlag=0` vẫn chịu một tài nguyên khác là **băng thông mệnh lệnh**:

\[
OrderLoad=\sum_{c=1}^{ActiveCohorts}OrderComplexity_c\times DistanceFactor_c\times RelayPenalty_c
\]

OrderLoad không làm chúng phản bội hoặc tự chọn lệnh khác. `OrderCapacity`, `DistanceFactor`, `RelayPenalty` và độ trễ khi quá tải dùng `ORDER-BANDWIDTH-1.0` tại Phụ lục 4.K. Quá tải chỉ làm lệnh mới tới chậm, buộc cohort tiếp tục mệnh lệnh cuối cùng và làm đội hình vật lý kém linh hoạt. Chúng vẫn chiếm diện tích, frontage, tuyến đường, kho, tử khí/năng lượng duy trì nếu chassis cần và chịu AoE; “0 điểm chỉ huy” không đồng nghĩa “0 hậu cần”.

### 9.2. Cohesion

Huấn luyện cùng, ngôn ngữ, sĩ quan, doctrine, fatigue và morale. Trộn unit lạ nhanh làm giảm cohesion; hero có trait tích hợp có thể giảm phạt.

### 9.3. Supply

Đơn vị tiêu thực phẩm, nước, đạn, thuốc, phụ tùng, mana fuel. Supply state: đầy → đủ → thiếu → nguy → đứt. Mỗi nấc giảm regen, tốc, morale và durability. Cướp địa phương tạo grievance và nguồn không chắc.

## 10. Độ hiếm, item budget và affix

### 10.1. Độ hiếm

| Cấp | Nhãn | RarityMult | Affix | Rule slot | Màu gợi ý |
|---|---|---:|---:|---:|---|
| F | Thô | 0.60× | 0 | 0 | xám |
| E | Phổ thông | 0.80× | 1 | 0 | trắng |
| D | Tinh xảo | 1.00× | 1 | 0 | lục |
| C | Hiếm | 1.25× | 2 | 0 | lam |
| B | Trác tuyệt | 1.60× | 2 | 0 | tím |
| A | Sử thi | 2.10× | 3 | 1 | cam |
| S | Truyền kỳ | 2.80× | 4 | 1 | đỏ |
| SS | Thánh | 3.80× | 5 | 2 | vàng |
| SSS | Thần thoại/Quy tắc | 5.20× | 6 | 2 | quang phổ |

Màu luôn kèm chữ/biểu tượng. Item level/bậc tách rarity: kiếm C T5 có thể mạnh hơn kiếm S T2 nhưng ít cơ chế hơn.

### 10.2. Item power budget

\[
IPB=10\times 1.8^{ItemTier-1}\times RarityMult\times Quality\times Condition
\]

Phân bổ mặc định: 50% base function, 35% affix, 15% utility/special. Rule slot tiêu ít nhất 20% IPB và có condition/counter.

### 10.3. Affix

Pool theo item type, tier, vật liệu, maker và nguồn. Affix nhóm: thuộc tính, damage type, defense, resource, skill, utility, trigger, set. Không roll affix vô nghĩa hoặc xung đột trừ cursed item có bù PB.

## 11. Trang bị, set, durability, binding và salvage

### 11.1. Slot

Đầu, thân, tay, chân, vũ khí chính/phụ, pháp khí/công cụ và cosmetic có một slot mỗi loại nếu anatomy cho phép. Trang sức dùng `EQUIPMENT-SLOTS-1.0`: 2 slot ở `T_active 0–2`, 3 slot ở `T_active 3–6`, 4 slot ở `T_active 7–10`; thay đổi Bậc đang hoạt động không tự tháo item, nhưng slot vượt trần chuyển `INACTIVE_OVER_SLOT` cho tới khi người dùng chọn món giữ lại. Sinh vật khác phải có anatomy template trước khi trang bị; thiếu template chặn equip.

### 11.2. Durability

Mất theo damage absorbed, môi trường và kỹ năng dùng. Dưới 50% giảm reliability; dưới 20% có nguy cơ affix khóa; 0% broken chứ không biến mất. Sửa cần vật liệu tương thích và skill; sửa tệ giảm max durability.

### 11.3. Binding

Không bind; bind khi trang bị; soulbind; oathbind; territorybind. Binding tăng bảo mật hoặc power nhưng giảm thanh khoản. Tháo bind cần rite/cost/risk, không phải nút miễn phí.

### 11.4. Set

Set 2/3/4/6 mảnh. Bonus set lấy IPB từ từng mảnh; không tặng ngoài ngân sách. Mixed set cho linh hoạt; full set có hiệu ứng rule nhưng bị disarm/khuyết mảnh.

### 11.5. Salvage

Với mỗi dòng vật liệu `m` trong recipe chế tạo gốc:

\[
Salvage_m=\left\lfloor CraftCost_m\times Condition\times Skill\times
(0.35+0.35\times MaterialRecoverability_m)\right\rfloor
\]

`Condition/Skill/MaterialRecoverability_m∈[0,1]`; `CraftCost_m` là số đơn vị thật của đúng material line trong recipe đã tạo item. Kết quả và xác suất catalyst dùng mapping Phụ lục 4.K. Salvage không bao giờ trên 100% và luôn phá item trong cùng transaction.

### 11.6. `SYSTEM-DECOMPOSITION-1.0` — Phân Giải theo instance

Phân Giải của Hệ Thống không dùng công thức salvage phần trăm ở §11.5. Mỗi vật thể đủ điều kiện có một `decomposition_contract` buộc vào đúng template/instance **trước khi** nút Phân Giải được hiển thị:

```yaml
decomposition_contract:
  contract_id:
  target_template_id:
  target_instance_id:
  eligibility: ELIGIBLE|INELIGIBLE
  ineligible_reason:
  preview_outputs: {item_template_id: quantity}
  preview_knowledge_scope:
  exclusive_alternatives: [REPAIR, TU_PHUC, LOOT, MANUAL_SALVAGE]
  bound_at_event_id:
  contract_hash:
  consumed: false
```

Khi giao diện hợp lệ cho phép xem, nó báo **đúng output đã buộc**; bấm xác nhận hủy instance và tạo đúng các output đó trong một transaction. Không có tỷ lệ thu hồi phổ quát, không roll lại theo kỹ năng, không chia theo giá thị trường và không suy từ một vật tương tự sau khi người chơi bấm. `consumed=true` chặn mọi lần phân giải tiếp theo.

Phân Giải, sửa chữa, Tử Phục, loot lần nữa và salvage thủ công là các nhánh loại trừ trên cùng instance. Ví dụ nguồn khóa: Rương Đồng đã mở → 5 Đồng; nồi sắt lớn → 2 Sắt; robot khoan hỏng cho lựa chọn **hoặc** phân giải thành đúng bộ vật liệu đã báo **hoặc** trả recipe sửa thành đơn vị thân thiện; tế đàn ma văn báo trước 15 Đá Ma Văn + 3 Nguyệt Châu rồi trả đúng số. Một số xác sinh vật hình người bị giao diện từ chối Phân Giải; `INELIGIBLE` là trạng thái hợp lệ, không tự đổi sang salvage.

Nếu contract legacy thiếu output, engine backfill ở timestamp hiện tại từ template/source/instance evidence rồi mới cho nút hoạt động; không rewind cảnh, không phá instance trước rồi đoán vật liệu sau.

## 12. Rương Báu, chiến lợi phẩm, Bản Vẽ, chế tạo và cường hóa

### 12.1. Ngân sách chiến lợi phẩm

Mỗi cuộc chạm trán có ngân sách theo nguy cơ, mục tiêu, yếu tố lần đầu và số người tham gia. Chiến lợi phẩm gồm phần tài nguyên chắc chắn, phần hiếm được xét riêng và phần thưởng cột mốc; không dồn mọi giá trị vào một cơ hội cực nhỏ.

### 12.2. Quyền sở hữu

Đội có thể ưu tiên người cần dùng, người muốn bán, luân phiên, đấu giá nội bộ hoặc ký hợp đồng trước. Hệ thống chỉ thực thi quy tắc cả đội đã chọn; tranh chấp ngoài đội thuộc về pháp lý và quan hệ xã hội.

### 12.3. Bảo Đảm Tích Lũy

Bảo Đảm Tích Lũy, khi một nguồn cụ thể có quy định, theo từng họ chiến lợi phẩm và từng cá nhân hoặc đội: cơ hội tăng dần rồi trở về mức đầu khi đã nhận đúng phần thưởng. Cơ chế này không áp cho độc vật đã có chủ và chỉ được hiện khi giao diện công khai điều khoản.

### 12.4. Chế tạo

Công thức + vật liệu + công cụ + công trình nghề + độ thành thạo + thời gian + kiểm định. Người chế tạo chọn một trọng tâm như nhanh, tiết kiệm, bền, phẩm cao hoặc hiệu ứng định hướng; không thể đồng thời tối đa mọi mặt.

### 12.5. Cường hóa

Cường hóa tăng ngân sách sức mạnh trong trần Bậc của vật phẩm. Thất bại ở Bậc thấp không ngẫu nhiên phá hủy vật phẩm; ở Bậc cao phải có Bảo Đảm Tích Lũy, bảo hiểm hoặc lựa chọn rủi ro được báo trước. Chạm trần thì cần tái luyện, nâng Bậc và vật liệu đúng điều kiện.

### 12.6. Rương Báu và phẩm rương

Thang phẩm dùng cho Rương Báu được khóa theo phần tổng kết về sau của `<>`. Mốc màu ở cột giữa là cách tác phẩm gọi dải vật phẩm; nhãn ở cột phải là cách chiến dịch chuyển thành tên phẩm có nghĩa khi hiện cho người chơi.

| Thứ tự | Phẩm Rương Báu | Dải vật phẩm trong nguồn | Nhãn phẩm chiến dịch gần nhất |
|---:|---|---|---|
| 1 | Mộc | Bạch | Phẩm Phổ Thông |
| 2 | Thanh Đồng | Lục | Phẩm Tinh Xảo |
| 3 | Bạch Ngân | Lam | Phẩm Hiếm |
| 4 | Hoàng Kim | Kim | Phẩm Sử Thi |
| 5 | Hạo Nguyệt | Cam; có thể xuất hiện trang bị Truyền Kỳ | Phẩm Truyền Kỳ |

Đây là năm mốc neo, không phải lời hứa rằng mọi vật trong rương đều đạt phẩm ở cột cuối. Một Rương Bạch Ngân trong nguồn từng cho sách kỹ năng, trang bị Lục, túi cứu thương, túi tài nguyên và bí ngân; rương khác cho ba lô Lục, hai Bản Vẽ, lương khô và túi cứu thương. Phẩm rương chi phối trần cơ hội cùng độ giàu của tổ hợp, còn từng vật phẩm vẫn được giám định riêng theo §10.

Các thuộc tính **khóa**, **bị băng phong**, **cổ đại**, **chuyên biệt**, **tự chọn** hoặc **gắn với một chuỗi nhiệm vụ** là trạng thái hay chủng loại rương, không phải bậc chen giữa năm phẩm trên. Rương đen trong lời kể cho vật đặc thù và đứng ngoài thang thường. Rương đỏ mới chỉ xuất hiện qua lời kể của Cự Nhân Băng Nguyên cùng suy đoán của người nghe; chiến dịch ghi nó là `chưa phân phẩm` cho tới khi một nhân vật trực tiếp giám định được.

Rương Báu phải tồn tại tại một địa điểm có thể tiếp cận: hang thú, giếng, di tích, bảo khố, đáy băng hoặc phần thưởng đã thành vật thể. Người mở cần tìm thấy, tới nơi, xử lý khóa hay hiểm cảnh rồi tự tay mở. Giao diện chỉ hiện phẩm và trạng thái sau khi người trong cảnh quan sát hợp lệ; mọi tri thức về xác suất, nội dung hoặc nguồn gốc chưa biết phải nằm trong điều họ đọc, nhớ hoặc suy đoán.

Nhóm vật phẩm có thể xuất hiện gồm trang bị, sách kỹ năng, Bản Vẽ, vật liệu, thuốc, lương thực, túi tài nguyên và khế thư chiêu mộ. `<>` không công bố bảng xác suất phổ quát hay cơ chế bảo đảm sau nhiều lần mở; §12.3 vì vậy không tự áp cho Rương Báu. Vỏ rương đã mở chỉ được tháo lấy vật liệu khi giao diện tại chỗ xác nhận; lần tháo một Rương Bạch Ngân cho 10 bí ngân là trường hợp đã thấy, không phải định suất cho mọi Rương Bạch Ngân.

Ghi chú đối chiếu nội bộ: chương đầu từng để nhân vật nhớ thang Hắc Thiết, Thanh Đồng, Bạch Ngân, Hằng Kim, Hạo Nguyệt. Chương về sau tổng kết lại năm phẩm đã biết thành Mộc, Thanh Đồng, Bạch Ngân, Hoàng Kim, Hạo Nguyệt và ghép chúng với năm dải vật phẩm. Chiến dịch dùng bản tổng kết về sau; Hắc Thiết và Hằng Kim chỉ có thể xuất hiện như cách gọi cũ của một nhân vật, không tự sinh thêm hai bậc.

### 12.7. Bản Vẽ

Bản Vẽ chưa học là vật phẩm có thể cất, bán hoặc trao đổi. Khi chủ thể có quyền học, tri thức được ghi vào Sổ Chế Tạo hoặc Sổ Kiến Trúc; từ đó Bản Vẽ trở thành công thức đã biết thay vì một vật phẩm chưa học còn có thể bán lại.

| Loại | Kết quả mở | Trường bắt buộc |
|---|---|---|
| Bản Vẽ Chế Tạo | một loại vật phẩm hay đoạn cấu kiện có thể làm lặp lại | kích thước, vật liệu, công trình nghề, thời gian, công cụ |
| Bản Vẽ Xây Dựng | một mẫu công trình có thể đặt ở nhiều vị trí hợp lệ | chức năng; diện tích/hình thể có lý do; tập vật liệu gộp tối thiểu đủ cho kết cấu/chức năng; Tinh Thể Nguyên Tố Sơ Cấp chung nếu hiệu ứng nguyên tố cơ bản thật sự cần; độ bền/giáp; nhân lực/thời gian |
| Bản Vẽ Nâng Cấp | con đường chuyển công trình nền sang cấp kế | instance trước; thay đổi chức năng/quy mô; vật liệu bổ sung gộp; thời gian ngừng vận hành |

Học Bản Vẽ chỉ mở tri thức. Mỗi lần chế tác hay xây dựng tiếp tục cần vật liệu, thợ, quyền đất, thời gian và kiểm định; phẩm Bản Vẽ không thay thế phẩm vật liệu hoặc tay nghề. Một mẫu đã học có thể dùng lặp lại: nguồn cho thấy nhân vật học Bản Vẽ Nơi Trú Vừa rồi giao dựng hai nơi trú riêng. Bản Vẽ xây dựng có một danh tính duy nhất; công trình thường và công trình ma pháp là hai công trình khác nhau, không phải hai “phiên bản” tự sinh của cùng một mục.

Hai mẫu dẫn chiếu từ một Rương Bạch Ngân:

| Bản Vẽ | Công dụng | Điều kiện nguồn ghi rõ |
|---|---|---|
| Đường Ray | chế tác từng đoạn dài 1 mét | 8 sắt và Lò Rèn Cấp 1 cho mỗi đoạn |
| Nơi Trú Vừa | diện tích 40 mét vuông, chứa 6 người, giúp người nghỉ bên trong hồi 0,5 sinh lực mỗi giây | 120 đá, 240 gỗ, 20 sắt và 5 Tinh Thể Nguyên Tố Sơ Cấp cho mỗi công trình |

### 12.8. `CHEST-LOOT-2.1` — số dòng và số đơn vị trong một Rương Báu

> **Nhãn nguồn: `DESIGN_DEFAULT/BO_SUNG`.** `<>` xác nhận thang phẩm và một số tổ hợp rương cụ thể, nhưng không công bố bảng số dòng phổ quát. Bảng này chỉ lấp khoảng trống vận hành; mọi kết quả phải lưu `rule_version=CHEST-LOOT-2.1` cùng seed. Ví dụ rương đã xuất hiện trong `<>` hoặc một campaign hợp lệ giữ nguyên kết quả nguồn, không bị bảng này viết lại.

Ba số đếm bắt buộc và không được dùng thay nhau:

- `loot_line_count`: số dòng vật phẩm khác nhau trên biên nhận;
- `total_unit_count`: tổng số đơn vị sau khi cộng số lượng của mọi dòng;
- `unique_instance_count`: số vật phẩm cá thể có `item_instance_id`, không tính từng đơn vị của stack tài nguyên như một cá thể riêng.

| Phẩm Rương Báu | Số dòng cơ sở | Hệ số bó stack `BundleMult` |
|---|---:|---:|
| Mộc | 2–4 | 1 |
| Thanh Đồng | 3–5 | 2 |
| Bạch Ngân | 4–6 | 3 |
| Hoàng Kim | 5–7 | 5 |
| Hạo Nguyệt | 6–9 | 8 |

Số lượng cơ sở của từng dòng trước `BundleMult`:

| Họ vật phẩm | Số lượng cơ sở | Cách đếm instance |
|---|---:|---|
| vật phẩm độc nhất, trang bị, Bản Vẽ, chứng nhận, khế thư | 1 | mỗi vật là một `item_instance_id` |
| công cụ thông thường | 1 | một instance; bộ nhiều chiếc phải ghi từng chiếc hoặc ID range |
| thuốc, lương khô và vật phẩm tiêu hao | 1–3 | stack nếu cùng phẩm/tình trạng/nguồn |
| vật liệu hiếm | 1–3 | stack |
| tài nguyên phổ thông | 5–20 | stack |

Với dòng có thể bó, `quantity = base_quantity × BundleMult`; dòng độc nhất luôn bằng 1 trừ khi chính mô tả nguồn nói đó là một bộ nhiều vật. Mỗi rương dùng một `chest_instance_id`, một seed và **một biên nhận riêng**. Lệnh mở nhiều rương chạy quy trình này nhiều lần; tuyệt đối không gộp loot của hai rương thành một danh sách.

### 12.9. `CHEST-QUALITY-2.1` — phẩm từng vật phẩm theo phẩm rương

> **Nhãn nguồn: `DESIGN_DEFAULT/BO_SUNG`.** Phẩm rương định thiên lệch phân phối chứ không tự gán cùng một phẩm cho mọi vật bên trong. Chỉ những dòng có trường Phẩm mới gieo bảng này; lương thực/tài nguyên không có hệ phẩm thì giữ schema riêng.

| Phẩm rương | Phổ Thông | Tinh Xảo | Hiếm | Sử Thi | Truyền Kỳ |
|---|---:|---:|---:|---:|---:|
| Mộc | 85% | 14% | 1% | 0% | 0% |
| Thanh Đồng | 35% | 55% | 9% | 1% | 0% |
| Bạch Ngân | 5% | 35% | 50% | 9% | 1% |
| Hoàng Kim | 0% | 5% | 35% | 50% | 10% |
| Hạo Nguyệt | 0% | 0% | 10% | 45% | 45% |

Mỗi hàng phải cộng đúng 100%. Mỗi dòng có phẩm dùng một sub-roll xác định trước từ seed rương; không được gieo lại sau khi thấy kết quả. Trạng thái đặc dị như khóa, cổ đại hoặc nhiệm vụ được xử lý sau roll Phẩm và không tự nâng Phẩm.

### 12.10. `CHEST-CATEGORY-3.0` — xác suất họ vật phẩm theo phẩm và loại rương

> **Nhãn nguồn: `SOURCE_ANALOGY/DESIGN_DEFAULT`.** `<>` xác nhận các họ loot, thang năm phẩm rương và nhiều payload chuyên đề, nhưng không công bố một bảng xác suất đủ mười họ. Bảng dưới lấp đúng khoảng trống đó. Nó không viết lại payload `SOURCE_EXPLICIT`, slot bảo đảm, phần thưởng hạng hay rương quest cố định.

Mười họ dùng chung một thứ tự khóa: `RES_COMMON` tài nguyên phổ thông; `MAT_RARE` vật liệu hiếm/chuyên biệt; `FOOD`; `CONSUMABLE` thuốc/vật phẩm dùng một lần; `TOOL`; `WEAPON`; `ARMOR`; `SKILL_BOOK`; `BLUEPRINT`; `SUMMON_CONTRACT`. Mỗi dòng là phần trăm và phải cộng đúng `100`.

| Phẩm rương thường | `RES_COMMON` | `MAT_RARE` | `FOOD` | `CONSUMABLE` | `TOOL` | `WEAPON` | `ARMOR` | `SKILL_BOOK` | `BLUEPRINT` | `SUMMON_CONTRACT` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mộc | 32 | 8 | 18 | 14 | 10 | 7 | 5 | 2 | 3 | 1 |
| Thanh Đồng | 24 | 10 | 12 | 13 | 10 | 11 | 9 | 5 | 4 | 2 |
| Bạch Ngân | 14 | 11 | 7 | 11 | 8 | 14 | 12 | 8 | 11 | 4 |
| Hoàng Kim | 8 | 12 | 3 | 8 | 6 | 17 | 15 | 10 | 14 | 7 |
| Hạo Nguyệt | 4 | 13 | 1 | 5 | 4 | 18 | 16 | 12 | 17 | 10 |

Với rương thường phẩm `g`, `P(f|g,NORMAL)=W_normal[g,f]/100`. Sau khi chọn họ `f`, engine lọc candidate pool, chọn template rồi mới gieo Phẩm theo §12.9. Tài nguyên hoặc lương thực không có trường Phẩm bỏ qua bước gieo Phẩm nhưng không được đổi họ. Slot bảo đảm ghi trong payload có xác suất họ `100%` và không tiêu thụ roll họ ngẫu nhiên.

Rương sự kiện dùng `event_chest_profile_id`; mỗi profile cũng cộng đúng `100` và chỉ điều khiển **slot ngẫu nhiên**. Họ có trọng số `0` không thể xuất hiện. Profile không tự cho phép template lệch chủ đề.

| `event_chest_profile_id` | `RES_COMMON` | `MAT_RARE` | `FOOD` | `CONSUMABLE` | `TOOL` | `WEAPON` | `ARMOR` | `SKILL_BOOK` | `BLUEPRINT` | `SUMMON_CONTRACT` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `EVP-ICE-DRAGON-1.0` | 0 | 15 | 0 | 7 | 2 | 18 | 16 | 8 | 17 | 17 |
| `EVP-FISHING-1.0` | 3 | 12 | 15 | 8 | 28 | 8 | 6 | 6 | 8 | 6 |
| `EVP-WORLD-BOSS-1.0` | 0 | 12 | 0 | 8 | 3 | 20 | 18 | 14 | 10 | 15 |
| `EVP-ORACLE-WAR-1.0` | 0 | 8 | 0 | 10 | 4 | 18 | 18 | 12 | 15 | 15 |
| `EVP-MONSTER-SIEGE-1.0` | 10 | 10 | 5 | 15 | 7 | 15 | 15 | 7 | 10 | 6 |
| `EVP-BLOOD-CHAOS-1.0` | 0 | 15 | 0 | 10 | 2 | 20 | 18 | 15 | 10 | 10 |
| `EVP-DREAM-SHARD-1.0` | 0 | 10 | 0 | 8 | 5 | 12 | 12 | 25 | 18 | 10 |
| `EVP-SKORK-RAT-1.0` | 12 | 13 | 5 | 10 | 10 | 13 | 13 | 8 | 8 | 8 |

Với sự kiện `e`, `P(f|g,e)=W_event[e,f]×I_eligible(g,e,f)/Σ_k(W_event[e,k]×I_eligible(g,e,k))`. `I_eligible` bằng `1` chỉ khi họ còn ít nhất một template đúng Bậc, Phẩm tối đa, chủ đề, scope và cửa thời gian; bằng `0` trong mọi trường hợp khác. Mẫu số bằng `0` làm rương `INVALID_CANDIDATE_POOL`, không chuyển sang profile thường, không đổi họ, không bù vật phẩm và không reroll. Candidate pool của từng `grade|profile|family|event_state` phải được sắp theo `item_template_id` và niêm `candidate_pool_hash` trước khi chest commitment được tạo.

**Payload nguồn ưu tiên profile.** Rương Hoàng Kim chuyên đề Băng Long được `<>` mô tả trực tiếp giữ đúng năm dòng: Vương Miện Băng Long phẩm Hoàng Kim ×1; Quyển Triệu Hồi Chiến Sĩ Long Huyết phẩm Tử ×2; Thuốc Kháng Ô Nhiễm cỡ lớn phẩm Tử ×3; Sừng Băng Long cỡ vừa ×1; Quặng Long Thạch phẩm Hoàng Kim ×3. Receipt của rương đó ghi `resolution_mode=SOURCE_FIXED_PAYLOAD`; không gieo bảng xác suất để thay một dòng nguồn bằng filler.

### 12.11. `EVENT-EXCLUSIVE-LIFECYCLE-1.0` — chặn loot sự kiện lọt vào rương thường

Mọi template và mọi instance có nguồn sự kiện phải mang đủ trường sau:

```yaml
acquisition_scope: GENERIC_WORLD | EVENT_EXCLUSIVE:<event_id> | QUEST_EXCLUSIVE:<quest_id>
origin_event_id: <event_id> | NONE
available_from:
available_until:
primary_source_state: ACTIVE | EXPIRED_PRIMARY_SOURCE
trade_policy: TRADEABLE_INSTANCE | BOUND_ON_ACQUIRE | BOUND_ON_LEARN
post_event_crafting_policy: SOURCE_PERMANENT_RECIPE | ACTIVE_WINDOW_ONLY | NOT_APPLICABLE
```

Luật lọc bắt buộc:

1. Rương thường, boss thường, shop thường, discovery, salvage discovery và crafting discovery chỉ nhận `acquisition_scope=GENERIC_WORLD`; mọi `EVENT_EXCLUSIVE:*` bị loại **trước** roll họ và trước khi tính hash.
2. Rương/shop/reward của sự kiện `e` chỉ được sinh template `EVENT_EXCLUSIVE:e`. Slot ghi rõ `ALLOW_GENERIC_FILLER` mới được nhận thêm template `GENERIC_WORLD`; slot vũ khí, Bản Vẽ và khế thư chủ đề mặc định `EXACT_EVENT_SCOPE_ONLY`.
3. Tại `available_until/shop_closes_at`, toàn bộ drop, chest creation, đổi shop, reward claim mới, reroll, dupe protection replacement và system reissue của `EVENT_EXCLUSIVE:e` chuyển sang `EXPIRED_PRIMARY_SOURCE`. Không có fallback sang rương thường.
4. Sau mốc đó, cách duy nhất để một người chơi mới sở hữu loot exclusive là **giao dịch một `item_instance_id` đã được tạo hợp lệ trước hạn** với người chơi khác. Giao dịch chỉ đổi chủ, không mint instance mới; phải giữ `origin_event_id`, lịch sử chủ sở hữu và hash provenance. Item `BOUND_ON_ACQUIRE/BOUND_ON_LEARN` không thể trade.
5. Cuộn Bản Vẽ exclusive đã học biến thành knowledge entitlement và cuộn bị tiêu thụ; không thể tái tạo cuộn sau event. Chỉ khi nguồn nói recipe tồn tại vĩnh viễn mới dùng `SOURCE_PERMANENT_RECIPE` để chủ đã học tiếp tục chế tác output; nếu nguồn im lặng dùng `ACTIVE_WINDOW_ONLY`. Output tự mang `EVENT_EXCLUSIVE:e` cũng không được tạo sau hạn trừ khi chính contract nguồn nêu ngoại lệ vĩnh viễn.
6. Không được giữ rương event chưa mở để mint loot sau hạn. Ngay trước `available_until`, rương đã có chủ và payload hợp lệ tự quyết toán: mọi item instance được mint vào `EVENT_REWARD_ESCROW` **thuộc chính chủ** trong transaction đóng event; lấy ra sau đó chỉ là chuyển container của tài sản đã sở hữu, không phải acquisition mới. Rương còn vô chủ ngoài thế giới hết hiệu lực; rương chưa commitment trở thành `INVALID_UNCOMMITTED_EVENT_CHEST`. Sau hạn, không chest nào được roll/mint/reveal thành instance mới.

### 12.12. Biên nhận rương bắt buộc

```yaml
chest_receipt:
  receipt_id:
  chest_instance_id:
  site_id:
  chest_grade:
  chest_source_type: NORMAL_WORLD | EVENT | QUEST | SOURCE_FIXED
  acquisition_scope:
  origin_event_id:
  event_chest_profile_id: NONE | <profile_id>
  event_state_at_commit:
  source_label:
  source_ref:
  rule_versions: [CHEST-LOOT-2.1, CHEST-QUALITY-2.1, CHEST-CATEGORY-3.0, EVENT-EXCLUSIVE-LIFECYCLE-1.0]
  resolution_mode: SEEDED_CATEGORY | GUARANTEED_SLOTS | SOURCE_FIXED_PAYLOAD
  candidate_pool_hash:
  committed_at:
  seed_id:
  opened_at:
  opened_by:
  lock_or_hazard_resolution_event:
  loot_line_count:
  total_unit_count:
  unique_instance_count:
  lines:
    - line_no:
      item_template_id:
      item_instance_ids: []
      quantity:
      quality:
      family:
      acquisition_scope:
      origin_event_id:
      primary_source_state:
      condition:
      destination_container:
  inventory_event_id:
  conservation_check:
```

Không được commit biên nhận nếu một dòng chưa có nơi nhận, phẩm cần gieo còn trống, ba số đếm không khớp, tổng trọng số profile khác `100`, scope/hash không khớp, event đã hết hạn khi payload chưa commitment, hoặc `inventory_event_id` chưa được tạo.

## 13. Catalog 108 prototype vật phẩm

| ID | Prototype | Cấp | IPB tại T1 | Affix | Rule slot | Phân bổ mặc định | Hỏng hóc/counter |
|---|---|---|---:|---:|---:|---|---|
| IT-CAN-F | Vũ khí cận chiến Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-E | Vũ khí cận chiến Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-D | Vũ khí cận chiến Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-C | Vũ khí cận chiến Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-B | Vũ khí cận chiến Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-A | Vũ khí cận chiến Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-S | Vũ khí cận chiến Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-SS | Vũ khí cận chiến Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-CAN-SSS | Vũ khí cận chiến Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công vật lý/nhịp đánh | mẻ lưỡi, gãy cán |
| IT-TAM-F | Vũ khí tầm xa Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-E | Vũ khí tầm xa Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-D | Vũ khí tầm xa Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-C | Vũ khí tầm xa Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-B | Vũ khí tầm xa Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-A | Vũ khí tầm xa Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-S | Vũ khí tầm xa Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-SS | Vũ khí tầm xa Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-TAM-SSS | Vũ khí tầm xa Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm tầm, chính xác, đạn | dây/cơ cấu/đạn |
| IT-KHI-F | Khiên Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-E | Khiên Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-D | Khiên Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-C | Khiên Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-B | Khiên Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-A | Khiên Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-S | Khiên Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-SS | Khiên Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-KHI-SSS | Khiên Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm block, guard, góc chắn | vỡ mép, quá tải |
| IT-GIAP-F | Giáp thân Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-E | Giáp thân Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-D | Giáp thân Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-C | Giáp thân Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-B | Giáp thân Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-A | Giáp thân Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-S | Giáp thân Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-SS | Giáp thân Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-GIAP-SSS | Giáp thân Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm armor, kháng, tải | mòn, xuyên, khớp |
| IT-MU-F | Mũ/đầu Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-E | Mũ/đầu Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-D | Mũ/đầu Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-C | Mũ/đầu Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-B | Mũ/đầu Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-A | Mũ/đầu Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-S | Mũ/đầu Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-SS | Mũ/đầu Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-MU-SSS | Mũ/đầu Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm bảo vệ, cảm giác | che tầm nhìn |
| IT-CHAN-F | Giày/chân Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-E | Giày/chân Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-D | Giày/chân Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-C | Giày/chân Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-B | Giày/chân Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-A | Giày/chân Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-S | Giày/chân Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-SS | Giày/chân Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-CHAN-SSS | Giày/chân Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm cơ động, địa hình | mòn đế, kẹt |
| IT-TRANG-F | Trang sức Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-E | Trang sức Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-D | Trang sức Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-C | Trang sức Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-B | Trang sức Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-A | Trang sức Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-S | Trang sức Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-SS | Trang sức Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-TRANG-SSS | Trang sức Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm thuộc tính/khế ước | nhiễu, trộm |
| IT-PHAP-F | Pháp khí Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-E | Pháp khí Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-D | Pháp khí Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-C | Pháp khí Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-B | Pháp khí Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-A | Pháp khí Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-S | Pháp khí Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-SS | Pháp khí Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-PHAP-SSS | Pháp khí Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công phép, ổn định | quá nhiệt, phản phệ |
| IT-CONGCU-F | Công cụ nghề Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-E | Công cụ nghề Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-D | Công cụ nghề Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-C | Công cụ nghề Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-B | Công cụ nghề Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-A | Công cụ nghề Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-S | Công cụ nghề Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-SS | Công cụ nghề Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-CONGCU-SSS | Công cụ nghề Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm skill, chất lượng | lệch chuẩn, hao |
| IT-TIEU-F | Tiêu hao Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-E | Tiêu hao Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-D | Tiêu hao Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-C | Tiêu hao Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-B | Tiêu hao Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-A | Tiêu hao Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-S | Tiêu hao Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-SS | Tiêu hao Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-TIEU-SSS | Tiêu hao Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm hiệu ứng một lần | hạn dùng, độc tính |
| IT-DIVAT-F | Di vật Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-E | Di vật Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-D | Di vật Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-C | Di vật Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-B | Di vật Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-A | Di vật Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-S | Di vật Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-SS | Di vật Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-DIVAT-SSS | Di vật Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm luật/narrative access | khế ước, điều kiện |
| IT-MOD-F | Mô-đun phương tiện/công trình Thô | F | 6 | 0 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-E | Mô-đun phương tiện/công trình Phổ thông | E | 8 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-D | Mô-đun phương tiện/công trình Tinh xảo | D | 10 | 1 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-C | Mô-đun phương tiện/công trình Hiếm | C | 13 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-B | Mô-đun phương tiện/công trình Trác tuyệt | B | 16 | 2 | 0 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-A | Mô-đun phương tiện/công trình Sử thi | A | 21 | 3 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-S | Mô-đun phương tiện/công trình Truyền kỳ | S | 28 | 4 | 1 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-SS | Mô-đun phương tiện/công trình Thánh | SS | 38 | 5 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |
| IT-MOD-SSS | Mô-đun phương tiện/công trình Thần thoại/Quy tắc | SSS | 52 | 6 | 2 | 50% nền, 35% affix, 15% tiện ích; trọng tâm công suất hệ thống | không tương thích |

### 13.1. Vật phẩm thưởng vận hành khai cuộc `OPENING-OPERATION-REWARD-ITEMS-1.0`

Mười contract dưới là các **item được đặt tên của registry thưởng**, không phải mười prototype mới cộng vào Catalog 108. Chúng đều mang `SOURCE_ANALOGY/DESIGN_DEFAULT`, Phẩm E/Phổ Thông, `construction_value=0`, `salvage_output=[]`, `convert_output=[]` và không được làm input cho bất kỳ recipe xây/nâng nào. Instance chỉ sinh từ achievement tương ứng trong `OPENING-CONSTRUCTION-REWARDS-2.0` của File 01; thiếu đúng ID/version/hash chặn reward, không thay bằng Gỗ/Đá/Sắt “tương đương”.

`registry_body_sha256=967ceed464edf3f138b2a1b658288e67f86f6b01737bf9626e8413e5bb6cb4e8` (UTF-8, từ hàng tiêu đề bảng dưới tới hết hàng `ORI-GATE-HORN-01`, gồm LF cuối mỗi hàng).

| `item_contract_id` | Tên hiển thị và payload cố định | Khóa sử dụng | Effect vận hành chính xác | Điều cấm chống nâng Cấp trá hình |
|---|---|---|---|---|
| `ORI-HEATER-FUEL-01` | Bộ Nhiên Liệu Sưởi Khai Cuộc; 24 charge | `OPERATION_ONLY`; chỉ Lò Sưởi Cấp 1–3 | mỗi charge thay đúng 1 đơn vị Gỗ vận hành; ở Cấp 1 duy trì 20 phút, Cấp 2–3 dùng thời lượng của profile công trình | không phải Gỗ inventory; không dựng/nâng, tháo, bán đổi hay salvage |
| `ORI-STOVE-STARTER-01` | Gói Bếp Khai Cuộc; công thức niêm + nguyên liệu cho 8 phần | `PRODUCT_CRAFT_ONLY`; chỉ Bếp Đơn Giản | chia đúng 2 mẻ, 4 phần/mẻ, 30 phút/mẻ ở Cấp 1; mỗi phần hoàn tất ghi 1 Thực Phẩm | nguyên liệu niêm không ăn trực tiếp, không dùng recipe khác và không trả recipe nâng Bếp |
| `ORI-SAW-GAUGE-01` | Bộ Cữ Cưa Hiệu Chỉnh; 5 charge | `OPERATION_ONLY`; chỉ Xưởng Gỗ | mỗi charge đặt `OperationTimeMult=0,75` cho đúng một mẻ 10 Gỗ; không đổi output hoặc chất lượng | không phân giải thành Gỗ/Sắt, không giảm WU/recipe nâng Xưởng |
| `ORI-TAILOR-PATTERN-01` | Bản Rập Áo Choàng Chống Lạnh + 8 Da Thuộc niêm | `PRODUCT_CRAFT_ONLY`; chỉ Tiệm May | mở công thức áo choàng: 4 Da Thuộc niêm/món; một ca 8 giờ ở Cấp 1 làm 2 món; mỗi món đang mặc cho `InsulationBonus=+0,25`, cùng template không stack | Bản Rập là recipe sản phẩm, không phải Bản Vẽ công trình; Da niêm không đổi/salvage |
| `ORI-ORE-ASSAY-01` | Bộ Thuốc Thử Quặng; 20 charge | `OPERATION_ONLY`; chỉ Xưởng Chế Biến Quặng | mỗi charge kiểm đúng một stack tối đa 20 đơn vị và hiện họ vật liệu, phẩm cùng hazard trước khi xử lý | không sinh quặng/kim loại, không tăng output và không trả recipe nâng Xưởng |
| `ORI-FORGE-MOULD-01` | Bộ Khuôn Dụng Cụ Khai Cuộc | `PRODUCT_CRAFT_ONLY`; chỉ Lò Rèn | mở ba recipe: Rìu Sắt, Cuốc Sắt, Búa Sắt; mỗi món tốn 2 Sắt + 1 Gỗ và chiếm một mẻ dụng cụ | không cấp Sắt/Gỗ, không rút WU và không nâng Lò Rèn |
| `ORI-MED-SUPPLY-01` | Túi Vật Tư Điều Trị Cơ Bản; 4 đơn vị | `OPERATION_ONLY`; chỉ Phòng Y Tế | mỗi đơn vị hỗ trợ đúng một chu kỳ điều trị hợp lệ tại một giường; hiệu quả còn lại lấy từ treatment contract của ca | không dùng xây/nâng, không chuyển thành vật liệu và không tự hồi máu ngoài ca điều trị |
| `ORI-SHELTER-BEDDING-01` | Hai Bộ Chăn Đệm Giữ Nhiệt | `INSTALLED_SERVICE_ONLY`; mỗi bộ gắn một giường Nơi Trú | người nghỉ trên giường đã gắn nhận `StaminaRecoveryMult=1,10`; cùng template không stack | không tăng số chỗ, diện tích, Cấp, D/A; tháo ra vẫn là module ràng buộc, không thành vật liệu |
| `ORI-FENCE-ALARM-01` | Dây Báo Động Tiếp Xúc; 1 tuyến/10 m | `INSTALLED_SECURITY_ONLY`; một đoạn Tường Rào | tiếp xúc hoặc cưỡng ép vượt đoạn đã gắn phát âm cảnh báo trong bán kính 60 m | không tự định danh mục tiêu, không nhìn xuyên ẩn nấp, không tăng D/A/Cấp và không cho vật liệu |
| `ORI-GATE-HORN-01` | Giá Treo và Tù Và Cổng; 1 bộ | `INSTALLED_SECURITY_ONLY`; một Cổng | người gác phải kích hoạt thủ công; âm cảnh báo nghe được tới 1 km khi không có cản âm đặc biệt | không tự phát hiện địch, không tăng D/A/Cấp, không cấp hoặc thay recipe nâng Cổng |

Mọi charge/module phải có `reward_instance_id`, `source_achievement_claim_event_id`, số lượng còn lại và receipt tiêu thụ/lắp đặt. Giao dịch cố dùng item vào cạnh nâng trả `USAGE_LOCK_MISMATCH` và không tiêu hao item; hệ thống không âm thầm quy đổi nó thành nguyên liệu.

## 14. Hệ thống công trình và tech prerequisite

### 14.1. Hồ sơ công trình

ID; category; stage; footprint; form factor và lý do; prerequisites; work units; material recipe gộp và lý do; workforce; energy demand; production input/output; storage; service radius; slots; durability; defense; hazard; adjacency; upgrade paths; salvage. Bản Vẽ dùng để thi công phải vượt `BLUEPRINT-CONTRACT-3.0` tại Phụ lục 4.L; một dòng catalog chỉ có tên/công suất mà thiếu effect contract, recipe, WU hoặc workforce chưa phải Bản Vẽ có thể xây.

### 14.2. Hiệu suất

\[
BuildingOutput=Base\times StageCapacity\times Workforce\times Skill\times Input\times Energy\times Condition\times Network
\]

Thiếu một đầu vào thiết yếu đặt output sản xuất bằng 0; dịch vụ standby chỉ tồn tại nếu building template ghi một `standby_output` riêng. Các hệ số dùng `BUILDING-OUTPUT-1.0`, Phụ lục 4.K.

### 14.3. Nâng cấp

Nâng tại chỗ giữ work cũ theo `UpgradeReuse`: cùng footprint và hệ thống 0,90; cùng category nhưng thay dây chuyền 0,75; chuyển đổi category hợp lệ 0,60; không tương thích 0. Phần còn lại trở thành `WorkUnits` mới; trong lúc nâng giảm/tắt output theo upgrade card. Nhảy hai stage cần hạ tầng phụ. Mỗi stage tăng công suất chậm hơn chi phí để khuyến khích mạng nhiều công trình nhưng đất/hậu cần ngăn spam.

### 14.4. Slot module

Module tăng chuyên môn: tự động, an toàn, quân sự, ma pháp hoặc chức năng nghề. Slot stage 1–8 lần lượt 0/1/1/2/3/4/5/6. Module có thể tiêu mana/nhiên liệu hay input vận hành nếu contract ghi rõ, nhưng không có maintenance/day và không làm công trình mất độ bền khi thiếu input; không lắp cùng tag unique.

### 14.5. Phá hủy

HP cấu trúc, armor, fire, foundation và module chức năng tách. **Chỉ** `BUILDING_ATTACK_DAMAGE` có ledger hợp lệ mới giảm HP; thời gian trôi, thời tiết thường, thiếu input vận hành hay thiếu người không gây hao mòn kiến trúc. Hazard vận hành trong catalog có thể làm dừng output, hỏng sản phẩm hoặc gây thương tích cho actor, nhưng không giảm HP công trình nếu không phải đòn tấn công. `CapturedOperation`: không tài liệu/không kỹ sư 0,30; có tài liệu hoặc kỹ sư phù hợp 0,50; có cả hai nhưng chưa giải khóa 0,70; đủ tài liệu, kỹ sư và quyền truy cập 1,00. Không auto chuyển full.

### 14.6. Danh mục Kiến Trúc khai cuộc lấy từ `<>`

Tu sửa Nhà Lãnh Chúa Hư Hại bằng `10 Đá + 20 Gỗ` mới mở Sổ Lãnh Địa và Sổ Kiến Trúc. Ngay lần mở đầu, Sổ Kiến Trúc đã có **nhiều mục Cấp 1**, không chỉ Nhà Nông Phu:

| Mục dựng sẵn Cấp 1 | Dữ kiện mở ngay; owner tuyến nâng |
|---|---|
| Lò Sưởi Đơn Giản | `6 Đá`; +15–20°C; `1 Gỗ/20 phút`; tuyến Cấp 1–3 ở `OPENING-FIXED-BUILDINGS-2.0` |
| Bếp Đơn Giản | `8 Đá + 4 Gỗ`; 4 phần/30 phút; tuyến Cấp 1–3 ở registry |
| Xưởng Gỗ | `30 Đá + 50 Gỗ`; 30 m²; 10 Gỗ xử lý/giờ; tuyến Cấp 1–5 ở registry |
| Tiệm May | `40 Đá + 60 Gỗ`; 30 m²; 2 món/8 giờ; tuyến Cấp 1–5 ở registry |
| Xưởng Chế Biến Quặng | `80 Đá + 150 Gỗ`; 50 m²; 20 quặng/giờ; tuyến Cấp 1–5 ở registry |
| Lò Rèn | `100 Đá + 200 Gỗ + 20 Sắt`; 30 m²; 1 trạm; tuyến Cấp 1–5 ở registry |
| Nhà Nông Phu Cực Địa | `10 Đá + 30 Gỗ`; 12 m², 4 chỗ; tuyến Cấp 1–10 dùng `POLAR-FARMHOUSE-PROGRESSION-2.0` ở File 01 |
| Phòng Y Tế | `45 Gỗ + 30 Đá + 5 Sắt Tinh Luyện`; 25 m², 2 giường; tuyến Cấp 1–5 ở registry |
| Nơi Trú Nhỏ | `15 Gỗ + 10 Đá + 5 Sắt Tinh Luyện`; 12 m², 2 chỗ; tuyến Cấp 1–3 ở registry |
| Tường Rào | mỗi đoạn 10 m: `10 Gỗ + 5 Đá`; cao 1,5 m; tuyến Cấp 1–3 ở registry; không đồng nhất với Bản Vẽ tường về sau |
| Cổng | `20 Gỗ + 10 Đá`; rộng 3 m, cao 2,5 m; tuyến Cấp 1–3 ở registry; không đồng nhất với Bản Vẽ Cổng Sắt |

Đây là **registry mẫu dựng sẵn của Hệ Thống**. Chi tiết profile, D/A, WU, công suất, nhiên liệu, recipe từng cạnh và trần lấy duy nhất `OPENING-FIXED-BUILDINGS-2.0` ở Phụ lục 4.M. Một mục đã có trong Sổ Kiến Trúc không phải vật phẩm `Bản Vẽ`; Bản Vẽ nhặt được/học về sau là lớp tri thức riêng. Hòm Vật Tư Lãnh Địa Cấp 1 có bốn mươi ngăn là kho khởi đầu, không phải công trình trong danh mục và không phải Rương Báu.

Nhà Nông Phu Cực Địa cho phép gọi một người bằng 5 đơn vị lương thực và có thể lấp toàn bộ chỗ trống cùng lúc. Thành tựu dựng căn đầu tiên thưởng 50 Bánh Mì; đây là phần thưởng `ENABLE` giúp vận hành chính hệ dân cư vừa mở, không phải bằng chứng rằng mọi công trình đều có cùng phần thưởng. Việc nuôi dân được chốt hằng ngày; việc chiêu mộ không có lượt làm mới theo ngày. Hồ sơ dân số, sức chứa, khẩu phần và quyền rời lãnh địa lấy File 01 §9.6; tài sản khởi đầu riêng của Lí Lan lấy File 06 §7.

### 14.7. Thẻ điều kiện xây/nâng cấp bắt buộc

Mỗi lần hỏi “xây được chưa?”, “nâng thế nào?” hoặc “thiếu gì?” phải tạo một thẻ cho **từng `building_instance_id`**, không trả lời bằng một câu chung cho cả loại công trình. Thẻ phải có:

```yaml
upgrade_card: # object nội bộ; renderer chỉ chiếu các trường được cấp quyền biết
  building_instance_id:
  building_template_id:
  upgrade_path_id:
  current_level:
  target_level:
  knowledge_scope: CURRENT_EDGE_ONLY
  knowledge_class: BUILT_IN_REGISTRY|LEARNED_BLUEPRINT
  knowledge_grant_ids: []
  visible_edge:
  source_label:
  source_ref:
  blueprint_known:
  blueprint_rule_version: BLUEPRINT-CONTRACT-3.0
  blueprint_contract_hash:
  built_in_registry_id:
  built_in_registry_hash:
  current_profile: {}
  target_profile: {}
  physical_and_functional_delta: []
  effect_contract:
  prior_level_complete:
  lord_house_requirement: {required, current, pass}
  territory_requirement: {required, current, pass}
  survival_fire_requirement: {required, current, pass, source_ref}
  materials_required: {}
  material_reasons: {}
  materials_available: {}
  materials_reserved: {}
  workforce_required: {}
  workforce_available: {}
  tools_required: []
  site_or_footprint:
  shutdown_required:
  base_work_units:
  duration_estimate: {low, base, high, assumptions}
  blockers: []
  result_if_completed: {}
  transaction_id:
```

Các đường xây/nâng khai cuộc đã khóa, không được nhập lẫn:

| `upgrade_path_id` | Điều kiện/chi phí đã khóa | Kết quả |
|---|---|---|
| `LORD-HOUSE-DAMAGED-REPAIR` | `SOURCE_LOCKED <>`: 10 đá + 20 gỗ; `base_work_units=17/60`, `max_workers=2` | Nhà Lãnh Chúa được tu sửa; mở Sổ Lãnh Địa và công trình nền |
| `LORD-HOUSE-1-2-SA-1.0` | `SOURCE_ANALOGY`: 100 gỗ + 100 đá; `base_work_units=16,00`, `max_workers=4`; hash `70c48448b3cf7985552d95bfa5cc6f58330fb1a905b1bb3cd23a15b6ea9cd507` | nhà gỗ một tầng → nhà đá hai tầng; trần dân số +50; danh vọng +200; công trình liên kết mở Cấp 2 |
| `LORD-HOUSE-2-3-SA-1.0` | `SOURCE_ANALOGY`: 200 gỗ + 200 đá + 50 sắt; `base_work_units=16,00`, `max_workers=4`; hash `bc6d59e62f3e0e2c96a0935f353fa4968fe21a9778801f06f17bff2eb25a2c44` | giữ hình thể hai tầng nhưng hoàn thiện/mở rộng; trần dân số +100; danh vọng +200; công trình liên kết mở Cấp 3 |
| `POLAR-FARMHOUSE-BUILD-1` | `SOURCE_LOCKED <> + DERIVED`: 10 đá + 30 gỗ; `base_work_units=0,75`, `max_workers=2` | Nhà Cấp 1; 12 m²; sức chứa 4 người |
| `POLAR-FARMHOUSE-1-2` | `SOURCE_LOCKED <> + DERIVED_FROM_SOURCE_SCENE`: 50 gỗ + 30 đá; phải có đúng Nhà Cấp 1; `base_work_units=1,20`, `max_workers=4` | Cấp 2; 30 m²; sức chứa 8 người |
| `POLAR-FARMHOUSE-2-3` | `SOURCE_LOCKED <> + DESIGN_DEFAULT`: Nhà Lãnh Chúa Cấp 3 + 100 đá + 200 gỗ + 50 sắt; `base_work_units=7,00`, `max_workers=4` | mở lần nâng Cấp 2 → Cấp 3 |

Trong cảnh nguồn của `POLAR-FARMHOUSE-1-2`, bốn người đang làm và giao diện từng báo còn 27 phút. File 01 §7.6 suy ra base 30 phút ở profile chuẩn, tức `1,20` người-giờ với hệ số phối hợp bốn người `0,60`; số 27 là trạng thái sau ba phút, không phải một base thứ hai. Campaign tính từ work units, phối hợp, sức khỏe, kỹ năng, công cụ, tinh thần và thời tiết hiện hành. Điều kiện Cấp 2 → 3 tuyệt đối không được dùng cho Cấp 1 → 2.

Nhà Lãnh Chúa, Lửa Sinh Tồn và giai đoạn lãnh địa là ba thực thể/trục khác nhau. “Nhà Lãnh Chúa Cấp 3” không được tự đổi thành “Lửa Sinh Tồn Cấp 3” hoặc “lãnh địa H3”; không trục nào được dùng làm Bậc của Lí Lan.

Đường Nhà Lãnh Chúa dùng `LORD-HOUSE-UPGRADE-PATH-2.0`, Nhà Nông Phu dùng `POLAR-FARMHOUSE-PROGRESSION-2.0` ở File 01 và mười loại dựng sẵn còn lại dùng `OPENING-FIXED-BUILDINGS-2.0` tại Phụ lục 4.M. Với mẫu dựng sẵn, `built_in_registry_id/hash` bắt buộc và hai trường Blueprint phải rỗng; với mẫu học được thì ngược lại. Hai lớp là XOR.

Khi instance đang ở Cấp `L`, card chỉ chiếu cạnh `L→L+1`: profile hiện tại, profile đích, `physical_and_functional_delta`, điều kiện, lượng hiện có, WU/thời gian và blocker. Delta phải nói cụ thể cái gì lớn hơn hoặc mới xuất hiện—diện tích, tầng, độ bền/giáp, sức chứa, vùng nhiệt, nhiên liệu, giường, trạm, sản lượng hoặc hiệu suất—không được thay bằng “được cải thiện”. Recipe, hình thái và prerequisite từ `L+1→L+2` trở đi ở registry nội bộ; `source_label`, `source_ref`, version/hash và cạnh tương lai không render trong truyện. “Xem tất cả” chỉ mở dữ liệu hiện đã học/mở/quan sát.

## 15. Catalog 144 prototype công trình

Đây là catalog chức năng và công suất, không phải 144 Bản Vẽ đã tồn tại. `Input` là nguyên liệu/nhiên liệu/nhân lực cần **khi vận hành**, tách khỏi vật liệu xây. Một hàng chỉ trở thành Bản Vẽ sau khi `BLUEPRINT-CONTRACT-3.0` materialize toàn bộ lý do, recipe, WU, workforce, độ bền và giáp. Không có cột bảo trì; độ bền không đổi nếu không bị tấn công.

| ID | Prototype | Stage | Work unit | Công suất tương đối | Input | Output | Nguy cơ |
|---|---|---:|---:|---:|---|---|---|
| BD-NL-1 | Nguồn Ma Năng Dã Chiến | 1 Dã chiến | 120 | 1.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-2 | Trạm Ma Năng | 2 Cơ sở | 258 | 1.75× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-3 | Xưởng Ma Năng | 3 Chuyên dụng | 554 | 3.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-4 | Khu Ma Năng | 4 Khu hợp | 1193 | 5.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-5 | Viện Ma Năng | 5 Công nghiệp | 2564 | 8.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-6 | Đại Trạm Ma Năng | 6 Đại công trình | 5514 | 12.50× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-7 | Thánh Trạm Ma Năng | 7 Kỳ quan vùng | 11855 | 19.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NL-8 | Kỳ Quan Ma Năng | 8 Kỳ quan thế giới | 25488 | 28.00× | nhiên liệu/vật dẫn | điện–nhiệt | cháy, quá tải, nhiễu |
| BD-NUOC-1 | Trạm Trạm Thủy | 1 Dã chiến | 80 | 1.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-2 | Nhà Trạm Thủy | 2 Cơ sở | 172 | 1.75× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-3 | Xưởng Trạm Thủy | 3 Chuyên dụng | 370 | 3.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-4 | Khu Trạm Thủy | 4 Khu hợp | 795 | 5.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-5 | Viện Trạm Thủy | 5 Công nghiệp | 1710 | 8.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-6 | Đại Trạm Thủy | 6 Đại công trình | 3676 | 12.50× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-7 | Thánh Trạm Thủy | 7 Kỳ quan vùng | 7903 | 19.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-NUOC-8 | Thế Giới Trạm Thủy | 8 Kỳ quan thế giới | 16992 | 28.00× | mana/nguồn nước | nước sạch | nhiễm, đóng băng, cạn |
| BD-TP-1 | Trạm Bếp–Kho Lương | 1 Dã chiến | 70 | 1.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-2 | Nhà Bếp–Kho Lương | 2 Cơ sở | 151 | 1.75× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-3 | Xưởng Bếp–Kho Lương | 3 Chuyên dụng | 323 | 3.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-4 | Khu Bếp–Kho Lương | 4 Khu hợp | 696 | 5.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-5 | Viện Bếp–Kho Lương | 5 Công nghiệp | 1496 | 8.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-6 | Đại Bếp–Kho Lương | 6 Đại công trình | 3217 | 12.50× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-7 | Thánh Bếp–Kho Lương | 7 Kỳ quan vùng | 6915 | 19.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-TP-8 | Thế Giới Bếp–Kho Lương | 8 Kỳ quan thế giới | 14868 | 28.00× | lương thô/nhiên liệu | khẩu phần | hỏng, cháy, sâu bệnh |
| BD-NHA-1 | Trạm Khu Cư Trú | 1 Dã chiến | 90 | 1.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-2 | Nhà Khu Cư Trú | 2 Cơ sở | 194 | 1.75× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-3 | Xưởng Khu Cư Trú | 3 Chuyên dụng | 416 | 3.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-4 | Khu Khu Cư Trú | 4 Khu hợp | 895 | 5.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-5 | Viện Khu Cư Trú | 5 Công nghiệp | 1923 | 8.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-6 | Đại Khu Cư Trú | 6 Đại công trình | 4136 | 12.50× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-7 | Thánh Khu Cư Trú | 7 Kỳ quan vùng | 8891 | 19.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-NHA-8 | Thế Giới Khu Cư Trú | 8 Kỳ quan thế giới | 19116 | 28.00× | vật liệu/nhiệt | sức chứa–nghỉ | cháy, dịch, quá tải |
| BD-VS-1 | Trạm Trạm Vệ Sinh | 1 Dã chiến | 85 | 1.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-2 | Nhà Trạm Vệ Sinh | 2 Cơ sở | 183 | 1.75× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-3 | Xưởng Trạm Vệ Sinh | 3 Chuyên dụng | 393 | 3.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-4 | Khu Trạm Vệ Sinh | 4 Khu hợp | 845 | 5.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-5 | Viện Trạm Vệ Sinh | 5 Công nghiệp | 1816 | 8.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-6 | Đại Trạm Vệ Sinh | 6 Đại công trình | 3906 | 12.50× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-7 | Thánh Trạm Vệ Sinh | 7 Kỳ quan vùng | 8397 | 19.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-VS-8 | Thế Giới Trạm Vệ Sinh | 8 Kỳ quan thế giới | 18054 | 28.00× | nước/năng lượng | giảm bệnh–rác | tràn, ô nhiễm |
| BD-YTE-1 | Trạm Cơ Sở Y | 1 Dã chiến | 110 | 1.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-2 | Nhà Cơ Sở Y | 2 Cơ sở | 237 | 1.75× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-3 | Xưởng Cơ Sở Y | 3 Chuyên dụng | 508 | 3.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-4 | Khu Cơ Sở Y | 4 Khu hợp | 1093 | 5.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-5 | Viện Cơ Sở Y | 5 Công nghiệp | 2351 | 8.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-6 | Đại Cơ Sở Y | 6 Đại công trình | 5055 | 12.50× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-7 | Thánh Cơ Sở Y | 7 Kỳ quan vùng | 10867 | 19.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-YTE-8 | Thế Giới Cơ Sở Y | 8 Kỳ quan thế giới | 23364 | 28.00× | thuốc/nhân sự | điều trị–phục hồi | quá tải, lây nhiễm |
| BD-KHO-1 | Trạm Tổng Kho | 1 Dã chiến | 75 | 1.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-2 | Nhà Tổng Kho | 2 Cơ sở | 161 | 1.75× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-3 | Xưởng Tổng Kho | 3 Chuyên dụng | 347 | 3.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-4 | Khu Tổng Kho | 4 Khu hợp | 746 | 5.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-5 | Viện Tổng Kho | 5 Công nghiệp | 1603 | 8.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-6 | Đại Tổng Kho | 6 Đại công trình | 3446 | 12.50× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-7 | Thánh Tổng Kho | 7 Kỳ quan vùng | 7409 | 19.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-KHO-8 | Thế Giới Tổng Kho | 8 Kỳ quan thế giới | 15930 | 28.00× | nhân lực | sức chứa–giảm hư | cháy, trộm, nổ |
| BD-VT-1 | Trạm Nút Vận | 1 Dã chiến | 100 | 1.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-2 | Nhà Nút Vận | 2 Cơ sở | 215 | 1.75× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-3 | Xưởng Nút Vận | 3 Chuyên dụng | 462 | 3.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-4 | Khu Nút Vận | 4 Khu hợp | 994 | 5.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-5 | Viện Nút Vận | 5 Công nghiệp | 2137 | 8.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-6 | Đại Nút Vận | 6 Đại công trình | 4595 | 12.50× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-7 | Thánh Nút Vận | 7 Kỳ quan vùng | 9879 | 19.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-VT-8 | Thế Giới Nút Vận | 8 Kỳ quan thế giới | 21240 | 28.00× | năng lượng/nhân lực | throughput tuyến | tắc, phục kích |
| BD-KT-1 | Trạm Mỏ–Trại Khai | 1 Dã chiến | 130 | 1.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-2 | Nhà Mỏ–Trại Khai | 2 Cơ sở | 280 | 1.75× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-3 | Xưởng Mỏ–Trại Khai | 3 Chuyên dụng | 601 | 3.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-4 | Khu Mỏ–Trại Khai | 4 Khu hợp | 1292 | 5.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-5 | Viện Mỏ–Trại Khai | 5 Công nghiệp | 2778 | 8.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-6 | Đại Mỏ–Trại Khai | 6 Đại công trình | 5974 | 12.50× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-7 | Thánh Mỏ–Trại Khai | 7 Kỳ quan vùng | 12843 | 19.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-KT-8 | Thế Giới Mỏ–Trại Khai | 8 Kỳ quan thế giới | 27612 | 28.00× | công cụ/lao động | tài nguyên thô | sập, cạn, tranh chấp |
| BD-SC-1 | Trạm Xưởng Sơ Chế | 1 Dã chiến | 120 | 1.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-2 | Nhà Xưởng Sơ Chế | 2 Cơ sở | 258 | 1.75× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-3 | Xưởng Xưởng Sơ Chế | 3 Chuyên dụng | 554 | 3.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-4 | Khu Xưởng Sơ Chế | 4 Khu hợp | 1193 | 5.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-5 | Viện Xưởng Sơ Chế | 5 Công nghiệp | 2564 | 8.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-6 | Đại Xưởng Sơ Chế | 6 Đại công trình | 5514 | 12.50× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-7 | Thánh Xưởng Sơ Chế | 7 Kỳ quan vùng | 11855 | 19.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-SC-8 | Thế Giới Xưởng Sơ Chế | 8 Kỳ quan thế giới | 25488 | 28.00× | thô/năng lượng | vật liệu R2 | phế, ô nhiễm |
| BD-CT-1 | Trạm Xưởng Chế Tạo | 1 Dã chiến | 150 | 1.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-2 | Nhà Xưởng Chế Tạo | 2 Cơ sở | 323 | 1.75× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-3 | Xưởng Xưởng Chế Tạo | 3 Chuyên dụng | 693 | 3.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-4 | Khu Xưởng Chế Tạo | 4 Khu hợp | 1491 | 5.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-5 | Viện Xưởng Chế Tạo | 5 Công nghiệp | 3206 | 8.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-6 | Đại Xưởng Chế Tạo | 6 Đại công trình | 6893 | 12.50× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-7 | Thánh Xưởng Chế Tạo | 7 Kỳ quan vùng | 14819 | 19.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-CT-8 | Thế Giới Xưởng Chế Tạo | 8 Kỳ quan thế giới | 31860 | 28.00× | R2–R3/lao động | thành phẩm | lỗi, cháy, độc |
| BD-NC-1 | Trạm Viện Nghiên Cứu | 1 Dã chiến | 180 | 1.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-2 | Nhà Viện Nghiên Cứu | 2 Cơ sở | 387 | 1.75× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-3 | Xưởng Viện Nghiên Cứu | 3 Chuyên dụng | 832 | 3.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-4 | Khu Viện Nghiên Cứu | 4 Khu hợp | 1789 | 5.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-5 | Viện Viện Nghiên Cứu | 5 Công nghiệp | 3847 | 8.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-6 | Đại Viện Nghiên Cứu | 6 Đại công trình | 8271 | 12.50× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-7 | Thánh Viện Nghiên Cứu | 7 Kỳ quan vùng | 17782 | 19.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-NC-8 | Thế Giới Viện Nghiên Cứu | 8 Kỳ quan thế giới | 38232 | 28.00× | mẫu/năng lượng/học giả | tri thức–bản vẽ | tai nạn, rò bí mật |
| BD-GD-1 | Trạm Học Đường | 1 Dã chiến | 100 | 1.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-2 | Nhà Học Đường | 2 Cơ sở | 215 | 1.75× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-3 | Xưởng Học Đường | 3 Chuyên dụng | 462 | 3.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-4 | Khu Học Đường | 4 Khu hợp | 994 | 5.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-5 | Viện Học Đường | 5 Công nghiệp | 2137 | 8.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-6 | Đại Học Đường | 6 Đại công trình | 4595 | 12.50× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-7 | Thánh Học Đường | 7 Kỳ quan vùng | 9879 | 19.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-GD-8 | Thế Giới Học Đường | 8 Kỳ quan thế giới | 21240 | 28.00× | giáo viên/giờ | mastery–gắn kết | tuyên truyền, thiếu học |
| BD-HC-1 | Trạm Công Sảnh | 1 Dã chiến | 120 | 1.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-2 | Nhà Công Sảnh | 2 Cơ sở | 258 | 1.75× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-3 | Xưởng Công Sảnh | 3 Chuyên dụng | 554 | 3.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-4 | Khu Công Sảnh | 4 Khu hợp | 1193 | 5.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-5 | Viện Công Sảnh | 5 Công nghiệp | 2564 | 8.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-6 | Đại Công Sảnh | 6 Đại công trình | 5514 | 12.50× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-7 | Thánh Công Sảnh | 7 Kỳ quan vùng | 11855 | 19.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-HC-8 | Thế Giới Công Sảnh | 8 Kỳ quan thế giới | 25488 | 28.00× | quan chức/hồ sơ | GOV–dịch vụ | tham nhũng, quá tải |
| BD-TM-1 | Trạm Chợ–Sở Giao | 1 Dã chiến | 110 | 1.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-2 | Nhà Chợ–Sở Giao | 2 Cơ sở | 237 | 1.75× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-3 | Xưởng Chợ–Sở Giao | 3 Chuyên dụng | 508 | 3.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-4 | Khu Chợ–Sở Giao | 4 Khu hợp | 1093 | 5.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-5 | Viện Chợ–Sở Giao | 5 Công nghiệp | 2351 | 8.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-6 | Đại Chợ–Sở Giao | 6 Đại công trình | 5055 | 12.50× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-7 | Thánh Chợ–Sở Giao | 7 Kỳ quan vùng | 10867 | 19.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-TM-8 | Thế Giới Chợ–Sở Giao | 8 Kỳ quan thế giới | 23364 | 28.00× | bảo an/hồ sơ | thanh khoản–thuế | lừa đảo, sốc giá |
| BD-PT-1 | Trạm Công Sự | 1 Dã chiến | 160 | 1.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-2 | Nhà Công Sự | 2 Cơ sở | 344 | 1.75× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-3 | Xưởng Công Sự | 3 Chuyên dụng | 739 | 3.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-4 | Khu Công Sự | 4 Khu hợp | 1590 | 5.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-5 | Viện Công Sự | 5 Công nghiệp | 3419 | 8.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-6 | Đại Công Sự | 6 Đại công trình | 7352 | 12.50× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-7 | Thánh Công Sự | 7 Kỳ quan vùng | 15806 | 19.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-PT-8 | Thế Giới Công Sự | 8 Kỳ quan thế giới | 33984 | 28.00× | vật liệu/quân | fortification | công thành, vòng qua |
| BD-QS-1 | Trạm Doanh Trại | 1 Dã chiến | 140 | 1.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-2 | Nhà Doanh Trại | 2 Cơ sở | 301 | 1.75× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-3 | Xưởng Doanh Trại | 3 Chuyên dụng | 647 | 3.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-4 | Khu Doanh Trại | 4 Khu hợp | 1392 | 5.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-5 | Viện Doanh Trại | 5 Công nghiệp | 2992 | 8.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-6 | Đại Doanh Trại | 6 Đại công trình | 6433 | 12.50× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-7 | Thánh Doanh Trại | 7 Kỳ quan vùng | 13831 | 19.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-QS-8 | Thế Giới Doanh Trại | 8 Kỳ quan thế giới | 29736 | 28.00× | lương/giảng viên | huấn luyện–tuyển | bất mãn, đảo chính |
| BD-TR-1 | Trạm Điện Khế Ước | 1 Dã chiến | 200 | 1.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-2 | Nhà Điện Khế Ước | 2 Cơ sở | 430 | 1.75× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-3 | Xưởng Điện Khế Ước | 3 Chuyên dụng | 924 | 3.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-4 | Khu Điện Khế Ước | 4 Khu hợp | 1988 | 5.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-5 | Viện Điện Khế Ước | 5 Công nghiệp | 4274 | 8.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-6 | Đại Điện Khế Ước | 6 Đại công trình | 9190 | 12.50× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-7 | Thánh Điện Khế Ước | 7 Kỳ quan vùng | 19758 | 19.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |
| BD-TR-8 | Thế Giới Điện Khế Ước | 8 Kỳ quan thế giới | 42480 | 28.00× | lõi/mana/uy tín | summon–hero access | phản khế, cắt neo |

## 16. Hệ triệu hoán, command cap và khế ước

### 16.1. Phân loại theo tồn tại

- **Tạm thời:** tạo thân năng lượng, có duration, mana drain.
- **Duy trì:** tồn tại khi có neo/upkeep.
- **Khế ước:** sinh vật độc lập hợp tác; có agency và điều khoản.
- **Tạo tác:** cấu trang cần phụ tùng/năng lượng.
- **Sinh sản:** quần thể thật; tính vào sinh thái/dân số, không despawn.
- **Hồi sinh:** linh hồn/thi thể; chịu luật chết và đạo đức.

Hồi sinh thường và `Tử Phục` phải tách rõ. Hồi sinh thường cố tái lập một cá thể sống nên cần linh hồn/identity anchor. `Tử Phục Linh Sư` của Lí Lan chuyển một **xác thật** thành tử thi thuộc quyền điều khiển; nó dùng dấu ấn còn trong thi thể, không kéo linh hồn trở lại. Quy tắc chi tiết và các ngoại lệ hero/thánh hệ nằm tại File 06.

### 16.2. Command capacity

\[
CC=\left\lfloor10+2PRE+2SPI+1.5CMD+CommandInfrastructureSupport+TalentSupport\right\rfloor
\]

Chi phí summon:

\[
Cost=AgencyFlag\times BodySize\times 1.6^{T_{form}}\times RankWeight_{command}\times Complexity\times Persistence
\]

`AgencyFlag=0` làm điểm chỉ huy bằng 0 với tử vật/cấu trang vô trí; `AgencyFlag=1` với hero, sinh vật có trí, sĩ quan và khế ước tự chủ. `CMD`, `CommandInfrastructureSupport`, `TalentSupport`, `BodySize`, `RankWeight_command`, `Complexity` và `Persistence` đều có mapping tại `COMMAND-LOAD-1.0`, Phụ lục 4.K. `CommandInfrastructureSupport` chỉ đến từ thiết chế/module chỉ huy có source ID; Cấp Lửa không tự cộng điểm. Toàn bộ summon có agency trong cây sở hữu vẫn cộng cho chủ gốc. Chi phí sản xuất, tử khí, thực phẩm, tín ngưỡng, mana, vật liệu, upkeep, diện tích, frontage và `OrderLoad` là sổ khác, không được nhập vào điểm chỉ huy.

### 16.3. Vượt cap

`x=Load/Capacity` dùng cùng zero-case §9.1. `x≤1`: không phạt thêm; `1<x≤1,2`: upkeep của đơn vị có agency ×1,25 và lệnh dùng độ trễ băng thông; `1,2<x≤1,5`: skill có tag `COMPLEX` bị khóa. Khi `x>1,5`, xử lý tất định theo `SUMMON-OVERFLOW-1.0`, Phụ lục 4.K.9: summon tạm xa nhất tan trước, summon duy trì quay về neo, khế ước độc lập từ chối lệnh mới, cấu trang chuyển standby; berserk chỉ xảy ra nếu chassis đã có tag ấy trước quá tải. Tử vật vô trí `AgencyFlag=0` không vào tỷ lệ này. Không dùng vượt cap để miễn phí rồi cất.

### 16.4. Khế ước

Điều khoản: dịch vụ, thời gian, lãnh thổ, quyền từ chối, bồi thường, thức ăn/mana, loot, thăng tiến, tử vong, chấm dứt. PRE giúp đàm phán nhưng không xóa ý chí. Cưỡng chế tạo instability và nguy cơ phản khế.

### 16.5. Tiến hóa summon

Level + mastery + catalyst + hành vi. Chọn một nhánh vai, hình thái hoặc element. Tiến hóa thay chassis và quy đổi stats; không giữ toàn bộ passive xung đột.

### 16.6. Quân đoàn Tử Phục và command

Thiên phú SSS của Lí Lan không có hạn mức số xác đủ điều kiện được chuyển hóa. Cương Thi và mọi tử vật **vô trí** có `AgencyFlag=0`, hành động theo mệnh lệnh hợp lệ với độ phục tùng 100% và tốn **0 điểm chỉ huy**. Chỉ tử vật anh hùng, tử vật đã thức tỉnh trí tuệ hoặc cá thể có quyền tự chủ mới có `AgencyFlag=1` và cộng `CommandLoad` theo §16.2.

Quân vô trí vẫn tạo `OrderLoad` theo §9.1, chiếm frontage, đường, chỗ chứa, thời gian truyền lệnh và chịu rủi ro AoE. Chúng không có phí tử khí/năng lượng duy trì mặc định; chỉ chassis, kỹ năng hoặc trang bị ghi upkeep riêng mới tạo khoản đó. Quá tải băng thông chỉ làm lệnh mới chậm, đội hình vật lý tắc hoặc cohort tiếp tục lệnh cũ; nó không làm tử vật phản bội, sinh ý chí hay tự biến mất.

XP ownership không được suy từ chữ “summon”. Chỉ unit có provenance `DIRECT_TU_PHUC` do chính Lí Lan tạo mới có thể gọi `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0` ở File 06; output `TOMB_QUEUE`, summon tạm và spawn của cấp dưới bị loại dù cùng owner hoặc cùng tag Tử Linh.

### 16.7. Ma trận đầu vào triệu hồi theo hệ công trình

Mỗi công trình binh chủng có `summoning_family`; không được dùng một công thức “mana + điểm chỉ huy” cho mọi hệ.

| Hệ/công trình | Đầu vào sản xuất chính | Điều kiện phụ bắt buộc | Upkeep/giới hạn tự nhiên |
|---|---|---|---|
| Tử linh/Ngôi Mộ | hồ Tử Khí riêng của công trình; catalyst chỉ khi template đặc biệt ghi rõ | công trình, hàng chờ, slot, thời gian; xác thật chỉ khi recipe nói cần | không gian, OrderLoad; vô trí 0 command; không có upkeep tử khí nền |
| Orc/bộ tộc sống | thức ăn, nước, chỗ ở, trang bị | dân số/tuyển mộ hoặc sinh sản, huấn luyện, uy danh chiến tranh theo loại | khẩu phần, morale, clan loyalty; cá thể có trí tốn command |
| Thánh/giáo hội | tín ngưỡng tích lũy, nghi lễ, thánh vật | giáo luật, tư tế, nơi thờ, consent/lời thề của thực thể có trí | duy trì đức tin, scandal/tội lỗi, command với thực thể tự chủ |
| Nguyên tố | mana đúng hệ và môi trường tương hợp | trận thức/neo nguyên tố; nước/lửa/đất/gió thật khi recipe đòi | khắc hệ, mất neo, mana drain |
| Ma thú/bầy thú | quần thể hoặc trứng/con non thật, thức ăn | thuần hóa, chuồng, người chăm, không gian sinh thái | sinh sản hữu hạn, bệnh, bỏ đàn; cá thể có trí có command |
| Cấu trang | vật liệu thân, lõi, năng lượng | xưởng, Bản Vẽ, công cụ, thời gian lắp | sửa chữa, phụ tùng, nhiên liệu; cấu trang vô trí 0 command |
| Quỷ/ngoại giới | vật hiến hoặc năng lượng khế ước | vòng triệu hồi, tên/neo, điều khoản và giá phải trả | phản khế, trục xuất, command do agency |
| Tự nhiên/tinh linh | sinh lực, độ phì, hệ sinh thái | đất/nước/cây sống, cân bằng môi trường, thường cần đồng thuận | suy kiệt sinh thái, mùa, quan hệ tinh linh |

Một recipe chỉ được commit khi chỉ rõ số lượng từng đầu vào, nguồn đang giữ, slot, thời gian, template đầu ra, `AgencyFlag`, upkeep và điều kiện hủy. “Đủ tài nguyên” mà không nêu loại tài nguyên hệ là chưa đủ.

### 16.8. `NECRO-QUEUE-2.2` — hàng chờ và hồ Tử Khí của Ngôi Mộ Lí Lan

> **Nhãn nguồn: `USER_LOCKED + DESIGN_DEFAULT/BO_SUNG`.** User khóa hồ Tử Khí khởi đầu đầy, hồi đầy lúc 00:00, sức chứa tăng gấp đôi mỗi bậc và tử vật vô trí 0 điểm chỉ huy. Slot, thời gian và hệ số cost là mặc định phiên bản để campaign có thể chạy; nếu `<>` hoặc user khóa số mới, tạo version kế tiếp chứ không sửa hồi tố event cũ.

| Trường | Giá trị |
|---|---|
| `production_slots` | 2 slot song song |
| `base_duration` | 20 phút/Cương Thi chuẩn |
| `death_qi_cost` | 1 Tử Khí Chuẩn/Cương Thi |
| `local_death_qi_capacity` | 20 Tử Khí Chuẩn ở node Ngôi Mộ Bậc 1 |
| `initial_death_qi` | 20/20 tại T0 |
| `daily_refill` | đúng 00:00: đặt current về cap hiện hành |
| đầu ra | Cương Thi Bậc 0, phẩm Thường, Cấp 1, XP 0 |
| trí tuệ | vô trí; `AgencyFlag=0` |
| điểm chỉ huy | 0 |
| provenance | `creation_route=TOMB_QUEUE`; `producer_building_id=LL-BLD-TOMB-01` |
| XP mirror của Lí Lan | không; `xp_mirror_eligible=false` |
| lao động nền | `BaseLaborRate=1,00 WU/giờ`; `TOMB-ZOMBIE-LABOR-1.0` |

Với bậc công trình `B∈{1,...,10}`:

\[
DQCap(B)=20\times2^{B-1},\quad Slots(B)=\min(8,B+1),\quad
Duration(B)=\max(5,20-1.5(B-1))\text{ phút}
\]

Chi phí output chuẩn lấy `DQCost=max(1,ceil(1.6^T×RankMult_DQ(Q)×Complexity_DQ))`; `RankMult_DQ=1,00/1,15/1,45/1,90/2,60/3,70/5,50` từ Thường tới Thần thoại và `Complexity_DQ=1,00` cho dòng chuẩn, `1,25` chuyên dụng, `1,50` công thành. Mỗi job reserve Tử Khí ngay khi vào slot, ghi `queue_job_id`, `starts_at`, `completes_at`, gián đoạn và `unit_id` đầu ra. Mọi unit output còn phải commit năm field `creation_route=TOMB_QUEUE`, `producer_building_id`, `xp_mirror_eligible=false`, `base_labor_rate_wu_per_hour=1.00` và `labor_rule_version=TOMB-ZOMBIE-LABOR-1.0`; thiếu một field làm instance invalid, không được đoán theo tên Cương Thi.

Nâng Ngôi Mộ giữa ngày chỉ tăng cap; current giữ nguyên, không nhận phần chênh cho tới 00:00. Hạ bậc clamp current xuống cap mới. Refill không cộng dồn, không vượt cap và không hồi một phần theo giờ. “Sản xuất tối đa” phải phân biệt một batch hiện tại với standing order chạy liên tục; lệnh dài được mô phỏng qua từng completion và mốc 00:00.

Hồ này chỉ là ngân sách **sản xuất Ngôi Mộ**. `Tử Phục` trực tiếp trên xác thật không dùng hồ, không tốn tử khí/mana/vật phẩm, không có số lượt, cooldown hoặc channel time; nó chỉ chịu corpse eligibility, `T_dead≤T_LiLan_current`, access/seal và khóa Thánh tại File 06 §§7, 11, 19.

### 16.9. Hệ số catalog và `AgencyFlag`

Cột “Hệ số command” trong Catalog §17 chỉ có tác dụng khi chassis/cá thể có `AgencyFlag=1`. Với phiên bản vô trí, cùng hệ số đó được lưu làm độ phức tạp phối hợp cho `OrderLoad`, không biến thành điểm chỉ huy. Catalog không tự quyết một loài có trí hay vô trí; recipe/instance phải ghi cờ này.

## 17. Catalog 96 chassis triệu hoán

| ID | Họ | Vai | Hệ số command | Chức năng | Upkeep/neo | Điểm yếu |
|---|---|---|---:|---|---|---|
| SU-THU-TIEN | Ma thú | Tiền phong | 1.10× | áp sát–mở giao tranh | thức ăn/thuần hóa | sợ, độc, địa hình; dễ bị focus |
| SU-THU-THU | Ma thú | Hộ vệ | 1.20× | block–bảo kê | thức ăn/thuần hóa | sợ, độc, địa hình; chậm, bị kite |
| SU-THU-QUAY | Ma thú | Quấy rối | 0.90× | cơ động–flank | thức ăn/thuần hóa | sợ, độc, địa hình; mỏng, cần micro |
| SU-THU-PHAO | Ma thú | Pháo kích | 1.35× | tầm xa–công thành | thức ăn/thuần hóa | sợ, độc, địa hình; điểm mù, đạn/mana |
| SU-THU-HOTRO | Ma thú | Hỗ trợ | 1.15× | heal–buff–control | thức ăn/thuần hóa | sợ, độc, địa hình; anti-heal, silence |
| SU-THU-TRINH | Ma thú | Trinh sát | 0.70× | phát hiện–bản đồ | thức ăn/thuần hóa | sợ, độc, địa hình; phản trinh sát |
| SU-THU-LAO | Ma thú | Lao động | 0.60× | thu thập–vận chuyển | thức ăn/thuần hóa | sợ, độc, địa hình; không tối ưu chiến đấu |
| SU-THU-CHI | Ma thú | Chỉ huy | 1.50× | aura–AI đơn vị | thức ăn/thuần hóa | sợ, độc, địa hình; mục tiêu ưu tiên |
| SU-NGTO-TIEN | Nguyên tố | Tiền phong | 1.10× | áp sát–mở giao tranh | mana/nguyên tố | khắc hệ, trục xuất; dễ bị focus |
| SU-NGTO-THU | Nguyên tố | Hộ vệ | 1.20× | block–bảo kê | mana/nguyên tố | khắc hệ, trục xuất; chậm, bị kite |
| SU-NGTO-QUAY | Nguyên tố | Quấy rối | 0.90× | cơ động–flank | mana/nguyên tố | khắc hệ, trục xuất; mỏng, cần micro |
| SU-NGTO-PHAO | Nguyên tố | Pháo kích | 1.35× | tầm xa–công thành | mana/nguyên tố | khắc hệ, trục xuất; điểm mù, đạn/mana |
| SU-NGTO-HOTRO | Nguyên tố | Hỗ trợ | 1.15× | heal–buff–control | mana/nguyên tố | khắc hệ, trục xuất; anti-heal, silence |
| SU-NGTO-TRINH | Nguyên tố | Trinh sát | 0.70× | phát hiện–bản đồ | mana/nguyên tố | khắc hệ, trục xuất; phản trinh sát |
| SU-NGTO-LAO | Nguyên tố | Lao động | 0.60× | thu thập–vận chuyển | mana/nguyên tố | khắc hệ, trục xuất; không tối ưu chiến đấu |
| SU-NGTO-CHI | Nguyên tố | Chỉ huy | 1.50× | aura–AI đơn vị | mana/nguyên tố | khắc hệ, trục xuất; mục tiêu ưu tiên |
| SU-TU-TIEN | Tử linh | Tiền phong | 1.10× | áp sát–mở giao tranh | linh hồn/thi thể | thánh, phá neo, đạo đức; dễ bị focus |
| SU-TU-THU | Tử linh | Hộ vệ | 1.20× | block–bảo kê | linh hồn/thi thể | thánh, phá neo, đạo đức; chậm, bị kite |
| SU-TU-QUAY | Tử linh | Quấy rối | 0.90× | cơ động–flank | linh hồn/thi thể | thánh, phá neo, đạo đức; mỏng, cần micro |
| SU-TU-PHAO | Tử linh | Pháo kích | 1.35× | tầm xa–công thành | linh hồn/thi thể | thánh, phá neo, đạo đức; điểm mù, đạn/mana |
| SU-TU-HOTRO | Tử linh | Hỗ trợ | 1.15× | heal–buff–control | linh hồn/thi thể | thánh, phá neo, đạo đức; anti-heal, silence |
| SU-TU-TRINH | Tử linh | Trinh sát | 0.70× | phát hiện–bản đồ | linh hồn/thi thể | thánh, phá neo, đạo đức; phản trinh sát |
| SU-TU-LAO | Tử linh | Lao động | 0.60× | thu thập–vận chuyển | linh hồn/thi thể | thánh, phá neo, đạo đức; không tối ưu chiến đấu |
| SU-TU-CHI | Tử linh | Chỉ huy | 1.50× | aura–AI đơn vị | linh hồn/thi thể | thánh, phá neo, đạo đức; mục tiêu ưu tiên |
| SU-GOLEM-TIEN | Cấu trang/golem | Tiền phong | 1.10× | áp sát–mở giao tranh | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; dễ bị focus |
| SU-GOLEM-THU | Cấu trang/golem | Hộ vệ | 1.20× | block–bảo kê | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; chậm, bị kite |
| SU-GOLEM-QUAY | Cấu trang/golem | Quấy rối | 0.90× | cơ động–flank | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; mỏng, cần micro |
| SU-GOLEM-PHAO | Cấu trang/golem | Pháo kích | 1.35× | tầm xa–công thành | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; điểm mù, đạn/mana |
| SU-GOLEM-HOTRO | Cấu trang/golem | Hỗ trợ | 1.15× | heal–buff–control | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; anti-heal, silence |
| SU-GOLEM-TRINH | Cấu trang/golem | Trinh sát | 0.70× | phát hiện–bản đồ | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; phản trinh sát |
| SU-GOLEM-LAO | Cấu trang/golem | Lao động | 0.60× | thu thập–vận chuyển | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; không tối ưu chiến đấu |
| SU-GOLEM-CHI | Cấu trang/golem | Chỉ huy | 1.50× | aura–AI đơn vị | năng lượng/phụ tùng | EMP/rune phá, sửa chữa; mục tiêu ưu tiên |
| SU-LINH-TIEN | Linh thể | Tiền phong | 1.10× | áp sát–mở giao tranh | khế/mana | phong ấn, mất vật chủ; dễ bị focus |
| SU-LINH-THU | Linh thể | Hộ vệ | 1.20× | block–bảo kê | khế/mana | phong ấn, mất vật chủ; chậm, bị kite |
| SU-LINH-QUAY | Linh thể | Quấy rối | 0.90× | cơ động–flank | khế/mana | phong ấn, mất vật chủ; mỏng, cần micro |
| SU-LINH-PHAO | Linh thể | Pháo kích | 1.35× | tầm xa–công thành | khế/mana | phong ấn, mất vật chủ; điểm mù, đạn/mana |
| SU-LINH-HOTRO | Linh thể | Hỗ trợ | 1.15× | heal–buff–control | khế/mana | phong ấn, mất vật chủ; anti-heal, silence |
| SU-LINH-TRINH | Linh thể | Trinh sát | 0.70× | phát hiện–bản đồ | khế/mana | phong ấn, mất vật chủ; phản trinh sát |
| SU-LINH-LAO | Linh thể | Lao động | 0.60× | thu thập–vận chuyển | khế/mana | phong ấn, mất vật chủ; không tối ưu chiến đấu |
| SU-LINH-CHI | Linh thể | Chỉ huy | 1.50× | aura–AI đơn vị | khế/mana | phong ấn, mất vật chủ; mục tiêu ưu tiên |
| SU-THUC-TIEN | Thực vật | Tiền phong | 1.10× | áp sát–mở giao tranh | đất/nước/ánh sáng | lửa, di chuyển kém; dễ bị focus |
| SU-THUC-THU | Thực vật | Hộ vệ | 1.20× | block–bảo kê | đất/nước/ánh sáng | lửa, di chuyển kém; chậm, bị kite |
| SU-THUC-QUAY | Thực vật | Quấy rối | 0.90× | cơ động–flank | đất/nước/ánh sáng | lửa, di chuyển kém; mỏng, cần micro |
| SU-THUC-PHAO | Thực vật | Pháo kích | 1.35× | tầm xa–công thành | đất/nước/ánh sáng | lửa, di chuyển kém; điểm mù, đạn/mana |
| SU-THUC-HOTRO | Thực vật | Hỗ trợ | 1.15× | heal–buff–control | đất/nước/ánh sáng | lửa, di chuyển kém; anti-heal, silence |
| SU-THUC-TRINH | Thực vật | Trinh sát | 0.70× | phát hiện–bản đồ | đất/nước/ánh sáng | lửa, di chuyển kém; phản trinh sát |
| SU-THUC-LAO | Thực vật | Lao động | 0.60× | thu thập–vận chuyển | đất/nước/ánh sáng | lửa, di chuyển kém; không tối ưu chiến đấu |
| SU-THUC-CHI | Thực vật | Chỉ huy | 1.50× | aura–AI đơn vị | đất/nước/ánh sáng | lửa, di chuyển kém; mục tiêu ưu tiên |
| SU-NGOAI-TIEN | Ngoại giới | Tiền phong | 1.10× | áp sát–mở giao tranh | vật hiến/khế ước | trục xuất, phản khế; dễ bị focus |
| SU-NGOAI-THU | Ngoại giới | Hộ vệ | 1.20× | block–bảo kê | vật hiến/khế ước | trục xuất, phản khế; chậm, bị kite |
| SU-NGOAI-QUAY | Ngoại giới | Quấy rối | 0.90× | cơ động–flank | vật hiến/khế ước | trục xuất, phản khế; mỏng, cần micro |
| SU-NGOAI-PHAO | Ngoại giới | Pháo kích | 1.35× | tầm xa–công thành | vật hiến/khế ước | trục xuất, phản khế; điểm mù, đạn/mana |
| SU-NGOAI-HOTRO | Ngoại giới | Hỗ trợ | 1.15× | heal–buff–control | vật hiến/khế ước | trục xuất, phản khế; anti-heal, silence |
| SU-NGOAI-TRINH | Ngoại giới | Trinh sát | 0.70× | phát hiện–bản đồ | vật hiến/khế ước | trục xuất, phản khế; phản trinh sát |
| SU-NGOAI-LAO | Ngoại giới | Lao động | 0.60× | thu thập–vận chuyển | vật hiến/khế ước | trục xuất, phản khế; không tối ưu chiến đấu |
| SU-NGOAI-CHI | Ngoại giới | Chỉ huy | 1.50× | aura–AI đơn vị | vật hiến/khế ước | trục xuất, phản khế; mục tiêu ưu tiên |
| SU-THIEN-TIEN | Thiên giới | Tiền phong | 1.10× | áp sát–mở giao tranh | đức tin/lời thề | vi phạm giáo luật; dễ bị focus |
| SU-THIEN-THU | Thiên giới | Hộ vệ | 1.20× | block–bảo kê | đức tin/lời thề | vi phạm giáo luật; chậm, bị kite |
| SU-THIEN-QUAY | Thiên giới | Quấy rối | 0.90× | cơ động–flank | đức tin/lời thề | vi phạm giáo luật; mỏng, cần micro |
| SU-THIEN-PHAO | Thiên giới | Pháo kích | 1.35× | tầm xa–công thành | đức tin/lời thề | vi phạm giáo luật; điểm mù, đạn/mana |
| SU-THIEN-HOTRO | Thiên giới | Hỗ trợ | 1.15× | heal–buff–control | đức tin/lời thề | vi phạm giáo luật; anti-heal, silence |
| SU-THIEN-TRINH | Thiên giới | Trinh sát | 0.70× | phát hiện–bản đồ | đức tin/lời thề | vi phạm giáo luật; phản trinh sát |
| SU-THIEN-LAO | Thiên giới | Lao động | 0.60× | thu thập–vận chuyển | đức tin/lời thề | vi phạm giáo luật; không tối ưu chiến đấu |
| SU-THIEN-CHI | Thiên giới | Chỉ huy | 1.50× | aura–AI đơn vị | đức tin/lời thề | vi phạm giáo luật; mục tiêu ưu tiên |
| SU-BO-TIEN | Bầy đàn | Tiền phong | 1.10× | áp sát–mở giao tranh | sinh khối/chỉ huy | AoE, mất queen/node; dễ bị focus |
| SU-BO-THU | Bầy đàn | Hộ vệ | 1.20× | block–bảo kê | sinh khối/chỉ huy | AoE, mất queen/node; chậm, bị kite |
| SU-BO-QUAY | Bầy đàn | Quấy rối | 0.90× | cơ động–flank | sinh khối/chỉ huy | AoE, mất queen/node; mỏng, cần micro |
| SU-BO-PHAO | Bầy đàn | Pháo kích | 1.35× | tầm xa–công thành | sinh khối/chỉ huy | AoE, mất queen/node; điểm mù, đạn/mana |
| SU-BO-HOTRO | Bầy đàn | Hỗ trợ | 1.15× | heal–buff–control | sinh khối/chỉ huy | AoE, mất queen/node; anti-heal, silence |
| SU-BO-TRINH | Bầy đàn | Trinh sát | 0.70× | phát hiện–bản đồ | sinh khối/chỉ huy | AoE, mất queen/node; phản trinh sát |
| SU-BO-LAO | Bầy đàn | Lao động | 0.60× | thu thập–vận chuyển | sinh khối/chỉ huy | AoE, mất queen/node; không tối ưu chiến đấu |
| SU-BO-CHI | Bầy đàn | Chỉ huy | 1.50× | aura–AI đơn vị | sinh khối/chỉ huy | AoE, mất queen/node; mục tiêu ưu tiên |
| SU-THUY-TIEN | Thủy sinh | Tiền phong | 1.10× | áp sát–mở giao tranh | nước/thức ăn | khô hạn, điện; dễ bị focus |
| SU-THUY-THU | Thủy sinh | Hộ vệ | 1.20× | block–bảo kê | nước/thức ăn | khô hạn, điện; chậm, bị kite |
| SU-THUY-QUAY | Thủy sinh | Quấy rối | 0.90× | cơ động–flank | nước/thức ăn | khô hạn, điện; mỏng, cần micro |
| SU-THUY-PHAO | Thủy sinh | Pháo kích | 1.35× | tầm xa–công thành | nước/thức ăn | khô hạn, điện; điểm mù, đạn/mana |
| SU-THUY-HOTRO | Thủy sinh | Hỗ trợ | 1.15× | heal–buff–control | nước/thức ăn | khô hạn, điện; anti-heal, silence |
| SU-THUY-TRINH | Thủy sinh | Trinh sát | 0.70× | phát hiện–bản đồ | nước/thức ăn | khô hạn, điện; phản trinh sát |
| SU-THUY-LAO | Thủy sinh | Lao động | 0.60× | thu thập–vận chuyển | nước/thức ăn | khô hạn, điện; không tối ưu chiến đấu |
| SU-THUY-CHI | Thủy sinh | Chỉ huy | 1.50× | aura–AI đơn vị | nước/thức ăn | khô hạn, điện; mục tiêu ưu tiên |
| SU-BONG-TIEN | Bóng/ảo | Tiền phong | 1.10× | áp sát–mở giao tranh | mana/bóng tối | ánh sáng, phát hiện; dễ bị focus |
| SU-BONG-THU | Bóng/ảo | Hộ vệ | 1.20× | block–bảo kê | mana/bóng tối | ánh sáng, phát hiện; chậm, bị kite |
| SU-BONG-QUAY | Bóng/ảo | Quấy rối | 0.90× | cơ động–flank | mana/bóng tối | ánh sáng, phát hiện; mỏng, cần micro |
| SU-BONG-PHAO | Bóng/ảo | Pháo kích | 1.35× | tầm xa–công thành | mana/bóng tối | ánh sáng, phát hiện; điểm mù, đạn/mana |
| SU-BONG-HOTRO | Bóng/ảo | Hỗ trợ | 1.15× | heal–buff–control | mana/bóng tối | ánh sáng, phát hiện; anti-heal, silence |
| SU-BONG-TRINH | Bóng/ảo | Trinh sát | 0.70× | phát hiện–bản đồ | mana/bóng tối | ánh sáng, phát hiện; phản trinh sát |
| SU-BONG-LAO | Bóng/ảo | Lao động | 0.60× | thu thập–vận chuyển | mana/bóng tối | ánh sáng, phát hiện; không tối ưu chiến đấu |
| SU-BONG-CHI | Bóng/ảo | Chỉ huy | 1.50× | aura–AI đơn vị | mana/bóng tối | ánh sáng, phát hiện; mục tiêu ưu tiên |
| SU-LONG-TIEN | Long duệ | Tiền phong | 1.10× | áp sát–mở giao tranh | kho báu/mana/thức ăn | chi phí, anti-dragon; dễ bị focus |
| SU-LONG-THU | Long duệ | Hộ vệ | 1.20× | block–bảo kê | kho báu/mana/thức ăn | chi phí, anti-dragon; chậm, bị kite |
| SU-LONG-QUAY | Long duệ | Quấy rối | 0.90× | cơ động–flank | kho báu/mana/thức ăn | chi phí, anti-dragon; mỏng, cần micro |
| SU-LONG-PHAO | Long duệ | Pháo kích | 1.35× | tầm xa–công thành | kho báu/mana/thức ăn | chi phí, anti-dragon; điểm mù, đạn/mana |
| SU-LONG-HOTRO | Long duệ | Hỗ trợ | 1.15× | heal–buff–control | kho báu/mana/thức ăn | chi phí, anti-dragon; anti-heal, silence |
| SU-LONG-TRINH | Long duệ | Trinh sát | 0.70× | phát hiện–bản đồ | kho báu/mana/thức ăn | chi phí, anti-dragon; phản trinh sát |
| SU-LONG-LAO | Long duệ | Lao động | 0.60× | thu thập–vận chuyển | kho báu/mana/thức ăn | chi phí, anti-dragon; không tối ưu chiến đấu |
| SU-LONG-CHI | Long duệ | Chỉ huy | 1.50× | aura–AI đơn vị | kho báu/mana/thức ăn | chi phí, anti-dragon; mục tiêu ưu tiên |

## 18. Sinh vật anh hùng, tuyển mộ, trung thành và phát triển

### 18.1. Hero là gì

Hero là cá thể có tên/ID, agency, mục tiêu, bộ kỹ năng và khả năng ảnh hưởng đơn vị. “Sinh vật anh hùng” có thể phi nhân nhưng vẫn là nhân vật, không phải rarity item. Hero quality nói về PB/tiềm năng, không nói giá trị đạo đức.

### 18.2. Tuyển mộ

Các đường đạt được binh lính anh hùng phải tạo `hero_origin_event`, điều kiện đồng thuận/trung thành, chi phí, quyền rời đi và `AgencyFlag=1`. Mười hai đường hợp lệ gồm:

1. **Cứu giúp:** giải cứu một hero đang nguy cấp; lòng biết ơn mở đối thoại chứ không tự khóa trung thành.
2. **Khế ước tuyển dụng:** lương, đất, chiến lợi phẩm, chức vụ và thời hạn được thỏa thuận.
3. **Cùng lý tưởng/lời thề:** hero tự gia nhập vì mục tiêu chung; vi phạm lý tưởng tạo grievance.
4. **Danh tiếng thu hút:** ứng viên thật đang di chuyển tìm tới; reputation mở encounter, không sinh người từ hư vô.
5. **Tổ chức/bang hội/học viện:** hoàn thành điều kiện thành viên, đề cử hoặc tốt nghiệp để nhận ứng viên.
6. **Ngoại giao, liên hôn hoặc trao đổi con tin tự nguyện:** quan hệ chính trị tạo route; cá thể vẫn có agency và điều khoản.
7. **Đối thủ/tù binh đầu hàng:** thắng trận chỉ mở thương lượng; thu phục cần cam kết hợp lệ, không phải nút xóa ý chí.
8. **Triệu hồi có đồng thuận:** nghi thức/khế ước đưa một thực thể có trí tới theo điều khoản và giá phải trả.
9. **Phần thưởng hệ thống/hợp đồng sự kiện:** chỉ hợp lệ khi event đã công bố nguồn hero, tiêu chí, pool và quyền sở hữu.
10. **Di tích, phong ấn hoặc kế thừa:** giải phóng/người thừa kế vượt trial; hero không mặc nhiên phục tùng nếu luật không nói.
11. **Binh lính thường tự thức tỉnh:** sự kiện đủ chuẩn theo §18.7 và File 02, giữ nguyên `unit_id`, thêm hero flag/agency.
12. **Tử Phục của Lí Lan:** một **xác hero thật** đủ điều kiện theo File 06 giữ hero flag và trở thành hero tử thi; đây là route riêng, không đại diện mọi cách có hero.

Tavern chỉ là nơi gặp ứng viên thuộc các route trên, không refresh hero mới từ hư vô. Pool đến từ nhân vật tồn tại trong thế giới, tổ chức, di chuyển và danh tiếng lãnh địa.

Nông Phu Cực Địa từ Nhà Nông Phu là tuyến dân sự, không dùng sức chứa anh hùng. Hệ thống đưa họ tới qua công trình và lương thực, nhưng từ khoảnh khắc bước ra họ là cư dân có tên, kỹ năng, nhu cầu, trung thành và quyền rời đi; công trình không thể thu hồi, làm mới hay đổi họ thành một lượt chiêu mộ khác.

### 18.3. Bốn thanh quan hệ

Tin cậy, trung thành, hài lòng, tham vọng. Hero có thể trung thành nhưng bất mãn; hài lòng nhưng không trung thành; tin cá nhân nhưng phản đối nhà nước.

### 18.4. Hợp đồng hero

Chức vụ, quyền chỉ huy, lương/đất, loot, mục tiêu, giới hạn đạo đức, quyền rời, kế vị và bí mật. Vi phạm có log và grievance.

### 18.5. Phát triển

Hero nhận XP như File 02, thêm renown và bond. Mỗi lần lên level, hero dùng `G_Q` của phẩm hiện tại và vector nghề lịch sử; mỗi 10 level chọn skill; mỗi bậc hoàn tất personal trial. Hero chỉ huy quân cần doctrine mastery riêng. Cho hero quản đất tạo GOV growth nhưng giảm thời gian adventuring.

Khi hero tăng phẩm ở level cao, `QUALITY_GROWTH_REBASE` cộng phần chênh của mọi level cũ theo đúng job active ở từng level. Sự kiện ấy không tăng level, XP hoặc `T_form`; đổi nghề trước promotion cũng không chuyển hướng growth quá khứ. Một hero bị giáng phẩm vĩnh viễn được rebase ngược phần quality growth, giữ nguyên base/training/gear.

### 18.6. Giới hạn hero

HeroCapacity của lãnh địa:

\[
HC=1+Floor((Reputation+LegitimacyEffective+InstitutionSupport)/50)
\]

`Legitimacy` ở đây là `LEG` hiện hành đã settle của File 01 §9.3, không phải PRE, sợ hãi, trung thành quân hoặc một số do narrator chọn. Khi đúng trạng thái `NOT_APPLICABLE_NO_GOVERNED_RESIDENTS`, dùng `LEG_effective=0` theo zero-case đã công bố của File 01; mọi trạng thái INVALID khác vẫn chặn HC. Reputation và InstitutionSupport phải có ledger/version riêng trước khi tính.

Vượt không cấm tuyển nhưng tăng cạnh tranh chức vụ, lương, phe phái và attention. Không biến 100 hero thành đội không mâu thuẫn.

### 18.7. Hero bẩm sinh và hero tự thức tỉnh

Hero bẩm sinh được sinh/triệu hồi với hero template và vẫn là xu hướng chủ đạo. Một binh lính thường chỉ trở thành hero khi tự tạo kỹ năng độc hữu trong một sự kiện huấn luyện cực hạn hoặc sinh tử đủ chuẩn; tỷ lệ chuẩn tối đa `1/10.000` cho mỗi event ID hợp lệ theo File 02 §10.7.

Hero tự thức tỉnh thường có năng lực thực chiến đặc biệt mạnh trong đúng ngữ cảnh đã tạo ra nó, vì kỹ năng riêng là kết tinh của hành vi từng giúp cá thể vượt qua một tình thế gần như tuyệt lộ. Quá trình này tăng phẩm, kích hoạt catch-up thuộc tính theo File 02 §10.9 và nâng trần tư chất, nhưng giữ nguyên level/bậc hiện tại. Với tử thi vô hồn, kỹ năng có thể kết tinh từ dấu ấn chiến đấu và chuỗi mệnh lệnh đã thực hiện; trạng thái hero mới không phục hồi linh hồn hoặc ký ức trước khi chết.

### 18.8. `HERO-GROUP-INFLUENCE-1.0`

Hero đang là đầu lĩnh một quần thể có thể mở **quyền hành vi** cho group thật ở File 03: truyền báo động, đổi vai, gọi về core, bố trí phục kích, giữ đội hình, chọn tuyến kiếm ăn hoặc triệu tập hội đồng/caste. Contract này không phải aura tăng phẩm.

```yaml
hero_group_influence:
  hero_id:
  lair_id:
  AgencyFlag: 1
  combat_profile_ref:
  signal_mode:
  order_unlocks: []
  cohesion_recovery_per_day:
  influence_member_ids: []
  leadership_active: true
  succession_state: STABLE|CONTESTED|INTERREGNUM|VACANT
  last_leadership_event:
```

Bất biến:

1. `influence_member_ids` chỉ chứa cá thể đã debit vào lair; Hero không gọi reinforcement ngoài population ledger.
2. `cohesion_recovery_per_day` chỉ áp tại settlement 07:00 khi Hero sống, ở trong influence radius hoặc có signal route hợp lệ, resource `≥40`, pressure `<80` và không có succession contest. Nó clamp cohesion `0…100`, không sửa HP, thuộc tính, level, Phẩm hoặc XP.
3. `order_unlocks` cho phép group thử một kế hoạch; hit, damage, morale, route, supply và counter vẫn resolve bình thường. Không có “Hero nên bầy tự thắng”.
4. Hero bị bắt, mất liên lạc, bất tỉnh hoặc chết làm leadership inactive ngay tại event timestamp. File 03 §26.8/3.L.6 xử lý kế vị; follower không despawn, đổi owner hoặc hồi đầy.
5. Hero đơn độc vẫn có `AgencyFlag=1` nhưng `influence_member_ids=[]`, `cohesion_recovery_per_day=0` và không tạo xã hội. `HERO-LAIR-LL01-06` là test bắt buộc cho zero-case này.
6. Quan hệ với Lí Lan tại T0 của cả 15 profile là `NO_CONTACT`, loyalty đối với cô bằng `0`, ownership là `SELF_OR_LAIR`. Gặp Hero mở interaction thật; nó không mặc nhiên là recruit, boss hay quest reward.

### 18.9. Mười lăm Hero đầu lĩnh của `LL01-HERO-LAIR-PACK-1.0`

> **Nhãn:** `SOURCE_ANALOGY + CAMPAIGN_FIXED`. Bậc/Cấp/Phẩm và profile tồn tại trước T0 nhưng nằm ngoài quyền biết của Lí Lan. `combat_profile_ref` tái dùng chassis/archetype đã định nghĩa; `order_unlocks` dưới là hành vi chỉ huy, không phải skill item có thể loot.

Tham chiếu `SU-*` ở bảng chỉ tái dùng họ sinh vật, vai chiến đấu, counter và movement budget; nó không đổi actor hoang thành summon, không tạo khế ước, không chuyển owner và không áp upkeep của quân Lí Lan. Survival/resource cost lấy lair ledger File 03.

| `hero_id` · tên nội bộ | Loài | Bậc · Cấp · Phẩm | `combat_profile_ref` | `signal_mode` | `order_unlocks` | Cohesion/ngày | Mục tiêu tự thân |
|---|---|---|---|---|---|---:|---|
| `HERO-LAIR-LL01-01` · Huyền Nha | sói tuyết | Bậc 1 · Cấp 7 · Tinh anh | `SU-THU-CHI` | tru + mùi | `PACK_FLANK`, `PACK_RECALL` | `+2` | giữ bầy và tuyến prey R1 |
| `HERO-LAIR-LL01-02` · Mỏ Nhớ | quạ xác | Bậc 1 · Cấp 9 · Tinh anh | tiếng gọi tầng + chuyền vị trí | `AERIAL_ALARM`, `ROOST_RECALL` | `+2` | bảo vệ rookery, tích lũy vị trí carrion |
| `HERO-LAIR-LL01-03` · Thạch Hàm | sâu đào băng | Bậc 1 · Cấp 8 · Tinh anh | rung nền + pheromone | `TUNNEL_SEAL`, `BROOD_GUARD` | `+3` | giữ brood, mở hầm khi nguồn đủ |
| `HERO-LAIR-LL01-04` · Bạch Tích | sói tuyết | Bậc 2 · Cấp 18 · Đầu lĩnh | tru phân tầng | `PATROL_ROTATE`, `PACK_AMBUSH`, `PACK_RECALL` | `+3` | mở ổ phụ mà không làm cạn prey |
| `HERO-LAIR-LL01-05` · Mắt Tro | quạ xác | Bậc 2 · Cấp 16 · Tinh anh | call-chain trên không | `BRIDGE_WATCH`, `MOB_INTRUDER`, `ROOST_RECALL` | `+2` | giữ thương lộ kiếm ăn và kho carrion |
| `HERO-LAIR-LL01-06` · Lưng Đá | gấu hang băng | Bậc 3 · Cấp 28 · Đầu lĩnh | tiếng gầm cá thể | `SOLITARY_WITHDRAW`, `DEN_DEFEND` | `0` | sống, giữ hang và vùng săn; không tìm follower |
| `HERO-LAIR-LL01-07` · Kỵ Sĩ Chuông Gãy | undead hoang | Bậc 3 · Cấp 34 · Lãnh chúa | chuông đồng + death-seal | `SILENT_FORMATION`, `ANCHOR_GUARD`, `OSSUARY_RECALL` | `+3` | giữ neo tử khí và đội hình đã tồn tại |
| `HERO-LAIR-LL01-08` · Mẫu Chu Thiết Tơ | nhện quặng | Bậc 3 · Cấp 37 · Lãnh chúa | rung tơ + pheromone | `WEBGUARD_ROTATE`, `TUNNEL_CLOSE`, `BROOD_REDISTRIBUTE` | `+4` | duy trì brood, tơ neo và mạch đá mang sắt |
| `HERO-LAIR-LL01-09` · Rìu Nước Cạn | goblin băng | Bậc 2 · Cấp 24 · Đầu lĩnh | tù và xương + runner | `SCOUT_SCREEN`, `PALISADE_MUSTER`, `RESOURCE_SHIFT` | `+3` | giữ suối, clan và quyền tự chủ |
| `HERO-LAIR-LL01-10` · Tâm Băng Lam | nguyên tố sương lam | Bậc 3 · Cấp 31 · Đầu lĩnh | cộng hưởng tinh thể | `RESONANCE_ORBIT`, `SHARD_CONVERGE` | `+3` | duy trì vòng cộng hưởng, tránh mất lõi |
| `HERO-LAIR-LL01-11` · Nanh Đóng Sương | lợn rừng băng | Bậc 3 · Cấp 38 · Đầu lĩnh | tiếng khịt + va nanh | `HERD_TURN`, `YOUNG_SCREEN`, `BASIN_RECALL` | `+2` | giữ đàn qua mùa và tìm bãi ăn |
| `HERO-LAIR-LL01-12` · Vu Chủ Hắc Giác | thú nhân Sừng Quạ | Bậc 4 · Cấp 47 · Lãnh chúa | trống da + oath-call | `CLAN_COUNCIL`, `OATHGUARD_MUSTER`, `CAMP_RELOCATE` | `+4` | bảo toàn clan, luật tục và nguồn mùa |
| `HERO-LAIR-LL01-13` · Lão Trụ Cầu | troll cầu đá | Bậc 4 · Cấp 52 · Đầu lĩnh | gõ trụ + gọi kin | `BRIDGE_BLOCK`, `KIN_WITHDRAW`, `TOLL_PARLEY` | `+2` | giữ cầu, kin và nguồn cá |
| `HERO-LAIR-LL01-14` · Mẫu Hỏa Thằn Tro | hỏa thằn tro | Bậc 5 · Cấp 66 · Lãnh chúa | rung vent + scent tro | `VENT_GUARD`, `BROOD_EVACUATE`, `THERMAL_RING` | `+4` | giữ brood, địa nhiệt và mineral-salt |
| `HERO-LAIR-LL01-15` · Đục Muối Bảy Vết | kobold tinh nham | Bậc 5 · Cấp 74 · Lãnh chúa | trống hầm + runner | `TUNNEL_MUSTER`, `SHAFT_SEAL`, `WORK_CREW_SHIFT`, `CLAN_COUNCIL` | `+4` | bảo toàn warren, trữ lượng và đường hầm |

`Cohesion/ngày` là mức phục hồi tối đa theo §18.8, không phải thu nhập miễn phí: nếu thiệt hại/grievance ngày đó lớn hơn, cohesion vẫn giảm theo delta ròng. Hero profile không thay member composition/Phẩm đã niêm trong File 03 3.L.4.

### 18.10. `SEARCH-TEAM-CAPABILITY-1.0`

Contract này chỉ tính năng lực quét/phát hiện của actor và đội hình; File 03 sở hữu geometry, File 05 sở hữu clock/concurrency. Nó không roll encounter và không thay finite population.

Với actor đủ mobility, bề rộng lane cơ sở theo km là:

\[
LaneWidth_i=Clamp(0.025,0.120,0.025+0.003PER_i+ToolSweep_i)
\]

`ToolSweep=0` khi tay không, `0,005` km với bộ tìm kiếm dã chiến và `0,015` km với dụng cụ chuyên khảo. Tool chỉ có hiệu lực với lớp mục tiêu tương thích; dụng cụ dò quặng không tăng lane săn dấu chân.

Năng lực phát hiện theo lớp mục tiêu:

\[
Detect_i=Clamp(0.25,3.00,(PER_i+\lfloor INT_i/2\rfloor+ToolBonus_i)/10)
\times Health_i\times Mobility_i\times Fatigue_i
\]

Các hệ số cuối nằm `[0,1.25]`; target concealment, terrain, weather, visibility và search method được nhân tại segment File 03 §26.12. Noise có thể tăng khả năng target tránh lane hoặc giảm concealment của chính party, nhưng không được biến thành encounter bonus.

Với team `N` actor và leader/doctrine hiện hành:

\[
CoordinationSpan=Clamp(1,16,1+\lfloor(CMD+SignalBonus+DoctrineBonus)/2\rfloor)
\]

\[
FrontLaneCount=\max(1,\min(N,\lfloor\sqrt{N\times CoordinationSpan}\rfloor))
\]

\[
CoordinationEfficiency=Clamp(0.55,1.00,1-0.0075\max(0,N-2\times CoordinationSpan))
\]

`RawFrontage = FrontLaneCount × mean(LaneWidth_front)` và `EffectiveFrontage = RawFrontage × CoordinationEfficiency`. Actor ngoài frontage là `depth/support`: họ tăng rotation, chịu tải, rescue, pursuit và detection tại footprint, nhưng không tự tạo thêm bề rộng. Nhờ vậy 40 người có lợi rõ khi địa hình cho triển khai, song không quét tuyến tính 20 lần diện tích của 2 người.

Pace quét lấy tốc độ hữu dụng percentile 20 của actor đang giữ formation, không lấy người nhanh nhất:

\[
SearchSpeed=P20(UsableSpeed_i)\times MethodPace\times Terrain\times Weather\times Fatigue
\]

`MethodPace=1,00` cho sweep thưa, `0,75` cho sweep chuẩn và `0,50` cho sweep kỹ. Trần geometry của team trong interval `Δt` là `SearchSpeed × EffectiveFrontage × Δt`; lane union thực tế có thể thấp hơn vì quay đầu, chướng ngại và overlap. Specialist `A_tick` nếu tồn tại chỉ được dùng làm ceiling thứ hai: `CommittedArea≤min(geometry_cap,A_tick)`.

Tách team tạo những operation độc lập và reset coordination theo leader/link của từng team, nên nhiều sector có thể tăng unique coverage và contact concurrency. Đổi lại, mỗi team nhỏ có ít depth/support hơn, chậm nhận cứu viện và dùng `communication_delay = route_signal_time + relay_delay`; nguy hiểm của một team không teleport đội khác tới hỗ trợ. Một formation lớn giữ mutual support/carry/rescue tốt hơn nhưng frontage có diminishing returns và chỉ sinh một footprint liên tục trừ khi lệnh tách rõ.

## 19. Catalog 64 archetype anh hùng

| ID | Nguồn gốc | Vai | Trục chính | Giá trị | Ràng buộc mặc định |
|---|---|---|---|---|---|
| HE-BAN-CHI | Anh hùng bản địa | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-DAU | Anh hùng bản địa | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-VE | Anh hùng bản địa | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-PHAP | Anh hùng bản địa | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-TRINH | Anh hùng bản địa | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-Y | Anh hùng bản địa | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-KY | Anh hùng bản địa | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-BAN-SU | Anh hùng bản địa | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy quan hệ–quê hương | bị ràng buộc địa phương; cần hợp đồng/quan hệ cá thể |
| HE-QUY-CHI | Quý tộc/chính trị | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-DAU | Quý tộc/chính trị | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-VE | Quý tộc/chính trị | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-PHAP | Quý tộc/chính trị | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-TRINH | Quý tộc/chính trị | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-Y | Quý tộc/chính trị | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-KY | Quý tộc/chính trị | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-QUY-SU | Quý tộc/chính trị | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy chính danh–đất | phe phái và kế vị; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-CHI | Bang hội/nghề | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-DAU | Bang hội/nghề | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-VE | Bang hội/nghề | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-PHAP | Bang hội/nghề | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-TRINH | Bang hội/nghề | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-Y | Bang hội/nghề | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-KY | Bang hội/nghề | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-NGHE-SU | Bang hội/nghề | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy kỹ năng–mạng nghề | nghĩa vụ bang hội; cần hợp đồng/quan hệ cá thể |
| HE-TIN-CHI | Tín ngưỡng | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-DAU | Tín ngưỡng | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-VE | Tín ngưỡng | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-PHAP | Tín ngưỡng | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-TRINH | Tín ngưỡng | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-Y | Tín ngưỡng | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-KY | Tín ngưỡng | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-TIN-SU | Tín ngưỡng | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy đức tin–giáo đoàn | giáo luật/ly giáo; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-CHI | Sinh vật giác ngộ | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-DAU | Sinh vật giác ngộ | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-VE | Sinh vật giác ngộ | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-PHAP | Sinh vật giác ngộ | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-TRINH | Sinh vật giác ngộ | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-Y | Sinh vật giác ngộ | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-KY | Sinh vật giác ngộ | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-QUAI-SU | Sinh vật giác ngộ | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy huyết mạch–tộc | khác văn hóa/nhu cầu; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-CHI | Người chơi/phụ thuộc | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-DAU | Người chơi/phụ thuộc | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-VE | Người chơi/phụ thuộc | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-PHAP | Người chơi/phụ thuộc | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-TRINH | Người chơi/phụ thuộc | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-Y | Người chơi/phụ thuộc | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-KY | Người chơi/phụ thuộc | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-NGCHOI-SU | Người chơi/phụ thuộc | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy giao diện–meta | tham vọng và tự chủ; cần hợp đồng/quan hệ cá thể |
| HE-CAU-CHI | Cấu trang có ý thức | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-DAU | Cấu trang có ý thức | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-VE | Cấu trang có ý thức | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-PHAP | Cấu trang có ý thức | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-TRINH | Cấu trang có ý thức | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-Y | Cấu trang có ý thức | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-KY | Cấu trang có ý thức | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-CAU-SU | Cấu trang có ý thức | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy lõi–mệnh lệnh | quyền nhân cách/maintenance; cần hợp đồng/quan hệ cá thể |
| HE-LANG-CHI | Lữ khách/lưu vong | Thống soái | CMD/GOV | quân đoàn và kế hoạch; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-DAU | Lữ khách/lưu vong | Đấu sĩ | STR/DEX | diệt mục tiêu ưu tiên; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-VE | Lữ khách/lưu vong | Hộ vệ | VIT/WIL | giữ tuyến và bảo hộ; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-PHAP | Lữ khách/lưu vong | Pháp sư | INT/SPI | phép diện/kiểm soát; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-TRINH | Lữ khách/lưu vong | Trinh sát | PER/DEX | tin tình báo và tập kích; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-Y | Lữ khách/lưu vong | Y–hỗ trợ | SPI/WIL | hồi phục và tinh thần; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-KY | Lữ khách/lưu vong | Kỹ sư | INT/DEX | công trình, máy, siege; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |
| HE-LANG-SU | Lữ khách/lưu vong | Sứ giả | PRE/PER | ngoại giao và chính danh; đòn bẩy kinh nghiệm–tự do | cam kết thấp/quá khứ; cần hợp đồng/quan hệ cá thể |

## 20. Boss, raid, công thành và đại chiến

### 20.1. Boss

Boss có anatomy, resolve bar, phase trigger, telegraph, adds, arena, enrage mềm và reward contribution. Không bơm HP thuần. Hard control đổi thành stagger; weak point mở bằng cơ chế.

### 20.2. Raid

Vai trò cho combat, heal, logistics, puzzle, engineering, diplomacy nếu hợp bối cảnh. Checkpoint có giá thế giới; wipe gây thương tật, mất thời gian/tài nguyên, không nhất thiết reset thực tại.

### 20.3. Công thành

Lớp: trinh sát → cô lập tuyến → áp sát → phá công sự → đánh cổng/tường → nội thành → Lửa Sinh Tồn/chính quyền. Bên thủ có kho, dân, cháy, morale; bên công có supply, bệnh và thời tiết. Phá Lửa có thể làm mất vùng nhiệt, chiến lợi phẩm và gây thảm họa.

### 20.4. Đại chiến

Mô phỏng theo đơn vị/cohort, nâng cảnh quan trọng lên encounter cá thể. Damage hero không thay toàn bộ front nếu không có causal path. Kết quả gồm đất, quân, morale, supply, elite, dân và chính trị.

## 21. Tử vong, thương tật, hồi sinh và di sản

### 21.1. Downed

HP 0 → downed nếu không overkill/đòn chí tử. Bleedout theo VIT, wound và cứu. Stabilize không hồi đầy. Gãy, mất chi, chấn thương, trauma có recovery/rehab.

### 21.2. Tử vong

Xác, linh hồn, item, hợp đồng và command link được xử lý riêng. Summon tạm tan; khế ước thật có thể chết; undead theo phylactery; construct theo core. Tử thi do `Tử Phục Linh Sư` tạo ra hóa thành tro/bụi khi chết lần thứ hai, đóng vĩnh viễn corpse ID và không để lại một xác hợp lệ cho lần Tử Phục khác.

### 21.3. Hồi sinh

Hồi sinh sự sống cần identity anchor, body/vessel, thời hạn, cơ sở, catalyst và quyền. Mỗi lần tăng SoulStrain; có nguy cơ mất ký ức, đổi tính, bị tranh chấp bản ngã. SSS không tự miễn. `Tử Phục` là chuyển xác thành đơn vị hệ Ám, nên đi theo bảng biến đổi riêng tại File 06: xác thường giữ Bậc/Cấp/XP/ledger; xác có hệ chính Thánh giảm một Bậc và một Phẩm nhưng vẫn giữ Cấp/XP, gọi quality rebase cùng cờ cấu trúc khi cần; kỹ năng/thiên phú tương thích được giữ và corpse ID bị khóa sau cái chết thứ hai.

### 21.4. Di sản

Hero chết có thể để item, học trò, doctrine, phe, nợ, tượng, trauma và quest. Không thu gọn thành loot.

## 22. Kiểm thử cân bằng

### 22.1. Ma trận test

- Level 1/10/21/40/70/100.
- Đủ bảy phẩm đơn vị và chín cấp thiên phú người chơi.
- Promotion/demotion tại level cao; respec trước/sau promotion; Tử Phục xác thường giữ tiến trình; Tử Phục xác Thánh giảm Bậc–Phẩm nhưng giữ Cấp/XP.
- 1v1, 5v5, 20v20, 1.000v1.000.
- Không gear, gear ngang, gear lệch 2 tier.
- Open field, choke, thành, đêm, bão.
- Supply đầy/thiếu/đứt.
- AI novice/veteran/hero.
- Đủ 15 profile `HERO-LAIR-LL01-01…15`: bầy sói, rookery, colony, Hero đơn độc, undead host, clan, resonance, herd, kinhold và warren.
- Leader sống/chết/mất liên lạc; `cohesion_recovery_per_day` đúng gate; follower giữ nguyên Phẩm/population/ID và chạy đúng succession File 03.

### 22.2. Mục tiêu TTK

Ngang cấp: duel 20–60 giây tùy vai; focus hợp lệ 5–15 giây; tank không chết ngay nhưng không bất tử; boss phase 2–5 phút. TTK có thể đổi theo tone nhưng phải nhất quán.

### 22.3. Chỉ báo lỗi

Một stat luôn tốt nhất; heal vượt mọi damage; armor cap quá sớm; summon không chi phí; hero aura chồng vô hạn; siege vô dụng; item tier thấp SSS mãi tốt hơn mọi tier cao; kinh tế công trình stage cao hoàn vốn nhanh hơn stage thấp không rủi ro; phẩm cao không tăng growth; promotion chỉ tăng các level tương lai; catch-up bị áp hai lần; đổi nghề viết lại vector quá khứ; `G_Q/G_T` bị nhân thêm lần nữa trong combat.

## Phụ lục 4.A — Mẫu unit

~~~yaml
unit_id:
cohort_id:
species_chassis:
unit_type:
owner:
root_owner:
source_corpse_id:
creation_route: DIRECT_TU_PHUC|TOMB_QUEUE|SUMMON|RECRUIT|SPAWN|OTHER
reviver_character_id:
producer_building_id:
talent_instance_id:
talent_link_status:
xp_mirror_eligible: true|false
xp_mirror_effective_from:
base_labor_rate_wu_per_hour:
labor_rule_version:
form_tier:
active_tier:
quality:
level:
xp_current:
xp_to_next:
role: [primary, secondary]
hero_flag:
agency_flag:
order_complexity:
entity_growth_source: QUALITY|PLAYER_TALENT
primary_stats_ordered: []
growth_vector: DEFAULT_55_25_20
growth_history: []
quality_growth_applied: {}
pending_career_growth: 0
attributes: {}
resources: {}
skills: []
equipment: []
command_cost:
upkeep: {}
morale_or_integrity:
status:
location:
formation:
created_event_id:
last_xp_event_id:
last_processed_event_id:
counters: []
growth_paths: []
~~~

Một cohort chỉ được chứa các `unit_id` giống nhau ở mọi trường ảnh hưởng vận hành: chassis/type, Bậc, Phẩm, Cấp, XP hiện tại/XP kế, vai trò, trang bị, thương tích, trạng thái, vị trí, đội hình, owner, hero/agency và event cuối. Bất kỳ thành viên nào nhận XP, lên Cấp, thăng Phẩm, bị thương, đổi trang bị/vị trí hoặc thức tỉnh hero phải được tách cohort trong cùng transaction; tổng số thành viên trước và sau phải bằng nhau.

## Phụ lục 4.B — Mẫu item

~~~yaml
item_id:
item_template_id:
type:
item_tier:
rarity:
quality:
condition:
acquisition_scope: GENERIC_WORLD|EVENT_EXCLUSIVE:<event_id>|QUEST_EXCLUSIVE:<quest_id>
origin_event_id: NONE|<event_id>
available_from:
available_until:
primary_source_state: ACTIVE|EXPIRED_PRIMARY_SOURCE
trade_policy: TRADEABLE_INSTANCE|BOUND_ON_ACQUIRE|BOUND_ON_LEARN
ipb:
base_stats: {}
affixes: []
rule_effects: []
durability:
binding:
repair_recipe:
salvage:
version:
~~~

## Phụ lục 4.C — Mẫu công trình

~~~yaml
building_id:
category_stage:
footprint_terrain:
form_factor_and_reason:
prerequisites: []
work_units:
materials: {}
material_reasons: {}
workforce: {}
energy:
inputs: {}
outputs: {}
storage:
durability: {current, maximum, armor, last_attack_event_id}
hazards: {}
modules: []
upgrade_paths: []
~~~

## Phụ lục 4.D — Mẫu khế ước summon

Chủ thể; loại consent; nhiệm vụ; command cost; upkeep; quyền tự chủ; cấm lệnh; loot; tiến hóa; điều kiện tan; tử vong; bồi thường; trọng tài; anti-loop owner tree.

## Phụ lục 4.E — Mẫu hero

Kế thừa NPC sheet file 03, thêm level/tier/rank, hero role, kit, army doctrine, equipment, renown, bonds, contract, ambition, personal quest, death/legacy rule.

## Phụ lục 4.F — Quy tắc ưu tiên luật

Quyết định trực tiếp mới nhất của `{{user}}` > mệnh đề đã kiểm chứng trong `<>` > File 06 cho cơ chế riêng Lí Lan > file chuyên trách theo domain > `DESIGN_DEFAULT` có version > effect instance. Event chỉ xác lập state, không tự sửa luật. Trong cùng một tầng, effect cụ thể hơn thắng; nếu vẫn hòa, dùng priority ID đã khóa trước, không chọn effect thuận tiện sau kết quả.

## Phụ lục 4.G — Cross-check với file khác

Thuộc tính/XP/job/talent lấy File 02; building category và lãnh địa lấy File 01; hero agency, văn hóa, chính trị lấy File 03. Thiết lập Lí Lan, Ngôi Mộ, Tử Phục, chuyển hệ và cổ chiến trường lấy File 06. Nếu xung đột: quyết định mới nhất của `{{user}}`, rồi file chuyên trách, thắng; changelog ghi rõ.

## Phụ lục 4.H — Liên kết thiết lập nhân vật chính

Cấp bậc phổ quát, hệ nguyên tố, nguồn năng lượng, chủng tộc, vật phẩm huyền thoại, kỳ quan, sinh vật, anh hùng nền, thần linh và luật hồi sinh lấy `<>` làm gốc; nơi nguồn không nói rõ thì dùng các catalog/công thức có version trong file để lấp nhất quán. Hồ sơ, năng lực khởi đầu, hướng triệu hoán và giới hạn riêng của Lí Lan đã khóa trong File 06; không còn trường tạo nhân vật bắt buộc chờ `{{user}}`. `STATE_UNOBSERVED` chỉ là dữ kiện thế giới chưa được cô biết và không được biến thành ô yêu cầu người chơi. Không dùng hồ sơ hay tên nhân vật chính nguyên tác làm mặc định.

## Phụ lục 4.I — Cổng output format cho thẻ sức mạnh, loot và công trình

Các mẫu 4.A–4.E là schema **nội bộ**, không phải bố cục được phép gửi thẳng cho người chơi. Bản hiển thị mặc định tuân thủ các luật sau:

1. Mỗi `T<n>` đã biết chuyển thành `Bậc <n>`; `Lv<n>` chuyển thành `Cấp <n>`; phẩm trơ chuyển thành `Phẩm <phẩm>`; mã `H...` thành tên giai đoạn lãnh địa và `FireLevel...` thành hình thái + Cấp Lửa. Dấu định danh, giá trị liệt kê và tên biến ở lại nội bộ.
2. Giữ mọi số Bậc, Cấp và Phẩm đã biết. Mỗi trường dùng một dòng theo mẫu `[Tên trường]: [giá trị], [chi tiết] — [một mệnh đề ngắn]`; bậc cao ở Cấp 1 chỉ cần một mệnh đề nói rõ tiềm năng đã mở nhưng sức mạnh tầng cao chưa được nuôi dưỡng.
3. Phẩm/độ hiếm chỉ được đặt trong cụm có ngữ pháp, ví dụ `phẩm Thường — kết cấu cơ bản` hoặc `Phẩm SSS — tầng hiếm nhất của hệ thống`; không dùng mã/badge đứng riêng và không thay grade bằng lời mơ hồ.
4. Chiến lợi phẩm nêu tên, loại, tình trạng, công dụng đang biết và một giới hạn hoặc điều kiện, mỗi mục một dòng. Bản Vẽ công trình nêu tên/loại, chức năng, điều kiện, recipe gộp, thời gian/thợ, độ bền/giáp và input vận hành; cấm liệt kê cấu kiện nhỏ. Công trình đã dựng nêu Bậc, chức năng hiện tại, quy mô đầu ra, độ bền và nút thắt gần nhất theo cùng định dạng.
5. Kỹ năng, thiên phú và năng lực dùng dòng đầu ghi Phẩm, tên và 1–2 câu flavor; dòng kế tiếp có đúng hai câu hiệu quả cơ học ngắn gọn.
6. Thông báo lên Cấp chỉ hiện thay đổi có ý nghĩa, dùng `Cấp cũ → Cấp mới`, thuộc tính tăng và nguyên nhân; công thức sổ tính ở lại nội bộ.
7. Chỉ bản số liệu thô hoặc bản kiểm lỗi do `{{user}}` yêu cầu mới được dùng nguyên cấu trúc và mã nội bộ.

Ví dụ mặc định cho một đơn vị:

> **Đơn vị:** Cương Thi sơ cấp, Bậc 0, phẩm Thường, Cấp 1 — lực chiến cá thể thấp, tốn 0 điểm chỉ huy nhưng vẫn chịu hậu cần và băng thông mệnh lệnh.  
> **Tiềm năng phát triển:** tối đa Bậc 0 ở trạng thái hiện tại — kinh nghiệm và huấn luyện vẫn tăng Cấp, còn nâng trần Bậc cần phẩm chất hoặc kỳ ngộ hợp lệ.

## Phụ lục 4.J — Dấu vết nguồn cho Rương Báu, Bản Vẽ và công trình khai cuộc

- [Chương 2 — Nhà Lãnh Chúa, Hòm Vật Tư và Nhà Cực Địa Nhân](https://m.read.qq.com/read/1050133618/2): chi phí, thời gian dẫn chiếu, bộ vật tư, sức chứa, giá chiêu mộ và nghĩa vụ cấp thức ăn hằng ngày.
- [Chương 12 — nâng Nhà Cực Địa Nhân Cấp 1→2](https://m.yunqi.qq.com/read/50133618/12): 50 gỗ +30 đá; cảnh có bốn người cùng làm và từng còn 27 phút; kết quả 30 m², tám chỗ.
- [Chương 13 — Nhà Cực Địa Nhân Cấp 2](https://mshuku.read.qq.com/read/1050133618/13): sức chứa tám người, bốn lượt chiêu mộ bổ sung bằng 20 lương thực và điều kiện lần nâng Cấp 2→3.
- [Chương 17 — Rương Bạch Ngân đầu tiên](https://m.apad.qq.com/read/1050133618/17): thang tên gọi thuở đầu và một tổ hợp phần thưởng Bạch Ngân.
- [Chương 42 — Rương Bạch Ngân, Bản Vẽ Đường Ray và Nơi Trú Vừa](https://m.apad.qq.com/read/1050133618/42): thành phần rương, điều kiện hai Bản Vẽ và trường hợp tháo vỏ lấy bí ngân.
- [Chương 57 — học Bản Vẽ rồi dựng nhiều nơi trú](https://mnovel.book.qq.com/read/1050133618/57): tri thức được học trước, mỗi công trình vẫn cần thợ và thời gian.
- [Chương 97 — chuỗi Bản Vẽ tường thành](https://www.69shuba.com/txt/58776/38255732): Bản Vẽ cấp sau đòi công trình cấp trước cùng điều kiện Nhà Lãnh Chúa và vật liệu.
- [Lãnh Chủ Cầu Sinh, chương 4](https://mbooks.book.qq.com/read/1037194315/4): lều cỏ, bếp đá, lò rèn và tiệm may đều dùng vài dòng Gỗ/Đá/Sắt/gai dầu gộp, không tách đinh hay ống khói.
- [Lãnh Chủ Cầu Sinh, chương 18](https://mbook.read.qq.com/read/1037194315/18): kho dùng vật phẩm chung `Tinh Thể Nguyên Tố Sơ Cấp`; hệ thống trừ tài nguyên rồi biểu hiện toàn bộ hình thể công trình.
- [Lãnh Chủ Cầu Sinh, chương 28](https://mbook.novel.qq.com/read/1037194315/28): Tháp Tên Nguyên Tố dùng tài nguyên gộp cùng tinh thể chung và có độ bền/giáp.
- [Băng Phong Tận Thế, chương 16](https://myuedu.book.qq.com/read/1050133618/16): Tháp Tên Nguyên Tố Sơ Cấp dùng Gỗ, Đá, Sắt và Tinh Thể Nguyên Tố Sơ Cấp chung.
- [Toàn Dân Lãnh Chủ: Tỷ Lệ Rơi 100%, chương 8](https://myuedu.read.qq.com/read/1044588746/8): nhà ở dùng nhóm vật liệu gộp và có độ bền, không dùng BOM tiểu tiết.
- [Chương 904 — năm phẩm rương đã biết](https://www.69shuba.com/txt/58776/40564907): Mộc, Thanh Đồng, Bạch Ngân, Hoàng Kim, Hạo Nguyệt; năm dải vật phẩm tương ứng; rương đen đặc thù và rương đỏ chưa được giám định.

## Phụ lục 4.K — Registry tham số `POWER-MATH-CLOSURE-1.0`

Registry này đóng mọi ký hiệu số học của File 04 không có bảng cục bộ chặt hơn. Dấu chấm là dấu thập phân trong bản máy; làm tròn chỉ ở đầu ra cuối.

### 4.K.1. CP và công–thủ

- `RankMult_CP` từ Phẩm Thường tới Thần thoại: `1.00/1.05/1.12/1.22/1.35/1.55/1.85`. Đây là phần kit/AI còn lại, tách khỏi `RankWeight_command` và `RankMult_DQ`.
- `Offense=max(1,PAtk,MAtk)`. `Defense=max(1,MaxHP/(1−DR_ref))`, với `DR_ref=ArmorEff/(ArmorEff+80×1.45^T_active)`.
- `Utility=Clamp(0.80,1.40,0.80+0.15×(Control+Healing+Mobility+Intel))`; bốn input `0..1` lấy từ kit thực sự dùng được trong encounter.
- `HPFactor=0` nếu HP bằng 0, nếu còn sống thì `Clamp(0.25,1,HP/MaxHP)`. `ResourceFactor`, `DurabilityFactor` và `MoraleCohesionFactor` đều `Clamp(0.25,1,current/max)`; thực thể không dùng resource/trang bị lấy factor 1. `Readiness` là tích bốn factor.
- `CP_estimate` làm tròn một chữ số. Sai số theo intelligence state: chưa biết ±50%; tin đồn ±35%; trinh sát ±20%; giám định hợp lệ ±10%.

`RawSTR/RawDEX/RawINT/RawSPI≥0` lấy đúng bucket FLAT trước buff Bậc của `STAT-STACK-1.1`; `TierMult_combat` lấy `T_form` tại timestamp action và chỉ nhân một lần. `WeaponBase/FocusBase≥0` lấy từ item/chassis; không vũ khí dùng `WeaponBase=2`, không pháp khí dùng `FocusBase=0`. `SkillQuality=Clamp(0.75,1.25,0.75+0.0005×WeaponMastery)` và `SpellStructure` dùng công thức tương tự với spell mastery; mastery nằm `0..1000`.

### 4.K.2. Hit, crit, damage, status và interrupt

- `ACC/EVA/CritRating≥0`. `K_crit=100×1.45^T_target`; nếu `CritRating=0`, xác suất crit nền vẫn là 5%. Crit chance cap 50%. `CritMultiplier=Clamp(1.00,3.00,1.50+CritMultiplierBonus)`, trong đó bonus là tổng effect có ID và thiếu nguồn lấy 0; `CritApplied=CritMultiplier` khi hit đã crit, ngược lại 1. Target có immunity crit hợp lệ buộc `CritApplied=1`.
- `T_attacker/T_target` luôn là `T_active` của nguồn/đích tại timestamp action commit. `AttackPower=PAtk` với profile `PHYSICAL`, `AttackPower=MAtk` với `MAGICAL`; profile `MIXED` phải khóa `w_P,w_M≥0`, `w_P+w_M=1` và dùng `AttackPower=w_P×PAtk+w_M×MAtk`. Thiếu damage profile hoặc trọng số làm action invalid, không cho engine chọn chỉ số lớn hơn sau khi thấy mục tiêu.
- `SkillCoef>0` và `FlatSkill≥0` thuộc action profile; đòn cơ sở dùng `1/0`. Đặt `u=Hash64(action_id+"VARIANCE")/2^64∈[0,1)` và `Variance=0.95+0.10u`, nên phân bố uniform `[0.95,1.05)` và không reroll sau khi biết hit. `Position`: bất lợi 0.80; chính diện 1.00; sườn 1.10; sau lưng 1.20; weak point đã mở 1.30; chỉ lấy một giá trị cao nhất hợp lệ.
- `Element=K_ij` ở §8.5. `A_element/A_faction/A_field∈[−0.30,0.30]`; `Resistance/CounterSkill∈[0,0.30]`; mọi giá trị phải có effect/environment ID, thiếu nguồn lấy 0.
- `Armor≥0`; `PercentPen_eff=Eff(max(0,PercentPenRaw),0.60)` theo File 02; `FlatPen≥0`; `ArmorEff=max(0,Armor×(1−PercentPen_eff)−FlatPen)`. `OtherReduction=Clamp(0,0.60,1−∏(1−r_s))`, mỗi `r_s∈[0,0.60]`. Với `DR≤0.80`, tổng giảm nhân không vượt 92%. `TrueShare=Clamp(0,0.30,action_profile.true_share)`, thiếu trường lấy 0; một rule-tier cao hơn muốn vượt 0,30 phải ghi cap thay thế bằng effect ID. Phần true không crit và bỏ qua `DR/OtherReduction`, nhưng vẫn bị barrier/FlatReduction trừ sau khi hợp dòng.
- `BarrierCurrent/FlatReduction` là số nguyên không âm và bị trừ đúng một lần. `PreCritRaw/NormalRaw/TrueRaw` giữ số thập phân; `Impact`, barrier delta và HP `Damage` là số nguyên theo §5.4. Miss/immunity cho 0; hit hợp lệ có `Impact≥1` nhưng barrier/flat reduction có thể đưa HP Damage về 0.
- Status dùng `BaseChance∈[0,1]`, `Potency/Resistance≥0`; `TierEdgeStatus=Clamp(0.50,2.00,1.15^(T_attacker−T_target))`. Nếu potency/base chance bằng 0 thì xác suất bằng 0, tránh sàn 5% giả.

Mọi probability trong một action dùng sub-seed riêng theo `HASH-PRIMITIVE-1.0`: `u_hit=Hash64(action_id+target_id+"HIT")/2^64`, `u_crit` với suffix `CRIT`, và `u_status` với suffix `STATUS` cộng `status_id`. Hit/crit/status thành công khi `u<P` tương ứng; crit chỉ được xét sau hit và status chỉ được xét khi target rule còn hợp lệ. Không tái dùng `u_VARIANCE` hoặc reroll sau khi thấy bước trước.

`INTERRUPT-1.0`: `DamageImpact=100×Damage/TargetMaxHP`, với `TargetMaxHP>0` từ snapshot đích ở lúc action commit; đích không có HP phải có `ObjectiveHP>0` trong encounter contract và dùng giá trị ấy thay thế. `ControlPotency∈[0,100]`; `WeakPoint=0/25/50` cho không chạm/đúng điểm yếu/điểm yếu chí mạng. `SkillMastery∈[0,1000]`; `Stance=0` di động, `15` đứng vững, `30` được neo. Chỉ so trong interrupt window của action profile. Khi bị ngắt ở tiến độ `p∈[0,1]`, trả `Refund=Clamp(0,1,1−p)` của mana/thể lực còn reserve; vật phẩm tiêu hao và phần đã tick không hoàn.

### 4.K.3. Command và băng thông mệnh lệnh

`COMMAND-LOAD-1.0`:

- `CMD=Clamp(0,10,floor(CommandMastery/100))`; `CommandInfrastructureSupport/TalentSupport` là điểm nguyên không âm có source ID, không có nguồn lấy 0. Lửa Sinh Tồn không tạo `CommandInfrastructureSupport` trừ khi một mở khóa nguồn-khóa ghi đích danh.
- `BodySize`: tí hon 0.50; nhỏ 0.75; vừa 1.00; lớn 2.00; khổng lồ 4.00; cự hình 8.00.
- `RankWeight_command`: Thường tới Thần thoại `1.00/1.15/1.45/1.90/2.60/3.70/5.50`.
- `Complexity` lấy cột chassis `0.60..1.50`. `Persistence`: tức thời 0.25; một cảnh 0.50; một ngày 0.75; duy trì thường 1.00; vĩnh viễn 1.25; khế ước độc lập 1.50. Đơn vị sống thường trực không phải summon dùng 1.00.
- `Cost` giữ ba chữ số; `Load` là tổng cost; `CC` là số nguyên. `CommandEfficiency` dùng đúng hàm §9.1.

`ORDER-BANDWIDTH-1.0`:

- `OrderComplexity`: lặp lệnh cũ 0.75; lệnh đơn 1.00; cơ động phối hợp 1.50; nhiều pha 2.50; vi mô chính xác 4.00.
- `DistanceFactor=Clamp(1,5,1+RouteDistanceKm/10)`. `RelayPenalty`: relay trực tiếp 1.00; relay yếu/gián đoạn 1.50; không relay 2.50.
- `OrderCapacity=floor(10+2WIL+RelaySupport)`; `RelaySupport≥0` là điểm từ module/hero có source, mặc định 0. Đặt `r=OrderLoad/max(OrderCapacity,1)`; nếu `r≤1`, delay thêm 0; nếu `r>1`, `OrderDelaySeconds=ceil(3×(r−1)^2)` cho mỗi hop. Capacity 0 chỉ khi effect rule khóa hẳn liên kết; khi đó lệnh mới thất bại và cohort giữ lệnh cuối.

### 4.K.4. Item, salvage và cường hóa

- `ItemTier∈{0..10}`; `Quality` chế tác: thô 0.75, chuẩn 1.00, tinh 1.10, bậc thầy 1.25; `Condition=currentDurability/maxDurability∈[0,1]`. `IPB` làm tròn một chữ số.
- `Skill=Clamp(0,1,CraftingMastery/1000)`; với mỗi material line `m`, `CraftCost_m` là số đơn vị trong recipe gốc và `MaterialRecoverability_m∈[0,1]` nằm trong material template. `Salvage_m` dùng công thức §11.5, làm tròn xuống đơn vị vật liệu nhỏ nhất, không vượt `CraftCost_m`; item bị phá trong cùng transaction.
- Với rarity index `F=0...SSS=8`, catalyst chỉ có thể rơi từ A trở lên: `P_catalyst=Clamp(0,0.25,0.0625×max(0,RarityIndex−4)×Skill×Condition)`. Đặt `u=Hash64(salvage_event_id+item_instance_id+"CATALYST")/2^64`; rơi đúng một catalyst khi `u<P_catalyst`, ngược lại 0.
- `ENHANCE-1.0`: mỗi item tier có `e=0..5`; `IPB_enhanced=IPB×(1+0.05e)`. Khi thử nấc `e+1`, từng material line cần `EnhanceCost_m=ceil(0.25×CraftCost_m×1.6^(e+1))`; recipe có zero material line phải có `enhancement_substitute_recipe` đầy đủ trước khi thử. Facility thiếu stage bắt buộc chặn transaction; đúng stage cho `Facility=0.50`, cao hơn một stage `0.75`, cao hơn từ hai stage `1.00`. `P=Clamp(0.25,0.95,0.95−0.12(e+1)+0.10Skill+0.05Facility+0.15Failures)`; đặt `u=Hash64(enhancement_attempt_id+item_instance_id+"SUCCESS")/2^64` và thành công khi `u<P`. `Failures` bắt đầu 0, tăng 1 sau mỗi thất bại tới cap 4 và reset 0 khi thành công. Thất bại mặc định tiêu `ceil(0.50×EnhanceCost_m)` ở từng dòng đã reserve, không hạ nấc và không phá item; thành công reset Failures. Option rủi ro khác chỉ hoạt động nếu có contract riêng trước roll.

### 4.K.5. Công trình

`BUILDING-OUTPUT-1.0`:

- `Base` là unit/kỳ trong template. `StageCapacity` cho stage 1–8: `1.00/1.75/3.00/5.00/8.00/12.50/19.00/28.00`.
- `Workforce=Clamp(0,1.25,assigned_effective/required)`; `Skill`: chưa đào tạo 0.50, gần nghề 0.80, đúng nghề 1.00, chuyên gia 1.15, bậc thầy 1.25.
- `Input/Energy` là tỷ lệ đáp ứng của input thiết yếu thấp nhất, `0..1`; `Condition=currentDurability/maxDurability`; `Network`: cô lập 0.75, thường 1.00, tối ưu 1.10, tích hợp 1.25.
- Input thiết yếu bằng 0 cho output 0. Fungible output làm tròn xuống đơn vị nhỏ nhất; dịch vụ giữ một chữ số; item độc nhất chỉ hoàn thành khi output tích lũy đạt ít nhất 1.

### 4.K.6. Rương Báu `CHEST-LOOT-2.1` + `CHEST-CATEGORY-3.0`

Mọi khoảng nguyên dùng `RandomInt(seed,low,high)` của `HASH-PRIMITIVE-1.0`, bao gồm hai đầu. Với root `chest_instance_id+rule_version`, suffix là `LINE_COUNT`, rồi cho từng `line_no`: `FAMILY/BASE_QUANTITY/TEMPLATE/QUALITY`; không sub-roll nào dùng chung suffix. Số dòng gieo đúng khoảng phẩm rương §12.8; base quantity gieo đúng khoảng họ vật phẩm; sau đó nhân `BundleMult`.

Họ vật phẩm không còn dùng CDF phổ quát cũ `25/20/20/10/10/8/5/2`. Chọn đúng hàng `W_normal[g,*]` hoặc `W_event[profile,*]` tại §12.10, lọc scope/thời gian theo §12.11, chuẩn hóa trên các họ còn candidate hợp lệ rồi đặt `family_index=min{i:u_FAMILY<CDF_i}`. Template trong slice `grade|profile|family|scope|event_state` được sắp `item_template_id` rồi chọn bằng `floor(u_TEMPLATE×pool_size)`; hash của đúng slice phải trùng hash đã niêm. Pool rỗng, hash lệch hoặc sự kiện hết hạn làm receipt invalid, không đổi họ/scope và không reroll. Trùng template vẫn giữ `line_no/lot_id` riêng rồi mới được kho gộp sau biên nhận. Phẩm từng dòng dùng §12.9 và `u_QUALITY`. Không có pity ẩn hoặc reroll sau quan sát.

### 4.K.7. Hero, downed và hồi sinh

- `Reputation/InstitutionSupport∈[0,100]`; `LegitimacyEffective=File01.TERRITORY-VITALS-1.0.LEG∈[0,100]` khi hợp lệ và phải đã settle tới timestamp đọc. `NOT_APPLICABLE_NO_GOVERNED_RESIDENTS` dùng `LegitimacyEffective=0`; `INVALID` chặn. `HC` dùng `floor`, nên nằm `1..7`; vượt HC tạo ma sát như §18.6, không xóa hero.
- Hero tự thức tỉnh dùng duy nhất `HERO-AWAKEN-1.0` File 02 Phụ lục 2.I.8; không có dải 5–15 hay hệ số F chưa bind tại File 04.
- `DOWNED-1.0`: fatal tag hoặc overkill damage còn dư `≥0.50×MaxHP` gây chết ngay. Trường hợp khác, `BleedoutMinutes=Clamp(1,30,ceil(5+0.5VIT−2WoundSeverity))`, `WoundSeverity=0..5`; stabilize hợp lệ dừng countdown nhưng không hồi HP.
- Hồi sinh sự sống không có default chung: chỉ contract nguồn hoàn chỉnh mới chạy. Tử Phục không gọi contract đó và dùng riêng File 06.

### 4.K.8. Ngôi Mộ và Tử Phục

Trong `NECRO-QUEUE-2.2`, `B∈{1..10}`, `T∈{0..10}` và `Q∈{0..6}`; duration giữ phút tới 0.5, DQ cost là số nguyên. Với queue rỗng ở đầu đoạn, một recipe đồng nhất và khoảng `Δt` không cắt qua 00:00:

\[
N_{complete}=\min\left(\left\lfloor\frac{DQ_{current}}{DQCost}\right\rfloor,
Slots(B)\times\left\lfloor\frac{\Delta t}{Duration(B)}\right\rfloor\right)
\]

`DQ_current` là lượng khả dụng sau reservation cũ, trước job mới. Queue có job dở chạy scheduler File 06 §22.1: trừ DQ tại start, complete đúng timestamp, nhả slot, thử standing order, rồi mới refill khả dụng nếu timestamp là 00:00; hòa bằng `slot_id/job_id`. Khoảng cắt qua 00:00 phải tách segment; không cộng ngược DQ cho job đã trả. Test biên B1/T0/Thường/chuẩn: cap 20, 2 slot, 20 phút, cost 1. Tử Phục trực tiếp không gọi bất kỳ biến nào của công thức này.

Output queue luôn mang `TOMB_QUEUE`, không đủ điều kiện cho XP mirror của Lí Lan và dùng `TOMB-ZOMBIE-LABOR-1.0`. Tử thi do Lí Lan trực tiếp dựng mang `DIRECT_TU_PHUC`, có thể đủ `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`, nhưng giữ rate lao động của chassis đã validate; hai route không được chuyển nhãn để lấy lợi ích của nhau.

Blank trong schema 4.A–4.E là template không thực thi. Một instance thật thiếu field bắt buộc mang `UNKNOWN_RULE/INVALID_INSTANCE` và bị chặn; `STATE_UNOBSERVED` chỉ kiểm soát quyền biết, không cho phép engine bỏ qua validation.

### 4.K.9. Timing, đội hình, morale, supply và quá tải

`COMBAT-TIMING-1.0 — DESIGN_DEFAULT`: mọi thời lượng tính bằng giây và không âm.

\[
Recovery_{eff}=Recovery_{base}\times(1-Clamp(0,0.40,HasteRecovery))
\]

\[
ActionCycle=\max\left(0.5,\frac{\lceil2(Cast+Execution+Recovery_{eff})\rceil}{2}\right)
\]

Cooldown bắt đầu tại timestamp action commit và không bị Haste sửa nếu profile không ghi một effect ID riêng. Movement/reaction chỉ tồn tại khi profile có số giây/range chính xác; một cửa văn xuôi 3–6 giây có thể chứa nhiều action cycle ngắn nhưng ledger vẫn ghi từng action. Test biên: ba input thời gian 0 vẫn chiếm một tick 0,5 giây; Haste 100% chỉ giảm recovery 40%.

`FORMATION-MORALE-1.0 — DESIGN_DEFAULT` dùng bề rộng thân: tí hon `0,25 m`; nhỏ `0,50`; vừa `0,75`; lớn `1,50`; khổng lồ `3,00`; cự hình `6,00`. `FormationSpacing`: chen dày `1,00`; chuẩn `1,25`; tản `1,75`; skirmish `2,50`. Với cohort đồng nhất:

\[
FrontageSlots=\max\left(1,\left\lfloor\frac{UsableWidthMeters}
{BodyWidthMeters\times FormationSpacing}\right\rfloor\right)
\]

`Frontline=min(melee_ready,FrontageSlots)`. `Support=min(support_ready,2×FrontageSlots)` chỉ khi hai hàng sau có mặt bằng và line-of-effect; nếu không thì 0. `Reserve=active_total−Frontline−Support`. Đội hình trộn xếp theo formation order đã commit; cộng lần lượt bề rộng từng unit tới khi hết `UsableWidthMeters`, hòa dùng `unit_id`. `UsableWidthMeters≤0` chặn tiếp xúc thay vì tạo một slot giả. Sau đó dùng đúng `N_effective` §8.3.

Mỗi morale check lấy quân số đầu encounter `StartCount>0`:

\[
CasualtyPct=100\times\frac{Killed+0.5Downed}{StartCount}
\]

\[
Shock=Clamp(0,100,CasualtyPct+15Flanked+20LeaderDown+20SupplyBroken
+FearEffect-RallyEffect)
\]

Các flag bằng `0/1`; `FearEffect/RallyEffect∈[0,30]` phải có effect ID, thiếu nguồn lấy 0. `MoraleNew=Clamp(0,100,MoraleOld−Shock)`, `Resolve=0.5MoraleNew+0.3Cohesion+2WIL`, `RoutThreshold=Clamp(20,90,40+0.5Shock)`. `Resolve≥RoutThreshold` giữ vị trí; fail không quá 15 điểm và còn commander/route hợp lệ thì rút có tổ chức; còn lại rout. Tử vật/cấu trang vô trí thay `Morale` bằng `ControlIntegrity`; khi fail, chúng mất reaction và giữ lệnh cuối cho tới khi relay/node được phục hồi, không chạy hoặc phản bội.

`SUPPLY-STATE-1.0`: với mọi input thiết yếu có nhu cầu 24 giờ dương, `Coverage=min(current_i/need_i)`; không có input thiết yếu lấy `Coverage=1`. Band và modifier lần lượt:

| Coverage | State | regen | speed | morale/check | hiệu suất trang bị/đơn vị |
|---:|---|---:|---:|---:|---:|
| `≥1,00` | đầy | 1,00 | 1,00 | 0 | 1,00 |
| `0,75–<1,00` | đủ | 0,95 | 1,00 | 0 | 0,95 |
| `0,40–<0,75` | thiếu | 0,75 | 0,90 | −5 | 0,85 |
| `0,10–<0,40` | nguy | 0,50 | 0,75 | −10 | 0,70 |
| `<0,10` | đứt | 0 | 0,60 | −20 và `SupplyBroken=1` | 0,50 |

Các hệ số supply trên chỉ áp cho actor, quân đội, trang bị hoặc phương tiện có contract supply. Chúng không giảm `CurrentDurability` của building instance. Công trình thiếu input vận hành chỉ giảm/dừng output theo 4.K.5; kết cấu giữ nguyên cho tới khi có `BUILDING_ATTACK_DAMAGE`.

`SUMMON-OVERFLOW-1.0`: khi `x>1,5`, xử lý từng unit có agency theo route distance giảm dần rồi `unit_id` cho tới khi `x≤1,5`: loại `TEMPORARY` tan và đóng instance; `SUSTAINED` chuyển `RETURN_TO_ANCHOR` rồi rời active load khi tới neo; `CONTRACT` chuyển `REFUSES_NEW_ORDERS` và rời cây chỉ huy nhưng vẫn là actor độc lập; `CONSTRUCT` chuyển `STANDBY`; loại `BREEDING`/quần thể thật không despawn mà rời quyền điều khiển. Chỉ template có sẵn `BERSERK_ON_OVERLOAD=1` mới đổi sang berserk. Mỗi bước có event riêng; không chọn đơn vị thuận lợi sau khi thấy hậu quả.


## Phụ lục 4.L — Hợp đồng Bản Vẽ và 100 hạt giống `BLUEPRINT-CONTRACT-3.0`

### 4.L.1. Bất biến, schema và cách tự lập một Bản Vẽ mới

Một Bản Vẽ là lời hứa hệ thống về **kết quả hoàn chỉnh**, không phải bảng kê mua từng cấu kiện. Chín bất biến:

1. Recipe `SOURCE_EXPLICIT` được giữ nguyên từng dòng và số lượng, kể cả khi có năm dòng hoặc hơn; không áp trần số dòng do campaign tự đặt.
2. Recipe `SOURCE_ANALOGY`/`DESIGN_DEFAULT` dùng **tập tối thiểu các họ tài nguyên gộp thật sự tạo nên công trình**. Không có một con số dòng cố định, nhưng mỗi dòng phải vượt removal test và được chứng minh bằng quy mô, hình thể, chức năng hoặc cơ chế phép.
3. Đinh, ốc, bánh răng, bánh xe, ống khói, lõi lọc, bồn, rãnh, sỏi thoát nước, đá lát và mọi kích cỡ cấu kiện là hình thể đầu ra, không phải dòng recipe, trừ khi nguồn trực tiếp định nghĩa chúng là một item chế tạo độc lập của thế giới.
4. Tinh thể nguyên tố được chia theo **phẩm**, không theo Thủy/Hỏa/Mộc. Khi contract cần phẩm sơ cấp cho một nguyên tố cơ bản, item là `Tinh Thể Nguyên Tố Sơ Cấp`; nguyên tố nằm trong `effect_contract`, không tạo SKU mới.
5. Một `blueprint_id` có một bản thể. Không tự tạo cặp mundane/magic, không cho vật liệu thường thay thế hiệu ứng phép, và không cho phép thay tế phẩm/khế ước của công trình nghi lễ bằng vật liệu xây.
6. `material_recipe` chỉ trả để dựng; nhiên liệu, mana, thuốc, thức ăn, quặng xử lý hay hàng hóa đi qua công trình thuộc `production_inputs`.
7. Công trình không có maintenance/day hoặc hao mòn thụ động. Chỉ tấn công có ledger mới giảm độ bền.
8. Không dựng nhà cung cấp độc quyền, hãng liên vương quốc hay “core” mang thương hiệu để hợp thức hóa recipe. Ngoài vật liệu chiến lược thật sự đã có nguồn, recipe dùng lớp tài nguyên phổ quát; không nêu được quan hệ vật liệu→thành phẩm thì bỏ dòng đó hoặc chặn Bản Vẽ.
9. Bản Vẽ sự kiện phải mang `EVENT_EXCLUSIVE:<event_id>` trên cả template và cuộn instance. Nó không được vào rương/shop/discovery thường; sau event, cuộn mới chỉ có thể đổi chủ qua trade instance đã tồn tại. Quyền chế tác hậu event dùng đúng `post_event_crafting_policy` §12.11, không mặc định mở vĩnh viễn.

Một Bản Vẽ có thể thi công phải bind tối thiểu:

```yaml
blueprint:
  blueprint_id:
  name:
  source_class: SOURCE_EXPLICIT|SOURCE_ANALOGY|USER_LOCKED|DESIGN_DEFAULT
  source_ref:
  source_anchor_ids: []
  analogy_family:
  acquisition_scope: GENERIC_WORLD|EVENT_EXCLUSIVE:<event_id>|QUEST_EXCLUSIVE:<quest_id>
  origin_event_id: NONE|<event_id>
  available_from:
  available_until:
  primary_source_state: ACTIVE|EXPIRED_PRIMARY_SOURCE
  trade_policy: TRADEABLE_INSTANCE|BOUND_ON_ACQUIRE|BOUND_ON_LEARN
  post_event_crafting_policy: SOURCE_PERMANENT_RECIPE|ACTIVE_WINDOW_ONLY|NOT_APPLICABLE
  grade: F|E|D|C|B|A|S|SS|SSS
  tier: 0..10
  system:
  effect_contract:
  footprint_m2:
  form_factor: 1|2|3|4
  form_reason:
  scale_basis:
  terrain_and_foundation:
  prerequisites: []
  comparison_contract_ids: []
  comparison_notes: []
  material_reasons: {}
  quantity_reasons: {}
  material_recipe: {}
  magic_resource_contract:
  production_inputs: {}
  energy_demand:
  base_work_units:
  labor_anchor_and_reason:
  workforce: {minimum, recommended, maximum, workfronts}
  required_skill:
  required_tool_class:
  durability: {maximum, armor, damage_rule: BUILDING_ATTACK_DAMAGE_ONLY}
  durability_anchor_and_reason:
  upgrade_from:
  output_contract:
  hazards_and_counters: []
  work_rule_version: BLUEPRINT-WORK-3.0
  durability_rule_version: BUILDING-DURABILITY-2.0
  rule_version: BLUEPRINT-CONTRACT-3.0
  contract_hash:
```

Quy trình bắt buộc cho một mẫu mới:

1. **Xác định lớp tri thức.** Nếu mẫu đã nằm sẵn trong Sổ Kiến Trúc thì cập nhật registry dựng sẵn, không tạo item Bản Vẽ. Nếu thân truyện hiện recipe, dùng `SOURCE_EXPLICIT` và chép nguyên toàn contract. Nếu thân truyện im lặng, im lặng chỉ là `UNOBSERVED_SOURCE_DETAIL`; muốn lấp phải dùng `SOURCE_ANALOGY` có ít nhất hai neo cùng họ hoặc ghi rõ `DESIGN_DEFAULT`.
2. **Khóa thành phẩm trước nguyên liệu.** Viết `effect_contract`, diện tích/công suất, hình thể, môi trường đặt, điều kiện trước và đầu ra. Cùng tên nhưng khác cơ chế hoạt động là khác identity; không tạo hai bản thường/phép chỉ để né suy luận.
3. **Chọn neo so sánh thật.** Ít nhất một neo chứng minh họ chức năng/hình thể và một neo chứng minh quy mô/giá. Ưu tiên một mẫu không lớn hơn và một mẫu không nhỏ hơn trong cùng epoch. Nếu chỉ có neo một phía, ghi rõ vì sao ngoại suy; không gắn nhãn `SOURCE_ANALOGY` khi các neo chỉ cùng Bậc nhưng khác chức năng.
4. **Chọn họ vật liệu gộp.** Mỗi dòng phải chỉ vào một khối lượng hoặc cơ chế lớn: khung/mái/sàn bằng Gỗ; móng/tường/khối giữ nhiệt bằng Đá; thân máy/giáp/khung chịu tải lớn bằng kim loại; lớp vỏ/mái mềm/cách nhiệt diện rộng bằng Vải/Da; vật liệu chiến lược hoặc ma pháp chỉ khi `effect_contract` thật sự cần. Đinh, ống khói, bánh xe và cấu kiện nhỏ được Hệ Thống biểu hiện từ các họ vật liệu ấy.
5. **Định lượng bằng loại suy, không bằng bundle Bậc.** Với từng dòng, `quantity_reason` phải nêu neo dưới/neo trên, tỉ lệ quy mô hoặc công suất liên quan, phần kết cấu dùng lại và lý do số đã chọn nằm ở đâu giữa/ngoài hai neo. So sánh cùng họ phải đơn điệu: mẫu lớn hơn/kiên cố hơn không được dùng ít hơn vật liệu tương ứng nếu không có một thay đổi công nghệ/hình thể được ghi. Làm tròn theo đơn vị mà nguồn dùng. Không có công thức ngân sách phổ quát và không được lấy tag `T1/T2` tự sinh một gói Gỗ–Đá–Sắt.
6. **Khóa phép bằng chính cơ chế phép.** Số/phẩm tinh thể hoặc vật liệu ma pháp lấy từ nguồn trực tiếp hay neo ma pháp cùng họ. `Tinh Thể Nguyên Tố Sơ Cấp` là SKU chung cho các nguyên tố cơ bản; không thêm hậu tố nguyên tố. Không tự gắn tinh thể cho công trình chỉ vì thế giới có ma pháp.
7. **Khóa lao động và độ bền riêng.** `base_work_units`, workforce, tool class, durability và armor phải có neo cảnh/contract hoặc lý do authored theo kích thước, số mặt công việc, độ kín và vai trò phòng thủ. Không suy chúng từ tổng vật liệu bằng một công thức toàn cầu. Thời gian cảnh vẫn được engine tính từ WU và đội thật theo `BLUEPRINT-WORK-3.0` bên dưới.
8. **Kiểm định trước khi tồn tại.** Chạy removal test từng dòng, kiểm tra công trình–vận hành tách sổ, kiểm tra đơn điệu với các contract cùng họ, rồi freeze version/hash. Thiếu một lý do hoặc một neo bắt buộc giữ trạng thái `BLUEPRINT_DRAFT`; tuyệt đối không phát thưởng, bán, cho học hoặc tua thời gian để chữa lỗi.

`BLUEPRINT-WORK-3.0 — DESIGN_DEFAULT`: `1 WorkUnit` là một giờ lao động của worker chuẩn ở toàn bộ modifier `1,00`. Với mỗi đoạn thời gian mà đội không đổi:

\[
Rate_i=BaseLaborRate_i\times Health_i\times Stamina_i\times Skill_i
\times Tool_i\times Weather_i\times Shelter_i\times Command_i
\]

Mỗi multiplier thuộc `0..1,25`; thiếu công cụ/cơ sở **bắt buộc** cho `Tool=0`, actor bất tỉnh/không thể làm cho `Health=0`. `BaseLaborRate` của người trưởng thành chuẩn là `1 WU/giờ`; loài/chassis khác phải có template. `TOMB-ZOMBIE-LABOR-1.0 — USER_LOCKED` bind zombie chuẩn sinh bởi lineage Ngôi Mộ `LL-BLD-TOMB-01` ở mọi bậc với `BaseLaborRate=1,00 WU/giờ`; zombie không mệt sinh học nên `Stamina=1,00` trừ effect/chassis chỉ đích danh, còn integrity, skill, tool, weather, shelter, command và `Coord(n)` vẫn áp bình thường. Unit `DIRECT_TU_PHUC` không tự kế thừa rate này mà dùng template chassis đã validate. Chỉ lấy tối đa `maximum` worker đã reserve. Chia worker tất định qua `workfronts` theo số lượng cân bằng rồi `worker_id`; trong từng workfront, với `n` worker hoạt động:

| `n` | 1 | 2 | 3 | 4 | 5–8 | 9–16 | 17+ |
|---:|---:|---:|---:|---:|---:|---:|---:|
| `Coord(n)` | 1,00 | 0,75 | 0,65 | 0,60 | 0,55 | 0,50 | 0,45 |

\[
EffectiveWU_h=\sum_{front} Coord(n_{front})\sum_{i\in front}Rate_i,\qquad
DurationHours=\frac{RemainingWU}{EffectiveWU_h}
\]

Nếu modifier/ca làm/weather thay đổi, tích phân từng segment và không dùng trung bình hồi tố. `EffectiveWU_h=0` đặt job `BLOCKED`, không cho thời gian vô hạn giả. Để trả lời “cần bao nhiêu người trước deadline”, engine thử số nguyên `n=minimum..maximum` với roster đủ điều kiện, phân workfront như trên và chọn `n` nhỏ nhất thỏa `DurationHours≤DeadlineHours`; không có `n` thỏa thì trả blocker. Vật liệu, footprint, worker và công cụ được reserve nguyên tử trước start; hoàn tiền chỉ theo salvage contract. Hệ thống trừ recipe rồi biểu hiện cả công trình, gồm luôn mọi cấu kiện nhỏ trong hình thể.

`T_ref` trong bảng sau giả định đúng số worker “khuyến nghị”, một workfront trừ khi Bản Vẽ ghi khác, mọi `Rate_i=1`, đủ vật liệu/công cụ và không gián đoạn. Nó là kết quả áp WU đã khóa, không phải thời gian cố định đè weather/skill. Recipe nguồn giữ nguyên toàn contract. Mẫu không có recipe nguồn phải đi qua tám bước lý luận trên; không được lấy một hàng cùng tag rồi đổi tên.

### 4.L.2. Hai mươi ID khai cuộc: contract Blueprint và tombstone

`D/A` là `DurabilityMax/Armor`. Các ID 004, 005, 006, 013 và 015 từng sao chép sai các mẫu dựng sẵn nên đã bị retire vĩnh viễn; owner thật của chúng là `OPENING-FIXED-BUILDINGS-2.0`. Các contract còn lại không tạo công thức phổ quát; khi có neo nguồn mới phải tái thẩm định cả contract.

| ID | Bản Vẽ | A/F/T | Lý do vật liệu chính | Recipe xây | Tinh thể chung | WU | thợ min/khuyên/max | D/A | Nhãn |
|---|---|---|---|---|---:|---:|---|---|---|
| BP-001 | Tu sửa Nhà Lãnh Chúa Hư Hại | 16/2/0 | đá vá khối nền; gỗ phục hồi khung | Đá 10; Gỗ 20 | 0 | 0,2833 | 1/1/2 | 940/5 | SOURCE_LOCKED/DERIVED <> |
| BP-002 | Nhà Nông Phu Cực Địa Cấp 1 | 12/2/0 | gỗ là khung–mái; đá là móng và khối giữ nhiệt | Đá 10; Gỗ 30 | 0 | 0,75 | 1/1/2 | 1.250/5 | SOURCE_LOCKED/DERIVED <> |
| BP-003 | Nâng Nhà Nông Phu Cực Địa 1→2 | 30/2/1 | nhà Cấp 1 là prerequisite/khối tái dùng; gỗ–đá mở rộng kết cấu | Gỗ 50; Đá 30 | 0 | 1,20 | 2/4/4 | 2.500/10 | SOURCE_LOCKED/DERIVED <> |
| BP-004 | **RETIRED — trùng Nơi Trú Nhỏ dựng sẵn** | — | owner Phụ lục 4.M | — | — | — | — | — | RETIRED_TOMBSTONE |
| BP-005 | **RETIRED — trùng Tiệm May dựng sẵn** | — | owner Phụ lục 4.M | — | — | — | — | — | RETIRED_TOMBSTONE |
| BP-006 | **RETIRED — trùng Lò Rèn dựng sẵn** | — | owner Phụ lục 4.M | — | — | — | — | — | RETIRED_TOMBSTONE |
| BP-007 | Bếp Ăn Dã Chiến | 20/2/0 | đá tạo bếp; gỗ tạo mái/quầy; sắt tạo mặt nấu lớn | Đá 20; Gỗ 10; Sắt 10 | 0 | 2,00 | 1/2/4 | 1.250/20 | DESIGN_DEFAULT |
| BP-008 | Kho Gỗ Có Mái | 15/1/0 | gỗ tạo mái/giá đỡ; đá kê nền khô | Gỗ 15; Đá 5 | 0 | 1,00 | 1/1/2 | 500/5 | DESIGN_DEFAULT |
| BP-009 | Bãi Đá Gia Cố | 25/1/0 | đá tạo nền chịu tải; gỗ tạo khung phân lô | Đá 20; Gỗ 10 | 0 | 1,50 | 1/2/4 | 750/20 | DESIGN_DEFAULT |
| BP-010 | Trạm Nấu Tuyết | 20/2/1 | đá tạo buồng nhiệt; gỗ tạo mái/khung; sắt tạo nồi/buồng lớn | Đá 30; Gỗ 10; Sắt 10 | 0 | 2,50 | 1/2/4 | 1.570/25 | DESIGN_DEFAULT |
| BP-011 | Trạm Lò Than | 18/3/1 | đá tạo thân lò và ống khói biểu hiện; gỗ tạo mái/giàn; sắt gia cố cửa lò | Đá 45; Gỗ 15; Sắt 15 | 0 | 3,75 | 1/2/4 | 2.820/35 | DESIGN_DEFAULT |
| BP-012 | Tháp Tên Nguyên Tố Sơ Cấp | 16/3/1 | recipe nguồn dùng khung gỗ, khối đá, gia cố sắt và một tinh thể chung | Gỗ 300; Đá 200; Sắt 50 | 10 | 27,50 | 1/6/12 | 20.630/25 | SOURCE_LOCKED <> |
| BP-013 | **RETIRED — trùng Tường Rào dựng sẵn** | — | owner Phụ lục 4.M | — | — | — | — | — | RETIRED_TOMBSTONE |
| BP-014 | Tháp Canh Tuyết | 20/3/1 | gỗ tạo thân/sàn; đá tạo móng; sắt tạo khung chịu lực lớn | Gỗ 45; Đá 15; Sắt 15 | 0 | 3,75 | 1/2/4 | 2.820/20 | DESIGN_DEFAULT |
| BP-015 | **RETIRED — trùng Phòng Y Tế dựng sẵn** | — | owner Phụ lục 4.M | — | — | — | — | — | RETIRED_TOMBSTONE |
| BP-016 | Doanh Trại Cung Thủ Hàn Băng | 60/2/1 | gỗ tạo doanh trại; đá tạo nền; sắt gia cố kho vũ khí; phép băng dùng tinh thể chung | Gỗ 75; Đá 50; Sắt 25 | 3 | 7,50 | 1/3/6 | 4.690/15 | DESIGN_DEFAULT |
| BP-017 | Chuồng Tuần Lộc | 40/2/1 | gỗ tạo chuồng/vách; đá tạo nền; sắt tạo khung cổng lớn | Gỗ 60; Đá 20; Sắt 20 | 0 | 5,00 | 1/3/6 | 3.130/10 | DESIGN_DEFAULT |
| BP-018 | Quán Rượu Nhỏ | 50/2/1 | gỗ tạo sảnh/mái; đá tạo bếp/nền; sắt gia cố khu phục vụ | Gỗ 65; Đá 40; Sắt 20 | 0 | 6,25 | 1/3/6 | 3.910/15 | DESIGN_DEFAULT |
| BP-019 | Trạm Trao Đổi | 35/2/1 | gỗ tạo quầy/khung; đá tạo nền/kho; sắt gia cố cửa hàng lớn | Gỗ 40; Đá 40; Sắt 20 | 0 | 5,00 | 1/3/6 | 3.130/25 | DESIGN_DEFAULT |
| BP-020 | Đống Lửa Lớn | 25/1/1 | đá tạo vòng chịu nhiệt; gỗ tạo bệ ban đầu; nhiên liệu sau đó là input vận hành | Đá 30; Gỗ 10 | 0 | 2,00 | 1/2/4 | 1.000/25 | DESIGN_DEFAULT |

### 4.L.3. Tám mươi hạt giống chưa phải Bản Vẽ

Các hàng `BP-021..100` chỉ giữ danh tính, giai đoạn, phẩm/Bậc/hệ, diện tích và nguồn ý tưởng. Chúng **không phải item Bản Vẽ**, không được phát thưởng/bán/học/xây, và không có recipe ngầm. Khi cần dùng một hàng, người kể phải tự materialize toàn bộ contract 4.L.1 từ chức năng, quy mô và lý do; event `BlueprintMaterialized` cùng `contract_hash` phải xảy ra trước event tạo vật phẩm.

| ID | Hạt giống | Giai đoạn/nguồn dùng | Phẩm/Bậc/Hệ | m² | Nhãn nguồn |
|---|---|---|---|---:|---|
| BP-021 | Tháp Tên Nguyên Tố Trung Cấp | Shop sự kiện | D/T2/DEFENSE | 24 | EVENT-SHOP TEMPLATE |
| BP-022 | Tường Băng Sơ Cấp | Shop sự kiện | D/T1/DEFENSE | 10 | EVENT-SHOP TEMPLATE |
| BP-023 | Tường Băng Trung Cấp | Shop sự kiện | C/T2/DEFENSE | 20 | EVENT-SHOP TEMPLATE |
| BP-024 | Tháp Tín Hiệu Băng Long | Shop sự kiện | C/T2/INTEL | 36 | EVENT-SHOP TEMPLATE |
| BP-025 | Tháp Quan Trắc Quái | Shop sự kiện | D/T1/INTEL | 25 | EVENT-SHOP TEMPLATE |
| BP-026 | Mỏ Băng Gia Cố | Shop sự kiện | D/T2/LOGISTICS | 80 | EVENT-SHOP TEMPLATE |
| BP-027 | Xưởng Tinh Luyện Ma Tinh | Shop sự kiện | C/T2/CRAFT | 90 | EVENT-SHOP TEMPLATE |
| BP-028 | Xưởng Luyện Dược | Shop sự kiện | C/T2/MEDICAL | 70 | EVENT-SHOP TEMPLATE |
| BP-029 | Xưởng Cơ Giới | Shop sự kiện | C/T2/CRAFT | 100 | EVENT-SHOP TEMPLATE |
| BP-030 | Chuồng Voi Ma Mút | Shop sự kiện | D/T1/SHELTER | 120 | EVENT-SHOP TEMPLATE |
| BP-031 | Tổ Sư Thứu | Shop sự kiện | B/T3/SHELTER | 180 | EVENT-SHOP TEMPLATE |
| BP-032 | Vườn Ươm Thụ Linh | Shop sự kiện | C/T2/NATURE | 120 | EVENT-SHOP TEMPLATE |
| BP-033 | Nhà Kính Hắc Thổ | Shop sự kiện | C/T2/NATURE | 100 | EVENT-SHOP TEMPLATE |
| BP-034 | Sảnh Thợ Săn | Shop sự kiện | D/T2/TRAINING | 90 | EVENT-SHOP TEMPLATE |
| BP-035 | Kho Viễn Chinh | Shop sự kiện | C/T2/LOGISTICS | 140 | EVENT-SHOP TEMPLATE |
| BP-036 | Trạm Relay Ma Năng | Shop sự kiện | C/T2/MAGIC | 60 | EVENT-SHOP TEMPLATE |
| BP-037 | Lò Nung Cơ Động | Shop sự kiện | D/T1/INFRASTRUCTURE | 30 | EVENT-SHOP TEMPLATE |
| BP-038 | Bếp Chiến Dịch | Shop sự kiện | D/T1/FOOD | 45 | EVENT-SHOP TEMPLATE |
| BP-039 | Đài Đổi Điểm Sự Kiện | Shop sự kiện | B/T2/TRADE | 80 | EVENT-SHOP TEMPLATE |
| BP-040 | Bảo Khố Khóa Ấn | Shop sự kiện | B/T3/TRADE | 100 | EVENT-SHOP TEMPLATE |
| BP-041 | **RETIRED — trùng chuỗi hình thái Lửa Sinh Tồn** | không được materialize | RETIRED | — | RETIRED_TOMBSTONE |
| BP-042 | **RETIRED — trùng chuỗi hình thái Lửa Sinh Tồn** | không được materialize | RETIRED | — | RETIRED_TOMBSTONE |
| BP-043 | **RETIRED — trùng chuỗi hình thái Lửa Sinh Tồn** | không được materialize | RETIRED | — | RETIRED_TOMBSTONE |
| BP-044 | Phủ Lãnh Chúa Cấp 4 | Giữa kỳ | B/T3/GOV | 600 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-045 | Khu Trú Ẩn Trung Cấp | Giữa kỳ | B/T3/SHELTER | 800 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-046 | Bệnh Viện Lãnh Địa | Giữa kỳ | B/T3/MEDICAL | 500 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-047 | Thư Viện Học Thuật | Giữa kỳ | C/T2/INTEL | 300 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-048 | Thư Viện Giấc Mơ | Giữa kỳ | A/T4/MAGIC | 450 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-049 | Cổ Thụ Tri Thức | Giữa kỳ | A/T4/NATURE | 500 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-050 | Cổ Thụ Gió | Giữa kỳ | B/T3/NATURE | 420 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-051 | Cổ Thụ Sinh Mệnh | Giữa kỳ | A/T4/NATURE | 650 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-052 | Xưởng Bí Dược | Giữa kỳ | B/T3/MEDICAL | 280 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-053 | Đại Lò Rèn | Giữa kỳ | A/T4/CRAFT | 550 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-054 | Nhà Máy May | Giữa kỳ | B/T3/CRAFT | 480 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-055 | Binh Doanh Cung Hàn | Giữa kỳ | B/T3/TRAINING | 700 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-056 | Binh Doanh Ascalon | Giữa kỳ | A/T4/TRAINING | 900 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-057 | Trại Kỵ Sĩ Bàn Tay Bạc | Giữa kỳ | A/T4/TRAINING | 1000 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-058 | Tháp Pháp Sư Thổ | Giữa kỳ | A/T4/MAGIC | 450 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-059 | Nhà Thầy Thuốc Bộ Lạc | Giữa kỳ | B/T3/MEDICAL | 300 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-060 | Chuồng Sói Sương | Giữa kỳ | B/T3/SHELTER | 500 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-061 | Long Sào Băng Tinh | Giữa kỳ | S/T5/SUMMON | 1800 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-062 | Lâm Địa Druid | Giữa kỳ | A/T4/NATURE | 900 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-063 | Tế Đàn Anh Hùng | Giữa kỳ | S/T5/SUMMON | 600 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-064 | Tháp Huyết Tinh | Giữa kỳ | A/T4/MAGIC | 500 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-065 | Tế Đàn Máu | Giữa kỳ | A/T4/SUMMON | 420 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-066 | Nhà Nguyện Quang Minh | Giữa kỳ | B/T3/MAGIC | 350 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-067 | Vườn Ác Mộng | Giữa kỳ | A/T4/NATURE | 650 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-068 | Cổng Truyền Tống Khu Vực | Giữa kỳ | S/T5/MAGIC | 900 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-069 | Máy Phát Khiên Ma Năng | Giữa kỳ | A/T4/DEFENSE | 450 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-070 | Trạm Thương Hội Cự Nhân | Giữa kỳ | B/T3/TRADE | 800 | <>-MID-MOTIF + DESIGN_DEFAULT |
| BP-071 | Bia Danh Dự Bảng Hạng | Thưởng bảng hạng | B/T3/GOV | 120 | RANK-REWARD TEMPLATE |
| BP-072 | Đấu Trường Quán Quân | Thưởng bảng hạng | A/T4/TRAINING | 1400 | RANK-REWARD TEMPLATE |
| BP-073 | Trụ Sở Quân Đoàn | Thưởng bảng hạng | A/T4/SHELTER | 1800 | RANK-REWARD TEMPLATE |
| BP-074 | Học Viện Quân Sự | Thưởng bảng hạng | A/T4/TRAINING | 1600 | RANK-REWARD TEMPLATE |
| BP-075 | Tường Băng Cao Cấp | Thưởng bảng hạng | S/T5/DEFENSE | 20 | RANK-REWARD TEMPLATE |
| BP-076 | Tháp Khiên Sương | Thưởng bảng hạng | S/T5/DEFENSE | 180 | RANK-REWARD TEMPLATE |
| BP-077 | Kho Vũ Khí Băng Long | Thưởng bảng hạng | S/T5/CRAFT | 900 | RANK-REWARD TEMPLATE |
| BP-078 | Đài Quan Trắc Hạo Nguyệt | Thưởng bảng hạng | A/T4/INTEL | 300 | RANK-REWARD TEMPLATE |
| BP-079 | Bảo Khố Tài Phú | Thưởng bảng hạng | S/T5/TRADE | 650 | RANK-REWARD TEMPLATE |
| BP-080 | Sàn Đấu Giá Liên Khu | Thưởng bảng hạng | S/T5/TRADE | 1200 | RANK-REWARD TEMPLATE |
| BP-081 | Điện Anh Hùng | Thưởng bảng hạng | S/T5/SUMMON | 1000 | RANK-REWARD TEMPLATE |
| BP-082 | Tháp Kèn Băng Long | Thưởng bảng hạng | A/T4/DEFENSE | 240 | RANK-REWARD TEMPLATE |
| BP-083 | Trung Tâm Chỉ Huy Tinh Hỏa | Thưởng bảng hạng | S/T5/GOV | 1000 | RANK-REWARD TEMPLATE |
| BP-084 | Tháp Hủy Diệt | Thưởng bảng hạng | SS/T6/DEFENSE | 400 | RANK-REWARD TEMPLATE |
| BP-085 | Căn Cứ Quang Pháo Bán Thần | Thưởng bảng hạng | SS/T6/DEFENSE | 900 | RANK-REWARD TEMPLATE |
| BP-086 | Điện Lãnh Chúa | Hậu kỳ/kỳ quan | S/T5/GOV | 2400 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-087 | Bản Vẽ Cự Thành | Hậu kỳ/kỳ quan | SS/T7/WONDER | 250000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-088 | Nội Thành Tinh Hỏa | Hậu kỳ/kỳ quan | S/T6/GOV | 50000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-089 | Nút Truyền Tống Thế Giới | Hậu kỳ/kỳ quan | SS/T7/LOGISTICS | 5000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-090 | Xưởng Tàu Biển Vĩnh Đông | Hậu kỳ/kỳ quan | S/T6/LOGISTICS | 12000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-091 | Đại Trận Tịnh Hóa Cổ Chiến Trường | Hậu kỳ/kỳ quan | SS/T7/MAGIC | 20000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-092 | Thánh Địa Cổ Thụ Trắng | Hậu kỳ/kỳ quan | SS/T7/NATURE | 15000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-093 | Lò Đúc Ma Tượng Thần Linh | Hậu kỳ/kỳ quan | SSS/T8/CRAFT | 18000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-094 | Lò Phản Ứng Long Tinh | Hậu kỳ/kỳ quan | SS/T7/ENERGY | 6000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-095 | Viện Nghiên Cứu Quy Tắc | Hậu kỳ/kỳ quan | SSS/T8/INTEL | 12000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-096 | Đại Kho Lương Thế Giới | Hậu kỳ/kỳ quan | SS/T7/FOOD | 30000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-097 | Tháp Điều Khí Lục Địa | Hậu kỳ/kỳ quan | SSS/T9/MAGIC | 25000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-098 | Mạng Neo Linh Hồn | Hậu kỳ/kỳ quan | SSS/T9/SUMMON | 18000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-099 | Kết Giới Vĩnh Hằng | Hậu kỳ/kỳ quan | SSS/T10/DEFENSE | 100000 | <>-LATE-MOTIF + DESIGN_DEFAULT |
| BP-100 | Kỳ Quan Tinh Hỏa | Hậu kỳ/kỳ quan | SSS/T10/WONDER | 500000 | <>-LATE-MOTIF + DESIGN_DEFAULT |

Danh mục giữ đúng 100 ID duy nhất; tám ID `BP-004`, `005`, `006`, `013`, `015`, `041`, `042`, `043` là tombstone, không phải Bản Vẽ/hạt giống và không bao giờ được phát thưởng hay tái sử dụng. Năm ID đầu từng sao chép mẫu dựng sẵn; ba ID cuối từng sao chép hình thái Lửa Sinh Tồn. Nếu recipe nguồn mới được xác minh, thay **toàn bộ** contract bằng version mới, không trộn riêng con số thuận lợi. Một Bản Vẽ tự nghĩ ngoài bảng dùng cùng schema và quy trình loại suy bắt buộc; không được suy recipe từ Phẩm, hệ hoặc tên.

### 4.L.4. Nâng cấp, sửa chữa và vòng đời contract

**Nâng cấp.** Công trình hiện hữu nằm trong `upgrade_from`, không bao giờ xuất hiện như một item vật liệu. Nếu nguồn hiện recipe nâng, giữ nguyên. Nếu nguồn im lặng, tạo một contract `SOURCE_ANALOGY` riêng cho đúng cạnh `L→L+1`: so sánh ít nhất hai cạnh nâng/công trình cùng họ, nêu phần nền–khung–hệ phép được tái dùng, rồi định lượng **phần bổ sung** theo hình thể và công suất target. `UpgradeReuse` ở §14.3 là gợi ý phân loại mức tái dùng, không phải phép nhân tự sinh recipe. Tinh thể/vật liệu phép chỉ trả thêm khi target thật sự mở rộng cơ chế phép và contract cùng họ chứng minh phần tăng; không được thu lại toàn bộ neo phép cũ. Thiếu neo hoặc lý do thì cạnh nâng giữ `UNOBSERVED_SOURCE_DETAIL/ANALOGY_BLOCKED`, không mượn recipe của Cấp khác.

**Độ bền và sửa chữa.** Sau nghiệm thu, chỉ event `BUILDING_ATTACK_DAMAGE` được thay `CurrentDurability`. Với `r=(Maximum−Current)/Maximum`:

\[
RepairCost_m=\lceil BuildCost_m r\rceil,\qquad
RepairWU=RoundUp_{0.25}(BaseWU\times r),\qquad RepairCrystal=0
\]

Sửa chữa phục hồi đúng lượng độ bền đã ghi trong work order; không tái tạo tinh thể đã trở thành neo phép. Không có attack ledger thì trả `REPAIR_NOT_APPLICABLE`, không tạo việc giả để đốt tài nguyên.

**Vòng đời Bản Vẽ.** Transaction bắt buộc đi theo trạng thái:

`BLUEPRINT_DRAFT` → viết effect/scale/form/anchors/reasons → khóa recipe/WU/workforce/durability → `BLUEPRINT_VALIDATED` → tạo `contract_hash` → `BlueprintMaterialized` → mới được `RewardCreated`, `ShopListed`, `ChestSeeded` hoặc `BlueprintLearned` → reserve và thi công.

Nếu thiếu một field hoặc lý do, giữ ở `BLUEPRINT_DRAFT` và báo blocker; không phát một item rỗng rồi để người kể nghĩ recipe sau. Bản Vẽ cũ vi phạm contract được sửa bằng event `BlueprintContractCorrected` ở timestamp hiện tại, giữ lịch sử và state vật lý đã xảy ra; **không tua thời gian, không xóa cảnh, không replay phần thưởng**.

### 4.L.5. Hai kiểm chứng bắt buộc — `EXAMPLE_ONLY`

**Giếng Nước Tự Thanh Tẩy.** Đây là một contract `CAMPAIGN_ONLY/EXAMPLE_ONLY` đã đóng băng, không phải số trích từ nguyên tác và không có bản thường song song. Thành phẩm `12 m²` dùng `Đá 40 + Gỗ 10 + 1 Tinh Thể Nguyên Tố Sơ Cấp`: Đá là thân giếng/khối chứa nước, Gỗ là khung–mái, tinh thể chung là neo cho hiệu ứng tự thanh tẩy và cấp tối đa 200 lít nước sạch/ngày. `WU=2,50`, thợ `1/2/4`, `Durability=1.570`, `Armor=25` là giá trị authored của chính contract này, không phải kết quả của công thức theo Bậc. `production_inputs={}`; không có cát, sỏi, lõi lọc, lõi Thủy, cartridge thay hằng ngày, maintenance hoặc biến thể mundane.

**Trạm Lò Than bị đánh.** BP-011 có `BuildCost={Đá45,Gỗ15,Sắt15}`, `WU=3,75`, `MaximumDurability=2.820`. Sau một attack ledger làm độ bền còn `2.115`, `r=0,25`; work order sửa chữa là `Đá12 + Gỗ4 + Sắt4`, `RepairWU=1,00`, tinh thể 0. Ống khói đã là hình thể từ Đá/Sắt của recipe ban đầu, không phải vật phẩm mua riêng.

Hai ca trên là bài kiểm logic, không phải template để sao chép vật liệu sang công trình khác. Mỗi mẫu mới vẫn phải tự nêu lý do dựa trên chính quy mô, hình thể và chức năng của nó.

## Phụ lục 4.M — Registry mẫu dựng sẵn khai cuộc `OPENING-FIXED-BUILDINGS-2.0`

> **Nhãn:** `E` là dữ kiện `SOURCE_EXPLICIT`; `A` là `SOURCE_ANALOGY` đã freeze từ các neo cùng họ. Đây là registry hệ thống cố định của mọi lượt chơi, không phải item Bản Vẽ. Mỗi hàng mô tả profile **sau khi đạt Cấp đó**; recipe là cạnh từ hàng đó lên Cấp kế. `D/A` là Độ Bền tối đa/Giáp. `WU/max` là WorkUnits/số thợ tối đa. Không có bảo trì thụ động; đầu vào ghi trong profile chỉ bị tiêu khi công trình vận hành.
>
> `registry_body_sha256=2c19830773eba471b2b27e853665982df0bc20f8f629aa1c56af3d2ac0f03de0` (UTF-8, từ tiêu đề 4.M.1 tới cuối Phụ lục 4.M, gồm LF cuối mỗi hàng).

### 4.M.1. Công trình đơn giản — trần Cấp 3

| Tuyến/Cấp | Hình thể và công năng đích | D/A | Nhiên liệu/đầu vào | Recipe lên Cấp kế | WU/max | Nhãn |
|---|---|---:|---|---|---:|:---:|
| Lò Sưởi 1 | 0,5 m²; sưởi phòng tối đa 30 m²; +15–20°C | 150/5 | 1 Gỗ/20 phút | 12 Đá + 4 Sắt | 0,75/2 | E |
| Lò Sưởi 2 | 0,75 m²; phòng 45 m²; +18–25°C | 400/15 | 1 Gỗ/30 phút hoặc 1 Than/90 phút | 30 Đá + 10 Sắt + 5 Đồng | 1,50/2 | A |
| Lò Sưởi 3 | 1 m²; phòng 65 m²; +20–30°C; giữ nhiệt 10 phút sau tắt | 900/30 | 1 Gỗ/45 phút hoặc 1 Than/150 phút | trần; Lò Sưởi Trung Cấp là mẫu khác | — | A |
| Bếp 1 | 1 m²; 4 phần thức ăn/30 phút | 200/30 | 1 Gỗ/40 phút | 20 Đá + 10 Gỗ + 5 Sắt | 1,00/2 | E |
| Bếp 2 | 1,5 m²; 8 phần/30 phút | 350/40 | 1 Gỗ/50 phút | 40 Đá + 20 Gỗ + 15 Sắt + 5 Đồng | 2,50/3 | A |
| Bếp 3 | 2 m²; 16 phần/30 phút | 650/70 | 1 Gỗ/60 phút hoặc 1 Than/180 phút | trần; Bếp Trung Cấp là mẫu khác | — | A |
| Nơi Trú Nhỏ 1 | nhà kín 12 m²; 2 chỗ ngủ | 500/5 | không | 30 Gỗ + 20 Đá + 10 Sắt | 1,00/2 | A |
| Nơi Trú Nhỏ 2 | nhà kín 18 m²; 3 chỗ; hồi Thể Lực +15% | 900/12 | không | 60 Gỗ + 40 Đá + 20 Sắt + 5 Sắt Tinh Luyện | 2,00/3 | A |
| Nơi Trú Nhỏ 3 | nhà kín 24 m²; 4 chỗ; hồi Thể Lực +30% | 1.600/25 | không | trần; Nơi Trú Trung Cấp là mẫu 40 m²/6 chỗ, hồi 0,5 Sinh Lực/giây | — | A |
| Tường Rào 1 | đoạn 10 m, cao 1,5 m; cọc gỗ | 300/5 | không | 20 Gỗ + 10 Đá + 5 Sắt | 0,75/2 | A |
| Tường Rào 2 | đoạn 10 m, cao 2 m; giằng sắt | 700/15 | không | 30 Gỗ + 20 Đá + 10 Sắt + 5 Sắt Tinh Luyện | 1,50/3 | A |
| Tường Rào 3 | đoạn 10 m, cao 2,5 m; chân gia cố | 1.100/30 | không | trần; Thành Tường Sơ Cấp là Bản Vẽ khác, D/A 1.200/40 mỗi đoạn | — | A |
| Cổng 1 | rộng 3 m, cao 2,5 m; cổng gỗ | 700/10 | không | 30 Gỗ + 20 Đá + 10 Sắt | 1,50/3 | A |
| Cổng 2 | rộng 3 m, cao 3 m; khung sắt | 1.400/30 | không | 60 Gỗ + 40 Đá + 25 Sắt + 5 Đồng | 3,00/4 | A |
| Cổng 3 | rộng 4 m, cao 3,5 m; hai cánh gia cường | 2.500/60 | không | trần; Cổng Sắt Sơ Cấp là Bản Vẽ khác, 3×3×0,1 m, D/A 3.000/100 | — | A |

Recipe dựng mới Cấp 1 lần lượt là: Lò Sưởi `6 Đá`, Bếp `8 Đá + 4 Gỗ`, Nơi Trú Nhỏ `15 Gỗ + 10 Đá + 5 Sắt Tinh Luyện`, mỗi đoạn Tường Rào `10 Gỗ + 5 Đá`, Cổng `20 Gỗ + 10 Đá`. WU dựng Cấp 1 lần lượt `0,30/2`, `0,40/2`, `0,75/2`, `0,50/2`, `1,00/2`. Nâng tại chỗ chỉ trả recipe cạnh; không thu lại recipe dựng cấp cũ.

### 4.M.2. Xưởng và dịch vụ — trần Cấp 5

| Tuyến/Cấp | Hình thể và công năng đích | D/A | Recipe lên Cấp kế | WU/max | Nhãn |
|---|---|---:|---|---:|:---:|
| Xưởng Gỗ 1 | 30 m²; 1 trạm; xử lý 10 Gỗ/giờ | 2.500/10 | 100 Gỗ + 60 Đá + 20 Sắt | 6/4 | E |
| Xưởng Gỗ 2 | 45 m²; 2 trạm; 25 Gỗ/giờ | 4.500/20 | 250 Gỗ + 150 Đá + 80 Sắt + 20 Sắt Tinh Luyện | 16/6 | A |
| Xưởng Gỗ 3 | 70 m²; 4 trạm; 50 Gỗ/giờ | 8.000/40 | 600 Gỗ + 350 Đá + 200 Sắt Tinh Luyện + 50 Đồng + 10 Tinh Thể Nguyên Tố Sơ Cấp | 40/8 | A |
| Xưởng Gỗ 4 | 110 m²; 6 trạm; 90 Gỗ/giờ; hao hụt −10% | 14.000/70 | 1.500 Gỗ + 800 Đá + 500 Sắt Tinh Luyện + 150 Đồng + 30 Tinh Thể Nguyên Tố Trung Cấp | 100/10 | A |
| Xưởng Gỗ 5 | 170 m²; 10 trạm; 150 Gỗ/giờ; hao hụt −15% | 24.000/110 | trần tuyến | — | A |
| Tiệm May 1 | 30 m²; 1 trạm; 2 món/8 giờ | 2.200/8 | 120 Gỗ + 80 Đá + 20 Sắt | 7/4 | E |
| Tiệm May 2 | 45 m²; 2 trạm; 5 món/8 giờ | 4.000/18 | 300 Gỗ + 180 Đá + 80 Sắt + 20 Sắt Tinh Luyện | 18/6 | A |
| Tiệm May 3 | 70 m²; 4 trạm; 10 món/8 giờ | 7.500/35 | 700 Gỗ + 400 Đá + 250 Sắt Tinh Luyện + 60 Đồng + 10 Tinh Thể Nguyên Tố Sơ Cấp | 45/8 | A |
| Tiệm May 4 | 110 m²; 7 trạm; 18 giáp mềm/8 giờ | 13.000/60 | 1.700 Gỗ + 900 Đá + 600 Sắt Tinh Luyện + 180 Đồng + 30 Tinh Thể Nguyên Tố Trung Cấp | 110/10 | A |
| Tiệm May 5 | 170 m²; 12 trạm; 32 món/8 giờ; thời gian −10% | 22.000/100 | trần tuyến | — | A |
| Xưởng Quặng 1 | 50 m²; 20 quặng/giờ; Than và Sắt | 3.500/20 | 300 Gỗ + 180 Đá + 80 Sắt | 20/6 | E |
| Xưởng Quặng 2 | 75 m²; 45 quặng/giờ; mở Đồng | 7.000/40 | 700 Gỗ + 450 Đá + 250 Sắt + 80 Sắt Tinh Luyện | 55/8 | A |
| Xưởng Quặng 3 | 110 m²; 90 quặng/giờ; mở Sắt Tinh Luyện | 14.000/80 | 1.800 Gỗ + 1.000 Đá + 700 Sắt Tinh Luyện + 250 Đồng + 30 Tinh Thể Nguyên Tố Sơ Cấp | 140/10 | A |
| Xưởng Quặng 4 | 170 m²; 160 quặng/giờ; mở Bí Ngân | 28.000/150 | 4.500 Gỗ + 2.500 Đá + 1.800 Sắt Tinh Luyện + 700 Đồng + 100 Tinh Thể Nguyên Tố Trung Cấp | 360/12 | A |
| Xưởng Quặng 5 | 260 m²; 3 dây chuyền, tổng 280 quặng/giờ | 55.000/280 | trần tuyến | — | A |
| Lò Rèn 1 | 30 m²; 1 trạm; 2 lô công cụ hoặc 1 lô vũ khí/8 giờ | 4.000/30 | 400 Gỗ + 250 Đá + 120 Sắt + 50 Sắt Tinh Luyện | 30/6 | E |
| Lò Rèn 2 | 50 m²; 2 trạm; 5 lô công cụ hoặc 2 lô vũ khí/8 giờ | 8.000/60 | 1.000 Gỗ + 600 Đá + 400 Sắt Tinh Luyện + 100 Đồng + 20 Tinh Thể Nguyên Tố Sơ Cấp | 80/8 | A |
| Lò Rèn 3 | 85 m²; 4 trạm; 10/4 lô mỗi 8 giờ | 16.000/110 | 2.500 Gỗ + 1.500 Đá + 1.000 Sắt Tinh Luyện + 400 Đồng + 80 Tinh Thể Nguyên Tố Trung Cấp | 220/10 | A |
| Lò Rèn 4 | 140 m²; 7 trạm; 20/8 lô; mở Bí Ngân | 32.000/200 | 6.000 Gỗ + 3.500 Đá + 2.500 Sắt Tinh Luyện + 1.000 Đồng + 250 Tinh Thể Nguyên Tố Trung Cấp | 600/12 | A |
| Lò Rèn 5 | 220 m²; 12 trạm; 36/15 lô; thời gian −10% | 65.000/360 | trần tuyến | — | A |
| Phòng Y Tế 1 | 25 m²; 2 giường, xử lý 1 ca; hồi phục +25% | 2.000/10 | 90 Gỗ + 60 Đá + 20 Sắt + 10 Sắt Tinh Luyện | 5/4 | A |
| Phòng Y Tế 2 | 40 m²; 4 giường, 2 ca; +40% | 4.000/20 | 180 Gỗ + 120 Đá + 50 Sắt + 20 Sắt Tinh Luyện + 5 Tinh Thể Nguyên Tố Sơ Cấp | 12/6 | A |
| Phòng Y Tế 3 | 60 m²; 8 giường, 3 ca; +60%; 2 giường cách ly | 8.000/40 | 360 Gỗ + 240 Đá + 120 Sắt Tinh Luyện + 50 Đồng + 10 Tinh Thể Nguyên Tố Sơ Cấp | 30/8 | A |
| Phòng Y Tế 4 | 90 m²; 12 giường, 4 ca; +80%; 4 giường cách ly | 16.000/75 | 720 Gỗ + 480 Đá + 300 Sắt Tinh Luyện + 100 Đồng + 20 Tinh Thể Nguyên Tố Trung Cấp | 70/10 | A |
| Phòng Y Tế 5 | 140 m²; 20 giường, 6 ca; +100%; 8 giường cách ly | 32.000/140 | trần tuyến | — | A |

Recipe/WU dựng mới Cấp 1: Xưởng Gỗ `50 Gỗ + 30 Đá`, `4/4`; Tiệm May `60 Gỗ + 40 Đá`, `5/4`; Xưởng Quặng `150 Gỗ + 80 Đá`, `10/4`; Lò Rèn `200 Gỗ + 100 Đá + 20 Sắt`, `14/4`; Phòng Y Tế `45 Gỗ + 30 Đá + 5 Sắt Tinh Luyện`, `4/4`. Profile đích luôn thắng phép nhân công suất chung; narrator không được lấy “mỗi cấp ×2” để bịa hàng.

### 4.M.3. Trần, phân nhánh và hiển thị

- Lò Sưởi, Bếp, Nơi Trú Nhỏ, Tường Rào và Cổng dừng ở Cấp 3; phiên bản trung cấp/đá/sắt là mẫu hoặc Bản Vẽ mới, không phải Cấp 4 ẩn.
- Xưởng Gỗ, Tiệm May, Xưởng Quặng, Lò Rèn và Phòng Y Tế dừng ở Cấp 5. Muốn vượt trần phải học mẫu hậu kỳ có identity riêng.
- Nhà Nông Phu dùng registry riêng và dừng Cấp 10. Lửa Sinh Tồn/Nhà Lãnh Chúa dừng Cấp 30.
- Card ở Cấp `L` chỉ hiện `L→L+1`; nhưng hàng đích phải hiện đủ hình thể, diện tích, trạm/giường/chỗ, công suất, D/A, nhiên liệu và hiệu suất vừa thay đổi. Ở trần, card trả đúng mẫu kế tiếp cần học nếu người chơi đã biết tên; nếu chưa biết, chỉ trả `Đã đạt trần tuyến hiện tại`.
- Tường Rào/Cổng dựng sẵn và Bản Vẽ tường/cổng học được là các identity khác nhau. Không dùng một instance đi xuyên hai tuyến, không nhận lại thành tựu xây lần đầu và không tiêu đồng thời registry lẫn Blueprint.

## Phụ lục 4.N — Payload actor, quest item và reward cố định `QUEST-PAYLOAD-LL01-1.0`

> **Nhãn nguồn:** hai vua `T7/Phẩm Lãnh chúa/Hero`, hai sinh mệnh bị chôn `T5/Phẩm Thần thoại` và chiến tranh Sora–Trevil là `USER_LOCKED/CANON_WORLD`. Tên, chức năng cá thể, item và reward mà `<>` không nêu là `SOURCE_ANALOGY/CAMPAIGN_FIXED`. Registry này không pre-grant hero/item; nó materialize những object tồn tại trước T0 và payload được phép commit khi đúng quest resolution. Không có bảng loot ngẫu nhiên trong quest reward.

### 4.N.1. Mười ba actor/key life cố định

<!-- LL01-HEROES-BEGIN -->
| `actor_id` | Tên, nguồn gốc và trạng thái T0 | Bậc/Phẩm/Hero | Vai trò và agency | Fixed site | Route tuyển/tiếp cận |
|---|---|---|---|---|---|
| `HERO-LL01-01` | **Aren Var**, nhân loại Sora; đại úy chiến kỳ; corpse bảo tồn | `T2 · Tinh anh · Hero` | hộ vệ/thống soái; khi Tử Phục vẫn `AgencyFlag=1`, ký ức mảnh | `SITE-LL01-010` | Q01 mở quyền xử lý xác; Tử Phục cần `T_LiLan≥2`, không tự gia nhập |
| `HERO-LL01-02` | **Rhaz-Khar**, thú nhân Trevil; thủ lĩnh dò đường; corpse bảo tồn | `T2 · Tinh anh · Hero` | trinh sát/đấu sĩ; agency + oath fragment | `SITE-LL01-011` | Q02; Tử Phục cần `T_LiLan≥2` hoặc an táng/trao trả |
| `HERO-LL01-03` | **Maela Renn**, người Varen; quản bể nước Xóm Tùng Tro; còn sống, mắc kẹt | `T1 · Cựu binh · Hero` | thủy công/y–hỗ trợ; agency đầy đủ | `SITE-LL01-019` | cứu giúp Q03 chỉ mở đàm phán phục vụ; có quyền từ chối/rời đi |
| `HERO-LL01-04` | **Ilyen Voss**, người Varen; trị liệu viên Chuông Trắng; còn sống | `T2 · Tinh anh · Hero` | y–hỗ trợ/tinh thần; giới hạn giáo luật | `SITE-LL01-013` rồi `048` | Q04 mở contract 30 ngày; vi phạm người bệnh gây grievance |
| `HERO-LL01-05` | **Torven Reed**, người Varen; trinh sát đoàn xe; còn sống | `T2 · Cựu binh · Hero` | trinh sát/sứ giả; trung thành theo hợp đồng | `SITE-LL01-052` tại T0; đi `SITE-049` lúc `T0+120h` | Q08 mở contract 21 ngày; cần phần loot/lương đã niêm |
| `HERO-LL01-06` | **Orun Tal**, nhân loại Sora; thợ cả vòm đá; corpse bảo tồn | `T4 · Đầu lĩnh · Hero` | kiến trúc chiến địa/kỹ sư tiền công nghiệp; không có máy hiện đại | `SITE-LL01-022` | Q10; Tử Phục cần `T_LiLan≥4`; burial branch giữ di sản |
| `HERO-LL01-07` | **Sakh-Ruun**, thú nhân Trevil; người giữ Cốt Đường; corpse bảo tồn | `T4 · Đầu lĩnh · Hero` | pháp sư nghi lễ/trinh sát tử dấu; agency + tộc lệ | `SITE-LL01-023` | Q09; Tử Phục cần `T_LiLan≥4`; không tự tiết lộ toàn lịch sử |
| `HERO-LL01-08` | **Cassa Vey**, người Varen; học giả pháp lý Bạch Chung; còn sống | `T3 · Tinh anh · Hero` | sứ giả/học giả; ưu tiên chứng cứ và quyền người chết | `SITE-LL01-047` tại T0; rời lúc `T0+288h`, tới `SITE-020` sớm nhất `+336h` | Q11 mở contract theo vụ việc; không khóa trung thành vĩnh viễn |
| `HERO-LL01-09` | **Korv Ash-Tusk**, thú nhân bản địa; thủ lĩnh nhóm hậu duệ Trevil; còn sống | `T4 · Đầu lĩnh · Hero` | đấu sĩ/thống soái; giữ quyền tộc đối với mộ | `SITE-LL01-021` tại T0; tới `SITE-018` lúc `T0+240h` | Q12 mở đình chiến + thương lượng; không bị quest cưỡng chế thuần phục |
| `HERO-LL01-10` | **Aurel Sar**, quốc vương Sora; corpse | `T7 · Lãnh chúa · Hero` | thống soái/luật chiến kỳ; identity anchor hư hại | `SITE-LL01-028` phía tây | Q14 chỉ mở access; Tử Phục cần `T_LiLan≥7` và corpse gate File 06 |
| `HERO-LL01-11` | **Khorr-Vaal**, quốc vương Trevil; corpse | `T7 · Lãnh chúa · Hero` | thống soái/luật bầy đàn; identity anchor hư hại | `SITE-LL01-028` phía đông | Q14 chỉ mở access; Tử Phục cần `T_LiLan≥7` |
| `HERO-LL01-12` | **Elyra Sol**, nhân loại Sora; sinh mệnh sống trong stasis | `T5 · Thần thoại · Hero` | pháp sư/hộ vệ; agency tuyệt đối, không phải loot | `SITE-LL01-026` | Q15 mở đối thoại/compact; không thể Tử Phục khi còn sống |
| `HERO-LL01-13` | **Ur-Khaz Trăng Sừng**, thú nhân Trevil; sinh mệnh sống trong stasis | `T5 · Thần thoại · Hero` | đấu sĩ/pháp sư tộc; agency tuyệt đối | `SITE-LL01-027` | Q16 mở đối thoại/compact; không thể Tử Phục khi còn sống |
<!-- LL01-HEROES-END -->

`actor_registry_sha256=01789b61082cb35a7638f2287ce23f4cbce20696934fa4daba25724edbe96c22`. Những tên trên không được trình bày là tên từ `<>`; chúng là tên campaign cố định đã loại suy để không để actor slot rỗng. Mọi actor bắt đầu `STATE_UNOBSERVED` trừ khi trực tiếp trong tầm biết; corpse, stasis và người sống đều có một ID duy nhất, có thể chết/mất/di chuyển qua event nhưng không respawn.

### 4.N.1A. Actor/group hỗ trợ quest cố định

<!-- LL01-SUPPORT-BEGIN -->
| ID | Thành phần và state T0 | Vị trí/lịch cố định | Chức năng quest; không thay thế |
|---|---|---|---|
| `NPC-LL01-HAMLET-01` | **Hedra Moss**, trưởng Xóm Tùng Tro; người thường `T1 · Cựu binh`, còn sống | `SITE-LL01-043` | issuer Q03; nếu chết, hội đồng xóm giữ claim nhưng không sinh “trưởng xóm mới” để phát lại reward |
| `GROUP-LL01-SHRINE-01` | bệnh nhân **Joren Hale** và **Perra Lin**, `T1 · Thường`, bị hạ thân nhiệt; 5 tử vật canh miếu `T1 · Thường`, site-bound | `SITE-LL01-013`; trạng thái chạy từ T0 tới deadline Q04 | mục tiêu/đối thủ Q04; năm tử vật không thuộc population wandering và không respawn |
| `CARAVAN-LL01-01` | Torven; xa phu **Neral Fenn**; hộ vệ **Oris Dall**, **Vei Mar**; 9 thú kéo lông dài; 18 bao ngũ cốc, 6 đơn vị muối, 240 L nước, `QI-LL01-08` | T0 ở `SITE-LL01-052`; rời `+120h`, tới bridge dự kiến `+122h` | đoàn Q08; inventory/casualty thật quyết định condition, không tạo đoàn thay |
| `GROUP-LL01-BRIDGE-RAIDERS-01` | 7 người: 1 đầu lĩnh `T2 · Cựu binh`, 6 chiến binh `T1 · Thường`; 2 cung, 3 lao, 2 khiên | T0 tại camp `(35,200;-14,800;3 m)`; phục kích `SITE-049` lúc `+122h` nếu không bị event trước đó chặn | đối thủ Q08 hữu hạn; chết/bắt/đổi ý trước giờ làm offscreen state đổi, không spawn bandit mới |
| `GROUP-LL01-KORV-01` | Korv + 11 thú nhân hậu duệ Trevil: 2 Cựu binh, 9 Thường; 4 cung, 5 lao, 2 khiên | T0 ở `SITE-LL01-021`; rời `+216h`, đến `SITE-018` `+240h` | phe Q12; mọi casualty/claim giữ ledger thật |
| `PANEL-LL01-HEARING-01` | pháp quan **Mara Deyn** `T2 · Cựu binh`, hai thư lại và bốn vệ binh | `SITE-LL01-046`; hearing slot mỗi ngày `10:00–14:00` từ `T0+336h` | cơ quan Q11; chết/đổi quyền tạo legal consequence, không tự thay bằng panel vô danh |
<!-- LL01-SUPPORT-END -->

`support_registry_sha256=3e35524f4a50f7c47dfdebe6cdd007cdb48976b66a1dc678492d54db0509312a`. Tất cả tên/support row là `SOURCE_ANALOGY/CAMPAIGN_FIXED`; người chơi chưa biết họ ở T0. Mỗi cá thể/group có ID, số lượng, vị trí và lịch; narrator không được tạo thêm người bệnh, thú kéo, cướp hoặc đoàn hậu duệ để chỉnh độ khó.

### 4.N.2. Quest item và reward bundle

Các item `QI-*` là vật dẫn nhiệm vụ, không tự thuộc Inventory Lí Lan. Mỗi item có một instance duy nhất tại fixed site của File 05, `salvage_output=[]`, `convert_output=[]` trừ khi hàng nói khác; phá/mất item đi theo failure route chứ không tạo bản sao. `RW-*` là payload commit; phần `HERO_CONTRACT_OFFER` chỉ mở một proposal có consent, không chuyển quyền sở hữu actor.

<!-- LL01-PAYLOADS-BEGIN -->
| Quest | Quest item/object tồn tại trước T0 | Reward bundle cố định nếu đạt completion route | Effect/giới hạn chính xác |
|---|---|---|---|
| `QUEST-LL01-01` | `QI-LL01-01` — Vành Ghim Chiến Kỳ Sora, Phẩm D | `RW-LL01-01`: access corpse `HERO-LL01-01`; `IT-RW-LL01-01` Đai Chiến Kỳ Sora, Phẩm D | hero route vẫn cần Tử Phục/consent branch; đai cho một người mang cờ dùng 1 lần/encounter để hồi 10 Morale cho tối đa 12 đồng minh trong 10 m, không stack |
| `QUEST-LL01-02` | `QI-LL01-02` — Vòng Thệ Sừng Đá, Phẩm D | `RW-LL01-02`: access corpse `HERO-LL01-02`; `IT-RW-LL01-02` Dây Dẫn Lộ Trevil, Phẩm D | khi scout đi trên route đã khảo sát, navigation error ×0,80; không phát hiện site/rương chưa đủ sensor và không đổi loyalty |
| `QUEST-LL01-03` | `QI-LL01-03` — Chìa Cửa Đá Bể Ngầm, Phẩm F | `RW-LL01-03`: `HERO_CONTRACT_OFFER-03`; quyền lấy tối đa 2.000 L/ngày từ bể theo thỏa thuận; 24 Krona Bạch Chung | nước vẫn cần vận chuyển/lọc; contract hero có 14 ngày thử việc, lương 3 Krona/ngày, quyền rời với báo trước 24 giờ |
| `QUEST-LL01-04` | `QI-LL01-04` — Chày Chuông Trắng, Phẩm E | `RW-LL01-04`: `HERO_CONTRACT_OFFER-04`; `IT-RW-LL01-04` Chuông Cứu Thương, Phẩm E; 18 Krona | 2 charge/ngày lúc 07:00; một charge cho healer hợp lệ +20% thời gian bleedout của một mục tiêu đã stabilize; không hồi HP, không stack |
| `QUEST-LL01-05` | `QI-LL01-05A/B` — hai nửa Ấn Chỉ Huy Sora, Phẩm D | `RW-LL01-05`: `DOC-RW-LL01-05` Thế Khiên Sora, Phẩm D; map overlay ba site Sora | tối đa 20 unit cầm khiên kề đội hình nhận Cohesion ×1,10 và Movement ×0,90; overlay chỉ hiện `SITE-020/022/026` khi quest đã chứng minh, không hiện chest/occupant |
| `QUEST-LL01-06` | `QI-LL01-06` — Bản Đồ Xương Bảy Lửa, Phẩm D | `RW-LL01-06`: `DOC-RW-LL01-06` Bước Săn Bảy Lửa, Phẩm D; map overlay ba site Trevil | tối đa 12 scout trên route đã khảo sát nhận Movement ×1,10 và Detection ×1,10, Defense ×0,95 khi phân tán; overlay `SITE-021/023/027` |
| `QUEST-LL01-07` | `QI-LL01-07A/B/C` — Chìa Băng Đen Trái/Giữa/Phải, Phẩm C | `RW-LL01-07`: `IT-RW-LL01-07` Hàn Tủy Châu, Phẩm C; 120 Krona | người đeo nhận `ColdLoadGain×0,85`; unique, không stack, không tạo vùng nhiệt; Rương quest không roll |
| `QUEST-LL01-08` | `QI-LL01-08` — Sổ Nợ Đoàn Xe Krona, Phẩm F | `RW-LL01-08`: `HERO_CONTRACT_OFFER-05`; mở `ROUTE-TRADE-LL01-A`; 60 Krona | Torven: 21 ngày, lương 4 Krona/ngày + 5% loot chuyến do anh dẫn; route không teleport hàng và có caravan schedule |
| `QUEST-LL01-09` | `QI-LL01-09` — Phiến Đếm Hài Cốt, Phẩm B | `RW-LL01-09`: access `HERO-LL01-07`; `IT-RW-LL01-09` Phiến Kiểm Tử Dấu, Phẩm B | corpse survey time ×0,80 khi user có kỹ năng tương thích; không tiết lộ ký ức, Phẩm hoặc trap nếu phép kiểm tương ứng thất bại |
| `QUEST-LL01-10` | `QI-LL01-10` — Dây Dọi Vòm Đá, Phẩm C | `RW-LL01-10`: access `HERO-LL01-06`; `IT-RW-LL01-10` Bộ Dọi Orun, Phẩm C | structural survey confidence band hẹp 20%; không tạo blueprint, vật liệu, WU hoặc repair miễn phí |
| `QUEST-LL01-11` | `QI-LL01-11` — Bảng Gia Phả Đồng Trắng, Phẩm C | `RW-LL01-11`: `HERO_CONTRACT_OFFER-08`; giấy phép archive Bạch Chung; `REP_POLITY_LL01 +12` | Cassa phục vụ theo từng vụ 30 ngày, lương 5 Krona/ngày; REP delta chỉ commit một lần và không buộc polity tin mọi claim |
| `QUEST-LL01-12` | `QI-LL01-12` — Nanh Nợ Tro, Phẩm B | `RW-LL01-12`: đình chiến với nhóm Korv 30 ngày; `HERO_CONTRACT_OFFER-09`; `IT-RW-LL01-12` Thẻ Qua Mộ, Phẩm B | thẻ cho một party tối đa 12 người qua `SITE-018/021` nếu không rút vũ khí/phá mộ; không mind-control, vi phạm hủy đình chiến |
| `QUEST-LL01-13` | `QI-LL01-13A/B/C` — ba Chứng Phiến Chiến Tranh, Phẩm A | `RW-LL01-13`: `IT-RW-LL01-13` Hồ Sơ Song Chiến, Phẩm A; mở Q14–Q16 | item chỉ lưu ba evidence chain đã xác thực; không tăng stat và không tự khẳng định bên nào chính nghĩa |
| `QUEST-LL01-14` | `QI-LL01-14A/B` — hai Mảnh Vương Miện Gãy, Phẩm A | `RW-LL01-14`: `IT-RW-LL01-14` Song Vương Chứng Ấn, Phẩm A; access hai king corpse | chứng ấn mở gate ở `SITE-028`; không tự cho quyền sở hữu, không giảm yêu cầu T7/Tử Phục và không hồi ký ức đầy đủ |
| `QUEST-LL01-15` | `QI-LL01-15` — Ấn Thái Dương Sora, Phẩm S | `RW-LL01-15`: `MYTHIC_COMPACT_OFFER-12`; `IT-RW-LL01-15` Màn Nhật Quang, Phẩm S | compact do Elyra tự quyết; relic cho người đeo `DeathResistance×1,20` nhưng `DarkSkillCost×1,10`, không miễn chết |
| `QUEST-LL01-16` | `QI-LL01-16` — Ấn Nguyệt Sừng Trevil, Phẩm S | `RW-LL01-16`: `MYTHIC_COMPACT_OFFER-13`; `IT-RW-LL01-16` Sừng Nghe Trăng, Phẩm S | compact do Ur-Khaz tự quyết; relic cho `Detection×1,20` trong đêm và `HolyResistance×0,90`, không toàn tri |
| `QUEST-LL01-17` | `QI-LL01-17` — Chìa Song Phong Ấn, Phẩm SS | `RW-LL01-17`: quyền mở `SITE-029`; `IT-RW-LL01-17` Khóa Song Sinh, Phẩm SS | mở đúng một gate final và giữ audit của hai compact; không phải vũ khí, không triệu hồi hai Mythic life |
| `QUEST-LL01-18` | `QI-LL01-18` — Chốt Tro Cuối, Phẩm SSS | `RW-LL01-18`: `IT-RW-LL01-18` Ấn Tắt Triều, Phẩm SSS; world delta `DEATH_TIDE_SEALED` | item one-use chỉ đóng Tâm Triều LL01 khi đủ năm seal condition; tiêu item, không xóa undead đã tồn tại, không phá vòng lặp toàn thế giới |
<!-- LL01-PAYLOADS-END -->

`payload_registry_sha256=cfb4427607b8c18fa2cf2dd3d3d9aea59041332ae3510170fb8419432c990a52`. Ngoài các dòng exact trên, XP hoàn tất gọi `QUEST-XP-1.0` với difficulty/scope đã khóa ở File 05; đó là phép chia contribution, không phải reward roll. Không thêm “một rương ngẫu nhiên”, hero ngẫu nhiên, item thay thế hoặc vật liệu bù. Nếu nhánh resolution không đạt reward condition, engine commit đúng hậu quả của quest và không downscale payload thành quà an ủi.

Quest-item instance set có đúng 24 ID: `QI-LL01-01`, `02`, `03`, `04`, `05A`, `05B`, `06`, `07A`, `07B`, `07C`, `08`, `09`, `10`, `11`, `12`, `13A`, `13B`, `13C`, `14A`, `14B`, `15`, `16`, `17`, `18`. Ký hiệu gộp trong bảng không tạo một item tổng; từng suffix là một instance độc lập, nằm đúng site ở File 05 và không có bản sao dự phòng.

### 4.N.3. Integrity và quyền sở hữu

1. Đúng 13 `HERO-LL01-*`, 6 support actor/group row, 24 `QI-*`, 18 quest và 18 `RW-*`; mọi ID duy nhất.
2. Mọi quest item/reward mang form, Phẩm, effect, cap và provenance; không ô rỗng.
3. `SOURCE_LOCKED` chỉ áp số Sora–Trevil đã biết; tên/effect loại suy không tự nâng thành lời nguồn.
4. Hero sống có `AgencyFlag=1`; quest completion không khóa loyalty. Corpse hero chỉ thành unit khi Lí Lan thực hiện Tử Phục hợp lệ hoặc một route khác có contract.
5. Vật quest/reward không được dùng để dựng bunker, máy, súng hoặc công nghệ ngoài `ERA-LL01-PREINDUSTRIAL-HIGH-MAGIC-1.0`.
6. Replay cùng `quest_resolution_event_id` trả receipt cũ; không tạo item/contract/reputation lần hai.
