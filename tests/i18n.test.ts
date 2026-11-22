import { afterEach, describe, expect, it } from 'vitest';
import { compareTables, getLocale, has, onLocaleChange, placeholders, setLocale, t, TABLES } from '../src/i18n/i18n.ts';

afterEach(() => setLocale('en'));

describe('lookup', () => {
  it('returns the string for the current locale', () => {
    expect(t('ui.notebook')).toBe('Notebook');
    setLocale('zh-Hant-TW');
    expect(t('ui.notebook')).toBe('筆記本');
    expect(t('ui.notebook', undefined, 'en')).toBe('Notebook');
  });

  it('fills placeholders and English plurals', () => {
    expect(t('ui.wait.minutes', { n: 1 })).toBe('Wait 1 minute');
    expect(t('ui.wait.minutes', { n: 5 })).toBe('Wait 5 minutes');
    expect(t('ui.wait.minutes', { n: 5 }, 'zh-Hant-TW')).toBe('等 5 分鐘');
  });

  it('resolves params that are keys, in the same locale', () => {
    expect(t('ui.noted', { entry: '@loc.office.name' })).toBe('Added to your notebook: 4.08 Write-up office.');
    expect(t('ui.noted', { entry: '@loc.office.name' }, 'zh-Hant-TW')).toBe('寫進筆記本：4.08 研究生辦公室。');
  });

  it('puts two sentences one after the other the way each language does (#66)', () => {
    expect(t('puzzle.then', { first: 'The door opens.', second: 'O₂ 1.0 ppm.' }, 'en')).toBe('The door opens. O₂ 1.0 ppm.');
    expect(t('puzzle.then', { first: '門開了。', second: 'O₂ 1.0 ppm。' }, 'zh-Hant-TW')).toBe('門開了。O₂ 1.0 ppm。');
    // Every 繁中 sentence a puzzle status can end with or start with stays full-width at the join.
    expect(t('puzzle.glovebox.o2.now', { ppm: '1.0' }, 'zh-Hant-TW')).toBe('O₂ 1.0 ppm。');
  });

  it('marks missing keys and unfilled placeholders visibly instead of crashing', () => {
    expect(t('no.such.key')).toBe('[[no.such.key]]');
    expect(has('no.such.key')).toBe(false);
    expect(t('ui.cost', {})).toBe('{n} min');
  });
});

describe('switching language', () => {
  it('notifies listeners once per change and can unsubscribe', () => {
    const seen: string[] = [];
    const off = onLocaleChange((l) => seen.push(l));
    setLocale('zh-Hant-TW');
    setLocale('zh-Hant-TW');
    setLocale('en');
    off();
    setLocale('zh-Hant-TW');
    expect(seen).toEqual(['zh-Hant-TW', 'en']);
    expect(getLocale()).toBe('zh-Hant-TW');
  });

  it('renders the same state in either language without changing it', () => {
    const display: Array<{ key: string; params: Record<string, string | number>; style: string }> = [
      { key: 'ui.waited', params: { n: 3 }, style: 'system' },
      { key: 'ui.noted', params: { entry: '@loc.nmr.name' }, style: 'system' },
    ];
    const before = JSON.stringify(display);
    const render = () => display.map((p) => t(p.key, p.params)).join(' | ');
    const english = render();
    setLocale('zh-Hant-TW');
    const chinese = render();
    expect(english).toContain('3 minutes');
    expect(chinese).toContain('B.03 NMR 室');
    expect(JSON.stringify(display)).toBe(before);
  });
});

describe('parity', () => {
  it('the shipped tables have identical keys, no empty strings and matching placeholders', () => {
    const cmp = compareTables(TABLES.en, TABLES['zh-Hant-TW']);
    expect(cmp).toEqual({ missingInB: [], missingInA: [], empty: [], placeholderMismatch: [] });
  });

  it('detects missing keys, empty strings and placeholder drift', () => {
    const cmp = compareTables({ a: 'x {n}', b: 'y', c: ' ' }, { a: 'x {m}', b: 'y', d: 'z' });
    expect(cmp.missingInB).toEqual(['c']);
    expect(cmp.missingInA).toEqual(['d']);
    expect(cmp.empty).toEqual([{ locale: 'a', key: 'c' }]);
    expect(cmp.placeholderMismatch).toEqual([{ key: 'a', a: ['n'], b: ['m'] }]);
  });

  it('counts a plural selector as a use of its variable', () => {
    expect(placeholders('Wait {n} {n:minute:minutes}')).toEqual(['n']);
    expect(placeholders('{who} saw {n:one:many}')).toEqual(['n', 'who']);
  });
});
