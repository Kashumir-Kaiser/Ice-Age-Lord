import { itemExamples, mockJournal, screens, sites } from '../demoData';
import { CANONICAL_SITES } from '../canonicalGeography';
import { DEMO_EXPLORED, fogOpacityAt, heatRadiusM, visibilityDiscs } from '../mapModel';
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
  const ref: EntityRef = spot.kind === 'chest' ? { type: 'cache', id: spot.id }
    : spot.kind === 'site' ? { type: 'site', id: spot.id } : { type: 'resource', id: spot.id };
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
const openingBuildings = sites.map(site => ({
  id: site.entityRef.id,
  settlementId: 'SETTLEMENT-LL01-H0',
  ref: site.entityRef,
  definitionId: `FIXTURE-${site.id.toUpperCase()}-LL01`,
  name: site.name,
  x: site.x,
  y: site.y,
  orientation: 'north' as const,
  footprint: {
    kind: 'rectangle' as const,
    widthM: site.id === 'fire' ? 2 : site.id === 'tomb' ? 6 : site.id === 'house' ? 4 : 3,
    depthM: site.id === 'fire' ? 2 : site.id === 'tomb' ? 5 : site.id === 'house' ? 4 : 3,
    provenance: 'frontend-fixture' as const,
    assumptionId: 'TERRITORY-FOOTPRINTS-V1',
    note: 'Kích thước đặt hình tạm để kiểm tra bố cục; chưa phải hợp đồng vật lý nguồn.',
  },
  assetId: site.id === 'fire' ? 'campfire-start' : site.id === 'house' ? 'lord-house-damaged' : site.id === 'tomb' ? 'tomb-entry' : 'supply-crate',
  heightM: null,
  visualState: site.id === 'house' ? 'damaged' as const : undefined,
  state: site.id === 'house' ? 'Hư hại' : site.id === 'fire' ? 'Đang cháy · chỉ hình chiếu' : 'Tồn tại tại khởi đầu',
}));
const placementDefinitions = [
  { id:'fixture-polar-farmhouse', name:'Nhà Nông Phu Cực Địa · mẫu ảnh', assetId:'polar-farmhouse-l01', footprint:{kind:'rectangle' as const,widthM:4,depthM:3,provenance:'frontend-fixture' as const,assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',note:'Diện tích 12 m² theo nguồn; kích thước 4 × 3 m chỉ để xem thử.'},orientations:['north'] as const,status:'fixture-only' as const },
  { id:'fixture-palisade-wall', name:'Tường Rào · mẫu ảnh', assetId:'opening-palisade-wall', footprint:{kind:'rectangle' as const,widthM:10,depthM:1,provenance:'frontend-fixture' as const,assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',note:'10 m dài theo nguồn; bề dày 1 m chỉ để xem thử.'},orientations:['north'] as const,status:'fixture-only' as const },
  { id:'fixture-timber-gate', name:'Cổng Gỗ · mẫu ảnh', assetId:'opening-timber-gate', footprint:{kind:'rectangle' as const,widthM:3,depthM:2,provenance:'frontend-fixture' as const,assumptionId:'ART-ONLY-PREVIEW-FOOTPRINT-V1',note:'Rộng 3 m theo nguồn; bề dày 2 m là mẫu thử.'},orientations:['north'] as const,status:'fixture-only' as const },
  { id:'fixture-low-house', name:'Nhà thấp · fixture', assetId:'lord-house-damaged', footprint:{kind:'rectangle' as const,widthM:4,depthM:4,provenance:'frontend-fixture' as const,assumptionId:'TERRITORY-FOOTPRINTS-V1',note:'4 × 4 m là kích thước giả định để thử bố trí, không phải kích thước luật.'}, orientations:['north','east','south','west'] as const, status:'fixture-only' as const },
  { id:'fixture-tall-tower', name:'Tháp cao · fixture', assetId:'fixture-tall-tower', footprint:{kind:'rectangle' as const,widthM:5,depthM:4,provenance:'frontend-fixture' as const,assumptionId:'TERRITORY-FOOTPRINTS-V1',note:'5 × 4 m là kích thước giả định để thử bố trí, không phải kích thước luật.'}, orientations:['north','east','south','west'] as const, status:'fixture-only' as const },
  { id:'fixture-fire-max', name:'Mẫu lửa tối đa · fixture', assetId:'fixture-fire-max', footprint:{kind:'rectangle' as const,widthM:8,depthM:8,provenance:'frontend-fixture' as const,assumptionId:'TERRITORY-FOOTPRINTS-V1',note:'8 × 8 m là kích thước giả định để thử bố trí, không phải kích thước luật.'}, orientations:['north','east','south','west'] as const, status:'fixture-only' as const },
];
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
      units: [],
      settlement: {
        id: 'SETTLEMENT-LL01-H0',
        worldOrigin: { x: 0, y: 0 },
        fireRef: { type: 'site', id: 'SITE-LL01-000' },
        fireLevel: 1,
        fireActive: true,
        heatRadiusM: heatRadiusM(1, true),
        buildings: openingBuildings,
        obstacles: [],
        knowledge: 'demo-fixture',
      },
      placementDefinitions,
      territoryObjectives,
      visibleMap,
    };
  }

  getPlayerView(): PlayerView { return this.view; }

  getVisibleMap(settings: PreviewMapSettings): VisibleMap {
    const spots = visibleMapSpots(false);
    const settlementSite = openingSites.find(site => site.ref.id === 'SITE-LL01-000')!;
    const projectedSites = [{
      ...settlementSite,
      settlementId: 'SETTLEMENT-LL01-H0',
      currentSight: fogOpacityAt(settlementSite.x ?? 0, settlementSite.y ?? 0, settings.clockMinutes, settings.fireLevel, settings.fireActive) < .12,
    }];
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
