/** WORLD-PACKAGE-LL01-1.0: direct fixed records from LORD-DND-03 §3.K.4–3.K.7.
 * Coordinate system: LL01-LOCAL-KM origin H0; +X east, +Y north; converted to metres.
 * Strictly private to the frontend model: render only filtered observations, never all raw sites.
 * Geometry between anchors is NOT specified by registry. Do not infer road polylines or biome polygons.
 * Initial quantities are source capacities, not proof of actual post-T0 remaining balance.
 */
export type CanonicalSite={id:string;name:string;x:number;y:number;z:number;description:string;access:string;content:string};
export const CANONICAL_SITES:readonly CanonicalSite[]=[
  {
    "id": "SITE-LL01-000",
    "name": "H0 — Điểm Neo Lí Lan",
    "x": 0,
    "y": 0,
    "z": 0,
    "description": "Lửa Trại Hệ Thống trên nền băng",
    "access": "mở",
    "content": "origin; không phải phế tích cổ"
  },
  {
    "id": "SITE-LL01-001",
    "name": "Nhà Lãnh Chúa Hư Hại",
    "x": 40,
    "y": 20,
    "z": 0,
    "description": "nền đá, khung gỗ sập; contract nguồn",
    "access": "mở",
    "content": "tu sửa `10 Đá + 20 Gỗ`"
  },
  {
    "id": "SITE-LL01-002",
    "name": "Hòm Vật Tư Lãnh Địa",
    "x": 30,
    "y": -10,
    "z": 0,
    "description": "hòm kho Hệ Thống",
    "access": "mở khi Lí Lan chạm/mở",
    "content": "kho 40 ngăn; **không** là Rương Báu"
  },
  {
    "id": "SITE-LL01-003",
    "name": "Ngôi Mộ Bậc 1",
    "x": -20,
    "y": 30,
    "z": -2,
    "description": "đá đen khắc rune, cửa vòm thấp",
    "access": "mở",
    "content": "công trình binh chủng cá nhân"
  },
  {
    "id": "SITE-LL01-010",
    "name": "Hào Nông Sora",
    "x": -420,
    "y": 350,
    "z": -1,
    "description": "hào đất, cọc thông, tấm khiên mục",
    "access": "khảo sát T1",
    "content": "`QUEST-LL01-01`; corpse cluster Sora nông"
  },
  {
    "id": "SITE-LL01-011",
    "name": "Hố Lao Trevil",
    "x": 680,
    "y": 210,
    "z": -1,
    "description": "đất nện, đá xếp, lao gỗ/đầu sắt",
    "access": "khảo sát T1",
    "content": "`QUEST-LL01-02`; corpse cluster Trevil nông"
  },
  {
    "id": "SITE-LL01-012",
    "name": "Khe Xe Gãy",
    "x": 1150,
    "y": -780,
    "z": -3,
    "description": "xe gỗ kéo thú, dây da, đai sắt",
    "access": "dây kéo + chống sập",
    "content": "cache hậu cần; dấu tuyến thương cổ"
  },
  {
    "id": "SITE-LL01-013",
    "name": "Miếu Dã Chiến Bạch Chung",
    "x": -1620,
    "y": -940,
    "z": -2,
    "description": "bệ đá, mái gỗ mục, chuông đồng",
    "access": "mở; trigger đêm",
    "content": "`QUEST-LL01-04`; không điện/loa"
  },
  {
    "id": "SITE-LL01-014",
    "name": "Gò Chiến Kỳ Sora",
    "x": -2350,
    "y": 1200,
    "z": -2,
    "description": "ụ đất–đá, cột cờ gỗ bọc đồng",
    "access": "khảo sát biểu tượng",
    "content": "quest item `QI-LL01-01`"
  },
  {
    "id": "SITE-LL01-015",
    "name": "Mộ Sừng Trevil",
    "x": 2760,
    "y": 1480,
    "z": -3,
    "description": "cairn đá khô, sừng/xương, dây da",
    "access": "giải dấu tộc",
    "content": "quest item `QI-LL01-02`"
  },
  {
    "id": "SITE-LL01-016",
    "name": "Tháp Lửa Đá Khô",
    "x": -4800,
    "y": 3600,
    "z": 12,
    "description": "tháp đá xếp, cầu thang gỗ, chậu lửa",
    "access": "T2; đường dốc",
    "content": "trạm tín hiệu Sora; `QUEST-LL01-10`"
  },
  {
    "id": "SITE-LL01-017",
    "name": "Cổng Lũy Đất Sora",
    "x": -6250,
    "y": 1750,
    "z": 4,
    "description": "lũy đất, palisade gỗ, cửa gỗ bọc sắt",
    "access": "T2; dọn băng",
    "content": "tuyến phòng thủ, không bunker"
  },
  {
    "id": "SITE-LL01-018",
    "name": "Vòng Hội Sừng Trevil",
    "x": 5900,
    "y": 4250,
    "z": 6,
    "description": "vòng đá, cọc gỗ, da thú",
    "access": "T2; nghi thức tộc",
    "content": "manh mối Bản Đồ Bảy Lửa"
  },
  {
    "id": "SITE-LL01-019",
    "name": "Bể Ngầm Dưới Băng",
    "x": -3300,
    "y": -5450,
    "z": -12,
    "description": "bể đá xây vữa, vòm gạch, máng gốm",
    "access": "T2; xả áp nước",
    "content": "`QUEST-LL01-03`; không ống thép"
  },
  {
    "id": "SITE-LL01-020",
    "name": "Thư Khố Vòm Sora",
    "x": -8700,
    "y": 6300,
    "z": -15,
    "description": "vòm đá/gạch, giá gỗ, bản đồng nhỏ",
    "access": "T3; chìa ấn Sora",
    "content": "`QUEST-LL01-05/11`; archive cố định"
  },
  {
    "id": "SITE-LL01-021",
    "name": "Cốt Đường Trevil",
    "x": 9400,
    "y": 7950,
    "z": -17,
    "description": "đá khô, cột xương/sừng, vách da hóa cứng",
    "access": "T3; Bone Map",
    "content": "`QUEST-LL01-06/09`"
  },
  {
    "id": "SITE-LL01-022",
    "name": "Địa Cung Chỉ Huy Sora",
    "x": -11800,
    "y": 8600,
    "z": -28,
    "description": "phòng vòm đá, cửa gỗ sồi bọc sắt, bàn bản đồ đá",
    "access": "T4; hai nửa ấn",
    "content": "hero `HERO-LL01-06`; không bunker"
  },
  {
    "id": "SITE-LL01-023",
    "name": "Hang Thệ Ước Trevil",
    "x": 12600,
    "y": 10200,
    "z": -26,
    "description": "hang đá gia cố gỗ, vòng oathstone",
    "access": "T4; đủ bảy dấu lửa",
    "content": "hero `HERO-LL01-07`"
  },
  {
    "id": "SITE-LL01-024",
    "name": "Tiền Sảnh Song Phong Ấn",
    "x": 800,
    "y": 12400,
    "z": -42,
    "description": "đá tạc, cửa đồng–sắt, rune đối xứng",
    "access": "T5; ba chứng cứ chiến tranh",
    "content": "ngã ba quest Sora/Trevil"
  },
  {
    "id": "SITE-LL01-025",
    "name": "Kho Băng Đen",
    "x": -18200,
    "y": 20100,
    "z": -61,
    "description": "basalt, băng đen, then đá/rune; không vỏ thép",
    "access": "T5; ba chìa cố định",
    "content": "`QUEST-LL01-07`; Rương Hoàng Kim quest-locked"
  },
  {
    "id": "SITE-LL01-026",
    "name": "Tĩnh Thất Thái Dương Sora",
    "x": -13900,
    "y": 15600,
    "z": -68,
    "description": "thạch thất tạc nguyên khối, rune vàng, cánh cửa đồng",
    "access": "T5 + Sun Seal",
    "content": "sinh mệnh Thần thoại `HERO-LL01-12`"
  },
  {
    "id": "SITE-LL01-027",
    "name": "Tĩnh Thất Nguyệt Sừng Trevil",
    "x": 14200,
    "y": 16100,
    "z": -71,
    "description": "hang đá tạc, cột sừng hóa thạch, rune bạc",
    "access": "T5 + Moon-Horn Seal",
    "content": "sinh mệnh Thần thoại `HERO-LL01-13`"
  },
  {
    "id": "SITE-LL01-028",
    "name": "Đèo Song Vương Gục Ngã",
    "x": 400,
    "y": 25800,
    "z": 18,
    "description": "đèo đá, lũy đất vỡ, hai đài cờ đá",
    "access": "T7; Twin Crown evidence",
    "content": "di cốt hai vua T7 Phẩm Lãnh chúa"
  },
  {
    "id": "SITE-LL01-029",
    "name": "Tâm Triều Tử Khí",
    "x": 0,
    "y": 31400,
    "z": -125,
    "description": "hang nứt tự nhiên + trận thức đá cổ",
    "access": "T8; Twin-Seal Key",
    "content": "final quest; không máy móc"
  },
  {
    "id": "SITE-LL01-040",
    "name": "Rừng Thông Tro Băng",
    "x": 4700,
    "y": -6800,
    "z": 3,
    "description": "rừng tự nhiên, lều tiều phu gỗ hiện đại-bản địa",
    "access": "mở qua route",
    "content": "wood node `RES-LL01-01`"
  },
  {
    "id": "SITE-LL01-041",
    "name": "Mỏ Đá Vân Xám",
    "x": -7800,
    "y": -4700,
    "z": 10,
    "description": "quarry lộ thiên, nêm sắt, giàn gỗ",
    "access": "mở qua route",
    "content": "stone node `RES-LL01-02`"
  },
  {
    "id": "SITE-LL01-042",
    "name": "Bến Cạn Sông Kính",
    "x": 8900,
    "y": -11200,
    "z": -1,
    "description": "ford đá, cọc dẫn đường gỗ",
    "access": "route phụ thuộc băng",
    "content": "nước/đánh cá hữu hạn"
  },
  {
    "id": "SITE-LL01-043",
    "name": "Xóm Tùng Tro",
    "x": 11400,
    "y": -8100,
    "z": 4,
    "description": "14 nhà gỗ–đá, giếng vòm, hàng rào cọc",
    "access": "route 15,6 km",
    "content": "46 cư dân; `QUEST-LL01-03` issuer"
  },
  {
    "id": "SITE-LL01-044",
    "name": "Làng Bắc Khẩu",
    "x": 21000,
    "y": -13000,
    "z": 8,
    "description": "71 nhà gỗ/đá, chợ mái ngói, tường đất thấp",
    "access": "route 28,1 km",
    "content": "318 cư dân; polity Bạch Chung"
  },
  {
    "id": "SITE-LL01-045",
    "name": "Pháo Đài Quạ Tuyết",
    "x": 34000,
    "y": -5000,
    "z": 37,
    "description": "keep đá, tường đá, cổng gỗ bọc sắt, tháp cung",
    "access": "route 39,2 km",
    "content": "212 quân/dân đồn trú; không đại bác"
  },
  {
    "id": "SITE-LL01-046",
    "name": "Thị Trấn Cổng Krona",
    "x": 46000,
    "y": -23000,
    "z": 12,
    "description": "tường đá–gỗ, 1.040 nóc, cầu đá",
    "access": "route 58,7 km",
    "content": "4.860 cư dân; mint/market Krona địa phương"
  },
  {
    "id": "SITE-LL01-047",
    "name": "Thành Bạch Chung",
    "x": 79000,
    "y": -49000,
    "z": 18,
    "description": "thành đá tiền công nghiệp, mái gỗ/ngói, cống vòm",
    "access": "route 108,5 km",
    "content": "73.400 cư dân; trị sở biên hầu"
  },
  {
    "id": "SITE-LL01-048",
    "name": "Tu Viện Chuông Trắng",
    "x": 27000,
    "y": -19000,
    "z": 24,
    "description": "tu viện đá, mái ngói, tháp chuông cơ khí tay",
    "access": "route 37,4 km",
    "content": "61 tu sĩ/người phục vụ; `QUEST-LL01-04`"
  },
  {
    "id": "SITE-LL01-049",
    "name": "Cầu Thương Lộ Cũ",
    "x": 37000,
    "y": -18000,
    "z": 2,
    "description": "ba nhịp đá, lan can gỗ",
    "access": "route 45,9 km",
    "content": "caravan checkpoint; `QUEST-LL01-08`"
  },
  {
    "id": "SITE-LL01-050",
    "name": "Mốc Biên Bạch Chung",
    "x": 15000,
    "y": -11000,
    "z": 6,
    "description": "trụ đá khắc luật, chòi gỗ",
    "access": "route 21,0 km",
    "content": "ranh kiểm soát thực gần nhất"
  },
  {
    "id": "SITE-LL01-051",
    "name": "Suối Muối Xám",
    "x": -16000,
    "y": -9000,
    "z": 5,
    "description": "suối tự nhiên, máng gỗ, nồi đồng",
    "access": "route 21,6 km",
    "content": "salt node `RES-LL01-05`"
  },
  {
    "id": "SITE-LL01-052",
    "name": "Trạm Nghỉ Xe Kéo",
    "x": 32000,
    "y": -16000,
    "z": 6,
    "description": "sân đất, chuồng gỗ, nhà trọ đá–gỗ",
    "access": "route 39,8 km",
    "content": "issuer caravan; không trạm nhiên liệu cơ giới"
  },
  {
    "id": "SITE-LL01-060",
    "name": "Vương Đô Varen",
    "x": 164000,
    "y": -183000,
    "z": 31,
    "description": "thành lũy đá, cung điện đá–gỗ, đường lát đá",
    "access": "macro route 291 km",
    "content": "286.000 cư dân; thủ đô chính thể hiện thời"
  }
];
export const OPENING_SITE_IDS=['SITE-LL01-000','SITE-LL01-001','SITE-LL01-002','SITE-LL01-003'] as const;
export const CANONICAL_ANCHORS=[
  {
    "id": "ANCHOR-RC-001",
    "x": 0,
    "y": 0,
    "region": "cổ chiến trường Sora–Trevil",
    "observed": true
  },
  {
    "id": "ANCHOR-RC-002",
    "x": 68000,
    "y": 52000,
    "region": "bồn địa Kính Tuyết",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-003",
    "x": -71000,
    "y": 38000,
    "region": "tàn trấn Hắc Tuyết",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-004",
    "x": -58000,
    "y": -57000,
    "region": "rừng Bạch Nha",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-005",
    "x": 62000,
    "y": -61000,
    "region": "lưu vực Băng Liệp",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-006",
    "x": 84000,
    "y": 10000,
    "region": "sườn Thiết Hổ",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-007",
    "x": -86000,
    "y": -8000,
    "region": "phế thôn Cột Khói",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-008",
    "x": 14000,
    "y": 82000,
    "region": "đồng trắng Mù Sương",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-009",
    "x": 42000,
    "y": -83000,
    "region": "ngã ba Băng Lộ",
    "observed": false
  },
  {
    "id": "ANCHOR-RC-010",
    "x": -35000,
    "y": 76000,
    "region": "khe Thánh Quang cũ",
    "observed": false
  }
] as const;
export const CANONICAL_CHEST_CACHES=[
  {
    "id": "CACHE-LL01-01",
    "ring": "R0",
    "x": -650,
    "y": 520,
    "chestIds": "`CH-LL01-001..003`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "mép Hào Nông; băng mỏng"
  },
  {
    "id": "CACHE-LL01-02",
    "ring": "R0",
    "x": 850,
    "y": 400,
    "chestIds": "`CH-LL01-004..006`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "đá vỡ Hố Lao; xương nhọn"
  },
  {
    "id": "CACHE-LL01-03",
    "ring": "R0",
    "x": 1220,
    "y": -880,
    "chestIds": "`CH-LL01-007..009`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Khe Xe Gãy; chống sập"
  },
  {
    "id": "CACHE-LL01-04",
    "ring": "R0",
    "x": -1450,
    "y": -750,
    "chestIds": "`CH-LL01-010..012`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "sau Miếu Dã Chiến; gió cắt"
  },
  {
    "id": "CACHE-LL01-05",
    "ring": "R0",
    "x": -2100,
    "y": 1100,
    "chestIds": "`CH-LL01-013..015`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "chân Gò Chiến Kỳ; băng sâu"
  },
  {
    "id": "CACHE-LL01-06",
    "ring": "R0",
    "x": 2450,
    "y": 1350,
    "chestIds": "`CH-LL01-016..018`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "lối Mộ Sừng; dấu thú"
  },
  {
    "id": "CACHE-LL01-07",
    "ring": "R0",
    "x": 350,
    "y": 2650,
    "chestIds": "`CH-LL01-019..021`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "đồng băng mở; lộ gió"
  },
  {
    "id": "CACHE-LL01-08",
    "ring": "R0",
    "x": -2550,
    "y": -950,
    "chestIds": "`CH-LL01-022..024`",
    "grades": "Mộc/Mộc/Thanh Đồng",
    "hazard": "hốc đá; cần nạy"
  },
  {
    "id": "CACHE-LL01-09",
    "ring": "R0",
    "x": 1650,
    "y": -2250,
    "chestIds": "`CH-LL01-025..027`",
    "grades": "Mộc/Thanh Đồng/Thanh Đồng",
    "hazard": "khe tuyết; ice-burrower route"
  },
  {
    "id": "CACHE-LL01-10",
    "ring": "R0",
    "x": -950,
    "y": -2550,
    "chestIds": "`CH-LL01-028..030`",
    "grades": "Mộc/Thanh Đồng/Bạch Ngân",
    "hazard": "hầm vòm đá nhỏ; seal T1"
  },
  {
    "id": "CACHE-LL01-11",
    "ring": "R1",
    "x": -4800,
    "y": 3600,
    "chestIds": "`CH-LL01-031..033`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Tháp Lửa; leo dốc"
  },
  {
    "id": "CACHE-LL01-12",
    "ring": "R1",
    "x": -6200,
    "y": 1750,
    "chestIds": "`CH-LL01-034..036`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Cổng Lũy; gỗ sập"
  },
  {
    "id": "CACHE-LL01-13",
    "ring": "R1",
    "x": 5900,
    "y": 4250,
    "chestIds": "`CH-LL01-037..039`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Vòng Hội; taboo tộc"
  },
  {
    "id": "CACHE-LL01-14",
    "ring": "R1",
    "x": -3300,
    "y": -5450,
    "chestIds": "`CH-LL01-040..042`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Bể Ngầm; áp nước"
  },
  {
    "id": "CACHE-LL01-15",
    "ring": "R1",
    "x": 4700,
    "y": -6800,
    "chestIds": "`CH-LL01-043..045`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Rừng Thông; thú canh"
  },
  {
    "id": "CACHE-LL01-16",
    "ring": "R1",
    "x": -7800,
    "y": -4700,
    "chestIds": "`CH-LL01-046..048`",
    "grades": "Mộc/Thanh Đồng/Thanh Đồng",
    "hazard": "Quarry; sạt đá"
  },
  {
    "id": "CACHE-LL01-17",
    "ring": "R1",
    "x": 8100,
    "y": -3200,
    "chestIds": "`CH-LL01-049..051`",
    "grades": "Mộc/Thanh Đồng/Thanh Đồng",
    "hazard": "gờ băng; route hở"
  },
  {
    "id": "CACHE-LL01-18",
    "ring": "R1",
    "x": 7200,
    "y": 6600,
    "chestIds": "`CH-LL01-052..054`",
    "grades": "Thanh Đồng/Bạch Ngân/Bạch Ngân",
    "hazard": "khe rune Trevil; seal T2"
  },
  {
    "id": "CACHE-LL01-19",
    "ring": "R2",
    "x": 11400,
    "y": -8100,
    "chestIds": "`CH-LL01-055..057`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "ngoài Xóm Tùng Tro; owner claim"
  },
  {
    "id": "CACHE-LL01-20",
    "ring": "R2",
    "x": -8700,
    "y": 6300,
    "chestIds": "`CH-LL01-058..060`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Thư Khố; seal Sora"
  },
  {
    "id": "CACHE-LL01-21",
    "ring": "R2",
    "x": 9400,
    "y": 7950,
    "chestIds": "`CH-LL01-061..063`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Cốt Đường; death trace"
  },
  {
    "id": "CACHE-LL01-22",
    "ring": "R2",
    "x": -11800,
    "y": 8600,
    "chestIds": "`CH-LL01-064..066`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Địa Cung; T4 guard"
  },
  {
    "id": "CACHE-LL01-23",
    "ring": "R2",
    "x": 12600,
    "y": 10200,
    "chestIds": "`CH-LL01-067..069`",
    "grades": "Mộc/Mộc/Thanh Đồng",
    "hazard": "Hang Thệ; oath gate"
  },
  {
    "id": "CACHE-LL01-24",
    "ring": "R2",
    "x": 800,
    "y": 12400,
    "chestIds": "`CH-LL01-070..072`",
    "grades": "Thanh Đồng/Thanh Đồng/Thanh Đồng",
    "hazard": "Tiền Sảnh; Twin Seal"
  },
  {
    "id": "CACHE-LL01-25",
    "ring": "R2",
    "x": -13900,
    "y": 15600,
    "chestIds": "`CH-LL01-073..075`",
    "grades": "Thanh Đồng/Bạch Ngân/Bạch Ngân",
    "hazard": "Tĩnh Thất Sora; T5 seal"
  },
  {
    "id": "CACHE-LL01-26",
    "ring": "R3",
    "x": 400,
    "y": 25800,
    "chestIds": "`CH-LL01-076..078`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Đèo Song Vương; gió cực mạnh"
  },
  {
    "id": "CACHE-LL01-27",
    "ring": "R3",
    "x": -18200,
    "y": 20100,
    "chestIds": "`CH-LL01-079..081`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "Kho Băng Đen; key gate"
  },
  {
    "id": "CACHE-LL01-28",
    "ring": "R3",
    "x": 27000,
    "y": -19000,
    "chestIds": "`CH-LL01-082..084`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "đất Tu Viện; owner claim"
  },
  {
    "id": "CACHE-LL01-29",
    "ring": "R3",
    "x": 34000,
    "y": -5000,
    "chestIds": "`CH-LL01-085..087`",
    "grades": "Thanh Đồng/Thanh Đồng/Thanh Đồng",
    "hazard": "ngoài Pháo Đài; quân gác"
  },
  {
    "id": "CACHE-LL01-30",
    "ring": "R3",
    "x": 46000,
    "y": -23000,
    "chestIds": "`CH-LL01-088..090`",
    "grades": "Bạch Ngân/Bạch Ngân/Hoàng Kim",
    "hazard": "kho thuế cũ; luật địa phương"
  },
  {
    "id": "CACHE-LL01-31",
    "ring": "R4",
    "x": 14000,
    "y": 82000,
    "chestIds": "`CH-LL01-091..093`",
    "grades": "Mộc/Mộc/Mộc",
    "hazard": "đồng Mù Sương; navigation hazard"
  },
  {
    "id": "CACHE-LL01-32",
    "ring": "R4",
    "x": 79000,
    "y": -49000,
    "chestIds": "`CH-LL01-094..096`",
    "grades": "Thanh Đồng/Hoàng Kim/Hạo Nguyệt",
    "hazard": "hầm kho vòm đá dưới Thành; sovereign owner + quest/event gate"
  },
  {
    "id": "CACHE-LL01-33",
    "ring": "R4",
    "x": 68000,
    "y": 52000,
    "chestIds": "`CH-LL01-097..111`",
    "grades": "Mộc×10/Thanh Đồng×3/Bạch Ngân/Hoàng Kim",
    "hazard": "trường cục bộ `ANCHOR-RC-002`; 15 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-34",
    "ring": "R4",
    "x": -71000,
    "y": 38000,
    "chestIds": "`CH-LL01-112..123`",
    "grades": "Mộc×9/Thanh Đồng×2/Bạch Ngân",
    "hazard": "trường cục bộ `ANCHOR-RC-003`; 12 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-35",
    "ring": "R4",
    "x": -58000,
    "y": -57000,
    "chestIds": "`CH-LL01-124..133`",
    "grades": "Mộc×8/Thanh Đồng×2",
    "hazard": "trường cục bộ `ANCHOR-RC-004`; 10 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-36",
    "ring": "R4",
    "x": 62000,
    "y": -61000,
    "chestIds": "`CH-LL01-134..141`",
    "grades": "Mộc×7/Thanh Đồng",
    "hazard": "trường cục bộ `ANCHOR-RC-005`; 8 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-37",
    "ring": "R4",
    "x": 84000,
    "y": 10000,
    "chestIds": "`CH-LL01-142..150`",
    "grades": "Mộc×7/Thanh Đồng×2",
    "hazard": "trường cục bộ `ANCHOR-RC-006`; 9 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-38",
    "ring": "R4",
    "x": -86000,
    "y": -8000,
    "chestIds": "`CH-LL01-151..163`",
    "grades": "Mộc×9/Thanh Đồng×3/Bạch Ngân",
    "hazard": "trường cục bộ `ANCHOR-RC-007`; 13 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-39",
    "ring": "R4",
    "x": 14000,
    "y": 82000,
    "chestIds": "`CH-LL01-164..176`",
    "grades": "Mộc×8/Thanh Đồng×3/Bạch Ngân/Hoàng Kim",
    "hazard": "trường cục bộ `ANCHOR-RC-008`; 13 vector đầu; khác object với `CACHE-31`"
  },
  {
    "id": "CACHE-LL01-40",
    "ring": "R4",
    "x": 42000,
    "y": -83000,
    "chestIds": "`CH-LL01-177..183`",
    "grades": "Mộc×6/Thanh Đồng",
    "hazard": "trường cục bộ `ANCHOR-RC-009`; 7 vector đầu `ANCHOR-OFFSET-15`"
  },
  {
    "id": "CACHE-LL01-41",
    "ring": "R4",
    "x": -35000,
    "y": 76000,
    "chestIds": "`CH-LL01-184..192`",
    "grades": "Mộc×7/Thanh Đồng×2",
    "hazard": "trường cục bộ `ANCHOR-RC-010`; 9 vector đầu `ANCHOR-OFFSET-15`"
  }
] as const;
export const CANONICAL_RESOURCES=[
  {
    "id": "RES-LL01-01",
    "siteId": "SITE-LL01-040",
    "name": "Rừng Thông Tro Băng",
    "kind": "wood",
    "unit": "Gỗ",
    "capacity": 780,
    "renewal": "Tái sinh sinh học; không hồi tức thì",
    "x": 4700,
    "y": -6800
  },
  {
    "id": "RES-LL01-02",
    "siteId": "SITE-LL01-041",
    "name": "Mỏ Đá Vân Xám",
    "kind": "stone",
    "unit": "Đá",
    "capacity": 1240,
    "renewal": "Hữu hạn",
    "x": -7800,
    "y": -4700
  },
  {
    "id": "RES-LL01-03",
    "siteId": "SITE-LL01-042",
    "name": "Bến Cạn Sông Kính",
    "kind": "water",
    "unit": "L/ngày",
    "capacity": 20000,
    "renewal": "Lưu lượng mỗi ngày ở trạng thái băng; phải đun/lọc",
    "x": 8900,
    "y": -11200
  },
  {
    "id": "RES-LL01-04",
    "x": -12400,
    "y": -6800,
    "name": "Vỉa Than Nâu",
    "kind": "ore",
    "unit": "Than",
    "capacity": 430,
    "renewal": "Trữ lượng địa chất, chưa được Lí Lan khảo sát"
  },
  {
    "id": "RES-LL01-05",
    "siteId": "SITE-LL01-051",
    "name": "Suối Muối Xám",
    "kind": "salt",
    "unit": "Muối/ngày",
    "capacity": 14,
    "renewal": "Chỉ khi có 2 lao động và nhiên liệu nấu",
    "x": -16000,
    "y": -9000
  }
] as const;
export const CANONICAL_ROUTE_ENDPOINTS=[
  {
    "id": "ROUTE-LL01-01",
    "from": "SITE-LL01-000",
    "to": "SITE-LL01-043",
    "routeKm": 15.6
  },
  {
    "id": "ROUTE-LL01-02",
    "from": "SITE-LL01-043",
    "to": "SITE-LL01-044",
    "routeKm": 12.5
  },
  {
    "id": "ROUTE-LL01-03",
    "from": "SITE-LL01-044",
    "to": "SITE-LL01-048",
    "routeKm": 10.2
  },
  {
    "id": "ROUTE-LL01-04",
    "from": "SITE-LL01-044",
    "to": "SITE-LL01-049",
    "routeKm": 19.4
  },
  {
    "id": "ROUTE-LL01-05",
    "from": "SITE-LL01-049",
    "to": "SITE-LL01-046",
    "routeKm": 13.1
  },
  {
    "id": "ROUTE-LL01-06",
    "from": "SITE-LL01-046",
    "to": "SITE-LL01-047",
    "routeKm": 49.8
  },
  {
    "id": "ROUTE-LL01-07",
    "from": "SITE-LL01-000",
    "to": "SITE-LL01-041",
    "routeKm": 10.4
  },
  {
    "id": "ROUTE-LL01-08",
    "from": "SITE-LL01-000",
    "to": "SITE-LL01-040",
    "routeKm": 9.2
  }
] as const;
export const CANONICAL_MAP_RADIUS_M=96000;
/** Source-defined current-knowledge gate; actual discovery must be supplied by runtime later. */
export function knownOpeningSites(){return CANONICAL_SITES.filter(s=>(OPENING_SITE_IDS as readonly string[]).includes(s.id));}
/** Map of what exists is not a map of what Lí Lan knows. */
export function projectKnownSites(knownIds:readonly string[]){return CANONICAL_SITES.filter(s=>knownIds.includes(s.id));}
