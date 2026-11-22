/** 繁體中文（臺灣）字串表。各模組的鍵與英文版一一對應，由型別檢查把關。 */
import type { Key } from './en.ts';
import { ui } from './zh-Hant-TW/ui.ts';

export const zhHantTW: Record<Key, string> = { ...ui };
