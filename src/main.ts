import './styles/fonts.css';
import './styles/main.css';
import { clockLabel } from './engine/clock.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <main class="placeholder">
      <p class="placeholder__clock" aria-label="Time">${clockLabel(0)}</p>
      <h1 class="placeholder__title">Dark Reaction <span lang="zh-Hant-TW">《暗反應》</span></h1>
      <p class="placeholder__status">In development. <span lang="zh-Hant-TW">開發中。</span></p>
    </main>`;
}
