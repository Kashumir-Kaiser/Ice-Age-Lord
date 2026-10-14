import sharp from 'sharp';

/** Remove only transparent space; retain a two-pixel sampling gutter and logical offsets. */
export async function trimMapRaster(png,canvas){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(right<left)throw new Error('Empty map raster');
 left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(info.width-1,right+2);bottom=Math.min(info.height-1,bottom+2);
 const width=right-left+1,height=bottom-top+1;
 const cropped=await sharp(png).extract({left,top,width,height}).png({compressionLevel:9,palette:false}).toBuffer();
 return {png:cropped,width,height,rasterCanvas:{width:info.width,height:info.height},trim:{x:left/info.width*canvas.width,y:top/info.height*canvas.height,width:width/info.width*canvas.width,height:height/info.height*canvas.height}};
}
