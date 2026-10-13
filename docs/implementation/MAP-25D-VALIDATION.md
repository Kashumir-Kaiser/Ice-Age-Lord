# Map 2.5D checkpoint — stopped at user request

Stopped on 2026-10-13 because the user requested stopping as usage was nearly exhausted. This is an unfinished implementation, not an accepted release.

## Branch and preservation

Branch: `codex/map-25d-overhaul`. This source checkpoint contains all saved implementation code, source artwork, runtime exports and documentation. Publication was requested after the user stopped implementation. The branch was created from the updated work branch and includes the baseline/CI bootstrap commits through `46a9f3c9c13a0a1cb0f9284e8990e1d79924d9d8`. See branch history for the checkpoint commit. The implementation remains unfinished; main was never changed. Initial bootstrap commits were added to work before the user directed use of a separate branch; all later remote work used the map branch.

The newer work-branch changes were preserved; see MAP-25D-AUDIT.md. Uploaded prompt and user files are retained. PDFs remain unread. Original approved building/portrait masters remain intact. Generated art is under assets/source/terrain; original generation outputs are also retained in /workspace/generated_images.

## Implemented locally

Shared canvas host and lazy PixiJS 8.10.2 WebGL renderer; Canvas2D fallback; fixed projection and linear sprite registration; deterministic terrain sampler and worker/incremental chunk generation; bounded chunk cache; picking helpers; footprint depth ordering; raster export and deterministic padded atlas pipeline; export/hash validation; metrics; quality/LOD logic; territory, demo exploration/world and separate LIVE exploration wiring. React retains controls, selection, lists and existing command paths. Planning, grid toggle, focus geometry, transient camera updates and territory pinch handling have been changed.

These changes have not completed acceptance. The latest source edits after the last successful build are not fully verified. Export generation needs rerunning after planning-foundation/atlas changes and newly added art. The current manifest/runtime exports therefore do not yet represent the final source state.

## Actual verification completed

- Baseline CI production build and existing frontend unit tests passed in runs 38407619673, 38408002946 and 38408961571. The baseline harness initially failed navigation; desktop baseline images were recovered from run 38408961571. Mobile navigation and actual world switching were subsequently corrected locally.
- Local production build passed at intermediate checkpoints using the pinned toolchain obtained from authorized GitHub CI artifacts. Later TypeScript checks passed after renderer, LIVE integration and camera edits.
- Local frontend unit suite passed: 10 test files, including 10 new map-rendering contract tests. This was before the latest atlas/foundation/camera changes.
- Four new desktop Playwright map journeys passed at an intermediate checkpoint: normal renderer/planning/grid, Canvas2D fallback selection/zoom, reduced motion plus locked low quality with idle loop shutdown, and missing raster derivatives retaining interactions. The latest gesture changes have not been rerun through these journeys.
- Baseline and intermediate after screenshots in frontend/map-evidence/{baseline,after} were opened. Findings: painted continuous snow improves the gradient ground; faint chunk-edge lines still require investigation; initial generated tree variants were too similar and were replaced with visibly distinct silhouettes; a large old heat-center dot obscured the opening fire and was removed. Prop alpha-bound normalization and ground-contact review remain open.
- Existing CI backend regression reached Stage 08 and exposed two pre-existing backup defects: bot-carried shared chests were rejected, and bounded clock slices retained simulation-local calendar receipt indexes. Minimal API custody validation and committed-calendar receipt binding were implemented. The full local Stage 08 suite then passed 7/7 in approximately 88.4 seconds. These fixes have not yet run on CI; focused tamper/regression coverage remains needed.
- Initial pre-update root stage02/04/05/06/07 and bots API checks passed as recorded in the audit. They do not replace final checks on the newer branch state.

## Outstanding work / open gates

Complete and inspect all requested environment art and orientation variants; do not treat missing variants as accepted. Several generation batches were run; sources copied into the repository include ground samples, six revised conifers, eight rocks and three bare trees. The snow-bank generation batch was canceled when the user requested stopping. Some completed generation outputs may not yet be copied into source folders.

Finish architecture-aware upper/base/slice behavior, overlap cycling integration, cache ownership/cancellation/context recovery tests, precise chunk seam repair, terrain material/forest/ridge LOD coverage, dirty-footprint/contact decals, affected-chunk invalidation and budget enforcement. Current explicit full-body fallback and planning-only foundations do not establish final architectural split acceptance.

Rerun exports, production build, all frontend/unit/browser gates, root integration/CI gates and complete the specified deterministic visual matrix. Update the bootstrap workflow into final map validation; it currently prepares baseline/toolchain artifacts, rather than validating the unpublished implementation. Remove the temporary local debug-map.mjs script when continuing.

Implement/run qa:maps and benchmark:maps; the requested full stress/visibility/context-loss/memory experiments and target-device performance validation are not complete. No GPU benchmark or draw-call budget acceptance is claimed. Intel UHD 620 / i3 / 4 GB hardware was unavailable; target-device validation is unverified. No release, merge or deployment occurred.

## Continuation — 2026-10-13

The user recovered and pushed the previous workspace as `90fad0cd8a1e9d2915993edbbe6c868e5fa72233`. Its complete tree and all 25 retained PNG masters were retrieved through the GitHub integration and CI artifacts, verified by Git blob hashes, and restored locally. The thirty image-generation records include superseded variants; no replacement set was generated. The user now requires pushing all work after every ten newly generated assets and before stopping; AGENTS.md records that instruction in committed checkpoint `db7a8e6d0b7d997b776a620c3c3d53aa30e84117`.

CI map run 38427313534 passed production build, the ten frontend test files and deterministic territory/planning/local/world captures. The broader run 38425975418 passed root stages 02–10, then failed the bot lossless-activity-archive assertion. That unrelated failure prevented its frontend job; it is reported rather than hidden or changed in this map task.

Continuation fixes cover complete painted texture gutters, projected bounds/depth shared by scenery and picking, repeated-click overlap cycling, focus picking through faded upper art, planning at strategic zoom, context-loss resource cleanup, pending-image byte admission and surviving shared-image owners. Existing modeled forest/ridge coordinates were retained in the shared sampler; fine snow grain is suppressed at world LOD. New tests cover stale worker results, queue/byte bounds, disposal, shared ownership and late failures. Browser checks now include twenty returns and context-loss fallback.

Executable qa:maps and benchmark:maps scripts were added. Their captures and measurements still require execution and review. The full performance experiment, required asset/orientation coverage and artistic acceptance remain open. No target-device, release or deployment success is claimed.
