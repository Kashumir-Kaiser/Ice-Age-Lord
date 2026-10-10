# Ice Age Lord — Asset Art Bible

**Status:** APPROVED VISUAL DIRECTION / PRODUCTION RULES — 2026-10-10  
**Scope:** player portraits, hero portraits, items, world maps, settlement, buildings, strategic markers, combat units, effect layers, and all future asset families  
**Home:** assets/README.md  
**Associated technical contract:** assets/ART-DIRECTION.md and assets/manifest.json  
**Target application:** React/TypeScript frontend, territory/isometric view, strategic world map, independent game simulation

> **The definitive style decision:** Player character artwork, hero artwork, item artwork, world-map artwork, and all settlement/building artwork use **INK / INK-WASH DARK FANTASY**. **Unit artwork uses SEMI-REALISTIC PAINTERLY FANTASY**. These are two coordinated but visibly different production styles. Their shared setting, palette, lighting logic, construction materials, and faction motifs unify them; they must not be collapsed into a third generic style.
>
> This file is a production art-direction rulebook, not a mechanics change, not a source-fiction rewrite, and not permission to invent unlocked constructions, real player ownership, discovered sites, item powers, or combat effects.

---

## 0. Quick decision ledger

| Surface | Mandatory art style | Notes |
|---|---|---|
| Lí Lan / playable character portrait | INK | Character portrait, narrative key art, avatar, profile, promotional crop |
| Named heroes / named important characters | INK | Including portraits of heroes who also possess a battlefield representation |
| Inventory items, equipment, resources, chests and blueprints | INK | Functional item silhouettes with selective material color |
| World map, geographical terrain, site illustrations, fog edge | INK | Geographic readability outranks decorative scenery |
| Settlement territory, ground, buildings and architectural upgrades | INK | Fixed dimetric building camera; modular silhouette and separated layers |
| Individual ordinary units, squads, enemies, undead, wildlife | SEMI-REALISTIC | Battlefield bodies, unit cards, silhouettes, combat animations |
| Named hero when deployed as a battlefield unit | SEMI-REALISTIC | The **portrait is still INK**; battlefield depiction follows unit language |
| UI architecture, decorative dividers, badges and frames | INK-ADJACENT | Restrained ink-and-metal treatment; do not sacrifice interface legibility |
| Fire, snow, blizzard, magic, smoke, visibility, selection, heat | RUNTIME VFX | Style-aware overlay; never substitute visual effects for state or footprint |
| Concept boards and cinematic promotional paintings | FLEXIBLE | Can mix styles if explicitly labeled; never silently become gameplay sprites |

An asset must declare its role before artwork begins. A beautiful illustration of a military unit is not a substitute for a registered unit sprite. A portrait of a hero is not the same file as a deployed hero's battlefield body. Conversely, the player or hero portrait must not become semi-realistic merely because combat units are semi-realistic.

### 0.1. Which documents control what?

1. Active game/source registries and the fixed clean-T0 contract control identity, physical world facts, Fire progression, available content, construction permissions, and event state.
2. The current game's asset manifest and runtime contract control paths, layers, anchors, LOD, geometry and deployment.
3. **This README** controls the new approved visual style, including subject assignments, composition, environmental mood, authoring prompts and art QA.
4. assets/ART-DIRECTION.md preserves previously implemented technical export constraints and notes on existing original SVG placeholders. Where it still describes a broad placeholder look, interpret the finished art according to this README.
5. The displayed concept art and the sample Survival Fire progression are **illustrative references**, not approved production geometry, not physical build data, and not an alternate 1–30 Fire progression registry.

If a requirement conflicts, record the conflict and reconcile the correct owner. Never solve it by redrawing a physical rule, changing gameplay values, or choosing the prettier approximation.

---

## 1. The game's visual identity: one world, two rendering dialects

Ice Age Lord begins in a frozen ancient battlefield rather than a prosperous medieval city. A small real fire separates survival from exposure. Old broken walls, stone fragments, buried corpses and abandoned materials make the place feel inhabited by the dead long before the player arrived. Early gameplay must look cold, costly and materially scarce. The hopeful visual element is not a sunlit kingdom or a parade of magical crystals. It is **a tiny, credible pocket of human-built warmth surrounded by an overwhelmingly indifferent landscape**.

The larger progression eventually becomes a dense lordship, a fortified settlement, a working furnace economy and ultimately structures that use explicit magical and energy systems. Expansion must feel earned in the picture. Each new architectural stage needs an evident historical layer: rough stones are reused, timber is braced, metal is fitted, masonry thickens, services and routes appear, and later specialized components visibly alter the structure's function. Avoid a purely cosmetic succession of larger golden castles.

The two prominent art styles serve different needs:

**INK is the world-facing, collectible and narrative dialect.** It emphasizes shape, age, history, implied material, atmospheric scale, personality and a strongly authored hand. Ink is not shorthand for black-and-white line drawing only. It means expressive edges, strategically broken contours, wash gradients, paper-like granulation in the painted material, economical selective color, silhouettes that survive at small scale and expressive asymmetry. The settlement, map, player, hero and item assets must visibly share this family.

**SEMI-REALISTIC is the embodied combat dialect.** Units must feel physical: armor has thickness, fur mats with frost, weight is carried through the feet, weapons can plausibly be held, corpse flesh and bone have coherent construction, and expressions and anatomy remain credible. Forms are simplified for game use but never become cartoon mascots. The painting is naturalistic enough to support identification of species, troop role, current condition, equipment and silhouette.

The bridge between the styles is not a filter slapped over every piece. It is a common world bible: same culture-specific designs, resource scarcity, palette, weathering, faction heraldry, garment materials and restrained magical vocabulary. A hero's ink portrait and semi-realistic deployed battle body should read as the same person with the same equipment and distinctive features.

---

## 2. Mandatory emotional tone

The dominant emotions are exposure, vigilance, ancient loss, survival and gradually earned authority.

In the opening hours the environment should feel wider than the player's resources. Empty snow fields need enough negative space to feel desolate. Buildings should be small, damaged, provisional or visibly crude. Fire must be visually important precisely because it is limited. Snow reflects a pale sky; unheated surfaces are dirty blue-grey. There may be wind-cut ridges, ice rubble, cracked earth, buried old masonry and strange marks in exposed stone, but do not populate every square metre with skeletons, runes or collectible trinkets.

The game's horror is **environmental and historical**, not constant jump-scare gore. The ancient battlefield can imply mass death through fractured weapons, eroded memorials, unearthed remains, warped tomb portals and unnatural stillness. Necromancy is functional and unsettling. An ordinary zombie should not always have a boss-tier crown, cyan flames, floating bones and a halo.

As the territory develops, warmth, labor and social presence should accumulate within the available heat. The territory should become more orderly through roads, fencing, supply stacks and specialized construction. Keep the world beyond that warmth cold and unconquered. The territory must not automatically become a bright fantasy city or beautiful summer valley merely because the Fire has leveled.

At advanced levels, magical technology must still respect the winter apocalypse. Blue-black energy towers, scorched industrial chambers and rune-bound thermal conduits belong in the same landscape, not on an unrelated sci-fi starship. Big structures are impressive through mass, function, engineering and the surrounding settlement's response, not through a wall of bloom.

### 2.1. Desired contrast pairs

