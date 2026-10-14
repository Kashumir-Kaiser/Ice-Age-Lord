import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(new URL('../..',import.meta.url).pathname);
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
/** Read the encoded size, independently of manifest claims, before loading a texture. */
export function rasterDimensions(buffer){
 if(buffer.length>=24&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&buffer.toString('ascii',12,16)==='IHDR')return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
 if(buffer.length>=20&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){
  for(let offset=12;offset+8<=buffer.length;){
   const kind=buffer.toString('ascii',offset,offset+4),length=buffer.readUInt32LE(offset+4),start=offset+8;
   if(start+length>buffer.length)throw new Error('Truncated WebP chunk');
   if(kind==='VP8X'&&length>=10)return {width:1+buffer.readUIntLE(start+4,3),height:1+buffer.readUIntLE(start+7,3)};
   if(kind==='VP8L'&&length>=5&&buffer[start]===47){const bits=buffer.readUInt32LE(start+1);return {width:1+(bits&16383),height:1+((bits>>>14)&16383)};}
   if(kind==='VP8 '&&length>=10&&buffer[start+3]===157&&buffer[start+4]===1&&buffer[start+5]===42)return {width:buffer.readUInt16LE(start+6)&16383,height:buffer.readUInt16LE(start+8)&16383};
   offset=start+length+(length&1);
  }
 }
 throw new Error('Unsupported or invalid raster header');
}
function checkDimensions(buffer,width,height){const actual=rasterDimensions(buffer);if(actual.width!==width||actual.height!==height)throw new Error('Raster dimensions differ from manifest');}
export function validateMapExport(entry,asset,read=path=>readFileSync(resolve(root,path))){
 if(!['.png','.webp'].includes(extname(entry.path)))throw new Error('Unsupported map export format: '+entry.path);
 if(!Number.isInteger(entry.width)||entry.width<1||entry.width>2048||!Number.isInteger(entry.height)||entry.height<1||entry.height>2048)throw new Error('Invalid map export dimensions');
 if(entry.logicalCanvas&&(entry.logicalCanvas.width!==asset.logicalCanvas.width||entry.logicalCanvas.height!==asset.logicalCanvas.height))throw new Error('Incompatible logical canvas');
 if(entry.trim&&(entry.trim.x<0||entry.trim.y<0||entry.trim.width<=0||entry.trim.height<=0||entry.trim.x+entry.trim.width>asset.logicalCanvas.width||entry.trim.y+entry.trim.height>asset.logicalCanvas.height))throw new Error('Invalid map trim');
 if(entry.exportVersion>=3){
  const size=entry.rasterCanvas,trim=entry.trim,canvas=asset.logicalCanvas;
  if(!size||!trim||!Number.isInteger(size.width)||!Number.isInteger(size.height)||size.width<entry.width||size.height<entry.height)throw new Error('Invalid original map raster canvas');
  const values=[trim.x/canvas.width*size.width,trim.y/canvas.height*size.height,trim.width/canvas.width*size.width,trim.height/canvas.height*size.height];
  if(values.some(v=>Math.abs(v-Math.round(v))>1e-7)||Math.abs(values[2]-entry.width)>1e-7||Math.abs(values[3]-entry.height)>1e-7)throw new Error('Map trim does not match raster pixel bounds');
 }
 if(entry.orientation&&entry.orientation!==asset.orientation&&!asset.orientationViews?.[entry.orientation]&&!asset.equivalentOrientations?.includes(entry.orientation))throw new Error('Incompatible map orientation');
 if(entry.role&&asset.layers){
  const layers=asset.orientationViews?.[entry.orientation]??asset.layers;
  const registered=layers[entry.role];
  const source=entry.layerPath??entry.source;
  const planning=entry.role==='base'&&source===asset.planningLayer;
  if(registered&&source!==registered&&!planning)throw new Error('Map export does not match its registered orientation layer');
 }
 if(entry.atlas){const f=entry.atlas;if(f.x<0||f.y<0||f.width!==entry.width||f.height!==entry.height||f.x+f.width>f.atlasWidth||f.y+f.height>f.atlasHeight||f.atlasWidth>2048||f.atlasHeight>2048)throw new Error('Atlas frame outside bounds');const buffer=read('frontend/public'+f.path);if(!f.sha256||hash(buffer)!==f.sha256)throw new Error('Atlas hash mismatch');checkDimensions(buffer,f.atlasWidth,f.atlasHeight);}
 const buffer=read('frontend/public'+entry.path);
 if(!entry.sha256||hash(buffer)!==entry.sha256)throw new Error('Map export hash mismatch: '+entry.path);
 checkDimensions(buffer,entry.width,entry.height);
 if(!entry.sourceSha256||hash(read(entry.source.startsWith('/')?'frontend/public'+entry.source:entry.source))!==entry.sourceSha256)throw new Error('Map source hash mismatch: '+entry.source);
 for(const dependency of entry.sourceDependencies??[])if(hash(read(dependency.source))!==dependency.sha256)throw new Error('Map source dependency hash mismatch: '+dependency.source);
}
export function validateMapAssets(manifest){
 for(const asset of manifest.assets){
  if(!Number.isFinite(asset.groundAnchor.x)||!Number.isFinite(asset.groundAnchor.y)||asset.groundAnchor.x<0||asset.groundAnchor.x>1||asset.groundAnchor.y<0||asset.groundAnchor.y>1)throw new Error('Invalid map anchor');
  for(const entry of asset.mapExports??[])validateMapExport(entry,asset);
  if(asset.mapFlame)validateMapFlame(asset.mapFlame);
  for(const [orientation,slices] of Object.entries(asset.mapDepthSlices??{})){
   const ids=new Set();let boundary=-.5;
   for(const slice of slices){
    if(ids.has(slice.id)||!Array.isArray(slice.range)||slice.range.length!==2||!slice.range.every(Number.isFinite)||Math.abs(slice.range[0]-boundary)>1e-8||slice.range[1]<=slice.range[0]||slice.range[1]>.5||!Array.isArray(slice.hull)||slice.hull.length<3||slice.hull.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw new Error('Invalid architectural depth partition');
    ids.add(slice.id);boundary=slice.range[1];
    for(const lod of ['close','district'])if(!asset.mapExports?.some(e=>e.sliceId===slice.id&&e.path===slice.paths[lod]&&e.lod===lod&&e.orientation===orientation))throw new Error('Missing registered architectural slice');
   }
   if(Math.abs(boundary-.5)>1e-8)throw new Error('Incomplete architectural depth partition');
  }
 }
 for(const entry of manifest.environmentArt??[])validateMapExport(entry,{logicalCanvas:{width:entry.width,height:entry.height},orientation:entry.orientation});
}
export function validateMapFlame(flame,read=path=>readFileSync(resolve(root,path))){
 if(flame.path!=='/assets/map/effects/flame-loop.png'||flame.source!=='assets/source/map-effects/flame-loop-sheet.png')throw new Error('Invalid map flame path');
 if(!Number.isInteger(flame.width)||!Number.isInteger(flame.height)||flame.width<1||flame.height<1||flame.width>2048||flame.height>2048||flame.fps<8||flame.fps>12||!Array.isArray(flame.frames)||flame.frames.length!==8)throw new Error('Invalid map flame sheet');
 for(const point of [flame.anchor,flame.emitter])if(!point||![point.x,point.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new Error('Invalid map flame anchor');
 if(!Number.isFinite(flame.relativeWidth)||flame.relativeWidth<=0||flame.relativeWidth>1)throw new Error('Invalid map flame scale');
 const rectangles=[];
 for(const frame of flame.frames){
  if(![frame.x,frame.y,frame.width,frame.height].every(Number.isInteger)||frame.x<0||frame.y<0||frame.width<1||frame.height<1||frame.x+frame.width>flame.width||frame.y+frame.height>flame.height)throw new Error('Map flame frame outside bounds');
  if(rectangles.some(r=>frame.x<r.x+r.width&&frame.x+frame.width>r.x&&frame.y<r.y+r.height&&frame.y+frame.height>r.y))throw new Error('Overlapping map flame frames');
  rectangles.push(frame);
 }
 const buffer=read('frontend/public'+flame.path);checkDimensions(buffer,flame.width,flame.height);
 if(hash(buffer)!==flame.sha256||hash(read(flame.source))!==flame.sourceSha256)throw new Error('Map flame hash mismatch');
}
