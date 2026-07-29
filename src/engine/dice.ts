// Dice: definitions, rolling, faces, and trait queries.

import { WILD, type BagEntry, type Die, type DieDef, type DieTrait } from './types.js';
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

export function defOf(die: Die): DieDef | undefined {
  return DICE_DEFS[die.defKey];
}

export function traitOf(die: Die): DieTrait | undefined {
  return die.temp ? undefined : DICE_DEFS[die.defKey]?.trait;
}

/** Faces of a bag entry, honouring forge overrides. */
export function entryFaces(entry: BagEntry): number[] {
  return entry.faces ?? DICE_DEFS[entry.key]?.faces ?? [1, 2, 3, 4, 5, 6];
}

export function hasTrait(die: Die, trait: DieTrait): boolean {
  return traitOf(die) === trait;
}

export function isWild(die: Die): boolean {
  return die.face === WILD;
}

/** Highest face this die can show. WILD is excluded — it has no fixed value. */
export function crownOf(die: Die): number {
  const real = facesOf(die).filter((f) => f !== WILD);
  return real.length ? Math.max(...real) : 6;
}

export function floorOf(die: Die): number {
  const real = facesOf(die).filter((f) => f !== WILD);
  return real.length ? Math.min(...real) : 1;
}

/** Face as it counts for arithmetic. WILD is resolved by the caller. */
export function pipOf(die: Die): number {
  return isWild(die) ? 0 : die.face;
}

export function faceLabel(die: Die): string {
  return isWild(die) ? 'W' : String(die.face);
}

let dieCounter = 0;

export function makeDie(entry: string | BagEntry, rng: Rng): Die {
  const key = typeof entry === 'string' ? entry : entry.key;
  const override = typeof entry === 'string' ? undefined : entry.faces;
  const def = DICE_DEFS[key];
  if (!def) throw new Error(`Unknown die: ${key}`);
  const faces = override ?? def.faces;
  return {
    id: `d${dieCounter++}`,
    defKey: key,
    face: rng.pick(faces),
    nudges: 0,
    frozen: false,
    jammed: false,
    slot: null,
    // Forged dice carry their own face list; unforged ones read the definition.
    ...(override ? { faces: override } : {}),
  };
}

export function makeTempDie(face: number, from?: Die): Die {
  return {
    id: `t${dieCounter++}`,
    defKey: from?.defKey ?? 'standard_d6',
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

/** Reset so seeded runs produce identical die ids. */
export function resetDieCounter(): void {
  dieCounter = 0;
}
