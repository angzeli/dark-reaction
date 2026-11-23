# Playtest report: v1.0.1

The playtest QA pass after v1.0.0, run on 23 November 2026. Three layers of tools (`docs/qa/README.md`) went over the game: a headless state explorer and fuzzer, five AI playtesters in a real browser, and a screenshot sweep. Their findings were deduplicated into issues #101–#129 under the [Playtest (v1.0.1)](https://github.com/angzeli/dark-reaction/milestone/7) milestone, fixed in focused PRs, and checked again with a second pass.

## In short

- **The canary:** the NMR console bug a real player hit before v1.0.0 (#86, fixed in #87). Layers 1 to 3, as first built and run untold on the build before the fix, **did not catch it.** Layer 1 now does, unprompted (#99). Layer 2's playtesters can now start deep in the game, where they'd meet it.
- **Found:** three passes, 53 issues in all.
  - **First pass:** #101–#129. 8 majors, 13 minors and 8 polish; two are proposals.
  - **Second pass, on the fixed build:** 22 issues in #140–#162. 2 majors (a solved puzzle lost when you step away; a filename that pushed a phone's page sideways), 9 minors, 7 polish, three proposals, and a record of reports left as designed (#154).
  - **A cold review:** #163, found by reviewing the fix for #127. It also found #141, which the breaker had reported.
  - **No blockers in any pass:** no soft-lock, no crash, no lost save. Every invariant Layer 1 checks held across about 5.5 million states each pass.
- **Fixed:** every major and every minor, and all but one piece of polish, in PRs #131–#186 (table in §4).
- **Left:** five `needs-decision` proposals (#124, #125, #153, #161, #162), the 4.01 door art (#123), and choices below the fold on short screens (#152), which needs an art pass. §5 says why.
- **Third pass, on the build with every fix:** no blockers or majors.
  - **Layer 1:** 5.58 million states with no findings at all.
  - **Two players** (the breaker and the mobile player, who had found the second pass's majors): only minors and polish.
  - **The sweep:** nothing over WCAG's limits.
  - **What it did find:** 繁中 line breaks at the larger text sizes, and a few small layout slips, all fixed in #186 (#185).

## 0. The canary

The NMR console bug was reported from a real playthrough and fixed before v1.0.0. The fixing commit is f05f71a, *The NMR console stays findable: always in the room, and somewhere to type the code (#87)*, which closed #86. The build just before it is fd9de92.

Two things went wrong at once in fd9de92:
- **The console vanished.** Once solved, it offered only "Check the queue again", once a night, and then disappeared from the room until 02:47.
- **The code had nowhere to go.** A player who had learned Ian's priority code (RIDLEY-4) and came down without their NMR tube, which resets every night, had nowhere to type it and no hint why.

**How it was run.** A temporary worktree at fd9de92 was built, and the harness copied in uncommitted. All three layers then ran against it, without telling any playtester about the bug. The worktree was removed afterwards, and nothing from it was merged.

**Did the harness catch it? No.**

| Layer | Result | Why it missed |
|---|---|---|
| 1, the explorer and fuzzer | 5.5 M states over 102 nights, 2,000 fuzz runs: no errors. The only nearby finding was a warning that `nmr.console.again`, a once-a-night look, costs 2 minutes where docs/DESIGN.md says looks cost 1. | Every ending stayed reachable, so no soft-lock check fired. The player wasn't stuck in any sense the checks knew: they had a code, stood where it's used, and the room said nothing about it. |
| 2, five AI playtesters | None reported it. | None learned RIDLEY-4. It's on a sticky note in Dan's office, open three minutes a night; the one player who got in (the first-timer, loop 3) spent those minutes on her box and the cipher. About 220 commands from a new game didn't reach the bug's conditions. |
| 3, the screenshot sweep | Nothing. | A still screen can't show a choice that's missing at one moment of play. |

**What changed so it would have caught it:**
- **Layer 1: a key with nowhere to use it** (`scripts/qa/lib/affordance.ts`, #98/#99). When the player knows something a room's choices ask for, and only tonight's part is missing (an item, tonight's flag, the hour), the room must offer something that answers it.
  - On fd9de92 the explorer and the fuzzer each find the bug unprompted: *"In nmr.hub the player knows nb.priority, which nmr.run uses, but nothing here answers it (still missing: item.tube.own)"*, two steps from the dark route's third night.
  - On `main` it's silent.
  - A first version also fired on the Fire Alarm's two-fact gate and in Act I; limiting it to "only tonight's part missing" removed those false positives.
  - `tests/qa-affordance.test.ts` rebuilds the pre-#87 NMR suite and keeps the check able to find it.
- **Layer 2: players can start deep.** `drive.ts start --at <screen>` gives a player a save at any Layer 3 screen to Continue from, and `docs/qa/personas.md` asks for two of the five to start in Act II or III. The second pass did.

**The fix's regression test.** #87's three unit tests (`tests/content-act2.test.ts`, *the NMR console after it is solved (#86)*) fail on fd9de92 and pass on `main`, and its e2e covers both languages. So the fix had its regression tests, and nothing needed adding.

## 1. Layer 1: state exploration

**What it is.** `scripts/qa/explore.ts` drives the engine headless, with no UI.
- **The explorer** walks the reachable states breadth-first, one night at a time. It merges states that differ only in what can't matter later: spent looks, text-only knowledge, events with no effects. Each minute is sampled down to a budget, but every route's anchor state is kept, so each night of each ending's route is searched.
- **The fuzzer** is a seeded random walk that plays like a chaotic person: repeats, out of order, sequence breaks, waiting out the clock.

Both run the same checks at every step. `docs/qa/README.md` lists them all.
- **The rules of the loop:** items reset at 03:33 and knowledge persists; the clock only moves forward within a night, by exactly the cost the content (or docs/DESIGN.md's table) says.
- **Honesty:** no flag or item appears without an effect that gives it; a choice's label never promises a result its effects don't deliver; a solved puzzle stays solved.
- **Persistence:** save then load gives an identical state; switching language at any point changes nothing and renders in both; from every state some ending is still reachable.
- **A key with nowhere to use it:** added after the canary. When you know what a room asks for and only tonight's part is missing, the room must answer it.

| Pass | Build | States | Nights | Fuzz runs | Every ending reached | Errors | Warnings |
|---|---|---|---|---|---|---|---|
| Canary | fd9de92 | 5,505,987 | 102 | 2,000 | yes | 0 | 1 (×52,502) |
| Canary, after #99 | fd9de92 | (same) | | | | 1: the canary | 1 |
| Second | the first pass's fixes | 5,669,953 | 104 | 2,000 | yes | 0 | 0 |
| Third | every fix | 5,579,673 | 102 | 2,000 | yes | 0 | 0 |

**What it found.**
- **The canary**, once it could see it (§0).
- **One cost warning,** on the canary build: `nmr.console.again`, a once-a-night look, cost 2 minutes where docs/DESIGN.md says looks cost 1. #87 had already rewritten that choice, and it's gone on `main`.
- **Content that's never reached within budget:** 2–3 choices, 2–3 notebook pages and 6–8 text keys per pass, all deep in the dark route (its three failure pages, the second Schlenk run) or Act I's refusal of Ian's code. Each is covered by a directed unit test (`tests/content-endings.test.ts`, `tests/puzzles-act3.test.ts`), so this is sampling depth, not dead content.
- **"The true ending can't be reached from here", 3–35 times a pass,** as information: the explored graph is sampled, so a state's way back to Dark Reaction may simply not have been sampled. No state lost every ending.
- **Unreachable for good:** the first pass's `glovebox.mini.shut` could never be shown, because Act III needs the glovebox solved. #121 removed it.

**In CI and nightly.** A short fixed-seed run (40 states a minute, 300 fuzz runs) is part of `unit` (`tests/qa-explorer.test.ts`, `tests/qa-affordance.test.ts`). `.github/workflows/nightly-qa.yml` runs the long one (400 a minute, 5,000 fuzz runs) at 03:17 UTC with the day's seed, and fails on any error.

## 2. Layer 2: the AI playtesters

**How they played.** Each player was a separate agent with only the running preview build, the player-facing `README.md`, and the controller (`scripts/qa/drive.ts`: look, click, tap, type, IME, reload, resize, a11y snapshot). They had no source, design docs or hints, and nothing about known bugs. Each played until an ending or about 220 commands. Every command and screenshot is logged, which is where the repro steps in the issues come from. `docs/qa/personas.md` has the briefs.

### First pass (the canary build)

| Player | How | Reached | Found |
|---|---|---|---|
| First-timer | English, mouse, 1440 × 900 | Loop 4, Act II; six puzzles, no hints | The door that won't open while you wait at it (#101); her raw data lost at 03:33 (#127); "forty minutes" at 03:28 (#115); asterisks (#128); a double full stop (#117); the desk picture (#129) |
| Chemist | 繁中, mouse and keyboard | Loop 2, Act II | The door, again (#101); the TLC template in 繁中 (#114); "forty minutes" (#115); Space choosing (#102); translationese (#126); chemistry proposals (#124, #125) |
| Breaker | Anything; English, then 繁中 | Loop 3 | Space/Enter making choice 1 (#102); the notice that never clears (#103); the header covering puzzles (#110); "第I幕" (#117) |
| Mobile | 繁中, touch, 390 × 844 | Loop 2 | Settings off the screen at 特大 (#107); console output cut off (#108); the travel menu re-typing the page (#116); the see-through header (#120); tap targets (#119) |
| Accessibility | Keyboard, reduced motion, flicker off, high contrast | Loop 2 | Focus lost in the antechamber (#104); notebook tabs (#105); the silent UV lamp (#106); focus rings (#111); no headings (#112); screen-reader copy (#109) |

### Second pass (the build with the first pass's fixes)

Two players started deep, from saves in Act II and III (`start --at`), so the second half of the game was played too.

| Player | Start | Reached | Found |
|---|---|---|---|
| First-timer | New game | Act III, loop 4 | Asterisks in the last page's screen-reader copy (#149); the 03:25 printer told at 03:33, a countdown off by one, "Nothing older." (#147); door-log clicks rounding down (#151); choices below the fold (#152); a proposal for 4.12 at 03:33 (#153) |
| Chemist | Act II | Act II, loop 3 | The door unlocking twice, a regression from #131 (#142); the freezer note misleading in 繁中 (#145); chemistry (#146) |
| Breaker | Act II and III | Act III | **The UPS solve lost on stepping away (#140, major)**; a stray key skipping 03:33 (#141); M/Esc in puzzles (#143); Space scrolling a puzzle away (#144); the console after a language switch (#150) |
| Mobile | Act III | **Dark Reaction**, loop 8 | **A filename pushing the page sideways at 大 (#156, major)**; room text that doesn't follow the state (#157); the foil-less shortcut (#158); the three spectra's cost (#159); 繁中 polish (#160); two proposals (#161, #162) |
| Accessibility | New game | Loop 2 | The UV plate swallowing the focus ring, and high contrast missing the console (#148); an empty heading under a puzzle (#144) |

The second pass also produced reports that were looked at and left as designed, with the reasons recorded in #154. Examples: focus after 03:33 rests on the list so the passage is read first; an action that runs past 03:33 still happens, as docs/DESIGN.md says.

### Third pass (the build with every fix)

Two players, the breaker and the mobile player, who had found the second pass's two majors, played the build with every fix.

| Player | Start | Reached | Found |
|---|---|---|---|
| Breaker | Act II | Act II, loops 2–6; door log, cipher, freezer, her raw data | No blocker or major. The notebook and menu look live during the held minute; the freezer's button contradicts its text; notices sit over text (#185). A key pressed at the end of 03:33 may have chosen in the new loop: seen once, not reproduced in two re-runs. |
| Mobile | Act III, at 大 and 特大 | Act III, loop 4, to 03:30; the UPS, the printout | No blocker or major. 繁中 line breaks at the larger sizes: a lone character on the last line, a number split from its measure word (#185). The chirp's count isn't on screen with sound off (added to #161). |

**What held up under the breaker:**
- triple clicks and double Enters on everything;
- reloading during the 03:33 card and on the held page;
- switching language mid-puzzle;
- stepping away from a solved cipher;
- IME input with Enter on the choice list.

**Experience notes:**
- choice numbers shift as choices are used, so a remembered "Wait" key does something else;
- playing from a mid-Act III save, the chores each night needs (the fractions, the antechamber before 03:18) aren't spelled out again;
- the writing landed again, for both.

## 3. Layer 3: the screenshot sweep

**What it is.** `scripts/qa/sweep.ts` loads each of Layer 3's targets from a save and screenshots it. Targets are the title and its dialogs, every room in each act, the scenes inside rooms, all ten puzzles, all six endings, and the notebook and menu.
- **Where:** both languages at 390, 768 and 1440 px, plus reduced motion, high contrast, and (since the second pass) the largest text size on a phone.
- **Checks on each page:** overflow, clipped and overlapping text, 避頭尾 (a closing mark at the start of a line or an opening one at the end; …… and —— as unbroken pairs), tap targets, and axe.
- **Contact sheets:** it writes them for review.

**The glyph check.** The validator now checks every character of both locales against the subset fonts actually built (`npm run validate` runs the subsetter first). A character in neither font of its stack is an error. Five characters in the 繁中 text (≈ ÷ ₂ ₅ ₆) are in the Latin font rather than Noto Serif TC; they render, and are listed as warnings.

| Pass | Screenshots | With findings | What they were |
|---|---|---|---|
| Canary | 812 | 56 | Console output in a scroller no keyboard could reach (#108), 避頭尾 in the door log (#117), Infinite Loop's decoration (#113), and tap targets (#119). The rest were harness artefacts (off-screen sideways scrollers, labels measured wrongly), fixed in #173. |
| Second | 812 | 53 | The same artefacts, on a build without the harness fixes. |
| Third | 944 | 51 | Only tap targets under 44 px, every one of them at least WCAG 2.5.8's 24 px: the freezer's 9 × 9 box, the periodic table and the TLC spots at 390 px, which can't be 44 px and still fit. |

**Reviewing the screenshots.**
- In the first pass, each of the sweep's findings was checked against its screenshot. The second pass's sweep ran on the unfixed harness, and the third pass superseded it.
- The third pass's 144 sheets were read in three parallel reviews against a written checklist, with spot checks by me; every finding they raised was then checked on a real 390 px screen.
- The visual baselines: 63 of the 76 are byte-identical to an earlier CI render I reviewed image by image. The 13 that changed after the third pass's fixes were checked by pixel diff and by the tests that assert their layout, because the image viewer was unavailable at the end of the session. I had reviewed each of those screens in its earlier render. Their changes are only the cabinet signs and re-wrapped lines of text.
- **Real, at 390 px and the largest text, and fixed in #186:**
  - the door log's events stacked a character a line in 繁中;
  - 粗產物 ran into lane 10;
  - "Before you go in" ran under Close;
  - "+0.00 / ppm" split;
  - after her filename, 。 could start a line.
- **Artefacts of the full-page capture:** the sticky header over puzzle titles (on a real screen the title sits below it), and the load notice over text (the notice fades after 4 s, and the sweep's loader now clears it).

**Visual baselines.** 76 screens (`e2e/visual.spec.ts`; `docs/qa/README.md` says which). They're Linux renders from CI on the final tree, reviewed as described above, and they run in CI's `e2e` from #187 on.

## 4. What was fixed

Every fix started from a regression test that fails without it; the PR descriptions show the evidence. The large cases were reviewed cold by an agent that hadn't seen the work: the 03:33 hold (#139, #155) and the engine's new condition (#178).

| Issue | Severity | Found by | Fixed in |
|---|---|---|---|
| #101 Waiting at Dan's door through 03:15 never opens it | major | first-timer, chemist | #131 |
| #102 Space or Enter after the text makes choice 1 | major | breaker, chemist | #132 |
| #103 The save/load notice never goes away | major | breaker, sweep | #133 |
| #104 Focus drops out of a puzzle when its control disables itself | major | accessibility | #134 |
| #105 Notebook tabs aren't a tablist | major | accessibility | #135 |
| #106 The TLC plate's lamp is silent, and spots share names | major | accessibility | #137 |
| #107 Settings runs off a phone at the larger text sizes | major | mobile | #138 |
| #127 What a choice shows before 03:33 is lost | major | first-timer | #155 (replacing #139) |
| #140 A solved puzzle lost when you step away | major | breaker (pass 2) | #176 |
| #156 A long filename pushes a phone's page sideways | major | mobile (pass 2) | #177 |
| #108 The NMR console on phones and by keyboard | minor | sweep, mobile, accessibility, chemist | #164 |
| #109 Screen-reader copy with asterisks | minor | accessibility, chemist | #165 |
| #110 Focus after 03:33; puzzles opening under the header | minor | accessibility, breaker | #166 |
| #111 Faint focus rings in puzzles | minor | accessibility | #167 |
| #112 No headings | minor | accessibility | #166 |
| #113 Infinite Loop's decoration and contrast | minor | sweep | #173 (mis-filed: already hidden; the sweep now knows) |
| #114 繁中 TLC template | minor | chemist | #137 |
| #115 "Forty minutes" at 03:30 | minor | first-timer, chemist | #168 |
| #116 The travel and wait menus re-type the page | minor | mobile | #169 |
| #119 Tap targets in the freezer, plate and door log | minor | mobile, sweep | #172 |
| #141 A key or click on its way skips 03:33 | minor | breaker (pass 2), cold review | #155 |
| #142 Dan's door unlocks twice (a regression from #131) | minor | chemist (pass 2) | #178 |
| #143 M, N, Esc in puzzles; a tenth choice; arrows | minor | breaker, first-timer, accessibility (pass 2) | #183 |
| #144 Space scrolls a puzzle's title away; an empty heading | minor | breaker, accessibility (pass 2) | #181 |
| #145 繁中: the freezer note, translationese, spacing | minor | chemist (pass 2) | #179 |
| #148 Focus rings on the UV plate and the console in high contrast | minor | accessibility (pass 2) | #181 |
| #149 The last page before 03:33 read with asterisks | minor | first-timer (pass 2) | #181 |
| #157 Room text that doesn't follow the state | minor | mobile (pass 2) | #180 |
| #158 The foil-less Kraken shortcut's label | minor | mobile (pass 2) | #180 |
| #163 The held minute: double click, the Infinite Loop on reload | minor | cold review of #155 | #182 |
| #117 Text and typography slips | polish | first-timer, breaker, sweep | #170 |
| #118 Puzzle actions that cost minutes don't say so | polish | mobile, accessibility | #172 |
| #120 The see-through header; the door log's jump | polish | mobile | #166 |
| #121 A choice that could never be shown | polish | Layer 1 | #168 |
| #122 The late purge's label | polish | Layer 1 | #168 |
| #126 繁中 that reads like a translation | polish | chemist | #170 |
| #128 Asterisks in the freezer | polish | first-timer | #165 |
| #129 Hot desk 7's picture and text | polish | first-timer | #168 |
| #146 Chemistry a chemist frowns at | polish | chemist (pass 2) | #179 |
| #147 The printer at 03:33, a countdown, "Nothing older." | polish | first-timer (pass 2) | #180 |
| #150 The console after a language switch; long commands | polish | breaker (pass 2) | #184 |
| #151 Door-log clicks round down | polish | first-timer (pass 2) | #184 |
| #159 The three spectra's cost | polish | mobile (pass 2) | #184 |
| #160 繁中 polish from the mobile player | polish | mobile (pass 2) | #179 |
| #185 繁中 typesetting at the larger sizes; small layout slips | minor | mobile, breaker, sweep review (pass 3) | #186 |

The harness itself landed in #95/#97 (Layer 1), #99 (the canary's check), #100 (Layer 2), #130 (Layer 3 and the glyph check), #173 (sweep fixes), #175 (nightly) and #187 (visual baselines); #174 cleaned up the deploy.


## 5. What's left, and why

- **`needs-decision`** (they change story, puzzles or how a puzzle reads, so they're the owner's call; each issue has a proposal):
  - #124, the product worked up in air then made up in the glovebox;
  - #125, small chemistry touches on the plate, the fractions and the queue, and the Kraken's purge cycles;
  - #153, a line for standing in 4.12 at 03:33;
  - #161, keeping the chirp's groups on screen for players without sound;
  - #162, saying where to compare the printout.
- **#123:** 4.01's picture shows the inside while you're locked out. It's an art change (a closed-door variant), left for an art pass.
- **#152:** at 1440 × 900 most choices sit below the fold, and on a phone at large text nearly every tap needs a scroll. Fixing it means letting the illustration give way on short screens, which has to be checked against every scene's art. Its proposal is in the issue.
- **Not changed, with reasons in #154:** focus after 03:33, the console's focus once solved, the live region's brief copy, an action past 03:33, the one scan, puzzles starting over when left unsolved.
- **The harness's limits:**
  - Layer 1 samples, so the deepest dark-route content is covered by directed unit tests rather than by the explorer.
  - Layer 2's players are agents: they find what a careful, literal player finds. They're weaker on feel and pacing, and they never hear the audio.
  - Layer 3's tap-target check is advisory above 24 px.

## 6. The three biggest experience problems

In my view, from all three passes:

1. **Getting to the choices on a short screen.** Two first-timers (1440 × 900) and the mobile player said it: the illustration and the passage push the choices below the fold, so most moves start with a scroll, and on a phone every new page starts from the top. The game reads beautifully and plays clumsily there. It's #152, and it's the first thing I'd fix next.
2. **The first night has nowhere to point you.** In Loop 1, once the queue is locked, a new player has nothing to aim at and waits out the clock. From Loop 2 the notebook's pages in your own handwriting guide superbly, but Loop 1 asks for patience before it has earned trust. Later, two key steps rely on the player inferring where to go: where to read the microSD card, and where to compare the printout (#162).
3. **Time and traps that punish without saying so.** Several things cost minutes or a whole night with no warning: reading a puzzle (fixed: they now say so); a run started too late; the late purge and the foil-less shortcut (fixed: their labels now say what happens); the 03:33 cut-off mid-action (fixed: the page now waits for you). The loop is about time, so some of this is the point. But the fixes show how much of it was the interface rather than the design, and a final pass on what each action costs, shown before it's chosen, would finish the job.
