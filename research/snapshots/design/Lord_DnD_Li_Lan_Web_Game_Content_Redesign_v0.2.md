# LORD DND WEB GAME — LI LAN–CENTRIC CONTENT REDESIGN
**Proposal ID:** `LL-GAME-CONTENT-REDESIGN-0.2`  
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

## 3. Buildings — SOURCE-FIRST REPLACEMENT (v0.2)

> **Correction:** The previous proposal for 20 mainly informational/logistics buildings is withdrawn. The source's construction model is **productive, residential, military, skill-training, agricultural and supernatural**. A structure must provide a substantial mechanic the player cannot already perform freely from the system UI. Building a "corpse examination station" is **forbidden**; valid corpse details already exposed by the interface are accessed there, with no new prerequisite.
>
> **Labels:** `[FIXED FILE]` = already defined by the Lord DnD rules; `[EXISTING SAVE]` = known from D1 22:00 carryover, **not** part of clean T0 stock; `[NOVEL EXPLICIT]` = observed in the controlling original novel, but NOT automatically learned/owned in LL01; `[PROPOSED ADAPTATION]` = requires a new, fully authored versioned game-specific blueprint before it can exist.

### 3.1 What a meaningful building does

A player should be able to say, in one sentence, what **new physical output, trainable capability, army function, recruitment channel, environmental service or strategic access** completing the structure provides.

Acceptable examples:

- **Lò Than**: take wood and manufacture actual coal, replacing a supply-chain bottleneck.
- **Xưởng Cơ Khí**: turn known parts into transport vehicles or machines.
- **Tháp Pháp Sư**: train compatible magic users and, where the source supports it, offer meditation and skills.
- **Tháp Bắn Tên Băng**: automatically attack enemies in actual line/range with a cold/slow effect.
- **Xưởng Luyện Dược**: craft known potion recipes from real ingredients and staff work.
- **Ruộng / Giếng**: grow harvested food and supply water using real land/water constraints.
- **Quán Rượu**: attract **world-existing** travelers and potential recruits rather than minting citizens.
- **Thư Viện Mộng Cảnh**: a very rare high-tier source-style power/location with its own explicit reward-access contract.

Forbidden "buildings": an inventory viewer; a corpse inspector; a quest-log building; an order-queue house; a structure whose only purpose is tracking a worker; a renamed radius/coordination multiplier; a second warehouse for a commodity unless it offers genuinely distinct storage physics; a building that secretly powers or charges Lí Lan's free Tử Phục.

### 3.2 Unchanged foundational facilities `[FIXED FILE]`

After repair of Nhà Lãnh Chúa, preserve the 11 built-in Level 1 options and their **existing exact** edges:

| Built-in structure | Real output | Owner |
|---|---|---|
| Lò Sưởi Đơn Giản | Local heat, paid with fuel | `OPENING-FIXED-BUILDINGS-2.0` |
| Bếp Đơn Giản | Prepared meals from ingredients | Same |
| Xưởng Gỗ | Processed wood/material batches | Same |
| Tiệm May | Garments and sewn gear | Same |
| Xưởng Chế Biến Quặng | Ore processing | Same |
| Lò Rèn | Forged tools/weapons from metal | Same |
| Nhà Nông Phu Cực Địa | Four starting housing slots and recruitment for food | `POLAR-FARMHOUSE-PROGRESSION-2.0` |
| Phòng Y Tế | Real treatment for living residents | `OPENING-FIXED-BUILDINGS-2.0` |
| Nơi Trú Nhỏ | Shelter/rest capacity | Same |
| Tường Rào | Physical barrier against intrusion | Same |
| Cổng | Physical controlled breach/access in walls | Same |

Also retain the separately fixed **Lửa Sinh Tồn**, **Nhà Lãnh Chúa**, **Ngôi Mộ**, and starting **Hòm Vật Tư**. No new building may supersede their distinct level tracks or install another hidden gate on Tử Phục.

Original file evidence: **File 04 §14.6 / Appendix 4.M; File 01 `POLAR-FARMHOUSE-PROGRESSION-2.0`; File 06 T0**.

### 3.3 Already accepted or known to Lí Lan's campaign `[EXISTING SAVE]`

