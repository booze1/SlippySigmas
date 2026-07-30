# 09 — Prototype Roadmap

Build order for the web prototype. **Phase 1 is built and playable** (`npm run dev`); Phases 2–6 are the plan.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | Type safety matters a lot for a rules engine with this many interacting effects |
| Rendering | Canvas 2D or plain DOM + CSS transforms | No engine needed. The game is dice, cards, and numbers. |
| Build | Vite | Fast, zero-config, deploys anywhere static |
| State | Plain reducer, no framework | The game state is a single serializable object — that's a feature, see below |
| Persistence | `localStorage` | Meta-progression only |
| Dependencies | As close to zero as possible | Longevity |

**No game engine.** Unity/Godot buys physics, scene management, and asset pipelines that this game does not need, and costs build weight and iteration speed that it very much does.

### The architectural decision that matters

**Game state is one serializable JSON object, and all rules are pure functions `(state, action) => state`.**

This gets, effectively for free:
- Undo (required — the player must be able to unslot and un-Slip before committing)
- Save/resume mid-run
- Deterministic replay from a seed
- **Headless simulation**, which is the whole ballgame for balancing

Every number in [`02-balance-math.md`](02-balance-math.md) is analytically derived and unvalidated. A headless simulator that plays 100,000 runs with a simple heuristic AI answers "is the triple rate 35%?" in seconds instead of weeks of playtesting. **Build this early, not late** — it's the difference between tuning this game with data and tuning it with vibes.

---

## Phase 1 — The Feel Test ✅ BUILT

**Goal: prove the core moment is fun before building anything around it.**

One screen. No map, no meta, no art. Grey boxes.

- [x] Dice tray: roll 4d6, render faces
- [x] Drag-to-slot with legal/illegal targets (plus tap-to-slot and keyboard)
- [x] 4 skill slots with cost validation
- [x] PIP calculation and Sigma detection
- [x] Live damage preview on hover — legal slots glow teal, Sigma slots glow gold
- [x] Slip meter, all six verbs with escalating Nudge
- [x] Enemy with visible intent, HP, block, Brittle, Burn (6 to choose from)
- [x] Resolve → enemy acts → next turn
- [x] End-of-turn dice→Slip conversion
- [x] **Bonus:** headless balance simulator (pulled forward from Phase 6)
- [x] **Bonus:** in-page feel-test panel — swap bag, loadout and enemy live

**Run it:** `npm install && npm run dev` · **Simulate:** `npm run sim`

### What Phase 1 changed in the design

Three rules changes came out of building and measuring it, all recorded in
[`02-balance-math.md`](02-balance-math.md) §12:

1. **Fight-start Slip 0 → 3.** Fights end too fast for end-of-turn income to
   ever reach the player; the pillar mechanic was dormant.
2. **Tap-to-slot is value-ranked, not leftmost-first.** Leftmost-first made the
   laziest input the worst play.
3. **Assignment order is a real strategic layer.** Filling left-to-right starves
   3d and 4d skills so hard that Double Sigma fired 0.0% of the time.

And one open decision, **Finding D**: damage scales with bag size much faster
than the §5 curve assumed — 8 plain d6 with un-upgraded Act 1 skills already
hits the Act 3 boss output target. Needs a call before Phase 3 sets reward
tables. Recommendation: bag cap 8 → 7, plus slower dice acquisition.

**Exit criterion — still open:** play 20 turns by hand. The build exists and the
numbers check out, but whether the Slip→Sigma decision is *fun* is a human
judgement no simulator can make.

---

## Phase 2 — Combat Depth ✅ BUILT

- [x] All 34 skills implemented and data-driven
- [x] All 22 dice, including special faces and traits (wild, echo, mirror,
      slick, burning, greedy, cracked, cursed, the-slip)
- [x] Status effects — all 10 (burn, brittle, stagger, bleed, mark; hyped,
      slick, jammed, cursed, sticky)
- [x] Slot-order resolution and combo interactions (Chain Reaction scales off
      skills that already fired this turn)
