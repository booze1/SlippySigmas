// Skills: cost validation, PIP maths, and preview computation.
//
// previewSlot is the single source of truth for "what will this skill do".
// Both the UI (live numbers before you commit) and combat resolution read from
// it, so the number shown and the number dealt cannot drift apart.

import {
  WILD,
  type Die,
  type Enemy,
  type GameState,
  type Skill,
  type SkillCost,
  type SlotPreview,
  type StatusPreview,
} from './types.js';
import { evaluateSigma, pipTotal, effectivePips, SIGMA_MULT } from './sigma.js';
import { isWild, hasTrait } from './dice.js';
import { globalMult, incomingMult } from './status.js';
import { ENEMY_DEFS, nonSigmaResistFor } from './enemy.js';
import { SKILLS as SKILL_DATA } from '../data/skills.js';

export const SKILLS: Record<string, Skill> = Object.fromEntries(
  SKILL_DATA.map((s) => [s.key, s]),
);
export const SKILL_LIST: Skill[] = SKILL_DATA;

// ------------------------------------------------------------- costs

export function dieMeetsCost(die: Die, cost: SkillCost): boolean {
  // A wild face satisfies any face requirement — that is the whole point of it.
  if (isWild(die)) return true;
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

export function diceInSlot(state: GameState, slotIndex: number): Die[] {
  return state.dice.filter((d) => d.slot === slotIndex);
}

export function skillAt(state: GameState, slotIndex: number): Skill | null {
  const slot = state.slots[slotIndex];
  if (!slot?.skillKey || slot.spent) return null;
  return SKILLS[slot.skillKey] ?? null;
}

export function canSlot(state: GameState, die: Die, slotIndex: number): boolean {
  if (die.jammed) return false;
  if (die.slot === slotIndex) return false;
  const skill = skillAt(state, slotIndex);
  if (!skill) return false;
  if (diceInSlot(state, slotIndex).length >= skill.cost.count) return false;
  return dieMeetsCost(die, skill.cost);
}

/** Cheap readiness check that does not recurse through previewSlot. */
export function slotReady(state: GameState, slotIndex: number): boolean {
  const skill = skillAt(state, slotIndex);
  if (!skill) return false;
  return diceInSlot(state, slotIndex).length === skill.cost.count;
}

// ------------------------------------------------------------- targeting

export function livingEnemies(state: GameState): Enemy[] {
  return state.enemies.filter((e) => e.hp > 0);
}

export function currentTarget(state: GameState): Enemy | null {
  const alive = livingEnemies(state);
  if (!alive.length) return null;
  return alive.find((e) => e.id === state.targetId) ?? alive[0];
}

// ------------------------------------------------------------- preview

function addStatus(list: StatusPreview[], key: string, amount: number): void {
  if (amount <= 0) return;
  const found = list.find((s) => s.key === key);
  if (found) found.amount += amount;
  else list.push({ key, amount });
}

/**
 * Damage for one hit.
 * FINAL = floor(PIP × Power × Sigma × Global × Brittle × PhaseResist)
 */
function computeHit(
  pip: number,
  power: number,
  flat: number,
  mult: number,
  gMult: number,
  target: Enemy | null,
  ignoreResist: boolean,
): number {
  const brittle = target ? incomingMult(target) : 1;
  let resist = 1;
  if (target && !ignoreResist) {
    const def = ENEMY_DEFS[target.defKey];
    if (def) {
      const r = nonSigmaResistFor(def, target.phase);
      // Phase resistance only bites when the hit was NOT amplified.
      if (r < 1 && mult <= 1.0001) resist = r;
    }
  }
  return Math.max(0, Math.floor((pip * power + flat) * mult * gMult * brittle * resist));
}

export function previewSlot(
  state: GameState,
  slotIndex: number,
  hypothetical?: Die,
): SlotPreview {
  const skill = skillAt(state, slotIndex);
  let dice = diceInSlot(state, slotIndex).slice();
  if (hypothetical && !dice.some((d) => d.id === hypothetical.id)) {
    dice.push(hypothetical);
  }

  const out: SlotPreview = {
    slotIndex,
    skill,
    dice,
    pip: 0,
    tier: 'NONE',
    mult: 1,
    ready: !!skill && dice.length === skill.cost.count,
    damage: 0,
    hits: 0,
    aoe: 0,
    block: 0,
    heal: 0,
    slip: 0,
    armor: 0,
    statuses: [],
    selfStatuses: [],
    notes: [],
  };

  if (!skill) return out;

  // Bend the Odds levels the slotted dice before anything is scored, and that
  // is fully deterministic — so preview it honestly rather than hiding it.
  const levels = skill.effects.find((e) => e.type === 'setSlottedToHighest');
  if (levels && dice.length > 0) {
    const pips = effectivePips(dice);
    const top = Math.max(...pips) + (levels.bonus ?? 0);
    dice = dice.map((d) => ({ ...d, face: top, faces: [top] }));
    out.notes.push(`levels all dice to ${top}`);
  }

  out.pip = pipTotal(dice);
  const sig = evaluateSigma(dice);
  out.tier = sig.tier;
  out.mult = sig.mult;

  if (!out.ready) return out;

  const target = currentTarget(state);
  const gMult = globalMult(state.player);
  const upgraded = state.upgrades.includes(skill.key);
  // A Rest-node upgrade is a flat +25% on scaling effects and +1 on flat ones,
  // rather than 34 bespoke "+" variants. Same shape, far less surface area.
  const up = upgraded ? 1.25 : 1;
  if (upgraded) out.notes.push('upgraded');
  // Ophi's Slow Build rewards the long fight she is designed to win.
  const slowBuild = state.relics.includes('slow_build') ? 0.15 * (state.turn - 1) : 0;

  // The Multiplier rewrites the whole Sigma ladder.
  if (state.relics.includes('the_multiplier') && out.tier !== 'NONE') {
    const table: Record<string, number> = { SIGMA: 1.8, DOUBLE: 3.0, OMEGA: 4.8 };
    out.mult = table[out.tier] ?? out.mult;
  }
  // Ascension 12 flattens the biggest payoff in the game, forcing mastery of
  // consistent mid-tier Sigma instead of jackpot-chasing.
  if (state.omegaOverride !== null && out.tier === 'OMEGA') {
    out.mult = Math.min(out.mult, state.omegaOverride);
  }
  // Vex's Loaded Deck: a flat lift on every tier.
  if (state.relics.includes('loaded_deck') && out.tier !== 'NONE') out.mult += 0.4;
  // Perfect Pair promotes the first Sigma of the fight one tier.
  if (state.perfectPairReady && out.tier === 'SIGMA') {
    out.tier = 'DOUBLE';
    out.mult = SIGMA_MULT.DOUBLE;
    out.notes.push('Perfect Pair');
  } else if (state.perfectPairReady && out.tier === 'DOUBLE') {
    out.tier = 'OMEGA';
    out.mult = SIGMA_MULT.OMEGA;
    out.notes.push('Perfect Pair');
  }
  const isSigma = out.tier !== 'NONE';
  const sharp = state.relics.includes('sharp') ? 2 : 0;

  // Mark makes the next hit land as at least a SIGMA. It is how defensive and
  // combo builds reach amplified damage without matching faces.
  let dmgMult = out.mult;
  if (target?.mark && dmgMult < SIGMA_MULT.SIGMA) {
    dmgMult = SIGMA_MULT.SIGMA;
    out.notes.push('MARK → Sigma');
  }
  // The Ratio's INVERT turns amplification against you for a turn — the only
  // effect in the game that punishes the pillar mechanic. Telegraphed a full
  // turn ahead, so it is a planning problem rather than a gotcha.
  if (state.inverted && dmgMult > 1) {
    dmgMult = 1 / dmgMult;
    out.notes.push('INVERTED');
  }

  const priorFired = state.slots
    .slice(0, slotIndex)
    .some(() => true)
    ? state.slots.filter((_, j) => j < slotIndex && slotReady(state, j)).length
    : 0;

  for (const eff of skill.effects) {
    switch (eff.type) {
      case 'damage': {
        let power = eff.power + state.player.bonusPower + slowBuild;
        if (eff.condition === 'targetBelowPlayerHp' && eff.altPower !== undefined) {
          if (target && target.hp < state.player.hp) power = eff.altPower + state.player.bonusPower + slowBuild;
        }
        let hits = isSigma ? (eff.sigmaHits ?? eff.hits ?? 1) : (eff.hits ?? 1);
        if (eff.repeatPerPrior) {
          const per = isSigma ? (eff.sigmaRepeatPerPrior ?? eff.repeatPerPrior) : eff.repeatPerPrior;
          hits += per * priorFired;
        }
        const per = computeHit(out.pip, power * up, (eff.flat ?? 0), dmgMult, gMult, target, !!eff.ignoreBlock) + sharp;
        if (eff.target === 'all') {
          out.aoe += per * hits;
        } else {
          out.damage += per * hits;
          out.hits += hits;
        }
        if (eff.ignoreBlock) out.notes.push('ignores Block');
        break;
      }
      case 'block':
        out.block += Math.floor(out.pip * eff.power * up);
        if (eff.persist) out.notes.push('Block persists');
        break;
      case 'heal':
        out.heal += Math.floor(out.pip * (isSigma ? (eff.sigmaPower ?? eff.power) : eff.power) * up);
        break;
      case 'armor':
        if (!eff.sigmaOnly || isSigma) out.armor += eff.amount;
        break;
      case 'slip':
        out.slip += (isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount) + (upgraded ? 1 : 0);
        break;
      case 'slipIfFace': {
        const has = dice.some((d) => d.face === eff.face);
        if (isSigma || has) out.slip += eff.amount;
        break;
      }
      case 'slipPerFaceInBag': {
        const n = state.dice.filter((d) => eff.faces.includes(d.face)).length;
        out.slip += isSigma && eff.doubleOnSigma ? n * 2 : n;
        break;
      }
      case 'damagePerSlip': {
        const power = (isSigma ? (eff.sigmaPower ?? eff.power) : eff.power) * state.player.slip;
        out.damage += computeHit(out.pip, power, 0, dmgMult, gMult, target, false);
        out.hits += 1;
        out.notes.push(isSigma && eff.keepOnSigma ? 'keeps Slip' : 'spends all Slip');
        break;
      }
      case 'status': {
        const amount = eff.scaleWithPip !== undefined
          ? Math.floor(out.pip * (isSigma ? (eff.sigmaScaleWithPip ?? eff.scaleWithPip) : eff.scaleWithPip))
          : (isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount);
        addStatus(out.statuses, eff.status + (eff.target === 'all' ? ' (all)' : ''), amount);
        break;
      }
      case 'selfStatus':
        addStatus(out.selfStatuses, eff.status, isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount);
        break;
      case 'freeNudge':
        out.notes.push(`${isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount} free nudges`);
        break;
      case 'freeClone':
        out.notes.push(`${isSigma ? (eff.sigmaTimes ?? eff.times) : eff.times} free clone`);
        break;
      case 'rerollBag':
        out.notes.push(isSigma && eff.freezeHighestOnSigma ? 'reroll bag, freeze best' : 'reroll bag');
        break;
      case 'rerollSlotted':
        out.notes.push('rerolls these dice first');
        break;
      case 'setAllBag':
        out.notes.push(`sets whole bag to ${eff.face}`);
        break;
      case 'powerGain':
        out.notes.push(`+${isSigma ? (eff.sigmaAmount ?? eff.amount) : eff.amount} power`);
        break;
      case 'extraTurnOnKill':
        out.notes.push('extra turn on kill');
        break;
      case 'counter':
        out.notes.push('counters next attacker');
        break;
      case 'immuneJam':
        out.notes.push('jam immune');
        break;
      case 'oncePerFight':
        out.notes.push('once per fight');
        break;
      case 'setSlottedToHighest':
        break; // already applied above
    }
  }

  // Burning d6 rides along on any damage skill.
  const burning = dice.filter((d) => hasTrait(d, 'burning')).reduce((s, d) => s + d.face, 0);
  if (burning > 0 && (out.damage > 0 || out.aoe > 0)) {
    addStatus(out.statuses, 'burn', burning);
    out.notes.push('Burning die');
  }

  return out;
}

/** Rough "how good is this slot" number, used to rank tap-to-slot candidates. */
export function slotValue(p: SlotPreview): number {
  const statusValue = p.statuses.reduce((s, x) => s + x.amount * 0.35, 0);
  return (
    p.damage +
    p.aoe * 1.2 +
    p.block * 0.6 +
    p.heal * 0.8 +
    p.slip * 2 +
    p.armor * 3 +
    statusValue +
    p.selfStatuses.reduce((s, x) => s + x.amount * 2, 0)
  );
}

export function previewTurnDamage(state: GameState): number {
  let total = 0;
  for (let i = 0; i < state.slots.length; i++) {
    const p = previewSlot(state, i);
    total += p.damage + p.aoe;
  }
  return total;
}

export { WILD };
