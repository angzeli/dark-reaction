/**
 * View for the porter's terminal: seven nights of the access log, filtered
 * by night and by door (radio groups, arrow keys or taps), an "older
 * entries" toggle that reaches back to Y.C.'s first 03:33, and a page of
 * your notebook with tonight's two windows to mark. Each window is a
 * slider: tap the minute it opens, nudge it with the buttons, or use the
 * arrow keys. Nothing needs dragging or hovering.
 */
import { LOOP_LENGTH } from '../../engine/clock.ts';
import { h } from '../../ui/dom.ts';
import { bindRoving, setTabStop } from '../roving.ts';
import type { PuzzleView } from '../types.ts';
import {
  clock,
  DAYS,
  DOORS,
  doorlogLogic,
  doorlogSave,
  FIRST_ENTRY,
  LAST_START,
  LOOP_ZERO,
  NIGHTS,
  ROWS,
  USUAL_PI,
  visibleArchive,
  visibleLog,
  WINDOW,
  type ArchiveRow,
  type DateParts,
  type DoorFilter,
  type DoorlogMove,
  type DoorlogState,
  type LogEntry,
  type NightFilter,
  type Row,
} from './logic.ts';

const pad = (n: number) => String(n).padStart(2, '0');
/** Text that may break after a slash (a date on a narrow screen), and nowhere it shouldn't. */
const slashBreaks = (text: string): Array<string | HTMLElement> => text.split('/').flatMap((part, i, all) => (i < all.length - 1 ? [`${part}/`, h('wbr')] : [part]));
const minuteLabel = (loopMinute: number) => clock(LOOP_ZERO + loopMinute);
/** Scale marks along tonight's line (loop minutes): 02:50, 03:00 … 03:30. */
const SCALE = [3, 13, 23, 33, 43];
/** How far each key moves a window along the line, in minutes. */
const STEPS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };

