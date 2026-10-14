import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetTextureCache, exportPath } from '../src/rendering/AssetTextureCache.ts';

test('a failed atlas falls back to the matching individual pose raster and can recover on a new content revision',async()=>{
 const OriginalImage=globalThis.Image,images=[];globalThis.Image=class {naturalWidth=8;naturalHeight=8;constructor(){images.push(this);}};
 const errors=[],cache=new AssetTextureCache(()=>{},path=>errors.push(path),1024);
 const asset=hash=>({layers:{body:'/north.svg'},logicalCanvas:{width:8,height:8},mapExports:[{path:'/east.png',width:8,height:8,sha256:'pose',atlas:{path:'/atlas.png',sha256:hash,x:0,y:0,width:8,height:8,atlasWidth:8,atlasHeight:8}}]});
 try{
  cache.register(asset('old'));cache.acquire('/east.png');assert.equal(images[0].src,'/atlas.png?mapHash=old');images[0].onerror();await new Promise(setImmediate);
  cache.register(asset('old'));assert.equal(cache.url('/east.png'),'/east.png?mapHash=pose');assert.equal(cache.frame('/east.png'),undefined);
  cache.acquire('/east.png');assert.equal(images[1].src,'/east.png?mapHash=pose');cache.retain(new Set(['/east.png']));images[1].onload();await new Promise(setImmediate);assert.ok(cache.acquire('/east.png'));assert.equal(errors.length,1);
  cache.register(asset('new'));assert.equal(cache.url('/east.png'),'/atlas.png?mapHash=new');
 }finally{cache.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});

test('content revisions load new bytes without destroying another host retaining the old revision',async()=>{
 const OriginalImage=globalThis.Image,images=[];globalThis.Image=class {naturalWidth=8;naturalHeight=8;constructor(){images.push(this);}};
 const a=new AssetTextureCache(()=>{},()=>{},1024),b=new AssetTextureCache(()=>{},()=>{},1024);
 const asset=hash=>({layers:{body:'/same.svg'},logicalCanvas:{width:8,height:8},mapExports:[{path:'/same.png',width:8,height:8,sha256:hash}]});
 try{
  a.register(asset('old'),false);b.register(asset('old'),false);a.acquire('/same.png');b.acquire('/same.png');assert.equal(images.length,1);assert.equal(images[0].src,'/same.png?mapHash=old');
  images[0].onload();await new Promise(setImmediate);
  a.register(asset('new'),false);a.acquire('/same.png');assert.equal(images.length,2);assert.equal(images[1].src,'/same.png?mapHash=new');
  a.retain(new Set(['/same.png']));assert.equal(images[0].src,'/same.png?mapHash=old','other host still owns its old content');
  b.destroy();assert.equal(images[0].src,'');images[1].onload();await new Promise(setImmediate);assert.equal(a.bytes,256);a.destroy();assert.equal(images[1].src,'');
 }finally{a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});

test('authored east-view art cannot silently resolve to a north-view raster',()=>{
 const asset={orientation:'north',mapExports:[{role:'body',lod:'close',orientation:'north',source:'/north.svg',path:'/north.png'},{role:'body',lod:'close',orientation:'east',source:'/east.svg',path:'/east.png'}]};
 assert.equal(exportPath(asset,{role:'body',path:'/east.svg'},'close'),'/east.png');
 assert.equal(exportPath(asset,{role:'body',path:'/missing-west.svg'},'close'),'/missing-west.svg');
});

test('shared pending images survive one owner leaving, failures notify surviving owners and byte admission is bounded',async()=>{
 const OriginalImage=globalThis.Image,images=[];
 globalThis.Image=class {naturalWidth=16;naturalHeight=16;constructor(){images.push(this);}};
 const calls={a:0,b:0,c:[],d:[],budget:[]};
 const a=new AssetTextureCache(()=>calls.a++,path=>calls.c.push(path),1024);
 const b=new AssetTextureCache(()=>calls.b++,path=>calls.d.push(path),1024,path=>calls.budget.push(path));
 const register=(cache,path)=>cache.register({layers:{body:path},logicalCanvas:{width:16,height:16},mapExports:[]});
 try {
  register(a,'/pool.png');register(b,'/pool.png');register(b,'/second.png');
  a.acquire('/pool.png');b.acquire('/pool.png');assert.equal(images.length,1);assert.equal(b.pending,1);
  b.acquire('/second.png');assert.equal(images.length,1,'pending images already reserve their decoded bytes');assert.deepEqual(calls.budget,['/second.png']);assert.deepEqual(calls.d,[],'capacity deferral is not a missing-art error');
  b.acquire('/second.png');assert.deepEqual(calls.budget,['/second.png'],'rejected admission does not schedule an endless error/redraw loop');
  a.destroy();assert.equal(images[0].src,'/pool.png','departing owner does not cancel a shared request');
  images[0].onload();await new Promise(setImmediate);
  assert.equal(calls.a,0,'late completion never invalidates the departed host');assert.equal(calls.b,1);assert.equal(b.pending,0);assert.equal(b.bytes,1024);
  assert.equal(b.acquire('/pool.png'),images[0]);
  assert.equal(b.deferred,1);b.retain(new Set(['/pool.png']));assert.equal(b.deferred,0,'departed viewport deferrals cannot block readiness');
  b.destroy();assert.equal(images[0].src,'');assert.equal(b.bytes,0);assert.equal(b.reservedBytes,0);

  const c=new AssetTextureCache(()=>{},path=>calls.c.push(path),1024),d=new AssetTextureCache(()=>{},path=>calls.d.push(path),1024);
  register(c,'/broken.png');register(d,'/broken.png');c.acquire('/broken.png');d.acquire('/broken.png');c.destroy();
  images[1].onerror();await new Promise(setImmediate);
  assert.equal(calls.c.length,0);assert.ok(calls.d.includes('/broken.png'),'a shared failure reaches the surviving host');
  assert.equal(d.pending,0);assert.equal(d.reservedBytes,0,'failed images release their reserved allocation');d.destroy();assert.equal(d.reservedBytes,0);
  const cancelledErrors=[],cancelled=new AssetTextureCache(()=>{},path=>cancelledErrors.push(path),1024);
  register(cancelled,'/departed-viewport.png');cancelled.acquire('/departed-viewport.png');cancelled.retain(new Set());
  await new Promise(setImmediate);assert.deepEqual(cancelledErrors,[],'cancelled offscreen loads do not become missing-art failures');assert.equal(cancelled.pending,0);cancelled.destroy();
 } finally {a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});

test('a tighter budget retires old ownership and a deferred replacement can retry without poisoning the art path',async()=>{
 const OriginalImage=globalThis.Image,images=[],errors=[],budget=[];globalThis.Image=class {naturalWidth=16;naturalHeight=16;constructor(){images.push(this);}};
 const cache=new AssetTextureCache(()=>{},path=>errors.push(path),2048,path=>budget.push(path));
 const register=path=>cache.register({layers:{body:path},logicalCanvas:{width:16,height:16},mapExports:[]});
 try{
  register('/old-a.png');register('/old-b.png');register('/replacement.png');cache.acquire('/old-a.png');cache.acquire('/old-b.png');
  cache.acquire('/replacement.png');assert.equal(cache.deferred,1);assert.deepEqual(errors,[]);
  cache.limit=1024;assert.ok(cache.reservedBytes<=1024,'pending ownership respects the reduced budget');
  cache.retain(new Set(['/replacement.png']));assert.equal(cache.reservedBytes,0);cache.acquire('/replacement.png');assert.equal(cache.deferred,0);
  images.at(-1).onload();await new Promise(setImmediate);assert.equal(cache.bytes,1024);assert.deepEqual(errors,[]);
 }finally{cache.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});
