import { expect, test, type Page } from '@playwright/test';

/**
 * The application shell against the real built game: title, a new game,
 * choosing by keyboard and by tap, walking, waiting, the notebook, saving
 * and loading, the 03:33 reset, and switching language mid-game.
 */

test.use({ viewport: { width: 1280, height: 800 } });

async function start(page: Page, opts: { reducedMotion?: boolean; locale?: string } = {}) {
  const errors: string[] = [];
  const outside: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.host !== 'localhost:4173') outside.push(r.url());
  });
  await page.emulateMedia({ reducedMotion: opts.reducedMotion === false ? 'no-preference' : 'reduce' });
  // The content note has been read; e2e/settings.spec.ts covers it.
  await page.addInitScript((locale) => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) {
      localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, ...(locale ? { locale } : {}) }));
    }
  }, opts.locale ?? null);
  await page.goto('./');
  return { errors, outside };
}

async function newGame(page: Page) {
  await page.getByRole('button', { name: /^(New game|新遊戲)$/ }).click();
  // The Act I title card, then 02:47 in the office.
  await expect(page.locator('.act-card')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.act-card')).toHaveCount(0);
  await expect(page.locator('.hud__clock')).toHaveText('02:47');
}

const clock = (page: Page) => page.locator('.hud__clock');
const choose = (page: Page, name: string | RegExp) => page.locator('.choice').filter({ hasText: name }).first().click();

test('title screen, then a new game at 02:47 in the office', async ({ page }) => {
  const { errors, outside } = await start(page);
  await expect(page.locator('.title__name')).toContainText('Dark Reaction');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
  await newGame(page);
  await expect(page.locator('.hud__place')).toHaveText('4.08 Write-up office');
  await expect(page.locator('.narrative__text')).toContainText('cheek on the keyboard');
  await expect(page.locator('.narrative__text')).toContainText('write-up office holds eleven desks');
  await expect(page.locator('.play__art svg[data-art="office"]')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
});

test('choices work by number keys and by tap; walking and waiting cost minutes; events cut waits short', async ({ page }) => {
  await start(page);
  await newGame(page);
  // Keyboard: the hub's last two choices are "Go somewhere else…" and "Wait…".
  const labels = await page.locator('.choice__label').allTextContents();
  const waitIndex = labels.indexOf('Wait…') + 1;
  await page.keyboard.press(String(waitIndex));
  await page.keyboard.press('2'); // Wait 5 minutes…
  // …but Dan's email lands at 02:50 and the wait stops there.
  await expect(clock(page)).toHaveText('02:50');
  await expect(page.locator('.para--system')).toContainText('3 minutes');
  await expect(page.locator('.narrative__text')).toContainText('Your monitor chimes');
  // Tap: walk to the NMR suite (3 minutes).
  await choose(page, 'Go somewhere else…');
  await choose(page, 'B.03 NMR suite');
  await expect(clock(page)).toHaveText('02:53');
  await expect(page.locator('.hud__place')).toHaveText('B.03 NMR suite');
  await expect(page.locator('.narrative__text')).toContainText('cryocooler chirps');
});

test('the notebook opens with N and closes with Escape, returning focus', async ({ page }) => {
  await start(page);
  await newGame(page);
  await page.keyboard.press('n');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Tonight' })).toHaveAttribute('aria-selected', 'true');
  await dialog.getByRole('tab', { name: 'Loops' }).click();
  await expect(dialog).toContainText('The first night is still going.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('03:33: the lights go out and it is 02:47 again, loop 2', async ({ page }) => {
  await start(page);
  await newGame(page);
  // Wait out the night; the building's own events cut some waits short.
  for (let i = 0; i < 15; i++) {
    if ((await page.locator('.hud__loop').textContent()) === 'Loop 2') break;
    const wait = page.locator('.choice').filter({ hasText: 'Wait…' });
    if ((await wait.count()) === 0) {
      await page.waitForTimeout(250); // the lights-out card is playing
      continue;
    }
    await wait.first().click();
    await choose(page, 'Wait 10 minutes');
  }
  await expect(page.locator('.dr-lightsout')).toHaveCount(0, { timeout: 10_000 });
  await expect(clock(page)).toHaveText('02:47');
  await expect(page.locator('.hud__loop')).toHaveText('Loop 2');
  await expect(page.locator('.narrative__text')).toContainText('The kettle is cold');
  await expect(page.locator('.narrative__text')).toContainText('Make tea first');
});

test('save to a slot, quit, and load it back from the title', async ({ page }) => {
  await start(page);
  await newGame(page);
  await choose(page, 'Look out of the window');
  await expect(clock(page)).toHaveText('02:48');
  await page.keyboard.press('m');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.slot[data-slot="1"] .slot__btn').click();
  await expect(page.locator('.app__status')).toHaveText('Saved to Slot 1.');
  await expect(page.locator('.slot[data-slot="1"] .slot__label')).toContainText('loop 1 · 02:48 · 4.08 Write-up office');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Quit to title' }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(clock(page)).toHaveText('02:48');
});

test('switching language mid-game keeps the night exactly where it was', async ({ page }) => {
  await start(page);
  await newGame(page);
  await choose(page, 'Go somewhere else…');
  await choose(page, '4.14 Glovebox room');
  await expect(page.locator('.narrative__text')).toContainText('2.0 ppm');
  await page.keyboard.press('m');
  await page.getByRole('button', { name: '繁體中文' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW');
  await expect(page.locator('.hud__place')).toHaveText('4.14 手套箱室');
  await expect(clock(page)).toHaveText('02:48');
  await expect(page.locator('.narrative__text')).toContainText('2.0 ppm');
  await expect(page.locator('.narrative__text')).toContainText('手套箱');
});

test('a Chinese-speaking browser starts in 繁中', async ({ page }) => {
  await start(page, { locale: 'zh-Hant-TW' });
  await expect(page.getByRole('button', { name: '新遊戲' })).toBeVisible();
  await newGame(page);
  await expect(page.locator('.hud__place')).toHaveText('4.08 研究生辦公室');
});

test('with full motion the text reveals and any key completes it', async ({ page }) => {
  await start(page, { reducedMotion: false });
  await newGame(page);
  await expect(page.locator('.choices button')).not.toHaveCount(0, { timeout: 15_000 });
  await choose(page, 'Wait…');
  await choose(page, 'Wait 1 minute');
  await page.keyboard.press('Space');
  await expect(page.locator('.narrative__text.rv-done, .narrative__text .rv-done').first()).toBeAttached();
  await expect(clock(page)).toHaveText('02:48');
});

test('overlays keep focus inside while open and give it back on close, from the title and from play (#25)', async ({ page }) => {
  await start(page);
  const inDialog = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  const trapped = async (where: string) => {
    await expect(page.getByRole('dialog')).toBeVisible();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await inDialog(), `${where}: Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await inDialog(), `${where}: Shift+Tab ${i + 1}`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  // From the title, by keyboard: the settings panel, then the gallery.
  for (const [key, name] of [['title-settings', 'Settings'], ['title-gallery', 'Endings']] as const) {
    const opener = page.locator(`.title__btn[data-focus-key="${key}"]`);
    await opener.focus();
    await page.keyboard.press('Enter');
    await trapped(name);
    await expect(opener).toBeFocused();
  }
  // In play: the notebook and the menu, opened from their HUD buttons by keyboard.
  await newGame(page);
  for (const name of ['Notebook', 'Menu']) {
    const opener = page.locator('.hud__btn').filter({ hasText: name });
    await opener.focus();
    await page.keyboard.press('Enter');
    await trapped(name);
    await expect(opener).toBeFocused();
  }
});

test('Space and Enter never make a choice once the text has finished (#102)', async ({ page }) => {
  await start(page, { reducedMotion: false });
  await newGame(page); // dismisses the act card by keyboard, so the game knows a keyboard is in use
  await expect(page.locator('.choices button')).not.toHaveCount(0, { timeout: 15_000 });
  const place = await page.locator('.hud__place').textContent();
  // An impatient player hammering the skip keys after the text is already in: nothing is chosen.
  for (const key of ['Space', 'Enter', 'Space', 'Enter']) await page.keyboard.press(key);
  await expect(page.locator('.choice[data-choice="office.monitor"]')).toBeVisible(); // still the office's own choices
  await expect(clock(page)).toHaveText('02:47');
  await expect(page.locator('.hud__place')).toHaveText(place!);
  // Focus waits on the list of choices, not on choice 1.
  await expect(page.locator('ol.choices')).toBeFocused();
  // The keys that choose still choose: the arrow moves into the list, Enter takes what it's on.
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.choice').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.choice').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.choice').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice[data-choice="office.queue"]')).toBeVisible(); // the monitor
});
