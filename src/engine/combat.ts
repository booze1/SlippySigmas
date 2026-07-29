// The rules engine. Every exported function takes a state and returns a NEW
// state — no in-place mutation of the caller's object. That gives undo,
// save/resume, deterministic replay, and headless simulation for free.

import type { Die, GameState, LogEntry, SigmaTier } from './types.js';
import { Rng } from './rng.js';
import { makeDie, makeTempDie, rollDie, facesOf, crownOf, floorOf, resetDieCounter } from './dice.js';
import { SKILLS, previewSlot, diceInSlot, canSlot, slotValue } from './skills.js';
import { makeEnemy, pickIntent, ENEMY_DEFS } from './enemy.js';
import { nudgeCost, FLAT_COSTS } from './slip.js';
import { tierLabel } from './sigma.js';

export const SLOT_COUNT = 4;
export const DEFAULT_LOADOUT = ['softening', 'cleave', 'fumble', 'brace'];
export const DEFAULT_BAG = ['standard_d6', 'standard_d6', 'standard_d6', 'standard_d6'];

function clone(state: GameState): GameState {
  return structuredClone(state);
}

function log(s: GameState, kind: LogEntry['kind'], text: string): void {
  s.log.push({ turn: s.turn, text, kind });
  if (s.log.length > 120) s.log.shift();
}

// ------------------------------------------------------------- setup

export interface NewGameOpts {
  seed?: number;
  bag?: string[];
  loadout?: (string | null)[];
  enemyKey?: string;
  maxHp?: number;
  startSlip?: number;
}

/**
 * Slip the player carries into turn 1.
 *
 * This was 0 in the first design pass. The simulator showed that basic fights
 * end in 2-3 turns and Slip income only arrives at END of turn, so a player
 * starting at 0 never had Slip to spend during a normal fight — the pillar
 * mechanic was inactive for most of Act 1. See docs/02-balance-math.md §3.
 */
export const START_SLIP = 3;

export function newGame(opts: NewGameOpts = {}): { state: GameState; rng: Rng } {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = new Rng(seed);
  resetDieCounter();

  const maxHp = opts.maxHp ?? 60;
  const bag = opts.bag ?? DEFAULT_BAG;
  const loadout = opts.loadout ?? DEFAULT_LOADOUT;

  const state: GameState = {
    seed,
    turn: 0,
    phase: 'PLAN',
    player: {
      hp: maxHp,
      maxHp,
      block: 0,
      slip: opts.startSlip ?? START_SLIP,
      slipCap: 10,
      incomingJam: 0,
    },
    dice: bag.map((k) => makeDie(k, rng)),
    slots: Array.from({ length: SLOT_COUNT }, (_, i) => ({
      skillKey: loadout[i] ?? null,
    })),
    enemy: makeEnemy(opts.enemyKey ?? 'ratio_wraith', rng),
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
  };

  startTurn(state, rng);
  return { state, rng };
}

// ------------------------------------------------------------- turn start

/** Mutates in place — only ever called on a state we already own. */
function startTurn(s: GameState, rng: Rng): void {
  s.turn += 1;
  s.stats.turns = s.turn;

  // Temp dice from SPLIT evaporate.
  s.dice = s.dice.filter((d) => !d.temp);

  for (const die of s.dice) {
    die.slot = null;
    die.nudges = 0;
    die.jammed = false;
    if (die.frozen) {
      die.frozen = false; // kept its face through this roll, now thaws
    } else {
      rollDie(die, rng);
    }
  }

  // LOCK intents jam random dice for exactly one turn.
  if (s.player.incomingJam > 0) {
    const free = rng.shuffle(s.dice.map((d) => d.id));
    for (const id of free.slice(0, s.player.incomingJam)) {
      const die = s.dice.find((d) => d.id === id);
      if (die) die.jammed = true;
    }
    log(s, 'enemy', `${s.player.incomingJam} dice jammed.`);
    s.player.incomingJam = 0;
  }

  // Bad-luck rebate: every 1 rolled pays a Slip. See docs/01 §2.
  let ones = 0;
  for (const die of s.dice) {
    if (die.face === 1) {
      ones += 1;
      if (die.defKey === 'cursed_d6') {
        s.player.hp -= 3;
        s.stats.damageTaken += 3;
        log(s, 'enemy', 'Cursed d6 bites you for 3.');
      }
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

function spendSlip(s: GameState, n: number): boolean {
  if (s.player.slip < n) return false;
  s.player.slip -= n;
  s.stats.slipSpent += n;
  return true;
}

// ------------------------------------------------------------- slotting

export function slotDie(state: GameState, dieId: string, slotIndex: number): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || !canSlot(state, probe, slotIndex)) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  die.slot = slotIndex;
  return s;
}

export function unslotDie(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId);
  if (!die || die.slot === null) return state;
  die.slot = null;
  return s;
}

