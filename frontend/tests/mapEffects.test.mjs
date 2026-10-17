import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {MapEffects,ambientSnowDraws,foliageSwayOffset,mapEffectFrameKey,mapEffectSnowKey,rootAnchoredSwayMatrix,selectSwayingConiferIds,sightIntersectsViewport} from '../src/rendering/MapEffects.ts';
import {AssetTextureCache} from '../src/rendering/AssetTextureCache.ts';
import {validateMapEffectsAtlas} from '../scripts/validate-map-assets.mjs';
import {QUALITY} from '../src/rendering/mapStyle.ts';

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
 const low=first.draws(emitters,atlas,QUALITY.low.particles,false,1),normal=first.draws(emitters,atlas,QUALITY.normal.particles,false,1);
 assert.equal(low.length,0,'low quality disables ember and smoke draws');assert.equal(normal.length,180);
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
 effects.update(.05,false,true,false);assert.equal(effects.time,.1,'the fire presentation clock keeps advancing while low-quality particles are disabled');
 assert.deepEqual(effects.particles,before,'disabled particle simulation leaves particle state untouched');
 const draws=effects.draws(emitter,atlas,60,true,1);
 assert.ok(draws.every(draw=>draw.key.endsWith('-0')),'reduced motion displays only first authored frame');
});

test('ambient snow is deterministic, small, current-sight clipped, and shares the global particle budget',()=>{
 const sight=[{x:100,y:100,radius:80}],identity=(point)=>point,viewport={width:200,height:200};
 assert.equal(ambientSnowDraws([],identity,identity,viewport,8,1,'scene',atlas.path).length,0,'missing current sight disables ambient snow');
 const low=ambientSnowDraws(sight,identity,identity,viewport,QUALITY.low.snowParticles,2,'scene',atlas.path),normal=ambientSnowDraws(sight,identity,identity,viewport,QUALITY.normal.snowParticles,2,'scene',atlas.path);
 assert.equal(low.length,0,'low quality disables ambient snow draws');
 assert.deepEqual(normal,ambientSnowDraws(sight,identity,identity,viewport,QUALITY.normal.snowParticles,2,'scene',atlas.path));
 assert.ok(normal.length>0);
 assert.ok(normal.length<=QUALITY.normal.snowParticles);
 assert.ok(normal.every(draw=>draw.key===mapEffectSnowKey(atlas.path)&&draw.width>=1&&draw.width<=2&&draw.alpha>=.1&&draw.alpha<=.2&&Math.hypot(draw.x-100,draw.y-100)<=80));
 const emitters=Array.from({length:30},(_,i)=>({x:i,y:i}));
 const fire=new MapEffects(180).draws(emitters,atlas,QUALITY.normal.particles-normal.length,false,1),lowFire=new MapEffects(60).draws(emitters,atlas,QUALITY.low.particles-low.length,false,1);
 assert.ok(fire.length+normal.length<=QUALITY.normal.particles,'ambient and emitter particles share the normal-quality cap');
 assert.equal(lowFire.length+low.length,0,'low quality disables ambient and emitter particle output');
});

test('current-sight scheduling uses exact viewport geometry and does not treat absent sight as visible',()=>{
 const viewport=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}],identity=(point)=>point;
 assert.equal(sightIntersectsViewport([],viewport,identity),false);
 assert.equal(sightIntersectsViewport([{x:150,y:50,radius:49}],viewport,identity),false,'circle misses the viewport by one pixel');
 assert.equal(sightIntersectsViewport([{x:150,y:50,radius:50}],viewport,identity),true,'tangent circle reaches the viewport');
 assert.equal(sightIntersectsViewport([{x:50,y:50,radius:1}],viewport,identity),true,'enclosed circle intersects');
});

test('tree sway selection is stable, conifer-only and quality-capped; matrix keeps the root fixed',()=>{
 const props=Array.from({length:200},(_,i)=>({id:`tree-${i}`,kind:i%5===0?'bare':'conifer'}));
 const low=selectSwayingConiferIds(props,'low'),normal=selectSwayingConiferIds(props,'normal');
 assert.equal(low.size,0,'low quality disables foliage sway');assert.ok(normal.size>0&&normal.size<=QUALITY.normal.swayingConifers);
 assert.deepEqual([...normal],[...selectSwayingConiferIds([...props].reverse(),'normal')]);
 assert.ok([...normal].every(id=>props.find(prop=>prop.id===id)?.kind==='conifer'));
 assert.equal(foliageSwayOffset('tree-1',4,false),0,'reduced motion and fallback hold the pose');
 assert.ok(Math.abs(foliageSwayOffset('tree-1',4,true))<=1.5);
 const matrix=rootAnchoredSwayMatrix(20,30,40,80,400,800,1.5);assert.ok(matrix);
 const [a,b,c,d,tx,ty]=matrix;
 const root={x:a*200+c*(800*.94)+tx,y:b*200+d*(800*.94)+ty};
 const top={x:a*200+tx,y:b*200+ty};
 assert.ok(Math.abs(root.x-(20+20))<1e-9,'registered 94% root x remains fixed');
 assert.ok(Math.abs(root.y-(30+80*.94))<1e-9,'registered root y remains fixed');
 assert.ok(Math.abs((top.x-(20+20))-1.5)<1e-9,'top shear remains a CSS-pixel offset');
 assert.equal(rootAnchoredSwayMatrix(20,30,40,80,400,800,0),null);
});
