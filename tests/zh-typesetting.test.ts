/**
 * 繁中 typesetting at the larger text sizes (#NEW7): a number or a Latin word stays on the line of the
 * Han that follows it, and the reviewer has one name.
 */
import { describe, expect, it } from 'vitest';
import { TABLES } from '../src/i18n/i18n.ts';
import { inline } from '../src/ui/dom.ts';

describe('繁中 typesetting (#NEW7)', () => {
  it('glues a number or a Latin word to the Han after it, and nothing else', () => {
    expect(inline('Kraken 的 4 號接口上')).toBe('Kraken&nbsp;的 4&nbsp;號接口上');
    expect(inline('嗡嗡響了 3 分鐘，一張 microSD 卡')).toBe('嗡嗡響了 3&nbsp;分鐘，一張 microSD&nbsp;卡');
    expect(inline('The tube on port 4 is *hers*.')).toBe('The tube on port 4 is <em>hers</em>.');
    expect(inline('a < b & 4 號')).toBe('a &lt; b &amp; 4&nbsp;號');
  });

  it('gives a filename break points after its underscores, so 。 never starts a line after it', () => {
    expect(inline('*2019-03-14_0333_PROTON_DARK_NOT_MINE.fid*。')).toBe('<em>2019-03-14_<wbr>0333_<wbr>PROTON_<wbr>DARK_<wbr>NOT_<wbr>MINE.fid</em>。');
  });

  it('keeps ppm with its number in the peak match’s readout', () => {
    for (const locale of ['en', 'zh-Hant-TW'] as const) expect(TABLES[locale]['puzzle.peakmatch.offset']).toContain('{offset}\u00a0ppm');
  });

  it('calls the reviewer 審查人 throughout', () => {
    for (const [key, value] of Object.entries(TABLES['zh-Hant-TW'])) expect(value, key).not.toContain('審查委員');
  });
});
