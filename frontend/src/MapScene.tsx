
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Crosshair, Eye, EyeOff, Maximize2, Minus, Plus } from 'lucide-react';
import { sites } from './demoData';
import type { SiteKind } from './demoData';

type Props = {
  selected: SiteKind;
  onSelect: (id: SiteKind) => void;
  compact?: boolean;
};

const TREE_POINTS = Array.from({ length: 38 }, (_, i) => ({
  x: 50 + (i * 83) % 1010,
  y: 78 + (i * 129) % 530,
  scale: 0.58 + ((i * 7) % 8) / 16,
}));
const ROCK_POINTS = Array.from({ length: 34 }, (_, i) => ({
  x: 40 + (i * 157) % 1010,
  y: 48 + (i * 97) % 570,
  size: 4 + (i % 7),
}));

function Terrain() {
  return (
    <>
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#466b77" />
          <stop offset=".45" stopColor="#2a4856" />
          <stop offset="1" stopColor="#152e3c" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#7eacb5" stopOpacity=".25" />
          <stop offset=".5" stopColor="#afcfce" stopOpacity=".72" />
          <stop offset="1" stopColor="#739ba6" stopOpacity=".19" />
        </linearGradient>
        <radialGradient id="fire-glow">
          <stop stopColor="#eec58c" stopOpacity=".55" />
          <stop offset=".6" stopColor="#e2b56d" stopOpacity=".12" />
          <stop offset="1" stopColor="#e2b56d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="snow-layer" x1="0" x2=".7" y1="0" y2="1">
          <stop stopColor="#e1efeb" stopOpacity=".42" />
          <stop offset="1" stopColor="#c3d9db" stopOpacity=".06" />
        </linearGradient>
        <pattern id="map-grid" width="90" height="90" patternUnits="userSpaceOnUse">
          <path d="M90 0H0V90" fill="none" stroke="#b7d0d2" strokeWidth=".55" strokeOpacity=".09" />
        </pattern>
        <pattern id="snow-speckle" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="16" r="1" fill="#d5e9eb" opacity=".25" />
          <circle cx="37" cy="39" r=".7" fill="#e4f3f1" opacity=".17" />
          <path d="m27 9 4-2m7 18 3 1" stroke="#d4e9e8" strokeWidth=".8" opacity=".18" />
        </pattern>
        <symbol id="fir" viewBox="-14 -26 28 49">
          <path d="M0 -26 -12 -7 -7 -7 -14 8 -8 8 -11 19 11 19 8 8 14 8 7 -7 12 -7Z" fill="#112c35" stroke="#6f9699" strokeWidth=".9"/>
          <path d="m0 -25 -8 16M0 -25 8 -9M-10 8 -4 8m7-17 8 17M-7 19H9" fill="none" stroke="#bfdbd9" strokeOpacity=".45" strokeWidth="1.4"/>
        </symbol>
        <mask id="demo-fog">
          <rect width="1100" height="690" fill="white"/>
          <circle cx="548" cy="352" r="275" fill="black"/>
          <circle cx="548" cy="352" r="330" fill="#777"/>
        </mask>
      </defs>
      <rect width="1100" height="690" fill="url(#ground)" />
      <path d="M-90 0H420l-53 62 138 51-141 93 43 107-184 37-189-92Z" fill="#b3cfd1" opacity=".13"/>
      <path d="M410 -40 1170 0 1170 221 1001 183 895 227 711 139 559 164Z" fill="#aacacc" opacity=".1"/>
      <path d="M-30 454 128 411l181 59 137-64 102 85 211-43 217 64 179-6v215H-30Z" fill="#9fbfc5" opacity=".11"/>
      <path d="M-50 148c180-63 273 86 429 37s160-78 294-40 229 14 470-56" fill="none" stroke="#c9dfdc" strokeWidth="38" strokeOpacity=".09"/>
      <path d="M-35 640c193-89 355-9 518-105 188-111 377 19 648-113" fill="none" stroke="#cce0df" strokeWidth="59" strokeOpacity=".08"/>
      <path d="M984-40C916 76 939 159 1045 262s-48 216-16 484" stroke="#b8d8df" strokeWidth="83" strokeOpacity=".17" fill="none"/>
      <path d="M984-40C916 76 939 159 1045 262s-48 216-16 484" stroke="url(#river)" strokeWidth="24" fill="none"/>
      <path d="M-8 534c133-73 246-40 373-73s164-115 280-98 244 123 346 87" fill="none" stroke="#d5e9e1" strokeOpacity=".18" strokeWidth="21" strokeLinecap="round"/>
      <path d="M-8 534c133-73 246-40 373-73s164-115 280-98 244 123 346 87" fill="none" stroke="#d7e7dc" strokeOpacity=".3" strokeWidth="3" strokeDasharray="6 17" strokeLinecap="round"/>
      <path d="M310 267Q426 333 532 350T706 451M532 350Q639 254 754 236" stroke="#b6a58b" strokeWidth="21" strokeOpacity=".09" fill="none"/>
      <path d="M310 267Q426 333 532 350T706 451M532 350Q639 254 754 236" stroke="#d0d6c6" strokeWidth="2.5" strokeDasharray="5 12" strokeOpacity=".38" fill="none"/>
      <path d="M220 70q85 13 150-25m-80 13q40 10 69-14M768 592q80-51 202-45" fill="none" stroke="#e0efeb" strokeOpacity=".21" strokeWidth="3" />
      <g opacity=".48">
        {TREE_POINTS.map((t, i) => {
          const skip = Math.hypot(t.x-532, t.y-348) < 165;
          return skip ? null : <use key={i} href="#fir" x={t.x-14*t.scale} y={t.y-26*t.scale} width={28*t.scale} height={49*t.scale}/>;
        })}
      </g>
      {ROCK_POINTS.map((p, i) => (
        <path key={i} d={`M${p.x-p.size} ${p.y+3} l${p.size*.65} -${p.size} l${p.size*.95} -2 l${p.size*.8} ${p.size+3}Z`} fill="#c1d7d7" fillOpacity=".12" stroke="#a8c7ca" strokeOpacity=".17"/>
      ))}
      <rect width="1100" height="690" fill="url(#snow-speckle)" />
      <rect width="1100" height="690" fill="url(#map-grid)" />
      <ellipse cx="532" cy="348" rx="220" ry="175" fill="url(#fire-glow)" />
      <circle cx="532" cy="348" r="155" fill="none" stroke="#d9c59f" strokeWidth="1.2" strokeDasharray="4 9" opacity=".35" />
    </>
  );
}

