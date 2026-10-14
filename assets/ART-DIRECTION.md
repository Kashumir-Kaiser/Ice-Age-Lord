# Territory asset art direction

Artwork combines original SVG masters, project-generated concept studies traced to editable SVG paths, and a small set of explicitly marked calibration placeholders. Art status never establishes that a building can be constructed or upgraded.

## Visual language

- Frozen preindustrial fantasy: blue-grey stone, weathered timber, snow-muted values, and restrained amber firelight.
- Keep a fixed upper-left light direction, crisp readable silhouettes, transparent backgrounds, and contact shadows in a separate layer.
- Draw structures without labels, borders, UI, smoke, or baked glow. The UI supplies those effects independently.
- Keep map sprites at a fixed 2:1 dimetric ground angle. The ground anchor and physical footprint remain data, not painted pixels.
- A UI icon is its own compact view. It may use a clearer presentation angle than the map body.

## Authoring and registration

Masters live in `assets/source/{buildings,items,terrain,units}/`. Runtime exports live in `frontend/public/assets/`. All map layers in a variant use the same 240 × 200 logical canvas and normalized ground anchor `(0.5, 0.82)` unless a manifest entry explicitly says otherwise. Trimmed exports must retain offsets to that canvas.

The building folder contains draft original masters and their exported `body`, `base`, `upper`, `shadow`, and `icon` layers. `fixture-tall-tower` and `fixture-fire-max` remain calibration/placement placeholders, not opening buildings or upgrades. Future structures should use a complete master, a consistent camera, and hand-corrected layer registration. Build new orientation views with matching light direction; do not mirror asymmetric architecture as a shortcut.

## Geometry and interaction

The source definition owns physical dimensions and placement rules. The current rectangular footprints are versioned frontend assumptions in `TERRITORY-FOOTPRINTS-V1`. Manifest art footprints, transparent bounds, shadows, upper sections, and VFX never become physical occupancy. Keep hit/occlusion shapes ground-aware and separate from the upper sprite. A missing file should use the scene's vector fallback while preserving the same anchor and physical footprint.

## Provenance and storage

Keep source provenance and license in the manifest, not the player-facing UI. Project-generated concepts used as reference studies are retained under `assets/source/concepts/`; their palette-traced SVGs contain no embedded raster. Do not use third-party game art. Large editable masters can later move to a separately managed art store if repository policy records a stable source reference and license.

## Approved visual rendering update — 2026-10-10

The registered Survival Fire progression now uses individual, painted **true SVG vector paths** adapted from the project's approved ink-fantasy art direction, not the earlier minimal geometric SVG placeholders. The six separate art identities are level families beginning at 1, 6, 11, 16, 21, and 26. They remain a **visual draft** pending detailed level-by-level art acceptance. Their master source is in `assets/source/buildings/` and runtime exports are in `frontend/public/assets/buildings/`.

The Fire stage registrations explicitly use a 480 × 400 canvas and the unchanged normalized ground anchor (0.5, 0.82), overriding the 240 × 200 canvas default for other existing assets. The manifest's optional `presentationScale` is **visual only**. It does not alter world metres, physical footprints, heat radii, construction permissions or real stage definitions. The ordinary close view uses `base` and `upper`; the active Fire adds `vfx`; plan mode shows `base` so buildings hidden behind the taller artwork can still be reached. Icons and complete-body variants are separate registered exports.

These SVG illustrations have been traced from a project-generated approved concept-art study into SVG color geometry; they contain **no raster `<image>` elements**. The layered rendering assets can be edited, although the dense paint-patch paths are best maintained alongside the approved concept master and visual comparisons. Art ownership and availability do not change because an export exists.

## Starting settlement ink artwork — 2026-10-10

Lí Lan's T0 ink portrait and full-body reference are authored in `assets/source/characters/` and exported to `frontend/public/assets/characters/`. Canon remains black hoodie, shorts, black hair, black eyes and tired expression; do not turn her into an armored fantasy protagonist without an actual in-world outfit change.

