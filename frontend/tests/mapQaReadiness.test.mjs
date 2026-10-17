import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForAppliedQaOrientation} from '../scripts/map-qa-readiness.mjs';

test('orientation capture waits for the renderer-applied preview orientation, not the DOM orientation',async()=>{
 const domOrientation='east';
 let appliedOrientation='north',reads=0;
 const waiting=waitForAppliedQaOrientation(async()=>{
  reads++;
  return {domOrientation,qaDraftOrientations:[{id:'draft-1',assetId:'elemental-tower-preview',orientation:appliedOrientation}]};
 },'elemental-tower-preview','east',{timeoutMs:500,pollIntervalMs:1});
 setTimeout(()=>{appliedOrientation='east';},10);
 const result=await waiting;
 assert.ok(reads>1,'the stale renderer orientation should keep the capture waiting');
 assert.equal(result.domOrientation,'east');
 assert.equal(result.qaDraftOrientations[0].orientation,'east');
});
