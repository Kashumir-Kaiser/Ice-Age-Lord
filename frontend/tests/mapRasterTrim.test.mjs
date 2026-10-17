import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {trimMapRaster} from '../scripts/trim-map-raster.mjs';
import {trimmedRect,spriteRect} from '../src/rendering/SpriteRegistration.ts';
import {AssetTextureCache} from '../src/rendering/AssetTextureCache.ts';

test('transparent trimming preserves every visible pixel and its registered world position',async()=>{
 const width=32,height=24,data=Buffer.alloc(width*height*4);
 for(let y=5;y<12;y++)for(let x=11;x<20;x++)data.set([102,83,72,255],(y*width+x)*4);
 data.set([96,125,137,1],(19*width+27)*4); // retain the faintest shadow, too
 const source=await sharp(data,{raw:{width,height,channels:4}}).png().toBuffer(),before=Buffer.from(source);
 const asset={logicalCanvas:{width:480,height:360},groundAnchor:{x:.5,y:.82},trimOffset:{x:0,y:0},artFootprint:[[.2,.7],[.8,.7]],compatiblePhysicalFootprint:{widthM:4,depthM:3}};
 const result=await trimMapRaster(source,asset.logicalCanvas),cropped=await sharp(result.png).ensureAlpha().raw().toBuffer();
 assert.deepEqual(source,before);assert.ok(result.width*result.height<width*height);
 const left=Math.round(result.trim.x/asset.logicalCanvas.width*width),top=Math.round(result.trim.y/asset.logicalCanvas.height*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){
  const original=(y*width+x)*4,offset=((y-top)*result.width+x-left)*4;
  assert.deepEqual(cropped.subarray(offset,offset+4),data.subarray(original,original+4));
  for(const scale of [.001,1,6]){
   const full=spriteRect(asset,{x:-113,y:217},scale),rect=trimmedRect(full,{x:result.trim.x/480,y:result.trim.y/360,width:result.trim.width/480,height:result.trim.height/360});
   assert.ok(Math.abs(full.x+(x+.5)/width*full.width-(rect.x+(x-left+.5)/result.width*rect.width))<1e-8);
   assert.ok(Math.abs(full.y+(y+.5)/height*full.height-(rect.y+(y-top+.5)/result.height*rect.height))<1e-8);
  }
 }
});

test('atlas and individual images use the same logical crop, while source fallback stays registered',()=>{
 const cache=new AssetTextureCache(()=>{},()=>{},1048576);
 const asset={layers:{body:'/body.svg'},logicalCanvas:{width:480,height:400},mapExports:[{path:'/body.png',width:200,height:100,trim:{x:60,y:100,width:240,height:200}}]};
 const rect={x:-40,y:20,width:96,height:80};
 try{for(const atlas of [false,true]){cache.register(asset,atlas);assert.deepEqual(cache.rect('/body.png',rect),{x:-28,y:40,width:48,height:40});assert.equal(cache.rect('/body.svg',rect),rect);}}
 finally{cache.destroy();}
});
