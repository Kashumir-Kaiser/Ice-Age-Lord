import { Archive, Box, Compass, Flame, Hammer, Info, Mountain, Shield, TreePine, Users, Waves } from 'lucide-react';
import type { EntityView } from '../game/GameClient';

const glyphs = { fire: Flame, house: Hammer, tomb: Shield, supply: Archive, chest: Box, wood: TreePine, stone: Mountain, ore: Mountain, water: Waves, herbs: TreePine, salt: Mountain, site: Compass, shield: Shield, sparkles: Flame, users: Users } as const;
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export default function EntityInspector({ entity }: { entity: EntityView | null }) {
  if (!entity) return <aside className="panel inspector entity-inspector" role="region" aria-label="Thông tin điểm được chọn">
    <div className="inspector-top"><span className="site-sigil"><Info size={22}/></span><span className="inspector-kicker">THÔNG TIN ĐỊA ĐIỂM</span></div>
    <h3>Chưa chọn địa điểm</h3><p className="inspector-description">Chọn một điểm đã biết trên bản đồ hoặc trong danh sách.</p>
  </aside>;
  const Icon = glyphs[entity.iconKind as keyof typeof glyphs] ?? Compass;
  const balance = entity.resourceBalance;
  const canShowBalance = Boolean(balance && balance.material && balance.unit && Number.isFinite(balance.remaining) && Number.isFinite(balance.capacity) && (balance.capacity ?? 0) > 0);
  const percent = canShowBalance ? clampPercent((balance!.remaining! / balance!.capacity!) * 100) : null;
  const stale = entity.knowledge === 'remembered' || !entity.currentSight;
  const condition = balance?.remaining === 0 ? 'Mẫu đã cạn' : (balance?.reserved ?? 0) > 0 ? `${balance!.reserved} ${balance!.unit} đang được giữ trong mẫu` : balance?.reachable === false ? 'Mẫu chưa thể tiếp cận' : null;

  return <aside className="panel inspector entity-inspector" role="region" aria-label="Thông tin điểm được chọn" data-entity-id={entity.ref.id} data-knowledge={entity.knowledge}>
    <div className="inspector-top"><span className={`site-sigil sigil-${entity.iconKind}`}><Icon size={22}/></span><span className="inspector-kicker">THÔNG TIN ĐỊA ĐIỂM</span></div>
    <div className="entity-inspector-provenance"><span>{entity.provenance === 'canonical' ? 'ĐIỂM NGUỒN' : entity.provenance === 'modeled' ? 'FIXTURE DỰNG THÊM' : 'ARTWORK MẪU'}</span><span>{entity.knowledge === 'remembered' ? 'ĐÃ GHI NHỚ' : stale ? 'LẦN CUỐI QUAN SÁT' : 'ĐANG QUAN SÁT'}</span></div>
    <h3>{entity.name}</h3>
    <div className="muted-text">{entity.label}</div>
    <div className="inspector-divider"/>
    <div className="detail-line"><span>Trạng thái</span><strong>{stale ? 'Thông tin lần cuối nhìn thấy' : entity.status}</strong></div>
    {entity.lastSeenAt && <div className="detail-line"><span>Quan sát gần nhất</span><strong>{entity.lastSeenAt}</strong></div>}
    {balance && <div className="entity-balance">
      <div className="detail-line"><span>{canShowBalance ? 'Số lượng mẫu' : 'Số lượng'}</span><strong>{canShowBalance ? `${balance.remaining!.toLocaleString('vi-VN')} / ${balance.capacity!.toLocaleString('vi-VN')} ${balance.unit}` : 'Chưa xác định'}</strong></div>
      {canShowBalance && <div className="map-resource-progress" aria-label={`Tiến độ mẫu ${percent}%`}><span style={{ width: `${percent}%` }}/></div>}
      {condition && <p className="entity-condition">{condition}</p>}
      {balance.reachable === false && <p className="entity-condition">Không thể tiếp cận trong fixture này.</p>}
    </div>}
    <p className="inspector-description">{entity.description}</p>
    {entity.actions.map(action => <div className="unavailable-action" key={action.action} title={action.reason}><Info size={15}/>{action.reason}</div>)}
    {entity.provenance !== 'canonical' && <small className="entity-inspector-note">Giá trị chỉ thuộc fixture hiển thị; không phải kho đồ, lượng khai thác hay trạng thái thế giới.</small>}
  </aside>;
}
