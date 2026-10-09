import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(join(root,'../references/canonical/LORD-DND-03.md'),'utf8');
const fireSource=readFileSync(join(root,'../references/canonical/LORD-DND-01.md'),'utf8');
const load=async file=>{
  const body=readFileSync(join(root,'src/'+file),'utf8');
  const code=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
};
const geo=await load('canonicalGeography.ts');
const map=await load('mapModel.ts');
const between=(body,a,b)=>body.split(a)[1]?.split(b)[0]??'';
const rows=lines=>lines.split('\n').filter(line=>line.startsWith('| `'));
const metres=tuple=>(tuple.match(/\((.*?)\)/)?.[1]??'').split(';').map(x=>Math.round(Number(x.replace(',','.'))*1000));

test('entire canonical site table agrees with WORLD-PACKAGE-LL01-1.0',()=>{
  const records=rows(between(source,'<!-- LL01-SITES-BEGIN -->','<!-- LL01-SITES-END -->'));
  assert.equal(records.length,38);
  for(const line of records){
    const fields=line.split('|').map(s=>s.trim());
    const id=fields[1].replaceAll('`','');
    const name=fields[2];
    const coords=metres(fields[3]);
    const site=geo.CANONICAL_SITES.find(site=>site.id===id);
    assert.ok(site,'missing source site '+id);
    assert.equal(site.name,name,id+' name');
    assert.deepEqual([site.x,site.y,site.z*1000],coords,id+' coordinates');
  }
});
test('all ten canonical player anchor positions remain exact',()=>{
  const records=rows(between(source,'<!-- LL01-ANCHORS-BEGIN -->','<!-- LL01-ANCHORS-END -->'));
  assert.equal(records.length,10);
  for(const line of records){
    const fields=line.split('|').map(s=>s.trim());
    const id=fields[2].replaceAll('`','');
    const tuple=metres(fields[3]);
    const found=geo.CANONICAL_ANCHORS.find(x=>x.id===id);
    assert.ok(found,id);assert.deepEqual([found.x,found.y],tuple,id);
  }
});
test('all 41 chest cache center coordinates agree with sealed source',()=>{
  const records=rows(between(source,'<!-- LL01-CHESTS-BEGIN -->','<!-- LL01-CHESTS-END -->'));
  assert.equal(records.length,41);
  for(const line of records){
    const fields=line.split('|').map(s=>s.trim());
    const id=fields[1].replaceAll('`','');
    const found=geo.CANONICAL_CHEST_CACHES.find(x=>x.id===id);
    assert.ok(found,id);
    assert.deepEqual([found.x,found.y],metres(fields[3]),id);
  }
});
test('all thirty firelight radii agree with canonical FireLevel 1–30 registry',()=>{
  const fragment=fireSource.split('### `SURVIVAL-FIRE-PROGRESSION-2.0`')[1];
  assert.ok(fragment,'canonical fire progression block present');
  const records=fragment.split('\n').filter(line=>/^\|\s*(?:[1-9]|[12][0-9]|30)\s*\|/.test(line)).slice(0,30);
  assert.equal(records.length,30);
  for(const line of records){
    const fields=line.split('|').map(s=>s.trim());
    const level=Number(fields[1]);
    const profile=fields[4];
    const radius=profile.match(/\bR\s*([\d.,]+)\s*m\b/);
    const diameter=profile.match(/\bD\s*(?:tối đa\s*)?([\d.,]+)\s*km\b/);
    assert.ok(radius||diameter,'no source radius '+level);
    const expected=radius?Number(radius[1].replace(',','.')):Number(diameter[1].replace(',','.'))*500;
    assert.equal(map.heatRadiusM(level),expected,`source radius mismatch at FireLevel ${level}`);
  }
});
