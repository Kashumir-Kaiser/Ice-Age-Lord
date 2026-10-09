# LORD DND WEB GAME — LI LAN–CENTRIC CONTENT REDESIGN
**Proposal ID:** `LL-GAME-CONTENT-REDESIGN-0.4`  
**Status:** Design proposal, **not** an amendment to the active Lord DnD source releases  
**Target:** Single playable protagonist (Lí Lan); normal autonomous strategy game, no LLM Game Master  
**Naming convention:** Vietnamese / Hán–Việt on player-facing screens; technical IDs remain internal

## 0. Decision

The standalone game is a fixed-protagonist survival/kingdom-builder. Lí Lan alone is controlled by the human player. Her starting identity, T0 conditions, SSS **Tử Phục Linh Sư**, special XP mirror and Ngôi Mộ progression remain fixed.

**Retire as player-facing generation catalogs:**

- 1,152 generic talents: no talent selection, reroll, global talent pool or talent gacha. Keep the single fixed Lí Lan talent and existing skill/progression rules. Other creatures keep the abilities they have from their own authored entities; that does not require the player-facing 1,152 catalog.
- 108 `item type × rarity` placeholders: replace with meaningful, named, effect-bearing items.
- 96 generic summon chassis: not a source of player summons. Ngôi Mộ uses its already defined production route; Tử Phục uses the **original corpse's recorded species/skills/level/quality**. Keep species anatomy/combat profiles wherever simulation actually needs them.
- 64 `origin × role` hero archetypes: replace with **actual heroes who have unique identities, history, capabilities, and acquisition conditions**.
- 144 `production family × stage` building prototypes: replace with distinct functional buildings, while retaining every fixed opening building and its canonical upgrade contract.

**Do not retire:** world fauna / monster identities, ordinary inventory goods, unique items, existing fixed Rương Báu, fixed early buildings and recipes, known blueprints, quest/event/achievement payloads, the 15 seeded hero-led lairs, or NPC civilizations. They are world content, not alternative player builds.

In particular, **do not modify the active release manifest or overwrite File 04 with an unverified rewrite**. Build a new game-content layer referencing the authoritative records. Migrate only after contracts, tests, lineage and hashes are validated.

## 1. Core design invariants

1. `Tử Phục` directly transforms **eligible real corpses** at **zero mana, material, time-channel or daily quota**, with **no hard cap** on number revived. It does not need a building, catalyst, command node or corpse-upgrade item.
2. Eligibility still requires body integrity, access, Lí Lan's current Bậc, no second-death lock and no active specified seals/holy restrictions. Equipment may help **find, protect, transport or examine** a corpse but cannot remove those gates.
3. Reanimated individuals preserve historical Bậc/Cấp/XP/Phẩm/skills and hero flag, with the specified Holy exception. A zombie from **Ngôi Mộ** is a distinct creation path: it is not a high-grade corpse substitute.
4. **Only directly Tử Phục units** generate Lí Lan's mirror XP, and only on legitimate post-revival ordinary XP transactions. No item or building makes Tomb zombies qualify.
5. Unintelligent undead have zero `CommandLoad` by agency, but many simultaneous complex orders can still incur `OrderLoad` and physical frontage/route congestion. No imposed artificial undead population cap.
6. Living residents require genuine food, shelter, labor, social systems, health care and logistics. "Necromancer themed" is not an excuse to delete the civilian economy.
7. New buildings are **infrastructure, not secret talent upgrades**; new heroes are **individual world actors, not collectible class cards**; new items solve **specific jobs, trade-offs and risks**, not "all stats +X%".
8. No drop tables secretly reshuffle already fixed chests or guarantee tailored loot after seeing player need. Loot follows source/location/owner. Gear that Lí Lan cannot use can still be equipped on eligible units, used by residents, traded or processed.
9. Source-locked rewards and achievement payloads continue unchanged. Proposed items never replace fixed rewards or award same-instance next-upgrade materials.
10. At clean T0, nothing from the prior D1 22:00 campaign checkpoint is imported. Existing valid saved campaigns would need an explicit migration, not a reset or silent rewrite.

## 2. Three procurement paths

Every playable item must belong to one or more clear channels:

