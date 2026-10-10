# Territory asset art direction

All current artwork is original repository-authored SVG placeholder art. It exists to exercise the runtime layer and placement contracts; it does not establish that a building can be constructed or upgraded.

## Visual language

- Frozen preindustrial fantasy: blue-grey stone, weathered timber, snow-muted values, and restrained amber firelight.
- Keep a fixed upper-left light direction, crisp readable silhouettes, transparent backgrounds, and contact shadows in a separate layer.
- Draw structures without labels, borders, UI, smoke, or baked glow. The UI supplies those effects independently.
- Keep map sprites at a fixed 2:1 dimetric ground angle. The ground anchor and physical footprint remain data, not painted pixels.
- A UI icon is its own compact view. It may use a clearer presentation angle than the map body.

## Authoring and registration

Masters live in `assets/source/{buildings,items,terrain,units}/`. Runtime exports live in `frontend/public/assets/`. All map layers in a variant use the same 240 × 200 logical canvas and normalized ground anchor `(0.5, 0.82)` unless a manifest entry explicitly says otherwise. Trimmed exports must retain offsets to that canvas.

The SVGs currently in the building folder provide a complete original master and exported `body`, `base`, `upper`, `shadow`, and `icon` layers. They are marked `placeholder`; none is production-approved. `fixture-tall-tower` and `fixture-fire-max` are isolated calibration/placement examples and are not opening buildings or upgrades.

Before producing final art, approve one low structure, one tall tower, and the highest fire form. Create each complete master with its base and consistent camera first. Derive upper/base/cutaway states from that master, then hand-correct registration. Build new orientation views with matching light direction; do not mirror asymmetric architecture as a shortcut.

## Geometry and interaction

The source definition owns physical dimensions and placement rules. The current rectangular footprints are versioned frontend assumptions in `TERRITORY-FOOTPRINTS-V1`. Manifest art footprints, transparent bounds, shadows, upper sections, and VFX never become physical occupancy. Keep hit/occlusion shapes ground-aware and separate from the upper sprite. A missing file should use the scene's vector fallback while preserving the same anchor and physical footprint.

## Provenance and storage

These placeholders were authored directly for this project and have no third-party source. Keep that provenance in the manifest, not the player-facing UI. No external image generator, game's art, or unapproved LFS policy is part of this export pipeline. Large editable masters can later move to a separately managed art store if the repository policy records a stable source reference and license.

## Approved visual rendering update — 2026-10-10

The registered Survival Fire progression now uses individual, painted **true SVG vector paths** adapted from the project's approved ink-fantasy art direction, not the earlier minimal geometric SVG placeholders. The six separate art identities are level families beginning at 1, 6, 11, 16, 21, and 26. They remain a **visual draft** pending detailed level-by-level art acceptance. Their master source is in `assets/source/buildings/` and runtime exports are in `frontend/public/assets/buildings/`.

The Fire stage registrations explicitly use a 480 × 400 canvas and the unchanged normalized ground anchor (0.5, 0.82), overriding the 240 × 200 canvas default for other existing assets. The manifest's optional `presentationScale` is **visual only**. It does not alter world metres, physical footprints, heat radii, construction permissions or real stage definitions. The ordinary close view uses `base` and `upper`; the active Fire adds `vfx`; plan mode shows `base` so buildings hidden behind the taller artwork can still be reached. Icons and complete-body variants are separate registered exports.

These SVG illustrations have been traced from a project-generated approved concept-art study into SVG color geometry; they contain **no raster `<image>` elements**. The layered rendering assets can be edited, although the dense paint-patch paths are best maintained alongside the approved concept master and visual comparisons. Art ownership and availability do not change because an export exists.

## Starting settlement ink artwork — 2026-10-10

Lí Lan's T0 ink portrait and full-body reference are authored in `assets/source/characters/` and exported to `frontend/public/assets/characters/`. Canon remains black hoodie, shorts, black hair, black eyes and tired expression; do not turn her into an armored fantasy protagonist without an actual in-world outfit change.

The Tomb, damaged house, repaired house, supply crate, farm house, palisade fence and timber gate each have separate 480×400 transparent SVG masters and `body/base/upper/shadow/icon` exports. The repaired house is selected by the explicit `visualState` field, not by reading the description text or creating a second building. Fence, gate and farmhouse registered fixtures are **art previews**, not T0 placed buildings or unlocked build commands. Each upper is separately hideable in plan mode. These are original winter-ink drafts pending visual QA and provenance sign-off.
