// The rules engine. Every exported action takes a state and returns a NEW
// state — no in-place mutation of the caller's object. That gives undo,
// save/resume, deterministic replay, and headless simulation for free.

import type {
  BagEntry,
  Die,
  Enemy,
  GameState,
  LogEntry,
  SigmaTier,
  SkillEffect,
} from './types.js';
import { Rng } from './rng.js';
import {
  makeDie, makeTempDie, rollDie, facesOf, crownOf, floorOf, isWild,
  hasTrait, resetDieCounter, DICE_DEFS,
} from './dice.js';
import {
  SKILLS, previewSlot, diceInSlot, canSlot, slotValue, skillAt,
  livingEnemies, currentTarget,
} from './skills.js';
import {
  makeEnemy, pickIntent, rollGamble, intentDamage, phaseIndexFor,
  ENEMY_DEFS, ENCOUNTER_DEFS, resetEnemyCounter,
} from './enemy.js';
import { nudgeCost, FLAT_COSTS, type SlipVerb } from './slip.js';
import { decayEnemy, decayPlayer, outgoingMult } from './status.js';
import { ascensionMods } from './meta.js';
import { tierLabel, TIER_RANK, SIGMA_MULT } from './sigma.js';

export const SLOT_COUNT = 4;
export const DEFAULT_LOADOUT = ['softening', 'cleave', 'fumble', 'brace'];
export const DEFAULT_BAG = ['standard_d6', 'standard_d6', 'standard_d6', 'standard_d6'];
/**
 * Bag capacity. Lowered from 8 after simulation showed damage scaling with dice
 * count far faster than the output curve assumed — at 8 dice, Omega Sigma fired
 * on 36% of activations, turning a rare spectacle into routine.
 * See docs/02-balance-math.md §12 Finding D. Relics can raise it.
 */
export const BAG_CAP = 7;

/**
 * Slip carried into turn 1. Was 0 in the first design pass; simulation showed
 * fights end in 2-3 turns while Slip income only arrives at END of turn, so the
 * pillar mechanic was dormant. See docs/02-balance-math.md §12 Finding B.
 */
export const START_SLIP = 3;

function clone(state: GameState): GameState {
  return structuredClone(state);
}

function log(s: GameState, kind: LogEntry['kind'], text: string): void {
  s.log.push({ turn: s.turn, text, kind });
  if (s.log.length > 200) s.log.shift();
}

// ================================================================= setup

export interface NewGameOpts {
  seed?: number;
  bag?: (string | BagEntry)[];
  slots?: number;
  upgrades?: string[];
  slipCapBonus?: number;
  loadout?: (string | null)[];
  encounterKey?: string;
  maxHp?: number;
  startSlip?: number;
  hero?: string;
  ascension?: number;
  hp?: number;
  gold?: number;
  relics?: string[];
  act?: number;
}

export function newGame(opts: NewGameOpts = {}): { state: GameState; rng: Rng } {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = new Rng(seed);
  resetDieCounter();
  resetEnemyCounter();

  const maxHp = opts.maxHp ?? 60;
  const bag = opts.bag ?? DEFAULT_BAG;
  const loadout = opts.loadout ?? DEFAULT_LOADOUT;
  const encounterKey = opts.encounterKey ?? 'a1_wraith';
  const encounter = ENCOUNTER_DEFS[encounterKey];
  if (!encounter) throw new Error(`Unknown encounter: ${encounterKey}`);

  const relics = opts.relics ?? [];
  const asc = ascensionMods(opts.ascension ?? 0);
  const dice = bag.map((k) => makeDie(k, rng));
  // The Slip raises the cap just by being in the bag.
  let slipCap = asc.slipCap + dice.filter((d) => hasTrait(d, 'theslip')).length * 5;
  if (relics.includes('deep_pockets')) slipCap += 5;
  slipCap += opts.slipCapBonus ?? 0;
  const slotCount =
    opts.slots ??
    SLOT_COUNT + (relics.includes('fifth_slot') ? 1 : 0) + (relics.includes('sixth_slot') ? 1 : 0);
  const enemies = encounter.enemies.map((k) => {
    const def = ENEMY_DEFS[k];
    const mult = asc.enemyHpMult * (def?.tier === 'boss' ? asc.bossHpMult : 1);
    return makeEnemy(k, rng, mult);
  });

  const state: GameState = {
    seed,
    turn: 0,
    phase: 'PLAN',
    player: {
      hp: opts.hp ?? maxHp,
      maxHp,
      block: 0,
      blockPersists: false,
      armor: 0,
      slip: (opts.startSlip ?? START_SLIP) + (relics.includes('warm_hands') ? 2 : 0),
      slipCap,
      gold: opts.gold ?? 0,
      hyped: 0,
      slick: 0,
      cursed: 0,
      sticky: false,
      jamImmuneTurns: relics.includes('steady_grip') ? 9999 : 0,
      incomingJam: 0,
      freeNudges: 0,
      freeClones: 0,
      bonusPower: 0,
      counter: 0,
    },
    dice,
    slots: Array.from({ length: slotCount }, (_, i) => ({ skillKey: loadout[i] ?? null })),
    enemies,
    targetId: enemies[0]?.id ?? null,
    encounterKey,
    log: [],
    stats: {
      turns: 0,
      damageDealt: 0,
      damageTaken: 0,
      slipSpent: 0,
      slipGained: 0,
      biggestHit: 0,
      sigmaCounts: { NONE: 0, SIGMA: 0, DOUBLE: 0, OMEGA: 0 },
    },
    extraTurn: false,
    scramblePending: false,
    inverted: false,
    turnPip: 0,
    act: opts.act ?? 1,
    relics,
    upgrades: opts.upgrades ?? [],
    perfectPairReady: relics.includes('perfect_pair'),
    hero: opts.hero ?? 'sig',
    heroNudgeUsed: false,
    rerollsThisTurn: 0,
    ascension: opts.ascension ?? 0,
    omegaOverride: asc.omegaMult,
    slipEveryOtherTurn: asc.slipEveryOtherTurn,
    enemyDmgMult: asc.enemyDmgMult,
  };

  startTurn(state, rng);
  return { state, rng };
}

