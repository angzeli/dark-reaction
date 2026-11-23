# v1.0.1 playtest screenshots

Screenshots from the three playtest passes, each linked from the issue it shows. The first pass played fd9de92, the build just before #87; the second, the build with the first pass's fixes; the third, the build with every fix. Layer 2 screenshots are the AI playtesters' own (`scripts/qa/drive.ts`, 1440×900 or 390×844); Layer 3's are from the sweep (`scripts/qa/sweep.ts`). JPEG, quality 70–80. The report is [`../PLAYTEST-REPORT.md`](../PLAYTEST-REPORT.md).

| Screenshot | Issue |
|---|---|
| [`door-wait-0317.jpg`](door-wait-0317.jpg) | #101 Waiting at Dan’s door through 03:15 never opens it |
| [`space-focus-choice1.jpg`](space-focus-choice1.jpg) | #102 Space or Enter after the text has finished makes choice 1 |
| [`space-picks-choice1.jpg`](space-picks-choice1.jpg) | #102 Space or Enter after the text has finished makes choice 1 |
| [`toast-over-text.jpg`](toast-over-text.jpg) | #103 The save or load notice never goes away: it covers choices and text and keeps its language |
| [`toast-over-choice.jpg`](toast-over-choice.jpg) | #103 The save or load notice never goes away: it covers choices and text and keeps its language |
| [`toast-stays-english.jpg`](toast-stays-english.jpg) | #103 The save or load notice never goes away: it covers choices and text and keeps its language |
| [`antechamber-focus-lost.jpg`](antechamber-focus-lost.jpg) | #104 Focus drops out of a puzzle when the focused control disables itself |
| [`notebook-tabs-1.jpg`](notebook-tabs-1.jpg) | #105 Notebook tabs: arrows do nothing, and choosing a tab sends focus to the heading |
| [`notebook-tabs-2.jpg`](notebook-tabs-2.jpg) | #105 Notebook tabs: arrows do nothing, and choosing a tab sends focus to the heading |
| [`tlc-uv-silent.jpg`](tlc-uv-silent.jpg) | #106 TLC plate: switching on the UV lamp isn't announced, and spots share names |
| [`settings-overflow-xl.jpg`](settings-overflow-xl.jpg) | #107 Settings runs off a phone screen at the larger text sizes |
| [`settings-overflow-xl-2.jpg`](settings-overflow-xl-2.jpg) | #107 Settings runs off a phone screen at the larger text sizes |
| [`console-clipped-1.jpg`](console-clipped-1.jpg) | #108 NMR console on phones and by keyboard: output cut off, input squeezed, silent results |
| [`console-clipped-2.jpg`](console-clipped-2.jpg) | #108 NMR console on phones and by keyboard: output cut off, input squeezed, silent results |
| [`console-input-narrow.jpg`](console-input-narrow.jpg) | #108 NMR console on phones and by keyboard: output cut off, input squeezed, silent results |
| [`console-no-focus-ring.jpg`](console-no-focus-ring.jpg) | #108 NMR console on phones and by keyboard: output cut off, input squeezed, silent results |
| [`reset-focus-offscreen.jpg`](reset-focus-offscreen.jpg) | #110 After 03:33 focus sits off screen; opening a puzzle or the console scrolls its top under the header |
| [`hud-covers-console.jpg`](hud-covers-console.jpg) | #110 After 03:33 focus sits off screen; opening a puzzle or the console scrolls its top under the header |
| [`hud-covers-tlc.jpg`](hud-covers-tlc.jpg) | #110 After 03:33 focus sits off screen; opening a puzzle or the console scrolls its top under the header |
| [`puzzle-focus-ring-1.jpg`](puzzle-focus-ring-1.jpg) | #111 Focus rings inside puzzles are faint and ignore high contrast |
| [`puzzle-focus-ring-2.jpg`](puzzle-focus-ring-2.jpg) | #111 Focus rings inside puzzles are faint and ignore high contrast |
| [`ending-infinite-contrast.jpg`](ending-infinite-contrast.jpg) | #113 Infinite Loop: the faded repeats fail contrast without being marked as decoration |
| [`tlc-zh-template.jpg`](tlc-zh-template.jpg) | #114 繁中 TLC: 「量第 粗產物 道的斑點」 and half-width commas |
| [`forty-minutes-at-0330.jpg`](forty-minutes-at-0330.jpg) | #115 “Write it in your notebook” says forty minutes at 03:30 |
| [`travel-rereveal-1.jpg`](travel-rereveal-1.jpg) | #116 Opening the travel or wait menu retypes the passage and jumps to the top |
| [`travel-rereveal-2.jpg`](travel-rereveal-2.jpg) | #116 Opening the travel or wait menu retypes the passage and jumps to the top |
| [`doorlog-kinsoku.jpg`](doorlog-kinsoku.jpg) | #117 Small text and typography slips in both languages |
| [`slot-roman-act.jpg`](slot-roman-act.jpg) | #117 Small text and typography slips in both languages |
| [`zh-ppm-split.jpg`](zh-ppm-split.jpg) | #117 Small text and typography slips in both languages |
| [`tlc-uv-cost-before.jpg`](tlc-uv-cost-before.jpg) | #118 Puzzle actions that cost minutes don't say so |
| [`tlc-uv-cost-after.jpg`](tlc-uv-cost-after.jpg) | #118 Puzzle actions that cost minutes don't say so |
| [`freezer-cells-390.jpg`](freezer-cells-390.jpg) | #119 Tap targets under 44 px in the freezer, the TLC plate and the door log |
| [`hud-see-through.jpg`](hud-see-through.jpg) | #120 The sticky header is see-through, and the door log jumps when a time is set |
| [`doorlog-jump-1.jpg`](doorlog-jump-1.jpg) | #120 The sticky header is see-through, and the door log jumps when a time is set |
| [`doorlog-jump-2.jpg`](doorlog-jump-2.jpg) | #120 The sticky header is see-through, and the door log jumps when a time is set |
| [`door-wait-0317.jpg`](door-wait-0317.jpg) | #123 4.01’s picture shows the inside while you’re locked out |
| [`microsd-lost-at-0333.jpg`](microsd-lost-at-0333.jpg) | #127 An action that runs into 03:33 loses what it showed |
| [`freezer-asterisks.jpg`](freezer-asterisks.jpg) | #128 The freezer shows *asterisks* around “raw. all of it.” |
| [`desk7-loop1.jpg`](desk7-loop1.jpg) | #129 Hot desk 7: the picture shows the box opened from Loop 2 |
| [`desk7-box-open.jpg`](desk7-box-open.jpg) | #129 Hot desk 7: the picture shows the box opened from Loop 2 |

