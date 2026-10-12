export const LIVE_SCREENS = [
  { id: 'overview', name: 'Tổng quan', hint: 'Trạng thái phiên' },
  { id: 'character', name: 'Nhân vật', hint: 'Hồ sơ máy chủ' },
  { id: 'territory', name: 'Lãnh địa', hint: 'Công trình chính' },
  { id: 'map', name: 'Bản đồ', hint: 'Dữ liệu đã biết' },
  { id: 'inventory', name: 'Kho vật phẩm', hint: 'Đã quan sát' },
  { id: 'forces', name: 'Quân lực', hint: 'Đơn vị sở hữu' },
  { id: 'buildings', name: 'Công trình', hint: 'Trạng thái API' },
  { id: 'events', name: 'Sự kiện', hint: 'Mục tiêu và phần thưởng' },
  { id: 'journal', name: 'Nhật ký', hint: 'Event ledger' },
] as const;

export type LiveScreen = typeof LIVE_SCREENS[number]['id'];

export function isLiveScreen(value: string): value is LiveScreen {
  return LIVE_SCREENS.some(screen => screen.id === value);
}
