# LORD DND — Source Extraction Round 19 (v1.9)

**Parent:** `LL01-WEB-EVENT-SOURCE-EXTRACTION-1.8-ON-TIMELINE-0.6`. **Source records:** 319 → **319** (+0). **Effect contracts:** 60 → **64** (+4). **Observations:** 29 → **30** (+1). **Scheduled events:** 30 unchanged. **Research only:** no live campaign adoption or automatic loot.

## Source provenance

- [Original Chapter 809 — actual inspected skill panels after Chapter 808 trading](https://www.ttkan.co/novel/pagea/bingfengmoshi_wodazaowanmeilingdi-yitiaoxiaobaishe_812.html). The mirror page ends `_812`, while the source's printed chapter heading is `第809章`.
- Previous purchases and identities are `SX-0313`, `SX-0314`, `SX-0317` and `SX-0318`, already recorded in Round 18. **No second acquisition occurred** as a result of inspection. Learning status is not equivalent to purchase or universal class eligibility.

## Four newly documented effect contracts

### FX19-0001 — 禁咒·极冰穿刺（橙） / Cực Băng Xuyên Thứ

- Skillbook `SX-0313`. **Epic; level >=70**.
- Single target: ice magic damage equal to **2,288% of attack power**.
- Ice explosion: **348% of attack power**, enemies within **100 m** around the target.
- `绝对穿刺`: ignores **50% magic resistance**; guaranteed critical hit; **+100% critical damage**; **+300% additional damage to shields**.
- Cooldown **10 hours**. Unprinted mana/divine-power cost is **unknown**, not zero.

### FX19-0002 — 霜神之息 / Hơi Thở Sương Thần

- Skillbook `SX-0314`. **Legendary**, requires **level >=100 legendary Frost Mage**.
- Divine-power cost **15**; frontal **120°** sector, maximum **5,000 m** range; **5-second** breath.
- Damage each second: **2,200% spirit + 1,477% attack power**, ice divine-power damage.
- Displayed movement-speed reduction sequence begins **50%, 100%, 150%...**. The excerpt does not justify extrapolating additional stages or imposing an invented cap.
- `霜神印记`: enemy ice resistance **−20% for 24 hours**. On marked target death, ice ring affects enemies within **100 m**, dealing **154% of caster attack power** as true damage.
- Cooldown and full debuff-stage table remain **unknown**.

### FX19-0003 — 技能书：圣剑解放（橙） / Giải Phóng Thánh Kiếm

- Skillbook `SX-0317`. **Epic; level >=70; Aurora Knight profession**.
- For **180 seconds**: weapon base attack **+300%**, normal attack range **+300%**; attacks apply `光蚀`.
- `光蚀`: each hit reduces target armor **5%**, maximum **5 stacks**; max-stack detonation deals **215% attack power** as true damage.
- When skill ends, weapon enters **1-hour overload**: base attack becomes **0** and weapon effects cannot be used.
- The original protagonist treats the drawback as avoidable via a **separate Eternal Power ability**. This is not a native immunity or a property conferred on all users of this skill.

### FX19-0004 — 技能书：极光壁垒 / Thành Lũy Cực Quang

- Skillbook `SX-0318`. **Legendary; level >=100 legendary Aurora Knight**.
- Divine-power cost **10**; frontal **120°** sector, maximum **2,000 m** range; duration **8 seconds**.
- Blocks attacks coming from the front, including physical, magic and ranged projectiles.
- Blocked strikes have **50% probability** of being reflected to enemies for equal damage.
- Allies within the protected area gain **+30% attack range** and **+30% movement speed** while it is active.
- Cooldown **10 hours**. Do not infer rear protection, other damage immunities or universally permanent effects.

## Important extraction boundaries

1. Chapter 808 records the **trade receipt**; Chapter 809 describes **skill effect inspection and certain source-protagonist learning**. Do not merge these into universal acquired-and-learned player state.
2. The two additional bought Chapter 808 skillbooks, `机械装甲·单兵推进器` (`SX-0315`) and `钢铁洪流` (`SX-0316`), are **not filled with guessed numerical contracts** by this pass.
3. Four effect records are research-layer descriptions, **not new items, event rewards, shop offers, blueprint acquisitions, or campaign guarantees**.
4. Novel protagonist-only talent interaction with the Saint Sword overload is a character-specific edge case; must not silently redefine source base mechanics.
5. Source content after the shown Chapter 809 panel is not assumed absent; the four panels here are those independently confirmed.

## Preservation and release validation

- Exactly **319 prior entries** maintained in original order, no source item appended.
- Exactly **60 prior effect records** preserved, with `FX19-0001..0004` appended.
- Exactly **29 prior source observations** preserved, with `OBS19-01` appended.
- Previous event schedule remains **30** objects, no added or changed calendar event.
- v1.8 JSON/CSV retained as immutable historical reference; v1.9 CSV has **unchanged** 319 rows because Round 19 adds **effect records only**, no items.
- Canonical File01–07, world-package 192 chest positions, 15 hero lairs, existing saves and Lí Lan's SSS class remain untouched.

## Unresolved source targets

Later Ancient Dragon shops (EV22/23), later Golden Shop (EV24) and World Protector tower loot (EV27) still require full chapter item/transaction panels. Chapter-title indexes are **not sufficient** to create inventory or award records.
