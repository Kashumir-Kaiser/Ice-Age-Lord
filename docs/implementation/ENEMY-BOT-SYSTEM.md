# Persistent enemy lords

## Population and runtime

New saves generate the fixed 1,023-bot P0 roster plus Lí Lan. The nine opening rivals retain their IDs and names, and the two named S rivals occupy the two S slots. P0 grade quotas are S 2, A 51, B 205, C 358 and D 407. Bot talent remains capped at S; the player's SSS talent is separate. Combat and production talent assignment is seeded and versioned.

Hot simulation fields use numeric typed arrays in 256-bot chunks. Cold records retain names, plans, structures, cohorts, routes, learned and owned blueprints, inventories, chests and receipts. The scheduler reviews actors on a three-second strategic lattice, while integration splits at modeled resource, exposure, water, weather, work and travel boundaries. Population and chunk hashes are committed at save boundaries. SQLite startup migrations preserve IDs, existing assets and historical outcomes; legacy losses receive the explicit `unattributed` cause.

Bots gather finite resources, hunt finite shared prey, build and repair structures, recruit, explore, scout, raid known settlements, recover, prepare water, acquire and open chests, learn or list blueprints, trade and upgrade territory. Action receipts record outcomes and talent-adjusted XP. The planner is deterministic utility selection with explicit prerequisite checks and emergency worker reassignment; it is not a world-state GOAP search.

## Survival, hazards and talent

The lord has a fate (`active`, `dead`, `captured`, `dispossessed`) independent of settlement residents and troop counts. Fate records include a cause, timestamp and trigger. Residents and troops retain durable loss counts by starvation, dehydration, fuel exhaustion, regional blizzard, battle, wildlife and unattributed legacy losses. A destroyed army does not by itself kill the lord. The lord can die while residents remain; a defeated settlement can become dispossessed; a battle can capture the lord when the keep is destroyed.

Food, potable water and firewood use finite balances. Bots start with finite potable water and local ice. Preparing water consumes worker time, five firewood units and a finite amount of ice. Survival and cold exposure split at depletion and casualty thresholds, so a large time advance agrees with short and irregular caller intervals. Emergency plans can reclaim workers and switch to gathering, water preparation, recovery, retreat or blueprint barter.

The source package does not define an executable regional bot weather service or this bot water conversion. The simulation therefore labels these as design overlays: `BOT-FROZEN-WATER-LORD-SURVIVAL-1.0` and `BOT-REGIONAL-WINTER-STORM-1.0`. The overlay models finite ice and fuel conversion plus seeded regional storms. These values are versioned bot rules, not source-canon rates. Starting water and ice are finite assigned stocks; the system does not provide unbounded water from the frozen map.

Talent modifies the relevant action once. Combat specialists gain combat effectiveness and have slower construction; production specialists construct faster and have lower combat effectiveness. Talent does not increase upkeep or apply a universal survival multiplier. Survival is affected by actual supplies, structures, shelter, work and danger choices.

## Combat and structures

Only cohorts present at home count toward defense. Persisted movement records identify the actual members away, including partial detachments. The shared settlement resolver still runs when the defender has no home soldiers. Operational and damaged structures contribute their configured passive defense; destroyed structures do not. An acquired defense can change a controlled no-garrison fight's winner or losses.

Structures retain stable IDs, blueprint provenance, position, orientation, footprint, level, work, damage and status. Reveal and inspection project those saved assets. This overlay does not implement tower attacks, range, staffing, ammunition, energy or autonomous garrison fire. It does not invent an attack for a wall or other non-attacking building.

Territory level is independent of lord XP. Upgrades require the configured structure prerequisites, costs and worker time; they change storage and housing capacity. They do not grant arbitrary buildings or leaderboard points.

## Chests and blueprints

Fixed world chests share one ownership state with the player. A bot claims an unopened chest before opening it; a second claimant cannot duplicate it. Regional chest sources are finite and generated under a versioned bot overlay. Loot rolls are deterministic and persisted as a receipt. Field chest content uses the compiled world loot tables.

