import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readSvg=(repo,source)=>{
 const bytes=readFileSync(resolve(repo,source)),svg=bytes.toString('utf8');
 if(!/^<svg\b/.test(svg)||/<image\b/.test(svg))throw new Error('Map effect source must be authored vector SVG: '+source);
 const box=svg.match(/viewBox="([\d. -]+)"/)?.[1].trim().split(/\s+/).map(Number);
 if(!box||box.length!==4||box[0]!==0||box[1]!==0||!Number.isInteger(box[2])||!Number.isInteger(box[3]))throw new Error('Invalid map effect SVG viewBox: '+source);
 return {bytes,svg,width:box[2],height:box[3]};
};
const rasterize=source=>Buffer.from(new Resvg(source.svg,{fitTo:{mode:'width',value:source.width}}).render().asPng());

/** Pack deterministic, hand-authored vector effect sources into one small shared atlas. */
export async function exportMapEffects(repo){
 const sources={snow:'assets/source/map-effects/snow-particle.svg',ember:'assets/source/map-effects/ember-loop-sheet.svg',smoke:'assets/source/map-effects/smoke-loop-sheet.svg'};
 const input=Object.fromEntries(Object.entries(sources).map(([name,path])=>[name,{...readSvg(repo,path),path}]));
 if(input.snow.width!==64||input.snow.height!==64||input.ember.width!==128||input.ember.height!==32||input.smoke.width!==256||input.smoke.height!==64)throw new Error('Map effect SVG source dimensions changed without updating the atlas registration');
 const atlasWidth=448,atlasHeight=64,cell=64,parts=[];
 const cells={snow:{x:0,y:0,width:64,height:64},ember:[0,1].map(i=>({x:64+i*cell,y:16,width:64,height:32})),smoke:[0,1,2,3].map(i=>({x:192+i*cell,y:0,width:64,height:64}))};
 const raster={snow:rasterize(input.snow),ember:rasterize(input.ember),smoke:rasterize(input.smoke)};
 parts.push({input:await sharp(raster.snow).png().toBuffer(),left:cells.snow.x,top:cells.snow.y});
 for(let i=0;i<cells.ember.length;i++)parts.push({input:await sharp(raster.ember).extract({left:i*64,top:0,width:64,height:32}).png().toBuffer(),left:cells.ember[i].x,top:cells.ember[i].y});
 for(let i=0;i<cells.smoke.length;i++)parts.push({input:await sharp(raster.smoke).extract({left:i*64,top:0,width:64,height:64}).png().toBuffer(),left:cells.smoke[i].x,top:cells.smoke[i].y});
 const png=await sharp({create:{width:atlasWidth,height:atlasHeight,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png({compressionLevel:9}).toBuffer();
 const {data:alpha,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const rect of [cells.snow,...cells.ember,...cells.smoke])for(let i=0;i<Math.max(rect.width,rect.height);i++){
  const points=[[rect.x+i,rect.y],[rect.x+i,rect.y+rect.height-1],[rect.x,rect.y+i],[rect.x+rect.width-1,rect.y+i]];
  for(const [x,y] of points)if(x<rect.x+rect.width&&y<rect.y+rect.height&&alpha[(y*info.width+x)*info.channels+3]!==0)throw new Error('Map effect art touches its transparent frame border');
 }
 const path='/assets/map/effects/ambient-atlas.png';mkdirSync(resolve(repo,'frontend/public/assets/map/effects'),{recursive:true});writeFileSync(resolve(repo,'frontend/public'+path),png);
 const frame=({x,y,width,height})=>({x,y,width,height});
 return {
  path,sha256:hash(png),width:atlasWidth,height:atlasHeight,sourceDependencies:Object.entries(input).map(([,source])=>({source:source.path,sha256:hash(source.bytes)})),
  exportVersion:1,alpha:'straight',colorSpace:'srgb',provenance:'Hand-authored deterministic SVG particle sources; rasterized and packed by frontend/scripts/export-map-effects.mjs.',
  regions:{snow:{frame:frame(cells.snow),anchor:{x:.5,y:.5}},ember:{frames:cells.ember.map(frame),fps:8,anchor:{x:.5,y:.72}},smoke:{frames:cells.smoke.map(frame),fps:6,anchor:{x:.5,y:.82}}},
 };
}

/** Create a large preview from the same authored SVGs and packed frame bounds. */
export async function previewMapEffects(repo,output){
 const manifest=await exportMapEffects(repo),buffer=readFileSync(resolve(repo,'frontend/public'+manifest.path));
 const scale=4,separator=8,frameWidth=64*scale,frameHeight=64*scale;
 const cells=[manifest.regions.snow.frame,...manifest.regions.ember.frames,...manifest.regions.smoke.frames];
 const width=frameWidth*4+separator*3,height=frameHeight*2+separator;
 const scaled=[];
 for(let i=0;i<cells.length;i++){
  const f=cells[i];scaled.push({input:await sharp(buffer).extract({left:f.x,top:f.y,width:f.width,height:f.height}).resize(frameWidth,frameHeight,{kernel:'nearest'}).png().toBuffer(),left:(i%4)*(frameWidth+separator),top:Math.floor(i/4)*(frameHeight+separator)});
 }
 await sharp({create:{width,height,channels:4,background:{r:25,g:39,b:48,alpha:1}}}).composite(scaled).png().toFile(output);
 return {output,width,height,frames:cells.length};
}
