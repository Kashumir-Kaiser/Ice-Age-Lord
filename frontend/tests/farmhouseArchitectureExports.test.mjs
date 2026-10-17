import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';

const root=resolve(new URL('../..',import.meta.url).pathname),manifest=JSON.parse(readFileSync(resolve(root,'frontend/public/assets/manifest.json'),'utf8'));
const asset=manifest.assets.find(a=>a.assetId==='polar-farmhouse-l01');
const read=path=>readFileSync(resolve(root,'frontend/public'+path));
const entry=(role,orientation,lod='close')=>asset.mapExports.find(e=>e.role===role&&e.orientation===orientation&&e.lod===lod&&e.authoredArchitecture);

function assertExactRgba(actual,expected,context,width=384){
 if(actual.equals(expected))return;
 const first=[];let changedPixels=0,maxChannelDelta=0;
 for(let i=0;i<Math.min(actual.length,expected.length);i+=4){
  let pixelChanged=false;
  for(let c=0;c<4;c++){
   const delta=Math.abs(actual[i+c]-expected[i+c]);
   if(delta){pixelChanged=true;maxChannelDelta=Math.max(maxChannelDelta,delta);}
  }
  if(pixelChanged){changedPixels++;if(first.length<10)first.push({x:(i/4)%width,y:Math.floor(i/4/width),actual:[...actual.subarray(i,i+4)],expected:[...expected.subarray(i,i+4)]});}
 }
 assert.fail(`${context}: exact RGBA mismatch; ${changedPixels} pixels changed, max channel delta ${maxChannelDelta}, lengths ${actual.length}/${expected.length}; first ${JSON.stringify(first)}`);
}

async function fullCanvas(exportEntry,path=exportEntry.path){
 const {data,info}=await sharp(read(path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const size=exportEntry.rasterCanvas,trim=exportEntry.trim;
 const x=Math.round(trim.x/asset.logicalCanvas.width*size.width),y=Math.round(trim.y/asset.logicalCanvas.height*size.height);
 assert.ok(x+info.width<=size.width&&y+info.height<=size.height);
 const pixels=Buffer.alloc(size.width*size.height*4);
 for(let row=0;row<info.height;row++)data.copy(pixels,((y+row)*size.width+x)*4,row*info.width*4,(row+1)*info.width*4);
 return {pixels,width:size.width,height:size.height};
}

test('Farmhouse authored uppers preserve every existing whole-body pose and registered trim',async()=>{
 assert.ok(asset);assert.deepEqual(asset.orientationViews&&Object.keys(asset.orientationViews).sort(),['east','north','south','west']);
 for(const orientation of ['north','east','south','west']){
  const upper=entry('upper',orientation),bodyPath=`/assets/map/buildings/polar-farmhouse-l01/body-${orientation==='north'?'':orientation+'-'}close.png`;
  assert.ok(upper,`missing authored upper ${orientation}`);
  assert.equal(asset.orientationViews[orientation].upper,upper.layerPath);
  assert.ok(upper.sourceDependencies.some(d=>d.source===`assets/source/map-buildings/polar-farmhouse-l01-${orientation}.png`)||orientation==='north');
  const [actual,expected]=await Promise.all([fullCanvas(upper),fullCanvas(upper,bodyPath)]);
  assertExactRgba(actual.pixels,expected.pixels,`${orientation} registered upper differs from the original whole-body RGBA`);
 }
});

test('Farmhouse normal layered render is alpha-over of the shared foundation and exact pose',async()=>{
 const base=entry('base','north');
 assert.ok(base);assert.equal(asset.planningLayer,'/assets/map/buildings/polar-farmhouse-l01/foundation.svg');
 assert.ok(!asset.mapExports.some(e=>e.role==='base'&&e.lod==='planning'&&e.authoredArchitecture));
 const source=readFileSync(resolve(root,'assets/source/map-buildings/polar-farmhouse-l01-foundation.png'));
 const sourceMeta=await sharp(source).metadata();
 const resized=await sharp(source).resize(384,320,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Recreate authored registration at scale .8, contact [.5,.80625] -> target [240,328], then the close LOD resize.
 const transformed=await sharp(resized.data,{raw:resized.info}).png().toBuffer();
 const registered=await sharp({create:{width:480,height:400,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:transformed,left:48,top:70}]).png().toBuffer();
 const registeredPixels=await sharp(registered).resize({width:384}).ensureAlpha().raw().toBuffer();
 const exportedBase=await fullCanvas(base);
 assert.equal(sourceMeta.width,1374);assert.equal(sourceMeta.height,1145);assertExactRgba(exportedBase.pixels,registeredPixels,'registered base differs from authored foundation');
 const upper=entry('upper','north'),composite=entry('body','north');
 const [baseFull,upperFull,bodyFull]=await Promise.all([fullCanvas(base),fullCanvas(upper),fullCanvas(composite)]);
 const rendered=await sharp(baseFull.pixels,{raw:{width:384,height:320,channels:4}}).composite([{input:upperFull.pixels,raw:{width:384,height:320,channels:4}}]).ensureAlpha().raw().toBuffer();
 assertExactRgba(bodyFull.pixels,rendered,'layered body differs from alpha-over composition');
});
