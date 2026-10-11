# Stage 07 — Combat, corpse identity, direct Tử Phục and XP

## Status

**Blocked and incomplete.** This report records the Stage 07 source gate against `codex/backend-stage-06` at `3303377cf604d87f7b3d7442301b0f3fcaebfdd4`. The attached prompt and audit were treated as task instructions; neither attachment is copied into the repository. No gameplay behavior is claimed as implemented, and Stage 08 has not started.

## Authority checked

The active source set remains bound by `references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md`: File02 1.14.0, File03 1.10.0 spatial sweep, File04 3.1.0 search/team capability, and File06 2.5.0 spatial search binding. The checked rules include File04 combat and contribution sections, File06 §§10–20 and §13.4 `LI-LAN-DIRECT-REVIVE-XP-MIRROR-1.0`, and File03’s fixed ecology/lair extension. No old played encounters or prior save state were imported.

## Coverage in this branch

There is no executable Stage 07 encounter or ability coverage. The existing reducer continues to fail closed for `attack`, `revive`, `equip`, and `activate_career_card`. The T0 corpse rows retain only fixed actor ID, site, source status, creation time and ownership. They do not contain a complete body record. No combat intent, corpse transition, ordinary XP transaction or direct-revival mirror was added.

The source rules do define deterministic combat arithmetic, direct-revival eligibility and the exact XP mirror receipt contract. The runtime does not yet implement those contracts. In particular, the active mirror rule is not an XP transaction graph, and no combat-capable source profile is available to exercise it.

## Source blockers

- **No opening encounter can be resolved without invented actor data.** The compiled fixed actors and 693 lair-unit identities do not carry complete combat profiles: source attributes, health/armor, anatomy, equipped item instances and slot compatibility, skills, action values and timing, and individual encounter positions/behavior are missing. File04’s combat formulas cannot supply those profile values.
- **The seeded corpses do not unlock a T0 revival journey.** Lí Lan starts at Bậc 1 with no owned units. The six T0 corpse actors are Bậc 2, 4 or 7 and have access/quest conditions; the Bậc 2 records require Bậc 2 and their access route. Their body, skills, equipment, integrity and seal records are also incomplete. None is a known, physically accessible, eligible Bậc 1 corpse at opening.
- **The population cannot safely be converted into prey.** File03’s regional ecology is aggregate and the lairs debit from that population. The 15 lairs and 693 identities must remain conserved; making new hunt targets or generic guard profiles would duplicate population or fabricate combatants.
- **Corpse exclusivity has no runtime representation.** The current corpse row cannot record death history, body contents, integrity, seal/Holy constraints, carried access, butchering, revival disposition or second-death lock. There is no atomic transition path to arbitrate revive against butcher or duplicate requests.
- **Equipment is intentionally blocked.** The runtime reports `EQUIPMENT_PROFILE_NOT_COMPILED`; species anatomy-to-slot rules and item effects are not available for a source-backed unit.
- **The XP mirror cannot be awarded safely yet.** The runtime lacks the ordinary XP transaction graph needed to retain each recipient’s source net XP, atomically create the unique mirror receipt, prevent recursive mirrors, apply level thresholds and award Lí Lan’s growth points.
- **Career activation remains disabled.** A fresh save does not prelearn `SK-OPEN-NECRO-01`; the existing command still has no activation event path.

## Required source contracts before implementation

1. Complete individual profiles for an existing encounter in the reachable opening scope: stable actor IDs, positions and group membership; source attributes, level/Bậc/Phẩm, health and anatomy; skills/actions with formulas, range, timing, costs and cooldowns; equipment instances and compatible slots; factions, perception, movement and retreat rules; and the source XP rank/risk/contribution inputs.
2. The encounter’s source state machine and territory rules, including patrol/guard/react/retreat behavior, population debit, casualties, capture/remains outcomes and any renewal rule.
3. Complete records for at least one physically reachable corpse whose source eligibility can be evaluated at the player’s current Bậc, including actual body/skill/equipment state, integrity, death history, seals, Holy restrictions, permitted memory, access conditions and stable corpse ID.
4. Species anatomy/slot definitions and equipment effects for that corpse and the intended revived unit.
5. Exact progression thresholds and Lí Lan growth allocation rules needed to commit multi-level awards and mirrors atomically.
6. The exact career-card activation preconditions/event contract if activation is expected in this stage.

## Acceptance gate status

| Gate | Result |
|---|---|
| Eligible zero-cost direct revival and invalid-corpse immutability | **Blocked** — no reachable eligible source corpse or revival implementation |
| Duplicate revival, butcher/revive race, removed gear, second-death lock | **Blocked** — corpse lifecycle is not represented |
| Tomb exclusion and exactly-once direct XP mirror | **Blocked** — no ordinary XP transaction graph |
| Deterministic combat across checkpoint/reload; no repeat-stock farming | **Blocked** — no combat kernel or encounter state machine |
| Lair identity and population conservation | **Source invariant retained; no combat implementation to validate** |
| Real corpse-to-force/equipment browser journey | **Blocked** — there is no executable encounter/revival path; frontend was not changed |

No Stage 07 regression tests or browser journey were run. The Stage 06 report records its prior test results; those are not Stage 07 acceptance evidence. This branch is not a completed Stage 07 and is not ready to serve as a gameplay implementation baseline.
