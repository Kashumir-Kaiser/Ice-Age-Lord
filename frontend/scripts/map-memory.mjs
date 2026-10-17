import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchMapBrowser,openMap,navigateMap,readyMap} from './map-browser.mjs';

const output=resolve('map-evidence/memory');mkdirSync(output,{recursive:true});
const browser=await launchMapBrowser(),samples=[];
let page;
try{
 page=await openMap(browser,{quality:process.env.MAP_BENCH_QUALITY??'normal'});
 await navigateMap(page,'Lãnh địa');await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await readyMap(page);
 const session=await page.context().newCDPSession(page);
 const measure=async cycle=>{
  await readyMap(page);await page.waitForTimeout(250);
  await session.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(250);await session.send('HeapProfiler.collectGarbage');
  const state=await page.evaluate(()=>{const all=window.__mapMetrics??[],active=all.filter(m=>m.backend!=='initializing'&&(m.decodedBytes||m.activeLoops));return {heapBytes:performance.memory?.usedJSHeapSize??null,gcAvailable:typeof window.gc==='function',activeMaps:active.length,activeLoops:all.reduce((sum,m)=>sum+m.activeLoops,0),decodedBytes:all.reduce((sum,m)=>sum+m.decodedBytes,0),gpuBytes:all.reduce((sum,m)=>sum+m.textureBytes,0),pending:all.reduce((sum,m)=>sum+m.queued+m.pendingTextures,0),retainedMetricRecords:all.length,canvasCount:document.querySelectorAll('.map-render-canvas').length};});
  samples.push({cycle,...state});console.log('Equal warm endpoint:',cycle,state);
 };
 await measure(0);
 for(let cycle=1;cycle<=2;cycle++){
  for(let i=0;i<20;i++){
   await navigateMap(page,'Bản đồ');await readyMap(page);
   await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới',exact:true}).click();await readyMap(page);
   await page.getByRole('button',{name:'Chuyển sang bản đồ địa phương',exact:true}).click();await readyMap(page);
   await navigateMap(page,'Lãnh địa');await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await readyMap(page);
   const node=page.locator('.territory-scene-svg');await node.scrollIntoViewIfNeeded();const box=await node.boundingBox();
   await page.mouse.move(box.x+box.width*.5,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+40,box.y+box.height*.6+20,{steps:3});await page.mouse.up();
   await page.getByRole('button',{name:'Về lửa trại',exact:true}).click();await readyMap(page);
  }
  await measure(cycle);
 }
 const final=samples.at(-1),previous=samples.at(-2),growth=final.heapBytes===null||previous.heapBytes===null?null:final.heapBytes-previous.heapBytes;
 const report={scope:'Two identical 20-return/pan cycles, same warmed territory endpoint; renderer estimates plus Chromium JS heap after exposed GC where available.',samples,heapGrowthLastTwoCycles: growth,heapBudgetBytes:10*1048576,targetDeviceVerified:false,plateauVerified:growth!==null&&final.gcAvailable&&growth<10*1048576&&final.pending===0&&final.canvasCount===1&&final.activeMaps===1&&final.activeLoops===0};
 writeFileSync(resolve(output,'results.json'),JSON.stringify(report,null,2));
 if(!report.plateauVerified)throw new Error('Map memory plateau gate failed or could not be measured; inspect results.json');
}finally{await page?.close();await browser.close();}
