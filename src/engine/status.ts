// Status effects. Kept to a tight set — every status is either a number that
// ticks down or a number that scales something. See docs/01 §7.

import type { Enemy, PlayerState } from './types.js';

export const ENEMY_STATUS_LABEL: Record<string, string> = {
  burn: 'Burn',
  brittle: 'Brittle',
  stagger: 'Stagger',
  bleed: 'Bleed',
  mark: 'Mark',
};

export const PLAYER_STATUS_LABEL: Record<string, string> = {
  hyped: 'Hyped',
  slick: 'Slick',
  jammed: 'Jammed',
  cursed: 'Cursed',
  sticky: 'Sticky',
};

/** Multiplier applied to all outgoing damage from player buffs. */
export function globalMult(player: PlayerState): number {
  return 1 + 0.25 * Math.min(4, player.hyped);
}

/** Multiplier applied to damage arriving at this enemy. */
export function incomingMult(enemy: Enemy): number {
  return 1 + enemy.brittle / 100;
}

/** Fraction of an enemy's telegraphed damage that actually lands. */
export function outgoingMult(enemy: Enemy): number {
  return enemy.stagger > 0 ? 0.5 : 1;
}

/**
 * End-of-turn decay for one enemy. Burn halves (round down) after ticking,
 * Brittle sheds a point, Stagger burns a charge. Bleed never decays — it is
 * consumed by being hit, not by time.
 */
export function decayEnemy(enemy: Enemy): void {
  if (enemy.brittle > 0) enemy.brittle = Math.max(0, enemy.brittle - 1);
  if (enemy.stagger > 0) enemy.stagger -= 1;
}

export function decayPlayer(player: PlayerState): void {
  if (player.hyped > 0) player.hyped -= 1;
  if (player.cursed > 0) player.cursed -= 1;
  if (player.jamImmuneTurns > 0) player.jamImmuneTurns -= 1;
  player.sticky = false;
}

/** Short tags for the UI, in a stable order. */
export function enemyStatusTags(e: Enemy): { key: string; text: string; colour: string }[] {
  const tags: { key: string; text: string; colour: string }[] = [];
  if (e.block > 0) tags.push({ key: 'block', text: `🛡 ${e.block}`, colour: 'var(--block)' });
  if (e.mark) tags.push({ key: 'mark', text: 'MARKED', colour: 'var(--gold)' });
  if (e.brittle > 0) tags.push({ key: 'brittle', text: `Brittle ${e.brittle}%`, colour: '#ff9f43' });
  if (e.burn > 0) tags.push({ key: 'burn', text: `Burn ${e.burn}`, colour: '#ff6b35' });
  if (e.bleed > 0) tags.push({ key: 'bleed', text: `Bleed ${e.bleed}`, colour: '#e0526d' });
  if (e.stagger > 0) tags.push({ key: 'stagger', text: `Stagger ${e.stagger}`, colour: '#9d8df1' });
  if (e.buff > 0) tags.push({ key: 'buff', text: `+${e.buff} dmg`, colour: 'var(--danger)' });
  return tags;
}

export function playerStatusTags(p: PlayerState): { key: string; text: string; colour: string }[] {
  const tags: { key: string; text: string; colour: string }[] = [];
  if (p.block > 0) tags.push({ key: 'block', text: `🛡 ${p.block}`, colour: 'var(--block)' });
  if (p.armor > 0) tags.push({ key: 'armor', text: `Armor ${p.armor}`, colour: 'var(--block)' });
  if (p.hyped > 0) tags.push({ key: 'hyped', text: `Hyped ${p.hyped}`, colour: 'var(--gold)' });
  if (p.slick > 0) tags.push({ key: 'slick', text: `Slick ${p.slick}`, colour: 'var(--slip)' });
  if (p.cursed > 0) tags.push({ key: 'cursed', text: `Cursed ${p.cursed}`, colour: '#c66bd8' });
  if (p.sticky) tags.push({ key: 'sticky', text: 'Sticky', colour: '#c66bd8' });
  if (p.counter > 0) tags.push({ key: 'counter', text: `Counter ${p.counter}`, colour: '#7fd67f' });
  return tags;
}
