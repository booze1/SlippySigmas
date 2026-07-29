// Core types for the Slippy Sigmas rules engine.
// Everything here is plain data — GameState must stay JSON-serializable.

export type Phase = 'PLAN' | 'WIN' | 'LOSE';

export type SigmaTier = 'NONE' | 'SIGMA' | 'DOUBLE' | 'OMEGA';

// ---------------------------------------------------------------- dice

export interface DieDef {
  key: string;
  name: string;
  faces: number[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  note?: string;
}

export interface Die {
  id: string;
  defKey: string;
  face: number;
  /** Pips moved by NUDGE this turn. Drives escalating cost. */
  nudges: number;
  frozen: boolean;
  jammed: boolean;
  /** Index of the skill slot this die is committed to, or null. */
  slot: number | null;
  /** Temp dice come from SPLIT and evaporate at end of turn. */
  temp?: boolean;
  /** Temp dice carry their own face list. */
  faces?: number[];
}

// ---------------------------------------------------------------- skills

export interface SkillCost {
  count: number;
  min?: number;
  max?: number;
  exact?: number;
  parity?: 'EVEN' | 'ODD';
}

export type SkillEffect =
  | { type: 'damage'; power: number; flat?: number }
  | { type: 'block'; power: number }
  | { type: 'slip'; amount: number; sigmaAmount?: number }
  | { type: 'brittle'; amount: number; sigmaAmount?: number }
  | { type: 'burn'; power: number; sigmaPower?: number };

export interface Skill {
  key: string;
  name: string;
  lane: 'manipulation' | 'damage' | 'combo' | 'defense';
  cost: SkillCost;
  effects: SkillEffect[];
  blurb: string;
}

// ---------------------------------------------------------------- enemies

export type IntentKind = 'SMASH' | 'GUARD' | 'LOCK' | 'BUFF' | 'DRAIN';

export interface IntentDef {
  kind: IntentKind;
  value: number;
  weight: number;
}

export interface EnemyDef {
  key: string;
  name: string;
  hp: number;
  intents: IntentDef[];
}

export interface Enemy {
  defKey: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  brittle: number;
  burn: number;
  /** Flat damage bonus accumulated from BUFF intents. */
  buff: number;
  intent: IntentDef;
  lastIntentKind: IntentKind | null;
}

// ---------------------------------------------------------------- state

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  slip: number;
  slipCap: number;
  /** Dice to jam at the start of next turn, from enemy LOCK intents. */
  incomingJam: number;
}

export interface SlotState {
  skillKey: string | null;
}

export interface GameState {
  seed: number;
  turn: number;
  phase: Phase;
  player: PlayerState;
  dice: Die[];
  slots: SlotState[];
  enemy: Enemy;
  log: LogEntry[];
  stats: RunStats;
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

export interface SlotPreview {
  slotIndex: number;
  skill: Skill | null;
  dice: Die[];
  pip: number;
  tier: SigmaTier;
  mult: number;
  /** Whether the cost is fully satisfied and the skill will actually fire. */
  ready: boolean;
  damage: number;
  block: number;
  slip: number;
  brittle: number;
  burn: number;
}
