import { ArrowRight, Box, ChevronRight, Clock3, Crown, Flame, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PlayerView } from '../../../packages/contracts/src/index.ts';
import MapCanvas from '../rendering/MapCanvas';
import { liveExplorationSnapshot } from '../rendering/MapSceneAdapter';
import type { LiveScreen } from './screens';
import './overview-parity.css';

type Props = { view: PlayerView; onNavigate: (screen: LiveScreen) => void };

function StatCard({ icon: Icon, label, value, note, tone = 'neutral' }: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  tone?: 'neutral' | 'warm' | 'ice';
}) {
  return <article className={`stat-card stat-card--${tone}`}>
    <span className="stat-icon"><Icon size={20} /></span>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>;
}

/**
 * Demo-grade presentation with exclusively server-authoritative values.
 * The real API determines visibility, status, counts, positions and time.
 * The map deliberately does not synthesize unexplored terrain or entities.
 */
export default function LiveOverview({ view, onNavigate }: Props) {
  const fire = view.territory.survivalFire;
  const clock = `Ngày ${view.worldClock.day} · ${String(view.worldClock.hour).padStart(2, '0')}:${String(view.worldClock.minute).padStart(2, '0')}`;
  const structures = view.territory.buildings.filter(building => building.kind !== 'survival_fire');
  const itemCount = view.inventory.containers.reduce((sum, container) => sum + container.items.reduce((items, item) => items + item.quantity, 0), 0);
  const reservedCount = view.inventory.containers.reduce((sum, container) => sum + container.items.reduce((items, item) => items + item.reservedQuantity, 0), 0);
  const activeJobs = view.construction.jobs.filter(job => job.status === 'active' || job.status === 'blocked' || job.status === 'paused').length;
  const heatRadius = Math.max(0, fire.heatRadiusMetres);
  const mapWidth = Math.max(160, heatRadius * 5);
  const mapHeight = mapWidth * 0.55;
  const visualMap = liveExplorationSnapshot(view, view.territory.position, mapWidth, mapHeight);
  const fireRingX = Math.min(49, heatRadius / mapWidth * 100);
  const fireRingY = Math.min(49, heatRadius / mapHeight * 100);

  return <div className="page-sections live-overview" data-testid="live-overview-parity">
    <section className="hero-banner live-overview-hero">
      <div className="hero-orbit hero-orbit-1" aria-hidden="true" />
      <div className="hero-orbit hero-orbit-2" aria-hidden="true" />
      <div className="hero-copy">
        <span className="live-overview-mode"><span className="signal-dot" /> LƯỢT CHƠI ĐANG DIỄN RA</span>
        <span className="hero-kicker">BIÊN NIÊN BĂNG PHONG</span>
        <h2>Từ ngọn lửa nhỏ,<br /><em>đến một lãnh địa.</em></h2>
        <p>{view.player.name} · {view.player.talent.name}. Hành trình sinh tồn bắt đầu từ ngọn lửa đầu tiên.</p>
        <button type="button" className="hero-link" onClick={() => onNavigate('map')}>Khám phá bản đồ <ChevronRight size={18} /></button>
      </div>
      <div className="hero-art hero-art--portrait" aria-hidden="true">
        <img src="/assets/characters/li-lan-t0-portrait.svg?v=20261010" alt="" />
      </div>
    </section>

    <section className="stats-grid" aria-label="Trạng thái lượt chơi hiện tại">
      <StatCard icon={Clock3} label="Thời gian thế giới" value={clock} note={view.clockStatus.catchingUp ? 'Đang cập nhật' : 'Thời gian thế giới'} tone="ice" />
      <StatCard icon={Crown} label="Nhân vật" value={`${view.player.name} · Cấp ${view.player.level}`} note={`Thiên phú ${view.player.talent.grade} · ${view.player.xp} XP`} />
      <StatCard icon={ShieldCheck} label="Quân lực hiện tại" value={`${view.units.length} đơn vị`} note="Lực lượng đang sở hữu" />
      <StatCard icon={Layers} label="Lửa Sinh Tồn" value={`Cấp ${fire.level}`} note={fire.active ? `Vùng nhiệt ${heatRadius} m` : 'Đã tắt'} tone="warm" />
    </section>

    <section className="overview-columns live-overview-columns">
      <div className="panel map-preview-panel live-overview-map-panel">
        <div className="block-title">
          <div><span className="eyebrow">BẢN ĐỒ</span><h2>Vùng lãnh địa</h2></div>
          <button className="text-button" onClick={() => onNavigate('territory')}>Mở lãnh địa <ChevronRight size={15} /></button>
        </div>
        <div className="live-overview-map" data-testid="live-overview-map">
          <MapCanvas snapshot={visualMap} label="Bản đồ vùng lãnh địa từ dữ liệu thật của lượt lưu" />
          <svg className="live-overview-map-heat" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {fire.active && heatRadius > 0 && <ellipse cx="50" cy="50" rx={fireRingX} ry={fireRingY} />}
          </svg>
          <div className="live-overview-fire-marker" aria-hidden="true"><Flame size={21} /></div>
          <span className="live-overview-map-caption">Lửa Sinh Tồn · {fire.active ? 'đang cháy' : 'đã tắt'}</span>
        </div>
        <div className="preview-footer">
          <span><span className="legend-circle warm" /> Vòng nhiệt {heatRadius} m</span>
          <span><span className="legend-circle blue" /> {structures.length} công trình đã ghi nhận</span>
          <span className="preview-warning">Những vùng chưa khám phá vẫn bị che khuất</span>
        </div>
      </div>

      <aside className="panel live-overview-inspector" aria-label="Thông tin lãnh địa">
        <div className="inspector-top">
          <span className="site-sigil sigil-fire"><Flame size={24} /></span>
          <div><span className="inspector-kicker">CÔNG TRÌNH TRUNG TÂM</span><h3>Lửa Sinh Tồn</h3></div>
        </div>
        <p className="muted-text">Trạng thái thực tế của ngọn lửa và các công trình trong lượt chơi.</p>
        <div className="inspector-divider" />
        <div className="detail-line"><span>Cấp hiện tại</span><strong>Cấp {fire.level}</strong></div>
        <div className="detail-line"><span>Trạng thái</span><strong>{fire.active ? 'Đang cháy' : 'Đã tắt'}</strong></div>
        <div className="detail-line"><span>Bán kính nhiệt</span><strong>{heatRadius} m</strong></div>
        <div className="detail-line"><span>Công trình được ghi nhận</span><strong>{structures.length}</strong></div>
        <div className="inspector-divider" />
        <button className="hero-link" onClick={() => onNavigate('territory')}>Quản lý lãnh địa <ChevronRight size={17} /></button>
      </aside>
    </section>

    <section className="bottom-cards">
      <article className="panel feature-card">
        <div className="feature-icon"><Flame size={22} /></div>
        <h3>Sinh tồn đầu tiên</h3>
        <p>Trạng thái lạnh: {view.survival.coldStatus}. {activeJobs} công việc xây dựng đang hoạt động hoặc chờ xử lý.</p>
        <button className="text-button" onClick={() => onNavigate('territory')}>Xem lãnh địa <ChevronRight size={15} /></button>
      </article>
      <article className="panel feature-card">
        <div className="feature-icon"><Sparkles size={22} /></div>
        <h3>{view.player.talent.grade} · {view.player.talent.name}</h3>
        <p>{view.units.length} đơn vị hiện có. Quân lực và cấp độ thay đổi theo hành động đã được máy chủ xác nhận.</p>
        <button className="text-button" onClick={() => onNavigate('forces')}>Xem quân lực <ChevronRight size={15} /></button>
      </article>
      <article className="panel feature-card">
        <div className="feature-icon"><Box size={22} /></div>
        <h3>Kho vật phẩm</h3>
        <p>{itemCount} đơn vị vật phẩm đã ghi nhận, trong đó {reservedCount} được giữ chỗ. Xem từng kho để biết số lượng khả dụng.</p>
        <button className="text-button" onClick={() => onNavigate('inventory')}>Mở kho <ArrowRight size={15} /></button>
      </article>
    </section>
  </div>;
}
