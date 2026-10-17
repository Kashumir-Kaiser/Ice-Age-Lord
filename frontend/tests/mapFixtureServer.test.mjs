import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {startMapFixtureServer} from '../scripts/map-fixture-server.mjs';
test('real HTTP clients decode gzip while transfer evidence counts encoded JSON and identity rasters',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'map-http-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));mkdirSync(join(directory,'assets'));
 const manifest={assets:Array.from({length:40},(_,id)=>({id,name:'snow-covered timber'}))},json=Buffer.from(JSON.stringify(manifest)),raster=Buffer.from([137,80,78,71,13,10,26,10]);
 writeFileSync(join(directory,'assets/manifest.json'),json);writeFileSync(join(directory,'assets/test.png'),raster);
 const transfers=[];let fixture;
 try{fixture=await startMapFixtureServer(directory,item=>transfers.push(item));}
 catch(error){if(!process.env.CI&&error.code==='EPERM'){t.skip('Local sandbox prohibits TCP bind; this check must execute in CI.');return;}throw error;}
 t.after(()=>fixture.close());
 const response=await fetch(fixture.origin+'/assets/manifest.json',{headers:{'accept-encoding':'gzip'}});
 assert.equal(response.status,200);assert.equal(response.headers.get('content-encoding'),'gzip');assert.deepEqual(await response.json(),manifest);
 assert.equal(transfers[0].bytes,gzipSync(json).length);assert.equal(transfers[0].decodedBytes,json.length);assert.ok(transfers[0].bytes<json.length);
 const image=await fetch(fixture.origin+'/assets/test.png');assert.equal(image.headers.get('content-encoding'),null);assert.deepEqual(Buffer.from(await image.arrayBuffer()),raster);assert.equal(transfers[1].bytes,raster.length);
 await fixture.close();await fixture.close();
});
