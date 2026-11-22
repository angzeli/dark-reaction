/**
 * One-shot cues, scripted against a tiny synthesis kit so they stay
 * readable as sound design. Times are seconds from the cue's start.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { NoiseColour } from './ambience.ts';

export interface ToneSpec {
  wave?: OscillatorType;
  freq: number;
  /** Glide to this frequency by the end. */
  to?: number;
  start: number;
  duration: number;
  gain: number;
  attack?: number;
  release?: number;
  lowpass?: number;
  reverb?: number;
}

export interface NoiseSpec {
  colour: NoiseColour;
  filter: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  start: number;
  duration: number;
  gain: number;
  attack?: number;
  release?: number;
  reverb?: number;
}

export interface CueKit {
  tone(spec: ToneSpec): void;
  noise(spec: NoiseSpec): void;
  /** Fade the ambience to `level` (0–1) over `seconds`; it returns on the next setAmbience. */
  duckAmbience(level: number, seconds: number, at?: number): void;
}

export type EndingCue = 'ending.perfect' | 'ending.honest' | 'ending.clocking' | 'ending.infinite' | 'ending.dark' | 'ending.fire';
export type CueId = 'lightsout' | 'loopstart' | 'phantom' | 'solve' | 'hint' | 'fail' | 'chirp' | EndingCue;

const birds = (k: CueKit, start: number, count: number): void => {
  for (let i = 0; i < count; i++) {
    const t = start + i * 0.9 + (i % 3) * 0.17;
    const f = 2600 + ((i * 373) % 900);
    k.tone({ freq: f, to: f * 1.35, start: t, duration: 0.09, gain: 0.02, reverb: 0.5 });
    k.tone({ freq: f * 1.2, to: f * 0.95, start: t + 0.12, duration: 0.07, gain: 0.015, reverb: 0.5 });
  }
};