- **Made:** A known recipe, known station, inputs, worker skill, production duration and exact outputs.
- **Found:** Pre-existing chest/ruin/cache, salvageable battlefield object, or finite defeated actor's equipment; committed before discovery where appropriate.
- **Traded/earned:** A named trader's real stock, a committed market listing, or a precontracted quest/achievement.

There is no general random item pool where an "item for necromancers" appears just because Lí Lan is a necromancer.

## 3. Revised source-informed magical construction roster — 0.3

The earlier overemphasis on corpse inspectors, command-relay buildings and ordinary inventory UI as structures is **withdrawn**. The playable-building design now uses a normal structure as a **base family** with magical alternatives and specialization modules; the full content and contract detail are in **[Lord_DnD_Magical_Building_Branches_v0.3.md](./Lord_DnD_Magical_Building_Branches_v0.3.md)**. The structured data file is **`Lord_DnD_Magical_Building_Catalog_v0.3.json`**.

- **Scale:** 143 branches in 11 functional categories; 19 have new numerical operation proposals, 124 are named design candidates that remain unavailable until individually materialized.
- **Concrete examples:** Ruộng Canh Tác → **Linh Điền** for better output and growth; Giếng Nước → **Nguyệt Giếng** for *small nightly* quantities of HP/Mana restorative water; Bếp Đơn Giản → **Bếp Hỏa Tinh** for heat-retaining meals; Trạm Nấu Tuyết → **Lò Tuyết Tịnh Hỏa**; Lò Rèn → **Hỏa Linh Đoán Lô**; Tháp Canh Gỗ → **Tháp Hàn Tiễn**.
- **Unchanged:** the 11 fixed opening-building options and their authoritative File 01/04 construction/level recipes, alongside Lửa Sinh Tồn, Ngôi Mộ, Nhà Lãnh Chúa and source-confirmed blueprints.
- **No gratis mutation:** Lí Lan is **not** Ngô Trì or another novel's protagonist with a generic building mutation talent. Every magical branch requires a blueprint and a compatible build/upgrade contract. No building needed to use Tử Phục or inspect a corpse through its existing system interface.
- **No unauthorized game state changes:** the source registries, 192 treasure chests, 15 seeded monster lairs, already learned blueprints and world history remain untouched.
- **Content status:** this is a design/content proposal for a future web game, not executable code or a save patch. Proposed construction prices/stats are explicitly not novel-locked numbers; missing blueprints, effect tags or resource definitions block promotion to buildable content.

## 4. Heroes: stop generating roles; discover individuals

### 4.1 Acquisition and state

Every hero is a persistent actor with a name or as-yet-unknown identity, species, physical origin, current location, actual skill kit, memory/knowledge, equipment, relationships, wounds and one consistent history.

Possible routes to Lí Lan:

1. **A living hero voluntarily joins** through genuine recruitment, salary, diplomacy, shared goals or an existing world event. Their agency, contract, grievances and ability to leave remain.
2. **A true hero corpse is directly Tử Phục**, preserving hero identity/kit and the allowed imprint of memory. Its loyalty becomes absolute; it does not need morale bribes or a diplomacy contract.
3. **A named unit awakens naturally** under the extremely rare world rules, keeping the same unit ID. An undead unit does not suddenly acquire a restored human soul or perfect knowledge.

Do not award an "unlocked hero" by opening a generic recruitment menu, and do not create a new hero merely because the player needs a healer or general.

### 4.2 Redesign the 15 existing fixed lair heroes as encounters with distinct gameplay

The **original IDs, species, seeded Bậc/Cấp/Phẩm, group memberships, objectives, positions and existence before T0 are retained**. Entries below are **proposed encounter kits/decision behavior**, not retroactive changes to active canon. They must be validated against existing skills and counter systems before adoption.

