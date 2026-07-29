// Skills: cost validation, PIP maths, and preview computation.

import type { Die, Skill, SkillCost, SlotPreview, GameState } from './types.js';
import { evaluateSigma } from './sigma.js';
import { SKILLS as SKILL_DATA } from '../data/skills.js';

export const SKILLS: Record<string, Skill> = Object.fromEntries(
  SKILL_DATA.map((s) => [s.key, s]),
);

export const SKILL_LIST: Skill[] = SKILL_DATA;

/** Does this single die satisfy the face requirement of the cost? */
export function dieMeetsCost(die: Die, cost: SkillCost): boolean {
  if (cost.exact !== undefined && die.face !== cost.exact) return false;
  if (cost.min !== undefined && die.face < cost.min) return false;
  if (cost.max !== undefined && die.face > cost.max) return false;
  if (cost.parity === 'EVEN' && die.face % 2 !== 0) return false;
  if (cost.parity === 'ODD' && die.face % 2 === 0) return false;
  return true;
}

export function costLabel(cost: SkillCost): string {
  const n = `${cost.count}d`;
  if (cost.exact !== undefined) return `${n} =${cost.exact}`;
  if (cost.parity) return `${n} ${cost.parity}`;
  if (cost.min !== undefined) return `${n} ≥${cost.min}`;
  if (cost.max !== undefined) return `${n} ≤${cost.max}`;
  return `${n} ANY`;
}

/**
 * Can this die legally be dropped into this slot right now?
 * Requires: skill present, room left, face requirement met, die not jammed.
 */
export function canSlot(state: GameState, die: Die, slotIndex: number): boolean {
  if (die.jammed) return false;
  if (die.slot === slotIndex) return false;
  const slot = state.slots[slotIndex];
  if (!slot?.skillKey) return false;
  const skill = SKILLS[slot.skillKey];
  if (!skill) return false;
  const occupants = diceInSlot(state, slotIndex);
  if (occupants.length >= skill.cost.count) return false;
  return dieMeetsCost(die, skill.cost);
}

export function diceInSlot(state: GameState, slotIndex: number): Die[] {
  return state.dice.filter((d) => d.slot === slotIndex);
}

/**
 * Full preview for a slot, optionally with a hypothetical extra die.
 * The UI uses the hypothetical form to show live numbers on hover.
 */
export function previewSlot(
  state: GameState,
  slotIndex: number,
  hypothetical?: Die,
): SlotPreview {
  const slot = state.slots[slotIndex];
  const skill = slot?.skillKey ? SKILLS[slot.skillKey] : null;
  const dice = diceInSlot(state, slotIndex).slice();
  if (hypothetical && !dice.some((d) => d.id === hypothetical.id)) {
    dice.push(hypothetical);
  }

  const pip = dice.reduce((s, d) => s + d.face, 0);
  const { tier, mult } = evaluateSigma(dice);
  const ready = !!skill && dice.length === skill.cost.count;

  const out: SlotPreview = {
    slotIndex,
    skill,
    dice,
    pip,
    tier,
    mult,
    ready,
    damage: 0,
    block: 0,
    slip: 0,
    brittle: 0,
    burn: 0,
  };

  if (!skill || !ready) return out;

  const brittleMult = 1 + state.enemy.brittle / 100;

  for (const eff of skill.effects) {
    switch (eff.type) {
      case 'damage': {
        // FINAL = floor(PIP × Power + Flat) × Sigma × Global
        const base = pip * eff.power + (eff.flat ?? 0);
        out.damage += Math.floor(base * mult * brittleMult);
        break;
      }
      case 'block':
        out.block += Math.floor(pip * eff.power);
        break;
      case 'slip':
        out.slip += tier !== 'NONE' ? (eff.sigmaAmount ?? eff.amount) : eff.amount;
        break;
      case 'brittle':
        out.brittle += tier !== 'NONE' ? (eff.sigmaAmount ?? eff.amount) : eff.amount;
        break;
      case 'burn':
        out.burn += Math.floor(pip * (tier !== 'NONE' ? (eff.sigmaPower ?? eff.power) : eff.power));
        break;
    }
  }

  return out;
}

/**
 * Rough single number for "how good is this slot right now", used to rank
 * candidate slots for tap-to-slot. Damage dominates; block, Slip and debuffs
 * are worth a fraction each so defensive skills aren't invisible.
 */
export function slotValue(p: SlotPreview): number {
  return p.damage + p.block * 0.6 + p.slip * 2 + p.brittle * 0.3 + p.burn * 0.8;
}

/** Total damage the player would deal this turn if they resolved now. */
export function previewTurnDamage(state: GameState): number {
  let total = 0;
  for (let i = 0; i < state.slots.length; i++) {
    total += previewSlot(state, i).damage;
  }
  return total;
}
