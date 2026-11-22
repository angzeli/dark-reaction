# Dark Reaction《暗反應》

> In photosynthesis, the dark reactions are the ones that keep running after the light is gone.
>
> 光合作用裡，暗反應是光熄滅之後，仍然繼續進行的那一段。

**Status: in development.** Nothing here is playable yet.
**狀態：開發中。** 目前還沒有可以玩的版本。

## Premise

It is 02:47 in a near-empty chemistry building in London. You are a final-year researcher who came back for one last spectrum before a 09:00 submission deadline. The NMR queue lists a sample under your username, timestamped 03:33, which is forty-six minutes from now. You did not book it. The glovebox oxygen reading is climbing, the rain has settled in for the night, and somebody who worked on this floor before you has left traces everywhere. At 03:33 the lights go out, and it is 02:47 again.

## 故事

凌晨兩點四十七分，倫敦一棟幾乎沒人的化學大樓。你是博班最後一年的研究生，為了早上九點的截止期限，回來跑最後一張圖譜。NMR 排程上掛著一支用你帳號送的樣品，時間是三點三十三分──四十六分鐘之後。你沒有排過它。手套箱的氧氣讀數一直往上爬，雨看起來會下一整夜，而在你之前待過這層樓的某個人，到處都留下了痕跡。三點三十三分，燈熄了，然後又是兩點四十七分。

## Planned features / 預計功能

- A 46-minute time loop where actions cost minutes, items reset and knowledge persists. / 每輪 46 分鐘的時間迴圈：行動要花時間，物品會重置，知識會留下。
- A lab notebook as the central interface, including entries in your handwriting from loops you don't remember. / 以實驗記錄本為核心介面，裡面會出現你不記得自己寫過的筆跡。
- Three acts, eight locations, and ten puzzles grounded in real lab life (NMR console, glovebox antechamber, Schlenk line, TLC, a −80 °C freezer, and more), each with a three-tier hint system and solvable without a chemistry background. / 三幕、八個地點、十道取材自真實實驗室日常的謎題，每題都有三段式提示，不懂化學也能解。
- Six endings decided by what you do across every loop, plus an ending gallery. / 六種結局，取決於你在所有迴圈中的所作所為，並附結局一覽。
- Fully bilingual: English (British spelling) and 繁體中文（臺灣）, written as two originals, switchable at any time. / 完整雙語：英文與繁體中文各自原創書寫，可隨時切換。
- Code-drawn illustrations, procedural audio, keyboard and touch support, and accessibility settings (text size, reduced motion, flicker off, high contrast). / 程式繪製的插圖、程序生成的音效、鍵盤與觸控操作，以及無障礙設定。
- No analytics, no telemetry, no network requests at runtime, no login. / 不追蹤、不回傳、執行時不連網、不需登入。

## Tech stack / 技術

Vite, TypeScript (no UI framework), Vitest, Playwright, axe-core, procedural Web Audio, SVG and canvas illustration, and self-hosted, build-time-subset fonts (Source Serif 4, Noto Serif TC, IBM Plex Mono). Deployed to GitHub Pages.

## Licence / 授權

The source code is released under the [MIT License](LICENSE). The story text, illustrations and audio design are © Angze Li and licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); see `LICENSE-CONTENT.md` for details. Third-party fonts are under the SIL Open Font License.

程式碼採用 [MIT 授權](LICENSE)。故事文字、插圖與音效設計為 © Angze Li，採用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 授權，詳見 `LICENSE-CONTENT.md`。第三方字型採用 SIL Open Font License。
