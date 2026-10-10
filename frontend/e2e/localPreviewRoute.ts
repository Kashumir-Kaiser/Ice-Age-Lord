import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Page } from '@playwright/test';

const distRoot=resolve(process.cwd(),'dist');
const mimeTypes:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};

/** Serve the already-built local app through Playwright's request router. This needs no bound TCP server. */
export async function installLocalPreviewRoute(page:Page) {
  if(process.env.PLAYWRIGHT_IN_MEMORY!=='1')return;
  await page.route('**/*',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    const relative=pathname==='/'?'index.html':pathname.replace(/^\//,'');
    const file=resolve(distRoot,relative);
    if(!file.startsWith(distRoot+sep)||!existsSync(file)){
      await route.fulfill({status:404,body:'Not found'});return;
    }
    const extension=relative.slice(relative.lastIndexOf('.'));
    await route.fulfill({status:200,contentType:mimeTypes[extension]??'application/octet-stream',body:readFileSync(file)});
  });
}