| Blueprint / structure | What it does | Save reality at D1 22:00 |
|---|---|---|
| **Kho Gỗ Có Mái** (`BP-008`) | Physical covered wood stock | Learned and built; `15 Gỗ + 5 Đá`, `1 WU`, max 2 workers |
| **Tháp Canh Gỗ** | Staffed watch platform / defensive lookout, not supernatural detection | Learned, unbuilt; `45 Gỗ + 15 Đá + 15 Sắt`; `3.75 WU`, max 4 |
| **Bẫy Thú Tuyết** | Real deployed trapping device | Learned, unbuilt; `8 Gỗ + 2 Sắt`; `0.75 WU`, max 2 |
| **Trạm Lò Than** | **Gỗ → Than** for actual fuel stock | Learned, unbuilt; `45 Đá + 15 Gỗ + 15 Sắt`, `3.75 WU`, max 4; precise wood-to-coal operating conversion **not recorded** |
| **Bãi Đá Gia Cố** | Physical stone handling/storage facility | Named blueprint, **not owned at this checkpoint** |
| **Trạm Nấu Tuyết** | Physical production of usable water from snow/ice | Named blueprint, **not owned at this checkpoint** |

These six are stronger starting examples than my invented "command relay" or "corpse diagnosis" buildings. The charcoal kiln is particularly relevant because Lửa Sinh Tồn already has a source-established fuel distinction between wood and coal.

**Note:** This D1 22:00 checkpoint is historical scenario state, not an instruction to grant the blueprints at clean T0. Later valid accepted events would take precedence in an existing-save migration.

### 3.4 Buildings explicitly illustrated in the novel `[NOVEL EXPLICIT]`

This is a **source evidence table**, not an ownership, drop or unlock table. Each entry must be mapped to a licensed/appropriate game content contract and scenario-specific acquisition if adopted.

