# Fresh-start contract — Ice Age Lord

## Play mode

Single playable lord: **Lí Lan**. The game runs as a regular browser kingdom-building/survival strategy game. React/HTML is the user interface; game outcomes come from deterministic code and persisted simulation state, **not an LLM Game Master**.

The new game starts on the frozen ancient battlefield at **T0 07:00**, using the canonical opening rules from `references/canonical/LORD-DND-06.md`. The protagonist's talent is **SSS — Tử Phục Linh Sư**, fixed permanently. Her starter career and character identity are fixed, subject to the source's T0 sealed-card/inspection rules. Do not provide a 1,152-talent selection menu or generic hero/random-lord builder.

## Fresh save boundaries

Never preload:

- historical LL01 played sessions, Day 1 22:00 checkpoint, Day 2 actions or dialogue;
- stocks, equipment, crafted items, discovered maps, learned blueprints, spawned troops, recruited residents, hero acquisitions, quests, trading results or earned XP from those played sessions;
- already opened chests, purchased event merchandise, awarded achievements, consumed world resources or constructed/upgraded buildings;
- a prior campaign's event progression or ranking outcomes.

**Do** initialize from applicable canonical T0 rules, pre-established world geometry, source-fixed world objects, hero-led lairs and 192 seeded chests (if selecting the legacy LL01 world package). These exist in the world at T0 but are **not known to Lí Lan** unless her starting knowledge explicitly says so.

The founding Lord House is damaged. The frozen battlefield, original starter container, initial Survival Fire, and Ngôi Mộ are seeded according to File 06. No inherited player-built development. Source-fixed system world entities are not "previous gameplay actions".

## Rule preservation

- `Tử Phục` is free to use on eligible real corpses: no mana or material cost, daily limit, cooldown, channel time or mandatory magic structure.
- The resurrection eligibility gates, corpse identity/integrity, Tier restrictions, legitimate anti-revival seals and second-death lock still apply.
- Directly revived undead are distinguishable from Tomb-produced zombies; only the former may mirror their post-revival legitimate XP to Lí Lan as specified.
- The system interface provides authorized basic item/corpse/actor inspections without requiring a corpse-inspection building.
- Existing opening buildings and their fixed construction recipes must not be rewritten from the new proposed magical-building pool.
- Do not create new rewards merely because the player needs a certain item. Respect pre-seeded chest/event/shop/loot commitments and source provenance.

## Fixed events

Use `data/events/EVENT-TIMELINE-v0.6.json` as the **proposed new-game reconciled schedule**. The current extracted v3.2 content registry (Round 32) is research evidence for possible event products and rewards, **not** an all-items-drop-at-start table. Pending requirements and source conflicts remain documented in `research/extraction-audits/`. Ensure each shop/chest/achievement has explicit availability, currency, acquisition and expiration contracts before making it executable.

## Game readiness

This repository currently houses source references, extraction archives and content designs. It does **not** yet ship a tested simulator, React UI, backend, save system or final playable event economy.

The active canonical source releases retain older generic prototype/talent/hero catalogs as **historical reference**; these are not the active player-facing systems for the new web game. Implement game-specific migrations as additive, versioned schemas rather than editing the original files or inventing new game state.

## Save model

New save IDs begin at clean T0. Separate immutable/seeded world definitions from per-save mutable world and player state. Never import the deprecated `D1_2200_DEBUG_CARRYOVER` archive. Existing save files from previous narrative campaigns are not migrated automatically.