function SiteGlyph({ id }: { id: SiteKind }) {
  if (id === 'fire') return (
    <g>
      <path d="m-20 14 36 7M-16 21l35-12" stroke="#6c4840" strokeWidth="8" strokeLinecap="round" />
      <path d="M1 15C-24-1-10-17-2-30 1-13 15-17 10-35 30-13 26 2 7 15Z" fill="#ed9a60" stroke="#fee2b0" strokeWidth="2" />
      <path d="M0 14C-9 4-5-5 3-19c8 14 12 23-3 33" fill="#ffe4a4" />
    </g>
  );
  if (id === 'house') return (
    <g>
      <path d="m-29-1 30-26 30 25v33h-60Z" fill="#6e7d86" stroke="#d2d9d6" strokeWidth="3" />
      <path d="m-37 1 38-34L38 1" fill="none" stroke="#bdd2d0" strokeWidth="10" strokeLinecap="square" />
      <path d="m6-30-12 18 10 7-6 15" stroke="#35454c" strokeWidth="4" fill="none" />
      <rect x="-7" y="11" width="15" height="20" rx="1" fill="#202e37" stroke="#a8b1b0" />
      <path d="m-24 8 11 5m37-7-9 8" stroke="#33474d" strokeWidth="3"/>
    </g>
  );
  if (id === 'tomb') return (
    <g>
      <path d="M-33 30V-5a33 33 0 0 1 66 0v35Z" fill="#445766" stroke="#bac8c6" strokeWidth="3"/>
      <path d="M-22 29V-6a22 22 0 0 1 44 0v35Z" fill="#1d303b" stroke="#748e92" strokeWidth="2"/>
      <path d="M-1-16v33M-13 0h25" stroke="#b6cbc4" strokeWidth="4" opacity=".9"/>
      <path d="M-40 33h80" stroke="#c6d4d1" strokeWidth="5"/>
    </g>
  );
  return (
    <g>
      <path d="M-30-10h60v38h-60Z" fill="#756757" stroke="#c5b196" strokeWidth="3"/>
      <path d="M-32-12 -20-26h41l11 14Z" fill="#a18c71" stroke="#d7bd95" strokeWidth="3"/>
      <path d="M-22-8V27M22-8V27" stroke="#ad9779" strokeWidth="6"/>
      <path d="M-10 4h20v12h-20Z" fill="#bd9b64" stroke="#e6cb93" strokeWidth="2"/>
      <circle cx="0" cy="10" r="3" fill="#2e3e47"/>
    </g>
  );
}

