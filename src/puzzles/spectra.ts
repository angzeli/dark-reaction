/**
 * ¹H NMR spectra drawn in code, for the fabrication puzzle and the peak
 * match (docs/DESIGN.md §11 P9, P10). Pure and deterministic: every point
 * comes from a seeded noise grid, Lorentzian lines and, for real spectra, a
 * slow baseline roll.
 *
 * Noise lives on one fixed grid of chemical shifts, so two spectra that
 * share a noise seed share their noise point for point, whatever window
 * they are drawn in. The 03:33 printout and Figure 3 of the 2020 paper are
 * one such pair; every real spectrum has its own seed.
 *
 * Stylised for a game, not a simulation: the ¹³C satellites sit closer to
 * their peak, and stand taller, than real ones would, so that a player can
 * see them.
 */
import { hash, seeded } from '../art/svg.ts';

/** One resonance: a Lorentzian line. */
export interface Line {
  ppm: number;
  /** Peak height, in axis units (the plots run from 0 to 1). */
  height: number;
  /** Half width at half height, in ppm. */
  width?: number;
}

export interface SpectrumSpec {
  /** Seed for the noise grid (and the baseline roll). */
  seed: string;
  /** Noise amplitude, in axis units. */
  noise: number;
  /** How far the baseline wanders (real spectra do; the printout doesn't). */
  roll: number;
  lines: readonly Line[];
  /** Added to every position: an unreferenced spectrum sits away from the truth. */
  shift?: number;
}

/** A window onto the spectrum, from the left edge (high ppm) to the right (low). */
export interface Span {
  from: number;
  to: number;
}

/** The noise grid: one value every STEP ppm across GRID. */
export const STEP = 0.005;
const GRID = { from: 12, to: -2 };
const GRID_POINTS = Math.round((GRID.from - GRID.to) / STEP) + 1;

/** C₆D₅H, the residual proton in the deuterated benzene every sample here is run in. */
export const SOLVENT_PPM = 7.16;
/** The formate C–H: the dark-phase product. */
export const PRODUCT_PPM = 8.41;
/** Stylised ¹³C satellite spacing either side of a peak, and their height relative to it. */
export const SATELLITE_OFFSET = 0.12;
export const SATELLITE_RATIO = 0.18;
/** The decoy impurity beside her peak in the dark run. */
export const DECOY_PPM = 8.19;
/** How far the dark run's axis is off: the answer to the peak match is +0.23 ppm. */
export const DARK_SHIFT = -0.23;

const noiseCache = new Map<string, Float64Array>();

/** Approximately normal noise (mean 0, sd ≈ 1) on the fixed grid, the same for the same seed. */
function noiseGrid(seed: string): Float64Array {
  const cached = noiseCache.get(seed);
  if (cached) return cached;
  const rand = seeded(hash(`noise:${seed}`));
  const grid = new Float64Array(GRID_POINTS);
  for (let i = 0; i < GRID_POINTS; i++) grid[i] = (rand() + rand() + rand() + rand() - 2) * 1.7;
  noiseCache.set(seed, grid);
  return grid;
}

const rollCache = new Map<string, Array<{ period: number; phase: number }>>();

/** A slow, seeded wander for real baselines: three long waves. */
function rollAt(seed: string, ppm: number): number {
  let waves = rollCache.get(seed);
  if (!waves) {
    const rand = seeded(hash(`roll:${seed}`));
    waves = [0, 1, 2].map(() => ({ period: 3 + rand() * 6, phase: rand() * Math.PI * 2 }));
    rollCache.set(seed, waves);
  }
  return waves.reduce((y, w) => y + Math.sin((ppm / w.period) * Math.PI * 2 + w.phase) / 3, 0);
}

const lorentz = (x: number, line: Line, shift: number) => {
  const w = line.width ?? 0.008;
  const d = (x - (line.ppm + shift)) / w;
  return line.height / (1 + d * d);
};

/** Grid index of a chemical shift. */
const gridIndex = (ppm: number) => Math.round((GRID.from - ppm) / STEP);

