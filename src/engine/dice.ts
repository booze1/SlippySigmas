// Dice: definitions, rolling, and face queries.

import type { Die, DieDef } from './types.js';
import type { Rng } from './rng.js';
import { DICE } from '../data/dice.js';

export const DICE_DEFS: Record<string, DieDef> = Object.fromEntries(
  DICE.map((d) => [d.key, d]),
);

export const DICE_LIST: DieDef[] = DICE;

export function facesOf(die: Die): number[] {
  if (die.faces) return die.faces;
  return DICE_DEFS[die.defKey]?.faces ?? [1, 2, 3, 4, 5, 6];
}

export function crownOf(die: Die): number {
  return Math.max(...facesOf(die));
}

export function floorOf(die: Die): number {
  return Math.min(...facesOf(die));
}

export function defOf(die: Die): DieDef | undefined {
  return DICE_DEFS[die.defKey];
}

let dieCounter = 0;

export function makeDie(defKey: string, rng: Rng): Die {
  const def = DICE_DEFS[defKey];
  if (!def) throw new Error(`Unknown die: ${defKey}`);
  return {
    id: `d${dieCounter++}`,
    defKey,
    face: rng.pick(def.faces),
    nudges: 0,
    frozen: false,
    jammed: false,
    slot: null,
  };
}

export function makeTempDie(face: number): Die {
  return {
    id: `t${dieCounter++}`,
    defKey: 'standard_d6',
    face,
    nudges: 0,
    frozen: false,
    jammed: false,
    slot: null,
    temp: true,
    faces: [face],
  };
}

export function rollDie(die: Die, rng: Rng): void {
  die.face = rng.pick(facesOf(die));
}

/** Reset the counter so seeded runs produce identical die ids. */
export function resetDieCounter(): void {
  dieCounter = 0;
}
