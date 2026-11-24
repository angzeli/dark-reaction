import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/**
 * #152: at 1440 × 900 the picture gives way, so the first five choices are on screen after a typical
 * passage, without a scroll. It never gives way past the art's essentials band (y 240–660 of its 900),
 * and on a phone it keeps the safe band (y 150–760). The loop's first page in the office is long on
 * purpose (the night's opening, the pages you don't remember writing), so it isn't a typical passage.
 */
const ROOMS = targets().filter((t) => /^act\d-/.test(t.name) && !t.name.endsWith('-0247'));
const BASE = 'http://localhost:4173/dark-reaction/';

/** How many units of the 900-unit art the stage shows, from its size (the art is cropped, centred, never squeezed). */
const band = (box: { width: number; height: number }) => (1600 * box.height) / box.width;

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`at 1440 × 900 every room shows its first five choices without a scroll (${locale})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const room of ROOMS) {
      await loadTarget(page, BASE, room, { locale, reduceMotion: true, highContrast: false });
      const choices = page.locator('.choices .choice');
      const n = Math.min(5, await choices.count());
      const last = await choices.nth(n - 1).boundingBox();
      expect(last!.y + last!.height, `${room.name}: choice ${n}`).toBeLessThanOrEqual(900);
      const stage = await page.locator('.play__art .dr-stage').boundingBox();
      expect(band(stage!), `${room.name}: the art's essentials band`).toBeGreaterThanOrEqual(419);
    }
    await context.close();
  });
}

test('on a phone the picture keeps the art’s safe band, and on a big screen it doesn’t give way at all', async ({ browser }) => {
  const room = ROOMS.find((t) => t.name === 'act1-synth')!;
  for (const [viewport, touch, min] of [
    [{ width: 390, height: 844 }, true, 609],
    [{ width: 1920, height: 1080 }, false, 413],
  ] as const) {
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await loadTarget(page, BASE, room, { locale: 'en', reduceMotion: true, highContrast: false });
    const stage = await page.locator('.play__art .dr-stage').boundingBox();
    expect(band(stage!), `${viewport.width}`).toBeGreaterThanOrEqual(min);
    if (viewport.width === 1920) expect(stage!.height).toBeCloseTo(0.46 * 1080, 0);
    await context.close();
  }
});

/** #123: at the locked door, the picture is the door, not the room behind it. */
test('4.01’s locked door shows the door, with Dan’s sign; inside, the room', async ({ page }) => {
  const door = targets().find((t) => t.name === 'act1-pi-door')!;
  await loadTarget(page, BASE, door, { locale: 'en', reduceMotion: true, highContrast: false });
  await expect(page.locator('.dr-stage [data-detail="door-sign"]')).toHaveCount(1);
  await expect(page.locator('.dr-stage .framed-paper')).toHaveCount(0);
  const inside = targets().find((t) => t.name === 'act2-pi')!;
  await loadTarget(page, BASE, inside, { locale: 'en', reduceMotion: true, highContrast: false });
  await expect(page.locator('.dr-stage [data-detail="door-sign"]')).toHaveCount(0);
  await expect(page.locator('.dr-stage .framed-paper')).toHaveCount(1);
});
