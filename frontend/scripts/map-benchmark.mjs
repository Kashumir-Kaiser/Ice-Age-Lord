import {mkdirSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import os from 'node:os';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';
import {formatBenchmarkSummaries,formatPageRafDiagnostics} from './map-benchmark-summary.mjs';

const seconds=Number(process.env.MAP_BENCH_SECONDS??60),runs=Number(process.env.MAP_BENCH_RUNS??3),warmup=Number(process.env.MAP_BENCH_WARMUP??10);
const browser=await launchMapBrowser(),results=[];
const output=resolve('map-evidence/benchmark');mkdirSync(output,{recursive:true});
const quality=process.env.MAP_BENCH_QUALITY??'normal';
const percentile=(values,p)=>values.length?values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
try{
 for(const fixture of ['fresh','populated','dense-520','local','world-1023'])for(let run=0;run<runs;run++){
  const page=await openMap(browser,{quality,motion:'no-preference',fixture:fixture==='world-1023'?'1023':fixture==='dense-520'?'dense-520':''});
  const observerSupport=await page.evaluate(()=>{
   const supported=PerformanceObserver.supportedEntryTypes??[];
   const state={longTasks:[],longAnimationFrames:[],observers:[],dropped:{longTasks:0,longAnimationFrames:0}};window.__mapBenchObserverState=state;
   const append=(key,value,limit)=>{if(state[key].length<limit)state[key].push(value);else state.dropped[key]++;};
   const serialize=(type,e)=>type==='longtask'?{start:e.startTime,duration:e.duration}:{start:e.startTime,duration:e.duration,blockingDuration:Number.isFinite(e.blockingDuration)?e.blockingDuration:null,renderStart:Number.isFinite(e.renderStart)?e.renderStart:null,styleAndLayoutStart:Number.isFinite(e.styleAndLayoutStart)?e.styleAndLayoutStart:null,scripts:Array.from(e.scripts??[]).slice(0,16).map(script=>({sourceURL:script.sourceURL??null,sourceFunctionName:script.sourceFunctionName??null,invoker:script.invoker??null,duration:Number.isFinite(script.duration)?script.duration:null,start:Number.isFinite(script.startTime)?script.startTime:Number.isFinite(script.executionStart)?script.executionStart:null}))};
   const observe=(type,key)=>{if(!supported.includes(type))return false;try{const observer=new PerformanceObserver(entries=>entries.getEntries().forEach(e=>append(key,serialize(type,e),type==='longtask'?10000:1000)));observer.observe({type,buffered:false});state.observers.push({observer,type,key,serialize,append});return true;}catch{return false;}};
   return {longtask:observe('longtask','longTasks'),longAnimationFrame:observe('long-animation-frame','longAnimationFrames')};
  });
  await navigateMap(page,fixture==='local'||fixture==='world-1023'?'Bản đồ':'Lãnh địa');
  if(fixture==='dense-520'){await page.locator('.territory-calibration > summary').click();await page.getByRole('button',{name:'Xem nhóm công trình minh họa',exact:true}).click();}
  if(fixture==='populated'){
   await page.getByRole('button',{name:/Thử bố trí Nhà thấp/}).click();const scene=page.locator('.territory-scene-svg');
   const box=await scene.boundingBox();for(let i=0;i<12;i++)await scene.click({position:{x:box.width*(.2+i%4*.15),y:box.height*(.35+Math.floor(i/4)*.15)}});
   await page.keyboard.press('Escape');
  }
  if(fixture==='world-1023')await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới',exact:true}).click();
  await page.locator('[data-map-renderer]').scrollIntoViewIfNeeded();await readyMap(page);
  const coldTransfer={schemaVersion:2,bytes:page.mapAssetTransfers.reduce((sum,item)=>sum+item.bytes,0),decodedBytes:page.mapAssetTransfers.reduce((sum,item)=>sum+item.decodedBytes,0),requests:page.mapAssetTransfers.slice(),scope:'All map-directory assets plus the runtime manifest through first scene readiness. Textual responses are actually gzip-encoded by the fixture server; existing UI/splash assets excluded. Added JS gzip reported separately.',fixtureState:fixture==='populated'?'Demo drafts prepared after initial navigation; NOT a saved-populated LIVE cold load.':fixture==='dense-520'?'Dense test fixture activated after initial navigation.':'Initial visibility-filtered demo scene.'};
  await page.waitForTimeout(warmup*1000);
  const interactions=await page.evaluate(async duration=>{
   const node=document.querySelector('.territory-scene-svg,.terrain-svg--deep'),box=node.getBoundingClientRect();
   const start=performance.now(),x=box.left+box.width*.45,y=box.top+box.height*.65,feedback=[],pageRafSamples=[],counts={pan:0,zoom:0,selection:0,selectionUnavailable:0,emptyPicks:0};let pageRafDropped=0,heartbeat=true,lastHeartbeat=null,endedPan=false,lastZoom=0,lastSelection=0,activePhase='pan';
   const phaseBounds=[start,start+duration*1000/3,start+duration*2000/3,start+duration*1000],phaseNames=['pan','zoom','selection'];
   const rafHeartbeat=timestamp=>{if(lastHeartbeat!==null){const phaseIndex=phaseBounds.findIndex((bound,index)=>index<phaseNames.length&&lastHeartbeat>=bound&&timestamp<=phaseBounds[index+1]);if(phaseIndex>=0){if(pageRafSamples.length<20000)pageRafSamples.push({start:lastHeartbeat,end:timestamp,duration:timestamp-lastHeartbeat,phase:phaseNames[phaseIndex]});else pageRafDropped++;}}lastHeartbeat=timestamp;if(heartbeat&&timestamp<phaseBounds[3])requestAnimationFrame(rafHeartbeat);};
   requestAnimationFrame(rafHeartbeat);
   const send=(type,dx,dy)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:41,pointerType:'mouse',button:0,clientX:x+dx,clientY:y+dy}));
   const metrics=window.__mapMetrics.at(-1);metrics.renderMs=[];metrics.intervalMs=[];metrics.intervalSamples=[];metrics.rendererRafSamples=[];metrics.sampleStartMs=start;metrics.sampleEndMs=null;metrics.phaseTransitions=[{at:start,phase:activePhase}];
   send('pointerdown',0,0);
   await new Promise(resolve=>{
    const step=()=>{
     const now=performance.now(),t=(now-start)/1000,stamp=performance.now();
     const phase=t<duration/3?'pan':t<duration*2/3?'zoom':'selection';if(phase!==activePhase){activePhase=phase;metrics.phaseTransitions.push({at:now,phase});}let dispatched=false;
     if(phase==='pan'){send('pointermove',Math.sin(t*.8)*170,Math.cos(t*.5)*70-70);counts.pan++;dispatched=true;}
     else{
      if(!endedPan){send('pointerup',Math.sin(t*.8)*170,Math.cos(t*.5)*70-70);endedPan=true;}
      if(phase==='zoom'&&now-lastZoom>=500){node.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:x,clientY:y,deltaY:Math.sin(t)*100}));lastZoom=now;counts.zoom++;dispatched=true;}
      if(phase==='selection'&&now-lastSelection>=500){const targets=Array.from(node.querySelectorAll('[role="button"]')).filter(target=>{const b=target.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=box.left&&b.right<=box.right&&b.top>=box.top&&b.bottom<=box.bottom;});const target=targets[Math.floor(t*2)%targets.length];if(target){const b=target.getBoundingClientRect();target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:b.left+b.width/2,clientY:b.top+b.height/2}));counts.selection++;dispatched=true;}else {counts.selectionUnavailable++;node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:x,clientY:y}));counts.emptyPicks++;dispatched=true;}lastSelection=now;}
     }
     const before=metrics.frames;
     if(dispatched)requestAnimationFrame(function waitForRender(){
      if(phase==='selection')requestAnimationFrame(()=>feedback.push(performance.now()-stamp));
      else if(metrics.frames>before)feedback.push(performance.now()-stamp);
      else if(performance.now()-stamp<2000)requestAnimationFrame(waitForRender);
     });
     if(now-start<duration*1000)requestAnimationFrame(step);else{if(!endedPan)send('pointerup',Math.sin(t*.8)*170,Math.cos(t*.5)*70-70);metrics.sampleEndMs=now;resolve();}
    };requestAnimationFrame(step);
   });
   heartbeat=false;
   return {feedback,counts,segments:['pan','pointer-centered zoom','permitted entity/cluster selection or empty-footprint picking'],pageRafSamples,pageRafDropped};
  },seconds);
  const {metrics,longTasks,longAnimationFrames,observerDropped}=await page.evaluate(()=>{const state=window.__mapBenchObserverState;if(state)for(const {observer,type,key,serialize,append} of state.observers)for(const entry of observer.takeRecords())append(key,serialize(type,entry),type==='longtask'?10000:1000);return {metrics:window.__mapMetrics.at(-1),longTasks:state?.longTasks??[],longAnimationFrames:state?.longAnimationFrames??[],observerDropped:state?.dropped??{}};});
  const gpu=await page.evaluate(()=>{const canvas=document.querySelector('.map-render-canvas');const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');if(!gl)return null;const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
  results.push({fixture,run,quality,seconds,warmup,gpu,metrics,coldTransfer,longTasks,longAnimationFrames,observerDropped,observerSupport,pageRafDiagnostics:formatPageRafDiagnostics(interactions.pageRafSamples,interactions.pageRafDropped),interactionCounts:interactions.counts,segments:interactions.segments,pointerFeedback:{p50:percentile(interactions.feedback,.5),p95:percentile(interactions.feedback,.95)},interval:{p50:percentile(metrics.intervalMs,.5),p95:percentile(metrics.intervalMs,.95),p99:percentile(metrics.intervalMs,.99),worst:metrics.intervalMs.length?Math.max(...metrics.intervalMs):null},visibleMarkers:await page.locator('.map-entity-marker,.map-cluster').count()});
  await page.close();console.log(`Measured ${fixture} run ${run+1}/${runs}`);
 }
}finally{
 const summary=['fresh','populated','dense-520','local','world-1023'].map(fixture=>{const samples=results.filter(r=>r.fixture===fixture);return {fixture,completedRuns:samples.length,medianIntervalP95:percentile(samples.map(r=>r.interval.p95).filter(Number.isFinite),.5),medianPointerP95:percentile(samples.map(r=>r.pointerFeedback.p95).filter(Number.isFinite),.5)};});
 const rendererBundles=readdirSync(resolve('dist/assets')).filter(name=>/^(MapRenderer|MapCanvas|terrain\.worker|WebGLRenderer|RenderTargetSystem|Texture)/.test(name)&&name.endsWith('.js')).map(name=>{const bytes=readFileSync(resolve('dist/assets',name));return {name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length};});
 writeFileSync(resolve(output,'results.json'),JSON.stringify({environment:{node:process.version,platform:os.platform(),cpu:os.cpus()[0]?.model,cpuCount:os.cpus().length,ramBytes:os.totalmem(),browser:'Chromium headless',viewport:{width:1366,height:768},dpr:1,targetDeviceVerified:false},rendererBundles,rendererBundleScope:'Named renderer entry and split chunks; not a complete before/after JS delta.',rendererGzipBytes:rendererBundles.reduce((sum,b)=>sum+b.gzipBytes,0),summary,results},null,2));
 for(const line of formatBenchmarkSummaries(results))console.log(line);
 await browser.close();
}
console.log('Headless measurements are diagnostics, not validation of Intel UHD 620 GPU performance.');
