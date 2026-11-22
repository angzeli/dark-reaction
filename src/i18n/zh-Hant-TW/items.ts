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
};
