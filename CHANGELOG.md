# Changelog

## 1.1.0 (25 November 2026)

**Anomalies.** The building has a sense of humour now, in the margins, where a tired person might notice it at three in the morning. Nothing on the way to any ending has changed, and none of it is needed to finish the game.

**Play:** <https://angzeli.github.io/dark-reaction/>

### Added

- **40 anomalies:** things in the building that aren't in the manual. The ending gallery counts the ones you've found, across every playthrough.
- **16 achievements**, named in each language on its own terms, kept with the gallery.
- **About fifty new lines** to find in the rooms, written separately for each language: British lab culture in English, Taiwanese grad school in 繁中.
- **Credits**, on the title screen.

### Changed

- **Room names.** The NMR suite is B12. The write-up office has its full name now.
- **Your lanyard** is round your neck, every night.

### Under the hood

- Every scene and puzzle has a tone tag, and the content validator keeps jokes out of the moments that need to stay quiet: the 03:33 transitions, the end of Act III and the epilogues.
- Saves from 1.0.x load with nothing lost (save schema 3), and so does the gallery.
- No network, no telemetry: unchanged.

## 1.0.1 (23 November 2026)

**A playtest pass.** Three layers of QA tools played the game far more thoroughly than people can: a headless state explorer and fuzzer, AI playtesters in a real browser, and a screenshot sweep. Their findings were fixed over three passes. `docs/qa/PLAYTEST-REPORT.md` has the whole story.

**Play:** <https://angzeli.github.io/dark-reaction/>

### Fixed

- **What a choice shows in the last minute before 03:33 waits to be read.** Her raw data, read at 03:30, used to vanish under the transition. The page now holds, with one button into the dark, and comes back after a reload. The 03:33 transition can't be skipped by a key or click already on its way.
- **A solved puzzle stays solved** when you step away before its last button (the UPS keypad was the one that hurt).
- **Dan's door** opens for a player waiting at it at 03:15, and the unlock is told once, from the side of the door you're on.
- **Keyboard and screen readers:**
  - Space and Enter never make a choice you haven't moved to;
  - focus stays inside puzzles;
  - the notebook's sections are a real tablist;
  - the TLC plate announces its lamp and names its spots;
  - focus rings you can see everywhere, in high contrast too;
  - headings to jump by;
  - plain words, never asterisks, for screen readers;
  - M, N and Esc work in puzzles, 0 picks a tenth choice, and the arrow keys move inside every group.
- **Phones:**
  - Settings fits at every text size;
  - long words wrap rather than pushing the page sideways;
  - the console's output wraps and its input has room;
  - the header is opaque;
  - puzzles open at their top;
  - the travel and wait menus open where you are;
  - bigger touch areas in the dense puzzles.
- **Text:**
  - save and load notices fade, and follow the language;
  - puzzles say what reading costs;
  - room text follows the act and the clock;
  - shortcuts that would ruin the night say so before you choose them;
  - 繁中 reads as Taiwanese usage throughout, with a misleading freezer note fixed;
  - a few chemistry details a chemist would frown at are corrected.

### Added for developers

- `npm run validate` checks every character of both languages against the subset fonts, and spacing between Latin text and Han.
- `scripts/qa/`: the explorer and fuzzer (a short run in CI, a long one nightly), the playtest driver, and the screenshot sweep. Visual regression baselines live in `e2e/visual.spec.ts-snapshots/`. See `docs/qa/README.md`.

### Measured

- **CI on every change:**
  - type checks, lint, 547 unit tests and the content validator. The unit tests include a fixed-seed run of the explorer and fuzzer; the validator now checks glyphs against the subset fonts, and spacing in 繁中.
  - 313 Playwright tests, including 76 visual-regression baselines and the bot that plays all six endings in both languages.
- **Nightly:** the explorer and fuzzer at length.

### Known issues

- At 1440 × 900 most choices sit below the fold, and on a phone at large text most taps need a scroll first (#152).
- 4.01's picture shows the inside while you're locked out (#123).
- Five proposals wait on a decision (#124, #125, #153, #161, #162).

## 1.0.0 (23 November 2026)

**Dark Reaction《暗反應》 1.0.0.** A time-loop mystery in a chemistry lab at 3 a.m., about what a result is worth. English and 繁體中文, written as two originals.

**Play:** <https://angzeli.github.io/dark-reaction/>

### What’s in it

- A 46-minute loop, 02:47 to 03:33, in which every action costs minutes, items reset and knowledge stays.
- Three acts, eight rooms and ten puzzles from real lab life, each with three hints and solvable without chemistry.
- **Six endings**, decided by what you do across every loop:
  - Perfect Spectrum / 完美圖譜
  - Honest Noise / 誠實的雜訊
  - Clocking Off / 下班
  - Infinite Loop / 無限迴圈
  - Fire Alarm / 火災警報 (secret)
  - Dark Reaction / 暗反應 (the true ending)

  Each has its own illustration, sound cue and an epilogue of 500 to 900 words in each language. An ending gallery keeps what you've found, and new games carry pencil notes from earlier ones.
- **18,075 English words and 27,630 Chinese characters.**
- Every illustration is drawn in code and every sound synthesised at runtime.
- **Settings:** text size, text speed, reduced motion, flicker off, high contrast, and sound off by default.
- **Saves:** an autosave, three slots, and export and import of a save file.
- No analytics, no telemetry, and no network requests after loading.

### Measured

- **The shortest route to the true ending** reads and plays in **50.2 minutes in English and 51.0 in 繁中** (230 words a minute, 350 characters a minute, plus each puzzle's par time). Most first playthroughs take longer.
- **The other routes:** Infinite Loop 25 min; Perfect Spectrum, Honest Noise and Fire Alarm about 19 min; Clocking Off 16 min.
- **CI on every change:**
  - type checks, lint, 501 unit tests and the content validator;
  - 139 Playwright tests, including a bot that plays all six endings in both languages through the real UI;
  - axe on every screen in both languages and in high contrast;
  - keyboard-only and touch-only solves of every puzzle;
  - motion and flicker checks on every scene.
- **The build:** 174 KB of JavaScript and 12 KB of CSS gzipped, plus about 410 KB of subset fonts. It loads in about 140 ms locally, and moving between rooms raises no long task.

### Known issues

- **The Pages source is still "Deploy from a branch"** (an owner setting the build session can't change). The deploy workflow now waits for GitHub's own branch build so the built site wins (#84). Switching the source to *GitHub Actions* is the proper fix.
- **In 繁中 the timed true-ending route is 51.0 minutes,** a minute over the 35–50 target. It is read more slowly per screen.
- **On common desktop sizes the office's steady white tube in Act III** sits just above the picture's crop; its light on the wall below is what shows.

### Fixed since the last pre-release builds

- **The NMR console stays findable** (#86). After solving it, the console stays in the room, and knowing Ian's code gives somewhere to type it, which says what's missing if you're not carrying your tube.
- **The live site serves the build** (#84). The deploy now waits for GitHub's own branch build.
