import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle, ArrowRight, Bell, CalendarDays, CheckCircle2, Eye, Flame, Hammer, Map as MapIcon,
  MapPin, PackageOpen, RefreshCw, ScrollText, Shield, Sparkles, UserRound, Users, Layers,
} from 'lucide-react';
import type {
  ActionAvailability, ClockSpeedSelection, CommandEnvelope, CommandPayloadByType, CommandType,
  CoordinateMm, EntityRef, PlayerEntityView, PlayerView,
} from '../../packages/contracts/src/index.ts';
import type { PlayerEvent, SaveSummary } from '../../packages/contracts/src/api.ts';
import { MarkerGraphic } from './map/MapLayers';
import { BotSettlementScene } from './map/BotSettlementScene';
import { entityRefKey, GameApiError, HttpGameClient } from './live/HttpGameClient';
import { SaveResponseScopeGate } from './live/saveScope';
import { LIVE_SCREENS, type LiveScreen } from './live/screens';
import TerritoryScene from './territory/TerritoryScene';
import MapCanvas from './rendering/MapCanvas';
import { liveExplorationSnapshot, liveTerrainRegions } from './rendering/MapSceneAdapter';
import { artForLiveBuildingKind, territorySceneFromApi } from './live/territoryAdapter';
import LiveOverview from './live/LiveOverview';
import LiveCharacterLoadout from './live/LiveCharacterLoadout';
import { playerBlueprintName, playerContainerName, playerElapsed, playerItemName, playerMessage, playerOwnerName, playerStatus, playerStorageLocation } from './live/playerText';
import type { EntityRef as DemoEntityRef, LayoutDraft } from './game/GameClient';
import type { TerritoryCamera } from './territory/projection';
import type { ReadabilityMode } from './territory/BuildingSprite';
import { EventBoard } from './shared/EventBoard';
import { CharacterSummary, PageFrame, ScreenHeading } from './shared/PageFrame';
import { InspectorFrame, InspectorHeading } from './shared/InspectorFrame';
import { OpeningRankingBoard } from './shared/OpeningRankingBoard';

type Screen = LiveScreen;
type Feedback = { kind: 'idle' | 'saving' | 'committed' | 'rejected' | 'disconnected'; text: string };
const SAVE_KEY = 'ice-age-lord.live.last-save';
const CREATE_KEY_PREFIX = 'ice-age-lord.live.create-key:';
const RESOURCE_CARGO_IDS = new Set(['WOOD', 'STONE', 'ORE', 'POTABLE-WATER', 'FIREWOOD', 'RAW-ICE-WATER', 'BROWN-COAL', 'RAW-SALT', 'WILD-FOOD']);
const ITEM_ART_BY_TEMPLATE: Readonly<Record<string, string>> = {
  WOOD: 'wood', STONE: 'stone', ORE: 'ore', BREAD: 'bread', 'WOODEN-STAFF': 'staff',
  'STONE-AXE': 'axe', 'STONE-HAMMER': 'stone-hammer', 'IRON-POT': 'iron-pot',
  'WOODEN-ROUND-SHIELD': 'round-shield', 'CONVENIENCE-FOOD-BAG': 'convenience-bag',
  'RAW-ICE-WATER': 'water', 'RAW-SALT': 'salt', 'BROWN-COAL': 'ore',
};

function itemArtPath(templateId: string): string | null {
  const asset = ITEM_ART_BY_TEMPLATE[templateId];
  return asset ? `/assets/items/${asset}.svg` : null;
}

function liveMapMarkerKind(entity: PlayerEntityView): string {
  if (entity.ref.type === 'site') {
    if (entity.ref.id === 'SITE-LL01-000') return 'fire';
    if (entity.ref.id === 'SITE-LL01-001') return 'house';
    if (entity.ref.id === 'SITE-LL01-002') return 'supply';
    if (entity.ref.id === 'SITE-LL01-003') return 'tomb';
    return 'site';
  }
  if (entity.ref.type === 'cache') return 'chest';
  if (entity.ref.type === 'resource') {
    const materialIds = entity.resourceDeposit?.materials.map(material => material.materialId) ?? [];
    if (materialIds.includes('WOOD')) return 'wood';
    if (materialIds.includes('STONE')) return 'stone';
    if (materialIds.some(id => id === 'BROWN-COAL' || id === 'ORE')) return 'ore';
    if (materialIds.includes('RAW-SALT')) return 'salt';
    if (materialIds.includes('WILD-HERBS')) return 'herbs';
    return 'water';
  }
  return 'site';
}

const screenIcons: Record<Screen, typeof Sparkles> = {
  overview: Sparkles,
  character: UserRound,
  territory: Shield,
  map: MapIcon,
  inventory: PackageOpen,
  forces: Users,
  buildings: Hammer,
  events: CalendarDays,
  journal: ScrollText,
};
const navigation = LIVE_SCREENS.map(screen => ({ ...screen, icon: screenIcons[screen.id] }));

function commandFor<T extends CommandType>(
  view: PlayerView,
  type: T,
  payload: CommandPayloadByType[T],
): CommandEnvelope {
  return {
    schemaVersion: 1,
    saveId: view.saveId,
    commandId: crypto.randomUUID(),
    expectedRevision: view.revision,
    type,
    payload,
  } as CommandEnvelope;
}

function errorMessage(error: unknown): string {
  if (error instanceof GameApiError) return error.displayText;
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
}

function availabilityMessage(availability: ActionAvailability): string {
  const messages: Record<string, string> = {
    CORPSE_NOT_FOUND: 'Không tìm thấy thi thể này.',
    CORPSE_NOT_KNOWN: 'Hãy tìm thấy thi thể trước khi tương tác.',
    CORPSE_NOT_INSPECTED: 'Hãy kiểm tra thi thể trước khi Tử Phục.',
    CORPSE_ALREADY_REVIVED: 'Thi thể này đã được dùng để Tử Phục.',
    CORPSE_ALREADY_BUTCHERED: 'Thi thể này đã bị phân giải.',
    CORPSE_DESTROYED: 'Thi thể không còn nguyên vẹn.',
    SECOND_DEATH_LOCKED: 'Thi thể đã tử vong lần thứ hai và không thể được Tử Phục lại.',
    CORPSE_INTEGRITY_ZERO: 'Thi thể không còn độ nguyên vẹn.',
    CORPSE_INTEGRITY_UNKNOWN: 'Chưa ghi nhận được độ nguyên vẹn của thi thể.',
    CORPSE_EQUIPMENT_RECORD_INCOMPLETE: 'Chưa thể đối chiếu trang bị đang giữ với hồ sơ thi thể.',
    CORPSE_GEAR_ALREADY_TRANSFERRED: 'Trang bị của thi thể đã được thu hồi.',
    CORPSE_BODY_PROFILE_INCOMPLETE: 'Thiếu dữ liệu cần thiết về cơ thể này.',
    CORPSE_NOT_ACCESSIBLE: 'Hãy đến gần hoặc mang thi thể tới Lí Lan.',
    SEAL_BLOCKS_TU_PHUC: 'Phong ấn trên thi thể chặn Tử Phục.',
    DEATH_TRACE_PURGED: 'Dấu vết tử vong đã bị xóa.',
    HOLY_DIRECT_REVIVE_LOCKED: 'Thi thể Thánh này có hạn chế Tử Phục riêng.',
    HOLY_FIELD_EXCESS: 'Trường Thánh vượt giới hạn Tử Phục.',
    HOLY_TIER_TRANSFORM_UNAVAILABLE: 'Bậc của thi thể không thể chuyển đổi hợp lệ.',
    CORPSE_TIER_EXCEEDS_REVIVER: 'Bậc của thi thể vượt quá Bậc hiện tại của Lí Lan.',
    EQUIPMENT_PROFILE_NOT_COMPILED: 'Chưa có sơ đồ trang bị cho đơn vị này.',
    UNIT_NOT_ACCESSIBLE: 'Đưa đơn vị và vật phẩm tới gần nhau trước khi trang bị.',
    ITEM_NOT_ACCESSIBLE: 'Vật phẩm không nằm trong túi có thể tiếp cận.',
    EQUIPMENT_TAG_MISMATCH: 'Vật phẩm không vừa với ô trang bị này.',
    EQUIPMENT_SLOT_OCCUPIED: 'Ô trang bị này đã có vật phẩm.',
    ITEM_ALREADY_EQUIPPED: 'Vật phẩm đã được trang bị.',
    COMBAT_ACTOR_REQUIRED: 'Hãy Tử Phục một đơn vị có thể chiến đấu trước.',
    COMBAT_ACTOR_NOT_OWNED: 'Chỉ đơn vị thuộc quyền Lí Lan mới có thể nhận lệnh.',
    COMBAT_ACTOR_BUSY: 'Đơn vị đang bận với một công việc khác.',
    UNIT_IN_COMBAT: 'Không thể thay trang bị khi đơn vị đang giao chiến.',
    ACTOR_IN_COMBAT: 'Đơn vị phải rút khỏi giao chiến trước khi di chuyển.',
    TARGET_OUT_OF_RANGE: 'Đơn vị chưa vào tầm vũ khí của mục tiêu.',
    TARGET_NOT_PERCEIVED: 'Đơn vị chưa nhận ra mục tiêu giữa tuyết.',
    COMBAT_TARGET_UNAVAILABLE: 'Mục tiêu không còn trong tầm giao chiến.',
    COMBAT_TARGET_DEAD: 'Cá thể này đã chết; hãy kiểm tra thi thể thật trên bản đồ.',
    COMBAT_ENCOUNTER_NOT_ACTIVE: 'Không có trận chiến đang diễn ra để rút lui.',
    COMBAT_WEAPON_REQUIRED: 'Trang bị vũ khí tương thích vào ô tay chính trước khi giao chiến.',
  };
  const reasonCode = availability.reasonCode;
  if (reasonCode && messages[reasonCode]) return messages[reasonCode];
  const reason = availability.requirements.join(' ');
  return reason ? 'Chưa đủ điều kiện thực hiện hành động này.' : 'Hành động hiện không khả dụng.';
}

function territoryRef(ref: EntityRef | null): DemoEntityRef | null {
  if (!ref) return null;
  switch (ref.type) {
    case 'site': case 'resource': case 'cache': case 'item': case 'unit':
      return { type: ref.type, id: ref.id };
    default:
      return null;
  }
}

function harvestBlockerMessage(availability: ActionAvailability): string {
  const messages: Readonly<Record<string, string>> = {
    ACTOR_ALREADY_TRAVELLING: 'Đơn vị đang di chuyển.',
    ACTOR_ASSIGNED_TO_SEARCH: 'Đơn vị đang đi tìm kiếm.',
    ACTOR_ASSIGNED_TO_HARVEST: 'Đơn vị đang thu thập.',
    REQUIRED_TOOL_NOT_CARRIED: 'Đơn vị chưa có dụng cụ cần thiết.',
    LOAD_CAPACITY_EXCEEDED: 'Hãy dỡ bớt hàng trước khi thu thập.',
    NO_KNOWN_ROUTE: 'Chưa tìm thấy đường đi đến nơi này.',
    NO_SUPPORTED_ROUTE: 'Đơn vị chưa có đường đi phù hợp.',
    UNDERGROUND_ACCESS_REQUIRED: 'Cần có lối vào khu vực dưới lòng đất.',
    INSUFFICIENT_RESOURCE: 'Tài nguyên còn lại đã hết hoặc đang được dành cho công việc khác.',
    PROSPECTING_CONTRACT_NOT_COMPILED: 'Cần khảo sát khu vực trước khi khai thác.',
    WATER_PREPARATION_CONTRACT_NOT_COMPILED: 'Cần xử lý nước trước khi sử dụng.',
    WORKFORCE_AND_FUEL_REQUIREMENTS_NOT_MET: 'Cần đủ nhân công và nhiên liệu để bắt đầu.',
  };
  return messages[availability.reasonCode ?? ''] ?? 'Hiện chưa thể thu thập, hãy kiểm tra điều kiện của khu vực và đơn vị.';
}

function sameRef(a: EntityRef | null, b: EntityRef | null): boolean {
  return Boolean(a && b && a.type === b.type && a.id === b.id);
}

function entityLabel(entity: PlayerEntityView | null): string {
  return entity?.label || 'Điểm trên bản đồ';
}

function StatusBanner({ feedback, retry }: { feedback: Feedback; retry?: () => void }) {
  if (feedback.kind === 'idle') return null;
  const Icon = feedback.kind === 'committed' ? CheckCircle2 : feedback.kind === 'saving' ? RefreshCw : AlertCircle;
  return <div className={'live-notice live-notice--' + feedback.kind} role={feedback.kind === 'rejected' || feedback.kind === 'disconnected' ? 'alert' : 'status'}>
    <Icon size={17} className={feedback.kind === 'saving' ? 'live-spin' : ''} />
    <span>{feedback.text}</span>
    {retry && <button className="live-text-button" onClick={retry}>Gửi lại cùng mã lệnh</button>}
  </div>;
}

function elapsedLabel(elapsedMs: number | null): string {
  if (elapsedMs === null) return 'chưa có mốc';
  return playerElapsed(elapsedMs);
}

function RuntimeStrip({ view }: { view: PlayerView }) {
  const { survivalFire, tomb } = view.territory;
  const dayTime = `Ngày ${view.worldClock.day} · ${String(view.worldClock.hour).padStart(2, '0')}:${String(view.worldClock.minute).padStart(2, '0')}`;
  const cold = view.survival.coldStatus === 'weather_unresolved'
    ? 'Chưa có thông tin thời tiết ban đầu'
    : playerStatus(view.survival.coldStatus);
  const fuel = survivalFire.fuelRemaining === null ? 'Chưa rõ lượng nhiên liệu' : `${survivalFire.fuelRemaining} gỗ`;
  const catchingUp = view.clockStatus.catchingUp
    ? `Đang cập nhật thời gian tới ${elapsedLabel(view.clockStatus.targetSimElapsedMs)}`
    : dayTime;
  return <section className="live-stage-strip" aria-label="Trạng thái thế giới">
    <div><span>Thế giới</span><strong>{catchingUp}</strong><small>{playerStatus(view.worldClock.lightPhase)}</small></div>
    <div><span>Lửa trại</span><strong>{survivalFire.active ? 'Đang hoạt động' : 'Đã tắt'} · {fuel}</strong><small>{survivalFire.fuelBlocker ? playerMessage(survivalFire.fuelBlocker) : `Vùng nhiệt ${survivalFire.heatRadiusMetres} m · lần cháy tiếp theo ${elapsedLabel(survivalFire.nextFuelConsumptionAtElapsedMs)}`}</small></div>
    <div><span>Sinh tồn</span><strong>{cold}</strong><small>{view.survival.blocker ? playerMessage(view.survival.blocker) : `Tình trạng đói: ${playerStatus(view.survival.hungerState)}`}</small></div>
    <div><span>Mộ</span><strong>{tomb.activeCount}/{tomb.productionSlots} ô · {tomb.deathQi.current}/{tomb.deathQi.capacity} Tử Khí</strong><small>{tomb.queuedCount} chờ · hoàn tất {elapsedLabel(tomb.nextCompletionAtElapsedMs)} · {view.units.length} đơn vị</small></div>
  </section>;
}

function TombQueueList({ view, working, blocked, onCancel }: {
  view: PlayerView;
  working: boolean;
  blocked: boolean;
  onCancel: (jobId: string) => void;
}) {
  if (view.territory.tomb.queue.length === 0) return <p className="live-empty-state">Hàng đợi Mộ đang trống.</p>;
  return <ul className="live-plain-list">{view.territory.tomb.queue.map(job => {
    const progress = view.jobs.find(item => item.id === job.id)?.progressPercent;
    return <li key={job.id}>
      <strong>{job.status === 'active' ? 'Đang sản xuất' : job.status === 'blocked' ? 'Tạm gián đoạn' : job.status === 'queued' ? 'Đang chờ ô' : playerStatus(job.status)} · Cương thi</strong>
      <span>{job.status === 'active' ? `${Math.floor(progress ?? 0)}% · xong ${elapsedLabel(job.completesAtElapsedMs)}` : `Tử Khí giữ ${job.reservedDeathQi}`}</span>
      {(job.status === 'queued' || job.status === 'blocked') && <button className="live-text-button" disabled={working || blocked} onClick={() => onCancel(job.id)}>Hủy</button>}
    </li>;
  })}</ul>;
}

