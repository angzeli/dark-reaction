import { expect, test, type Page } from '@playwright/test';
import { newGame, pick, play } from './bot.ts';

/**
 * The campus in-jokes in the real game (docs/HUMOUR.md §4, #204), in both languages: the lift waiting
 * on 0 with its doors open, that night and the next; your lanyard round your neck, off, and back at the
 * next 02:47; the rooms by their new names.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const text = (page: Page) => page.locator('.narrative__text');
const carry = (page: Page) => page.locator('.narrative__worn');

for (const [locale, lift, again, wearing, off, office, nmr] of [
  ['en', 'On 0 the lift is waiting with its doors open', 'nobody has told the lift', 'Around your neck: your lanyard.', 'You feel slightly less like yourself', '4.08 Research Write-Up Room', 'B12 NMR suite'],
  ['zh-Hant-TW', '電梯停在 0 樓，門開著', '好像都沒人通知電梯', '脖子上掛著：你的識別證。', '整個人好像少了一點自己', '4.08 Research Write-Up Room', 'B12 NMR 室'],
] as const) {
  test(`${locale}: the lift waits on 0 with its doors open, and is still waiting after 03:33`, async ({ page }) => {
    test.setTimeout(90_000);
    await newGame(page, locale);
    await expect(page.locator('.hud__place')).toHaveText(office);
    await play(page, [{ go: 'stairs' }, { do: 'stairs.lift' }]);
    await expect(text(page)).toContainText(lift);
    await expect(text(page)).not.toContainText(again);
    await pick(page, 'stairs.lift.press');
    await pick(page, 'meta:back');
    await play(page, [{ night: true }]);
    await expect(page.locator('.hud__loop')).toContainText('2');
    await play(page, [{ go: 'stairs' }, { do: 'stairs.lift' }]);
    await expect(text(page)).toContainText(lift);
    await expect(text(page)).toContainText(again);
    await pick(page, 'meta:back');
    await play(page, [{ go: 'nmr' }]);
    await expect(page.locator('.hud__place')).toHaveText(nmr);
  });

  test(`${locale}: your lanyard is round your neck, comes off, and is back at the next 02:47`, async ({ page }) => {
    test.setTimeout(90_000);
    await newGame(page, locale);
    await expect(carry(page)).toHaveText(wearing);
    await pick(page, 'office.around');
    await pick(page, 'office.lanyard.off');
    await expect(text(page)).toContainText(off);
    await expect(carry(page)).toHaveCount(0);
    await expect(page.locator('.choice[data-choice="office.lanyard.on"]')).toBeVisible();
    await pick(page, 'meta:back');
    await play(page, [{ night: true }]);
    await expect(page.locator('.hud__loop')).toContainText('2');
    await expect(carry(page)).toHaveText(wearing);
    await pick(page, 'office.around');
    await expect(page.locator('.choice[data-choice="office.lanyard.off"]')).toBeVisible();
  });
}
