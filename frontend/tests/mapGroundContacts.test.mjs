import test from 'node:test';
import assert from 'node:assert/strict';
import {GroundContacts} from '../src/rendering/GroundContacts.ts';
test('compaction follows actual footprints and only moved or removed contacts invalidate old and new ground',()=>{
 const contacts=new GroundContacts(),house={id:'house',x:-32,y:0,width:4,depth:8};
 assert.equal(contacts.scuffAt(-32,0),0);assert.equal(contacts.update([house]).length,1);
 assert.equal(contacts.scuffAt(-32,0),.6);assert.ok(contacts.scuffAt(-32,4)>contacts.scuffAt(-28,0));assert.equal(contacts.scuffAt(100,100),0);
 assert.deepEqual(contacts.update([{...house}]),[],'camera-only snapshots do not invalidate ground');
 const changed=contacts.update([{...house,x:32}]);assert.equal(changed.length,2);assert.ok(changed.some(b=>b.minX< -32)&&changed.some(b=>b.maxX>32));
 assert.equal(contacts.scuffAt(-32,0),0);assert.equal(contacts.scuffAt(32,0),.6);assert.equal(contacts.update([]).length,1);assert.equal(contacts.scuffAt(32,0),0);
});
