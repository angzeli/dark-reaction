# Layer 2: the AI playtesters

Five personas play the real game in a real browser through `scripts/qa/drive.ts`, the way a person does: look at the screen, decide, act, look again. Each one gets **only** the running game (a local preview build), the player-facing `README.md` and the controller. No source code, design docs or hints, and nothing about known bugs (the canary in [`PLAYTEST-REPORT.md`](PLAYTEST-REPORT.md) depends on that).

## Running a pass

```sh
npm run build
npx vite preview --port 4174 --strictPort &                      # the build under test
node scripts/qa/drive.ts serve --port 4300 --out qa-play &         # the controller's browser
```

Give each persona agent a `play` wrapper that runs `node scripts/qa/drive.ts "$@"`, the README, the brief below, and a folder to write its notes and report in. Run the five at once: each has its own browser context, so saves and settings don't mix. Every command is logged to `qa-play/<player>/log.jsonl`, and every `look` saves a numbered screenshot there, which is where repro steps and screenshots come from.

Every brief ends the same way. **Play** until you reach an ending or have used about 220 controller commands. Keep notes as you go. Then **report**:
- **bugs:** severity (blocker = can't continue or progress lost; major = badly wrong, but you can go on; minor; polish), exact repro steps, expected vs actual, and the screenshot;
- **experience notes:** confused, bored, rushed, lectured; hints that didn't help; anything that broke immersion;
- **how far you got.**

Be honest and concrete. Don't invent problems, and don't soften real ones.

## The five

| Player | Start | Plays with | Looks for |
|---|---|---|---|
| `firsttimer` | `start <url> --viewport 1440x900 --lang en-GB` | Mouse only, English | Every moment of confusion, where they got stuck, when they reached for hints and whether the hints helped. No chemistry background. |
| `chemist` | `start <url> --viewport 1440x900 --lang zh-TW` | 繁中, mouse and keyboard | A Taiwanese chemistry PhD student who solves puzzles with real chemistry. Flags where the game's answers contradict real chemistry (NMR shifts, TLC, glovebox and Schlenk procedure; deliberate simplification is fine, misleading a chemist isn't), and Chinese that reads like a translation rather than Taiwanese usage. |
| `breaker` | `start <url> --viewport 1280x800 --lang en-GB` | Anything | Spam-clicking; reloading during the 03:33 transition and title cards; switching language mid-transition; saving during lights-out; doing things out of order; very long or odd terminal input; Chinese IME input with Enter pressed mid-composition (`ime <text> --enter`), which must not submit. Re-runs each repro once before reporting it. |
| `mobile` | `start <url> --viewport 390x844 --touch --lang zh-TW` | Touch only, 繁中 | Tap target sizes, overflow and wrapping, anything that needs zoom or hover. When a text field has focus it runs `resize 390x450` (what a phone keyboard leaves) to check the field stays visible. |
| `a11y` | `start <url> --viewport 1440x900 --reduce-motion --lang en-GB` | Keyboard only, with reduce motion, flicker off and high contrast turned on in the game's own settings | Focus order, visible focus (`focus`), what a screen reader is given (`a11y`), anything that still moves or flashes, contrast, and every puzzle by keyboard alone. |
