// SIGMA — the match bonus. See docs/01-combat-system.md §4.
//
// All dice slotted into a skill showing the same face amplifies it.
// A single die Sigmas only on its "crown" face (its highest possible face),
// which keeps 1d skills in the Sigma economy without making them free.

import type { Die, SigmaTier } from './types.js';
import { crownOf } from './dice.js';

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

export function evaluateSigma(dice: Die[]): SigmaResult {
  if (dice.length === 0) return { tier: 'NONE', mult: 1 };

  const allSame = dice.every((d) => d.face === dice[0].face);
  if (!allSame) return { tier: 'NONE', mult: 1 };

  if (dice.length === 1) {
    // Crown-face rule: a lone die only Sigmas at its ceiling.
    return dice[0].face === crownOf(dice[0])
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
