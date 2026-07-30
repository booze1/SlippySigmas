// Core types for the Slippy Sigmas rules engine.
// Everything here is plain data — GameState must stay JSON-serializable.

export type Phase = 'PLAN' | 'WIN' | 'LOSE';

export type SigmaTier = 'NONE' | 'SIGMA' | 'DOUBLE' | 'OMEGA';

/** Wild faces (Chameleon d6) are stored as this sentinel. */
export const WILD = -1;

// ---------------------------------------------------------------- dice

export type DieTrait =
  | 'cracked'   // rolls twice on turn 1, keeps the higher
  | 'greedy'    // gain gold on a crown-face roll
  | 'slick'     // first NUDGE on this die each turn is free
  | 'burning'   // applies Burn equal to its face when slotted into a damage skill
  | 'mirror'    // at ROLL, copies the face of the die to its left
  | 'echo'      // when slotted, leaves a one-use copy in the tray
  | 'cursed'    // rolling a 1 deals 3 damage to you
  | 'theslip';  // one free SET per fight, +5 Slip cap

export interface DieDef {
  key: string;
  name: string;
  faces: number[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  trait?: DieTrait;
  note?: string;
}

export interface Die {
  id: string;
  defKey: string;
  face: number;
  /** Pips moved by NUDGE this turn. Drives escalating cost. */
  nudges: number;
  frozen: boolean;
  /** Rolls this die will survive. Ophi's Blueprint freezes for 2. */
  frozenTurns?: number;
  jammed: boolean;
  /** Index of the skill slot this die is committed to, or null. */
  slot: number | null;
  /** Temp dice come from SPLIT or Echo and evaporate at end of turn. */
  temp?: boolean;
  /** Temp dice carry their own face list. */
  faces?: number[];
  /** Trait bookkeeping. */
  usedFreeNudge?: boolean;
  usedFreeSet?: boolean;
  echoed?: boolean;
}

/** A die in the run's bag. `faces` overrides the definition when forged. */
export interface BagEntry {
  key: string;
  faces?: number[];
}

// ---------------------------------------------------------------- statuses

export type EnemyStatus = 'burn' | 'brittle' | 'stagger' | 'bleed' | 'mark';
export type PlayerStatus = 'hyped' | 'slick' | 'jammed' | 'cursed' | 'sticky';

export type TargetMode = 'target' | 'all' | 'self';

// ---------------------------------------------------------------- skills

export interface SkillCost {
  count: number;
  min?: number;
  max?: number;
  exact?: number;
  parity?: 'EVEN' | 'ODD';
}

export type DamageCondition = 'targetBelowPlayerHp' | 'targetBelow60pct';

export type SkillEffect =
  | {
      type: 'damage';
      power: number;
      flat?: number;
      target?: TargetMode;
      hits?: number;
      sigmaHits?: number;
      ignoreBlock?: boolean;
      /** Ratio: bigger number when the condition holds. */
      altPower?: number;
      condition?: DamageCondition;
      /** Chain Reaction: one extra repeat per skill that already fired. */
      repeatPerPrior?: number;
      sigmaRepeatPerPrior?: number;
    }
  | { type: 'block'; power: number; persist?: boolean }
  | { type: 'heal'; power: number; sigmaPower?: number }
  | { type: 'armor'; amount: number; sigmaOnly?: boolean }
  | { type: 'slip'; amount: number; sigmaAmount?: number }
  /** Skim: pays out only when the slotted die shows this face (Sigma pays regardless). */
  | { type: 'slipIfFace'; face: number; amount: number }
  /** Slip Stream: Slip equal to how many of these faces sit in the bag. */
  | { type: 'slipPerFaceInBag'; faces: number[]; doubleOnSigma?: boolean }
  /** Loaded Question: scales off Slip held, then spends it (Sigma keeps it). */
  | { type: 'damagePerSlip'; power: number; sigmaPower?: number; keepOnSigma?: boolean }
  | { type: 'status'; status: EnemyStatus; amount: number; sigmaAmount?: number; target?: TargetMode; scaleWithPip?: number; sigmaScaleWithPip?: number }
  | { type: 'selfStatus'; status: PlayerStatus; amount: number; sigmaAmount?: number }
  | { type: 'freeNudge'; amount: number; sigmaAmount?: number }
  | { type: 'freeClone'; times: number; sigmaTimes?: number }
  | { type: 'rerollBag'; freezeHighestOnSigma?: boolean }
  /** Bend the Odds: level the slotted dice up to the highest among them. */
  | { type: 'setSlottedToHighest'; bonus?: number }
  /** The Gambit: reroll the slotted dice, then score the new result. */
  | { type: 'rerollSlotted' }
  | { type: 'setAllBag'; face: number }
  | { type: 'powerGain'; amount: number; sigmaAmount?: number }
  | { type: 'extraTurnOnKill' }
  | { type: 'counter'; mult: number; sigmaMult?: number }
  | { type: 'immuneJam'; turns: number; sigmaTurns?: number }
  | { type: 'oncePerFight' };

export type SkillLane = 'manipulation' | 'damage' | 'combo' | 'defense';

export interface Skill {
  key: string;
  name: string;
  lane: SkillLane;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  cost: SkillCost;
  effects: SkillEffect[];
  blurb: string;
}

// ---------------------------------------------------------------- enemies

export type IntentKind =
  | 'SMASH'
  | 'GUARD'
  | 'LOCK'
  | 'BUFF'
  | 'DRAIN'
  | 'SUMMON'
  | 'CURSE'
  | 'STICKY'
  | 'HEAL'
  | 'GAMBLE'
  // Act 2+
  | 'COUNTER'      // reflects part of the next hit taken
  | 'CLONE_SELF'   // splits into two half-HP copies
  | 'TAUNT'        // forces the player to target this enemy
  | 'SCRAMBLE'     // rerolls the player's bag AFTER Slip has been spent
  | 'INVERT'       // Sigma multipliers become divisors for one turn
  | 'REMOVE_DIE'   // takes a die out of the bag for the rest of the fight
  | 'FINAL_ROLL';  // boss and player each roll; the difference is damage

export interface IntentDef {
  kind: IntentKind;
  value: number;
  weight: number;
  /** SMASH only: number of separate hits. */
  hits?: number;
  /** SUMMON only. */
  summonKey?: string;
  label?: string;
}

export interface BossPhase {
  /** Phase applies while hp <= hpAbove fraction of max. */
  belowPct: number;
  intents: IntentDef[];
  /** Non-Sigma hits deal this fraction of damage. */
  nonSigmaResist?: number;
  note?: string;
}

export interface EnemyDef {
  key: string;
  name: string;
  hp: number;
  tier: 'chaff' | 'basic' | 'elite' | 'boss';
  intents: IntentDef[];
  phases?: BossPhase[];
}

export interface Enemy {
  id: string;
  defKey: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  buff: number;
  /** Statuses. */
  burn: number;
  brittle: number;
  stagger: number;
  bleed: number;
  mark: boolean;
  intent: IntentDef;
  lastIntentKind: IntentKind | null;
  phase: number;
  /** GAMBLE and FINAL_ROLL pre-roll and display the result. */
  gambleRoll?: number;
  /** Reflects this fraction of the next hit taken. */
  counter: number;
  taunting: boolean;
  /** Adaptive bosses build resistance to the tier used most recently. */
  adapt: Partial<Record<SigmaTier, number>>;
}

// ---------------------------------------------------------------- encounters

export interface EncounterDef {
  key: string;
  name: string;
  kind: 'basic' | 'hard' | 'elite' | 'boss';
  enemies: string[];
}

// ---------------------------------------------------------------- state

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  blockPersists: boolean;
  armor: number;
  slip: number;
  slipCap: number;
  gold: number;
  /** Statuses. */
  hyped: number;
  slick: number;
  cursed: number;
  sticky: boolean;
  jamImmuneTurns: number;
  incomingJam: number;
  /** Free manipulation granted by skills this turn. */
  freeNudges: number;
  freeClones: number;
  /** Grindset and similar: added to every damage skill's power this fight. */
  bonusPower: number;
  /** Counterweight: retaliates against the next attacker. */
  counter: number;
}

