# 01 — Combat System

The rules engine. Everything here is deterministic and player-visible.

---

## 1. Turn Structure

A combat turn has five phases. Only phases 2 and 3 accept player input.

| # | Phase | What happens |
|---|---|---|
| 1 | **ROLL** | Every die in the bag rolls. Locked/frozen dice keep their face. Slip carries over from last turn. |
| 2 | **SLIP** | Player spends Slip on dice manipulation. Free-form, any order, any number of times. Reversible until phase 3 commits. |
| 3 | **SLOT** | Player drags dice into skill slots. Slots preview exact output live. Player presses **RESOLVE**. |
| 4 | **RESOLVE** | Skills fire left-to-right in slot order. Damage, status, triggers. |
| 5 | **ENEMY** | Enemies execute their telegraphed intents in initiative order, then roll new intents for next turn. |

**End of turn:** unspent dice convert to Slip (1 each). Slip carries between turns, resets to 0 at fight start.

### Why unspent dice → Slip

This is the load-bearing conversion in the whole economy. It means:
- A bad roll is never a wasted turn — you bank the fuel to fix the *next* roll.
- Deliberately underspending is a real strategy ("bank 3 Slip this turn, guarantee an Omega next turn").
- More dice is always good, even when you can't slot them all.
- The player is never stuck with literally nothing to do.

---

## 2. The Slip Verbs

Slip is the manipulation currency. This is the pillar mechanic — it gets the most UI real estate and the most upgrade support.

| Verb | Cost | Effect |
|---|---|---|
| **NUDGE** | **1 / 2 / 3** | Change a die's face by ±1. Cannot wrap past min/max. **Cost escalates per die per turn:** 1st pip costs 1, 2nd costs 2, 3rd costs 3. Resets each turn. |
| **REROLL** | 2 | Reroll a single die. |
| **FREEZE** | 2 | Die keeps its face through next turn's ROLL phase. |
| **CLONE** | 4 | Copy one die's face onto another die. *The guaranteed-Sigma button.* |
| **SPLIT** | 4 | Destroy a die of face ≥4, create two temp dice whose faces sum to it. Expires end of turn. |
| **SET** | 6 | Set a die to any legal face. |

### Why Nudge escalates

A flat 1-cost Nudge lets a player manufacture a triple on essentially every turn — which pushes the natural 9.7% triple rate up past 70% and makes Sigma a formality instead of a spike. Escalating cost keeps single-pip fine-tuning cheap while making large face swings genuinely expensive, and it makes CLONE the correct tool at 3+ pips of distance. Full derivation in [`02-balance-math.md`](02-balance-math.md) §3.

**Slip cap: 10.** Overflow is lost. This is deliberate — it stops infinite hoarding and forces spend decisions. A relic raises the cap to 15.

### Slip generation
| Source | Amount |
|---|---|
| Unspent die at end of turn | 1 each |
| Fight start | **3** (base), +2 more with *Warm Hands* |
| Manipulation-lane skills | 1–4 per activation |
| Rolling a `1` on any die | 1 (bad-luck rebate — see below) |

> **Why 3 at fight start, not 0.** The design originally began every fight at
> zero Slip. Simulation showed basic fights ending in 2–3 turns while Slip
> income only arrives at *end* of turn — so the pillar mechanic sat dormant
> through most of a normal Act 1 fight. See [`02-balance-math.md`](02-balance-math.md) §12 Finding B.

### The bad-luck rebate

Rolling a `1` grants 1 Slip immediately. This is a small number doing important work: it makes the single worst face in the game into a *resource*, so the most tilting moment in a dice game ("I rolled all 1s") becomes "I have 4 Slip and full control." It's the clearest expression of Pillar 1.

---

## 3. Skill Slots

The player equips **4 skill slots** (expandable to 6 via relics). Each skill has a **cost** written as:

```
2d ≥3     two dice, each showing 3 or higher
3d ANY    three dice, any faces
1d ≥5     one die showing 5 or higher
2d EVEN   two dice, both even faces
```

Skills fire **left to right**. Slot order is player-arranged between fights and matters for combo builds (buffs applied by slot 1 affect slots 2–4 this same turn).