- Frozen open ground versus small amber heat pocket.
- Human-scale shelter versus monumental buried ruins.
- Material scarcity versus visible crafted improvements.
- Physical death and decomposition versus controlled necromantic usefulness.
- Ink silhouettes with open negative space versus closely detailed unit armor.
- Silent weather versus concentrated activity near useful infrastructure.
- Old stone and weathered wood versus progressively refined iron, copper, rune stone and later energy materials.

### 2.2. Absolutely avoid a default heroic mood

No universal sunrise triumph, pristine white marble, fairy-tale pastel village, bright toy-like grass, floating loot labels, flamboyant saturated character auras or obligatory heroic banners on each shack. Any celebration must arise from a real milestone. The base world remains dangerous.

---

## 3. Palette specification and color hierarchy

Color is a utility as well as an atmosphere. The ink surfaces should remain desaturated and value-organized. Semi-realistic units share the materials but can use slightly broader local color to identify role and origin.

| Token | Suggested starting reference | Intended use |
|---|---|---|
| Abyss ink | #11191D | Strongest dark contours, silhouette cavities, UI depths |
| Charcoal wash | #27343C | Dry timber shadows, smoke-dark masonry, ink pools |
| Iron blue-grey | #405562 | Repeated architectural body shadow |
| Slate frost | #677D88 | Neutral stone, compacted blue ice |
| Cold midtone | #899DA8 | Snow shade, distance, metal reflection |
| Frost paper | #C2CCD0 | Broad light planes, readable pale stone and snow |
| White snow accent | #E3E6E0 | Sparse brightest cold points, not continuous white |
| Ember dark | #903F2C | Glowing coal, muted red-ochre in fabric |
| Heat amber | #DB8D4B | Actual warm fire and firelit surfaces |
| Flame cream | #F3C785 | Tiny hottest visible flame areas |
| Ancient crimson | #7B393B | Limited cloth, thread, seals and faction accents |
| Necromantic teal | #608D90 | Sparse authentic necromantic sources only |
| Energy blue-black | #2D5367 | Late energy infrastructure, restricted by progression |
| Weathered brass | #A08B66 | Rare fittings, elite equipment, emblem trim |

These are guidance swatches, **not gameplay values** or a requirement to recolor every pixel. Test in context and account for weather, time of day and display calibration.

Use about 70–85% cold/neutral area in ordinary winter environment studies; the remaining visual attention should come from localized fire, meaningful insignia or other motivated focal elements. This ratio is an art review heuristic, not a renderer uniform or hard production percentage. Saturation should usually decrease with distance and lower importance.

**Fire orange is not an all-purpose highlight color.** It means actual combustion, hot metal, flame-reflecting snow, a heat source or a deliberately crafted warm signal. **Blue magic is not an all-purpose high-rarity color.** Assign magical hues according to verified identity and source effect. If an item has no magical effect, do not paint an aura to make it enticing.

### 3.1. Material color rules

Fresh snow: near-neutral light grey with cold blue-violet reflected shadows; slightly warmer at physically nearby flame. Deep snow: layered blue-grey pockets and hard wind-packed ridges. Ice: muted blue-green translucent bands, fractures and dirty inclusions rather than solid neon cyan. Timber: grey-brown, cracked and dry, with visible end grain; charred wood gets irregular soot. Stone: various shale/slate greys; break lines follow believable blocks. Iron: blued charcoal, oxidation, edge wear. Copper: subdued warm brown with tarnish; do not turn all copper into gold. Leather and fur: weathered, practical, visibly used. Bone: off-white, grey-green in crevices, cold shadows, not clean plastic white.

---

## 4. INK / INK-WASH production language

Ink here is a **hand-authored dark-fantasy illustration grammar**, suitable for playable buildings and world maps, not a blanket Japanese or Chinese costume shorthand.

Contours should vary by material and importance. Use a strong external line or compressed dark edge for the main silhouette, broken interior brushwork for stone or fur, soft washed absence for snowfall, and exceptionally thin lines for secondary cracks. A focal edge may be sharp while a snow-dusted far wall simply dissolves into a pale wash. Never outline every brick and every tuft at the same strength.

Wash texture should describe actual substance. Brush granulation suggests frost, old mortar, ash and rubbed pigment. It must not be a rectangular paper overlay glued to transparent sprites, nor noisy scanned texture that flickers when zoomed. Preserve alpha outside the silhouette. Avoid arbitrary black splatter over clickable footprints because it makes buildings look larger than their registered ground occupancy.

The best ink assets exhibit both bold and quiet areas. Details gather where the player looks: entrances, roof profile, heat source, special mechanism, damaged edge, icon-driving contour. Broad ice banks, flat walls and shadowed secondary roofs can remain comparatively simple. This is essential when hundreds of structures occupy the Lãnh địa screen.

Use deliberate asymmetry but maintain alignment. A damaged building can have its roof pulled down on one side; a windward snow drift must show directional consistency. A symmetrical ritual structure may still have weathering and erosion without becoming visually random.

### 4.1. Ink treatment by layer

**Primary silhouette:** bold, unambiguous exterior contour.  
**Structure face:** layered charcoal/slate washes and material-specific hatching.  
**Secondary detail:** broken dry-brush edges, scratches and irregular snow.  
**Ambient atmosphere:** kept on the scene/environment layer rather than baked into each body.  
**Warm light:** separate runtime VFX plus optional small physically lit material features on the base illustration.  
**Floor and contact:** independent ground contact/shadow layer.  
**Empty surroundings:** genuinely transparent for sprites; no opaque decorative backdrops.

The choice of dark ink does not require darkness everywhere. A light snow-covered platform can have a nearly white body with strong negative-shape control. Readability relies on dark boundary and value grouping, not blanket black paint.

### 4.2. Character portraits in ink

Player and named heroes should receive a character portrait that has clear facial structure, distinctive hairstyle and believable garments; keep varied age, culture, occupation, temperament, injuries and condition. Portrait posture, gaze and expression must derive from the character brief; do not force every woman into the same flawless young face or every hero into the same broad-shouldered stern warrior. Draw hair with larger ink locks, selective loose strands and purposeful shadow masses. Skin retains subtle pigment and human variation, not pure white paper.

For Lí Lan, preserve established identity: a young adult Chinese woman with black hair, black eyes, a slim build and the established history and clothing changes appropriate to the observed game state. Her early outfit does not retroactively become noble armor. Portraits may use dark ink hair, muted complexion, cold surroundings and a restrained coat or hoodie appropriate to the represented point in time. Do not invent permanent facial scars, alternative eye color or a crown.

Named hero portraits should use a controlled character sheet: front/three-quarter profile, silhouette, expression range, costume and distinctive marks. The art should communicate personhood and role rather than reducing heroes to rarity frames.

### 4.3. Items in ink

Items get their own visual families: ordinary resources, weapons, armor, tools, consumables, blueprints, magical materials and unique treasures. At thumbnail size the object must be identifiable **before** the viewer reads the label. Use dark brush contour, soft fill, a few material highlights and selective accent. A common axe is an axe, not a glowing execution relic. Food must not be turned into stylized generic loot cubes. Blueprints can be aged paper or appropriate authored document forms with schematic marks, but no random illegible pseudo-letters.

Art rarity and mechanical rarity are not identical. Do not add expensive-looking gold framing or levitation to an item whose source record does not justify it. Item ownership, quantity, binding, durability and status come from game data, not color.

