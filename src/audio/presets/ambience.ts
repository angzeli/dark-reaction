/**
 * Sound design for each location, as data. Every layer is synthesised at
 * runtime (no samples). Gains are linear and deliberately low: this is room
 * tone, not music. Part of the creative content (CC BY-NC-SA 4.0).
 */

export type NoiseColour = 'white' | 'pink' | 'brown';

export interface Lfo {
  /** Hz */
  rate: number;
  /** Modulation depth, as a fraction of the base value. */
  depth: number;
}

export type Layer =
  | {
      kind: 'noise';
      colour: NoiseColour;
      filter: BiquadFilterType;
      freq: number;
      q?: number;
      gain: number;
      gainLfo?: Lfo;
      freqLfo?: Lfo;
      reverb?: number;
    }
  | { kind: 'tone'; wave: OscillatorType; freq: number; detune?: number; gain: number; lowpass?: number; gainLfo?: Lfo; reverb?: number }
  /** Short sine sweeps at a regular interval, with jitter (cryocooler, clock tick). */
  | { kind: 'chirp'; from: number; to: number; duration: number; interval: number; jitter?: number; gain: number; reverb?: number }
  /** Random bright pings: rain landing on glass. `rate` is per second. */
  | { kind: 'drops'; rate: number; low: number; high: number; gain: number; reverb?: number }
  /** Speech-shaped murmur: a far-off radio. */
  | { kind: 'radio'; gain: number; reverb?: number }
  /** Slow rhythmic swell: a compressor or pump. Period in seconds. */
  | { kind: 'pulse'; freq: number; period: number; gain: number; lowpass?: number };

export type AmbienceId = 'title' | 'office' | 'synth' | 'glovebox' | 'pi' | 'stairs' | 'nmr' | 'cold' | 'roof' | 'dark';

/** UK mains: 50 Hz, and fluorescent tubes buzz at twice that. */
const MAINS = 50;
const roomTone = (gain = 0.22): Layer => ({ kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 320, gain });
const tubes = (gain = 0.006): Layer => ({ kind: 'tone', wave: 'sawtooth', freq: MAINS * 2, gain, lowpass: 900 });
const rainOnGlass = (gain = 0.07, drops = 5): Layer[] => [
  { kind: 'noise', colour: 'pink', filter: 'bandpass', freq: 2200, q: 0.6, gain, gainLfo: { rate: 0.05, depth: 0.3 } },
  { kind: 'drops', rate: drops, low: 2400, high: 5200, gain: 0.018 },
];

export const AMBIENCE: Record<AmbienceId, Layer[]> = {
  title: [
    ...rainOnGlass(0.06, 3),
    { kind: 'tone', wave: 'sine', freq: 55, gain: 0.03, gainLfo: { rate: 0.03, depth: 0.5 } },
    { kind: 'tone', wave: 'sine', freq: 55.4, gain: 0.025 },
    { kind: 'tone', wave: 'sine', freq: 82.6, gain: 0.012, reverb: 0.6 },
  ],
  office: [
    roomTone(),
    ...rainOnGlass(),
    tubes(),
    { kind: 'tone', wave: 'sine', freq: MAINS, gain: 0.015 }, // the fridge under the kettle
  ],
  synth: [
    roomTone(0.18),
    // Fume hoods: a broad, breathing airflow.
    { kind: 'noise', colour: 'pink', filter: 'bandpass', freq: 520, q: 0.45, gain: 0.24, gainLfo: { rate: 0.07, depth: 0.15 }, freqLfo: { rate: 0.04, depth: 0.2 } },
    tubes(0.008),
  ],
  glovebox: [
    roomTone(0.18),
    // Circulation blower and the box's steady fan.
    { kind: 'tone', wave: 'triangle', freq: 118, gain: 0.02, gainLfo: { rate: 0.3, depth: 0.1 } },
    { kind: 'noise', colour: 'brown', filter: 'bandpass', freq: 240, q: 1.2, gain: 0.12 },
    { kind: 'pulse', freq: 32, period: 2.6, gain: 0.05, lowpass: 120 },
    tubes(),
  ],
  pi: [
    roomTone(0.14),
    ...rainOnGlass(0.05, 4),
    { kind: 'chirp', from: 2400, to: 1900, duration: 0.012, interval: 1, gain: 0.025 }, // the wall clock
  ],
  stairs: [
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 260, gain: 0.2, reverb: 0.7 },
    { kind: 'radio', gain: 0.03, reverb: 0.8 },
    { kind: 'tone', wave: 'sine', freq: MAINS * 2, gain: 0.004, reverb: 0.5 },
  ],
  nmr: [
    roomTone(0.12),
    { kind: 'pulse', freq: MAINS, period: 1.2, gain: 0.09, lowpass: 260 }, // helium compressor
    { kind: 'tone', wave: 'sine', freq: MAINS * 3, gain: 0.01 },
    { kind: 'chirp', from: 1300, to: 2500, duration: 0.07, interval: 1.2, jitter: 0.02, gain: 0.03 }, // cryocooler
    { kind: 'noise', colour: 'white', filter: 'highpass', freq: 6500, gain: 0.006 }, // console fans
  ],
  cold: [
    { kind: 'tone', wave: 'sawtooth', freq: 47, gain: 0.03, lowpass: 200, gainLfo: { rate: 0.02, depth: 0.2 } }, // freezer compressor
    { kind: 'noise', colour: 'pink', filter: 'lowpass', freq: 900, gain: 0.1 },
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 180, gain: 0.15 },
  ],
  roof: [
    { kind: 'noise', colour: 'pink', filter: 'highpass', freq: 380, gain: 0.26, gainLfo: { rate: 0.09, depth: 0.2 } }, // rain
    { kind: 'drops', rate: 18, low: 1500, high: 4200, gain: 0.02 },
    { kind: 'noise', colour: 'brown', filter: 'bandpass', freq: 420, q: 0.8, gain: 0.14, freqLfo: { rate: 0.05, depth: 0.6 }, gainLfo: { rate: 0.03, depth: 0.5 } }, // wind
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 110, gain: 0.16 }, // the city
  ],
  dark: [
    { kind: 'noise', colour: 'white', filter: 'highpass', freq: 7000, gain: 0.004 },
    { kind: 'tone', wave: 'sine', freq: 41.2, gain: 0.03, gainLfo: { rate: 0.02, depth: 0.6 } },
  ],
};
