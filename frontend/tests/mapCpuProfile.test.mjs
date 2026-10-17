import test from 'node:test';
import assert from 'node:assert/strict';
import {mapCpuFrame,summarizeCpuProfile} from '../scripts/map-cpu-profile-summary.mjs';

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

test('CPU profile frames map through job-only sourcemaps and retain compiled locations',()=>{
 const map={
  version:3,
  file:'MapRenderer-test.js',
  sources:['../../src/rendering/MapRenderer.ts'],
  names:['drawTerrain'],
  mappings:'AAAAA',
 };
 const frame=mapCpuFrame({functionName:'Oe',url:'http://localhost/assets/MapRenderer-test.js',lineNumber:0,columnNumber:0},new Map([['MapRenderer-test.js',map]]));
 assert.deepEqual(frame,{
  functionName:'drawTerrain',
  url:'src/rendering/MapRenderer.ts',
  lineNumber:0,
  columnNumber:0,
  compiled:{functionName:'Oe',url:'http://localhost/assets/MapRenderer-test.js',lineNumber:0,columnNumber:0},
 });
 const summary=summarizeCpuProfile({nodes:[{id:1,callFrame:{functionName:'Oe',url:'http://localhost/assets/MapRenderer-test.js',lineNumber:0,columnNumber:0}}],samples:[1],timeDeltas:[1000]},{sourceMaps:new Map([['MapRenderer-test.js',map]])});
 assert.equal(summary.topFunctions[0].functionName,'drawTerrain');
 assert.equal(summary.topFunctions[0].url,'src/rendering/MapRenderer.ts');
 assert.equal(summary.topFunctions[0].contexts[0].frames[0].compiled.functionName,'Oe');
});
