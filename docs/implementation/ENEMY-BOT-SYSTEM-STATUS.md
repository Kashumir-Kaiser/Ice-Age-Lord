# Enemy bot implementation checkpoint

Updated 2026-10-13.

## Implementation checkpoint

- [x] Contracts and persistence: GameState schema 12, player view schema 3, typed hot chunks, cold records, stable checksums, versioned migrations, atomic revision writes, checkpoint/fork, backup import/export, and tamper rejection.
- [x] New-save-only P0 population generation, stable rivals, exact talent quotas, named talent/type mapping, finite settlement overlay, and SSS player separation.
- [x] Autonomous simulation: scheduler, utility plus bounded GOAP, finite economy, construction, blueprint search, recruitment, XP, movement/scouting, and shared battle outcomes.
- [x] Talents affect progression: committed bot actions award base XP scaled by versioned fixed-point talent-rank and specialty rules. S combat earns 2.0x base XP and S production earns 0.65x, with receipts recording both the base award and multiplier. The rules are hashed into the population manifest.
- [x] Opening level board consumes talent-adjusted committed XP/level receipts and retains its window, delay, stable ordering, and 100-row cap. Legacy rivals remain in their original ledger on migration.
- [x] Clock catch-up uses bounded 16 ms simulation slices, revision-checks private state between yields, retains bot working chunks until atomic commit, and flushes before public board snapshots.
- [x] LIVE map and bot inspection use player-safe projections. Private bot event payloads are excluded from the campaign event stream.
- [x] Frontend stage 02–10 integration, architecture/unsupported-content guide, and repeatable headless benchmark harness are included.

## Verification record

Environment: Node v24.19.0, npm 11.9.0, managed Linux container. Timings are container measurements, not a laptop/browser guarantee.

| Check | Result |
|---|---|
| Content compilation | Passed: 38 sites, 192 chests, 15 lairs, 693 fixed lair units, 30 scheduled events |
| Bot SQLite chunk, backup, and tamper suite (`npm run test:bots-storage`) | Passed after compact receipt archive changes |
| Bot API privacy and clock suite (`npm run test:bots-api`) | Passed after compact receipt archive changes |
| Focused receipt archive and talent XP tests | Passed |
| 1,023-participant one-hour population benchmark | Passed integrity verification; initialize 1.03 s, advance 1.00 s, verify 71 ms, peak RSS 185 MiB, heap 50 MiB |
| Stage 08 multi-day catch-up regression | Interrupted at user request after about 4 h 37 min; no failure observed before interruption. **Not a pass.** |
| Frontend production build/browser flow | Awaiting GitHub Actions; dependencies are not installed in this checkout |
| Full root/content/API/browser regression run | Not completed; user chose to defer additional local tests |
| Fresh 100k participant benchmark | Not run after the latest optimizations |
| `git diff --check` | Passed before publication |

The earlier 10k and 100k one-hour measurements (11.1 s and 346.3 s) were collected before incremental-root and batched-chunk optimizations and are retained only as historical baselines. The reusable command is `npm run benchmark:bots -- --population=1023|10000|100000 --hours=1..144`. It reports initialization, stress generation, simulation, final integrity-verification timings, and process memory. Do not substitute generation-only results for simulation benchmarks. Report top-100 build and mass-reveal measurements only when those paths have actually been timed.

## Content that remains intentionally unsupported

See the [architecture guide](ENEMY-BOT-SYSTEM.md#supported-gameplay-boundary). A legal trade action requires an executable market, which is not available in this runtime. Non-opening event score contracts are not active; unsupported contracts do not mint trade goods, blueprints, or ranks.
