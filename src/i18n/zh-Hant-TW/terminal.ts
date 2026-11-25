/** 控制台的隱藏指令（docs/HUMOUR.md §5）。軟體的輸出照軟體原樣，需要時再加一行註解。 */
import type { terminal as en } from '../en/terminal.ts';

export const terminal: Record<keyof typeof en, string> = {};
