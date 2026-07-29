# 06 — Run Structure

**18 nodes · 3 acts · 12–15 minutes.**

---

## 1. Map Shape

Each act is a branching node graph, 6 rows deep, 1–4 nodes wide. The player starts at the bottom, picks a path upward, and the act ends at a single boss node.

```
        [ BOSS ]                 row 6
       /        \
   [ ? ]        [ ? ]            row 5   (always Rest or Treasure)
     |    \    /    |
   [ ? ]   [ ? ]   [ ? ]         row 4
     |  \   |   /   |
   [ ? ]   [ ? ]   [ ? ]         row 3
      \     |     /
       [ ? ]     [ ? ]           row 2
          \     /
           [START]               row 1   (always a Basic Battle)
```

Paths visibly converge and diverge. The player always sees the **entire act map** including node types before committing — routing is a strategic decision made with full information, not a gamble.

## 2. Node Types & Distribution

Per act (rows 1–5, ~9 nodes visited out of ~13 placed):

| Node | Weight | Rule |
|---|---|---|
| **Basic Battle** | 42% | Row 1 is always this |
| **Hard Battle** | 16% | Never in row 1 |
| **Elite** | 12% | Never in rows 1–2. Max 2 per act |
| **Event** | 14% | Never adjacent to another Event on the same path |
| **Shop** | 8% | Exactly 1 per act, guaranteed |
| **Rest** | 6% | Row 5 is always Rest or Treasure |
| **Treasure** | 2% | Max 1 per act |

**Guarantees per act:** ≥1 Shop · ≥1 Rest reachable from every path · ≥2 Elites placed (player chooses whether to take them) · no path with zero Events.

The map generator runs a validation pass and rerolls if any guarantee fails. A player should never be routed into an unwinnable or reward-starved path by generation alone.

---

## 3. Act Pacing

| Act | Nodes | Theme | Teaching goal |
|---|---|---|---|
| **1 — The Feed** | 6 | Learn the verbs | PIP, Sigma, Block, and that dice can be attacked |
| **2 — The Discourse** | 6 | Build identity | Slot order, status stacking, resource defense |
| **3 — The Timeline** | 6 | Execute the build | Everything is a check on a specific decision you made |

**Difficulty curve inside an act:** rows 1–2 are comfortable, rows 3–4 are the real fights, row 5 is recovery, row 6 is the boss. Every act repeats this rhythm so the player learns to read it.

---

## 4. Rewards

Detailed tables in [`02-balance-math.md`](02-balance-math.md) §8. Summary of the *choice* offered at each node:

| Node | Choice presented |
|---|---|
| Basic Battle | Pick 1 of 3 skills · **or** skip for 15 gold |
| Hard Battle | Pick 1 of 3 skills + gold |
| Elite | Relic (no choice) + pick 1 of 2 dice |
| Boss | Relic + pick 1 of 3 dice + 100 gold + 100 Chips |
| Treasure | 1 relic, rare-weighted |
| Rest | Heal 30% · **or** forge a die · **or** upgrade a skill |
| Shop | Buy dice, skills, relics · remove a die |
| Event | Varies |

**The skip-for-gold option matters.** By Act 3 a player with a coherent build should *want* to decline skills, and converting a bad reward into shop currency keeps every node meaningful. Without it, late-run reward screens become "none of these, click through."

### Rest node — the three-way tension

Heal / Forge / Upgrade is the tightest decision in the run:
- **Heal** is survival now.
- **Forge** is bag consistency forever.
- **Upgrade** is damage forever.

Two Rests per act means a player makes this call ~6 times per run and can never take all three. Deliberately no "do both" upgrade exists.

---

## 5. Events (14)

Text-and-choice nodes. Each offers 2–3 options, at least one of which is a real cost. Events are where the game's voice lives.

