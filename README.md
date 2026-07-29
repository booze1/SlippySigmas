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

**Pre-production.** Design bible complete, no code yet.

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

## Next Step

[Phase 1](docs/09-prototype-roadmap.md#phase-1--the-feel-test-highest-priority) — the feel test. Grey boxes, one enemy, twenty turns. The whole design rests on whether spending Slip on a mediocre roll is interesting, and two days of prototyping answers it.
