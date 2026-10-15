import type { EntityView, VisibleMap } from '../game/GameClient';
import { CANONICAL_SITES } from '../canonicalGeography.ts';
import type { SharedMapCamera } from '../map/camera';

export const MAP_QA_FIXTURES = ['1023','populated12','overlap','local-camp','local-forest','local-stone','local-water','unknown-fog'] as const;
export type MapQaFixture = typeof MAP_QA_FIXTURES[number];

export function requestedMapQaFixture(): MapQaFixture | null {
  if (typeof location === 'undefined') return null;
  const query = new URLSearchParams(location.search);
  if (query.get('mapQA') !== '1') return null;
  const fixture = query.get('mapFixture');
  return MAP_QA_FIXTURES.find(candidate => candidate === fixture) ?? null;
}

/** Deterministic demo-only camera/time states for map visual QA. */
export function mapQaInitialState(camera: SharedMapCamera, clockSeconds: number, fixture: MapQaFixture | null): {camera: SharedMapCamera; clockSeconds: number} {
  if (!fixture || fixture === '1023' || fixture === 'populated12' || fixture === 'overlap') return {camera, clockSeconds};
  if (fixture === 'local-camp') return {camera:{...camera,mode:'local',local:{x:0,y:0,zoom:1}},clockSeconds};
  if (fixture === 'unknown-fog') return {
    camera: {...camera, mode:'local', local:{x:-14500,y:9000,zoom:172/5000}},
    clockSeconds:19*3600,
  };
  const siteId = fixture === 'local-forest' ? 'SITE-LL01-040' : fixture === 'local-stone' ? 'SITE-LL01-041' : 'SITE-LL01-042';
  const site = CANONICAL_SITES.find(candidate => candidate.id === siteId);
  if (!site) return {camera, clockSeconds};
  return {camera:{...camera,mode:'local',local:{x:site.x,y:-site.y,zoom:172/5000}},clockSeconds};
}

export function mapQaCenterKm(fixture: MapQaFixture | null): string | undefined {
  if (!fixture || !fixture.startsWith('local-')) return undefined;
  if (fixture === 'local-camp') return '0.0,0.0';
  const siteId = fixture === 'local-forest' ? 'SITE-LL01-040' : fixture === 'local-stone' ? 'SITE-LL01-041' : 'SITE-LL01-042';
  const site = CANONICAL_SITES.find(candidate => candidate.id === siteId);
  return site ? `${(site.x/1000).toFixed(1)},${(site.y/1000).toFixed(1)}` : undefined;
}

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
