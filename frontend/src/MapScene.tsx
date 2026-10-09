import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDownRight, Compass, Eye, EyeOff, Maximize2, Minus, Plus, Snowflake, Sun, Moon, ThermometerSun, MapPinned, Globe2 } from 'lucide-react';
import { sites } from './demoData';
import type { SiteKind } from './demoData';
import {
  dayOverlayOpacity, dayPhase, DEMO_CAMP, fireForm,
  formatClock, formatDistance, heatRadiusM, shouldEnterWorldMap, visibilityDiscs, fogOpacityAt, WORLD_ZOOM,
} from './mapModel';
import { CANONICAL_SITES, CANONICAL_RESOURCES, CANONICAL_CHEST_CACHES, CANONICAL_MAP_RADIUS_M, knownOpeningSites } from './canonicalGeography';
import TerrainDetails from './TerrainDetails';
import { visibleMapSpots, visibleMapViewport } from './worldFeatures';
import './map-refinement.css';

type Props = { selected: SiteKind; onSelect: (id: SiteKind) => void; compact?: boolean; clockSeconds:number; onClockChange:(seconds:number)=>void };
const TIMES = [420, 720, 990, 1005, 1140, 60] as const;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 16, 21, 26, 30] as const;
const FIRST_SITES = sites.map(site=>({...site,renderY:-site.y}));
const SNOW_PARTICLES=Array.from({length:44},(_,i)=>({
  x:((i*131+37)%900)-450,
  y:((i*179+13)%650)-325,
  r:i%4===0?1.3:.75,
  delay:(i%15)*-.55,
}));
/** Exact positions from the LL01 registry, not generated geographical features.
 * Snow and shading are aesthetic cartography; no coastlines, hills, roads or biome
 * polygon boundaries are claimed where the source supplies only point anchors. */
