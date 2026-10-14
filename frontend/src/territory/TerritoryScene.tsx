import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react';
import { AlertTriangle, Compass, Eye, EyeOff, Flame, Grid3X3, LocateFixed, Maximize2, Minus, Plus, RotateCw, Search, Snowflake, ThermometerSun, X } from 'lucide-react';
import type { EntityRef, LayoutDraft, PlayerView, SettlementBuildingView, SettlementPlacementDefinition, SettlementView } from '../game/GameClient';
import type { AssetManifest } from '../assets/assetRegistry';
import { findAsset, loadAssetManifest, resolveSettlementAssetId } from '../assets/assetRegistry';
import BuildingSprite, { type ReadabilityMode } from './BuildingSprite';
import './territory.css';
import MapCanvas from '../rendering/MapCanvas';
import { territorySnapshot, type MapSnapshot } from '../rendering/MapSceneAdapter';
import { spriteRect, artPolygon } from '../rendering/SpriteRegistration';
import { pointInPolygon, pickStack, cyclePick, pointerCSS } from '../rendering/MapPicking';
import { projectBuildings } from '../rendering/BuildingGeometry';
import { depthOrder } from '../rendering/DepthOrder';
import { cameraOverlayTransform } from '../rendering/transientCamera';
import { footprintHeatRelation, snapPlanningPoint, validatePlacement } from './placement';
import { fitWorldBounds, isoToWorld, screenToWorld, worldToIso, worldToScreen, zoomAtScreenPoint } from './projection';
import type { TerritoryCamera, WorldPoint } from './projection';

const PX_PER_ISO_METRE = 3;
const ORIENTATION_LABEL:Record<LayoutDraft['orientation'],string>={north:'Bắc',east:'Đông',south:'Nam',west:'Tây'};
const fixtureFootprint = { kind:'rectangle' as const, widthM:2, depthM:2, provenance:'frontend-fixture' as const, assumptionId:'TERRITORY-QA-V1', note:'Kích thước giả định cho fixture QA.' };
type PanGesture = { pointerId:number; x:number; y:number; origin:TerritoryCamera; moved:boolean; playerMarker:boolean };
type Props = {
  mode?: 'demo' | 'live';
  visualIdentity?:string;
  terrainRegions?:MapSnapshot['regions'];
  playerMarkerVisible?: boolean;
  settlement: SettlementView;
  placementDefinitions: PlayerView['placementDefinitions'];
  camera: TerritoryCamera | null;
  onCameraChange: Dispatch<SetStateAction<TerritoryCamera | null>>;
  drafts: readonly LayoutDraft[];
  onDraftsChange: Dispatch<SetStateAction<LayoutDraft[]>>;
  selectedRef: EntityRef | null;
  onSelectEntity: (ref:EntityRef)=>void;
  focusedBuildingId: string | null;
  onFocusHandled: ()=>void;
  readability: ReadabilityMode;
  onReadabilityChange: (mode:ReadabilityMode)=>void;
  playerName: string;
  playerPosition: WorldPoint;
  followPlayer: boolean;
  onFollowPlayerChange: (active:boolean)=>void;
  onOpenPlayerProfile: ()=>void;
};

function heatBoundary(origin:WorldPoint,radius:number) {
  return Array.from({length:32},(_,i)=>{
    const angle=(Math.PI*2*i)/32;
    return {x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};
  });
}
function pointsForBuilding(building:SettlementBuildingView,origin:WorldPoint):WorldPoint[] {
  const x=origin.x+building.x,y=origin.y+building.y,w=building.footprint.widthM/2,d=building.footprint.depthM/2;
  return [{x:x-w,y:y-d},{x:x+w,y:y-d},{x:x+w,y:y+d},{x:x-w,y:y+d}];
}
function gridStep(zoom:number) { return zoom>1.1?1:zoom>.4?5:zoom>.12?20:zoom>.045?500:0; }
function worldBounds(camera:TerritoryCamera,width:number,height:number):{minX:number;maxX:number;minY:number;maxY:number} {
  const points=[screenToWorld({x:0,y:0},camera,{width,height}),screenToWorld({x:width,y:0},camera,{width,height}),screenToWorld({x:width,y:height},camera,{width,height}),screenToWorld({x:0,y:height},camera,{width,height})];
  return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};
}

