import { describe, expect, it } from 'vitest';
import type { Route } from '../src/content/routes.ts';
import type { Content } from '../src/engine/types.ts';
import type { PuzzleLogic } from '../src/puzzles/types.ts';
import {
  checkCoverage,
  checkGraph,
  checkLocales,
  checkRoutes,
  checkSpacing,
  chineseChars,
  englishWords,
  fuzz,
  referencedKeys,
  type Render,
} from '../scripts/lib/validator.ts';
import { TABLES } from '../src/i18n/i18n.ts';
import { miniContent } from './fixtures/mini.ts';

/** Every key renders as a ten-word English sentence and a twenty-character Chinese one. */
const render: Render = (_key, _params, locale) => (locale === 'en' ? 'one two three four five six seven eight nine ten' : '一二三四五六七八九十一二三四五六七八九十');

/** Trivial logic for the fixture's puzzles: one move solves them. */
const oneMove: PuzzleLogic<{ done: boolean }, 'go'> = {
  id: 'x',
  init: () => ({ done: false }),
  apply: () => ({ done: true }),
  isSolved: (s) => s.done,
  minutes: () => 2,
  solution: () => ['go'],
};
const logic = { demo: oneMove, dark: oneMove, slow: oneMove };

const honest: Route = { ending: 'honest', summary: 'pen, submit', steps: [{ do: 'office.pen' }, { do: 'office.submit' }] };
const dark: Route = {
  ending: 'dark',
  summary: 'read the email, load the tube, wait for 03:33, solve',
  steps: [{ do: 'office.computer' }, { do: 'office.email' }, { do: 'meta:back' }, { do: 'office.loaded' }, { night: true }, { solve: 'dark' }],
};

describe('graph checks', () => {
  it('pass on a well-formed world', () => {
    expect(checkGraph(miniContent())).toEqual([]);
  });

  it('find unreachable scenes, dead ends and choices that do nothing', () => {
    const c: Content = miniContent();
    c.scenes.push({ id: 'office.attic', location: 'office', text: [{ key: 'x' }], choices: [] });
    c.scenes.push({ id: 'office.trap', location: 'office', noBack: true, text: [{ key: 'x' }], choices: [{ id: 'office.nothing', label: 'x' }] });
    c.scenes[0]!.choices.push({ id: 'office.totrap', label: 'x', to: 'office.trap' });
    const messages = checkGraph(c).map((p) => p.message);
    expect(messages).toContain('scene "office.attic" is unreachable from the start');
    expect(messages).toContain('scene "office.trap" has no Back and no unconditional way out (dead end)');
    expect(messages).toContain('choice "office.nothing" neither shows text nor goes anywhere');
  });

  it('never let a choice that ends the game come first, where one Enter would take it (#61)', () => {
    const c: Content = miniContent();
    const end = { id: 'office.end', label: 'x', effects: [{ ending: 'honest' as const }] };
    c.scenes.push({ id: 'office.brink', location: 'office', text: [{ key: 'x' }], choices: [end] });
    c.scenes.push({ id: 'office.guarded', location: 'office', text: [{ key: 'x' }], choices: [{ id: 'office.stay', label: 'x', text: [{ key: 'x' }], once: 'loop' }, { ...end, id: 'office.end2' }] });
    c.scenes.push({ id: 'office.safe', location: 'office', backFirst: true, text: [{ key: 'x' }], choices: [{ ...end, id: 'office.end3' }] });
    c.scenes.push({ id: 'office.pointless', location: 'office', hub: true, backFirst: true, text: [{ key: 'x' }], choices: [] });
    c.scenes[0]!.choices.push(...['brink', 'guarded', 'safe', 'pointless'].map((s) => ({ id: `office.to.${s}`, label: 'x', to: `office.${s}` })));
    const messages = checkGraph(c).map((p) => p.message);
    expect(messages.filter((m) => m.includes('ends the game'))).toEqual([
      'scene "office.brink": "office.end" ends the game and can be the first choice; put an always-available choice before it, or set backFirst',
      // A choice that can vanish (once a loop) doesn't count as always there.
      'scene "office.guarded": "office.end2" ends the game and can be the first choice; put an always-available choice before it, or set backFirst',
    ]);
    expect(messages).toContain('scene "office.pointless" sets backFirst but has no Back to put first');
  });
});

