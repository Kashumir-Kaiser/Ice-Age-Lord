import { memo } from 'react';
import type { Rect } from './camera';
import { worldToMap } from './camera';
import { WORLD_HALF_SPAN_M } from './camera';
import TerrainDetails from '../TerrainDetails';
import type { EntityView, VisibilityDisc } from '../game/GameClient';
import { fogGradientStops } from '../mapModel';

type Landmark = { x: number; y: number };

export const TerrainLayer = memo(function TerrainLayer({ id, world, viewport, viewHeight, landmarks }: {
  id: string; world: boolean; viewport: Rect; viewHeight: number;
  landmarks: { forest: Landmark; stone: Landmark; water: Landmark };
}) {
  const forest = worldToMap(landmarks.forest), stone = worldToMap(landmarks.stone), water = worldToMap(landmarks.water);
  const wide = world || viewHeight > 22_000;
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
    <rect x={viewport.x - viewport.width} y={viewport.y - viewport.height} width={viewport.width * 3} height={viewport.height * 3} fill="#112b3c"/>
    <circle r={WORLD_HALF_SPAN_M} fill={`url(#${id}-ground)`}/>
    <circle r={WORLD_HALF_SPAN_M} fill={`url(#${id}-cart-grid)`}/>
    <circle r={WORLD_HALF_SPAN_M} fill="none" stroke="#8cb7bb" strokeWidth="200" strokeOpacity=".35" strokeDasharray="950 750"/>
    <TerrainDetails sceneId={id} world={wide} viewport={viewport} viewHeight={viewHeight}/>
    <ellipse cx={forest.x} cy={forest.y} rx="1600" ry="1900" fill={`url(#${id}-treezone)`}/>
    <ellipse cx={stone.x} cy={stone.y} rx="1300" ry="1100" fill={`url(#${id}-rockzone)`}/>
    <ellipse cx={water.x} cy={water.y} rx="2100" ry="1200" fill={`url(#${id}-icewater)`}/>
    <circle r="1300" fill={`url(#${id}-landshade)`}/>
    {!wide && <>
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
    {world && [3000, 10000, 25000, 60000, 96000].map(r => <circle key={r} r={r} fill="none" stroke="#bdcdd0" strokeWidth="135" strokeOpacity=".08" strokeDasharray="350 550"/>)}
  </>;
});

export function MarkerGraphic({ kind }: { kind: string }) {
  if (kind === 'fire') return <g><path d="m-11 10 22 0m-19 4 16-6" stroke="#7b5142" strokeWidth="4" strokeLinecap="round"/><path d="M-1 12C-19-1-3-14-2-22 0-12 10-13 9-23c13 16 10 25-2 35Z" fill="#eaa05d" stroke="#ffe3a3" strokeWidth="1.5"/><path d="M1 10Q-5 0 3-11Q12 2 1 10" fill="#fff0b4"/></g>;
  if (kind === 'house') return <g><path d="m-15-1 15-13L15-1v17h-30Z" fill="#617b84" stroke="#d4e1dd" strokeWidth="1.5"/><path d="M-19 1 0-18 19 1" fill="none" stroke="#d7e9e3" strokeWidth="4"/><path d="M-4 16V4h8v12M6-11l-8 8 5 5-3 6" fill="none" stroke="#2a404b" strokeWidth="2.5"/></g>;
  if (kind === 'tomb') return <g><path d="M-15 17V-2a15 15 0 0 1 30 0v19Z" fill="#465b6c" stroke="#c7d7d9" strokeWidth="2"/><path d="M-8 16V-2a8 8 0 0 1 16 0v18Z" fill="#1b3140"/><path d="M0-8V10M-7 0h14" stroke="#bdd6d8" strokeWidth="2.5"/><path d="M-19 19h38" stroke="#c1d8d6" strokeWidth="3"/></g>;
  if (kind === 'supply') return <g><rect x="-15" y="-10" width="30" height="25" rx="2" fill="#785a43" stroke="#ead09f" strokeWidth="2"/><path d="M-9-7v20M0-7v20M9-7v20M-15 2h30" stroke="#d5b17a" strokeWidth="2.5"/><rect x="-3" y="-3" width="6" height="10" fill="#ffe1a1" stroke="#926b45"/></g>;
  if (kind === 'chest') return <g><path d="M-16-6Q-14-21 0-21T16-6V13H-16Z" fill="#9b764d" stroke="#f0d4a0" strokeWidth="2"/><path d="M-16-4H16M-9-3v17M9-3v17" stroke="#e1bd80" strokeWidth="3"/><rect x="-3" y="-1" width="6" height="9" rx="1" fill="#ffe3a7" stroke="#795e42"/></g>;
  if (kind === 'wood') return <g><path d="m0-20-13 18h6L-16 9h9l-5 10h24L7 9h9L7-2h6Z" fill="#305a4f" stroke="#b3d4bd" strokeWidth="2"/><path d="M0-20V19m-10-9 10-9 10 9" fill="none" stroke="#d9eee0" strokeWidth="2"/></g>;
  if (kind === 'stone') return <g><path d="m-18 15 7-21L0-19 11-9 19 15Z" fill="#7895a2" stroke="#e0eeea" strokeWidth="2"/><path d="M0-19-2 5l-16 10m16-10 21 10M-11-6 9-7" fill="none" stroke="#b5d4d5" strokeWidth="2"/></g>;
  if (kind === 'ore') return <g><path d="m-18 13 8-24 12-11 15 15 4 20Z" fill="#516a79" stroke="#a6ccd4" strokeWidth="2"/><path d="m-10-11 12 13v-24m0 24 15-9M2 2l-1 11" stroke="#84d4e4" strokeWidth="3"/></g>;
  if (kind === 'site') return <g><path d="M-16 15V-8l7-8 11 8 8-13 9 7V15Z" fill="#637985" stroke="#d2e3db" strokeWidth="1.6"/><path d="M-21 15h44M-7 15v-13h8v13m10-20-7 4" fill="none" stroke="#9ebcbe" strokeWidth="3"/></g>;
  if (kind === 'salt') return <g><path d="m-16 14 6-18 10-14 10 10 8 22Z" fill="#bed7ce" stroke="#f8efe0" strokeWidth="2"/><path d="m0-18 0 31m-10-17 10 5 10-9M-16 14 0 1l18 13" fill="none" stroke="#e5f0e1" strokeWidth="2"/></g>;
  if (kind === 'herbs') return <g><path d="M0 18V-13m0 24q-12-3-12-18Q1-5 0 11Zm0-10q5-18 16-20 1 17-16 20" fill="#618e7f" stroke="#d2e8d8" strokeWidth="2"/><path d="m-15 18 30 0" stroke="#d3e5d8" strokeWidth="2"/></g>;
  return <g><path d="m-18 9 5-16 18-11 15 14-7 19-20 5Z" fill="#93c9d5" stroke="#e6f9f8" strokeWidth="2"/><path d="m5-18-2 16 17-2M3-2-7 20m10-22-21 11" fill="none" stroke="#d2ffff" strokeWidth="2"/></g>;
}

export function FogDefinitions({ id, discs, memory, viewport }: {
  id: string; discs: readonly VisibilityDisc[]; memory: readonly VisibilityDisc[]; viewport: Rect;
}) {
  return <defs>
    {discs.map((disc, i) => {
      const stop = fogGradientStops(disc);
      return <radialGradient id={`${id}-sight-${i}`} key={`sight-${i}`}>
        <stop offset="0%" stopColor="black"/><stop offset={`${stop.clear}%`} stopColor="black"/>
        <stop offset={`${stop.transition}%`} stopColor="#888"/><stop offset="100%" stopColor="white"/>
      </radialGradient>;
    })}
    {memory.map((disc, i) => {
      const stop = fogGradientStops(disc);
      return <radialGradient id={`${id}-memory-${i}`} key={`memory-${i}`}>
        <stop offset="0%" stopColor="white"/><stop offset={`${stop.clear}%`} stopColor="white"/>
        <stop offset={`${stop.transition}%`} stopColor="#666"/><stop offset="100%" stopColor="black"/>
      </radialGradient>;
    })}
    <mask id={`${id}-fog-mask`} maskUnits="userSpaceOnUse" {...viewport}>
      <rect {...viewport} fill="white"/>
      {discs.map((disc, i) => <circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-sight-${i})`} style={{ mixBlendMode: 'darken' }}/>) }
    </mask>
    <mask id={`${id}-known-mask`} maskUnits="userSpaceOnUse" {...viewport}>
      <rect {...viewport} fill="black"/>
      {memory.map((disc, i) => <circle key={i} cx={disc.x} cy={-disc.y} r={disc.fade} fill={`url(#${id}-memory-${i})`} style={{ mixBlendMode: 'lighten' }}/>) }
    </mask>
    <radialGradient id={`${id}-heat`}><stop stopColor="#ffd58b" stopOpacity=".5"/><stop offset=".75" stopColor="#e9ab5a" stopOpacity=".25"/><stop offset="1" stopColor="#f5bf76" stopOpacity=".12"/></radialGradient>
    <radialGradient id={`${id}-halo`}><stop stopColor="#e5eef0" stopOpacity="0"/><stop offset=".65" stopColor="#d5e6e9" stopOpacity="0"/><stop offset=".87" stopColor="#d7eef1" stopOpacity=".065"/><stop offset="1" stopColor="#c5dce4" stopOpacity="0"/></radialGradient>
  </defs>;
}

export function MapEntityGlyph({ entity, scale, selected = false, remembered = false }: {
  entity: EntityView; scale: number; selected?: boolean; remembered?: boolean;
}) {
  return <g transform={`translate(${entity.x ?? 0} ${-(entity.y ?? 0)}) scale(${scale})`} opacity={remembered ? .64 : 1}>
    <circle r="22" fill={entity.provenance === 'modeled' ? '#203f41' : '#0b2933'} stroke={selected ? '#f0c88b' : entity.provenance === 'canonical' ? '#f1c991' : '#b4d3c7'} strokeWidth="1.6"/>
    <circle r="26" fill="none" stroke="#b4d9d9" strokeOpacity=".22" strokeDasharray="2 4"/>
    <MarkerGraphic kind={entity.iconKind}/>
    {remembered && <path d="M-5-29h10" stroke="#bdd3d1" strokeWidth="2" strokeDasharray="2 2"/>}
  </g>;
}
