import { expect, test, type Page } from '@playwright/test';
import { ROUTES } from '../src/content/routes.ts';
import { newGame, play } from './bot.ts';

/**
 * 繁中 has no italic face, and a synthesised oblique is never right for CJK
 * (#55): emphasis stays upright and is marked by its ink instead, and
 * nothing styled italic is ever sheared.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const emphasis = (page: Page, scope: string) =>
  page.locator(`${scope} em`).evaluateAll((els) =>
    els.map((el) => ({ style: getComputedStyle(el).fontStyle, color: getComputedStyle(el).color, around: getComputedStyle(el.parentElement!).color })),
  );

test('in 繁中, emphasis is upright and tinted, from the first page of j’s to an ending', async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page, 'zh-Hant-TW');
  const first = await emphasis(page, '.narrative__text');
  expect(first.length).toBeGreaterThan(0);
  for (const em of first) {
    expect(em.style).toBe('normal');
    expect(em.color).not.toBe(em.around);
  }
  expect(await page.locator('.narrative__text .para').first().evaluate((el) => getComputedStyle(el).fontSynthesisStyle)).toBe('none');

  await play(page, ROUTES.clocking!.steps);
  await expect(page.locator('article.ending')).toBeVisible();
  const ending = await emphasis(page, '.ending__text');
  expect(ending.length).toBeGreaterThan(0);
  for (const em of ending) expect(em.style).toBe('normal');
});

test('English keeps its italics', async ({ page }) => {
  await newGame(page, 'en');
  const first = await emphasis(page, '.narrative__text');
  expect(first.length).toBeGreaterThan(0);
  for (const em of first) expect(em.style).toBe('italic');
});
