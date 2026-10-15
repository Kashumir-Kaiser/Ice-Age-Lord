import { useEffect, useRef, useState } from 'react';
import type { MapSnapshot } from './MapSceneAdapter';
import type { MapRenderer } from './MapRenderer';
import type { Quality } from './mapStyle';
import './rendering.css';
import {loadAssetManifest} from '../assets/assetRegistry';
type Props={snapshot:MapSnapshot;label:string};
export default function MapCanvas({snapshot,label}:Props){
  const host=useRef<HTMLDivElement>(null),renderer=useRef<MapRenderer|null>(null),latest=useRef(snapshot);
  latest.current=snapshot;
  const [backend,setBackend]=useState('initializing'),[retry,setRetry]=useState(0);
  const [quality,setQuality]=useState<'auto'|Quality>(()=>{const value=localStorage.getItem('ice-age-map-quality');return value==='low'||value==='normal'?value:'auto';});
  const preference=useRef(quality);preference.current=quality;
  useEffect(()=>{
    const node=host.current;if(!node)return;let disposed=false;let current:MapRenderer|null=null,hostVisible:boolean|undefined=typeof IntersectionObserver==='undefined'?undefined:false;
    const canvas=document.createElement('canvas');canvas.className='map-render-canvas';canvas.setAttribute('aria-hidden','true');node.replaceChildren(canvas);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const qa=new URLSearchParams(location.search).get('mapQA')==='1';
    const configure=()=>current?.configure(preference.current,reduced.matches);
    const visibility=()=>current?.setHidden(document.hidden);
    const hostVisibility=(entries:IntersectionObserverEntry[])=>{hostVisible=Boolean(entries[0]?.isIntersecting&&entries[0].intersectionRatio>0);current?.setHostVisible(hostVisible);};
    const cameraChange=(event:Event)=>{const next=(event as CustomEvent<MapSnapshot['camera']&{interacting?:boolean}>).detail;current?.setCameraGesture(Boolean(next.interacting));current?.update({...latest.current,camera:{x:next.x,y:next.y,zoom:next.zoom}});};
    const parent=node.parentElement;parent?.addEventListener('map-camera',cameraChange);
    const observer=new ResizeObserver(entries=>{const b=entries[0]?.contentRect;if(b?.width&&b.height)current?.resize({width:b.width,height:b.height});});observer.observe(node);
    const intersection=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(hostVisibility,{threshold:0});intersection?.observe(node);
    reduced.addEventListener('change',configure);document.addEventListener('visibilitychange',visibility);
    Promise.all([import('./MapRenderer'),loadAssetManifest().catch(()=>null)]).then(async([{MapRenderer:Renderer},manifest])=>{
      if(disposed)return;
      current=new Renderer(canvas,latest.current,value=>{if(!disposed)setBackend(value);},qa,manifest?.environmentArt,manifest?.mapEffects);renderer.current=current;
      const b=node.getBoundingClientRect();current.resize({width:b.width,height:b.height});configure();visibility();current.setHostVisible(hostVisible);
      if(qa){const target=window as unknown as {__mapMetrics?:Record<string,unknown>[]};target.__mapMetrics??=[];target.__mapMetrics.push(current.metrics.data);}
      await current.init(new URLSearchParams(location.search).get('mapFallback')==='1');
    }).catch(error=>{if(!disposed){setBackend('unavailable');console.error('Map initialization failed',error);}});
    return()=>{disposed=true;observer.disconnect();intersection?.disconnect();parent?.removeEventListener('map-camera',cameraChange);reduced.removeEventListener('change',configure);document.removeEventListener('visibilitychange',visibility);current?.destroy();renderer.current=null;node.replaceChildren();};
  },[snapshot.identity,retry]);
  useEffect(()=>{renderer.current?.update(snapshot);},[snapshot]);
  useEffect(()=>{renderer.current?.configure(quality,matchMedia('(prefers-reduced-motion: reduce)').matches);localStorage.setItem('ice-age-map-quality',quality);},[quality]);
  return <>
    <div ref={host} className="map-render-host" role="img" aria-label={label} data-map-renderer={backend}/>
    <div className="map-render-options">
      <label>Đồ họa <select aria-label="Chất lượng bản đồ" value={quality} onChange={event=>setQuality(event.target.value as typeof quality)}><option value="auto">Tự động</option><option value="normal">Thường</option><option value="low">Thấp</option></select></label>
      {(backend==='canvas2d'||backend==='unavailable')&&<button type="button" onClick={()=>setRetry(value=>value+1)}>Thử lại đồ họa</button>}
      {backend==='unavailable'&&<span role="status">Không tải được bản đồ. Danh sách công trình vẫn dùng được.</span>}
    </div>
  </>;
}
