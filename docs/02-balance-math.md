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
| **Fight start** | **3** (revised from 0 — see §12 Finding B) |
| Unspent dice | 1 each — typically 2/turn |
| `1`s rolled | n/6 per turn — 0.67 at 4 dice, 1.0 at 6 dice |
| **Typical total** | **~2.7 Slip/turn** after turn 1 |

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

---

## 12 — Simulation Results (first pass)

Everything above §11 was derived analytically. This section is what the
headless simulator actually measured. Run it yourself with `npm run sim`.

Method: 200,000 random rolls for the probability check; 500 fights per row for
combat, played by a greedy AI that fills slots best-combination-first and
spends Slip on whichever nudge sequence has the best value-per-point.

### Finding A — the probability table is correct ✅

| Dice | P(pair) measured | doc | P(triple) measured | doc | P(quad) measured | doc |
|---|---|---|---|---|---|---|
| 4 | 72.2% | 72.2% | 9.8% | 9.7% | 0.5% | 0.5% |
| 5 | 90.7% | 90.7% | 21.2% | 21.3% | 2.0% | 2.0% |
| 6 | 98.5% | 98.5% | 36.7% | 36.7% | 5.2% | 5.2% |
| 7 | 100% | 100% | 54.2% | 54.1% | 10.6% | — |
| 8 | 100% | 100% | 70.7% | 70.7% | 18.3% | — |

Every hand-derived figure lands within 0.1 percentage points. §1 stands.

### Finding B — Slip was dead on arrival (fixed)

The design had the player entering every fight with **0 Slip**, with income
arriving only at *end* of turn. The simulator showed basic fights ending in
**1.9–2.9 turns**. A player therefore had nothing to spend during turn 1 and
almost nothing during turn 2 — the pillar mechanic was inactive for most of a
normal Act 1 fight. Measured Slip spend: **0.7 per turn**.

**Fix applied: the player now starts each fight with 3 Slip.** Measured spend
rose to **1.8–3.1 per turn**, and the Sigma rate rose with it. *Warm Hands*
(docs/07) now reads +2 on top of that baseline rather than being the only
source.

### Finding C — fill order starves expensive skills

With a 4-die bag and a loadout of Cleave (2d), Haymaker (2d), Sigma Slam (3d)
and Brace (1d), a naive left-to-right fill consumes everything before the 3-die
skill is reached. **Sigma Slam never fired once in 5,000 fights, and the Double
Sigma rate was a flat 0.0%** — a headline feature with a freeze-frame and a
screen-crack effect that literally never triggered.

Filling highest-cost-first instead:

| Loadout / bag | Sigma | Double | Omega |
|---|---|---|---|
| Damage kit, 4 dice | 28.2% | 21.9% | 0.0% |
| Damage kit, 6 dice | 29.8% | 26.7% | 0.0% |
| 3d+4d kit, 5 dice | 8.7% | 19.7% | 5.9% |
| 3d+4d kit, 6 dice | 9.5% | 17.6% | 10.8% |
| 3d+4d kit, 8 dice | 7.3% | 15.9% | 19.4% |

This is not a rules bug — it's a real strategic layer, and *assignment priority*
turns out to be as important as which dice you own. Two consequences:

1. **The UI must not quietly play badly for the player.** Tap-to-slot originally
   chose the leftmost legal slot, which with the starting loadout dumps every
   die into Softening (PIP × 0.5, the weakest skill on the bar) — the laziest
   input was also the worst play, dealing 5 damage across 5 turns. It now scores
   each slot by its *projected full* value.
2. **Double Sigma frequency is a function of loadout, not luck.** A 2d-heavy
   build sees it near-never; a 3d/4d build sees it ~20% of activations. Worth
   surfacing to the player.

### Finding D — output scales with bag size much faster than §5 assumed ⚠️

The most important result, and the one still needing a decision.

| Loadout | Bag | Damage/turn |
|---|---|---|
| 3d+4d kit, **base-power skills, no upgrades** | 5 | **51.8** |
| 3d+4d kit, base-power skills | 6 | **76.4** |
| 3d+4d kit, base-power skills | 8 | **119.1** |

§5 projects the **Act 3 boss** at 100–125 damage/turn, assuming 7 dice *and*
SkillPower 1.8 *and* upgraded dice. The simulator reaches that same output with
**8 plain d6 and completely un-upgraded Act 1 skills**.

Dice count is doing far more work than the curve assumed — it multiplies with
itself, because more dice means both more PIP *and* a much higher Sigma tier
(§1: 9.7% → 70.7% triple rate from 4 → 8 dice). Real run growth is closer to
**8–12×**, not the 5× in §5.

If left alone, an Act 3 boss at 420 HP dies in roughly two turns.

**Options, in the order I'd try them:**
1. **Lower the bag cap from 8 to 7.** Cheapest fix, biggest effect, costs the
   least elsewhere. *Recommended.*
