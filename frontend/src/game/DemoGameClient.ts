import { itemExamples, mockJournal, screens, sites } from '../demoData';
import { CANONICAL_SITES } from '../canonicalGeography';
import { DEMO_EXPLORED, fogOpacityAt, visibilityDiscs } from '../mapModel';
import { visibleMapSpots } from '../worldFeatures';
import type { EntityRef, EntityView, GameClient, PlayerView, PreviewMapSettings, VisibleMap } from './GameClient';

const denied = (action: string, reason: string) => ({ action, enabled: false, reason });
const readOnlyActions = [denied('gameplay', 'Bộ mô phỏng chưa kết nối; thao tác chỉ được xem trong bản demo.')];
const keyOf = (ref: EntityRef) => `${ref.type}:${ref.id}`;

function siteView(site: typeof sites[number]): EntityView {
  const source = CANONICAL_SITES.find(candidate => candidate.id === site.entityRef.id);
  return {
    ref: site.entityRef,
    name: site.name,
    iconKind: site.id,
    label: site.label,
    description: site.description,
    status: site.status,
    provenance: 'canonical',
    knowledge: 'current',
    currentSight: true,
    x: source?.x ?? site.x,
    y: source?.y ?? site.y,
    actions: readOnlyActions,
  };
}

function spotView(spot: ReturnType<typeof visibleMapSpots>[number], currentSight: boolean): EntityView {
  const ref: EntityRef = spot.kind === 'chest' ? { type: 'cache', id: spot.id } : { type: 'resource', id: spot.id };
  let resourceBalance: EntityView['resourceBalance'];
  if (spot.id === 'MODELED-SALVAGE-01') resourceBalance = { material: 'Gỗ', unit: 'Gỗ', remaining: 0, capacity: 18, reserved: 0, reachable: true };
  if (spot.id === 'MODELED-STONE-01') resourceBalance = { material: 'Đá', unit: 'Đá', remaining: 18, capacity: 40, reserved: 6, reachable: false };
  return {
    ref,
    name: spot.name,
    iconKind: spot.kind,
    label: spot.label,
    description: spot.detail,
    status: spot.knowledge === 'remembered' ? 'Thông tin lần cuối nhìn thấy' : 'Fixture bản demo',
    provenance: spot.provenance,
    knowledge: spot.knowledge,
    currentSight,
    ...(spot.lastSeenAt ? { lastSeenAt: spot.lastSeenAt } : {}),
    x: spot.x,
    y: spot.y,
    ...(resourceBalance ? { resourceBalance } : {}),
    actions: [denied(spot.kind === 'chest' ? 'open' : 'harvest', 'Không có thao tác chơi trong bộ điều hợp demo.')],
  };
}

function itemView(item: typeof itemExamples[number]): EntityView {
  return {
    ref: { type: 'item', id: item.id },
    name: item.name,
    iconKind: item.symbol,
    label: item.kind,
    description: item.detail,
    status: 'Artwork mẫu · Chưa xác định sở hữu',
    provenance: 'sample',
    knowledge: 'current',
    currentSight: false,
    actions: [denied('use', 'Artwork không phải vật phẩm sở hữu; hành động sử dụng chưa kết nối.')],
  };
}

const openingSites = sites.map(siteView);
const itemViews = itemExamples.map(itemView);
const visibleTerrain = {
  forest: CANONICAL_SITES.find(site => site.id === 'SITE-LL01-040')!,
  stone: CANONICAL_SITES.find(site => site.id === 'SITE-LL01-041')!,
  water: CANONICAL_SITES.find(site => site.id === 'SITE-LL01-042')!,
};
const forceFixtures = [
  { icon: 'shield' as const, title: 'Quân Ngôi Mộ', text: 'Được tạo thông qua công trình binh chủng, không nhận XP phản chiếu của Tử Phục.' },
  { icon: 'sparkles' as const, title: 'Tử thi Tử Phục', text: 'Chỉ xuất hiện từ xác thật hợp lệ đã được Lí Lan chuyển hóa; danh tính từng đơn vị được bảo toàn.' },
  { icon: 'users' as const, title: 'Anh hùng', text: 'Đơn vị có danh tính, xuất thân và năng lực thực tế; không được phát miễn phí từ khung thẻ.' },
];
const territoryObjectives = [
  { id: 'fire' as const, title: 'Duy trì Lửa Sinh Tồn', detail: 'Quản trị nhiên liệu và nhiệt độ sau khi runtime được triển khai.' },
  { id: 'house' as const, title: 'Tu sửa Nhà Lãnh Chúa', detail: 'Điều kiện nguồn: 20 Gỗ và 10 Đá. Chưa thể thực hiện trong demo.' },
  { id: 'tomb' as const, title: 'Quản lý Ngôi Mộ', detail: 'Cơ chế sinh quân riêng; không tự động tạo đơn vị ở khởi đầu.' },
];

/** Local adapter for the presentation prototype. It returns only its declared fixture
 * projection to screens, never treats browser data as authoritative game state.
 */
export class DemoGameClient implements GameClient {
  private readonly entityIndex = new Map<string, EntityView>();
  private readonly view: PlayerView;

  constructor() {
    for (const entity of [...openingSites, ...itemViews]) this.entityIndex.set(keyOf(entity.ref), entity);
    const visibleMap = this.getVisibleMap({ clockMinutes: 420, fireLevel: 1, fireActive: true, sourceAtlas: false });
    for (const entity of visibleMap.entities) this.entityIndex.set(keyOf(entity.ref), entity);
    this.view = {
      revision: 0,
      demoMode: true,
      screens,
      sites,
      buildings: sites,
      items: itemExamples,
      journal: mockJournal,
      forces: forceFixtures,
      territoryObjectives,
      visibleMap,
    };
  }

  getPlayerView(): PlayerView { return this.view; }

  getVisibleMap(settings: PreviewMapSettings): VisibleMap {
    const spots = visibleMapSpots(false);
    const projectedSites = openingSites.map(site => ({
      ...site,
      currentSight: fogOpacityAt(site.x ?? 0, site.y ?? 0, settings.clockMinutes, settings.fireLevel, settings.fireActive) < .12,
    }));
    const entities = [
      ...projectedSites,
      ...spots.map(spot => spotView(spot, fogOpacityAt(spot.x, spot.y, settings.clockMinutes, settings.fireLevel, settings.fireActive) < .12)),
    ];
    const developerEntities = settings.sourceAtlas
      ? visibleMapSpots(true)
        .filter(spot => spot.knowledge === 'unknown')
        .map(spot => spotView(spot, false))
      : [];
    return {
      revision: 0,
      discoveryIds: entities.map(entity => keyOf(entity.ref)).sort(),
      entities,
      developerEntities,
      sight: visibilityDiscs(settings.clockMinutes, settings.fireLevel, settings.fireActive),
      explored: DEMO_EXPLORED,
      terrain: visibleTerrain,
    };
  }

  inspectEntity(ref: EntityRef): EntityView | null {
    const entity = this.entityIndex.get(keyOf(ref));
    return entity ? { ...entity, actions: [...entity.actions] } : null;
  }

  async submitCommand(_command: Parameters<GameClient['submitCommand']>[0]) {
    return {
      accepted: false,
      revision: this.view.revision,
      code: 'demo-command-unsupported',
      message: 'Bản demo không thực hiện lệnh chơi hoặc thay đổi trạng thái.',
    };
  }

  subscribe(listener: (view: PlayerView) => void) {
    listener(this.view);
    return () => undefined;
  }
}

export const demoGameClient = new DemoGameClient();
