import { expect, test, type Page } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const base = 'http://localhost:4173/dark-reaction/';
const ring = (page: Page) => page.evaluate(() => getComputedStyle(document.activeElement!).outlineColor);

/** #111: focus is easy to see inside puzzles, and high contrast reaches them. */
test('on the TLC plate, focus is the dark blue every paper surface uses (#111)', async ({ page }) => {
  await loadTarget(page, base, targets().find((t) => t.name === 'puzzle-tlc')!, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.keyboard.press('Tab'); // a keyboard user: focus is then :focus-visible
  await page.locator('.tlc__take').first().focus();
  expect(await ring(page)).toBe('rgb(27, 95, 208)');
  await page.locator('.tlc__spot').first().focus();
  expect(await ring(page)).toBe('rgb(27, 95, 208)');
});

test('under the UV lamp the ring turns the plate’s dark ink, which the green plate doesn’t swallow (#148)', async ({ page }) => {
  await loadTarget(page, base, targets().find((t) => t.name === 'puzzle-tlc')!, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.keyboard.press('Tab');
  await page.locator('.tlc__uv').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.tlc__plate--uv')).toBeVisible();
  await page.locator('.tlc__spot').first().focus();
  expect(await ring(page)).toBe('rgb(12, 36, 22)');
  await page.locator('.tlc__take').first().focus();
  expect(await ring(page)).toBe('rgb(12, 36, 22)');
});

test('in high contrast the console’s command line gets the yellow ring too (#148)', async ({ page }) => {
  await loadTarget(page, base, targets().find((t) => t.name === 'puzzle-console')!, { locale: 'en', reduceMotion: true, highContrast: true });
  await page.keyboard.press('Tab');
  await page.locator('.con__input').focus();
  expect(await ring(page)).toBe('rgb(255, 210, 122)');
});

test('in high contrast, puzzle controls and choices get the yellow ring (#111)', async ({ page }) => {
  await loadTarget(page, base, targets().find((t) => t.name === 'puzzle-console')!, { locale: 'en', reduceMotion: true, highContrast: true });
  await page.keyboard.press('Tab');
  await page.locator('.pz__hint-btn').focus();
  expect(await ring(page)).toBe('rgb(255, 210, 122)');
  await page.locator('.pz__leave').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.choice').first()).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).toBe('solid');
  expect(await ring(page)).toBe('rgb(255, 210, 122)');
});
