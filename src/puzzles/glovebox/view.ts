/**
 * View for the glovebox antechamber: a cut-away of the outer door, the
 * chamber and the inner door, the pressure gauge, the cycle count and the
 * box's oxygen meter, with one button per action. The laminated SOP (and
 * its pencilled correction) hangs beside it.
 */
import { O2_LIMIT } from '../../content/lab.ts';
import { h } from '../../ui/dom.ts';
import type { PuzzleView } from '../types.ts';
import { gloveboxLogic, gloveSave, o2, type GloveMove, type GloveState } from './logic.ts';

export const gloveboxView: PuzzleView = {
  mount(host, api, data) {
    let state: GloveState = gloveboxLogic.init({ minute: api.startMinute, act: api.act, data });

    const sop = h('figure', { class: 'gb__sop' }, h('p', {}), h('p', { class: 'gb__pencil' }));
    const meter = h('p', { class: 'gb__meter' });
    const outerDoor = h('div', { class: 'gb__door gb__door--outer' });
    const innerDoor = h('div', { class: 'gb__door gb__door--inner' });
    const vial = h('div', { class: 'gb__vial', 'aria-hidden': 'true' });
    const chamber = h('div', { class: 'gb__chamber' }, vial);
    const box = h('div', { class: 'gb__box', 'aria-hidden': 'true' });
    const gauge = h('p', { class: 'gb__gauge' });
    const cycles = h('p', { class: 'gb__cycles' });
    const where = h('p', { class: 'gb__where' });
    const diagram = h('div', { class: 'gb__diagram', 'aria-hidden': 'true' }, h('div', { class: 'gb__lab' }), outerDoor, chamber, innerDoor, box);
    const status = h('p', { class: 'gb__status', role: 'status', 'aria-live': 'polite' });
    const actions = h('div', { class: 'gb__actions' });
    const root = h('div', { class: 'gb' }, h('div', { class: 'gb__top' }, meter, sop), diagram, h('div', { class: 'gb__readouts' }, gauge, cycles, where), actions, status);

    const button = (label: string, m: GloveMove | (() => void), key: string, disabled = false) =>
      h(
        'button',
        {
          type: 'button',
          class: 'gb__btn',
          disabled,
          dataset: { focusKey: `gb-${key}`, move: typeof m === 'string' ? m : key },
          onclick: () => (typeof m === 'string' ? move(m) : m()),
        },
        label,
      );

    const move = (m: GloveMove) => {
      state = gloveboxLogic.apply(state, m);
      api.saveData(gloveSave(state));
      api.setMinutes(gloveboxLogic.minutes(state));
      render(`gb-${m}`);
    };

    const render = (focusKey?: string) => {
      const finished = state.done || state.ruined;
      const ppm = o2(state);
      (sop.children[0] as HTMLElement).textContent = api.t('puzzle.glovebox.sop');
      (sop.children[1] as HTMLElement).textContent = api.t('puzzle.glovebox.pencil');
      meter.textContent = api.t('puzzle.glovebox.o2', { ppm: ppm.toFixed(1) });
      meter.dataset['level'] = ppm > O2_LIMIT ? 'red' : ppm > 8 ? 'amber' : 'green';
      outerDoor.classList.toggle('gb__door--open', state.outer);
      innerDoor.classList.toggle('gb__door--open', state.inner);
      chamber.classList.toggle('gb__chamber--vacuum', state.vacuum);
      diagram.dataset['vial'] = state.vial;
      vial.classList.toggle('gb__vial--green', state.ruined);
      box.classList.toggle('gb__box--green', state.ruined);
      gauge.textContent = `${api.t(state.vacuum ? 'puzzle.glovebox.pressure.vac' : 'puzzle.glovebox.pressure.atm')} · ${api.t('puzzle.glovebox.outer')}: ${api.t(
        state.outer ? 'puzzle.glovebox.open' : 'puzzle.glovebox.closed',
      )} · ${api.t('puzzle.glovebox.inner')}: ${api.t(state.inner ? 'puzzle.glovebox.open' : 'puzzle.glovebox.closed')}`;
      cycles.textContent = api.t('puzzle.glovebox.cycles', { n: state.cycles });
      where.textContent = api.t(`puzzle.glovebox.vial.${state.vial}`);
      status.textContent = state.last
        ? api.t('puzzle.then', { first: api.t(`puzzle.glovebox.ev.${state.last}`), second: api.t('puzzle.glovebox.o2.now', { ppm: ppm.toFixed(1) }) })
        : '';

      if (finished) {
        actions.replaceChildren(
          state.done
            ? button(api.t('puzzle.glovebox.done'), () => api.finish(true), 'done')
            : button(api.t('puzzle.glovebox.giveup'), () => api.finish(false, true), 'giveup'),
        );
      } else {
        actions.replaceChildren(
          button(api.t(state.outer ? 'puzzle.glovebox.do.outer.close' : 'puzzle.glovebox.do.outer.open'), 'outer', 'outer'),
          button(api.t('puzzle.glovebox.do.load'), 'load', 'load', state.vial !== 'outside'),
          button(api.t('puzzle.glovebox.do.evacuate'), 'evacuate', 'evacuate'),
          button(api.t('puzzle.glovebox.do.refill'), 'refill', 'refill'),
          button(api.t(state.inner ? 'puzzle.glovebox.do.inner.close' : 'puzzle.glovebox.do.inner.open'), 'inner', 'inner'),
          button(api.t('puzzle.glovebox.do.transfer'), 'transfer', 'transfer', state.vial !== 'chamber'),
        );
      }
      const target = (focusKey && actions.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]:not([disabled])`)) || (finished ? actions.querySelector<HTMLElement>('button') : null);
      target?.focus();
    };

    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
