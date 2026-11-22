/**
 * Act III's puzzles: the Kraken (Schlenk line), the chirp, the too-perfect
 * spectrum and the peak match in the dark. Their pure logic, the shared
 * spectra, saved progress, and the choices that open them in the real
 * content, driven through the engine.
 */
import { describe, expect, it } from 'vitest';
import { chirpSchedule, DEFAULT_CHIRP_TIMING } from '../src/audio/chirp.ts';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { Card, LocationId } from '../src/engine/types.ts';
import { TABLES } from '../src/i18n/i18n.ts';
import { chirpLogic, chirpSave, GROUP_OF, PATTERN, PIN, SCHEDULE, type ChirpMove } from '../src/puzzles/chirp/logic.ts';
import { DECOYS, fabricationLogic, fabricationSave, TELLS, type FabricationMove } from '../src/puzzles/fabrication/logic.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import { ANSWER_OFFSET, PEAKS, peakmatchLogic, peakSave, shown, type PeakMove } from '../src/puzzles/peakmatch/logic.ts';
import {
  breach,
  CLEAN_MINUTES,
  COST,
  PORTS,
  schlenkLogic,
  schlenkSave,
  TAPS,
  type SchlenkMove,
  type SchlenkState,
} from '../src/puzzles/schlenk/logic.ts';
import {
  axis,
  DARK,
  DARK_SHIFT,
  DECOY_PPM,
  FIGURE_3,
  HERS,
  OWN,
  PRINTOUT,
  PRODUCT_PPM,
  SATELLITE_OFFSET,
  SOLVENT_PPM,
  trace,
  type SpectrumSpec,
} from '../src/puzzles/spectra.ts';
import { checkPuzzleContract } from './helpers/puzzle-contract.ts';

const run = <S, M>(apply: (s: S, m: M) => S, s: S, moves: M[]) => moves.reduce(apply, s);
const roundTrip = (data: unknown) => JSON.parse(JSON.stringify(data)) as unknown;
const ACT3 = { minute: 30, act: 3 as const };

// ── P5 · The Kraken ────────────────────────────────────────────────────────

