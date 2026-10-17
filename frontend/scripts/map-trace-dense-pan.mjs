import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';

const seconds=Number(process.env.MAP_TRACE_SECONDS??8);
if(!Number.isFinite(seconds)||seconds<3||seconds>10)throw new Error('MAP_TRACE_SECONDS must be from 3 through 10.');
const quality=process.env.MAP_TRACE_QUALITY??'low';
const categories=[
 'devtools.timeline',
 'disabled-by-default-devtools.timeline',
 'blink',
 'blink.user_timing',
 'disabled-by-default-blink.user_timing',
 'cc',
 'gpu',
 'viz',
 'toplevel',
].join(',');
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
 const tracingComplete=new Promise(resolve=>session.once('Tracing.tracingComplete',resolve));
 await session.send('Tracing.start',{categories,transferMode:'ReturnAsStream',options:'record-until-full'});
 const interaction=await page.evaluate(async durationMs=>{
  const node=document.querySelector('.territory-scene-svg,.terrain-svg--deep');
  if(!node)throw new Error('The dense map interaction surface is missing.');
  const bounds=node.getBoundingClientRect(),x=bounds.left+bounds.width*.45,y=bounds.top+bounds.height*.65;
  const start=performance.now();let moves=0,lastProgress=-1,previous=null,maxGap=0;
  performance.mark('dense520-pan:start');
  const send=(type,t)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:41,pointerType:'mouse',button:0,clientX:x+Math.sin(t*.8)*170,clientY:y+Math.cos(t*.5)*70-70}));
  send('pointerdown',0);
  await new Promise(resolve=>{
   const step=timestamp=>{
    if(previous!==null)maxGap=Math.max(maxGap,timestamp-previous);
    previous=timestamp;
    const elapsed=performance.now()-start,t=elapsed/1000,second=Math.floor(elapsed/1000);
    if(second>lastProgress&&second<durationMs/1000){performance.mark('dense520-pan:second-'+second);lastProgress=second;}
    if(elapsed<durationMs){send('pointermove',t);moves++;requestAnimationFrame(step);}
    else{send('pointerup',t);performance.mark('dense520-pan:end');resolve();}
   };
   requestAnimationFrame(step);
  });
  return {durationMs:Math.round((performance.now()-start)*10)/10,moves,maxRafGapMs:Math.round(maxGap*10)/10};
 },seconds*1000);
 await session.send('Tracing.end');
 const {stream}=await tracingComplete;
 let traceText='';
 for(;;){const chunk=await session.send('IO.read',{handle:stream,size:1024*1024});traceText+=chunk.data??'';if(chunk.eof)break;}
 await session.send('IO.close',{handle:stream});
 const trace=JSON.parse(traceText),events=trace.traceEvents??[];
 const named=events.filter(event=>event.ph==='M'&&event.name==='thread_name');
 const main=named.find(event=>/CrRendererMain/.test(event.args?.name??''));
 const mainTid=main?.tid;
 const marks=new Map(events.filter(event=>/dense520-pan:(start|end)/.test(event.name??'')).map(event=>[event.name,event.ts]));
 const start=marks.get('dense520-pan:start'),end=marks.get('dense520-pan:end');
 const windowEvents=events.filter(event=>event.ph==='X'&&Number.isFinite(event.dur)&&(!Number.isFinite(start)||!Number.isFinite(end)||event.ts+event.dur>=start&&event.ts<=end));
 const mainEvents=windowEvents.filter(event=>mainTid===undefined||event.tid===mainTid);
 const byName=new Map();
 for(const event of mainEvents){let aggregate=byName.get(event.name);if(!aggregate){aggregate={name:event.name,category:event.cat,count:0,totalMs:0,maxMs:0};byName.set(event.name,aggregate);}const duration=event.dur/1000;aggregate.count++;aggregate.totalMs+=duration;aggregate.maxMs=Math.max(aggregate.maxMs,duration);}
 const mainThreadEvents=[...byName.values()].sort((a,b)=>b.totalMs-a.totalMs).slice(0,25).map(event=>({...event,totalMs:Math.round(event.totalMs*10)/10,maxMs:Math.round(event.maxMs*10)/10}));
 const longestEvents=mainEvents.slice().sort((a,b)=>b.dur-a.dur).slice(0,25).map(event=>({name:event.name,category:event.cat,durationMs:Math.round(event.dur/10)/100,ts:event.ts,tid:event.tid}));
 const output=resolve('map-evidence/trace');mkdirSync(output,{recursive:true});
 const tracePath=resolve(output,'dense-520-pan.trace.json');
 writeFileSync(tracePath,traceText);
 const summary={schemaVersion:1,fixture:'dense-520',quality,seconds,driver:'in-page pointer drag scheduled once per animation frame, matching dense benchmark pan coordinates',interaction,tracePath,traceBytes:Buffer.byteLength(traceText),mainThread:main?{name:main.args.name,tid:mainTid}:null,markers:{startUs:start??null,endUs:end??null,observed:Boolean(start!==undefined&&end!==undefined)},mainThreadEvents,longestEvents};
 writeFileSync(resolve(output,'dense-520-pan.summary.json'),JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary));
}finally{
 if(session){try{await session.send('Tracing.end');}catch{}try{await session.send('IO.close');}catch{}}
 if(page)await page.close();
 await browser.close();
}
