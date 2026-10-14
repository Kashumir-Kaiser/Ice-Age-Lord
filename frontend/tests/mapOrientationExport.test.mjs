import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {orientationCanvas} from '../scripts/map-orientation-export.mjs';
import {orientationAsset,spriteRect} from '../src/rendering/SpriteRegistration.ts';
import {pointInPolygon} from '../src/rendering/MapPicking.ts';

test('authored views retain logical registration and source bytes while providing their own silhouette',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'map-orientation-'));
 try{
  const reference=join(dir,'reference.png'),source=join(dir,'view.png');
  await sharp({create:{width:120,height:100,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:80,height:78,channels:4,background:'#607d89'}}).png().toBuffer(),left:20,top:14}]).png().toFile(reference);
  await sharp({create:{width:160,height:160,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:110,height:95,channels:4,background:'#665348'}}).png().toBuffer(),left:25,top:40}]).png().toFile(source);
  const before=readFileSync(source),asset={logicalCanvas:{width:480,height:400},groundAnchor:{x:.5,y:.82},trimOffset:{x:0,y:0},artFootprint:[[.16,.72],[.5,.9],[.84,.72],[.5,.54]],compatiblePhysicalFootprint:{widthM:4,depthM:4},occlusionRegion:{upper:[]}};
  const painted=await orientationCanvas(source,reference,asset);assert.equal(painted.width,480);assert.equal(painted.height,400);assert.deepEqual(readFileSync(source),before);
  assert.ok(painted.hitPolygon.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1));assert.equal(pointInPolygon({x:0,y:0},painted.hitPolygon.map(([x,y])=>({x,y}))),false);
  const turned=orientationAsset({...asset,orientationRegions:{east:{hitPolygon:painted.hitPolygon,upper:painted.hitPolygon}}},'east');
  for(const scale of [.001,1,3,6])assert.deepEqual(spriteRect(turned,{x:113,y:217},scale),spriteRect(asset,{x:113,y:217},scale),'orientation changes picking, not scale or anchor');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
