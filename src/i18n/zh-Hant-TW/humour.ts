/** 房間與筆記本裡的幽默（docs/HUMOUR.md）。這張表裡的每個鍵都是笑點鍵，由驗證器管它出現在哪裡。臺灣研究生的笑點，各自原創。 */
import type { humour as en } from '../en/humour.ts';

export const humour: Record<keyof typeof en, string> = {
  // ── 校園（§4）─────────────────────────────────────────────────────────────
  'fun.plate': '門牌上寫著 *RESEARCH WRITE-UP ROOM*。大家都叫它「寫不完的房間」。',
  'fun.shuttle.timetable': '門邊，刮花的壓克力板後面，是接駁車時刻表：*LAST SERVICE 18:15*。現在是 {clock}。連接駁車都下班了。',
  'fun.lanyard.off': '你把它拿下來。整個人好像少了一點自己。',
  'fun.clocking.lanyard': '夜車上，快四點的時候，你才發現識別證還掛在脖子上。你下班了，它還沒。',
  'fun.lift.r': '電梯停在 0 樓，門開著，跟平常一樣在等。',
  'fun.lift.press': '你走進去，按了 4。門沒有要關的意思。過了一會兒你走出來，跟大家一樣爬樓梯。',
  'fun.lift.again': '03:33 的時候，它也是這樣開著門在等。不管這一夜對這棟樓做了什麼，好像都沒人通知電梯。',
  'fun.plan': '鋼框裡一張逃生平面圖，一層一格，*YOU ARE HERE* 標在 0 樓。地下室是 *B.05 COLD ROOM* 和 *B12 NMR*，兩種編號系統。',
  'fun.labdoor':
    '4.12 的門被貼了太多層，幾乎已經是紙做的了。*LAB COATS MUST BE WORN BEYOND THIS POINT*，一半壓在 *NO LAB COATS IN CORRIDORS* 底下，而你現在就站在走廊上看。*EYE PROTECTION MUST BE WORN*，旁邊一張比較新的：*(THIS MEANS GOGGLES, NOT YOUR GLASSES)*。*FIRE DOOR: KEEP SHUT*，貼在一扇被一大罐丙酮頂開的門上。',
  'fun.labdoor.poster.0': '正中間是這個月的安全海報：*IS YOUR SASH AT THE CORRECT HEIGHT?* 一座卡通抽氣櫃對你比讚。它的拉門拉錯高度了。',
  'fun.labdoor.poster.1': '正中間是這個月的安全海報：*SLIPS, TRIPS AND FALLS.* 有人畫了一個箭頭，指向門口地上那條延長線，旁邊寫著 *still here*。從你一年級就在那裡了。',
  'fun.labdoor.poster.2': '正中間是這個月的安全海報：*IS YOUR LAB COAT BUTTONED?* 沒有一個人的有扣。',
  'fun.labdoor.poster.3': '正中間是這個月的安全海報：*LONE WORKING: NEVER WORK ALONE OUT OF HOURS.* 你想了一下，凌晨三點要告訴誰。老闆在波士頓，應該醒著。',
  'fun.labdoor.poster.4': '正中間是這個月的安全海報：*KNOW WHERE YOUR NEAREST EYEWASH IS.* 箭頭指著一面牆。',
  'fun.corridor': '這一段走廊還有三扇教授的門，都暗著，都沒有名牌，只各貼了一張紙：*Big OP is here.* *Running out of money soon.* *Don’t laugh at students.*',

  // ── 第一幕的房間（§8） ──────────────────────────────────────────────────────────────
  'synth.sorry': '在抽氣櫃上放一包乖乖',
  'fun.sorry': '你一轉身，你那座抽氣櫃的風速警報又嗶嗶叫了，它每次被人看一眼就會這樣。你從抽屜拿出一包綠色乖乖，立在窗框上。它不叫了。學長說，這招對 NMR 也有效。',
  'fun.synth.tlc': 'Tom 的抽氣櫃裡，燒杯旁邊靠著一片他顯然已經放棄的 TLC 片：起始物、產物、co-spot 全停在 Rf 0.3，並排，好像私下講好了。拉門上是他一行一行的大寫字：*TRY 4:1。TRY 9:1。TRY 19:1。TRY A DIFFERENT PROJECT.*',
  'fun.pencil':
    '門邊護貝的系上規定說，任何東西都要先做風險評估才能碰，所以你填了一張。*Substance*：鉛筆（石墨、黏土、雪松木）。*Hazard*：木刺。*Route of exposure*：你會咬它。*Control measures*：不要咬。*PPE*：手套、護目鏡、實驗衣。*Supervisor’s signature*：老闆在波士頓。你沒等簽名就撿起來了，這棟樓裡大部分的事都是這樣辦成的。',
  'fun.thesis': '第 4 章，你從六月寫到現在。*本催化劑在可見光（λ > 420 nm）下活性為商用 P25 的 3.7 倍，可穩定循環 5 次。結合能以 C 1s 284.8 eV 校正。表觀量子效率未測定。* 你從頭讀了一遍。聽起來跟每一篇你翻過白眼的 paper 一模一樣，而這篇是你寫的。',
  'fun.chart':
    '控制台旁邊貼著 Ian 護貝的表：*PEAKS THAT ARE NOT YOUR PRODUCT.* CDCl₃：7.26 溶劑、1.56 水、2.17 丙酮、0.86 和 1.26 油脂。C₆D₆：7.16、0.40、1.55、0.92 和 1.36。最底下有人用原子筆加了一行：*8.41 — hope.* 再底下，另一個人的字：*+1*。',

  // ── 大樓的其他地方：B.05、廣播、過去的你寫在邊上的字（§7–8） ────────────────────────────────────────
  'fun.cold.box': '門闔上之前，你瞥見最上層最前面那個盒子，待得比組上任何人都久：*DO NOT THROW AWAY — 2009*。沒有人知道是誰的，也沒有人敢丟。',
  'fun.cold.fridge': '門上是 Ian 的大寫字：*NO FOOD OR DRINK — CHEMICALS ONLY*。裡面：一瓶硼酸、三瓶氘代溶劑，和一份 meal deal，貼著「Tom 的。洋芋片我數過了。」',
  'fun.pa.test': '叮咚。一個錄好的女聲，非常冷靜：*This is a test of the public address system. If you can hear this message, you are in the building.* 叮咚。對，你還在。',
  'fun.pa.car': '叮咚。同一個女聲，請停車場那台藍色旅行車的車主移車，說它從九月就停在那裡了，這是最後一次廣播。叮咚。上個月也說是最後一次。',
  'nb.aside.tlc': '瓶子要貼標籤。你沒貼。',
  'nb.aside.yield': '天平沒有在飄。是你在飄。',
  'nb.aside.ian': '這個他也有一張告示。',

  // ── 製作名單（§7） ────────────────────────────────────────────────────────────────
  'credits.reviewer': 'Reviewer 2——應本人要求，不具名',

  // ── 藏起來的彩蛋（§7） ──────────────────────────────────────────────────────────────
  'fun.squid.synth': '抽氣櫃拉門的膠帶上，一隻指甲大小的烏賊，原子筆畫的，一隻手拿著一個小小的圓底燒瓶。底下很小的字：*Squiddy*。',
  'fun.squid.glovebox': '手套箱窗戶外側的灰塵上，有人用指尖畫了一隻烏賊，每一隻手都伸進了手套裡。*Squiddy*。',
  'fun.squid.office': '熱水壺上貼著一張便利貼：一隻烏賊，八隻腕各拿一個馬克杯，兩條觸腕又各拿一個。*Squiddy*。',
  'nb.squiddy.body': '三隻烏賊，三個房間，同一個簽名。組上沒有人叫 Squiddy。你查過了。',
  'fun.darkroom': '說是暗房，其實是掛了遮光簾的儲藏室：一台裝在散熱箱裡的氙燈、一台攪拌器。燈罩上貼著一條膠帶，Tom 那手方方正正的字：*VISIBLE LIGHT (λ > 420 nm)*。底下小一點：*(MOSTLY HEAT)*。',
  'nb.darkcontrol.body': '催化劑、CO₂、溶劑；不照光；02:47 到 03:33。結果：什麼都沒發生，跟預期一樣。（SI 要做三重複。）',
  'fun.tare.1': '你按了歸零。0.0000 g。然後 0.0002。然後 0.0005，慢慢往上爬。',
  'fun.tare.2': '再歸零一次。0.0000。然後 −0.0003，這更糟。',
  'fun.tare.3': '第三次。螢幕暗了一下，切成了百分比模式，從來沒有人是故意用這個模式的：*104 %*。一百零四趴的什麼，它沒說。',
  'slide.preliminary': '（初步）',
  'slide.promising': '結果蠻 promising 的！！',
  'slide.future': '未來工作：全部',
  'slide.footer': '第 13 頁，共 47 頁 · 機密，請勿外流',
  'slide.close': 'Q&A（請不要）',
  'title.egg.bed': '03:33 了。去睡覺。',
  'title.egg.mole': '10 月 23 日，莫耳日。世界上某個地方，有一莫耳的研究生還在實驗室。',

  // ── 客串（§8） ──────────────────────────────────────────────────────────────────
  'fun.macbook': '隔壁桌上，某人的 MacBook 開著，風扇小聲地轉，在跑 VASP。輸出一行一行慢慢捲過去：能量、力，一個越來越小的數字。它在收斂。沒有人知道為什麼。',
  'fun.rack': '控制台旁的桌上，一個 3D 列印的 NMR 管架：四十八個孔，排成六排，每個都編了號，一看就是 3D 印的那種橘。有人很認真地設計過它。',
};