export const doorlogView: PuzzleView = {
  mount(host, api, data) {
    let state: DoorlogState = doorlogLogic.init({ minute: api.startMinute, act: api.act, data });

    const head = h('p', { class: 'dl__head' });
    const nights = h('div', { class: 'dl__filter', role: 'radiogroup' });
    const doors = h('div', { class: 'dl__filter', role: 'radiogroup' });
    const nightsLabel = h('span', { class: 'dl__filter-label', id: 'dl-nights-label' });
    const doorsLabel = h('span', { class: 'dl__filter-label', id: 'dl-doors-label' });
    nights.setAttribute('aria-labelledby', nightsLabel.id);
    doors.setAttribute('aria-labelledby', doorsLabel.id);
    const table = h('table', { class: 'dl__table' });
    const log = h('div', { class: 'dl__log', role: 'region', tabindex: '0' }, table);
    const older = h('button', { type: 'button', class: 'dl__older', dataset: { focusKey: 'dl-older' } });
    const count = h('p', { class: 'dl__count' });
    const screen = h(
      'div',
      { class: 'dl__screen' },
      head,
      h('div', { class: 'dl__filters' }, h('div', { class: 'dl__filter-row' }, nightsLabel, nights), h('div', { class: 'dl__filter-row' }, doorsLabel, doors)),
      log,
      h('div', { class: 'dl__tools' }, older, count),
    );
    const pageTitle = h('h3', { class: 'dl__page-title' });
    const pageHow = h('p', { class: 'dl__page-how' });
    const marks = h('div', { class: 'dl__marks' });
    const write = h('button', { type: 'button', class: 'dl__write', dataset: { focusKey: 'dl-write' } });
    const page = h('section', { class: 'dl__page' }, pageTitle, pageHow, marks, write);
    const status = h('p', { class: 'dl__status', role: 'status', 'aria-live': 'polite' });
    const root = h('div', { class: 'dl' }, screen, page, status);

    const move = (m: DoorlogMove, focusKey?: string) => {
      state = doorlogLogic.apply(state, m);
      api.saveData(doorlogSave(state));
      api.setMinutes(doorlogLogic.minutes(state));
      if (doorlogLogic.isSolved(state)) {
        api.finish(true);
        return;
      }
      render(focusKey);
      if (m.type === 'older' && state.older) log.scrollTop = 0;
    };

    // ── Filters ────────────────────────────────────────────────────────────

    const NIGHT_VALUES: NightFilter[] = ['all', ...NIGHTS.map((_, i) => i)];
    const DOOR_VALUES: DoorFilter[] = ['all', ...DOORS];
    const nightName = (i: number, long = false) => api.t(long ? 'puzzle.doorlog.night.long' : 'puzzle.doorlog.night', { day: `@puzzle.doorlog.day.${DAYS[i]}`, d: NIGHTS[i]! });
    const radios = <T>(group: HTMLElement, values: T[], current: T, label: (v: T) => string, key: (v: T) => string, pick: (v: T) => DoorlogMove) => {
      const items = values.map((v) =>
        h(
          'button',
          { type: 'button', role: 'radio', class: 'dl__opt', 'aria-checked': String(v === current), dataset: { focusKey: key(v), value: String(v) }, onclick: () => move(pick(v), key(v)) },
          label(v),
        ),
      );
      group.replaceChildren(...items);
      setTabStop(items, Math.max(0, values.indexOf(current)));
      return items;
    };
    let nightItems: HTMLElement[] = [];
    let doorItems: HTMLElement[] = [];
    bindRoving(nights, {
      items: () => nightItems,
      spots: () => nightItems.map((_, i) => ({ row: 0, col: i })),
      linear: true,
      onMove: (i) => move({ type: 'night', night: NIGHT_VALUES[i]! }, `dl-night-${NIGHT_VALUES[i]}`),
    });
    bindRoving(doors, {
      items: () => doorItems,
      spots: () => doorItems.map((_, i) => ({ row: 0, col: i })),
      linear: true,
      onMove: (i) => move({ type: 'door', door: DOOR_VALUES[i]! }, `dl-door-${DOOR_VALUES[i]}`),
    });

    // ── The log ────────────────────────────────────────────────────────────

    const cellsFor = (time: number, door: LogEntry['door'], badge: LogEntry['badge'], event: LogEntry['event']) => [
      h('td', { class: 'dl__time' }, clock(time)),
      h('td', { class: 'dl__door' }, api.t(`puzzle.doorlog.door.${door}`)),
      h('td', { class: 'dl__badge' }, ...slashBreaks(api.t(`puzzle.doorlog.badge.${badge}`))),
      h('td', { class: `dl__event dl__event--${event}` }, api.t(`puzzle.doorlog.ev.${event}`)),
    ];
    const groupHead = (text: string, extra = '') => h('tr', { class: `dl__group${extra}` }, h('th', { colspan: '4', scope: 'rowgroup' }, text));
    const note = (text: string, extra: string) => h('tr', { class: `dl__note ${extra}` }, h('td', { colspan: '4' }, text));
    const dateText = (p: DateParts) => api.t('puzzle.doorlog.date', { d: pad(p.d), m: pad(p.m), y: p.y });

    const renderArchive = (rows: ArchiveRow[]): HTMLElement[] => {
      if (!state.older) return [];
      const title = groupHead(api.t('puzzle.doorlog.archive'), ' dl__group--archive');
      if (rows.length === 0) return [h('tbody', { class: 'dl__archive' }, title, note(api.t('puzzle.doorlog.none'), 'dl__note--none'))];
      const bodies: HTMLElement[] = [];
      let body = h('tbody', { class: 'dl__archive' }, title, note(api.t('puzzle.doorlog.archive.start'), 'dl__note--start'));
      let lastDate = '';
      for (const row of rows) {
        if ('gap' in row) {
          body.append(note(api.t('puzzle.doorlog.archive.gap', { n: row.gap.toLocaleString('en-GB') }), 'dl__note--gap'));
          lastDate = '';
          continue;
        }
        const date = dateText(row.date);
        if (date !== lastDate) {
          bodies.push(body);
          body = h('tbody', { class: 'dl__archive' }, groupHead(date, ' dl__group--date'));
          lastDate = date;
        }
        body.append(h('tr', { class: 'dl__entry', dataset: { door: row.door, badge: row.badge } }, ...cellsFor(row.time, row.door, row.badge, row.event)));
      }
      body.append(note(api.t('puzzle.doorlog.archive.noexit', { date: dateText(FIRST_ENTRY.date), time: clock(FIRST_ENTRY.time) }), 'dl__note--noexit'));
      bodies.push(body);
      return bodies;
    };

    const renderLog = () => {
      const entries = visibleLog(state);
      const archive = visibleArchive(state);
      const header = h(
        'thead',
        {},
        h(
          'tr',
          {},
          ...(['time', 'door', 'badge', 'event'] as const).map((c) => h('th', { scope: 'col', class: `dl__col dl__col--${c}` }, api.t(`puzzle.doorlog.col.${c}`))),
        ),
      );
      const bodies = NIGHTS.map((_, i) => i)
        .filter((i) => entries.some((e) => e.night === i))
        .map((i) =>
          h(
            'tbody',
            { dataset: { night: String(i) } },
            groupHead(nightName(i, true)),
            ...entries.filter((e) => e.night === i).map((e) => h('tr', { class: 'dl__entry', dataset: { door: e.door, badge: e.badge } }, ...cellsFor(e.time, e.door, e.badge, e.event))),
          ),
        );
      const empty = entries.length === 0 ? [h('tbody', {}, note(api.t('puzzle.doorlog.none'), 'dl__note--none'))] : [];
      table.replaceChildren(header, ...renderArchive(archive), ...bodies, ...empty);
      count.textContent = api.t('puzzle.doorlog.count', { n: entries.length });
    };

    // ── Tonight's two windows ──────────────────────────────────────────────

    /** Mark a window's start (the logic keeps it on the line). */
    const mark = (row: Row, start: number, focusKey = `dl-track-${row}`) => move({ type: 'mark', row, start }, focusKey);
    const windowText = (start: number | null, spoken = false) =>
      start === null
        ? api.t('puzzle.doorlog.unmarked')
        : api.t(spoken ? 'puzzle.doorlog.window.spoken' : 'puzzle.doorlog.window', { from: minuteLabel(start), to: minuteLabel(start + WINDOW) });

    const markRow = (row: Row): HTMLElement => {
      const start = state.marks[row];
      const labelId = `dl-${row}-label`;
      const pct = (m: number) => `${(m / LOOP_LENGTH) * 100}%`;
      const track = h(
        'div',
        {
          class: 'dl__track',
          role: 'slider',
          tabindex: '0',
          'aria-labelledby': labelId,
          'aria-valuemin': '0',
          'aria-valuemax': String(LAST_START),
          'aria-valuenow': String(start ?? 0),
          'aria-valuetext': windowText(start, true),
          dataset: { focusKey: `dl-track-${row}`, row },
        },
        h('span', { class: 'dl__ticks', 'aria-hidden': 'true' }, ...SCALE.map((m) => h('span', { class: 'dl__tick', style: `left: ${pct(m)}` }))),
        start === null ? null : h('span', { class: 'dl__window', 'aria-hidden': 'true', style: `left: ${pct(start)}; width: ${pct(WINDOW)}` }),
      );
      track.addEventListener('click', (e) => {
        const box = track.getBoundingClientRect();
        if (box.width <= 0) return;
        mark(row, Math.floor(((e.clientX - box.left) / box.width) * LOOP_LENGTH));
      });
      track.addEventListener('keydown', (e) => {
        const to = e.key in STEPS ? (state.marks[row] ?? 0) + STEPS[e.key]! : e.key === 'Home' ? 0 : e.key === 'End' ? LAST_START : null;
        if (to === null || e.altKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        mark(row, to);
      });
      const scale = h(
        'div',
        { class: 'dl__scale', 'aria-hidden': 'true' },
        ...SCALE.map((m) => h('span', { style: `left: ${pct(m)}` }, minuteLabel(m))),
      );
      const nudge = (delta: number) =>
        h(
          'button',
          {
            type: 'button',
            class: 'dl__nudge',
            'aria-label': api.t(delta < 0 ? 'puzzle.doorlog.earlier' : 'puzzle.doorlog.later', { n: Math.abs(delta) }),
            dataset: { focusKey: `dl-nudge-${row}-${delta}`, delta: String(delta) },
            onclick: () => mark(row, (state.marks[row] ?? 0) + delta, `dl-nudge-${row}-${delta}`),
          },
          delta < 0 ? `−${-delta}` : `+${delta}`,
        );
      return h(
        'div',
        { class: 'dl__mark', dataset: { row } },
        h('div', { class: 'dl__mark-head' }, h('p', { class: 'dl__mark-label', id: labelId }, api.t(`puzzle.doorlog.row.${row}`)), h('output', { class: 'dl__value' }, windowText(start))),
        h('div', { class: 'dl__line' }, track, scale),
        h('div', { class: 'dl__nudges' }, nudge(-5), nudge(-1), nudge(1), nudge(5)),
      );
    };

    const feedback = (): string => {
      const f = state.last;
      if (!f) return '';
      if (f.kind === 'unmarked') return api.t('puzzle.doorlog.check.unmarked');
      const which = f.rows.length === 2 ? 'both' : f.rows[0]!;
      const said = api.t(`puzzle.doorlog.check.${which}`);
      return f.usual ? api.t('puzzle.then', { first: said, second: api.t('puzzle.doorlog.check.usual', { time: minuteLabel(USUAL_PI) }) }) : said;
    };

    const render = (focusKey?: string) => {
      head.textContent = api.t('puzzle.doorlog.screen');
      nightsLabel.textContent = api.t('puzzle.doorlog.nights');
      doorsLabel.textContent = api.t('puzzle.doorlog.doors');
      nightItems = radios(nights, NIGHT_VALUES, state.night, (v) => (v === 'all' ? api.t('puzzle.doorlog.all.nights') : nightName(v)), (v) => `dl-night-${v}`, (night) => ({ type: 'night', night }));
      doorItems = radios(doors, DOOR_VALUES, state.door, (v) => api.t(v === 'all' ? 'puzzle.doorlog.all.doors' : `puzzle.doorlog.door.${v}`), (v) => `dl-door-${v}`, (door) => ({ type: 'door', door }));
      log.setAttribute('aria-label', api.t('puzzle.doorlog.log'));
      renderLog();
      older.textContent = api.t('puzzle.doorlog.older');
      older.setAttribute('aria-pressed', String(state.older));
      pageTitle.textContent = api.t('puzzle.doorlog.tonight');
      pageHow.textContent = api.t('puzzle.doorlog.tonight.how');
      marks.replaceChildren(...ROWS.map(markRow));
      write.textContent = api.t('puzzle.doorlog.write');
      const said = feedback();
      if (status.textContent !== said) status.textContent = said;
      if (focusKey) root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)?.focus({ preventScroll: true });
    };

    older.addEventListener('click', () => move({ type: 'older' }, 'dl-older'));
    write.addEventListener('click', () => move({ type: 'write' }, 'dl-write'));
    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