### 4.4. World-map ink

Large-scale geography uses hand-brushed contour, shaded mountains, windbreak forests, ravines, frozen rivers, old roads and site marks. The player must be able to follow a traversable route, distinguish landform classes and identify known points without deciphering decorative strokes. The world map is NOT the place for every building: the settlement is represented by a compact camp/territory marker, as implemented in the prototype. Building placement and structure inspection belong to the Lãnh địa tab.

Use pale low-detail washes in undiscovered or distant terrain only according to the renderer's visibility rules. Fog of war is an information layer, not a beautiful excuse to reveal hidden lairs, veins, caches or enemy cities. Show remembered objects differently from currently observed objects. A reported resource location can have a provisional mark; an unobserved resource cannot appear because a background illustration happened to include it.

Avoid traditional parchment brown as the dominant world-map surface. The intended atmosphere is winter ink: cold mineral washes, pale fog and controlled warm markers. Paper or parchment may appear in an inspected map item, lore handout or UI frame, but should not silently transform the playable geospatial map into a historical illustration that hides actual spatial meaning.

---

## 5. SEMI-REALISTIC unit production language

Combat units, summoned bodies, undead, enemies, wildlife and battlefield hero bodies use semi-realistic painterly fantasy. Anatomy, posture and material response are physically credible. The silhouette remains clean enough for small in-game presentation. Unit art may show surface brush marks, but should not acquire the same broad ink-wash outline and paper abstraction as narrative portraits.

The shape hierarchy is **species/body plan → combat role → equipment → quality/status detail → small ornaments**. A player should distinguish a snow fox undead from a corpse soldier from a warrior carrying a long spear by body shape and silhouette, not by reading a tooltip or counting blue particles.

Preserve mechanical identity: an undead made through direct revival is not the same as a generic Tomb-created zombie merely because the UI icon looks similar. Show distinctions when the actual unit record and physical appearance warrant them. Do not visually grant intelligence, heroic armor, wings or glowing eyes that its profile does not contain.

### 5.1. Anatomical requirements

Feet and weight must contact believable ground. Humanoid joints articulate naturally; armor sits on the body rather than being painted directly onto skin. Four-legged animal units retain species-appropriate proportions and gait. Undead can be stiff, damaged, partially decomposed or mechanically unnatural in ways that fit their formation, but should not default to anatomical nonsense. A realistic skeleton requires articulated structure and plausible bone connections. Avoid six-fingered hands, extra legs, merged claws, misplaced joints and floating weapons.

Equipment must agree with inventory and character identity. A stone axe cannot suddenly become a crystal sword because it photographs better. Reused uniform components across squads are welcome for consistency; elite and hero differentiation should come through specific authorized features rather than random spikes.

### 5.2. Lighting and skin/cloth/materials

Semi-realistic units keep a cool general fill with restrained directional key light. Snow bounce should lift shadows, not flatten them. Armor reflects the environment; frosted leather remains matte; fur shows tufting and moisture; decayed flesh is muted and varied, not uniform green. A unit directly near a Survival Fire can acquire a localized warm rim and cast a physically coherent shadow. A unit far outside the heat zone does not get the same orange studio light.

### 5.3. Unit card and battlefield sprite relationship

Produce a detailed unit concept/turnaround first; derive sprite forms at production resolutions; keep the card illustration a controlled close-up of the approved design. A semi-realistic painted character poster with flowing cloak, decorative fog and cinematic depth of field is not an acceptable replacement for a small deployed sprite. Combat cards may be atmospheric; battlefield bodies need silhouettes, feet, gear and transparent boundaries that work under frequent movement and selection.

### 5.4. A hero has two art representations

The hero biography/roster/narrative portrait = INK.  
The same hero physically deployed within battlefield squads = SEMI-REALISTIC.

Keep identical identity details: face structure, distinctive scars if verified, outfit, emblem, main weapon, proportions and signature colors. Do not swap faces, genders, weapons, inherited cultures or equipment between the views. Maintain shared art direction reference IDs.

---

## 6. Camera, projection, scale, composition and cropping

The existing Lãnh địa prototype implements a **fixed 2:1 dimetric/isometric ground convention**. Keep it for settlement assets. Do not switch casually to orthographic top-down, perspective bird's eye, side elevation, three-quarter character-card view, or a tilted cinematic photograph.

World coordinates are in metres, +X east and +Y north. The current frontend projection is:

~~~text
u = 2 * (x + y)
v = x - y
x = u / 4 + v / 2
y = u / 4 - v / 2
~~~

This is the exact implemented art-to-map relationship to respect. A building must look like it stands on the same ground geometry as its neighbor. Illustrative concept sheets are allowed to be more dramatic, but finished registered settlement sprites must be projected consistently.

The present registered map-layer defaults are a **240 × 200 logical canvas** and **ground anchor (0.5, 0.82)**. Preserve these until a coordinated, versioned asset-contract migration is made. Art may extend above the visual ground footprint but its ground anchor must still sit correctly. Trimming transparent bounds must preserve offsets. The renderer, not the artist's imagined canvas, determines screen placement.

A large footprint is not a license to cover the territory map with foreground ornament. A tall roof or tower can extend outside the ground polygon visually, but the exact occupied world metres remain authoritative in building state. Never change an asset's physical footprint by resizing its illustration.

### 6.1. Composition grid for settlement buildings

Use three readable bands:

1. **Base/entry band:** the ground anchor, stairs, foundation, threshold and perimeter outline.
2. **Functional band:** working furnace, door, machinery, usable interior frontage, roofline or ritual surface.
3. **Upper band:** chimneys, battlements, flags, pillars, spires, long necks, crowns or large flame structures.

The upper band must be separable or fadeable. The base must retain the building's identity and selectable relationship to the footprint when the upper band is hidden.

### 6.2. Tall-structure and overlap policy

A tower, raised kiln, maximum-form Survival Fire or monumental tomb may occlude ground and neighboring buildings in normal mode. This is acceptable only when there are robust interactions available:

- Stable depth order based on projected ground/depth anchor, not visual top pixel.
- Ground footprint selection independent of decorative overhang.
- A visibly separate upper sprite that can fade in focus mode.
- Hide upper art in planning mode, retaining base silhouette and precise footprint.
- A building list/search/inspector that can focus a structure hidden by artwork.
- No reliance on a giant visual hitbox that steals clicks from tiles behind it.
- No flickering overdraw or swapped depth when panning/zooming.
- At distant zoom use registered compact icon/LOD rather than drawing every tiny tile detail.

Do not solve occlusion by randomly shrinking high-level buildings until their scale loses meaning; solve it through layers, LOD, planning UX and correct interaction geometry.

### 6.3. Item, icon and portrait framing

Item icons may use a more legible three-quarter view than their physical world equivalents, because they are not placement geometry. Character and hero portraits can be dramatic frontal/three-quarter busts; they are not subject to the territory camera. Unit cards can use portrait camera, but their battlefield body should follow whatever unit-rendering camera contract that subsystem adopts. Do not copy the building camera onto faces merely to enforce a superficial global consistency.

---

## 7. Survival Fire: identity, heat and changing physical form

The Survival Fire is the settlement's existential anchor and the principal visual progression case. It must change **physically**, not just become a brighter VFX or a taller pile of flames. The world and gameplay source own its true progression, radius, fuel and material requirements. The art communicates the actual form.

