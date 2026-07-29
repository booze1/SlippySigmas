// Slippy Sigmas — Phase 2 "combat depth".
//
// Full Act 1: 34 skills, 22 dice, 10 statuses, multi-enemy encounters with
// targeting, and a three-phase boss. Controller + renderer; the engine
// underneath is pure and UI-agnostic.

import type { GameState, Die, Enemy } from './engine/types.js';
import { Rng } from './engine/rng.js';
import {
  newGame, resolveTurn, slotDie, unslotDie, autoSlot, clearSlots, setSlotSkill,
  setTarget, nudge, reroll, freeze, cloneFace, setFace, split, canAfford,
  DEFAULT_BAG, DEFAULT_LOADOUT, BAG_CAP, type ResolveEvent,
} from './engine/combat.js';
import {
  SKILLS, SKILL_LIST, previewSlot, canSlot, costLabel, diceInSlot,
  livingEnemies, currentTarget, slotReady,
} from './engine/skills.js';
import { DICE_DEFS, DICE_LIST, facesOf, crownOf, isWild, faceLabel, traitOf } from './engine/dice.js';
import { ENCOUNTER_LIST, intentLabel, intentIcon } from './engine/enemy.js';
import { nudgeCost, FLAT_COSTS, VERB_BLURB, type SlipVerb } from './engine/slip.js';
import { tierLabel, TIER_RANK } from './engine/sigma.js';
import { enemyStatusTags, playerStatusTags } from './engine/status.js';

// ------------------------------------------------------------------ state

let rng: Rng;
let state: GameState;

const ui = {
  selected: null as string | null,
  armed: null as SlipVerb | null,
  hoverSlot: null as number | null,
  dragging: null as string | null,
  justRolled: false,
  config: {
    bag: [...DEFAULT_BAG],
    loadout: [...DEFAULT_LOADOUT] as (string | null)[],
    encounterKey: 'a1_wraith',
    seed: '',
  },
};

function start(): void {
  const seedNum = ui.config.seed.trim() ? Number(ui.config.seed.trim()) : undefined;
  const g = newGame({
    seed: Number.isFinite(seedNum) ? seedNum : undefined,
    bag: ui.config.bag,
    loadout: ui.config.loadout,
    encounterKey: ui.config.encounterKey,
  });
  state = g.state;
  rng = g.rng;
  ui.selected = null;
  ui.armed = null;
  ui.justRolled = true;
  render();
}

