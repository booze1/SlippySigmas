// Slippy Sigmas — Phase 4 "the meta".
//
// Three acts wrapped in a persistent meta layer: Chips, the unlock tree, three
// heroes, Ascension, and a statistics screen. Controller + renderer; the engine
// underneath is pure and UI-agnostic.
//
// Three levels of state, outermost first:
//   MetaState  persists across runs in localStorage
//   RunState   one run: HP, gold, bag, loadout, relics, map position
//   GameState  one fight, owned by the run for a while

import type { GameState, Die, Enemy } from './engine/types.js';
import {
  newRun, enterNode, finishCombat, nextOptions, takeSkill, takeDie, takeRelic,
  skipReward, rewardDone, leaveNode, buy, restHeal, restForge, restUpgrade,
  chooseEvent, effectiveBagCap, relicDef, skillName, runOutcome,
  type RunState, type ForgeKind,
} from './engine/run.js';
import { NODE_ICON, NODE_LABEL } from './engine/map.js';
import {
  loadMeta, saveMeta, wipeMeta, buyUnlock, canBuy, tierUnlocked, availableHeroes,
  setHero, setAscension, recordRun, remainingCost, type MetaState,
} from './engine/meta.js';
import { UNLOCKS, TIER_GATES, ASCENSION, MAX_ASCENSION } from './data/unlocks.js';
import { HEROES, HERO_DEFS } from './data/heroes.js';
import { DICE_DEFS as DDEFS, entryFaces } from './engine/dice.js';
import { Rng } from './engine/rng.js';
import {
  resolveTurn, slotDie, unslotDie, autoSlot, setSlotSkill,
  setTarget, nudge, reroll, freeze, cloneFace, setFace, split, canAfford, slipCostOf,
  type ResolveEvent,
} from './engine/combat.js';
import {
  SKILLS, SKILL_LIST, previewSlot, canSlot, costLabel, diceInSlot,
  livingEnemies, currentTarget, slotReady,
} from './engine/skills.js';
import { DICE_DEFS, facesOf, crownOf, isWild, faceLabel, traitOf } from './engine/dice.js';
import { intentLabel, intentIcon } from './engine/enemy.js';
import { VERB_BLURB, type SlipVerb } from './engine/slip.js';
import { tierLabel, TIER_RANK } from './engine/sigma.js';
import { enemyStatusTags, playerStatusTags } from './engine/status.js';

// ------------------------------------------------------------------ state

let rng: Rng;
let run: RunState;
let meta: MetaState;

/** Hub screens live outside a run, so they are tracked separately. */
type HubScreen = 'hub' | 'unlocks' | 'stats' | 'heroes' | null;

/** Combat state lives inside the run; this is a convenience alias. */
let state: GameState;

const ui = {
  selected: null as string | null,
  armed: null as SlipVerb | null,
  hoverSlot: null as number | null,
  dragging: null as string | null,
  justRolled: false,
  /** Reward flow: a skill is chosen, then a slot to put it in. */
  pendingSkill: null as string | null,
  /** Rest flow. */
  restMode: null as 'forge' | 'upgrade' | null,
  forgeDie: null as number | null,
  /** Shop flow: buying a skill needs a slot, removal needs a die. */
  shopPending: null as number | null,
  /** Which out-of-run screen is showing. null means a run is in progress. */
  hub: 'hub' as HubScreen,
  /** Chips awarded by the run that just ended, for the summary. */
  lastChips: 0,
  runBanked: false,
};

function startRun(seed?: number): void {
  const g = newRun(seed, meta);
  run = g.run;
  rng = g.rng;
  ui.hub = null;
  ui.runBanked = false;
  ui.lastChips = 0;
  syncCombat();
  render();
}

/**
 * Bank the finished run into the meta layer exactly once. Both end screens can
 * re-render many times, and paying Chips twice for one run would quietly break
 * the whole economy.
 */
function bankRun(): void {
  if (ui.runBanked) return;
  ui.runBanked = true;
  const { meta: next, chips } = recordRun(meta, runOutcome(run));
  meta = next;
  ui.lastChips = chips;
}

function syncCombat(): void {
  state = run.combat ?? state;
}

function setRun(next: RunState): void {
  run = next;
  syncCombat();
  render();
}

function setState(next: GameState): void {
  if (next === state) return;
  state = next;
  run.combat = next;
  render();
}

// ---------------------------------------------------------------- helpers

const $ = (id: string) => document.getElementById(id)!;

