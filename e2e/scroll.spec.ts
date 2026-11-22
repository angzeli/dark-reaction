import { expect, test, type Page } from '@playwright/test';
import { newGame, pick, settle, waitUntil } from './bot.ts';

/**
 * #52: arriving somewhere new (a walk, or 02:47 again) starts at the top
 * with the room's picture in view; choosing within a room keeps the
 * reader's place. At phone width, where it matters most.
 */

test.use({ viewport: { width: 390, height: 844 } });

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const pictureInView = (page: Page) =>
  page.locator('.play__art').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight && r.bottom > 0;
  });

test('a new room or a new loop starts at the top; a choice in the same room keeps your place', async ({ page }) => {
  test.setTimeout(90_000);
  await newGame(page, 'en');

  // In the office: a choice near the bottom of the page leaves you where you were.
  await pick(page, 'office.window');
  await settle(page);
  expect(await scrollY(page)).toBeGreaterThan(0);

  // Scroll down to "Go somewhere else…" and walk: the lab starts at the top.
  await pick(page, 'meta:travel');
  expect(await scrollY(page)).toBeGreaterThan(0);
  await pick(page, 'go:synth');
  await settle(page);
  expect(await scrollY(page)).toBe(0);
  expect(await pictureInView(page)).toBe(true);

  // Scrolled down again, the night runs out: 02:47 starts at the top too.
  await page.locator('.choice[data-choice="meta:wait"]').scrollIntoViewIfNeeded();
  expect(await scrollY(page)).toBeGreaterThan(0);
  await waitUntil(page, 46);
  await settle(page);
  await expect(page.locator('.hud__loop')).toHaveText('Loop 2');
  expect(await scrollY(page)).toBe(0);
  expect(await pictureInView(page)).toBe(true);
});
