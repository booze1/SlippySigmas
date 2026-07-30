// Meta-progression: Chips, the unlock tree, heroes, Ascension, and persistence.
// See docs/07-meta-progression.md.
//
// LOCKED PRINCIPLE: meta-progression adds variety, never power. Unlocks put
// things into the shared run pool; they never raise a ceiling. A run-1 player
// and a run-200 player can hit the same numbers — the veteran just has more
// routes to them.

import { UNLOCKS, TIER_GATES, GATED_DICE, GATED_SKILLS, SLOT_RELICS, MAX_ASCENSION, type UnlockDef } from '../data/unlocks.js';
import { DICE_LIST } from './dice.js';
import { SKILL_LIST } from './skills.js';
import { RELICS } from '../data/relics.js';
import { HERO_RELICS } from '../data/heroes.js';

export interface MetaStats {
  runs: number;
  wins: number;
  bestAct: number;
  biggestHit: number;
  highestTier: string;
  totalSlipSpent: number;
  totalDamage: number;
  fastestWinNodes: number | null;
  /** Death counts keyed by enemy name — the balance-critical statistic. */
  deaths: Record<string, number>;
  /** Runs containing each die / skill, for pick-rate analysis. */
  diceUsed: Record<string, number>;
  skillsUsed: Record<string, number>;
}

export interface MetaState {
  version: 1;
  chips: number;
  unlocked: string[];
  hero: string;
  ascension: number;
  maxAscension: number;
  stats: MetaStats;
}

const STORAGE_KEY = 'slippysigmas.meta.v1';

export function newMeta(): MetaState {
  return {
    version: 1,
    chips: 0,
    unlocked: [],
    hero: 'sig',
    ascension: 0,
    maxAscension: 0,
    stats: {
      runs: 0,
      wins: 0,
      bestAct: 0,
      biggestHit: 0,
      highestTier: 'NONE',
      totalSlipSpent: 0,
      totalDamage: 0,
      fastestWinNodes: null,
      deaths: {},
      diceUsed: {},
      skillsUsed: {},
    },
  };
}

// ------------------------------------------------------------ persistence

/**
 * Storage is best-effort. The headless simulator runs under Node with no
 * localStorage, and a browser can refuse it in private mode — neither should
 * break the game, so a failure just means the run is not remembered.
 */
function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    localStorage.getItem(STORAGE_KEY);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadMeta(): MetaState {
  const store = storage();
  if (!store) return newMeta();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return newMeta();
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    if (parsed.version !== 1) return newMeta();
    // Merge over a fresh object so a save written by an older build that lacks
    // newer fields still loads instead of throwing on a missing property.
    const base = newMeta();
    return {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      unlocked: parsed.unlocked ?? [],
    };
  } catch {
    return newMeta();
  }
}

export function saveMeta(meta: MetaState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    /* quota or private mode — the run simply is not remembered */
  }
}

export function wipeMeta(): MetaState {
  const store = storage();
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return newMeta();
}

// ---------------------------------------------------------------- unlocks

export function tierUnlocked(meta: MetaState, tier: number): boolean {
  const gate = TIER_GATES.find((g) => g.tier === tier);
  if (!gate) return false;
  if (gate.requiresRuns && meta.stats.runs < gate.requiresRuns) return false;
  if (gate.requiresAct3 && meta.stats.bestAct < 3) return false;
  if (gate.requiresWin && meta.stats.wins < 1) return false;
  return true;
}

export function canBuy(meta: MetaState, unlock: UnlockDef): boolean {
  return (
    !meta.unlocked.includes(unlock.key) &&
    tierUnlocked(meta, unlock.tier) &&
    meta.chips >= unlock.cost
  );
}

export function buyUnlock(meta: MetaState, key: string): MetaState {
  const unlock = UNLOCKS.find((u) => u.key === key);
  if (!unlock || !canBuy(meta, unlock)) return meta;
  const next: MetaState = {
    ...meta,
    chips: meta.chips - unlock.cost,
    unlocked: [...meta.unlocked, unlock.key],
  };
  saveMeta(next);
  return next;
}

function unlockedTargets(meta: MetaState, kind: UnlockDef['kind']): string[] {
  return UNLOCKS.filter((u) => u.kind === kind && meta.unlocked.includes(u.key)).map((u) => u.target);
}

/** Dice that may appear as rewards, shop stock or event gifts. */
export function availableDice(meta: MetaState): string[] {
  const opened = unlockedTargets(meta, 'die');
  return DICE_LIST.filter((d) => !GATED_DICE.includes(d.key) || opened.includes(d.key)).map((d) => d.key);
}

export function availableSkills(meta: MetaState): string[] {
  const opened = unlockedTargets(meta, 'skill');
  return SKILL_LIST.filter((s) => !GATED_SKILLS.includes(s.key) || opened.includes(s.key)).map((s) => s.key);
}

export function availableRelics(meta: MetaState): string[] {
  const slotsOpen = unlockedTargets(meta, 'feature').includes('slot_relics');
  return RELICS.filter((r) => !HERO_RELICS.includes(r.key))
    .filter((r) => slotsOpen || !SLOT_RELICS.includes(r.key))
    .map((r) => r.key);
}

