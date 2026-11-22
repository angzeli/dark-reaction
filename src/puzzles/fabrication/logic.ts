/**
 * P9 · The too-perfect spectrum (docs/DESIGN.md §11). The 03:25 printout
 * beside your own spectrum and Figure 3 of the 2020 paper, all drawn from
 * src/puzzles/spectra.ts. Mark what gives the printout away. Five tells:
 * its noise is Figure 3's, point for point (only visible with the printout
 * laid over the figure, and required); no solvent peak at 7.16; no ¹³C
 * satellites; an integral of exactly 1.000 on a dead-flat baseline; and an
 * acquisition time of 03:33, tonight. The noise and any two others solve
 * it. Marking something innocent costs nothing; it is only noted.
 */
import type { PuzzleLogic } from '../types.ts';

export type Tell = 'noise' | 'solvent' | 'satellites' | 'integral' | 'acquired';
export type Decoy = 'peak' | 'coffee';
export type Feature = Tell | Decoy;

export const TELLS: readonly Tell[] = ['noise', 'solvent', 'satellites', 'integral', 'acquired'];
export const DECOYS: readonly Decoy[] = ['peak', 'coffee'];
/** Tells needed besides the noise. */
export const OTHERS_NEEDED = 2;

const isTell = (f: unknown): f is Tell => TELLS.includes(f as Tell);
const isDecoy = (f: unknown): f is Decoy => DECOYS.includes(f as Decoy);

export type FabricationFeedback =
  | { kind: 'marked'; feature: Tell }
  | { kind: 'unmarked'; feature: Tell }
  | { kind: 'decoy'; feature: Decoy }
  /** The noise only gives itself away laid over Figure 3. */
  | { kind: 'overlayFirst' }
  | { kind: 'overlay'; on: boolean };

export interface FabricationState {
  /** The printout laid over Figure 3. */
  overlay: boolean;
  marked: Tell[];
  /** Innocent things marked (and only noted). */
  noted: number;
  last: FabricationFeedback | null;
}

export type FabricationMove = { type: 'overlay' } | { type: 'mark'; feature: Feature };

/** Laying three spectra side by side and reading them costs a couple of minutes. */
export const READING_MINUTES = 2;

const solved = (s: FabricationState) => s.marked.includes('noise') && s.marked.filter((t) => t !== 'noise').length >= OTHERS_NEEDED;

export type FabricationSave = Omit<FabricationState, 'last'>;
export const fabricationSave = ({ last: _last, ...rest }: FabricationState): FabricationSave => rest;

export const fabricationLogic: PuzzleLogic<FabricationState, FabricationMove> = {
  id: 'fabrication',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof FabricationSave, unknown>>;
    const marked = Array.isArray(d.marked) ? TELLS.filter((t) => (d.marked as unknown[]).includes(t)) : [];
    const noted = typeof d.noted === 'number' && Number.isFinite(d.noted) ? Math.min(999, Math.max(0, Math.floor(d.noted))) : 0;
    return { overlay: d.overlay === true, marked, noted, last: null };
  },
  apply: (s, m) => {
    if (solved(s)) return s;
    if (m.type === 'overlay') return { ...s, overlay: !s.overlay, last: { kind: 'overlay', on: !s.overlay } };
    if (isDecoy(m.feature)) return { ...s, noted: s.noted + 1, last: { kind: 'decoy', feature: m.feature } };
    if (!isTell(m.feature)) return s;
    if (m.feature === 'noise' && !s.overlay && !s.marked.includes('noise')) return { ...s, last: { kind: 'overlayFirst' } };
    const feature = m.feature;
    return s.marked.includes(feature)
      ? { ...s, marked: s.marked.filter((t) => t !== feature), last: { kind: 'unmarked', feature } }
      : { ...s, marked: TELLS.filter((t) => t === feature || s.marked.includes(t)), last: { kind: 'marked', feature } };
  },
  isSolved: solved,
  minutes: () => READING_MINUTES,
  solution: (s) => {
    if (solved(s)) return [];
    const moves: FabricationMove[] = [];
    if (!s.marked.includes('noise')) {
      if (!s.overlay) moves.push({ type: 'overlay' });
      moves.push({ type: 'mark', feature: 'noise' });
    }
    const others = s.marked.filter((t) => t !== 'noise').length;
    for (const t of (['solvent', 'satellites', 'integral', 'acquired'] as const).filter((x) => !s.marked.includes(x)).slice(0, Math.max(0, OTHERS_NEEDED - others))) {
      moves.push({ type: 'mark', feature: t });
    }
    return moves;
  },
};