**Canonical six-form ranges:**

| Fire levels | Canonical Vietnamese form | Architectural direction |
|---|---|---|
| 1–5 | Lửa Trại | Exposed campfire → stone ring → functional stone hearth |
| 6–10 | Đại Lửa Trại | Much larger open communal hearth; engineered heat-retaining boundary |
| 11–15 | Lò Nung | Transformation to an enclosed furnace and proper fire chamber |
| 16–20 | Đại Lò Nung | Large industrial furnace; advanced thermal machinery and explicitly authorized mana fuel |
| 21–25 | Tháp Năng Lượng | Energy tower / vertical engineered distributor; clean thermal systems |
| 26–30 | Siêu Trạm Năng Lượng | Monumental advanced energy station, blue-black engineered spire, district-scale presence |

**These names and level boundaries are source/rules-registry facts, not optional visual suggestions.** Do not invent a seventh form or infer that a concept sheet illustration labeled level 12 depicts the canonical appearance of level 12. The earlier visual sample was an **art-direction concept**, not an exact 1–30 canonical reconstruction.

### 7.1. Levels 1–5: Lửa Trại

At level 1, make an actual small wood fire on exposed cold ground. A crude perimeter of unworked stones is acceptable only if it does not visually imply the fully constructed level-2 stone ring. No grand monument, torches, standards or engineered pit. Snow banks and sparse charred wood give scale. The player should understand why the Fire requires ongoing wood.

At level 2, give the hearth a deliberate ring of collected stones; at level 3, an actual low stone platform/basin. At level 4, improved coal/ash handling is visible, if represented. At level 5, the large sturdy hearth should convey substantial thermal capacity without becoming a sealed furnace. The flames remain ordinary warm fire, not blue magical plasma. Differentiate each stage by structure and actual construction, not particle density.

An unlit level-1 hearth must still read as the level-1 object; changing FireActive removes flame and heat VFX, not the physical stone/wood asset that already exists.

### 7.2. Levels 6–10: Đại Lửa Trại

Level 6 is a genuine transition to an **open large hearth**. Increase masonry mass, fuel handling and shelter/support elements in accordance with physically plausible growth. At later stages reinforce stone, iron fittings, engineered walls and eventually suitable conductive/material elements indicated by rules. The central combustion should remain visible and plausibly fed.

The surrounding settlement might contain banners or workstations, but do not bake unrelated buildings, NPCs, guards or tools into the Survival Fire sprite. Such entities belong to independent gameplay state.

### 7.3. Levels 11–15: Lò Nung

Level 11 is the first transformative enclosure: a **furnace**, not a ceremonial stone circle with a bigger flame. Show a chamber, thermal lining, doors or vents and organized fuel intake. At later levels, visibly elaborate the double-wall furnace, heat conduits and industrial mass. Add scale cues through stairs and existing architecture without permanently attaching selectable workers to the sprite.

A furnace may show orange glow through seams or apertures, but not an unrestricted blaze floating above its roof. Smoke emission, if any, is an external animated layer informed by active fuel and weather.

### 7.4. Levels 16–20: Đại Lò Nung

The structure becomes a major piece of industrial thermal infrastructure. Larger chambers, reinforcing braces, channels and rune details may appear in the appropriate levels, with **mana fuel only when its actual game contract is active**. Do not turn level 16 into a fully clean, floating reactor merely because the word "ma năng" appears. This is still a great furnace whose visible engineering can plausibly move and retain immense quantities of heat.

At level 19–20 the form can visibly incorporate authentic rune material. The art may present a stronger sense of controlled energy but should not overwrite the gameplay system with a generic omnipotent aura.

### 7.5. Levels 21–25: Tháp Năng Lượng

The form changes again: a vertical energy tower, distributor, and supporting infrastructure, not merely an enormous brazier. Design a recognizable base core, main tower shaft, heat/energy exchange features, clearly separated crowns and enough architectural rhythm to be readable from the fixed camera. The historical shift from open combustion to controlled energy should be obvious from silhouette alone.

The source material supplies exact facts for particular levels; for example level 25 records a tower height of 28 metres. Where the art manifest requires apparent dimensions, preserve source truth through an approved world-to-art scale policy. The 240 × 200 canvas is a registration convention, not permission to shrink a 28 m tower to the same height as a shovel.

### 7.6. Levels 26–30: Siêu Trạm Năng Lượng

This is not a gold castle and not a generic science-fiction warp reactor. It is the culmination of the winter-fantasy settlement: dark metal, stone-and-energy engineered mass, distinctive branching services and a monumental blue-black vertical silhouette. Level 26 has an explicitly recorded 30 m height; later recorded levels grow to more than 50 m by level 30. The final form must be architecturally extraordinary while retaining a selectable ground base and robust upper-layer handling.

A maximum-level station cannot be a full-screen opaque sprite that prevents interaction with neighboring structures. Its detail needs a close version, a district LOD, a regional marker and a planning/cutaway representation. Avoid indiscriminate blue effects that hide its own architectural read.

### 7.7. Fire level sample approval gates

Approve at least one exact **level-1**, one meaningful upgrade within levels 1–5, level **6**, level **11**, level **16**, level **21**, level **26**, and level **30** as architectural target sheets before bulk production. These eight are review targets; they do not replace a future asset for each mechanically distinct level if the frontend needs every level.

For every approved point require:

- Ink master art at locked territory camera.
- Accurate silhouette relative to neighboring structures.
- No unrelated surrounding buildings baked into it.
- Cold/unlit state and fueled/lit state.
- Separate foundation/base, upper, shadow and VFX.
- A grounded UI icon/LOD.
- Overlap demonstration next to a tower and at least three small buildings.
- A small-zoom readability and mobile tap/plan-mode check.
- Provenance and source level recorded in the asset metadata.

---

## 8. Heat as a game mechanic and a visual phenomenon

The **mechanical heat radius is authoritative state**, not the radius of a painted orange glow. The existing territory view uses the actual FireActive flag and heat radius in metres. A visible ring/ellipse follows projection, and placement checks use world-coordinate geometry. Do not bake a heat-circle shape into an asset and call it the game rule.

At T0, level-1 Fire heat has a 10 m radius according to the current source/rules. That does not permit the entire map to have warm orange snow. Within the covered space, visual surfaces near the fire can receive soft amber highlights, less blue shadow, subtle melting at the very center if source/terrain permits, and a slight warm ground haze. The gradient must diminish quickly enough that the coverage boundary remains understandable when overlaid.

Distinguish:

- **Coverage overlay:** explicit, readable projected mechanical heat boundary.
- **Actual flame/light:** small local glow and flicker motivated by active combustion.
- **Environmental consequence:** warm reflections, slight snow texture changes and affected work zones only when backed by terrain state.
- **Character exposure:** cold-weather behavior/status, not painted buffs.
- **Atmospheric haze:** optional smoke/steam drift; does not imply extended functional radius.

At large radius, depict mechanical coverage through a strategic overlay, not a physically impossible illuminated orange hemisphere filling kilometres of night sky. The late tower and energy station may distribute heat in a visually different way, but the renderer should still use exact state.

### 8.1. Fire active, fire off, transitions

When the Fire is active, show motivated light and permitted active VFX. When off, its base physical structure remains; emission, orange reflection and active heat ring disappear. A scene at night may become substantially darker without changing the building silhouette/identity. If a fuel switch or emission mode has a distinct real state, represent it with an authorized material/emission variation, not invented gameplay. Do not conceal a failed heat state with a bright decorative fire.

