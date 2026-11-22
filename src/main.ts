import './styles/fonts.css';
import './styles/main.css';
import './styles/art.css';
import { createStage } from './art/stage.ts';
import { clockLabel } from './engine/clock.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset['motion'] = reduce ? 'reduce' : 'full';
  app.innerHTML = `
    <main class="placeholder">
      <div class="placeholder__art"></div>
      <div class="placeholder__text">
        <p class="placeholder__clock" aria-label="Time">${clockLabel(0)}</p>
        <h1 class="placeholder__title">Dark Reaction <span lang="zh-Hant-TW">《暗反應》</span></h1>
        <p class="placeholder__status">In development. <span lang="zh-Hant-TW">開發中。</span></p>
      </div>
    </main>`;
  const stage = createStage(app.querySelector<HTMLElement>('.placeholder__art')!, { motion: !reduce });
  stage.show('office', { act: 1, minute: 0 });
}
