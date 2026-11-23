import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const target = (name: string) => targets().find((t) => t.name === name)!;
const view = { locale: 'zh-Hant-TW' as const, reduceMotion: true, highContrast: false };

test.describe('on a touch phone (#119)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('each TLC spot can be hit 12 px above or below its dot', async ({ page }) => {
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target('puzzle-tlc'), view);
    const misses = await page.locator('.tlc__spot').evaluateAll((spots) =>
      spots.filter((spot) => {
        const r = spot.getBoundingClientRect();
        const x = r.left + r.width / 2;
        return [r.top + r.height / 2 - 12, r.top + r.height / 2 + 12].some((y) => document.elementFromPoint(x, y) !== spot);
      }).length,
    );
    expect(misses).toBe(0);
  });

  test('the freezer’s cells stay at least 24 px, even at the largest text size in 繁中', async ({ page }) => {
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target('puzzle-freezer'), { ...view, textSize: 3 });
    const sizes = await page.locator('.fz__cell').evaluateAll((els) => els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(24);
  });

  test('the door log’s options and the console’s chips are 44 px tall', async ({ page }) => {
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target('puzzle-doorlog'), { ...view, locale: 'en' });
    for (const h of await page.locator('.dl__opt').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target('puzzle-console'), { ...view, locale: 'en' });
    for (const h of await page.locator('.con__chip').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
  });
});

test('the plate and the log say what reading them costs (#118)', async ({ page }) => {
  for (const [name, words] of [['puzzle-tlc', 'couple of minutes'], ['puzzle-doorlog', 'couple of minutes']] as const) {
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target(name), { ...view, locale: 'en' });
    await expect(page.locator('.pz__intro')).toContainText(words);
  }
});
