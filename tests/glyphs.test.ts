/**
 * Layer 3's glyph check (scripts/lib/validator.ts `checkGlyphs`) and the
 * WOFF2 reader it uses on the built fonts (scripts/lib/woff2.ts).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';
import { describe, expect, it } from 'vitest';
import { readCodepoints } from '../scripts/lib/cmap.ts';
import { checkGlyphs } from '../scripts/lib/validator.ts';
import { woff2Codepoints } from '../scripts/lib/woff2.ts';

const cps = (s: string) => new Set([...s].map((c) => c.codePointAt(0)!));

describe('checkGlyphs', () => {
  const fonts = { cjk: cps('暗反應「」。'), latin: cps('Dark eRacton≈') };
  const tables = (zh: string, en = 'Dark') => ({ en: { a: en }, 'zh-Hant-TW': { a: zh } });

  it('passes when every 繁中 character is in the CJK subset', () => {
    expect(checkGlyphs(tables('「暗反應」。'), fonts)).toEqual([]);
  });

  it('warns when a 繁中 character only the Latin fallback has renders in it', () => {
    const p = checkGlyphs(tables('暗≈反應'), fonts);
    expect(p.map((x) => x.level)).toEqual(['warning']);
    expect(p[0]!.message).toContain('U+2248');
  });

  it('fails when a 繁中 character is in neither font of its stack (a tofu box)', () => {
    const p = checkGlyphs(tables('暗反應鬱'), fonts);
    expect(p.map((x) => x.level)).toEqual(['error']);
    expect(p[0]!.message).toContain('U+9B31');
  });

  it('lets English fall back to the CJK font (names like 暗反應), and ignores whitespace', () => {
    expect(checkGlyphs(tables('暗', 'Dark 暗反應\n'), fonts)).toEqual([]);
  });
});

describe('woff2Codepoints', () => {
  it('reads the character map out of a WOFF2 file', async () => {
    const require = createRequire(import.meta.url);
    const ttf = readFileSync(require.resolve('@expo-google-fonts/source-serif-4/400Regular/SourceSerif4_400Regular.ttf'));
    const woff2 = await subsetFont(ttf, 'Dark ≈暗', { targetFormat: 'woff2' });
    const got = woff2Codepoints(new Uint8Array(woff2));
    // Source Serif has the Latin letters and ≈, not 暗; the subset keeps exactly what it can draw.
    for (const c of 'Dark ≈') expect(got.has(c.codePointAt(0)!)).toBe(true);
    expect(got.has('暗'.codePointAt(0)!)).toBe(false);
    // The same as reading the TTF's own map, restricted to the subset's text.
    const full = readCodepoints(new Uint8Array(ttf));
    expect([...got].every((cp) => full.has(cp))).toBe(true);
  });
});