// ============================================================ turn start

function startTurn(s: GameState, rng: Rng): void {
  s.turn += 1;
  s.stats.turns = s.turn;
  s.extraTurn = false;
  s.player.freeNudges = 0;
  s.player.freeClones = 0;
  s.heroNudgeUsed = false;
  s.rerollsThisTurn = 0;

  // Temp dice (SPLIT, Echo) evaporate.
  s.dice = s.dice.filter((d) => !d.temp);

  for (const die of s.dice) {
    die.slot = null;
    die.nudges = 0;
    die.jammed = false;
    die.usedFreeNudge = false;
    die.echoed = false;
    if ((die.frozenTurns ?? 0) > 0) {
      // Keeps its face through this roll. Ophi freezes for two.
      die.frozenTurns = (die.frozenTurns ?? 0) - 1;
      die.frozen = (die.frozenTurns ?? 0) > 0;
    } else {
      die.frozen = false;
      rollDie(die, rng);
      // Cracked d6 gets two swings at turn 1 and keeps the better one.
      if (s.turn === 1 && hasTrait(die, 'cracked')) {
        const first = die.face;
        rollDie(die, rng);
        if (first > die.face) die.face = first;
      }
    }
  }

  // Mirror copies its left-hand neighbour, so it resolves after everyone rolls.
  for (let i = 0; i < s.dice.length; i++) {
    const die = s.dice[i];
    if (hasTrait(die, 'mirror') && i > 0 && !die.frozen) {
      const left = s.dice[i - 1];
      if (facesOf(die).includes(left.face)) die.face = left.face;
    }
  }

  // Cursed halves the faces of N dice.
  if (s.player.cursed > 0) {
    const victims = rng.shuffle(s.dice.filter((d) => !isWild(d))).slice(0, s.player.cursed);
    for (const die of victims) die.face = Math.ceil(die.face / 2);
    if (victims.length) log(s, 'enemy', `Cursed: ${victims.length} dice halved.`);
  }

  // LOCK jams random dice for exactly one turn.
  if (s.player.incomingJam > 0) {
    if (s.player.jamImmuneTurns > 0) {
      log(s, 'player', 'Non-Stick — jam ignored.');
    } else {
      for (const id of rng.shuffle(s.dice.map((d) => d.id)).slice(0, s.player.incomingJam)) {
        const die = s.dice.find((d) => d.id === id);
        if (die) die.jammed = true;
      }
      log(s, 'enemy', `${s.player.incomingJam} dice jammed.`);
    }
    s.player.incomingJam = 0;
  }

  if (s.scramblePending) {
    for (const die of s.dice) if (!die.frozen) rollDie(die, rng);
    s.scramblePending = false;
    log(s, 'enemy', 'SCRAMBLE — your bag is rerolled.');
  }

  // Kingmaker fires every OTHER turn. Guaranteeing a pair every single turn
  // would invalidate the whole manipulation lane — why spend Slip when a relic
  // does it free? Alternating keeps it exciting when it lands.
  if (s.relics.includes('kingmaker') && s.turn % 2 === 0 && s.dice.length > 1) {
    const pool = s.dice.filter((d) => !isWild(d));
    if (pool.length > 1) {
      const source = rng.pick(pool);
      const targets = pool.filter((d) => d.id !== source.id && facesOf(d).includes(source.face));
      if (targets.length) {
        rng.pick(targets).face = source.face;
        log(s, 'slip', `Kingmaker sets a die to ${source.face}.`);
      }
    }
  }

  // Bad-luck rebate, Cursed d6 bite, Greedy payout.
  let ones = 0;
  for (const die of s.dice) {
    if (die.face === 1) {
      ones += 1;
      if (hasTrait(die, 'cursed')) {
        s.player.hp -= 3;
        s.stats.damageTaken += 3;
        log(s, 'enemy', 'Cursed d6 bites you for 3.');
      }
    }
    if (hasTrait(die, 'greedy') && die.face === crownOf(die)) {
      s.player.gold += 4;
      log(s, 'slip', 'Greedy d6 pays 4 gold.');
    }
  }
  if (ones > 0) {
    gainSlip(s, ones);
    log(s, 'slip', `Rolled ${ones} × 1 → +${ones} Slip (bad-luck rebate).`);
  }

  if (s.player.hp <= 0) s.phase = 'LOSE';
}

