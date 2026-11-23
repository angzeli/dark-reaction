/**
 * View for her notebook's last page. Each language gets its own original:
 *
 * - English: her line of numbers with a gap under each, and the periodic
 *   table printed inside the back cover. Choose a gap (or let the next one
 *   come up), then an element. The table is one Tab stop; the arrow keys
 *   move through it in its real layout.
 * - 繁中: her four characters and a sticky note. Choose a character, then
 *   the radical to take off it, and see what is left.
 *
 * Both versions live in the same saved state, so switching language (which
 * remounts the view) finds each exactly as it was left.
 */
import { getLocale } from '../../i18n/i18n.ts';
import { h, setInline } from '../../ui/dom.ts';
import { bindRoving, setTabStop, type Spot } from '../roving.ts';
import type { PuzzleView } from '../types.ts';
import {
  cipherLogic,
  cipherSave,
  ELEMENTS,
  EN_GROUPS,
  EN_LINE,
  position,
  RADICAL_GLYPH,
  RADICALS,
  symbolOf,
  ZH_GROUPS,
  ZH_LINE,
  type CipherMove,
  type CipherState,
} from './logic.ts';

const ZS = ELEMENTS.map((_, i) => i + 1);
const TABLE_SPOTS: Spot[] = ZS.map(position);

/**
 * Group a line's items into its words, as her dots do. Each dot stays with
 * the word before it, so a narrow screen breaks the line after a dot,
 * never before one.
 */
function wordsOf(items: HTMLElement[], groups: readonly number[]): HTMLElement[] {
  let at = 0;
  return groups.map((n, i) => {
    const word = h('span', { class: 'ci__word' }, ...items.slice(at, at + n));
    at += n;
    if (i < groups.length - 1) word.append(h('span', { class: 'ci__dot', 'aria-hidden': 'true' }, '·'));
    return word;
  });
}

