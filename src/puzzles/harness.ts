/** Entry point for the puzzle e2e tests (e2e/puzzle-frame.spec.ts, e2e/act3-puzzles.spec.ts); not part of the game bundle. */
import css from '../styles/puzzle.css?inline';
import type { Act } from '../engine/types.ts';
import { setLocale, t, type Locale } from '../i18n/i18n.ts';
import { dialView } from './demo/view.ts';
import { mountPuzzleFrame, type FrameHandle } from './frame.ts';
import { PUZZLES } from './registry.ts';

export interface HarnessLog {
  finished: Array<{ solved: boolean; minutes: number; failed?: boolean }>;
  hints: number;
  saved: unknown[];
  cues: string[];
}

export interface HarnessOptions {
  /** A registered puzzle to mount instead of the sample dial lock. */
  puzzle?: string;
  act?: Act;
  /** What the player is carrying (read through the API's `has`). */
  items?: string[];
  flicker?: boolean;
  reduceMotion?: boolean;
  data?: unknown;
}

export function setup(startMinute: number, hintsUsed = 0, opts: HarnessOptions = {}): { log: HarnessLog; frame: FrameHandle } {
  const style = document.createElement('style');
  style.textContent = `:root{--text:#d8e0e6;--text-dim:#8fa3b3;--copper:#b07a4f;--tube:#9fe3b5;--paper:#efe5cf;--ink:#24324a;--font-mono:monospace;--font-serif-zh:serif}${css}`;
  document.head.appendChild(style);
  const log: HarnessLog = { finished: [], hints: hintsUsed, saved: [], cues: [] };
  const id = opts.puzzle ?? 'demo';
  const items = opts.items ?? [];
  const frame = mountPuzzleFrame(document.querySelector<HTMLElement>('#host')!, {
    puzzleId: id,
    view: opts.puzzle ? PUZZLES[opts.puzzle]!.view : dialView,
    hints: [`puzzle.${id}.h1`, `puzzle.${id}.h2`, `puzzle.${id}.h3`],
    hintsUsed,
    startMinute,
    act: opts.act ?? 1,
    reduceMotion: opts.reduceMotion ?? true,
    flicker: opts.flicker ?? false,
    has: (item) => items.includes(item),
    data: opts.data,
    t,
    onHint: () => (log.hints = Math.min(3, log.hints + 1)),
    onFinish: (r) => log.finished.push(r),
    onSaveData: (d) => log.saved.push(d),
    cue: (cueId) => log.cues.push(cueId),
  });
  return { log, frame };
}

export function switchLocale(locale: Locale, frame: FrameHandle): void {
  setLocale(locale);
  frame.rerender();
}
