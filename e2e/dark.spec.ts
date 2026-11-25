import { expect, test, type Page } from '@playwright/test';
import { DARK_NIGHT } from '../src/content/routes.ts';
import { actThree, resume, type Locale } from './act3.ts';
import { play, settle } from './bot.ts';

/**
 * Dark Reaction through the real UI (#20 part B, #22): the true ending's
 * last night, from an Act III night built in the engine with her traces
 * found, Figure 3 proved and the UPS's PIN known. The bot fills her tube
 * on the Kraken, arms the UPS, loads holder 13 and waits; at 03:33 the
 * lights go out, the room stays dark around the console, and her peak is
 * found in the dark.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const ready = (locale: Locale, opts: { proved?: boolean } = {}) =>
  actThree(locale, (g) => {
    // Her mini-antechamber gives yc.tube tonight; the rest she has left already.
    g.state.fragments.push('yc.email', 'yc.raw', 'yc.flask', 'yc.chirp', 'yc.mug', 'yc.desk', 'yc.sop', 'yc.notebook');
    if (opts.proved ?? true) g.state.known.push({ id: 'nb.fabrication', loop: g.state.loop, minute: 0 });
    g.state.solved.push('chirp');
  });

const gallery = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('dark-reaction.gallery.v1') ?? 'null') as { endings: Record<string, { count: number }> } | null);

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`Dark Reaction, in ${locale}: her tube in the dark, holder 13 at 03:33, her peak found`, async ({ page }) => {
    test.setTimeout(120_000);
    await resume(page, ready(locale), locale);
    await play(page, DARK_NIGHT.slice(0, -1));

    // 03:33: the peak match is open over the NMR suite drawn in the dark.
    await expect(page.locator('.pz[data-puzzle="peakmatch"]')).toBeVisible();
    await expect(page.locator('.hud__clock')).toHaveText('03:33');
    await expect(page.locator('.play__art svg.dr-scene--dark')).toHaveCount(1);
    // It opens once, after the lights-out card: the card is gone and focus is on the puzzle's title.
    await expect(page.locator('.dr-lightsout')).toHaveCount(0);
    await expect(page.locator('.pz__title')).toBeFocused();
    await play(page, [DARK_NIGHT.at(-1)!]);

    await expect(page.locator('article.ending[data-ending="dark"]')).toBeVisible();
    await expect(page.locator('.ending__title')).toHaveText(locale === 'en' ? 'Dark Reaction' : '暗反應');
    await expect(page.locator('.ending__text > *')).toHaveCount(12);
    await expect(page.locator('.ending__text')).toContainText('06:12');
    expect((await gallery(page))?.endings['dark']?.count).toBe(1);
  });
}

test('looking away from her peak ends the night: the button says so, and the dark room stays until it is dark', async ({ page }) => {
  test.setTimeout(120_000);
  await resume(page, ready('zh-Hant-TW'), 'zh-Hant-TW');
  await play(page, DARK_NIGHT.slice(0, -1));
  await expect(page.locator('.pz__leave')).toHaveText('把視線移開');
  await expect(page.locator('.pz__intro')).toContainText('只要移開視線，這一夜就在這裡結束。');
  await page.locator('.pz__leave').click();
  // Under the fade: the NMR suite still, her peak gone, the line about looking away, nothing to choose.
  const fading = await page.evaluate(() => ({
    puzzle: document.querySelectorAll('.pz').length,
    place: document.querySelector('.hud__place')?.textContent,
    choices: document.querySelectorAll('.choice').length,
    text: document.querySelector('.narrative__text')?.textContent ?? '',
  }));
  expect(fading).toMatchObject({ puzzle: 0, place: 'B12 NMR 室', choices: 0 });
  expect(fading.text).toContain('黑暗就靠了過來');
  await settle(page);
  await expect(page.locator('.hud__clock')).toHaveText('02:47');
  await expect(page.locator('article.ending')).toHaveCount(0);
});

test('with Figure 3 unproved the run gives only noise, a page in your hand says why, and it is 02:47', async ({ page }) => {
  test.setTimeout(120_000);
  await resume(page, ready('en', { proved: false }), 'en');
  await play(page, DARK_NIGHT.slice(0, -2));
  await play(page, [{ night: true }]);
  await expect(page.locator('.hud__clock')).toHaveText('02:47');
  await expect(page.locator('.narrative__text')).toContainText('noise and only noise');
  await expect(page.locator('.narrative__text')).toContainText('Not while Figure 3 still stands.');
  await expect(page.locator('article.ending')).toHaveCount(0);
});
