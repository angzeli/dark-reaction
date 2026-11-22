import { expect, test } from '@playwright/test';
import { go, newGame } from './bot.ts';

/**
 * #26: the built game loads quickly, and walking from room to room (each walk
 * draws a new SVG scene and its grain) never blocks the main thread for long.
 * Timings are reported as annotations on the test, so CI keeps them.
 */

test.use({ viewport: { width: 1280, height: 900 } });

test('the game loads quickly, and every scene change runs without a long task', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const w = window as unknown as { longTasks: Array<{ start: number; duration: number }> };
    w.longTasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.longTasks.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  });
  await newGame(page, 'en', { reducedMotion: false });
  const load = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) };
  });
  test.info().annotations.push({ type: 'load (ms)', description: `DOMContentLoaded ${load.domContentLoaded}, load ${load.load}` });
  expect(load.load).toBeLessThan(3000);

  const from = await page.evaluate(() => performance.now());
  for (const room of ['synth', 'glovebox', 'stairs', 'nmr', 'cold', 'roof', 'stairs', 'office']) await go(page, room);
  const long = await page.evaluate((t) => (window as unknown as { longTasks: Array<{ start: number; duration: number }> }).longTasks.filter((l) => l.start >= t), from);
  const worst = Math.max(0, ...long.map((l) => Math.round(l.duration)));
  test.info().annotations.push({ type: 'scene changes', description: `8 walks, ${long.length} long task(s), longest ${worst} ms` });
  expect(long).toEqual([]);
});
