# Content index and authority map

## Current web-game inputs

| File/directory | Role | Status |
|---|---|---|
| `design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md` | Latest overall feature/content design | **Design, not runtime** |
| `design/buildings/MAGICAL-BUILDING-BRANCHES-v0.3.md` | 143 proposed magical building branches; 19 draft contracts | Design candidates |
| `design/buildings/MAGICAL-BUILDING-CATALOG-v0.3.json` | Machine-readable branch catalog | Proposed, partial executable contracts |
| `design/buildings/SOURCE-GROUNDED-BUILDING-REDESIGN.md` | Source-first functional building distinctions | Reference and proposal |
| `data/events/EVENT-TIMELINE-v0.6.json` | Reconciled fixed 30-event calendar | New-game candidate, not retroactive live migration |
| `data/events/EVENT-SOURCE-CATALOG-v2.4.json` | Twenty-four rounds of source event/shop/world-mechanics extraction, 322 records (78 effect contracts) | Research, not guaranteed loot |
| `data/events/EVENT-SOURCE-ITEMS-v2.4.csv` | Human-review event catalog | Review |
| `data/events/EVENT-TIMELINE-v0.6.csv` | Human-review schedule diff | Review |
| `references/canonical/LORD-DND-01..07.md` | Underlying mechanics, fixed T0, world/hero/lair/quest data | Historical authoritative rules, require typed migration |
| `references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md` | Source release ancestry / exact known active versions | Legacy integrity reference |
| `references/canonical/LANGUAGE-STANDARDS.md` | Vietnamese/Hán-Việt UI/narration conventions | Design guidance |
| `references/canonical/NARRATION-AND-RULES-CHECKLIST.txt` | Original simulation invariants and quality checklist | Reference, not a game turn engine |
| `references/canonical/CHARACTER-EMOTION-LAWS.md` | NPC characterization conventions | Reference |

## Research traceability

- `research/extraction-audits/ROUND-01-SHOPS-CHESTS.md` through `ROUND-24-TWENTY-FOURTH-EXTRACTION.md`: **all twenty-four source extraction audits**.
- `research/extraction-audits/EVENT-TIMELINE-RECONCILIATION-v0.6.md`: chronology corrections and uncertain source cases.
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v0.1..v2.3.json`: historical extraction datasets.
- `research/snapshots/events/EVENT-SOURCE-ITEMS-v0.1..v2.3.csv`: corresponding historical review datasets.
- `research/snapshots/design/`: previous web-game spec versions retained for forensic comparison, **not** alternative active specs.

## Explicitly excluded

The old `LL01 D1 22:00 DEBUG CARRYOVER` document is a saved-state snapshot of earlier human decisions, not a clean-game rulebook. It is intentionally **not** copied into this repository. Per-save inventories, character XP, building progress and action journals should be generated only during a new game.

Transient extraction-generation scripts and Python caches are not official content. Source and audit files are preserved in versioned form instead.

## Source reliability

Each extracted record needs a provenance category:
- confirmed source statement/item;
- observed loot or purchase outcome (not a guaranteed result);
- game-specific fixed contract / adaptation;
- still unverified.

Unknown shop inventory, purchase caps, chance tables and boss drops must remain unknown until verified or explicitly redesigned. Do not infer a full drop distribution from a single recorded chest opening.

## Implementation gap

A standard gameplay engine still requires typed registries, deterministic simulation, database schema, event/shop transaction resolver, combat and production calculators, persistent saves, versioned migrations, UI/UX and tests. Files in this repository are data and design preparation for that implementation, not a finished React project.
