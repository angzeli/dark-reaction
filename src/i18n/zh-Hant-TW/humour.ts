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
};