- [x] 7 Act 1 enemies + 2 elites + phased boss, intent tables, no-repeat rule
- [x] Multi-enemy encounters and tap-to-target
- [x] Win/lose states
- [x] **Bonus:** 12 Act 1 encounters, boss phase transitions, GAMBLE intents
      that pre-roll and show the result before resolving

**Exit criterion — met.** All 12 encounters are playable start to finish and the
lanes measure as genuinely distinct (docs/02 §13): manipulation 44.6 dmg/turn
with a 48.8% Double Sigma rate, damage 36.7, combo 23.0 but Sigma-ing on 91% of
activations. The defensive lane is the exception — see Finding F.

### What Phase 2 changed

- **Counterweight** retaliated only against the first attacker each turn and
  never cleared its charge, so it silently compounded across turns where the
  enemy guarded. Now hits every attacker, clears at end of turn.
- Two CSS cascade bugs: `.enemies:has(...)` at specificity (0,3,0) was beating
  `.enemies.many` at (0,2,0) so three enemies laid out in two columns; and
  `.hpbar { flex: 1 }` collapsed to zero height inside the column-flex enemy
  card, making every enemy HP bar invisible.

**Open decisions before Phase 3:** Finding D (bag cap), Finding F (defensive
lane), Finding H (starting loadout has no 3-dice skill, so new players never
see a Double Sigma).

---

## Phase 3 — The Run ✅ BUILT

- [x] Map generator with all node types and the guarantee-validation pass
      (regenerates rather than patching when a guarantee fails)
- [x] Reward screens with per-act rarity weighting
- [x] Shop, Rest (heal / forge / upgrade), Treasure
- [x] 14 events
- [x] 3 acts — 21 enemies, 6 elites, 3 phased bosses, 34 encounters
- [x] Gold economy with escalating die-removal pricing
- [x] Death and victory screens
- [x] **Bonus:** 18 relics, die forging, skill upgrades, SVG route edges on the
      map, and a full-run simulator

**Exit criterion — met.** 38 of 200 simulated runs completed all three acts.
Act 1 clear rate 85%, average 5.4 nodes cleared, average final bag 6.5 of 7.

### What Phase 3 changed

- **Bag cap 8 → 7** (Finding D closed). Relics raise it: Big Bag +1, Whole Bag +2.
- **Max HP now grows** — +12 per boss, +4 per elite. docs/02 §6 budgeted Act 3
  around 85–100 max HP but nothing granted any, so players met Act 3 enemies on
  60 HP. See §14 Finding I.
- **The map draws its edges.** Node types alone do not tell you which routes
  exist, and routing with full information is the point of the screen.

**Methodology note (§14 Finding J):** the first full-run measurement said 2%.
Most of that was the simulator leaving shops without buying and randomly
clobbering its own loadout. Teaching it to shop and to replace its weakest skill
took wins to 19% with no balance change. When a win rate looks alarming, check
the agent before changing the game.

---

## Phase 4 — Meta ✅ BUILT

- [x] Chips, The Bag hub, 25-node unlock tree with four gated tiers
- [x] `localStorage` persistence (best-effort — headless and private-mode safe)
- [x] Statistics screen with deaths-by-killer, dice and skill pick rates
- [x] Heroes Sig, Vex and Ophi, each with a working passive
- [x] 18 relics (landed in Phase 3) + 2 hero-only relics
- [x] Ascension tiers 1–12, all implemented and stacking

**Exit criterion — met.** A fresh save starts in The Bag with one hero and the
base pool; Chips bank on death or victory, unlocks gate correctly by tier, and
progress survives a reload.

### The locked principle, enforced in code

Meta adds **variety, never power**. Unlocks only widen `run.pool` — the set of
dice, skills and relics a run may be *offered*. Nothing is equipped from the
hub, and no unlock raises a number. A fresh account and a fully-unlocked one hit
the same ceiling; the veteran just has more routes to it.

### What Phase 4 changed