### 8.2. Daylight, dusk and night

**Overcast dawn:** cool diffuse light, broad snow bounce, a modest amber focal fire.  
**Clear midday:** crisp directional shadows, ice not oversaturated, fire less visually dominant but still readable.  
**Dusk:** cold blue wash and pronounced, localized firelit stone.  
**Night:** deep ink values with moon/snow bounce; distinguish buildings through edge/value and selective warm windows, not universal city illumination.  
**Blizzard:** lowered distance contrast and wind-whipped snow layers; selectable footprints and hot zone cues must remain usable.

Do not generate separate baked screenshots for every time/weather combination if shaders/overlays can handle them. Avoid baking directional sun, smoke or drifting snow into a sprite body that must function under changing conditions.

### 8.3. Weather direction and physics cues

If the wind blows consistently in one screen-space direction, smoke, loose snow, flags and exposed cloth must support the same direction. Heavy snow should accumulate on plausible horizontal surfaces and sheltered seams. Snow in the lee of walls differs from windward exposure. Warm structures can have reduced settled snow near vents, but this needs state-consistent visual design and should never implicitly give free thermal coverage or work speed.

---

## 9. World-map behavior: ink landscape, geography first

Bản đồ is the geographic and strategic layer. It needs mountains, water, passable routes, known settlements, known local resources, threat markers and meaningful fog/knowledge states. Its primary purpose is **exploration, discovery, travel and territorial context**.

The player's settlement is one recognizable camp marker at strategic scale. Do not show the inner placement of individual farms, workshops and defense towers on the strategic map. The **Lãnh địa** view owns that detailed representation. Both views must refer to the same settlement identity and real spatial coordinates.

Hand-painted winter-ink terrain can evoke an ancient atlas while still remaining navigable. Use a hierarchy of edges: large ridgelines visible at far zoom, clustered trees at local zoom, individual debris/site details only at close zoom. Maintain terrain-family color and shape conventions. A narrow pass should read as a route, not disappear under hatching. Frozen lakes should contrast with ground without mimicking an active heat pool.

For the map, art must never disclose content beyond the player's observed or legitimately remembered knowledge. The source records may know an ancient lair exists, but the renderer cannot draw its entrance until authorized. No "decorative" mysterious site painting that accidentally marks a real hidden coordinate.

### 9.1. Fog states

Unexplored: visibly unknown; no disguised evidence.  
Heard of/rumored: tentative iconography with source confidence.  
Seen from afar: broad silhouette without invented internal details.  
Scouted: identifiable external features but not precise unexamined contents.  
Surveyed: registered detail and available approximate resource metadata.  
Currently observed: live state as allowed by interface.  
Remembered: timestamped, visually stale, not silently updated.

The exact UI wording follows the frontend's knowledge contracts. Art never grants certainty.

---

## 10. Settlement ground and buildings: readable ink architecture

Every building must be identifiable by silhouette plus one or two function-specific details. Building shape should signal use: sheltered openings and domestic footprint for a small house, long covered log profile for wood storage, tall chimney and working mouth for a forge, marked entry or tomb portal for the Tomb, lookout platform for a defense tower.

The opening settlement has a small Fire, a damaged Lord's House, a supply container and a Tomb. These are specific opening structures, not generic replacements for more interesting decorative designs. The Lord's House should be visibly damaged; do not show a pristine castle unless its actual progression says so. The Tomb should read as its own ancient/necromantic infrastructure and not a bright cathedral or demonic theme park.

Use shared construction idioms only where warranted: same wall joints, local stone mix, weathered timber, fasteners and regionally consistent roof pitch. Factions and eras can look different. Ancient battlefield structures should not all share the fresh construction style of the player's new workshops.

### 10.1. Architectural density

Leave functional negative space around doors, stairs and work faces. LOD should remove hatching first, not silhouette. In a crowded settlement, roofs must not merge into an unreadable dark mass. Reserve the strongest ink line for the shape edges that matter. Allow snow to separate structures without converting ground into giant blank white diamonds.

Test each building beside an equal-sized neighbor, a larger one and a tower. A stand-alone thumbnail is not sufficient approval.

### 10.2. Settlement stages and perceived prosperity

Crude opening: exposed wood, broken walls, rough stones, no decorative flourishes.  
Working outpost: repairs, basic roofs, stacked fuel, practical routes.  
Village: distinct housing, workshops, food and storage, defense elements.  
Fortified town: deliberate walls, gates, controlled circulation, production districts.  
Advanced city: richer engineering and institutions with coherent functional distribution.  
High-energy territory: source-supported thermal/energy infrastructure integrated into the same winter landscape.

These are broad art scenarios, not a substitute for the game's territory-stage mechanics. Do not assign an illustration's stage as a real game H-stage unless the owning state supports it.

---

## 11. Items, inventory, UI and inspect panels

Item art stays ink even when a battlefield unit is depicted semi-realistically wearing that item. A sword icon is an authored ink representation of the same physical sword concept, not an exact crop from a semi-realistic soldier's photo.

At thumbnail dimensions, preserve the object's identifying outline and its material contrast. Weapons need a credible blade/handle orientation, tools need a functional head, herbs need recognizable leaf clusters, containers need identifiable closures, and scrolls or blueprints need compact but precise paper silhouettes. If details collapse, simplify ornamental content before thickening the entire object.

UI frames should be subdued metal/ink borders with controlled negative space. The game's frontend already uses deep navy/slate surfaces, pale text, gold highlights and frost accents. Keep those hierarchy principles. Do not recolor every UI panel into a ragged parchment sheet merely because the asset style uses ink. Text is live UI, not painted into background artwork.

The item card can render actual name, quality, durability, binding, quantity, ownership and effects. The icon must not embed misleading textual rarity or promise a power not registered in the source.

### 11.1. Localization

Player-facing terminology is Vietnamese/Hán-Việt. Keep code IDs, manifest keys and debug markers out of painted assets. Do not bake English item names, fake kanji, decorative readable lore, numerical levels or status bars into sprite exports. Where actual writing is canonically required on an object, define it as an intentional authored element with verified language and orientation, not model-generated pseudo-text.

---

## 12. Source truth, provenance and gameplay firewall

Art assets do not create game state. The appearance of a blueprint in a concept board does not make it learned. A marked ruin in a world-map study does not make its coordinates discovered. A zombie in a unit sheet does not mean one exists in the current force roster. A redesigned Fire at "level 12" in an old illustration does not alter its canonical stage name or fuel.

Every production asset must have a source identity and a status:
- PROPOSAL / CONCEPT: artistic exploration only.
- PLACEHOLDER: used for layout and testing, not style-approved final art.
- APPROVED MASTER: art-direction-approved source art tied to a definition.
- EXPORTED: derived runtime layers, but still potentially awaiting technical QA.
- PRODUCTION-APPROVED: correct composition, manifest, source identity, tests, license and interactions.
- DEPRECATED: historic version retained only if the pipeline needs it.

Record the human/editorial origin of every file, whether generated or manually painted, any third-party references, relevant license permissions and the exact role it is allowed to serve. Source-derived concepts from an external novel and gameplay reference rules do not grant rights to reuse copyrighted illustrations. For public/commercial distribution, clear IP and design original variants as required.

