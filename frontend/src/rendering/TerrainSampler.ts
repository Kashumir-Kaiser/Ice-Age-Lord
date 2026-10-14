import { MAP_PALETTE, VISUAL_STYLE_VERSION } from './mapStyle.ts';
export type Material = 'snow' | 'earth' | 'ice' | 'rock' | 'forest';
export type Geography = { forest: {x:number;y:number}; stone: {x:number;y:number}; water: {x:number;y:number} };
export type TerrainRegion={x:number;y:number;width:number;depth:number;kind:'forest'|'rock'|'ice';ratio:number};
export type TerrainProp = {id:string;x:number;y:number;size:number;kind:'conifer'|'bare'|'rock'|'bank';variant:number};
export function visualHash(x:number,y:number,seed:number):number {
  let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^seed;
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
export function visualSeed(identity:string):number {
  let n=2166136261;for(const c of identity+':'+VISUAL_STYLE_VERSION)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;
}
const smooth=(n:number)=>n*n*(3-2*n);
export function noise(x:number,y:number,seed:number):number {
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  const a=visualHash(ix,iy,seed),b=visualHash(ix+1,iy,seed),c=visualHash(ix,iy+1,seed),d=visualHash(ix+1,iy+1,seed);
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
export function regionWeight(x:number,y:number,center:{x:number;y:number},rx:number,ry:number):number {
  const distance=Math.hypot((x-center.x)/rx,(y-center.y)/ry);return smooth(Math.max(0,Math.min(1,(1-distance)*3)));
}
/** Public modeled infill from old TerrainDetails, converted back to +Y north. */
export const MODELED_FOREST = Object.freeze([
  {x:370,y:-390,rx:390,ry:680},{x:980,y:-1130,rx:960,ry:1050},
  {x:305,y:-75,rx:315,ry:255},
  {x:11200,y:13300,rx:6500,ry:5700},{x:-9000,y:-15900,rx:4500,ry:4000},
]);
/** Existing TerrainDetails relief infill, in the same north-positive geography. */
export const MODELED_RELIEF=Object.freeze([
  {x:-15600,y:6300,rx:5800,ry:4700},
  {x:-11700,y:-9250,rx:5200,ry:6200},
  {x:17000,y:-5200,rx:5300,ry:3600},
]);
const rgb=(s:string)=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const snow=rgb(MAP_PALETTE.snow),highlight=rgb(MAP_PALETTE.snowHighlight),shade=rgb(MAP_PALETTE.snowShadow),rock=rgb(MAP_PALETTE.rock);
export class TerrainSampler {
  readonly seed:number;
  readonly identity:string;
  readonly geography?:Geography;
  readonly regions:readonly TerrainRegion[];
  readonly modeledInfill:boolean;
  constructor(identity:string,geography?:Geography,regions:readonly TerrainRegion[]=[],modeledInfill=true){this.identity=identity;this.geography=geography;this.regions=regions;this.modeledInfill=modeledInfill;this.seed=visualSeed(identity);}
  forestAt(x:number,y:number):number {
    let w=0;if(this.modeledInfill)for(const g of MODELED_FOREST)w=Math.max(w,regionWeight(x,y,g,g.rx,g.ry));
    if(this.geography)w=Math.max(w,regionWeight(x,y,this.geography.forest,3500,3600));
    for(const r of this.regions)if(r.kind==='forest')w=Math.max(w,regionWeight(x,y,r,r.width/2,r.depth/2)*r.ratio);return w;
  }
  sample(x:number,y:number,sampleSpan=0):{material:Material;color:readonly number[];forest:number} {
    const broad=.5+(noise(x/4000,y/4000,this.seed)-.5)*.4*Math.max(0,1-sampleSpan/4000)
      +(noise(x/800,y/800,this.seed+7)-.5)*.2*Math.max(0,1-sampleSpan/800)
      +(noise(x/110,y/110,this.seed+13)-.5)*.4*Math.max(0,1-sampleSpan/110);
    const medium=.5+(noise(x/24,y/24,this.seed+19)-.5)*Math.max(0,1-sampleSpan/24);
    const forest=this.forestAt(x,y);
    let stone=this.geography?regionWeight(x,y,this.geography.stone,1300,1100):0;
    if(this.modeledInfill)for(const ridge of MODELED_RELIEF)stone=Math.max(stone,regionWeight(x,y,ridge,ridge.rx,ridge.ry)*.55);
    let ice=this.geography?regionWeight(x,y,this.geography.water,2100,1200):0;
    for(const r of this.regions){const w=regionWeight(x,y,r,r.width/2,r.depth/2)*r.ratio;if(r.kind==='rock')stone=Math.max(stone,w);if(r.kind==='ice')ice=Math.max(ice,w);}
    const material:Material=ice>.45?'ice':stone>.45?'rock':forest>.35?'forest':'snow';
    const color=snow.map((v,i)=>v+(highlight[i]-v)*broad*.62+(shade[i]-v)*(1-medium)*.24+(rock[i]-v)*stone*.65-(i===0?38:26)*forest);
    if(ice>0){color[0]-=ice*15;color[1]+=ice*5;color[2]+=ice*10;}
    return {material,color,forest};
  }
  props(bounds:{minX:number;maxX:number;minY:number;maxY:number},metresPerPixel:number):TerrainProp[] {
    if(metresPerPixel>1.5)return [];
    const cell=24,result:TerrainProp[]=[];
    for(let cy=Math.floor(bounds.minY/cell);cy<=Math.floor(bounds.maxY/cell);cy++)for(let cx=Math.floor(bounds.minX/cell);cx<=Math.floor(bounds.maxX/cell);cx++){
      const n=visualHash(cx,cy,this.seed+101),x=(cx+.15+visualHash(cx,cy,this.seed+102)*.7)*cell,y=(cy+.15+visualHash(cx,cy,this.seed+103)*.7)*cell;
      if(visualHash(cx,cy,this.seed+105)>Math.min(1,(1.5-metresPerPixel)/.6))continue;
      const forest=this.forestAt(x,y),kind=n<forest*.8?(visualHash(cx,cy,this.seed+104)<.16?'bare':'conifer'):n>.96?'rock':n>.9?'bank':null;
      if(kind)result.push({id:cx+':'+cy,x,y,kind,variant:Math.floor(n*1000)%8,size:kind==='conifer'||kind==='bare'?5+n*5:kind==='rock'?.8+n*1.2:4+n*5});
    }
    return result.sort((a,b)=>a.id.localeCompare(b.id));
  }
}
export function chunkLevel(pixelsPerMetre:number,previous?:number):number {
  const desired=Math.max(0,Math.round(Math.log2(384/Math.max(.000001,64*pixelsPerMetre))));
  if(previous!==undefined){const span=64*2**previous*pixelsPerMetre;if(span>=256*.85&&span<=512*1.15)return previous;}
  return Math.min(18,desired);
}
export function chunkCoverage(bounds:{minX:number;maxX:number;minY:number;maxY:number},level:number):number {
  const span=64*2**level;
  return (Math.floor(bounds.maxX/span)-Math.floor(bounds.minX/span)+1)*(Math.floor(bounds.maxY/span)-Math.floor(bounds.minY/span)+1);
}
/** A wide/rotated viewport must fit its visible set before reserving any prefetch. */
export function boundedChunkLevel(level:number,bounds:{minX:number;maxX:number;minY:number;maxY:number},slots:number):number {
  while(level<18&&chunkCoverage(bounds,level)>slots)level++;
  return level;
}
