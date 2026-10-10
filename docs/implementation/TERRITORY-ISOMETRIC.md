# Territory isometric view and asset contract

## Scope and UI behavior

This change implements Prompt 10 on an isolated local feature branch. **Lãnh địa** is now the detailed settlement view; **Bản đồ** remains the exploration and strategic view. Both consume the same `PlayerView` identities and app-level selection. The strategic map projects the player's settlement as one camp marker, keeps authorized external features visible, and opens the same settlement through **Mở lãnh địa**. The building catalog and overview route to that same view and focus an existing instance.

The three browser comments are covered:

- The map help panel adds space and a divider between its heading and body.
- Remembered resources show their last-known quantity and stale status. Their harvest planner supports unit-group choice, 10%, 25%, 50%, 100%, and a custom amount. Sending is disabled because this opening snapshot has no living units and the demo adapter rejects gameplay commands.
- Forces shows **Tất cả** and adds a race filter only when a living unit group of that race exists. The opening demo therefore shows only **Tất cả**.

## Coordinate, heat, and placement decisions

Source coordinates remain metres from H0, with +X east and +Y north. The opening instances remain at fire `(0, 0)`, damaged house `(40, 20)`, supply `(30, -10)`, and tomb `(-20, 30)`. Their sample rectangular footprints are explicitly tagged `TERRITORY-FOOTPRINTS-V1`; they are not canonical build rules. The actual opening heat radius is 10 m. The house remains outside that circle. Larger 2.5 km and 25 km circles are labeled fixtures and do not modify player data.

Territory uses a separate fixed 2:1 dimetric projection:

```text
u = 2(x + y)
v = x - y
x = u/4 + v/2
y = u/4 - v/2
```

Camera translation and scale apply after projection. Picking uses the exact inverse before snapping a local layout draft to the 1 m preview grid. Strategic-map projection and camera code remain separate. Heat is rendered as an ellipse whose two axes follow the same projection, while placement heat checks use circle/rectangle geometry in world metres.

Build previews are reversible local `LayoutDraft` values. Collision, heat-edge and unknown-terrain checks produce warnings; they do not submit a build command, change the `PlayerView`, or invent costs and permissions. The building list/search remains available when artwork overlaps. Plan mode retains every exact footprint and labels only the focused building to prevent label pile-up on mobile.

The territory renderer culls structures against the current viewport with an artwork margin and sorts visible instances by projected ground Y with stable ID ties. Heat boundaries and close grid lines are generated from visible geometry; no 25 km tile grid is allocated. The 520-item fixture is isolated from player data.

## Asset contract

`assets/ART-DIRECTION.md` describes original frozen-fantasy placeholder art and authorship rules. `assets/source/{buildings,items,terrain,units}/` contains the masters; `frontend/public/assets/` contains runtime exports and the copied manifest. The current six building assets are the campfire, damaged house, tomb, supply crate, tall-tower fixture, and maximum-fire fixture. All map layers use a 240×200 logical canvas with normalized ground anchor `(0.5, 0.82)`. They are original SVG placeholders marked `placeholder`, not production art or unlocks.

`assets/manifest.json` records identity, version, layers, canvas/trim/anchor registration, art/hit/occlusion geometry, depth anchor, compatible fixture footprint, provenance, license, status, and close/district/regional LOD references. `frontend/src/assets/assetRegistry.ts` provides typed runtime loading with fallback support. `frontend/scripts/sync-assets.mjs` checks authoring folders, source and runtime file presence, and each SVG `viewBox` against the manifest before dev/build. Physical occupancy continues to come from `SettlementBuildingView`, never the art manifest.

Body, base, upper, shadow, and UI icon are separate paths. Shadows and art layers do not capture ground clicks; footprints and the narrow visible-art silhouette handle selection. Upper art fades in focus mode and hides in plan mode while the base footprint remains selectable. The fixture tower and maximum-fire art exercise the shared registration and fade path without changing opening buildings.

## Verification and visual review

Local verification uses the built app routed through Playwright in memory. Chromium did not bind a server or access the internet. The reviewed screenshot set was written to `/tmp/ice-age-lord-territory-qa/` and includes desktop/mobile strategic and settlement views, night/fire-off, full heat extent, placement near the heat edge, overlapping tower fixtures, planning mode, and the dense QA district. The 12 existing map baselines remain in the repository; the five whose rendered output changed were regenerated and reviewed.

Commands and results:

- `npm run build` — TypeScript and Vite build passed; the asset sync validated 6 registered SVG assets.
- `npm test` — all 8 unit-test groups passed, including coordinate, source-geography, placement, asset, and client-contract checks.
- `PLAYWRIGHT_IN_MEMORY=1 CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test e2e/map.spec.ts e2e/territory.spec.ts` — 39 passed, 5 skipped. Desktop/mobile checks cover the view split, map gestures and clusters, resource/harvest planner, living-race filters, placement drafts, catalog focus, help spacing, plan-mode label count, responsive layout, and visual baselines.
- On the 390×844 local Chromium dense fixture, all 520 instances mount when framed together. Returning the camera to H0 leaves 20 in-viewport candidates mounted; the measured update was 329 ms with 3 long tasks and a 65 ms maximum in this environment. This is a local fixture measurement, not a target-device frame-rate claim.
- Existing map interaction timing checks recorded 1,907 ms / 0 long tasks at 1280×900 and 371 ms / 1 long task / 80 ms maximum at 390×844 for their scripted pan/zoom sample.

## Backend handoff and limits

`GameClient` now exposes settlement identity/origin, authorized local buildings, heat state, footprint and placement-definition data, living unit groups, remembered resource quantities, and harvest command arguments. `DemoGameClient` is still a front-end fixture: it starts with zero units, rejects harvest/build actions, and has no authoritative placement, discovery, cost, terrain-constraint, saved-layout, or campaign service. The backend should supply the same projections from authorized state and validate actual placement before any draft becomes a building. Fixture dimensions, unit counts, harvest availability, heat previews, and unknown terrain rules must not be treated as game rules.
