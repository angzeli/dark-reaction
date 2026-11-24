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
  // ── Act III ─────────────────────────────────────────────────────────────
  {
    id: 'schlenk',
    // Three purges now (#125): four more moves than the one it was.
    par: 3.5,
    hints: hints('schlenk'),
    onSolve: [{ take: 'item.tube.jy' }, { give: 'item.tube.dark' }, { learn: 'nb.schlenk' }],
    // Without foil, the filled tube sits in the lab light: spoiled for the night.
    onFail: [{ take: 'item.tube.jy' }, { lflag: 'tube.spoiled' }],
    solvedText: [{ key: 'puzzle.schlenk.solved' }],
    failedText: [{ key: 'puzzle.schlenk.failed' }],
    leftText: [{ key: 'puzzle.schlenk.left' }],
    margin: 'puzzle.schlenk.margin',
  },
  {
    id: 'chirp',
    par: 2.5,
    hints: hints('chirp'),
    // Armed for tonight; later nights key the PIN in again (nmr.ups.again).
    onSolve: [{ learn: 'nb.ups' }, { lflag: 'ups.armed' }],
    solvedText: [{ key: 'puzzle.chirp.solved' }],
    leftText: [{ key: 'puzzle.chirp.left' }],
    margin: 'puzzle.chirp.margin',
  },
  {
    id: 'fabrication',
    par: 3,
    hints: hints('fabrication'),
    onSolve: [{ learn: 'nb.fabrication' }],
    solvedText: [{ key: 'puzzle.fabrication.solved' }],
    leftText: [{ key: 'puzzle.fabrication.left' }],
    margin: 'puzzle.fabrication.margin',
  },
  {
    // Opens at 03:33 in the dark run (LIGHTS_OUT, lo.dark.run); nothing in the rooms opens it.
    id: 'peakmatch',
    par: 2,
    hints: hints('peakmatch'),
    onSolve: [{ learn: 'nb.peak' }, { ending: 'dark' }],
    solvedText: [{ key: 'puzzle.peakmatch.solved' }],
    leftText: [{ key: 'puzzle.peakmatch.left' }],
    // Stepping away here ends the night, and the whole setup with it (#71).
    leave: 'puzzle.peakmatch.leave',
    margin: 'puzzle.peakmatch.margin',
  },
];
