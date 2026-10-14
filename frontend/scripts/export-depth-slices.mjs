import sharp from 'sharp';
import {alphaHull} from './map-orientation-export.mjs';
/** Authored vertical joints separate complete wall runs/gate piers, not horizontal roof crops. */
export async function exportDepthSlices(png,entry,cuts){
 if(cuts[0]!==0||cuts.at(-1)!==1||cuts.length!==4||cuts.some((v,i)=>!Number.isFinite(v)||i&&v<=cuts[i-1]))throw new Error('Invalid architectural depth joints');
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true}),edges=cuts.map(v=>Math.round(v*info.width));
 const slices=[];
 for(let i=0;i<edges.length-1;i++){
  const left=edges[i],width=edges[i+1]-left;if(width<1)throw new Error('Empty architectural slice');
  const cropped=await sharp(data,{raw:info}).extract({left,top:0,width,height:info.height}).png({compressionLevel:9}).toBuffer();
  const pixels=await sharp(cropped).ensureAlpha().raw().toBuffer();
  const trim={x:entry.trim.x+left/info.width*entry.trim.width,y:entry.trim.y,width:width/info.width*entry.trim.width,height:entry.trim.height};
  const hull=alphaHull(pixels,width,info.height).map(([x,y])=>[(trim.x+x*trim.width)/entry.logicalCanvas.width,(trim.y+y*trim.height)/entry.logicalCanvas.height]);
  slices.push({id:String(i),png:cropped,width,height:info.height,trim,hull,range:[cuts[i]-.5,cuts[i+1]-.5]});
 }
 // One small per-pose sheet; extrusion is outside each frame, including cut joints.
 const side=entry.lod==='close'?512:256,pad=4,pixels=Buffer.alloc(side*side*4);let cursor=pad;
 for(const slice of slices){
  const raw=await sharp(slice.png).ensureAlpha().raw().toBuffer();
  if(cursor+slice.width+pad>side||slice.height+pad*2>side)throw new Error('Architectural slices exceed atlas');
  for(let y=-pad;y<slice.height+pad;y++)for(let x=-pad;x<slice.width+pad;x++){
   const src=(Math.max(0,Math.min(slice.height-1,y))*slice.width+Math.max(0,Math.min(slice.width-1,x)))*4;
   raw.copy(pixels,((y+pad)*side+cursor+x)*4,src,src+4);
  }
  slice.frame={x:cursor,y:pad,width:slice.width,height:slice.height};cursor+=slice.width+pad*2;
 }
 const atlas=await sharp(pixels,{raw:{width:side,height:side,channels:4}}).png({compressionLevel:9}).toBuffer();
 return {slices,atlas,side};
}
