# 03 — Dice Catalogue

**22 dice.** The bag is the build. Dice are found as rewards, bought in shops, and forged at Rest nodes.

**Bag rules:** start with 4 · hard cap 8 · you may carry more than you can roll only if a relic says so · dice can be sold at shops for 60% value · dice can be removed at shops for gold.

**Reading the table:** `Faces` is the literal face list. `Crown` is the highest face (what a 1-die skill needs to Sigma).

---

## Common (6)

| Die | Faces | Crown | Trait |
|---|---|---|---|
| **Standard d6** | 1,2,3,4,5,6 | 6 | None. The baseline. |
| **Chipped d6** | 1,1,2,3,4,5 | 5 | Cheap filler. Extra `1`s mean extra Slip income. |
| **Flat d4** | 1,2,3,4 | 4 | Low ceiling, but 25% match odds on any given face. |
| **Heavy d6** | 2,2,3,3,4,4 | 4 | Never rolls a 1 or 6. Reliable mid-range, 33% match odds. |
| **Steel d6** | 3,3,3,4,4,4 | 4 | Extremely consistent. Pairs constantly, ceiling is low. |
| **Cracked d6** | 1,2,3,4,5,6 | 6 | Rolls twice on the first turn of each fight, keeps the higher. |

---

## Uncommon (8)

| Die | Faces | Crown | Trait |
|---|---|---|---|
| **Loaded d6** | 3,3,4,4,5,5 | 5 | 33% match odds in the useful range. The workhorse Sigma die. |
| **Twin d6** | 2,2,4,4,6,6 | 6 | Evens only. Enormous match odds, useless for `ODD` requirements. |
| **Odd d6** | 1,1,3,3,5,5 | 5 | Odds only. Pairs with `≥5` skills surprisingly well. |
| **Sharp d8** | 1–8 | 8 | Higher ceiling (avg 4.5), worse matching (12.5%). |
| **Greedy d6** | 1,2,3,4,5,6 | 6 | On a `6`, gain 4 gold. Funds shop builds. |
| **Slick d6** | 1,2,3,4,5,6 | 6 | The first NUDGE on this die each turn is free. |
| **Burning d6** | 1,2,3,4,5,6 | 6 | When slotted into a damage skill, applies Burn equal to its face. |
| **Hollow d6** | 0,0,3,3,6,6 | 6 | Swingy. A `0` still counts for slot *count* requirements and matches other `0`s. |

**Hollow d6** is the sleeper. Two `0`s slotted into a 2-dice skill is PIP 0 × 1.6 = 0 damage — but it *satisfies the slot*, which matters enormously for skills whose real payload is a status effect rather than damage.

---

## Rare (6)

| Die | Faces | Crown | Trait |
|---|---|---|---|
| **Chameleon d6** | 1,2,3,4,5,**W** | W | `W` is WILD: counts as any face for matching, and its PIP equals the highest other die in the same skill. |
| **Fibonacci d6** | 1,2,3,5,8,13 | 13 | Massive ceiling, near-zero natural matching. Built for CLONE and SET. |
| **Mirror d6** | 1,2,3,4,5,6 | 6 | At ROLL, copies the face of the die to its immediate left in the bag. |
| **Echo d6** | 1,2,3,4,5,6 | 6 | When this die is slotted, it stays in the bag — it is not consumed. Can only be used once per turn. |
| **Cursed d6** | 1,1,6,6,6,6 | 6 | Avg 4.33 with 67% odds of a `6`. Each `1` rolled deals 3 damage to you. |
| **Bloated d10** | 1–10 | 10 | Avg 5.5. Enormous PIP, 10% match odds. Ceiling die for CLONE builds. |

**Echo d6** is the strongest rare and probably needs watching — a die that isn't consumed effectively adds a die to the bag every turn. It's restricted to one activation per turn for exactly this reason. **Flag for playtest.**

---

## Legendary (2)

| Die | Faces | Crown | Trait |
|---|---|---|---|
| **Sigma Stone** | 5,5,5,5,5,5 | 5 | Always 5. Never fails, never scales. Max 3 in the run pool. |
| **The Slip** | ?,?,?,?,?,? | any | Rolls a normal 1–6, but you may set its face to anything **once per fight for free**. Also raises Slip cap by 5. |

### Design note on Sigma Stone

Three Sigma Stones guarantees a Double Sigma every turn on any `3d ≥5` skill. That's a legitimate, findable, satisfying build — and it's deliberately a **trap that stops working**. PIP is frozen at 15, so output is capped around 39 damage/turn with a 1.0-power skill. Act 3 needs 100+/turn. The build carries a player brilliantly through Act 1, comfortably through Act 2, and then hits a wall unless they pivot.

That's intentional design, not an oversight: it teaches the game's actual lesson, which is that **consistency and ceiling are a tradeoff you have to re-solve every act.** If playtesting shows players feel cheated rather than taught, the Stone's face drops to 4 and it moves to rare.

---

## Forging (Rest Node)

At a Rest node the player may **forge** one die instead of healing. Forging permanently modifies a die in the bag:

| Forge | Effect | Notes |
|---|---|---|
| **Sharpen** | +1 to every face | Raises ceiling, preserves matching structure |
| **Flatten** | Move the lowest face up to match the second-lowest | Turns `1,2,3,4,5,6` into `2,2,3,4,5,6` — better matching, loses Slip income |
| **Bevel** | Duplicate one face over the lowest face | The direct Sigma-consistency forge |
| **Hollow out** | Remove a face, die becomes one side smaller | Shrinks the distribution; a d6 → d5 |
| **Engrave** | Add a die trait from a small pool | Slick / Burning / Greedy |

Forging is the primary way a player *sculpts* rather than *collects*. Expect 2–4 forges per run.

---

## Acquisition Pacing

| Act | Dice offered | Typical bag size at act end |
|---|---|---|
| 1 | 3–4 | 5 |
| 2 | 3–4 | 6–7 |
| 3 | 2–3 | 7–8 |

Because the bag caps at 8 and a run offers 6–9 dice, **the second half of a run is about replacement, not accumulation.** Choosing what to *cut* becomes the interesting decision, which is why die-removal is a shop service with escalating cost.
