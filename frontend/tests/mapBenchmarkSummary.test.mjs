import test from 'node:test';
import assert from 'node:assert/strict';
import {formatBenchmarkSummaries,formatIntervalDiagnostics,formatIntervalMetrics,formatPageRafDiagnostics,formatRendererRafDiagnostics,formatSlowFrameAttribution,formatLongTaskAttributionByPhase,formatLongAnimationFrameScriptsByPhase,formatPointerMoveDispatchByPhase,formatFeedbackMetrics} from '../scripts/map-benchmark-summary.mjs';
import {MapMetrics} from '../src/rendering/MapMetrics.ts';

test('pointer feedback reports p50, p95, p99 and worst with the existing percentile convention',()=>{
 assert.deepEqual(formatFeedbackMetrics([4,1,3,2]),{p50:3,p95:4,p99:4,worst:4});
 assert.deepEqual(formatFeedbackMetrics([]),{p50:null,p95:null,p99:null,worst:null});
 assert.deepEqual(formatFeedbackMetrics([Number.NaN,8,2]),{p50:8,p95:8,p99:8,worst:8});
});

test('benchmark summary lines expose frame, render and pointer percentiles per run',()=>{
 const lines=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  metrics:{renderMs:[5,1,3,2,4]},
  pointerFeedback:{p50:18,p95:45,p99:50,worst:55},
 }]);

 assert.deepEqual(lines,[`MAP_BENCH_RESULT ${JSON.stringify({
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  renderMs:{p50:3,p95:5,p99:5},
  pointerFeedback:{p50:18,p95:45,p99:50,worst:55},
 })}`]);
});


test('benchmark summary keeps unavailable selection explicit and reports latency only for confirmed picks',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:0,
  interval:{p50:16,p95:40,p99:90},metrics:{renderMs:[1]},pointerFeedback:{p50:20,p95:35},
  interactionCounts:{pan:100,zoom:12,selection:0,selectionAttempts:40,selectionUnavailable:40},
  selectionFeedback:{successfulSamples:0,p50:null,p95:null,p99:null,worst:null},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.deepEqual(result.interactionCounts,{pan:100,zoom:12,selection:0,selectionAttempts:40,selectionUnavailable:40});
 assert.deepEqual(result.selectionFeedback,{successfulSamples:0,p50:null,p95:null,p99:null,worst:null});
});

test('benchmark summary handles empty metric samples',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'local',run:0,
  interval:{p50:null,p95:null,p99:null},metrics:{renderMs:[]},
  pointerFeedback:{p50:null,p95:null},
 }]);
 assert.deepEqual(JSON.parse(line.slice('MAP_BENCH_RESULT '.length)),{
  quality:'normal',fixture:'local',run:0,
  interval:{p50:null,p95:null,p99:null},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  renderMs:{p50:null,p95:null,p99:null},
  pointerFeedback:{p50:null,p95:null},
 });
});

test('benchmark summary handles missing render metrics',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:1,
  interval:{p50:20,p95:50,p99:80},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  pointerFeedback:{p50:22,p95:54},
 }]);
 assert.deepEqual(JSON.parse(line.slice('MAP_BENCH_RESULT '.length)),{
  quality:'low',fixture:'dense-520',run:1,
  interval:{p50:20,p95:50,p99:80},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  renderMs:{p50:null,p95:null,p99:null},
  pointerFeedback:{p50:22,p95:54},
 });
});

test('benchmark diagnostics tag intervals by interaction phase and attribute unioned observer overlap',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'fresh',run:0,
  interval:{p50:20,p95:50,p99:80},metrics:{renderMs:[],intervalSamples:[
   {start:0,end:20,duration:20,phase:'pan'},
   {start:20,end:60,duration:40,phase:'zoom'},
   {start:60,end:120,duration:60,phase:'selection'},
  ]},
  longTasks:[{start:25,duration:20},{start:35,duration:15},{start:-20,duration:10},{start:125,duration:10}],
  longAnimationFrames:[{start:60,duration:30}],
  observerSupport:{longtask:true,longAnimationFrame:false},
  pointerFeedback:{p50:10,p95:30},
 }]);
 const {diagnostics}=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.deepEqual(diagnostics.intervalByPhase,{
  pan:{count:1,p95:20},zoom:{count:1,p95:40},selection:{count:1,p95:60},
 });
 assert.deepEqual(diagnostics.longTaskOverlap,{supported:true,intervals:1,overlapMs:25});
 assert.deepEqual(diagnostics.longAnimationFrameOverlap,{supported:false,intervals:0,overlapMs:0});
 assert.deepEqual(diagnostics.slowFrameAttribution,{thresholdMs:20,badRendererIntervals:2,overlappingLongAnimationFrames:1,blockingDurationMs:0,renderStartCount:0,styleAndLayoutStartCount:0,topScripts:[]});
 assert.equal(diagnostics.longTaskAttributionByPhase.byPhase.zoom.count,2);
 assert.equal(diagnostics.longAnimationFrameScriptsByPhase.byPhase.selection.overlappingFrames,1);
});

