import { expect, test, type Page } from '@playwright/test';
import { newGame, pick, settle, waitUntil } from './bot.ts';

/**
 * #71: as the lights go out, the room you were in stays on screen under the
 * fade, with what just happened, 03:33 on the clock and nothing to choose;
 * 02:47 is drawn only once it is dark.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const seen = (page: Page) =>
  page.evaluate(() => ({
    overlay: document.querySelectorAll('.dr-lightsout').length,
    place: document.querySelector('.hud__place')?.textContent,
    clock: document.querySelector('.hud__clock')?.textContent,
    loop: document.querySelector('.hud__loop')?.textContent,
    choices: document.querySelectorAll('.choice').length,
    text: document.querySelector('.narrative__text')?.textContent ?? '',
  }));

test('the room stays as it was under the fade, then 02:47 is drawn in the dark', async ({ page }) => {
  test.setTimeout(90_000);
  await newGame(page, 'en');
  await pick(page, 'meta:travel');
  await pick(page, 'go:synth');
  await settle(page);
  await waitUntil(page, 45);
  await expect(page.locator('.hud__clock')).toHaveText('03:32');

  // One more minute: the clock runs out on this choice.
  await pick(page, 'meta:wait');
  await pick(page, 'wait:1');
  const fading = await seen(page);
  expect(fading).toMatchObject({ overlay: 1, place: '4.12 Synthesis lab', clock: '03:33', loop: 'Loop 1', choices: 0 });
  // What just happened, not 02:47's first lines.
  expect(fading.text).not.toContain('You come to');
  expect(fading.text.length).toBeGreaterThan(0);

  await settle(page);
  await expect(page.locator('.dr-lightsout')).toHaveCount(0);
  await expect(page.locator('.hud__loop')).toHaveText('Loop 2');
  await expect(page.locator('.hud__clock')).toHaveText('02:47');
  await expect(page.locator('.hud__place')).not.toHaveText('4.12 Synthesis lab');
  await expect(page.locator('.choice').first()).toBeVisible();
});
