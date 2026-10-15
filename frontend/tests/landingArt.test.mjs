import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const artwork=readFileSync(new URL('../public/menu-frostbound-citadel.webp',import.meta.url));
const css=readFileSync(new URL('../src/landing/landing.css',import.meta.url),'utf8');
const landing=readFileSync(new URL('../src/landing/LandingPage.tsx',import.meta.url),'utf8');

test('main menu uses a committed, optimized original WebP landscape',()=>{
 assert.ok(artwork.length>40000&&artwork.length<200000,'visual should be detailed yet fast to transfer');
 assert.equal(artwork.toString('ascii',0,4),'RIFF');
 assert.equal(artwork.toString('ascii',8,12),'WEBP');
 assert.match(css,/\.frozen-menu__scene\s*\{[^}]*menu-frostbound-citadel\.webp/s);
 assert.match(css,/\.live-start-page\s*\{[^}]*menu-frostbound-citadel\.webp/s);
 assert.match(css,/\.frozen-menu__veils\s*\{/);
 assert.match(css,/@media \(max-width:770px\)/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
});

test('new game, load save, and QA-only demo keep independent callbacks',()=>{
 assert.match(landing,/data-testid="menu-new-game"/);
 assert.match(landing,/onClick=\{onNewGame\}/);
 assert.match(landing,/data-testid="menu-load-save"/);
 assert.match(landing,/onClick=\{onLoadSave\}/);
 assert.match(landing,/demoEnabled &&/);
 assert.match(landing,/onClick=\{onDemo\}/);
});
