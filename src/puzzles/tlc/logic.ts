/**
 * P3 · TLC plate (docs/DESIGN.md §11). Measure the spots, find the product
 * (Rf 0.35, from your notebook), and combine only the fractions where it
 * runs alone. Lane 11 hides a spot that only shows under the UV lamp.
 */
import type { PuzzleLogic } from '../types.ts';

export type Compound = 'A' | 'P' | 'B' | 'C';
export type Lane = 'crude' | 10 | 11 | 12 | 13 | 14 | 15 | 16;

/** Plate geometry in centimetres from the bottom edge. */
export const PLATE = { height: 8, baseline: 1, front: 7 } as const;
export const RUN = PLATE.front - PLATE.baseline;

export const COMPOUNDS: Record<Compound, { rf: number; uvOnly: boolean }> = {
  A: { rf: 0.15, uvOnly: false },
  P: { rf: 0.35, uvOnly: false },
  B: { rf: 0.55, uvOnly: true },
  C: { rf: 0.8, uvOnly: false },
};

export const LANES: readonly Lane[] = ['crude', 10, 11, 12, 13, 14, 15, 16];
export const FRACTIONS = [10, 11, 12, 13, 14, 15, 16] as const;
export type Fraction = (typeof FRACTIONS)[number];

/** Least polar first off the column: C, then B, then the product, then A. */
export const CONTENTS: Record<Lane, Compound[]> = {
  crude: ['C', 'B', 'P', 'A'],
  10: ['C', 'B'],
  11: ['B', 'P'],
  12: ['P'],
  13: ['P'],
  14: ['P'],
  15: ['P', 'A'],
  16: ['A'],
};

export const PURE = [12, 13, 14] as const;

/** Distance travelled from the baseline, in cm, to one decimal place. */
export const distance = (c: Compound): number => Math.round(COMPOUNDS[c].rf * RUN * 10) / 10;
export const visibleSpots = (lane: Lane, uv: boolean): Compound[] => CONTENTS[lane].filter((c) => uv || !COMPOUNDS[c].uvOnly);

export type TlcFeedback =
  | { kind: 'empty' }
  | { kind: 'noProduct'; lane: Fraction }
  | { kind: 'impure'; lane: Fraction; uv: boolean }
  | { kind: 'wasteful'; lane: Fraction }
  | { kind: 'measured'; lane: Lane; compound: Compound; cm: number; rf: number };

export interface TlcState {
  uv: boolean;
  selected: Fraction[];
  wrong: number;
  solved: boolean;
  feedback: TlcFeedback | null;
}

export type TlcMove = { type: 'uv' } | { type: 'toggle'; lane: Fraction } | { type: 'measure'; lane: Lane; compound: Compound } | { type: 'combine' };

const READING_MINUTES = 2;

export const tlcLogic: PuzzleLogic<TlcState, TlcMove> = {
  id: 'tlc',
  init: (ctx) => {
    const saved = ctx.data as Partial<TlcState> | undefined;
    return {
      uv: saved?.uv === true,
      selected: Array.isArray(saved?.selected)
        ? [...new Set(saved.selected.filter((l): l is Fraction => (FRACTIONS as readonly number[]).includes(l)))].sort((a, b) => a - b)
        : [],
      wrong: typeof saved?.wrong === 'number' && Number.isFinite(saved.wrong) ? Math.min(999, Math.max(0, Math.floor(saved.wrong))) : 0,
      solved: false,
      feedback: null,
    };
  },
  apply: (s, m) => {
    if (s.solved) return s;
    switch (m.type) {
      case 'uv':
        return { ...s, uv: !s.uv, feedback: null };
      case 'toggle': {
        const selected = s.selected.includes(m.lane) ? s.selected.filter((l) => l !== m.lane) : [...s.selected, m.lane].sort((a, b) => a - b);
        return { ...s, selected, feedback: null };
      }
      case 'measure': {
        if (!visibleSpots(m.lane, s.uv).includes(m.compound)) return s;
        const cm = distance(m.compound);
        return { ...s, feedback: { kind: 'measured', lane: m.lane, compound: m.compound, cm, rf: Math.round((cm / RUN) * 100) / 100 } };
      }
      case 'combine': {
        if (s.selected.length === 0) return { ...s, feedback: { kind: 'empty' } };
        const noProduct = s.selected.find((l) => !CONTENTS[l].includes('P'));
        if (noProduct !== undefined) return { ...s, wrong: s.wrong + 1, feedback: { kind: 'noProduct', lane: noProduct } };
        const impure = s.selected.find((l) => CONTENTS[l].length > 1);
        if (impure !== undefined) return { ...s, wrong: s.wrong + 1, feedback: { kind: 'impure', lane: impure, uv: s.uv } };
        const missing = PURE.find((l) => !s.selected.includes(l));
        if (missing !== undefined) return { ...s, wrong: s.wrong + 1, feedback: { kind: 'wasteful', lane: missing } };
        return { ...s, solved: true, feedback: null };
      }
    }
  },
  isSolved: (s) => s.solved,
  minutes: (s) => READING_MINUTES + s.wrong,
  solution: (s) => {
    const moves: TlcMove[] = [];
    if (!s.uv) moves.push({ type: 'uv' });
    for (const l of s.selected) if (!(PURE as readonly number[]).includes(l)) moves.push({ type: 'toggle', lane: l });
    for (const l of PURE) if (!s.selected.includes(l)) moves.push({ type: 'toggle', lane: l });
    moves.push({ type: 'combine' });
    return moves;
  },
};