describe('locale checks', () => {
  it('find keys used by content that are not in the tables, and placeholder drift', () => {
    const used = referencedKeys(miniContent());
    expect(used.get('office.hub.act1')).toBe('scene office.hub');
    const problems = checkLocales({ en: { a: 'x {n}', 'office.hub.act1': 'y' }, 'zh-Hant-TW': { a: 'x {m}', 'office.hub.act1': '「y」' } }, used);
    const messages = problems.filter((p) => p.level === 'error').map((p) => p.message);
    expect(messages).toContain('"a" placeholders differ: en {n} vs zh {m}');
    expect(messages.some((m) => m.startsWith('"loop.start" (used by loopStart)'))).toBe(true);
    expect(messages.some((m) => m.startsWith('"office.hub.act1"'))).toBe(false);
  });

  it('warn about straight quotes and half-width commas in 繁中', () => {
    const problems = checkLocales({ en: { a: 'x', b: 'y' }, 'zh-Hant-TW': { a: '他說"好"', b: '你好,世界' } }, new Map());
    expect(problems.filter((p) => p.level === 'warning')).toHaveLength(2);
  });

  it('want a space between Latin text and Han characters in 繁中, as the rest of it has (#145, #160)', () => {
    const tables = {
      en: { a: 'x', b: 'y', c: 'z', d: 'w' },
      'zh-Hant-TW': { a: 'Schlenk line上貼著膠帶', b: '7號流動座位', c: '*NO SAMPLE IN CAROUSEL.*樣品槽', d: '7 號座位，Schlenk line 上，{n}分鐘，{n:一頁:幾頁}，*CAROUSEL.* 樣品槽' },
    };
    expect(checkSpacing(tables).map((p) => p.message)).toEqual([
      'zh "a": "e上" needs a space between the Latin text and the Han characters',
      'zh "b": "7號" needs a space between the Latin text and the Han characters',
      'zh "c": "L.*樣" needs a space between the Latin text and the Han characters',
    ]);
    expect(checkSpacing(TABLES)).toEqual([]);
  });

  it('warn about straight quotes in English, and not about typeset ones (#26)', () => {
    const problems = checkLocales({ en: { a: "you don't", b: 'say "now"', c: 'you don’t say “now”' }, 'zh-Hant-TW': { a: '甲', b: '乙', c: '丙' } }, new Map());
    const warnings = problems.filter((p) => p.level === 'warning').map((p) => p.message);
    expect(warnings).toEqual(['en "a" uses a straight apostrophe; prefer ’', 'en "b" uses a straight double quote; prefer “ ”']);
  });
});

describe('routes', () => {
  it('play to their endings and total the reading in both languages', () => {
    const { problems, reports } = checkRoutes(miniContent(), logic, [honest, dark], render);
    expect(problems).toEqual([]);
    const d = reports.find((r) => r.ending === 'dark')!;
    expect(d.ok).toBe(true);
    expect(d.parMinutes).toBe(2);
    expect(d.words.en).toBeGreaterThan(0);
    expect(d.minutes.en).toBeCloseTo(d.words.en / 230 + 2, 5);
    expect(d.minutes.zh).toBeCloseTo(d.words.zh / 350 + 2, 5);
  });

  it('report the first impossible step with what was possible instead', () => {
    const broken: Route = { ending: 'honest', summary: 'submit without the pen', steps: [{ do: 'office.submit' }] };
    const { problems } = checkRoutes(miniContent(), logic, [broken], render);
    expect(problems[0]?.message).toMatch(/step 1: "office.submit" is not available in office.hub .*Available: office\.arm/);
  });

  it('report a route that ends somewhere else', () => {
    const wrong: Route = { ending: 'fire', summary: 'actually honest', steps: honest.steps };
    expect(checkRoutes(miniContent(), logic, [wrong], render).problems[0]?.message).toMatch(/route ended with honest/);
  });

  it('catch missing keys and unfilled placeholders on screen', () => {
    const leaky: Render = (key, _p, locale) => (key === 'r.pen' ? (locale === 'en' ? 'You take {item}.' : '[[r.pen]]') : 'fine');
    const messages = checkRoutes(miniContent(), logic, [honest], leaky).problems.map((p) => p.message);
    expect(messages.some((m) => m.includes('unfilled {item} in en'))).toBe(true);
    expect(messages.some((m) => m.includes('missing key rendered in zh-Hant-TW'))).toBe(true);
  });
});

describe('coverage and playtime', () => {
  it('every defined ending needs a route; the true ending must take at least 30 minutes', () => {
    const c = miniContent();
    const { reports } = checkRoutes(c, logic, [honest, dark], render);
    const messages = checkCoverage(c, [honest, dark], reports).map((p) => p.message);
    expect(messages.filter((m) => m.includes('has no route'))).toHaveLength(4);
    expect(messages.some((m) => m.startsWith('critical path to the true ending is'))).toBe(true);
  });
});

describe('fuzz', () => {
  it('random walks through the fixture world never throw or get stuck', () => {
    const { problems } = fuzz(miniContent(), logic, 25, 300);
    expect(problems).toEqual([]);
  });
});

describe('reading counts', () => {
  it('count English words and Chinese characters (Latin words count once)', () => {
    expect(englishWords('The *queue* lies — ask it for --all.')).toBe(7);
    expect(chineseChars('跑 NMR 要 8 分鐘。')).toBe(6);
  });
});
