/**
 * View for the freezer box: her pencilled lid notes, the freezer's display,
 * and the box itself, a 9 × 9 grid of caps you can move through with the
 * arrow keys or tap. Choosing a tube and lifting it are separate steps, so
 * a slipped finger costs nothing; every cell is a radio with its position
 * and cap colour in words, and what each lift finds is announced.
 */
import { h, setInline } from '../../ui/dom.ts';
import { bindRoving, setTabStop, type Spot } from '../roving.ts';
import type { PuzzleView } from '../types.ts';
import {
  ALARM_TEMP,
  ANSWER,
  capAt,
  CELLS,
  contents,
  coords,
  freezerLogic,
  freezerSave,
  labelCode,
  ROWS,
  SIZE,
  temperature,
  type Cell,
  type FreezerMove,
  type FreezerState,
} from './logic.ts';

const SPOTS: Spot[] = CELLS.map((c) => coords(c)!);
const minus = (n: number) => (n < 0 ? `−${-n}` : String(n));

export const freezerView: PuzzleView = {
  mount(host, api, data) {
    let state: FreezerState = freezerLogic.init({ minute: api.startMinute, act: api.act, data });

    const notes = h('ol', { class: 'fz__notes' });
    const lidTitle = h('figcaption', { class: 'fz__lid-title' });
    const lid = h('figure', { class: 'fz__lid' }, lidTitle, notes);
    const tempValue = h('span', { class: 'fz__temp-value' });
    const tempLabel = h('span', { class: 'fz__temp-label' });
    const temp = h('p', { class: 'fz__temp' }, tempLabel, tempValue);
    const label = h('p', { class: 'fz__label' });
    const grid = h('div', { class: 'fz__grid', role: 'radiogroup' });
    const box = h('div', { class: 'fz__box' }, label, grid);
    const selected = h('p', { class: 'fz__selected' });
    const lift = h('button', { type: 'button', class: 'fz__lift', dataset: { focusKey: 'fz-lift' } });
    const panel = h('div', { class: 'fz__panel' }, selected, lift);
    const status = h('p', { class: 'fz__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'fz__done' });
    const root = h('div', { class: 'fz' }, h('div', { class: 'fz__top' }, lid, temp), box, panel, status, done);
    let cells: HTMLButtonElement[] = [];

    const capName = (cell: Cell) => `@puzzle.freezer.cap.${capAt(cell) ?? 'empty'}`;
    const tempText = () => api.t('puzzle.freezer.temp', { t: minus(temperature(state)) });

    /** What the last lift found (it stays on screen while you choose the next tube), and how warm the freezer is getting. */
    let shown: FreezerState['last'] = null;
    let shownAt = temperature(state);
    const report = (): string => {
      if (state.last) {
        shown = state.last;
        shownAt = temperature(state);
      }
      const last = shown;
      if (!last) return '';
      if (last.kind === 'none') return api.t('puzzle.freezer.selected.none');
      if (last.kind === 'empty') return api.t('puzzle.freezer.lift.empty', { cell: last.cell });
      if (last.kind === 'again') return api.t('puzzle.freezer.again', { cell: last.cell });
      const kind = contents(last.cell)!;
      const found = api.t(`puzzle.freezer.found.${kind}`, { cell: last.cell, cap: capName(last.cell), code: labelCode(last.cell) });
      if (kind === 'card') return found;
      const now = shownAt;
      const warning =
        now >= ALARM_TEMP ? 'puzzle.freezer.alarm' : now === ALARM_TEMP - 1 ? 'puzzle.freezer.beep' : now === ALARM_TEMP - 2 ? 'puzzle.freezer.warm' : null;
      return warning ? api.t('puzzle.then', { first: found, second: api.t(warning, { temp: api.t('puzzle.freezer.temp', { t: minus(now) }) }) }) : found;
    };

    const move = (m: FreezerMove, focusKey?: string) => {
      state = freezerLogic.apply(state, m);
      api.saveData(freezerSave(state));
      api.setMinutes(freezerLogic.minutes(state));
      render(focusKey);
    };

    const render = (focusKey?: string) => {
      const solved = freezerLogic.isSolved(state);
      // Solved before its last button is pressed: stepping away keeps it solved (#140).
      if (solved) api.solved();
      const failed = freezerLogic.isFailed!(state);
      const over = solved || failed;

      lidTitle.textContent = api.t('puzzle.freezer.lid');
      notes.replaceChildren(...[1, 2, 3, 4].map((n) => h('li', {}, api.t(`puzzle.freezer.note.${n}`))));
      tempLabel.textContent = api.t('puzzle.freezer.display');
      tempValue.textContent = tempText();
      const now = temperature(state);
      temp.dataset['level'] = failed ? 'alarm' : now >= ALARM_TEMP - 2 ? 'warm' : 'cold';
      label.textContent = api.t('puzzle.freezer.label');
      grid.setAttribute('aria-label', api.t('puzzle.freezer.grid'));

      // Column numbers along the top and row letters down the side, for the eye only:
      // every cell says where it is.
      const heads = [h('span', { class: 'fz__corner', 'aria-hidden': 'true' }), ...Array.from({ length: SIZE }, (_, c) => h('span', { class: 'fz__head', 'aria-hidden': 'true' }, String(c + 1)))];
      cells = CELLS.map((cell) => {
        const cap = capAt(cell);
        const lifted = state.lifted.includes(cell);
        return h(
          'button',
          {
            type: 'button',
            role: 'radio',
            class: `fz__cell fz__cell--${cap ?? 'empty'}${lifted ? ' fz__cell--lifted' : ''}${solved && cell === ANSWER ? ' fz__cell--found' : ''}`,
            'aria-checked': String(state.selected === cell),
            'aria-label': api.t(lifted ? 'puzzle.freezer.cell.lifted' : 'puzzle.freezer.cell', { cell, cap: capName(cell) }),
            disabled: over,
            dataset: { cell, focusKey: `fz-${cell}` },
            onclick: () => move({ type: 'select', cell }, `fz-${cell}`),
          },
          h('span', { class: 'fz__cap', 'aria-hidden': 'true' }),
        );
      });
      const rows = ROWS.flatMap((letter, r) => [h('span', { class: 'fz__head fz__head--row', 'aria-hidden': 'true' }, letter), ...cells.slice(r * SIZE, (r + 1) * SIZE)]);
      grid.replaceChildren(...heads, ...rows);
      setTabStop(cells, Math.max(0, CELLS.indexOf(state.selected ?? CELLS[0]!)));

      const sel = state.selected;
      selected.textContent = sel ? api.t('puzzle.freezer.selected', { cell: sel, cap: capName(sel) }) : api.t('puzzle.freezer.selected.none');
      const canLift = !over && !!sel && !!capAt(sel) && !state.lifted.includes(sel);
      lift.textContent = !sel
        ? api.t('puzzle.freezer.lift.none')
        : !capAt(sel)
          ? api.t('puzzle.freezer.lift.empty', { cell: sel })
          : state.lifted.includes(sel)
            ? api.t('puzzle.freezer.lift.again', { cell: sel })
            : api.t('puzzle.freezer.lift', { cell: sel });
      lift.disabled = !canLift;
      panel.hidden = over;
      const said = report();
      setInline(status, said);

      done.replaceChildren(
        ...(over
          ? [
              h(
                'button',
                { type: 'button', class: 'fz__finish', dataset: { focusKey: 'fz-finish' }, onclick: () => api.finish(solved, !solved) },
                api.t(solved ? 'puzzle.freezer.done' : 'puzzle.freezer.close'),
              ),
            ]
          : []),
      );

      // Focus stays where it was; if that control has just been disabled (the tube you
      // lifted), it goes back to the tube in the box.
      const find = (key: string) => root.querySelector<HTMLElement>(`[data-focus-key="${key}"]:not([disabled])`);
      const target = over ? done.querySelector<HTMLElement>('button') : focusKey ? (find(focusKey) ?? (sel ? find(`fz-${sel}`) : null)) : null;
      target?.focus();
    };

    bindRoving(grid, {
      items: () => cells,
      spots: () => SPOTS,
      onMove: (i) => move({ type: 'select', cell: CELLS[i]! }, `fz-${CELLS[i]}`),
    });
    lift.addEventListener('click', () => move({ type: 'lift' }, 'fz-lift'));

    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
