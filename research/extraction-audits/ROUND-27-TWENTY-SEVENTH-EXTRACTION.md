# LORD DND — Extraction Round 27 (v2.7)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-2.6-ON-TIMELINE-0.6`. **Research-only.**
**Items:** 347 → **361** (+14). **Effects:** 93 → **102** (+9). **Observations:** 45 → **49** (+4).
**Conflicts:** 13 existing records unchanged. **Fixed 30 scheduled events:** unchanged.

## Original source evidence

- [Chapter 711 — excavation of Gold Jar and four-line actual opening](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_714.html) (printed chapter 711; mirror suffix 714).
- [Chapter 713 — one Strange Metal Fragment and 100:1 conversion](https://www.69shuba.com/txt/58776/40564716).
- [Chapter 714 — building salvage and one unlocked trophy box with five actual item lines](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_717.html) (printed chapter 714; mirror suffix 717).

No shop-title, quest-rumor, or future expected chest output is promoted to completed acquisition.

## 1. Chapter 711: independently dug-up Gold Jar

**SX-0348** is **one Gold Jar excavated in Asura ruins**, separate from the earlier **purchased** Ch702 Gold Jar `SX-0329`. The owner Cao Xing passes it to territory member Sarah, who opens it. System progress for `开罐之王` increases **2/100 → 3/100** (`FX27-0001`). This is one observed party interaction and does not establish a universal award rule for any ally.

Four itemized opening results (one source jar):

| ID | Actual source item | Quantity |
|---|---|---:|
| `SX-0349` | `黄金古币` | 46 |
| `SX-0350` | `蓝铜宝珠（金）` | 1 |
| `SX-0351` | `星陨矿石` | 6 |
| `SX-0352` | `秘银矿石` | 13 |

`FX27-0002` preserves this receipt separately from both the previous Ch703 jar and Ch714 chest. NPC Olan says Blue-Copper Orb's approximate purchase valuation is 3 million Krona; **no actual resale** is shown.

## 2. Chapter 713: Strange Metal research, not unrestricted manufacturing

One `奇异金属碎片` is picked up and inspected in Chapter 713. The item explicitly gives **100 fragments → 1 `奇异金属`**. The material's tested utility is described as **3.5× that of Mithril** in flexibility/magic conductivity. Its historical use includes war machinery and golem components. Source lore explains that ancient Asura alchemists developed it from iron ore, stone and plant fibre; there are **no precise costs, production time, refining equipment requirements or an unlocked complete recipe**. `FX27-0003` records the 100:1 item conversion separately from historical production techniques.

Source golems are protected by self-destruct mechanisms that impede dismantling; a named protagonist's exceptional takeover is not a general wild-golem conversion formula.

## 3. Chapter 714: separately settled outer-room dismantling

These four **explicitly itemized** salvage receipts occur in the outer hall, **outside** the locked-box opening:

| ID | Item | Quantity |
|---|---|---:|
| `SX-0353` | `奇异金属碎片` | 17,525 |
| `SX-0354` | `奇异金属` | 34 |
| `SX-0355` | `破损的机械零件` | 5 |
| `SX-0356` | `专家级能源水晶（已使用）` | 12 |

`FX27-0004` links these as one outer-hall haul. The twelve crystals are explicitly **USED**, not charged. Later inner-hall scavenging is described only approximately (over ten thousand fragments, dozens of metal pieces); exact records are **not** manufactured or included in outer-hall sums. Ch713's single picked-up fragment is also noted without assuming it forms part of the 17,525 aggregate.

## 4. Locked Asura trophy box — actual opening, not universal loot

After local machines were dismantled, the normal route of obtaining the password by activating room instruments became impossible. A bound golem overrode its own internal guard and supplied **one 16-digit password** for the source's specific box. `FX27-0005` preserves the observed route and the fact this does **not** demonstrate a general chest-unlocking ability. The original warns that breaking normal treasure chests can destroy contents; physical attack of this **particular** locked box was not tested.

One successfully opened locked treasure box provides:

| ID | Actual item | Quantity |
|---|---|---:|
| `SX-0357` | `奇异金属（金）` | 112 |
| `SX-0358` | `专家级能源水晶` | 15 |
| `SX-0359` | `德里墨钢锭（橙）` | 32 |
| `SX-0360` | `上古木板（橙）` | 35 |
| `SX-0361` | `古代兵器·短距离空间传送器（金）` | 1 |

`FX27-0006` links the five items to this **one actual container**. It is neither an ancient golden treasure chest nor a repeatable deterministic five-line loot template for newly started games.

## 5. Three useful item-mechanics contracts

- **FX27-0007 — Derimo Steel Ingot:** Epic material for large golem cores, high-grade mechanical armor and legendary gear. Forging requires **Legendary forging technique**. Listed constituent material types include iron, steel, Eternal Gold and Mithril but **not exact bills/production counts**.
- **FX27-0008 — Ancient Wood Plank:** **100 Epic `上古木板` → 1 Legendary `上古坚木`**. Used in high-end Epic constructions and some Legendary construction/Lord Castle upgrades. 35 planks from the chest are **not enough** for one complete hardwood; no implicit grant.
- **FX27-0009 — Short-Range Space Teleporter:** Acquired with energy reserve **1,000/2,000**; each activation costs **500 energy**, moving its wielder **5–20 m forward**, with **25-second cooldown**. That reserve implies two activations **without recharge**. Source does not state recharge method, portal pair, multi-person transport or arbitrary long-distance travel.

## 6. Strict separation and publication checklist

- New IDs `SX-0348..0361`, `FX27-0001..0009`, `OBS27-01..04` are append-only.
- All prior **347** entries, **93** effects, **45** observations, **13** conflicts are preserved in order and value.
- All **30 event schedule objects** unchanged. No additional EV code, story gate, starting treasure or new campaign asset.
- Item review CSV retains UTF-8 BOM, exact original header and all prior 347 rows, plus exactly 14 new rows to reach 361.
- Previous v2.6 JSON and CSV must be archived byte-identically in `research/snapshots/events/`.
- Canonical File01–07, 192 preseeded chests, 15 Hero lairs, SSS Tử Phục Linh Sư and all campaign saves are untouched.

**Still unresolved:** EV22/23 Ancient Dragon new/hidden shop list; EV24 later Dragon Festival Golden Shop; EV27 World Protector floor-by-floor rewards. These remain leads, not populated guaranteed rewards.
