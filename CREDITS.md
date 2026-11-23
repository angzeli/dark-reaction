# Credits

**Dark Reaction《暗反應》** by Angze Li, made with Claude Code. Code under MIT, story text, art and sound design under CC BY-NC-SA 4.0 (see `LICENSE` and `LICENSE-CONTENT.md`). All illustration is drawn in code and all sound is synthesised at runtime; the game ships no third-party images or audio.

## Fonts

All fonts are self-hosted and subset at build time (`scripts/subset-fonts.ts`) to the glyphs the game uses. Each is licensed under the **SIL Open Font License 1.1**; the full licence text ships with each package (`LICENSE_FONT`).

| Font | Use | Designer / copyright | Source package |
|---|---|---|---|
| **Source Serif 4** | English narrative (regular, italic for handwriting, semibold) | Frank Grießhammer, © 2014–2021 Adobe | [`@expo-google-fonts/source-serif-4`](https://www.npmjs.com/package/@expo-google-fonts/source-serif-4) 0.4.2 |
| **Noto Serif TC** | 繁體中文 narrative | © 2017–2024 Adobe (Source Han Serif / Noto Serif CJK) | [`@expo-google-fonts/noto-serif-tc`](https://www.npmjs.com/package/@expo-google-fonts/noto-serif-tc) 0.4.2 |
| **IBM Plex Mono** | Terminals, clocks, logs | Mike Abbink, Bold Monday, © 2017 IBM Corp. | [`@expo-google-fonts/ibm-plex-mono`](https://www.npmjs.com/package/@expo-google-fonts/ibm-plex-mono) 0.4.2 |

The `@expo-google-fonts` packages redistribute the Google Fonts builds unchanged (package code MIT; fonts OFL 1.1).

## Tools

None of these ship in the game; they build and test it.

| Tool | Version | Licence | Use |
|---|---|---|---|
| [Vite](https://vite.dev/) | 8.3.8 | MIT | Dev server and build |
| [TypeScript](https://www.typescriptlang.org/) | 6.0.3 | Apache-2.0 | The language, and type checks |
| [Vitest](https://vitest.dev/) | 5.1.1 | MIT | Unit tests |
| [Playwright](https://playwright.dev/) | 1.63.0 | Apache-2.0 | Browser tests and the playthrough bot |
| [axe-core](https://github.com/dequelabs/axe-core) via [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright) | 4.14 | MPL-2.0 | Accessibility checks in CI |
| [ESLint](https://eslint.org/) and [typescript-eslint](https://typescript-eslint.io/) | 10.15.0 / 8.73.0 | MIT | Lint |
| [subset-font](https://github.com/papandreou/subset-font), built on [HarfBuzz](https://harfbuzz.github.io/) | 2.9.0 | BSD-3-Clause | Font subsetting at build time |
