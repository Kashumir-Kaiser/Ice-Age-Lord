const percentile=(values,p)=>values.length?values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
const rounded=value=>Math.round(value*10)/10;

export function formatPageRafDiagnostics(samples=[],dropped=0){
 const valid=samples.filter(sample=>['pan','zoom','selection'].includes(sample.phase)&&Number.isFinite(sample.start)&&Number.isFinite(sample.end)&&Number.isFinite(sample.duration)&&sample.end>sample.start&&sample.duration>=0);
 const summarize=rows=>({count:rows.length,p50:percentile(rows.map(row=>row.duration),.5),p95:percentile(rows.map(row=>row.duration),.95),p99:percentile(rows.map(row=>row.duration),.99),max:rows.length?Math.max(...rows.map(row=>row.duration)):null});
 return {...summarize(valid),dropped,byPhase:Object.fromEntries(['pan','zoom','selection'].map(phase=>[phase,summarize(valid.filter(sample=>sample.phase===phase))]))};
}

export function formatRendererRafDiagnostics(samples=[]){
 const valid=samples.filter(sample=>['pan','zoom','selection'].includes(sample.phase)&&Number.isFinite(sample.time)&&Number.isFinite(sample.entryLatenessMs));
 const summarize=rows=>({count:rows.length,rendered:rows.filter(row=>row.rendered).length,skipped:rows.filter(row=>!row.rendered).length,gapMs:{p50:percentile(rows.map(row=>row.gapMs).filter(Number.isFinite),.5),p95:percentile(rows.map(row=>row.gapMs).filter(Number.isFinite),.95),p99:percentile(rows.map(row=>row.gapMs).filter(Number.isFinite),.99)},entryLatenessMs:{p50:percentile(rows.map(row=>row.entryLatenessMs).filter(Number.isFinite),.5),p95:percentile(rows.map(row=>row.entryLatenessMs).filter(Number.isFinite),.95),p99:percentile(rows.map(row=>row.entryLatenessMs).filter(Number.isFinite),.99)}});
 return {...summarize(valid),byPhase:Object.fromEntries(['pan','zoom','selection'].map(phase=>[phase,summarize(valid.filter(sample=>sample.phase===phase))]))};
}

function overlapDiagnostics(samples,entries,supported){
 if(!supported)return {supported:false,intervals:0,overlapMs:0};
 const intervals=samples.filter(sample=>Number.isFinite(sample.start)&&Number.isFinite(sample.end));
 const overlaps=intervals.map(sample=>{
  const ranges=(entries??[]).map(entry=>({start:Math.max(sample.start,entry.start),end:Math.min(sample.end,entry.start+entry.duration)})).filter(range=>range.end>range.start).sort((a,b)=>a.start-b.start);
  if(!ranges.length)return 0;
  let overlapMs=0,start=-Infinity,end=-Infinity;
  for(const range of ranges){if(range.start>end){if(Number.isFinite(start))overlapMs+=end-start;start=range.start;end=range.end;}else end=Math.max(end,range.end);}
  overlapMs+=end-start;
  return overlapMs>0?overlapMs:0;
 });
 return {supported:supported??false,intervals:overlaps.filter(value=>value>0).length,overlapMs:Math.round(overlaps.reduce((sum,value)=>sum+value,0)*10)/10};
}

function overlapMs(sample,entry){
 const start=Math.max(sample.start,entry.start),end=Math.min(sample.end,entry.start+entry.duration);
 return Math.max(0,end-start);
}

