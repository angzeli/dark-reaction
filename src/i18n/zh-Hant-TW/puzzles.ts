/** 謎題框架文字，以及各謎題的文字。國語、臺灣用法。 */
import type { puzzles as en } from '../en/puzzles.ts';

export const puzzles: Record<keyof typeof en, string> = {
  'puzzle.clock': '時間',
  'puzzle.hints.title': '提示',
  'puzzle.hint.button': '提示（{n}／3）',
  'puzzle.hint.none': '沒有更多提示了',
  'puzzle.hint.label': '{n}.',
  'puzzle.leave': '先離開',

  'puzzle.demo.title': '三轉盤密碼鎖',
  'puzzle.demo.intro': '三個黃銅轉盤，各從 0 到 9。旁邊的漆面上有人刻了 *2-4-1*。',
  'puzzle.demo.dial': '轉盤 {n}',
  'puzzle.demo.up': '把轉盤 {n} 往上轉',
  'puzzle.demo.down': '把轉盤 {n} 往下轉',
  'puzzle.demo.h1': '看看轉盤旁邊的漆面。',
  'puzzle.demo.h2': '刻上去的數字就是密碼，由左到右。',
  'puzzle.demo.h3': '把轉盤轉到 2、4、1。',
};