export function clearSlots(state: GameState): GameState {
  const s = clone(state);
  for (const d of s.dice) d.slot = null;
  return s;
}

/**
 * Tap-to-slot: drop into the slot where this die is worth the most.
 *
 * This used to pick the leftmost legal slot. Driving the real UI showed why
 * that is a trap — with the starting loadout, leftmost-legal dumps every die
 * into Softening (PIP × 0.5, the weakest skill on the bar) instead of Cleave,
 * so the laziest input is also the worst play. Ranking by value makes the
 * fast path a reasonable path; drag is still there for full control.
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
 *
 * Scoring the slot as-is heavily biases 1-die skills, because a 2-die skill
 * with one die in it previews as zero — the first UI pass fed everything into
 * Fumble and dealt 5 damage in 5 turns. Projecting the remaining sockets as
 * copies of this die values multi-die skills fairly and leans toward matching,
 * which is the behaviour we want to encourage anyway.
 *
 * Returns -Infinity when there aren't enough legal dice left to finish the slot.
 */
function projectedSlotValue(state: GameState, slotIndex: number, die: Die): number {
  const skill = SKILLS[state.slots[slotIndex]?.skillKey ?? ''];
  if (!skill) return -Infinity;

  const filled = diceInSlot(state, slotIndex).length;
  const need = skill.cost.count - filled - 1;
  if (need < 0) return -Infinity;

  // Don't commit to a slot that cannot be completed this turn.
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

export function setSlotSkill(
  state: GameState,
  slotIndex: number,
  skillKey: string | null,
): GameState {
  const s = clone(state);
  s.slots[slotIndex] = { skillKey };
  // Any dice already committed to that slot are returned to the tray.
  for (const d of s.dice) if (d.slot === slotIndex) d.slot = null;
  return s;
}

// ------------------------------------------------------------- slip verbs

export function nudge(state: GameState, dieId: string, delta: 1 | -1): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || probe.temp) return state;

  const faces = facesOf(probe);
  const target = probe.face + delta;
  if (target < Math.min(...faces) || target > Math.max(...faces)) return state;

  const cost = nudgeCost(probe);
  if (state.player.slip < cost) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  spendSlip(s, cost);
  die.face = target;
  die.nudges += 1;
  log(s, 'slip', `Nudge ${die.face - delta} → ${die.face} (−${cost} Slip).`);
  return validateSlots(s);
}

export function reroll(state: GameState, dieId: string, rng: Rng): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || state.player.slip < FLAT_COSTS.REROLL) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  spendSlip(s, FLAT_COSTS.REROLL);
  const before = die.face;
  rollDie(die, rng);
  log(s, 'slip', `Reroll ${before} → ${die.face} (−${FLAT_COSTS.REROLL} Slip).`);
  return validateSlots(s);
}

export function freeze(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.frozen || probe.temp || state.player.slip < FLAT_COSTS.FREEZE) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  spendSlip(s, FLAT_COSTS.FREEZE);
  die.frozen = true;
  log(s, 'slip', `Froze a ${die.face} (−${FLAT_COSTS.FREEZE} Slip).`);
  return s;
}

