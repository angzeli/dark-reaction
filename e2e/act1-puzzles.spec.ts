import { expect, test, type Page } from '@playwright/test';

/**
 * Act I's puzzles through the real game: the TLC plate, the glovebox
 * antechamber and the NMR console, their failure paths, touch-only play,
 * and a language switch in the middle of a puzzle.
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
const go = async (page: Page, place: string | RegExp) => {
  await choose(page, /Go somewhere else|去別的地方/);
  await choose(page, place);
};
const clock = (page: Page) => page.locator('.hud__clock');

async function solveTlc(page: Page) {
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Read the TLC plate');
  const dialog = page.getByRole('dialog', { name: 'The fraction plate' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'UV lamp: off' }).click();
  for (const n of [12, 13, 14]) await dialog.getByRole('button', { name: `Take fraction ${n}` }).click();
  await dialog.getByRole('button', { name: 'Combine the fractions you’ve taken' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('You pour fractions 12, 13 and 14');
}

async function purge(page: Page, cycles: number) {
  const d = page.getByRole('dialog', { name: 'The antechamber' });
  const press = (name: string) => d.getByRole('button', { name, exact: true }).click();
  await press('Open the outer door');
  await press('Put the vial in the antechamber');
  await press('Close the outer door');
  for (let i = 0; i < cycles; i++) {
    await press('Evacuate (2 min)');
    await press('Refill with nitrogen (1 min)');
  }
  await press('Open the inner door');
  await press('Bring the vial into the box');
}

test('the whole Act I chain: plate, rotavap, antechamber, console, a locked queue', async ({ page }) => {
  await begin(page);
  await solveTlc(page);
  await expect(page.locator('.narrative__carry')).toContainText('a flask of fractions 12–14');
  await choose(page, 'Rotavap the combined fractions');
  await expect(page.locator('.narrative__carry')).toContainText('a vial of yellow solid');

  await go(page, '4.14 Glovebox room');
  await choose(page, 'Take the vial in through the antechamber');
  await purge(page, 3);
  const d = page.getByRole('dialog', { name: 'The antechamber' });
  await expect(d.locator('.gb__status')).toContainText('The film is still yellow');
  await d.getByRole('button', { name: 'Bring the NMR tube out' }).click();
  await expect(page.locator('.narrative__carry')).toContainText('your NMR tube');

  await go(page, 'B.03 NMR suite');
  await choose(page, 'Sit down at the console');
  const c = page.getByRole('dialog', { name: 'The NMR console' });
  const input = c.getByRole('textbox', { name: 'Type a command' });
  await input.fill('queue');
  await input.press('Enter');
  await expect(c.locator('.con__log')).toContainText('No bookings you can manage');
  await input.fill('queue --all');
  await input.press('Enter');
  await expect(c.locator('.con__log')).toContainText('PROTON_DARK');
  await input.fill('info 13');
  await input.press('Enter');
  await expect(c.locator('.con__log')).toContainText('it’s still going');
  await c.getByRole('button', { name: 'Write it in your notebook' }).click();
  await expect(page.locator('.narrative__text')).toContainText('a sample you have never made');

  await choose(page, 'Load your NMR tube into the carousel');
  await expect(page.locator('.narrative__text')).toContainText('QUEUE LOCKED');

  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await expect(nb).toContainText('The fractions');
  await expect(nb).toContainText('The antechamber');
  await nb.getByRole('tab', { name: 'Anomalies' }).click();
  await expect(nb).toContainText('The 03:33 booking');
});

test('two purge cycles let the air in: the sample is lost and the vial goes', async ({ page }) => {
  await begin(page);
  await solveTlc(page);
  await choose(page, 'Rotavap the combined fractions');
  await go(page, '4.14 Glovebox room');
  await choose(page, 'Take the vial in through the antechamber');
  await purge(page, 2);
  const d = page.getByRole('dialog', { name: 'The antechamber' });
  await expect(d.locator('.gb__status')).toContainText('Copper(I) to copper(II)');
  await d.getByRole('button', { name: 'Take your hands out of the gloves' }).click();
  await expect(page.locator('.narrative__text')).toContainText('There won’t be another one tonight');
  await expect(page.locator('.narrative__carry')).toHaveCount(0);
  await expect(page.locator('.choice').filter({ hasText: 'antechamber' })).toHaveCount(0);
});

test('a reload mid-purge puts the antechamber back as it was, clock and all', async ({ page }) => {
  await begin(page);
  await solveTlc(page);
  await choose(page, 'Rotavap the combined fractions');
  await go(page, '4.14 Glovebox room');
  await choose(page, 'Take the vial in through the antechamber');
  const d = page.getByRole('dialog', { name: 'The antechamber' });
  for (const n of ['Open the outer door', 'Put the vial in the antechamber', 'Close the outer door', 'Evacuate (2 min)', 'Refill with nitrogen (1 min)']) {
    await d.getByRole('button', { name: n, exact: true }).click();
  }
  await expect(d.locator('.gb__cycles')).toContainText('1');
  const time = (await d.locator('.pz__clock-time').textContent()) ?? '';
  expect(time).toMatch(/^0[23]:\d\d$/);
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  const again = page.getByRole('dialog', { name: 'The antechamber' });
  await expect(again.locator('.gb__cycles')).toContainText('1');
  await expect(again.locator('.gb__where')).toContainText('in the antechamber');
  await expect(again.locator('.pz__clock-time')).toHaveText(time);
  await expect(clock(page)).toHaveText(time);
});

test('the TLC trap: lane 11 looks clean until the UV lamp is on, and wrong guesses cost minutes', async ({ page }) => {
  await begin(page);
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Read the TLC plate');
  const d = page.getByRole('dialog', { name: 'The fraction plate' });
  await expect(d.locator('.tlc__track[data-lane="11"] .tlc__spot')).toHaveCount(1);
  for (const n of [11, 12, 13, 14]) await d.getByRole('button', { name: `Take fraction ${n}` }).click();
  await d.getByRole('button', { name: 'Combine the fractions you’ve taken' }).click();
  await expect(d.locator('.tlc__readout')).toContainText('lying about something');
  await expect(d.locator('.pz__clock-time')).toHaveText('02:52'); // 1 walk + 1 choice + 2 reading + 1 wrong guess
  await d.getByRole('button', { name: 'UV lamp: off' }).click();
  await expect(d.locator('.tlc__track[data-lane="11"] .tlc__spot')).toHaveCount(2);
  await d.locator('.tlc__track[data-lane="12"] .tlc__spot').click();
  await expect(d.locator('.tlc__readout')).toContainText('2.1 cm above the baseline');
  await expect(d.locator('.tlc__readout')).toContainText('Rf = 0.35');
});

test('the console works by touch alone', async ({ page }) => {
  await begin(page);
  await go(page, 'B.03 NMR suite');
  await choose(page, 'Sit down at the console');
  const c = page.getByRole('dialog', { name: 'The NMR console' });
  await c.locator('.con__chip[data-command="queue --all"]').click();
  await c.locator('.con__chip[data-command="info 13"]').click();
  await expect(c.getByRole('button', { name: 'Write it in your notebook' })).toBeVisible();
  await c.locator('.con__chip[data-command="exit"]').click();
  await expect(page.locator('.narrative__text')).toContainText('somebody is going to load a sample');
});

test('switching language mid-puzzle keeps the plate exactly as it was', async ({ page }) => {
  await begin(page);
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Read the TLC plate');
  const d = page.getByRole('dialog', { name: 'The fraction plate' });
  await d.getByRole('button', { name: 'UV lamp: off' }).click();
  await d.getByRole('button', { name: 'Take fraction 13' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: '繁體中文' }).click();
  await page.keyboard.press('Escape');
  const zh = page.getByRole('dialog', { name: '收集液的 TLC 片' });
  await expect(zh).toBeVisible();
  await expect(zh.getByRole('button', { name: 'UV 燈：開' })).toBeVisible();
  await expect(zh.getByRole('button', { name: '取第 13 管' })).toHaveAttribute('aria-pressed', 'true');
  // The minutes already spent on the plate stay spent: 1 walk + 1 choice + 2 reading.
  await expect(zh.locator('.pz__clock-time')).toHaveText('02:51');
  await expect(clock(page)).toHaveText('02:51');
});
