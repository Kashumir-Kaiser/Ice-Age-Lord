import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from 'react';
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react';
import { Compass, Eye, EyeOff, Globe2, Layers3, LocateFixed, Maximize2, Minus, Moon, Mountain, Plus, Snowflake, Sun, ThermometerSun, TreePine } from 'lucide-react';
import { dayOverlayOpacity, dayPhase, fireForm, formatClock, formatDistance, heatRadiusM, shouldEnterWorldMap, shouldReturnToLocalMap } from './mapModel';
import type { EntityRef, EntityView, VisibleMap } from './game/GameClient';
import { sameEntityRef } from './game/GameClient';
import { clusterMarkers, collisionFreeLabels } from './map/clusterMarkers';
import type { ScreenCluster } from './map/clusterMarkers';
import { BASE_VIEW_HEIGHT_M, MAX_ZOOM, MIN_LOCAL_ZOOM, WORLD_HALF_SPAN_M, fitCircle, mapToScreen, scaleBar, screenToMap, viewBox, viewSize, worldToMap, zoomAtScreenPoint } from './map/camera';
import type { CameraView, Rect, SharedMapCamera } from './map/camera';
import { FogDefinitions, MapEntityGlyph } from './map/MapLayers';
import './map-refinement.css';
import MapCanvas from './rendering/MapCanvas';
import { explorationSnapshot, permittedEntities } from './rendering/MapSceneAdapter';
import { qaWorldFixture } from './rendering/mapFixtures';

type LayerState = { buildings: boolean; resources: boolean; discoveries: boolean };
type PointerPoint = { x: number; y: number; pointerType: string };
type DisplayMarker = ScreenCluster<EntityView> & {
  leader?: { from: { x: number; y: number }; to: { x: number; y: number } };
};
type Gesture =
  | { kind: 'pan'; pointerId: number; start: PointerPoint; origin: CameraView; moved: boolean }
  | { kind: 'pinch'; pointerIds: [number, number]; startDistance: number; anchor: { x: number; y: number }; origin: CameraView; moved: boolean };

type Props = {
  selectedEntity: EntityRef | null;
  onSelectEntity: (ref: EntityRef) => void;
  compact?: boolean;
  clockSeconds: number;
  onClockChange: (seconds: number) => void;
  visibleMap: VisibleMap;
  camera: SharedMapCamera;
  onCameraChange: Dispatch<SetStateAction<SharedMapCamera>>;
  fireLevel: number;
  onFireLevelChange: (level: number) => void;
  fireActive: boolean;
  onFireActiveChange: (active: boolean) => void;
  sourceAtlas: boolean;
  onSourceAtlasChange: (active: boolean) => void;
  showHeat: boolean;
  onShowHeatChange: (active: boolean) => void;
  showExploration: boolean;
  onShowExplorationChange: (active: boolean) => void;
  playerName: string;
  playerPosition: { x: number; y: number };
  followPlayer: boolean;
  onFollowPlayerChange: (active: boolean) => void;
  onOpenPlayerProfile: () => void;
  onOpenFullMap?: () => void;
};

const TIMES = [420, 720, 990, 1005, 1140, 60] as const;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 16, 21, 26, 30] as const;
const entityKey = (entity: EntityView) => entity.ref.type + ':' + entity.ref.id;
const localPoint = (event: ReactPointerEvent<SVGSVGElement>): PointerPoint => {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top, pointerType: event.pointerType };
};
const distance = (a: PointerPoint, b: PointerPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: PointerPoint, b: PointerPoint): PointerPoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, pointerType: 'touch' });

