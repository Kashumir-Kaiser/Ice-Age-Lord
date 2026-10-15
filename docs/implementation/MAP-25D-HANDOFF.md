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

Review the mobile fallback screenshot and other requested DPR/quality combinations before accepting those scopes. Review farmhouse L1 semantic architecture; prior horizontal clips were rejected. Dense-scene frame budget remains open, saved-populated LIVE transfer bytes are unmeasured, and target i3/UHD 620 hardware is unavailable for validation. Preserve the Tomb's north-only scope and original source/UI art until additional source orientations are authored and reviewed.
