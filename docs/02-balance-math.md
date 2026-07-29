# 02 — Balance Math

All numbers are first-pass, derived analytically, and **flagged for prototype validation**. Where a number is a guess rather than a derivation, it says so.

---

## 1. Sigma Probability — The Foundation Table

Probability that a given roll contains *at least* one matched set, assuming all standard d6 (special dice skew these heavily — see §7).

| Dice in bag | P(pair exists) | P(triple exists) | P(quad exists) |
|---|---|---|---|
| 4 | 72.2% | 9.7% | 0.5% |
| 5 | 90.7% | 21.3% | 2.0% |
| 6 | 98.5% | 36.7% | 5.2% |
| 7 | 100%\* | 54.1% | — |
| 8 | 100%\* | 70.7% | — |

\* Pigeonhole: 7 dice across 6 faces guarantees a pair.

<details>
<summary>Derivation (4 dice, d6)</summary>

Total outcomes: 6⁴ = 1296
- All distinct: 6·5·4·3 = 360 → 27.8%
- Exactly one pair: 6 (pair value) × C(4,2) × (5·4) = 720 → 55.6%
- Two pairs: C(6,2) × C(4,2) = 90 → 6.9%
- Triple or better: 1296 − 1170 = 126 → 9.7% (of which quads = 6 → 0.46%)
</details>

### What this table means for design

**Pairs are the floor, triples are the goal.** At the starting 4 dice, a pair is available on ~3 of every 4 turns — Sigma is the expected case, not a jackpot. Triples at 9.7% are genuinely rare.

**More dice is the strongest upgrade in the game.** Going 4 → 6 dice more than triples your natural triple rate (9.7% → 36.7%). This is why dice-count relics are gated to rare/legendary and why the bag is capped at 8.

**This is the curve Slip exists to bend.** Everything in §3.

---

## 2. Expected Output — Is Sigma Worth Chasing?

Comparing a greedy non-matching play against a Sigma play, 4d6, 2-dice skill at SkillPower 1.0.

| Play | Expected PIP | Multiplier | Expected damage |
|---|---|---|---|
| Greedy: two highest dice, ignore matching | 8.97 | ×1.0 | **8.97** |
| Sigma: best available pair | 8.40 | ×1.6 | **13.44** |

**Sigma pair = +50% output** over greedy, while costing ~0.6 PIP in face value. That's the right shape: chasing Sigma should mean *sacrificing raw face value*, and it should still win.

3-dice skill, SkillPower 1.0:

| Play | Expected PIP | Multiplier | Expected damage |
|---|---|---|---|
| Greedy: three highest | 12.27 | ×1.0 | **12.27** |
| Double Sigma triple | 10.50 | ×2.6 | **27.30** |

**Triple = 2.2× a greedy play.** Big enough to reorganize a whole turn around. This is the number that makes the freeze-frame feel earned.

---

## 3. The Slip Economy — And a Balance Problem I Had to Fix

### Slip income
| Source | Rate |
|---|---|
| Unspent dice | 1 each — typically 2/turn |
| `1`s rolled | n/6 per turn — 0.67 at 4 dice, 1.0 at 6 dice |
| **Typical total** | **~2.7 Slip/turn** |

### The problem with flat 1-cost Nudge

My first pass priced NUDGE at a flat 1 Slip. Then I checked what it actually buys.

Converting `[5,5,3]` → `[5,5,5]` on a 3-dice skill:
- Before: PIP 13 × 1.0 = **13 damage**
- After: PIP 15 × 2.6 = **39 damage**
- Cost at flat pricing: 2 Slip (3→4→5)

That's **13 damage per Slip**. Against a baseline turn output of ~20, spending ~2.7 Slip/turn of income on this conversion adds ~35 damage — the manipulation nearly triples total output.

Worse, the *average distance* from a random die to a target face is ~1.9 pips. So at flat pricing, a player with normal Slip income can manufacture a triple **on essentially every turn**. That takes the triple rate from 9.7% to ~72% — which directly violates Pillar 2 ("Sigma is a spike, not a baseline") and makes the probability table in §1 decorative.

### The fix: escalating Nudge

**NUDGE costs 1 Slip for the first pip moved on a given die this turn, 2 for the second, 3 for the third** (resets each turn, tracked per die).

| Pips moved | Total cost |
|---|---|
| 1 | 1 |
| 2 | 3 |
| 3 | 6 |
| 4 | 10 |

Now the same `[5,5,3]` → `[5,5,5]` conversion costs **3 Slip**, slightly above per-turn income. The player can do it — but it consumes the entire turn's Slip budget with nothing left for FREEZE or defensive rerolls. That's a decision instead of a formality.

