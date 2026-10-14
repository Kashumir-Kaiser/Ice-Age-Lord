import { useEffect, useState } from 'react';
import type { AssetManifestEntry } from '../assets/assetRegistry';
import type { FootprintView, LayoutDraft } from '../game/GameClient';
import type { WorldPoint } from './projection';
import { worldToScreen } from './projection';
import { orientedSize } from './placement';
import { artPolygon, composition, resolveOrientation, spriteRect,orientationAsset } from '../rendering/SpriteRegistration';
export type ReadabilityMode = 'normal' | 'focus' | 'planning';
type Props={id:string;name:string;asset?:AssetManifestEntry;assetId:string;point:WorldPoint;footprint:FootprintView;orientation:LayoutDraft['orientation'];camera:{x:number;y:number;zoom:number};viewport:{width:number;height:number};mode:ReadabilityMode;selected:boolean;faded:boolean;activeEffect?:boolean;draft?:boolean;blocked?:boolean;geometryOnly?:boolean;qaFixture?:boolean;onSelect?:()=>void};
export default function BuildingSprite({id,name,asset,assetId,point,footprint,orientation,camera,viewport,mode,selected,faded,activeEffect=false,draft=false,blocked=false,geometryOnly=false,qaFixture=false,onSelect}:Props){
 if(asset)asset=orientationAsset(asset,orientation);
 const [failed,setFailed]=useState<ReadonlySet<string>>(new Set());useEffect(()=>setFailed(new Set()),[assetId,orientation]);
 const ground=worldToScreen(point,camera,viewport),size=orientedSize(footprint,orientation);
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>worldToScreen({x:point.x+x*size.width/2,y:point.y+y*size.depth/2},camera,viewport));
 const rect=asset?spriteRect(asset,ground,3*camera.zoom):null;
 const polygon=(points:readonly WorldPoint[])=>points.map(p=>`${p.x},${p.y}`).join(' ');
 const click=(event:React.MouseEvent<SVGGElement>)=>{event.stopPropagation();onSelect?.();};
 const layers=asset?composition(asset,mode,faded,activeEffect,orientation):[];
 const missingOrientation=asset?resolveOrientation(asset,orientation).missing:false;
 return <g className={`territory-building${selected?' is-selected':''}${draft?' is-draft':''}${blocked?' is-blocked':''}`} data-building-id={id} data-asset-id={assetId} data-orientation={orientation} data-missing-orientation={missingOrientation||undefined}
   role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`Chọn ${name}`:undefined}
   onKeyDown={onSelect?event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelect();}}:undefined}>
   {!(qaFixture&&mode!=='planning')&&<>
   {!geometryOnly&&rect&&layers.filter(l=>!failed.has(l.path)).map(layer=><image key={layer.role} data-layer={layer.role} href={layer.path} {...rect} opacity={layer.alpha*(draft?.55:1)} pointerEvents="none" onError={()=>setFailed(previous=>new Set([...previous,layer.path]))}/>)}
   <polygon points={polygon(corners)} className="territory-footprint" fill={selected?'rgba(238,194,126,.2)':draft?'rgba(127,197,195,.16)':'transparent'} stroke={blocked?'#e98272':selected?'#f2ce93':draft?'#83cebe':mode==='planning'?'#789a9d':'none'} strokeDasharray={draft?'5 4':'none'} strokeWidth={selected?2.5:1.5} onClick={onSelect?click:undefined} pointerEvents={onSelect?'all':'none'}/>
   {mode!=='planning'&&asset&&rect&&onSelect&&[asset.hitPolygon??asset.artFootprint,asset.occlusionRegion.upper].map((shape,i)=><polygon key={i} className="territory-art-hit" points={polygon(artPolygon(shape,rect))} fill="transparent" onClick={click} pointerEvents={mode==='focus'&&faded?'none':'all'}/>)}
   {mode==='planning'&&selected&&<g className="territory-plan-mark" transform={`translate(${ground.x} ${ground.y})`} pointerEvents="none"><text y="-13" textAnchor="middle">{name}</text><text y="1" textAnchor="middle">Cao: chưa xác định</text><text y="14" textAnchor="middle">Lối vào: chưa xác định</text></g>}
   {missingOrientation&&<text x={ground.x+7} y={ground.y-8} fontSize="9" fill="#607d89" pointerEvents="none">{orientation==='east'?'→':orientation==='south'?'↓':orientation==='west'?'←':'↑'}</text>}
   {draft&&<circle cx={ground.x} cy={ground.y} r="4" fill="#f1c789" pointerEvents="none"/>}
   </>}
 </g>;
}
