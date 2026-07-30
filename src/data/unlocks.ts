// The unlock tree from docs/07-meta-progression.md §2.
//
// Locked principle: meta-progression adds VARIETY, never power. Everything here
// enters the shared run pool — it can now appear as a reward, in shops and in
// events. Nothing is equipped from the hub; the run still has to offer it.
//
// A run-1 player and a run-200 player have the same power ceiling. The veteran
// just has more paths to it.

export type UnlockKind = 'die' | 'skill' | 'hero' | 'feature';

export interface UnlockDef {
  key: string;
  kind: UnlockKind;
  /** Target: a die key, skill key, hero key, or feature flag. */
  target: string;
  cost: number;
  tier: 1 | 2 | 3 | 4;
}

export interface TierGate {
  tier: 1 | 2 | 3 | 4;
  label: string;
  /** Predicate inputs, checked against MetaState. */
  requiresRuns?: number;
  requiresAct3?: boolean;
  requiresWin?: boolean;
}

export const TIER_GATES: TierGate[] = [
  { tier: 1, label: 'Openers' },
  { tier: 2, label: 'Requires 3 runs completed', requiresRuns: 3 },
  { tier: 3, label: 'Requires reaching Act 3 once', requiresAct3: true },
  { tier: 4, label: 'Requires 1 run win', requiresWin: true },
];

export const UNLOCKS: UnlockDef[] = [
  // ------------------------------------------------------------- tier 1
  { key: 'u_loaded_d6', kind: 'die', target: 'loaded_d6', cost: 60, tier: 1 },
  { key: 'u_haymaker', kind: 'skill', target: 'haymaker', cost: 60, tier: 1 },
  { key: 'u_jab', kind: 'skill', target: 'jab', cost: 60, tier: 1 },
  { key: 'u_turtle', kind: 'skill', target: 'turtle', cost: 60, tier: 1 },
  { key: 'u_twin_d6', kind: 'die', target: 'twin_d6', cost: 90, tier: 1 },
  { key: 'u_sigma_slam', kind: 'skill', target: 'sigma_slam', cost: 90, tier: 1 },

  // ------------------------------------------------------------- tier 2
  { key: 'u_sharp_d8', kind: 'die', target: 'sharp_d8', cost: 140, tier: 2 },
  { key: 'u_chain_reaction', kind: 'skill', target: 'chain_reaction', cost: 140, tier: 2 },
  { key: 'u_kindle', kind: 'skill', target: 'kindle', cost: 140, tier: 2 },
  { key: 'u_overclock', kind: 'skill', target: 'overclock', cost: 140, tier: 2 },
  { key: 'u_slick_d6', kind: 'die', target: 'slick_d6', cost: 170, tier: 2 },
  { key: 'u_slots', kind: 'feature', target: 'slot_relics', cost: 200, tier: 2 },

  // ------------------------------------------------------------- tier 3
  { key: 'u_chameleon_d6', kind: 'die', target: 'chameleon_d6', cost: 260, tier: 3 },
  { key: 'u_fibonacci_d6', kind: 'die', target: 'fibonacci_d6', cost: 260, tier: 3 },
  { key: 'u_echo_d6', kind: 'die', target: 'echo_d6', cost: 260, tier: 3 },
  { key: 'u_bend_the_odds', kind: 'skill', target: 'bend_the_odds', cost: 240, tier: 3 },
  { key: 'u_death_by_1000', kind: 'skill', target: 'death_by_1000', cost: 240, tier: 3 },
  { key: 'u_colossal_l', kind: 'skill', target: 'colossal_l', cost: 240, tier: 3 },
  { key: 'u_vex', kind: 'hero', target: 'vex', cost: 400, tier: 3 },

  // ------------------------------------------------------------- tier 4
  { key: 'u_sigma_stone', kind: 'die', target: 'sigma_stone', cost: 500, tier: 4 },
  { key: 'u_the_slip', kind: 'die', target: 'the_slip', cost: 500, tier: 4 },
  { key: 'u_the_gambit', kind: 'skill', target: 'the_gambit', cost: 400, tier: 4 },
  { key: 'u_hand_of_sig', kind: 'skill', target: 'hand_of_sig', cost: 400, tier: 4 },
  { key: 'u_delete', kind: 'skill', target: 'delete', cost: 400, tier: 4 },
  { key: 'u_ophi', kind: 'hero', target: 'ophi', cost: 700, tier: 4 },
];

/**
 * Everything not in the tree is available from run 1. Listing the gated things
 * and subtracting is far less error-prone than maintaining two lists that have
 * to stay in sync.
 */
export const GATED_DICE = UNLOCKS.filter((u) => u.kind === 'die').map((u) => u.target);
export const GATED_SKILLS = UNLOCKS.filter((u) => u.kind === 'skill').map((u) => u.target);

/** Relics gated behind the tier-2 "slot relics" feature unlock. */
export const SLOT_RELICS = ['fifth_slot', 'sixth_slot'];

// ------------------------------------------------------------- ascension

export interface AscensionTier {
  tier: number;
  text: string;
}

export const ASCENSION: AscensionTier[] = [
  { tier: 1, text: 'Elites are more common.' },
  { tier: 2, text: 'Enemy HP +10%.' },
  { tier: 3, text: 'Start each run with a Cursed d6 in your bag.' },
  { tier: 4, text: 'Rest nodes heal 20% instead of 30%.' },
  { tier: 5, text: 'Enemy damage +10%.' },
  { tier: 6, text: 'Shops cost 25% more.' },
  { tier: 7, text: 'Slip cap 10 → 7.' },
  { tier: 8, text: 'Bosses gain +25% HP.' },
  { tier: 9, text: 'Enemy HP +10% again (cumulative +20%).' },
  { tier: 10, text: 'Unspent dice give Slip only every other turn.' },
  // Swapped down from tier 3. Removing a starting die is by far the harshest
  // modifier in the ladder — it took wins from 28% to 4% on its own, flattening
  // tiers 4-12 into one difficulty. Bag size cuts both ways (docs/02 §15).
  { tier: 11, text: 'Start each run with 1 fewer die.' },
  { tier: 12, text: 'OMEGA SIGMA multiplier reduced to ×3.0.' },
];

export const MAX_ASCENSION = ASCENSION.length;