Do not silently overwrite the six existing SVG placeholder masters. They remain baseline fixture assets until replacements are approved, registered and tested.

---

## 13. Asset package structure and naming

Keep the implemented asset pipeline unless a separate migration is approved:

~~~text
assets/
  README.md                     # This approved art bible
  ART-DIRECTION.md              # Existing asset technical/export contract
  manifest.json                 # Registered runtime asset metadata
  source/
    buildings/                  # Ink masters, staged physical forms
    items/                      # Ink item/icon masters
    terrain/                    # Ink ground and world-map masters
    units/                      # Semi-realistic combat unit masters
  [optional future approved additions: portraits, heroes, ui, fx, concepts]
frontend/public/assets/          # Runtime exports published by asset sync
~~~

Do not create new folders merely for the sake of symmetry; add them when the pipeline is extended, and update manifest/tools/tests accordingly. Keep generated raw concept sheets separate from optimized runtime exports. Distinguish concept art, editable masters and exported transparent layers.

Suggested descriptive filenames, without inventing item definitions:

~~~text
buildings/survival-fire-l01-north-master.svg
buildings/survival-fire-l11-north-base.svg
buildings/survival-fire-l11-north-upper.svg
buildings/survival-fire-l11-north-shadow.svg
buildings/survival-fire-l11-north-icon.svg
units/<unit-definition>-<pose>-body.webp
items/<item-definition>-icon.webp
~~~

The example identifiers above illustrate packaging only. Use actual registered definition IDs and established naming conventions before final commit; do not presume the sample filenames already exist.

### 13.1. Required layer contract

Each settlement building must provide an equivalent to:
- UI icon, independently legible.
- Body or assembled representation for close-level fallback.
- Base section containing the readable footprint entrance and foundation.
- Upper section able to fade/hide without damaging selection.
- Contact shadow as its own layer.
- Optional VFX references for actual emission, fire, smoke or magic.
- Close/district/regional LOD mappings as declared by manifest.

The existing asset manifest uses a fixed logical canvas, ground anchor, visual bounds, hit/occlusion geometry, depth anchor, provenance, license and physical-footprint compatibility field. Keep each accurate. **Neither artFootprint nor hitPolygon should replace the real authoritative physical footprint.** Test asset-synchronization and frontend loading.

### 13.2. Production raster guidance

For painterly/ink raster exports, retain high-resolution lossless editable source files; choose transparent runtime formats supported by the browser (e.g. well-compressed PNG/WebP) without destructive halos. Do not assume a hand-painted PNG can be "converted" into a clean layered SVG automatically. When vector is actually needed for runtime, trace deliberately and verify material and alpha quality. Preserve color management and document any texture tiling.

---

## 14. Generative-art prompting contract

AI image generation can help create **concept references**, but generated composite art is not a validated sprite, not a manifest file and not gameplay data. The art workflow should define one target at a time with an explicit subject, functional role, style owner, source constraints, camera, palette, lighting, material history, crop, transparency and prohibitions.

**Order for every authoring prompt:**
1. Exact definition and status: what object exists, which level/stage, whether it is only a fixture.
2. Surface/role: hero portrait, item icon, unit sprite, territory building or map terrain.
3. Approved style: INK or SEMI-REALISTIC (never ambiguous "hybrid" by default).
4. Shape vocabulary and important identifying features.
5. Exact orientation/camera if it is a settlement sprite.
6. Material palette, snow treatment, heat/light source and damage condition.
7. Required background/alpha and export layers.
8. Level of detail/thumbnail expectations.
9. Negative prompt.
10. Source and art-QA verification criteria.

### 14.1. Master positive prompt — ink settlement/building

> Original winter dark-fantasy strategy-game building asset, expressive Chinese-ink-wash-adjacent brush treatment without reliance on real-world ethnic costume clichés, strong but selectively broken ink contours, charcoal and blue-grey mineral washes, realistic weathered timber and stone, compact snow layers, distinctive functional silhouette, restrained ash and ochre accents, selective amber light only where active fire physically reaches, consistent upper-left light, exact fixed 2:1 dimetric/isometric settlement camera, no perspective vanishing point, legible building foundation and entrance, functional three-band base/body/upper separation, authentic wear from frost and exposure, alpha-ready silhouette, no baked interface labels, no surrounding independent structures, grounded contact and clear at small zoom. Subject: [VERIFIED BUILDING AND REAL LEVEL]. Architectural features: [SOURCE-SUPPORTED FEATURES]. Stage-specific changes: [VERIFIED CHANGE LIST]. Required exports: body, base, upper, contact shadow, UI icon, VFX mask if needed.

### 14.2. Master positive prompt — ink hero/player portrait

> Original named-character portrait for an austere frozen-lordship dark fantasy game, layered charcoal brushwork with expressive broken contour, desaturated cold blue-grey pigment and selective natural skin color, human asymmetry and individual facial identity, verified historical outfit and equipment, restrained cold environmental light, physically motivated ember rim only if next to fire, natural hair and cloth, serious but non-generic emotional register, elegantly reserved negative space, no fake lettering, no class symbol or crown unless source requires it. Character identity and source-verified features: [IDENTITY]. Portrait state/time: [STATE]. Crop: [CROP]. Ink style MUST remain distinct from semi-realistic troop art.

### 14.3. Master positive prompt — ink item

> Single original functional item icon, winter fantasy ink illustration, strong recognizable outline at 48–64 px, broken expressive charcoal edge, cool restrained washes, material-correct highlights, item-specific wear, optional tiny genuine source-supported magical accent, uncluttered empty alpha surrounding object, centered intentional orientation, no surrounding character hand, no decorative rarity halo or labels. Item identity: [ID]. Mechanical appearance constraints: [FACTS]. Rarity and effect cannot be inferred from artwork.

### 14.4. Master positive prompt — ink world-map region

> Navigable frozen dark-fantasy strategic map tile/region in hand-brushed ink and restrained mineral wash, geographically coherent ridges, river and ice topology, pathways, sparse forest and winter negative space, visual hierarchy from region to local routes, muted slate/cold whites, sparse sepia or amber only for known human interest sites, fog-of-war compatibility, no invented settlements or hidden sites, no baked grid labels, no scenic photorealism. Verified geography bounds and allowed discoveries: [REGISTRY]. Tile/LOD requirement: [SCALE].

### 14.5. Master positive prompt — semi-realistic combat unit

> Original semi-realistic painterly fantasy combat unit asset for a frozen apocalypse lordship game, anatomically credible species morphology and weight, correct joints and grounded feet, believable layered armor, weathered textile and fur, specific carried equipment and combat role, cold ambient snow bounce, restrained directional key light, moderate purposeful texture, physically believable undead condition where applicable, clean distinguishable silhouette readable at deployed sprite scale, full body with unobstructed limbs, no cinematic lens distortion, no decorative background, isolated alpha-ready character. Unit identity: [UNIT ID]. Species and anatomical features: [VERIFIED]. Loadout: [STATE]. Role: [STATE]. Exact perspective: [UNIT CAMERA CONTRACT]. Do not render in ink-wash portrait style.

### 14.6. Prompt for Survival Fire level 1

