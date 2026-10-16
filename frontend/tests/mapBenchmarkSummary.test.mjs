import test from 'node:test';
import assert from 'node:assert/strict';
import {formatBenchmarkSummaries,formatIntervalDiagnostics} from '../scripts/map-benchmark-summary.mjs';
import {MapMetrics} from '../src/rendering/MapMetrics.ts';

test('benchmark summary lines expose frame, render and pointer percentiles per run',()=>{
 const lines=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  metrics:{renderMs:[5,1,3,2,4]},
  pointerFeedback:{p50:18,p95:45},
 }]);

 assert.deepEqual(lines,[`MAP_BENCH_RESULT ${JSON.stringify({
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
  diagnostics:{intervalByPhase:{pan:{count:0,p95:null},zoom:{count:0,p95:null},selection:{count:0,p95:null}},longTaskOverlap:{supported:false,intervals:0,overlapMs:0},longAnimationFrameOverlap:{supported:false,intervals:0,overlapMs:0}},
  renderMs:{p50:3,p95:5,p99:5},
  pointerFeedback:{p50:18,p95:45},
 })}`]);
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
