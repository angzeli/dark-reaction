import { expect, test, type Page } from '@playwright/test';
import { ACT_ONE, ROUTES, TUBE_AND_CODE } from '../src/content/routes.ts';
import { newGame, pick, play, strike } from './bot.ts';

/**
 * Endings through the real game: the validator's routes played by the bot
 * (e2e/bot.ts), with what the player should see on the way and at the end.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const GALLERY = 'dark-reaction.gallery.v1';
const gallery = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as { endings: Record<string, { count: number }> } | null, GALLERY);
const paragraphs = (page: Page) => page.locator('.ending__text > *');

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`Clocking Off, in ${locale}: out through fire exit B with the bins, to the ending and back to the title`, async ({ page }) => {
    test.setTimeout(120_000);
    await newGame(page, locale);
    await play(page, ROUTES.clocking!.steps.slice(0, -2));

    // By keyboard, the doorway's first choice is the way back: a stray Enter shuts the door rather than ending the run (#61).
    await page.locator('.choice[data-choice="stairs.exitb.open"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.choice')).toHaveCount(2);
    await expect(page.locator('.narrative__text')).toContainText(locale === 'en' ? 'The door would let you go.' : '這扇門會讓你走');
    // Focus waits on the list (#102): another stray Enter does nothing at all.
    await expect(page.locator('ol.choices')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.choice')).toHaveCount(2);
    await expect(page.locator('article.ending')).toHaveCount(0);
    // Moving into the list, the first choice under the arrow is still the way back (#61).
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.choice[data-choice="stairs.door.close"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.choice[data-choice="stairs.exitb.open"]')).toBeVisible(); // back in the stairwell
    await expect(page.locator('article.ending')).toHaveCount(0);

    // Then deliberately: push the bar again while the bins are still going out, and step out.
    await pick(page, 'stairs.exitb.open');
    await pick(page, 'stairs.leave');

    await expect(page.locator('article.ending[data-ending="clocking"]')).toBeVisible();
    await expect(page.locator('.ending__title')).toHaveText(locale === 'en' ? 'Clocking Off' : '下班');
    await expect(page.locator('.ending__title')).toBeFocused();
    await expect(paragraphs(page)).toHaveCount(11); // no rain line: the rain log was never found
    await expect(page.locator('.ending__text')).toContainText(locale === 'en' ? 'You step out.' : '你走了出去。');
    await expect(page.locator('.ending__text')).not.toContainText('[[');
    expect((await gallery(page))?.endings['clocking']?.count).toBe(1);

    await page.locator('.ending .title__btn').click();
    await expect(page.locator('.title__name')).toBeVisible();
  });
}

test('Honest Noise, in English: a figure bent in loop 1 stops the box being ticked; struck through, the noise goes in', async ({ page }) => {
  test.setTimeout(150_000);
  await newGame(page, 'en');
  const fudged = ACT_ONE.map((s) => ('do' in s && s.do === 'synth.yield.honest' ? { do: 'synth.yield.fudge' } : s));
  await play(page, [...fudged, ...TUBE_AND_CODE, { go: 'office' }, { do: 'office.monitor' }, { do: 'office.submit.own' }]);

  // The 68 % from the first night still stands in the notebook, so the box can't be ticked.
  await expect(page.locator('.narrative__text')).toContainText('Your hand stops over it.');
  await expect(page.locator('.choice[data-choice="office.upload.own"]')).toHaveCount(0);
  await strike(page);
  await expect(page.locator('.narrative__text')).toContainText('through with a single line, then initial and date it.');
  await expect(page.locator('.hud__clock')).toHaveText('03:32');
  // Back comes first on the portal's page, so a stray Enter there can't send anything (#61).
  await expect(page.locator('.choice').first()).toHaveAttribute('data-choice', 'meta:back');
  await pick(page, 'office.upload.own');

  await expect(page.locator('article.ending[data-ending="honest"]')).toBeVisible();
  await expect(page.locator('.ending__title')).toHaveText('Honest Noise');
  await expect(page.locator('.ending__text')).toContainText('Submission received: 03:32.');
  await expect(page.locator('.ending__text')).toContainText('a single line runs through what you wrote');
  await expect(page.locator('.ending__text')).not.toContainText('There is nothing in your notebook');
  expect((await gallery(page))?.endings['honest']?.count).toBe(1);
});

test('Fire Alarm, in 繁中: the door log shows what the building keeps; the call point gets everybody out', async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page, 'zh-Hant-TW');
  await play(page, ROUTES.fire!.steps.slice(0, -2));

  // By keyboard, the first thing under your thumb is the way back: a stray Enter can't end the run.
  await page.locator('.choice[data-choice="stairs.glass"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice')).toHaveCount(2);
  await expect(page.locator('.narrative__text')).toContainText('唯一一個設計來讓所有人都出去的東西');
  await expect(page.locator('ol.choices')).toBeFocused();
  await page.keyboard.press('Enter'); // a stray Enter on the list does nothing (#102)
  await expect(page.locator('.choice')).toHaveCount(2);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.choice[data-choice="stairs.alarm.leave"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice[data-choice="stairs.glass"]')).toBeVisible();
  await expect(page.locator('article.ending')).toHaveCount(0);

  // Then deliberately: thumb on the glass, and break it.
  await pick(page, 'stairs.glass');
  await pick(page, 'stairs.alarm.break');

  await expect(page.locator('article.ending[data-ending="fire"]')).toBeVisible();
  await expect(page.locator('.ending__title')).toHaveText('火災警報');
  await expect(paragraphs(page)).toHaveCount(10);
  await expect(page.locator('.ending__text')).toContainText('LIN Y.C.——到。');
  expect((await gallery(page))?.endings['fire']?.count).toBe(1);
});

test('Infinite Loop, in 繁中: three nights of chasing, then the fourth 03:33 keeps you; the clock stops and the page decays', async ({ page }) => {
  test.setTimeout(180_000);
  await newGame(page, 'zh-Hant-TW');
  await play(page, ROUTES.infinite!.steps);

  await expect(page.locator('article.ending[data-ending="infinite"]')).toBeVisible();
  await expect(page.locator('.ending__title')).toHaveText('無限迴圈');
  await expect(page.locator('.ending__clock')).toHaveText('03:33');
  // …and the same choice, made again, and again: three of them, fading, nothing to press.
  await expect(page.locator('.ending__again li')).toHaveCount(3);
  await expect(page.locator('.ending__again li').first()).toContainText('再跑一次');
  await expect(page.locator('.ending__again button')).toHaveCount(0);
  await expect(paragraphs(page)).toHaveCount(15);
  await expect(page.locator('.ending__text')).toContainText('先泡茶。垃圾桶推出去的時候就回家。');
  // The decay only ever loosens the 繁中 spacing, and never fakes an italic.
  const spacing = await paragraphs(page).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).letterSpacing) || 0));
  for (let i = 1; i < spacing.length; i++) expect(spacing[i]!, `paragraph ${i + 1}`).toBeGreaterThanOrEqual(spacing[i - 1]!);
  expect(spacing.at(-1)!).toBeGreaterThan(spacing[0]!);
  expect(await paragraphs(page).last().evaluate((el) => getComputedStyle(el).fontStyle)).toBe('normal');
  expect((await gallery(page))?.endings['infinite']?.count).toBe(1);
  // In high contrast the fade goes: every repeat stays readable.
  await page.evaluate(() => (document.documentElement.dataset['contrast'] = 'high'));
  const faded = await page.locator('.ending__again li').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  expect(faded).toEqual(['1', '1', '1']);
});

test('at full speed, Enter on the ending finishes the epilogue instead of leaving it; the next Enter goes back', async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page, 'en');
  await play(page, ROUTES.clocking!.steps);
  await expect(page.locator('article.ending')).toBeVisible();

  // Open the same ending again with motion on and the slowest text.
  await page.evaluate(() => {
    const key = 'dark-reaction.settings.v1';
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key) ?? '{}'), reduceMotion: false, textSpeed: 'slow' }));
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await page.evaluate(() => (window as unknown as { darkReaction: { loadSlot(slot: string): boolean } }).darkReaction.loadSlot('auto'));
  await expect(page.locator('article.ending[data-ending="clocking"]')).toBeVisible();
  await expect(page.locator('.ending__title')).toBeFocused();
  await expect(page.locator('.ending__text')).not.toHaveClass(/rv-done/);

  await page.keyboard.press('Enter');
  await expect(page.locator('.ending__text')).toHaveClass(/rv-done/);
  await expect(page.locator('article.ending')).toBeVisible();
  await expect(page.locator('.ending .title__btn')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('.title__name')).toBeVisible();
});
