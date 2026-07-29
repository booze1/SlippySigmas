import { WILD, type DieDef } from '../engine/types.js';

// All 22 dice from docs/03-dice-catalogue.md. Pure content — no logic here.
// Trait behaviour lives in src/engine/dice.ts and src/engine/combat.ts.

export const DICE: DieDef[] = [
  // ------------------------------------------------------------- common
  {
    key: 'standard_d6',
    name: 'Standard d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'common',
    note: 'The baseline.',
  },
  {
    key: 'chipped_d6',
    name: 'Chipped d6',
    faces: [1, 1, 2, 3, 4, 5],
    rarity: 'common',
    note: 'Extra 1s mean extra Slip income.',
  },
  {
    key: 'flat_d4',
    name: 'Flat d4',
    faces: [1, 2, 3, 4],
    rarity: 'common',
    note: 'Low ceiling, 25% match odds on any face.',
  },
  {
    key: 'heavy_d6',
    name: 'Heavy d6',
    faces: [2, 2, 3, 3, 4, 4],
    rarity: 'common',
    note: 'Never 1 or 6. Reliable mid-range.',
  },
  {
    key: 'steel_d6',
    name: 'Steel d6',
    faces: [3, 3, 3, 4, 4, 4],
    rarity: 'common',
    note: 'Pairs constantly, ceiling is low.',
  },
  {
    key: 'cracked_d6',
    name: 'Cracked d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'common',
    trait: 'cracked',
    note: 'Rolls twice on the first turn of a fight, keeps the higher.',
  },

  // ----------------------------------------------------------- uncommon
  {
    key: 'loaded_d6',
    name: 'Loaded d6',
    faces: [3, 3, 4, 4, 5, 5],
    rarity: 'uncommon',
    note: '33% match odds in the useful range. The workhorse Sigma die.',
  },
  {
    key: 'twin_d6',
    name: 'Twin d6',
    faces: [2, 2, 4, 4, 6, 6],
    rarity: 'uncommon',
    note: 'Evens only. Enormous match odds, useless for ODD requirements.',
  },
  {
    key: 'odd_d6',
    name: 'Odd d6',
    faces: [1, 1, 3, 3, 5, 5],
    rarity: 'uncommon',
    note: 'Odds only.',
  },
  {
    key: 'sharp_d8',
    name: 'Sharp d8',
    faces: [1, 2, 3, 4, 5, 6, 7, 8],
    rarity: 'uncommon',
    note: 'Higher ceiling, worse matching.',
  },
  {
    key: 'greedy_d6',
    name: 'Greedy d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'uncommon',
    trait: 'greedy',
    note: 'On a 6, gain 4 gold.',
  },
  {
    key: 'slick_d6',
    name: 'Slick d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'uncommon',
    trait: 'slick',
    note: 'The first NUDGE on this die each turn is free.',
  },
  {
    key: 'burning_d6',
    name: 'Burning d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'uncommon',
    trait: 'burning',
    note: 'Slotted into a damage skill, applies Burn equal to its face.',
  },
  {
    key: 'hollow_d6',
    name: 'Hollow d6',
    faces: [0, 0, 3, 3, 6, 6],
    rarity: 'uncommon',
    note: 'Swingy. A 0 still satisfies slot counts and matches other 0s.',
  },

  // --------------------------------------------------------------- rare
  {
    key: 'chameleon_d6',
    name: 'Chameleon d6',
    faces: [1, 2, 3, 4, 5, WILD],
    rarity: 'rare',
    note: 'WILD matches any face; its PIP equals the highest other die in the skill.',
  },
  {
    key: 'fibonacci_d6',
    name: 'Fibonacci d6',
    faces: [1, 2, 3, 5, 8, 13],
    rarity: 'rare',
    note: 'Massive ceiling, near-zero natural matching. Built for CLONE and SET.',
  },
  {
    key: 'mirror_d6',
    name: 'Mirror d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'rare',
    trait: 'mirror',
    note: 'At ROLL, copies the face of the die to its immediate left.',
  },
  {
    key: 'echo_d6',
    name: 'Echo d6',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'rare',
    trait: 'echo',
    note: 'When slotted, leaves a one-use copy in the tray. Once per turn.',
  },
  {
    key: 'cursed_d6',
    name: 'Cursed d6',
    faces: [1, 1, 6, 6, 6, 6],
    rarity: 'rare',
    trait: 'cursed',
    note: '67% odds of a 6. Each 1 rolled deals 3 damage to you.',
  },
  {
    key: 'bloated_d10',
    name: 'Bloated d10',
    faces: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    rarity: 'rare',
    note: 'Enormous PIP, 10% match odds.',
  },

  // ---------------------------------------------------------- legendary
  {
    key: 'sigma_stone',
    name: 'Sigma Stone',
    faces: [5, 5, 5, 5, 5, 5],
    rarity: 'legendary',
    note: 'Always 5. Never fails, never scales.',
  },
  {
    key: 'the_slip',
    name: 'The Slip',
    faces: [1, 2, 3, 4, 5, 6],
    rarity: 'legendary',
    trait: 'theslip',
    note: 'One free SET per fight. Raises your Slip cap by 5.',
  },
];
