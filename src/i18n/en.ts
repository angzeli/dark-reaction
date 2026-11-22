/**
 * English (British) string table. Split into modules by area; every module
 * has a 繁中 twin typed against its keys, so the compiler enforces parity.
 */
import { act1 } from './en/act1.ts';
import { act2 } from './en/act2.ts';
import { items } from './en/items.ts';
import { notebook } from './en/notebook.ts';
import { puzzles } from './en/puzzles.ts';
import { world } from './en/world.ts';
import { ui } from './en/ui.ts';

export const en = { ...ui, ...puzzles, ...world, ...act1, ...act2, ...notebook, ...items } as const;
export type Key = keyof typeof en;
