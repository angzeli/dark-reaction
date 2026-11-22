import { expect, test, type Page } from '@playwright/test';
import { ROUTES } from '../src/content/routes.ts';
import { play, settle } from './bot.ts';

/**
 * 結局一覽 (#23): from the title and from the in-game menu. Found endings
 * show their title and picture; the rest a silhouette and their clue. The
 * gallery outlives the game that found it, and the next night's notebook
 * carries pencil in its margins.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const gallery = (page: Page, name: string) => page.getByRole('dialog', { name });

async function begin(page: Page, locale: 'en' | 'zh-Hant-TW') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((l) => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l }));
  }, locale);
  await page.goto('./');
}

test('found endings are lit, the rest are clues; the gallery outlives the night that found it', async ({ page }) => {
  test.setTimeout(120_000);
  await begin(page, 'en');

  // Nothing found yet: six silhouettes, six clues.
  await page.getByRole('button', { name: 'Endings' }).click();
  const g = gallery(page, 'Endings');
  await expect(g.locator('.gal__item')).toHaveCount(6);
  await expect(g.locator('.gal__item--unfound')).toHaveCount(6);
  await expect(g.locator('.gal__count')).toHaveText('0 of 6 found');
  await expect(g.locator('.gal__item[data-ending="clocking"] .gal__clue')).toHaveText('Some doors only open for the bins.');
  await expect(g.locator('.gal__item[data-ending="fire"] .gal__title')).toHaveText('Not yet found');
  await page.keyboard.press('Escape');
  await expect(g).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Endings' })).toBeFocused();

  // Clock off, then look again from the title.
  await page.locator('.title__btn--primary').click();
  await settle(page);
  await play(page, ROUTES.clocking!.steps);
  await page.locator('.ending .title__btn').click();
  await page.getByRole('button', { name: 'Endings' }).click();
  await expect(g.locator('.gal__count')).toHaveText('1 of 6 found');
  const clocking = g.locator('.gal__item[data-ending="clocking"]');
  await expect(clocking).not.toHaveClass(/gal__item--unfound/);
  await expect(clocking.locator('.gal__title')).toHaveText('Clocking Off');
  await expect(clocking.locator('.gal__meta')).toContainText('Reached 1 time, first on');
  await expect(clocking.locator('.gal__clue')).toHaveCount(0);
  await expect(g.locator('.gal__item--unfound')).toHaveCount(5);
  await page.keyboard.press('Escape');

  // A new night: the gallery is still there from the menu, and the notebook remembers in pencil.
  await page.locator('.title__btn--primary').click();
  await settle(page);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Endings' }).click();
  await expect(g.locator('.gal__count')).toHaveText('1 of 6 found');
  await page.keyboard.press('Escape');
  await page.keyboard.press('n');
  const margins = page.getByRole('dialog', { name: 'Notebook' }).locator('.nb__margins');
  await expect(margins).toContainText('TLC: 12–14.');
  await expect(margins).toContainText('Console: queue --all, then info 13.');
});

test('in 繁中 the gallery is 結局一覽, its clues upright', async ({ page }) => {
  await begin(page, 'zh-Hant-TW');
  await page.getByRole('button', { name: '結局一覽' }).click();
  const g = gallery(page, '結局一覽');
  await expect(g.locator('.gal__count')).toHaveText('已找到 0／6');
  const clue = g.locator('.gal__item[data-ending="clocking"] .gal__clue');
  await expect(clue).toHaveText('有些門，只為垃圾車開。');
  expect(await clue.evaluate((el) => getComputedStyle(el).fontStyle)).toBe('normal');
});
