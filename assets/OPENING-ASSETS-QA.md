# Winter-Ink Opening Artwork — QA and Provenance

The artwork in `assets/source/buildings/` is source-registered *visual content*, not game-state authority. T0 contains only Lửa Sinh Tồn, Nhà Lãnh Chúa Hư Hại, Ngôi Mộ and the starting supply container. Repaired Lord's House is a visual state of the same instance. All other built-in construction drawings are unowned preview assets until source-authoritative building state appears.

## Render contract

- Character portraits are **ink**, not semi-realistic combat-unit art. Lí Lan T0 wears a black hoodie and shorts; she is not in armor.
- Building SVG: 480×400 viewBox, ground anchor (0.5, 0.82), 2:1 dimetric appearance; independent body, lower base, upper, contact shadow, detailed icon and compact district exports. No raster images inside SVG.
- `district.svg` is simplified from `body.svg` by removing only small ink-hatch overlays. It is used at zoomed-out territory LOD, keeping the same canvas and anchor.
- The renderer's physical placement and heat geometry remain authoritative. Art footprints, example depth and presentation scales do not change gameplay.
- Source Tường Rào is a 10 m wooden fence section; source Cổng is 3 m wide. Other unverified art preview dimensions are not canonical.
- Placement palette entries are visual-only local drafts. Their previews do not consume resources, build structures or introduce new player-owned objects.
- Structure `visualState='repaired'` swaps house appearance without changing instance identity.

## Validation

Run `cd frontend && npm ci && npm run build && npm test`, plus screenshot comparison of normal, focus, planning, mobile and dense settlement scenes. The art remains draft until actual visual approval. Keep `assets/manifest.json` and `frontend/public/assets/manifest.json` identical. The source-of-truth manifest is synchronized by `frontend/scripts/sync-assets.mjs` during build.

Visual derivation: manually authored original SVG winter-ink fantasy, harmonized to the approved Survival Fire aesthetic. No third-party copyrighted art is embedded.