describe('the Kraken (Schlenk line)', () => {
  const start = () => schlenkLogic.init(ACT3);
  const play = (moves: SchlenkMove[], s: SchlenkState = start()) => run(schlenkLogic.apply, s, moves);
  /** The design's solution, step for step (docs/DESIGN.md §11 P5). */
  const DESIGNED: SchlenkMove[] = [
    { type: 'n2' },
    { type: 'tap', port: 2, to: 'vac' },
    { type: 'tap', port: 2, to: 'n2' },
    { type: 'tap', port: 4, to: 'n2' },
    { type: 'tap', port: 2, to: 'closed' },
    { type: 'bleed', which: 'tube' },
    { type: 'jy' },
    { type: 'wrap', foil: true },
  ];

  it('keeps the contract', () => checkPuzzleContract(schlenkLogic, ACT3));

  it('the designed sequence fills, seals and wraps her tube, in the shortcut’s six minutes', () => {
    const steps = DESIGNED.map((_, i) => play(DESIGNED.slice(0, i + 1)));
    expect(steps[0]!.last?.kind).toBe('n2On');
    expect(steps[1]!.last?.kind).toBe('pumped');
    expect(steps[2]!.last?.kind).toBe('purged');
    expect(steps[5]!.last?.kind).toBe('transfer');
    expect(steps[5]!.filled).toBe(true);
    const done = steps.at(-1)!;
    expect(schlenkLogic.isSolved(done)).toBe(true);
    expect(schlenkLogic.minutes(done)).toBe(CLEAN_MINUTES);
    expect(CLEAN_MINUTES).toBe(6);
    expect(done.breaches).toBe(0);
  });

  it('its own solution is the shortest way, eight moves from a cold line', () => {
    const moves = schlenkLogic.solution(start());
    expect(moves).toHaveLength(DESIGNED.length);
    expect(schlenkLogic.isSolved(play(moves))).toBe(true);
  });

  it('every rule on the card, broken, is a suck-back or a hiss: back to the start, two minutes later', () => {
    const cases: Array<[string, SchlenkMove[]]> = [
      ['suckback', [{ type: 'tap', port: 2, to: 'vac' }]],
      ['pump', [{ type: 'n2' }, { type: 'tap', port: 1, to: 'vac' }, { type: 'tap', port: 2, to: 'vac' }]],
      ['crack', [{ type: 'n2' }, { type: 'tap', port: 3, to: 'vac' }]],
      ['flaskVac', [{ type: 'n2' }, { type: 'tap', port: 4, to: 'vac' }]],
      ['flaskRoom', [{ type: 'bleed', which: 'flask' }]],
      ['air', [{ type: 'n2' }, { type: 'tap', port: 4, to: 'n2' }, { type: 'bleed', which: 'tube' }]],
      ['suckback', [{ type: 'n2' }, { type: 'tap', port: 1, to: 'vac' }, { type: 'n2' }]],
      ['drained', [...DESIGNED.slice(0, 6), { type: 'tap', port: 2, to: 'vac' }]],
    ];
    for (const [kind, moves] of cases) {
      const before = play(moves.slice(0, -1));
      const after = play(moves);
      expect(after.last, kind).toEqual({ kind, breach: true });
      expect(after.breaches, kind).toBe(before.breaches + 1);
      expect(schlenkLogic.minutes(after) - schlenkLogic.minutes(before), kind).toBe(COST.breach);
      expect({ n2: after.n2, taps: after.taps, bleed: after.bleed, filled: after.filled, purged: after.purged }, kind).toEqual({
        n2: false,
        taps: ['closed', 'closed', 'closed', 'closed'],
        bleed: { tube: false, flask: false },
        filled: false,
        purged: false,
      });
    }
  });

  it('rule 4: liquid only moves while the flask is on nitrogen and the tube is closed with its bleed open', () => {
    const purged = play(DESIGNED.slice(0, 3));
    // Tube open to nitrogen, or the flask merely closed: nothing moves.
    expect(play([{ type: 'bleed', which: 'tube' }], purged).filled).toBe(false);
    expect(play([{ type: 'tap', port: 2, to: 'closed' }, { type: 'bleed', which: 'tube' }], purged).filled).toBe(false);
    // Either order of the last two settings starts the transfer.
    expect(play([{ type: 'tap', port: 2, to: 'closed' }, { type: 'bleed', which: 'tube' }, { type: 'tap', port: 4, to: 'n2' }], purged).filled).toBe(true);
  });

  it('with the nitrogen main off, nothing pushes: no refill, no transfer, until it is back on', () => {
    // Pumped down, then port 2 closed and the main off (legal: nothing is on vacuum).
    const pumped = play([{ type: 'n2' }, { type: 'tap', port: 2, to: 'vac' }, { type: 'tap', port: 2, to: 'closed' }, { type: 'n2' }]);
    expect(pumped.pumped).toBe(true);
    const dead = play([{ type: 'tap', port: 2, to: 'n2' }], pumped);
    expect(dead.purged).toBe(false);
    const purged = play([{ type: 'n2' }], dead);
    expect(purged.last?.kind).toBe('purged');
    // Set up for the transfer with the main off: it waits for the gas.
    const ready = play([{ type: 'n2' }, { type: 'tap', port: 4, to: 'n2' }, { type: 'tap', port: 2, to: 'closed' }, { type: 'bleed', which: 'tube' }], purged);
    expect(ready.filled).toBe(false);
    const filled = play([{ type: 'n2' }], ready);
    expect(filled.last?.kind).toBe('transfer');
    expect(filled.filled).toBe(true);
  });

  it('her tube’s own tap: shut, the pump can’t reach it; opened again on vacuum, it pumps down then', () => {
    const shut = play([{ type: 'jy' }, { type: 'n2' }, { type: 'tap', port: 2, to: 'vac' }]);
    expect(shut.pumped).toBe(false);
    expect(schlenkLogic.minutes(shut)).toBe(0);
    const opened = play([{ type: 'jy' }], shut);
    expect(opened.last?.kind).toBe('pumped');
    expect(schlenkLogic.minutes(opened)).toBe(COST.pump);
  });

  it('the foil: wrapping needs a filled, sealed tube; without foil in hand, the light spoils it', () => {
    expect(play([{ type: 'wrap', foil: true }]).last?.kind).toBe('needsFill');
    const filled = play(DESIGNED.slice(0, 6));
    expect(play([{ type: 'wrap', foil: true }], filled).last?.kind).toBe('needsSeal');
    const sealed = play([{ type: 'jy' }], filled);
    const dark = play([{ type: 'wrap', foil: false }], sealed);
    expect(schlenkLogic.isFailed!(dark)).toBe(true);
    expect(schlenkLogic.isSolved(dark)).toBe(false);
    expect(dark.last?.kind).toBe('light');
    expect(play([{ type: 'wrap', foil: true }], dark)).toBe(dark);
  });

  it('from anywhere a player could leave the line, its solution still gets her tube wrapped', () => {
    const moves: SchlenkMove[] = [
      { type: 'n2' },
      ...PORTS.flatMap((port) => TAPS.map((to): SchlenkMove => ({ type: 'tap', port, to }))),
      { type: 'bleed', which: 'tube' },
      { type: 'bleed', which: 'flask' },
      { type: 'jy' },
    ];
    let seed = 7;
    const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let walk = 0; walk < 60; walk++) {
      let s = start();
      for (let i = 0; i < 12; i++) s = schlenkLogic.apply(s, moves[Math.floor(random() * moves.length)]!);
      const end = play(schlenkLogic.solution(s), s);
      expect(schlenkLogic.isSolved(end), JSON.stringify(schlenkSave(s))).toBe(true);
    }
  });

  it('a reload puts the line back exactly; junk, or a line nobody could leave, comes back as the Kraken stands', () => {
    const mid = play(DESIGNED.slice(0, 4));
    expect(schlenkLogic.init({ ...ACT3, data: roundTrip(schlenkSave(mid)) })).toEqual({ ...mid, last: null });
    expect(schlenkLogic.init({ ...ACT3, data: { taps: ['vac'], n2: 'yes', minutes: -3 } })).toEqual(start());
    const broken = schlenkLogic.init({ ...ACT3, data: { n2: false, taps: ['closed', 'vac', 'closed', 'closed'], minutes: 5, breaches: 2 } });
    expect(breach(broken)).toBeNull();
    expect(broken).toEqual({ ...start(), minutes: 5, breaches: 2 });
    const spoiled = play([{ type: 'jy' }, { type: 'wrap', foil: false }], play(DESIGNED.slice(0, 6)));
    expect(schlenkLogic.isFailed!(schlenkLogic.init({ ...ACT3, data: roundTrip(schlenkSave(spoiled)) }))).toBe(true);
  });
});

