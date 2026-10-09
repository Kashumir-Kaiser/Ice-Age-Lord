# LORD DND — RELEASE LINEAGE & CONTENT-HASH MANIFEST

> **Manifest version `RELEASE-LINEAGE-LL01-1.3.0` — 2026-08-29.** Manifest này phân giải các file campaign bằng danh tính nội dung, chặn semantic-version collision, ghi rõ ancestry của mọi merge/repair, giữ 1.2.0 làm parent và khóa generalized spatial-search runtime mà không làm mất Appendix 3.K, 192 Rương Báu, 15 Hero–hang ổ, event/quest/exclusive-loot, XP mirror hoặc zombie 1 WU/giờ. Đây là metadata vận hành; không phải lore hay state campaign.

## 1. Canonical hash và khóa phân giải

- `sha256` băm **toàn bộ byte của artifact** đúng như lưu: UTF-8, LF, không BOM; không chuẩn hóa khoảng trắng, heading, bảng hoặc filename trước khi băm.
- Khóa duy nhất là `document_id + semantic_version + release_id + sha256`. `document_id + semantic_version` đơn độc chỉ được dùng khi manifest có đúng một payload và payload ấy là `ACTIVE`.
- Hai dòng cùng `document_id + semantic_version` nhưng khác hash tạo `AMBIGUOUS_SEMVER`. Resolver commit 0 delta; không chọn theo ngày, modified time, số thứ tự tên file, attachment order hoặc kích thước.
- Dòng `PARENT_ONLY`, `PARTIAL_DELTA_ONLY` và `SUPERSEDED` chỉ dùng kiểm toán ancestry; runtime chỉ nạp dòng `ACTIVE` thuộc `ACTIVE_CORESET-LL01-2026-08-29.2`.
- Hash lệch trả `RELEASE_HASH_MISMATCH`; thiếu parent trả `MISSING_LINEAGE_PARENT`; capability gate thiếu trả `RELEASE_CONTENT_REGRESSION`. Cả ba đều cấm fallback sang “bản mới nhất”.

## 2. Collision ledger và merge ancestry

