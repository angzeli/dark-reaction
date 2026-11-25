# Humour, in-jokes and anomalies (v1.1.0)

> **Spoilers.** This is the full list of what v1.1.0 hides in the building, and how to find each thing. The release notes give only a count. The README says only: *There are things in the building that aren't in the manual.* /「這棟樓裡，有些東西不在手冊上。」

This document is the source of truth for the M7 *Anomalies* milestone, in the same way as `DESIGN.md` is for the game. When code and this document disagree, one of them is wrong. Every string below is in the game in both languages, under the key given. Both languages are originals. Where they tell different jokes, the entry says so and its key is flagged `localisedVariant` in the registry.

---

## 1. Tone rules

These rules come first. Each joke below has been checked against them, and the validator enforces the parts a machine can check.

1. **Humour lives in the margins.** It belongs in optional examine text, item descriptions, the console, notebook marginalia, achievements (said at the foot of the screen, never inside a passage), signs and PA announcements. It is never in the 03:33 transitions (the lights-out card, the lights-out rules, the 02:47 page that follows), never in Act III's climax (the dark run and the peak match), and never in an ending epilogue, except Fire Alarm and the lanyard beat in Clocking Off.
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
| `office.hub` | calm | calm | uneasy | |
| `office.around` (new: *Look around the room*) | calm | calm | uneasy | Act III's one light line here: taking your lanyard off. |
| `office.monitor` | calm | calm | uneasy | |
| `office.process` | uneasy | uneasy | uneasy | Where two fudges live. No jokes. |
| `office.declare.own`, `office.declare.printout` | dread | dread | dread | The box you tick. |
| `office.desk7` | uneasy | uneasy | uneasy | Her mug. |
| `synth.hub` | calm | calm | uneasy | |
| `synth.around` (new: *Look around the lab*) | calm | calm | uneasy | |
| `synth.darkroom` (new) | calm | calm | uneasy | |
| `glovebox.hub` | calm | calm | uneasy | |
| `glovebox.logbook` | uneasy | uneasy | uneasy | A fudge. |
| `pi.door` | calm | calm | uneasy | The professors' corridor. |
| `pi.hub` | uneasy | uneasy | dread | |
| `pi.box` | dread | dread | dread | |
| `stairs.hub` | calm | calm | uneasy | |
| `stairs.lift` (new: *Go over to the lift*) | calm | calm | uneasy | Act III's one light line here: the shuttle's timetable. |
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

