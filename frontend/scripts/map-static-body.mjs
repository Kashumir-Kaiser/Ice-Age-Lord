/** Map-only vector exclusion; all artwork outside authored unsupported VFX stays intact. */
export function staticMapBody(svg,canvas,polygons){
 if(!polygons.length||polygons.some(p=>p.length<3||p.some(v=>v.length!==2||!v.every(Number.isFinite)||v[0]<0||v[1]<0||v[0]>canvas.width||v[1]>canvas.height)))throw new Error('Invalid static map-body exclusion');
 const holes=polygons.map(p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z').join('');
 const path=`M0 0H${canvas.width}V${canvas.height}H0Z${holes}`;
 return svg.replace(/<svg\b[^>]*>/,root=>root+`<defs><clipPath id="map-static-body"><path d="${path}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#map-static-body)">`).replace(/<\/svg>\s*$/,'</g></svg>');
}
