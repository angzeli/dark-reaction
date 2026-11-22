import { expect, test, type Page } from '@playwright/test';
import { actThree, resume } from './act3.ts';
import { go, newGame, pick, settle, waitUntil } from './bot.ts';

/**
 * #52: arriving somewhere new (a walk, or 02:47 again) starts at the top
 * with the room's picture in view; choosing within a room keeps the
 * reader's place. At phone width, where it matters most.
 * #72: so do an ending and the title screen.
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

test('an ending starts at the top, its title in view and focused; so does the title screen after it (#72)', async ({ page }) => {
  test.setTimeout(90_000);
  // Act III, knowing the building keeps whoever is inside at 03:33, and having looked at the call point.
  const save = actThree('en', (g) => {
    for (const id of ['nb.keeps', 'nb.callpoint']) g.state.known.push({ id, loop: g.state.loop, minute: 0 });
  });
  // A short phone, landscape-ish, so the call point's page scrolls.
  await page.setViewportSize({ width: 390, height: 480 });
  await resume(page, save, 'en');
  await go(page, 'stairs');
  await pick(page, 'stairs.glass');
  await settle(page);

  // Scrolled down to the last choice, break the glass: Fire Alarm opens at its picture and title.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await scrollY(page)).toBeGreaterThan(0);
  await pick(page, 'stairs.alarm.break');
  await settle(page);
  await expect(page.locator('article.ending[data-ending="fire"]')).toBeVisible();
  expect(await scrollY(page)).toBe(0);
  await expect(page.locator('.ending__title')).toBeFocused();
  await expect(page.locator('.ending__title')).toBeInViewport();

  // Read to the end and go back to the title: it starts at the top too.
  await page.locator('.ending .title__btn').scrollIntoViewIfNeeded();
  expect(await scrollY(page)).toBeGreaterThan(0);
  await page.locator('.ending .title__btn').click();
  await expect(page.locator('.title__btn--primary')).toBeVisible();
  expect(await scrollY(page)).toBe(0);
});

test('quitting to the title from a scrolled room and continuing starts at the top (#72)', async ({ page }) => {
  await newGame(page, 'en');
  await pick(page, 'office.window');
  await settle(page);
  expect(await scrollY(page)).toBeGreaterThan(0);
  await page.keyboard.press('m');
  await page.getByRole('button', { name: 'Quit to title' }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  expect(await scrollY(page)).toBe(0);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.choice').first()).toBeVisible();
  expect(await scrollY(page)).toBe(0);
  expect(await pictureInView(page)).toBe(true);
});
