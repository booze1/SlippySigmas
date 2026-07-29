// 18 relics from docs/07-meta-progression.md §4.
// Passive gear, no slot limit, stacks for the whole run.

export interface RelicDef {
  key: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  text: string;
}

export const RELICS: RelicDef[] = [
  // ------------------------------------------------------------- common
  { key: 'warm_hands', name: 'Warm Hands', rarity: 'common', text: 'Start each fight with 2 extra Slip.' },
  { key: 'sharp', name: 'Sharp', rarity: 'common', text: '+2 damage per hit, applied after Sigma.' },
  { key: 'thick_skin', name: 'Thick Skin', rarity: 'common', text: '+8 max HP.' },
  { key: 'coin_purse', name: 'Coin Purse', rarity: 'common', text: '+25% gold from battles.' },
  { key: 'spare_die', name: 'Spare Die', rarity: 'common', text: 'Start each fight with 1 free reroll.' },

  // ----------------------------------------------------------- uncommon
  { key: 'big_bag', name: 'Big Bag', rarity: 'uncommon', text: '+1 bag capacity.' },
  { key: 'deep_pockets', name: 'Deep Pockets', rarity: 'uncommon', text: 'Slip cap 10 → 15.' },
  { key: 'fifth_slot', name: 'Fifth Slot', rarity: 'uncommon', text: '+1 skill slot.' },
  { key: 'hype_machine', name: 'Hype Machine', rarity: 'uncommon', text: 'Gain Hyped 1 whenever you Double Sigma.' },
  { key: 'second_opinion', name: 'Second Opinion', rarity: 'uncommon', text: 'Reward screens offer 4 skills instead of 3.' },
  { key: 'steady_grip', name: 'Steady Grip', rarity: 'uncommon', text: 'Immune to Jammed.' },

  // --------------------------------------------------------------- rare
  { key: 'the_multiplier', name: 'The Multiplier', rarity: 'rare', text: 'Sigma tiers become ×1.8 / ×3.0 / ×4.8.' },
  { key: 'sixth_slot', name: 'Sixth Slot', rarity: 'rare', text: '+1 skill slot (needs Fifth Slot).' },
  { key: 'perfect_pair', name: 'Perfect Pair', rarity: 'rare', text: 'The first Sigma each fight counts one tier higher.' },
  { key: 'momentum', name: 'Momentum', rarity: 'rare', text: 'Unspent dice give 2 Slip instead of 1.' },
  { key: 'overflow', name: 'Overflow', rarity: 'rare', text: 'Overkill damage carries to the next enemy.' },

  // ---------------------------------------------------------- legendary
  { key: 'whole_bag', name: 'The Whole Bag', rarity: 'legendary', text: '+2 bag capacity.' },
  {
    key: 'kingmaker',
    name: 'Kingmaker',
    rarity: 'legendary',
    // Guaranteeing a pair every single turn would invalidate the manipulation
    // lane outright, so it fires every OTHER turn — still exciting when it lands.
    text: 'Every other turn, one die is set to match another automatically.',
  },
];

export const RELIC_DEFS: Record<string, RelicDef> = Object.fromEntries(
  RELICS.map((r) => [r.key, r]),
);

export function hasRelic(relics: string[], key: string): boolean {
  return relics.includes(key);
}
