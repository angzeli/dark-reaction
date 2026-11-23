import { expect, test } from '@playwright/test';
import { ACT_ONE } from '../src/content/routes.ts';
import { newGame, pick, play } from './bot.ts';

/**
 * #86: the NMR console stays findable. Act I is played through the real UI;
 * in Act II, Dan's sticky note gives Ian's priority code, and the NMR suite is
 * visited without a tube: the console is still there, and typing the code says
 * what is missing.
 */

test.use({ viewport: { width: 1280, height: 900 } });

for (const [locale, empty, again] of [
  ['en', 'NO SAMPLE IN CAROUSEL', 'Check the queue on the console again'],
  ['zh-Hant-TW', 'NO SAMPLE IN CAROUSEL', '到主控台前，再查一次排程'],
] as const) {
  test(`${locale}: knowing RIDLEY-4 without your tube, the console is there and says what to bring`, async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, locale);
    await play(page, ACT_ONE);
    await expect(page.locator('.hud__loop')).toContainText('2');
    // 03:15: Dan's office is open for the Monday clean; his monitor has Ian's code.
    await play(page, [{ go: 'stairs' }, { until: 28 }, { go: 'pi' }, { do: 'pi.sticky' }, { go: 'nmr' }]);
    await expect(page.locator('.choice[data-choice="nmr.run"]')).toHaveCount(0);
    await expect(page.locator('.choice[data-choice="nmr.console.again"]')).toContainText(again);
    await pick(page, 'nmr.code');
    await expect(page.locator('.narrative__text')).toContainText(empty);
    // Checking the queue doesn't use the console up for the night.
    await pick(page, 'nmr.console.again');
    await pick(page, 'nmr.console.again');
    await expect(page.locator('.choice[data-choice="nmr.console.again"]')).toBeVisible();
  });
}
