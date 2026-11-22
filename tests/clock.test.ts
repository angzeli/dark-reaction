import { describe, expect, it } from 'vitest';
import { clockLabel, isLightsOut, LOOP_LENGTH, minuteOf } from '../src/engine/clock.ts';

describe('loop clock', () => {
  it('starts at 02:47 and ends at 03:33', () => {
    expect(clockLabel(0)).toBe('02:47');
    expect(clockLabel(13)).toBe('03:00');
    expect(clockLabel(LOOP_LENGTH)).toBe('03:33');
  });

  it('round-trips labels and minutes', () => {
    for (let m = 0; m <= LOOP_LENGTH; m++) {
      expect(minuteOf(clockLabel(m))).toBe(m);
    }
    expect(minuteOf('03:15')).toBe(28);
  });

  it('clamps negative minutes and rejects bad labels', () => {
    expect(clockLabel(-5)).toBe('02:47');
    expect(() => minuteOf('3:15')).toThrow();
  });

  it('knows when the lights go out', () => {
    expect(isLightsOut(45)).toBe(false);
    expect(isLightsOut(46)).toBe(true);
    expect(isLightsOut(50)).toBe(true);
  });
});
