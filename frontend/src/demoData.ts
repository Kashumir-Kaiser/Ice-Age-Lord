import type { EntityRef } from './game/GameClient';

export type Screen = 'overview' | 'character' | 'territory' | 'map' | 'inventory' | 'forces' | 'buildings' | 'events' | 'journal';
export type ItemKind = 'Tài nguyên' | 'Trang bị' | 'Vật phẩm' | 'Bản vẽ';
export type ItemSymbol = 'wood' | 'stone' | 'ore' | 'bread' | 'cloak' | 'staff' | 'axe' | 'chest' | 'scroll' | 'potion' | 'sword' | 'ring'
  | 'iron-pot' | 'stone-hammer' | 'round-shield' | 'convenience-bag' | 'herbs' | 'water' | 'salt' | 'supply-coffer'
  | 'chest-moc' | 'chest-bronze' | 'chest-silver' | 'chest-gold' | 'chest-moon'
  | 'main-meal-box' | 'two-baozi' | 'packaged-sandwich' | 'cup-noodles' | 'cracker-packet' | 'roasted-seeds-packet'
  | 'chocolate-bar' | 'potato-chip-packet' | 'bottled-water' | 'tea-bottle' | 'coffee-can' | 'napkin-chopsticks';
export type SiteKind = 'fire' | 'house' | 'tomb' | 'supply';
export type Site = {
  id: SiteKind;
  entityRef: EntityRef;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  x: number;
  y: number;
  label: string;
};
export type DemoItem = {
  id: string;
  name: string;
  kind: ItemKind;
  symbol: ItemSymbol;
  note: string;
  detail: string;
  origin: 'Nguồn thiết kế' | 'Mẫu thị giác';
};
export const screens: { id: Screen; name: string; hint: string }[] = [
  { id: 'overview', name: 'Tổng quan', hint: 'Màn hình chính' },
  { id: 'character', name: 'Nhân vật', hint: 'Trang bị' },
  { id: 'territory', name: 'Lãnh địa', hint: 'Quản lý' },
  { id: 'map', name: 'Bản đồ', hint: 'Khảo sát' },
  { id: 'inventory', name: 'Kho vật phẩm', hint: 'Hình mẫu' },
  { id: 'forces', name: 'Quân lực', hint: 'Đơn vị' },
  { id: 'buildings', name: 'Công trình', hint: 'Kiến trúc' },
  { id: 'events', name: 'Sự kiện', hint: 'Hợp đồng mẫu' },
  { id: 'journal', name: 'Nhật ký', hint: 'Sự kiện' },
];
export const demoEventContracts = [
  { id: 'EV02-DRAGON-REVIVAL', displayName: 'Dragon revival', status: 'scheduled', readiness: 'executable_lifecycle', opensAtElapsedMs: 518_400_000, locksAtElapsedMs: 1_123_200_000, resolvesAtElapsedMs: 1_209_600_000, objective: null, outcome: null, rewardKrona: 0, claimExpiresAtElapsedMs: null, rewardClaimed: false, eventShop: null },
  { id: 'EV19-ICE-SNOW-CHOICE', displayName: 'Ice or snow campaign choice', status: 'scheduled', readiness: 'executable_lifecycle', opensAtElapsedMs: 13_392_000_000, locksAtElapsedMs: 13_996_800_000, resolvesAtElapsedMs: 14_083_200_000, objective: null, outcome: null, rewardKrona: 0, claimExpiresAtElapsedMs: null, rewardClaimed: false, eventShop: null },
  { id: 'EV29-FINAL-CALAMITY', displayName: 'Final calamity', status: 'scheduled', readiness: 'executable_lifecycle', opensAtElapsedMs: 18_921_600_000, locksAtElapsedMs: 19_526_400_000, resolvesAtElapsedMs: 19_612_800_000, objective: null, outcome: null, rewardKrona: 0, claimExpiresAtElapsedMs: null, rewardClaimed: false, eventShop: null },
];
/** Opening site positions are exact LL01 registry coordinates in metres (+X east, +Y north).\n * They are read-only frontend projections; the site IDs and canonical registry remain authority. */
export const sites: Site[] = [
  {
    id: 'fire', entityRef: {type:'site',id:'SITE-LL01-000'}, name: 'Lửa Trại Cấp 1', subtitle: 'Lửa Sinh Tồn',
    description: 'Lửa trại giữ ấm cho lãnh địa. Lượng nhiên liệu và thời gian cháy chưa được cập nhật.',
    status: 'Đã xác nhận trong thiết lập khởi đầu', x: 0, y: 0, label: 'Lửa Trại',
  },
  {
    id: 'house', entityRef: {type:'site',id:'SITE-LL01-001'}, name: 'Nhà Lãnh Chúa Hư Hại', subtitle: 'Công trình khởi đầu',
    description: 'Một ngôi nhà bị hư hại cần tu sửa. Sửa chữa cần 20 Gỗ và 10 Đá; hiện chưa thể thực hiện.',
    status: 'Chưa tu sửa tại khởi đầu', x: 40, y: 20, label: 'Nhà Lãnh Chúa',
  },
  {
    id: 'tomb', entityRef: {type:'site',id:'SITE-LL01-003'}, name: 'Ngôi Mộ Bậc 1', subtitle: 'Công trình binh chủng',
    description: 'Lính Ngôi Mộ được tạo riêng với năng lực Tử Phục của Lí Lan. Hiện chưa có lính nào được tạo.',
    status: 'Tồn tại tại khởi đầu', x: -20, y: 30, label: 'Ngôi Mộ',
  },
  {
    id: 'supply', entityRef: {type:'site',id:'SITE-LL01-002'}, name: 'Hòm Vật Tư Lãnh Địa', subtitle: 'Hòm khởi đầu',
    description: 'Hòm Vật Tư chứa đồ dùng khởi đầu. Nội dung cụ thể sẽ được hiển thị sau khi kiểm kê.',
    status: 'Chưa mô phỏng thao tác', x: 30, y: -10, label: 'Hòm Vật Tư',
  },
];
export const itemExamples: DemoItem[] = [
  { id:'wood', name:'Gỗ', kind:'Tài nguyên', symbol:'wood', note:'Vật liệu xây dựng', detail:'Mẫu hiển thị tài nguyên gỗ. Không ngụ ý người chơi đang sở hữu số lượng nào.', origin:'Nguồn thiết kế' },
  { id:'stone', name:'Đá', kind:'Tài nguyên', symbol:'stone', note:'Vật liệu công trình', detail:'Đá dùng trong nhiều hợp đồng xây dựng; kiểm tra tồn kho chỉ khi runtime có dữ liệu.', origin:'Nguồn thiết kế' },
  { id:'ore', name:'Than Nâu', kind:'Tài nguyên', symbol:'ore', note:'Vỉa than nâu', detail:'Hình minh họa vỉa than nâu; chưa có thông tin về việc khảo sát hoặc khai thác.', origin:'Nguồn thiết kế' },
  { id:'herbs', name:'Cỏ Tuyết', kind:'Tài nguyên', symbol:'herbs', note:'Thảo dược dại', detail:'Mẫu thực vật theo hệ vật liệu sinh tồn; không ngụ ý đã thu hoạch.', origin:'Nguồn thiết kế' },
  { id:'water', name:'Băng Nước Sạch', kind:'Tài nguyên', symbol:'water', note:'Nguồn nước đóng băng', detail:'Mẫu nước dạng băng. Nguồn tại Bến Cạn phải được đun hoặc lọc.', origin:'Nguồn thiết kế' },
  { id:'salt', name:'Muối', kind:'Tài nguyên', symbol:'salt', note:'Nguồn muối tự nhiên', detail:'Hình minh họa nguồn muối tự nhiên; việc khai thác cần lao động và nhiên liệu nấu.', origin:'Nguồn thiết kế' },
  { id:'bread', name:'Bánh Mì', kind:'Vật phẩm', symbol:'bread', note:'Trong Hòm Vật Tư khởi đầu', detail:'Bộ vật tư khởi đầu có ghi 20 bánh mì. Hình minh họa này chưa xác nhận số lượng Lí Lan đang sở hữu.', origin:'Nguồn thiết kế' },
  { id:'iron-pot', name:'Nồi Sắt', kind:'Vật phẩm', symbol:'iron-pot', note:'Trong Hòm Vật Tư khởi đầu', detail:'Một nồi sắt được ghi trong bộ vật tư mở màn. Hình không khẳng định kích cỡ hay tình trạng khác.', origin:'Nguồn thiết kế' },
  { id:'axe', name:'Rìu Đá', kind:'Trang bị', symbol:'axe', note:'Công cụ bằng đá buộc cán', detail:'Bốn rìu đá nằm trong định suất Hòm Vật Tư. Không phải rìu sắt.', origin:'Nguồn thiết kế' },
  { id:'stone-hammer', name:'Búa Đá', kind:'Trang bị', symbol:'stone-hammer', note:'Công cụ xây dựng', detail:'Bốn búa đá nằm trong định suất Hòm Vật Tư. Mẫu hình giữ đầu đá ghè thô.', origin:'Nguồn thiết kế' },
  { id:'round-shield', name:'Khiên Tròn Gỗ', kind:'Trang bị', symbol:'round-shield', note:'Khiên gỗ ghép ván', detail:'Một khiên tròn gỗ nằm trong định suất Hòm Vật Tư. Không thêm viền kim loại hoặc năng lực chưa được ghi nguồn.', origin:'Nguồn thiết kế' },
  { id:'cloak', name:'Áo Choàng Chống Lạnh', kind:'Trang bị', symbol:'cloak', note:'Trang bị sinh tồn', detail:'Tên trang bị được nhắc trong tài liệu thiết kế. Chưa có thông tin cho biết Lí Lan đang sở hữu vật phẩm này.', origin:'Nguồn thiết kế' },
  { id:'staff', name:'Trượng Gỗ', kind:'Trang bị', symbol:'staff', note:'Trong Hòm Vật Tư khởi đầu', detail:'Một trượng gỗ nằm trong định suất Hòm Vật Tư. Mẫu trượng không có đá phép hay hiệu ứng.', origin:'Nguồn thiết kế' },
  { id:'supply-coffer', name:'Hòm Vật Tư Lãnh Địa', kind:'Vật phẩm', symbol:'supply-coffer', note:'Kho 40 ngăn khởi đầu', detail:'Hòm vật tư lúc bắt đầu chứa bộ đồ dùng mở màn. Hòm này khác với Rương Báu.', origin:'Nguồn thiết kế' },
  { id:'convenience-bag', name:'Bịch Đồ Ăn Từ Lam Tinh', kind:'Vật phẩm', symbol:'convenience-bag', note:'Nội dung chưa kiểm kê', detail:'Các món ăn đã được chuẩn bị trước khi Lí Lan bắt đầu, nhưng chưa được kiểm kê. Hình minh họa giữ kín bên trong.', origin:'Nguồn thiết kế' },
  { id:'chest', name:'Rương Báu · chưa giám định', kind:'Vật phẩm', symbol:'chest', note:'Mẫu vỏ kín', detail:'Cache chưa mở; hình chỉ mô tả chiếc rương đóng. Không suy đoán phẩm, khóa hoặc vật bên trong.', origin:'Nguồn thiết kế' },
  { id:'chest-moc', name:'Rương Báu · Mộc', kind:'Vật phẩm', symbol:'chest-moc', note:'Mốc phẩm trong hệ rương', detail:'Biến thể artwork theo mốc phẩm Mộc. Không gắn rương này với một cache hoặc chiến lợi phẩm cụ thể.', origin:'Nguồn thiết kế' },
  { id:'chest-bronze', name:'Rương Báu · Thanh Đồng', kind:'Vật phẩm', symbol:'chest-bronze', note:'Mốc phẩm trong hệ rương', detail:'Biến thể artwork theo mốc phẩm Thanh Đồng. Không suy đoán nội dung hoặc trạng thái sở hữu.', origin:'Nguồn thiết kế' },
  { id:'chest-silver', name:'Rương Báu · Bạch Ngân', kind:'Vật phẩm', symbol:'chest-silver', note:'Mốc phẩm trong hệ rương', detail:'Biến thể artwork theo mốc phẩm Bạch Ngân. Không suy đoán nội dung hoặc trạng thái sở hữu.', origin:'Nguồn thiết kế' },
  { id:'chest-gold', name:'Rương Báu · Hoàng Kim', kind:'Vật phẩm', symbol:'chest-gold', note:'Mốc phẩm trong hệ rương', detail:'Biến thể artwork theo mốc phẩm Hoàng Kim. Không suy đoán nội dung hoặc trạng thái sở hữu.', origin:'Nguồn thiết kế' },
  { id:'chest-moon', name:'Rương Báu · Hạo Nguyệt', kind:'Vật phẩm', symbol:'chest-moon', note:'Mốc phẩm trong hệ rương', detail:'Biến thể artwork theo mốc phẩm Hạo Nguyệt. Không thêm hào quang hay hiệu ứng mở rương.', origin:'Nguồn thiết kế' },
  { id:'scroll', name:'Bản Vẽ Công Trình', kind:'Bản vẽ', symbol:'scroll', note:'Bản vẽ minh họa', detail:'Không phải một bản vẽ đã học, sở hữu hoặc có hiệu lực xây dựng. Chỉ minh họa khung thẻ.', origin:'Mẫu thị giác' },
  { id:'potion', name:'Dược Tề', kind:'Vật phẩm', symbol:'potion', note:'Vật phẩm tiêu hao', detail:'Hình minh họa lọ thuốc chưa có hiệu ứng, cấp độ hay phẩm chất được xác định.', origin:'Mẫu thị giác' },
  { id:'sword', name:'Kiếm Sắt', kind:'Trang bị', symbol:'sword', note:'Thẻ vũ khí', detail:'Mẫu artwork để kiểm tra vật phẩm cận chiến. Đây không phải trang bị của Lí Lan.', origin:'Mẫu thị giác' },
  { id:'ring', name:'Nhẫn Tụ Linh', kind:'Trang bị', symbol:'ring', note:'Ứng viên thiết kế', detail:'Thiết kế vật phẩm ứng viên; hiệu ứng và nguồn sở hữu chưa được materialize vào game.', origin:'Nguồn thiết kế' },
];
export const mockJournal = [
  { time: '07:00', category: 'Bối cảnh', title: 'Khởi đầu tại đồng bằng băng', text: 'Thiết lập câu chuyện: Lí Lan xuất hiện trên cổ chiến trường dưới lớp băng. Đây là tóm tắt mở cảnh, không phải lượt chơi đã giải quyết.' },
  { time: '07:00', category: 'Hệ thống', title: 'Tử Phục Linh Sư — SSS', text: 'Thiên phú của Lí Lan đã được xác định. Chưa có hành động Tử Phục nào được thực hiện.' },
  { time: '—', category: 'Giao diện', title: 'Chưa có sự kiện mới', text: 'Nhật ký sẽ cập nhật khi có sự kiện trong hành trình.' },
];