function activeDie(): Die | null {
  const id = ui.dragging ?? ui.selected;
  return id ? (state.dice.find((d) => d.id === id) ?? null) : null;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/**
 * Could placing this die here still lead to a SIGMA?
 * Not "is it a Sigma now" — that is only true on the LAST die, far too late to
 * be a decision. This checks matching faces actually remain in the tray.
 */
function sigmaPotential(die: Die, slotIndex: number): boolean {
  const slot = state.slots[slotIndex];
  const skill = slot?.skillKey && !slot.spent ? SKILLS[slot.skillKey] : null;
  if (!skill) return false;
  const occupants = diceInSlot(state, slotIndex);
  if (occupants.some((d) => !isWild(d) && !isWild(die) && d.face !== die.face)) return false;

  const need = skill.cost.count - occupants.length - 1;
  if (need < 0) return false;
  if (skill.cost.count === 1) return isWild(die) || die.face === crownOf(die);

  const matches = state.dice.filter(
    (d) => d.id !== die.id && d.slot === null && !d.jammed &&
      (isWild(d) || isWild(die) || d.face === die.face) && canSlot(state, d, slotIndex),
  ).length;
  return matches >= need;
}

// ----------------------------------------------------------------- render

function render(): void {
  if (ui.hub) {
    ($('combat-screen') as HTMLElement).hidden = true;
    $('runbar').innerHTML = renderHubBar();
    $('other-screen').innerHTML = renderHub();
    $('debug').innerHTML = '';
    ($('debugwrap') as HTMLElement).hidden = true;
    return;
  }
  ($('debugwrap') as HTMLElement).hidden = false;

  if (run.screen === 'dead' || run.screen === 'won') bankRun();

  const inCombat = run.screen === 'combat' && !!run.combat;
  ($('combat-screen') as HTMLElement).hidden = !inCombat;
  const other = $('other-screen');

  renderRunBar();

  if (inCombat) {
    other.innerHTML = '';
    renderStatus();
    renderEnemies();
    renderSlots();
    renderTray();
    renderInspector();
    renderSlip();
    renderResolve();
    renderLog();
  } else {
    other.innerHTML = renderScreen();
  }
  renderDebug();
  ui.justRolled = false;
}

function renderRunBar(): void {
  const pct = Math.max(0, (run.hp / run.maxHp) * 100);
  $('runbar').innerHTML = `
    <div class="runrow">
      <span class="pill act">ACT ${run.act}</span>
      <div class="hpbar">
        <i style="width:${pct}%"></i>
        <span>${Math.max(0, run.hp)} / ${run.maxHp}</span>
      </div>
      <span class="pill goldp">${run.gold}g</span>
    </div>`;
}

function renderScreen(): string {
  switch (run.screen) {
    case 'map': return renderMap();
    case 'reward': return renderReward();
    case 'shop': return renderShop();
    case 'rest': return renderRest();
    case 'event': return renderEvent();
    case 'treasure': return renderTreasure();
    case 'dead': return renderEnd(false);
    case 'won': return renderEnd(true);
    default: return '';
  }
}

// --------------------------------------------------------------- hub screens

function renderHubBar(): string {
  return `
    <div class="runrow">
      <span class="pill act">THE BAG</span>
      <div class="hubchips"><b>${meta.chips}</b> chips</div>
      ${meta.ascension > 0 ? `<span class="pill asc">A${meta.ascension}</span>` : ''}
    </div>`;
}

function renderHub(): string {
  switch (ui.hub) {
    case 'unlocks': return renderUnlocks();
    case 'stats': return renderStats();
    case 'heroes': return renderHeroes();
    default: return renderHubHome();
  }
}

function renderHubHome(): string {
  const hero = HERO_DEFS[meta.hero];
  const s = meta.stats;
  const rate = s.runs ? Math.round((s.wins / s.runs) * 100) : 0;
  return `
    <div class="screen">
      <h1 class="wordmark">SLIPPY SIGMAS</h1>
      <p class="lead">Roll bad dice. Make them good. Delete everything.</p>

      ${ui.lastChips ? `<div class="card chipcard"><div class="cardhead">Run banked</div>
        <div class="carddesc">+${ui.lastChips} chips${run.screen === 'won' ? ' — run complete.' : `, died in Act ${run.act}.`}</div></div>` : ''}

      <button class="card pick herocard" data-hub="heroes">
        <div class="cardhead">${esc(hero.name)} <span class="dim">${esc(hero.title)}</span></div>
        <div class="carddesc">${esc(hero.passiveText)}</div>
        <div class="cost">tap to change hero${availableHeroes(meta).length > 1 ? '' : ' — 1 unlocked'}</div>
      </button>

      <button class="wide" id="beginrun">BEGIN RUN</button>

      <div class="offers">
        <button class="card pick" data-hub="unlocks">
          <div class="cardhead">The Unlock Tree</div>
          <div class="carddesc">${meta.unlocked.length} / ${UNLOCKS.length} unlocked · ${remainingCost(meta)} chips remaining</div>
        </button>
        <button class="card pick" data-hub="stats">
          <div class="cardhead">Statistics</div>
          <div class="carddesc">${s.runs} runs · ${s.wins} wins (${rate}%) · biggest hit ${s.biggestHit}</div>
        </button>
        ${meta.maxAscension > 0 ? `<div class="card">
          <div class="cardhead">Ascension</div>
          <div class="carddesc">${meta.ascension === 0 ? 'Off.' : esc(ASCENSION[meta.ascension - 1].text)}</div>
          <div class="ascrow">
            <button class="chip" data-asc="${meta.ascension - 1}" ${meta.ascension <= 0 ? 'disabled' : ''}>−</button>
            <b>A${meta.ascension}</b>
            <button class="chip" data-asc="${meta.ascension + 1}" ${meta.ascension >= meta.maxAscension ? 'disabled' : ''}>+</button>
            <span class="dim">max A${meta.maxAscension} of ${MAX_ASCENSION}</span>
          </div>
        </div>` : ''}
      </div>

      <p class="fine">Unlocks add variety, never power. A first run and a hundredth run have the same ceiling.</p>
    </div>`;
}

function renderUnlocks(): string {
  const groups = TIER_GATES.map((gate) => {
    const open = tierUnlocked(meta, gate.tier);
    const rows = UNLOCKS.filter((u) => u.tier === gate.tier).map((u) => {
      const owned = meta.unlocked.includes(u.key);
      const buyable = canBuy(meta, u);
      const label = u.kind === 'die' ? DDEFS[u.target]?.name
        : u.kind === 'skill' ? SKILLS[u.target]?.name
        : u.kind === 'hero' ? `HERO — ${HERO_DEFS[u.target]?.name}`
        : '+1 skill slot relics';
      const detail = u.kind === 'die' ? (DDEFS[u.target]?.note ?? '')
        : u.kind === 'skill' ? (SKILLS[u.target]?.blurb ?? '')
        : u.kind === 'hero' ? (HERO_DEFS[u.target]?.blurb ?? '')
        : 'Fifth Slot and Sixth Slot can now appear as relics.';
      return `<button class="card pick ${owned ? 'owned' : ''} ${buyable ? '' : 'poor'}"
                 data-unlock="${u.key}" ${buyable ? '' : 'disabled'}>
        <div class="cardhead">${esc(label ?? u.target)}
          <span class="price">${owned ? '✓' : `${u.cost}`}</span></div>
        <div class="carddesc">${esc(detail)}</div></button>`;
    }).join('');
    return `<h3>${open ? '' : '🔒 '}Tier ${gate.tier} — ${esc(gate.label)}</h3><div class="offers">${rows}</div>`;
  }).join('');

  return `<div class="screen">
    <h2>The Unlock Tree</h2>
    <p class="lead">Everything here enters the shared run pool — it can then appear as a reward, in shops, or in events. Nothing is equipped from here.</p>
    ${groups}
    <button class="wide ghost" data-hub="hub">Back</button>
  </div>`;
}

function renderStats(): string {
  const s = meta.stats;
  const rate = s.runs ? Math.round((s.wins / s.runs) * 100) : 0;
  const top = (rec: Record<string, number>, n = 5) =>
    Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);

  const deaths = top(s.deaths);
  const dice = top(s.diceUsed);
  const skills = top(s.skillsUsed);

  return `<div class="screen">
    <h2>Statistics</h2>
    <div class="statgrid big">
      <span>runs</span><b>${s.runs}</b>
      <span>wins</span><b>${s.wins}</b>
      <span>win rate</span><b>${rate}%</b>
      <span>best act reached</span><b>${s.bestAct}</b>
      <span>biggest single hit</span><b class="goldc">${s.biggestHit}</b>
      <span>highest Sigma tier</span><b class="goldc">${s.highestTier}</b>
      <span>total Slip spent</span><b>${s.totalSlipSpent}</b>
      <span>total damage</span><b>${s.totalDamage}</b>
      <span>fastest win</span><b>${s.fastestWinNodes ?? '—'}${s.fastestWinNodes ? ' nodes' : ''}</b>
    </div>

    ${deaths.length ? `<h3>Deaths by killer</h3><div class="barlist">${deaths.map(([k, v]) =>
      `<div class="bar"><span>${esc(k)}</span><i style="width:${(v / deaths[0][1]) * 100}%"></i><b>${v}</b></div>`).join('')}</div>` : ''}

    ${dice.length ? `<h3>Most-carried dice</h3><div class="barlist">${dice.map(([k, v]) =>
      `<div class="bar"><span>${esc(DDEFS[k]?.name ?? k)}</span><i style="width:${(v / dice[0][1]) * 100}%"></i><b>${v}</b></div>`).join('')}</div>` : ''}

    ${skills.length ? `<h3>Most-equipped skills</h3><div class="barlist">${skills.map(([k, v]) =>
      `<div class="bar"><span>${esc(SKILLS[k]?.name ?? k)}</span><i style="width:${(v / skills[0][1]) * 100}%"></i><b>${v}</b></div>`).join('')}</div>` : ''}

    <button class="wide ghost" data-hub="hub">Back</button>
    <button class="wide ghost" id="wipemeta">Erase all progress</button>
  </div>`;
}

