# 08 — UX, Art Direction & Tone

---

## 1. Screen Layout (Combat)

Portrait-first, 9:16, scaling up to landscape by widening the enemy field. Web prototype targets 420×860 logical pixels.

```
┌─────────────────────────────────┐
│ ♥ 42/60   🛡 12        ⚙  ⏸   │  status bar
├─────────────────────────────────┤
│                                 │
│   [INTENT: SMASH 8]             │
│      ╔═══════╗   ╔═══════╗      │  enemy field
│      ║ WRAITH║   ║  NPC  ║      │
│      ╚═══════╝   ╚═══════╝      │
│      ▓▓▓▓▓░░ 28   ▓▓░░░░ 12     │
│                                 │
├─────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │SOFT│ │CLVE│ │FUMB│ │BRCE│   │  skill slots
│  │2dANY│ │2d≥2│ │1dANY│ │1dANY│   │  (drop targets)
│  │ ▢▢ │ │ ▢▢ │ │ ▢  │ │ ▢  │   │
│  └────┘ └────┘ └────┘ └────┘   │
├─────────────────────────────────┤
│   ⬢6   ⬢5   ⬢5   ⬢2   ⬢1       │  THE TRAY
├─────────────────────────────────┤
│  SLIP ●●●●○○○○○○  4/10          │
│  [NUDGE] [REROLL] [FREEZE]      │  slip verbs
│  [CLONE] [SPLIT]  [SET]         │
├─────────────────────────────────┤
│        ▶  R E S O L V E          │
└─────────────────────────────────┘
```

### Layout principles

**The tray is the center of gravity.** Dice sit at thumb height in the lower third. Everything the player touches most — dice, Slip verbs, Resolve — lives in the bottom 40% of the screen. The top 60% is information.

**Drag up to slot, drag down to unslot.** One gesture, reversible, no menus. Tapping a die also auto-slots it into the leftmost legal slot for fast play.

**Nothing is committed until RESOLVE.** Every slot, every Slip spend, fully reversible. This is essential — the game asks the player to plan a whole turn, and planning requires undo.

---

## 2. The Live Preview — The Most Important UI in the Game

When a die hovers over a slot, the slot shows:

```
┌──────────────┐
│   CLEAVE     │
│  [5] [5]     │
│              │
│  PIP 10      │
│  × 1.0 power │
│  × 1.6 SIGMA │  ← highlighted gold
│  ─────────   │
│    16 DMG    │  ← large
└──────────────┘
```

**Full math, always, before commitment.** The player must never do arithmetic in their head and must never be surprised by a result. Pillar 4 is entirely enforced here.

Additionally: when a die is picked up, **every slot it could legally enter glows**, and every slot it would Sigma in glows *gold*. The player sees their Sigma opportunities without hunting for them. This single affordance is probably worth more to the game's feel than any animation in the next section.

---

## 3. Juice Spec

The game is called Slippy Sigmas. It is not a quiet game. Escalating feedback per Sigma tier:

| Tier | Screen | Audio | Text | Duration |
|---|---|---|---|---|
| No Sigma | Small hit spark | Thud | Damage number, normal | 150ms |
| **SIGMA** | Gold flash, 4px shake | Rising chime + impact | Number 1.4× size, gold | 300ms |
| **DOUBLE SIGMA** | Freeze frame 120ms, screen crack overlay, 10px shake | Bass drop | Number 2.2× size, "DOUBLE SIGMA" banner | 700ms |
| **OMEGA SIGMA** | Full stop, white-out, radial burst, 20px shake, chromatic aberration | Air-horn stack, sub-bass | Number fills screen, "ΩMEGA" banner | 1200ms |

**Rules:**
- Omega Sigma is capped at once per ~3 turns visually — if it fires constantly the spectacle dies. If it triggers again inside the window, play the Double Sigma treatment with Omega numbers.
- **A "skip animations" toggle exists and is respected everywhere.** Some players want speed. The default is loud.
- Dice have physical weight: they tumble on roll (~450ms), snap magnetically into slots, and bounce slightly when rejected from an illegal slot.
- **The rejection bounce is important.** An illegal drop must feel like a physical "no," not a silent nothing.

### The one animation that must be perfect

**The Nudge.** It's the verb the player performs most, and it's the game's core fantasy in miniature. The die should visibly *roll one pip* — a physical quarter-turn, a click of sound, the number tumbling to its neighbour. It should feel like turning a dial with a satisfying detent. If Nudge feels good, the game feels good.

---

## 4. Art Direction

