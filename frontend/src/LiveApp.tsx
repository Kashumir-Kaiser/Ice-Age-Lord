import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle, ArrowRight, CheckCircle2, Eye, Flame, Hammer, Map as MapIcon,
  MapPin, PackageOpen, RefreshCw, ScrollText, Shield, Sparkles, Users,
} from 'lucide-react';
import type {
  ActionAvailability, CommandEnvelope, CommandPayloadByType, CommandType,
  EntityRef, PlayerEntityView, PlayerView,
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
  { id: 'territory', name: 'Lãnh địa', hint: 'H0 · công trình', icon: Shield },
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
  const reason = availability.reasonCode || availability.requirements.join(' ');
  return reason || 'Hành động hiện không khả dụng.';
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
  const [working, setWorking] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<CommandEnvelope | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle', text: '' });
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [manifestError, setManifestError] = useState(false);

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

  function inspectSelected(entity: PlayerEntityView | null) {
    if (!view || !entity || pendingCommand) return;
    void sendCommand(commandFor(view, 'inspect_entity', { entity: entity.ref }));
  }

  function retryPending() {
    if (pendingCommand) void sendCommand(pendingCommand, true);
  }

  const selectedEntity = view && selectedRef
    ? view.visibleMap.entities.find(entity => sameRef(entity.ref, selectedRef)) || null
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
    const origin = view.territory.position;
    return <div className="live-section-stack">
      <section className="live-panel">
        <div className="live-panel-heading">
          <div><span className="live-eyebrow">VISIBLE MAP · API PROJECTION</span><h2>Dữ liệu vị trí đã biết</h2></div>
          <span className="live-data-chip">{view.visibleMap.entities.length} entity</span>
        </div>
        {fireRef && !fireEntity && <div className="live-inline-error" role="alert">Lãnh địa có tham chiếu Lửa Trại, nhưng lớp bản đồ không trả entity cùng ID.</div>}
        <div className="live-map-canvas" data-testid="live-map">
          <div className="live-map-crosshair" aria-hidden="true" />
          {view.visibleMap.terrain.map(terrain => {
            const dx = terrain.position.xMm - origin.xMm;
            const dy = terrain.position.yMm - origin.yMm;
            const left = Math.max(8, Math.min(92, 50 + dx / 10000000 * 38));
            const top = Math.max(8, Math.min(92, 50 - dy / 10000000 * 38));
            return <span key={terrain.id} className="live-terrain-label" style={{ left: left + '%', top: top + '%' }}>{terrain.label}</span>;
          })}
          {view.visibleMap.entities.map(entity => {
            const dx = (entity.position?.xMm ?? origin.xMm) - origin.xMm;
            const dy = (entity.position?.yMm ?? origin.yMm) - origin.yMm;
            const left = Math.max(8, Math.min(92, 50 + dx / 10000000 * 38));
            const top = Math.max(8, Math.min(92, 50 - dy / 10000000 * 38));
            const isFire = sameRef(entity.ref, fireRef);
            return <button
              key={entityRefKey(entity.ref)}
              className={'live-map-marker' + (isFire ? ' live-map-marker--fire' : '') + (sameRef(entity.ref, selectedRef) ? ' is-selected' : '')}
              data-testid={isFire ? 'map-campfire-marker' : undefined}
              data-entity-ref={entityRefKey(entity.ref)}
              style={{ left: left + '%', top: top + '%' }}
              onClick={() => setSelectedRef(entity.ref)}
              aria-label={entity.label}
              title={entity.label}
            >
              {isFire && fireIcon ? <img src={fireIcon} alt="" /> : <MapPin size={19} aria-hidden="true" />}
              <span>{entity.label}</span>
            </button>;
          })}
          {view.visibleMap.entities.length === 0 && <p className="live-map-empty">API chưa trả về entity đã biết.</p>}
        </div>
        {selectedEntity && <div className="live-inspector">
          <div><span className="live-eyebrow">ĐANG CHỌN</span><h3>{entityLabel(selectedEntity)}</h3><p>{selectedEntity.knowledge} · quan sát tại {selectedEntity.observedAtElapsedMs} ms</p></div>
          <div className="live-action-stack">
            <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void runInspection(selectedEntity)}>
              <Eye size={16} /> Kiểm tra điểm đã chọn
            </button>
            {selectedEntity.actions.find(action => action.actionId === 'inspect_entity' && !action.enabled) && <small>{availabilityMessage(selectedEntity.actions.find(action => action.actionId === 'inspect_entity')!)}</small>}
          </div>
        </div>}
      </section>
    </div>;
  }

  function pageContent(): ReactNode {
    if (!view) return null;
    if (screen === 'overview') {
      return <div className="live-section-stack">
        <section className="live-hero">
          <div>
            <span className="live-eyebrow">STAGE 03 · CLEAN GAME</span>
            <h2>{view.player.name}</h2>
            <p>Đây là snapshot từ API. Đồng hồ mô phỏng đang tạm dừng; mở màn hình để đọc dữ liệu không thay đổi trạng thái.</p>
          </div>
          <div className="live-hero-mark"><Sparkles size={34} /><span>H0</span></div>
        </section>
        <div className="live-stat-grid">
          <article className="live-stat"><span>Cấp độ</span><strong>{view.player.level}</strong></article>
          <article className="live-stat"><span>Kinh nghiệm</span><strong>{view.player.xp}</strong></article>
          <article className="live-stat"><span>Mana</span><strong>{view.player.mana.current} / {view.player.mana.max}</strong></article>
          <article className="live-stat"><span>Revision</span><strong>{view.revision}</strong></article>
        </div>
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
              ? <p>{view.careerCard.career.name} · {view.careerCard.career.growthAllocation}</p>
              : <><p>Không hiển thị nội dung trước khi API xác nhận thao tác kiểm tra.</p><button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_career_card', {}))}><Eye size={16} /> Kiểm tra thẻ nghề nghiệp</button></>}
          </section>
        </div>
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">SESSION</span><h3>Trạng thái lượt lưu</h3></div><span className="live-data-chip">Stage 03 · thời gian tạm dừng</span></div>
          <p>Save ID: <code>{view.saveId}</code> · Event sequence: {view.lastEventSequence} · API revision: {view.revision}</p>
        </section>
      </div>;
    }

    if (screen === 'territory') {
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading">
            <div><span className="live-eyebrow">H0 · SETTLEMENT VIEW</span><h2>Lãnh địa</h2></div>
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
            {fireEntity && <button className="live-button live-button--secondary" onClick={() => setScreen('map')}>Chọn cùng entity trên bản đồ <ArrowRight size={15} /></button>}
          </section>
          <section className="live-panel">
            <span className="live-eyebrow">BUILDINGS ĐÃ BIẾT</span>
            <h3>{view.territory.buildings.length} instance</h3>
            {view.territory.buildings.length
              ? <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name}</strong><span>{building.status}</span></li>)}</ul>
              : <p>API chưa trả về công trình đã biết.</p>}
          </section>
        </div>
      </div>;
    }

    if (screen === 'map') return renderMap();

    if (screen === 'inventory') {
      return <div className="live-section-stack">
        <section className="live-panel">
          <div className="live-panel-heading"><div><span className="live-eyebrow">INVENTORY · SERVER PROJECTION</span><h2>Kho vật phẩm</h2></div><PackageOpen size={22} /></div>
          <p className="live-muted">Vật phẩm chỉ xuất hiện sau khi API trả chúng trong container đã quan sát.</p>
          {view.inventory.inspectableContainers.length > 0 && <div className="live-inspectable-list">
            {view.inventory.inspectableContainers.map(container => <article key={container.containerId} className="live-container-row">
              <div><strong>{container.label}</strong><small>{container.kind} · chưa quan sát</small></div>
              <button className="live-button live-button--secondary" disabled={working || Boolean(pendingCommand)} onClick={() => void sendCommand(commandFor(view, 'inspect_starter_container', { containerId: container.containerId }))}><Eye size={15} /> Kiểm tra</button>
            </article>)}
          </div>}
          {view.inventory.containers.length > 0
            ? <div className="live-inventory-grid">{view.inventory.containers.map(container => <article className="live-container-card" key={container.id}>
                <div className="live-panel-heading"><h3>{container.label}</h3><span>{container.slots} ô</span></div>
                {container.items.length
                  ? <ul className="live-plain-list">{container.items.map(item => <li key={item.itemId}><strong>{item.label}</strong><span>× {item.quantity}</span></li>)}</ul>
                  : <p>Container đã quan sát, chưa có vật phẩm.</p>}
              </article>)}</div>
            : view.inventory.inspectableContainers.length === 0 && <p className="live-empty-state">API chưa cung cấp container đã quan sát hoặc có thể kiểm tra.</p>}
        </section>
      </div>;
    }

    if (screen === 'forces') {
      return <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">OWNED UNITS</span><h2>Quân lực</h2></div><Users size={22} /></div>
        {view.units.length
          ? <ul className="live-plain-list">{view.units.map(unit => <li key={unit.id}><strong>{unit.name}</strong><span>{unit.creationRoute}</span></li>)}</ul>
          : <p className="live-empty-state">Snapshot không có đơn vị thuộc sở hữu người chơi.</p>}
      </section>;
    }

    if (screen === 'buildings') {
      return <section className="live-panel">
        <div className="live-panel-heading"><div><span className="live-eyebrow">KNOWN BUILDINGS</span><h2>Công trình</h2></div><Hammer size={22} /></div>
        {view.territory.buildings.length
          ? <ul className="live-plain-list">{view.territory.buildings.map(building => <li key={building.id}><strong>{building.name}</strong><span>{building.status}</span></li>)}</ul>
          : <p className="live-empty-state">API chưa trả về công trình đã biết.</p>}
      </section>;
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
        <span className="live-eyebrow">STAGE 03 · LOCAL OWNER SESSION</span>
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
        <p className="live-footnote">Thời gian mô phỏng không chạy trong Stage 03. Lỗi API sẽ dừng thao tác tại đây.</p>
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
      <div className="live-brand"><span className="live-brand-mark"><Flame size={19} /></span><div><strong>ICE AGE LORD</strong><small>LIVE · STAGE 03</small></div></div>
      <div className="live-sidebar-status"><span className="live-status-dot" /> SQLite API · connected</div>
      <nav className="live-nav" aria-label="Màn hình game">
        {navigation.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={'live-nav-item' + (screen === item.id ? ' is-active' : '')} aria-current={screen === item.id ? 'page' : undefined} onClick={() => setScreen(item.id)}>
            <Icon size={18} /><span><strong>{item.name}</strong><small>{item.hint}</small></span>
          </button>;
        })}
      </nav>
      <div className="live-sidebar-footer"><span>Simulation clock</span><strong>PAUSED · Stage 03</strong></div>
    </aside>
    <main className="live-main">
      <header className="live-topbar">
        <div><span className="live-eyebrow">H0 · LOCAL CAMPAIGN</span><h1>{navigation.find(item => item.id === screen)?.name}</h1><p>{selectedSave?.slotName || view.player.name} · snapshot revision {view.revision}</p></div>
        <div className="live-header-actions">
          <span className="live-data-chip">EVENT {view.lastEventSequence}</span>
          <button className="live-icon-button" aria-label="Tải lại từ API" onClick={() => void loadLatest()} disabled={working}><RefreshCw size={17} /></button>
        </div>
      </header>
      <div className="live-content">
        <StatusBanner feedback={feedback} retry={pendingCommand ? retryPending : undefined} />
        {pageContent()}
      </div>
      <footer className="live-footer"><span>LIVE · API PLAYER VIEW</span><span>Save {view.saveId} · revision {view.revision}</span></footer>
    </main>
  </div>;
}

export default LiveApp;
