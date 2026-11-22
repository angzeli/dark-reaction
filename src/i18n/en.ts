/**
 * English (British) string table. Split into modules by area; every module
 * has a 繁中 twin typed against its keys, so the compiler enforces parity.
 */
import { puzzles } from './en/puzzles.ts';
import { ui } from './en/ui.ts';

export const en = { ...ui, ...puzzles } as const;
export type Key = keyof typeof en;
