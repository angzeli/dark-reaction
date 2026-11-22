import { expect, test, type Page } from '@playwright/test';

/**
 * Act II's puzzles through the real game: the porter's terminal (by
 * keyboard, and by touch alone on a phone), her notebook's last page with a
 * language switch half-way through, and rack 1 of the freezer, solved by
 * keyboard and failed by setting off the alarm.
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
const choice = (page: Page, name: string | RegExp) => page.locator('.choice').filter({ hasText: name }).first();
const choose = (page: Page, name: string | RegExp) => choice(page, name).click();
const go = async (page: Page, place: string | RegExp) => {
  await choose(page, 'Go somewhere else…');
  await choose(page, place);
};
const clock = (page: Page) => page.locator('.hud__clock');
const minuteOf = (label: string | null) => {
  const [h, m] = (label ?? '').split(':').map(Number);
  return h! * 60 + m! - (2 * 60 + 47);
};

/** Wait in the current room until the clock reads `label`; the night's own events cut waits short. */
async function waitUntil(page: Page, label: string) {
  for (let i = 0; i < 30; i++) {
    const gap = minuteOf(label) - minuteOf(await clock(page).textContent());
    if (gap <= 0) return;
    await choose(page, 'Wait…');
    await choose(page, gap >= 10 ? 'Wait 10 minutes' : gap >= 5 ? 'Wait 5 minutes' : 'Wait 1 minute');
  }
  throw new Error(`the clock never reached ${label}`);
}

/** Into Dan's office while the porter cleans it (03:15–03:18): from the stairwell, a minute's walk. */
async function intoOffice(page: Page) {
  await go(page, 'Stairwell');
  await waitUntil(page, '03:14');
  await go(page, '4.01');
  await expect(clock(page)).toHaveText('03:15');
  await expect(page.locator('.hud__place')).toHaveText("4.01 Prof. Ridley's office");
}

async function switchTo(page: Page, language: 'English' | '繁體中文') {
  await page.getByRole('button', { name: language === 'English' ? '選單' : 'Menu' }).click();
  await page.getByRole('button', { name: language }).click();
  await page.keyboard.press('Escape');
}

/** Read her last page by tapping the elements in, as quickly as anyone could. */
async function solveCipher(page: Page) {
  await intoOffice(page);
  await choose(page, 'Read the last page of her notebook');
  const d = page.getByRole('dialog', { name: 'The last page' });
  for (const z of [88, 74, 49, 88, 6, 19, 8, 10]) await d.locator(`.ci__el[data-z="${z}"]`).click();
  await d.getByRole('button', { name: 'Copy it into your notebook' }).click();
  await expect(page.locator('.narrative__text')).toContainText('Her raw data. In rack one.');
}

async function openRack(page: Page) {
  await go(page, 'B.05 Cold room');
  await choose(page, 'Find rack 1 in the freezer');
  const d = page.getByRole('dialog', { name: 'Rack 1' });
  await expect(d).toBeVisible();
  return d;
}

