# Humour, in-jokes and anomalies (v1.1.0)

> **Spoilers.** This is the full list of what v1.1.0 hides in the building, and how to find each thing. The release notes give only a count. The README says only: *There are things in the building that aren't in the manual.* /「這棟樓裡，有些東西不在手冊上。」

This document is the source of truth for the M7 *Anomalies* milestone, in the same way as `DESIGN.md` is for the game. When code and this document disagree, one of them is wrong. Every string below is in the game in both languages, under the key given. Both languages are originals. Where they tell different jokes, the entry says so and its key is flagged `localisedVariant` in the registry.

---

## 1. Tone rules

These rules come first. Each joke below has been checked against them, and the validator enforces the parts a machine can check.

1. **Humour lives in the margins.** It belongs in optional examine text, item descriptions, the console, notebook marginalia, achievements, signs and PA announcements. It is never in the 03:33 transitions (the lights-out card, the lights-out rules, the 02:47 page that follows), never in Act III's climax (the dark run and the peak match), and never in an ending epilogue, except Fire Alarm and the lanyard beat in Clocking Off.
2. **Every scene has a tone tag: `calm`, `uneasy` or `dread`.** A scene's tag can differ by act (Act III reads darker). Puzzles have tone tags too. The validator fails if a joke key can appear in a `dread` scene. An `uneasy` scene gets at most one light line per act.
3. **The voice is dry, deadpan and sarcastic about research culture, never about the player's sincerity.** No real, named people. The university stays unnamed. The building is the fictional Vellacott Building, and the console no longer prints a university name either.
4. **The best jokes point at the same pressures as the horror:** the 104 % yield, the fit that's a little too convenient, the thesis chapter that sounds like every paper you've rolled your eyes at. Laughing should make the dread land harder later.
5. **If a joke needs explaining, cut it.** Fewer, better jokes beat quantity.
6. **Localise, don't translate.**
   - English is British humour and UK lab culture: COSHH forms, risk assessments, the meal deal, the night bus, apologising to the fume hood.
   - 中文 is Taiwanese grad-school humour, written natively: 老闆、被電、爆肝、延畢、meeting、學長姐、乖乖.
   - If a joke doesn't land in one language, that language gets a different joke.
7. **In-world signage stays in English in both locales,** because this is a London building. In 繁中 the examine text adds a native, Taiwanese-tone gloss that lands the joke, never a literal translation. This applies to the new signs. The v1.0 signs (Ian's, the call point's) were localised in the playtest passes and stay as they are.
8. **Accessibility and privacy are unchanged.** Visual gags respect reduce-motion, flicker-off and high contrast. Nothing goes over the network.

## 2. How it is built

