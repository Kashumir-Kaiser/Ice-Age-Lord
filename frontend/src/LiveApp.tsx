import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle, ArrowRight, CheckCircle2, Eye, Flame, Hammer, Map as MapIcon,
  MapPin, PackageOpen, RefreshCw, ScrollText, Shield, Sparkles, Users,
} from 'lucide-react';
import type {
  ActionAvailability, ClockSpeedSelection, CommandEnvelope, CommandPayloadByType, CommandType,
  CoordinateMm, EntityRef, PlayerEntityView, PlayerView,
} from '../../packages/contracts/src/index.ts';
import type { PlayerEvent, SaveSummary } from '../../packages/contracts/src/api.ts';
import { findAsset, layerPath, loadAssetManifest } from './assets/assetRegistry';
import type { AssetManifest } from './assets/assetRegistry';
import { entityRefKey, GameApiError, HttpGameClient } from './live/HttpGameClient';

type Screen = 'overview' | 'territory' | 'map' | 'inventory' | 'forces' | 'buildings' | 'journal';
type Feedback = { kind: 'idle' | 'saving' | 'committed' | 'rejected' | 'disconnected'; text: string };
const SAVE_KEY = 'ice-age-lord.live.last-save';
const CREATE_KEY_PREFIX = 'ice-age-lord.live.create-key:';

const navigation: { id: Screen; name: string; hint: string; icon: typeof Sparkles }[] = [
  { id: 'overview', name: 'Tổng quan', hint: 'Trạng thái phiên', icon: Sparkles },
  { id: 'territory', name: 'Lãnh địa', hint: 'Công trình chính', icon: Shield },
  { id: 'map', name: 'Bản đồ', hint: 'Dữ liệu đã biết', icon: MapIcon },
  { id: 'inventory', name: 'Kho vật phẩm', hint: 'Đã quan sát', icon: PackageOpen },
  { id: 'forces', name: 'Quân lực', hint: 'Đơn vị sở hữu', icon: Users },
  { id: 'buildings', name: 'Công trình', hint: 'Trạng thái API', icon: Hammer },
  { id: 'journal', name: 'Nhật ký', hint: 'Event ledger', icon: ScrollText },
];

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

