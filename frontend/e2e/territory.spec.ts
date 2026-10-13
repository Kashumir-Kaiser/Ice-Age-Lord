import { test, expect } from '@playwright/test';
import { installLocalPreviewRoute } from './localPreviewRoute';

test.beforeEach(async ({page})=>installLocalPreviewRoute(page));

async function goTo(page:import('@playwright/test').Page,screen:RegExp){
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const menu=page.getByRole('button',{name:'Mở điều hướng'});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Các mục giao diện'}).getByRole('button',{name:screen}).click();
}

test('strategic map keeps one camp marker and its inspection action opens the same Territory',async({page})=>{
  await goTo(page,/Bản đồ/);
  await expect(page.locator('.map-entity-marker[data-entity-id="SITE-LL01-000"]')).toHaveCount(1);
  for(const id of ['SITE-LL01-001','SITE-LL01-002','SITE-LL01-003'])await expect(page.locator(`.map-entity-marker[data-entity-id="${id}"]`)).toHaveCount(0);
  await page.locator('.map-entity-marker[data-entity-id="SITE-LL01-000"]').click();
  await page.getByRole('button',{name:'Mở lãnh địa'}).click();
  await expect(page.getByRole('heading',{name:'Quản lý lãnh địa'})).toBeVisible();
  await expect(page.locator('.territory-building:not(.is-draft)[data-building-id^="SITE-LL01-"]')).toHaveCount(4);
  await expect(page.getByText('Nhiệt thật: 10 m')).toBeVisible();
});

test('resource inspector shows remembered quantity and an honest harvest plan flow',async({page})=>{
  await goTo(page,/Bản đồ/);
  await page.locator('.map-entity-marker[data-entity-id="MODELED-STONE-01"]').click();
  const inspector=page.locator('.entity-inspector:visible[data-entity-id="MODELED-STONE-01"]').first();
  await expect(inspector).toContainText('18 / 40 Đá');
  await expect(inspector).toContainText('Lượng lần cuối biết');
  await inspector.getByRole('button',{name:/Gửi đơn vị thu hoạch/}).click();
  const dialog=page.getByRole('dialog',{name:/Thu hoạch Đá nhô khỏi băng/});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button',{name:'10%'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'25%'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'50%'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'100%'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Tùy chỉnh'})).toBeVisible();
  await expect(dialog).toContainText('Không có đơn vị đang sống');
  await expect(dialog).toContainText('Chưa thể tiếp cận địa điểm này.');
  await expect(dialog.getByRole('button',{name:/Thu hoạch · Chưa khả dụng/})).toBeDisabled();
});

test('unit filters stay hidden until at least one race has living units',async({page})=>{
  await goTo(page,/Quân lực/);
  const filters=page.getByRole('group',{name:'Lọc đơn vị theo chủng tộc'});
  await expect(filters).toHaveCount(0);
  await expect(page.getByText('Chưa có đơn vị đang sống')).toBeVisible();
  await expect(page.getByText('Bộ lọc chủng tộc sẽ xuất hiện khi có đơn vị đang sống.')).toBeVisible();
});

test('placement creates reversible drafts without changing the starting buildings',async({page})=>{
  await goTo(page,/Lãnh địa/);
  const initial=await page.locator('.territory-building:not(.is-draft)[data-building-id^="SITE-LL01-"]').count();
  await page.getByRole('button',{name:/Thử bố trí Tháp cao/}).click();
  await expect(page.getByText(/Chạm mặt đất để đặt bản nháp/)).toBeVisible();
  const scene=page.locator('svg.territory-scene-svg');
  const box=await scene.boundingBox();
  expect(box).not.toBeNull();
  await scene.click({position:{x:box!.width*.52,y:box!.height*.52}});
  await expect(page.locator('.territory-draft-list')).toContainText('Tháp cao');
  await expect(page.locator('.territory-building:not(.is-draft)[data-building-id^="SITE-LL01-"]')).toHaveCount(initial);
  await page.getByRole('button',{name:/Xoay 90°/}).click();
  await expect(page.locator('.territory-placement-controls')).toContainText('hướng Đông');
  await page.locator('.territory-placement-controls').getByRole('button',{name:'Hủy'}).click();
  await expect(page.locator('.territory-draft-list')).toContainText('Tháp cao');
  await page.getByRole('button',{name:'Xóa tất cả'}).click();
  await expect(page.locator('.territory-draft-list')).toHaveCount(0);
});

