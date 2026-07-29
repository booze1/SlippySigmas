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
]
;

// ============================================================ ACT 2 — The Discourse
// Enemies interact with each other and with your bag. Punishes single-target
// builds and one-big-swing builds.

export const ACT2: EnemyDef[] = [
  {
    key: 'reply_guy',
    name: 'Reply Guy',
    hp: 45,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 12, weight: 50 },
      { kind: 'COUNTER', value: 50, weight: 50 },
    ],
  },
  {
    key: 'copypasta',
    name: 'Copypasta',
    hp: 52,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 14, weight: 60 },
      { kind: 'CLONE_SELF', value: 1, weight: 40 },
    ],
  },
  {
    key: 'gooner',
    name: 'Gooner',
    hp: 38,
    tier: 'basic',
    intents: [
      { kind: 'DRAIN', value: 3, weight: 45 },
      { kind: 'SMASH', value: 10, weight: 55 },
    ],
  },
  {
    key: 'rage_bait',
    name: 'Rage Bait',
    hp: 60,
    tier: 'basic',
    intents: [
      { kind: 'TAUNT', value: 1, weight: 40 },
      { kind: 'SMASH', value: 16, weight: 60 },
    ],
  },
  {
    key: 'mogger',
    name: 'Mogger',
    hp: 55,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 18, weight: 70 },
      { kind: 'SMASH', value: 26, weight: 30 },
    ],
  },
  {
    key: 'shadowban',
    name: 'Shadowban',
    hp: 48,
    tier: 'basic',
    intents: [
      { kind: 'CURSE', value: 2, weight: 40 },
      { kind: 'SMASH', value: 11, weight: 40 },
      { kind: 'GUARD', value: 14, weight: 20 },
    ],
  },
  {
    key: 'feedback_loop',
    name: 'The Feedback Loop',
    hp: 70,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 9, hits: 2, weight: 50 },
      { kind: 'HEAL', value: 12, weight: 50 },
    ],
  },

  {
    key: 'two_factor',
    name: 'Two-Factor',
    hp: 138,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 22, weight: 40 },
      { kind: 'GUARD', value: 20, weight: 30 },
      { kind: 'LOCK', value: 3, weight: 30 },
    ],
  },
  {
    key: 'the_grief',
    name: 'The Grief',
    hp: 145,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 24, weight: 50 },
      { kind: 'DRAIN', value: 8, weight: 25 },
      { kind: 'LOCK', value: 99, weight: 25, label: 'JAM ALL' },
    ],
  },

  {
    key: 'maincharacter',
    name: 'The Maincharacter',
    hp: 220,
    tier: 'boss',
    intents: [{ kind: 'SMASH', value: 24, weight: 100 }],
    phases: [
      {
        belowPct: 1.0,
        note: 'Phase 1',
        intents: [
          { kind: 'SMASH', value: 24, weight: 40 },
          { kind: 'GUARD', value: 25, weight: 30 },
          { kind: 'SUMMON', value: 1, summonKey: 'reply_guy', weight: 30 },
        ],
      },
      {
        // Mirrors your own game back at you — its damage is its own PIP roll.
        belowPct: 0.68,
        note: 'Phase 2 — mirrors your bag',
        intents: [
          { kind: 'SMASH', value: 24, weight: 35 },
          { kind: 'GAMBLE', value: 30, weight: 45, label: 'MIRROR' },
          { kind: 'GUARD', value: 25, weight: 20 },
        ],
      },
      {
        belowPct: 0.36,
        note: 'Phase 3 — heals unless Double Sigma\'d',
        intents: [
          { kind: 'SMASH', value: 34, weight: 50 },
          { kind: 'LOCK', value: 3, weight: 30 },
          { kind: 'HEAL', value: 25, weight: 20 },
        ],
      },
    ],
  },
];

// ============================================================ ACT 3 — The Timeline
// Everything is a build check. Assumes 6-7 dice and a coherent plan.

