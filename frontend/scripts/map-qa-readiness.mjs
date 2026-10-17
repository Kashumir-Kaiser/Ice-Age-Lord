function matchesTarget(value,assetId,orientation){
 return Boolean(value?.connected&&value.id&&value.assetId===assetId&&value.orientation===orientation);
}

export async function waitForAppliedQaOrientation(readActiveElement,waitForPaintCycle,assetId,orientation,{timeoutMs=10000,pollIntervalMs=25}={}){
 const deadline=performance.now()+timeoutMs;
 let latest=null;
 while(performance.now()<=deadline){
  latest=await readActiveElement();
  if(matchesTarget(latest,assetId,orientation)){
   const applied=await waitForPaintCycle(latest);
   if(matchesTarget(applied,assetId,orientation)&&applied.id===latest.id)return applied;
   latest=applied??latest;
  }
  const remaining=deadline-performance.now();
  if(remaining<=0)break;
  await new Promise(resolve=>setTimeout(resolve,Math.min(pollIntervalMs,remaining)));
 }
 throw new Error(`Active SVG draft did not apply QA preview orientation ${assetId}/${orientation} through a paint cycle within ${timeoutMs} ms; observed ${JSON.stringify(latest)}`);
}
