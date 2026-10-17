/** Feather opposite edges in the export only, preserving the generated master. */
export function periodicMaterial(input,width,height,channels,band=24){
 const data=Buffer.from(input);
 const blend=(a,b,amount)=>{for(let c=0;c<channels;c++){const first=data[a+c],last=data[b+c];data[a+c]=Math.round(first*(1-amount)+last*amount);data[b+c]=Math.round(last*(1-amount)+first*amount);}};
 for(let y=0;y<height;y++)for(let k=0;k<Math.min(band,width/2);k++)blend((y*width+k)*channels,(y*width+width-1-k)*channels,.5*(1-k/band));
 for(let x=0;x<width;x++)for(let k=0;k<Math.min(band,height/2);k++)blend((k*width+x)*channels,((height-1-k)*width+x)*channels,.5*(1-k/band));
 return data;
}