| Existing hero | Encounter identity / signature decision | Sensible counterplay | Value **if** its actual eligible corpse is later revived |
|---|---|---|---|
| **Huyền Nha** — snow wolf | Coordinates a flank, recalls injured pack members, defends prey routes | Detect scent corridors; protect rear and supply | Mobile pursuit and small-pack maneuver officer |
| **Mỏ Nhớ** — carrion crow | Builds distributed aerial alarms and tracks scavenger routes | Break line-of-sight, intercept messenger birds | Air reconnaissance and contact reporting |
| **Thạch Hàm** — burrowing worm | Reroutes brood through tunnels and closes access shafts | Survey unstable ground; control tunnel mouths | Excavation and underground access specialist, limited by real geology |
| **Bạch Tích** — snow wolf | Rotating patrols, prepared ambushes, selective pack recall | Observe patrol intervals; counter-ambush | Hunter-command and wilderness patrol leader |
| **Mắt Tro** — carrion crow | Watches crossings and coordinates swarm response through call chains | Reduce exposure at crossings; interrupt signals | Route surveillance and message relay |
| **Lưng Đá** — solitary cave bear | Holds a den; withdraws when survival demands it; **no follower society** | Draw it away from narrow terrain; avoid grappling in den | Powerful single-unit breach or defense role; no invented followers |
| **Kỵ Sĩ Chuông Gãy** — wild undead | Synchronizes silent formations around a death anchor | Separate formations; disrupt known communication anchor | Undead battlefield formation commander, **not** a free mass-spawn generator |
| **Mẫu Chu Thiết Tơ** — ore spider queen | Distributes brood roles, blocks tunnels and defends iron-web territory | Break webs, manage chokepoints, attack logistics | Specialized underground defense, web zoning and mining reconnaissance |
| **Rìu Nước Cạn** — ice goblin | Uses scouts, palisades and control over a water source | Interdict scouts and supplies rather than frontal assault | Raiding, small fortification and local resource-route officer |
| **Tâm Băng Lam** — blue-frost elemental | Controls a resonant defensive formation around the protected core | Disrupt resonance nodes; use elemental counters | Localized cold/resonance combat specialist; no free global winter control |
| **Nanh Đóng Sương** — ice boar | Shields young, maneuvers herd and launches charges | Terrain obstacles and formation discipline | Shock-charge and heavy transport if anatomy allows |
| **Vu Chủ Hắc Giác** — horned beastman | Clan oath system, ritual coordination, migration and council | Political/diversionary pressures and counter-rituals | An experienced commander retaining real profession/skill imprint, **not** automatic control over the living clan |
| **Lão Trụ Cầu** — bridge troll | Bridge chokepoint, toll leverage, kin retreat | Alternate crossings, isolate support, manage attrition | Heavy bridge defense and engineering-related physical roles |
| **Mẫu Hỏa Thằn Tro** — ash salamander | Protects brood, geothermal vents and a territorial heat ring | Reroute supply, avoid vent hazards, isolate combatants | Fire/heat-area specialist if actual retained kit permits |
| **Đục Muối Bảy Vết** — crystal-rock kobold | Mine closure, crew shifts, tunnels, clan survival | Pressure route exits, cut mining logistics | Underground infrastructure operations and defensive tunnel command |

**Important:** The right-hand column is a potential role **after actual acquisition**, not a free skill, a guaranteed future recruit or a new pre-T0 power. If Tử Phục preserves particular skills, they must be from the hero's verified pre-death kit. Do not create a new "corpse-specific" ability after seeing the player wants it.

### 4.3 Replace the 64 generic hero rows with this gameplay model

The hero interface shows:
- **Identity & origin:** actual actor ID, known name, faction, region and physical history.
- **Capability:** current Bậc, Cấp, XP, Phẩm, skills, equipment, anatomy, injuries and command specialty.
- **Command:** authorized teams, formation doctrine, standing orders, coordination reach, currently assigned duties.
- **Memory:** confirmed knowledge separated from uncertain/fragmentary hero imprint.
- **Relationship:** for living heroes, trust/loyalty/satisfaction/ambition; for directly Tử Phục heroes, **absolute Lí Lan loyalty** and operational/communication restrictions, not invented rebellion.
- **Acquisition history:** living contract, actual revival corpse/event, or legitimate spontaneous awakening.

The player's named roster is **emergent**, not prefilled with 15 recruitable cards.

## 5. Named item collection designed for the actual gameplay loop

These are **new proposed item identities**, except entries explicitly labeled *existing*. Item effects are functional specifications; source silence means precise coefficients, prices, rarity and drop commitments must be authored and balance-tested before release. No invented item is granted at T0 or retroactively inserted into a sealed chest.

### 5.1 Lí Lan's own equipment and personal survival

