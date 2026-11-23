import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/** #116: opening the travel menu on a phone keeps your place, doesn't retype the page, and shows the menu. */
test('on a phone, “Go somewhere else…” opens where your thumb is (#116)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const office = targets().find((t) => t.name === 'act2-office')!;
  // Normal text speed and motion, as the mobile player had them: the reveal is what retyped the page.
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', office, { locale: 'zh-Hant-TW', reduceMotion: false, highContrast: false, textSpeed: 'normal' });
  const travel = page.locator('.choice[data-choice="meta:travel"]');
  await expect(travel).toBeVisible({ timeout: 15_000 });
  await travel.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(0);
  await travel.tap();
  // No re-reveal: every word of the passage is already in.
  await expect(page.locator('.narrative__text .rv-pending')).toHaveCount(0);
  // The place is kept (not back at the top), and the destinations are on screen.
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('.choice[data-choice="go:nmr"]')).toBeInViewport();
  await context.close();
});
