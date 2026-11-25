import { expect, test, type Page } from '@playwright/test';
import { CONTENT } from '../src/content/index.ts';
import { newGame, pick } from './bot.ts';

/**
 * Achievements and the anomaly counter (docs/HUMOUR.md §6–7, #208), in both languages: the credits' last
 * line is an anomaly, and the gallery says so; an achievement earned in play is said once, on its page,
 * and kept in the gallery for the next game.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const N = CONTENT.anomalies.length;

async function title(page: Page, locale: 'en' | 'zh-Hant-TW') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((l) => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l }));
  }, locale);
  await page.goto('./');
}

for (const [locale, words] of [
  ['en', { credits: 'Credits', endings: 'Endings', reviewer: 'Reviewer 2 — uncredited (as requested)', uncredited: 'Uncredited (As Requested)', locked: 'Under review', count: (n: number) => `Anomalies found: ${n}/${N}`, earned: 'Achievement: Risk Assessed.', coshh: 'Risk Assessed' }],
  ['zh-Hant-TW', { credits: '製作名單', endings: '結局一覽', reviewer: 'Reviewer 2——應本人要求，不具名', uncredited: '匿名審查', locked: '審查中', count: (n: number) => `找到的異常：${n}/${N}`, earned: '成就：跑完流程', coshh: '跑完流程' }],
] as const) {
  test(`${locale}: the credits' last line is an anomaly, and the gallery counts it`, async ({ page }) => {
    await title(page, locale);
    await page.getByRole('button', { name: words.endings }).click();
    let g = page.getByRole('dialog', { name: words.endings });
    await expect(g.locator('.gal__anomalies')).toHaveText(words.count(0));
    await expect(g.locator('.gal__ach--locked')).toHaveCount(CONTENT.achievements.length);
    await expect(g.locator('.gal__ach--locked').first()).toHaveText(words.locked);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: words.credits }).click();
    const c = page.getByRole('dialog', { name: words.credits });
    await expect(c.locator('.credits__line--last')).toHaveText(words.reviewer);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: words.endings }).click();
    g = page.getByRole('dialog', { name: words.endings });
    await expect(g.locator('.gal__anomalies')).toHaveText(words.count(1));
    await expect(g.locator('.gal__ach[data-achievement="uncredited"] .gal__ach-title')).toHaveText(words.uncredited);
  });

  test(`${locale}: an achievement is said once, quietly, at the foot of the screen, and kept for the next game`, async ({ page }) => {
    test.setTimeout(60_000);
    await newGame(page, locale);
    await pick(page, 'office.around');
    await pick(page, 'office.pencil');
    // Never in the passage itself (#211): the status line at the foot, which a screen reader hears.
    await expect(page.locator('.app__status')).toHaveText(words.earned);
    await expect(page.locator('.narrative__text')).not.toContainText(words.earned);
    await expect(page.locator('.app__status')).toHaveText('', { timeout: 8_000 });
    await pick(page, 'office.plate');
    await expect(page.locator('.app__status')).toHaveText('');
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('dark-reaction.gallery.v1') ?? '{}') as { anomalies?: string[]; achievements?: Record<string, string> });
    expect(kept.anomalies).toEqual(expect.arrayContaining(['coshh', 'plate']));
    expect(Object.keys(kept.achievements ?? {})).toEqual(['coshh']);
  });
}

// A find inside a puzzle is said at once, at the foot of the screen, and never in the passage.
test('en: sudo at the console is said at the foot of the screen, not in the passage', async ({ page }) => {
  test.setTimeout(60_000);
  await newGame(page, 'en');
  await pick(page, 'meta:travel');
  await pick(page, 'go:nmr');
  await pick(page, 'nmr.console');
  const input = page.locator('.con__input');
  await input.fill('sudo make me a sandwich');
  await input.press('Enter');
  await expect(page.locator('.con__log')).toContainText('reported to your PI');
  await expect(page.locator('.app__status')).toHaveText('Achievement: This Incident Will Be Reported.');
  await input.fill('exit');
  await input.press('Enter');
  await expect(page.locator('.narrative__text')).not.toContainText('Achievement:');
});