function renderHeroes(): string {
  const open = availableHeroes(meta);
  return `<div class="screen">
    <h2>Choose your hero</h2>
    <p class="lead">Each hero is a different relationship with Slip: correct it, reroll past it, or lock it down.</p>
    <div class="offers">${HEROES.map((h) => {
      const unlocked = open.includes(h.key);
      const current = meta.hero === h.key;
      return `<button class="card pick ${current ? 'owned' : ''} ${unlocked ? '' : 'poor'}"
                data-hero="${h.key}" ${unlocked ? '' : 'disabled'}>
        <div class="cardhead">${esc(h.name)} <span class="dim">${esc(h.title)}</span>
          <span class="price">${current ? '✓' : unlocked ? '' : '🔒'}</span></div>
        <div class="carddesc">${esc(h.blurb)}</div>
        <div class="cost">${h.maxHp} HP · ${h.bag.length} dice · ${esc(h.passiveText)}</div>
      </button>`;
    }).join('')}</div>
    <button class="wide ghost" data-hub="hub">Back</button>
  </div>`;
}

// ------------------------------------------------------------------ screens

function renderMap(): string {
  // Absolute positioning with an SVG underlay, because the routes ARE the
  // information here. Node types alone do not tell you which paths exist, and
  // docs/06 promises the whole map is legible before you commit.
  const NODE = 46, PITCH_X = 58, PITCH_Y = 62, PAD = 8;
  const rows = run.map.rows;
  const width = PITCH_X * 3;
  const height = PITCH_Y * rows.length;

  // Row 0 is the start, drawn at the BOTTOM so the boss sits at the top.
  const xy = (r: number, c: number): [number, number] => {
    const w = rows[r].length;
    const x = width / 2 + (c - (w - 1) / 2) * PITCH_X - NODE / 2;
    const y = height - (r + 1) * PITCH_Y + PAD;
    return [x, y];
  };

  const edges: string[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const [x1, y1] = xy(r, c);
      for (const n of rows[r][c].next) {
        const [x2, y2] = xy(r + 1, n);
        const live = r === run.row && c === run.col;
        edges.push(
          `<line x1="${x1 + NODE / 2}" y1="${y1}" x2="${x2 + NODE / 2}" y2="${y2 + NODE}"
                 class="edge ${live ? 'live' : ''}" />`,
        );
      }
    }
  }

  const options = nextOptions(run);
  const nodes: string[] = [];
  rows.forEach((row, r) => {
    row.forEach((node, c) => {
      const [x, y] = xy(r, c);
      const here = r === run.row && c === run.col;
      const done = r < run.row;
      const open = r === run.row + 1 && options.includes(c);
      const cls = ['mapnode', here ? 'here' : '', done ? 'done' : '', open ? 'open' : ''].filter(Boolean).join(' ');
      nodes.push(
        `<button class="${cls}" style="left:${x}px;top:${y}px" ${open ? `data-node="${c}"` : 'disabled'}
                 title="${NODE_LABEL[node.kind]}"><span class="mi">${NODE_ICON[node.kind]}</span></button>`,
      );
    });
  });

  return `
    <div class="screen">
      <h2>Act ${run.act} — choose your route</h2>
      <p class="lead">The whole map is visible before you commit. ${run.nodesCleared} nodes cleared.</p>
      <div class="mapgrid" style="height:${height + PAD * 2}px">
        <div class="mapinner" style="width:${width}px;height:${height + PAD * 2}px">
          <svg class="edges" viewBox="0 0 ${width} ${height + PAD * 2}" width="${width}" height="${height + PAD * 2}">${edges.join('')}</svg>
          ${nodes.join('')}
        </div>
      </div>
      <div class="legend">
        ${(['battle','hard','elite','event','shop','rest','treasure','boss'] as const)
          .map((k) => `<span><b>${NODE_ICON[k]}</b> ${NODE_LABEL[k]}</span>`).join('')}
      </div>
    </div>`;
}

function renderReward(): string {
  const parts: string[] = [`<h2>Victory</h2>`];
  if (run.offerGold) parts.push(`<p class="lead">+${run.offerGold} gold.</p>`);

  if (run.offerRelic) {
    const d = relicDef(run.offerRelic)!;
    parts.push(`<div class="card"><div class="cardhead">${esc(d.name)} <span class="rar ${d.rarity}">${d.rarity}</span></div>
      <div class="carddesc">${esc(d.text)}</div>
      <button class="wide" id="takerelic">Take relic</button></div>`);
  }

  if (run.offerDice.length) {
    parts.push('<h3>Pick a die</h3><div class="offers">');
    for (const key of run.offerDice) {
      const d = DDEFS[key];
      parts.push(`<button class="card pick" data-takedie="${key}">
        <div class="cardhead">${esc(d.name)} <span class="rar ${d.rarity}">${d.rarity}</span></div>
        <div class="faces">${d.faces.map((f) => `<i>${f === -1 ? 'W' : f}</i>`).join('')}</div>
        <div class="carddesc">${esc(d.note ?? '')}</div></button>`);
    }
    parts.push('</div>');
    if (run.bag.length >= effectiveBagCap(run)) {
      parts.push('<p class="warn">Bag is full — taking a die is not possible. Skip, or remove one at a shop.</p>');
      parts.push('<button class="wide" id="skipdice">Skip the die</button>');
    }
  }

  if (run.offerSkills.length) {
    if (ui.pendingSkill) {
      parts.push(`<h3>Replace which slot?</h3><div class="offers">`);
      run.loadout.forEach((k, i) => {
        parts.push(`<button class="card pick" data-slotpick="${i}">
          <div class="cardhead">Slot ${i + 1}</div>
          <div class="carddesc">${esc(skillName(k))}</div></button>`);
      });
      parts.push('</div><button class="wide ghost" id="cancelskill">Back</button>');
    } else {
      parts.push('<h3>Pick a skill</h3><div class="offers">');
      for (const key of run.offerSkills) {
        const sk = SKILLS[key];
        parts.push(`<button class="card pick" data-takeskill="${key}">
          <div class="cardhead">${esc(sk.name)} <span class="rar ${sk.rarity}">${sk.rarity}</span></div>
          <div class="cost">${costLabel(sk.cost)} · ${sk.lane}</div>
          <div class="carddesc">${esc(sk.blurb)}</div></button>`);
      }
      parts.push('</div><button class="wide ghost" id="skipskill">Skip for 15 gold</button>');
    }
  }

  if (rewardDone(run)) parts.push('<button class="wide" id="continue">Continue</button>');
  return `<div class="screen">${parts.join('')}</div>`;
}