- **Hero passives were invisible.** The verb bar inferred "FREE" from the player
  being unable to afford something — a hack that worked when free sources were
  rare. Vex's free REROLL and Ophi's free FREEZE both displayed their normal
  price. `slipCostOf()` now answers the question directly, mirroring the same
  precedence `payFor()` uses, so the label cannot drift from the charge.
- **Multi-word button labels were hand-spaced** (`B E G I N   R U N`), and HTML
  collapses whitespace, so it rendered as `BEGINRUN`. Tracking moved to CSS
  `letter-spacing` + `word-spacing`, where it belongs.
- Freezing became a countdown rather than a flag, so Ophi's Blueprint can hold a
  face across two rolls.

---

## Phase 5 — Feel & Polish

- [ ] Full juice spec ([`08-ux-and-art.md`](08-ux-and-art.md) §3)
- [ ] Art pass: palette, dice materials, enemy silhouettes
- [ ] Audio
- [ ] The three rigged onboarding fights
- [ ] Accessibility: colourblind, reduce-motion, skip-animations, keyboard, text scaling
- [ ] Mobile touch tuning

---

## Phase 6 — Balance

- [ ] Instrumentation ([`02-balance-math.md`](02-balance-math.md) §11)
- [ ] Headless simulator with heuristic AI
- [ ] Run 100k simulated runs, check every guardrail in §10
- [ ] Tune, re-run, repeat
- [ ] Human playtest for the things simulation can't measure: *is it fun, is it readable, is it funny*

---

## Proposed File Layout

```
src/
  engine/          # pure, no DOM, fully testable
    state.ts       # the run/combat state object
    dice.ts        # rolling, faces, traits
    sigma.ts       # match detection, tier multipliers
    slip.ts        # verbs, escalating nudge cost
    skills.ts      # resolution
    status.ts      # effect ticking
    combat.ts      # turn phases
    enemy.ts       # intent selection
    map.ts         # generation + validation
    rng.ts         # seeded, deterministic
  data/            # pure content, no logic
    dice.ts  skills.ts  enemies.ts  (relics, events to come)
  ui/
  sim/             # headless balance simulator
  meta/
```

**All content lives in `src/data/`.** These are typed `const` arrays rather than raw JSON — same data, but a typo in a skill cost becomes a compile error instead of a runtime surprise. They stay trivially JSON-serializable if a data pipeline is ever wanted. The catalogues in docs 03/04/05 transcribe directly into them, and balance changes never require touching engine code.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Core loop isn't fun** | Critical | Phase 1 is built — needs 20 minutes of human hands to answer |
| Slip trivializes Sigma | High | Escalating Nudge holds up; measured Sigma rate 28–68% by loadout, no runaway |
| **Bag size outruns the damage curve** | **High** | **Measured, real. See §12 Finding D — needs a decision before Phase 3** |
| 4 skill slots too restrictive for Combo | Medium | Test 4 vs 5 base slots in Phase 2 |
| Turn time too long, runs exceed 15 min | Medium | Levers listed in [`06-run-structure.md`](06-run-structure.md) §9 |
| Sigma Stone trivializes Acts 1–2 | Medium | Simulator flags it; fallback is face 5→4 and rarity drop |
| Kingmaker invalidates the manipulation lane | Medium | Change to every-other-turn rather than nerfing the effect |
| Meme names age badly | Low | Naming principle in [`08-ux-and-art.md`](08-ux-and-art.md) §5; swap candidates already marked |
| Scope creep | High | Anti-goals list in [`00-GDD.md`](00-GDD.md) §8 |

---

## What's Next, Concretely

Phase 1 answered the questions a simulator can answer. The one it cannot answer
is the one that matters: **play it for twenty minutes.**

If staring at `[5,5,3,2]` with 3 Slip is interesting, Phase 2 is worth building
and everything in these nine documents is worth keeping. If it is not, no
amount of content, art, or juice downstream will rescue it — and finding that
out cost one build instead of six months.

Two decisions are waiting on that verdict:
1. **Finding D** — bag cap and dice acquisition rate (blocks Phase 3 reward tables).
2. **Finding E** — whether Sigma Stone drops to face 4.