> Ink-wash dark-fantasy territory sprite of the canonical Lửa Trại Cấp 1, an extremely small exposed wood campfire on an icy ancient battlefield, visibly provisional construction, only basic fuel and minimal incidental stones, warm flame bright enough to register against blue-grey snow but not to illuminate distant terrain, stark frost-charcoal brush contours, original stylized ink painting, physically believable timber logs, untouched cold landscape and a modest heat pocket, fixed 2:1 dimetric territory view, ground anchor in the lower center, isolated building, no settlement structures baked in, separate VFX/light and shadow, readable foundation when flames are off, not an advanced stone-ring, no banners, no magical energy core.

### 14.7. Prompt for major form transitions

For level 6, replace the exposed little hearth with a significantly larger **open Đại Lửa Trại** built for communal heating. For level 11, replace the open fire format with an **enclosed Lò Nung** and industrial heat chamber. For level 16, scale to **Đại Lò Nung** with advanced fuel handling and verified mana-fuel options. For level 21, switch to **Tháp Năng Lượng** with a prominent vertical thermal distributor. For level 26 and level 30, use source-supported **Siêu Trạm Năng Lượng** architecture at its recorded scale. Do not preserve an obsolete bonfire as the architectural centerpiece of late towers simply for decorative consistency. Repeat the same camera, light direction, palette, material history, registration and layer requirements at each level.

---

## 15. Negative prompts — global and per surface

The negative lists below are not a substitute for inspecting outcomes. A generator may ignore them or interpret them weakly. Reject noncompliant artwork even when it is attractive.

### 15.1. GLOBAL negative prompt (apply to all generation)

> generic AI fantasy slop, generic castles everywhere, ungrounded high fantasy, overly saturated neon, candy colors, pastel cozy fantasy, Disney/Pixar cartoon, toy miniatures, plastic material, glossy mobile gacha style, uniform gold trim, ornamental clutter, random wings, nonsensical armor, meaningless floating runes, excessive auras, random glowing eyes, cluttered visual noise, illegible silhouette, muddy focal hierarchy, fake Chinese characters, unreadable pseudo-text, watermark, signature, UI mockup elements baked into asset, title text, floating numbers, incorrect levels, unauthorized item effects, copyright-infringing exact designs, composited unrelated characters, arbitrary environmental warmth, repeated duplicate props, inconsistent sun direction, wrong ground anchor, camera mismatch, perspective distortion, cropped base, shadow baked into opaque background, AI anatomical errors, extra fingers, missing limbs, merging equipment, impossible geometry, unapproved IP, inconsistent texture density.

### 15.2. INK negative prompt

> photorealistic photography, glossy PBR-only game render, glossy 3D miniature, hard vector clip-art, thick uniform cartoon outline, chibi proportions, high-saturation anime scene, flat comic cel shading, watercolor rainbow fantasy, generic parchment overlay, excessive splatter, texture printed as a rectangular background, uniformly sharp hatching over every surface, homogeneous black silhouettes without internal read, mist covering all interaction geometry, extremely fine detail that vanishes at 32 px, ornate golden architecture with no material rationale, stylized real-world calligraphy used merely as decoration.

### 15.3. SEMI-REALISTIC unit negative prompt

> pure ink-wash illustration, paper-textured brush-only abstraction, anime doll face, chibi, plastic skin, superhero proportions, pin-up presentation, improbable anatomy, extra limbs, floating weapons, theatrical fashion shoes, human fingers on animal paws, skeletons with no articulation, glowing corpse effects without an ability source, exact movie/game character copy, extreme depth-of-field blur, dramatic camera angle that hides feet, fog merged into transparent sprite, generic identical faces, gilded elite armor on ordinary units.

### 15.4. WORLD MAP negative prompt

> decorative imaginary coastline contradicting topology, random rivers that split uphill, unverified towns or dungeon icons, fully revealed map when fog is active, every settlement building drawn at strategic scale, glowing quest markers not present in data, fake paths crossing impassable barriers, map textures that make travel routes illegible, solid tan parchment over all terrain, country borders asserted without knowledge, detailed resource quantities not currently measured.

### 15.5. SETTLEMENT negative prompt

> one giant opaque whole-scene illustration, scenery baked into every building, background sky baked into a sprite, wrong isometric angle, detached foundation, too much decoration extending beyond the registered footprint, fake touch targets, buildings that visually float, overly tall foregrounds with no fade/cutaway layer, flame drawn permanently on an extinguishable structure, over-lit snow across the entire territory, identical ornate spires on every structure, architecture with no entrance or material logic, random instantly spawned civilians.

### 15.6. ITEM negative prompt

> random halo, irrelevant legendary sparkles, huge loot card frame embedded in icon, object hidden by magical particles, text labels painted inside asset, unverified enchantments, nonsensical blade geometry, extra handles, disconnected straps, item invented from a generic category alone, item rarity conveyed as guaranteed effect.

### 15.7. SURVIVAL FIRE negative prompt

> generic RPG bonfire at every level, level 1 stone cathedral, level 6 closed factory furnace, level 11 still an outdoor bonfire, level 21 still a bigger fireplace, level 26 gold castle, arbitrary reactor glow, unstoppable orange radiation over kilometres, magical coolant everywhere, blinding neon purple energy, permanent smoke painted into all states, missing fuel operation detail, detached flame, impossible chimney flow, unapproved stage seven, level above 30, incorrect size relation to buildings, no interactive low-opacity upper-layer plan.

### 15.8. Common near misses requiring rejection

1. An attractive ink building whose viewpoint differs from the dimetric territory view.
2. A campfire icon whose fire is permanently baked into its body so it remains lit when inactive.
3. A 50 m tower shown at the same apparent size as a small crate because the sprite was blindly scaled to 240 × 200.
4. A hero whose portrait and deployed body have different facial features or equipment.
5. A skeleton shown with cyan flame and named-hero regalia despite being an ordinary low-tier Tomb output.
6. A map that visually reveals a lair by drawing it in a "decorative" mountain painting.
7. A scene where the heat circle glows orange and becomes mistaken for heat validation rather than the real geometry.
8. A beautiful hand-drawn ink overlay that blocks click selection of underlying footprints.

---

## 16. Effects and compositing: never bake state into art

Keep effects compositable and switchable:

- Flames: origin-bound, active-only, state-appropriate emission.
- Fire glow: low-noise local screen-space/ground-space light, not a massive painted vignette.
- Smoke: optional active emission, follows wind, fades by distance.
- Warm surfaces: material light contribution according to position relative to real active heat source.
- Snowfall: ambient particle layer independent of buildings.
- Ground snowfall accumulation: environment/state-directed shading, not arbitrary destructive edits to masters.
- Necromancy: source-specific modest signs where actual abilities apply.
- Runes: only if real structure or item has rune features.
- Selection/hover: clear thin UI overlay with accessible contrast; not part of artwork.
- Heat and placement boundary: game-derived geometry, visible/hidden per UI mode.
- Damage and construction: state variants, decals or permitted overlays tied to real condition.

A building can be **cold, dark and inactive** without the layer becoming a separate unregistered entity. Likewise its scene can be in blizzard, daylight or night without generating a different canonical level.

### 16.1. Performance and texture concerns

Avoid dense full-screen particle noise and highly detailed repeating alpha sprites. At world-map zoom most features should be simplified or iconized. At territory zoom cull invisible assets and use LOD. Ensure layers do not multiply draw calls unnecessarily for hundreds of buildings. Do not run unbounded costly filters, glow shaders or high-resolution video inside the normal map. Test mid-tier hardware, not only a workstation.

