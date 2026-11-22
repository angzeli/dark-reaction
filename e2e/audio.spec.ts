import { expect, test } from '@playwright/test';
import { build } from 'vite';

/**
 * Exercise the procedural audio engine in a real browser: enable it from a
 * user gesture, play every ambience and every cue, and fail on any error.
 * The module is bundled on the fly so this works before the UI exposes it.
 */
let bundle = '';

test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: { entry: 'src/audio/harness.ts', name: 'DRAudio', formats: ['iife'], fileName: () => 'audio.js' },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  for (const out of outputs) {
    if ('output' in out) for (const chunk of out.output) if (chunk.type === 'chunk') bundle += chunk.code;
  }
  expect(bundle.length).toBeGreaterThan(1000);
});

test('every ambience and cue plays without errors after an explicit opt-in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.setContent('<button id="enable">Enable sound</button>');
  await page.addScriptTag({ content: bundle });

  // Nothing exists before the opt-in.
  expect(await page.evaluate(() => (window as unknown as { DRAudio: { audio: { enabled: boolean } } }).DRAudio.audio.enabled)).toBe(false);

  await page.evaluate(() => {
    const { audio } = (window as unknown as { DRAudio: { audio: { enable(): Promise<boolean> } } }).DRAudio;
    document.querySelector('#enable')!.addEventListener('click', () => {
      (window as unknown as { enabling: Promise<boolean> }).enabling = audio.enable();
    });
  });
  await page.click('#enable');
  const report = await page.evaluate(async () => {
    const w = window as unknown as {
      enabling: Promise<boolean>;
      DRAudio: { audio: { enabled: boolean; setAmbience(id: string | null): void; cue(id: string): void; setVolumes(v: object): void; playChirps(t: number[]): void }; AMBIENCE_IDS: string[]; CUE_IDS: string[] };
    };
    const ok = await w.enabling;
    const { audio, AMBIENCE_IDS, CUE_IDS } = w.DRAudio;
    audio.setVolumes({ master: 0.5, ambience: 0.5, effects: 0.5 });
    for (const id of AMBIENCE_IDS) {
      audio.setAmbience(id);
      await new Promise((r) => setTimeout(r, 120));
    }
    for (const id of CUE_IDS) audio.cue(id);
    audio.playChirps([0, 0.3, 0.6]);
    await new Promise((r) => setTimeout(r, 600));
    audio.setAmbience(null);
    return { ok, enabled: audio.enabled, ambiences: AMBIENCE_IDS.length, cues: CUE_IDS.length };
  });

  expect(report).toEqual({ ok: true, enabled: true, ambiences: 10, cues: 13 });
  expect(errors).toEqual([]);
});