function renderShop(): string {
  const rows = run.shop.map((item, i) => {
    if (item.sold) return `<div class="card sold">sold</div>`;
    const afford = run.gold >= item.price;
    let head = '', desc = '';
    if (item.kind === 'die') { const d = DDEFS[item.key]; head = d.name; desc = `[${d.faces.map((f) => (f === -1 ? 'W' : f)).join(',')}] ${d.note ?? ''}`; }
    else if (item.kind === 'skill') { const sk = SKILLS[item.key]; head = sk.name; desc = `${costLabel(sk.cost)} — ${sk.blurb}`; }
    else if (item.kind === 'relic') { const r = relicDef(item.key)!; head = r.name; desc = r.text; }
    else { head = 'Remove a die'; desc = 'Price rises each time it is used.'; }
    return `<button class="card pick ${afford ? '' : 'poor'}" data-buy="${i}" ${afford ? '' : 'disabled'}>
      <div class="cardhead">${esc(head)} <span class="price">${item.price}g</span></div>
      <div class="carddesc">${esc(desc)}</div></button>`;
  }).join('');

  let picker = '';
  if (ui.shopPending !== null) {
    const item = run.shop[ui.shopPending];
    if (item?.kind === 'skill') {
      picker = `<h3>Into which slot?</h3><div class="offers">${run.loadout
        .map((k, i) => `<button class="card pick" data-buyslot="${i}"><div class="cardhead">Slot ${i + 1}</div><div class="carddesc">${esc(skillName(k))}</div></button>`)
        .join('')}</div><button class="wide ghost" id="cancelbuy">Back</button>`;
    } else if (item?.kind === 'removal') {
      picker = `<h3>Remove which die?</h3><div class="offers">${run.bag
        .map((e, i) => `<button class="card pick" data-buyslot="${i}"><div class="cardhead">${esc(DDEFS[e.key].name)}</div><div class="faces">${entryFaces(e).map((f) => `<i>${f === -1 ? 'W' : f}</i>`).join('')}</div></button>`)
        .join('')}</div><button class="wide ghost" id="cancelbuy">Back</button>`;
    }
  }

  return `<div class="screen">
    <h2>Shop</h2>
    <p class="lead">${run.gold} gold. Removal is usually worth more than another die.</p>
    ${picker || `<div class="offers">${rows}</div><button class="wide" id="continue">Leave</button>`}
  </div>`;
}

function renderRest(): string {
  if (ui.restMode === 'forge') {
    if (ui.forgeDie === null) {
      return `<div class="screen"><h2>Forge which die?</h2><div class="offers">${run.bag
        .map((e, i) => `<button class="card pick" data-forgedie="${i}"><div class="cardhead">${esc(DDEFS[e.key].name)}</div><div class="faces">${entryFaces(e).map((f) => `<i>${f === -1 ? 'W' : f}</i>`).join('')}</div></button>`)
        .join('')}</div><button class="wide ghost" id="cancelrest">Back</button></div>`;
    }
    const e = run.bag[ui.forgeDie];
    return `<div class="screen"><h2>Forge ${esc(DDEFS[e.key].name)}</h2>
      <div class="faces big">${entryFaces(e).map((f) => `<i>${f === -1 ? 'W' : f}</i>`).join('')}</div>
      <div class="offers">
        <button class="card pick" data-forge="sharpen"><div class="cardhead">Sharpen</div><div class="carddesc">+1 to every face. Raises the ceiling, keeps the matching structure.</div></button>
        <button class="card pick" data-forge="bevel"><div class="cardhead">Bevel</div><div class="carddesc">Overwrite the lowest face with your most common one. The consistency forge.</div></button>
        <button class="card pick" data-forge="flatten"><div class="cardhead">Flatten</div><div class="carddesc">Raise the lowest face to the second-lowest. Better matching, less Slip income.</div></button>
      </div>
      <button class="wide ghost" id="cancelrest">Back</button></div>`;
  }

  if (ui.restMode === 'upgrade') {
    return `<div class="screen"><h2>Upgrade which skill?</h2><div class="offers">${run.loadout
      .filter(Boolean)
      .map((k) => {
        const sk = SKILLS[k as string];
        const done = run.upgrades.includes(k as string);
        return `<button class="card pick" data-upgrade="${k}" ${done ? 'disabled' : ''}>
          <div class="cardhead">${esc(sk.name)}${done ? ' ✓' : ''}</div>
          <div class="carddesc">${esc(sk.blurb)}</div></button>`;
      }).join('')}</div><button class="wide ghost" id="cancelrest">Back</button></div>`;
  }

  return `<div class="screen">
    <h2>Rest</h2>
    <p class="lead">You can only do one. Survival now, consistency forever, or damage forever.</p>
    <div class="offers">
      <button class="card pick" id="resthaeal" data-rest="heal"><div class="cardhead">Heal ${Math.floor(run.maxHp * 0.3)}</div><div class="carddesc">Back to ${Math.min(run.maxHp, run.hp + Math.floor(run.maxHp * 0.3))} / ${run.maxHp}.</div></button>
      <button class="card pick" data-rest="forge"><div class="cardhead">Forge a die</div><div class="carddesc">Permanently reshape one die's faces.</div></button>
      <button class="card pick" data-rest="upgrade"><div class="cardhead">Upgrade a skill</div><div class="carddesc">+25% on its scaling effects, for the rest of the run.</div></button>
    </div>
  </div>`;
}

