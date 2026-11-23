import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/** #127: what a choice shows in the minute before 03:33 can be read before the dark. */
test('reading the microSD at 03:30 shows her data, and the lights wait for you', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 43, inventory: ['item.microsd'] };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  const loop = await page.locator('.hud__loop').textContent();
  await page.locator('.choice[data-choice="office.microsd"]').click();
  // Her data is on screen, and it's still there a few seconds later: the dark doesn't start on its own.
  await page.waitForTimeout(2500);
  await expect(page.locator('.narrative__text')).toContainText('NOT_MINE');
  await expect(page.locator('.dr-lightsout')).toHaveCount(0);
  await expect(page.locator('.hud__loop')).toHaveText(loop!);
  await expect(page.locator('.last-minute')).toBeFocused();
  // Then the player's own way on.
  await page.locator('.last-minute').click();
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
  await expect(page.locator('.hud__loop')).not.toHaveText(loop!);
});

test('a minute that only passed (a wait) goes straight into the dark, as before', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 45 };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="meta:wait"]').click();
  await page.locator('.choice[data-choice="wait:1"]').click();
  await expect(page.locator('.last-minute')).toHaveCount(0);
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
});