| Source building (Vietnamese working name) | What the novel actually describes | Original chapter / evidence |
|---|---|---|
| **Nhà Vệ Sinh Đơn Giản** | Handles sewage and converts excrement into fertilizer: sanitation feeds agriculture | Ch.114: [blueprint/materials](https://www.69shuba.com/txt/58776/38393217) |
| **Đường Lát Đá** | Physical paving increases movement of residents and vehicles; built as segments, not a "global travel buff" | Ch.114: [floor blueprint](https://www.69shuba.com/txt/58776/38393217) |
| **Tháp Bắn Tên Nguyên Tố** | Automatically attacks nearby hostile creatures; actual attack profile and combat timing | Ch.99: [defense in operation](https://www.69shuba.com/txt/58776/38259982); Ch.162: [upgrade](https://www.69shuba.com/txt/58776/38677936) |
| **Tháp Bắn Tên Băng** | Attacks and slows enemies; a distinct tactical defense option, not just another cosmetic tower | Ch.116: [stats and blueprint](https://www.69shuba.com/txt/58776/38465521) |
| **Nhà Giả Kim / Xưởng Luyện Dược** | Makes valuable and sellable potions/medicine from learned recipes and actual herbs | Ch.301: [advanced upgrade](https://www.69shuba.com/txt/58776/39126385); Ch.357: [recipe uses](https://www.69shuba.com/txt/58776/39260279) |
| **Tháp Pháp Sư** | Meditation facilities, skill-learning opportunities and progression of compatible magic users | Ch.205: [blueprint](https://www.69shuba.com/txt/58776/38825388); Ch.302: [meditation](https://www.69shuba.com/txt/58776/39126386) |
| **Điện Đường Kỵ Sĩ** | Knight training, XP and eligible learned skills, using actual training occupancy | Ch.205: [knight hall blueprint](https://www.69shuba.com/txt/58776/38825388) |
| **Trại Chiến Binh** | Trains compatible warrior-class units and permits specified weapon skills | Ch.256: [blueprint and skills](https://www.69shuba.com/txt/58776/38985080) |
| **Sân Tập Cung Thủ** | Named source blueprint for archer specialization; detailed effect not verified in reviewed extracts | Ch.301: [market receipt](https://www.69shuba.com/txt/58776/39126385) |
| **Xưởng Cơ Khí** | Manufactures carts/vehicles, later machines and logging robots; depends on real technical knowledge | Ch.245: [new capabilities](https://www.69shuba.com/txt/58776/38948726); Ch.298: [vehicle/robot production](https://www.69shuba.com/txt/58776/39123193) |
| **Ruộng Canh Tác / Giếng Nước** | Tilled plots, crops and fresh-water access; real settlement agriculture | Ch.276: [field and well construction](https://www.bq8xsw.com/10082436/11073032.html) |
| **Quán Rượu** | Storage and recruitment reach, improves access to world travelers; physical drinks/visitors | Ch.256: [tavern upgrade](https://www.69shuba.com/txt/58776/38985080) |
| **Tượng Thần Thợ Rèn** | Major equipment-forging speed/success benefits after expensive, high-level construction | Ch.339: [epic blueprint](https://www.69shuba.com/txt/58776/39230701) |
| **Đại Truyền Tống Trận** | Connects permitted destinations; real massive distance/capacity/cooldown and ownership conditions | Ch.339: [spatial blueprint](https://www.69shuba.com/txt/58776/39230701) |
| **Thư Viện Mộng Cảnh** | Legendary site offering progression and special rewards, **not** a normal starting library | Ch.730: [rarity/capability context](https://www.69shuba.com/txt/58776/40564733) |
| **Tĩnh Trệ Ma Năng Phương Tiêm Tháp** | Legendary area-scale magical shield and attack-interference mechanics, with explicit charge/technical issues | Ch.730: [legendary structure](https://www.69shuba.com/txt/58776/40564733) |

Some of these are ordinary infrastructure; some are blueprints; some are exceptional treasures that are **not** freely replicable. Do not give every structure eight arbitrary upgrades or make a unique legendary relic infinitely craftable.

### 3.5 What the revised Lí Lan building roster should actually prioritize

Instead of inventing 20 structures, use **the following real functions from the sources**, in meaningful progression stages.

**Early game — survival and resource processing**

1. All fixed starting structures.
2. **Trạm Lò Than** — takes wood and produces coal, connecting directly to the existing Survival Fire fuel economy.
3. **Kho Gỗ Có Mái** and **Bãi Đá Gia Cố** — physical resource storage, not generic "inventory capacity aura".
4. **Trạm Nấu Tuyết / Giếng Nước** — water production/access as and when their blueprint/site is actually available.
5. **Nhà Vệ Sinh** — resident sanitation **plus fertilizer production**, directly supporting later food growth.
6. **Đường Lát Đá** and **Bẫy Thú Tuyết** — actually faster traversable tiles and physical hunting/trapping installations.

**Growing settlement — manufacturing and food independence**

7. **Ruộng Canh Tác** — actual crops/seeds/growing periods with heat/water/land requirements.
8. **Xưởng Luyện Dược** — healing, cold-resistance, spell-support and combat potions where recipes exist.
9. **Xưởng Cơ Khí** — transport vehicles and other verified machines; do not invent free automation.
10. **Quán Rượu** — hospitality, physical drinks and access to real travelers/recruits; does not automatically create arbitrary hero tokens.

**Military specialization — tangible units, training, and defense**

11. **Tháp Bắn Tên Nguyên Tố** — autonomous damaging defense with target selection/range/ammunition or magical fuel as prescribed.
12. **Tháp Bắn Tên Băng** — trades damage/rate/requirements for documented slow effects.
13. **Tháp Pháp Sư** — meaningful training venue for Lí Lan's **mana-based career skills** and compatible subordinate casters; does not affect her free SSS Tử Phục.
14. **Trại Chiến Binh** — trains compatible troops; not a factory that creates zombies from nothing.
15. **Điện Đường Kỵ Sĩ** — only if suitable knight-type units are actually present and the source blueprint is acquired.
16. **Sân Tập Cung Thủ** — only after authoring/verifying its exact eligible skills and action rules.

**High development and exceptional finds**

17. **Tượng Thần Thợ Rèn** — special forging quality/productivity, not an ordinary forge replacement.
18. **Truyền Tống Trận** — large-scale movement between authorized, fully established points, subject to high prerequisites.
19. **Thư Viện Mộng Cảnh** — special legendary progression; its reward mechanism must come from an authored source contract.
20. **Tĩnh Trệ Ma Năng Phương Tiêm Tháp** — a unique late-game strategic defense if and only if an appropriate source-origin, acquisition event and energy contract are established.

This is **a roster of relevant source-proven building concepts**, not a directive to seed all 20 at T0 or to issue new blueprints from nowhere.

### 3.6 Explicit design consequences for the fixed protagonist

**Tử Phục is not a building tree.** Lí Lan can inspect an accessible corpse through the system interface to the extent the existing system law allows, perform eligible Tử Phục directly at zero cost, and assign her units through normal commands.

Consequently:

- **No** corpse-identification building.
- **No** warehouse required to make Tử Phục legal.
- **No** resurrection altar required to make Tử Phục free.
- **No** "death-energy production building" charging for a talent that has no such cost.
- **No** military command building whose real purpose is an orders panel.
- **No** XP-training building awarding XP to idle zombies who cannot legitimately perform its training.
- **No** generic "necromancer building" just to make the content match her talent.

What **does** matter: **food and housing** sustain living workers; **coal** keeps heating running; **ore/forges** make usable equipment; **alchemy** supplies buffs and remedies; **farms and water** expand population; **mechanical works** increase real productive capacity; **defenses** deter or injure invaders; **training buildings** improve eligible characters; **special buildings** yield exceptional late-game strategic changes.

Her unusual advantage is that actual corpses can become a labor/military force when her existing rule permits it. **That changes the strategic value of normal buildings**, without turning the normal buildings into counterfeit necromancy mechanics.

### 3.7 A better construction card: two verified examples

#### Source-confirmed example: Nhà Vệ Sinh Đơn Giản

- **Source:** Novel Ch.114.
- **Footprint:** 20 m².
- **Initial construction materials in the chapter:** 50 wood, 20 stone, 5 iron.
- **Effect:** sanitation + sewage processing + fertilizer output.
- **Game loop:** resident waste → sanitation processing → fertilizer → agricultural production.
- **Not inferred:** exact fertilizer/hour, staff need, treatment radius, WU or further upgrades. Those require a versioned game adaptation, never a guessed "source number".
- **Why a structure is warranted:** It **physically transforms a waste flow into an agricultural input**.

#### Source-confirmed example: Tháp Bắn Tên Băng Sơ Cấp

- **Source:** Novel Ch.116.
- **Footprint:** 15 m²; building height 14 m.
- **Initial construction materials in the chapter:** 1000 wood, 500 stone, 120 iron, 50 ice crystals, 20 mithril.
- **Source attack:** 225–237, one attack every 3 seconds, maximum range 700 m; 30% chance to apply 30% slow for 5 seconds.
- **Game loop:** existing enemy enters valid firing range → tower selects legitimate target → attack roll/damage/status → casualty/loot provenance.
- **Not inferred:** power/ammunition expenses beyond the chapter's actual contract; don't invent additional consumption just to nerf it.
- **Why a structure is warranted:** It is an actual **automated combat installation**, with a measurable effect on battlefield defense.
- **Import note:** numbers above are direct *novel example values*, not yet legally/technically incorporated into a newly versioned LL01 web-game blueprint.

### 3.8 Release and acquisition policy

- Built-in opening buildings remain fixed and available only after their existing unlock.
- Existing LL01 learned blueprints belong to the **existing campaign save**, not the clean T0.
- Source-novel buildings are **candidates**, not items already possessed by Lí Lan. Their blueprint appearance must be committed through a valid chest/shop/quest/event/technology path **before** the player acquires it.
- Legendary structures are **unique instances or tightly bounded blueprints** according to their actual origin; never generic construction menu entries.
- A missing blueprint's recipe, operating capacity, durability, stats or acquisition contract must be **authored/versioned before it becomes buildable**, not filled with convenient placeholders.
- Separate **construction inputs** from **operating inputs**. Unlocking a recipe does not grant the produced item.
- Preserve File 01's four independent advancement tracks: territory stage, Survival Fire, Lord House and individual buildings. Lí Lan's personal Bậc remains a separate combat axis.
- Do not re-roll locked lairs, chest contents, achievements or historical event outcomes to place new buildings near the player.

### 3.9 Earlier proposal items that are withdrawn

The following are **not separate buildable structures** in the revised list:

`Trạm Kiểm Thi`, `Sân Điều Lệnh`, `Tháp Truyền Lệnh`, `Trạm Vận Chuyển Thi Hài`, `Kho Xác Niêm Phong`, `Xưởng Giáp Tử Thể`, `Tiền Trạm Trinh Sát` (as a custom facility replacing ordinary camps), `Đài Canh Tuyết` (as an unjustified distinct variant), `Trạm Dự Báo Bão`, `Kho Hàng Chuyển Tải` (as a generic duplicate warehouse), `Xưởng Xe Trượt Băng` (sleds are item recipes manufactured in appropriate workshops), `Nhà Kho Lương Cực Hàn` (until distinguished from existing storage), `Trạm Lọc Tuyết` (use the already defined Trạm Nấu Tuyết where available), `Nhà Kính Cực Địa` (until its independent heat/food mechanism is evidenced), `Trạm Sơ Chế Chiến Lợi` (butchering/decomposition is an action where appropriate), `Phòng Địa Tầng` (no building gate on system-provided information), `Kho Khí Giới Quân Đoàn` (inventory/storing/equipping are not by themselves structures), `Đồn Biên Phòng` (use known military infrastructure), `Trạm Thương Đoàn` (do not substitute a building for the system market), and `Nghị Sự Đường` (no need unless a real polity/institution justifies it).

These may be normal rooms, equipment, job types, NPC services or future *genuinely distinct* building candidates, but they are **not a valid new building catalog now**.

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

## 8. Suggested first implementable content batch — REVISED

**Settlement:** the fixed eleven build options, plus the separate Nhà Lãnh Chúa, Ngôi Mộ and Lửa Sinh Tồn. No additional talent gate or corpse-analysis building.

**Early acquired blueprints in the existing D1 scenario:** Kho Gỗ Có Mái, Tháp Canh Gỗ, Bẫy Thú Tuyết, Trạm Lò Than. They are **not** granted in a fresh T0 save.

**First game-specific additional blueprint to author:** Nhà Vệ Sinh Đơn Giản, with its source-established sewage-to-fertilizer function and directly evidenced chapter-114 materials. This creates meaningful agricultural production later.

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
