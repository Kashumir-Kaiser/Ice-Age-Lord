import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {exportDepthSlices} from '../scripts/export-depth-slices.mjs';
import {projectDepthNodes} from '../src/rendering/DepthSlices.ts';
import {projectBuildings,buildingLOD,regionalRect} from '../src/rendering/BuildingGeometry.ts';
import {orientationAsset,spriteRect} from '../src/rendering/SpriteRegistration.ts';
import {depthOrder} from '../src/rendering/DepthOrder.ts';
import {pickStack} from '../src/rendering/MapPicking.ts';
import {artPolygon} from '../src/rendering/SpriteRegistration.ts';
import {intersects} from '../src/rendering/DepthOrder.ts';
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

test('building projection avoids per-entity result arrays without changing visible geometry',()=>{
 const previous=(buildings,project,scale,size,cull=true,lods)=>(buildings.flatMap(building=>{
  if(!building.asset)return [];
  const asset=orientationAsset(building.asset,building.orientation),ground=project(building.point),rect=spriteRect(asset,ground,scale);
  const lod=buildingLOD(building.id,2*(building.footprint.widthM+building.footprint.depthM)*scale,lods),symbol=regionalRect(ground);
  const bounds={minX:Math.min(rect.x,symbol.x),minY:Math.min(rect.y,symbol.y),maxX:Math.max(rect.x+rect.width,symbol.x+symbol.width),maxY:Math.max(rect.y+rect.height,symbol.y+symbol.height)};
  if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))return [];
  const turned=building.orientation==='east'||building.orientation==='west',width=turned?building.footprint.depthM:building.footprint.widthM,depth=turned?building.footprint.widthM:building.footprint.depthM;
  return [{...building,asset,ground,rect,lod,symbol,bounds,depth:ground.y,footprint:{...building.footprint,minX:building.point.x-width/2,maxX:building.point.x+width/2,minY:building.point.y-depth/2,maxY:building.point.y+depth/2}}];
 }));
 const asset=manifest.assets.find(entry=>entry.mapDepthSlices),buildings=[];
 for(let i=0;i<520;i++)buildings.push({id:'dense:'+i,name:asset.name,asset,assetId:asset.assetId,orientation:['north','east','south','west'][i%4],footprint:{widthM:asset.compatiblePhysicalFootprint.widthM,depthM:asset.compatiblePhysicalFootprint.depthM},point:{x:(i%26)*31-390,y:Math.floor(i/26)*27-270},selected:false,active:false,draft:false});
 buildings.push({id:'missing',name:'missing',point:{x:0,y:0},selected:false,active:false,draft:false});
 for(const scale of [.001,.2,3,15])for(const pan of [[0,0],[350,-170],[-710,95]])for(const cull of [false,true]){
  const project=p=>({x:300+pan[0]+scale*1.3*(p.x+p.y),y:240+pan[1]+scale*.7*(p.x-p.y)}),oldLods=new Map(),newLods=new Map();
  assert.deepEqual(projectBuildings(buildings,project,scale,{width:600,height:480},cull,newLods),previous(buildings,project,scale,{width:600,height:480},cull,oldLods),`scale=${scale}, pan=${pan}, cull=${cull}`);
 }
 const sparse=new Array(buildings.length+2);sparse[1]=buildings[0];sparse[buildings.length]=buildings.at(-1);
 const project=p=>({x:300+3*(p.x+p.y),y:240+3*(p.x-p.y)});
 assert.deepEqual(projectBuildings(sparse,project,3,{width:600,height:480}),previous(sparse,project,3,{width:600,height:480}),`sparse arrays retain flatMap hole and initial-length behavior`);
});

