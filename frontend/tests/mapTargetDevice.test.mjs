import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmarkHeadlessMode,isVerifiedIntelUhd620,selectWebGLAdapterInfo} from '../scripts/map-target-device.mjs';

test('benchmark remains headless by default and opts into headed mode explicitly',()=>{
 assert.equal(benchmarkHeadlessMode(undefined),true);
 assert.equal(benchmarkHeadlessMode('true'),true);
 assert.equal(benchmarkHeadlessMode('false'),false);
});

test('WebGL adapter capture prefers unmasked values and falls back to masked values',()=>{
 assert.deepEqual(selectWebGLAdapterInfo({
  unmaskedVendor:'Intel Inc.',unmaskedRenderer:'Intel(R) UHD Graphics 620',
  maskedVendor:'WebKit',maskedRenderer:'WebGL Renderer',
 }),{vendor:'Intel Inc.',renderer:'Intel(R) UHD Graphics 620',vendorSource:'unmasked',rendererSource:'unmasked'});
 assert.deepEqual(selectWebGLAdapterInfo({
  unmaskedVendor:null,unmaskedRenderer:null,maskedVendor:'Intel',maskedRenderer:'Intel UHD Graphics 620',
 }),{vendor:'Intel',renderer:'Intel UHD Graphics 620',vendorSource:'masked',rendererSource:'masked'});
});

test('Intel UHD Graphics 620 is verified only in headed non-software mode',()=>{
 assert.equal(isVerifiedIntelUhd620({headless:false,vendor:'Intel Inc.',renderer:'Intel(R) UHD Graphics 620'}),true);
 assert.equal(isVerifiedIntelUhd620({headless:true,vendor:'Intel Inc.',renderer:'Intel(R) UHD Graphics 620'}),false);
 assert.equal(isVerifiedIntelUhd620({headless:false,vendor:'Google Inc. (Intel)',renderer:'ANGLE (Intel, Intel(R) UHD Graphics 620 via SwiftShader)'}),false);
 assert.equal(isVerifiedIntelUhd620({headless:false,vendor:'NVIDIA Corporation',renderer:'NVIDIA GeForce RTX 4060'}),false);
 assert.equal(isVerifiedIntelUhd620({headless:false,vendor:'',renderer:''}),false);
});
