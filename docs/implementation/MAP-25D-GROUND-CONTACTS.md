# Map ground contact coverage

The map uses two footprint-based ground treatments. Both are presentation only
and read the projected building geometry; neither changes simulation state.

`MapRenderer.updateContacts()` registers only placed buildings that have an
asset. Draft layouts and QA fixtures are excluded. It uses the physical
footprint dimensions and swaps width/depth for east/west orientations.
`GroundContacts` buckets these rectangles in 32 metre cells. Its normalized
ellipse follows each footprint, extends 1.8 metres beyond the half-width and
half-depth, and applies a smoothstep blend up to 0.6. `TerrainSampler` uses that
blend to shift the existing snow material weights toward the two existing dirty
snow materials. Moving or removing a building invalidates the old and new
footprint bounds with a 2 metre margin. This is the fitted scuff treatment; it
does not create persistent walk paths or alter the world model.

`map-ground-shadow.mjs` builds a soft contact kernel from the registered
physical rectangle, ground anchor, and orientation. It draws a tight polygon
and a slightly offset softer polygon, with no guessed caster height. The map
exporter uses this kernel for assets with a ground registration and for assets
with registered depth joints. Those exports are rendered at close and district
sizes, and their manifest entries retain the physical footprint registration.
Other assets keep their authored shadow artwork. Renderer composition places
the shadow beneath the upright object layers.

The map already uses its authored periodic snow and dirty-snow materials for
these blends. It therefore does not need separate per-asset snow-rim or scuff
textures, which would duplicate those material masks without adding footprint
information.