## Second pass (the build with the first pass's fixes)

| Screenshot | Issue |
|---|---|
| [`step-away-armed.jpg`](step-away-armed.jpg) | #140 Stepping away from a solved puzzle before its last button throws the solve away |
| [`step-away-reset.jpg`](step-away-reset.jpg) | #140 Stepping away from a solved puzzle before its last button throws the solve away |
| [`lightsout-skipped-1.jpg`](lightsout-skipped-1.jpg) | #141 A key or click already on its way skips 03:33 |
| [`lightsout-skipped-2.jpg`](lightsout-skipped-2.jpg) | #141 A key or click already on its way skips 03:33 |
| [`door-unlocks-twice.jpg`](door-unlocks-twice.jpg) | #142 Dan’s door unlocks twice, and from outside once you’re in (a regression from #131) |
| [`puzzle-no-menu-key.jpg`](puzzle-no-menu-key.jpg) | #143 Keys the README promises: M, N and Esc in puzzles, a tenth choice, arrows on the TLC plate |
| [`puzzle-space-scrolls.jpg`](puzzle-space-scrolls.jpg) | #144 A puzzle’s title scrolls away on Space, and an empty heading stays behind |
| [`lastminute-asterisks.jpg`](lastminute-asterisks.jpg) | #149 The last page before 03:33 reaches screen readers with *asterisks* |
| [`doorlog-nothing-older.jpg`](doorlog-nothing-older.jpg) | #147 The 03:25 printer told at 03:33, a countdown a minute off, and “Nothing older.” above older entries |
| [`tlc-uv-ring.jpg`](tlc-uv-ring.jpg) | #148 The focus ring vanishes on the UV-lit TLC plate, and the console’s input ignores high contrast |
| [`console-hc-ring.jpg`](console-hc-ring.jpg) | #148 The focus ring vanishes on the UV-lit TLC plate, and the console’s input ignores high contrast |
| [`console-lang-switch.jpg`](console-lang-switch.jpg) | #150 NMR console: a language switch scrolls the transcript to the top, and long commands aren’t wrapped |
| [`console-long-command.jpg`](console-long-command.jpg) | #150 NMR console: a language switch scrolls the transcript to the top, and long commands aren’t wrapped |
| [`doorlog-click-rounds.jpg`](doorlog-click-rounds.jpg) | #151 Door log: a click on the timeline rounds down to the earlier minute |
| [`choices-below-fold.jpg`](choices-below-fold.jpg) | #152 At 1440 × 900 most choices sit below the fold |
| [`mail-after-reading.jpg`](mail-after-reading.jpg) | #154 Second pass: reports looked at and left as designed |
| [`focus-after-0333.jpg`](focus-after-0333.jpg) | #154 Second pass: reports looked at and left as designed |
| [`filename-overflow-top.jpg`](filename-overflow-top.jpg) | #156 A long filename makes the page scroll sideways on a phone, and pushes 選單 off-screen |
| [`filename-overflow-line.jpg`](filename-overflow-line.jpg) | #156 A long filename makes the page scroll sideways on a phone, and pushes 選單 off-screen |
| [`filename-overflow-menu.jpg`](filename-overflow-menu.jpg) | #156 A long filename makes the page scroll sideways on a phone, and pushes 選單 off-screen |
| [`filename-overflow-medium.jpg`](filename-overflow-medium.jpg) | #156 A long filename makes the page scroll sideways on a phone, and pushes 選單 off-screen |
| [`kraken-port4-empty.jpg`](kraken-port4-empty.jpg) | #157 Room text that doesn’t follow the state: the Kraken’s port 4, the office “at 02:47”, the late purge’s meter |
| [`office-0247-later.jpg`](office-0247-later.jpg) | #157 Room text that doesn’t follow the state: the Kraken’s port 4, the office “at 02:47”, the late purge’s meter |
| [`fabrication-clock-1.jpg`](fabrication-clock-1.jpg) | #159 The three spectra don’t say what reading costs |
| [`fabrication-clock-2.jpg`](fabrication-clock-2.jpg) | #159 The three spectra don’t say what reading costs |
| [`zh-orphan-ma.jpg`](zh-orphan-ma.jpg) | #160 繁中 polish from the mobile player: spacing after English, “last night”, the foil, two antechambers alike |

## Third pass (the build with every fix)

| Screenshot | Issue |
|---|---|
| [`zh-orphan-suo.jpg`](zh-orphan-suo.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`zh-orphan-ma-large.jpg`](zh-orphan-ma-large.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`zh-split-minutes.jpg`](zh-split-minutes.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`doorlog-stacked-zh.jpg`](doorlog-stacked-zh.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`tlc-crude-label-zh.jpg`](tlc-crude-label-zh.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`note-title-under-close.jpg`](note-title-under-close.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`peakmatch-ppm-split.jpg`](peakmatch-ppm-split.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`hud-during-hold.jpg`](hud-during-hold.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
| [`freezer-back-in-slot.jpg`](freezer-back-in-slot.jpg) | #185 Third pass: 繁中 typesetting at the larger sizes, and small layout slips |