**Partial fills do nothing.** A skill needing `2d ≥3` with only one die slotted does not fire and the die is returned. No wasted dice from misclicks.

---

## 4. SIGMA — The Match Bonus

When **all dice slotted into a skill show the same face**, the skill amplifies.

| Dice matched | Tier | Multiplier | Screen treatment |
|---|---|---|---|
| 1 die at crown face* | **SIGMA** | ×1.6 | Gold flash |
| 2 matching | **SIGMA** | ×1.6 | Gold flash + shake |
| 3 matching | **DOUBLE SIGMA** | ×2.6 | Freeze frame, screen crack |
| 4 matching | **OMEGA SIGMA** | ×4.2 | Full stop, white-out, absurd number |
| 5+ matching | **OMEGA SIGMA+** | ×4.2 + 0.8/die | Reserved for late-game bags |

\* A 1-die skill Sigmas only on its die's **crown face** — the highest face that die can show. A d6 crowns on 6, a d8 on 8, a Sigma Stone (all 5s) crowns on 5. This keeps single-die skills in the Sigma economy without making them trivially amplified.

### Why these multipliers

The gaps are intentionally superlinear. Going 2→3 matching is +62% output; 3→4 is +62% again. A player who can reliably manufacture triples should feel meaningfully more powerful than one who settles for pairs — that's the skill expression. The full derivation and the pair-vs-triple expected-value comparison is in [`02-balance-math.md`](02-balance-math.md) §3.

---

## 5. The Damage Formula

```
PIP     = sum of face values slotted into the skill
BASE    = PIP × SkillPower + FlatBonus
SIGMA   = tier multiplier (1.0 / 1.6 / 2.6 / 4.2)
FINAL   = floor( BASE × SIGMA × GlobalMult ) + FlatAdd
```

- `SkillPower` — per-skill coefficient, typically 0.8–2.0. See [`04-skill-catalogue.md`](04-skill-catalogue.md).
- `GlobalMult` — product of buffs (Hyped, relics, hero passives). Multiplicative.
- `FlatAdd` — post-multiplier additions (e.g. *Sharp* relic: +2 per hit). Deliberately applied last so flat bonuses don't scale with Sigma; this keeps flat relics as early-game smoothing rather than late-game explosives.

### Worked example — one skill, five outcomes

**CLEAVE** — `2d ≥2`, SkillPower 1.0, FlatBonus 0.

| Dice slotted | PIP | Sigma | Damage |
|---|---|---|---|
| `[2,3]` | 5 | — | **5** |
| `[4,3]` | 7 | — | **7** |
| `[4,4]` | 8 | ×1.6 | **12** |
| `[6,5]` | 11 | — | **11** |
| `[6,6]` | 12 | ×1.6 | **19** |

Same skill, 5 → 19 damage. Nearly a 4× spread driven purely by the roll and what the player does about it. Both stated rules hold: **higher faces hit harder, matching faces hit much harder.**

---

## 6. Defense & Health

- **Player HP:** 60 base. Does not regenerate between fights automatically.
- **Block:** absorbs damage, **expires at end of enemy phase**. Block-heavy builds must re-block every turn.
- **Armor:** permanent flat reduction, applied after Block. Rare, capped at 6.
- **Healing:** only from Rest nodes, events, and a small number of skills/relics. Deliberately scarce — HP is a run resource you spend.

Damage resolution order: `incoming → minus Block → minus Armor → minus HP`.

---

## 7. Status Effects

Kept to a tight set. Every status is either a number that ticks down or a number that scales something.

### On enemies
| Status | Effect |
|---|---|
| **Burn** `N` | Takes N damage at end of its turn. N halves each turn (round down). |
| **Brittle** `N` | Takes +N% damage from all sources. Decays 1/turn. |
| **Stagger** `N` | Next N intents deal half damage. |
| **Bleed** `N` | Takes N damage every time it is hit. Does not decay. |
| **Mark** | Next hit on this target auto-counts as SIGMA (×1.6 minimum). Consumed on use. |

### On player
| Status | Effect |
|---|---|
| **Hyped** `N` | GlobalMult ×(1 + 0.25N). Decays 1/turn. Caps at 4. |
| **Slick** `N` | Next N Slip verbs cost 0. |
| **Jammed** `N` | N dice cannot be slotted this turn. Enemy-applied. |
| **Cursed** `N` | N dice roll at half face value (round up) for N turns. |
| **Sticky** | Dice do not convert to Slip at end of turn. Enemy-applied, 1 turn. |

