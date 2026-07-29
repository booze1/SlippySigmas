// The run: 3 acts, 18 nodes, map routing, rewards, shops, rests and events.
// See docs/06-run-structure.md.
//
// RunState wraps the combat GameState rather than replacing it — a fight is a
// GameState the run owns for a while, and everything persistent (HP, gold, bag,
// loadout, relics) lives out here.

import type { BagEntry, GameState } from './types.js';
import { Rng } from './rng.js';
import { generateMap, reachable, type ActMap, type NodeKind } from './map.js';
import { newGame, BAG_CAP, DEFAULT_BAG, DEFAULT_LOADOUT, SLOT_COUNT } from './combat.js';
import { DICE_LIST, DICE_DEFS, entryFaces } from './dice.js';
import { SKILL_LIST, SKILLS } from './skills.js';
import { encountersFor } from '../data/enemies.js';
import { RELICS, RELIC_DEFS, type RelicDef } from '../data/relics.js';
import { EVENTS, type EventDef, type EventAction } from '../data/events.js';

/** Max HP granted for clearing an act boss. */
export const BOSS_MAX_HP = 12;
/** Max HP granted for clearing an elite. */
export const ELITE_MAX_HP = 4;

export type Screen =
  | 'map' | 'combat' | 'reward' | 'shop' | 'rest' | 'event' | 'treasure' | 'dead' | 'won';

export interface ShopItem {
  kind: 'die' | 'skill' | 'relic' | 'removal';
  key: string;
  price: number;
  sold?: boolean;
}

export interface RunState {
  seed: number;
  act: number;
  map: ActMap;
  /** -1 before the first node of an act is entered. */
  row: number;
  col: number;
  screen: Screen;

  hp: number;
  maxHp: number;
  gold: number;
  bag: BagEntry[];
  bagCap: number;
  loadout: (string | null)[];
  relics: string[];
  upgrades: string[];
  slipCapBonus: number;
  startSlipBonus: number;

  combat: GameState | null;
  /** Kind of the node currently being resolved. */
  nodeKind: NodeKind | null;

  offerSkills: string[];
  offerDice: string[];
  offerRelic: string | null;
  offerGold: number;
  shop: ShopItem[];
  event: EventDef | null;
  eventResult: string | null;
  /** Set by "The Grind" — the next reward is doubled. */
  doubleNextReward: boolean;

  log: string[];
  nodesCleared: number;
  totalDamage: number;
  biggestHit: number;
}

// ------------------------------------------------------------- rarity

type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

const RARITY_BY_ACT: Record<number, { r: Rarity; w: number }[]> = {
  1: [{ r: 'common', w: 62 }, { r: 'uncommon', w: 31 }, { r: 'rare', w: 6.5 }, { r: 'legendary', w: 0.5 }],
  2: [{ r: 'common', w: 42 }, { r: 'uncommon', w: 41 }, { r: 'rare', w: 15 }, { r: 'legendary', w: 2 }],
  3: [{ r: 'common', w: 26 }, { r: 'uncommon', w: 44 }, { r: 'rare', w: 26 }, { r: 'legendary', w: 4 }],
};

function rollRarity(act: number, rng: Rng, bump = false): Rarity {
  const table = RARITY_BY_ACT[Math.min(3, act)].map((x) => ({ ...x, weight: x.w }));
  let r = rng.weighted(table).r;
  if (bump) {
    const order: Rarity[] = ['common', 'uncommon', 'rare', 'legendary'];
    r = order[Math.min(order.length - 1, order.indexOf(r) + 1)];
  }
  return r;
}

function pickBy<T extends { rarity: Rarity; key: string }>(
  pool: T[], act: number, rng: Rng, count: number, bump = false, exclude: string[] = [],
): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(act, rng, bump);
    let candidates = pool.filter((p) => p.rarity === rarity && !out.includes(p.key) && !exclude.includes(p.key));
    if (!candidates.length) candidates = pool.filter((p) => !out.includes(p.key) && !exclude.includes(p.key));
    if (!candidates.length) break;
    out.push(rng.pick(candidates).key);
  }
  return out;
}

// --------------------------------------------------------------- setup

