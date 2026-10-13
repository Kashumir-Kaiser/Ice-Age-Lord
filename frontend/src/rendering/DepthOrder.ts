export type Bounds = {minX:number;minY:number;maxX:number;maxY:number};
export type DepthObject = {id:string;depth:number;bounds:Bounds;footprint:Bounds};
export const intersects=(a:Bounds,b:Bounds)=>a.minX<=b.maxX&&a.maxX>=b.minX&&a.minY<=b.maxY&&a.maxY>=b.minY;
/** Spatial broad phase: only projected neighbors enter pairwise comparisons. */
export function depthOrder<T extends DepthObject>(objects: readonly T[]): {objects:T[];cycles:string[];comparisons:number} {
  const buckets=new Map<string,number[]>(),pairs=new Set<string>();
  const edges=objects.map(()=>new Set<number>()),incoming=new Uint32Array(objects.length);
  const side=128;
  for(let i=0;i<objects.length;i++){
    const b=objects[i].bounds;
    const x0=Math.floor(b.minX/side),x1=Math.floor(b.maxX/side),y0=Math.floor(b.minY/side),y1=Math.floor(b.maxY/side);
    // Canvas-sized clipped bounds avoid unbounded buckets at extreme zoom.
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const k=x+':'+y,neighbors=buckets.get(k)??[];
      for(const j of neighbors){const key=j+':'+i;if(pairs.has(key))continue;pairs.add(key);
        if(!intersects(objects[j].bounds,b))continue;
        const a=objects[j].footprint,c=objects[i].footprint;
        // In this projection +X is toward viewer; +Y is away from viewer.
        const jBehind=(a.maxX<=c.minX||a.minY>=c.maxY);
        const iBehind=(c.maxX<=a.minX||c.minY>=a.maxY);
        if(jBehind!==iBehind){const from=jBehind?j:i,to=jBehind?i:j;edges[from].add(to);incoming[to]++;}
      }
      neighbors.push(i);buckets.set(k,neighbors);
    }
  }
  const stable=(a:number,b:number)=>objects[a].depth-objects[b].depth||objects[a].id.localeCompare(objects[b].id);
  const ready=objects.map((_,i)=>i).filter(i=>incoming[i]===0).sort(stable),ordered:T[]=[];
  while(ready.length){const i=ready.shift()!;ordered.push(objects[i]);for(const j of edges[i])if(--incoming[j]===0){ready.push(j);ready.sort(stable);}}
  const cycles=objects.filter((_,i)=>incoming[i]>0).map(o=>o.id);
  // Expose cycles explicitly for authored slices; a deterministic degraded order is never a QA pass.
  if(cycles.length)ordered.push(...objects.filter((_,i)=>incoming[i]>0).sort((a,b)=>a.depth-b.depth||a.id.localeCompare(b.id)));
  return {objects:ordered,cycles,comparisons:pairs.size};
}
