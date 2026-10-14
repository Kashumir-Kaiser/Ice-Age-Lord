import sharp from 'sharp';
import {normalizeMapAlpha} from './normalize-map-alpha.mjs';

/** Derive registered frames from the preserved 4×2 master; never modify source bytes. */
export async function exportMapFlame(source){
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const cells=[];
 for(let frame=0;frame<8;frame++){
  const column=frame%4,row=Math.floor(frame/4),cellX=Math.round(column*info.width/4),cellY=Math.round(row*info.height/2);
  const cellWidth=Math.round((column+1)*info.width/4)-cellX,cellHeight=Math.round((row+1)*info.height/2)-cellY;
  const cell=await sharp(data,{raw:info}).extract({left:cellX,top:cellY,width:cellWidth,height:cellHeight}).raw().toBuffer();
  const normalized=normalizeMapAlpha(cell,cellWidth,cellHeight).data;
  let left=cellWidth,top=cellHeight,right=-1,bottom=-1;
  for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++)if(normalized[(y*cellWidth+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left||left===0||right===cellWidth-1||top===0||bottom===cellHeight-1)throw new Error('Flame frame is empty or touches its source cell');
  // The flame foot is the bottom six rows, rather than its shifting upper silhouette.
  let weight=0,foot=0;
  for(let y=Math.max(top,bottom-5);y<=bottom;y++)for(let x=left;x<=right;x++){const a=normalized[(y*cellWidth+x)*4+3];weight+=a;foot+=x*a;}
  cells.push({data:normalized,cellWidth,cellHeight,left,top,right,bottom,foot:foot/weight});
 }
 const width=128,height=192,pad=4;
 const extent=Math.max(...cells.map(c=>Math.max(c.foot-c.left,c.right-c.foot)+1));
 const scale=Math.min((width/2-pad)/extent,(height-pad*2)/Math.max(...cells.map(c=>c.bottom-c.top+1)));
 const frames=[],parts=[];
 for(let frame=0;frame<8;frame++){
  const c=cells[frame],w=c.right-c.left+1,h=c.bottom-c.top+1;
  const outWidth=Math.max(1,Math.round(w*scale)),outHeight=Math.max(1,Math.round(h*scale));
  const painted=await sharp(c.data,{raw:{width:c.cellWidth,height:c.cellHeight,channels:4}}).extract({left:c.left,top:c.top,width:w,height:h}).resize(outWidth,outHeight).png().toBuffer();
  const x=frame%4*width,y=Math.floor(frame/4)*height;
  parts.push({input:painted,left:x+Math.round(width/2-(c.foot-c.left)*outWidth/w),top:y+height-pad-outHeight});
  frames.push({x,y,width,height});
 }
 const png=await sharp({create:{width:width*4,height:height*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png({compressionLevel:9}).toBuffer();
 return {png,width:width*4,height:height*2,frames,anchor:{x:.5,y:(height-pad)/height},fps:10};
}
