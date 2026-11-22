/**
 * Act II's puzzles: the door-access log, the notebook cipher and the −80 °C
 * freezer box. Their pure logic, the answers derived from the content and
 * the data, saved progress, and the choices that open them in the real
 * content, driven through the engine.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { EXIT_B_OPEN, PI_OPEN } from '../src/content/world.ts';
import { LOOP_LENGTH, minuteOf } from '../src/engine/clock.ts';
import { Game } from '../src/engine/engine.ts';
import type { Card, LocationId } from '../src/engine/types.ts';
import { TABLES } from '../src/i18n/i18n.ts';
import {
  cipherLogic,
  cipherSave,
  ELEMENTS,
  EN_GROUPS,
  EN_LINE,
  position,
  RADICAL_GLYPH,
  RADICALS,
  symbolOf,
  ZH_GROUPS,
  ZH_LINE,
  type CipherMove,
  type CipherState,
} from '../src/puzzles/cipher/logic.ts';
import {
  ANSWER as DOOR_ANSWER,
  ARCHIVE,
  clock,
  DAYS,
  DOORS,
  doorlogLogic,
  doorlogSave,
  FIRST_ENTRY,
  LOG,
  LOOP_ZERO,
  MONDAY_SHIFT,
  NIGHTS,
  visibleArchive,
  visibleLog,
  type DoorlogMove,
  type DoorlogState,
} from '../src/puzzles/doorlog/logic.ts';
import {
  ALARM_TEMP,
  ANSWER,
  capAt,
  CELLS,
  contents,
  freezerLogic,
  freezerSave,
  labelCode,
  START_TEMP,
  temperature,
  type FreezerMove,
  type FreezerState,
} from '../src/puzzles/freezer/logic.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import { step } from '../src/puzzles/roving.ts';
import { checkPuzzleContract } from './helpers/puzzle-contract.ts';

const run = <S, M>(apply: (s: S, m: M) => S, s: S, moves: M[]) => moves.reduce(apply, s);
const roundTrip = (data: unknown) => JSON.parse(JSON.stringify(data)) as unknown;

// ── P4 · −80 °C freezer box ────────────────────────────────────────────────

describe('freezer box', () => {
  const start = () => freezerLogic.init({ minute: 34, act: 2 });
  const lift = (...cells: string[]): FreezerMove[] => cells.flatMap((cell): FreezerMove[] => [{ type: 'select', cell }, { type: 'lift' }]);
  const play = (moves: FreezerMove[], s: FreezerState = start()) => run(freezerLogic.apply, s, moves);

  it('keeps the contract', () => checkPuzzleContract(freezerLogic, { minute: 34, act: 2 }));

  it('is laid out as the design says: eight red caps, four black, the rest white or empty', () => {
    const byCap = (cap: string) => CELLS.filter((c) => capAt(c) === cap);
    expect(byCap('red')).toEqual(['A5', 'B8', 'C3', 'D6', 'E5', 'F4', 'G3', 'I1']);
    expect(byCap('black')).toEqual(['C8', 'D7', 'G2', 'G4']);
    expect(CELLS).toHaveLength(81);
    expect(CELLS.every((c) => [null, 'red', 'black', 'white'].includes(capAt(c)))).toBe(true);
  });

  it('her four lid notes, applied to every cell of the box, leave exactly one: E5', () => {
    // Worked out here from the lid text alone, independently of the puzzle's own rule.
    const rows = 'ABCDEFGHI';
    const cell = (r: number, c: number) => `${rows[r]}${c}`;
    const fits: string[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 1; c <= 9; c++) {
        const here = cell(r, c);
        const edge = r === 0 || r === 8 || c === 1 || c === 9; // 1. nothing of mine on the edge
        const red = capAt(here) === 'red'; // 2. the card's under a red cap
        let touchesBlack = false; // 3. never next to a black cap, corners included
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && capAt(cell(r + dr, c + dc)) === 'black') touchesBlack = true;
        const ten = r + 1 + c === 10; // 4. row and column add up to ten (A = 1)
        if (!edge && red && !touchesBlack && ten) fits.push(here);
      }
    }
    expect(fits).toEqual(['E5']);
    expect(ANSWER).toBe('E5');
  });

  it('every other red cap breaks a note: the decoys that add up to ten all touch a black cap or the edge', () => {
    // B8 (C8 below), D6 (D7 beside), F4 (G4 below), G3 (G2 and G4 either side), I1 (the edge); A5 and C3 don't add up.
    for (const decoy of ['B8', 'D6', 'F4', 'G3', 'I1']) {
      const r = 'ABCDEFGHI'.indexOf(decoy[0]!) + 1;
      expect(r + Number(decoy[1]), decoy).toBe(10);
    }
    expect(contents('I1')).toBe('tom');
    expect(contents('A5')).toBe('tom');
    expect(contents('C3')).toBe('ref');
    expect(contents('D7')).toBe('sample');
    expect(contents('E5')).toBe('card');
    expect(contents('B2')).toBeNull();
    // Her labels: samples numbered, stocks dated, references counted.
    expect(labelCode('D7')).toMatch(/^CuD-\d+$/);
    expect(labelCode('C3')).toMatch(/^REF-\d$/);
    expect(labelCode('E4')).toMatch(/^\d{4}-\d$/);
  });

  it('each lift costs a minute and a degree; E5 finds the card', () => {
    const s = play(lift('C3', 'E5'));
    expect(freezerLogic.minutes(s)).toBe(2);
    expect(temperature(s)).toBe(START_TEMP + 2);
    expect(freezerLogic.isSolved(s)).toBe(true);
    expect(s.last).toEqual({ kind: 'lifted', cell: 'E5' });
  });

  it('the sixth wrong tube sets off the alarm at −74 °C and the attempt is over', () => {
    const wrong = ['C3', 'D6', 'B8', 'F4', 'G3'];
    const five = play(lift(...wrong));
    expect(temperature(five)).toBe(-75);
    expect(freezerLogic.isFailed!(five)).toBe(false);
    const six = play(lift('H2'), five);
    expect(temperature(six)).toBe(ALARM_TEMP);
    expect(freezerLogic.isFailed!(six)).toBe(true);
    expect(freezerLogic.isSolved(six)).toBe(false);
    // Nothing more happens once the alarm has gone.
    expect(play(lift('E5'), six)).toBe(six);
    expect(freezerLogic.minutes(six)).toBe(6);
  });

  it('finding the card on the lift that would reach −74 °C still counts', () => {
    const s = play(lift('C3', 'D6', 'B8', 'F4', 'G3', 'E5'));
    expect(temperature(s)).toBe(ALARM_TEMP);
    expect(freezerLogic.isSolved(s)).toBe(true);
    expect(freezerLogic.isFailed!(s)).toBe(false);
  });

  it('choosing is free; an empty slot or a tube already lifted costs nothing', () => {
    const s = play([{ type: 'select', cell: 'B2' }, { type: 'lift' }]);
    expect(s.last).toEqual({ kind: 'empty', cell: 'B2' });
    expect(freezerLogic.minutes(s)).toBe(0);
    const again = play(lift('C3', 'C3'));
    expect(again.last).toEqual({ kind: 'again', cell: 'C3' });
    expect(freezerLogic.minutes(again)).toBe(1);
    expect(play([{ type: 'lift' }]).last).toEqual({ kind: 'none' });
    expect(play([{ type: 'select', cell: 'J1' }])).toEqual(start());
  });

  it('a reload puts the box back; junk comes back as a fresh box', () => {
    const mid = play(lift('C3', 'D7').concat({ type: 'select', cell: 'E4' }));
    const back = freezerLogic.init({ minute: 34, act: 2, data: roundTrip(freezerSave(mid)) });
    expect(back).toEqual({ ...mid, last: null });
    expect(freezerLogic.minutes(back)).toBe(2);
    expect(freezerLogic.init({ minute: 34, act: 2, data: { lifted: 'E5', selected: 42 } })).toEqual(start());
    // Duplicates, empty slots and non-cells are dropped; a replay stops where the attempt ended.
    const junk = freezerLogic.init({ minute: 34, act: 2, data: { lifted: ['C3', 'C3', 'B2', 'Z9', 7, 'E5', 'D7'], selected: 'E5' } });
    expect(junk.lifted).toEqual(['C3', 'E5']);
    expect(freezerLogic.isSolved(junk)).toBe(true);
    const alarm = freezerLogic.init({ minute: 34, act: 2, data: { lifted: ['C3', 'D6', 'B8', 'F4', 'G3', 'H2', 'H4', 'E5'] } });
    expect(alarm.lifted).toHaveLength(6);
    expect(freezerLogic.isFailed!(alarm)).toBe(true);
  });
});

// ── P6 · Door-access log ───────────────────────────────────────────────────

describe('door-access log', () => {
  const start = () => doorlogLogic.init({ minute: 2, act: 2 });
  const play = (moves: DoorlogMove[], s: DoorlogState = start()) => run(doorlogLogic.apply, s, moves);
  const loop = (time: number) => time - LOOP_ZERO;

  it('keeps the contract', () => checkPuzzleContract(doorlogLogic, { minute: 2, act: 2 }));

  it('tonight’s answer is the building’s own timetable (src/content/world.ts)', () => {
    expect(DOOR_ANSWER).toEqual({ pi: PI_OPEN.from, exit: EXIT_B_OPEN.from });
    expect(DOOR_ANSWER).toEqual({ pi: minuteOf('03:15'), exit: minuteOf('03:21') });
  });

  it('the log itself gives the answer: the porter’s Monday runs three minutes late, and only Mondays open fire exit B', () => {
    const heldOpen = (night: number) => LOG.filter((e) => e.night === night && e.door === 'pi' && e.event === 'held').map((e) => loop(e.time));
    const locked = (night: number, door: string) => LOG.filter((e) => e.night === night && e.door === door && e.event === 'locked').map((e) => loop(e.time));
    const ordinary = [1, 2, 3, 4, 5, 6].map((n) => heldOpen(n));
    // Tuesday to Sunday: the same minute every night.
    expect(new Set(ordinary.flat()).size).toBe(1);
    const usual = ordinary[0]![0]!;
    expect(clock(LOOP_ZERO + usual)).toBe('03:12');
    // Monday 16th: three minutes late.
    const monday = heldOpen(0)[0]!;
    expect(monday - usual).toBe(MONDAY_SHIFT);
    // Fire exit B is released on Mondays only, for the bins.
    const releases = LOG.filter((e) => e.door === 'exitB' && e.event === 'released');
    expect(releases.map((e) => e.night)).toEqual([0]);
    // Tonight is Monday 23rd: the windows open when last Monday's did.
    expect({ pi: monday, exit: loop(releases[0]!.time) }).toEqual(DOOR_ANSWER);
    // Both windows last three minutes, as Dan's office does tonight.
    expect(locked(0, 'pi')[0]! - monday).toBe(PI_OPEN.to - PI_OPEN.from);
    expect(locked(0, 'exitB')[0]! - DOOR_ANSWER.exit).toBe(EXIT_B_OPEN.to - EXIT_B_OPEN.from);
    // The rest of his round shifts with it.
    const stairs = (night: number) => LOG.filter((e) => e.night === night && e.badge === 'femi' && e.door === 'stair').map((e) => loop(e.time));
    expect(stairs(0).map((m, i) => m - stairs(1)[i]!)).toEqual([MONDAY_SHIFT, MONDAY_SHIFT]);
  });

  it('seven nights, Monday 16 to Sunday 22 November; every entry between 02:40 and 03:40', () => {
    expect(NIGHTS).toEqual([16, 17, 18, 19, 20, 21, 22]);
    expect(new Date(Date.UTC(2026, 10, NIGHTS[0])).getUTCDay()).toBe(1);
    expect(DAYS[0]).toBe('mon');
    for (const e of LOG) {
      expect(e.time).toBeGreaterThanOrEqual(2 * 60 + 40);
      expect(e.time).toBeLessThanOrEqual(3 * 60 + 40);
    }
  });

  it('Y.C.’s badge: refused at 02:47, into Lab 4.12 at 03:33, every night; never an exit, back to 14/03/2019', () => {
    for (let n = 0; n < NIGHTS.length; n++) {
      const hers = LOG.filter((e) => e.night === n && e.badge === 'lin').map((e) => [clock(e.time), e.door, e.event]);
      expect(hers).toEqual([
        ['02:47', 'main', 'denied'],
        ['03:33', 'lab', 'granted'],
      ]);
    }
    const archived = ARCHIVE.filter((r) => !('gap' in r));
    expect(archived.every((r) => !('gap' in r) && r.badge === 'lin')).toBe(true);
    expect([...LOG, ...archived].some((r) => 'event' in r && r.badge === 'lin' && r.event === 'exit')).toBe(false);
    expect(ARCHIVE[0]).toEqual(FIRST_ENTRY);
    expect(FIRST_ENTRY).toMatchObject({ date: { y: 2019, m: 3, d: 14 }, door: 'lab', event: 'granted' });
    expect(clock(FIRST_ENTRY.time)).toBe('03:33');
    // The gap and the rows around it account for every night from 14/03/2019 to 15/11/2026.
    const gap = ARCHIVE.find((r): r is { gap: number } => 'gap' in r)!.gap;
    const nights = (Date.UTC(2026, 10, 15) - Date.UTC(2019, 2, 14)) / 86_400_000 + 1;
    expect(gap + 3).toBe(nights);
  });

  it('Tom’s badge only on Wednesday, Ian’s only on Thursday', () => {
    expect([...new Set(LOG.filter((e) => e.badge === 'tom').map((e) => e.night))]).toEqual([2]);
    expect([...new Set(LOG.filter((e) => e.badge === 'ian').map((e) => e.night))]).toEqual([3]);
  });

  it('filters by night and by door; older entries follow the door filter', () => {
    const mon4 = visibleLog({ night: 0, door: 'pi' }).map((e) => `${clock(e.time)} ${e.event}`);
    expect(mon4).toEqual(['03:15 held', '03:18 locked']);
    expect(visibleLog({ night: 'all', door: 'exitB' })).toHaveLength(2);
    expect(visibleLog({ night: 'all', door: 'all' })).toHaveLength(LOG.length);
    expect(visibleArchive({ older: false, door: 'all' })).toEqual([]);
    expect(visibleArchive({ older: true, door: 'all' })).toEqual(ARCHIVE);
    expect(visibleArchive({ older: true, door: 'main' }).filter((r) => !('gap' in r))).toHaveLength(2);
    expect(visibleArchive({ older: true, door: 'exitB' })).toEqual([]);
    const s = play([{ type: 'night', night: 3 }, { type: 'door', door: 'main' }, { type: 'older' }, { type: 'night', night: 9 }, { type: 'door', door: 'roof' as never }]);
    expect([s.night, s.door, s.older]).toEqual([3, 'main', true]);
    expect(DOORS).toEqual(['main', 'exitB', 'pi', 'lab', 'stair']);
  });

  it('a wrong write-up costs a minute and says which window is off, without giving the answer', () => {
    expect(doorlogLogic.minutes(start())).toBe(2);
    const unmarked = play([{ type: 'mark', row: 'pi', start: 28 }, { type: 'write' }]);
    expect(unmarked.last).toEqual({ kind: 'unmarked', rows: ['exit'] });
    expect(doorlogLogic.minutes(unmarked)).toBe(2);
    // The usual night's time for 4.01: wrong, and the feedback says so.
    const usual = play([{ type: 'mark', row: 'pi', start: 25 }, { type: 'mark', row: 'exit', start: 34 }, { type: 'write' }]);
    expect(usual.last).toEqual({ kind: 'wrong', rows: ['pi'], usual: true });
    expect(doorlogLogic.minutes(usual)).toBe(3);
    const exitOff = play([{ type: 'mark', row: 'pi', start: 28 }, { type: 'mark', row: 'exit', start: 31 }, { type: 'write' }]);
    expect(exitOff.last).toEqual({ kind: 'wrong', rows: ['exit'], usual: false });
    const both = play([{ type: 'mark', row: 'pi', start: 0 }, { type: 'mark', row: 'exit', start: 99 }, { type: 'write' }]);
    expect(both.marks.exit).toBe(LOOP_LENGTH - 3);
    expect(both.last).toEqual({ kind: 'wrong', rows: ['pi', 'exit'], usual: false });
    const right = play([{ type: 'mark', row: 'exit', start: 34 }, { type: 'write' }], play([{ type: 'mark', row: 'pi', start: 28 }], usual));
    expect(doorlogLogic.isSolved(right)).toBe(true);
    expect(doorlogLogic.minutes(right)).toBe(3);
  });

  it('a reload keeps the filters, the marks and the minutes; junk comes back fresh', () => {
    const mid = play([{ type: 'night', night: 0 }, { type: 'older' }, { type: 'mark', row: 'pi', start: 25 }, { type: 'mark', row: 'exit', start: 34 }, { type: 'write' }]);
    const back = doorlogLogic.init({ minute: 2, act: 2, data: roundTrip(doorlogSave(mid)) });
    expect(back).toEqual({ ...mid, last: null });
    expect(doorlogLogic.minutes(back)).toBe(3);
    const junk = doorlogLogic.init({ minute: 2, act: 2, data: { night: 'Mon', door: 'roof', older: 1, marks: { pi: 'three', exit: -9 }, wrong: Infinity } });
    expect(junk).toEqual({ ...start(), marks: { pi: null, exit: 0 } });
    expect(doorlogLogic.init({ minute: 2, act: 2, data: 'nonsense' })).toEqual(start());
    expect(doorlogLogic.init({ minute: 2, act: 2, data: { marks: { pi: 28.4, exit: 200 } } }).marks).toEqual({ pi: 28, exit: LOOP_LENGTH - 3 });
  });
});

// ── P7 · Notebook cipher ───────────────────────────────────────────────────

describe('notebook cipher', () => {
  const start = () => cipherLogic.init({ minute: 29, act: 2 });
  const play = (moves: CipherMove[], s: CipherState = start()) => run(cipherLogic.apply, s, moves);
  const en = (z: number): CipherMove => ({ v: 'en', type: 'pick', z });
  const zh = (radical: (typeof RADICALS)[number]): CipherMove => ({ v: 'zh', type: 'strip', radical });

  it('keeps the contract', () => checkPuzzleContract(cipherLogic, { minute: 29, act: 2 }));

  it('the English reads RAW IN RACK ONE: atomic numbers to symbols to letters', () => {
    expect(EN_LINE.join(' ')).toBe('88 74 49 88 6 19 8 10');
    let at = 0;
    const words = EN_GROUPS.map((n) => EN_LINE.slice(at, (at += n)).map(symbolOf));
    expect(words.map((w) => w.join(' '))).toEqual(['Ra W', 'In', 'Ra C K', 'O Ne']);
    expect(words.map((w) => w.join('').toUpperCase()).join(' ')).toBe('RAW IN RACK ONE');
  });

  it('the 繁中 reads 它 · 冬內 · 甲: four element names, each losing its radical', () => {
    expect(ZH_LINE.map((c) => c.char).join('')).toBe('鉈氡鈉鉀');
    expect(ZH_LINE.map((c) => c.rest).join('')).toBe('它冬內甲');
    expect(ZH_GROUPS).toEqual([1, 2, 1]);
    // Thallium, sodium and potassium are metals (金); radon is a gas (气).
    expect(ZH_LINE.map((c) => RADICAL_GLYPH[c.radical]).join('')).toBe('金气金金');
    expect(RADICALS.map((r) => RADICAL_GLYPH[r]).join('')).toBe('金石气氵');
  });

  it('the table has all 118 elements in the real layout, each in its own place', () => {
    expect(ELEMENTS).toHaveLength(118);
    const places = ELEMENTS.map((_, i) => position(i + 1));
    expect(new Set(places.map((p) => `${p.row},${p.col}`)).size).toBe(118);
    const at = (z: number) => position(z);
    expect([at(1), at(2), at(10), at(19), at(49), at(74), at(88), at(57), at(71), at(103), at(118)]).toEqual([
      { row: 1, col: 1 },
      { row: 1, col: 18 },
      { row: 2, col: 18 },
      { row: 4, col: 1 },
      { row: 5, col: 13 },
      { row: 6, col: 6 },
      { row: 7, col: 2 },
      { row: 9, col: 3 },
      { row: 9, col: 17 },
      { row: 10, col: 17 },
      { row: 7, col: 18 },
    ]);
    expect([symbolOf(6), symbolOf(8), symbolOf(19), symbolOf(79), symbolOf(101)]).toEqual(['C', 'O', 'K', 'Au', 'Md']);
  });

  it('an element that doesn’t fit is refused, and every second one costs a minute', () => {
    expect(cipherLogic.minutes(start())).toBe(2);
    const one = play([en(87)]);
    expect(one.en.filled[0]).toBe(false);
    expect(one.en.last).toEqual({ kind: 'wrong', slot: 0, z: 87 });
    expect(cipherLogic.minutes(one)).toBe(2);
    const two = play([en(89)], one);
    expect(cipherLogic.minutes(two)).toBe(3);
    // The right one goes in, and the next gap comes up.
    const ra = play([en(88)], two);
    expect(ra.en.filled[0]).toBe(true);
    expect(ra.en.slot).toBe(1);
    // A filled gap stays filled.
    const again = play([{ v: 'en', type: 'slot', slot: 0 }, en(1)], ra);
    expect(again.en.last).toEqual({ kind: 'filled', slot: 0 });
    expect(again.en.wrong).toBe(2);
  });

  it('each language keeps its own page: moves in one never touch the other', () => {
    const enHalf = play([en(88), en(74), en(49)]);
    const zhToo = play([zh('metal'), zh('stone'), zh('gas')], enHalf);
    expect(zhToo.en).toEqual(enHalf.en);
    expect(zhToo.zh.stripped).toEqual([true, true, false, false]);
    expect(zhToo.zh.wrong).toBe(1);
    const back = play([en(88)], zhToo);
    expect(back.zh).toEqual(zhToo.zh);
    expect(back.en.filled).toEqual([true, true, true, true, false, false, false, false]);
    // Minutes count the wrong picks from both pages.
    expect(cipherLogic.minutes(play([en(1)], back))).toBe(3);
  });

  it('either language solves it; solution() finishes the English from anywhere', () => {
    const viaZh = play([zh('metal'), zh('gas'), zh('metal'), zh('metal')]);
    expect(cipherLogic.isSolved(viaZh)).toBe(true);
    expect(viaZh.en.filled.some(Boolean)).toBe(false);
    expect(cipherLogic.solution(viaZh)).toEqual([]);
    // Nothing more happens once it is read.
    expect(play([en(88)], viaZh)).toBe(viaZh);
    const half = play([zh('metal'), en(88), { v: 'en', type: 'slot', slot: 5 }, en(19)]);
    const finished = play(cipherLogic.solution(half), half);
    expect(cipherLogic.isSolved(finished)).toBe(true);
    expect(finished.en.filled.every(Boolean)).toBe(true);
    expect(finished.zh.stripped).toEqual([true, false, false, false]);
  });

  it('a reload, or a language switch, brings both pages back exactly; junk resets only what is junk', () => {
    const mid = play([en(88), en(74), zh('metal'), zh('stone'), { v: 'zh', type: 'char', char: 3 }]);
    const back = cipherLogic.init({ minute: 29, act: 2, data: roundTrip(cipherSave(mid)) });
    expect(back).toEqual({ en: { ...mid.en, last: null }, zh: { ...mid.zh, last: null } });
    expect(cipherLogic.minutes(back)).toBe(cipherLogic.minutes(mid));
    const halfJunk = cipherLogic.init({ minute: 29, act: 2, data: { en: roundTrip(cipherSave(mid).en), zh: { stripped: 'yes', char: 9, wrong: -1 } } });
    expect(halfJunk.en).toEqual(back.en);
    expect(halfJunk.zh).toEqual(start().zh);
    expect(cipherLogic.init({ minute: 29, act: 2, data: [1, 2, 3] })).toEqual(start());
    expect(cipherLogic.init({ minute: 29, act: 2, data: { en: { filled: [true, 'x', true], slot: 1.5 } } }).en).toEqual({ filled: [true, false, true, false, false, false, false, false], slot: 1, wrong: 0, last: null });
  });
});

// ── Roving focus ───────────────────────────────────────────────────────────

describe('arrow keys on a grid and in a line', () => {
  const grid = [
    { row: 1, col: 1 },
    { row: 1, col: 18 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 2, col: 13 },
    { row: 9, col: 3 },
  ];
  it('moves to the nearest neighbour in each direction, skipping gaps, and stops at the edges', () => {
    expect(step(grid, 0, 'ArrowRight')).toBe(1);
    expect(step(grid, 1, 'ArrowRight')).toBeNull();
    expect(step(grid, 4, 'ArrowLeft')).toBe(3);
    expect(step(grid, 0, 'ArrowDown')).toBe(2);
    expect(step(grid, 4, 'ArrowUp')).toBe(1); // column 18 is nearer to 13 than column 1
    expect(step(grid, 3, 'ArrowDown')).toBe(5);
    expect(step(grid, 5, 'ArrowDown')).toBeNull();
    expect(step(grid, 4, 'Home')).toBe(2);
    expect(step(grid, 2, 'End')).toBe(4);
    expect(step(grid, 2, 'Enter')).toBeNull();
  });
  it('wraps in a line, as radio groups do', () => {
    const line = [0, 1, 2].map((col) => ({ row: 0, col }));
    expect(step(line, 2, 'ArrowRight', true)).toBe(0);
    expect(step(line, 0, 'ArrowUp', true)).toBe(2);
    expect(step(line, 1, 'End', true)).toBe(2);
  });
});

// ── In the game ────────────────────────────────────────────────────────────

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
function fresh(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  return g;
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
  waitUntil(g, LOOP_LENGTH);
  drainCards(g);
}
function solveOpen(g: Game): void {
  const logic = PUZZLE_LOGIC[g.state.puzzle!]!;
  let s = logic.init({ minute: g.state.minute, act: g.state.act });
  for (const m of logic.solution(s)) s = logic.apply(s, m);
  expect(logic.isSolved(s)).toBe(true);
  g.completePuzzle({ solved: true, minutes: logic.minutes(s) });
}
/** Into Dan's office during the porter's Monday clean. */
function intoOffice(g: Game): void {
  goTo(g, 'stairs');
  waitUntil(g, PI_OPEN.from - 1);
  goTo(g, 'pi');
  expect(g.state.scene).toBe('pi.hub');
}

