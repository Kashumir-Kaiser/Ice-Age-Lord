import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForAppliedQaOrientation} from '../scripts/map-qa-readiness.mjs';

test('orientation capture waits for the active SVG draft and rechecks it after two paint frames',async()=>{
 const assetId='elemental-tower-preview';
 const staleGlobalMetrics={qaDraftOrientations:[{id:'old-map-canvas',assetId,orientation:'east'}]};
 let active={id:'draft-7',assetId,orientation:'north',connected:true};
 let reads=0,paintFrames=0,firstEastPaint=true;
 const readActive=async()=>{reads++;return {...active};};
 const waitForPaint=async before=>{
  assert.equal(before.id,'draft-7');
  const frame=callback=>new Promise(resolve=>queueMicrotask(()=>{paintFrames++;callback();resolve();}));
  await frame(()=>{if(firstEastPaint&&before.orientation==='east'){active={...active,orientation:'south'};firstEastPaint=false;}});
  await frame(()=>{});
  return {...active};
 };
 const waiting=waitForAppliedQaOrientation(readActive,waitForPaint,assetId,'east',{timeoutMs:500,pollIntervalMs:1});
 setTimeout(()=>{active={...active,orientation:'east'};},10);
 setTimeout(()=>{active={...active,orientation:'east'};},25);
 const result=await waiting;
 assert.equal(staleGlobalMetrics.qaDraftOrientations[0].orientation,'east','a stale global renderer metric must not stand in for the active SVG node');
 assert.ok(reads>1,'the active SVG north orientation should keep capture waiting');
 assert.ok(paintFrames>=4,'the candidate orientation must survive a two-frame paint cycle before acceptance');
 assert.deepEqual(result,{id:'draft-7',assetId,orientation:'east',connected:true});
});
