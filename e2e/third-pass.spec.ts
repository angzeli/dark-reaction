import { expect, test, type Locator } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';
import { SOLVERS } from './bot.ts';

const base = 'http://localhost:4173/dark-reaction/';
const target = (name: string) => targets().find((t) => t.name === name)!;

/** #185: layout slips the third pass found on a phone at the largest text size. */
test.describe('on a phone at the largest text', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('an overlay’s title clears its Close button (#185)', async ({ page }) => {
    await loadTarget(page, base, target('title-note'), { locale: 'en', reduceMotion: true, highContrast: false, textSize: 3 });
    const title = (await page.locator('#overlay-title').boundingBox())!;
    const close = (await page.locator('.overlay__close').boundingBox())!;
    const titleText = await page.locator('#overlay-title').evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return [...r.getClientRects()].map((b) => ({ right: b.right, top: b.top, bottom: b.bottom }));
    });
    for (const line of titleText) {
      const overlapsVertically = line.bottom > close.y && line.top < close.y + close.height;
      if (overlapsVertically) expect(line.right).toBeLessThanOrEqual(close.x + 1);
    }
    expect(title.width).toBeGreaterThan(0);
  });

  test('the door log keeps times, doors and events to one line in 繁中 (#185)', async ({ page }) => {
    await loadTarget(page, base, target('puzzle-doorlog'), { locale: 'zh-Hant-TW', reduceMotion: true, highContrast: false, textSize: 3 });
    // Lines of text, not the cell's height (a row is as tall as its wrapping badge).
    const lines = await page.locator('.dl__event, .dl__door').evaluateAll((els) =>
      els.map((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return { text: el.textContent, lines: new Set([...r.getClientRects()].map((b) => Math.round(b.top))).size };
      }),
    );
    expect(lines.filter((l) => l.lines > 1)).toEqual([]);
  });

  test('the TLC plate’s crude lane label doesn’t run into lane 10 (#185)', async ({ page }) => {
    for (const locale of ['en', 'zh-Hant-TW'] as const) {
      await loadTarget(page, base, target('puzzle-tlc'), { locale, reduceMotion: true, highContrast: false, textSize: 3 });
      const labels = page.locator('.tlc__label');
      const crude = (await labels.nth(0).boundingBox())!;
      const ten = (await labels.nth(1).boundingBox())!;
      expect(crude.x + crude.width, locale).toBeLessThanOrEqual(ten.x + 1);
    }
  });
});

test('a notice is opaque over the text it covers (#185)', async ({ page }) => {
  await loadTarget(page, base, target('act2-office'), { locale: 'en', reduceMotion: true, highContrast: false });
  await page.evaluate(() => (window as unknown as { darkReaction: { loadSlot(s: string): boolean } }).darkReaction.loadSlot('auto'));
  const notice = page.locator('.app__status');
  await expect(notice).not.toBeEmpty();
  expect(await notice.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(7, 14, 22)');
});

test('once the freezer is solved its lift button goes, rather than saying E5 is back in its slot (#185)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-freezer'), { locale: 'en', reduceMotion: true, highContrast: false });
  const press = async (control: Locator) => {
    if (!(await control.evaluate((el) => el.matches('.fz__finish')))) await control.click();
  };
  await SOLVERS['freezer']!(page, press);
  await expect(page.locator('.fz__finish')).toBeVisible();
  await expect(page.locator('.fz__lift')).toBeHidden();
});
