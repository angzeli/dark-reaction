/**
 * P2 · Glovebox antechamber (docs/DESIGN.md §11). Get the vial into the box
 * without letting the air in: outer door, evacuate, refill (three times),
 * inner door. The box's oxygen climbs while you work; mistakes spike it;
 * over 10 ppm when the vial goes in and the copper(I) turns green.
 * Game rules, not a real procedure.
 */
import { O2_LIMIT, o2At } from '../../content/lab.ts';
import type { PuzzleLogic } from '../types.ts';

export const CYCLES_NEEDED = 3;
export const EVACUATE_MINUTES = 2;
export const REFILL_MINUTES = 1;
/** A full purge without fumbling, as the later-loop shortcut runs it. */
export const PURGE_MINUTES = CYCLES_NEEDED * (EVACUATE_MINUTES + REFILL_MINUTES);
/** The last minute a full purge can start and still get the vial in at or under the limit (03:19). */
export const LAST_PURGE_START: number = (() => {
  let m = 0;
  while (o2At(m + 1 + PURGE_MINUTES) <= O2_LIMIT) m++;
  return m;
})();

export type GloveEvent =
  | 'outerOpen'
  | 'outerClose'
  | 'outerStuck'
  | 'bothOpen'
  | 'loaded'
  | 'loadNeedsOuter'
  | 'evacuated'
  | 'evacuateDoorOpen'
  | 'evacuateInnerOpen'
  | 'alreadyVacuum'
  | 'refilled'
  | 'refillNothing'
  | 'innerOpen'
  | 'innerAir'
  | 'innerVacuum'
  | 'innerOuterOpen'
  | 'innerClose'
  | 'transferNeedsInner'
  | 'transferred'
  | 'ruined';

export interface GloveState {
  start: number;
  minutes: number;
  outer: boolean;
  inner: boolean;
  vacuum: boolean;
  cycles: number;
  /** Evacuated since the last refill (so the next refill completes a cycle). */
  pumped: boolean;
  vial: 'outside' | 'chamber' | 'box';
  spike: number;
  ruined: boolean;
  done: boolean;
  last: GloveEvent | null;
}

export type GloveMove = 'outer' | 'load' | 'evacuate' | 'refill' | 'inner' | 'transfer';

/** Oxygen in the box right now, in ppm. */
export const o2 = (s: GloveState): number => Math.round((o2At(s.start + s.minutes) + s.spike) * 10) / 10;

/** What a reload needs to put the antechamber back exactly as it was. */
export type GloveSave = Omit<GloveState, 'start' | 'last'>;
export const gloveSave = ({ start: _start, last: _last, ...rest }: GloveState): GloveSave => rest;

const flag = (v: unknown): boolean => v === true;
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(999, Math.max(0, Math.floor(v))) : 0);

export const gloveboxLogic: PuzzleLogic<GloveState, GloveMove> = {
  id: 'glovebox',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof GloveSave, unknown>>;
    return {
      start: ctx.minute,
      minutes: count(d.minutes),
      outer: flag(d.outer),
      inner: flag(d.inner),
      vacuum: flag(d.vacuum),
      cycles: count(d.cycles),
      pumped: flag(d.pumped),
      vial: d.vial === 'chamber' || d.vial === 'box' ? d.vial : 'outside',
      spike: count(d.spike),
      ruined: flag(d.ruined),
      done: flag(d.done),
      last: null,
    };
  },
  apply: (s, move) => {
    if (s.done || s.ruined) return s;
    const at = (patch: Partial<GloveState>, last: GloveEvent): GloveState => ({ ...s, ...patch, last });
    switch (move) {
      case 'outer':
        if (s.outer) return at({ outer: false }, 'outerClose');
        if (s.vacuum) return at({}, 'outerStuck');
        if (s.inner) return at({ outer: true, spike: s.spike + 50, ruined: true }, 'bothOpen');
        return at({ outer: true, cycles: 0, pumped: false }, 'outerOpen');
      case 'load':
        if (!s.outer || s.vial !== 'outside') return at({}, 'loadNeedsOuter');
        return at({ vial: 'chamber' }, 'loaded');
      case 'evacuate':
        if (s.outer) return at({}, 'evacuateDoorOpen');
        if (s.inner) return at({ spike: s.spike + 5 }, 'evacuateInnerOpen');
        if (s.vacuum) return at({}, 'alreadyVacuum');
        return at({ vacuum: true, pumped: true, minutes: s.minutes + EVACUATE_MINUTES }, 'evacuated');
      case 'refill':
        if (!s.vacuum) return at({}, 'refillNothing');
        return at({ vacuum: false, pumped: false, cycles: s.pumped ? s.cycles + 1 : s.cycles, minutes: s.minutes + REFILL_MINUTES }, 'refilled');
      case 'inner':
        if (s.inner) return at({ inner: false }, 'innerClose');
        if (s.outer) return at({}, 'innerOuterOpen');
        if (s.vacuum) return at({ spike: s.spike + 5 }, 'innerVacuum');
        if (s.cycles < CYCLES_NEEDED) return at({ inner: true, spike: s.spike + 15 }, 'innerAir');
        return at({ inner: true }, 'innerOpen');
      case 'transfer': {
        if (!s.inner || s.vial !== 'chamber') return at({}, 'transferNeedsInner');
        const next = { ...s, vial: 'box' as const };
        if (o2(next) > O2_LIMIT) return { ...next, ruined: true, last: 'ruined' };
        return { ...next, done: true, last: 'transferred' };
      }
    }
  },
  isSolved: (s) => s.done && !s.ruined,
  isFailed: (s) => s.ruined,
  minutes: (s) => s.minutes,
  solution: () => ['outer', 'load', 'outer', 'evacuate', 'refill', 'evacuate', 'refill', 'evacuate', 'refill', 'inner', 'transfer'],
};
