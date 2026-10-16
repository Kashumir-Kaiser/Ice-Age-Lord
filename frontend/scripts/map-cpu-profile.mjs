import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';
import {summarizeCpuProfile} from './map-cpu-profile-summary.mjs';

const seconds=Number(process.env.MAP_CPU_PROFILE_SECONDS??8);
if(!Number.isFinite(seconds)||seconds<1||seconds>10)throw new Error('MAP_CPU_PROFILE_SECONDS must be from 1 through 10.');
const quality=process.env.MAP_CPU_PROFILE_QUALITY??'low';
const browser=await launchMapBrowser();
let page,session;
try{
 page=await openMap(browser,{quality,motion:'no-preference',fixture:'dense-520'});
 await navigateMap(page,'Lãnh địa');
 await page.locator('.territory-calibration > summary').click();
 await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();
 await page.locator('[data-map-renderer]').scrollIntoViewIfNeeded();
 await readyMap(page);
 session=await page.context().newCDPSession(page);
 await session.send('Profiler.enable');
 await session.send('Profiler.setSamplingInterval',{interval:1000});
 await session.send('Profiler.start');
 const interaction=await page.evaluate(async durationMs=>{
  const node=document.querySelector('.territory-scene-svg,.terrain-svg--deep');
  if(!node)throw new Error('The dense map interaction surface is missing.');
  const box=node.getBoundingClientRect(),x=box.left+box.width*.45,y=box.top+box.height*.65;
  const start=performance.now();let pointerMoves=0,rafGaps=[],previous=null;
  const send=(type,t)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:41,pointerType:'mouse',button:0,clientX:x+Math.sin(t*.8)*170,clientY:y+Math.cos(t*.5)*70-70}));
  send('pointerdown',0);
  await new Promise(resolve=>{
   const step=timestamp=>{
    if(previous!==null&&rafGaps.length<2000)rafGaps.push(timestamp-previous);
    previous=timestamp;
    const elapsed=performance.now()-start,t=elapsed/1000;
    if(elapsed<durationMs){send('pointermove',t);pointerMoves++;requestAnimationFrame(step);}
    else{send('pointerup',t);resolve();}
   };
   requestAnimationFrame(step);
  });
  const totalMs=performance.now()-start;
  rafGaps.sort((a,b)=>a-b);
  const percentile=p=>rafGaps.length?Math.round(rafGaps[Math.min(rafGaps.length-1,Math.floor(rafGaps.length*p))]*10)/10:null;
  return {durationMs:Math.round(totalMs*10)/10,pointerMoves,rafGapMs:{p50:percentile(.5),p95:percentile(.95),max:rafGaps.length?Math.round(rafGaps.at(-1)*10)/10:null}};
 },seconds*1000);
 const {profile}=await session.send('Profiler.stop');
 const result={
  schemaVersion:1,
  fixture:'dense-520',
  quality,
  durationSeconds:seconds,
  viewport:{width:1366,height:768,dpr:1},
  url:await page.url(),
  driver:'synthetic pointermove once per page requestAnimationFrame; same pointer coordinates and scene fixture as map benchmark pan',
  interaction,
  cpuProfile:summarizeCpuProfile(profile),
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