export function formatSlowFrameAttribution(intervalSamples=[],entries=[],quality='normal'){
 const thresholdMs=quality==='low'?40:20;
 const slow=intervalSamples.filter(sample=>Number.isFinite(sample.start)&&Number.isFinite(sample.end)&&Number.isFinite(sample.duration)&&sample.duration>thresholdMs);
 const frames=(entries??[]).filter(entry=>Number.isFinite(entry.start)&&Number.isFinite(entry.duration)&&slow.some(sample=>overlapMs(sample,entry)>0));
 const contributors=new Map();
 for(const entry of frames)for(const script of entry.scripts??[]){
  const sourceURL=script.sourceURL??null,sourceFunctionName=script.sourceFunctionName??null,invoker=script.invoker??null;
  const key=JSON.stringify([sourceURL,sourceFunctionName,invoker]);
  let row=contributors.get(key);if(!row){row={sourceURL,sourceFunctionName,invoker,entries:0,overlapMs:0};contributors.set(key,row);}
  row.entries++;
  if(Number.isFinite(script.start)&&Number.isFinite(script.duration)&&script.duration>0){
   row.overlapMs+=slow.reduce((sum,sample)=>sum+overlapMs(sample,{start:script.start,duration:script.duration}),0);
  }
 }
 const blockingDurationMs=frames.reduce((sum,entry)=>sum+(Number.isFinite(entry.blockingDuration)?entry.blockingDuration:0),0);
 return {thresholdMs,badRendererIntervals:slow.length,overlappingLongAnimationFrames:frames.length,blockingDurationMs:rounded(blockingDurationMs),renderStartCount:frames.filter(entry=>Number.isFinite(entry.renderStart)&&entry.renderStart>0).length,styleAndLayoutStartCount:frames.filter(entry=>Number.isFinite(entry.styleAndLayoutStart)&&entry.styleAndLayoutStart>0).length,topScripts:[...contributors.values()].map(row=>({...row,overlapMs:rounded(row.overlapMs)})).sort((a,b)=>b.overlapMs-a.overlapMs||b.entries-a.entries).slice(0,5)};
}


function entryPhase(entry,samples){
 const totals={pan:0,zoom:0,selection:0},entryStart=entry.start,entryEnd=entry.start+entry.duration;
 for(const sample of samples??[]){if(!['pan','zoom','selection'].includes(sample.phase)||!Number.isFinite(sample.start)||!Number.isFinite(sample.end))continue;const overlap=Math.max(0,Math.min(entryEnd,sample.end)-Math.max(entryStart,sample.start));totals[sample.phase]+=overlap;}
 return Object.entries(totals).sort((a,b)=>b[1]-a[1])[0]?.[1]>0?Object.entries(totals).sort((a,b)=>b[1]-a[1])[0][0]:null;
}

export function formatLongTaskAttributionByPhase(intervalSamples=[],entries=[],supported=false){
 const phases=Object.fromEntries(['pan','zoom','selection'].map(phase=>[phase,{count:0,totalDurationMs:0,topAttributions:[]}]));
 const groups=Object.fromEntries(['pan','zoom','selection'].map(phase=>[phase,new Map()]));
 for(const entry of entries??[]){if(!Number.isFinite(entry.start)||!Number.isFinite(entry.duration)||!intervalSamples.some(sample=>overlapMs(sample,entry)>0))continue;const phase=entryPhase(entry,intervalSamples);if(!phase)continue;const out=phases[phase];out.count++;out.totalDurationMs+=entry.duration;
  const attributions=Array.isArray(entry.attribution)&&entry.attribution.length?entry.attribution:[{containerType:null,containerSrc:null,containerId:null,containerName:null}];
  for(const item of attributions){const key=JSON.stringify([item.containerType??null,item.containerSrc??null,item.containerId??null,item.containerName??null]);let row=groups[phase].get(key);if(!row){row={containerType:item.containerType??null,containerSrc:item.containerSrc??null,containerId:item.containerId??null,containerName:item.containerName??null,entries:0,durationMs:0};groups[phase].set(key,row);}row.entries++;row.durationMs+=entry.duration;}
 }
 for(const phase of Object.keys(phases)){phases[phase].totalDurationMs=rounded(phases[phase].totalDurationMs);phases[phase].topAttributions=[...groups[phase].values()].map(row=>({...row,durationMs:rounded(row.durationMs)})).sort((a,b)=>b.durationMs-a.durationMs||b.entries-a.entries).slice(0,5);}
 return {supported:!!supported,byPhase:phases};
}

