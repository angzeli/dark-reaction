/**
 * What the night does on its own: timed events, the pages you don't remember
 * writing, and what happens at 03:33. docs/DESIGN.md §5, §14.
 * Act I for now; later acts add theirs.
 */
import type { EventDef, LightsOutRule, PhantomDef } from '../engine/types.ts';

const onLevel4 = { any: [{ at: 'office' as const }, { at: 'synth' as const }, { at: 'glovebox' as const }, { at: 'pi' as const }] };

export const EVENTS: EventDef[] = [
  // 02:50: Dan's email (21:50 in Boston). If you're elsewhere, it's waiting when you get back.
  { id: 'ev.mail', minute: 3, until: 30, if: { at: 'office' }, text: [{ key: 'ev.mail' }] },
  // 03:05: the porter's hoover, on its way to Dan's office for the Monday clean.
  { id: 'ev.hoover', minute: 18, until: 26, if: onLevel4, text: [{ key: 'ev.hoover' }] },
  // 03:28: the box passes 10 ppm.
  { id: 'ev.o2alarm', minute: 41, if: { at: 'glovebox' }, text: [{ key: 'ev.o2alarm' }] },
  // 03:30: holder 13 gets ready for a sample nobody has loaded.
  { id: 'ev.preparing', minute: 43, if: { at: 'nmr' }, text: [{ key: 'ev.preparing' }] },
  // 03:31: every light in the building dims, once.
  { id: 'ev.dim', minute: 44, text: [{ key: 'ev.dim' }] },
];

export const PHANTOMS: PhantomDef[] = [
  { entry: 'ph.tea', when: { loopGte: 2 } },
  { entry: 'ph.three', when: { all: [{ loopGte: 3 }, { not: { solved: 'glovebox' } }] } },
  { entry: 'ph.all', when: { all: [{ loopGte: 3 }, { not: { solved: 'console' } }] } },
  { entry: 'ph.strike', when: { fudgedEver: true } },
];

/** Checked in order at 03:33; later acts put their rules (and the endings) first. */
export const LIGHTS_OUT: LightsOutRule[] = [
  { id: 'lo.first', if: { not: { know: 'nb.reset' } }, effects: [{ learn: 'nb.reset' }], text: [{ key: 'lo.first' }] },
];
