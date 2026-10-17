import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
/** Real HTTP decoding is required: route.fulfill does not emulate compressed wire bodies. */
export async function startMapFixtureServer(directory,onResponse=()=>{}){
 const root=resolve(directory);
 const server=createServer((request,response)=>{
  try{
   const relative=new URL(request.url,'http://fixture.local').pathname.replace(/^\//,'')||'index.html',path=resolve(root,relative);
   if(!path.startsWith(root+sep)){response.writeHead(404).end();return;}
   const body=readFileSync(path),extension=extname(path),textual=['.html','.js','.css','.json','.svg'].includes(extension),compressed=textual?gzipSync(body):body;
   const gzip=textual&&(request.headers['accept-encoding']??'').includes('gzip'),served=gzip?compressed:body;
   response.writeHead(200,{'content-type':(mime[extension]??'application/octet-stream')+(textual?'; charset=utf-8':''),'content-length':served.length,'cache-control':'no-store',...(gzip?{'content-encoding':'gzip'}:{})});
   const head=request.method==='HEAD';response.end(head?undefined:served);
   onResponse({path:relative,bytes:head?0:served.length,decodedBytes:body.length,gzipBytes:compressed.length,encoding:gzip?'gzip':'identity'});
  }catch{if(!response.headersSent)response.writeHead(404);response.end('Not found');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve();});});
 server.unref();let closing;
 return {origin:`http://127.0.0.1:${server.address().port}`,close(){return closing??=(new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));}};
}
