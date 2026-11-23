import { expect, test, type Page } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/** #127: what a choice shows in the minute before 03:33 can be read before the dark. */
test('reading the microSD at 03:30 shows her data, and the lights wait for you', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 43, inventory: ['item.microsd'] };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  const loop = await page.locator('.hud__loop').textContent();
  await page.locator('.choice[data-choice="office.microsd"]').click();
  // Her data is on screen, and it's still there a few seconds later: the dark doesn't start on its own.
  await page.waitForTimeout(2500);
  await expect(page.locator('.narrative__text')).toContainText('NOT_MINE');
  await expect(page.locator('.dr-lightsout')).toHaveCount(0);
  await expect(page.locator('.hud__loop')).toHaveText(loop!);
  await expect(page.locator('.last-minute')).toBeFocused();
  // Then the player's own way on.
  await page.locator('.last-minute').click();
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
  await expect(page.locator('.hud__loop')).not.toHaveText(loop!);
});

test('a minute that only passed (a wait) goes straight into the dark, as before', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 45 };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="meta:wait"]').click();
  await page.locator('.choice[data-choice="wait:1"]').click();
  await expect(page.locator('.last-minute')).toHaveCount(0);
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
});

/** At the microSD's held page, 03:30 in the office (#127). */
async function heldPage(page: Page) {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 43, inventory: ['item.microsd'] };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="office.microsd"]').click();
  await expect(page.locator('.last-minute')).toBeVisible();
}

test('the notebook and the menu wait while the page is held, and nothing is left stuck (#127)', async ({ page }) => {
  await heldPage(page);
  // They say they're waiting (#NEW7), and then they wait.
  await expect(page.locator('[data-focus-key="hud-notebook"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-focus-key="hud-menu"]')).toHaveAttribute('aria-disabled', 'true');
  // A player can still click them: force past Playwright's own wait for "enabled".
  await page.locator('[data-focus-key="hud-notebook"]').click({ force: true });
  await page.locator('[data-focus-key="hud-menu"]').click({ force: true });
  await expect(page.locator('.overlay')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('NOT_MINE');
  await page.locator('.last-minute').click();
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
  await expect(page.locator('.dr-lightsout')).toHaveCount(0, { timeout: 10_000 });
  // The game is free again: the notebook opens.
  await page.keyboard.press('n');
  await expect(page.locator('.overlay--notebook')).toBeVisible();
});

test('a reload while the page is held comes back to it (#127)', async ({ page }) => {
  await heldPage(page);
  // A fresh tab on the same storage: page.reload() would re-seed the target's own save.
  const again = await page.context().newPage();
  await again.goto('http://localhost:4173/dark-reaction/');
  await again.getByRole('button', { name: 'Continue' }).click();
  await expect(again.locator('.last-minute')).toBeVisible();
  await expect(again.locator('.narrative__text')).toContainText('NOT_MINE');
  // Its own loop in the header, not the next one's (#163).
  await expect(again.locator('.hud__loop')).toHaveText(`Loop ${targets().find((t) => t.name === 'act2-office')!.state!.loop}`);
  await again.locator('.last-minute').click();
  await expect(again.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
});

test('a double click on the button doesn’t skip the dark (#141)', async ({ page }) => {
  await heldPage(page);
  await page.locator('.last-minute').dblclick();
  await page.waitForTimeout(300);
  await expect(page.locator('.dr-lightsout')).toHaveCount(1);
});

test('nor does a Space already on its way when a wait runs into 03:33 (#141)', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 45 };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="meta:wait"]').click();
  await page.locator('.choice[data-choice="wait:1"]').click();
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  await expect(page.locator('.dr-lightsout')).toHaveCount(1);
  // A press once it has begun still skips it.
  await page.waitForTimeout(700);
  await page.keyboard.press('Space');
  await expect(page.locator('.dr-lightsout')).toHaveCount(0, { timeout: 2_000 });
});

test('a walk into 03:33 goes straight into the dark, too', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 44 };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="meta:travel"]').click();
  await page.locator('.choice[data-choice="go:nmr"]').click();
  await expect(page.locator('.last-minute')).toHaveCount(0);
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
});

/** #163: the input that made the choice can't press the button that appears where it was. */
async function atTheMicrosd(page: Page) {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 43, inventory: ['item.microsd'] };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
}

test('a double click on the choice doesn’t also press “Then the lights go out” (#163)', async ({ page }) => {
  await atTheMicrosd(page);
  await page.locator('.choice[data-choice="office.microsd"]').dblclick();
  await page.waitForTimeout(500);
  await expect(page.locator('.last-minute')).toBeVisible();
  await expect(page.locator('.dr-lightsout')).toHaveCount(0);
});

test('nor does a held Enter (#163)', async ({ page }) => {
  await atTheMicrosd(page);
  await page.keyboard.press('Tab');
  await page.locator('.choice[data-choice="office.microsd"]').focus();
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter'); // the key's repeat
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await page.waitForTimeout(300);
  await expect(page.locator('.last-minute')).toBeVisible();
  // A fresh press still goes on.
  await page.keyboard.press('Enter');
  await expect(page.locator('.hud__clock')).toHaveText('02:47', { timeout: 10_000 });
});

test('the Infinite Loop’s last night: a reload on its held page comes back to it, and the ending follows the dark (#163)', async ({ page }) => {
  const office = targets().find((t) => t.name === 'act2-office')!;
  const state = { ...structuredClone(office.state!), minute: 43, inventory: ['item.microsd'], obsession: 10, loop: 6 };
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', { ...office, state }, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="office.microsd"]').click();
  await expect(page.locator('.last-minute')).toBeVisible();
  const again = await page.context().newPage();
  await again.goto('http://localhost:4173/dark-reaction/');
  await again.getByRole('button', { name: 'Continue' }).click();
  await expect(again.locator('.last-minute')).toBeVisible();
  await expect(again.locator('.narrative__text')).toContainText('NOT_MINE');
  await again.locator('.last-minute').click();
  await expect(again.locator('article.ending[data-ending="infinite"]')).toBeVisible({ timeout: 15_000 });
});
