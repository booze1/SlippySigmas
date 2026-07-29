# SLIPPY SIGMAS

> **Roll bad dice. Make them good. Delete everything.**

A turn-based dice roguelite. You never accept the roll you were given — you bend it.

---

## The Pitch

Every fight starts with a roll of your dice bag. Slot those dice into skill slots to fire attacks, block, and status effects. Face value scales your damage. **Matching faces detonate it.**

Two dice showing the same face is a **SIGMA** (×1.6). Three is a **DOUBLE SIGMA** (×2.6). Four is an **OMEGA SIGMA** (×4.2) and the screen stops working properly for a second.

But you'll rarely roll a triple. What you have instead is **SLIP** — a currency that lets you nudge faces up and down, clone dice, freeze them, and reroll. Slip is how you turn a garbage roll into a screen-shaking one, and it's always scarce enough that spending it is a real decision.

**The name is the mechanic.** Slippy = bending the dice. Sigmas = what happens when they match.

---

## Status

**Phase 1 built and playable.** The design bible is complete; the combat core
is implemented and the balance numbers have been validated by simulation.

```bash
npm install
npm run dev     # play the Phase 1 feel test
npm run sim     # run the headless balance probe
```

The feel test is one screen: your dice tray, four skill slots, one enemy, and
the full Slip verb set. The panel on the right lets you swap your bag, loadout
and opponent live — try `3 × Sigma Stone` against `Mid` and watch what
consistency does to a fight.

## Documents

| Doc | Contents |
|---|---|
| [00 — GDD](docs/00-GDD.md) | Master design doc, pillars, locked decisions, scope, anti-goals |
| [01 — Combat System](docs/01-combat-system.md) | Turn structure, Slip verbs, Sigma tiers, damage formula, worked example |
| [02 — Balance Math](docs/02-balance-math.md) | Probability tables, damage curves, HP budgets, tuning guardrails |
| [03 — Dice Catalogue](docs/03-dice-catalogue.md) | 22 dice, faces, traits, forging |
| [04 — Skill Catalogue](docs/04-skill-catalogue.md) | 34 skills across four archetype lanes |
| [05 — Enemy Catalogue](docs/05-enemy-catalogue.md) | 21 enemies, 6 elites, 3 phased bosses |
| [06 — Run Structure](docs/06-run-structure.md) | Node map, act pacing, rewards, 14 events, shops |
| [07 — Meta Progression](docs/07-meta-progression.md) | Chips, unlock tree, 3 heroes, 18 relics, Ascension |
| [08 — UX & Art](docs/08-ux-and-art.md) | Screen layout, juice spec, palette, tone bible, accessibility |
| [09 — Prototype Roadmap](docs/09-prototype-roadmap.md) | Build order, stack, architecture, risks |

---

## Design at a Glance

| | |
|---|---|
| **Genre** | Turn-based dice roguelite |
| **Session** | 12–15 minutes per run |
| **Structure** | 3 acts, 18 nodes, branching map |
| **Combat** | Turn-based, dice-to-skill slotting, telegraphed enemy intents |
| **Build** | Collectible dice — your bag is your build |
| **Meta** | Permanent unlocks, variety only, never raw power |
| **Death** | Lose the run, keep the unlocks |
| **Heroes** | 1 at launch (Sig), 2 unlockable (Vex, Ophi) |
| **Tone** | Meme-forward, loud, funny in its nouns and serious in its verbs |
| **Monetization** | None |
| **Platform** | Web first (TypeScript, no engine), portrait-friendly |

---

## The Five Pillars

1. **The roll is a starting position, not a verdict.** Bad luck is a puzzle with a cost, never a punishment.
2. **Sigma is a spike, not a baseline.** Manufacturing a triple should feel like skill, not routine.
3. **Your bag is your build.** Dice acquisition is the primary strategic decision.
4. **Readable in one glance.** Full math shown before you commit. No hidden numbers, ever.
5. **Loud.** It's called Slippy Sigmas. It is not a quiet game.

---

## What Building It Changed

Three rules changed because the simulator disagreed with the design doc:

| Change | Why |
|---|---|
| Fight-start Slip **0 → 3** | Fights end in 2–3 turns and Slip income arrives at *end* of turn, so the pillar mechanic was dormant through most of a fight |
| Tap-to-slot ranks slots **by value**, not left-to-right | Leftmost-first dumped every die into the weakest skill — the laziest input was the worst play |
| Nudge cost **escalates 1/2/3** | Flat pricing let players manufacture a triple every turn, pushing the natural 9.7% triple rate past 70% |

The hand-derived probability table in [`02-balance-math.md`](docs/02-balance-math.md)
was checked against 200,000 simulated rolls and every figure landed within 0.1
percentage points.

One open decision: **damage scales with bag size much faster than the design
assumed** — eight plain d6 with un-upgraded Act 1 skills already hits the Act 3
boss output target. See §12 Finding D.

## Next Step

Play it for twenty minutes. Everything a simulator can answer has been
answered; whether spending Slip on a mediocre roll is *fun* is a human
judgement, and it decides whether Phase 2 is worth building.