describe('Act II puzzles in the building', () => {
  it('the porter’s terminal: seven nights of badges, and what you write down', () => {
    const g = fresh();
    goTo(g, 'stairs');
    expect(ids(g)).toContain('stairs.terminal');
    g.choose('stairs.terminal');
    expect(g.state.puzzle).toBe('doorlog');
    solveOpen(g);
    expect(known(g)).toEqual(expect.arrayContaining(['nb.porter', 'nb.keeps']));
    expect(g.state.fragments).toContain('yc.badge');
    expect(g.state.display.map((p) => p.key)).toContain('puzzle.doorlog.solved');
    expect(ids(g)).not.toContain('stairs.terminal');
    // 1 walk + 1 choice + the puzzle's 2 minutes of reading.
    expect(g.state.minute).toBe(4);
  });

  it('her notebook is in Dan’s office, open only while the porter cleans it', () => {
    const g = fresh();
    intoOffice(g);
    g.choose('pi.notebook');
    expect(g.state.puzzle).toBe('cipher');
    solveOpen(g);
    expect(known(g)).toContain('nb.cipher');
    expect(g.state.fragments).toContain('yc.notebook');
    expect(ids(g)).not.toContain('pi.notebook');
  });

  it('rack 1 opens once you know where to look; the alarm shuts it until the next 02:47', () => {
    const g = fresh();
    goTo(g, 'cold');
    expect(ids(g)).not.toContain('cold.rack1');
    g.state.known.push({ id: 'nb.cipher', loop: 1, minute: 0 });
    expect(ids(g)).toContain('cold.rack1');
    g.choose('cold.rack1');
    expect(g.state.puzzle).toBe('freezer');
    g.completePuzzle({ solved: false, failed: true, minutes: 6 });
    expect(g.state.lflags).toContain('freezer.alarm');
    expect(g.state.display.map((p) => p.key)).toContain('puzzle.freezer.failed');
    expect(ids(g)).not.toContain('cold.rack1');
    endLoop(g);
    goTo(g, 'cold');
    expect(ids(g)).toContain('cold.rack1');
  });

  it('the card goes into your pocket; in later loops you just lift E5', () => {
    const g = fresh();
    g.state.known.push({ id: 'nb.cipher', loop: 1, minute: 0 });
    goTo(g, 'cold');
    g.choose('cold.rack1');
    solveOpen(g);
    expect(g.state.inventory).toEqual(['item.microsd']);
    expect(known(g)).toContain('nb.freezer');
    expect(ids(g)).not.toContain('cold.rack1');
    expect(ids(g)).not.toContain('cold.e5');
    endLoop(g);
    goTo(g, 'cold');
    const before = g.state.minute;
    g.choose('cold.e5');
    expect(g.state.minute - before).toBe(2);
    expect(g.state.inventory).toEqual(['item.microsd']);
    expect(ids(g)).not.toContain('cold.e5');
  });

  it('the shortcut is tagged as one, and every puzzle has three hints, a par time and a margin note', () => {
    const cold = CONTENT.scenes.find((s) => s.id === 'cold.hub')!;
    expect(cold.choices.find((c) => c.id === 'cold.e5')!.tags).toEqual(['shortcut']);
    for (const id of ['doorlog', 'cipher', 'freezer']) {
      const def = CONTENT.puzzles.find((p) => p.id === id)!;
      expect(def.hints).toEqual([`puzzle.${id}.h1`, `puzzle.${id}.h2`, `puzzle.${id}.h3`]);
      expect(def.par).toBeGreaterThan(0);
      expect(def.margin).toBe(`puzzle.${id}.margin`);
    }
    expect(CONTENT.puzzles.find((p) => p.id === 'doorlog')!.par).toBe(3.5);
  });
});

