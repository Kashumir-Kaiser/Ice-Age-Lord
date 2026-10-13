# 2.5D map implementation audit

Audit started 2026-10-13. Uploaded task prompt read; attached research PDFs remain unread.

## Source and release state

Initial local HEAD: `2de4ece02b5c00dea647b98bac0ffdb787690616`, branch `work`, clean working tree. No applicable AGENTS.md found. GitHub inspection discovered five newer work-branch commits through `a56aab61b598701616d2c8bf0f115ce0574fcdc5`. All 38 changed files were fetched through the authorized GitHub integration; their exact Git tree was verified as `530831e7173239f71af02f1e44ae7cb060768e4f`. These improvements are preserved. Main remained at the original reference commit.

Read root README, assets ART-DIRECTION and README, frontend README, scripts and workflows. Root `npm run local:start` starts the LIVE API/client; frontend `npm ci`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run qa:territory` are existing gates. `frontend/vite.config.ts` proxies API requests to localhost:8081 and uses a relative Vite base. Existing GitHub workflows are regression/asset validation, not hosting deployment. No hosting descriptor or deployment script was found; deploying a frontend alone would not deploy its persistent LIVE API.

Cloud runtime: Node 24.19.0, npm 11.9.0, Linux container; Chromium/Inkscape available. No installed frontend toolchain at start. Offline npm failed ENOTCACHED; direct sandbox npm failed EPERM; supported network permission reached the sidecar but npm registry CONNECT was denied HTTP 403. No configured network destinations, credentials, outbound identities or VPN. User directed frontend testing through GitHub Actions instead. Added baseline capture and CI toolchain preparation on the existing work branch. No network policy bypass attempted.

## File mapping and protected contracts

- `territory/projection.ts`: exact metres → (2(x+y), x-y), inverse and anchored zoom. Reuse; never change north-up map camera.
- `territory/BuildingSprite.tsx`: sqrt zoom/clamps, screen rotation and planning-body defect confirmed; clipped layers are not architecture splits.
- `territory/TerritoryScene.tsx`: React camera, placement-only local drafts, opening IDs, minimap, list, heat, focus/planning and 520 test fixture. LIVE placement contract is currently absent; renderer must not invent one.
- `MapScene.tsx`, `map/MapLayers.tsx`, `TerrainDetails.tsx`: north-up navigation, visible projections, clustering, SVG fog union and current vector/gradient scenery.
- `map/camera.ts`: north-up (+Y north → negative screen Y), metre scale; 96,000 m half span.
- `canonicalGeography.ts`, `worldFeatures.ts`, `mapModel.ts`: fixed source anchors; modeled terrain infill is illustration, never passability/resources/discovery. Renderer must not read private canonical entities.
- `assets/assetRegistry.ts`, `assets/manifest.json`: one authority for canvas, trim, anchor, art footprint, physical compatibility, hit and occlusion polygons, stage resolution and LOD. Preserve UI SVG identities; map derivatives extend the same entries.
- `live/territoryAdapter.ts`, `game/GameClient.ts`, `LiveApp.tsx`, `App.tsx`: player-safe API/demo snapshots, shared selected refs and camera state. Historical LL01 inventories/saves excluded.
- `scripts/sync-assets.mjs`: SVG UTF-8, XML controls, viewBox, linked-use and no embedded-raster checks. Retain these when adding explicit raster validation.
- `frontend/tests`, `frontend/e2e`, Playwright and territory QA: behavior and visual evidence. Initial frontend baseline locally could not run without deps; CI baseline build/unit gates passed, screenshot capture pending at this checkpoint.
- `.github/workflows/assets-frontend.yml`, `frontend-demo.yml`: preserve existing gates and newer work-branch changes. GitHub CI captures have real run/commit provenance; they are not evidence of LIVE deployment.

## Existing art inspection

Rasterized and opened actual 480 px source art: opening and late fire, damaged/repaired lord house, Tomb, forge, Li Lan portrait. Reference PNGs are in `/tmp/map-25d-art-audit/` (inspection artifacts, not production exports). Winter timber/stone roof textures are detailed, amber highlights small, snow dusty blue-grey; broad material masses needed below them. Opening fire has a painted debris/earth rim in its body. The late fire has tall open timber framing. Repaired house/forge still include painted smoke in the existing master; do not add another emitter without active-state data. The Tomb has upright stone cross, front steps and graveyard overhang. Portrait retains black hair/hoodie and tired expression.

`lord-house-damaged/base.svg` clips `body.svg#painted-sprite` to y=320..400: a horizontal cut through architectural pixels. Such exports cannot be accepted as final authored base/upper slices. Existing full-body fallback must be explicit until architecture splits are repaired. Terrain authoring directory initially contained only `.gitkeep`; production terrain set is entirely missing. No splash asset was found by source/file search; its absence is recorded, not inferred visual approval.

## Baseline evidence

CI run https://github.com/Kashumir-Kaiser/Ice-Age-Lord/actions/runs/38407619673 on `c631a16d288253d66887fc6602dd0786beb1e7ca`: baseline production build and all existing frontend unit gates passed. Baseline script fixes reduced motion and captures territory, planning, local/world at 1366×768, 1920×1080 and 390×844. Camera and fixture transitions in that same script will be reused after integration. Screenshots must be opened before acceptance.

Initial local pre-update root checks passed: stage02 (10), stage04 (11), stage05 (12), stage06 (12), stage07 (1 test file), bots API (1 test file). These are audit baseline evidence only; final checks must use the preserved newer work-branch code.
