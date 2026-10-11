# Ice Age Lord

Single-protagonist, fresh-start browser strategy/kingdom-building game inspired by the Lord DnD design project.

## Scope and status

**Design/research, deterministic simulation and React frontend prototype; not yet a complete playable application.** The plan is a React/TypeScript + HTML frontend with a deterministic, persistent game simulation. No LLM or Codex is required as a runtime game master. Lí Lan is the only playable protagonist and has the fixed SSS talent **Tử Phục Linh Sư**. The game starts at **T0, 07:00 on the frozen ancient battlefield**.

This is a **new game**: do not import earlier campaign inventories, unit rosters, learned blueprints, built structures, claimed chests, XP, quests, save logs or day-one checkpoints. Do not copy saved player actions into new-game starting conditions. The fixed seed/world geography, underlying system rules and authored events may be reused as design material after being made executable.

## Repository contents

- `references/canonical/`: original Lord DnD source rulebooks and lineage, retained **as references** (not an already-compiled runtime).
- `design/`: latest web-game content design, magical buildings and source-grounded construction proposals.
- `data/events/`: cumulative source-item CSV v7.24 with 1,682 rows through Round 95; LanaGarden Chapter 1352 is confirmed as the true ending. The cumulative source catalog JSON remains v4.6 (590 items, 239 effects) with v4.7–v7.25 addenda and the v7.2.1 metadata correction. Use LanaGarden's displayed chapter numbers and exact titles in the round audits. The fixed 30-event v0.6 timeline is unchanged. Extracted entries are not automatically obtainable in a new game.
- `research/extraction-audits/`: **all ninety-four extraction rounds**, including the Round 29 continuation addendum (v2.9.1), Round 35, Round 36, Round 38, Round 39, Round 40, Round 41, Round 42, Round 43, and Rounds 44–74 audits, with append-only research and immutable earlier releases.
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


- `data/events/EVENT-SOURCE-ITEMS-v7.5.csv`: cumulative source-item ledger through printed Chapter 1171.
- `data/events/EVENT-SOURCE-CATALOG-v7.2-ADDENDUM.json`: Round 72 receipts, events, Vietnamese edition alignment checks, and unresolved conflicts.
- `research/extraction-audits/ROUND-72-SEVENTY-SECOND-EXTRACTION.md`: Round 72 audit for Chapters 1132–1141.
- `data/events/EVENT-SOURCE-CATALOG-v7.0.1-CORRECTION.json` and `research/extraction-audits/ROUND-70-CORRECTION-v7.0.1.md`: correct the Round 70 Vietnamese chapter title alignment only; no source-item rows changed.

- `data/events/EVENT-SOURCE-CATALOG-v7.2.1-CORRECTION.json` and `research/extraction-audits/ROUND-72-CORRECTION-v7.2.1.md`: correct three Round 72 printed-chapter metadata values; quantities and interpretations are unchanged.

- `data/events/EVENT-SOURCE-CATALOG-v7.3-ADDENDUM.json`: Round 73 offers, receipts, event rules, Vietnamese edition checks, and unresolved conflicts.
- `research/extraction-audits/ROUND-73-SEVENTY-THIRD-EXTRACTION.md`: Round 73 audit for Chapters 1142–1151.
- `data/events/EVENT-SOURCE-CATALOG-v7.4-ADDENDUM.json`: Round 74 receipts, the Arena rank conflict, Vietnamese source comparison, and unresolved points.
- `research/extraction-audits/ROUND-74-SEVENTY-FOURTH-EXTRACTION.md`: Round 74 audit for Chapters 1152–1161.


- `data/events/EVENT-SOURCE-CATALOG-v7.5-ADDENDUM.json`: Round 75 item receipts, trial rewards, Abyss rules and battle context, Vietnamese edition comparison, and unresolved conflicts.
- `research/extraction-audits/ROUND-75-SEVENTY-FIFTH-EXTRACTION.md`: Round 75 audit for Chapters 1162–1171.

- `data/events/EVENT-SOURCE-ITEMS-v7.6.csv`: cumulative source-item ledger through printed Chapter 1181.
- `data/events/EVENT-SOURCE-CATALOG-v7.6-ADDENDUM.json`: Round 76 drops, SS task rewards, event rules, three-site Vietnamese edition checks, and unresolved conflicts.
- `research/extraction-audits/ROUND-76-SEVENTY-SIXTH-EXTRACTION.md`: Round 76 audit for Chapters 1172–1181.

