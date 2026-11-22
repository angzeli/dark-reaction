/** 第一幕：選項，以及選了之後發生的事。國語、臺灣用法。CC BY-NC-SA 4.0。 */
import type { act1 as en } from '../en/act1.ts';

export const act1: Record<keyof typeof en, string> = {
  'synth.plate': '看今晚收集液的 TLC 片',
  'synth.plate.r': '你把 TLC 片舉到燈下。',
  'synth.combine': '合併第 12、13、14 管',
  'synth.combine.r': '你知道是哪幾管。你連 TLC 片都沒看，就把它們倒在一起。',
  'synth.rotavap': '把合併的收集液拿去旋轉濃縮',
  'synth.rotavap.r':
    '旋轉濃縮儀嗡嗡地轉。溶劑在冷凝管上凝成水珠，順著螺旋流進收集瓶，一層薄薄的黃色慢慢沿著你的瓶壁爬上來。你把它刮進樣品瓶。那個顏色，像是隔著霧看見的一盞檯燈。',
  'glovebox.antechamber': '經由前艙把樣品瓶送進去',
  'glovebox.antechamber.r': '你把手放上外門的轉輪。',
  'glovebox.purge': '照你摸索出來的方式抽灌（三次循環）',
  'glovebox.purge.r': '開外門、放樣品、關門。抽真空、回填。抽真空、回填。抽真空、回填。你的手已經記住了。管子拿出來的時候，是淡淡的黃色。',
  'glovebox.purge.late.r': '每一步你都做對了，卻沒有用。內門打開的時候，氧氣計已經超過十，你眼睜睜看著那層膜變綠。',
  'nmr.console': '在主控台前坐下',
  'nmr.console.r': '椅子還是溫的。它一直都是。',
  'nmr.console.again': '再查一次排程',
  'nmr.console.again.r': '樣品槽 13。03:33。ar4217。PROTON_DARK。等待樣品。什麼都沒變，這反而更糟。',
  'nmr.load': '把你的 NMR 管放進自動進樣盤',
  'nmr.load.r':
    '你把管子插進轉子，放進樣品槽 2。主控台立刻拒絕：QUEUE LOCKED · PRIORITY BOOKING 03:33 (HOLDER 13) · CONTACT FACILITY MANAGER。Ian 的電話寫在門邊的牌子上。現在是凌晨三點。',
};
