/**
 * P10 · Peak match in the dark (docs/DESIGN.md §11). 03:33, and the only
 * light is the console on the UPS: her tube's spectrum, green on black,
 * beside her reference from the microSD. The spectrum is unreferenced, so
 * everything sits 0.23 ppm low. Nudge the axis until the solvent's
 * residual peak reads 7.16 ppm, then pick the peak that matches hers: the
 * small one at 8.41 with a satellite either side, not the bare impurity at
 * 8.19.
 *
 * The clock has stopped at 03:33, so this costs no minutes (and the view
 * never reports any).
 */
import { DARK, DARK_SHIFT, DECOY_PPM, PRODUCT_PPM, SOLVENT_PPM } from '../spectra.ts';
import type { PuzzleLogic } from '../types.ts';

export type PeakId = 'product' | 'decoy' | 'solvent' | 'bump';

/** The peaks you can pick, by where they truly are. */
export const PEAKS: ReadonlyArray<{ id: PeakId; ppm: number }> = [
  { id: 'product', ppm: PRODUCT_PPM },
  { id: 'decoy', ppm: DECOY_PPM },
  { id: 'solvent', ppm: SOLVENT_PPM },
  { id: 'bump', ppm: 6.9 },
];
/** The referencing offset that puts the solvent at 7.16, in hundredths of a ppm (+0.23). */
export const ANSWER_OFFSET = Math.round(-DARK_SHIFT * 100);
/** How far the axis can be nudged either way, in hundredths of a ppm. */
export const OFFSET_LIMIT = 100;

/** Where a peak reads on the axis with `offset` (hundredths of a ppm) applied. */
export const shown = (peak: PeakId, offset: number): number => {
  const p = PEAKS.find((x) => x.id === peak)!;
  return Math.round((p.ppm + (DARK.shift ?? 0)) * 100 + offset) / 100;
};

export type PeakFeedback =
  | { kind: 'axis'; peak: PeakId }
  | { kind: 'solvent' }
  | { kind: 'decoy' }
  | { kind: 'bump' }
  | { kind: 'found' };

export interface PeakState {
  /** Referencing applied, in hundredths of a ppm. */
  offset: number;
  wrong: number;
  found: boolean;
  last: PeakFeedback | null;
}

export type PeakMove = { type: 'nudge'; by: number } | { type: 'pick'; peak: PeakId };

const clamp = (n: number) => Math.max(-OFFSET_LIMIT, Math.min(OFFSET_LIMIT, Math.round(n)));

export type PeakSave = Omit<PeakState, 'last'>;
export const peakSave = ({ last: _last, ...rest }: PeakState): PeakSave => rest;

export const peakmatchLogic: PuzzleLogic<PeakState, PeakMove> = {
  id: 'peakmatch',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof PeakSave, unknown>>;
    const offset = typeof d.offset === 'number' && Number.isFinite(d.offset) ? clamp(d.offset) : 0;
    const wrong = typeof d.wrong === 'number' && Number.isFinite(d.wrong) ? Math.min(999, Math.max(0, Math.floor(d.wrong))) : 0;
    return { offset, wrong, found: d.found === true, last: null };
  },
  apply: (s, m) => {
    if (s.found) return s;
    if (m.type === 'nudge') {
      if (!Number.isFinite(m.by)) return s;
      const offset = clamp(s.offset + m.by);
      return offset === s.offset ? s : { ...s, offset, last: null };
    }
    if (!PEAKS.some((p) => p.id === m.peak)) return s;
    if (s.offset !== ANSWER_OFFSET) return { ...s, wrong: s.wrong + 1, last: { kind: 'axis', peak: m.peak } };
    if (m.peak === 'product') return { ...s, found: true, last: { kind: 'found' } };
    return { ...s, wrong: s.wrong + 1, last: { kind: m.peak } };
  },
  isSolved: (s) => s.found,
  minutes: () => 0,
  solution: (s) => {
    if (s.found) return [];
    const moves: PeakMove[] = [];
    let gap = ANSWER_OFFSET - s.offset;
    while (Math.abs(gap) >= 10) {
      const by = Math.sign(gap) * 10;
      moves.push({ type: 'nudge', by });
      gap -= by;
    }
    while (gap !== 0) {
      const by = Math.sign(gap);
      moves.push({ type: 'nudge', by });
      gap -= by;
    }
    moves.push({ type: 'pick', peak: 'product' });
    return moves;
  },
};
