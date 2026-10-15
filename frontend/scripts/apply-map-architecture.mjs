import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {splitMapArchitecture} from './split-map-architecture.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');

/** Also supports a small architecture-only authoring pass over existing body exports. */
export async function applyMapArchitecture(manifest,definitions,repo){
 let count=0;
 for(const asset of manifest.assets){
  const definition=definitions[asset.assetId];if(!definition)continue;
  const prefix=`/assets/map/buildings/${asset.assetId}/`;
  // Replace prior partitions, retaining source bodies and planning/fallback exports.
  asset.mapExports=asset.mapExports.filter(e=>!(e.architecturePart||['base','upper'].includes(e.role)&&e.layerPath?.startsWith(prefix)));
  asset.composition='architectural';
  for(const orientation of ['north','east','south','west'])for(const lod of ['close','district']){
   const registered=asset.orientationViews?.[orientation]?.body??asset.layers.body;
   const body=asset.mapExports.find(e=>e.role==='body'&&!e.sliceId&&e.orientation===orientation&&e.lod===lod&&(e.layerPath??e.source)===registered);
   if(!body||!definition[orientation])throw new Error('Missing architectural pose: '+asset.assetId+':'+orientation);
   const parts=await splitMapArchitecture(readFileSync(resolve(repo,'frontend/public'+body.path)),body,definition[orientation]);
   for(const part of parts){
    const layerPath=`${prefix}${part.role}-${orientation}-close.png`,path=`${prefix}${part.role}-${orientation}-${lod}.png`;
    writeFileSync(resolve(repo,'frontend/public'+path),part.png);
    if(lod==='close'){
     asset.orientationViews??={};asset.orientationViews[orientation]??={...asset.layers};asset.orientationViews[orientation][part.role]=layerPath;
     if(part.role==='upper'){
      asset.orientationRegions??={};asset.orientationRegions[orientation]??={hitPolygon:asset.hitPolygon,upper:part.hull};asset.orientationRegions[orientation].upper=part.hull;
     }
    }
    const {atlas,...registration}=body;
    asset.mapExports.push({...registration,path,layerPath,architecturePart:true,role:part.role,width:part.width,height:part.height,trim:part.trim,sha256:sha(part.png),sourceDependencies:[...(body.sourceDependencies??[]),...['assets/map-architecture.json','frontend/scripts/split-map-architecture.mjs','frontend/scripts/apply-map-architecture.mjs'].map(source=>({source,sha256:sha(readFileSync(resolve(repo,source)))}))]});count++;
   }
  }
 }
 return count;
}
