/**
 * The 03:33 transition, the game's signature moment (docs/DESIGN.md §17):
 * the tubes stutter, everything goes black but the clock, the clock rolls
 * back to 02:47 in a colder light, and the room fades back in.
 *
 * - Flicker disabled: a steady fade instead of the stutter.
 * - Reduced motion: short, plain fades; nothing moves.
 * - Dark run (`dark: true`): stays on 03:33 and fades out to reveal the
 *   room in the dark; no rollback.
 * Always skippable: `skip()` jumps to the end.
 */
export interface LightsOutOptions {
  reduceMotion: boolean;
  flicker: boolean;
  dark?: boolean;
  fromClock?: string;
  toClock?: string;
  /** Small caption under the rolled-back clock, e.g. "Loop 4". */
  caption?: string;
  /** Called once the screen is fully black, so the UI can swap what's underneath. */
  onBlack?: () => void;
}

export interface LightsOutHandle {
  done: Promise<void>;
  skip(): void;
}

const wait = (ms: number, signal: { skipped: boolean }) =>
  new Promise<void>((resolve) => {
    if (signal.skipped) return resolve();
    const t = window.setTimeout(resolve, ms);
    const poll = window.setInterval(() => {
      if (signal.skipped) {
        window.clearTimeout(t);
        window.clearInterval(poll);
        resolve();
      }
    }, 30);
    window.setTimeout(() => window.clearInterval(poll), ms + 50);
  });

export function playLightsOut(root: HTMLElement, o: LightsOutOptions): LightsOutHandle {
  const signal = { skipped: false };
  const overlay = document.createElement('div');
  overlay.className = 'dr-lightsout';
  overlay.setAttribute('role', 'presentation');
  const clock = document.createElement('div');
  clock.className = 'dr-lightsout__clock';
  clock.textContent = o.fromClock ?? '03:33';
  const caption = document.createElement('div');
  caption.className = 'dr-lightsout__caption';
  overlay.append(clock, caption);
  overlay.style.opacity = '0';
  root.appendChild(overlay);

  let blackFired = false;
  const black = () => {
    if (blackFired) return;
    blackFired = true;
    overlay.style.opacity = '1';
    o.onBlack?.();
  };

  const animate = (keyframes: Keyframe[], ms: number) =>
    signal.skipped || ms === 0 ? Promise.resolve() : overlay.animate(keyframes, { duration: ms, fill: 'forwards' }).finished.then(() => undefined);

  const run = async () => {
    if (o.reduceMotion) {
      await animate([{ opacity: 0 }, { opacity: 1 }], 500);
    } else if (o.flicker) {
      // The tubes give up: irregular, hard-edged dropouts, then black.
      await animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0.85, offset: 0.08 },
          { opacity: 0, offset: 0.14 },
          { opacity: 0.6, offset: 0.3 },
          { opacity: 0.1, offset: 0.36 },
          { opacity: 0.95, offset: 0.6 },
          { opacity: 0.3, offset: 0.66 },
          { opacity: 1, offset: 1 },
        ].map((k) => ({ ...k, easing: 'steps(1, end)' })),
        1100,
      );
    } else {
      await animate([{ opacity: 0 }, { opacity: 1 }], 1100);
    }
    black();
    clock.classList.add('dr-lightsout__clock--on');
    await wait(o.reduceMotion ? 900 : 1500, signal);
    if (!o.dark) {
      clock.textContent = o.toClock ?? '02:47';
      clock.classList.add('dr-lightsout__clock--cold');
      caption.textContent = o.caption ?? '';
      await wait(o.reduceMotion ? 900 : 1300, signal);
    }
    await animate([{ opacity: 1 }, { opacity: 0 }], o.reduceMotion ? 500 : 1200);
  };

  const done = run().finally(() => {
    black();
    overlay.remove();
  });

  return {
    done,
    skip() {
      signal.skipped = true;
      for (const a of overlay.getAnimations()) a.finish();
    },
  };
}
