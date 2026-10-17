undefined

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
