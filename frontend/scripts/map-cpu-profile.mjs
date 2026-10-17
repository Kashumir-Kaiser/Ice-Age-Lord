import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';
import {summarizeCpuProfile} from './map-cpu-profile-summary.mjs';

const seconds=Number(process.env.MAP_CPU_PROFILE_SECONDS??8);
if(!Number.isFinite(seconds)||seconds<1||seconds>10)throw new Error('MAP_CPU_PROFILE_SECONDS must be from 1 through 10.');
const quality=process.env.MAP_CPU_PROFILE_QUALITY??'low';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const loadSourceMaps=directory=>new Map(readdirSync(directory).filter(file=>file.endsWith('.js.map')).map(file=>{
 const map=JSON.parse(readFileSync(resolve(directory,file),'utf8'));
 return [basename(map.file??file.slice(0,-4)),map];
}));
const browser=await launchMapBrowser();
let page,session;
try{
 page=await openMap(browser,{quality,motion:'no-preference',fixture:'dense-520'});
 await navigateMap(page,'Lãnh địa');
 await page.locator('.territory-calibration > summary').click();
 await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();
 await page.locator('[data-map-renderer]').scrollIntoViewIfNeeded();
 await readyMap(page);
 const surface=page.locator('.territory-scene-svg,.terrain-svg--deep').first();
 const box=await surface.boundingBox();
 if(!box)throw new Error('The dense map interaction surface is missing.');
 const x=box.x+box.width*.45,y=box.y+box.height*.65;
 session=await page.context().newCDPSession(page);
 await session.send('Profiler.enable');
 await session.send('Profiler.setSamplingInterval',{interval:1000});
 await session.send('Profiler.start');
 const start=performance.now(),durationMs=seconds*1000,moveGaps=[];
 let pointerMoves=0,previousMove=null,nextMoveAt=start;
 try{
  await page.mouse.move(x,y);
  await page.mouse.down();
  while(performance.now()-start<durationMs){
   const now=performance.now(),elapsed=now-start,t=elapsed/1000;
   if(previousMove!==null&&moveGaps.length<2000)moveGaps.push(now-previousMove);
   previousMove=now;
   await page.mouse.move(x+Math.sin(t*.8)*170,y+Math.cos(t*.5)*70-70);
   pointerMoves++;
   nextMoveAt+=16;
   await delay(Math.max(0,nextMoveAt-performance.now()));
  }
 }finally{
  await page.mouse.up();
 }
 const totalMs=performance.now()-start;
 moveGaps.sort((a,b)=>a-b);
 const percentile=p=>moveGaps.length?Math.round(moveGaps[Math.min(moveGaps.length-1,Math.floor(moveGaps.length*p))]*10)/10:null;
 const interaction={durationMs:Math.round(totalMs*10)/10,pointerMoves,moveGapMs:{p50:percentile(.5),p95:percentile(.95),max:moveGaps.length?Math.round(moveGaps.at(-1)*10)/10:null}};
 const {profile}=await session.send('Profiler.stop');
 const result={
  schemaVersion:1,
  fixture:'dense-520',
  quality,
  durationSeconds:seconds,
  viewport:{width:1366,height:768,dpr:1},
  url:await page.url(),
  driver:'Node-side Playwright mouse press, ~16ms moves, and release; same pan coordinates and scene fixture as map benchmark',
  interaction,
  cpuProfile:summarizeCpuProfile(profile,{sourceMaps:loadSourceMaps(resolve('dist/assets'))}),
 };
 const output=resolve('map-evidence/cpu-profile');mkdirSync(output,{recursive:true});
 const path=resolve(output,'dense-520-pan.json');
 writeFileSync(path,JSON.stringify(result,null,2));
 console.log(JSON.stringify({artifact:path,sampleCount:result.cpuProfile.sampleCount,profiledMs:result.cpuProfile.profiledMs,topFunctions:result.cpuProfile.topFunctions.slice(0,10)}));
}finally{
 if(session){try{await session.send('Profiler.disable');}catch{}}
 if(page)await page.close();
 await browser.close();
}
