import { expect, test, type Page } from '@playwright/test';
import { build } from 'vite';
import type { playLightsOut as PlayLightsOut } from '../src/art/lightsout.ts';
import type { createStage as CreateStage } from '../src/art/stage.ts';

/**
 * The art system in a real browser: every scene parses as SVG in every
 * act, the stage mounts with grain, and the 03:33 transition runs in all
 * three modes (flicker, no flicker, reduced motion) and can be skipped.
 */
let bundle = '';

test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: false, lib: { entry: 'src/art/harness.ts', name: 'DRArt', formats: ['iife'], fileName: () => 'art.js' } },
  });
  for (const out of Array.isArray(result) ? result : [result]) {
    if ('output' in out) for (const chunk of out.output) if (chunk.type === 'chunk') bundle += chunk.code;
  }
});

async function load(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.setContent('<!doctype html><html><body style="margin:0;background:#000"><div id="host" style="width:960px"></div></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => (window as unknown as { DRArt: { installStyles(): void } }).DRArt.installStyles());
  return errors;
}

test('every scene parses as SVG in every act, lit and dark', async ({ page }) => {
  const errors = await load(page);
  const parseErrors = await page.evaluate(() => (window as unknown as { DRArt: { parseAll(): string[] } }).DRArt.parseAll());
  expect(parseErrors).toEqual([]);
  expect(errors).toEqual([]);
});

test('the stage mounts a scene with grain and does not re-render when nothing changed', async ({ page }) => {
  const errors = await load(page);
  const result = await page.evaluate(() => {
    const { createStage } = (window as unknown as { DRArt: { createStage: typeof CreateStage } }).DRArt;
    const stage = createStage(document.querySelector('#host')!, { motion: true });
    stage.show('office', { act: 1, minute: 0 });
    const first = stage.element.querySelector('svg');
    stage.show('office', { act: 1, minute: 0 });
    const same = stage.element.querySelector('svg') === first;
    stage.show('office', { act: 1, minute: 5 });
    const changed = stage.element.querySelector('svg') !== first;
    return { same, changed, grain: !!stage.element.querySelector('canvas.dr-grain'), hidden: first?.getAttribute('aria-hidden') };
  });
  expect(result).toEqual({ same: true, changed: true, grain: true, hidden: 'true' });
  expect(errors).toEqual([]);
});

for (const mode of [
  { name: 'flicker', reduceMotion: false, flicker: true },
  { name: 'no flicker', reduceMotion: false, flicker: false },
  { name: 'reduced motion', reduceMotion: true, flicker: false },
]) {
  test(`03:33 runs to 02:47 and cleans up (${mode.name})`, async ({ page }) => {
    const errors = await load(page);
    const result = await page.evaluate(async (m) => {
      const { playLightsOut } = (window as unknown as { DRArt: { playLightsOut: typeof PlayLightsOut } }).DRArt;
      let black = 0;
      const seen: string[] = [];
      const h = playLightsOut(document.body, { ...m, caption: 'Loop 2', onBlack: () => black++ });
      const poll = setInterval(() => {
        const t = document.querySelector('.dr-lightsout__clock')?.textContent;
        if (t && !seen.includes(t)) seen.push(t);
      }, 50);
      await h.done;
      clearInterval(poll);
      return { black, seen, left: document.querySelectorAll('.dr-lightsout').length };
    }, mode);
    expect(result).toEqual({ black: 1, seen: ['03:33', '02:47'], left: 0 });
    expect(errors).toEqual([]);
  });
}

test('03:33 can be skipped, and a dark run never rolls back to 02:47', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(async () => {
    const { playLightsOut } = (window as unknown as { DRArt: { playLightsOut: typeof PlayLightsOut } }).DRArt;
    const t0 = performance.now();
    const h = playLightsOut(document.body, { reduceMotion: false, flicker: true });
    setTimeout(() => h.skip(), 100);
    await h.done;
    const skippedIn = performance.now() - t0;
    const seen: string[] = [];
    const d = playLightsOut(document.body, { reduceMotion: true, flicker: false, dark: true });
    const poll = setInterval(() => {
      const t = document.querySelector('.dr-lightsout__clock')?.textContent;
      if (t && !seen.includes(t)) seen.push(t);
    }, 30);
    await d.done;
    clearInterval(poll);
    return { skippedIn, seen };
  });
  expect(result.skippedIn).toBeLessThan(800);
  expect(result.seen).toEqual(['03:33']);
});

// #25: reduced motion stops every scene's motion, and flicker off stops every flash, in every room and ending.
test('every scene, in every act, lit and dark: reduced motion stills it; flicker off stops its flicker and blinks', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = await load(page);
  const result = await page.evaluate(async () => {
    const { SCENES } = (window as unknown as { DRArt: { SCENES: Record<string, (ctx: { act: 1 | 2 | 3; minute: number; dark?: boolean }) => string> } }).DRArt;
    const host = document.querySelector<HTMLElement>('#host')!;
    const root = document.documentElement;
    const running = () =>
      document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a as CSSAnimation).animationName ?? '');
    const problems: string[] = [];
    let animated = 0;
    for (const [id, scene] of Object.entries(SCENES)) {
      for (const act of [1, 2, 3] as const) {
        for (const dark of [false, true]) {
          host.innerHTML = scene({ act, minute: 20, dark });
          for (const mode of ['on', 'reduce', 'flicker-off'] as const) {
            root.dataset['motion'] = mode === 'reduce' ? 'reduce' : 'full';
            root.dataset['flicker'] = mode === 'flicker-off' ? 'off' : 'on';
            await new Promise((r) => requestAnimationFrame(() => r(null)));
            const names = running();
            if (mode === 'on' && names.length) animated++;
            if (mode === 'reduce' && names.length) problems.push(`${id} act ${act}${dark ? ' dark' : ''}, reduced motion: ${[...new Set(names)].join(', ')}`);
            const flashes = names.filter((n) => n === 'dr-flicker' || n === 'dr-blink');
            if (mode === 'flicker-off' && flashes.length) problems.push(`${id} act ${act}${dark ? ' dark' : ''}, flicker off: ${[...new Set(flashes)].join(', ')}`);
          }
        }
      }
    }
    return { problems, animated };
  });
  expect(result.problems).toEqual([]);
  // The check means something: with everything allowed, most scenes do move.
  expect(result.animated).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});
