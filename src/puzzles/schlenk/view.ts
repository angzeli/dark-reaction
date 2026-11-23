/**
 * View for the Kraken: a live diagram of the line (what each vessel is
 * connected to, whether the bubbler is bubbling, what is in her tube), the
 * laminated rules card, and the controls: the nitrogen main, a three-way tap
 * per port (a radio group: arrow keys or taps), the two bleeds, her tube's
 * own tap, and the foil. The valves are buttons named for how they stand
 * ("Bleed: shut"), so the name is the state. Everything the diagram shows
 * is also said in words.
 */
import { h, setInline } from '../../ui/dom.ts';
import { bindRoving, setTabStop } from '../roving.ts';
import type { PuzzleView } from '../types.ts';
import { FLASK_PORT, PORTS, schlenkLogic, schlenkSave, TAPS, TUBE_PORT, type Bleed, type Port, type SchlenkMove, type SchlenkState } from './logic.ts';

const X: Record<Port, number> = { 1: 150, 2: 270, 3: 390, 4: 510 };
const N2_Y = 40;
const VAC_Y = 80;
const TAP_Y = 122;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** What her tube holds right now, for the readout. */
function tubeState(s: SchlenkState): string {
  if (s.spoiled) return 'spoiled';
  if (s.wrapped) return 'wrapped';
  if (s.filled) return s.jyOpen ? 'filled' : 'sealed';
  if (s.pumped) return 'vacuum';
  return s.purged ? 'nitrogen' : 'air';
}

