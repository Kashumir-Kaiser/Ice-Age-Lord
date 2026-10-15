import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle, ArrowRight, Bell, CalendarDays, CheckCircle2, Eye, Flame, Hammer, Map as MapIcon,
  MapPin, PackageOpen, RefreshCw, ScrollText, Shield, Sparkles, UserRound, Users,
} from 'lucide-react';
import type {
  ActionAvailability, ClockSpeedSelection, CommandEnvelope, CommandPayloadByType, CommandType,
  CoordinateMm, EntityRef, PlayerEntityView, PlayerView,
} from '../../packages/contracts/src/index.ts';
import type { PlayerEvent, SaveSummary } from '../../packages/contracts/src/api.ts';
import { MarkerGraphic } from './map/MapLayers';
import { entityRefKey, GameApiError, HttpGameClient } from './live/HttpGameClient';
import { SaveResponseScopeGate } from './live/saveScope';
import { LIVE_SCREENS, type LiveScreen } from './live/screens';
import TerritoryScene from './territory/TerritoryScene';
import MapCanvas from './rendering/MapCanvas';
import { liveExplorationSnapshot, liveTerrainRegions } from './rendering/MapSceneAdapter';
import { territorySceneFromApi } from './live/territoryAdapter';
import type { EntityRef as DemoEntityRef, LayoutDraft } from './game/GameClient';
import type { TerritoryCamera } from './territory/projection';
import type { ReadabilityMode } from './territory/BuildingSprite';
import { EventBoard } from './shared/EventBoard';
import { CharacterArtwork, CharacterSummary, PageFrame, ScreenHeading } from './shared/PageFrame';
import { InspectorFrame, InspectorHeading } from './shared/InspectorFrame';
import { OpeningRankingBoard } from './shared/OpeningRankingBoard';

type Screen = LiveScreen;
type Feedback = { kind: 'idle' | 'saving' | 'committed' | 'rejected' | 'disconnected'; text: string };
const SAVE_KEY = 'ice-age-lord.live.last-save';
const CREATE_KEY_PREFIX = 'ice-age-lord.live.create-key:';
const RESOURCE_CARGO_IDS = new Set(['WOOD', 'STONE', 'RAW-ICE-WATER', 'BROWN-COAL', 'RAW-SALT', 'WILD-FOOD']);
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
    COMBAT_TARGET_UNAVAILABLE: 'Cá thể này đã rời khỏi encounter.',
    COMBAT_TARGET_DEAD: 'Cá thể này đã chết; hãy kiểm tra thi thể thật trên bản đồ.',
    COMBAT_ENCOUNTER_NOT_ACTIVE: 'Không có encounter đang diễn ra để rút lui.',
    COMBAT_WEAPON_REQUIRED: 'Trang bị vũ khí tương thích vào ô tay chính trước khi giao chiến.',
  };
  const reasonCode = availability.reasonCode;
  if (reasonCode && messages[reasonCode]) return messages[reasonCode];
  const reason = availability.requirements.join(' ');
  return reason || (reasonCode ? 'Hành động hiện không khả dụng.' : 'Hành động hiện không khả dụng.');
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
    ACTOR_ALREADY_TRAVELLING: 'This worker is travelling.',
    ACTOR_ASSIGNED_TO_SEARCH: 'This worker is assigned to a search.',
    ACTOR_ASSIGNED_TO_HARVEST: 'This worker is already harvesting.',
    REQUIRED_TOOL_NOT_CARRIED: 'The selected worker is missing the required tool.',
    LOAD_CAPACITY_EXCEEDED: 'Unload this worker’s cargo before harvesting.',
    NO_KNOWN_ROUTE: 'No known route currently reaches this deposit.',
    NO_SUPPORTED_ROUTE: 'The worker has no supported route to this deposit.',
    UNDERGROUND_ACCESS_REQUIRED: 'This resource requires underground access.',
    INSUFFICIENT_RESOURCE: 'The remaining stock or today’s quota is reserved or exhausted.',
    PROSPECTING_CONTRACT_NOT_COMPILED: 'Surveying is required, but that contract is not available yet.',
    WATER_PREPARATION_CONTRACT_NOT_COMPILED: 'Water preparation is required, but that contract is not available yet.',
    WORKFORCE_AND_FUEL_REQUIREMENTS_NOT_MET: 'This workfront needs its worker and fuel requirements first.',
  };
  return messages[availability.reasonCode ?? ''] ?? availability.requirements[0] ?? availability.reasonCode?.replaceAll('_', ' ').toLocaleLowerCase() ?? 'Harvesting is currently blocked.';
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
  const hours = Math.floor(elapsedMs / 3_600_000);
  const minutes = Math.floor((elapsedMs % 3_600_000) / 60_000);
  return `T+${hours}h${String(minutes).padStart(2, '0')}`;
}

