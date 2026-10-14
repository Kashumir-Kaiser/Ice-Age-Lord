import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {alphaBounds,alphaHull} from './map-orientation-export.mjs';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';
import {mapGroundShadow} from './map-ground-shadow.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const document=content=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400">${content}</svg>\n`;
/** Editable color runs, using the same path-only approach as the preserved building tracer. */
export function colorPaths(data,width,height){
 const colors=new Map();
 for(let y=0;y<height;y++)for(let x=0;x<width;){
  const i=(y*width+x)*4,key=[...data.subarray(i,i+4)].join(',');let end=x+1;
  while(end<width&&[...data.subarray((y*width+end)*4,(y*width+end)*4+4)].join(',')===key)end++;
  if(data[i+3]){const list=colors.get(key)??[];list.push(`M${x},${y}h${end-x}v1h${x-end}z`);colors.set(key,list);}x=end;
 }
 return [...colors].map(([key,runs])=>{const[r,g,b,a]=key.split(',').map(Number);return `<path fill="#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}" fill-opacity="${a/255}" d="${runs.join('')}"/>`;}).join('\n');
}
/** New art previews reuse the existing calibration footprint; no gameplay definition is added. */
export async function prepareTowerPreviews(manifest,repo){
 const definitions=JSON.parse(readFileSync(resolve(repo,'assets/map-tower-previews.json'))),dependencies=new Map();
 const template=manifest.assets.find(a=>a.assetId==='fixture-tall-tower');if(!template)throw new Error('Missing calibration footprint');
 for(const definition of definitions){
  if(!/^assets\/source\/map-buildings\/[a-z-]+\.png$/.test(definition.source)||![definition.contact.x,definition.contact.y,definition.footprintSpan].every(v=>Number.isFinite(v)&&v>0&&v<1))throw new Error('Invalid tower preview registration');
  const original=readFileSync(resolve(repo,definition.source)),decoded=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const normalized=normalizeMapAlpha(decoded.data,decoded.info.width,decoded.info.height).data,bounds=alphaBounds(normalized,decoded.info.width,decoded.info.height);
  const resized=await sharp(normalized,{raw:decoded.info}).extract({left:bounds.x,top:bounds.y,width:bounds.width,height:bounds.height}).resize({height:350,width:380,fit:'inside'}).toBuffer({resolveWithObject:true});
  const left=Math.round(240-resized.info.width*definition.contact.x),top=Math.round(328-resized.info.height*definition.contact.y);
  if(left<0||top<0||left+resized.info.width>480||top+resized.info.height>400)throw new Error('Tower exceeds registered canvas');
  const full=await sharp({create:{width:480,height:400,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:resized.data,raw:{width:resized.info.width,height:resized.info.height,channels:4},left,top}]).png({palette:true,colours:144,dither:0}).toBuffer();
  const pixels=await sharp(full).ensureAlpha().raw().toBuffer(),body=document(`<g shape-rendering="crispEdges">${colorPaths(pixels,480,400)}</g>`);
  const iconPNG=await sharp(full).resize({width:96,height:80}).png({palette:true,colours:24,dither:0}).toBuffer(),iconPixels=await sharp(iconPNG).ensureAlpha().raw().toBuffer();
  const icon=document(`<g transform="scale(5)" shape-rendering="crispEdges">${colorPaths(iconPixels,96,80)}</g>`);
  const asset=structuredClone(template);asset.assetId=definition.assetId;asset.definitionId='FIXTURE-'+definition.assetId.toUpperCase();asset.variant='authored-preview';asset.status='draft';asset.source=definition.source;asset.referenceSource=definition.source;asset.logicalCanvas={width:480,height:400};asset.revision=1;asset.trimOffset={x:0,y:0};asset.groundAnchor={x:.5,y:.82};delete asset.presentationScale;
  const half=definition.footprintSpan/2,minor=half/9;
  asset.artFootprint=[[.5-half,.82-minor/2],[.5+minor,.82-half/2],[.5+half,.82+minor/2],[.5-minor,.82+half/2]];
  asset.hitPolygon=alphaHull(pixels,480,400);asset.occlusionRegion={upper:asset.hitPolygon};asset.visualBounds={minX:left/480,minY:top/400,maxX:(left+resized.info.width)/480,maxY:(top+resized.info.height)/400};
  asset.compatiblePhysicalFootprint={...template.compatiblePhysicalFootprint,provenance:'frontend-fixture',assumptionId:'TOWER-ART-PREVIEW-V1'};
  delete asset.orientationViews;delete asset.orientationRegions;delete asset.equivalentOrientations;delete asset.mapDepthSlices;delete asset.mapFlame;asset.generatedOrientationViews=[];
  const prefix=`/assets/map/buildings/${asset.assetId}`,directory=resolve(repo,'frontend/public'+prefix);mkdirSync(directory,{recursive:true});
  const points=asset.artFootprint.map(([x,y])=>`${x*480},${y*400}`).join(' '),foundation=document(`<polygon points="${points}" fill="#607d89" fill-opacity=".35" stroke="#a9bdc0" stroke-width="2"/>`);
  for(const [name,svg]of Object.entries({body,upper:body,base:foundation,shadow:mapGroundShadow(asset,'north'),icon,foundation}))writeFileSync(resolve(directory,name+'.svg'),svg);
  asset.layers={body:prefix+'/body.svg',upper:prefix+'/upper.svg',base:prefix+'/base.svg',shadow:prefix+'/shadow.svg',uiIcon:prefix+'/icon.svg',vfx:null};asset.planningLayer=prefix+'/foundation.svg';asset.planningFoundation=true;
  asset.lodVariants={close:{...asset.layers},district:{...asset.layers},regional:{uiIcon:asset.layers.uiIcon}};
  asset.drawDepthAnchor={...asset.groundAnchor};asset.provenance='Original OpenAI ImageGen tower art, 2026-10-15; unchanged PNG master with path-only editable SVG derivative. Preview registration remains draft.';asset.license='Original generated artwork created for this project.';
  const index=manifest.assets.findIndex(a=>a.assetId===asset.assetId);if(index<0)manifest.assets.push(asset);else manifest.assets[index]=asset;
  dependencies.set(asset.assetId,[definition.source,'assets/map-tower-previews.json','frontend/scripts/map-tower-previews.mjs'].map(source=>({source,sha256:hash(readFileSync(resolve(repo,source)))})));
 }
 return dependencies;
}