export function newRun(seed?: number): { run: RunState; rng: Rng } {
  const s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = new Rng(s);
  const run: RunState = {
    seed: s,
    act: 1,
    map: generateMap(1, rng),
    row: -1,
    col: 0,
    screen: 'map',
    hp: 60,
    maxHp: 60,
    gold: 0,
    bag: DEFAULT_BAG.map((k) => ({ key: k })),
    bagCap: BAG_CAP,
    loadout: [...DEFAULT_LOADOUT],
    relics: [],
    upgrades: [],
    slipCapBonus: 0,
    startSlipBonus: 0,
    combat: null,
    nodeKind: null,
    offerSkills: [],
    offerDice: [],
    offerRelic: null,
    offerGold: 0,
    shop: [],
    event: null,
    eventResult: null,
    doubleNextReward: false,
    log: [],
    nodesCleared: 0,
    totalDamage: 0,
    biggestHit: 0,
  };
  return { run, rng };
}

export function effectiveBagCap(run: RunState): number {
  return BAG_CAP
    + (run.relics.includes('big_bag') ? 1 : 0)
    + (run.relics.includes('whole_bag') ? 2 : 0);
}

export function slotCount(run: RunState): number {
  return SLOT_COUNT
    + (run.relics.includes('fifth_slot') ? 1 : 0)
    + (run.relics.includes('sixth_slot') ? 1 : 0);
}

// ----------------------------------------------------------- navigation

export function nextOptions(run: RunState): number[] {
  if (run.row < 0) return [0];
  return reachable(run.map, run.row, run.col);
}

function encounterFor(run: RunState, kind: NodeKind, rng: Rng): string {
  const map: Partial<Record<NodeKind, 'basic' | 'hard' | 'elite' | 'boss'>> = {
    battle: 'basic', hard: 'hard', elite: 'elite', boss: 'boss',
  };
  const want = map[kind] ?? 'basic';
  const pool = encountersFor(run.act, want);
  return (pool.length ? rng.pick(pool) : encountersFor(run.act, 'basic')[0]).key;
}

export function enterNode(run: RunState, col: number, rng: Rng): RunState {
  const r = structuredClone(run);
  const row = r.row + 1;
  if (!nextOptions(run).includes(col) && run.row >= 0) return run;
  r.row = row;
  r.col = col;
  const node = r.map.rows[row]?.[col];
  if (!node) return run;
  r.nodeKind = node.kind;

  switch (node.kind) {
    case 'battle':
    case 'hard':
    case 'elite':
    case 'boss':
      r.screen = 'combat';
      r.combat = startCombat(r, encounterFor(r, node.kind, rng), rng);
      break;
    case 'shop':
      r.screen = 'shop';
      r.shop = buildShop(r, rng);
      break;
    case 'rest':
      r.screen = 'rest';
      break;
    case 'treasure':
      r.screen = 'treasure';
      r.offerRelic = pickRelic(r, rng, true);
      break;
    case 'event':
      r.screen = 'event';
      r.event = rng.pick(EVENTS);
      r.eventResult = null;
      break;
  }
  return r;
}

function startCombat(run: RunState, encounterKey: string, rng: Rng): GameState {
  const { state } = newGame({
    seed: rng.int(2 ** 30),
    bag: run.bag,
    loadout: run.loadout,
    encounterKey,
    maxHp: run.maxHp,
    hp: run.hp,
    gold: run.gold,
    relics: run.relics,
    upgrades: run.upgrades,
    slipCapBonus: run.slipCapBonus,
    startSlip: 3 + run.startSlipBonus,
    slots: slotCount(run),
    act: run.act,
  });
  return state;
}

// -------------------------------------------------------------- rewards

const GOLD_BY_KIND: Record<string, [number, number]> = {
  battle: [12, 20], hard: [22, 35], elite: [45, 65], boss: [90, 120],
};

