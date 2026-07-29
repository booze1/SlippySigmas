import type { EnemyDef, EncounterDef } from '../engine/types.js';

// Act 1 — "The Feed". 7 enemies, 2 elites, 1 phased boss.
// From docs/05-enemy-catalogue.md.
//
// Rule: the intent is a contract. Once shown it does not change except through
// player action. Non-attack intents cannot repeat back-to-back (engine/enemy.ts).

export const ENEMIES: EnemyDef[] = [
  {
    key: 'npc',
    name: 'NPC',
    hp: 12,
    tier: 'chaff',
    intents: [{ kind: 'SMASH', value: 7, weight: 100 }],
  },
  {
    key: 'npc_deluxe',
    name: 'NPC (Deluxe)',
    hp: 18,
    tier: 'chaff',
    intents: [
      { kind: 'SMASH', value: 9, weight: 70 },
      { kind: 'GUARD', value: 8, weight: 30 },
    ],
  },
  {
    key: 'sigma_slug',
    name: 'Sigma Slug',
    hp: 22,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 6, weight: 50 },
      { kind: 'BUFF', value: 3, weight: 50 },
    ],
  },
  {
    key: 'doomscroller',
    name: 'Doomscroller',
    hp: 26,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 5, weight: 40 },
      { kind: 'SMASH', value: 5, hits: 2, weight: 40 },
      { kind: 'DRAIN', value: 2, weight: 20 },
    ],
  },
  {
    key: 'touch_grass_golem',
    name: 'Touch Grass Golem',
    hp: 34,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 11, weight: 60 },
      { kind: 'GUARD', value: 12, weight: 40 },
    ],
  },
  {
    key: 'ratio_wraith',
    name: 'Ratio Wraith',
    hp: 28,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 8, weight: 45 },
      { kind: 'LOCK', value: 2, weight: 35 },
      { kind: 'SMASH', value: 12, weight: 20 },
    ],
  },
  {
    key: 'the_algorithm',
    name: 'The Algorithm',
    hp: 30,
    tier: 'basic',
    intents: [
      { kind: 'SUMMON', value: 1, summonKey: 'npc', weight: 40 },
      { kind: 'SMASH', value: 7, weight: 40 },
      { kind: 'CURSE', value: 1, weight: 20 },
    ],
  },

  // ------------------------------------------------------------- elites
  {
    key: 'mid',
    name: 'Mid',
    hp: 64,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 13, weight: 40 },
      { kind: 'GUARD', value: 15, weight: 30 },
      { kind: 'STICKY', value: 1, weight: 30 },
    ],
  },
  {
    key: 'the_grindset',
    name: 'The Grindset',
    hp: 72,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 10, weight: 50 },
      { kind: 'BUFF', value: 4, weight: 50 },
    ],
  },

  // --------------------------------------------------------------- boss
  {
    key: 'glizzy',
    name: 'Glizzy, the First Sigma',
    hp: 110,
    tier: 'boss',
    intents: [
      { kind: 'SMASH', value: 14, weight: 50 },
      { kind: 'GUARD', value: 18, weight: 30 },
      { kind: 'LOCK', value: 2, weight: 20 },
    ],
    phases: [
      {
        belowPct: 1.0,
        note: 'Phase 1',
        intents: [
          { kind: 'SMASH', value: 14, weight: 50 },
          { kind: 'GUARD', value: 18, weight: 30 },
          { kind: 'LOCK', value: 2, weight: 20 },
        ],
      },
      {
        // DOUBLE OR NOTHING rolls its own die and shows the result first.
        belowPct: 0.64,
        note: 'Phase 2 — Double or Nothing',
        intents: [
          { kind: 'SMASH', value: 14, weight: 35 },
          { kind: 'GUARD', value: 18, weight: 20 },
          { kind: 'LOCK', value: 2, weight: 15 },
          { kind: 'GAMBLE', value: 24, weight: 30, label: 'DOUBLE OR NOTHING' },
        ],
      },
      {
        // The teaching moment: non-Sigma damage is halved, so a player who has
        // been ignoring matching hits a wall and has to engage with the pillar.
        belowPct: 0.32,
        note: 'Phase 3 — non-Sigma hits deal 60%',
        nonSigmaResist: 0.6,
        intents: [
          { kind: 'SMASH', value: 20, weight: 60 },
          { kind: 'DRAIN', value: 4, weight: 40 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------- encounters
//
// Composition rules from docs/05 §Encounter Composition: never two summoners,
// never two Slip-drainers, and a healer always has a body in front of it.

export const ENCOUNTERS: EncounterDef[] = [
  { key: 'a1_tutorial', name: 'A lone NPC', kind: 'basic', enemies: ['npc'] },
  { key: 'a1_pair', name: 'Two NPCs', kind: 'basic', enemies: ['npc', 'npc'] },
  { key: 'a1_slug', name: 'Sigma Slug', kind: 'basic', enemies: ['sigma_slug'] },
  { key: 'a1_wraith', name: 'Ratio Wraith', kind: 'basic', enemies: ['ratio_wraith'] },
  { key: 'a1_scroll', name: 'Doomscroller + NPC', kind: 'basic', enemies: ['doomscroller', 'npc'] },
  { key: 'a1_golem', name: 'Touch Grass Golem', kind: 'basic', enemies: ['touch_grass_golem'] },
  {
    key: 'a1_algo',
    name: 'The Algorithm',
    kind: 'hard',
    enemies: ['the_algorithm', 'npc_deluxe'],
  },
  {
    key: 'a1_swarm',
    name: 'Slug, Wraith & NPC',
    kind: 'hard',
    enemies: ['sigma_slug', 'ratio_wraith', 'npc'],
  },
  {
    key: 'a1_wall',
    name: 'Golem & Deluxe',
    kind: 'hard',
    enemies: ['touch_grass_golem', 'npc_deluxe'],
  },
  { key: 'a1_elite_mid', name: 'ELITE — Mid', kind: 'elite', enemies: ['mid'] },
  {
    key: 'a1_elite_grind',
    name: 'ELITE — The Grindset',
    kind: 'elite',
    enemies: ['the_grindset'],
  },
  { key: 'a1_boss', name: 'BOSS — Glizzy', kind: 'boss', enemies: ['glizzy'] },
];
