// Enemy construction, phase selection, and intent selection.
//
// Rule from docs/05: the intent is a contract. Once shown it does not change
// except through player action. No-repeat guards non-attack intents so the
// player can never be locked out two turns running.

import type { Enemy, EnemyDef, EncounterDef, IntentDef, IntentKind } from './types.js';
import type { Rng } from './rng.js';
import { ENEMIES, ENCOUNTERS } from '../data/enemies.js';

export const ENEMY_DEFS: Record<string, EnemyDef> = Object.fromEntries(
  ENEMIES.map((e) => [e.key, e]),
);
export const ENEMY_LIST: EnemyDef[] = ENEMIES;

export const ENCOUNTER_DEFS: Record<string, EncounterDef> = Object.fromEntries(
  ENCOUNTERS.map((e) => [e.key, e]),
);
export const ENCOUNTER_LIST: EncounterDef[] = ENCOUNTERS;

const NON_ATTACK: ReadonlySet<IntentKind> = new Set([
  'LOCK', 'DRAIN', 'GUARD', 'BUFF', 'CURSE', 'STICKY', 'SUMMON', 'HEAL',
  'COUNTER', 'CLONE_SELF', 'TAUNT', 'SCRAMBLE', 'INVERT', 'REMOVE_DIE',
]);

/** Which boss phase applies at this HP fraction. Returns 0 for normal enemies. */
export function phaseIndexFor(def: EnemyDef, hp: number, maxHp: number): number {
  if (!def.phases?.length) return 0;
  const frac = hp / maxHp;
  let idx = 0;
  for (let i = 0; i < def.phases.length; i++) {
    if (frac <= def.phases[i].belowPct) idx = i;
  }
  return idx;
}

export function intentPoolFor(def: EnemyDef, phase: number): IntentDef[] {
  return def.phases?.[phase]?.intents ?? def.intents;
}

export function nonSigmaResistFor(def: EnemyDef, phase: number): number {
  return def.phases?.[phase]?.nonSigmaResist ?? 1;
}

export function pickIntent(
  def: EnemyDef,
  rng: Rng,
  last: IntentKind | null,
  phase: number,
): IntentDef {
  const pool = intentPoolFor(def, phase);
  // No-repeat: a non-attack intent may not immediately follow itself.
  const filtered = last && NON_ATTACK.has(last) ? pool.filter((i) => i.kind !== last) : pool;
  return rng.weighted(filtered.length ? filtered : pool);
}

let enemyCounter = 0;
export function resetEnemyCounter(): void {
  enemyCounter = 0;
}

export function makeEnemy(defKey: string, rng: Rng): Enemy {
  const def = ENEMY_DEFS[defKey];
  if (!def) throw new Error(`Unknown enemy: ${defKey}`);
  const enemy: Enemy = {
    id: `e${enemyCounter++}`,
    defKey,
    name: def.name,
    hp: def.hp,
    maxHp: def.hp,
    block: 0,
    buff: 0,
    burn: 0,
    brittle: 0,
    stagger: 0,
    bleed: 0,
    mark: false,
    intent: def.intents[0],
    lastIntentKind: null,
    phase: 0,
    counter: 0,
    taunting: false,
    adapt: {},
  };
  enemy.intent = pickIntent(def, rng, null, 0);
  rollGamble(enemy, rng);
  return enemy;
}

/**
 * GAMBLE intents roll their own die and show the result BEFORE resolving, so
 * the boss's coin-flip is still a contract the player can plan around.
 */
export function rollGamble(enemy: Enemy, rng: Rng): void {
  enemy.gambleRoll =
    enemy.intent.kind === 'GAMBLE' || enemy.intent.kind === 'FINAL_ROLL'
      ? rng.int(6) + 1
      : undefined;
}

export function intentDamage(enemy: Enemy): number {
  const { kind, value } = enemy.intent;
  if (kind === 'SMASH') return value + enemy.buff;
  if (kind === 'GAMBLE') return (enemy.gambleRoll ?? 1) >= 4 ? value : Math.floor(value / 4);
  return 0;
}

export function intentLabel(enemy: Enemy): string {
  const { kind, value, hits, label } = enemy.intent;
  switch (kind) {
    case 'SMASH':
      return hits && hits > 1
        ? `SMASH ${value + enemy.buff} ×${hits}`
        : `SMASH ${value + enemy.buff}`;
    case 'GUARD':
      return `GUARD ${value}`;
    case 'LOCK':
      return `LOCK ${value}`;
    case 'BUFF':
      return `BUFF +${value}`;
    case 'DRAIN':
      return `DRAIN ${value} SLIP`;
    case 'SUMMON':
      return 'SUMMON';
    case 'CURSE':
      return `CURSE ${value}`;
    case 'STICKY':
      return 'STICKY';
    case 'HEAL':
      return `HEAL ${value}`;
    case 'GAMBLE':
      return `${label ?? 'GAMBLE'} — rolled ${enemy.gambleRoll} → ${intentDamage(enemy)}`;
    case 'COUNTER':
      return `COUNTER ${value}%`;
    case 'CLONE_SELF':
      return 'SPLIT';
    case 'TAUNT':
      return 'TAUNT';
    case 'SCRAMBLE':
      return 'SCRAMBLE';
    case 'INVERT':
      return 'INVERT';
    case 'REMOVE_DIE':
      return `TAKE ${value} DIE`;
    case 'FINAL_ROLL':
      return `${label ?? 'FINAL ROLL'} — rolled ${enemy.gambleRoll}`;
  }
}

export function intentIcon(kind: IntentKind): string {
  switch (kind) {
    case 'SMASH':
      return '⚔';
    case 'GUARD':
      return '🛡';
    case 'LOCK':
      return '🔒';
    case 'BUFF':
      return '▲';
    case 'DRAIN':
      return '🌀';
    case 'SUMMON':
      return '✦';
    case 'CURSE':
      return '☠';
    case 'STICKY':
      return '🕸';
    case 'HEAL':
      return '✚';
    case 'GAMBLE':
    case 'FINAL_ROLL':
      return '🎲';
    case 'COUNTER':
      return '⟲';
    case 'CLONE_SELF':
      return '⧉';
    case 'TAUNT':
      return '❗';
    case 'SCRAMBLE':
      return '🌪';
    case 'INVERT':
      return '⇅';
    case 'REMOVE_DIE':
      return '✖';
  }
}
