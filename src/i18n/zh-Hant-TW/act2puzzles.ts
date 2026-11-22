/** 第二幕：打開三個謎題的選項，以及冰箱的捷徑。國語、臺灣用法。CC BY-NC-SA 4.0。 */
import type { act2puzzles as en } from '../en/act2puzzles.ts';

export const act2puzzles: Record<keyof typeof en, string> = {
  'stairs.terminal': '用警衛的終端機',
  'stairs.terminal.r': '他的椅子往後推開，好像人才剛站起來。收音機低聲說著大西洋上空的天氣。門禁紀錄的終端機還登入著：ADEYEMI F。',
  'pi.notebook': '讀她筆記本的最後一頁',
  'pi.notebook.r': '她的筆記本就在箱子裡：綠色精裝，跟你的一樣，四個角都磨軟了。你翻到她寫的最後一頁。',
  'cold.rack1': '在冰箱裡找第一架',
  'cold.rack1.r': '門封一鬆，吐出一口白霜。第一架，從上面數下來第二層：一個白色紙盒，盒蓋上寫著她的縮寫。',
  'cold.e5': '拿起 E5',
  'cold.e5.r': '第一架，她的盒子。蓋子上的字你已經不用再看了。E5 的紅蓋子、冷凍小管、裡面那張卡：面板上的數字還沒動，冰箱門就已經關上了。',
};