export const CUES: Record<CueId, (k: CueKit) => void> = {
  /** 03:33: the tubes stutter, the hum drops a semitone and dies, the compressor winds down. */
  lightsout: (k) => {
    for (const [t, d] of [[0, 0.08], [0.22, 0.05], [0.4, 0.14], [0.7, 0.04]] as const) {
      k.tone({ wave: 'sawtooth', freq: 100, start: t, duration: d, gain: 0.05, lowpass: 1400, attack: 0.002, release: 0.01 });
    }
    k.duckAmbience(0, 1.6, 0.8);
    k.tone({ wave: 'sine', freq: 50, to: 47.2, start: 0.8, duration: 1.6, gain: 0.06, attack: 0.01, release: 1.2 });
    k.tone({ wave: 'sine', freq: 100, to: 94.4, start: 0.8, duration: 1.4, gain: 0.03, attack: 0.01, release: 1 });
    k.tone({ wave: 'triangle', freq: 50, to: 6, start: 0.9, duration: 2.6, gain: 0.05, lowpass: 300, release: 1.8 });
    k.noise({ colour: 'white', filter: 'bandpass', freq: 1800, q: 2, start: 0.82, duration: 0.03, gain: 0.08, attack: 0.001, release: 0.02 }); // relay
  },
  /** 02:47: a tube pings on. */
  loopstart: (k) => {
    k.noise({ colour: 'white', filter: 'bandpass', freq: 2600, q: 3, start: 0, duration: 0.02, gain: 0.05, attack: 0.001, release: 0.015 });
    k.tone({ wave: 'sawtooth', freq: 100, start: 0.05, duration: 0.9, gain: 0.02, lowpass: 800, attack: 0.3, release: 0.4 });
  },
  /** A page you didn't write: pencil on paper and a low swell. */
  phantom: (k) => {
    for (let i = 0; i < 6; i++) {
      k.noise({ colour: 'pink', filter: 'bandpass', freq: 3200 + i * 140, q: 4, start: 0.1 + i * 0.13, duration: 0.09, gain: 0.03, attack: 0.01, release: 0.05 });
    }
    k.tone({ wave: 'sine', freq: 110, start: 0, duration: 2.4, gain: 0.04, attack: 0.9, release: 1.2, reverb: 0.6 });
    k.tone({ wave: 'sine', freq: 116.5, start: 0.3, duration: 2, gain: 0.02, attack: 0.9, release: 1, reverb: 0.6 });
  },
  solve: (k) => {
    k.tone({ wave: 'sine', freq: 660, start: 0, duration: 0.45, gain: 0.04, attack: 0.01, release: 0.35, reverb: 0.5 });
    k.tone({ wave: 'sine', freq: 990, start: 0.18, duration: 0.6, gain: 0.035, attack: 0.01, release: 0.5, reverb: 0.5 });
  },
  hint: (k) => {
    k.tone({ wave: 'sine', freq: 520, start: 0, duration: 0.35, gain: 0.03, attack: 0.01, release: 0.3, reverb: 0.4 });
  },
  fail: (k) => {
    k.tone({ wave: 'triangle', freq: 180, to: 140, start: 0, duration: 0.4, gain: 0.04, attack: 0.01, release: 0.3 });
  },
  chirp: (k) => {
    k.tone({ wave: 'sine', freq: 1300, to: 2500, start: 0, duration: 0.07, gain: 0.06, attack: 0.004, release: 0.03 });
  },

  /** Too clean: a perfect major chord that stops dead. */
  'ending.perfect': (k) => {
    for (const [f, d] of [[261.6, 0], [329.6, 0.15], [392, 0.3], [523.3, 0.45]] as const) {
      k.tone({ wave: 'sine', freq: f, start: d, duration: 3.2 - d, gain: 0.035, attack: 0.6, release: 0.02, reverb: 0.3 });
    }
  },
  /** Noise with a fifth inside it, then the first birds. */
  'ending.honest': (k) => {
    k.noise({ colour: 'pink', filter: 'lowpass', freq: 1200, start: 0, duration: 4, gain: 0.05, attack: 1, release: 2 });
    k.tone({ wave: 'sine', freq: 196, start: 0.5, duration: 4, gain: 0.03, attack: 1.2, release: 2, reverb: 0.5 });
    k.tone({ wave: 'sine', freq: 293.7, start: 0.9, duration: 3.6, gain: 0.025, attack: 1.2, release: 2, reverb: 0.5 });
    birds(k, 3, 4);
  },
  /** Rain, a bus pulling in, the doors. */
  'ending.clocking': (k) => {
    k.noise({ colour: 'pink', filter: 'highpass', freq: 400, start: 0, duration: 6, gain: 0.12, attack: 0.5, release: 2 });
    k.noise({ colour: 'brown', filter: 'lowpass', freq: 140, to: 220, start: 0.5, duration: 4, gain: 0.18, attack: 1.5, release: 1.5 });
    k.tone({ wave: 'sawtooth', freq: 38, to: 30, start: 0.5, duration: 4, gain: 0.03, lowpass: 160, attack: 1.5, release: 1.5 });
    k.noise({ colour: 'white', filter: 'bandpass', freq: 3000, q: 0.8, start: 4.4, duration: 0.7, gain: 0.06, attack: 0.02, release: 0.5 });
  },
  /** The hum that never resolves: a phrase that repeats and slowly detunes. */
  'ending.infinite': (k) => {
    const phrase = [220, 261.6, 246.9, 196];
    for (let r = 0; r < 4; r++) {
      phrase.forEach((f, i) => {
        k.tone({ wave: 'sine', freq: f * (1 - r * 0.012), start: r * 1.6 + i * 0.4, duration: 0.5, gain: 0.03, attack: 0.02, release: 0.4, reverb: 0.7 });
      });
    }
    k.tone({ wave: 'sine', freq: 50, start: 0, duration: 7, gain: 0.04, attack: 2, release: 0.01 });
  },
  /** A low drone resolves to a fifth; the magnet keeps singing; dawn. */
  'ending.dark': (k) => {
    k.tone({ wave: 'sine', freq: 55, start: 0, duration: 6, gain: 0.05, attack: 1.5, release: 2.5, reverb: 0.6 });
    k.tone({ wave: 'sine', freq: 77.8, to: 82.4, start: 0.8, duration: 5.2, gain: 0.03, attack: 1.5, release: 2.5, reverb: 0.6 });
    k.tone({ wave: 'sine', freq: 164.8, start: 2.5, duration: 3.5, gain: 0.02, attack: 1.2, release: 2, reverb: 0.8 });
    k.noise({ colour: 'white', filter: 'highpass', freq: 7000, start: 0, duration: 6, gain: 0.008, attack: 1, release: 2 });
    birds(k, 4.5, 3);
  },
  /** A two-tone sounder, kept soft, then the car park at dawn. */
  'ending.fire': (k) => {
    for (let i = 0; i < 8; i++) {
      k.tone({ wave: 'square', freq: i % 2 ? 970 : 800, start: i * 0.3, duration: 0.28, gain: 0.018, lowpass: 2200, attack: 0.01, release: 0.03 });
    }
    k.noise({ colour: 'brown', filter: 'lowpass', freq: 160, start: 2.6, duration: 3, gain: 0.1, attack: 0.8, release: 1.5 });
    birds(k, 3.4, 3);
  },
};
