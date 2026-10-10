import { Archive, Box, Compass, Flame, Hammer, Info, Mountain, Shield, TreePine, Users, Waves, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EntityView, UnitGroupView } from '../game/GameClient';

const glyphs = { fire: Flame, house: Hammer, tomb: Shield, supply: Archive, chest: Box, wood: TreePine, stone: Mountain, ore: Mountain, water: Waves, herbs: TreePine, salt: Mountain, site: Compass, shield: Shield, sparkles: Flame, users: Users } as const;
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export default function EntityInspector({ entity, units = [], onOpenSettlement }: { entity: EntityView | null; units?: readonly UnitGroupView[]; onOpenSettlement?:()=>void }) {
  const [harvestOpen,setHarvestOpen]=useState(false);
  const [unitGroupId,setUnitGroupId]=useState('');
  const [portion,setPortion]=useState<'10'|'25'|'50'|'100'|'custom'>('25');
  const [customCount,setCustomCount]=useState(1);
  const livingGroups=units.filter(unit=>unit.alive>0);
  useEffect(()=>{if(!livingGroups.some(unit=>unit.id===unitGroupId))setUnitGroupId(livingGroups[0]?.id??'');},[livingGroups.map(unit=>unit.id).join('|'),unitGroupId]);
  useEffect(()=>setHarvestOpen(false),[entity?.ref.id]);
  if (!entity) return <aside className="panel inspector entity-inspector" role="region" aria-label="Thông tin điểm được chọn">
    <div className="inspector-top"><span className="site-sigil"><Info size={22}/></span><span className="inspector-kicker">THÔNG TIN ĐỊA ĐIỂM</span></div>
    <h3>Chưa chọn địa điểm</h3><p className="inspector-description">Chọn một điểm đã biết trên bản đồ hoặc trong danh sách.</p>
  </aside>;
  const Icon = glyphs[entity.iconKind as keyof typeof glyphs] ?? Compass;
  const balance = entity.resourceBalance;
  const canShowBalance = Boolean(balance && balance.material && balance.unit && Number.isFinite(balance.remaining) && balance.remaining !== null);
  const percent = canShowBalance && Number.isFinite(balance!.capacity) && (balance!.capacity ?? 0) > 0 ? clampPercent((balance!.remaining! / balance!.capacity!) * 100) : null;
  const stale = entity.knowledge === 'remembered' || !entity.currentSight;
  const condition = balance?.remaining === 0 ? 'Mẫu đã cạn' : (balance?.reserved ?? 0) > 0 ? `${balance!.reserved} ${balance!.unit} đang được giữ trong mẫu` : balance?.reachable === false ? 'Mẫu chưa thể tiếp cận' : null;
  const selectedGroup=livingGroups.find(unit=>unit.id===unitGroupId)??livingGroups[0];
  const requestedCount=selectedGroup?(portion==='custom'?Math.max(0,Math.min(selectedGroup.available,customCount)):Math.min(selectedGroup.available,Math.max(1,Math.ceil(selectedGroup.available*Number(portion)/100)))):0;
  const harvestResource=entity.ref.type==='resource'&&Boolean(balance);
  const amountLabel=canShowBalance?`${balance!.remaining!.toLocaleString('vi-VN')}${Number.isFinite(balance!.capacity)?` / ${balance!.capacity!.toLocaleString('vi-VN')}`:''} ${balance!.unit}`:'Chưa xác định';

  return <aside className="panel inspector entity-inspector" role="region" aria-label="Thông tin điểm được chọn" data-entity-id={entity.ref.id} data-knowledge={entity.knowledge}>
    <div className="inspector-top"><span className={`site-sigil sigil-${entity.iconKind}`}><Icon size={22}/></span><span className="inspector-kicker">THÔNG TIN ĐỊA ĐIỂM</span></div>
    <div className="entity-inspector-provenance"><span>{entity.provenance === 'canonical' ? 'THÔNG TIN GỐC' : entity.provenance === 'modeled' ? 'THÔNG TIN ƯỚC TÍNH' : 'HÌNH MINH HỌA'}</span><span>{entity.knowledge === 'remembered' ? 'ĐÃ GHI NHỚ' : stale ? 'LẦN CUỐI QUAN SÁT' : 'ĐANG QUAN SÁT'}</span></div>
    <h3>{entity.name}</h3>
    <div className="muted-text">{entity.label}</div>
    <div className="inspector-divider"/>
    <div className="detail-line"><span>Trạng thái</span><strong>{stale ? 'Thông tin lần cuối nhìn thấy' : entity.status}</strong></div>
    {entity.lastSeenAt && <div className="detail-line"><span>Quan sát gần nhất</span><strong>{entity.lastSeenAt}</strong></div>}
    {balance && <div className="entity-balance">
      <div className="detail-line"><span>{stale?'Lượng lần cuối biết':'Lượng hiển thị'}</span><strong>{amountLabel}</strong></div>
      {percent!==null && <div className="map-resource-progress" aria-label={`Tiến độ mẫu ${percent}%`}><span style={{ width: `${percent}%` }}/></div>}
      {condition && <p className="entity-condition">{condition}</p>}
      {balance.reachable === false && <p className="entity-condition">Chưa thể tiếp cận địa điểm này.</p>}
      {stale&&<p className="entity-condition">Thông tin cũ; cần quan sát lại trước khi xác nhận số lượng.</p>}
      {harvestResource&&<button type="button" className="harvest-plan-button" onClick={()=>setHarvestOpen(true)}>Gửi đơn vị thu hoạch <Users size={15}/></button>}
    </div>}
    <p className="inspector-description">{entity.description}</p>
    {entity.actions.map(action => <div className="unavailable-action" key={action.action} title={action.reason}><Info size={15}/>{action.reason}</div>)}
    {entity.settlementId&&onOpenSettlement&&<button type="button" className="settlement-open-button" onClick={onOpenSettlement}>Mở lãnh địa <Compass size={15}/></button>}
    {entity.provenance !== 'canonical' && <small className="entity-inspector-note">Thông tin này chỉ mang tính tham khảo, chưa xác nhận số lượng hay trạng thái trong thế giới.</small>}
    {harvestOpen&&harvestResource&&<div className="harvest-dialog-backdrop" role="presentation" onClick={event=>{if(event.target===event.currentTarget)setHarvestOpen(false);}}><section className="panel harvest-dialog" role="dialog" aria-modal="true" aria-labelledby="harvest-dialog-title" onKeyDown={event=>{if(event.key==='Escape')setHarvestOpen(false);}}>
      <div className="harvest-dialog-heading"><div><span className="eyebrow">KẾ HOẠCH · CHƯA GỬI LỆNH</span><h2 id="harvest-dialog-title">Thu hoạch {entity.name}</h2></div><button type="button" aria-label="Đóng kế hoạch thu hoạch" onClick={()=>setHarvestOpen(false)}><X size={18}/></button></div>
      <div className="harvest-known-amount"><span>{stale?'Số lượng lần cuối ghi nhận':'Số lượng hiển thị'}</span><strong>{amountLabel}</strong>{entity.lastSeenAt&&<small>Quan sát lúc {entity.lastSeenAt}</small>}</div>
      <label className="harvest-unit-select">Chọn nhóm đơn vị<select value={selectedGroup?.id??''} onChange={event=>setUnitGroupId(event.target.value)} disabled={!livingGroups.length}><option value="">Không có đơn vị đang sống</option>{livingGroups.map(unit=><option value={unit.id} key={unit.id}>{unit.name} · {unit.raceLabel} · {unit.available} có thể điều động</option>)}</select></label>
      <span className="harvest-field-label">Phần lực lượng gửi</span><div className="harvest-portions" role="group" aria-label="Tỷ lệ đơn vị thu hoạch">{(['10','25','50','100'] as const).map(value=><button type="button" key={value} className={portion===value?'is-selected':''} aria-pressed={portion===value} onClick={()=>setPortion(value)} disabled={!selectedGroup}>{value}%</button>)}<button type="button" className={portion==='custom'?'is-selected':''} aria-pressed={portion==='custom'} onClick={()=>setPortion('custom')} disabled={!selectedGroup}>Tùy chỉnh</button></div>
      {portion==='custom'&&<label className="harvest-custom-count">Số đơn vị<input type="number" aria-label="Số đơn vị tùy chỉnh" min={1} max={selectedGroup?.available??1} value={customCount} onChange={event=>setCustomCount(Math.max(1,Number(event.target.value)||1))} disabled={!selectedGroup}/></label>}
      <div className="harvest-quantity-preview">Dự kiến điều động: <b>{requestedCount} {selectedGroup?.name??'đơn vị'}</b></div>
      {!livingGroups.length&&<p className="harvest-dialog-note">Hiện chưa có đơn vị để điều động.</p>}
      {balance!.reachable===false&&<p className="harvest-dialog-note">Chưa thể tiếp cận địa điểm này.</p>}
      {stale&&<p className="harvest-dialog-note">Đây là dữ liệu đã ghi nhớ; cần quan sát lại trước khi gửi yêu cầu thu hoạch.</p>}
      <div className="harvest-dialog-actions"><button type="button" className="harvest-cancel" onClick={()=>setHarvestOpen(false)}>Đóng</button><button type="button" className="harvest-submit" disabled title="Lệnh thu hoạch hiện chưa khả dụng.">Thu hoạch · Chưa khả dụng</button></div>
    </section></div>}
  </aside>;
}
