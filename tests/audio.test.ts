import { describe, expect, it } from 'vitest';
import { chirpSchedule } from '../src/audio/chirp.ts';
import { AMBIENCE } from '../src/audio/presets/ambience.ts';
import { CUES, type CueKit, type NoiseSpec, type ToneSpec } from '../src/audio/presets/cues.ts';

/** The eight locations from docs/DESIGN.md §4. */
const LOCATIONS = ['office', 'synth', 'glovebox', 'pi', 'stairs', 'nmr', 'cold', 'roof'] as const;

describe('chirp schedule', () => {
  it('groups chirps with short gaps inside and long gaps between', () => {
    const { times, length } = chirpSchedule([2, 1], { within: 0.3, between: 1, cycle: 2 });
    expect(times).toEqual([0, 0.3, 1.3]);
    expect(length).toBe(3.3);
  });

  it('plays 2-4-1-3 as ten chirps in four groups', () => {
    const { times } = chirpSchedule([2, 4, 1, 3]);
    expect(times).toHaveLength(10);
    const gaps = times.slice(1).map((t, i) => Number((t - times[i]!).toFixed(3)));
    const long = gaps.filter((g) => g > 1);
    expect(long).toHaveLength(3);
  });

  it('rejects empty or fractional groups', () => {
    expect(() => chirpSchedule([2, 0])).toThrow();
    expect(() => chirpSchedule([1.5])).toThrow();
  });
});

describe('ambience presets', () => {
  it('cover every location plus the title and the dark', () => {
    for (const id of LOCATIONS) expect(AMBIENCE[id], id).toBeDefined();
    expect(AMBIENCE.title.length).toBeGreaterThan(0);
    expect(AMBIENCE.dark.length).toBeGreaterThan(0);
  });

  it('stay quiet: no layer louder than 0.3, no mix louder than 0.7 in sum', () => {
    for (const [id, layers] of Object.entries(AMBIENCE)) {
      for (const layer of layers) expect(layer.gain, id).toBeLessThanOrEqual(0.3);
      expect(layers.reduce((sum, l) => sum + l.gain, 0), id).toBeLessThanOrEqual(0.7);
    }
  });
});

describe('cues', () => {
  it('every cue schedules sound with sane numbers and ends within eight seconds', () => {
    for (const [id, cue] of Object.entries(CUES)) {
      const calls: Array<ToneSpec | NoiseSpec> = [];
      const kit: CueKit = { tone: (s) => calls.push(s), noise: (s) => calls.push(s), duckAmbience: () => undefined };
      cue(kit);
      expect(calls.length, id).toBeGreaterThan(0);
      for (const c of calls) {
        for (const v of [c.start, c.duration, c.gain, c.freq]) expect(Number.isFinite(v), id).toBe(true);
        expect(c.gain, id).toBeLessThanOrEqual(0.2);
        expect(c.start + c.duration, id).toBeLessThanOrEqual(8);
      }
    }
  });
});