function renderEvent(): string {
  const ev = run.event;
  if (!ev) return '';
  if (run.eventResult) {
    return `<div class="screen"><h2>${esc(ev.name)}</h2>
      <p class="lead">${esc(run.eventResult)}</p>
      <button class="wide" id="continue">Continue</button></div>`;
  }
  return `<div class="screen">
    <h2>${esc(ev.name)}</h2>
    <p class="lead">${esc(ev.text)}</p>
    <div class="offers">${ev.choices.map((c, i) => {
      const poor = !!c.cost?.gold && run.gold < c.cost.gold;
      return `<button class="card pick ${poor ? 'poor' : ''}" data-event="${i}" ${poor ? 'disabled' : ''}>
        <div class="cardhead">${esc(c.label)}</div>
        ${c.detail ? `<div class="carddesc">${esc(c.detail)}</div>` : ''}</button>`;
    }).join('')}</div>
  </div>`;
}

function renderTreasure(): string {
  if (!run.offerRelic) return `<div class="screen"><h2>Empty</h2><button class="wide" id="continue">Continue</button></div>`;
  const d = relicDef(run.offerRelic)!;
  return `<div class="screen"><h2>Treasure</h2>
    <div class="card"><div class="cardhead">${esc(d.name)} <span class="rar ${d.rarity}">${d.rarity}</span></div>
    <div class="carddesc">${esc(d.text)}</div></div>
    <button class="wide" id="takerelic">Take it</button></div>`;
}

function renderEnd(won: boolean): string {
  return `<div class="screen end ${won ? 'won' : 'dead'}">
    <h2>${won ? 'RUN COMPLETE' : 'DEFEAT'}</h2>
    <div class="statgrid big">
      <span>act reached</span><b>${run.act}</b>
      <span>nodes cleared</span><b>${run.nodesCleared}</b>
      <span>total damage</span><b>${run.totalDamage}</b>
      <span>biggest hit</span><b class="goldc">${run.biggestHit}</b>
      <span>final bag</span><b>${run.bag.length} dice</b>
      <span>relics</span><b>${run.relics.length}</b>
      <span>seed</span><b>${run.seed}</b>
    </div>
    <div class="chipaward">+${ui.lastChips} chips</div>
    <button class="wide" id="tohub">Back to The Bag</button>
  </div>`;
}

function renderStatus(): void {
  const p = state.player;
  const tags = playerStatusTags(p)
    .map((t) => `<span class="pill" style="color:${t.colour}">${esc(t.text)}</span>`)
    .join('');
  $('statusbar').innerHTML = `
    <div class="statusrow">
      <span class="pill turn">T${state.turn}</span>
      <div class="hpbar">
        <i style="width:${Math.max(0, (p.hp / p.maxHp) * 100)}%"></i>
        <span>${Math.max(0, p.hp)} / ${p.maxHp}</span>
      </div>
    </div>
    ${tags ? `<div class="tagrow">${tags}</div>` : ''}`;
}

function enemyHtml(e: Enemy, isTarget: boolean): string {
  const tags = enemyStatusTags(e)
    .map((t) => `<span class="pill" style="color:${t.colour}">${esc(t.text)}</span>`)
    .join('');
  return `
    <div class="enemy ${isTarget ? 'targeted' : ''} ${e.hp <= 0 ? 'dead' : ''}" data-enemy="${e.id}">
      <div class="intent">${intentIcon(e.intent.kind)} ${esc(intentLabel(e))}</div>
      <div class="enemy-box">${esc(e.name).toUpperCase()}</div>
      <div class="hpbar sm">
        <i style="width:${Math.max(0, (e.hp / e.maxHp) * 100)}%"></i>
        <span>${Math.max(0, e.hp)} / ${e.maxHp}</span>
      </div>
      ${tags ? `<div class="tagrow">${tags}</div>` : ''}
    </div>`;
}

function renderEnemies(): void {
  const alive = livingEnemies(state);
  const target = currentTarget(state);
  $('enemyfield').innerHTML = alive.length
    ? `<div class="enemies ${alive.length > 2 ? 'many' : alive.length === 2 ? 'two' : ''}">${alive
        .map((e) => enemyHtml(e, e.id === target?.id))
        .join('')}</div>
       ${alive.length > 1 ? '<div class="hint">tap an enemy to target it</div>' : ''}`
    : '<div class="hint">no enemies left</div>';
}

function renderSlots(): void {
  const die = activeDie();
  $('slots').innerHTML = state.slots.map((slot, i) => {
    const spent = !!slot.spent;
    const skill = slot.skillKey ? SKILLS[slot.skillKey] : null;
    const hypothetical = die && ui.hoverSlot === i && canSlot(state, die, i) ? die : undefined;
    const p = previewSlot(state, i, hypothetical);
    const occupants = diceInSlot(state, i);

    const legal = die ? canSlot(state, die, i) : false;
    const gold = legal && !!die && sigmaPotential(die, i);
    const cls = ['slot', !skill || spent ? 'empty-skill' : '',
      legal ? (gold ? 'sigma' : 'legal') : '', ui.hoverSlot === i ? 'hover' : '']
      .filter(Boolean).join(' ');

    if (!skill) return `<div class="${cls}" data-slot="${i}"><div class="sname">— empty —</div></div>`;

    const sockets: string[] = [];
    for (let k = 0; k < skill.cost.count; k++) {
      sockets.push(occupants[k] ? dieHtml(occupants[k], true) : '<div class="socket"></div>');
    }

    const parts: string[] = [];
    if (p.damage) parts.push(`${p.damage}${p.hits > 1 ? `<sub>×${p.hits}</sub>` : ''}`);
    if (p.aoe) parts.push(`${p.aoe}⇶`);
    if (p.block) parts.push(`🛡${p.block}`);
    if (p.heal) parts.push(`✚${p.heal}`);
    if (p.slip) parts.push(`+${p.slip}◇`);
    for (const st of p.statuses) parts.push(`${st.key.slice(0, 2).toUpperCase()}${st.amount}`);
    for (const st of p.selfStatuses) parts.push(`${st.key.slice(0, 2).toUpperCase()}${st.amount}`);

    const outCls = p.damage || p.aoe ? (p.tier !== 'NONE' ? 'out gold' : 'out') : 'out blockc';

    return `
      <div class="${cls}" data-slot="${i}" title="${esc(skill.blurb)}">
        <div class="sname">${esc(skill.name)}${spent ? ' ✓' : ''}</div>
        <div class="scost">${costLabel(skill.cost)}</div>
        <div class="sockets">${sockets.join('')}</div>
        <div class="math">${p.dice.length ? `PIP ${p.pip}${p.mult > 1 ? ` ×${p.mult.toFixed(1)}` : ''}` : ''}</div>
        ${p.tier !== 'NONE' && p.ready ? `<div class="tier">${tierLabel(p.tier)}</div>` : ''}
        ${p.ready && parts.length ? `<div class="${outCls}">${parts.join(' ')}</div>` : ''}
      </div>`;
  }).join('');
}

