/** Entry point for the puzzle-frame e2e test (e2e/puzzle-frame.spec.ts); not part of the game bundle. */
import css from '../styles/puzzle.css?inline';
import { setLocale, t, type Locale } from '../i18n/i18n.ts';
import { dialView } from './demo/view.ts';
import { mountPuzzleFrame, type FrameHandle } from './frame.ts';

export interface HarnessLog {
  finished: Array<{ solved: boolean; minutes: number }>;
  hints: number;
  saved: unknown[];
  cues: string[];
}

export function setup(startMinute: number, hintsUsed = 0): { log: HarnessLog; frame: FrameHandle } {
  const style = document.createElement('style');
  style.textContent = `:root{--text:#d8e0e6;--text-dim:#8fa3b3;--copper:#b07a4f;--tube:#9fe3b5;--font-mono:monospace}${css}`;
  document.head.appendChild(style);
  const log: HarnessLog = { finished: [], hints: hintsUsed, saved: [], cues: [] };
  const frame = mountPuzzleFrame(document.querySelector<HTMLElement>('#host')!, {
    puzzleId: 'demo',
    view: dialView,
    hints: ['puzzle.demo.h1', 'puzzle.demo.h2', 'puzzle.demo.h3'],
    hintsUsed,
    startMinute,
    act: 1,
    reduceMotion: true,
    t,
    onHint: () => (log.hints = Math.min(3, log.hints + 1)),
    onFinish: (r) => log.finished.push(r),
    onSaveData: (d) => log.saved.push(d),
    cue: (id) => log.cues.push(id),
  });
  return { log, frame };
}

export function switchLocale(locale: Locale, frame: FrameHandle): void {
  setLocale(locale);
  frame.rerender();
}
