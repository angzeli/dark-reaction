/**
 * The shared puzzle frame: title, intro, the clock (which moves as the
 * puzzle spends in-game minutes), a three-tier hint panel revealed in
 * order, and a way to step away. Puzzle views render only their body.
 * Accessible as a modal dialog: focus moves in, Tab stays in, and status
 * changes are announced.
 */
import { clockLabel, LOOP_LENGTH } from '../engine/clock.ts';
import type { Act } from '../engine/types.ts';
import type { Params } from '../i18n/i18n.ts';
import { h, inline, trapFocus } from '../ui/dom.ts';
import type { PuzzleApi, PuzzleView, PuzzleViewHandle } from './types.ts';

export interface FrameOptions {
  puzzleId: string;
  view: PuzzleView;
  hints: readonly [string, string, string];
  /** Hint tiers already revealed (they stay revealed across loops). */
  hintsUsed: number;
  startMinute: number;
  act: Act;
  reduceMotion: boolean;
  /** Flickering light allowed (default: no). */
  flicker?: boolean;
  /** What the player is carrying, read-only (default: nothing). */
  has?(item: string): boolean;
  data?: unknown;
  /**
   * Minutes already spent in this attempt, worked out from its saved data,
   * so a reload or a language switch (both remount) never hands them back.
   */
  restoredMinutes?: number;
  t(key: string, params?: Params): string;
  /** Reveal the next tier; returns the tier now revealed (1–3). */
  onHint(): number;
  onFinish(result: { solved: boolean; minutes: number; failed?: boolean }): void;
  onSaveData(data: unknown): void;
  cue(id: 'solve' | 'fail' | 'hint' | 'chirp'): void;
  /** The clock moved inside the puzzle (so the rest of the UI can follow). */
  onMinutes?(minute: number): void;
}

export interface FrameHandle {
  readonly element: HTMLElement;
  rerender(): void;
  destroy(): void;
}

export function mountPuzzleFrame(host: HTMLElement, o: FrameOptions): FrameHandle {
  const id = o.puzzleId;
  let spent = Math.max(0, Math.floor(o.restoredMinutes ?? 0));
  let hintsUsed = Math.max(0, Math.min(3, o.hintsUsed));
  let finished = false;

  const title = h('h2', { class: 'pz__title', id: `pz-title-${id}`, tabindex: '-1' });
  const clockLabelEl = h('span', { class: 'pz__clock-label' });
  const clockTime = h('time', { class: 'pz__clock-time' });
  const clock = h('p', { class: 'pz__clock' }, clockLabelEl, ' ', clockTime);
  const intro = h('p', { class: 'pz__intro' });
  const body = h('div', { class: 'pz__body' });
  const hintTitle = h('h3', { class: 'pz__hints-title' });
  const hintList = h('ol', { class: 'pz__hint-list' });
  const hintButton = h('button', { class: 'pz__hint-btn', type: 'button' });
  const leave = h('button', { class: 'pz__leave', type: 'button' });
  const status = h('p', { class: 'pz__status', role: 'status', 'aria-live': 'polite' });

  const element = h(
    'section',
    { class: `pz pz--${id}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': title.id, dataset: { puzzle: id } },
    h('header', { class: 'pz__head' }, title, clock),
    intro,
    body,
    h('aside', { class: 'pz__hints' }, hintTitle, hintList, hintButton),
    h('footer', { class: 'pz__foot' }, leave),
    status,
  );

  const renderClock = () => {
    clockLabelEl.textContent = o.t('puzzle.clock');
    clockTime.textContent = clockLabel(Math.min(LOOP_LENGTH, o.startMinute + spent));
  };
  const renderHints = () => {
    hintTitle.textContent = o.t('puzzle.hints.title');
    hintList.replaceChildren(
      ...o.hints.slice(0, hintsUsed).map((key, i) => {
        const item = h('li', { class: 'pz__hint', dataset: { tier: String(i + 1) } });
        item.innerHTML = `<span class="pz__hint-label">${inline(o.t('puzzle.hint.label', { n: i + 1 }))}</span> ${inline(o.t(key))}`;
        return item;
      }),
    );
    hintButton.textContent = hintsUsed >= 3 ? o.t('puzzle.hint.none') : o.t('puzzle.hint.button', { n: hintsUsed + 1 });
    hintButton.disabled = hintsUsed >= 3;
  };
  const renderChrome = () => {
    title.textContent = o.t(`puzzle.${id}.title`);
    intro.innerHTML = inline(o.t(`puzzle.${id}.intro`));
    leave.textContent = o.t('puzzle.leave');
    renderClock();
    renderHints();
  };

  const finish = (solved: boolean, failed = false) => {
    if (finished) return;
    finished = true;
    o.cue(solved ? 'solve' : 'fail');
    handle?.destroy();
    untrap();
    element.remove();
    o.onFinish(failed && !solved ? { solved, minutes: spent, failed: true } : { solved, minutes: spent });
  };

  const api: PuzzleApi = {
    startMinute: o.startMinute,
    act: o.act,
    reduceMotion: o.reduceMotion,
    flicker: o.flicker ?? false,
    has: (item) => o.has?.(item) ?? false,
    t: (key, params) => o.t(key, params),
    setMinutes(total) {
      if (finished) return;
      spent = Math.max(0, Math.floor(total));
      renderClock();
      o.onMinutes?.(Math.min(LOOP_LENGTH, o.startMinute + spent));
      // The lights go out on everyone, mid-puzzle or not (a puzzle opened at 03:33 itself is past that).
      if (o.startMinute < LOOP_LENGTH && o.startMinute + spent >= LOOP_LENGTH) finish(false);
    },
    finish,
    saveData: (data) => o.onSaveData(data),
    cue: (cueId) => o.cue(cueId),
  };

  hintButton.addEventListener('click', () => {
    if (hintsUsed >= 3) return;
    hintsUsed = o.onHint();
    renderHints();
    o.cue('hint');
    status.textContent = o.t(o.hints[hintsUsed - 1]!);
    (hintList.lastElementChild as HTMLElement | null)?.setAttribute('tabindex', '-1');
  });
  leave.addEventListener('click', () => finish(false));

  renderChrome();
  host.appendChild(element);
  const untrap = trapFocus(element);
  let handle: PuzzleViewHandle | null = null;
  handle = o.view.mount(body, api, o.data);
  title.focus();
  if (spent > 0) api.setMinutes(spent);

  return {
    element,
    rerender() {
      if (finished) return;
      renderChrome();
      handle?.rerender();
    },
    destroy() {
      if (finished) return;
      finished = true;
      handle?.destroy();
      untrap();
      element.remove();
    },
  };
}
