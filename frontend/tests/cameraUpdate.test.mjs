import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraOnlySnapshot, cameraSourceChanged, terrainInputsChanged } from '../src/rendering/CameraUpdate.ts';

const snapshot=()=>({
 identity:'LL01',visualIdentity:'LL01',modeledInfill:true,compact:false,
 geography:{forest:{x:1,y:2},stone:{x:3,y:4},water:{x:5,y:6}},
 regions:[{x:10,y:20,width:30,depth:40,kind:'forest',ratio:.7}],
 projection:'territory',camera:{x:0,y:0,zoom:1},buildings:[],mode:'normal',
 entities:[],world:false,revision:0,
});

test('same-source camera updates take the fast path and retain terrain/building references',()=>{
 const original=snapshot();
 assert.equal(cameraSourceChanged(original,original),false);
 const updated=cameraOnlySnapshot(original,{x:23,y:-17,zoom:1.4});
 assert.deepEqual(updated.camera,{x:23,y:-17,zoom:1.4});
 assert.strictEqual(updated.geography,original.geography);
 assert.strictEqual(updated.regions,original.regions);
 assert.equal(terrainInputsChanged(original,updated),false);
});

test('changed snapshot source takes the full-update path and carries current scene data with the camera',()=>{
 const previous=snapshot(),latest={...previous,buildings:[{id:'new-building'}],regions:[...previous.regions,{x:100,y:200,width:50,depth:60,kind:'rock',ratio:.9}]};
 assert.equal(cameraSourceChanged(previous,latest),true);
 const updated=cameraOnlySnapshot(latest,{x:23,y:-17,zoom:1.4});
 assert.deepEqual(updated.camera,{x:23,y:-17,zoom:1.4});
 assert.strictEqual(updated.buildings,latest.buildings);
 assert.strictEqual(updated.regions,latest.regions);
 assert.equal(terrainInputsChanged(previous,latest),true);
});

test('full snapshot comparison detects changed terrain values and preserves equivalent recreated arrays',()=>{
 const original=snapshot();
 assert.equal(terrainInputsChanged(original,{...original,camera:{x:10,y:20,zoom:2}}),false);
 const changed={...original,regions:[...original.regions,{x:100,y:200,width:50,depth:60,kind:'rock',ratio:.9}]};
 assert.equal(terrainInputsChanged(original,changed),true);
 const equivalent={...original,regions:original.regions.map(region=>({...region}))};
 assert.equal(terrainInputsChanged(original,equivalent),false,'equivalent recreated arrays retain prior structural semantics');
});