| Item | Gameplay function | Constraint / route |
|---|---|---|
| **Áo Choàng Chống Lạnh** (*existing*) | Retains the existing cold-insulation effect (`+25%` on the present cloak contract) | Tailoring recipe/reward already exists; do not treat it as generic "armor rarity E" |
| **Trượng Khắc Băng Văn** | Cold-resistant magical focus for Lí Lan's already learned attack spells | Crafted/found focus; does not modify Tử Phục eligibility, quota or cost |
| **Vòng Khắc Thi Ấn** | Enhances the *tracking workflow* for her existing Thi Ấn on already valid marked targets | Does not add extra mark slots, reveal unseen bodies or overcome skill targeting constraints without an explicit compatible modifier contract |
| **Nhẫn Tụ Linh** | Grants a defined Mana-pool modifier for spell use | Limits from equipment budget; **Tử Phục does not consume Mana** |
| **Mặt Nạ Lọc Sương** | Protects breathing/visibility from specific snow and airborne hazards | Requires filter capacity and appropriate hazard tag |
| **Ủng Gai Băng** | Traction on iced routes, reducing specific slip/movement risks | Does not accelerate travel on clear roads or bypass locked ground |
| **Kính Khảo Tích** | Improves identification of traces, markings and surveyed corpse evidence | No map-wide detection or omniscience |
| **Đèn Dấu Hàn** | Portable light for excavation/night operations | Consumes fuel; changes detection and visibility for friend and foe |
| **Bùa Hộ Tâm** | Timed resistance to defined fear/mental statuses | Charges and counter; not universal immunity |
| **Túi Khẩn Cấp Tuyết Dã** | Stores survival supplies for personal expeditions | Finite slots and mass; no inventory duplication |

### 5.2 Corpse handling, survey and archaeology

| Item | Gameplay function | Constraint / route |
|---|---|---|
| **Bao Bọc Thi Hài Chống Va Đập** | Protects the carried **existing corpse instance** from handling damage | Does not mend a corpse already at zero integrity |
| **Hộp Niêm Phong Di Vật** | Stores personal effects and their provenance separately from corpse identity | Does not clone gear on Tử Phục |
| **Bộ Trâm Thử Dấu Ấn** | Performs a documented examination on an accessible specimen | Tool charges; results may be limited by worker knowledge |
| **Cuốc Đào Băng Chuyên Dụng** | Excavates hard ground/strata in designated cells | Real labor and terrain; digging still takes time |
| **Giá Nâng Hài Cốt** | Lifts larger or fragile corpses when a carrier team has appropriate capacity | Requires workers and adequate route width |
| **Xe Trượt Chở Thi Thể** | Transports bulky corpses as actual cargo | Capacity, route, terrain and loading constraints |
| **Sổ Khảo Sát Địa Tầng** | Records explored layers, exact observations and uncertainty | Does not reveal layers never reached |
| **Ống Đo Dị Năng** | Surveys specific environmental signatures from a real position | Cannot declare the type, number and level of unknown enemies without evidence |

### 5.3 Undead-unit and hero equipment

| Item | Gameplay function | Constraint / route |
|---|---|---|
| **Giáp Ghép Khớp Tử Thể** | Modular armor fitted to a recorded body plan | Materials, fitting, weight and anatomy; does not fit all monsters |
| **Khiên Chốt Địa** | Defensive shield for compatible humanoid or strong-limbed unit | Weight and hand/limb requirements; trades mobility for guard |
| **Rìu Phá Băng** | Labor tool/weapon for compatible unit assignments | Use and combat modes are separate; durable, repairable instance |
| **Móc Kéo Hàng Dài** | Lets compatible bodies manipulate loads without fine finger control | Not an independent autonomous worker |
| **Cờ Hiệu Đội Hình** | Provides a visible formation signal for trained units | Requires actual visual/relay contact and a valid commander |
| **Kèn Lệnh Tuyết Dạ** | Delivers an audible group signal | Weather, distance and enemy interception apply |
| **Giáp Yên Chở Hàng** | Harness for large quadrupedal undead used in logistics | Loads affect speed, route and battle performance |
| **Dây Neo Trận Địa** | Helps prepared defenders hold positions or set approach obstacles | Must be installed and can be severed |
| **Túi Đạn Tiếp Tế** | Holds actual ammunition for equipped ranged units | No replenishment without manufacturing/resupply |
| **Hộp Dụng Cụ Sửa Giáp** | Field-repairs eligible equipment using carried material | Cannot regenerate undead body HP/structure by implication |

### 5.4 Civilian industry, expedition and trading goods

