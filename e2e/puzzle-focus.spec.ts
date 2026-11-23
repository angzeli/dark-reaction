import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/** #104: a control that disables itself once pressed mustn't drop keyboard focus out of its puzzle. */
test('focus stays in the antechamber when the button you pressed disables itself (#104)', async ({ page }) => {
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', targets().find((t) => t.name === 'puzzle-glovebox')!, { locale: 'en', reduceMotion: true, highContrast: false });
  const inPuzzle = () => page.evaluate(() => document.activeElement !== document.body && !!document.activeElement?.closest('.pz'));
  await page.getByRole('button', { name: /Open the outer door/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /Put the vial in/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Put the vial in/ })).toBeDisabled();
  await expect.poll(inPuzzle).toBe(true);
  // And the next Tab carries on from there.
  await page.keyboard.press('Tab');
  await expect.poll(inPuzzle).toBe(true);
});
