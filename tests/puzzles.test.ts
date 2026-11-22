import { describe, expect, it } from 'vitest';
import { dialLogic } from '../src/puzzles/demo/logic.ts';
import { checkPuzzleContract } from './helpers/puzzle-contract.ts';

describe('puzzle contract (sample dial lock)', () => {
  it('keeps the contract', () => checkPuzzleContract(dialLogic));

  it('counts a minute per four turns and wraps dials', () => {
    let s = dialLogic.init({ minute: 0, act: 1 });
    for (let i = 0; i < 9; i++) s = dialLogic.apply(s, { dial: 0, delta: -1 });
    expect(s.dials[0]).toBe(1);
    expect(dialLogic.minutes(s)).toBe(2);
  });

  it('resumes from saved data and still solves from there', () => {
    const s = dialLogic.init({ minute: 10, act: 1, data: { dials: [9, 4, 3], turns: 7 } });
    expect(s.dials).toEqual([9, 4, 3]);
    const end = dialLogic.solution(s).reduce((st, m) => dialLogic.apply(st, m), s);
    expect(dialLogic.isSolved(end)).toBe(true);
  });
});
