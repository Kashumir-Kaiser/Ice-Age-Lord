import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {exportDepthSlices} from '../scripts/export-depth-slices.mjs';
import {projectDepthNodes} from '../src/rendering/DepthSlices.ts';
import {depthOrder} from '../src/rendering/DepthOrder.ts';
import {pickStack} from '../src/rendering/MapPicking.ts';
import {artPolygon} from '../src/rendering/SpriteRegistration.ts';
const manifest=JSON.parse(readFileSync(new URL('../../assets/manifest.json',import.meta.url)));
const joints=JSON.parse(readFileSync(new URL('../../assets/map-depth-slices.json',import.meta.url)));
test('wall and gate depth cuts reconstruct every source pixel and extruded atlas frame',async()=>{
 for(const [id,orientations] of Object.entries(joints))for(const [orientation,cuts] of Object.entries(orientations))for(const lod of ['close','district']){
  const asset=manifest.assets.find(a=>a.assetId===id),entry=asset.mapExports.find(e=>e.role==='body'&&!e.sliceId&&e.orientation===orientation&&e.lod===lod);
  const png=readFileSync(new URL('../public'+entry.path,import.meta.url)),result=await exportDepthSlices(png,entry,cuts),body=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const restored=Buffer.alloc(body.data.length),sheet=await sharp(result.atlas).ensureAlpha().raw().toBuffer();let offset=0;
  for(const part of result.slices){
   const raw=await sharp(part.png).ensureAlpha().raw().toBuffer();
   for(let y=0;y<part.height;y++){
    raw.copy(restored,(y*body.info.width+offset)*4,y*part.width*4,(y+1)*part.width*4);
    assert.deepEqual(sheet.subarray(((y+part.frame.y)*result.side+part.frame.x)*4,((y+part.frame.y)*result.side+part.frame.x+part.width)*4),raw.subarray(y*part.width*4,(y+1)*part.width*4));
   }
   offset+=part.width;
  }
  assert.equal(offset,body.info.width);assert.deepEqual(restored,body.data,'no missing or duplicated body pixels');
 }
});
test('architectural slices keep one logical entity, stable ground extents, depth interleaving and unique picking',()=>{
 for(const id of Object.keys(joints))for(const orientation of ['north','east','south','west']){
  const asset=manifest.assets.find(a=>a.assetId===id);assert.equal(asset.mapDepthSlices?.[orientation]?.length,3,'every authored pose has registered depth coverage');
  const footprint={widthM:asset.compatiblePhysicalFootprint.widthM,depthM:asset.compatiblePhysicalFootprint.depthM},b={id:'wall',name:'wall',asset,assetId:id,orientation,footprint,point:{x:0,y:0},selected:false,active:false,draft:false};
  const before=JSON.stringify(b),project=p=>({x:300+6*(p.x+p.y),y:300+3*(p.x-p.y)}),size={width:600,height:600};
  const nodes=projectDepthNodes([b],project,3,size);assert.equal(nodes.length,3);assert.ok(nodes.every(n=>n.entityId==='wall'));
  const widths=nodes.map(n=>orientation==='north'||orientation==='south'?n.footprint.maxX-n.footprint.minX:n.footprint.maxY-n.footprint.minY);assert.ok(Math.abs(widths.reduce((a,b)=>a+b,0)-footprint.widthM)<1e-8);
  assert.equal(projectDepthNodes([b],project,3,size,true,undefined,true).length,1);assert.equal(projectDepthNodes([b],project,.001,size).length,1);
  const items=nodes.map(n=>({id:n.entityId,ground:[],silhouette:artPolygon(n.slice.hull,n.rect),selectable:true}));
  const point=items[1].silhouette[0];assert.deepEqual(pickStack(point,items,false),['wall']);assert.equal(new Set(pickStack(point,items,false)).size,1);
  const sorted=depthOrder(nodes);assert.equal(sorted.cycles.length,0);
  const pan=p=>({x:project(p).x-700,y:project(p).y+90});assert.deepEqual(depthOrder(projectDepthNodes([b],pan,3,size,false)).objects.map(n=>n.id),sorted.objects.map(n=>n.id));
  if(orientation==='north'){
   const unit={id:'unit',depth:300,bounds:{minX:0,minY:0,maxX:600,maxY:600},footprint:{minX:-.05,maxX:.05,minY:-.05,maxY:.05}};
   const ids=depthOrder([...nodes,unit]).objects.map(n=>n.id);assert.ok(ids.indexOf('wall:slice:0')<ids.indexOf('unit'));assert.ok(ids.indexOf('unit')<ids.indexOf('wall:slice:2'));
  }
  assert.equal(JSON.stringify(b),before,'depth slices never mutate a footprint or entity');
 }
});