- `data/events/EVENT-SOURCE-ITEMS-v7.7.csv`: cumulative source-item ledger through printed Chapter 1191.
- `data/events/EVENT-SOURCE-CATALOG-v7.7-ADDENDUM.json`: Round 77 chest results, relic choices, pet transformations, trial item, ascensions, and unresolved outcomes.
- `research/extraction-audits/ROUND-77-SEVENTY-SEVENTH-EXTRACTION.md`: Round 77 audit for Chapters 1182–1191.

- `data/events/EVENT-SOURCE-ITEMS-v7.10.csv`: cumulative source-item ledger through printed Chapter 1221.

- `data/events/EVENT-SOURCE-ITEMS-v7.11.csv`: cumulative source-item ledger through printed Chapter 1231.

- `data/events/EVENT-SOURCE-ITEMS-v7.12.csv`: cumulative source-item ledger through printed Chapter 1241.
- `data/events/EVENT-SOURCE-ITEMS-v7.13.csv`: cumulative source-item ledger through printed Chapter 1261 (1,438 rows).

- `data/events/EVENT-SOURCE-CATALOG-v7.13-ADDENDUM.json`: Round 83 source coverage for Chapters 1242–1251, event-rule observations, and access limitations; no new item rows.
- `data/events/EVENT-SOURCE-CATALOG-v7.14-ADDENDUM.json`: Round 84 source coverage for Chapters 1252–1261, source-number crosswalk, nine added rows, and the unresolved War Blade fragment-count gap.
- `research/extraction-audits/ROUND-83-EIGHTY-THIRD-EXTRACTION.md`: Round 83 audit for Chapters 1242–1251. The cumulative item CSV remains v7.12 because that batch produced no verified receipt rows.
- `research/extraction-audits/ROUND-84-EIGHTY-FOURTH-EXTRACTION.md`: Round 84 audit for Chapters 1252–1261; resumes at Chapter 1262.

- `data/events/EVENT-SOURCE-ITEMS-v7.14.csv`: cumulative source-item ledger through printed Chapter 1271 (1,447 rows).
- `data/events/EVENT-SOURCE-CATALOG-v7.15-ADDENDUM.json`: Round 85 source coverage for Chapters 1262–1271, nine appended item/transfer records, and catalog cross-checks.
- `research/extraction-audits/ROUND-85-EIGHTY-FIFTH-EXTRACTION.md`: Round 85 audit for Chapters 1262–1271; resumes at Chapter 1272.

- `data/events/EVENT-SOURCE-ITEMS-v7.15.csv`: cumulative source-item ledger through printed Chapter 1281 (1,471 rows); corrects unsupported quality labels for two prior material rows while preserving the previous release.
- `data/events/EVENT-SOURCE-CATALOG-v7.16-ADDENDUM.json`: Round 86 source coverage for Chapters 1272–1281 and 24 appended item/evolution records, including first-/second-kill Cleaner rewards.
- `research/extraction-audits/ROUND-86-EIGHTY-SIXTH-EXTRACTION.md`: Round 86 audit for Chapters 1272–1281; resumes at Chapter 1282.


- `data/events/EVENT-SOURCE-ITEMS-v7.16.csv`: cumulative source-item ledger through printed Chapter 1291 (1,496 rows), including post-Cleaner inventory reconciliation, six World Protector Marks, opened chest outcomes, pooled Botier battle-loot transfers, and item transformations.
- `data/events/EVENT-SOURCE-CATALOG-v7.17-ADDENDUM.json`: Round 87 source coverage for Chapters 1282–1291, additional independent title/body-source checks, and resolved Round 86 medal omission with remaining item-quality and quantity gaps preserved.
- `research/extraction-audits/ROUND-87-EIGHTY-SEVENTH-EXTRACTION.md`: Round 87 audit for Chapters 1282–1291; resumes at Chapter 1292.

- `data/events/EVENT-SOURCE-ITEMS-v7.17.csv`: cumulative source-item ledger through printed Chapter 1301 (1,518 rows), including True-God Ancient Dragon first-kill rewards and drops, Godhead assignments, the Light-Dark Dragon pet, and pooled battle-loot transfers.
- `data/events/EVENT-SOURCE-CATALOG-v7.18-ADDENDUM.json`: Round 88 source coverage for Chapters 1292–1301, with recipient and progression outcomes confirmed and reward-attribution uncertainties preserved.
- `research/extraction-audits/ROUND-88-EIGHTY-EIGHTH-EXTRACTION.md`: Round 88 audit for Chapters 1292–1301; resumes at Chapter 1302.