**Mark** is the sneaky-good one. It's how defensive and combo builds access Sigma damage without needing matched faces, and it's the primary reward for the Combo lane.

---

## 8. Enemy Intents

Every enemy displays its next action above its sprite, always, with no fog. An intent shows:
- **Icon** (sword / shield / spiral / skull / dice)
- **Number** where applicable (exact damage, exact block)
- **One-word label** (`SMASH`, `LOCK`, `DRAIN`, `SUMMON`)

Enemies pick intents from a weighted table, with **no-repeat rules** to prevent unwinnable streaks (e.g. an enemy cannot roll `LOCK` twice in a row). Intent tables are in [`05-enemy-catalogue.md`](05-enemy-catalogue.md).

**Rule: intents never change after being shown.** If an enemy telegraphs 14 damage, it deals 14 damage — unless the player applied Stagger, which is the point.

---

## 9. Full Turn Walkthrough

> **Turn 3 vs. Ratio Wraith (HP 28) and NPC (HP 12).**
> Player: 42/60 HP, 3 Slip banked, bag of 5 dice.

**ROLL** → `[6, 5, 5, 2, 1]`
The `1` grants +1 Slip → **4 Slip**.

**INTENTS**
- Ratio Wraith: `LOCK 2` — will jam 2 dice next turn.
- NPC: `SMASH 7`.

**READ**
Killing the NPC now (12 HP) removes 7 damage/turn. But the Wraith's LOCK will cripple next turn, so the player wants a big Wraith hit *this* turn while all five dice are available.

**SLIP** — player has `[6,5,5,2,1]` and 4 Slip.
- NUDGE the `6` → `5` (cost 1). Now `[5,5,5,2,1]`. **3 Slip left.**

**SLOT**
- Slot 1 — **CLEAVE** `2d ≥2` ← `[2,1]`? Invalid, the `1` fails `≥2`. Player slots... nothing yet.
- Slot 2 — **SIGMA SLAM** `3d ≥4`, SkillPower 1.4 ← `[5,5,5]`
  PIP 15 × 1.4 = 21 → DOUBLE SIGMA ×2.6 = **54 damage**. Wraith (28 HP) is deleted with 26 overkill.

Reconsider: 54 into a 28 HP target wastes 26. Player backs out.

**REPLAN**
- Slot 2 — **SIGMA SLAM** ← `[5,5]` only? Needs 3 dice. No.
- NUDGE the `2` → `3` → `4`. Two pips on one die, so escalating cost: 1 + 2 = **3 Slip**. Now `[5,5,5,4,1]`. **0 Slip left.**
- Slot 1 — **CLEAVE** `2d ≥2` ← `[5,4]` → PIP 9 → **9 damage** to NPC. Survives at 3.
- Slot 2 — **SIGMA SLAM** `3d ≥4` ← `[5,5,5]` → **54** to Wraith. Dead.

**RESOLVE** — Wraith dies. NPC at 3 HP.
**ENEMY** — NPC smashes for 7. Player at 35/60.
**END** — the unspent `1` converts → **1 Slip** banked. Player enters next turn with an empty tank, having spent everything to end the fight a turn early.

The decision that mattered wasn't the roll. It was noticing that overkill is waste and spending 2 Slip to convert a dead die into a second activation.

---

## 10. Open Questions for Prototype

Flagged now so they get tested rather than assumed.

1. **Is 4 skill slots too few?** Suspicion: yes for combo builds, fine for everything else. Test 4 vs 5 as base.
2. **Does Slip carry-over create turtling?** A player might stall turns to bank 10 Slip. Enemy escalation should punish this — validate.
3. **Should FREEZE be 2 Slip?** It may be the strongest verb per point. Watch for it dominating.
4. **Is the `1`-rebate too generous with 6+ dice?** At 7 dice you expect ~1.17 ones/turn. Might need to cap the rebate at 2/turn.
5. **Slot-order combos** — real depth or fiddly busywork? Prototype with it on, be willing to cut.
