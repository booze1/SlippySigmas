import type { EnemyDef } from '../engine/types.js';

// Pure content. Trivially serializable to JSON for a future data pipeline.
export const ENEMIES: EnemyDef[] = [
  {
    "key": "npc",
    "name": "NPC",
    "hp": 40,
    "intents": [{ "kind": "SMASH", "value": 7, "weight": 100 }]
  },
  {
    "key": "sigma_slug",
    "name": "Sigma Slug",
    "hp": 22,
    "intents": [
      { "kind": "SMASH", "value": 6, "weight": 50 },
      { "kind": "BUFF", "value": 3, "weight": 50 }
    ]
  },
  {
    "key": "doomscroller",
    "name": "Doomscroller",
    "hp": 26,
    "intents": [
      { "kind": "SMASH", "value": 5, "weight": 40 },
      { "kind": "SMASH", "value": 10, "weight": 40 },
      { "kind": "DRAIN", "value": 2, "weight": 20 }
    ]
  },
  {
    "key": "touch_grass_golem",
    "name": "Touch Grass Golem",
    "hp": 34,
    "intents": [
      { "kind": "SMASH", "value": 11, "weight": 60 },
      { "kind": "GUARD", "value": 12, "weight": 40 }
    ]
  },
  {
    "key": "ratio_wraith",
    "name": "Ratio Wraith",
    "hp": 28,
    "intents": [
      { "kind": "SMASH", "value": 8, "weight": 45 },
      { "kind": "LOCK", "value": 2, "weight": 35 },
      { "kind": "SMASH", "value": 12, "weight": 20 }
    ]
  },
  {
    "key": "mid",
    "name": "Mid",
    "hp": 64,
    "intents": [
      { "kind": "SMASH", "value": 13, "weight": 40 },
      { "kind": "GUARD", "value": 15, "weight": 30 },
      { "kind": "DRAIN", "value": 3, "weight": 30 }
    ]
  }
];
