# Ice Age Lord frontend

The default route (`/`) is the Ice Age Lord main menu. **Trò chơi mới** creates a real SQLite save through the local API after owner authentication; **Tải lượt lưu** lists and opens an existing server save. Neither entry silently resumes the remembered slot. Existing direct links at `?mode=live` retain last-save restoration for compatibility.

**Bản demo** is an isolated in-memory visual fixture, never an alternative save provider. It is accessible in `npm run dev` (or QA builds explicitly configured with `VITE_ENABLE_DEMO=true`), and is hidden from standard shipping bundles. No demo state migrates into real saves.

## Windows local startup

Use Node.js **24 or newer for the complete game** (the root runtime requires 24). Node 22 can launch the frontend but does not satisfy the root runtime's declared engine requirement.

From PowerShell at the repository root:

```powershell
git fetch origin
git switch codex/frozen-throne-landing
git pull --ff-only
cd frontend
npm ci
npm run dev
```

`npm run dev` invokes the `predev` asset sync and opens the frontend. It does **not** start the live SQLite API. In a second PowerShell terminal at the repository root, use `npm run local:start` after installing frontend dependencies; this starts the API and Vite together, runs database migrations and creates the local owner key if it does not exist. Access the owner key from `.local/owner-key`; never paste it into GitHub issues or commit it.

If you only want to verify the Windows asset pipeline without starting Vite, run `npm run assets:sync` from `frontend/`. Both build and dev startup validate `assets/manifest.json` plus registered SVG/PNG atlas hashes. Native filesystem conversion uses `fileURLToPath()`, not URL `.pathname`, and Git attributes preserve exact LF text bytes on Windows.

Run `npm run assets:map` **only when regenerating** authored 2.5D map derivatives. This is not required for normal start-up or the reviewed main menu.

See the repository [asset art direction and registration guide](../assets/ART-DIRECTION.md) and the [isometric territory implementation report](../docs/implementation/TERRITORY-ISOMETRIC.md).

## Ink-style Survival Fire asset progression

The frontend loads the actual registered six representative Fire artworks from `assets/manifest.json` using `fireProgression`. Each stage has its own `body`, `base`, `upper`, `shadow`, `icon` and separable `vfx` SVG. The `fireLevel` in `SettlementView` selects the representation; this changes **art only**, never canonical construction, size, fuel or warmth. At the clean T0 start the level-1 stage is selected. Extinguishing Fire removes the emission layer without destroying the object. Art masters remain a draft visual direction pending source-accurate individual level detail.

## Opening winter-ink artwork (draft)

The production SVG pipeline now contains distinct layered artwork for Ngôi Mộ, damaged and repaired Nhà Lãnh Chúa, the original supply crate, Nhà Nông Phu Cực Địa Cấp 1, opening Tường Rào and Cổng. Masters live in `assets/source/buildings/`; runtime `body/base/upper/shadow/icon` layers live in `frontend/public/assets/buildings/`, registered in `assets/manifest.json`.

T0 retains only its four actual structures. Additional art is accessible as **visual-only, local planning/calibration fixtures** and never grants construction rights or resources. A repaired lord house is not a new building: `SettlementBuildingView.visualState='repaired'` switches the rendered appearance of the *same building instance* when the authoritative runtime provides that state; its T0 default is `damaged`.

Source confirms a 10 m fence segment and 3 m wide gate; preview depth and other example footprints remain frontend assumptions, not canonical dimensions. Full art QA is still required before raising `status` from `draft`.
