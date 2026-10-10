# Survival Fire · Ink-Painted Vector Pass (2026-10-10)

These files are the actual game-loadable assets for the existing `survival-fire-l01/l06/l11/l16/l21/l26` IDs. They replace the former low-detail procedural icons. The active art originates in the Ice Age Lord visual-study illustration authored for this project; the painting was converted into dense **SVG color paths**, with no embedded raster images, and then registered using the existing layer contracts.

Each level family's master: `assets/source/buildings/survival-fire-lXX.svg`. Runtime layer files: `frontend/public/assets/buildings/survival-fire-lXX/{body,base,upper,shadow,icon,vfx}.svg`.

The painted snow at the feet of each building is part of the visual environment, not new terrain or physical occupancy. Heat, dimensions, level transitions and effects remain controlled by runtime state. Flame-colored color patches are a separately toggled VFX layer; the unlit body was reconstructed without the main active flame. Base/upper images follow a stable screen-space cut line for planning-mode visibility; this is an interaction tool, not an architectural construction requirement.

Each illustration was reviewed at 480×400 vector master scale, and at approximately 200×175 game-detail scale for all six stages and fire-on/off examples. In a follow-up art-authoring pass, specific perimeter details, snow cutout edges and combustion cavities can be refined without changing the manifest identities.

**Status:** Art direction draft (sign-off still needed). All SVGs validate as XML, render as PNG in a test renderer, have transparent surrounding bounds, preserve logical canvas, and contain no raster `<image>` child. No backend/campaign state is changed.
