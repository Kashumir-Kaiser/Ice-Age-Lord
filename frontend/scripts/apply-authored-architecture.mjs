import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';
import {trimMapRaster} from './trim-map-raster.mjs';
import {alphaHull} from './map-orientation-export.mjs';
import {registeredCompositeVectorFallback} from './map-vector-fallback.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const transparent=(width,height)=>sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}});

/**
 * Return the source rectangle that fits the logical canvas. Overflow is safe only
 * when every cropped pixel is transparent; visible authored pixels are never cut.
 */
export function transparentOverflowCrop(data,width,height,canvas,left,top){
 const x0=Math.max(0,-left),y0=Math.max(0,-top),x1=Math.min(width,canvas.width-left),y1=Math.min(height,canvas.height-top);
 if(x1<=x0||y1<=y0)throw new Error('Authored layer exceeds the logical canvas');
 let visible=false;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){
  visible=true;
  if(x<x0||x>=x1||y<y0||y>=y1)throw new Error('Authored layer exceeds the logical canvas');
 }
 if(!visible)throw new Error('Empty map raster');
 return {left:x0,top:y0,width:x1-x0,height:y1-y0};
}

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
   const {data,info}=await sharp(original).resize(width,height,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const normalized=normalizeMapAlpha(data,width,height).data;
   const input=await sharp(normalized,{raw:info}).png().toBuffer();
   if(left>=0&&top>=0&&left+width<=canvas.width&&top+height<=canvas.height){
    // Keep the established contained path byte-identical.
    full[role]=await transparent(canvas.width,canvas.height).composite([{input,left,top}]).png().toBuffer();
   }else{
    const crop=transparentOverflowCrop(normalized,width,height,canvas,left,top);
    const clipped=await sharp(input).extract(crop).png().toBuffer();
    full[role]=await transparent(canvas.width,canvas.height).composite([{input:clipped,left:left+crop.left,top:top+crop.top}]).png().toBuffer();
   }
   dependencies.push({source:spec.source,sha256:hash(original)});
  }
  const bodyLayer=`${prefix}body-layered-${orientation}-close.png`;
  asset.orientationViews??={};asset.orientationViews[orientation]={...asset.layers,...asset.mapLayers,body:bodyLayer};
  asset.composition='architectural';
  // Preserve static whole-body provenance and the smoke-free SVG last-resort fallback.
  asset.mapExports=asset.mapExports.filter(e=>!e.authoredArchitecture);
  let vectorFallbackSource;
  if(definition.vectorFallback){
   if(asset.assetId!=='tomb-entry')throw new Error('Vector architecture fallback is currently restricted to Tomb');
   const registered=await transparent(canvas.width,canvas.height).composite([{input:full.base},{input:full.upper}]).png().toBuffer();
   const path=`${prefix}body-layered-${orientation}.svg`,svg=await registeredCompositeVectorFallback(registered,canvas.width,canvas.height);
   writeFileSync(resolve(repo,'frontend/public'+path),svg);
   asset.mapLayers={...asset.mapLayers,body:path};
   vectorFallbackSource={source:path,sourceSha256:hash(Buffer.from(svg)),sourceDependencies:[...dependencies,{source:'frontend/scripts/map-vector-fallback.mjs',sha256:hash(readFileSync(resolve(repo,'frontend/scripts/map-vector-fallback.mjs')))}]};
  }
  for(const [lod,width] of [['close',384],['district',192]]){
   const buffers={};
   for(const role of ['base','upper'])buffers[role]=await sharp(full[role]).resize({width}).png({compressionLevel:9}).toBuffer();
   const height=Math.round(width*canvas.height/canvas.width);
   buffers.body=await transparent(width,height).composite([{input:buffers.base},{input:buffers.upper}]).png({compressionLevel:9}).toBuffer();
   for(const role of ['base','upper','body']){
    const name=role==='body'?'body-layered':role,layerPath=role==='body'?bodyLayer:`${prefix}${role}-${orientation}-close.png`,path=`${prefix}${name}-${orientation}-${lod}.png`;
    const cropped=await trimMapRaster(buffers[role],canvas);writeFileSync(resolve(repo,'frontend/public'+path),cropped.png);
    const source=role==='body'&&vectorFallbackSource?vectorFallbackSource.source:role==='body'?'frontend/scripts/apply-authored-architecture.mjs':definition[role].source;
    const sourceSha256=role==='body'&&vectorFallbackSource?vectorFallbackSource.sourceSha256:hash(readFileSync(resolve(repo,source)));
    asset.mapExports.push({path,layerPath,source,sourceSha256,sourceDependencies:role==='body'&&vectorFallbackSource?vectorFallbackSource.sourceDependencies:dependencies,sha256:hash(cropped.png),exportVersion:4,authoredArchitecture:true,...(role==='body'?{}:{architecturePart:true}),width:cropped.width,height:cropped.height,role,lod,orientation,alpha:'straight',colorSpace:'srgb',logicalCanvas:canvas,rasterCanvas:cropped.rasterCanvas,trim:cropped.trim});count++;
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