---

## 17. Art approval workflow and QA matrix

**Phase A — reference and data review:** Look up the actual definition, source status, object role, stage and visible state. Confirm ink vs semi-realistic. Confirm whether object exists at T0 or is a future unlock. Record material and equipment facts; unresolved geometry remains unresolved.

**Phase B — silhouette and composition:** Produce black/grey thumbnails without fancy lighting. Check that the object is recognized at intended size. For buildings, put it on the dimetric grid beside genuine neighbors; for units, compare with at least two species/roles; for items, verify 48–64 px recognition.

**Phase C — palette/atmosphere:** Apply the winter palette, weathered materials, restrained warm/cold lighting. Recheck that color does not invent abilities or environmental coverage.

**Phase D — production master:** Resolve every contact point, structural connection and distinctive mark. No fake lettering or generated UI. Create clean alpha with enough margins and stable ground anchor.

**Phase E — layer extraction:** For buildings, derive base/upper/body/shadow/icon; for units and effects use the relevant runtime package. Hand-correct edges and registration. Do not slice arbitrary pixels through important parts.

**Phase F — integration:** Register version, paths, dimensions, footprint compatibility, bounds and provenance in the manifest. Run asset sync. Check independent hit geometry and runtime fallback.

**Phase G — visual regression:** Test desktop and mobile, zoom near/far, daylight/night/blizzard, active/inactive Fire, focus/planning modes, overlapping tower, dense 500+ fixture, and realistic building selection. Update visual baselines only after manual review.

**Phase H — sign-off:** Confirm source correctness, visual consistency, usability, licensing, performance and absence of side effects. Mark production-approved only if all gates pass.

### 17.1. Minimum review scorecard

| Review axis | Pass condition |
|---|---|
| Source identity | Art depicts the correct existing definition and level/status |
| Style allocation | Ink for player/hero/items/map/settlement; semi-realistic for units |
| Silhouette | Recognizable at actual UI scale |
| Materials | Cold-world materials and weathering coherent |
| Heat | Local emission consistent with FireActive and physical proximity |
| Camera | All settlement assets use the same 2:1 dimetric ground language |
| Selection | Artwork doesn't steal terrain interaction or change footprint |
| LOD | Distant views remain clear and cheap |
| Alpha/layers | No baked sky, canvas, UI or permanent switchable VFX |
| Identity continuity | Hero ink portrait and semi-realistic body represent same actor |
| State safety | No invented sites, equipment, level, ownership or powers |
| Provenance | Source, generated/manual origin and license recorded |

If any hard source/state/camera/interaction gate fails, reject regardless of subjective beauty.

---

## 18. Representative acceptance tests before scaling the asset library

**Test 1 — opening Lửa Trại:** Level 1, 10 m heat radius, fire on; review absolute modest visual scale, limited warm reflection and surrounding cold. Switch Fire off; geometry and cold body remain, heat/emission vanish. Review at both day and night.

**Test 2 — T0 damaged house:** Put the broken Lord's House visibly outside the small 10 m initial heat radius according to the current opening position. The world should look cold at the house, not as though the Fire lights the entire region. The house remains clickable/inspectable even if some roof/ink detail extends beyond its preview rectangle. Its damaged state must be unmistakable.

**Test 3 — Tomb:** Use source-appropriate dark stone/ancient ruin mood without promising a boss, hero or gacha roll. Display it as a structurally legible settlement entity at correct location. Do not place independent zombies inside the building master.

**Test 4 — tower overlap:** Put a tall calibration tower next to the house and a compact production building. Focus mode partially fades obstructing upper art; planning mode removes upper part, retains base footprint and lets the user select the hidden neighbor.

**Test 5 — late Survival Fire:** Compare levels 11, 16, 21, 26 and 30 with the same camera and physical scale logic. They must look like meaningfully different forms: furnace, great furnace, energy tower, advanced energy station and its maximum developed variant. Check day/night and active/off display.

**Test 6 — unit identity:** Depict an ordinary Tomb zombie, a separately revived animal and a named hero combat body in semi-realistic style. Their size and equipment differ properly. Show the hero's separate INK portrait side by side.

**Test 7 — ink item identity:** Render a stone axe, iron tool, medicine and authentic blueprint icon at inventory scale. Ensure each reads before any ornate decoration or tooltip.

**Test 8 — dense district:** Render hundreds of structures without losing the ability to distinguish roofs, track selected footprint or open inspectors. Reject work that looks spectacular only when shown alone.

**Test 9 — world fog:** The world map shows known geography and only authorized sightings. Hide a pre-seeded lair/cached resource and confirm its art does not leak into undiscovered terrain.

**Test 10 — palette bridge:** Place an ink settlement building, ink hero portrait, ink inventory weapon and a semi-realistic unit card on the existing dark frontend UI. They should belong to the same universe while preserving the agreed stylistic distinction.

---

## 19. Art decision change control

This style is intentionally locked because the asset library will become very large. A future request to change lighting on one special quest item does not change the whole library. To revise the global split, update this decision ledger first and record which asset families, manifests, test baselines and approved masters are affected. Avoid inconsistent incremental drift as later contributions arrive from different artists or generation runs.

Specific exceptions are allowed only by a named decision: for example, a semi-realistic cinematic battlefield cutscene is not a license to make all hero portraits semi-realistic. An ink illustration for a bestiary page is not a reason to paint combat sprites as black-and-white brush silhouettes. A different region or culture can have its own architectural motifs without departing from its surface's core rendering dialect.

Where the current implementation still uses simple original SVG placeholders, preserve the underlying functional constraints and upgrade their visuals within this style rather than rewriting geometry or mechanics. The production goal is not to replace a reliable map with a giant painting. It is to deliver a **coherent visual universe that remains controllable as an interactive strategy game**.

---

## 20. Final authoring checklist (print before approving anything)

- [ ] Confirm correct game identity, genuine source and actual level.
- [ ] Confirm INK vs SEMI-REALISTIC category.
- [ ] Confirm the subject's world-historical material vocabulary.
- [ ] Check cold blue-grey ground palette and limited motivated accents.
- [ ] No random gold, cyan magic, halos, text, ornaments or background.
- [ ] For player/hero portrait: preserve named identity and temporal outfit.
- [ ] For unit: correct species anatomy, status and actual equipment.
- [ ] For item: silhouette, material, proportion and gameplay neutrality.
- [ ] For map: authoritative geography, fog and knowledge visibility.
- [ ] For settlement: exactly shared dimetric camera and ground anchor.
- [ ] For tall building: separable upper layer, selectable footprint.
- [ ] For Survival Fire: correct six-form progression and active/off VFX.
- [ ] Heat glow does not assert mechanic radius; renderer uses real geometry.
- [ ] Every optional effect can be disabled without corrupting the object.
- [ ] Layers, metadata, licensing, identifiers and LOD are validated.
- [ ] Inspect at intended browser zoom and on mobile.
- [ ] Test dense overlap and plan mode, not only an isolated image.
- [ ] Record approval status rather than promoting a concept to canon.

**One-sentence art identity:** An austere, frozen, post-apocalyptic lordship rendered in expressive winter ink for the world, its people of narrative significance, places, buildings and artifacts—and in physically grounded semi-realistic painting for the units who must fight and survive inside it.
