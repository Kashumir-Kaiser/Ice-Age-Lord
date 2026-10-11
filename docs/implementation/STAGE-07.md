# Stage 07 — direct Tử Phục, equipment, XP and the opening combat loop

## Status

**Playable Stage 07 opening loop implemented on this branch.** A player can inspect and directly Tử Phục Rook, equip the recorded spear and cloak, find the H0 snow hare on the map, start a simulation-timed fight, reload while the encounter is active, finish it, inspect the resulting corpse, and Tử Phục the hare. The combat scope is intentionally limited to this one authored opening encounter; it does not compile combat for the rest of the wildlife or lair roster.

The earlier report saying combat was disabled is superseded by this report. Stage 08 has not started.

## Authority and authored overlays

The active source authority matrix remains unchanged. This implementation follows the active File02 progression and growth thresholds, File06 direct-revival rules and exact mirror receipt key, and the existing Stage 06 access, inventory, construction, spatial, and time services. It does not rewrite canonical source records.

The user authorized reasonable encounter/body profiles and balancing where the source data did not supply a reachable opening pair. The branch adds these isolated runtime overlays:

- **Rook**, a non-hero Varen courier at H0; Bậc 1, level 1, 24 historical XP, grade Thường, integrity 86%, health 44 before revival, and a complete nine-attribute profile.
- An ash-wood spear (weapon base 3, condition 78%, 2.2 m range) and felt cloak (armor 1, condition 64%), each with a stable item instance ID.
- **One T1 common snow hare** at the H0 frozen shelf, backed by the existing `ECO-LL01-R0` population record. It has 16 HP, a low-damage short-range response, and a complete T1 body/anatomy record.

The Rook overlay is labeled `USER-AUTHORIZED-STAGE-07-BALANCE-OVERLAY-1.0`; the combat encounter uses `STAGE07-DETERMINISTIC-MELEE-1.0`. The hare is one stable campaign identity. A win records its death and one corpse; retreat preserves that individual. Neither outcome creates a replacement target. Canonical ecology and lair identities are unchanged.

## Implemented

- The opening corpse appears on the known map as unidentified. Inspection records player knowledge and reveals its sheet.
- Direct Tử Phục checks corpse identity, inspection, access, integrity, complete body/anatomy/gear records, structural Bậc, seals, death-trace purge, Holy locks/field limits, and second-death closure. Buried bodies remain inaccessible until excavation. A legal Holy transformation lowers resulting Bậc and grade by one while retaining level and XP.
- Revival costs zero Mana, materials, and simulation time; it has no building, Tomb-pool, cooldown, or quota requirement. It preserves source attributes, level, XP, grade, hero status, skills, talents, and memory fragments; the result has Âm faction and absolute loyalty. Health scales from recorded integrity.
- Revival and body disposal are exclusive saved-state transitions. Disposal consumes the body and transfers each recorded held gear instance into one carried container; it creates no resources or XP. Repeated requests cannot duplicate the body, unit, or gear.
- Equipment has compiled MAIN_HAND and BODY slots for this authored human profile. Item tags, current condition, and combat effects remain attached to the same item ID through recovery, equip, and unequip.
- The opening target is shown on the map only when it falls within current sight. An attack command requires one living, owned, idle unit, sufficient perception, a compiled H0/ecology profile, compatible equipped weapon, and weapon/world interaction range. Faction checks prevent attacking the same faction. Movement, work, and equipment changes are blocked for a combatant until the encounter ends.
- Combat is an ordinary scheduler boundary every four simulation seconds. It advances through the existing clock alongside cold, travel, spatial work, and construction. Each encounter has a stable sequence and persisted RNG stream. The versioned draw order is documented in code; a same-seed mid-round clone/reload test compares both resulting state hashes and emitted events.
- The player can issue attack or retreat. Retreat resolves at the next timed boundary after a possible hare response. A victory creates an actual known corpse with the target's complete body record and death history. A defeated direct-revived unit creates a second-death-locked corpse and closes its revival link. No victory, loot, or corpse is produced on retreat.
- Combat grants 12 XP once to the contributing unit, with the exact Stage 07 direct-revival XP mirror receipt for Lí Lan. No retry can farm the one opening animal or its XP. The encounter remains a single combatant so party allocation does not get fabricated.
- Combat events are projected into the player-safe journal. The map target inspector and forces panel expose encounter availability, timing, health, retreat, and recent turn results. Inventory and corpse views support the follow-up gear/body actions.
- Stage 07 labor XP uses the authored rule `10 XP/WU`, with a `60% / worker-count + 40% / effective-work-rate` contribution share and one final floor. Construction completion records normal awards. A direct-revived unit’s legitimate net labor XP is an additional Lí Lan award with the unique key `sourceXpTransactionId|LI_LAN|LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`; it does not take XP from the unit and has no distance gate. Tomb-route units without direct-revival provenance do not mirror. Multi-level thresholds consume in order and queue 8 growth points per Lí Lan level.
- The forces and inventory panels expose the observed individual sheet, route in player-facing prose, health/integrity, attributes, skills, XP eligibility, equipment slots, and gear condition.

## Remaining boundaries

- This branch compiles the single user-authorized Rook/snow-hare opening loop, not a general combat engine. Group battles, non-opening wildlife, lair actors, ranged abilities, loot tables, and corpse hauling/excavation remain uncompiled.
- The authored hare has no loot drop. Its combat result is a corpse and the fixed one-time XP award only.
- Stage 07 does not add a quest XP producer or invent party contribution rules; combat contribution is unambiguous because the opening encounter requires one actor.
- Stage 07 regression and browser tests are wired into the repository workflow for `codex/backend-stage-07`. They are pending the branch push and GitHub Actions result.

## Regression and browser coverage

`packages/sim/test/stage07.test.ts` covers combat replay across a mid-round checkpoint, timed resolution, actual corpse and body health, one-time unit XP and owner mirror, no farming, retreat conservation, canceled search conservation, and construction work suspension. It retains the earlier direct-revival, equipment, career, labor mirror, and second-death tests.

`frontend/e2e/stage07-combat.spec.ts` exercises the real API and browser: inspect/revive Rook, equip the opening gear, observe the target in inventory/map/forces, start combat, settle a round, pause and reload mid-fight, finish it, inspect/revive the resulting hare corpse, and confirm journal entries.

The workflow now runs Stage 05–07 regression suites plus the frontend build, browser unit tests, and Playwright journey on this branch. No result is claimed until that workflow completes.

## Acceptance gate status

| Gate | Result |
|---|---|
| Eligible opening corpse, zero-cost direct Tử Phục, one-time body/gear transitions | Implemented and covered by Stage 07 regression tests |
| Equipment compatibility and stable item identity | Implemented; used by combat |
| Deterministic combat RNG and mid-round same-seed replay | Implemented and covered by sim regression |
| Scheduler-backed attack, damage, defeat, victory, and retreat | Implemented and covered by sim regression |
| Real target corpse, death history, one-time XP and exact owner mirror | Implemented and covered by sim regression |
| No target/XP farming; canceled search does not debit prey | Implemented and covered by sim regression |
| Browser map → combat → reload → corpse → Tử Phục and journal | Playwright test added; GitHub Actions result pending |
| Broader wildlife/lair combat, party battles, loot, corpse transport | Explicitly outside this opening encounter implementation |
| Fixed ecology, established lairs, and lair-unit identities | Canonical definitions remain unchanged |

This branch is pushed for review only; it does not merge to `main` or deploy.