export function finishCombat(run: RunState, rng: Rng): RunState {
  const r = structuredClone(run);
  const c = r.combat;
  if (!c) return run;

  r.hp = Math.max(0, c.player.hp);
  r.totalDamage += c.stats.damageDealt;
  r.biggestHit = Math.max(r.biggestHit, c.stats.biggestHit);

  if (c.phase === 'LOSE' || r.hp <= 0) {
    r.screen = 'dead';
    return r;
  }

  r.nodesCleared += 1;
  const kind = r.nodeKind ?? 'battle';
  if (kind === 'elite') { r.maxHp += ELITE_MAX_HP; r.hp += ELITE_MAX_HP; }
  const [lo, hi] = GOLD_BY_KIND[kind] ?? GOLD_BY_KIND.battle;
  let gold = lo + rng.int(hi - lo + 1);
  if (r.relics.includes('coin_purse')) gold = Math.floor(gold * 1.25);
  if (r.doubleNextReward) gold *= 2;
  r.offerGold = gold;
  r.gold += gold;

  const skillCount = r.relics.includes('second_opinion') ? 4 : 3;
  const bump = kind === 'elite' || kind === 'boss';

  r.offerSkills = kind === 'elite'
    ? []
    : pickBy(SKILL_LIST, r.act, rng, skillCount, bump, r.loadout.filter(Boolean) as string[]);
  r.offerDice = kind === 'elite' ? pickBy(DICE_LIST, r.act, rng, 2, true)
    : kind === 'boss' ? pickBy(DICE_LIST, r.act, rng, 3, true)
    : [];
  r.offerRelic = (kind === 'elite' || kind === 'boss') ? pickRelic(r, rng, kind === 'boss') : null;
  r.doubleNextReward = false;

  r.screen = 'reward';
  r.combat = null;
  return r;
}

function pickRelic(run: RunState, rng: Rng, bump: boolean): string | null {
  const owned = run.relics;
  const pool = RELICS.filter((x) => !owned.includes(x.key))
    .filter((x) => x.key !== 'sixth_slot' || owned.includes('fifth_slot'));
  if (!pool.length) return null;
  return pickBy(pool, run.act, rng, 1, bump)[0] ?? null;
}

export function takeSkill(run: RunState, key: string, slot: number): RunState {
  const r = structuredClone(run);
  r.loadout[slot] = key;
  r.offerSkills = [];
  return r;
}

export function takeDie(run: RunState, key: string): RunState {
  const r = structuredClone(run);
  if (r.bag.length < effectiveBagCap(r)) r.bag.push({ key });
  r.offerDice = [];
  return r;
}

export function takeRelic(run: RunState): RunState {
  const r = structuredClone(run);
  if (r.offerRelic) {
    r.relics.push(r.offerRelic);
    applyRelicOnPickup(r, r.offerRelic);
    r.offerRelic = null;
  }
  return r;
}

function applyRelicOnPickup(r: RunState, key: string): void {
  if (key === 'thick_skin') { r.maxHp += 8; r.hp += 8; }
}

export function skipReward(run: RunState): RunState {
  const r = structuredClone(run);
  if (r.offerSkills.length) r.gold += 15;
  r.offerSkills = [];
  return r;
}

/** Reward screen is done when nothing is left to choose. */
export function rewardDone(run: RunState): boolean {
  return !run.offerSkills.length && !run.offerDice.length && !run.offerRelic;
}

export function leaveNode(run: RunState): RunState {
  const r = structuredClone(run);
  r.offerSkills = [];
  r.offerDice = [];
  r.offerRelic = null;
  r.event = null;
  r.eventResult = null;

  // Boss cleared: next act, or the run is won.
  //
  // docs/02 §6 assumes max HP reaches 85-100 by Act 3, but nothing in the
  // implementation actually granted it — only Thick Skin (+8) existed, so a
  // player entered Act 3 on ~60 HP against 20-55 damage per turn. Boss kills
  // now pay max HP, which is what the survivability budget was written around.
  if (r.nodeKind === 'boss') {
    r.maxHp += BOSS_MAX_HP;
    r.hp += BOSS_MAX_HP;
    if (r.act >= 3) { r.screen = 'won'; return r; }
    r.act += 1;
    r.map = generateMap(r.act, new Rng(r.seed + r.act * 7919));
    r.row = -1;
    r.col = 0;
  }
  r.screen = 'map';
  r.nodeKind = null;
  return r;
}

// ----------------------------------------------------------------- shop