// ── P8 · The chirp ─────────────────────────────────────────────────────────

describe('the chirp', () => {
  const start = () => chirpLogic.init(ACT3);
  const play = (moves: ChirpMove[]) => run(chirpLogic.apply, start(), moves);
  const keys = (digits: string): ChirpMove[] => [...digits].map((d) => ({ type: 'digit', digit: Number(d) }));

  it('keeps the contract', () => checkPuzzleContract(chirpLogic, ACT3));

  it('plays her rhythm from the audio module’s own schedule: 2 · 4 · 1 · 3, the long pause marking the start', () => {
    expect(PATTERN).toEqual([2, 4, 1, 3]);
    expect(PIN).toBe('2413');
    expect(SCHEDULE).toEqual(chirpSchedule([2, 4, 1, 3]));
    expect(SCHEDULE.times).toHaveLength(10);
    expect(GROUP_OF).toEqual([0, 0, 1, 1, 1, 1, 2, 3, 3, 3]);
    // Inside a group the chirps are close; between groups, a pause; before it repeats, a longer one.
    const gaps = SCHEDULE.times.slice(1).map((t, i) => Number((t - SCHEDULE.times[i]!).toFixed(3)));
    expect(gaps.filter((g) => g === DEFAULT_CHIRP_TIMING.within)).toHaveLength(10 - PATTERN.length);
    expect(gaps.filter((g) => g === DEFAULT_CHIRP_TIMING.between)).toHaveLength(PATTERN.length - 1);
    const repeat = SCHEDULE.length - SCHEDULE.times.at(-1)!;
    expect(repeat).toBeCloseTo(DEFAULT_CHIRP_TIMING.cycle, 3);
    expect(repeat).toBeGreaterThan(DEFAULT_CHIRP_TIMING.between);
  });

  it('2413 arms the UPS; anything else beeps, clears and costs a minute', () => {
    expect(chirpLogic.isSolved(play([...keys('2413'), { type: 'enter' }]))).toBe(true);
    const wrong = play([...keys('1234'), { type: 'enter' }]);
    expect(wrong.entered).toBe('');
    expect(wrong.last).toEqual({ kind: 'wrong', rotated: false });
    expect(chirpLogic.minutes(wrong)).toBe(chirpLogic.minutes(start()) + 1);
    // Starting from the wrong group: the same digits, rotated, and a gentle word about the long pause.
    expect(play([...keys('4132'), { type: 'enter' }]).last).toEqual({ kind: 'wrong', rotated: true });
  });

  it('short PINs cost nothing, a fifth digit is ignored, Clear clears', () => {
    const short = play([...keys('24'), { type: 'enter' }]);
    expect(short.last).toEqual({ kind: 'short' });
    expect(chirpLogic.minutes(short)).toBe(chirpLogic.minutes(start()));
    expect(play(keys('24135')).entered).toBe('2413');
    expect(play([...keys('99'), { type: 'clear' }]).entered).toBe('');
    expect(play([{ type: 'digit', digit: 12 }])).toEqual(start());
  });

  it('a reload keeps the digits and the wrong guesses; junk comes back fresh', () => {
    const mid = play([...keys('1111'), { type: 'enter' }, ...keys('24')]);
    expect(chirpLogic.init({ ...ACT3, data: roundTrip(chirpSave(mid)) })).toEqual({ ...mid, last: null });
    expect(chirpLogic.init({ ...ACT3, data: { entered: '24x', wrong: 'many', armed: 1 } })).toEqual(start());
  });
});

