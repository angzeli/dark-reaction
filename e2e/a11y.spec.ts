import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ROUTES } from '../src/content/routes.ts';
import { inTheDark, kraken, resume, spectra, ups, type Locale } from './act3.ts';
import { go, newGame, pick, play } from './bot.ts';

/**
 * #25: axe on every kind of screen, in both languages, with zero serious or
 * critical violations: the title and its overlays, the play screen and its
 * overlays, the Act I and II puzzles, and an ending, in normal and high
 * contrast (the Act I and II puzzles in high contrast too). Act III's four puzzles open from nights prepared in the engine
 * (e2e/act3.ts), in both languages and in high contrast.
 */

test.use({ viewport: { width: 1280, height: 900 } });

async function scan(page: Page, where: string): Promise<void> {
  const result = await new AxeBuilder({ page }).analyze();
  const bad = result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ') + ' — ' + (n.failureSummary ?? '').split('\n').slice(1, 2).join('')).slice(0, 4).join('\n    ')}`);
  expect(bad, `${where}:\n  ${bad.join('\n  ')}`).toEqual([]);
}

async function overlay(page: Page, open: () => Promise<void>, where: string) {
  await open();
  await expect(page.getByRole('dialog')).toBeVisible();
  await scan(page, where);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Open a puzzle, scan it, and step away (or solve it, when later puzzles need it). */
async function puzzle(page: Page, where: string, then: 'leave' | 'solve', solve?: string) {
  await expect(page.locator('.pz')).toBeVisible();
  await scan(page, where);
  if (then === 'leave') await page.locator('.pz__leave').click();
  else await play(page, [{ solve: solve! }]);
  await expect(page.locator('.pz')).toHaveCount(0);
}

for (const [locale, contrast] of [['en', false], ['zh-Hant-TW', false], ['en', true]] as const) {
  test(`${locale}${contrast ? ', high contrast' : ''}: the title, the play screen, their overlays, and six puzzles`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(
      ([l, c]) => {
        if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l, highContrast: c }));
      },
      [locale, contrast] as const,
    );
    await page.goto('./');
    await scan(page, 'title');
    await overlay(page, () => page.locator('.title__btn[data-focus-key="title-settings"]').click(), 'settings');
    await overlay(page, () => page.locator('.title__btn[data-focus-key="title-gallery"]').click(), 'gallery');

    await newGame(page, locale);
    await scan(page, 'play: the office at 02:47');
    await overlay(page, () => page.keyboard.press('n'), 'notebook');
    await overlay(page, () => page.keyboard.press('m'), 'menu');
    await overlay(
      page,
      async () => {
        await page.keyboard.press('m');
        await page.getByRole('dialog').getByRole('button', { name: locale === 'en' ? 'Content note' : '內容提醒' }).click();
      },
      'content note',
    );

    // Act I's three puzzles, solved in turn so each opens the next.
    await go(page, 'synth');
    await pick(page, 'synth.plate');
    await puzzle(page, 'puzzle: TLC', 'solve', 'tlc');
    await play(page, [{ do: 'synth.rotavap' }, { do: 'synth.yield.honest' }, { go: 'glovebox' }, { do: 'glovebox.antechamber' }]);
    await puzzle(page, 'puzzle: antechamber', 'solve', 'glovebox');
    await play(page, [{ go: 'nmr' }, { do: 'nmr.console' }]);
    await puzzle(page, 'puzzle: console', 'solve', 'console');

    // Dan's office opens at 03:15 on any night: her notebook. Then the porter's terminal.
    await play(page, [{ go: 'stairs' }, { until: 27 }, { go: 'pi' }, { do: 'pi.notebook' }]);
    await puzzle(page, 'puzzle: cipher', 'leave');
    await play(page, [{ go: 'stairs' }, { do: 'stairs.terminal' }]);
    await puzzle(page, 'puzzle: door log', 'leave');
  });
}

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`${locale}: an ending, and the play screen in high contrast`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((l) => {
      if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l, highContrast: true }));
    }, locale);
    await page.goto('./');
    await page.locator('.title__btn--primary').click();
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
    await play(page, []);
    await scan(page, 'play, high contrast');
    await overlay(page, () => page.keyboard.press('n'), 'notebook, high contrast');
    await play(page, ROUTES.clocking!.steps);
    await expect(page.locator('article.ending')).toBeVisible();
    await scan(page, 'ending, high contrast');
  });
}

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`${locale}: the freezer, once her notebook is read`, async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, locale);
    await play(page, [{ go: 'stairs' }, { until: 27 }, { go: 'pi' }, { do: 'pi.notebook' }, { solve: 'cipher' }, { go: 'cold' }, { do: 'cold.rack1' }]);
    await puzzle(page, 'puzzle: freezer', 'leave');
  });
}

// Act III: each puzzle from its own night, scanned as it opens and again half-way through.
const ACT_THREE: Array<{ name: string; night: (l: Locale) => string; choice: string | null; moves: (page: Page) => Promise<void> }> = [
  {
    name: 'the Kraken',
    night: (l) => kraken(l, true),
    choice: 'synth.kraken.fill',
    moves: async (page) => {
      await page.locator('.sk__n2').click();
      await page.locator('.sk__tap[data-port="2"][data-tap="vac"]').click();
    },
  },
  {
    name: 'the chirp',
    night: ups,
    choice: 'nmr.ups',
    moves: async (page) => {
      for (const key of ['4', '1', '3', '2', 'enter']) await page.locator(`.cp__key[data-key="${key}"]`).click();
    },
  },
  {
    name: 'three spectra',
    night: spectra,
    choice: 'office.compare',
    moves: async (page) => {
      await page.locator('.fb__overlay').click();
      await page.locator('.fb__spot[data-feature="noise"]').click();
    },
  },
  {
    name: 'the peak match',
    night: inTheDark,
    choice: null,
    moves: async (page) => {
      await page.locator('.pm__nudge[data-by="10"]').click();
      await page.locator('.pm__peak[data-peak="decoy"]').click();
    },
  },
];
for (const [locale, contrast] of [['en', false], ['zh-Hant-TW', false], ['en', true]] as const) {
  for (const p of ACT_THREE) {
    test(`${locale}${contrast ? ', high contrast' : ''}: Act III, ${p.name}`, async ({ page }) => {
      await resume(page, p.night(locale), locale, { contrast });
      if (p.choice) await pick(page, p.choice);
      await expect(page.locator('.pz')).toBeVisible();
      await scan(page, `${p.name}, as it opens`);
      await p.moves(page);
      await scan(page, `${p.name}, half-way`);
    });
  }
}
