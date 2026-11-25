import { describe, expect, it } from 'vitest';
import { consoleLogic, consoleMinutes, consoleSave, respond } from '../src/puzzles/console/logic.ts';
import { CONTENT } from '../src/content/index.ts';
import { gloveboxLogic, gloveSave, LAST_PURGE_START, o2, PURGE_MINUTES, type GloveMove, type GloveState } from '../src/puzzles/glovebox/logic.ts';
import { distance, tlcLogic, visibleSpots, type TlcMove, type TlcState } from '../src/puzzles/tlc/logic.ts';
import { checkPuzzleContract } from './helpers/puzzle-contract.ts';

const run = <S, M>(apply: (s: S, m: M) => S, s: S, moves: M[]) => moves.reduce(apply, s);

describe('TLC plate', () => {
  const start = () => tlcLogic.init({ minute: 0, act: 1 });
  const play = (moves: TlcMove[]): TlcState => run(tlcLogic.apply, start(), moves);

  it('keeps the contract', () => checkPuzzleContract(tlcLogic));

  it('puts the product 2.1 cm up a 6 cm run (Rf 0.35)', () => {
    expect(distance('P')).toBe(2.1);
    expect(play([{ type: 'measure', lane: 12, compound: 'P' }]).feedback).toEqual({ kind: 'measured', lane: 12, compound: 'P', cm: 2.1, rf: 0.35 });
  });

  it('hides lane 11’s impurity until the UV lamp is on', () => {
    expect(visibleSpots(11, false)).toEqual(['P']);
    expect(visibleSpots(11, true)).toEqual(['B', 'P']);
    expect(play([{ type: 'measure', lane: 11, compound: 'B' }]).feedback).toBeNull();
  });

  it('refuses impure, empty and wasteful selections, each costing a minute', () => {
    const t = (lanes: Array<10 | 11 | 12 | 13 | 14 | 15 | 16>) => play([...lanes.map((lane) => ({ type: 'toggle' as const, lane })), { type: 'combine' }]);
    expect(t([11, 12, 13, 14]).feedback).toEqual({ kind: 'impure', lane: 11, uv: false });
    expect(t([12, 13, 14, 15]).feedback).toEqual({ kind: 'impure', lane: 15, uv: false });
    expect(t([12, 14]).feedback).toEqual({ kind: 'wasteful', lane: 13 });
    expect(t([10]).feedback).toEqual({ kind: 'noProduct', lane: 10 });
    expect(play([{ type: 'combine' }]).feedback).toEqual({ kind: 'empty' });
    expect(tlcLogic.minutes(t([11, 12, 13, 14]))).toBe(3);
    expect(tlcLogic.minutes(play([{ type: 'combine' }]))).toBe(2);
  });

  it('accepts exactly 12, 13 and 14', () => {
    const s = play([12, 13, 14].map((lane) => ({ type: 'toggle' as const, lane: lane as 12 })).concat([{ type: 'combine' } as never]));
    expect(tlcLogic.isSolved(s)).toBe(true);
  });
});

describe('glovebox antechamber', () => {
  const at = (minute: number) => gloveboxLogic.init({ minute, act: 1 });
  const play = (s: GloveState, moves: GloveMove[]) => run(gloveboxLogic.apply, s, moves);
  const solution = gloveboxLogic.solution(at(0));

  it('keeps the contract', () => checkPuzzleContract(gloveboxLogic));

  it('takes nine minutes: three cycles of evacuate (2) and refill (1)', () => {
    const s = play(at(0), solution);
    expect(gloveboxLogic.minutes(s)).toBe(9);
    expect(s.cycles).toBe(3);
  });

  it('is a race against the oxygen: a clean purge started at 03:19 just makes it, 03:20 is too late', () => {
    expect(LAST_PURGE_START).toBe(32);
    const last = play(at(32), solution); // in at 41 min: 10.0 ppm, the limit, still yellow
    expect(gloveboxLogic.isSolved(last)).toBe(true);
    expect(o2(last)).toBe(10);
    const late = play(at(33), solution); // in at 42 min: 10.2 ppm
    expect(gloveboxLogic.isFailed!(late)).toBe(true);
    expect(o2(late)).toBeGreaterThan(10);
  });

  it('the later-loop shortcut keeps the same deadline as the puzzle', () => {
    const hub = CONTENT.scenes.find((sc) => sc.id === 'glovebox.hub')!;
    const purge = hub.choices.find((c) => c.id === 'glovebox.purge')!;
    const late = hub.choices.find((c) => c.id === 'glovebox.purge.late')!;
    expect(purge.cost).toBe(PURGE_MINUTES);
    expect(gloveboxLogic.minutes(play(at(0), solution))).toBe(PURGE_MINUTES);
    expect(JSON.stringify(purge.if)).toContain(`{"minuteLt":${LAST_PURGE_START + 1}}`);
    expect(JSON.stringify(late.if)).toContain(`{"minuteGte":${LAST_PURGE_START + 1}}`);
  });

  it('two cycles are not enough (the SOP is wrong)', () => {
    const two = play(at(0), ['outer', 'load', 'outer', 'evacuate', 'refill', 'evacuate', 'refill', 'inner', 'transfer']);
    expect(two.last).toBe('ruined');
    expect(gloveboxLogic.isFailed!(two)).toBe(true);
  });

  it('refuses impossible actions without spending time, and punishes dangerous ones', () => {
    const vac = play(at(0), ['evacuate']);
    expect(play(vac, ['outer']).last).toBe('outerStuck');
    expect(play(at(0), ['outer', 'evacuate']).last).toBe('evacuateDoorOpen');
    expect(gloveboxLogic.minutes(play(at(0), ['outer', 'evacuate']))).toBe(0);
    expect(play(vac, ['inner']).spike).toBe(5);
    const both = play(at(0), ['outer', 'load', 'outer', 'evacuate', 'refill', 'evacuate', 'refill', 'evacuate', 'refill', 'inner', 'outer']);
    expect(both.last).toBe('bothOpen');
    expect(gloveboxLogic.isFailed!(both)).toBe(true);
  });

  it('opening the outer door again resets the purge count', () => {
    const s = play(at(0), ['outer', 'load', 'outer', 'evacuate', 'refill', 'outer']);
    expect(s.cycles).toBe(0);
  });
});