// ── The spectra ────────────────────────────────────────────────────────────

describe('the spectra, drawn in code', () => {
  const FULL = { from: 10, to: 0 };
  const near = (spec: SpectrumSpec, ppm: number) => Math.max(...trace(spec, { from: ppm + 0.02, to: ppm - 0.02 }));
  const baseline = (spec: SpectrumSpec) => {
    const values = trace(spec, { from: 9.9, to: 9.0 });
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  it('the printout’s noise is Figure 3’s, point for point; every real spectrum has its own', () => {
    const printout = trace(PRINTOUT, FULL);
    expect(trace(FIGURE_3, FULL)).toEqual(printout);
    // Noise is really there, not a flat line.
    const strip = trace(PRINTOUT, { from: 10, to: 8.8 });
    expect(Math.max(...strip) - Math.min(...strip)).toBeGreaterThan(0.01);
    for (const spec of [OWN, HERS, DARK]) expect(trace(spec, FULL)).not.toEqual(printout);
    // The same seed in a different window still lands on the same points.
    expect(trace(PRINTOUT, { from: 9.5, to: 9.4 })).toEqual(printout.slice(axis(FULL).indexOf(9.5), axis(FULL).indexOf(9.4) + 1));
  });

  it('the printout has no solvent residual, no satellites, and a dead-flat baseline; yours has all the mess', () => {
    expect(near(PRINTOUT, PRODUCT_PPM)).toBeGreaterThan(0.85);
    expect(near(PRINTOUT, SOLVENT_PPM)).toBeLessThan(0.03);
    expect(near(PRINTOUT, PRODUCT_PPM - SATELLITE_OFFSET)).toBeLessThan(0.03);
    expect(near(PRINTOUT, PRODUCT_PPM + SATELLITE_OFFSET)).toBeLessThan(0.03);
    expect(PRINTOUT.roll).toBe(0);
    expect(near(OWN, SOLVENT_PPM)).toBeGreaterThan(0.5);
    expect(near(OWN, PRODUCT_PPM)).toBeLessThan(0.06);
    expect(OWN.roll).toBeGreaterThan(0);
  });

  it('her reference and her tube in the dark both show the real 8.41, with a satellite either side', () => {
    for (const [spec, shift] of [[HERS, 0], [DARK, DARK_SHIFT]] as const) {
      const at = (ppm: number) => near(spec, ppm + shift);
      expect(at(SOLVENT_PPM)).toBeGreaterThan(0.5);
      expect(at(PRODUCT_PPM)).toBeGreaterThan(0.1);
      expect(at(PRODUCT_PPM - SATELLITE_OFFSET) - baseline(spec)).toBeGreaterThan(0.015);
      expect(at(PRODUCT_PPM + SATELLITE_OFFSET) - baseline(spec)).toBeGreaterThan(0.015);
    }
    // The dark run also has the bare impurity at 8.19, and is 0.23 ppm low until referenced.
    expect(near(DARK, DECOY_PPM + DARK_SHIFT)).toBeGreaterThan(0.12);
    expect(near(DARK, SOLVENT_PPM)).toBeLessThan(0.05);
    expect(Math.max(...trace(DARK, { from: 7.18, to: 7.14 }, -DARK_SHIFT))).toBeGreaterThan(0.5);
  });

  it('is deterministic: the same spectrum twice is the same numbers', () => {
    expect(trace(DARK, FULL, 0.1)).toEqual(trace(DARK, FULL, 0.1));
  });
});

// ── P9 · The too-perfect spectrum ──────────────────────────────────────────

describe('the too-perfect spectrum', () => {
  const start = () => fabricationLogic.init(ACT3);
  const play = (moves: FabricationMove[]) => run(fabricationLogic.apply, start(), moves);
  const mark = (...features: Array<(typeof TELLS)[number] | (typeof DECOYS)[number]>): FabricationMove[] => features.map((feature) => ({ type: 'mark', feature }));

  it('keeps the contract', () => checkPuzzleContract(fabricationLogic, ACT3));

  it('the noise only gives itself away with the printout laid over Figure 3', () => {
    expect(play(mark('noise')).last).toEqual({ kind: 'overlayFirst' });
    expect(play(mark('noise')).marked).toEqual([]);
    expect(play([{ type: 'overlay' }, ...mark('noise')]).marked).toEqual(['noise']);
  });

  it('solved by the noise match and any two others, never without the noise', () => {
    expect(fabricationLogic.isSolved(play(mark('solvent', 'satellites', 'integral', 'acquired')))).toBe(false);
    expect(fabricationLogic.isSolved(play([{ type: 'overlay' }, ...mark('noise', 'acquired')]))).toBe(false);
    for (const [a, b] of [['solvent', 'satellites'], ['integral', 'acquired'], ['satellites', 'acquired']] as const) {
      expect(fabricationLogic.isSolved(play([{ type: 'overlay' }, ...mark('noise', a, b)])), `${a} + ${b}`).toBe(true);
    }
  });

  it('innocent things are noted, never marked, and cost nothing; a second tap rubs a circle out', () => {
    const coffee = play(mark('coffee', 'peak'));
    expect(coffee.marked).toEqual([]);
    expect(coffee.noted).toBe(2);
    expect(coffee.last).toEqual({ kind: 'decoy', feature: 'peak' });
    expect(fabricationLogic.minutes(coffee)).toBe(fabricationLogic.minutes(start()));
    expect(play(mark('solvent', 'solvent')).marked).toEqual([]);
  });

  it('a reload keeps the overlay and the circles; junk comes back fresh', () => {
    const mid = play([{ type: 'overlay' }, ...mark('noise', 'coffee')]);
    expect(fabricationLogic.init({ ...ACT3, data: roundTrip(fabricationSave(mid)) })).toEqual({ ...mid, last: null });
    expect(fabricationLogic.init({ ...ACT3, data: { overlay: 'yes', marked: ['noise', 'coffee', 5], noted: -2 } })).toEqual({ ...start(), marked: ['noise'] });
  });
});

// ── P10 · Peak match in the dark ───────────────────────────────────────────

describe('the peak match in the dark', () => {
  const DARK_RUN = { minute: 46, act: 3 as const };
  const start = () => peakmatchLogic.init(DARK_RUN);
  const play = (moves: PeakMove[]) => run(peakmatchLogic.apply, start(), moves);
  const nudge = (by: number): PeakMove => ({ type: 'nudge', by });

  it('keeps the contract', () => checkPuzzleContract(peakmatchLogic, DARK_RUN));

  it('everything sits 0.23 ppm low until the solvent is put at 7.16', () => {
    expect(ANSWER_OFFSET).toBe(23);
    expect([shown('solvent', 0), shown('product', 0), shown('decoy', 0), shown('bump', 0)]).toEqual([6.93, 8.18, 7.96, 6.67]);
    expect([shown('solvent', 23), shown('product', 23), shown('decoy', 23)]).toEqual([7.16, 8.41, 8.19]);
    expect(PEAKS.map((p) => p.id)).toEqual(['product', 'decoy', 'solvent', 'bump']);
  });

  it('referenced, only her peak is hers; unreferenced, the axis can’t be trusted, even where a peak reads 8.41', () => {
    const ref = [nudge(10), nudge(10), nudge(3)];
    expect(play([...ref, { type: 'pick', peak: 'decoy' }]).last).toEqual({ kind: 'decoy' });
    expect(play([...ref, { type: 'pick', peak: 'solvent' }]).last).toEqual({ kind: 'solvent' });
    expect(play([...ref, { type: 'pick', peak: 'bump' }]).last).toEqual({ kind: 'bump' });
    expect(peakmatchLogic.isSolved(play([...ref, { type: 'pick', peak: 'product' }]))).toBe(true);
    // Slid until the decoy reads 8.41: still wrong, the solvent isn't at 7.16.
    expect(shown('decoy', 45)).toBe(8.41);
    expect(play([nudge(45), { type: 'pick', peak: 'decoy' }]).last).toEqual({ kind: 'axis', peak: 'decoy' });
    expect(play([{ type: 'pick', peak: 'product' }]).last).toEqual({ kind: 'axis', peak: 'product' });
  });

  it('costs no minutes at all: the clock has stopped', () => {
    const tried = play([{ type: 'pick', peak: 'decoy' }, nudge(-40), { type: 'pick', peak: 'bump' }]);
    expect(tried.wrong).toBe(2);
    expect(peakmatchLogic.minutes(tried)).toBe(0);
  });

  it('the axis stops at ±1.00 ppm, and the solution finds +0.23 from anywhere', () => {
    expect(play([nudge(500)]).offset).toBe(100);
    for (const from of [-100, -7, 0, 23, 61, 100]) {
      const s = peakmatchLogic.init({ ...DARK_RUN, data: { offset: from } });
      expect(peakmatchLogic.isSolved(run(peakmatchLogic.apply, s, peakmatchLogic.solution(s))), String(from)).toBe(true);
    }
  });

  it('a reload keeps the referencing; junk comes back fresh', () => {
    const mid = play([nudge(10), { type: 'pick', peak: 'decoy' }]);
    expect(peakmatchLogic.init({ ...DARK_RUN, data: roundTrip(peakSave(mid)) })).toEqual({ ...mid, last: null });
    expect(peakmatchLogic.init({ ...DARK_RUN, data: { offset: 'up', found: 1, wrong: -1 } })).toEqual(start());
    expect(peakmatchLogic.init({ ...DARK_RUN, data: { offset: 23.4 } }).offset).toBe(23);
  });
});

// ── In the building ────────────────────────────────────────────────────────

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
const ids = (g: Game) => g.choices().map((c) => c.id);
const known = (g: Game) => g.state.known.map((k) => k.id);
function waitUntil(g: Game, minute: number): void {
  while (g.state.minute < minute && !g.busy) {
    const gap = minute - g.state.minute;
    g.choose('meta:wait');
    g.choose(`wait:${gap >= 10 ? 10 : gap >= 5 ? 5 : 1}`);
  }
}
function goTo(g: Game, to: LocationId): void {
  g.choose('meta:travel');
  g.choose(`go:${to}`);
}
function endLoop(g: Game): void {
  if (!g.scene.hub) g.choose('meta:back');
  waitUntil(g, 46);
  drainCards(g);
}
/** A night in Act III (set directly: the act's opening is content-act3's business). */
function actThree(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  g.state.act = 3;
  return g;
}
function solveOpen(g: Game): void {
  const logic = PUZZLE_LOGIC[g.state.puzzle!]!;
  let s = logic.init({ minute: g.state.minute, act: g.state.act });
  for (const m of logic.solution(s)) s = logic.apply(s, m);
  expect(logic.isSolved(s)).toBe(true);
  g.completePuzzle({ solved: true, minutes: logic.minutes(s) });
}

describe('Act III puzzles in the building', () => {
  it('the Kraken opens only in Act III, with her tube in hand; filled, the tube goes dark', () => {
    const early = new Game(CONTENT);
    drainCards(early);
    early.state.inventory.push('item.tube.jy');
    goTo(early, 'synth');
    expect(ids(early)).not.toContain('synth.kraken.fill');

    const g = actThree();
    goTo(g, 'synth');
    expect(ids(g)).not.toContain('synth.kraken.fill');
    g.state.inventory.push('item.tube.jy', 'item.foil');
    expect(ids(g)).toContain('synth.kraken.fill');
    g.choose('synth.kraken.fill');
    expect(g.state.puzzle).toBe('schlenk');
    solveOpen(g);
    expect(g.state.inventory).toEqual(['item.foil', 'item.tube.dark']);
    expect(known(g)).toContain('nb.schlenk');
    expect(ids(g)).not.toContain('synth.kraken.fill');
  });

  it('a spoiled attempt takes her tube for the night: the antechamber has no other', () => {
    const g = actThree();
    g.state.solved.push('glovebox');
    goTo(g, 'glovebox');
    g.choose('glovebox.mini.open');
    expect(g.state.inventory).toEqual(['item.tube.jy']);
    goTo(g, 'synth');
    g.choose('synth.kraken.fill');
    g.completePuzzle({ solved: false, failed: true, minutes: 6 });
    expect(g.state.inventory).toEqual([]);
    expect(g.state.lflags).toContain('tube.spoiled');
    expect(g.state.display.map((p) => p.key)).toContain('puzzle.schlenk.failed');
    goTo(g, 'glovebox');
    expect(ids(g)).not.toContain('glovebox.mini.open');
    // The next night it is back where she left it.
    endLoop(g);
    goTo(g, 'glovebox');
    expect(ids(g)).toContain('glovebox.mini.open');
  });

  it('a filled tube isn’t swapped for a fresh one either', () => {
    const g = actThree();
    g.state.solved.push('glovebox', 'schlenk');
    g.state.inventory.push('item.foil');
    goTo(g, 'glovebox');
    g.choose('glovebox.mini.open');
    goTo(g, 'synth');
    g.choose('synth.kraken.again');
    expect(g.state.inventory).toEqual(['item.foil', 'item.tube.dark']);
    goTo(g, 'glovebox');
    expect(ids(g)).not.toContain('glovebox.mini.open');
  });

  it('later nights: the way you did before, six minutes; with foil it goes dark, without it the light wins', () => {
    for (const foil of [true, false]) {
      const g = actThree();
      g.state.solved.push('schlenk');
      g.state.inventory.push('item.tube.jy', ...(foil ? ['item.foil'] : []));
      goTo(g, 'synth');
      expect(ids(g)).not.toContain('synth.kraken.fill');
      const id = foil ? 'synth.kraken.again' : 'synth.kraken.again.light';
      expect(ids(g)).toContain(id);
      const before = g.state.minute;
      g.choose(id);
      expect(g.state.minute - before).toBe(CLEAN_MINUTES);
      expect(g.state.inventory.includes('item.tube.dark'), String(foil)).toBe(foil);
      expect(g.state.inventory).not.toContain('item.tube.jy');
      expect(g.state.lflags.includes('tube.spoiled'), String(foil)).toBe(!foil);
    }
  });

  it('the UPS keypad waits for Tom’s Post-it; solved, it arms the UPS tonight and keys in again on later nights', () => {
    const g = actThree();
    goTo(g, 'nmr');
    expect(ids(g)).not.toContain('nmr.ups');
    g.choose('nmr.postit');
    expect(ids(g)).toContain('nmr.ups');
    g.choose('nmr.ups');
    expect(g.state.puzzle).toBe('chirp');
    solveOpen(g);
    expect(known(g)).toContain('nb.ups');
    expect(g.state.lflags).toContain('ups.armed');
    expect(ids(g)).not.toContain('nmr.ups');
    expect(ids(g)).not.toContain('nmr.ups.again');
    endLoop(g);
    goTo(g, 'nmr');
    expect(g.state.lflags).not.toContain('ups.armed');
    g.choose('nmr.ups.again');
    expect(g.state.lflags).toContain('ups.armed');
    expect(ids(g)).not.toContain('nmr.ups.again');
  });

  it('the comparison needs the printout, in Act III; solved, Figure 3 is the night’s', () => {
    const g = actThree();
    expect(ids(g)).not.toContain('office.compare');
    g.state.inventory.push('item.printout');
    expect(ids(g)).toContain('office.compare');
    g.choose('office.compare');
    expect(g.state.puzzle).toBe('fabrication');
    solveOpen(g);
    expect(known(g)).toContain('nb.fabrication');
    expect(ids(g)).not.toContain('office.compare');
  });

  it('no room opens the peak match: only the dark run at 03:33 does, and solving it writes 8.41 down and is Dark Reaction', () => {
    const opens = (effects: readonly object[] = []) => effects.some((e) => 'puzzle' in e && e.puzzle === 'peakmatch');
    // The other three do open from choices, so the search itself is sound.
    for (const id of ['schlenk', 'chirp', 'fabrication']) {
      expect(CONTENT.scenes.flatMap((s) => s.choices).some((c) => (c.effects ?? []).some((e) => 'puzzle' in e && e.puzzle === id)), id).toBe(true);
    }
    expect(CONTENT.scenes.flatMap((s) => s.choices).filter((c) => opens(c.effects))).toEqual([]);
    expect(CONTENT.lightsOut.filter((r) => r.puzzle === 'peakmatch' || opens(r.effects)).map((r) => r.id)).toEqual(['lo.dark.run']);
    expect(CONTENT.puzzles.find((p) => p.id === 'peakmatch')!.onSolve).toEqual([{ learn: 'nb.peak' }, { ending: 'dark' }]);
  });

  it('each puzzle has three hints, its design par and a margin note', () => {
    const par: Record<string, number> = { schlenk: 3, chirp: 2.5, fabrication: 3, peakmatch: 2 };
    for (const [id, p] of Object.entries(par)) {
      const def = CONTENT.puzzles.find((x) => x.id === id)!;
      expect(def.hints).toEqual([`puzzle.${id}.h1`, `puzzle.${id}.h2`, `puzzle.${id}.h3`]);
      expect(def.par).toBe(p);
      expect(def.margin).toBe(`puzzle.${id}.margin`);
    }
  });
});

describe('the keys the Act III views build at run time exist in both languages', () => {
  const keys = [
    ...['n2On', 'n2Off', 'tap', 'bleedOpen', 'bleedShut', 'jyOpen', 'jyShut', 'pumped', 'purged', 'transfer', 'needsFill', 'needsSeal', 'wrapped', 'light'].map((k) => `puzzle.schlenk.ev.${k}`),
    ...['suckback', 'pump', 'crack', 'flaskVac', 'flaskRoom', 'air', 'drained'].map((k) => `puzzle.schlenk.ev.${k}`),
    ...['air', 'vacuum', 'nitrogen', 'filled', 'sealed', 'wrapped', 'spoiled'].map((k) => `puzzle.schlenk.tube.${k}`),
    ...[1, 2, 3, 4].map((n) => `puzzle.schlenk.port.${n}`),
    ...[1, 2, 3, 4].map((n) => `puzzle.schlenk.card.${n}`),
    ...TAPS.map((t) => `puzzle.schlenk.tap.${t}`),
    // Picked by a condition, so the validator's search for t('…') doesn't see them.
    ...['n2.on', 'n2.off', 'bubbler.on', 'bubbler.off', 'bleed.open', 'bleed.shut', 'jy.open', 'jy.shut', 'done', 'giveup'].map((k) => `puzzle.schlenk.${k}`),
    ...[1, 2, 3, 4].map((n) => `puzzle.chirp.sr.${n}`),
    ...['short', 'wrong', 'armed', 'rotated', 'listen', 'listening', 'display.hold', 'display.armed'].map((k) => `puzzle.chirp.${k}`),
    ...['clear', 'enter'].map((k) => `puzzle.chirp.key.${k}`),
    ...[...TELLS, ...DECOYS].map((f) => `puzzle.fabrication.mark.${f}`),
    ...TELLS.map((f) => `puzzle.fabrication.why.${f}`),
    ...DECOYS.map((f) => `puzzle.fabrication.decoy.${f}`),
    ...['overlay.on', 'overlay.off', 'describe.figure', 'describe.overlay', 'mark.baseline'].map((k) => `puzzle.fabrication.${k}`),
    ...['axisWrong', 'solvent', 'decoy', 'bump', 'found'].map((k) => `puzzle.peakmatch.${k}`),
    ...['schlenk', 'ups', 'fabrication', 'peak'].flatMap((n) => [`nb.${n}.title`, `nb.${n}.body`]),
    'item.tube.dark',
  ];
  it.each(keys)('%s', (key) => {
    expect(TABLES.en[key], 'en').toBeTruthy();
    expect(TABLES['zh-Hant-TW'][key], 'zh-Hant-TW').toBeTruthy();
  });
});
