# 05 — Enemy Catalogue

**21 enemies · 6 elites · 3 bosses.** Every enemy telegraphs its next action. No hidden information, ever.

**Intent notation:** `SMASH 8` = deals 8 damage · `GUARD 10` = gains 10 block · `LOCK 2` = jams 2 dice · numbers shown are exact and never change after display.

**No-repeat rule:** no enemy may roll the same non-attack intent twice in a row. This prevents lock-chains that produce unwinnable turns.

---

## ACT 1 — The Feed
*Tutorial territory. Teaches PIP, Sigma, Block, and that dice can be attacked.*

| Enemy | HP | Intents (weight) | Notes |
|---|---|---|---|
| **NPC** | 12 | `SMASH 7` (100) | Does one thing forever. The literal tutorial dummy. |
| **NPC (Deluxe)** | 18 | `SMASH 9` (70), `GUARD 8` (30) | Same thing, occasionally blocks. |
| **Sigma Slug** | 22 | `SMASH 6` (50), `BUFF +3 dmg` (50) | Escalates if ignored. Teaches priority targeting. |
| **Doomscroller** | 26 | `SMASH 5` (40), `SMASH 5 ×2` (40), `DRAIN 2 SLIP` (20) | First enemy to touch your Slip. |
| **Touch Grass Golem** | 34 | `SMASH 11` (60), `GUARD 12` (40) | Big HP, slow. Rewards Brittle. |
| **Ratio Wraith** | 28 | `SMASH 8` (45), `LOCK 2` (35), `SMASH 12` (20) | First real dice attack. Teaches Non-Stick. |
| **The Algorithm** | 30 | `SUMMON NPC` (40), `SMASH 7` (40), `CURSE 1` (20) | Summons chaff. Teaches AoE. |

**Elites**

| Elite | HP | Intents | Gimmick |
|---|---|---|---|
| **Mid** | 64 | `SMASH 13` (40), `GUARD 15` (30), `STICKY` (30) | Named Mid. Is mid. Sticky stops dice→Slip conversion, which starves your economy. |
| **The Grindset** | 72 | `SMASH 10` (50), `BUFF +4 dmg` (50) | Gets stronger every turn it isn't killed. A DPS check. Deals 30+ by turn 5. |

**BOSS — GLIZZY, THE FIRST SIGMA** · HP 110

| Phase | Trigger | Behaviour |
|---|---|---|
| 1 | 110–70 HP | `SMASH 14` (50), `GUARD 18` (30), `LOCK 2` (20) |
| 2 | 69–35 HP | Adds `DOUBLE OR NOTHING`: rolls its own d6. On 4+ deals 24, on 3− deals 6. **The roll is shown before it resolves.** |
| 3 | 34–0 HP | Takes 40% reduced damage from non-Sigma hits. `SMASH 20` (60), `DRAIN 4 SLIP` (40) |

**Why phase 3 works:** it's the first moment the game *demands* Sigma rather than rewarding it. A player who's been ignoring matching hits a wall and has to engage with the pillar mechanic to finish Act 1. That's the entire teaching arc of Act 1 compressed into one health bar.

---

## ACT 2 — The Discourse
*Enemies interact with each other and with your bag. Punishes single-target-only builds.*

| Enemy | HP | Intents (weight) | Notes |
|---|---|---|---|
| **Reply Guy** | 45 | `SMASH 12` (50), `COUNTER` (50) | Counter: reflects 50% of the next hit. Punishes one big swing, rewards Combo lane. |
| **Copypasta** | 52 | `SMASH 14` (60), `CLONE SELF` (40) | Splits into two half-HP copies. Exponential if ignored. |
| **Gooner** | 38 | `DRAIN 3 SLIP` (45), `SMASH 10` (55) | Slip vampire. Starves manipulation builds. |
| **Rage Bait** | 60 | `TAUNT` (40), `SMASH 16` (60) | Taunt forces you to target it. Protects the dangerous thing behind it. |
| **Mogger** | 55 | `SMASH 18` (70), `SMASH 26` (30) | Pure damage. A block check. |
| **Shadowban** | 48 | `CURSE 2` (40), `SMASH 11` (40), `GUARD 14` (20) | Curse halves two dice's faces. Directly attacks PIP. |
| **The Feedback Loop** | 70 | `SMASH 9 ×2` (50), `HEAL ALL 12` (50) | Healer. Kill-priority puzzle. |

**Elites**

| Elite | HP | Intents | Gimmick |
|---|---|---|---|
| **Two-Factor** | 138 | `SMASH 22` (40), `SPLIT GUARD 20` (30), `LOCK 3` (30) | Immune to damage unless hit at least **twice** in one turn. A hard wall for single-big-hit builds. |
| **The Grief** | 145 | `SMASH 24` (50), `SIPHON 8` (25), `JAM ALL` (25) | Jam All jams every die for one turn — you get exactly one turn with nothing but Slip. Survivable, terrifying, always telegraphed a full turn early. |

**BOSS — THE MAINCHARACTER** · HP 220

| Phase | Trigger | Behaviour |
|---|---|---|
| 1 | 220–150 | `SMASH 24` (40), `GUARD 25` (30), `SUMMON Reply Guy` (30) |
| 2 | 149–80 | **Mirrors your bag.** Rolls the same number of dice you have; its damage = its own PIP × 1.2. Shown before resolving. |
| 3 | 79–0 | `SMASH 34` (50), `LOCK 3` (30), `HEAL 25` (20). Heals unless hit by a **Double Sigma** that turn. |

