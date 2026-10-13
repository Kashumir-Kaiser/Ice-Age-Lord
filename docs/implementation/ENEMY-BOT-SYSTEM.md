# Persistent enemy lords

## Active contract

New saves generate 1,023 bots plus Lí Lan. The nine fixed opening rivals keep their IDs and names and occupy their population slots exactly once. The P0 tier quotas are S 2, A 51, B 205, C 358 and D 407; the two named S rivals consume both S slots. Talent types are combat (512) and production (511), with a seeded spare-slot rule. The reviewed affinity mapping is HUNTER/WARLORD/CONTROL → combat and SUPPORT/BUILDER/TRADER/EXPLORER → production, which gives the two named S rivals one specialist of each type. The bot talent cap is S; it does not change Lí Lan's SSS talent. The tier/type mapping, initial settlement overlay, seed inputs and ruleset hashes are versioned in code.

Generation is deterministic from the save seed, generation version and ordinal. It assigns stable IDs, regions, legal spaced locations, finite resources, workers, a starting cohort, structures and finite search sources. Nine opening identities use the established `RC-002` through `RC-010` names/IDs; generated identities use `BOT-P0-*`. Stress populations use an explicitly labeled benchmark profile and do not change P0 new-game size.

## Runtime and persistence

`packages/sim/src/bots/` separates population state, generation, blueprint eligibility, bounded planning, economy, combat and movement. Hot fields are numeric typed-array SoA rows in 256-bot chunks; names, plans, structures, cohorts, routes, knowledge and receipts are cold records. Stable phase offsets distribute ordinary reviews across a three-second simulation-time lattice. A deterministic scheduler and fixed GOAP expansion/depth caps choose actions independently of host speed. Analytical fixed-point segments stop at action, resource, travel, construction, starvation, exposure, or other modeled boundaries.

Actions use finite resource sources and persistent receipts. Bots gather, build, recruit, search finite sources, scout, hunt shared regional prey, deliver raid cargo, raid known targets, repair raid-damaged structures, equip cohorts at a workshop, recover wounds, defend and retreat from unfavorable engagements. Buildings require learned blueprints, prerequisites, resources, worker time and a legal available footprint. Searches and loot key their results by stable action ID and rules version. Bot/player and bot/bot battles use the shared casualty resolver with the bot talent applied to the relevant combat contribution once. Routes and cohort counts persist when a bot is not visible.

Committed activity XP is also talent-adjusted using fixed-point permille values. The base award comes from the resolved action and its real outcome; the talent multiplier is applied once and both values are stored in the action receipt. S combat earns 2.00× base XP and S production earns 0.65×; A through D have their own decreasing, type-specific rates. These are explicit balance values in `BOT-TALENT-XP-P0-1.0` and the action XP version, included in the population ruleset hash. They do not create XP without a committed action. The 144-hour benchmark reports actual XP, levels and level-10 qualification per grade/type so action-frequency effects remain visible alongside the per-action multiplier.

Only the current/new-save opening level board uses this bot population. Level 10 qualification comes from committed XP receipts, and the public snapshot retains the source contract's T+48h opening, T+144h closing, three-minute publication delay, tie ordering and 100-row cap. Snapshots contain public identity and score only. Old saves keep their prior rival ledger; migration sets the bot population to null rather than inventing a historical bot economy.

SQLite stores the aggregate save and a sidecar table of canonical bot chunks in the same revision transaction. The root hash, chunk hash and row hashes are checked during load; unchanged sidecar chunks are not rewritten. Checkpoints and backup import/export include the population. Backups keep the existing ledger format and validate before import. Bot scheduler events are private; the API exposes only safe projected events, and live map/inspection data follows existing sight/knowledge restrictions.

The world map shows actual current settlement, army and scout-party sightings. Scout parties travel on stored routes, survey, reveal contacts and return; inspection does not reveal hidden state. The UI can inspect known bot settlements and actual listed structures/cohorts/resources at the permitted knowledge level. Simulation does not depend on camera position or asset/render lifecycle.

## Supported gameplay boundary

These systems are executable in the current bot overlay: finite food/wood/stone/ore sources, food and firewood upkeep, starvation/cold losses, workforce allocation, construction and production, finite search/blueprint learning, recruitment, scout and hunt movement, shared prey depletion, known-target raids, defense, battle casualties, raid cargo delivery, structure damage and repair, workshop production and one explicit iron-weapon equipment overlay, recovery, level progression and the opening level board. Constants absent from the source data are explicitly versioned game-design defaults; they are not represented as facts from the source material.

Contracts that remain unsupported and are deliberately not simulated: a player/bot marketplace and legal trade; the generic player equipment catalog and reassignment rules beyond the bot's one versioned iron-weapon overlay; species-specific wildlife loot beyond the bot's finite food-yield hunt overlay; full event-specific boss, arena and production boards beyond the opening level race; and exact individual simulation of later merged cohorts in the millions. These require executable content, ownership and reward contracts in their respective runtime systems. Unsupported contracts do not mint trade goods, blueprints or ranks; XP comes from separately versioned, committed bot actions. New-save P0, 10,000 and 100,000 stress profiles are distinct; a stress profile is not a claim that the full game supports those populations in normal play.

## Validation and measured limits

Focused suites:

- `npm run test:bots` covers same-seed generation, P0 quota and player SSS invariants, seeded variation, reveal/inspection privacy, action receipts, opening-race XP/settlement, copy-on-write immutability and time-slicing equivalence.
- `npm run test:bots-stress` verifies 10k and 100k generated populations and chunk integrity in a separate process to bound memory during the multi-day P0 simulation tests.
- `npm run test:bots-storage` exercises SQLite chunk persistence, reload integrity, incremental checkpoint/fork behavior, backup roundtrip and tamper rejection.
- `npm run test:bots-api` exercises clock settlement and ensures private bot events cannot leak through player event projections.
- Existing stage, opening-ranking, API, content and frontend checks remain regression gates.

Actual simulation timings, resource use, test/build results and the measured 100k operating limit are recorded in [the implementation checkpoint](ENEMY-BOT-SYSTEM-STATUS.md). Generation-only timings must not be treated as simulation measurements.

## References and provenance

The supplied Petra BaseManager and QueueManager, OpenRA `ai.yaml`, and Epic MassGameplay documents informed the separation of work allocation, explicit resource reservations, independent strategic profiles, and simulation/rendering fidelity. Their game constants and source code are not imported. `BOT-*` rates, settlement assets and loot candidates are this game's explicit versioned overlays. The research PDFs, source registries and legacy rivals remain unchanged.
