import { expect, test, type Page } from '@playwright/test';

/** The first-launch content note and the settings panel, against the real build. */

const html = (page: Page) => page.locator('html');

test('the content note comes first, once', async ({ page }) => {
  await page.goto('./');
  const note = page.getByRole('dialog', { name: 'Before you go in' });
  await expect(note).toBeVisible();
  await expect(note).toContainText('no gore and no self-harm');
  // Turning flicker off from the note takes effect immediately.
  await note.getByLabel('Allow flickering lights').uncheck();
  await expect(html(page)).toHaveAttribute('data-flicker', 'off');
  await note.getByRole('button', { name: 'Go in' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-flicker', 'off');
});

test('the content note follows the browser language and can be dismissed with Escape', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'zh-TW' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.getByRole('dialog', { name: '進去之前' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '新遊戲' })).toBeVisible();
  await context.close();
});

test('every setting applies at once, keeps focus, and survives a reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true }));
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  const panel = page.getByRole('dialog', { name: 'Settings' });

  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await panel.getByLabel('Largest').check();
  await expect(html(page)).toHaveAttribute('data-text-size', '3');
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(after).toBeGreaterThan(before);
  // Focus stays on the control the player just used, even though the panel re-rendered.
  expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset['focusKey'])).toBe('textSize:3');

  await panel.getByLabel('Reduce motion').check();
  await expect(html(page)).toHaveAttribute('data-motion', 'reduce');
  await panel.getByLabel('High contrast').check();
  await expect(html(page)).toHaveAttribute('data-contrast', 'high');
  await panel.getByLabel('Instant').check();
  // Volume sliders wait for sound to be turned on.
  await expect(panel.getByLabel('Overall')).toBeDisabled();

  // The panel re-renders in 繁中 (and is renamed 設定), so click rather than check-and-verify.
  await panel.getByLabel('繁體中文').click();
  await expect(html(page)).toHaveAttribute('lang', 'zh-Hant-TW');
  await expect(page.getByRole('dialog', { name: '設定' })).toBeVisible();

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-text-size', '3');
  await expect(html(page)).toHaveAttribute('data-motion', 'reduce');
  await expect(html(page)).toHaveAttribute('data-contrast', 'high');
  await expect(html(page)).toHaveAttribute('lang', 'zh-Hant-TW');
  await expect(page.getByRole('button', { name: '新遊戲' })).toBeVisible();
});

test('settings and the content note are reachable from the in-game menu', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, reduceMotion: true }));
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('.act-card')).toHaveCount(0);
  await page.keyboard.press('m');
  await page.getByRole('button', { name: 'Content note' }).click();
  await expect(page.getByRole('dialog', { name: 'Before you go in' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
});
