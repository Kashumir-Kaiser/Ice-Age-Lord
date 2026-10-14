import { chromium } from '@playwright/test';
import { existsSync,readFileSync } from 'node:fs';
import { resolve,sep,extname } from 'node:path';
import {gzipSync} from 'node:zlib';

const dist=resolve(process.env.MAP_DIST??'dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
export function launchMapBrowser(){return chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info','--js-flags=--expose-gc']});}
export async function navigateMap(page,name){
 const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
 await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name,exact:true}).click();
}
export async function readyMap(page){
 await page.locator('[data-map-renderer]').waitFor();
 // Let React's camera update and the renderer's next frame submit their work.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>{
  const m=window.__mapMetrics?.at(-1);
  return m&&m.backend!=='initializing'&&m.queued===0&&m.pendingTextures===0;
 },null,{timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
}
export async function openMap(browser,{viewport={width:1366,height:768},dpr=1,quality='normal',motion='reduce',fallback=false,fixture=''}={}){
 const page=await browser.newPage({viewport,deviceScaleFactor:dpr,reducedMotion:motion,hasTouch:viewport.width<500,isMobile:viewport.width<500});
 page.mapAssetTransfers=[];
  page.mapScriptTransfers=new Map();
 await page.route('**/*',async route=>{
  const relative=new URL(route.request().url()).pathname.replace(/^\//,'')||'index.html',path=resolve(dist,relative);
  if(!path.startsWith(dist+sep)||!existsSync(path)){await route.fulfill({status:404,body:'Not found'});return;}
  const body=readFileSync(path),textual=['.html','.js','.css','.json','.svg'].includes(extname(path)),served=textual?gzipSync(body):body;
  if(relative.startsWith('assets/map/')||relative==='assets/manifest.json')page.mapAssetTransfers.push({path:relative,bytes:served.length,decodedBytes:body.length,encoding:textual?'gzip':'identity'});
  if(relative.endsWith('.js'))page.mapScriptTransfers.set(relative,{path:relative,bytes:body.length,gzipBytes:gzipSync(body).length});
  await route.fulfill({status:200,contentType:mime[extname(path)]??'application/octet-stream',headers:textual?{'content-encoding':'gzip'}:{},body:served});
 });
 await page.addInitScript(value=>localStorage.setItem('ice-age-map-quality',value),quality);
 await page.goto(`http://map.preview.local/?mode=demo&mapQA=1${fallback?'&mapFallback=1':''}${fixture?'&mapFixture='+fixture:''}`);
 await page.locator('.app-shell').waitFor();await page.evaluate(()=>document.fonts.ready);
 return page;
}
