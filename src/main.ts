// Slippy Sigmas — Phase 1 "feel test".
//
// One screen, one enemy, grey boxes. The only question this build exists to
// answer: is staring at [5,5,3,2] with 3 Slip an interesting decision?
//
// Controller + renderer. The engine underneath is pure and UI-agnostic.

import type { GameState, Die, SlotPreview } from './engine/types.js';
import { Rng } from './engine/rng.js';
import {
  newGame, resolveTurn, slotDie, unslotDie, autoSlot, clearSlots, setSlotSkill,
  nudge, reroll, freeze, cloneFace, setFace, split,
  DEFAULT_BAG, DEFAULT_LOADOUT, type ResolveEvent,
} from './engine/combat.js';
import { SKILLS, SKILL_LIST, previewSlot, canSlot, costLabel, diceInSlot, sigmaPotential } from './engine/skills.js';
import { DICE_DEFS, DICE_LIST, facesOf, crownOf } from './engine/dice.js';
import { ENEMY_LIST, intentLabel, intentIcon } from './engine/enemy.js';
import { nudgeCost, FLAT_COSTS, VERB_BLURB, type SlipVerb } from './engine/slip.js';
import { tierLabel } from './engine/sigma.js';

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
    enemyKey: 'ratio_wraith',
    seed: '',
  },
};