| Item | Gameplay function | Constraint / route |
|---|---|---|
| **Bộ Cữ Cưa Hiệu Chỉnh** (*existing*) | Uses the existing five-charge improvement to a correctly bound sawmill batch | Achievement item; no construction-material conversion |
| **Bộ Thuốc Thử Quặng** (*existing*) | Examines a real ore stack before processing | Existing 20 charges; no generated ore |
| **Bộ Khuôn Dụng Cụ Khai Cuộc** (*existing*) | Unlocks the source-fixed three forge tool recipes | No metal gifted or forge-upgrade discount |
| **Thùng Chở Lương Có Niêm** | Bulk food logistics with traceable quantity and destination | Physical cargo, spoilage and security |
| **Bộ Lọc Nước Di Động** | Processes carried water according to filter charges/capability | No infinite supply |
| **Bộ Dựng Mốc Đường** | Marks a surveyed route for repeated transport | Marks never reveal threats beyond observed evidence |
| **Túi Cứu Thương Dã Ngoại** | Supports living units in compatible medical situations | Consumes legitimate medical stock; not instant resurrection |
| **Sổ Giao Vận** | Encodes pickup, carrier, reserved stock and delivery receipts | UI/automation aid, not a resource multiplier |

### 5.5 Named relics / major quest items — only when specifically authored

| Artifact concept | Gameplay identity | Acquisition rule |
|---|---|---|
| **Ấn Tín Sora Đoạn Khuyết** | Evidence of an ancient battlefield's political authority; opens verification/diplomatic research | Existing site/quest must explicitly contain this specific instance; no random chest insertion |
| **Huyết Khế Trevil Bị Vỡ** | A record that can change interpretation of the old war and faction relations | Must be found via authored evidence chain, not automatic omniscient lore |
| **Chuông Trận Câm** | Historically linked to a specific old-undeath formation and command practice | Only if originating artifact, custody and current holder are defined; not a free mass-mind-control tool |
| **Bản Đồ Mạch Táng Tầng Sâu** | Partial map of surveyed lower strata, with uncertainty | Grants mapped *information*, not access or Bậc privileges |

These are **content candidates**, not assertions that the locked world package currently contains these artifacts.

## 6. Design items according to strategic problems, not rarity multipliers

An item passes acceptance only if all seven questions have explicit answers:

1. **Who can use it?** Lí Lan, a living civilian, a particular undead anatomy or a known hero.
2. **What action does it enable or improve?** A real command/skill/job, not generic "necromancy power."
3. **What input does it require?** Consumable charges, fuel, mana if spellcasting, workers, supply or none with explanation.
4. **What limits it?** Range, fitting, terrain, knowledge, route, slot, preparation or enemy counter.
5. **Where does it come from?** Verified recipe, world owner/site, chest commitment, contract or market offer.
6. **What existing rule does it interact with?** Exact actor, building, skill or combat contract; never bypass an immutable talent rule.
7. **Why isn't it another existing item?** Unique tactical/survival/economic choice rather than an adjective swap.

Quality/rarity may still exist for individual items, but it **does not create new item identities** by multiplying every category by every grade.

## 7. Content model and integrity

```yaml
item_definition:
  item_id: string
  display_name_vi: string
  source_class: LEGACY_FIXED | GAME_DESIGN_PROPOSAL
  rarity: optional
  body_tier: optional
  category: EQUIPMENT | TOOL | CONSUMABLE | CARGO | BLUEPRINT | RELIC
  allowed_user_predicate: string
  concrete_actions: []
  effect_contract: {}
  operating_inputs: {}
  tradeoffs_and_counters: []
  acquisition_contract_refs: []
  compatibility_rule_refs: []
  effect_version: string
  content_hash: string

building_definition:
  building_id: string
  display_name_vi: string
  source_class: LEGACY_FIXED | GAME_DESIGN_PROPOSAL
  knowledge_origin: BUILT_IN | LEARNED_BLUEPRINT
  current_upgrade_edge: optional
  footprint_and_site: {}
  prerequisites: {}
  construction_recipe: {}
  construction_work_units: number
  construction_workers: {}
  operation_inputs: {}
  outputs_and_services: {}
  direct_effect_contract: {}
  failure_modes: []
  content_hash: string

hero_instance:
  hero_id: string
  real_entity_id: string
  origin_site_and_history: {}
  current_species_and_anatomy: {}
  tier_level_quality_xp: {}
  actual_skill_and_equipment_refs: []
  active_goals_and_known_facts: []
  knowledge_and_memory_provenance: []
  current_owner_or_faction: string
  recruitment_or_revival_event_id: optional
  leadership_and_order_profile: {}
  location_and_activity: {}
```