test('page RAF diagnostics group only valid samples and report bounded phase percentiles',()=>{
 const diagnostics=formatPageRafDiagnostics([
  {start:0,end:10,duration:10,phase:'pan'},
  {start:10,end:30,duration:20,phase:'pan'},
  {start:30,end:60,duration:30,phase:'zoom'},
  {start:60,end:100,duration:40,phase:'selection'},
  {start:1,end:2,duration:1,phase:'boundary'},
  {start:2,end:2,duration:0,phase:'pan'},
 ],2);
 assert.deepEqual(diagnostics,{count:4,p50:30,p95:40,p99:40,max:40,dropped:2,byPhase:{pan:{count:2,p50:20,p95:20,p99:20,max:20},zoom:{count:1,p50:30,p95:30,p99:30,max:30},selection:{count:1,p50:40,p95:40,p99:40,max:40}}});
});

test('slow-frame attribution aggregates scripts overlapping bad intervals',()=>{
 const diagnostics=formatSlowFrameAttribution([
  {start:20,end:40,duration:30,phase:'pan'},
  {start:60,end:90,duration:30,phase:'zoom'},
  {start:100,end:120,duration:20,phase:'selection'},
 ],[
  {start:18,duration:25,blockingDuration:8,renderStart:21,styleAndLayoutStart:30,scripts:[{sourceURL:'bundle.js',sourceFunctionName:'render',invoker:'raf',start:20,duration:20},{sourceURL:'other.js',sourceFunctionName:'layout',invoker:'timer',start:30,duration:8}]},
  {start:55,duration:40,blockingDuration:12,renderStart:57,styleAndLayoutStart:70,scripts:[{sourceURL:'bundle.js',sourceFunctionName:'render',invoker:'raf',start:60,duration:25}]},
  {start:100,duration:20,blockingDuration:50,scripts:[{sourceURL:'ignored.js',start:100,duration:20}]},
 ],'normal');
 assert.deepEqual(diagnostics,{thresholdMs:20,badRendererIntervals:2,overlappingLongAnimationFrames:2,blockingDurationMs:20,renderStartCount:2,styleAndLayoutStartCount:2,topScripts:[{sourceURL:'bundle.js',sourceFunctionName:'render',invoker:'raf',entries:2,overlapMs:45},{sourceURL:'other.js',sourceFunctionName:'layout',invoker:'timer',entries:1,overlapMs:8}]});
});

test('diagnostic intervals reset at sample start, use midpoint phase, and freeze at sample end',()=>{
 const metrics=new MapMetrics(true);
 metrics.frame(90); // A pre-measurement frame is already the renderer clock's previous frame.
 metrics.data.sampleStartMs=100;
 metrics.data.phaseTransitions=[{at:100,phase:'pan'},{at:150,phase:'zoom'}];
 metrics.frame(110); // Drops the interval crossing the sampling boundary.
 metrics.frame(140);
 metrics.frame(170); // Crosses the pan/zoom boundary; midpoint belongs to zoom.
 metrics.data.sampleEndMs=180;
 metrics.frame(190); // Partial trailing interval is excluded.
 metrics.frame(200); // Later frames cannot extend the frozen sample.
 assert.deepEqual(metrics.data.intervalSamples,[
  {start:110,end:140,duration:30,phase:'pan'},
  {start:140,end:170,duration:30,phase:'zoom'},
 ]);
 assert.deepEqual(metrics.data.intervalMs,[20,30,30,20,10],'existing gate samples retain their prior interval semantics');
 const {intervalByPhase}=formatIntervalDiagnostics({metrics:metrics.data});
 assert.deepEqual(intervalByPhase,{pan:{count:1,p95:30},zoom:{count:1,p95:30},selection:{count:0,p95:null}});
});