2. **Raise Act 3 HP by ~1.6×** (boss 420 → 650). Risks sponginess.
3. **Slow dice acquisition** so a typical run ends at 6–7 dice rather than 8.
4. Flatten Omega Sigma's `+0.8/die` scaling past 4 matching dice.

I'd take 1 + 3 together and re-measure. This needs a call before Phase 3 sets
the reward tables — it does not block Phase 2.

### Finding E — Sigma Stone is as strong as feared

| Build | Damage/turn | Double Sigma rate | Turns to kill Mid (elite, 64 HP) |
|---|---|---|---|
| 3 × Sigma Stone + damage kit | 51.6 | **50.0%** | 2.0 |
| 4 × standard d6 + damage kit | 29.4 | 21.9% | 4.0 |

Half of all activations Double Sigma, and the Act 1 elite dies in two turns.
This confirms the concern flagged in docs/03 — the Stone trivialises early
combat. Its Act 3 wall (PIP frozen at 15) is real, but the player gets a very
long free ride first.

**Recommendation:** drop the Stone's face from 5 to 4 and keep it legendary.
That cuts PIP by 20% and pulls the wall forward into Act 2, where a player still
has shops and Rest nodes to pivot with.

### Not yet measured

The simulator plays **single fights from full HP**, so every row wins 100% —
that number means nothing yet. Attrition across an 18-node run, multi-enemy
encounters, relics, and skill upgrades all arrive in Phase 3, and the run-level
guardrails in §10 can't be checked until then.

---

## 13 — Phase 2 Simulation (Act 1 complete)

Measured on the full Act 1 content: 34 skills, 22 dice, 10 statuses, 12
encounters, 3-phase boss. 300 fights per row. `npm run sim`.

### Act 1 difficulty ladder is correctly shaped ✅

Starting kit (Softening / Cleave / Fumble / Brace), 4 dice:

| Encounter | Win | Turns | Guardrail |
|---|---|---|---|
| Lone NPC | 100% | 1.5 | ≤4 ✅ |
| Sigma Slug | 100% | 1.9 | ✅ |
| Ratio Wraith | 100% | 2.4 | ✅ |
| Doomscroller + NPC | 100% | 3.4 | ✅ |
| Touch Grass Golem | 100% | 2.6 | ✅ |
| The Algorithm (hard) | 98% | 4.6 | ✅ |
| **3-enemy swarm (hard)** | **71%** | **5.3** | the real spike |
| ELITE Mid | 100% | 3.8 | 4–5 target ✅ |
| BOSS Glizzy (5 dice) | 99% | 4.8 | 5–7 target ✅ |

Basic fights clear in 1.5–2.6 turns, hard fights in 3.4–5.3, boss in 4.8. The
multi-enemy swarm at 71% is the first genuine threat in the act, which is
exactly where a difficulty spike belongs.

### Finding F — the defensive lane has no win condition ⚠️

| Loadout | Win | Turns | Damage/turn |
|---|---|---|---|
| 3 defence + Jab vs Mid | **1%** | 40.9 | **0.2** |
| 1 defence + 3 damage vs Mid | 100% | 2.2 | 36.7 |
| 3 defence + Jab vs 3-enemy swarm | 91% | 21.2 | 3.8 |

Two things are happening, and only one is a bug.

**The bug (fixed):** Counterweight retaliated against the *first* attacker each
turn and its charge was never cleared, so on turns where the enemy chose GUARD
or STICKY the charge carried over and compounded. That accumulation was quietly
propping the build up. Counter now hits *every* attacker that turn and clears at
end of turn — better against groups (swarm went 83% → 91%), honest against one.

**The real finding:** a defence-stacked loadout cannot fit a damage skill. With
5 dice, Immovable (3d) + Turtle (2d) consume the whole bag before Jab is
reached, and Mid's 15 Block per turn absorbs the trickle that remains. The
result is a genuine stalemate — 40 turns, 0.2 damage/turn.

This is arguably *correct*: docs/00 makes manipulation the pillar and Tank a
supporting flavour, and one defensive pick alongside three damage skills wins
100% in 2.2 turns. Stacking defence being a trap is a legitimate design
position. But 1% is bad enough to need a deliberate call:

1. **Accept it.** Defence is support, never a win condition. Cheapest, and
   consistent with the stated pillar. *Recommended.*
2. Give the lane a block→damage converter (a "Riposte" skill dealing damage
   equal to Block held). One new skill, opens a real archetype.
3. Make Armor scale with Block so attrition eventually closes fights.

### Finding G — the combo lane cannot reach Double Sigma