/** The ppm of every grid point inside a span, left (high) to right (low). */
export function axis(span: Span): number[] {
  const out: number[] = [];
  for (let i = gridIndex(span.from); i <= gridIndex(span.to); i++) out.push(Number((GRID.from - i * STEP).toFixed(4)));
  return out;
}

/**
 * The spectrum's intensity at every grid point of `span`. `offset` is the
 * referencing a player has applied (peak match): the trace is read off the
 * axis `offset` ppm away, as if the whole spectrum had been slid along it.
 */
export function trace(spec: SpectrumSpec, span: Span, offset = 0): number[] {
  const noise = noiseGrid(spec.seed);
  const shift = spec.shift ?? 0;
  return axis(span).map((shown) => {
    const ppm = shown - offset;
    const i = gridIndex(ppm);
    const n = i >= 0 && i < GRID_POINTS ? noise[i]! : 0;
    let y = spec.noise * n + (spec.roll ? spec.roll * rollAt(spec.seed, ppm) : 0);
    for (const line of spec.lines) y += lorentz(ppm, line, shift);
    return y;
  });
}

/** A peak with its two ¹³C satellites. */
export const withSatellites = (ppm: number, height: number): Line[] => [
  { ppm, height },
  { ppm: ppm - SATELLITE_OFFSET, height: height * SATELLITE_RATIO },
  { ppm: ppm + SATELLITE_OFFSET, height: height * SATELLITE_RATIO },
];

// ── The spectra in the game ────────────────────────────────────────────────

/** The 03:33 printout: one perfect peak, no solvent, no satellites, a ruled baseline. */
export const PRINTOUT: SpectrumSpec = { seed: 'figure-3', noise: 0.006, roll: 0, lines: [{ ppm: PRODUCT_PPM, height: 0.92 }] };
/** Figure 3 of Ridley, Lin et al. (2020): the same spectrum, noise and all. */
export const FIGURE_3: SpectrumSpec = { ...PRINTOUT };
/** Your spectrum from tonight: solvent, grease, the bump at 6.9 that is always there, and nothing at 8.41. */
export const OWN: SpectrumSpec = {
  seed: 'ar4217-run-32',
  noise: 0.011,
  roll: 0.018,
  lines: [
    { ppm: SOLVENT_PPM, height: 0.62 },
    { ppm: 6.9, height: 0.07, width: 0.012 },
    { ppm: 1.26, height: 0.34, width: 0.02 },
  ],
};
/** Her reference: week nineteen on the microSD. Solvent, and a small honest peak with its satellites. */
export const HERS: SpectrumSpec = {
  seed: 'ycl-week-19',
  noise: 0.003,
  roll: 0.01,
  lines: [{ ppm: SOLVENT_PPM, height: 0.6 }, ...withSatellites(PRODUCT_PPM, 0.12)],
};
/** Her tube, run in the dark at 03:33: unreferenced, so everything sits 0.23 ppm low. */
export const DARK: SpectrumSpec = {
  seed: 'holder-13-dark',
  noise: 0.003,
  roll: 0.01,
  shift: DARK_SHIFT,
  lines: [
    { ppm: SOLVENT_PPM, height: 0.6 },
    { ppm: 6.9, height: 0.06, width: 0.012 },
    { ppm: 1.26, height: 0.3, width: 0.02 },
    ...withSatellites(PRODUCT_PPM, 0.14),
    { ppm: DECOY_PPM, height: 0.17 },
  ],
};

/** Map a trace onto an SVG polyline in a `width` × `height` box (y = 0 at the bottom, `top` at the top). */
export function polyline(values: readonly number[], width: number, height: number, top = 1, bottom = -0.05): string {
  const n = values.length;
  const sx = n > 1 ? width / (n - 1) : 0;
  const sy = height / (top - bottom);
  return values.map((v, i) => `${(i * sx).toFixed(1)},${(height - (Math.min(top, Math.max(bottom, v)) - bottom) * sy).toFixed(1)}`).join(' ');
}

/** Where a chemical shift falls across a span, as a fraction from the left edge. */
export const fraction = (ppm: number, span: Span): number => (span.from - ppm) / (span.from - span.to);
