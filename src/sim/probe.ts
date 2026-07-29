// Headless balance probe.
//
// Two jobs:
//   1. Empirically verify the probability table in docs/02-balance-math.md §1.
//      Those numbers were derived by hand; this checks the hand.
//   2. Play thousands of turns with a greedy AI and report the numbers the
//      tuning guardrails in docs/02 §10 actually care about.
//
// Run: npm run sim

import { Rng } from '../engine/rng.js';
import type { GameState, Die } from '../engine/types.js';
import { newGame, resolveTurn, slotDie, nudge } from '../engine/combat.js';
import { SKILLS, previewSlot, canSlot } from '../engine/skills.js';
import { facesOf } from '../engine/dice.js';
import { nudgeCost } from '../engine/slip.js';

// ------------------------------------------------------- 1. pure probability

function maxMultiplicity(faces: number[]): number {
  const counts = new Map<number, number>();
  for (const f of faces) counts.set(f, (counts.get(f) ?? 0) + 1);
  return Math.max(...counts.values());
}

function probabilityTable(trials = 500_000): void {
  const rng = new Rng(0xc0ffee);
  console.log('\n=== 1. NATURAL SIGMA ODDS (uniform d6) ===');
  console.log('Verifies docs/02-balance-math.md §1.\n');
  console.log('dice   P(pair)   P(triple)   P(quad)     expected (doc)');

  const doc: Record<number, string> = {
    4: '72.2 /  9.7 / 0.5',
    5: '90.7 / 21.3 / 2.0',
    6: '98.5 / 36.7 / 5.2',
    7: '100  / 54.1 /  — ',
    8: '100  / 70.7 /  — ',
  };

  for (let n = 4; n <= 8; n++) {
    let pair = 0, triple = 0, quad = 0;
    for (let t = 0; t < trials; t++) {
      const faces = Array.from({ length: n }, () => rng.int(6) + 1);
      const m = maxMultiplicity(faces);
      if (m >= 2) pair++;
      if (m >= 3) triple++;
      if (m >= 4) quad++;
    }
    const p = (x: number) => ((x / trials) * 100).toFixed(1).padStart(5);
    console.log(`  ${n}   ${p(pair)}%    ${p(triple)}%    ${p(quad)}%     ${doc[n]}`);
  }
}

// ------------------------------------------------------- 2. greedy AI

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  return [
    ...combinations(tail, k - 1).map((c) => [head, ...c]),
    ...combinations(tail, k),
  ];
}

/** Value of a slot filled with a given set of dice — damage plus a little
 *  credit for block, so the AI doesn't ignore defensive skills entirely. */
function scoreSlot(state: GameState, slotIndex: number, dice: Die[]): number {
  let s = { ...state, dice: state.dice.map((d) => ({ ...d })) } as GameState;
  for (const d of s.dice) if (d.slot === slotIndex) d.slot = null;
  for (const d of dice) {
    const target = s.dice.find((x) => x.id === d.id);
    if (target) target.slot = slotIndex;
  }
  const p = previewSlot(s, slotIndex);
  return p.damage + p.block * 0.6 + p.slip * 2 + p.brittle * 0.3 + p.burn * 0.8;
}

/**
 * Fill slots best-combination-first.
 *
 * Note the ordering: slots are FILLED in descending dice-cost order, not
 * left to right. A naive left-to-right fill starves expensive skills — with
 * a 4-die bag, Cleave (2d) and Haymaker (2d) consume everything and Sigma
 * Slam (3d) never fires once, which drove the Double Sigma rate to a flat
 * 0.0% in the first sim pass. Resolution order is still left-to-right; only
 * the player's assignment order changes, which is exactly the decision a
 * competent player makes.
 */
function fillSlots(state: GameState): GameState {
  let s = state;
  const order = s.slots
    .map((slot, i) => ({ i, count: slot.skillKey ? (SKILLS[slot.skillKey]?.cost.count ?? 0) : 0 }))
    .sort((a, b) => b.count - a.count)
    .map((x) => x.i);

  for (const i of order) {
    const skill = s.slots[i].skillKey ? SKILLS[s.slots[i].skillKey!] : null;
    if (!skill) continue;
    const avail = s.dice.filter((d) => d.slot === null && canSlot(s, d, i));
    if (avail.length < skill.cost.count) continue;

    let best: Die[] | null = null;
    let bestScore = -1;
    for (const combo of combinations(avail, skill.cost.count)) {
      const sc = scoreSlot(s, i, combo);
      if (sc > bestScore) { bestScore = sc; best = combo; }
    }
    if (best && bestScore > 0) {
      for (const d of best) s = slotDie(s, d.id, i);
    }
  }
  return s;
}

/** Total value of the whole turn as currently arranged. */
function turnValue(state: GameState): number {
  let total = 0;
  for (let i = 0; i < state.slots.length; i++) {
    const p = previewSlot(state, i);
    if (!p.ready) continue;
    total += p.damage + p.block * 0.6 + p.slip * 2 + p.brittle * 0.3 + p.burn * 0.8;
  }
  return total;
}

/**
 * Spend Slip greedily: repeatedly find the single nudge sequence with the best
 * value-gained-per-Slip and take it, while it pays for itself.
 */