export default function MapScene({ selected, onSelect, compact = false }: Props) {
  const [zoom, setZoom] = useState(1);
  const [cx, setCx] = useState(550);
  const [cy, setCy] = useState(345);
  const [fog, setFog] = useState(false);
  const [labels, setLabels] = useState(true);
  const pointer = useRef<{x:number;y:number;cx:number;cy:number} | null>(null);
  const width = 1100 / zoom;
  const height = 690 / zoom;
  const viewBox = `${cx - width/2} ${cy - height/2} ${width} ${height}`;
  const changeZoom = (step: number) => setZoom(z => Math.min(2.7, Math.max(1, Math.round((z + step)*10)/10)));
  const reset = () => { setZoom(1); setCx(550); setCy(345); };
  const pointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    pointer.current = { x: e.clientX, y: e.clientY, cx, cy };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointer.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCx(Math.max(width/2, Math.min(1100-width/2, pointer.current.cx-(e.clientX-pointer.current.x)*width/rect.width)));
    setCy(Math.max(height/2, Math.min(690-height/2, pointer.current.cy-(e.clientY-pointer.current.y)*height/rect.height)));
  };
  const pointerUp = () => { pointer.current = null; };

  return (
    <div className={`map-scene ${compact ? 'map-scene--compact' : ''}`}>
      <svg className="terrain-svg" viewBox={viewBox} aria-label="Bản đồ minh họa lãnh địa, vị trí không phải tọa độ thật" role="img"
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <Terrain />
        {sites.map(site => (
          <g key={site.id} className={`map-site ${selected===site.id ? 'map-site--selected' : ''}`}
             transform={`translate(${site.x} ${site.y})`} role="button" tabIndex={0}
             aria-label={`Xem ${site.name}`}
             onPointerDown={e => e.stopPropagation()}
             onClick={() => onSelect(site.id)}
             onKeyDown={e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(site.id);} }}>
            <circle r="55" fill={selected===site.id ? '#d9c092' : '#8cb6ba'} opacity={selected===site.id ? '.14':'.06'}/>
            <circle r="46" fill="none" stroke={selected===site.id ? '#e4c99e':'#9ac5c9'} strokeWidth={selected===site.id ? 2:1}
              strokeDasharray={selected===site.id ? 'none':'3 7'} opacity=".75"/>
            <SiteGlyph id={site.id}/>
            {labels && <g transform="translate(0 68)">
              <rect x={-Math.max(51,site.label.length*5.7)} y="-20" rx="6" width={Math.max(102,site.label.length*11.4)} height="31" fill="#0e1d27" opacity=".9" stroke="#8aabad" strokeOpacity=".45"/>
              <text textAnchor="middle" fill="#e6eeea" fontSize="15" fontWeight="600" y="1">{site.label}</text>
            </g>}
          </g>
        ))}
        {fog && <rect width="1100" height="690" fill="#07121b" opacity=".7" mask="url(#demo-fog)" pointerEvents="none"/>}
        <g transform="translate(75 72)" opacity=".82" pointerEvents="none">
          <path d="M0 27V-25m0 0-8 13m8-13 8 13" fill="none" stroke="#e7e8d9" strokeWidth="2"/>
          <text x="0" y="-37" textAnchor="middle" fill="#f2ecdc" fontSize="16" fontWeight="700">B</text>
        </g>
      </svg>
      {!compact && <div className="map-overlay top-left">
        <span className="map-tag">BẢN ĐỒ MINH HỌA</span>
        <strong>Đồng bằng Cổ Chiến Trường</strong>
        <small>Vị trí và địa hình chỉ để duyệt giao diện</small>
      </div>}
      <div className="map-controls" aria-label="Điều khiển bản đồ">
        {!compact && <button title="Ẩn / hiện nhãn" aria-pressed={labels} onClick={() => setLabels(l=>!l)} className={labels?'active':''}><Eye size={16}/></button>}
        {!compact && <button title="Bật / tắt hiệu ứng sương mù mẫu" aria-pressed={fog} onClick={() => setFog(f=>!f)} className={fog?'active':''}>{fog?<EyeOff size={16}/>:<Crosshair size={16}/>}</button>}
        <button title="Thu nhỏ" aria-label="Thu nhỏ" onClick={() => changeZoom(-.3)} disabled={zoom<=1}><Minus size={16}/></button>
        <button title="Phóng to" aria-label="Phóng to" onClick={() => changeZoom(.3)} disabled={zoom>=2.7}><Plus size={16}/></button>
        <button title="Đặt lại vị trí" aria-label="Đặt lại vị trí" onClick={reset}><Maximize2 size={16}/></button>
      </div>
      {!compact && <div className="map-scale">Tỷ lệ minh họa · {Math.round(zoom * 100)}%</div>}
    </div>
  );
}
