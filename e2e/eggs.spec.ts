import { expect, test, type Page } from '@playwright/test';
import { KONAMI } from '../src/ui/eggs.ts';
import { newGame, pick } from './bot.ts';

/**
 * The hidden eggs in the real game (docs/HUMOUR.md §7, #209), in both languages: the Konami code turns a
 * calm room into a group-meeting slide (and does nothing at her desk); the title at 03:33 and on Mole Day.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const press = async (page: Page) => {
  for (const k of KONAMI) await page.keyboard.press(k === 'b' || k === 'a' ? k.toUpperCase() : k);
};
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('dark-reaction.gallery.v1') ?? '{}') as { anomalies?: string[]; achievements?: Record<string, string> });

for (const [locale, w] of [
  ['en', { title: '4.08 Research Write-Up Room (preliminary)', close: 'No questions', promising: 'Results look very promising!!', bed: 'It’s 03:33. Go to bed.', mole: '23 October: Mole Day.' }],
  ['zh-Hant-TW', { title: '4.08 Research Write-Up Room （初步）', close: '沒有問題', promising: '結果看起來非常有希望！！', bed: '03:33 了。去睡覺。', mole: '10 月 23 日，莫耳日。' }],
] as const) {
  test(`${locale}: the Konami code makes a calm room a slide, and does nothing at her desk`, async ({ page }) => {
    await newGame(page, locale);
    await page.locator('.narrative').click({ position: { x: 5, y: 5 } });
    await press(page);
    const slide = page.getByRole('dialog');
    await expect(slide.locator('.slide__title')).toHaveText(w.title);
    await expect(slide).toContainText(w.promising);
    await expect.poll(async () => (await saved(page)).anomalies ?? []).toContain('slide');
    await slide.getByRole('button', { name: w.close }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Her desk is uneasy: nothing.
    await pick(page, 'office.desk7');
    await page.locator('.narrative').click({ position: { x: 5, y: 5 } });
    await press(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test(`${locale}: the title at 03:33, and on Mole Day`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l })), locale);
    await page.clock.setFixedTime(new Date(2026, 10, 25, 3, 33));
    await page.goto('./');
    await expect(page.locator('.title__tagline')).toHaveText(w.bed);
    expect(Object.keys((await saved(page)).achievements ?? {})).toContain('bed');
    await page.clock.setFixedTime(new Date(2026, 9, 23, 14, 0));
    await page.reload();
    await expect(page.locator('.title__tagline')).toContainText(w.mole);
  });
}
