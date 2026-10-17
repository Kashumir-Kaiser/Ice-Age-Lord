import sharp from 'sharp';
import {alphaHull} from './map-orientation-export.mjs';
import {trimMapRaster} from './trim-map-raster.mjs';

/** Partition at the authored stone/timber interface; never cut across the roof. */
export async function splitMapArchitecture(png,entry,boundary){
 const canvas=entry.logicalCanvas,raster=entry.rasterCanvas,trim=entry.trim;
 if(!Array.isArray(boundary)||boundary.length<3||boundary[0][0]!==0||boundary.at(-1)[0]!==canvas.width||boundary.some(([x,y],i)=>!Number.isFinite(x)||!Number.isFinite(y)||y<0||y>canvas.height||(i&&x<=boundary[i-1][0])))throw new Error('Invalid architectural plinth boundary');
 const left=Math.round(trim.x/canvas.width*raster.width),top=Math.round(trim.y/canvas.height*raster.height);
 const original=await sharp({create:{width:raster.width,height:raster.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:png,left,top}]).ensureAlpha().raw().toBuffer();
 const buffers={base:Buffer.alloc(original.length),upper:Buffer.alloc(original.length)};
 let segment=0;
 for(let x=0;x<raster.width;x++){
  const logicalX=(x+.5)/raster.width*canvas.width;
  while(segment<boundary.length-2&&logicalX>boundary[segment+1][0])segment++;
  const [a,b]=[boundary[segment],boundary[segment+1]],height=a[1]+(b[1]-a[1])*(logicalX-a[0])/(b[0]-a[0]);
  for(let y=0;y<raster.height;y++){
   const index=(y*raster.width+x)*4,role=(y+.5)/raster.height*canvas.height>=height?'base':'upper';
   original.copy(buffers[role],index,index,index+4);
  }
 }
 const parts=[];
 for(const [role,data] of Object.entries(buffers)){
  const full=await sharp(data,{raw:{width:raster.width,height:raster.height,channels:4}}).png({compressionLevel:9}).toBuffer();
  const cropped=await trimMapRaster(full,canvas),info=await sharp(cropped.png).metadata();
  parts.push({role,...cropped,width:info.width,height:info.height,hull:alphaHull(data,raster.width,raster.height)});
 }
 return parts;
}
