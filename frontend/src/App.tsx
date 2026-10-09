
import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Archive, Bell, BookOpen, Box, ChevronRight, Clock3,
  Compass, Crown, Flame, Hammer, Info, Layers, LayoutDashboard, Map as MapIcon,
  Menu, Package, Search, Shield, ShieldCheck, Snowflake, Sparkles, Users, X,
  type LucideIcon,
} from 'lucide-react';
import MapScene from './MapScene';
import ItemArt from './ItemArt';
import { itemExamples, mockJournal, screens, sites } from './demoData';
import type { DemoItem, ItemKind, Screen, SiteKind } from './demoData';

const NAV_ICONS: Record<Screen, LucideIcon> = {
  overview: LayoutDashboard, territory: Crown, map: MapIcon, inventory: Archive,
  forces: Shield, buildings: Hammer, journal: BookOpen,
};
const HEADINGS: Record<Screen, { title: string; description: string }> = {
  overview: { title:'Tổng quan lãnh địa', description:'Cảnh khởi đầu · Đồng bằng Cổ Chiến Trường' },
  territory: { title:'Quản lý lãnh địa', description:'Theo dõi công trình, ưu tiên và các tuyến sinh tồn' },
  map: { title:'Bản đồ thám hiểm', description:'Xem bố cục thế giới ở chế độ minh họa, chưa kết nối tọa độ canon' },
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
function SiteInspector({ siteId }: { siteId:SiteKind }) {
  const site = sites.find(s=>s.id===siteId)!;
  return <aside className="panel inspector">
    <div className="inspector-top">
      <Sigil kind={site.id} />
      <span className="inspector-kicker">THÔNG TIN ĐỊA ĐIỂM</span>
    </div>
    <h3>{site.name}</h3>
    <div className="muted-text">{site.subtitle}</div>
    <div className="inspector-divider"/>
    <div className="detail-line"><span>Trạng thái</span><strong>{site.status}</strong></div>
    <div className="detail-line"><span>Vị trí</span><strong>Minh họa</strong></div>
    <p className="inspector-description">{site.description}</p>
    <div className="unavailable-action"><Info size={16}/> Chức năng tương tác đang chờ engine</div>
  </aside>;
}
function Header({ screen, onMenu, notifications, onNotifications }: {
  screen:Screen; onMenu:()=>void; notifications:boolean; onNotifications:()=>void;
}) {
  const heading = HEADINGS[screen];
  return <header className="topbar">
    <button className="icon-button mobile-menu" aria-label="Mở điều hướng" onClick={onMenu}><Menu size={21}/></button>
    <div className="topbar-heading"><span className="breadcrumb">ICE AGE LORD <ChevronRight size={13}/> {screen==='overview'?'CĂN CỨ':screens.find(s=>s.id===screen)?.name.toUpperCase()}</span><h1>{heading.title}</h1><p>{heading.description}</p></div>
    <div className="topbar-actions">
      <span className="clock-chip"><Clock3 size={14}/> T0 · 07:00</span>
      <button className={`icon-button ${notifications?'icon-button--active':''}`} onClick={onNotifications} aria-label="Thông tin bản demo" aria-expanded={notifications}><Bell size={18}/></button>
      <div className="profile-mini" aria-label="Lí Lan — người chơi"><span className="profile-monogram">蘭</span><span className="profile-name">Lí Lan<small>Người chơi</small></span></div>
    </div>
  </header>;
}
function Sidebar({ current, navigate, open, close }: {
  current:Screen; navigate:(screen:Screen)=>void; open:boolean; close:()=>void;
}) {
  return <>
    {open&&<button className="sidebar-backdrop" aria-label="Đóng menu" onClick={close}/>}
    <aside className={`sidebar ${open?'sidebar--open':''}`}>
      <div className="brand-row"><Emblem size={48}/><div><strong>ICE AGE <em>LORD</em></strong><span>BIÊN NIÊN BĂNG PHONG</span></div><button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={close}><X size={18}/></button></div>
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
function Overview({ selected, select, navigate }: {selected:SiteKind;select:(v:SiteKind)=>void;navigate:(v:Screen)=>void}) {
  return <div className="page-sections">
    <section className="hero-banner">
      <div className="hero-orbit hero-orbit-1"/><div className="hero-orbit hero-orbit-2"/>
      <div className="hero-copy"><DemoLabel/><span className="hero-kicker">CHƯƠNG MỞ ĐẦU · T0</span><h2>Từ ngọn lửa nhỏ,<br/><em>đến một lãnh địa.</em></h2>
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
      <StatCard icon={Clock3} label="Thời gian thế giới" value="T0 · 07:00" note="Mốc bắt đầu xác lập" tone="ice"/>
      <StatCard icon={Crown} label="Nhân vật" value="Lí Lan · Cấp 1" note="Thiên phú SSS cố định"/>
      <StatCard icon={ShieldCheck} label="Quân lực khởi đầu" value="0 đơn vị" note="Chưa thực hiện triệu hồi"/>
      <StatCard icon={Layers} label="Dữ liệu mô phỏng" value="Chưa kết nối" note="Bản hiển thị độc lập" tone="warm"/>
    </section>
    <section className="overview-columns">
      <div className="panel map-preview-panel">
        <BlockTitle title="Vùng lãnh địa" eyebrow="BẢN ĐỒ" action={<button className="text-button" onClick={()=>navigate('map')}>Xem toàn màn hình <ChevronRight size={15}/></button>}/>
        <MapScene compact selected={selected} onSelect={select}/>
        <div className="preview-footer"><span><span className="legend-circle warm"/> Lửa Sinh Tồn</span><span><span className="legend-circle blue"/> Công trình khởi đầu</span><span className="preview-warning">Bố cục chỉ để đánh giá hình ảnh</span></div>
      </div>
      <SiteInspector siteId={selected}/>
    </section>
    <section className="bottom-cards">
      <div className="panel feature-card"><div className="feature-icon"><Flame size={22}/></div><h3>Sinh tồn đầu tiên</h3><p>Quản lý nguồn nhiệt, lương thực và nơi trú. Chưa có thao tác thời gian hay tiêu hao trong bản demo.</p><button className="text-button" onClick={()=>navigate('territory')}>Xem giao diện lãnh địa <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Sparkles size={22}/></div><h3>SSS · Tử Phục Linh Sư</h3><p>Thiên phú của Lí Lan đã được xác lập. Tử Phục xác thật không đồng nhất với lính Ngôi Mộ.</p><button className="text-button" onClick={()=>navigate('forces')}>Xem hệ thống quân lực <ChevronRight size={15}/></button></div>
      <div className="panel feature-card"><div className="feature-icon"><Box size={22}/></div><h3>Thư viện vật phẩm</h3><p>Khung thẻ, biểu tượng và lọc danh mục có thể thử ngay; dữ liệu sở hữu chưa được nối vào engine.</p><button className="text-button" onClick={()=>navigate('inventory')}>Mở bộ sưu tập mẫu <ChevronRight size={15}/></button></div>
    </section>
  </div>;
}
function MapPage({ selected, select }: {selected:SiteKind;select:(v:SiteKind)=>void}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Đây là bản đồ diễn họa để duyệt mỹ thuật. Không hiển thị tọa độ thật, địa điểm chưa khám phá hay rương ẩn.</span></div>
    <div className="map-page-grid"><div className="panel map-full"><MapScene selected={selected} onSelect={select}/></div><div className="map-page-side"><SiteInspector siteId={selected}/><div className="panel help-panel"><h3><Compass size={18}/> Cách điều khiển</h3><p>Kéo để di chuyển · Phóng to bằng các nút + / − · Chạm biểu tượng để xem thông tin.</p><p>Chế độ sương mù ở đây chỉ là hiệu ứng thị giác, không đại diện quyền biết của nhân vật.</p></div></div></div>
  </div>;
}
function Inventory({ selected, select }: {selected:string;select:(id:string)=>void}) {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState<'Tất cả'|ItemKind>('Tất cả');
  const filtered=useMemo(()=>itemExamples.filter(i=>(category==='Tất cả'||i.kind===category)&&(`${i.name} ${i.note}`.toLowerCase().includes(search.toLowerCase()))),[search,category]);
  const current=itemExamples.find(i=>i.id===selected)||itemExamples[0];
  return <div className="page-sections">
    <div className="notice-row"><AlertTriangle size={17}/><span>Toàn bộ thẻ dưới đây là <b>mẫu vật phẩm và artwork</b>, không phải vật phẩm đã nhận. Tồn kho hiện tại chưa được liên kết.</span></div>
    <div className="inventory-layout">
      <section className="panel inventory-list">
        <div className="inventory-toolbar"><div><span className="eyebrow">THƯ VIỆN MINH HỌA</span><h2>Vật phẩm & trang bị</h2></div><div className="search-box"><Search size={17}/><input aria-label="Tìm vật phẩm" placeholder="Tìm vật phẩm..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
        <div className="filter-strip" aria-label="Lọc vật phẩm">{CATEGORIES.map(c=><button key={c} className={category===c?'is-selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="inventory-count">{filtered.length} mẫu được hiển thị <span>· Chưa có dữ liệu số lượng sở hữu</span></div>
        {filtered.length ? <div className="item-grid">{filtered.map(item=><button className={`item-tile ${current.id===item.id?'item-tile--active':''}`} key={item.id} onClick={()=>select(item.id)}>
          <div className="item-icon"><ItemArt symbol={item.symbol} size={84}/></div><strong>{item.name}</strong><span>{item.kind}</span>
        </button>)}</div> : <div className="empty-search">Không có mẫu nào khớp bộ lọc.</div>}
      </section>
      <aside className="panel item-detail">
        <span className="eyebrow">CHI TIẾT VẬT PHẨM · MẪU</span>
        <div className="detail-art"><ItemArt symbol={current.symbol} size={168}/></div>
        <span className="item-type">{current.kind} · {current.origin}</span>
        <h2>{current.name}</h2><p className="muted-text">{current.note}</p>
        <div className="inspector-divider"/>
        <div className="detail-line"><span>Trạng thái sở hữu</span><strong>Chưa xác định</strong></div>
        <div className="detail-line"><span>Số lượng</span><strong>—</strong></div>
        <div className="detail-line"><span>Phẩm</span><strong>Chưa có dữ liệu</strong></div>
        <p className="inspector-description">{current.detail}</p>
        <div className="unavailable-action"><Info size={15}/> Các thao tác trang bị / sử dụng chưa kết nối</div>
      </aside>
    </div>
  </div>;
}
function Buildings({ selected, select, navigate }: {selected:SiteKind;select:(id:SiteKind)=>void;navigate:(v:Screen)=>void}) {
  return <div className="page-sections">
    <div className="notice-row"><Info size={17}/><span>Đây là bốn vị trí khởi đầu dùng trong giao diện; vị trí biểu diễn không phải tọa độ thật. Không có công trình mới được xây.</span></div>
    <div className="building-page-grid"><div className="building-grid">{sites.map(site=><button key={site.id} onClick={()=>select(site.id)} className={`panel building-card ${selected===site.id?'building-card--selected':''}`}>
      <div className="building-thumb"><span className="building-grid-overlay"/><Sigil kind={site.id}/></div>
      <div className="building-info"><span>{site.subtitle}</span><h3>{site.name}</h3><p>{site.status}</p><span className="building-open">Xem chi tiết <ChevronRight size={15}/></span></div>
    </button>)}</div><div><SiteInspector siteId={selected}/><button className="nav-next" onClick={()=>navigate('map')}>Xem vị trí mô phỏng trên bản đồ <ChevronRight size={17}/></button></div></div>
  </div>;
}
function Forces() {
  const sample = [{ icon:Shield, title:'Quân Ngôi Mộ', text:'Được tạo thông qua công trình binh chủng, không nhận XP phản chiếu của Tử Phục.' },
    { icon:Sparkles, title:'Tử thi Tử Phục', text:'Chỉ xuất hiện từ xác thật hợp lệ đã được Lí Lan chuyển hóa; danh tính từng đơn vị được bảo toàn.' },
    { icon:Users, title:'Anh hùng', text:'Đơn vị có danh tính, xuất thân và năng lực thực tế; không được phát miễn phí từ khung thẻ.' }];
  return <div className="page-sections">
    <div className="stats-grid force-stats"><StatCard icon={Shield} label="Đơn vị tại T0" value="0" note="Không có lực lượng được tạo"/><StatCard icon={Sparkles} label="Thiên phú chính" value="SSS" note="Tử Phục Linh Sư" tone="ice"/><StatCard icon={Activity} label="Đội đang hoạt động" value="Chưa có" note="Không mô phỏng lệnh chiến đấu"/><StatCard icon={Layers} label="Sổ đơn vị" value="Chờ engine" note="ID và XP cần nguồn xác thực" tone="warm"/></div>
    <div className="panel empty-army"><div className="empty-army-illustration"><Shield size={52} strokeWidth={1}/><span>0</span></div><h2>Chưa có đơn vị tại thời điểm khởi đầu</h2><p>Đây là trạng thái mở đầu T0. Không sử dụng quân lực hoặc nhân vật từ những lần chạy thử trước.</p></div>
    <BlockTitle title="Các kiểu thẻ quân lực sẽ hỗ trợ" eyebrow="BỐ CỤC XEM TRƯỚC"/>
    <div className="sample-force-grid">{sample.map(({icon:Icon,title,text})=><div className="panel force-sample" key={title}><span className="sample-ribbon">KHÔNG SỞ HỮU</span><Icon size={35} strokeWidth={1.25}/><h3>{title}</h3><p>{text}</p><span className="muted-text">Mẫu cấu trúc hiển thị · Không có unit ID</span></div>)}</div>
  </div>;
}
function Territory({ navigate, select }: { navigate:(s:Screen)=>void; select:(id:SiteKind)=>void }) {
  const objectives=[{id:'fire' as SiteKind,title:'Duy trì Lửa Sinh Tồn',detail:'Quản trị nhiên liệu và nhiệt độ sau khi runtime được triển khai.',icon:Flame},
    {id:'house' as SiteKind,title:'Tu sửa Nhà Lãnh Chúa',detail:'Điều kiện gốc: 20 Gỗ và 10 Đá. Chưa thể thực hiện trong demo.',icon:Hammer},
    {id:'tomb' as SiteKind,title:'Quản lý Ngôi Mộ',detail:'Cơ chế sinh quân riêng; không tự động tạo đơn vị ở T0.',icon:Shield}];
  return <div className="page-sections">
    <section className="territory-intro panel"><div><span className="eyebrow">ĐIỂM KHỞI ĐẦU</span><h2>Một ngọn lửa giữa băng nguyên</h2><p>Chức năng này sẽ tập hợp kho vận, dân cư, nhiệt, lịch xây dựng và an ninh lãnh địa. Trong bản xem thử, các thao tác chỉ mở màn hình giới thiệu.</p><DemoLabel subtle/></div><span className="territory-decoration"><Snowflake size={98} strokeWidth={.7}/></span></section>
    <BlockTitle title="Những giao diện ưu tiên" eyebrow="QUẢN LÝ KHỞI ĐẦU"/>
    <div className="territory-objectives">{objectives.map(({id,title,detail,icon:Icon},index)=><button className="panel objective-card" key={id} onClick={()=>{select(id);navigate('buildings');}}>
      <span className="objective-number">0{index+1}</span><span className="objective-icon"><Icon size={26}/></span><span className="objective-copy"><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={20}/></button>)}</div>
    <div className="panel roadmap-panel"><h3><Layers size={19}/> Kết nối trong các giai đoạn tiếp theo</h3><div className="roadmap-grid"><span>Kho thực tế <small>Chờ dữ liệu trạng thái</small></span><span>Phân công lao động <small>Chờ job scheduler</small></span><span>Đường vận chuyển <small>Chờ tuyến đường thực</small></span><span>Sản xuất & tiêu hao <small>Chờ giao dịch nguyên tử</small></span></div></div>
  </div>;
}
function Journal() {
  const [filter,setFilter]=useState('Tất cả');
  const categories=['Tất cả','Bối cảnh','Hệ thống','Giao diện'];
  const events=mockJournal.filter(e=>filter==='Tất cả'||e.category===filter);
  return <div className="page-sections"><div className="notice-row"><Info size={17}/><span>Không có event ledger đang chạy. Những mục bên dưới là thông tin giới thiệu đã xác lập hoặc hướng dẫn giao diện.</span></div>
    <section className="panel journal-panel"><div className="inventory-toolbar"><div><span className="eyebrow">BIÊN NIÊN · BẢN MẪU</span><h2>Thông tin mở đầu</h2></div><div className="filter-strip journal-filter">{categories.map(c=><button className={filter===c?'is-selected':''} onClick={()=>setFilter(c)} key={c}>{c}</button>)}</div></div>
    <div className="timeline">{events.map((e,i)=><article className="timeline-event" key={e.title}><span className="timeline-dot"/><div className="timeline-time">{e.time}<small>{e.category}</small></div><div className="timeline-body"><h3>{e.title}</h3><p>{e.text}</p></div></article>)}</div></section>
  </div>;
}
export default function App() {
  const [screen,setScreen]=useState<Screen>('overview');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [notificationOpen,setNotificationOpen]=useState(false);
  const [selectedSite,setSelectedSite]=useState<SiteKind>('fire');
  const [selectedItem,setSelectedItem]=useState<DemoItem['id']>('wood');
  return <div className="app-shell">
    <Sidebar current={screen} navigate={setScreen} open={sidebarOpen} close={()=>setSidebarOpen(false)}/>
    <div className="app-main">
      <Header screen={screen} onMenu={()=>setSidebarOpen(true)} notifications={notificationOpen} onNotifications={()=>setNotificationOpen(v=>!v)}/>
      {notificationOpen && <div className="notification-popover" role="status"><div><Bell size={17}/><strong>Trạng thái bản xem thử</strong><button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setNotificationOpen(false)}><X size={17}/></button></div><p>Chưa kết nối bộ mô phỏng hoặc dữ liệu lưu. Mọi thao tác ở đây chỉ thay đổi màn hình hiển thị.</p></div>}
      <main className="page-content">
        {screen==='overview'&&<Overview selected={selectedSite} select={setSelectedSite} navigate={setScreen}/>}
        {screen==='territory'&&<Territory navigate={setScreen} select={setSelectedSite}/>}
        {screen==='map'&&<MapPage selected={selectedSite} select={setSelectedSite}/>}
        {screen==='inventory'&&<Inventory selected={selectedItem} select={setSelectedItem}/>}
        {screen==='forces'&&<Forces/>}
        {screen==='buildings'&&<Buildings selected={selectedSite} select={setSelectedSite} navigate={setScreen}/>}
        {screen==='journal'&&<Journal/>}
      </main>
      <footer className="app-footer"><span><Emblem size={21}/> ICE AGE LORD · FRONTEND PROTOTYPE</span><span>Chế độ demo · Không lưu tiến trình · Không sửa dữ liệu nguồn</span></footer>
    </div>
  </div>;
}
