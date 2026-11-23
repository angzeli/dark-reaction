import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { loadTarget, type View } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

/**
 * Visual regression (Layer 3 of the playtest QA, docs/qa/README.md): the
 * screenshots approved in the v1.0.1 sweep, compared pixel by pixel. Every
 * room in Act I and Act III, all ten puzzles, all six endings, the title and
 * the notebook; English and 繁中 at 1440×900, and the phone size for the
 * screens most read on one. Reduced motion, so nothing moves.
 *
 * Baselines are Linux renders (CI's platform; fonts render differently
 * elsewhere), in e2e/visual.spec.ts-snapshots/. A missing baseline fails,
 * and its candidate is written to e2e/screenshots/visual/, which CI keeps.
 */
test.skip(process.platform !== 'linux', 'visual baselines are Linux renders; run in CI or a Linux container');

const here = dirname(fileURLToPath(import.meta.url));
const WIDE = new Set([
  'title',
  'act1-office-0247',
  'act1-synth',
  'act1-glovebox',
  'act1-pi-door',
  'act1-stairs',
  'act1-nmr',
  'act1-cold',
  'act1-roof',
  'act2-pi',
  'act3-office',
  'act3-synth',
  'act3-glovebox',
  'act3-nmr',
  'act3-cold',
  'act3-roof',
  'overlay-notebook',
]);
const PHONE = new Set(['act1-office-0247', 'puzzle-console', 'puzzle-doorlog', 'puzzle-freezer', 'ending-dark']);

const all = targets().filter((t) => WIDE.has(t.name) || PHONE.has(t.name) || t.name.startsWith('puzzle-') || t.name.startsWith('ending-'));

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  for (const target of all) {
    const sizes = [...(WIDE.has(target.name) || target.name.startsWith('puzzle-') || target.name.startsWith('ending-') ? ['1440'] : []), ...(PHONE.has(target.name) ? ['390'] : [])];
    for (const size of sizes) {
      test(`${target.name} · ${locale} · ${size}`, async ({ browser }) => {
        const phone = size === '390';
        const context = await browser.newContext({
          viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
          hasTouch: phone,
          isMobile: phone,
          reducedMotion: 'reduce',
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const view: View = { locale, reduceMotion: true, highContrast: false };
        await loadTarget(page, 'http://localhost:4173/dark-reaction/', target, view);
        const name = `${target.name}-${locale}-${size}.png`;
        const baseline = join(here, 'visual.spec.ts-snapshots', name.replace(/\.png$/, '-chromium-linux.png'));
        if (!existsSync(baseline)) {
          const dir = join(here, 'screenshots', 'visual');
          mkdirSync(dir, { recursive: true });
          await page.screenshot({ path: join(dir, name), animations: 'disabled' });
        }
        await expect(page).toHaveScreenshot(name, { animations: 'disabled', maxDiffPixelRatio: 0.002 });
        await context.close();
      });
    }
  }
}
