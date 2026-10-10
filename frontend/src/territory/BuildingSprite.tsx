import { useEffect, useState } from 'react';
import type { AssetManifestEntry } from '../assets/assetRegistry';
import { layerPath } from '../assets/assetRegistry';
import type { FootprintView, LayoutDraft } from '../game/GameClient';
import type { WorldPoint } from './projection';
import { worldToScreen } from './projection';
import { orientedSize } from './placement';

export type ReadabilityMode = 'normal' | 'focus' | 'planning';
type Props = {
  id: string;
  name: string;
  asset?: AssetManifestEntry;
  assetId: string;
  point: WorldPoint;
  footprint: FootprintView;
  orientation: LayoutDraft['orientation'];
  camera: { x: number; y: number; zoom: number };
  viewport: { width: number; height: number };
  mode: ReadabilityMode;
  selected: boolean;
  faded: boolean;
  activeEffect?: boolean;
  draft?: boolean;
  blocked?: boolean;
  onSelect?: () => void;
};

function fallbackShape(assetId: string) {
  if (assetId.includes('tower') || assetId.includes('tomb')) return <path d="M-17 2  -13-43 13-43 17 2Z M-22-42 0-62 22-42Z" fill="#718895" stroke="#d1dad0" strokeWidth="3"/>;
  if (assetId.includes('fire')) return <path d="M-22 3c-13-16 1-26 6-40 7 12 8 19 7 27 8-14 3-24 13-39 15 23 17 42 3 55 13-5 17-15 16-21 16 25-1 34-24 35-15 0-26-6-21-17Z" fill="#e89451" stroke="#ffcf8d" strokeWidth="3"/>;
  return <path d="M-34 3v-29L0-58l35 28V3Z M-40-27 0-65l42 34" fill="#687f86" stroke="#d2d4c1" strokeWidth="3"/>;
}

export default function BuildingSprite({ id, name, asset, assetId, point, footprint, orientation, camera, viewport, mode, selected, faded, activeEffect = false, draft = false, blocked = false, onSelect }: Props) {
  const [missing, setMissing] = useState(false);
  useEffect(() => setMissing(false), [assetId]);
  const ground = worldToScreen(point, camera, viewport);
  const size = orientedSize(footprint, orientation);
  const halfX = size.width / 2, halfY = size.depth / 2;
  const corners = [
    worldToScreen({x:point.x-halfX,y:point.y-halfY},camera,viewport),
    worldToScreen({x:point.x+halfX,y:point.y-halfY},camera,viewport),
    worldToScreen({x:point.x+halfX,y:point.y+halfY},camera,viewport),
    worldToScreen({x:point.x-halfX,y:point.y+halfY},camera,viewport),
  ];
  const polygon = corners.map(p => `${p.x},${p.y}`).join(' ');
  const visualScale = asset?.presentationScale ?? 1;
  // Distinct development stages can be taller in screen pixels while their
  // world footprints, heat geometry, depth anchor, and click polygons stay authoritative.
  const spriteWidth = Math.max(30, Math.min(260, 98 * Math.sqrt(camera.zoom) * visualScale));
  const spriteHeight = spriteWidth * (asset?.logicalCanvas.height ?? 200) / (asset?.logicalCanvas.width ?? 240);
  const x = ground.x - spriteWidth * (asset?.groundAnchor.x ?? .5);
  const y = ground.y - spriteHeight * (asset?.groundAnchor.y ?? .82);
  const angle = orientation === 'east' ? 90 : orientation === 'south' ? 180 : orientation === 'west' ? 270 : 0;
  const imageTransform = `rotate(${angle} ${ground.x} ${ground.y})`;
  const upperOpacity = mode === 'planning' ? 0 : mode === 'focus' && faded ? .24 : 1;
  const body = layerPath(asset, 'body', camera.zoom < .35 ? 'district' : 'close');
  const vfx = layerPath(asset, 'vfx', camera.zoom < .35 ? 'district' : 'close');
  const bodyOpacity = draft ? .55 : mode === 'focus' && faded ? .24 : mode === 'planning' ? .9 : 1;
  const onError = () => setMissing(true);
  const handleClick = (event: React.MouseEvent<SVGGElement>) => { event.stopPropagation(); onSelect?.(); };
  return <g className={`territory-building${selected?' is-selected':''}${draft?' is-draft':''}${blocked?' is-blocked':''}`} data-building-id={id}
    role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`Chọn ${name}`:undefined}
    onKeyDown={onSelect?event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelect();}}:undefined}>
    {!missing && body && <image href={body} x={x} y={y} width={spriteWidth} height={spriteHeight} transform={imageTransform} opacity={bodyOpacity} pointerEvents="none" onError={onError}/>}
    {mode !== 'planning' && !missing && activeEffect && vfx && <image href={vfx} x={x} y={y} width={spriteWidth} height={spriteHeight} transform={imageTransform} opacity={draft ? .48 : faded && mode === 'focus' ? .24 : 1} pointerEvents="none" onError={onError}/>}
    {(missing || !asset || !body) && <g transform={`translate(${ground.x} ${ground.y}) rotate(${angle})`} pointerEvents="none">{fallbackShape(assetId)}</g>}
    <polygon points={polygon} className="territory-footprint" fill={selected?'rgba(238,194,126,.2)':draft?'rgba(127,197,195,.16)':'rgba(143,190,193,.02)'} stroke={blocked?'#e98272':selected?'#f2ce93':draft?'#83cebe':'#789a9d'} strokeDasharray={draft?'5 4':'none'} strokeWidth={selected?2.5:1.5}
      onClick={onSelect?handleClick:undefined} pointerEvents="all"/>
    {mode !== 'planning' && upperOpacity > .8 && <path className="territory-art-hit" transform={`translate(${ground.x} ${ground.y}) rotate(${angle})`} d={assetId.includes('tower')||assetId.includes('tomb')?'M-20 2 -16-43 0-62 18-43 20 2Z':assetId.includes('fire')?'M-22 1c-12-17 2-27 7-41 6 11 7 19 6 27 9-14 5-23 14-38 16 23 17 43 4 54 14-7 16-16 16-22 15 25-1 34-24 35-16 1-27-6-23-15Z':'M-38 3v-30L0-65 42-32V3Z'} fill="transparent" stroke="transparent" strokeWidth="2" onClick={onSelect?handleClick:undefined} pointerEvents={onSelect?'all':'none'}/>} 
    {mode === 'planning' && selected && <g className="territory-plan-mark" transform={`translate(${ground.x} ${ground.y})`} pointerEvents="none"><text y="-13" textAnchor="middle">{name}</text><text y="1" textAnchor="middle">Cao: chưa xác định</text><text y="14" textAnchor="middle">Lối vào: chưa xác định</text></g>}
    {draft && <circle cx={ground.x} cy={ground.y} r="4" fill="#f1c789" pointerEvents="none"/>}
  </g>;
}
