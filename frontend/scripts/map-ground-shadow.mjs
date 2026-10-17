import {referenceSize} from '../src/rendering/SpriteRegistration.ts';
/** Map-only contact kernels from the registered physical rectangle; no invented caster height. */
export function mapGroundShadow(asset,orientation){
 const canvas=asset.logicalCanvas,physical=asset.compatiblePhysicalFootprint,turned=orientation==='east'||orientation==='west';
 const width=turned?physical.depthM:physical.widthM,depth=turned?physical.widthM:physical.depthM,pixels=canvas.width/referenceSize(asset).width;
 const cx=canvas.width*asset.groundAnchor.x,cy=canvas.height*asset.groundAnchor.y;
 const polygon=(dx,dy)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>`${cx+(x*width+y*depth)*pixels+dx},${cy+(x*width-y*depth)*pixels/2+dy}`).join(' ');
 const blur=.12*pixels;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}"><defs><filter id="contact" filterUnits="userSpaceOnUse" x="0" y="0" width="${canvas.width}" height="${canvas.height}"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><g fill="#233d4b" filter="url(#contact)"><polygon points="${polygon(.2*pixels,.3*pixels)}" opacity=".10"/><polygon points="${polygon(0,0)}" opacity=".15"/></g></svg>`;
}
