# Ice Age Lord

Single-protagonist, fresh-start browser strategy/kingdom-building game inspired by the Lord DnD design project.

## Scope and status

**Design/research, deterministic simulation and React frontend prototype; not yet a complete playable application.** The plan is a React/TypeScript + HTML frontend with a deterministic, persistent game simulation. No LLM or Codex is required as a runtime game master. Lí Lan is the only playable protagonist and has the fixed SSS talent **Tử Phục Linh Sư**. The game starts at **T0, 07:00 on the frozen ancient battlefield**.

This is a **new game**: do not import earlier campaign inventories, unit rosters, learned blueprints, built structures, claimed chests, XP, quests, save logs or day-one checkpoints. Do not copy saved player actions into new-game starting conditions. The fixed seed/world geography, underlying system rules and authored events may be reused as design material after being made executable.

## Repository contents

- `references/canonical/`: original Lord DnD source rulebooks and lineage, retained **as references** (not an already-compiled runtime).
- `design/`: latest web-game content design, magical buildings and source-grounded construction proposals.
- `data/events/`: the 548-entry Round 43 **v4.3** source-research inventory with 215 source effect records through Chapters 842–851; a separate v0.8 structure catalog records twenty observed or reported source structures, the unchanged 30-event v0.6 timeline and review CSV. Immutable v3.0 and earlier releases remain archived. Extracted entries are not automatically obtainable in a new game.
- `research/extraction-audits/`: **all forty-three extraction rounds**, including the Round 29 continuation addendum (v2.9.1), Round 35, Round 36, Round 38, Round 39, Round 40, Round 41, Round 42, and Round 43 audits, with append-only research and immutable earlier releases.
- `research/snapshots/`: chronological catalogs and design versions retained for traceability.

## Authority / migration rules

1. `references/canonical/` is historical campaign source, including generic catalogs and role systems now being **retired for the new game's player-facing design**; don't accidentally activate those old generic pools.
2. The latest design and event extractions are **proposals/research datasets**, not a complete, tested game engine. Source-verified facts, campaign-fixed rules, and game-specific design suggestions must stay distinguished.
3. Preserve the single fixed talent, actual eligible corpse identities, free Tử Phục, special direct-revive XP mirror and distinction from Ngôi Mộ output.
4. The event calendar is a **fixed pre-game schedule** based on the reconciled v0.6 timeline. Shop inventories and chest rewards require explicit acquisition/stock/expiry/loot contracts. Never guarantee an observed chest item merely because one source opening contained it.
5. Do not quietly combine conflicting versions of the old Lord DnD source files; consult the release manifest and use explicit versioned game conversions instead.
6. All starting progress is generated from a **clean T0 initializer**, never from archived LL01 gameplay.

## Development plan

1. Normalize the authoritative initial-state/world and event registries into typed, versioned game data.
2. Implement a pure deterministic simulation (resource conservation, construction, assignment/jobs, survival, combat, chest receipts, quest/event state, and saves).
3. Build the React browser client (settlement map, building inspector, workers/armies, inventory, expedition map, crafting, event shop).
4. Validate end-to-end cold-start gameplay against fixed world, talent, construction and event tests before adding advanced content.

## Source and commercial-use notice

These research files contain source-derived material and references to a third-party novel. They are **not a grant of intellectual-property rights**. Obtain permissions or create original names/assets/lore before any public/commercial redistribution.

See `docs/FRESH_START.md` and `docs/CONTENT_INDEX.md` for import priorities and exclusions.

## Frontend and assets

The React/Vite visual demo now lives in `frontend/` on `main`. It uses the original layered asset pipeline in `assets/` and `frontend/public/assets/`. Run `cd frontend && npm ci && npm run build` to synchronize registered assets and verify the production bundle. The ink / semi-realistic visual policy is in `assets/README.md`; the SVG Fire stage art is registered in `assets/manifest.json`. This UI still has a demo adapter and does not represent game state from the backend until integrated.