| Event | Choice |
|---|---|
| **The Dice Goblin** | Trade any 2 dice for 1 random rare die · or leave |
| **Weighted Offer** | Add a Loaded d6 · or gain 60 gold |
| **Touch Grass** | Heal to full, lose 1 die permanently · or leave |
| **The Grind** | Fight an Elite now for double rewards · or leave |
| **Snake Eyes** | Roll a die. On 1–2 lose 15 HP, on 3–4 gain 40 gold, on 5–6 gain a rare die |
| **Sigma Shrine** | All dice permanently gain a duplicate of their lowest face (better matching, lower average) · or leave |
| **The Sharpener** | +1 to all faces on one die, take 12 damage · or leave |
| **Unsubscribe** | Remove any die free · or gain 2 max Slip cap |
| **Cursed Bargain** | Gain a legendary die, take 25 damage and start every fight Cursed 1 · or leave |
| **The Fork** | Duplicate any die in your bag · or duplicate an equipped skill |
| **Ad Break** | Skip the next battle entirely, gain no rewards · or fight it |
| **Loot Box** | Pay 75 gold for a random relic (rare-weighted) · or leave |
| **Reroll Fountain** | Permanently gain +1 Slip at every fight start · or heal 25 |
| **The Mirror** | Swap your two lowest dice for copies of your highest · or leave |

**Design rule:** no event is purely free. Every "gain" is paired with a cost in HP, gold, a die, or an opportunity. Events that are strictly good are just delayed rewards with extra clicks.

---

## 6. Shop

One per act, guaranteed. Inventory is generated fresh:

| Slot | Contents |
|---|---|
| 3 | Dice (act-appropriate rarity weights) |
| 3 | Skills |
| 2 | Relics |
| 1 | **Die removal** — 60 gold, price +15 per use across the whole run |

**Die removal is the most important item in the shop** and it's priced to be scarce. Once the bag is near cap, cutting a bad die is worth more than adding a good one, and the escalating price stops a player from surgically sculpting a perfect 8-die bag by Act 3.

Expected gold across a run is ~380 against ~4–6 affordable purchases. Shops are a planning problem, not a shopping spree.

---

## 7. Run Start

| Setting | Value |
|---|---|
| Hero | Sig (others unlockable) |
| HP | 60 |
| Bag | 4 × Standard d6 |
| Skills | Softening, Cleave, Fumble, Brace |
| Gold | 0 |
| Slip | 0 |
| Relic | 1 starting relic per hero |

---

## 8. Run End

**Death:** run ends immediately. No revives, no checkpoints (locked decision). Death screen shows: act reached, killer, final bag, final loadout, total damage dealt, biggest single hit, Chips earned.

**The biggest-single-hit stat is the retention hook.** It's the number players screenshot, and it's the number that makes them start another run to beat it. It gets top billing on the death screen, above the loss.

**Victory:** clearing Act 3's boss ends the run successfully. Unlocks the next **Ascension** tier (see [`07-meta-progression.md`](07-meta-progression.md)).

---

## 9. Timing Budget

| Segment | Time | × Count | Total |
|---|---|---|---|
| Basic battle | ~28s | 8 | 3m 44s |
| Hard battle | ~40s | 3 | 2m 00s |
| Elite | ~55s | 2 | 1m 50s |
| Boss | ~70s | 3 | 3m 30s |
| Reward screens | ~10s | 16 | 2m 40s |
| Events / Shops / Rests | ~20s | 5 | 1m 40s |
| **Total** | | | **~15m 24s** |

Slightly above the 12–15 minute target. Levers, in the order I'd pull them:
1. Cut reward screen time (auto-advance on pick) → −60s
2. Reduce Act 1 basic battles from 3 to 2 → −56s
3. Faster resolve animations → −45s

All three lands at ~12m 40s. **The animation speed lever is the one to hold in reserve** — it's tempting and it's wrong, because the juice is the reward (see [`08-ux-and-art.md`](08-ux-and-art.md)). Cut screens before you cut spectacle.
