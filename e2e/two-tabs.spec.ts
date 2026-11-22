import { expect, test, type Page } from '@playwright/test';

/**
 * Two tabs on the same night (#38). localStorage is shared, so a tab that
 * didn't write the latest autosave must stop saving over it and ask.
 */

const pick = (page: Page, id: string) => page.locator(`.choice[data-choice="${id}"]`).click();
const clock = (page: Page) => page.locator('.hud__clock');
const autosaveMinute = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('dark-reaction.save.auto') ?? 'null') as { state: { minute: number } } | null)?.state.minute ?? null);

test('when another tab saves, this one stops saving and asks; either answer keeps both safe', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true }));
  });
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto('./');
  await b.goto('./');

  // Tab A starts the night and saves; tab B, still on the title screen, can now continue it.
  await a.getByRole('button', { name: 'New game' }).click();
  await a.keyboard.press('Enter');
  await pick(a, 'office.window');
  await expect(clock(a)).toHaveText('02:48');
  await b.getByRole('button', { name: 'Continue' }).click();
  await expect(clock(b)).toHaveText('02:48');

  // A moves on and saves. B's night is now stale: it stops saving and asks.
  await pick(a, 'office.phone');
  await expect(clock(a)).toHaveText('02:49');
  const askB = b.getByRole('dialog', { name: 'Open in another tab' });
  await expect(askB).toBeVisible();
  await b.keyboard.press('Escape');
  await expect(askB).toBeVisible(); // it has to be answered
  expect(await autosaveMinute(b)).toBe(2);

  // B loads the newer save and carries on from A's 02:49.
  await askB.getByRole('button', { name: 'Load the newer save' }).click();
  await expect(clock(b)).toHaveText('02:49');
  await pick(b, 'office.tea');
  await expect(clock(b)).toHaveText('02:53');
  expect(await autosaveMinute(b)).toBe(6);

  // Now A is the stale one. Choosing to keep playing saves A's night over B's, and B is asked in turn.
  const askA = a.getByRole('dialog', { name: 'Open in another tab' });
  await expect(askA).toBeVisible();
  await askA.getByRole('button', { name: 'Keep playing here and save over it' }).click();
  await expect(askA).toHaveCount(0);
  expect(await autosaveMinute(a)).toBe(2);
  await expect(b.getByRole('dialog', { name: 'Open in another tab' })).toBeVisible();

  await context.close();
});
