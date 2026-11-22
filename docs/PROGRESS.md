# Progress log

A running log so a fresh session can resume cold. Newest first. Update it in every PR.

## Where we are

- **Milestone:** M3 Act I (M1 Foundation and M2 Engine complete)
- **Last merged:** #41 content validator and playtime estimate (closes #11), the last M2 issue
- **In flight:** #42 Act I puzzles: TLC plate, glovebox antechamber, NMR console (this PR, closes #15)

## Next

1. Merge #42. 2. #14 Act I content: the scenes around the three puzzles (Y.C.'s handwriting, Femi, the yield fudge at the rotavap, the 03:33 booking as an event, the Act I to Act II turn). 3. #16 Act I art and ambience. Then M4 Act II.

### Issue map
- **M1 Foundation:** #1 design docs (done), #3 scaffold, #4 fonts
- **M2 Engine:** #5 engine core, #6 i18n, #7 saves, #8 UI shell, #9 settings + content note, #10 puzzle framework, #11 validator + playtime, #12 art system, #13 audio
- **M3 Act I:** #14 content, #15 puzzles (TLC, glovebox, console), #16 art + ambience
- **M4 Act II:** #17 content, #18 puzzles (door log, cipher, freezer), #19 art + ambience
- **M5 Act III & Endings:** #20 Act III content, #21 Act III puzzles (Schlenk, chirp, fabrication, peak match), #22 six endings, #23 gallery + new game+, #24 Playwright bot
- **M6 Polish & Release:** #25 accessibility, #26 polish, #27 README, credits, v1.0.0

## Open decisions and blockers

- **Repository settings need the owner.** The cloud proxy blocks settings writes, so these are waiting on Angze in the GitHub UI: make the repo public and set its description; enable Pages with source "GitHub Actions"; protect `main` with required status checks only (`attribution`, `typecheck`, `lint`, `unit`, `validate`, `build`, `e2e`).
- **Merge method.** GitHub's server-side squash commits are authored under the profile display name ("Squiddy"), which would break the attribution rule. We squash locally to one commit and merge with the rebase method so authorship is preserved. See `CLAUDE.md` §2.

## Log

