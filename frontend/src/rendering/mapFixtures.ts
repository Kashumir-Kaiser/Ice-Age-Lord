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
  // The geography anchors below are explicit synthetic discoveries for visual
  // QA only. Keep them unavailable on every route except the demo preview.
  if (fixture && fixture.startsWith('local-') && fixture !== 'local-camp' && query.get('mode') !== 'demo') return null;
  return MAP_QA_FIXTURES.find(candidate => candidate === fixture) ?? null;
}

const QA_GEOGRAPHY = {
  'local-forest': { siteId:'SITE-LL01-040', id:'QA-GEO-FOREST', iconKind:'wood' },
  'local-stone': { siteId:'SITE-LL01-041', id:'QA-GEO-STONE', iconKind:'stone' },
  'local-water': { siteId:'SITE-LL01-042', id:'QA-GEO-WATER', iconKind:'water' },
} as const;

export function mapQaFixtureProvenance(fixture: MapQaFixture | null): string | undefined {
  return fixture && fixture in QA_GEOGRAPHY ? 'demo-qa-known-geography-fixture'
    : fixture ? 'demo-visible-snapshot' : undefined;
}

export function mapQaFixtureKnownId(fixture: MapQaFixture | null): string | undefined {
  return fixture && fixture in QA_GEOGRAPHY ? QA_GEOGRAPHY[fixture as keyof typeof QA_GEOGRAPHY].id : undefined;
}

/** Synthetic, visible geography for three named QA anchors. Never changes the
 * DEMO client's discovery projection or any persisted/game state. */
export function qaKnownGeographyFixture(map: VisibleMap, fixture: MapQaFixture | null): VisibleMap {
  if (!fixture || !(fixture in QA_GEOGRAPHY)) return map;
  const spec = QA_GEOGRAPHY[fixture as keyof typeof QA_GEOGRAPHY];
  const site = CANONICAL_SITES.find(candidate => candidate.id === spec.siteId);
  if (!site) return map;
  const regionName = spec.iconKind === 'wood' ? 'vùng rừng' : spec.iconKind === 'stone' ? 'vùng đá' : 'vùng nước';
  const entity: EntityView = {
    ref:{type:'resource',id:spec.id},
    name:`DEMO · QA ${regionName}`,
    label:`DEMO · ${regionName}`,
    iconKind:spec.iconKind,
    description:'Mốc địa hình tổng hợp chỉ dùng cho QA DEMO tại một điểm địa hình đã đăng ký; không phải địa điểm đã khám phá, được lưu hoặc có thể hành động.',
    status:'DEMO · Mẫu địa hình QA',
    provenance:'sample',
    knowledge:'current',
    currentSight:true,
    x:site.x,
    y:site.y,
    actions:[{action:'inspect',enabled:false,reason:'Mẫu QA; không có hành động trong game.'}],
  };
  const sight={x:site.x,y:site.y,clear:2200,fade:3000};
  return {
    ...map,
    entities:[...map.entities.filter(item=>item.ref.id!==spec.id),entity],
    sight:[sight],
  };
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
  if (fixture === 'local-water') return {
    camera:{...camera,mode:'local',local:{x:10_700,y:11_200,zoom:.4}},
    clockSeconds,
  };
  return {camera:{...camera,mode:'local',local:{x:site.x,y:-site.y,zoom:172/5000}},clockSeconds};
}

export function mapQaCenterKm(fixture: MapQaFixture | null): string | undefined {
  if (!fixture || !fixture.startsWith('local-')) return undefined;
  if (fixture === 'local-camp') return '0.0,0.0';
  if (fixture === 'local-water') return '10.7,-11.2';
  const siteId = fixture === 'local-forest' ? 'SITE-LL01-040' : fixture === 'local-stone' ? 'SITE-LL01-041' : 'SITE-LL01-042';
  const site = CANONICAL_SITES.find(candidate => candidate.id === siteId);
  return site ? `${(site.x/1000).toFixed(1)},${(site.y/1000).toFixed(1)}` : undefined;
}

/** Canonical anchor is recorded separately from the camera center; the
 * water shoreline QA view intentionally pans east to expose the ice edge. */
export function mapQaAnchorKm(fixture: MapQaFixture | null): string | undefined {
  if (!fixture || !(fixture in QA_GEOGRAPHY)) return undefined;
  const spec=QA_GEOGRAPHY[fixture as keyof typeof QA_GEOGRAPHY];
  const site=CANONICAL_SITES.find(candidate=>candidate.id===spec.siteId);
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
