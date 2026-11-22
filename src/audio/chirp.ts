/**
 * Timing for the cryocooler's changed chirp (puzzle P8). Pure, so the
 * puzzle's LED and the audio play the same schedule, and tests can check it.
 */
export interface ChirpTiming {
  /** Seconds between chirps inside a group. */
  within: number;
  /** Seconds of silence between groups. */
  between: number;
  /** Seconds of silence before the cycle repeats. */
  cycle: number;
}

export const DEFAULT_CHIRP_TIMING: ChirpTiming = { within: 0.32, between: 1.3, cycle: 2.8 };

/** Start times (seconds) of every chirp in one cycle of the pattern, and the cycle length. */
export function chirpSchedule(groups: readonly number[], timing: ChirpTiming = DEFAULT_CHIRP_TIMING): { times: number[]; length: number } {
  const times: number[] = [];
  let t = 0;
  groups.forEach((count, g) => {
    if (!Number.isInteger(count) || count < 1) throw new Error(`Chirp group ${g} must be a positive integer`);
    for (let i = 0; i < count; i++) {
      times.push(Number(t.toFixed(3)));
      if (i < count - 1) t += timing.within;
    }
    t += g < groups.length - 1 ? timing.between : timing.cycle;
  });
  return { times, length: Number(t.toFixed(3)) };
}
