import { expect, test, type Page } from '@playwright/test';
import { go, newGame, pick } from './bot.ts';

/**
 * #43: the play screen's HUD is sticky, and a puzzle can be taller than
 * the window. Moving focus backwards through one must never leave the
 * focused element underneath the HUD (WCAG 2.2, 2.4.11).
 */

async function hiddenUnderHud(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const hud = document.querySelector('.hud');
    if (!el || !hud || el === document.body) return null;
    const a = el.getBoundingClientRect();
    const b = hud.getBoundingClientRect();
    const overlaps = a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;
    return overlaps ? `${el.tagName}.${el.className} at ${Math.round(a.top)}–${Math.round(a.bottom)}, HUD to ${Math.round(b.bottom)}` : null;
  });
}

// Short windows (a laptop with its browser chrome, a phone held sideways), where the console is far taller than the view.
for (const viewport of [
  { width: 1280, height: 600 },
  { width: 390, height: 640 },
]) {
  test(`at ${viewport.width}×${viewport.height}, Shift+Tab up through the console keeps every focused control clear of the HUD`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await newGame(page, 'en');
    await go(page, 'nmr');
    await pick(page, 'nmr.console');
    const leave = page.locator('.pz__leave');
    await leave.focus();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await hiddenUnderHud(page), `after ${i + 1} × Shift+Tab`).toBeNull();
    }
  });
}

test('the HUD clock is labelled by text, not a prohibited aria-label', async ({ page }) => {
  await newGame(page, 'en');
  const clock = page.locator('.hud__clock');
  await expect(clock).toHaveText('02:47');
  expect(await clock.getAttribute('aria-label')).toBeNull();
  await expect(page.locator('.hud__time')).toContainText('Time 02:47');
});