function buildShop(run: RunState, rng: Rng): ShopItem[] {
  const price: Record<Rarity, number> = { common: 45, uncommon: 85, rare: 150, legendary: 240 };
  const items: ShopItem[] = [];
  for (const key of pickBy(DICE_LIST, run.act, rng, 3)) {
    items.push({ kind: 'die', key, price: price[DICE_DEFS[key].rarity] });
  }
  for (const key of pickBy(SKILL_LIST, run.act, rng, 3)) {
    items.push({ kind: 'skill', key, price: 60 + Math.floor(rng.int(4) * 20) });
  }
  const relicPool = RELICS.filter((x) => !run.relics.includes(x.key));
  for (const key of pickBy(relicPool, run.act, rng, 2)) {
    items.push({ kind: 'relic', key, price: 140 + rng.int(60) });
  }
  // Die removal is the most important item in the shop, and the escalating
  // price stops a player surgically sculpting a perfect bag by Act 3.
  items.push({ kind: 'removal', key: 'removal', price: 60 + run.nodesCleared * 4 });
  return items;
}

export function buy(run: RunState, index: number, slotOrDie?: number | string): RunState {
  const r = structuredClone(run);
  const item = r.shop[index];
  if (!item || item.sold || r.gold < item.price) return run;

  if (item.kind === 'die') {
    if (r.bag.length >= effectiveBagCap(r)) return run;
    r.bag.push({ key: item.key });
  } else if (item.kind === 'skill') {
    const slot = typeof slotOrDie === 'number' ? slotOrDie : 0;
    r.loadout[slot] = item.key;
  } else if (item.kind === 'relic') {
    r.relics.push(item.key);
    applyRelicOnPickup(r, item.key);
  } else if (item.kind === 'removal') {
    if (r.bag.length <= 1) return run;
    const idx = typeof slotOrDie === 'number' ? slotOrDie : 0;
    r.bag.splice(idx, 1);
  }
  r.gold -= item.price;
  item.sold = true;
  return r;
}

// ----------------------------------------------------------------- rest

export type ForgeKind = 'sharpen' | 'bevel' | 'flatten';

export function restHeal(run: RunState): RunState {
  const r = structuredClone(run);
  r.hp = Math.min(r.maxHp, r.hp + Math.floor(r.maxHp * 0.3));
  r.screen = 'map';
  r.nodeKind = null;
  return r;
}

