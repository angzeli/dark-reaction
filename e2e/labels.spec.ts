import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/** #117: a wait option says its minutes once (“Wait 1 minute”, not “Wait 1 minute 1 min”). */
test('wait options say their minutes once (#117)', async ({ page }) => {
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', targets().find((t) => t.name === 'act2-office')!, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="meta:wait"]').click();
  await expect(page.locator('.choice[data-choice="wait:1"]')).toHaveAccessibleName('Wait 1 minute');
  await expect(page.locator('.choice[data-choice="wait:10"]')).toHaveAccessibleName('Wait 10 minutes');
});