function dieHtml(d: Die, small = false): string {
  const trait = traitOf(d);
  const cls = ['die', small ? 'small' : '', ui.selected === d.id ? 'sel' : '',
    d.jammed ? 'jammed' : '', d.frozen ? 'frozen' : '', d.temp ? 'temp' : '',
    isWild(d) ? 'wild' : '', ui.justRolled && !small ? 'rolling' : '']
    .filter(Boolean).join(' ');
  const def = DICE_DEFS[d.defKey];
  const label = def && def.key !== 'standard_d6' && !small
    ? `<span class="tag">${esc(def.name.replace(/ d\d+$/, '').slice(0, 8))}</span>` : '';
  return `<div class="${cls}" data-id="${d.id}" title="${esc(def?.name ?? '')}${trait ? ` · ${trait}` : ''}">${faceLabel(d)}${label}</div>`;
}

function renderTray(): void {
  const loose = state.dice.filter((d) => d.slot === null);
  $('tray').innerHTML = loose.length
    ? loose.map((d) => dieHtml(d)).join('')
    : '<span class="hint">all dice committed</span>';
}

function renderInspector(): void {
  const d = ui.selected ? state.dice.find((x) => x.id === ui.selected) : null;
  const box = $('inspector');
  if (!d) {
    box.innerHTML = '<div class="insp-empty">tap a die to select · drag it onto a skill</div>';
    return;
  }

  const faces = facesOf(d).filter((f) => f !== -1);
  const lo = Math.min(...faces);
  const hi = Math.max(...faces);
  const nudgePrice = slipCostOf(state, 'NUDGE', d);
  const freeNudge = nudgePrice === 0;

  const canDown = !isWild(d) && d.face > lo && !d.jammed && !d.temp && canAfford(state, 'NUDGE', d);
  const canUp = !isWild(d) && d.face < hi && !d.jammed && !d.temp && canAfford(state, 'NUDGE', d);

  const flat = (v: Exclude<SlipVerb, 'NUDGE'>, extra = true) => {
    const ok = canAfford(state, v, d) && !d.jammed && extra;
    const price = slipCostOf(state, v, d);
    return `<button class="verb ${ui.armed === v ? 'armed' : ''} ${price === 0 ? 'freev' : ''}"
      data-verb="${v}" ${ok ? '' : 'disabled'}
      title="${esc(VERB_BLURB[v])}">${v} <span class="c">${price === 0 ? 'FREE' : price}</span></button>`;
  };

  const setPicker = ui.armed === 'SET'
    ? `<div class="verbs">${[...new Set(facesOf(d))].map((f) =>
        `<button class="verb" data-setface="${f}">→ ${f === -1 ? 'W' : f}</button>`).join('')}</div>` : '';
  const cloneHint = ui.armed === 'CLONE'
    ? '<div class="hint slipc">pick the die to overwrite</div>' : '';
  const def = DICE_DEFS[d.defKey];

  box.innerHTML = `
    <div class="insp">
      <div class="insp-head">
        <span>${esc(def?.name ?? 'die')} · <b>${faceLabel(d)}</b> · crown ${crownOf(d)}</span>
        ${def?.note ? `<span class="dim">${esc(def.note)}</span>` : ''}
      </div>
      <div class="verbs">
        <button class="verb nudge ${freeNudge ? 'freev' : ''}" data-nudge="-1" ${canDown ? '' : 'disabled'}>▼ ${d.face - 1 >= lo ? d.face - 1 : '–'} <span class="c">${freeNudge ? 'FREE' : nudgePrice}</span></button>
        <button class="verb nudge ${freeNudge ? 'freev' : ''}" data-nudge="1" ${canUp ? '' : 'disabled'}>▲ ${d.face + 1 <= hi ? d.face + 1 : '–'} <span class="c">${freeNudge ? 'FREE' : nudgePrice}</span></button>
        ${flat('REROLL')}
        ${flat('FREEZE', !d.frozen && !d.temp)}
        ${flat('CLONE')}
        ${flat('SPLIT', d.face >= 4)}
        ${flat('SET')}
      </div>
      ${setPicker}${cloneHint}
    </div>`;
}

function renderSlip(): void {
  const p = state.player;
  const pips = Array.from({ length: p.slipCap }, (_, i) => `<i class="${i < p.slip ? 'on' : ''}"></i>`).join('');
  const extras: string[] = [];
  if (p.freeNudges) extras.push(`${p.freeNudges} free nudge`);
  if (p.freeClones) extras.push(`${p.freeClones} free clone`);
  if (p.gold) extras.push(`${p.gold}g`);
  $('slipbar').innerHTML = `
    <div class="sliprow">
      <span>SLIP</span>
      <div class="pips">${pips}</div>
      <span class="slipnum">${p.slip}/${p.slipCap}</span>
    </div>
    ${extras.length ? `<div class="hint slipc">${esc(extras.join(' · '))}</div>` : ''}`;
}

function renderResolve(): void {
  const btn = $('resolve') as HTMLButtonElement;
  if (state.phase === 'WIN') btn.textContent = 'VICTORY';
  else if (state.phase === 'LOSE') btn.textContent = 'DEFEAT';
  else {
    const ready = state.slots.filter((_, i) => slotReady(state, i)).length;
    btn.textContent = ready ? `RESOLVE (${ready})` : 'RESOLVE (skip)';
  }
}

function renderLog(): void {
  const pane = $('logpane');
  pane.innerHTML = state.log.slice(-60).map((l) => `<div class="${l.kind}">${esc(l.text)}</div>`).join('');
  pane.scrollTop = pane.scrollHeight;
}

// ------------------------------------------------------------------ debug