export default function TerritoryScene({ mode='demo', visualIdentity, terrainRegions, playerMarkerVisible=false, settlement, placementDefinitions, camera, onCameraChange, drafts, onDraftsChange, selectedRef, onSelectEntity, focusedBuildingId, onFocusHandled, readability, onReadabilityChange, playerName, playerPosition, followPlayer, onFollowPlayerChange, onOpenPlayerProfile }:Props) {
  const liveApi = mode === 'live';
  const showPlayerMarker = playerMarkerVisible || followPlayer;
  const rootRef=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const gesture=useRef<PanGesture|null>(null);
  const touches=useRef(new Map<number,{x:number;y:number}>());
  const pinch=useRef<{ids:[number,number];distance:number;anchor:WorldPoint;origin:TerritoryCamera}|null>(null);
  const ignoreClick=useRef(false);
  const lastPick=useRef<{point:WorldPoint;ids:string[]}|null>(null);
  const nextDraft=useRef(1);
  const [size,setSize]=useState({width:0,height:0});
  const [manifest,setManifest]=useState<AssetManifest|null>(null);
  const [manifestError,setManifestError]=useState(false);
  const [search,setSearch]=useState('');
  const [placingId,setPlacingId]=useState<string|null>(null);
  const [placingOrientation,setPlacingOrientation]=useState<LayoutDraft['orientation']>('north');
  const [ghostWorld,setGhostWorld]=useState<WorldPoint|null>(null);
  const [heatPreview,setHeatPreview]=useState<'actual'|'2500'|'25000'|'off'>('actual');
  const [calibrationOpen,setCalibrationOpen]=useState(false);
  const [calibrationAssetId,setCalibrationAssetId]=useState('fixture-tall-tower');
  const [denseQa,setDenseQa]=useState(false);
  const [message,setMessage]=useState('');
  const [showGrid,setShowGrid]=useState(false);
  const origin=settlement.worldOrigin;
  const actualRadius=settlement.fireActive?settlement.heatRadiusM:0;
  const displayedRadius=heatPreview==='actual'?actualRadius:heatPreview==='off'?0:Number(heatPreview);
  const effectiveMode:ReadabilityMode=placingId?'planning':readability;
  const activeDefinition=placementDefinitions.find(def=>def.id===placingId)??null;
  const activeCamera=camera??{x:origin.x+10,y:origin.y+5,zoom:.7};
  const transient=useRef(activeCamera),lastCameraCommit=useRef(0),wheelCommit=useRef<ReturnType<typeof setTimeout>|null>(null);
  useLayoutEffect(()=>{transient.current=activeCamera;svgRef.current?.querySelector('.territory-camera-overlay')?.removeAttribute('transform');},[activeCamera.x,activeCamera.y,activeCamera.zoom,size.width,size.height]);
  useEffect(()=>()=>{if(wheelCommit.current)clearTimeout(wheelCommit.current);},[]);
  const presentCamera=(next:TerritoryCamera,commit=false)=>{
    transient.current=next;
    svgRef.current?.querySelector('.territory-camera-overlay')?.setAttribute('transform',cameraOverlayTransform(activeCamera,next,size,'territory'));
    rootRef.current?.dispatchEvent(new CustomEvent('map-camera',{detail:next}));
    if(commit||performance.now()-lastCameraCommit.current>=100){lastCameraCommit.current=performance.now();onCameraChange(next);}
  };


  useEffect(()=>{
    const node=rootRef.current;if(!node)return;
    const observer=new ResizeObserver(entries=>{const box=entries[0]?.contentRect;if(box?.width&&box.height)setSize({width:box.width,height:box.height});});
    observer.observe(node);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const node=rootRef.current;if(!node)return;
    const preventSelection=(event:Event)=>event.preventDefault();
    node.addEventListener('selectstart',preventSelection);
    return()=>node.removeEventListener('selectstart',preventSelection);
  },[]);
  useEffect(()=>{let active=true;loadAssetManifest().then(value=>{if(active)setManifest(value);}).catch(()=>{if(active)setManifestError(true);});return()=>{active=false;};},[]);
  useEffect(()=>{
    if(camera||size.width<20||size.height<20)return;
    const points=[...settlement.buildings.flatMap(building=>pointsForBuilding(building,origin)),...heatBoundary(origin,Math.max(actualRadius,10))];
    onCameraChange(fitWorldBounds(points,size,90,PX_PER_ISO_METRE));
  },[camera,size.width,size.height,settlement,origin.x,origin.y,actualRadius,onCameraChange]);
  useEffect(()=>{
    if(!focusedBuildingId)return;
    const building=settlement.buildings.find(item=>item.id===focusedBuildingId);
    if(building){
      const point={x:origin.x+building.x,y:origin.y+building.y};
      onCameraChange(previous=>({...activeCamera,...(previous??{}),x:point.x,y:point.y,zoom:Math.max(.78,previous?.zoom??0)}));
      onSelectEntity(building.ref);
    }
    onFocusHandled();
  },[focusedBuildingId]);
  useEffect(()=>{
    if(!followPlayer)return;
    onCameraChange(previous=>{
      const current=previous??activeCamera;
      return {...current,x:playerPosition.x,y:playerPosition.y,zoom:Math.max(.78,current.zoom)};
    });
  },[followPlayer,playerPosition.x,playerPosition.y]);

  const denseFixture=useMemo<LayoutDraft[]>(()=>Array.from({length:520},(_,index)=>({
    id:`qa-dense-${String(index+1).padStart(3,'0')}`,definitionId:'qa-dense-fixture',assetId:'lord-house-damaged',
    x:100+((index%26)*3),y:-80+(Math.floor(index/26)*3),orientation:'north',footprint:fixtureFootprint,
  })),[]);
  const knownBounds=useMemo(()=>{
    const points=[...settlement.buildings.flatMap(building=>pointsForBuilding(building,origin)),...heatBoundary(origin,Math.max(actualRadius,35))].map(worldToIso);
    return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};
  },[settlement.buildings,origin.x,origin.y,actualRadius]);
  const toMini=(point:WorldPoint)=>{
    const projected=worldToIso(point),pad=12;
    return {x:pad+(projected.x-knownBounds.minX)/Math.max(1,knownBounds.maxX-knownBounds.minX)*(146-pad*2),y:pad+(projected.y-knownBounds.minY)/Math.max(1,knownBounds.maxY-knownBounds.minY)*(94-pad*2)};
  };
  const miniViewport=useMemo(()=>[
    screenToWorld({x:0,y:0},activeCamera,size),screenToWorld({x:size.width,y:0},activeCamera,size),screenToWorld({x:size.width,y:size.height},activeCamera,size),screenToWorld({x:0,y:size.height},activeCamera,size),
  ].map(toMini).map(point=>`${point.x},${point.y}`).join(' '),[activeCamera,size.width,size.height,knownBounds]);
  const bounds=useMemo(()=>worldBounds(activeCamera,size.width,size.height),[activeCamera,size.width,size.height]);
  const step=gridStep(activeCamera.zoom);
  const gridLines=useMemo(()=>{
    if(!step)return [];
    const result:{key:string;from:WorldPoint;to:WorldPoint;major:boolean}[]=[];
    const startX=Math.floor(bounds.minX/step)*step,endX=Math.ceil(bounds.maxX/step)*step;
    const startY=Math.floor(bounds.minY/step)*step,endY=Math.ceil(bounds.maxY/step)*step;
    if((endX-startX)/step<220)for(let x=startX;x<=endX;x+=step)result.push({key:`x${x}`,from:{x,y:bounds.minY-step},to:{x,y:bounds.maxY+step},major:x%(step*5)===0});
    if((endY-startY)/step<220)for(let y=startY;y<=endY;y+=step)result.push({key:`y${y}`,from:{x:bounds.minX-step,y},to:{x:bounds.maxX+step,y},major:y%(step*5)===0});
    return result;
  },[bounds,step]);
  const onScreen=(point:WorldPoint,margin=140,asset?:ReturnType<typeof findAsset>)=>{const p=worldToScreen(point,activeCamera,size,PX_PER_ISO_METRE);if(asset){const r=spriteRect(asset,p,3*activeCamera.zoom);return r.x+r.width>=0&&r.y+r.height>=0&&r.x<=size.width&&r.y<=size.height;}return p.x>=-margin&&p.y>=-margin&&p.x<=size.width+margin&&p.y<=size.height+margin;};
  const visibleBuildings=useMemo(()=>settlement.buildings.filter(building=>onScreen({x:origin.x+building.x,y:origin.y+building.y},0,findAsset(manifest,resolveSettlementAssetId(manifest,building.assetId,settlement.fireLevel,building.ref.id===settlement.fireRef.id,building.visualState,building.level)))).slice().sort((a,b)=>{
    const pa=worldToScreen({x:origin.x+a.x,y:origin.y+a.y},activeCamera,size,PX_PER_ISO_METRE);
    const pb=worldToScreen({x:origin.x+b.x,y:origin.y+b.y},activeCamera,size,PX_PER_ISO_METRE);
    return pa.y-pb.y||a.id.localeCompare(b.id);
  }),[settlement.buildings,origin.x,origin.y,activeCamera,size.width,size.height,manifest,settlement.fireLevel]);
  const visibleDrafts=useMemo(()=>drafts.filter(draft=>onScreen({x:origin.x+draft.x,y:origin.y+draft.y})),[drafts,origin.x,origin.y,activeCamera,size.width,size.height]);
  const visibleQa=useMemo(()=>denseQa?denseFixture.filter(item=>onScreen({x:origin.x+item.x,y:origin.y+item.y})):[],[denseQa,denseFixture,origin.x,origin.y,activeCamera,size.width,size.height]);
  const scale=PX_PER_ISO_METRE*activeCamera.zoom;
  const firePoint=worldToScreen(origin,activeCamera,size,PX_PER_ISO_METRE);
  const playerPoint=worldToScreen(playerPosition,activeCamera,size,PX_PER_ISO_METRE);
  const heatRx=2*Math.SQRT2*displayedRadius*scale,heatRy=Math.SQRT2*displayedRadius*scale;
  const scaleDistance=10**Math.floor(Math.log10(Math.max(.001,100/(scale*Math.sqrt(5)))));
  const scalePixels=scaleDistance*scale*Math.sqrt(5);
  const actualInside=settlement.buildings.filter(building=>footprintHeatRelation({x:building.x,y:building.y},building.footprint,building.orientation,actualRadius,settlement.fireActive)==='inside').length;
  const actualPartial=settlement.buildings.filter(building=>footprintHeatRelation({x:building.x,y:building.y},building.footprint,building.orientation,actualRadius,settlement.fireActive)==='partial').length;
  const actualOutside=settlement.buildings.length-actualInside-actualPartial;
  const filteredBuildings=settlement.buildings.filter(building=>building.name.toLowerCase().includes(search.toLowerCase()));
  const validation=activeDefinition?validatePlacement({point:ghostWorld?{x:ghostWorld.x-origin.x,y:ghostWorld.y-origin.y}:{x:0,y:0},footprint:activeDefinition.footprint,orientation:placingOrientation,heatRadiusM:actualRadius,heatActive:settlement.fireActive,existing:[...settlement.buildings,...drafts]}):null;
  const currentPlacementPoint=ghostWorld??{x:origin.x,y:origin.y};
  const currentPlacementLocal={x:currentPlacementPoint.x-origin.x,y:currentPlacementPoint.y-origin.y};
  const orientationCycle:LayoutDraft['orientation'][]=['north','east','south','west'];

  const focusWorld=(point:WorldPoint,zoom=Math.max(.72,activeCamera.zoom))=>{if(followPlayer)onFollowPlayerChange(false);onCameraChange(previous=>({...(previous??activeCamera),x:point.x,y:point.y,zoom}));};
  const fitFire=()=>{if(followPlayer)onFollowPlayerChange(false);onCameraChange(fitWorldBounds(heatBoundary(origin,Math.max(actualRadius,8)),size,110,PX_PER_ISO_METRE));};
  const fitBuildings=()=>{if(followPlayer)onFollowPlayerChange(false);onCameraChange(fitWorldBounds(settlement.buildings.flatMap(building=>pointsForBuilding(building,origin)),size,110,PX_PER_ISO_METRE));};
  const fitHeat=()=>{if(followPlayer)onFollowPlayerChange(false);onCameraChange(fitWorldBounds(heatBoundary(origin,Math.max(displayedRadius,1)),size,110,PX_PER_ISO_METRE));};
  const focusBuilding=(building:SettlementBuildingView)=>{
    onSelectEntity(building.ref);
    focusWorld({x:origin.x+building.x,y:origin.y+building.y},Math.max(.8,activeCamera.zoom));
  };
  const startPlacement=(definition:SettlementPlacementDefinition)=>{
    setPlacingId(definition.id);setPlacingOrientation('north');setGhostWorld({x:activeCamera.x,y:activeCamera.y});
    setMessage(`Thử bố trí: ${definition.name}. Bản nháp không tạo công trình.`);
  };
  const cancelPlacement=()=>{setPlacingId(null);setGhostWorld(null);setMessage('Đã hủy chế độ thử bố trí.');};
  const rotatePlacement=()=>{
    const allowed=orientationCycle.filter(orientation=>activeDefinition?.orientations.includes(orientation));
    if(allowed.length<2)return;
    setPlacingOrientation(previous=>allowed[(allowed.indexOf(previous)+1)%allowed.length]??allowed[0]);
  };
  useEffect(()=>{
    if(!activeDefinition)return;
    const onPlacementKeyDown=(event:KeyboardEvent)=>{
      const target=event.target;
      const editing=target instanceof Element&&Boolean(target.closest('input,select,textarea,[contenteditable="true"],[role="textbox"]'));
      if(event.key==='Escape'){
        event.preventDefault();event.stopPropagation();cancelPlacement();return;
      }
      if(event.key.toLowerCase()==='r'&&!event.repeat&&!editing&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
        event.preventDefault();event.stopPropagation();rotatePlacement();
      }
    };
    document.addEventListener('keydown',onPlacementKeyDown,true);
    return()=>document.removeEventListener('keydown',onPlacementKeyDown,true);
  },[activeDefinition,cancelPlacement,rotatePlacement]);
  const localPointer=(event:ReactPointerEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top};};
  const pointerDown=(event:ReactPointerEvent<SVGSVGElement>)=>{
    if(event.button!==0&&event.pointerType!=='touch')return;
    const target=event.target;
    const playerMarker=target instanceof Element&&Boolean(target.closest('.territory-player-marker'));
    if(target instanceof Element&&target.closest('button,input,select,[role="button"]')&&!target.closest('.territory-building')&&!playerMarker)return;
    const point=localPointer(event);
    if(event.pointerType==='touch'){
      touches.current.set(event.pointerId,point);
      if(touches.current.size>=2){const [[first,a],[second,b]]=Array.from(touches.current);const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        pinch.current={ids:[first,second],distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),anchor:screenToWorld(center,transient.current,size),origin:transient.current};
        gesture.current=null;ignoreClick.current=true;if(activeDefinition)cancelPlacement();
        try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}return;
      }
    }
    gesture.current={pointerId:event.pointerId,x:point.x,y:point.y,origin:transient.current,moved:false,playerMarker};
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{ /* Pointer may already be released by the browser. */ }
  };
  const pointerMove=(event:ReactPointerEvent<SVGSVGElement>)=>{
    const point=localPointer(event);
    if(touches.current.has(event.pointerId))touches.current.set(event.pointerId,point);
    if(pinch.current){const p=pinch.current,a=touches.current.get(p.ids[0]),b=touches.current.get(p.ids[1]);if(!a||!b)return;
      const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2},zoom=Math.max(.002,Math.min(3,p.origin.zoom*Math.hypot(a.x-b.x,a.y-b.y)/p.distance)),anchor=worldToIso(p.anchor);
      if(followPlayer)onFollowPlayerChange(false);
      presentCamera({...isoToWorld({x:anchor.x-(center.x-size.width/2)/(3*zoom),y:anchor.y-(center.y-size.height/2)/(3*zoom)}),zoom});return;
    }
    if(activeDefinition)setGhostWorld(screenToWorld(point,transient.current,size,PX_PER_ISO_METRE));
    const current=gesture.current;if(!current||current.pointerId!==event.pointerId)return;
    const dx=point.x-current.x,dy=point.y-current.y;
    if(!current.moved&&Math.hypot(dx,dy)<6)return;
    if(!current.moved&&followPlayer)onFollowPlayerChange(false);
    current.moved=true;
    presentCamera({...screenToWorld({x:size.width/2-dx,y:size.height/2-dy},current.origin,size,PX_PER_ISO_METRE),zoom:current.origin.zoom});
  };
  const pointerUp=(event:ReactPointerEvent<SVGSVGElement>)=>{
    touches.current.delete(event.pointerId);
    if(pinch.current){presentCamera(transient.current,true);pinch.current=null;ignoreClick.current=true;
      if(touches.current.size===1){const [id,p]=Array.from(touches.current)[0];gesture.current={pointerId:id,x:p.x,y:p.y,origin:transient.current,moved:true,playerMarker:false};}
      else gesture.current=null;
      try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}catch{}
      setTimeout(()=>{ignoreClick.current=false;},0);return;
    }
    const activeGesture=gesture.current;
    if(activeGesture?.pointerId===event.pointerId&&activeGesture.moved){ignoreClick.current=true;window.setTimeout(()=>{ignoreClick.current=false;},0);}
    else if(activeGesture?.pointerId===event.pointerId&&activeGesture.playerMarker){
      ignoreClick.current=true;
      onOpenPlayerProfile();
      window.setTimeout(()=>{ignoreClick.current=false;},0);
    }
    if(activeGesture?.moved)presentCamera(transient.current,true);
    gesture.current=null;
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}catch{ /* already released */ }
  };
  const canvasClick=(event:React.MouseEvent<SVGSVGElement>)=>{
    if(ignoreClick.current)return;
    if(event.target instanceof Element&&event.target.closest('.territory-player-marker'))return;
    if(event.target instanceof Element&&event.target.closest('.territory-building')&&!activeDefinition)return;
    if(!activeDefinition)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const world=screenToWorld({x:event.clientX-rect.left,y:event.clientY-rect.top},transient.current,size,PX_PER_ISO_METRE);
    const local=snapPlanningPoint({x:world.x-origin.x,y:world.y-origin.y});
    const item:LayoutDraft={id:`draft-${nextDraft.current++}`,definitionId:activeDefinition.id,assetId:activeDefinition.assetId,x:local.x,y:local.y,orientation:placingOrientation,footprint:activeDefinition.footprint};
    onDraftsChange(previous=>[...previous,item]);
    setMessage(`Đã thêm bản nháp tại (${local.x}, ${local.y}) m. Không gửi lệnh xây dựng.`);
  };
  const keyDown=(event:React.KeyboardEvent<SVGSVGElement>)=>{
    const target=event.target;
    if(target instanceof Element&&target.closest('input,select,textarea,[contenteditable="true"]'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();if(followPlayer)onFollowPlayerChange(false);const amount=48;
      const dx=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0;
      const dy=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0;
      onCameraChange(previous=>{const current=previous??activeCamera;return {...screenToWorld({x:size.width/2-dx,y:size.height/2-dy},current,size,PX_PER_ISO_METRE),zoom:current.zoom};});
    }else if(event.key.toLowerCase()==='p'){
      event.preventDefault();onReadabilityChange(readability==='planning'?'normal':'planning');
    }else if(event.key==='+'||event.key==='='){
      event.preventDefault();onCameraChange(previous=>zoomAtScreenPoint(previous??activeCamera,{x:size.width/2,y:size.height/2},size,(previous??activeCamera).zoom*1.2,PX_PER_ISO_METRE));
    }else if(event.key==='-'){
      event.preventDefault();onCameraChange(previous=>zoomAtScreenPoint(previous??activeCamera,{x:size.width/2,y:size.height/2},size,(previous??activeCamera).zoom/1.2,PX_PER_ISO_METRE));
    }
  };
  useEffect(()=>{
    const node=rootRef.current;if(!node)return;
    const onWheel=(event:WheelEvent)=>{
      const target=event.target;
      if(!(target instanceof Element)||!target.closest('.territory-scene-svg')||target.closest('button,input,select'))return;
      const rect=svgRef.current?.getBoundingClientRect();if(!rect)return;
      const point=followPlayer?{x:size.width/2,y:size.height/2}:{x:event.clientX-rect.left,y:event.clientY-rect.top};
      const zoom=transient.current.zoom*Math.exp(-Math.max(-480,Math.min(480,event.deltaY))*.0014);
      event.preventDefault();presentCamera(zoomAtScreenPoint(transient.current,point,size,zoom,PX_PER_ISO_METRE));if(wheelCommit.current)clearTimeout(wheelCommit.current);wheelCommit.current=setTimeout(()=>presentCamera(transient.current,true),120);
    };
    node.addEventListener('wheel',onWheel,{passive:false});return()=>node.removeEventListener('wheel',onWheel);
  },[camera,activeCamera,size,onCameraChange,followPlayer]);
  const changeMinimap=(event:React.MouseEvent<SVGSVGElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    const sx=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),sy=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
    const pad=12;
    const target=isoToWorld({x:knownBounds.minX+Math.max(0,Math.min(1,(sx*146-pad)/(146-pad*2)))*Math.max(1,knownBounds.maxX-knownBounds.minX),y:knownBounds.minY+Math.max(0,Math.min(1,(sy*94-pad)/(94-pad*2)))*Math.max(1,knownBounds.maxY-knownBounds.minY)});
    focusWorld(target);
  };
  const frameDenseQa=()=>{
    if(followPlayer)onFollowPlayerChange(false);
    setDenseQa(true);
    const points=denseFixture.flatMap(item=>[{x:origin.x+item.x-1,y:origin.y+item.y-1},{x:origin.x+item.x+1,y:origin.y+item.y+1}]);
    onCameraChange(fitWorldBounds(points,size,65,PX_PER_ISO_METRE));
    setMessage('Đang xem nhóm 520 công trình minh họa.');
  };
  const assetIds=manifest?.assets.map(asset=>asset.assetId)??[];
  const selectedCalibrationAsset=findAsset(manifest,calibrationAssetId);
  const densityLabel=activeCamera.zoom<.035?'Toàn cảnh · bố cục tổng thể':activeCamera.zoom<.16?'Khu vực · biểu tượng gọn':'Cận cảnh · công trình';
  const fireNorth=worldToScreen({x:origin.x,y:origin.y+Math.max(actualRadius,10)},activeCamera,size,PX_PER_ISO_METRE);
  const buildingLayer=[...visibleBuildings.map(building=>({id:building.id,name:building.name,assetId:building.assetId,level:building.level,visualState:building.visualState,point:{x:origin.x+building.x,y:origin.y+building.y},footprint:building.footprint,orientation:building.orientation,ref:building.ref,draft:false,blocked:false})),
    ...visibleDrafts.map(draft=>({id:draft.id,name:placementDefinitions.find(def=>def.id===draft.definitionId)?.name??'Bản nháp',assetId:draft.assetId,level:undefined,visualState:undefined,point:{x:origin.x+draft.x,y:origin.y+draft.y},footprint:draft.footprint,orientation:draft.orientation,ref:null,draft:true,blocked:validatePlacement({point:{x:draft.x,y:draft.y},footprint:draft.footprint,orientation:draft.orientation,heatRadiusM:actualRadius,heatActive:settlement.fireActive,existing:[...settlement.buildings,...drafts],ignoreId:draft.id}).blockers.length>0}))];

  const selectedGround=settlement.buildings.find(b=>b.ref.id===selectedRef?.id);
  const isOccluder=(point:WorldPoint,asset:ReturnType<typeof findAsset>,selected:boolean)=>{
    if(!asset||selected||!selectedGround)return false;
    const target=worldToScreen({x:origin.x+selectedGround.x,y:origin.y+selectedGround.y},activeCamera,size);
    const ground=worldToScreen(point,activeCamera,size);
    return ground.y>target.y&&pointInPolygon(target,artPolygon(asset.occlusionRegion.upper,spriteRect(asset,ground,scale)));
  };
  const renderDrafts=[...drafts,...(denseQa?denseFixture:[]),...(activeDefinition?[{id:'placement-ghost',definitionId:activeDefinition.id,assetId:activeDefinition.assetId,x:currentPlacementLocal.x,y:currentPlacementLocal.y,footprint:activeDefinition.footprint,orientation:placingOrientation}]:[])];
  const renderSnapshot=useMemo(()=>territorySnapshot(settlement,manifest,activeCamera,effectiveMode,selectedRef?.id??null,renderDrafts,{visualIdentity,modeledInfill:!liveApi,regions:terrainRegions}),[settlement,manifest,activeCamera,effectiveMode,selectedRef?.id,drafts,denseQa,activeDefinition,ghostWorld,placingOrientation,visualIdentity,terrainRegions,liveApi]);
  const captureSelection=(event:React.MouseEvent<SVGSVGElement>)=>{
    if(ignoreClick.current){ignoreClick.current=false;event.preventDefault();event.stopPropagation();return;}
    if(activeDefinition||event.detail===0||event.target instanceof Element&&event.target.closest('.territory-player-marker'))return;
    const point=pointerCSS({x:event.clientX,y:event.clientY},event.currentTarget.getBoundingClientRect(),size);
    const order=depthOrder(projectBuildings(renderSnapshot.buildings,p=>worldToScreen(p,transient.current,size),3*transient.current.zoom,size)).objects;
    const focused=order.find(b=>b.selected);
    const stack=pickStack(point,order.map(b=>{
      const f=b.footprint;
      const ground=[{x:f.minX,y:f.minY},{x:f.maxX,y:f.minY},{x:f.maxX,y:f.maxY},{x:f.minX,y:f.maxY}].map(p=>worldToScreen(p,transient.current,size));
      const faded=effectiveMode==='focus'&&focused&&!b.selected&&b.depth>focused.depth&&pointInPolygon(focused.ground,artPolygon(b.asset!.occlusionRegion.upper,b.rect));
      return {id:b.id,ground,silhouette:faded?[]:artPolygon(b.asset!.hitPolygon??b.asset!.artFootprint,b.rect),silhouettes:faded?[]:[artPolygon(b.asset!.occlusionRegion.upper,b.rect)],selectable:!b.draft};
    }),effectiveMode==='planning');
    if(!stack.length)return;
    const previous=lastPick.current,repeated=previous&&Math.hypot(previous.point.x-point.x,previous.point.y-point.y)<6&&previous.ids.join('|')===stack.join('|');
    const selected=settlement.buildings.find(b=>b.ref.id===selectedRef?.id)?.id??null;
    const id=repeated||event.altKey?cyclePick(stack,selected):stack[0];
    const building=settlement.buildings.find(b=>b.id===id);
    if(building){event.preventDefault();event.stopPropagation();lastPick.current={point,ids:stack};onSelectEntity(building.ref);}
  };

  return <section className="territory-scene-shell" aria-label="Bố cục lãnh địa">
    <div className="territory-toolbar">
      <div className="territory-toolbar-title"><span className="territory-eyebrow"><Snowflake size={14}/> LÃNH ĐỊA</span><strong>{densityLabel}</strong></div>
      <div className="territory-camera-actions" role="group" aria-label="Khung nhìn lãnh địa">
        <button onClick={()=>setShowGrid(value=>!value)} aria-pressed={showGrid}><Grid3X3 size={15}/> Lưới</button>
        {followPlayer&&<button className="territory-follow-button" aria-pressed="true" onClick={()=>onFollowPlayerChange(false)}><LocateFixed size={15}/> Theo dõi {playerName} · Mở khóa</button>}
        <button onClick={fitFire} title="Về lửa trại"><Flame size={15}/> Về lửa trại</button>
        <button onClick={fitHeat} title="Toàn bộ vùng nhiệt"><ThermometerSun size={15}/> Toàn bộ vùng nhiệt</button>
        <button onClick={fitBuildings} title="Các công trình"><Maximize2 size={15}/> Các công trình</button>
        <button onClick={()=>onCameraChange(previous=>zoomAtScreenPoint(previous??activeCamera,{x:size.width/2,y:size.height/2},size,(previous??activeCamera).zoom*1.2,PX_PER_ISO_METRE))} aria-label="Phóng to lãnh địa"><Plus size={15}/></button>
        <button onClick={()=>onCameraChange(previous=>zoomAtScreenPoint(previous??activeCamera,{x:size.width/2,y:size.height/2},size,(previous??activeCamera).zoom/1.2,PX_PER_ISO_METRE))} aria-label="Thu nhỏ lãnh địa"><Minus size={15}/></button>
      </div>
    </div>
    <div className="territory-status-row">
      <span><ThermometerSun size={14}/> Nhiệt thật: <b>{settlement.fireActive?`${settlement.heatRadiusM} m`:'Tắt'}</b></span>
      <span className={heatPreview==='actual'?'':'is-preview'}>Hiển thị: {displayedRadius>=1000?`${(displayedRadius/1000).toLocaleString('vi-VN')} km`:`${displayedRadius} m`}{heatPreview!=='actual'?' · xem thử':''}</span>
      <span><Compass size={14}/> Bao phủ nền: {actualInside} trong · {actualPartial} giao cắt · {actualOutside} ngoài · luật chưa xác định</span>
      {!liveApi&&<label className="territory-heat-preview">Xem thử vùng nhiệt <select aria-label="Xem thử vùng nhiệt" value={heatPreview} onChange={event=>setHeatPreview(event.target.value as typeof heatPreview)}><option value="actual">Nguồn thực tế</option><option value="2500">2.5 km · minh họa</option><option value="25000">25 km · minh họa</option><option value="off">Tắt · minh họa</option></select></label>}
    </div>
    <div className="territory-stage" ref={rootRef}>
      <MapCanvas snapshot={renderSnapshot} label="Địa hình và công trình lãnh địa. Dùng danh sách công trình hoặc điều khiển mặt bằng để chọn."/>
      <svg ref={svgRef} className="territory-scene-svg" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="Lãnh địa theo phối cảnh isometric cố định. Kéo để di chuyển, cuộn để thu phóng, dùng phím mũi tên để điều hướng."
        tabIndex={0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{presentCamera(transient.current,true);gesture.current=null;pinch.current=null;touches.current.clear();ignoreClick.current=true;setTimeout(()=>{ignoreClick.current=false;},0);}} onLostPointerCapture={event=>{if(gesture.current?.pointerId===event.pointerId){presentCamera(transient.current,true);gesture.current=null;}}} onClickCapture={captureSelection} onClick={canvasClick} onKeyDown={keyDown}>
        <g className="territory-camera-overlay">
        {displayedRadius>0&&<ellipse cx={firePoint.x} cy={firePoint.y} rx={heatRx} ry={heatRy} fill="none" stroke="#efbf7f" strokeOpacity=".78" strokeWidth="1.6" strokeDasharray="7 6" pointerEvents="none"/>}
        {(showGrid||effectiveMode==='planning')&&gridLines.map(line=>{const a=worldToScreen(line.from,activeCamera,size,PX_PER_ISO_METRE),b=worldToScreen(line.to,activeCamera,size,PX_PER_ISO_METRE);return <line key={line.key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={line.major?'#c7d8d3':'#a6c1bd'} strokeOpacity={line.major?.13:.06} strokeWidth={line.major?1:.7} pointerEvents="none"/>;})}
        {buildingLayer.map(item=>{
          const isFire=Boolean(item.ref?.id===settlement.fireRef.id);
          const resolvedArtId=resolveSettlementAssetId(manifest,item.assetId,settlement.fireLevel,isFire,item.visualState,item.level);
          const selected=Boolean(item.ref&&selectedRef?.id===item.ref.id);
          const inHeat=footprintHeatRelation({x:item.point.x-origin.x,y:item.point.y-origin.y},item.footprint,item.orientation,actualRadius,settlement.fireActive);
          const building=settlement.buildings.find(candidate=>candidate.id===item.id);
          return <g key={item.id}>
            <BuildingSprite geometryOnly id={item.id} name={item.name} asset={findAsset(manifest,resolvedArtId)} assetId={resolvedArtId} activeEffect={isFire&&settlement.fireActive} point={item.point} footprint={item.footprint} orientation={item.orientation} camera={activeCamera} viewport={size} mode={effectiveMode} selected={selected} faded={readability==='focus'&&isOccluder(item.point,findAsset(manifest,resolvedArtId),selected)} draft={item.draft} blocked={item.blocked} onSelect={item.ref?()=>{onSelectEntity(item.ref!);}:undefined}/>
            {activeCamera.zoom>.28&&inHeat!=='inside'&&item.ref&&<text x={worldToScreen(item.point,activeCamera,size).x} y={worldToScreen(item.point,activeCamera,size).y+18} className="territory-heat-state" textAnchor="middle" pointerEvents="none">{inHeat==='partial'?'Nhiệt giao cắt':'Ngoài nhiệt'}</text>}
            {selected&&building&&<circle cx={worldToScreen(item.point,activeCamera,size).x} cy={worldToScreen(item.point,activeCamera,size).y} r="18" fill="none" stroke="#ffe0a4" strokeOpacity=".76" strokeDasharray="3 4" pointerEvents="none"/>}
          </g>;
        })}
        {denseQa&&visibleQa.map(item=><BuildingSprite geometryOnly key={item.id} id={item.id} name="Fixture QA" asset={findAsset(manifest,item.assetId)} assetId={item.assetId} point={{x:origin.x+item.x,y:origin.y+item.y}} footprint={item.footprint} orientation={item.orientation} camera={activeCamera} viewport={size} mode={effectiveMode} selected={false} faded={false} draft/>) }
        {activeDefinition&&<BuildingSprite geometryOnly id="placement-ghost" name={activeDefinition.name} asset={findAsset(manifest,activeDefinition.assetId)} assetId={activeDefinition.assetId} point={snapPlanningPoint(currentPlacementPoint)} footprint={activeDefinition.footprint} orientation={placingOrientation} camera={activeCamera} viewport={size} mode="planning" selected={false} faded={false} draft blocked={Boolean(validation?.blockers.length)}/>}
        {showPlayerMarker&&<g className="territory-player-marker" transform={`translate(${playerPoint.x} ${playerPoint.y})`} role="button" tabIndex={0} aria-label={`${playerName} — mở hồ sơ người chơi`}
          onClick={onOpenPlayerProfile}
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpenPlayerProfile();}}}>
          <circle r="17" fill="#123c4b" stroke="#ffe1a9" strokeWidth="2"/>
          <circle r="13" fill="none" stroke="#a6d7d2" strokeWidth="1" strokeDasharray="2.5 2.5"/>
          <circle cy="-3.5" r="3.5" fill="#f4d39b"/><path d="M-6.5 7c.7-5 3.6-7.2 6.5-7.2S5.8 2 6.5 7" fill="#7fc0bd" stroke="#e0ece1" strokeWidth="1.2" strokeLinecap="round"/>
        </g>}
        <g className="territory-north" transform={`translate(${Math.min(size.width-35,Math.max(25,fireNorth.x))} ${Math.min(size.height-30,Math.max(35,fireNorth.y))}) rotate(63.435)`} pointerEvents="none"><path d="M0 14V-13m0 0-6 8m6-8 6 8" stroke="#d5e2d9" strokeWidth="2"/><text x="0" y="-20" textAnchor="middle">N</text></g>
        </g>
      </svg>
      <div className="territory-stage-tools"><button aria-pressed={readability==='normal'} onClick={()=>onReadabilityChange('normal')}>Bình thường</button><button aria-pressed={readability==='focus'} onClick={()=>onReadabilityChange(readability==='focus'?'normal':'focus')}><Eye size={14}/> Làm mờ phần che</button>{!liveApi&&<button aria-pressed={readability==='planning'} onClick={()=>onReadabilityChange(readability==='planning'?'normal':'planning')}><Grid3X3 size={14}/> Mặt bằng</button>}</div>
      <div className="territory-scale"><span style={{width:Math.max(12,Math.min(110,scalePixels))}}/><b>{scaleDistance>=1000?`${scaleDistance/1000} km`:`${scaleDistance} m`}</b></div>
      <div className="territory-drag-hint">{activeDefinition?'Chạm mặt đất để đặt bản nháp · R xoay · Esc hủy':'Kéo để di chuyển · Cuộn để thu phóng · 1 m lưới khi xem gần'}</div>
      <div className="territory-minimap-wrap"><div className="territory-minimap-heading">Bố cục đã biết</div><svg className="territory-minimap" viewBox="0 0 146 94" aria-label="Minimap lãnh địa" onClick={changeMinimap}>
        <rect x="0" y="0" width="146" height="94" rx="6" fill="#0c222c" stroke="#66858d"/>
        {displayedRadius>0&&(()=>{const points=heatBoundary(origin,displayedRadius).map(toMini);return <polygon points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(232,182,117,.1)" stroke="#c99c68" strokeDasharray="3 3" pointerEvents="none"/>;})()}
        {settlement.buildings.map(building=>{const point=toMini({x:origin.x+building.x,y:origin.y+building.y});return <circle key={building.id} cx={point.x} cy={point.y} r={building.id===settlement.fireRef.id?3.2:2.3} fill={building.id===settlement.fireRef.id?'#edaa63':'#add0cc'} pointerEvents="none"/>;})}
        <polygon points={miniViewport} fill="rgba(147,202,196,.08)" stroke="#d1e5dc" strokeWidth="1.2" pointerEvents="none"/>
      </svg></div>
      {activeDefinition&&<div className={`territory-placement-status ${validation?.blockers.length?'is-blocked':''}`} role="status"><strong>{validation?.blockers.length?'Vị trí bị cản trở':validation?.heat==='inside'?'Nằm trong vùng nhiệt':'Điều kiện xây dựng chưa xác định'}</strong>
        <span>{validation?.blockers.join(' · ')||validation?.warnings.join(' ')}</span><small>Vị trí xem trước: {currentPlacementLocal.x.toFixed(0)}, {currentPlacementLocal.y.toFixed(0)} m · chưa tạo công trình</small></div>}
    </div>
    <div className="territory-legend"><span><i className="heat-legend"/> Vùng nhiệt</span><span><i className="footprint-legend"/> Nền công trình</span><span><i className="unknown-legend"/> Điều kiện xây dựng chưa biết</span><span><i className="memory-legend"/> Địa hình chưa được khảo sát</span></div>
    <div className="territory-workbench">
      {!liveApi&&<section className="panel territory-build-tray">
        <div className="territory-section-heading"><div><span className="eyebrow">BỐ TRÍ MINH HỌA</span><h3>Công trình</h3></div>{placingId&&<button className="text-button" onClick={cancelPlacement}><X size={14}/> Hủy</button>}</div>
        <div className="territory-definition-grid">{placementDefinitions.map(definition=>{
          const artwork=findAsset(manifest,definition.assetId);
          return <article className={`territory-definition${placingId===definition.id?' is-active':''}`} key={definition.id}>
            <img src={artwork?.layers.body??artwork?.layers.uiIcon??'/assets/buildings/lord-house-damaged/icon.svg'} alt=""/>
            <div><strong>{definition.name}</strong><small>{definition.footprint.widthM} × {definition.footprint.depthM} m · kích thước minh họa</small><small>Chi phí: chưa xác định</small></div>
            <button onClick={()=>startPlacement(definition)} aria-label={`Thử bố trí ${definition.name}`}>Đặt thử</button>
          </article>;
        })}</div>
        {placingId&&<div className="territory-placement-controls"><span><b>{activeDefinition?.name}</b> · hướng {ORIENTATION_LABEL[placingOrientation]} · lưới 1 m</span><button onClick={rotatePlacement} disabled={(activeDefinition?.orientations.length??0)<2}><RotateCw size={15}/> Xoay 90° <kbd>R</kbd></button><button onClick={cancelPlacement}><X size={15}/> Hủy</button></div>}
        <p className="territory-fixture-note"><AlertTriangle size={14}/> Mặt bằng và chi phí vật liệu đang được hoàn thiện. Vùng nhiệt không tự quyết định quyền xây.</p>
      </section>}
      <section className="panel territory-instance-panel">
        <div className="territory-section-heading"><div><span className="eyebrow">CÔNG TRÌNH ĐÃ BIẾT</span><h3>Công trình tại lãnh địa</h3></div><label className="territory-search"><Search size={14}/><input aria-label="Tìm công trình trong lãnh địa" placeholder="Lọc công trình" value={search} onChange={event=>setSearch(event.target.value)}/></label></div>
        <div className="territory-instance-list" role="list">{filteredBuildings.map(building=>{
          const heat=footprintHeatRelation({x:building.x,y:building.y},building.footprint,building.orientation,actualRadius,settlement.fireActive);
          const selected=selectedRef?.id===building.ref.id;
          const artwork=findAsset(manifest,resolveSettlementAssetId(manifest,building.assetId,settlement.fireLevel,building.ref.id===settlement.fireRef.id,building.visualState,building.level));
          return <div className={`territory-instance${selected?' is-selected':''}`} key={building.id} role="listitem"><button className="territory-instance-main" onClick={()=>focusBuilding(building)}><span className="territory-instance-icon"><img src={artwork?.layers.body??artwork?.layers.uiIcon??'/assets/buildings/survival-fire-l01/icon.svg'} alt=""/></span><span><b>{building.name}</b><small>{building.x>=0?'+':''}{building.x}, {building.y>=0?'+':''}{building.y} m · {heat==='inside'?'Trong nhiệt':heat==='partial'?'Giao cắt':'Ngoài nhiệt'}</small></span><LocateFixed size={15}/></button><button className="territory-instance-focus" onClick={()=>{focusBuilding(building);setMessage(`Đang xem ${building.name}; vị trí nguồn không đổi.`);}}>Đến</button><small className="territory-instance-state">{building.state} · kích thước mặt bằng tạm tính</small></div>;
        })}{filteredBuildings.length===0&&<p className="muted-text">Không có công trình khớp bộ lọc.</p>}</div>
        {!liveApi&&drafts.length>0&&<div className="territory-draft-list"><div><b>Bố trí đang xem trước</b><button className="text-button" onClick={()=>{onDraftsChange([]);setMessage('Xóa bố trí xem trước.');}}>Xóa tất cả</button></div>{drafts.map(draft=>{const validation=validatePlacement({point:{x:draft.x,y:draft.y},footprint:draft.footprint,orientation:draft.orientation,heatRadiusM:actualRadius,heatActive:settlement.fireActive,existing:[...settlement.buildings,...drafts],ignoreId:draft.id});const definitionName=placementDefinitions.find(item=>item.id===draft.definitionId)?.name??'Công trình';return <div key={draft.id}><span>{definitionName} · ({draft.x}, {draft.y}) m · {validation.blockers.length?'bị cản trở':'có thể đặt'}</span><button aria-label={`Xoay ${definitionName}`} onClick={()=>onDraftsChange(previous=>previous.map(item=>item.id===draft.id?{...item,orientation:orientationCycle[(orientationCycle.indexOf(item.orientation)+1)%orientationCycle.length]}:item))}><RotateCw size={14}/></button><button aria-label={`Xóa ${definitionName}`} onClick={()=>onDraftsChange(previous=>previous.filter(item=>item.id!==draft.id))}><X size={14}/></button></div>;})}</div>}
      </section>
    </div>
    {!liveApi&&<details className="panel territory-calibration" open={calibrationOpen} onToggle={event=>setCalibrationOpen(event.currentTarget.open)}><summary><span><EyeOff size={15}/> Hiệu chỉnh hình minh họa</span><small>Chỉ thay đổi cách hiển thị</small></summary>
      <div className="territory-calibration-body"><div className="territory-calibration-preview"><svg viewBox="0 0 240 200" aria-label="Hiệu chỉnh vị trí hình ảnh"><defs><pattern id="asset-cal-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#86a6aa" strokeOpacity=".25"/></pattern></defs><rect width="240" height="200" fill="#102a37"/><rect width="240" height="200" fill="url(#asset-cal-grid)"/><image href={selectedCalibrationAsset?.layers.shadow??''} width="240" height="200"/><image href={selectedCalibrationAsset?.layers.base??''} width="240" height="200"/><image href={selectedCalibrationAsset?.layers.upper??''} width="240" height="200"/><line x1="120" y1="0" x2="120" y2="200" stroke="#e4ba7f" strokeDasharray="3 4"/><line x1="0" y1="164" x2="240" y2="164" stroke="#e4ba7f" strokeDasharray="3 4"/><circle cx="120" cy="164" r="5" fill="#ffd897"/></svg><span>Lưới · điểm neo · lớp hình ảnh</span></div>
        <div className="territory-calibration-info"><label>Hình minh họa <select value={calibrationAssetId} onChange={event=>setCalibrationAssetId(event.target.value)}>{assetIds.map(id=><option key={id}>{id}</option>)}</select></label><p>Điểm neo: {selectedCalibrationAsset?`${Math.round(selectedCalibrationAsset.groundAnchor.x*100)}%, ${Math.round(selectedCalibrationAsset.groundAnchor.y*100)}%`:'mặc định'} · khung 240 × 200</p><p>Vùng chọn, che khuất và kích thước hiển thị được căn chỉnh riêng trong thư viện hình ảnh.</p><label className="territory-qa-toggle"><input type="checkbox" checked={denseQa} onChange={event=>setDenseQa(event.target.checked)}/> Hiện 520 công trình minh họa</label><button className="text-button" onClick={frameDenseQa}>Xem nhóm công trình minh họa</button><span>Đang hiển thị {visibleQa.length} / {denseQa?520:0} công trình minh họa.</span><span>{manifestError?'Không tải được thư viện hình ảnh; dùng hình thay thế.':`Đã tải ${manifest?.assets.length??0} hình ảnh.`}</span></div>
      </div>
    </details>}
    <div className="territory-accessible-status" role="status" aria-live="polite">{message||(liveApi?'Vị trí, trạng thái và artwork lấy từ save đang chọn. Điều khiển camera không thay đổi mô phỏng.':'Bản xem thử chỉ hiển thị vị trí và bố trí; không thực hiện lệnh trong thế giới.')}</div>
  </section>;
}
