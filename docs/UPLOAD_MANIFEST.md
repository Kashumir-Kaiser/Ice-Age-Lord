# Repository import manifest — 2026-10-09

**Repository:** `Kashumir-Kaiser/Ice-Age-Lord`  
**Branch:** `main`  
**Import scope:** Fresh T0 gameplay design and all nine event extraction passes.  
**Import status:** Uploaded and inspected.

## Inventory at initial verification

| Group | Files | Notes |
|---|---:|---|
| Root documentation/config | 2 | README.md, .gitignore |
| Fresh-start/content docs | 2 | FRESH_START.md, CONTENT_INDEX.md |
| Original canonical references | 11 | File 01–07, language, characterization, checklist, release lineage |
| Current web-game design | 4 | Current v1.3, source-grounded buildings, magical branches Markdown/JSON |
| Current event datasets | 4 | v0.9 source JSON/CSV, v0.6 timeline JSON/CSV |
| Research/reconciliation audits | 10 | Rounds 1–9 + timeline reconciliation |
| Design history | 12 | Initial v0.1 through v1.2 |
| Event JSON history | 8 | v0.1 through v0.8 |
| Event CSV history | 8 | v0.1 through v0.8 |
| **Total at verification** | **61** | Excludes this manifest file |

This manifest adds itself as file 62.

## Data checks

- Current event JSON: **288 distinct source entries**.
- Current review CSV: **288 unique IDs**, matching every event JSON record.
- Fixed timeline: **30 events**, with 30 matching rows in the review CSV.
- Magical buildings: **143 branch entries**.
- Uploaded main JSON, primary rules and design document samples have matching Git blob hashes to the mounted originals.
- Archived CSV tables and the current CSV were **regenerated as clean UTF-8 review exports directly from their corresponding authoritative JSON files**. They are deliberately not byte-for-byte copies of prior CSV exports: spreadsheet-text ingestion modified formatting, so the JSON records are treated as the authority. Regenerated CSVs have no ingestion metadata headers.
- All historical event JSON snapshots and design snapshots are retained to compare revisions.

## Explicit non-import

The earlier `LL01 D1 22:00 DEBUG CARRYOVER` save/checkpoint is **not** included and must not be loaded at new-game creation. This repository is not a save continuation. No actions from the earlier campaign are treated as having happened.

## Critical interpretation

The source rulebooks are *legacy design authority*, not proof that all generic catalogs are active. In the new browser game, Lí Lan has her fixed talent/identity, the accepted original opening content, and a clean world-state initializer. Proposed magical buildings, novel shop entries and event rewards need typed executable contracts, provenance, and balance/test approval before becoming gameplay. No LLM is needed at runtime.

## Not yet implemented

Game source code, React frontend, deterministic simulation, server/database, save loader, migrations and gameplay tests are **not** part of this source-import operation.