### 2026-11-22
- #15 Act I puzzles. **TLC plate** (P3): a crude lane and fractions 10–16 on one coordinate system, a UV lamp that reveals the spot hiding in lane 11, tap any spot to measure its distance and Rf, take/leave toggles, and wrong combinations cost a minute each. **Glovebox antechamber** (P2): doors, evacuate and refill cycles and a pressure gauge against the box's O₂ meter, which rises with real in-game minutes; the SOP says TWICE and Y.C.'s pencil says THREE; too few cycles, a door at the wrong moment, or simply arriving late turns the copper(I) sample green for the rest of the night. **NMR console** (P1): a small typed shell with tappable command chips for touch; `queue --all` and `info 13` reveal the 03:33 booking under your username. The engine gains a third puzzle outcome, failing outright (`onFail` effects, `failedText`), separate from stepping away (`leftText`); the puzzle clock now drives the HUD clock. Progress inside a puzzle survives a reload or a language switch: every Act I puzzle saves its state (validated on the way back in), and the frame restores the minutes already spent (before, a remount quietly handed them back, and a reload could undo a spoiled sample). Choices in the synthesis lab, glovebox room and NMR suite wire the chain together (plate → rotavap → vial → antechamber → NMR tube → a carousel that says QUEUE LOCKED). First notebook entries (tonight and anomalies) and a line under the narrative for what you are carrying. 19 unit tests for the three logics, 6 Playwright tests (the whole chain, the ruined sample, a reload mid-purge, the UV trap, touch-only console, a language switch mid-puzzle). Opened #43: the sticky HUD can cover the focused element in a tall puzzle. DESIGN.md corrected to match: the TLC lane contents and the 9-minute purge shortcut.
- Merged #41 (validator). **M2 Engine closed:** all ten issues done, main CI green apart from the Pages deploy (Pages not yet enabled), played through in Playwright with screenshots checked.
- Merged #40 (settings and content note).
- #11 validator (`npm run validate`): content load (engine shape and reference checks), structural reachability and dead ends, every choice says or does something, locale parity and placeholders, every key used by content or by `t('…')` in code exists, 繁中 punctuation and British-spelling warnings, routes per ending played through the engine (`src/engine/simulate.ts`, routes in `src/content/routes.ts`, shared with the Playwright bot) and rendered in both locales, the critical-path playtime (EN 230 wpm, 繁中 350 cpm, plus puzzle par) failing under 30 min once the true-ending route exists, a seeded random-walk fuzz, and a content-size report. Pure puzzle logic registry in `src/puzzles/logic.ts`.
- #9 settings and content note: a settings panel from the title and the menu (language, four text sizes, four text speeds, reduce motion, allow flicker, high contrast, sound with three volumes) built from native radios, checkboxes and sliders; focus survives re-renders; a first-launch content note in the browser's language with quick flicker and motion toggles, re-readable from the menu and settings.
- Merged #39 (UI shell).
- #8 UI shell: `App` (title with language and sound toggles, Continue/New game/Import; play screen with HUD, illustration, revealed narrative, numbered choices by key or tap; notebook on ruled paper with sections, phantom pages, strike-through for fudges, margin notes, the loop log; menu with save/load slots, export/import, language and sound; act and lights-out cards; ending screen; puzzle overlay wired to the engine; autosave after every action). Settings model (separate key, OS-aware defaults). Content skeleton: eight rooms with their Act I descriptions in both languages. 8 Playwright tests drive the real build.
- Merged #36 (saves, after cold review) and #37 (puzzle framework).
- #7 saves: `SaveStore` (autosave + slots 1–3 under `dark-reaction.save.*`), a versioned envelope (`game`, `schema`, `savedAt`, `locale`, `summary`, `state`) with ordered migrations (v0 → v1: the bare prototype state without `actLoop`), shape validation that refuses corrupt, foreign or newer saves with a reason, `latest()` for Continue, export/import as text and file helpers. `Gallery` under its own key (`dark-reaction.gallery.v1`) records endings and solved puzzles before the epilogue; margins only after a first ending. Storage access never throws (blocked, full or missing localStorage). Cold-reviewed: 7 bugs fixed (content-id drift, quota at startup, element shapes, gallery wipe, silent import errors, unserialisable writes, weak tests); #38 opened for two-tab autosave clashes.
- Merged #35 (art system).
- #10 puzzle framework: the contract (`src/puzzles/types.ts`: pure `logic` with init/apply/isSolved/isFailed/minutes/solution, and a DOM `view` with rerender), the shared frame (`src/puzzles/frame.ts`: title, intro, a clock that moves as minutes are spent, three-tier hints revealed in order, Step away, 03:33 ends the attempt, modal dialog with focus trap, live re-render on language switch), DOM helpers (`src/ui/dom.ts`), a `puzzles` locale area, a reusable contract test (`tests/helpers/puzzle-contract.ts`), and a sample dial lock proving it end to end in Playwright.
- #32: `.gitignore` now ignores `node_modules` as a symlink too (worktrees share one install); a symlink slipped into #31 and was removed before merge.
- #12 art system: SVG helpers and palette (`src/art/svg.ts`), deterministic rain on glass and drops, tube flicker, LED blink, ordered dither, a grain canvas, a stage that only re-renders when the picture changes, and the 03:33 lights-out transition (stutter, black with the clock, cold 02:47, fade back; steady fade with flicker off; plain fades with reduced motion; dark-run variant; skippable). First illustration: the office, used as the title backdrop. Playwright checks every scene parses as SVG and the transition in all modes.
- Merged #30 (engine core, after two rounds of cold review).
- #5 engine core (cold-reviewed by a subagent; 9 bugs found across two passes and fixed, 44 engine tests): content schema (`src/engine/types.ts`), conditions, shortest-path travel, the `Game` class (choices, travel and wait menus, effects, timed events, 03:33 lights-out with ordered rules, loop reset, acts, phantoms, fudges with strike-through, obsession with end-of-loop rule and Infinite Loop, connection fragments, puzzles incl. the dark run, endings, transition cards). Real map in `src/content/world.ts`. 30 Vitest cases on a fixture world.
- Merged #29 (fonts). M1 Foundation done.
- #13 audio: procedural Web Audio engine (`src/audio/audio.ts`), created only on an explicit opt-in. Noise beds (white, pink, brown), oscillators, LFOs, convolution reverb, rain drops, radio murmur, compressor pulse, cryocooler chirps. Ten ambience mixes (eight locations, title, dark) and thirteen cues (lights-out, loop start, phantom, solve, hint, fail, chirp, six endings) defined as sound-design data in `src/audio/presets/`. `chirpSchedule()` shared by the chirp puzzle's LED and audio. Unit tests for presets and timing; a Playwright test bundles the module and plays everything in real Chromium.
- #6 i18n: `t()` with placeholders, English plurals and `@key` params; tables split by area with the 繁中 modules typed against the English keys; `compareTables()` for the validator; locale listeners for live switching. The font check caught `⟦⟧` missing-key markers with no glyph, so they are now `[[key]]`.
- #4 fonts: Source Serif 4 (400, 400 italic, 600), Noto Serif TC 400, IBM Plex Mono (400, 500) from version-pinned `@expo-google-fonts` packages, subset at build time by `scripts/subset-fonts.ts` (a built-in cmap reader checks coverage; build fails if a player-visible character has no glyph or the payload exceeds 1.5 MiB). Projected final size with ~3,500 CJK glyphs ≈ 700 KiB. Chinese text uses Noto first so CJK punctuation keeps full-width metrics. `CREDITS.md` added. PR screenshots live on the orphan branch `pr-assets`.
- Merged #28 (scaffold).
- #3 scaffold: Vite 8, TypeScript 6.0 (strict, erasable syntax only), ESLint 10 + typescript-eslint, Vitest 5, Playwright 1.63 (matches the container's browser). CI jobs `attribution`, `typecheck`, `lint`, `unit`, `validate`, `build`, `e2e`; `deploy.yml` for Pages. Production builds carry a CSP with `connect-src 'none'`.
- Merged #2 (design document and contributor rules). Opened issues #3–#27 across M1–M6.
- Initial commit on `main`: MIT `LICENSE`, `.gitignore`, bilingual `README.md`.
- Labels and milestones created.
- #1 opened: `docs/DESIGN.md`, `docs/PROGRESS.md`, `CLAUDE.md`, `LICENSE-CONTENT.md`, `.githooks/commit-msg`, `scripts/check-attribution.sh`, CI `attribution` job.
