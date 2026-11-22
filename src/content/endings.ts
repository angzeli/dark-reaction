/**
 * The endings (docs/DESIGN.md §12): what triggers them lives in the scenes
 * and rules that offer them; this is how each one is told. All six
 * epilogues are written and checked here; an ending joins ENDINGS (and the
 * game) once its trigger exists: Dark Reaction with Act III's dark run.
 */
import { clockLabel } from '../engine/clock.ts';
import type { EndingDef, EndingId, TextRef } from '../engine/types.ts';

const at = (s: { minute: number }) => ({ clock: clockLabel(s.minute) });

const told = (id: EndingId, paragraphs: Array<string | TextRef>): TextRef[] =>
  paragraphs.map((p) => (typeof p === 'string' ? { key: `ending.${id}.${p}` } : p));

/** Paragraph by paragraph, with the lines that depend on what you did. */
export const EPILOGUES: Record<EndingId, TextRef[]> = {
  perfect: told('perfect', [
    { key: 'ending.perfect.1', params: at },
    '2',
    '3',
    '3b',
    '4',
    '5',
    '6',
    '6b',
    { key: 'ending.perfect.her', if: { know: 'nb.email' } },
    '7',
    '8',
  ]),
  honest: told('honest', [
    '1',
    { key: 'ending.honest.2', params: at },
    '3',
    '3b',
    '4',
    '5',
    '6',
    { key: 'ending.honest.struck', if: { fudgedEver: true } },
    { key: 'ending.honest.clean', if: { not: { fudgedEver: true } } },
    '7',
    '7b',
    '8',
  ]),
  clocking: told('clocking', ['1', '2', '3', '3b', '4', { key: 'ending.clocking.rain', if: { know: 'nb.rainlog' } }, '5', '6', '7', '8', '8b', '9']),
  infinite: told('infinite', ['1', '2', '2b', '3', '4', '4b', '5', '6', '6b', '7', '8', '8b', '9', '10', '11']),
  dark: told('dark', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
  fire: told('fire', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
};

const ending = (id: EndingId): EndingDef => ({
  id,
  title: `ending.${id}.title`,
  clue: `ending.${id}.clue`,
  art: `ending.${id}`,
  cue: `ending.${id}`,
  epilogue: EPILOGUES[id],
});

export const ENDINGS: EndingDef[] = (['perfect', 'honest', 'clocking', 'infinite', 'fire'] as const).map(ending);