function renderDebug(): void {
  const bag = run.bag.map((e) => {
    const d = DDEFS[e.key];
    const forged = !!e.faces;
    return `<div class="bagrow"><span>${esc(d.name)}${forged ? ' ⚒' : ''}</span>
      <span class="faces">${entryFaces(e).map((f) => `<i>${f === -1 ? 'W' : f}</i>`).join('')}</span></div>`;
  }).join('');

  const lanes = ['manipulation', 'damage', 'combo', 'defense'] as const;
  const loadRows = run.loadout.map((k, i) =>
    `<div class="row"><label>slot ${i + 1}</label>
       <select data-loadslot="${i}">
         <option value="">— empty —</option>
         ${lanes.map((lane) => `<optgroup label="${lane}">${SKILL_LIST.filter((sk) => sk.lane === lane).map((sk) =>
           `<option value="${sk.key}" ${sk.key === k ? 'selected' : ''}>${esc(sk.name)} (${costLabel(sk.cost)})${run.upgrades.includes(sk.key) ? ' +' : ''}</option>`).join('')}</optgroup>`).join('')}
       </select>
     </div>`).join('');

  const relics = run.relics.length
    ? run.relics.map((k) => { const d = relicDef(k)!; return `<div class="bagrow"><span>${esc(d.name)}</span><span class="dim">${esc(d.text)}</span></div>`; }).join('')
    : '<div class="dim">none yet</div>';

  $('debug').innerHTML = `
    <h3>Bag (${run.bag.length}/${effectiveBagCap(run)})</h3>
    ${bag}
    <h3>Loadout</h3>
    ${loadRows}
    <h3>Relics</h3>
    ${relics}
    <h3>Run</h3>
    <div class="statgrid">
      <span>act</span><b>${run.act}</b>
      <span>nodes cleared</span><b>${run.nodesCleared}</b>
      <span>gold</span><b>${run.gold}</b>
      <span>total damage</span><b>${run.totalDamage}</b>
      <span>biggest hit</span><b class="goldc">${run.biggestHit}</b>
      <span>seed</span><b>${run.seed}</b>
    </div>
    <div class="row"><button id="newrunbtn">↻ abandon &amp; restart</button></div>`;
}

// ------------------------------------------------------------------- juice

function celebrate(events: ResolveEvent[]): void {
  const best = events.reduce<ResolveEvent | null>(
    (acc, e) => (!acc || TIER_RANK[e.tier] > TIER_RANK[acc.tier] ? e : acc), null);
  if (!best || best.tier === 'NONE') return;

  const banner = $('banner');
  banner.className = '';
  banner.textContent = tierLabel(best.tier) + (best.damage ? `  ${best.damage}` : '');
  banner.classList.add('show', best.tier.toLowerCase());
  setTimeout(() => banner.classList.remove('show'), 720);

  const phone = document.querySelector('.phone')!;
  phone.classList.remove('shake');
  void (phone as HTMLElement).offsetWidth;
  phone.classList.add('shake');
  setTimeout(() => phone.classList.remove('shake'), 320);

  if (best.tier !== 'SIGMA') {
    document.body.classList.add('flash');
    setTimeout(() => document.body.classList.remove('flash'), 360);
  }
}

// ------------------------------------------------------------------ input

function doResolve(): void {
  if (!run.combat) return;
  if (state.phase !== 'PLAN') { setRun(finishCombat(run, rng)); return; }
  const { state: next, events } = resolveTurn(state, rng);
  state = next;
  run.combat = next;
  ui.selected = null;
  ui.armed = null;
  ui.justRolled = true;
  render();
  celebrate(events);
  // A finished fight returns control to the run rather than sitting on a
  // victory button — the reward screen IS the button.
  if (next.phase !== 'PLAN') {
    setTimeout(() => setRun(finishCombat(run, rng)), next.phase === 'WIN' ? 850 : 500);
  }
}

function onVerb(verb: SlipVerb, dieId: string): void {
  if (verb === 'CLONE' || verb === 'SET') {
    ui.armed = ui.armed === verb ? null : verb;
    render();
    return;
  }
  if (verb === 'REROLL') setState(reroll(state, dieId, rng));
  if (verb === 'FREEZE') setState(freeze(state, dieId));
  if (verb === 'SPLIT') { const n = split(state, dieId); ui.selected = null; setState(n); }
}

