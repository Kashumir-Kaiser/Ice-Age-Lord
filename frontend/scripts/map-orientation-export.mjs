import sharp from 'sharp';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';

export function alphaBounds(data,width,height){
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=8){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 if(maxX<minX)throw new Error('Empty orientation artwork');
 return {x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
}
export function alphaHull(data,width,height){
 const points=[];
 for(let y=0;y<height;y++){let first=-1,last=-1;for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=32){if(first<0)first=x;last=x;}if(first>=0){points.push([first,y],[last,y]);}}
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const lower=[],upper=[];for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of points.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}lower.pop();upper.pop();return [...lower,...upper].map(([x,y])=>[x/width,y/height]);
}
/** Fit the authored view into the existing logical registration, never into screen pixels. */
export async function orientationCanvas(source,reference,asset){
 const canonical=await sharp(reference).ensureAlpha().raw().toBuffer({resolveWithObject:true}),bounds=alphaBounds(canonical.data,canonical.info.width,canonical.info.height);
 const canvas=asset.logicalCanvas,anchor=asset.groundAnchor;
 const targetWidth=Math.round(bounds.width/canonical.info.width*canvas.width),targetHeight=Math.round(bounds.height/canonical.info.height*canvas.height);
 const anchorX=(anchor.x*canonical.info.width-bounds.x)/bounds.width,anchorY=(anchor.y*canonical.info.height-bounds.y)/bounds.height;
 const input=await sharp(source).trim({threshold:8}).resize({width:targetWidth,height:targetHeight,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const cleaned=normalizeMapAlpha(input.data,input.info.width,input.info.height).data;
 const left=Math.round(anchor.x*canvas.width-input.info.width*anchorX),top=Math.round(anchor.y*canvas.height-input.info.height*anchorY);
 if(left<0||top<0||left+input.info.width>canvas.width||top+input.info.height>canvas.height)throw new Error('Orientation exceeds registered logical canvas');
 const painted=await sharp({create:{width:canvas.width,height:canvas.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cleaned,raw:{width:input.info.width,height:input.info.height,channels:4},left,top}]).raw().toBuffer();
 return {data:painted,width:canvas.width,height:canvas.height,hitPolygon:alphaHull(painted,canvas.width,canvas.height)};
}