function RuntimeStrip({ view }: { view: PlayerView }) {
  const { survivalFire, tomb } = view.territory;
  const dayTime = `Ngày ${view.worldClock.day} · ${String(view.worldClock.hour).padStart(2, '0')}:${String(view.worldClock.minute).padStart(2, '0')}`;
  const cold = view.survival.coldStatus === 'weather_unresolved'
    ? 'Chưa có thông tin thời tiết ban đầu'
    : `ColdLoad ${view.survival.coldLoad?.toFixed(1) ?? '—'} · ${view.survival.coldStatus}`;
  const fuel = survivalFire.fuelRemaining === null ? 'Chưa rõ lượng nhiên liệu' : `${survivalFire.fuelRemaining} gỗ`;
  const catchingUp = view.clockStatus.catchingUp
    ? `Đang quyết toán tới ${elapsedLabel(view.clockStatus.targetSimElapsedMs)}`
    : `${dayTime} · T+${elapsedLabel(view.simElapsedMs).slice(2)}`;
  return <section className="live-stage-strip" aria-label="Trạng thái thế giới">
    <div><span>Thế giới</span><strong>{catchingUp}</strong><small>{view.worldClock.lightPhase} · Bậc 0 là cấp đầu ra Mộ</small></div>
    <div><span>Lửa trại</span><strong>{survivalFire.active ? 'Đang hoạt động' : 'Đã tắt'} · {fuel}</strong><small>{survivalFire.fuelBlocker || `Bán kính nhiệt ${survivalFire.heatRadiusMetres} m · mốc đốt ${elapsedLabel(survivalFire.nextFuelConsumptionAtElapsedMs)}`}</small></div>
    <div><span>Sinh tồn</span><strong>{cold}</strong><small>{view.survival.blocker || `Đói: ${view.survival.hungerState}`}</small></div>
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
      <strong>{job.status === 'active' ? 'Đang sản xuất' : job.status === 'blocked' ? 'Đang chặn' : job.status === 'queued' ? 'Đang chờ ô' : job.status} · {job.outputUnitId}</strong>
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
      setApiMessage('API sẵn sàng · SQLite · phiên cục bộ');
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
    const refreshClock = async () => {
      if (inFlight || working) return;
      inFlight = true;
      try {
        await client.heartbeatClock();
        if (!active || !saveScope.isCurrent(scope)) return;
        const nextView = await client.getView();
        if (active && saveScope.isCurrent(scope) && nextView.saveId === scope.saveId) {
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
        return [material.resourceId, { actionId: 'harvest', enabled: false, reasonCode: 'PREVIEW_UNAVAILABLE', requirements: ['The server could not check this harvest right now.'] }] as const;
      }
    })).then(entries => {
      if (active && saveScope.isCurrent(scope)) setHarvestAvailability(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [client, harvestActorId, saveScope, selectedRef?.id, selectedRef?.type, view?.revision, view?.saveId]);

  async function checkApi() {
    setApiState('checking');
    setApiMessage('Đang kiểm tra API cục bộ…');
    try {
      await client.health();
      setApiState('ready');
      setApiMessage('API sẵn sàng · SQLite · phiên cục bộ');
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
    try {
      await refreshEvents(nextView.lastEventSequence, scope);
    } catch (error) {
      if (saveScope.isCurrent(scope)) {
        setEvents([]);
        setFeedback({ kind: 'committed', text: 'Lượt lưu đã mở; nhật ký chưa tải được: ' + errorMessage(error) });
      }
    }
  }

  async function returnToSavePicker() {
    if (working || pendingCommand) return;
    setPickerIntent('either');
    const generation = saveScope.clear();
    setView(null);
    setSelectedRef(null);
    setTerritoryCamera(null);
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
        setFeedback({ kind: 'committed', text: 'Đã tải danh sách lượt lưu từ API.' });
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
          setFeedback({ kind: 'committed', text: 'Đã khôi phục đúng lượt lưu từ API.' });
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
    setFeedback({ kind: 'saving', text: 'Đang mở snapshot từ API…' });
    try {
      await activateSave(saveId);
      setFeedback({ kind: 'committed', text: 'Đã mở lượt lưu từ API.' });
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
    setFeedback({ kind: 'saving', text: 'Đang tạo clean game trên API…' });
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
      eventSequenceRef.current = 0;
      setEvents([]);
      setSelectedRef(nextView.territory.survivalFire.ref);
      localStorage.setItem(SAVE_KEY, result.save.saveId);
      localStorage.removeItem(storageKey);
      setSaves(current => [result.save, ...current.filter(save => save.saveId !== result.save.saveId)]);
      await refreshEvents(nextView.lastEventSequence, scope);
      setScreen('overview');
      setFeedback({
        kind: 'committed',
        text: (result.created ? 'Clean game đã được tạo và commit.' : 'Đã khôi phục yêu cầu tạo lượt lưu idempotent.')
          + ' Revision ' + nextView.revision + '.',
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
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang tải lại snapshot và event ledger…' });
    try {
      const nextView = await client.getView();
      if (!saveScope.isCurrent(scope) || nextView.saveId !== scope.saveId) return;
      setView(nextView);
      await refreshEvents(nextView.lastEventSequence, scope);
      setFeedback({ kind: 'committed', text: 'Đã tải lại revision ' + nextView.revision + ' từ API.' });
    } catch (error) {
      if (!saveScope.isCurrent(scope)) return;
      setFeedback({
        kind: error instanceof GameApiError && error.code === 'API_DISCONNECTED' ? 'disconnected' : 'rejected',
        text: errorMessage(error),
      });
    } finally {
      setWorking(false);
    }
  }

  async function sendCommand(command: CommandEnvelope, retry = false) {
    if (working || !view) return;
    const scope = saveScope.capture(view.saveId);
    if (!scope || command.saveId !== scope.saveId) return;
    setWorking(true);
    setFeedback({ kind: 'saving', text: retry ? 'Đang gửi lại cùng command ID…' : 'Đang kiểm tra lệnh với API…' });
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
        text: result.receipt.message + ' · revision ' + result.revision + ' đã commit.',
      });
      try {
        await refreshEvents(result.view.lastEventSequence, scope);
      } catch (error) {
        setFeedback({ kind: 'committed', text: 'Lệnh đã commit; event ledger chưa tải được: ' + errorMessage(error) });
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
    setFeedback({ kind: 'saving', text: 'Đang kiểm tra chi phí, nhân công và vị trí với API…' });
    try {
      const result = await client.previewCommand(command);
      if (!saveScope.isCurrent(scope)) return;
      setConstructionPreview({ key: constructionCommandKey(command), availability: result.availability });
      setFeedback({
        kind: result.availability.enabled ? 'committed' : 'rejected',
        text: result.availability.enabled
          ? `${result.availability.preview?.label ?? 'Construction preview'} · ${result.availability.preview?.value ?? 'server validation passed'}`
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
      setFeedback({ kind: 'rejected', text: !workerContainer ? 'Inspect the worker’s inventory before assigning this harvest.' : resource?.requiredToolTemplateId ? `Move a ${resource.requiredToolTemplateId} into this worker’s inventory first.` : 'This material is not currently available.' });
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
      setFeedback({ kind: 'rejected', text: inspection ? availabilityMessage(inspection) : 'API chưa cho phép kiểm tra điểm này.' });
      return;
    }
    inspectSelected(entity);
  }

  function renderMap(): ReactNode {
    if (!view) return null;
    const center = travelActorId === view.player.id ? view.player.position : view.units.find(unit => unit.id === travelActorId)?.position ?? view.player.position;
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
      <section className="live-panel">
        <div className="live-panel-heading">
          <div><span className="live-eyebrow">VISIBLE MAP · SERVER KNOWLEDGE</span><h2>Exploration and travel</h2></div>
          <span className="live-data-chip">{view.visibleMap.entities.length} entity</span>
        </div>
        <p className="live-muted">Camera movement only changes the view. Travel, sight, and searching change saved knowledge after the server settles them.</p>
        <div className="live-map-tools">
          <button className={'live-button' + (chooseDestination ? '' : ' live-button--secondary')} disabled={working || Boolean(pendingCommand)} onClick={() => {
            if (chooseDestination) {
              setChooseDestination(false);
              setDestination(null);
              setDestinationAvailability(null);
            } else setChooseDestination(true);
          }}>
            {chooseDestination ? 'Cancel destination selection' : 'Choose destination'}
          </button>
          <div className="live-zoom-controls"><button className="live-button live-button--secondary" aria-label="Zoom out" disabled={mapZoom <= 0.2} onClick={() => setMapZoom(value => Math.max(0.2, Math.round(value / 1.6 * 100) / 100))}>−</button><span>{mapZoom.toFixed(2)}×</span><button className="live-button live-button--secondary" aria-label="Zoom in" disabled={mapZoom >= 500} onClick={() => setMapZoom(value => Math.min(500, Math.round(value * 1.6 * 100) / 100))}>+</button><button className="live-button live-button--secondary live-map-overview" aria-label="Show map overview" onClick={() => setMapZoom(1)}>Overview</button></div>
          <label className="live-inline-field">Travel actor <select value={travelActorId} onChange={event => { setTravelActorId(event.target.value); setDestination(null); setDestinationAvailability(null); }}><option value={view.player.id}>{view.player.name}</option>{view.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <span className="live-data-chip">Center · {center.xMm}, {center.yMm} mm</span>
        </div>
        {chooseDestination && <p className="live-map-hint">Click an empty map coordinate to preview an order. Confirming travel is a separate action.</p>}
        {fireRef && !fireEntity && <div className="live-inline-error" role="alert">Không tìm thấy Lửa Sinh Tồn trên bản đồ hiện tại.</div>}
        {selectedEntity && !selectedCombatTarget && <InspectorFrame as="div" className="live-inspector" label="Selected map entity inspector" entityId={selectedEntity.ref.id} knowledge={selectedEntity.knowledge}>
          <InspectorHeading mode="live" eyebrow={`Selected · ${selectedEntity.category}`} title={entityLabel(selectedEntity)} description={`${selectedEntity.knowledge} · observed at ${elapsedLabel(selectedEntity.observedAtElapsedMs)}`}/>
          {selectedEntity.chestLoot && <div className="live-chest-loot" data-testid="chest-loot-inspector">
              <strong>{selectedEntity.chestLoot.rarity} · {selectedEntity.chestLoot.chestType} chest · {selectedEntity.chestLoot.rollCount} roll(s)</strong>
              {selectedEntity.chestLoot.eventId && <small>Pool scoped to {selectedEntity.chestLoot.eventId}; event items expire when the event resolves.</small>}
              {!selectedEntity.chestLoot.opened && <ul>{selectedEntity.chestLoot.odds.map(odds => <li key={odds.templateId}><span>{odds.templateId}</span><span>{(odds.chanceAtLeastOncePermille / 10).toFixed(1)}% chance · {odds.perRollPermille / 10}% per roll</span></li>)}</ul>}
              {selectedEntity.chestLoot.opened && selectedEntity.chestLoot.outcome && <ul>{selectedEntity.chestLoot.outcome.map(item => <li key={item.templateId}><span>{item.templateId}</span><span>×{item.quantity}</span></li>)}</ul>}
            </div>}
          <div className="live-action-stack">
            {selectedInspect && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !selectedInspect.enabled} onClick={() => void runInspection(selectedEntity)}><Eye size={16} /> Kiểm tra</button>}
            {selectedCorpse?.inspected && <div><p>Thi thể: Bậc {selectedCorpse.tier ?? '—'} · Cấp {selectedCorpse.level ?? '—'} · Phẩm {selectedCorpse.grade ?? '—'} · nguyên vẹn {selectedCorpse.integrity ?? '—'}%</p>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !selectedCorpse.revive.enabled} onClick={() => void sendCommand(commandFor(view, 'revive', { actorId: view.player.id, corpseId: selectedCorpse.id }))}>Tử Phục · không tốn Mana, vật liệu hay thời gian</button>
              {!selectedCorpse.revive.enabled && <small>{availabilityMessage(selectedCorpse.revive)}</small>}
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !selectedCorpse.butcher.enabled} onClick={() => void sendCommand(commandFor(view, 'butcher_corpse', { actorId: view.player.id, corpseId: selectedCorpse.id }))}>Phân giải vĩnh viễn · thu hồi trang bị đã ghi nhận</button>
              {!selectedCorpse.butcher.enabled && <small>{availabilityMessage(selectedCorpse.butcher)}</small>}
            </div>}
            {selectedMove && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || (travelActorId === view.player.id && !selectedMove.enabled)} onClick={() => moveToEntity(selectedEntity)}><ArrowRight size={16} /> Move here {travelActorId === view.player.id && selectedMove.preview?.value ? `· ${selectedMove.preview.value}` : ''}</button>}
            {selectedBuilding && <button className="live-button live-button--secondary" onClick={() => { setFocusedConstructionBuildingId(selectedBuilding.id); setScreen('buildings'); }}><Hammer size={16} /> Open {selectedBuilding.name} inspector</button>}
            {selectedEntity.ref.type === 'site' && selectedEntity.ref.id === 'SITE-LL01-000' && <button className="live-button live-button--secondary" onClick={() => { setFocusedConstructionBuildingId(null); setScreen('buildings'); }}><Hammer size={16} /> Open H0 construction inspector</button>}
            {selectedOpen && <small>{availabilityMessage(selectedOpen)}</small>}
            {selectedEntity.ref.type === 'cache' && selectedEntity.chestLoot && <button className="live-button" disabled={working || Boolean(pendingCommand) || !selectedOpen?.enabled || selectedEntity.chestLoot.opened}
              onClick={() => void sendCommand(commandFor(view, 'open_cache', { actorId: view.player.id, chestId: selectedEntity.ref.id }))}>Open chest · commit displayed odds</button>}
            {selectedInspect && !selectedInspect.enabled && <small>{availabilityMessage(selectedInspect)}</small>}
            {selectedMove && !selectedMove.enabled && <small>{availabilityMessage(selectedMove)}</small>}
            {selectedHarvest && !selectedHarvest.enabled && <small>{availabilityMessage(selectedHarvest)}</small>}
          </div>
        </InspectorFrame>}
        {selectedCombatTarget && <InspectorFrame as="div" className="live-inspector" label="Combat target inspector" testId="combat-target-inspector" entityId={selectedCombatTarget.id}>
          <InspectorHeading mode="live" eyebrow="Encounter target · H0" title={selectedCombatTarget.label}
            description={`${selectedCombatTarget.state === 'available' ? 'A known wildlife track is within sight.' : 'The target has reacted to the encounter.'} · regional population ${selectedCombatTarget.regionalPopulationRemaining}`}/>
          <div className="live-action-stack">
            <label className="live-inline-field">Fighter <select value={selectedCombatActorId} onChange={event => setCombatActorId(event.target.value)}>
              <option value="">Choose a living owned unit</option>{view.units.filter(unit => unit.health && unit.health.current > 0).map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            <button className="live-button" disabled={working || Boolean(pendingCommand) || selectedCombatTarget.state !== 'available' || !selectedCombatActorId}
              onClick={() => void sendCommand(commandFor(view, 'attack', { actorIds: [selectedCombatActorId], targetId: selectedCombatTarget.id }))}>Engage target</button>
            {!selectedCombatTarget.attack.enabled && <small>{availabilityMessage(selectedCombatTarget.attack)}</small>}
          </div>
        </InspectorFrame>}

        <div className="live-map-canvas" data-testid="live-map" onClickCapture={event => {
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
            setFeedback({ kind: 'idle', text: `Search area center selected · ${coordinate.xMm}, ${coordinate.yMm} mm.` });
          } else previewCoordinateDestination(coordinate);
        }}>
          <MapCanvas snapshot={liveExplorationSnapshot(view,center,horizontalSpanMm/1000,spanMm/1000)} label="Known frozen geography; use the map markers and destination controls to navigate."/>
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
                ? `${entity.label} · ${entity.resourceDeposit.materials.map(material => `${material.materialName}: ${material.remaining === null ? 'unknown' : `${material.remaining.toLocaleString()} ${material.unit}`}`).join(' · ')}`
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
                else setFeedback({ kind: 'idle', text: 'Return the settlement to current sight to inspect it.' });
              }}
              aria-label={bot.label} title={bot.label}><MapPin size={19} aria-hidden="true" /><span>{bot.label}</span></button>;
          })}
          {(view.visibleMap.enemyArmies ?? []).map(army => {
            const projected = point(army.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            const unitLabel = army.order === 'scout' ? 'scouts' : 'troops';
            const summary = army.knowledge === 'current' ? `${army.count} ${unitLabel} · ${army.order}` : `Last seen ${unitLabel} movement`;
            return <button key={`${army.botId}:${army.observedAtElapsedMs}`} className={'live-map-marker live-map-marker--enemy-army' + (army.knowledge === 'remembered' ? ' is-remembered' : '')}
              data-testid="map-enemy-army" style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setFeedback({ kind: 'idle', text: summary }); }}
              aria-label={summary} title={summary}><MapPin size={17} aria-hidden="true" /><span>{army.knowledge === 'current' ? `${army.count} ${unitLabel}` : 'Last seen'}</span></button>;
          })}
          {view.units.filter(unit => unit.position).map(unit => {
            const projected = point(unit.position!);
            return <span key={unit.id} className="live-map-unit" style={{ left: `${Math.max(2, Math.min(98, projected.x))}%`, top: `${Math.max(2, Math.min(98, projected.y))}%` }} title={unit.name}>{unit.name}</span>;
          })}
          {(() => { const projected = point(view.player.position); return <span className="live-map-player" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Lí Lan">LL</span>; })()}
          {destination && (() => { const projected = point(destination); return <span className="live-map-destination" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Selected destination" />; })()}
          {view.visibleMap.entities.length === 0 && !(view.visibleMap.enemyBots?.length) && !(view.visibleMap.enemyArmies?.length) && <p className="live-map-empty">No explored map entities are known yet.</p>}
        </div>
        {view.botInspection && <section className="live-bot-inspection" data-testid="bot-settlement-inspection">
          <strong>{view.botInspection.name}</strong>
          <span>Level {view.botInspection.level} · population {view.botInspection.population} · {view.botInspection.talent?.grade} {view.botInspection.talent?.kind}</span>
          <span>Army {(view.botInspection.army ?? []).reduce((sum, cohort) => sum + cohort.livingCount, 0)} · structures {(view.botInspection.structures ?? []).filter(item => item.status !== 'destroyed').length}</span>
          <span>Food {view.botInspection.resourceBalances?.food ?? 0} · wood {view.botInspection.resourceBalances?.wood ?? 0} · stone {view.botInspection.resourceBalances?.stone ?? 0} · ore {view.botInspection.resourceBalances?.ore ?? 0}</span>
          <div><strong>Structures</strong><ul>{(view.botInspection.structures ?? []).map(structure => <li key={structure.id}>
            {structure.blueprintId} · level {structure.level} · {structure.status}{structure.status === 'under_construction' ? ` · ${Math.floor(structure.workCompleted * 100 / Math.max(1, structure.workRequired))}%`
              : structure.status === 'damaged' && structure.repairWorkRequired > 0 ? ` · repair ${Math.floor(structure.repairWorkCompleted * 100 / structure.repairWorkRequired)}%` : ''}
          </li>)}</ul></div>
          <div><strong>Army cohorts</strong><ul>{(view.botInspection.army ?? []).map(cohort => <li key={cohort.id}>
            {cohort.livingCount} · {cohort.templateId} · level {cohort.level} · {cohort.order}
          </li>)}</ul></div>
        </section>}
        {destination && <div className="live-destination-preview">
          <div><strong>Destination preview</strong><span>{destination.xMm}, {destination.yMm} mm · {destinationAvailability?.preview?.value ?? (destinationAvailability ? availabilityMessage(destinationAvailability) : 'Calculating…')}</span></div>
          <button className="live-button" disabled={working || Boolean(pendingCommand) || !destinationAvailability?.enabled} onClick={() => void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination }))}>Start travel</button>
        </div>}
        {view.spatial.movementOrders.filter(order => order.status === 'active').map(order => <div key={order.id} className="live-destination-preview">
          <div><strong>Travel in progress</strong><span>{(order.totalDistanceMm / 1_000_000).toFixed(2)} km · {Math.floor(view.jobs.find(job => job.id === order.id)?.progressPercent ?? 0)}% · {order.pathSegments.some(segment => segment.uncertainty === 'uncertain') ? 'uncertain route' : 'known route'}</span></div>
          <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_travel', { orderId: order.id }))}>Cancel travel</button>
        </div>)}
        {resourceDeposit && <div className="live-resource-deposit" data-feature-id={resourceDeposit.featureId}>
            <p className="live-resource-terrain">{resourceDeposit.terrainKind} · footprint {((resourceDeposit.footprintMm.widthMm / 1_000).toLocaleString())} × {((resourceDeposit.footprintMm.depthMm / 1_000).toLocaleString())} m</p>
            <div className="live-resource-heat-status">
              <Flame size={15} />
              {!resourceDeposit.heatActive
                ? 'The survival fire is out; this deposit has no heating coverage.'
                : resourceDeposit.heatCovered
                ? `Inside the active ${resourceDeposit.heatRadiusMm / 1_000} m heating zone.`
                : `${(resourceDeposit.distanceFromHeatMm / 1_000).toFixed(0)} m from the fire; outside its ${resourceDeposit.heatRadiusMm / 1_000} m heating zone. Harvesting is allowed, but the worksite is not heated.`}
            </div>
            <p className="live-resource-haul">This worker can carry {resourceDeposit.carryCapacityUnits.toLocaleString()} resource units total ({maxHarvestQuantity.toLocaleString()} free). The H0 store holds {resourceDeposit.storageStackSlots ?? 'unlimited'} material stacks.</p>
            <label className="live-inline-field">Harvest worker <select value={harvestActorId} onChange={event => { setHarvestActorId(event.target.value); setHarvestQuantity(1); }}>
              <option value={view.player.id}>{view.player.name}</option>
              {view.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            {harvestActorBusy && <small className="live-resource-access">This worker is already travelling or assigned to another job.</small>}
            {!harvestWorkerContainer && <small className="live-resource-access">Inspect this worker’s inventory before assigning a harvest.</small>}
            <label className="live-inline-field live-resource-quantity">Harvest quantity <input type="number" min={1} max={Math.max(1, maxHarvestQuantity)} value={selectedHarvestQuantity} disabled={maxHarvestQuantity < 1} onChange={event => setHarvestQuantity(Math.min(Math.max(1, maxHarvestQuantity), Math.max(1, Number(event.target.value) || 1)))} /></label>
            <ul className="live-resource-materials">{resourceDeposit.materials.map(material => {
              const remaining = material.remaining === null ? 'Unknown' : `${material.remaining.toLocaleString()} ${material.unit}`;
              const renewal = material.renewal === 'none' ? 'Finite stock; does not regenerate.'
                : material.renewal === 'biological_rate' ? `Regrows ${material.regenerationPerDay.toLocaleString()} ${material.unit}/day.`
                  : `Daily supply ${material.dailyQuota?.toLocaleString() ?? '—'} ${material.unit}; resets at midnight.`;
              const workerHasTool = !material.requiredToolTemplateId || Boolean(harvestWorkerContainer?.items.some(item => item.label === material.requiredToolTemplateId && item.quantity > 0));
              const localBlock = !harvestWorkerContainer || harvestActorBusy || maxHarvestQuantity < 1 || material.access !== 'open_surface' || material.status === 'depleted' || !workerHasTool;
              const serverAvailability = harvestAvailability[material.resourceId];
              const blocked = localBlock || Boolean(serverAvailability && !serverAvailability.enabled);
              return <li key={material.resourceId}>
                <div><strong>{material.materialName}</strong><span>{remaining} / {material.capacity.toLocaleString()} {material.dailyQuota === null ? 'capacity' : 'daily quota'}{material.reserved ? ` · ${material.reserved.toLocaleString()} reserved` : ''}</span></div>
                <small>{material.harvestRateUnitsPerHour.toLocaleString()} {material.unit}/worker-hour{material.dailyQuota !== null ? ` · ${material.dailyRemaining?.toLocaleString() ?? 'Unknown'} / ${material.dailyQuota.toLocaleString()} available today` : ''} · {renewal}</small>
                {material.access !== 'open_surface' && <small className="live-resource-access">{material.accessReason ?? 'This material has an unresolved access requirement.'}</small>}
                {material.requiredToolTemplateId && <small className="live-resource-access">{workerHasTool ? `Worker carries ${material.requiredToolTemplateId}.` : `This worker needs a ${material.requiredToolTemplateId}.`}</small>}
                {material.status === 'depleted' && <small className="live-resource-access">{material.dailyQuota === null ? 'This deposit is exhausted.' : 'No usable stock remains today.'}</small>}
                {maxHarvestQuantity < 1 && <small className="live-resource-access">Unload this worker’s cargo at the territory store before harvesting again.</small>}
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
      {view.spatial.searchJobs.length > 0 && <ul className="live-plain-list">{view.spatial.searchJobs.map(job => <li key={job.id}><strong>{job.mode === 'hunt' ? 'Hunt sweep' : 'Chest search'} · {job.phase ?? 'sweeping'} · {job.status} · {Math.floor(view.jobs.find(item => item.id === job.id)?.progressPercent ?? 0)}%</strong><span>{job.actorIds.length} unit(s) · {job.uniqueAreaM2.toFixed(0)} m² unique · {job.repeatedAreaM2.toFixed(0)} m² repeated · {job.mode === 'hunt' ? `targets ${job.foundTargetCount}` : `signals ${job.foundChestCount}`} {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>{job.phase === 'returning' ? 'Returning' : 'Recall'}</button>}</span></li>)}</ul>}
        {view.spatial.harvestJobs.length > 0 && <ul className="live-plain-list">{view.spatial.harvestJobs.map(job => <li key={job.id}><strong>Harvest · {job.stage} · {job.status}</strong><span>{job.extractedQuantity}/{job.requestedQuantity} gathered {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Cancel</button>}</span></li>)}</ul>}
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

    return <section className="live-panel live-dispatch-panel" aria-label="Unit dispatch">
      <div className="live-panel-heading"><div><span className="live-eyebrow">AREA EXPEDITIONS · API CONTROLLED</span><h3>Unit dispatch</h3></div><Eye size={20} /></div>
      <p className="live-muted">Choose a chest search or wildlife hunt, set the sweep radius and optional stop limits, then send the selected squad. Limit conditions stop field work and start the return journey.</p>
      <label className="live-inline-field">Expedition task<select value={dispatchMode} onChange={event => { setDispatchMode(event.target.value as 'chest' | 'hunt'); setDispatchPreview(null); }}>
        <option value="chest">Search for chests</option><option value="hunt">Hunt mobs</option>
      </select></label>
      <div className="live-dispatch-grid">
        <label className="live-inline-field">Lead unit<select value={dispatchLeadActorId} onChange={event => { setDispatchLeadActorId(event.target.value); setDispatchPreview(null); }}>
          <option value={view.player.id}>{view.player.name}</option>{livingUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select></label>
        <label className="live-inline-field">Area radius<select value={searchRadiusMetres} onChange={event => { setSearchRadiusMetres(Number(event.target.value)); setDispatchPreview(null); }}><option value={250}>250 m</option><option value={500}>500 m</option><option value={1000}>1 km</option><option value={2000}>2 km</option></select></label>
        <label className="live-inline-field">Stop after targets<input type="number" min={1} max={192} step={1} placeholder="No target limit" value={dispatchTargetCount} onChange={event => { setDispatchTargetCount(event.target.value); setDispatchPreview(null); }} /></label>
        <label className="live-inline-field">Work time limit<select value={dispatchTimeLimitMinutes} onChange={event => { setDispatchTimeLimitMinutes(event.target.value); setDispatchPreview(null); }}><option value="">No time limit</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={240}>4 hours</option><option value={480}>8 hours</option><option value={1440}>24 hours</option></select></label>
      </div>
      {livingUnits.length > 0 && <fieldset className="live-dispatch-units"><legend>Additional scouts</legend>{livingUnits.filter(unit => unit.id !== dispatchLeadActorId).map(unit => <label key={unit.id}>
        <input type="checkbox" checked={additionalIds.includes(unit.id)} disabled={busyActorIds.has(unit.id)} onChange={event => {
          setDispatchAdditionalActorIds(current => event.target.checked ? [...new Set([...current, unit.id])] : current.filter(id => id !== unit.id));
          setDispatchPreview(null);
        }} />{unit.name}{busyActorIds.has(unit.id) ? ' · assigned' : ''}
      </label>)}</fieldset>}
      <div className="live-dispatch-center"><span>Center · {center.xMm.toLocaleString()} / {center.yMm.toLocaleString()} mm{dispatchCenter ? ' · custom' : ' · lead position'}</span>
        <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => { setChooseDestination(false); setChooseDispatchCenter(true); }}>{chooseDispatchCenter ? 'Click the map to set center' : 'Pick center on map'}</button>
        {dispatchCenter && <button className="live-text-button" onClick={() => { setDispatchCenter(null); setDispatchPreview(null); }}>Use lead position</button>}
      </div>
      <div className="live-button-row">
        <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || busy} onClick={() => void previewSearch()}>Preview expedition</button>
        <button className="live-button" data-testid={dispatchMode === 'hunt' ? 'hunt-area' : 'search-for-chests'} disabled={working || Boolean(pendingCommand) || busy || !dispatchPreview?.enabled} onClick={() => void sendCommand(searchCommand)}>{dispatchMode === 'hunt' ? 'Hunt mobs' : 'Search for chests'}</button>
      </div>
      {busy && <small className="live-resource-access">A selected actor is already assigned to travel, combat, or another field job.</small>}
      {dispatchPreview && <p className={dispatchPreview.enabled ? 'live-preview-success' : 'live-inline-error'}>{dispatchPreview.enabled ? `${dispatchPreview.preview?.label}: ${dispatchPreview.preview?.value}` : availabilityMessage(dispatchPreview)}</p>}
      {knownTarget?.state === 'available' && <div className="live-hunt-row">
        <label className="live-inline-field">Fighter<select value={selectedHunter} onChange={event => setHuntActorId(event.target.value)}>
          <option value="">Choose a living owned unit</option>{livingUnits.map(unit => <option key={unit.id} value={unit.id} disabled={busyActorIds.has(unit.id)}>{unit.name}{busyActorIds.has(unit.id) ? ' · assigned' : ''}</option>)}
        </select></label>
        <span>Known target · {knownTarget.label}{huntRangeMetres === null ? '' : ` · ${huntRangeMetres} m away`}</span>
        <button className="live-button" data-testid="engage-known-target" disabled={working || Boolean(pendingCommand) || huntingSquadIds.length === 0 || huntingSquadIds.some(id => busyActorIds.has(id))} onClick={() => void sendCommand(commandFor(view, 'attack', { actorIds: huntingSquadIds, targetId: knownTarget.id }))}>Engage target</button>
        <small>Each encounter currently uses one fighter. Other units can continue their own work.</small>
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
    const selectedBlueprint = view.construction.blueprints.find(blueprint => blueprint.id === constructionBlueprintId);
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
      return `${templateId}: ${required} needed · ${Math.max(0, quantity - reserved)} available · ${reserved} reserved`;
    };
    const accessibleEventContainers = view.inventory.containers.filter(container => container.accessible)
      .map(container => ({ id: container.id, label: container.label }));
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
      return <div className="live-section-stack">
        <CharacterSummary mode="live" name={view.player.name} title={view.player.talent.name} grade={view.player.talent.grade}
          level={view.player.level} xp={view.player.xp} mana={view.player.mana} />
        <section className="live-panel live-character-panel">
          <CharacterArtwork className="live-character-art" name={view.player.name} />
          <div className="live-character-profile">
            <div className="live-panel-heading"><div><span className="live-eyebrow">SERVER CHARACTER INSPECTOR</span><h2>{view.player.name}</h2></div><UserRound size={21} /></div>
            <p>{view.player.talent.name} · {view.player.talent.grade}</p>
            <div className="live-two-column">
              <article className="live-container-card"><strong>Thuộc tính</strong>
                <ul className="live-plain-list">{Object.entries(view.player.attributes).map(([key, value]) => <li key={key}><strong>{key}</strong><span>{value}</span></li>)}</ul>
              </article>
              <article className="live-container-card"><strong>Nghề nghiệp và kỹ năng</strong>
                <p>{view.player.careerState === 'active' ? view.careerCard.career?.name ?? 'Đã kích hoạt' : 'Chưa kích hoạt'}</p>
                {view.player.skills?.length ? <ul className="live-plain-list">{view.player.skills.map(skill => <li key={skill.id}><strong>{skill.templateId}</strong><span>Thông thạo {skill.mastery}{skill.active ? ' · đang dùng' : ''}</span></li>)}</ul> : <p className="live-muted">Chưa có kỹ năng được ghi trong hồ sơ nhân vật.</p>}
              </article>
            </div>
            <p>Vị trí, cấp độ, XP, Mana, thuộc tính và kỹ năng lấy từ cùng PlayerView. Trang không tự tạo trang bị hay thành tựu.</p>
          </div>
        </section>
      </div>;
    }
    if (screen === 'events') return <div className="live-section-stack">
      {eventBoard()}
      <OpeningRankingBoard
        board={view.stage08.openingBoard}
        snapshots={view.stage08.rankSnapshots}
        playerId={view.player.id}
        formatTime={elapsedLabel}
        busy={working || Boolean(pendingCommand)}
        onClaim={boardId => { void sendCommand(commandFor(view, 'claim_opening_rank_reward', { boardId })); }}
      />
    </div>;
    if (screen === 'overview') {
      return <div className="live-section-stack">
        <section className="live-hero">
          <div>
          <span className="live-eyebrow">BẢN ĐỒ VÀ HẬU CẦN</span>
            <h2>{view.player.name}</h2>
          <p>Thời gian, Tử Khí, hồi Mana và sản xuất đều lấy từ snapshot máy chủ. Lượt mới vẫn bắt đầu ở ngày 1 lúc 07:00.</p>
          </div>
          <div className="live-hero-mark"><Sparkles size={34} /><span>LL</span></div>
        </section>
        <div className="live-stat-grid">
          <article className="live-stat"><span>Cấp độ</span><strong>{view.player.level}</strong></article>
          <article className="live-stat"><span>Kinh nghiệm</span><strong>{view.player.xp}</strong></article>
          <article className="live-stat"><span>Mana</span><strong>{view.player.mana.current} / {view.player.mana.max}</strong></article>
          <article className="live-stat"><span>Revision</span><strong>{view.revision}</strong></article>
        </div>
        {eventBoard()}
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">LEDGER SNAPSHOT</span><h3>Hậu cần và việc đang chạy</h3></div><PackageOpen size={20} /></div>
          <div className="live-stat-grid">
            <article className="live-stat"><span>Vật liệu quan sát</span><strong>{view.inventory.containers.reduce((sum, container) => sum + container.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</strong></article>
            <article className="live-stat"><span>Đang giữ chỗ</span><strong>{view.inventory.containers.reduce((sum, container) => sum + container.items.reduce((itemSum, item) => itemSum + item.reservedQuantity, 0), 0)}</strong></article>
            <article className="live-stat"><span>Việc xây dựng</span><strong>{view.construction.jobs.filter(job => job.status === 'active' || job.status === 'paused' || job.status === 'blocked').length}</strong></article>
            <article className="live-stat"><span>Nhà nông phu</span><strong>{view.construction.occupiedHousing} / {view.construction.farmerHouseCapacity}</strong></article>
          </div>
          <p className="live-muted">Cảnh báo: thời tiết mở đầu {view.survival.coldStatus}; nhiên liệu lửa {view.territory.survivalFire.fuelKnowledge === 'known' ? 'đã xác định' : 'chưa xác định'}; bảo trì dân cư {view.construction.residents.some(resident => resident.upkeepStatus === 'not_compiled') ? 'chưa có công thức nguồn' : 'chưa có cư dân'}.</p>
          {view.construction.rewardEntitlements.map(reward => <p className="live-inline-error" key={reward.id}>Thành tựu {reward.achievementId} đang chặn phần thưởng: {reward.blocker}. Vật phẩm chưa được tạo.</p>)}
        </section>
        <div className="live-two-column">
          <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">CAMPFIRE LINK</span><h3>{entityLabel(fireEntity)}</h3></div><Flame size={22} /></div>
            <p>Ref dùng chung: <code>{fireRef ? entityRefKey(fireRef) : 'API chưa cung cấp'}</code></p>
            <div className="live-button-row">
              <button className="live-button" onClick={() => setScreen('map')}>Mở trên bản đồ <ArrowRight size={15} /></button>
              <button className="live-button live-button--secondary" onClick={() => setScreen('territory')}>Xem cấu trúc <ArrowRight size={15} /></button>
            </div>
          </section>
          <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">CAREER CARD</span><h3>{view.careerCard.observed ? 'Đã quan sát' : 'Đang niêm phong'}</h3></div><Shield size={21} /></div>
            {view.careerCard.observed && view.careerCard.career
              ? <><p>{view.careerCard.career.name} · phân bổ tăng trưởng {view.careerCard.career.growthAllocation}</p>
                <p>{view.careerCard.active ? 'Nghề nghiệp đã kích hoạt.' : 'Thẻ đã mở; Lí Lan có thể kích hoạt nghề nghiệp.'} {view.careerCard.openingSkillLearned ? 'Kỹ năng mở đầu đã học.' : 'Kỹ năng chưa được học.'}</p>
                {!view.careerCard.active && <button className="live-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'activate_career_card', { cardId: view.careerCard.career!.id }))}>Kích hoạt nghề nghiệp</button>}
                {view.player.skills?.map(skill => <small key={skill.id}>Kỹ năng mở đầu · thông thạo {skill.mastery}</small>)}
              </>
              : <><p>Không hiển thị nội dung trước khi API xác nhận thao tác kiểm tra.</p><button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_career_card', {}))}><Eye size={16} /> Kiểm tra thẻ nghề nghiệp</button></>}
          </section>
        </div>
        <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">PHIÊN CHƠI</span><h3>Trạng thái lượt lưu</h3></div><span className="live-data-chip">Đồng hồ máy chủ</span></div>
          <p>Save ID: <code>{view.saveId}</code> · Event sequence: {view.lastEventSequence} · API revision: {view.revision}</p>
          <p>Quyền đồng hồ: {view.clockStatus.driver} · {view.clockControl.status} · {view.clockControl.speedPermille / 1000}× · {view.clockStatus.catchingUp ? 'đang quyết toán' : 'đã đồng bộ'}</p>
        </section>
      </div>;
    }

    if (screen === 'territory') {
      const settlement = territorySceneFromApi(view);
      const territorySelection = territoryRef(selectedRef);
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading">
            <div><span className="live-eyebrow">LÃNH ĐỊA</span><h2>Lãnh địa</h2></div>
            <span className="live-data-chip">Ref {fireRef ? entityRefKey(fireRef) : 'chưa có'}</span>
          </div>
          <p className="live-muted">Bố cục isometric và artwork dùng chung với bản xem thử. Vị trí, trạng thái, cấp và lựa chọn đều đọc từ PlayerView của lượt lưu đang mở.</p>
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
            <span className="live-eyebrow">TRẠNG THÁI DO API CUNG CẤP</span>
            <h3>{entityLabel(fireEntity)}</h3>
            <p>Cấp {view.territory.survivalFire.level} · bán kính nhiệt {view.territory.survivalFire.heatRadiusMetres} m</p>
            <p>Bảo vệ: {view.territory.survivalFire.protection}</p>
            <p>Nhiên liệu đã biết: {view.territory.survivalFire.fuelRemaining ?? 'chưa xác định'} · lần tiêu thụ kế: {elapsedLabel(view.territory.survivalFire.nextFuelConsumptionAtElapsedMs)}</p>
            {view.territory.survivalFire.fuelBlocker && <p className="live-muted">Chặn nhiên liệu: {view.territory.survivalFire.fuelBlocker}</p>}
            <div className="live-button-row">
              {fireEntity && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void runInspection(fireEntity)}><Eye size={15} /> Kiểm tra lửa</button>}
              <button className="live-button live-button--secondary" title={woodFuel ? 'Chuyển 1 gỗ đã quan sát vào lửa; tổng nhiên liệu mở đầu vẫn chưa được tiết lộ.' : 'Không có gỗ đã quan sát trong container sở hữu và có thể truy cập.'} disabled={working || Boolean(pendingCommand) || !woodFuel} onClick={() => woodFuel && void sendCommand(commandFor(view, 'refuel_fire', { containerId: woodFuel.containerId, itemId: woodFuel.itemId, quantity: 1 }))}>Nạp 1 gỗ</button>
              {view.territory.survivalFire.active
                ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'extinguish_fire', {}))}>Tắt lửa</button>
                : <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !view.territory.survivalFire.hasFuel} onClick={() => void sendCommand(commandFor(view, 'light_fire', {}))}>Nhóm lửa</button>}
            </div>
            {fireEntity && <button className="live-button live-button--secondary" onClick={() => setScreen('map')}>Chọn cùng entity trên bản đồ <ArrowRight size={15} /></button>}
          </section>
          <section className="live-panel">
            <span className="live-eyebrow">BUILDINGS ĐÃ BIẾT</span>
            <h3>{view.territory.buildings.length} instance</h3>
            {view.territory.buildings.length
              ? <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name}</strong><span>{building.status} · {building.position ? `${(building.position.xMm / 1000).toFixed(1)}, ${(building.position.yMm / 1000).toFixed(1)} m` : 'tọa độ chưa biết'} · {building.footprintAreaM2 ?? 'n/a'} m²</span></li>)}</ul>
              : <p>API chưa trả về công trình đã biết.</p>}
            <p>Nhà ở: {view.construction.occupiedHousing}/{view.construction.farmerHouseCapacity} chỗ · nhiên liệu lửa: {view.territory.survivalFire.fuelRemaining ?? 'chưa biết'} WOOD · công trình đang làm: {view.construction.jobs.filter(job => job.status === 'active' || job.status === 'paused' || job.status === 'blocked').length}</p>
            {view.construction.jobs.filter(job => job.status === 'active' || job.status === 'paused' || job.status === 'blocked').map(job => <p key={job.id}>{job.kind} · {job.status} · {job.progressTicks}/{Math.round(job.workUnitsRequired * 300)} ticks · {job.workUnitsPerHour.toFixed(2)} WU/h · hoàn tất {elapsedLabel(job.estimatedCompletionAtElapsedMs)}</p>)}
          </section>
        </div>
      </div>;
    }

    if (screen === 'map') return renderMap();

    if (screen === 'inventory') {
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">INVENTORY · SERVER PROJECTION</span><h2>Kho vật phẩm</h2></div><PackageOpen size={22} /></div>
          <p className="live-muted">Items appear from observed containers. Move them only when both containers are in reach.</p>
          <label className="live-inline-field">Filter item, owner, or provenance <input value={inventoryFilter} onChange={event => setInventoryFilter(event.target.value)} placeholder="WOOD, LI_LAN, source…" /></label>
          {view.inventory.inspectableContainers.length > 0 && <div className="live-inspectable-list">
            {view.inventory.inspectableContainers.map(container => <article key={container.containerId} className="live-container-row">
              <div><strong>{container.label}</strong><small>{container.kind} · chưa quan sát</small></div>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_starter_container', { containerId: container.containerId }))}><Eye size={15} /> Kiểm tra</button>
            </article>)}
          </div>}
          {view.inventory.containers.length > 0
            ? <div className="live-inventory-grid">{inventoryContainers.map(container => <article className="live-container-card" key={container.id}>
                <div className="live-panel-heading"><h3>{container.label}</h3><span>{container.occupiedSlots}/{container.capacitySlots ?? '∞'} ô</span></div>
                <small className="live-container-access">Vị trí: {container.location.kind === 'site' ? container.location.siteId : container.location.kind === 'carried' ? `carried by ${container.location.ownerId}` : container.location.kind === 'building' ? container.location.buildingId : `unit ${container.location.unitId}`} · {container.accessible ? 'accessible' : 'out of reach'}</small>
                {container.items.length
                  ? <ul className="live-plain-list live-inventory-art-list">{container.items.map(item => <li key={item.itemId}>
                    {itemArtPath(item.label) && <img className="live-item-art" src={itemArtPath(item.label)!} alt="" aria-hidden="true" />}
                    <strong>{item.label} · × {item.quantity} · free {Math.max(0, item.quantity - item.reservedQuantity)}{item.equipped ? ' · equipped' : ''}</strong>
                    <span>{item.reservedQuantity} reserved · owner {item.ownerId ?? 'legacy/unspecified'} · {item.unit ?? 'unit unspecified'} · quality {item.quality ?? 'unspecified'}{item.condition !== null && item.condition !== undefined ? ` · độ bền ${Math.round(item.condition * 100)}%` : ''} · {item.provenance} · {item.equipped ? `equipped${item.equippedSlotId ? ` (${item.equippedSlotId})` : ''}` : 'not equipped'}{item.foodUnitsPerItem !== null ? ` · ${item.foodUnitsPerItem} food units/item` : ''}{item.equipmentTags?.length ? ` · loại: ${item.equipmentTags.map(tag => tag === 'WEAPON' || tag === 'WEAPON_1H' ? 'vũ khí' : tag === 'ARMOR' || tag === 'ARMOR_LIGHT' ? 'giáp nhẹ' : tag).join(', ')}` : ''} · {view.inventory.containers.filter(target => target.id !== container.id).map(target => <button key={target.id} className="live-text-button" disabled={working || Boolean(pendingCommand) || !container.accessible || !target.accessible || item.quantity <= item.reservedQuantity} title={!container.accessible || !target.accessible ? 'Move Lí Lan within reach of both containers.' : `Transfer unreserved items to ${target.label}.`} onClick={() => void sendCommand(commandFor(view, 'transfer_item', {
                      actorId: view.player.id, sourceContainerId: container.id, destinationContainerId: target.id, itemId: item.itemId, quantity: item.quantity - item.reservedQuantity,
                    }))}>→ {target.label}</button>)}</span>
                    {item.label === 'BREAD' && item.foodUnitsPerItem !== null && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !container.accessible || item.quantity <= item.reservedQuantity} title="Consumes one actual bread item using its recorded food value." onClick={() => void sendCommand(commandFor(view, 'consume_item', {
                      actorId: view.player.id, containerId: container.id, itemId: item.itemId, quantity: 1,
                    }))}>Consume 1 · {item.foodUnitsPerItem} food unit</button>}
                  </li>)}</ul>
                  : <p>Container đã quan sát, chưa có vật phẩm.</p>}
                <small className="live-container-access">{container.accessible ? 'Within reach' : 'Out of reach'}</small>
              </article>)}</div>
            : view.inventory.inspectableContainers.length === 0 && <p className="live-empty-state">API chưa cung cấp container đã quan sát hoặc có thể kiểm tra.</p>}
        </section>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">TIỀN TỆ ĐÃ NHẬN</span><h3>Số dư</h3></div><PackageOpen size={20} /></div>
          {view.currency.length
            ? <ul className="live-plain-list">{view.currency.map(balance => <li key={balance.currencyId}><strong>{balance.currencyId}</strong><span>{balance.amount.toLocaleString()}</span></li>)}</ul>
            : <p className="live-empty-state">Chưa có tiền tệ sự kiện nào được ghi nhận.</p>}
        </section>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">MARKET · SERVER OWNED</span><h3>Giao dịch tại Krona Gate</h3></div><PackageOpen size={20} /></div>
          {view.stage08.marketOffers.length > 0
            ? <div className="live-job-list">{view.stage08.marketOffers.map(offer => {
              const balance = view.currency.find(item => item.currencyId === offer.currencyId)?.amount ?? 0;
              const bag = view.inventory.containers.find(container => container.kind === 'carried_bag' && container.accessible);
              const remainingCap = Math.max(0, offer.lifetimePurchaseLimit - offer.purchasedQuantity);
              const available = offer.status === 'active' && offer.stockRemaining > 0 && remainingCap > 0 && balance >= offer.unitPrice && Boolean(bag);
              return <article key={offer.id} className="live-container-row">
                <div><strong>{offer.itemTemplateId} · {offer.unitPrice} {offer.currencyId} each</strong>
                  <small>{offer.stockRemaining}/{offer.initialStock} stock · {remainingCap} lifetime purchase(s) left · {offer.expiresAtElapsedMs === null ? 'permanent offer' : `expires ${elapsedLabel(offer.expiresAtElapsedMs)}`} · BREAD follows its recorded Stage 04 food consumption contract</small>
                  {!bag && <small>Inspect the carried bag first so purchased goods have an observed destination.</small>}
                  {balance < offer.unitPrice && <small>Need {offer.unitPrice - balance} more {offer.currencyId}.</small>}
                </div>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !available}
                  title={!bag ? 'Inspect the carried bag first.' : !available ? 'Offer, stock, lifetime cap, balance, and destination are rechecked by the server.' : 'The server checks the fixed price and commits currency, stock, and delivery together.'}
                  onClick={() => bag && void sendCommand(commandFor(view, 'shop_transaction', { offerId: offer.id, destinationContainerId: bag.id, quantity: 1 }))}>
                  Mua 1 · nhận {offer.quantityPerPurchase} {offer.itemTemplateId}
                </button>
              </article>;
            })}</div>
            : <p className="live-empty-state">Quầy caravan mở sau khi Torven tới Krona Gate. Hàng trong kho chỉ hiện khi Lí Lan ở gần quầy.</p>}
          {view.stage08.botMarketListings.length > 0
            ? <div className="live-job-list" aria-label="Blueprint do lãnh chúa bot rao bán">{view.stage08.botMarketListings.map(listing => {
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
                <div><strong>{listing.blueprintId} · người bán {listing.sellerName}</strong>
                  <small>{listing.paymentResource === 'food' ? `${listing.askAmount} BREAD` : `${listing.askAmount.toLocaleString()} mL nước`} · hết hạn {elapsedLabel(listing.expiresAtElapsedMs)}</small>
                  {listing.compatibleBlueprintId && <small>Blueprint nhận được: {listing.compatibleBlueprintId}</small>}
                  {listing.blocker && <small>Chưa thể mua: {listing.blocker}</small>}
                  {alreadyUnlocked && <small>Blueprint này đã được mở khóa.</small>}
                  {!blocked && !paymentStack && <small>Cần một chồng BREAD đủ {listing.askAmount} chiếc trong kho có thể truy cập.</small>}
                </div>
                <button className="live-button live-button--secondary" disabled={!canBuy}
                  title={listing.blocker ?? (alreadyUnlocked ? 'Blueprint đã được mở khóa.' : !paymentStack ? 'Cần BREAD trong kho có thể truy cập.' : 'Máy chủ kiểm tra lại seller, vùng giao dịch và thanh toán trước khi chuyển asset.')}
                  onClick={() => paymentStack && void sendCommand(commandFor(view, 'buy_bot_market_listing', {
                    listingId: listing.id, paymentContainerId: paymentStack.containerId, paymentItemId: paymentStack.itemId,
                  }))}>
                  {listing.paymentResource === 'food' ? `Mua · ${listing.askAmount} BREAD` : 'Chưa hỗ trợ thanh toán nước'}
                </button>
              </article>;
            })}</div>
            : <p className="live-empty-state">Danh sách blueprint của bot chỉ hiện khi Lí Lan ở Krona Gate; người mua trả bằng vật phẩm và giao dịch chỉ mở với blueprint tương thích.</p>}
          {view.stage08.auctionLots.map(lot => {
            const balance = view.currency.find(item => item.currencyId === lot.currencyId)?.amount ?? 0;
            const bidId = view.stage08.auctionBids.find(bid => bid.lotId === lot.id && bid.status === 'open')?.id;
            return <article key={lot.id} className="live-container-row">
              <div><strong>{lot.itemTemplateId} lot · {lot.quantity - lot.reservedQuantity}/{lot.quantity} unreserved</strong>
                <small>Minimum {lot.minimumUnitBid} {lot.currencyId}/unit · closes {elapsedLabel(lot.closesAtElapsedMs)} · a bid reserves currency; no item transfers before seller settlement.</small>
              </div>
              {bidId
                ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_auction_bid', { bidId }))}>Cancel bid · refund escrow</button>
                : <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || lot.status !== 'open' || lot.quantity <= lot.reservedQuantity || balance < lot.minimumUnitBid}
                  onClick={() => void sendCommand(commandFor(view, 'place_auction_bid', { lotId: lot.id, quantity: 1, unitBid: lot.minimumUnitBid }))}>Bid 1 {lot.itemTemplateId} · escrow {lot.minimumUnitBid} {lot.currencyId}</button>}
            </article>;
          })}
          {view.stage08.auctionBids.length > 0 && <ul className="live-plain-list">{view.stage08.auctionBids.map(bid => <li key={bid.id}>
            <strong>{bid.id} · {bid.status}</strong><span>{bid.quantity} unit(s) at {bid.unitBid} {view.stage08.auctionLots.find(lot => lot.id === bid.lotId)?.currencyId ?? ''} · escrow {bid.escrowAmount}</span>
          </li>)}</ul>}
        </section>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">FIELD RESOURCE LEDGER</span><h3>Known sources</h3></div><PackageOpen size={20} /></div>
          {view.spatial.resources.length ? <ul className="live-plain-list">{view.spatial.resources.map(resource => <li key={resource.resourceId}>
            <strong>{resource.materialName}</strong><span>{resource.remaining === null ? 'Remaining amount unknown' : `${resource.remaining} ${resource.unit}`} · {resource.reserved ?? 0} reserved · {resource.status}</span>
          </li>)}</ul> : <p className="live-empty-state">No resource sites are known yet.</p>}
          {view.spatial.harvestJobs.length > 0 && <div className="live-job-list">{view.spatial.harvestJobs.map(job => <article key={job.id} className="live-container-row">
            <div><strong>{job.materialId} · {job.stage} · {job.status}</strong><small>{job.extractedQuantity}/{job.requestedQuantity} gathered · {Math.floor(view.jobs.find(item => item.id === job.id)?.progressPercent ?? 0)}%</small></div>
            {job.status === 'active' && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Cancel trip</button>}
          </article>)}</div>}
        </section>
      </div>;
    }

    if (screen === 'forces') {
      return <div className="live-section-stack">{renderDispatchPanel()}<section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">OWNED UNITS</span><h2>Quân lực</h2></div><Users size={22} /></div>
        {view.combat?.target && <article className="live-container-card" data-testid="stage07-combat-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">H0 · OPENING ENCOUNTER</span><h3>{view.combat.target.label}</h3></div>
            <span className="live-data-chip">{view.combat.target.state}</span></div>
          <p>Đây là cá thể đã có trong hồ sơ quần thể H0. Không tiết lộ tổng số cá thể chưa được quan sát; mục tiêu đã bị săn sẽ không được tạo lại khi rút lui hay tải save.</p>
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
            <p>Encounter {view.combat.encounter.id} · {view.combat.encounter.status} · vòng {view.combat.encounter.round} · {view.combat.encounter.nextTurnAtElapsedMs === null ? 'đã kết thúc' : 'lượt kế tiếp lúc T+' + elapsedLabel(view.combat.encounter.nextTurnAtElapsedMs)}</p>
            {view.combat.encounter.status === 'active' && <><p>Thỏ băng {view.combat.encounter.targetHealth.current}/{view.combat.encounter.targetHealth.max} HP · clock {view.clockControl.status === 'running' ? 'đang chạy' : 'đang dừng'}.</p>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'retreat', { actorIds: view.combat!.encounter!.actorIds, encounterId: view.combat!.encounter!.id }))}>Ra lệnh rút lui</button>
            </>}
            {view.combat.encounter.log.length > 0 && <ul className="live-plain-list">{view.combat.encounter.log.map((entry, index) => <li key={entry.atElapsedMs + ':' + index}>
              <strong>Vòng {index + 1} · {entry.actorId === view.combat!.target!.id ? 'Thỏ băng' : view.units.find(unit => unit.id === entry.actorId)?.name ?? 'Chiến binh'} · {entry.outcome}</strong>
              <span>Gây {entry.damage} · nhận {entry.damageTaken} · sức khỏe chiến binh {entry.actorHealth} · mục tiêu {entry.targetHealth}/{view.combat!.encounter!.targetHealth.max}</span>
            </li>)}</ul>}
          </div>}
          {view.combat.target.state === 'dead' && <p>Thi thể thật đã được đánh dấu trên bản đồ. Hãy chọn thi thể để kiểm tra hồ sơ trước khi Tử Phục.</p>}
          {view.combat.target.state === 'retreated' && <p>Cá thể này đã sống sót và rời khỏi encounter. Không có thi thể hoặc phần thưởng XP.</p>}
        </article>}
        {view.units.length
          ? <div className="live-section-stack">{view.units.map(unit => {
            const routeLabel = unit.creationRoute === 'DIRECT_TU_PHUC' ? 'Được Lí Lan Tử Phục' : unit.creationRoute === 'TOMB_QUEUE' ? 'Được tạo từ Mộ' : 'Đơn vị thuộc quyền Lí Lan';
            const inCombat = view.combat?.encounter?.status === 'active' && view.combat.encounter.actorIds.includes(unit.id);
            const accessibleItems = view.inventory.containers.filter(container => container.accessible).flatMap(container => container.items);
            return <article key={unit.id} className="live-container-card">
              <div className="live-panel-heading"><h3>{unit.name}</h3><span className="live-data-chip">{routeLabel}</span></div>
              <p>Bậc {unit.sourceStats.formTier} · Cấp {unit.level} · Phẩm {unit.sourceStats.grade} · XP {unit.xp}</p>
              <p>Phe {unit.sourceStats.faction} · hoạt động {inCombat ? 'đang giao chiến' : unit.health?.current === 0 ? 'đã gục' : 'sẵn sàng'}.</p>
              {unit.health && <p>Sức khỏe {unit.health.current}/{unit.health.max} · độ nguyên vẹn {unit.integrity ?? '—'}%</p>}
              <p>{unit.xpMirrorEligible ? 'Lí Lan nhận bản sao XP hợp lệ của đơn vị này.' : 'XP của đơn vị này không được chuyển cho Lí Lan.'} · công việc {unit.baseLaborRateWuPerHour} WU/h</p>
              {unit.attributes && <p>Thuộc tính: {Object.entries(unit.attributes).map(([stat, value]) => `${stat} ${value}`).join(' · ')}</p>}
              {unit.skills?.length ? <p>Kỹ năng: {unit.skills.map(skill => `${skill.templateId} · thông thạo ${skill.mastery}`).join(' · ')}</p> : <p>Chưa ghi nhận kỹ năng riêng.</p>}
              {unit.equipmentSlots?.map(slot => {
                const item = accessibleItems.find(candidate => candidate.itemId === slot.occupiedItemId);
                const options = accessibleItems.filter(candidate => !candidate.equipped && candidate.ownerId === view.player.id
                  && (candidate.equipmentTags ?? []).some(tag => slot.allowedTags.includes(tag)));
                return <div className="live-container-row" key={slot.slotId}>
                  <div><strong>{slot.slotId === 'MAIN_HAND' ? 'Tay chính' : slot.slotId === 'BODY' ? 'Thân' : slot.slotId}</strong>
                    <small>{item ? item.label : 'Trống'}{item?.condition !== null && item?.condition !== undefined ? ` · độ bền ${Math.round(item.condition * 100)}%` : ''}</small>{item && item.combatEffects && <small>{Object.entries(item.combatEffects).map(([effect, value]) => `${effect === 'weaponBase' ? 'sát thương cơ bản' : effect === 'armor' ? 'giáp' : effect} ${value}`).join(' · ')}</small>}</div>
                  {item
                    ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'unequip_item', { unitId: unit.id, itemId: item.itemId }))}>Tháo</button>
                    : options[0] && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'equip', { unitId: unit.id, itemId: options[0].itemId, slotId: slot.slotId }))}>Trang bị {options[0].label}</button>}
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
      </section></div>;
    }

    if (screen === 'buildings') {
      return <div className="live-section-stack">
      <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">CONSTRUCTION CONTRACTS</span><h2>Công trình và sửa chữa</h2></div><Hammer size={22} /></div>
        {focusedConstructionBuildingId && <p className="live-preview-success">Map selection: {view.territory.buildings.find(building => building.id === focusedConstructionBuildingId)?.name ?? focusedConstructionBuildingId}. Current construction state is shown below.</p>}
        <p className="live-muted">Vị trí, vật liệu, quyền truy cập và lao động được kiểm tra lại trên API. Bản xem trước không giữ vật liệu; công việc bắt đầu mới đặt chỗ.</p>
        {repairHouse && repairHouse.status === 'damaged' && <article className="live-construction-card">
          <div className="live-panel-heading"><div><span className="live-eyebrow">FIXED LORD HOUSE REPAIR</span><h3>{repairHouse.name}</h3></div><span className="live-data-chip">{repairHouse.status}</span></div>
          <p>20 WOOD + 10 STONE · STONE-HAMMER per assigned worker · 17/60 WU · tối đa 2 worker. Hoàn tất mở đúng 11 blueprint tầng 1.</p>
          {repairHouse.position && <p>Tọa độ: {(repairHouse.position.xMm / 1000).toFixed(1)}, {(repairHouse.position.yMm / 1000).toFixed(1)} m · người chơi: {(view.player.position.xMm / 1000).toFixed(1)}, {(view.player.position.yMm / 1000).toFixed(1)} m</p>}
          <div className="live-building-form">
            <label className="live-inline-field">Container chi phí <select value={constructionContainer?.id ?? ''} onChange={event => { setConstructionContainerId(event.target.value); setConstructionPreview(null); }}>
              <option value="" disabled>Chọn container đã quan sát</option>
              {view.inventory.containers.map(container => <option key={container.id} value={container.id}>{container.label} · {container.accessible ? 'accessible' : 'out of reach'}</option>)}
            </select></label>
            <div className="live-button-row">
              {repairHouse.position && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination: repairHouse.position! }))}>Move to Lord House</button>}
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !repairCommand} onClick={() => repairCommand && void previewConstructionCommand(repairCommand)}>Preview repair</button>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !repairCommand || !selectedCommandIsPreviewed(repairCommand) || !constructionPreview?.availability.enabled} onClick={() => repairCommand && void sendCommand(repairCommand)}>Start repair</button>
            </div>
          </div>
          {constructionContainer && <p className="live-muted">{materialLine('WOOD', 20)} · {materialLine('STONE', 10)} · {materialLine('STONE-HAMMER', 1)} tool available</p>}
          {repairCommand && selectedCommandIsPreviewed(repairCommand) && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? constructionPreview.availability.preview?.value : availabilityMessage(constructionPreview!.availability)}</p>}
          <p className="live-muted">Để dùng hòm tiếp tế, Lí Lan phải đứng trong 5 m tại SITE-LL01-002; container mang theo có thể dùng khi đang ở trong tầm công trình.</p>
        </article>}
        {repairHouse?.status === 'active' && <p className="live-preview-success">Nhà Lãnh Chúa đã sửa. {view.construction.unlockedBlueprintIds.length} blueprint được mở.</p>}

        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SOURCE-DEFINED HEAT SERVICE</span><h3>Lò Sưởi Đơn Giản</h3></div><Flame size={20} /></div>
          {view.territory.buildings.filter(building => building.kind === 'heater' && building.status === 'active').length === 0
            ? <p className="live-empty-state">No active heater is built. Its fixed opening recipe is 6 STONE.</p>
            : view.territory.buildings.filter(building => building.kind === 'heater' && building.status === 'active').map(building => {
              const service = view.construction.operatingServices.find(item => item.buildingId === building.id && item.status === 'active');
              const operationCommand = constructionContainer ? commandFor(view, 'operate_heater', { actorId: view.player.id, buildingId: building.id, containerId: constructionContainer.id }) : null;
              const operationPreviewed = selectedCommandIsPreviewed(operationCommand);
              return <article className="live-construction-card" key={building.id}>
                <strong>{building.name} · {service ? 'operating' : 'idle'}</strong>
                <p>Service: reserve 1 WOOD for 20 minutes; +15–20°C in a room up to 30 m². This local output does not change the unresolved territory-wide cold-load model.</p>
                {service && <p className="live-preview-success">Active · {elapsedLabel(service.completesAtElapsedMs)} · {Math.ceil(service.remainingMs / 60_000)} min remaining · 1 WOOD reserved.</p>}
                {operationCommand && <div className="live-button-row">
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !constructionContainer?.accessible} onClick={() => void previewConstructionCommand(operationCommand)}>Preview heater operation</button>
                  <button className="live-button" disabled={working || Boolean(pendingCommand) || !operationPreviewed || !constructionPreview?.availability.enabled} onClick={() => void sendCommand(operationCommand)}>Operate for 20 minutes</button>
                </div>}
                {operationCommand && operationPreviewed && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? constructionPreview.availability.preview?.value : availabilityMessage(constructionPreview!.availability)}</p>}
              </article>;
            })}
        </section>

        <article className="live-construction-card">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SERVER PLACEMENT PREVIEW</span><h3>Đặt công trình H0</h3></div><span className="live-data-chip">LL01-BUILDING-PLACEMENT-1.0</span></div>
          <div className="live-building-form">
            <label className="live-inline-field">Blueprint <select value={constructionBlueprintId} onChange={event => { setConstructionBlueprintId(event.target.value); setConstructionPreview(null); }}>
              <option value="" disabled>Chọn blueprint đã mở</option>
              {view.construction.blueprints.map(blueprint => <option key={blueprint.id} value={blueprint.id} disabled={!view.construction.unlockedBlueprintIds.includes(blueprint.id)}>{blueprint.name} · {view.construction.unlockedBlueprintIds.includes(blueprint.id) ? 'unlocked' : 'locked'}</option>)}
            </select></label>
            <label className="live-inline-field">X (m) <input inputMode="decimal" value={constructionXMetres} onChange={event => { setConstructionXMetres(event.target.value); setConstructionPreview(null); }} /></label>
            <label className="live-inline-field">Y (m) <input inputMode="decimal" value={constructionYMetres} onChange={event => { setConstructionYMetres(event.target.value); setConstructionPreview(null); }} /></label>
            <div className="live-button-row">
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !constructionPosition} onClick={() => constructionPosition && void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination: constructionPosition }))}>Move to placement</button>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !buildCommand} onClick={() => buildCommand && void previewConstructionCommand(buildCommand)}>Preview placement</button>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !buildCommand || !selectedCommandIsPreviewed(buildCommand) || !constructionPreview?.availability.enabled} onClick={() => buildCommand && void sendCommand(buildCommand)}>Start build</button>
            </div>
          </div>
          {selectedBlueprint && <>
            <p>Cost: {selectedBlueprint.buildCost.map(item => `${item.quantity} ${item.materialId}${item.unit === 'segment' ? ' / segment' : ''}`).join(' + ')} · {selectedBlueprint.workUnits} WU · max {selectedBlueprint.maxWorkers} workers · footprint {selectedBlueprint.footprint.areaM2 ?? `${selectedBlueprint.footprint.lengthM} m linear`}.</p>
            {constructionContainer && <p className="live-muted">{selectedBlueprint.buildCost.map(item => materialLine(item.materialId, item.quantity)).join(' · ')}</p>}
            <p>Output: {selectedBlueprint.outputs.join(' · ')}. Operation: {selectedBlueprint.operatingNeeds.join(' · ')}</p>
            {!selectedBlueprint.upgrade && <p className="live-muted">Upgrade contract is unavailable.</p>}
          </>}
          {buildCommand && selectedCommandIsPreviewed(buildCommand) && <p className={constructionPreview?.availability.enabled ? 'live-preview-success' : 'live-inline-error'}>{constructionPreview?.availability.enabled ? constructionPreview.availability.preview?.value : availabilityMessage(constructionPreview!.availability)}</p>}
          <p className="live-muted">LL01 placement policy: H0 development radius 100 m, player within 5 m, surface elevation, and no overlapping square-overlay footprint. This geometry is a versioned design overlay.</p>
        </article>

        <div className="live-two-column">
          <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">WORK ORDERS</span><h3>Tiến độ và nhân công</h3></div><Users size={20} /></div>
            {view.construction.jobs.length ? <ul className="live-job-list">{view.construction.jobs.map(job => {
              const percent = job.workUnitsRequired === 0 ? 100 : Math.min(100, job.progressTicks / (job.workUnitsRequired * 300) * 100);
              const nearbyUnits = view.units.filter(unit => unit.position && Math.hypot(unit.position.xMm - job.position.xMm, unit.position.yMm - job.position.yMm) <= 5_000);
              const maxWorkers = job.kind === 'repair' ? 2 : view.construction.blueprints.find(blueprint => blueprint.id === job.blueprintId)?.maxWorkers ?? 0;
              const combinedWorkers = [...new Set([...job.workerIds, ...nearbyUnits.map(unit => unit.id)])].slice(0, maxWorkers);
              return <li key={job.id} className="live-construction-job">
                <strong>{job.kind === 'repair' ? 'Lord House repair' : view.construction.blueprints.find(blueprint => blueprint.id === job.blueprintId)?.name ?? job.blueprintId} · {job.status}</strong>
                <span>{percent.toFixed(1)}% · {job.progressTicks}/{Math.round(job.workUnitsRequired * 300)} work ticks · {job.workUnitsPerHour.toFixed(2)} WU/h · ETA {elapsedLabel(job.estimatedCompletionAtElapsedMs)}</span>
                <small>Workers: {job.workerIds.length ? job.workerIds.join(', ') : 'none'} · reserved: {job.costReservations.map(item => `${item.quantity} ${item.templateId}`).join(', ') || 'none'}</small>
                {(job.status === 'active' || job.status === 'paused' || job.status === 'blocked') && <div className="live-button-row">
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || combinedWorkers.length === job.workerIds.length} onClick={() => void sendCommand(commandFor(view, 'assign_construction_workers', { jobId: job.id, workerIds: combinedWorkers }))}>Add nearby workers</button>
                  <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || job.workerIds.length === 0} onClick={() => void sendCommand(commandFor(view, 'assign_construction_workers', { jobId: job.id, workerIds: [] }))}>Pause</button>
                  <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_construction_job', { jobId: job.id }))}>Cancel · release reserved materials</button>
                </div>}
              </li>;
            })}</ul> : <p className="live-empty-state">No construction work has started.</p>}
          </section>
          <section className="live-panel">
            <div className="live-panel-heading"><div><span className="live-eyebrow">HOUSING · FOOD LEDGER</span><h3>Nhà nông phu cực địa</h3></div><Users size={20} /></div>
            <p>{view.construction.occupiedHousing}/{view.construction.farmerHouseCapacity} resident capacity · {view.construction.residents.length} residents.</p>
            <p className="live-muted">Recruitment input: exactly 5 FOOD units per resident from food stacks in the selected accessible container. Daily upkeep is not compiled by the source.</p>
            {view.territory.buildings.filter(building => building.kind === 'polar_farmhouse' && building.status === 'active').map(building => <div className="live-button-row" key={building.id}>
              <button className="live-button" disabled={working || Boolean(pendingCommand) || !constructionContainer} onClick={() => constructionContainer && void sendCommand(commandFor(view, 'recruit_resident', { buildingId: building.id, containerId: constructionContainer.id, quantity: 1 }))}>Recruit 1 resident · 5 FOOD units</button>
            </div>)}
            {view.construction.residents.length ? <ul className="live-plain-list">{view.construction.residents.map(resident => <li key={resident.id}><strong>{resident.name}</strong><span>{resident.foodUnitsPaid} food units paid · upkeep {resident.upkeepStatus}</span></li>)}</ul> : <p className="live-empty-state">No residents have been recruited.</p>}
            {view.construction.rewardEntitlements.map(reward => <p className="live-inline-error" key={reward.id}>Reward pending: {reward.blocker}; {reward.reward.map(item => `${item.quantity} ${item.templateId}`).join(', ')} not minted.</p>)}
          </section>
        </div>

        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">FIXED OPENING REGISTRY</span><h3>Blueprints mở và bị khóa</h3></div><Shield size={20} /></div>
          <ul className="live-plain-list">{view.construction.blueprints.map(blueprint => <li key={blueprint.id}>
            <strong>{blueprint.name} · {view.construction.unlockedBlueprintIds.includes(blueprint.id) ? 'available' : 'locked until Lord House repair'}</strong>
            <span>{`${blueprint.buildCost.map(item => `${item.quantity} ${item.materialId}`).join(' + ')} · ${blueprint.workUnits} WU · ${blueprint.footprint.areaM2 ?? `${blueprint.footprint.lengthM} m`} · ${blueprint.outputs.join('; ')}`}</span>
          </li>)}</ul>
        </section>
        {view.territory.buildings.length > 0 && <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">OWNED STRUCTURES</span><h3>Instance đã xây</h3></div><Hammer size={20} /></div>
          <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name} · level {building.level} · {building.status}</strong><span>{building.id} · {building.siteId ?? 'site unknown'} · {building.position ? `${(building.position.xMm / 1000).toFixed(1)}, ${(building.position.yMm / 1000).toFixed(1)} m` : 'position unknown'} · {building.footprintAreaM2 ?? 'unspecified'} m²</span></li>)}</ul>
        </section>}
      </section>
      <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">TOMB · SOURCE-LOCKED STANDARD OUTPUT</span><h2>Hàng đợi Mộ Bậc {view.territory.tomb.level}</h2></div><Shield size={22} /></div>
        <p>Đầu ra: Bậc {view.territory.tomb.output.formTier} · {view.territory.tomb.output.grade} · cấp {view.territory.tomb.output.level} · {view.territory.tomb.output.baseLaborRateWuPerHour} WU/giờ.</p>
        <p>{view.territory.tomb.deathQi.current}/{view.territory.tomb.deathQi.capacity} Tử Khí · {view.territory.tomb.activeCount}/{view.territory.tomb.productionSlots} ô đang chạy · hồi lúc T+{elapsedLabel(view.territory.tomb.deathQi.nextRefillAtElapsedMs)}</p>
        <div className="live-button-row"><button className="live-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'enqueue_tomb', { blueprintId: 'LL-TOMB-ZOMBIE-STANDARD-01' }))}>Xếp một Cương Thi tiêu chuẩn</button></div>
        <TombQueueList view={view} working={working} blocked={Boolean(pendingCommand)} onCancel={cancelTombJob} />
      </section></div>;
    }

    return <section className="live-panel">
      <div className="live-panel-heading"><div><span className="live-eyebrow">PLAYER-SAFE EVENT LEDGER</span><h2>Nhật ký</h2></div><ScrollText size={22} /></div>
      <div className="live-two-column">
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SỰ KIỆN ĐÃ BIẾT</span><h3>Lịch sử sự kiện</h3></div></div>
          {view.calendar.length
            ? <ul className="live-plain-list">{view.calendar.map(event => <li key={event.id}>
              <strong>{event.displayName} · {event.status === 'active' ? 'Đang mở' : event.status === 'locked' ? 'Đã khóa' : event.status === 'resolved' ? 'Đã kết thúc' : event.status === 'blocked' ? 'Tạm dừng' : event.status}</strong>
              <span>{event.status === 'active' ? `Khóa lúc ${elapsedLabel(event.locksAtElapsedMs)}`
                : event.status === 'locked' ? `Quyết toán lúc ${elapsedLabel(event.resolvesAtElapsedMs)}`
                  : event.status === 'resolved' ? `Kết thúc lúc ${elapsedLabel(event.resolvesAtElapsedMs)}`
                    : event.status === 'blocked' ? `Tạm dừng lúc ${elapsedLabel(view.eventProgressionBlocker?.blockedAtElapsedMs ?? view.simElapsedMs)}`
                      : `Mở lúc ${elapsedLabel(event.opensAtElapsedMs)}`}</span>
            </li>)}</ul>
            : <p className="live-empty-state">Chưa có sự kiện nào được biết.</p>}
        </section>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">QUEST ĐÃ BIẾT</span><h3>Nhiệm vụ</h3></div></div>
          {view.quests.length
            ? <ul className="live-plain-list">{view.quests.map(quest => <li key={quest.questId}>
              <strong>{quest.questId} · {quest.state}</strong>
              <span>{quest.rewardReceipt ? `Biên nhận thưởng ${quest.rewardReceipt}` : quest.completedAt !== null ? `Hoàn tất lúc ${elapsedLabel(quest.completedAt)}` : quest.acceptedAt !== null ? `Nhận lúc ${elapsedLabel(quest.acceptedAt)}` : 'Đang chờ điều kiện đã biết'}</span>
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'open' && <>
                <span>Torven’s convoy is distressed at the old trade-road bridge; its response window closes at {elapsedLabel(view.stage08.caravan?.deadlineAtElapsedMs ?? null)}.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'accept_quest', { questId: quest.questId }))}>Accept caravan request</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-NEGOTIATE-AND-ESCORT' && <>
                <span>Choose the fixed safe-passage route. It records one grain sack from the actual caravan cargo.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'negotiate_caravan', { questId: quest.questId, route: 'trade_one_grain_sack' }))}>Negotiate safe passage · 1 grain sack</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-ESCORT-TO-KRONA-GATE' && <>
                <span>Meet the convoy at the bridge and escort it to Krona Gate before the response window closes.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'escort_caravan', { questId: quest.questId }))}>Escort caravan</button>
              </>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'accepted' && quest.objectiveId === 'Q08-ARRIVE-AT-KRONA-GATE' && <span>Caravan is en route; arrival is scheduled for {elapsedLabel(view.stage08.caravan?.arrivalAtElapsedMs ?? null)}.</span>}
              {quest.questId === 'QUEST-LL01-08' && quest.state === 'completed' && quest.rewardStatus === 'pending' && <>
                <span>Torven alive · at least three draft animals · intact ledger. Claim at Krona Gate: RW-LL01-08.</span>
                <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'claim_quest_reward', { questId: quest.questId }))}>Claim 60 Krona · unlock trade route</button>
              </>}
            </li>)}</ul>
            : <p className="live-empty-state">Chưa có nhiệm vụ nào được mở trong lượt lưu này.</p>}
        </section>
      </div>
      {events.length
        ? <ol className="live-event-list">{events.map(item => <li key={item.eventId}><span className="live-event-sequence">#{item.sequence} · {item.category}</span><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol>
        : <p className="live-empty-state">API chưa trả event nào cho lượt lưu này.</p>}
    </section>;
  }

  const selectedSave = view ? saves.find(save => save.saveId === view.saveId) : null;

  if (!authenticated) {
    return <main className="live-start-page">
      <section className="live-start-card">
        {onExit && <button type="button" className="frozen-menu__back" onClick={onExit}>← Menu chính</button>}
        <span className="live-eyebrow">PHIÊN CHƠI CỤC BỘ</span>
        <h1>Kết nối game API</h1>
        <p>Chế độ live chỉ dùng API SQLite cục bộ. Khóa chủ sở hữu chỉ được gửi tới API để tạo bearer session và không được lưu trong trình duyệt.</p>
        <div className={'live-api-status live-api-status--' + apiState}>
          <span className="live-status-dot" />
          <span>{apiMessage || 'Đang kiểm tra API…'}</span>
          {apiState === 'disconnected' && <button className="live-icon-button" aria-label="Thử kết nối lại" onClick={() => void checkApi()}><RefreshCw size={16} /></button>}
        </div>
        <form className="live-owner-form" onSubmit={connectOwner}>
          <label htmlFor="owner-key">Khóa chủ sở hữu cục bộ</label>
          <input id="owner-key" aria-label="Khóa chủ sở hữu" type="password" autoComplete="off" value={ownerKey} onChange={event => setOwnerKey(event.target.value)} required disabled={apiState !== 'ready' || working} />
          <small>Lấy khóa từ tệp cục bộ <code>.local/owner-key</code>.</small>
          <button className="live-button" type="submit" disabled={apiState !== 'ready' || working || !ownerKey}>
            {working ? 'Đang kết nối…' : 'Kết nối API'} <ArrowRight size={16} />
          </button>
        </form>
        <StatusBanner feedback={feedback} />
        <p className="live-footnote">Thời gian mô phỏng do máy chủ quyết toán. Lỗi API sẽ dừng thao tác tại đây.</p>
      </section>
    </main>;
  }

  if (!view) {
    return <main className="live-start-page">
      <section className="live-start-card live-save-picker">
        {onExit && <button type="button" className="frozen-menu__back" onClick={onExit}>← Menu chính</button>}
        <span className="live-eyebrow">OWNER SESSION CONNECTED · SQLITE</span>
        <h1>{pickerIntent === 'new' ? 'Trò chơi mới' : pickerIntent === 'load' ? 'Tải lượt lưu' : 'Chọn hoặc tạo lượt lưu'}</h1>
        <p>{pickerIntent === 'new' ? 'Tạo một lượt chơi độc lập, bắt đầu ở T0. Không dùng lại tiến trình hoặc vật phẩm từ lượt khác.' :
          pickerIntent === 'load' ? 'Chọn một lượt đã tồn tại trên máy chủ để tiếp tục. Việc mở danh sách không tạo lượt mới.' :
          'Chưa có trạng thái game nào được mở. Tạo clean game mới hoặc tải một save đã có.'}</p>
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        {pickerIntent !== 'either' && <div className="live-picker-tabs" role="group" aria-label="Tạo mới hoặc tải lượt lưu">
          <button type="button" className={pickerIntent === 'new' ? 'is-active' : ''} aria-pressed={pickerIntent === 'new'} disabled={working} onClick={() => setPickerIntent('new')}>Trò chơi mới</button>
          <button type="button" className={pickerIntent === 'load' ? 'is-active' : ''} aria-pressed={pickerIntent === 'load'} disabled={working} onClick={() => setPickerIntent('load')}>Tải lượt lưu</button>
        </div>}
        {(pickerIntent === 'new' || pickerIntent === 'either') && <form className="live-owner-form" onSubmit={createFreshSave}>
          <label htmlFor="slot-name">Tên lượt lưu mới</label>
          <input id="slot-name" value={slotName} onChange={event => setSlotName(event.target.value)} maxLength={80} required disabled={working} />
          <button className="live-button" type="submit" disabled={working}>{working ? 'Đang tạo…' : 'Tạo lượt chơi sạch'} <ArrowRight size={16} /></button>
        </form>}
        {(pickerIntent === 'load' || pickerIntent === 'either') && (saves.length > 0 ? <div className="live-save-list">
          <h2>Lượt lưu có sẵn</h2>
          {saves.map(save => <button key={save.saveId} className="live-save-row" disabled={working} onClick={() => void openSave(save.saveId)}>
            <span><strong>{save.slotName}</strong><small>{save.saveId} · revision {save.revision}</small></span><ArrowRight size={17} />
          </button>)}
        </div> : <p className="live-empty-state" role="status">Chưa có lượt lưu trên máy chủ. Hãy chọn Trò chơi mới để bắt đầu.</p>)}
      </section>
    </main>;
  }

  return <div className="live-shell">
    <aside className="live-sidebar">
      <div className="live-brand"><span className="live-brand-mark"><Flame size={19} /></span><div><strong>ICE AGE LORD</strong><small>TRỰC TUYẾN</small></div></div>
      <div className="live-sidebar-status"><span className="live-status-dot" /> Đã kết nối · SQLite API</div>
      <nav className="live-nav" aria-label="Màn hình game">
        {navigation.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={'live-nav-item' + (screen === item.id ? ' is-active' : '')} aria-current={screen === item.id ? 'page' : undefined} onClick={() => setScreen(item.id)}>
            <Icon size={18} /><span><strong>{item.name}</strong><small>{item.hint}</small></span>
          </button>;
        })}
      </nav>
      <div className="live-sidebar-footer"><span>Đồng hồ thế giới</span><strong>{view.clockControl.status.toUpperCase()}</strong></div>
    </aside>
    <main className="live-main">
      <header className="live-topbar">
        <ScreenHeading mode="live" className="live-topbar-heading" eyebrow="CUỘC HÀNH TRÌNH" title={navigation.find(item => item.id === screen)?.name ?? screen} description={`${selectedSave?.slotName || view.player.name} · Ngày ${view.worldClock.day} ${String(view.worldClock.hour).padStart(2, '0')}:${String(view.worldClock.minute).padStart(2, '0')} · revision ${view.revision}`}/>
        <div className="live-header-actions">
          {onExit && <button type="button" className="live-button live-button--secondary live-save-switch" disabled={working || Boolean(pendingCommand)} onClick={onExit}>Menu chính</button>}
          <button
            className="live-button live-button--secondary live-save-switch"
            title={pendingCommand ? 'Gửi lại cùng mã lệnh trước khi đổi lượt lưu.' : 'Chọn một lượt lưu khác.'}
            disabled={working || Boolean(pendingCommand)}
            onClick={() => void returnToSavePicker()}
          >Đổi lượt lưu</button>
          <span className="live-data-chip">EVENT {view.lastEventSequence}</span>
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
            <button className="live-icon-button" aria-label="Mở thông báo từ nhật ký máy chủ" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}>
              <Bell size={17} />{events.length > 0 && <span className="live-notification-count">{Math.min(events.length, 99)}</span>}
            </button>
            {notificationsOpen && <section className="live-notification-popover" role="status" aria-label="Thông báo máy chủ gần đây">
              <div className="live-notification-heading"><strong>Thông báo máy chủ</strong><button className="live-text-button" onClick={() => setScreen('journal')}>Mở nhật ký</button></div>
              {events.length
                ? <ol className="live-event-list">{events.slice(-5).reverse().map(item => <li key={item.eventId}>
                  <span className="live-event-sequence">#{item.sequence} · {item.category}</span><strong>{item.title}</strong><p>{item.text}</p>
                </li>)}</ol>
                : <p className="live-empty-state">Chưa có thông báo trong nhật ký máy chủ.</p>}
            </section>}
          </div>
          <button className="live-icon-button" aria-label="Tải lại từ API" onClick={() => void loadLatest()} disabled={working}><RefreshCw size={17} /></button>
        </div>
      </header>
      <div className="live-content">
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        <RuntimeStrip view={view} />
        <PageFrame mode="live" className={`live-screen live-screen--${screen}`}>{pageContent()}</PageFrame>
      </div>
      <footer className="live-footer"><span>LIVE · API PLAYER VIEW</span><span>Save {view.saveId} · revision {view.revision}</span></footer>
    </main>
  </div>;
}

export default LiveApp;
