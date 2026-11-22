/** View for the sample three-dial lock: buttons, live values, keyboard and touch. */
import { h } from '../../ui/dom.ts';
import type { PuzzleView } from '../types.ts';
import { dialLogic, type DialMove, type DialState } from './logic.ts';

export const dialView: PuzzleView = {
  mount(host, api, data) {
    let state: DialState = dialLogic.init({ minute: api.startMinute, act: api.act, data });
    const values = [0, 1, 2].map((i) => h('output', { class: 'demo__value', id: `demo-dial-${i}`, 'aria-live': 'polite' }));
    const labels = [0, 1, 2].map(() => h('span', { class: 'demo__label' }));
    const ups = [0, 1, 2].map((i) => h('button', { type: 'button', class: 'demo__btn', dataset: { dial: String(i), dir: 'up' } }, '+'));
    const downs = [0, 1, 2].map((i) => h('button', { type: 'button', class: 'demo__btn', dataset: { dial: String(i), dir: 'down' } }, '−'));
    const root = h('div', { class: 'demo' }, ...[0, 1, 2].map((i) => h('div', { class: 'demo__dial' }, labels[i]!, downs[i]!, values[i]!, ups[i]!)));

    const render = () => {
      state.dials.forEach((d, i) => {
        values[i]!.textContent = String(d);
        labels[i]!.textContent = api.t('puzzle.demo.dial', { n: i + 1 });
        ups[i]!.setAttribute('aria-label', api.t('puzzle.demo.up', { n: i + 1 }));
        downs[i]!.setAttribute('aria-label', api.t('puzzle.demo.down', { n: i + 1 }));
      });
    };
    const move = (m: DialMove) => {
      state = dialLogic.apply(state, m);
      api.saveData({ dials: state.dials, turns: state.turns });
      api.setMinutes(dialLogic.minutes(state));
      render();
      if (dialLogic.isSolved(state)) api.finish(true);
    };
    root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-dial]');
      if (!btn) return;
      move({ dial: Number(btn.dataset['dial']) as 0 | 1 | 2, delta: btn.dataset['dir'] === 'up' ? 1 : -1 });
    });
    render();
    host.appendChild(root);
    return { rerender: render, destroy: () => root.remove() };
  },
};
