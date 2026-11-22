/** Numbers from the lab that more than one piece of content needs (docs/DESIGN.md §9, §11). */

/** Glovebox oxygen: 1.8 ppm at 02:47, rising 0.2 ppm a minute (regeneration overdue). */
export const O2_START = 1.8;
export const O2_RATE = 0.2;
export const O2_LIMIT = 10;
export const o2At = (minute: number): number => Math.round((O2_START + O2_RATE * minute) * 10) / 10;

/** Your username on the departmental systems. */
export const USERNAME = 'ar4217';