/** The line as SVG (decorative: the controls and readouts carry the same information). */
function diagram(s: SchlenkState, t: (key: string) => string, motion: boolean): string {
  const tap = (p: Port) => s.taps[p - 1]!;
  const gas = (on: boolean, colour: string) => (on ? colour : '#56636f');
  const anyVac = PORTS.some((p) => tap(p) === 'vac');
  const parts: string[] = [];
  // Manifolds, the pump, the bubbler.
  parts.push(`<line x1="56" y1="${N2_Y}" x2="600" y2="${N2_Y}" stroke="${gas(s.n2, '#6fb7ee')}" stroke-width="7" stroke-linecap="round"/>`);
  parts.push(`<line x1="96" y1="${VAC_Y}" x2="600" y2="${VAC_Y}" stroke="${gas(anyVac, '#e0b469')}" stroke-width="7" stroke-linecap="round"/>`);
  parts.push(`<text x="606" y="${N2_Y + 5}" class="sk__svg-label">${esc(t('puzzle.schlenk.svg.n2'))}</text>`);
  parts.push(`<rect x="560" y="${VAC_Y + 12}" width="56" height="30" rx="4" fill="#2d3946" stroke="#7d8a96"/><text x="588" y="${VAC_Y + 32}" text-anchor="middle" class="sk__svg-label">${esc(t('puzzle.schlenk.svg.pump'))}</text>`);
  parts.push(`<line x1="588" y1="${VAC_Y}" x2="588" y2="${VAC_Y + 12}" stroke="#7d8a96" stroke-width="4"/>`);
  parts.push(`<text x="350" y="${VAC_Y + 22}" text-anchor="middle" class="sk__svg-label sk__svg-label--dim">${esc(t('puzzle.schlenk.svg.vac'))}</text>`);
  parts.push(`<path d="M22 ${N2_Y - 14} h30 v52 a15 15 0 0 1 -30 0 z" fill="#1c2733" stroke="#9fb0bf" stroke-width="2"/><rect x="24" y="${N2_Y + 18}" width="26" height="18" fill="#c9a24e" opacity="0.75"/>`);
  if (s.n2) {
    const rise = motion ? ' sk__bubble--rise' : '';
    for (const [i, cy] of [[0, N2_Y + 30], [1, N2_Y + 22], [2, N2_Y + 14]] as const) parts.push(`<circle cx="${32 + i * 5}" cy="${cy}" r="3" class="sk__bubble${rise}" style="animation-delay:${i * 0.35}s"/>`);
  }
  parts.push(`<text x="37" y="${N2_Y + 64}" text-anchor="middle" class="sk__svg-label">${esc(t('puzzle.schlenk.svg.bubbler'))}</text>`);
  // Each port: connectors from both manifolds to its tap, the tap, and the stem down to its vessel.
  for (const p of PORTS) {
    const x = X[p];
    const v = tap(p);
    parts.push(`<line x1="${x - 12}" y1="${N2_Y}" x2="${x - 6}" y2="${TAP_Y - 10}" stroke="${gas(v === 'n2' && s.n2, '#6fb7ee')}" stroke-width="4"/>`);
    parts.push(`<line x1="${x + 12}" y1="${VAC_Y}" x2="${x + 6}" y2="${TAP_Y - 10}" stroke="${gas(v === 'vac', '#e0b469')}" stroke-width="4"/>`);
    const stem = v === 'n2' && s.n2 ? '#6fb7ee' : v === 'vac' ? '#e0b469' : '#56636f';
    parts.push(`<line x1="${x}" y1="${TAP_Y + 12}" x2="${x}" y2="160" stroke="${stem}" stroke-width="4"/>`);
    const angle = v === 'n2' ? -35 : v === 'vac' ? 35 : 90;
    parts.push(`<g transform="translate(${x} ${TAP_Y})"><circle r="12" fill="#d8dfe6" stroke="#273442" stroke-width="2"/><rect x="-3" y="-11" width="6" height="22" rx="2" fill="#273442" transform="rotate(${angle})"/></g>`);
    parts.push(`<text x="${x}" y="${TAP_Y + 34}" text-anchor="middle" class="sk__svg-port">${p}</text>`);
  }
  // Bleeds on ports 2 and 4: a side arm, open or shut.
  for (const [p, which] of [[TUBE_PORT, 'tube'], [FLASK_PORT, 'flask']] as const) {
    const x = X[p];
    const open = s.bleed[which];
    parts.push(`<line x1="${x}" y1="150" x2="${x + 26}" y2="150" stroke="#9fb0bf" stroke-width="3"/><circle cx="${x + 30}" cy="150" r="5" fill="${open ? '#f0c27a' : '#273442'}" stroke="#9fb0bf" stroke-width="2"/>`);
  }
  // Port 1: Tom's flask.
  parts.push(`<path d="M${X[1] - 6} 160 v18 a26 26 0 1 0 12 0 v-18 z" fill="#20303f" stroke="#a9b7c4" stroke-width="2"/><text x="${X[1]}" y="212" text-anchor="middle" class="sk__svg-tag">${esc(t('puzzle.schlenk.svg.tom'))}</text>`);
  // Port 2: her J. Young tube.
  const tx = X[TUBE_PORT];
  const liquid = s.filled ? (s.spoiled ? '#d9d3b0' : '#3a1f14') : null;
  parts.push(`<rect x="${tx - 7}" y="168" width="14" height="104" rx="7" fill="#162430" stroke="#c8d3dc" stroke-width="2"/>`);
  if (liquid) parts.push(`<rect x="${tx - 5}" y="222" width="10" height="48" rx="5" fill="${liquid}"/>`);
  if (s.wrapped) parts.push(`<rect x="${tx - 10}" y="190" width="20" height="86" rx="6" class="sk__foil"/>`);
  parts.push(`<rect x="${tx - 6}" y="${s.jyOpen ? 158 : 162}" width="12" height="8" rx="2" fill="${s.jyOpen ? '#9fe3b5' : '#273442'}" stroke="#c8d3dc"/>`);
  // Port 3: a stopper with a crack.
  parts.push(`<rect x="${X[3] - 10}" y="160" width="20" height="24" rx="3" fill="#33414f" stroke="#a9b7c4" stroke-width="2"/><path d="M${X[3] - 4} 162 l5 6 -4 5 5 6 -3 4" stroke="#ff8f80" stroke-width="2" fill="none"/><text x="${X[3]}" y="206" text-anchor="middle" class="sk__svg-tag">${esc(t('puzzle.schlenk.svg.crack'))}</text>`);
  // Port 4: her flask, in foil to the neck.
  // Her label, a line per part, so it stays on the foil.
  const label = t('puzzle.schlenk.svg.flask')
    .split(' · ')
    .map((line, i, all) => `<tspan x="${X[4]}" dy="${i === 0 ? -(all.length - 1) * 6.5 : 13}">${esc(line)}</tspan>`)
    .join('');
  parts.push(`<path d="M${X[4] - 6} 160 v18 a30 30 0 1 0 12 0 v-18 z" class="sk__foil" stroke="#c8d3dc" stroke-width="2"/><text x="${X[4]}" y="212" text-anchor="middle" class="sk__svg-tag sk__svg-tag--ink">${label}</text>`);
  // The cannula, flask to tube: dark while the liquid crosses or once it has.
  parts.push(`<path d="M${X[4] - 12} 232 Q ${(X[4] + tx) / 2} 300 ${tx + 8} 240" fill="none" stroke="${s.filled && !s.spoiled ? '#6b3a22' : '#9fb0bf'}" stroke-width="${s.filled ? 3 : 2}"/>`);
  return `<svg viewBox="0 0 640 300" class="sk__svg" aria-hidden="true" focusable="false">${parts.join('')}</svg>`;
}

