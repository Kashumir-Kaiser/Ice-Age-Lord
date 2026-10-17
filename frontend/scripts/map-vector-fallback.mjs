import sharp from 'sharp';

/** Convert a registered RGBA composite into deterministic pixel paths. */
export async function registeredCompositeVectorFallback(composite, width, height) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width%2||height%2)throw new Error('Vector fallback canvas dimensions must be positive even integers');
  const low = await sharp(composite).resize(Math.floor(width / 2), Math.floor(height / 2), {kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {data: original, info} = low;
  const opaque = Buffer.from(original);
  for (let i=3;i<opaque.length;i+=4) opaque[i]=255;
  const palettePng = await sharp(opaque,{raw:info}).png({palette:true,colours:128,dither:0,effort:10}).toBuffer();
  const {data: paletteRgb} = await sharp(palettePng).removeAlpha().ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const rgba=Buffer.from(paletteRgb);
  for (let i=0;i<rgba.length;i+=4) rgba[i+3]=original[i+3];

  const groups=new Map();
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;) {
    const i=(y*info.width+x)*4,a=rgba[i+3];
    if(!a){x++;continue;}
    const color=`${rgba[i]},${rgba[i+1]},${rgba[i+2]},${a}`;
    let end=x+1;
    for(;end<info.width;end++){
      const j=(y*info.width+end)*4;
      if(rgba[j]!==rgba[i]||rgba[j+1]!==rgba[i+1]||rgba[j+2]!==rgba[i+2]||rgba[j+3]!==a)break;
    }
    if(!groups.has(color))groups.set(color,[]);
    groups.get(color).push(`M${x*2} ${y*2}h${(end-x)*2}v2h-${(end-x)*2}z`);
    x=end;
  }
  const paths=[...groups].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([color,runs])=>{
    const [r,g,b,a]=color.split(',').map(Number);
    return `<path fill="#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}" fill-opacity="${(a/255).toFixed(8)}" d="${runs.join('')}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><g>${paths}</g></svg>`;
}