test('depth-node allocation reduction preserves the previous projection output exactly',()=>{
 const previous=(buildings,project,scale,size,cull=true,lods,planning=false,projected)=>
  (projected??projectBuildings(buildings,project,scale,size,false,lods)).flatMap(b=>{
   const parts=planning||b.lod==='regional'?undefined:b.asset.mapDepthSlices?.[b.orientation];
   if(!parts?.length)return cull&&!intersects(b.bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16})?[]:[{...b,entityId:b.id,slice:undefined}];
   const turned=b.orientation==='east'||b.orientation==='west';
   return parts.flatMap(slice=>{
    const polygon=artPolygon(slice.hull,b.rect),bounds={minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minY:Math.min(...polygon.map(p=>p.y)),maxY:Math.max(...polygon.map(p=>p.y))};
    if(cull&&!intersects(bounds,{minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16}))return [];
    const footprint={...b.footprint},span=turned?footprint.maxY-footprint.minY:footprint.maxX-footprint.minX;
    if(turned){footprint.minY=b.point.y+slice.range[0]*span;footprint.maxY=b.point.y+slice.range[1]*span;}
    else{footprint.minX=b.point.x+slice.range[0]*span;footprint.maxX=b.point.x+slice.range[1]*span;}
    const depth=project({x:(footprint.minX+footprint.maxX)/2,y:(footprint.minY+footprint.maxY)/2}).y;
    return [{...b,id:b.id+':slice:'+slice.id,entityId:b.id,slice,bounds,footprint,depth}];
   });
  });
 const assets=manifest.assets.filter(asset=>asset.mapDepthSlices),buildings=[];
 for(const asset of assets)for(const orientation of ['north','east','south','west'])buildings.push({id:asset.assetId+':'+orientation,name:asset.name,point:{x:13,y:-29},asset,assetId:asset.assetId,orientation,footprint:{widthM:asset.compatiblePhysicalFootprint.widthM,depthM:asset.compatiblePhysicalFootprint.depthM},selected:false,active:false,draft:false});
 const plain=manifest.assets.find(asset=>!asset.mapDepthSlices);if(plain)buildings.push({id:'plain',name:plain.name,point:{x:-31,y:45},asset:plain,assetId:plain.assetId,orientation:'west',footprint:{widthM:plain.compatiblePhysicalFootprint.widthM,depthM:plain.compatiblePhysicalFootprint.depthM},selected:false,active:false,draft:false});
 const size={width:600,height:480};
 for(const scale of [.001,.2,3,15])for(const pan of [[0,0],[350,-170],[-710,95]])for(const cull of [false,true])for(const planning of [false,true]){
  const project=p=>({x:300+pan[0]+scale*1.3*(p.x+p.y),y:240+pan[1]+scale*.7*(p.x-p.y)}),lods=new Map();
  const projected=projectBuildings(buildings,project,scale,size,true,lods);
  assert.deepEqual(projectDepthNodes(buildings,project,scale,size,cull,lods,planning,projected),previous(buildings,project,scale,size,cull,lods,planning,projected),`scale=${scale}, pan=${pan}, cull=${cull}, planning=${planning}`);
  assert.deepEqual(projectDepthNodes(buildings,project,scale,size,cull,lods,planning),previous(buildings,project,scale,size,cull,lods,planning),`unprojected scale=${scale}, pan=${pan}, cull=${cull}, planning=${planning}`);
 }
});

test('cached depth-slice bounds match legacy culling at viewport edges for every orientation',()=>{
 const asset=manifest.assets.find(entry=>entry.mapDepthSlices),size={width:600,height:480},scale=3;
 const legacyBounds=node=>{
  const polygon=artPolygon(node.slice.hull,node.rect);
  return {minX:Math.min(...polygon.map(point=>point.x)),maxX:Math.max(...polygon.map(point=>point.x)),minY:Math.min(...polygon.map(point=>point.y)),maxY:Math.max(...polygon.map(point=>point.y))};
 };
 const viewport={minX:-16,minY:-16,maxX:size.width+16,maxY:size.height+16};
 for(const orientation of ['north','east','south','west']){
  const building={id:'boundary:'+orientation,name:asset.name,point:{x:13,y:-29},asset,assetId:asset.assetId,orientation,footprint:{widthM:asset.compatiblePhysicalFootprint.widthM,depthM:asset.compatiblePhysicalFootprint.depthM},selected:false,active:false,draft:false};
  const baseProject=point=>({x:300+scale*1.3*(point.x+point.y),y:240+scale*.7*(point.x-point.y)});
  const baseNodes=projectDepthNodes([building],baseProject,scale,size,false);
  assert.ok(baseNodes.some(node=>node.slice),`expected authored slices for ${orientation}`);
  for(const anchor of baseNodes.filter(node=>node.slice))for(const edge of ['left','right','top','bottom'])for(const offset of [-1e-6,0,1e-6]){
   const bounds=legacyBounds(anchor);
   const dx=edge==='left'?-16-bounds.minX+offset:edge==='right'?size.width+16-bounds.maxX+offset:0;
   const dy=edge==='top'?-16-bounds.minY+offset:edge==='bottom'?size.height+16-bounds.maxY+offset:0;
   const project=point=>{const screen=baseProject(point);return {x:screen.x+dx,y:screen.y+dy};};
   const all=projectDepthNodes([building],project,scale,size,false);
   const expected=all.map(node=>({...node,bounds:legacyBounds(node)})).filter(node=>intersects(node.bounds,viewport));
   assert.deepEqual(projectDepthNodes([building],project,scale,size,true),expected,`${orientation} ${anchor.slice.id} at ${edge} offset ${offset}`);
  }
 }
});
