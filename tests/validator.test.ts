import { describe, expect, it } from 'vitest';
import type { Route } from '../src/content/routes.ts';
import type { Content } from '../src/engine/types.ts';
import type { PuzzleLogic } from '../src/puzzles/types.ts';
import { CONTENT } from '../src/content/index.ts';
import { EPILOGUE_JOKES, JOKE_KEYS, LOCALISED_VARIANTS } from '../src/content/humour.ts';
import {
  canHold,
  checkAnomalies,
  checkCoverage,
  checkGraph,
  checkLocales,
  checkRoutes,
  checkSpacing,
  checkTone,
  checkVariants,
  chineseChars,
  englishWords,
  fuzz,
  numbersIn,
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
    c.scenes.push({ tone: 'calm', id: 'office.attic', location: 'office', text: [{ key: 'x' }], choices: [] });
    c.scenes.push({ tone: 'calm', id: 'office.trap', location: 'office', noBack: true, text: [{ key: 'x' }], choices: [{ id: 'office.nothing', label: 'x' }] });
    c.scenes[0]!.choices.push({ id: 'office.totrap', label: 'x', to: 'office.trap' });
    const messages = checkGraph(c).map((p) => p.message);
    expect(messages).toContain('scene "office.attic" is unreachable from the start');
    expect(messages).toContain('scene "office.trap" has no Back and no unconditional way out (dead end)');
    expect(messages).toContain('choice "office.nothing" neither shows text nor goes anywhere');
  });

  it('never let a choice that ends the game come first, where one Enter would take it (#61)', () => {
    const c: Content = miniContent();
    const end = { id: 'office.end', label: 'x', effects: [{ ending: 'honest' as const }] };
    c.scenes.push({ tone: 'calm', id: 'office.brink', location: 'office', text: [{ key: 'x' }], choices: [end] });
    c.scenes.push({ tone: 'calm', id: 'office.guarded', location: 'office', text: [{ key: 'x' }], choices: [{ id: 'office.stay', label: 'x', text: [{ key: 'x' }], once: 'loop' }, { ...end, id: 'office.end2' }] });
    c.scenes.push({ tone: 'calm', id: 'office.safe', location: 'office', backFirst: true, text: [{ key: 'x' }], choices: [{ ...end, id: 'office.end3' }] });
    c.scenes.push({ tone: 'calm', id: 'office.pointless', location: 'office', hub: true, backFirst: true, text: [{ key: 'x' }], choices: [] });
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

describe('tone checks (docs/HUMOUR.md, #203)', () => {
  const JOKES = new Set(['fun.a', 'fun.b', 'fun.c']);
  const rules = { jokes: JOKES, epilogueJokes: { fire: 'any' as const, clocking: ['fun.c'] } };
  /** The mini world with a calm-until-Act-III office whose jokes are gated as each test needs. */
  function world(): Content {
    const c = miniContent();
    c.scenes.find((s) => s.id === 'office.hub')!.tone = { 1: 'calm', 2: 'calm', 3: 'uneasy' };
    return c;
  }
  const office = (c: Content) => c.scenes.find((s) => s.id === 'office.hub')!;

  it('pass on the mini world', () => {
    expect(checkTone(world(), rules)).toEqual([]);
  });

  it('let a calm scene have its jokes, and an uneasy Act III one, if the rest are gated out of Act III', () => {
    const c = world();
    office(c).choices.push(
      { id: 'office.j1', label: 'x', text: [{ key: 'fun.a' }], if: { not: { act: 3 } } },
      { id: 'office.j2', label: 'x', text: [{ key: 'fun.b', if: { actGte: 3 } }] },
    );
    expect(checkTone(c, rules)).toEqual([]);
  });

  it('allow an uneasy scene one light line, and fail the second, naming the act', () => {
    const c = world();
    office(c).choices.push({ id: 'office.j1', label: 'x', text: [{ key: 'fun.a' }] }, { id: 'office.j2', label: 'x', text: [{ key: 'fun.b' }] });
    const problems = checkTone(c, rules);
    expect(problems.map((p) => p.message)).toEqual([expect.stringMatching(/office\.hub" is uneasy in Act 3 .* 2: "fun\.a", "fun\.b"/)]);
  });

  it('fail any joke where a scene is dread, including a joke an event could bring in', () => {
    const c = world();
    c.scenes.find((s) => s.id === 'nmr.hub')!.tone = { 1: 'calm', 2: 'calm', 3: 'dread' };
    c.events.push({ id: 'ev.pa', minute: 8, until: 11, if: { at: 'nmr' }, text: [{ key: 'fun.a' }] });
    expect(checkTone(c, rules).map((p) => p.message)).toEqual([expect.stringMatching(/nmr\.hub" is dread in Act 3, but can show "fun\.a"/)]);
    c.events[c.events.length - 1]!.if = { all: [{ at: 'nmr' }, { not: { act: 3 } }] };
    expect(checkTone(c, rules)).toEqual([]);
  });

  it('count an anomaly found in a scene against that scene, in the acts it can be found in', () => {
    const c = world();
    c.scenes.find((s) => s.id === 'pi.door')!.tone = 'dread';
    c.anomalies.push({ id: 'x', trigger: { kind: 'panel', panel: 'x' }, scene: 'pi.door', tone: 'calm', keys: ['fun.a'], acts: [1, 2] });
    expect(checkTone(c, rules).map((p) => p.message)).toEqual([expect.stringMatching(/pi\.door" is dread in Act 1/), expect.stringMatching(/Act 2/)]);
  });

  it('keep jokes out of 03:33, the act titles, dread puzzles and the epilogues, but for Fire Alarm and the lanyard beat', () => {
    const c = world();
    c.loopStart.push({ key: 'fun.a' });
    c.lightsOut[0]!.text = [{ key: 'fun.a' }];
    c.events.push({ id: 'ev.late', minute: 46, text: [{ key: 'fun.b' }] });
    c.acts[0]!.title = 'fun.a';
    c.puzzles.find((p) => p.id === 'dark')!.hints[0] = 'fun.a';
    c.endings.find((e) => e.id === 'fire')!.epilogue.push({ key: 'fun.a' });
    c.endings.find((e) => e.id === 'clocking')!.epilogue.push({ key: 'fun.c' }, { key: 'fun.b' });
    c.endings.find((e) => e.id === 'dark')!.epilogue.push({ key: 'fun.a' });
    const messages = checkTone(c, rules).map((p) => p.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/02:47 page/),
        expect.stringMatching(/lights-out rule "lo\.alarm"/),
        expect.stringMatching(/event "ev\.late", which can fire at 03:33/),
        expect.stringMatching(/Act 2's title/),
        expect.stringMatching(/puzzle "dark" is dread/),
        expect.stringMatching(/clocking epilogue \(beyond "fun\.c"\) .* "fun\.b"/),
        expect.stringMatching(/dark epilogue/),
      ]),
    );
    expect(messages.some((m) => /fire epilogue/.test(m))).toBe(false);
    expect(messages.some((m) => /"fun\.c"$/.test(m))).toBe(false);
  });

  it('canHold reads only the act and the place; anything else might go either way', () => {
    expect(canHold({ act: 3 }, { act: 2 })).toBe(false);
    expect(canHold({ not: { act: 3 } }, { act: 2 })).toBe(true);
    expect(canHold({ all: [{ flag: 'x' }, { actGte: 2 }] }, { act: 1 })).toBe(false);
    expect(canHold({ all: [{ flag: 'x' }, { actGte: 2 }] }, { act: 2 })).toBe(true);
    expect(canHold({ any: [{ at: 'roof' }, { scene: 'office.hub' }] }, { act: 1, scene: 'nmr.hub', location: 'nmr' })).toBe(false);
    expect(canHold({ not: { flag: 'x' } }, { act: 1 })).toBe(true);
  });
});

describe('tone checks follow a key to the page it lands on (#203, from the cold review)', () => {
  const JOKES = new Set(['fun.a', 'fun.b', 'ph.joke.body', 'nb.joke.title']);
  const rules = { jokes: JOKES, epilogueJokes: {} };
  const messages = (c: Content) => checkTone(c, rules).map((p) => p.message);

  it('an event that can still fire at 03:33 (no until, or until past it) never has a joke', () => {
    const c = miniContent();
    c.events.push({ id: 'ev.pa', minute: 8, if: { at: 'office' }, text: [{ key: 'fun.a' }] });
    expect(messages(c)).toEqual([expect.stringMatching(/event "ev\.pa", which can fire at 03:33/)]);
    c.events[c.events.length - 1]!.until = 12;
    expect(messages(c)).toEqual([]);
  });

  it('a choice’s result counts on the page it leads to: a dread scene doesn’t get a joke through the door', () => {
    const c = miniContent();
    c.scenes.find((s) => s.id === 'office.computer')!.tone = 'dread';
    c.scenes[0]!.choices.push({ id: 'office.joke', label: 'x', text: [{ key: 'fun.a' }], to: 'office.computer' });
    expect(messages(c)).toEqual(expect.arrayContaining([expect.stringMatching(/office\.computer" is dread in Act 1, but can show "fun\.a"/)]));
  });

  it('a puzzle’s results count on the page of the scene that opened it', () => {
    const c = miniContent();
    c.scenes[0]!.tone = { 1: 'calm', 2: 'calm', 3: 'dread' };
    c.puzzles.find((p) => p.id === 'demo')!.solvedText = [{ key: 'fun.a' }];
    expect(messages(c)).toEqual([
      expect.stringMatching(/office\.hub" is dread in Act 3, but can show "fun\.a"/),
    ]);
  });

  it('a phantom page never has a joke (it is written at 02:47), and a "Noted:" title counts where it is written', () => {
    const c = miniContent();
    c.notebook.push({ id: 'ph.joke', section: 'anomalies', kind: 'phantom', title: 'x', body: 'ph.joke.body' }, { id: 'nb.joke', section: 'data', title: 'nb.joke.title', body: 'x' });
    c.phantoms.push({ entry: 'ph.joke', when: { loopGte: 3 } });
    c.scenes.find((s) => s.id === 'pi.door')!.tone = 'dread';
    c.scenes.find((s) => s.id === 'pi.door')!.choices.push({ id: 'pi.joke', label: 'x', text: [{ key: 'x' }], effects: [{ learn: 'nb.joke' }] });
    expect(messages(c)).toEqual(
      expect.arrayContaining([expect.stringMatching(/phantom "ph\.joke".* "ph\.joke\.body"/), expect.stringMatching(/pi\.door" is dread in Act 1, but can show "nb\.joke\.title"/)]),
    );
  });

  it('the start room’s own text is on the 02:47 page', () => {
    const c = miniContent();
    c.scenes[0]!.text.push({ key: 'fun.b' });
    expect(messages(c)).toEqual([expect.stringMatching(/the 02:47 page \(the start room\).*"fun\.b"/)]);
  });
});

describe('localised variants (#203)', () => {
  const tables = (en: Record<string, string>, zh: Record<string, string>) => ({ en, 'zh-Hant-TW': zh });
  it('the same joke keeps its numbers in both languages', () => {
    const t = tables({ 'fun.y': 'It reads 104 %. Of what?' }, { 'fun.y': '104 %。一百零四趴的什麼？' });
    expect(checkVariants(t, new Set(['fun.y']), new Set())).toEqual([]);
  });
  it('fail a joke whose numbers differ, unless it is flagged localisedVariant, which may differ in meaning', () => {
    const t = tables({ 'fun.v': 'RESEARCH WRITE-UP ROOM, optimistic on 2 counts.' }, { 'fun.v': '大家都叫它「寫不完的房間」。' });
    expect(checkVariants(t, new Set(['fun.v']), new Set()).map((p) => p.message)).toEqual([expect.stringMatching(/"fun\.v" has \[2\] in English and \[\] in 繁中/)]);
    expect(checkVariants(t, new Set(['fun.v']), new Set(['fun.v']))).toEqual([]);
  });
  it('read times, decimals and thousands as numbers, and placeholders as nothing', () => {
    expect(numbersIn('Last service 18:15. It is {clock}. Up 1,247 days; Rf 0.3.')).toEqual(['0.3', '1247', '18:15']);
  });
  it('read full-width digits, and a full-width colon or point between digits, as their ASCII twins', () => {
    expect(numbersIn('末班車：１８：１５。產率１０４％，Rf ０．３。')).toEqual(numbersIn('Last service 18:15; 104 %; Rf 0.3.'));
  });
  it('refuse a flag on a key that is not a joke', () => {
    expect(checkVariants(tables({}, {}), new Set(), new Set(['office.hub.act1'])).map((p) => p.check)).toEqual(['variants']);
  });
});

describe('anomaly registry checks (#203)', () => {
  it('pass when the choice that finds an entry records it', () => {
    const c = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.doodle', label: 'c.doodle', text: [{ key: 'r.doodle' }], effects: [{ anomaly: 'doodle' }] });
    c.anomalies.push({ id: 'doodle', trigger: { kind: 'choice', choice: 'office.doodle', setup: {} }, scene: 'office.hub', tone: 'calm', keys: ['r.doodle'] });
    const tables = { en: { 'r.doodle': 'x' }, 'zh-Hant-TW': { 'r.doodle': 'x' } };
    expect(checkAnomalies(c, tables)).toEqual([]);
  });
  it('fail an entry that lives in a dread scene, says it lives somewhere its choice isn’t, or rides a rule whose effects never run', () => {
    const c = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.doodle', label: 'c.doodle', text: [{ key: 'k' }], effects: [{ anomaly: 'doodle' }] });
    c.scenes.find((s) => s.id === 'pi.door')!.tone = { 1: 'calm', 2: 'calm', 3: 'dread' };
    const dark = c.lightsOut.find((r) => r.id === 'lo.dark')!;
    dark.effects = [{ anomaly: 'alarm' }];
    c.anomalies.push(
      { id: 'door', trigger: { kind: 'panel', panel: 'x' }, scene: 'pi.door', tone: 'calm', keys: ['k'] },
      { id: 'doodle', trigger: { kind: 'choice', choice: 'office.doodle', setup: {} }, scene: 'nmr.hub', tone: 'calm', keys: ['k'] },
      { id: 'alarm', trigger: { kind: 'lightsout', rule: 'lo.dark', setup: {} }, scene: 'office.hub', tone: 'calm', keys: ['k'] },
    );
    const tables = { en: { k: 'x' }, 'zh-Hant-TW': { k: 'x' } };
    expect(checkAnomalies(c, tables).map((p) => p.message)).toEqual([
      expect.stringMatching(/"door" lives in "pi\.door", which is dread in Act 3/),
      expect.stringMatching(/"doodle" says it lives in "nmr\.hub", but its choice is in "office\.hub"/),
      expect.stringMatching(/"alarm" is recorded by lights-out rule "lo\.dark", which ends the night another way/),
    ]);
  });

  it('fail an entry nowhere real, dread, missing a locale, or not recorded by what finds it', () => {
    const c = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.plain', label: 'x', text: [{ key: 'x' }] });
    c.anomalies.push(
      { id: 'lost', trigger: { kind: 'panel', panel: 'credits' }, scene: 'office.attic', tone: 'calm', keys: ['k'] },
      { id: 'grim', trigger: { kind: 'panel', panel: 'credits' }, scene: 'ui:title', tone: 'dread' as 'calm', keys: ['k'] },
      { id: 'quiet', trigger: { kind: 'choice', choice: 'office.plain', setup: {} }, scene: 'office.hub', tone: 'calm', keys: ['k', 'only.en'] },
    );
    const tables = { en: { k: 'x', 'only.en': 'x' }, 'zh-Hant-TW': { k: 'x' } };
    expect(checkAnomalies(c, tables).map((p) => p.message)).toEqual([
      expect.stringMatching(/"lost" lives in "office\.attic"/),
      expect.stringMatching(/"grim" is dread/),
      expect.stringMatching(/"only\.en", which isn't in zh-Hant-TW/),
      expect.stringMatching(/"quiet" is found by choice "office\.plain", which doesn't record it/),
    ]);
  });
});

describe('the game’s humour passes its own rules', () => {
  it('tone, variants and the registry', () => {
    expect(checkTone(CONTENT, { jokes: JOKE_KEYS, epilogueJokes: EPILOGUE_JOKES })).toEqual([]);
    expect(checkVariants(TABLES, JOKE_KEYS, LOCALISED_VARIANTS)).toEqual([]);
    expect(checkAnomalies(CONTENT, TABLES)).toEqual([]);
  });
});