export function cloneFace(state: GameState, fromId: string, toId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  if (fromId === toId) return state;
  const from = state.dice.find((d) => d.id === fromId);
  const to = state.dice.find((d) => d.id === toId);
  if (!from || !to || to.jammed || state.player.slip < FLAT_COSTS.CLONE) return state;
  // The target must physically be able to show that face.
  if (!facesOf(to).includes(from.face)) return state;

  const s = clone(state);
  const target = s.dice.find((d) => d.id === toId)!;
  spendSlip(s, FLAT_COSTS.CLONE);
  const before = target.face;
  target.face = from.face;
  log(s, 'slip', `Cloned ${from.face} onto a ${before} (−${FLAT_COSTS.CLONE} Slip).`);
  return validateSlots(s);
}

export function setFace(state: GameState, dieId: string, face: number): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || state.player.slip < FLAT_COSTS.SET) return state;
  if (!facesOf(probe).includes(face)) return state;

  const s = clone(state);
  const die = s.dice.find((d) => d.id === dieId)!;
  spendSlip(s, FLAT_COSTS.SET);
  const before = die.face;
  die.face = face;
  log(s, 'slip', `Set ${before} → ${face} (−${FLAT_COSTS.SET} Slip).`);
  return validateSlots(s);
}

export function split(state: GameState, dieId: string): GameState {
  if (state.phase !== 'PLAN') return state;
  const probe = state.dice.find((d) => d.id === dieId);
  if (!probe || probe.jammed || probe.face < 4 || state.player.slip < FLAT_COSTS.SPLIT) {
    return state;
  }

  const s = clone(state);
  const idx = s.dice.findIndex((d) => d.id === dieId);
  const die = s.dice[idx];
  spendSlip(s, FLAT_COSTS.SPLIT);
  const a = Math.floor(die.face / 2);
  const b = die.face - a;
  s.dice.splice(idx, 1, makeTempDie(a), makeTempDie(b));
  log(s, 'slip', `Split ${die.face} → ${a} + ${b} (−${FLAT_COSTS.SPLIT} Slip).`);
  return s;
}

/**
 * After any face change, dice may no longer satisfy the slot they sit in.
 * Eject the illegal ones rather than silently letting a skill fire on a
 * requirement it no longer meets.
 */
function validateSlots(s: GameState): GameState {
  for (const die of s.dice) {
    if (die.slot === null) continue;
    const skill = SKILLS[s.slots[die.slot]?.skillKey ?? ''];
    if (!skill) {
      die.slot = null;
      continue;
    }
    const ok =
      (skill.cost.exact === undefined || die.face === skill.cost.exact) &&
      (skill.cost.min === undefined || die.face >= skill.cost.min) &&
      (skill.cost.max === undefined || die.face <= skill.cost.max) &&
      (skill.cost.parity !== 'EVEN' || die.face % 2 === 0) &&
      (skill.cost.parity !== 'ODD' || die.face % 2 === 1);
    if (!ok) die.slot = null;
  }
  return s;
}

// ------------------------------------------------------------- resolve

function dealToEnemy(s: GameState, amount: number): void {
  if (amount <= 0) return;
  const absorbed = Math.min(s.enemy.block, amount);
  s.enemy.block -= absorbed;
  const through = amount - absorbed;
  s.enemy.hp -= through;
  s.stats.damageDealt += through;
  if (amount > s.stats.biggestHit) s.stats.biggestHit = amount;
}

function dealToPlayer(s: GameState, amount: number): void {
  if (amount <= 0) return;
  const absorbed = Math.min(s.player.block, amount);
  s.player.block -= absorbed;
  const through = amount - absorbed;
  s.player.hp -= through;
  s.stats.damageTaken += through;
}

export interface ResolveEvent {
  slotIndex: number;
  skillName: string;
  tier: SigmaTier;
  damage: number;
  block: number;
  slip: number;
}

export interface ResolveResult {
  state: GameState;
  events: ResolveEvent[];
}

