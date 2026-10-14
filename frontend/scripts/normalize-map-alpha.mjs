const saturated=(r,g,b)=>(b>100&&b>r*1.8&&b>g*1.4)||(g>100&&b>100&&g>r*1.8&&b>r*1.8);
/** Derivative-only matte cleanup; keep original masters and opaque interior colors. */
export function normalizeMapAlpha(input,width,height){
 const data=Buffer.from(input);let corrected=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,a=input[i+3];
  if(a<8){data.fill(0,i,i+4);continue;}
  if(!saturated(input[i],input[i+1],input[i+2]))continue;
  let edge=false,nearest=-1,best=Infinity;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
   const px=x+dx,py=y+dy;if(px<0||py<0||px>=width||py>=height)continue;const j=(py*width+px)*4;
   if(input[j+3]<32)edge=true;
   const distance=dx*dx+dy*dy;if(input[j+3]>128&&!saturated(input[j],input[j+1],input[j+2])&&distance<best){nearest=j;best=distance;}
  }
  if(edge&&nearest>=0){data[i]=input[nearest];data[i+1]=input[nearest+1];data[i+2]=input[nearest+2];corrected++;}
 }
 return {data,corrected};
}