function start(): void {
  const seedNum = ui.config.seed.trim() ? Number(ui.config.seed.trim()) : undefined;
  const g = newGame({
    seed: Number.isFinite(seedNum) ? seedNum : undefined,
    bag: ui.config.bag,
    loadout: ui.config.loadout,
    enemyKey: ui.config.enemyKey,
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

// ------------------------------------------------------------------ helpers

const $ = (id: string) => document.getElementById(id)!;

function activeDie(): Die | null {
  const id = ui.dragging ?? ui.selected;
  return id ? (state.dice.find((d) => d.id === id) ?? null) : null;
}

/** Preview for slot i, including the die currently being dragged/selected. */
function slotPreview(i: number): SlotPreview {
  const die = activeDie();
  const hypothetical =
    die && ui.hoverSlot === i && canSlot(state, die, i) ? die : undefined;
  return previewSlot(state, i, hypothetical);
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

// ------------------------------------------------------------------ render

function render(): void {
  renderStatus();
  renderEnemy();
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
  $('statusbar').innerHTML = `
    <span class="pill turn">TURN ${state.turn}</span>
    <div class="hpbar">
      <i style="width:${Math.max(0, (p.hp / p.maxHp) * 100)}%"></i>
      <span>${Math.max(0, p.hp)} / ${p.maxHp}</span>
    </div>
    ${p.block > 0 ? `<span class="pill block">🛡 ${p.block}</span>` : ''}
  `;
}

function renderEnemy(): void {
  const e = state.enemy;
  const tags: string[] = [];
  if (e.block > 0) tags.push(`<span class="pill block">🛡 ${e.block}</span>`);
  if (e.brittle > 0) tags.push(`<span class="pill" style="color:#ff9f43">Brittle ${e.brittle}%</span>`);
  if (e.burn > 0) tags.push(`<span class="pill" style="color:#ff6b35">Burn ${e.burn}</span>`);
  if (e.buff > 0) tags.push(`<span class="pill" style="color:var(--danger)">+${e.buff} dmg</span>`);

  $('enemyfield').innerHTML = `
    <div class="intent">${intentIcon(e.intent.kind)} ${esc(intentLabel(e))}</div>
    <div class="enemy-box" id="enemybox">${esc(e.name).toUpperCase()}</div>
    <div class="hpbar">
      <i style="width:${Math.max(0, (e.hp / e.maxHp) * 100)}%"></i>
      <span>${Math.max(0, e.hp)} / ${e.maxHp}</span>
    </div>
    <div class="enemy-stats">${tags.join('')}</div>
  `;
}

function renderSlots(): void {
  const die = activeDie();
  const html = state.slots.map((slot, i) => {
    const skill = slot.skillKey ? SKILLS[slot.skillKey] : null;
    const p = slotPreview(i);
    const occupants = diceInSlot(state, i);

    // The key affordance: legal slots glow teal, slots where Sigma is still
    // reachable glow gold — checked on the first die, not just the last.
    const legal = die ? canSlot(state, die, i) : false;
    const wouldSigma = legal && !!die && sigmaPotential(state, die, i);
    const cls = [
      'slot',
      !skill ? 'empty-skill' : '',
      legal ? (wouldSigma ? 'sigma' : 'legal') : '',
      ui.hoverSlot === i ? 'hover' : '',
    ].filter(Boolean).join(' ');

    if (!skill) {
      return `<div class="${cls}" data-slot="${i}"><div class="sname">— empty —</div></div>`;
    }

    const sockets: string[] = [];
    for (let k = 0; k < skill.cost.count; k++) {
      const d = occupants[k];
      sockets.push(d ? dieHtml(d, true) : '<div class="socket"></div>');
    }

    let out = '';
    let math = '';
    if (p.dice.length > 0) {
      const parts: string[] = [];
      if (p.damage) parts.push(`${p.damage}`);
      if (p.block) parts.push(`🛡${p.block}`);
      if (p.slip) parts.push(`+${p.slip}◇`);
      if (p.brittle) parts.push(`B${p.brittle}`);
      if (p.burn) parts.push(`🔥${p.burn}`);
      const cls2 = p.damage ? (p.tier !== 'NONE' ? 'out gold' : 'out') : 'out blockc';
      out = p.ready ? `<div class="${cls2}">${parts.join(' ') || '—'}</div>` : '';
      math = `PIP ${p.pip}${p.mult > 1 ? ` ×${p.mult.toFixed(1)}` : ''}`;
    }

    return `
      <div class="${cls}" data-slot="${i}">
        <div class="sname">${esc(skill.name)}</div>
        <div class="scost">${costLabel(skill.cost)}</div>
        <div class="sockets">${sockets.join('')}</div>
        <div class="math">${math}</div>
        ${p.tier !== 'NONE' && p.ready ? `<div class="tier">${tierLabel(p.tier)}</div>` : ''}
        ${out}
      </div>`;
  });

  $('slots').innerHTML = html.join('');
}

function dieHtml(d: Die, small = false): string {
  const cls = [
    'die',
    small ? 'small' : '',
    ui.selected === d.id ? 'sel' : '',
    d.jammed ? 'jammed' : '',
    d.frozen ? 'frozen' : '',
    d.temp ? 'temp' : '',
    ui.justRolled && !small ? 'rolling' : '',
  ].filter(Boolean).join(' ');
  const def = DICE_DEFS[d.defKey];
  const tag = !small && def && def.key !== 'standard_d6' ? `<span class="tag">${esc(def.name.replace(/ d\d+$/, ''))}</span>` : '';
  return `<div class="${cls}" data-id="${d.id}" title="${esc(def?.name ?? '')}">${d.face}${tag}</div>`;
}

function renderTray(): void {
  const loose = state.dice.filter((d) => d.slot === null);
  $('tray').innerHTML = loose.length
    ? loose.map((d) => dieHtml(d)).join('')
    : '<span style="color:var(--dim);font-size:11px">all dice committed</span>';
}

function renderInspector(): void {
  const d = ui.selected ? state.dice.find((x) => x.id === ui.selected) : null;
  const box = $('inspector');

  if (!d) {
    box.innerHTML = '<div class="insp-empty">tap a die to select · drag it onto a skill</div>';
    return;
  }

  const slip = state.player.slip;
  const faces = facesOf(d);
  const lo = Math.min(...faces);
  const hi = Math.max(...faces);
  const nc = nudgeCost(d);

  const canNudgeDown = d.face > lo && slip >= nc && !d.jammed && !d.temp;
  const canNudgeUp = d.face < hi && slip >= nc && !d.jammed && !d.temp;

  const flat = (v: SlipVerb, extra = true) => {
    const cost = FLAT_COSTS[v as Exclude<SlipVerb, 'NUDGE'>];
    const ok = slip >= cost && !d.jammed && extra;
    return `<button class="verb ${ui.armed === v ? 'armed' : ''}" data-verb="${v}" ${ok ? '' : 'disabled'} title="${esc(VERB_BLURB[v])}">${v} <span class="c">${cost}</span></button>`;
  };

  const setPicker = ui.armed === 'SET'
    ? `<div class="verbs">${[...new Set(faces)].map((f) => `<button class="verb" data-setface="${f}">→ ${f}</button>`).join('')}</div>`
    : '';
  const cloneHint = ui.armed === 'CLONE'
    ? '<div style="font-size:10px;color:var(--slip)">pick the die to overwrite</div>'
    : '';

  box.innerHTML = `
    <div class="insp">
      <div class="insp-head">
        <span>${esc(DICE_DEFS[d.defKey]?.name ?? 'die')} · showing <b style="color:var(--neutral)">${d.face}</b> · crown ${crownOf(d)}</span>
        ${d.nudges ? `<span style="color:var(--gold)">nudged ${d.nudges}×</span>` : ''}
      </div>
      <div class="verbs">
        <button class="verb nudge" data-nudge="-1" ${canNudgeDown ? '' : 'disabled'}>▼ ${d.face - 1 >= lo ? d.face - 1 : '–'} <span class="c">${nc}</span></button>
        <button class="verb nudge" data-nudge="1" ${canNudgeUp ? '' : 'disabled'}>▲ ${d.face + 1 <= hi ? d.face + 1 : '–'} <span class="c">${nc}</span></button>
        ${flat('REROLL')}
        ${flat('FREEZE', !d.frozen && !d.temp)}
        ${flat('CLONE')}
        ${flat('SPLIT', d.face >= 4)}
        ${flat('SET')}
      </div>
      ${setPicker}
      ${cloneHint}
    </div>`;
}

function renderSlip(): void {
  const p = state.player;
  const pips = Array.from({ length: p.slipCap }, (_, i) =>
    `<i class="${i < p.slip ? 'on' : ''}"></i>`).join('');
  $('slipbar').innerHTML = `
    <div class="sliprow">
      <span>SLIP</span>
      <div class="pips">${pips}</div>
      <span class="slipnum">${p.slip}/${p.slipCap}</span>
    </div>`;
}

function renderResolve(): void {
  const btn = $('resolve') as HTMLButtonElement;
  if (state.phase === 'WIN') {
    btn.textContent = 'V I C T O R Y  —  new run';
    btn.disabled = false;
  } else if (state.phase === 'LOSE') {
    btn.textContent = 'D E F E A T  —  new run';
    btn.disabled = false;
  } else {
    const committed = state.dice.filter((d) => d.slot !== null).length;
    btn.textContent = committed ? 'R E S O L V E' : 'R E S O L V E  (skip)';
    btn.disabled = false;
  }
}

function renderLog(): void {
  const pane = $('logpane');
  pane.innerHTML = state.log
    .slice(-40)
    .map((l) => `<div class="${l.kind}">${esc(l.text)}</div>`)
    .join('');
  pane.scrollTop = pane.scrollHeight;
}

// ------------------------------------------------------------------ debug

function renderDebug(): void {
  const s = state.stats;
  const bagRows = ui.config.bag.map((k, i) =>
    `<div class="row">
       <select data-bagslot="${i}">${DICE_LIST.map((d) =>
         `<option value="${d.key}" ${d.key === k ? 'selected' : ''}>${esc(d.name)} [${d.faces.join(',')}]</option>`).join('')}</select>
       <button data-rmbag="${i}" style="width:auto">✕</button>
     </div>`).join('');

  const loadRows = ui.config.loadout.map((k, i) =>
    `<div class="row"><label>slot ${i + 1}</label>
       <select data-loadslot="${i}">
         <option value="">— empty —</option>
         ${SKILL_LIST.map((sk) =>
           `<option value="${sk.key}" ${sk.key === k ? 'selected' : ''}>${esc(sk.name)} (${costLabel(sk.cost)})</option>`).join('')}
       </select>
     </div>`).join('');

  const sig = s.sigmaCounts;
  const fired = sig.NONE + sig.SIGMA + sig.DOUBLE + sig.OMEGA;
  const rate = fired ? Math.round(((sig.SIGMA + sig.DOUBLE + sig.OMEGA) / fired) * 100) : 0;

  $('debug').innerHTML = `
    <h3>Bag (${ui.config.bag.length})</h3>
    ${bagRows}
    <div class="row">
      <select id="addbag">${DICE_LIST.map((d) => `<option value="${d.key}">+ ${esc(d.name)}</option>`).join('')}</select>
      <button id="addbagbtn" style="width:auto">add</button>
    </div>

    <h3>Loadout</h3>
    ${loadRows}

    <h3>Enemy</h3>
    <div class="row">
      <select id="enemysel">${ENEMY_LIST.map((e) =>
        `<option value="${e.key}" ${e.key === ui.config.enemyKey ? 'selected' : ''}>${esc(e.name)} (${e.hp} HP)</option>`).join('')}</select>
    </div>

    <h3>Run</h3>
    <div class="row"><label>seed</label><input id="seed" value="${esc(ui.config.seed)}" placeholder="random" /></div>
    <div class="row"><button id="newrun">↻ new run</button></div>
    <div class="row"><button id="clearslots">clear slotted dice</button></div>

    <h3>This run</h3>
    <div class="statgrid">
      <span>turns</span><b>${s.turns}</b>
      <span>damage dealt</span><b>${s.damageDealt}</b>
      <span>damage taken</span><b>${s.damageTaken}</b>
      <span>biggest hit</span><b style="color:var(--gold)">${s.biggestHit}</b>
      <span>slip spent</span><b>${s.slipSpent}</b>
      <span>slip gained</span><b>${s.slipGained}</b>
      <span>skills fired</span><b>${fired}</b>
      <span>sigma rate</span><b>${rate}%</b>
      <span>· sigma</span><b>${sig.SIGMA}</b>
      <span>· double</span><b>${sig.DOUBLE}</b>
      <span>· omega</span><b>${sig.OMEGA}</b>
      <span>seed</span><b>${state.seed}</b>
    </div>`;
}

// ------------------------------------------------------------------ juice

function celebrate(events: ResolveEvent[]): void {
  const best = events.reduce<ResolveEvent | null>((acc, e) => {
    const rank = { NONE: 0, SIGMA: 1, DOUBLE: 2, OMEGA: 3 } as const;
    return !acc || rank[e.tier] > rank[acc.tier] ? e : acc;
  }, null);
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
  const before = state.enemy.hp;
  const { state: next, events } = resolveTurn(state, rng);
  state = next;
  ui.selected = null;
  ui.armed = null;
  ui.justRolled = true;
  render();
  if (state.enemy.hp < before) {
    const box = document.getElementById('enemybox');
    box?.classList.add('hurt');
  }
  celebrate(events);
}

function onVerb(verb: SlipVerb, dieId: string): void {
  if (verb === 'CLONE') { ui.armed = ui.armed === 'CLONE' ? null : 'CLONE'; render(); return; }
  if (verb === 'SET') { ui.armed = ui.armed === 'SET' ? null : 'SET'; render(); return; }
  if (verb === 'REROLL') setState(reroll(state, dieId, rng));
  if (verb === 'FREEZE') setState(freeze(state, dieId));
  if (verb === 'SPLIT') { const n = split(state, dieId); ui.selected = null; setState(n); }
}

function bindOnce(): void {
  // ---- pointer drag & tap, unified
  let downX = 0, downY = 0, moved = false, fromSlot = false;

  document.addEventListener('pointerdown', (ev) => {
    const el = (ev.target as HTMLElement).closest('.die') as HTMLElement | null;
    if (!el) return;
    const id = el.dataset.id!;
    const die = state.dice.find((d) => d.id === id);
    if (!die) return;

    downX = ev.clientX; downY = ev.clientY; moved = false;
    fromSlot = die.slot !== null;

    if (!fromSlot && !die.jammed) {
      ui.dragging = id;
      const ghost = $('drag-ghost');
      ghost.innerHTML = `<div class="die sel">${die.face}</div>`;
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

    // Dropped onto a slot.
    if (draggedId && moved && hover !== null) {
      const next = slotDie(state, draggedId, hover);
      ui.selected = null;
      setState(next);
      render();
      return;
    }

    if (!el) { if (draggedId) render(); return; }
    const id = el.dataset.id!;
    const die = state.dice.find((d) => d.id === id);
    if (!die) return;

    // Tap on a slotted die returns it to the tray.
    if (die.slot !== null) { ui.selected = null; setState(unslotDie(state, id)); return; }

    // Armed CLONE: this tap picks the overwrite target.
    if (ui.armed === 'CLONE' && ui.selected && ui.selected !== id) {
      const next = cloneFace(state, ui.selected, id);
      ui.armed = null;
      setState(next);
      render();
      return;
    }

    ui.selected = ui.selected === id ? null : id;
    ui.armed = null;
    render();
  });

  // ---- clicks on slots, verbs, debug
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;

    const slotEl = t.closest('.slot') as HTMLElement | null;
    if (slotEl && !t.closest('.die')) {
      const idx = Number(slotEl.dataset.slot);
      if (ui.selected) {
        const next = slotDie(state, ui.selected, idx);
        if (next !== state) { ui.selected = null; setState(next); }
      }
      return;
    }

    const nudgeBtn = t.closest('[data-nudge]') as HTMLElement | null;
    if (nudgeBtn && ui.selected) {
      setState(nudge(state, ui.selected, Number(nudgeBtn.dataset.nudge) as 1 | -1));
      const d = document.querySelector(`.die[data-id="${ui.selected}"]`);
      d?.classList.add('nudged');
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
      const sel = $('addbag') as HTMLSelectElement;
      if (ui.config.bag.length < 8) ui.config.bag.push(sel.value);
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

    if (t.id === 'enemysel') { ui.config.enemyKey = (t as HTMLSelectElement).value; start(); return; }
    if (t.id === 'seed') { ui.config.seed = (t as HTMLInputElement).value; return; }
  });

  // ---- keyboard: 1-9 slot dice, Enter resolve, Esc deselect
  document.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
    if (ev.key === 'Enter') { doResolve(); return; }
    if (ev.key === 'Escape') { ui.selected = null; ui.armed = null; render(); return; }
    const n = Number(ev.key);
    if (n >= 1 && n <= 9) {
      const loose = state.dice.filter((d) => d.slot === null);
      const die = loose[n - 1];
      if (die) { ui.selected = null; setState(autoSlot(state, die.id)); }
    }
  });
}

// ------------------------------------------------------------------ boot

// The log and the test rig are disclosures so they cost no vertical space on a
// phone. On a wide screen there's room, so open them — the CSS hides the test
// rig's summary there, and a closed <details> hides its contents regardless of
// CSS, so this has to be set on the element itself.
function openPanelsOnWideScreens(): void {
  if (window.matchMedia('(min-width: 900px)').matches) {
    ($('debugwrap') as HTMLDetailsElement).open = true;
    ($('logwrap') as HTMLDetailsElement).open = true;
  }
}

openPanelsOnWideScreens();
bindOnce();
start();