export const ACT3: EnemyDef[] = [
  {
    key: 'brainrot',
    name: 'Brainrot',
    hp: 95,
    tier: 'basic',
    intents: [
      { kind: 'CURSE', value: 3, weight: 35 },
      { kind: 'SMASH', value: 22, weight: 45 },
      { kind: 'SCRAMBLE', value: 1, weight: 20 },
    ],
  },
  {
    key: 'final_boss_music',
    name: 'Final Boss Music',
    hp: 110,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 28, weight: 60 },
      { kind: 'BUFF', value: 6, weight: 40 },
    ],
  },
  {
    key: 'ohio',
    name: 'Ohio',
    hp: 130,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 20, hits: 2, weight: 50 },
      { kind: 'GUARD', value: 30, weight: 30 },
      { kind: 'SUMMON', value: 1, summonKey: 'npc_final', weight: 20 },
    ],
  },
  {
    key: 'the_lore',
    name: 'The Lore',
    hp: 88,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 24, weight: 40 },
      { kind: 'BUFF', value: 5, weight: 60, label: 'STACK' },
    ],
  },
  {
    key: 'skibidi_sovereign',
    name: 'Skibidi Sovereign',
    hp: 120,
    tier: 'basic',
    intents: [
      { kind: 'LOCK', value: 3, weight: 30 },
      { kind: 'SMASH', value: 26, weight: 40 },
      { kind: 'DRAIN', value: 5, weight: 30 },
    ],
  },
  {
    key: 'npc_final',
    name: 'NPC (Final Form)',
    hp: 102,
    tier: 'basic',
    // Still does one thing. It is just a much bigger thing now.
    intents: [{ kind: 'SMASH', value: 30, weight: 100 }],
  },
  {
    key: 'touch_grass_titan',
    name: 'Touch Grass Titan',
    hp: 128,
    tier: 'basic',
    intents: [
      { kind: 'SMASH', value: 25, weight: 40 },
      { kind: 'GUARD', value: 35, weight: 35 },
      { kind: 'HEAL', value: 20, weight: 25 },
    ],
  },

  {
    key: 'the_ratio',
    name: 'The Ratio',
    hp: 255,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 38, weight: 40 },
      { kind: 'INVERT', value: 1, weight: 30 },
      { kind: 'GUARD', value: 40, weight: 30 },
    ],
  },
  {
    key: 'cancelled',
    name: 'Cancelled',
    hp: 268,
    tier: 'elite',
    intents: [
      { kind: 'SMASH', value: 34, weight: 40 },
      { kind: 'REMOVE_DIE', value: 1, weight: 30 },
      { kind: 'SMASH', value: 50, weight: 30 },
    ],
  },

  {
    key: 'algorithm_true',
    name: 'The Algorithm (True Form)',
    hp: 420,
    tier: 'boss',
    intents: [{ kind: 'SMASH', value: 42, weight: 100 }],
    phases: [
      {
        belowPct: 1.0,
        note: 'Phase 1',
        intents: [
          { kind: 'SMASH', value: 42, weight: 40 },
          { kind: 'GUARD', value: 45, weight: 30 },
          { kind: 'SUMMON', value: 1, summonKey: 'npc_final', weight: 30 },
        ],
      },
      {
        belowPct: 0.71,
        note: 'Phase 2 — adapts to your Sigma tier',
        intents: [
          { kind: 'SMASH', value: 42, weight: 45 },
          { kind: 'INVERT', value: 1, weight: 25 },
          { kind: 'GUARD', value: 45, weight: 30 },
        ],
      },
      {
        belowPct: 0.40,
        note: 'Phase 3',
        intents: [
          { kind: 'SMASH', value: 55, weight: 40 },
          { kind: 'LOCK', value: 99, weight: 20, label: 'JAM ALL' },
          { kind: 'DRAIN', value: 99, weight: 20, label: 'DRAIN ALL' },
          { kind: 'SCRAMBLE', value: 1, weight: 20 },
        ],
      },
      {
        // The closing statement: after a whole run learning to bend dice, the
        // last fight is a naked roll — but you built the bag that wins it.
        belowPct: 0.14,
        note: 'Phase 4 — FINAL ROLL',
        intents: [{ kind: 'FINAL_ROLL', value: 1, weight: 100, label: 'FINAL ROLL' }],
      },
    ],
  },
];

ENEMIES.push(...ACT2, ...ACT3);

// ================================================================ encounters
//
// Composition rules from docs/05: never two summoners, never two Slip-drainers,
// and a healer always has a body in front of it.

