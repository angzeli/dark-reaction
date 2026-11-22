/**
 * The contract every puzzle's logic must keep. Each puzzle's test file
 * calls this, so the validator and the bot can rely on `solution()`.
 */
import { expect } from 'vitest';
import type { PuzzleInit, PuzzleLogic } from '../../src/puzzles/types.ts';

export function checkPuzzleContract<S, M>(logic: PuzzleLogic<S, M>, init: PuzzleInit = { minute: 0, act: 1 }): void {
  const start = logic.init(init);
  const snapshot = JSON.stringify(start);
  expect(logic.isSolved(start), `${logic.id}: solved before any move`).toBe(false);
  const moves = logic.solution(start);
  expect(moves.length, `${logic.id}: the solution has moves`).toBeGreaterThan(0);
  let state = start;
  let minutes = logic.minutes(state);
  for (const move of moves) {
    const next = logic.apply(state, move);
    expect(logic.minutes(next), `${logic.id}: minutes never go backwards`).toBeGreaterThanOrEqual(minutes);
    minutes = logic.minutes(next);
    state = next;
  }
  expect(logic.isSolved(state), `${logic.id}: the known solution solves it`).toBe(true);
  expect(logic.isFailed?.(state) ?? false, `${logic.id}: solved is not failed`).toBe(false);
  expect(JSON.stringify(start), `${logic.id}: apply() must not mutate`).toBe(snapshot);
  // State must survive JSON (it is saved mid-puzzle).
  expect(JSON.parse(JSON.stringify(state))).toEqual(state);
}
