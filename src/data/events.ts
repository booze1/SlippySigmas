// 14 events from docs/06-run-structure.md §5.
//
// Design rule: no event is purely free. Every "gain" is paired with a cost in
// HP, gold, a die, or an opportunity. Events that are strictly good are just
// delayed rewards with extra clicks.

export type EventAction =
  | { kind: 'heal'; amount: number }
  | { kind: 'healPct'; pct: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'maxHp'; amount: number }
  | { kind: 'addDie'; die?: string; rarity?: 'common' | 'uncommon' | 'rare' | 'legendary' }
  | { kind: 'removeDie' }
  | { kind: 'loseRandomDie' }
  | { kind: 'duplicateDie' }
  | { kind: 'upgradeAllDiceLow' }   // Sigma Shrine: duplicate each die's lowest face
  | { kind: 'sharpenDie' }          // +1 to every face on one die
  | { kind: 'mirrorLowDice' }       // swap two lowest dice for copies of the highest
  | { kind: 'slipCap'; amount: number }
  | { kind: 'startSlip'; amount: number }
  | { kind: 'relic'; rarity?: 'rare' }
  | { kind: 'fightElite'; doubleReward: true }
  | { kind: 'skipNode' }
  | { kind: 'rollDie'; outcomes: { max: number; then: EventAction[] }[] }
  | { kind: 'nothing' };

export interface EventChoice {
  label: string;
  detail?: string;
  cost?: { gold?: number };
  actions: EventAction[];
}

export interface EventDef {
  key: string;
  name: string;
  text: string;
  choices: EventChoice[];
}

export const EVENTS: EventDef[] = [
  {
    key: 'dice_goblin',
    name: 'The Dice Goblin',
    text: 'It rattles a cup at you. "Two of yours for one of mine. Mine is better. Probably."',
    choices: [
      { label: 'Trade 2 dice for 1 rare', actions: [{ kind: 'removeDie' }, { kind: 'removeDie' }, { kind: 'addDie', rarity: 'rare' }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'weighted_offer',
    name: 'Weighted Offer',
    text: 'A merchant slides a brass die across the table. It lands on 4. Twice.',
    choices: [
      { label: 'Take the Loaded d6', actions: [{ kind: 'addDie', die: 'loaded_d6' }] },
      { label: 'Take 60 gold instead', actions: [{ kind: 'gold', amount: 60 }] },
    ],
  },
  {
    key: 'touch_grass',
    name: 'Touch Grass',
    text: 'Actual grass. Outside. It is alarmingly restorative, but something falls out of your bag.',
    choices: [
      { label: 'Heal to full, lose a die', actions: [{ kind: 'healPct', pct: 100 }, { kind: 'loseRandomDie' }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'the_grind',
    name: 'The Grind',
    text: 'Something enormous is asleep down there. It is worth double if you wake it.',
    choices: [
      { label: 'Fight an Elite now for double rewards', actions: [{ kind: 'fightElite', doubleReward: true }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'snake_eyes',
    name: 'Snake Eyes',
    text: 'A single die sits on a plinth. The rules are written underneath.',
    choices: [
      {
        label: 'Roll it',
        actions: [{
          kind: 'rollDie',
          outcomes: [
            { max: 2, then: [{ kind: 'damage', amount: 15 }] },
            { max: 4, then: [{ kind: 'gold', amount: 40 }] },
            { max: 6, then: [{ kind: 'addDie', rarity: 'rare' }] },
          ],
        }],
      },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'sigma_shrine',
    name: 'Sigma Shrine',
    text: 'Every die you own hums. The shrine offers consistency in exchange for ceiling.',
    choices: [
      { label: 'Duplicate each die\'s lowest face', detail: 'better matching, lower average', actions: [{ kind: 'upgradeAllDiceLow' }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'the_sharpener',
    name: 'The Sharpener',
    text: 'A grindstone. It will take an edge off you and put one on a die.',
    choices: [
      { label: '+1 to every face on one die, take 12', actions: [{ kind: 'sharpenDie' }, { kind: 'damage', amount: 12 }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'unsubscribe',
    name: 'Unsubscribe',
    text: 'You may quietly remove one thing from your life. Or expand your capacity to hold more.',
    choices: [
      { label: 'Remove any die, free', actions: [{ kind: 'removeDie' }] },
      { label: '+2 Slip cap', actions: [{ kind: 'slipCap', amount: 2 }] },
    ],
  },
  {
    key: 'cursed_bargain',
    name: 'Cursed Bargain',
    text: 'The die is beautiful. It is also warm, which dice should not be.',
    choices: [
      { label: 'Take it — 25 damage, cursed die', actions: [{ kind: 'addDie', die: 'cursed_d6' }, { kind: 'damage', amount: 25 }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'the_fork',
    name: 'The Fork',
    text: 'The path splits, and so does something you own.',
    choices: [
      { label: 'Duplicate a die in your bag', actions: [{ kind: 'duplicateDie' }] },
      { label: 'Take 75 gold', actions: [{ kind: 'gold', amount: 75 }] },
    ],
  },
  {
    key: 'ad_break',
    name: 'Ad Break',
    text: 'An unskippable interruption. You could just... walk past the next fight entirely.',
    choices: [
      { label: 'Skip the next battle, gain nothing', actions: [{ kind: 'skipNode' }] },
      { label: 'Fight it properly', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'loot_box',
    name: 'Loot Box',
    text: 'It costs 75 gold. It does not tell you what is inside. You know exactly how this works.',
    choices: [
      { label: 'Pay 75 gold for a relic', cost: { gold: 75 }, actions: [{ kind: 'relic', rarity: 'rare' }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
  {
    key: 'reroll_fountain',
    name: 'Reroll Fountain',
    text: 'Water, but it is doing something wrong. Drinking it feels like a permanent decision.',
    choices: [
      { label: '+1 Slip at every fight start, forever', actions: [{ kind: 'startSlip', amount: 1 }] },
      { label: 'Heal 25', actions: [{ kind: 'heal', amount: 25 }] },
    ],
  },
  {
    key: 'the_mirror',
    name: 'The Mirror',
    text: 'Your reflection is holding better dice than you are.',
    choices: [
      { label: 'Swap your two lowest dice for copies of your highest', actions: [{ kind: 'mirrorLowDice' }] },
      { label: 'Leave', actions: [{ kind: 'nothing' }] },
    ],
  },
];

export const EVENT_DEFS: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.key, e]),
);
