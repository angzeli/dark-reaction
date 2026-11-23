/**
 * View for the TLC plate: a plate you can read by eye or by screen reader,
 * spots you can measure, a UV lamp, and a take/leave toggle per fraction.
 * Spots and toggles are real buttons; nothing needs hover or drag.
 */
import { h } from '../../ui/dom.ts';
import type { PuzzleView } from '../types.ts';
import { CONTENTS, distance, LANES, PLATE, tlcLogic, visibleSpots, type Lane, type TlcFeedback, type TlcMove, type TlcState } from './logic.ts';

const pct = (cm: number) => `${(cm / PLATE.height) * 100}%`;
/** Spots from the top of the plate down (the farthest-run first). */
const topDown = <C extends Parameters<typeof distance>[0]>(spots: readonly C[]): C[] => [...spots].sort((a, b) => distance(b) - distance(a));

export const tlcView: PuzzleView = {
  mount(host, api, data) {
    let state: TlcState = tlcLogic.init({ minute: api.startMinute, act: api.act, data });

    const rule = h('p', { class: 'tlc__rule' });
    const plate = h('div', { class: 'tlc__plate', role: 'group' });
    const description = h('ul', { class: 'sr-only' });
    const uv = h('button', { type: 'button', class: 'tlc__uv', dataset: { focusKey: 'tlc-uv' } });
    const combine = h('button', { type: 'button', class: 'tlc__combine', dataset: { focusKey: 'tlc-combine' } });
    const readout = h('p', { class: 'tlc__readout', role: 'status', 'aria-live': 'polite' });
    const root = h('div', { class: 'tlc' }, rule, plate, description, h('div', { class: 'tlc__controls' }, uv, combine), readout);

    const laneName = (lane: Lane) => (lane === 'crude' ? api.t('puzzle.tlc.lane.crude') : String(lane));
    // The crude lane has a name, not a number, and each language words that differently (#114):
    // every lane string has a `.crude` twin.
    const laneKey = (key: string, lane: Lane) => (lane === 'crude' ? `${key}.crude` : key);
    /** Where a spot sits in its lane, from the top, so no two spot buttons share a name (#106). */
    const position = (lane: Lane, index: number, count: number) => (count === 1 ? '@puzzle.tlc.pos.only' : `@puzzle.tlc.pos.${index + 1}`);

    const feedbackText = (f: TlcFeedback | null): string => {
      if (!f) return '';
      switch (f.kind) {
        case 'empty':
          return api.t('puzzle.tlc.feedback.empty');
        case 'noProduct':
          return api.t('puzzle.tlc.feedback.noProduct', { lane: f.lane });
        case 'impure':
          return api.t(CONTENTS[f.lane].some((c) => c === 'B') && !f.uv ? 'puzzle.tlc.feedback.hidden' : 'puzzle.tlc.feedback.impure', { lane: f.lane });
        case 'wasteful':
          return api.t('puzzle.tlc.feedback.wasteful', { lane: f.lane });
        case 'measured':
          return api.t(laneKey('puzzle.tlc.measured', f.lane), { lane: f.lane, cm: f.cm.toFixed(1), rf: f.rf.toFixed(2) });
      }
    };

    const move = (m: TlcMove) => {
      const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.['focusKey'];
      state = tlcLogic.apply(state, m);
      api.saveData({ uv: state.uv, selected: state.selected, wrong: state.wrong });
      api.setMinutes(tlcLogic.minutes(state));
      render();
      // The lamp is the puzzle's turn: say what it changed (#106).
      if (m.type === 'uv') readout.textContent = uvNews();
      if (focusKey) root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)?.focus();
      if (tlcLogic.isSolved(state)) api.finish(true);
    };

    /** What switching the lamp just changed, in words: the lanes where spots came out (or went). */
    const uvNews = (): string => {
      const changed = LANES.filter((lane) => visibleSpots(lane, true).length !== visibleSpots(lane, false).length);
      const lanes = changed.map((lane) => (lane === 'crude' ? api.t('puzzle.tlc.lane.crude') : String(lane))).join(api.t('puzzle.tlc.describe.sep'));
      return api.t(state.uv ? 'puzzle.tlc.uv.news.on' : 'puzzle.tlc.uv.news.off', { lanes });
    };

    const render = () => {
      rule.textContent = api.t('puzzle.tlc.rule');
      plate.setAttribute('aria-label', api.t('puzzle.tlc.plate'));
      plate.classList.toggle('tlc__plate--uv', state.uv);
      // One coordinate system for lines and spots: the sheet is the plate's 8 cm.
      const tracks = LANES.map((lane) =>
        h(
          'div',
          { class: 'tlc__track', dataset: { lane: String(lane) } },
          ...topDown(visibleSpots(lane, state.uv)).map((c, i, all) =>
            h('button', {
              type: 'button',
              class: `tlc__spot tlc__spot--${c}`,
              style: `bottom: ${pct(PLATE.baseline + distance(c))}`,
              'aria-label': api.t(laneKey('puzzle.tlc.spot', lane), { lane, pos: position(lane, i, all.length) }),
              dataset: { lane: String(lane), compound: c, focusKey: `tlc-spot-${lane}-${c}` },
              onclick: () => move({ type: 'measure', lane, compound: c }),
            }),
          ),
        ),
      );
      const sheet = h(
        'div',
        { class: 'tlc__sheet' },
        h('div', { class: 'tlc__line tlc__line--front', style: `bottom: ${pct(PLATE.front)}` }, h('span', {}, api.t('puzzle.tlc.front'))),
        h('div', { class: 'tlc__line tlc__line--base', style: `bottom: ${pct(PLATE.baseline)}` }, h('span', {}, api.t('puzzle.tlc.baseline'))),
        ...tracks,
      );
      const lanes = h(
        'div',
        { class: 'tlc__lanes' },
        ...LANES.map((lane) =>
          h(
            'div',
            { class: 'tlc__lane', dataset: { lane: String(lane) } },
            h('span', { class: 'tlc__label' }, laneName(lane)),
            lane === 'crude'
              ? h('span', { class: 'tlc__take tlc__take--none' })
              : h(
                  'button',
                  {
                    type: 'button',
                    class: 'tlc__take',
                    'aria-pressed': String(state.selected.includes(lane)),
                    'aria-label': api.t('puzzle.tlc.take', { n: lane }),
                    dataset: { lane: String(lane), focusKey: `tlc-take-${lane}` },
                    onclick: () => move({ type: 'toggle', lane }),
                  },
                  api.t('puzzle.tlc.take.short'),
                ),
          ),
        ),
      );
      plate.replaceChildren(sheet, lanes);
      description.replaceChildren(
        ...LANES.map((lane) => {
          const spots = topDown(visibleSpots(lane, state.uv));
          const list = spots.length ? spots.map((c) => api.t('puzzle.tlc.describe.spot', { cm: distance(c).toFixed(1) })).join(api.t('puzzle.tlc.describe.sep')) : api.t('puzzle.tlc.describe.none');
          return h('li', {}, api.t(laneKey('puzzle.tlc.describe', lane), { lane, spots: list }));
        }),
      );
      uv.textContent = api.t(state.uv ? 'puzzle.tlc.uv.on' : 'puzzle.tlc.uv.off');
      uv.setAttribute('aria-pressed', String(state.uv));
      combine.textContent = api.t('puzzle.tlc.combine');
      readout.textContent = feedbackText(state.feedback);
    };

    uv.addEventListener('click', () => move({ type: 'uv' }));
    combine.addEventListener('click', () => move({ type: 'combine' }));
    render();
    host.appendChild(root);
    return { rerender: render, destroy: () => root.remove() };
  },
};