export const ENCOUNTERS: EncounterDef[] = [
  // ---- Act 1
  { key: 'a1_tutorial', name: 'A lone NPC', kind: 'basic', enemies: ['npc'] },
  { key: 'a1_pair', name: 'Two NPCs', kind: 'basic', enemies: ['npc', 'npc'] },
  { key: 'a1_slug', name: 'Sigma Slug', kind: 'basic', enemies: ['sigma_slug'] },
  { key: 'a1_wraith', name: 'Ratio Wraith', kind: 'basic', enemies: ['ratio_wraith'] },
  { key: 'a1_scroll', name: 'Doomscroller + NPC', kind: 'basic', enemies: ['doomscroller', 'npc'] },
  { key: 'a1_golem', name: 'Touch Grass Golem', kind: 'basic', enemies: ['touch_grass_golem'] },
  { key: 'a1_algo', name: 'The Algorithm', kind: 'hard', enemies: ['the_algorithm', 'npc_deluxe'] },
  { key: 'a1_swarm', name: 'Slug, Wraith & NPC', kind: 'hard', enemies: ['sigma_slug', 'ratio_wraith', 'npc'] },
  { key: 'a1_wall', name: 'Golem & Deluxe', kind: 'hard', enemies: ['touch_grass_golem', 'npc_deluxe'] },
  { key: 'a1_elite_mid', name: 'ELITE — Mid', kind: 'elite', enemies: ['mid'] },
  { key: 'a1_elite_grind', name: 'ELITE — The Grindset', kind: 'elite', enemies: ['the_grindset'] },
  { key: 'a1_boss', name: 'BOSS — Glizzy', kind: 'boss', enemies: ['glizzy'] },

  // ---- Act 2
  { key: 'a2_reply', name: 'Reply Guy', kind: 'basic', enemies: ['reply_guy'] },
  { key: 'a2_goon', name: 'Gooner + Reply Guy', kind: 'basic', enemies: ['gooner', 'reply_guy'] },
  { key: 'a2_mog', name: 'Mogger', kind: 'basic', enemies: ['mogger'] },
  { key: 'a2_copy', name: 'Copypasta', kind: 'basic', enemies: ['copypasta'] },
  { key: 'a2_shadow', name: 'Shadowban + Mogger', kind: 'basic', enemies: ['shadowban', 'mogger'] },
  { key: 'a2_bait', name: 'Rage Bait + Shadowban', kind: 'hard', enemies: ['rage_bait', 'shadowban'] },
  { key: 'a2_loop', name: 'Feedback Loop behind Rage Bait', kind: 'hard', enemies: ['rage_bait', 'feedback_loop'] },
  { key: 'a2_crowd', name: 'Copypasta, Gooner & Reply Guy', kind: 'hard', enemies: ['copypasta', 'gooner', 'reply_guy'] },
  { key: 'a2_elite_2fa', name: 'ELITE — Two-Factor', kind: 'elite', enemies: ['two_factor'] },
  { key: 'a2_elite_grief', name: 'ELITE — The Grief', kind: 'elite', enemies: ['the_grief'] },
  { key: 'a2_boss', name: 'BOSS — The Maincharacter', kind: 'boss', enemies: ['maincharacter'] },

  // ---- Act 3
  { key: 'a3_npc', name: 'NPC (Final Form)', kind: 'basic', enemies: ['npc_final'] },
  { key: 'a3_rot', name: 'Brainrot', kind: 'basic', enemies: ['brainrot'] },
  { key: 'a3_lore', name: 'The Lore', kind: 'basic', enemies: ['the_lore'] },
  { key: 'a3_ohio', name: 'Ohio', kind: 'basic', enemies: ['ohio'] },
  { key: 'a3_skibidi', name: 'Skibidi Sovereign', kind: 'basic', enemies: ['skibidi_sovereign'] },
  { key: 'a3_music', name: 'Final Boss Music + NPC', kind: 'hard', enemies: ['final_boss_music', 'npc_final'] },
  { key: 'a3_titan', name: 'Touch Grass Titan + Lore', kind: 'hard', enemies: ['touch_grass_titan', 'the_lore'] },
  { key: 'a3_end', name: 'Brainrot, Skibidi & NPC', kind: 'hard', enemies: ['brainrot', 'skibidi_sovereign', 'npc_final'] },
  { key: 'a3_elite_ratio', name: 'ELITE — The Ratio', kind: 'elite', enemies: ['the_ratio'] },
  { key: 'a3_elite_cancel', name: 'ELITE — Cancelled', kind: 'elite', enemies: ['cancelled'] },
  { key: 'a3_boss', name: 'BOSS — The Algorithm', kind: 'boss', enemies: ['algorithm_true'] },
];

/** Encounters available to a given act, by kind. */
export function encountersFor(act: number, kind: EncounterDef['kind']): EncounterDef[] {
  return ENCOUNTERS.filter((e) => e.key.startsWith(`a${act}_`) && e.kind === kind);
}