function LiveApp({ entryIntent = 'either', onExit }: { entryIntent?: 'new' | 'load' | 'either'; onExit?: () => void }) {
  const [client] = useState(() => new HttpGameClient());
  const [saveScope] = useState(() => new SaveResponseScopeGate());
  const [apiState, setApiState] = useState<'checking' | 'ready' | 'disconnected'>('checking');
  const [apiMessage, setApiMessage] = useState('');
  const [ownerKey, setOwnerKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [saves, setSaves] = useState<readonly SaveSummary[]>([]);
  const [pickerIntent, setPickerIntent] = useState<'new' | 'load' | 'either'>(entryIntent);
  const [slotName, setSlotName] = useState('Lãnh Địa Mới');
  const [view, setView] = useState<PlayerView | null>(null);
  const territorySettlement = useMemo(() => view ? territorySceneFromApi(view) : null, [view?.territory, view?.visibleMap]);
  const [events, setEvents] = useState<readonly PlayerEvent[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const eventSequenceRef = useRef(0);
  const [screen, setScreen] = useState<Screen>('overview');
  const [selectedRef, setSelectedRef] = useState<EntityRef | null>(null);
  const [territoryCamera, setTerritoryCamera] = useState<TerritoryCamera | null>(null);
  const [territoryDrafts, setTerritoryDrafts] = useState<LayoutDraft[]>([]);
  const [territoryReadability, setTerritoryReadability] = useState<ReadabilityMode>('normal');
  const [followTerritoryPlayer, setFollowTerritoryPlayer] = useState(false);
  const [combatActorId, setCombatActorId] = useState('');
  const [selectedCombatTargetId, setSelectedCombatTargetId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<CommandEnvelope | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle', text: '' });
  const [customSpeed, setCustomSpeed] = useState('10');
  const [customSelection, setCustomSelection] = useState(false);
  const [chooseDestination, setChooseDestination] = useState(false);
  // Open on H0's local resource area so its heat radius and starter deposits
  // have enough screen space to read. The overview control returns to region scale.
  const [mapZoom, setMapZoom] = useState(400);
  const [mapOffsetMm, setMapOffsetMm] = useState({ xMm: 0, yMm: 0 });
  const mapDrag = useRef<{ pointerId: number; startX: number; startY: number; startOffsetX: number; startOffsetY: number; moved: boolean } | null>(null);
  const suppressMapClick = useRef(false);
  const [destination, setDestination] = useState<CoordinateMm | null>(null);
  const [destinationAvailability, setDestinationAvailability] = useState<ActionAvailability | null>(null);
  const [searchRadiusMetres, setSearchRadiusMetres] = useState(500);
  const [dispatchLeadActorId, setDispatchLeadActorId] = useState('LI_LAN');
  const [dispatchAdditionalActorIds, setDispatchAdditionalActorIds] = useState<string[]>([]);
  const [dispatchCenter, setDispatchCenter] = useState<CoordinateMm | null>(null);
  const [chooseDispatchCenter, setChooseDispatchCenter] = useState(false);
  const [dispatchTargetCount, setDispatchTargetCount] = useState('');
  const [dispatchTimeLimitMinutes, setDispatchTimeLimitMinutes] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'chest' | 'hunt'>('chest');
  const [dispatchPreview, setDispatchPreview] = useState<ActionAvailability | null>(null);
  const [huntActorId, setHuntActorId] = useState('');
  const [travelActorId, setTravelActorId] = useState('LI_LAN');
  const [harvestActorId, setHarvestActorId] = useState('LI_LAN');
  const [harvestQuantity, setHarvestQuantity] = useState(1);
  const [harvestAvailability, setHarvestAvailability] = useState<Readonly<Record<string, ActionAvailability>>>({});
  const [constructionContainerId, setConstructionContainerId] = useState('LL-CNT-CARRIED-FOOD-BAG-01');
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [focusedConstructionBuildingId, setFocusedConstructionBuildingId] = useState<string | null>(null);
  const [constructionBlueprintId, setConstructionBlueprintId] = useState('');
  const [constructionXMetres, setConstructionXMetres] = useState('5');
  const [constructionYMetres, setConstructionYMetres] = useState('0');
  const [constructionPreview, setConstructionPreview] = useState<{ key: string; availability: ActionAvailability } | null>(null);

  useEffect(() => {
    let active = true;
    client.health().then(() => {
      if (!active) return;
      setApiState('ready');
      setApiMessage('Trò chơi đã sẵn sàng');
    }).catch(error => {
      if (!active) return;
      setApiState('disconnected');
      setApiMessage(errorMessage(error));
    });
    return () => { active = false; };
  }, [client]);

  useEffect(() => {
    if (!authenticated || !view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope) return;
    let active = true;
    let inFlight = false;
    let lastSnapshotAt = 0;
    let running = view.clockControl.status === 'running';
    const refreshClock = async () => {
      if (inFlight || working) return;
      inFlight = true;
      try {
        const clock = await client.heartbeatClock();
        if (!active || !saveScope.isCurrent(scope)) return;
        // Heartbeats retain the lease each second; a paused save does not need
        // a full bot-backed view projection every second. Refresh at most four
        // seconds apart while idle, always at 1s while running/catching up.
        const now = performance.now();
        const paused = !running;
        if (paused && !clock.catchingUp && now - lastSnapshotAt < 4_000) return;
        lastSnapshotAt = now;
        const nextView = await client.getView();
        if (active && saveScope.isCurrent(scope) && nextView.saveId === scope.saveId) {
          running = nextView.clockControl.status === 'running';
          setView(nextView);
          if (nextView.lastEventSequence > eventSequenceRef.current) await refreshEvents(nextView.lastEventSequence, scope);
        }
      } catch (error) {
        if (active && saveScope.isCurrent(scope)) setFeedback({
          kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
          text: errorMessage(error),
        });
      } finally {
        inFlight = false;
      }
    };
    void refreshClock();
    const timer = window.setInterval(() => { void refreshClock(); }, 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authenticated, client, saveScope, view?.saveId, working]);

  useEffect(() => {
    const scope = view ? saveScope.capture(view.saveId) : null;
    if (!view || !scope || selectedRef?.type !== 'resource') {
      setHarvestAvailability({});
      return;
    }
    const entity = view.visibleMap.entities.find(item => item.ref.type === 'resource' && item.ref.id === selectedRef.id);
    if (!entity?.resourceDeposit) {
      setHarvestAvailability({});
      return;
    }
    let active = true;
    setHarvestAvailability({});
    const workerContainer = view.inventory.containers.find(container => container.ownerId === harvestActorId
      && (container.kind === 'carried_bag' || container.kind === 'unit_inventory'));
    void Promise.all(entity.resourceDeposit.materials.map(async material => {
      const tool = material.requiredToolTemplateId
        ? workerContainer?.items.find(item => item.label === material.requiredToolTemplateId && item.quantity > 0)
        : undefined;
      const command = commandFor(view, 'harvest', {
        actorId: harvestActorId,
        resourceId: material.resourceId,
        materialId: material.materialId,
        quantity: 1,
        toolItemId: tool?.itemId ?? (material.requiredToolTemplateId ? '' : 'NONE'),
      });
      try {
        const result = await client.previewCommand(command);
        return [material.resourceId, result.availability] as const;
      } catch {
        return [material.resourceId, { actionId: 'harvest', enabled: false, reasonCode: 'PREVIEW_UNAVAILABLE', requirements: ['Chưa thể kiểm tra việc thu thập lúc này.'] }] as const;
      }
    })).then(entries => {
      if (active && saveScope.isCurrent(scope)) setHarvestAvailability(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [client, harvestActorId, saveScope, selectedRef?.id, selectedRef?.type, view?.revision, view?.saveId]);

  async function checkApi() {
    setApiState('checking');
    setApiMessage('Đang kết nối trò chơi…');
    try {
      await client.health();
      setApiState('ready');
      setApiMessage('Trò chơi đã sẵn sàng');
    } catch (error) {
      setApiState('disconnected');
      setApiMessage(errorMessage(error));
    }
  }

  async function refreshEvents(
    latestSequence = view?.lastEventSequence ?? 0,
    scope = saveScope.capture(view?.saveId ?? null),
  ) {
    if (!scope || !saveScope.isCurrent(scope)) return;
    const page = await client.listEvents(Math.max(0, latestSequence - 200), 200, scope.saveId);
    if (!saveScope.isCurrent(scope)) return;
    setEvents(page.events);
    eventSequenceRef.current = Math.max(page.nextSequence, latestSequence);
  }

  async function activateSave(saveId: string) {
    const scope = saveScope.activate(saveId);
    setView(null);
    setEvents([]);
    setTerritoryCamera(null);
    setMapZoom(400);
    setMapOffsetMm({ xMm: 0, yMm: 0 });
    mapDrag.current = null;
    suppressMapClick.current = false;
    setTerritoryDrafts([]);
    setTerritoryReadability('normal');
    setFollowTerritoryPlayer(false);
    eventSequenceRef.current = 0;
    setSelectedRef(null);
    await client.selectSave(saveId);
    if (!saveScope.isCurrent(scope)) return;
    const nextView = await client.getView();
    if (!saveScope.isCurrent(scope) || nextView.saveId !== scope.saveId) return;
    setView(nextView);
    eventSequenceRef.current = 0;
    setEvents([]);
    setSelectedRef(nextView.territory.survivalFire.ref);
    localStorage.setItem(SAVE_KEY, saveId);
    setScreen('overview');
    // The selected save/view is ready for commands. Event history is an optional
    // sidebar read and must never keep the entire game locked while SQLite loads it.
    void refreshEvents(nextView.lastEventSequence, scope).catch(error => {
      if (saveScope.isCurrent(scope)) {
        setEvents([]);
        console.warn('Event history could not be loaded for the selected save:', errorMessage(error));
      }
    });
  }

  async function returnToSavePicker() {
    if (working || pendingCommand) return;
    setPickerIntent('either');
    const generation = saveScope.clear();
    setView(null);
    setSelectedRef(null);
    setTerritoryCamera(null);
    setMapZoom(400);
    setMapOffsetMm({ xMm: 0, yMm: 0 });
    mapDrag.current = null;
    suppressMapClick.current = false;
    setTerritoryDrafts([]);
    setTerritoryReadability('normal');
    setFollowTerritoryPlayer(false);
    setEvents([]);
    eventSequenceRef.current = 0;
    setDestination(null);
    setDestinationAvailability(null);
    setHarvestAvailability({});
    setCombatActorId('');
    setSelectedCombatTargetId(null);
    setChooseDestination(false);
    setTravelActorId('LI_LAN');
    setHarvestActorId('LI_LAN');
    setConstructionContainerId('LL-CNT-CARRIED-FOOD-BAG-01');
    setFocusedConstructionBuildingId(null);
    setConstructionBlueprintId('');
    setConstructionPreview(null);
    setCustomSelection(false);
    setNotificationsOpen(false);
    setScreen('overview');
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang tải danh sách lượt lưu…' });
    try {
      const latestSaves = await client.listSaves();
      if (saveScope.isPickerCurrent(generation)) {
        setSaves(latestSaves);
        setFeedback({ kind: 'committed', text: 'Đã tải danh sách lượt lưu.' });
      }
    } catch (error) {
      if (saveScope.isPickerCurrent(generation)) {
        setFeedback({
          kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
          text: 'Không thể cập nhật danh sách lượt lưu: ' + errorMessage(error),
        });
      }
    } finally {
      setWorking(false);
    }
  }

  async function connectOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (apiState !== 'ready' || working) return;
    setWorking(true);
    setFeedback({ kind: 'idle', text: '' });
    try {
      await client.authenticateOwner(ownerKey);
      setOwnerKey('');
      const availableSaves = await client.listSaves();
      setSaves(availableSaves);
      setAuthenticated(true);
      // A deliberate New Game or Load Save selection must never be bypassed by auto-resume.
      const rememberedId = entryIntent === 'either' ? localStorage.getItem(SAVE_KEY) : null;
      if (rememberedId && availableSaves.some(save => save.saveId === rememberedId)) {
        try {
          await activateSave(rememberedId);
          setFeedback({ kind: 'committed', text: 'Đã mở lượt lưu trước đó.' });
          return;
        } catch (error) {
          setFeedback({ kind: 'rejected', text: 'Không thể khôi phục lượt lưu đã chọn: ' + errorMessage(error) });
          return;
        }
      }
      setFeedback({ kind: 'committed', text: 'Phiên chủ sở hữu đã xác thực. Chọn lượt lưu hoặc tạo lượt mới.' });
    } catch (error) {
      setFeedback({
        kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
        text: errorMessage(error),
      });
    } finally {
      setWorking(false);
    }
  }

  async function openSave(saveId: string) {
    if (working) return;
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang tải lượt chơi…' });
    try {
      await activateSave(saveId);
      setFeedback({ kind: 'committed', text: 'Đã vào lượt chơi.' });
    } catch (error) {
      setFeedback({
        kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
        text: errorMessage(error),
      });
    } finally {
      setWorking(false);
    }
  }

  async function createFreshSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working || !authenticated) return;
    const name = slotName.trim();
    if (!name) return;
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang tạo lượt chơi mới…' });
    const storageKey = CREATE_KEY_PREFIX + name.toLocaleLowerCase();
    const creationKey = localStorage.getItem(storageKey) || crypto.randomUUID();
    localStorage.setItem(storageKey, creationKey);
    try {
      const result = await client.createSave({ creationKey, slotName: name });
      const scope = saveScope.activate(result.save.saveId);
      await client.selectSave(result.save.saveId);
      if (!saveScope.isCurrent(scope)) return;
      const nextView = await client.getView();
      if (!saveScope.isCurrent(scope) || nextView.saveId !== scope.saveId) return;
      setView(nextView);
      setMapZoom(400);
      setMapOffsetMm({ xMm: 0, yMm: 0 });
      mapDrag.current = null;
      suppressMapClick.current = false;
      eventSequenceRef.current = 0;
      setEvents([]);
      setSelectedRef(nextView.territory.survivalFire.ref);
      localStorage.setItem(SAVE_KEY, result.save.saveId);
      localStorage.removeItem(storageKey);
      setSaves(current => [result.save, ...current.filter(save => save.saveId !== result.save.saveId)]);
      setScreen('overview');
      setFeedback({
        kind: 'committed',
        text: (result.created ? 'Đã tạo cuộc phiêu lưu mới.' : 'Đã tiếp tục lượt chơi.')
         ,
      });
      // Do not leave New Game controls disabled while an optional event page loads.
      // Save selection, clock ownership and the authoritative view have committed.
      void refreshEvents(nextView.lastEventSequence, scope).catch(error => {
        if (saveScope.isCurrent(scope)) {
          setEvents([]);
          console.warn('Initial save event history could not be loaded:', errorMessage(error));
        }
      });
    } catch (error) {
      setFeedback({
        kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
        text: errorMessage(error),
      });
    } finally {
      setWorking(false);
    }
  }

  async function loadLatest() {
    if (working || !view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope) return;
    // A read-only refresh must not lock save switching while its network request
    // is outstanding. The save-scope guard below discards stale responses.
    setFeedback({ kind: 'saving', text: 'Đang tải lại tiến trình…' });
    try {
      const nextView = await client.getView();
      if (!saveScope.isCurrent(scope) || nextView.saveId !== scope.saveId) return;
      setView(nextView);
      await refreshEvents(nextView.lastEventSequence, scope);
      setFeedback({ kind: 'committed', text: 'Đã cập nhật tiến trình.' });
    } catch (error) {
      if (!saveScope.isCurrent(scope)) return;
      setFeedback({
        kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
        text: errorMessage(error),
      });
    }
  }

  async function sendCommand(command: CommandEnvelope, retry = false) {
    if (working || !view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope || command.saveId !== scope.saveId) return;
    setWorking(true);
    setFeedback({ kind: 'saving', text: retry ? 'Đang thử lại hành động…' : 'Đang thực hiện hành động…' });
    try {
      if (!retry) {
        const preview = await client.previewCommand(command);
        if (!saveScope.isCurrent(scope)) return;
        if (!preview.availability.enabled) {
          setPendingCommand(null);
          setFeedback({ kind: 'rejected', text: availabilityMessage(preview.availability) });
          return;
        }
      }
      setPendingCommand(command);
      const result = await client.submitCommand(command);
      if (!saveScope.isCurrent(scope) || result.view.saveId !== scope.saveId) return;
      setView(result.view);
      if (result.view.lastEventSequence > eventSequenceRef.current) await refreshEvents(result.view.lastEventSequence, scope);
      setSelectedRef(current => current || result.view.territory.survivalFire.ref);
      setPendingCommand(null);
      setFeedback({
        kind: 'committed',
        text: 'Đã thực hiện hành động.',
      });
      try {
        await refreshEvents(result.view.lastEventSequence, scope);
      } catch (error) {
        setFeedback({ kind: 'committed', text: 'Hành động đã hoàn tất nhưng chưa tải được nhật ký: ' + errorMessage(error) });
      }
    } catch (error) {
      if (!saveScope.isCurrent(scope)) return;
      if (error instanceof GameApiError && error.code === 'STALE_REVISION') {
        try {
          const currentView = await client.getView();
          if (saveScope.isCurrent(scope) && currentView.saveId === scope.saveId) setView(currentView);
        } catch {
          // The rejection remains visible; the next explicit reload can recover the latest view.
        }
        setPendingCommand(null);
        setFeedback({ kind: 'rejected', text: errorMessage(error) + ' Tải trạng thái mới rồi thử lại.' });
      } else if (error instanceof GameApiError && error.retryable) {
        setPendingCommand(command);
        setFeedback({ kind: 'disconnected', text: errorMessage(error) });
      } else {
        setPendingCommand(null);
        setFeedback({ kind: 'rejected', text: errorMessage(error) });
      }
    } finally {
      setWorking(false);
    }
  }

  function constructionCommandKey(command: CommandEnvelope): string {
    return JSON.stringify({ revision: command.expectedRevision, type: command.type, payload: command.payload });
  }

  async function previewConstructionCommand(command: CommandEnvelope) {
    if (working || !view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope || command.saveId !== scope.saveId) return;
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang kiểm tra chi phí, nhân công và vị trí…' });
    try {
      const result = await client.previewCommand(command);
      if (!saveScope.isCurrent(scope)) return;
      setConstructionPreview({ key: constructionCommandKey(command), availability: result.availability });
      setFeedback({
        kind: result.availability.enabled ? 'committed' : 'rejected',
        text: result.availability.enabled
          ? 'Có thể thực hiện. Hãy xác nhận để bắt đầu.'
          : availabilityMessage(result.availability),
      });
    } catch (error) {
      if (!saveScope.isCurrent(scope)) return;
      setConstructionPreview(null);
      setFeedback({ kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected', text: errorMessage(error) });
    } finally {
      setWorking(false);
    }
  }

  function inspectSelected(entity: PlayerEntityView | null) {
    if (!view || !entity || pendingCommand) return;
    void sendCommand(commandFor(view, 'inspect_entity', { entity: entity.ref }));
  }

  function changeClockSpeed(speed: ClockSpeedSelection, stopCondition = view?.clockControl.stopCondition ?? 'none') {
    if (!view) return;
    const payload: CommandPayloadByType['set_clock_speed'] = {
      speed,
      stopCondition,
      ...(speed === 'custom' ? { customMultiplier: Number(customSpeed) } : {}),
    };
    void sendCommand(commandFor(view, 'set_clock_speed', payload));
  }

  function changeStopCondition(stopCondition: 'none' | 'next_completion' | 'danger') {
    if (!view) return;
    const speed = view.clockControl.selection;
    changeClockSpeed(speed, stopCondition);
  }

  function cancelTombJob(jobId: string) {
    if (!view) return;
    void sendCommand(commandFor(view, 'cancel_tomb', { jobId }));
  }

  function retryPending() {
    if (pendingCommand) void sendCommand(pendingCommand, true);
  }

  function previewCoordinateDestination(position: CoordinateMm) {
    if (!view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope) return;
    setDestination(position);
    setDestinationAvailability(null);
    const command = commandFor(view, 'move', { actorId: travelActorId, destination: position });
    void client.previewCommand(command).then(result => {
      if (saveScope.isCurrent(scope)) setDestinationAvailability(result.availability);
    }).catch(error => {
      if (saveScope.isCurrent(scope)) setFeedback({ kind: 'rejected', text: errorMessage(error) });
    });
  }

  function moveToEntity(entity: PlayerEntityView) {
    if (!view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope) return;
    const command = commandFor(view, 'move', { actorId: travelActorId, destinationId: entity.ref.id });
    void client.previewCommand(command).then(result => {
      if (!saveScope.isCurrent(scope)) return;
      if (!result.availability.enabled) setFeedback({ kind: 'rejected', text: availabilityMessage(result.availability) });
      else void sendCommand(command);
    }).catch(error => {
      if (saveScope.isCurrent(scope)) setFeedback({ kind: 'rejected', text: errorMessage(error) });
    });
  }

  function harvestSelectedResource(entity: PlayerEntityView, resourceId: string, quantity: number) {
    if (!view || entity.ref.type !== 'resource') return;
    const scope = saveScope.capture(view.saveId);
    if (!scope) return;
    const workerContainer = view.inventory.containers.find(container => container.ownerId === harvestActorId
      && (container.kind === 'carried_bag' || container.kind === 'unit_inventory'));
    const resource = view.spatial.resources.find(item => item.resourceId === resourceId);
    const tool = resource?.requiredToolTemplateId
      ? workerContainer?.items.find(item => item.label === resource.requiredToolTemplateId && item.quantity > 0)
      : undefined;
    if (!resource || !workerContainer || (resource.requiredToolTemplateId && !tool)) {
      setFeedback({ kind: 'rejected', text: !workerContainer ? 'Hãy kiểm tra hành trang của đơn vị trước khi thu thập.' : resource?.requiredToolTemplateId ? `Đơn vị cần mang theo ${playerItemName(resource.requiredToolTemplateId)} trước khi thu thập.` : 'Nguồn tài nguyên này hiện chưa thể thu thập.' });
      return;
    }
    const command = commandFor(view, 'harvest', {
      actorId: harvestActorId,
      resourceId: resource.resourceId,
      materialId: resource.materialId,
      quantity,
      toolItemId: tool?.itemId ?? 'NONE',
    });
    void client.previewCommand(command).then(result => {
      if (!saveScope.isCurrent(scope)) return;
      if (!result.availability.enabled) {
        setFeedback({ kind: 'rejected', text: availabilityMessage(result.availability) });
        return;
      }
      void sendCommand(command);
    }).catch(error => {
      if (saveScope.isCurrent(scope)) setFeedback({ kind: 'rejected', text: errorMessage(error) });
    });
  }

  const selectedEntity = view && selectedRef
    ? view.visibleMap.entities.find(entity => sameRef(entity.ref, selectedRef)) || null
    : null;
  const selectedBuilding = view && selectedEntity?.position
    ? view.territory.buildings.find(building => building.position && Math.hypot(building.position.xMm - selectedEntity.position!.xMm, building.position.yMm - selectedEntity.position!.yMm) <= 1_000)
    : null;
  const fireRef = view?.territory.survivalFire.ref || null;
  const fireEntity = view && fireRef
    ? view.visibleMap.entities.find(entity => sameRef(entity.ref, fireRef)) || null
    : null;
  async function runInspection(entity: PlayerEntityView) {
    const inspection = entity.actions.find(action => action.actionId === 'inspect_entity');
    if (!inspection?.enabled) {
      setFeedback({ kind: 'rejected', text: inspection ? availabilityMessage(inspection) : 'Chưa thể kiểm tra địa điểm này.' });
      return;
    }
    inspectSelected(entity);
  }

  function renderMap(): ReactNode {
    if (!view) return null;
    const actorCenter = travelActorId === view.player.id ? view.player.position : view.units.find(unit => unit.id === travelActorId)?.position ?? view.player.position;
    const center = { ...actorCenter, xMm: actorCenter.xMm + mapOffsetMm.xMm, yMm: actorCenter.yMm + mapOffsetMm.yMm };
    const spanMm = 26_315_789 / mapZoom;
    const horizontalSpanMm = spanMm * 1.85;
    const point = (position: CoordinateMm) => ({
      x: 50 + (position.xMm - center.xMm) / horizontalSpanMm * 100,
      y: 50 - (position.yMm - center.yMm) / spanMm * 100,
    });
    const toPolyline = (positions: readonly CoordinateMm[]) => positions.map(position => {
      const projected = point(position);
      return `${projected.x},${projected.y}`;
    }).join(' ');
    const selectedMove = selectedEntity?.actions.find(item => item.actionId === 'move');
    const selectedInspect = selectedEntity?.actions.find(item => item.actionId === 'inspect_entity');
    const selectedOpen = selectedEntity?.actions.find(item => item.actionId === 'open_cache');
    const selectedHarvest = selectedEntity?.actions.find(item => item.actionId === 'harvest');
    const resourceDeposit = selectedEntity?.resourceDeposit;
    const harvestWorkerContainer = view.inventory.containers.find(container => container.ownerId === harvestActorId
      && (container.kind === 'carried_bag' || container.kind === 'unit_inventory'));
    const workerCargoUnits = harvestWorkerContainer?.items
      .filter(item => RESOURCE_CARGO_IDS.has(item.label))
      .reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const maxHarvestQuantity = Math.max(0, (resourceDeposit?.carryCapacityUnits ?? 100_000) - workerCargoUnits);
    const selectedHarvestQuantity = Math.min(harvestQuantity, Math.max(1, maxHarvestQuantity));
    const harvestActorBusy = view.spatial.movementOrders.some(order => order.status === 'active' && order.actorIds.includes(harvestActorId))
      || view.spatial.searchJobs.some(job => job.status === 'active' && job.actorIds.includes(harvestActorId))
      || view.spatial.harvestJobs.some(job => job.status === 'active' && job.actorIds.includes(harvestActorId));
    const selectedCorpseId = selectedEntity?.ref.type === 'corpse' ? selectedEntity.ref.id : null;
    const selectedCorpse = view.corpses?.find(corpse => corpse.id === selectedCorpseId);
    const selectedCombatTarget = view.combat?.target && view.combat.target.id === selectedCombatTargetId ? view.combat.target : null;
    const selectedCombatActorId = combatActorId || view.units.find(unit => unit.health && unit.health.current > 0)?.id || '';
    return <div className="live-section-stack">
      <section className="live-panel live-exploration-panel">
        <div className="live-panel-heading">
          <div><span className="live-eyebrow">THẾ GIỚI BĂNG GIÁ</span><h2>Khám phá và di chuyển</h2></div>
          <span className="live-data-chip">{view.visibleMap.entities.length} địa điểm đã biết</span>
        </div>
        <p className="live-muted">Kéo để di chuyển góc nhìn, cuộn để phóng to hoặc thu nhỏ. Chỉ các lệnh di chuyển và khám phá được máy chủ xác nhận mới thay đổi tiến trình.</p>
        <div className="live-map-tools">
          <button className={'live-button' + (chooseDestination ? '' : ' live-button--secondary')} disabled={working || Boolean(pendingCommand)} onClick={() => {
            if (chooseDestination) {
              setChooseDestination(false);
              setDestination(null);
              setDestinationAvailability(null);
            } else setChooseDestination(true);
          }}>
            {chooseDestination ? 'Hủy chọn điểm đến' : 'Chọn điểm đến'}
          </button>
          <div className="live-zoom-controls"><button className="live-button live-button--secondary" aria-label="Thu nhỏ bản đồ" disabled={mapZoom <= 0.2} onClick={() => setMapZoom(value => Math.max(0.2, Math.round(value / 1.6 * 100) / 100))}>−</button><span>{mapZoom.toFixed(2)}×</span><button className="live-button live-button--secondary" aria-label="Phóng to bản đồ" disabled={mapZoom >= 500} onClick={() => setMapZoom(value => Math.min(500, Math.round(value * 1.6 * 100) / 100))}>+</button><button className="live-button live-button--secondary live-map-overview" aria-label="Xem toàn bản đồ" onClick={() => { setMapZoom(1); setMapOffsetMm({ xMm: 0, yMm: 0 }); }}>Toàn cảnh</button></div>
          <label className="live-inline-field">Người di chuyển <select value={travelActorId} onChange={event => { setTravelActorId(event.target.value); setMapOffsetMm({ xMm: 0, yMm: 0 }); setDestination(null); setDestinationAvailability(null); }}><option value={view.player.id}>{view.player.name}</option>{view.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          
        </div>
        {chooseDestination && <p className="live-map-hint">Chọn một điểm trống trên bản đồ để xem trước hành trình. Xác nhận để bắt đầu di chuyển.</p>}
        {fireRef && !fireEntity && <div className="live-inline-error" role="alert">Không tìm thấy Lửa Sinh Tồn trên bản đồ hiện tại.</div>}
        {selectedEntity && !selectedCombatTarget && <InspectorFrame as="div" className="live-inspector" label="Thông tin địa điểm" entityId={selectedEntity.ref.id} knowledge={selectedEntity.knowledge}>
          <InspectorHeading mode="live" eyebrow="ĐỊA ĐIỂM ĐÃ BIẾT" title={entityLabel(selectedEntity)} description={selectedEntity.knowledge === 'remembered' ? 'Vị trí đã biết lần cuối' : 'Đang trong tầm quan sát'}/>
          {selectedEntity.chestLoot && <div className="live-chest-loot" data-testid="chest-loot-inspector">
              <strong>Rương {playerStatus(selectedEntity.chestLoot.rarity)}</strong>
              
              {!selectedEntity.chestLoot.opened && <p>Chưa mở rương. Những vật phẩm bên trong vẫn chưa được biết.</p>}
              {selectedEntity.chestLoot.opened && selectedEntity.chestLoot.outcome && <ul>{selectedEntity.chestLoot.outcome.map(item => <li key={item.templateId}><span>{playerItemName(item.templateId)}</span><span>×{item.quantity}</span></li>)}</ul>}
            </div>}
          {selectedEntity.remainsAssets && <div className="live-chest-loot" data-testid="bot-remains-inspector">
            <strong>Recorded assets · {selectedEntity.remainsAssets.state}</strong>
            {selectedEntity.remainsAssets.state === 'claimed' && <small>Claimed by {selectedEntity.remainsAssets.claimedById ?? 'unknown actor'}.</small>}
            <ul>
              {Object.entries(selectedEntity.remainsAssets.resourceMicro).filter(([, amount]) => amount > 0).map(([resource, amount]) => <li key={resource}><span>{resource}</span><span>{(amount / 1_000_000).toLocaleString()} units</span></li>)}
              {selectedEntity.remainsAssets.waterMicro > 0 && <li><span>Potable water</span><span>{(selectedEntity.remainsAssets.waterMicro / 1_000_000).toLocaleString()} L</span></li>}
              {selectedEntity.remainsAssets.firewoodMicro > 0 && <li><span>Firewood</span><span>{(selectedEntity.remainsAssets.firewoodMicro / 1_000_000).toLocaleString()} units</span></li>}
              {selectedEntity.remainsAssets.items.map(item => <li key={item.instanceId}><span>{item.itemTemplateId}</span><span>×{item.quantity}</span></li>)}
              {selectedEntity.remainsAssets.blueprintIds.map(blueprintId => <li key={blueprintId}><span>Blueprint · {blueprintId}</span><span>×1</span></li>)}
            </ul>
          </div>}
          <div className="live-action-stack">
            {selectedInspect && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !selectedInspect.enabled} onClick={() => void runInspection(selectedEntity)}><Eye size={16} /> Kiểm tra</button>}
            {selectedCorpse?.inspected && <div><p>Thi thể: Bậc {selectedCorpse.tier ?? '—'} · Cấp {selectedCorpse.level ?? '—'} · Phẩm {selectedCorpse.grade ?? '—'} · nguyên vẹn {selectedCorpse.integrity ?? '—'}%</p>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !selectedCorpse.revive.enabled} onClick={() => void sendCommand(commandFor(view, 'revive', { actorId: view.player.id, corpseId: selectedCorpse.id }))}>Tử Phục · không tốn Mana, vật liệu hay thời gian</button>
              {!selectedCorpse.revive.enabled && <small>{availabilityMessage(selectedCorpse.revive)}</small>}
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !selectedCorpse.butcher.enabled} onClick={() => void sendCommand(commandFor(view, 'butcher_corpse', { actorId: view.player.id, corpseId: selectedCorpse.id }))}>Phân giải vĩnh viễn · thu hồi trang bị đã ghi nhận</button>
              {!selectedCorpse.butcher.enabled && <small>{availabilityMessage(selectedCorpse.butcher)}</small>}
            </div>}
            {selectedMove && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || (travelActorId === view.player.id && !selectedMove.enabled)} onClick={() => moveToEntity(selectedEntity)}><ArrowRight size={16} /> Di chuyển đến đây {travelActorId === view.player.id && selectedMove.preview?.value ? `· ${selectedMove.preview.value}` : ''}</button>}
            {selectedBuilding && <button className="live-button live-button--secondary" onClick={() => { setFocusedConstructionBuildingId(selectedBuilding.id); setScreen('buildings'); }}><Hammer size={16} /> Xem {selectedBuilding.name}</button>}
            {selectedEntity.ref.type === 'site' && selectedEntity.ref.id === 'SITE-LL01-000' && <button className="live-button live-button--secondary" onClick={() => { setFocusedConstructionBuildingId(null); setScreen('buildings'); }}><Hammer size={16} /> Xem công trình tại lãnh địa</button>}
            {selectedOpen && <small>{availabilityMessage(selectedOpen)}</small>}
            {selectedEntity.ref.type === 'cache' && selectedOpen && <button className="live-button" disabled={working || Boolean(pendingCommand) || !selectedOpen.enabled || Boolean(selectedEntity.chestLoot?.opened)}
              onClick={() => void sendCommand(commandFor(view, 'open_cache', { actorId: view.player.id, chestId: selectedEntity.ref.id }))}>{selectedEntity.chestLoot ? 'Mở rương · commit displayed odds' : 'Claim recorded assets'}</button>}
            {selectedInspect && !selectedInspect.enabled && <small>{availabilityMessage(selectedInspect)}</small>}
            {selectedMove && !selectedMove.enabled && <small>{availabilityMessage(selectedMove)}</small>}
            {selectedHarvest && !selectedHarvest.enabled && <small>{availabilityMessage(selectedHarvest)}</small>}
          </div>
        </InspectorFrame>}
        {selectedCombatTarget && <InspectorFrame as="div" className="live-inspector" label="Mục tiêu giao chiến" testId="combat-target-inspector" entityId={selectedCombatTarget.id}>
          <InspectorHeading mode="live" eyebrow="MỤC TIÊU GIAO CHIẾN" title={selectedCombatTarget.label}
            description={selectedCombatTarget.state === 'available' ? 'Đã phát hiện dấu vết con mồi gần đây.' : 'Mục tiêu đã nhận ra đội của bạn.'}/>
          <div className="live-action-stack">
            <label className="live-inline-field">Chiến binh <select value={selectedCombatActorId} onChange={event => setCombatActorId(event.target.value)}>
              <option value="">Chọn đơn vị còn sống</option>{view.units.filter(unit => unit.health && unit.health.current > 0).map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            <button className="live-button" disabled={working || Boolean(pendingCommand) || selectedCombatTarget.state !== 'available' || !selectedCombatActorId}
              onClick={() => void sendCommand(commandFor(view, 'attack', { actorIds: [selectedCombatActorId], targetId: selectedCombatTarget.id }))}>Tấn công</button>
            {!selectedCombatTarget.attack.enabled && <small>{availabilityMessage(selectedCombatTarget.attack)}</small>}
          </div>
        </InspectorFrame>}

        <div className="live-map-canvas" data-testid="live-map" tabIndex={0}
          aria-label="Bản đồ khám phá. Kéo chuột để di chuyển góc nhìn, cuộn để thu phóng."
          onWheel={event => {
            if (chooseDestination || chooseDispatchCenter) return;
            event.preventDefault();
            setMapZoom(zoom => Math.min(500, Math.max(0.2, Math.round(zoom * (event.deltaY < 0 ? 1.18 : 1 / 1.18) * 100) / 100)));
          }}
          onKeyDown={event => {
            if (event.target !== event.currentTarget) return;
            const stepX = horizontalSpanMm * .1;
            const stepY = spanMm * .1;
            if (event.key === 'ArrowLeft') { event.preventDefault(); setMapOffsetMm(offset => ({ ...offset, xMm: offset.xMm - stepX })); }
            else if (event.key === 'ArrowRight') { event.preventDefault(); setMapOffsetMm(offset => ({ ...offset, xMm: offset.xMm + stepX })); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setMapOffsetMm(offset => ({ ...offset, yMm: offset.yMm + stepY })); }
            else if (event.key === 'ArrowDown') { event.preventDefault(); setMapOffsetMm(offset => ({ ...offset, yMm: offset.yMm - stepY })); }
          }}
          onPointerDown={event => {
            if (event.button !== 0 || chooseDestination || chooseDispatchCenter) return;
            suppressMapClick.current = false;
            mapDrag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
              startOffsetX: mapOffsetMm.xMm, startOffsetY: mapOffsetMm.yMm, moved: false };
          }}
          onPointerMove={event => {
            const drag = mapDrag.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
            if (!drag.moved && Math.hypot(dx, dy) < 6) return;
            drag.moved = true;
            suppressMapClick.current = true;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            setMapOffsetMm({
              xMm: drag.startOffsetX - dx / bounds.width * horizontalSpanMm,
              yMm: drag.startOffsetY + dy / bounds.height * spanMm,
            });
          }}
          onPointerUp={event => { if (mapDrag.current?.pointerId === event.pointerId) mapDrag.current = null; }}
          onPointerCancel={() => { mapDrag.current = null; }}
          onPointerLeave={() => { mapDrag.current = null; }}
          onClickCapture={event => {
          if (suppressMapClick.current) { suppressMapClick.current = false; event.preventDefault(); event.stopPropagation(); return; }
          if (!chooseDestination && !chooseDispatchCenter) return;
          // Destination and expedition-center selection must take precedence over
          // marker buttons layered over the map, which stop their own click events.
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          const coordinate = { xMm: Math.round(center.xMm + (x - 0.5) * horizontalSpanMm), yMm: Math.round(center.yMm - (y - 0.5) * spanMm), sourceZMetres: center.sourceZMetres ?? 0 };
          if (chooseDispatchCenter) {
            setDispatchCenter(coordinate);
            setDispatchPreview(null);
            setChooseDispatchCenter(false);
            setChooseDestination(false);
            setFeedback({ kind: 'idle', text: `Đã chọn tâm tìm kiếm trên bản đồ.` });
          } else previewCoordinateDestination(coordinate);
        }}>
          <MapCanvas snapshot={liveExplorationSnapshot(view,center,horizontalSpanMm/1000,spanMm/1000)} label="Bản đồ địa hình đã khám phá. Chọn địa điểm để di chuyển."/>
          <div className="live-map-crosshair" aria-hidden="true" />
          <svg className="live-map-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><mask id="live-map-unknown" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <rect width="100" height="100" fill="white"/>
              {[...view.visibleMap.exploredGeometry.flatMap(a=>a.radiusMm!==undefined&&a.points[0]?[{center:a.points[0],radiusMm:a.radiusMm}]:[]),...view.visibleMap.currentSight].map((a,i)=>{const p=point(a.center);return <ellipse key={i} cx={p.x} cy={p.y} rx={a.radiusMm/horizontalSpanMm*100} ry={a.radiusMm/spanMm*100} fill="black"/>;})}
              {view.visibleMap.visibleGeometry.filter(g=>g.kind==='polygon').map(g=><polygon key={g.id} points={toPolyline(g.points)} fill="black"/>)}
            </mask></defs>
            <rect width="100" height="100" fill="#233d4b" opacity=".96" mask="url(#live-map-unknown)"/>

            {view.visibleMap.heatOverlays.map((heat, index) => {
              const centerPoint = point(heat.center);
              return <ellipse key={`heat-${index}`} className="live-map-heat" cx={centerPoint.x} cy={centerPoint.y}
                rx={heat.radiusMm / horizontalSpanMm * 100} ry={heat.radiusMm / spanMm * 100} />;
            })}
            {view.visibleMap.exploredGeometry.map(area => {
              const centerPoint = area.points[0];
              if (!centerPoint || area.radiusMm === undefined) return null;
              const projected = point(centerPoint);
              return <ellipse key={area.id} className="live-map-explored" cx={projected.x} cy={projected.y} rx={area.radiusMm / horizontalSpanMm * 100} ry={area.radiusMm / spanMm * 100} />;
            })}
            {view.visibleMap.knownRoutes.map(route => <polyline key={route.id} className="live-map-route" points={toPolyline(route.path)} />)}
            {view.visibleMap.activeOrders.map(order => <polyline key={order.id} className="live-map-order" points={toPolyline(order.path)} />)}
            {view.spatial.searchJobs.filter(job => job.status === 'active').map(job => <polyline key={job.id} className={job.mode === 'hunt' ? 'live-map-hunt-path' : 'live-map-search-path'} points={toPolyline(job.phase === 'returning' ? job.returnPath ?? job.path : job.path)} />)}
            {view.spatial.harvestJobs.filter(job => job.status === 'active').map(job => <polyline key={job.id} className="live-map-order" points={toPolyline(job.stage === 'returning' ? job.routeReturn : job.routeOut)} />)}
            {view.visibleMap.currentSight.map((sight, index) => {
              const projected = point(sight.center);
              return <ellipse key={`${sight.source}-${index}`} className="live-map-sight" cx={projected.x} cy={projected.y} rx={sight.radiusMm / horizontalSpanMm * 100} ry={sight.radiusMm / spanMm * 100} />;
            })}
          </svg>
          {view.visibleMap.terrain.map(terrain => {
            const projected = point(terrain.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            return <span key={terrain.id} className="live-terrain-label" style={{ left: left + '%', top: top + '%' }}>{terrain.label}</span>;
          })}
          {view.visibleMap.entities.map(entity => {
            const projected = point(entity.position ?? center);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            const isFire = sameRef(entity.ref, fireRef);
            const resourceMaterial = entity.resourceDeposit?.materials.some(material => material.materialId === 'WOOD')
              ? 'wood'
              : entity.resourceDeposit?.materials.some(material => material.materialId === 'STONE') ? 'stone' : 'other';
            return <button
              key={entityRefKey(entity.ref)}
              className={'live-map-marker' + (isFire ? ' live-map-marker--fire' : '') + (entity.ref.type === 'resource' ? ` live-map-marker--resource live-map-marker--resource-${resourceMaterial}` : '') + (sameRef(entity.ref, selectedRef) ? ' is-selected' : '')}
              data-testid={isFire ? 'map-campfire-marker' : undefined}
              data-entity-ref={entityRefKey(entity.ref)}
              style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setSelectedRef(entity.ref); setSelectedCombatTargetId(null); }}
              aria-label={entity.label}
              title={entity.resourceDeposit
                ? `${entity.label} · ${entity.resourceDeposit.materials.map(material => `${material.materialName}: ${material.remaining === null ? 'chưa rõ' : `${material.remaining.toLocaleString()} ${material.unit}`}`).join(' · ')}`
                : entity.label}
            >
              <svg className="live-map-marker-art" viewBox="-24 -24 48 48" aria-hidden="true" focusable="false">
                <MarkerGraphic kind={liveMapMarkerKind(entity)} />
              </svg>
              <span>{entity.label}</span>
            </button>;
          })}
          {(view.visibleMap.combatTargets ?? []).map(target => {
            const projected = point(target.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            return <button key={target.targetId} className={'live-map-marker live-map-marker--combat' + (selectedCombatTargetId === target.targetId ? ' is-selected' : '')}
              data-testid="map-combat-target" style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setSelectedRef(null); setSelectedCombatTargetId(target.targetId); }}
              aria-label={target.label} title={target.label}><MapPin size={19} aria-hidden="true" /><span>{target.label}</span></button>;
          })}
          {(view.visibleMap.enemyBots ?? []).map(bot => {
            const projected = point(bot.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            return <button key={bot.botId} className={'live-map-marker live-map-marker--enemy' + (bot.knowledge === 'remembered' ? ' is-remembered' : '')}
              data-testid="map-enemy-settlement" data-bot-id={bot.botId} style={{ left: left + '%', top: top + '%' }}
              onClick={event => {
                event.stopPropagation();
                if (bot.knowledge === 'current') void sendCommand(commandFor(view, 'inspect_entity', { entity: { type: 'bot', id: bot.botId } }));
                else setFeedback({ kind: 'idle', text: 'Cần quan sát lại lãnh địa này trước khi kiểm tra.' });
              }}
              aria-label={`${bot.label} · ${bot.status}`} title={`${bot.label} · ${bot.status}`}><MapPin size={19} aria-hidden="true" /><span>{bot.label} · {bot.status.replaceAll('_', ' ')}</span></button>;
          })}
          {(view.visibleMap.enemyArmies ?? []).map(army => {
            const projected = point(army.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            const unitLabel = army.order === 'scout' ? 'trinh sát' : 'quân lính';
            const summary = army.knowledge === 'current' ? `${army.count} ${unitLabel}` : `Dấu vết ${unitLabel} đã thấy trước đây`;
            return <button key={`${army.botId}:${army.observedAtElapsedMs}`} className={'live-map-marker live-map-marker--enemy-army' + (army.knowledge === 'remembered' ? ' is-remembered' : '')}
              data-testid="map-enemy-army" style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setFeedback({ kind: 'idle', text: summary }); }}
              aria-label={summary} title={summary}><MapPin size={17} aria-hidden="true" /><span>{army.knowledge === 'current' ? `${army.count} ${unitLabel}` : 'Dấu vết cũ'}</span></button>;
          })}
          {view.units.filter(unit => unit.position).map(unit => {
            const projected = point(unit.position!);
            return <span key={unit.id} className="live-map-unit" style={{ left: `${Math.max(2, Math.min(98, projected.x))}%`, top: `${Math.max(2, Math.min(98, projected.y))}%` }} title={unit.name}>{unit.name}</span>;
          })}
          {(() => { const projected = point(view.player.position); return <span className="live-map-player" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Lí Lan">LL</span>; })()}
          {destination && (() => { const projected = point(destination); return <span className="live-map-destination" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Điểm đến đã chọn" />; })()}
          {view.visibleMap.entities.length === 0 && !(view.visibleMap.enemyBots?.length) && !(view.visibleMap.enemyArmies?.length) && <p className="live-map-empty">Chưa tìm thấy địa điểm nào quanh đây.</p>}
        </div>
        <section className="live-bot-inspection" data-testid="bot-settlement-inspection" hidden={!view.botInspection}>
          {view.botInspection && <>
          <strong>{view.botInspection.name}</strong>
          <span>Level {view.botInspection.level} · population {view.botInspection.population} · {view.botInspection.talent?.grade} {view.botInspection.talent?.kind}</span>
          {view.botInspection.lord && <span data-testid="bot-lord-condition">Lord {view.botInspection.lord.alive ? 'alive' : 'dead'} · {view.botInspection.lord.hp.toFixed(1)}/{view.botInspection.lord.maxHp} HP · food gap {view.botInspection.lord.foodShortfallHours.toFixed(1)} h · water gap {view.botInspection.lord.waterShortfallHours.toFixed(1)} h · cold load {view.botInspection.lord.coldLoad.toFixed(1)}{view.botInspection.lord.cause ? ` · cause ${view.botInspection.lord.cause}` : ''}</span>}
          <span>Army {(view.botInspection.army ?? []).reduce((sum, cohort) => sum + cohort.livingCount, 0)} · structures {(view.botInspection.structures ?? []).filter(item => item.status !== 'destroyed').length}</span>
          <span>Food {view.botInspection.resourceBalances?.food ?? 0} · water {view.botInspection.resourceBalances?.water ?? 0} L · wood {view.botInspection.resourceBalances?.wood ?? 0} · firewood {view.botInspection.resourceBalances?.firewood ?? 0} · stone {view.botInspection.resourceBalances?.stone ?? 0} · ore {view.botInspection.resourceBalances?.ore ?? 0}</span>
          <div><strong>Công trình</strong><ul>{(view.botInspection.structures ?? []).map(structure => <li key={structure.id}>
            {structure.blueprintId} · cấp {structure.level} · {structure.status}{structure.status === 'under_construction' ? ` · ${Math.floor(structure.workCompleted * 100 / Math.max(1, structure.workRequired))}%`
              : structure.status === 'damaged' && structure.repairWorkRequired > 0 ? ` · sửa chữa ${Math.floor(structure.repairWorkCompleted * 100 / structure.repairWorkRequired)}%` : ''}
          </li>)}</ul></div>
          <div><strong>Quân lực</strong><ul>{(view.botInspection.army ?? []).map(cohort => <li key={cohort.id}>
            {cohort.livingCount} đơn vị · cấp {cohort.level} · {cohort.order}
          </li>)}</ul></div>
          <div className="live-action-stack">
            {view.botInspection.attackActorIds.length > 0 && <label className="live-inline-field">Attacker <select
              value={view.botInspection.attackActorIds.includes(combatActorId) ? combatActorId : view.botInspection.attackActorIds[0]}
              onChange={event => setCombatActorId(event.target.value)}>
              {view.botInspection.attackActorIds.map(actorId => <option key={actorId} value={actorId}>{view.units.find(unit => unit.id === actorId)?.name ?? actorId}</option>)}
            </select></label>}
            <button className="live-button" disabled={working || Boolean(pendingCommand) || !view.botInspection.attack.enabled || view.botInspection.attackActorIds.length === 0}
              onClick={() => {
                const actorId = view.botInspection!.attackActorIds.includes(combatActorId) ? combatActorId : view.botInspection!.attackActorIds[0];
                if (actorId) void sendCommand(commandFor(view, 'attack', { actorIds: [actorId], targetId: view.botInspection!.botId }));
              }}>Attempt personal attack</button>
            {!view.botInspection.attack.enabled && <small>{availabilityMessage(view.botInspection.attack)}</small>}
          </div>
          <div><strong>Structures</strong><ul>{(view.botInspection.structures ?? []).map(structure => <li key={structure.id}>
            {structure.blueprintId} · level {structure.level} · {structure.status}{structure.status === 'under_construction' ? ` · ${Math.floor(structure.workCompleted * 100 / Math.max(1, structure.workRequired))}%`
              : structure.status === 'damaged' && structure.repairWorkRequired > 0 ? ` · repair ${Math.floor(structure.repairWorkCompleted * 100 / structure.repairWorkRequired)}%` : ''}
          </li>)}</ul></div>
          <div><strong>Quân lực</strong><ul>{(view.botInspection.army ?? []).map(cohort => <li key={cohort.id}>
            {cohort.livingCount} đơn vị · cấp {cohort.level} · {playerStatus(cohort.order)}
          </li>)}</ul></div>
          </>}
          <BotSettlementScene inspection={view.botInspection} />
        </section>
        {destination && <div className="live-destination-preview">
          <div><strong>Điểm đến</strong><span>{(destinationAvailability?.enabled ? 'Có thể di chuyển' : destinationAvailability ? availabilityMessage(destinationAvailability) : 'Đang tìm đường đi…')}</span></div>
          <button className="live-button" disabled={working || Boolean(pendingCommand) || !destinationAvailability?.enabled} onClick={() => void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination }))}>Bắt đầu di chuyển</button>
        </div>}
        {view.spatial.movementOrders.filter(order => order.status === 'active').map(order => <div key={order.id} className="live-destination-preview">
          <div><strong>Đang di chuyển</strong><span>{(order.totalDistanceMm / 1_000_000).toFixed(2)} km · {Math.floor(view.jobs.find(job => job.id === order.id)?.progressPercent ?? 0)}% · {order.pathSegments.some(segment => segment.uncertainty === 'uncertain') ? 'đường đi chưa rõ' : 'đường đi đã biết'}</span></div>
          <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_travel', { orderId: order.id }))}>Hủy di chuyển</button>
        </div>)}
        {resourceDeposit && <div className="live-resource-deposit" data-feature-id={resourceDeposit.featureId}>
            <p className="live-resource-terrain">Khu tài nguyên · diện tích {((resourceDeposit.footprintMm.widthMm / 1_000).toLocaleString())} × {((resourceDeposit.footprintMm.depthMm / 1_000).toLocaleString())} m</p>
            <div className="live-resource-heat-status">
              <Flame size={15} />
              {!resourceDeposit.heatActive
                ? 'Lửa Sinh Tồn đã tắt; khu vực này không được sưởi ấm.'
                : resourceDeposit.heatCovered
                ? `Trong vùng nhiệt ${resourceDeposit.heatRadiusMm / 1_000} m của lửa trại.`
                : `${(resourceDeposit.distanceFromHeatMm / 1_000).toFixed(0)} m từ lửa trại, ngoài vùng nhiệt. Có thể thu thập nhưng nơi làm việc rất lạnh.`}
            </div>
            <p className="live-resource-haul">Có thể mang tối đa {resourceDeposit.carryCapacityUnits.toLocaleString()} đơn vị tài nguyên; còn chỗ cho {maxHarvestQuantity.toLocaleString()}. Kho lãnh địa có {resourceDeposit.storageStackSlots ?? 'không giới hạn'} ô chứa.</p>
            <label className="live-inline-field">Đơn vị thu thập <select value={harvestActorId} onChange={event => { setHarvestActorId(event.target.value); setHarvestQuantity(1); }}>
              <option value={view.player.id}>{view.player.name}</option>
              {view.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            {harvestActorBusy && <small className="live-resource-access">Đơn vị này đang làm nhiệm vụ khác.</small>}
            {!harvestWorkerContainer && <small className="live-resource-access">Kiểm tra hành trang của đơn vị trước khi thu thập.</small>}
            <label className="live-inline-field live-resource-quantity">Số lượng thu thập <input type="number" min={1} max={Math.max(1, maxHarvestQuantity)} value={selectedHarvestQuantity} disabled={maxHarvestQuantity < 1} onChange={event => setHarvestQuantity(Math.min(Math.max(1, maxHarvestQuantity), Math.max(1, Number(event.target.value) || 1)))} /></label>
            <ul className="live-resource-materials">{resourceDeposit.materials.map(material => {
              const remaining = material.remaining === null ? 'Chưa rõ' : `${material.remaining.toLocaleString()} ${material.unit}`;
              const renewal = material.renewal === 'none' ? 'Tài nguyên có hạn, không tự phục hồi.'
                : material.renewal === 'biological_rate' ? `Phục hồi ${material.regenerationPerDay.toLocaleString()} ${material.unit} mỗi ngày.`
                  : `Có thể thu thập ${material.dailyQuota?.toLocaleString() ?? '—'} ${material.unit} mỗi ngày, làm mới lúc nửa đêm.`;
              const workerHasTool = !material.requiredToolTemplateId || Boolean(harvestWorkerContainer?.items.some(item => item.label === material.requiredToolTemplateId && item.quantity > 0));
              const localBlock = !harvestWorkerContainer || harvestActorBusy || maxHarvestQuantity < 1 || material.access !== 'open_surface' || material.status === 'depleted' || !workerHasTool;
              const serverAvailability = harvestAvailability[material.resourceId];
              const blocked = localBlock || Boolean(serverAvailability && !serverAvailability.enabled);
              return <li key={material.resourceId}>
                <div><strong>{material.materialName}</strong><span>{remaining} / {material.capacity.toLocaleString()} {material.dailyQuota === null ? 'trữ lượng' : 'giới hạn mỗi ngày'}{material.reserved ? ` · ${material.reserved.toLocaleString()} đã dành` : ''}</span></div>
                <small>{material.harvestRateUnitsPerHour.toLocaleString()} {material.unit}/giờ trên mỗi đơn vị{material.dailyQuota !== null ? ` · Hôm nay còn ${material.dailyRemaining?.toLocaleString() ?? 'chưa rõ'}/${material.dailyQuota.toLocaleString()}` : ''} · {renewal}</small>
                {material.access !== 'open_surface' && <small className="live-resource-access">{material.accessReason ? playerMessage(material.accessReason) : 'Chưa đủ điều kiện tiếp cận tài nguyên này.'}</small>}
                {material.requiredToolTemplateId && <small className="live-resource-access">{workerHasTool ? `Đã có ${playerItemName(material.requiredToolTemplateId)}.` : `Cần trang bị ${playerItemName(material.requiredToolTemplateId)}.`}</small>}
                {material.status === 'depleted' && <small className="live-resource-access">{material.dailyQuota === null ? 'Nguồn tài nguyên đã cạn.' : 'Hôm nay không còn tài nguyên để thu thập.'}</small>}
                {maxHarvestQuantity < 1 && <small className="live-resource-access">Dỡ bớt đồ ở kho lãnh địa trước khi thu thập tiếp.</small>}
                {!localBlock && serverAvailability && !serverAvailability.enabled && <small className="live-resource-access">{harvestBlockerMessage(serverAvailability)}</small>}
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || blocked}
                  onClick={() => harvestSelectedResource(selectedEntity, material.resourceId, selectedHarvestQuantity)}>
                  Harvest {selectedHarvestQuantity} {material.materialName}
                </button>
              </li>;
            })}</ul>
        </div>}
      </section>
      {renderDispatchPanel()}
      {view.spatial.searchJobs.length > 0 && <ul className="live-plain-list">{view.spatial.searchJobs.map(job => <li key={job.id}><strong>{job.mode === 'hunt' ? 'Săn bắt' : 'Tìm rương'} · {playerStatus(job.phase ?? 'sweeping')} · {playerStatus(job.status)} · {Math.floor(view.jobs.find(item => item.id === job.id)?.progressPercent ?? 0)}%</strong><span>{job.actorIds.length} đơn vị · {job.uniqueAreaM2.toFixed(0)} m² unique · {job.repeatedAreaM2.toFixed(0)} m² repeated · {job.mode === 'hunt' ? `targets ${job.foundTargetCount}` : `signals ${job.foundChestCount}`} {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>{job.phase === 'returning' ? 'Returning' : 'Recall'}</button>}</span></li>)}</ul>}
        {view.spatial.harvestJobs.length > 0 && <ul className="live-plain-list">{view.spatial.harvestJobs.map(job => <li key={job.id}><strong>Thu thập · {playerStatus(job.stage)} · {playerStatus(job.status)}</strong><span>{job.extractedQuantity}/{job.requestedQuantity} đã thu thập {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Cancel</button>}</span></li>)}</ul>}
        {destinationAvailability && !destinationAvailability.enabled && <p className="live-inline-error">{availabilityMessage(destinationAvailability)}</p>}
    </div>;
  }

  function renderDispatchPanel(): ReactNode {
    if (!view) return null;
    const livingUnits = view.units.filter(unit => unit.health && unit.health.current > 0 && unit.position);
    const lead = dispatchLeadActorId === view.player.id ? view.player : livingUnits.find(unit => unit.id === dispatchLeadActorId) ?? view.player;
    const center = dispatchCenter ?? lead.position ?? view.player.position;
    const busyActorIds = new Set([
      ...view.spatial.movementOrders.filter(order => order.status === 'active').flatMap(order => order.actorIds),
      ...view.spatial.searchJobs.filter(job => job.status === 'active').flatMap(job => job.actorIds),
      ...view.spatial.harvestJobs.filter(job => job.status === 'active').flatMap(job => job.actorIds),
      ...(view.combat?.encounter?.status === 'active' ? view.combat.encounter.actorIds : []),
    ]);
    const additionalIds = dispatchAdditionalActorIds.filter(id => id !== dispatchLeadActorId && livingUnits.some(unit => unit.id === id));
    const targetCount = dispatchTargetCount.trim() === '' ? undefined : Number(dispatchTargetCount);
    const timeLimitMinutes = dispatchTimeLimitMinutes.trim() === '' ? undefined : Number(dispatchTimeLimitMinutes);
    const payload = {
      actorId: dispatchLeadActorId,
      center,
      radiusMm: searchRadiusMetres * 1_000,
      mode: dispatchMode,
      ...(additionalIds.length ? { additionalActorIds: additionalIds } : {}),
      ...(targetCount === undefined ? {} : { targetCount }),
      ...(timeLimitMinutes === undefined ? {} : { timeLimitMinutes }),
    };
    const searchCommand = commandFor(view, 'search', payload);
    const busy = busyActorIds.has(dispatchLeadActorId) || additionalIds.some(id => busyActorIds.has(id));
    const knownTarget = view.combat?.target;
    const defaultHunter = livingUnits[0]?.id ?? '';
    const selectedHunter = livingUnits.some(unit => unit.id === huntActorId) ? huntActorId : defaultHunter;
    const huntingSquadIds = selectedHunter ? [selectedHunter] : [];
    const hunterPosition = livingUnits.find(unit => unit.id === selectedHunter)?.position;
    const huntRangeMetres = knownTarget && hunterPosition
      ? Math.round(Math.hypot(hunterPosition.xMm - knownTarget.position.xMm, hunterPosition.yMm - knownTarget.position.yMm) / 1_000)
      : null;

    async function previewSearch() {
      if (working || !view) return;
      const scope = saveScope.capture(view.saveId);
      if (!scope) return;
      setWorking(true);
      setDispatchPreview(null);
      try {
        const result = await client.previewCommand(searchCommand);
        if (!saveScope.isCurrent(scope)) return;
        setDispatchPreview(result.availability);
      } catch (error) {
        if (saveScope.isCurrent(scope)) setFeedback({ kind: 'rejected', text: errorMessage(error) });
      } finally {
        setWorking(false);
      }
    }

    return <section className="live-panel live-dispatch-panel" aria-label="Điều động đội ngũ">
      <div className="live-panel-heading"><div><span className="live-eyebrow">THÁM HIỂM</span><h3>Điều động đội ngũ</h3></div><Eye size={20} /></div>
      <p className="live-muted">Chọn nhiệm vụ tìm rương hoặc săn bắt, đặt bán kính tìm kiếm và giới hạn hoạt động, sau đó điều đội xuất phát. Khi đạt giới hạn, đội sẽ quay về.</p>
      <label className="live-inline-field">Nhiệm vụ<select value={dispatchMode} onChange={event => { setDispatchMode(event.target.value as 'chest' | 'hunt'); setDispatchPreview(null); }}>
        <option value="chest">Tìm rương</option><option value="hunt">Săn bắt</option>
      </select></label>
      <div className="live-dispatch-grid">
        <label className="live-inline-field">Đội trưởng<select value={dispatchLeadActorId} onChange={event => { setDispatchLeadActorId(event.target.value); setDispatchPreview(null); }}>
          <option value={view.player.id}>{view.player.name}</option>{livingUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select></label>
        <label className="live-inline-field">Bán kính tìm kiếm<select value={searchRadiusMetres} onChange={event => { setSearchRadiusMetres(Number(event.target.value)); setDispatchPreview(null); }}><option value={250}>250 m</option><option value={500}>500 m</option><option value={1000}>1 km</option><option value={2000}>2 km</option></select></label>
        <label className="live-inline-field">Dừng sau số mục tiêu<input type="number" min={1} max={192} step={1} placeholder="Không giới hạn" value={dispatchTargetCount} onChange={event => { setDispatchTargetCount(event.target.value); setDispatchPreview(null); }} /></label>
        <label className="live-inline-field">Thời gian tối đa<select value={dispatchTimeLimitMinutes} onChange={event => { setDispatchTimeLimitMinutes(event.target.value); setDispatchPreview(null); }}><option value="">Không giới hạn</option><option value={15}>15 phút</option><option value={30}>30 phút</option><option value={60}>1 giờ</option><option value={240}>4 giờ</option><option value={480}>8 giờ</option><option value={1440}>24 giờ</option></select></label>
      </div>
      {livingUnits.length > 0 && <fieldset className="live-dispatch-units"><legend>Đơn vị đi cùng</legend>{livingUnits.filter(unit => unit.id !== dispatchLeadActorId).map(unit => <label key={unit.id}>
        <input type="checkbox" checked={additionalIds.includes(unit.id)} disabled={busyActorIds.has(unit.id)} onChange={event => {
          setDispatchAdditionalActorIds(current => event.target.checked ? [...new Set([...current, unit.id])] : current.filter(id => id !== unit.id));
          setDispatchPreview(null);
        }} />{unit.name}{busyActorIds.has(unit.id) ? ' · đang bận' : ''}
      </label>)}</fieldset>}
      <div className="live-dispatch-center"><span>Tâm tìm kiếm: {dispatchCenter ? 'Điểm đã chọn' : 'Vị trí đội trưởng'}</span>
        <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => { setChooseDestination(false); setChooseDispatchCenter(true); }}>{chooseDispatchCenter ? 'Chọn vị trí trên bản đồ' : 'Chọn tâm tìm kiếm'}</button>
        {dispatchCenter && <button className="live-text-button" onClick={() => { setDispatchCenter(null); setDispatchPreview(null); }}>Theo đội trưởng</button>}
      </div>
      <div className="live-button-row">
        <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || busy} onClick={() => void previewSearch()}>Xem trước chuyến đi</button>
        <button className="live-button" data-testid={dispatchMode === 'hunt' ? 'hunt-area' : 'search-for-chests'} disabled={working || Boolean(pendingCommand) || busy || !dispatchPreview?.enabled} onClick={() => void sendCommand(searchCommand)}>{dispatchMode === 'hunt' ? 'Săn bắt' : 'Tìm rương'}</button>
      </div>
      {busy && <small className="live-resource-access">Một thành viên đã có nhiệm vụ khác. Hãy chọn người đang rảnh.</small>}
      {dispatchPreview && <p className={dispatchPreview.enabled ? 'live-preview-success' : 'live-inline-error'}>{dispatchPreview.enabled ? 'Đã kiểm tra hành trình. Có thể điều động đội.' : availabilityMessage(dispatchPreview)}</p>}
      {knownTarget?.state === 'available' && <div className="live-hunt-row">
        <label className="live-inline-field">Chiến binh<select value={selectedHunter} onChange={event => setHuntActorId(event.target.value)}>
          <option value="">Chọn đơn vị còn sống</option>{livingUnits.map(unit => <option key={unit.id} value={unit.id} disabled={busyActorIds.has(unit.id)}>{unit.name}{busyActorIds.has(unit.id) ? ' · đang bận' : ''}</option>)}
        </select></label>
        <span>Mục tiêu đã thấy: {knownTarget.label}{huntRangeMetres === null ? '' : ` · cách ${huntRangeMetres} m`}</span>
        <button className="live-button" data-testid="engage-known-target" disabled={working || Boolean(pendingCommand) || huntingSquadIds.length === 0 || huntingSquadIds.some(id => busyActorIds.has(id))} onClick={() => void sendCommand(commandFor(view, 'attack', { actorIds: huntingSquadIds, targetId: knownTarget.id }))}>Tấn công</button>
        <small>Chỉ một chiến binh tham gia mỗi trận; các đơn vị còn lại vẫn làm việc bình thường.</small>
      </div>}
    </section>;
  }

  function pageContent(): ReactNode {
    if (!view) return null;
    const woodFuel = view.inventory.containers.flatMap(container => container.items
      .filter(item => item.label === 'WOOD' && item.quantity > 0)
      .map(item => ({ containerId: container.id, itemId: item.itemId, quantity: item.quantity })))[0];
    const repairHouse = view.territory.buildings.find(building => building.kind === 'lord_house');
    const constructionContainer = view.inventory.containers.find(container => container.id === constructionContainerId);
    const normalizedInventoryFilter = inventoryFilter.trim().toLocaleLowerCase();
    const inventoryContainers = view.inventory.containers.map(container => ({
      ...container,
      items: container.items.filter(item => !normalizedInventoryFilter || `${item.label} ${item.itemId} ${item.ownerId ?? ''} ${item.unit ?? ''} ${item.equipmentTags?.join(' ') ?? ''} ${item.provenance}`.toLocaleLowerCase().includes(normalizedInventoryFilter)),
    })).filter(container => !normalizedInventoryFilter || container.items.length > 0 || `${container.label} ${container.id} ${container.location.kind}`.toLocaleLowerCase().includes(normalizedInventoryFilter));
    const availableBlueprints = view.construction.blueprints.filter(blueprint => view.construction.unlockedBlueprintIds.includes(blueprint.id));
    const discoveredMarket = view.stage08.marketOffers.length > 0 || view.stage08.botMarketListings.length > 0 || view.stage08.auctionLots.length > 0;
    const selectedBlueprint = availableBlueprints.find(blueprint => blueprint.id === constructionBlueprintId);
    const parsedX = Number(constructionXMetres);
    const parsedY = Number(constructionYMetres);
    const constructionPosition: CoordinateMm | null = Number.isFinite(parsedX) && Number.isFinite(parsedY)
      && Math.abs(parsedX) <= 100 && Math.abs(parsedY) <= 100
      ? { xMm: Math.round(parsedX * 1_000), yMm: Math.round(parsedY * 1_000), sourceZMetres: 0 }
      : null;
    const repairCommand = repairHouse && constructionContainer
      ? commandFor(view, 'repair', { actorId: view.player.id, buildingId: repairHouse.id, containerId: constructionContainer.id })
      : null;
    const buildCommand = selectedBlueprint && constructionContainer && constructionPosition
      ? commandFor(view, 'build', {
        actorId: view.player.id, blueprintId: selectedBlueprint.id, siteId: 'SITE-LL01-000',
        containerId: constructionContainer.id, position: constructionPosition,
      })
      : null;
    const selectedCommandIsPreviewed = (command: CommandEnvelope | null) => Boolean(command && constructionPreview?.key === constructionCommandKey(command));
    const materialLine = (templateId: string, required: number) => {
      const stack = constructionContainer?.items.filter(item => item.label === templateId) ?? [];
      const quantity = stack.reduce((sum, item) => sum + item.quantity, 0);
      const reserved = stack.reduce((sum, item) => sum + item.reservedQuantity, 0);
      return `${playerItemName(templateId)}: cần ${required} · có ${Math.max(0, quantity - reserved)} · đã dành ${reserved}`;
    };
    const accessibleEventContainers = view.inventory.containers.filter(container => container.accessible)
      .map(container => ({ id: container.id, label: playerContainerName(container.label) }));
    const eventBoard = () => <EventBoard
      mode="live"
      events={view.calendar}
      nowElapsedMs={view.simElapsedMs}
      formatTime={elapsedLabel}
      destinationOptions={accessibleEventContainers}
      busy={working || Boolean(pendingCommand)}
      blocker={view.eventProgressionBlocker}
      onChoosePath={(eventId, choiceId) => { void sendCommand(commandFor(view, 'choose_event_path', { eventId, choiceId })); }}
      onClaimReward={eventId => { void sendCommand(commandFor(view, 'claim_event_reward', { eventId })); }}
      onBuyMark={(eventId, destinationContainerId) => { void sendCommand(commandFor(view, 'buy_event_offer', { eventId, destinationContainerId, quantity: 1 })); }}
    />;
    if (screen === 'character') {
      return <div className="live-section-stack live-character-page">
        <CharacterSummary mode="live" name={view.player.name} title={view.player.talent.name} grade={view.player.talent.grade}
          level={view.player.level} xp={view.player.xp} mana={view.player.mana} />
        <LiveCharacterLoadout view={view} />
        <div className="character-details-grid">
          <section className="panel character-details-card">
            <div className="character-details-heading"><Shield size={19}/><div><span className="eyebrow">THUỘC TÍNH HIỆN TẠI</span><h2>Thuộc tính</h2></div></div>
            <div className="live-attribute-grid">{Object.entries(view.player.attributes).map(([key, value]) =>
              <article key={key}><span>{key}</span><strong>{value}</strong></article>)}</div>
          </section>
          <section className="panel character-details-card">
            <div className="character-details-heading"><Sparkles size={19}/><div><span className="eyebrow">NGHỀ NGHIỆP VÀ KỸ NĂNG</span><h2>Kỹ năng</h2></div></div>
            <p>{view.player.careerState === 'active' ? view.careerCard.career?.name ?? 'Đã kích hoạt' : 'Chưa kích hoạt nghề nghiệp'}</p>
            {view.player.skills?.length ? <ul className="live-plain-list">{view.player.skills.map(skill =>
              <li key={skill.id}><strong>{playerItemName(skill.templateId)}</strong><span>Thông thạo {skill.mastery}{skill.active ? ' · đang dùng' : ''}</span></li>)}</ul>
              : <p className="live-muted">Chưa có kỹ năng được ghi nhận.</p>}
          </section>
        </div>
      </div>;
    }
    if (screen === 'events') return <div className="live-section-stack">
      {view.calendar.length > 0 ? eventBoard() : <section className="live-panel"><h2>Sự kiện</h2><p className="live-empty-state">Chưa có sự kiện nào được công bố.</p></section>}
      {view.calendar.some(event => event.id === 'EV01-OPENING-LEVEL') && <OpeningRankingBoard
        board={view.stage08.openingBoard}
        snapshots={view.stage08.rankSnapshots}
        playerId={view.player.id}
        formatTime={elapsedLabel}
        busy={working || Boolean(pendingCommand)}
        onClaim={boardId => { void sendCommand(commandFor(view, 'claim_opening_rank_reward', { boardId })); }}
      />}
    </div>;
    if (screen === 'overview') {
      return <div className="live-section-stack">
        <LiveOverview view={view} onNavigate={setScreen} />
        <section className="live-panel" aria-label="Thẻ nghề nghiệp">
          <div className="live-panel-heading">
            <div><span className="live-eyebrow">NGHỀ NGHIỆP</span><h3>{view.careerCard.observed ? 'Thẻ nghề nghiệp' : 'Thẻ nghề nghiệp chưa kiểm tra'}</h3></div>
            <Shield size={21} />
          </div>
          {view.careerCard.observed && view.careerCard.career
            ? <><p>{view.careerCard.career.name} · phân bổ tăng trưởng {view.careerCard.career.growthAllocation}</p>
              <p>{view.careerCard.active ? 'Nghề nghiệp đã kích hoạt.' : 'Thẻ đã mở; bạn có thể kích hoạt nghề nghiệp.'} {view.careerCard.openingSkillLearned ? 'Kỹ năng mở đầu đã học.' : 'Kỹ năng chưa được học.'}</p>
              {!view.careerCard.active && <button className="live-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'activate_career_card', { cardId: view.careerCard.career!.id }))}>Kích hoạt nghề nghiệp</button>}
              {view.player.skills?.map(skill => <small key={skill.id}>{playerItemName(skill.templateId)} · thông thạo {skill.mastery}</small>)}
            </>
            : <><p>Hãy kiểm tra thẻ nghề nghiệp để biết nội dung.</p>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_career_card', {}))}><Eye size={16} /> Kiểm tra thẻ nghề nghiệp</button></>}
        </section>
        {view.construction.rewardEntitlements.map(reward =>
          <p className="live-inline-error" key={reward.id}>Phần thưởng thành tựu đang chờ hoàn tất: {playerMessage(reward.blocker)}</p>)}
        {view.calendar.length > 0 && eventBoard()}
        <details className="live-panel live-overview-diagnostics">
          <summary>Tình trạng lượt chơi</summary>
          
          <p>Tốc độ thời gian: {view.clockControl.speedPermille / 1000}×</p>
          <p>Dân cư: {view.construction.occupiedHousing}/{view.construction.farmerHouseCapacity} · Nhiên liệu: {view.territory.survivalFire.fuelKnowledge === 'known' ? 'đã xác định' : 'chưa xác định'}</p>
        </details>
      </div>;
    }

    if (screen === 'territory') {
      const settlement = territorySettlement!;
      const territorySelection = territoryRef(selectedRef);
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading">
            <div><span className="live-eyebrow">LÃNH ĐỊA</span><h2>Lãnh địa</h2></div>
            <span className="live-data-chip">Lửa Sinh Tồn · Cấp {view.territory.survivalFire.level}</span>
          </div>
          <p className="live-muted">Quản lý các công trình đã phát hiện và theo dõi vùng nhiệt quanh lửa trại.</p>
          <TerritoryScene
            mode="live"
            visualIdentity={view.saveId}
            terrainRegions={liveTerrainRegions(view)}
            playerMarkerVisible
            settlement={settlement}
            placementDefinitions={[]}
            camera={territoryCamera}
            onCameraChange={setTerritoryCamera}
            drafts={territoryDrafts}
            onDraftsChange={setTerritoryDrafts}
            selectedRef={territorySelection}
            onSelectEntity={ref => setSelectedRef(ref)}
            focusedBuildingId={focusedConstructionBuildingId}
            onFocusHandled={() => setFocusedConstructionBuildingId(null)}
            readability={territoryReadability}
            onReadabilityChange={setTerritoryReadability}
            playerName={view.player.name}
            playerPosition={{ x: view.player.position.xMm / 1_000, y: view.player.position.yMm / 1_000 }}
            followPlayer={followTerritoryPlayer}
            onFollowPlayerChange={setFollowTerritoryPlayer}
            onOpenPlayerProfile={() => setScreen('character')}
          />
        </section>
        <div className="live-two-column">
          <section className="live-panel">
            <span className="live-eyebrow">LỬA SINH TỒN</span>
            <h3>{entityLabel(fireEntity)}</h3>
            <p>Cấp {view.territory.survivalFire.level} · bán kính nhiệt {view.territory.survivalFire.heatRadiusMetres} m</p>
            <p>Bảo vệ: {playerStatus(view.territory.survivalFire.protection)}</p>
            <p>Nhiên liệu đã biết: {view.territory.survivalFire.fuelRemaining ?? 'chưa xác định'} · lần tiêu thụ kế: {elapsedLabel(view.territory.survivalFire.nextFuelConsumptionAtElapsedMs)}</p>
            {view.territory.survivalFire.fuelBlocker && <p className="live-muted">Chặn nhiên liệu: {playerMessage(view.territory.survivalFire.fuelBlocker)}</p>}
            <div className="live-button-row">
              {fireEntity && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void runInspection(fireEntity)}><Eye size={15} /> Kiểm tra lửa</button>}
              <button className="live-button live-button--secondary" title={woodFuel ? 'Chuyển 1 gỗ đã quan sát vào lửa; tổng nhiên liệu mở đầu vẫn chưa được tiết lộ.' : 'Không có gỗ trong túi đồ ở gần.'} disabled={working || Boolean(pendingCommand) || !woodFuel} onClick={() => woodFuel && void sendCommand(commandFor(view, 'refuel_fire', { containerId: woodFuel.containerId, itemId: woodFuel.itemId, quantity: 1 }))}>Nạp 1 gỗ</button>
              {view.territory.survivalFire.active
                ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'extinguish_fire', {}))}>Tắt lửa</button>
                : <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !view.territory.survivalFire.hasFuel} onClick={() => void sendCommand(commandFor(view, 'light_fire', {}))}>Nhóm lửa</button>}
            </div>
            {fireEntity && <button className="live-button live-button--secondary" onClick={() => setScreen('map')}>Xem lửa trại trên bản đồ <ArrowRight size={15} /></button>}
          </section>
          <section className="live-panel">
            <span className="live-eyebrow">CÔNG TRÌNH</span>
            <h3>{view.territory.buildings.length} công trình</h3>
            {view.territory.buildings.length
              ? <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name}</strong><span>{playerStatus(building.status)} · {building.position ? `${(building.position.xMm / 1000).toFixed(1)}, ${(building.position.yMm / 1000).toFixed(1)} m` : 'tọa độ chưa biết'} · {building.footprintAreaM2 ?? 'chưa rõ'} m²</span></li>)}</ul>
              : <p>Chưa ghi nhận công trình nào.</p>}
            <p>Nhà ở: {view.construction.occupiedHousing}/{view.construction.farmerHouseCapacity} chỗ · nhiên liệu lửa: {view.territory.survivalFire.fuelRemaining ?? 'chưa biết'} gỗ · công trình đang làm: {view.construction.jobs.filter(job => job.status === 'active' || job.status === 'paused' || job.status === 'blocked').length}</p>
            {view.construction.jobs.filter(job => job.status === 'active' || job.status === 'paused' || job.status === 'blocked').map(job => <p key={job.id}>{job.kind === 'repair' ? 'Sửa chữa' : 'Xây dựng'} · {playerStatus(job.status)} · tiến độ {Math.min(100, Math.floor(100 * job.progressTicks / Math.max(1, job.workUnitsRequired * 300)))}% · dự kiến xong {elapsedLabel(job.estimatedCompletionAtElapsedMs)}</p>)}
          </section>
        </div>
      </div>;
    }

    if (screen === 'map') return renderMap();

    if (screen === 'inventory') {
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">HÀNH TRANG</span><h2>Kho vật phẩm</h2></div><PackageOpen size={22} /></div>
          <p className="live-muted">Các túi và vật phẩm bạn đã kiểm tra. Đến gần túi đồ trước khi chuyển vật phẩm.</p>
          <label className="live-inline-field live-inventory-search">Tìm vật phẩm hoặc kho <input aria-label="Tìm vật phẩm hoặc kho" value={inventoryFilter} onChange={event => setInventoryFilter(event.target.value)} placeholder="Tên vật phẩm, túi đồ…" /></label>
          {view.inventory.inspectableContainers.length > 0 && <div className="live-inspectable-list">
            {view.inventory.inspectableContainers.map(container => <article key={container.containerId} className="live-container-row">
              <div><strong>{playerContainerName(container.label)}</strong><small>Chưa kiểm tra túi đồ</small></div>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)}
                onClick={() => void sendCommand(commandFor(view, 'inspect_starter_container', { containerId: container.containerId }))}><Eye size={15}/> Kiểm tra</button>
            </article>)}
          </div>}
          {inventoryContainers.length > 0
            ? <div className="live-inventory-grid">{inventoryContainers.map(container => <article className="live-container-card" key={container.id}>
                <div className="live-panel-heading"><h3>{playerContainerName(container.label)}</h3>
                  <span>{container.occupiedSlots}/{container.capacitySlots ?? '∞'} ô đã dùng</span></div>
                <small className="live-container-access">Vị trí: {playerStorageLocation(view, container)} · {container.accessible ? 'Trong tầm với' : 'Ngoài tầm với'}</small>
                {container.items.length
                  ? <ul className="live-inventory-art-list" aria-label="Các vật phẩm trong kho">{container.items.map(item => <li key={item.itemId}>
                    {itemArtPath(item.label)
                      ? <img className="live-item-art" src={itemArtPath(item.label)!} alt="" aria-hidden="true"/>
                      : <span className="live-item-placeholder-art" aria-hidden="true"><PackageOpen size={28}/></span>}
                    <div className="live-item-card-copy">
                      <strong className="live-item-name">{playerItemName(item.label)}</strong>
                      <span className="live-item-quantity">Số lượng: {item.quantity}</span>
                      {item.reservedQuantity > 0 && <small>Đang dành cho công việc: {item.reservedQuantity}</small>}
                      {item.equipped && <small>Đang trang bị</small>}
                    </div>
                    <details className="live-item-details"><summary>Chi tiết và chuyển đồ</summary>
                      <div className="live-item-details-body">
                        <p>Có thể dùng: {Math.max(0, item.quantity - item.reservedQuantity)}</p>
                        {item.ownerId && <p>Chủ sở hữu: {playerOwnerName(view, item.ownerId)}</p>}
                        {item.condition !== null && item.condition !== undefined && <p>Độ bền: {Math.round(item.condition * 100)}%</p>}
                        {item.foodUnitsPerItem !== null && <p>Thực phẩm: {item.foodUnitsPerItem} phần mỗi món</p>}
                        {view.inventory.containers.filter(target => target.id !== container.id).map(target =>
                          <button key={target.id} className="live-text-button"
                            disabled={working || Boolean(pendingCommand) || !container.accessible || !target.accessible || item.quantity <= item.reservedQuantity}
                            title={!container.accessible || !target.accessible ? 'Hãy đến gần cả hai túi đồ trước khi chuyển.' : `Chuyển vật phẩm sang ${playerContainerName(target.label)}`}
                            onClick={() => void sendCommand(commandFor(view, 'transfer_item', {
                              actorId: view.player.id, sourceContainerId: container.id, destinationContainerId: target.id,
                              itemId: item.itemId, quantity: item.quantity - item.reservedQuantity,
                            }))}>Chuyển sang {playerContainerName(target.label)}</button>)}
                      </div>
                    </details>
                    {item.label === 'BREAD' && item.foodUnitsPerItem !== null && <button className="live-button live-button--secondary"
                      disabled={working || Boolean(pendingCommand) || !container.accessible || item.quantity <= item.reservedQuantity}
                      title="Dùng một phần bánh mì trong túi."
                      onClick={() => void sendCommand(commandFor(view, 'consume_item', {
                        actorId: view.player.id, containerId: container.id, itemId: item.itemId, quantity: 1,
                      }))}>Ăn 1 bánh mì</button>}
                  </li>)}</ul>
                  : <p>Đã kiểm tra, túi hiện không có vật phẩm.</p>}
              </article>)}</div>
            : view.inventory.inspectableContainers.length === 0 && <p className="live-empty-state">Chưa có túi đồ được kiểm tra.</p>}
        </section>
        {view.currency.length > 0 && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">TIỀN TỆ ĐÃ NHẬN</span><h3>Số dư</h3></div><PackageOpen size={20} /></div>
          {view.currency.length
            ? <ul className="live-plain-list">{view.currency.map(balance => <li key={balance.currencyId}><strong>{balance.currencyId}</strong><span>{balance.amount.toLocaleString()}</span></li>)}</ul>
            : <p className="live-empty-state">Chưa có tiền tệ sự kiện nào được ghi nhận.</p>}
        </section>}
        {discoveredMarket && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">CHỢ</span><h3>Giao dịch tại Cổng Krona</h3></div><PackageOpen size={20} /></div>
          {view.stage08.marketOffers.length > 0
            ? <div className="live-job-list">{view.stage08.marketOffers.map(offer => {
              const balance = view.currency.find(item => item.currencyId === offer.currencyId)?.amount ?? 0;
              const bag = view.inventory.containers.find(container => container.kind === 'carried_bag' && container.accessible);
              const remainingCap = Math.max(0, offer.lifetimePurchaseLimit - offer.purchasedQuantity);
              const available = offer.status === 'active' && offer.stockRemaining > 0 && remainingCap > 0 && balance >= offer.unitPrice && Boolean(bag);
              return <article key={offer.id} className="live-container-row">
                <div><strong>{playerItemName(offer.itemTemplateId)} · {offer.unitPrice} {offer.currencyId}/món</strong>
                  <small>Còn {offer.stockRemaining}/{offer.initialStock} món · có thể mua thêm {remainingCap} lần · {offer.expiresAtElapsedMs === null ? 'không có hạn' : `hết hạn ${elapsedLabel(offer.expiresAtElapsedMs)}`}</small>
                  {!bag && <small>Kiểm tra túi đồ mang theo để nhận vật phẩm.</small>}
                  {balance < offer.unitPrice && <small>Cần thêm {offer.unitPrice - balance} {offer.currencyId}.</small>}
                </div>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !available}
                  title={!bag ? 'Hãy kiểm tra túi đồ mang theo.' : !available ? 'Chưa đủ điều kiện mua vật phẩm này.' : 'Thanh toán và nhận vật phẩm.'}
                  onClick={() => bag && void sendCommand(commandFor(view, 'shop_transaction', { offerId: offer.id, destinationContainerId: bag.id, quantity: 1 }))}>
                  Mua · nhận {offer.quantityPerPurchase} {playerItemName(offer.itemTemplateId)}
                </button>
              </article>;
            })}</div>
            : <p className="live-empty-state">Quầy giao thương sẽ mở khi đoàn xe của Torven đến Cổng Krona. Hàng trong kho chỉ hiện khi Lí Lan ở gần quầy.</p>}
          {view.stage08.botMarketListings.length > 0
            ? <div className="live-job-list" aria-label="Bản vẽ do các lãnh chúa rao bán">{view.stage08.botMarketListings.map(listing => {
              const paymentStack = listing.paymentResource === 'food'
                ? view.inventory.containers.filter(container => container.accessible).flatMap(container => container.items
                  .filter(item => item.label === 'BREAD' && item.unit === 'item' && item.foodUnitsPerItem === 1
                    && !item.equipped && item.reservedQuantity === 0 && (item.ownerId === null || item.ownerId === view.player.id)
                    && item.quantity >= listing.askAmount)
                  .map(item => ({ containerId: container.id, itemId: item.itemId, containerLabel: container.label })))
                  .sort((a, b) => a.containerId.localeCompare(b.containerId) || a.itemId.localeCompare(b.itemId))[0]
                : undefined;
              const alreadyUnlocked = listing.compatibleBlueprintId !== null
                && view.construction.unlockedBlueprintIds.includes(listing.compatibleBlueprintId);
              const blocked = Boolean(listing.blocker) || !listing.compatibleBlueprintId || alreadyUnlocked;
              const canBuy = !blocked && Boolean(paymentStack) && !working && !pendingCommand;
              return <article key={listing.id} className="live-container-row" data-testid="bot-market-listing">
                <div><strong>{playerBlueprintName(view, listing.compatibleBlueprintId ?? listing.blueprintId)} · người bán: {listing.sellerName}</strong>
                  <small>{listing.paymentResource === 'food' ? `${listing.askAmount} bánh mì` : `${listing.askAmount.toLocaleString()} mL nước`} · hết hạn {elapsedLabel(listing.expiresAtElapsedMs)}</small>
                  {listing.compatibleBlueprintId && <small>Bản vẽ nhận được: {playerBlueprintName(view, listing.compatibleBlueprintId)}</small>}
                  {listing.blocker && <small>Chưa thể mua: {playerMessage(listing.blocker)}</small>}
                  {alreadyUnlocked && <small>Bản vẽ này đã được mở khóa.</small>}
                  {!blocked && !paymentStack && <small>Cần {listing.askAmount} bánh mì trong túi đồ ở gần.</small>}
                </div>
                <button className="live-button live-button--secondary" disabled={!canBuy}
                  title={listing.blocker ?? (alreadyUnlocked ? 'Bản vẽ đã được mở khóa.' : !paymentStack ? 'Cần đủ bánh mì trong túi đồ ở gần.' : 'Bạn phải đến gần người bán để thực hiện giao dịch.')}
                  onClick={() => paymentStack && void sendCommand(commandFor(view, 'buy_bot_market_listing', {
                    listingId: listing.id, paymentContainerId: paymentStack.containerId, paymentItemId: paymentStack.itemId,
                  }))}>
                  {listing.paymentResource === 'food' ? `Mua · ${listing.askAmount} bánh mì` : 'Chưa hỗ trợ thanh toán nước'}
                </button>
              </article>;
            })}</div>
            : <p className="live-empty-state">Các lãnh chúa có thể bán bản vẽ tại Cổng Krona. Hãy đến gần để xem hàng đang bán.</p>}
          {view.stage08.auctionLots.map(lot => {
            const balance = view.currency.find(item => item.currencyId === lot.currencyId)?.amount ?? 0;
            const bidId = view.stage08.auctionBids.find(bid => bid.lotId === lot.id && bid.status === 'open')?.id;
            return <article key={lot.id} className="live-container-row">
              <div><strong>{playerItemName(lot.itemTemplateId)} · còn {lot.quantity - lot.reservedQuantity}/{lot.quantity}</strong>
                <small>Giá khởi điểm {lot.minimumUnitBid} {lot.currencyId}/món · kết thúc {elapsedLabel(lot.closesAtElapsedMs)}. Tiền đặt giá sẽ được giữ đến khi kết thúc.</small>
              </div>
              {bidId
                ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_auction_bid', { bidId }))}>Hủy đặt giá · nhận lại tiền</button>
                : <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || lot.status !== 'open' || lot.quantity <= lot.reservedQuantity || balance < lot.minimumUnitBid}
                  onClick={() => void sendCommand(commandFor(view, 'place_auction_bid', { lotId: lot.id, quantity: 1, unitBid: lot.minimumUnitBid }))}>Đặt giá 1 {playerItemName(lot.itemTemplateId)} · giữ {lot.minimumUnitBid} {lot.currencyId}</button>}
            </article>;
          })}
          {view.stage08.auctionBids.length > 0 && <ul className="live-plain-list">{view.stage08.auctionBids.map(bid => <li key={bid.id}>
            <strong>Đặt giá · {playerStatus(bid.status)}</strong><span>{bid.quantity} món · giá {bid.unitBid} {view.stage08.auctionLots.find(lot => lot.id === bid.lotId)?.currencyId ?? ''} · đã giữ {bid.escrowAmount}</span>
          </li>)}</ul>}
        </section>}
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">TÀI NGUYÊN</span><h3>Những nơi đã khám phá</h3></div><PackageOpen size={20} /></div>
          {view.spatial.resources.length ? <ul className="live-plain-list">{view.spatial.resources.map(resource => <li key={resource.resourceId}>
            <strong>{resource.materialName}</strong><span>{resource.remaining === null ? 'Chưa rõ trữ lượng' : `${resource.remaining} ${resource.unit}`} · {resource.reserved ?? 0} đã giữ · {playerStatus(resource.status)}</span>
          </li>)}</ul> : <p className="live-empty-state">Chưa khám phá địa điểm có tài nguyên.</p>}
          {view.spatial.harvestJobs.length > 0 && <div className="live-job-list">{view.spatial.harvestJobs.map(job => <article key={job.id} className="live-container-row">
            <div><strong>{playerItemName(job.materialId)} · {playerStatus(job.stage)} · {playerStatus(job.status)}</strong><small>Đã thu {job.extractedQuantity}/{job.requestedQuantity} · {Math.floor(view.jobs.find(item => item.id === job.id)?.progressPercent ?? 0)}%</small></div>
            {job.status === 'active' && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Hủy chuyến đi</button>}
          </article>)}</div>}
        </section>
      </div>;
    }

    if (screen === 'forces') {
      const livingUnits = view.units.filter(unit => unit.health?.current !== 0);
      const activeOrders = view.spatial.searchJobs.filter(job => job.status === 'active').length
        + view.spatial.movementOrders.filter(order => order.status === 'active').length
        + view.spatial.harvestJobs.filter(job => job.status === 'active').length;
      return <div className="live-section-stack live-force-page">
        <section className="stats-grid live-forces-stats" aria-label="Tổng quan quân lực">
          <article className="stat-card"><span className="stat-icon"><Shield size={20}/></span><span>Đơn vị còn sống</span><strong>{livingUnits.length}</strong><small>Số lượng có trong lượt lưu</small></article>
          <article className="stat-card stat-card--ice"><span className="stat-icon"><Sparkles size={20}/></span><span>Thiên phú chính</span><strong>{view.player.talent.grade}</strong><small>{view.player.talent.name}</small></article>
          <article className="stat-card"><span className="stat-icon"><Users size={20}/></span><span>Đội đang làm nhiệm vụ</span><strong>{activeOrders}</strong><small>Lệnh di chuyển, tìm kiếm và thu thập</small></article>
          <article className="stat-card stat-card--warm"><span className="stat-icon"><Layers size={20}/></span><span>Đang sản xuất tại Mộ</span><strong>{view.territory.tomb.activeCount}</strong><small>{view.territory.tomb.productionSlots} ô sản xuất</small></article>
        </section>
        <section className="live-panel live-force-roster">
        <div className="live-panel-heading"><div><span className="live-eyebrow">QUÂN LỰC</span><h2>Quân lực</h2></div><Users size={22} /></div>
        {view.combat?.target && <article className="live-container-card" data-testid="stage07-combat-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">TRẬN CHIẾN ĐẦU TIÊN</span><h3>{view.combat.target.label}</h3></div>
            <span className="live-data-chip">{playerStatus(view.combat.target.state)}</span></div>
          <p>Con mồi đang ở gần lãnh địa. Hãy chọn chiến binh đủ sức và trang bị vũ khí trước khi tấn công.</p>
          {view.combat.target.state === 'available' && <div className="live-button-row">
            <label className="live-inline-field">Chiến binh<select aria-label="Chiến binh giao chiến" value={combatActorId || view.units.find(unit => unit.health && unit.health.current > 0)?.id || ''}
              onChange={event => setCombatActorId(event.target.value)}>
              <option value="">Chọn đơn vị sống thuộc quyền Lí Lan</option>
              {view.units.filter(unit => unit.health && unit.health.current > 0).map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            <button className="live-button" disabled={working || Boolean(pendingCommand) || !(combatActorId || view.units.some(unit => unit.health && unit.health.current > 0))}
              onClick={() => {
                const actorId = combatActorId || view.units.find(unit => unit.health && unit.health.current > 0)?.id || '';
                if (actorId) void sendCommand(commandFor(view, 'attack', { actorIds: [actorId], targetId: view.combat!.target!.id }));
              }}>Tấn công theo thời gian mô phỏng</button>
          </div>}
          {view.combat.encounter && <div>
            <p>{playerStatus(view.combat.encounter.status)} · vòng {view.combat.encounter.round} · {view.combat.encounter.nextTurnAtElapsedMs === null ? 'đã kết thúc' : 'lượt kế tiếp ' + elapsedLabel(view.combat.encounter.nextTurnAtElapsedMs)}</p>
            {view.combat.encounter.status === 'active' && <><p>Thỏ băng {view.combat.encounter.targetHealth.current}/{view.combat.encounter.targetHealth.max} máu · thời gian {view.clockControl.status === 'running' ? 'đang chạy' : 'đang dừng'}.</p>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'retreat', { actorIds: view.combat!.encounter!.actorIds, encounterId: view.combat!.encounter!.id }))}>Ra lệnh rút lui</button>
            </>}
            {view.combat.encounter.log.length > 0 && <ul className="live-plain-list">{view.combat.encounter.log.map((entry, index) => <li key={entry.atElapsedMs + ':' + index}>
              <strong>Vòng {index + 1} · {entry.actorId === view.combat!.target!.id ? 'Thỏ băng' : view.units.find(unit => unit.id === entry.actorId)?.name ?? 'Chiến binh'} · {playerStatus(entry.outcome)}</strong>
              <span>Gây {entry.damage} · nhận {entry.damageTaken} · sức khỏe chiến binh {entry.actorHealth} · mục tiêu {entry.targetHealth}/{view.combat!.encounter!.targetHealth.max}</span>
            </li>)}</ul>}
          </div>}
          {view.combat.target.state === 'dead' && <p>Thi thể thật đã được đánh dấu trên bản đồ. Hãy chọn thi thể để kiểm tra hồ sơ trước khi Tử Phục.</p>}
          {view.combat.target.state === 'retreated' && <p>Con mồi đã chạy thoát. Không có thi thể hoặc kinh nghiệm nhận được.</p>}
        </article>}
        {view.units.length
          ? <div className="live-force-unit-grid">{view.units.map(unit => {
            const routeLabel = unit.creationRoute === 'DIRECT_TU_PHUC' ? 'Được Lí Lan Tử Phục' : unit.creationRoute === 'TOMB_QUEUE' ? 'Được tạo từ Mộ' : 'Đơn vị thuộc quyền Lí Lan';
            const inCombat = view.combat?.encounter?.status === 'active' && view.combat.encounter.actorIds.includes(unit.id);
            const accessibleItems = view.inventory.containers.filter(container => container.accessible).flatMap(container => container.items);
            return <article key={unit.id} className="live-container-card">
              <div className="live-panel-heading"><h3>{unit.name}</h3><span className="live-data-chip">{routeLabel}</span></div>
              <p>Bậc {unit.sourceStats.formTier} · Cấp {unit.level} · Phẩm {unit.sourceStats.grade} · XP {unit.xp}</p>
              <p>Phe {playerStatus(unit.sourceStats.faction)} · hoạt động {inCombat ? 'đang giao chiến' : unit.health?.current === 0 ? 'đã gục' : 'sẵn sàng'}.</p>
              {unit.health && <p>Sức khỏe {unit.health.current}/{unit.health.max} · độ nguyên vẹn {unit.integrity ?? '—'}%</p>}
              <p>{unit.xpMirrorEligible ? 'Kinh nghiệm chiến đấu được chia sẻ với Lí Lan.' : 'Kinh nghiệm không được chia sẻ với Lí Lan.'}</p>
              {unit.attributes && <p>Thuộc tính: {Object.entries(unit.attributes).map(([stat, value]) => `${stat} ${value}`).join(' · ')}</p>}
              {unit.skills?.length ? <p>Kỹ năng: {unit.skills.map(skill => `${playerItemName(skill.templateId)} · thông thạo ${skill.mastery}`).join(' · ')}</p> : <p>Chưa ghi nhận kỹ năng riêng.</p>}
              {unit.equipmentSlots?.map(slot => {
                const item = accessibleItems.find(candidate => candidate.itemId === slot.occupiedItemId);
                const options = accessibleItems.filter(candidate => !candidate.equipped && candidate.ownerId === view.player.id
                  && (candidate.equipmentTags ?? []).some(tag => slot.allowedTags.includes(tag)));
                return <div className="live-container-row" key={slot.slotId}>
                  <div><strong>{slot.slotId === 'MAIN_HAND' ? 'Tay chính' : slot.slotId === 'BODY' ? 'Thân' : slot.slotId}</strong>
                    <small>{item ? playerItemName(item.label) : 'Trống'}{item?.condition !== null && item?.condition !== undefined ? ` · độ bền ${Math.round(item.condition * 100)}%` : ''}</small>{item && item.combatEffects && <small>{Object.entries(item.combatEffects).map(([effect, value]) => `${effect === 'weaponBase' ? 'sát thương cơ bản' : effect === 'armor' ? 'giáp' : effect} ${value}`).join(' · ')}</small>}</div>
                  {item
                    ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'unequip_item', { unitId: unit.id, itemId: item.itemId }))}>Tháo</button>
                    : options[0] && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'equip', { unitId: unit.id, itemId: options[0].itemId, slotId: slot.slotId }))}>Trang bị {playerItemName(options[0].label)}</button>}
                </div>;
              })}
            </article>;
          })}</div>
          : <p className="live-empty-state">Chưa có đơn vị thuộc quyền người chơi.</p>}
        {view.corpses && view.corpses.length > 0 && <><h3>Thi thể đã biết</h3><ul className="live-plain-list">{view.corpses.map(corpse => <li key={corpse.id} data-testid="force-corpse-row">
          <strong>{corpse.label}</strong><span>{corpse.inspected ? `Bậc ${corpse.tier ?? '—'} · Cấp ${corpse.level ?? '—'} · Phẩm ${corpse.grade ?? '—'} · nguyên vẹn ${corpse.integrity ?? '—'}%` : 'Chưa kiểm tra.'}</span>
          {!corpse.inspected && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_entity', { entity: { type: 'corpse', id: corpse.id } }))}>Kiểm tra thi thể</button>}
          {corpse.inspected && <button className="live-button" disabled={working || Boolean(pendingCommand) || !corpse.revive.enabled} onClick={() => void sendCommand(commandFor(view, 'revive', { actorId: view.player.id, corpseId: corpse.id }))}>Tử Phục</button>}
          {corpse.inspected && !corpse.revive.enabled && <small>{availabilityMessage(corpse.revive)}</small>}
          {corpse.inspected && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !corpse.butcher.enabled} onClick={() => void sendCommand(commandFor(view, 'butcher_corpse', { actorId: view.player.id, corpseId: corpse.id }))}>Phân giải vĩnh viễn</button>}
          {corpse.inspected && !corpse.butcher.enabled && <small>{availabilityMessage(corpse.butcher)}</small>}
        </li>)}</ul></>}
        <h3>Việc Mộ đang chờ</h3>
        <TombQueueList view={view} working={working} blocked={Boolean(pendingCommand)} onCancel={cancelTombJob} />
      </section>
      {renderDispatchPanel()}
      </div>;
    }

    if (screen === 'buildings') {
      return <div className="live-section-stack live-buildings-page">
        <section className="panel live-building-gallery-panel" aria-label="Các công trình thực tế trong lãnh địa">
          <div className="block-title">
            <div><span className="eyebrow">CÔNG TRÌNH TRONG LƯỢT CHƠI</span><h2>Danh sách công trình</h2></div>
            <button className="text-button" onClick={() => setScreen('territory')}>Mở lãnh địa <ArrowRight size={15}/></button>
          </div>
          {view.territory.buildings.length ? <div className="building-grid live-building-gallery">
            {view.territory.buildings.map(building => {
              const artId = artForLiveBuildingKind(building.kind);
              const assetKnown = !artId.startsWith('unregistered-building:');
              return <button type="button" key={building.id}
                className="panel building-card live-building-gallery-card"
                onClick={() => { setFocusedConstructionBuildingId(building.id); setScreen('territory'); }}
                aria-label={`Xem ${building.name} trên bản đồ lãnh địa`}>
                <div className="building-thumb live-building-gallery-art">
                  {assetKnown ? <img src={`/assets/buildings/${artId}/icon.svg`} alt="" loading="lazy"/> : <Hammer size={35} strokeWidth={1.2} aria-hidden="true"/>}
                </div>
                <div className="building-info">
                  <span>Cấp {building.level} · {building.status === 'active' ? 'Hoạt động' : building.status === 'damaged' ? 'Hư hại' : building.status}</span>
                  <h3>{building.name}</h3>
                  <p>{building.footprintAreaM2 === null ? 'Kích thước chưa xác định' : `${building.footprintAreaM2} m²`}</p>
                  <span className="building-open">Xem trên lãnh địa <ArrowRight size={15}/></span>
                </div>
              </button>;
            })}
          </div> : <p className="live-empty-state">Chưa có công trình được ghi nhận.</p>}
        </section>
      <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">XÂY DỰNG</span><h2>Công trình và sửa chữa</h2></div><Hammer size={22} /></div>
        {focusedConstructionBuildingId && <p className="live-preview-success">Đang xem: {view.territory.buildings.find(building => building.id === focusedConstructionBuildingId)?.name ?? 'Công trình'}. Thông tin nằm phía dưới.</p>}
        <p className="live-muted">Kiểm tra vật liệu và nhân công trước khi bắt đầu. Vật liệu chỉ được giữ lại khi công việc bắt đầu.</p>
        {repairHouse && repairHouse.status === 'damaged' && <article className="live-construction-card">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SỬA CHỮA</span><h3>{repairHouse.name}</h3></div><span className="live-data-chip">{playerStatus(repairHouse.status)}</span></div>
          <p>Cần 20 gỗ, 10 đá và búa đá cho mỗi người làm. Tối đa 2 nhân công. Tu sửa Nhà Lãnh Chúa sẽ mở Sổ Kiến Trúc.</p>
          {repairHouse.position && <p>Tọa độ: {(repairHouse.position.xMm / 1000).toFixed(1)}, {(repairHouse.position.yMm / 1000).toFixed(1)} m · người chơi: {(view.player.position.xMm / 1000).toFixed(1)}, {(view.player.position.yMm / 1000).toFixed(1)} m</p>}
          <div className="live-building-form">
            <label className="live-inline-field">Túi dùng nguyên liệu <select value={constructionContainer?.id ?? ''} onChange={event => { setConstructionContainerId(event.target.value); setConstructionPreview(null); }}>
              <option value="" disabled>Chọn túi đồ đã kiểm tra</option>
              {view.inventory.containers.map(container => <option key={container.id} value={container.id}>{playerContainerName(container.label)} · {container.accessible ? 'trong tầm với' : 'ngoài tầm với'}</option>)}
            </select></label>
            <div className="live-button-row">
              {repairHouse.position && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination: repairHouse.position! }))}>Đến Nhà Lãnh Chúa</button>}
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !repairCommand} onClick={() => repairCommand && void previewConstructionCommand(repairCommand)}>Kiểm tra sửa chữa</button>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !repairCommand || !selectedCommandIsPreviewed(repairCommand) || !constructionPreview?.availability.enabled} onClick={() => repairCommand && void sendCommand(repairCommand)}>Bắt đầu sửa chữa</button>
            </div>
          </div>
          {constructionContainer && <p className="live-muted">{materialLine('WOOD', 20)} · {materialLine('STONE', 10)} · {materialLine('STONE-HAMMER', 1)} dụng cụ sẵn có</p>}
          {repairCommand && selectedCommandIsPreviewed(repairCommand) && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? 'Đã kiểm tra điều kiện, có thể bắt đầu.' : availabilityMessage(constructionPreview!.availability)}</p>}
          <p className="live-muted">Đứng trong phạm vi 5 m quanh hòm tiếp tế để lấy nguyên liệu. Túi đang mang chỉ sử dụng được khi đứng gần công trình.</p>
        </article>}
        {repairHouse?.status === 'active' && <p className="live-preview-success">Nhà Lãnh Chúa đã sửa. {view.construction.unlockedBlueprintIds.length} bản vẽ đã được mở.</p>}

        {view.territory.buildings.some(building => building.kind === 'heater' && building.status === 'active') && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SƯỞI ẤM</span><h3>Lò Sưởi Đơn Giản</h3></div><Flame size={20} /></div>
          {view.territory.buildings.filter(building => building.kind === 'heater' && building.status === 'active').length === 0
            ? <p className="live-empty-state">Chưa có lò sưởi đang hoạt động. Xây lò sưởi cần 6 đá.</p>
            : view.territory.buildings.filter(building => building.kind === 'heater' && building.status === 'active').map(building => {
              const service = view.construction.operatingServices.find(item => item.buildingId === building.id && item.status === 'active');
              const operationCommand = constructionContainer ? commandFor(view, 'operate_heater', { actorId: view.player.id, buildingId: building.id, containerId: constructionContainer.id }) : null;
              const operationPreviewed = selectedCommandIsPreviewed(operationCommand);
              return <article className="live-construction-card" key={building.id}>
                <strong>{building.name} · {service ? 'đang sưởi ấm' : 'chưa hoạt động'}</strong>
                <p>Đốt 1 gỗ trong 20 phút để tăng nhiệt độ 15–20°C cho phòng tối đa 30 m². Chỉ có hiệu lực trong phòng này.</p>
                {service && <p className="live-preview-success">Đang sưởi ấm · còn {Math.ceil(service.remainingMs / 60_000)} phút · đã giữ 1 gỗ.</p>}
                {operationCommand && <div className="live-button-row">
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !constructionContainer?.accessible} onClick={() => void previewConstructionCommand(operationCommand)}>Kiểm tra đốt lò</button>
                  <button className="live-button" disabled={working || Boolean(pendingCommand) || !operationPreviewed || !constructionPreview?.availability.enabled} onClick={() => void sendCommand(operationCommand)}>Sưởi trong 20 phút</button>
                </div>}
                {operationCommand && operationPreviewed && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? 'Đã kiểm tra điều kiện, có thể bắt đầu.' : availabilityMessage(constructionPreview!.availability)}</p>}
              </article>;
            })}
        </section>}

        {availableBlueprints.length > 0 && <article className="live-construction-card">
          <div className="live-panel-heading"><div><span className="live-eyebrow">QUY HOẠCH LÃNH ĐỊA</span><h3>Đặt công trình</h3></div></div>
          <div className="live-building-form">
            <label className="live-inline-field">Bản vẽ <select value={constructionBlueprintId} onChange={event => { setConstructionBlueprintId(event.target.value); setConstructionPreview(null); }}>
              <option value="" disabled>Chọn bản vẽ đã mở</option>
              {availableBlueprints.map(blueprint => <option key={blueprint.id} value={blueprint.id}>{blueprint.name}</option>)}
            </select></label>
            <label className="live-inline-field">X (m) <input inputMode="decimal" value={constructionXMetres} onChange={event => { setConstructionXMetres(event.target.value); setConstructionPreview(null); }} /></label>
            <label className="live-inline-field">Y (m) <input inputMode="decimal" value={constructionYMetres} onChange={event => { setConstructionYMetres(event.target.value); setConstructionPreview(null); }} /></label>
            <div className="live-button-row">
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !constructionPosition} onClick={() => constructionPosition && void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination: constructionPosition }))}>Đến vị trí xây dựng</button>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !buildCommand} onClick={() => buildCommand && void previewConstructionCommand(buildCommand)}>Kiểm tra vị trí xây</button>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !buildCommand || !selectedCommandIsPreviewed(buildCommand) || !constructionPreview?.availability.enabled} onClick={() => buildCommand && void sendCommand(buildCommand)}>Bắt đầu xây</button>
            </div>
          </div>
          {selectedBlueprint && <>
            <p>Nguyên liệu: {selectedBlueprint.buildCost.map(item => `${item.quantity} ${playerItemName(item.materialId)}`).join(' + ')} · tối đa {selectedBlueprint.maxWorkers} nhân công · diện tích {selectedBlueprint.footprint.areaM2 !== null ? `${selectedBlueprint.footprint.areaM2} m²` : `${selectedBlueprint.footprint.lengthM} m chiều dài`}.</p>
            {constructionContainer && <p className="live-muted">{selectedBlueprint.buildCost.map(item => materialLine(item.materialId, item.quantity)).join(' · ')}</p>}
            <p>Công dụng: {selectedBlueprint.outputs.map(playerItemName).join(' · ') || 'Chưa rõ'}.</p>
            {!selectedBlueprint.upgrade && <p className="live-muted">Chưa thể nâng cấp công trình này.</p>}
          </>}
          {buildCommand && selectedCommandIsPreviewed(buildCommand) && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? 'Đã kiểm tra điều kiện, có thể bắt đầu.' : availabilityMessage(constructionPreview!.availability)}</p>}
          <p className="live-muted">Có thể xây trong phạm vi 100 m quanh trại. Hãy đứng cách điểm xây tối đa 5 m và tránh chồng lấn với các công trình khác.</p>
        </article>}

        <div className="live-two-column">
          <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">CÔNG VIỆC</span><h3>Tiến độ và nhân công</h3></div><Users size={20} /></div>
            {view.construction.jobs.length ? <ul className="live-job-list">{view.construction.jobs.map(job => {
              const percent = job.workUnitsRequired === 0 ? 100 : Math.min(100, job.progressTicks / (job.workUnitsRequired * 300) * 100);
              const nearbyUnits = view.units.filter(unit => unit.position && Math.hypot(unit.position.xMm - job.position.xMm, unit.position.yMm - job.position.yMm) <= 5_000);
              const maxWorkers = job.kind === 'repair' ? 2 : view.construction.blueprints.find(blueprint => blueprint.id === job.blueprintId)?.maxWorkers ?? 0;
              const combinedWorkers = [...new Set([...job.workerIds, ...nearbyUnits.map(unit => unit.id)])].slice(0, maxWorkers);
              return <li key={job.id} className="live-construction-job">
                <strong>{job.kind === 'repair' ? 'Sửa Nhà Lãnh Chúa' : playerBlueprintName(view, job.blueprintId)} · {playerStatus(job.status)}</strong>
                <span>Đã hoàn thành {percent.toFixed(1)}% · dự kiến xong {elapsedLabel(job.estimatedCompletionAtElapsedMs)}</span>
                <small>Nhân công: {job.workerIds.length ? job.workerIds.map(id => playerOwnerName(view, id)).join(', ') : 'Chưa có'} · vật liệu đã giữ: {job.costReservations.map(item => `${item.quantity} ${playerItemName(item.templateId)}`).join(', ') || 'Không có'}</small>
                {(job.status === 'active' || job.status === 'paused' || job.status === 'blocked') && <div className="live-button-row">
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || combinedWorkers.length === job.workerIds.length} onClick={() => void sendCommand(commandFor(view, 'assign_construction_workers', { jobId: job.id, workerIds: combinedWorkers }))}>Thêm nhân công ở gần</button>
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || job.workerIds.length === 0} onClick={() => void sendCommand(commandFor(view, 'assign_construction_workers', { jobId: job.id, workerIds: [] }))}>Tạm dừng</button>
                  <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_construction_job', { jobId: job.id }))}>Hủy và hoàn trả nguyên liệu đã giữ</button>
                </div>}
              </li>;
            })}</ul> : <p className="live-empty-state">Chưa bắt đầu công trình nào.</p>}
          </section>
          {(availableBlueprints.some(blueprint => /nông phu/i.test(blueprint.name)) || view.territory.buildings.some(building => building.kind === 'polar_farmhouse')) && <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">NHÀ Ở VÀ LƯƠNG THỰC</span><h3>Nhà nông phu cực địa</h3></div><Users size={20} /></div>
            <p>Chỗ ở: {view.construction.occupiedHousing}/{view.construction.farmerHouseCapacity} · {view.construction.residents.length} cư dân.</p>
            <p className="live-muted">Chiêu mộ một cư dân cần 5 phần lương thực từ túi đồ đang trong tầm với.</p>
            {view.territory.buildings.filter(building => building.kind === 'polar_farmhouse' && building.status === 'active').map(building => <div className="live-button-row" key={building.id}>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !constructionContainer} onClick={() => constructionContainer && void sendCommand(commandFor(view, 'recruit_resident', { buildingId: building.id, containerId: constructionContainer.id, quantity: 1 }))}>Chiêu mộ 1 cư dân · 5 phần lương thực</button>
            </div>)}
            {view.construction.residents.length ? <ul className="live-plain-list">{view.construction.residents.map(resident => <li key={resident.id}><strong>{resident.name}</strong><span>Đã dùng {resident.foodUnitsPaid} phần lương thực · {playerStatus(resident.upkeepStatus)}</span></li>)}</ul> : <p className="live-empty-state">Chưa có cư dân được chiêu mộ.</p>}
            {view.construction.rewardEntitlements.map(reward => <p className="live-inline-error" key={reward.id}>Phần thưởng đang chờ: {playerMessage(reward.blocker)}</p>)}
          </section>}
        </div>

        {availableBlueprints.length > 0 && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SỔ KIẾN TRÚC</span><h3>Công trình đã mở</h3></div><Shield size={20} /></div>
          <ul className="live-plain-list">{availableBlueprints.map(blueprint => <li key={blueprint.id}>
            <strong>{blueprint.name}</strong>
            <span>{blueprint.buildCost.map(item => `${item.quantity} ${playerItemName(item.materialId)}`).join(' + ')} · {blueprint.footprint.areaM2 !== null ? `${blueprint.footprint.areaM2} m²` : `${blueprint.footprint.lengthM} m chiều dài`}</span>
          </li>)}</ul>
        </section>}
        {view.territory.buildings.length > 0 && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">CÔNG TRÌNH ĐÃ BIẾT</span><h3>Công trình trong lãnh địa</h3></div><Hammer size={20} /></div>
          <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name} · cấp {building.level} · {playerStatus(building.status)}</strong><span>{building.position ? `${(building.position.xMm / 1000).toFixed(1)}, ${(building.position.yMm / 1000).toFixed(1)} m` : 'chưa xác định'} · {building.footprintAreaM2 ?? 'chưa rõ'} m²</span></li>)}</ul>
        </section>}
      </section>
      <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">LĂNG MỘ</span><h2>Hàng đợi Mộ Bậc {view.territory.tomb.level}</h2></div><Shield size={22} /></div>
        <p>Cương thi được tạo: Bậc {view.territory.tomb.output.formTier} · phẩm {view.territory.tomb.output.grade} · cấp {view.territory.tomb.output.level}.</p>
        <p>{view.territory.tomb.deathQi.current}/{view.territory.tomb.deathQi.capacity} Tử Khí · {view.territory.tomb.activeCount}/{view.territory.tomb.productionSlots} ô đang chạy · hồi lúc {elapsedLabel(view.territory.tomb.deathQi.nextRefillAtElapsedMs)}</p>
        <div className="live-button-row"><button className="live-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'enqueue_tomb', { blueprintId: 'LL-TOMB-ZOMBIE-STANDARD-01' }))}>Xếp một Cương Thi tiêu chuẩn</button></div>
        <TombQueueList view={view} working={working} blocked={Boolean(pendingCommand)} onCancel={cancelTombJob} />
      </section></div>;
    }

    return <section className="live-panel">
      <div className="live-panel-heading"><div><span className="live-eyebrow">NHẬT KÝ</span><h2>Nhật ký</h2></div><ScrollText size={22} /></div>
      <div className="live-two-column">
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SỰ KIỆN</span><h3>Lịch sử sự kiện</h3></div></div>
          {view.calendar.length
            ? <ul className="live-plain-list">{view.calendar.map(event => <li key={event.id}>
              <strong>{event.displayName} · {playerStatus(event.status)}</strong>
              <span>{event.status === 'active' ? `Khóa lúc ${elapsedLabel(event.locksAtElapsedMs)}`
                : event.status === 'locked' ? `Quyết toán lúc ${elapsedLabel(event.resolvesAtElapsedMs)}`
                  : event.status === 'resolved' ? `Kết thúc lúc ${elapsedLabel(event.resolvesAtElapsedMs)}`
                    : event.status === 'blocked' ? `Tạm dừng lúc ${elapsedLabel(view.eventProgressionBlocker?.blockedAtElapsedMs ?? view.simElapsedMs)}`
                      : `Mở lúc ${elapsedLabel(event.opensAtElapsedMs)}`}</span>
            </li>)}</ul>
            : <p className="live-empty-state">Chưa có sự kiện nào được biết.</p>}
        </section>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">NHIỆM VỤ</span><h3>Nhiệm vụ</h3></div></div>
          {view.quests.length
            ? <ul className="live-plain-list">{view.quests.map(quest => <li key={quest.questId}>
              <strong>Nhiệm vụ · {playerStatus(quest.state)}</strong>
              <span>{quest.rewardReceipt ? 'Đã nhận phần thưởng' : quest.completedAt !== null ? `Hoàn tất lúc ${elapsedLabel(quest.completedAt)}` : quest.acceptedAt !== null ? `Nhận lúc ${elapsedLabel(quest.acceptedAt)}` : 'Đang chờ điều kiện đã biết'}</span>
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'open' && <>
                <span>Đoàn xe của Torven gặp nguy hiểm gần cây cầu trên đường thương mại cũ. Hạn nhận lời: {elapsedLabel(view.stage08.caravan?.deadlineAtElapsedMs ?? null)}.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'accept_quest', { questId: quest.questId }))}>Nhận nhiệm vụ hộ tống</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-NEGOTIATE-AND-ESCORT' && <>
                <span>Thỏa thuận lối đi an toàn bằng một bao lương thực từ đoàn xe.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'negotiate_caravan', { questId: quest.questId, route: 'trade_one_grain_sack' }))}>Thương lượng · 1 bao lương thực</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-ESCORT-TO-KRONA-GATE' && <>
                <span>Đến cây cầu gặp đoàn xe và hộ tống họ tới cổng Krona trước hạn.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'escort_caravan', { questId: quest.questId }))}>Hộ tống đoàn xe</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-ARRIVE-AT-KRONA-GATE' && <span>Đoàn xe đang trên đường đến cổng Krona; dự kiến đến {elapsedLabel(view.stage08.caravan?.arrivalAtElapsedMs ?? null)}.</span>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'completed' && quest.rewardStatus === 'pending' && <>
                <span>Torven còn sống, ít nhất ba con vật kéo xe sống sót và sổ hàng còn nguyên. Đến cổng Krona để nhận thưởng.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'claim_quest_reward', { questId: quest.questId }))}>Nhận 60 Krona · mở tuyến buôn bán</button>
              </>}
            </li>)}</ul>
            : <p className="live-empty-state">Chưa có nhiệm vụ nào được mở trong lượt lưu này.</p>}
        </section>
      </div>
      {events.length
        ? <ol className="live-event-list">{events.map(item => <li key={item.eventId}><strong>{playerMessage(item.title)}</strong><p>{playerMessage(item.text)}</p></li>)}</ol>
        : <p className="live-empty-state">Chưa có sự kiện nào trong nhật ký.</p>}
    </section>;
  }

  const selectedSave = view ? saves.find(save => save.saveId === view.saveId) : null;

  if (!authenticated) {
    return <main className="live-start-page">
      <section className="live-start-card">
        {onExit && <button type="button" className="frozen-menu__back" onClick={onExit}>← Menu chính</button>}
        <span className="live-eyebrow">PHIÊN CHƠI CỤC BỘ</span>
        <h1>Kết nối trò chơi</h1>
        <p>Nhập khóa truy cập để mở các lượt chơi đã lưu. Khóa chỉ dùng để kết nối và không được lưu trên trình duyệt.</p>
        <div className={'live-api-status live-api-status--' + apiState}>
          <span className="live-status-dot" />
          <span>{apiMessage || 'Đang kết nối…'}</span>
          {apiState === 'disconnected' && <button className="live-icon-button" aria-label="Thử kết nối lại" onClick={() => void checkApi()}><RefreshCw size={16} /></button>}
        </div>
        <form className="live-owner-form" onSubmit={connectOwner}>
          <label htmlFor="owner-key">Khóa chủ sở hữu cục bộ</label>
          <input id="owner-key" aria-label="Khóa chủ sở hữu" type="password" autoComplete="off" value={ownerKey} onChange={event => setOwnerKey(event.target.value)} required disabled={apiState !== 'ready' || working} />
          <small>Lấy khóa từ tệp cục bộ <code>.local/owner-key</code>.</small>
          <button className="live-button" type="submit" disabled={apiState !== 'ready' || working || !ownerKey}>
            {working ? 'Đang kết nối…' : 'Kết nối trò chơi'} <ArrowRight size={16} />
          </button>
        </form>
        <StatusBanner feedback={feedback} />
        <p className="live-footnote">Tiến trình được lưu tự động sau khi hành động hoàn tất.</p>
      </section>
    </main>;
  }

  if (!view) {
    return <main className="live-start-page">
      <section className="live-start-card live-save-picker">
        {onExit && <button type="button" className="frozen-menu__back" onClick={onExit}>← Menu chính</button>}
        <span className="live-eyebrow">CHỌN LƯỢT CHƠI</span>
        <h1>{pickerIntent === 'new' ? 'Trò chơi mới' : pickerIntent === 'load' ? 'Tải lượt lưu' : 'Chọn hoặc tạo lượt lưu'}</h1>
        <p>{pickerIntent === 'new' ? 'Bắt đầu một cuộc phiêu lưu mới. Vật phẩm và tiến trình được tách biệt với các lượt chơi khác.' :
          pickerIntent === 'load' ? 'Chọn một lượt đã tồn tại trên máy chủ để tiếp tục. Việc mở danh sách không tạo lượt mới.' :
          'Bắt đầu cuộc phiêu lưu mới hoặc tiếp tục lượt chơi đã lưu.'}</p>
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        {pickerIntent !== 'either' && <div className="live-picker-tabs" role="group" aria-label="Tạo mới hoặc tải lượt lưu">
          <button type="button" className={pickerIntent === 'new' ? 'is-active' : ''} aria-pressed={pickerIntent === 'new'} disabled={working} onClick={() => setPickerIntent('new')}>Trò chơi mới</button>
          <button type="button" className={pickerIntent === 'load' ? 'is-active' : ''} aria-pressed={pickerIntent === 'load'} disabled={working} onClick={() => setPickerIntent('load')}>Tải lượt lưu</button>
        </div>}
        {(pickerIntent === 'new' || pickerIntent === 'either') && <form className="live-owner-form" onSubmit={createFreshSave}>
          <label htmlFor="slot-name">Tên lượt lưu mới</label>
          <input id="slot-name" value={slotName} onChange={event => setSlotName(event.target.value)} maxLength={80} required disabled={working} />
          <button className="live-button" type="submit" disabled={working}>{working ? 'Đang tạo…' : 'Bắt đầu lượt chơi'} <ArrowRight size={16} /></button>
        </form>}
        {(pickerIntent === 'load' || pickerIntent === 'either') && (saves.length > 0 ? <div className="live-save-list">
          <h2>Lượt lưu có sẵn</h2>
          {saves.map(save => <button key={save.saveId} className="live-save-row" disabled={working} onClick={() => void openSave(save.saveId)}>
            <span><strong>{save.slotName}</strong><small>Tiếp tục cuộc phiêu lưu</small></span><ArrowRight size={17} />
          </button>)}
        </div> : <p className="live-empty-state" role="status">Chưa có lượt lưu trên máy chủ. Hãy chọn Trò chơi mới để bắt đầu.</p>)}
      </section>
    </main>;
  }

  return <div className="live-shell">
    <aside className="live-sidebar">
      <div className="live-brand"><img className="live-brand-emblem" src="/crest.svg" width={43} height={43} alt="Biểu tượng Ice Age Lord"/><div><strong>ICE AGE <em>LORD</em></strong><small>BIÊN NIÊN BĂNG PHONG</small></div></div>
      <div className="live-sidebar-status"><span className="live-status-dot" /> Đã sẵn sàng</div>
      <nav className="live-nav" aria-label="Màn hình game">
        {navigation.filter(item => item.id !== 'events' || view.calendar.length > 0).map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={'live-nav-item' + (screen === item.id ? ' is-active' : '')} aria-current={screen === item.id ? 'page' : undefined} onClick={() => setScreen(item.id)}>
            <Icon size={18} /><span><strong>{item.name}</strong><small>{item.hint}</small></span>
          </button>;
        })}
      </nav>
      <div className="live-sidebar-footer"><span>Đồng hồ thế giới</span><strong>{playerStatus(view.clockControl.status)}</strong></div>
    </aside>
    <main className="live-main">
      <header className="live-topbar">
        <ScreenHeading mode="live" className="live-topbar-heading" eyebrow="CUỘC HÀNH TRÌNH" title={navigation.find(item => item.id === screen)?.name ?? screen} description={`${selectedSave?.slotName || view.player.name} · Ngày ${view.worldClock.day} ${String(view.worldClock.hour).padStart(2, '0')}:${String(view.worldClock.minute).padStart(2, '0')}`}/>
        <div className="live-header-actions">
          {onExit && <button type="button" className="live-button live-button--secondary live-save-switch" disabled={working || Boolean(pendingCommand)} onClick={onExit}>Menu chính</button>}
          <button
            className="live-button live-button--secondary live-save-switch"
            title={pendingCommand ? 'Hãy hoàn tất hành động đang thực hiện.' : 'Chọn lượt chơi khác.'}
            disabled={working || Boolean(pendingCommand)}
            onClick={() => void returnToSavePicker()}
          >Đổi lượt lưu</button>
          
          <div className="live-clock-controls" aria-label="Điều khiển đồng hồ mô phỏng">
            <select aria-label="Tốc độ mô phỏng" value={customSelection ? 'custom' : view.clockControl.selection} disabled={working || Boolean(pendingCommand) || Boolean(view.eventProgressionBlocker) || view.clockStatus.driver !== 'active'} onChange={event => {
              const speed = event.target.value as ClockSpeedSelection;
              if (speed === 'custom') setCustomSelection(true);
              else { setCustomSelection(false); changeClockSpeed(speed); }
            }}>
              <option value="paused">Đóng băng</option><option value="1x">1×</option><option value="2x">2×</option><option value="5x">5×</option><option value="custom">Tùy chỉnh</option>
            </select>
            {(customSelection || view.clockControl.selection === 'custom') && <><input aria-label="Tốc độ tùy chỉnh" type="number" min="0.1" max="3600" step="0.1" value={customSpeed} onChange={event => setCustomSpeed(event.target.value)} disabled={Boolean(view.eventProgressionBlocker) || view.clockStatus.driver !== 'active'} /><button className="live-clock-apply" disabled={working || Boolean(pendingCommand) || Boolean(view.eventProgressionBlocker) || view.clockStatus.driver !== 'active' || Number(customSpeed) < 0.1 || Number(customSpeed) > 3600} onClick={() => { setCustomSelection(true); changeClockSpeed('custom'); }}>Áp dụng</button></>}
            <select aria-label="Điều kiện tự dừng" value={view.clockControl.stopCondition} disabled={working || Boolean(pendingCommand) || Boolean(view.eventProgressionBlocker) || view.clockStatus.driver !== 'active'} onChange={event => changeStopCondition(event.target.value as 'none' | 'next_completion' | 'danger')}>
              <option value="none">Không tự dừng</option><option value="next_completion">Dừng khi xong</option><option value="danger">Dừng khi nguy hiểm</option>
            </select>
          </div>
          {view.clockStatus.driver === 'observing' && <span className="live-driver-label">Tab khác đang giữ quyền</span>}
          <div className="live-notification-wrap">
            <button className="live-icon-button" aria-label="Mở thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}>
              <Bell size={17} />{events.length > 0 && <span className="live-notification-count">{Math.min(events.length, 99)}</span>}
            </button>
            {notificationsOpen && <section className="live-notification-popover" role="status" aria-label="Thông báo gần đây">
              <div className="live-notification-heading"><strong>Thông báo</strong><button className="live-text-button" onClick={() => setScreen('journal')}>Mở nhật ký</button></div>
              {events.length
                ? <ol className="live-event-list">{events.slice(-5).reverse().map(item => <li key={item.eventId}>
                  <strong>{playerMessage(item.title)}</strong><p>{playerMessage(item.text)}</p>
                </li>)}</ol>
                : <p className="live-empty-state">Chưa có thông báo.</p>}
            </section>}
          </div>
          <button className="live-icon-button" aria-label="Tải lại tiến trình" onClick={() => void loadLatest()} disabled={working}><RefreshCw size={17} /></button>
          <button type="button" className="profile-mini live-profile-mini" onClick={() => setScreen('character')}
            aria-label={`Mở hồ sơ người chơi: ${view.player.name}`}>
            <img className="profile-portrait" src="/assets/characters/li-lan-t0-portrait.svg?v=20261010" width={38} height={38} alt=""/>
            <span className="profile-name">{view.player.name}<small>Người chơi</small></span>
          </button>
        </div>
      </header>
      <div className="live-content">
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        <details className="live-runtime-details">
          <summary><span>Tình hình lãnh địa</span><span>Ngày {view.worldClock.day} · {playerStatus(view.clockControl.status)} · {view.territory.tomb.activeCount} đơn vị đang sản xuất</span></summary>
          <RuntimeStrip view={view}/>
        </details>
        <PageFrame mode="live" className={`live-screen live-screen--${screen}`}>{pageContent()}</PageFrame>
      </div>
      <footer className="live-footer" data-save-id={view.saveId} data-revision={view.revision}><span><img src="/crest.svg" width={21} height={21} alt=""/> ICE AGE LORD</span><span>{selectedSave?.slotName || 'Cuộc phiêu lưu của ' + view.player.name}</span></footer>
    </main>
  </div>;
}

export default LiveApp;
