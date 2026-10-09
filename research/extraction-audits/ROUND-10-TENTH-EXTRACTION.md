# LORD DND — Event Source Extraction Round 10 (v1.0)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-0.9-ON-TIMELINE-0.6` (288 entries); **timeline:** v0.6 (30 unchanged events). **Authority:** research-only, no game/save mutations. **Extraction date:** 2026-10-09.

## 1. Newly verified source records

| ID | Source | Acquisition route | Exact payout | Calendar status |
|---|---|---|---|---|
| `SX-0289` | Novel Ch427 | Top rank of the four-region, ten-day `卓玛之爪` qualifier (`EV08`) | `超凡幸存者` title + **100 Golden Points** + **one free Epic Wheel spin** | Directly attributable to EV08; conditional rank settlement |
| `SX-0290` | Novel Ch693 | Hidden `风雪守护者` achievement after a snowstorm | **10 至纯裂片** (Pure Fragments) | Unmapped to 30-event calendar |
| `SX-0291` | Novel Ch693 | **Same achievement and receipt** as `SX-0290` | **1 原始雪花印记（橙）** (Original Snowflake Mark accessory) | Unmapped to 30-event calendar |

**Direct text sources:** [Ch427 ranking notification and Golden Shop transition](https://www.69shuba.com/txt/58776/39432326); [Ch693 achievement notification and accessory inspection](https://www.69shuba.com/txt/58776/40564696). All three entries are tagged `RESEARCH_CANDIDATE_NOT_ACTIVE`; evidence is a demonstrated source outcome, not a new-game grant.

## 2. Precise mechanisms and why this is not a duplicate

- **EV08 first rank:** Ch427 states the ten-day qualifier is locked, shows the winner's special title and two additional rewards; the separate Golden Shop opens *after* the settlement. The free Epic Wheel spin does not guarantee the observed wheel outcome (Diamond Membership Card); `SX-0261` already contains that observed outcome and is not awarded again in this rank contract. Rank eligibility is conditional, and the source Cao Xing result never fixes Lí Lan's ranking.
- **Snowstorm achievement:** Ch693 notification explains that all residents were kept safe, no resident lost loyalty throughout the disaster, and an abundant meal after the disaster raised happiness. These conditions were observed together, not demonstrated to be independently sufficient by controlled testing. The source then grants both item rewards from *one* hidden achievement; two rows are two components of **one atomic claim**, not two achievements.
- **Accessory:** Ch693 inspected `原始雪花印记（橙）`: Spirit +100, Constitution +50; activating creates a 1-m radius shielding wearer from surrounding wind/snow for **3 hours**, with **5-hour cooldown**. Do not confuse environmental shielding with absolute immunity to temperature, combat cold damage, hostile spells or other weather effects.
- **Temporal non-inference:** The Ch693 snowstorm is not one of the **30 existing numbered calendar event IDs**. Both rewards carry `event_id=null` and `source_only_context=UNMAPPED_SNOWSTORM_HIDDEN_ACHIEVEMENT_NO_CALENDAR_EVENT`. Do not force either into EV11, EV13 or EV14, invent a 31st event, or activate a trigger until a versioned new-game rule is approved.

## 3. Newly discovered source contradiction (no silent rewrite)

The **same named Golden Shop recruitment scroll** for `拜弗·黑心` is described as **fifth-tier ruler** in [Ch427](https://www.69shuba.com/txt/58776/39432326), while the explicit purchase and immediate summoning text in [Ch571](https://www.69shuba.com/txt/58776/40564572) calls the summoned entity a **fourth-tier ruler**. The pre-existing `SX-0273` remains byte/value-identical; the discrepancy is appended to `provenance_conflicts` under `CONFLICT-CH427-CH571-BAIFU-TIER`. Resolution requires further source evidence, not guessing which number is a typo. No other item or hero is silently re-tiered.

## 4. Source scope and exclusions

- Prior Round 9 Honor Store offers and Anno fishing rank choices were not duplicated.
- Ch1080/1081, Ch1109, Ch1137 and Ch1329–1339 remain **chapter-index or insufficiently readable lead status** for their full late-game shop/tower reward panels; no unsupported prices or stock caps were added.
- Ch693's subsequent planning drawings and cave loot are not the hidden-achievement reward bundle; no fabricated reward or blueprint enters this extraction.
- No `Tử Phục` change, no map/chest/world seed reroll, no inherited prior save, no new scheduling event and no item activation.

## 5. Validation contract

1. `SX-0001..SX-0288` remain value-identical in the v1.0 JSON registry; the earlier v0.9 is retained in `research/snapshots/events/`.
2. `SX-0289..SX-0291` are unique, appended in order, with exact chapter URLs, source classification, parent reward groups, and no active adoption.
3. CSV header and the prior **288 data rows** are preserved; three rows are appended; human review contains **291 data rows**.
4. `event_schedule` remains **30 rows, value-identical** to v0.9 and the authoritative `data/events/EVENT-TIMELINE-v0.6.json`; neither timeline JSON nor CSV changed.
5. Winter achievement item pair shares `reward_group_id` and must ultimately settle atomically, once per valid achievement. Rank first-place is a separate bundle and cannot duplicate an already observed random wheel outcome.
6. Research only. Do not mint these item instances in any new save until the typed compiler accepts their gates and provenance.

## 6. Files

- Active research: `data/events/EVENT-SOURCE-CATALOG-v1.0.json`, `data/events/EVENT-SOURCE-ITEMS-v1.0.csv`.
- Immutable previous extraction snapshot: `research/snapshots/events/EVENT-SOURCE-CATALOG-v0.9.json`, `research/snapshots/events/EVENT-SOURCE-ITEMS-v0.9.csv`.
- Audit: `research/extraction-audits/ROUND-10-TENTH-EXTRACTION.md`.
