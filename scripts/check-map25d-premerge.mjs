#!/usr/bin/env node
/**
 * Read-only integration readiness audit for codex/live-demo-parity and
 * codex/map-25d-overhaul. Does not fetch, checkout, cherry-pick, merge,
 * rebase, commit, move refs, or write into the working tree.
 *
 * Usage from repository root:
 *   git fetch origin codex/live-demo-parity codex/map-25d-overhaul
 *   node scripts/check-map25d-premerge.mjs
 * Optional: PARITY_REF=... MAP25D_REF=... node scripts/check-map25d-premerge.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const parity = process.env.PARITY_REF || 'origin/codex/live-demo-parity';
const map = process.env.MAP25D_REF || 'origin/codex/map-25d-overhaul';

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function splitZ(text) { return text.split('\0').filter(Boolean); }
function pathsSince(base, ref) {
  return new Set(splitZ(git('diff', '--name-only', '-z', '--diff-filter=ACDMRT', base, ref)));
}
function fileAt(ref, path) {
  try { return git('show', `${ref}:${path}`); }
  catch { return null; }
}
function ownership(path) {
  if (/^frontend\/src\/(?:LiveApp\.tsx|live\/|shared\/|landing\/)/.test(path) ||
      /^packages\/(?:sim\/src\/view\.ts|contracts\/src\/index\.ts)/.test(path)) return 'KEEP_PLAYER_UI';
  if (/^frontend\/src\/rendering\//.test(path) ||
      /^frontend\/src\/(?:assets\/assetRegistry\.ts|MapScene\.tsx)/.test(path) ||
      /^frontend\/src\/territory\/placement\.ts$/.test(path) ||
      /^assets\/map-/.test(path) ||
      /^assets\/source\/(?:map-buildings|map-effects)\//.test(path) ||
      /^frontend\/public\/assets\/map\//.test(path)) return 'KEEP_25D_RENDERER';
  if (/^(?:assets\/manifest\.json|frontend\/public\/assets\/manifest\.json|frontend\/package(?:-lock)?\.json)$/.test(path)) return 'REGENERATE_AND_VALIDATE';
  return 'RECONCILE_MANUALLY';
}
function contract(label, okay) { return { label, ok: Boolean(okay) }; }
function audit() {
  if (!existsSync(resolve(root,'.git'))) throw new Error('Run from an Ice-Age-Lord git checkout.');
  const base=git('merge-base', parity, map);
  const paritySha=git('rev-parse',parity),mapSha=git('rev-parse',map);
  const parityChanges=pathsSince(base,parity),mapChanges=pathsSince(base,map);
  const overlaps=[...parityChanges].filter(p=>mapChanges.has(p)).sort()
    .map(path=>({path,owner:ownership(path)}));
  const headMapCanvas=fileAt(map,'frontend/src/rendering/MapCanvas.tsx')||'';
  const headMapAdapter=fileAt(map,'frontend/src/rendering/MapSceneAdapter.ts')||'';
  const headMapTerritory=fileAt(map,'frontend/src/territory/TerritoryScene.tsx')||'';
  const parityLive=fileAt(parity,'frontend/src/LiveApp.tsx')||'';
  const parityOverview=fileAt(parity,'frontend/src/live/LiveOverview.tsx')||'';
  const parityAdapter=fileAt(parity,'frontend/src/live/territoryAdapter.ts')||'';
  const contracts=[
    contract('2.5D renderer still accepts snapshot + label', /snapshot:MapSnapshot;label:string/.test(headMapCanvas)),
    contract('2.5D renderer exports the shared MapCanvas host', /export default function MapCanvas/.test(headMapCanvas)),
    contract('2.5D adapter still exports LIVE exploration snapshots', /export function liveExplorationSnapshot/.test(headMapAdapter)),
    contract('2.5D territory scene still uses shared MapCanvas', /<MapCanvas snapshot=\{renderSnapshot\}/.test(headMapTerritory)),
    contract('Player app remains API-backed and mounts TerritoryScene', /<TerritoryScene/.test(parityLive) && /territorySceneFromApi\(view\)/.test(parityLive)),
    contract('Player overview remains independent of demo fixture client', /<LiveOverview view=\{view\}/.test(parityLive) && !/DemoGameClient|demoGameClient/.test(parityOverview)),
    contract('Unknown live buildings never masquerade as Lord House', /unregistered-building/.test(parityAdapter) && !/\?\? 'lord-house-damaged'/.test(parityAdapter)),
  ];
  const readiness = {
    scope:'READ_ONLY_PREMERGE_AUDIT',
    safe:true,
    parity:{ref:parity,sha:paritySha,commitsSinceCommonBase:git('rev-list','--count',`${base}..${parity}`),changedPaths:parityChanges.size},
    map25d:{ref:map,sha:mapSha,commitsSinceCommonBase:git('rev-list','--count',`${base}..${map}`),changedPaths:mapChanges.size},
    mergeBase:base,
    overlaps,
    contracts,
    blockers:[
      'Do not integrate until source map commit is frozen and its visual/browser/performance gates pass.',
      'Do not overwrite player-facing LIVE, hidden events/buildings, unknown-building art mapping or save-scope guards.',
      'Resolve overlapping territory scene, shared styles/tests and generated manifests explicitly; never use blanket ours/theirs.',
      'Run full frontend, backend, Windows paths, map visual matrix and populated LIVE render tests on the eventual integration commit.'
    ],
  };
  process.stdout.write(JSON.stringify(readiness,null,2)+'\n');
  if(contracts.some(x=>!x.ok))process.exitCode=2;
}
try { audit(); }
catch(error) { process.stderr.write(`Pre-merge audit could not run: ${String(error?.message||error)}\n`);process.exitCode=3; }