export function availableHeroes(meta: MetaState): string[] {
  return ['sig', ...unlockedTargets(meta, 'hero')];
}

/** Total cost of everything still locked — the "how far to go" number. */
export function remainingCost(meta: MetaState): number {
  return UNLOCKS.filter((u) => !meta.unlocked.includes(u.key)).reduce((s, u) => s + u.cost, 0);
}

// ----------------------------------------------------------------- chips

export const CHIPS = {
  perNode: 4,
  elite: 20,
  boss1: 50,
  boss2: 80,
  boss3: 150,
  firstKill: 5,
  newBestHit: 25,
};

export interface RunOutcome {
  won: boolean;
  act: number;
  nodesCleared: number;
  elitesKilled: number;
  bossesKilled: number;
  biggestHit: number;
  totalDamage: number;
  slipSpent: number;
  highestTier: string;
  killedBy: string | null;
  bag: string[];
  loadout: string[];
}

export function chipsFor(outcome: RunOutcome, meta: MetaState): number {
  let chips = outcome.nodesCleared * CHIPS.perNode;
  chips += outcome.elitesKilled * CHIPS.elite;
  const bossPay = [CHIPS.boss1, CHIPS.boss2, CHIPS.boss3];
  for (let i = 0; i < outcome.bossesKilled; i++) chips += bossPay[i] ?? CHIPS.boss3;
  if (outcome.biggestHit > meta.stats.biggestHit) chips += CHIPS.newBestHit;
  return chips;
}

const TIER_ORDER = ['NONE', 'SIGMA', 'DOUBLE', 'OMEGA'];

export function recordRun(meta: MetaState, outcome: RunOutcome): { meta: MetaState; chips: number } {
  const chips = chipsFor(outcome, meta);
  const s = { ...meta.stats };

  s.runs += 1;
  if (outcome.won) s.wins += 1;
  s.bestAct = Math.max(s.bestAct, outcome.act);
  s.biggestHit = Math.max(s.biggestHit, outcome.biggestHit);
  s.totalDamage += outcome.totalDamage;
  s.totalSlipSpent += outcome.slipSpent;
  if (TIER_ORDER.indexOf(outcome.highestTier) > TIER_ORDER.indexOf(s.highestTier)) {
    s.highestTier = outcome.highestTier;
  }
  if (outcome.won) {
    s.fastestWinNodes = s.fastestWinNodes === null
      ? outcome.nodesCleared
      : Math.min(s.fastestWinNodes, outcome.nodesCleared);
  }
  if (outcome.killedBy) {
    s.deaths = { ...s.deaths, [outcome.killedBy]: (s.deaths[outcome.killedBy] ?? 0) + 1 };
  }
  s.diceUsed = { ...s.diceUsed };
  for (const key of new Set(outcome.bag)) s.diceUsed[key] = (s.diceUsed[key] ?? 0) + 1;
  s.skillsUsed = { ...s.skillsUsed };
  for (const key of new Set(outcome.loadout)) s.skillsUsed[key] = (s.skillsUsed[key] ?? 0) + 1;

  const next: MetaState = {
    ...meta,
    chips: meta.chips + chips,
    stats: s,
    maxAscension: outcome.won
      ? Math.min(MAX_ASCENSION, Math.max(meta.maxAscension, meta.ascension + 1))
      : meta.maxAscension,
  };
  saveMeta(next);
  return { meta: next, chips };
}

export function setHero(meta: MetaState, hero: string): MetaState {
  if (!availableHeroes(meta).includes(hero)) return meta;
  const next = { ...meta, hero };
  saveMeta(next);
  return next;
}

export function setAscension(meta: MetaState, tier: number): MetaState {
  const clamped = Math.max(0, Math.min(meta.maxAscension, tier));
  const next = { ...meta, ascension: clamped };
  saveMeta(next);
  return next;
}

// ------------------------------------------------------------- ascension

export interface AscensionMods {
  enemyHpMult: number;
  bossHpMult: number;
  enemyDmgMult: number;
  startDice: number;
  restHealPct: number;
  shopMult: number;
  slipCap: number;
  extraCursedDie: boolean;
  slipEveryOtherTurn: boolean;
  omegaMult: number | null;
  eliteWeightBonus: number;
}

/** Ascension modifiers stack: tier N includes every tier below it. */
export function ascensionMods(tier: number): AscensionMods {
  return {
    eliteWeightBonus: tier >= 1 ? 10 : 0,
    enemyHpMult: 1 + (tier >= 2 ? 0.1 : 0) + (tier >= 9 ? 0.1 : 0),
    bossHpMult: tier >= 8 ? 1.25 : 1,
    enemyDmgMult: tier >= 5 ? 1.1 : 1,
    startDice: tier >= 11 ? -1 : 0,
    restHealPct: tier >= 4 ? 0.2 : 0.3,
    shopMult: tier >= 6 ? 1.25 : 1,
    slipCap: tier >= 7 ? 7 : 10,
    extraCursedDie: tier >= 3,
    slipEveryOtherTurn: tier >= 10,
    omegaMult: tier >= 12 ? 3.0 : null,
  };
}
