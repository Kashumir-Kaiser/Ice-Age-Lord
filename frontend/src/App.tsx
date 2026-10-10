
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Archive, Bell, BookOpen, Box, ChevronRight, Clock3,
  Compass, Crown, Flame, Hammer, Info, Layers, LayoutDashboard, Map as MapIcon,
  Menu, Package, Search, Shield, ShieldCheck, Snowflake, Sparkles, Users, X,
  type LucideIcon,
} from 'lucide-react';
import MapScene from './MapScene';
import { INITIAL_CLOCK_SECONDS, speedMultiplier, advanceDisplayClock, displayClock, displayDay, customMultiplier } from './demoClock';
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

const NAV_ICONS: Record<Screen, LucideIcon> = {
  overview: LayoutDashboard, territory: Crown, map: MapIcon, inventory: Archive,
  forces: Shield, buildings: Hammer, journal: BookOpen,
};
const HEADINGS: Record<Screen, { title: string; description: string }> = {
  overview: { title:'Tổng quan lãnh địa', description:'Cảnh khởi đầu · Đồng bằng Cổ Chiến Trường' },
  territory: { title:'Quản lý lãnh địa', description:'Theo dõi công trình, ưu tiên và các tuyến sinh tồn' },
  map: { title:'Bản đồ thám hiểm', description:'Tọa độ từ gói thế giới LL01; sương mù theo ánh sáng và kiến thức' },
  inventory: { title:'Kho vật phẩm', description:'Thư viện thẻ vật phẩm mẫu · Chưa phải kho của nhân vật' },
  forces: { title:'Quân lực', description:'Sổ đơn vị và hệ thống triệu hoán · Chưa kết nối bộ mô phỏng' },
  buildings: { title:'Kiến trúc', description:'Các công trình đã được xác lập trong thiết lập mở đầu' },
  journal: { title:'Nhật ký thế giới', description:'Trình bày thông tin đã biết, chưa phải lịch sử các lượt chơi' },
};
const CATEGORIES: ('Tất cả' | ItemKind)[] = ['Tất cả', 'Tài nguyên', 'Trang bị', 'Vật phẩm', 'Bản vẽ'];

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
};
function Header({ screen, screens, onMenu, notifications, onNotifications, clockSeconds, speed, changeSpeed, customSpeed, setCustomSpeed }: {
  screens:PlayerView['screens'];
  screen:Screen; onMenu:()=>void; notifications:boolean; onNotifications:()=>void; clockSeconds:number; speed:ClockSpeed; changeSpeed:(speed:ClockSpeed)=>void; customSpeed:number; setCustomSpeed:(speed:number)=>void;
}) {
  const heading = HEADINGS[screen];
  return <header className="topbar">
    <button className="icon-button mobile-menu" aria-label="Mở điều hướng" onClick={onMenu}><Menu size={21}/></button>
    <div className="topbar-heading"><span className="breadcrumb">ICE AGE LORD <ChevronRight size={13}/> {screen==='overview'?'CĂN CỨ':screens.find(s=>s.id===screen)?.name.toUpperCase()}</span><h1>{heading.title}</h1><p>{heading.description}</p></div>
    <div className="topbar-actions">
      <div className="clock-player" aria-label="Đồng hồ mô phỏng">
        <span className="clock-chip" aria-live="off"><Clock3 size={14}/> Ngày {displayDay(clockSeconds)} · {displayClock(clockSeconds)}</span>
        <label className="clock-speed-wrap"><span>Tốc độ</span><select aria-label="Tốc độ thời gian" value={speed} onChange={e=>changeSpeed(e.target.value as ClockSpeed)}>
          <option value="Frozen">Frozen</option><option value="1x">1×</option><option value="2x">2×</option><option value="5x">5×</option><option value="Custom">Tùy chọn</option>
        </select></label>
        {speed==='Custom'&&<label className="custom-clock-wrap"><span>Hệ số</span><input type="number" min=".1" max="3600" step=".1" aria-label="Hệ số tốc độ tùy chọn" value={customSpeed} onChange={e=>setCustomSpeed(customMultiplier(Number(e.target.value)))} /></label>}
        <small className="clock-sim-label">Đồng hồ hiển thị · Không chạy engine</small>
      </div>
      <button className={`icon-button ${notifications?'icon-button--active':''}`} onClick={onNotifications} aria-label="Thông tin bản demo" aria-expanded={notifications}><Bell size={18}/></button>
      <div className="profile-mini" aria-label="Lí Lan — người chơi"><span className="profile-monogram">蘭</span><span className="profile-name">Lí Lan<small>Người chơi</small></span></div>
    </div>
  </header>;
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
          return <button key={nav.id} className={`nav-link ${current===nav.id?'nav-link--active':''}`} onClick={()=>{navigate(nav.id);close();}} aria-current={current===nav.id?'page':undefined}>
            <Icon size={19} strokeWidth={1.8}/><span>{nav.name}<small>{nav.hint}</small></span>{current===nav.id&&<span className="nav-diamond"/>}
          </button>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="weather-box"><Snowflake size={22}/><div><strong>Kỷ nguyên băng phong</strong><span>Không gian sinh tồn khắc nghiệt</span></div></div>
        <div className="sidebar-caption"><span className="signal-dot"/> Frontend prototype v0.1</div>
        <p>Không kết nối save · Không xử lý lượt chơi</p>
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
      <div className="hero-art" aria-hidden="true"><svg viewBox="0 0 470 285" preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id="bannerMount" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#aac8cf" stopOpacity=".48"/><stop offset="1" stopColor="#487486" stopOpacity=".08"/></linearGradient></defs>
        <circle cx="305" cy="90" r="73" fill="none" stroke="#9bc1c7" strokeOpacity=".26"/><circle cx="305" cy="90" r="53" fill="#bed6d4" opacity=".13"/>
        <path d="m0 210 85-90 66 60 90-137 93 119 53-50 83 96v70H0Z" fill="url(#bannerMount)"/>
        <path d="m185 124 56-81 65 85-57-29-22 16Z" fill="#d4e9e8" opacity=".57"/>
        <path d="m0 261 107-51 68 19 100-38 104 18 91 17v60H0Z" fill="#244555" opacity=".95"/>
        <ellipse cx="294" cy="236" rx="82" ry="34" fill="#dfad75" opacity=".08"/>
        <path d="m267 240 32-7m-21 14 25-15" stroke="#95755e" strokeWidth="8" strokeLinecap="round"/>
        <path d="M288 233c-21-18-1-29 0-48 6 17 23 25 13 41 16-14 17-28 15-38 25 36 7 49-19 54Z" fill="#e9a568" opacity=".9"/>
        <path d="M299 235c-10-14-3-24 4-32 7 13 12 23-4 32" fill="#ffe0a1"/>
        <g fill="#a9d2d1" opacity=".53"><circle cx="380" cy="37" r="2"/><circle cx="191" cy="51" r="1.5"/><circle cx="449" cy="74" r="2"/><circle cx="47" cy="58" r="1.5"/><circle cx="357" cy="166" r="2"/></g>
      </svg></div>
    </section>
    <section className="stats-grid" aria-label="Trạng thái khởi đầu">
      <StatCard icon={Clock3} label="Thời gian thế giới" value={`Ngày ${displayDay(clockSeconds)} · ${displayClock(clockSeconds)}`} note="Mốc bắt đầu xác lập" tone="ice"/>
      <StatCard icon={Crown} label="Nhân vật" value="Lí Lan · Cấp 1" note="Thiên phú SSS cố định"/>
      <StatCard icon={ShieldCheck} label="Quân lực khởi đầu" value="0 đơn vị" note="Chưa thực hiện triệu hồi"/>
      <StatCard icon={Layers} label="Dữ liệu mô phỏng" value="Chưa kết nối" note="Bản hiển thị độc lập" tone="warm"/>
    </section>
    <section className="overview-columns">
      <div className="panel map-preview-panel">
        <BlockTitle title="Vùng lãnh địa" eyebrow="BẢN ĐỒ" action={<button className="text-button" onClick={()=>navigate('map')}>Xem toàn màn hình <ChevronRight size={15}/></button>}/>
        <MapScene {...mapProps} compact onClockChange={onClockChange} onOpenFullMap={()=>navigate('map')}/>
        <div className="preview-footer"><span><span className="legend-circle warm"/> Vòng nhiệt theo bán kính nguồn</span><span><span className="legend-circle blue"/> Công trình khởi đầu</span><span className="preview-warning">Địa hình giả lập · Fog mặc định</span></div>
      </div>
      <div className="overview-inspector-desktop"><EntityInspector entity={selectedEntity}/></div>
      <details className="responsive-inspector" open={mapProps.inspectorOpen} onToggle={event=>mapProps.onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
    </section>
    <section className="bottom-cards">
      <div className="panel feature-card"><div className="feature-icon"><Flame size={22}/></div><h3>Sinh tồn đầu tiên</h3><p>Quản lý nguồn nhiệt, lương thực và nơi trú. Có điều khiển tốc độ đồng hồ hiển thị; tiêu hao và cơ chế game vẫn chưa kết nối.</p><button className="text-button" onClick={()=>navigate('territory')}>Xem giao diện lãnh địa <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Sparkles size={22}/></div><h3>SSS · Tử Phục Linh Sư</h3><p>Thiên phú của Lí Lan đã được xác lập. Tử Phục xác thật không đồng nhất với lính Ngôi Mộ.</p><button className="text-button" onClick={()=>navigate('forces')}>Xem hệ thống quân lực <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Box size={22}/></div><h3>Thư viện vật phẩm</h3><p>Khung thẻ, biểu tượng và lọc danh mục có thể thử ngay; dữ liệu sở hữu chưa được nối vào engine.</p><button className="text-button" onClick={()=>navigate('inventory')}>Mở bộ sưu tập mẫu <ChevronRight size={15}/></button></div>
    </section>
  </div>;
}
function MapPage({ selectedEntity, mapProps }: {selectedEntity:EntityView|null;mapProps:MapStateProps}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Map demo · Vị trí đã biết đến từ projection fixture. Ánh sáng, kéo bản đồ và atlas debug không khám phá hoặc thay đổi trạng thái.</span></div>
    <div className="map-page-grid"><div className="panel map-full"><MapScene {...mapProps}/></div><div className="map-page-side">
      <details className="map-inspector-desktop" open><summary>{selectedEntity?.name ?? 'Thông tin điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
      <details className="map-inspector-mobile" open={mapProps.inspectorOpen} onToggle={event=>mapProps.onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
      <details className="panel help-panel"><summary><h3><Compass size={18}/> Cách điều khiển</h3></summary><p>Kéo để di chuyển, cuộn trên mặt bản đồ để thu phóng và dùng các phím mũi tên / cộng trừ khi bản đồ được chọn.</p><p>Chế độ thế giới giữ riêng camera địa phương. Các nút lớp và công cụ xem thử thay đổi hình chiếu; chúng không thực hiện khám phá, khai thác hoặc lưu tiến trình.</p></details>
    </div></div>
  </div>;
}
function Inventory({ items, selectedEntity, selectEntity, inspectorOpen, onInspectorOpenChange }: {items:PlayerView['items'];selectedEntity:EntityView|null;selectEntity:(ref:EntityRef)=>void;inspectorOpen:boolean;onInspectorOpenChange:(open:boolean)=>void}) {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState<'Tất cả'|ItemKind>('Tất cả');
  const filtered=useMemo(()=>items.filter(i=>(category==='Tất cả'||i.kind===category)&&(`${i.name} ${i.note}`.toLowerCase().includes(search.toLowerCase()))),[items,search,category]);
  const selectedItemId=selectedEntity?.ref.type==='item'?selectedEntity.ref.id:null;
  return <div className="page-sections">
    <div className="notice-row"><AlertTriangle size={17}/><span>Toàn bộ thẻ dưới đây là <b>mẫu vật phẩm và artwork</b>, không phải vật phẩm đã nhận. Tồn kho hiện tại chưa được liên kết.</span></div>
    <div className="inventory-layout">
      <section className="panel inventory-list">
        <div className="inventory-toolbar"><div><span className="eyebrow">THƯ VIỆN MINH HỌA</span><h2>Vật phẩm & trang bị</h2></div><div className="search-box"><Search size={17}/><input aria-label="Tìm vật phẩm" placeholder="Tìm vật phẩm..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
        <div className="filter-strip" aria-label="Lọc vật phẩm">{CATEGORIES.map(c=><button key={c} className={category===c?'is-selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="inventory-count">{filtered.length} mẫu được hiển thị <span>· Chưa có dữ liệu số lượng sở hữu</span></div>
        {filtered.length ? <div className="item-grid">{filtered.map(item=><button className={`item-tile ${selectedItemId===item.id?'item-tile--active':''}`} key={item.id} onClick={()=>selectEntity({type:'item',id:item.id})}>
          <div className="item-icon"><ItemArt symbol={item.symbol} size={84}/></div><strong>{item.name}</strong><span>{item.kind}</span>
        </button>)}</div> : <div className="empty-search">Không có mẫu nào khớp bộ lọc.</div>}
      </section>
      <div className="inspector-desktop"><EntityInspector entity={selectedEntity}/></div>
      <details className="responsive-inspector" open={inspectorOpen} onToggle={event=>onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details>
    </div>
  </div>;
}
function Buildings({ sites, selectedEntity, selectEntity, navigate, inspectorOpen, onInspectorOpenChange }: {sites:readonly Site[];selectedEntity:EntityView|null;selectEntity:(ref:EntityRef)=>void;navigate:(v:Screen)=>void;inspectorOpen:boolean;onInspectorOpenChange:(open:boolean)=>void}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Bốn công trình khởi đầu được đặt ở đúng tọa độ LL01 cố định tương đối với ngọn lửa H0. Không có công trình mới được xây.</span></div>
    <div className="building-page-grid"><div className="building-grid">{sites.map(site=><button key={site.id} onClick={()=>selectEntity(site.entityRef)} className={`panel building-card ${sameEntityRef(selectedEntity?.ref,site.entityRef)?'building-card--selected':''}`}>
      <div className="building-thumb"><span className="building-grid-overlay"/><Sigil kind={site.id}/></div>
      <div className="building-info"><span>{site.subtitle}</span><h3>{site.name}</h3><p>{site.status}</p><span className="building-open">Xem chi tiết <ChevronRight size={15}/></span></div>
    </button>)}</div><div><div className="inspector-desktop"><EntityInspector entity={selectedEntity}/></div><details className="responsive-inspector" open={inspectorOpen} onToggle={event=>onInspectorOpenChange(event.currentTarget.open)}><summary>{selectedEntity?.name ?? 'Thông tin địa điểm được chọn'}</summary><EntityInspector entity={selectedEntity}/></details><button className="nav-next" onClick={()=>navigate('map')}>Xem vị trí cố định trên bản đồ <ChevronRight size={17}/></button></div></div>
  </div>;
}
function Forces({ samples }: {samples:PlayerView['forces']}) {
  const icons={shield:Shield,sparkles:Sparkles,users:Users};
  return <div className="page-sections">
    <div className="stats-grid force-stats"><StatCard icon={Shield} label="Đơn vị tại khởi đầu" value="0" note="Không có lực lượng được tạo"/><StatCard icon={Sparkles} label="Thiên phú chính" value="SSS" note="Tử Phục Linh Sư" tone="ice"/><StatCard icon={Activity} label="Đội đang hoạt động" value="Chưa có" note="Không mô phỏng lệnh chiến đấu"/><StatCard icon={Layers} label="Sổ đơn vị" value="Chờ engine" note="ID và XP cần nguồn xác thực" tone="warm"/></div>
    <div className="panel empty-army"><div className="empty-army-illustration"><Shield size={52} strokeWidth={1}/><span>0</span></div><h2>Chưa có đơn vị tại thời điểm khởi đầu</h2><p>Đây là trạng thái mở đầu. Không sử dụng quân lực hoặc nhân vật từ những lần chạy thử trước.</p></div>
    <BlockTitle title="Các kiểu thẻ quân lực sẽ hỗ trợ" eyebrow="BỐ CỤC XEM TRƯỚC"/>
    <div className="sample-force-grid">{samples.map(({icon,title,text})=>{const Icon=icons[icon];return <div className="panel force-sample" key={title}><span className="sample-ribbon">KHÔNG SỞ HỮU</span><Icon size={35} strokeWidth={1.25}/><h3>{title}</h3><p>{text}</p><span className="muted-text">Mẫu cấu trúc hiển thị · Không có unit ID</span></div>;})}</div>
  </div>;
}
function Territory({ navigate, objectives, sites, selectEntity }: {navigate:(s:Screen)=>void;objectives:PlayerView['territoryObjectives'];sites:readonly Site[];selectEntity:(ref:EntityRef)=>void}) {
  const icons={fire:Flame,house:Hammer,tomb:Shield,supply:Box};
  return <div className="page-sections">
    <section className="territory-intro panel"><div><span className="eyebrow">ĐIỂM KHỞI ĐẦU</span><h2>Một ngọn lửa giữa băng nguyên</h2><p>Chức năng này sẽ tập hợp kho vận, dân cư, nhiệt, lịch xây dựng và an ninh lãnh địa. Trong bản xem thử, các thao tác chỉ mở màn hình giới thiệu.</p><DemoLabel subtle/></div><span className="territory-decoration"><Snowflake size={98} strokeWidth={.7}/></span></section>
    <BlockTitle title="Những giao diện ưu tiên" eyebrow="QUẢN LÝ KHỞI ĐẦU"/>
    <div className="territory-objectives">{objectives.map(({id,title,detail},index)=>{const Icon=icons[id];const site=sites.find(value=>value.id===id);return <button className="panel objective-card" key={id} onClick={()=>{if(site)selectEntity(site.entityRef);navigate('buildings');}}>
      <span className="objective-number">0{index+1}</span><span className="objective-icon"><Icon size={26}/></span><span className="objective-copy"><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={20}/></button>;})}</div>
    <div className="panel roadmap-panel"><h3><Layers size={19}/> Kết nối trong các giai đoạn tiếp theo</h3><div className="roadmap-grid"><span>Kho thực tế <small>Chờ dữ liệu trạng thái</small></span><span>Phân công lao động <small>Chờ job scheduler</small></span><span>Đường vận chuyển <small>Chờ tuyến đường thực</small></span><span>Sản xuất & tiêu hao <small>Chờ giao dịch nguyên tử</small></span></div></div>
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
  const [playerView,setPlayerView]=useState<PlayerView>(()=>demoGameClient.getPlayerView());
  const [selection,setSelection]=useState<EntityRef|null>({type:'site',id:'SITE-LL01-000'});
  const [inspectorOpen,setInspectorOpen]=useState(true);
  const [camera,setCamera]=useState<SharedMapCamera>(INITIAL_CAMERA);
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
  };
  const navigate=(next:Screen)=>{setScreen(next);setSidebarOpen(false);};
  useEffect(()=>demoGameClient.subscribe(setPlayerView),[]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key!=='Escape')return;
      setSelection(null);setInspectorOpen(false);setSidebarOpen(false);setNotificationOpen(false);
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
    },180);
    return ()=>clearInterval(interval);
  },[multiplier]);
  return <div className="app-shell">
    <Sidebar current={screen} screens={playerView.screens} navigate={navigate} open={sidebarOpen} close={()=>setSidebarOpen(false)}/>
    <div className="app-main">
      <Header screen={screen} screens={playerView.screens} onMenu={()=>setSidebarOpen(true)} notifications={notificationOpen} onNotifications={()=>setNotificationOpen(v=>!v)} clockSeconds={clockSeconds} speed={speed} changeSpeed={setSpeed} customSpeed={customSpeed} setCustomSpeed={setCustomSpeed}/>
      {notificationOpen && <div className="notification-popover" role="status"><div><Bell size={17}/><strong>Trạng thái bản xem thử</strong><button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setNotificationOpen(false)}><X size={17}/></button></div><p>Chưa kết nối bộ mô phỏng hoặc dữ liệu lưu. Mọi thao tác ở đây chỉ thay đổi màn hình hiển thị.</p></div>}
      <main className="page-content">
        {screen==='overview'&&<Overview selectedEntity={selectedEntity} mapProps={mapProps} navigate={navigate} clockSeconds={clockSeconds} onClockChange={setClockSeconds}/>}
        {screen==='territory'&&<Territory navigate={navigate} objectives={playerView.territoryObjectives} sites={playerView.sites} selectEntity={selectEntity}/>}
        {screen==='map'&&<MapPage selectedEntity={selectedEntity} mapProps={mapProps}/>}
        {screen==='inventory'&&<Inventory items={playerView.items} selectedEntity={selectedEntity} selectEntity={selectEntity} inspectorOpen={inspectorOpen} onInspectorOpenChange={setInspectorOpen}/>}
        {screen==='forces'&&<Forces samples={playerView.forces}/>}
        {screen==='buildings'&&<Buildings sites={playerView.buildings} selectedEntity={selectedEntity} selectEntity={selectEntity} navigate={navigate} inspectorOpen={inspectorOpen} onInspectorOpenChange={setInspectorOpen}/>}
        {screen==='journal'&&<Journal entries={playerView.journal}/>}
      </main>
      <footer className="app-footer"><span><Emblem size={21}/> ICE AGE LORD · FRONTEND PROTOTYPE</span><span>Chế độ demo · Không lưu tiến trình · Không sửa dữ liệu nguồn</span></footer>
    </div>
  </div>;
}
