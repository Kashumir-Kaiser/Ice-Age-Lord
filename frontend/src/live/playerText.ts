import type { PlayerView } from '../../../packages/contracts/src/index.ts';

type Container = PlayerView['inventory']['containers'][number];

const ITEM_NAMES: Readonly<Record<string,string>> = {
  'CONVENIENCE-CUP-NOODLES': 'Mì ly ăn liền',
  'CONVENIENCE-ROASTED-NUTS': 'Hạt rang',
  'CONVENIENCE-COFFEE-330ML': 'Cà phê đóng lon 330 ml',
  'DISPOSABLE-PAPER-NAPKIN-AND-CHOPSTICKS': 'Khăn giấy và đũa dùng một lần',
  'BREAD': 'Bánh mì',
  'WOOD': 'Gỗ',
  'STONE': 'Đá',
  'STONE-HAMMER': 'Búa đá',
  'RAW-ICE-WATER': 'Nước băng chưa xử lý',
  'BROWN-COAL': 'Than nâu',
  'RAW-SALT': 'Muối thô',
  'WILD-FOOD': 'Thực phẩm hoang dã',
};

const TOKEN_NAMES: Readonly<Record<string,string>> = {
  CONVENIENCE:'', CUP:'ly', NOODLES:'mì', ROASTED:'rang', NUTS:'hạt',
  COFFEE:'cà phê', DISPOSABLE:'dùng một lần', PAPER:'giấy', NAPKIN:'khăn',
  AND:'và', CHOPSTICKS:'đũa', FOOD:'thực phẩm', BAG:'túi',
  BREAD:'bánh mì', WOOD:'gỗ', STONE:'đá', WATER:'nước',
  IRON:'sắt', SWORD:'kiếm', AXE:'rìu', SHIELD:'khiên',
  LEATHER:'da', FUR:'lông thú', CLOTH:'vải', COAL:'than',
  SALT:'muối', ICE:'băng', HAMMER:'búa', RAW:'thô',
  CHEST:'rương', BLUEPRINT:'bản vẽ', GRAIN:'lương thực',
};

/** Display names never change item IDs, recipes, storage, trades or quantities. */
export function playerItemName(idOrName: string | null | undefined): string {
  if (!idOrName) return 'Vật phẩm chưa xác định';
  if (ITEM_NAMES[idOrName]) return ITEM_NAMES[idOrName];
  // Already a named item, not a registry identifier: preserve its authored name.
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(idOrName) || !idOrName.includes('-') && !/^[A-Z0-9]+$/.test(idOrName)) return idOrName;
  return idOrName.replace(/[-_]+/g, ' ').split(' ')
    .map(token => TOKEN_NAMES[token] ?? token.toLocaleLowerCase('vi-VN'))
    .filter(Boolean).join(' ') || 'Vật phẩm chưa xác định';
}

export function playerContainerName(label: string): string {
  if (/^carried food bag$/i.test(label)) return 'Túi thực phẩm mang theo';
  if (/^.+ pack$/i.test(label)) return 'Túi của ' + label.replace(/ pack$/i,'');
  if (/^carried bag$/i.test(label)) return 'Túi mang theo';
  return playerItemName(label);
}

export function playerBlueprintName(view: PlayerView, id: string | null | undefined): string {
  if (!id) return 'Bản vẽ chưa rõ tên';
  return view.construction.blueprints.find(blueprint => blueprint.id === id)?.name ?? 'Bản vẽ chưa rõ tên';
}

export function playerOwnerName(view: PlayerView, id: string | null | undefined): string {
  if (!id) return 'Chưa xác định';
  if (id === view.player.id) return view.player.name;
  return view.units.find(unit => unit.id === id)?.name ?? 'Đơn vị chưa rõ tên';
}

export function playerStorageLocation(view: PlayerView, container: Container): string {
  switch (container.location.kind) {
    case 'carried': return `${playerOwnerName(view, container.location.ownerId)} đang mang`;
    case 'unit': return `Hành trang của ${playerOwnerName(view, container.location.unitId)}`;
    case 'building': {
      const buildingId = container.location.buildingId;
      const building = view.territory.buildings.find(b => b.id === buildingId);
      return building ? `Trong ${building.name}` : 'Trong công trình';
    }
    case 'site': {
      const siteId = container.location.siteId;
      const site = view.visibleMap.entities.find(e => e.ref.id === siteId);
      return site ? `Tại ${site.label}` : 'Tại địa điểm đã biết';
    }
    default: return 'Vị trí chưa rõ';
  }
}

export function playerStatus(status: string | null | undefined): string {
  if (!status) return 'Chưa xác định';
  const labels: Readonly<Record<string,string>> = {
    active:'Đang hoạt động', paused:'Tạm dừng', blocked:'Bị gián đoạn',
    running:'Đang chạy', stopped:'Đã dừng', observing:'Đang theo dõi',
    damaged:'Hư hại', destroyed:'Đã bị phá hủy', under_construction:'Đang xây',
    repaired:'Đã sửa chữa', completed:'Hoàn thành', pending:'Đang chờ',
    locked:'Chưa mở khóa', available:'Sẵn sàng', open:'Đang mở',
    accepted:'Đã nhận', resolved:'Đã kết thúc', idle:'Đang nghỉ',
    returning:'Đang trở về', sweeping:'Đang tìm kiếm', harvesting:'Đang thu thập',
    weather_unresolved:'Chưa có thông tin thời tiết',
    paused_by_user:'Đã tạm dừng', extinguished:'Đã tắt',
    day:'Ban ngày', night:'Ban đêm', twilight:'Chạng vạng',
    queued:'Đang chờ', success:'Thành công', failed:'Không thành công',
    verified:'Đã xác nhận', unknown:'Chưa biết', normal:'Bình thường',
  };
  return labels[status] ?? status.replace(/_/g, ' ').toLocaleLowerCase('vi-VN');
}

export function playerElapsed(elapsedMs: number | null | undefined): string {
  if (elapsedMs == null) return 'chưa rõ';
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} giờ ${String(minutes).padStart(2,'0')} phút từ lúc bắt đầu`;
}

/** Only for narrative display. Does not touch authoritative errors or commands. */
export function playerMessage(message: string | null | undefined): string {
  if (!message) return 'Đang chờ cập nhật.';
  return message
    .replace(/\b(?:P0\d?|H0|LL01(?:-[A-Z0-9]+)*)\b/g, 'giai đoạn đầu')
    .replace(/\bWU\/h\b/g, 'đơn vị công việc mỗi giờ')
    .replace(/\bWU\b/g, 'đơn vị công việc')
    .replace(/\b(?:server[- ]owned|server[- ]safe|server[- ]knowledge|API player view)\b/gi, 'trong lượt chơi')
    .replace(/\b(?:revision|event sequence)\s*#?\d+\b/gi, '')
    .trim();
}
