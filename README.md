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

**Phase 3 built and playable — the complete run.** Three acts, a branching
map, 34 skills, 22 dice, 10 statuses, 21 enemies, 6 elites, 3 phased bosses,
18 relics, 14 events, shops, rests, die forging and skill upgrades. Runs
complete start to finish; 38 of 200 simulated runs won.

### Play it

**On a phone:** open **[`/play.html`](https://booze1.github.io/SlippySigmas/play.html)**
on the deployed site. `play.html` is a committed, self-contained build — one
file, zero external requests — so it works whichever way GitHub Pages is
configured.

Pages has two source modes and they behave very differently here:

| Pages source | What gets served | Result |
|---|---|---|
| **Deploy from a branch** | the repo verbatim | `/` shows the raw dev `index.html`, which points at `/src/main.ts` — unstyled, no game. `/play.html` works. |
| **GitHub Actions** *(recommended)* | `dist/` from the build | `/` and `/play.html` both work. |

Switch it at Settings → Pages → Source → **GitHub Actions**. Until then, use
`/play.html`.

**Locally:**
```bash
npm install
npm run dev       # play the Phase 1 feel test
npm run sim       # run the headless balance probe
npm run artifact  # rebuild play.html — one self-contained file
```

The feel test is one screen: your dice tray, four skill slots, one enemy, and
the full Slip verb set. It is built mobile-first — dice and Slip verbs sit in
the thumb zone, information sits above them. The **Feel-test controls** panel
lets you swap your bag, loadout and opponent live; try `3 × Sigma Stone`
against `Mid` and watch what pure consistency does to a fight.

**How to play:** tap a die to select it, then drag it onto a skill (or just tap
the skill). Legal slots glow **teal**. Slots where a Sigma is still reachable
glow **gold** — that is the whole game in one affordance. Spend Slip on the
verbs to bend a die's face before you commit. When there is more than one
enemy, tap one to target it. Nothing is locked in until you hit RESOLVE.

**The run:** pick a route on the act map — the whole thing is visible before
you commit, edges included. Battles pay skills and gold, elites pay relics and
dice, Rest nodes make you choose between healing, forging a die's faces, and
upgrading a skill forever. Clear an act boss to gain max HP and move on.

**Worth seeing:** Glizzy's third phase halves any hit that is not amplified —
the first moment the game *demands* Sigma rather than rewarding it. The
Algorithm's final phase is a naked roll-off, after a whole run spent learning to
bend dice.

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