| Lane (5 dice, vs Mid) | Win | Dmg/turn | Sigma | Double | Omega |
|---|---|---|---|---|---|
| Damage | 100% | 36.7 | 36.4% | 27.2% | 0% |
| Combo | 100% | 23.0 | **90.7%** | **0.0%** | 0% |
| Manipulation | 100% | 44.6 | 29.2% | **48.8%** | 0% |
| Tank | 1% | 0.2 | 17.4% | 22.8% | 0% |

Combo skills are all 1d and 2d, so the lane structurally tops out at ×1.6 — it
Sigmas on 91% of activations but can never touch the ×2.6 tier. That is a
coherent identity (many small amplified hits rather than one huge one) and the
lane still wins, so I have left it. Worth knowing it is a design consequence
rather than a tuning accident.

**Manipulation leads on damage (44.6/turn) and on Double Sigma (48.8%)** — the
pillar lane is the strongest lane, which is what the design wants.

### Finding H — triple rate misses its guardrail in both directions

§10 targets a 30–40% triple rate. Actual, by loadout:

| Loadout | Double Sigma rate |
|---|---|
| Starting kit (2d-heavy) | **0.0%** |
| Damage kit | 27.2% |
| Manipulation kit | 48.8% |

The guardrail is not a single number — it is a function of how many 3d and 4d
skills the loadout carries. A new player on the starting kit never sees a Double
Sigma at all, which means the freeze-frame and screen-crack effects are content
they may not encounter in their first several fights.

**Recommendation:** put one 3-dice skill in the starting loadout (swap Fumble
for Sigma Slam once the player has 5 dice), so the second tier is reachable
during the tutorial arc rather than after it.

### Finding D still open — bag size still outruns the curve

| Bag (3d+4d kit, base power, vs Mid) | Dmg/turn | Omega rate |
|---|---|---|
| 5 dice | 54.3 | 9.2% |
| 6 dice | 76.6 | 18.1% |
| 8 dice | 115.2 | **36.2%** |

Unchanged from §12 Finding D and still awaiting a decision. At 8 dice, Omega
Sigma fires on more than a third of activations — a tier meant to be a rare
spectacle becomes routine. Bag cap 8 → 7 plus slower dice acquisition remains
the recommendation, and it now blocks Phase 3's reward tables.

---

## 14 — Phase 3 Simulation (the full run)

200 complete runs, greedy AI, all three acts. `npm run sim`.

### Exit criterion met — runs complete start to finish

| Metric | Value |
|---|---|
| Runs won | **38 / 200 (19%)** |
| Died in Act 1 / reached Act 2 / reached Act 3 | 31 / 77 / 92 |
| **Act 1 clear rate** | **85%** |
| Avg nodes cleared | 5.4 |
| Avg final bag | 6.5 dice (cap 7) |
| Avg relics | 2.5 |
| Biggest hit seen | 436 |

Deaths spread across all three bosses and the Act 2 mid-game — The
Maincharacter 27, The Algorithm 23, Glizzy 20, Mogger 19. No single enemy
accounts for more than ~17% of deaths, comfortably inside the §10 guardrail
that no enemy should own 30%.

### Finding I — max HP never grew, and the survivability budget assumed it would

§6 budgets Act 3 around an expected max HP of **85–100**, closing the gap
between 60 base HP and 38–50 incoming damage per turn. Nothing in the
implementation actually granted max HP: only Thick Skin (+8) existed, and it is
one common relic among eighteen. Players were entering Act 3 on roughly 60 HP
against enemies designed for 90.

**Fix:** clearing an act boss grants **+12 max HP**, clearing an elite grants
**+4**. A run that takes both elites per act now arrives at Act 3 around 60 + 24
+ 16 = **100 max HP**, which is what §6 was written around. Full-run wins went
2% → 3% on this change alone, and Act 3 arrivals 14 → 24.

### Finding J — the measurement was AI-bound, not balance-bound

The first full-run pass reported 2%. That number was mostly the simulator's own
incompetence: it left shops without buying, and replaced a *random* loadout slot
on every skill reward, actively destroying its own build.

Teaching it two things a human does automatically — buy the cheapest affordable
relic or die, and replace the lowest-rarity skill rather than a random one —
moved wins from 3% to **19%** and Act 3 arrivals from 24 to 92, with no balance
change whatsoever.

That is worth recording as a methodology note: **when a simulated win rate looks
alarming, check whether the agent is playing the game before changing the
game.** The remaining gap to the §10 target of 30–45% is probably still partly
AI — it never forges, never upgrades at Rest, never buys skills, and picks
events by position rather than by value. I would not tune Act 2 or 3 numbers
until a human has played a dozen runs.

### Bag cap 8 → 7 (Finding D, closed)

Applied. Relics can still raise it: Big Bag +1, The Whole Bag +2. Average final
bag across 200 runs is 6.5, so the cap binds late rather than constantly, which
is the intent — the second half of a run should be about replacement, not
accumulation.
