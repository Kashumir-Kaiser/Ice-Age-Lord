import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetTextureCache, exportPath } from '../src/rendering/AssetTextureCache.ts';
import {flameKey} from '../src/rendering/FlamePresentation.ts';

test('all flame frames share one bounded image and survive another host leaving',async()=>{
 const OriginalImage=globalThis.Image,images=[];globalThis.Image=class {naturalWidth=512;naturalHeight=384;constructor(){images.push(this);}};
 const a=new AssetTextureCache(()=>{},()=>{},1048576),b=new AssetTextureCache(()=>{},()=>{},1048576),path='/test-flame-sheet.png';
 const asset={layers:{},logicalCanvas:{width:480,height:400},mapFlame:{path,sha256:'same',width:512,height:384,frames:Array.from({length:8},(_,i)=>({x:i%4*128,y:Math.floor(i/4)*192,width:128,height:192}))}};
 try{
  a.register(asset);b.register(asset);for(let i=0;i<8;i++)a.acquire(flameKey(path,i));b.acquire(flameKey(path,0));assert.equal(images.length,1);assert.equal(a.reservedBytes,512*384*4);
  images[0].onload();await new Promise(setImmediate);a.retain(new Set([flameKey(path,7)]));assert.ok(a.acquire(flameKey(path,7)));b.destroy();assert.ok(a.acquire(flameKey(path,0)));a.destroy();assert.equal(images[0].src,'');
 }finally{a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});

test('filtered SVG cache entries retain one alpha canvas and release it with their byte reservation',async()=>{
 const OriginalImage=globalThis.Image,OriginalDocument=globalThis.document,images=[],canvases=[];
 globalThis.Image=class {naturalWidth=8;naturalHeight=4;onload=null;onerror=null;decoding='';_src='';constructor(){images.push(this);}set src(value){this._src=value;}get src(){return this._src;}};
 globalThis.document={createElement(name){assert.equal(name,'canvas');const canvas={width:0,height:0,drawn:null,getContext(type,options){assert.equal(type,'2d');assert.deepEqual(options,{alpha:true});return {drawImage(image,x,y){canvas.drawn={image,x,y};}};}};canvases.push(canvas);return canvas;}};
 const errors=[],cache=new AssetTextureCache(()=>{},path=>errors.push(path),1024);
 try{
  cache.registerEnvironment([{path:'/shadow.svg',sha256:'filtered-svg',width:8,height:4}]);
  assert.equal(cache.acquire('/shadow.svg'),null);assert.equal(images.length,1);assert.equal(images[0].src,'/shadow.svg?mapHash=filtered-svg');
  images[0].onload();await new Promise(setImmediate);
  const image=cache.acquire('/shadow.svg'),canvas=canvases[0];
  assert.equal(image,canvas);assert.equal(canvas.width,8);assert.equal(canvas.height,4);assert.deepEqual(canvas.drawn,{image:images[0],x:0,y:0});
  assert.equal(images[0].src,'');assert.equal(images[0].onload,null);assert.equal(images[0].onerror,null);
  assert.equal(cache.bytes,8*4*4);assert.equal(cache.reservedBytes,8*4*4);assert.deepEqual(errors,[]);
  cache.retain(new Set());assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.equal(cache.bytes,0);assert.equal(cache.reservedBytes,0);
 }finally{cache.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;if(OriginalDocument===undefined)delete globalThis.document;else globalThis.document=OriginalDocument;}
});

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

test('environment revisions reserve actual decoded dimensions and share only identical content versions',async()=>{
 const OriginalImage=globalThis.Image,images=[];globalThis.Image=class {naturalWidth=8;naturalHeight=4;constructor(){images.push(this);}};
 const a=new AssetTextureCache(()=>{},()=>{},1024),b=new AssetTextureCache(()=>{},()=>{},1024);
 try{
  const environment=hash=>[{path:'/terrain.png',sha256:hash,width:8,height:4}];
  a.registerEnvironment(environment('old'));b.registerEnvironment(environment('old'));
  a.acquire('/terrain.png');b.acquire('/terrain.png');assert.equal(images.length,1);assert.equal(a.reservedBytes,128);assert.equal(images[0].src,'/terrain.png?mapHash=old');
  images[0].onload();await new Promise(setImmediate);
  a.registerEnvironment(environment('new'));a.acquire('/terrain.png');assert.equal(images.length,2);assert.equal(images[1].src,'/terrain.png?mapHash=new');
  a.retain(new Set(['/terrain.png']));assert.equal(images[0].src,'/terrain.png?mapHash=old');b.destroy();assert.equal(images[0].src,'');
  images[1].onload();await new Promise(setImmediate);assert.equal(a.bytes,128);
 }finally{a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});


test('stalled shared image retries once, cancels the first request, and settles fail-closed',async()=>{
 const OriginalImage=globalThis.Image,OriginalSetTimeout=globalThis.setTimeout,OriginalClearTimeout=globalThis.clearTimeout;
 const images=[],timers=[],errors=[];
 globalThis.Image=class {naturalWidth=16;naturalHeight=16;onload=null;onerror=null;decoding='';_src='';constructor(){images.push(this);}set src(value){this._src=value;}get src(){return this._src;}};
 globalThis.setTimeout=(callback,delay)=>{const timer={callback,delay,cleared:false};timers.push(timer);return timer;};
 globalThis.clearTimeout=timer=>{if(timer)timer.cleared=true;};
 const a=new AssetTextureCache(()=>{},path=>errors.push(path),2048),b=new AssetTextureCache(()=>{},()=>{},2048);
 try{
  a.register({layers:{body:'/stalled.png'},logicalCanvas:{width:16,height:16},mapExports:[]});
  b.register({layers:{body:'/stalled.png'},logicalCanvas:{width:16,height:16},mapExports:[]});
  a.acquire('/stalled.png');b.acquire('/stalled.png');
  assert.equal(images.length,1,'shared owners start one request');assert.equal(timers.length,1);assert.equal(timers[0].delay,15000);
  timers[0].callback();
  assert.equal(images.length,2,'first timeout starts exactly one retry');
  assert.equal(images[0].src,'','timeout cancels the hung Image request');
  assert.equal(images[0].onload,null);assert.equal(images[0].onerror,null);
  assert.equal(timers[0].cleared,true);assert.equal(timers.length,2);
  images[1].onload();await new Promise(setImmediate);
  assert.equal(a.pending,0);assert.equal(b.pending,0);assert.deepEqual(errors,[]);
  assert.equal(a.acquire('/stalled.png'),images[1]);
  timers[1].callback();
  await new Promise(setImmediate);
  assert.equal(a.pending,0,'a stale timeout cannot undo successful completion');
  assert.deepEqual(errors,[]);
  a.destroy();b.destroy();

  const failed=[],cache=new AssetTextureCache(()=>{},path=>failed.push(path),1024);
  cache.register({layers:{body:'/twice-stalled.png'},logicalCanvas:{width:16,height:16},mapExports:[]});
  cache.acquire('/twice-stalled.png');assert.equal(images.length,3);
  timers[2].callback();assert.equal(images.length,4);
  timers[3].callback();await new Promise(setImmediate);
  assert.equal(cache.pending,0);assert.equal(cache.reservedBytes,0);
  assert.deepEqual(failed,['/twice-stalled.png'],'two hung attempts become a real cache error');
  cache.destroy();
 }finally{
  a.destroy();b.destroy();
  globalThis.Image=OriginalImage;globalThis.setTimeout=OriginalSetTimeout;globalThis.clearTimeout=OriginalClearTimeout;
 }
});


test('pending readiness diagnostics expose attempt age and an overdue watchdog',async()=>{
 const OriginalImage=globalThis.Image,OriginalSetTimeout=globalThis.setTimeout,OriginalClearTimeout=globalThis.clearTimeout,OriginalNow=Date.now;
 const images=[],timers=[];let now=1000;
 globalThis.Image=class {naturalWidth=16;naturalHeight=16;complete=false;onload=null;onerror=null;decoding='';_src='';constructor(){images.push(this);}set src(value){this._src=value;}get src(){return this._src;}};
 globalThis.setTimeout=(callback,delay)=>{const timer={callback,delay,cleared:false};timers.push(timer);return timer;};
 globalThis.clearTimeout=timer=>{if(timer)timer.cleared=true;};
 Date.now=()=>now;
 const cache=new AssetTextureCache(()=>{},()=>{},1024);
 try{
  cache.registerEnvironment([{path:'/diagnostic.png',sha256:'diagnostic',width:16,height:16}]);
  cache.acquire('/diagnostic.png');
  assert.deepEqual(cache.readinessDiagnostics[0],{id:'/diagnostic.png?mapHash=diagnostic',state:'loading',refs:1,reservedBytes:1024,browserComplete:false,naturalWidth:16,naturalHeight:16,attempt:1,elapsedMs:0,attemptAgeMs:0,watchdogArmed:true,watchdogRemainingMs:15000});
  now+=60000;
  const overdue=cache.readinessDiagnostics[0];
  assert.equal(overdue.elapsedMs,60000);assert.equal(overdue.attempt,1);assert.equal(overdue.watchdogArmed,true);assert.equal(overdue.watchdogRemainingMs,-45000,'negative time exposes a watchdog callback that has not run');assert.equal(overdue.attemptAgeMs,60000);
  timers[0].callback();
  const retried=cache.readinessDiagnostics[0];
  assert.equal(images.length,2);assert.equal(retried.attempt,2);assert.equal(retried.elapsedMs,60000);assert.equal(retried.attemptAgeMs,0);assert.equal(retried.watchdogArmed,true);assert.equal(retried.watchdogRemainingMs,15000);
  images[1].onload();await new Promise(setImmediate);
  assert.deepEqual(cache.readinessDiagnostics,[]);
 }finally{
  cache.destroy();globalThis.Image=OriginalImage;globalThis.setTimeout=OriginalSetTimeout;globalThis.clearTimeout=OriginalClearTimeout;Date.now=OriginalNow;
 }
});
