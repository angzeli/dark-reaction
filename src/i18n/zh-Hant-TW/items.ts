/** 你能帶著走的東西（03:33 之後都不會留下）。 */
import type { items as en } from '../en/items.ts';

export const items: Record<keyof typeof en, string> = {
  'ui.carrying': '你手上拿著：{items}。',
  'ui.list.sep': '、',
  'item.fractions': '一瓶第 12–14 管的收集液',
  'item.vial': '一小瓶黃色固體',
  'item.tube.own': '你的 NMR 管',
  'item.spectrum.own': '你從 400 存下來的譜',
  'item.printout': '一張還溫溫的完美圖譜',
  'item.foil': '一捲鋁箔',
  'item.tube.jy': '她那支空的 J. Young 管',
  'item.tube.dark': '她那支裝好、包著鋁箔的 J. Young 管',
  'item.microsd': '冷凍小管裡的一張 microSD 卡',

  // ── 你的識別證（docs/HUMOUR.md §4.4） ──────────────────────────────────────────────
  'item.lanyard': '你的識別證',
  'ui.wearing': '脖子上掛著：{items}。',
  'lanyard.off': '把識別證拿下來',
  'lanyard.on': '把識別證戴回去',
  'lanyard.on.r': '你把它戴回去。好了，你又是你了。',
};
