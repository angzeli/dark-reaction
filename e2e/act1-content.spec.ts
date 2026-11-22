import { expect, test, type Page } from '@playwright/test';

/**
 * Act I's story in the real game: the office at 02:47 (the booking, Dan's
 * email, desk 7), a yield bent and then struck through in the notebook, and
 * the glovebox logbook signed honestly.
 */

test.use({ viewport: { width: 1280, height: 900 } });

async function begin(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true }));
  });
  await page.goto('./');
  await page.getByRole('button', { name: /^(New game|新遊戲)$/ }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('.act-card')).toHaveCount(0);
}
const choose = (page: Page, name: string | RegExp) => page.locator('.choice').filter({ hasText: name }).first().click();
const go = async (page: Page, place: string) => {
  await choose(page, 'Go somewhere else…');
  await choose(page, place);
};
const text = (page: Page) => page.locator('.narrative__text');
const clock = (page: Page) => page.locator('.hud__clock');

test('the office at 02:47: a booking in your name, Dan’s email at 02:50, desk 7', async ({ page }) => {
  await begin(page);
  await choose(page, 'Look at your monitor');
  await expect(text(page)).toContainText('Four windows');
  await choose(page, 'Read the NMR queue');
  await expect(text(page)).toContainText('details restricted to facility staff');
  await choose(page, 'Open the journal portal');
  await expect(text(page)).toContainText('complete and unaltered');
  await choose(page, 'Open the data folder');
  await expect(text(page)).toContainText('Your monitor chimes');
  await choose(page, 'Read Dan’s email');
  await expect(text(page)).toContainText('You’re a star');
  await expect(clock(page)).toHaveText('02:51');
  await choose(page, 'Back');
  await choose(page, 'Look at hot desk 7');
  await choose(page, 'Pick up the white mug');
  await expect(text(page)).toContainText('晨');
  await choose(page, 'Open the drawer');
  await expect(text(page)).toContainText('Y.C.L. 2015–');

  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await nb.getByRole('tab', { name: 'Anomalies' }).click();
  await expect(nb).toContainText('A booking in my name');
  await nb.getByRole('tab', { name: 'People' }).click();
  await expect(nb).toContainText('Desk 7');
  await expect(nb).toContainText('Y.C.L.');
  await expect(nb).toContainText('Says I’m a star');
});

test('a yield bent, then struck through in the notebook: one minute, a single line', async ({ page }) => {
  await begin(page);
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Read the TLC plate');
  const plate = page.getByRole('dialog', { name: 'The fraction plate' });
  await plate.getByRole('button', { name: 'UV lamp: off' }).click();
  for (const n of [12, 13, 14]) await plate.getByRole('button', { name: `Take fraction ${n}` }).click();
  await plate.getByRole('button', { name: 'Combine the fractions you’ve taken' }).click();
  await choose(page, 'Rotavap the combined fractions');
  await expect(text(page)).toContainText('61 per cent');
  await choose(page, 'Write down 68 %');
  await expect(page.locator('.choice').filter({ hasText: 'Write down 61 %' })).toHaveCount(0);
  await expect(clock(page)).toHaveText('02:56');

  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await nb.getByRole('tab', { name: 'Data' }).click();
  await expect(nb.locator('.nb__entry--fudge')).toContainText('68 %');
  await expect(nb.locator('.nb__standing')).toContainText('1 entry stands');
  await nb.getByRole('button', { name: 'Strike it through and initial it (1 min)' }).click();
  if ((await page.getByRole('dialog', { name: 'Notebook' }).count()) === 0) await page.keyboard.press('n');
  await page.getByRole('dialog', { name: 'Notebook' }).getByRole('tab', { name: 'Data' }).click();
  const after = page.getByRole('dialog', { name: 'Notebook' });
  await expect(after.locator('.nb__entry--struck')).toContainText('68 %');
  await expect(after).toContainText('Struck through with a single line');
  await expect(after.locator('.nb__standing')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(clock(page)).toHaveText('02:57');
});

test('the glovebox logbook, signed honestly, and Y.C.’s pencil on the SOP', async ({ page }) => {
  await begin(page);
  await go(page, '4.14 Glovebox room');
  await choose(page, 'Read the SOP on the wall');
  await expect(text(page)).toContainText('THREE. Trust me. — YCL');
  await choose(page, 'Open the glovebox logbook');
  await expect(text(page)).toContainText('ninth of November');
  await choose(page, 'Write “overdue — reported” and email the group');
  await expect(text(page)).toContainText('Nobody will read it before Thursday');
  await expect(page.locator('.choice').filter({ hasText: 'Initial the regeneration check' })).toHaveCount(0);
});