<!-- RELEASE-ROWS-BEGIN -->
| `document_id` | Semver | `release_id` | Ngày | SHA-256 toàn file | Byte | Dòng | Trạng thái | Parent / nội dung phân biệt |
|---|---:|---|---|---|---:|---:|---|---|
| `LORD-DND-01` | `2.6.0` | `FILE01-2.6.0-A-20260826` | 2026-08-26 | `adbba2bc02155cd2d576750f4cf9d1af08962f1f0dd85fbc53c9ba85c08d7105` | 171124 | 1645 | `PARENT_ONLY` | Nhánh A: khóa `WORLD-PACKAGE-LL01-1.0`, quest/site/hero/item/reward tồn tại trước T0. |
| `LORD-DND-01` | `2.6.0` | `FILE01-2.6.0-B-20260827` | 2026-08-27 | `34444c21aa67c4425bed739209136eb16af728b3ebeee7dfd085a0319d6e4a07` | 193951 | 1751 | `PARENT_ONLY` | Nhánh B: `CANON-EVENT-LEDGER-4.0`, fixed rank/event/shop reward, event-exclusive lifecycle. |
| `LORD-DND-01` | `2.7.0` | `FILE01-2.7.0-MERGE.1` | 2026-08-27 | `9c4f758b2fb8f93eaccee539f2ec6626eb32684ce8fe95aa734612f00b6d2730` | 195230 | 1756 | `ACTIVE` | Merge byte-preserving nhánh B + hai contract LL01 của nhánh A; parents là hai dòng `2.6.0` trên. |
| `LORD-DND-03` | `1.6.3` | `FILE03-1.6.3-EVENT-DELTA` | 2026-08-27 | `1dae834931dcde290076d183d0b08bef97be32628c1eba72f69fa7130f541d95` | 85069 | 1188 | `PARTIAL_DELTA_ONLY` | Có Control/event-scope delta nhưng thiếu toàn bộ ancestry 1.7/Phụ lục 3.K; tuyệt đối không dùng làm base hoàn chỉnh. |
| `LORD-DND-03` | `1.7.0` | `FILE03-1.7.0-WORLD-PACKAGE` | 2026-08-26 | `f27ff50122c64c6438f6fa270426466fad1bac9a3da45112ea1790a010ae517e` | 112742 | 1401 | `PARENT_ONLY` | Parent hoàn chỉnh: 3.K, fixed terrain/sites/anchors, 41 cache, 192 rương, `CHEST-SEARCH-2.1-FIXED`. |
| `LORD-DND-03` | `1.8.0` | `FILE03-1.8.0-MERGE.1` | 2026-08-27 | `ce48841a4afaf565da5d834f2a97bc580080ff81a30d62cdcd6822e06aa5d241` | 114239 | 1410 | `PARENT_ONLY` | Parent 1.7.0 hoàn chỉnh + Control/event-scope delta 1.6.3; parent trực tiếp của 1.9.0. |
| `LORD-DND-03` | `1.9.0` | `FILE03-1.9.0-HERO-LAIR-PACK.1` | 2026-08-29 | `2fdffc94b96abc2738ed1819fd911a197e1362a661c20b17c78693df70c7c3d8` | 144021 | 1642 | `PARENT_ONLY` | Giữ toàn bộ 1.8.0/3.K + `HERO-LAIR-SOCIETY-1.0` và extension `LL01-HERO-LAIR-PACK-1.0` gồm 15 lair/15 Hero/693 unit ID. |
| `LORD-DND-03` | `1.10.0` | `FILE03-1.10.0-SPATIAL-SWEEP.1` | 2026-08-29 | `1791ac670ef8cc3319bdec54733e8d8eb542dda19da47d1e6ce720b7fc36e632` | 150725 | 1754 | `ACTIVE` | Parent 1.9.0 nguyên vẹn + `SPATIAL-SWEEP-GEOMETRY-1.0`, lane union/history, target worldtube và hierarchical spatial index. |
| `LORD-DND-LANGUAGE-STANDARDS` | `1.9.0` | `LANG-1.9.0-A-SPEED-ACHIEVEMENT` | 2026-08-25 | `585565b65ffc3523c9935b7d6015e2ff45468ef0c32b224c5d0b8599ef5db1ca` | 54525 | 571 | `PARENT_ONLY` | Nhánh A: deadline tiền T0, critical path, instance-bound reward, post-claim-only display. |
| `LORD-DND-LANGUAGE-STANDARDS` | `1.9.0` | `LANG-1.9.0-B-OPERATION-CAREER` | 2026-08-25 | `6b2db58cd2806d8e5b32d1307e6badbfe9a5f974675d4cec7f205ae3aba23a39` | 55788 | 573 | `PARENT_ONLY` | Nhánh B: operational first-build reward và career-compatible achievement skill book. |
| `LORD-DND-LANGUAGE-STANDARDS` | `2.0.0` | `LANG-2.0.0-EVENT-PRESENTATION` | 2026-08-27 | `eb49d9c0897921a788897ca072c94ac60e52c4b9f0ea88c02aaa2708ac5b600e` | 57610 | 579 | `SUPERSEDED` | Kế thừa nhánh B + event/chest/rank presentation; chưa giữ đoạn speed-achievement của nhánh A. |
| `LORD-DND-LANGUAGE-STANDARDS` | `2.1.0` | `LANG-2.1.0-MERGE.1` | 2026-08-27 | `890157ea1459f0f08a2094168d9be3fa5db977619f47af492a10c08539fa93a9` | 58473 | 583 | `PARENT_ONLY` | Merge nhánh A vào toàn bộ 2.0.0; giữ đủ cả hai v1.9 và event/chest/rank rules. |
| `LORD-DND-LANGUAGE-STANDARDS` | `2.2.0` | `LANG-2.2.0-OFFICIAL-RUNTIME.1` | 2026-08-28 | `a7cc95930678479ed783f45623defadd31f83463095fcb4fd20ebec349413b4a` | 64390 | 646 | `ACTIVE` | Parent 2.1.0 nguyên vẹn + mode thích ứng, causal delta, exactness, diagnostics có scope và renderer isolation. |

