import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';
import {svgMapSource} from '../scripts/svg-map-source.mjs';

test('external SVG use renders only the target, preserves offsets and definitions, and tracks dependency revisions',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'map-svg-'));
 try{
  const master=join(dir,'master.svg'),layer=join(dir,'layer.svg');
  writeFileSync(master,'<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tone"><stop stop-color="#ff0000"/></linearGradient></defs><rect width="20" height="20" fill="#00ff00"/><g id="paint"><rect width="5" height="5" fill="url(#tone)"/></g></svg>');
  writeFileSync(layer,'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><use href="master.svg#paint" x="5" y="6"/></svg>');
  const first=svgMapSource(layer),png=new Resvg(first.svg).render().asPng(),{data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>Array.from(data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4));
  assert.deepEqual(pixel(0,0),[0,0,0,0],'unreferenced green background is excluded');assert.deepEqual(pixel(6,7),[255,0,0,255],'target offset and gradient survive');
  const previous=first.dependencies.get(master);writeFileSync(master,'<svg xmlns="http://www.w3.org/2000/svg"><g id="paint"><rect width="5" height="5" fill="#0000ff"/></g></svg>');assert.notEqual(svgMapSource(layer).dependencies.get(master),previous);
  writeFileSync(master,'<svg xmlns="http://www.w3.org/2000/svg"><use href="layer.svg#paint"/></svg>');assert.throws(()=>svgMapSource(layer),/cycle/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
