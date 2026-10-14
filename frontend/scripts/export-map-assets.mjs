import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import {svgMapSource} from './svg-map-source.mjs';
import {periodicMaterial} from './periodic-material.mjs';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';
import {LEDGE_SOURCES} from '../src/rendering/mapStyle.ts';
import {orientationCanvas,alphaHull} from './map-orientation-export.mjs';
import {trimMapRaster} from './trim-map-raster.mjs';
import {exportMapFlame} from './export-map-flame.mjs';
import {exportDepthSlices} from './export-depth-slices.mjs';
import {calibrateMapGround} from './calibrate-map-ground.mjs';
import {mapGroundShadow} from './map-ground-shadow.mjs';
const repo=resolve(new URL('../..',import.meta.url).pathname),manifestPath=resolve(repo,'assets/manifest.json');
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const authoredViews=JSON.parse(readFileSync(resolve(repo,'assets/map-building-views.json'),'utf8'));
const depthJoints=JSON.parse(readFileSync(resolve(repo,'assets/map-depth-slices.json'),'utf8'));
// This tower's authored SVG groups separate the complete footing from the shaft/roof.
// Other legacy base/upper files contain arbitrary horizontal clips and remain unaccepted.
const architecturalAssets=new Set(['fixture-tall-tower']);
const sha=(buffer)=>createHash('sha256').update(buffer).digest('hex');
const output=resolve(repo,'frontend/public/assets/map');mkdirSync(output,{recursive:true});
// Resolve the named external SVG element with its definitions and dependency hashes.
let count=0;
for(const asset of manifest.assets){
 const defaultOrientation=authoredViews._defaultOrientations?.[asset.assetId];
 if(defaultOrientation){
  if(!['north','east','south','west'].includes(defaultOrientation))throw new Error('Invalid default map orientation');
  asset.orientation=defaultOrientation;
 }
 const equivalents=authoredViews._equivalentOrientations?.[asset.assetId];
 if(equivalents){
  if(!Array.isArray(equivalents)||equivalents.some(o=>!['north','east','south','west'].includes(o)))throw new Error('Invalid equivalent map orientations');
  asset.equivalentOrientations=equivalents;
 }
 asset.composition=architecturalAssets.has(asset.assetId)?'architectural':'single-body';asset.mapExports=[];
 delete asset.mapDepthSlices;
 for(const orientation of asset.generatedOrientationViews??[]){delete asset.orientationViews?.[orientation];delete asset.orientationRegions?.[orientation];}
 asset.generatedOrientationViews=Object.keys(authoredViews[asset.assetId]??{});
 let bodyReference,defaultCalibration;
 const destination=resolve(output,'buildings',asset.assetId);mkdirSync(destination,{recursive:true});
 for(const role of ['body','shadow',...(asset.composition==='architectural'?['base','upper']:asset.planningLayer?['base']:[]),...(asset.layers.vfx?['vfx']:[])]){
  const source=role==='base'&&asset.composition!=='architectural'?asset.planningLayer:asset.layers[role],file=resolve(repo,'frontend/public'+source),graph=svgMapSource(file),shadow=role==='shadow'&&depthJoints[asset.assetId],svg=shadow?mapGroundShadow(asset,asset.orientation):graph.svg;
  for(const [lod,size] of [['close',384],['district',192]]){
   const result=new Resvg(svg,{fitTo:{mode:'width',value:size},font:{loadSystemFonts:false}}).render();
   let full=await sharp(result.asPng()).png({compressionLevel:9,palette:false}).toBuffer();
   if(role==='body'&&lod==='close')bodyReference=full;
   if(role==='upper'&&lod==='close'){
    const {data,info}=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    asset.occlusionRegion.upper=alphaHull(data,info.width,info.height);
   }
   if(role==='body'&&depthJoints[asset.assetId]){
    const calibrated=await calibrateMapGround(full,asset,asset.orientation,defaultCalibration);full=calibrated.png;defaultCalibration=calibrated.registration;
    if(lod==='close'){asset.orientationRegions??={};asset.orientationRegions[asset.orientation]={hitPolygon:calibrated.hitPolygon,upper:calibrated.hitPolygon};}
   }
   const cropped=await trimMapRaster(full,asset.logicalCanvas),png=cropped.png;
   const path=`/assets/map/buildings/${asset.assetId}/${role}-${lod}.png`;writeFileSync(resolve(repo,'frontend/public'+path),png);
   const meta=await sharp(png).metadata();
   const sourceDependencies=Array.from(graph.dependencies,([path,sha256])=>({source:path.slice(repo.length+1),sha256}));
   if(shadow)sourceDependencies.push({source:'frontend/scripts/map-ground-shadow.mjs',sha256:sha(readFileSync(resolve(repo,'frontend/scripts/map-ground-shadow.mjs')))});
   if(role==='body'&&defaultCalibration)sourceDependencies.push({source:'frontend/scripts/calibrate-map-ground.mjs',sha256:sha(readFileSync(resolve(repo,'frontend/scripts/calibrate-map-ground.mjs')))});
   const shadowLayer=`/assets/map/buildings/${asset.assetId}/shadow-close.png`;
   if(shadow&&lod==='close'){asset.orientationViews??={};asset.orientationViews[asset.orientation]={...asset.layers,shadow:shadowLayer};}
   const primarySource=shadow?'frontend/scripts/map-ground-shadow.mjs':source,primaryFile=shadow?resolve(repo,primarySource):file;
   asset.mapExports.push({path,source:primarySource,sourceSha256:sha(readFileSync(primaryFile)),sourceDependencies,sha256:sha(png),exportVersion:shadow||role==='body'&&defaultCalibration?4:3,...(shadow?{layerPath:shadowLayer,groundShadow:{...asset.compatiblePhysicalFootprint,orientation:asset.orientation}}:{}),...(role==='body'&&defaultCalibration?{groundCalibration:defaultCalibration}:{}),width:meta.width,height:meta.height,role,lod,orientation:asset.orientation,alpha:'straight',colorSpace:'srgb',logicalCanvas:asset.logicalCanvas,rasterCanvas:cropped.rasterCanvas,trim:cropped.trim});count++;
  }
 }
 for(const [orientation,source] of Object.entries(authoredViews[asset.assetId]??{})){
  if(!['north','east','south','west'].includes(orientation)||!/^assets\/source\/map-buildings\/[^/]+\.png$/.test(source))throw new Error('Invalid authored orientation source');
  const file=resolve(repo,source);if(!existsSync(file))throw new Error('Missing authored orientation master: '+source);
  const painted=await orientationCanvas(file,bodyReference,asset);
  const layerPath=`/assets/map/buildings/${asset.assetId}/body-${orientation}-close.png`;
  asset.orientationViews??={};asset.orientationViews[orientation]={...asset.layers,body:layerPath};
  if(depthJoints[asset.assetId]){
   const layerPath=`/assets/map/buildings/${asset.assetId}/shadow-${orientation}-close.png`;
   asset.orientationViews[orientation].shadow=layerPath;
   for(const [lod,size] of [['close',384],['district',192]]){
    const result=new Resvg(mapGroundShadow(asset,orientation),{fitTo:{mode:'width',value:size},font:{loadSystemFonts:false}}).render(),cropped=await trimMapRaster(result.asPng(),asset.logicalCanvas),png=cropped.png,meta=await sharp(png).metadata();
    const path=`/assets/map/buildings/${asset.assetId}/shadow-${orientation}-${lod}.png`;writeFileSync(resolve(repo,'frontend/public'+path),png);
    const helper='frontend/scripts/map-ground-shadow.mjs',helperHash=sha(readFileSync(resolve(repo,helper)));
    asset.mapExports.push({path,layerPath,source:helper,sourceSha256:helperHash,sourceDependencies:[{source:helper,sha256:helperHash}],sha256:sha(png),exportVersion:4,width:meta.width,height:meta.height,role:'shadow',lod,orientation,groundShadow:{...asset.compatiblePhysicalFootprint,orientation},alpha:'straight',colorSpace:'srgb',logicalCanvas:asset.logicalCanvas,rasterCanvas:cropped.rasterCanvas,trim:cropped.trim});count++;
   }
  }
  asset.orientationRegions??={};asset.orientationRegions[orientation]={hitPolygon:painted.hitPolygon,upper:painted.hitPolygon};
  let viewCalibration;
  for(const [lod,size] of [['close',384],['district',192]]){
   let full=await sharp(painted.data,{raw:{width:painted.width,height:painted.height,channels:4}}).resize({width:size}).png({compressionLevel:9}).toBuffer();
   if(depthJoints[asset.assetId]){
    const calibrated=await calibrateMapGround(full,asset,orientation,viewCalibration);full=calibrated.png;viewCalibration=calibrated.registration;
    if(lod==='close')asset.orientationRegions[orientation]={hitPolygon:calibrated.hitPolygon,upper:calibrated.hitPolygon};
   }
   const cropped=await trimMapRaster(full,asset.logicalCanvas),png=cropped.png,meta=await sharp(png).metadata();
   const path=`/assets/map/buildings/${asset.assetId}/body-${orientation}-${lod}.png`;writeFileSync(resolve(repo,'frontend/public'+path),png);
   asset.mapExports.push({path,layerPath,source,sourceSha256:sha(readFileSync(file)),sourceDependencies:[{source,sha256:sha(readFileSync(file))},...(viewCalibration?[{source:'frontend/scripts/calibrate-map-ground.mjs',sha256:sha(readFileSync(resolve(repo,'frontend/scripts/calibrate-map-ground.mjs')))}]:[])],sha256:sha(png),exportVersion:viewCalibration?4:3,...(viewCalibration?{groundCalibration:viewCalibration}:{}),width:meta.width,height:meta.height,role:'body',lod,orientation,alpha:'straight',colorSpace:'srgb',logicalCanvas:asset.logicalCanvas,rasterCanvas:cropped.rasterCanvas,trim:cropped.trim});count++;
  }
 }
}
// Stable per-asset/LOD atlases: 4 px extrusion, same logical registration.
for (const asset of manifest.assets) for (const lod of ['close','district']) {
 const entries=asset.mapExports.filter(e=>e.lod===lod&&!(e.groundShadow&&e.orientation!==asset.orientation));
 const side=lod==='close'?1024:512,pad=4,cell=lod==='close'?392:200,cellY=lod==='close'?328:168;
 const pixels=Buffer.alloc(side*side*4);
 for (let i=0;i<entries.length;i++) {
  const e=entries[i],x=(i%2)*cell+pad,y=Math.floor(i/2)*cellY+pad;
  const {data,info}=await sharp(resolve(repo,'frontend/public'+e.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let gy=-pad;gy<info.height+pad;gy++)for(let gx=-pad;gx<info.width+pad;gx++){
   const sx=Math.max(0,Math.min(info.width-1,gx)),sy=Math.max(0,Math.min(info.height-1,gy));
   const src=(sy*info.width+sx)*4,dest=((y+gy)*side+x+gx)*4;data.copy(pixels,dest,src,src+4);
  }
  e.atlas={path:`/assets/map/buildings/${asset.assetId}/atlas-${lod}.png`,x,y,width:info.width,height:info.height,atlasWidth:side,atlasHeight:side};
 }
 const png=await sharp(pixels,{raw:{width:side,height:side,channels:4}}).png({compressionLevel:9}).toBuffer();
 const atlasPath=entries[0].atlas.path;writeFileSync(resolve(repo,'frontend/public'+atlasPath),png);
 for(const e of entries)e.atlas.sha256=sha(png);
}
manifest.environmentArt=[];
for(const asset of manifest.assets)for(const [orientation,cuts] of Object.entries(depthJoints[asset.assetId]??{})){
 asset.mapDepthSlices??={};asset.mapDepthSlices[orientation]=[];
 for(const lod of ['close','district']){
  const body=asset.mapExports.find(e=>e.role==='body'&&e.orientation===orientation&&e.lod===lod);
  if(!body)throw new Error('Missing body for authored depth slices: '+asset.assetId+':'+orientation);
  const result=await exportDepthSlices(readFileSync(resolve(repo,'frontend/public'+body.path)),body,cuts);
  const atlasPath=`/assets/map/buildings/${asset.assetId}/depth-${orientation}-${lod}.png`,atlasHash=sha(result.atlas);
  writeFileSync(resolve(repo,'frontend/public'+atlasPath),result.atlas);
  for(const part of result.slices){
   const path=`/assets/map/buildings/${asset.assetId}/slice-${orientation}-${part.id}-${lod}.png`;writeFileSync(resolve(repo,'frontend/public'+path),part.png);
   asset.mapExports.push({...body,path,sliceId:part.id,sourceDependencies:[...(body.sourceDependencies??[]),{source:'assets/map-depth-slices.json',sha256:sha(readFileSync(resolve(repo,'assets/map-depth-slices.json')))}],width:part.width,height:part.height,trim:part.trim,sha256:sha(part.png),atlas:{path:atlasPath,...part.frame,atlasWidth:result.side,atlasHeight:result.side,sha256:atlasHash}});
   if(lod==='close')asset.mapDepthSlices[orientation].push({id:part.id,range:part.range,hull:part.hull,paths:{close:path,district:''}});
   else asset.mapDepthSlices[orientation].find(p=>p.id===part.id).paths.district=path;
  }
 }
}
const terrainNames=['snow-quiet','snow-02','snow-03','snow-04','dirty-snow-01','dirty-snow-02','earth-01','earth-02','ice-01','ice-02'];
const propNames=[...Array.from({length:6},(_,i)=>'conifer-'+String(i+1).padStart(2,'0')),...Array.from({length:3},(_,i)=>'bare-'+String(i+1).padStart(2,'0')),...Array.from({length:8},(_,i)=>'rock-'+String(i+1).padStart(2,'0')),...Array.from({length:8},(_,i)=>'bank-'+String(i+1).padStart(2,'0')),...Array.from({length:4},(_,i)=>'ledge-'+String(i+1).padStart(2,'0')),...Array.from({length:4},(_,i)=>'forest-'+String(i+1).padStart(2,'0')),...Array.from({length:2},(_,i)=>'ridge-'+String(i+1).padStart(2,'0'))];
mkdirSync(resolve(output,'terrain'),{recursive:true});
for(const name of [...terrainNames,...propNames]){
 const reusedLedges=Object.fromEntries(LEDGE_SOURCES.map((source,i)=>['ledge-'+String(i+1).padStart(2,'0'),source]));
 const sourceName=reusedLedges[name]??name,source=`assets/source/terrain/${sourceName}.png`,file=resolve(repo,source);if(!existsSync(file))continue;
 const material=terrainNames.includes(name),path=`/assets/map/terrain/${sourceName}.${material?'webp':'png'}`;
 let pipeline=(material?sharp(file):sharp(file).trim({threshold:8})).resize({width:material?256:384,height:material?256:384,fit:material?'fill':'inside'});
 let buffer;
 if(material){const {data,info}=await pipeline.removeAlpha().raw().toBuffer({resolveWithObject:true});buffer=await sharp(periodicMaterial(data,info.width,info.height,info.channels),{raw:info}).webp({lossless:true,effort:6}).toBuffer();}
 else {const {data,info}=await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true}),normalized=normalizeMapAlpha(data,info.width,info.height);buffer=await sharp(normalized.data,{raw:info}).png({compressionLevel:9}).toBuffer();}
 writeFileSync(resolve(repo,'frontend/public'+path),buffer);const meta=await sharp(buffer).metadata();
 manifest.environmentArt.push({assetId:name,source,...(sourceName!==name?{reusedFrom:sourceName}:{}),path,sourceSha256:sha(readFileSync(file)),sha256:sha(buffer),width:meta.width,height:meta.height,exportVersion:2,projection:material?'ground':name.startsWith('forest-')||name.startsWith('ridge-')?'north-up':'dimetric',alpha:material?'opaque':'straight',colorSpace:'srgb',provenance:'Original OpenAI ImageGen environmental art, 2026-10-13/14; matched to existing project source references. '+(sourceName!==name?'Suitable relief module reused from '+sourceName+'.':''),license:'Original generated art created for this project.',status:'draft'});
}
const flameSource='assets/source/map-effects/flame-loop-sheet.png',flameFile=resolve(repo,flameSource);
const flame=await exportMapFlame(flameFile),flamePath='/assets/map/effects/flame-loop.png';
mkdirSync(resolve(output,'effects'),{recursive:true});writeFileSync(resolve(repo,'frontend/public'+flamePath),flame.png);
for(const asset of manifest.assets){
 delete asset.mapFlame;
 if(!['campfire-start','survival-fire-l01','survival-fire-l06','survival-fire-l11','survival-fire-l16','survival-fire-l21','survival-fire-l26'].includes(asset.assetId))continue;
 const svg=readFileSync(resolve(repo,'frontend/public'+asset.layers.vfx),'utf8');
 const ellipse=svg.match(/<ellipse\b[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*rx="([\d.]+)"/);
 if(!ellipse)throw new Error('Missing registered Fire emitter: '+asset.assetId);
 asset.mapFlame={path:flamePath,source:flameSource,sourceSha256:sha(readFileSync(flameFile)),sha256:sha(flame.png),width:flame.width,height:flame.height,frames:flame.frames,fps:flame.fps,anchor:flame.anchor,emitter:{x:Number(ellipse[1])/asset.logicalCanvas.width,y:Number(ellipse[2])/asset.logicalCanvas.height},relativeWidth:asset.assetId==='campfire-start'||asset.assetId==='survival-fire-l01'?.12:.16};
}
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${count} registered map layers and ${manifest.environmentArt.length} environment assets. No UI SVG replaced.`);
