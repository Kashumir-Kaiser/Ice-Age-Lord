import test from 'node:test';
import assert from 'node:assert/strict';
import {paintedIceWeight,paintedIceMaterialWeights} from '../src/rendering/TerrainChunkCache.ts';

test('painted ice mask has smooth endpoints and preserves the two-tile mixture',()=>{
 assert.equal(paintedIceWeight(0),0);
 assert.equal(paintedIceWeight(.34),0);
 assert.equal(paintedIceWeight(.56),1);
 assert.equal(paintedIceWeight(1),1);
 const samples=[.2,.34,.38,.45,.52,.56,.8].map(paintedIceWeight);
 assert.ok(samples.every((value,index)=>index===0||value>=samples[index-1]),'mask is monotonic');
 assert.ok(Math.abs(paintedIceWeight(.45)-.5)<1e-12,'the original semantic boundary receives a partial visual blend');
 const blend=paintedIceWeight(.5);
 assert.deepEqual(paintedIceMaterialWeights(.2,.3),[blend*.4,blend*.6]);
 assert.deepEqual(paintedIceMaterialWeights(0,0),[0,0]);
});