export default function MapScene({
  selectedEntity, onSelectEntity, compact = false, clockSeconds, onClockChange, visibleMap:suppliedVisibleMap, camera, onCameraChange,
  fireLevel, onFireLevelChange, fireActive, onFireActiveChange, sourceAtlas, onSourceAtlasChange,
  showHeat, onShowHeatChange, showExploration, onShowExplorationChange, playerName, playerPosition,
  followPlayer, onFollowPlayerChange, onOpenPlayerProfile, onOpenFullMap,
}: Props) {
  const visibleMap=useMemo(()=>qaWorldFixture(suppliedVisibleMap),[suppliedVisibleMap]);
  const unique = useId().replace(/[^a-zA-Z0-9]/g, '') || 'map';
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, PointerPoint>());
  const gesture = useRef<Gesture | null>(null);
  const ignoreNextClick = useRef(false);
  const [size, setSize] = useState({ width: 880, height: 550 });
  const [labels, setLabels] = useState(true);
  const [layers, setLayers] = useState<LayerState>({ buildings: true, resources: true, discoveries: true });
  const [clusterMembers, setClusterMembers] = useState<string[] | null>(null);

  const minutes = Math.floor((clockSeconds % 86400) / 60);
  const phase = dayPhase(minutes);
  const radius = heatRadiusM(fireLevel, fireActive);
  const world = camera.mode === 'world';
  const activeCamera = world ? camera.world : camera.local;
  const viewHeight = BASE_VIEW_HEIGHT_M / Math.max(MIN_LOCAL_ZOOM, activeCamera.zoom);
  const viewport = useMemo(() => viewBox(activeCamera, size.width, size.height), [activeCamera.x, activeCamera.y, activeCamera.zoom, size.width, size.height]);
  const screenRect: Rect = useMemo(() => ({ x: 0, y: 0, width: size.width, height: size.height }), [size.width, size.height]);
  const currentSightOpacity = dayOverlayOpacity(minutes);
  const playerMapPoint = worldToMap(playerPosition);
  const transientCamera=useRef(activeCamera),lastCameraCommit=useRef(0),wheelCommit=useRef<ReturnType<typeof setTimeout>|null>(null);
  useLayoutEffect(()=>{transientCamera.current=activeCamera;const b=viewBox(activeCamera,size.width,size.height);svgRef.current?.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);},[activeCamera.x,activeCamera.y,activeCamera.zoom,size.width,size.height]);
  useEffect(()=>()=>{if(wheelCommit.current)clearTimeout(wheelCommit.current);},[]);


  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect;
      if (box && box.width > 0 && box.height > 0) setSize({ width: box.width, height: box.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!followPlayer) return;
    onCameraChange(previous => previous.mode === 'local'
      ? { ...previous, local: { ...previous.local, x: playerMapPoint.x, y: playerMapPoint.y } }
      : { ...previous, world: { ...previous.world, x: playerMapPoint.x, y: playerMapPoint.y } });
  }, [followPlayer, playerMapPoint.x, playerMapPoint.y]);

  const filteredEntities = useMemo(() => permittedEntities(visibleMap.entities).filter(entity => {
    if (entity.ref.type === 'site' && !layers.buildings) return false;
    if ((entity.ref.type === 'resource' || entity.ref.type === 'cache') && !layers.resources) return false;
    if (entity.knowledge === 'remembered' && !layers.discoveries) return false;
    return true;
  }), [visibleMap.entities, layers]);
  const screenMarkers = useMemo(() => filteredEntities.filter(entity => Number.isFinite(entity.x) && Number.isFinite(entity.y)).map(entity => {
    const mapPoint = worldToMap({ x: entity.x!, y: entity.y! });
    const screen = mapToScreen(mapPoint, activeCamera, screenRect);
    return { id: entityKey(entity), kind: entity.iconKind, value: entity, x: screen.x, y: screen.y, worldX: entity.x!, worldY: entity.y! };
  }).filter(marker => marker.x >= -64 && marker.x <= size.width + 64 && marker.y >= -64 && marker.y <= size.height + 64), [filteredEntities, activeCamera, screenRect.width, screenRect.height, size.width, size.height]);
  const clustered = useMemo<DisplayMarker[]>(() => {
    const settlementMarkers = screenMarkers.filter(marker => Boolean(marker.value.settlementId));
    const featureMarkers = screenMarkers.filter(marker => !marker.value.settlementId);
    const stableSettlementMarkers: DisplayMarker[] = settlementMarkers.map(marker => ({
      type: 'marker', id: marker.id, value: marker.value, x: marker.x, y: marker.y, worldX: marker.worldX, worldY: marker.worldY,
    }));
    const camp = settlementMarkers[0];
    let calloutIndex = 0;
    const separatedFeatures: DisplayMarker[] = clusterMarkers(featureMarkers, 58).map(marker => {
      if (!camp || Math.hypot(marker.x - camp.x, marker.y - camp.y) >= 72) return marker;
      const index = calloutIndex++;
      let direction = marker.x < camp.x ? -1 : 1;
      if (camp.x < 76) direction = 1;
      if (camp.x > size.width - 76) direction = -1;
      let display = { x: camp.x + direction * 76, y: camp.y + index * 58 };
      if (display.x < 34 || display.x > size.width - 34) {
        display = { x: camp.x, y: camp.y + (index % 2 === 0 ? -1 : 1) * 76 };
      }
      const mapPoint = screenToMap(display, activeCamera, screenRect);
      const from = marker.type === 'cluster'
        ? { x: marker.worldX, y: -marker.worldY }
        : { x: marker.value.x ?? 0, y: -(marker.value.y ?? 0) };
      return { ...marker, x: display.x, y: display.y, worldX: mapPoint.x, worldY: -mapPoint.y, leader: { from, to: mapPoint } };
    });
    return [...separatedFeatures, ...stableSettlementMarkers].sort((a, b) => a.id.localeCompare(b.id));
  }, [screenMarkers, activeCamera, screenRect, size.width, size.height]);
  const visibleLabelIds = useMemo(() => {
    const candidates = filteredEntities.filter(entity => Number.isFinite(entity.x) && Number.isFinite(entity.y)).map(entity => {
      const point = mapToScreen(worldToMap({ x: entity.x!, y: entity.y! }), activeCamera, screenRect);
      const selected = sameEntityRef(entity.ref, selectedEntity);
      return {
        id: entityKey(entity),
        text: entity.label,
        x: point.x,
        y: point.y + 34,
        priority: selected ? 100 : entity.ref.type === 'site' ? 60 : entity.knowledge === 'remembered' ? 15 : 35,
      };
    });
    return collisionFreeLabels(candidates);
  }, [filteredEntities, activeCamera, screenRect.width, screenRect.height, selectedEntity]);
  const clusterEntityByKey = useMemo(() => new Map(filteredEntities.map(entity => [entityKey(entity), entity])), [filteredEntities]);
  const expandedMembers = clusterMembers?.map(key => clusterEntityByKey.get(key)).filter((entity): entity is EntityView => Boolean(entity)) ?? [];
  const scale = Math.max(.08, Math.min(200, viewHeight / Math.max(1, size.height) * 1.12));
  const metresPerPixel = viewHeight / Math.max(1, size.height);
  const scaleMeasure = scaleBar(metresPerPixel);
  const scaleDistance = scaleMeasure.distance;
  const scaleWidth = scaleMeasure.pixels;
  const allLayers = filteredEntities;

  const withZoom = (next: CameraView, oldZoom = transientCamera.current.zoom, commit=false) => {
    transientCamera.current=next;
    const b=viewBox(next,size.width,size.height);svgRef.current?.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);
    rootRef.current?.dispatchEvent(new CustomEvent('map-camera',{detail:{...next,interacting:!commit&&Boolean(gesture.current)}}));
    if(!commit&&(gesture.current||performance.now()-lastCameraCommit.current<100))return;
    lastCameraCommit.current=performance.now();
    onCameraChange(previous => {
      const mode = previous.mode;
      if (mode === 'local' && next.zoom < oldZoom && shouldEnterWorldMap(next.zoom, radius)) {
        return { ...previous, mode: 'world', world: next };
      }
      if (mode === 'world' && next.zoom > oldZoom && shouldReturnToLocalMap(next.zoom)) {
        return { ...previous, mode: 'local', local: next };
      }
      return mode === 'local' ? { ...previous, local: next } : { ...previous, world: next };
    });
  };

  const zoomBy = (factor: number) => {
    const nextZoom = Math.max(MIN_LOCAL_ZOOM, Math.min(MAX_ZOOM, transientCamera.current.zoom * factor));
    withZoom({ ...activeCamera, zoom: nextZoom },activeCamera.zoom,true);
  };
  const enterWorldOverview = () => {
    const fitted = fitCircle(WORLD_HALF_SPAN_M, screenRect, 56);
    onCameraChange(previous => ({ ...previous, mode: 'world', world: followPlayer ? { ...fitted, x: playerMapPoint.x, y: playerMapPoint.y } : fitted }));
  };
  const returnToLocal = () => onCameraChange(previous => ({
    ...previous,
    mode: 'local',
    local: followPlayer ? { ...previous.local, x: playerMapPoint.x, y: playerMapPoint.y } : previous.local,
  }));
  const resetToCamp = () => onCameraChange(previous => ({ ...previous, mode: 'local', local: { x: followPlayer ? playerMapPoint.x : 0, y: followPlayer ? playerMapPoint.y : 0, zoom: 1 } }));
  const fitHeat = () => {
    if (followPlayer) onFollowPlayerChange(false);
    const fitted = fitCircle(radius, screenRect, 56);
    onCameraChange(previous => ({ ...previous, mode: 'local', local: fitted }));
  };

  const pointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    const activeTouches = [...pointers.current.entries()].filter(([, value]) => value.pointerType === 'touch');
    if (activeTouches.length >= 2) {
      const first = activeTouches[activeTouches.length - 2];
      const second = activeTouches[activeTouches.length - 1];
      const center = midpoint(first[1], second[1]);
      gesture.current = {
        kind: 'pinch',
        pointerIds: [first[0], second[0]],
        startDistance: Math.max(1, distance(first[1], second[1])),
        anchor: screenToMap(center, transientCamera.current, screenRect),
        origin: transientCamera.current,
        moved: false,
      };
    } else if (!gesture.current) {
      gesture.current = { kind: 'pan', pointerId: event.pointerId, start: point, origin: transientCamera.current, moved: false };
      const target = event.target;
      const onMarker = target instanceof Element && Boolean(target.closest('[role="button"]'));
      if (!onMarker) {
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer may have ended during the gesture start. */ }
      }
    }
  };

  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = localPoint(event);
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, point);
    const activeGesture = gesture.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (activeGesture?.kind === 'pinch') {
      const [firstId, secondId] = activeGesture.pointerIds;
      const first = pointers.current.get(firstId), second = pointers.current.get(secondId);
      if (!first || !second) return;
      try {
        if (!event.currentTarget.hasPointerCapture(firstId)) event.currentTarget.setPointerCapture(firstId);
        if (!event.currentTarget.hasPointerCapture(secondId)) event.currentTarget.setPointerCapture(secondId);
      } catch { /* A touch may have been canceled by the platform. */ }
      const center = midpoint(first, second);
      const nextZoom = Math.max(.0007, Math.min(6, activeGesture.origin.zoom * distance(first, second) / activeGesture.startDistance));
      const nextSize = viewSize({ ...activeGesture.origin, zoom: nextZoom }, rect.width, rect.height);
      const ratioX = center.x / rect.width, ratioY = center.y / rect.height;
      const next = {
        zoom: nextZoom,
        x: activeGesture.anchor.x - (ratioX - .5) * nextSize.width,
        y: activeGesture.anchor.y - (ratioY - .5) * nextSize.height,
      };
      if (!activeGesture.moved && followPlayer) onFollowPlayerChange(false);
      activeGesture.moved = true;
      withZoom(next, activeGesture.origin.zoom);
      return;
    }
    if (activeGesture?.kind !== 'pan' || activeGesture.pointerId !== event.pointerId) return;
    const dx = point.x - activeGesture.start.x, dy = point.y - activeGesture.start.y;
    if (!activeGesture.moved && Math.hypot(dx, dy) < 6) return;
    if (!activeGesture.moved && followPlayer) onFollowPlayerChange(false);
    activeGesture.moved = true;
    try { if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer may have left the surface. */ }
    withZoom({
      ...activeGesture.origin,
      x: activeGesture.origin.x - dx * (viewport.width / Math.max(1, rect.width)),
      y: activeGesture.origin.y - dy * (viewport.height / Math.max(1, rect.height)),
    }, activeGesture.origin.zoom);
  };

  const finishPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const activeGesture = gesture.current;
    if(activeGesture?.moved)withZoom(transientCamera.current,activeGesture.origin.zoom,true);
    if (activeGesture?.kind === 'pan' && activeGesture.pointerId === event.pointerId && activeGesture.moved) ignoreNextClick.current = true;
    if (activeGesture?.kind === 'pinch' && activeGesture.pointerIds.includes(event.pointerId) && activeGesture.moved) ignoreNextClick.current = true;
    pointers.current.delete(event.pointerId);
    try { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    if (activeGesture?.kind === 'pinch' && pointers.current.size === 1) {
      const [remainingId, remainingPoint] = [...pointers.current.entries()][0];
      gesture.current = { kind: 'pan', pointerId: remainingId, start: remainingPoint, origin: transientCamera.current, moved: true };
    } else if (pointers.current.size === 0 || activeGesture?.kind === 'pinch') {
      gesture.current = null;
    } else if (activeGesture?.kind === 'pan' && activeGesture.pointerId === event.pointerId) {
      gesture.current = null;
    }
    if (ignoreNextClick.current) window.setTimeout(() => { ignoreNextClick.current = false; }, 0);
  };
  const cancelPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if(gesture.current?.moved)withZoom(transientCamera.current,gesture.current.origin.zoom,true);
    pointers.current.clear();
    gesture.current = null;
    ignoreNextClick.current = false;
    try { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };
  const lostPointerCapture = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(event.pointerId)) {
      pointers.current.clear();
      gesture.current = null;
      ignoreNextClick.current = false;
    }
  };
  const clickCapture = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!ignoreNextClick.current) return;
    ignoreNextClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('svg.terrain-svg--deep')) return;
      if (target.closest('button,select,input,textarea,[contenteditable="true"]')) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const delta = Math.max(-480, Math.min(480, event.deltaY * unit));
      const factor = Math.exp(-delta * .00145);
      const nextZoom = Math.max(MIN_LOCAL_ZOOM, Math.min(MAX_ZOOM, transientCamera.current.zoom * factor));
      const localRect: Rect = { x: 0, y: 0, width: rect.width, height: rect.height };
      const pointer = followPlayer
        ? { x: rect.width / 2, y: rect.height / 2 }
        : { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const next = zoomAtScreenPoint(transientCamera.current, localRect, pointer, nextZoom);
      event.preventDefault();
      withZoom(next);if(wheelCommit.current)clearTimeout(wheelCommit.current);wheelCommit.current=setTimeout(()=>withZoom(transientCamera.current,activeCamera.zoom,true),120);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [activeCamera, radius, viewport.width, viewport.height, followPlayer]);

  const keyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const step = viewHeight * .12;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (followPlayer) onFollowPlayerChange(false);
      const x = event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0;
      const y = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
      onCameraChange(previous => previous.mode === 'local'
        ? { ...previous, local: { ...previous.local, x: previous.local.x + x, y: previous.local.y + y } }
        : { ...previous, world: { ...previous.world, x: previous.world.x + x, y: previous.world.y + y } });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomBy(1.2);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomBy(1 / 1.2);
    }
  };

  const selectedText = selectedEntity ? `${selectedEntity.type}:${selectedEntity.id}` : '';
  const labelFor = (entity: EntityView) => entity.knowledge === 'remembered' || !entity.currentSight
    ? 'Vị trí đã biết lần cuối: ' + entity.name
    : 'Kiểm tra ' + entity.name;
  const changeLayer = (key: keyof LayerState) => setLayers(current => ({ ...current, [key]: !current[key] }));
  const clusterList = (cluster: ScreenCluster<EntityView>) => {
    if (cluster.type !== 'cluster') return;
    setClusterMembers(cluster.memberIds);
  };
  const toggleMode = () => world ? returnToLocal() : enterWorldOverview();

  return <div className={'map-experience' + (compact ? ' map-experience--compact' : '')}>
    {!compact && <div className="map-toolbar">
      <div className="map-toolbar-main">
        <span className="map-eyebrow"><Snowflake size={14}/> BĂNG NGUYÊN · BẢN XEM THỬ</span>
        <span className="map-time-flag"><span className={'map-phase-symbol phase-' + phase}>{phase === 'day' ? <Sun size={15}/> : <Moon size={15}/>}</span>{formatClock(minutes)} · {phase === 'day' ? 'Ban ngày' : phase === 'twilight' ? 'Chạng vạng' : 'Ban đêm'}</span>
        <span className="map-revision" data-testid="map-state-revision">Bản xem {visibleMap.revision}</span>
      </div>
      <div className="map-layer-controls" role="group" aria-label="Lớp bản đồ">
        <button type="button" aria-pressed={layers.buildings} onClick={() => changeLayer('buildings')}><Layers3 size={14}/> Công trình</button>
        <button type="button" aria-pressed={layers.resources} onClick={() => changeLayer('resources')}><Mountain size={14}/> Tài nguyên</button>
        <button type="button" aria-pressed={layers.discoveries} onClick={() => changeLayer('discoveries')}><Eye size={14}/> Đã ghi nhớ</button>
        <button type="button" disabled title="Chưa có dữ liệu tuyến đường" aria-label="Tuyến đường chưa khả dụng: Chưa có dữ liệu">Tuyến đường</button>
        <button type="button" disabled title="Chưa có đội quân hoặc đơn vị" aria-label="Đơn vị chưa khả dụng: Chưa có dữ liệu">Đơn vị</button>
        <button type="button" aria-pressed={showHeat} onClick={() => onShowHeatChange(!showHeat)}><ThermometerSun size={14}/> Nhiệt</button>
        <button type="button" aria-pressed={showExploration} onClick={() => onShowExplorationChange(!showExploration)}><EyeOff size={14}/> Ký ức</button>
      </div>
      <details className="map-developer-tools">
        <summary>Công cụ bản đồ</summary>
        <div className="map-developer-controls">
          <label htmlFor={unique + '-time'}>Ánh sáng</label>
          <select id={unique + '-time'} aria-label="Mô phỏng giờ hiển thị" value={TIMES.includes(minutes as typeof TIMES[number]) ? minutes : -1} onChange={event => onClockChange(Math.floor(clockSeconds / 86400) * 86400 + Number(event.target.value) * 60)}>
            {!TIMES.includes(minutes as typeof TIMES[number]) && <option value={-1}>{formatClock(minutes)}</option>}
            {TIMES.map(time => <option value={time} key={time}>{formatClock(time)}</option>)}
          </select>
          <label htmlFor={unique + '-level'}>Vùng nhiệt</label>
          <select id={unique + '-level'} aria-label="Xem thử vùng nhiệt theo cấp" value={fireLevel} onChange={event => onFireLevelChange(Number(event.target.value))}>
            {LEVELS.map(level => <option value={level} key={level}>Cấp {level}</option>)}
          </select>
          <label className="map-fire-toggle"><input type="checkbox" checked={fireActive} onChange={event => onFireActiveChange(event.target.checked)}/> Lửa đang bật</label>
          <label className="map-atlas-toggle"><input type="checkbox" checked={sourceAtlas} onChange={event => onSourceAtlasChange(event.target.checked)}/> Hiện lớp dữ liệu tham khảo</label>
          <button type="button" className={labels ? 'is-on' : ''} aria-pressed={labels} onClick={() => setLabels(value => !value)}>{labels ? <Eye size={14}/> : <EyeOff size={14}/>} Nhãn</button>
        </div>
        <p>Ánh sáng, cấp lửa và dữ liệu tham khảo chỉ đổi cách hiển thị; không khám phá hay lưu tiến trình.</p>
      </details>
    </div>}

    <div className="map-scene map-scene--deep" ref={rootRef}>
      <MapCanvas snapshot={explorationSnapshot(visibleMap,activeCamera,world,compact)} label="Địa hình băng nguyên hướng Bắc. Địa điểm đã biết được hiển thị trên lớp điều khiển."/>
      <svg ref={svgRef} className="terrain-svg terrain-svg--deep" viewBox={viewport.x + ' ' + viewport.y + ' ' + viewport.width + ' ' + viewport.height}
        aria-label="Bản đồ băng nguyên. Dùng các phím mũi tên để di chuyển, cộng trừ để thu phóng."
        tabIndex={0} onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerUp={finishPointer} onPointerCancel={cancelPointer} onLostPointerCapture={lostPointerCapture} onClickCapture={clickCapture}>
        <FogDefinitions id={unique} discs={visibleMap.sight} memory={visibleMap.explored} viewport={viewport}/>
        <rect {...viewport} fill="#081527" opacity={currentSightOpacity} pointerEvents="none"/>
        {visibleMap.sight.map((disc, i) => <circle key={'halo-' + i} cx={disc.x} cy={-disc.y} r={disc.fade + 27} fill={'url(#' + unique + '-halo)'} pointerEvents="none"/>)}
        <rect {...viewport} fill="#01040a" mask={'url(#' + unique + '-fog-mask)'} pointerEvents="none"/>
        {showExploration && <rect {...viewport} fill="#69828a" opacity=".38" mask={'url(#' + unique + '-known-mask)'} pointerEvents="none"/>}
        {showHeat && radius > 0 && <circle cx="0" cy="0" r={radius} fill="none" opacity={phase === 'night' ? .8 : .16} pointerEvents="none"/>}
        {showHeat && radius > 0 && <circle cx="0" cy="0" r={radius} fill="none" stroke="#edbc77" strokeWidth={Math.max(.8, Math.min(750, viewHeight / 245))} strokeDasharray={Math.max(4, viewHeight / 70) + ' ' + Math.max(3, viewHeight / 100)} strokeOpacity=".88" pointerEvents="none"/>}
        {showHeat && radius > 0 && <circle cx="0" cy="0" r={Math.min(radius, Math.max(3, radius * .18))} fill="none" stroke="#ffc881" strokeOpacity=".23" strokeWidth="2" pointerEvents="none"/>}
        {sourceAtlas && visibleMap.developerEntities?.map(entity => <g key={entityKey(entity)} aria-hidden="true" pointerEvents="none" opacity=".36">
          <MapEntityGlyph entity={entity} scale={scale}/><circle cx={entity.x} cy={-(entity.y ?? 0)} r={29 * scale} fill="none" stroke="#e8c895" strokeDasharray="3 5" strokeWidth={1.4 * scale}/>
        </g>)}
        {clustered.filter(marker => marker.leader).map(marker => <line key={'leader-' + marker.id}
          x1={marker.leader!.from.x} y1={marker.leader!.from.y}
          x2={marker.leader!.to.x} y2={marker.leader!.to.y}
          className="map-callout-leader" pointerEvents="none"/>)}
        {clustered.map(marker => marker.type === 'cluster' ? <g key={marker.id} className={'map-cluster' + (marker.memberIds.includes(selectedText) ? ' is-selected' : '')}
          transform={'translate(' + marker.worldX + ' ' + (-marker.worldY) + ') scale(' + scale + ')'} role="button" tabIndex={0}
          data-cluster-id={marker.id} aria-label={'Mở danh sách cụm có ' + marker.count + ' địa điểm'}
          onClick={() => clusterList(marker)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clusterList(marker); } }}>
          <circle r="24" fill="#143a46" stroke={marker.memberIds.includes(selectedText) ? '#ffe0a4' : '#c4dad0'} strokeWidth="2.3"/>
          <circle r="29" fill="none" stroke="#f2d59c" strokeOpacity=".55" strokeDasharray="3 4" strokeWidth="1.3"/>
          <text y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff0cd">×{marker.count}</text>
        </g> : <g key={marker.id} transform={`translate(${marker.worldX - (marker.value.x ?? 0)} ${(marker.value.y ?? 0) - marker.worldY})`} className={'map-entity-marker' + (sameEntityRef(marker.value.ref, selectedEntity) ? ' is-selected' : '') + (marker.value.knowledge === 'remembered' ? ' is-remembered' : '')}
          role="button" tabIndex={0} data-entity-id={marker.value.ref.id} data-entity-type={marker.value.ref.type} data-knowledge={marker.value.knowledge}
          aria-label={labelFor(marker.value)} onClick={() => { onSelectEntity(marker.value.ref); setClusterMembers(null); }}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectEntity(marker.value.ref); setClusterMembers(null); } }}>
          <MapEntityGlyph entity={marker.value} scale={scale} selected={sameEntityRef(marker.value.ref, selectedEntity)} remembered={marker.value.knowledge === 'remembered' || !marker.value.currentSight}/>
          <circle transform={'translate(' + marker.value.x + ' ' + (-(marker.value.y ?? 0)) + ')'} r={24 * scale} fill="transparent" pointerEvents="all"/>
          {labels && visibleLabelIds.has(marker.id) && <text transform={'translate(' + marker.value.x + ' ' + (-(marker.value.y ?? 0)) + ') scale(' + scale + ')'} y="38" textAnchor="middle" fontSize="11" fill="#e5efea" stroke="#091d27" strokeWidth="2.5" paintOrder="stroke">{marker.value.label}</text>}
        </g>)}
        {followPlayer && <g className="map-player-marker" transform={`translate(${playerMapPoint.x} ${playerMapPoint.y}) scale(${scale})`}
          role="button" tabIndex={0} aria-label={`${playerName} — mở hồ sơ người chơi`} onClick={onOpenPlayerProfile}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenPlayerProfile(); } }}>
          <circle r="24" fill="#123c4b" stroke="#ffe1a9" strokeWidth="2.2"/>
          <circle r="19" fill="none" stroke="#a6d7d2" strokeWidth="1.2" strokeDasharray="3 3"/>
          <circle cy="-5" r="5.2" fill="#f4d39b"/>
          <path d="M-9 10c1-7 5-10 9-10s8 3 9 10" fill="#7fc0bd" stroke="#e0ece1" strokeWidth="1.4" strokeLinecap="round"/>
          <text y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff0cd" stroke="#0a1d27" strokeWidth="3" paintOrder="stroke">{playerName}</text>
        </g>}
      </svg>
      <div className="map-vignette" aria-hidden="true"/>
      <div className="map-corner-title"><span><Compass size={13}/> PHƯƠNG BẮC ↑</span><strong>{world ? 'Bản đồ thế giới' : 'Đồng bằng Cổ Chiến Trường'}</strong><small>{world ? 'Vùng đất đã biết · bán kính 96 km' : 'Địa hình băng nguyên minh họa'}</small></div>
      {followPlayer && <button type="button" className="map-follow-status" aria-pressed="true" onClick={() => onFollowPlayerChange(false)}>
        <LocateFixed size={14}/> Theo dõi {playerName}<span>Mở khóa</span>
      </button>}
      <div className="map-corner-controls" aria-label="Điều khiển bản đồ">
        <button type="button" onClick={() => zoomBy(1 / 1.22)} aria-label="Thu nhỏ" title="Thu nhỏ"><Minus size={17}/></button>
        <span aria-live="polite">{activeCamera.zoom >= .1 ? Math.round(activeCamera.zoom * 100) + '%' : '1:' + Math.round(1 / activeCamera.zoom)}</span>
        <button type="button" onClick={() => zoomBy(1.22)} aria-label="Phóng to" title="Phóng to"><Plus size={17}/></button>
        <button type="button" onClick={resetToCamp} aria-label="Về lãnh địa" title="Về lãnh địa"><Maximize2 size={17}/></button>
        <button type="button" onClick={fitHeat} aria-label="Xem toàn bộ vòng nhiệt" title="Xem toàn bộ vòng nhiệt"><ThermometerSun size={17}/></button>
        <button type="button" onClick={toggleMode} aria-label={world ? 'Chuyển sang bản đồ địa phương' : 'Chuyển sang bản đồ thế giới'} title={world ? 'Trở lại chế độ địa phương' : 'Xem toàn bộ thế giới'}><Globe2 size={17}/></button>
      </div>
      {expandedMembers.length > 0 && <div className="map-cluster-list" role="region" aria-label="Các điểm trong cụm">
        <div><strong>{expandedMembers.length} địa điểm</strong><button type="button" aria-label="Đóng danh sách cụm" onClick={() => setClusterMembers(null)}>×</button></div>
        {expandedMembers.map(entity => <button type="button" key={entityKey(entity)} onClick={() => { onSelectEntity(entity.ref); setClusterMembers(null); }}>
          <span className="cluster-list-kind">{entity.iconKind}</span><span>{entity.name}</span><small>{entity.knowledge === 'remembered' ? 'Đã ghi nhớ' : entity.provenance === 'canonical' ? 'Nguồn' : 'Thông tin tham khảo'}</small>
        </button>)}
      </div>}
      <div className="map-scale-bar" data-testid="map-scale-bar" aria-label={'Tỷ lệ bản đồ ' + formatDistance(scaleDistance)}>
        <span style={{ width: scaleWidth + 'px' }}/><strong>{formatDistance(scaleDistance)}</strong>
      </div>
      <div className="map-heat-readout">
        <span><ThermometerSun size={15}/> VÙNG NHIỆT</span>
        <strong>{fireActive ? formatDistance(radius) : 'Tắt'} <small>bán kính xem thử</small></strong>
        <em>{fireForm(fireLevel)} Cấp {fireLevel} · Chỉ hiển thị</em>
      </div>
      {compact && onOpenFullMap && <button type="button" className="map-open-full" onClick={onOpenFullMap}>Mở lãnh địa</button>}
      {!compact && <div className="map-drag-hint">{world ? 'Vùng tối chưa được khảo sát · Bản đồ không tự khám phá' : 'Kéo để di chuyển · Cuộn chuột để thu phóng'}</div>}
      {compact && <span className="map-compact-label">SƯƠNG MÙ KHÁM PHÁ</span>}
      <ul className="map-accessible-entities" aria-label="Các địa điểm đã biết">
        {allLayers.map(entity => <li key={entityKey(entity)}><button type="button" onClick={() => onSelectEntity(entity.ref)}>{labelFor(entity)}</button></li>)}
      </ul>
    </div>
    {!compact && <div className="map-footer-bar">
      <span><span className="map-dot mapped"/> Vùng đang nhìn thấy</span>
      <span><span className="map-dot fogged"/> Vùng chưa biết</span>
      {showExploration && <span><span className="map-dot sample"/> Địa hình được ghi nhớ</span>}
      {sourceAtlas && <span><TreePine size={12}/> Lớp dữ liệu tham khảo không mở vùng chưa biết</span>}
      <span className="map-footer-aside">Đồng hồ và ánh sáng chỉ là bản xem thử · Không xử lý hành động</span>
    </div>}
  </div>;
}