function bindOnce(): void {
  let downX = 0, downY = 0, moved = false;

  document.addEventListener('pointerdown', (ev) => {
    if (ui.hub || run.screen !== 'combat') return;
    const el = (ev.target as HTMLElement).closest('.die') as HTMLElement | null;
    if (!el) return;
    const die = state.dice.find((d) => d.id === el.dataset.id);
    if (!die) return;
    downX = ev.clientX; downY = ev.clientY; moved = false;

    if (die.slot === null && !die.jammed) {
      ui.dragging = die.id;
      const ghost = $('drag-ghost');
      ghost.innerHTML = `<div class="die sel">${faceLabel(die)}</div>`;
      ghost.style.display = 'block';
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
    }
    ev.preventDefault();
  });

  document.addEventListener('pointermove', (ev) => {
    if (!ui.dragging) return;
    if (Math.abs(ev.clientX - downX) > 5 || Math.abs(ev.clientY - downY) > 5) moved = true;
    const ghost = $('drag-ghost');
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top = `${ev.clientY}px`;
    const under = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    const slotEl = under?.closest('.slot') as HTMLElement | null;
    const idx = slotEl ? Number(slotEl.dataset.slot) : null;
    if (idx !== ui.hoverSlot) { ui.hoverSlot = idx; render(); }
  });

  document.addEventListener('pointerup', (ev) => {
    const el = (ev.target as HTMLElement).closest('.die') as HTMLElement | null;
    const draggedId = ui.dragging;
    const hover = ui.hoverSlot;
    $('drag-ghost').style.display = 'none';
    ui.dragging = null;
    ui.hoverSlot = null;

    if (draggedId && moved && hover !== null) {
      ui.selected = null;
      setState(slotDie(state, draggedId, hover));
      render();
      return;
    }
    if (!el) { if (draggedId) render(); return; }

    const die = state.dice.find((d) => d.id === el.dataset.id);
    if (!die) return;
    if (die.slot !== null) { ui.selected = null; setState(unslotDie(state, die.id)); return; }

    if (ui.armed === 'CLONE' && ui.selected && ui.selected !== die.id) {
      const next = cloneFace(state, ui.selected, die.id);
      ui.armed = null;
      setState(next);
      render();
      return;
    }
    ui.selected = ui.selected === die.id ? null : die.id;
    ui.armed = null;
    render();
  });

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;

    // -------------------------------------------------------------- the hub
    const hubBtn = t.closest('[data-hub]') as HTMLElement | null;
    if (hubBtn) { ui.hub = hubBtn.dataset.hub as HubScreen; render(); return; }
    if (t.closest('#beginrun')) { startRun(); return; }
    if (t.closest('#tohub')) { ui.hub = 'hub'; render(); return; }

    const unlockBtn = t.closest('[data-unlock]') as HTMLElement | null;
    if (unlockBtn) { meta = buyUnlock(meta, unlockBtn.dataset.unlock!); render(); return; }

    const heroBtn = t.closest('[data-hero]') as HTMLElement | null;
    if (heroBtn) { meta = setHero(meta, heroBtn.dataset.hero!); ui.hub = 'hub'; render(); return; }

    const ascBtn = t.closest('[data-asc]') as HTMLElement | null;
    if (ascBtn) { meta = setAscension(meta, Number(ascBtn.dataset.asc)); render(); return; }

    if (t.closest('#wipemeta')) {
      // Destructive and irreversible, so it asks first.
      if (confirm('Erase all chips, unlocks and statistics? This cannot be undone.')) {
        meta = wipeMeta();
        ui.hub = 'hub';
        render();
      }
      return;
    }

    if (ui.hub) return;   // nothing below the hub is reachable while it is open

    // ---------------------------------------------------------- run screens
    const node = t.closest('[data-node]') as HTMLElement | null;
    if (node) { setRun(enterNode(run, Number(node.dataset.node), rng)); return; }

    if (t.closest('#takerelic')) { setRun(takeRelic(run)); return; }

    const takeDieEl = t.closest('[data-takedie]') as HTMLElement | null;
    if (takeDieEl) { setRun(takeDie(run, takeDieEl.dataset.takedie!)); return; }
    if (t.closest('#skipdice')) { const r = structuredClone(run); r.offerDice = []; setRun(r); return; }

    const takeSkillEl = t.closest('[data-takeskill]') as HTMLElement | null;
    if (takeSkillEl) { ui.pendingSkill = takeSkillEl.dataset.takeskill!; render(); return; }
    const slotPick = t.closest('[data-slotpick]') as HTMLElement | null;
    if (slotPick && ui.pendingSkill) {
      const next = takeSkill(run, ui.pendingSkill, Number(slotPick.dataset.slotpick));
      ui.pendingSkill = null;
      setRun(next);
      return;
    }
    if (t.closest('#cancelskill')) { ui.pendingSkill = null; render(); return; }
    if (t.closest('#skipskill')) { setRun(skipReward(run)); return; }
    if (t.closest('#continue')) { setRun(leaveNode(run)); return; }
    if (t.closest('#newrunbtn')) { ui.hub = 'hub'; render(); return; }

    const buyEl = t.closest('[data-buy]') as HTMLElement | null;
    if (buyEl) {
      const i = Number(buyEl.dataset.buy);
      const item = run.shop[i];
      if (item.kind === 'skill' || item.kind === 'removal') { ui.shopPending = i; render(); }
      else setRun(buy(run, i));
      return;
    }
    const buySlot = t.closest('[data-buyslot]') as HTMLElement | null;
    if (buySlot && ui.shopPending !== null) {
      const next = buy(run, ui.shopPending, Number(buySlot.dataset.buyslot));
      ui.shopPending = null;
      setRun(next);
      return;
    }
    if (t.closest('#cancelbuy')) { ui.shopPending = null; render(); return; }

    const restEl = t.closest('[data-rest]') as HTMLElement | null;
    if (restEl) {
      const mode = restEl.dataset.rest;
      if (mode === 'heal') setRun(restHeal(run));
      else { ui.restMode = mode as 'forge' | 'upgrade'; ui.forgeDie = null; render(); }
      return;
    }
    const forgeDieEl = t.closest('[data-forgedie]') as HTMLElement | null;
    if (forgeDieEl) { ui.forgeDie = Number(forgeDieEl.dataset.forgedie); render(); return; }
    const forgeEl = t.closest('[data-forge]') as HTMLElement | null;
    if (forgeEl && ui.forgeDie !== null) {
      const next = restForge(run, ui.forgeDie, forgeEl.dataset.forge as ForgeKind);
      ui.restMode = null; ui.forgeDie = null;
      setRun(next);
      return;
    }
    const upEl = t.closest('[data-upgrade]') as HTMLElement | null;
    if (upEl) { ui.restMode = null; setRun(restUpgrade(run, upEl.dataset.upgrade!)); return; }
    if (t.closest('#cancelrest')) {
      if (ui.forgeDie !== null) ui.forgeDie = null; else ui.restMode = null;
      render();
      return;
    }

    const evEl = t.closest('[data-event]') as HTMLElement | null;
    if (evEl) { setRun(chooseEvent(run, Number(evEl.dataset.event), rng)); return; }

    // ---------------------------------------------------------------- combat
    if (run.screen !== 'combat') return;

    const enemyEl = t.closest('[data-enemy]') as HTMLElement | null;
    if (enemyEl) { setState(setTarget(state, enemyEl.dataset.enemy!)); return; }

    const slotEl = t.closest('.slot') as HTMLElement | null;
    if (slotEl && !t.closest('.die')) {
      if (ui.selected) {
        const next = slotDie(state, ui.selected, Number(slotEl.dataset.slot));
        if (next !== state) { ui.selected = null; setState(next); }
      }
      return;
    }

    const nudgeBtn = t.closest('[data-nudge]') as HTMLElement | null;
    if (nudgeBtn && ui.selected) {
      setState(nudge(state, ui.selected, Number(nudgeBtn.dataset.nudge) as 1 | -1));
      document.querySelector(`.die[data-id="${ui.selected}"]`)?.classList.add('nudged');
      return;
    }

    const verbBtn = t.closest('[data-verb]') as HTMLElement | null;
    if (verbBtn && ui.selected) { onVerb(verbBtn.dataset.verb as SlipVerb, ui.selected); return; }

    const faceBtn = t.closest('[data-setface]') as HTMLElement | null;
    if (faceBtn && ui.selected) {
      const next = setFace(state, ui.selected, Number(faceBtn.dataset.setface));
      ui.armed = null;
      setState(next);
      render();
      return;
    }

    if (t.id === 'resolve') { doResolve(); return; }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement;
    const loadSel = t.closest('[data-loadslot]') as HTMLSelectElement | null;
    if (loadSel) {
      const i = Number(loadSel.dataset.loadslot);
      run.loadout[i] = loadSel.value || null;
      if (run.combat) setState(setSlotSkill(state, i, loadSel.value || null));
      else render();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
    if (ui.hub || run.screen !== 'combat') return;
    if (ev.key === 'Enter') { doResolve(); return; }
    if (ev.key === 'Escape') { ui.selected = null; ui.armed = null; render(); return; }
    const n = Number(ev.key);
    if (n >= 1 && n <= 9) {
      const die = state.dice.filter((d) => d.slot === null)[n - 1];
      if (die) { ui.selected = null; setState(autoSlot(state, die.id)); }
    }
  });
}

// -------------------------------------------------------------------- boot

function openPanelsOnWideScreens(): void {
  if (window.matchMedia('(min-width: 900px)').matches) {
    ($('debugwrap') as HTMLDetailsElement).open = true;
    ($('logwrap') as HTMLDetailsElement).open = true;
  }
}

openPanelsOnWideScreens();
bindOnce();

// Meta loads first — the hub is the entry point, not a run.
meta = loadMeta();
saveMeta(meta);
const boot = newRun(undefined, meta);
run = boot.run;
rng = boot.rng;
state = run.combat ?? ({} as GameState);
ui.hub = 'hub';
render();
