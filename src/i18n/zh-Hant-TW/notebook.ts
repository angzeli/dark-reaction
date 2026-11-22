/** 筆記本內容，用你的口吻。國語、臺灣用法。CC BY-NC-SA 4.0。 */
import type { notebook as en } from '../en/notebook.ts';

export const notebook: Record<keyof typeof en, string> = {
  'nb.tlc.title': '收集液',
  'nb.tlc.body': '產物（Rf 0.35）只在第 12–14 管是乾淨的。第 11 管藏著一個只有 UV 下才看得到的斑點；第 15 管有一個跑得比較慢的。',
  'nb.purge.title': '前艙',
  'nb.purge.body': '抽真空、回填要三次，不是兩次。在 SOP 上用鉛筆簽 YCL 的那個人是對的。箱子的氧氣大約 03:28 會超過 10 ppm，所以要在 03:18 前開始抽灌。',
  'nb.queue.0333.title': '03:33 的預約',
  'nb.queue.0333.body': '樣品槽 13，PROTON_DARK，掃一次。使用者：我。預約和送出的時間都是今晚 03:33，而那還沒發生。優先權：設施覆寫。備註：「它還在反應」。',
  'nb.holder13.title': '樣品槽 13',
  'nb.holder13.body': '空的。不管 03:33 要跑的是什麼，都還沒放進去。',
  'nb.queue.locked.title': '排程被鎖住了',
  'nb.queue.locked.body': '400 不收我的樣品：03:33 的優先預約把排程鎖住了。只有設施管理員能覆寫。',
};
