import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {calibrateMapGround} from '../scripts/calibrate-map-ground.mjs';
import {validateMapExport} from '../scripts/validate-map-assets.mjs';
import {mapGroundShadow} from '../scripts/map-ground-shadow.mjs';
import {Resvg} from '@resvg/resvg-js';
test('ground calibration keeps upright axes, fixes 2:1 contact and reuses logical registration across LOD',async()=>{
 const width=160,height=140,data=Buffer.alloc(width*height*4),asset={groundAnchor:{x:.5,y:.6},artFootprint:[[.1,.7],[.9,.7]]};
 for(let x=25;x<=135;x++)for(let y=Math.round(80+.25*(x-80))-24;y<=Math.round(80+.25*(x-80));y++){const i=(y*width+x)*4;data[i]=x;data[i+1]=130;data[i+2]=90;data[i+3]=255;}
 const original=await sharp(data,{raw:{width,height,channels:4}}).png().toBuffer(),before=Buffer.from(original);
 const high=await calibrateMapGround(original,asset,'north'),lowSource=await sharp(original).resize({width:80}).png().toBuffer(),low=await calibrateMapGround(lowSource,asset,'north',high.registration);
 assert.deepEqual(original,before);assert.deepEqual(low.registration,high.registration);assert.equal(high.registration.targetSlope,.5);
 assert.ok(Math.abs(high.registration.sourceSlope+high.registration.shear-.5)<1e-8);
 const raw=await sharp(high.png).ensureAlpha().raw().toBuffer();
 for(const x of [50,80,110]){let bottom=-1;for(let y=height-1;y>=0;y--)if(raw[(y*width+x)*4+3]>=128){bottom=y;break;}assert.ok(Math.abs(bottom-(height*.6+.5*(x-width*.5)))<2);}
 for(const y of [70,80])assert.ok(Math.abs(raw[(y*width+80)*4]-80)<2,'vertical material stays in the same X column');
});
test('every wall/gate pose shares calibrated close/district contact and retains master hashes',()=>{
 const m=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
 for(const id of ['opening-palisade-wall','opening-timber-gate']){
  const a=m.assets.find(a=>a.assetId===id);
  for(const orientation of ['north','east','south','west']){
   const close=a.mapExports.find(e=>e.role==='body'&&!e.sliceId&&e.orientation===orientation&&e.lod==='close'),district=a.mapExports.find(e=>e.role==='body'&&!e.sliceId&&e.orientation===orientation&&e.lod==='district');
   assert.ok(close.groundCalibration);assert.deepEqual(district.groundCalibration,close.groundCalibration);validateMapExport(close,a);validateMapExport(district,a);
   assert.throws(()=>validateMapExport({...close,groundCalibration:{...close.groundCalibration,targetSlope:0}},a));
  }
 }
});
test('footprint shadow kernels stay centered on the registered anchor and change axis with orientation',async()=>{
 const m=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
 for(const id of ['opening-palisade-wall','opening-timber-gate'])for(const orientation of ['north','east','south','west']){
  const a=m.assets.find(a=>a.assetId===id),png=new Resvg(mapGroundShadow(a,orientation),{fitTo:{mode:'width',value:384}}).render().asPng();
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});let weight=0,sx=0,sy=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const alpha=data[(y*info.width+x)*4+3];weight+=alpha;sx+=x*alpha;sy+=y*alpha;}
  const cx=sx/weight,cy=sy/weight;assert.ok(Math.abs(cx-info.width*a.groundAnchor.x)<3);assert.ok(Math.abs(cy-info.height*a.groundAnchor.y)<3);
  let covariance=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)covariance+=(x-cx)*(y-cy)*data[(y*info.width+x)*4+3];
  assert.equal(covariance>0,orientation==='north'||orientation==='south');
 }
});
test('registered wall/gate map shadows resolve by pose and cannot claim a different footprint',()=>{
 const m=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
 for(const id of ['opening-palisade-wall','opening-timber-gate'])for(const orientation of ['north','east','south','west']){
  const a=m.assets.find(a=>a.assetId===id),shadow=a.orientationViews?.[orientation]?.shadow;assert.ok(shadow);
  for(const lod of ['close','district']){
   const e=a.mapExports.find(e=>e.role==='shadow'&&e.orientation===orientation&&e.lod===lod&&e.layerPath===shadow);assert.ok(e?.groundShadow);validateMapExport(e,a);
   assert.throws(()=>validateMapExport({...e,groundShadow:{...e.groundShadow,widthM:999}},a));
  }
 }
});
