/**
 * The loop clock. Minute 0 is 02:47 and minute 46 is 03:33, when the lights
 * go out. All in-game time is counted in whole minutes since 02:47.
 */
export const LOOP_START_HOUR = 2;
export const LOOP_START_MINUTE = 47;
export const LOOP_LENGTH = 46;

/** Format a loop minute as a 24-hour clock label, e.g. 0 → "02:47", 46 → "03:33". */
export function clockLabel(minute: number): string {
  const clamped = Math.max(0, Math.floor(minute));
  const total = LOOP_START_HOUR * 60 + LOOP_START_MINUTE + clamped;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convert a clock label like "03:15" to a loop minute (28). */
export function minuteOf(label: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(label);
  if (!match) throw new Error(`Not a clock label: ${label}`);
  const total = Number(match[1]) * 60 + Number(match[2]);
  return total - (LOOP_START_HOUR * 60 + LOOP_START_MINUTE);
}

/** True once the clock has reached 03:33. */
export function isLightsOut(minute: number): boolean {
  return minute >= LOOP_LENGTH;
}
