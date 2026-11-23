# Changelog

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
