import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const territoryScene = readFileSync(new URL('../src/territory/TerritoryScene.tsx', import.meta.url), 'utf8');
const buildingSprite = readFileSync(new URL('../src/territory/BuildingSprite.tsx', import.meta.url), 'utf8');

test('dense QA fixture keeps viewport count in every mode while duplicate SVG overlay is planning-only', () => {
  assert.match(
    territoryScene,
    /const visibleQa=useMemo\(\(\)=>denseQa\?denseFixture\.filter\(item=>onScreen\(\{x:origin\.x\+item\.x,y:origin\.y\+item\.y\}\)\):\[\],\[denseQa,denseFixture,origin\.x,origin\.y,activeCamera,size\.width,size\.height\]\);/,
  );
  assert.match(territoryScene, /<span>Đang hiển thị \{visibleQa\.length\} \/ \{denseQa\?520:0\} công trình minh họa\.<\/span>/);
  assert.match(territoryScene, /const renderedQa=useMemo\(\(\)=>effectiveMode==='planning'\?visibleQa:\[\],\[effectiveMode,visibleQa\]\);/);
  assert.match(territoryScene, /\{denseQa&&renderedQa\.map\(/);
  assert.match(
    territoryScene,
    /const renderDrafts=useMemo\(\(\)=>\[\.\.\.drafts,\.\.\.\(denseQa\?denseFixture:\[\]\)/,
  );
  assert.match(territoryScene, /<MapCanvas snapshot=\{renderSnapshot\}/);
  assert.match(buildingSprite, /qaFixture&&mode!=='planning'/);
});
