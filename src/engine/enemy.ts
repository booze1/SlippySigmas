// Enemy construction and intent selection.
//
// Rule from docs/05: the intent is a contract. Once shown it does not change
// except through player action. No-repeat guards non-attack intents so the
// player can never be locked out two turns running.

import type { Enemy, EnemyDef, IntentDef } from './types.js';
import type { Rng } from './rng.js';
import { ENEMIES } from '../data/enemies.js';

export const ENEMY_DEFS: Record<string, EnemyDef> = Object.fromEntries(
  ENEMIES.map((e) => [e.key, e]),
);

export const ENEMY_LIST: EnemyDef[] = ENEMIES;

const NON_ATTACK: ReadonlySet<string> = new Set(['LOCK', 'DRAIN', 'GUARD', 'BUFF']);

export function pickIntent(def: EnemyDef, rng: Rng, last: string | null): IntentDef {
  // No-repeat: a non-attack intent may not immediately follow itself.
  const pool =
    last && NON_ATTACK.has(last)
      ? def.intents.filter((i) => i.kind !== last)
      : def.intents;
  const usable = pool.length > 0 ? pool : def.intents;
  return rng.weighted(usable);
}

export function makeEnemy(defKey: string, rng: Rng): Enemy {
  const def = ENEMY_DEFS[defKey];
  if (!def) throw new Error(`Unknown enemy: ${defKey}`);
  return {
    defKey,
    name: def.name,
    hp: def.hp,
    maxHp: def.hp,
    block: 0,
    brittle: 0,
    burn: 0,
    buff: 0,
    intent: pickIntent(def, rng, null),
    lastIntentKind: null,
  };
}

export function intentLabel(enemy: Enemy): string {
  const { kind, value } = enemy.intent;
  switch (kind) {
    case 'SMASH':
      return `SMASH ${value + enemy.buff}`;
    case 'GUARD':
      return `GUARD ${value}`;
    case 'LOCK':
      return `LOCK ${value}`;
    case 'BUFF':
      return `BUFF +${value}`;
    case 'DRAIN':
      return `DRAIN ${value} SLIP`;
  }
}

export function intentIcon(kind: string): string {
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
    default:
      return '?';
  }
}
