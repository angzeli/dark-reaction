/**
 * English (British) string table. Split into modules by area; every module
 * has a 繁中 twin typed against its keys, so the compiler enforces parity.
 */
import { act1 } from './en/act1.ts';
import { act2 } from './en/act2.ts';
import { act3 } from './en/act3.ts';
import { act3puzzles } from './en/act3puzzles.ts';
import { act2puzzles } from './en/act2puzzles.ts';
import { endings } from './en/endings.ts';
import { items } from './en/items.ts';
import { notebook } from './en/notebook.ts';
import { puzzles } from './en/puzzles.ts';
import { humour } from './en/humour.ts';
import { terminal } from './en/terminal.ts';
import { world } from './en/world.ts';
import { ui } from './en/ui.ts';

export const en = { ...ui, ...puzzles, ...world, ...act1, ...act2, ...act2puzzles, ...act3, ...act3puzzles, ...notebook, ...items, ...endings, ...humour, ...terminal } as const;
export type Key = keyof typeof en;
