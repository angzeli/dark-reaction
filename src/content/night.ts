/**
 * What the night does on its own: timed events, the pages you don't remember
 * writing, and what happens at 03:33. docs/DESIGN.md §5, §14.
 * Act I and Act II so far; Act III adds its own.
 */
import type { ActDef, EventDef, LightsOutRule, PhantomDef } from '../engine/types.ts';
import { EXIT_B_OPEN, PI_OPEN } from './world.ts';

const onLevel4 = { any: [{ at: 'office' as const }, { at: 'synth' as const }, { at: 'glovebox' as const }, { at: 'pi' as const }] };
/** The night's own spectrum is offered from Act II, once you have run yours. */
const offered = { all: [{ actGte: 2 as const }, { flag: 'ran.own' }] };

/** Act II opens at the 02:47 after the three Act I puzzles are solved (docs/DESIGN.md §8). */
export const ACTS: ActDef[] = [
  { act: 2, when: { all: [{ solved: 'tlc' }, { solved: 'glovebox' }, { solved: 'console' }, { know: 'nb.reset' }] }, title: 'act.2.title' },
];

export const EVENTS: EventDef[] = [
  // 02:50: Dan's email (21:50 in Boston). If you're elsewhere, it's waiting when you get back.
  { id: 'ev.mail', minute: 3, until: 30, if: { at: 'office' }, text: [{ key: 'ev.mail' }] },
  // 03:05: the porter's hoover, on its way to Dan's office for the Monday clean.
  { id: 'ev.hoover', minute: 18, until: 26, if: onLevel4, text: [{ key: 'ev.hoover' }] },
  // 03:28: the box passes 10 ppm.
  { id: 'ev.o2alarm', minute: 41, if: { at: 'glovebox' }, text: [{ key: 'ev.o2alarm' }] },
  // 03:30: holder 13 gets ready for a sample nobody has loaded.
  { id: 'ev.preparing', minute: 43, if: { at: 'nmr' }, text: [{ key: 'ev.preparing' }] },
  // 02:57: Femi, somewhere below, never seen.
  { id: 'ev.whistle', minute: 10, until: 20, if: { at: 'stairs' }, text: [{ key: 'ev.whistle' }] },
  // 03:15: Dan's office opens for the Monday clean.
  { id: 'ev.unlock', minute: PI_OPEN.from, until: PI_OPEN.to, if: { all: [onLevel4, { not: { at: 'pi' } }] }, text: [{ key: 'ev.unlock' }] },
  // 03:21: fire exit B is released for the bins.
  { id: 'ev.bins', minute: EXIT_B_OPEN.from, until: EXIT_B_OPEN.to, if: { at: 'stairs' }, text: [{ key: 'ev.bins' }] },
  // 03:25: the perfect spectrum, printed in the basement or mailed to your desk.
  {
    id: 'ev.perfect.nmr',
    minute: 38,
    if: { all: [offered, { at: 'nmr' }] },
    effects: [{ lflag: 'perfect.printed' }, { flag: 'perfect.offered' }],
    text: [{ key: 'ev.perfect.nmr' }],
  },
  {
    id: 'ev.perfect.office',
    minute: 38,
    if: { all: [offered, { at: 'office' }] },
    effects: [{ lflag: 'perfect.mail' }, { flag: 'perfect.offered' }],
    text: [{ key: 'ev.perfect.office' }],
  },
  // 03:31: every light in the building dims, once.
  { id: 'ev.dim', minute: 44, text: [{ key: 'ev.dim' }] },
];

export const PHANTOMS: PhantomDef[] = [
  { entry: 'ph.tea', when: { loopGte: 2 } },
  { entry: 'ph.three', when: { all: [{ loopGte: 3 }, { not: { solved: 'glovebox' } }] } },
  { entry: 'ph.all', when: { all: [{ loopGte: 3 }, { not: { solved: 'console' } }] } },
  { entry: 'ph.strike', when: { fudgedEver: true } },
  { entry: 'ph.door', when: { actGte: 2 } },
  {
    entry: 'ph.radium',
    when: { all: [{ actGte: 2 }, { loopsInActGte: 3 }, { not: { solved: 'cipher' } }, { any: [{ usedEver: 'pi.box' }, { usedEver: 'pi.notebook' }] }] },
  },
  { entry: 'ph.decay', when: { obsessionGte: 4 } },
  { entry: 'ph.decay2', when: { obsessionGte: 7 } },
];

/** Checked in order at 03:33; later acts put their rules (and the endings) first. */
export const LIGHTS_OUT: LightsOutRule[] = [
  { id: 'lo.first', if: { not: { know: 'nb.reset' } }, effects: [{ learn: 'nb.reset' }], text: [{ key: 'lo.first' }] },
];
