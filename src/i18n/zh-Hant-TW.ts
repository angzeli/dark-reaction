/** 繁體中文（臺灣）字串表。各模組的鍵與英文版一一對應，由型別檢查把關。 */
import type { Key } from './en.ts';
import { act1 } from './zh-Hant-TW/act1.ts';
import { act2 } from './zh-Hant-TW/act2.ts';
import { act3 } from './zh-Hant-TW/act3.ts';
import { items } from './zh-Hant-TW/items.ts';
import { notebook } from './zh-Hant-TW/notebook.ts';
import { puzzles } from './zh-Hant-TW/puzzles.ts';
import { world } from './zh-Hant-TW/world.ts';
import { ui } from './zh-Hant-TW/ui.ts';

export const zhHantTW: Record<Key, string> = { ...ui, ...puzzles, ...world, ...act1, ...act2, ...act3, ...notebook, ...items };
