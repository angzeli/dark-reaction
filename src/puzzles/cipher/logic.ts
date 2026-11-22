/**
 * P7 · Notebook cipher (docs/DESIGN.md §11). The last page of her notebook
 * hides where the real data is. The two languages are separate originals
 * with the same answer, and each keeps its own progress, so switching
 * language half-way never spoils either:
 *
 * - English: "88 74 · 49 · 88 6 19 · 8 10". Atomic numbers; put each
 *   element's symbol in its gap from the periodic table inside the back
 *   cover: Ra W · In · Ra C K · O Ne, RAW IN RACK ONE.
 * - 繁中：「鉈 · 氡 鈉 · 鉀」 and a sticky note, 「偏旁拿掉就好。」 Choose a
 *   character, then the radical to take off: 它 · 冬內 · 甲, it is inside
 *   winter (the freezer), rack 甲 (one).
 *
 * Solving either version solves the puzzle. Wrong picks are refused and,
 * gently, cost time: a minute for every second one.
 */
import type { PuzzleLogic } from '../types.ts';

/** Symbols by atomic number (index = Z − 1). */
export const ELEMENTS: readonly string[] = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
];
export const symbolOf = (z: number): string => ELEMENTS[z - 1] ?? '';
export const isElement = (z: unknown): z is number => typeof z === 'number' && Number.isInteger(z) && z >= 1 && z <= ELEMENTS.length;

/**
 * Where an element sits on the printed table: periods 1–7 in rows 1–7,
 * groups 1–18 in columns 1–18; the lanthanides (57–71) and actinides
 * (89–103) in rows 9 and 10, under groups 3–17.
 */
export function position(z: number): { row: number; col: number } {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  if (z <= 4) return { row: 2, col: z - 2 };
  if (z <= 10) return { row: 2, col: z + 8 };
  if (z <= 12) return { row: 3, col: z - 10 };
  if (z <= 18) return { row: 3, col: z };
  if (z <= 36) return { row: 4, col: z - 18 };
  if (z <= 54) return { row: 5, col: z - 36 };
  if (z <= 56) return { row: 6, col: z - 54 };
  if (z <= 71) return { row: 9, col: z - 54 };
  if (z <= 86) return { row: 6, col: z - 68 };
  if (z <= 88) return { row: 7, col: z - 86 };
  if (z <= 103) return { row: 10, col: z - 86 };
  return { row: 7, col: z - 100 };
}

// ── English ────────────────────────────────────────────────────────────────

/** "If anyone reads this: 88 74 · 49 · 88 6 19 · 8 10" */
export const EN_LINE: readonly number[] = [88, 74, 49, 88, 6, 19, 8, 10];
/** How many numbers in each word, between her dots. */
export const EN_GROUPS: readonly number[] = [2, 1, 3, 2];

// ── 繁中 ───────────────────────────────────────────────────────────────────

export type Radical = 'metal' | 'stone' | 'gas' | 'water';
/** The four radicals Chinese element names are built from: metals 金, solid non-metals 石, gases 气, liquids 氵. */
export const RADICALS: readonly Radical[] = ['metal', 'stone', 'gas', 'water'];
export const RADICAL_GLYPH: Record<Radical, string> = { metal: '金', stone: '石', gas: '气', water: '氵' };
/** 「真的那份：鉈 · 氡 鈉 · 鉀」 */
export const ZH_LINE: ReadonlyArray<{ char: string; radical: Radical; rest: string }> = [
  { char: '鉈', radical: 'metal', rest: '它' },
  { char: '氡', radical: 'gas', rest: '冬' },
  { char: '鈉', radical: 'metal', rest: '內' },
  { char: '鉀', radical: 'metal', rest: '甲' },
];
export const ZH_GROUPS: readonly number[] = [1, 2, 1];

// ── State ──────────────────────────────────────────────────────────────────

export type EnFeedback = { kind: 'right'; slot: number; z: number } | { kind: 'wrong'; slot: number; z: number } | { kind: 'filled'; slot: number };
export type ZhFeedback = { kind: 'right'; char: number; radical: Radical } | { kind: 'wrong'; char: number; radical: Radical } | { kind: 'stripped'; char: number };

export interface EnState {
  filled: boolean[];
  /** The gap the next element goes into. */
  slot: number;
  wrong: number;
  last: EnFeedback | null;
}
export interface ZhState {
  stripped: boolean[];
  /** The character the next radical comes off. */
  char: number;
  wrong: number;
  last: ZhFeedback | null;
}
export interface CipherState {
  en: EnState;
  zh: ZhState;
}

