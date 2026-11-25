import { expect, test, type Page } from '@playwright/test';

/**
 * From a new game into Act II, played for real: the three Act I puzzles,
 * the first 03:33, the Act II card and its page about doors, then a Monday
 * worked to the minute: the shortcuts, Dan's office at 03:15, the priority
 * code, your own noise, and the spectrum the night prints at 03:25.
 */

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

const choose = (page: Page, name: string | RegExp) => page.locator('.choice').filter({ hasText: name }).first().click();
const go = async (page: Page, place: string) => {
  await choose(page, 'Go somewhere else…');
  await choose(page, place);
};
const clock = (page: Page) => page.locator('.hud__clock');
const text = (page: Page) => page.locator('.narrative__text');
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h! * 60 + m! - (2 * 60 + 47) + 1440) % 1440;
};

/** Wait until the clock reads at least `target`; the night's events cut some waits short. */
async function waitUntil(page: Page, target: string) {
  for (let i = 0; i < 30; i++) {
    const left = minutes(target) - minutes((await clock(page).textContent()) ?? '02:47');
    if (left <= 0) return;
    const n = left >= 10 ? 10 : left >= 5 ? 5 : 1;
    await choose(page, 'Wait…');
    await choose(page, `Wait ${n} minute`);
  }
}

test('into Act II: the doors, Dan’s office at 03:15, your noise, and the spectrum the night prints', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true }));
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('.act-card')).toHaveCount(0);

  // Loop 1: the three Act I puzzles.
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Read the TLC plate');
  const plate = page.getByRole('dialog', { name: 'The fraction plate' });
  await plate.getByRole('button', { name: 'UV lamp: off' }).click();
  for (const n of [12, 13, 14]) await plate.getByRole('button', { name: `Take fraction ${n}` }).click();
  await plate.getByRole('button', { name: 'Combine the fractions you’ve taken' }).click();
  await choose(page, 'Rotavap the combined fractions');
  await choose(page, 'Write down 61 %');
  await go(page, '4.14 Glovebox room');
  await choose(page, 'Take the vial in through the antechamber');
  const box = page.getByRole('dialog', { name: 'The antechamber' });
  const press = (name: string) => box.getByRole('button', { name, exact: true }).click();
  for (const n of ['Open the outer door', 'Put the vial in the antechamber', 'Close the outer door']) await press(n);
  for (let i = 0; i < 3; i++) {
    await press('Evacuate (2 min)');
    await press('Refill with nitrogen (1 min)');
  }
  await press('Open the inner door');
  await press('Bring the vial into the box');
  await box.getByRole('button', { name: 'Bring the NMR tube out' }).click();
  await go(page, 'B12 NMR suite');
  await choose(page, 'Sit down at the console');
  const con = page.getByRole('dialog', { name: 'The NMR console' });
  await con.locator('.con__chip[data-command="queue --all"]').click();
  await con.locator('.con__chip[data-command="info 13"]').click();
  await con.getByRole('button', { name: 'Write it in your notebook' }).click();

  // The first 03:33, then Act II.
  for (let i = 0; i < 15; i++) {
    if ((await page.locator('.act-card').count()) > 0) break;
    const wait = page.locator('.choice').filter({ hasText: 'Wait…' });
    if ((await wait.count()) === 0) {
      await page.waitForTimeout(250);
      continue;
    }
    await wait.first().click();
    await choose(page, 'Wait 10 minutes');
  }
  await expect(page.locator('.act-card__title')).toHaveText('Traces');
  await page.keyboard.press('Enter');
  await expect(page.locator('.act-card')).toHaveCount(0);
  await expect(clock(page)).toHaveText('02:47');
  await expect(text(page)).toContainText('The doors remember everyone');
  await expect(text(page)).toContainText('You know the order of the night now');

  // A Monday worked to the minute: the shortcuts, then Dan's office.
  await go(page, '4.12 Synthesis lab');
  await choose(page, 'Combine fractions 12, 13 and 14');
  await choose(page, 'Rotavap the combined fractions');
  await go(page, '4.14 Glovebox room');
  await choose(page, 'Run the purge you worked out');
  await expect(page.locator('.narrative__carry')).toContainText('your NMR tube');
  await go(page, '4.08 Research Write-Up Room');
  await waitUntil(page, '03:15');
  await expect(text(page)).toContainText('a lock clicks back');
  await go(page, '4.01 Prof. Ridley');
  await expect(text(page)).toContainText('warmer than the rest of the floor');
  await choose(page, 'Read the email printed on the desk');
  await expect(text(page)).toContainText('the 03:33 spectrum isn’t mine');
  await choose(page, 'Read the sticky note on Dan’s monitor');
  await expect(text(page)).toContainText('RIDLEY-4');

  // The code jumps the queue: noise. The night prints the rest.
  await go(page, 'B12 NMR suite');
  await choose(page, 'Run your sample with the priority code');
  await expect(text(page)).toContainText('at 8.41 nothing at all');
  await expect(text(page)).toContainText('the printer on its trolley clears its throat');
  await choose(page, 'Take the printout');
  await expect(text(page)).toContainText('It is Figure 3. It is better than Figure 3.');
  await expect(page.locator('.narrative__carry')).toContainText('a warm printout of a perfect spectrum');

  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await nb.getByRole('tab', { name: 'People' }).click();
  await expect(nb).toContainText('Her last email');
  await nb.getByRole('tab', { name: 'Anomalies' }).click();
  await expect(nb).toContainText('The printout');
});