function setState(next: GameState): void {
  if (next === state) return;
  state = next;
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
  renderStatus();
  renderEnemies();
  renderSlots();
  renderTray();
  renderInspector();
  renderSlip();
  renderResolve();
  renderLog();
  renderDebug();
  ui.justRolled = false;
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
  const nc = nudgeCost(d);
  const freeNudge = canAfford(state, 'NUDGE', d) && state.player.slip < nc;

  const canDown = !isWild(d) && d.face > lo && !d.jammed && !d.temp && canAfford(state, 'NUDGE', d);
  const canUp = !isWild(d) && d.face < hi && !d.jammed && !d.temp && canAfford(state, 'NUDGE', d);

  const flat = (v: Exclude<SlipVerb, 'NUDGE'>, extra = true) => {
    const ok = canAfford(state, v, d) && !d.jammed && extra;
    const free = ok && state.player.slip < FLAT_COSTS[v];
    return `<button class="verb ${ui.armed === v ? 'armed' : ''}" data-verb="${v}" ${ok ? '' : 'disabled'}
      title="${esc(VERB_BLURB[v])}">${v} <span class="c">${free ? 'FREE' : FLAT_COSTS[v]}</span></button>`;
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
        <button class="verb nudge" data-nudge="-1" ${canDown ? '' : 'disabled'}>▼ ${d.face - 1 >= lo ? d.face - 1 : '–'} <span class="c">${freeNudge ? 'FREE' : nc}</span></button>
        <button class="verb nudge" data-nudge="1" ${canUp ? '' : 'disabled'}>▲ ${d.face + 1 <= hi ? d.face + 1 : '–'} <span class="c">${freeNudge ? 'FREE' : nc}</span></button>
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
  if (state.phase === 'WIN') btn.textContent = 'V I C T O R Y — again';
  else if (state.phase === 'LOSE') btn.textContent = 'D E F E A T — again';
  else {
    const ready = state.slots.filter((_, i) => slotReady(state, i)).length;
    btn.textContent = ready ? `R E S O L V E  (${ready})` : 'R E S O L V E  (skip)';
  }
}

function renderLog(): void {
  const pane = $('logpane');
  pane.innerHTML = state.log.slice(-60).map((l) => `<div class="${l.kind}">${esc(l.text)}</div>`).join('');
  pane.scrollTop = pane.scrollHeight;
}

// ------------------------------------------------------------------ debug

function renderDebug(): void {
  const s = state.stats;
  const bagRows = ui.config.bag.map((k, i) =>
    `<div class="row">
       <select data-bagslot="${i}">${DICE_LIST.map((d) =>
         `<option value="${d.key}" ${d.key === k ? 'selected' : ''}>${esc(d.name)} [${d.faces.map((f) => (f === -1 ? 'W' : f)).join(',')}]</option>`).join('')}</select>
       <button data-rmbag="${i}">✕</button>
     </div>`).join('');

  const lanes = ['manipulation', 'damage', 'combo', 'defense'] as const;
  const loadRows = ui.config.loadout.map((k, i) =>
    `<div class="row"><label>slot ${i + 1}</label>
       <select data-loadslot="${i}">
         <option value="">— empty —</option>
         ${lanes.map((lane) => `<optgroup label="${lane}">${SKILL_LIST.filter((sk) => sk.lane === lane).map((sk) =>
           `<option value="${sk.key}" ${sk.key === k ? 'selected' : ''}>${esc(sk.name)} (${costLabel(sk.cost)})</option>`).join('')}</optgroup>`).join('')}
       </select>
     </div>`).join('');

  const sig = s.sigmaCounts;
  const fired = sig.NONE + sig.SIGMA + sig.DOUBLE + sig.OMEGA;
  const rate = fired ? Math.round(((sig.SIGMA + sig.DOUBLE + sig.OMEGA) / fired) * 100) : 0;

  $('debug').innerHTML = `
    <h3>Encounter</h3>
    <div class="row">
      <select id="encsel">${ENCOUNTER_LIST.map((e) =>
        `<option value="${e.key}" ${e.key === ui.config.encounterKey ? 'selected' : ''}>${esc(e.name)} · ${e.kind}</option>`).join('')}</select>
    </div>

    <h3>Bag (${ui.config.bag.length}/${BAG_CAP})</h3>
    ${bagRows}
    <div class="row">
      <select id="addbag">${DICE_LIST.map((d) => `<option value="${d.key}">+ ${esc(d.name)}</option>`).join('')}</select>
      <button id="addbagbtn">add</button>
    </div>

    <h3>Loadout</h3>
    ${loadRows}

    <h3>Run</h3>
    <div class="row"><label>seed</label><input id="seed" value="${esc(ui.config.seed)}" placeholder="random" /></div>
    <div class="row"><button id="newrun">↻ restart encounter</button></div>
    <div class="row"><button id="clearslots">clear slotted dice</button></div>

    <h3>This fight</h3>
    <div class="statgrid">
      <span>turns</span><b>${s.turns}</b>
      <span>damage dealt</span><b>${s.damageDealt}</b>
      <span>damage taken</span><b>${s.damageTaken}</b>
      <span>biggest hit</span><b class="goldc">${s.biggestHit}</b>
      <span>slip spent</span><b>${s.slipSpent}</b>
      <span>skills fired</span><b>${fired}</b>
      <span>sigma rate</span><b>${rate}%</b>
      <span>· sigma</span><b>${sig.SIGMA}</b>
      <span>· double</span><b>${sig.DOUBLE}</b>
      <span>· omega</span><b>${sig.OMEGA}</b>
      <span>seed</span><b>${state.seed}</b>
    </div>`;
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
  if (state.phase !== 'PLAN') { start(); return; }
  const { state: next, events } = resolveTurn(state, rng);
  state = next;
  ui.selected = null;
  ui.armed = null;
  ui.justRolled = true;
  render();
  celebrate(events);
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
    if (t.id === 'newrun') { start(); return; }
    if (t.id === 'clearslots') { setState(clearSlots(state)); return; }
    if (t.id === 'addbagbtn') {
      if (ui.config.bag.length < BAG_CAP) ui.config.bag.push(($('addbag') as HTMLSelectElement).value);
      start();
      return;
    }
    const rm = t.closest('[data-rmbag]') as HTMLElement | null;
    if (rm) {
      if (ui.config.bag.length > 1) ui.config.bag.splice(Number(rm.dataset.rmbag), 1);
      start();
      return;
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement;
    const bagSel = t.closest('[data-bagslot]') as HTMLSelectElement | null;
    if (bagSel) { ui.config.bag[Number(bagSel.dataset.bagslot)] = bagSel.value; start(); return; }

    const loadSel = t.closest('[data-loadslot]') as HTMLSelectElement | null;
    if (loadSel) {
      const i = Number(loadSel.dataset.loadslot);
      ui.config.loadout[i] = loadSel.value || null;
      setState(setSlotSkill(state, i, loadSel.value || null));
      return;
    }
    if (t.id === 'encsel') { ui.config.encounterKey = (t as HTMLSelectElement).value; start(); return; }
    if (t.id === 'seed') { ui.config.seed = (t as HTMLInputElement).value; return; }
  });

  document.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
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
start();
