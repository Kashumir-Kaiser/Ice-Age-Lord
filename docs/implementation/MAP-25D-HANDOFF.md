# Map 2.5D handoff — current status

Development continues on `codex/map-25d-overhaul`; `main` is unchanged. This checkpoint adds north-only map layers for the canonical Tomb building, a vector body fallback, and alpha-safe handling for the filtered SVG ground shadow. The original UI/source art, map anchor, 480×400 logical canvas, and canonical 6×5 m footprint remain unchanged.

## Existing map work

The map uses Pixi/WebGL with a Canvas fallback and a versioned bounded texture cache. Existing work includes terrain materials and props, authored wall/gate/watchtower/elemental poses, four damaged-house poses, and repaired-house/L30 north layers. Their implementation and review details remain in the existing evidence documents.

## Tomb assets and registration

Two transparent 1374×1145 PNG masters are preserved byte-for-byte:

- `assets/source/map-buildings/tomb-entry-foundation.png` — SHA-256 `41ff6a54954cd648918fe21982d7756b70cf034c16316046dee94b1f74d8f4e0`, Git blob `92f4db1bd9ad935f213db9cef26173223a5e5cf9`, 847,665 bytes. This is the complete map-only snowy low pad with steps; the grave markers belong to the upper layer.
- `assets/source/map-buildings/tomb-entry-upper.png` — SHA-256 `f716d1ca5d2ade50c3b31f0c35fe4c2bf73b2e6a300fee35a2907ac64a374564`, Git blob `ff1586e0f1e4b91212579bc2c8f1eb6a788f2653`, 1,680,999 bytes. This is an idle, unlit upper layer without an emitter.

The registration is north-only at presentation scale 1.27 with the existing anchor `(0.5, 0.72)`. The base candidate uses scale 0.95, contact `(0.52, 0.70)`, target `(240, 288)`; the upper uses scale 0.85, contact `(0.517, 0.905)`, target `(240, 337)`. Original source/UI SVG hashes are retained in [`MAP-25D-TOMB-LAYERS.json`](MAP-25D-TOMB-LAYERS.json). The source body SHA-256 is `4f84f3ac007c803be6c86cd4a08fa8696ec2eed3489b13e48faa367664ab719a`; public base, upper, and shadow SVG hashes are respectively `853bec96e340eb4f4aab54de5468593e4cd848542092f95a4837e8334a8112ec`, `dbd45c5e615f46beb8abe5faefcf1b755a6945efa355a63ea598c67614d06be3`, and `dac4789801d2e8c951484a28174cfae94266615428f350f26b0961ded5d8bf26`.

The generated path-only SVG is a body fallback for PNG rendering of the registered composite. Filtered SVG ground shadows decode through transparent Canvas2D and remain as Pixi `CanvasSource`; this prevents an opaque black quad while keeping one RGBA source reservation. PNG handling is unchanged. The corrected desktop fallback at 1366×768, DPR1, default auto quality shows transparent terrain, a coherent grounded idle crypt, and no open flames. In the 706×467 review crop, pixel `(200,70)` changed from `[0,0,0]` to `[181,198,200]`.

## Review and verification

Normal, planning, and focus scenes are accepted for north orientation and the canonical footprint at 1366×768 and 390×844, DPR1, normal quality. The pad is coherent, cups are unlit, walls are not visibly chopped, planning shows the base alone, and focus keeps the base at alpha 1 while fading the upper to 0.22. At 390px, one zoom-out step after preview initialization shows the full cross. Desktop fallback is accepted at 1366×768, DPR1, default auto quality; the effective quality was not captured. Mobile fallback screenshots and other DPR, quality, or orientation settings are not accepted. Normal-raster scenes remain accepted at normal quality. Review evidence and ephemeral capture paths are documented in [`MAP-25D-TOMB-VISUAL-EVIDENCE.json`](MAP-25D-TOMB-VISUAL-EVIDENCE.json).

First and repeat exporter/sync runs matched 1,178 files with zero changes, additions, or removals; twelve prior repaired-house/L30 PNGs remained byte-identical. The frontend unit suite passed 114/114 with zero skips or failures. Focused Playwright passed 4/4; layered and fallback desktop/mobile journeys each passed 2/2. Production build, typecheck, and cache canvas disposal checks passed.

