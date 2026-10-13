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
 if(entry.orientation&&entry.orientation!==asset.orientation&&!asset.orientationViews?.[entry.orientation]&&!asset.equivalentOrientations?.includes(entry.orientation))throw new Error('Incompatible map orientation');
 if(entry.atlas){const f=entry.atlas;if(f.x<0||f.y<0||f.width!==entry.width||f.height!==entry.height||f.x+f.width>f.atlasWidth||f.y+f.height>f.atlasHeight||f.atlasWidth>2048||f.atlasHeight>2048)throw new Error('Atlas frame outside bounds');const buffer=read('frontend/public'+f.path);if(!f.sha256||hash(buffer)!==f.sha256)throw new Error('Atlas hash mismatch');checkDimensions(buffer,f.atlasWidth,f.atlasHeight);}
 const buffer=read('frontend/public'+entry.path);
 if(!entry.sha256||hash(buffer)!==entry.sha256)throw new Error('Map export hash mismatch: '+entry.path);
 checkDimensions(buffer,entry.width,entry.height);
 if(!entry.sourceSha256||hash(read(entry.source.startsWith('/')?'frontend/public'+entry.source:entry.source))!==entry.sourceSha256)throw new Error('Map source hash mismatch: '+entry.source);
}
export function validateMapAssets(manifest){
 for(const asset of manifest.assets){
  if(!Number.isFinite(asset.groundAnchor.x)||!Number.isFinite(asset.groundAnchor.y)||asset.groundAnchor.x<0||asset.groundAnchor.x>1||asset.groundAnchor.y<0||asset.groundAnchor.y>1)throw new Error('Invalid map anchor');
  for(const entry of asset.mapExports??[])validateMapExport(entry,asset);
 }
 for(const entry of manifest.environmentArt??[])validateMapExport(entry,{logicalCanvas:{width:entry.width,height:entry.height},orientation:entry.orientation});
}
