# Progress log

A running log so a fresh session can resume cold. Newest first. Update it in every PR.

## Where we are

- **Milestone:** M1 Foundation
- **Last merged:** #2 design document, progress log, contributor rules, attribution tooling
- **In flight:** #3 project scaffold (Vite + TypeScript, lint, Vitest, Playwright, CI jobs, Pages deploy)

## Next

1. #4 self-hosted fonts with build-time subsetting of Noto Serif TC.
2. M2 Engine: #5 core, #6 i18n, #7 saves, #8 UI shell, #9 settings, #10 puzzle framework, #11 validator, #12 art, #13 audio.

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
- #3 scaffold: Vite 8, TypeScript 6.0 (strict, erasable syntax only), ESLint 10 + typescript-eslint, Vitest 5, Playwright 1.63 (matches the container's browser). CI jobs `attribution`, `typecheck`, `lint`, `unit`, `validate`, `build`, `e2e`; `deploy.yml` for Pages. Production builds carry a CSP with `connect-src 'none'`.
- Merged #2 (design document and contributor rules). Opened issues #3–#27 across M1–M6.
- Initial commit on `main`: MIT `LICENSE`, `.gitignore`, bilingual `README.md`.
- Labels and milestones created.
- #1 opened: `docs/DESIGN.md`, `docs/PROGRESS.md`, `CLAUDE.md`, `LICENSE-CONTENT.md`, `.githooks/commit-msg`, `scripts/check-attribution.sh`, CI `attribution` job.
