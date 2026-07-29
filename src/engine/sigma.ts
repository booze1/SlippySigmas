// SIGMA — the match bonus. See docs/01-combat-system.md §4.
//
// All dice slotted into a skill showing the same face amplifies it. A single
// die Sigmas only on its "crown" face, which keeps 1d skills in the Sigma
// economy without making them free.

import type { Die, SigmaTier } from './types.js';
import { crownOf, isWild } from './dice.js';

export const SIGMA_MULT: Record<SigmaTier, number> = {
  NONE: 1.0,
  SIGMA: 1.6,
  DOUBLE: 2.6,
  OMEGA: 4.2,
};

export interface SigmaResult {
  tier: SigmaTier;
  mult: number;
}

/**
 * Effective face values for PIP. A WILD die (Chameleon) has no value of its
 * own — it takes the highest real face among the dice it was slotted with, so
 * it is worth the most when paired with your best die, not on its own.
 */
export function effectivePips(dice: Die[]): number[] {
  const real = dice.filter((d) => !isWild(d)).map((d) => d.face);
  const wildValue = real.length ? Math.max(...real) : 6;
  return dice.map((d) => (isWild(d) ? wildValue : d.face));
}

export function pipTotal(dice: Die[]): number {
  return effectivePips(dice).reduce((s, n) => s + n, 0);
}

export function evaluateSigma(dice: Die[]): SigmaResult {
  if (dice.length === 0) return { tier: 'NONE', mult: 1 };

  // Wilds match anything, so only the real faces have to agree.
  const real = dice.filter((d) => !isWild(d));
  const allSame = real.length === 0 || real.every((d) => d.face === real[0].face);
  if (!allSame) return { tier: 'NONE', mult: 1 };

  if (dice.length === 1) {
    const only = dice[0];
    // A lone wild counts as its own crown.
    if (isWild(only)) return { tier: 'SIGMA', mult: SIGMA_MULT.SIGMA };
    return only.face === crownOf(only)
      ? { tier: 'SIGMA', mult: SIGMA_MULT.SIGMA }
      : { tier: 'NONE', mult: 1 };
  }

  if (dice.length === 2) return { tier: 'SIGMA', mult: SIGMA_MULT.SIGMA };
  if (dice.length === 3) return { tier: 'DOUBLE', mult: SIGMA_MULT.DOUBLE };

  // 5+ matching dice keep scaling past Omega: +0.8 per extra die.
  return { tier: 'OMEGA', mult: SIGMA_MULT.OMEGA + 0.8 * (dice.length - 4) };
}

export function tierLabel(tier: SigmaTier): string {
  switch (tier) {
    case 'SIGMA':
      return 'SIGMA';
    case 'DOUBLE':
      return 'DOUBLE SIGMA';
    case 'OMEGA':
      return 'ΩMEGA SIGMA';
    default:
      return '';
  }
}

export const TIER_RANK: Record<SigmaTier, number> = {
  NONE: 0,
  SIGMA: 1,
  DOUBLE: 2,
  OMEGA: 3,
};