Events: the two PA announcements fire only in calm rooms indoors (never over the porter's radio, on the roof or in the toilets), and only in Acts I–II. `ev.keeps` (03:33) and every lights-out rule are tagged `dread`.

## 4. Campus in-jokes

For anyone who studied in a building like this one; they should mean nothing to anyone else. §4–§8 list every line as shipped, quoted from the locale tables (after the cold read-throughs, §10). *Joke* marks a joke key; *quiet*, a line that isn't one.

### 4.1–4.2 B12 and the Research Write-Up Room

Location names change in both locales (display strings only). The console banner names no university. Under *Look around the room* /「環顧這個房間」 (`office.around`, quiet: *Eleven desks, ten of them empty. For the first time in weeks you look round the room properly, the way a visitor would.*):

- `fun.plate` (joke, localisedVariant): *Read the plate on the door* (Acts I–II, 1 min). Anomaly `plate`.
  - EN: *RESEARCH WRITE-UP ROOM*, says the plate on the door, which is optimistic on both counts.
  - 繁中：門牌上寫著 *RESEARCH WRITE-UP ROOM*。大家都叫它「寫不完的房間」。

### 4.3 The shuttle

The timetable is its own look by the main doors (in the lift spot), not the line after you find you are locked in. The `shuttle` command is in §5. Clocking Off walks past the stop (quiet).

- `fun.shuttle.timetable` (joke): *Read the shuttle timetable by the doors* (`stairs.timetable`, every act; the stairwell's one light line in Act III). Anomaly `shuttle.timetable`.
  - EN: Beside the doors, behind scratched perspex, the shuttle timetable: *LAST SERVICE 18:15*. It is 02:51.
  - 繁中：門邊，刮花的壓克力板後面，是接駁車時刻表：*LAST SERVICE 18:15*。現在是 02:51。連接駁車都下班了。
- `ending.clocking.shuttle` (quiet): Clocking Off, after you leave your laptop.
  - EN: The service road takes you round the side of the building and out past the shuttle stop. Nobody is waiting at it, and nothing is coming. You walk on to the night bus.
  - 繁中：卸貨區的小路繞過大樓側邊，經過接駁車的站牌。沒有人在等，也不會有車來。你繼續往前走，去搭夜車。

### 4.4 Lanyards

`item.lanyard` is given at every 02:47 (`onLoopStart`). *Around your neck: your lanyard.* shows only where it can come off (under *Look around the room*, in the toilets). Taking it off sets `lanyard.offEver`.

- `fun.lanyard.off` (joke): *Take your lanyard off* (0 min), in `office.around` and the toilets. Anomaly `lanyard.off`.
  - EN: You take it off. You feel slightly less like yourself.
  - 繁中：你把它拿下來。整個人好像少了一點自己。
- `lanyard.on.r` (quiet): *Put your lanyard back on*.
  - EN: You put it back on. There you are.
  - 繁中：你把它戴回去。好了，你又是你了。
- `pi.photo.lanyard` (quiet): Dan's office, the 2018 photo.
  - EN: She is the only one in the photo still wearing her lanyard.
  - 繁中：照片裡，只有她還戴著識別證。
- `pi.box.lanyard` (quiet): Her box.
  - EN: Her lanyard isn’t in the box.
  - 繁中：箱子裡沒有她的識別證。
- `fun.clocking.lanyard` (joke, localisedVariant): Clocking Off, after the building goes dark, if you are wearing it: the one joke that epilogue has.
  - EN: On the night bus, somewhere around four, you notice you’re still wearing your lanyard. Visible at all times.
  - 繁中：夜車上，快四點的時候，你才發現識別證還掛在脖子上。你下班了，它還沒。

### 4.5 The lift and the floor plan

*Go over to the lift* /「走到電梯那邊」 (`stairs.lift`, a spot of its own). The sofa's and Fire Alarm's lift no longer move.

- `fun.lift.r` (joke): The spot's text, Acts I–II. Anomaly `lift`.
  - EN: On 0 the lift is waiting with its doors open, as it always is.
  - 繁中：電梯停在 0 樓，門開著，跟平常一樣在等。
- `fun.lift.again` (joke): Added from loop 2, Acts I–II. Anomaly `lift`.
  - EN: It was waiting like this at 03:33, too. Whatever the night does to the building, nobody has told the lift.
  - 繁中：03:33 的時候，它也是這樣開著門在等。不管這一夜對這棟樓做了什麼，好像都沒人通知電梯。
- `stairs.lift.act3` (quiet): Act III, instead. Anomaly `lift`.
  - EN: On 0 the lift is waiting with its doors open. It has been waiting all night, every night. Tonight, for the first time, you wonder who for.
  - 繁中：電梯停在 0 樓，門開著。它等了一整夜，每一夜都是。今晚你第一次想：它在等誰。
- `fun.lift.press` (joke): *Press 4* (Acts I–II, 1 min).
  - EN: You step in and press 4. The doors stay open. After a while you step out again and take the stairs, like everyone does.
  - 繁中：你走進去，按了 4。門沒有要關的意思。過了一會兒你走出來，跟大家一樣爬樓梯。
- `fun.plan` (joke): *Read the floor plan by the lift* (Acts I–II, 1 min). B12 on the building's own signs.
  - EN: A fire evacuation plan in a steel frame, one panel per floor, *YOU ARE HERE* on 0. In the basement, *B.05 COLD ROOM* and *B12 NMR*, numbered in two different systems.
  - 繁中：鋼框裡一張逃生平面圖，一層一格，*YOU ARE HERE* 標在 0 樓。地下室是 *B.05 COLD ROOM* 和 *B12 NMR*，兩種編號系統。

### 4.6 The lab door

*Read the notices on the lab door* (3 min, Acts I–II). One poster a night (`loopMod: [5, k]`); each read sets `poster.k`; all five earn *Mandatory Training*.

- `fun.labdoor` (joke): Every night. Anomaly `labdoor`.
  - EN: Lab 4.12’s door has been papered over so many times it is mostly paper. *LAB COATS MUST BE WORN BEYOND THIS POINT*, half under *NO LAB COATS IN CORRIDORS*, which is where you are standing to read it. *EYE PROTECTION MUST BE WORN*, and newer, beside it: *(THIS MEANS GOGGLES, NOT YOUR GLASSES)*. *FIRE DOOR: KEEP SHUT*, on a door wedged open with a Winchester.
  - 繁中：4.12 的門被貼了太多層，幾乎已經是紙做的了。*LAB COATS MUST BE WORN BEYOND THIS POINT*，一半壓在 *NO LAB COATS IN CORRIDORS* 底下，而你現在就站在走廊上看。*EYE PROTECTION MUST BE WORN*，旁邊一張比較新的：*(THIS MEANS GOGGLES, NOT YOUR GLASSES)*。*FIRE DOOR: KEEP SHUT*，貼在一扇被一大罐丙酮頂開的門上。
- `fun.labdoor.poster.0` (joke): Loop 1, 6, … Anomaly `labdoor`.
  - EN: In the middle, this month’s safety poster: *IS YOUR SASH AT THE CORRECT HEIGHT?* A cartoon fume hood gives you a thumbs up. Its sash is at the wrong height.
  - 繁中：正中間是這個月的安全海報：*IS YOUR SASH AT THE CORRECT HEIGHT?* 一座卡通抽氣櫃對你比讚。它的拉門拉錯高度了。
- `fun.labdoor.poster.1` (joke): Loop 2, 7, …
  - EN: In the middle, this month’s safety poster: *SLIPS, TRIPS AND FALLS: THE MOST COMMON LABORATORY INJURY.* Someone has drawn an arrow to the cable across the doorway and written *still here*.
  - 繁中：正中間是這個月的安全海報：*SLIPS, TRIPS AND FALLS.* 有人畫了一個箭頭，指向門口地上那條延長線，旁邊寫著 *still here*。從你一年級就在那裡了。
- `fun.labdoor.poster.2` (joke): Loop 3, 8, …
  - EN: In the middle, this month’s safety poster: *IS YOUR LAB COAT BUTTONED?* Nobody’s is.
  - 繁中：正中間是這個月的安全海報：*IS YOUR LAB COAT BUTTONED?* 沒有一個人的有扣。
- `fun.labdoor.poster.3` (joke, localisedVariant): Loop 4, 9, …
  - EN: In the middle, this month’s safety poster: *LONE WORKING: NEVER WORK ALONE OUT OF HOURS. TELL SOMEONE WHERE YOU ARE.* You think about who you would tell.
  - 繁中：正中間是這個月的安全海報：*LONE WORKING: NEVER WORK ALONE OUT OF HOURS.* 你想了一下，凌晨三點要告訴誰。老闆在波士頓，應該醒著。
- `fun.labdoor.poster.4` (joke): Loop 5, 10, …
  - EN: In the middle, this month’s safety poster: *KNOW WHERE YOUR NEAREST EYEWASH IS.* The arrow points at a wall.
  - 繁中：正中間是這個月的安全海報：*KNOW WHERE YOUR NEAREST EYEWASH IS.* 箭頭指著一面牆。

### 4.7–4.8 The toilets and the professors' corridor

The toilets are `unrecorded`: the notebook says nothing is written there, and 03:33 there is logged with no place. The corridor's three signs are verbatim; no door has a name.

- `stairs.toilets.text` (quiet): *Go into the toilets* (by the lift, 1 min). Anomaly `toilets`.
  - EN: A laminated sign on the door: *NO NETWORK ACCESS*. Inside it is warm and very quiet, and the hand dryer’s little light is the only thing awake. You take your notebook out from habit and find there is nothing to write. For a minute nothing is keeping a record of you, not even you.
  - 繁中：門上貼著一張護貝的告示：*NO NETWORK ACCESS*。裡面很暖，很安靜，只有烘手機的小燈還醒著。你習慣性地拿出筆記本，發現沒有什麼可以寫。有一分鐘，沒有任何東西在記錄你，連你自己也沒有。
- `ui.notebook.unrecorded` (quiet): The notebook, opened in the toilets.
  - EN: Nothing is being written down in here.
  - 繁中：在這裡，什麼都不會被記下來。
- `fun.corridor` (joke): *Look along the corridor* outside Dan's door (Acts I–II, 1 min). Anomaly `corridor`.
  - EN: Along this end of the corridor, three more professors’ doors, all dark, none with a name on it. Each has a sign. *Big OP is here.* *Running out of money soon.* *Don’t laugh at students.*
  - 繁中：這一段走廊還有三扇教授的門，都暗著，都沒有名牌，只各貼了一張紙：*Big OP is here.* *Running out of money soon.* *Don’t laugh at students.*

## 5. The console

Hidden commands work while the console is open in Acts I–II; *Log back in to the console* (`nmr.terminal`) reopens a solved one. In Act III they are `command not found`. Software output stays as the software prints it.

- `sudo` → `cmd.sudo` (earns *This Incident Will Be Reported*)
  - EN: ar4217 is not in the sudoers file. This incident will be reported to your PI.
  - 繁中：ar4217 不在 sudoers 名單裡。此事件將回報給你的老闆。
- `rm -rf /` → `cmd.rm`
  - EN: rm: cannot remove ‘/’: it has been laminated. — I.O.
  - 繁中：rm：無法刪除 ‘/’：已護貝。——I.O.
- `xyzzy` → `cmd.xyzzy`
  - EN: Nothing happens.
  - 繁中：什麼事都沒發生。
- `vasp` → `cmd.vasp`
  - EN:  ZBRENT: fatal error in bracketing ·      please rerun with smaller EDIFF, or copy CONTCAR ·      to POSCAR and continue
  - 繁中： ZBRENT: fatal error in bracketing ·      please rerun with smaller EDIFF, or copy CONTCAR ·      to POSCAR and continue
- `g16` → `cmd.g16` (earns *Normal Termination*)
  - EN:  Normal termination of Gaussian 16 at Mon Nov 23 02:51:00 2026.
  - 繁中： Normal termination of Gaussian 16 at Mon Nov 23 02:51:00 2026.
- `ping supervisor` → `cmd.ping` (earns *Instant Reply*)
  - EN: PING supervisor (Boston): 56 data bytes · 64 bytes from supervisor: icmp_seq=0 ttl=52 time=0.4 ms ·   any news??
  - 繁中：PING 老闆（波士頓）：56 data bytes · 64 bytes from 老闆：icmp_seq=0 ttl=52 time=0.4 ms ·   進度？
- `history` → `cmd.history`
  - EN:   1  queue --all ·   2  info 13 ·   3  info 13 ·   4  cancel 13 ·   5  info 13 ·   6  man sleep ·   7  info 13 ·   8  who ·   9  exit ·  10  exit ·  11  exit
  - 繁中：  1  queue --all ·   2  info 13 ·   3  info 13 ·   4  cancel 13 ·   5  info 13 ·   6  man sleep ·   7  info 13 ·   8  who ·   9  exit ·  10  exit ·  11  exit
- `uptime` → `cmd.uptime`
  - EN:  02:51:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33
  - 繁中： 02:51:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33
- `top` → `cmd.top`
  - EN:   PID USER      %CPU   TIME+  COMMAND ·     1 root       0.0  1247d   init ·  3333 ar4217   100.0  46:00   you ·  4217 ar4217     0.0   0:00   sleep <defunct>
  - 繁中：  PID USER      %CPU   TIME+  COMMAND ·     1 root       0.0  1247d   init ·  3333 ar4217   100.0  46:00   you ·  4217 ar4217     0.0   0:00   sleep <defunct>
- `man sleep` → `cmd.man`
  - EN: SLEEP(1)                User Commands                SLEEP(1) ·  · NAME ·        sleep - delay for a specified amount of time ·  · SYNOPSIS ·        sleep NUMBER[SUFFIX]... ·  · BUGS ·        Not available between 02:47 and 03:33.
  - 繁中：SLEEP(1)                使用者指令                SLEEP(1) ·  · 名稱 ·        sleep —— 延遲指定的時間 ·  · 用法 ·        sleep NUMBER[SUFFIX]... ·  · 已知問題 ·        02:47 至 03:33 之間無法使用。
- `git blame` → `cmd.blame`
  - EN: a3f9c21 (ar4217  2026-11-23 03:32)  chapter 4 · a3f9c21 (ar4217  2026-11-23 03:32)  figure 3 · a3f9c21 (ar4217  2026-11-23 03:32)  everything else
  - 繁中：a3f9c21 (ar4217  2026-11-23 03:32)  第 4 章 · a3f9c21 (ar4217  2026-11-23 03:32)  圖 3 · a3f9c21 (ar4217  2026-11-23 03:32)  其他全部
- `ls` → `cmd.ls`, localisedVariant
  - EN: data/  queue.sh  DO_NOT_DELETE/ · thesis_final.docx  thesis_final_v2.docx  thesis_final_v3_FINAL.docx · thesis_final_v7_FINAL.docx  thesis_final_v7_FINAL_actually.docx
  - 繁中：data/  queue.sh  DO_NOT_DELETE/ · 論文_最終版.docx  論文_最終版_v2.docx  論文_最終版_老闆改過.docx · 論文_最終版_老闆改過_真的不改了.docx
- `cat thesis_final_v7_FINAL_actually.docx` → `cmd.thesis`
  - EN: PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@ … The apparent quantum yield was not determined. ^@^@^@
  - 繁中：PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@ … 表觀量子效率未測定。^@^@^@
- `shuttle` → `cmd.shuttle`
  - EN: Last service: 18:15. It is 02:51.
  - 繁中：末班車：18:15。現在是 02:51。
- `who` → `cmd.who`
  - EN: ar4217   pts/0   02:41 (4.08-desk-04) · ycl      pts/1   2019-03-14 03:33
  - 繁中：ar4217   pts/0   02:41 (4.08-desk-04) · ycl      pts/1   2019-03-14 03:33

## 6. Achievements

Said once, quietly, at the foot of the screen (a polite status), never in the passage, and not when the action crossed the dark. Locked ones show *Under review* /「審查中」.

| Id | EN | 繁中 | How |
|---|---|---|---|
| `normal` | **Normal Termination**: Gaussian 16 finished without complaint. | **正常結束**：Gaussian 16 沒有抱怨就跑完了。 | anomaly `cmd.g16` |
| `reply` | **Instant Reply**: 64 bytes from Boston, at 3 a.m. | **老闆秒回**：你這邊凌晨三點，老闆秒回。 | anomaly `cmd.ping` |
| `reported` | **This Incident Will Be Reported**: Tried sudo on a shared spectrometer. | **已通報老闆**：在共用的儀器上打了 sudo。 | anomaly `cmd.sudo` |
| `visible` | **Visible at All Times**: Reached an ending without once taking your lanyard off. | **識別證永不離身**：從頭到尾都沒把識別證拿下來，就走到了結局。 | `{"all":[{"ended":true},{"not":{"flag":"lanyard.offEver"}}]}` |
| `coshh` | **Risk Assessed**: Completed a COSHH assessment for a pencil. | **跑完流程**：替一支鉛筆跑完了一整套流程。 | anomaly `coshh` |
| `uncredited` | **Uncredited (As Requested)**: Read the credits all the way down. | **匿名審查**：把製作名單看到了最後一行。 | anomaly `credits` |
| `training` | **Mandatory Training**: Read every safety poster on the lab door. | **安全講習時數已滿**：看完了門上每一張安全海報。 | `{"all":[{"flag":"poster.0"},{"flag":"poster.1"},{"flag":"poster.2"},{"flag":"poster.3"},{"flag":"poster.4"}]}` |
| `sorry` | **Sorry**: Apologised to a fume hood. | **乖乖保佑**：在抽氣櫃上放了一包綠色乖乖。 | anomaly `sorry` |
| `writingup` | **Writing-Up Year**: Thirteen loops and counting. | **延畢**：第十三個迴圈了，還在。 | `{"loopGte":13}` |
| `tea` | **Make Tea First**: Did what your own handwriting told you. | **先泡茶**：照你自己的筆跡說的做了。 | choose `office.tea` while `{"all":[{"minuteLt":1},{"know":"ph.tea"}]}` |
| `dark` | **Dark Control**: Nothing happened, as expected. | **暗對照組**：什麼都沒發生，跟預期一樣。 | anomaly `darkcontrol` |
| `yield` | **104% Yield**: The balance, in percentage mode. | **一百零四趴**：天平自己切成了百分比模式。 | anomaly `balance` |
| `slide` | **Any Questions?**: Presented a room at group meeting. | **被電**：在 meeting 上報告了一個房間。 | anomaly `slide` |
| `bed` | **Go to Bed**: Opened the game at 03:33. | **快去睡**：凌晨 03:33 打開了這個遊戲。 | anomaly `bed` |
| `mole` | **Mole Day**: Played on 23 October. | **莫耳日快樂**：在 10 月 23 日玩了這個遊戲。 | anomaly `mole` |
| `census` | **Cephalopod Census**: Found Squiddy in all three rooms. | **烏賊點名**：三個房間的 Squiddy 都找到了。 | `{"all":[{"anomaly":"squid.synth"},{"anomaly":"squid.glovebox"},{"anomaly":"squid.office"}]}` |

## 7. Hidden eggs

The Konami code (↑ ↑ ↓ ↓ ← → ← → B A) turns a calm room into a group-meeting slide (nothing in an uneasy or dread scene). The title notices 03:33 and Mole Day. The credits' last line. Squiddy in one of three rooms each loop (Acts I–II): 4.12 under *Look around the lab*, the glovebox room, the office under *Look around the room*. The dark control and the balance in 4.12 (under *Look around the lab*). The PA in calm rooms indoors (never over the porter's radio, on the roof or in the toilets), Acts I–II, never at 03:33.

- `slide.preliminary` (joke): The slide's title, after the room's name. Anomaly `slide`, earns *Any Questions?*.
  - EN: (preliminary)
  - 繁中：（初步）
- `slide.promising` (joke): The slide's red bullet. Anomaly `slide`, earns *Any Questions?*.
  - EN: Results look very promising!!
  - 繁中：結果蠻 promising 的！！
- `slide.future` (joke): The slide's last bullet. Anomaly `slide`, earns *Any Questions?*.
  - EN: Future work: everything
  - 繁中：未來工作：全部
- `slide.footer` (joke): The slide's footer. Anomaly `slide`, earns *Any Questions?*.
  - EN: Slide 13 of 47 · CONFIDENTIAL — DO NOT DISTRIBUTE
  - 繁中：第 13 頁，共 47 頁 · 機密，請勿外流
- `slide.close` (joke): The slide's close button. Anomaly `slide`, earns *Any Questions?*.
  - EN: No questions
  - 繁中：Q&A（請不要）
- `title.egg.bed` (joke): The title's tagline at 03:33 local time. Anomaly `bed`, earns *Go to Bed*.
  - EN: It’s 03:33. Go to bed.
  - 繁中：03:33 了。去睡覺。
- `title.egg.mole` (joke, localisedVariant): The title's tagline on 23 October. Anomaly `mole`, earns *Mole Day*.
  - EN: 23 October: Mole Day. Somewhere, a mole of PhD students is still in the lab.
  - 繁中：10 月 23 日，莫耳日。世界上某個地方，有一莫耳的研究生還在實驗室。
- `credits.reviewer` (joke): The credits' last line. Anomaly `credits`, earns *Uncredited (As Requested)*.
  - EN: Reviewer 2 — uncredited (as requested)
  - 繁中：Reviewer 2——應本人要求，不具名
- `fun.squid.synth` (joke): Loop 1, 4, 7, … Anomaly `squid.synth`.
  - EN: On the tape along your fume hood’s sash, in biro, a squid the size of a thumbnail, holding a tiny round-bottomed flask. Under it, very small: *Squiddy*.
  - 繁中：抽氣櫃拉門的膠帶上，一隻指甲大小的烏賊，原子筆畫的，一隻手拿著一個小小的圓底燒瓶。底下很小的字：*Squiddy*。
- `fun.squid.glovebox` (joke): Loop 2, 5, 8, … Anomaly `squid.glovebox`.
  - EN: In the dust on the outside of the glovebox’s window, drawn with a fingertip: a squid with all its arms in the gloves. *Squiddy.*
  - 繁中：手套箱窗戶外側的灰塵上，有人用指尖畫了一隻烏賊，每一隻手都伸進了手套裡。*Squiddy*。
- `fun.squid.office` (joke): Loop 3, 6, 9, … Anomaly `squid.office`.
  - EN: On a Post-it stuck to the kettle: a squid with a mug in each of its eight arms and two more in its tentacles. *Squiddy.*
  - 繁中：熱水壺上貼著一張便利貼：一隻烏賊，八隻腕各拿一個馬克杯，兩條觸腕又各拿一個。*Squiddy*。
- `nb.squiddy.body` (joke): The notebook, at the 02:47 after all three are found (also earns *Cephalopod Census*, and a seventh squid by the gallery's counter).
  - EN: Three squid, three rooms, one signature. Nobody in the group is called Squiddy. You checked.
  - 繁中：三隻烏賊，三個房間，同一個簽名。組上沒有人叫 Squiddy。你查過了。
- `fun.darkroom` (joke): *Go into the dark room*, Acts I–II.
  - EN: The dark room is a cupboard with ambitions: a blackout curtain, a xenon lamp in a fan-cooled box, a stirrer plate, and on the lamp housing a strip of tape in Tom’s capitals: *VISIBLE LIGHT (λ > 420 nm)*. Under it, smaller: *(MOSTLY HEAT).*
  - 繁中：說是暗房，其實是掛了遮光簾的儲藏室：一台裝在散熱箱裡的氙燈、一台攪拌器。燈罩上貼著一條膠帶，Tom 那手方方正正的字：*VISIBLE LIGHT (λ > 420 nm)*。底下小一點：*(MOSTLY HEAT)*。
- `synth.darkroom.act3` (quiet): The dark room in Act III.
  - EN: The dark room, darker. The lamp is off. You have the feeling it has been off for a long time, and that the dark in here is not the kind anybody switched on.
  - 繁中：暗房更暗了。燈是關著的。你覺得它已經關了很久，而這裡的黑，不是任何人關燈關出來的。
- `synth.darkcontrol.r` (quiet): *Run the dark control* (before 02:51, once you know about 03:33; runs to 03:33).
  - EN: You switch off the lamp, draw the curtain and sit in the dark with the stirring flask, because every result needs its control.
  - 繁中：你關掉燈，拉上簾子，跟那瓶還在攪拌的反應一起坐在黑暗裡。每一個結果都需要一個對照組。
- `synth.darkcontrol.late.r` (quiet): *Think about a dark control*, later in the night.
  - EN: A proper dark control would mean coming straight here at 02:47 and sitting out the whole night with the lamp off. Not tonight, then.
  - 繁中：要做一個像樣的暗對照組，得在 02:47 就直接過來，關著燈坐滿一整夜。今晚是來不及了。
- `nb.darkcontrol.body` (joke): The notebook, at the next 02:47. Anomaly `darkcontrol`, earns *Dark Control*.
  - EN: Catalyst, CO₂, solvent; no light; 02:47 to 03:33. Result: nothing happened, as expected. (Repeat in triplicate for the SI.)
  - 繁中：催化劑、CO₂、溶劑；不照光；02:47 到 03:33。結果：什麼都沒發生，跟預期一樣。（SI 要做三重複。）
- `fun.tare.1` (joke): *Tare the balance*, first time. Anomaly `balance`, earns *104% Yield*.
  - EN: You tare it. 0.0000 g. Then 0.0002. Then 0.0005, climbing gently.
  - 繁中：你按了歸零。0.0000 g。然後 0.0002。然後 0.0005，慢慢往上爬。
- `fun.tare.2` (joke): Second time. Anomaly `balance`, earns *104% Yield*.
  - EN: You tare it again. 0.0000. Then −0.0003, which is worse.
  - 繁中：再歸零一次。0.0000。然後 −0.0003，這更糟。
- `fun.tare.3` (joke): Third time. Anomaly `balance`, earns *104% Yield*.
  - EN: A third time. The display goes blank and comes back in percentage mode, which nobody has ever used on purpose: *104 %*. Of what, it doesn’t say.
  - 繁中：第三次。螢幕暗了一下，切成了百分比模式，從來沒有人是故意用這個模式的：*104 %*。一百零四趴的什麼，它沒說。
- `fun.pa.test` (joke, localisedVariant): 02:55. Anomaly `pa.test`.
  - EN: *Bing-bong.* A recorded voice, very calm: *This is a test of the public address system. If you can hear this message, you are in the building.* *Bing-bong.*
  - 繁中：叮咚。一個錄好的女聲，非常冷靜：*This is a test of the public address system. If you can hear this message, you are in the building.* 叮咚。對，你還在。
- `fun.pa.car` (joke, localisedVariant): 03:12. Anomaly `pa.car`.
  - EN: *Bing-bong.* *Would the owner of the blue estate car in the car park please move it. It has been there since September. This is the final announcement.* *Bing-bong.*
  - 繁中：叮咚。同一個女聲，請停車場那台藍色旅行車的車主移車，說它從九月就停在那裡了，這是最後一次廣播。叮咚。上個月也說是最後一次。

## 8. Rooms: examine and flavour lines

Optional looks, gated out of Act III unless marked.

- `fun.pencil` (joke): *Pick up the pencil on the floor* (`office.around`, 2 min). Anomaly `coshh`, earns *Risk Assessed*.
  - EN: Department policy, laminated by the door, is that nothing is handled without a COSHH assessment, so you fill one in. *Substance:* pencil (graphite, clay, cedar). *Hazard:* splinters. *Route of exposure:* you will chew it. *Control measures:* don’t. *PPE:* gloves, goggles, lab coat. *Supervisor’s signature:* Dan is in Boston. You pick it up anyway, which is how most things in this building get done.
  - 繁中：門邊護貝的系上規定說，任何東西都要先做風險評估才能碰，所以你填了一張。*Substance*：鉛筆（石墨、黏土、雪松木）。*Hazard*：木刺。*Route of exposure*：你會咬它。*Control measures*：不要咬。*PPE*：手套、護目鏡、實驗衣。*Supervisor’s signature*：老闆在波士頓。你沒等簽名就撿起來了，這棟樓裡大部分的事都是這樣辦成的。
- `fun.thesis` (joke): *Open your thesis chapter* (on your monitor).
  - EN: Chapter 4, which you have been writing since June. *The catalyst outperforms commercial P25 by a factor of 3.7 under visible light (λ > 420 nm) and remains stable for 5 cycles. Binding energies were calibrated to C 1s at 284.8 eV. The apparent quantum yield was not determined.* You read it back. It sounds exactly like every paper you have ever rolled your eyes at, and it’s yours.
  - 繁中：第 4 章，你從六月寫到現在。*本催化劑在可見光（λ > 420 nm）下活性為商用 P25 的 3.7 倍，可穩定循環 5 次。結合能以 C 1s 284.8 eV 校正。表觀量子效率未測定。* 你從頭讀了一遍。聽起來跟每一篇你翻過白眼的 paper 一模一樣，而這篇是你寫的。
- `fun.macbook` (joke): Cameo: *Look at the MacBook on the next desk* (`office.around`). Anomaly `cameo.macbook`.
  - EN: On the desk beside yours, somebody’s MacBook, lid open, fan whispering, running VASP. The output scrolls slowly past: energies, forces, a number getting smaller. It’s converging. Nobody knows how.
  - 繁中：隔壁桌上，某人的 MacBook 開著，風扇小聲地轉，在跑 VASP。輸出一行一行慢慢捲過去：能量、力，一個越來越小的數字。它在收斂。沒有人知道為什麼。
- `fun.synth.tlc` (joke): Added to *Look into the fume hoods*.
  - EN: In Tom’s hood, propped against his beaker, a TLC plate he has clearly given up on: starting material, product and co-spot all sitting at exactly Rf 0.3, side by side, as if they’ve agreed something. Down the sash, in his capitals, a column of attempts: *TRY 4:1. TRY 9:1. TRY 19:1. TRY A DIFFERENT PROJECT.*
  - 繁中：Tom 的抽氣櫃裡，燒杯旁邊靠著一片他顯然已經放棄的 TLC 片：起始物、產物、co-spot 全停在 Rf 0.3，並排，好像私下講好了。拉門上是他一行一行的大寫字：*TRY 4:1。TRY 9:1。TRY 19:1。TRY A DIFFERENT PROJECT.*
- `synth.sorry` (joke, localisedVariant): A choice once you have looked into the hoods. Anomaly `sorry`, earns *Sorry*.
  - EN: Apologise to the fume hood
  - 繁中：在抽氣櫃上放一包乖乖
- `fun.sorry` (joke, localisedVariant): Its result. Anomaly `sorry`, earns *Sorry*.
  - EN: As you turn away, your hood’s airflow alarm starts up, the way it does whenever anyone so much as looks at it. You say sorry to it, out loud. It stops. You’ve never been sure which of you that says more about.
  - 繁中：你一轉身，你那座抽氣櫃的風速警報又嗶嗶叫了，它每次被人看一眼就會這樣。你從抽屜拿出一包綠色乖乖，立在窗框上。它不叫了。學長說，這招對 NMR 也有效。
- `synth.whiteboard.r` (quiet): Cameo: *Look at the whiteboard* (`synth.around`, every act). Anomaly `cameo.whiteboard`.
  - EN: The whiteboard by the door has been wiped by someone in a hurry: half a band diagram, a conduction band and a valence band, and an electron rubbed out mid-jump. In the corner, still there, underlined twice: ZnIn₂S₄.
  - 繁中：門邊的白板被誰匆匆擦過：一張能帶圖只剩一半，導帶、價帶，一顆電子跳到一半被擦掉了。角落還留著，底下畫了兩條線：ZnIn₂S₄。
- `glovebox.terminal.r` (quiet): Cameo: *Look at the terminal by the door* (every act). Anomaly `cameo.boforge`.
  - EN: The group’s terminal by the door, logged in as nobody in particular. On its bezel, a sticky note in green biro: *ask bo-forge what to run next*.
  - 繁中：門邊組上的那台終端機，登入的帳號不屬於任何人。螢幕邊框貼著一張便利貼，綠色原子筆：*ask bo-forge what to run next*。
- `fun.chart` (joke, localisedVariant): *Read the chart by the console* (B12).
  - EN: Taped by the console, Ian’s laminated table: *PEAKS THAT ARE NOT YOUR PRODUCT.* In CDCl₃: 7.26, the solvent; 1.56, water; 2.17, acetone; 0.86 and 1.26, grease. In C₆D₆: 7.16, 0.40, 1.55, 0.92 and 1.36. At the bottom, someone has added a row in biro: *8.41 — hope.*
  - 繁中：控制台旁邊貼著 Ian 護貝的表：*PEAKS THAT ARE NOT YOUR PRODUCT.* CDCl₃：7.26 溶劑、1.56 水、2.17 丙酮、0.86 和 1.26 油脂。C₆D₆：7.16、0.40、1.55、0.92 和 1.36。最底下有人用原子筆加了一行：*8.41 — hope.* 再底下，另一個人的字：*+1*。
- `fun.rack` (joke): Cameo: *Look at the tube rack on the bench* (B12). Anomaly `cameo.rack`.
  - EN: On the bench by the console, a 3D-printed rack for NMR tubes: forty-eight positions in six neat rows, each one numbered, in the particular orange only a 3D printer would choose. Someone designed it properly.
  - 繁中：控制台旁的桌上，一個 3D 列印的 NMR 管架：四十八個孔，排成六排，每個都編了號，一看就是 3D 印的那種橘。有人很認真地設計過它。
- `fun.cold.box` (joke): Added to *Open the −80 freezer*.
  - EN: As the door swings to, you catch the box on the top shelf, at the front, where it has been for longer than anyone in the group: *DO NOT THROW AWAY — 2009*. Nobody knows whose it is. Nobody has thrown it away.
  - 繁中：門闔上之前，你瞥見最上層最前面那個盒子，待得比組上任何人都久：*DO NOT THROW AWAY — 2009*。沒有人知道是誰的，也沒有人敢丟。
- `fun.cold.fridge` (joke): *Open the fridge marked NO FOOD*.
  - EN: *NO FOOD OR DRINK — CHEMICALS ONLY*, says the door, in Ian’s capitals. Inside: a boronic acid, three NMR solvents and a meal deal, labelled *TOM’S. I HAVE COUNTED THE CRISPS.*
  - 繁中：門上是 Ian 的大寫字：*NO FOOD OR DRINK — CHEMICALS ONLY*。裡面：一瓶硼酸、三瓶氘代溶劑，和一份 meal deal，貼著「Tom 的。洋芋片我數過了。」
- `roof.tank.r` (quiet): Cameo: *Look at the water tank* (roof, every act). A quiet moment, not a joke. Anomaly `cameo.tank`.
  - EN: Scratched small and careful into the paint on the side of the water tank, at the height you’d see it from the deckchair, a line of Chinese: 下一秒想去看海. The rain has been at it for years and hasn’t got it out. You don’t know who wrote it. You sit with it for a while anyway.
  - 繁中：水塔側面的漆上，有人很小、很仔細地刻了一行字，高度剛好是坐在躺椅上看得到的地方：下一秒想去看海。雨洗了好幾年，也沒把它洗掉。你不知道是誰刻的。你還是陪它坐了一會兒。
- `nb.aside.tlc` (joke): The notebook's margin, beside *The fractions*, from the third night.
  - EN: label your vials. you didn’t.
  - 繁中：瓶子要貼標籤。你沒貼。
- `nb.aside.yield` (joke): Beside *Yield*.
  - EN: the balance isn’t drifting. you are.
  - 繁中：天平沒有在飄。是你在飄。
- `nb.aside.ian` (joke): Beside *Ian Okoro*.
  - EN: he has a sign for this too.
  - 繁中：這個他也有一張告示。


## 9. Where there are no jokes

- The 03:33 lights-out card, every lights-out rule, the 02:47 page and the act title cards.
- Act III's dark run and peak match, and the B12 NMR suite in Act III.
- Every ending epilogue except Fire Alarm (whose lift line is now consistent with the lift) and Clocking Off's lanyard beat.
- The portal's declaration, Y.C.'s box, her mug and drawer, her email.

## 10. Cut, and why

Two subagents that hadn't seen the work played through cold before the last PR: one in English only, one in 繁中 only, each with the game (through the headless driver) and a one-language list of every new line. What they flagged was cut or rewritten, not defended. The exceptions are the few things the brief asked for verbatim, listed last, where only my framing around them was cut.

**Moved, for the content boundary.**
- **The roof's 下一秒想去看海** was scratched into the railing. Both readers raised it. With a researcher who vanished, a line about the sea on the edge of a roof can read as a hint of a fall, which `DESIGN.md` §1 rules out. It is still on the roof, still untranslated in both languages, still a quiet moment, but on the side of the water tank, seen from the deckchair, and you sit with it rather than stand at the edge.
- **The floor plan's *The roof isn't on it. Officially, nobody goes up there.*** went for the same reason.

**Cut (both languages).**
- **The `coshh`, `orca` and `make coffee` commands.** A third risk-assessment joke, and three computational chemistry packages on a spectrometer was two too many. The console keeps fifteen.
- **The risk-assessment safety poster**, which repeated the COSHH pencil in the same room. A different poster replaces it.
- **Explaining tails:**
  - *Three minutes later you know exactly what you must and mustn't do…* on the lab door;
  - *depending on who was in charge of signs that year* on the floor plan;
  - *This isn't that kind of adventure* after `xyzzy`;
  - *(sandwich, crisps, drink)*.
- **Two of past-you's margins:**
  - *bring a torch. (you won't.)*, which winked at the player beside the 03:33 entry, the horror's main beat;
  - *three. stop counting on your fingers…*, unclear in 繁中 and nothing in English.
- **Three of Squiddy's six doodles** (the hi-vis, the woolly hat, the umbrella): whimsy, not dry. Three rooms remain.
- **Every gloss line** under the console's software output in 繁中 (學長, 爆肝, 兩個使用者？): they captioned the joke like a variety show.

**Cut (繁中 only), where the gloss was a translator's note.**
- 換老闆 after Tom's plate;
- 「學長的，勿丟」 after the −80's box;
- the meal deal's explanation;
- the British ground floor's;
- COSHH's (now 風險評估);
- the corridor's three explanations (the signs now stand bare, as in English);
- 「跟系上的規定一模一樣」.

**Rewritten.**
- **The fume hood's apology** had no cause: its alarm now starts as you turn away, the way it does whenever anyone looks at it.
- **The lab door's *KEEP THIS DOOR SHUT* / *FIRE DOOR: KEEP CLEAR*** don't contradict each other (a chemist would know). Now: *FIRE DOOR: KEEP SHUT*, on a door wedged open with a Winchester (繁中: 一大罐丙酮).
- **The thesis file** said chapter 4 was only a heading, which contradicted the chapter you can read. Now it ends on *The apparent quantum yield was not determined.*
- **`git blame`** printed a caption, and was Reviewer 2's fourth appearance. Now it's in-world output, and every line is yours, at 03:32 tonight.
- **The −80's box** lost the initial *K.*, which read as a clue in a story built on Y.C.L. It's now caught as the door swings shut.
- **Tom's label on the fridge** repeated his hood's word for word: *TOM'S. I HAVE COUNTED THE CRISPS.*
- **Mole Day**: *a mole of PhD students*, which is the actual pun.
- **Clocking Off's lanyard beat**: *On the night bus, somewhere around four…*.
- **Fewer things that *think***: the lift's doors, and the balance.
- **Squiddy's mugs**: eight arms and two tentacles, not ten arms.
- **繁中**:
  - the achievements 「一百零四趴」 and 「你這邊凌晨三點，老闆秒回」 (Boston isn't at 3 a.m.);
  - the slide's 「Q&A（請不要）」 and 「結果蠻 promising 的！！」;
  - 許願池 became 「+1」;
  - the car announcement is paraphrased, as the first one is;
  - the dark room and the tube rack are less translated-sounding;
  - `ls` lists 論文_最終版_老闆改過_真的不改了.docx, and `cat` takes it.

**Changed in play.**
- **Achievements** printed inside the passage, three at once under the console's log-out. They now go to the status line at the foot of the screen, which screen readers hear.
- **The lanyard line** was on every screen, even the 02:47 wake-up: noise. It now shows only where the lanyard can come off.
- **The shuttle's timetable** came straight after *CARD NOT VALID AT THIS TIME*, the moment you find you're locked in. It is now its own look by the doors.
- **The 03:12 PA** talked over the porter's shipping forecast. The PA is no longer heard in the stairwell's hub, or on the roof.
- **4.12 was overloaded.** The door is shorter, and the squid are fewer.

**Kept, because the brief asked for them.**
- **The professors' three signs**, verbatim. Both readers found them opaque, which is what an insider joke is for an outsider; only my 繁中 glosses were cut.
- **`shuttle`**, though it repeats the timetable. The brief asks for both, and for this exact output.
- **`cat thesis_final_v7_FINAL_actually.docx`** and **`git blame`**: rewritten, as above, not cut.
- **The sticky note about bo-forge** and **the tube rack**: personal cameos, kept. The rack lost its *isn't laminated* tail, the laminated gag's fifth outing.
