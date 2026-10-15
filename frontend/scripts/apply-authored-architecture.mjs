import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';
import {trimMapRaster} from './trim-map-raster.mjs';
import {alphaHull} from './map-orientation-export.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const transparent=(width,height)=>sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}});

/** Register genuinely authored layers; no guessed horizontal cuts of flattened props. */
export async function applyAuthoredArchitecture(manifest,definitions,repo){
 let count=0;
 for(const asset of manifest.assets){
  const definition=definitions[asset.assetId];if(!definition)continue;
  const orientation=definition.orientation,canvas=asset.logicalCanvas,prefix=`/assets/map/buildings/${asset.assetId}/`;
  if(orientation!==asset.orientation)throw new Error('Authored architecture must identify its actual native pose');
  const helpers=['assets/map-authored-architecture.json','frontend/scripts/apply-authored-architecture.mjs','frontend/scripts/normalize-map-alpha.mjs','frontend/scripts/trim-map-raster.mjs','frontend/scripts/map-orientation-export.mjs'];
  const dependencies=helpers.map(source=>({source,sha256:hash(readFileSync(resolve(repo,source)))}));
  const full={};
  for(const role of ['base','upper']){
   const spec=definition[role];
   if(!spec||!/^assets\/source\/map-buildings\/[^/]+\.png$/.test(spec.source)||!Number.isFinite(spec.scale)||spec.scale<=0||spec.scale>1||spec.contact?.length!==2||spec.contact.some(v=>!Number.isFinite(v)||v<0||v>1)||spec.target?.length!==2||!spec.target.every(Number.isFinite))throw new Error('Invalid authored architectural registration');
   const original=readFileSync(resolve(repo,spec.source)),width=Math.round(canvas.width*spec.scale),height=Math.round(canvas.height*spec.scale);
   const left=Math.round(spec.target[0]-spec.contact[0]*width),top=Math.round(spec.target[1]-spec.contact[1]*height);
   if(left<0||top<0||left+width>canvas.width||top+height>canvas.height)throw new Error('Authored layer exceeds the logical canvas');
   const {data,info}=await sharp(original).resize(width,height,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const input=await sharp(normalizeMapAlpha(data,width,height).data,{raw:info}).png().toBuffer();
   full[role]=await transparent(canvas.width,canvas.height).composite([{input,left,top}]).png().toBuffer();
   dependencies.push({source:spec.source,sha256:hash(original)});
  }
  const bodyLayer=`${prefix}body-layered-${orientation}-close.png`;
  asset.orientationViews??={};asset.orientationViews[orientation]={...asset.layers,...asset.mapLayers,body:bodyLayer};
  asset.composition='architectural';
  // Preserve static whole-body provenance and the smoke-free SVG last-resort fallback.
  asset.mapExports=asset.mapExports.filter(e=>!e.authoredArchitecture);
  for(const [lod,width] of [['close',384],['district',192]]){
   const buffers={};
   for(const role of ['base','upper'])buffers[role]=await sharp(full[role]).resize({width}).png({compressionLevel:9}).toBuffer();
   const height=Math.round(width*canvas.height/canvas.width);
   buffers.body=await transparent(width,height).composite([{input:buffers.base},{input:buffers.upper}]).png({compressionLevel:9}).toBuffer();
   for(const role of ['base','upper','body']){
    const name=role==='body'?'body-layered':role,layerPath=role==='body'?bodyLayer:`${prefix}${role}-${orientation}-close.png`,path=`${prefix}${name}-${orientation}-${lod}.png`;
    const cropped=await trimMapRaster(buffers[role],canvas);writeFileSync(resolve(repo,'frontend/public'+path),cropped.png);
    const source=role==='body'?'frontend/scripts/apply-authored-architecture.mjs':definition[role].source;
    asset.mapExports.push({path,layerPath,source,sourceSha256:hash(readFileSync(resolve(repo,source))),sourceDependencies:dependencies,sha256:hash(cropped.png),exportVersion:4,authoredArchitecture:true,...(role==='body'?{}:{architecturePart:true}),width:cropped.width,height:cropped.height,role,lod,orientation,alpha:'straight',colorSpace:'srgb',logicalCanvas:canvas,rasterCanvas:cropped.rasterCanvas,trim:cropped.trim});count++;
    if(lod==='close'){
     asset.orientationViews[orientation][role]=layerPath;
     const {data,info}=await sharp(buffers[role]).ensureAlpha().raw().toBuffer({resolveWithObject:true}),hull=alphaHull(data,info.width,info.height);
     if(role==='body'){asset.orientationRegions??={};asset.orientationRegions[orientation]={...(asset.orientationRegions[orientation]??{}),hitPolygon:hull};}
     if(role==='upper'){asset.orientationRegions??={};asset.orientationRegions[orientation]={...(asset.orientationRegions[orientation]??{}),upper:hull};}
    }
   }
  }
  // Keep first-run and repeated exports byte-identical when these fields are first introduced.
  const mapLayers=asset.mapLayers;delete asset.mapLayers;if(mapLayers)asset.mapLayers=mapLayers;
 }
 return count;
}
