import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';

const root=process.cwd();
const dist=resolve(root,'dist');
const output=resolve(process.env.TERRITORY_QA_DIR??'/tmp/ice-age-lord-territory-qa');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-crash-reporter','--disable-breakpad','--no-zygote']});

async function capture(viewport,screen,name,setup,{scrollToTop=true}={}){
  const page=await browser.newPage({viewport,reducedMotion:'reduce',isMobile:viewport.width<500,hasTouch:viewport.width<500});
  await page.route('**/*',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    const relative=pathname==='/'?'index.html':pathname.replace(/^\//,'');
    const file=resolve(dist,relative);
    if(!file.startsWith(dist+sep)||!existsSync(file)){await route.fulfill({status:404,body:'Not found'});return;}
    await route.fulfill({status:200,contentType:mime[extname(file)]??'application/octet-stream',body:readFileSync(file)});
  });
  await page.goto('http://local.preview/');
  const menu=page.getByRole('button',{name:'Mở điều hướng'});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:screen}).click();
  await setup?.(page);
  if(scrollToTop)await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(280);
  const path=resolve(output,name);
  await page.screenshot({path,animations:'disabled'});
  console.log(path);
  await page.close();
}

for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const suffix=viewport.width<500?'mobile':'desktop';
  await capture(viewport,/Bản đồ/,`strategic-${suffix}.png`,async page=>{
    if(suffix==='mobile')await page.locator('.map-entity-marker[data-entity-id="SITE-LL01-000"]').scrollIntoViewIfNeeded();
  });
  await capture(viewport,/Bản đồ/,`strategic-night-fire-off-${suffix}.png`,async page=>{
    await page.locator('.map-developer-tools > summary').click();
    await page.getByLabel('Mô phỏng giờ hiển thị').selectOption('1140');
    await page.getByLabel('Lửa đang bật').uncheck();
    await page.locator('.map-developer-tools > summary').click();
  });
  await capture(viewport,/Bản đồ/,`strategic-full-heat-${suffix}.png`,async page=>{
    await page.locator('.map-developer-tools > summary').click();
    await page.getByLabel('Xem thử vùng nhiệt theo cấp').selectOption('30');
    await page.getByRole('button',{name:'Xem toàn bộ vòng nhiệt'}).click();
    await page.locator('.map-developer-tools > summary').click();
  });
  await capture(viewport,/Lãnh địa/,`settlement-${suffix}.png`);
  await capture(viewport,/Lãnh địa/,`planning-mode-${suffix}.png`,async page=>{
    await page.getByRole('button',{name:'Mặt bằng'}).click();
  });
}
await capture({width:1280,height:900},/Lãnh địa/,'placement-near-heat-edge-desktop.png',async page=>{
  await page.getByRole('button',{name:/Thử bố trí Nhà thấp/}).click();
  const heat=await page.locator('.territory-scene-svg ellipse').evaluate(node=>({x:Number(node.getAttribute('cx')),y:Number(node.getAttribute('cy')),rx:Number(node.getAttribute('rx')),ry:Number(node.getAttribute('ry'))}));
  const rect=await page.locator('.territory-scene-svg').boundingBox();
  await page.mouse.move(rect.x+heat.x+heat.rx*Math.SQRT1_2*.9,rect.y+heat.y+heat.ry*Math.SQRT1_2*.9);
});
for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const suffix=viewport.width<500?'mobile':'desktop';
  await capture(viewport,/Lãnh địa/,`overlapping-towers-${suffix}.png`,async page=>{
    await page.getByRole('button',{name:/Thử bố trí Tháp cao/}).click();
    const stage=page.locator('.territory-scene-svg');
    const box=await stage.boundingBox();
    await stage.click({position:{x:box.width*.53,y:box.height*.52}});
    await stage.click({position:{x:box.width*.53+38,y:box.height*.52+8}});
    await page.getByRole('button',{name:'Hủy placement'}).click();
  });
}
await capture({width:1280,height:900},/Lãnh địa/,'placement-preview-desktop.png',async page=>{
  await page.getByRole('button',{name:/Thử bố trí Tháp cao/}).click();
});
await capture({width:390,height:844},/Lãnh địa/,'dense-qa-mobile.png',async page=>{
  await page.locator('.territory-calibration > summary').click();
  await page.getByRole('button',{name:'Đến cụm QA 520'}).click();
},{scrollToTop:false});
await browser.close();
