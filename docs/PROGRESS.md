# Progress log

A running log so a fresh session can resume cold. Newest first. Update it in every PR.

## Where we are

- **Milestone:** M1 Foundation
- **Last merged:** initial commit (`LICENSE`, `.gitignore`, `README.md`)
- **In flight:** #1 design document, progress log, contributor rules, attribution tooling

## Next

1. Merge #1 (this PR).
2. Open all remaining issues for M1–M6 with acceptance criteria, labels and milestones.
3. Project scaffold: Vite + TypeScript, ESLint, Vitest, Playwright, CI jobs (`typecheck`, `lint`, `unit`, `validate`, `build`, `e2e`), Pages deploy.
4. Self-hosted fonts with build-time subsetting of Noto Serif TC.
5. Engine core (M2).

## Open decisions and blockers

- **Repository settings need the owner.** The cloud proxy blocks settings writes, so these are waiting on Angze in the GitHub UI: make the repo public and set its description; enable Pages with source "GitHub Actions"; protect `main` with required status checks only (`attribution`, `typecheck`, `lint`, `unit`, `validate`, `build`, `e2e`).
- **Merge method.** GitHub's server-side squash commits are authored under the profile display name ("Squiddy"), which would break the attribution rule. We squash locally to one commit and merge with the rebase method so authorship is preserved. See `CLAUDE.md` §2.

## Log

### 2026-11-22
- Initial commit on `main`: MIT `LICENSE`, `.gitignore`, bilingual `README.md`.
- Labels and milestones created.
- #1 opened: `docs/DESIGN.md`, `docs/PROGRESS.md`, `CLAUDE.md`, `LICENSE-CONTENT.md`, `.githooks/commit-msg`, `scripts/check-attribution.sh`, CI `attribution` job.