- `data/events/EVENT-SOURCE-ITEMS-v7.18.csv`: cumulative source-item ledger through Round 89 (1,543 rows); adds first-True-God rewards, the opened Everfrost Crown chest, two skill acquisitions, explicit battlefield loot and disassembly outputs, and later loot batches.
- `data/events/EVENT-SOURCE-CATALOG-v7.19-ADDENDUM.json`: Round 89 chapter outcomes, receipt groups, and source checks for Chapters 1302–1311, with alternate catalog numbering aligned by exact title.
- `research/extraction-audits/ROUND-89-EIGHTY-NINTH-EXTRACTION.md`: Round 89 audit through Chapter 1311; resumes at Chapter 1312 / SX-1544.

- `data/events/EVENT-SOURCE-ITEMS-v7.19.csv`: cumulative source-item ledger through Round 90 (1,581 rows), covering inheritance rewards and assignments, tower-trial rewards, synthesis, transformations, and item evolution in LanaGarden Chapters 1312–1321.
- `data/events/EVENT-SOURCE-CATALOG-v7.20-ADDENDUM.json`: Round 90 outcomes and explicit unresolved chest, stock, and assignment details.
- `research/extraction-audits/ROUND-90-NINETIETH-EXTRACTION.md`: Round 90 audit; resumes at LanaGarden Chapter 1322 / SX-1582.

- `data/events/EVENT-SOURCE-ITEMS-v7.20.csv`: cumulative source-item ledger through Round 91 (1,615 rows), including fourth- and fifth-floor trial rewards, Huang Tian armor restoration, sixth-floor final rewards, and global buffs from LanaGarden Chapters 1322–1331.
- `data/events/EVENT-SOURCE-CATALOG-v7.21-ADDENDUM.json`: Round 91 outcomes, world-wide trial effects, and final-reward attribution notes.
- `research/extraction-audits/ROUND-91-NINETY-FIRST-EXTRACTION.md`: Round 91 audit; resumes at LanaGarden Chapter 1332 / SX-1616.

- `data/events/EVENT-SOURCE-ITEMS-v7.21.csv`: cumulative source-item ledger through Round 92 (1,655 rows), including four-tower reward reconciliation, battlefield returns, temple rewards, True God breakthroughs and the final invasion event launch from LanaGarden Chapters 1332–1341.
- `data/events/EVENT-SOURCE-CATALOG-v7.22-ADDENDUM.json`: Round 92 chapter index, reconciled fragment totals and final invasion event mechanics.
- `research/extraction-audits/ROUND-92-NINETY-SECOND-EXTRACTION.md`: Round 92 audit; resumes at LanaGarden Chapter 1342 / SX-1656.

- `data/events/EVENT-SOURCE-ITEMS-v7.22.csv`: cumulative source-item ledger through Round 93 (1,676 rows), covering the invasion counteroffensive, boss drops, Unity rewards, final campaign mechanics, and postwar recovery from LanaGarden Chapters 1342–1351.
- `data/events/EVENT-SOURCE-CATALOG-v7.23-ADDENDUM.json`: Round 93 chapter index, receipt groups, and campaign outcome notes.
- `research/extraction-audits/ROUND-93-NINETY-THIRD-EXTRACTION.md`: Round 93 audit; completed by the final source review in Round 94.

- `data/events/EVENT-SOURCE-ITEMS-v7.23.csv`: immutable Round 94 historical ledger, retained for traceability.
- `data/events/EVENT-SOURCE-CATALOG-v7.24-ADDENDUM.json` and `research/extraction-audits/ROUND-94-NINETY-FOURTH-EXTRACTION.md`: historical Round 94 checkpoint, superseded by the final-chapter correction.
- `data/events/EVENT-SOURCE-ITEMS-v7.24.csv`: corrected cumulative 1,682-row ledger through true final Chapter 1352.
- `data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json`: final chapter index, Airam transfers and Round 94 retractions.
- `research/extraction-audits/ROUND-95-FINAL-CHAPTER-CORRECTION.md`: final source review; Chapter 1352 is the true ending and no later chapter is processed.