### Compatibility / save migration rules

- Canon-locked contracts remain immutable unless the user explicitly approves a new game-specific ruleset and a proper versioned conversion.
- New content may be **authored independently for the web game**, but must not masquerade as existing preseeded loot or the canonical source.
- Old item/hero/building *instances* in an existing save are never silently deleted just because generic content families are retired; use versioned migration or retain read-only legacy definitions.
- Each item instance has its own owner/location/provenance and must not be double-consumed through loot, corpse handling, crafting or dismantling.
- Every learned new building needs a full blueprint contract (including numerical recipe/WU/output) before the UI activates construction. The names in §3.2 are not enough to construct.
- Every proposed hero signature must be allocated to its actual pre-contact skill/behavior profile if approved. Reanimation must preserve what the hero actually had rather than minting player-beneficial capabilities after death.
- Preserve the original 15 lairs / 15 heroes / unit populations / 192 chest instances / exploration history and fixed event/achievement triggers in the LL01 scenario unless making an **explicitly separate** new-game world-seed version.

## 8. Suggested first implementable content batch — REVISED v0.3

**Settlement:** the fixed eleven build options, plus the separate Nhà Lãnh Chúa, Ngôi Mộ and Lửa Sinh Tồn. No additional talent gate or corpse-analysis building.

**Early acquired blueprints in the existing D1 scenario:** Kho Gỗ Có Mái, Tháp Canh Gỗ, Bẫy Thú Tuyết, Trạm Lò Than. They are **not** granted in a fresh T0 save.

**First game-specific additional blueprint to author:** Nhà Vệ Sinh Đơn Giản / Tịnh Uế Phường, with its source-established sewage-to-fertilizer function and directly evidenced chapter-114 materials. This creates meaningful agricultural production later.

**Next real production chain:** Trạm Lò Than (wood-to-coal) → operation of heating; subsequently Ruộng / Giếng / Xưởng Luyện Dược as their knowledge and resource paths are gained.

**Military slice:** A defensible wall/gate + one genuinely source-grounded damaging tower. The latter must exist as a learned blueprint, not an automatically available universal build option.

**Hero/undead slice:** Lí Lan locates an existing corpse → the system shows legitimately available corpse information → Tử Phục is performed directly at zero cost if eligible → the unit receives its actual skill sheet and future appropriate equipment, without requiring **any** diagnostic/revival facility.

**No fake building unlocks:** order queues, resource ledgers, inspection panels, character sheets and information projections are normal game interface functions.

## 9. Required tests before shipping

- Free Tử Phục remains free with unlimited valid corpse targets, no missing "ritual building" gate.
- Tử Phục rejects inaccessible, zero-integrity, second-death, over-Bậc, valid Holy-locked or sealed cases **without consuming the corpse**.
- Tomb zombies never produce mirror XP; direct Tử Phục units produce exactly valid post-revival mirrored XP once.
- Hero revival cannot grant posthumous skills or intelligence that the body/hero imprint did not preserve.
- Local signal network does not work without real route/signal reach; no ghost orders.
- Body-specific equipment cannot fit impossible anatomy or multiply inventory.
- A found corpse cannot simultaneously be consumed as a carcass and remain eligible for revival where actions are exclusive.
- Opening building recipes and upgrades match their original authoritative contracts.
- New construction buttons remain disabled until blueprint recipe, workers, work units, output and hash exist; no separate corpse-inspection, command-UI or system-market building can be used as an artificial gate.
- Lair and treasure registries retain their exact pre-T0 identities; scanning/exploration cannot spawn new targets.
- Same deterministic seed/actions produce the same economy, battle, loot and progression results, including after save/load.


***
**Integrated design version 0.3:** Full magical variant definitions are deliberately maintained once in the linked v0.3 catalog to prevent contradictory duplicate copies.


---
## EVENT-SOURCE-INVENTORY OVERLAY — v0.4 (9 October 2026)

New research assets in the same deliverable package:

- `Lord_DnD_Event_Shops_Chests_Source_Audit_v0.1.md` — original novel chapter-backed study, item descriptions, event-to-schedule coverage, mismatches.
- `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.1.json` — 30 scheduled event records and verified shop/chest candidates with source URLs, chapter IDs, prices, stock limits where verified and explicit research-only status.
- `Lord_DnD_Event_Source_Items_v0.1.csv` — spreadsheet-friendly review of source-exclusive event candidates.

These assets supersede **only the earlier assumptions that every event's items and blueprints are already accurately represented by its authored File 01 shop inventory**. The old source release and campaign saves remain unmodified.

### Binding to the magical structure catalog

1. The 143-branch magical building design catalog is an independently proposed **game system**; it is not permission to fill the historical Dragon/Blood/Dream event chests with those branches.
2. **Event-specific building blueprints** evidenced in the novel may become eligible once mapped to a concrete, scenario-versioned event shop. Examples: frost/snow turrets, frost walls, dragonblood training camp and frost catapult in EV02; blood-war camp, altars, cannon and legendary tower in EV13; endgame Mạc Tân Trụ and Thần Điện Lãnh Chúa evolutions in EV14.
3. Store `source_name_zh`, `display_name_vi`, `source_chapter`, `source_url`, `event_id`, `source_shop_id`, `source_currency`, `source_price`, `purchase_limit_scope`, `phase`, and `reward_item_id` before accepting a blueprint.
4. Do not make an upgraded structure appear in the standard construction menu as a fresh building if it requires a specific already-built predecessor (for example an endgame core structure).
5. The event reward compiler must fail closed for unknown chest weights/limits/phase triggers. Observed source rolls are candidate pool evidence, not random weights.
6. **Read-across conflict to resolve in File 01:** `SHOP-DRAGON-2.0` is referenced by the overlapping EV02/EV03/EV04 windows. An EV02 close must not accidentally close a separately valid EV04 store, and no EV02-exclusive drop may persist beyond its own event's expiry. Use explicit shop-window identity/phase plus per-item `event_origin_id` rather than one universal store-close flag.
7. The source-backed fish example is an NPC-organized krone contest; `SHOP-FISH-1.0` is campaign-authored. Never relabel it as novel-explicit.

**Status:** extraction and proposed integration, not a running game / not modification of `CANON-EVENT-LEDGER-4.0`. Items and magic blueprints will become actual game content only after an explicit event-pack compile, precise source/campaign provenance, and deterministic chest precommit.


## v0.6 — Event-source second extraction

The first-pass event source registry has been supplemented with `LL-WEB-EVENT-SOURCE-EXTRACTION-0.2` and the companion audit `Lord_DnD_Event_Second_Extraction_Audit_v0.2.md`. The second pass adds wave-clear chest awards, Skork Rat bag/achievement paths, missing initial Dream Shop offers, and follow-up Blood shop building effects. All are research only and keep the thirty LL01 scheduled event windows unchanged. Never treat cumulative multi-bag rewards as single-bag guaranteed contents or source novel one-month Skork timing as the eight-day LL01 event.


## Appendix — Event chronology reconciliation v0.6 RC1 (supersedes v0.5 chronology assumptions)

Event shop and chest source extraction v0.2 remains a **research baseline**; chronological claims in that extraction are replaced by `Lord_DnD_Event_Timeline_Reconciled_v0.6.json` and `Lord_DnD_Event_Timeline_Reconciliation_Audit_v0.6.md`.

A new fixed 30-ID **pre-T0 proposed schedule** is required. It corrects the explicit original-novel 10-day qualifier; 30-day Oracle War; seven-day development + ten-wave one-off siege; overlapping 100-day Dream and 30-day Rat treasure hunt starting 24h later; and the fact that the Anno tournament is local rather than a global point shop. Existing relative campaign-authored arcs retain their duration, rebased after these hard chronology changes.

**Do not deploy by copy-pasting new dates into the old File 01.** File 05 reads `CANON-EVENT-LEDGER-4.0` and the release-lineage manifest binds exact source releases. A formal, new File01 + File05 + manifest generation and fresh-world validation is needed. No existing-save event transaction or known reward instance is replayed or rerolled.

