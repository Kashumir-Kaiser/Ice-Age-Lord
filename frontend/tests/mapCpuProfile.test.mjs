import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCpuProfile} from '../scripts/map-cpu-profile-summary.mjs';

test('CPU profile summary aggregates samples by function URL and keeps stack context',()=>{
 const summary=summarizeCpuProfile({
  nodes:[
   {id:1,callFrame:{functionName:'(root)',url:''},children:[2]},
   {id:2,callFrame:{functionName:'pan',url:'scene.js',lineNumber:10,columnNumber:2},children:[3,4]},
   {id:3,callFrame:{functionName:'transformOverlay',url:'overlay.js',lineNumber:20,columnNumber:4},children:[]},
   {id:4,callFrame:{functionName:'renderCanvas',url:'renderer.js',lineNumber:30,columnNumber:6},children:[]},
  ],
  samples:[3,4,3],
  timeDeltas:[1000,2000,1000],
 });
 assert.equal(summary.sampleCount,3);
 assert.equal(summary.profiledMs,4);
 assert.deepEqual(summary.topFunctions.map(({functionName,url,samples,sampledMs})=>({functionName,url,samples,sampledMs})),[
  {functionName:'transformOverlay',url:'overlay.js',samples:2,sampledMs:2},
  {functionName:'renderCanvas',url:'renderer.js',samples:1,sampledMs:2},
 ]);
 assert.deepEqual(summary.topFunctions[0].contexts[0].frames.map(frame=>frame.functionName),['(root)','pan','transformOverlay']);
 assert.equal(summary.topStacks.length,2);
});

test('CPU profile summary tolerates empty and malformed profiles',()=>{
 assert.deepEqual(summarizeCpuProfile(null),{sampleCount:0,profiledMs:0,topFunctions:[],topStacks:[]});
 assert.deepEqual(summarizeCpuProfile({nodes:[{id:1}],samples:[9],timeDeltas:[500]}),{sampleCount:0,profiledMs:0,topFunctions:[],topStacks:[]});
});
