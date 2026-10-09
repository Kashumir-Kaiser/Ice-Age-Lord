import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { ArrowDownRight, Compass, Eye, EyeOff, Maximize2, Minus, Plus, Snowflake, Sun, Moon, ThermometerSun, MapPinned } from 'lucide-react';
import { sites } from './demoData';
import type { SiteKind } from './demoData';
import {
  dayOverlayOpacity, dayPhase, DEMO_CAMP, DEMO_SURVEYED, displayRemaining, fireForm,
  formatClock, formatDistance, heatRadiusM, OPENING_OBSERVED, visibleDemoMarkers,
} from './mapModel';
import './map-refinement.css';

type Props = { selected: SiteKind; onSelect: (id: SiteKind) => void; compact?: boolean };
const TIMES = [420, 720, 990, 1005, 1140, 60] as const;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 16, 21, 26, 30] as const;
const FIRST_SITES = sites.map(site=>({...site,renderY:-site.y}));
const PINE_FIELD=Array.from({length:480},(_,i)=>({
  x:((i*167+13)%1900)-950,
  y:((i*271+47)%1580)-790,
  size:3.8+(i%6)*1.35,
  spin:(i%7)-3,
}));
const SERRATED_ROCKS=Array.from({length:220},(_,i)=>({
  x:((i*389+71)%2260)-1130,
  y:((i*227+21)%1860)-930,
  size:3+(i%5)*1.4,
}));
const SNOW_PARTICLES=Array.from({length:44},(_,i)=>({
  x:((i*131+37)%900)-450,
  y:((i*179+13)%650)-325,
  r: i%4===0 ? 1.3:.75,
  delay: (i%15)*-.55,
}));
const LOCALLY_CLEARED_RADIUS = 40; // Decorative empty-space arrangement, not a gameplay rule.