test('renderer RAF diagnostics report cadence, entry delay and render/skip counts by phase',()=>{
 const diagnostics=formatRendererRafDiagnostics([
  {time:100,gapMs:null,entryLatenessMs:1,rendered:true,phase:'pan'},
  {time:120,gapMs:20,entryLatenessMs:2,rendered:true,phase:'pan'},
  {time:150,gapMs:30,entryLatenessMs:5,rendered:false,phase:'zoom'},
  {time:170,gapMs:20,entryLatenessMs:3,rendered:false,phase:'selection'},
  {time:180,gapMs:10,entryLatenessMs:99,rendered:true,phase:'boundary'},
 ]);
 assert.deepEqual(diagnostics,{
  count:4,rendered:2,skipped:2,gapMs:{p50:20,p95:30,p99:30},entryLatenessMs:{p50:3,p95:5,p99:5},
  byPhase:{
   pan:{count:2,rendered:2,skipped:0,gapMs:{p50:20,p95:20,p99:20},entryLatenessMs:{p50:2,p95:2,p99:2}},
   zoom:{count:1,rendered:0,skipped:1,gapMs:{p50:30,p95:30,p99:30},entryLatenessMs:{p50:5,p95:5,p99:5}},
   selection:{count:1,rendered:0,skipped:1,gapMs:{p50:20,p95:20,p99:20},entryLatenessMs:{p50:3,p95:3,p99:3}},
  },
 });
});

test('MAP_BENCH_RESULT includes renderer RAF phase summaries without changing gate fields',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'dense-520',run:0,interval:{p50:17,p95:83,p99:100},
  metrics:{renderMs:[19,20],rendererRafSamples:[
   {time:100,gapMs:null,entryLatenessMs:1,rendered:true,phase:'pan'},
   {time:120,gapMs:20,entryLatenessMs:3,rendered:false,phase:'pan'},
   {time:150,gapMs:30,entryLatenessMs:8,rendered:true,phase:'zoom'},
  ]},pointerFeedback:{p50:20,p95:40},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.equal(result.interval.p95,83);assert.deepEqual(result.renderMs,{p50:20,p95:20,p99:20});
 assert.deepEqual(result.diagnostics.rendererRaf.byPhase.pan.gapMs,{p50:20,p95:20,p99:20});
 assert.deepEqual(result.diagnostics.rendererRaf.byPhase.pan.entryLatenessMs,{p50:3,p95:3,p99:3});
 assert.equal(result.diagnostics.rendererRaf.byPhase.pan.rendered,1);assert.equal(result.diagnostics.rendererRaf.byPhase.pan.skipped,1);
 assert.equal(result.diagnostics.rendererRaf.byPhase.zoom.gapMs.p95,30);
});

test('renderer RAF samples exclude the pre-window gap and post-end callbacks and use midpoint phase',()=>{
 const metrics=new MapMetrics(true);metrics.data.sampleStartMs=100;metrics.data.sampleEndMs=180;metrics.data.phaseTransitions=[{at:100,phase:'pan'},{at:150,phase:'zoom'}];
 metrics.frameCallback(90,91,true);metrics.frameCallback(110,111,true);metrics.frameCallback(140,142,false);metrics.frameCallback(170,173,true);metrics.frameCallback(190,195,false);metrics.frameCallback(200,205,true);
 assert.deepEqual(metrics.data.rendererRafSamples,[
  {time:110,gapMs:null,entryLatenessMs:1,rendered:true,phase:'pan'},
  {time:140,gapMs:30,entryLatenessMs:2,rendered:false,phase:'pan'},
  {time:170,gapMs:30,entryLatenessMs:3,rendered:true,phase:'zoom'},
 ]);
});


