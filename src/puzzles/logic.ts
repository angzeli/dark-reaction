/**
 * Puzzle logic by id, with no DOM. The validator, unit tests and the route
 * simulator solve puzzles through these; the UI registry (registry.ts)
 * pairs each with its view.
 */
import { consoleLogic } from './console/logic.ts';
import { gloveboxLogic } from './glovebox/logic.ts';
import { tlcLogic } from './tlc/logic.ts';
import type { PuzzleLogic } from './types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PUZZLE_LOGIC: Record<string, PuzzleLogic<any, any>> = {
  tlc: tlcLogic,
  glovebox: gloveboxLogic,
  console: consoleLogic,
};
