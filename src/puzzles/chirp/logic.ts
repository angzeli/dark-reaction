/**
 * P8 · Cryocooler chirp (docs/DESIGN.md §11). The compressor's chirp has
 * become a rhythm: groups of chirps between long pauses, 2 · 4 · 1 · 3, over
 * and over, the panel's LED lighting with every chirp, so the pattern can be
 * seen as well as heard. Each group is a digit of the UPS panel's PIN.
 *
 * The timing is the audio module's (src/audio/chirp.ts), so the sound, the
 * LED and the tests all play one schedule.
 */
import { chirpSchedule } from '../../audio/chirp.ts';
import type { PuzzleLogic } from '../types.ts';

/** Her rhythm: the groups between the long pauses. */
export const PATTERN: readonly number[] = [2, 4, 1, 3];
/** The UPS panel's PIN, one digit per group. */
export const PIN = PATTERN.join('');
/** One cycle of the pattern: when each chirp starts (seconds), and how long before it repeats. */
export const SCHEDULE = chirpSchedule(PATTERN);
/** Which group each chirp in the schedule belongs to. */
export const GROUP_OF: readonly number[] = PATTERN.flatMap((n, g) => Array.from({ length: n }, () => g));

export type ChirpFeedback =
  | { kind: 'short' }
  | { kind: 'wrong'; rotated: boolean }
  | { kind: 'armed' };

export interface ChirpState {
  /** Digits keyed in so far (at most four). */
  entered: string;
  wrong: number;
  armed: boolean;
  last: ChirpFeedback | null;
}

export type ChirpMove = { type: 'digit'; digit: number } | { type: 'clear' } | { type: 'enter' };

/** Standing at the panel, counting, costs a minute; each wrong PIN another. */
export const LISTEN_MINUTES = 1;

/** The same digits starting from a different group: right rhythm, wrong place to start. */
const rotationOf = (entered: string) => entered.length === PIN.length && entered !== PIN && (PIN + PIN).includes(entered);

export type ChirpSave = Omit<ChirpState, 'last'>;
export const chirpSave = ({ last: _last, ...rest }: ChirpState): ChirpSave => rest;

export const chirpLogic: PuzzleLogic<ChirpState, ChirpMove> = {
  id: 'chirp',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof ChirpSave, unknown>>;
    const entered = typeof d.entered === 'string' && /^\d{0,4}$/.test(d.entered) ? d.entered : '';
    const wrong = typeof d.wrong === 'number' && Number.isFinite(d.wrong) ? Math.min(999, Math.max(0, Math.floor(d.wrong))) : 0;
    return { entered, wrong, armed: d.armed === true, last: null };
  },
  apply: (s, m) => {
    if (s.armed) return s;
    switch (m.type) {
      case 'digit':
        if (!Number.isInteger(m.digit) || m.digit < 0 || m.digit > 9 || s.entered.length >= PIN.length) return s;
        return { ...s, entered: s.entered + String(m.digit), last: null };
      case 'clear':
        return s.entered ? { ...s, entered: '', last: null } : s;
      case 'enter':
        if (s.entered.length < PIN.length) return { ...s, last: { kind: 'short' } };
        if (s.entered === PIN) return { ...s, armed: true, last: { kind: 'armed' } };
        return { ...s, entered: '', wrong: s.wrong + 1, last: { kind: 'wrong', rotated: rotationOf(s.entered) } };
    }
  },
  isSolved: (s) => s.armed,
  minutes: (s) => LISTEN_MINUTES + s.wrong,
  solution: (s) => (s.armed ? [] : [...(s.entered ? [{ type: 'clear' as const }] : []), ...[...PIN].map((c) => ({ type: 'digit' as const, digit: Number(c) })), { type: 'enter' as const }]),
};
