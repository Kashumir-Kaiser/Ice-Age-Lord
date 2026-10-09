# LORD DND — Source Extraction Round 26 (v2.6)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.5-ON-TIMELINE-0.6`. **Source items:** 328 → **347** (+19). **Effect records:** 84 → **93** (+9). **Observations:** 41 → **45** (+4). **Prior source conflicts:** 13 unchanged. **Fixed timeline:** 30 events unchanged. All material is **original-novel research**, not campaign starting inventory, a playable loot system, scheduled occurrence or automatic reward.

## Direct original-novel evidence

- [Original Chapter 702 — one actual Gold Jar transaction with cash-back system notices](https://czbooks.net/n/s6ojlf/s6ofpnpl?chapterNumber=704).
- [Original Chapter 703 — four-jar account, three actual opened-jar outcome groups and Jar King hidden achievement notice](https://czbooks.net/n/s6ojlf/s6ofpnpo?chapterNumber=705).
- [Original Chapter 704 — Black Jar final negotiated sale, actual opened-jar receipt, fruit inspection, and an unpurchased epic launcher on the merchant shelf](https://czbooks.net/n/s6ojlf/s6ofpnpd?chapterNumber=706).

Source text is the novel `冰封末世：我打造完美领地` (also cross-listed under `全球降临：带着嫂嫂末世种田`); the mirror URL `chapterNumber` values differ from the **printed original Ch702–704**. Do not promote chapter number suffix to chapter identity.

## 1. Purchased jars: four unique types, five jars total

| Entry | Jar | Count | Price confirmed in Krona | Source buyer |
|---|---|---:|---:|---|
| `SX-0329` | `未开启的金罐（金）` | 1 | 3,000,000 gross; 600,000 cashback | 曹星 |
| `SX-0330` | `未开启的银罐` | 2 | 700,000 **for two**, not each | 曹星 |
| `SX-0331` | `未开启的土罐` | 1 | 50,000 gross; 10,000 cashback → 40,000 net | 曹星 |
| `SX-0332` | `未开启的黑罐（橙）` | 1 | 25,000,000 gross; 5,000,000 cashback → 20,000,000 net | 曹星 |

The **first four jars** (one Gold, two Silver, one Earthen) have a source-stated aggregate **3,750,000 gross → 3,000,000 net** in Ch703. The **fifth** (Black) is purchased **later in Ch704** and **must not be included in that four-jar 3.75m total**.

The Gold Jar's price/cashback were explicit system notifications in Ch702: `3,000,000` paid, `600,000` returned through Cao Xing's existing Diamond Membership Card (`SX-0261` if identity confirmed; do not add another membership card). Card returns **20% of Krona transaction consideration**, independently from the seller's sticker price.

Black Jar has quote **28m**, intermediate quote **27.5m**, settled **25m** on condition that buyer opens it publicly as advertising. Olan City Lord transfers 25m Krona **to Cao Xing**, who subsequently pays the shop: this is an intermediary funding transfer, **not two separate shop payments and not a game loot reward**. The Diamond Membership Card then returns **5m**. No global seller restocking or standard 25m black-jar price is established.

These jar purchase records are one observed merchant stock occasion. Jar `SX-0330` records a two-unit purchase under one receipt, not two identical full-price purchases.

## 2. Three Ch703 outcome groups

### Gold Jar, one opened

- `SX-0333` `黄金古币` ×**43**.
- `SX-0334` `蛋白石宝珠（金）` ×**1**.
- `SX-0335` `秘银矿石` ×**17**.

Effect contract: `FX26-0002`. Source market NPC values opal at around 1.1m, but the treasure seller and buyer have different valuation because of buyer's own ancient-coin redemption use. This is **not** a fixed vendor buyback price.

### Earthen Jar, one opened

- `SX-0336` `黄铜古币` ×**22**.
- `SX-0337` `虎眼卵石碎片（绿）` ×**3**.
- `SX-0338` `铜矿石` ×**28**.

### Two Silver Jars opened together

- `SX-0339` `白银古币` ×**48**.
- `SX-0340` `魔岩石（金）` ×**9**.
- `SX-0341` `黑钻` ×**1**.
- `SX-0342` `恒金矿石` ×**17**.

Effect contract: `FX26-0004`. The source **combines the two Silver Jars into a single receipt**. **Do not** apportion 48 coins, 9 stones, diamond or 17 ore to one of the two jars without an explicit source partition, and **never** infer probabilities from this four-jar sample.

Ch703 purchase/total contract is `FX26-0003`. Its **3.75m gross/3m net** cover the four jars only. No extra draw or double-counted Gold Jar.

## 3. Black Jar transaction and observed opening (Ch704)

Contract `FX26-0005`: seller quotes 28m and 27.5m Krona, then accepts **25m** conditional on public opening. Buyer pays 25m after separate intermediary funds transfer; personal card cashback 5m yields a net expense of **20m**. This one shop has no verified repeatable stock, market-wide 25m price or guaranteed loot.

Actual single opened Black Jar yields exactly these four **explicit printed** receipts:

- `SX-0343` `白金古币` ×**32**.
- `SX-0344` `赤血心果（橙）` ×**1**.
- `SX-0345` `星陨锭` ×**15**.
- `SX-0346` `至纯裂片` ×**1**.

Effect contract: `FX26-0006`. `至纯裂片` previously appeared as an *achievement reward* at `SX-0290`, which is a **different actual acquisition channel**. Do not mark earlier achievement completed or create extra achievement claims by this jar's shard receipt.

## 4. Red Blood Heart Fruit exact source inspection (FX26-0007)

`赤血心果（橙）` is of source **Special** quality. Consuming **one** grants an **all-attribute +10%** modifier and unlocks `赤血狂怒`.

Active `赤血狂怒`: max HP **−30%** in exchange for Strength **+30%**, for **24 hours**. Long-term repeated frenzied state **may** cause irritability and loss of control; this is a source warning, not a verified fixed probability.

The fruit was **obtained and inspected**, not visibly consumed in Ch704. Therefore no invented automatic stat gain on jar opening or a claim that Cao Xing had already activated Frenzy.

## 5. Announced hidden achievement — NOT CLAIMED (FX26-0008)

`开罐之王` achievement system notice after initial Gold Jar: **open cumulatively 100 Gold-or-higher quality jars**. The **future** award would be a `开罐之王` title ×1 and **one unopened Black Jar**. Ch704 updates progress to **2/100** after opening the Black Jar. The prior clay and Silver Jars are lower-grade and do **not** enter this progress.

Crucial separation: `ACHIEVEMENT_DISCOVERED` / `PROGRESS_UPDATED` is **not** `REWARD_CLAIMED`. Do not add the promised future Black Jar as a second actual owned jar or the title as a present acquisition.

## 6. Unpurchased merchant equipment (FX26-0009)

`SX-0347`: `古代兵器：死神之眼发射器（橙）`—Epic launcher **on a shop shelf**, seen and inspected, **not bought**. Level **70+**. Attack **178,542–216,243**, interval **1.8s**. Normally fires `死神之眼` shells; when none available, source says it can consume energy instead. Panel names three effects `超级蓄能`, `死亡射线`, `死神之眼` without publishing individual numerical skill subcontracts. Any claim that Cao Xing gained it or that it has a known exact price is unsupported.

## 7. Append-only preservation checklist

1. All **328** preexisting `SX` entries unchanged and ordered; append `SX-0329..0347` (19).
2. All **84** previous effect records unchanged; append `FX26-0001..0009` (9).
3. All **41** previous observations unchanged; append `OBS26-01..04` (4).
4. All **13** unresolved conflicts unchanged. **All 30 fixed event objects unchanged**.
5. The source item CSV keeps the original UTF-8 BOM, **all 328 existing rows**, and its existing exact 69-column header; append exactly 19 rows to **347**.
6. Archive byte-identical v2.5 JSON and v2.5 CSV in `research/snapshots/events/`.
7. Do not alter or instantiate the original 192 chest positions, fixed 15 hero lairs, world seed, Lí Lan talent, canonical Files 01–07, active save, player assets or fixed event timeline.

## 8. Still unverified late-game priority

EV22/23 Ancient Dragon shop exact merchandise and transactions; EV24 late Golden Shop full itemized list; EV27 World Protector six towers' precise floor-by-floor payout panels. Chapter titles and rumors are not evidence of items/awards.

## Outputs

`data/events/EVENT-SOURCE-CATALOG-v2.6.json`, `data/events/EVENT-SOURCE-ITEMS-v2.6.csv`, this Round 26 audit and archived v2.5 parent.
