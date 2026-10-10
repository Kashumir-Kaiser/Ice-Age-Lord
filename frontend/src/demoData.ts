import type { EntityRef } from './game/GameClient';

export type Screen = 'overview' | 'territory' | 'map' | 'inventory' | 'forces' | 'buildings' | 'journal';
export type ItemKind = 'Tài nguyên' | 'Trang bị' | 'Vật phẩm' | 'Bản vẽ';
export type ItemSymbol = 'wood' | 'stone' | 'ore' | 'bread' | 'cloak' | 'staff' | 'axe' | 'chest' | 'scroll' | 'potion' | 'sword' | 'ring';
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
  { id: 'territory', name: 'Lãnh địa', hint: 'Quản lý' },
  { id: 'map', name: 'Bản đồ', hint: 'Khảo sát' },
  { id: 'inventory', name: 'Kho vật phẩm', hint: 'Hình mẫu' },
  { id: 'forces', name: 'Quân lực', hint: 'Đơn vị' },
  { id: 'buildings', name: 'Công trình', hint: 'Kiến trúc' },
  { id: 'journal', name: 'Nhật ký', hint: 'Sự kiện' },
];
/** Opening site positions are exact LL01 registry coordinates in metres (+X east, +Y north).\n * They are read-only frontend projections; the site IDs and canonical registry remain authority. */
export const sites: Site[] = [
  {
    id: 'fire', entityRef: {type:'site',id:'SITE-LL01-000'}, name: 'Lửa Trại Cấp 1', subtitle: 'Lửa Sinh Tồn',
    description: 'Nguồn nhiệt sinh tồn khởi đầu. Đây là giao diện mô phỏng vị trí và tương tác; quy mô, nhiên liệu và thời gian phải do bộ mô phỏng cung cấp.',
    status: 'Đã xác nhận trong thiết lập khởi đầu', x: 0, y: 0, label: 'Lửa Trại',
  },
  {
    id: 'house', entityRef: {type:'site',id:'SITE-LL01-001'}, name: 'Nhà Lãnh Chúa Hư Hại', subtitle: 'Công trình khởi đầu',
    description: 'Một ngôi nhà bị hư hại cần tu sửa. Công thức gốc: 20 Gỗ và 10 Đá. Nút sửa chữa chưa hoạt động trong bản xem thử.',
    status: 'Chưa tu sửa tại khởi đầu', x: 40, y: 20, label: 'Nhà Lãnh Chúa',
  },
  {
    id: 'tomb', entityRef: {type:'site',id:'SITE-LL01-003'}, name: 'Ngôi Mộ Bậc 1', subtitle: 'Công trình binh chủng',
    description: 'Đường tạo quân của Ngôi Mộ tách biệt hoàn toàn với Tử Phục xác thật của Lí Lan. Bản đồ minh họa không cho thấy quân đã được tạo.',
    status: 'Tồn tại tại khởi đầu', x: -20, y: 30, label: 'Ngôi Mộ',
  },
  {
    id: 'supply', entityRef: {type:'site',id:'SITE-LL01-002'}, name: 'Hòm Vật Tư Lãnh Địa', subtitle: 'Hòm khởi đầu',
    description: 'Điểm chứa vật tư khởi đầu. Nội dung cụ thể phải lấy từ snapshot sạch và bộ mô phỏng, không suy từ dữ liệu kiểm thử.',
    status: 'Chưa mô phỏng thao tác', x: 30, y: -10, label: 'Hòm Vật Tư',
  },
];
export const itemExamples: DemoItem[] = [
  { id:'wood', name:'Gỗ', kind:'Tài nguyên', symbol:'wood', note:'Vật liệu xây dựng', detail:'Mẫu hiển thị tài nguyên gỗ. Không ngụ ý người chơi đang sở hữu số lượng nào.', origin:'Nguồn thiết kế' },
  { id:'stone', name:'Đá', kind:'Tài nguyên', symbol:'stone', note:'Vật liệu công trình', detail:'Đá dùng trong nhiều hợp đồng xây dựng; kiểm tra tồn kho chỉ khi runtime có dữ liệu.', origin:'Nguồn thiết kế' },
  { id:'ore', name:'Quặng Sắt', kind:'Tài nguyên', symbol:'ore', note:'Nguyên liệu luyện kim', detail:'Minh họa vật phẩm quặng; không khẳng định xuất hiện trong kho tại khởi đầu.', origin:'Mẫu thị giác' },
  { id:'bread', name:'Bánh Mì', kind:'Vật phẩm', symbol:'bread', note:'Lương thực', detail:'Mẫu giao diện thức ăn. Không đưa phần thưởng hoặc chiến lợi phẩm vào kho tự động.', origin:'Nguồn thiết kế' },
  { id:'cloak', name:'Áo Choàng Chống Lạnh', kind:'Trang bị', symbol:'cloak', note:'Trang bị sinh tồn', detail:'Tên trang bị được nhắc trong tài liệu thiết kế. Bản demo không cấp vật phẩm này cho Lí Lan.', origin:'Nguồn thiết kế' },
  { id:'staff', name:'Trượng Gỗ', kind:'Trang bị', symbol:'staff', note:'Vũ khí / pháp khí', detail:'Mẫu thẻ trang bị. Mọi thuộc tính và quyền sở hữu cần dữ liệu runtime.', origin:'Mẫu thị giác' },
  { id:'axe', name:'Rìu Sắt', kind:'Trang bị', symbol:'axe', note:'Công cụ khai thác', detail:'Một ví dụ về công cụ có thể xuất hiện trong danh mục. Không được tạo ra bởi việc mở màn hình.', origin:'Nguồn thiết kế' },
  { id:'chest', name:'Rương Báu', kind:'Vật phẩm', symbol:'chest', note:'Giao diện chiến lợi phẩm', detail:'Hình mẫu rương dùng để kiểm tra thẻ UI. Không hiển thị hoặc suy đoán nội dung của rương đã khóa.', origin:'Nguồn thiết kế' },
  { id:'scroll', name:'Bản Vẽ Công Trình', kind:'Bản vẽ', symbol:'scroll', note:'Bản vẽ minh họa', detail:'Không phải một bản vẽ đã học, sở hữu hoặc có hiệu lực xây dựng. Chỉ minh họa khung thẻ.', origin:'Mẫu thị giác' },
  { id:'potion', name:'Dược Tề', kind:'Vật phẩm', symbol:'potion', note:'Vật phẩm tiêu hao', detail:'Mẫu lọ thuốc không có hiệu ứng/cấp/phẩm. Không thể sử dụng trong bản demo.', origin:'Mẫu thị giác' },
  { id:'sword', name:'Kiếm Sắt', kind:'Trang bị', symbol:'sword', note:'Thẻ vũ khí', detail:'Mẫu artwork để kiểm tra vật phẩm cận chiến. Đây không phải trang bị của Lí Lan.', origin:'Mẫu thị giác' },
  { id:'ring', name:'Nhẫn Tụ Linh', kind:'Trang bị', symbol:'ring', note:'Ứng viên thiết kế', detail:'Thiết kế vật phẩm ứng viên; hiệu ứng và nguồn sở hữu chưa được materialize vào game.', origin:'Nguồn thiết kế' },
];
export const mockJournal = [
  { time: '07:00', category: 'Bối cảnh', title: 'Khởi đầu tại đồng bằng băng', text: 'Thiết lập câu chuyện: Lí Lan xuất hiện trên cổ chiến trường dưới lớp băng. Đây là tóm tắt mở cảnh, không phải lượt chơi đã giải quyết.' },
  { time: '07:00', category: 'Hệ thống', title: 'Tử Phục Linh Sư — SSS', text: 'Thiên phú đã được khóa trong hồ sơ nhân vật. Không có thao tác Tử Phục nào được thực hiện trong bản demo.' },
  { time: '—', category: 'Giao diện', title: 'Nhật ký tương tác chưa kết nối', text: 'Khi bộ mô phỏng hoàn tất, khu vực này sẽ hiển thị biên nhận sự kiện đã xác thực thay cho bản mẫu.' },
];