- **Joke keys** are the keys in the humour tables: `src/i18n/<locale>/humour.ts` (lines in rooms and the notebook) and `src/i18n/<locale>/terminal.ts` (the console). The rule applies to the jokes written for this milestone. The v1.0 lines with a dry edge (Ian's signs, Tom's labels, Dan's shelves) are part of each room's voice and are not counted.
- **Tone tags** sit on every `SceneDef` and `PuzzleDef` (`tone: 'calm' | 'uneasy' | 'dread'`, or one tag per act). The validator works out which keys can appear in each scene in each act. It does this by evaluating each condition with only the act, the room and the scene known: anything that depends on the act is decided, and everything else is treated as possible.
- **The anomaly registry** (`src/content/anomalies.ts`) is typed. Each entry has an id, a trigger, the scene where it appears, its tone, its locale keys and, optionally, an achievement. Content records a find with the `{ anomaly: id }` effect, and the console and the UI call `discover(id)`. Unit tests trigger every entry. The Playwright suite triggers a sample in both languages: the lift on 0, the lanyard coming back at 02:47, `shuttle`, the Konami slide and the credits.
- **Achievements** (`src/content/achievements.ts`) are either granted by an anomaly or decided by a condition over the game state.
- **Persistence.** Achievements and anomalies are stored with the ending gallery, so they survive new games and deleted slots. Save schema 2 adds `anomalies` and `achievements` to the state, and schema 3 adds the lanyard. Migrations carry v1.0.0 saves forward with nothing lost.
- **`localisedVariant`.** For a joke key, the validator checks that both languages carry the same numbers (104, 0.3, 284.8, 18:15, 3.7). A key flagged `localisedVariant` tells a different joke in each language, and the validator accepts it however far apart the two versions are.

## 3. Tone tags

| Scene | Act I | Act II | Act III | Notes |
|---|---|---|---|---|
| `office.hub` | calm | calm | uneasy | Act III's one light line: taking your lanyard off. |
| `office.monitor` | calm | calm | uneasy | |
| `office.process` | uneasy | uneasy | uneasy | Where two fudges live. No jokes. |
| `office.declare.own`, `office.declare.printout` | dread | dread | dread | The box you tick. |
| `office.desk7` | uneasy | uneasy | uneasy | Her mug. |
| `synth.hub` | calm | calm | uneasy | |
| `synth.darkroom` (new) | calm | calm | uneasy | |
| `glovebox.hub` | calm | calm | uneasy | |
| `glovebox.logbook` | uneasy | uneasy | uneasy | A fudge. |
| `pi.door` | calm | calm | uneasy | The professors' corridor. |
| `pi.hub` | uneasy | uneasy | dread | |
| `pi.box` | dread | dread | dread | |
| `stairs.hub` | calm | calm | uneasy | |
| `stairs.toilets` (new) | calm | calm | calm | The one place the building can't reach you. |
| `stairs.door`, `stairs.alarm` | uneasy | uneasy | uneasy | Thresholds of two endings. |
| `nmr.hub` | calm | calm | dread | Act III is where the dark run is set up. |
| `cold.hub` | calm | calm | uneasy | |
| `roof.hub` | calm | calm | uneasy | |

| Puzzle | Tone | Notes |
|---|---|---|
| `console` | calm in Acts I–II, uneasy in Act III | In Act III the hidden commands go quiet (`command not found`). |
| `tlc` | calm | |
| `glovebox`, `doorlog`, `cipher`, `freezer`, `schlenk`, `chirp`, `fabrication` | uneasy | |
| `peakmatch` | dread | The climax. |

Events: the two PA announcements fire only in calm hubs, and only in Acts I–II. `ev.keeps` (03:33) and every lights-out rule are tagged `dread`.

## 4. Campus in-jokes

For anyone who studied in a building like this one. They should mean nothing to anyone else.

### 4.1 The NMR room is B12

- **What changes:** `loc.nmr.name` becomes *B12 NMR suite* / 「B12 NMR 室」. Every text reference follows, and so do the art comments, the e2e selectors and `DESIGN.md`.
- **The console's banner** drops the university's name: *NMR Facility · B12 · 400 MHz* / 「NMR 設施 · B12 · 400 MHz」.
- **What doesn't change:** ids, puzzle logic and minute costs. The door-access log has no basement doors, so it has nothing to relabel. There was no floor plan in the game, so there is one now, by the lift (§4.5).
- **B.05 keeps its old number.** The floor plan says why.

### 4.2 The Research Write-Up Room

- **The rename:** `loc.office.name` becomes *4.08 Research Write-Up Room* in both locales (it's the door plate). The English narration says *the Research Write-Up Room*, and the 繁中 narration says 「Write-Up Room」, as a Taiwanese student abroad would. Only display strings change, so ids and saves stay stable.
- **Look around the room** /「環顧這個房間」 (`office.around`): the room's small new things sit one look away, so the hub keeps its number keys. It is quiet (*Eleven desks, ten of them empty…*), and holds the door plate, your lanyard, and later the pencil and the MacBook.
- **The door plate:** `office.plate`, in `office.around` (calm, Acts I–II, 1 min). This is an anomaly (`plate`) and a `localisedVariant`.
  - EN: *RESEARCH WRITE-UP ROOM, says the plate on the door, which is optimistic on both counts.*
  - 繁中：「門牌上寫著 RESEARCH WRITE-UP ROOM。大家都叫它『寫不完的房間』。」

### 4.3 The shuttle bus

- **The timetable by the main entrance:** `stairs.entrance` gains `fun.shuttle.timetable` (Acts I–II). This is an anomaly (`shuttle.timetable`).
  - EN: *Beside the doors, behind scratched perspex, the shuttle timetable: LAST SERVICE 18:15. It is {clock}.*
  - 繁中：「門邊，刮花的壓克力板後面，是接駁車時刻表：LAST SERVICE 18:15。現在是 {clock}。連接駁車都下班了。」
- **The console command `shuttle`:** see §5.
- **Clocking Off:** a new paragraph, `ending.clocking.shuttle`, after you leave your laptop behind. It is quiet, not a joke key.
  - EN: *The service road brings you out by the shuttle stop. Nobody is waiting at it, and nothing is coming. You walk on to the night bus.*
  - 繁中：「卸貨區的小路把你帶到接駁車站牌旁邊。沒有人在等，也不會有車來。你繼續往前走，去搭夜車。」

  The next paragraph's first sentence changes to follow on from it: *The bus shelter on the street is lit like an aquarium and empty.*

### 4.4 Lanyards

- **The item:** your lanyard is an inventory item, `item.lanyard` (*your lanyard* / 「你的識別證」). You wear it by default, and the play screen says so under the passage: *Around your neck: your lanyard.* /「脖子上掛著：你的識別證。」 It's back around your neck at every 02:47 (`Content.onLoopStart`).
- **Taking it off** in the Research Write-Up Room (under *Look around the room*) or the toilets (`office.lanyard.off`, `stairs.toilets.lanyard.off`, 0 min). This is an anomaly (`lanyard.off`), and taking it off sets the persistent flag `lanyard.offEver`.
  - EN: *You take it off. You feel slightly less like yourself.*
  - 繁中：「你把它拿下來。整個人好像少了一點自己。」
- **Putting it back on** (plain, not a joke): *You put it back on. There you are.* /「你把它戴回去。好了，你又是你了。」
- **Her lanyard, still visibly worn.** These are quiet, not joke keys:
  - `pi.photo.lanyard`: *She is the only one in the photo still wearing her lanyard.* /「照片裡，只有她還戴著識別證。」
  - `pi.box.lanyard`: *Her lanyard isn't in the box.* /「箱子裡沒有她的識別證。」
- **Clocking Off, if you are wearing it:** `fun.clocking.lanyard` comes after the building goes dark behind the bus. This is the one joke key allowed in that epilogue, and it is a `localisedVariant`.
  - EN: *Somewhere around four you notice you're still wearing your lanyard. On the night bus. At four in the morning. Visible at all times.*
  - 繁中：「快四點的時候，你才發現識別證還掛在脖子上。在夜車上，凌晨四點。你下班了，它還沒。」
- **Achievement:** *Visible at All Times* /「識別證永不離身」, for reaching any ending without ever taking it off (§6).

### 4.5 The lift, and a floor plan

- **The lift:** *Go over to the lift* /「走到電梯那邊」 (`stairs.lift`, a spot of its own in the lobby, so the stairwell's hub stays short). It's calm in Acts I–II, with a quiet version in Act III. Going over is an anomaly (`lift`). The floor plan and the toilets' door are there too.
  - EN: *On 0 the lift is waiting with its doors open, as it always is.* /「電梯停在 0 樓，門開著，跟平常一樣在等。」
  - EN, from loop 2: *It was waiting like this at 03:33, too. Whatever the night does to the building, nobody has told the lift.* /「03:33 的時候，它也是這樣開著門在等。不管這一夜對這棟樓做了什麼，好像都沒人通知電梯。」
  - *Press 4* /「按 4」 (`stairs.lift.press`, Acts I–II, 1 min, a `localisedVariant`): *You step in and press 4. The doors think about it and stay open. After a while you step out again and take the stairs, like everyone does.* /「你走進去，按了 4。門考慮了一下，決定繼續開著。過了一會兒你走出來，跟大家一樣爬樓梯。（英國的一樓叫 0 樓，你花了一整個學期才習慣。）」
  - Act III (quiet, `stairs.lift.act3`): *On 0 the lift is waiting with its doors open. It has been waiting all night, every night. Tonight, for the first time, you wonder who for.* /「電梯停在 0 樓，門開著。它等了一整夜，每一夜都是。今晚你第一次想：它在等誰。」
- **Two lines made consistent with the lift.** The sofa's *the lift going somewhere on its own* becomes *the lift, somewhere below, holding its doors open for nobody*. In Fire Alarm, the lift that *sinks to the ground floor* is now already there: *On 0 the lift, which has held its doors open all night, goes on holding them open, now officially.*
- **The floor plan:** `stairs.plan`, by the lift, *Read the floor plan by the lift* /「看電梯旁的樓層圖」 (calm, Acts I–II, 1 min). This puts B12 on the building's own signage.
  - EN: *A fire evacuation plan in a steel frame, one panel per floor, YOU ARE HERE on 0. On 4, the Research Write-Up Room in full. In the basement, B.05 COLD ROOM and B12 NMR, numbered in two different systems, depending on who was in charge of signs that year. The roof isn't on it. Officially, nobody goes up there.*
  - 繁中：「鋼框裡一張逃生平面圖，一層一格，YOU ARE HERE 標在 0 樓。四樓那格，Research Write-Up Room 整個寫出來。地下室是 B.05 COLD ROOM 和 B12 NMR，兩種編號系統，看那一年是誰負責做門牌。頂樓不在圖上。官方說法是，沒有人會上去。」

### 4.6 The lab entrance

- **The door of 4.12:** `synth.door.0` to `synth.door.4`, *Read the notices on the lab door* /「看實驗室門上的告示」. It's calm in Acts I–II and costs 3 min, because reading them all takes time. Only one of the five choices shows each night (`{ loopMod: [5, k] }`), and each reads that night's poster. This is an anomaly (`labdoor`).
  - EN (every night): *Lab 4.12's door has been papered over so many times it is mostly paper. LAB COATS MUST BE WORN BEYOND THIS POINT, half under NO LAB COATS IN CORRIDORS, which is where you are standing to read it. EYE PROTECTION MUST BE WORN, and newer, beside it: (THIS MEANS GOGGLES, NOT YOUR GLASSES). REMOVE GLOVES BEFORE TOUCHING DOOR HANDLES, over DO NOT TOUCH DOOR HANDLES WITH BARE HANDS. KEEP THIS DOOR SHUT, on a door that also says FIRE DOOR: KEEP CLEAR. Three minutes later you know exactly what you must and mustn't do, and that you can't do all of it.*
  - 繁中 (every night): 「4.12 的門被貼了太多層，幾乎已經是紙做的了。LAB COATS MUST BE WORN BEYOND THIS POINT，一半壓在 NO LAB COATS IN CORRIDORS 底下，而你現在就站在走廊上看。EYE PROTECTION MUST BE WORN，旁邊一張比較新的：(THIS MEANS GOGGLES, NOT YOUR GLASSES)。REMOVE GLOVES BEFORE TOUCHING DOOR HANDLES，蓋在 DO NOT TOUCH DOOR HANDLES WITH BARE HANDS 上面。三分鐘後，你非常清楚自己必須做什麼、不准做什麼，也非常清楚這些不可能同時做到。跟系上的規定一模一樣。」
- **This month's safety poster**, which changes every loop:

  | k | EN | 繁中 |
  |---|---|---|
  | 0 | *IS YOUR SASH AT THE CORRECT HEIGHT? A cartoon fume hood gives you a thumbs up. Its sash is at the wrong height.* | 「IS YOUR SASH AT THE CORRECT HEIGHT? 一座卡通抽氣櫃對你比讚。它的拉門拉錯高度了。」 |
  | 1 | *SLIPS, TRIPS AND FALLS: THE MOST COMMON LABORATORY INJURY. Someone has drawn an arrow to the cable across the doorway and written: still here.* | 「SLIPS, TRIPS AND FALLS. 有人畫了一個箭頭，指向門口地上那條延長線，旁邊寫著：still here。從你一年級就在那裡了。」 |
  | 2 | *HAVE YOU COMPLETED YOUR RISK ASSESSMENT? Taped beneath it, a risk assessment for reading the poster. Likelihood: certain.* | 「HAVE YOU COMPLETED YOUR RISK ASSESSMENT? 底下貼著一張「閱讀本海報」的風險評估表。發生機率：一定會。」 |
  | 3 | *LONE WORKING: NEVER WORK ALONE OUT OF HOURS. TELL SOMEONE WHERE YOU ARE. You think about who you would tell.* | 「LONE WORKING: NEVER WORK ALONE OUT OF HOURS. 你想了一下，凌晨三點要告訴誰。老闆在波士頓，應該醒著。」 |
  | 4 | *KNOW WHERE YOUR NEAREST EYEWASH IS. The arrow points at a wall.* | 「KNOW WHERE YOUR NEAREST EYEWASH IS. 箭頭指著一面牆。」 |

  k = 3 is a `localisedVariant`.
- **Achievement:** *Mandatory Training* /「安全講習時數已滿」, for reading all five posters.

### 4.7 The toilets

- **The scene:** `stairs.toilets`, on the ground floor by the lift, opened with *Go into the toilets* /「去廁所」 (1 min). Its tone is calm in every act. This is an anomaly (`toilets`). It is a quiet beat, and none of its keys are joke keys.
  - EN: *A laminated sign on the door: NO NETWORK ACCESS. Inside it is warm and very quiet, and the hand dryer's little light is the only thing awake. You take your notebook out from habit and find there is nothing to write. For a minute nothing is keeping a record of you, not even you.*
  - 繁中：「門上貼著一張護貝的告示：NO NETWORK ACCESS。裡面很暖，很安靜，只有烘手機的小燈還醒著。你習慣性地拿出筆記本，發現沒有什麼可以寫。有一分鐘，沒有任何東西在記錄你，連你自己也沒有。」
- **The notebook records nothing.** The scene is `unrecorded`. Opened in here, the notebook shows *Nothing is being written down in here.* /「在這裡，什麼都不會被記下來。」 If 03:33 finds you in here, the Loops page records the loop with no place.
- **Choices:** take your lanyard off or put it back on, and Back.

### 4.8 The professors' corridor

- **The corridor outside Dan's door:** `pi.corridor`, *Look along the corridor* /「看看走廊上其他的門」 (calm, Acts I–II, 1 min). The signs are verbatim, and no door has a name on it. This is an anomaly (`corridor`) and a `localisedVariant`.
  - EN: *Along this end of the corridor, three more professors' doors, all dark, none with a name on it. Each has a sign. Big OP is here. Running out of money soon. Don't laugh at students.*
  - 繁中：「這一段走廊還有三扇教授的門，都暗著，都沒有名牌，只各貼了一張紙：Big OP is here。Running out of money soon。Don't laugh at students。第一張大概是說裡面的人很強。第二張你太熟了。第三張是寫給誰看的，你不太敢想。」

## 5. The console

The NMR console (`console` puzzle) answers to more than `help` admits. Hidden commands work while the puzzle is open in Acts I–II. Once the console is solved, *Log back in to the console* /「重新登入控制台」 (`nmr.terminal`, 1 min, Acts I–II) opens it again. In Act III every hidden command answers `command not found`.

Software output stays in English in both locales, since it is in-world. In 繁中 a gloss line follows it where a gloss helps. Output written for people (Ian's wrappers, the shell's own jokes) is localised.

| Command | Anomaly | EN | 繁中 |
|---|---|---|---|
| `sudo …` | `cmd.sudo` | *ar4217 is not in the sudoers file. This incident will be reported to your PI.* | 「ar4217 不在 sudoers 名單裡。此事件將回報給你的老闆。」 |
| `rm -rf /` | `cmd.rm` | *rm: cannot remove '/': it has been laminated. — I.O.* | 「rm：無法刪除 '/'：已護貝。——I.O.」 |
| `xyzzy` | `cmd.xyzzy` | *Nothing happens. This isn't that kind of adventure.* | 「什麼事都沒發生。這不是那種冒險遊戲。」 |
| `vasp` | `cmd.vasp` | *ZBRENT: fatal error in bracketing · please rerun with smaller EDIFF, or copy CONTCAR · to POSCAR and continue* | the same, then 「（學長說他畢業前看過這行三百次。）」 |
| `orca` | `cmd.orca` | *ORCA finished by error termination in SCF · [file orca_tools/qcmsg.cpp, line 465]: · .... aborting the run* | the same, then 「（換了三個 functional，還是不收斂。）」 |
| `g16` | `cmd.g16` | *Normal termination of Gaussian 16 at Mon Nov 23 {clock}:00 2026.* | the same, then 「（你差點想截圖傳給學長。）」 |
| `make coffee` | `cmd.coffee` | *make: \*\*\* No rule to make target ‘coffee’.  Stop.* | the same, then 「（茶水間的咖啡機上個月就壞了。）」 |
| `ping supervisor` (or `ping dan`, `ping pi`) | `cmd.ping` | *PING supervisor (Boston): 56 data bytes · 64 bytes from supervisor: icmp_seq=0 time=0.4 ms · any news??* | 「PING 老闆（波士頓）：56 data bytes · 64 bytes from 老闆：icmp_seq=0 time=0.4 ms · 進度？」 (`localisedVariant`) |
| `history` | `cmd.history` | a numbered history you don't remember typing, from loops you don't remember: `queue --all`, `info 13`, `info 13`, `cancel 13`, `info 13`, `man sleep`, `info 13`, `who`, `exit`, `exit`, `exit` | the same commands |
| `uptime` | `cmd.uptime` | *{clock}:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33* | the same, then 「（兩個使用者？）」 |
| `top` | `cmd.top` | a process table: `init` at 0.0 %, `you` at 100.0 % CPU and 46:00 of time, and `sleep <defunct>` | the same, then 「（爆肝中。）」 |
| `man sleep` | `cmd.man` | *SLEEP(1) · NAME: sleep — delay for a specified amount of time · SYNOPSIS: sleep NUMBER[SUFFIX]... · BUGS: Not available between 02:47 and 03:33.* | 「SLEEP(1) · 名稱：sleep——延遲指定的時間 · 用法：sleep NUMBER[SUFFIX]... · 已知問題：02:47 至 03:33 之間無法使用。」 |
| `git blame` | `cmd.blame` | *usage: git blame [<options>] [<rev>] [--] <file> · (It was Reviewer 2.)* | 「usage: git blame [<options>] [<rev>] [--] <file> ·（反正都是 Reviewer 2 的錯。）」 |
| `ls` | `cmd.ls` | `data/  queue.sh  DO_NOT_DELETE/  thesis_final.docx  thesis_final_v2.docx  thesis_final_v3_FINAL.docx  thesis_final_v7_FINAL.docx  thesis_final_v7_FINAL_actually.docx` | the same |
| `cat thesis_final_v7_FINAL_actually.docx` | `cmd.thesis` | `PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@` · *(Chapter 4 is still just a heading.)* | the same, then 「（第四章還是只有標題。）」 |
| `cat` any other thesis file | (same entry) | *Superseded.* | 「已經不是最新版了。」 |
| `shuttle` | `cmd.shuttle` | *Last service: 18:15. It is {clock}.* | 「末班車：18:15。現在是 {clock}。」 |
| `who` | `cmd.who` | `ar4217   pts/0   02:41 (4.08-desk-04)` · `ycl      pts/1   2019-03-14 03:33` | the same |
| `coshh` | `cmd.coshh` | *coshh: a COSHH assessment is required before running coshh. See form COSHH-COSHH-1.* | 「coshh：執行 coshh 之前，請先填寫 coshh 的 COSHH 風險評估表（表單編號 COSHH-COSHH-1）。」 |

## 6. Achievements

Each achievement is named in each language on its own terms. Locked ones show as *Under review* /「審查中」, with no hint.

| Id | EN | 繁中 | How |
|---|---|---|---|
| `normal` | **Normal Termination**: *Gaussian 16 finished without complaint.* | **正常結束**：「Gaussian 16 沒有抱怨就跑完了。」 | `g16` |
| `reply` | **Instant Reply**: *64 bytes from Boston, at 3 a.m.* | **老闆秒回**：「凌晨三點，波士頓秒回。」 | `ping supervisor` |
| `reported` | **This Incident Will Be Reported**: *Tried sudo on a shared spectrometer.* | **已通報老闆**：「在共用的儀器上打了 sudo。」 | `sudo` |
| `dark` | **Dark Control**: *Nothing happened, as expected.* | **暗對照組**：「什麼都沒發生，跟預期一樣。」 | a whole loop in the dark room (§7) |
| `yield` | **104% Yield**: *The balance, in percentage mode.* | **產率 104%**：「天平自己切成了百分比模式。」 | tare the balance three times (§7) |
| `visible` | **Visible at All Times**: *Reached an ending without once taking your lanyard off.* | **識別證永不離身**：「從頭到尾都沒把識別證拿下來，就走到了結局。」 | any ending, `lanyard.offEver` never set |
| `census` | **Cephalopod Census**: *Found Squiddy in all six rooms.* | **烏賊點名**：「六個房間的 Squiddy 都找到了。」 | all six squid (§7) |
| `coshh` | **Risk Assessed**: *Completed a COSHH assessment for a pencil.* | **跑完流程**：「替一支鉛筆跑完了一整套流程。」 | the pencil (§8) |
| `uncredited` | **Uncredited (As Requested)**: *Read the credits all the way down.* | **匿名審查**：「把製作名單看到了最後一行。」 | the credits (§7) |
| `slide` | **Any Questions?**: *Presented a room at group meeting.* | **被電**：「在 meeting 上報告了一個房間。」 (`localisedVariant`) | the Konami code (§7) |
| `bed` | **Go to Bed**: *Opened the game at 03:33.* | **快去睡**：「凌晨三點三十三分打開了這個遊戲。」 | the clock (§7) |
| `mole` | **Mole Day**: *Played on 23 October.* | **莫耳日快樂**：「在 10 月 23 日玩了這個遊戲。」 | the date (§7) |
| `training` | **Mandatory Training**: *Read every safety poster on the lab door.* | **安全講習時數已滿**：「看完了門上每一張安全海報。」 | §4.6 |
| `sorry` | **Sorry**: *Apologised to a fume hood.* | **乖乖保佑**：「在抽氣櫃上放了一包綠色乖乖。」 (`localisedVariant`) | §8 |
| `writingup` | **Writing-Up Year**: *Thirteen loops and counting.* | **延畢**：「第十三個迴圈了，還在。」 (`localisedVariant`) | reach loop 13 |
| `tea` | **Make Tea First**: *Did what your own handwriting told you.* | **先泡茶**：「照你自己的筆跡說的做了。」 | make tea at 02:47, once your notebook has told you to |

When an achievement new to the gallery is earned in play, a system line says so: *Achievement: {name}.* /「成就：{name}」. It goes on the page where it happened, but never on an ending's epilogue or on the 02:47 page just after the dark. One earned there waits in the gallery. The ending gallery lists them all, and under them, *Anomalies found: {n}/{total}*. Both are kept with the gallery across new games, and a new game starts with them, so conditions on finds hold and nothing is announced twice.

Earned three ways (`src/content/achievements.ts`):

- by an anomaly that names it (`AnomalyDef.achievement`);
- by a condition, judged after anything you do;
- by a choice, made while a condition holds at that moment (*Make Tea First*).

## 7. Hidden eggs

| Id | Where and how | EN | 繁中 |
|---|---|---|---|
| `slide` | **The Konami code** (↑ ↑ ↓ ↓ ← → ← → B A), in any calm scene. The room becomes a badly made group-meeting slide: the room's name as a title with *(preliminary)* after it, its first sentences as bullets in three sizes, a bullet in red, *Results look very promising!!*, *Future work: everything*, a clip-art beaker, *Slide 13 of 47 · CONFIDENTIAL*. It's a dialog: *No questions* closes it. It has no motion, it follows high contrast, and it does nothing in an uneasy or dread scene. | as described | the same slide: 「（初步）」、「結果看起來非常有希望！！」、「未來工作：全部」、「第 13 頁，共 47 頁 · 機密」、「沒有問題」 |
| `bed` | **Opening the game at 03:33 local time.** The title's tagline changes. | *It's 03:33. Go to bed.* | 「03:33 了。去睡覺。」 |
| `mole` | **23 October.** The title's tagline changes. | *23 October: Mole Day. Somewhere, 6.022 × 10²³ PhD students are still in the lab.* | 「10 月 23 日，莫耳日。全世界大概有 6.022 × 10²³ 個研究生還在實驗室。」 |
| `squid.*` | **Squiddy.** A squid doodle signed *Squiddy* is in a different room each loop (Acts I–II): loop 1 the synthesis lab, 2 the stairwell, 3 the cold room, 4 the glovebox room, 5 the roof, 6 the Research Write-Up Room, then round again. Each sighting is an anomaly and is kept in the gallery, so the set can be finished across playthroughs. Finding all six writes `nb.squiddy` and earns *Cephalopod Census*. | see below | see below |
| `credits` | **The credits** (a new *Credits* button on the title). The last line is *Reviewer 2 — uncredited (as requested)*. Taiwanese academia says "Reviewer 2" in English too. | *Reviewer 2 — uncredited (as requested)* | 「Reviewer 2——應本人要求，不具名」 |
| `darkcontrol` | **The dark control.** The dark room (`synth.darkroom`, *Go into the dark room* /「進暗房」) offers, once you know about 03:33 and if you came straight there (before 02:51): *Run the dark control: lamp off, until 03:33* /「做暗對照組：關燈，一直待到 03:33」. At 03:33, `lo.darkcontrol` writes `nb.darkcontrol` and earns *Dark Control*. | `nb.darkcontrol`: *Catalyst, CO₂, solvent; no light; 02:47 to 03:33. Result: nothing happened, as expected. (Repeat in triplicate for the SI.)* | 「催化劑、CO₂、溶劑；不照光；02:47 到 03:33。結果：什麼都沒發生，跟預期一樣。（SI 要做三重複。）」 |
| `balance` | **The balance** in 4.12: *Tare the balance* /「把天平歸零」, three times in one night (1 min each). | 1: *0.0000 g. Then 0.0002. Then 0.0005, climbing gently, as if it's thinking about something.* 2: *0.0000. Then −0.0003, which is worse.* 3: *The display goes blank, thinks, and comes back in percentage mode, which nobody has ever used on purpose: 104 %. Of what, it doesn't say.* | 1:「0.0000 g。然後 0.0002。然後 0.0005，慢慢往上爬，好像在想事情。」2:「0.0000。然後 −0.0003，這更糟。」3:「螢幕暗了一下，想了想，切成了百分比模式。從來沒有人是故意用這個模式的：104 %。一百零四趴的什麼，它沒說。」 |
| `pa.test` | **PA announcement**, 02:55, in a calm hub (Acts I–II). | *Bing-bong. A recorded voice, very calm: This is a test of the public address system. If you can hear this message, you are in the building. Bing-bong.* | 「叮咚。一個錄好的女聲，非常冷靜：This is a test of the public address system. If you can hear this message, you are in the building. 叮咚。對，你還在。」 |
| `pa.car` | **PA announcement**, 03:12, in a calm hub (Acts I–II). | *Bing-bong. Would the owner of the blue estate car in the car park please move it. It has been there since September. This is the final announcement. Bing-bong.* | 「叮咚。停車場那台藍色旅行車的車主，請移車。這台車從九月就停在這裡了。這是最後一次廣播。叮咚。上個月也說是最後一次。」 |

The six squid (calm, Acts I–II; joke keys `fun.squid.<room>`):

| Room | EN | 繁中 |
|---|---|---|
| 4.12 | *On the tape along your fume hood's sash, in biro, a squid the size of a thumbnail, holding a tiny round-bottomed flask. Under it, very small: Squiddy.* | 「抽氣櫃拉門的膠帶上，一隻指甲大小的烏賊，原子筆畫的，一隻手拿著一個小小的圓底燒瓶。底下很小的字：Squiddy。」 |
| Stairwell | *In the margin of Femi's crossword, in a biro that isn't Femi's: a squid in a hi-vis jacket. Squiddy.* | 「Femi 的填字遊戲旁邊，用不是 Femi 的原子筆畫著一隻穿反光背心的烏賊。Squiddy。」 |
| B.05 | *On a frosted label on the −80's door, in marker: a squid in a woolly hat. Squiddy, it says, and, smaller, brr.* | 「負八十冰箱門上一張結霜的標籤，麥克筆畫著一隻戴毛帽的烏賊。Squiddy，旁邊小小的：好冷。」 |
| 4.14 | *In the dust on the outside of the glovebox's window, drawn with a fingertip: a squid with all its arms in the gloves. Squiddy.* | 「手套箱窗戶外側的灰塵上，有人用指尖畫了一隻烏賊，每一隻手都伸進了手套裡。Squiddy。」 |
| Roof | *In chalk on the side of the plant unit, half rained away: a squid under an umbrella that isn't helping. Squiddy.* | 「空調機組側面，粉筆畫的，被雨沖掉了一半：一隻撐著傘的烏賊，傘一點用都沒有。Squiddy。」 |
| 4.08 | *On a Post-it stuck to the kettle: a squid holding a mug in every arm, all ten of them. Squiddy.* | 「熱水壺上貼著一張便利貼：一隻烏賊，十隻手每一隻都拿著一個馬克杯。Squiddy。」 |

`nb.squiddy` (the reward, in *Anomalies*): *Six squid, six rooms, one signature. Nobody in the group is called Squiddy. You checked.* /「六隻烏賊，六個房間，同一個簽名。組上沒有人叫 Squiddy。你查過了。」 The gallery draws a seventh squid beside the anomaly count.

## 8. Rooms: examine and flavour lines

Lines are calm and Acts I–II unless the entry says otherwise. *(new)* marks a new choice. *(+)* marks a paragraph added to an existing look.

### 4.08 Research Write-Up Room

- `office.plate` *(new)*: see §4.2.
- `office.pencil` *(new, under Look around the room)*, *Pick up the pencil on the floor* /「撿起地上的鉛筆」 (2 min, a `localisedVariant`). This is an anomaly (`coshh`) and earns *Risk Assessed*.
  - EN: *Department policy, laminated by the door, is that nothing is handled without a COSHH assessment, so you fill one in. Substance: pencil (graphite, clay, cedar). Hazard: splinters. Route of exposure: you will chew it. Control measures: don't. PPE: gloves, goggles, lab coat. Supervisor's signature: Dan is in Boston. You pick it up anyway, which is how most things in this building get done.*
  - 繁中：「門邊護貝的系上規定說，任何東西都要先做 COSHH 風險評估才能碰。（英國的 COSHH，大概等於毒化物申報加一張核銷單，再乘以三。）你還是填了一張。Substance：鉛筆（石墨、黏土、雪松木）。Hazard：木刺。Route of exposure：你會咬它。Control measures：不要咬。PPE：手套、護目鏡、實驗衣。Supervisor's signature：老闆在波士頓。你沒等簽名就撿起來了，這棟樓裡大部分的事都是這樣辦成的。」
- `office.thesis` *(new, on the monitor)*, *Open your thesis chapter* /「打開你的論文第四章」 (1 min). This is the photocatalysis one.
  - EN: *Chapter 4, which you have been writing since June. The catalyst outperforms commercial P25 by a factor of 3.7 under visible light (λ > 420 nm) and remains stable for 5 cycles. Binding energies were calibrated to C 1s at 284.8 eV. The apparent quantum yield was not determined. You read it back. It sounds exactly like every paper you have ever rolled your eyes at, and it's yours.*
  - 繁中：「第四章，你從六月寫到現在。本催化劑在可見光（λ > 420 nm）下活性為商用 P25 的 3.7 倍，可穩定循環 5 次。結合能以 C 1s 284.8 eV 校正。表觀量子效率未測定。你從頭讀了一遍。聽起來跟每一篇你翻過白眼的 paper 一模一樣，而這篇是你寫的。」
- `office.macbook` *(new, cameo, under Look around the room)*, *Look at the MacBook on the next desk* /「看隔壁桌的 MacBook」 (1 min). This is an anomaly (`cameo.macbook`).
  - EN: *On the desk beside yours, somebody's MacBook, lid open, fan whispering, running VASP. The output scrolls slowly past: energies, forces, a number getting smaller. It's converging. Nobody knows how.*
  - 繁中：「隔壁桌上，某人的 MacBook 開著，風扇小聲地轉，在跑 VASP。輸出一行一行慢慢捲過去：能量、力，一個越來越小的數字。它在收斂。沒有人知道為什麼。」
- `office.lanyard.off`: see §4.4. Available in every act, and it is Act III's one light line here.
- `squid.office`: loop 6, 12, … (§7).

### 4.12 Synthesis lab and the dark room

- `synth.door.*` *(new)*: see §4.6.
- `synth.tare` *(new)*: see §7, `balance`.
- `synth.hoods` *(+)* `fun.synth.tlc`. Tom's TLC plate, where everything sits at Rf 0.3. It is a `localisedVariant`.
  - EN: *In Tom's hood, propped against his beaker, a TLC plate he has clearly given up on: starting material, product and co-spot all sitting at exactly Rf 0.3, side by side, as if they've agreed something. Down the sash, in his capitals, a column of attempts: TRY 4:1. TRY 9:1. TRY 19:1. TRY A DIFFERENT PROJECT.*
  - 繁中：「Tom 的抽氣櫃裡，燒杯旁邊靠著一片他顯然已經放棄的 TLC 片：起始物、產物、co-spot 全停在 Rf 0.3，並排，好像私下講好了。拉門上是他一行一行的大寫字：TRY 4:1。TRY 9:1。TRY 19:1。TRY A DIFFERENT PROJECT。最後一個，在台灣叫做換老闆。」
- `synth.sorry` *(new)*, after you have looked into the hoods. EN *Apologise to the fume hood*, 繁中「在抽氣櫃上放一包乖乖」. This is an anomaly (`sorry`), earns *Sorry* /「乖乖保佑」, and is a `localisedVariant`.
  - EN: *Its sash alarm has been beeping since you lifted the sash to look in. You lower it to the yellow line and say sorry, out loud, to a fume hood. It stops. You've never been sure which of you that says more about.*
  - 繁中：「剛剛把拉門拉太高，它就一直嗶嗶叫。你把拉門拉回黃線，從抽屜拿出一包綠色的乖乖（一定要綠色的），立在窗框上。它不叫了。學長說，這招對 NMR 也有效。」
- `synth.whiteboard` *(new, cameo)*, *Look at the whiteboard* /「看白板」. This is an anomaly (`cameo.whiteboard`) and is quiet.
  - EN: *The whiteboard by the door has been wiped by someone in a hurry: half a band diagram, a conduction band and a valence band, and an electron rubbed out mid-jump. In the corner, still there, underlined twice: ZnIn₂S₄.*
  - 繁中：「門邊的白板被誰匆匆擦過：一張能帶圖只剩一半，導帶、價帶，一顆電子跳到一半被擦掉了。角落還留著，底下畫了兩條線：ZnIn₂S₄。」
- `synth.darkroom` *(new scene)*, *Go into the dark room* /「進暗房」 (1 min). It is calm in Acts I–II and uneasy in Act III.
  - EN (Acts I–II): *The dark room is a cupboard with ambitions: a blackout curtain, a xenon lamp in a fan-cooled box, a stirrer plate, and on the lamp housing a strip of tape in Tom's capitals: VISIBLE LIGHT (λ > 420 nm). Under it, smaller: (MOSTLY HEAT).*
  - 繁中 (Acts I–II): 「暗房其實是一個很有抱負的儲藏室：遮光簾、一台裝在散熱箱裡的氙燈、一台攪拌器。燈罩上貼著一條膠帶，Tom 的大寫字：VISIBLE LIGHT (λ > 420 nm)。底下小一點：(MOSTLY HEAT)。」
  - Act III (quiet): *The dark room, darker. The lamp is off. You have the feeling it has been off for a long time, and that the dark in here is not the kind anybody switched on.* /「暗房更暗了。燈是關著的。你覺得它已經關了很久，而這裡的黑，不是任何人關燈關出來的。」
  - The dark control: see §7. The choice that runs it is plain: *You switch off the lamp, draw the curtain and sit in the dark with the stirring flask, because every result needs its control.* /「你關掉燈，拉上簾子，跟那瓶還在攪拌的反應一起坐在黑暗裡。每一個結果都需要一個對照組。」
- `squid.synth`: loop 1, 7, … (§7).

### 4.14 Glovebox room

- `glovebox.terminal` *(new, cameo)*, *Look at the terminal by the door* /「看門邊的終端機」. This is an anomaly (`cameo.boforge`) and is quiet.
  - EN: *The group's terminal by the door, logged in as nobody in particular. On its bezel, a sticky note in green biro: ask bo-forge what to run next.*
  - 繁中：「門邊組上的那台終端機，登入的帳號不屬於任何人。螢幕邊框貼著一張便利貼，綠色原子筆：ask bo-forge what to run next。」
- `squid.glovebox`: loop 4, 10, … (§7).

### 4.01 and the corridor

- `pi.corridor` *(new)*: see §4.8.
- `pi.photo.lanyard`, `pi.box.lanyard`: see §4.4. Quiet, not jokes. `pi.hub` gets no new joke.

### Stairwell and lobby

- `stairs.lift` and `stairs.plan` *(new)*: see §4.5.
- `stairs.toilets` *(new)*: see §4.7.
- `stairs.entrance` *(+)*: the shuttle timetable, §4.3.
- PA announcements: §7.
- `squid.stairs`: loop 2, 8, … (§7).

### B12 NMR suite

- `nmr.chart` *(new)*, *Read the chart by the console* /「看控制台旁邊的表」 (1 min). The values are Gottlieb's, as every chemist half-remembers them. It is a `localisedVariant`.
  - EN: *Taped by the console, Ian's laminated table: PEAKS THAT ARE NOT YOUR PRODUCT. In CDCl₃: 7.26, the solvent; 1.56, water; 2.17, acetone; 0.86 and 1.26, grease. In C₆D₆: 7.16, 0.40, 1.55, 0.92 and 1.36. At the bottom, someone has added a row in biro: 8.41 — hope.*
  - 繁中：「控制台旁邊貼著 Ian 護貝的表：PEAKS THAT ARE NOT YOUR PRODUCT。CDCl₃：7.26 溶劑、1.56 水、2.17 丙酮、0.86 和 1.26 油脂。C₆D₆：7.16、0.40、1.55、0.92 和 1.36。最底下有人用原子筆加了一行：8.41 — hope。再底下，另一個人的字：許願池。」
- `nmr.rack` *(new, cameo)*, *Look at the tube rack on the bench* /「看桌上的 NMR 管架」. This is an anomaly (`cameo.rack`).
  - EN: *On the bench by the console, a 3D-printed rack for NMR tubes: forty-eight positions in six neat rows, each one numbered, in the particular orange only a 3D printer would choose. Someone designed it properly. It is the only thing down here that isn't laminated.*
  - 繁中：「控制台旁的桌上，一個 3D 列印的 NMR 管架：四十八個孔，排成六排，每個都編了號，是只有 3D 印表機才會選的那種橘色。有人很認真地設計過它。這是樓下唯一一個沒有被護貝的東西。」
- `nmr.terminal` *(new)*: log back in to the console (§5).
- Nothing new in Act III: the room is `dread` there.

### B.05 Cold room

- `cold.freezer` *(+)* `fun.cold.box`. The −80 box nobody throws away. It is a `localisedVariant`.
  - EN: *On the top shelf, at the front, where it has been for longer than anyone in the group: a box labelled DO NOT THROW AWAY — K., 2009. Nobody knows who K. was. Nobody has thrown it away.*
  - 繁中：「最上層最前面，待得比組上任何人都久的一個盒子：DO NOT THROW AWAY — K., 2009。沒有人知道 K. 是誰，也沒有人敢丟。每個實驗室都有一盒；台灣的通常寫「學長的，勿丟」。」
- `cold.fridge` *(new)*, *Open the fridge marked NO FOOD* /「打開寫著 NO FOOD 的冰箱」 (1 min). It is a `localisedVariant`.
  - EN: *NO FOOD OR DRINK — CHEMICALS ONLY, says the door, in Ian's capitals. Inside: a boronic acid, three NMR solvents and a meal deal (sandwich, crisps, drink), labelled TOM'S — DO NOT TOUCH (this means you), best before last Tuesday.*
  - 繁中：「門上是 Ian 的大寫字：NO FOOD OR DRINK — CHEMICALS ONLY。裡面：一瓶硼酸、三瓶氘代溶劑，和一份 meal deal（三明治、洋芋片、飲料），貼著「Tom 的——別碰（就是在說你）」，賞味期限是上週二。英國超商的三明治套餐，第一年覺得划算，第二年吃到想哭。」
- `squid.cold`: loop 3, 9, … (§7).

### Roof

- `roof.railing` *(new, cameo)*, *Look at the railing* /「看欄杆」. It shows in every act. This is an anomaly (`cameo.railing`). It is a quiet moment, not a joke. The Chinese stands in both locales and is translated in neither.
  - EN: *Scratched small and careful into the paint of the railing, a line of Chinese: 下一秒想去看海. The rain has been at it for years and hasn't got it out. You don't know who wrote it. You stand next to it for a while anyway.*
  - 繁中：「欄杆的漆上，有人很小、很仔細地刻了一行字：下一秒想去看海。雨洗了好幾年，也沒把它洗掉。你不知道是誰刻的。你還是在它旁邊站了一會兒。」
- `squid.roof`: loop 5, 11, … (§7).

### The notebook: marginalia from past-you

From loop 3, faint pencil marginalia sit beside some entries. They are in your hand, and you don't remember writing them. Each is a joke key, shown only in the notebook.

| Entry | EN | 繁中 |
|---|---|---|
| `nb.tlc` | *label your vials. you didn't.* | 「瓶子要貼標籤。你沒貼。」 |
| `nb.yield` | *the balance isn't drifting. you are.* | 「天平沒有在飄。是你在飄。」 |
| `nb.purge` | *three. stop counting on your fingers inside the gloves.* | 「三次。戴著手套就不要用手指數了。」 |
| `nb.reset` | *bring a torch. (you won't.)* | 「帶手電筒。（你不會帶的。）」 |
| `nb.ian` | *he has a sign for this too.* | 「這個他也有一張告示。」 |

## 9. Where there are no jokes

- The 03:33 lights-out card, every lights-out rule, the 02:47 page and the act title cards.
- Act III's dark run and peak match, and the B12 NMR suite in Act III.
- Every ending epilogue except Fire Alarm (whose lift line is now consistent with the lift) and Clocking Off's lanyard beat.
- The portal's declaration, Y.C.'s box, her mug and drawer, her email.

## 10. Cut, and why

This section is filled in by the final localisation pass (M7's last PR), after two cold read-throughs: one in English only, one in 繁中 only.
