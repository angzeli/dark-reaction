/** Entry point for the art e2e test (e2e/art.spec.ts); not part of the game bundle. */
import css from '../styles/art.css?inline';
import { playLightsOut } from './lightsout.ts';
import { SCENES } from './scenes/index.ts';
import { createStage } from './stage.ts';

export function installStyles(): void {
  const style = document.createElement('style');
  style.textContent = `:root{--night-0:#070e16;--tube:#9fe3b5;--font-mono:monospace}${css}`;
  document.head.appendChild(style);
}

/** Render every scene for every act; return any XML parse errors. */
export function parseAll(): string[] {
  const errors: string[] = [];
  for (const [id, scene] of Object.entries(SCENES)) {
    for (const act of [1, 2, 3] as const) {
      for (const dark of [false, true]) {
        const doc = new DOMParser().parseFromString(scene({ act, minute: 20, dark }), 'image/svg+xml');
        const err = doc.querySelector('parsererror');
        if (err) errors.push(`${id} act ${act}${dark ? ' dark' : ''}: ${err.textContent}`);
      }
    }
  }
  return errors;
}

export { createStage, playLightsOut, SCENES };
export const SCENE_IDS = Object.keys(SCENES);
