/**
 * A sample puzzle that proves the contract end to end: a three-dial
 * combination lock. Not part of the game's content; used by tests and the
 * framework's e2e check. Every four turns cost a minute.
 */
import type { PuzzleLogic } from '../types.ts';

export interface DialState {
  dials: [number, number, number];
  target: [number, number, number];
  turns: number;
}

export type DialMove = { dial: 0 | 1 | 2; delta: 1 | -1 };

const wrap = (n: number) => ((n % 10) + 10) % 10;

export const dialLogic: PuzzleLogic<DialState, DialMove> = {
  id: 'demo',
  init: (ctx) => {
    const saved = ctx.data as Partial<DialState> | undefined;
    const dials = Array.isArray(saved?.dials) && saved.dials.length === 3 ? (saved.dials.map(wrap) as DialState['dials']) : ([0, 0, 0] as DialState['dials']);
    return { dials, target: [2, 4, 1], turns: typeof saved?.turns === 'number' ? saved.turns : 0 };
  },
  apply: (s, m) => {
    const dials = [...s.dials] as DialState['dials'];
    dials[m.dial] = wrap(dials[m.dial] + m.delta);
    return { ...s, dials, turns: s.turns + 1 };
  },
  isSolved: (s) => s.dials.every((d, i) => d === s.target[i]),
  minutes: (s) => Math.floor(s.turns / 4),
  solution: (s) => {
    const moves: DialMove[] = [];
    s.dials.forEach((d, i) => {
      const up = wrap(s.target[i]! - d);
      const delta: 1 | -1 = up <= 5 ? 1 : -1;
      for (let k = 0; k < (delta === 1 ? up : 10 - up); k++) moves.push({ dial: i as 0 | 1 | 2, delta });
    });
    return moves;
  },
};