function Terrain({id,world}:{id:string;world:boolean}) {
  const pines=CANONICAL_SITES.find(s=>s.id==='SITE-LL01-040')!;
  const stone=CANONICAL_SITES.find(s=>s.id==='SITE-LL01-041')!;
  const ford=CANONICAL_SITES.find(s=>s.id==='SITE-LL01-042')!;
  return <>
    <defs>
      <radialGradient id={`${id}-ground`}><stop stopColor="#88aab0"/><stop offset=".4" stopColor="#577d89"/><stop offset="1" stopColor="#23465b"/></radialGradient>
      <radialGradient id={`${id}-landshade`}><stop stopColor="#c7dce0" stopOpacity=".36"/><stop offset=".6" stopColor="#a2c2cb" stopOpacity=".12"/><stop offset="1" stopColor="#6b9ca9" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-treezone`}><stop stopColor="#184149" stopOpacity=".7"/><stop offset="1" stopColor="#254a53" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-rockzone`}><stop stopColor="#293c4b" stopOpacity=".85"/><stop offset="1" stopColor="#718e9d" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-icewater`}><stop stopColor="#b8e3ec" stopOpacity=".45"/><stop offset="1" stopColor="#588f9b" stopOpacity="0"/></radialGradient>
      <pattern id={`${id}-frost`} width="58" height="47" patternUnits="userSpaceOnUse">
        <path d="m4 9 6-2m21 28 5-3m-17-12 3 4" stroke="#e4f3ed" strokeOpacity=".17" strokeWidth=".9"/>
        <circle cx="16" cy="16" r=".9" fill="#eef9f5" opacity=".35"/>
      </pattern>
      <pattern id={`${id}-cart-grid`} width="10000" height="10000" patternUnits="userSpaceOnUse">
        <path d="M10000 0H0V10000" fill="none" stroke="#a1c1ce" strokeWidth="35" strokeOpacity=".28"/>
      </pattern>
    </defs>
    <rect x="-300000" y="-300000" width="600000" height="600000" fill="#112b3c"/>
    <circle r={CANONICAL_MAP_RADIUS_M} fill={`url(#${id}-ground)`}/>
    <circle r={CANONICAL_MAP_RADIUS_M} fill={`url(#${id}-cart-grid)`}/>
    <circle r={CANONICAL_MAP_RADIUS_M} fill="none" stroke="#8cb7bb" strokeWidth="200" strokeOpacity=".35" strokeDasharray="950 750"/>
    <TerrainDetails world={world}/>
    {/* Regions radiate out from exact source point anchors; their artwork boundaries are schematic. */}
    <ellipse cx={pines.x} cy={-pines.y} rx="1600" ry="1900" fill={`url(#${id}-treezone)`}/>
    <ellipse cx={stone.x} cy={-stone.y} rx="1300" ry="1100" fill={`url(#${id}-rockzone)`}/>
    <ellipse cx={ford.x} cy={-ford.y} rx="2100" ry="1200" fill={`url(#${id}-icewater)`}/>
    <circle r="1300" fill={`url(#${id}-landshade)`}/>
    {!world&&<>
      <rect x="-1400" y="-1200" width="2800" height="2400" fill={`url(#${id}-frost)`}/>
      <g opacity=".22" fill="none" stroke="#e1f1eb" strokeLinecap="round">
        <path d="M-1200-140Q-650-290-300-120T480-150 1300-100" strokeWidth="22"/>
        <path d="M-1160-117Q-640-268-295-101T485-125 1320-80" strokeWidth="2.5"/>
        <path d="M-950 490Q-600 360-260 485T430 380 1190 390" strokeWidth="12"/>
      </g>
      <g opacity=".24" stroke="#b8d0ca" strokeWidth="2" fill="none">
        <path d="M-78-42q51 16 90-31m-42 129 64 42m-77-17 20 29"/>
        <path d="M-290 200q23-34 55-29m-22 32 32 22"/>
      </g>
    </>}
    {world&&[3000,10000,25000,60000,96000].map(r=><circle key={r} r={r} fill="none"
      stroke="#bdcdd0" strokeWidth="135" strokeOpacity=".08" strokeDasharray="350 550"/>)}
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
  if(kind==='site') return <g><path d="M-16 15V-8l7-8 11 8 8-13 9 7V15Z" fill="#637985" stroke="#d2e3db" strokeWidth="1.6"/><path d="M-21 15h44M-7 15v-13h8v13m10-20-7 4" fill="none" stroke="#9ebcbe" strokeWidth="3"/></g>;
  if(kind==='salt') return <g><path d="m-16 14 6-18 10-14 10 10 8 22Z" fill="#bed7ce" stroke="#f8efe0" strokeWidth="2"/><path d="m0-18 0 31m-10-17 10 5 10-9M-16 14 0 1l18 13" fill="none" stroke="#e5f0e1" strokeWidth="2"/><path d="m-5-12 5-6 6 6" fill="none" stroke="#fff9e8" strokeWidth="2"/></g>;
  if(kind==='herbs') return <g><path d="M0 18V-13m0 24q-12-3-12-18Q1-5 0 11Zm0-10q5-18 16-20 1 17-16 20" fill="#618e7f" stroke="#d2e8d8" strokeWidth="2"/><path d="m-15 18 30 0" stroke="#d3e5d8" strokeWidth="2"/></g>;
  return <g><path d="m-18 9 5-16 18-11 15 14-7 19-20 5Z" fill="#93c9d5" stroke="#e6f9f8" strokeWidth="2"/><path d="m5-18-2 16 17-2M3-2-7 20m10-22-21 11" fill="none" stroke="#d2ffff" strokeWidth="2"/></g>;
}
function FogMask({id,discs,viewport}:{id:string;discs:readonly {x:number;y:number;clear:number;fade:number}[];viewport:{x:number;y:number;width:number;height:number}}) {
  return <defs>
    {discs.map((disc,i)=><radialGradient id={`${id}-reveal-${i}`} key={i}>
      <stop offset="0%" stopColor="black"/>
      <stop offset={`${100*disc.clear/disc.fade}%`} stopColor="black"/>
      <stop offset="87%" stopColor="#aaa"/>
      <stop offset="100%" stopColor="white"/>
    </radialGradient>)}
    {discs.map((disc,i)=><radialGradient id={`${id}-known-${i}`} key={`known-${i}`}>
      <stop offset="0%" stopColor="white"/>
      <stop offset={`${100*disc.clear/disc.fade}%`} stopColor="white"/>
      <stop offset="87%" stopColor="#555"/>
      <stop offset="100%" stopColor="black"/>
    </radialGradient>)}
    <mask id={`${id}-fog-mask`} maskUnits="userSpaceOnUse" {...viewport}>
      <rect {...viewport} fill="white"/>
      {discs.map((disc,i)=><circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-reveal-${i})`}/>)}
    </mask>
    <mask id={`${id}-known-mask`} maskUnits="userSpaceOnUse" {...viewport}>
      <rect {...viewport} fill="black"/>
      {discs.map((disc,i)=><circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-known-${i})`}/>)}
    </mask>
    <radialGradient id={`${id}-heat`}>
      <stop stopColor="#ffd58b" stopOpacity=".5"/><stop offset=".75" stopColor="#e9ab5a" stopOpacity=".25"/>
      <stop offset="1" stopColor="#f5bf76" stopOpacity=".12"/>
    </radialGradient>
    <radialGradient id={`${id}-halo`}>
      <stop stopColor="#e5eef0" stopOpacity="0"/><stop offset=".65" stopColor="#d5e6e9" stopOpacity="0"/>
      <stop offset=".87" stopColor="#d7eef1" stopOpacity=".065"/><stop offset="1" stopColor="#c5dce4" stopOpacity="0"/>
    </radialGradient>
  </defs>;
}
export default function MapScene({selected,onSelect,compact=false,clockSeconds,onClockChange}:Props){
  const unique=useId().replace(/[^a-zA-Z0-9]/g,'')||'map';
  const root=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const drag=useRef<{x:number;y:number;cx:number;cy:number;travel:number}|null>(null);
  const ignoreNextClick=useRef(false);
  const [aspect,setAspect]=useState(1.65);
  const [zoom,setZoom]=useState(1);
  const [viewMode,setViewMode]=useState<'local'|'world'>('local');
  const [cx,setCx]=useState(0);
  const [cy,setCy]=useState(0);
  const [survey,setSurvey]=useState(false);
  const [labels,setLabels]=useState(true);
  const minutes=Math.floor((clockSeconds%86400)/60);
  const [level,setLevel]=useState(1);
  const [inspected,setInspected]=useState<string|null>(null);
  const radius=heatRadiusM(level);
  const phase=dayPhase(minutes);
  const viewHeight=172/zoom;
  const viewWidth=viewHeight*aspect;
  const viewport={x:cx-viewWidth/2,y:cy-viewHeight/2,width:viewWidth,height:viewHeight};
  const vb=`${viewport.x} ${viewport.y} ${viewWidth} ${viewHeight}`;
  const discs=useMemo(()=>visibilityDiscs(minutes,level,survey),[minutes,level,survey]);
  // Firelight reveals the physical area. Model-generated vegetation and surface
  // relics are visible without debug. Buried/sealed locations remain hidden.
  const visibleSpots=useMemo(()=>visibleMapSpots(minutes,level,survey),[minutes,level,survey]);
  const markers=useMemo(()=>visibleMapViewport(visibleSpots,cx,cy,viewWidth,viewHeight).filter((spot,index)=>{
    if(spot.provenance==='canonical'||zoom>.035)return true;
    // Far overview shows fewer secondary model spots to avoid unreadable clusters.
    return index%7===0;
  }),[visibleSpots,cx,cy,viewWidth,viewHeight,zoom]);
  const current=visibleSpots.find(m=>m.id===inspected);
  const world=viewMode==='world';
  const knownSites=knownOpeningSites();
  const [mapHeight,setMapHeight]=useState(550);
  useEffect(()=>{
    if(!root.current) return;
    const observer=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      if(width>0 && height>0){setAspect(width/height);setMapHeight(height);}
    });
    observer.observe(root.current);
    return ()=>observer.disconnect();
  },[]);
  const enterWorld=()=>{setViewMode('world');setZoom(WORLD_ZOOM);setCx(0);setCy(0);setInspected(null);};
  const enterLocal=()=>{setViewMode('local');setZoom(1);setCx(0);setCy(0);setInspected(null);};
  const setZoomBound=(value:number,allowWorldTransition:boolean)=>{
    const next=Math.max(WORLD_ZOOM*.8,Math.min(6,value));
    if(allowWorldTransition && viewMode==='local' && next<zoom && shouldEnterWorldMap(next,radius)){
      enterWorld();return;
    }
    setZoom(next);
  };
  const zoomBy=(factor:number)=>{
    if(viewMode==='world' && factor>1){enterLocal();return;}
    setZoomBound(zoom*factor,factor<1);
  };
  const reset=()=>{viewMode==='world'?enterWorld():enterLocal();};
  const fitHeat=()=>{
    // Explicit camera framing MUST stay local, regardless of how large radius becomes.
    setViewMode('local');setCx(DEMO_CAMP.x);setCy(-DEMO_CAMP.y);
    setZoom(Math.max(WORLD_ZOOM*.8,Math.min(6,172/(Math.max(80,radius*2.5)))));
    setInspected(null);
  };
  const pointerDown=(e:ReactPointerEvent<SVGSVGElement>)=>{
    if(e.button!==0) return;
    drag.current={x:e.clientX,y:e.clientY,cx,cy,travel:0};
    ignoreNextClick.current=false;
    // Do not capture on pointer-down: small clicks must reach site/resource icons.
    // Capture only after the gesture is clearly a drag.
  };
  const pointerMove=(e:ReactPointerEvent<SVGSVGElement>)=>{
    if(!drag.current)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;
    drag.current.travel=Math.max(drag.current.travel,Math.hypot(dx,dy));
    if(drag.current.travel<=5) return; // click tolerance in CSS pixels
    if(!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
    setCx(drag.current.cx-dx*viewWidth/rect.width);
    setCy(drag.current.cy-dy*viewHeight/rect.height);
  };
  const pointerUp=(e:ReactPointerEvent<SVGSVGElement>)=>{
    if(drag.current && drag.current.travel>5) ignoreNextClick.current=true;
    drag.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  // React 18 installs passive wheel handlers. Native non-passive listener is required
  // to stop browser-page scrolling while the cursor is over the map viewport.
  useEffect(()=>{
    const node=root.current;
    if(!node)return;
    const onWheel=(e:WheelEvent)=>{
      if(e.target instanceof Element&&e.target.closest('button,select,option'))return;
      e.preventDefault();
      const rect=svgRef.current?.getBoundingClientRect();
      if(!rect||!rect.width||!rect.height)return;
      if(viewMode==='world'&&e.deltaY<0){enterLocal();return;}
      const factor=e.deltaY<0?1.2:1/1.2;
      const next=Math.max(WORLD_ZOOM*.85,Math.min(6,zoom*factor));
      if(viewMode==='local'&&e.deltaY>0&&shouldEnterWorldMap(next,radius)){enterWorld();return;}
      const x=(e.clientX-rect.left)/rect.width-.5;
      const y=(e.clientY-rect.top)/rect.height-.5;
      const nextHeight=172/next;
      setCx(c=>c+x*(viewWidth-nextHeight*aspect));
      setCy(c=>c+y*(viewHeight-nextHeight));
      setZoom(next);
    };
    node.addEventListener('wheel',onWheel,{passive:false});
    return ()=>node.removeEventListener('wheel',onWheel);
  },[zoom,viewMode,radius,viewWidth,viewHeight,aspect]);
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
  const allIcons=Math.max(.17,Math.min(600,viewHeight/Math.max(100,mapHeight)*.66));
  return <div className={`map-experience ${compact?'map-experience--compact':''}`}>
    {!compact&&<div className="map-toolbar">
      <div className="map-toolbar-main">
        <span className="map-eyebrow"><Snowflake size={14}/> BĂNG NGUYÊN · BẢN XEM THỬ</span>
        <span className="map-time-flag"><span className={`map-phase-symbol phase-${phase}`}>{phase==='day'?<Sun size={15}/>:<Moon size={15}/>}</span>{formatClock(minutes)} · {phase==='day'?'Ban ngày':phase==='twilight'?'Chạng vạng':'Ban đêm'}</span>
      </div>
      <div className="map-toolbar-actions">
        <label className="map-control-label" htmlFor={`${unique}-time`}>Thử ánh sáng</label>
        <select id={`${unique}-time`} value={TIMES.includes(minutes as typeof TIMES[number])?minutes:-1} onChange={e=>onClockChange(Math.floor(clockSeconds/86400)*86400+Number(e.target.value)*60)} aria-label="Mô phỏng giờ hiển thị">
          {!TIMES.includes(minutes as typeof TIMES[number])&&<option value={-1}>{formatClock(minutes)}</option>}
          {TIMES.map(t=><option value={t} key={t}>{formatClock(t)}</option>)}
        </select>
        <label className="map-control-label" htmlFor={`${unique}-level`}>Xem vùng nhiệt</label>
        <select id={`${unique}-level`} value={level} onChange={e=>setLevel(Number(e.target.value))} aria-label="Xem thử vùng nhiệt theo cấp">
          {LEVELS.map(l=><option value={l} key={l}>Cấp {l}</option>)}
        </select>
        <button className="map-survey-switch" onClick={()=>setLabels(v=>!v)} aria-pressed={labels} aria-label="Hiện hoặc ẩn nhãn biểu tượng">{labels?<Eye size={15}/>:<EyeOff size={15}/>} {labels?'Ẩn nhãn':'Hiện nhãn'}</button>
        <button className={`map-survey-switch ${survey?'is-on':''}`} onClick={clearSurvey} aria-pressed={survey}>
          <MapPinned size={15}/> {survey?'Ẩn atlas nguồn':'Xem atlas nguồn (debug)'}
        </button>
        <button className={`map-survey-switch ${world?'is-on':''}`} onClick={world?enterLocal:enterWorld} aria-pressed={world} aria-label={world?'Chuyển sang bản đồ địa phương':'Chuyển sang bản đồ thế giới'}><Globe2 size={15}/> {world?'Bản đồ địa phương':'Bản đồ thế giới'}</button>
      </div>
    </div>}
    <div className={`map-scene map-scene--deep ${compact?'map-scene--compact':''}`} ref={root}>
      <svg ref={svgRef} className="terrain-svg terrain-svg--deep" viewBox={vb} aria-label="Bản đồ băng nguyên với lớp sương mù khám phá, giữ chuột trái và kéo để di chuyển"
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <Terrain id={unique} world={world}/>
        <FogMask id={unique} discs={discs} viewport={viewport}/>
        <rect {...viewport} fill="#081527" opacity={dayOverlayOpacity(minutes)} pointerEvents="none"/>
        {discs.map((d,i)=>
          <circle key={i} cx={d.x} cy={-d.y} r={d.fade+27} fill={`url(#${unique}-halo)`} pointerEvents="none"/>)}
        <rect {...viewport} fill="#01040a" mask={`url(#${unique}-fog-mask)`} pointerEvents="none"/>
        <circle cx="0" cy="0" r={radius} fill={`url(#${unique}-heat)`} mask={`url(#${unique}-known-mask)`} pointerEvents="none"/>
        <circle cx="0" cy="0" r={radius} fill="none" stroke="#edbc77" strokeWidth={Math.max(.8,Math.min(750,viewHeight/245))} strokeDasharray={`${Math.max(4,viewHeight/70)} ${Math.max(3,viewHeight/100)}`} strokeOpacity=".88" pointerEvents="none"/>
        <circle cx="0" cy="0" r={Math.min(radius,Math.max(3,radius*.18))} fill="none" stroke="#ffc881" strokeOpacity=".23" strokeWidth="2" pointerEvents="none"/>
        {FIRST_SITES.filter(site=>(!world||site.id==='fire') && knownSites.some(known=>known.x===site.x&&known.y===site.y) && fogOpacityAt(site.x,site.y,survey,minutes,level)<.92).map(site=><g key={site.id} className={`map-site map-site--deep ${selected===site.id&&!inspected?'map-site--selected':''}`}
           transform={`translate(${site.x} ${site.renderY}) scale(${allIcons})`}
           role="button" aria-label={`Xem ${site.name}`} tabIndex={0}
           onClick={()=>inspectSite(site.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectSite(site.id);}}}>
          <circle r="23" fill="#0e2531" opacity=".92" stroke={selected===site.id&&!inspected?'#eccd91':'#9bc7c9'} strokeWidth="1.7"/>
          <circle r="28" fill="none" stroke="#b8c8bd" strokeOpacity=".23" strokeWidth="1" strokeDasharray="3 5"/>
          <MarkerGraphic kind={site.id}/>
          {labels && zoom>.16 && <g transform="translate(0 33)">
            <rect x={-Math.max(27,site.label.length*3.6)} y="-6" width={Math.max(54,site.label.length*7.2)} height="17" rx="4" fill="#091721" stroke="#a5c6c9" strokeOpacity=".3"/>
            <text textAnchor="middle" fontSize="13" fill="#f3f1e8" y="5">{site.label}</text>
          </g>}
        </g>)}
        {markers.map(marker=><g key={marker.id} className={`map-resource-marker ${inspected===marker.id?'map-resource-marker--selected':''}`}
          transform={`translate(${marker.x} ${-marker.y}) scale(${allIcons})`}
          role="button" tabIndex={0} aria-label={`Kiểm tra ${marker.name}`} onClick={()=>inspectMarker(marker.id)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectMarker(marker.id);}}}>
          <circle r="21" fill={marker.provenance==='modeled'?'#203f41':'#0b2933'} stroke={inspected===marker.id?'#f0c88b':marker.provenance==='canonical'?'#f1c991':'#b4d3c7'} strokeWidth="1.6"/>
          <circle r="26" fill="none" stroke="#b4d9d9" strokeOpacity=".18" strokeDasharray="2 4"/>
          <MarkerGraphic kind={marker.kind}/>
          {labels && zoom>.075&&<text y="36" textAnchor="middle" fontSize="14" fill="#e5efea" stroke="#091d27" strokeWidth="3" paintOrder="stroke">{marker.kind==='chest'?'Dấu rương':marker.label}</text>}
        </g>)}
        <g className="map-snow-particles" pointerEvents="none">
          {SNOW_PARTICLES.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#eaf5ee" opacity=".63" style={{animationDelay:`${p.delay}s`}} />)}
        </g>
      </svg>
      <div className="map-vignette" aria-hidden="true"/>
      <div className="map-corner-title"><span><Compass size={13}/> PHƯƠNG BẮC ↑</span><strong>{world?'Bản đồ thế giới · LL01':'Đồng bằng Cổ Chiến Trường'}</strong><small>{world?'Phạm vi nguồn · bán kính 96 km':'Tọa độ nguồn cố định · Đường viền địa hình minh họa'}</small></div>
      <div className="map-corner-controls">
        <button onClick={()=>zoomBy(.74)} aria-label="Thu nhỏ" title="Thu nhỏ"><Minus size={17}/></button>
        <span aria-live="polite">{Math.round(zoom*100)}%</span>
        <button onClick={()=>zoomBy(1.34)} aria-label="Phóng to" title="Phóng to"><Plus size={17}/></button>
        <button onClick={reset} aria-label="Trở về tâm lãnh địa" title="Trở về tâm lãnh địa"><Maximize2 size={17}/></button>
        <button onClick={fitHeat} aria-label="Xem toàn bộ vòng nhiệt" title="Xem toàn bộ vòng nhiệt"><ThermometerSun size={17}/></button>
        <button onClick={world?enterLocal:enterWorld} aria-label={world?'Chuyển sang bản đồ địa phương':'Chuyển sang bản đồ thế giới'} title="Đổi chế độ bản đồ"><Globe2 size={17}/></button>
      </div>
      {current&&!compact&&<div className="map-entity-popover" role="region" aria-label="Thông tin điểm được chọn">
        <div className="map-entity-kicker">{current.kind==='chest'?'DẤU HIỆU RƯƠNG':current.kind==='site'?'DẤU TÍCH CÔNG TRÌNH':'ĐIỂM THU THẬP'} <span>{current.provenance==='canonical'?'NGUỒN':'DỰNG THÊM'}</span></div>
        <h3>{current.kind==='site'&&!survey?'Dấu vết công trình chưa khảo sát':current.name}</h3>
        {current.kind==='chest'||current.kind==='site'?<>
          <div className="map-entity-quantity">{current.kind==='chest'?'Chưa khai quật · Chưa xác định bên trong':'Chưa khảo sát · Chưa thể tương tác'}</div>
          <p>{current.kind==='site'?'Ánh sáng cho thấy dấu tích trên mặt băng; cần khảo sát mới xác nhận danh tính và cửa tiếp cận.':'Tọa độ dấu rương từ gói thế giới. Ánh sáng không tự khai quật, xác minh Phẩm hoặc mở phần thưởng.'}</p>
        </>:<>
          <div className="map-entity-quantity">{current.amount?.toLocaleString('vi-VN')??'—'} {current.unit} <small>ước lượng ban đầu</small></div>
          <div className="map-resource-progress"><span style={{width:'100%'}} /></div>
          <p>{current.detail}</p>
        </>}
        <small>{current.provenance==='canonical'?'Điểm cố định từ WORLD-PACKAGE-LL01-1.0.':'Tọa độ và trữ lượng dựng thêm hợp lý, chưa xác lập canon.'} Không cộng vật phẩm hay trừ kho; tình trạng cần xác minh bằng hành động chơi.</small>
        <button onClick={()=>setInspected(null)}>Đóng <ArrowDownRight size={15}/></button>
      </div>}
      <div className="map-heat-readout">
        <span><ThermometerSun size={15}/> VÙNG NHIỆT</span>
        <strong>{formatDistance(radius)} <small>bán kính</small></strong>
        <em>{fireForm(level)} Cấp {level} {level!==1?'· Xem trước':''}</em>
      </div>
      {!compact&&<div className="map-drag-hint">{world?'Vùng tối chưa được khảo sát · Bản đồ không tự khám phá':'Kéo để di chuyển · Cuộn chuột để thu phóng, không cuộn trang'}</div>}
      {compact&&<span className="map-compact-label">SƯƠNG MÙ KHÁM PHÁ</span>}
    </div>
    {!compact&&<div className="map-footer-bar">
      <span><span className="map-dot mapped"/> Vùng đang nhìn thấy</span>
      <span><span className="map-dot fogged"/> Chưa khám phá</span>
      {survey&&<span><span className="map-dot sample"/> Atlas nguồn (không phải kiến thức nhân vật)</span>}
      <span className="map-footer-aside">{survey?'Atlas nguồn chỉ phục vụ kiểm tra':'Địa vật mặt đất hiện khi đủ sáng'} · Rương dưới đất cần khảo sát</span>
    </div>}
  </div>;
}
function FIRE_MARKER_SCALE(zoom:number):number{
  // Markers remain legible across local zoom, without turning into gigantic buildings.
  return Math.max(.14,Math.min(.9,.32/Math.sqrt(zoom)));
}