test('the porter’s terminal by keyboard: the Monday shift, her badge back to 2019, one wrong window, then the right ones', async ({ page }) => {
  await begin(page);
  await go(page, 'Stairwell');
  await expect(choice(page, 'Use the porter’s terminal')).toBeVisible();
  await choose(page, 'Use the porter’s terminal');
  const d = page.getByRole('dialog', { name: 'The porter’s terminal' });
  await expect(d).toBeVisible();
  const nights = d.getByRole('radiogroup', { name: 'Night' });
  const doors = d.getByRole('radiogroup', { name: 'Door' });
  const rows = d.locator('.dl__entry');

  // Each filter is one Tab stop, and the arrow keys choose.
  await nights.getByRole('radio', { name: 'All nights' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(nights.getByRole('radio', { name: 'Mon 16' })).toHaveAttribute('aria-checked', 'true');
  await expect(nights.getByRole('radio', { name: 'Mon 16' })).toBeFocused();
  await doors.getByRole('radio', { name: 'All doors' }).focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await expect(doors.getByRole('radio', { name: '4.01 Ridley' })).toHaveAttribute('aria-checked', 'true');
  // Monday 16th: Dan's office 03:15–03:18. Tuesday 17th: three minutes earlier.
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('03:15');
  await expect(rows.nth(0)).toContainText('HELD OPEN');
  await expect(rows.nth(1)).toContainText('03:18');
  await nights.getByRole('radio', { name: 'Mon 16' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(rows.nth(0)).toContainText('03:12');
  // Fire exit B, every night: released on the Monday only.
  await page.keyboard.press('Home');
  await expect(nights.getByRole('radio', { name: 'All nights' })).toHaveAttribute('aria-checked', 'true');
  await doors.getByRole('radio', { name: '4.01 Ridley' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(rows).toHaveCount(2);
  await expect(d.locator('tbody[data-night="0"] .dl__entry')).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('03:21');
  await expect(rows.nth(0)).toContainText('RELEASED');

  // Older entries: her card, refused and let in every night since 14/03/2019, and never out.
  await page.keyboard.press('Home');
  const older = d.getByRole('button', { name: 'Older entries' });
  await older.focus();
  await page.keyboard.press('Enter');
  await expect(older).toHaveAttribute('aria-pressed', 'true');
  const log = d.getByRole('region', { name: 'Access log' });
  await expect(log).toContainText('Nothing older.');
  await expect(log.locator('.dl__archive .dl__entry').first()).toContainText('03:33');
  await expect(log.locator('.dl__archive .dl__group').nth(1)).toHaveText('14/03/2019');
  await expect(log.locator('.dl__archive .dl__entry[data-badge="lin"]').first()).toContainText('LIN Y C (EXPIRED 30/09/2019)');
  await expect(log.locator('.dl__archive .dl__note--gap')).toContainText('every night, for 2,801 more nights');
  await expect(d.locator('.dl__note--noexit')).toHaveText('LIN Y C: no exit recorded since 14/03/2019 03:33.');

  // Tonight's windows, by keyboard. The usual night's 03:12 for Dan's office is wrong, and costs a minute.
  const pi = d.getByRole('slider', { name: '4.01, Prof. Ridley’s office' });
  await pi.focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < 5; i++) await page.keyboard.press('PageUp');
  await expect(pi).toHaveAttribute('aria-valuetext', '03:12 to 03:15');
  const exit = d.getByRole('slider', { name: 'Fire exit B' });
  await exit.focus();
  await page.keyboard.press('End');
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowLeft');
  await expect(exit).toHaveAttribute('aria-valuetext', '03:21 to 03:24');
  // 1 walk + 1 choice + 2 minutes reading the log.
  await expect(d.locator('.pz__clock-time')).toHaveText('02:51');
  await d.getByRole('button', { name: 'Write it down' }).focus();
  await page.keyboard.press('Enter');
  await expect(d.locator('.dl__status')).toContainText('The 4.01 window doesn’t sit right.');
  await expect(d.locator('.dl__status')).toContainText('03:12 is when he does Dan’s office on most nights.');
  await expect(d.locator('.pz__clock-time')).toHaveText('02:52');
  await pi.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await expect(pi).toHaveAttribute('aria-valuetext', '03:15 to 03:18');
  await d.getByRole('button', { name: 'Write it down' }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('Fire exit B 03:21–03:24.');
  await expect(clock(page)).toHaveText('02:52');
  await expect(choice(page, 'Use the porter’s terminal')).toHaveCount(0);
  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await expect(nb).toContainText('The porter’s Monday');
  await nb.getByRole('tab', { name: 'Anomalies' }).click();
  await expect(nb).toContainText('Whoever is inside at 03:33, the building keeps.');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });

  test('the porter’s terminal by touch alone: tap the line, nudge, write it down', async ({ page }) => {
    await begin(page);
    const tap = (name: string | RegExp) => choice(page, name).tap();
    await tap('Go somewhere else…');
    await tap('Stairwell');
    await tap('Use the porter’s terminal');
    const d = page.getByRole('dialog', { name: 'The porter’s terminal' });
    await d.getByRole('radio', { name: 'Mon 16' }).tap();
    await d.getByRole('radio', { name: 'Fire exit B' }).tap();
    await expect(d.locator('.dl__entry').first()).toContainText('03:21');

    // Tap where a minute is on tonight's line; the window starts there.
    const tapAt = async (row: string, minute: number) => {
      const track = d.getByRole('slider', { name: row });
      const box = (await track.boundingBox())!;
      await track.tap({ position: { x: ((minute + 0.5) / 46) * box.width, y: box.height / 2 } });
    };
    await tapAt('4.01, Prof. Ridley’s office', 23);
    await expect(d.locator('.dl__mark[data-row="pi"] .dl__value')).toHaveText('03:10–03:13');
    await d.getByRole('button', { name: 'Later by 5 minutes' }).first().tap();
    await expect(d.locator('.dl__mark[data-row="pi"] .dl__value')).toHaveText('03:15–03:18');
    await tapAt('Fire exit B', 35);
    await d.getByRole('button', { name: 'Earlier by 1 minute' }).nth(1).tap();
    await expect(d.locator('.dl__mark[data-row="exit"] .dl__value')).toHaveText('03:21–03:24');
    await d.getByRole('button', { name: 'Write it down' }).tap();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.narrative__text')).toContainText('LIN Y C. 03:33. Every night. No exit.');
  });
});

test('her notebook: a language switch half-way keeps both pages, and either one reads it', async ({ page }) => {
  await begin(page);
  await intoOffice(page);
  await choose(page, 'Read the last page of her notebook');
  const d = page.getByRole('dialog', { name: 'The last page' });
  const table = d.getByRole('group', { name: 'The periodic table inside the back cover' });
  const status = d.locator('.ci__status');

  // The table is one Tab stop; the arrow keys walk its real layout. H, down six, is francium.
  await table.getByRole('button', { name: '1, H' }).focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown');
  await expect(table.getByRole('button', { name: '87, Fr' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('You pencil Fr in under the 88, then rub it out. It doesn’t fit.');
  await page.keyboard.press('ArrowRight');
  await expect(table.getByRole('button', { name: '88, Ra' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(d.getByRole('radio', { name: 'Gap 1 of 8, under 88: Ra' })).toBeVisible();
  // The next gap comes up by itself: 74, tungsten, three along from barium (the lanthanides' gap is skipped).
  await expect(d.getByRole('radio', { name: 'Gap 2 of 8, under 74' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(table.getByRole('button', { name: '56, Ba' })).toBeFocused();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await expect(table.getByRole('button', { name: '74, W' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(d.getByRole('radio', { name: 'Gap 2 of 8, under 74: W' })).toBeVisible();

  // 繁中: her line is a different original, with nothing done yet.
  await switchTo(page, '繁體中文');
  const zh = page.getByRole('dialog', { name: '最後一頁' });
  await expect(zh.locator('.ci__sticky')).toHaveText('偏旁拿掉就好。');
  await expect(zh.getByRole('radio', { name: '鉈' })).toHaveAttribute('aria-checked', 'true');
  await zh.getByRole('button', { name: '拿掉金字旁' }).click();
  await expect(zh.getByRole('radio', { name: '鉈，拿掉金字旁：它' })).toBeVisible();
  await expect(zh.locator('.ci__status')).toHaveText('鉈拿掉金字旁，剩下「它」。');

  // Back to English: both gaps still filled.
  await switchTo(page, 'English');
  const en = page.getByRole('dialog', { name: 'The last page' });
  await expect(en.getByRole('radio', { name: 'Gap 1 of 8, under 88: Ra' })).toBeVisible();
  await expect(en.getByRole('radio', { name: 'Gap 2 of 8, under 74: W' })).toBeVisible();
  await expect(en.getByRole('radio', { name: 'Gap 3 of 8, under 49' })).toHaveAttribute('aria-checked', 'true');

  // And 繁中 again: 它 is still there. Finish it in Chinese.
  await switchTo(page, '繁體中文');
  const again = page.getByRole('dialog', { name: '最後一頁' });
  await expect(again.getByRole('radio', { name: '鉈，拿掉金字旁：它' })).toBeVisible();
  await expect(again.getByRole('radio', { name: '氡' })).toHaveAttribute('aria-checked', 'true');
  await again.getByRole('button', { name: '拿掉气字頭' }).click();
  await again.getByRole('button', { name: '拿掉金字旁' }).click();
  await again.getByRole('button', { name: '拿掉金字旁' }).click();
  await expect(again.locator('.ci__decoded')).toHaveText('它 · 冬內 · 甲');
  await expect(again.getByRole('button', { name: '抄進筆記本' })).toBeFocused();
  // 1 walk + 1 choice + 2 minutes reading; a single wrong pick costs nothing yet.
  await expect(again.locator('.pz__clock-time')).toHaveText('03:18');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('它在冬內，甲。');
  await expect(clock(page)).toHaveText('03:18');
  await page.getByRole('button', { name: '筆記本' }).click();
  await expect(page.getByRole('dialog', { name: '筆記本' })).toContainText('她的最後一頁');
});

test('rack 1 by keyboard: her lid, the box, and the card at E5', async ({ page }) => {
  await begin(page);
  await solveCipher(page);
  const d = await openRack(page);
  await expect(d.locator('.fz__notes li')).toHaveCount(4);
  await expect(d.locator('.fz__notes')).toContainText('not even corner to corner');
  const box = d.getByRole('radiogroup', { name: 'Her box: rows A to I, columns 1 to 9' });

  // One Tab stop into the box; the arrows move through it. Choosing is free.
  await box.getByRole('radio', { name: 'A1, empty slot' }).focus();
  for (const key of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight']) await page.keyboard.press(key);
  const c3 = box.getByRole('radio', { name: 'C3, red cap' });
  await expect(c3).toBeFocused();
  await expect(c3).toHaveAttribute('aria-checked', 'true');
  await expect(d.locator('.fz__temp-value')).toHaveText('−80 °C');
  // The box is the dialog's first Tab stop, so Shift+Tab wraps round inside the dialog, and Tab comes back.
  await page.keyboard.press('Shift+Tab');
  await expect(d.getByRole('button', { name: 'Step away' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(c3).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(d.getByRole('button', { name: 'Lift C3 (1 min)' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(d.locator('.fz__status')).toContainText('C3: a red cap, and under it a reference');
  await expect(d.locator('.fz__temp-value')).toHaveText('−79 °C');
  // The lift button has nothing more to do with C3, so focus goes back to it in the box.
  await expect(box.getByRole('radio', { name: 'C3, red cap, already lifted' })).toBeFocused();

  for (const key of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight']) await page.keyboard.press(key);
  await expect(box.getByRole('radio', { name: 'E5, red cap' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(d.locator('.fz__status')).toContainText('a microSD card the size of a fingernail');
  const done = d.getByRole('button', { name: 'Pocket the card and close the lid' });
  await expect(done).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('It weighs more than it should.');
  await expect(page.locator('.narrative__carry')).toContainText('a microSD card in a cryovial');
  await expect(choice(page, 'Find rack 1 in the freezer')).toHaveCount(0);
  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await nb.getByRole('tab', { name: 'Data' }).click();
  await expect(nb).toContainText('Rack 1, E5');
});

test('six wrong tubes set off the alarm; the lid stays shut until the next 02:47', async ({ page }) => {
  await begin(page);
  await solveCipher(page);
  const d = await openRack(page);
  const lift = async (cell: string) => {
    await d.locator(`.fz__cell[data-cell="${cell}"]`).click();
    await d.getByRole('button', { name: `Lift ${cell} (1 min)` }).click();
  };
  for (const cell of ['C3', 'D6', 'B8', 'F4']) await lift(cell);
  await expect(d.locator('.fz__status')).toContainText('The display has crept up to −76 °C.');
  await lift('G3');
  await expect(d.locator('.fz__status')).toContainText('A single beep');
  await lift('H2');
  await expect(d.locator('.fz__status')).toContainText('The alarm goes off');
  await expect(d.locator('.fz__temp-value')).toHaveText('−74 °C');
  await expect(d.locator('.fz__temp')).toHaveAttribute('data-level', 'alarm');
  const close = d.getByRole('button', { name: 'Close the lid' });
  await expect(close).toBeFocused();
  await close.click();

  await expect(page.locator('.narrative__text')).toContainText('Not again tonight');
  await expect(choice(page, 'Find rack 1 in the freezer')).toHaveCount(0);
  await expect(page.locator('.narrative__carry')).toHaveCount(0);

  // The night runs out; at 02:47 the freezer has forgotten, and you haven't.
  for (let i = 0; i < 15; i++) {
    if ((await page.locator('.hud__loop').textContent()) === 'Loop 2') break;
    if ((await choice(page, 'Wait…').count()) === 0) {
      await page.waitForTimeout(250); // the lights-out card is playing
      continue;
    }
    await choose(page, 'Wait…');
    await choose(page, 'Wait 10 minutes');
  }
  await expect(page.locator('.dr-lightsout')).toHaveCount(0, { timeout: 10_000 });
  await expect(clock(page)).toHaveText('02:47');
  await go(page, 'B.05 Cold room');
  await expect(choice(page, 'Find rack 1 in the freezer')).toBeVisible();
});
