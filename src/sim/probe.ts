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
import { SKILLS, previewSlot, canSlot, slotValue } from '../engine/skills.js';
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
  return slotValue(previewSlot(s, slotIndex));
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
    total += slotValue(p);
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

function simulate(runs: number, bag: string[], loadout: string[], encounterKey: string): SimResult {
  const r: SimResult = { wins: 0, runs, turns: 0, damage: 0, sigma: 0, double: 0, omega: 0, none: 0, slipSpent: 0, taken: 0 };

  for (let i = 0; i < runs; i++) {
    const g = newGame({ seed: 1000 + i, bag, loadout, encounterKey });
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
const damageKit = ['cleave', 'haymaker', 'sigma_slam', 'brace'];
const comboKit = ['softening', 'kindle', 'chain_reaction', 'spread'];
const manipKit = ['greased_palms', 'duplicate', 'bend_the_odds', 'brace'];
const tankKit = ['turtle', 'counterweight', 'immovable', 'jab'];
const bigKit = ['sigma_slam', 'colossal_l', 'brace', 'fumble'];

const loadedBag = ['loaded_d6', 'loaded_d6', 'standard_d6', 'standard_d6'];
const stoneBag = ['sigma_stone', 'sigma_stone', 'sigma_stone', 'standard_d6'];
const twinBag = ['twin_d6', 'twin_d6', 'twin_d6', 'standard_d6'];

console.log('-- starting kit across the Act 1 ladder --');
report('start vs lone NPC', simulate(300, d6x4, starting, 'a1_tutorial'));
report('start vs Slug', simulate(300, d6x4, starting, 'a1_slug'));
report('start vs Wraith', simulate(300, d6x4, starting, 'a1_wraith'));
report('start vs Doomscroller+NPC', simulate(300, d6x4, starting, 'a1_scroll'));
report('start vs Golem', simulate(300, d6x4, starting, 'a1_golem'));
report('start vs Algorithm (hard)', simulate(300, d6x4, starting, 'a1_algo'));
report('start vs 3-enemy swarm', simulate(300, d6x4, starting, 'a1_swarm'));
report('start vs ELITE Mid', simulate(300, d6x4, starting, 'a1_elite_mid'));
report('start vs BOSS Glizzy', simulate(300, d6x5, starting, 'a1_boss'));

console.log('\n-- the four archetype lanes, 5 dice, vs ELITE Mid --');
report('damage lane', simulate(300, d6x5, damageKit, 'a1_elite_mid'));
report('combo lane', simulate(300, d6x5, comboKit, 'a1_elite_mid'));
report('manipulation lane', simulate(300, d6x5, manipKit, 'a1_elite_mid'));
report('tank lane', simulate(300, d6x5, tankKit, 'a1_elite_mid'));

console.log('\n-- tank lane: stacked defence vs a realistic single defensive pick --');
report('3 defence + Jab vs Mid', simulate(300, d6x5, tankKit, 'a1_elite_mid'));
report('1 defence + 3 damage vs Mid', simulate(300, d6x5, ['brace', 'cleave', 'haymaker', 'sigma_slam'], 'a1_elite_mid'));
report('3 defence + Jab vs swarm', simulate(300, d6x5, tankKit, 'a1_swarm'));

console.log('\n-- lanes vs the 3-enemy swarm (does AoE separate them?) --');
report('damage lane', simulate(300, d6x5, damageKit, 'a1_swarm'));
report('combo lane', simulate(300, d6x5, comboKit, 'a1_swarm'));
report('tank lane', simulate(300, d6x5, tankKit, 'a1_swarm'));

console.log('\n-- bag composition vs BOSS Glizzy --');
report('4 plain d6', simulate(300, d6x4, damageKit, 'a1_boss'));
report('5 plain d6', simulate(300, d6x5, damageKit, 'a1_boss'));
report('6 plain d6', simulate(300, d6x6, damageKit, 'a1_boss'));
report('2x Loaded', simulate(300, loadedBag, damageKit, 'a1_boss'));
report('3x Twin', simulate(300, twinBag, damageKit, 'a1_boss'));
report('3x Sigma Stone', simulate(300, stoneBag, damageKit, 'a1_boss'));

console.log('\n-- high-cost kit: can the top tiers be reached? --');
report('3d+4d, 5 dice vs Mid', simulate(300, d6x5, bigKit, 'a1_elite_mid'));
report('3d+4d, 6 dice vs Mid', simulate(300, d6x6, bigKit, 'a1_elite_mid'));
report('3d+4d, 8 dice vs Mid', simulate(300, [...d6x6, 'standard_d6', 'standard_d6'], bigKit, 'a1_elite_mid'));

console.log('');

// ------------------------------------------------- 3. full-run simulation
//
// The Phase 3 exit criterion is "a complete 18-node run is playable start to
// finish". A dumb clicker cannot answer that; the greedy AI can.

import {
  newRun, enterNode, finishCombat, nextOptions, takeSkill, takeDie, takeRelic,
  skipReward, leaveNode, restHeal, chooseEvent, buy, type RunState,
} from '../engine/run.js';
import { newMeta, type MetaState } from '../engine/meta.js';
import { UNLOCKS } from '../data/unlocks.js';

/** Route heuristic: rest when hurt, take elites when healthy, else press on. */
function chooseNode(run: RunState): number {
  const options = nextOptions(run);
  const row = run.map.rows[run.row + 1];
  if (!row) return options[0];
  const hurt = run.hp / run.maxHp < 0.55;
  const healthy = run.hp / run.maxHp > 0.75;

  const score = (col: number): number => {
    const k = row[col]?.kind;
    if (!k) return -99;
    if (k === 'rest') return hurt ? 100 : 30;
    if (k === 'treasure') return 60;
    if (k === 'shop') return 45;
    if (k === 'elite') return healthy ? 55 : -20;
    if (k === 'event') return 35;
    if (k === 'hard') return healthy ? 25 : 5;
    return 20;
  };
  return options.reduce((best, c) => (score(c) > score(best) ? c : best), options[0]);
}

interface RunResult {
  runs: number; wins: number; actReached: number[]; nodes: number;
  deaths: Record<string, number>; finalBag: number; relics: number; biggest: number;
}

function simulateRuns(count: number, meta?: MetaState): RunResult {
  const res: RunResult = {
    runs: count, wins: 0, actReached: [0, 0, 0, 0], nodes: 0,
    deaths: {}, finalBag: 0, relics: 0, biggest: 0,
  };

  for (let i = 0; i < count; i++) {
    const { run: r0, rng } = newRun(5000 + i, meta);
    let run = r0;
    let guard = 0;

    while (guard++ < 400) {
      if (run.screen === 'dead' || run.screen === 'won') break;

      if (run.screen === 'map') {
        run = enterNode(run, chooseNode(run), rng);
      } else if (run.screen === 'combat' && run.combat) {
        let c = run.combat;
        let turns = 0;
        while (c.phase === 'PLAN' && turns++ < 60) {
          c = spendSlip(c);
          c = fillSlots(c);
          c = resolveTurn(c, rng).state;
        }
        run.combat = c;
        run = finishCombat(run, rng);
        if (run.screen === 'dead') {
          const key = c.enemies.find((e) => e.hp > 0)?.name ?? 'unknown';
          res.deaths[key] = (res.deaths[key] ?? 0) + 1;
        }
      } else if (run.screen === 'reward') {
        if (run.offerRelic) run = takeRelic(run);
        else if (run.offerDice.length) {
          run = takeDie(run, run.offerDice[0]);
          if (run.offerDice.length) run = { ...run, offerDice: [] };
        } else if (run.offerSkills.length) {
          // Replace an empty slot if there is one, otherwise the lowest-rarity
          // skill held. Randomly clobbering slots was destroying good builds and
          // making the AI, not the balance, the limiting factor.
          const rank: Record<string, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
          const best = run.offerSkills
            .map((k) => ({ k, r: rank[SKILLS[k].rarity] }))
            .sort((a, b) => b.r - a.r)[0];
          let slot = run.loadout.findIndex((x) => !x);
          if (slot < 0) {
            let worst = 0;
            for (let j = 1; j < run.loadout.length; j++) {
              const cur = run.loadout[j];
              const wr = run.loadout[worst];
              if (cur && wr && rank[SKILLS[cur].rarity] < rank[SKILLS[wr].rarity]) worst = j;
            }
            slot = worst;
          }
          const held = run.loadout[slot];
          run = !held || rank[SKILLS[held].rarity] <= best.r
            ? takeSkill(run, best.k, slot)
            : skipReward(run);
        } else run = leaveNode(run);
      } else if (run.screen === 'shop') {
        // Buy what is affordable, cheapest first — relics and dice only, since
        // slot-targeted purchases need judgement this heuristic does not have.
        for (let pass = 0; pass < 6; pass++) {
          const idx = run.shop
            .map((it, j) => ({ it, j }))
            .filter(({ it }) => !it.sold && (it.kind === 'relic' || it.kind === 'die') && run.gold >= it.price)
            .sort((a, b) => a.it.price - b.it.price)[0];
          if (!idx) break;
          const before = run.gold;
          run = buy(run, idx.j);
          if (run.gold === before) break;
        }
        run = leaveNode(run);
      } else if (run.screen === 'rest') {
        run = restHeal(run);
      } else if (run.screen === 'treasure') {
        run = run.offerRelic ? takeRelic(run) : leaveNode(run);
        if (!run.offerRelic && run.screen === 'treasure') run = leaveNode(run);
      } else if (run.screen === 'event') {
        run = run.eventResult ? leaveNode(run) : chooseEvent(run, run.event ? run.event.choices.length - 1 : 0, rng);
      } else break;
    }

    if (run.screen === 'won') res.wins++;
    res.actReached[Math.min(3, run.act)]++;
    res.nodes += run.nodesCleared;
    res.finalBag += run.bag.length;
    res.relics += run.relics.length;
    res.biggest = Math.max(res.biggest, run.biggestHit);
  }
  return res;
}

console.log('\n=== 3. FULL RUNS (greedy AI, 200 runs) ===');
console.log('Exit criterion: an 18-node run is completable start to finish.\n');
const rr = simulateRuns(200);
console.log(`runs ${rr.runs} · wins ${rr.wins} (${((rr.wins / rr.runs) * 100).toFixed(0)}%)`);
console.log(`reached act 1 / 2 / 3 : ${rr.actReached[1]} / ${rr.actReached[2]} / ${rr.actReached[3]}`);
console.log(`avg nodes cleared ${(rr.nodes / rr.runs).toFixed(1)} · avg final bag ${(rr.finalBag / rr.runs).toFixed(1)} · avg relics ${(rr.relics / rr.runs).toFixed(1)}`);
console.log(`biggest hit seen ${rr.biggest}`);
const topDeaths = Object.entries(rr.deaths).sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log('deaths by killer:', topDeaths.map(([k, v]) => `${k} ${v}`).join(' · ') || 'none');
console.log('');

// ------------------------------------------- 4. heroes and Ascension
//
// Meta-progression must add VARIETY, never power: a fully-unlocked veteran and
// a fresh account should reach the same ceiling. These rows check that.

function metaFor(hero: string, ascension = 0, everything = false): MetaState {
  const m = newMeta();
  m.hero = hero;
  m.ascension = ascension;
  m.maxAscension = 12;
  if (everything) m.unlocked = UNLOCKS.map((u) => u.key);
  return m;
}

function reportRuns(label: string, r: RunResult): void {
  console.log(
    `${label.padEnd(30)} win ${((r.wins / r.runs) * 100).toFixed(0).padStart(3)}%  ` +
    `act1/2/3 ${String(r.actReached[1]).padStart(3)}/${String(r.actReached[2]).padStart(3)}/${String(r.actReached[3]).padStart(3)}  ` +
    `nodes ${(r.nodes / r.runs).toFixed(1)}  bag ${(r.finalBag / r.runs).toFixed(1)}  relics ${(r.relics / r.runs).toFixed(1)}`,
  );
}

console.log('=== 4. HEROES & ASCENSION (120 runs each) ===\n');
console.log('-- heroes, base pool, no Ascension --');
reportRuns('SIG (the Fixer)', simulateRuns(120, metaFor('sig')));
reportRuns('VEX (the Gambler)', simulateRuns(120, metaFor('vex')));
reportRuns('OPHI (the Architect)', simulateRuns(120, metaFor('ophi')));

console.log('\n-- does a fully-unlocked pool raise the ceiling? (it should not) --');
reportRuns('SIG, base pool', simulateRuns(120, metaFor('sig')));
reportRuns('SIG, everything unlocked', simulateRuns(120, metaFor('sig', 0, true)));

console.log('\n-- Ascension should bite --');
for (const tier of [0, 3, 6, 9, 12]) {
  reportRuns(`SIG at A${tier}`, simulateRuns(120, metaFor('sig', tier, true)));
}
console.log('');
