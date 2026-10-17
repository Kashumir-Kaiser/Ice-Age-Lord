import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {exportMapFlame} from '../scripts/export-map-flame.mjs';
import {flameFrame,flameRect} from '../src/rendering/FlamePresentation.ts';
import {validateMapFlame} from '../scripts/validate-map-assets.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
test('preserved flame sheet exports eight distinct padded frames with a stable foot',async()=>{
 const source=new URL('../../assets/source/map-effects/flame-loop-sheet.png',import.meta.url),original=readFileSync(source);
 const result=await exportMapFlame(original),{data,info}=await sharp(result.png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual(readFileSync(source),original);assert.equal(result.frames.length,8);
 const signatures=new Set();
 for(const f of result.frames){
  let left=f.width,right=-1,bottom=-1,weight=0,xSum=0;
  for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(data[((f.y+y)*info.width+f.x+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  assert.ok(left>=3&&right<f.width-3);assert.equal(bottom,187);
  for(let y=bottom-5;y<=bottom;y++)for(let x=0;x<f.width;x++){const a=data[((f.y+y)*info.width+f.x+x)*4+3];weight+=a;xSum+=a*x;}
  assert.ok(Math.abs(xSum/weight-64)<3,'flame feet remain registered');
  signatures.add((await sharp(result.png).extract({left:f.x,top:f.y,width:f.width,height:f.height}).png().toBuffer()).toString('base64'));
 }
 assert.equal(signatures.size,8);
});
test('flames use art time and remain anchored at every linear scale; reduced motion freezes frame zero',()=>{
 assert.deepEqual(Array.from({length:8},(_,i)=>flameFrame(i/10,8,10,false)),[0,1,2,3,4,5,6,7]);assert.equal(flameFrame(.8,8,10,false),0);assert.equal(flameFrame(200,8,10,true),0);
 const fires=manifest.assets.filter(a=>a.mapFlame);assert.equal(fires.length,7,'all real Fire art stages, including its legacy alias, register the shared sheet');
 for(const asset of fires){
  validateMapFlame(asset.mapFlame);
  for(const scale of [.001,1,6]){
   const body={x:51,y:62,width:480*scale,height:400*scale},rect=flameRect(asset,body),f=asset.mapFlame;
   assert.ok(Math.abs(rect.x+rect.width*f.anchor.x-(body.x+body.width*f.emitter.x))<1e-8);
   assert.ok(Math.abs(rect.y+rect.height*f.anchor.y-(body.y+body.height*f.emitter.y))<1e-8);
  }
  assert.throws(()=>validateMapFlame({...asset.mapFlame,frames:asset.mapFlame.frames.map((f,i)=>i?f:{...f,x:asset.mapFlame.width})}));
  assert.throws(()=>validateMapFlame({...asset.mapFlame,sha256:'bad'}));
 }
 assert.equal(flameRect({},{x:0,y:0,width:1,height:1}),null);
});