export function formatLongAnimationFrameScriptsByPhase(intervalSamples=[],entries=[],quality='normal',supported=false){
 const byPhase=Object.fromEntries(['pan','zoom','selection'].map(phase=>{const phaseSamples=intervalSamples.filter(sample=>sample.phase===phase),summary=formatSlowFrameAttribution(phaseSamples,entries,quality);return [phase,{overlappingFrames:summary.overlappingLongAnimationFrames,topScripts:summary.topScripts}];}));
 return {supported:!!supported,byPhase};
}

export function formatPointerMoveDispatchByPhase(samples=[],dropped=0){
 const byPhase=Object.fromEntries(['pan','zoom','selection'].map(phase=>{const values=samples.filter(sample=>sample.phase===phase&&Number.isFinite(sample.duration)&&sample.duration>=0).map(sample=>sample.duration);return [phase,{count:values.length,p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99),max:values.length?Math.max(...values):null}];}));
 return {dropped,byPhase};
}

export function formatIntervalDiagnostics(result){
 const samples=result.metrics?.intervalSamples??[];
 const byPhase=Object.fromEntries(['pan','zoom','selection'].map(phase=>{
  const durations=samples.filter(sample=>sample.phase===phase).map(sample=>sample.duration);
  return [phase,{count:durations.length,p95:percentile(durations,.95)}];
 }));
 const diagnostics={intervalByPhase:byPhase,longTaskOverlap:overlapDiagnostics(samples,result.longTasks,result.observerSupport?.longtask),longAnimationFrameOverlap:overlapDiagnostics(samples,result.longAnimationFrames,result.observerSupport?.longAnimationFrame)};
 if(result.pageRafDiagnostics)diagnostics.pageRaf=result.pageRafDiagnostics;
 if(Array.isArray(result.metrics?.rendererRafSamples))diagnostics.rendererRaf=formatRendererRafDiagnostics(result.metrics.rendererRafSamples);
 if(result.longAnimationFrames)diagnostics.slowFrameAttribution=formatSlowFrameAttribution(samples,result.longAnimationFrames,result.quality);
 if(result.observerSupport?.longtask!==undefined)diagnostics.longTaskAttributionByPhase=formatLongTaskAttributionByPhase(samples,result.longTasks,result.observerSupport.longtask);
 if(result.observerSupport?.longAnimationFrame!==undefined)diagnostics.longAnimationFrameScriptsByPhase=formatLongAnimationFrameScriptsByPhase(samples,result.longAnimationFrames,result.quality,result.observerSupport.longAnimationFrame);
 if(Array.isArray(result.pointerMoveSamples))diagnostics.pointerMoveDispatchByPhase=formatPointerMoveDispatchByPhase(result.pointerMoveSamples,result.pointerMoveDropped??0);
 return diagnostics;
}

export function formatBenchmarkResult(result){
 const metric=(values)=>({p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99)});
 const formatted={
  quality:result.quality,
  fixture:result.fixture,
  run:result.run,
  interval:result.interval,
  diagnostics:formatIntervalDiagnostics(result),
  renderMs:metric(result.metrics?.renderMs??[]),
  pointerFeedback:result.pointerFeedback,
 };
 // Report the latest rendered scene state for the dense fixture without changing the gate formulas.
 if(result.fixture==='dense-520'){
  for(const key of ['drawCalls','visible','total','textureBytes','terrainBytes','effectSprites'])
   if(result.metrics&&Object.hasOwn(result.metrics,key))formatted[key]=result.metrics[key];
 }
 return formatted;
}

export function formatBenchmarkSummaries(results){
 return results.map(result=>`MAP_BENCH_RESULT ${JSON.stringify(formatBenchmarkResult(result))}`);
}
