# SLIPPY SIGMAS — Game Design Document

**Version 0.1 — Design Bible**
Status: pre-production. No code yet. All numbers are first-pass and marked for prototype validation.

---

## 1. The One-Liner

> **Roll bad dice. Make them good. Delete everything.**

A turn-based dice roguelite where you never accept the roll you were given. You bend it.

---

## 2. Positioning

Slippy Sigmas is a **turn-based, dice-assignment roguelite** built on a Slay the Spire node-map skeleton. Where Spire gives you a hand of cards, Slippy Sigmas gives you a **bag of dice** — and dice are more interesting than cards for exactly one reason: **cards are what you drew, dice are what you can still change.**

The competitive set (Dicero, Dicey Dungeons, Astrea, Slice & Dice) mostly treats dice as randomized cards. You roll, you play what you got, you cope. That's the gap we're driving into.

**Our thesis:** the fun isn't the roll. The fun is the *fifteen seconds after the roll* where you stare at `[5, 5, 3, 2]`, count your Slip, and realize you can turn that 3 into a 5 and triple-Sigma the boss.

### The two-word design brief

The name is the mechanic. Both halves.

| Word | Mechanic | Fantasy |
|---|---|---|
| **SLIP** | The manipulation resource. Nudge, reroll, clone, and set dice faces. | *I decide what the dice say.* |
| **SIGMA** | The match bonus. Identical faces amplify a skill, escalating hard. | *When they all match, the screen breaks.* |

Every system in this document exists to serve the tension between those two. Slip is the verb, Sigma is the payoff.

---

## 3. Locked Design Decisions

These came out of the design interview and are treated as fixed. Everything downstream is derived from them.

| Decision | Choice | Consequence |
|---|---|---|
| **Dice mechanic** | Dice-to-skill slotting | Player assigns dice to skill slots with requirements. Placement is the decision layer. |
| **Combat** | Turn-based, dice-driven | You roll → you assign → skills resolve → enemy acts. No real-time pressure. |
| **Run shape** | Node map, 10–15 min | 3 acts, branching path, battles/elites/shops/events/bosses. |
| **Match rule** | Slot cost + match bonus | Skills need N dice at minimum face. Identical faces trigger SIGMA amplification. Face value scales damage, matching scales the effect. |
| **Dice source** | Collectible dice as loot | Your dice bag is your build. You find, buy, and forge specific dice. |
| **Enemies** | Telegraphed intents | Enemies show next action. Readable, strategic, no gotchas. |
| **Meta** | Permanent unlocks | Runs unlock dice/skills into the shared pool. No power creep, only variety. |
| **Death** | Lose run, keep unlocks | Classic roguelite. No revives, no checkpoints. |
| **Archetypes** | Manipulation is the pillar | Big Number, Combo, Tank exist — but all route through bending dice. |
| **Tone** | Meme-forward, loud | Internet-culture humor, over-the-top crits, silly enemy names. |
| **Heroes** | One at launch, more as unlocks | Ship with Sig. Vex and Ophi designed and unlockable. |
| **Monetization** | None | Passion/portfolio project. Pacing tuned purely for fun. No ads, no store, no daily friction. |
| **Platform** | Web prototype first | HTML/JS, portrait-friendly layout, portable to mobile later. |

### Design decision worth calling out

You picked **telegraphed intents** over **dice interference** for enemy design. I've implemented that literally — every enemy shows its next action — but a large fraction of those telegraphed actions *are* dice attacks (`LOCK 2 DICE`, `DRAIN 3 SLIP`, `CURSE: 6s become 1s`).

This isn't me overriding the choice. Telegraphing and dice-targeting are orthogonal: you asked for readable, and you get readable. But an enemy whose entire threat is "deals 14 damage" is an enemy from a different game — it interacts with the HP bar, not with the thing that makes Slippy Sigmas *Slippy Sigmas*. Enemies that threaten your dice force you to spend Slip defensively, which is where the interesting decisions live.

If you want pure damage-only enemies, say so and I'll strip the dice-targeting intents out of the catalogue — it's a contained change to [`05-enemy-catalogue.md`](05-enemy-catalogue.md).

---

## 4. Core Loop

### The 8-second loop (one turn)
```
ROLL bag  →  READ enemy intents  →  SPEND Slip to fix the roll  →
SLOT dice into skills  →  RESOLVE  →  enemies act  →  repeat
```

