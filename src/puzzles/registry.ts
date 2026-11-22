/** Puzzle modules (logic + view) by id, for the UI. */
import { cipherView } from './cipher/view.ts';
import { consoleView } from './console/view.ts';
import { doorlogView } from './doorlog/view.ts';
import { freezerView } from './freezer/view.ts';
import { gloveboxView } from './glovebox/view.ts';
import { PUZZLE_LOGIC } from './logic.ts';
import { tlcView } from './tlc/view.ts';
import type { PuzzleModule, PuzzleView } from './types.ts';

const VIEWS: Record<string, PuzzleView> = {
  tlc: tlcView,
  glovebox: gloveboxView,
  console: consoleView,
  freezer: freezerView,
  doorlog: doorlogView,
  cipher: cipherView,
};

export const PUZZLES: Record<string, PuzzleModule> = Object.fromEntries(
  Object.entries(VIEWS).map(([id, view]) => [id, { logic: PUZZLE_LOGIC[id]!, view }]),
);
