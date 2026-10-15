import { playerItemName, playerStatus } from '../live/playerText';
import { useState } from 'react';
import { CalendarDays, Gift, ShoppingBag, Snowflake } from 'lucide-react';
import type { SharedLayoutMode } from './PageFrame';
import './shared.css';

export type EventBoardEntry = {
  id: string;
  displayName: string;
  status: string;
  readiness: string;
  opensAtElapsedMs: number;
  locksAtElapsedMs: number;
  resolvesAtElapsedMs: number;
  objective: { title: string; progress: number; target: number; score: number; participated: boolean; choiceId: 'ice' | 'snow' | null } | null;
  outcome: string | null;
  rewardKrona: number;
  claimExpiresAtElapsedMs: number | null;
  rewardClaimed: boolean;
  eventShop: { status: string; scoreAvailable: number; priceScore: number; itemTemplateId: string; stockRemaining: number; initialStock: number; purchasedQuantity: number; expiresAtElapsedMs: number } | null;
};

type DestinationOption = { id: string; label: string };

function statusLabel(status: string): string {
  const labels: Readonly<Record<string, string>> = {
    active: 'Đang mở', locked: 'Đã khóa', resolved: 'Đã quyết toán', scheduled: 'Theo lịch',
    blocked: 'Đang tạm dừng', calendar_only: 'Hợp đồng tham khảo',
  };
  return labels[status] ?? status;
}

