import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';

const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
/** Resolve an external use to its named element, retaining its definitions. */
export function svgMapSource(path,chain=[],dependencies=new Map()){
 path=resolve(path);if(chain.includes(path))throw new Error('SVG reference cycle: '+path);
 const bytes=readFileSync(path);dependencies.set(path,hash(bytes));
 const svg=bytes.toString('utf8').replace(/<use\b([^>]*?)(?:xlink:)?href=(["'])(.*?)\2([^>]*?)(?:\/>|>\s*<\/use>)/g,(match,before,quote,href,after)=>{
  if(href.startsWith('#'))return match;
  const [file,id]=href.split('#'),child=svgMapSource(resolve(dirname(path),file),[...chain,path],dependencies).svg;
  const prefix='mapref-'+hash(Buffer.from(child)).slice(0,12)+'-';
  if(id&&!child.includes('id="'+id+'"')&&!child.includes("id='"+id+"'"))throw new Error('Missing SVG reference '+href);
  let content=child.replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  if(!id)return `<g ${before} ${after}>${content}</g>`;
  content=content.replace(/\bid=(["'])(.*?)\1/g,(_,q,value)=>`id=${q}${prefix}${value}${q}`)
   .replace(/url\(#([^)]*)\)/g,(_,value)=>`url(#${prefix}${value})`)
   .replace(/((?:xlink:)?href=)(["'])#(.*?)\2/g,(_,attribute,q,value)=>`${attribute}${q}#${prefix}${value}${q}`);
  return `<defs>${content}</defs><use ${before} href="#${prefix}${id}" ${after}/>`;
 });
 return {svg,dependencies};
}