export interface SlotState {
  skillKey: string | null;
  /** Skills flagged oncePerFight burn out after use. */
  spent?: boolean;
}

export interface GameState {
  seed: number;
  turn: number;
  phase: Phase;
  player: PlayerState;
  dice: Die[];
  slots: SlotState[];
  enemies: Enemy[];
  targetId: string | null;
  encounterKey: string;
  log: LogEntry[];
  stats: RunStats;
  /** Set by Delete when it kills; suppresses the enemy phase. */
  extraTurn: boolean;
  /** Queued by SCRAMBLE — rerolls the bag at the start of next turn. */
  scramblePending: boolean;
  /** Set by INVERT — Sigma multipliers divide instead of multiply this turn. */
  inverted: boolean;
  /** Total PIP the player committed this turn, for FINAL_ROLL. */
  turnPip: number;
  act: number;
  /** Relics carried into this fight. */
  relics: string[];
  /** Skill keys the player has upgraded at Rest nodes. */
  upgrades: string[];
  /** Perfect Pair: consumed by the first Sigma of the fight. */
  perfectPairReady: boolean;
  /** Hero key — drives the passive. */
  hero: string;
  /** Sig's Steady Hands: one free NUDGE per turn. */
  heroNudgeUsed: boolean;
  /** Vex's Double or Nothing: rerolls past the first cost HP. */
  rerollsThisTurn: number;
  /** Ascension tier in force. */
  ascension: number;
  /** Ascension 12 flattens the Omega multiplier. */
  omegaOverride: number | null;
  /** Ascension 10: unspent dice only pay on alternating turns. */
  slipEveryOtherTurn: boolean;
  enemyDmgMult: number;
}

export interface LogEntry {
  turn: number;
  text: string;
  kind: 'player' | 'enemy' | 'slip' | 'system' | 'sigma';
}

export interface RunStats {
  turns: number;
  damageDealt: number;
  damageTaken: number;
  slipSpent: number;
  slipGained: number;
  biggestHit: number;
  sigmaCounts: Record<SigmaTier, number>;
}

// ---------------------------------------------------------------- preview

export interface StatusPreview {
  key: string;
  amount: number;
}

export interface SlotPreview {
  slotIndex: number;
  skill: Skill | null;
  dice: Die[];
  pip: number;
  tier: SigmaTier;
  mult: number;
  ready: boolean;
  /** Damage to the current target, total across all hits. */
  damage: number;
  hits: number;
  /** Damage dealt to every enemy. */
  aoe: number;
  block: number;
  heal: number;
  slip: number;
  armor: number;
  statuses: StatusPreview[];
  selfStatuses: StatusPreview[];
  /** Short human notes for effects with no number worth showing. */
  notes: string[];
}