### The 40-second loop (one fight)
```
Enter fight  →  3–5 turns  →  victory  →  reward (die / skill / chips)
```

### The 13-minute loop (one run)
```
Pick hero  →  Act 1 (5 nodes + boss)  →  Act 2  →  Act 3  →  win or die
```

### The forever loop (meta)
```
Run ends  →  bank Chips  →  unlock new dice/skills into the pool  →  next run has new toys
```

---

## 5. The Five Pillars

**1. The roll is a starting position, not a verdict.**
If a player ever feels "I just got unlucky and lost," we failed. Slip is the answer, and Slip is always available. Bad rolls should feel like a *puzzle with a cost*, not a punishment.

**2. Sigma is a spike, not a baseline.**
Naturally rolling a triple is ~10% of turns at 4 dice. It should feel like an event. Manufacturing a triple with Slip should feel like *skill*. If Sigma becomes routine, the ceiling stops being exciting — see the tuning guardrails in [`02-balance-math.md`](02-balance-math.md).

**3. Your bag is your build.**
Skills matter, but the dice are the identity. A bag of `[Loaded, Loaded, Twin, Sigma Stone]` plays completely differently from `[d8, Fibonacci, Chaos, Chaos]`. Dice acquisition is the primary build decision.

**4. Readable in one glance.**
Enemy intents visible. Dice requirements visible. Sigma preview visible *before* you commit. No hidden math, ever. The player should be able to see the exact damage number before releasing the die.

**5. Loud.**
A Double Sigma should shake the screen, freeze the frame, and print an obnoxiously large number. The game is called Slippy Sigmas. It is not a quiet game.

---

## 6. Document Map

| Doc | What's in it |
|---|---|
| [`01-combat-system.md`](01-combat-system.md) | Turn structure, Slip verbs, Sigma tiers, damage formula, status effects |
| [`02-balance-math.md`](02-balance-math.md) | Probability tables, damage curves, HP/threat budgets, tuning guardrails |
| [`03-dice-catalogue.md`](03-dice-catalogue.md) | 22 dice with faces, traits, rarity |
| [`04-skill-catalogue.md`](04-skill-catalogue.md) | 34 skills across four archetype lanes |
| [`05-enemy-catalogue.md`](05-enemy-catalogue.md) | 21 enemies, 6 elites, 3 bosses, full intent tables |
| [`06-run-structure.md`](06-run-structure.md) | Node map generation, act pacing, rewards, events, shops |
| [`07-meta-progression.md`](07-meta-progression.md) | Chips, unlock tree, heroes, ascension |
| [`08-ux-and-art.md`](08-ux-and-art.md) | Screen layout, juice spec, tone bible, naming principles |
| [`09-prototype-roadmap.md`](09-prototype-roadmap.md) | Build order for the web prototype |

---

## 7. Scope Summary — Launch Content

| Category | Count | Notes |
|---|---|---|
| Heroes | 1 playable + 2 unlockable | Sig ships; Vex and Ophi designed |
| Dice | 22 | 6 common, 8 uncommon, 6 rare, 2 legendary |
| Skills | 34 | 12 manipulation, 8 damage, 8 combo, 6 defense |
| Enemies | 21 | 7 per act |
| Elites | 6 | 2 per act |
| Bosses | 3 | 1 per act |
| Events | 14 | Text-and-choice nodes |
| Relics (passive gear) | 18 | See [`07-meta-progression.md`](07-meta-progression.md) |
| Run length | 18 nodes | ~13 min average |

---

## 8. Anti-Goals

Things we are explicitly **not** building. Recorded so scope creep has to argue its way in.

- ❌ **Real-time anything.** No timers, no cooldowns ticking during your think time.
- ❌ **Monetization systems.** No ads, no shop, no energy, no battle pass, no daily login.
- ❌ **Deckbuilding.** Skills are equipped in slots, not drawn from a shuffled deck. Dice are the randomness; adding a second randomness layer makes the game unreadable.
- ❌ **Permanent stat upgrades.** Meta-progression adds *variety*, never raw power. A run 1 player and a run 200 player have the same power ceiling — the veteran just has more paths to it.
- ❌ **Multiplayer, PvP, leaderboards.** Not at launch. Possibly never.
- ❌ **Story mode.** Tone is carried by enemy names and one-liners, not cutscenes.
