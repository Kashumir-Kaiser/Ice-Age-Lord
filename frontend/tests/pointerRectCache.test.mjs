import test from 'node:test';
import assert from 'node:assert/strict';
import {PointerRectCache,pointerLocalPoint} from '../src/territory/pointerRectCache.ts';

test('captured drag coordinates reuse the pointerdown rect while hover reads the live rect',()=>{
 const cache=new PointerRectCache();let reads=0,live={left:20,top:30};
 const read=()=>{reads++;return live;};
 cache.capture(read());
 assert.deepEqual(pointerLocalPoint({x:150,y:80},cache.resolve(read,true)),{x:130,y:50});
 live={left:70,top:60};
 assert.deepEqual(pointerLocalPoint({x:150,y:80},cache.resolve(read,true)),{x:130,y:50});
 assert.deepEqual(pointerLocalPoint({x:150,y:80},cache.resolve(read,false)),{x:80,y:20});
 assert.deepEqual(pointerLocalPoint({x:151,y:81},cache.resolve(read,false)),{x:81,y:21});
 assert.equal(reads,3,'captured moves do not query layout; each hover move uses the live rect');
});

test('invalidating a captured rect refreshes once and release drops the gesture cache',()=>{
 const cache=new PointerRectCache();let reads=0,live={left:5,top:9};
 const read=()=>{reads++;return live;};
 cache.capture(read());
 live={left:40,top:60};cache.invalidate();
 assert.deepEqual(pointerLocalPoint({x:100,y:120},cache.resolve(read,true)),{x:60,y:60});
 assert.deepEqual(pointerLocalPoint({x:101,y:121},cache.resolve(read,true)),{x:61,y:61});
 cache.release();live={left:50,top:70};
 assert.deepEqual(pointerLocalPoint({x:100,y:120},cache.resolve(read,true)),{x:50,y:50});
 assert.equal(reads,3,'layout invalidation and gesture release refresh on the next captured move');
});