test('benchmark attributes Long Tasks, LoAF scripts and pointermove dispatch by phase',()=>{
 const intervals=[{start:0,end:30,duration:30,phase:'pan'},{start:30,end:60,duration:30,phase:'zoom'}];
 const longTasks=formatLongTaskAttributionByPhase(intervals,[
  {start:2,duration:12,attribution:[{containerType:'window',containerSrc:'https://example.test',containerId:'frame',containerName:'map'}]},
  {start:40,duration:15,attribution:[]},
  {start:61,duration:20,attribution:[{containerName:'outside'}]},
 ],true);
 assert.deepEqual(longTasks,{supported:true,byPhase:{
  pan:{count:1,totalDurationMs:12,topAttributions:[{containerType:'window',containerSrc:'https://example.test',containerId:'frame',containerName:'map',entries:1,durationMs:12}]},
  zoom:{count:1,totalDurationMs:15,topAttributions:[{containerType:null,containerSrc:null,containerId:null,containerName:null,entries:1,durationMs:15}]},
  selection:{count:0,totalDurationMs:0,topAttributions:[]},
 }});
 const frames=formatLongAnimationFrameScriptsByPhase(intervals,[
  {start:3,duration:20,blockingDuration:8,scripts:[{sourceURL:'bundle.js',sourceFunctionName:'pointerMove',invoker:'event',start:5,duration:10}]},
  {start:35,duration:20,scripts:[{sourceURL:'bundle.js',sourceFunctionName:'wheel',invoker:'event',start:38,duration:8}]},
 ],'normal',true);
 assert.equal(frames.supported,true);
 assert.deepEqual(frames.byPhase.pan,{overlappingFrames:1,topScripts:[{sourceURL:'bundle.js',sourceFunctionName:'pointerMove',invoker:'event',entries:1,overlapMs:10}]});
 assert.deepEqual(frames.byPhase.zoom,{overlappingFrames:1,topScripts:[{sourceURL:'bundle.js',sourceFunctionName:'wheel',invoker:'event',entries:1,overlapMs:8}]});
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'dense-520',run:0,interval:{p50:10,p95:30,p99:60},
  metrics:{renderMs:[],intervalSamples:intervals},
  longTasks:[{start:2,duration:12,attribution:[{containerType:'window',containerName:'map'}]}],
  longAnimationFrames:[{start:3,duration:20,scripts:[{sourceURL:'bundle.js',sourceFunctionName:'pointerMove',invoker:'event',start:5,duration:10}]}],
  observerSupport:{longtask:true,longAnimationFrame:true},
  pointerMoveSamples:[{start:4,end:5,duration:1,phase:'pan'},{start:40,end:43,duration:3,phase:'zoom'}],pointerMoveDropped:2,
  pointerFeedback:{p50:1,p95:3},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.equal(result.diagnostics.longTaskAttributionByPhase.byPhase.pan.topAttributions[0].containerName,'map');
 assert.equal(result.diagnostics.longAnimationFrameScriptsByPhase.byPhase.pan.topScripts[0].sourceFunctionName,'pointerMove');
 assert.deepEqual(result.diagnostics.pointerMoveDispatchByPhase,{dropped:2,byPhase:{
  pan:{count:1,p50:1,p95:1,p99:1,max:1},
  zoom:{count:1,p50:3,p95:3,p99:3,max:3},
  selection:{count:0,p50:null,p95:null,p99:null,max:null},
 }});
});

test('dense benchmark result logs current renderer object and texture counters',()=>{
 const counters={drawCalls:42,visible:87,total:520,textureBytes:123456,terrainBytes:78901,effectSprites:12};
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'dense-520',run:1,
  interval:{p50:16,p95:33,p99:50},metrics:{renderMs:[4,6],...counters},
  pointerFeedback:{p50:20,p95:40},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 for(const [key,value] of Object.entries(counters))assert.equal(result[key],value);
 assert.equal(result.renderMs.p95,6);
 assert.deepEqual(formatBenchmarkSummaries([{
  quality:'normal',fixture:'local',run:1,interval:{p50:16,p95:33,p99:50},
  metrics:{renderMs:[4,6],...counters},pointerFeedback:{p50:20,p95:40},
 }])[0].includes('"drawCalls"'),false,'other fixture logs stay unchanged');
});