The Tomb, damaged house, repaired house, supply crate, farm house, palisade fence and timber gate each have separate 480×400 transparent SVG masters and `body/base/upper/shadow/icon` exports. The repaired house is selected by the explicit `visualState` field, not by reading the description text or creating a second building. Fence, gate and farmhouse registered fixtures are **art previews**, not T0 placed buildings or unlocked build commands. Each upper is separately hideable in plan mode. The masters are visual drafts pending review.


## Opening items, materials, and unit studies — 2026-10-10

The first item and unit illustration pass lives in `assets/source/items/` and `assets/source/units/`, with runtime copies in `frontend/public/assets/items/` and `frontend/public/assets/units/`. It covers opening materials and coffer contents, the sealed convenience bag, treasure chest grades, three distinct unit studies (Polar Farmer, ordinary Tomb Zombie, and an individual directly revived corpse), nine early ecology studies from the nearby snow hare, snow fox, mist deer, burrowing worm, wolf, crow, long-haired ox, cave bear, and feral undead. It also includes additional food-package variants from the locked bag roll table. Ecology studies are library artwork only: registration does not place or reveal a creature on the map and does not create an encounter or force. The PNG sheets in `assets/source/concepts/` are editable provenance references; the shipped SVGs use traced color geometry only and contain no `<image>` elements.

Every new item and unit entry remains `draft`. Unit gallery cards are explicitly studies and do not create forces. The unopened bag's possible contents remain absent from the demo gallery and appear there only when runtime observes those items. The game manifest preserves their artwork registrations for future inventory records. The `campfire-start` legacy asset ID now uses the active Survival Fire illustration and its former geometric placeholder master and exports were removed.

## Early settlement structure paint pass — 2026-10-10

Fifteen early structure designs were redrawn from the flat icon set as painted winter sprites: the damaged and repaired lord's hall, Tomb, supply crate, Polar Farmer farmhouse, palisade, gate, heater, kitchen, woodshop, tailor, oreworks, forge, medical station, and small shelter. Their concept sheets are registered with the building masters. Each retains its existing 480×400 canvas, anchor, placement polygon, and construction state. `body.svg` holds the editable full-color path art; the small `icon.svg`, `base.svg`, and `upper.svg` exports reference it and clip to the existing plan-mode cut. This keeps runtime layers light without embedding raster art.

## Registered map flame derivatives — 2026-10-14

The preserved `assets/source/map-effects/flame-loop-sheet.png` remains unchanged. `export-map-flame.mjs` extracts its eight painted cells, preserves uniform scale and a common foot, and creates a 512×384 transparent runtime sheet with padding. `mapFlame` on each existing Fire asset declares source/export hashes, eight frame rectangles, 10 fps, sheet anchor, relative visual width and the emitter from its existing SVG VFX ellipse. This is visual registration and creates no gameplay emitter or state. WebGL active Fire replaces its static VFX with the registered flame only after the sheet loads; failed loads and Canvas2D retain the original static indication. Planning, inactive and regional-symbol scenes do not show the flame. Reduced motion freezes frame zero and light. Draft source and scene alignment still require visual review.

## Architectural wall/gate depth slices — 2026-10-14

`assets/map-depth-slices.json` registers vertical joints for all preserved wall/gate compass poses. These derivative parts separate wall runs and gate piers from the central door section; they are not horizontal roof crops. `export-depth-slices.mjs` partitions existing body pixels losslessly, retains logical registration and adds extruded per-pose atlases. `mapDepthSlices` retains one logical owner with render-only footprint fractions and per-part silhouette hulls. Physical occupation remains the original footprint. Planning and regional representation remain single logical objects. Roof/lower-wall splits for houses, towers and other architecture are a separate unfinished art gate. Joints and real overlap still require visual review before artistic approval.