function gainSlip(s: GameState, n: number): void {
  const before = s.player.slip;
  s.player.slip = Math.min(s.player.slipCap, s.player.slip + n);
  s.stats.slipGained += s.player.slip - before;
}

// ============================================================== slotting

export function slotDie(state: GameState, dieId: string, slotIndex: number): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || !canSlot(state, probe, slotIndex)) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  die.slot = slotIndex;

  // Echo leaves a one-use copy behind rather than being consumed outright.
  if (hasTrait(die, 'echo') && !die.echoed) {
    die.echoed = true;
    s.dice.push(makeTempDie(die.face, die));
    log(s, 'slip', 'Echo d6 leaves a copy behind.');
  }
  return s;
}

export function unslotDie(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const die = state.dice.find((d) => d.id === dieId);
  if (!die || die.slot === null) return state;
  const s = clone(state);
  s.dice.find((d) => d.id === dieId)!.slot = null;
  return s;
}

export function clearSlots(state: GameState): GameState {
  const s = clone(state);
  for (const d of s.dice) d.slot = null;
  return s;
}

/**
 * Tap-to-slot: drop into the slot where this die is worth the most.
 * Leftmost-legal made the laziest input the worst play — with the starting
 * loadout it dumped every die into Softening (PIP × 0.5).
 */
export function autoSlot(state: GameState, dieId: string): GameState {
  const die = state.dice.find((d) => d.id === dieId);
  if (!die) return state;

  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < state.slots.length; i++) {
    if (!canSlot(state, die, i)) continue;
    const score = projectedSlotValue(state, i, die);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex >= 0 ? slotDie(state, dieId, bestIndex) : state;
}

/**
 * What this slot is worth if the die goes in AND the slot eventually fills.
 * Scoring it as-is biases 1-die skills, because a 2-die skill holding one die
 * previews as zero. Returns -Infinity when the slot cannot be completed.
 */
function projectedSlotValue(state: GameState, slotIndex: number, die: Die): number {
  const skill = skillAt(state, slotIndex);
  if (!skill) return -Infinity;

  const filled = diceInSlot(state, slotIndex).length;
  const need = skill.cost.count - filled - 1;
  if (need < 0) return -Infinity;

  const spare = state.dice.filter(
    (d) => d.id !== die.id && d.slot === null && canSlot(state, d, slotIndex),
  ).length;
  if (spare < need) return -Infinity;

  const probe = structuredClone(state);
  const real = probe.dice.find((d) => d.id === die.id)!;
  real.slot = slotIndex;
  for (let k = 0; k < need; k++) {
    probe.dice.push({ ...real, id: `phantom${k}`, slot: slotIndex });
  }
  return slotValue(previewSlot(probe, slotIndex));
}

export function setSlotSkill(state: GameState, slotIndex: number, skillKey: string | null): GameState {
  const s = clone(state);
  s.slots[slotIndex] = { skillKey };
  for (const d of s.dice) if (d.slot === slotIndex) d.slot = null;
  return s;
}

export function setTarget(state: GameState, enemyId: string): GameState {
  const enemy = state.enemies.find((e) => e.id === enemyId);
  if (!enemy || enemy.hp <= 0) return state;
  const s = clone(state);
  s.targetId = enemyId;
  return s;
}

// ============================================================ slip verbs

/**
 * Pay for a Slip verb. Free sources are consumed before real Slip: the Slick
 * d6's per-turn freebie, Greased Palms' free nudges, then Slick status.
 */
