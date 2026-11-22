# Progress log

A running log so a fresh session can resume cold. Newest first. Update it in every PR.

## Where we are

- **Milestone:** M2 Engine (M1 Foundation complete)
- **Last merged:** #36 save system (closes #7)
- **In flight:** #39 UI shell (this PR)

## Next

1. #9 settings panel and content note, #11 validator and playtime. Then M3 Act I: #14 content, #15 puzzles, #16 art + ambience.

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
