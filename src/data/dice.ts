import type { DieDef } from '../engine/types.js';

// Pure content. Trivially serializable to JSON for a future data pipeline.
export const DICE: DieDef[] = [
  {
    "key": "standard_d6",
    "name": "Standard d6",
    "faces": [1, 2, 3, 4, 5, 6],
    "rarity": "common",
    "note": "The baseline."
  },
  {
    "key": "chipped_d6",
    "name": "Chipped d6",
    "faces": [1, 1, 2, 3, 4, 5],
    "rarity": "common",
    "note": "Extra 1s mean extra Slip income."
  },
  {
    "key": "flat_d4",
    "name": "Flat d4",
    "faces": [1, 2, 3, 4],
    "rarity": "common",
    "note": "Low ceiling, 25% match odds."
  },
  {
    "key": "heavy_d6",
    "name": "Heavy d6",
    "faces": [2, 2, 3, 3, 4, 4],
    "rarity": "common",
    "note": "Never 1 or 6. Reliable mid-range."
  },
  {
    "key": "steel_d6",
    "name": "Steel d6",
    "faces": [3, 3, 3, 4, 4, 4],
    "rarity": "common",
    "note": "Pairs constantly, low ceiling."
  },
  {
    "key": "loaded_d6",
    "name": "Loaded d6",
    "faces": [3, 3, 4, 4, 5, 5],
    "rarity": "uncommon",
    "note": "33% match odds in the useful range."
  },
  {
    "key": "twin_d6",
    "name": "Twin d6",
    "faces": [2, 2, 4, 4, 6, 6],
    "rarity": "uncommon",
    "note": "Evens only. Huge match odds."
  },
  {
    "key": "odd_d6",
    "name": "Odd d6",
    "faces": [1, 1, 3, 3, 5, 5],
    "rarity": "uncommon",
    "note": "Odds only."
  },
  {
    "key": "sharp_d8",
    "name": "Sharp d8",
    "faces": [1, 2, 3, 4, 5, 6, 7, 8],
    "rarity": "uncommon",
    "note": "Higher ceiling, worse matching."
  },
  {
    "key": "hollow_d6",
    "name": "Hollow d6",
    "faces": [0, 0, 3, 3, 6, 6],
    "rarity": "uncommon",
    "note": "0s still satisfy slot counts."
  },
  {
    "key": "fibonacci_d6",
    "name": "Fibonacci d6",
    "faces": [1, 2, 3, 5, 8, 13],
    "rarity": "rare",
    "note": "Massive ceiling, near-zero natural matching."
  },
  {
    "key": "cursed_d6",
    "name": "Cursed d6",
    "faces": [1, 1, 6, 6, 6, 6],
    "rarity": "rare",
    "note": "67% odds of a 6. Each 1 rolled deals 3 damage to you."
  },
  {
    "key": "bloated_d10",
    "name": "Bloated d10",
    "faces": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "rarity": "rare",
    "note": "Enormous PIP, 10% match odds."
  },
  {
    "key": "sigma_stone",
    "name": "Sigma Stone",
    "faces": [5, 5, 5, 5, 5, 5],
    "rarity": "legendary",
    "note": "Always 5. Never fails, never scales."
  }
];
