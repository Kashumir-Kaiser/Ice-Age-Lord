# Stage 05 — Map, exploration, and logistics

## Scope and source authority

Stage 05 implements player movement over known routes, spatial visibility and memory, fixed-time search, chest discovery, resource reservations, harvesting trips, and movement of items between accessible containers. The server owns all position, time, discovery, reservation, and extraction outcomes. The browser only requests previews and renders the returned player view.

The implementation uses these repository authorities:

| Mechanic | Authority |
|---|---|
| Eight route identities, endpoints, source distances, resource nodes, quantities, access conditions, and fixed chest identities | `references/canonical/LORD-DND-03.md` §§3.K.4–3.K.7 |
| Fixed chest search, score, concealment, grade, and stable identity rules | `references/canonical/LORD-DND-03.md` §§26.9–27.3 and `references/canonical/LORD-DND-04.md` §18.10 |
| Known terrain boundaries and unresolved chest access/reward data | `docs/implementation/STAGE-02-AUTHORITY-MATRIX.md`, Stage 02 and Stage 04 reports |
| Walking speed, off-route connectors, interaction/sight/signal distances, and light penalties | Versioned design overlay `LL01-NAVIGATION-OVERLAY-1.0` in `packages/content/src/navigationOverlay.ts` |

Source route distances and endpoint identities remain separate from the overlay geometry and its decisions. The overlay uses a deterministic midpoint to represent each source distance between its known endpoints; it does not assert a surveyed path or terrain profile.

## Runtime behavior

- Game state schema 3 persists player and unit positions, active and completed travel orders, known routes, explored circles, search jobs and sweep history, chest signals and discovery, resource balances, harvest jobs, and item transfers. Schema 1 and 2 saves upgrade through the new schema using the pinned world package.
- Movement plans can use only route edges already known to the player. A nearby off-route segment may connect to a known route within 2 km; a direct trip within 2 km can proceed as uncertain travel. Longer movement without a known route is rejected. Surface elevation changes do not count as separate underground layers; locations below the compiled surface access threshold remain blocked.
- The authoritative simulation clock integrates movement progress and settles route segment ends. Cancellation leaves the actor at the server-settled current position. Arrival adds routes encountered during travel to the player’s route memory.
- Sight, signal proximity, and explored geometry update from actor positions at simulation boundaries. Map camera movement and destination previews do not reveal map state. Resource amounts remain hidden until a known resource is inspected; inspection makes its exact server ledger visible.
- Search runs in fixed 15-minute sweeps. The search envelope is bounded to 2 km, and Li Lan’s current sweep width is derived from the compiled perception value. Revisited 10 m cells are counted as repeated area. A passing tick reveals at most one chest, chosen by distance then stable chest ID. Detections produce stable, approximate signal markers; inspection reveals the exact chest identity. Search does not invent candidate rewards.
- Harvesting is available for open-surface wood and stone when the actor carries the required source-listed tool. The job reserves source quantity, works for one hour per resource unit, respects a 20-unit carried-resource limit, and returns cargo at the loaded travel speed. Cancellation releases unextracted reservations. Container transfers require both locations to be accessible and preserve item totals.
- Daily resource quotas reset at world midnight. Water preparation, coal prospecting, and salt workforce/fuel requirements remain unavailable because their execution contracts are not compiled.
- The map and inventory panels show route paths, the player position, sight/exploration overlays, focused-search paths and results, harvest progress, current cargo, resource balances, and movement/search cancellation controls. The map requires an explicit destination selection, preview, and travel confirmation.

## Chest and source blockers retained

- Chest opening returns `CHEST_LOOT_CANDIDATE_POOL_NOT_COMPILED`; detection and identification do not create or reveal loot.
- Search eligibility currently excludes source access statements that explicitly identify a seal, deep location, ownership claim, quest lock, or collapse hazard. A compiled access taxonomy is still needed before broader chest interaction.
- The runtime still carries `OPENING_WEATHER_RECORD_NOT_SEEDED` and `INITIAL_FUEL_AMOUNT_NOT_SPECIFIED`: File 03/06 require campaign-seeded hourly weather and a hidden starter-fuel ledger, but neither seed is materialized in the active world package. Stage 05 does not fabricate or add those values.
- Visibility uses the versioned circular range model and light-phase penalties. Terrain occlusion and a compiled line-of-sight map are not available in the selected source data.
- Water, coal, and salt source balances are maintained, but their production actions remain blocked by their source requirements. The listed source quantities are ledger capacities, not fabricated player knowledge.

## Verification

Passed locally:

```text
npm run content:compile   38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 scheduled events
npm run test:stage02      9/9
npm run test:stage04      11/11
npm run test:stage05      6/6
```

Stage 05 tests cover schema migration, source-distance geometry, known-route restrictions, uncertain local movement, mid-route attachment, progress/cancellation, fixed search ticks and revisit history, approximate-to-exact signal discovery, chest opening blockers, harvest reservations/cargo/conservation/cancellation, and backup import during active movement.

The Stage 03 HTTP suite could not bind its loopback test server in this workspace. Frontend build, unit tests, and browser screenshot capture could not run because `npm ci` failed with npm’s `Exit handler never called!` error; the offline cache also lacks locked packages. The partial install left no usable `tsc`, Vite, or Playwright binaries. Therefore `docs/implementation/screenshots/stage-05-map.png` has not been generated in this environment.
