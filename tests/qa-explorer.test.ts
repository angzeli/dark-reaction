/**
 * Layer 1 of the playtest QA (scripts/qa/), at a size CI can afford: every
 * night the scripted routes pass through, searched from 02:47 to 03:33 with
 * a fixed seed, and a few hundred chaotic random walks. The nightly workflow
 * runs the same tools much longer (node scripts/qa/explore.ts --long).
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { newGameState } from '../src/engine/engine.ts';
import { ROUTES, type Route } from '../src/content/routes.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import { checkStep } from '../scripts/qa/lib/checks.ts';
import { DESIGN_STATE_CHECKS } from '../scripts/qa/lib/design.ts';
import { explore } from '../scripts/qa/lib/explorer.ts';
import { fuzz } from '../scripts/qa/lib/fuzzer.ts';
import { analyse } from '../scripts/qa/lib/model.ts';
import { step, stateKey } from '../scripts/qa/lib/play.ts';
import { defaultRoots } from '../scripts/qa/lib/roots.ts';

const routes = Object.values(ROUTES) as Route[];
const errors = <T extends { level: string }>(xs: T[]) => xs.filter((x) => x.level === 'error');

describe('Layer 1: state exploration', () => {
  const report = explore(CONTENT, PUZZLE_LOGIC, defaultRoots(CONTENT, PUZZLE_LOGIC, routes), {
    perMinute: 15,
    nightsAfter: 0,
    branches: 0,
    maxStates: 400_000,
    seed: 1,
    stateChecks: DESIGN_STATE_CHECKS,
  });

  it('finds no errors: no soft-locks, the clock, the reset, provenance, costs, saves and both languages hold everywhere', () => {
    expect(errors(report.findings).map((f) => `${f.check}: ${f.message}\n  ${f.repro.slice(-8).join(' → ')}`)).toEqual([]);
  });

  it('reaches every ending from the routes’ nights', () => {
    expect(Object.keys(report.endings).sort()).toEqual(['clocking', 'dark', 'fire', 'honest', 'infinite', 'perfect']);
  });

  it('shows every scene', () => {
    expect(report.unreachable.scenes).toEqual([]);
  });
});

describe('Layer 1: the chaotic fuzzer', () => {
  it('plays 150 fixed seeds without an error', () => {
    const r = fuzz(CONTENT, PUZZLE_LOGIC, { seeds: 150, maxSteps: 400, firstSeed: 1, stateChecks: DESIGN_STATE_CHECKS });
    expect(errors(r.findings).map((f) => `seed ${f.seed} ${f.check}: ${f.message}`)).toEqual([]);
    expect(r.steps).toBeGreaterThan(30_000);
    // About 3 s on a laptop and 5–6 s on a CI runner: well past Vitest's default 5 s.
  }, 60_000);
});

describe('Layer 1: the checks catch what they are for', () => {
  const model = analyse(CONTENT);
  const start = newGameState(CONTENT);
  start.cards = [];

  it('a choice that took the wrong number of minutes is a cost error', () => {
    const next = step(model, PUZZLE_LOGIC, start, { t: 'c', id: 'office.tea' });
    const tampered = { ...next, state: { ...next.state, minute: next.state.minute + 2 } };
    expect(checkStep(model, start, { t: 'c', id: 'office.tea' }, tampered).map((f) => f.check)).toContain('cost');
  });

  it('a flag nobody set is a provenance error', () => {
    const next = step(model, PUZZLE_LOGIC, start, { t: 'c', id: 'office.tea' });
    const tampered = { ...next, state: { ...next.state, flags: [...next.state.flags, 'perfect.offered'] } };
    expect(checkStep(model, start, { t: 'c', id: 'office.tea' }, tampered).map((f) => f.check)).toContain('provenance');
  });

  it('an item carried past 03:33 is a reset error', () => {
    // The night's events cut waits short, so wait until the loop turns over.
    let before = start;
    let next = step(model, PUZZLE_LOGIC, before, { t: 'wait', n: 10 });
    while (next.state.loop === 1) {
      before = next.state;
      next = step(model, PUZZLE_LOGIC, before, { t: 'wait', n: 10 });
    }
    expect(checkStep(model, before, { t: 'wait', n: 10 }, next).filter((f) => f.level === 'error')).toEqual([]);
    const tampered = { ...next, state: { ...next.state, inventory: ['item.vial'] } };
    expect(checkStep(model, before, { t: 'wait', n: 10 }, tampered).map((f) => f.check)).toContain('reset');
  });

  it('merges states that only differ in what the notebook shows', () => {
    const a = step(model, PUZZLE_LOGIC, start, { t: 'c', id: 'office.window' }).state;
    const b = step(model, PUZZLE_LOGIC, start, { t: 'wait', n: 1 }).state;
    expect(stateKey(model, a)).toBe(stateKey(model, b));
  });
});
