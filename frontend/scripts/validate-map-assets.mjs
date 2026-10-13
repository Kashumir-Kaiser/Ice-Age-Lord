import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(new URL('../..',import.meta.url).pathname);
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
export function validateMapExport(entry,asset,read=path=>readFileSync(resolve(root,path))){
 if(!['.png','.webp'].includes(extname(entry.path)))throw new Error('Unsupported map export format: '+entry.path);
 if(!Number.isInteger(entry.width)||entry.width<1||entry.width>2048||!Number.isInteger(entry.height)||entry.height<1||entry.height>2048)throw new Error('Invalid map export dimensions');
 if(entry.logicalCanvas&&(entry.logicalCanvas.width!==asset.logicalCanvas.width||entry.logicalCanvas.height!==asset.logicalCanvas.height))throw new Error('Incompatible logical canvas');
 if(entry.trim&&(entry.trim.x<0||entry.trim.y<0||entry.trim.width<=0||entry.trim.height<=0||entry.trim.x+entry.trim.width>asset.logicalCanvas.width||entry.trim.y+entry.trim.height>asset.logicalCanvas.height))throw new Error('Invalid map trim');
 if(entry.orientation&&entry.orientation!==asset.orientation&&!asset.orientationViews?.[entry.orientation]&&!asset.equivalentOrientations?.includes(entry.orientation))throw new Error('Incompatible map orientation');
 if(entry.atlas){const f=entry.atlas;if(f.x<0||f.y<0||f.width<=0||f.height<=0||f.x+f.width>f.atlasWidth||f.y+f.height>f.atlasHeight||f.atlasWidth>2048||f.atlasHeight>2048)throw new Error('Atlas frame outside bounds');if(!f.sha256||hash(read('frontend/public'+f.path))!==f.sha256)throw new Error('Atlas hash mismatch');}
 if(!entry.sha256||hash(read('frontend/public'+entry.path))!==entry.sha256)throw new Error('Map export hash mismatch: '+entry.path);
 if(!entry.sourceSha256||hash(read(entry.source.startsWith('/')?'frontend/public'+entry.source:entry.source))!==entry.sourceSha256)throw new Error('Map source hash mismatch: '+entry.source);
}
export function validateMapAssets(manifest){
 for(const asset of manifest.assets){
  if(!Number.isFinite(asset.groundAnchor.x)||!Number.isFinite(asset.groundAnchor.y)||asset.groundAnchor.x<0||asset.groundAnchor.x>1||asset.groundAnchor.y<0||asset.groundAnchor.y>1)throw new Error('Invalid map anchor');
  for(const entry of asset.mapExports??[])validateMapExport(entry,asset);
 }
 for(const entry of manifest.environmentArt??[])validateMapExport(entry,{logicalCanvas:{width:entry.width,height:entry.height},orientation:entry.orientation});
}
