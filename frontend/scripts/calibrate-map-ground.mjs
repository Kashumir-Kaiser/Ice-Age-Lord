import sharp from 'sharp';
import {alphaBounds,alphaHull} from './map-orientation-export.mjs';

function foot(data,width,height,x){
 let sum=0,count=0;
 for(let px=Math.round(x)-3;px<=Math.round(x)+3;px++){
  if(px<0||px>=width)continue;
  for(let y=height-1;y>=0;y--)if(data[(y*width+px)*4+3]>=128){sum+=y;count++;break;}
 }
 if(!count)throw new Error('Missing painted architectural ground contact');return {x,y:sum/count};
}
/** Map-only calibration for narrow vertical architecture. No pose rotation or source mutation. */
export async function calibrateMapGround(png,asset,orientation,registered){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let registration=registered;
 if(!registration){
  const bounds=alphaBounds(data,info.width,info.height),left=foot(data,info.width,info.height,bounds.x+bounds.width*.15),right=foot(data,info.width,info.height,bounds.x+bounds.width*.85);
  const desired=orientation==='east'||orientation==='west'?-.5:.5;
  const span=Math.max(...asset.artFootprint.map(p=>p[0]))-Math.min(...asset.artFootprint.map(p=>p[0]));
  const contact={x:(left.x+right.x)/2/info.width,y:(left.y+right.y)/2/info.height},shear=desired-(right.y-left.y)/(right.x-left.x);
  const corners=[[bounds.x,bounds.y],[bounds.x+bounds.width,bounds.y],[bounds.x,bounds.y+bounds.height],[bounds.x+bounds.width,bounds.y+bounds.height]];
  let scale=span*info.width/bounds.width;
  // Keep overhang inside the established canvas rather than clipping a front pier.
  for(const [x,y] of corners){const dx=x-contact.x*info.width,dy=y-contact.y*info.height+shear*dx;
   if(dx>0)scale=Math.min(scale,(info.width*(1-asset.groundAnchor.x)-3)/dx);else if(dx<0)scale=Math.min(scale,(info.width*asset.groundAnchor.x-3)/-dx);
   if(dy>0)scale=Math.min(scale,(info.height*(1-asset.groundAnchor.y)-3)/dy);else if(dy<0)scale=Math.min(scale,(info.height*asset.groundAnchor.y-3)/-dy);
  }
  registration={contact,scale,shear,sourceSlope:(right.y-left.y)/(right.x-left.x),targetSlope:desired};
 }
 const {scale,shear,contact}=registration,cx=contact.x*info.width,cy=contact.y*info.height,ax=asset.groundAnchor.x*info.width,ay=asset.groundAnchor.y*info.height;
 const output=Buffer.alloc(data.length);
 // Premultiplied bilinear sampling prevents dark fringes at transparent paint edges.
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const sx=(x-ax)/scale+cx,sy=(y-ay)/scale+cy-shear*(sx-cx),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  let alpha=0,r=0,g=0,b=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const px=ix+dx,py=iy+dy;if(px<0||py<0||px>=info.width||py>=info.height)continue;
   const i=(py*info.width+px)*4,w=(dx?fx:1-fx)*(dy?fy:1-fy)*data[i+3];alpha+=w;r+=data[i]*w;g+=data[i+1]*w;b+=data[i+2]*w;
  }
  const i=(y*info.width+x)*4;if(alpha>0){output[i]=Math.round(r/alpha);output[i+1]=Math.round(g/alpha);output[i+2]=Math.round(b/alpha);output[i+3]=Math.round(alpha);}
 }
 const bounds=alphaBounds(output,info.width,info.height);if(bounds.x<=0||bounds.y<=0||bounds.x+bounds.width>=info.width||bounds.y+bounds.height>=info.height)throw new Error('Calibrated architecture exceeds its logical canvas');
 const result=await sharp(output,{raw:info}).png({compressionLevel:9}).toBuffer();
 return {png:result,registration,hitPolygon:alphaHull(output,info.width,info.height)};
}
