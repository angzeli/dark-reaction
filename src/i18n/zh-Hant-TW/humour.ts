/** 房間與筆記本裡的幽默（docs/HUMOUR.md）。這張表裡的每個鍵都是笑點鍵，由驗證器管它出現在哪裡。臺灣研究生的笑點，各自原創。 */
import type { humour as en } from '../en/humour.ts';

export const humour: Record<keyof typeof en, string> = {
  // ── 校園（§4）─────────────────────────────────────────────────────────────
  'fun.plate': '門牌上寫著 *RESEARCH WRITE-UP ROOM*。大家都叫它「寫不完的房間」。',
  'fun.shuttle.timetable': '門邊，刮花的壓克力板後面，是接駁車時刻表：*LAST SERVICE 18:15*。現在是 {clock}。連接駁車都下班了。',
  'fun.lanyard.off': '你把它拿下來。整個人好像少了一點自己。',
  'fun.clocking.lanyard': '快四點的時候，你才發現識別證還掛在脖子上。在夜車上，凌晨四點。你下班了，它還沒。',
  'fun.lift.r': '電梯停在 0 樓，門開著，跟平常一樣在等。',
  'fun.lift.press': '你走進去，按了 4。門考慮了一下，決定繼續開著。過了一會兒你走出來，跟大家一樣爬樓梯。（英國的一樓叫 0 樓，你花了一整個學期才習慣。）',
  'fun.lift.again': '03:33 的時候，它也是這樣開著門在等。不管這一夜對這棟樓做了什麼，好像都沒人通知電梯。',
  'fun.plan':
    '鋼框裡一張逃生平面圖，一層一格，*YOU ARE HERE* 標在 0 樓。4 樓那格，Research Write-Up Room 整個寫出來。地下室是 *B.05 COLD ROOM* 和 *B12 NMR*，兩種編號系統，看那一年是誰負責做門牌。頂樓不在圖上。官方說法是，沒有人會上去。',
  'fun.labdoor':
    '4.12 的門被貼了太多層，幾乎已經是紙做的了。*LAB COATS MUST BE WORN BEYOND THIS POINT*，一半壓在 *NO LAB COATS IN CORRIDORS* 底下，而你現在就站在走廊上看。*EYE PROTECTION MUST BE WORN*，旁邊一張比較新的：*(THIS MEANS GOGGLES, NOT YOUR GLASSES)*。*REMOVE GLOVES BEFORE TOUCHING DOOR HANDLES*，蓋在 *DO NOT TOUCH DOOR HANDLES WITH BARE HANDS* 上面。*KEEP THIS DOOR SHUT*，貼在一扇同時寫著 *FIRE DOOR: KEEP CLEAR* 的門上。三分鐘後，你非常清楚自己必須做什麼、不准做什麼，也非常清楚這些不可能同時做到。跟系上的規定一模一樣。',
  'fun.labdoor.poster.0': '正中間是這個月的安全海報：*IS YOUR SASH AT THE CORRECT HEIGHT?* 一座卡通抽氣櫃對你比讚。它的拉門拉錯高度了。',
  'fun.labdoor.poster.1': '正中間是這個月的安全海報：*SLIPS, TRIPS AND FALLS.* 有人畫了一個箭頭，指向門口地上那條延長線，旁邊寫著 *still here*。從你一年級就在那裡了。',
  'fun.labdoor.poster.2': '正中間是這個月的安全海報：*HAVE YOU COMPLETED YOUR RISK ASSESSMENT?* 底下貼著一張「閱讀本海報」的風險評估表。*Likelihood*：一定會。',
  'fun.labdoor.poster.3': '正中間是這個月的安全海報：*LONE WORKING: NEVER WORK ALONE OUT OF HOURS.* 你想了一下，凌晨三點要告訴誰。老闆在波士頓，應該醒著。',
  'fun.labdoor.poster.4': '正中間是這個月的安全海報：*KNOW WHERE YOUR NEAREST EYEWASH IS.* 箭頭指著一面牆。',
  'fun.corridor':
    '這一段走廊還有三扇教授的門，都暗著，都沒有名牌，只各貼了一張紙：*Big OP is here.* *Running out of money soon.* *Don’t laugh at students.* 第一張大概是說裡面的人很強。第二張你太熟了。第三張是寫給誰看的，你不太敢想。',

  // ── 第一幕的房間（§8） ──────────────────────────────────────────────────────────────
  'synth.sorry': '在抽氣櫃上放一包乖乖',
  'fun.sorry': '剛剛把拉門拉太高，它就一直嗶嗶叫。你把拉門拉回黃線，從抽屜拿出一包綠色的乖乖（一定要綠色的），立在窗框上。它不叫了。學長說，這招對 NMR 也有效。',
  'fun.synth.tlc':
    'Tom 的抽氣櫃裡，燒杯旁邊靠著一片他顯然已經放棄的 TLC 片：起始物、產物、co-spot 全停在 Rf 0.3，並排，好像私下講好了。拉門上是他一行一行的大寫字：*TRY 4:1。TRY 9:1。TRY 19:1。TRY A DIFFERENT PROJECT.* 最後一個，在台灣叫做換老闆。',
  'fun.pencil':
    '門邊護貝的系上規定說，任何東西都要先做 COSHH 風險評估才能碰。（英國的 COSHH，大概等於毒化物申報加一張核銷單，再乘以三。）你還是填了一張。*Substance*：鉛筆（石墨、黏土、雪松木）。*Hazard*：木刺。*Route of exposure*：你會咬它。*Control measures*：不要咬。*PPE*：手套、護目鏡、實驗衣。*Supervisor’s signature*：老闆在波士頓。你沒等簽名就撿起來了，這棟樓裡大部分的事都是這樣辦成的。',
  'fun.thesis': '第 4 章，你從六月寫到現在。*本催化劑在可見光（λ > 420 nm）下活性為商用 P25 的 3.7 倍，可穩定循環 5 次。結合能以 C 1s 284.8 eV 校正。表觀量子效率未測定。* 你從頭讀了一遍。聽起來跟每一篇你翻過白眼的 paper 一模一樣，而這篇是你寫的。',
  'fun.chart':
    '控制台旁邊貼著 Ian 護貝的表：*PEAKS THAT ARE NOT YOUR PRODUCT.* CDCl₃：7.26 溶劑、1.56 水、2.17 丙酮、0.86 和 1.26 油脂。C₆D₆：7.16、0.40、1.55、0.92 和 1.36。最底下有人用原子筆加了一行：*8.41 — hope.* 再底下，另一個人的字：*許願池*。',

  // ── 大樓的其他地方：B.05、廣播、過去的你寫在邊上的字（§7–8） ────────────────────────────────────────
  'fun.cold.box': '最上層最前面，待得比組上任何人都久的一個盒子：*DO NOT THROW AWAY — K., 2009*。沒有人知道 K. 是誰，也沒有人敢丟。每個實驗室都有一盒；台灣的通常寫「學長的，勿丟」。',
  'fun.cold.fridge':
    '門上是 Ian 的大寫字：*NO FOOD OR DRINK — CHEMICALS ONLY*。裡面：一瓶硼酸、三瓶氘代溶劑，和一份 meal deal（三明治、洋芋片、飲料），貼著「Tom 的——別碰（就是在說你）」，賞味期限是上週二。英國超商的三明治套餐，第一年覺得划算，第二年吃到想哭。',
  'fun.pa.test': '叮咚。一個錄好的女聲，非常冷靜：*This is a test of the public address system. If you can hear this message, you are in the building.* 叮咚。對，你還在。',
  'fun.pa.car': '叮咚。*停車場那台藍色旅行車的車主，請移車。這台車從九月就停在這裡了。這是最後一次廣播。* 叮咚。上個月也說是最後一次。',
  'nb.aside.tlc': '瓶子要貼標籤。你沒貼。',
  'nb.aside.yield': '天平沒有在飄。是你在飄。',
  'nb.aside.purge': '三次。戴著手套就不要用手指數了。',
  'nb.aside.reset': '帶手電筒。（你不會帶的。）',
  'nb.aside.ian': '這個他也有一張告示。',

  // ── 製作名單（§7） ────────────────────────────────────────────────────────────────
  'credits.reviewer': 'Reviewer 2——應本人要求，不具名',
};