Phase 2 is the design centrepiece of Act 2: the boss plays your own game against you, and a player who stacked high-PIP dice watches the boss benefit from the same math. It reframes "more PIP is always better."

---

## ACT 3 — The Timeline
*Everything is a build check. Assumes 6–7 dice, upgraded skills, and a coherent plan.*

| Enemy | HP | Intents (weight) | Notes |
|---|---|---|---|
| **Brainrot** | 95 | `CURSE 3` (35), `SMASH 22` (45), `SCRAMBLE` (20) | Scramble rerolls your entire bag *after* you've spent Slip. Always telegraphed. |
| **Final Boss Music** | 110 | `SMASH 28` (60), `BUFF ALL +6` (40) | Force multiplier. Kill first, always. |
| **Ohio** | 130 | `SMASH 20 ×2` (50), `GUARD 30` (30), `SUMMON` (20) | Big statline, no tricks. Pace check. |
| **The Lore** | 88 | `SMASH 24` (40), `STACK` (60) | Stack: permanently +5 damage, no cap. Becomes lethal around turn 6. |
| **Skibidi Sovereign** | 120 | `LOCK 3` (30), `SMASH 26` (40), `DRAIN 5 SLIP` (30) | Attacks every resource you have. |
| **NPC (Final Form)** | 102 | `SMASH 30` (100) | Still does one thing. It's just a much bigger thing now. The joke pays off. |
| **Touch Grass Titan** | 128 | `SMASH 25` (40), `GUARD 35` (35), `HEAL 20` (25) | Attrition wall. Rewards Burn/Bleed, which ignore block. |

**Elites**

| Elite | HP | Intents | Gimmick |
|---|---|---|---|
| **The Ratio** | 255 | `SMASH 38` (40), `INVERT` (30), `GUARD 40` (30) | **Invert:** your Sigma multipliers become *divisors* for one turn. Matching actively hurts. The only enemy that punishes the pillar mechanic — and it telegraphs a full turn ahead, so it's a planning problem, not a gotcha. |
| **Cancelled** | 268 | `SMASH 34` (40), `REMOVE DIE` (30), `SMASH 50` (30) | Removes a die from your bag **for the rest of the fight**. Escalating pressure to end it fast. |

**BOSS — THE ALGORITHM (TRUE FORM)** · HP 420

| Phase | Trigger | Behaviour |
|---|---|---|
| 1 | 420–300 | `SMASH 42` (40), `GUARD 45` (30), `SUMMON ×2` (30) |
| 2 | 299–170 | **Adapts.** Each turn it gains 30% resistance to whichever Sigma tier you used most last turn. Forces tier variety. Resistances shown as icons. |
| 3 | 169–60 | `SMASH 55` (40), `JAM ALL` (20), `DRAIN ALL SLIP` (20), `SCRAMBLE` (20) |
| 4 | 59–0 | **Final Roll.** Boss and player each roll their full bag. Highest PIP total deals the difference as damage. Repeats every turn until one dies. Pure showdown, no skills. |

Phase 4 is the game's closing statement: after twenty minutes of learning to bend dice, the last fight is decided by a single naked roll — except by then you have a bag you *built* to win it, and Slip to spend on it. The player who understood the game wins on their own terms. The player who got lucky wins on the boss's terms.

---

## Encounter Composition

| Act | Basic encounter | Hard encounter |
|---|---|---|
| 1 | 1–2 enemies, ~30 total HP | 2–3 enemies, ~65 total HP |
| 2 | 2 enemies, ~95 total HP | 2–4 enemies, ~180 total HP |
| 3 | 2–3 enemies, ~220 total HP | 3–4 enemies, ~380 total HP |

**Composition rules:**
- Never two summoners in one encounter.
- Never two Slip-drainers in one encounter.
- A healer always spawns with at least one tanky body in front of it.
- Act 3 encounters always contain at least one enemy that threatens the bag, so defensive Slip spending stays relevant.

---

## Enemy Design Principles

**1. The intent is a contract.** If it says 14, it deals 14. The only things that change it are player actions (Stagger, kill, block). Breaking this once destroys trust in the whole readout.

**2. Threats target resources, not just HP.** HP, Slip, dice count, and dice faces are four separate health bars. An enemy that only touches the first one is boring in a game about the other three.

**3. Dice attacks always telegraph one full turn ahead.** `JAM ALL`, `SCRAMBLE`, and `INVERT` are devastating and completely fair — the player gets a whole turn to prepare. Devastating-but-fair is the target; devastating-and-surprising is a bug.

**4. The joke should have a payoff.** NPC appears in Act 1 with 12 HP doing 7 damage and in Act 3 with 102 HP doing 30. Same single intent. The humor is structural, not just naming.

---

## Tone Note

The names lean hard into internet-culture humor, per the locked tone decision. **Specific slang dates fast.** The naming principle that keeps this from aging badly is in [`08-ux-and-art.md`](08-ux-and-art.md) §5 — short version: name enemies after *internet behaviours* (Doomscroller, Reply Guy, Rage Bait, The Algorithm, Shadowban), which are durable, rather than after *specific memes*, which are not. A handful of the more of-the-moment names (Skibidi Sovereign, Gooner, Ohio) are marked as **swap candidates** and can be renamed without touching mechanics.