**Style:** slick minimalist with meme-forward writing. Bold flat shapes, thick outlines, heavy particles. **Not pixel art** — pixel art is the crowded convention in this genre (it's exactly what the Dicero reference does), it's slower to produce well, and flat vector-ish shapes read far better on a phone at the small dice sizes this game needs.

**Palette:**
| Role | Colour | Use |
|---|---|---|
| Background | `#12101A` deep purple-black | Everything sits on this |
| Primary | `#F5C518` gold | Sigma, highlights, the payoff colour |
| Danger | `#FF3B5C` hot red | Enemy intents, damage taken |
| Slip | `#4FD1C5` teal | Slip meter, manipulation UI |
| Neutral | `#E8E6F0` off-white | Dice faces, body text |
| Block | `#5B8DEF` blue | Block, armor |

**Gold is reserved exclusively for Sigma.** Nothing else in the game is gold. When the screen goes gold, it means one thing, and the player learns it in ten seconds.

**Dice:** chunky hexagonal-isometric cubes with heavy drop shadows, large readable pip counts (numerals, not pip dots — pip dots are unreadable at 44px and don't scale to d8/d10/Fibonacci). Special dice are distinguished by *material* — Loaded is brass, Cursed is cracked obsidian, Sigma Stone is polished gold marble, Chameleon shifts hue continuously.

**Enemies:** flat silhouettes with a single strong readable shape and one animated element (an eye, a mouth, a floating icon). Expressive over detailed. They should read at 80px.

---

## 5. Tone Bible

Locked decision: **meme-forward, loud.** But specific slang has a half-life measured in months, and this document should still be usable in two years.

### The naming principle

> **Name things after internet *behaviours*, not internet *memes*.**

Behaviours are durable. Memes are not.

| ✅ Durable | ❌ Dates fast |
|---|---|
| Doomscroller | Skibidi Sovereign |
| Reply Guy | Gooner |
| Rage Bait | Ohio |
| The Algorithm | *(any current TikTok reference)* |
| Shadowban | |
| Touch Grass Golem | |
| The Grindset | |
| Mid | |
| NPC | |

The catalogue in [`05-enemy-catalogue.md`](05-enemy-catalogue.md) is ~80% durable names and ~20% of-the-moment ones marked as **swap candidates**. Those can be renamed without touching a single mechanic. My recommendation is to swap them now and keep the humor structural — but the loud tone is your call, and the durable names are already plenty loud.

### Where the humour lives

1. **Enemy names and intent labels.** `NPC` telegraphing `SMASH 7` forever is funnier than any joke text.
2. **Structural callbacks.** NPC returning in Act 3 with 102 HP and the same single intent. The elite literally named *Mid*.
3. **Damage number escalation.** The numbers themselves are the punchline at Omega Sigma.
4. **Death screen one-liners.** One per killer. `"Ratio'd."` · `"You were, in fact, mid."` · `"The Algorithm does not care about your build."`

### Where humour does NOT live

- ❌ Not in tutorials or tooltips. Those are load-bearing and must be clear.
- ❌ Not in numbers, requirements, or intents. The math is never a joke.
- ❌ Not in long text. No walls of comedy writing. Everything is ≤6 words.

**The rule:** the game is funny in its *nouns* and serious in its *verbs*.

---

## 6. Accessibility

Not optional, and cheap to do correctly if designed in now rather than bolted on:

- **Colourblind mode** — Sigma tiers get distinct *shapes and text banners*, not just gold. Enemy intents get icons, never colour alone.
- **Reduce motion** — disables shake, freeze-frames, and chromatic aberration. Keeps flashes and numbers.
- **Skip animations** — resolves combat instantly.
- **Text scaling** — 100% / 125% / 150%.
- **No timers anywhere.** The turn-based design means there is nothing to fail by being slow, which is a large accessibility win the genre gets for free.
- **Full keyboard control** on web: number keys slot dice, letter keys for Slip verbs, Enter to resolve.
- **Minimum touch target 44×44px.** Dice are 56px.

---

## 7. Onboarding

No tutorial screens. The first three fights teach by construction:

| Fight | Enemy | Teaches |
|---|---|---|
| 1 | NPC (12 HP, `SMASH 7`) | Slot dice → deal damage. Unmissable, unloseable. |
| 2 | NPC ×2 | Sigma. Rigged: the first roll contains a guaranteed pair, and both matching dice pulse gold. |
| 3 | Sigma Slug | Slip. The roll is rigged to be one pip off a pair, and the Nudge button pulses. |

**The rigged rolls are the whole tutorial.** No text box ever explains Sigma; the player discovers it because the game hands them a pair and makes it glow. First-run rigging is disabled after run 1.

Tooltips exist on long-press for every skill, die, status, and verb — available always, mandatory never.
