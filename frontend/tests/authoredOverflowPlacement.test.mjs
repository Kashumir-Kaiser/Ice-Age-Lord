import test from 'node:test';
import assert from 'node:assert/strict';
import {transparentOverflowCrop} from '../scripts/apply-authored-architecture.mjs';

const canvas={width:4,height:3};
function pixels(width,height,visible=[]){
 const data=Buffer.alloc(width*height*4);
 for(const [x,y,alpha=255] of visible)data[(y*width+x)*4+3]=alpha;
 return data;
}

test('authored overflow crops only transparent rows or columns on every canvas edge',()=>{
 const cases=[
  {name:'left',width:4,height:3,left:-1,top:0,crop:{left:1,top:0,width:3,height:3},visible:[[1,1]]},
  {name:'right',width:4,height:3,left:1,top:0,crop:{left:0,top:0,width:3,height:3},visible:[[2,1]]},
  {name:'top',width:4,height:4,left:0,top:-1,crop:{left:0,top:1,width:4,height:3},visible:[[1,1]]},
  {name:'bottom',width:4,height:4,left:0,top:0,crop:{left:0,top:0,width:4,height:3},visible:[[1,1]]}
 ];
 for(const c of cases){
  const data=pixels(c.width,c.height,c.visible);
  assert.deepEqual(transparentOverflowCrop(data,c.width,c.height,canvas,c.left,c.top),c.crop,c.name);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3])
   assert.ok(x>=c.crop.left&&x<c.crop.left+c.crop.width&&y>=c.crop.top&&y<c.crop.top+c.crop.height,`${c.name} visible pixel retained`);
 }
});

test('authored overflow rejects any nontransparent pixel outside the canvas, including alpha 1',()=>{
 const cases=[
  {w:4,h:3,l:-1,t:0,p:[0,1,1]},
  {w:4,h:3,l:1,t:0,p:[3,1,1]},
  {w:4,h:4,l:0,t:-1,p:[1,0,1]},
  {w:4,h:4,l:0,t:0,p:[1,3,1]}
 ];
 for(const c of cases)assert.throws(()=>transparentOverflowCrop(pixels(c.w,c.h,[c.p]),c.w,c.h,canvas,c.l,c.t),/exceeds the logical canvas/);
});

test('authored overflow rejects an empty intersection and preserves the empty-raster rule',()=>{
 assert.throws(()=>transparentOverflowCrop(pixels(2,2,[[0,0]]),2,2,canvas,-3,0),/exceeds the logical canvas/);
 assert.throws(()=>transparentOverflowCrop(pixels(4,4),4,4,canvas,0,-1),/Empty map raster/);
});