describe('NMR console', () => {
  const start = () => consoleLogic.init({ minute: 5, act: 1 });
  const type = (cmds: string[]) => run(consoleLogic.apply, start(), cmds);

  it('keeps the contract', () => checkPuzzleContract(consoleLogic));

  it('needs both the full queue and holder 13, in either order', () => {
    expect(consoleLogic.isSolved(type(['queue']))).toBe(false);
    expect(consoleLogic.isSolved(type(['queue --all']))).toBe(false);
    expect(consoleLogic.isSolved(type(['queue --all', 'info 13']))).toBe(true);
    expect(consoleLogic.isSolved(type(['INFO   13', 'Queue -a']))).toBe(true);
  });

  it('answers the rest of its vocabulary, and charges a minute per four commands', () => {
    expect(respond('help', '02:52')).toEqual({ key: 'console.out.help' });
    expect(respond('date', '02:52')).toEqual({ key: 'console.out.date', params: { clock: '02:52' } });
    expect(respond('info 9', '02:52')).toEqual({ key: 'console.out.info.empty', params: { n: 9 } });
    expect(respond('eject 13', '02:52')).toEqual({ key: 'console.out.eject' });
    expect(respond('make tea', '02:52')).toEqual({ key: 'console.out.unknown', params: { command: 'make tea' } });
    expect(consoleMinutes(0)).toBe(2);
    expect(consoleMinutes(4)).toBe(3);
    expect(type(['help', 'whoami', 'clear']).lines).toEqual([]);
    expect(type(['exit']).closed).toBe(true);
  });

  it('keeps the transcript bounded', () => {
    expect(type(Array.from({ length: 100 }, () => 'whoami')).lines.length).toBeLessThanOrEqual(60);
  });
});

describe('progress saved mid-puzzle (a reload, or the browser closing)', () => {
  const roundTrip = (data: unknown) => JSON.parse(JSON.stringify(data)) as unknown;

  it('the antechamber comes back exactly as it was; junk comes back as a fresh start', () => {
    const mid = run(gloveboxLogic.apply, gloveboxLogic.init({ minute: 5, act: 1 }), ['outer', 'load', 'outer', 'evacuate', 'refill'] as GloveMove[]);
    const back = gloveboxLogic.init({ minute: 5, act: 1, data: roundTrip(gloveSave(mid)) });
    expect(back).toEqual({ ...mid, last: null });
    expect(gloveboxLogic.minutes(back)).toBe(3);
    expect(back.cycles).toBe(1);
    const junk = gloveboxLogic.init({ minute: 5, act: 1, data: { minutes: -4, cycles: 'three', vial: 'pocket', ruined: 'yes', spike: Infinity } });
    expect(junk).toEqual(gloveboxLogic.init({ minute: 5, act: 1 }));
    // A spoiled sample stays spoiled.
    const ruined = run(gloveboxLogic.apply, gloveboxLogic.init({ minute: 5, act: 1 }), ['outer', 'load', 'outer', 'inner', 'transfer'] as GloveMove[]);
    expect(gloveboxLogic.isFailed!(gloveboxLogic.init({ minute: 5, act: 1, data: roundTrip(gloveSave(ruined)) }))).toBe(true);
  });

  it('the console screen comes back, minus anything it could not have printed', () => {
    const s = run(consoleLogic.apply, consoleLogic.init({ minute: 3, act: 1 }), ['queue --all', 'date']);
    expect(consoleLogic.init({ minute: 3, act: 1, data: roundTrip(consoleSave(s)) })).toEqual(s);
    const junk = consoleLogic.init({
      minute: 3,
      act: 1,
      data: { lines: [{ input: 5 }, { out: { key: 'ui.title' } }, { out: { key: 'console.out.help', params: { a: {}, b: 2 } } }, 'x'], sawAll: 'yes', commands: Number.NaN },
    });
    expect(junk.lines).toEqual([{ out: { key: 'console.out.help', params: { b: 2 } } }]);
    expect(junk.sawAll).toBe(false);
    expect(junk.commands).toBe(0);
  });

  it('the plate comes back with its selection and its wrong guesses, cleaned', () => {
    const back = tlcLogic.init({ minute: 0, act: 1, data: { uv: true, selected: [13, 12, 13, 99, 'x'], wrong: -3 } });
    expect(back.uv).toBe(true);
    expect(back.selected).toEqual([12, 13]);
    expect(back.wrong).toBe(0);
    expect(tlcLogic.init({ minute: 0, act: 1, data: { wrong: 2.7 } }).wrong).toBe(2);
  });
});
