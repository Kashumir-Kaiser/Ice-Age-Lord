import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetTextureCache } from '../src/rendering/AssetTextureCache.ts';

test('shared pending images survive one owner leaving, failures notify surviving owners and byte admission is bounded',async()=>{
 const OriginalImage=globalThis.Image,images=[];
 globalThis.Image=class {naturalWidth=16;naturalHeight=16;constructor(){images.push(this);}};
 const calls={a:0,b:0,c:[],d:[]};
 const a=new AssetTextureCache(()=>calls.a++,path=>calls.c.push(path),1024);
 const b=new AssetTextureCache(()=>calls.b++,path=>calls.d.push(path),1024);
 const register=(cache,path)=>cache.register({layers:{body:path},logicalCanvas:{width:16,height:16},mapExports:[]});
 try {
  register(a,'/pool.png');register(b,'/pool.png');register(b,'/second.png');
  a.acquire('/pool.png');b.acquire('/pool.png');assert.equal(images.length,1);assert.equal(b.pending,1);
  b.acquire('/second.png');assert.equal(images.length,1,'pending images already reserve their decoded bytes');assert.deepEqual(calls.d,['/second.png']);
  b.acquire('/second.png');assert.deepEqual(calls.d,['/second.png'],'rejected admission does not schedule an endless error/redraw loop');
  a.destroy();assert.equal(images[0].src,'/pool.png','departing owner does not cancel a shared request');
  images[0].onload();await new Promise(setImmediate);
  assert.equal(calls.a,0,'late completion never invalidates the departed host');assert.equal(calls.b,1);assert.equal(b.pending,0);assert.equal(b.bytes,1024);
  assert.equal(b.acquire('/pool.png'),images[0]);
  b.destroy();assert.equal(images[0].src,'');assert.equal(b.bytes,0);assert.equal(b.reservedBytes,0);

  const c=new AssetTextureCache(()=>{},path=>calls.c.push(path),1024),d=new AssetTextureCache(()=>{},path=>calls.d.push(path),1024);
  register(c,'/broken.png');register(d,'/broken.png');c.acquire('/broken.png');d.acquire('/broken.png');c.destroy();
  images[1].onerror();await new Promise(setImmediate);
  assert.equal(calls.c.length,0);assert.ok(calls.d.includes('/broken.png'),'a shared failure reaches the surviving host');
  assert.equal(d.pending,0);assert.equal(d.reservedBytes,0,'failed images release their reserved allocation');d.destroy();assert.equal(d.reservedBytes,0);
 } finally {a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});
