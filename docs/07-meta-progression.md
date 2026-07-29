# 07 — Meta Progression

**Locked principle: meta-progression adds variety, never power.**

A player on run 1 and a player on run 200 have the same power ceiling. The veteran has more *paths* to it, more knowledge, and more toys — but no stat advantage. This is non-negotiable, because the alternative (permanent stat upgrades) means early runs are artificially unwinnable and late runs are artificially trivial, and both feel bad.

---

## 1. Chips

The meta currency. Earned every run, win or lose.

| Source | Chips |
|---|---|
| Per node cleared | 4 |
| Elite defeated | 20 |
| Act 1 boss | 50 |
| Act 2 boss | 80 |
| Act 3 boss (run win) | 150 |
| First-time enemy defeated | 5 |
| New biggest-single-hit record | 25 |

**Expected per run:** losing in Act 1 ≈ 45 · losing in Act 2 ≈ 140 · losing in Act 3 ≈ 260 · full win ≈ 480.

Chips are spent in **The Bag** — the hub screen between runs.

---

## 2. The Unlock Tree

Everything unlocked enters the **shared run pool**: it can now appear as a reward, in shops, and in events. Nothing is equipped from the hub; the run still has to offer it to you.

### Tier 1 — Openers (available from run 1)
| Unlock | Cost |
|---|---|
| Loaded d6 → pool | 60 |
| Haymaker → pool | 60 |
| Jab → pool | 60 |
| Turtle → pool | 60 |
| Twin d6 → pool | 90 |
| Sigma Slam → pool | 90 |

### Tier 2 — Requires 3 runs completed
| Unlock | Cost |
|---|---|
| Sharp d8 → pool | 140 |
| Chain Reaction, Kindle, Overclock → pool | 140 each |
| Slick d6 → pool | 170 |
| **+1 skill slot available via relics** | 200 |

### Tier 3 — Requires reaching Act 3 once
| Unlock | Cost |
|---|---|
| Chameleon d6 → pool | 260 |
| Fibonacci d6, Echo d6 → pool | 260 each |
| Bend the Odds, Death by 1000, Colossal L → pool | 240 each |
| **HERO 2: VEX** | 400 |

### Tier 4 — Requires 1 run win
| Unlock | Cost |
|---|---|
| Sigma Stone → pool | 500 |
| The Slip → pool | 500 |
| The Gambit, Hand of Sig, Delete → pool | 400 each |
| **HERO 3: OPHI** | 700 |
| **Ascension mode** | Free on first win |

**Total tree cost:** ~7,400 Chips ≈ 25–35 runs to fully unlock. At ~13 minutes a run that's roughly 6–8 hours to see all content — the right length for a project of this scope.

### Unlock pacing intent

The first 5 runs should each feel *visibly* different because Tier 1 is cheap and fast. Runs 6–15 slow down and start delivering the mechanically weird dice (Chameleon, Echo), which is where the game's real strategic depth opens up. Runs 16+ are about mastery and Ascension, not acquisition.

---

## 3. Heroes

One playable at launch. Two designed and unlockable. Each hero's identity is expressed as **a different relationship with Slip**, because that's the pillar.

### SIG — *The Fixer* (starting hero)
| | |
|---|---|
| HP | 60 |
| Bag | 4 × Standard d6 |
| Passive | **Steady Hands** — the first NUDGE each turn is free |
| Starting relic | *Warm Hands* — begin each fight with 2 Slip |
| Skills | Softening, Cleave, Fumble, Brace |

The baseline. Generous Slip economy, no gimmicks, teaches the game cleanly.

### VEX — *The Gambler* (400 Chips)
| | |
|---|---|
| HP | 48 |
| Bag | 3 × Standard d6, 1 × Cursed d6 |
| Passive | **Double or Nothing** — REROLL costs 0, but each reroll after the first in a turn deals 2 damage to you |
| Starting relic | *Loaded Deck* — Sigma multipliers +0.4 at every tier |
| Skills | Ratio, Haymaker, Reset Button, Brace |

Low HP, free rerolls, higher Sigma ceiling. Plays fast and violently. Rerolling is the whole character — Vex churns the bag until it obeys, and pays in blood.

### OPHI — *The Architect* (700 Chips)
| | |
|---|---|
| HP | 70 |
| Bag | 5 × Heavy d6 (faces 2,2,3,3,4,4) |
| Passive | **Blueprint** — FREEZE costs 0 and lasts 2 turns |
| Starting relic | *Slow Build* — +0.15 to all SkillPower per turn elapsed in the current fight |
| Skills | Immovable, Grindset, Greased Palms, Softening |

