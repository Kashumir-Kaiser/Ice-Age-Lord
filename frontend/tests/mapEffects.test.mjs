import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {MapEffects,mapEffectFrameKey,mapEffectSnowKey} from '../src/rendering/MapEffects.ts';
import {AssetTextureCache} from '../src/rendering/AssetTextureCache.ts';
import {validateMapEffectsAtlas} from '../scripts/validate-map-assets.mjs';

const root=new URL('../../',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('assets/manifest.json',root),'utf8'));
const atlas=manifest.mapEffects;

test('map effects atlas has versioned source hashes, disjoint frames and transparent gutters',async()=>{
 assert.ok(atlas,'map effects atlas is registered');
 assert.equal(validateMapEffectsAtlas(atlas),undefined);
 assert.equal(atlas.exportVersion,1);
 assert.equal(atlas.sourceDependencies.length,3);
 assert.deepEqual(atlas.regions.snow.frame,{x:0,y:0,width:64,height:64});
 assert.deepEqual(atlas.regions.ember.frames,[{x:64,y:16,width:64,height:32},{x:128,y:16,width:64,height:32}]);
 assert.deepEqual(atlas.regions.smoke.frames,[0,1,2,3].map(i=>({x:192+i*64,y:0,width:64,height:64})));
 assert.equal(atlas.regions.ember.fps,8);assert.equal(atlas.regions.smoke.fps,6);
 const bytes=readFileSync(new URL('frontend/public'+atlas.path,root));
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual([info.width,info.height],[atlas.width,atlas.height]);
 const frames=[atlas.regions.snow.frame,...atlas.regions.ember.frames,...atlas.regions.smoke.frames];
 for(const frame of frames){
  for(let x=frame.x;x<frame.x+frame.width;x++){
   assert.equal(data[(frame.y*info.width+x)*info.channels+3],0,'top border remains transparent');
   assert.equal(data[((frame.y+frame.height-1)*info.width+x)*info.channels+3],0,'bottom border remains transparent');
  }
  for(let y=frame.y;y<frame.y+frame.height;y++){
   assert.equal(data[(y*info.width+frame.x)*info.channels+3],0,'left border remains transparent');
   assert.equal(data[(y*info.width+frame.x+frame.width-1)*info.channels+3],0,'right border remains transparent');
  }
 }
 assert.throws(()=>validateMapEffectsAtlas(atlas,path=>{
  if(path===atlas.sourceDependencies[0].source)return Buffer.from('edited source');
  return readFileSync(new URL(path.startsWith('frontend/public/')?path:'frontend/public'+path,root));
 }),/source hash mismatch/);
});

test('effect cache registers all atlas regions as views of one versioned image',async()=>{
 const OriginalImage=globalThis.Image,images=[];
 globalThis.Image=class {naturalWidth=448;naturalHeight=64;constructor(){images.push(this);}};
 const a=new AssetTextureCache(()=>{},()=>{},1048576),b=new AssetTextureCache(()=>{},()=>{},1048576);
 try{
  a.registerMapEffects(atlas);b.registerMapEffects(atlas);
  const keys=[mapEffectSnowKey(atlas.path),...atlas.regions.ember.frames.map((_,i)=>mapEffectFrameKey(atlas.path,'ember',i)),...atlas.regions.smoke.frames.map((_,i)=>mapEffectFrameKey(atlas.path,'smoke',i))];
  for(const key of keys){assert.equal(a.frame(key).width>0,true);assert.equal(a.acquire(key),null);}
  assert.equal(images.length,1,'subregions share a single immutable atlas request');
  assert.equal(images[0].src,atlas.path+'?mapHash='+atlas.sha256);
  assert.equal(a.reservedBytes,atlas.width*atlas.height*4);
  images[0].onload();await new Promise(setImmediate);
  assert.equal(a.acquire(keys.at(-1)),images[0]);
  b.acquire(keys[0]);b.destroy();assert.equal(images[0].src,atlas.path+'?mapHash='+atlas.sha256,'one cache owner cannot cancel another');
  a.destroy();assert.equal(images[0].src,'');
 }finally{a.destroy();b.destroy();if(OriginalImage===undefined)delete globalThis.Image;else globalThis.Image=OriginalImage;}
});

test('particle draws are deterministic and globally capped across all confirmed emitters',()=>{
 const first=new MapEffects(180),second=new MapEffects(180),emitters=Array.from({length:30},(_,i)=>({x:i*9,y:-i*3}));
 const low=first.draws(emitters,atlas,60,false,1),normal=first.draws(emitters,atlas,180,false,1);
 assert.equal(low.length,60);assert.equal(normal.length,180);
 assert.deepEqual(normal,second.draws(emitters,atlas,180,false,1));
 assert.ok(normal.every(draw=>draw.width>=2&&draw.width<=14&&draw.alpha<=.8));
 assert.equal(first.draws([],atlas,180,false,1).length,0,'no confirmed active emitters means no particle work');
});

test('inactive and reduced-motion effects freeze their visual clock and select static frame zero',()=>{
 const effects=new MapEffects(180),emitter=[{x:40,y:50}];
 effects.update(.05,false,false);assert.equal(effects.time,0);
 effects.update(.05,true,true);assert.equal(effects.time,0);
 effects.update(.05,false,true);assert.equal(effects.time,.05);
 const before=effects.particles.map(p=>({...p}));effects.update(.05,true,true);
 assert.deepEqual(effects.particles,before,'reduced motion freezes particle positions and life');
 const draws=effects.draws(emitter,atlas,60,true,1);
 assert.ok(draws.every(draw=>draw.key.endsWith('-0')),'reduced motion displays only first authored frame');
});