| `document_id` | Semver | `release_id` | SHA-256 toàn file | Byte | Dòng | Trạng thái |
|---|---:|---|---|---:|---:|---|
| `LORD-DND-CHARACTER-LAW` | `1.3.0` | `CHARLAW-1.3.0` | `4d872ecefdf6fbde03039e077b5cab107716e09a5a321eb73e14e8f192d31735` | 30659 | 326 | `ACTIVE` |
| `LORD-DND-02` | `1.14.0` | `FILE02-1.14.0` | `4b44a7cc041138b2c2ba0e5f1b9ef4e772e7ec5a37fe8f3b2472f41767d241bc` | 595932 | 2816 | `ACTIVE` |
| `LORD-DND-04` | `2.9.0` | `FILE04-2.9.0` | `bfbe635684d6b446e519107c53c9ae9815d5cdc76b23d0557bbe48f175721779` | 229697 | 2072 | `PARENT_ONLY` |
| `LORD-DND-04` | `3.0.0` | `FILE04-3.0.0-HERO-SOCIETY-BINDING.1` | `53a3af62e5b3cbc44dde637e333e081f5f3365ae8f32966f6e7ec445cbd91ed7` | 236828 | 2130 | `PARENT_ONLY` |
| `LORD-DND-04` | `3.1.0` | `FILE04-3.1.0-SEARCH-TEAM-CAPABILITY.1` | `6bc5c58f58d44e256a6ae4a386b4ea06849680eea04931a46c25d4ec98248718` | 239912 | 2177 | `ACTIVE` |
| `LORD-DND-05` | `2.9.0` | `FILE05-2.9.0-RELEASE-GATE.1` | `fbd41b09099aa6a754683b81d2ebb42b21cd1370ec1235d12af35ecfa816a00f` | 187804 | 2148 | `PARENT_ONLY` |
| `LORD-DND-05` | `3.0.0` | `FILE05-3.0.0-OFFICIAL-RUNTIME.1` | `b1a5b90313d6f1375e56cbdf5bf4bd0c576c8a2aa40ce988d8b342725055e5aa` | 208385 | 2364 | `PARENT_ONLY` |
| `LORD-DND-05` | `3.1.0` | `FILE05-3.1.0-HERO-LAIR-RUNTIME.1` | `b062b3c9a0d3f0920779d7fb389f5a5a703dc847d0858ca7d6b3bdd88a9182f3` | 214024 | 2414 | `PARENT_ONLY` |
| `LORD-DND-05` | `3.2.0` | `FILE05-3.2.0-SPATIAL-SEARCH-RUNTIME.1` | `adc9f670ce37688eb69d40d09f776bcf08335d10e830dbd76a6173f2b2375248` | 225799 | 2524 | `ACTIVE` |
| `LORD-DND-06` | `2.2.0` | `FILE06-2.2.0-DEPENDENCY-GATE.1` | `8a35c3795f6d396a5599c4f51c9a83e8d079b76dcce434cbd1a896e64baa6ffb` | 132839 | 1872 | `PARENT_ONLY` |
| `LORD-DND-06` | `2.3.0` | `FILE06-2.3.0-RUNTIME-BINDING.1` | `a8a8f704f5b00ecbc58100af5f7f85f45e482396c4e59eab72779e9f292bccd7` | 134518 | 1884 | `PARENT_ONLY` |
| `LORD-DND-06` | `2.4.0` | `FILE06-2.4.0-HERO-LAIR-BINDING.1` | `0b8660cb766e3117b15ba697a1f9277d93bc1ba20283fec0e1b3a4499d12958e` | 135052 | 1889 | `PARENT_ONLY` |
| `LORD-DND-06` | `2.5.0` | `FILE06-2.5.0-SPATIAL-SEARCH-BINDING.1` | `a383b9b01aae2ac6f54743555a2545e89505ad91c3271f9f711a300bf3f7af20` | 137260 | 1907 | `ACTIVE` |
| `LORD-DND-07` | `1.3.0` | `FILE07-1.3.0` | `b4734c66751d197134b334450bf01c0fbc5b53f0c033a10392701f7f075992e4` | 53124 | 710 | `ACTIVE` |
| `LORD-DND-CHECKLIST` | `3.5.0` | `CHECKLIST-3.5.0-RELEASE-GATE.1` | `027b28a461edd546b37f5a0792a1a7d586f1a79291d608227693f7e6622894d6` | 53698 | 278 | `PARENT_ONLY` |
| `LORD-DND-CHECKLIST` | `3.6.0` | `CHECKLIST-3.6.0-OFFICIAL-RUNTIME.1` | `4502a1f1241a0083f5f56a75b4d6e5ac43713d3df64121aed7560ce877ab8506` | 59657 | 308 | `PARENT_ONLY` |
| `LORD-DND-CHECKLIST` | `3.7.0` | `CHECKLIST-3.7.0-HERO-LAIR-GATE.1` | `b85a31a5ea87e18f84b29496b2d5818d3acf0e47f87b80e82d78d2a024af1b95` | 63357 | 326 | `PARENT_ONLY` |
| `LORD-DND-CHECKLIST` | `3.8.0` | `CHECKLIST-3.8.0-SPATIAL-SEARCH-GATE.1` | `15556ae13b389776d5f8b128f402487c0566c21539cbe0785f2ba0dc66cfabd8` | 68417 | 349 | `ACTIVE` |
<!-- RELEASE-ROWS-END -->

`release_rows_sha256`: `df7587f295797e3117a8bdb26796d3a50ad22c38c714b61be3a94963d4fd5b82`