test('territory drag distance follows the pointer instead of accumulating movement',async({page})=>{
  await goTo(page,/Lãnh địa/);
  const scene=page.locator('svg.territory-scene-svg');
  const fire=scene.locator('ellipse').first();
  await expect(fire).toBeVisible();
  const box=await scene.boundingBox();
  expect(box).not.toBeNull();
  const before={x:Number(await fire.getAttribute('cx')),y:Number(await fire.getAttribute('cy'))};
  const start={x:box!.x+box!.width*.35,y:box!.y+box!.height*.55};
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x+40,start.y+30,{steps:5});
  await page.mouse.up();
  await expect.poll(async()=>({x:Number(await fire.getAttribute('cx')),y:Number(await fire.getAttribute('cy'))})).toEqual({x:before.x+40,y:before.y+30});
});

test('catalog location action opens and focuses its known instance',async({page})=>{
  await goTo(page,/Công trình/);
  await page.getByRole('button',{name:'Đến công trình trong lãnh địa'}).click();
  await expect(page.getByRole('heading',{name:'Quản lý lãnh địa'})).toBeVisible();
  await expect(page.locator('.territory-building.is-selected[data-building-id="SITE-LL01-000"]')).toBeVisible();
});

test('map help separates body text from its heading',async({page})=>{
  await goTo(page,/Bản đồ/);
  const help=page.locator('.help-panel');
  await help.locator('summary').click();
  const spacing=await help.evaluate(node=>{
    const summary=node.querySelector('summary')!.getBoundingClientRect();
    const text=node.querySelector('p')!.getBoundingClientRect();
    return text.top-summary.bottom;
  });
  expect(spacing).toBeGreaterThanOrEqual(8);
});

test('planning mode keeps each footprint visible and labels only the focused building',async({page})=>{
  await goTo(page,/Lãnh địa/);
  await page.getByRole('button',{name:'Mặt bằng'}).click();
  await expect(page.locator('.territory-building:not(.is-draft)[data-building-id^="SITE-LL01-"]')).toHaveCount(4);
  await expect(page.locator('.territory-plan-mark')).toHaveCount(1);
});

test('territory controls fit portrait width and the 520-instance QA fixture is culled by viewport',async({page,isMobile})=>{
  test.skip(!isMobile,'portrait viewport and dense-QA framing check');
  await page.setViewportSize({width:390,height:844});
  await goTo(page,/Lãnh địa/);
  await page.locator('.territory-calibration > summary').click();
  await page.evaluate(()=>{
    type Sample={duration:number};
    const state=window as typeof window & {__territoryQaStarted?:number;__territoryQaTasks?:Sample[]};
    state.__territoryQaStarted=performance.now();state.__territoryQaTasks=[];
    if('PerformanceObserver' in window){const observer=new PerformanceObserver(entries=>{const target=(window as typeof window & {__territoryQaTasks?:Sample[]}).__territoryQaTasks;for(const entry of entries.getEntries())target?.push({duration:entry.duration});});try{observer.observe({type:'longtask',buffered:true});}catch{/* Optional timing API. */}}
  });
  await page.getByRole('button',{name:'Xem nhóm công trình minh họa'}).click();
  await expect(page.getByText('Đang hiển thị 520 / 520 công trình minh họa.')).toBeVisible();
  const qa=await page.evaluate(async()=>{
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    const state=window as typeof window & {__territoryQaStarted?:number;__territoryQaTasks?:Array<{duration:number}>};
    return {elapsed:Math.round(performance.now()-(state.__territoryQaStarted??performance.now())),longTasks:state.__territoryQaTasks??[],mounted:document.querySelectorAll('.territory-building').length};
  });
  const mountedBefore=await page.locator('.territory-building[data-building-id^="qa-dense-"]').count();
  console.log(`TERRITORY_QA viewport=390x844 fixture=520 elapsed_ms=${qa.elapsed} long_tasks=${qa.longTasks.length} max_long_task_ms=${Math.round(Math.max(0,...qa.longTasks.map(task=>task.duration))*10)/10} mounted_svg_instances=${qa.mounted} mounted_dense_instances=${mountedBefore}`);
  expect(mountedBefore).toBe(520);
  await page.getByRole('button',{name:/Về lửa trại/}).click();
  const cullingStatus=page.locator('.territory-calibration-info').getByText(/Đang hiển thị/);
  await expect(cullingStatus).toBeVisible();
  const mountedAfter=await page.locator('.territory-building[data-building-id^="qa-dense-"]').count();
  console.log(`TERRITORY_QA_RETURN viewport=390x844 mounted_dense_instances=${mountedAfter} status=${await cullingStatus.innerText()}`);
  expect(mountedAfter).toBeLessThan(520);
  expect(await page.locator('body').evaluate(node=>node.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({width:360,height:740});
  expect(await page.locator('body').evaluate(node=>node.scrollWidth)).toBeLessThanOrEqual(360);
});