Starts with five consistent low dice and free freezing — builds a perfect hand over 3–4 turns, then detonates. Loses to speed, wins attrition. The anti-Vex.

**Design rationale:** the three heroes map to the three ways you can beat randomness — *correct it* (Sig/Nudge), *reroll past it* (Vex/Reroll), or *lock it down* (Ophi/Freeze). Same pillar, three verbs, three completely different games.

---

## 4. Relics (18)

Passive gear. Found at Elites, Treasures, Bosses, and Shops. No slot limit — relics stack for the whole run.

### Common
| Relic | Effect |
|---|---|
| **Warm Hands** | Start each fight with 2 Slip |
| **Sharp** | +2 damage per hit (applied after Sigma) |
| **Thick Skin** | +8 max HP |
| **Coin Purse** | +25% gold from battles |
| **Spare Die** | Once per fight, reroll one die free |

### Uncommon
| Relic | Effect |
|---|---|
| **Big Bag** | +1 die capacity (max 8 still applies) |
| **Deep Pockets** | Slip cap 10 → 15 |
| **Fifth Slot** | +1 skill slot |
| **Hype Machine** | Gain Hyped 1 whenever you Double Sigma |
| **Second Opinion** | Reward screens offer 4 skills instead of 3 |
| **Steady Grip** | Immune to Jammed |

### Rare
| Relic | Effect |
|---|---|
| **The Multiplier** | Sigma tiers become ×1.8 / ×3.0 / ×4.8 |
| **Sixth Slot** | +1 skill slot (requires Fifth Slot) |
| **Perfect Pair** | The first Sigma each fight counts one tier higher |
| **Momentum** | Unspent dice give 2 Slip instead of 1 |
| **Overflow** | Overkill damage carries to the next enemy |

### Legendary
| Relic | Effect |
|---|---|
| **The Whole Bag** | +2 die capacity, cap raised to 10 |
| **Kingmaker** | At ROLL, one random die is automatically set to match another |

**Kingmaker** guarantees a Sigma pair every single turn, forever. It's the single strongest item in the game and it's legendary for that reason. **Flag for playtest** — if it invalidates the manipulation lane (why spend Slip when the relic does it free?), the fix is to make it trigger every *other* turn rather than nerfing the effect, so it stays exciting when it fires.

---

## 5. Ascension

Unlocked on first run win. 12 tiers, each adding a permanent modifier that stacks with all previous.

| Tier | Modifier |
|---|---|
| 1 | Elites are more common |
| 2 | Enemy HP +10% |
| 3 | Start each run with 1 fewer die |
| 4 | Rest nodes heal 20% instead of 30% |
| 5 | Enemy damage +10% |
| 6 | Shops cost 25% more |
| 7 | Slip cap 10 → 7 |
| 8 | Bosses gain a fourth phase |
| 9 | Enemy HP +10% (cumulative +20%) |
| 10 | Unspent dice give Slip only every other turn |
| 11 | Start each run with a Cursed d6 in your bag |
| 12 | **Omega Sigma multiplier reduced to ×3.0** |

Tier 12 is the cruel one on purpose: it takes away the biggest payoff in the game and forces mastery of consistent mid-tier Sigma instead of jackpot-chasing. It's the final exam for the whole design.

---

## 6. Statistics Screen

Tracked forever and shown in The Bag:

| Stat | Why it's tracked |
|---|---|
| Runs / wins / win rate | Baseline |
| **Biggest single hit** | The screenshot stat. Top billing. |
| Highest Sigma tier achieved | Progress marker |
| Total Slip spent | Measures engagement with the pillar |
| Most-used die / skill | Reveals build convergence for balancing |
| Enemies defeated, by type | Completionism |
| Fastest run win | Speedrun hook |
| Deaths by enemy | Which enemy is the wall |

**Deaths-by-enemy is the balance-critical one.** If one Act 2 enemy accounts for 30% of all deaths, that's not a hard enemy, that's a broken one.

---

## 7. What Is Deliberately Absent

Locked by the no-monetization decision, and worth stating so it stays out:

- ❌ Daily login rewards
- ❌ Energy or run limits
- ❌ Battle pass / seasons
- ❌ Cosmetics economy
- ❌ Ads of any kind
- ❌ Timed events

The player can play 20 runs in a sitting or one run a month. Nothing in the design cares which, and nothing nags.
