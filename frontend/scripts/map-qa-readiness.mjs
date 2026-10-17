export async function waitForAppliedQaOrientation(readMetrics,assetId,orientation,{timeoutMs=10000,pollIntervalMs=25}={}){
 const deadline=performance.now()+timeoutMs;
 let latest=null;
 while(performance.now()<=deadline){
  latest=await readMetrics();
  if(latest?.qaDraftOrientations?.some(entry=>entry.assetId===assetId&&entry.orientation===orientation))return latest;
  const remaining=deadline-performance.now();
  if(remaining<=0)break;
  await new Promise(resolve=>setTimeout(resolve,Math.min(pollIntervalMs,remaining)));
 }
 throw new Error(`Renderer did not apply QA preview orientation ${assetId}/${orientation} within ${timeoutMs} ms; observed ${JSON.stringify(latest?.qaDraftOrientations??[])}`);
}
