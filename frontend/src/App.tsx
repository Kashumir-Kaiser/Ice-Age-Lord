
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Archive, Award, Bell, BookOpen, Box, ChevronRight, Clock3,
  Compass, Crown, Flame, Hammer, Info, Layers, LayoutDashboard, Map as MapIcon,
  CalendarDays, Footprints, Gem, Hand, LocateFixed, Menu, Package, Search, Shield, ShieldCheck, Shirt, Snowflake, Sparkles, Sword, UserRound, Users, X,
  type LucideIcon,
} from 'lucide-react';
import MapScene from './MapScene';
import { INITIAL_CLOCK_SECONDS, speedMultiplier, advanceDisplayClock, displayClock, displayDay, customMultiplier, displayUpdateIntervalMs } from './demoClock';
import type { ClockSpeed } from './demoClock';
import ItemArt from './ItemArt';
import type { ItemKind, Screen, Site, SiteKind } from './demoData';
import { demoGameClient } from './game/DemoGameClient';
import type { EntityRef, EntityView, PlayerView, VisibleMap } from './game/GameClient';
import { sameEntityRef } from './game/GameClient';
import { INITIAL_CAMERA } from './map/camera';
import type { SharedMapCamera } from './map/camera';
import EntityInspector from './inspectors/EntityInspector';
import type { Dispatch, SetStateAction } from 'react';
import TerritoryScene from './territory/TerritoryScene';
import type { TerritoryCamera } from './territory/projection';
import type { LayoutDraft } from './game/GameClient';
import type { ReadabilityMode } from './territory/BuildingSprite';
import { livingUnitGroups, visibleRaceFilters } from './game/unitGroups';
import { EventBoard } from './shared/EventBoard';
import { demoEventContracts } from './demoData';
import { CharacterArtwork, CharacterSummary, PageFrame, ScreenHeading } from './shared/PageFrame';

const NAV_ICONS: Record<Screen, LucideIcon> = {
  overview: LayoutDashboard, character: UserRound, territory: Crown, map: MapIcon, inventory: Archive,
  forces: Shield, buildings: Hammer, events: CalendarDays, journal: BookOpen,
};
const HEADINGS: Record<Screen, { title: string; description: string }> = {
  overview: { title:'Tổng quan lãnh địa', description:'Cảnh khởi đầu · Đồng bằng Cổ Chiến Trường' },
  character: { title:'Nhân vật', description:'Trang bị, phụ kiện, thành tựu và danh hiệu của Lí Lan' },
  territory: { title:'Quản lý lãnh địa', description:'Theo dõi công trình, ưu tiên và các tuyến sinh tồn' },
  map: { title:'Bản đồ thám hiểm', description:'Khám phá những vùng đất đã biết; màn sương đổi theo ánh sáng' },
  inventory: { title:'Kho vật phẩm', description:'Thư viện thẻ vật phẩm mẫu · Chưa phải kho của nhân vật' },
  forces: { title:'Quân lực', description:'Theo dõi lực lượng và khả năng triệu hồi' },
  buildings: { title:'Kiến trúc', description:'Các công trình đã được xác lập trong thiết lập mở đầu' },
  events: { title:'Sự kiện thế giới', description:'Lịch hợp đồng và tiến độ mô phỏng sự kiện' },
  journal: { title:'Nhật ký thế giới', description:'Trình bày thông tin đã biết, chưa phải lịch sử các lượt chơi' },
};
const CATEGORIES: ('Tất cả' | ItemKind)[] = ['Tất cả', 'Tài nguyên', 'Trang bị', 'Vật phẩm', 'Bản vẽ'];
const EQUIPMENT_SLOTS: { label:string; icon:LucideIcon }[] = [
  { label:'Mũ', icon:Shield }, { label:'Áo choàng', icon:Shirt }, { label:'Găng tay', icon:Hand },
  { label:'Vũ khí', icon:Sword }, { label:'Tay phụ', icon:ShieldCheck }, { label:'Giày', icon:Footprints },
];
const ACCESSORY_SLOTS: { label:string; icon:LucideIcon }[] = [
  { label:'Nhẫn', icon:Gem }, { label:'Dây chuyền', icon:Gem }, { label:'Bùa hộ mệnh', icon:Sparkles }, { label:'Phụ kiện', icon:Gem },
];

