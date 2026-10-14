import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import {svgMapSource} from './svg-map-source.mjs';
import {periodicMaterial} from './periodic-material.mjs';
const repo=resolve(new URL('../..',import.meta.url).pathname),manifestPath=resolve(repo,'assets/manifest.json');
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const sha=(buffer)=>createHash('sha256').update(buffer).digest('hex');
const output=resolve(repo,'frontend/public/assets/map');mkdirSync(output,{recursive:true});
// Resolve the named external SVG element with its definitions and dependency hashes.
let count=0;
for(const asset of manifest.assets){
 asset.composition??='single-body';asset.mapExports=[];
 const destination=resolve(output,'buildings',asset.assetId);mkdirSync(destination,{recursive:true});
 for(const role of ['body','shadow',...(asset.planningLayer?['base']:[]),...(asset.layers.vfx?['vfx']:[])]){
  const source=role==='base'?asset.planningLayer:asset.layers[role],file=resolve(repo,'frontend/public'+source),graph=svgMapSource(file),svg=graph.svg;
  for(const [lod,size] of [['close',384],['district',192]]){
   const result=new Resvg(svg,{fitTo:{mode:'width',value:size},font:{loadSystemFonts:false}}).render();
   const png=await sharp(result.asPng()).png({compressionLevel:9,palette:false}).toBuffer();
   const path=`/assets/map/buildings/${asset.assetId}/${role}-${lod}.png`;writeFileSync(resolve(repo,'frontend/public'+path),png);
   const meta=await sharp(png).metadata();
   const sourceDependencies=Array.from(graph.dependencies,([path,sha256])=>({source:path.slice(repo.length+1),sha256}));
   asset.mapExports.push({path,source,sourceSha256:sha(readFileSync(file)),sourceDependencies,sha256:sha(png),exportVersion:1,width:meta.width,height:meta.height,role,lod,orientation:asset.orientation,alpha:'straight',colorSpace:'srgb',logicalCanvas:asset.logicalCanvas,trim:{x:0,y:0,width:asset.logicalCanvas.width,height:asset.logicalCanvas.height}});count++;
  }
 }
}
// Stable per-asset/LOD atlases: 4 px extrusion, same logical registration.
for (const asset of manifest.assets) for (const lod of ['close','district']) {
 const entries=asset.mapExports.filter(e=>e.lod===lod);
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
const terrainNames=['snow-quiet','snow-02','snow-03','snow-04','dirty-snow-01','dirty-snow-02','earth-01','earth-02','ice-01','ice-02'];
const propNames=[...Array.from({length:6},(_,i)=>'conifer-'+String(i+1).padStart(2,'0')),...Array.from({length:3},(_,i)=>'bare-'+String(i+1).padStart(2,'0')),...Array.from({length:8},(_,i)=>'rock-'+String(i+1).padStart(2,'0')),...Array.from({length:8},(_,i)=>'bank-'+String(i+1).padStart(2,'0')),...Array.from({length:4},(_,i)=>'ledge-'+String(i+1).padStart(2,'0')),...Array.from({length:4},(_,i)=>'forest-'+String(i+1).padStart(2,'0'))];
mkdirSync(resolve(output,'terrain'),{recursive:true});
for(const name of [...terrainNames,...propNames]){
 const source=`assets/source/terrain/${name}.png`,file=resolve(repo,source);if(!existsSync(file))continue;
 const material=terrainNames.includes(name),path=`/assets/map/terrain/${name}.${material?'webp':'png'}`;
 let pipeline=(material?sharp(file):sharp(file).trim({threshold:8})).resize({width:material?256:384,height:material?256:384,fit:material?'fill':'inside'});
 let buffer;
 if(material){const {data,info}=await pipeline.removeAlpha().raw().toBuffer({resolveWithObject:true});buffer=await sharp(periodicMaterial(data,info.width,info.height,info.channels),{raw:info}).webp({lossless:true,effort:6}).toBuffer();}
 else buffer=await pipeline.png({compressionLevel:9}).toBuffer();
 writeFileSync(resolve(repo,'frontend/public'+path),buffer);const meta=await sharp(buffer).metadata();
 manifest.environmentArt.push({assetId:name,source,path,sourceSha256:sha(readFileSync(file)),sha256:sha(buffer),width:meta.width,height:meta.height,exportVersion:1,projection:material?'ground':'dimetric',alpha:material?'opaque':'straight',colorSpace:'srgb',provenance:'Original OpenAI ImageGen environmental art, 2026-10-13; matched to existing project source references.',license:'Original generated art created for this project.',status:'draft'});
}
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${count} registered map layers and ${manifest.environmentArt.length} environment assets. No UI SVG replaced.`);