function payFor(s: GameState, verb: SlipVerb, cost: number, die?: Die): boolean {
  // Hero passives come first — they are the character, not a discount.
  if (verb === 'NUDGE' && s.hero === 'sig' && !s.heroNudgeUsed) {
    s.heroNudgeUsed = true;
    return true;
  }
  if (verb === 'REROLL' && s.hero === 'vex') {
    // Free, but every reroll after the first each turn is paid in blood.
    if (s.rerollsThisTurn > 0) {
      s.player.hp -= 2;
      s.stats.damageTaken += 2;
      log(s, 'enemy', 'Double or Nothing — 2 HP for the reroll.');
    }
    s.rerollsThisTurn += 1;
    return true;
  }
  if (verb === 'FREEZE' && s.hero === 'ophi') return true;
  if (verb === 'NUDGE' && die && hasTrait(die, 'slick') && !die.usedFreeNudge) {
    die.usedFreeNudge = true;
    return true;
  }
  if (verb === 'NUDGE' && s.player.freeNudges > 0) {
    s.player.freeNudges -= 1;
    return true;
  }
  if (verb === 'CLONE' && s.player.freeClones > 0) {
    s.player.freeClones -= 1;
    return true;
  }
  if (verb === 'SET' && die && hasTrait(die, 'theslip') && !die.usedFreeSet) {
    die.usedFreeSet = true;
    return true;
  }
  if (s.player.slick > 0) {
    s.player.slick -= 1;
    return true;
  }
  if (s.player.slip < cost) return false;
  s.player.slip -= cost;
  s.stats.slipSpent += cost;
  return true;
}

/**
 * What this verb will actually cost in Slip right now, counting every free
 * source in the same precedence payFor uses. The UI previously inferred "free"
 * from unaffordability, which hid Vex's free REROLL and Ophi's free FREEZE
 * behind their normal price — the hero passive was invisible.
 */
export function slipCostOf(state: GameState, verb: SlipVerb, die?: Die): number {
  if (verb === 'NUDGE' && state.hero === 'sig' && !state.heroNudgeUsed) return 0;
  if (verb === 'REROLL' && state.hero === 'vex') return 0;
  if (verb === 'FREEZE' && state.hero === 'ophi') return 0;
  if (verb === 'NUDGE' && die && hasTrait(die, 'slick') && !die.usedFreeNudge) return 0;
  if (verb === 'NUDGE' && state.player.freeNudges > 0) return 0;
  if (verb === 'CLONE' && state.player.freeClones > 0) return 0;
  if (verb === 'SET' && die && hasTrait(die, 'theslip') && !die.usedFreeSet) return 0;
  if (state.player.slick > 0) return 0;
  return verb === 'NUDGE' ? (die ? nudgeCost(die) : 1) : FLAT_COSTS[verb];
}

/** Can the player afford this verb right now, counting all free sources? */
export function canAfford(state: GameState, verb: SlipVerb, die?: Die): boolean {
  if (verb === 'NUDGE' && state.hero === 'sig' && !state.heroNudgeUsed) return true;
  if (verb === 'REROLL' && state.hero === 'vex') return true;
  if (verb === 'FREEZE' && state.hero === 'ophi') return true;
  if (verb === 'NUDGE' && die && hasTrait(die, 'slick') && !die.usedFreeNudge) return true;
  if (verb === 'NUDGE' && state.player.freeNudges > 0) return true;
  if (verb === 'CLONE' && state.player.freeClones > 0) return true;
  if (verb === 'SET' && die && hasTrait(die, 'theslip') && !die.usedFreeSet) return true;
  if (state.player.slick > 0) return true;
  const cost = verb === 'NUDGE' ? (die ? nudgeCost(die) : 1) : FLAT_COSTS[verb];
  return state.player.slip >= cost;
}

export function nudge(state: GameState, dieId: string, delta: 1 | -1): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || probe.temp || isWild(probe)) return state;
  const target = probe.face + delta;
  if (target < floorOf(probe) || target > crownOf(probe)) return state;
  if (!canAfford(state, 'NUDGE', probe)) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  const cost = nudgeCost(die);
  if (!payFor(s, 'NUDGE', cost, die)) return state;
  die.face = target;
  die.nudges += 1;
  log(s, 'slip', `Nudge → ${die.face}.`);
  return validateSlots(s);
}

export function reroll(state: GameState, dieId: string, rng: Rng): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || !canAfford(state, 'REROLL')) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  if (!payFor(s, 'REROLL', FLAT_COSTS.REROLL)) return state;
  rollDie(die, rng);
  log(s, 'slip', `Reroll → ${isWild(die) ? 'WILD' : die.face}.`);
  return validateSlots(s);
}

export function freeze(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.frozen || probe.temp || !canAfford(state, 'FREEZE')) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  if (!payFor(s, 'FREEZE', FLAT_COSTS.FREEZE)) return state;
  die.frozen = true;
  die.frozenTurns = s.hero === 'ophi' ? 2 : 1;
  log(s, 'slip', `Froze a ${die.face}${s.hero === 'ophi' ? ' for 2 turns' : ''}.`);
  return s;
}

