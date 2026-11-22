/**
 * The illustration area: renders a scene's SVG and keeps the grain overlay
 * on top. Re-renders only when something the picture depends on changes,
 * so rain and flicker don't restart on every click.
 */
import { attachGrain, type GrainHandle } from './grain.ts';
import { SCENES } from './scenes/index.ts';
import type { ArtContext } from './types.ts';

export interface Stage {
  readonly element: HTMLElement;
  show(artId: string, ctx: ArtContext): void;
  setMotion(enabled: boolean): void;
  destroy(): void;
}

export function createStage(host: HTMLElement, opts: { motion: boolean }): Stage {
  const element = document.createElement('div');
  element.className = 'dr-stage';
  const picture = document.createElement('div');
  picture.className = 'dr-stage__picture';
  picture.style.position = 'absolute';
  picture.style.inset = '0';
  element.appendChild(picture);
  host.appendChild(element);
  const grain: GrainHandle = attachGrain(element, { motion: opts.motion });
  let lastKey = '';

  return {
    element,
    show(artId, ctx) {
      const key = [artId, ctx.act, ctx.minute, ctx.dark ? 1 : 0, ...(ctx.details ?? [])].join('|');
      if (key === lastKey) return;
      lastKey = key;
      const scene = SCENES[artId];
      picture.innerHTML = scene ? scene(ctx) : '';
      element.dataset['art'] = artId;
    },
    setMotion(enabled) {
      grain.setMotion(enabled);
    },
    destroy() {
      grain.destroy();
      element.remove();
    },
  };
}