The bot blueprint candidate pool is an explicit versioned overlay because the source chest tables do not compile bot settlement blueprints. Finding a blueprint creates an owned item. Learning consumes that item once and grants the unlock; listing escrows it, preventing simultaneous learning or sale. Bot structures use stable `BP-BOT-*` templates. Only `BP-BOT-WALL` has a player construction adapter, so other bot blueprint listings are not offered to the player.

Current field chest loot tables do not contain a blueprint result, and ranked reward chest names do not map to compiled chest rarities. Blueprint search is a separate finite discovery path. A ranked silver or black-iron chest remains blocked until an explicit source mapping and item handler exist.

## Market

`BOT-REGIONAL-BARTER-MARKET-1.0` is a named design overlay. Sellers escrow owned blueprint items. Eligible nearby bot buyers must be alive, have storage space and reserves above the actual food or water payment, lack that blueprint, meet its prerequisites and have room for the asset. Candidate ordering is stable. A completed trade atomically transfers the blueprint and resource and stores one transaction; a no-buyer listing does not credit the seller. Listings expire, reprice within fixed bounds and release escrow on cancellation or seller fate change.

The player adapter currently buys a bot's `BP-BOT-WALL` blueprint with food. Player potable-water payment and other bot blueprint templates are blocked by the absence of matching player resource and construction contracts. The overlay is a regional barter market for blueprint assets and survival supplies, not an all-item marketplace.

## Ranked events and reward effects

EV01 is the only executable participant-ranked bot board. Its level-ten score is based on committed receipts, and final eligibility is evaluated at the source-defined T+144h close. Qualification after the close cannot enter the frozen result. A lord eliminated before the cutoff is excluded; settlement snapshots do not change after close. The opening publication delay and 100-row cap are retained.

The same literal rank-band payload is frozen for every participant in a band. Bot receipts and player slot receipts are idempotent. Bots use awarded MEAT/BREAD as food at the recorded delivery time and can consume BASIC_MEDICINE during recovery. Players can consume claimed MEAT/BREAD. Unsupported slots stay pending with precise blockers and stable identities; a slot can resume if its handler becomes available without changing the frozen rank snapshot.

The repository does not provide a participant-scoped scoring and reward settlement contract for EV02–EV29. Player event objectives, calendar entries and event chest tables do not create bot ranked boards. No generic XP-based event score or rank is synthesized.

The opening reward contract currently has no compiled effect for resource bags, reward chests, recruitment scrolls, reward weapon templates or power hearts. They remain blocked; the runtime does not pretend that inventory ownership is a use effect. These gaps are tracked in [the implementation checkpoint](ENEMY-BOT-SYSTEM-STATUS.md#remaining-compiled-content-blockers).

## Verification and measured limits

Fast coverage is split into `npm run test:bots-economy`, `npm run test:opening-rewards` and `npm run test:bots-replay`. These cover focused survival/economy contracts, opening reward and cutoff behavior, and compact deterministic replay with SQLite reload. `npm run test:bots` and the multi-day Stage 08 suite are broader, expensive runs and are not required for the supplied focused verification budget.

The benchmark command is `npm run benchmark:bots -- --population=32|48|64|1023|10000|100000 --hours=1..168 [--seed=value]`. The seed is independent of horizon; a 168h P0 run reports 24h, 48h, 144h and 168h checkpoints. The current 1,023-bot acceptance result, plus historical pre-change diagnostics, are documented in the [checkpoint](ENEMY-BOT-SYSTEM-STATUS.md#long-run-results-and-limits). A single seed is an observation, not proof of cross-seed balance.

## References and provenance

The supplied Petra BaseManager and QueueManager, OpenRA `ai.yaml`, and Epic MassGameplay documents informed separation of work allocation, explicit resource reservations, strategic profiles and simulation/rendering fidelity. Their game constants and source code are not imported. Bot-specific economy, weather, water, blueprint and market rules are explicitly versioned overlays. Research PDFs, source registries and legacy rivals remain unchanged.
