const percentile=(values,p)=>values.length?values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;

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

export function formatIntervalDiagnostics(result){
 const samples=result.metrics?.intervalSamples??[];
 const byPhase=Object.fromEntries(['pan','zoom','selection'].map(phase=>{
  const durations=samples.filter(sample=>sample.phase===phase).map(sample=>sample.duration);
  return [phase,{count:durations.length,p95:percentile(durations,.95)}];
 }));
 return {intervalByPhase:byPhase,longTaskOverlap:overlapDiagnostics(samples,result.longTasks,result.observerSupport?.longtask),longAnimationFrameOverlap:overlapDiagnostics(samples,result.longAnimationFrames,result.observerSupport?.longAnimationFrame)};
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
