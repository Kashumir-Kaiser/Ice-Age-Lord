# Ice Age Lord — frontend map prototype

The app is a **read-only UI prototype** on `frontend/demo-ui-v0`. It does not advance the campaign clock, change FireLevel, discover hidden locations, consume resources, award chests, alter saves or overwrite the ongoing source extraction.

## Run locally

Use a **separate frontend worktree** so the main extraction worktree is unaffected:

```bash
git fetch origin frontend/demo-ui-v0
# If the frontend worktree already exists:
cd ../Ice-Age-Lord-frontend
git pull --ff-only origin frontend/demo-ui-v0
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. If you have not created a worktree, use `git worktree add ../Ice-Age-Lord-frontend origin/frontend/demo-ui-v0` from your original repository.

## Geography: canonical point records, schematic interpolation

- `src/canonicalGeography.ts` transcribes **WORLD-PACKAGE-LL01-1.0** in `references/canonical/LORD-DND-03.md`, §3.K.4–3.K.7: 38 fixed site coordinates, 10 player anchor coordinates, 41 chest caches, eight specified route endpoints, five resource records and the **96 km local map radius**. Coordinates are in *metres*, +X east and +Y north, origin at H0.
- Four opening structures use **exact point locations**: fire (0,0), damaged house (40,20), supply chest (30,-10), and tomb (-20,30), all in metres.
- Source heights and some terrain descriptions are fixed, but the source does **not** provide a complete polygon raster, DEM/elevation field, river bank geometry, slope curves, or exact road polylines. Consequently the decorative ice shading, wind-swept surfaces and region coloring are *artistically schematic*, **not new canonical geometry**. Road endpoints alone are not enough to infer a legal traversable route.
- Before campaign integration, move the full private registry out of the shipped client, and supply only server-side *knowledge-filtered* `PlayerView.visibleMap` records. This standalone prototype bundles source records for developer inspection and **is not a secure fog-of-war implementation against devtools inspection**.

## Map controls

- **Drag:** hold left mouse button and drag; panning never counts as exploration.
- **Zoom:** wheel while hovering the map (native non-passive listener blocks page scrolling) or use +/- controls.
- **World map:** button **Bản đồ thế giới** shows the complete 96 km active-region frame, but unrevealed ground remains dark. Zooming out sufficiently to include the entire firelight circle also switches to world view; **Bản đồ địa phương** returns to the starting scale.
- **Light and fog:** source `FireLevel 1→30` heat radii in `mapModel.ts` (10 m → 25 km) reveal **all terrain within the projected light zone**. The intensity tapers only **after** the actual heat boundary. At night (17:00–07:00), visible terrain contracts to this circle. At dawn/daylight (07:00–16:30), the sight preview extends beyond the fire; twilight runs 16:30–17:00. Day sight values (260 m clear, 680 m fade) are presentation defaults, **not claimed canon weather visibility**.
- **Atlas nguồn (debug):** optional developer inspector for canonical resource anchors and cached chest groups. Displays *T0 source capacities* such as 780 timber and 1,240 stone, **not balances produced by gameplay**. Does not reveal chest contents or mutate world state. Ordinary player view never shows these unobserved icons.
- **Sidebar:** the seven pages remain independently scrollable in desktop or mobile mode, even at short window heights.

## Testing and CI

Run `npm run build`, `npm test`, `npm run test:e2e`. The GitHub Actions workflow runs for **every push** to the frontend branch; desktop and mobile Chromium E2E checks cover visibility, wheel zoom, drag, source geography, switch to world map, heat values, sidebar usability and inspector knowledge gates. It uploads test screenshots/traces if a browser test fails.

`frontend-demo.yml` contains cron `0 17 * * *` for **00:00 Asia/Ho_Chi_Minh**. **GitHub executes schedules only from the default branch**; it will not run nightly while the workflow exists *only* on `frontend/demo-ui-v0`. This restriction is intentional until permission is given to add a lightweight CI entrypoint to `main`—no changes have been made there.

## Future runtime integration

Expose `PlayerView(version, worldTime, visibleMap, inventory, units, buildings, notifications)` filtered server-side. Initial knowledge includes only H0 and objects within sensory reach; new visibility must come from resolved exploration/line-of-sight observations. A fire upgrade changes illuminated geometry, **not player authorization to know concealed loot or inaccessible sites**. Authoritative extraction remains in `research/`, `data/`, `design/`, and `references/`, wholly unaffected by frontend work.
