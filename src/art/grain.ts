/**
 * Film grain over the illustration: a small canvas of noise redrawn a few
 * times a second, scaled up with nearest-neighbour so it reads as grain,
 * not blur. Static when motion is reduced; stops when the tab is hidden.
 */
export interface GrainHandle {
  setMotion(enabled: boolean): void;
  destroy(): void;
}

const SIZE = 160;
const FPS = 12;

export function attachGrain(host: HTMLElement, opts: { motion: boolean }): GrainHandle {
  const canvas = document.createElement('canvas');
  canvas.className = 'dr-grain';
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let motion = opts.motion;
  let timer: number | undefined;
  let seed = 1;

  const draw = () => {
    if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
      // xorshift: fast and good enough for grain
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const v = (seed >>> 0) & 0xff;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  const schedule = () => {
    stop();
    if (motion && document.visibilityState === 'visible') timer = window.setInterval(draw, 1000 / FPS);
  };
  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
  const onVisibility = () => schedule();

  draw();
  schedule();
  document.addEventListener('visibilitychange', onVisibility);

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      schedule();
    },
    destroy() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    },
  };
}
