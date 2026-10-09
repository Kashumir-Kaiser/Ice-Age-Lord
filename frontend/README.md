# Ice-Age-Lord · Map/UI prototype (feature branch only)

This React/Vite frontend demonstrates maps and presentation-state interactions. It does **not** run the LL01 event engine, spend resources, perform exploration turns, persist progress, or mutate canonical source data. The opening map and the active territory are separate from earlier playable campaign saves.

## Run

From an **existing** isolated frontend worktree:

```bash
git pull --ff-only origin frontend/demo-ui-v0
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. To create that separate worktree for the first time, from the main checkout use `git fetch origin frontend/demo-ui-v0 && git worktree add ../Ice-Age-Lord-frontend origin/frontend/demo-ui-v0`.

## Map geography and provenance

- Coordinates for 38 fixed sites, 10 contender anchors, 41 chest-cache centers, eight route endpoints and five major resource sites come directly from `references/canonical/LORD-DND-03.md` §3.K.4–3.K.7, transcribed into `src/canonicalGeography.ts`. Fire radii are taken from `LORD-DND-01`, with 10 m at Cấp 1 and 25 km at Cấp 30. CI compares those tables against the sources.
- The initial scene is the **frozen Sora–Trevil battlefield plain**, with low slopes, old defensive trenches and exposed relic fragments. The sources describe the opening surface as open plain and give a canonical timber forest **4.7 km east and 6.8 km south** of H0. They do *not* lock a precise nearby treeline polygon. The prototype adds a **modeled southeastern transition woodland near the camp**, retaining the fixed named timber forest at its original coordinate. These illustrative groves, streambank curves and detailed contour shapes are **not new canonical terrain facts**.
- To make a populated and usable visual prototype, `src/worldFeatures.ts` deterministically adds modeled spots for wood, rock, ore, herbs, ice and salvage. **Their initial reserves are invented presentation fixtures**, clearly labeled “DỰNG THÊM” in the inspector; they are not a newly committed authoritative campaign loot registry. Canonical resources have a different provenance badge.
- Lighting now controls terrain and **physically apparent** surface features in ordinary map mode. Some buried or sealed chest caches remain hidden until scouting, even if the firelight covers their coordinates. Visible chest signs are not opened loot or discovered treasure contents. Inspector labels hide unverified identities unless the user enters source/debug view.
- At far zoom, nearby markers are **visually clustered by resource type** with counts. Zoom into the local map to inspect separate sites. This does not merge resources, chest instances or state.

## Controls

- Hold and drag to pan; mouse-wheel zoom is captured on the map and **does not scroll the page**.
- **Xem toàn bộ vòng nhiệt** always fits the full heat circle **within the local map camera**. It does **not** switch to world map, including at Cấp 30. The world map can be selected directly by button, or triggered by zooming **out deliberately** until the viewed region has a meaningful geographic span. This avoids switching for a 10 m starting fire.
- The LL01 world map shows a 96 km active-world radius; unexplored areas remain in fog. Daytime terrain visibility extends beyond firelight. At night the visible area contracts to the source-defined active firelight radius. Day visibility falloff remains presentation-only, not canon weather data.
- **Time speeds:** Frozen (default), 1×, 2×, 5× or custom 0.1×–3600×, in the header. A globally shared display clock advances with the chosen multiplier; the map's light phase reads the same clock, including crossing sunset and dawn. **No world events or resource consumption occur until a deterministic runtime is integrated.** Visible day count replaces the development `T0` tag.
- The left navigation scrolls independently and its two-line brand fits the sidebar, even in narrower desktop layouts.

## CI and snapshots

GitHub Actions runs TypeScript/Vite build, unit tests, source-table audits and desktop/mobile Playwright browser interaction tests after frontend pushes. Screenshot QA captures the **1280 px desktop sidebar**, **25 km heat map**, and **battlefield–forest edge** views and attaches JPEGs to the Playwright report; failed runs preserve traces/screenshots.

The workflow includes `0 17 * * *` for 00:00 in Vietnam. GitHub only executes scheduled workflows from the **default branch**; this scheduling trigger remains inactive while isolated exclusively to the frontend feature branch. `main` is deliberately not edited.

## Runtime contract to implement later

Server-side `PlayerView.visibleMap` must knowledge-filter canonical locations before serialization. The static browser demo currently embeds canonical registries and therefore is **not security-proof against developer-tools inspection**. The production runtime should persist campfire fuel/state, player sight, explored cells, depleted resource balances and actual world time; this prototype deliberately does not claim those features are working.
