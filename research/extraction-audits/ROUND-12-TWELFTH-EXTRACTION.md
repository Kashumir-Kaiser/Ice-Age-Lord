# LORD DND — Event Source Extraction Round 12 (v1.2)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.1-ON-TIMELINE-0.6` (**292** source entries; **21** effect records). **Timeline:** v0.6, **30 unchanged events**. **Authority:** research-only. **Extraction:** 2026-10-09.

## 1. Directly verified additions — six mechanical records, no duplicate item rows

| Effect | Existing item(s) | Directly observed source rule | Source chapter |
|---|---|---|---|
| `FX12-0001` | `SX-0059` | Blue Dragon-Crystal Warrior set: **five slots**, **1,000 points each** or **4,000 for the set**, panel limit **1,000 sets** | 432 |
| `FX12-0002` | `SX-0060` | Purple Amethyst Warrior set: **five slots**, **5,000 each** or **20,000 for the set**, panel limit **100 sets** | 432 |
| `FX12-0003` | `SX-0061` | Gold Mysterious Crystal set: **five slots**, **20,000 each** or **80,000 for the set**, panel limit **30 sets** | 432 |
| `FX12-0004` | `SX-0068` | Krakato scale inspected: lightning-attack immunity; on attack **50% damage reflection**; smithing into finished legendary equipment requires a legendary smith and other unspecified materials | 454 |
| `FX12-0005` | `SX-0067` | Krakato blood inspected: possible dragon-family hidden class on fusion; works on survivor or resident; **below legendary = 100% fatal body explosion**, qualifying rank does not ensure success | 454 |
| `FX12-0006` | `SX-0067` | Bojie, a *named actor with three prior bloodlines*, estimates fourth fusion at **under 20% success at newly achieved legendary**. Higher legendary rank or mutant-ruler potential may improve safety; **no fusion was performed** | 889 |

Direct scene texts: [Chapter 432 — private Crystal Dragon shop](https://www.69shuba.com/txt/58776/39441838), [Chapter 454 — item inspection and actual exchange](https://www.69shuba.com/txt/58776/39496152), [Chapter 889 — Bojie risk assessment](https://www.69shuba.com/txt/58776/40564892).

All item IDs linked above **already existed in v1.1**. Adding six `SX` rows would falsely duplicate existing stock; therefore Round 12 adds **zero** new item/reward entries, and instead expands `source_effect_records` from **21 to 27**. The two new observations `OBS12-01`, `OBS12-02` document shop unlock and purchase channels.

## 2. Why the distinctions are important

### Discounted whole-set purchase is a separate option, not new inventory

The existing `SX-0059`, `SX-0060` and `SX-0061` list only the full-set prices. Chapter 432 explicitly offers a **single-slot purchase** or a **complete-five-slot-set discount** for each, with set caps. The source does not establish whether single-piece purchases draw from the same cap, nor whether the listed cap is per character versus entire shop. Do not convert `限购` to a global hard cap unless source wording clarifies it. Do not assume independent caps per slot. Those remain `UNKNOWN`.

### Purchased scale and blood require independent settlement records

Chapter 454 actually exchanges **10,000,000 shop points** for the Krakato scale and separately exercises **one free redemption opportunity** for Krakato blood. Thus the source standard listing for blood remains **10,000,000**, and one receipt uses a special coupon/free entitlement. The free purchase **does not** make the standard item cost zero for everyone. This pair is `OBS12-02`, not two new loot drops. The pre-existing Ch432 apparent `积分/战功` currency inconsistency is retained rather than erased.

### Inspected component versus finished equipment; risk versus recipe

The source scale's two attached effects and speculative forging are not proof that an uncrafted scale can be worn in any shield slot, nor that *all* crafted weapons automatically retain both effects. Its `品质` and `护甲` are explicitly **unknown**.

The blood item states a **hard lower bound** for any user of this particular dragon blood; it does **not** say legendary users always succeed. Bojie's less-than-20% chance is a **specific assessment** of his *fourth* bloodline when already carrying three. Higher maturity/potential is an unquantified source suggestion, not a general tier-wide numerical function. Bojie does not consume the vial in Ch889, so neither receipt nor resulting class can be retroactively created there.

## 3. Temporal and storyline guards

- **Private shop visibility:** Chapter 432 opens Cao Xing's exclusive Crystal Dragon shop **after the first Oracle War day** with the main crystal protected, not before the first battle and not globally for every region. This is observation `OBS12-01`. Converting to an LL01 trigger requires a versioned game content release; precommitted `EV09` clock unchanged.
- **Frozen source roster:** the chapter's named actor Bojie and his class are not a preassigned unit under Lí Lan. Source mechanics are usable only when a valid in-game acquisition/actor state exists.
- **No side effects on `Tử Phục`:** the blood’s hidden job conversion does not override the sole protagonist's fixed SSS talent.
- **No new T0 objects, chest rerolls, shops, currency or saved-game data** created by this extraction.

## 4. Unresolved high-priority late-game passages

The EV22/23 ancient-dragon new and hidden shops (notably chapters **1080–1081** and **1108–1109**), EV24 later Golden Shop (around **1137–1138**), and EV27 multi-tower reward settlement (around **1321** and **1330–1339**) still lack directly readable itemized panels, despite chapter headings being identified. **No late-game prices, rate tables or floor rewards were fabricated**. These remain source leads only; an index/title cannot serve as an executable reward receipt.

## 5. Regression / file-contract checks

1. Every one of **292** parent entries preserved in order and value; no new `SX` ID minted.
2. First **21** source effects unchanged, then exactly six `FX12` records appended, totalling **27**.
3. Existing research observations unchanged; exactly two `OBS12` observations appended.
4. The 30 scheduled event records are fully unchanged; source status remains research-only.
5. The current source-items CSV keeps exactly **292 data rows**, **byte-identical to v1.1**, because no item record changed.
6. All old v1.1 JSON/CSV remain accessible at `research/snapshots/events/`; prior source snapshots not rewritten.
7. Current `README.md` and `docs/CONTENT_INDEX.md` point to v1.2 as the latest extraction, not the v1.1 snapshot.

## 6. Files

- `data/events/EVENT-SOURCE-CATALOG-v1.2.json` and `data/events/EVENT-SOURCE-ITEMS-v1.2.csv`.
- `research/snapshots/events/EVENT-SOURCE-CATALOG-v1.1.json` and `research/snapshots/events/EVENT-SOURCE-ITEMS-v1.1.csv`.
- `research/extraction-audits/ROUND-12-TWELFTH-EXTRACTION.md`.
