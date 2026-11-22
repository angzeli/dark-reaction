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

test('a puzzle that runs the clock out leaves no choices under the fade, even while its page is still revealing (#80)', async ({ page }) => {
  test.setTimeout(90_000);
  await newGame(page, 'en', { reducedMotion: false });
  await pick(page, 'meta:travel');
  await pick(page, 'go:synth');
  await settle(page);
  await waitUntil(page, 40);
  // Watch the page from here on: any choice drawn while the old night is still under the fade is a stale one.
  await page.evaluate(() => {
    const w = window as unknown as { stale: number };
    w.stale = 0;
    new MutationObserver(() => {
      const fading = document.querySelector('.dr-lightsout') && document.querySelector('.hud__loop')?.textContent === 'Loop 1';
      if (fading && document.querySelectorAll('.choice').length > 0) w.stale++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  // The plate opens over a page that is still revealing its text; wrong combinations cost a minute each.
  await pick(page, 'synth.plate');
  await expect(page.locator('.pz')).toBeVisible();
  await page.locator('.tlc__take[data-lane="10"]').click(); // a fraction with no product in it
  // Wrong combinations until 03:33 takes the plate away (the last click may find it gone).
  for (let i = 0; i < 12 && (await page.locator('.pz').count()); i++) await page.locator('.tlc__combine').click({ timeout: 1000 }).catch(() => undefined);
  await expect(page.locator('.hud__loop')).toHaveText('Loop 2', { timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as { stale: number }).stale)).toBe(0);
  await settle(page);
  await expect(page.locator('.hud__loop')).toHaveText('Loop 2');
});
