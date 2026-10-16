const percentile=(values,p)=>values.length?values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
const rounded=value=>Math.round(value*10)/10;

export function formatPageRafDiagnostics(samples=[],dropped=0){
 const valid=samples.filter(sample=>['pan','zoom','selection'].includes(sample.phase)&&Number.isFinite(sample.start)&&Number.isFinite(sample.end)&&Number.isFinite(sample.duration)&&sample.end>sample.start&&sample.duration>=0);
 const summarize=rows=>({count:rows.length,p50:percentile(rows.map(row=>row.duration),.5),p95:percentile(rows.map(row=>row.duration),.95),p99:percentile(rows.map(row=>row.duration),.99),max:rows.length?Math.max(...rows.map(row=>row.duration)):null});
 return {...summarize(valid),dropped,byPhase:Object.fromEntries(['pan','zoom','selection'].map(phase=>[phase,summarize(valid.filter(sample=>sample.phase===phase))]))};
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

export function formatIntervalDiagnostics(result){
 const samples=result.metrics?.intervalSamples??[];
 const byPhase=Object.fromEntries(['pan','zoom','selection'].map(phase=>{
  const durations=samples.filter(sample=>sample.phase===phase).map(sample=>sample.duration);
  return [phase,{count:durations.length,p95:percentile(durations,.95)}];
 }));
 const diagnostics={intervalByPhase:byPhase,longTaskOverlap:overlapDiagnostics(samples,result.longTasks,result.observerSupport?.longtask),longAnimationFrameOverlap:overlapDiagnostics(samples,result.longAnimationFrames,result.observerSupport?.longAnimationFrame)};
 if(result.pageRafDiagnostics)diagnostics.pageRaf=result.pageRafDiagnostics;
 if(result.longAnimationFrames)diagnostics.slowFrameAttribution=formatSlowFrameAttribution(samples,result.longAnimationFrames,result.quality);
 return diagnostics;
}

export function formatBenchmarkResult(result){
 const metric=(values)=>({p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99)});
 return {
  quality:result.quality,
  fixture:result.fixture,
  run:result.run,
  interval:result.interval,
  diagnostics:formatIntervalDiagnostics(result),
  renderMs:metric(result.metrics?.renderMs??[]),
  pointerFeedback:result.pointerFeedback,
 };
}

export function formatBenchmarkSummaries(results){
 return results.map(result=>`MAP_BENCH_RESULT ${JSON.stringify(formatBenchmarkResult(result))}`);
}
