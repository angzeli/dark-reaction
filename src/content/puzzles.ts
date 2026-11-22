/** Puzzle definitions: par times, hints, what solving (or failing) does. docs/DESIGN.md §11. */
import type { PuzzleDef } from '../engine/types.ts';

const hints = (id: string): [string, string, string] => [`puzzle.${id}.h1`, `puzzle.${id}.h2`, `puzzle.${id}.h3`];

export const PUZZLE_DEFS: PuzzleDef[] = [
  {
    id: 'tlc',
    par: 2.5,
    hints: hints('tlc'),
    onSolve: [{ give: 'item.fractions' }, { lflag: 'fractions.taken' }, { learn: 'nb.tlc' }],
    solvedText: [{ key: 'puzzle.tlc.solved' }],
    leftText: [{ key: 'puzzle.tlc.left' }],
    margin: 'puzzle.tlc.margin',
  },
  {
    id: 'glovebox',
    par: 3,
    hints: hints('glovebox'),
    onSolve: [{ take: 'item.vial' }, { give: 'item.tube.own' }, { learn: 'nb.purge' }],
    onFail: [{ take: 'item.vial' }, { lflag: 'sample.ruined' }],
    solvedText: [{ key: 'puzzle.glovebox.solved' }],
    failedText: [{ key: 'puzzle.glovebox.failed' }],
    leftText: [{ key: 'puzzle.glovebox.left' }],
    margin: 'puzzle.glovebox.margin',
  },
  {
    id: 'console',
    par: 3,
    hints: hints('console'),
    onSolve: [{ learn: 'nb.queue.0333' }, { learn: 'nb.holder13' }],
    solvedText: [{ key: 'puzzle.console.solved' }],
    leftText: [{ key: 'puzzle.console.left' }],
    margin: 'puzzle.console.margin',
  },
  // ── Act II ──────────────────────────────────────────────────────────────
  {
    id: 'doorlog',
    par: 3.5,
    hints: hints('doorlog'),
    onSolve: [{ learn: 'nb.porter' }, { learn: 'nb.keeps' }, { fragment: 'yc.badge' }],
    solvedText: [{ key: 'puzzle.doorlog.solved' }],
    leftText: [{ key: 'puzzle.doorlog.left' }],
    margin: 'puzzle.doorlog.margin',
  },
  {
    id: 'cipher',
    par: 3,
    hints: hints('cipher'),
    onSolve: [{ learn: 'nb.cipher' }, { fragment: 'yc.notebook' }],
    solvedText: [{ key: 'puzzle.cipher.solved' }],
    leftText: [{ key: 'puzzle.cipher.left' }],
    margin: 'puzzle.cipher.margin',
  },
  {
    id: 'freezer',
    par: 3,
    hints: hints('freezer'),
    onSolve: [{ learn: 'nb.freezer' }, { give: 'item.microsd' }],
    // The alarm: the lid stays shut for the rest of the night.
    onFail: [{ lflag: 'freezer.alarm' }],
    solvedText: [{ key: 'puzzle.freezer.solved' }],
    failedText: [{ key: 'puzzle.freezer.failed' }],
    leftText: [{ key: 'puzzle.freezer.left' }],
    margin: 'puzzle.freezer.margin',
  },
];