export function EventBoard({
  mode, events, formatTime, nowElapsedMs, destinationOptions = [], busy = false,
  blocker, onChoosePath, onClaimReward, onBuyMark,
}: {
  mode: SharedLayoutMode;
  events: readonly EventBoardEntry[];
  formatTime: (elapsedMs: number | null) => string;
  nowElapsedMs: number;
  destinationOptions?: readonly DestinationOption[];
  busy?: boolean;
  blocker?: { displayName: string; playerMessage: string; blockedAtElapsedMs: number } | null;
  onChoosePath?: (eventId: string, choiceId: 'ice' | 'snow') => void;
  onClaimReward?: (eventId: string) => void;
  onBuyMark?: (eventId: string, destinationContainerId: string) => void;
}) {
  const [destinationId, setDestinationId] = useState(destinationOptions[0]?.id ?? '');
  const destinationExists = destinationOptions.some(option => option.id === destinationId);
  const selectedDestinationId = destinationExists ? destinationId : destinationOptions[0]?.id ?? '';
  return <div className={`shared-event-board shared-event-board--${mode}`}>
    <section className={`shared-event-board__panel shared-event-board__panel--${mode}`} aria-label="Lịch và hoạt động sự kiện">
      <header className="shared-event-board__heading">
        <div><span className="shared-event-board__eyebrow"><CalendarDays size={14} /> SỰ KIỆN VÀ HOẠT ĐỘNG</span>
          <h2>Sự kiện thế giới</h2>
        </div>
        <span className="shared-event-board__chip">{mode === 'demo' ? 'Bản xem thử' : 'Theo giờ thế giới'}</span>
      </header>
      {mode === 'demo' && <p className="shared-event-board__notice">Ba mốc đại diện trong lịch 30 sự kiện. Bảng này dùng chung bố cục với giao diện trực tiếp, nhưng các dòng ở đây chỉ là hợp đồng tham khảo và không thể nhận thưởng.</p>}
      {blocker && <div className="shared-event-board__blocker" role="alert"><strong>{blocker.displayName}</strong><span>{blocker.playerMessage} · {formatTime(blocker.blockedAtElapsedMs)}</span></div>}
      {events.length === 0
        ? <p className="shared-event-board__empty">Chưa có sự kiện nào được tiết lộ trong lịch của người chơi.</p>
        : <div className="shared-event-board__list">{events.map(event => {
          const shop = event.eventShop;
          const canBuy = mode === 'live' && shop?.status === 'active' && shop.stockRemaining > 0
            && shop.scoreAvailable >= shop.priceScore && Boolean(selectedDestinationId) && Boolean(onBuyMark);
          return <article className="shared-event-card" key={event.id} data-event-id={event.id}>
            <div className="shared-event-card__title"><div><h3>{event.displayName}</h3></div><span className={`shared-event-card__status shared-event-card__status--${event.status}`}>{statusLabel(event.status)}</span></div>
            <p className="shared-event-card__timing">Mở {formatTime(event.opensAtElapsedMs)} · khóa {formatTime(event.locksAtElapsedMs)} · quyết toán {formatTime(event.resolvesAtElapsedMs)}</p>
            {event.objective && <section className="shared-event-objective" aria-label={`Mục tiêu ${event.objective.title}`}>
              <div className="shared-event-objective__heading"><strong>{event.objective.title}</strong><span>{event.objective.progress}/{event.objective.target}</span></div>
              <progress max={event.objective.target} value={event.objective.progress} aria-label="Tiến độ mục tiêu" />
              <small>{event.objective.score} điểm · {event.objective.participated ? 'đã tham gia' : 'chưa tham gia'}</small>
              {event.id === 'EV19-ICE-SNOW-CHOICE' && <div className="shared-event-choice">
                <button type="button" disabled={mode !== 'live' || busy || event.status !== 'active' || Boolean(event.objective.choiceId)} onClick={() => onChoosePath?.(event.id, 'ice')}><Snowflake size={14} /> Con đường băng</button>
                <button type="button" disabled={mode !== 'live' || busy || event.status !== 'active' || Boolean(event.objective.choiceId)} onClick={() => onChoosePath?.(event.id, 'snow')}>Con đường tuyết</button>
                {event.objective.choiceId && <small>Đã chọn: {event.objective.choiceId === 'ice' ? 'băng' : 'tuyết'}</small>}
              </div>}
            </section>}
            {event.outcome && event.outcome !== 'unsettled' && <div className="shared-event-outcome">
              <Gift size={15} /><span>Kết quả: {playerStatus(event.outcome)}{event.rewardKrona > 0 ? ` · ${event.rewardKrona} Krona` : ''}</span>
              {event.outcome === 'success' && <small>Nhận trước {formatTime(event.claimExpiresAtElapsedMs)}</small>}
              {mode === 'live' && event.outcome === 'success' && !event.rewardClaimed && <button type="button" disabled={busy} onClick={() => onClaimReward?.(event.id)}>Nhận thưởng</button>}
              {event.rewardClaimed && <small>Đã nhận</small>}
            </div>}
            {shop && <section className="shared-event-shop">
              <div><strong><ShoppingBag size={15} /> Cửa hàng sự kiện</strong><span>{shop.stockRemaining}/{shop.initialStock} · {shop.scoreAvailable} điểm còn dùng · {shop.priceScore} điểm / ấn</span></div>
              <small>{playerItemName(shop.itemTemplateId)} · hết hạn {formatTime(shop.expiresAtElapsedMs)} · mua {shop.purchasedQuantity}</small>
              {mode === 'live' && shop.status === 'active' && <div className="shared-event-shop__controls">
                <label>Kho nhận hàng<select value={selectedDestinationId} onChange={event => setDestinationId(event.target.value)} disabled={busy || destinationOptions.length === 0}>
                  {destinationOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select></label>
                <button type="button" disabled={busy || !canBuy} title={!destinationOptions.length ? 'Cần kiểm tra túi đồ ở gần trước khi nhận vật phẩm.' : shop.scoreAvailable < shop.priceScore ? 'Cần thêm điểm sự kiện.' : 'Mua một dấu ấn sự kiện; máy chủ trừ điểm, giảm kho và giao vật phẩm cùng lúc.'}
                  onClick={() => selectedDestinationId && onBuyMark?.(event.id, selectedDestinationId)}>Mua 1 · {shop.priceScore} điểm</button>
              </div>}
              {mode === 'live' && shop.status === 'active' && shop.scoreAvailable < shop.priceScore && <small>Cần thêm {shop.priceScore - shop.scoreAvailable} điểm để mua một dấu ấn.</small>}
              {shop.status !== 'active' && <small>Quầy {shop.status === 'scheduled' ? 'chưa mở' : shop.status === 'closed' ? 'đã khóa' : 'đã hết hạn'}.</small>}
            </section>}
            {event.readiness !== 'executable_lifecycle' && <small className="shared-event-card__readiness">{event.readiness === 'executable_ranked_board'
              ? 'Bảng xếp hạng được chốt khi sự kiện kết thúc; phần thưởng đang chờ xử lý.'
              : event.readiness === 'calendar_only'
                ? 'Sự kiện này chưa thể tham gia.'
                : event.readiness === 'settlement_blocked'
                  ? 'Kết quả xếp hạng đang chờ hoàn tất.'
                  : 'Sự kiện đang tạm dừng.'}</small>}
          </article>;
        })}</div>}
      <small className="shared-event-board__clock">Thời gian hiện tại: {formatTime(nowElapsedMs)}</small>
    </section>
  </div>;
}