Hash trên băm đúng mọi byte **giữa** hai marker `RELEASE-ROWS-BEGIN/END`, không gồm chính marker. Nó đóng tập collision ledger và active core set nhưng không tự băm dòng hash này.

## 3. Capability gates bắt buộc

1. `FILE01-2.7.0-MERGE.1` phải chứa đồng thời `WORLD-PACKAGE-LL01-1.0`, `QUEST-REGISTRY-LL01-1.0`, `CANON-EVENT-LEDGER-4.0`, fixed rank payload và `EVENT_EXCLUSIVE` lifecycle.
2. `FILE03-1.10.0-SPATIAL-SWEEP.1` phải giữ đúng 38 site row, 10 P0 anchor, 41 cache, 192 chest instance, grade total `139/37/11/4/1`, bốn internal parent hash, `CHEST-SEARCH-2.1-FIXED`, đầy đủ 3.K và `LL01-HERO-LAIR-PACK-1.0` đúng 15 lair/15 Hero/693 unit ID; rồi thêm lane union/history/worldtube/index của `SPATIAL-SWEEP-GEOMETRY-1.0`.
3. `FILE04-3.1.0-SEARCH-TEAM-CAPABILITY.1` phải giữ toàn bộ 3.0.0/15 Hero profile/zero-case gấu đơn độc và thêm `SEARCH-TEAM-CAPABILITY-1.0`; actor count tác động frontage/detection với coordination diminishing return, không tạo encounter hoặc population.
4. `LANG-2.2.0-OFFICIAL-RUNTIME.1` phải chứa đủ ba khối parent 2.1: speed-achievement post-claim; operational/career-compatible reward; event/chest/rank presentation; đồng thời có năm mode output, causal delta, exact-number/uncertainty split, scoped diagnostics và renderer fallback.
5. `FILE05-3.2.0-SPATIAL-SEARCH-RUNTIME.1` phải giữ mọi capability 3.1.0 và FM-01…FM-190, rồi thêm child team operations, same-clock moving targets, parallel contacts, stop scopes, shared subsystem mapping, deterministic benchmarks và FM-191…FM-210.
6. `FILE06-2.5.0-SPATIAL-SEARCH-BINDING.1` phải giữ catalog kỹ năng, `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`, `BaseLaborRate=1,00 WU/giờ`, 3.K/192 chest/`CHEST-SEARCH-2.1-FIXED` và 15 hidden lairs, rồi bind empty T0 spatial refs without state delta.
7. `CHECKLIST-3.8.0-SPATIAL-SEARCH-GATE.1` phải giữ mọi gate 3.7.0, thêm Section XIX và exact benchmark/FM-191…FM-210 gates; load-time hash/source/base-state vẫn `LOAD_FATAL`.
8. File 03/04/05/06/checklist/carryover phải bind manifest 1.3.0 active; bare semver collision vẫn bị chặn. Language và artifact active không đổi giữ exact parent hash.
9. Release note không chứng minh retention. Mọi lần thay file sau này phải content-diff toàn parent set, chạy capability gate rồi tăng phiên bản duy nhất trước khi ghi hash mới.

## 4. Checkpoint state binding

| `state_artifact_id` | World time | SHA-256 toàn file | Byte | Dòng | Parent semantic state | Active semantic state |
|---|---|---|---:|---:|---|---|
| `LL01-D1-2200-DEBUG-CARRYOVER-R2` | `D1 22:00:00` | `4424566a63f99182e15dc3f365b414f8011d30992260f75bf2a47c5e6c87157d` | 34594 | 1039 | `4bd396def5bb6706f4079916343688bb6bd3b0cf100e35e6f9b647e69aba50ee` | `7efcfc7f06655f52905e1240948ba807ff09b309d56dade2450dc606e962255e` |
| `LL01-D1-2200-DEBUG-CARRYOVER-R3` | `D1 22:00:00` | `84faff1f4b9c457a1934eae6d6f3382fe1c99edf1adcaa0463bc4493200f53e8` | 36822 | 1061 | `7efcfc7f06655f52905e1240948ba807ff09b309d56dade2450dc606e962255e` | `a0f07b4e95de0c0610e0f1eb06f6863da68c362a4bb560fe5167074c5941ea0a` |

Checkpoint R2 là parent lair migration. R3 bọc R2 bằng spatial-search schema migration `46158e1738862cfad648f63ca361de5ac83c3453409a7e629d85013ecd6e2e17`, commit zero physical D1 delta, giữ R0 `26/3/8/3`, mọi Inventory/force/XP/chest/quest/job và 15 lair `UNOBSERVED`; hai hunt cũ chỉ mang nhãn `LEGACY_CONTACT_ONLY`, không được bịa geometry/negative evidence.
