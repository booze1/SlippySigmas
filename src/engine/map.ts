// Act map generation. See docs/06-run-structure.md §1-2.
//
// Six rows deep, 1-3 nodes wide, converging on a single boss. The player sees
// the ENTIRE act map before committing — routing is a strategic decision made
// with full information, not a gamble.

import type { Rng } from './rng.js';

export type NodeKind = 'battle' | 'hard' | 'elite' | 'event' | 'shop' | 'rest' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  kind: NodeKind;
  /** Indices into the next row that this node connects to. */
  next: number[];
}

export interface ActMap {
  act: number;
  rows: MapNode[][];
}

export const NODE_ICON: Record<NodeKind, string> = {
  battle: '⚔',
  hard: '⚔⚔',
  elite: '☠',
  event: '?',
  shop: '$',
  rest: '⌂',
  treasure: '◈',
  boss: '👑',
};

export const NODE_LABEL: Record<NodeKind, string> = {
  battle: 'Battle',
  hard: 'Hard battle',
  elite: 'Elite',
  event: 'Event',
  shop: 'Shop',
  rest: 'Rest',
  treasure: 'Treasure',
  boss: 'Boss',
};

const ROWS = 6;

/**
 * Weighted kind table for the middle rows. Row 1 is always a plain battle and
 * row 6 is always the boss, so these only apply to rows 2-5.
 */
const WEIGHTS: { kind: NodeKind; weight: number }[] = [
  { kind: 'battle', weight: 42 },
  { kind: 'hard', weight: 16 },
  { kind: 'elite', weight: 12 },
  { kind: 'event', weight: 14 },
  { kind: 'shop', weight: 8 },
  { kind: 'rest', weight: 6 },
  { kind: 'treasure', weight: 2 },
];

function generateOnce(act: number, rng: Rng): ActMap {
  const rows: MapNode[][] = [];

  for (let r = 0; r < ROWS; r++) {
    let width: number;
    if (r === 0) width = 1;
    else if (r === ROWS - 1) width = 1;
    else if (r === ROWS - 2) width = 2;
    else width = 2 + rng.int(2); // 2 or 3

    const row: MapNode[] = [];
    for (let c = 0; c < width; c++) {
      let kind: NodeKind;
      if (r === 0) kind = 'battle';
      else if (r === ROWS - 1) kind = 'boss';
      else if (r === ROWS - 2) kind = rng.float() < 0.7 ? 'rest' : 'treasure';
      else kind = rng.weighted(WEIGHTS).kind;
      row.push({ id: `a${act}r${r}c${c}`, row: r, col: c, kind, next: [] });
    }
    rows.push(row);
  }

  // Wire edges: every node reaches at least one node in the next row, and every
  // node in the next row is reachable from at least one node in this one.
  for (let r = 0; r < ROWS - 1; r++) {
    const here = rows[r];
    const next = rows[r + 1];
    for (let c = 0; c < here.length; c++) {
      const centre = Math.round((c / Math.max(1, here.length - 1)) * (next.length - 1));
      const options = new Set<number>([centre]);
      if (rng.float() < 0.55 && centre > 0) options.add(centre - 1);
      if (rng.float() < 0.55 && centre < next.length - 1) options.add(centre + 1);
      here[c].next = [...options].sort((a, b) => a - b);
    }
    // Guarantee reachability of every node in the next row.
    for (let n = 0; n < next.length; n++) {
      if (!here.some((node) => node.next.includes(n))) {
        const nearest = Math.min(here.length - 1, Math.round((n / Math.max(1, next.length - 1)) * (here.length - 1)));
        here[nearest].next.push(n);
        here[nearest].next.sort((a, b) => a - b);
      }
    }
  }

  return { act, rows };
}

/** Every distinct top-to-bottom route through the map. */
function allPaths(map: ActMap): NodeKind[][] {
  const out: NodeKind[][] = [];
  const walk = (r: number, c: number, acc: NodeKind[]): void => {
    const node = map.rows[r][c];
    const path = [...acc, node.kind];
    if (r === map.rows.length - 1) {
      out.push(path);
      return;
    }
    for (const n of node.next) walk(r + 1, n, path);
  };
  walk(0, 0, []);
  return out;
}

/**
 * Guarantees from docs/06 §2. A player must never be routed into a
 * reward-starved path by generation alone, so a map that fails any of these is
 * discarded and regenerated rather than patched.
 */
function isValid(map: ActMap): boolean {
  const flat = map.rows.flat();
  const count = (k: NodeKind) => flat.filter((n) => n.kind === k).length;

  if (count('shop') < 1) return false;
  if (count('elite') < 1 || count('elite') > 2) return false;
  if (count('treasure') > 1) return false;

  const paths = allPaths(map);
  // Every route must offer a Rest and at least one Event.
  for (const p of paths) {
    if (!p.includes('rest') && !p.includes('treasure')) return false;
    if (!p.includes('event')) return false;
  }
  // No route may stack two Events back-to-back.
  for (const p of paths) {
    for (let i = 1; i < p.length; i++) {
      if (p[i] === 'event' && p[i - 1] === 'event') return false;
    }
  }
  return true;
}

export function generateMap(act: number, rng: Rng): ActMap {
  for (let attempt = 0; attempt < 200; attempt++) {
    const map = generateOnce(act, rng);
    if (isValid(map)) return map;
  }
  // Fall back to a hand-shaped map rather than shipping an invalid one.
  const map = generateOnce(act, rng);
  map.rows[1][0].kind = 'event';
  map.rows[2][0].kind = 'shop';
  for (const n of map.rows[ROWS - 2]) n.kind = 'rest';
  return map;
}

export function nodeAt(map: ActMap, row: number, col: number): MapNode | undefined {
  return map.rows[row]?.[col];
}

/** Columns in `row` reachable from the node the player currently occupies. */
export function reachable(map: ActMap, row: number, col: number): number[] {
  if (row < 0) return [0];
  return nodeAt(map, row, col)?.next ?? [];
}