### Resulting verb ladder

Escalating Nudge makes the other verbs price themselves cleanly against it:

| Distance to target face | Cheapest route | Cost |
|---|---|---|
| 1 pip | NUDGE | 1 |
| 2 pips | NUDGE | 3 |
| 3 pips | **CLONE** | 4 |
| 4+ pips | **CLONE** | 4 |
| Need a specific face no die can reach | **SET** | 6 |

Every verb has a distance band where it's correct. Nudge owns fine-tuning, Clone owns big jumps, Set is the emergency button, Reroll is for when you don't care what you get. No verb is dominated.

### Final Slip costs (supersedes first pass)

| Verb | Cost |
|---|---|
| NUDGE | **1 / 2 / 3** escalating, per die, per turn |
| REROLL | 2 |
| FREEZE | 2 |
| CLONE | 4 |
| SPLIT | 4 |
| SET | 6 |

**Target triple rate with Slip in play: 30–40% of turns at Act 1.** Prototype instrumentation should log this every fight; if it exceeds 50%, raise the escalation or cut income.

---

## 4. Combat Length Targets

| Encounter | Target turns | Why |
|---|---|---|
| Basic (1–2 enemies) | 2–3 | Fast, keeps node pacing tight |
| Hard (3+ enemies) | 3–4 | Room for one AoE payoff turn |
| Elite | 4–5 | Long enough to need a plan |
| Boss | 5–7 | Phase changes need room to land |

At ~8 seconds/turn of think time, a basic fight is ~25s and a boss is ~55s. Across 18 nodes that lands a run at **12–15 minutes**. ✅ Matches target.

---

## 5. Player Output Curve

Assumed player damage per turn, averaged across good and bad rolls.

| Point in run | Bag size | Skill power | Sigma rate | **Output/turn** |
|---|---|---|---|---|
| Run start | 4 | 1.0 | ~35% pair | **18–24** |
| Act 1 boss | 5 | 1.1 | ~45% | **26–32** |
| Act 2 mid | 5–6 | 1.3 | ~55% | **40–50** |
| Act 2 boss | 6 | 1.4 | ~60% | **55–65** |
| Act 3 mid | 6–7 | 1.6 | ~70% | **85–105** |
| Act 3 boss | 7 | 1.8 | ~75% | **100–125** |

Roughly **5× growth** across a run. Growth comes from three multiplying sources: more dice (bag), better dice (faces), and better skills (power) — which is why the curve is exponential rather than linear.

---

## 6. Enemy Budgets

### HP

| Tier | Act 1 | Act 2 | Act 3 |
|---|---|---|---|
| Chaff | 12–20 | 30–45 | 70–95 |
| Basic | 22–34 | 48–70 | 100–130 |
| Elite | 60–75 | 130–150 | 240–270 |
| Boss | **110** | **220** | **420** |

Boss check: 110 ÷ 28 = 3.9 turns · 220 ÷ 55 = 4.0 turns · 420 ÷ 110 = 3.8 turns. Consistent, but at the short end of the 5–7 target — bosses get **damage-reduction phases** rather than more HP, so the fight lengthens without the numbers getting spongy.

### Damage output (per enemy, per turn)

| Tier | Act 1 | Act 2 | Act 3 |
|---|---|---|---|
| Chaff | 4–6 | 9–12 | 16–20 |
| Basic | 6–9 | 12–18 | 20–28 |
| Elite | 10–14 | 20–26 | 34–42 |
| Boss | 12–18 | 24–34 | 40–55 |

**Encounter incoming totals:** Act 1 ~12–16/turn · Act 2 ~22–30/turn · Act 3 ~38–50/turn.

### Survivability check — and why HP has to grow

Player base HP is 60. Act 3 incoming is ~44/turn. Unmitigated, that's death in **1.4 turns**. Two systems have to close that gap:

| Source | Act 3 contribution |
|---|---|
| Max HP from relics + events | +25 to +40 (expected max HP **85–100**) |
| Block output per turn | 30–40 |

Net incoming after block: ~4–14/turn against ~90 HP = **6–20 turns of runway**. Comfortable, and correctly forces block into every Act 3 build.

⚠️ **Consequence to watch:** this makes at least one defensive skill *mandatory* by Act 3, which quietly costs a slot and narrows builds. If playtesting shows Act 3 loadouts converging on the same defensive pick, the fix is to give more offensive skills incidental block (Sigma-gated), not to lower enemy damage.

---

## 7. Special Dice and Sigma Odds

The table in §1 assumes uniform d6. Special dice deliberately break it — that's their whole value.