export function cloneFace(state: GameState, fromId: string, toId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  if (fromId === toId) return state;
  const from = state.dice.find((d) => d.id === fromId);
  const to = state.dice.find((d) => d.id === toId);
  if (!from || !to || to.jammed || isWild(from)) return state;
  if (!facesOf(to).includes(from.face)) return state;
  if (!canAfford(state, 'CLONE')) return state;

  const s = clone(state);
  const target = s.dice.find((d) => d.id === toId)!;
  if (!payFor(s, 'CLONE', FLAT_COSTS.CLONE)) return state;
  target.face = from.face;
  log(s, 'slip', `Cloned a ${from.face}.`);
  return validateSlots(s);
}

export function setFace(state: GameState, dieId: string, face: number): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || !facesOf(probe).includes(face)) return state;
  if (!canAfford(state, 'SET', probe)) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  if (!payFor(s, 'SET', FLAT_COSTS.SET, die)) return state;
  die.face = face;
  log(s, 'slip', `Set to ${face === -1 ? 'WILD' : face}.`);
  return validateSlots(s);
}

export function split(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || probe.face < 4 || !canAfford(state, 'SPLIT')) return state;

  const s = clone(state);
  const idx = s.dice.findIndex((d) => d.id === dieId);
  const die = s.dice[idx];
  if (!payFor(s, 'SPLIT', FLAT_COSTS.SPLIT)) return state;
  const a = Math.floor(die.face / 2);
  const b = die.face - a;
  s.dice.splice(idx, 1, makeTempDie(a, die), makeTempDie(b, die));
  log(s, 'slip', `Split ${die.face} → ${a} + ${b}.`);
  return s;
}

/** After a face change, eject dice that no longer satisfy their slot. */
function validateSlots(s: GameState): GameState {
  for (const die of s.dice) {
    if (die.slot === null) continue;
    const skill = skillAt(s, die.slot);
    if (!skill) {
      die.slot = null;
      continue;
    }
    const c = skill.cost;
    const ok =
      isWild(die) ||
      ((c.exact === undefined || die.face === c.exact) &&
        (c.min === undefined || die.face >= c.min) &&
        (c.max === undefined || die.face <= c.max) &&
        (c.parity !== 'EVEN' || die.face % 2 === 0) &&
        (c.parity !== 'ODD' || die.face % 2 === 1));
    if (!ok) die.slot = null;
  }
  return s;
}

// ================================================================ damage

function dealToEnemy(
  s: GameState,
  enemy: Enemy,
  amount: number,
  opts: { ignoreBlock?: boolean; isHit?: boolean } = {},
): void {
  if (amount <= 0 || enemy.hp <= 0) return;
  let remaining = amount;
  if (!opts.ignoreBlock) {
    const absorbed = Math.min(enemy.block, remaining);
    enemy.block -= absorbed;
    remaining -= absorbed;
  }
  enemy.hp -= remaining;
  s.stats.damageDealt += remaining;
  if (amount > s.stats.biggestHit) s.stats.biggestHit = amount;

  if (enemy.counter > 0 && opts.isHit !== false) {
    const back = Math.floor(amount * enemy.counter);
    if (back > 0) {
      s.player.hp -= Math.max(0, back - s.player.armor);
      s.stats.damageTaken += Math.max(0, back - s.player.armor);
      log(s, 'enemy', `${enemy.name} reflects ${back}.`);
    }
    enemy.counter = 0;
  }

  // Bleed triggers per hit, which is what makes Death by 1000 a Bleed engine.
  if (opts.isHit !== false && enemy.bleed > 0 && enemy.hp > 0) {
    enemy.hp -= enemy.bleed;
    s.stats.damageDealt += enemy.bleed;
  }

  const def = ENEMY_DEFS[enemy.defKey];
  if (def) {
    const next = phaseIndexFor(def, enemy.hp, enemy.maxHp);
    if (next !== enemy.phase) {
      enemy.phase = next;
      log(s, 'system', `${enemy.name} — ${def.phases?.[next]?.note ?? `phase ${next + 1}`}.`);
    }
  }
}

function dealToPlayer(s: GameState, amount: number, attacker?: Enemy): void {
  if (amount <= 0) return;
  let remaining = amount;
  const absorbed = Math.min(s.player.block, remaining);
  s.player.block -= absorbed;
  remaining -= absorbed;
  remaining = Math.max(0, remaining - s.player.armor);
  s.player.hp -= remaining;
  s.stats.damageTaken += remaining;

  if (s.player.counter > 0 && attacker) {
    dealToEnemy(s, attacker, s.player.counter, { isHit: false });
    log(s, 'player', `Counterweight hits back for ${s.player.counter}.`);
  }
}

// =============================================================== resolve

