import { expect, type Page } from '@playwright/test';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { LocationId } from '../src/engine/types.ts';
import { SaveStore } from '../src/save/saves.ts';
import { memoryStorage } from '../src/save/storage.ts';

/**
 * Act III nights for the Playwright tests (e2e/act3-puzzles.spec.ts, the
 * axe scans): played in the engine to where a player would have left them,
 * saved as an autosave, and continued from the title in the real UI.
 */

export type Locale = 'en' | 'zh-Hant-TW';

function drain(g: Game): void {
  while (g.takeCard());
}
function waitUntil(g: Game, minute: number): void {
  while (g.state.minute < minute && !g.busy) {
    const gap = minute - g.state.minute;
    g.choose('meta:wait');
    g.choose(`wait:${gap >= 10 ? 10 : gap >= 5 ? 5 : 1}`);
  }
  drain(g);
}
function goTo(g: Game, to: LocationId): void {
  g.choose('meta:travel');
  g.choose(`go:${to}`);
  drain(g);
}
function endNight(g: Game): void {
  if (!g.scene.hub) g.choose('meta:back');
  waitUntil(g, 46);
}

/** Acts I and II behind you (her raw data, her email, the night's offer), Act III open, then `prepare`d; as an autosave. */
export function actThree(locale: Locale, prepare: (g: Game) => void): string {
  const g = new Game(CONTENT);
  drain(g);
  g.state.solved.push('tlc', 'glovebox', 'console');
  endNight(g);
  for (const id of ['nb.raw', 'nb.email']) g.state.known.push({ id, loop: g.state.loop, minute: g.state.minute });
  g.state.flags.push('perfect.offered', 'ran.own');
  endNight(g);
  if (g.state.act !== 3) throw new Error(`still in Act ${g.state.act}`);
  prepare(g);
  const kv = memoryStorage();
  if (!new SaveStore(kv, { content: CONTENT }).write('auto', g.state, locale)) throw new Error('could not save');
  return kv.get(SaveStore.key('auto'))!;
}

/** Her tube from the mini-antechamber, then the synthesis lab; foil from the drawer if `foil`. */
export const kraken = (locale: Locale, foil: boolean) =>
  actThree(locale, (g) => {
    goTo(g, 'glovebox');
    g.choose('glovebox.mini.open');
    goTo(g, 'synth');
    if (foil) g.choose('synth.foil');
  });

/** The NMR suite, Tom's Post-it read. */
export const ups = (locale: Locale) =>
  actThree(locale, (g) => {
    goTo(g, 'nmr');
    g.choose('nmr.postit');
  });

/** At your desk for the 03:25 email, with the printout off the printer. */
export const spectra = (locale: Locale) =>
  actThree(locale, (g) => {
    expect(g.state.location).toBe('office');
    waitUntil(g, 38);
    g.choose('office.print');
    drain(g);
  });

/**
 * 03:33 with the peak match open, as the dark run will open it (#20 part B
 * wires that; nothing in the rooms does). Only for looking at the puzzle.
 */
export const inTheDark = (locale: Locale) =>
  actThree(locale, (g) => {
    goTo(g, 'nmr');
    Object.assign(g.state, { minute: 46, puzzle: 'peakmatch', darkRun: true });
  });

/** Continue that night from the title. */
export async function resume(page: Page, save: string, locale: Locale, opts: { motion?: boolean; contrast?: boolean } = {}): Promise<void> {
  await page.emulateMedia({ reducedMotion: opts.motion ? 'no-preference' : 'reduce' });
  await page.addInitScript(
    ([s, l, contrast]) => {
      if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l, highContrast: contrast }));
      if (!localStorage.getItem('dark-reaction.save.auto')) localStorage.setItem('dark-reaction.save.auto', s as string);
    },
    [save, locale, !!opts.contrast] as const,
  );
  await page.goto('./');
  await page.locator('.title__btn--primary').click();
  await expect(page.locator('.choice, .pz').first()).toBeVisible();
}
