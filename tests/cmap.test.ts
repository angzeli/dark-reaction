import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { readCodepoints } from '../scripts/lib/cmap.ts';

const require = createRequire(import.meta.url);
const load = (spec: string) => new Uint8Array(readFileSync(require.resolve(spec)));

describe('cmap reader', () => {
  it('reads Latin coverage from IBM Plex Mono and knows it has no CJK', () => {
    const cps = readCodepoints(load('@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf'));
    for (const ch of 'AZaz09{}<>~') expect(cps.has(ch.codePointAt(0)!)).toBe(true);
    expect(cps.has('暗'.codePointAt(0)!)).toBe(false);
  });

  it('reads CJK coverage from Noto Serif TC, including full-width punctuation', () => {
    const cps = readCodepoints(load('@expo-google-fonts/noto-serif-tc/400Regular/NotoSerifTC_400Regular.ttf'));
    for (const ch of '暗反應實驗室「」，。') expect(cps.has(ch.codePointAt(0)!)).toBe(true);
    expect(cps.size).toBeGreaterThan(10000);
  });
});