describe('the keys the views build at run time exist in both languages', () => {
  const keys = [
    ...['tom', 'sample', 'stock', 'ref', 'card'].map((k) => `puzzle.freezer.found.${k}`),
    ...['black', 'white', 'red', 'empty'].map((k) => `puzzle.freezer.cap.${k}`),
    ...[1, 2, 3, 4].map((n) => `puzzle.freezer.note.${n}`),
    ...DAYS.map((d) => `puzzle.doorlog.day.${d}`),
    ...DOORS.map((d) => `puzzle.doorlog.door.${d}`),
    ...['femi', 'lin', 'tom', 'ian', 'none'].map((b) => `puzzle.doorlog.badge.${b}`),
    ...['granted', 'denied', 'exit', 'held', 'released', 'locked'].map((e) => `puzzle.doorlog.ev.${e}`),
    ...['time', 'door', 'badge', 'event'].map((c) => `puzzle.doorlog.col.${c}`),
    ...['pi', 'exit', 'both'].map((r) => `puzzle.doorlog.check.${r}`),
    ...['pi', 'exit'].map((r) => `puzzle.doorlog.row.${r}`),
    ...RADICALS.map((r) => `puzzle.cipher.radical.${r}`),
  ];
  it.each(keys)('%s', (key) => {
    expect(TABLES.en[key], 'en').toBeTruthy();
    expect(TABLES['zh-Hant-TW'][key], 'zh-Hant-TW').toBeTruthy();
  });
});
