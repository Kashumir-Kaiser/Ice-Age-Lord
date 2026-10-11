# Content index and authority map

## Current web-game inputs

| File/directory | Role | Status |
|---|---|---|
| `design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md` | Latest overall feature/content design | **Design, not runtime** |
| `design/buildings/MAGICAL-BUILDING-BRANCHES-v0.3.md` | 143 proposed magical building branches; 19 draft contracts | Design candidates |
| `design/buildings/MAGICAL-BUILDING-CATALOG-v0.3.json` | Machine-readable branch catalog | Proposed, partial executable contracts |
| `design/buildings/SOURCE-GROUNDED-BUILDING-REDESIGN.md` | Source-first functional building distinctions | Reference and proposal |
| `data/events/EVENT-TIMELINE-v0.6.json` | Reconciled fixed 30-event calendar | New-game candidate, not retroactive live migration |
| `data/events/EVENT-SOURCE-CATALOG-v4.6.json` + v4.7–v5.1 addenda | Catalog baseline (590 items, 239 effects) plus Round 47–49 event/reward addenda for Ch882–911 | Research, not guaranteed loot |
| `data/events/EVENT-SOURCE-ITEMS-v5.1.csv` | Cumulative human-review item catalog (703 entries; thirty-six Round 51 rows) | Review |
| `data/events/EVENT-TIMELINE-v0.6.csv` | Human-review schedule diff | Review |
| `data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json` | Round 46 review: twenty source-observed/reported structures and one route report; updated city operation evidence, no LL01 construction contracts | Research only, not T0 world data |
| `references/canonical/LORD-DND-01..07.md` | Underlying mechanics, fixed T0, world/hero/lair/quest data | Historical authoritative rules, require typed migration |
| `references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md` | Source release ancestry / exact known active versions | Legacy integrity reference |
| `references/canonical/LANGUAGE-STANDARDS.md` | Vietnamese/Hán-Việt UI/narration conventions | Design guidance |
| `references/canonical/NARRATION-AND-RULES-CHECKLIST.txt` | Original simulation invariants and quality checklist | Reference, not a game turn engine |
| `references/canonical/CHARACTER-EMOTION-LAWS.md` | NPC characterization conventions | Reference |

## Research traceability

- `research/extraction-audits/ROUND-01-SHOPS-CHESTS.md` through `ROUND-36-THIRTY-SIXTH-EXTRACTION.md`: all forty-nine main extraction audits; `ROUND-29-CONTINUATION-CH721-724-725-v2.9.1.md` remains a separately archived addendum.
- `research/extraction-audits/EVENT-TIMELINE-RECONCILIATION-v0.6.md`: chronology corrections and uncertain source cases.
- `research/extraction-audits/ROUND-34-THIRTY-FOURTH-EXTRACTION.md`: Round 34 audit for Chapters 752–761.
- `research/extraction-audits/ROUND-35-THIRTY-FIFTH-EXTRACTION.md`: Round 35 audit for Chapters 762–771.
- `research/extraction-audits/ROUND-36-THIRTY-SIXTH-EXTRACTION.md`: Round 36 audit for Chapters 772–781.
- `research/extraction-audits/ROUND-37-THIRTY-SEVENTH-EXTRACTION.md`: Round 37 audit for Chapters 782–791.
- `research/extraction-audits/ROUND-40-FORTIETH-EXTRACTION.md`: Round 40 audit for Chapters 812–821.
- `research/extraction-audits/ROUND-41-FORTY-FIRST-EXTRACTION.md`: Round 41 audit for Chapters 822–831.
- `research/extraction-audits/ROUND-42-FORTY-SECOND-EXTRACTION.md`: Round 42 audit for Chapters 832–841.
- `research/extraction-audits/ROUND-43-FORTY-THIRD-EXTRACTION.md`: Round 43 audit for Chapters 842–851.
- `research/extraction-audits/ROUND-47-FORTY-SEVENTH-EXTRACTION.md`: Round 47 audit for Chapters 882–891.
- `research/extraction-audits/ROUND-48-FORTY-EIGHTH-EXTRACTION.md`: Round 48 audit for Chapters 892–901. 
- `research/extraction-audits/ROUND-49-FORTY-NINTH-EXTRACTION.md`: Round 49 audit for Chapters 902–911.\n- `research/extraction-audits/ROUND-50-FIFTIETH-EXTRACTION.md`: Round 50 audit for Chapters 912–921.\n- `research/extraction-audits/ROUND-51-FIFTY-FIRST-EXTRACTION.md`: current Round 51 audit for Chapters 922–931; resume at Ch932.
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v0.1..v4.6.json`: historical extraction datasets (v3.0 unchanged and archived).
- `research/snapshots/events/EVENT-SOURCE-ITEMS-v0.1..v4.6.csv`: corresponding historical review datasets (v3.0 unchanged and archived).
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
