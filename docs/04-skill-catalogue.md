# 04 — Skill Catalogue

**34 skills** across four lanes. The player equips **4** (up to 6 with relics), arranged left-to-right in firing order.

**Cost notation:** `2d ≥3` = two dice, each showing 3+ · `3d ANY` = three dice, any faces · `2d EVEN` = two even faces · `1d =6` = exactly a 6.

**Damage** = `PIP × Power + Flat`, then × Sigma multiplier. See [`01-combat-system.md`](01-combat-system.md) §5.

**Upgrade:** each skill can be upgraded once at a Rest node (`+` version). Upgrades are listed inline.

---

## Lane 1 — MANIPULATION (12 skills) · *the pillar*

Every one of these either generates Slip, changes dice, or converts manipulation into damage. This lane gets the most content because it's the game's identity.

| Skill | Cost | Rarity | Effect | SIGMA |
|---|---|---|---|---|
| **Fumble** | `1d ANY` | Common | Gain 2 Slip. | Gain 4 Slip instead. |
| **Sleight** | `2d ANY` | Common | Deal `PIP × 0.8`. Gain 1 Slip. | Gain 3 Slip. |
| **Reset Button** | `1d ≤2` | Common | Reroll every die in the bag. Gain 1 Slip. | Reroll, then FREEZE the highest result. |
| **Greased Palms** | `2d ANY` | Uncommon | Your next 3 NUDGEs this turn cost 0. | Next 6 NUDGEs cost 0. |
| **Duplicate** | `2d ≥3` | Uncommon | Deal `PIP × 1.0`. CLONE one die for free. | CLONE twice for free. |
| **Skim** | `1d ANY` | Uncommon | Deal `PIP × 1.2`. If the die shows a `1`, gain 3 Slip. | Deal `PIP × 1.2` and gain 3 Slip regardless. |
| **Overclock** | `2d ≥4` | Uncommon | Deal `PIP × 1.1`. Gain **Hyped 1**. | Gain **Hyped 2**. |
| **Bend the Odds** | `3d ANY` | Rare | SET all three slotted dice to the highest among them, then deal `PIP × 1.0`. | *(auto-Sigma after the set — this skill manufactures its own Double Sigma)* |
| **Slip Stream** | `2d ODD` | Rare | Deal `PIP × 1.4`. Gain Slip equal to the number of `1`s and `3`s in your bag. | Double the Slip gained. |
| **Loaded Question** | `2d ANY` | Rare | Deal `PIP × 0.6` per point of Slip you currently hold, then lose all Slip. | Do not lose the Slip. |
| **The Gambit** | `3d ≥5` | Legendary | Reroll all slotted dice. Deal `PIP × 2.4` on the new result. | Applies to the *new* roll — reroll into a Double Sigma for `PIP × 6.24`. |
| **Hand of Sig** | `1d =6` | Legendary | SET every die in your bag to `6`. Gain **Slick 3**. Once per fight. | *(auto-Sigma — it's a 1d crown skill)* |

**Upgrades (`+`):** Fumble+ 3/6 Slip · Sleight+ ×1.1 · Duplicate+ ×1.3 · Overclock+ Hyped 2/3 · Bend the Odds+ sets to highest **+1** · Loaded Question+ ×0.8/Slip · The Gambit+ ×2.9.

> **Design note — Loaded Question** is the lane's payoff card and the reason the Slip cap exists. At 10 Slip it deals `PIP × 6.0` — roughly 48 damage from an average roll. Uncapped Slip would make it the only skill anyone plays.

---

## Lane 2 — BIG NUMBER (8 skills)

Fewer, larger hits. Rewards high faces and high Sigma tiers. Weak against groups.

| Skill | Cost | Rarity | Effect | SIGMA |
|---|---|---|---|---|
| **Cleave** | `2d ≥2` | Common | Deal `PIP × 1.0`. | Standard tier multiplier. |
| **Haymaker** | `2d ≥4` | Common | Deal `PIP × 1.3`. | Standard. |
| **Sigma Slam** | `3d ≥4` | Uncommon | Deal `PIP × 1.4`. | Standard. The lane's signature. |
| **Ratio** | `2d ANY` | Uncommon | Deal `PIP × 1.0`. If target HP is below yours, `PIP × 2.0`. | Standard, applied after the HP check. |
| **Grindset** | `2d ≥3` | Uncommon | Deal `PIP × 1.2`. Permanently +0.1 Power for the rest of the fight. | +0.3 Power instead. |
| **Colossal L** | `4d ≥5` | Rare | Deal `PIP × 1.8`. | At Omega Sigma this is `PIP × 7.56` — the game's biggest single number. |
| **Terminal Velocity** | `2d =6` | Rare | Deal `PIP × 2.2`. Ignores Block. | Always Sigma by definition (`=6` twice). |
| **Delete** | `3d ≥6` | Legendary | Deal `PIP × 2.0`. If this kills, refund all dice and take another turn. | Standard. |

**Upgrades:** Cleave+ ×1.2 · Haymaker+ ×1.5 · Sigma Slam+ ×1.7 · Ratio+ threshold becomes "below 60% of yours" · Colossal L+ ×2.1 · Delete+ requirement drops to `3d ≥5`.

---

## Lane 3 — COMBO (8 skills)

Many small activations, status stacking, and slot-order tricks. Cheap dice requirements so low rolls stay useful.

| Skill | Cost | Rarity | Effect | SIGMA |
|---|---|---|---|---|
| **Jab** | `1d ANY` | Common | Deal `PIP × 1.5`. | Standard (crown face). |
| **Spread** | `2d ANY` | Common | Deal `PIP × 0.6` to **all** enemies. | Standard — the lane's AoE backbone. |
| **Tag** | `1d ≤3` | Common | Apply **Mark**. Deal `PIP × 0.5`. | Apply Mark to all enemies. |
| **Chain Reaction** | `2d ANY` | Uncommon | Deal `PIP × 0.7`. Repeat once for each skill that fired *before* this one this turn. | Repeat count doubled. |
| **Kindle** | `2d ANY` | Uncommon | Apply **Burn** equal to PIP. | Apply Burn equal to `PIP × 2`. |
| **Softening** | `2d ANY` | Uncommon | Apply **Brittle 15**. Deal `PIP × 0.5`. | **Brittle 35**. |
| **Death by 1000** | `3d ANY` | Rare | Deal `PIP × 0.4` **five times**. Each hit triggers Bleed separately. | Seven times. |
| **Full Send** | `4d ANY` | Rare | Deal `PIP × 0.9` to all enemies. Apply Stagger 1 to all. | Stagger 2. |

**Upgrades:** Jab+ ×1.8 · Spread+ ×0.75 · Chain Reaction+ ×0.9 · Kindle+ Burn = `PIP × 1.5` base · Death by 1000+ six hits.

> **Slot order matters most here.** `Softening → Kindle → Chain Reaction → Spread` in slots 1-4 means Brittle amplifies everything downstream and Chain Reaction repeats three times. Getting a player to *discover* this ordering is the main teaching goal of Act 2.

---

## Lane 4 — DEFENSE (6 skills)

Block, sustain, and dice protection. Small lane by count, but Act 3 makes at least one of these effectively mandatory (see [`02-balance-math.md`](02-balance-math.md) §6).

| Skill | Cost | Rarity | Effect | SIGMA |
|---|---|---|---|---|
| **Brace** | `1d ANY` | Common | Gain Block `PIP × 1.8`. | Standard. |
| **Turtle** | `2d ≤3` | Common | Gain Block `PIP × 2.5`. Deliberately eats your low dice. | Standard. |
| **Counterweight** | `2d ANY` | Uncommon | Gain Block `PIP × 1.5`. Deal that much damage to the first enemy that hits you. | Damage doubled. |
| **Non-Stick** | `1d ANY` | Uncommon | Gain Block `PIP × 1.2`. Immune to **Jammed** and **Sticky** this turn. | Immunity lasts 2 turns. |
| **Second Wind** | `2d ≥4` | Rare | Gain Block `PIP × 1.4`. Heal `PIP × 0.5`. | Heal `PIP × 1.2`. |
| **Immovable** | `3d ANY` | Rare | Gain Block `PIP × 2.0`. Block does not expire this turn. | Gain **Armor 2** for the fight. |

**Upgrades:** Brace+ ×2.2 · Turtle+ ×3.0 · Counterweight+ ×1.8 · Second Wind+ heal ×0.8 · Immovable+ ×2.4.

> **Turtle** is the small elegant one. It requires *low* dice, which means the dice your Big Number skills can't use are exactly the dice your defense wants. Skill requirements are designed as a partition problem, not a ladder.

---

## Cross-Lane Design Principles

**1. Every face value has a home.** `1`s and `2`s feed Turtle, Tag, and Reset Button, and generate Slip. `6`s feed Terminal Velocity and Delete. Mid faces feed everything. There is no dead roll.

**2. Requirements partition the bag.** Skills are chosen so a 4-skill loadout can consume a whole bag without contention. A loadout of four `≥5` skills should feel obviously wrong.

**3. Sigma is never mandatory.** Every skill functions without matching. Sigma is upside, not a gate — otherwise bad rolls become dead turns and Pillar 1 breaks.

**4. Power coefficients scale inversely with dice count and face requirement.** A `1d ANY` skill at 1.5 power and a `4d ≥5` skill at 1.8 power are roughly comparable per-die; the 4d skill buys its edge with restriction and Omega Sigma access.

---

## Starting Loadout (Hero: Sig)

| Slot | Skill | Why |
|---|---|---|
| 1 | **Softening** | Teaches slot-order (debuff first) |
| 2 | **Cleave** | Teaches PIP and Sigma on the simplest possible skill |
| 3 | **Fumble** | Teaches the Slip economy immediately |
| 4 | **Brace** | Teaches Block and that low dice have a use |

This loadout deliberately spans all four lanes so the first three fights demonstrate the whole system, then Act 1 rewards let the player specialize.