export function resolveTurn(state: GameState, rng: Rng): ResolveResult {
  if (state.phase !== 'PLAN') return { state, events: [] };

  const s = clone(state);
  const events: ResolveEvent[] = [];

  // --- player skills, left to right
  for (let i = 0; i < s.slots.length; i++) {
    const p = previewSlot(s, i);
    if (!p.ready || !p.skill) continue;

    s.stats.sigmaCounts[p.tier] += 1;

    if (p.damage > 0) dealToEnemy(s, p.damage);
    if (p.block > 0) s.player.block += p.block;
    if (p.slip > 0) gainSlip(s, p.slip);
    if (p.brittle > 0) s.enemy.brittle += p.brittle;
    if (p.burn > 0) s.enemy.burn += p.burn;

    const tl = tierLabel(p.tier);
    const bits: string[] = [];
    if (p.damage) bits.push(`${p.damage} dmg`);
    if (p.block) bits.push(`${p.block} block`);
    if (p.slip) bits.push(`+${p.slip} Slip`);
    if (p.brittle) bits.push(`Brittle ${p.brittle}`);
    if (p.burn) bits.push(`Burn ${p.burn}`);
    log(
      s,
      p.tier === 'NONE' ? 'player' : 'sigma',
      `${p.skill.name}${tl ? ` — ${tl}` : ''}: ${bits.join(', ') || 'no effect'}`,
    );

    events.push({
      slotIndex: i,
      skillName: p.skill.name,
      tier: p.tier,
      damage: p.damage,
      block: p.block,
      slip: p.slip,
    });
  }

  if (s.enemy.hp <= 0) {
    s.phase = 'WIN';
    log(s, 'system', `${s.enemy.name} deleted.`);
    return { state: s, events };
  }

  // --- enemy phase
  if (s.enemy.burn > 0) {
    s.enemy.hp -= s.enemy.burn;
    s.stats.damageDealt += s.enemy.burn;
    log(s, 'player', `Burn ticks for ${s.enemy.burn}.`);
    s.enemy.burn = Math.floor(s.enemy.burn / 2);
    if (s.enemy.hp <= 0) {
      s.phase = 'WIN';
      log(s, 'system', `${s.enemy.name} burned down.`);
      return { state: s, events };
    }
  }

  const intent = s.enemy.intent;
  switch (intent.kind) {
    case 'SMASH': {
      const dmg = intent.value + s.enemy.buff;
      dealToPlayer(s, dmg);
      log(s, 'enemy', `${s.enemy.name} smashes for ${dmg}.`);
      break;
    }
    case 'GUARD':
      s.enemy.block += intent.value;
      log(s, 'enemy', `${s.enemy.name} guards for ${intent.value}.`);
      break;
    case 'LOCK':
      s.player.incomingJam += intent.value;
      log(s, 'enemy', `${s.enemy.name} will jam ${intent.value} dice.`);
      break;
    case 'BUFF':
      s.enemy.buff += intent.value;
      log(s, 'enemy', `${s.enemy.name} powers up (+${intent.value}).`);
      break;
    case 'DRAIN': {
      const drained = Math.min(s.player.slip, intent.value);
      s.player.slip -= drained;
      log(s, 'enemy', `${s.enemy.name} drains ${drained} Slip.`);
      break;
    }
  }

  s.enemy.lastIntentKind = intent.kind;
  s.enemy.intent = pickIntent(ENEMY_DEFS[s.enemy.defKey], rng, intent.kind);

  // --- end of turn
  const unspent = s.dice.filter((d) => d.slot === null && !d.temp).length;
  if (unspent > 0) {
    gainSlip(s, unspent);
    log(s, 'slip', `${unspent} unspent dice → +${unspent} Slip.`);
  }

  s.player.block = 0; // Block expires at end of the enemy phase.
  if (s.enemy.brittle > 0) s.enemy.brittle = Math.max(0, s.enemy.brittle - 1);

  if (s.player.hp <= 0) {
    s.phase = 'LOSE';
    log(s, 'system', `You died to ${s.enemy.name}.`);
    return { state: s, events };
  }

  startTurn(s, rng);
  return { state: s, events };
}

// ------------------------------------------------------------- helpers

export function unslottedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.slot === null);
}

export { diceInSlot, crownOf, floorOf };