function Emblem({ size=36 }: { size?:number }) {
  return <img src="./crest.svg" width={size} height={size} alt="Biểu tượng Ice Age Lord" />;
}
function DemoLabel({ subtle=false }: { subtle?:boolean }) {
  return <span className={`demo-label ${subtle?'demo-label--muted':''}`}><span className="signal-dot"/> CHẾ ĐỘ XEM THỬ</span>;
}
function BlockTitle({ title, eyebrow, action }: { title:string; eyebrow?:string; action?:React.ReactNode }) {
  return <div className="block-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}
function Sigil({ kind }: { kind:SiteKind }) {
  const Icon = kind==='fire'?Flame:kind==='house'?Crown:kind==='tomb'?Shield:Package;
  return <span className={`site-sigil sigil-${kind}`}><Icon size={22} strokeWidth={1.65}/></span>;
}
type MapStateProps = {
  selectedEntity: EntityRef | null;
  onSelectEntity: (ref:EntityRef)=>void;
  inspectorOpen:boolean;
  onInspectorOpenChange:(open:boolean)=>void;
  clockSeconds:number;
  onClockChange:(seconds:number)=>void;
  visibleMap:VisibleMap;
  camera:SharedMapCamera;
  onCameraChange:Dispatch<SetStateAction<SharedMapCamera>>;
  fireLevel:number;
  onFireLevelChange:(level:number)=>void;
  fireActive:boolean;
  onFireActiveChange:(active:boolean)=>void;
  sourceAtlas:boolean;
  onSourceAtlasChange:(active:boolean)=>void;
  showHeat:boolean;
  onShowHeatChange:(active:boolean)=>void;
  showExploration:boolean;
  onShowExplorationChange:(active:boolean)=>void;
  playerName:string;
  playerPosition:PlayerView['player']['position'];
  followPlayer:boolean;
  onFollowPlayerChange:(active:boolean)=>void;
  onOpenPlayerProfile:()=>void;
};
function Header({ screen, screens, player, onMenu, onOpenPlayerProfile, profileOpen, notifications, onNotifications, clockSeconds, speed, changeSpeed, customSpeed, setCustomSpeed }: {
  screens:PlayerView['screens'];
  player:PlayerView['player']; profileOpen:boolean; onOpenPlayerProfile:()=>void;
  screen:Screen; onMenu:()=>void; notifications:boolean; onNotifications:()=>void; clockSeconds:number; speed:ClockSpeed; changeSpeed:(speed:ClockSpeed)=>void; customSpeed:number; setCustomSpeed:(speed:number)=>void;
}) {
  const heading = HEADINGS[screen];
  return <header className="topbar">
    <button className="icon-button mobile-menu" aria-label="Mở điều hướng" onClick={onMenu}><Menu size={21}/></button>
    <ScreenHeading mode="demo" className="topbar-heading" eyebrow={`ICE AGE LORD · ${screen==='overview'?'CĂN CỨ':screens.find(s=>s.id===screen)?.name.toUpperCase()}`} title={heading.title} description={heading.description}/>
    <div className="topbar-actions">
      <div className="clock-player" aria-label="Đồng hồ trong trò chơi">
        <span className="clock-chip" aria-live="off"><Clock3 size={14}/> Ngày {displayDay(clockSeconds)} · {displayClock(clockSeconds)}</span>
        <label className="clock-speed-wrap"><span>Tốc độ</span><select aria-label="Tốc độ thời gian" value={speed} onChange={e=>changeSpeed(e.target.value as ClockSpeed)}>
          <option value="Frozen">Frozen</option><option value="1x">1×</option><option value="2x">2×</option><option value="5x">5×</option><option value="Custom">Tùy chọn</option>
        </select></label>
        {speed==='Custom'&&<label className="custom-clock-wrap"><span>Hệ số</span><input type="number" min=".1" max="3600" step=".1" aria-label="Hệ số tốc độ tùy chọn" value={customSpeed} onChange={e=>setCustomSpeed(customMultiplier(Number(e.target.value)))} /></label>}
        <small className="clock-sim-label">Đồng hồ hiển thị</small>
      </div>
      <button className={`icon-button ${notifications?'icon-button--active':''}`} onClick={onNotifications} aria-label="Thông tin trò chơi" aria-expanded={notifications}><Bell size={18}/></button>
      <button type="button" className="profile-mini" onClick={onOpenPlayerProfile} aria-haspopup="dialog" aria-expanded={profileOpen} aria-label={`Mở hồ sơ người chơi: ${player.name}`}><img className="profile-portrait" src="/assets/characters/li-lan-t0-portrait.svg?v=20261010" width={38} height={38} alt="Chân dung Lí Lan"/><span className="profile-name">{player.name}<small>Người chơi</small></span></button>
    </div>
  </header>;
}
function PlayerProfile({ player, open, followPlayer, onClose, onFollowChange, onLocate }: {
  player:PlayerView['player']; open:boolean; followPlayer:boolean; onClose:()=>void; onFollowChange:(active:boolean)=>void; onLocate:(view:'territory'|'world')=>void;
}) {
  if(!open)return null;
  return <div className="player-profile-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="player-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="player-profile-title">
      <header className="player-profile-heading"><div><span className="eyebrow">HỒ SƠ NGƯỜI CHƠI</span><h2 id="player-profile-title">Hồ sơ {player.name}</h2></div><button type="button" className="icon-button" aria-label="Đóng hồ sơ" onClick={onClose}><X size={18}/></button></header>
      <div className="player-profile-identity"><img className="player-profile-avatar" src="/assets/characters/li-lan-t0-portrait.svg?v=20261010" width={66} height={66} alt="Chân dung Lí Lan"/><div><h3>{player.name}</h3><p>Lãnh chúa · Cấp {player.level}</p><span className="player-profile-talent"><Sparkles size={14}/> {player.title} · {player.grade}</span></div></div>
      <div className="player-profile-stats" aria-label="Chỉ số hồ sơ">
        <article><span>Tuổi</span><strong>{player.age}</strong></article><article><span>Kinh nghiệm</span><strong>{player.xp.toLocaleString('vi-VN')} XP</strong></article>
        <article><span>Mana</span><strong>{player.mana.current} / {player.mana.max}</strong></article>
      </div>
      <section className="player-profile-follow"><div><strong>Khóa góc nhìn vào người chơi</strong><p>Giữ camera trên Lí Lan khi đổi giữa lãnh địa và bản đồ thế giới. Kéo bản đồ để mở khóa và di chuyển.</p></div>
        <button type="button" className={`player-profile-toggle${followPlayer?' is-active':''}`} aria-pressed={followPlayer} onClick={()=>onFollowChange(!followPlayer)}><LocateFixed size={16}/>{followPlayer?'Đang khóa':'Khóa camera'}</button>
      </section>
      <div className="player-profile-map-actions"><button type="button" onClick={()=>onLocate('territory')}><Crown size={16}/> Định vị ở lãnh địa</button><button type="button" onClick={()=>onLocate('world')}><Compass size={16}/> Định vị trên bản đồ thế giới</button></div>
      <small className="player-profile-note"><UserRound size={13}/> Camera theo vị trí hiện tại của Lí Lan; tính năng này không thay đổi trạng thái thế giới.</small>
    </section>
  </div>;
}
function EquipmentSocket({ label, icon:Icon, accessory=false }: {label:string;icon:LucideIcon;accessory?:boolean}) {
  return <div className={`equipment-socket${accessory?' equipment-socket--accessory':''}`} role="img" aria-label={`${label}: đang trống`}>
    <span className="equipment-socket-icon"><Icon size={accessory?18:20} strokeWidth={1.5}/></span>
    <span className="equipment-socket-copy"><strong>{label}</strong><small>Trống</small></span>
  </div>;
}
function CharacterEquipment({ player }: {player:PlayerView['player']}) {
  const equipmentLeft=EQUIPMENT_SLOTS.slice(0,3);
  const equipmentRight=EQUIPMENT_SLOTS.slice(3);
  return <div className="page-sections character-page">
    <CharacterSummary mode="demo" name={player.name} title={player.title} grade={player.grade} level={player.level} xp={player.xp} mana={player.mana}/>
    <section className="panel character-loadout-panel">
      <div className="character-section-heading"><div><span className="eyebrow">TRANG BỊ NHÂN VẬT</span><h2>Vật phẩm trang bị</h2></div><span className="character-loadout-status">Chưa trang bị vật phẩm</span></div>
      <div className="character-equipment-layout">
        <div className="equipment-socket-column">{equipmentLeft.map(slot=><EquipmentSocket key={slot.label} {...slot}/>)}</div>
        <div className="character-center-column">
          <CharacterArtwork className="character-fullbody-art" name={player.name} />
          <section className="character-accessories" aria-labelledby="character-accessories-title"><h3 id="character-accessories-title">Phụ kiện</h3><div className="character-accessory-row">{ACCESSORY_SLOTS.map(slot=><EquipmentSocket key={slot.label} {...slot} accessory/>)}</div></section>
        </div>
        <div className="equipment-socket-column">{equipmentRight.map(slot=><EquipmentSocket key={slot.label} {...slot}/>)}</div>
      </div>
    </section>
    <div className="character-details-grid">
      <section className="panel character-details-card" aria-labelledby="character-achievements-title"><div className="character-details-heading"><Award size={19}/><div><span className="eyebrow">THÀNH TỰU</span><h2 id="character-achievements-title">Thành tựu đã đạt</h2></div></div><div className="character-empty-state"><Sparkles size={21}/><p>Chưa có thành tựu được ghi nhận.</p></div></section>
      <section className="panel character-details-card" aria-labelledby="character-titles-title"><div className="character-details-heading"><Crown size={19}/><div><span className="eyebrow">DANH HIỆU</span><h2 id="character-titles-title">Danh hiệu của {player.name}</h2></div></div><div className="character-title-card"><span className="character-title-mark"><Sparkles size={17}/></span><div><strong>{player.title}</strong><small>Danh hiệu hiện tại · {player.grade}</small></div><span className="character-title-active">Đang dùng</span></div></section>
    </div>
  </div>;
}
function Sidebar({ current, screens, navigate, open, close }: {
  screens:PlayerView['screens'];
  current:Screen; navigate:(screen:Screen)=>void; open:boolean; close:()=>void;
}) {
  return <>
    {open&&<button className="sidebar-backdrop" aria-label="Đóng menu" onClick={close}/>}
    <aside className={`sidebar ${open?'sidebar--open':''}`}>
      <div className="brand-row"><Emblem size={43}/><div className="brand-copy"><strong>ICE AGE <em>LORD</em></strong><span>BIÊN NIÊN BĂNG PHONG</span></div><button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={close}><X size={18}/></button></div>
      <div className="sidebar-section-label">BẢNG ĐIỀU KHIỂN</div>
      <nav className="sidebar-nav" aria-label="Các mục giao diện">
        {screens.map(nav=>{
          const Icon=NAV_ICONS[nav.id];
          return <button key={nav.id} className={`nav-link ${current===nav.id?'nav-link--active':''}`} title={nav.name} aria-label={nav.name} onClick={()=>{navigate(nav.id);close();}} aria-current={current===nav.id?'page':undefined}>
            <Icon size={19} strokeWidth={1.8}/><span>{nav.name}<small>{nav.hint}</small></span>{current===nav.id&&<span className="nav-diamond"/>}
          </button>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="weather-box"><Snowflake size={22}/><div><strong>Kỷ nguyên băng phong</strong><span>Không gian sinh tồn khắc nghiệt</span></div></div>
        <div className="sidebar-caption"><span className="signal-dot"/> ICE AGE LORD</div>
        <p>Chưa lưu tiến trình · Chưa xử lý lượt chơi</p>
      </div>
    </aside>
  </>;
}
function StatCard({ icon:Icon, label, value, note, tone='neutral' }: {
  icon:LucideIcon; label:string; value:string; note:string; tone?:'neutral'|'warm'|'ice';
}) {
  return <div className={`stat-card stat-card--${tone}`}><div className="stat-icon"><Icon size={20}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function Overview({ selectedEntity, mapProps, navigate, clockSeconds, onClockChange }: {selectedEntity:EntityView|null;mapProps:MapStateProps;navigate:(v:Screen)=>void;clockSeconds:number;onClockChange:(s:number)=>void}) {
  return <div className="page-sections">
    <section className="hero-banner">
      <div className="hero-orbit hero-orbit-1"/><div className="hero-orbit hero-orbit-2"/>
      <div className="hero-copy"><DemoLabel/><span className="hero-kicker">CHƯƠNG MỞ ĐẦU</span><h2>Từ ngọn lửa nhỏ,<br/><em>đến một lãnh địa.</em></h2>
        <p>Trên đồng bằng bị chôn dưới lớp băng, Lí Lan bắt đầu với Lửa Sinh Tồn, Nhà Lãnh Chúa hư hại và Ngôi Mộ cổ xưa.</p>
        <button className="hero-link" onClick={()=>navigate('map')}>Khám phá bản đồ <ChevronRight size={18}/></button>
      </div>
      <div className="hero-art hero-art--portrait" aria-hidden="true"><img src="/assets/characters/li-lan-t0-portrait.svg?v=20261010" alt="" loading="eager"/></div>
    </section>
    <section className="stats-grid" aria-label="Trạng thái khởi đầu">
      <StatCard icon={Clock3} label="Thời gian thế giới" value={`Ngày ${displayDay(clockSeconds)} · ${displayClock(clockSeconds)}`} note="Mốc bắt đầu xác lập" tone="ice"/>
      <StatCard icon={Crown} label="Nhân vật" value="Lí Lan · Cấp 1" note="Thiên phú SSS cố định"/>
      <StatCard icon={ShieldCheck} label="Quân lực khởi đầu" value="0 đơn vị" note="Chưa thực hiện triệu hồi"/>
      <StatCard icon={Layers} label="Dữ liệu mô phỏng" value="Chưa kết nối" note="Bản hiển thị độc lập" tone="warm"/>
    </section>
    <section className="overview-columns">
      <div className="panel map-preview-panel">
        <BlockTitle title="Vùng lãnh địa" eyebrow="BẢN ĐỒ" action={<button className="text-button" onClick={()=>navigate('territory')}>Mở lãnh địa <ChevronRight size={15}/></button>}/>
        <MapScene {...mapProps} compact onClockChange={onClockChange} onOpenFullMap={()=>navigate('territory')}/>
        <div className="preview-footer"><span><span className="legend-circle warm"/> Vòng nhiệt theo bán kính nguồn</span><span><span className="legend-circle blue"/> Công trình khởi đầu</span><span className="preview-warning">Địa hình giả lập · Fog mặc định</span></div>
      </div>
      <div className="overview-inspector-desktop"><EntityInspector entity={selectedEntity}/></div>
      <details className="responsive-inspector" open={mapProps.inspectorOpen} onToggle={event=>mapProps.onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
    </section>
    <section className="bottom-cards">
      <div className="panel feature-card"><div className="feature-icon"><Flame size={22}/></div><h3>Sinh tồn đầu tiên</h3><p>Quản lý nguồn nhiệt, lương thực và nơi trú. Có điều khiển tốc độ đồng hồ hiển thị; tiêu hao và cơ chế game vẫn chưa kết nối.</p><button className="text-button" onClick={()=>navigate('territory')}>Xem giao diện lãnh địa <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Sparkles size={22}/></div><h3>SSS · Tử Phục Linh Sư</h3><p>Thiên phú của Lí Lan đã được xác lập. Tử Phục xác thật không đồng nhất với lính Ngôi Mộ.</p><button className="text-button" onClick={()=>navigate('forces')}>Xem hệ thống quân lực <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Box size={22}/></div><h3>Thư viện vật phẩm</h3><p>Khung thẻ, biểu tượng và bộ lọc danh mục đã sẵn sàng; vật phẩm hiện có sẽ xuất hiện khi dữ liệu được cập nhật.</p><button className="text-button" onClick={()=>navigate('inventory')}>Mở bộ sưu tập mẫu <ChevronRight size={15}/></button></div>
    </section>
  </div>;
}
function MapPage({ selectedEntity, mapProps, onOpenSettlement }: {selectedEntity:EntityView|null;mapProps:MapStateProps;onOpenSettlement:()=>void}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Bản đồ hiển thị những địa điểm đã biết. Ánh sáng và thao tác di chuyển không tự khám phá hay lưu tiến trình.</span></div>
    <div className="map-page-grid"><div className="panel map-full"><MapScene {...mapProps}/></div><div className="map-page-side">
      <details className="map-inspector-desktop" open><summary>{selectedEntity?.name ?? 'Thông tin điểm được chọn'}</summary><EntityInspector entity={selectedEntity} onOpenSettlement={onOpenSettlement}/></details>
      <details className="map-inspector-mobile" open={mapProps.inspectorOpen} onToggle={event=>mapProps.onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin điểm được chọn'}</summary><EntityInspector entity={selectedEntity} onOpenSettlement={onOpenSettlement}/></details>
      <details className="panel help-panel"><summary><h3><Compass size={18}/> Cách điều khiển</h3></summary><p>Kéo để di chuyển, cuộn trên mặt bản đồ để thu phóng và dùng các phím mũi tên / cộng trừ khi bản đồ được chọn.</p><p>Chế độ thế giới giữ riêng góc nhìn địa phương. Các nút lớp và công cụ xem thử chỉ thay đổi cách hiển thị; chúng không thực hiện khám phá, khai thác hoặc lưu tiến trình.</p></details>
    </div></div>
  </div>;
}
function Inventory({ items, selectedEntity, selectEntity, inspectorOpen, onInspectorOpenChange }: {items:PlayerView['items'];selectedEntity:EntityView|null;selectEntity:(ref:EntityRef)=>void;inspectorOpen:boolean;onInspectorOpenChange:(open:boolean)=>void}) {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState<'Tất cả'|ItemKind>('Tất cả');
  const filtered=useMemo(()=>items.filter(i=>(category==='Tất cả'||i.kind===category)&&(`${i.name} ${i.note}`.toLowerCase().includes(search.toLowerCase()))),[items,search,category]);
  const selectedItemId=selectedEntity?.ref.type==='item'?selectedEntity.ref.id:null;
  return <div className="page-sections">
    <div className="notice-row"><AlertTriangle size={17}/><span>Các thẻ dưới đây minh họa vật phẩm và trang bị. Vật phẩm Lí Lan đang sở hữu sẽ xuất hiện tại đây khi có dữ liệu.</span></div>
    <div className="inventory-layout">
      <section className="panel inventory-list">
        <div className="inventory-toolbar"><div><span className="eyebrow">THƯ VIỆN MINH HỌA</span><h2>Vật phẩm & trang bị</h2></div><div className="search-box"><Search size={17}/><input aria-label="Tìm vật phẩm" placeholder="Tìm vật phẩm..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
        <div className="filter-strip" aria-label="Lọc vật phẩm">{CATEGORIES.map(c=><button key={c} className={category===c?'is-selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="inventory-count">{filtered.length} mẫu được hiển thị <span>· Chưa có dữ liệu số lượng sở hữu</span></div>
        {filtered.length ? <div className="item-grid">{filtered.map(item=><button className={`item-tile ${selectedItemId===item.id?'item-tile--active':''}`} key={item.id} onClick={()=>selectEntity({type:'item',id:item.id})}>
          <div className="item-icon"><ItemArt symbol={item.symbol} label={item.name} size={84}/></div><strong>{item.name}</strong><span>{item.kind}</span>
        </button>)}</div> : <div className="empty-search">Không có mẫu nào khớp bộ lọc.</div>}
      </section>
      <div className="inspector-desktop"><EntityInspector entity={selectedEntity}/></div>
      <details className="responsive-inspector" open={inspectorOpen} onToggle={event=>onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
    </div>
  </div>;
}
function Buildings({ sites, selectedEntity, selectEntity, navigate, onFocusBuilding, inspectorOpen, onInspectorOpenChange }: {sites:readonly Site[];selectedEntity:EntityView|null;selectEntity:(ref:EntityRef)=>void;navigate:(v:Screen)=>void;onFocusBuilding:(site:Site)=>void;inspectorOpen:boolean;onInspectorOpenChange:(open:boolean)=>void}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Bốn công trình khởi đầu được bố trí quanh Lửa Sinh Tồn. Chưa có công trình mới được xây.</span></div>
    <div className="building-page-grid"><div className="building-grid">{sites.map(site=><button key={site.id} onClick={()=>selectEntity(site.entityRef)} className={`panel building-card ${sameEntityRef(selectedEntity?.ref,site.entityRef)?'building-card--selected':''}`}>
      <div className="building-thumb"><span className="building-grid-overlay"/><Sigil kind={site.id}/></div>
      <div className="building-info"><span>{site.subtitle}</span><h3>{site.name}</h3><p>{site.status}</p><span className="building-open">Xem chi tiết <ChevronRight size={15}/></span></div>
    </button>)}</div><div><div className="inspector-desktop"><EntityInspector entity={selectedEntity}/></div><details className="responsive-inspector" open={inspectorOpen} onToggle={event=>onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details><button className="nav-next" onClick={()=>{const site=sites.find(item=>sameEntityRef(item.entityRef,selectedEntity?.ref))??sites[0];onFocusBuilding(site);navigate('territory');}}>Đến công trình trong lãnh địa <ChevronRight size={17}/></button></div></div>
  </div>;
}
function Forces({ samples, units }: {samples:PlayerView['forces'];units:PlayerView['units']}) {
  const icons={shield:Shield,sparkles:Sparkles,users:Users};
  const [raceFilter,setRaceFilter]=useState('all');
  const living=livingUnitGroups(units);
  const races=visibleRaceFilters(units);
  const filtered=living.filter(unit=>raceFilter==='all'||unit.raceId===raceFilter);
  useEffect(()=>{if(raceFilter!=='all'&&!races.some(race=>race.id===raceFilter))setRaceFilter('all');},[raceFilter,races.map(race=>race.id).join('|')]);
  const livingCount=living.reduce((sum,unit)=>sum+unit.alive,0);
  return <div className="page-sections">
    <div className="stats-grid force-stats"><StatCard icon={Shield} label="Đơn vị đang sống" value={String(livingCount)} note={livingCount?'Lực lượng hiện có':'Chưa có lực lượng'}/><StatCard icon={Sparkles} label="Thiên phú chính" value="SSS" note="Tử Phục Linh Sư" tone="ice"/><StatCard icon={Activity} label="Đội đang hoạt động" value="Chưa có" note="Chưa có lệnh chiến đấu"/><StatCard icon={Layers} label="Thông tin đơn vị" value="Chưa có" note="Chưa có dữ liệu chi tiết" tone="warm"/></div>
    <section className="panel force-roster" aria-label="Đơn vị đang sống">
      <div className="inventory-toolbar"><div><span className="eyebrow">LỰC LƯỢNG ĐANG SỐNG</span><h2>Đơn vị theo chủng tộc</h2></div><span className="muted-text">{livingCount} đơn vị · {living.length} nhóm</span></div>
      {living.length>0&&<div className="force-race-filter" role="group" aria-label="Lọc đơn vị theo chủng tộc"><button className={raceFilter==='all'?'is-selected':''} aria-pressed={raceFilter==='all'} onClick={()=>setRaceFilter('all')}>Tất cả</button>{races.map(race=><button key={race.id} className={raceFilter===race.id?'is-selected':''} aria-pressed={raceFilter===race.id} onClick={()=>setRaceFilter(race.id)}>{race.label}</button>)}</div>}
      {filtered.length?<div className="force-unit-grid">{filtered.map(unit=><article className="force-unit-card" key={unit.id}><span className="eyebrow">{unit.raceLabel.toUpperCase()}</span><h3>{unit.name}</h3><p>{unit.role}</p><small>{unit.alive} còn sống · {unit.available} có thể điều động</small></article>)}</div>:<div className="empty-army force-empty"><div className="empty-army-illustration"><Shield size={52} strokeWidth={1}/><span>0</span></div><h2>Chưa có đơn vị đang sống</h2><p>Bộ lọc chủng tộc sẽ xuất hiện khi có đơn vị đang sống.</p></div>}
    </section>
    <BlockTitle title="Các kiểu thẻ quân lực sẽ hỗ trợ" eyebrow="BỐ CỤC XEM TRƯỚC"/>
      <div className="sample-force-grid">{samples.map(({icon,title,text,art})=>{const Icon=icons[icon];return <div className="panel force-sample" key={title}><span className="sample-ribbon">HÌNH MINH HỌA · CHƯA SỞ HỮU</span>{art?<img className="force-sample-art" src={art} alt="" aria-hidden="true"/>:<Icon size={35} strokeWidth={1.25}/>}<h3>{title}</h3><p>{text}</p><span className="muted-text">Lực lượng hiện tại: 0</span></div>;})}</div>
  </div>;
}
function Territory({ settlement, placementDefinitions, selectedEntity, units, camera, onCameraChange, drafts, onDraftsChange, focusedBuildingId, onFocusHandled, readability, onReadabilityChange, selectEntity, inspectorOpen, onInspectorOpenChange, player, followPlayer, onFollowPlayerChange, onOpenPlayerProfile }: {
  settlement:PlayerView['settlement'];placementDefinitions:PlayerView['placementDefinitions'];selectedEntity:EntityView|null;units:PlayerView['units'];
  camera:TerritoryCamera|null;onCameraChange:Dispatch<SetStateAction<TerritoryCamera|null>>;drafts:readonly LayoutDraft[];onDraftsChange:Dispatch<SetStateAction<LayoutDraft[]>>;
  focusedBuildingId:string|null;onFocusHandled:()=>void;readability:ReadabilityMode;onReadabilityChange:(mode:ReadabilityMode)=>void;
  selectEntity:(ref:EntityRef)=>void;inspectorOpen:boolean;onInspectorOpenChange:(open:boolean)=>void;
  player:PlayerView['player'];followPlayer:boolean;onFollowPlayerChange:(active:boolean)=>void;onOpenPlayerProfile:()=>void;
}) {
  return <div className="page-sections">
    <div className="notice-row"><Compass size={17}/><span>Lãnh địa hiển thị vị trí khởi đầu của Lí Lan. Bản đồ lớn đánh dấu Lửa Trại; bố trí công trình bên dưới giúp hình dung cách sắp xếp khu vực.</span></div>
    <div className="territory-layout">
      <div className="territory-layout-main"><TerritoryScene settlement={settlement} placementDefinitions={placementDefinitions} camera={camera} onCameraChange={onCameraChange} drafts={drafts} onDraftsChange={onDraftsChange} selectedRef={selectedEntity?.ref??null} onSelectEntity={selectEntity} focusedBuildingId={focusedBuildingId} onFocusHandled={onFocusHandled} readability={readability} onReadabilityChange={onReadabilityChange} playerName={player.name} playerPosition={player.position} followPlayer={followPlayer} onFollowPlayerChange={onFollowPlayerChange} onOpenPlayerProfile={onOpenPlayerProfile}/></div>
      <aside className="territory-layout-side">
        <details className="territory-inspector-details" open={inspectorOpen} onToggle={event=>onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name??'Thông tin công trình hoặc điểm được chọn'}</summary><EntityInspector entity={selectedEntity} units={units}/></details>
        <div className="panel territory-contract-note"><span className="eyebrow">RANH GIỚI DỮ LIỆU</span><h3>Bố trí trong bản xem thử</h3><p>Nguồn cung cấp vị trí và danh tính. Hình footprint hiện là giả định giao diện có phiên bản. Lối vào, vật cản, quyền xây và đơn vị tại chỗ chưa có nguồn xác thực.</p><div><span><Flame size={14}/> {settlement.fireActive?`${settlement.heatRadiusM} m nhiệt thật`:'Lửa tắt'}</span><span><ShieldCheck size={14}/> {settlement.buildings.length} instance đã biết</span></div></div>
      </aside>
    </div>
  </div>;
}
function Journal({ entries }: {entries:PlayerView['journal']}) {
  const [filter,setFilter]=useState('Tất cả');
  const categories=['Tất cả','Bối cảnh','Hệ thống','Giao diện'];
  const events=entries.filter(e=>filter==='Tất cả'||e.category===filter);
  return <div className="page-sections"><div className="notice-row"><Info size={17}/><span>Không có event ledger đang chạy. Những mục bên dưới là thông tin giới thiệu đã xác lập hoặc hướng dẫn giao diện.</span></div>
    <section className="panel journal-panel"><div className="inventory-toolbar"><div><span className="eyebrow">BIÊN NIÊN · BẢN MẪU</span><h2>Thông tin mở đầu</h2></div><div className="filter-strip journal-filter">{categories.map(c=><button className={filter===c?'is-selected':''} onClick={()=>setFilter(c)} key={c}>{c}</button>)}</div></div>
    <div className="timeline">{events.map(e=><article className="timeline-event" key={e.title}><span className="timeline-dot"/><div className="timeline-time">{e.time}<small>{e.category}</small></div><div className="timeline-body"><h3>{e.title}</h3><p>{e.text}</p></div></article>)}</div></section>
  </div>;
}
export default function App() {
  const [screen,setScreen]=useState<Screen>('overview');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [notificationOpen,setNotificationOpen]=useState(false);
  const [playerProfileOpen,setPlayerProfileOpen]=useState(false);
  const [followPlayer,setFollowPlayer]=useState(false);
  const [playerView,setPlayerView]=useState<PlayerView>(()=>demoGameClient.getPlayerView());
  const [selection,setSelection]=useState<EntityRef|null>({type:'site',id:'SITE-LL01-000'});
  const [inspectorOpen,setInspectorOpen]=useState(true);
  const [camera,setCamera]=useState<SharedMapCamera>(INITIAL_CAMERA);
  const [territoryCamera,setTerritoryCamera]=useState<TerritoryCamera|null>(null);
  const [layoutDrafts,setLayoutDrafts]=useState<LayoutDraft[]>([]);
  const [territoryFocusId,setTerritoryFocusId]=useState<string|null>(null);
  const [territoryReadability,setTerritoryReadability]=useState<ReadabilityMode>('normal');
  const [fireLevel,setFireLevel]=useState(1);
  const [fireActive,setFireActive]=useState(true);
  const [sourceAtlas,setSourceAtlas]=useState(false);
  const [showHeat,setShowHeat]=useState(true);
  const [showExploration,setShowExploration]=useState(true);
  const [clockSeconds,setClockSeconds]=useState(INITIAL_CLOCK_SECONDS);
  const [speed,setSpeed]=useState<ClockSpeed>('Frozen');
  const [customSpeed,setCustomSpeed]=useState(10);
  const multiplier=speedMultiplier(speed,customSpeed);
  const mapMinutes=Math.floor((clockSeconds%86400)/60);
  const visibleMap=useMemo(()=>demoGameClient.getVisibleMap({
    clockMinutes:mapMinutes,fireLevel,fireActive,sourceAtlas,
  }),[mapMinutes,fireLevel,fireActive,sourceAtlas]);
  const selectedEntity=selection
    ? visibleMap.entities.find(entity=>sameEntityRef(entity.ref,selection)) ?? demoGameClient.inspectEntity(selection)
    : null;
  const selectEntity=(ref:EntityRef)=>{setSelection(ref);setInspectorOpen(true);};
  const mapProps:MapStateProps={
    selectedEntity:selection,onSelectEntity:selectEntity,inspectorOpen,onInspectorOpenChange:setInspectorOpen,clockSeconds,onClockChange:setClockSeconds,
    visibleMap,camera,onCameraChange:setCamera,fireLevel,onFireLevelChange:setFireLevel,
    fireActive,onFireActiveChange:setFireActive,sourceAtlas,onSourceAtlasChange:setSourceAtlas,
    showHeat,onShowHeatChange:setShowHeat,showExploration,onShowExplorationChange:setShowExploration,
    playerName:playerView.player.name,playerPosition:playerView.player.position,followPlayer,onFollowPlayerChange:setFollowPlayer,onOpenPlayerProfile:()=>setPlayerProfileOpen(true),
  };
  const navigate=(next:Screen)=>{setScreen(next);setSidebarOpen(false);};
  const locatePlayer=(view:'territory'|'world')=>{
    const position=playerView.player.position;
    setFollowPlayer(true);setPlayerProfileOpen(false);
    if(view==='world'){
      setCamera(previous=>({...previous,mode:'world',world:{...previous.world,x:position.x,y:-position.y}}));
      navigate('map');
    }else{
      setTerritoryCamera(previous=>({x:position.x,y:position.y,zoom:Math.max(.78,previous?.zoom??.78)}));
      navigate('territory');
    }
  };
  const focusBuilding=(site:Site)=>{selectEntity(site.entityRef);setTerritoryFocusId(site.entityRef.id);};
  const handleTerritoryFocusHandled=()=>setTerritoryFocusId(null);
  useEffect(()=>demoGameClient.subscribe(setPlayerView),[]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key!=='Escape')return;
      setSelection(null);setInspectorOpen(false);setSidebarOpen(false);setNotificationOpen(false);setPlayerProfileOpen(false);
    };
    window.addEventListener('keydown',onKeyDown);
    return()=>window.removeEventListener('keydown',onKeyDown);
  },[]);
  useEffect(()=>{
    if(multiplier===0)return;
    let last=performance.now();
    const interval=setInterval(()=>{
      const now=performance.now();
      setClockSeconds(previous=>advanceDisplayClock(previous,now-last,multiplier));
      last=now;
    },displayUpdateIntervalMs(multiplier));
    return ()=>clearInterval(interval);
  },[multiplier]);
  return <div className="app-shell">
    <Sidebar current={screen} screens={playerView.screens} navigate={navigate} open={sidebarOpen} close={()=>setSidebarOpen(false)}/>
    <div className="app-main">
      <Header screen={screen} screens={playerView.screens} player={playerView.player} profileOpen={playerProfileOpen} onOpenPlayerProfile={()=>setPlayerProfileOpen(true)} onMenu={()=>setSidebarOpen(true)} notifications={notificationOpen} onNotifications={()=>setNotificationOpen(v=>!v)} clockSeconds={clockSeconds} speed={speed} changeSpeed={setSpeed} customSpeed={customSpeed} setCustomSpeed={setCustomSpeed}/>
      <PlayerProfile player={playerView.player} open={playerProfileOpen} followPlayer={followPlayer} onClose={()=>setPlayerProfileOpen(false)} onFollowChange={setFollowPlayer} onLocate={locatePlayer}/>
      {notificationOpen && <div className="notification-popover" role="status"><div><Bell size={17}/><strong>Trạng thái trò chơi</strong><button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setNotificationOpen(false)}><X size={17}/></button></div><p>Lượt chơi chưa được lưu. Các thao tác hiện tại chỉ thay đổi cách xem.</p></div>}
      <main className="page-content">
        <PageFrame mode="demo" className={`demo-screen demo-screen--${screen}`}>
          {screen==='overview'&&<Overview selectedEntity={selectedEntity} mapProps={mapProps} navigate={navigate} clockSeconds={clockSeconds} onClockChange={setClockSeconds}/>}
          {screen==='character'&&<CharacterEquipment player={playerView.player}/>}
          {screen==='territory'&&<Territory settlement={playerView.settlement} placementDefinitions={playerView.placementDefinitions} selectedEntity={selectedEntity} units={playerView.units} camera={territoryCamera} onCameraChange={setTerritoryCamera} drafts={layoutDrafts} onDraftsChange={setLayoutDrafts} focusedBuildingId={territoryFocusId} onFocusHandled={handleTerritoryFocusHandled} readability={territoryReadability} onReadabilityChange={setTerritoryReadability} selectEntity={selectEntity} inspectorOpen={inspectorOpen} onInspectorOpenChange={setInspectorOpen} player={playerView.player} followPlayer={followPlayer} onFollowPlayerChange={setFollowPlayer} onOpenPlayerProfile={()=>setPlayerProfileOpen(true)}/>}
          {screen==='map'&&<MapPage selectedEntity={selectedEntity} mapProps={mapProps} onOpenSettlement={()=>navigate('territory')}/>}
          {screen==='inventory'&&<Inventory items={playerView.items} selectedEntity={selectedEntity} selectEntity={selectEntity} inspectorOpen={inspectorOpen} onInspectorOpenChange={setInspectorOpen}/>}
          {screen==='forces'&&<Forces samples={playerView.forces} units={playerView.units}/>}
          {screen==='buildings'&&<Buildings sites={playerView.buildings} selectedEntity={selectedEntity} selectEntity={selectEntity} navigate={navigate} onFocusBuilding={focusBuilding} inspectorOpen={inspectorOpen} onInspectorOpenChange={setInspectorOpen}/>}
          {screen==='events'&&<EventBoard mode="demo" events={demoEventContracts} nowElapsedMs={clockSeconds*1000} formatTime={elapsedMs=>elapsedMs===null?'—':`T+${Math.floor(elapsedMs/3_600_000)}h${String(Math.floor((elapsedMs%3_600_000)/60_000)).padStart(2,'0')}`}/>}
          {screen==='journal'&&<Journal entries={playerView.journal}/>}
        </PageFrame>
      </main>
      <footer className="app-footer"><span><Emblem size={21}/> ICE AGE LORD</span><span>Bản xem thử · Không lưu tiến trình</span></footer>
    </div>
  </div>;
}
