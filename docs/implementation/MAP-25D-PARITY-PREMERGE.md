# 2.5D map + LIVE frontend: pre-merge preparation (NO MERGE)

**Intent:** Prepare `codex/live-demo-parity` to integrate `codex/map-25d-overhaul` *later*, without modifying `main`, merging branch history, rebasing, copying unfinished map assets, or deploying anything.

**Initial audited refs (2026-10-16):**
- Player-facing frontend: `codex/live-demo-parity` at `3955504518f15b61e94c42f05f92cb9bc42da734`.
- 2.5D map: `codex/map-25d-overhaul` at `192ef5ad60dbb222c7a1b301a58ee6575362849c`.
- Common ancestor: `5746c452611d3ed650f01fba5d8ed33879a624b6`.
- They have **diverged**: 142 frontend-only commits versus 34 map-only commits as of the audited refs. THESE NUMBERS BECOME STALE WITH NEW PUSHES.

This pre-merge checkpoint introduces a **read-only compatibility and drift audit**, not map integration. The map branch's own handoff still says the broader browser lifecycle, orientation, effects, fog, DPR/quality, populated LIVE transfer, and visual checks are outstanding. A successful build is not proof of map acceptance.

## Run the non-destructive readiness audit

Use a normal repo checkout with Git and Node 22+:

```bash
git fetch origin codex/live-demo-parity codex/map-25d-overhaul
node scripts/check-map25d-premerge.mjs
```

It reads both branches and their common ancestor, reports unique file changes, **every overlapping changed path**, ownership decisions and shared component contracts. It never calls `git merge`, `git rebase`, `git cherry-pick`, `git checkout`, `git push`, `git update-ref`, or `git merge-tree`; it does not update the working tree or local branch head. `git fetch` above is an explicit, separate prerequisite to get current remote refs, not run by the script. Exit 2 means a cross-branch interface has changed and needs attention. Re-run after the map branch's final test fixes.

## File ownership after the eventual explicit integration approval

| Scope | What must survive | Preferred starting version |
|---|---|---|
| `frontend/src/rendering/**`, `frontend/src/assets/assetRegistry.ts`, `frontend/src/MapScene.tsx`, `frontend/src/territory/placement.ts` | 2.5D Pixi/Canvas fallback, authored depth/orientation, terrain, controlled effects, adaptive quality, cache and render lifecycle | **Map branch**, once its tests pass |
| `assets/map-*.json`, `assets/source/map-*/**`, `frontend/public/assets/map/**`, exporter and QA scripts | Original masters, generated raster/atlas assets, hash/provenance, reproducible exports, bounded performance | **Map branch** |
| `frontend/src/LiveApp.tsx`, `frontend/src/live/**`, `frontend/src/shared/**`, `frontend/src/landing/**`, `frontend/src/main.tsx` | Demo-grade LIVE layout, Vietnamese player text, save selection, real API actions, state and map navigation | **Frontend branch** |
| `packages/sim/src/view.ts`, player API contracts and runtime tests | Hidden future events, hidden locked blueprints, player-known geography, non-leaking loot, existing save and simulation authority | **Frontend branch**, then reconcile any map-specific backend changes |
| `frontend/src/territory/TerritoryScene.tsx` | New map calibration, legal rotations, depth/layer controls, interactive renderer **plus** frontend's player-readable status text and no QA presentation in LIVE | **Manual combination required** |
| `frontend/src/App.tsx` and shared E2E files | Demo map scenarios/visual checks **plus** frontend labels, real-save tests and no future-spoiler behavior | **Manual combination required** |
| `frontend/src/live/territoryAdapter.ts` | Actual LIVE structure -> artwork mapping; unknown building kinds must remain `unregistered-building:<kind>`, **never** default to Lord House | **Frontend branch** (map branch still contains an unsafe House fallback) |
| `assets/manifest.json`, `frontend/public/assets/manifest.json`, `frontend/package*.json` | Single generated asset manifest and dependency lockfile; no stale hashes or removed resources | **Rebuild and validate**, do not choose either side blindly |

### Concrete conflicts to settle (not speculative)

- **TerritoryScene:** map changes the 2.5D calibration and art-angle controls; frontend adds `playerStatus` rendering. Preserve both. Do not replace the entire file in either direction.
- **Live territory adapter:** the map branch's fallback `ART_BY_KIND[building.kind] ?? 'lord-house-damaged'` would depict an unrelated building as the Lord House. The frontend branch fixes this with explicit mappings and a non-impersonating fallback. **Keep the fix**.
- **LIVE App and overview:** the map branch predates the frontend's unified demo/live layout, Vietnamese player wording, event/blueprint visibility and save-scope guard changes. Retain the frontend version and let the map's shared `MapCanvas` implementation supply rendering.
- **QA and tests:** the map branch adds orientation/ground-contact/effect/performance scenarios while frontend tests protect T0 visibility, API-backed state, inventory wrapping and real-map selection. Run both; do not delete a failing test to hide a regression.
- **Assets:** the map's authored master PNGs, atlas derivatives and effect artwork are content-addressed and need exact manifests. Preserve approved originals, rebuild exports once, validate hashes and repeated sync; do not regenerate paintings to resolve a merge conflict.
- **View permissions:** the 2.5D terrain renderer must consume only already-known `PlayerView` data in LIVE. Procedural decoration is not grounds to reveal undiscovered enemies, structures, loot tables, or future events.

## Final acceptance gates — DO NOT MERGE UNTIL THESE PASS

1. Freeze the final map commit SHA *after* 2.5D tests finish; rerun this audit against both exact refs.
2. Run the 2.5D map branch's visual/browser matrix (desktop/mobile, DPR, quality, north/other authored orientations, focus/planning, fog, effects, Canvas fallback, reduced motion), its cache/memory/long-session checks, and performance budgets.
3. On the later combined code, run frontend typecheck and production build, frontend unit tests, Windows path/hash validation, all map/browser tests and Stage 02–10 backend/API regression tests.
4. Start a genuine fresh LIVE save: verify events absent until announced, all 11 build designs hidden before Nhà Lãnh Chúa repair, correct unlock after repair, correct known-only map, no exact unopened-chest loot/odds, and no player-visible `H0`, `P0`, `WU`, raw IDs or untranslated controls.
5. Verify populated LIVE territories (farmhouse, Tomb, repaired/L30 Lord House, crate) render with correct identity, orientation, footprint, occlusion and interactive selection; rendering and panning must not modify save revision.
6. Verify live save switching and stale network-response cancellation while the map is mounted; compare memory/frame/transfer metrics against the 2.5D branch's tested baselines.
7. Only after the user *separately* authorizes integration, resolve the shared paths above and review an actual integration diff; **do not merge to `main` on this preparatory task**.

**State at this checkpoint:** Compatibility analysis and a repeatable non-mutating audit are committed to the frontend branch. The 2.5D implementation, assets, and test branch have not been imported; neither branch's commit ancestry has been merged or rewritten. This deliberate separation avoids declaring unfinished art validation accepted.
