import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';
const output=resolve(process.env.MAP_COLD_DIR??'map-evidence/cold');mkdirSync(output,{recursive:true});
const browser=await launchMapBrowser(),results=[];
try{
 for(const quality of ['low','normal']){
  const page=await openMap(browser,{quality,motion:'reduce'});
  await readyMap(page);await page.locator('[data-map-renderer]').scrollIntoViewIfNeeded();
  const overview=page.mapAssetTransfers.slice();
  await page.screenshot({path:resolve(output,`overview-${quality}.png`),animations:'disabled'});
  await navigateMap(page,'Lãnh địa');await readyMap(page);await page.locator('[data-map-renderer]').scrollIntoViewIfNeeded();
  const requests=page.mapAssetTransfers.slice(),bytes=requests.reduce((sum,r)=>sum+r.bytes,0),budgetBytes=(quality==='low'?4:8)*1048576;
  await page.screenshot({path:resolve(output,`territory-${quality}.png`),animations:'disabled'});
  results.push({quality,fixture:'fresh demo entered through overview',bytes,budgetBytes,withinBudget:bytes<=budgetBytes,overviewBytes:overview.reduce((sum,r)=>sum+r.bytes,0),overviewRequests:overview,requests});
  await page.close();console.log(`${quality}: ${bytes} cold map bytes / ${budgetBytes} budget`);
 }
}finally{
 writeFileSync(resolve(output,'results.json'),JSON.stringify({scope:'Fresh browser contexts, real gzip HTTP responses with no-store, all map-directory assets and runtime manifest through first territory readiness. No wire-request deduplication; pre-existing UI/splash excluded. This is not a saved-populated LIVE measurement.',buildIndexSha256:createHash('sha256').update(readFileSync(resolve(process.env.MAP_DIST??'dist','index.html'))).digest('hex'),environment:{node:process.version,platform:os.platform(),cpu:os.cpus()[0]?.model,viewport:{width:1366,height:768},dpr:1,targetDeviceVerified:false},results},null,2));
 await browser.close();
}