The fresh-demo map-asset cold transfer met both configured budgets: low quality 3,551,112/4,194,304 bytes across 43 matching requests, and normal quality 4,572,273/8,388,608 bytes across 41 matching requests. These totals include only `/assets/manifest.json` and `/assets/map/**` response bodies; they exclude HTML, JavaScript, CSS, fonts, and UI/splash assets. This does not measure saved-populated LIVE mode or target hardware. Exact transfer scope and build hashes are recorded in [`MAP-25D-HTTP-PERFORMANCE-EVIDENCE.json`](MAP-25D-HTTP-PERFORMANCE-EVIDENCE.json).

A gold shape or overlay is visible in the native-background QA capture, but it is not part of Tomb source artwork. Its exact identity is unresolved, and no art changes are based on it.

## Remaining work

Complete and review the integration browser journeys and visual captures before accepting the new farmhouse, effect, fog, orientation, and lifecycle behavior. Review mobile fallback and the requested DPR/quality combinations before accepting those scopes. Dense-scene frame budget remains open, saved-populated LIVE transfer bytes are unmeasured, and target Intel UHD 620 hardware is unavailable for validation. Preserve the Tomb's north-only scope and original source/UI art until additional source orientations are authored and reviewed.

## Current integration — local checks complete, browser review pending

The farmhouse foundation master is preserved in the branch. The current integration adds four-pose farmhouse base/upper composition while retaining every original whole-body pose, removes redundant calibration fixtures from the ordinary demonstration placement palette, constrains draft rotation to declared legal orientations, and adds explicitly labeled populated/overlap/geography/fog QA scenarios. Its footprint remains an art-only 4×3 m assumption, not canonical gameplay placement data.

Three transparent SVG effect sources and a versioned shared atlas add ember/smoke frames and a dormant snow texture. Particles require an existing confirmed active visible emitter. No weather state is invented. The stable map host observes viewport intersection and combines it with document visibility to pause rendering; unknown host visibility permits static rendering without animation.

The final asset export and sync passed, and a repeat export matched across 1,235 map source/generated files, including both manifests. All 1,054 previously tracked map PNGs remain byte-identical to the prior checkpoint except for the two intended farmhouse atlas updates. The frontend suite passed all 123 cases across two runs: 122 passed in the full run, and its one local HTTP fixture case passed separately with no skip. Typecheck and the production build passed.

The low- and normal-quality LIVE baseline save/reopen checks preserved all three real API territory building references and rendered both views without QA-only attributes. A domain hash captured before map rendering after reload matched the hash after the map view and pan; a pre-reload hash comparison has not yet been captured. The measured local baseline map transfer was 3,226,903 bytes across 39 low-quality requests (24 unique files) and 2,467,797 bytes across 22 normal-quality requests (22 unique files); gzip manifest responses were 110,703 bytes each. These request totals include the post-render pan, and repeated low-quality requests count toward wire bytes. This is a clean baseline, not a saved-populated gallery: `RESOURCE_LEDGER_STAGE_05` blocks authoritative harvest extraction, so saved-populated LIVE transfer remains unmeasured. Full scope and limitations are recorded in [`MAP-25D-LIVE-TRANSFER-EVIDENCE.json`](MAP-25D-LIVE-TRANSFER-EVIDENCE.json).

A scoped visual review accepted the farmhouse four-pose contact sheet and planning/focus desktop frames at 1366×768, DPR 1, normal quality. The full foundation pad remains in planning; focus retains the complete roof silhouette while fading the upper layer; the reviewed frames show no horizontal cut or black rectangle. This does not accept the full viewport, quality, DPR, orientation, or scenario matrix.

The reviewed captures were served from the validated production build. Capture names, source hashes, and the exact accepted subset are recorded in [`farmhouse-focused-review.json`](../../frontend/map-evidence/focused-farmhouse-final/farmhouse-focused-review.json); the broader visual QA manifest remains incomplete.

Broader browser lifecycle, orientation, effects and fog checks, remaining visual capture review, and saved-populated LIVE transfer evidence are pending. Initial interactive production-preview checks timed out while browser workloads overlapped; a serialized retry is pending. The QA inventory expects 73 scenarios per viewport (876 across three viewports and four quality/DPR pairs); these are planned coverage, not accepted captures. The preceding Tomb acceptance applies only to its recorded earlier checkpoint. The performance document records the earlier measured source checkpoint; its dense-scene budget misses and target-hardware limitation remain open and are not evidence for this integration. Do not promote software-renderer results to target-hardware acceptance or merge/deploy this branch.
