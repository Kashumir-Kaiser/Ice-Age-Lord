import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const territoryScene = readFileSync(new URL('../src/territory/TerritoryScene.tsx', import.meta.url), 'utf8');
const buildingSprite = readFileSync(new URL('../src/territory/BuildingSprite.tsx', import.meta.url), 'utf8');

test('dense QA fixture is rendered by MapRenderer in every mode and its duplicate SVG overlay is planning-only', () => {
  assert.match(
    territoryScene,
    /const visibleQa=useMemo\(\(\)=>denseQa&&effectiveMode==='planning'\?denseFixture\.filter\(item=>onScreen\(\{x:origin\.x\+item\.x,y:origin\.y\+item\.y\}\)\):\[\],\[denseQa,effectiveMode,denseFixture,origin\.x,origin\.y,activeCamera,size\.width,size\.height\]\);/,
  );
  assert.match(
    territoryScene,
    /const renderDrafts=useMemo\(\(\)=>\[\.\.\.drafts,\.\.\.\(denseQa\?denseFixture:\[\]\)/,
  );
  assert.match(territoryScene, /<MapCanvas snapshot=\{renderSnapshot\}/);
  assert.match(buildingSprite, /qaFixture&&mode!=='planning'/);
});
