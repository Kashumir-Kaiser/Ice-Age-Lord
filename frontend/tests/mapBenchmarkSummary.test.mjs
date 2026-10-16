import test from 'node:test';
import assert from 'node:assert/strict';
import {formatBenchmarkSummaries} from '../scripts/map-benchmark-summary.mjs';

test('benchmark summary lines expose frame, render and pointer percentiles per run',()=>{
 const lines=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
  metrics:{renderMs:[5,1,3,2,4]},
  pointerFeedback:{p50:18,p95:45},
 }]);

 assert.deepEqual(lines,[`MAP_BENCH_RESULT ${JSON.stringify({
  quality:'low',fixture:'dense-520',run:2,
  interval:{p50:16,p95:41,p99:90},
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
  renderMs:{p50:null,p95:null,p99:null},
  pointerFeedback:{p50:null,p95:null},
 });
});

test('benchmark summary handles missing render metrics',()=>{
 const [line]=formatBenchmarkSummaries([{
  quality:'low',fixture:'dense-520',run:1,
  interval:{p50:20,p95:50,p99:80},
  pointerFeedback:{p50:22,p95:54},
 }]);
 assert.deepEqual(JSON.parse(line.slice('MAP_BENCH_RESULT '.length)),{
  quality:'low',fixture:'dense-520',run:1,
  interval:{p50:20,p95:50,p99:80},
  renderMs:{p50:null,p95:null,p99:null},
  pointerFeedback:{p50:22,p95:54},
 });
});
