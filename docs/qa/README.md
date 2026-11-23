# Playtest QA

How Dark Reaction《暗反應》 is checked for what a real player would hit: soft-locks, broken puzzle logic, state that resets when it shouldn't (or doesn't when it should), confusing moments, layout problems, localisation errors and anything that breaks immersion. Three layers, each a tool in `scripts/qa/`. The v1.0.1 pass and what it found are in [`PLAYTEST-REPORT.md`](PLAYTEST-REPORT.md).

| Layer | What | Where it runs |
|---|---|---|
| 1 | Headless state exploration and a chaotic fuzzer, through the engine | CI (`unit`), and nightly at length |
| 2 | AI playtesters in a real browser, each a persona ([`personas.md`](personas.md)) | By hand, before a release |
| 3 | A screenshot of every screen, checked and reviewed; visual-regression baselines | The sweep by hand; the baselines in CI (`e2e`) |

## Layer 1: state exploration

```sh
node scripts/qa/explore.ts                    # CI size: about 30 s
node scripts/qa/explore.ts --long             # nightly size
node scripts/qa/explore.ts --out qa-report    # also writes qa-report/report.md and report.json
```

Options: `--per-minute N` (states expanded per minute of a night before the rest are sampled), `--nights-after N` (nights followed beyond each start), `--branches N` (next nights followed from each night), `--max-states N`, `--fuzz-seeds N`, `--fuzz-steps N`, `--first-seed N`. It exits 1 on any error-level finding.

**The explorer** (`lib/explorer.ts`) starts from a new game and from 02:47 of every night the scripted routes (`src/content/routes.ts`) pass through. It searches each night minute by minute until 03:33, taking every action the player has: each choice, each walk, each length of wait, every way a puzzle can end (solved with its known solution, left at once, left after fiddling for its par, failed, still open at 03:33) and striking any fudge through. It then follows the nights those nights lead to. States that play the same are merged (`lib/play.ts`, `stateKey`): notebook pages no condition reads, events that only print text, and looks whose pages are already in hand don't count.

A night still has millions of distinct states, because fragments, rests, fudges and puzzles can be taken in any order. So each minute is exhaustive up to `--per-minute` states and a seeded sample after that. The report says which nights were exhaustive. Each route's own states are anchors that are always expanded, so the sample never loses the way forward.

**The fuzzer** (`lib/fuzzer.ts`) plays like a chaotic person:
- it repeats what it just did, and reaches for things it has never tried (sequence breaks);
- it leaves puzzles half done, fails them, or runs out the clock in them;
- it strikes fudges through at odd moments, and some nights just waits for the dark;
- it saves and reloads between moves, checking the reloaded game plays on exactly as the original.

**Checked on every transition and every new state** (`lib/checks.ts`, `lib/design.ts`):

| Check | What it asserts |
|---|---|
| clock | The clock only moves forward within a loop, never past 03:33. A new loop starts at 02:47, and only when the lights go out. |
| reset | At 03:33 items, tonight's flags and used choices go, you're back in the office, and obsession moves only as docs/DESIGN.md §7 says. |
| persist | Notebook entries, solved puzzles, fragments, fudges and persistent flags are never lost. |
| provenance | Nothing (an entry, flag, item, fragment, fudge or solved puzzle) appears unless something that happened in that step can produce it: the choice, the puzzle, an event that fired, 03:33's rules or 02:47's pages. |
| cost | Every action takes what the content says. The minutes docs/DESIGN.md gives (tea 4, sofa 10, the purge 9, walking times, …) match, and a look costs 1. The minutes shown on a choice are the minutes it takes (*promise*). |
| softlock | Never nothing to do; never a state with no ending reachable in the explored graph. |
| solved | A solved puzzle is never offered as a puzzle again, and its shortcut (docs/DESIGN.md §11) is there when the design says. |
| save | Saving and loading gives back the identical state, and a reloaded game plays on identically. |
| locale, language | Everything on screen and every choice label renders in both languages with no missing keys or unfilled placeholders, and rendering never changes the state. |
| noop | A choice always shows something. |
| affordance | A key with nowhere to use it (`lib/affordance.ts`). When the player knows something a room's choices ask for (a code, a PIN), and only tonight's part is missing (the tube, the hour), the room must offer something that answers it, even if only to say what's missing. |

The affordance check exists because of the canary (`PLAYTEST-REPORT.md`). Layer 1 as first built missed the NMR console bug a real player hit before v1.0.0 (#86): every ending stayed reachable, so nothing counted it as stuck. `tests/qa-affordance.test.ts` rebuilds the NMR suite as it was before #87 and checks the explorer finds it unprompted.

The report also lists content no state ever showed (choices, scenes, notebook entries, events, text keys) and a table of what every choice says and does, for reviewing promises against effects.

In CI, `tests/qa-explorer.test.ts` runs a short fixed-seed version (every route's nights at 15 states a minute, 150 fuzz runs) and tests that the checks catch what they are for.

## Layer 2: AI playtesters

Five persona agents play the real game in a real browser, through `scripts/qa/drive.ts`. They get only the running build, the player README and a controller, and play as a person does: look at the screen, decide, act, look again. [`personas.md`](personas.md) has the five briefs and how to run a pass.

```sh
node scripts/qa/drive.ts serve --port 4300 --out qa-play                                       # once
node scripts/qa/drive.ts chemist start http://localhost:4174/dark-reaction/ --lang zh-TW      # a player
node scripts/qa/drive.ts chemist look                                                          # a screenshot and the visible controls
node scripts/qa/drive.ts chemist click-text 合併
```

The server holds one Chromium. Each player gets their own context: their own storage, viewport, touch screen, motion preference and browser language. Commands:
- `look` (screenshot and controls), `read` (the visible text);
- `click`, `click-text`, `tap`, `tap-text`, `key`, `type`;
- `ime <text> --enter`: composes with an input method and presses Enter while still composing, as a Chinese typist picking a candidate does;
- `scroll`, `wait`, `reload`, `resize`;
- `focus`: what has focus, and whether its focus style shows;
- `a11y`: the ARIA snapshot a screen reader is given.

Every command is logged per player, for repro steps.

Give each agent a copy of the controller outside the working tree. A branch switch or stash that removes `scripts/qa/drive.ts` mid-run breaks every agent's next command; that happened during the v1.0.1 pass.
