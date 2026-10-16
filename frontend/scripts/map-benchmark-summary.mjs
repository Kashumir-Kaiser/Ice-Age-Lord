const percentile=(values,p)=>values.length?values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;

export function formatBenchmarkResult(result){
 const metric=(values)=>({p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99)});
 return {
  quality:result.quality,
  fixture:result.fixture,
  run:result.run,
  interval:result.interval,
  renderMs:metric(result.metrics?.renderMs??[]),
  pointerFeedback:result.pointerFeedback,
 };
}

export function formatBenchmarkSummaries(results){
 return results.map(result=>`MAP_BENCH_RESULT ${JSON.stringify(formatBenchmarkResult(result))}`);
}