function Terrain({id}: {id:string}) {
  return <>
    <defs>
      <linearGradient id={`${id}-ice`} x1="0" y1="0" x2="0.8" y2="1">
        <stop stopColor="#708e9a"/><stop offset=".25" stopColor="#436777"/>
        <stop offset=".72" stopColor="#2b4e61"/><stop offset="1" stopColor="#142d3b"/>
      </linearGradient>
      <radialGradient id={`${id}-snowfield`}>
        <stop stopColor="#d9e9e7" stopOpacity=".55"/><stop offset=".55" stopColor="#b2d1cf" stopOpacity=".14"/>
        <stop offset="1" stopColor="#b3d1d0" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id={`${id}-ridge`} x1=".1" y1="0" x2=".9" y2="1">
        <stop stopColor="#d4e7e4" stopOpacity=".6"/><stop offset=".22" stopColor="#8faeb4" stopOpacity=".6"/>
        <stop offset=".5" stopColor="#3d6677" stopOpacity=".58"/><stop offset="1" stopColor="#183547" stopOpacity=".8"/>
      </linearGradient>
      <pattern id={`${id}-frost`} width="38" height="38" patternUnits="userSpaceOnUse">
        <path d="m4 7 6-3m14 20 3-5m-1-13 2 4M7 31l5 1" stroke="#e3f0ed" strokeOpacity=".13" strokeWidth=".65"/>
        <circle cx="16" cy="11" r=".72" fill="#e5f3f2" opacity=".25"/>
      </pattern>
      <pattern id={`${id}-contour`} width="170" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
        <path d="M-40 32q85-63 184 0t150 0M-40 67q85-63 184 0t150 0M-40 102q85-63 184 0t150 0" fill="none" stroke="#cbdfdf" strokeOpacity=".045" strokeWidth="1.7"/>
      </pattern>
    </defs>
    <rect x="-96000" y="-96000" width="192000" height="192000" fill="#132d3d"/>
    <rect x="-96000" y="-96000" width="192000" height="192000" fill={`url(#${id}-ice)`}/>
    <g opacity=".85">
      <path d="M-1450-330-1090-700-868-470-550-790-291-392-108-530 240-274 490-480 745-210 1180-510 1600-125V850H-1450Z" fill="#1b3e51" opacity=".34"/>
      <path d="m-1320-280 235-430 188 245 332-360 270 393 150-180 310 270 195-240 220 265 390-110 260 266" fill="none" stroke="#9dc1c3" strokeWidth="12" strokeOpacity=".18"/>
      <path d="M-1180-620-980-920-735-600-560-980-266-556-97-717 220-385 451-794 706-455 932-803 1255-489 1470-612V500H-1180Z" fill={`url(#${id}-ridge)`} opacity=".31"/>
      <path d="m-980-920 122 197-110-83-92 80m500-254 132 207-115-93-111 85m1105-13 83 154-79-72-66 70" fill="none" stroke="#e5f2ec" strokeOpacity=".26" strokeWidth="11"/>
    </g>
    <g opacity=".63">
      <ellipse cx="-142" cy="-34" rx="265" ry="142" fill={`url(#${id}-snowfield)`} transform="rotate(-21 -142 -34)"/>
      <ellipse cx="271" cy="106" rx="225" ry="168" fill={`url(#${id}-snowfield)`}/>
      <ellipse cx="-380" cy="200" rx="283" ry="188" fill={`url(#${id}-snowfield)`}/>
      <path d="M-900 148q242-161 394-56t274-96q176-190 420-94 216 79 387-68" fill="none" stroke="#d4e8e5" strokeWidth="110" strokeOpacity=".05"/>
      <path d="M-930 401q190-151 393-111t351-60 331 12q198 112 524-29" fill="none" stroke="#c3e1e0" strokeWidth="70" strokeOpacity=".06"/>
    </g>
    <g opacity=".68">
      <path d="M-1160-316C-873-188-802-322-645-253s182 167 381 154S96-192 216-75 461 191 785 150" fill="none" stroke="#081f30" strokeWidth="54" strokeOpacity=".36"/>
      <path d="M-1160-316C-873-188-802-322-645-253s182 167 381 154S96-192 216-75 461 191 785 150" fill="none" stroke="#7eaab4" strokeWidth="22" strokeOpacity=".31"/>
      <path d="M-1070 170Q-675 300-519 117t343 97 517-68Q564 73 896 218" fill="none" stroke="#d0e6e1" strokeWidth="15" strokeOpacity=".14"/>
      <path d="M-740-170C-470-400-355-195-202-262S117-362 302-291" stroke="#cde4df" strokeWidth="23" strokeOpacity=".1" fill="none"/>
    </g>
    <g fill="none" strokeLinecap="round">
      <path d="M-560 10q89-80 180-71 117 17 185-34 92-73 180 27t151 31" stroke="#d8e9e6" strokeWidth="2.8" strokeOpacity=".17"/>
      <path d="M-560 27q89-80 180-71 117 17 185-34 92-73 180 27t151 31" stroke="#d8e9e6" strokeWidth="1.4" strokeOpacity=".14"/>
      <path d="M-440 309Q-199 154-36 271t333-26 396 29" stroke="#d8e9e6" strokeWidth="2" strokeOpacity=".17"/>
      <path d="m-194-212 45 52-15 20 37 36m24 123 41-28 13 45 29-11m350-112-55 31 22 37-62 22" stroke="#e5efed" strokeWidth="2" strokeOpacity=".15"/>
    </g>
    {/* Environmental silhouettes: sample biomes remain behind the knowledge fog. */}
    <g opacity=".64" aria-hidden="true" pointerEvents="none">
      <ellipse cx="-126" cy="-48" rx="62" ry="48" fill="#092c36" opacity=".38"/>
      <ellipse cx="-126" cy="-48" rx="52" ry="35" fill="#5d858b" opacity=".19"/>
      {Array.from({length:24},(_,i)=>{
        const angle=i*2.39996,dist=16+(i%5)*9;
        const px=-126+Math.cos(angle)*dist,py=-48+Math.sin(angle)*dist;
        return <g key={i} transform={`translate(${px} ${py}) scale(.75)`}>
          <path d="m0-19-9 14h4l-8 10 6-1-8 13h30L7 4l6 1-8-10h4Z" fill="#18424b" stroke="#adcbd0" strokeWidth="1.2" />
          <path d="M0-19-4-10m-7 15 9-3m-10 15 10-3" stroke="#d3e8e0" strokeWidth="2" opacity=".8"/>
        </g>;
      })}
      <path d="M78-88q56-49 95-8l41 45-14 41-86 8-48-29Z" fill="#172e3d" stroke="#96b6c1" strokeWidth="3" opacity=".75"/>
      <path d="m78-88 39 57 56-65m-56 65 83 21m-83-21-51 0m51 0 23 21" fill="none" stroke="#d8e9e8" strokeWidth="3" opacity=".36"/>
      <path d="m-350-112 36-33 31 12 23 49-13 35-58-5-43-28Z" fill="#315465" stroke="#8ec4ce" strokeWidth="3"/>
      <path d="m-314-145 7 54 24-42m-24 42-24 37m24-37 47 7" stroke="#a2dce3" strokeWidth="4" opacity=".58"/>
      <ellipse cx="74" cy="115" rx="89" ry="48" fill="#163948" stroke="#a6d4dc" strokeWidth="4" opacity=".58"/>
      <ellipse cx="76" cy="112" rx="64" ry="30" fill="#8fbbcd" opacity=".38"/>
      <path d="m19 100 58 9 35-16m-35 16-11 27m11-27 26 17" fill="none" stroke="#e7f7f3" strokeWidth="2.2" opacity=".53"/>
      {Array.from({length:10},(_,i)=><path key={i} d={`m${27+(i*9)%55} ${90+(i*7)%48} -4 -8 7 3`} stroke="#a7cfb3" strokeWidth="1.7" fill="none"/>)}
    </g>
    <g opacity=".92">{PINE_FIELD.map((tree,i)=>Math.hypot(tree.x,tree.y)<LOCALLY_CLEARED_RADIUS+20?null:
      <g key={i} transform={`translate(${tree.x} ${tree.y}) rotate(${tree.spin}) scale(${tree.size/10})`}>
        <ellipse cx="7" cy="6" rx="15" ry="7" fill="#091c29" opacity=".42"/>
        <path d="M0-20-13-2l6-1-12 17 14-3-7 17h24l-7-17 14 3L7-3l6 1Z" fill="#163945" stroke="#7096a2" strokeOpacity=".65" strokeWidth="1.5"/>
        <path d="M0-20-6-9l9-4m-16 16 14-4m-12 11 16-4m-12 15 11-3" stroke="#d0e4df" strokeOpacity=".76" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      </g>)}</g>
    <g>{SERRATED_ROCKS.map((rock,i)=> Math.hypot(rock.x,rock.y)<35?null:<g key={i} transform={`translate(${rock.x} ${rock.y})`}>
      <ellipse cx="4" cy="3" rx={rock.size*1.4} ry={rock.size*.65} fill="#081a26" opacity=".45"/>
      <path d={`M${-rock.size} ${rock.size*.5} l${rock.size*.6} -${rock.size*1.3} ${rock.size*.9} -${rock.size*.7} ${rock.size*.9} ${rock.size*.7} ${rock.size*.35} ${rock.size*1.3}Z`} fill="#3c6071" stroke="#a4c6c7" strokeOpacity=".47" strokeWidth="1"/>
      <path d={`M${-rock.size} ${rock.size*.5} l${rock.size*.6} -${rock.size*1.3} ${rock.size*.9} -${rock.size*.7}`} stroke="#e3eeee" strokeOpacity=".41" strokeWidth="2" fill="none"/>
    </g>)}</g>
    <rect x="-1200" y="-1200" width="2400" height="2400" fill={`url(#${id}-contour)`}/>
    <rect x="-1200" y="-1200" width="2400" height="2400" fill={`url(#${id}-frost)`}/>
    <g fill="none">
      <path d="M-53-14 0 0 26-12 50-8m-29 20L0 0l-21 23" stroke="#ccdbd5" strokeOpacity=".1" strokeWidth="6"/>
      <path d="M-53-14 0 0 26-12 50-8m-29 20L0 0l-21 23" stroke="#dbe9e3" strokeOpacity=".27" strokeWidth="1.6" strokeDasharray="2.2 7"/>
      <circle r="46" stroke="#d4dfd8" strokeOpacity=".07" strokeWidth="2"/>
    </g>
  </>;
}
function MarkerGraphic({kind}:{kind:string}) {
  if(kind==='fire') return <g><path d="m-11 10 22 0m-19 4 16-6" stroke="#7b5142" strokeWidth="4" strokeLinecap="round"/><path d="M-1 12C-19-1-3-14-2-22 0-12 10-13 9-23c13 16 10 25-2 35Z" fill="#eaa05d" stroke="#ffe3a3" strokeWidth="1.5"/><path d="M1 10Q-5 0 3-11Q12 2 1 10" fill="#fff0b4"/></g>;
  if(kind==='house') return <g><path d="m-15-1 15-13L15-1v17h-30Z" fill="#617b84" stroke="#d4e1dd" strokeWidth="1.5"/><path d="M-19 1 0-18 19 1" fill="none" stroke="#d7e9e3" strokeWidth="4"/><path d="M-4 16V4h8v12M6-11l-8 8 5 5-3 6" fill="none" stroke="#2a404b" strokeWidth="2.5"/></g>;
  if(kind==='tomb') return <g><path d="M-15 17V-2a15 15 0 0 1 30 0v19Z" fill="#465b6c" stroke="#c7d7d9" strokeWidth="2"/><path d="M-8 16V-2a8 8 0 0 1 16 0v18Z" fill="#1b3140"/><path d="M0-8V10M-7 0h14" stroke="#bdd6d8" strokeWidth="2.5"/><path d="M-19 19h38" stroke="#c1d8d6" strokeWidth="3"/></g>;
  if(kind==='supply'||kind==='chest') return <g><rect x="-15" y="-9" width="30" height="24" rx="2" fill="#785a43" stroke="#ead09f" strokeWidth="2"/><path d="M-16-8Q-14-22 0-22T16-8Z" fill="#b18b5c" stroke="#e8d39f" strokeWidth="2"/><path d="M-10-9v24M10-9v24M-15 0h30" stroke="#d5b17a" strokeWidth="3"/><rect x="-3" y="-3" width="6" height="10" fill="#ffe1a1" stroke="#926b45"/></g>;
  if(kind==='wood') return <g><path d="m0-20-13 18h6L-16 9h9l-5 10h24L7 9h9L7-2h6Z" fill="#305a4f" stroke="#b3d4bd" strokeWidth="2"/><path d="M0-20V19m-10-9 10-9 10 9" fill="none" stroke="#d9eee0" strokeWidth="2"/></g>;
  if(kind==='stone') return <g><path d="m-18 15 7-21L0-19 11-9 19 15Z" fill="#7895a2" stroke="#e0eeea" strokeWidth="2"/><path d="M0-19-2 5l-16 10m16-10 21 10M-11-6 9-7" fill="none" stroke="#b5d4d5" strokeWidth="2"/></g>;
  if(kind==='ore') return <g><path d="m-18 13 8-24 12-11 15 15 4 20Z" fill="#516a79" stroke="#a6ccd4" strokeWidth="2"/><path d="m-10-11 12 13v-24m0 24 15-9M2 2l-1 11" stroke="#84d4e4" strokeWidth="3"/><path d="m-2-4 7 8" stroke="#d1f3ef" strokeWidth="3"/></g>;
  if(kind==='herbs') return <g><path d="M0 18V-13m0 24q-12-3-12-18Q1-5 0 11Zm0-10q5-18 16-20 1 17-16 20" fill="#618e7f" stroke="#d2e8d8" strokeWidth="2"/><path d="m-15 18 30 0" stroke="#d3e5d8" strokeWidth="2"/></g>;
  return <g><path d="m-18 9 5-16 18-11 15 14-7 19-20 5Z" fill="#93c9d5" stroke="#e6f9f8" strokeWidth="2"/><path d="m5-18-2 16 17-2M3-2-7 20m10-22-21 11" fill="none" stroke="#d2ffff" strokeWidth="2"/></g>;
}
function FogMask({id,survey,viewport}:{id:string;survey:boolean;viewport:{x:number;y:number;width:number;height:number}}) {
  const discs=survey?DEMO_SURVEYED:OPENING_OBSERVED;
  return <defs>
    {discs.map((disc,i)=><radialGradient id={`${id}-reveal-${i}`} key={i}>
      <stop offset="0%" stopColor="black"/>
      <stop offset={`${100*disc.clear/disc.fade}%`} stopColor="black"/>
      <stop offset="83%" stopColor="#a7a7a7"/>
      <stop offset="100%" stopColor="white"/>
    </radialGradient>)}
    {discs.map((disc,i)=><radialGradient id={`${id}-known-${i}`} key={`known-${i}`}>
      <stop offset="0%" stopColor="white"/>
      <stop offset={`${100*disc.clear/disc.fade}%`} stopColor="white"/>
      <stop offset="83%" stopColor="#555"/>
      <stop offset="100%" stopColor="black"/>
    </radialGradient>)}
    <mask id={`${id}-fog-mask`} maskUnits="userSpaceOnUse" x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height}>
      <rect {...viewport} fill="white"/>
      {discs.map((disc,i)=><circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-reveal-${i})`}/>)}
    </mask>
    <mask id={`${id}-known-mask`} maskUnits="userSpaceOnUse" x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height}>
      <rect {...viewport} fill="black"/>
      {discs.map((disc,i)=><circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-known-${i})`}/>)}
    </mask>
    <radialGradient id={`${id}-heat`}>
      <stop stopColor="#ffd58b" stopOpacity=".52"/><stop offset=".52" stopColor="#e9ab5a" stopOpacity=".22"/>
      <stop offset=".91" stopColor="#f0a755" stopOpacity=".095"/><stop offset="1" stopColor="#f5bf76" stopOpacity=".03"/>
    </radialGradient>
    <radialGradient id={`${id}-halo`}>
      <stop stopColor="#e5eef0" stopOpacity="0"/><stop offset=".65" stopColor="#d5e6e9" stopOpacity="0"/>
      <stop offset=".87" stopColor="#d7eef1" stopOpacity=".065"/><stop offset="1" stopColor="#c5dce4" stopOpacity="0"/>
    </radialGradient>
  </defs>;
}
export default function MapScene({selected,onSelect,compact=false}:Props){
  const unique=useId().replace(/[^a-zA-Z0-9]/g,'')||'map';
  const root=useRef<HTMLDivElement>(null);
  const drag=useRef<{x:number;y:number;cx:number;cy:number;travel:number}|null>(null);
  const ignoreNextClick=useRef(false);
  const [aspect,setAspect]=useState(1.65);
  const [zoom,setZoom]=useState(1);
  const [cx,setCx]=useState(0);
  const [cy,setCy]=useState(0);
  const [survey,setSurvey]=useState(false);
  const [labels,setLabels]=useState(true);
  const [minutes,setMinutes]=useState(420);
  const [level,setLevel]=useState(1);
  const [inspected,setInspected]=useState<string|null>(null);
  const radius=heatRadiusM(level);
  const phase=dayPhase(minutes);
  const viewHeight=172/zoom;
  const viewWidth=viewHeight*aspect;
  const viewport={x:cx-viewWidth/2,y:cy-viewHeight/2,width:viewWidth,height:viewHeight};
  const vb=`${viewport.x} ${viewport.y} ${viewWidth} ${viewHeight}`;
  const revealed=useMemo(()=>visibleDemoMarkers(survey),[survey]);
  const current=revealed.find(m=>m.id===inspected);
  useEffect(()=>{
    if(!root.current) return;
    const observer=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      if(width>0 && height>0) setAspect(width/height);
    });
    observer.observe(root.current);
    return ()=>observer.disconnect();
  },[]);
  const setZoomBound=(value:number)=>setZoom(Math.max(.002,Math.min(6,value)));
  const zoomBy=(factor:number)=>setZoomBound(zoom*factor);
  const reset=()=>{setZoom(1);setCx(0);setCy(0);};
  const fitHeat=()=>{
    setCx(DEMO_CAMP.x);setCy(-DEMO_CAMP.y);
    setZoomBound(172/(Math.max(24,radius)*2.6));
  };
  const pointerDown=(e:ReactPointerEvent<SVGSVGElement>)=>{
    if(e.button!==0) return;
    drag.current={x:e.clientX,y:e.clientY,cx,cy,travel:0};
    ignoreNextClick.current=false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pointerMove=(e:ReactPointerEvent<SVGSVGElement>)=>{
    if(!drag.current)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;
    drag.current.travel=Math.max(drag.current.travel,Math.hypot(dx,dy));
    setCx(drag.current.cx-dx*viewWidth/rect.width);
    setCy(drag.current.cy-dy*viewHeight/rect.height);
  };
  const pointerUp=()=>{if(drag.current?.travel && drag.current.travel>5)ignoreNextClick.current=true;drag.current=null;};
  const wheel=(e:ReactWheelEvent<SVGSVGElement>)=>{
    e.preventDefault();
    const rect=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-.5;
    const y=(e.clientY-rect.top)/rect.height-.5;
    const next=Math.max(.002,Math.min(6,zoom*(e.deltaY<0?1.14:1/1.14)));
    setCx(c=>c+x*(viewWidth-viewHeight*aspect/next));
    setCy(c=>c+y*(viewHeight-172/next));
    setZoom(next);
  };
  const inspectSite=(id:SiteKind)=>{
    if(ignoreNextClick.current){ignoreNextClick.current=false;return;}
    setInspected(null);onSelect(id);
  };
  const inspectMarker=(id:string)=>{
    if(ignoreNextClick.current){ignoreNextClick.current=false;return;}
    setInspected(id);
  };
  const clearSurvey=()=>{
    setSurvey(s=>!s);setInspected(null);
  };
  const allIcons=FIRE_MARKER_SCALE(zoom);
  return <div className={`map-experience ${compact?'map-experience--compact':''}`}>
    {!compact&&<div className="map-toolbar">
      <div className="map-toolbar-main">
        <span className="map-eyebrow"><Snowflake size={14}/> BĂNG NGUYÊN · BẢN XEM THỬ</span>
        <span className="map-time-flag"><span className={`map-phase-symbol phase-${phase}`}>{phase==='day'?<Sun size={15}/>:<Moon size={15}/>}</span>{formatClock(minutes)} · {phase==='day'?'Ban ngày':phase==='twilight'?'Chạng vạng':'Ban đêm'}</span>
      </div>
      <div className="map-toolbar-actions">
        <label className="map-control-label" htmlFor={`${unique}-time`}>Thử ánh sáng</label>
        <select id={`${unique}-time`} value={minutes} onChange={e=>setMinutes(Number(e.target.value))} aria-label="Mô phỏng giờ hiển thị">
          {TIMES.map(t=><option value={t} key={t}>{formatClock(t)}</option>)}
        </select>
        <label className="map-control-label" htmlFor={`${unique}-level`}>Xem vùng nhiệt</label>
        <select id={`${unique}-level`} value={level} onChange={e=>setLevel(Number(e.target.value))} aria-label="Xem thử vùng nhiệt theo cấp">
          {LEVELS.map(l=><option value={l} key={l}>Cấp {l}</option>)}
        </select>
        <button className="map-survey-switch" onClick={()=>setLabels(v=>!v)} aria-pressed={labels} aria-label="Hiện hoặc ẩn nhãn biểu tượng">{labels?<Eye size={15}/>:<EyeOff size={15}/>} {labels?'Ẩn nhãn':'Hiện nhãn'}</button>
        <button className={`map-survey-switch ${survey?'is-on':''}`} onClick={clearSurvey} aria-pressed={survey}>
          <MapPinned size={15}/> {survey?'Ẩn điểm mẫu':'Xem khảo sát mẫu'}
        </button>
      </div>
    </div>}
    <div className={`map-scene map-scene--deep ${compact?'map-scene--compact':''}`} ref={root}>
      <svg className="terrain-svg terrain-svg--deep" viewBox={vb} aria-label="Bản đồ băng nguyên với lớp sương mù khám phá, giữ chuột trái và kéo để di chuyển"
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel}>
        <Terrain id={unique}/>
        <FogMask id={unique} survey={survey} viewport={viewport}/>
        <rect x="-96000" y="-96000" width="192000" height="192000" fill="#081527" opacity={dayOverlayOpacity(minutes)} pointerEvents="none"/>
        {(survey?DEMO_SURVEYED:OPENING_OBSERVED).map((d,i)=>
          <circle key={i} cx={d.x} cy={-d.y} r={d.fade+27} fill={`url(#${unique}-halo)`} pointerEvents="none"/>)}
        <rect x="-96000" y="-96000" width="192000" height="192000" fill="#01040a" mask={`url(#${unique}-fog-mask)`} pointerEvents="none"/>
        <circle cx="0" cy="0" r={radius} fill={`url(#${unique}-heat)`} mask={`url(#${unique}-known-mask)`} pointerEvents="none"/>
        <circle cx="0" cy="0" r={radius} fill="none" stroke="#edbc77" strokeWidth={Math.max(.8,Math.min(5,2.2/zoom))} strokeDasharray={`${Math.max(4,8/zoom)} ${Math.max(3,6/zoom)}`} strokeOpacity=".88" pointerEvents="none"/>
        <circle cx="0" cy="0" r={Math.min(radius,Math.max(3,radius*.18))} fill="none" stroke="#ffc881" strokeOpacity=".23" strokeWidth="2" pointerEvents="none"/>
        {FIRST_SITES.map(site=><g key={site.id} className={`map-site map-site--deep ${selected===site.id&&!inspected?'map-site--selected':''}`}
           transform={`translate(${site.x} ${site.renderY}) scale(${allIcons})`}
           role="button" aria-label={`Xem ${site.name}`} tabIndex={0}
           onClick={()=>inspectSite(site.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectSite(site.id);}}}>
          <circle r="23" fill="#0e2531" opacity=".92" stroke={selected===site.id&&!inspected?'#eccd91':'#9bc7c9'} strokeWidth="1.7"/>
          <circle r="28" fill="none" stroke="#b8c8bd" strokeOpacity=".23" strokeWidth="1" strokeDasharray="3 5"/>
          <MarkerGraphic kind={site.id}/>
          {labels && zoom>.16 && <g transform="translate(0 33)">
            <rect x={-Math.max(27,site.label.length*3.6)} y="-6" width={Math.max(54,site.label.length*7.2)} height="17" rx="4" fill="#091721" stroke="#a5c6c9" strokeOpacity=".3"/>
            <text textAnchor="middle" fontSize="8" fill="#f3f1e8" y="5">{site.label}</text>
          </g>}
        </g>)}
        {revealed.map(marker=><g key={marker.id} className={`map-resource-marker ${inspected===marker.id?'map-resource-marker--selected':''}`}
          transform={`translate(${marker.x} ${-marker.y}) scale(${allIcons})`}
          role="button" tabIndex={0} aria-label={`Kiểm tra ${marker.name}`} onClick={()=>inspectMarker(marker.id)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectMarker(marker.id);}}}>
          <circle r="21" fill="#0b2933" stroke={inspected===marker.id?'#f0c88b':'#b4d3c7'} strokeWidth="1.6"/>
          <circle r="26" fill="none" stroke="#b4d9d9" strokeOpacity=".18" strokeDasharray="2 4"/>
          <MarkerGraphic kind={marker.kind}/>
          {labels && zoom>.16&&<text y="36" textAnchor="middle" fontSize="8" fill="#e5efea" stroke="#091d27" strokeWidth="3" paintOrder="stroke">{marker.kind==='chest'?'Rương Báu':marker.name}</text>}
        </g>)}
        <g className="map-snow-particles" pointerEvents="none">
          {SNOW_PARTICLES.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#eaf5ee" opacity=".63" style={{animationDelay:`${p.delay}s`}} />)}
        </g>
      </svg>
      <div className="map-vignette" aria-hidden="true"/>
      <div className="map-corner-title"><span><Compass size={13}/> PHƯƠNG BẮC ↑</span><strong>Đồng bằng Cổ Chiến Trường</strong><small>Bản vẽ khu vực · Không phải địa hình canon</small></div>
      <div className="map-corner-controls">
        <button onClick={()=>zoomBy(.74)} aria-label="Thu nhỏ" title="Thu nhỏ"><Minus size={17}/></button>
        <span aria-live="polite">{Math.round(zoom*100)}%</span>
        <button onClick={()=>zoomBy(1.34)} aria-label="Phóng to" title="Phóng to"><Plus size={17}/></button>
        <button onClick={reset} aria-label="Trở về tâm lãnh địa" title="Trở về tâm lãnh địa"><Maximize2 size={17}/></button>
        <button onClick={fitHeat} aria-label="Xem toàn bộ vòng nhiệt" title="Xem toàn bộ vòng nhiệt"><ThermometerSun size={17}/></button>
      </div>
      {current&&!compact&&<div className="map-entity-popover" role="region" aria-label="Thông tin điểm được chọn">
        <div className="map-entity-kicker">{current.kind==='chest'?'RƯƠNG BÁU':'ĐIỂM THU THẬP'} <span>MẪU</span></div>
        <h3>{current.name}</h3>
        {current.kind==='chest'?<>
          <div className="map-entity-quantity">Chưa mở · Nội dung chưa xác định</div>
          <p>Biểu tượng rương minh họa. Không đại diện vị trí rương được khóa trong gói thế giới.</p>
        </>:<>
          <div className="map-entity-quantity">{displayRemaining(current)}</div>
          <div className="map-resource-progress"><span style={{width:`${current.capacity?current.remaining/current.capacity*100:0}%`}} /></div>
          <p>{current.description}</p>
        </>}
        <small>Chỉ số phục vụ thử giao diện; không thêm vật phẩm vào kho.</small>
        <button onClick={()=>setInspected(null)}>Đóng <ArrowDownRight size={15}/></button>
      </div>}
      <div className="map-heat-readout">
        <span><ThermometerSun size={15}/> VÙNG NHIỆT</span>
        <strong>{formatDistance(radius)} <small>bán kính</small></strong>
        <em>{fireForm(level)} Cấp {level} {level!==1?'· Xem trước':''}</em>
      </div>
      {!compact&&<div className="map-drag-hint">Giữ chuột và kéo để khám phá không gian · Sương mù không mở thêm thông tin</div>}
      {compact&&<span className="map-compact-label">SƯƠNG MÙ KHÁM PHÁ · T0</span>}
    </div>
    {!compact&&<div className="map-footer-bar">
      <span><span className="map-dot mapped"/> Đã quan sát T0</span>
      <span><span className="map-dot fogged"/> Chưa khám phá</span>
      {survey&&<span><span className="map-dot sample"/> Điểm khảo sát giả lập</span>}
      <span className="map-footer-aside">{survey?'Số lượng tài nguyên chỉ là dữ liệu mẫu':'Ở T0 chỉ bốn vật thể khởi đầu đã biết'} · Vòng nhiệt không loại bỏ sương mù</span>
    </div>}
  </div>;
}
function FIRE_MARKER_SCALE(zoom:number):number{
  // Markers remain legible across local zoom, without turning into gigantic buildings.
  return Math.max(.45,Math.min(2.4,1/Math.sqrt(zoom)));
}
