/**
 * P4 · −80 °C freezer box (docs/DESIGN.md §11). Rack 1 holds her box: a
 * 9 × 9 grid of cryovials (rows A–I, columns 1–9) under black, white and
 * red caps, with four notes pencilled inside the lid. Exactly one tube
 * keeps all four. Lifting a tube costs a minute and lets a degree of cold
 * out; at −74 °C the alarm goes and the lid has to shut for the night.
 */
import type { PuzzleLogic } from '../types.ts';

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export const SIZE = ROWS.length;
export type Cap = 'black' | 'white' | 'red';
/** A position such as "E5". */
export type Cell = string;

/**
 * The box, row by row: b black, w white, r red, . an empty slot. Tom
 * borrows from the edge, so most of the gaps are there. Red caps at A5, B8,
 * C3, D6, E5, F4, G3 and I1; black at C8, D7, G2 and G4.
 */
const BOX = ['.w.wr.w..', 'w.wwwwwr.', '.wrww.wbw', 'ww.wwrbw.', '.wwwrww.w', 'w.wrwwwww', '.brbw.ww.', 'ww.wwwww.', 'r..w.w.w.'] as const;
const CAPS: Record<string, Cap> = { b: 'black', w: 'white', r: 'red' };

export const cellAt = (row: number, col: number): Cell => `${ROWS[row]}${col + 1}`;
export const CELLS: readonly Cell[] = ROWS.flatMap((_, r) => Array.from({ length: SIZE }, (_, c) => cellAt(r, c)));

/** Row and column of a cell, both counted from 0, or null if it isn't one. */
export function coords(cell: unknown): { row: number; col: number } | null {
  if (typeof cell !== 'string') return null;
  const m = /^([A-I])([1-9])$/.exec(cell);
  return m ? { row: ROWS.indexOf(m[1] as (typeof ROWS)[number]), col: Number(m[2]) - 1 } : null;
}
export const isCell = (cell: unknown): cell is Cell => coords(cell) !== null;

export function capAt(cell: Cell): Cap | null {
  const p = coords(cell);
  return p ? (CAPS[BOX[p.row]![p.col]!] ?? null) : null;
}

/** The eight cells around a cell, corners included: "next to" on her lid. */
export function neighbours(cell: Cell): Cell[] {
  const p = coords(cell);
  if (!p) return [];
  const out: Cell[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = p.row + dr;
      const col = p.col + dc;
      if ((dr || dc) && row >= 0 && row < SIZE && col >= 0 && col < SIZE) out.push(cellAt(row, col));
    }
  }
  return out;
}

export const onEdge = (cell: Cell): boolean => {
  const p = coords(cell);
  return !!p && (p.row === 0 || p.col === 0 || p.row === SIZE - 1 || p.col === SIZE - 1);
};

/** Her four lid notes, as rules: not the edge, a red cap, no black cap around it, row (A = 1) + column = 10. */
export function keepsTheLid(cell: Cell): boolean {
  const p = coords(cell);
  if (!p || onEdge(cell) || capAt(cell) !== 'red') return false;
  if (neighbours(cell).some((n) => capAt(n) === 'black')) return false;
  return p.row + 1 + (p.col + 1) === 10;
}

/** Where the card is (E5): the one tube that keeps all four notes. */
export const ANSWER: Cell = CELLS.find(keepsTheLid)!;

export const START_TEMP = -80;
export const ALARM_TEMP = -74;
/** Lifts before the alarm: the sixth tube that isn't the card sets it off. */
export const LIFTS_TO_ALARM = ALARM_TEMP - START_TEMP;

/** What lifting a tube finds: Tom's tubes on the edge, her samples (black), stocks (white), references (red), and the card. */
export type Contents = 'tom' | 'sample' | 'stock' | 'ref' | 'card';
export function contents(cell: Cell): Contents | null {
  const cap = capAt(cell);
  if (!cap) return null;
  if (cell === ANSWER) return 'card';
  if (onEdge(cell)) return 'tom';
  return cap === 'black' ? 'sample' : cap === 'red' ? 'ref' : 'stock';
}

/** The code on her label, the same every time: e.g. CuD-31 (a sample), 0318-4 (a stock), REF-2. */
export function labelCode(cell: Cell): string {
  const p = coords(cell);
  if (!p) return '';
  const n = p.row * SIZE + p.col;
  const kind = contents(cell);
  if (kind === 'sample') return `CuD-${11 + ((n * 7) % 40)}`;
  if (kind === 'ref') return `REF-${1 + (n % 6)}`;
  const month = 1 + ((n * 5) % 12);
  const year = 16 + (n % 3);
  return `${String(month).padStart(2, '0')}${year}-${1 + (n % 7)}`;
}

export type FreezerEvent = { kind: 'lifted'; cell: Cell } | { kind: 'empty'; cell: Cell } | { kind: 'again'; cell: Cell } | { kind: 'none' };

export interface FreezerState {
  selected: Cell | null;
  /** Tubes lifted so far, in order. */
  lifted: Cell[];
  last: FreezerEvent | null;
}

export type FreezerMove = { type: 'select'; cell: Cell } | { type: 'lift' };

export const temperature = (s: FreezerState): number => START_TEMP + s.lifted.length;
const found = (s: FreezerState): boolean => s.lifted.includes(ANSWER);
const alarmed = (s: FreezerState): boolean => !found(s) && temperature(s) >= ALARM_TEMP;

/** What a reload needs to put the box back as it was. */
export type FreezerSave = Pick<FreezerState, 'selected' | 'lifted'>;
export const freezerSave = ({ selected, lifted }: FreezerState): FreezerSave => ({ selected, lifted });

export const freezerLogic: PuzzleLogic<FreezerState, FreezerMove> = {
  id: 'freezer',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof FreezerSave, unknown>>;
    const lifted: Cell[] = [];
    // Replay the saved lifts, stopping where the attempt would have ended.
    for (const cell of Array.isArray(d.lifted) ? d.lifted : []) {
      if (!isCell(cell) || !capAt(cell) || lifted.includes(cell)) continue;
      lifted.push(cell);
      if (cell === ANSWER || lifted.length >= LIFTS_TO_ALARM) break;
    }
    return { selected: isCell(d.selected) ? d.selected : null, lifted, last: null };
  },
  apply: (s, m) => {
    if (found(s) || alarmed(s)) return s;
    if (m.type === 'select') return isCell(m.cell) ? { ...s, selected: m.cell, last: null } : s;
    const cell = s.selected;
    if (!cell) return { ...s, last: { kind: 'none' } };
    if (!capAt(cell)) return { ...s, last: { kind: 'empty', cell } };
    if (s.lifted.includes(cell)) return { ...s, last: { kind: 'again', cell } };
    return { ...s, lifted: [...s.lifted, cell], last: { kind: 'lifted', cell } };
  },
  isSolved: found,
  isFailed: alarmed,
  minutes: (s) => s.lifted.length,
  solution: (s) => (found(s) ? [] : [...(s.selected === ANSWER ? [] : [{ type: 'select' as const, cell: ANSWER }]), { type: 'lift' as const }]),
};
