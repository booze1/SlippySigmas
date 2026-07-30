// Three heroes from docs/07-meta-progression.md §3.
//
// Each hero is a different relationship with SLIP, because that is the pillar.
// The three map to the three ways you can beat randomness: correct it (Sig,
// Nudge), reroll past it (Vex, Reroll), or lock it down (Ophi, Freeze). Same
// pillar, three verbs, three completely different games.

export type HeroPassive = 'freeNudge' | 'freeReroll' | 'freeFreeze';

export interface HeroDef {
  key: string;
  name: string;
  title: string;
  maxHp: number;
  bag: string[];
  loadout: string[];
  /** Relic granted at run start. Not in the drop pool. */
  startRelic: string;
  passive: HeroPassive;
  passiveText: string;
  blurb: string;
}

export const HEROES: HeroDef[] = [
  {
    key: 'sig',
    name: 'SIG',
    title: 'The Fixer',
    maxHp: 60,
    bag: ['standard_d6', 'standard_d6', 'standard_d6', 'standard_d6'],
    loadout: ['softening', 'cleave', 'fumble', 'brace'],
    startRelic: 'warm_hands',
    passive: 'freeNudge',
    passiveText: 'Steady Hands — the first NUDGE each turn is free.',
    blurb: 'The baseline. Generous Slip economy, no gimmicks. Corrects the roll a pip at a time.',
  },
  {
    key: 'vex',
    name: 'VEX',
    title: 'The Gambler',
    maxHp: 48,
    bag: ['standard_d6', 'standard_d6', 'standard_d6', 'cursed_d6'],
    loadout: ['ratio', 'haymaker', 'reset_button', 'brace'],
    startRelic: 'loaded_deck',
    passive: 'freeReroll',
    passiveText: 'Double or Nothing — REROLL is free, but every reroll after the first each turn costs 2 HP.',
    blurb: 'Low HP, free rerolls, higher Sigma ceiling. Churns the bag until it obeys, and pays in blood.',
  },
  {
    key: 'ophi',
    name: 'OPHI',
    title: 'The Architect',
    maxHp: 70,
    // FOUR dice, not five. Simulation had Ophi at 68% wins with zero deaths
    // before Act 3 while Sig managed 25% — because a 5th starting die is worth
    // far more than it looks. Bag size is the strongest damage lever in the
    // game (docs/02 §12 Finding D is why the cap came down to 7), so +1 die on
    // top of +10 HP, a free verb and a compounding relic was every advantage at
    // once. Her identity is consistency and the long fight, not volume.
    bag: ['heavy_d6', 'heavy_d6', 'heavy_d6', 'heavy_d6'],
    loadout: ['immovable', 'grindset', 'greased_palms', 'softening'],
    startRelic: 'slow_build',
    passive: 'freeFreeze',
    passiveText: 'Blueprint — FREEZE is free and lasts 2 turns.',
    blurb: 'Consistent low dice and free freezing. Builds a perfect hand over three turns, then detonates. The anti-Vex.',
  },
];

export const HERO_DEFS: Record<string, HeroDef> = Object.fromEntries(
  HEROES.map((h) => [h.key, h]),
);

/** Hero-only relics. Never appear as drops or shop stock. */
export const HERO_RELICS = ['loaded_deck', 'slow_build'];
