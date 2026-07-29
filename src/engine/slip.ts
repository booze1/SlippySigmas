// SLIP — the manipulation currency. See docs/01-combat-system.md §2
// and docs/02-balance-math.md §3 for why NUDGE escalates.

import type { Die } from './types.js';

export type SlipVerb = 'NUDGE' | 'REROLL' | 'FREEZE' | 'CLONE' | 'SPLIT' | 'SET';

export const FLAT_COSTS: Record<Exclude<SlipVerb, 'NUDGE'>, number> = {
  REROLL: 2,
  FREEZE: 2,
  CLONE: 4,
  SPLIT: 4,
  SET: 6,
};

/**
 * Cost of the NEXT single-pip nudge on this die, this turn.
 * 1st pip costs 1, 2nd costs 2, 3rd costs 3, ... Resets every turn.
 *
 * A flat cost here lets a player manufacture a triple almost every turn,
 * which drags the natural 9.7% triple rate past 70% and reduces SIGMA to
 * a formality. Escalation keeps fine-tuning cheap and big swings expensive.
 */
export function nudgeCost(die: Die): number {
  return die.nudges + 1;
}

/** Total Slip to move a die `pips` steps in one turn, from a fresh start. */
export function nudgeCostTotal(pips: number): number {
  return (pips * (pips + 1)) / 2;
}

export function verbCost(verb: SlipVerb, die?: Die): number {
  if (verb === 'NUDGE') return die ? nudgeCost(die) : 1;
  return FLAT_COSTS[verb];
}

export const VERB_BLURB: Record<SlipVerb, string> = {
  NUDGE: 'Move a face ±1. Cost escalates 1/2/3 per die each turn.',
  REROLL: 'Reroll one die.',
  FREEZE: 'Die keeps its face through next turn’s roll.',
  CLONE: 'Copy one die’s face onto another. The guaranteed-Sigma button.',
  SPLIT: 'Destroy a die ≥4, get two temp dice summing to it.',
  SET: 'Set a die to any legal face.',
};
