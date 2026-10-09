import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const code=readFileSync(join(root,'src/demoClock.ts'),'utf8');
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const clock=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('speed selection includes frozen and the three named rates plus bounded custom',()=>{
  assert.deepEqual(clock.DISPLAY_SPEEDS,['Frozen','1x','2x','5x','Custom']);
  assert.equal(clock.speedMultiplier('Frozen',200),0);
  assert.equal(clock.speedMultiplier('1x',200),1);
  assert.equal(clock.speedMultiplier('2x',200),2);
  assert.equal(clock.speedMultiplier('5x',200),5);
  assert.equal(clock.speedMultiplier('Custom',2.5),2.5);
  assert.equal(clock.speedMultiplier('Custom',100000),3600);
  assert.equal(clock.speedMultiplier('Custom',0),.1);
});
test('elapsed time advances the view clock only by speed multiplier, without a simulation action',()=>{
  const start=clock.INITIAL_CLOCK_SECONDS;
  assert.equal(start,7*3600);
  assert.equal(clock.advanceDisplayClock(start,1000,0),start);
  assert.equal(clock.advanceDisplayClock(start,1000,1),start+1);
  assert.equal(clock.advanceDisplayClock(start,1000,2),start+2);
  assert.equal(clock.advanceDisplayClock(start,1000,5),start+5);
  assert.equal(clock.advanceDisplayClock(start,2000,120),start+240);
  assert.throws(()=>clock.advanceDisplayClock(start,-10,1),RangeError);
  assert.throws(()=>clock.advanceDisplayClock(start,2000,Number.NaN),RangeError);
});
test('display clock is zero-padded, with day count rollover',()=>{
  assert.equal(clock.displayClock(25200),'07:00:00');
  assert.equal(clock.displayClock(25325),'07:02:05');
  assert.equal(clock.displayClock(86400),'00:00:00');
  assert.equal(clock.displayDay(86400),2);
  assert.equal(clock.displayDay(25200),1);
});
