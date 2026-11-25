/**
 * State checks that come from docs/DESIGN.md rather than from the engine's
 * own rules: a solved puzzle stays solved where the design says it should
 * (§5 "Knowledge, not items, opens the game"; §11 shortcuts). Pure.
 */
import { Game } from '../../../src/engine/engine.ts';
import type { Cond, GameState } from '../../../src/engine/types.ts';
import { holds } from '../../../src/engine/conditions.ts';
import type { Finding } from './checks.ts';
import type { Model } from './model.ts';

/**
 * Each puzzle's shortcut (docs/DESIGN.md §11): once the puzzle is solved,
 * the choice that applies what you worked out, in the room and the moment
 * the design gives it. Puzzles whose shortcut is "the knowledge" have none.
 */
export const SHORTCUTS: Array<{ puzzle: string; scene: string; choice: string | string[]; when: Cond; note: string }> = [
  { puzzle: 'tlc', scene: 'synth.hub', choice: 'synth.combine', when: { not: { lflag: 'fractions.taken' } }, note: '"Combine 12–14 (1 min)"' },
  {
    puzzle: 'glovebox',
    scene: 'glovebox.hub',
    choice: ['glovebox.purge', 'glovebox.purge.late'],
    when: { item: 'item.vial' },
    note: '"Run the purge you worked out (9 min)", or its late version once the meter has won',
  },
  { puzzle: 'freezer', scene: 'cold.hub', choice: 'cold.e5', when: { not: { item: 'item.microsd' } }, note: '"Lift E5 (2 min)"' },
  {
    puzzle: 'schlenk',
    scene: 'synth.hub',
    choice: ['synth.kraken.again', 'synth.kraken.again.light'],
    when: { all: [{ act: 3 }, { item: 'item.tube.jy' }] },
    note: '"Fill her tube the way you did before (12 min)"',
  },
  { puzzle: 'chirp', scene: 'nmr.hub', choice: 'nmr.ups.again', when: { all: [{ act: 3 }, { not: { lflag: 'ups.armed' } }] }, note: 'key the PIN in again' },
];

/** A solved puzzle is never offered as a puzzle again, and its shortcut is there when the design says. */
export function solvedStaysSolved(model: Model, state: GameState): Finding[] {
  if (state.ending || state.puzzle) return [];
  const out: Finding[] = [];
  const visible = new Set(new Game(model.content, state).choices().map((c) => c.id));
  for (const id of visible) {
    const def = model.choices.get(id)?.choice;
    // A choice tagged `revisit` opens its solved puzzle on purpose (logging back in to the console, #205).
    if (def?.tags?.includes('revisit')) continue;
    for (const e of def?.effects ?? []) {
      if ('puzzle' in e && state.solved.includes(e.puzzle)) {
        out.push({ level: 'error', check: 'solved', sig: `solved|reopen|${id}`, message: `${id} opens ${e.puzzle} again although it is solved (${state.scene}, loop ${state.loop})` });
      }
    }
  }
  for (const s of SHORTCUTS) {
    if (state.scene !== s.scene || !state.solved.includes(s.puzzle) || !holds(s.when, state)) continue;
    const ids = Array.isArray(s.choice) ? s.choice : [s.choice];
    if (!ids.some((c) => visible.has(c))) {
      out.push({
        level: 'error',
        check: 'solved',
        sig: `solved|shortcut|${s.puzzle}`,
        message: `${s.puzzle} is solved but its shortcut (${s.note}) isn't offered in ${state.scene} at loop ${state.loop}, minute ${state.minute}`,
      });
    }
  }
  return out;
}

export const DESIGN_STATE_CHECKS = [solvedStaysSolved];
