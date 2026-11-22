/**
 * The puzzle contract (docs/DESIGN.md §11). Every puzzle is two halves:
 *
 * - `logic`: pure and DOM-free. State, moves, solved/failed, in-game
 *   minutes spent, and a known solution so the validator and the
 *   Playwright bot can solve it without guessing.
 * - `view`: renders the logic state inside the shared puzzle frame
 *   (src/puzzles/frame.ts), forwards input as moves, and re-renders on a
 *   language switch without losing state.
 *
 * Hints (three tiers) and par times live in the content's PuzzleDef; the
 * frame shows them. Later-loop shortcuts are ordinary content choices with
 * `if: { solved: '<id>' }`.
 */
import type { Act } from '../engine/types.ts';
import type { Params } from '../i18n/i18n.ts';

export interface PuzzleInit {
  /** Loop minute when the puzzle opened (0 = 02:47). */
  minute: number;
  act: Act;
  /** Saved in-progress data, if the player reloaded mid-puzzle. */
  data?: unknown;
}

export interface PuzzleLogic<S, M> {
  id: string;
  init(ctx: PuzzleInit): S;
  /** Pure: returns the next state (never mutates). Illegal moves return the state unchanged or a failed state. */
  apply(state: S, move: M): S;
  isSolved(state: S): boolean;
  /** Optional: the attempt is over and cannot be solved this time (e.g. the sample oxidised). */
  isFailed?(state: S): boolean;
  /** In-game minutes this attempt has cost so far. */
  minutes(state: S): number;
  /** A sequence of moves that solves the puzzle from `state` (used by the bot and the validator). */
  solution(state: S): M[];
}

/** What the frame gives a view. */
export interface PuzzleApi {
  readonly startMinute: number;
  readonly act: Act;
  readonly reduceMotion: boolean;
  t(key: string, params?: Params): string;
  /** Report in-game minutes spent so far; the frame moves the clock (and ends the puzzle at 03:33). */
  setMinutes(total: number): void;
  /**
   * The puzzle is over. `solved`, or failed outright for this loop when
   * `failed` is set (the attempt is spoiled: e.g. the sample oxidised).
   * Stepping away is the frame's job, not the view's.
   */
  finish(solved: boolean, failed?: boolean): void;
  /** Persist in-progress data so a reload (or a language switch) keeps it. */
  saveData(data: unknown): void;
  /** Play an audio cue if sound is on. */
  cue(id: 'solve' | 'fail' | 'hint' | 'chirp'): void;
}

export interface PuzzleViewHandle {
  /** Re-render all text (after a language switch). */
  rerender(): void;
  destroy(): void;
}

export interface PuzzleView {
  /** Mount into `host` (the frame's body). `data` is saved progress, if any. */
  mount(host: HTMLElement, api: PuzzleApi, data?: unknown): PuzzleViewHandle;
}

export interface PuzzleModule {
  // The logic's generics are erased at the registry boundary.
  logic: PuzzleLogic<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  view: PuzzleView;
}