| Die | Faces | P(matches a given face) | Effect on bag |
|---|---|---|---|
| Standard d6 | 1,2,3,4,5,6 | 16.7% | Baseline |
| Loaded d6 | 3,3,4,4,5,5 | 33.3% on 3/4/5 | Doubles pair odds in mid range |
| Twin d6 | 2,2,4,4,6,6 | 33.3% on evens | Huge Sigma odds, zero odd flexibility |
| Sigma Stone | 5,5,5,5,5,5 | 100% on 5 | Guarantees Sigma with any other 5 |
| Sharp d8 | 1–8 | 12.5% | Higher ceiling, worse matching |

**Two Loaded d6 in a bag:** P(they match each other) = 3 × (1/3)² = **33.3%**, double the 16.7% of two standard dice.

**Sigma Stone + Loaded d6:** P(match) = P(Loaded rolls 5) = **33.3%** from a single die's roll — and the Stone never fails you.

**Three Sigma Stones:** guaranteed Double Sigma on any 3-dice `≥5` skill, every single turn, forever. This is intentionally a *build*, and it's why Sigma Stones are legendary, capped at 3 in the pool, and pay for their consistency with a hard ceiling: PIP is locked at 15, so the build can never scale into the Act 3 output curve without outside help. **Flag for playtest** — if this trivializes Act 1 and 2, the Stone's face drops to 4.

---

## 8. Rarity & Reward Weights

### Drop weights by act

| Rarity | Act 1 | Act 2 | Act 3 |
|---|---|---|---|
| Common | 62% | 42% | 26% |
| Uncommon | 31% | 41% | 44% |
| Rare | 6.5% | 15% | 26% |
| Legendary | 0.5% | 2% | 4% |

Elite and boss rewards roll on a shifted table: **+1 rarity tier minimum**, legendary weight ×3.

### Rewards per node type

| Node | Reward |
|---|---|
| Battle | Choice of 3 skills, OR 1 die + Chips |
| Hard battle | Choice of 3 skills + 25–40 Chips |
| Elite | Guaranteed relic + choice of 2 dice |
| Boss | Legendary-weighted relic + choice of 3 dice + 100 Chips |
| Treasure | 1 relic (rare-weighted) |
| Shop | Purchases only |
| Rest | Heal 30% max HP, OR forge a die, OR upgrade a skill |

### Expected acquisitions per run
| Thing | Count by end of run |
|---|---|
| Dice added to bag | 6–9 (bag caps at 8, so 1–3 get sold/replaced) |
| Skills seen | 30–40 |
| Skills equipped | 4–6 |
| Relics | 7–10 |

---

## 9. Currency

**Gold** (in-run) — spent at shops.

| Source | Amount |
|---|---|
| Basic battle | 12–20 |
| Hard battle | 22–35 |
| Elite | 45–65 |
| Boss | 90–120 |
| **Expected per run** | **~380** |

Shop prices: common die 45 · uncommon die 85 · rare die 150 · skill 60–120 · relic 140–200 · die removal 60 (price +15 each use).

~380 gold across three shops ≈ **4–6 purchases per run**. Deliberately scarce enough that shop visits require a plan.

**Chips** (meta) — see [`07-meta-progression.md`](07-meta-progression.md).

---

## 10. Tuning Guardrails

Hard limits. If prototype telemetry breaks one of these, the system is wrong, not the player.

| Guardrail | Threshold | If violated |
|---|---|---|
| Triple rate (Act 1, with Slip) | 30–40% of turns | Adjust Nudge escalation |
| Turns where player slots 0 dice | < 2% | Lower skill face requirements |
| Basic fight length | ≤ 4 turns | Cut enemy HP |
| Act 1 win rate (new player) | 55–70% | Adjust Act 1 damage |
| Full run win rate (experienced) | 30–45% | Adjust Act 3 |
| Deaths attributed to "bad rolls" in exit survey | < 15% | Increase Slip income |
| Single skill > 45% of run damage | Never | Nerf that skill |
| Median run time | 12–15 min | Adjust node count |

---

## 11. Instrumentation Required in the Prototype

Non-negotiable logging, because none of the above is trustworthy without data:

1. Per-turn: bag contents, roll result, Slip spent by verb, dice slotted, Sigma tier achieved, damage dealt.
2. Per-fight: turn count, damage taken, HP remaining.
3. Per-run: act reached, cause of death, final bag, final skills, relics.
4. Per-skill: pick rate, activation count, share of total damage.
5. Per-die: pick rate, and win rate of runs containing it.

Skill pick rate and per-die win rate are the two that will actually drive balance changes. Everything else is context.
