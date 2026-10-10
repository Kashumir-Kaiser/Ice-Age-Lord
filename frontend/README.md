# Ice Age Lord frontend prototype

The interface consumes the local demo `GameClient` projection. It does not connect to a game server or save campaign state.

Run `npm run assets:sync` before serving when registered art exports change. Build and dev startup validate `assets/manifest.json` and publish the manifest alongside the optimized SVG exports.

See the repository [asset art direction and registration guide](../assets/ART-DIRECTION.md) and the [isometric territory implementation report](../docs/implementation/TERRITORY-ISOMETRIC.md).

## Ink-style Survival Fire asset progression

The frontend loads the actual registered six representative Fire artworks from `assets/manifest.json` using `fireProgression`. Each stage has its own `body`, `base`, `upper`, `shadow`, `icon` and separable `vfx` SVG. The `fireLevel` in `SettlementView` selects the representation; this changes **art only**, never canonical construction, size, fuel or warmth. At the clean T0 start the level-1 stage is selected. Extinguishing Fire removes the emission layer without destroying the object. Art masters remain a draft visual direction pending source-accurate individual level detail.

## Opening winter-ink artwork (draft)

The production SVG pipeline now contains distinct layered artwork for Ngôi Mộ, damaged and repaired Nhà Lãnh Chúa, the original supply crate, Nhà Nông Phu Cực Địa Cấp 1, opening Tường Rào and Cổng. Masters live in `assets/source/buildings/`; runtime `body/base/upper/shadow/icon` layers live in `frontend/public/assets/buildings/`, registered in `assets/manifest.json`.

T0 retains only its four actual structures. Additional art is accessible as **visual-only, local planning/calibration fixtures** and never grants construction rights or resources. A repaired lord house is not a new building: `SettlementBuildingView.visualState='repaired'` switches the rendered appearance of the *same building instance* when the authoritative runtime provides that state; its T0 default is `damaged`.

Source confirms a 10 m fence segment and 3 m wide gate; preview depth and other example footprints remain frontend assumptions, not canonical dimensions. Full art QA is still required before raising `status` from `draft`.