**Source conflict:** Ch.809 says Dream launches on upheaval day63; ch.829 describes upheaval day94, Dream with 59 remaining. That is not arithmetically consistent with the explicitly announced 100-day duration. Use 100-day + 24h start + 30-day Rat relative rules and record chapter-day numbers as unresolved evidence.

**Acquisition correction:** Rat event has physical treasure bags, first-kill prize, ground drops and 10/100/1000 kill milestones. Never invent a rat-ticket storefront or purging leaderboard; Dream Shop offers shown in ch.811 are visible then even if purchased in ch.892.


**Final QA note:** Source-shop rows `SX-0014`–`SX-0016` are now assigned to **EV08** (Chapter 362) rather than EV02; the shared base Dragon Shop is kept as a distinct offer group. Dream Chapter 892 records are purchase timestamps, not offer openings. Oracle's textual **one month** is represented as **30 game days by explicit adaptation**.


## Appendix — Third event content extraction v0.3 (on fixed timeline v0.6)

Additional 32 **source-backed** records in `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.3.json`, total 189. Added EV08 qualifying-shop and Epic Wheel outcomes (chapter 424), EV09 Oracle War purchases and rank receipt (chapter 454), EV11 source settlement with three separate chest-batch groups (chapters 519–520), and EV18 personal S-rank quest milestones distinct from boss drop (chapter 886). The EV20 Lucky God Wheel (ch932) is a **challenger risk/reward site**, not a random shop. The chapter 520 War Research Institute, Imperial Knight Training Camp and Expert Lighthouse Upgrade are actual source building-blueprint outputs; adoption into LL01 requires separate prerequisite/recipe validation. See `Lord_DnD_Event_Third_Extraction_Audit_v0.3.md`. The 30-event v0.6 timeline stays **byte-for-byte conceptually identical**, no current campaign state is modified.


## Event fourth extraction (v0.4) — integration reference

The stand-alone source content registry `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.4.json` supersedes research extract v0.3 **without changing** the fixed v0.6 event timeline or active File01/File05. Its 20 new rows add: 16 event E–SSS Dragon test receipts from the source Ch.1147 panel (eight grades × currency/chest) and four **alternative** Ice Dragon Core spends from Ch.372.

The 1147 grade values add to 6,990 Dragon Coins, while the source prose says 6,980. This is an unresolved source arithmetic conflict, not permission to change an item or round a number. A top-100 mystery reward is indicated but not identified; do not generate it yet.

Chapter headings referring to rare late Ancient Dragon shops, Creation Light, War Lord armor and tower trials remain research leads until item names, prices, owners and triggers can be verified from actual chapter text. No previously committed item, chest, reward or save is rewritten.

- Fourth extraction audit: `Lord_DnD_Event_Fourth_Extraction_Audit_v0.4.md`
- New combined registry: `Lord_DnD_Event_Shops_Chests_Source_Extract_v0.4.json`
- New combined review sheet: `Lord_DnD_Event_Source_Items_v0.4.csv`


## Appendix — Fifth event content extraction (v0.5)

**Status:** research-only; parent v0.4 209 event records preserved, 17 appended records: 1 research-only Creation Light blueprint identity (`SX-0210`), 7 EV04 source shop offers and 9 EV04 conditional rank reward bundles, for **226** total. Evidence is a **partial Chapter 1123 excerpt**, and **does not establish** shop stock, event-chest contents, construction recipe, final numerical combat formula or universal reward status. EV23 is only a chapter-arc mapping, not a confirmed acquisition transaction. Ch.175 purchase receipt (87 Primary Hearts of Power for 87,000 dragon marks) corroborates existing `SX-0012` rather than duplicating it. See `Lord_DnD_Event_Fifth_Extraction_Audit_v0.5.md` for late-game leads, mirror problems and explicit unresolved contracts.

The fixed v0.6 calendar, all previous records, and live File01/File05/campaign saves remain unchanged.

### Fifth-pass extended evidence: EV04 first regional merger

Further verified **7 previously unrecorded shop offer contracts** and **9 complete ranking reward bundles** from an alternate-edition mirror `第386节` (original first merger arc ~Chapter 201). Details/limits/prices in `Lord_DnD_Event_Fifth_Extraction_Audit_v0.5.md`. Along with the research-only Creation Light blueprint, v0.5 now has **226 total event records (17 new)**. This EV04 panel is separate from EV08's later second Dragon qualifier. Fixed timeline and source rows remain unchanged.