export function restForge(run: RunState, dieIndex: number, kind: ForgeKind): RunState {
  const r = structuredClone(run);
  const entry = r.bag[dieIndex];
  if (!entry) return run;
  const faces = entryFaces(entry).slice();

  if (kind === 'sharpen') {
    entry.faces = faces.map((f) => (f === -1 ? f : f + 1));
  } else if (kind === 'bevel') {
    // Duplicate the most common face over the lowest — the consistency forge.
    const real = faces.filter((f) => f !== -1);
    const lowest = Math.min(...real);
    const counts = new Map<number, number>();
    for (const f of real) counts.set(f, (counts.get(f) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    entry.faces = faces.map((f) => (f === lowest ? top : f));
  } else {
    // Flatten: raise the lowest face to the second-lowest.
    const real = [...faces].filter((f) => f !== -1).sort((a, b) => a - b);
    const lowest = real[0];
    const second = real.find((f) => f > lowest) ?? lowest;
    entry.faces = faces.map((f) => (f === lowest ? second : f));
  }
  r.screen = 'map';
  r.nodeKind = null;
  return r;
}

export function restUpgrade(run: RunState, skillKey: string): RunState {
  const r = structuredClone(run);
  if (!r.upgrades.includes(skillKey)) r.upgrades.push(skillKey);
  r.screen = 'map';
  r.nodeKind = null;
  return r;
}

// ---------------------------------------------------------------- event

export function chooseEvent(run: RunState, choiceIndex: number, rng: Rng): RunState {
  let r = structuredClone(run);
  const ev = r.event;
  if (!ev) return run;
  const choice = ev.choices[choiceIndex];
  if (!choice) return run;
  if (choice.cost?.gold && r.gold < choice.cost.gold) return run;
  if (choice.cost?.gold) r.gold -= choice.cost.gold;

  const notes: string[] = [];
  for (const a of choice.actions) r = applyEventAction(r, a, rng, notes);
  r.eventResult = notes.length ? notes.join(' · ') : 'Nothing happens.';
  return r;
}

function applyEventAction(r: RunState, a: EventAction, rng: Rng, notes: string[]): RunState {
  switch (a.kind) {
    case 'heal':
      r.hp = Math.min(r.maxHp, r.hp + a.amount);
      notes.push(`healed ${a.amount}`);
      break;
    case 'healPct':
      r.hp = Math.min(r.maxHp, r.hp + Math.floor(r.maxHp * (a.pct / 100)));
      notes.push('healed');
      break;
    case 'damage':
      r.hp -= a.amount;
      notes.push(`took ${a.amount}`);
      if (r.hp <= 0) r.screen = 'dead';
      break;
    case 'gold':
      r.gold += a.amount;
      notes.push(`+${a.amount} gold`);
      break;
    case 'maxHp':
      r.maxHp += a.amount;
      r.hp += a.amount;
      notes.push(`+${a.amount} max HP`);
      break;
    case 'addDie': {
      const key = a.die ?? pickBy(DICE_LIST.filter((d) => d.rarity === (a.rarity ?? 'uncommon')), r.act, rng, 1)[0];
      if (key && r.bag.length < effectiveBagCap(r)) {
        r.bag.push({ key });
        notes.push(`gained ${DICE_DEFS[key].name}`);
      }
      break;
    }
    case 'removeDie':
    case 'loseRandomDie':
      if (r.bag.length > 1) {
        const idx = rng.int(r.bag.length);
        notes.push(`lost ${DICE_DEFS[r.bag[idx].key].name}`);
        r.bag.splice(idx, 1);
      }
      break;
    case 'duplicateDie':
      if (r.bag.length < effectiveBagCap(r)) {
        const src = rng.pick(r.bag);
        r.bag.push({ ...src });
        notes.push(`duplicated ${DICE_DEFS[src.key].name}`);
      }
      break;
    case 'upgradeAllDiceLow':
      for (const entry of r.bag) {
        const faces = entryFaces(entry);
        const real = faces.filter((f) => f !== -1);
        const lowest = Math.min(...real);
        const second = [...real].sort((x, y) => x - y).find((f) => f > lowest) ?? lowest;
        entry.faces = faces.map((f) => (f === lowest ? second : f));
      }
      notes.push('every die smoothed');
      break;
    case 'sharpenDie': {
      const entry = rng.pick(r.bag);
      entry.faces = entryFaces(entry).map((f) => (f === -1 ? f : f + 1));
      notes.push(`sharpened ${DICE_DEFS[entry.key].name}`);
      break;
    }
    case 'mirrorLowDice': {
      if (r.bag.length >= 3) {
        const avg = (e: BagEntry) => entryFaces(e).reduce((x, y) => x + y, 0) / entryFaces(e).length;
        const sorted = [...r.bag].sort((x, y) => avg(x) - avg(y));
        const best = sorted[sorted.length - 1];
        for (const low of sorted.slice(0, 2)) {
          const i = r.bag.indexOf(low);
          if (i >= 0) r.bag[i] = { ...best };
        }
        notes.push('two lowest dice replaced');
      }
      break;
    }
    case 'slipCap':
      r.slipCapBonus += a.amount;
      notes.push(`+${a.amount} Slip cap`);
      break;
    case 'startSlip':
      r.startSlipBonus += a.amount;
      notes.push(`+${a.amount} Slip at fight start`);
      break;
    case 'relic': {
      const key = pickRelic(r, rng, true);
      if (key) {
        r.relics.push(key);
        applyRelicOnPickup(r, key);
        notes.push(`gained ${RELIC_DEFS[key].name}`);
      }
      break;
    }
    case 'rollDie': {
      const roll = rng.int(6) + 1;
      notes.push(`rolled ${roll}`);
      const outcome = a.outcomes.find((o) => roll <= o.max);
      if (outcome) for (const inner of outcome.then) r = applyEventAction(r, inner, rng, notes);
      break;
    }
    case 'fightElite':
      r.doubleNextReward = true;
      notes.push('an elite awakens');
      break;
    case 'skipNode':
      notes.push('you slip past the next fight');
      break;
    case 'nothing':
      break;
  }
  return r;
}

// ---------------------------------------------------------------- helpers

export function relicDef(key: string): RelicDef | undefined {
  return RELIC_DEFS[key];
}

export function skillName(key: string | null): string {
  return key ? (SKILLS[key]?.name ?? key) : '— empty —';
}

export function totalNodes(run: RunState): number {
  return run.nodesCleared;
}