export type CipherMove =
  | { v: 'en'; type: 'slot'; slot: number }
  | { v: 'en'; type: 'pick'; z: number }
  | { v: 'zh'; type: 'char'; char: number }
  | { v: 'zh'; type: 'strip'; radical: Radical };

/** Making sense of the page takes a couple of minutes; every second wrong pick, one more. */
export const READING_MINUTES = 2;

export const enDone = (s: CipherState): boolean => s.en.filled.every(Boolean);
export const zhDone = (s: CipherState): boolean => s.zh.stripped.every(Boolean);

/** The next gap still open after `from` (wrapping), or `from` if none is. */
function nextOpen(done: readonly boolean[], from: number): number {
  for (let k = 1; k <= done.length; k++) {
    const i = (from + k) % done.length;
    if (!done[i]) return i;
  }
  return from;
}

const flags = (v: unknown, n: number): boolean[] => Array.from({ length: n }, (_, i) => Array.isArray(v) && v[i] === true);
const index = (v: unknown, n: number): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n ? v : null);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(999, Math.max(0, Math.floor(v))) : 0);
const firstOpen = (done: readonly boolean[]) => Math.max(0, done.indexOf(false));
const record = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

/** What a reload needs: both versions, each exactly as far as it got. */
export interface CipherSave {
  en: Omit<EnState, 'last'>;
  zh: Omit<ZhState, 'last'>;
}
export const cipherSave = (s: CipherState): CipherSave => ({
  en: { filled: s.en.filled, slot: s.en.slot, wrong: s.en.wrong },
  zh: { stripped: s.zh.stripped, char: s.zh.char, wrong: s.zh.wrong },
});

export const cipherLogic: PuzzleLogic<CipherState, CipherMove> = {
  id: 'cipher',
  init: (ctx) => {
    const d = record(ctx.data);
    const en = record(d['en']);
    const zh = record(d['zh']);
    const filled = flags(en['filled'], EN_LINE.length);
    const stripped = flags(zh['stripped'], ZH_LINE.length);
    return {
      en: { filled, slot: index(en['slot'], EN_LINE.length) ?? firstOpen(filled), wrong: count(en['wrong']), last: null },
      zh: { stripped, char: index(zh['char'], ZH_LINE.length) ?? firstOpen(stripped), wrong: count(zh['wrong']), last: null },
    };
  },
  apply: (s, m) => {
    if (enDone(s) || zhDone(s)) return s;
    if (m.v === 'en') {
      const en = s.en;
      if (m.type === 'slot') return index(m.slot, EN_LINE.length) === null ? s : { ...s, en: { ...en, slot: m.slot, last: null } };
      if (!isElement(m.z)) return s;
      if (en.filled[en.slot]) return { ...s, en: { ...en, last: { kind: 'filled', slot: en.slot } } };
      if (m.z !== EN_LINE[en.slot]) return { ...s, en: { ...en, wrong: en.wrong + 1, last: { kind: 'wrong', slot: en.slot, z: m.z } } };
      const filled = en.filled.map((f, i) => f || i === en.slot);
      return { ...s, en: { ...en, filled, slot: nextOpen(filled, en.slot), last: { kind: 'right', slot: en.slot, z: m.z } } };
    }
    const zh = s.zh;
    if (m.type === 'char') return index(m.char, ZH_LINE.length) === null ? s : { ...s, zh: { ...zh, char: m.char, last: null } };
    if (!RADICALS.includes(m.radical)) return s;
    if (zh.stripped[zh.char]) return { ...s, zh: { ...zh, last: { kind: 'stripped', char: zh.char } } };
    if (m.radical !== ZH_LINE[zh.char]!.radical) return { ...s, zh: { ...zh, wrong: zh.wrong + 1, last: { kind: 'wrong', char: zh.char, radical: m.radical } } };
    const stripped = zh.stripped.map((f, i) => f || i === zh.char);
    return { ...s, zh: { ...zh, stripped, char: nextOpen(stripped, zh.char), last: { kind: 'right', char: zh.char, radical: m.radical } } };
  },
  isSolved: (s) => enDone(s) || zhDone(s),
  minutes: (s) => READING_MINUTES + Math.floor((s.en.wrong + s.zh.wrong) / 2),
  solution: (s) => {
    if (enDone(s) || zhDone(s)) return [];
    return EN_LINE.flatMap((z, slot): CipherMove[] => (s.en.filled[slot] ? [] : [{ v: 'en', type: 'slot', slot }, { v: 'en', type: 'pick', z }]));
  },
};