export interface ResolveEvent {
  slotIndex: number;
  skillName: string;
  tier: SigmaTier;
  damage: number;
}

export interface ResolveResult {
  state: GameState;
  events: ResolveEvent[];
}

/** Effects that mutate the bag and must run before the slot is scored. */
function applyPreEffects(s: GameState, slotIndex: number, effects: SkillEffect[], rng: Rng): void {
  for (const eff of effects) {
    if (eff.type === 'rerollSlotted') {
      for (const die of s.dice.filter((d) => d.slot === slotIndex)) rollDie(die, rng);
    }
    if (eff.type === 'setSlottedToHighest') {
      const slotted = s.dice.filter((d) => d.slot === slotIndex);
      if (slotted.length) {
        const top = Math.max(...slotted.map((d) => d.face)) + (eff.bonus ?? 0);
        for (const die of slotted) {
          die.face = top;
          die.faces = [top];
        }
      }
    }
  }
}

function applyPostEffects(s: GameState, effects: SkillEffect[], isSigma: boolean, rng: Rng): void {
  for (const eff of effects) {
    switch (eff.type) {
      case 'rerollBag': {
        for (const die of s.dice.filter((d) => d.slot === null && !d.frozen)) rollDie(die, rng);
        if (isSigma && eff.freezeHighestOnSigma) {
          const loose = s.dice.filter((d) => d.slot === null);
          const best = loose.sort((a, b) => b.face - a.face)[0];
          if (best) best.frozen = true;
        }
        break;
      }
      case 'setAllBag':
        for (const die of s.dice) {
          if (facesOf(die).includes(eff.face)) die.face = eff.face;
        }
        break;
      case 'freeNudge':
        s.player.freeNudges += isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount;
        break;
      case 'freeClone':
        s.player.freeClones += isSigma ? (eff.sigmaTimes ?? eff.times) : eff.times;
        break;
      case 'powerGain':
        s.player.bonusPower += isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount;
        break;
      case 'immuneJam':
        s.player.jamImmuneTurns = Math.max(
          s.player.jamImmuneTurns,
          isSigma ? (eff.sigmaTurns ?? eff.turns) : eff.turns,
        );
        break;
      default:
        break;
    }
  }
}

