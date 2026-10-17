import { MAP_PALETTE, VISUAL_STYLE_VERSION } from './mapStyle.ts';
import { GroundContacts } from './GroundContacts.ts';
export type Material = 'snow' | 'earth' | 'ice' | 'rock' | 'forest';
export type Geography = { forest: {x:number;y:number}; stone: {x:number;y:number}; water: {x:number;y:number} };
export type TerrainRegion={x:number;y:number;width:number;depth:number;kind:'forest'|'rock'|'ice';ratio:number};
export type TerrainProp = {id:string;x:number;y:number;size:number;kind:'conifer'|'bare'|'rock'|'bank'|'ledge';variant:number;worldWidth?:number};
export type TerrainRelief={id:string;x:number;y:number;width:number;depth:number;kind:'forest'|'ridge';variant:number};
export const GROUND_MATERIALS=['snow-quiet','snow-02','snow-03','snow-04','dirty-snow-01','dirty-snow-02','earth-01','earth-02','ice-01','ice-02'] as const;
export function visualHash(x:number,y:number,seed:number):number {
  let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^seed;
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
export function visualSeed(identity:string):number {
  let n=2166136261;for(const c of identity+':'+VISUAL_STYLE_VERSION)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;
}
const smooth=(n:number)=>n*n*(3-2*n);
const BANK_CONTOUR_RADIUS=.84446;
const BANK_SPACING_M=64;
const BANK_MAX_WORLD_WIDTH=80;
const BANK_VARIANT_WIDTHS=[0,1,2,4,7] as const;
const BANK_JUNCTION_VARIANTS=[3,5,6] as const;
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
  readonly contacts=new GroundContacts();
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
  /** Continuous presentation weights; resource locations come only from the scene projection. */
  materialWeights(x:number,y:number):number[] {
    let earth=0,ice=0;
    if(this.geography){earth=regionWeight(x,y,this.geography.stone,1300,1100)*.7;ice=regionWeight(x,y,this.geography.water,2100,1200);}
    if(this.modeledInfill)for(const ridge of MODELED_RELIEF)earth=Math.max(earth,regionWeight(x,y,ridge,ridge.rx,ridge.ry)*.35);
    for(const r of this.regions){const w=regionWeight(x,y,r,r.width/2,r.depth/2)*r.ratio;if(r.kind==='rock')earth=Math.max(earth,w*.7);if(r.kind==='ice')ice=Math.max(ice,w);}
    const dirty=Math.max(this.forestAt(x,y)*.28,this.contacts.scuffAt(x,y)),variant=noise(x/180,y/180,this.seed+311),split=noise(x/95,y/95,this.seed+313);
    const snowWeights=[0,.33,.67,1].map(center=>Math.max(0,1-Math.abs(variant-center)*3));
    const total=snowWeights.reduce((a,b)=>a+b,0),remaining=1-ice;
    return [...snowWeights.map(w=>w/total*remaining*(1-earth)*(1-dirty)),remaining*(1-earth)*dirty*(1-split),remaining*(1-earth)*dirty*split,remaining*earth*(1-split),remaining*earth*split,ice*(1-split),ice*split];
  }
  relief(bounds:{minX:number;maxX:number;minY:number;maxY:number},metresPerPixel:number):TerrainRelief[] {
    if(metresPerPixel<1.5)return [];
    const patches:TerrainRelief[]=[];
    const add=(id:string,kind:TerrainRelief['kind'],x:number,y:number,width:number,depth:number)=>{
      if(Math.min(width,depth)/metresPerPixel<20||x+width/2<bounds.minX||x-width/2>bounds.maxX||y+depth/2<bounds.minY||y-depth/2>bounds.maxY)return;
      patches.push({id,kind,x,y,width,depth,variant:Math.floor(visualHash(Math.floor(x),Math.floor(y),this.seed+401)*(kind==='forest'?4:2))});
    };
    if(this.modeledInfill){MODELED_FOREST.forEach((r,i)=>add('modeled-forest-'+i,'forest',r.x,r.y,r.rx*2,r.ry*2));MODELED_RELIEF.forEach((r,i)=>add('modeled-ridge-'+i,'ridge',r.x,r.y,r.rx*2,r.ry*2));}
    if(this.geography){add('resource-forest','forest',this.geography.forest.x,this.geography.forest.y,7000,7200);add('resource-ridge','ridge',this.geography.stone.x,this.geography.stone.y,2600,2200);}
    this.regions.forEach((r,i)=>{if(r.ratio>0&&r.kind!=='ice')add('projected-'+i,r.kind==='forest'?'forest':'ridge',r.x,r.y,r.width,r.depth);});
    return patches;
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
      const forest=this.forestAt(x,y),kind=n<forest*.8?(visualHash(cx,cy,this.seed+104)<.16?'bare':'conifer'):n>.985?'ledge':n>.96?'rock':null;
      if(kind)result.push({id:cx+':'+cy,x,y,kind,variant:Math.floor(n*1000)%8,size:kind==='conifer'||kind==='bare'?5+n*5:kind==='rock'?.8+n*1.2:kind==='ledge'?4+n*4:4+n*5});
    }
    if(this.geography?.water)result.push(...this.waterBankProps(bounds,this.geography.water,metresPerPixel));
    return result.sort((a,b)=>a.id.localeCompare(b.id));
  }
  private waterBankProps(bounds:{minX:number;maxX:number;minY:number;maxY:number},center:{x:number;y:number},metresPerPixel:number):TerrainProp[] {
    const rx=2100*BANK_CONTOUR_RADIUS,ry=1200*BANK_CONTOUR_RADIUS;
    const perimeter=Math.PI*(3*(rx+ry)-Math.sqrt((3*rx+ry)*(rx+3*ry)));
    const count=Math.min(150,Math.max(1,Math.ceil(perimeter/BANK_SPACING_M))),props:TerrainProp[]=[];
    for(let i=0;i<count;i++){
      if(visualHash(i,0,this.seed+605)>Math.min(1,(1.5-metresPerPixel)/.6))continue;
      if(visualHash(i,0,this.seed+601)<.2)continue;
      const angle=2*Math.PI*i/count,cos=Math.cos(angle),sin=Math.sin(angle);
      const normalLength=Math.hypot(cos/rx,sin/ry),normalX=(cos/rx)/normalLength,normalY=(sin/ry)/normalLength;
      const jitter=(visualHash(i,0,this.seed+602)-.5)*32;
      const x=center.x+rx*cos+normalX*jitter,y=center.y+ry*sin+normalY*jitter;
      const junction=i%12===0,variants=junction?BANK_JUNCTION_VARIANTS:BANK_VARIANT_WIDTHS;
      const variant=variants[Math.floor(visualHash(i,0,this.seed+603)*variants.length)];
      const worldWidth=junction?48+visualHash(i,0,this.seed+604)*12:64+visualHash(i,0,this.seed+604)*16;
      const halfExtent=BANK_MAX_WORLD_WIDTH/2;
      if(x+halfExtent<bounds.minX||x-halfExtent>bounds.maxX||y+halfExtent<bounds.minY||y-halfExtent>bounds.maxY)continue;
      props.push({id:'shore-bank:'+i,x,y,kind:'bank',variant,size:worldWidth,worldWidth});
    }
    return props;
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
