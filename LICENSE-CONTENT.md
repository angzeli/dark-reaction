# Content licence

**Dark Reaction《暗反應》** has two kinds of material and two licences.

## Code: MIT

The game engine, user interface, rendering and audio *code*, build scripts, tests and tooling are released under the [MIT License](LICENSE).

## Creative content: CC BY-NC-SA 4.0

The creative content is © 2026 Angze Li and licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International** licence ([summary](https://creativecommons.org/licenses/by-nc-sa/4.0/), [legal code](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode)).

This covers:

- **Story text** in both languages: everything in the locale tables (`src/i18n/en.ts`, `src/i18n/zh-Hant-TW.ts`), including scenes, notebook entries, puzzle text, hints and epilogues.
- **Story structure:** the scene, choice, notebook, puzzle and ending definitions under `src/content/`.
- **Illustrations:** the scene and ending artwork defined under `src/art/scenes/` and `src/art/endings/`, and any images rendered from them (screenshots included).
- **Sound design:** the ambience and cue presets under `src/audio/presets/`.
- **Design documents:** `docs/DESIGN.md`.

You may share and adapt this content for non-commercial purposes, as long as you credit "Angze Li" with a link to this repository, indicate changes, and release adaptations under the same licence.

## Third-party material

Fonts (Source Serif 4, Noto Serif TC, IBM Plex Mono) are used under the SIL Open Font License 1.1. See `CREDITS.md`. They are not covered by either licence above.

## If in doubt

If a file mixes code and content, the code is MIT and the prose, artwork and sound design in it are CC BY-NC-SA 4.0. Ask before commercial use.