export function resolveTurn(state: GameState, rng: Rng): ResolveResult {
  if (state.phase !== 'PLAN') return { state, events: [] };

  const s = clone(state);
  const events: ResolveEvent[] = [];
  s.turnPip = 0;

  // ---------------------------------------------------- player skills
  for (let i = 0; i < s.slots.length; i++) {
    const skill = skillAt(s, i);
    if (!skill) continue;
    if (diceInSlot(s, i).length !== skill.cost.count) continue;

    applyPreEffects(s, i, skill.effects, rng);

    const p = previewSlot(s, i);
    if (!p.ready) continue;

    const isSigma = p.tier !== 'NONE';
    s.stats.sigmaCounts[p.tier] += 1;
    s.turnPip += p.pip;

    const target = currentTarget(s);
    const alive = livingEnemies(s);

    if (p.damage > 0 && target) {
      const perHit = Math.round(p.damage / Math.max(1, p.hits));
      for (let h = 0; h < Math.max(1, p.hits); h++) {
        dealToEnemy(s, target, perHit, {
          ignoreBlock: skill.effects.some((e) => e.type === 'damage' && e.ignoreBlock),
        });
      }
      if (target.mark) target.mark = false;
    }
    if (p.aoe > 0) {
      for (const e of alive) dealToEnemy(s, e, p.aoe);
    }
    if (p.block > 0) {
      s.player.block += p.block;
      if (skill.effects.some((e) => e.type === 'block' && e.persist)) s.player.blockPersists = true;
    }
    if (p.heal > 0) s.player.hp = Math.min(s.player.maxHp, s.player.hp + p.heal);
    if (p.armor > 0) s.player.armor = Math.min(6, s.player.armor + p.armor);
    if (p.slip > 0) gainSlip(s, p.slip);

    // Statuses onto enemies.
    for (const st of p.statuses) {
      const all = st.key.endsWith('(all)');
      const key = st.key.replace(' (all)', '');
      for (const e of all ? alive : target ? [target] : []) {
        if (key === 'burn') e.burn += st.amount;
        if (key === 'brittle') e.brittle += st.amount;
        if (key === 'stagger') e.stagger += st.amount;
        if (key === 'bleed') e.bleed += st.amount;
        if (key === 'mark') e.mark = true;
      }
    }
    for (const st of p.selfStatuses) {
      if (st.key === 'hyped') s.player.hyped = Math.min(4, s.player.hyped + st.amount);
      if (st.key === 'slick') s.player.slick += st.amount;
    }

    // Counterweight arms off the block it just granted.
    const counterEff = skill.effects.find((e) => e.type === 'counter');
    if (counterEff && counterEff.type === 'counter') {
      const m = isSigma ? (counterEff.sigmaMult ?? counterEff.mult) : counterEff.mult;
      s.player.counter += Math.floor(p.block * m);
    }

    // Loaded Question spends the bank unless it Sigma'd.
    const perSlip = skill.effects.find((e) => e.type === 'damagePerSlip');
    if (perSlip && perSlip.type === 'damagePerSlip' && !(isSigma && perSlip.keepOnSigma)) {
      s.player.slip = 0;
    }

    applyPostEffects(s, skill.effects, isSigma, rng);

    if (s.relics.includes('hype_machine') && (p.tier === 'DOUBLE' || p.tier === 'OMEGA')) {
      s.player.hyped = Math.min(4, s.player.hyped + 1);
    }
    if (s.perfectPairReady && isSigma) s.perfectPairReady = false;
    if (skill.effects.some((e) => e.type === 'oncePerFight')) s.slots[i].spent = true;

    // Delete: a kill refunds the turn.
    if (skill.effects.some((e) => e.type === 'extraTurnOnKill') && target && target.hp <= 0) {
      s.extraTurn = true;
    }

    const bits: string[] = [];
    if (p.damage) bits.push(`${p.damage} dmg`);
    if (p.aoe) bits.push(`${p.aoe} to all`);
    if (p.block) bits.push(`${p.block} block`);
    if (p.heal) bits.push(`heal ${p.heal}`);
    if (p.slip) bits.push(`+${p.slip} Slip`);
    for (const st of p.statuses) bits.push(`${st.key} ${st.amount}`);
    log(
      s,
      isSigma ? 'sigma' : 'player',
      `${skill.name}${isSigma ? ` — ${tierLabel(p.tier)}` : ''}: ${bits.join(', ') || 'no effect'}`,
    );

    events.push({ slotIndex: i, skillName: skill.name, tier: p.tier, damage: p.damage + p.aoe });

    if (livingEnemies(s).length === 0) break;
  }

  // Retarget if the target died.
  if (!livingEnemies(s).some((e) => e.id === s.targetId)) {
    s.targetId = livingEnemies(s)[0]?.id ?? null;
  }

  if (livingEnemies(s).length === 0) {
    s.phase = 'WIN';
    log(s, 'system', 'Encounter cleared.');
    return { state: s, events };
  }

  // ------------------------------------------------------- burn ticks
  for (const e of livingEnemies(s)) {
    if (e.burn > 0) {
      e.hp -= e.burn;
      s.stats.damageDealt += e.burn;
      log(s, 'player', `${e.name} burns for ${e.burn}.`);
      e.burn = Math.floor(e.burn / 2);
    }
  }
  if (livingEnemies(s).length === 0) {
    s.phase = 'WIN';
    log(s, 'system', 'Burned down.');
    return { state: s, events };
  }

  // ------------------------------------------------------- enemy phase
  if (s.extraTurn) {
    log(s, 'system', 'DELETE — extra turn.');
  } else {
    for (const enemy of livingEnemies(s)) {
      const def = ENEMY_DEFS[enemy.defKey];
      const intent = enemy.intent;
      const stagMult = outgoingMult(enemy);

      switch (intent.kind) {
        case 'SMASH':
        case 'GAMBLE': {
          const base = intentDamage(enemy);
          const hits = intent.hits ?? 1;
          const dmg = Math.floor(base * stagMult * s.enemyDmgMult);
          for (let h = 0; h < hits; h++) dealToPlayer(s, dmg, enemy);
          log(s, 'enemy', `${enemy.name} hits for ${dmg}${hits > 1 ? ` ×${hits}` : ''}.`);
          break;
        }
        case 'GUARD':
          enemy.block += intent.value;
          log(s, 'enemy', `${enemy.name} guards ${intent.value}.`);
          break;
        case 'LOCK':
          s.player.incomingJam += intent.value;
          log(s, 'enemy', `${enemy.name} will jam ${intent.value} dice.`);
          break;
        case 'BUFF':
          enemy.buff += intent.value;
          log(s, 'enemy', `${enemy.name} powers up (+${intent.value}).`);
          break;
        case 'DRAIN': {
          const drained = Math.min(s.player.slip, intent.value);
          s.player.slip -= drained;
          log(s, 'enemy', `${enemy.name} drains ${drained} Slip.`);
          break;
        }
        case 'SUMMON': {
          if (s.enemies.length < 5 && intent.summonKey) {
            s.enemies.push(makeEnemy(intent.summonKey, rng));
            log(s, 'enemy', `${enemy.name} summons reinforcements.`);
          }
          break;
        }
        case 'CURSE':
          s.player.cursed += intent.value;
          log(s, 'enemy', `${enemy.name} curses ${intent.value} dice.`);
          break;
        case 'STICKY':
          if (s.player.jamImmuneTurns > 0) {
            log(s, 'player', 'Non-Stick — sticky ignored.');
          } else {
            s.player.sticky = true;
            log(s, 'enemy', `${enemy.name} makes your dice sticky.`);
          }
          break;
        case 'HEAL': {
          for (const e of livingEnemies(s)) e.hp = Math.min(e.maxHp, e.hp + intent.value);
          log(s, 'enemy', `${enemy.name} heals the group ${intent.value}.`);
          break;
        }
        case 'COUNTER':
          enemy.counter = intent.value / 100;
          log(s, 'enemy', `${enemy.name} braces to reflect ${intent.value}%.`);
          break;
        case 'CLONE_SELF': {
          if (s.enemies.length < 5) {
            const half = Math.max(1, Math.ceil(enemy.hp / 2));
            enemy.hp = half;
            enemy.maxHp = half;
            const copy = makeEnemy(enemy.defKey, rng);
            copy.hp = half;
            copy.maxHp = half;
            s.enemies.push(copy);
            log(s, 'enemy', `${enemy.name} splits in two.`);
          }
          break;
        }
        case 'TAUNT':
          for (const e of s.enemies) e.taunting = false;
          enemy.taunting = true;
          s.targetId = enemy.id;
          log(s, 'enemy', `${enemy.name} taunts — you must hit it.`);
          break;
        case 'SCRAMBLE':
          s.scramblePending = true;
          log(s, 'enemy', `${enemy.name} will scramble your bag.`);
          break;
        case 'INVERT':
          s.inverted = true;
          log(s, 'enemy', `${enemy.name} INVERTS — matching will hurt you next turn.`);
          break;
        case 'REMOVE_DIE': {
          const victims = s.dice.filter((d) => !d.temp);
          if (victims.length > 1) {
            const gone = rng.pick(victims);
            s.dice = s.dice.filter((d) => d.id !== gone.id);
            log(s, 'enemy', `${enemy.name} takes a die for the rest of the fight.`);
          }
          break;
        }
        case 'FINAL_ROLL': {
          // Boss and player each put up a number; the difference is the damage.
          // After a whole run learning to bend dice, the last fight is a naked
          // roll — but by then you built the bag that wins it.
          const bossRoll = (enemy.gambleRoll ?? 1) * Math.max(1, s.dice.length) * 2;
          const diff = bossRoll - s.turnPip;
          if (diff > 0) {
            dealToPlayer(s, diff, enemy);
            log(s, 'enemy', `FINAL ROLL — ${bossRoll} vs your ${s.turnPip}: you take ${diff}.`);
          } else {
            dealToEnemy(s, enemy, -diff, { isHit: false });
            log(s, 'player', `FINAL ROLL — ${bossRoll} vs your ${s.turnPip}: it takes ${-diff}.`);
          }
          break;
        }
      }

      if (stagMult < 1) enemy.stagger = Math.max(0, enemy.stagger - 1);
      enemy.lastIntentKind = intent.kind;
      if (def) {
        enemy.intent = pickIntent(def, rng, intent.kind, enemy.phase);
        rollGamble(enemy, rng);
      }
      if (s.player.hp <= 0) break;
    }
  }

  // --------------------------------------------------------- end of turn
  const slipTurnOk = !s.slipEveryOtherTurn || s.turn % 2 === 1;
  if (!s.player.sticky && slipTurnOk) {
    const per = s.relics.includes('momentum') ? 2 : 1;
    const unspent = s.dice.filter((d) => d.slot === null && !d.temp && !d.jammed).length;
    if (unspent > 0) {
      gainSlip(s, unspent * per);
      log(s, 'slip', `${unspent} unspent dice → +${unspent * per} Slip.`);
    }
  } else if (!slipTurnOk) {
    log(s, 'enemy', 'Ascension — no Slip from unspent dice this turn.');
  } else {
    log(s, 'enemy', 'Sticky — no Slip from unspent dice.');
  }

  if (s.player.blockPersists) {
    s.player.blockPersists = false;
  } else {
    s.player.block = 0;
  }
  s.player.counter = 0;   // retaliation is a posture you hold for one turn

  for (const e of s.enemies) decayEnemy(e);
  decayPlayer(s.player);
  s.inverted = false;

  if (s.player.hp <= 0) {
    s.phase = 'LOSE';
    log(s, 'system', 'You died.');
    return { state: s, events };
  }

  startTurn(s, rng);
  return { state: s, events };
}

// =============================================================== helpers

export function unslottedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.slot === null);
}

export { diceInSlot, crownOf, floorOf, livingEnemies, currentTarget, TIER_RANK, SIGMA_MULT, SKILLS, DICE_DEFS };
