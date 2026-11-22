import './styles/fonts.css';
import './styles/main.css';
import './styles/art.css';
import './styles/puzzle.css';
import './styles/ui.css';
import { CONTENT } from './content/index.ts';
import { PUZZLES } from './puzzles/registry.ts';
import { browserStorage } from './save/storage.ts';
import { App } from './ui/app.ts';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const app = new App(root, { content: CONTENT, puzzles: PUZZLES, kv: browserStorage() });
  app.start();
  // A handle for the Playwright bot and for debugging; the game never reads it.
  (window as unknown as { darkReaction?: App }).darkReaction = app;
}