export const schlenkView: PuzzleView = {
  mount(host, api, data) {
    let state: SchlenkState = schlenkLogic.init({ minute: api.startMinute, act: api.act, data });
    const motion = !api.reduceMotion;

    const card = h('figure', { class: 'sk__card' });
    const picture = h('div', { class: 'sk__diagram' });
    const n2 = h('button', { type: 'button', class: 'sk__n2', dataset: { focusKey: 'sk-n2' } });
    const bubbler = h('p', { class: 'sk__bubbler' });
    const ports = h('div', { class: 'sk__ports' });
    const wrap = h('button', { type: 'button', class: 'sk__wrap', dataset: { focusKey: 'sk-wrap' } });
    const tube = h('p', { class: 'sk__tube' });
    const status = h('p', { class: 'sk__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'sk__done' });
    const root = h(
      'div',
      { class: 'sk' },
      h('div', { class: 'sk__top' }, picture, card),
      h('div', { class: 'sk__main' }, n2, bubbler),
      ports,
      h('div', { class: 'sk__end' }, wrap, tube),
      status,
      done,
    );

    const move = (m: SchlenkMove, focusKey?: string) => {
      state = schlenkLogic.apply(state, m);
      api.saveData(schlenkSave(state));
      api.setMinutes(schlenkLogic.minutes(state));
      render(focusKey);
    };

    const said = (): string => {
      const last = state.last;
      if (!last) return '';
      if (last.kind === 'tap' && last.port) return api.t('puzzle.schlenk.ev.tap', { n: last.port, tap: `@puzzle.schlenk.tap.${state.taps[last.port - 1]}` });
      if ((last.kind === 'bleedOpen' || last.kind === 'bleedShut') && last.port) return api.t(`puzzle.schlenk.ev.${last.kind}`, { n: last.port });
      return api.t(`puzzle.schlenk.ev.${last.kind}`);
    };

    const portCard = (p: Port): HTMLElement => {
      const over = state.wrapped || state.spoiled;
      const current = state.taps[p - 1]!;
      const radios = TAPS.map((tap) =>
        h(
          'button',
          {
            type: 'button',
            role: 'radio',
            class: `sk__tap sk__tap--${tap}`,
            'aria-checked': String(current === tap),
            disabled: over,
            dataset: { port: String(p), tap, focusKey: `sk-tap-${p}-${tap}` },
            onclick: () => move({ type: 'tap', port: p, to: tap }, `sk-tap-${p}-${tap}`),
          },
          api.t(`puzzle.schlenk.tap.${tap}`),
        ),
      );
      setTabStop(radios, TAPS.indexOf(current));
      const group = h('div', { class: 'sk__taps', role: 'radiogroup', 'aria-label': api.t('puzzle.schlenk.tap.group', { n: p }) }, ...radios);
      bindRoving(group, {
        items: () => radios,
        spots: () => radios.map((_, i) => ({ row: 0, col: i })),
        linear: true,
        onMove: (i) => move({ type: 'tap', port: p, to: TAPS[i]! }, `sk-tap-${p}-${TAPS[i]}`),
      });
      const extras: HTMLElement[] = [];
      const bleed = (which: Bleed) =>
        h(
          'button',
          {
            type: 'button',
            class: 'sk__bleed',
            disabled: over,
            dataset: { bleed: which, on: String(state.bleed[which]), focusKey: `sk-bleed-${which}` },
            onclick: () => move({ type: 'bleed', which }, `sk-bleed-${which}`),
          },
          api.t(state.bleed[which] ? 'puzzle.schlenk.bleed.open' : 'puzzle.schlenk.bleed.shut'),
        );
      if (p === TUBE_PORT) {
        extras.push(
          bleed('tube'),
          h(
            'button',
            { type: 'button', class: 'sk__jy', disabled: over, dataset: { on: String(state.jyOpen), focusKey: 'sk-jy' }, onclick: () => move({ type: 'jy' }, 'sk-jy') },
            api.t(state.jyOpen ? 'puzzle.schlenk.jy.open' : 'puzzle.schlenk.jy.shut'),
          ),
        );
      }
      if (p === FLASK_PORT) extras.push(bleed('flask'));
      return h(
        'fieldset',
        { class: `sk__port sk__port--${p}`, dataset: { port: String(p), tap: current } },
        h('legend', { class: 'sk__legend' }, api.t(`puzzle.schlenk.port.${p}`)),
        group,
        extras.length ? h('div', { class: 'sk__extras' }, ...extras) : null,
      );
    };

    const render = (focusKey?: string) => {
      const over = state.wrapped || state.spoiled;
      picture.innerHTML = diagram(state, (k) => api.t(k), motion);
      picture.dataset['n2'] = String(state.n2);
      card.replaceChildren(
        h('figcaption', { class: 'sk__card-title' }, api.t('puzzle.schlenk.card.title')),
        h('ol', { class: 'sk__rules' }, ...[1, 2, 3, 4].map((n) => h('li', {}, api.t(`puzzle.schlenk.card.${n}`))), h('li', { class: 'sk__pencil' }, api.t('puzzle.schlenk.card.5'))),
        h('p', { class: 'sr-only' }, api.t('puzzle.schlenk.card.5.note')),
      );
      n2.textContent = api.t(state.n2 ? 'puzzle.schlenk.n2.on' : 'puzzle.schlenk.n2.off');
      n2.dataset['on'] = String(state.n2);
      n2.disabled = over;
      bubbler.textContent = api.t(state.n2 ? 'puzzle.schlenk.bubbler.on' : 'puzzle.schlenk.bubbler.off');
      ports.replaceChildren(...PORTS.map(portCard));
      wrap.textContent = api.t('puzzle.schlenk.wrap');
      wrap.disabled = over;
      tube.textContent = api.t(`puzzle.schlenk.tube.${tubeState(state)}`);
      const text = said();
      setInline(status, text);
      done.replaceChildren(
        ...(over
          ? [
              h(
                'button',
                { type: 'button', class: 'sk__finish', dataset: { focusKey: 'sk-finish' }, onclick: () => api.finish(state.wrapped, state.spoiled) },
                api.t(state.wrapped ? 'puzzle.schlenk.done' : 'puzzle.schlenk.giveup'),
              ),
            ]
          : []),
      );
      // A tap's focus stays on whichever of its settings is checked (a reset puts it back on Closed).
      const tapPort = /^sk-tap-(\d)-/.exec(focusKey ?? '')?.[1];
      const key = tapPort ? `sk-tap-${tapPort}-${state.taps[Number(tapPort) - 1]}` : focusKey;
      const target = over ? done.querySelector<HTMLElement>('button') : key ? root.querySelector<HTMLElement>(`[data-focus-key="${key}"]:not([disabled])`) : null;
      target?.focus({ preventScroll: !over });
    };

    n2.addEventListener('click', () => move({ type: 'n2' }, 'sk-n2'));
    wrap.addEventListener('click', () => move({ type: 'wrap', foil: api.has('item.foil') }, 'sk-wrap'));
    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
