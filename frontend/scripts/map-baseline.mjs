import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const out = resolve('map-evidence/baseline');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const path=resolve(root,pathname==='/'?'index.html':decodeURIComponent(pathname).slice(1));
 if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream'});res.end(readFileSync(path));
}).listen(4179,'127.0.0.1');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const viewport of [{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4179/?mode=demo');
  const menu=page.getByRole('button',{name:'Mở điều hướng'});if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:/Lãnh địa/}).click();
  await page.waitForTimeout(1500);
  await page.screenshot({path:resolve(out,'territory-'+viewport.width+'.png')});
  await page.getByRole('button',{name:'Mặt bằng',exact:true}).click();
  await page.screenshot({path:resolve(out,'planning-'+viewport.width+'.png')});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:/Bản đồ/}).click();
  await page.waitForTimeout(1500);
  await page.screenshot({path:resolve(out,'local-'+viewport.width+'.png')});
  const world=page.getByRole('button',{name:/Toàn thế giới|Thế giới/}).first();
  if(await world.count())await world.click();
  await page.waitForTimeout(1000);
  await page.screenshot({path:resolve(out,'world-'+viewport.width+'.png')});
  await page.close();
 }
}finally{await browser.close();server.close();}
