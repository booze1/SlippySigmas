import type { Skill } from '../engine/types.js';

// Pure content. Trivially serializable to JSON for a future data pipeline.
export const SKILLS: Skill[] = [
  {
    "key": "cleave",
    "name": "Cleave",
    "lane": "damage",
    "cost": { "count": 2, "min": 2 },
    "effects": [{ "type": "damage", "power": 1.0 }],
    "blurb": "Deal PIP × 1.0."
  },
  {
    "key": "haymaker",
    "name": "Haymaker",
    "lane": "damage",
    "cost": { "count": 2, "min": 4 },
    "effects": [{ "type": "damage", "power": 1.3 }],
    "blurb": "Deal PIP × 1.3."
  },
  {
    "key": "sigma_slam",
    "name": "Sigma Slam",
    "lane": "damage",
    "cost": { "count": 3, "min": 4 },
    "effects": [{ "type": "damage", "power": 1.4 }],
    "blurb": "Deal PIP × 1.4."
  },
  {
    "key": "colossal_l",
    "name": "Colossal L",
    "lane": "damage",
    "cost": { "count": 4, "min": 5 },
    "effects": [{ "type": "damage", "power": 1.8 }],
    "blurb": "Deal PIP × 1.8. Omega bait."
  },
  {
    "key": "jab",
    "name": "Jab",
    "lane": "combo",
    "cost": { "count": 1 },
    "effects": [{ "type": "damage", "power": 1.5 }],
    "blurb": "Deal PIP × 1.5."
  },
  {
    "key": "softening",
    "name": "Softening",
    "lane": "combo",
    "cost": { "count": 2 },
    "effects": [
      { "type": "damage", "power": 0.5 },
      { "type": "brittle", "amount": 15, "sigmaAmount": 35 }
    ],
    "blurb": "Deal PIP × 0.5. Apply Brittle 15 (Sigma: 35)."
  },
  {
    "key": "kindle",
    "name": "Kindle",
    "lane": "combo",
    "cost": { "count": 2 },
    "effects": [{ "type": "burn", "power": 1.0, "sigmaPower": 2.0 }],
    "blurb": "Apply Burn equal to PIP (Sigma: PIP × 2)."
  },
  {
    "key": "fumble",
    "name": "Fumble",
    "lane": "manipulation",
    "cost": { "count": 1 },
    "effects": [{ "type": "slip", "amount": 2, "sigmaAmount": 4 }],
    "blurb": "Gain 2 Slip (Sigma: 4)."
  },
  {
    "key": "sleight",
    "name": "Sleight",
    "lane": "manipulation",
    "cost": { "count": 2 },
    "effects": [
      { "type": "damage", "power": 0.8 },
      { "type": "slip", "amount": 1, "sigmaAmount": 3 }
    ],
    "blurb": "Deal PIP × 0.8. Gain 1 Slip (Sigma: 3)."
  },
  {
    "key": "overclock",
    "name": "Overclock",
    "lane": "manipulation",
    "cost": { "count": 2, "min": 4 },
    "effects": [
      { "type": "damage", "power": 1.1 },
      { "type": "slip", "amount": 2, "sigmaAmount": 4 }
    ],
    "blurb": "Deal PIP × 1.1. Gain 2 Slip (Sigma: 4)."
  },
  {
    "key": "brace",
    "name": "Brace",
    "lane": "defense",
    "cost": { "count": 1 },
    "effects": [{ "type": "block", "power": 1.8 }],
    "blurb": "Gain Block PIP × 1.8."
  },
  {
    "key": "turtle",
    "name": "Turtle",
    "lane": "defense",
    "cost": { "count": 2, "max": 3 },
    "effects": [{ "type": "block", "power": 2.5 }],
    "blurb": "Gain Block PIP × 2.5. Eats your low dice."
  },
  {
    "key": "terminal_velocity",
    "name": "Terminal Velocity",
    "lane": "damage",
    "cost": { "count": 2, "exact": 6 },
    "effects": [{ "type": "damage", "power": 2.2 }],
    "blurb": "Deal PIP × 2.2. Always Sigma by definition."
  },
  {
    "key": "spread",
    "name": "Spread",
    "lane": "combo",
    "cost": { "count": 2 },
    "effects": [{ "type": "damage", "power": 0.6 }],
    "blurb": "Deal PIP × 0.6. (AoE once multiple enemies land.)"
  }
];