export const cipherView: PuzzleView = {
  mount(host, api, data) {
    let state: CipherState = cipherLogic.init({ minute: api.startMinute, act: api.act, data });
    /** The element that holds the table's Tab stop (the last one you were on). */
    let tableAt = 1;

    const body = h('div', { class: 'ci__body' });
    const status = h('p', { class: 'ci__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'ci__done' });
    const root = h('div', { class: 'ci' }, body, status, done);

    const move = (m: CipherMove, focusKey?: string) => {
      state = cipherLogic.apply(state, m);
      api.saveData(cipherSave(state));
      api.setMinutes(cipherLogic.minutes(state));
      render(focusKey);
    };

    const page = (line: HTMLElement, aside: string, asideClass: string) =>
      h(
        'div',
        { class: 'ci__page' },
        h('p', { class: 'ci__lead' }, api.t('puzzle.cipher.note')),
        line,
        h('p', { class: asideClass }, aside),
      );

    // ── English: numbers, gaps, and the table ──────────────────────────────

    const renderEn = (): HTMLElement[] => {
      const en = state.en;
      const solved = cipherLogic.isSolved(state);
      const slots = EN_LINE.map((n, i) => {
        const filled = en.filled[i]!;
        return h(
          'button',
          {
            type: 'button',
            role: 'radio',
            class: `ci__slot${filled ? ' ci__slot--filled' : ''}`,
            'aria-checked': String(en.slot === i),
            'aria-label': api.t(filled ? 'puzzle.cipher.slot.filled' : 'puzzle.cipher.slot', { i: i + 1, n, symbol: symbolOf(n) }),
            disabled: solved,
            dataset: { focusKey: `ci-slot-${i}`, slot: String(i) },
            onclick: () => move({ v: 'en', type: 'slot', slot: i }, `ci-slot-${i}`),
          },
          h('span', { class: 'ci__num', 'aria-hidden': 'true' }, String(n)),
          h('span', { class: 'ci__sym', 'aria-hidden': 'true' }, filled ? symbolOf(n) : ''),
        );
      });
      setTabStop(slots, en.slot);
      const line = h('div', { class: 'ci__line', role: 'radiogroup', 'aria-label': api.t('puzzle.cipher.line') }, ...wordsOf(slots, EN_GROUPS));
      bindRoving(line, {
        items: () => slots,
        spots: () => slots.map((_, i) => ({ row: 0, col: i })),
        linear: true,
        onMove: (i) => move({ v: 'en', type: 'slot', slot: i }, `ci-slot-${i}`),
      });

      const tiles = ZS.map((z) => {
        const { row, col } = position(z);
        return h(
          'button',
          {
            type: 'button',
            class: `ci__el${row >= 9 ? ' ci__el--f' : ''}${col === 18 ? ' ci__el--noble' : ''}`,
            style: `grid-row: ${row}; grid-column: ${col}`,
            disabled: solved,
            dataset: { focusKey: `ci-el-${z}`, z: String(z) },
            onclick: () => {
              tableAt = z;
              move({ v: 'en', type: 'pick', z }, `ci-el-${z}`);
            },
          },
          // Named by what it shows ("1 H"), so the accessible name always contains the visible text.
          h('span', { class: 'ci__z' }, String(z)),
          h('span', { class: 'ci__s' }, symbolOf(z)),
        );
      });
      setTabStop(tiles, tableAt - 1);
      // Where the lanthanides and actinides would sit in groups 3, and a gap above their rows.
      const marker = (row: number, text: string) => h('span', { class: 'ci__marker', style: `grid-row: ${row}; grid-column: 3`, 'aria-hidden': 'true' }, text);
      const table = h(
        'div',
        { class: 'ci__table', role: 'group', 'aria-label': api.t('puzzle.cipher.table') },
        ...tiles,
        marker(6, '57–71'),
        marker(7, '89–103'),
        h('span', { class: 'ci__spacer', 'aria-hidden': 'true' }),
      );
      bindRoving(table, {
        items: () => tiles,
        spots: () => TABLE_SPOTS,
        onMove: (i) => {
          tableAt = i + 1;
          setTabStop(tiles, i);
          tiles[i]!.focus();
        },
      });
      table.addEventListener('focusin', (e) => {
        const z = Number((e.target as HTMLElement).dataset['z']);
        if (z) {
          tableAt = z;
          setTabStop(tiles, z - 1);
        }
      });

      const last = en.last;
      const said = !last
        ? ''
        : last.kind === 'filled'
          ? api.t('puzzle.cipher.en.filled')
          : api.t(last.kind === 'right' ? 'puzzle.cipher.en.right' : 'puzzle.cipher.en.wrong', { symbol: symbolOf(last.z), n: EN_LINE[last.slot]! });

      say(said);
      return [
        page(line, api.t('puzzle.cipher.aside'), 'ci__aside'),
        h('div', { class: 'ci__poster' }, h('p', { class: 'ci__poster-title', 'aria-hidden': 'true' }, api.t('puzzle.cipher.table')), h('div', { class: 'ci__scroll' }, table)),
      ];
    };

    // ── 繁中: characters and radicals ──────────────────────────────────────

    const renderZh = (): HTMLElement[] => {
      const zh = state.zh;
      const solved = cipherLogic.isSolved(state);
      const chars = ZH_LINE.map((c, i) => {
        const stripped = zh.stripped[i]!;
        const radical = `@puzzle.cipher.radical.${c.radical}`;
        return h(
          'button',
          {
            type: 'button',
            role: 'radio',
            class: `ci__char${stripped ? ' ci__char--stripped' : ''}`,
            'aria-checked': String(zh.char === i),
            'aria-label': stripped ? api.t('puzzle.cipher.char.stripped', { char: c.char, radical, rest: c.rest }) : c.char,
            disabled: solved,
            dataset: { focusKey: `ci-char-${i}`, char: String(i) },
            onclick: () => move({ v: 'zh', type: 'char', char: i }, `ci-char-${i}`),
          },
          h('span', { class: 'ci__glyph', 'aria-hidden': 'true' }, stripped ? c.rest : c.char),
          h('span', { class: 'ci__was', 'aria-hidden': 'true' }, stripped ? `${c.char} − ${RADICAL_GLYPH[c.radical]}` : ''),
        );
      });
      setTabStop(chars, zh.char);
      const line = h('div', { class: 'ci__line ci__line--zh', role: 'radiogroup', 'aria-label': api.t('puzzle.cipher.chars') }, ...wordsOf(chars, ZH_GROUPS));
      bindRoving(line, {
        items: () => chars,
        spots: () => chars.map((_, i) => ({ row: 0, col: i })),
        linear: true,
        onMove: (i) => move({ v: 'zh', type: 'char', char: i }, `ci-char-${i}`),
      });

      const radicals = h(
        'div',
        { class: 'ci__radicals', role: 'group', 'aria-label': api.t('puzzle.cipher.radicals') },
        ...RADICALS.map((r) =>
          h(
            'button',
            {
              type: 'button',
              class: 'ci__radical',
              disabled: solved,
              dataset: { focusKey: `ci-radical-${r}`, radical: r },
              onclick: () => move({ v: 'zh', type: 'strip', radical: r }, `ci-radical-${r}`),
            },
            // Named by its visible name, after a word only a screen reader hears ("Take off the metal radical").
            h('span', { class: 'sr-only' }, api.t('puzzle.cipher.strip')),
            h('span', { class: 'ci__rglyph', 'aria-hidden': 'true' }, RADICAL_GLYPH[r]),
            h('span', { class: 'ci__rname' }, api.t(`puzzle.cipher.radical.${r}`)),
          ),
        ),
      );

      const last = zh.last;
      const said = !last
        ? ''
        : last.kind === 'stripped'
          ? api.t('puzzle.cipher.zh.stripped')
          : api.t(last.kind === 'right' ? 'puzzle.cipher.zh.right' : 'puzzle.cipher.zh.wrong', {
              char: ZH_LINE[last.char]!.char,
              radical: `@puzzle.cipher.radical.${last.radical}`,
              rest: ZH_LINE[last.char]!.rest,
            });

      say(said);
      return [page(line, api.t('puzzle.cipher.aside'), 'ci__sticky'), radicals];
    };

    /** The live region stays put; only what it says changes. */
    const say = (said: string) => {
      setInline(status, said);
    };

    const render = (focusKey?: string) => {
      const zh = getLocale() === 'zh-Hant-TW';
      const solved = cipherLogic.isSolved(state);
      root.className = `ci ci--${zh ? 'zh' : 'en'}`;
      body.replaceChildren(...(zh ? renderZh() : renderEn()));
      done.replaceChildren(
        ...(solved
          ? [
              h('p', { class: 'ci__decoded' }, api.t('puzzle.cipher.decoded')),
              h('p', { class: 'ci__note' }, api.t('puzzle.cipher.solvedNote')),
              h('button', { type: 'button', class: 'ci__finish', dataset: { focusKey: 'ci-finish' }, onclick: () => api.finish(true) }, api.t('puzzle.cipher.done')),
            ]
          : []),
      );
      const target = solved ? done.querySelector<HTMLElement>('.ci__finish') : focusKey ? body.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : null;
      target?.focus({ preventScroll: !solved });
    };

    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
