# Stage 01 — frontend map and UI

## Scope and inputs

Implemented the attached `01-Frontend-Map-and-UI.md` against the frontend snapshot at `b4ea5a84` in the isolated local repository, branch `stage-01-local`. The read-only source reference was `main` at `66f0c2ad`. The repository's synthetic local base is `10ddb35` (`Stage 01 baseline snapshot b4ea5a84`); the patch is relative to that snapshot.

This remains a presentation demo. No backend, save system, active gameplay rule, canonical source catalog, player state, or `main` change was added. Nothing was pushed. After the user's instruction, every command and browser check stayed local; the package reinstall used `npm ci --offline`, and Chromium was restricted to `127.0.0.1` with external host resolution blocked.

## What changed

- Added the `GameClient` frontend boundary and a fixture-only adapter. Seven screens read `PlayerView`; inspection returns typed entity views; unsupported gameplay commands are rejected without changing demo values. Fixtures explicitly distinguish current sight, remembered locations, unknown geography, dark known sites, and depleted, reserved, or unreachable resource samples.
- Lifted selection and camera state above screen routes. One entity reference now drives map/list highlights and the shared inspector; camera context survives screen changes. Escape clears the selection. Mobile inspection uses a collapsible details sheet.
- Added named world/map/screen coordinate transforms, cursor-anchored wheel zoom, bounded zoom, pointer-ID pan and pinch handling, cleanup for cancel/lost capture, keyboard pan/zoom, aspect-aware heat/world framing, retained local/world cameras, and a physical scale bar.
- Replaced per-kind marker bins with screen-space collision clustering. Cluster IDs are derived from member IDs; clusters retain member references, bounds and kind counts without summing unknown or incompatible values. Label collisions use entity priority.
- Kept the visible map on the player projection. Debug atlas data is rendered through a separate developer-only path and does not change sight, discovery, selection, or the ordinary accessible entity list. Fog masks use monotonic gradients and visibility-source union behavior. SVG definitions are scoped per map instance.
- Split map, camera, layer, cluster, client and inspector responsibilities into `frontend/src/map/`, `frontend/src/game/`, and `frontend/src/inspectors/`. Terrain details are culled, use coarser regional strides, and avoid rebuilding the vegetation subtree for every small camera movement. Snow remains a screen-space decorative layer and observes reduced-motion preferences.
- Removed conflicting map-height rules from `styles.css`. The full map now retains its scene height on mobile while expanded demo controls flow with the page; the desktop map uses its available area without cropping the footer. The scale bar and gesture hint have separate positions.
- Added `frontend/package-lock.json`, ignored generated Playwright artifacts, repaired workflow YAML, and added a real `workflow_dispatch` trigger. The workflow deliberately has no active schedule because scheduled workflows only run from the default branch. Playwright can also target the local production preview with `PLAYWRIGHT_PREVIEW=1`.

Primary changed paths: `.github/workflows/frontend-demo.yml`; `frontend/package-lock.json`; `frontend/e2e/map.spec.ts` and its snapshot directory; `frontend/playwright.config.ts`; `frontend/src/App.tsx`, `MapScene.tsx`, `TerrainDetails.tsx`, `demoData.ts`, `mapModel.ts`, `worldFeatures.ts`, `styles.css`, `map-refinement.css`; new `frontend/src/game/`, `frontend/src/inspectors/`, and `frontend/src/map/`; and frontend tests.

## Verification

| Check | Result |
|---|---|
| `npm ci --offline --no-audit --no-fund` | Passed; installed 75 packages from local cache. No network was enabled. |
| `npm run build` | Passed; TypeScript and Vite production build completed. |
| `npm test` | Passed; 7 test files, 7 top-level tests, 0 failures. |
| Structural YAML parse | Passed; `workflow_dispatch` exists and `schedule` is absent. |
| `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --workers=1` | Passed; 24 browser checks passed, 4 expected project-specific checks skipped. |
| `git diff --check` | Passed. |

Browser checks covered pointer pan and click-after-drag, cursor-anchored wheel zoom, touch pan/pinch, keyboard controls, camera persistence, Escape and inspector behavior, cluster expansion, darkness/debug privacy, rapid viewport resizing, and local heat fit for levels 1, 16, and 30. World framing was checked in portrait. The visual suite uses screenshot comparisons for day, night, 25 km heat, world view, cluster expansion and selected inspector in both desktop and mobile projects. All 12 post-change captures were reviewed locally.

The four skips are intentional: portrait world fit, pinch and rapid-resize cases are mobile-only; wheel input is desktop-only. The e2e run used installed Chromium `151.0.7922.173` on Debian 13, headless, with GPU acceleration disabled and a loopback-only Vite server. CI installs Playwright's pinned browser, which could render pixels differently from these system-Chromium baselines; that browser could not be downloaded in this offline environment.

## Performance sample and limits

Measured pan/zoom with `PerformanceObserver` at 1280×900 and 390×844. The host exposed Linux x86_64 with 3 logical CPUs; physical model and GPU details were unavailable. No FPS value was measured or inferred.

- Built local production preview: 1 long task at 67 ms desktop and 1 at 61 ms mobile across the scripted gesture sequence.
- Final full dev-server suite: 2 long tasks at 69/94 ms desktop and 2 at 71/80 ms mobile. Long-task attribution was `window:unknown` in this browser.

The production sample did not show repeated long tasks within either gesture sequence, but it did exceed 50 ms once in each viewport. The dev-server sample had two over-50 ms events in each viewport. The target is therefore not claimed as a clean 50 ms pass; the browser is software-rendered in a constrained sandbox, and profiling on the target hardware remains useful.

The attached audit contains earlier CI screenshots, but a fresh local pre-change screenshot set was not available before implementation began. The checked-in snapshots are reviewed post-change baselines, not a before/after comparison.

## Handoff

The client boundary is ready for Stage 02 to formalize. It is not a security boundary: source geography and fixture catalogs remain in the demo bundle. A production API must filter player-visible projections on the server. No real command, economy, travel, discovery persistence, or save behavior exists in this stage. No unresolved gameplay IDs were promoted to active content.

Stage 01 is complete locally; do not start Stages 02–09 or push this branch as part of this handoff.