test('warmed interval percentiles exclude the pre-window gap and retain in-window hitches separately from lifetime cadence',()=>{
 const metrics=new MapMetrics(true);
 metrics.frame(10);
 metrics.data.sampleStartMs=100;
 metrics.data.phaseTransitions=[{at:100,phase:'pan'}];
 metrics.frame(500); // The 490ms interval began before measurement and is excluded from the warmed sample.
 let time=500;
 for(const duration of [...Array(18).fill(16),250,250]){time+=duration;metrics.frame(time);}
 metrics.data.sampleEndMs=time+1;
 metrics.frame(time+5); // Trailing interval is outside the measurement window.
 const formatted=formatIntervalMetrics(metrics.data);
 assert.equal(metrics.data.intervalMs[0],490,'lifetime cadence retains the pre-window hitch');
 assert.equal(formatted.interval.p95,250,'warmed p95 keeps the in-window 250ms hitches');
 assert.equal(formatted.interval.worst,250);
 assert.equal(formatted.lifetimeInterval.worst,490);
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'dense-520',run:0,interval:formatted.interval,lifetimeInterval:formatted.lifetimeInterval,
  metrics:{renderMs:[],intervalSamples:metrics.data.intervalSamples},pointerFeedback:{p50:null,p95:null},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.deepEqual(result.interval,formatted.interval);
 assert.deepEqual(result.lifetimeInterval,formatted.lifetimeInterval);
});

test('pan interval budget percentiles are isolated from zoom and selection outliers',()=>{
 const pan=[10,20,30].map(duration=>({start:0,end:duration,duration,phase:'pan'}));
 const zoom=[100,120].map(duration=>({start:0,end:duration,duration,phase:'zoom'}));
 const selection=[200,240].map(duration=>({start:0,end:duration,duration,phase:'selection'}));
 const base=formatIntervalMetrics({intervalSamples:[...pan,...zoom,...selection],intervalMs:[10,20,30,100,120,200,240]});
 const extended=formatIntervalMetrics({intervalSamples:[...pan,...zoom,...selection,
  {start:0,end:10000,duration:10000,phase:'zoom'},
  {start:0,end:50000,duration:50000,phase:'selection'},
 ],intervalMs:[10,20,30,100,120,200,240,10000,50000]});
 assert.deepEqual(base.panInterval,{p50:20,p95:30,p99:30,worst:30});
 assert.deepEqual(extended.panInterval,base.panInterval,'non-pan intervals cannot change the pan budget metric');
 assert.notDeepEqual(extended.interval,base.interval,'aggregate interval remains available and reflects every phase');
 assert.deepEqual(extended.intervalByPhase.pan,{count:3,p50:20,p95:30,p99:30,worst:30});
 assert.deepEqual(extended.intervalByPhase.zoom,{count:3,p50:120,p95:10000,p99:10000,worst:10000});
 assert.deepEqual(extended.intervalByPhase.selection,{count:3,p50:240,p95:50000,p99:50000,worst:50000});
 const [line]=formatBenchmarkSummaries([{
  quality:'low',fixture:'local',run:0,interval:extended.interval,panInterval:extended.panInterval,
  intervalByPhase:extended.intervalByPhase,lifetimeInterval:extended.lifetimeInterval,
  metrics:{renderMs:[],intervalSamples:[...pan,...zoom,...selection]},pointerFeedback:{p50:25,p95:40,p99:50,worst:55},
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.equal(result.intervalBudgetMetric,'panInterval');
 assert.equal(result.pointerFeedbackPhase,'unspecified','pointer latency samples are not event/frame phase-attributed');
 assert.deepEqual(result.panInterval,base.panInterval);
 assert.deepEqual(result.intervalByPhase,extended.intervalByPhase);
 assert.deepEqual(result.interval,extended.interval,'aggregate interval remains backward compatible');
});


test('benchmark summary records the measured WebGL adapter and verification result',()=>{
 const gpuInfo={vendor:'Intel Inc.',renderer:'Intel(R) UHD Graphics 620',vendorSource:'unmasked',rendererSource:'unmasked'};
 const [line]=formatBenchmarkSummaries([{
  quality:'normal',fixture:'fresh',run:0,interval:{p50:16,p95:17,p99:20,worst:22},
  metrics:{renderMs:[]},pointerFeedback:{p50:16,p95:17},gpu:gpuInfo.renderer,gpuInfo,headless:false,targetDeviceVerified:true,
 }]);
 const result=JSON.parse(line.slice('MAP_BENCH_RESULT '.length));
 assert.equal(result.gpu,'Intel(R) UHD Graphics 620');
 assert.deepEqual(result.gpuInfo,gpuInfo);
 assert.equal(result.headless,false);
 assert.equal(result.targetDeviceVerified,true);
});
