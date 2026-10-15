import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchMapBrowser,openMap,navigateMap} from './map-browser.mjs';

const browser=await launchMapBrowser();let page;
try{
 page=await openMap(browser,{quality:'low'});
 await navigateMap(page,'Lãnh địa');await page.locator('.territory-scene-svg').waitFor();
 await page.waitForLoadState('networkidle');
 await navigateMap(page,'Bản đồ');
 await page.getByRole('button',{name:'Chuyển sang bản đồ thế giới',exact:true}).click();
 await page.waitForLoadState('networkidle');
 const scripts=Array.from(page.mapScriptTransfers.values()).sort((a,b)=>a.path.localeCompare(b.path));
 const output=resolve(process.env.MAP_JS_REPORT??'map-evidence/bundle/current.json');mkdirSync(resolve(output,'..'),{recursive:true});
 writeFileSync(output,JSON.stringify({scope:'Unique JavaScript files actually requested while opening demo territory, local and world maps, including shared UI and worker scripts. Offline-estimate gzip size for each requested JavaScript file; the Playwright fixture serves identity bytes. Compare the same journey against the pinned pre-overhaul build.',scripts,gzipBytes:scripts.reduce((n,s)=>n+s.gzipBytes,0)},null,2));
}finally{await page?.close();await browser.close();}
