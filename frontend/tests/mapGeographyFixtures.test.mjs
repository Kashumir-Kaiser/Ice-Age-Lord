import test from 'node:test';
import assert from 'node:assert/strict';
import { mapQaAnchorKm, mapQaCenterKm, mapQaFixtureProvenance, mapQaInitialState, qaKnownGeographyFixture, requestedMapQaFixture } from '../src/rendering/mapFixtures.ts';

function setSearch(search) {
  Object.defineProperty(globalThis,'location',{configurable:true,value:{search}});
}

const map = () => ({
  revision:0,
  discoveryIds:['site:SITE-LL01-000'],
  entities:[],
  developerEntities:[],
  sight:[{x:0,y:0,clear:10,fade:20}],
  explored:[],
  terrain:{forest:{x:4700,y:-6800},stone:{x:-7800,y:-4700},water:{x:8900,y:-11200}},
});

test('water shoreline fixture separates canonical anchor from its east-edge camera',()=>{
  const originalLocation=globalThis.location;
  try {
    setSearch('?mode=demo&mapQA=1&mapFixture=local-water');
    const fixture=requestedMapQaFixture();
    const camera={mode:'local',local:{x:0,y:0,zoom:1},world:{x:0,y:0,zoom:.001}};
    const state=mapQaInitialState(camera,420*60,fixture);
    assert.deepEqual(state.camera.local,{x:10700,y:11200,zoom:.4});
    assert.equal(mapQaAnchorKm(fixture),'8.9,-11.2');
    assert.equal(mapQaCenterKm(fixture),'10.7,-11.2');
  } finally {
    if(originalLocation===undefined)delete globalThis.location;
    else Object.defineProperty(globalThis,'location',{configurable:true,value:originalLocation});
  }
});

test('local geography fixtures are explicit DEMO-only synthetic projections',()=>{
  const originalLocation=globalThis.location;
  try {
    setSearch('?mode=live&mapQA=1&mapFixture=local-forest');
    assert.equal(requestedMapQaFixture(),null,'a non-DEMO route cannot activate synthetic regional knowledge');

    setSearch('?mapQA=1&mapFixture=populated12');
    assert.equal(requestedMapQaFixture(),'populated12','existing QA fixtures keep their existing URL contract');

    setSearch('?mode=demo&mapQA=1&mapFixture=local-forest');
    const fixture=requestedMapQaFixture();
    assert.equal(fixture,'local-forest');
    assert.equal(mapQaFixtureProvenance(fixture),'demo-qa-known-geography-fixture');
    const source=map();
    const projected=qaKnownGeographyFixture(source,fixture);
    assert.notEqual(projected,source);
    assert.deepEqual(source.discoveryIds,['site:SITE-LL01-000'],'QA projection must not mutate discovery state');
    assert.deepEqual(source.entities,[],'QA projection must not mutate the supplied entity array');
    assert.deepEqual(projected.discoveryIds,source.discoveryIds,'synthetic fixtures never become discovery IDs');
    assert.equal(projected.entities.length,1);
    assert.deepEqual(projected.entities[0],{
      ref:{type:'resource',id:'QA-GEO-FOREST'},
      name:'DEMO · QA vùng rừng',label:'DEMO · vùng rừng',iconKind:'wood',
      description:'Mốc địa hình tổng hợp chỉ dùng cho QA DEMO tại một điểm địa hình đã đăng ký; không phải địa điểm đã khám phá, được lưu hoặc có thể hành động.',
      status:'DEMO · Mẫu địa hình QA',provenance:'sample',knowledge:'current',currentSight:true,
      x:4700,y:-6800,actions:[{action:'inspect',enabled:false,reason:'Mẫu QA; không có hành động trong game.'}],
    });
    assert.deepEqual(projected.sight,[{x:4700,y:-6800,clear:2200,fade:3000}]);
    assert.equal(projected.terrain,source.terrain,'the renderer keeps its existing authored geography source');
  } finally {
    if(originalLocation===undefined)delete globalThis.location;
    else Object.defineProperty(globalThis,'location',{configurable:true,value:originalLocation});
  }
});