function fireArtwork(manifest: AssetManifest | null, level: number) {
  if (!manifest) return undefined;
  const stage = manifest.fireProgression?.find(item => level >= item.minLevel && level <= item.maxLevel);
  if (stage) return findAsset(manifest, stage.assetId);
  return manifest.assets.find(item => item.assetId === 'campfire-start');
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

function LiveApp() {
  const [client] = useState(() => new HttpGameClient());
  const [apiState, setApiState] = useState<'checking' | 'ready' | 'disconnected'>('checking');
  const [apiMessage, setApiMessage] = useState('');
  const [ownerKey, setOwnerKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [saves, setSaves] = useState<readonly SaveSummary[]>([]);
  const [slotName, setSlotName] = useState('Lãnh Địa Mới');
  const [view, setView] = useState<PlayerView | null>(null);
  const [events, setEvents] = useState<readonly PlayerEvent[]>([]);
  const [screen, setScreen] = useState<Screen>('overview');
  const [selectedRef, setSelectedRef] = useState<EntityRef | null>(null);
  const [combatActorId, setCombatActorId] = useState('');
  const [selectedCombatTargetId, setSelectedCombatTargetId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<CommandEnvelope | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle', text: '' });
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [manifestError, setManifestError] = useState(false);
  const [customSpeed, setCustomSpeed] = useState('10');
  const [customSelection, setCustomSelection] = useState(false);
  const [chooseDestination, setChooseDestination] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [destination, setDestination] = useState<CoordinateMm | null>(null);
  const [destinationAvailability, setDestinationAvailability] = useState<ActionAvailability | null>(null);
  const [searchRadiusMetres, setSearchRadiusMetres] = useState(500);
  const [travelActorId, setTravelActorId] = useState('LI_LAN');
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
    let active = true;
    loadAssetManifest().then(result => {
      if (active) setManifest(result);
    }).catch(() => {
      if (active) setManifestError(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated || !view) return;
    let active = true;
    let inFlight = false;
    const refreshClock = async () => {
      if (inFlight || working) return;
      inFlight = true;
      try {
        await client.heartbeatClock();
        const nextView = await client.getView();
        if (active) setView(nextView);
      } catch (error) {
        if (active) setFeedback({
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
  }, [authenticated, client, view?.saveId, working]);

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

  async function refreshEvents() {
    const page = await client.listEvents(0, 200);
    setEvents(page.events);
  }

  async function activateSave(saveId: string) {
    await client.selectSave(saveId);
    const nextView = await client.getView();
    setView(nextView);
    setSelectedRef(nextView.territory.survivalFire.ref);
    localStorage.setItem(SAVE_KEY, saveId);
    setScreen('overview');
    try {
      await refreshEvents();
    } catch (error) {
      setEvents([]);
      setFeedback({ kind: 'committed', text: 'Lượt lưu đã mở; nhật ký chưa tải được: ' + errorMessage(error) });
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
      const rememberedId = localStorage.getItem(SAVE_KEY);
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
      await client.selectSave(result.save.saveId);
      const nextView = await client.getView();
      setView(nextView);
      setSelectedRef(nextView.territory.survivalFire.ref);
      localStorage.setItem(SAVE_KEY, result.save.saveId);
      localStorage.removeItem(storageKey);
      setSaves(current => [result.save, ...current.filter(save => save.saveId !== result.save.saveId)]);
      setEvents([]);
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
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang tải lại snapshot và event ledger…' });
    try {
      const nextView = await client.getView();
      setView(nextView);
      await refreshEvents();
      setFeedback({ kind: 'committed', text: 'Đã tải lại revision ' + nextView.revision + ' từ API.' });
    } catch (error) {
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
    setWorking(true);
    setFeedback({ kind: 'saving', text: retry ? 'Đang gửi lại cùng command ID…' : 'Đang kiểm tra lệnh với API…' });
    try {
      if (!retry) {
        const preview = await client.previewCommand(command);
        if (!preview.availability.enabled) {
          setPendingCommand(null);
          setFeedback({ kind: 'rejected', text: availabilityMessage(preview.availability) });
          return;
        }
      }
      setPendingCommand(command);
      const result = await client.submitCommand(command);
      setView(result.view);
      setSelectedRef(current => current || result.view.territory.survivalFire.ref);
      setPendingCommand(null);
      setFeedback({
        kind: 'committed',
        text: result.receipt.message + ' · revision ' + result.revision + ' đã commit.',
      });
      try {
        await refreshEvents();
      } catch (error) {
        setFeedback({ kind: 'committed', text: 'Lệnh đã commit; event ledger chưa tải được: ' + errorMessage(error) });
      }
    } catch (error) {
      if (error instanceof GameApiError && error.code === 'STALE_REVISION') {
        try {
          setView(await client.getView());
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
    setWorking(true);
    setFeedback({ kind: 'saving', text: 'Đang kiểm tra chi phí, nhân công và vị trí với API…' });
    try {
      const result = await client.previewCommand(command);
      setConstructionPreview({ key: constructionCommandKey(command), availability: result.availability });
      setFeedback({
        kind: result.availability.enabled ? 'committed' : 'rejected',
        text: result.availability.enabled
          ? `${result.availability.preview?.label ?? 'Construction preview'} · ${result.availability.preview?.value ?? 'server validation passed'}`
          : availabilityMessage(result.availability),
      });
    } catch (error) {
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
    setDestination(position);
    setDestinationAvailability(null);
    const command = commandFor(view, 'move', { actorId: travelActorId, destination: position });
    void client.previewCommand(command).then(result => setDestinationAvailability(result.availability)).catch(error => {
      setFeedback({ kind: 'rejected', text: errorMessage(error) });
    });
  }

  function moveToEntity(entity: PlayerEntityView) {
    if (!view) return;
    const command = commandFor(view, 'move', { actorId: travelActorId, destinationId: entity.ref.id });
    void client.previewCommand(command).then(result => {
      if (!result.availability.enabled) setFeedback({ kind: 'rejected', text: availabilityMessage(result.availability) });
      else void sendCommand(command);
    }).catch(error => setFeedback({ kind: 'rejected', text: errorMessage(error) }));
  }

  function harvestSelectedResource(entity: PlayerEntityView) {
    if (!view || entity.ref.type !== 'resource') return;
    const availability = entity.actions.find(item => item.actionId === 'harvest');
    if (!availability?.enabled) {
      setFeedback({ kind: 'rejected', text: availability ? availabilityMessage(availability) : 'Harvest is not available for this source.' });
      return;
    }
    const bag = view.inventory.containers.find(container => container.kind === 'carried_bag');
    const resource = view.spatial.resources.find(item => item.resourceId === entity.ref.id);
    const requiredTemplate = resource?.materialId === 'WOOD' ? 'STONE-AXE' : resource?.materialId === 'STONE' ? 'STONE-HAMMER' : null;
    const tool = bag?.items.find(item => item.label === requiredTemplate && item.quantity > 0);
    if (!resource || !tool) {
      setFeedback({ kind: 'rejected', text: 'Move the required tool into the carried bag first.' });
      return;
    }
    void sendCommand(commandFor(view, 'harvest', {
      actorId: view.player.id,
      resourceId: resource.resourceId,
      materialId: resource.materialId,
      quantity: 1,
      toolItemId: tool.itemId,
    }));
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
  const fireAsset = view ? fireArtwork(manifest, view.territory.survivalFire.level) : undefined;
  const fireIcon = layerPath(fireAsset, 'uiIcon', 'district');
  const fireBody = layerPath(fireAsset, 'body', 'close');
  const fireBase = layerPath(fireAsset, 'base', 'close');
  const fireUpper = layerPath(fireAsset, 'upper', 'close');
  const fireShadow = layerPath(fireAsset, 'shadow', 'close');
  const fireVfx = layerPath(fireAsset, 'vfx', 'close');

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
          <button className={'live-button' + (chooseDestination ? '' : ' live-button--secondary')} disabled={working || Boolean(pendingCommand)} onClick={() => setChooseDestination(value => !value)}>
            {chooseDestination ? 'Cancel destination selection' : 'Choose destination'}
          </button>
          <div className="live-zoom-controls"><button className="live-button live-button--secondary" aria-label="Zoom out" disabled={mapZoom <= 0.2} onClick={() => setMapZoom(value => Math.max(0.2, Math.round(value / 1.6 * 100) / 100))}>−</button><span>{mapZoom.toFixed(2)}×</span><button className="live-button live-button--secondary" aria-label="Zoom in" disabled={mapZoom >= 500} onClick={() => setMapZoom(value => Math.min(500, Math.round(value * 1.6 * 100) / 100))}>+</button></div>
          <label className="live-inline-field">Travel actor <select value={travelActorId} onChange={event => { setTravelActorId(event.target.value); setDestination(null); setDestinationAvailability(null); }}><option value={view.player.id}>{view.player.name}</option>{view.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <span className="live-data-chip">Center · {center.xMm}, {center.yMm} mm</span>
        </div>
        {chooseDestination && <p className="live-map-hint">Click an empty map coordinate to preview an order. Confirming travel is a separate action.</p>}
        {fireRef && !fireEntity && <div className="live-inline-error" role="alert">Không tìm thấy Lửa Sinh Tồn trên bản đồ hiện tại.</div>}
        <div className="live-map-canvas" data-testid="live-map">
          <div className="live-map-crosshair" aria-hidden="true" />
          <svg className="live-map-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {view.visibleMap.exploredGeometry.map(area => {
              const centerPoint = area.points[0];
              if (!centerPoint || area.radiusMm === undefined) return null;
              const projected = point(centerPoint);
              return <ellipse key={area.id} className="live-map-explored" cx={projected.x} cy={projected.y} rx={area.radiusMm / horizontalSpanMm * 100} ry={area.radiusMm / spanMm * 100} />;
            })}
            {view.visibleMap.knownRoutes.map(route => <polyline key={route.id} className="live-map-route" points={toPolyline(route.path)} />)}
            {view.visibleMap.activeOrders.map(order => <polyline key={order.id} className="live-map-order" points={toPolyline(order.path)} />)}
            {view.spatial.searchJobs.filter(job => job.status === 'active').map(job => <polyline key={job.id} className="live-map-search-path" points={toPolyline(job.path)} />)}
            {view.spatial.harvestJobs.filter(job => job.status === 'active').map(job => <polyline key={job.id} className="live-map-order" points={toPolyline(job.stage === 'returning' ? job.routeReturn : job.routeOut)} />)}
            {view.visibleMap.currentSight.map((sight, index) => {
              const projected = point(sight.center);
              return <ellipse key={`${sight.source}-${index}`} className="live-map-sight" cx={projected.x} cy={projected.y} rx={sight.radiusMm / horizontalSpanMm * 100} ry={sight.radiusMm / spanMm * 100} />;
            })}
          </svg>
          <div className="live-map-click-layer" onClick={event => {
            if (!chooseDestination) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
            previewCoordinateDestination({ xMm: Math.round(center.xMm + (x - 0.5) * horizontalSpanMm), yMm: Math.round(center.yMm - (y - 0.5) * spanMm), sourceZMetres: center.sourceZMetres ?? 0 });
          }} />
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
            return <button
              key={entityRefKey(entity.ref)}
              className={'live-map-marker' + (isFire ? ' live-map-marker--fire' : '') + (sameRef(entity.ref, selectedRef) ? ' is-selected' : '')}
              data-testid={isFire ? 'map-campfire-marker' : undefined}
              data-entity-ref={entityRefKey(entity.ref)}
              style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setSelectedRef(entity.ref); }}
              aria-label={entity.label}
              title={entity.label}
            >
              {isFire && fireIcon ? <img src={fireIcon} alt="" /> : <MapPin size={19} aria-hidden="true" />}
              <span>{entity.label}</span>
            </button>;
          })}
          {(view.visibleMap.combatTargets ?? []).map(target => {
            const projected = point(target.position);
            const left = Math.max(2, Math.min(98, projected.x));
            const top = Math.max(2, Math.min(98, projected.y));
            return <button key={target.targetId} className={'live-map-marker live-map-marker--combat' + (selectedCombatTargetId === target.targetId ? ' is-selected' : '')}
              data-testid="map-combat-target" style={{ left: left + '%', top: top + '%' }}
              onClick={event => { event.stopPropagation(); setSelectedCombatTargetId(target.targetId); }}
              aria-label={target.label} title={target.label}><MapPin size={19} aria-hidden="true" /><span>{target.label}</span></button>;
          })}
          {view.units.filter(unit => unit.position).map(unit => {
            const projected = point(unit.position!);
            return <span key={unit.id} className="live-map-unit" style={{ left: `${Math.max(2, Math.min(98, projected.x))}%`, top: `${Math.max(2, Math.min(98, projected.y))}%` }} title={unit.name}>{unit.name}</span>;
          })}
          {(() => { const projected = point(view.player.position); return <span className="live-map-player" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Lí Lan">LL</span>; })()}
          {destination && (() => { const projected = point(destination); return <span className="live-map-destination" style={{ left: `${projected.x}%`, top: `${projected.y}%` }} title="Selected destination" />; })()}
          {view.visibleMap.entities.length === 0 && <p className="live-map-empty">No explored map entities are known yet.</p>}
        </div>
        {destination && <div className="live-destination-preview">
          <div><strong>Destination preview</strong><span>{destination.xMm}, {destination.yMm} mm · {destinationAvailability?.preview?.value ?? (destinationAvailability ? availabilityMessage(destinationAvailability) : 'Calculating…')}</span></div>
          <button className="live-button" disabled={working || Boolean(pendingCommand) || !destinationAvailability?.enabled} onClick={() => void sendCommand(commandFor(view, 'move', { actorId: view.player.id, destination }))}>Start travel</button>
        </div>}
        {view.spatial.movementOrders.filter(order => order.status === 'active').map(order => <div key={order.id} className="live-destination-preview">
          <div><strong>Travel in progress</strong><span>{(order.totalDistanceMm / 1_000_000).toFixed(2)} km · {Math.floor(view.jobs.find(job => job.id === order.id)?.progressPercent ?? 0)}% · {order.pathSegments.some(segment => segment.uncertainty === 'uncertain') ? 'uncertain route' : 'known route'}</span></div>
          <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_travel', { orderId: order.id }))}>Cancel travel</button>
        </div>)}
        {selectedEntity && <div className="live-inspector">
          <div><span className="live-eyebrow">SELECTED · {selectedEntity.category}</span><h3>{entityLabel(selectedEntity)}</h3><p>{selectedEntity.knowledge} · observed at {elapsedLabel(selectedEntity.observedAtElapsedMs)}</p></div>
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
            {selectedHarvest && <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || !selectedHarvest.enabled} onClick={() => harvestSelectedResource(selectedEntity)}>Harvest one unit</button>}
            {selectedOpen && <small>{availabilityMessage(selectedOpen)}</small>}
            {selectedInspect && !selectedInspect.enabled && <small>{availabilityMessage(selectedInspect)}</small>}
            {selectedMove && !selectedMove.enabled && <small>{availabilityMessage(selectedMove)}</small>}
            {selectedHarvest && !selectedHarvest.enabled && <small>{availabilityMessage(selectedHarvest)}</small>}
          </div>
        </div>}
        {selectedCombatTarget && <div className="live-inspector" data-testid="combat-target-inspector">
          <div><span className="live-eyebrow">ENCOUNTER TARGET · H0</span><h3>{selectedCombatTarget.label}</h3>
            <p>{selectedCombatTarget.state === 'available' ? 'A known snow hare track is within sight.' : 'The hare has reacted to the encounter.'} · R0 population {selectedCombatTarget.regionalPopulationRemaining}</p></div>
          <div className="live-action-stack">
            <label className="live-inline-field">Fighter <select value={selectedCombatActorId} onChange={event => setCombatActorId(event.target.value)}>
              <option value="">Choose a living owned unit</option>{view.units.filter(unit => unit.health && unit.health.current > 0).map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            <button className="live-button" disabled={working || Boolean(pendingCommand) || selectedCombatTarget.state !== 'available' || !selectedCombatActorId}
              onClick={() => void sendCommand(commandFor(view, 'attack', { actorIds: [selectedCombatActorId], targetId: selectedCombatTarget.id }))}>Engage target</button>
            {!selectedCombatTarget.attack.enabled && <small>{availabilityMessage(selectedCombatTarget.attack)}</small>}
          </div>
        </div>}
      </section>
      <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">SEARCH · FIXED 15-MINUTE SWEEPS</span><h3>Focused search</h3></div><Eye size={20} /></div>
        <div className="live-button-row"><label className="live-inline-field">Lane radius <select value={searchRadiusMetres} onChange={event => setSearchRadiusMetres(Number(event.target.value))}><option value={250}>250 m</option><option value={500}>500 m</option><option value={1000}>1 km</option><option value={2000}>2 km</option></select></label>
          <button className="live-button" disabled={working || Boolean(pendingCommand) || view.spatial.searchJobs.some(job => job.status === 'active')} onClick={() => void sendCommand(commandFor(view, 'search', { actorId: view.player.id, center: view.player.position, radiusMm: searchRadiusMetres * 1000 }))}>Start search from current position</button>
        </div>
        {view.spatial.searchJobs.length > 0 && <ul className="live-plain-list">{view.spatial.searchJobs.map(job => <li key={job.id}><strong>Search · {job.status} · {Math.floor(view.jobs.find(item => item.id === job.id)?.progressPercent ?? 0)}%</strong><span>{job.uniqueAreaM2.toFixed(0)} m² unique · {job.repeatedAreaM2.toFixed(0)} m² repeated {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Cancel</button>}</span></li>)}</ul>}
        {view.spatial.harvestJobs.length > 0 && <ul className="live-plain-list">{view.spatial.harvestJobs.map(job => <li key={job.id}><strong>Harvest · {job.stage} · {job.status}</strong><span>{job.extractedQuantity}/{job.requestedQuantity} gathered {job.status === 'active' && <button className="live-text-button" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'cancel_spatial_job', { jobId: job.id }))}>Cancel</button>}</span></li>)}</ul>}
        {destinationAvailability && !destinationAvailability.enabled && <p className="live-inline-error">{availabilityMessage(destinationAvailability)}</p>}
      </section>
    </div>;
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
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading">
            <div><span className="live-eyebrow">LÃNH ĐỊA</span><h2>Lãnh địa</h2></div>
            <span className="live-data-chip">Ref {fireRef ? entityRefKey(fireRef) : 'chưa có'}</span>
          </div>
          <p className="live-muted">Ảnh cấu trúc lấy từ asset manifest; trạng thái và cấp độ lấy từ cùng PlayerView với bản đồ.</p>
          <figure className="live-settlement-canvas">
            <div className="live-settlement-grid" aria-hidden="true" />
            {fireRef && <button
              className="live-settlement-structure"
              data-testid="territory-campfire-structure"
              data-entity-ref={entityRefKey(fireRef)}
              aria-label={entityLabel(fireEntity)}
              onClick={() => setSelectedRef(fireRef)}
            >
              {fireAsset && fireShadow && <img className="live-fire-layer live-fire-layer--shadow" src={fireShadow} alt="" />}
              {fireAsset && fireBase && fireUpper ? <>
                <img className="live-fire-layer live-fire-layer--base" src={fireBase} alt="" />
                <img className="live-fire-layer live-fire-layer--upper" src={fireUpper} alt="" />
              </> : fireAsset && fireBody ? <img className="live-fire-layer live-fire-layer--body" src={fireBody} alt={entityLabel(fireEntity)} /> : <span className="live-art-missing">{manifestError ? 'Asset chưa sẵn sàng' : 'Đang tải artwork'}</span>}
              {view.territory.survivalFire.active && fireAsset && fireVfx && <img className="live-fire-layer live-fire-layer--vfx" src={fireVfx} alt="" />}
            </button>}
            <figcaption>{entityLabel(fireEntity)} · {view.territory.survivalFire.active ? 'đang hoạt động' : 'đã tắt'}</figcaption>
          </figure>
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
              <button className="live-button live-button--secondary" title={view.territory.survivalFire.fuelKnowledge !== 'known' ? 'Không thể tính tổng nhiên liệu chính xác khi lượng gỗ mở đầu chưa được ghi nhận.' : woodFuel ? 'Chuyển 1 gỗ đã quan sát vào lửa.' : 'Không có gỗ đã quan sát trong container sở hữu và có thể truy cập.'} disabled={working || Boolean(pendingCommand) || !woodFuel || view.territory.survivalFire.fuelKnowledge !== 'known'} onClick={() => woodFuel && void sendCommand(commandFor(view, 'refuel_fire', { containerId: woodFuel.containerId, itemId: woodFuel.itemId, quantity: 1 }))}>Nạp 1 gỗ</button>
              {view.territory.survivalFire.active
                ? <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'extinguish_fire', {}))}>Tắt lửa</button>
                : <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand) || (view.territory.survivalFire.fuelRemaining ?? 0) < 1} onClick={() => void sendCommand(commandFor(view, 'light_fire', {}))}>Nhóm lửa</button>}
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
                  ? <ul className="live-plain-list">{container.items.map(item => <li key={item.itemId}>
                    <strong>{item.label} · × {item.quantity} · free {Math.max(0, item.quantity - item.reservedQuantity)}{item.equipped ? ' · equipped' : ''}</strong>
                    <span>{item.reservedQuantity} reserved · owner {item.ownerId ?? 'legacy/unspecified'} · {item.unit ?? 'unit unspecified'} · quality {item.quality ?? 'unspecified'}{item.condition !== null && item.condition !== undefined ? ` · độ bền ${Math.round(item.condition * 100)}%` : ''} · {item.provenance} · {item.equipped ? `equipped${item.equippedSlotId ? ` (${item.equippedSlotId})` : ''}` : 'not equipped'}{item.foodUnitsPerItem !== null ? ` · ${item.foodUnitsPerItem} food units/item` : ''}{item.equipmentTags?.length ? ` · loại: ${item.equipmentTags.map(tag => tag === 'WEAPON' || tag === 'WEAPON_1H' ? 'vũ khí' : tag === 'ARMOR' || tag === 'ARMOR_LIGHT' ? 'giáp nhẹ' : tag).join(', ')}` : ''} · {view.inventory.containers.filter(target => target.id !== container.id).map(target => <button key={target.id} className="live-text-button" disabled={working || Boolean(pendingCommand) || !container.accessible || !target.accessible || item.quantity <= item.reservedQuantity} title={!container.accessible || !target.accessible ? 'Move Lí Lan within reach of both containers.' : `Transfer unreserved items to ${target.label}.`} onClick={() => void sendCommand(commandFor(view, 'transfer_item', {
                      actorId: view.player.id, sourceContainerId: container.id, destinationContainerId: target.id, itemId: item.itemId, quantity: item.quantity - item.reservedQuantity,
                    }))}>→ {target.label}</button>)}</span>
                  </li>)}</ul>
                  : <p>Container đã quan sát, chưa có vật phẩm.</p>}
                <small className="live-container-access">{container.accessible ? 'Within reach' : 'Out of reach'}</small>
              </article>)}</div>
            : view.inventory.inspectableContainers.length === 0 && <p className="live-empty-state">API chưa cung cấp container đã quan sát hoặc có thể kiểm tra.</p>}
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
      return <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">OWNED UNITS</span><h2>Quân lực</h2></div><Users size={22} /></div>
        {view.combat?.target && <article className="live-container-card" data-testid="stage07-combat-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">H0 · OPENING ENCOUNTER</span><h3>{view.combat.target.label}</h3></div>
            <span className="live-data-chip">{view.combat.target.state}</span></div>
          <p>Thỏ băng thuộc quần thể có sẵn ECO-LL01-R0. Còn {view.combat.target.regionalPopulationRemaining} trong tổng số ban đầu; cá thể này không được tạo lại khi rút lui hay tải save.</p>
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
      </section>;
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
          {view.territory.buildings.filter(building => building.blueprintId === 'BP-OPEN-HEATER-01' && building.status === 'active').length === 0
            ? <p className="live-empty-state">No active heater is built. Its fixed opening recipe is 6 STONE.</p>
            : view.territory.buildings.filter(building => building.blueprintId === 'BP-OPEN-HEATER-01' && building.status === 'active').map(building => {
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
      {events.length
        ? <ol className="live-event-list">{events.map(item => <li key={item.eventId}><span className="live-event-sequence">#{item.sequence} · {item.category}</span><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol>
        : <p className="live-empty-state">API chưa trả event nào cho lượt lưu này.</p>}
    </section>;
  }

  const selectedSave = view ? saves.find(save => save.saveId === view.saveId) : null;

  if (!authenticated) {
    return <main className="live-start-page">
      <section className="live-start-card">
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
        <span className="live-eyebrow">OWNER SESSION CONNECTED</span>
        <h1>Chọn hoặc tạo lượt lưu</h1>
        <p>Chưa có trạng thái game nào được mở. Tạo clean game mới hoặc tải một save đã có.</p>
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        <form className="live-owner-form" onSubmit={createFreshSave}>
          <label htmlFor="slot-name">Tên lượt lưu mới</label>
          <input id="slot-name" value={slotName} onChange={event => setSlotName(event.target.value)} maxLength={80} required disabled={working} />
          <button className="live-button" type="submit" disabled={working}>{working ? 'Đang tạo…' : 'Tạo lượt chơi sạch'} <ArrowRight size={16} /></button>
        </form>
        {saves.length > 0 && <div className="live-save-list">
          <h2>Lượt lưu có sẵn</h2>
          {saves.map(save => <button key={save.saveId} className="live-save-row" disabled={working} onClick={() => void openSave(save.saveId)}>
            <span><strong>{save.slotName}</strong><small>{save.saveId} · revision {save.revision}</small></span><ArrowRight size={17} />
          </button>)}
        </div>}
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
        <div><span className="live-eyebrow">CUỘC HÀNH TRÌNH</span><h1>{navigation.find(item => item.id === screen)?.name}</h1><p>{selectedSave?.slotName || view.player.name} · Ngày {view.worldClock.day} {String(view.worldClock.hour).padStart(2, '0')}:{String(view.worldClock.minute).padStart(2, '0')} · revision {view.revision}</p></div>
        <div className="live-header-actions">
          <span className="live-data-chip">EVENT {view.lastEventSequence}</span>
          <div className="live-clock-controls" aria-label="Điều khiển đồng hồ mô phỏng">
            <select aria-label="Tốc độ mô phỏng" value={customSelection ? 'custom' : view.clockControl.selection} disabled={working || Boolean(pendingCommand) || view.clockStatus.driver !== 'active'} onChange={event => {
              const speed = event.target.value as ClockSpeedSelection;
              if (speed === 'custom') setCustomSelection(true);
              else { setCustomSelection(false); changeClockSpeed(speed); }
            }}>
              <option value="paused">Đóng băng</option><option value="1x">1×</option><option value="2x">2×</option><option value="5x">5×</option><option value="custom">Tùy chỉnh</option>
            </select>
            {(customSelection || view.clockControl.selection === 'custom') && <><input aria-label="Tốc độ tùy chỉnh" type="number" min="0.1" max="3600" step="0.1" value={customSpeed} onChange={event => setCustomSpeed(event.target.value)} disabled={view.clockStatus.driver !== 'active'} /><button className="live-clock-apply" disabled={working || Boolean(pendingCommand) || view.clockStatus.driver !== 'active' || Number(customSpeed) < 0.1 || Number(customSpeed) > 3600} onClick={() => { setCustomSelection(true); changeClockSpeed('custom'); }}>Áp dụng</button></>}
            <select aria-label="Điều kiện tự dừng" value={view.clockControl.stopCondition} disabled={working || Boolean(pendingCommand) || view.clockStatus.driver !== 'active'} onChange={event => changeStopCondition(event.target.value as 'none' | 'next_completion' | 'danger')}>
              <option value="none">Không tự dừng</option><option value="next_completion">Dừng khi xong</option><option value="danger">Dừng khi nguy hiểm</option>
            </select>
          </div>
          {view.clockStatus.driver === 'observing' && <span className="live-driver-label">Tab khác đang giữ quyền</span>}
          <button className="live-icon-button" aria-label="Tải lại từ API" onClick={() => void loadLatest()} disabled={working}><RefreshCw size={17} /></button>
        </div>
      </header>
      <div className="live-content">
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        <RuntimeStrip view={view} />
        {pageContent()}
      </div>
      <footer className="live-footer"><span>LIVE · API PLAYER VIEW</span><span>Save {view.saveId} · revision {view.revision}</span></footer>
    </main>
  </div>;
}

export default LiveApp;
