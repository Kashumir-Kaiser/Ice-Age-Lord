import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import ts from 'typescript';
import {QUALITY} from '../src/rendering/mapStyle.ts';
registerHooks({load(url,context,nextLoad){if(url.startsWith('file:')&&url.endsWith('.ts'))return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};return nextLoad(url,context);}});
const {MapRenderer}=await import('../src/rendering/MapRenderer.ts');
test('invalidating during a rendered frame preserves follow-up work without scheduling a second animation loop',()=>{
 const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame},callbacks=new Map();let serial=0;
 globalThis.requestAnimationFrame=callback=>{callbacks.set(++serial,callback);return serial;};globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
 const renderer=new MapRenderer({width:1,height:1,removeEventListener(){}},{identity:'schedule-test',projection:'territory',camera:{x:0,y:0,zoom:1},buildings:[],entities:[],mode:'normal',world:false,revision:0},()=>{},true);
 try{
  renderer.terrain.process=()=>false;renderer.terrain.request(0,0,0);let renders=0;renderer.render=()=>{if(++renders===1)renderer.invalidate();};
  const tick=time=>{const [id,callback]=callbacks.entries().next().value;callbacks.delete(id);callback(time);};
  renderer.invalidate();assert.equal(callbacks.size,1);tick(100);assert.equal(callbacks.size,1,'pending terrain and in-frame invalidation share one scheduled callback');
  renderer.terrain.clearQueued();tick(200);assert.equal(renders,2,'in-frame invalidation is not erased by the first render');assert.equal(callbacks.size,0);assert.equal(renderer.metrics.data.activeLoops,0);
 }finally{renderer.destroy();for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
test('framebuffers are included in admission budgets and oversized viewports reduce raster resolution',()=>{
 const previous=globalThis.devicePixelRatio;globalThis.devicePixelRatio=2;
 const renderer=new MapRenderer({width:1,height:1,removeEventListener(){}},{identity:'budget-test',projection:'territory',camera:{x:0,y:0,zoom:1},buildings:[],entities:[],mode:'normal',world:false,revision:0},()=>{});
 const oldRaf=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
 try{
  for(const quality of ['normal','low']){renderer.configure(quality,true);renderer.resize({width:3840,height:2160});const targets=renderer.renderTargetBytes();assert.ok(renderer.renderDpr<=QUALITY[quality].dpr);assert.ok(targets<=QUALITY[quality].totalBytes*.2+1);assert.ok(renderer.assets.limit+renderer.terrain.limit+targets<=QUALITY[quality].totalBytes);}
 }finally{renderer.destroy();for(const [key,value] of Object.entries({devicePixelRatio:previous,requestAnimationFrame:oldRaf,cancelAnimationFrame:oldCancel}))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
