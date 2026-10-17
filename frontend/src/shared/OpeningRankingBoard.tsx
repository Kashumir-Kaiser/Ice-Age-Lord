import { playerItemName, playerStatus } from '../live/playerText';
import type { OpeningBoardView, Stage08RankSnapshot } from '../../../packages/contracts/src/index.ts';
import './shared.css';

function boardStatus(status: OpeningBoardView['status']): string {
  if (status === 'scheduled') return 'Theo lịch';
  if (status === 'open') return 'Đang mở';
  return 'Đã đóng';
}

export function OpeningRankingBoard({
  board, snapshots, playerId, formatTime, busy = false, onClaim,
}: {
  board: OpeningBoardView;
  snapshots: readonly Stage08RankSnapshot[];
  playerId: string;
  formatTime: (elapsedMs: number | null) => string;
  busy?: boolean;
  onClaim?: (boardId: string) => void;
}) {
  const playerHasPendingClaim = board.rewardClaimStatus === 'pending';
  return <section className="shared-opening-board" aria-label="Xếp hạng và quyết toán">
    <header className="shared-opening-board__heading">
      <div><span className="shared-opening-board__eyebrow">BẢNG XẾP HẠNG</span><h2>Xếp hạng và quyết toán</h2></div>
      <span className={`shared-opening-board__status shared-opening-board__status--${board.status}`}>{boardStatus(board.status)}</span>
    </header>
    <p className="shared-opening-board__timing">Mở {formatTime(board.opensAtElapsedMs)} · đóng {formatTime(board.closesAtElapsedMs)}</p>
    {board.rows.length > 0
      ? <ol className="shared-opening-board__rows" aria-label="Bảng xếp hạng hiện tại">{board.rows.map(row => <li key={row.playerId}>
        <strong>#{row.rank} · {row.playerName}</strong><span>Cấp {row.level} · hoàn tất {formatTime(row.completionAtElapsedMs)}</span>
      </li>)}</ol>
      : <p className="shared-opening-board__empty">{board.status === 'scheduled'
        ? `Bảng sẽ mở lúc ${formatTime(board.opensAtElapsedMs)}; thứ hạng chỉ xuất hiện sau khi có người hoàn thành điều kiện.`
        : board.status === 'open'
          ? 'Chưa có người chơi đủ điều kiện. Thứ hạng sẽ cập nhật khi kết quả được ghi nhận.'
          : 'Bảng đã đóng mà không có hàng xếp hạng được công bố.'}</p>}
    {snapshots.length === 0
      ? <p className="shared-opening-board__empty">Chưa có kết quả quyết toán cố định.</p>
      : snapshots.map(snapshot => {
        const playerRow = snapshot.rows.find(row => row.playerId === playerId);
        const canDeliver = playerRow?.rewardItems.some(item => item.status === 'committed' && item.quantity > 0) ?? false;
        return <section className="shared-opening-board__settlement" key={snapshot.boardId} aria-label="Kết quả xếp hạng">
          <div className="shared-opening-board__settlement-heading">
            <div><strong>{snapshot.status === 'settled' ? 'Đã tổng kết' : 'Đang chờ kết quả'}</strong>
              <span>{formatTime(snapshot.settledAtElapsedMs)}</span></div>
            <span className="shared-opening-board__reward-status">{playerRow
              ? playerRow.rewardStatus === 'claimed' ? 'Đã nhận thưởng' : playerRow.rewardStatus === 'npc_materialized' ? 'Phần thưởng đã xử lý' : 'Thưởng đang chờ nhận'
              : 'Bạn chưa có hạng thưởng'}</span>
          </div>
          {snapshot.reasonCode && <p className="shared-opening-board__empty">Kết quả đang chờ xác nhận.</p>}
          <ol className="shared-opening-board__rows" aria-label={`Kết quả ${snapshot.boardId}`}>{snapshot.rows.map(row => <li key={row.playerId}>
            <strong>#{row.rank} · {row.playerName}</strong><span>Cấp {row.level} · hoàn tất {formatTime(row.completionAtElapsedMs)}</span>
          </li>)}</ol>
          {playerRow && <div className="shared-opening-board__player-reward">
            {playerRow.rewardItems.length > 0
              ? <ul>{playerRow.rewardItems.map(item => <li key={item.instanceId}>{playerItemName(item.itemTemplateId)} ×{item.quantity} · {playerStatus(item.status)}{item.blocker ? ' · Chưa thể nhận' : ''}</li>)}</ul>
              : <span>Không có vật phẩm trong hạng thưởng này.</span>}
            {playerHasPendingClaim && playerRow.rewardStatus === 'pending' && <button type="button" disabled={busy || !canDeliver || snapshot.status !== 'settled'} onClick={() => onClaim?.(snapshot.boardId)}>
              {canDeliver ? 'Nhận thưởng xếp hạng' : 'Phần thưởng đang chờ dữ liệu nguồn'}
            </button>}
          </div>}
          
        </section>;
      })}
  </section>;
}
