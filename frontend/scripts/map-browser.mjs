import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import {startMapFixtureServer} from './map-fixture-server.mjs';

const dist=resolve(process.env.MAP_DIST??'dist');
export async function launchMapBrowser({headless=true}={}) {
 try {
  return await chromium.launch({headless,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info','--js-flags=--expose-gc']});
 } catch(error) {
  if(!headless)throw new Error('Unable to launch headed Chromium for local map benchmarking. MAP_BENCH_HEADLESS=false requires an available desktop display and Chromium system dependencies.',{cause:error});
  throw error;
 }
}
export async function navigateMap(page,name){
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name,exact:true}).click();
}
export async function readyMap(page){
 await page.bringToFront();
 const host=page.locator('.map-render-host');
 if(await host.count())await host.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
 await page.locator('[data-map-renderer]').waitFor();
 // Let React's camera update and the renderer's next frame submit their work.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 try{
  const state=await page.waitForFunction(()=>{
   const host=document.querySelector('.map-render-host');
   if(host){const rect=host.getBoundingClientRect();if(rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth)host.scrollIntoView({block:'center',inline:'nearest'});}
   const m=window.__mapMetrics?.at(-1);
   if(m?.errors?.length)return {errors:m.errors};return m&&m.backend!=='initializing'&&m.queued===0&&m.pendingTextures===0?{ready:true}:false;
  },null,{timeout:60000});
  const result=await state.jsonValue();await state.dispose();
  if(result?.errors?.length)throw new Error('Map renderer failed before readiness: '+result.errors.join('; '));
 }catch(error){
  error.mapReadiness=await page.evaluate(()=>{
   window.__mapReadinessRefresh?.at(-1)?.();
   const host=document.querySelector('.map-render-host'),renderer=document.querySelector('[data-map-renderer]'),rect=host?.getBoundingClientRect();
   return {visibilityState:document.visibilityState,focused:document.hasFocus(),viewport:{width:innerWidth,height:innerHeight},hostRect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height,top:rect.top,right:rect.right,bottom:rect.bottom,left:rect.left}:null,hostFullyOutside:rect?rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth:null,rendererPresent:Boolean(renderer),metrics:window.__mapMetrics?.at(-1)??null};
  }).catch(()=>null);
  const metrics=error.mapReadiness?.metrics??{},details=metrics.pendingTextureDetails??[],pendingPaths=new Set(details.map(item=>{try{const url=new URL(item.id,page.url());return url.pathname+url.search;}catch{return item.id;}}));
  error.mapReadiness={...error.mapReadiness,pendingTextureNetwork:(page.mapAssetEvents??[]).filter(event=>pendingPaths.has(event.path)),completedFixtureTransfers:(page.mapAssetTransfers??[]).filter(item=>pendingPaths.has('/'+item.path))};
  throw error;
 }
 await page.evaluate(()=>document.fonts.ready);
}
export async function openMap(browser,{viewport={width:1366,height:768},dpr=1,quality='normal',motion='reduce',fallback=false,fixture=''}={}){
 const page=await browser.newPage({viewport,deviceScaleFactor:dpr,reducedMotion:motion,hasTouch:viewport.width<500,isMobile:viewport.width<500});
 page.mapAssetTransfers=[];
 page.mapAssetEvents=[];
 page.mapScriptTransfers=new Map();
 const recordAssetEvent=(type,request,response=null)=>{
  try{const url=new URL(request.url());if(!url.pathname.startsWith('/assets/map/'))return;page.mapAssetEvents.push({type,path:url.pathname+url.search,at:Date.now(),...(response?{status:response.status()}:{}),...(type==='requestfailed'?{failure:request.failure()??null}:{})});}catch{}
 };
 page.on('request',request=>recordAssetEvent('request',request));
 page.on('response',response=>recordAssetEvent('response',response.request(),response));
 page.on('requestfinished',request=>recordAssetEvent('requestfinished',request));
 page.on('requestfailed',request=>recordAssetEvent('requestfailed',request));
 const fixtureServer=await startMapFixtureServer(dist,item=>{
  if(item.path.startsWith('assets/map/')||item.path==='assets/manifest.json')page.mapAssetTransfers.push(item);
  if(item.path.endsWith('.js'))page.mapScriptTransfers.set(item.path,{path:item.path,bytes:item.decodedBytes,gzipBytes:item.gzipBytes});
 });
 const cleanup=()=>{browser.off('disconnected',cleanup);void fixtureServer.close();};
 page.once('close',cleanup);browser.once('disconnected',cleanup);
 await page.addInitScript(value=>localStorage.setItem('ice-age-map-quality',value),quality);
 try{
  await page.goto(`${fixtureServer.origin}/?mode=demo&mapQA=1${fallback?'&mapFallback=1':''}${fixture?'&mapFixture='+fixture:''}`);
  await page.locator('.app-shell').waitFor();await page.evaluate(()=>document.fonts.ready);
 }catch(error){await page.close();await fixtureServer.close();throw error;}
 return page;
}
