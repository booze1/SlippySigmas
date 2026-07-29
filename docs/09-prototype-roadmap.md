# 09 — Prototype Roadmap

Build order for the web prototype. **Nothing here is built yet** — this is the plan the GDD hands to implementation.

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

## Phase 1 — The Feel Test (highest priority)

**Goal: prove the core moment is fun before building anything around it.**

One screen. No map, no meta, no art. Grey boxes.

- [ ] Dice tray: roll 4d6, render faces
- [ ] Drag-to-slot with legal/illegal targets
- [ ] 4 skill slots with cost validation
- [ ] PIP calculation and Sigma detection
- [ ] Live damage preview on hover
- [ ] Slip meter, all six verbs with escalating Nudge
- [ ] One enemy with a visible intent, HP, block
- [ ] Resolve → enemy acts → next turn
- [ ] End-of-turn dice→Slip conversion

**Exit criterion: play 20 turns against a dummy. If the Slip→Sigma decision isn't already interesting with grey boxes and no juice, the design is wrong and the rest of this document needs revision.** Everything downstream assumes this test passes.

---

## Phase 2 — Combat Depth

- [ ] All 34 skills implemented and data-driven (JSON)
- [ ] All 22 dice, including special faces and traits
- [ ] Status effects (all 10)
- [ ] Slot-order resolution and combo interactions
- [ ] 7 Act 1 enemies with intent tables and no-repeat rule
- [ ] Multi-enemy encounters and targeting
- [ ] Win/lose states

**Exit criterion:** a full Act 1 encounter set is playable and the four archetype lanes feel distinct.

---

## Phase 3 — The Run

- [ ] Map generator with all node types and the guarantee-validation pass
- [ ] Reward screens with rarity weighting
- [ ] Shop, Rest (heal/forge/upgrade), Treasure
- [ ] 14 events
- [ ] 3 acts of enemies, 6 elites, 3 bosses with phases
- [ ] Gold economy
- [ ] Death and victory screens

**Exit criterion:** a complete 18-node run is playable start to finish.

---

## Phase 4 — Meta

- [ ] Chips, The Bag hub, unlock tree
- [ ] `localStorage` persistence
- [ ] Statistics screen
- [ ] Heroes Vex and Ophi
- [ ] 18 relics
- [ ] Ascension tiers 1–12

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
  data/            # all content as JSON — no content in code
    dice.json  skills.json  enemies.json  relics.json  events.json
  ui/
  sim/             # headless balance simulator
  meta/
```

**All content lives in `data/*.json`.** The catalogues in docs 03/04/05 are written to be transcribed directly into these files. Balance changes should never require touching code.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Core loop isn't fun** | Critical | Phase 1 exists solely to find this out in days, not months |
| Slip trivializes Sigma | High | Escalating Nudge already fixes the analytical case; simulator confirms |
| 4 skill slots too restrictive for Combo | Medium | Test 4 vs 5 base slots in Phase 2 |
| Turn time too long, runs exceed 15 min | Medium | Levers listed in [`06-run-structure.md`](06-run-structure.md) §9 |
| Sigma Stone trivializes Acts 1–2 | Medium | Simulator flags it; fallback is face 5→4 and rarity drop |
| Kingmaker invalidates the manipulation lane | Medium | Change to every-other-turn rather than nerfing the effect |
| Meme names age badly | Low | Naming principle in [`08-ux-and-art.md`](08-ux-and-art.md) §5; swap candidates already marked |
| Scope creep | High | Anti-goals list in [`00-GDD.md`](00-GDD.md) §8 |

---

## What I'd Build First, Concretely

If the answer to "what's the next commit" is needed: **Phase 1, and specifically the tray + slotting + preview**. Not the map, not the art, not the content.

The entire design rests on one unproven assumption — that staring at `[5,5,3,2]` and deciding how to spend 3 Slip is *interesting*. Two days of grey boxes answers that. Everything in these nine documents is downstream of it.