function spendSlip(state: GameState): GameState {
  let s = state;
  for (let guard = 0; guard < 12; guard++) {
    const baseline = turnValue(fillSlots(s));
    let bestGain = 0;
    let bestPlan: { id: string; delta: 1 | -1; steps: number } | null = null;

    for (const die of s.dice) {
      if (die.jammed || die.temp || die.slot !== null) continue;
      const faces = facesOf(die);
      const lo = Math.min(...faces), hi = Math.max(...faces);

      for (const delta of [1, -1] as const) {
        let probe = s;
        let spent = 0;
        for (let steps = 1; steps <= 3; steps++) {
          const cur = probe.dice.find((d) => d.id === die.id)!;
          const target = cur.face + delta;
          if (target < lo || target > hi) break;
          const cost = nudgeCost(cur);
          if (probe.player.slip < cost) break;
          const next = nudge(probe, die.id, delta);
          if (next === probe) break;
          probe = next;
          spent += cost;

          const gain = turnValue(fillSlots(probe)) - baseline;
          const ratio = gain / spent;
          if (gain > 0 && ratio > bestGain) {
            bestGain = ratio;
            bestPlan = { id: die.id, delta, steps };
          }
        }
      }
    }

    // Require the spend to be worth more than banking the Slip (~1 value/point).
    if (!bestPlan || bestGain < 1.0) break;
    for (let k = 0; k < bestPlan.steps; k++) {
      s = nudge(s, bestPlan.id, bestPlan.delta);
    }
  }
  return s;
}

interface SimResult {
  wins: number;
  runs: number;
  turns: number;
  damage: number;
  sigma: number;
  double: number;
  omega: number;
  none: number;
  slipSpent: number;
  taken: number;
}

function simulate(runs: number, bag: string[], loadout: string[], enemyKey: string): SimResult {
  const r: SimResult = { wins: 0, runs, turns: 0, damage: 0, sigma: 0, double: 0, omega: 0, none: 0, slipSpent: 0, taken: 0 };

  for (let i = 0; i < runs; i++) {
    const g = newGame({ seed: 1000 + i, bag, loadout, enemyKey });
    let s = g.state;
    const rng = g.rng;
    let guard = 0;

    while (s.phase === 'PLAN' && guard++ < 40) {
      s = spendSlip(s);
      s = fillSlots(s);
      s = resolveTurn(s, rng).state;
    }

    if (s.phase === 'WIN') r.wins++;
    r.turns += s.stats.turns;
    r.damage += s.stats.damageDealt;
    r.slipSpent += s.stats.slipSpent;
    r.taken += s.stats.damageTaken;
    r.none += s.stats.sigmaCounts.NONE;
    r.sigma += s.stats.sigmaCounts.SIGMA;
    r.double += s.stats.sigmaCounts.DOUBLE;
    r.omega += s.stats.sigmaCounts.OMEGA;
  }
  return r;
}

function report(label: string, r: SimResult): void {
  const fired = r.none + r.sigma + r.double + r.omega;
  const pct = (x: number) => ((x / Math.max(1, fired)) * 100).toFixed(1).padStart(5);
  console.log(
    `${label.padEnd(30)} win ${((r.wins / r.runs) * 100).toFixed(0).padStart(3)}%  ` +
    `turns ${(r.turns / r.runs).toFixed(1).padStart(4)}  ` +
    `dmg/turn ${(r.damage / Math.max(1, r.turns)).toFixed(1).padStart(5)}  ` +
    `| sigma ${pct(r.sigma)}%  double ${pct(r.double)}%  omega ${pct(r.omega)}%  ` +
    `| slip/turn ${(r.slipSpent / Math.max(1, r.turns)).toFixed(1)}`,
  );
}

// ------------------------------------------------------- run

probabilityTable(200_000);

console.log('\n=== 2. GREEDY-AI COMBAT (500 fights each) ===');
console.log('Guardrails (docs/02 §10): Act 1 basic fight ≤ 4 turns, sigma-tier rate 30-40%.\n');

const d6x4 = ['standard_d6', 'standard_d6', 'standard_d6', 'standard_d6'];
const d6x5 = [...d6x4, 'standard_d6'];
const d6x6 = [...d6x5, 'standard_d6'];
const starting = ['softening', 'cleave', 'fumble', 'brace'];
const damageHeavy = ['cleave', 'haymaker', 'sigma_slam', 'brace'];
const loadedBag = ['loaded_d6', 'loaded_d6', 'standard_d6', 'standard_d6'];
const stoneBag = ['sigma_stone', 'sigma_stone', 'sigma_stone', 'standard_d6'];

report('starting kit vs Slug', simulate(500, d6x4, starting, 'sigma_slug'));
report('starting kit vs Wraith', simulate(500, d6x4, starting, 'ratio_wraith'));
report('starting kit vs Golem', simulate(500, d6x4, starting, 'touch_grass_golem'));
report('starting kit vs Mid (elite)', simulate(500, d6x4, starting, 'mid'));
report('damage kit, 4 dice vs Wraith', simulate(500, d6x4, damageHeavy, 'ratio_wraith'));
report('damage kit, 5 dice vs Wraith', simulate(500, d6x5, damageHeavy, 'ratio_wraith'));
report('damage kit, 6 dice vs Wraith', simulate(500, d6x6, damageHeavy, 'ratio_wraith'));
report('2× Loaded d6 vs Wraith', simulate(500, loadedBag, damageHeavy, 'ratio_wraith'));
report('3× Sigma Stone vs Wraith', simulate(500, stoneBag, damageHeavy, 'ratio_wraith'));
report('3× Sigma Stone vs Mid', simulate(500, stoneBag, damageHeavy, 'mid'));

console.log('\n--- high-cost loadouts (can the top Sigma tiers be reached at all?) ---');
const bigOnly = ['sigma_slam', 'colossal_l', 'brace', 'fumble'];
report('3d+4d kit, 5 dice vs Mid', simulate(500, d6x5, bigOnly, 'mid'));
report('3d+4d kit, 6 dice vs Mid', simulate(500, d6x6, bigOnly, 'mid'));
report('3d+4d kit, 8 dice vs Mid', simulate(500, [...d6x6, 'standard_d6', 'standard_d6'], bigOnly, 'mid'));

console.log('');
