import type { EntityView, VisibleMap } from '../game/GameClient';

/** Explicit production-build QA fixture, only called by the separate demo map. */
export function qaWorldFixture(map:VisibleMap):VisibleMap {
  const query=new URLSearchParams(location.search);
  if(query.get('mapQA')!=='1'||query.get('mapFixture')!=='1023')return map;
  const camp=map.entities.find(entity=>entity.ref.id==='SITE-LL01-000');
  const count=1023-Number(Boolean(camp));
  const synthetic=Array.from({length:count},(_,i):EntityView=>({
    ref:{type:'site',id:`QA-KNOWN-${i}`},name:`QA ${i}`,label:`QA ${i}`,iconKind:'site',
    description:'Synthetic known marker for renderer stress testing.',status:'qa-only',provenance:'sample',
    knowledge:'current',currentSight:true,actions:[],x:((i%33)-16)*3000,y:(Math.floor(i/33)-15)*3000,
  }));
  return {...map,entities:camp?[camp,...synthetic]:synthetic,sight:[{x:0,y:0,clear:96000,fade:97000}],explored:[]};
}
