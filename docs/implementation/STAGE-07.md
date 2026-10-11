# Stage 07 — opening corpse, direct Tử Phục, equipment and XP

## Status

**Opening acquisition path implemented; combat scope remains blocked.** This branch adds one playable, user-authorized opening-body loop and marks the unimplemented combat scope explicitly. It does not claim that Stage 07’s full combat acceptance gate is complete. Stage 08 has not started.

The earlier blocker-only report is superseded by this implementation report. The prompt itself was not copied into the repository.

## Authority and authored overlay

The active source authority matrix remains unchanged. This implementation follows the active File02 progression and growth thresholds, File06 direct-revival rules and exact mirror receipt key, and existing Stage 06 access, inventory, construction and time services. It does not rewrite canonical source records.

After the user authorized reasonable authored balancing, this branch adds one isolated runtime overlay in `packages/sim/src/stage07.ts`:

- **Rook**, a non-hero Varen courier at the H0 starting site; Bậc 1, level 1, 24 historical XP, grade Thường, integrity 86%, health 44 before revival, and a complete nine-attribute profile.
- One ash-wood spear (weapon base 3, condition 78%) and one felt cloak (armor 1, condition 64%), each with a stable item instance ID.
- The overlay is labeled `USER-AUTHORIZED-STAGE-07-BALANCE-OVERLAY-1.0`. It adds no regional prey, hero, lair member or ecology count. The player must inspect the body before the full identity/profile is revealed.

## Implemented

- The opening corpse appears on the known map as unidentified. Inspection records player knowledge and reveals its recorded sheet.
- Direct Tử Phục checks corpse identity, inspection, access, integrity, complete body/anatomy/gear records, structural Bậc, seals, death-trace purge, Holy locks/field limits, and second-death closure. Buried bodies remain inaccessible until excavation. Legal Holy transformation lowers resulting Bậc and grade by one while retaining level and XP.
- Revival costs zero Mana, materials and simulation time; it has no building, Tomb-pool, cooldown or quota requirement. It preserves source attributes, level, XP, grade, hero status, skills, talents and memory fragments; the result has Âm faction and absolute loyalty. Health scales from recorded integrity.
- Revival and body disposal are exclusive saved-state transitions. Disposal consumes the body and transfers each recorded held gear instance into one carried container; it creates no resources or XP. Repeated requests cannot duplicate the body, unit or gear.
- The sealed opening career stays unlearned in a fresh save. Inspecting then activating it grants only `SK-OPEN-NECRO-01` at mastery 0 and leaves Mana unchanged. Held growth is applied on activation.
- Equipment has compiled MAIN_HAND and BODY slots for this authored human profile. Item tags, current condition and combat effects remain attached to the same item ID through recovery, equip and unequip.
- Stage 07 labor XP uses the authored rule `10 XP/WU`, with a `60% / worker-count + 40% / effective-work-rate` contribution share and one final floor. Construction completion records normal awards. A direct-revived unit’s legitimate net labor XP is an additional Lí Lan award with the unique key `sourceXpTransactionId|LI_LAN|LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`; it does not take XP from the unit and has no distance gate. Tomb-route units without direct-revival provenance do not mirror. Multi-level thresholds consume in order and queue 8 growth points per Lí Lan level.
- The forces and inventory panels expose the observed individual sheet, route in player-facing prose, health/integrity, attributes, skills, XP eligibility, equipment slots and gear condition. The map inspector provides inspect, revive and permanent-disposal controls with player-safe blockers.

## Not implemented in this stage branch

- `attack` remains disabled. There is no encounter state machine, deterministic combat RNG stream, combat scheduler integration, simultaneous-death/retreat handling, tactical intent validation or mid-combat checkpoint/reload coverage. Existing prey and lair actors still lack complete compiled individual combat profiles. No combat or loot result is fabricated.
- No actor-death service calls the second-death lock helper yet; the closure rule is represented and regression-tested as a service helper, pending a combat death path.
- There is no corpse haul command or excavation workflow. The playable overlay body is already at H0; carried-body access is supported for bodies already in player/team custody.
- XP award integration currently covers legitimate construction labor only. Combat and quest XP source award producers, modifier contracts and party contribution resolution are not implemented.
- No browser journey was executed. The UI controls and PlayerView flow are wired, but the branch was not run in a browser.

The fixed ecology, 15 established lairs and 693 lair-unit identities are untouched.

## Regression coverage added

`packages/sim/test/stage07.test.ts` covers fresh-save inspection, free and exactly-once revival, gear identity, career activation, compatible equipment, disposal/revival exclusivity, invalid profile immutability, Holy transformation and locks, second-death mirror closure, offscreen labor mirroring, duplicate XP receipts, Tomb exclusion, multi-level XP and held growth. The root package adds `npm run test:stage07`.

The test suite and frontend build were **not executed in this session**: repository reads/writes/push were constrained to the GitHub plugin, and the user requested no internet access. No GitHub Actions workflow was triggered.

## Acceptance gate status

| Gate | Result |
|---|---|
| Opening eligible direct revival, no building/Tomb/Mana/material/time cost | Implemented and covered by added regression test; not executed here |
| Invalid profile immutability; duplicate revival; recovered gear identity | Implemented and covered by added regression tests; not executed here |
| Holy legal transformation and direct-revival restrictions | Implemented and covered by added regression test; not executed here |
| Disposal/revival exclusivity | Implemented for the opening body; covered by added sequential race cases; not executed here |
| Equipment anatomy compatibility and same-sheet updates | Implemented and covered by added regression test; not executed here |
| Career activation and one opening skill | Implemented and covered by added regression test; not executed here |
| Direct labor XP mirror once, offscreen, multi-level, Tomb exclusion | Implemented for construction labor and covered by added regression test; not executed here |
| Deterministic combat, checkpoint/reload and no stock farming | **Blocked** — no combat encounter kernel or death/loot producer |
| Browser journey | **Not verified** — browser was not run |
| Ecology/lair conservation | Preserved by keeping the overlay outside canonical and aggregate ecology data |

Do not treat this branch as a complete combat implementation or as authorization to merge to `main` or deploy.
